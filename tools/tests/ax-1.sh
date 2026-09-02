#!/usr/bin/env bash
# AX-1 — structure is public and depersonalised; state is private.
# Proves `tools/gate.sh` check 1 fires on a leak.
#
# ⚠️ It builds a throwaway repository in a temp directory and runs the REAL gate against
# it in `--staged` mode. It never touches the repository it lives in: a test that plants
# a leak into the working tree is one bad exit away from committing it. **The denylist
# lives outside that repository**, where the real one lives — inside it, the gate finds
# the terms in the denylist itself and every run looks like a hit.
#
# ⚠️ **The assertion is check 1's own hit list, not the exit code and not the term.**
# Two earlier versions of this test were wrong in two different ways, and both passed
# something: exit 1 is also what check 3 returns for a repo with no allowlist, and **the
# gate never prints the term it found** — printing the personal data into a log would be
# the leak. It reports `file:line`. This is `AX-7` catching its own author twice.
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
GATE="$ROOT/tools/gate.sh"
TMP="$(mktemp -d)"; REPO="$TMP/repo"; trap 'rm -rf "$TMP"' EXIT

mkdir -p "$REPO"
git -C "$REPO" init -q
git -C "$REPO" config user.email t@t; git -C "$REPO" config user.name t
printf '## HARD — a veto.\nZafiro\nTrastevere\n' > "$TMP/denylist.txt"

# Leaves check 1's hit list in $OUT, so check 3's allowlist complaint cannot be
# mistaken for a leak. ⚠️ It writes to a file rather than piping: the gate must run in
# the temp repository's own directory, and a function that both cd's and pipes is one
# more moving part in the thing everything else is verified against.
OUT="$TMP/hits"
leaks() {
  printf '%s\n' "$1" > "$REPO/doc.md"
  git -C "$REPO" add -A >/dev/null 2>&1
  cd "$REPO"
  bash "$GATE" --denylist "$TMP/denylist.txt" --staged > "$TMP/raw" 2>&1
  cd - >/dev/null
  sed -n '/personal data in files that would be published/,/^$/p' "$TMP/raw" > "$OUT"
}

# 1 · obvious: the term on its own, exactly as the denylist spells it.
leaks 'The Zafiro project ships on Friday.'
grep -q 'doc.md:1' "$OUT" || { echo "obvious plant did not fire"; exit 1; }

# 2 · subtle: the same term inside an address, which is how it actually escapes —
#     `@` and `-` read as word boundaries, so the address slips past a bare match.
leaks 'Write to owner-trastevere@example.org before the cut.'
grep -q 'doc.md:1' "$OUT" || { echo "subtle plant (term inside an address) did not fire"; exit 1; }

# 3 · negative control: a longer word that merely CONTAINS a denylist term.
#     A pattern with no closing boundary fires here, and a gate that fires on ordinary
#     words is switched off whole — which is why SOFT exists as a separate severity.
leaks 'The zafirolite mineral is unrelated to anything here.'
grep -q 'doc.md' "$OUT" && { echo "negative control fired — the gate matches inside words"; exit 1; }

echo "3/3 · obvious fires · address-embedded fires · substring stays silent"
