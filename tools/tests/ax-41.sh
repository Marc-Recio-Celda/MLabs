#!/usr/bin/env bash
# AX-41 — a structural file states what is true now and never how it got there.
# Proves the date check fires: a change register almost always carries a date, and
# prose that states a present truth almost never needs one.
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
. "$ROOT/tools/tests/lib.sh"
PAT="$(published_pattern AX-41 "$ROOT/AXIOMS.md")"
[ -n "$PAT" ] || { echo "AX-41 publishes no pattern — the row lost its command and this test would prove nothing"; exit 1; }
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
run() { printf '%s\n' "$1" > "$TMP/f.md"; grep -qE "$PAT" "$TMP/f.md"; }

# 1 · obvious: a change register, which is the shape this rule exists to keep out.
run '## Changelog
- 2026-08-21 — the notes section was removed.' \
  || { echo "obvious plant (a dated changelog) did not fire"; exit 1; }

# 2 · subtle: one date inside an ordinary sentence, which is how narration actually
#     arrives — nobody adds a `## Changelog`, they add a clause explaining themselves.
run 'The audit trigger was retired on 2026-08-19 after five firings in one session.' \
  || { echo "subtle plant (a date inside prose) did not fire"; exit 1; }

# 3 · negative control: version numbers, section numbers and ranges look like dates to
#     a loose pattern. A rule file is full of them, and a check that fires on `1.1.0`
#     or `§2-3` flags every structural file and is switched off within a week.
run 'Release 1.1.0 covers §2-3 and the 10-20 row case, per AX-4 and PH-5.' \
  && { echo "negative control fired — version and section numbers read as dates"; exit 1; }

echo "3/3 · changelog fires · date in prose fires · versions and sections stay silent"
