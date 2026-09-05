---
name: company-auditor
description: Audits the public structure that would bind any instance — philosophy, the company axiom department, the method, the skills, the allowlist. Use when a front closes over changes to any of them. It also runs the saturation and promotion reviews, which no other role does.
---

# company-auditor

**The company's long-term health** — the tier whose failures are invisible from inside any one
instance.

> **Shared contract: `skills/audit/`.** What follows is this role's alone — its scope, its
> occasion, its checks, and the two reviews nobody else runs.

## Why it exists

A system improved only by its operator is not self-improving — nothing in it detects its own
degradation. **And attention inside a working conversation is governed by salience:** the principles
labelled *non-negotiable* are checked constantly precisely because nobody forgets them, while the
pressures that cannot be retrofitted — scale, context cost, the purpose itself — go unchecked for
exactly as long as nothing hurts. **This role re-asks, at close, the questions the conversation
demonstrably skips.**

## Its scope — and where it stops

**The public structure: what would bind an instance that is not this one.** Philosophy, the company
axiom department, the method, the skills, the bindings' method half, the allowlist.

**Not the operations centre's own department, binding or live set** — `skills/instance-auditor/`.
**Not one project's cartridge** — `skills/project-auditor/`. **Reaching into either is the tier
confusion this role exists to catch, seen from inside.**

## Occasion
**One event: a task closes having changed a company-structural file.** Then this role fires
**once**, over everything that task touched. Not per entry, not per file.

|                             |                                                                                        |
| --------------------------- | -------------------------------------------------------------------------------------- |
| The three levels            | `PHILOSOPHY.md` · any `AXIOMS.md`, in any department · any project's `architecture.md` |
| The method and the bindings | `METHOD.md` · any `AGENTS.md` and its `CLAUDE.md` pointer · `PURPOSE.md`               |
| What executes               | anything under `tools/` · **anything under `interface/`**                              |
| What guards the boundary    | the allowlist (`.gitignore`) · the denylist · the router                               |

**Not structural — and this half is the whole point:** the live set (`COMPASS` · `PLAN` · `MAILBOX`
· `TASKS` · `IDEAS` · the notebook) · the three logs · notes in the knowledge domains · code, data
and content · **and, since 2026-09-05, `skills/*/SKILL.md`.**

⚠️ **Skills came off the structural list on the operator's ruling** — *"las skills no son ni mucho
menos archivos estructurales, aunque haya que cambiarlas con cuidado"* — and the reasoning holds up
against what actually protects them. A skill is a **procedure**, not a rule: it says how a job is
worked, and getting it wrong costs one badly-worked job, not a corpus that no longer means what it
says. **What guards a skill against the one failure that would be structural — an `AX-1` leak — is
`tools/gate.sh`, which runs at every commit and fired on exactly that the day the skills were
rewritten.** An audit round is not what was catching it.

⛔ **Not structural is not *edit freely*.** *"Aunque haya que cambiarlas con cuidado"* is the
operator's own qualifier and it stays: a skill still carries its verification as a prediction, still
declares what it does not do, and a change to one is still read before it is trusted. **What changed
is who reviews it, not whether it is reviewed.**

⚠️ **The second list is what keeps this occasion from being permanent** (`skills/audit/`).

⚠️ **`interface/` is the line someone will want to narrow** — to `model/` and `server.py` — if the
occasion starts arriving on rounds nobody asked for. **Do not: an `AX-1` leak lives in a view just as
happily as in the engine**, and the view is the larger half by an order of magnitude.

## What it checks — and nothing else

**The list is fixed and finite**, because the honesty rule makes the role state what it checked, and
*"I checked everything"* is not falsifiable.

**The vetoes** — mechanical, cheap, and they reject:

| #   | Check                                                                                                                                     |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| V1  | **Traceability** — every new decision entry carries its origin, naming **who decided**. Evidence is not a decider; `inherited` is a value |
| V2  | **Single source** — if this fact changes, how many files must be touched? >1 with no written expiry is a veto                             |
| V3  | **Real return** — what concrete work does this unblock, for whom? No named consumer, no entry                                             |

⚠️ **`traps.md` beside this file is the department's trap set**, keyed by axiom id — *this is how
you get it wrong*, held here rather than in `AXIOMS.md` because a trap fires when the governed thing
is written and that file is read on every turn (`AX-4`). Read it while checking a row, and **prune
it here**: a trap whose axiom has left `AXIOMS.md` binds nobody.

**The pressures** — the actual job; they do not reject, they return with the cost named. ⚠️ **They
are read in this order because a pressure skipped while designing cannot be retrofitted**, which is
the inverse of the order the vetoes run in: a veto is verifiable after the fact and a pressure is
not.

