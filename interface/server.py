#!/usr/bin/env python3
"""MLabs & NEXUS Operations Interface Server.

Serves the operations centre cockpit with live polling and write layer.
Works standalone or connected to a NEXUS instance.

Usage:
    python3 server.py [--adapter /path/to/adapter.json] [--port 8770]

The adapter is given, never discovered — see find_default_adapter.
"""

import argparse
import http.server
import importlib
import mimetypes
import json
import os
import re
import socketserver
import sys
import urllib.parse
from pathlib import Path

HERE = Path(__file__).resolve().parent
PAGE = HERE / "index.html"     # one page file; app.html was a byte-identical copy

UI = HERE / "ui"

# Try importing model if present
sys.path.insert(0, str(HERE / "model"))
try:
    import parse as model
except Exception as e:                       # the engine can serve a page without a
    model = None                             # model; it must never invent one
    _MODEL_ERROR = e
else:
    _MODEL_ERROR = None

try:
    import write as writer
except Exception as e:                       # ⚠️ a missing writer disables writing and
    writer = None                            # says so; it never degrades to pretending
    _WRITER_ERROR = e                        # a write happened (which is what the stub
else:                                        # endpoints below used to do).
    _WRITER_ERROR = None

# ⛔ Defined ONCE, in the model. A second copy here diverges, and then the same adapter is
# valid or invalid depending on whether an import succeeded — with nothing in the output
# saying which (`MLabs:AX-20`).
KINDS = set(model.KINDS) if model else set()


class AdapterError(Exception):
    """Raised with a message written for a person, never a stack trace."""


def find_default_adapter():
    """The adapter is given, never guessed.

    An earlier version searched three hard-coded paths inside an operations centre.
    That is the one thing this engine may not know (`interface:AX-1`, `D4`): a
    default root is the convenience that turns a generic program into one that runs
    on a single machine, and it makes the axiom's own check unable to tell the
    sanctioned default from a leak.

    An environment variable is fine — it is the operator naming their instance, not
    the engine assuming one.
    """
    env = os.environ.get("MLABS_ADAPTER")
    if env and Path(env).is_file():
        return Path(env)
    return None


def load_adapter(path):
    if path is None:
        default_path = find_default_adapter()
        if default_path:
            path = default_path
        else:
            return {
                "title": "MLabs & NEXUS Operations Cockpit",
                "root": HERE.parent,
                "sources": [],
                "path": None
            }

    p = Path(path).expanduser().resolve()
    if not p.is_file():
        raise AdapterError(f"Adapter not found: {p}")
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        raise AdapterError(f"Adapter is not valid JSON ({p}): {e}")

    root = (p.parent / data.get("root", ".")).resolve()
    sources = data.get("sources", [])
    return {
        "title": data.get("title", "Operations centre"),
        "root": root,
        "sources": sources,
        "path": str(p)
    }


def stamp(adapter):
    """Cheap change token for live sync polling."""
    if not adapter.get("sources"):
        return "standalone"
    bits = []
    for spec in adapter["sources"]:
        target_root = adapter["root"]
        if spec.get("root"):
            target_root = (target_root / spec["root"]).resolve()
        if spec.get("path"):
            f = target_root / spec["path"]
            if f.is_file():
                bits.append(f"{f}:{f.stat().st_mtime}")
        elif spec.get("glob"):
            for f in sorted(target_root.glob(spec["glob"])):
                if f.is_file():
                    bits.append(f"{f}:{f.stat().st_mtime}")
    return str(hash("|".join(bits)))


DOCTRINE_ROOT = Path(os.environ.get("MLABS_DOCTRINE_ROOT", HERE.parent))

# Which file answers which question, and the kind that reads it. The three levels of
# `AGENTS.md` §1 in the order a newcomer meets them.
DOCTRINE = [
    ("philosophy", "PHILOSOPHY.md", "philosophy"),
    ("axioms",     "AXIOMS.md",     "axioms"),
    ("agents",     "AGENTS.md",     "doc"),
    ("method",     "METHOD.md",     "doc"),
    ("flow",       "FLOW.md",       "doc"),
    ("readme",     "README.md",     "doc"),
]


def doctrine():
    """The structural files, parsed. A missing one is reported, never invented."""
    if not model:
        return {"entities": [], "problems": [{"why": f"the model failed to load: {_MODEL_ERROR}"}]}
    entities, problems = [], []
    for label, name, kind in DOCTRINE:
        f = DOCTRINE_ROOT / name
        if not f.is_file():
            problems.append({"file": str(f), "line": 0,
                             "why": f"the structural file {name} is not at the engine's root"})
            continue
        try:
            ents, probs = model.PARSERS[kind](f, f.read_text(encoding="utf-8"))
        except Exception as e:                    # a broken file loses its own page, never
            problems.append({"file": name, "line": 0, "why": str(e)})   # the whole view
            continue
        for e in ents:
            e["source"] = label
            e["file"] = name
        entities += ents
        problems += [dict(x) for x in probs]
    return {"root": str(DOCTRINE_ROOT), "entities": entities, "problems": problems}


