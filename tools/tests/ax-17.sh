#!/usr/bin/env bash
# AX-17 — everything is routed at the moment it is written, and an item that resists
# routing is evidence the structure is wrong. Proves `parse.py` reports the entry that
# no shape can place.
#
# ⚠️ It builds a synthetic adapter, which is what makes this check testable at all: the
# real one is instance-side, and a check whose only fixture is the operator's machine
# is one nobody else can ever prove.
#
# ⚠️ **Capture, then assert — never pipe from the check.** Under `pipefail` a pipeline
# takes the failure of ANY member, and `parse.py` legitimately exits 1 when it finds a
# problem. Piping it into `grep` made every assertion fail whatever grep matched. This
# is the third test here written wrong at the same seam.
#
# ⚠️ **The signal is *unplaceable*, not the word `project`.** `project:` is mandatory in
# the mailbox shape, so an entry without it never matches that shape at all — the check
# is stronger than the first assertion written against it.
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TMP="$(mktemp -d)"; OUT="$TMP/out"; trap 'rm -rf "$TMP"' EXIT
printf '{"root":".","sources":[{"label":"mailbox","kind":"queue","path":"MAILBOX.md"}]}\n' > "$TMP/adapter.json"
run() {
  printf '%s\n' "$1" > "$TMP/MAILBOX.md"
  python3 "$ROOT/interface/model/parse.py" --adapter "$TMP/adapter.json" > "$OUT" 2>&1 || true
}

# 1 · obvious: an entry with no `project:` at all. Invisible to the filter the whole
#     central set exists to make possible, so it is reported rather than parsed.
run '### [open] → operator · the parser drops a field · (agent, 2026-08-21)'
grep -q 'could not be placed' "$OUT" || { echo "obvious plant (no project:) not reported"; exit 1; }

# 2 · subtle: the same omission sitting NEXT TO a correct entry, which is how the field
#     actually goes missing — by copying the line above and editing the middle. A report
#     that only counted totals would show 1 of 2 and read as a rounding error.
run '### [open] → operator · project: nexus — a good one · (agent, 2026-08-21)
### [open] → operator — the one that was copied · (agent, 2026-08-21)'
grep -q 'MAILBOX.md:2' "$OUT" || { echo "subtle plant (copied line) not named by line"; exit 1; }

# 3 · negative control: a complete entry must parse silently. A parser that complains
#     about correct input is one whose output stops being read.
run '### [open] → operator · project: nexus — a complete entry · (agent, 2026-08-21)'
grep -q 'could not be placed' "$OUT" && { echo "negative control fired — a complete entry was reported"; exit 1; }

echo "3/3 · unplaceable reported · copied line named by line · complete entry stays silent"
