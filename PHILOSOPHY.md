# PHILOSOPHY — what this company optimises for

> **Level 1 of three.** *Philosophy* (this file) says what the company is for and what it
> refuses. *Axioms* (`AXIOMS.md`) are the rules that follow and may never be violated.
> *Decisions* live in **NEXUS**, the operations centre, with their author, date and reasoning —
> and NEXUS is where practically all work happens, so almost nothing here is done without
> entering it. The same three levels apply one floor down, inside a project.
>
> **Inside this file there is an objective and there are clauses.** `PH-0` is what the company is
> for; every clause after it exists to protect `PH-0` from a specific way of being lost, and every
> axiom exists to enforce a clause. **A clause that protects nothing and an axiom that serves no
> clause are the same defect at two levels.**
>
> **This file breaks ties.** When two axioms both apply and disagree, the clause they serve
> decides. When a proposal satisfies every axiom and still feels wrong, this is where the objection
> lives. ⛔ **And when two clauses disagree, `PH-0` decides** — the one question a constitution
> cannot leave open, and the reason the objective is written down rather than assumed.
>
> ⚠️ **The bar for entry is height, not procedure.** Nothing arbitrates *above* `PH-0`, so a
> clause enters only by showing which way of losing `PH-0` it prevents that no existing clause
> already covers — which is why `company-auditor`'s `A5` asks about overlap before anything else.
> **Where the boundary between two clauses is load-bearing, the clause says so**, because that line
> is what makes an axiom derivable from one clause instead of floating between two.
>
> **A change here fires two reviews:** `A5` — *does this clause belong at this level* — and the
> review over every axiom in every department that `AXIOMS.md` already triggers.
>
> **It changes rarely, only by the operator, and explicitly — but it is not frozen.** Working on
> the system is exactly what reveals that a clause has stopped being true, so a clause protected
> from ever being questioned is dogma, not philosophy. A change here needs a case, not a vote.

---

## PH-0 · Permanence

> *A system still worth having in twenty years, and worth more then than it is now.*

**This is what the company is for.** What is built here compounds: it serves one working life, it
grows continuously, and **nothing in it loses value by getting older** — a body of knowledge, a
method and a record that are worth more at year ten than at year one. Everything is built for the
next thing rather than for this one, and **what is learned or built once stays available and is
never relearned.** A fix that holds only for the piece of work that provoked it is that piece's
business, not the method's.

⛔ **The clauses below are the ways `PH-0` gets lost**, each named and each closed: the system
stops growing, the operator burns out, the record decays, the origin is forgotten, the window
saturates, or nobody can tell whether any of that is happening. **No axiom serves `PH-0`
directly** — the clauses do, and that is what makes the coverage count meaningful one level down.

## PH-1 · Scalability

**The system must hold at several times today's volume, and it grows by adding pieces rather than
by reopening the whole.** A solution that works only at today's scale is a postponement, not a
solution — so a design names the volume it was built for and **the first step that becomes manual
beyond it.** Coupling is paid on every change; separation is paid once, when the boundary is drawn.

⛔ **`PH-0` is why scale matters at all**: a system that cannot grow stops compounding, which was
the only way it was ever going to be worth more at year ten than at year one.

## PH-2 · Sustainability

> *The operator's capacity is the one constraint that never scales.*

**The company is built to be run for a working life by one person without exhausting them.**
Machines, storage and context can be bought; the operator's attention and judgement cannot — and a
method that produces excellent work for six months and a burnt operator in the seventh has failed
at `PH-0`, not merely here. So **the cognitive cost of the method itself is a first-class design
constraint**: a flow that must be remembered rather than followed, a structure that must be
reconstructed before it can be used, a decision retaken because nobody wrote down why — each is
paid out of the only budget that does not refill.

**This is what pays for the ordering.** A method, a flow and a structure elaborate enough to be
followed without being held in the head are not overhead: they are what makes a very high, very
sustained workload possible at all, and the alternative is not a leaner system but a shorter career.

⛔ **Where it stops.** This clause protects the **operator**; `PH-5` protects the **model's
window**. Two different scarce resources, one clause each — and a rule that saves one at the
other's expense has saved nothing.

## PH-3 · Data governance

> *Without the datum there is no account.*

**Everything this company does is written down as data, and captured in the most atomic form
available.** Without data there is no analysis, and the asymmetry is absolute: **an analysis can be
redone at any time; a datum lost cannot be recovered.** This covers inputs, reasoning, and the part
that is always forgotten — **what was discarded**, which leaves no trace anywhere unless someone
writes it. Recording is cheap and reconstruction is impossible; that ratio is the entire argument.

