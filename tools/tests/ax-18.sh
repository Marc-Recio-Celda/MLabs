#!/usr/bin/env bash
# AX-18 — what is gated is mechanical, and a protected file is the mechanical half.
# Proves tools/perm-paths.sh fires: a permission table whose paths have moved still reads
# as protection, so the failure is silent by construction.
set -uo pipefail
TOOL="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/perm-paths.sh"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

# A tree in the shape a real operations centre has: the central files live one level down.
mkdir -p "$TMP/root/central/nexus" "$TMP/root/work/owner/thing/nexus"
touch "$TMP/root/central/AXIOMS.md" "$TMP/root/central/PURPOSE.md" "$TMP/root/README.md"

table() { printf '%s\n' "$1" > "$TMP/AGENTS.md"; bash "$TOOL" "$TMP/AGENTS.md" "$TMP/root" > "$TMP/out" 2>&1; }

# 1 · obvious: a colour protecting a file that is simply not there.
table '| | Means | Files |
|---|---|---|
| 🔴 | **Ask the operator.** | `central/AXIOMS.md` · `central/RETIRED.md` |'
grep -q 'RETIRED.md' "$TMP/out" \
  || { echo "obvious plant (a path that is plainly gone) did not fire"; cat "$TMP/out"; exit 1; }

# 2 · subtle: written the way a permission table is actually written — a bare filename for a
#     file that exists one level down. It reads correctly to a person and resolves to nothing,
#     which is the whole defect: the table is right in spirit and unusable by anything.
table '| | Means | Files |
|---|---|---|
| 🔴 | **Ask the operator.** Explicit go-ahead per change | `central/AXIOMS.md` · `PURPOSE.md` · every `work/**/nexus/` |'
grep -q '`PURPOSE.md`' "$TMP/out" \
  || { echo "subtle plant (a bare filename that lives one level down) did not fire"; cat "$TMP/out"; exit 1; }
grep -q 'work/' "$TMP/out" \
  && { echo "the glob was reported, but one match under the root is all a glob owes"; cat "$TMP/out"; exit 1; }

# 3 · negative control: a table where every path resolves, carrying the prose, the bold and
#     the bare vocabulary prefixes that surround paths in a real one. Without this, a check
#     that fires on every backticked span passes both plants and looks perfect.
table '| | Means | Files |
|---|---|---|
| 🔴 | **Ask the operator.** | `central/AXIOMS.md` · `central/PURPOSE.md` · every `work/**/nexus/` **and** `central/nexus/` · notes carrying `ch-` |
| 🟡 | **Apply, do not commit.** | `README.md` |'
grep -q '✗' "$TMP/out" \
  && { echo "negative control fired — prose or a vocabulary prefix was read as a path"; cat "$TMP/out"; exit 1; }

# 4 · the wrong root. Every path missing at once is what an aimed-wrong check looks like, and
#     returning a verdict on it is how a tool teaches its reader to stop believing the output.
table '| | Means | Files |
|---|---|---|
| 🔴 | **Ask the operator.** | `central/AXIOMS.md` · `central/PURPOSE.md` |'
bash "$TOOL" "$TMP/AGENTS.md" "$TMP" > "$TMP/out" 2>&1
[ $? -eq 2 ] || { echo "wrong root did not exit 2 — nothing resolved and it returned a verdict anyway"; cat "$TMP/out"; exit 1; }

echo "4/4 · missing path fires · bare filename fires · prose and prefixes silent · wrong root exits 2"
