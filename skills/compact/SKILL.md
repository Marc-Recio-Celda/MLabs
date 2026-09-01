---
name: compact
description: Crushes an artefact's text without changing what it says, and reports every reference that no longer resolves — archaeology written into a file instead of its log, dangling identifiers, dead paths and wikilinks, stale counts, text in the wrong language. Runs over what changed since the last pass. Use before a release cut, before a pull request, after a long session that touched structural files, or whenever a reader who has never seen this repository is about to read it.
---

> **Version:** MLabs 1.1.0

# compact

**It makes what is there take less room; it never decides what belongs.** *(the operator: "como
cuando aplastas el contenido de la basura para que quepan más cosas — sobre sacar o meter cosas en
la basura ya se encargan otros.")*

**This is the pass that exists so several rules do not have to fire on every turn** (`AX-4`: if a
pass over the finished artefact can apply it, it is a tool, not an axiom).

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

⚠️ **No new bookkeeping file.** The pass ends by tagging `compact-<YYYY-MM-DD>`, and that tag is the
entire record of when it last ran. **If the tag is missing the pass runs over everything**, which is
correct and says so rather than guessing a range. ⚠️ **Say which of the two happened** — a declared
scope of *everything* and an executed scope of *the files I felt like* are not the same pass.

**Records are excluded, always.** A log, a decision store, an append-only ledger is *supposed* to
accumulate — running a growth pass over one fires on the shape that is working.

## The four jobs

### 1 · Archaeology → the log, not a note in the same file

The expensive one, because it compounds: **a document carrying its own changelog becomes unreadable
at exactly the length where it matters, and the reader who pays is the one who arrives latest and
knows least** (`AX-29`).

| Goes to the log | Stays in the file |
|---|---|
| *"this used to be X"* · *"corrected on…"* · *"replaces the old…"* · any date | a constraint that bites **today** |
| an intention that never landed | **a trap someone can still fall into** |
| a description of *what* the code or rule does | *why* it is that way |
| how many times something was fixed, and by whom | the shape that stops it being fixed again |

⛔ **The test that separates a trap from history: can someone still fall into it?** If what caused
it is fixed structurally, nobody can, and it is history. If the next person writing something
similar can, it is a trap.

⛔ **And a trap does not stay as prose.** `AX-8`: *a rule with no firing event loses to the stream
of requests.* A trap filed in a notes section is read by a review; the moment it bites is when
somebody is **writing the thing**, which is not a review. **So it moves down to where it fires:**

| Trap about | Goes to |
|---|---|
| a tool — a regex, a git behaviour, an allowlist ordering | **the comment on the line that implements it** |
| the method | **the `Check` column of the axiom that governs it** |
| a document's shape | **one line in that document's operative layer, undated** |

⚠️ **Relocate; never delete.** *A pass can strip archaeology but cannot tell whether it was ever
logged*, and deleting unlogged history is the one loss `PH-3` forbids (`AX-23`). **Read the log
first; write what is missing; then strip.**

### 2 · References that no longer resolve

**Every cross-reference is followed, not read.**

| Class | The check |
|---|---|
| an axiom id | `bash tools/axiom-refs.sh <axioms-file> <SCOPE> <files…>` — **exit 0 clean · 1 unresolved · 2 could not run, which is not a pass** |
| a path | the file exists at that path from the declared root |
| a wikilink `[[Note]]` | `.py`/`.js`/`.css`/`.html` **only**. ⚠️ **POSIX `[[:space:]]` and bash `[[ ]]` are indistinguishable from `[[Note]]` to any pattern** — and in the method repository's markdown wikilinks are the vocabulary being specified, not references being made |
| a section reference `§n` | that section exists in that file. ⚠️ **`\b` does not match before `§`**, so a word-boundary search silently misses every one |
| a stated count | recomputed and compared, never read. ⚠️ **A count nothing derives is a count that is already wrong** |

### 3 · Identifiers that only resolve inside the operator's own base

To a reader without it, a decision id is a **dangling pointer**: it announces that an explanation
exists and then fails to provide it. **Rewrite it as the reason it stood for, or drop it.** Never
leave the identifier and add a gloss — that is two dangling pointers.

**In the public set only.** Instance-side they resolve and are the point.

### 4 · Text not in the artefact's declared language

Comments, docstrings, log strings, error messages. **Translate rather than delete** — the content
was worth writing.

## The procedure

1. **Scope it** from the tag, and **say the file list before touching anything.**
2. **Measure first:** operative bytes per file now, and at `LAST`. **A structural file that only
   ever grows is being written for its authors** — that number is the finding even when no single
   line is.
3. **Search each class separately and report counts before changing anything.**
4. ⚠️ **Test each pattern against a planted hit first, and plant against the format rather than
   into it** (`AX-7`). A plant written in the file's own style reproduces the file's own blind spot;
   a plant aimed at one half of a two-part rule proves nothing about the other half.
5. **Read the log, write what is missing, then strip** — job 1's order, every time.
6. **Land it as its own commit** from a clean tree, then **tag `compact-<date>`**.

## Verification, as a prediction

State it before running: *this pass touches N files, moves A archaeology blocks to the log, fixes B
dead references, removes C private identifiers and D non-English strings, and **changes nothing any
artefact asserts.***

- **For code: byte-identical build output** where the language allows it. Otherwise the test suite
  passing unchanged.
- **For prose: no assertion is lost, and that is what is counted — not bytes.** Compression removes
  redundancy, so a net byte fall proves nothing either way. The countable test is **every identifier
  cited before is still cited or deliberately retired, and every bolded rule still appears.**
  ⚠️ **A byte count cannot see a lost claim.**
- **Run it a second time: it returns nothing.** A pass that still finds hits either missed them or
  created them.

## What it does not do

- **It does not decide what belongs.** Not a rule's worth, not a note's worth, not whether a
  constraint is real. **Where a line might be load-bearing, it asks.**
- **It does not resolve a contradiction it finds.** A rule citing an abolished clause is reported,
  not fixed — the fix is a decision.
- **It does not touch Records**, or a repository the operator does not own (`AX-19`).
- **It does not reformat, rename or change behaviour.**

## Retirement

**When the log stops gaining from it** — if three consecutive passes move no archaeology, authors
are writing both halves in the same act as `AX-29` asks, and the pass is measuring a habit that no
longer exists. ⚠️ **Its other end:** if job 2 keeps finding dead references a check could have
caught at write time, that check belongs in the gate and this skill is doing a gate's work.
