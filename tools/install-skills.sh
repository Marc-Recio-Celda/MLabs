#!/usr/bin/env bash
# Link this workspace's skills where the tool looks for them.
#
# The repository is the source (AX-20); `.claude/skills/` is a view — a symlink, never a
# copy, so there is one file and it cannot drift. Links are RELATIVE, so the company's
# own link is committable and a fresh clone has working skills with nothing to run.
#
# The bridge that delivers this file cannot carry a mode bit, so `./tools/...` may say
# Permission denied on a fresh copy. `bash tools/install-skills.sh` never needs the bit.
#
#   ./tools/install-skills.sh            # dry run, shows what it would do
#   ./tools/install-skills.sh --apply    # creates the links
#
# Run it from anywhere: paths resolve from this script's own location, not from cwd.
# Idempotent; refuses to replace anything that is not already a symlink.
set -uo pipefail

DRY=1
[[ "${1:-}" == "--apply" ]] && DRY=0
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
rc=0

link() {  # $1 = source dir (absolute) · $2 = link path · $3 = target, relative to the link's own dir
  local src="$1" dst="$2" rel="$3"
  if [[ ! -d "$src" ]]; then echo "  skip    ${dst#$ROOT/}  (no $src)"; return 0; fi
  if [[ -L "$dst" && "$(readlink -f "$dst")" == "$(readlink -f "$src")" ]]; then
    echo "  ok      ${dst#$ROOT/} -> $rel"; return 0
  fi
  if [[ -e "$dst" && ! -L "$dst" ]]; then
    echo "  REFUSED ${dst#$ROOT/} exists and is not a symlink"; rc=1; return 0
  fi
  if (( DRY )); then
    echo "  would   ${dst#$ROOT/} -> $rel"
  else
    mkdir -p "$(dirname "$dst")" && ln -sfn "$rel" "$dst" \
      && echo "  linked  ${dst#$ROOT/} -> $rel" \
      || { echo "  FAILED  ${dst#$ROOT/}"; rc=1; }
  fi
}

echo "Workspace: $ROOT"
echo "Company skills:"
link "$ROOT/skills" "$ROOT/.claude/skills" "../skills"

echo "Instance skills:"
found=0
for d in "$ROOT"/*/; do
  s="${d}99_SYSTEM/skills"
  [[ -d "$s" ]] || continue
  found=1
  link "$s" "${d}.claude/skills" "../99_SYSTEM/skills"
done
(( found )) || echo "  none    (no <instance>/99_SYSTEM/skills under $ROOT)"

if (( DRY )); then
  echo
  echo "Dry run — nothing was changed. Re-run with --apply."
fi
exit $rc
