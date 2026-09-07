#!/usr/bin/env python3
"""MLabs & NEXUS Operations Interface Server.

Serves the operations centre cockpit with live polling and write layer.
Works standalone or connected to a NEXUS instance.

Usage:
    python3 server.py [--adapter /path/to/adapter.json] [--port 8770]

The adapter is given, never discovered — see find_default_adapter.
"""

import argparse
import gzip
import http.server
import importlib
import mimetypes
import json
import os
import re
import socketserver
import subprocess
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
        # ⛔ De dónde salen las métricas lo declara la instancia, nunca el motor
        # (`interface:AX-1`): aquí no hay ninguna ruta a ningún script.
        "metrics": data.get("metrics"),
        # ⛔ Qué se puede navegar lo declara la instancia. El motor no nombra ninguna raíz.
        "browse": data.get("browse") or [],
        "path": str(p)
    }


# ── el navegador ────────────────────────────────────────────────────────────────────────
#
# ⛔ Esto ensancha a propósito una regla que este mismo fichero escribió en `/api/skill`:
# *«se pide por NOMBRE… un cliente que pudiera nombrar una ruta leería cualquier fichero que
# el servidor alcance»*. `read_file` ES ese cliente, porque un navegador no puede funcionar
# de otra forma. Así que la contención deja de ser una precaución y pasa a ser la función.
#
# ⚠️ Y la contención es de UNA pieza, aquí, no repartida por las rutas: una comprobación que
# hay que acordarse de llamar es una comprobación que un día no se llama.

def _browse_roots(adapter):
    """Las raíces navegables, **declaradas por la instancia** (`interface:AX-1`)."""
    out = []
    for rel in adapter.get("browse") or []:
        d = (adapter["root"] / rel).resolve()
        if d.is_dir():
            out.append(d)
    return out


def _contained(adapter, rel):
    """La ruta pedida, resuelta y **dentro** de una raíz navegable, o `None`.

    ⛔ Se comprueba sobre la ruta YA RESUELTA, que es lo que neutraliza `../`, las rutas
    absolutas y **los enlaces simbólicos que salen** — el que se olvida, porque `resolve()`
    los sigue y una comprobación sobre el texto de la ruta no los ve.
    ⚠️ El allowlist es de extensión: `.md` y nada más. Una lista de lo prohibido siempre
    tiene un hueco; una de lo permitido no.
    """
    if not rel or not isinstance(rel, str):
        return None
    rel = urllib.parse.unquote(rel)           # `..%2f` es `../` una vez decodificado
    if "\x00" in rel or not rel.endswith(".md"):
        return None
    for raiz in _browse_roots(adapter):
        f = (raiz / rel.lstrip("/")).resolve()
        try:
            f.relative_to(raiz)               # lanza si cae fuera; no compara cadenas
        except ValueError:
            continue
        if f.is_file():
            return f
    return None


def _walk(raiz):
    """Los `.md` **realmente dentro** de `raiz`, resueltos.

    ⛔ `rglob` devuelve `raiz/atajo.md` para un enlace simbólico que apunta fuera, y
    `relative_to` sobre esa ruta sin resolver cae dentro siempre. Hay que resolver primero,
    igual que en `_contained` — y por eso las tres rutas pasan por aquí y no cada una por su
    cuenta. ⚠️ La primera versión de esto tenía la comprobación sólo en `_contained`, el
    árbol listaba el enlace, y **fue la prueba con planta la que lo encontró**, no la
    relectura.
    """
    for f in sorted(raiz.rglob("*.md")):
        try:
            real = f.resolve()
            real.relative_to(raiz)
        except (ValueError, OSError):
            continue
        if real.is_file():
            yield f, real


def tree(adapter):
    """Metadatos de cada `.md` navegable. **Sin cuerpos**: el árbol es barato, el texto no."""
    roots = _browse_roots(adapter)
    if not roots:
        return {"available": False,
                "why": "el adaptador no declara `browse`",
                "how": 'añade {"browse": ["93_Notebook", "01_KERNEL", …]} al adaptador'}
    files = []
    for raiz in roots:
        for f, real in _walk(raiz):
            title = ""
            try:
                with real.open(encoding="utf-8", errors="replace") as fh:
                    for _ in range(40):       # el `# ` suele estar arriba; no se lee entero
                        line = fh.readline()
                        if not line:
                            break
                        if line.startswith("# "):
                            title = line[2:].strip()
                            break
            except OSError:
                pass
            st = real.stat()
            files.append({"root": raiz.name, "path": str(f.relative_to(raiz)),
                          "title": title, "bytes": st.st_size, "mtime": int(st.st_mtime)})
    return {"available": True, "roots": [r.name for r in roots], "files": files}


def read_file(adapter, rel):
    f = _contained(adapter, rel)
    if not f:
        return {"available": False, "why": "fuera de lo navegable, o no es un .md que exista"}
    return {"available": True, "path": rel,
            "body": f.read_text(encoding="utf-8", errors="replace")}


