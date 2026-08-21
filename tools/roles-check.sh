#!/usr/bin/env bash
# A role is a skill plus a log plus a dismissal criterion (`METHOD.md` §5, `AX-11`).
# That definition claims to be observable, so this observes it.
#
#   tools/roles-check.sh --skills <dir> --logs <dir>
#
# The two sets must be the SAME SET:
#   · skills whose `SKILL.md` carries `## Dismissal`
#   · files in the instance's employee-log directory
# A name in one and not the other is a role that is half-hired, and which half is
# missing changes what to do about it — so both directions are reported separately.
#
# Exit 0 they match · 1 they do not · 2 could not run, which is NOT a pass.
#
# ⚠️ WHY THIS IS NOT A GREP FOR `## Dismissal`. It was, until 2026-08-21, and it
# measured the wrong set: the heading returned 6 of 19 skills, of which two were not
# roles and one was a dispatcher. **One word carried three meanings** — a role's firing
# criterion, a skill's retirement condition, and a section added to satisfy the grep
# itself. Counting headings made a mostly-correct system read as 68 % non-compliant and
# hid the two real gaps underneath the noise. The vocabulary was split in the same act:
# `## Dismissal` ends a ROLE and requires a log; `## Retirement` ends a SKILL and
# requires neither. **This check only works because the words were separated first**,
# and if a third meaning attaches to either heading it stops working again.

set -uo pipefail

SKILLS=""; LOGS=""
while [ $# -gt 0 ]; do
  case "$1" in
    --skills) SKILLS="${2:-}"; shift 2 ;;
    --logs)   LOGS="${2:-}";   shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

# Neither root is guessed. The skills live with the method, the logs live with the
# instance, and a script that knows where an instance keeps its logs runs on one machine.
if [ -z "$SKILLS" ] || [ ! -d "$SKILLS" ]; then
  echo "  roles: no skills directory given. Pass --skills PATH."
  echo "         Refusing to report a pass on a check that did not run."
  exit 2
fi
if [ -z "$LOGS" ] || [ ! -d "$LOGS" ]; then
  echo "  roles: no logs directory given. Pass --logs PATH."
  echo "         It lives with the instance; this does not know where."
  exit 2
fi

declared=$(grep -l '^## Dismissal' "$SKILLS"/*/SKILL.md 2>/dev/null \
           | while read -r f; do basename "$(dirname "$f")"; done | sort -u)
logged=$(find "$LOGS" -maxdepth 1 -name '*.md' -type f 2>/dev/null \
         | while read -r f; do basename "$f" .md; done | grep -vx 'README' | sort -u)

if [ -z "$declared" ] && [ -z "$logged" ]; then
  echo "  roles: no skill declares a dismissal criterion and no log exists."
  echo "         That is an instance with no roles hired, not a passing check."
  exit 2
fi

no_log=$(comm -23 <(echo "$declared") <(echo "$logged"))
no_crit=$(comm -13 <(echo "$declared") <(echo "$logged"))

fail=0
if [ -n "$no_log" ]; then
  echo "  ✗ a dismissal criterion with no log — hired on paper, accountable nowhere:"
  echo "$no_log" | sed 's/^/      /'
  echo "      Either the role has never fired and the log is created on its first firing,"
  echo "      or it has fired and left no trace. Those are different problems; say which."
  fail=1
fi
if [ -n "$no_crit" ]; then
  echo "  ✗ a log with no dismissal criterion — accountable, and impossible to fire:"
  echo "$no_crit" | sed 's/^/      /'
  echo "      A role that cannot be dismissed is a cost with no exit (AX-11). The"
  echo "      threshold is the operator's to fix, and it is fixed BEFORE the next firing."
  fail=1
fi

[ $fail -eq 0 ] && echo "  ✓ $(echo "$declared" | wc -l | tr -d ' ') role(s), each with a criterion and a log"
exit $fail
