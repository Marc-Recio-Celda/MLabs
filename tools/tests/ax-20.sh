#!/usr/bin/env bash
# AX-20 — the same fact does not live in two files.
# Proves the one instance of it that runs today: a rule file must reach the method by
# scope, never by a path, so the method's address exists in exactly one place.
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
. "$ROOT/tools/tests/lib.sh"
PAT="$(published_pattern AX-20 "$ROOT/AXIOMS.md")"
[ -n "$PAT" ] || { echo "AX-20 publishes no pattern — the row lost its command and this test would prove nothing"; exit 1; }
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

run() { printf '%s\n' "$1" > "$TMP/rules.md"; grep -qE "$PAT" "$TMP/rules.md"; }

# 1 · obvious: an absolute-ish path to the method, written out in a rule file.
run 'The method lives at ~/Documents/MLabs and is read from there.' \
  || { echo "obvious plant (home-relative path) did not fire"; exit 1; }

# 2 · subtle: a relative path inside a code span, which is how a second address is
#     actually introduced — it reads like a citation and is a hard-coded location.
run 'See `../MLabs/AXIOMS.md` for the company department.' \
  || { echo "subtle plant (relative path in a code span) did not fire"; exit 1; }

# 3 · negative control: the legitimate way to reach the method. A scope prefix is a
#     name, not an address, and a check that flags it makes every rule file look broken.
run 'The narrower loses (`MLabs:AX-20`), and MLabs. MLabs is the referent.' \
  && { echo "negative control fired — a scope citation is being read as a path"; exit 1; }

# ── the row's second command: the same prose in two structural files (`AX-20`'s general form)
DUP="$ROOT/tools/dup-prose.sh"
dup() { printf '%s\n' "$1" > "$TMP/a.md"; printf '%s\n' "$2" > "$TMP/b.md"
        bash "$DUP" "$TMP/a.md" "$TMP/b.md" > "$TMP/dup.out" 2>&1; }

# 4 · obvious: a sentence typed into both files.
dup 'The operator decides and the auditors only ever report what they found.' \
    'Elsewhere: the operator decides and the auditors only ever report what they found.'
grep -q '✗' "$TMP/dup.out" \
  || { echo "obvious plant (a sentence in both files) did not fire"; cat "$TMP/dup.out"; exit 1; }

# 5 · subtle: the copy arrives as a QUOTATION, which is how it actually happens — an axiom
#     quoting the clause it serves reads as respect for the source and is a second copy that
#     nothing regenerates.
dup 'A metric must be able to move in the bad direction, and the run where it does is the reason it exists.' \
    'This axiom implements *"a metric must be able to move in the bad direction, and the run where it does is the reason it exists"*.'
grep -q '✗' "$TMP/dup.out" \
  || { echo "subtle plant (a quoted clause) did not fire"; cat "$TMP/dup.out"; exit 1; }

# 6 · negative control: two files that share only vocabulary — the same ids, paths and commands,
#     which is the COMPLIANT shape. A check that flags a cited id makes correct citation look
#     like duplication and gets switched off within a week.
dup 'Before merging, run `bash tools/axiom-refs.sh AXIOMS.md MLabs $(git ls-files "*.md" "*.sh")`.' \
    'The gate is `bash tools/axiom-refs.sh AXIOMS.md MLabs $(git ls-files "*.md" "*.sh")`, nothing else.'
grep -q '✗' "$TMP/dup.out" \
  && { echo "negative control fired — shared ids and commands read as copied prose"; cat "$TMP/dup.out"; exit 1; }

echo "6/6 · home path · relative path · scope citation silent · copy fires · quoted copy fires · shared ids silent"
