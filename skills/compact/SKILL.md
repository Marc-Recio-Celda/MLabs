---
name: compact
description: Crushes an artefact's text without changing what it says, and reports every reference that no longer resolves — archaeology written into a file instead of its log, dangling identifiers, dead paths and wikilinks, stale counts, text in the wrong language. Runs over what changed since the last pass. Use before a release cut, before a pull request, after a long session that touched structural files, or whenever a reader who has never seen this repository is about to read it.
---

> **Version:** MLabs 1.1.0

# compact

**It makes what is there take less room; it never decides what belongs.** *(the operator,
2026-08-21: "como cuando aplastas el contenido de la basura para que quepan más cosas — sobre sacar
o meter cosas en la basura ya se encargan otros.")*

**This is the pass that exists so several rules do not have to fire on every turn** (`AX-4`: if a
pass over the finished artefact can apply it, it is a tool, not an axiom). ⚠️ **It replaces
`code-cleanup`, which did the same four jobs for code only** — the jobs never depended on the file
type, and two skills would have been the same contract twice (`AX-20`).

## Fires when

A release cut · a pull request · after a session that touched structural files · whenever a stranger
is about to read the repository. **The operator invokes it; nothing auto-fires.**

**Not while writing.** That is the whole point: the author writes freely, citing evidence wherever
it is cheapest, and this runs once at the end and puts it where it belongs.

## Scope — what changed since the last pass, and git is the log

```bash
LAST=$(git tag --list 'compact-*' | sort | tail -1)     # the last pass, or empty
git diff --name-only "${LAST:-$(git rev-list --max-parents=0 HEAD)}"..HEAD
```

⚠️ **No new bookkeeping file.** *(the operator: "solo se debe mantener el log de lo que ha cambiado
desde la última limpieza, lo cual git lleva bien.")* The pass ends by tagging `compact-<YYYY-MM-DD>`,
and that tag is the entire record of when it last ran. **If the tag is missing the pass runs over
everything**, which is correct and says so rather than guessing a range.

**Records are excluded, always.** A log, a decision store, an append-only ledger is *supposed* to
accumulate — running a growth pass over one fires on the shape that is working.

## The four jobs

### 1 · Archaeology → relocate, do not delete

The expensive one, because it compounds: **a document carrying its own changelog becomes unreadable
at exactly the length where it matters, and the reader who pays is the one who arrives latest and
knows least** (`AX-29`).

| Goes | Stays |
|---|---|
| *"this used to be X"* · *"corrected on…"* · *"replaces the old…"* | a constraint that bites **today** |
| an intention that never landed | **a trap someone can still fall into** |
| a description of *what* the code or rule does | *why* it is that way |
| a header explaining a file's evolution | a note beside the line it explains |

**The asymmetry that decides it:** a reader reconstructs *what* from the artefact and can never
reconstruct *why*. And the *what* comments rot fastest, because the thing moves underneath them.

⚠️ **Relocate in this order and stop at the first that applies:** the file's own `## Notes` section,
addressed by the id it belongs to · the decision log · deletion, **only if the log already holds
it.** *A pass can strip archaeology but cannot tell whether it was ever logged*, and deleting
unlogged history is the one loss `PH-3` forbids (`AX-23`: nothing is deleted, it is located).

### 2 · References that no longer resolve

**Every cross-reference is followed, not read.** This is the half that finds dead traces of things
that were deleted properly and left pointers behind.

| Class | The check |
|---|---|
| an identifier — `AX-n`, `PH-n`, `Dn`, `M-n`, `Tn` | the id exists, and is not ⚫ retired while cited as live |
| a path | the file exists at that path from the declared root |
| a wikilink `[[Note]]` | **in a code repository: wrong whatever it resolves to**, because it renders as literal brackets. **In the method repository: skipped** — here they are vocabulary being specified, not references being made |
| a section reference `§n` | that section exists in that file |
| a stated count | recomputed and compared, never read |

⚠️ **The wikilink rule needed narrowing three times on its first run, and each time for a real
reason.** It reported **21** hits in markdown — every one legitimate, because `create-note` writes
wikilinks by design and this file quotes the pattern it forbids. Narrowed to code, it reported
**10** — every one a POSIX character class, `[[:space:]]`, which a wikilink pattern cannot tell from
`[[Note]]`. Narrowed again, **4** — bash `[[ ]]` test expressions. **The rule is: never on shell,
never on the method repository's markdown**, and it is `.py`/`.js`/`.css`/`.html` only.
**A check that fires on the file documenting the format is the cries-wolf failure**, and this one was
caught before it shipped rather than after.

✅ **The rest of job 2 ran clean over the public set on the same pass** — every axiom id, philosophy
clause, declared path and `§` reference resolves — **and all four classes fired on a plant**
(`AX-99`, `PH-9`, `skills/nope/`, `METHOD.md §77`), which is what makes the clean result mean
something.

⚠️ **`\b` does not match before `§`**, which is not a word character — a word-boundary search
silently misses every section reference. Plant one before trusting a clean result (`AX-7`).

### 3 · Identifiers that only resolve inside the operator's own base

To a reader without it, `M-42` is a **dangling pointer**: it announces that an explanation exists
and then fails to provide it. **Rewrite it as the reason it stood for, or drop it.** Never leave the
identifier and add a gloss — that is two dangling pointers.

**In the public set only.** Instance-side, those ids resolve and are the point.

### 4 · Text not in the artefact's declared language

Comments, docstrings, log strings, error messages. **Translate rather than delete** — the content
was worth writing.

## The procedure

1. **Scope it** from the tag, and **say the file list before touching anything.**
2. **Measure first:** bytes per file now, and at `LAST`. **A structural file that only ever grows is
   being written for its authors** — that number is the finding even when no single line is.
3. **Search each class separately and report counts before changing anything.**
4. ⚠️ **Test each pattern against a planted hit first.** A pattern that cannot match returns clean
   on a file full of them, and clean output is indistinguishable from a clean repository (`AX-7`).
5. **Relocate, do not only delete** — job 1's order, every time.
6. **Land it as its own commit** from a clean tree, then **tag `compact-<date>`**.

## Verification, as a prediction

State it before running: *this pass touches N files, relocates A archaeology blocks, fixes B dead
references, removes C private identifiers and D non-English strings, and **changes nothing any
artefact asserts.***

- **For code: byte-identical build output** where the language allows it — identical bundle hash,
  identical compiled artefact. That is the proof that only comments moved. Otherwise the test suite
  passing unchanged.
- **For prose: the operative layer shrinks and the notes layer grows by less.** If total bytes fall
  by more than the notes gained, **something was deleted rather than relocated** — that is the
  failure this check exists to catch, and it is countable.
- **Run it a second time: it returns nothing.** A pass that still finds hits either missed them or
  created them.

## What it does not do

- **It does not decide what belongs.** Not a rule's worth, not a note's worth, not whether a
  constraint is real. **Where a line might be load-bearing, it asks.** Deciding is the auditor's,
  and this skill reasons about *placement* only.
- **It does not resolve a contradiction it finds.** A rule citing an abolished clause is reported,
  not fixed — the fix is a decision.
- **It does not touch Records**, or a repository the operator does not own (`AX-19`).
- **It does not reformat, rename or change behaviour.**

## Retirement

**When the notes layer stops filling** — if three consecutive passes relocate nothing, authors are
writing both halves in the same act as `AX-29` asks, and the pass is measuring a habit that no
longer exists. ⚠️ **Its other end:** if job 2 keeps finding dead references that a check could have
caught at write time, that check belongs in the gate and this skill is doing a gate's work.
