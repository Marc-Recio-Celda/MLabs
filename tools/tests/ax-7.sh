#!/usr/bin/env bash
# AX-7 — a check is not adopted until a planted fault has been seen to fire it.
# Proves the harness itself fails when it should. A test runner that reports green
# whatever happens is the purest form of the failure this axiom names, and it is the
# one nobody thinks to plant against.
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"; rm -f "$ROOT/tools/tests/ax-99999.sh"' EXIT

# 1 · obvious: a test file that fails. The harness must exit non-zero.
printf '#!/usr/bin/env bash\necho "deliberate failure"\nexit 1\n' > "$ROOT/tools/tests/ax-99999.sh"
( cd "$ROOT" && MLABS_TESTS_SKIP="ax-7.sh" bash tools/tests/run.sh >/dev/null 2>&1 )
[ $? -ne 0 ] || { echo "obvious plant (a failing test) did not fail the harness"; exit 1; }
rm -f "$ROOT/tools/tests/ax-99999.sh"

# 2 · subtle: a runnable check with no test at all. This is the half a harness usually
#     misses — every test it CAN see passes, so it reports green over a set it never
#     looked at, which is coverage collapsing while accuracy holds.
printf '| ID | Status |\n|---|---|\n| **AX-1** | 🟢 | rule | PH-1 | `$` `some command` |\n' > "$TMP/ax.md"
printf '| **AX-88888** | 🟢 | rule | PH-1 | `$` `another command` |\n' >> "$TMP/ax.md"
( cd "$ROOT" && MLABS_TESTS_SKIP="ax-7.sh" bash tools/tests/run.sh "$TMP/ax.md" >/dev/null 2>&1 )
[ $? -ne 0 ] || { echo "subtle plant (a runnable check with no test) was not reported"; exit 1; }

# 3 · negative control: an axiom file whose only runnable checks are tested must pass.
#     A harness that fails on everything is as useless as one that passes on everything.
printf '| ID | Status |\n|---|---|\n| **AX-1** | 🟢 | rule | PH-1 | `$` `some command` |\n' > "$TMP/ok.md"
( cd "$ROOT" && MLABS_TESTS_SKIP="ax-7.sh" bash tools/tests/run.sh "$TMP/ok.md" >/dev/null 2>&1 )
[ $? -eq 0 ] || { echo "negative control fired — a fully covered set was reported as failing"; exit 1; }

echo "3/3 · failing test fails the run · untested check reported · covered set passes"
