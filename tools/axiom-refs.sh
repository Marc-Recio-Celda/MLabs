#!/usr/bin/env bash
# Every axiom id cited in prose resolves to a row that exists in its department.
#
#   bash tools/axiom-refs.sh <axioms-file> <SCOPE> [files...]
#
# ⚠️ This replaced a two-clause check on 2026-09-01. While retired axioms stayed in the
# file as tombstones, "the id exists" and "the id is not retired" were separate searches
# and one plant proved only one of them. Retirement now removes the row, so a citation of
# a retired axiom IS a citation of a missing id: one search, one plant, no blind half.
#
# PREMISES, and either one wrong makes every result meaningless:
#   A. The file set must belong to THIS department. A bare id resolves to the department
#      the file lives in, so another department's list reports live citations as missing.
#   B. Fenced code blocks are skipped. A pattern or an example is not a reference, and a
#      check that fires on the file documenting the format is the cries-wolf failure.
#
# TRAPS, each proven by a plant: a bare id has no backticks · a scoped id is the same
# axiom and must resolve · a short id must not be read out of a longer one starting with
# it, because there is no \b between a letter and a digit · another scope is another
# department and is skipped.
# Exit 0 clean · 1 unresolved citations · 2 could not run, which is NOT a pass.
set -uo pipefail
AX="$1"; SCOPE="$2"; shift 2
[ -f "$AX" ] || { echo "  axiom-refs: no axiom file at $AX"; exit 2; }
[ $# -gt 0 ] || { echo "  axiom-refs: no files given"; exit 2; }
live=$(grep -oE "^\|[[:space:]]*\*\*AX-[0-9]+\*\*[[:space:]]*\|[[:space:]]*(🟢|🟡)" "$AX" \
       | grep -oE "AX-[0-9]+" | sort -u)
[ -n "$live" ] || { echo "  axiom-refs: no rows in $AX — refusing to call that clean"; exit 2; }
hits=0
for f in "$@"; do
  [ -f "$f" ] || continue
  [ "$f" = "$AX" ] && continue
  # strip fenced code blocks, keep line numbers
  awk '/^```/{inb=!inb; print ""; next} inb{print ""; next} {print}' "$f" \
  | grep -noE "(^|[^A-Za-z0-9_:-])(${SCOPE}:)?AX-[0-9]+" \
  | while IFS=: read -r ln m; do
      id=$(echo "$m" | grep -oE 'AX-[0-9]+')
      echo "$live" | grep -qx "$id" || echo "  ✗ $f:$ln cites $id — no such row in $AX"
    done
done > /tmp/axiom-refs.out
if [ -s /tmp/axiom-refs.out ]; then cat /tmp/axiom-refs.out; exit 1; fi
echo "  clean — every axiom id cited in prose resolves to a row in $AX"