def search(adapter, q, limit=200):
    """El `grep` que el operador corre fuera. Sobre las mismas raíces y nada más."""
    q = (q or "").strip()
    if len(q) < 2:
        return {"available": False, "why": "hacen falta al menos dos caracteres"}
    needle, hits = q.lower(), []
    for raiz in _browse_roots(adapter):
        for f, real in _walk(raiz):
            try:
                for n, line in enumerate(real.read_text(encoding="utf-8", errors="replace")
                                         .splitlines(), 1):
                    if needle in line.lower():
                        hits.append({"root": raiz.name, "path": str(f.relative_to(raiz)),
                                     "line": n, "text": line.strip()[:240]})
                        if len(hits) >= limit:
                            return {"available": True, "q": q, "hits": hits, "capped": True}
            except OSError:
                continue
    return {"available": True, "q": q, "hits": hits, "capped": False}


def metrics(adapter):
    """Lo que mide el script que el adaptador declara, **verbatim**.

    ⛔ El motor no recalcula ni una cifra. `interface:I3.1` lo dice en una línea — *el
    trabajo es una vista, no un parser* — y escribir un segundo parser es exactamente lo
    que hay que no hacer: dos cosas que cuentan lo mismo acaban discrepando y ninguna
    declara cuál gana (`MLabs:AX-20`).

    ⚠️ Sin `metrics` declarado devuelve `available: False` **y dice qué falta**, en vez de
    un objeto vacío que se lee como *cero* (`interface:AX-5`). Un tablero que enseña cero
    cuando lo que pasa es que no hay fuente es peor que uno vacío.
    """
    spec = adapter.get("metrics")
    if not spec:
        return {"available": False,
                "why": "el adaptador no declara `metrics`",
                "how": 'añade {"metrics": {"script": "<ruta>", "args": ["--json"]}} al adaptador'}
    script = (adapter["root"] / spec.get("script", "")).resolve()
    # ⛔ Sólo se ejecuta lo que el adaptador nombra. Ni la petición ni la query eligen nada.
    if not str(script).startswith(str(adapter["root"])) or not script.is_file():
        return {"available": False,
                "why": f"el script declarado no está o cae fuera de la raíz: {spec.get('script')!r}"}
    args = [str(a) for a in spec.get("args", ["--json"])]
    try:
        r = subprocess.run([sys.executable, str(script), *args], cwd=str(adapter["root"]),
                           capture_output=True, text=True, timeout=120)
    except (OSError, subprocess.SubprocessError) as e:
        return {"available": False, "why": f"{type(e).__name__}: {e}"}
    if r.returncode != 0:
        return {"available": False,
                "why": f"el script salió {r.returncode}",
                "stderr": (r.stderr or "").strip()[:400]}
    try:
        return {"available": True, "source": spec.get("script"), "data": json.loads(r.stdout)}
    except json.JSONDecodeError as e:
        return {"available": False, "why": f"el script no devolvió JSON: {e}"}


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


