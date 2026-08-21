---
name: open-session
description: Opens a working session over an MLabs instance and runs the loop from compass to close. Use at the start of any session on the knowledge base, a project, or the method itself — whether the operator names what they want to do or opens with nothing. Also use to close a task correctly, which is the half most sessions get wrong.
---

> **Version:** MLabs 1.0.0

# open-session

**Routing and sequence only.** Every rule lives in a file this skill points at. If this skill and
those files disagree, **the files win** — a skill is a view over its sources (`AX-20`).

## 1. Locate the instance

The operations centre is a private sibling of this repository. Read its `AGENTS.md` first: it is
**the binding** — which release it pins, where its ledger lives, where its denylist lives, and
what colour governs each file.

If no operations centre is attached, you are editing methodology and nothing else is in scope.
Say so and stop.

## 2. Open

Two ways in, and both end at the compass.

**The operator states an intent.** Read the compass anyway. If what they asked for is not the
`▶` row, **say so before working** — not to refuse, but because one of the two is out of date
and this is the cheapest moment it will ever be to discover that. They override freely; what is
not allowed is proceeding in silence.

**The operator opens with nothing.** Then report: here is the active front, here is what it
waits on, here is what is queued behind it — *shall we?* An opening with no intent is not an
absence of instruction; it is an instruction to orient.

Then read the live plan, which says what is in flight and why in that order.

## 3. Load only what the task needs

Read the routing index's row for this task and nothing else. **Anything you open beyond that row
is declared and logged as a defect in the index** — never as licence to read less (`AX-21`).

| Doing what | Load |
|---|---|
| Executing a defined task | the binding · the role or skill file · `METHOD.md` §2 and §7 |
| Designing, auditing, or changing a rule | all three governance levels, both axiom departments |
| Anything in a project | that project's cartridge and its own axiom department too |

## 4. Work the loop

**Planning lives in `skills/current-plan/`, and that file wins on everything about how a plan is
written** — this section is the routing, not the rules.

Invoke it when a sub-block is reached. Then work the list: every item leaves with an outcome from
the closed vocabulary (`METHOD.md` §2), items that spawn items are written down immediately, and
**anything the operator says outside the task is captured in the same turn** — a conversation ends
and takes its contents with it.

⚠️ **The plan closes; it is never deleted** (`current-plan`, *Closing*). Deleting it drops the
order-and-why and the discarded-with-reason items, which live nowhere else.

## 5. Close, in this order

The order is the point, and getting it wrong silently disables the company's own detection.

1. Every line struck, every residue routed.
2. **Read each destination back from disk.** *Written* is verified, never remembered (`AX-9`).
3. **Invoke the company auditor *only if a structural file changed*** — over the artefacts **and the
   live plan, which is still full.** Most closes do not qualify; skipping it then is correct, not
   a shortcut (`skills/company-auditor/` holds both lists).
4. **Only now close the plan** — `status: closed`, written to `data/plans/<id>.json`, **never
   deleted** (`FLOW.md` rule 3, the declared winner). This file then takes the next sub-block's.
5. Print what was touched: one line per file, no pasted diffs.
6. Move the compass.

⚠️ **Step 3 before step 4, always.** The live plan is the only record of how the task thought;
closing it first leaves the audit reading a file that no longer describes this round while
believing it read the reasoning.

⚠️ **Strike lines through; do not delete them.** The plan is read by the audit and, when the
operator asks for a mid-task check, by that too — a deleted line is a step nobody can see was
taken. **There is no automatic mid-task cadence**: the operator names one when a long task is
worth it, and the default is none.

## What this skill does not do

It does not decide what to work on — the compass does. It does not hold rules; it points at
them. It does not commit on the operator's behalf, and it never empties a queue it filled
(`AX-15`).

---

## Notes — loaded by a review, not by a session

### Why planning is not in this file

It was, until 2026-08-19. It moved because **the trigger moved**: planning happened once, when a
session opened, and under the block flow it is a discrete act repeated once per sub-block.
