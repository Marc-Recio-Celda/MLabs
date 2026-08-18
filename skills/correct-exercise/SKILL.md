---
name: correct-exercise
description: Reviews work the operator has already written — invoke when a finished exercise, a submitted solution, or existing code arrives to be corrected, improved, or put through a levelled code analysis; if the work does not exist yet and only a problem statement does, invoke learn instead.
---

> **Version:** MLabs 1.1.0

# correct-exercise


Finished work read the way the evaluator reads it, in an ephemeral session: no persistent state,
no project layer. The stance is critical throughout — pedagogical support belongs to `learn`.

> ⚠️ **This skill feeds the knowledge base and never writes to it.** One named door creates and
> edits notes (`NEXUS:AX-4`), and it is not this one. Every gap a correction exposes leaves as a
> **mailbox line — one line, unfixed** (`MLabs:AX-25`), and the operator triages it, never this
> skill (`MLabs:AX-15`). A note that arrives any other way is indistinguishable from real
> knowledge to every later sweep.

## Fires when

- Finished work arrives: an exercise, a submitted solution, a script, a body of code.
- The operator asks what is wrong with it, for a stronger version of it, or for a code analysis.
- **Does not fire on a problem statement with no solution** — that is `learn`.
- **Does not fire on work generated in this same conversation.** Verification never shares a role
  with generation, so review starts a new conversation with the artefact as its only input
  (`MLabs:AX-13`).

## Reads, in this order

1. **The instance binding** — it pins the rule set in force and supplies every path below.
   Nothing here is guessed from file type or location (`NEXUS:AX-3`).
2. **The flat inventory of the knowledge base**, always — so a finding can be traced back to the
   note that should have prevented it, without loading an index or any note body
   (`MLabs:AX-21`).
3. **The work under review**, exactly as submitted, with nothing normalised on the way in.
4. **One domain's notes, on demand only**, once the source gate puts them in scope. Anything
   opened outside the row the index pointed at is declared and logged as a repair to the index
   (`MLabs:AX-21`).

## Procedure

1. **Fix the mode in one line**: `correct`, `improve`, or `analyze`.
2. **Run the source gate** before judging anything, and record the answer at the head of the
   report: the syllabus as given · the knowledge base · external sources, each marked as outside
   the syllabus. A correction resting on an unstated standard is an opinion (`MLabs:AX-6`).
3. **`correct` — the prioritised report.** Concept errors, method errors, code errors,
   imprecisions, what is absent, what loses marks. One row per finding: **where it is (file,
   cell, line, or section) → what is wrong → why → how to fix it**, ordered by what it costs. It
   points out and explains; the rewrite is `improve`.
4. **`improve` — the stronger version.** Starts from work already correct and returns a better
   one: better method, cleaner, more idiomatic, better justified. **Every change is marked with
   what changed and why**, because the delta is the part that teaches (`MLabs:PH-2`). It does not
   solve from scratch — that is `learn`.
5. **`analyze` — the levelled sweep.** Independent levels, requested one at a time or in full:
   L1 format and style · L2 naming · L3 documentation · L4 data structures · L5 logic and
   readability · L6 robustness · L7 performance · L8 reproducibility · L9 architecture and
   scalability · L10 idiomatic use of the language, where the language has a distinct idiom.
   Short code inline; a long or multi-level sweep as its own file.
6. **Cite to the exact location in every mode** (`MLabs:AX-6`) — the submitted work by file, cell
   or line; the syllabus as `[document · module or section · page]`; the knowledge base as
   `[[note#section]]`. **A finding with no location is not written.** A missing syllabus detail is
   requested from the operator and pasted in, never reconstructed.
7. **Turn every gap into a signal.** A finding traceable to the knowledge base is flagged inline
   at the moment it is crossed and compiled, at the end, into a hand-back block — one line each:
   **what came up + the case that evidences it → the affected note, or *does not exist* → the
   suggested action** (clarify · correct · extend · create). Those lines go to the mailbox,
   unfixed and uninvestigated (`MLabs:AX-25`). This is the audit's most natural feed: real errors
   from evaluated work, each traceable to a gap.
8. **Hand back**: the report, the mailbox block, and every open thread with its destination —
   each read back from disk before it is called written (`MLabs:AX-9`).

## Verification, stated as a prediction

Every finding is written as a prediction the operator can falsify by running something: this
cell raises here, this figure is off by this much, this test fails on this input. For `improve`,
the prediction is comparative and explicit — **the improved version runs on the same input and
returns the same result as the original, differing only where the report says it should.** The
operator runs it and returns the real output, and **the gap between the prediction and that
output is the finding** (`MLabs:AX-14`). A criticism that cannot be stated as a prediction that
would fail is marked a judgement call, not an error (`MLabs:AX-6`).

## What this does not do

- **Create or edit a note in the knowledge base** — one named door, and this is not it
  (`NEXUS:AX-4`).
- **Investigate or fix a gap it finds**, however small (`MLabs:AX-25`).
- **Drain or triage the mailbox it fills** (`MLabs:AX-15`).
- **Solve from a problem statement** — that is `learn`.
- **Soften the criticism.** The review goes deep; encouragement is not its job.
- **Rewrite the whole artefact under `correct`.** There it points out and explains.
- **Offer divergent proposals**: this is precision work, and they are silenced in it
  (`NEXUS:AX-13`).
- **Carry project state.** No compass, no plan, no decision log: coursework is not a project
  (`NEXUS:AX-2`).
