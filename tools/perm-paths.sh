#!/usr/bin/env bash
# Every path a permission table protects still resolves.
#
#   bash tools/perm-paths.sh <permission-file> [root]
#
# AGENTS.md names *a permission table that lost its paths* as an instance failure and hands it to
# the instance auditor; until this ran, nothing executed it. A colour row whose paths have moved
# still reads as protection, which is worse than no table at all: the agent reads a rule, believes
# it is bound by it, and edits a file nothing was watching.
#
# PREMISES, and either one wrong makes every result meaningless:
#   A. The permission table's rows begin with a colour disc and the LAST cell lists the paths that
#      colour covers. Point it at a file with no such table and it parses nothing, which is why an
#      empty parse exits 2 rather than clean.
#   B. Paths resolve against <root>, which defaults to the directory holding <permission-file>.
#      A path written relative to somewhere else is reported, and that is the finding, not noise:
#      a reader who has to infer the prefix is a reader who will infer it differently next year.
#
# TRAPS, each proven by a plant: the cell carries prose around the paths, so only backticked spans
# count, and only those holding a separator or a dot — a bare prefix is vocabulary, not a path · a
# glob passes on one match and never on literal existence · a colour row whose cell holds no path
# at all is reported, because a colour protecting nothing is the same defect arriving as an empty
# cell rather than as a stale one.
# ⚠️ **Zero resolved paths exits 2, not 0.** Aimed at the wrong root every path is missing, and
# that is indistinguishable from a table that lost all of them at once.
# Exit 0 clean · 1 a protected path resolves to nothing · 2 could not run, which is NOT a pass.
set -uo pipefail
shopt -s globstar nullglob

PF="${1:-}"
[ -n "$PF" ] && [ -f "$PF" ] || { echo "  perm-paths: no permission file at ${PF:-<none>}"; exit 2; }
ROOT="${2:-$(cd "$(dirname "$PF")" && pwd)}"
[ -d "$ROOT" ] || { echo "  perm-paths: no root at $ROOT"; exit 2; }

OUT=$(mktemp); trap 'rm -f "$OUT"' EXIT
rows=0; found=0; miss=0; empty=0

while IFS=$'\t' read -r colour cell; do
  rows=$((rows + 1))
  n=0
  while IFS= read -r span; do
    p="${span//\`/}"
    case "$p" in *[/.]*) ;; *) continue ;; esac   # a bare prefix is vocabulary, not a path
    n=$((n + 1))
    case "$p" in
      *[*?[]*)
        if compgen -G "$ROOT/$p" > /dev/null; then found=$((found + 1))
        else echo "  ✗ $colour \`$p\` — glob matches nothing under $ROOT" >> "$OUT"; miss=$((miss + 1)); fi ;;
      *)
        if [ -e "$ROOT/$p" ]; then found=$((found + 1))
        else echo "  ✗ $colour \`$p\` — nothing at that address under $ROOT" >> "$OUT"; miss=$((miss + 1)); fi ;;
    esac
  done < <(printf '%s\n' "$cell" | grep -oE '`[^`]+`')
  if [ "$n" -eq 0 ]; then
    echo "  ✗ $colour names no path at all — a colour that protects nothing" >> "$OUT"
    empty=$((empty + 1))
  fi
done < <(awk -F'|' '
  $2 ~ /🔴|🟡|🟢|🔵/ {
    c = $2; gsub(/[^🔴🟡🟢🔵]/, "", c)
    last = ""
    for (i = NF; i >= 2; i--) if ($i ~ /[^[:space:]]/) { last = $i; break }
    print c "\t" last
  }' "$PF")

[ "$rows" -gt 0 ] || { echo "  perm-paths: no permission rows in $PF — refusing to call that clean"; exit 2; }
[ "$found" -gt 0 ] || { echo "  perm-paths: $miss path(s) named and none resolved under $ROOT — wrong root, not a verdict"; exit 2; }

if [ -s "$OUT" ]; then
  cat "$OUT"
  # ⚠️ Two denominators, never one: a colour that names no path is not an unresolved path, and
  # adding them gives a ratio that is out of nothing (`AX-36`).
  echo "  perm-paths: $miss of $((found + miss)) protected path(s) unresolved · $empty of $rows colour(s) name none"
  exit 1
fi
echo "  clean — $found protected path(s) across $rows colour(s) all resolve under $ROOT"
exit 0
