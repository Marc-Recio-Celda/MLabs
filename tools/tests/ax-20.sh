#!/usr/bin/env bash
# AX-20 — the same fact does not live in two files.
# Proves the one instance of it that runs today: a rule file must reach the method by
# scope, never by a path, so the method's address exists in exactly one place.
set -uo pipefail
PAT='[~./][A-Za-z0-9_/-]*MLabs'
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

echo "3/3 · home path fires · relative path fires · scope citation stays silent"
