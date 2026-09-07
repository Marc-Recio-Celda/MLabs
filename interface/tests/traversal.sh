#!/usr/bin/env bash
# La prueba con planta de la contención del navegador.
#
#   bash interface/tests/traversal.sh [<puerto>]        desde la raíz del repositorio
#
# ⛔ `/api/file` recibe una RUTA del cliente, que es exactamente lo que `/api/skill` se negaba
# a hacer — *«un cliente que pudiera nombrar una ruta leería cualquier fichero que el servidor
# alcance»*. Un navegador no puede funcionar de otra forma, así que la contención pasa a ser
# la función, y esto es lo que la prueba.
#
# ⚠️ **La prueba se construye su propio terreno** — un directorio temporal con una nota real,
# un fichero que no es `.md`, y un enlace simbólico que sale — y su propio adaptador. No toca
# ninguna instancia, corre en cualquier máquina, y no depende de que exista un centro.
#
# `AX-7`, tres casos:
#   1. planta obvia    — `../../etc/passwd` y sus variantes
#   2. planta sutil    — **un symlink dentro del árbol que apunta fuera.** Es el que separa
#                        una comprobación sobre el TEXTO de la ruta de una sobre la ruta
#                        RESUELTA: el texto no lleva `..`, así que la primera lo sirve
#   3. control negativo — la nota real se abre, y el árbol la lista
#
# Sale 0 los tres pasan · 1 alguno falla · 2 no ha podido correr, que NO es un aprobado.
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PORT="${1:-8797}"
command -v curl >/dev/null || { echo "  traversal: hace falta curl"; exit 2; }

TMP="$(mktemp -d)" || { echo "  traversal: no puedo crear el terreno"; exit 2; }
trap 'kill "${PID:-0}" 2>/dev/null; rm -rf "$TMP"' EXIT

mkdir -p "$TMP/vault/sub"
printf '# Una nota real\n\nCon un cuerpo que se puede reconocer: PALABRA-TESTIGO.\n' \
  > "$TMP/vault/sub/nota.md"
printf '<h1>no soy markdown</h1>\n' > "$TMP/vault/sub/pagina.html"
printf 'SECRETO-FUERA-DEL-ARBOL\n' > "$TMP/secreto.txt"
printf '# fuera\n\nSECRETO-FUERA-DEL-ARBOL\n' > "$TMP/secreto.md"
# ⛔ El plante que importa: dentro del árbol, sin un solo `..` en su nombre.
ln -s "$TMP/secreto.md" "$TMP/vault/atajo.md" 2>/dev/null || {
  echo "  traversal: esta máquina no permite enlaces simbólicos — caso NO EJECUTADO"; exit 2; }
printf '{"title":"prueba","root":".","sources":[],"browse":["vault"]}\n' > "$TMP/adapter.json"

fails=0
ok() { [ "$2" = 1 ] && echo "  ✓ $1" || { echo "  ✗ $1${3:+$'\n      '$3}"; fails=$((fails+1)); }; }

python3 "$ROOT/interface/server.py" --port "$PORT" --adapter "$TMP/adapter.json" >/dev/null 2>&1 &
PID=$!
for _ in $(seq 1 40); do
  curl -fsS -o /dev/null "http://127.0.0.1:$PORT/api/tree" 2>/dev/null && break
  sleep 0.25
done
curl -fsS -o /dev/null "http://127.0.0.1:$PORT/api/tree" 2>/dev/null || {
  echo "  traversal: el servidor no ha levantado en el puerto $PORT"; exit 2; }

cuerpo() {
  curl -s "http://127.0.0.1:$PORT/api/file?path=$1" 2>/dev/null \
    | python3 -c 'import json,sys
try: d=json.load(sys.stdin)
except Exception: print(""); raise SystemExit
print(d.get("body","") if d.get("available") else "")'
}
sirve_el_secreto() { case "$(cuerpo "$1")" in *SECRETO-FUERA-DEL-ARBOL*) echo 1;; *) echo 0;; esac; }

echo
echo "1 · planta obvia — salir del árbol por las bravas"
for p in "../secreto.md" "../../etc/passwd" "/etc/passwd" "....//....//etc/passwd"; do
  b="$(cuerpo "$p")"
  ok "$(printf '%-30s' "$p")" "$([ -z "$b" ] && echo 1 || echo 0)" "sirvió ${#b} bytes"
done

echo
echo "2 · planta sutil — sin un solo .. en el nombre"
ok "un symlink que sale del árbol" "$([ "$(sirve_el_secreto "atajo.md")" = 0 ] && echo 1 || echo 0)" \
   "sirvió el fichero de fuera: la comprobación mira el texto, no la ruta resuelta"
b="$(cuerpo "sub/pagina.html")"
ok "un fichero real que no es .md" "$([ -z "$b" ] && echo 1 || echo 0)" "sirvió ${#b} bytes"
if curl -s "http://127.0.0.1:$PORT/api/tree" | grep -q 'atajo'; then
  ok "y el symlink tampoco aparece en el árbol" 0 "el árbol lo lista: anuncia una puerta que no abre"
else
  ok "y el symlink tampoco aparece en el árbol" 1
fi

echo
echo "3 · control negativo — lo que sí debe abrirse, se abre"
case "$(cuerpo "sub/nota.md")" in
  *PALABRA-TESTIGO*) ok "la nota real se abre" 1 ;;
  *) ok "la nota real se abre" 0 "no devolvió su cuerpo" ;;
esac
N="$(curl -s "http://127.0.0.1:$PORT/api/tree" \
     | python3 -c 'import json,sys; print(len(json.load(sys.stdin).get("files",[])))')"
ok "el árbol lista la nota (y sólo ella): $N" "$([ "${N:-0}" = 1 ] && echo 1 || echo 0)" \
   "esperaba 1 fichero navegable"

echo
[ "$fails" -ne 0 ] && { echo "  traversal: $fails comprobación(es) fallida(s)."; exit 1; }
echo "  traversal: los tres casos pasan."