def one_skill(adapter, name):
    """Un SKILL.md entero y los ficheros que lo acompañan.

    ⚠️ Los 19 SKILL.md de este repositorio suman 120 KB. Mandarlos en cada `/api/model`
    multiplicaría por veinte una respuesta que se pide cada dos segundos, para enseñar como
    mucho uno. Se pide el que se va a leer.
    """
    if not re.fullmatch(r"[A-Za-z0-9_-]{1,64}", name or ""):
        return {"error": "nombre de skill no válido"}
    for src in adapter.get("sources", []):
        if src.get("kind") != "skills":
            continue
        root = Path(adapter["root"])
        sroot = (root / src["root"]).resolve() if src.get("root") else root
        for f in sorted(sroot.glob(src.get("glob", ""))):
            if f.parent.name != name and f.stem != name:
                continue
            siblings = []
            for sib in sorted(f.parent.iterdir()):
                if sib.is_file() and sib != f and sib.suffix in (".md", ".txt"):
                    siblings.append({"name": sib.name,
                                     "body": sib.read_text(encoding="utf-8", errors="replace")})
            return {"name": name, "file": str(f.relative_to(sroot)),
                    "body": f.read_text(encoding="utf-8", errors="replace"),
                    "siblings": siblings}
    return {"error": f"ninguna fuente de skills declarada contiene {name!r}"}


