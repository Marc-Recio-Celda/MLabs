#!/usr/bin/env python3
"""The interface engine — serves a read-only view of an operations centre.

It knows the six document kinds and no instance. Every path, label and ordering
comes from the adapter handed in at startup; there is deliberately no default and
no discovery, because a default root is the convenience that becomes a hard-coded
path later.

    python3 server.py --adapter /path/to/adapter.json [--port 8765]

Standard library only. No build step, no install.
"""

import argparse
import http.server
import importlib
import mimetypes
import json
import os
import socketserver
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
PAGE = HERE / "app.html"
UI = HERE / "ui"

sys.path.insert(0, str(HERE / "model"))
import parse as model  # noqa: E402  — the model is a sibling, not a dependency

# The document kinds the engine understands. An adapter naming anything else is
# rejected at load, so a typo fails loudly instead of rendering an empty panel.
# ⚠️ Defined ONCE, in the model, and imported here. It was duplicated until
# 2026-08-18, and adding a kind to one copy made the server refuse to start on a
# valid adapter — two copies of one fact with no declared winner (MLabs:AX-20).
KINDS = set(model.KINDS)


class AdapterError(Exception):
    """Raised with a message written for a person, never a stack trace."""


def load_adapter(path):
    if path is None:
        raise AdapterError(
            "No adapter given.\n"
            "  The engine holds no instance of its own, so it cannot guess one.\n"
            "  Pass one:  python3 server.py --adapter <path-to-adapter.json>"
        )
    p = Path(path).expanduser()
    if not p.is_file():
        raise AdapterError(
            f"Adapter not found.\n"
            f"  Wanted: {p}\n"
            f"  Looked from: {Path.cwd()}\n"
            f"  Nothing else was searched — the engine does not discover instances."
        )
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        raise AdapterError(f"Adapter is not valid JSON.\n  File: {p}\n  {e}")

    root = (p.parent / data.get("root", ".")).resolve()
    if not root.is_dir():
        raise AdapterError(f"Adapter's root is not a directory.\n  Resolved to: {root}")

    sources = data.get("sources")
    if not sources:
        raise AdapterError(f"Adapter declares no sources.\n  File: {p}")

    for i, s in enumerate(sources):
        if "label" not in s:
            raise AdapterError(f"Source {i} has no label.\n  File: {p}")
        if s.get("kind") not in KINDS:
            raise AdapterError(
                f"Source {s['label']!r} has kind {s.get('kind')!r}.\n"
                f"  Known kinds: {', '.join(sorted(KINDS))}"
            )
        if not (s.get("path") or s.get("glob")):
            raise AdapterError(f"Source {s['label']!r} names neither a path nor a glob.")
    return {"title": data.get("title", "Operations centre"), "root": root,
            "sources": sources, "path": str(p)}


def resolve(root, spec):
    """Files for one source, confined to the adapter's root.

    A source is one path or a glob — the glob is what lets a view be assembled
    across notes rather than named file by file.
    """
    if spec.get("path"):
        candidates = [root / spec["path"]]
    else:
        candidates = sorted(root.glob(spec["glob"]))
    out = []
    for c in candidates:
        try:
            r = c.resolve()
        except OSError:
            continue
        # Confinement: an adapter cannot reach outside the root it declared.
        if root not in r.parents and r != root:
            continue
        out.append(r)
    return out


def read_sources(adapter):
    root = adapter["root"]
    view = []
    for spec in adapter["sources"]:
        files = resolve(root, spec)
        parts = []
        for f in files:
            try:
                parts.append({
                    "name": f.name,
                    "rel": str(f.relative_to(root)),
                    "mtime": f.stat().st_mtime,
                    "text": f.read_text(encoding="utf-8", errors="replace"),
                })
            except OSError as e:
                parts.append({"name": f.name, "rel": str(f), "mtime": 0,
                              "text": f"*(unreadable: {e})*"})
        view.append({
            "label": spec["label"],
            "kind": spec["kind"],
            "open": bool(spec.get("open", False)),
            "missing": not parts,
            "wanted": spec.get("path") or spec.get("glob"),
            "files": parts,
        })
    return view


def stamp(adapter):
    """Cheap change token: the client polls this, not the whole view."""
    bits = []
    for spec in adapter["sources"]:
        for f in resolve(adapter["root"], spec):
            try:
                bits.append(f"{f}:{f.stat().st_mtime}")
            except OSError:
                bits.append(f"{f}:0")
    return str(hash("|".join(bits)))


def make_handler(adapter):
    class Handler(http.server.BaseHTTPRequestHandler):
        def _send(self, code, body, ctype):
            payload = body.encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(payload)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(payload)

        def do_GET(self):
            path = self.path.split("?", 1)[0]
            if path == "/":
                if not PAGE.is_file():
                    self._send(500, f"app.html is missing beside {HERE}", "text/plain")
                    return
                self._send(200, PAGE.read_text(encoding="utf-8"), "text/html; charset=utf-8")
            elif path == "/api/model":
                # The typed model, which is what every view renders. /api/view below
                # stays for the raw text a detail pane shows on demand.
                try:
                    # Re-read the model from disk like everything else here does. It
                    # was imported once at startup until 2026-08-18, so editing the
                    # parser served a stale classification with no sign anything was
                    # wrong — the one failure mode this whole project exists to avoid.
                    global model
                    model = importlib.reload(model)
                    body = json.dumps(model.parse_adapter(adapter["path"]), ensure_ascii=False)
                except Exception as e:                      # a parser fault must not
                    body = json.dumps({"entities": [], "problems": [   # blank the page
                        {"path": str(adapter["path"]), "line": 0,
                         "why": f"the model could not be built: {e}", "text": ""}]})
                self._send(200, body, "application/json")
            elif path.startswith("/ui/"):
                f = (UI / path[4:]).resolve()
                if UI not in f.parents or not f.is_file():
                    self._send(404, "not found", "text/plain")
                    return
                ctype = mimetypes.guess_type(f.name)[0] or "text/plain"
                self._send(200, f.read_text(encoding="utf-8"), f"{ctype}; charset=utf-8")
            elif path == "/api/view":
                body = json.dumps({"title": adapter["title"], "sources": read_sources(adapter)})
                self._send(200, body, "application/json")
            elif path == "/api/stamp":
                self._send(200, json.dumps({"stamp": stamp(adapter)}), "application/json")
            else:
                self._send(404, "not found", "text/plain")

        def do_POST(self):
            # v1 is read-only by construction, not by convention. The write
            # boundary is enumerated in the project's axioms and no route
            # implements it yet.
            self._send(405, "read-only", "text/plain")

        def log_message(self, *args):
            pass  # the terminal stays readable; this is a viewer, not a service

    return Handler


def main():
    ap = argparse.ArgumentParser(description="Render an operations centre, read-only.")
    ap.add_argument("--adapter", help="path to the instance adapter (required)")
    ap.add_argument("--port", type=int, default=8765)
    args = ap.parse_args()

    try:
        adapter = load_adapter(args.adapter)
    except AdapterError as e:
        print(f"\n  Cannot start.\n\n  {e}\n", file=sys.stderr)
        return 2

    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", args.port), make_handler(adapter)) as httpd:
        print(f"  {adapter['title']}  ->  http://127.0.0.1:{args.port}")
        print(f"  reading {len(adapter['sources'])} sources under {adapter['root']}")
        print("  read-only. ctrl-c to stop.\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n  stopped.\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
