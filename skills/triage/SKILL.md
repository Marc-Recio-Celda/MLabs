---
name: triage
description: Drains the notebook and the mailbox by routing every note and entry to a destination the operator confirms. Use when a notebook sheet or the inbox has accumulated entries, when the compass names a triage, or when an agent's findings need integrating. Also use to triage a single project by filter rather than taking the whole pile.
---

# triage

**The contract is `METHOD.md` §4** — the loop applied to the queues, the confirmation step that
cannot be skipped, the one delegated case, and what a queue looks like when the session is over.
**Below is how a pass is actually worked.**

## Occasion
- a `93_Notebook/` sheet or `MAILBOX.md` has accumulated entries, or the compass names a triage.
- An agent's findings need integrating.

---

## 0 · Two stages, and they are different jobs

**Since 2026-09-05 the instance has a capture file in front of the mailbox** (`M-134`). A pass works
one stage or the other, **never both in one batch** — they cost different amounts of attention and
mixing them is what made the mailbox expensive in the first place.

| | **Stage 1 · the notebook drain** | **Stage 2 · the mailbox triage** |
|---|---|---|
| Reads | `93_Notebook/*.md` — one-line notes across every sheet, nothing adjudicated | `MAILBOX.md` — entries that already survived stage 1 |
| Asks | *what kind of thing is this?* | *what is the right destination, and does the claim still hold?* |
| Outcomes | **applied** · → mailbox · → tasks · **discarded** | the destination vocabulary in §5 |
| Costs | minutes. Most notes end **discarded** and that is information | judgement. This is the expensive one and it should stay expensive |
| Batch | as many as the pass can hold | **one to five** |

⛔ **Stage 1 may not file into stage 2 to be safe.** Every doubt becoming a mailbox entry is a loop
with no bound, and it is how the cheap lane stops being cheap. A note that is genuinely unclear is
**discarded with *unclear* as the reason** — if it matters it will be thought again, and if it never
is, it did not matter. ⚠️ **The channel back is the drain report, not a new entry.**

---

## 1 · Read the whole pile before routing any of it

**Two entries that are the same finding seen twice get worked twice if each is routed on arrival** —
and a queue that has been sitting produces those constantly, because the same defect keeps surfacing
from different angles.

**So: read everything first, then group, then route the groups.** The grouping is the saving; the
routing is mechanical once it is done.

## 2 · Scope by filter, and work in batches

`METHOD.md` §4 sets the filter — **one project, or one destination class.** The `project:` field
exists so that filter is possible. ⚠️ **It is optional in the notebook and mandatory downstream**: a
required field at capture time is a reason not to capture, so **assigning it is part of stage 1's
job**, not a precondition for doing stage 1.

Inside the filter, **take between one and five related entries per stage-2 pass**, sized so the
reading does not displace the deciding. ⚠️ **The count is not the point; the grouping is.** Five
entries sharing a cause are one decision with five destinations; five unrelated ones are five
decisions, and that is the slower pass even though the number matches.

⛔ **A pass ends with its entries routed and confirmed.** Leaving three of five half-decided keeps
the queue's length and loses its meaning.

## 3 · Enumerate into the live plan

One line per entry, **in the order they will be worked** — which is not the order they arrived. A
queue guarantees that nothing leaves without a destination; it never guarantees first-in-first-out,
and the order is the operator's to set.

## 4 · Revalidate before proposing anything

**Every entry is checked against the real state before it is routed.** Cite the file and line it
names, and confirm the claim still holds — an entry written three weeks ago describes a repository
that has moved.

**An entry whose premise no longer holds is routed as *discarded, with the reason*** (`AX-24`).

⚠️ **A note carrying `check:` is revalidated by running it.** That is the whole point of the field:
an entry already satisfied verifies in one command, and nobody has to remember whether it was done.
⛔ **A check that names a set proves something; a check that counts one does not** — `grep -c 'ui/'`
→ `0` proves the ask, `wc -l` → `5` expires the day a sibling file appears.

---

## 5 · Propose a destination for each

⚠️ **This vocabulary is the mailbox entry's, and it is not the plan item's** (`METHOD.md` §2). An
entry arrives to be *filed*; a plan item leaves to be *finished*.

