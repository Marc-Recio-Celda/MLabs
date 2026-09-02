#!/usr/bin/env bash
# AX-38 — an edit is finished when the rules the file cites still hold.
# Proves the COMPOSITION the axiom names: both reference tools over the files a diff
# touched. It adds no tool of its own — what it verifies is that the pair catches an
# edit whose citations went stale in either direction, axiom or clause.
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
printf '| ID | Status |\n|---|---|\n| **AX-1** | 🟢 | rule | PH-1 | `—` |\n' > "$TMP/ax.md"
printf '# P\n\n## PH-1 · Scalability\n\nText.\n' > "$TMP/ph.md"
both() {                                   # → 1 if either tool reports
  printf '%s\n' "$1" > "$TMP/f.md"
  bash "$ROOT/tools/axiom-refs.sh"  "$TMP/ax.md" MLabs "$TMP/f.md" >/dev/null 2>&1; a=$?
  bash "$ROOT/tools/clause-refs.sh" "$TMP/ph.md"       "$TMP/f.md" >/dev/null 2>&1; c=$?
  [ $a -eq 1 ] || [ $c -eq 1 ]
}

# 1 · obvious: the edit left an axiom citation pointing at a row that was retired.
both 'The edit keeps `AX-1` and still cites `AX-9`.' \
  || { echo "obvious plant (stale axiom citation) did not fire"; exit 1; }
# 2 · subtle: the CLAUSE citation went stale instead. Half a check catches only one of
#     these, reports clean, and the file goes on citing a clause that was renumbered.
both 'This serves `PH-1` and also `PH-7`.' \
  || { echo "subtle plant (stale clause citation) did not fire"; exit 1; }
# 3 · negative control: an edit whose citations all resolve must pass. A pair that
#     fires on a clean edit makes every commit a false alarm.
both 'This serves `PH-1` and obeys `AX-1`.' \
  && { echo "negative control fired — a clean edit was flagged"; exit 1; }

echo "3/3 · stale axiom fires · stale clause fires · clean edit stays silent"
