#!/usr/bin/env bash
# Every philosophy clause cited in prose resolves to a clause that exists.
#
#   bash tools/clause-refs.sh <philosophy-file> [files...]
#
# ⚠️ This closes an asymmetry that stood for as long as both files existed: every `AX-`
# citation was verified by tools/axiom-refs.sh and no `PH-` citation was verified by
# anything. A clause is cited far more widely than an axiom — skills, the binding, the
# method, the interface — and until this ran, a clause that was renamed, merged or
# renumbered left every one of those citations pointing at nothing, silently.
#
# PREMISES, and either one wrong makes every result meaningless:
#   A. Clause ids come from the `## PH-n · Name` headings of the file passed in, and from
#      nowhere else. Point it at the wrong philosophy and it reports live citations as dead.
#   B. Fenced code blocks are skipped. A pattern or an example is not a reference.
#
# TRAPS, each proven by a plant: a bare id has no backticks · a one-digit clause must not
# be read out of a two-digit one, which is what the trailing boundary is for · the
# philosophy file itself is skipped, because its own headings are definitions rather than
# citations.
# ⚠️ **This header names no literal id, on purpose.** The first version illustrated that
# trap with one and the tool reported its own comment — a check that cannot describe its
# own edge case without failing is one nobody will trust to describe anything else.
# Exit 0 clean · 1 unresolved citations · 2 could not run, which is NOT a pass.
set -uo pipefail
PH="$1"; shift
[ -f "$PH" ] || { echo "  clause-refs: no philosophy file at $PH"; exit 2; }
[ $# -gt 0 ] || { echo "  clause-refs: no files given"; exit 2; }
live=$(grep -oE "^## PH-[0-9]+" "$PH" | grep -oE "PH-[0-9]+" | sort -u)
[ -n "$live" ] || { echo "  clause-refs: no clause headings in $PH — refusing to call that clean"; exit 2; }
for f in "$@"; do
  [ -f "$f" ] || continue
  # ⚠️ The test directory is exempt, and the exemption is the point: a plant is a
  # citation of something that does not exist, written on purpose. Every fixture in
  # tools/tests/ would be reported here, and a check that fires on the files proving
  # it works is one that gets switched off. **One directory, stated, auditable** —
  # the same shape as the gate's declared exemptions.
  case "$f" in tools/tests/*|*/tools/tests/*) continue ;; esac
  [ "$f" -ef "$PH" ] && continue
  awk '/^```/{inb=!inb; print ""; next} inb{print ""; next} {print}' "$f" \
  | grep -noE "(^|[^A-Za-z0-9_:-])PH-[0-9]+" \
  | while IFS=: read -r ln m; do
      id=$(echo "$m" | grep -oE 'PH-[0-9]+')
      echo "$live" | grep -qx "$id" || echo "  ✗ $f:$ln cites $id — no such clause in $PH"
    done
done > /tmp/clause-refs.out
if [ -s /tmp/clause-refs.out ]; then
  cat /tmp/clause-refs.out
  echo "  clause-refs: $(wc -l < /tmp/clause-refs.out) unresolved citation(s)"
  exit 1
fi
echo "  clean — every clause cited in prose resolves to a heading in $PH"
exit 0
