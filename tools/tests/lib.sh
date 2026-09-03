#!/usr/bin/env bash
# Shared by the tests whose axiom publishes a pattern.
#
# ⚠️ **A test that keeps its own copy of the pattern proves a lookalike, not the check.**
# `AX-41` published `\b(19\|20)…` for its whole life — an escaped pipe, because a bare one
# breaks the table cell it sits in, and `\|` under `grep -E` is a literal pipe. The test held
# the unescaped version, passed on every run, and the command anybody would actually paste
# could not match a date. Nothing revealed it: the repository was clean either way, and a
# pattern that cannot match returns clean on a repository full of faults.
#
# So the pattern comes out of the row. If the row's command is broken the test fails, which is
# the only arrangement under which `AX-7`'s guarantee means what it says.

# published_pattern <AX-n> [axioms-file] — the first single-quoted argument to the first
# grep in that row's Check cell. Empty output means the row publishes no pattern, and the
# caller must treat that as a failure rather than as an empty pattern that matches everything.
published_pattern() {
  local id="$1" ax="${2:-AXIOMS.md}"
  awk -F'|' -v want="**$1**" '$2 ~ /\*\*AX-[0-9]+\*\*/ {
      k = $2; gsub(/^[ \t]+|[ \t]+$/, "", k)
      if (k == want) { print $6; exit }
    }' "$ax" \
  | grep -oE "grep[^']*'[^']*'" \
  | head -1 \
  | sed -E "s/.*'([^']*)'.*/\1/"
}
