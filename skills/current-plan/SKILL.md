---
name: current-plan
description: Plans how a sub-block will be worked, before any of it is done — the items, their order, and the reason for that order. Use when a sub-block is reached and it is time to decide how to tackle it, when an existing plan needs reopening, or when work is about to start with no plan behind it. Produces one plan record; it does not execute it.
---

> **Version:** MLabs 1.1.0

# current-plan

**One sub-block, one plan.** This decides *how* the work will be done and writes it down while
deciding — never summarised after, because a plan reconstructed at the end is a description of
what happened wearing a plan's clothes.

⚠️ **It plans and does not execute.** Executing a plan is `autonomous-run`. The separation is not
tidiness: a planner that may also execute stops writing down the order it rejected, because it
already knows which one it will take.

## Why it is its own door

**Planning is a discrete act repeated once per sub-block** — several times in a session, or not at
all — so it has its own trigger and therefore its own name. ⚠️ **A step whose trigger has changed
needs a new name, or it keeps firing on the old one.**

## What it produces

One plan record, holding:

| | |
|---|---|
| **The sub-block** it belongs to | a plan with no sub-block is a to-do list |
| **The items**, in the order they will be done | |
| **`order_why`** — why *that* order | the field most likely to be skipped and the one that pays. It is what a reader six months on has instead of the conversation |
| **status** | `active` · `paused` if another plan took the `▶`, or if this is a **recurring** sub-block between passes · `closed` when its sub-block is done for good |

## The order, and why the order is the point

**Write the reason for the sequence, not only the sequence.** *"A before B"* is a decision with a
cause — a dependency, a cost that falls if B is learned first, a thing that cannot be retrofitted.
That cause is what tells the next reader whether the order still holds when something changes.

**Name what would make you reorder it.** A plan that cannot be wrong cannot be checked.

## Exactly one plan is active

Several may exist — starting one before another finishes is real and allowed. **What is not
allowed is losing the count:** opening a plan while another is `active` **pauses that one and says
so**. Two active plans are two active sub-blocks, and then the `▶` is not one.

⚠️ **Pausing is what makes switching safe, and it is not a courtesy state.** A plan deleted on a
switch takes its order, its reasons and its unrouted items with it; a plan that is `paused` is
**held and visible**, and resuming it costs reading rather than reconstructing.

⚠️ **A recurring sub-block pauses instead of closing** (`FLOW.md` rule 5). A triage of a queue that
keeps filling can never verify as *empty* — its verification is a state **at the moment of the
close**, and at that moment the plan closes into its record **and the sub-block returns to
`paused`**, ready for the next arrival. **A maintenance loop written as a closing sub-block is a
sub-block that will look abandoned every time it is correct.**

The single active front is a forcing function, not tidiness: a list of parallel priorities never
contradicts reality, so it never gets corrected.

## While the plan is worked

**When an item spawns others, write them down immediately, right after the current one** — even,
and especially, when they are unrelated. It does not interrupt: the new line takes its place and
gets an outcome like everything else. Most will be parked or discarded, and that is a successful
outcome, not a wasted line.

**Every item leaves with an outcome**, never a bare tick: `done` · `mailbox` · `ideas` ·
`discarded` **with its reason**. Green replaced strikethrough; it did not replace the destination.

**Anything the operator says that is not part of this plan is captured in the same turn** — one
line, in the park, with its project. Not at the close: a conversation ends and takes its contents
with it.

## Closing

**The plan closes; it is never deleted.** Decisions go to the decision log and routed items to
their destinations — but **the order and why that order**, and **the items discarded with their
reason**, live nowhere else. A closed plan keeps its id, leaves the working view, and becomes what
the sub-block's row in the projects hub expands into: not *that* it finished, but *how* it went.

## Verification, as a prediction

| # | Prediction |
|---|---|
| 1 | Exactly one plan is `active` across every project |
| 2 | The plan names its sub-block, and that sub-block exists |
| 3 | `order_why` is present and says something a reader could disagree with |
| 4 | Every closed item carries an outcome; none carries a bare tick |
| 5 | Nothing was deleted — closed plans are still addressable by id |

## Retirement

Retired if, after five plans, the `order_why` field is being filled with restatements of the
order rather than reasons for it. That would mean the field is theatre and the skill is a form to
fill in — and a form nobody means is worse than no form, because it looks like the thing it
replaced.

---

## Notes — loaded by a review, not by a plan

### Where it came from

It lived inside `open-session` until 2026-08-19 and moved because **the trigger moved**: planning
used to happen once, when a session opened, and under the block flow it happens once per sub-block.
