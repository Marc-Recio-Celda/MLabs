---
name: audit
description: Dispatches an auditor over a closed task — company, instance or project, whichever department the work touched — or runs the saturation or promotion review. **Invoked by the operator, never automatic.** The natural moment is when an active front closes; use it also after a long stretch of work, or whenever you want a reading you did not ask for.
---

# audit

This skill **dispatches** an auditor; it does not perform the audit.

⚠️ **There are three now, one per department, and picking the right one is this skill's job:**

| Department the task touched | Dispatch | Its definition, which is the single source |
|---|---|---|
| The public structure — philosophy, the company axioms, the method, a skill, the allowlist | **company-auditor** | `skills/company-auditor/` |
| The operations centre — its own axiom department, its binding, the shape of its live set | **instance-auditor** | `skills/instance-auditor/` |
| One project's cartridge — its architecture, its contract, its own tooling | **project-auditor** | `skills/project-auditor/` |

**Two auditors on one close is the expensive one doing work it was not hired for.** If a task
genuinely spans two departments, dispatch the higher one and say the lower was not run — an unrun
check is reported as unrun, never as passed.

⚠️ **Nothing here fires by itself.** The automatic trigger was retired 2026-08-18: five firings in
one session cost more context than the work they audited. What is below describes how to brief one
when you choose to.

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
