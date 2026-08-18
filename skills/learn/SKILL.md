---
name: learn
description: Works a coursework exercise forward from its problem statement so the operator reaches both the deliverable and the understanding — invoke when an unsolved assignment, problem set, or exam question arrives and the operator wants a worked guide, a submittable solution, or a taught concept; if the work is already written, invoke correct-exercise instead.
---

> **Version:** MLabs 1.0.0

# learn


Coursework worked forward from a **problem statement**, in an ephemeral session: no persistent
state, no project layer, nothing survives but the deliverable and what leaves through the mailbox.

> ⚠️ **This skill feeds the knowledge base and never writes to it.** One named door creates and
> edits notes (`NEXUS:AX-4`), and it is not this one. Every gap this session exposes leaves as a
> **mailbox line — one line, unfixed** (`MLabs:AX-25`), and the operator triages it, never this
> skill (`MLabs:AX-15`). A note that arrives any other way is indistinguishable from real
> knowledge to every later sweep.

## Fires when

- An unsolved problem statement, problem set, or exam question arrives.
- The operator asks for a worked guide, a clean deliverable, or a concept explained.
- **Does not fire on work already written** — that is `correct-exercise`, and it opens its own
  conversation (`MLabs:AX-13`).

## Reads, in this order

1. **The instance binding** — it pins the rule set in force and supplies every path below.
   Nothing here is guessed from file type or location (`NEXUS:AX-3`).
2. **The flat inventory of the knowledge base**, always — what notes exist, so the work can cite
   and route without loading an index or any note body (`MLabs:AX-21`).
3. **The problem statement and its syllabus**, as the operator supplies them.
4. **One domain's notes, on demand only**, and only once the source gate puts them in scope.
   Anything opened outside the row the index pointed at is declared, and the gap is logged as a
   repair to the index (`MLabs:AX-21`).

## Procedure

1. **Fix the mode in one line.** `guide` — the teaching pass, and the default when nothing is
   named. `solve` — the deliverable alone. The teaching stances (`lesson`, `socratic`, `exam`)
   are opt-in and are never adopted unasked.
2. **Run the source gate before solving anything**, and record the answer at the head of the
   output:
   - **A · statement and syllabus only** — exam conditions.
   - **B · + the knowledge base** — the operator's own notes, loaded one domain at a time.
   - **C · + external sources** — best available, each marked as outside the syllabus.

   Combinable. The gate is not a formality: it fixes what the solution rests on, and therefore
   what counts as a gap in step 6.
3. **Load exactly what the gate authorises, and nothing beyond it.**
4. **Cite to the exact location, or mark the claim unsourced** (`MLabs:AX-6`) — syllabus as
   `[document · module or section · page]`, knowledge base as `[[note#section]]`, external with
   its full reference and the outside-the-syllabus mark. A detail that is missing is requested
   from the operator and pasted in; it is never reconstructed from memory, and one missing detail
   never blocks the rest.
5. **Produce the output.**
   - `guide` — header (course, assignment, data, environment with versions) → work map table
     (section · task · weight · concepts and notes) → setup block with every line commented and
     reproducibility fixed → per section: *what it asks* → *why it matters* → fully commented
     code → an **empty observation-and-interpretation template** → wrap-up comparison and
     discussion skeleton → submission checklist → the map back to the knowledge base. Code is
     never withheld: **the transcription is handed over, the judgement is left** (`MLabs:PH-2`).
   - `solve` — same gate, same citations, none of the scaffolding.
   - At any fork, the options with their trade-offs and one contextualised recommendation, which
     is the one carried into execution (`NEXUS:AX-14`).
6. **Turn every gap into a signal.** Solving under gate B and comparing against the optimal
   solution is a stress test of the knowledge base: wherever the notes cannot reach the good
   answer, that is a gap. Each becomes one mailbox line — **what was needed + the case that
   evidences it → the note that should have held it, or *does not exist* → the suggested action**
   (clarify · correct · extend · create). Written at the moment it is crossed; the work does not
   stop for it and nothing is fixed in passing (`MLabs:AX-25`).
7. **Hand back**: the deliverable, the mailbox lines, and every open thread with its destination
   — each read back from disk before it is called written (`MLabs:AX-9`).

## Verification, stated as a prediction

The solution is handed over with **the prediction of what a correct run produces**, before the
operator runs anything: the code executes top to bottom in a clean session, the fixed seed
reproduces the stated numbers, the named objects exist with the stated shapes, the reported
figures match. The operator runs it and returns the real output, and **the gap between the
prediction and that output is the finding** (`MLabs:AX-14`). A step whose prediction cannot be
stated is not understood well enough to hand over — say so rather than ship it silently
(`MLabs:AX-6`).

## What this does not do

- **Create or edit a note in the knowledge base** — one named door, and this is not it
  (`NEXUS:AX-4`).
- **Investigate or fix a gap it finds**, however small (`MLabs:AX-25`).
- **Drain or triage the mailbox it fills** (`MLabs:AX-15`).
- **Correct work already written** — that is `correct-exercise`, in its own conversation
  (`MLabs:AX-13`).
- **Withhold code, or take a Socratic stance unasked.** Transparency is the default; teaching
  stances are requested.
- **Offer divergent proposals** during a factual query or a precision pass (`NEXUS:AX-13`).
- **Carry project state.** No compass, no plan, no decision log: coursework is not a project
  (`NEXUS:AX-2`).
