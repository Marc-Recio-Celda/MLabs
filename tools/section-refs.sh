#!/usr/bin/env bash
# A cited section number resolves to a heading that exists.
#
#   bash tools/section-refs.sh <files…>
#
# `axiom-refs.sh` proves an `AX-n` resolves and `clause-refs.sh` proves a `PH-n` does. **Nothing
# proved a `§n` did**, while `skills/release-cut/` §3 claimed the axiom check covered it — a
# published check that cannot match, which is this company's most repeated defect. It found three
# on the round it was written, and every one was written by whoever had just dissolved the section
# it cites.
#
# WHAT IT READS, and every form here is in use:
#   a file        `METHOD.md` §2 · `MLabs:AGENTS.md` §4 · AGENTS.md §5
#   a skill       `skills/compact/` §1 · `open-session` §5 — both resolve to that skill's SKILL.md
#   bare          §5 — resolved against the file it appears in
# A run of numbers after one name is read whole: `§2 and §7`, `§2/§7`, `§2, §7`, `§2 step 1b`.
#
# WHAT COUNTS AS A SECTION, because three notations are in use and a check that knew one would
# report the other two as missing:
#   `## 2. Name`   `## 1 · Name`   `**6b. Name**`   — and n may carry a letter, since `METHOD.md`
#   numbers a step `1b` rather than renumbering every reference to the steps after it.
#
# PREMISES, and either one wrong makes every result meaningless:
#   A. A file target is identified by BASENAME. Two files of one name in a run collapse, which is
#      why a run is given one repository's tracked set and not a tree of several.
#   B. A citation whose target is not among the inputs cannot be checked here. It is COUNTED AND
#      PRINTED rather than skipped (`AX-6`, `AX-22`): a cross-repository citation is unverifiable
#      from this side by construction, and silence about it reads exactly like a pass.
#
# TRAPS, each proven by a plant: a section that exists in ANOTHER file is the shape a copied
# paragraph takes, and it fails on the file that cites it · **`§` is not a word character, so `\b`
# does not match before it** and a word-boundary search silently misses every reference — this uses
# no boundary · a fenced code block is not prose and is stripped before anything is read.
# Exit 0 clean · 1 a citation that does not resolve · 2 could not run, which is NOT a pass.
set -uo pipefail
[ $# -ge 1 ] || { echo "  section-refs: usage: section-refs.sh <files…>"; exit 2; }
for f in "$@"; do [ -f "$f" ] || { echo "  section-refs: no file at $f"; exit 2; }; done

python3 - "$@" <<'PY'
import re, sys, os
files = sys.argv[1:]

HEAD = re.compile(r'^#{2,3}\s+(\d+[a-z]?)\s*[.·]')
BOLD = re.compile(r'^\*\*(\d+[a-z]?)\s*[.·]')
have, text, skill = {}, {}, {}
for f in files:
    t = open(f, encoding='utf-8', errors='replace').read()
    text[f] = t
    key = os.path.basename(f)
    if key == 'SKILL.md':
        key = os.path.basename(os.path.dirname(f))     # a skill is addressed by its directory
        skill[key] = f
    have.setdefault(key, set()).update(
        m.group(1) for line in t.split('\n')
        for m in [HEAD.match(line) or BOLD.match(line)] if m)

# A target, then the run of §n that follows it. A target is BACKTICKED (where a scope, a
# `skills/` prefix, a `.md` suffix and a trailing slash are all optional) or a bare `Name.md`.
# ⚠️ Anything looser matches the ordinary word before a bare §n and reports it as a file.
NAMED = re.compile(
    r'(?:`(?:[A-Za-z][A-Za-z0-9]*:)?(?:skills/)?([A-Za-z_][A-Za-z0-9_.-]*?)(?:\.md)?/?`'
    r'|(?<![`/\w])([A-Za-z_][A-Za-z0-9_-]*\.md))'
    r'((?:\s|\*\*|and|,|/|·|§\d+[a-z]?|step\s+\d+[a-z]?){0,40}?§\d+[a-z]?'
    r'(?:(?:\s|\*\*|and|,|/|§\d+[a-z]?){0,12})?)')
RUN = re.compile(r'§(\d+[a-z]?)')

def resolve(name):
    for k in (name, name + '.md'):
        if k in have:
            return k
    return None

bad, outside, checked = [], {}, 0
for f in files:
    self_key = os.path.basename(os.path.dirname(f)) if os.path.basename(f) == 'SKILL.md' \
               else os.path.basename(f)
    t = re.sub(r'```.*?```', '', text[f], flags=re.S)
    claimed, spans = [], []
    for m in NAMED.finditer(t):
        name = m.group(1) or m.group(2)
        spans.append(m.span())
        for s in RUN.findall(m.group(3)):
            claimed.append((name, s, m.start()))
    for m in RUN.finditer(t):                                   # bare §n → the file it is in
        if not any(a <= m.start() < b for a, b in spans):
            claimed.append((self_key, m.group(1), m.start()))
    for target, sec, at in claimed:
        line = t[:at].count('\n') + 1
        key = resolve(target)
        if key is None:
            outside[target] = outside.get(target, 0) + 1
            continue
        checked += 1
        if sec not in have[key]:
            bad.append(f"  ✗ {f}:{line} cites `{key}` §{sec} — that file has no such section"
                       f" (it has {', '.join(sorted(have[key])) or 'no numbered section at all'})")

if not checked and not outside:
    print(f"  section-refs: no §n citation in {len(files)} file(s) — refusing to call that clean")
    sys.exit(2)

for line in bad:
    print(line)
if outside:
    print(f"  · {sum(outside.values())} citation(s) name a target outside this run, unverifiable"
          f" here: {', '.join(f'{k}×{v}' for k, v in sorted(outside.items()))}")
if bad:
    print(f"  section-refs: {len(bad)} citation(s) that do not resolve, out of {checked} checked")
    sys.exit(1)
print(f"  clean — {checked} §n citation(s) resolve to a heading that exists")
PY
