# PHILOSOPHY — what this company optimises for

> **Version:** unreleased · pre-release working draft (AX-20).

> **Level 1 of three.** *Philosophy* (this file) says what the company is for and what it
> refuses. *Axioms* (`AXIOMS.md`) are the rules that follow and may never be violated.
> *Decisions* are instance-level, and live in the instance's own log with their author, date
> and reasoning. The same three levels apply one floor down, inside a project.
>
> **This file breaks ties.** When two axioms both apply and disagree, it decides. When a
> proposal satisfies every axiom and still feels wrong, this is where the objection lives.
>
> **It changes almost never, and only by the operator, explicitly.** One clause is a trade
> rather than a law and carries a review date; it is marked ⏳.

---

## PH-1 · The long horizon is the premise, not a later phase

Everything is built for the next thing, not for this one. What is learned or built once stays
available and is never relearned. Concretely: design for several times today's volume — a
solution that works only at today's scale is a postponement, not a solution. A fix that holds
only for the current piece of work is that piece's business, not the company's.

## PH-2 · Learning is bought with productivity, deliberately ⏳

Where speed and understanding conflict, understanding wins. A shortcut the operator does not
understand is not speed; it is debt with interest. Transcription gets automated; judgement does
not. **This is a trade, not a law** — the only clause here with a review date, because the
balance is right while the operator is still learning the system and may not be afterwards.

## PH-3 · Nothing is lost

Without data there is no analysis, and the asymmetry is absolute: **an analysis can be redone at
any time; a datum lost cannot be recovered.** This covers inputs, reasoning, and the part that
is always forgotten — **what was discarded**, which leaves no trace anywhere unless someone
writes it. Recording is cheap and reconstruction is impossible; that ratio is the entire
argument.

## PH-4 · Zero black boxes

Every decision is traceable to its reasoning. Not for audit's sake: **a system whose owner
cannot explain it cannot be corrected by them.** The tool is interchangeable and the state is
sacred — value lives in the artefacts, never in a conversation's history — so any transition
that costs re-explaining is a direct measure of failure.

## PH-5 · Work is modular

Each piece owns itself: its own boundary, its own lifecycle, its own version. Coupling is paid
on every change; separation is paid once, when the boundary is drawn. Boundaries are drawn by
**owner first, rate of change second** — never by topic.

## PH-6 · Attention is the scarce resource

Everything is recorded; almost nothing is loaded. One active front at a time. The full record
and the working set are different artefacts, and the cost that matters is not storage but what
must be held in mind to do the next thing.

---

## What this company refuses

- **Accumulation.** Curation, not an archive of everything encountered. A thing is kept because
  it is going to be used.
- **Validation.** The system exists to prepare its operator, not to agree with them.
- **Self-optimisation.** Nothing enters for elegance. Without real work unblocked it does not
  get in — and that applies to this file hardest of all.
- **Growth by role.** An org chart with no retirement rule accumulates dead roles the way an
  unmaintained system accumulates dead rules, and a dead role is worse: it still costs
  attention every time it fires.

## How the levels are used

**R&D proposes improvements to the axioms, never to this file.** The superauditor checks the
axioms are not violated **and reports when a clause here has drifted from the axioms that serve
it** — in either direction: a clause with no axiom behind it is a value with no teeth, and an
axiom serving no clause is a rule with no mandate. Both roles answer to this file and neither
may amend it.

**The coverage is counted, not assumed.** A stated priority that no rule implements is exactly
how a system ends up protecting the wrong things — and it is measurable, so it is measured. See
the coverage table at the foot of `AXIOMS.md`.
