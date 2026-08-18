---
name: redefine-project
description: Brings a project's definition, plan and state back in line with what the work has actually become, when its cartridge has drifted from reality. Use when a project's blocks no longer describe the work, when its state is several decisions behind, when the next action names something already done, or when opening a project and not recognising it. Invoked by the operator; never fires on its own. Rewrites the definition and the state, appends a decision, and never touches another project.
---

> **Version:** MLabs 1.1.0

# redefine-project

**`structure-project` opens a cartridge. This closes the gap that opens afterwards.** A project is
defined once, at its least informed moment, and then the work teaches things that never travel back
into the definition. Six months later the plan describes a project nobody is doing.

## Why this is not the auditor's job

**A role paid to find faults must not be invited to fix them by redesign.** An auditor that may
redefine the project it audits starts finding exactly the problems its redesign resolves — and
nothing in the output distinguishes a real finding from a justification. That is the same wall
between `rnd` and `audit`, one floor down (`AX-4`).

**The division that matters:** the auditor says *this is not true any more*. This skill decides
*what is true instead*. The first is evidence; the second is a decision, and decisions are the
operator's with an agent holding the pen.

## When it is invoked

| Symptom | What it usually means |
|---|---|
| The blocks no longer describe the work | the plan was written before the shape was known, and the shape moved |
| `state.md` is several decisions behind | nothing in the close touches it, so it decays silently |
| The next action names something already done | the state is a photograph nobody re-took |
| Opening the project and not recognising it | the definition describes an ancestor of this project |
| A decision changed the scope and the definition never absorbed it | the log grew and the standing files did not |

**None of these fires it.** The operator does, because deciding a project has drifted is a judgement
about what the project is *for*, and that is not something a symptom can settle.

## The procedure

**1. Read the whole cartridge, and the decisions last.** `definition.md` · `architecture.md` ·
`state.md` · `Decision_Log.md`, plus the project's rows in the compass and the queue. The decisions
come last on purpose: they are the record of what the project *learned*, and reading them first
makes everything else look like it already agrees with them.

**2. Name the drift, per file, with evidence.** Not *"it is out of date"* — which line, against which
decision or which artefact on disk. **A drift you cannot cite is a preference.**

**3. Separate the three things drift turns out to be.** They have different destinations and mixing
them is what makes redefinition feel like rewriting history:

| It is… | When | Where it goes |
|---|---|---|
| **The definition was wrong** | the project is doing something the definition never described | rewrite `definition.md`; the old text is **quoted in the decision**, not deleted silently |
| **The definition was right and the work drifted** | the work wandered, the definition still names what is wanted | ⚠️ **not a redefinition.** Say so and stop — the fix is the work, and the operator decides |
| **Both were right at different times** | the project genuinely changed purpose | a new iteration, with the old definition kept as the record of the first |

**4. Rewrite the standing files, and only those.** `definition.md` and `state.md` are Standing — they
describe the present and are rewritten to stay true. `architecture.md` may gain an axiom or retire
one (which fires the saturation review). **`Decision_Log.md` is a Record and is append-only: the
redefinition is a new `Dn`, never an edit.**

**5. Write the decision that records the change**, carrying what the previous definition said, what
it says now, and **what was discarded** — including the shapes considered and rejected for the new
one. A redefinition with no discarded alternatives is a rewrite pretending to be a decision.

**6. Correct the compass row and the queue.** A redefined project usually has fronts that no longer
exist and tasks whose premise is gone. **Each one leaves with a destination** — resolved, discarded
with its reason, or carried — and a task whose premise the redefinition just falsified is **stopped
and said so**, not silently deleted (`AX-14`).

## What it must not do

- **Touch another project.** Drift is contagious to read and expensive to fix in bulk; one cartridge
  per invocation, and a second one that clearly needs it is reported, not done.
- **Delete the record.** The old definition survives inside the decision that replaced it (`PH-3`).
- **Invent work.** Redefinition describes what the project *is*; adding what it should now do is a
  separate act with a separate name.
- **Fire the audit.** It changes structural files, so the operator may want one afterwards — but
  this skill does not summon its own reviewer, which is the same conflict of interest §*Why this is
  not the auditor's job* describes, seen from the other side.

## Verification, as a prediction

State these before rewriting anything, then run them:

| # | Prediction |
|---|---|
| 1 | Every claim of drift cites a file and line, or a decision identifier |
| 2 | `Decision_Log.md` has exactly one new entry and no edited one — `git diff` shows additions only |
| 3 | The new `definition.md` quotes what the old one said where it changed |
| 4 | `state.md` answers *would this still be true if work stopped today?* on every line |
| 5 | Every compass row and queue entry the redefinition invalidated has left with a destination |
| 6 | The project's own `architecture.md` still holds — or an axiom was retired **explicitly**, with the saturation review that entails |

## Dismissal

⚠️ **Its own criterion, fixed before the first invocation** (`AX-11`), and it is unusual because the
success condition is the skill being needed *less*:

**Retired if, after five invocations, drift keeps arriving at the same rate.** That would mean the
cartridges rot faster than this repairs them, and the answer is not a better repair — it is that
something in the close is failing to keep them current, which is a different fix in a different
place. **The tally is invocations against the interval between them:** if the intervals are not
lengthening, this skill is treating a symptom.
