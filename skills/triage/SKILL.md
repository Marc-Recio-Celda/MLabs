---
name: triage
description: Empties the mailbox by routing every entry to a destination the operator confirms. Use when the inbox has accumulated entries, when the compass names a triage, or when an agent's findings need integrating. Also use to triage a single project's entries by filter rather than taking the whole pile.
---

> **Version:** MLabs 1.1.0

# triage

The working loop applied to the inbox — with **one step that may never be skipped**, because
`AX-15` says nobody drains the queue they fill.

## 1. Scope it by filter, never take the whole pile

Triage **one project, or one destination class**. Not thirty entries at once.

This is not tidiness. A triage sits behind a single active front for as long as it takes, and an
unfiltered pile is exactly the front that never closes — the first thing to go manual as the
instance grows. The `project:` field on every entry exists so this filter is possible.

## 2. Enumerate into the live plan

One line per entry, in the order they will be worked — which is **not** the order they arrived.
A queue guarantees that nothing leaves without a destination; it never guarantees first-in-first-
out, and the order is the operator's to set.

## 3. Revalidate before proposing anything

**Every entry is checked against the real state before it is routed.** Cite the file and line it
names, and confirm the claim still holds. An entry written three weeks ago describes a repository
that has moved.

An entry whose premise no longer holds is not silently dropped: it is routed as **discarded, with
the reason**, which is the half that has no other record (`AX-24`).

## 4. Propose a destination for each — the closed vocabulary

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

## 5. The step that may never be skipped

**The operator confirms the entry → destination table before anything is removed.**

Every entry appears in that table, **including the ones that stay open** — saying *"this one I
did not resolve"* is a valid result and hiding it is not (`AX-6`). The agent's hands do the
deleting; the operator's judgement authorises it.

The one delegated case: a task that **names** the entries it closes. The executor deletes exactly
those, because the decision to close them was made when the task was written.

## 6. Close

Per `open-session` §5: read every destination back from disk, fire the superauditor over the
still-full plan, then empty it.

**The mailbox ends empty, or with what is unresolved named explicitly.** A mailbox that goes in
full and comes out full means the session closed nothing.

## Verification, as a prediction

Before starting, state: *after this triage the filtered set holds `N` entries, all of which are
`open` for a named reason.* Any entry left without a destination and without appearing in the
confirmation table is a defect in the triage, not an omission.

## What this skill does not do

It does not fix what an entry reports — that is a task. It does not investigate beyond
revalidating the claim. It does not write into an axiom department. It never removes an entry the
operator has not confirmed.