def recent_lines(adapter):
    """Rangos de líneas cambiadas hoy, por fichero del registro.

    Dos fuentes, unidas: lo que está sin commitear (`git diff HEAD`) y lo que entró en los
    commits de hoy (`git log --since=midnight -p`). ⛔ Se leen las cabeceras de hunk, no el
    contenido: `@@ -a,b +c,d @@` dice exactamente qué líneas del fichero NUEVO cambiaron, que
    es lo único que hace falta para cruzarlo con la línea de cada entrada.
    """
    root = adapter.get("root")
    if not root or not Path(root).is_dir():
        return {}
    out = {}
    try:
        top = subprocess.run(["git", "-C", str(root), "rev-parse", "--show-toplevel"],
                             capture_output=True, text=True, timeout=5)
        if top.returncode != 0:
            return {}                     # no es un repositorio; no es un error
        for args in (["diff", "HEAD", "--unified=0"],
                     ["log", "--since=midnight", "-p", "--unified=0"]):
            r = subprocess.run(["git", "-C", str(root), *args],
                               capture_output=True, text=True, timeout=15)
            if r.returncode != 0:
                continue
            current = None
            for ln in r.stdout.splitlines():
                if ln.startswith("+++ b/"):
                    current = ln[6:].strip()
                elif ln.startswith("@@") and current:
                    m = re.search(r"\+(\d+)(?:,(\d+))?", ln)
                    if m:
                        start = int(m.group(1))
                        n = int(m.group(2) or 1)
                        out.setdefault(current, []).append([start, start + max(n, 1) - 1])
    except (OSError, subprocess.SubprocessError):
        return {}
    return out


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
        # ⚠️ Comprimir NO es `interface:I1.5`, y no hay que confundirlo con haberlo hecho.
        # `I1.5` es que el cliente deje de reconstruir cada fila en cada cambio; esto sólo
        # reduce lo que viaja. Medido 2026-09-06 sobre un centro real: `/api/model` pesa
        # **1,86 MB** y **476 KB** comprimido — un 74 % menos por una rama de stdlib, y el
        # navegador ya pide `gzip` sin que nadie toque el cliente. La cota de `I1.5` sigue
        # siendo la que dice el plan; lo que baja aquí es el coste de cada latido hasta ahí.
        # ⛔ Con umbral: comprimir 200 bytes gasta más CPU de la que ahorra en red.
        GZIP_MIN = 4096

        def _send(self, code, body, ctype="application/json"):
            if isinstance(body, (dict, list)):
                body = json.dumps(body, ensure_ascii=False)
            payload = body.encode("utf-8")
            encoding = None
            if (len(payload) >= self.GZIP_MIN
                    and "gzip" in self.headers.get("Accept-Encoding", "")):
                payload = gzip.compress(payload, 6)
                encoding = "gzip"
            self.send_response(code)
            self.send_header("Content-Type", ctype)
            if encoding:
                self.send_header("Content-Encoding", encoding)
                # Sin esto una caché intermedia puede servir la versión comprimida a quien
                # no la pidió. Aquí no hay ninguna, y aun así se declara: la cabecera cuesta
                # nada y su ausencia es un fallo que sólo aparece cuando ya hay una.
                self.send_header("Vary", "Accept-Encoding")
            self.send_header("Content-Length", str(len(payload)))
            # ⛔ Aquí había `Access-Control-Allow-Origin: *`. La página se sirve desde este
            # mismo origen y todos sus `fetch` son relativos, así que CORS no le hacía falta
            # a nadie más que a un tercero: con esa cabecera, CUALQUIER web que el operador
            # abriera podía leerse el centro de operaciones entero. Un mismo origen no
            # necesita permiso; lo que la cabecera concedía era el permiso a los demás.
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(payload)

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
            elif path == "/api/recent":
                # Qué bloques del registro se han tocado hoy, leído de git. ⚠️ Es un EXTRA
                # sobre el estado que la entrada declara, nunca su sustituto: el estado
                # sobrevive a un recargado y cuenta lo que enrutó otro agente; esto sólo dice
                # «esto se movió hoy». Si el árbol no es un repositorio, devuelve vacío y la
                # vista no enseña la marca — degradar en silencio es correcto aquí porque la
                # información es un adorno, no un dato del que dependa nada.
                self._send(200, {"lines": recent_lines(adapter)})
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
            elif path == "/api/tree":
                self._send(200, tree(adapter))
            elif path == "/api/file":
                rel = urllib.parse.parse_qs(
                    self.path.split("?", 1)[1] if "?" in self.path else "").get("path", [""])[0]
                r = read_file(adapter, rel)
                self._send(200 if r.get("available") else 404, r)
            elif path == "/api/search":
                q = urllib.parse.parse_qs(
                    self.path.split("?", 1)[1] if "?" in self.path else "").get("q", [""])[0]
                self._send(200, search(adapter, q))
            elif path == "/api/metrics":
                # `interface:I3.1` — las firings de los roles son la única medida de la salud
                # del sistema, y eran lo único que esta interfaz no podía pintar. El script ya
                # las calculaba y nada las leía.
                self._send(200, metrics(adapter))
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

        # ⛔ `do_POST` y `do_PATCH` vivían aquí y se retiran 2026-09-07 por decisión del
        # operador: **la interfaz no escribe, en ninguna versión**. Sólo él edita su libreta,
        # y a mano. Sin manejadores, `BaseHTTPRequestHandler` contesta **501** a cualquier
        # método que no sea GET — que es la respuesta correcta y no una que haya que
        # mantener. ⚠️ Y es una garantía distinta de una comprobación: un servidor sin
        # superficie de escritura no puede escribir por un fallo, sólo por un cambio.

        def log_message(self, *args):
            pass

    return Handler


def main():
    ap = argparse.ArgumentParser(description="MLabs Operations Cockpit Server")
    ap.add_argument("--adapter", help="path to adapter JSON")
    ap.add_argument("--port", type=int, default=8770)
    # ⛔ Escuchaba en `0.0.0.0`, es decir en toda la red. Este programa sirve el contenido de
    # un centro de operaciones privado y no autentica a nadie — y el propio proyecto lo
    # escribió en su `definition.md`: «does not leave localhost at v1 or v2». El valor por
    # defecto pasa a ser el que el proyecto declaró.
    # ⚠️ Y la bandera existe porque algún día se va a querer abrir desde otro dispositivo, y
    # eso debe ser una decisión escrita en la orden, no un descuido en una constante. La
    # diferencia entre las dos cosas es esta línea.
    ap.add_argument("--host", default="127.0.0.1",
                    help="interfaz donde escuchar (por defecto sólo esta máquina). "
                         "0.0.0.0 la expone a toda la red SIN autenticación")
    args = ap.parse_args()

    adapter = load_adapter(args.adapter)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer((args.host, args.port), make_handler(adapter)) as httpd:
        print(f"\n⚡ MLabs & NEXUS Operations Cockpit")
        print(f"  URL:     http://localhost:{args.port}")
        print(f"  Adapter: {adapter.get('path') or 'Standalone'}")
        if args.host not in ("127.0.0.1", "localhost", "::1"):
            print(f"  ⚠️  ESCUCHANDO EN {args.host} — expuesto a la red y sin autenticación")
        print(f"  Ready for connections. (Ctrl+C to stop)\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
