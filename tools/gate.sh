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

# The denylist has two severities and this gate reads BOTH, differently.
#   ## HARD — a veto. Any hit fails the gate.
#   ## SOFT — project names that are also ordinary words. Reported, never blocking:
#            listing them as HARD makes the gate fire on every legitimate use of the
#            word, and a gate that cries wolf is switched off whole.
#   ## SIGNATURE — the declared authorship claim. See below; it is a WIDENING, so it
#            is read more carefully than the other two.
# A file with no section headings is read entirely as HARD, which is what every
# denylist written before the sections existed is.
terms()   { sed -n "/^## $1/,/^## /p" "$DENYLIST" | grep -v '^#' | grep -v '^[[:space:]]*$'; }
section() { terms "$1" | paste -sd'|'; }
if grep -q '^## HARD' "$DENYLIST"; then
  HARD=$(section HARD); SOFT=$(section SOFT)
else
  HARD=$(grep -v '^#' "$DENYLIST" | grep -v '^[[:space:]]*$' | paste -sd'|'); SOFT=""
fi
PATTERN="$HARD"
[ -n "$PATTERN" ] || { echo "  gate: the denylist has no HARD terms — that is not a pass."; exit 2; }

# `[0-9]*` before the closing boundary: a term ending in a version number escapes a
# bare  match, so a name on the list could still be invisible. Proven against a plant.
HARD_RE="\\b(${PATTERN})[0-9]*\\b"

# ── the signature carve-out (`MLabs:AX-1`) ──────────────────────
# A leak is personal data that travels because someone forgot. A signature travels
# because someone decided. The axiom now permits the second, and this is where the
# permission is *implemented* — which means implemented NARROWLY, because a widening
# written loosely is how a gate acquires the one place it does not look.
#
# Scoped twice, and both scopes must hold:
#   by PATH — only the files the `# files:` line names, matched exactly, not by glob.
#   by TERM — only the terms under `## SIGNATURE`. Every OTHER hard term still blocks
#             inside those files, exactly as it does anywhere else. A signature names
#             its author; it never names a project, an instance, or a collaborator.
# A SIGNATURE section with no `# files:` line is a permission with no scope, and this
# refuses to run rather than guess — the same stance as a missing denylist.
SIG=$(section SIGNATURE)        # joined with | — for the regex
SIG_LIST=$(terms SIGNATURE)     # one per line   — for the set subtraction below
SIG_FILES=$(sed -n '/^## SIGNATURE/,/^## /p' "$DENYLIST" | sed -n 's/^#[[:space:]]*files:[[:space:]]*//p')
NONSIG="$PATTERN"
declare -a SIGF=() OTHERF=()
if [ -n "$SIG" ]; then
  if [ -z "$SIG_FILES" ]; then
    echo "  gate: the denylist has a SIGNATURE section and no '# files:' line."
    echo "        A permission with no scope is a hole. Refusing to run."
    exit 2
  fi
  NONSIG=$(terms HARD | grep -vxF "$SIG_LIST" | paste -sd'|')
  for f in "${FILES[@]}"; do
    keep=0; for s in $SIG_FILES; do [ "$f" = "$s" ] && { keep=1; break; }; done
    if [ $keep -eq 1 ]; then SIGF+=("$f"); else OTHERF+=("$f"); fi
  done
else
  OTHERF=("${FILES[@]}")
fi

fail=0

