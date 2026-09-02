#!/usr/bin/env bash
# AX-42 — every record is emitted as queryable data.
# Proves the emission carries the FIELDS, not only the count. A store you can count and
# cannot query is the failure this axiom names, and it looks healthy from the outside.
#
# ⚠️ Capture, then assert: `parse.py` exits 1 when it finds a problem, and under
# `pipefail` piping from it poisons every assertion downstream.
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TMP="$(mktemp -d)"; OUT="$TMP/out"; trap 'rm -rf "$TMP"' EXIT
printf '{"root":".","sources":[{"label":"tasks","kind":"queue","path":"TASKS.md"}]}\n' > "$TMP/adapter.json"
run() {
  printf '%s\n' "$1" > "$TMP/TASKS.md"
  python3 "$ROOT/interface/model/parse.py" --adapter "$TMP/adapter.json" --json > "$OUT" 2>&1 || true
}

# 1 · obvious: a record with entries emits entities. Without this the store is prose.
run '### T1 · a good one ⬜
**project:** nexus
**Why** *(operator, 2026-08-21)*. because.'
python3 -c "import json,sys; d=json.load(open('$OUT')); sys.exit(0 if d['entities'] else 1)" \
  || { echo "obvious: a record with an entry emitted no entity"; exit 1; }

# 2 · subtle: the entity is emitted WITH its fields. A parser that emits ids and titles
#     and drops `project` gives a store that counts correctly and filters nothing — and
#     nothing in the count says so, which is why the assertion is on a field.
python3 -c "
import json,sys
d=json.load(open('$OUT')); e=d['entities'][0]
sys.exit(0 if e.get('project')=='nexus' and e.get('author')=='operator'  else 1)" \
  || { echo "subtle: the entity was emitted without the fields the record declared"; exit 1; }

# 3 · negative control: prose that is not an entry emits nothing. An emitter that
#     invents entities produces a store whose counts are larger than the record.
run 'Some ordinary prose with no entry in it at all.'
python3 -c "import json,sys; d=json.load(open('$OUT')); sys.exit(1 if d['entities'] else 0)" \
  || { echo "negative control fired — prose was emitted as an entity"; exit 1; }

echo "3/3 · entities emitted · fields carried · prose emits nothing"
