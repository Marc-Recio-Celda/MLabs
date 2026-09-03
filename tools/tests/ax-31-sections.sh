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

# 5 · THE PLANT THE FIRST VERSION HAD NO ANSWER TO, and the reason this file was rewritten: an
#     apostrophe-s or a parenthesis between the name and its §n. A checker that matches the pair
#     together, with a fixed list of what may sit between, drops these to the self-reference branch
#     — where they resolve against the CITING file and report CLEAN if it happens to have a section
#     of that number. Both citing files below have §3; neither target does.
run '# A

## 1. One

## 2. Two

## 3. Three

The rule is `B.md`'"'"'s §3, and see also `B.md` (specifically §3).' \
    '# B

## 1. One

## 2. Two'
[ "$(grep -c 'cites `B.md` §3' "$TMP/out")" = 2 ] \
  || { echo "possessive and parenthetical citations were not attributed to the named file"; cat "$TMP/out"; exit 1; }

# 6 · the other direction, and it is what makes case 5 safe: a §n in a NEW sentence, after the
#     one that named a file, is a self-reference and must resolve against the citing file.
run '# A

## 1. One

## 7. Seven

Per `B.md` §1. The rest is §7 here.' \
    '# B

## 1. One'
grep -q '✗' "$TMP/out" \
  && { echo "a §n in a new sentence was wrongly attributed to the previous sentence's file"; cat "$TMP/out"; exit 1; }

# 7 · the name and its number on opposite sides of a blockquote wrap. Every header note in this
#     repository is a `>` block, so a checker that stops at the `>` resolves the number against the
#     WRONG file — it reads as a bare self-reference — and reports a defect that is not there.
run '# A

## 1. One

> Per `B.md`
> §1, which holds.' \
    '# B

## 1. One'
grep -q '✗' "$TMP/out" \
  && { echo "a citation wrapping across a blockquote was misread"; cat "$TMP/out"; exit 1; }

# 8 · an identifier is not a target. Axiom ids, decision ids and check ids are backticked names
#     living in the same sentences as §n, and one of them stole a citation on the round the
#     sentence rule was written. The §n below is this file's own and must resolve to it.
run '# A

## 1. One

## 8. Eight

⚠️ These run by hand at each cut (`AX-7`), and §8 holds the gate that changes it.' \
    '# B

## 1. One'
grep -q '✗' "$TMP/out" \
  && { echo "a backticked identifier was read as a file and stole the citation"; cat "$TMP/out"; exit 1; }
grep -q 'outside this run' "$TMP/out" \
  && { echo "a backticked identifier was counted as an unreachable target"; cat "$TMP/out"; exit 1; }

# 9 · a target outside the run is counted and printed, never silently skipped (AX-22).
run '# A

## 1. One

Per `NEXUS:AGENTS.md` §5.' \
    '# B

## 1. One'
grep -q 'outside this run' "$TMP/out" \
  || { echo "a citation to a file outside the run was not reported"; cat "$TMP/out"; exit 1; }

# 10 · could-not-run is not a pass: no §n anywhere exits 2, never clean.
printf '# a\n' > "$TMP/A.md"; printf '# b\n' > "$TMP/B.md"
bash "$TOOL" "$TMP/A.md" "$TMP/B.md" > "$TMP/out" 2>&1
[ $? -eq 2 ] || { echo "no citation anywhere did not exit 2"; cat "$TMP/out"; exit 1; }

echo "10/10 · missing fires · wrong-file fires · bare §n fires · notations silent · possessive and parenthetical attributed · new sentence stays self · blockquote wrap resolves · an id is not a target · outside-run counted · nothing exits 2"
