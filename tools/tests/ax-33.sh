#!/usr/bin/env bash
# AX-33 — a rule that changes is followed to every artefact citing it.
# Proves the two halves the axiom names: the citation list is findable, and nothing is
# left pointing at a row that no longer exists.
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
printf '| ID | Status |\n|---|---|\n| **AX-1** | 🟢 | rule | PH-1 | `—` |\n' > "$TMP/ax.md"
printf 'This obeys `AX-1` and also `AX-9`.\n' > "$TMP/cites.md"
printf 'This obeys nothing in particular.\n' > "$TMP/quiet.md"

# 1 · obvious: the dependency list. Changing `AX-1` means reading this file, and the
#     grep is what turns *which files depend on this* into a command.
list="$(cd "$TMP" && grep -rln 'AX-1' . )"
grep -q 'cites.md' <<<"$list" || { echo "obvious: the citing file was not in the list"; exit 1; }
# 2 · subtle: the second half. `AX-9` was retired, so the citation resolves to nothing
#     — and the file still reads as current, which is the failure the axiom names.
bash "$ROOT/tools/axiom-refs.sh" "$TMP/ax.md" MLabs "$TMP/cites.md" >/dev/null 2>&1
[ $? -eq 1 ] || { echo "subtle: a citation of a retired row did not fire"; exit 1; }
# 3 · negative control: a file citing nothing is not a dependency. A list that includes
#     it makes the sweep unbounded and it stops being run.
grep -q 'quiet.md' <<<"$list" && { echo "negative control fired — a non-citing file was listed"; exit 1; }

echo "3/3 · dependency listed · retired citation fires · non-citing file stays silent"
