#!/usr/bin/env bash
# compact · job 2 · identifier class, SECOND clause:
#   an id that EXISTS but is ⚫ retired, and is cited as live.
#
#   bash retired-check.sh <axioms-file> <SCOPE> <PREFIX> [files...]
#
# ⚠️ TWO PREMISES, and getting either wrong makes every result meaningless:
#   A. The file set must belong to THIS department. A bare id resolves to the
#      department the file lives in — running the instance's ⚫ list over company
#      files reports every live company citation as retired. Not a pattern bug: a
#      wrong root, which is `instance-auditor`'s I1 in a new shape.
#   B. The search covers the OPERATIVE layer only. `## Notes` is where retirement is
#      discussed BY NAME, so a check that reads it fires on the file documenting it —
#      the cries-wolf failure the wikilink rule already had to be narrowed for.
#
# Format traps, each proven by a plant: bare (no backticks) · scoped `MLabs:AX-97` ·
# `AX-9` must not match inside `AX-97` (there is no \b between a letter and a digit) ·
# ANOTHER scope is ANOTHER axiom, so `NEXUS:AX-97` stays silent.
# Exit 0 clean · 1 hits · 2 could not run, which is NOT a pass.
set -uo pipefail
AX="$1"; SCOPE="$2"; PREFIX="$3"; shift 3
[ -f "$AX" ] || { echo "  retired-check: no axiom file at $AX"; exit 2; }
[ $# -gt 0 ] || { echo "  retired-check: no files given"; exit 2; }
retired=$(grep -oE "^\|[[:space:]]*\*\*${PREFIX}-[0-9]+\*\*[[:space:]]*\|[[:space:]]*⚫" "$AX" \
          | grep -oE "${PREFIX}-[0-9]+" | sort -u)
[ -n "$retired" ] || { echo "  retired-check: no ⚫ ids in $AX — this clause has nothing to find"; exit 2; }
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
ops=()
for f in "$@"; do
  [ -f "$f" ] || continue
  o="$tmp/$(echo "$f" | tr / _)"
  awk '/^## Notes/{stop=1} !stop{print} stop{print ""}' "$f" > "$o"   # operative layer only, line numbers preserved
  ops+=("$o:$f")
done
hits=0
for id in $retired; do
  pat="(^|[^A-Za-z0-9_:-])(${SCOPE}:)?${id}([^0-9]|\$)"
  for pair in "${ops[@]}"; do
    o="${pair%%:*}"; f="${pair#*:}"
    [ "$f" = "$AX" ] && continue
    out=$(grep -nE "$pat" "$o" 2>/dev/null)
    [ -n "$out" ] && { echo "$out" | sed "s|^|  ⚫ ${id} cited as live: ${f}:|"; hits=$((hits+1)); }
  done
done
[ "$hits" -eq 0 ] && { echo "  clean — no retired ${PREFIX}- id is cited as live in the operative layer"; exit 0; }
exit 1
