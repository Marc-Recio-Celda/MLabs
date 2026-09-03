#!/usr/bin/env bash
# AX-23 — nothing is deleted; it is located.
# Proves the deletion listing separates what needs an address from what already
# carries one.
#
# ⚠️ Writing this test settled what the check actually means. A clean rename is NOT
# listed, and that is correct: git records both addresses, so the relocation is already
# in the diff and the rule is satisfied by construction. What must be listed is the
# move git CANNOT see — a file removed and rewritten elsewhere — because there the new
# address exists only if a person writes it down.
set -uo pipefail
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
git -C "$TMP" init -q; git -C "$TMP" config user.email t@t; git -C "$TMP" config user.name t
printf 'aaa\n' > "$TMP/gone.md"
printf 'one\ntwo\nthree\nfour\nfive\n' > "$TMP/moved.md"
printf 'ccc\n' > "$TMP/renamed-cleanly.md"
printf 'ddd\n' > "$TMP/kept.md"
git -C "$TMP" add -A >/dev/null; git -C "$TMP" commit -qm base
BASE=$(git -C "$TMP" rev-parse HEAD)

rm "$TMP/gone.md"                                            # a plain deletion
rm "$TMP/moved.md"; printf 'entirely different content\n' > "$TMP/elsewhere.md"   # unrecognisable move
git -C "$TMP" mv renamed-cleanly.md newname.md >/dev/null    # a rename git can see
printf 'ddd\nddd2\n' > "$TMP/kept.md"                        # an ordinary edit
git -C "$TMP" add -A >/dev/null; git -C "$TMP" commit -qm change
out="$(git -C "$TMP" log --diff-filter=D --name-only --format= "$BASE"..HEAD)"

# 1 · obvious: a file simply removed. Its content exists nowhere unless someone said so.
grep -q '^gone.md$' <<<"$out" || { echo "obvious plant (deleted file) not listed"; exit 1; }
# 2 · subtle: a file removed while its replacement appears elsewhere, rewritten enough
#     that git cannot link them. This is the one the rule exists for — it LOOKS like a
#     move to whoever made it and reads as a deletion to everyone afterwards.
grep -q '^moved.md$' <<<"$out" || { echo "subtle plant (unrecognisable move) not listed"; exit 1; }
# 3 · negative control: a clean rename already carries its new address, and a check
#     that demands paperwork for it turns every commit into an exercise nobody finishes.
grep -q '^renamed-cleanly.md$' <<<"$out" && { echo "negative control fired — a clean rename was listed"; exit 1; }
grep -q '^kept.md$' <<<"$out" && { echo "negative control fired — an edit was listed"; exit 1; }

echo "4/4 · deletion listed · unrecognisable move listed · rename and edit stay silent"
