---
name: redefine-project
description: Brings a project's definition, plan and state back in line with what the work has actually become, when its cartridge has drifted from reality. Use when a project's blocks no longer describe the work, when its state is several decisions behind, when the next action names something already done, or when opening a project and not recognising it. Invoked by the operator; never fires on its own. Rewrites the definition and the state, appends a decision, and never touches another project.
---

> **Version:** MLabs 1.1.0

# redefine-project

**`structure-project` opens a cartridge. This closes the gap that opens afterwards.** A project is
defined once, at its least informed moment, and then the work teaches things that never travel back
into the definition. **Six months later the plan describes a project nobody is doing.**

## Why this is not the auditor's job

**A role paid to find faults must not be invited to fix them by redesign.** An auditor that may
redefine the project it audits starts finding exactly the problems its redesign resolves — and
nothing in the output distinguishes a real finding from a justification. **The same wall stands
between `rnd` and `audit`, one floor up** (`AX-4`).

**The division that matters:** the auditor says *this is not true any more*. This skill decides
*what is true instead*. **The first is evidence; the second is a decision**, and decisions are the
operator's with an agent holding the pen.

## The block authority — the line is *can it break a citation*, not *who is typing*

| | Can a block reference stop resolving? | |
|---|---|---|
| add a block · add a sub-block · mark done · edit text, dates, next action | **no** — nothing that existed lost its address | **free, and reported** |
| rename · renumber · merge · delete | **yes, and silently** | **`redefine-project`, invoked by the operator** |

**Why the line falls there and not somewhere tidier.** Adding is recoverable by deleting; **deleting
is recoverable only from git, and only by someone who knows to look.** A block is the address a
decision cites six months later, and **an id that stops resolving turns every citation into a
dangling pointer, with nothing in a markdown file complaining.**

**That is the minimum control, and it is one line of `diff`.** ⚠️ **A board that cannot grow while
the work grows is a board people stop updating** — which costs more than the renumbering it was
protecting against, because **a stale board is wrong everywhere at once and a dangling id is wrong
in one place.**

**A restructure may fold and may add. It may not leave a block that existed without an address**
(`PH-3`). Folding is legitimate and often right — a run of closed blocks becoming one closed parent
is a real improvement in a board that has to stay readable — but **the fold is written down: the old
id, the new id, and what absorbed it.**

⚠️ **This skill is not a licence to redefine on the way past.** It is invoked by the operator, for
that project, and **the removal of a block is one of the changes step 5's decision must carry.**

### The check

```bash
# The set of block ids in a state file. Blocks are `### `<ID>` · …` headings.
blocks() { grep -oE '^### `[A-Z]{1,3}[0-9]+`' "$1" | tr -d '#` ' | sort; }

git show HEAD:"$STATE" > /tmp/before.md
D=$(diff <(blocks /tmp/before.md) <(blocks "$STATE"))

