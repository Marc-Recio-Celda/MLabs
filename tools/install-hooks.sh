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
exec "$ROOT/tools/gate.sh" --denylist "$DENYLIST" --staged
EOF
chmod +x "$HOOK"

echo "  ✓ pre-commit hook installed at .git/hooks/pre-commit"
echo "    denylist: $DENYLIST"
echo
echo "  It now blocks a commit that would publish a name or an instance path,"
echo "  whoever or whatever wrote it. To bypass once: git commit --no-verify"
echo "  — and if you find yourself typing that twice, the gate is wrong, not the commit."
