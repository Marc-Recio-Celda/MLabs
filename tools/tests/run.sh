#!/usr/bin/env bash
# Runs every axiom test, and reports every runnable check that has none.
#
#   bash tools/tests/run.sh [<axioms-file>]
#
# This is `AX-7`'s check: *a check is not adopted until a planted fault has been seen to
# fire it*. Before this existed, every plant lived in the commit that made it or nowhere,
# so "has this check ever been seen to fire" had no answer a command could give.
#
# A test file is `tools/tests/ax-<n>.sh` and proves ONE axiom's check with three cases:
#   1. an obvious plant, which must fire
#   2. a subtle plant — the same fault written the way the file itself is written — which
#      must also fire. ⚠️ This is the one that matters: a plant in the file's own style
#      reproduces the file's own blind spot, and a check that only catches case 1 is a
#      check that catches nothing anybody would actually write.
#   3. a negative control, which must STAY SILENT. Without it a check that fires on
#      everything passes both plants and looks perfect.
# Each test restores whatever it touched and says so.
#
# Exit 0 every test passed and every runnable check has one · 1 a test failed or a check
# has no test · 2 could not run, which is NOT a pass.
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
AX="${1:-$ROOT/AXIOMS.md}"
[ -f "$AX" ] || { echo "  tests: no axiom file at $AX"; exit 2; }
cd "$ROOT" || exit 2

# A test may legitimately invoke this harness — ax-7.sh does, because proving the
# harness fails when it should is the one plant nobody thinks to make. It names itself
# in MLABS_TESTS_SKIP so the run cannot re-enter it. The guard is the mechanism, not
# the discipline: the first version of ax-7.sh recursed until it was killed.
shopt -s nullglob
TESTS=()
for f in tools/tests/ax-*.sh; do
  case " ${MLABS_TESTS_SKIP:-} " in *" $(basename "$f") "*) continue ;; esac
  TESTS+=("$f")
done
[ ${#TESTS[@]} -gt 0 ] || { echo "  tests: no test files — refusing to call that clean"; exit 2; }

fail=0
echo "── running"
for t in "${TESTS[@]}"; do
  if out=$(bash "$t" 2>&1); then
    printf '  ✓ %-24s %s\n' "$(basename "$t")" "$(echo "$out" | tail -1)"
  else
    printf '  ✗ %-24s FAILED\n' "$(basename "$t")"
    echo "$out" | sed 's/^/      /'
    fail=1
  fi
done

# Coverage: every row whose Check begins with `$` is a check somebody relies on.
echo "── coverage"
missing=0
while read -r id; do
  n="${id#AX-}"
  if [ ! -f "tools/tests/ax-${n}.sh" ]; then
    echo "  ✗ $id has a runnable check and no test"
    missing=$((missing+1))
  fi
done < <(awk -F'|' '$6 ~ /^ `\$`/ {print $2}' "$AX" | grep -oE 'AX-[0-9]+')

total=$(awk -F'|' '$6 ~ /^ `\$`/' "$AX" | wc -l)
echo "  ${missing} of ${total} runnable checks have no test"

[ $fail -eq 0 ] && [ $missing -eq 0 ] && { echo "── clean"; exit 0; }
exit 1
