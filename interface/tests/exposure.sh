#!/usr/bin/env bash
# La prueba con planta de la exposición del servidor.
#
#   bash interface/tests/exposure.sh [<puerto>]        desde la raíz del repositorio
#
# `AX-7`: una comprobación no está adoptada hasta que se la ha visto fallar con una falta
# plantada. Tres casos, los mismos que usa `tools/tests/`:
#
#   1. planta obvia    — una petición desde otro origen. La respuesta NO puede traer
#                        `Access-Control-Allow-Origin`, o cualquier web que el operador abra
#                        puede leerse el centro entero.
#   2. planta sutil    — el bind. El servidor no puede contestar en una dirección de red;
#                        `definition.md` del proyecto dice «does not leave localhost».
#   3. control negativo — desde `127.0.0.1` todo sigue funcionando. Sin él, un servidor que
#                        no arranca pasaría los dos primeros y parecería perfecto.
#
# Sale 0 los tres pasan · 1 alguno falla · 2 no ha podido correr, que NO es un aprobado.
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PORT="${1:-8799}"
SRV="$ROOT/interface/server.py"
[ -f "$SRV" ] || { echo "  exposure: no hay server.py en $SRV"; exit 2; }
command -v curl >/dev/null || { echo "  exposure: hace falta curl"; exit 2; }

fails=0
ok() { [ "$2" = 1 ] && echo "  ✓ $1" || { echo "  ✗ $1${3:+$'\n      '$3}"; fails=$((fails+1)); }; }

python3 "$SRV" --port "$PORT" >/dev/null 2>&1 &
PID=$!
trap 'kill "$PID" 2>/dev/null' EXIT
for _ in $(seq 1 40); do
  curl -fsS -o /dev/null "http://127.0.0.1:$PORT/api/doctrine" 2>/dev/null && break
  sleep 0.25
done
curl -fsS -o /dev/null "http://127.0.0.1:$PORT/api/doctrine" 2>/dev/null || {
  echo "  exposure: el servidor no ha levantado en el puerto $PORT"; exit 2; }

echo
echo "1 · planta obvia — otra web no puede leerse el centro"
H="$(curl -s -D - -o /dev/null -H "Origin: https://evil.example" \
      "http://127.0.0.1:$PORT/api/doctrine" 2>/dev/null)"
echo "$H" | grep -qi "access-control-allow-origin" \
  && ok "sin Access-Control-Allow-Origin" 0 "$(echo "$H" | grep -i access-control | tr -d '\r')" \
  || ok "sin Access-Control-Allow-Origin" 1
printf '%s' "$H" | head -1 | grep -q "200" \
  && ok "y la petición se sirve igual (la política la aplica el navegador)" 1 \
  || ok "y la petición se sirve igual (la política la aplica el navegador)" 0 "$(printf '%s' "$H" | head -1)"

echo
echo "2 · planta sutil — el bind, que es lo que el review no miró"
# ⚠️ Se mira el SOCKET, no una conexión: un contenedor sin dirección de red enrutable haría
# pasar por bueno un `0.0.0.0` sólo porque no hay nadie desde quien probarlo. `/proc/net/tcp`
# dice a qué interfaz se ató, que es la pregunta de verdad.
#   00000000 = 0.0.0.0, toda la red · 0100007F = 127.0.0.1, sólo esta máquina · 0A = LISTEN
RC2=0
if [ -r /proc/net/tcp ]; then
  HEXPORT="$(printf '%04X' "$PORT")"
  BIND="$(awk -v p=":$HEXPORT" '$4=="0A" && index($2,p)' /proc/net/tcp | awk '{print $2}' | cut -d: -f1 | head -1)"
  if [ -z "$BIND" ]; then
    echo "  ⊘ no encuentro el socket del puerto $PORT en /proc/net/tcp — caso NO EJECUTADO"
    RC2=2
  elif [ "$BIND" = "00000000" ]; then
    ok "atado sólo a esta máquina" 0 "atado a 0.0.0.0 — expuesto a toda la red, sin autenticación"
  else
    ok "atado sólo a esta máquina (0x$BIND)" 1
  fi
else
  echo "  ⊘ sin /proc/net/tcp — caso NO EJECUTADO"
  RC2=2
fi
IP="$(ip -4 -o addr show scope global 2>/dev/null | awk '{print $4}' | cut -d/ -f1 | head -1)"
if [ -n "$IP" ]; then
  curl -fsS -m 3 -o /dev/null "http://$IP:$PORT/api/doctrine" 2>/dev/null \
    && ok "y no contesta en $IP" 0 "contestó desde la red" \
    || ok "y no contesta en $IP" 1
fi

echo
echo "3 · control negativo — desde esta máquina todo sigue"
B="$(curl -fsS -m 5 "http://127.0.0.1:$PORT/api/doctrine" 2>/dev/null)"
printf '%s' "$B" | grep -q '"entities"' \
  && ok "/api/doctrine sigue devolviendo el modelo" 1 \
  || ok "/api/doctrine sigue devolviendo el modelo" 0 "devolvió ${#B} bytes"
curl -fsS -m 5 -o /dev/null "http://127.0.0.1:$PORT/" 2>/dev/null \
  && ok "la página sigue sirviéndose" 1 || ok "la página sigue sirviéndose" 0

echo
if [ "$fails" -ne 0 ]; then echo "  exposure: $fails comprobación(es) fallida(s)."; exit 1; fi
if [ "${RC2:-0}" -eq 2 ]; then
  echo "  exposure: un caso no ha podido ejecutarse. ⚠️ No ejecutado no es aprobado (\`AX-22\`)."
  exit 2
fi
echo "  exposure: los tres casos pasan."
