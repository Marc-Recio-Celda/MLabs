# FLOW — the shape work takes, and the rules that keep it honest

> **Standing.** `METHOD.md` says how work moves; this says **what shape it moves in** — the nesting,
> and the rules that stop it degrading. The fields each record carries are the instance's, declared
> in its schema.
>
> ⚠️ **This is the file to change if you want a different workflow.** Everything else in the method
> assumes the shape below; nothing else assumes *this* shape in particular.
>
> ⚠️ **Rewritten 2026-09-05 (`M-135`).** What changed and why is in the decision; what is below is
> the shape as it now is, with no account of what it replaced (`AX-41`).

## The nesting

```
project
  ├── definition      what it IS — its PH-0. Barely moves
  ├── objectives      what it is TRYING TO ACHIEVE now. Evolves
  ├── axioms          the rules that may never be violated inside it
  └── plan            how the objectives get met
        └── block                 the shape of the work, proposed up front
              └── sub-block       defined on arrival, not before
                    ↓ promoted when somebody decides it is time
                  task            on the wall, with its own sheet
                    └── item      and items spawn items, written down immediately
```

**Three documents, three rates of change, and that is why they are three files** (`AX-39`). A
definition that changes every time a new objective appears has stopped being a definition; a plan
that has to restate what the project is for is carrying a fact that already has a home.

⛔ **The state is not a document.** It is the position inside a plan — which task is on the wall,
and which of them carry the `▶`. **A state you have to maintain goes stale; a state that is a
position cannot.**

## Promotion — a sub-block is not a task until somebody says so

**A sub-block is a piece of a plan. A task is a commitment.** They are not the same thing, and
making them the same is what produced two right answers to one question: *asked what was pending,
one agent answered 4 and another ~50.* The queue held what was committed, the boards held what
existed, and nothing said so.

**So: a sub-block becomes a task when it is decided that it is time**, and only then does it appear
on the wall with a sheet of its own. ⚠️ **Nothing else changes about it** — it keeps its address in
the plan, and the task names that address.

⛔ **A task that arrived whole has no block above it and writes `block` empty** rather than omitting
the field (`AX-24`): a task with no block legitimately has none, and an absent field cannot say that.

## The states, and they live on the task

`pending` · `active` · `paused` · `cancelled` · `done`.

| State | Means |
|---|---|
| **pending** | on the wall, not started. **Planned** if its sheet exists, **unplanned** if it does not |
| **active** | the `▶`. **Several tasks may be active at once** |
| **paused** | has been active. Its sheet is held and visible, so resuming costs reading rather than reconstructing |
| **cancelled** · **done** | terminal. They leave the wall for the bin, **marked as which** |

⛔ **The floor: if work is happening, at least one task is active.** If none is, the agent says so
and one is assigned, with the project it belongs to, its plan and its objectives. ⚠️ **This is what
bounds promotion.** A sub-block that is ready and that nobody promotes is invisible from the wall —
and this rule is checked by the act of working rather than by anyone remembering to look.

⛔ **A draining task is `active` while its queue is non-empty, and `paused` only when it is empty.**
**The state of a drain is derived from the count, not chosen** — *paused with items in it* is not a
state, it is a contradiction, and it is precisely how a queue stops being visible.

⚠️ **There is no ceiling on active tasks, and that is a deliberate gap.** The previous shape allowed
exactly one, because there was one live plan file and the constraint was about a scarce resource
rather than about attention. **Each task now owns its sheet, so nothing is contended.** What bounds
work in progress instead is **visibility**: the wall states its active count and it is read at every
open. If that count starts climbing, that is evidence for a rule — not a reason to guess one now.

## The rules, because each one has a failure it prevents

**1 · A block closes when no sub-block of it is open and its verification passes.** Not by
judgement. ⚠️ **Without an observable rule, blocks accumulate and the plan becomes a backlog.**

**2 · A plan is closed, never deleted.** Decisions survive in the decision log and routed items
survive at their destination — but two things live nowhere else: **the order and why that order**,
and **the items discarded with their reason**. ⚠️ **Deleting a sheet drops `PH-3` in exactly the
case it was written for.** Closing costs nothing visually, and a task's row can then show **how it
was worked** rather than merely that it finished.

**3 · Some tasks are maintenance, and maintenance does not close.** Rule 1 cannot be satisfied by a
queue that **keeps filling** — by agents at every close, by the passive-finding rule making filing
free and correct, and by the operator as things occur.

| | A closing task | A **recurring** one |
|---|---|---|
| Verification | a condition that becomes permanently true | a condition true **at the moment of the close** |
| At the close | `done`, and its block can close | **`paused` if its queue is empty; it stays `active` if it is not** |
| Its sheet | closes into a record | closes into a record **per pass**, and the task stays |
| If ignored | the block cannot close, and that is visible | ⚠️ **nothing is visibly wrong** — the failure this rule prevents |

**4 · An item, on being reached, goes one of four ways:** **done now** · **to the mailbox**, to be
debated · **to the notebook**, if it is a thought rather than a decision · **discarded, with its
reason**. ⚠️ **A state is not an outcome, and the two sets are different sizes**: a task carries one
of five states, an item leaves with one of four outcomes.

**5 · Nothing enters the wall without naming its project and the objective it serves.** ⛔ **There
are no housekeeping rows.** The operations centre is a project like any other — draining its mailbox
is one of its tasks, against one of its objectives — and a row that cannot name either has not been
thought about yet.

## What every record carries

A decision, a task and an item each carry **where they happened** — `block` and `sub_block`, the
address in the plan, and `plan`, the sheet they were decided or spawned inside. ⚠️ **Added at
creation, never backfilled**: a field added later means every existing record lacks it, plus a
conversion to fill them.

## A closed sheet is its own log

It needs no extra machinery — **that is what a plan sheet already is** once its items carry
outcomes. It accumulates by existing, and its id is what a decision points at when it records where
it was taken. ⚠️ **A separate log file per sheet is a second place holding the same events**, and
`AX-20` has no third kind for that.

## Tasks are green, not struck

A record carries `status` and the view paints it; strikethrough is not a state. ⚠️ **And a completed
item still carries where it went** — `done`, `discarded`, `to the mailbox` and `to the notebook` are
different outcomes, and a single green tick meaning all four is the failed close this method already
names.
