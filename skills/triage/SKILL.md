---
name: triage
description: Empties the mailbox by routing every entry to a destination the operator confirms. Use when the inbox has accumulated entries, when the compass names a triage, or when an agent's findings need integrating. Also use to triage a single project's entries by filter rather than taking the whole pile.
---

# triage

**The contract is `METHOD.md` §4** — the loop applied to the mailbox, the confirmation step that
cannot be skipped, the one delegated case, and what the mailbox looks like when the session is over.
**Below is how a pass is actually worked.**

## Occasion
- The mailbox has accumulated entries, or the compass names a triage.
- An agent's findings need integrating.

## 1 · Read the whole pile before routing any of it

**Two entries that are the same finding seen twice get worked twice if each is routed on arrival** —
and a queue that has been sitting produces those constantly, because the same defect keeps
surfacing from different angles.

**So: read everything first, then group, then route the groups.** The grouping is the saving; the
routing is mechanical once it is done.

## 2 · Scope by filter, and work in batches of one to five

`METHOD.md` §4 sets the filter — **one project, or one destination class.** The `project:` field on
every entry exists so that filter is possible.

Inside the filter, **take between one and five related entries per pass**, sized so the reading does
not displace the deciding. ⚠️ **The count is not the point; the grouping is.** Five entries sharing
a cause are one decision with five destinations; five unrelated ones are five decisions, and that
is the slower pass even though the number matches.

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

## 5 · Propose a destination for each

⚠️ **This vocabulary is the mailbox entry's, and it is not the plan item's** (`METHOD.md` §2). An
entry arrives to be *filed*; a plan item leaves to be *finished*.

| Destination | When |
|---|---|
| the state file | it changes what is currently true |
| the architecture | it changes a project's own axioms |
| the decision log | it is a choice now settled |
| the park | worth keeping, no commitment |
| the task list | it needs executing — write the **why**, not only the what |
| an axiom department | **as a proposal only**, never written straight in |
| debate | it needs the operator's judgement before it can be routed |
| discarded | rejected, **with the reason** |

## 6 · The confirmation, then the close

**Every entry appears in the confirmed table, including the ones that stay open** — *"this one I did
not resolve"* is a valid result, and hiding it is not (`AX-6`). The mechanics are `METHOD.md` §4's.

Close per `open-session` §5. ⚠️ **A triage alone does not fire the company auditor** — draining a
queue changes no structural file. It fires when the triage routed something *into* an axiom
department or a skill.

## Verification, as a prediction

Before starting, state: *after this triage the filtered set holds `N` entries, all of which are
`open` for a named reason.* **An entry left without a destination and absent from the confirmation
table is a defect in the triage.**

## What this skill does not do

It fixes nothing an entry reports — that becomes a task. It investigates no further than
revalidating the claim. It writes into no axiom department, and it removes no entry the operator has
not confirmed.