# 1 · Personal data in what is public. The founding axiom.
hits=""
[ ${#OTHERF[@]} -gt 0 ] && hits=$(grep -rHniE "$HARD_RE" -- "${OTHERF[@]}" 2>/dev/null)  # gate:allow the gate must name what it forbids
if [ ${#SIGF[@]} -gt 0 ] && [ -n "$NONSIG" ]; then
  extra=$(grep -rHniE "\\b(${NONSIG})[0-9]*\\b" -- "${SIGF[@]}" 2>/dev/null)
  [ -n "$extra" ] && hits=$(printf '%s\n%s' "$hits" "$extra" | grep -v '^$')
fi
if [ -n "$hits" ]; then
  echo "  ✗ personal data in files that would be published:"
  echo "$hits" | awk -F: '{print "      " $1 ":" $2}' | sort -u | head -20
  echo "$hits" | wc -l | xargs printf "      (%s hits)\n"
  fail=1
fi

# 1a · The signature itself — permitted, and printed on EVERY run. A permission you
#      cannot see is the same hole as an exemption you cannot see, so this is loud by
#      design and its silence is information too: if these lines stop appearing, the
#      watermark has been removed from the tracked set.
if [ ${#SIGF[@]} -gt 0 ]; then
  if declared=$(grep -rHniE "\\b(${SIG})[0-9]*\\b" -- "${SIGF[@]}" 2>/dev/null); then
    echo "  ✍️ $(echo "$declared" | wc -l | tr -d ' ') declared signature line(s) — permitted by AX-1, scoped to:"
    echo "$declared" | awk -F: '{print "      " $1 ":" $2}' | sort -u | head -10
  else
    echo "  ✗ the signature files are tracked and carry no signature — the watermark is gone."
    echo "      $(echo $SIG_FILES) exist and are tracked, the denylist declares a SIGNATURE"
    echo "      section, and no line in them matches it. That is not a repo without a"
    echo "      watermark; it is a repo that HAD one. Restore it, or remove the SIGNATURE"
    echo "      section — deciding to stop signing is fine, forgetting is what this catches."
    fail=1
  fi
fi

# 1b · SOFT terms — reported, never blocking. A hit here is a word that is both a
#      project name and an ordinary English word; the operator rules on it.
if [ -n "$SOFT" ]; then
  if soft=$(grep -rHniE "\\b(${SOFT})[0-9]*\\b" -- "${FILES[@]}" 2>/dev/null); then
    echo "  ! soft terms present — reported, not blocking. Read them:"
    echo "$soft" | awk -F: '{print "      " $1 ":" $2}' | sort -u | head -10
  fi
fi

# 1c · An address, which the term list above CANNOT see. A denied term glued to more
#      letters has no word boundary after it, so an address built from the operator's
#      own name passes every check above — while being the single most identifying
#      string a public repository can carry. Proven against a plant, with
#      check 1 reporting clean on the same file.
#
#      Dropping the boundary from check 1 was the obvious fix and is the wrong one: a
#      three-letter name would then fire on every ordinary English word containing it,
#      and a gate that cries wolf is switched off whole inside a week. So the address is
#      EXTRACTED FIRST and the terms matched as SUBSTRINGS inside it — safe precisely
#      because the context is already narrow. `git@github.com` carries no listed term
#      and is not a hit; that is the test this must keep passing, and it is why the
#      extraction cannot be widened to "any string with an @ in it".
#
#      ⚠️ NO SIGNATURE CARVE-OUT HERE, and the denylist says why in its own words: no
#      email, no address, no employer — a signature says who made this, never how to
#      reach them. So this blocks inside the signature files exactly as it does anywhere.
if addr=$(grep -rHnoE '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' -- "${FILES[@]}" 2>/dev/null); then
  bad=$(echo "$addr" | awk -F: -v re="$PATTERN" '
    { m = $0; sub(/^[^:]*:[0-9]*:/, "", m)
      if (tolower(m) ~ re) print "      " $1 ":" $2 " — " m }' | sort -u)
  if [ -n "$bad" ]; then
    echo "  ✗ an address carrying a denied term — invisible to check 1, blocked here:"
    echo "$bad" | head -10
    fail=1
  fi
fi

# 2 · Paths BELOW an instance's root, inside the public structure. The denylist cannot
#     catch these: the operations centre's name is deliberately absent from it, being
#     vocabulary and not a person.
#
#     ⚠️ THE LINE MOVED 2026-09-05, ON THE OPERATOR'S RULING, AND IT MOVED BECAUSE IT WAS
#     DRAWN IN THE WRONG PLACE. It used to forbid naming ANYTHING below an instance's root
#     — the system folder, the knowledge domains, the projects — on the theory that a path
#     is how a program ends up running on one machine. What that actually produced was a
#     method that could not describe its own artefacts: a skill explaining where the mailbox
#     lives could not say where the mailbox lives, so every skill was written in paraphrase
#     and the paraphrase was worse than the path. It blocked the operator's own commit the
#     day the skills were rewritten to be concrete.
#
#     The line is now: **the system folder and the knowledge domains are STRUCTURE and may
#     be named; `98_PROJECTS` is the operator's WORK and may not.** A skill may say
#     `99_SYSTEM/notebook/README.md` because that path is the same on every instance built
#     from this method. Nothing may say `98_PROJECTS/…` because what is under it is one
#     person's projects, and their names are the leak. (The operator, 2026-09-05: *"MLabs debe
#     permitir referenciar los archivos de nexus, a no ser que sean trabajos míos, eso sigue
#     sin filtrarse — pasa 98/."*)
#
#     ⚠️ The project NAMES are still covered, and by a different check: they are on the
#     denylist, which check 1 reads. This check and that one now cover one thing each
#     instead of overlapping on the folder and missing on the name.
#
#     This is still the only check standing between a debugging shortcut and a program that
#     runs on exactly one machine — it just stands where the machine-specific part is.
#     ⚠️ Exemptions exist and are DELIBERATELY visible. A gate with no escape hatch
#     gets switched off whole the first time it blocks something legitimate, so a line
#     may carry `gate:allow <reason>` — and every one is printed on every run. An
#     exemption you can list is a debt; an exemption you cannot see is a hole.
#
#     ⚠️ THE PATTERN WAS BLIND AND RETURNED CLEAN ON A REAL LEAK. It ended
#     in a slash it REQUIRED and used a class that cannot cross an underscore, so a
#     numbered *folder* matched and a numbered *index file* beside it did not — and the
#     numbering below 01 was outside the range entirely. A skill published six such filenames
#     and this check reported clean — *a published check that cannot match*,
#     with the pattern on the page and simply unable to fire. Now: two digits, an underscore, then a LETTER — so
#     a named numbered root matches at any depth while the bare numbered placeholder,
#     which ends at the underscore, still passes. That is the distinction the paragraph
#     above always claimed to draw and did not.
#
#     ⚠️ NARROWED AGAIN 2026-09-05. The pattern matched the bare folder name `98_PROJECTS`
#     anywhere, which blocked every document that named the projects root as structural
#     vocabulary — including this check's own documentation and any skill describing the
#     layout. The pattern is now `98_PROJECTS/[A-Za-z]`: the slash plus a letter means an
#     actual project name follows, so the bare folder name passes and a path into it does
#     not. The project NAMES themselves are still on the denylist (check 1), which is why
#     this check does not need to catch them at the folder level.
if hits=$(grep -rHnE '98_PROJECTS/[A-Za-z]' -- "${FILES[@]}" 2>/dev/null); then
  real=$(echo "$hits" | grep -v 'gate:allow')
  allowed=$(echo "$hits" | grep 'gate:allow')
  if [ -n "$real" ]; then
    echo "  ✗ the operator's own work named inside the public structure (98_PROJECTS):"
    echo "$real" | awk -F: '{print "      " $1 ":" $2}' | sort -u | head -20
    fail=1
  fi
  if [ -n "$allowed" ]; then
    echo "  ! $(echo "$allowed" | wc -l) exempted line(s), carried as declared debt:"
    echo "$allowed" | sed -E 's/^([^:]+:[0-9]+).*gate:allow *(.*)$/      \1 — \2/' | sort -u
  fi
fi

# 3 · The tracked set is exactly the allowlist — BOTH directions. A surplus file is a
#     leak; a `!` line with nothing behind it is scaffolding. Check BOTH directions — only the
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
  echo "  The gate blocked this. Nothing is wrong with wanting the change — what is"
  echo "  wrong is either the data travelling with it or the attribution missing from"
  echo "  it. Move the instance's names and paths into its adapter or its own"
  echo "  repository, restore anything the ✗ lines say went missing, and run it again."
fi
exit $fail
