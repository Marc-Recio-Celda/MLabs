#!/usr/bin/env bash
# AX-4 — a rule names the event that fires it.
# Proves `grep -L '^## Occasion'` distinguishes a skill that names its event from
# one that does not.
#
# ⛔ This check is KNOWN BAD on the real tree: it flags 15 of 19 and at most 8 are
# real, because four spellings of one heading are in use. The test pins the behaviour
# that is correct — exact heading, at the start of a line — so the fix lands in the
# data rather than in a wider pattern that would make the check match anything.
set -uo pipefail
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/s/a" "$TMP/s/b" "$TMP/s/c"
flagged() { ( cd "$TMP" && grep -L '^## Occasion' s/*/SKILL.md | sed 's|.*/\(.\)/SKILL.md|\1|' | tr '\n' ' ' ); }

printf '# a\n\n## Occasion\n\nA task closes.\n'      > "$TMP/s/a/SKILL.md"
printf '# b\n\nIt fires when a task closes.\n'         > "$TMP/s/b/SKILL.md"
printf '# c\n\n### Occasion\n\nA task closes.\n'     > "$TMP/s/c/SKILL.md"

out="$(flagged)"
# 1 · obvious: no heading at all, only prose. Must be flagged.
[[ "$out" == *b* ]] || { echo "obvious plant (event only in prose) was not flagged"; exit 1; }
# 2 · subtle: the heading is there at the wrong level — `###` instead of `##`. This is
#     the exact defect on the real tree, and it reads as compliant to a human.
[[ "$out" == *c* ]] || { echo "subtle plant (wrong heading level) was not flagged"; exit 1; }
# 3 · negative control: the correct heading must NOT be flagged.
[[ "$out" == *a* ]] && { echo "negative control fired — a correct heading was flagged"; exit 1; }

echo "3/3 · prose-only flagged · wrong level flagged · exact heading stays silent"
