#!/usr/bin/env bash
# AX-45 — a source names the views generated from it, and each view names its source.
# Proves tools/view-refs.sh fires. The failure is silent by construction: a one-way mark
# reads as complete from the view's side, and the side that matters is the other one.
set -uo pipefail
TOOL="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/view-refs.sh"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

pair() {  # $1 → source.md, $2 → view.md, then run over both
  printf '%s\n' "$1" > "$TMP/source.md"
  printf '%s\n' "$2" > "$TMP/view.md"
  bash "$TOOL" "$TMP/source.md" "$TMP/view.md" > "$TMP/out" 2>&1
}

# 1 · obvious: the view declares its origin and the source has never heard of it.
pair '# Source

Text.' \
     '# View

> **Generated from:** `source.md` — `make view`'
grep -q 'does not name it' "$TMP/out" \
  || { echo "obvious plant (source silent about its view) did not fire"; cat "$TMP/out"; exit 1; }

# 2 · subtle: both marks are present and they disagree — the shape a copied header takes when a
#     view is cloned to seed a second one and the origin line is left pointing at the first.
pair '# Source

> **Generates:** `view.md`' \
     '# View

> **Generated from:** `other.md` — `make view`'
grep -q 'says it comes from' "$TMP/out" \
  || { echo "subtle plant (marks disagreeing) did not fire"; cat "$TMP/out"; exit 1; }

# 3 · a view nobody can regenerate is a photograph, and AX-20 wants that declared as one.
pair '# Source

> **Generates:** `view.md`' \
     '# View

> **Generated from:** `source.md`'
grep -q 'no command to regenerate' "$TMP/out" \
  || { echo "a view with no regeneration command did not fire"; cat "$TMP/out"; exit 1; }

# 4 · negative control: a matched pair, plus a path in ordinary prose on both sides. A check that
#     reads any backticked path as a mark reports every file that mentions another one.
pair '# Source

> **Generates:** `view.md`

See `README.md` and `tools/thing.sh` for context.' \
     '# View

> **Generated from:** `source.md` — `bash tools/render.sh`

Compare with `README.md`; edits here are lost.'
grep -q '✗' "$TMP/out" \
  && { echo "negative control fired — a path in prose was read as a mark"; cat "$TMP/out"; exit 1; }

# 5 · could-not-run is not a pass: files with no marks at all exit 2, never clean.
printf '# a\n' > "$TMP/source.md"; printf '# b\n' > "$TMP/view.md"
bash "$TOOL" "$TMP/source.md" "$TMP/view.md" > "$TMP/out" 2>&1
[ $? -eq 2 ] || { echo "no marks anywhere did not exit 2"; cat "$TMP/out"; exit 1; }

echo "5/5 · one-way fires · disagreeing marks fire · missing command fires · prose silent · no marks exits 2"
