---
name: current-plan
description: Plans how a sub-block will be worked, before any of it is done — the items, their order, and the reason for that order. Use when a sub-block is reached and it is time to decide how to tackle it, when an existing plan needs reopening, or when work is about to start with no plan behind it. Produces one plan sheet; it does not execute it.
---

# current-plan

**One task, one plan sheet.** This decides *how* the work will be done and writes it down **while
deciding** — never summarised after, because a plan reconstructed at the end is a description of
what happened wearing a plan's clothes.

> **The shape is `FLOW.md`'s** — that every task carries a sheet from the moment it exists, that the
> states live on the task and not on the sheet, that a plan closes and is never deleted, and what a
> recurring sub-block does instead of closing. **Below is how a sheet is written.**

## Occasion
- A sub-block is reached and it is time to decide how to tackle it.
- Work is about to start with no plan behind it.
- A held sheet is reopened.

⚠️ **It plans and does not execute.** Executing is `autonomous-run`. The separation is not tidiness:
**a planner that may also execute stops writing down the order it rejected**, because it already
knows which one it will take.

## Why it is its own door

**Planning is a discrete act repeated once per sub-block** — several times in a session, or not at
all — so it has its own occasion and therefore its own name. ⚠️ **A step whose occasion has changed
needs a new name, or it keeps firing on the old one.**

## What a sheet holds

| | |
|---|---|
| **The task** it belongs to | a sheet with no task is a to-do list |
| **The items**, in the order they will be done | each leaving with an outcome, never a bare tick |
| **`order_why`** — why *that* order | **the field most likely to be skipped and the one that pays.** It is what a reader six months on has instead of the conversation |

## The order, and why the order is the point

**Write the reason for the sequence, not only the sequence.** *"A before B"* is a decision with a
cause — a dependency, a cost that falls if B is learned first, a thing that cannot be retrofitted.
**That cause is what tells the next reader whether the order still holds when something changes.**

⛔ **Name what would make you reorder it. A plan that cannot be wrong cannot be checked.**

## While the sheet is worked

**Items spawn items, and they are written down as they arrive** — `METHOD.md` §2 owns that rule and
the closed vocabulary each one leaves with. What this file adds is where they go: **right after the
current item**, in this sheet, so the order stays readable as a sequence rather than a heap.

## Closing

**Per `FLOW.md` rule 3.** A closed sheet keeps its id, leaves the working view, and becomes what the
sub-block's row in the projects hub expands into: **not *that* it finished, but *how* it went.**

## Verification, as a prediction

| # | Prediction |
|---|---|
| 1 | Exactly one task is `active` across every project, and this sheet belongs to it |
| 2 | The sheet names its task, and that task exists |
| 3 | `order_why` is present and **says something a reader could disagree with** |
| 4 | Every closed item carries an outcome; none carries a bare tick |
| 5 | Nothing was deleted — closed sheets are still addressable by id |

## Retirement

**Retired if, after five plans, `order_why` is being filled with restatements of the order rather
than reasons for it.** That would mean the field is theatre and the skill is a form to fill in —
and **a form nobody means is worse than no form**, because it looks like the thing it replaced.