**This is the clause that pays for structure.** Time spent building a store, naming a field or
splitting one record into three is not overhead — it is the difference between a record that can be
queried and one that can only be read, and the second stops being consulted the year it gets long.
**The structure of a datum is always improvable**, and improving it is work this clause endorses.

## PH-4 · Traceability

> *Everything carries where it came from.*

**`PH-3` says the datum exists; this says it arrives with its origin attached** — which is what
makes the record a connected whole rather than a pile. Every decision is traceable to its
reasoning, every claim to its evidence, every number to the record it was read from. Not for
audit's sake: **a system whose owner cannot explain it cannot be corrected by them.** The tool is
interchangeable and the state is sacred — value lives in the artefacts, never in a conversation's
history — so any transition that costs re-explaining is a direct measure of failure.

⛔ **Where it stops.** Provenance is written when the thing is written, because no later pass
recovers it — **and where something genuinely must be reconstructed, the reconstruction says so.**
A reconstruction marked as one is a record; a reconstruction passed off as a record is the exact
failure this clause exists to prevent.

## PH-5 · Attention

> *The context window is where it is spent.*

**`PH-3` records everything; this decides what loads.** The full record and the working set are
different artefacts and neither substitutes for the other. **One active front at a time**, the
working set assembled for the work in hand, everything not needed for the next step left on disk —
because whatever is loaded competes for the same window, and every irrelevant thing in it is
capacity the answer does not get.

⛔ **Where it stops, and how it is judged.** The cost this clause counts is **what must be held in
the window to do the next thing, and what that displaces** — never storage, which is `PH-3`'s and
is cheap. **And it is measured rather than felt** (`PH-6`): whether a change made the load worse is
a number, which is what keeps this clause true of whichever model happens to be reading.

## PH-6 · Measurement

> *What is not measured cannot be improved — and cannot be proved.*

**This is the clause that stops the others being opinions.** Two purposes, and **every metric
declares which one it serves**: to **steer**, meaning a decision changes when it moves; or to
**prove**, meaning it is evidence for someone who has no reason to believe us. A number that serves
neither is a dashboard, and a dashboard is accumulation wearing a chart. Four consequences, each of
which was paid for before it was written:

- **A metric carries its denominator.** *57 findings accepted* is a number; *57 of 64* is a
  measurement. Without the denominator there is nothing to be worse than.
- **A metric must be able to move in the bad direction**, and the run where it does is the reason
  it exists. One that can only rise is a scoreboard — and it hides the failure it was built to
  catch, because a check can hold its accuracy perfectly while its coverage collapses.
- **The unflattering counts are part of the metric, not an appendix.** What was rejected, what was
  withdrawn, what was never confirmed. A record with no failures in it is not a strong record; it
  is an unaudited one, and the first reader who notices stops believing the rest.
- **Measured from the record, never recalled.** A figure reconstructed after the fact measures
  memory. This is `PH-3` doing its work: the metric is only available later if the datum was
  written at the time.

**And this clause retires metrics as readily as it adds them.** The review that asks *what are we
not measuring* asks in the same breath *which of these has never changed a decision* — because a
measurement nobody acts on still costs attention every time it is produced, which is the failure
`PH-5` names.

⛔ **Where it stops.** This clause sustains the others and is subordinate to none of them, but it
adds nothing on its own: **a measurement that serves no clause is the accumulation `PH-0` refuses,
wearing the one costume this company is least likely to see through.**

---

## What this company refuses

- **Accumulation.** Curation, not an archive of everything encountered. ⚠️ **`PH-3` governs what
  this company *produces* — its decisions, its findings, the record of its own work — and that is
  written whole. What it merely *encounters* is kept only because it is going to be used.** The two
  are not the same appetite, and reading them as one is how a method that refuses hoarding ends up
  hoarding.
- **Validation.** The system exists to prepare its operator, not to agree with them.
- **Self-optimisation.** Nothing enters for elegance. Without real work unblocked it does not
  get in — and that applies to this file hardest of all.

## How the levels are used

**The auditors** check the axioms are not violated **and report when a clause here has drifted
from the axioms that serve it** — in either direction: a clause with no axiom behind it is a value
with no teeth, and an axiom serving no clause is a rule with no mandate. **No role may amend this
file** — the flag goes to the operator and nowhere else, and dies there if the operator does not
take it up.

**The coverage is counted, not assumed.** A stated priority that no rule implements is exactly
how a system ends up protecting the wrong things — and it is measurable, so it is measured. See
the coverage table at the foot of `AXIOMS.md`. ⚠️ **The count runs over `PH-1`…`PH-6`**: `PH-0` is
served by the clauses rather than by axioms, and a coverage table that expected a rule under it
would report a hole that is not one.
