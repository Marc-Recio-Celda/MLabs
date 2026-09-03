#!/usr/bin/env bash
# AX-11 — every role keeps a log, created empty at the moment of hiring.
# Proves `tools/roles-check.sh` reports the two directions SEPARATELY, which is the
# whole point: a role with no log and a log with no role need different fixes.
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/skills/auditor" "$TMP/skills/ghost" "$TMP/logs"
printf '# auditor\n\n## Dismissal\n\nRetired when it stops changing what the operator does.\n' > "$TMP/skills/auditor/SKILL.md"
printf '# ghost\n\n## Dismissal\n\nSame.\n' > "$TMP/skills/ghost/SKILL.md"
: > "$TMP/logs/auditor.md"        # hired, log created empty — the correct state
: > "$TMP/logs/orphan.md"         # a log whose role does not exist
out="$(bash "$ROOT/tools/roles-check.sh" --skills "$TMP/skills" --logs "$TMP/logs" 2>&1)"

# 1 · obvious: a role that states a dismissal criterion and has no log.
grep -q 'ghost' <<<"$out" || { echo "obvious plant (role with no log) not reported"; exit 1; }
# 2 · subtle: the other direction — a log with no role behind it. A check that only
#     walks the skills never looks here, and reports clean while a dead role's log
#     goes on being counted by everything that reads the directory.
grep -q 'orphan' <<<"$out" || { echo "subtle plant (log with no role) not reported"; exit 1; }
# 3 · negative control: an EMPTY log is the correct state at hiring, not a defect.
#     A check that requires content flags every role on its first day.
grep -q 'auditor' <<<"$out" && { echo "negative control fired — an empty log was reported"; exit 1; }

echo "3/3 · role with no log · log with no role · empty log stays silent"