echo "$D" | grep '^<' # ⛔ MUST BE EMPTY — an id that existed no longer has an address
echo "$D" | grep '^>' # ✅ fine, and NAMED IN THE REPORT — a block opened while working
```

⚠️ **One-directional on purpose.** Demanding the whole diff be empty forbids the growth the table
above allows — **losses block; additions are reported.**

⚠️ **The addition side is printed, never silent.** *Free* means nobody has to ask; **it does not mean
nobody has to say.** A block that appears with no line in the round's report is how a board acquires
structure nobody decided — the failure at the other end from the one this rule was written for.

⚠️ **Test it against a planted removal before trusting a clean run** (`MLabs:AX-7`), and **plant
against the format**: delete a heading whose id also appears in a sub-block row, so a naive pattern
still finds the string and reports no change.

## When it is invoked

| Symptom | What it usually means |
|---|---|
| The blocks no longer describe the work | the plan was written before the shape was known, and the shape moved |
| `state.md` is several decisions behind | nothing in the close touches it, so it decays silently |
| The next action names something already done | the state is a photograph nobody re-took |
| Opening the project and not recognising it | the definition describes an ancestor of this project |
| A decision changed the scope and the definition never absorbed it | the log grew and the standing files did not |

**None of these fires it.** The operator does, because **deciding a project has drifted is a
judgement about what the project is *for*, and that is not something a symptom can settle.**

## The procedure

**1. Read the whole cartridge, and the decisions last.** `definition.md` · `architecture.md` ·
`state.md` · `Decision_Log.md`, plus the project's rows in the compass and the queue. **The decisions
come last on purpose:** they are the record of what the project *learned*, and reading them first
makes everything else look like it already agrees with them.

**2. Name the drift, per file, with evidence.** Not *"it is out of date"* — which line, against which
decision or which artefact on disk. **A drift you cannot cite is a preference.**

**3. Separate the three things drift turns out to be.** They have different destinations, and mixing
them is what makes redefinition feel like rewriting history:

| It is… | When | Where it goes |
|---|---|---|
| **The definition was wrong** | the project is doing something the definition never described | rewrite `definition.md`; the old text is **quoted in the decision**, not deleted silently |
| **The definition was right and the work drifted** | the work wandered, the definition still names what is wanted | ⚠️ **not a redefinition.** Say so and stop — the fix is the work, and the operator decides |
| **Both were right at different times** | the project genuinely changed purpose | a new iteration, with the old definition kept as the record of the first |

**4. Rewrite the standing files, and only those.** `definition.md` and `state.md` are Standing — they
describe the present and are rewritten to stay true. ⚠️ **Rewritten is not re-created.** Every block
id that existed before the rewrite exists after it, or appears in the fold table of the decision
step 5 writes. `architecture.md` may gain an axiom or retire one — **which fires the saturation
review.** ⚠️ **`Decision_Log.md` is a Record and is append-only: the redefinition is a new entry,
never an edit.**

**5. Write the decision that records the change**, carrying what the previous definition said, what
it says now, and **what was discarded** — including the shapes considered and rejected for the new
one. **A redefinition with no discarded alternatives is a rewrite pretending to be a decision.**

**6. Correct the compass row and the queue.** A redefined project usually has fronts that no longer
exist and tasks whose premise is gone. **Each one leaves with a destination** — resolved, discarded
with its reason, or carried — and **a task whose premise the redefinition just falsified is stopped
and said so**, not silently deleted (`MLabs:AX-14`).

## What it must not do

- **Touch another project.** Drift is contagious to read and expensive to fix in bulk; one cartridge
  per invocation, and a second one that clearly needs it is **reported, not done**.
- **Delete the record.** The old definition survives inside the decision that replaced it (`PH-3`).
- **Invent work.** Redefinition describes what the project *is*; adding what it should now do is a
  separate act with a separate name.
- **Fire the audit.** It changes structural files, so the operator may want one afterwards — but
  **this skill does not summon its own reviewer**, which is the conflict of interest above seen from
  the other side.

## Verification, as a prediction

State these before rewriting anything, then run them:

| # | Prediction |
|---|---|
| 1 | Every claim of drift cites a file and line, or a decision identifier |
| 2 | The decision log has exactly one new entry and no edited one — `git diff` shows additions only |
| 3 | The new `definition.md` quotes what the old one said where it changed |
| 4 | `state.md` answers *would this still be true if work stopped today?* on every line |
| 5 | Every compass row and queue entry the redefinition invalidated has left with a destination |
| **5b** | **Every block id present before the rewrite is present after it, or named in the fold table of the new decision.** Run the `blocks()` diff above; **a non-empty result the decision does not explain is a failed redefinition, not a stylistic choice** |
| 6 | The project's own `architecture.md` still holds — or an axiom was retired **explicitly**, with the saturation review that entails |

## Retirement

⚠️ **Its own criterion, fixed before the first invocation** (`AX-11`), and it is unusual because
**the success condition is the skill being needed *less*:**

**Retired if, after five invocations, drift keeps arriving at the same rate.** That would mean the
cartridges rot faster than this repairs them, and **the answer is not a better repair** — it is that
something in the close is failing to keep them current, which is a different fix in a different
place. **The tally is invocations against the interval between them:** if the intervals are not
lengthening, this skill is treating a symptom.
