#!/usr/bin/env bash
# Does the gate's own pattern fire on every private name that exists?
#
#   tools/denylist-coverage.sh --denylist PATH --projects PATH [--depth N]
#
# The release gate answers "does anything on the list appear in what is published".
# This answers the question BEFORE that one, and it is the question a stale list gets
# wrong: **is the list still the set of names that exist.** Two real project names were
# missing on 2026-08-19 and the gate returned clean on both while its control fired —
# so the gate worked and its vocabulary did not.
#
# ⚠️ It asks the RIGHT question, and the obvious wrong one is *is the name on the list*.
# A term was on the list and still could not match the directory as spelled on disk,
# because a word boundary finds no edge between a letter and a digit. So this tests the
# gate's OWN PATTERN against the name as the filesystem spells it — never the list
# against itself. A check that reads the same list twice cannot fail.
#
# Exit 0 clean · 1 something is uncovered · 2 could not run, which is NOT a pass.
#
# ⚠️ This lived as a shell function inside a comment in the denylist for a day, which
# means it could be read and not run, and `structure-project` had no step that ran it —
# the gap that let a project be opened with no denylist entry. Prose is not a check.

set -uo pipefail

DENYLIST=""; PROJECTS=""; DEPTH=2
while [ $# -gt 0 ]; do
  case "$1" in
    --denylist) DENYLIST="${2:-}"; shift 2 ;;
    --projects) PROJECTS="${2:-}"; shift 2 ;;
    --depth)    DEPTH="${2:-}";    shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

[ -n "$DENYLIST" ] || DENYLIST="${MLABS_DENYLIST:-}"
if [ -z "$DENYLIST" ] || [ ! -f "$DENYLIST" ]; then
  echo "  coverage: no denylist given. Pass --denylist PATH or set MLABS_DENYLIST."
  echo "            Refusing to report a pass on a check that did not run."
  exit 2
fi

# The projects root is NOT defaulted and NOT guessed. Its conventional name is declared
# in exactly one place in this repository and it is not here: a script that knows where
# an instance keeps its work is a script that runs on one machine.
[ -n "$PROJECTS" ] || PROJECTS="${MLABS_PROJECTS:-}"
if [ -z "$PROJECTS" ] || [ ! -d "$PROJECTS" ]; then
  echo "  coverage: no projects root given. Pass --projects PATH or set MLABS_PROJECTS."
  echo "            The instance names its own roots; this does not know them."
  exit 2
fi

case "$DEPTH" in ''|*[!0-9]*) echo "  coverage: --depth takes a number." >&2; exit 2 ;; esac

sec() {
  sed -n "/^## $1/,/^## /p" "$DENYLIST" | grep -v '^#' | grep -v '^[[:space:]]*$' | paste -sd'|'
}

H=$(sec HARD)
[ -n "$H" ] || { echo "  coverage: the denylist has no HARD terms — that is not a pass."; exit 2; }
S=$(sec SOFT)

# `[0-9]*` before the closing boundary, exactly as the gate builds it. If these two
# patterns ever stop being the same expression, this check measures a gate nobody runs.
HARD="\\b(${H})[0-9]*\\b"
SOFT=""; [ -n "$S" ] && SOFT="\\b(${S})[0-9]*\\b"

# The NEVER LISTED section carries its own reasons, one indented word per line, so a
# deliberate omission does not come back as a finding every six months.
NEVER=$(sed -n '/^## NEVER/,$p' "$DENYLIST" | grep -oE '^#   [a-z0-9_-]+' | awk '{print $2}' | paste -sd'|')

found=0
while IFS= read -r d; do
  n="${d##*/}"
  case "$n" in _*) continue ;; esac          # scaffolding and templates are not projects
  echo "$n" | grep -qiE "$HARD" && continue
  [ -n "$SOFT" ] && echo "$n" | grep -qiE "$SOFT" && continue
  [ -n "$NEVER" ] && echo "$n" | grep -qiE "^($NEVER)$" && continue
  echo "  ✗ UNCOVERED: $n"
  found=1
done < <(find "$PROJECTS" -mindepth 1 -maxdepth "$DEPTH" -type d 2>/dev/null | sort -u)

if [ $found -eq 0 ]; then
  echo "  ✓ every name under the projects root is one the gate's pattern can see"
else
  echo
  echo "  Each name above is a private name the release gate cannot see. Add it to the"
  echo "  denylist — HARD if no ordinary sentence contains it, SOFT if it is also a"
  echo "  normal word — or to NEVER LISTED with the reason, and run this again."
fi
exit $found