| #   | Check                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | **Scale at 10×** — not *does it survive*, but **which step breaks first, and at what multiple**. Ten times is deliberately beyond anything planned: a design that only answers for the next doubling is answering about today                                                                                                                                                                                                                                                                                                                                                                           |
| A2  | **Context cost** — what does this cost to load, and what does it displace? A rule is paid every turn; a skill is paid once                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| A3  | **Rule-vs-tool** (`AX-4`) — must this fire while the work happens, or could a pass fix the artefact afterwards?                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| A4  | **Alignment** — which philosophy clause does this serve, and does the axiom it leans on still implement that clause? Report drift **in both directions**: a clause with no axiom behind it, and an axiom serving no clause                                                                                                                                                                                                                                                                                                                                                                              |
| A5  | **Arrival at level 1** — fires only when `PHILOSOPHY.md` gained or lost a clause. Three questions, in this order: **what does it forbid that was not already forbidden** — a clause that forbids nothing new is a summary, and the overlap is found by reading it against every *axiom*, not against the other clauses · **does it arbitrate** — a clause that decides nothing when two axioms disagree is an axiom wearing the wrong tier · **does it clash with a clause here**, and ⚠️ **nothing in this system resolves that clash**, because that file is the last court and has no court above it |
| A6  | **Did the compaction lose the rule?** `skills/compact/` does the mechanical half — growth, archaeology, references. **This check is only what a tool cannot decide:** for each block that moved, **is the operative layer still complete without it**, and is the note itself still worth keeping. ⚠️ **A rule that survived as a note is a rule retired without anyone deciding to** — the failure mode of a compaction pass, and invisible to the pass itself                                                                                                                                         |

> **Portability is not on this list.** It is **derived**, not independent: where origins are
> recorded, state is on disk rather than in a transcript, and artefacts are stamped, portability
> follows — so asking it here measures the same thing twice. And it is the one dimension with a real
> test instead of a question: **the cold start**, run at every release cut. A question yields an
> opinion; a cold start yields an answer.

## The saturation review — fires whenever any axiom department changes

**This role runs it, and it is the only one that does** — it is the only reading that holds every
department at once, and **a contradiction *across* departments is invisible to any narrower one.**
`instance-auditor` and `project-auditor` **report that it is owed** and do not run it.

Any addition, edit or retirement in any axiom department fires it. It reads **every axiom in every
department together** — not the entry that changed. The reason is arithmetic: **a set saturates one
entry at a time, and no single addition ever looks like the one that broke it.**

**First, enumerate the corpus — as a command's output, never as a recollection.** The instance's
metrics script reports every tier, **both `architecture.md` formats, and a third answer**: a file it
read and did not recognise is labelled `unrecognised` with its size rather than diagnosed. Read that
output, and **name in the report any department it could not count.** ⚠️ **A firing that cannot say
how many axioms it read is partial and must say so** (`AX-22`).

Of every axiom, including the untouched ones:

| | |
|---|---|
| **Load-bearing?** | If this were deleted, what would go wrong that nothing else catches? *"It is true"* is not an answer — most true things are not axioms |
| **Distinct?** | Which other axiom is nearest, and is the gap worth the reader's attention? Two axioms one reader cannot tell apart are one axiom and a tax |
| **In force?** | Does it bind, or does it advise? An axiom that can be politely ignored is a decision wearing the wrong hat. ⚠️ **And a check that passes over zero lines is vacuous, not verified** |

⚠️ **An axiom this role changes or retires is followed to every file citing it, in the same act**
(`AX-33`). `grep -rln '<the id>' $(git ls-files)` gives the list, and `tools/axiom-refs.sh` proves
none was left pointing at a row that no longer exists. **Nothing else in this method does that
sweep.** ⚠️ **A citation left behind is not a broken link** — it is a file quietly obeying a rule
that has changed, which nothing reports and no reader can see from inside the file.

**Demotion is the expected outcome, not a failure.** An axiom that turns out narrower, softer or
already-implied **becomes a decision** and moves to the log. **The set is meant to shrink under this
review as often as it grows**, and **a contradiction across departments carries the same severity as
one inside a single file** (`skills/audit/`).

## The promotion review — a second firing, on a different clock

**Runs only when the operator calls it.** Not per task and not on a clock: the question is not
whether a round complied but **whether the axiom set still matches the work being done**, and that
question does not get a better answer for being asked on schedule. It reads the decisions logged
since the previous review, in three directions.

**Upward — what is missing.** A pattern in three or more decisions, none of which cite an axiom, is
a rule the company already follows without having written it down. Report it with the three
decisions as evidence.

**Downward — what is dead.** An axiom no decision has invoked since the last review is either
universally obeyed — which is what success looks like — or it no longer describes how the work is
done. **The test that separates them: would a violation be visible?** If yes it is alive; if nobody
would notice, it is retired. **This direction is what keeps the set from inflating, and it is the
reason the review exists at all.**

**Sideways — what is contradicted.** A decision that worked *around* an axiom rather than within it
means one of the two is wrong. Name which, and why.

**This is not the idea slot returning.** Every output is derived from the corpus and cited to it —
three decision identifiers, or an axiom with a zero count. Its verdict line is counted separately:
`**Review:** <N> proposals`.

## Dismissal

Standing and criterion per `skills/audit/` — **`99_SYSTEM/logs/company-auditor.md`**, prefix `CA-`.
