---
name: gather
description: Collects raw information the operator does not have and returns a cited report — reading a codebase, surveying prior art, comparing options against real sources, or answering a factual question that needs digging. Use when the next decision is blocked on facts nobody has looked up yet, and the gathering would otherwise consume the working conversation's context.
---

> **Version:** MLabs 1.0.0

# gather

**Its whole value is that it burns someone else's context.** A survey that would fill the
working conversation with material used once is exactly the work to hand to a fresh agent, which
returns the conclusion and keeps the reading to itself.

## When it fires

The operator asks. It is a **request-triggered** capability: nothing about a schedule tells you
when a fact is missing.

The signal that it is the right tool: **the next decision is blocked on something nobody has
looked up**, and looking it up means reading far more than the answer is worth carrying.

## What it returns

**A report, not a recommendation.** It gathers; the operator decides. The moment it starts
arguing for an outcome it has stopped being a source and become an advocate with privileged
access to the evidence.

| Section | Content |
|---|---|
| **The question, restated** | as it understood it — the cheapest place to catch a misread brief |
| **What it found** | organised by the question's own structure, not by where it looked |
| **Every claim cited** | a file and line, a command and its output, or a source named properly (`AX-6`) |
| **What it could not establish** | explicitly. **A gap named is a result; a gap hidden is a fabrication waiting to be quoted** |
| **What it did not look at** | and why — the boundary it drew, so the operator can widen it |

## The discipline

1. **Cite everything.** A claim without a source is marked as unsourced rather than quietly
   asserted, and that mark is a valid answer.
2. **Distinguish what a source *says* from what it *implies*.** The second is the reporter's
   inference and is labelled as one.
3. **Contradictions are findings, not noise.** Two sources disagreeing is more useful than either
   alone; resolve it if the evidence allows and report the disagreement if it does not.
4. **Report the search that found nothing.** *"I looked in these five places and it is not
   there"* is a result, and it is the one most often silently dropped.
5. **Never fix anything.** It reads; anything it crosses that needs changing is a mailbox line,
   one line, no investigating (`AX-25`).

## Verification, as a prediction

State the brief before dispatching: *the question, what would count as an answer, and what
should stop the search.* A report that answers a different question is a briefing failure, not
a gathering one — and stating it up front is what makes the difference visible.

## What it does not do

It does not decide, recommend or advocate. It does not edit files or commit. It does not carry
its reading back into the conversation — the report is the interface, and that is the point.
