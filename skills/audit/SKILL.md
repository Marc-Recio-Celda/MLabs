---
name: audit
description: Fires the superauditor over a closed task, or runs the saturation or promotion review. Use at the close of any task that changed a structural file or added a decision, every five closed items inside a long task, whenever an axiom set changes, and every twenty logged decisions.
---

# audit

This skill **dispatches** the superauditor; it does not perform the audit. The role's definition
is `roles/superauditor.md` and it is the single source for what gets checked.

## Which firing is this

| Trigger | Reads | Answers |
|---|---|---|
| **A task closes** — a structural file changed, or a decision was logged | the artefacts the task touched **and the still-full live plan** | did this round violate anything |
| **Five items closed** inside a long task | the same, so far | is there a systematic mistake to catch before item twenty |
| **An axiom set changed** — any department | **every axiom in every department**, together | is the set still load-bearing, distinct and in force |
| **Twenty new decisions logged** | the decisions since the last review | does the rule set still match the work |

The first two are the same firing at different points. The last two are different questions on
different clocks and are never merged into the first.

## How to dispatch it

**Fresh context, every time.** The audit runs as a subagent that has not seen the conversation
and must not: it reads from disk, and the live plan is how it sees the round's *reasoning*
without reading a transcript.

The brief is: the role file's checklist, the paths the task touched, and the live plan. **Nothing
else.**

⚠️ **The brief never contains the dismissal thresholds.** An auditor that knows it is retired for
agreeing has an incentive to manufacture findings, which destroys the measurement it exists to
produce. The numbers live in the operations centre's hiring record.

⚠️ **Fire before the live plan is emptied**, not after. This is the most common way to get the
close wrong, and it fails silently — the audit reads a blank file and reports nothing.

## What comes back, and what to do with it

Findings with evidence, **or an account of what was checked and found nothing.** Silence is not
available (`AX-6`). If the report is neither shape, the dispatch was wrong, not the role.

Then:

1. **The operator adjudicates.** Not every finding is genuine, and the count that binds is the
   one they accept.
2. **Write one ledger entry** in the operations centre, carrying the fixed verdict line — that
   line is what the dismissal tally greps, and the tally is tested against a planted entry before
   it is trusted (`AX-7`).
3. **Only the operator acts on a veto.** The role reports; it never rejects, never edits, never
   commits.
4. **Apply what survives** — and where a finding is accepted and not fixed, say so and why. An
   accepted finding with no visible outcome is the audit quietly becoming decoration.

## Running the saturation review

Fires the moment any axiom department changes, and reads all of them together — because a rule
can only contradict a rule it shares a reader with, and **a set saturates one entry at a time,
so the only moment the interaction is visible is when something changes.**

**Demotion is the expected outcome, not a failure.** An axiom that turns out narrower, softer or
already implied becomes an ordinary logged decision. The set is meant to shrink under this review
as readily as it grows, and a review that only ever adds is not doing its job.

## Verification, as a prediction

Before dispatching, state what you expect: *this round touched N files and I expect findings on
dimensions X and Y.* A report that lands entirely outside the prediction is worth more than one
that confirms it — and a report that confirms every time is what the dismissal criterion exists
to detect.

## What this skill does not do

It does not audit — it dispatches. It does not propose ideas; the role has no idea slot, and a
suggestion is not a finding. It does not decide what the findings mean.
