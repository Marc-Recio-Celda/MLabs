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
import socketserver
import sys
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

        def do_POST(self):
            path = self.path.split("?", 1)[0]
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"
            try:
                payload = json.loads(body)
            except Exception:
                payload = {}

            if path == "/api/task":
                self._send(200, {"status": "ok", "msg": "Task recorded", "data": payload})
            elif path == "/api/idea":
                self._send(200, {"status": "ok", "msg": "Idea recorded", "data": payload})
            elif path == "/api/scratchpad":
                self._send(200, {"status": "ok", "msg": "Scratchpad saved"})
            else:
                self._send(404, "Endpoint not found", "text/plain")

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
