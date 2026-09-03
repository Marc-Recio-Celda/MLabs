#!/usr/bin/env bash
# AX-31, the second of its two commands — a cited §n resolves to a heading that exists.
# `ax-31.sh` proves the first (`axiom-refs.sh`); a positional reference is the half that one
# cannot see, which is why the axiom carries two commands and each carries a plant.
# The failure is silent by construction: a citation to a dissolved section still reads as a
# citation, and the only reader who notices is one who goes and looks.
set -uo pipefail
TOOL="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/section-refs.sh"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

run() {  # $1 → A.md, $2 → B.md, then run over both
  printf '%s\n' "$1" > "$TMP/A.md"
  printf '%s\n' "$2" > "$TMP/B.md"
  bash "$TOOL" "$TMP/A.md" "$TMP/B.md" > "$TMP/out" 2>&1
}

# 1 · obvious: a citation to a section the target never had.
run '# A

See `B.md` §9 for the rule.' \
    '# B

## 1. One

## 2. Two'
grep -q 'cites `B.md` §9' "$TMP/out" \
  || { echo "obvious plant (a section that never existed) did not fire"; cat "$TMP/out"; exit 1; }

# 2 · subtle: the section exists — in the OTHER file. This is the shape a copied paragraph takes,
#     and it must fail on the file doing the citing, not pass because the number exists somewhere.
run '# A

## 9. Nine

Also see `B.md` §9.' \
    '# B

## 1. One'
grep -q 'cites `B.md` §9' "$TMP/out" \
  || { echo "subtle plant (right number, wrong file) did not fire"; cat "$TMP/out"; exit 1; }

# 3 · a bare §n resolves against the file it sits in, which is how a self-reference goes stale
#     when its own section is renumbered.
run '# A

## 1. One

Covered by §7 above.' \
    '# B

## 7. Seven'
grep -q '§7' "$TMP/out" \
  || { echo "bare §n against its own file did not fire"; cat "$TMP/out"; exit 1; }

# 4 · negative control, and it carries every notation in use at once. A checker that knows only
#     `## n.` reports the `·` and bold forms as missing and flags every file that uses them; one
#     that reads any number after a word reports the ordinary prose before a bare §n as a file.
run '# A

## 1. One

Per `B.md` §2 and §3, and `B` §1, and the budget §1 sets. See also `Scope:B.md` §4.' \
    '# B

## 1. One

## 2 · Two

**3. Three**

## 4. Four'
grep -q '✗' "$TMP/out" \
  && { echo "negative control fired — a valid notation or a plain word was read as a defect"; cat "$TMP/out"; exit 1; }
grep -q 'clean' "$TMP/out" \
  || { echo "negative control did not report clean"; cat "$TMP/out"; exit 1; }

# 5 · a target outside the run is counted and printed, never silently skipped (AX-22).
run '# A

## 1. One

Per `NEXUS:AGENTS.md` §5.' \
    '# B

## 1. One'
grep -q 'outside this run' "$TMP/out" \
  || { echo "a citation to a file outside the run was not reported"; cat "$TMP/out"; exit 1; }

# 6 · could-not-run is not a pass: no §n anywhere exits 2, never clean.
printf '# a\n' > "$TMP/A.md"; printf '# b\n' > "$TMP/B.md"
bash "$TOOL" "$TMP/A.md" "$TMP/B.md" > "$TMP/out" 2>&1
[ $? -eq 2 ] || { echo "no citation anywhere did not exit 2"; cat "$TMP/out"; exit 1; }

echo "6/6 · missing fires · right-number-wrong-file fires · bare §n fires · every notation silent · outside-run counted · nothing exits 2"