def make_handler(adapter):
    class Handler(http.server.BaseHTTPRequestHandler):
        def _send(self, code, body, ctype="application/json"):
            if isinstance(body, (dict, list)):
                body = json.dumps(body, ensure_ascii=False)
            payload = body.encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(payload)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(payload)

        def do_OPTIONS(self):
            self.send_response(204)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.end_headers()

        def do_GET(self):
            path = self.path.split("?", 1)[0]
            if path in ("/", "/index.html", "/app.html"):
                if PAGE.is_file():
                    self._send(200, PAGE.read_text(encoding="utf-8"), "text/html; charset=utf-8")
                else:
                    self._send(404, "index.html not found", "text/plain")
            elif path == "/api/model":
                if model and adapter.get("path"):
                    try:
                        # Re-read from disk like everything else here does. Imported
                        # once at startup, an edited parser served a stale answer with
                        # nothing saying anything was wrong.
                        globals()['model'] = importlib.reload(model)
                        parsed = model.parse_adapter(adapter["path"])
                        self._send(200, parsed)
                    except Exception as e:
                        self._send(200, {"entities": [], "problems": [{"why": str(e)}]})
                else:
                    self._send(200, {"entities": [], "standalone": True})
            elif path == "/api/skill":
                # ⛔ Se pide por NOMBRE y se resuelve contra la fuente que el adaptador ya
                # declara. Un cliente que pudiera nombrar una ruta leería cualquier fichero
                # que el servidor alcance; uno que nombra una skill sólo alcanza las que la
                # instancia ha declarado. Es la misma regla que gobierna la escritura.
                name = urllib.parse.parse_qs(
                    self.path.split("?", 1)[1] if "?" in self.path else "").get("name", [""])[0]
                self._send(200, one_skill(adapter, name))
            elif path == "/api/doctrine":
                # ⛔ MLabs' own structural files, parsed rather than transcribed. The
                # engine ships INSIDE this repository, so `HERE.parent` is a structural
                # fact and not the guess `find_default_adapter` refuses to make: it is
                # the engine's own root, never an operations centre.
                #
                # ⚠️ The alternative was a copy of the philosophy inside the page, and
                # that copy had already drifted — describing a clause that no longer said
                # what the page claimed, and omitting one entirely, while looking
                # authoritative. `AX-20` names that failure and this endpoint is the fix.
                self._send(200, doctrine())
            elif path == "/api/trace":
                # What this session has written, so a confirmation is something the operator
                # can read back rather than a toast that has already faded.
                self._send(200, {"events": writer.read_journal(adapter) if writer else []})
            elif path == "/api/stamp":
                self._send(200, {"stamp": stamp(adapter)})
            else:
                # Serve static files relative to interface root
                rel_path = path.lstrip("/")
                f = (HERE / rel_path).resolve()
                if not f.is_file():
                    f = (UI / rel_path).resolve()

                if f.is_file() and (HERE in f.parents or UI in f.parents):
                    ctype = mimetypes.guess_type(f.name)[0] or "application/octet-stream"
                    if ctype.startswith("text/") or ctype in ("application/javascript", "application/json"):
                        ctype += "; charset=utf-8"
                    self._send(200, f.read_text(encoding="utf-8", errors="replace"), ctype)
                else:
                    self._send(404, f"Not found: {path}", "text/plain")

        # ⛔ The routes below used to answer `{"status": "ok"}` and touch nothing. That is
        # worse than no write layer at all: the interface reported success, the operator
        # believed the entry was filed, and `PH-3` was broken by the one component built to
        # uphold it. Every route here writes through `model/write.py` or fails out loud.
        def _writable(self):
            if writer is None:
                self._send(503, {"status": "error",
                                 "msg": f"the write layer failed to load: {_WRITER_ERROR}"})
                return None
            if not adapter.get("path"):
                self._send(409, {"status": "error",
                                 "msg": "no adapter is connected, so there is no file to "
                                        "write to. Start the server with --adapter."})
                return None
            return adapter

        def _wrote(self, kind, result, echo=None):
            writer.record(adapter, {"kind": kind, **result, **(echo or {})})
            self._send(200, {"status": "ok", "kind": kind, **result})

        def do_POST(self):
            path = self.path.split("?", 1)[0]
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"
            try:
                payload = json.loads(body)
            except Exception:
                payload = {}

            routes = {
                "/api/mailbox": ("mailbox", lambda a: writer.append_mailbox(
                    a, title=payload.get("title", ""), project=payload.get("project", "cross"),
                    destination=payload.get("destination", "decision"),
                    body=payload.get("body", ""), author=payload.get("author", "operator"),
                    state=payload.get("state", "open"))),
                "/api/idea": ("idea", lambda a: writer.append_idea(
                    a, title=payload.get("title", ""), body=payload.get("body", ""),
                    project=payload.get("project", "cross"),
                    scope=payload.get("scope", "general"),
                    author=payload.get("author", "operator"))),
                "/api/task": ("task", lambda a: writer.append_task(
                    a, title=payload.get("title", ""), project=payload.get("project", "cross"),
                    why=payload.get("why", ""), status=payload.get("status", "⬜"),
                    author=payload.get("author", "operator"))),
                "/api/plan/item": ("plan-item", lambda a: writer.append_plan_item(
                    a, text_=payload.get("text", ""), section=payload.get("section") or None,
                    ordered=payload.get("ordered", True),
                    author=payload.get("author", "operator"))),
            }
            if path not in routes:
                self._send(404, "Endpoint not found", "text/plain")
                return
            a = self._writable()
            if a is None:
                return
            kind, run = routes[path]
            if not str(payload.get("title") or payload.get("text") or "").strip():
                self._send(400, {"status": "error", "msg": "an entry with no text"})
                return
            try:
                self._wrote(kind, run(a))
            except writer.WriteError as e:
                self._send(400, {"status": "error", "msg": str(e)})
            except OSError as e:
                self._send(500, {"status": "error", "msg": f"could not write: {e}"})

        def do_PATCH(self):
            path = self.path.split("?", 1)[0]
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"
            try:
                payload = json.loads(body)
            except Exception:
                payload = {}
            if path != "/api/plan/item":
                self._send(404, "Endpoint not found", "text/plain")
                return
            a = self._writable()
            if a is None:
                return
            try:
                self._wrote("plan-route", writer.route_plan_item(
                    a, line=payload.get("line"), expect=payload.get("expect", ""),
                    outcome=payload.get("outcome", "")))
            except writer.Conflict as e:
                # 409, not 400: the caller's edit is fine and its view is stale. The office
                # reloads and retries; a 400 would tell it the request itself was wrong.
                self._send(409, {"status": "stale", "msg": str(e)})
            except writer.WriteError as e:
                self._send(400, {"status": "error", "msg": str(e)})
            except OSError as e:
                self._send(500, {"status": "error", "msg": f"could not write: {e}"})

        def log_message(self, *args):
            pass

    return Handler


def main():
    ap = argparse.ArgumentParser(description="MLabs Operations Cockpit Server")
    ap.add_argument("--adapter", help="path to adapter JSON")
    ap.add_argument("--port", type=int, default=8770)
    args = ap.parse_args()

    adapter = load_adapter(args.adapter)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("0.0.0.0", args.port), make_handler(adapter)) as httpd:
        print(f"\n⚡ MLabs & NEXUS Operations Cockpit")
        print(f"  URL:     http://localhost:{args.port}")
        print(f"  Adapter: {adapter.get('path') or 'Standalone'}")
        print(f"  Ready for connections. (Ctrl+C to stop)\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
