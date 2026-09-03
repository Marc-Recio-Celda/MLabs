#!/usr/bin/env bash
# A generated view and its source name each other.
#
#   bash tools/view-refs.sh <files…>
#
# `AX-20` lets one fact live in two files when the second is a generated view. A view says so —
# it is written at the top of the generated file — and until this ran **nothing said it from the
# other side**. So the edit that invalidates a view happens in the source, where no line mentions
# the view exists, and the trail is only followable by searching for it.
#
# THE TWO MARKS, and each is a line the other can be checked against:
#   in the source   > **Generates:** `path` · `path`
#   in the view     > **Generated from:** `path` — `command that regenerates it`
#
# PREMISES, and either one wrong makes every result meaningless:
#   A. Paths are relative to <root>, which defaults to the current directory. A mark whose target
#      is outside the files given is reported as unresolved, which is the finding rather than noise:
#      a view nobody passed in is a view nobody checks.
#   B. Both marks are single lines beginning `> **Generates:**` / `> **Generated from:**`. A file
#      may carry both — a view generated from one thing and the source of another is ordinary.
#
# TRAPS, each proven by a plant: a source naming a view that names a different source is the shape
# a copied header takes, and it is reported on the source's side · a view whose command is missing
# is reported, because a view nobody can regenerate is a photograph and `AX-20` wants it declared
# as one · a path in ordinary prose is not a mark, so only these two line openings are read.
# Exit 0 clean · 1 a mark that does not resolve both ways · 2 could not run, which is NOT a pass.
set -uo pipefail
[ $# -ge 1 ] || { echo "  view-refs: usage: view-refs.sh <files…>"; exit 2; }
for f in "$@"; do [ -f "$f" ] || { echo "  view-refs: no file at $f"; exit 2; }; done

python3 - "$@" <<'PY'
import re, sys, os
files = sys.argv[1:]
gen, frm, cmd = {}, {}, {}
for f in files:
    t = open(f, encoding='utf-8', errors='replace').read()
    for line in t.split('\n'):
        m = re.match(r'>\s*\*\*Generates:\*\*(.*)', line)
        if m:
            gen[f] = [p for p in re.findall(r'`([^`]+)`', m.group(1))]
        m = re.match(r'>\s*\*\*Generated from:\*\*(.*)', line)
        if m:
            spans = re.findall(r'`([^`]+)`', m.group(1))
            frm[f] = spans[0] if spans else None
            cmd[f] = spans[1] if len(spans) > 1 else None

if not gen and not frm:
    print(f"  view-refs: no marks in {len(files)} file(s) — refusing to call that clean")
    sys.exit(2)

def same(a, b):
    return os.path.normpath(a) == os.path.normpath(b) or os.path.basename(a) == os.path.basename(b)

bad = 0
for src, views in gen.items():
    if not views:
        print(f"  ✗ {src} declares Generates: and names nothing"); bad += 1
    for v in views:
        hit = [f for f in files if same(f, v)]
        if not hit:
            print(f"  ✗ {src} generates `{v}` — not among the files given"); bad += 1; continue
        v = hit[0]
        if v not in frm:
            print(f"  ✗ {src} generates `{v}`, and `{v}` names no source"); bad += 1
        elif not same(frm[v], src):
            print(f"  ✗ {src} generates `{v}`, but `{v}` says it comes from `{frm[v]}`"); bad += 1
for v, src in frm.items():
    if cmd.get(v) is None:
        print(f"  ✗ {v} names a source and no command to regenerate it"); bad += 1
    if src is None:
        print(f"  ✗ {v} declares Generated from: and names nothing"); bad += 1; continue
    hit = [f for f in files if same(f, src)]
    if not hit:
        print(f"  ✗ {v} comes from `{src}` — not among the files given"); bad += 1
    elif v not in gen.get(hit[0], []) and not any(same(x, v) for x in gen.get(hit[0], [])):
        print(f"  ✗ {v} comes from `{src}`, and `{src}` does not name it"); bad += 1

if bad:
    print(f"  view-refs: {bad} mark(s) that do not resolve both ways")
    sys.exit(1)
print(f"  clean — {len(gen)} source(s) and {len(frm)} view(s), every mark resolving both ways")
PY
