#!/usr/bin/env bash
# AX-2 — decision logs are append-only and parseable from their first entry, with the
# field contract in the file's own header. Proves `parse.py` reports what does not
# parse and names the line.
#
# ⚠️ Capture, then assert: `parse.py` exits 1 when it finds a problem, and under
# `pipefail` piping from it poisons every assertion downstream.
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TMP="$(mktemp -d)"; OUT="$TMP/out"; trap 'rm -rf "$TMP"' EXIT
printf '{"root":".","sources":[{"label":"tasks","kind":"queue","path":"TASKS.md"}]}\n' > "$TMP/adapter.json"
run() {
  printf '%s\n' "$1" > "$TMP/TASKS.md"
  python3 "$ROOT/interface/model/parse.py" --adapter "$TMP/adapter.json" > "$OUT" 2>&1 || true
}

# 1 · obvious: the FIRST entry does not parse. This is the case the axiom is written
#     for — a log unparseable from its first line had its shape retro-fitted, and
#     eighty entries later that migration is the whole cost.
run '### the very first entry, written before the contract existed
### T2 · a later one ⬜
**project:** nexus'
grep -q 'TASKS.md:1' "$OUT" || { echo "obvious plant (unparseable first entry) not named"; exit 1; }

# 2 · subtle: every entry parses and one is missing a FIELD the contract requires. The
#     file reads as fine and the entity is real — it is simply invisible to the filter,
#     which is the failure a parser catches and a reader never does.
run '### T1 · a good one ⬜
**project:** nexus
### T2 · the one whose field was dropped ⬜'
grep -q 'no `project:`' "$OUT" || { echo "subtle plant (entry missing a required field) not reported"; exit 1; }

# 3 · negative control: a log that parses whole must stay silent, or every close ends
#     in adjudicating false positives and the report stops being read.
run '### T1 · a good one ⬜
**project:** nexus
### T2 · another good one ✅
**project:** nexus'
grep -q 'could not be placed' "$OUT" && { echo "negative control fired — a clean log was reported"; exit 1; }

echo "3/3 · unparseable first entry named · missing field reported · clean log stays silent"
