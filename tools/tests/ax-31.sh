#!/usr/bin/env bash
# AX-31 — a reference names its target and carries its scope.
# Proves `tools/axiom-refs.sh` resolves citations against the rows that exist.
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
printf '| ID | Status |\n|---|---|\n| **AX-1** | 🟢 | rule | PH-1 | `—` |\n| **AX-9** | 🟢 | rule | PH-3 | `—` |\n' > "$TMP/ax.md"
run() { printf '%s\n' "$1" > "$TMP/f.md"; bash "$ROOT/tools/axiom-refs.sh" "$TMP/ax.md" MLabs "$TMP/f.md" >/dev/null 2>&1; }

# 1 · obvious: a citation of a row that does not exist.
run 'See `AX-77` for the rest.'; [ $? -eq 1 ] \
  || { echo "obvious plant (missing id) did not fire"; exit 1; }
# 2 · subtle: a SCOPED citation of a missing row. A pattern that only matches bare ids
#     passes this, and a scoped id is the same axiom — it is how a citation looks the
#     moment it leaves its own file, which is most of them.
run 'The narrower loses (`MLabs:AX-77`).'; [ $? -eq 1 ] \
  || { echo "subtle plant (scoped missing id) did not fire"; exit 1; }
# 3 · negative control: a fenced example must stay silent. A check that fires on the
#     file documenting the format is the cries-wolf failure.
run '```
AX-77 is an example of the id format
```'; [ $? -eq 0 ] \
  || { echo "negative control fired — a fenced example was read as a citation"; exit 1; }

echo "3/3 · bare missing id fires · scoped missing id fires · fenced example stays silent"
