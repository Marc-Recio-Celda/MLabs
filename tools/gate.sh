#!/usr/bin/env bash
# The release gate, runnable by anything: a human, a hook, CI, or an agent that has
# never read a word of this method.
#
# It exists because an instruction is not a guarantee. Every leak this repository has
# had was written by someone who had the rule in front of them — a model, an agent, or
# the operator at the end of a long day. The rule did not stop them; this does.
#
#   tools/gate.sh [--denylist PATH] [--staged]
#
# --staged checks the index (what a commit is about to contain) instead of HEAD's
# tracked set. That is the mode a pre-commit hook wants.
#
# Exit 0 clean · 1 a check failed · 2 the gate could not run, which is NOT a pass.

set -uo pipefail
cd "$(git rev-parse --show-toplevel)" || exit 2

DENYLIST=""; MODE="tracked"
while [ $# -gt 0 ]; do
  case "$1" in
    --denylist) DENYLIST="$2"; shift 2 ;;
    --staged)   MODE="staged"; shift ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

# The denylist is a list of names, so it is personal data and lives instance-side.
# This script never guesses where: it is told, or it says it was not.
[ -n "$DENYLIST" ] || DENYLIST="${MLABS_DENYLIST:-}"
if [ -z "$DENYLIST" ] || [ ! -f "$DENYLIST" ]; then
  echo "  gate: no denylist given."
  echo "        Pass --denylist PATH or set MLABS_DENYLIST."
  echo "        Refusing to report a pass on a check that did not run."
  exit 2
fi

if [ "$MODE" = staged ]; then
  mapfile -t FILES < <(git diff --cached --name-only --diff-filter=ACMR)
else
  mapfile -t FILES < <(git ls-files)
fi
[ ${#FILES[@]} -gt 0 ] || { echo "  gate: nothing to check."; exit 0; }

PATTERN=$(grep -v '^#' "$DENYLIST" | grep -v '^[[:space:]]*$' | paste -sd'|')
[ -n "$PATTERN" ] || { echo "  gate: the denylist is empty — that is not a pass."; exit 2; }

fail=0

# 1 · Personal data in what is public. The founding axiom.
if hits=$(grep -rHniE "\b(${PATTERN})\b" -- "${FILES[@]}" 2>/dev/null); then  # gate:allow the gate must name what it forbids
  echo "  ✗ personal data in files that would be published:"
  echo "$hits" | awk -F: '{print "      " $1 ":" $2}' | sort -u | head -20
  echo "$hits" | wc -l | xargs printf "      (%s hits)\n"
  fail=1
fi

# 2 · Paths BELOW an instance's root, inside the public structure. The denylist cannot
#     catch these: the operations centre's name is deliberately absent from it, being
#     vocabulary and not a person.
#
#     The line this draws is the one AGENTS.md §2 draws: naming the role and its
#     conventional root is vocabulary and is allowed; naming anything *below* that root
#     — a folder, a project, a file — is not. So the bare root in a diagram passes,
#     and a full path to a file inside it does not. This is the only check standing
#     between a debugging shortcut and a program that runs on exactly one machine.
#     ⚠️ Exemptions exist and are DELIBERATELY visible. A gate with no escape hatch
#     gets switched off whole the first time it blocks something legitimate, so a line
#     may carry `gate:allow <reason>` — and every one is printed on every run. An
#     exemption you can list is a debt; an exemption you cannot see is a hole.
if hits=$(grep -rHnE '(^|[^A-Za-z_])(99_SYSTEM|98_PROJECTS|0[1-8]_[A-Z][a-zA-Z]*/)' -- "${FILES[@]}" 2>/dev/null); then  # gate:allow a pattern must contain what it matches
  real=$(echo "$hits" | grep -v 'gate:allow')
  allowed=$(echo "$hits" | grep 'gate:allow')
  if [ -n "$real" ]; then
    echo "  ✗ paths below an instance's root, inside the public structure:"
    echo "$real" | awk -F: '{print "      " $1 ":" $2}' | sort -u | head -20
    fail=1
  fi
  if [ -n "$allowed" ]; then
    echo "  ! $(echo "$allowed" | wc -l) exempted line(s), carried as declared debt:"
    echo "$allowed" | sed -E 's/^([^:]+:[0-9]+).*gate:allow *(.*)$/      \1 — \2/' | sort -u
  fi
fi

# 3 · The tracked set is exactly the allowlist — BOTH directions. A surplus file is a
#     leak; a `!` line with nothing behind it is scaffolding. Until 2026-08-19 only the
#     second was checked, so a private file force-added past .gitignore passed with a
#     green tick — the one failure mode with nothing else behind it.
while read -r f; do
  [ -n "$f" ] || continue
  keep=0
  while read -r line; do
    path="${line#\!/}"; path="${path%/\*\*}"
    [ -n "$path" ] || continue
    case "$f" in "$path"|"$path"/*) keep=1; break ;; esac
  done < <(grep '^!/' .gitignore 2>/dev/null)
  if [ $keep -eq 0 ]; then
    echo "  ✗ tracked but named by no allowlist line: $f"
    fail=1
  fi
done < <(git ls-files)
# 3 · The tracked set is exactly the allowlist. A surplus file is a leak; a `!` line
#     with nothing behind it is scaffolding.
while read -r line; do
  path="${line#\!/}"; path="${path%/\*\*}"
  [ -n "$path" ] || continue
  if [ "$(git ls-files -- "$path" | wc -l)" -eq 0 ]; then
    echo "  ✗ allowlist names '$path' and nothing tracked is behind it"
    fail=1
  fi
done < <(grep '^!/' .gitignore 2>/dev/null)

if [ $fail -eq 0 ]; then
  echo "  ✓ gate clean over ${#FILES[@]} files (${MODE})"
else
  echo
  echo "  The gate blocked this. Nothing is wrong with wanting the change —"
  echo "  what is wrong is the data travelling with it. Move the instance's names"
  echo "  and paths into its adapter or its own repository, then run this again."
fi
exit $fail
