---
name: autonomous-run
description: Executes a defined objective end to end without stopping to ask, under standing approval, and returns a full report of everything done and every choice made. Use when the operator hands over a task and says to run it to completion — building a feature, a migration, a sweep across many files, anything where stopping at every fork would cost more than it protects.
---

> **Version:** MLabs 1.0.0

# autonomous-run

**Standing approval is not unlimited approval.** The operator has pre-accepted the *choices*;
they have not pre-accepted the *scope*, and the difference is what keeps this safe enough to
be worth using.

## Before anything runs: the contract

State all four, and get them wrong at your peril — this is the only moment the operator is in
the loop.

1. **The objective, restated in one sentence.** Not the task as given: the task as understood.
   The cheapest place to catch a misread brief.
2. **Done, defined as a check.** *"Finished"* is not a state you can be wrong about; **a command
   whose output you can predict is.** Write the prediction now — the gap between it and the real
   output at the end is the finding.
3. **The boundary** — what will be touched, and what will not.
4. **The stop conditions**, below. Naming them is what converts *"do not ask me"* into something
   the operator can safely mean.

## The four stops — where autonomy ends

Standing approval covers judgement calls inside the objective. It does not cover these, and
hitting one means **stop and report, do not work around it**:

| Stop | Why it is not yours to decide |
|---|---|
| **The premise is false** | What the task assumed is not what the repository shows. Executing anyway produces work that looks finished and is not. This is the executor's obligation, not its discretion (`AX-14`) |
| **Something irreversible** | Deleting, force-pushing, rewriting history, dropping data, anything with no later pass that recovers it. **Cleaning is recoverable; deletion is not** |
| **A boundary you did not declare** | Another repository, a file the permission table marks not-ours, credentials, anything outside step 3's list. Widening scope mid-run is the one thing standing approval cannot cover |
| **Two objectives now** | The work has forked into things that could run independently. Say so — one of them is probably a separate run |

⚠️ **A stop is a success, not a failure.** The run that stops on a false premise saved the
operator the review of work built on it.

## While it runs

**The report is written as you go, never assembled at the end.** A run that dies at step nine
must leave nine steps of trace, and a report composed from memory at the close is the failure
mode this exists to prevent (`AX-9`).

**Keep the live plan current.** It is the record of *how* the run thought, and the only thing a
reviewing agent can read without a transcript. Items get struck through with a destination;
anything the work spawns gets written down immediately, right after the current item, even when
unrelated.

**Checkpoint at every natural boundary** — a working state, committed or clearly marked
uncommitted. A long run that cannot be resumed is a long run that starts over.

**Verify each step against its own prediction before moving on.** A step whose result you did
not predict is a step you did not understand, and the ones after it inherit that.

## The report

Handed back at the close, and it is the deliverable as much as the work is.

| Section | Content |
|---|---|
| **The objective and how *done* was defined** | as stated at the start, so the operator can see whether the brief was read right |
| **What was done** | in order, each item with the evidence it worked — a command and its output, a test, a diff |
| **Every fork and which way it went** | the decisions the operator pre-accepted. **Each one with the option not taken and why** — this is the section that makes standing approval reviewable rather than blind |
| **What was assumed** | anything taken as true without checking, flagged as such. An unflagged assumption is the part of the report that lies |
| **What is not done** | stops hit, work deferred, anything left half-finished, with its state |
| **What it cost** | roughly, and what would make it cheaper next time |
| **What to check first** | the operator's review time is finite: name the two or three places you are least confident |

**Anything crossed on the way that is not part of the objective goes to the mailbox**, one line,
no investigating and no fixing (`AX-25`). Not into the report as a to-do — the report is read
once, the mailbox is triaged.

## Closing

The full close applies (`METHOD.md` §2): read every destination back from disk, **and if the run
changed a structural file, fire the audit over the artefacts and the still-full live plan**, then
empty it.

⚠️ **An autonomous run is where the audit is most valuable — and it still only fires on the same
condition as any other close.** Nobody watched the work, so **name it in the report either way**:
*audit fired, N findings* or *audit did not fire, nothing structural changed*. An unmentioned
audit is indistinguishable from a skipped one, and this is the run where nobody could tell.

## Verification, as a prediction

The check from step 2, run at the end and reported with its real output. **If it passes, say so
with the output. If it fails, the run is not done** — regardless of how much was built.

## What this skill does not do

It does not decide what the objective is. It does not widen its own scope. It does not treat
standing approval as approval for the four stops. It does not commit on the operator's behalf
unless the contract said so explicitly, and it never force-pushes or rewrites history at all.
