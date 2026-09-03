#!/usr/bin/env bash
# A derived file and its source name each other.
#
#   bash tools/view-refs.sh <files…>
#
# `AX-20` lets one fact live in two files when the second is derived. `AX-45` requires the relation
# to be written at BOTH ends, because the edit that invalidates a copy happens in the source, where
# nothing says the copy exists.
#
# ⚠️ `AX-20` names TWO kinds of derived file and until 2026-09-03 this script could only check one.
# The larger class in practice is the second: a historical deliverable or milestone across frozen
# files, byte-identical to its source, and no syntax existed to mark it. A tool that reports
# `no marks` over a corpus full of unmarkable relations is not a passing check.
#
# THE FOUR MARKS — two pairs, and the pair you use is decided by ONE question:
# **can a command rebuild this file from its source?**
#
#   GENERATED — yes, a command rebuilds it. It loses on conflict and is regenerated, never edited.
#     in the source   > **Generates:** `path` · `path`
#     in the view     > **Generated from:** `path` — `command that regenerates it`
#
#   FROZEN — no. It is a photograph: it was correct on a date and is not maintained (`AX-20`'s
#   "declared photograph"). ⛔ It carries the DATE it was frozen and WHY, because those are the two
#   things a reader needs and neither can be recovered from the file.
#     in the source   > **Frozen copies:** `path` — YYYY-MM-DD
#     in the copy     > **Frozen from:** `path` — YYYY-MM-DD · why it was frozen
#
# ⛔ **A provenance mark is not content.** Adding one to a frozen file does not unfreeze it — the
# alternative is a copy nobody can trace, which is the failure the axiom names.
#
# PREMISES, and either one wrong makes every result meaningless:
#   A. Paths are relative to <root>, which defaults to the current directory. A mark whose target
#      is outside the files given is reported as unresolved, which is the finding rather than noise:
#      a view nobody passed in is a view nobody checks.
#   B. Every mark is a single line beginning with one of the four openings above. A file may carry
#      several — a view generated from one thing and the source of another is ordinary.
#
# TRAPS, each proven by a plant: a source naming a copy that names a different source is the shape a
# copied header takes, and it is reported on the source's side · a GENERATED view whose command is
# missing is reported, because a view nobody can regenerate is a photograph and must be declared as
# one · a FROZEN copy with no date is reported, because *frozen* with no *when* answers nothing ·
# a file carrying both `Generated from:` and `Frozen from:` for the same source is reported, because
# the two kinds have opposite conflict rules and a reader cannot be left to guess which applies ·
# a path in ordinary prose is not a mark, so only these four line openings are read.
# Exit 0 clean · 1 a mark that does not resolve both ways · 2 could not run, which is NOT a pass.
set -uo pipefail
[ $# -ge 1 ] || { echo "  view-refs: usage: view-refs.sh <files…>"; exit 2; }
for f in "$@"; do [ -f "$f" ] || { echo "  view-refs: no file at $f"; exit 2; }; done

python3 - "$@" <<'PY'
import re, sys, os
files = sys.argv[1:]
gen, frm, cmd = {}, {}, {}          # generated: source -> [views] · view -> source · view -> command
fcopies, ffrom, fdate = {}, {}, {}  # frozen:    source -> [copies] · copy -> source · copy -> date

DATE = re.compile(r'\b\d{4}-\d{2}-\d{2}\b')

for f in files:
    t = open(f, encoding='utf-8', errors='replace').read()
    for line in t.split('\n'):
        m = re.match(r'>\s*\*\*Generates:\*\*(.*)', line)
        if m:
            gen[f] = re.findall(r'`([^`]+)`', m.group(1))
        m = re.match(r'>\s*\*\*Generated from:\*\*(.*)', line)
        if m:
            spans = re.findall(r'`([^`]+)`', m.group(1))
            frm[f] = spans[0] if spans else None
            cmd[f] = spans[1] if len(spans) > 1 else None
        m = re.match(r'>\s*\*\*Frozen copies:\*\*(.*)', line)
        if m:
            fcopies[f] = re.findall(r'`([^`]+)`', m.group(1))
        m = re.match(r'>\s*\*\*Frozen from:\*\*(.*)', line)
        if m:
            spans = re.findall(r'`([^`]+)`', m.group(1))
            ffrom[f] = spans[0] if spans else None
            d = DATE.search(m.group(1))
            fdate[f] = d.group(0) if d else None

if not (gen or frm or fcopies or ffrom):
    print(f"  view-refs: no marks in {len(files)} file(s) — refusing to call that clean")
    sys.exit(2)

AMBIGUOUS = object()

def same(a, b):
    return os.path.normpath(a) == os.path.normpath(b) or a.endswith('/' + b) or b.endswith('/' + a)

def resolve(p):
    """Exact path first. A bare basename resolves ONLY if it is unambiguous.
    ⚠️ Ten departments own a file called `architecture.md`. The first version of this matched on
    basename and returned the first hit, so a mark could resolve — silently, exit 0 — to a file in
    a different project. A check that can point at the wrong file is worse than no check: it
    reports clean about something it never read. Ambiguity is now the finding."""
    exact = [f for f in files if os.path.normpath(f) == os.path.normpath(p)]
    if exact:
        return exact[0]
    suffix = [f for f in files if same(f, p)]
    if len(suffix) == 1:
        return suffix[0]
    if len(suffix) > 1:
        print(f"  ✗ `{p}` matches {len(suffix)} of the files given — write the path from the root, "
              f"not the name: {', '.join(sorted(suffix)[:4])}{' …' if len(suffix) > 4 else ''}")
        return AMBIGUOUS
    return None

bad = 0

def check_pair(down, up, kindname, downlabel, uplabel):
    """down: view -> source · up: source -> [views]. Both directions, each reported on its own side."""
    global bad
    for src, views in up.items():
        if not views:
            print(f"  ✗ {src} declares {uplabel} and names nothing"); bad += 1
        for v in views:
            hit = resolve(v)
            if hit is AMBIGUOUS:
                bad += 1; continue
            if hit is None:
                print(f"  ✗ {src} {kindname} `{v}` — not among the files given"); bad += 1; continue
            if hit not in down:
                print(f"  ✗ {src} {kindname} `{hit}`, and `{hit}` names no source"); bad += 1
            elif down[hit] is None or not same(down[hit], src):
                print(f"  ✗ {src} {kindname} `{hit}`, but `{hit}` says it comes from `{down[hit]}`"); bad += 1
    for v, src in down.items():
        if src is None:
            print(f"  ✗ {v} declares {downlabel} and names nothing"); bad += 1; continue
        hit = resolve(src)
        if hit is AMBIGUOUS:
            bad += 1
        elif hit is None:
            print(f"  ✗ {v} comes from `{src}` — not among the files given"); bad += 1
        elif not any(same(x, v) for x in up.get(hit, [])):
            print(f"  ✗ {v} comes from `{src}`, and `{src}` does not name it"); bad += 1

check_pair(frm, gen, "generates", "Generated from:", "Generates:")
check_pair(ffrom, fcopies, "has a frozen copy at", "Frozen from:", "Frozen copies:")

# Each kind carries the one field the other cannot supply.
for v in frm:
    if cmd.get(v) is None:
        print(f"  ✗ {v} names a source and no command to regenerate it — if none exists it is frozen, not generated"); bad += 1
for v in ffrom:
    if fdate.get(v) is None:
        print(f"  ✗ {v} is declared frozen and carries no date — *frozen* with no *when* answers nothing"); bad += 1

# A file may not be both kinds of copy of the same source: the two have opposite conflict rules.
for v in set(frm) & set(ffrom):
    if frm[v] and ffrom[v] and same(frm[v], ffrom[v]):
        print(f"  ✗ {v} is declared BOTH generated from and frozen from `{frm[v]}` — the two disagree on who wins"); bad += 1

if bad:
    print(f"  view-refs: {bad} mark(s) that do not resolve both ways")
    sys.exit(1)
print(f"  clean — generated: {len(gen)} source(s)/{len(frm)} view(s) · "
      f"frozen: {len(fcopies)} source(s)/{len(ffrom)} copy(ies) · every mark resolving both ways")
PY
