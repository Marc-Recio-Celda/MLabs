---
name: correct-exercise
description: Reviews coursework the operator has already written, the way the evaluator reads it. Use when a finished exercise, a submitted solution or existing code arrives to be corrected, improved, or put through a levelled code analysis.
---

# correct-exercise

Finished work read **the way the evaluator reads it**. The stance is critical throughout;
pedagogical support belongs to `learn`.

> **Session contract: `skills/coursework.md`** — the ephemeral session, the reads, the source gate,
> citation, the gap-to-mailbox line, the hand-back.

## Occasion
- Finished work arrives: an exercise, a submitted solution, a script, a body of code.
- The operator asks what is wrong with it, for a stronger version of it, or for a code analysis.

⛔ **Work generated in this same conversation is reviewed in a new one**, with the artefact as its
only input (`MLabs:AX-13`).

## Its three modes

**`correct` — the prioritised report.** Concept errors, method errors, code errors, imprecisions,
what is absent, what loses marks. **One row per finding: where it is → what is wrong → why → how to
fix it**, ordered by what it costs. ⚠️ **It points out and explains; the rewrite is `improve`.**

**`improve` — the stronger version.** Starts from work already correct and returns a better one:
better method, cleaner, more idiomatic, better justified. **Every change is marked with what changed
and why, because the delta is the part that teaches** (`MLabs:AX-40`). Solving from scratch is
`learn`.

**`analyze` — the levelled sweep.** Independent levels, requested one at a time or in full:

| | |
|---|---|
| **L1** format and style · **L2** naming · **L3** documentation · **L4** data structures · **L5** logic and readability | **L6** robustness · **L7** performance · **L8** reproducibility · **L9** architecture and scalability · **L10** idiomatic use of the language, where it has a distinct idiom |

Short code inline; a long or multi-level sweep as its own file.

⛔ **A finding with no location is not written** (`MLabs:AX-6`).

## Its prediction

**Every finding is written as a prediction the operator can falsify by running something:** this
cell raises here, this figure is off by this much, this test fails on this input.

**For `improve` the prediction is comparative:** the improved version runs on the same input and
**returns the same result as the original, differing only where the report says it should.**

⚠️ **A criticism that cannot be stated as a prediction that would fail is marked a judgement call.**

## Where the gaps come from

**This is the audit's most natural feed: real errors from evaluated work, each traceable to the note
that should have prevented it.** A finding so traceable is flagged inline as it is crossed and
compiled into the hand-back block (`skills/coursework.md`).

## Its boundary

Per `skills/coursework.md`. On top of it: **solving from a problem statement is `learn`**, **the
criticism goes deep and encouragement is not its job**, and **under `correct` the artefact is
explained rather than rewritten.**
