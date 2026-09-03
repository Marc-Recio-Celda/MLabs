#!/usr/bin/env bash
# The same sentence does not live in two structural files.
#
#   bash tools/dup-prose.sh [-n <words>] <file> <file> [files…]
#
# `AX-20`'s general form, for the case that needs no generator: not one fact rendered two ways,
# but the same prose typed twice. A copy looks authoritative, is never regenerated, and drifts
# without either side becoming wrong-looking — which is why `AX-33` says a rule is **cited by id
# and never paraphrased**. Copied verbatim is the worse case of the two, because it reads as
# agreement right up to the day the source changes.
#
# PREMISES, and either one wrong makes every result meaningless:
#   A. Prose is compared, not vocabulary: code spans are stripped before anything is counted, so
#      a shared identifier, path or command is never a hit. A rule cited by id is the compliant
#      shape and must not be reported.
#   B. A run of <words> lowercase words shared by two files is a copy. Below about six, ordinary
#      English collides; the default is eight.
#
# TRAPS, each proven by a plant: a quoted clause is still a copy and is reported — quoting a
# philosophy clause inside an axiom is exactly how the two drift · a table row repeated in two
# files reads as two rules and is one · overlapping runs from one long copy are collapsed to the
# longest, so a paragraph reports once rather than forty times.
# Exit 0 clean · 1 duplicated prose · 2 could not run, which is NOT a pass.
set -uo pipefail
N=8
while [ $# -gt 0 ]; do
  case "$1" in
    -n) N="${2:-}"; shift 2 ;;
    *) break ;;
  esac
done
[ $# -ge 2 ] || { echo "  dup-prose: usage: dup-prose.sh [-n <words>] <file> <file> [files…]"; exit 2; }
case "$N" in ''|*[!0-9]*) echo "  dup-prose: -n takes a number"; exit 2 ;; esac
for f in "$@"; do [ -f "$f" ] || { echo "  dup-prose: no file at $f"; exit 2; }; done

python3 - "$N" "$@" <<'PY'
import re, sys, itertools
from collections import defaultdict
n = int(sys.argv[1]); files = sys.argv[2:]

def words(path):
    t = open(path, encoding='utf-8').read().lower()
    t = re.sub(r'`[^`]*`', ' ', t)          # premise A: vocabulary is not prose
    return re.findall(r"[a-z']+", t)

W = {f: words(f) for f in files}
if not any(len(v) >= n for v in W.values()):
    print(f"  dup-prose: no file has {n} words of prose — refusing to call that clean"); sys.exit(2)

index = defaultdict(set)
for f, w in W.items():
    for i in range(len(w) - n + 1):
        index[' '.join(w[i:i + n])].add(f)

# collapse overlapping runs: report the longest span of each copied passage, once per pair
hits = defaultdict(list)
for f, w in W.items():
    i = 0
    while i <= len(w) - n:
        sh = ' '.join(w[i:i + n])
        others = index[sh] - {f}
        if others:
            j = i
            while j <= len(w) - n and (index[' '.join(w[j:j + n])] - {f}) & others:
                j += 1
            span = ' '.join(w[i:j + n - 1])
            for o in others:
                if f < o: hits[(f, o)].append(span)
            i = j
        else:
            i += 1

total = 0
for (a, b), spans in sorted(hits.items()):
    print(f"  ✗ {a} ↔ {b}")
    for s in spans:
        total += 1
        print(f"      {s if len(s) <= 150 else s[:147] + '…'}")
if total:
    print(f"  dup-prose: {total} passage(s) of {n}+ words living in two files")
    sys.exit(1)
print(f"  clean — no run of {n} prose words is shared by two of the {len(files)} files")
PY
