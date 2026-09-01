#!/usr/bin/env bash
# Wire the gate to run before every commit, so it stops depending on anyone
# remembering. Run once per clone:
#
#   tools/install-hooks.sh /path/to/denylist.txt
#
# Hooks are not tracked by git, which is why this is a script and not a file.
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"
DENYLIST="${1:-${MLABS_DENYLIST:-}}"

if [ -z "$DENYLIST" ] || [ ! -f "$DENYLIST" ]; then
  echo "  Give me the denylist: tools/install-hooks.sh /path/to/denylist.txt"
  echo "  It lives with the instance, never here — a list of names is personal data."
  exit 2
fi

# In a worktree `.git` is a file, not a directory, so the path is asked for rather
# than assumed. Building it by hand silently installed nothing here — and a hook
# that is not installed looks exactly like a hook that found nothing wrong.
HOOK="$(git rev-parse --git-path hooks)/pre-commit"
mkdir -p "$(dirname "$HOOK")"
cat > "$HOOK" <<EOF
#!/usr/bin/env bash
# Installed by tools/install-hooks.sh. Checks what the commit is about to contain.
#
# ⚠️ Invoked through \`bash\` rather than by exec-ing the file. The gate's execute bit is
# not part of the gate: anything that writes the file without preserving mode — a sync,
# a container bridge, an unzip, a checkout from a filesystem with no mode bits — leaves
# a correct script that cannot be run, and every commit then dies with "Permission
# denied" naming the gate instead of anything wrong with the commit. That happened on
# once and cost a working session. Reading a file needs no mode bit, so this form
# cannot fail that way.
bash "$ROOT/tools/gate.sh" --denylist "$DENYLIST" --staged
EOF
chmod +x "$HOOK"

# ⚠️ And repair the mode where git can keep it. `git update-index --chmod=+x` writes the
# bit into the INDEX, so it survives every checkout and every copy from then on. The hook
# change above stops a lost mode from breaking commits; this stops the file being wrong.
if [ -f "$ROOT/tools/gate.sh" ] && [ ! -x "$ROOT/tools/gate.sh" ]; then
  chmod +x "$ROOT/tools/gate.sh"
  git -C "$ROOT" update-index --chmod=+x tools/gate.sh 2>/dev/null || true
  echo "  ! tools/gate.sh was not executable — fixed, and the mode recorded in the index."
fi

echo "  ✓ pre-commit hook installed at .git/hooks/pre-commit"
echo "    denylist: $DENYLIST"
echo
echo "  It now blocks a commit that would publish a name or an instance path,"
echo "  whoever or whatever wrote it. To bypass once: git commit --no-verify"
echo "  — and if you find yourself typing that twice, the gate is wrong, not the commit."