| Destination | When |
|---|---|
| the state file | it changes what is currently true |
| the architecture | it changes a project's own axioms |
| the decision log | it is a choice now settled |
| the park | worth keeping, **no commitment** — and it is reachable from the mailbox, never from the notebook |
| the task list | it needs executing — write the **why**, not only the what |
| a block or sub-block | it has become committed work with an address on a board |
| an axiom department | **as a proposal only**, never written straight in |
| debate | it needs the operator's judgement before it can be routed |
| discarded | rejected, **with the reason** |

⛔ **A raw note never reaches the park directly.** The park holds what was **deliberately** not done,
carrying the decision that parked it. A note that has not been decided about yet, filed in a file
with no obligation to revisit, is how a park becomes the place things go to be forgotten.

## 6 · The four fields — the gate, and it is the point of the whole skill

**A note leaves the capture file as one line. Nothing arrives anywhere as one.** Every entry routed
to the mailbox, the task list or a board carries all four:

| Field | The question it answers |
|---|---|
| **Title** | what this is, in one readable phrase |
| **Description** | what is actually happening, **in prose, without needing the conversation it came from** |
| **Why it needs the operator** | what judgement is being asked for, or what makes it work rather than an idea |
| **What it affects** | the files, blocks and decisions that move if this moves |

⚠️ **`AX-25` and this contract do not conflict, and the reason matters.** That axiom's entire value
is *record it in one line and do not go looking* — its cost saving **is** the not-looking, so it
cannot also demand four fields. **The two fire at different moments: one line when you cross it,
four fields when it is routed.** This is the door, and a contract enforced at one door beats the
same contract begged for at every one.

⛔ **A destination is not reached by an entry that fails this.** If the four fields cannot be written
because the information is not there, that is the finding: the entry goes back to `[open]` with
**what is missing** named, and it is not counted as routed.

## 7 · The link — an entry and its destination name each other

**This is what stops the queue leaking history** (`MLabs:AX-45`, the same rule that binds a source to
its view — an artefact that only points one way is invisible from the other side).

| Where | Mark |
|---|---|
| At the destination — mailbox entry, task, decision, board row | `from: N-nn` (or `from: MAILBOX <title>`) |
| In the drain report, in `LOG_AGENTS.md` | `N-nn → <destination> · <one line on why>` |

⚠️ **`AX-15` deletes the completed entry, and that is correct** — a queue that keeps its drained
items stops saying what is left. **The trail is not the entry; it is the id at the destination plus
the line in the log.** Anyone holding a task can therefore reach the note it came from and the pass
that decided it, which is what `PH-4` means by *the value lives in the artefacts, never in the
history of a conversation.*

⛔ **Write both ends in the same act.** A destination that names its origin while the log says
nothing is half a link, and the half that is missing is always the one somebody needed.

## 8 · The confirmation, then the close

**Every entry appears in the confirmed table, including the ones that stay open** — *"this one I did
not resolve"* is a valid result, and hiding it is not (`AX-6`). The mechanics are `METHOD.md` §4's.
**Nothing is removed before the operator confirms the table** (`AX-15`); the agent's hands do the
deleting, the operator's judgement authorises it.

Close per `open-session` §5. ⚠️ **A triage alone does not fire the company auditor** — draining a
queue changes no structural file. It fires when the triage routed something *into* an axiom
department or a skill.

## Verification, as a prediction

Before starting, state: *after this pass the filtered set holds `N` entries, all of which are `open`
for a named reason.* **An entry left without a destination and absent from the confirmation table is
a defect in the triage.**

Then check the link, which is the new failure mode this skill can produce:

```
# every routed entry names its origin, and every origin appears in the drain report
grep -c 'from: N-' <destination files>        # equals the number routed this pass
grep -c 'L-.* → '  NEXUS/99_SYSTEM/LOG_AGENTS.md   # same number, same pass
```

⚠️ **Plant before trusting** (`AX-7`): route one entry deliberately without its `from:`, and confirm
the counts disagree. A link check that passes over zero links has verified nothing.

## What this skill does not do

It fixes nothing an entry reports — that becomes a task, **except** a stage-1 note whose `check:`
passes after the fix, which is *applied* and recorded in the drain report. It investigates no further
than revalidating the claim. It writes into no axiom department, and it removes no entry the operator
has not confirmed.
