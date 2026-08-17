---
name: dispatch
description: Hands a defined piece of work to the right executor with a brief it can act on and refuse — deciding what goes to an agent with file access, what stays in conversation, and what is split. Use when a task is ready to execute, when work needs breaking into pieces that can run independently, or when deciding whether something should be done here or handed over.
---

> **Version:** MLabs 1.0.0

# dispatch

The step between *deciding* and *doing*. Getting it wrong is expensive in a way that hides: work
handed over with a bad brief comes back looking finished.

## Where the work goes

Allocate by **what each executor is entitled to claim**, never by what it can see (`AX-14`).

| | May claim | So it gets |
|---|---|---|
| **A conversational access point** | only what it was given | design, judgement, anything whose output is a decision |
| **One that reads the repository** | what is on disk | review, tracing, anything whose answer is *what is actually there* |
| **One that can execute** | that something passes or fails | tests, builds, sweeps, migrations — anything where the answer is a command's output |

**Only an executor may claim that something passes.** A brief asking a reader to confirm a test
passes is asking it to guess, and it will.

## The brief

Every dispatch carries four things. A brief missing any of them is why work comes back wrong.

1. **The why, not only the what.** An executor that does not know the purpose cannot test the
   premise — and testing the premise is its job (`AX-14`).
2. **The verification, stated as a prediction.** What must be true afterwards, written *before*
   the work starts. The gap between prediction and result is the finding; without it, "done" is
   self-reported.
3. **The boundary.** What it may write, what it must not touch, and which colour governs what it
   will meet. Work in a repository the operator does not own is reported, never edited.
4. **The right to refuse, stated.** If the premise does not hold against what the executor
   actually sees, **it stops and says so** rather than executing. That is an obligation, not a
   courtesy: whoever planned cannot see the repository and whoever executes can.

## Splitting

Split only what can genuinely run **independently**. Sequential phases of the same work are not
two dispatches — handing them over separately costs a full context rebuild at the seam and
returns nothing, and the second executor inherits a summary instead of the state.

The test: **could these run at the same time, on different machines, without talking?** If no, it
is one dispatch with steps.

## Closing a dispatch

The executor's output is read against its prediction, and its trace goes to the agent log of the
repository it worked in. **A task naming the entries it closes is the one delegated deletion** —
those, and only those, the executor removes (`AX-15`).

## Verification, as a prediction

Before dispatching: *this executor is entitled to claim X, and the result will be Y.* If the
result is a claim the executor was not entitled to make, the dispatch was wrong even when the
answer happens to be right.

## What it does not do

It does not do the work. It does not decide what the work is — that is the plan. It does not
accept a result that asserts more than its executor could know.
