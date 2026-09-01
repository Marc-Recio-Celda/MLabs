# FLOW — the shape work takes, and the rules that keep it honest

> **Version:** MLabs 1.1.0

> **Standing.** `METHOD.md` says how work moves; this says **what shape it moves in** — the
> nesting, and the rules that stop it degrading. The fields each record carries are the
> instance's, declared in its schema.
>
> ⚠️ **This is the file to change if you want a different workflow.** Everything else in the
> method assumes the shape below; nothing else assumes *this* shape in particular.

## The nesting

```
project
  └── block                     proposed up front — the shape of the work
        └── sub-block           defined on arrival, not before
              └── plan          how this sub-block gets done · ONE is active
                    └── item    and items spawn items, written down immediately
```

An item, on being reached, goes one of four ways: **done now** · **to the mailbox**, to be
debated · **to ideas**, interesting but not now · **discarded, with its reason**. The mailbox is
then digested and what survives becomes a block or a sub-block — **the step that closes the loop**,
and the one a vocabulary without it cannot express.

## The rules, because each one has a failure it prevents

**1 · A block closes when no sub-block of it is open and its verification passes.** Not by
judgement. ⚠️ **Without an observable rule, blocks accumulate and the compass becomes a backlog
again — arriving by the back door, one sub-block at a time.**

**2 · The `▶` sits on a sub-block, never on a block.** The block is derived from it. ⚠️ **A `▶` on
a block permits two things at once**, which is the thing a single active front exists to prevent.

**3 · A plan is closed, never deleted.** Decisions survive in the decision log and routed items
survive at their destination — but two things live nowhere else: **the order and why that order**,
and **the items discarded with their reason**. ⚠️ **Deleting the plan drops `PH-3` in exactly the
case it was written for.** Closing costs nothing visually: a closed plan leaves the working view
the way a deleted one would, and a sub-block's row can then show **how it was worked** rather than
merely that it finished.

**4 · Several plans may exist; exactly one is `active`.** The others are `paused`, not `open`.
Starting one before another finishes is allowed; **losing the count is not** — ⚠️ **two active
plans are two active sub-blocks, and then the `▶` is not one.** A list of parallel priorities
never contradicts reality, so it never gets corrected.

⚠️ **`paused` is not a courtesy state — it is what makes switching safe.** A plan deleted on a
switch takes its order, its reasons and its unrouted items with it; a paused plan is **held and
visible**, and resuming it costs reading rather than reconstructing. **The `▶` moves; the work
does not vanish.**

**5 · Some sub-blocks are maintenance, and maintenance does not close.** Rule 1 cannot be
satisfied by a queue that **keeps filling** — by agents at every close, by the passive-finding rule
making filing free and correct, and by the operator directly as things occur.

| | A closing sub-block | A **recurring** one |
|---|---|---|
| Verification | a condition that becomes permanently true | a condition true **at the moment of the close** |
| At the close | `closed`, and its block can close | **`paused`**, reopened by the next arrival |
| Its plan | closes into a plan record | closes into a record **per pass**, and the sub-block stays |
| If ignored | the block cannot close, and that is visible | ⚠️ **nothing is visibly wrong** — the failure this rule prevents |

⚠️ **The bound on a queue is not a number.** *Above N open, triage becomes the active front*
**invents a constant nobody can defend, and fires on volume rather than on attention.** The bound
is that the triage never dies and never silently disappears: it is `active` or it is `⏸ paused`,
always one of the two, always on the board. **Not draining the queue becomes a state you can see
rather than a thing you forgot.**

## What every record carries

A decision, a task and an item each carry **where they happened** — `block` and `sub_block`, the
address of the work, and `plan`, the plan they were decided or spawned inside. ⚠️ **Added at
creation, never backfilled**: a field added later means every existing record lacks it plus a
conversion to fill them.

## A closed plan is its own log

It needs no extra machinery — **that is what a plan record already is** once its items carry
outcomes. It accumulates by existing, and its id is what a decision points at when it records
where it was taken. ⚠️ **A separate log file per plan is a second place holding the same events**,
and `AX-20` has no third kind for that.

## Sub-blocks are green, not struck

A record carries `status` and the view paints it; strikethrough is not a state. ⚠️ **And a
completed item still carries where it went** — `done`, `discarded` and `sent to the mailbox` are
different outcomes, and a single green tick meaning all three is the failed close this method
already names.
