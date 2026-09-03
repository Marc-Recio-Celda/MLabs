---
name: audit
description: Routes a closed task to the auditor whose department the work touched — company, instance or project — or to the saturation or promotion review. Use when an active front closes, when a long stretch of work is behind you, or to get a reading nobody asked for.
---

# audit

This skill **routes** to an auditor; it does not perform the audit.

> ⚠️ **It is also the declared winner for everything the three auditors share** (`MLabs:AX-20`) —
> the brief, the output shape, the ledger entry, the log row, the tally, the dismissal mechanics,
> what an auditor does not do.
> **A role file states its scope, its occasion and its own checks, and cites this one for the rest.**
> The departments differ in **scope and not in force**, so no role is senior enough to own another's
> contract; the dispatcher is nobody's peer.
>
> **A role file defines the role; the instance holds its hiring record** — the criterion, the
> standing, the history (`MLabs:AGENTS.md` §4). **On structure the role file wins.**

## Occasion
**An active front closing** · a long stretch of work behind you · wanting a reading you did not ask
for. **Each auditor names the narrower occasion of its own department**, and that is the one that
decides whether a given close fires.

⛔ **The operator invokes an audit; an agent that sees the occasion says so and names it.** The
cost of that is real — a role tied to an event is one nobody has to decide to run — so it carries a
condition to reconsider it by: ⏳ **if findings start arriving only from the operator noticing
things, the trade has failed and this line is the evidence.**

⚠️ **A condition that is true at every close names no occasion at all.** The close writes the live
set, the logs and the compass by definition, so **each role publishes what in its department is not
structural**, and that list is what keeps its occasion from being permanent.

**A role fires once per close, over everything the task touched** — not per entry and not per file.

## Which one to dispatch

| Department the task touched | Dispatch |
|---|---|
| The public structure — philosophy, the company axioms, the method, a skill, the allowlist | **`skills/company-auditor/`** |
| The operations centre — its own axiom department, its binding, the shape of its live set | **`skills/instance-auditor/`** |
| One project's cartridge — its architecture, its contract, its own tooling | **`skills/project-auditor/`** |

**Each role file is the single source for its own department.**

**Two auditors on one close is the expensive one doing work it was not hired for.** If a task
genuinely spans two departments, dispatch the higher one and **say the lower was not run** — an
unrun check is reported as unrun, never as passed (`MLabs:AX-22`).

## The brief — fresh context, every time

The audit runs as a subagent that **has not seen the conversation and must not**: it reads from
disk, and the live plan is how it sees the round's *reasoning* without reading a transcript
(`METHOD.md` §3).

**The brief is three things and nothing else:** the role file's checklist · the paths the task
touched · that task's live plan.

⚠️ **The brief never contains the dismissal criterion, nor names the file that holds it.** An
auditor that knows it is judged for agreeing has an incentive to manufacture findings, which
destroys the measurement it exists to produce. **Point the brief at the checklist, never at the
record.**

⚠️ **And if the task itself touched that record, the path is withheld and the report says which path
was withheld.** There is no file an auditor can never be pointed at — the brief is *the paths the
task touched*, and any file can be touched — so the rule is on the dispatcher, not on the filing
cabinet. **A brief silently missing a path is indistinguishable from a round that did not touch it.**

⚠️ **Fire before the live plan closes, not after.** This is the most common way to get the close
wrong and it fails silently: fired late, the audit reads the *previous* round's reasoning.
**Closed, not emptied** — the plan becomes a closed plan record at the path the binding declares and
stays readable, so a late audit can still be given the right plan by id.

⚠️ **The fresh context above is a discipline, not yet a mechanism.** `context: fork` would enforce
it, and would stop the audit's reading from displacing the working conversation's. It is **not set**:
a forked skill defaults to running in the background, and these roles must finish **before** the plan
closes, so it needs `background: false` alongside — a pair with a minimum tool version.
**Verify the version, then set both or neither**; setting only the first inverts the close order
silently.

## How an auditor answers — the shape, for all three

Findings, or the list of what was checked and found nothing — **silence is not available**
(`MLabs:AX-6`). An auditor that may stay silent drifts toward silence, because silence is always
safe and never looks wrong.

A finding **cites a file and line, or a command and its output.** Anything requiring execution the
role cannot perform is flagged as unrun, never claimed.

```
Checked: <the role's own check ids>
Finding — <one line>
  Evidence: <file:line, or command + output>
  Cost if ignored: <one line>
Or: Nothing. <checks run> against <files read>; <one line per veto on why it did not fire>.
```

**No idea slot.** A role paid for findings is not invited to invent: a reserved slot gets filled
every firing, and then ideas arrive dressed as findings because findings are what the tally counts.
**A sentence is something you may say; a slot is something you must fill** — one plain sentence
outside the report is fine, never counted and never expected. Lateral work is `skills/rnd/`.

## What an auditor does not do

It does not reject — only the operator acts on a veto. It does not read the transcript. It does not
edit files and it does not commit. **It does not propose**: a suggestion is not a finding, and if a
tally ever counts one as the other the role has stopped being what it is for.

**And it does not redefine what it audits.** A role paid to find faults must not be invited to fix
them by redesign, or it starts finding exactly the problems its redesign resolves. **The auditor
says *this is not true any more*; *what is true instead* is `skills/redefine-project/`.**

## What comes back, and what to do with it

1. **The operator adjudicates.** Not every finding is genuine, and the count that binds is the one
   they accept.
2. **One row per finding** in the role's log — one file per role, at the path the binding declares.
3. **One ledger entry per firing** in the operations centre's agent log: the narrative.
4. **Only the operator acts on a veto.**
5. **Apply what survives** — and where a finding is accepted and not fixed, say so and why. **An
   accepted finding with no visible outcome is the audit quietly becoming decoration.**

### The ledger entry

```markdown
### [<role>] — round <N> · <scope> · (<role>, <date>)

**Verdict:** <N> findings
<the report>
```

⚠️ **`[superauditor]` is the historical prefix and is never renamed.** Rounds 1–7 fired under it and
carry it; renaming would make every past firing invisible to any command that greps it, which is the
one thing a ledger exists to prevent. **Per-role prefixes apply from round 8 forward**, and the same
holds for the `Origin` column in the axiom departments.

### The log row — defined here, cited by all three

**Every employee-skill keeps a log**, one row per **finding**, not per firing: the firing is the
`Round` column, so counting rows gives findings and counting distinct rounds gives firings, **both
from the same table**. State is the instance's; this file says only that the log exists and what a
row carries.

| Field | Contract |
|---|---|
| `ID` | `<prefix><nnn>`, never recycled, never renumbered |
| `Round` · `Date` | the firing, and the day |
| `Acc` | **the operator's ruling.** `y` accepted · `wrong` a false positive · `misrouted` true but another role's department · `declined` true and in scope, not acted on · `deferred` held for a named future event · `—` not yet adjudicated. **Value counts `y`; precision counts `wrong` and nothing else** — and they are two numbers, because a role can be right and useless |
| `Status` | `fixed-same-round` · `fixed-later` · `open` · `accepted-not-fixed` · `withdrawn` |
| **`Repeat of`** | **the earlier ID this recurs, or `—`. The field the log exists for.** It may cite **another role's prefix** — a finding one auditor raises and another re-raises is still a repeat |
| `Finding` · `Where` | one line each; the reasoning stays in the ledger |

⚠️ **Read your own log before reporting.** A finding you raised before and that is still `open` is
**a repeat, not a new finding** — say so and cite the ID. Without that a log reports the same finding
as new every round, and **the role's value reads larger than it is** in the one direction the
operator reading that log cannot detect.

⚠️ **The reader, and its proof against an adversarial plant, live in the employee-log directory's
own `README.md`** — instance-side. This table is the structure it implements; that file is the state.

### Standing — the three of them, in one table

| Role | Log | Ledger prefix, and where it is written | Hired |
|---|---|---|---|
| `company-auditor` | `CA-` | `[company-auditor]`, the instance ledger | **once**, for the public structure |
| `instance-auditor` | `IA-` | `[instance-auditor]`, the instance ledger | **once**, for the operations centre |
| `project-auditor` | `PA-<project>-`, **one file per project** | `[project-auditor]`, **that project's** agent log | **per project** — a project's blind spots are its own |

**Every log sits at the path the instance's binding declares** (`MLabs:AX-1`). **The per-role
prefixes apply from round 8 forward** under the renaming rule above, and **which earlier rounds a
role inherits is in that role's own log.**

## The tally — read from the logs, not from the ledger

**The operator reads a role's log against its criterion (`AGENTS.md` §4), and the logs are shaped so
that reading is a command rather than an impression**: one file per role, a `Round` column and an
`Acc` column, parsed **by column name**.

```bash
python3 <the instance's metrics script> --json   # → audits.<role>.firings · .operator_accepted
```

⚠️ **The literal path is the instance's and is declared in its binding, never here.** A public file
that hard-codes a path below an operations centre is a program that runs on exactly one machine —
the failure `MLabs:AX-1` exists to prevent, and the release gate blocks it.
**The same holds for the hiring record: it is reached through the binding, never by a name written
here.**

⚠️ **A row belongs to the role that wrote it and is never reassigned.** Where one role held two
jurisdictions before the split, its rows stay its own and the new roles start empty — **splitting
that history retroactively would be inventing a measurement**, and an invented one is
indistinguishable from a real one once it is in the table.

⚠️ **Test the tally against a planted row before trusting it** (`MLabs:AX-7`, which says how to
plant). **Five consecutive counting defects survived a rule written to catch them**, and every one
of them was in a log nobody had planted against.

## How a role is dismissed — the mechanics, for all three

**When the criterion is written and where it lives are `MLabs:METHOD.md` §5's**, and **the operator
reads the role's log against it and decides.** ⛔ **The numbers are read, never arithmetic that acts
on its own** — a threshold that fires by itself retires a role on the round that happened to be
quiet.

**A role file names its own standing** — its log prefix, and whether it is hired once or per project
— **and cites this section for the rest.** The record itself is reached through the instance's
binding, under the rule *The brief* states above.

## Verification, as a prediction

Before dispatching, state what you expect: *this round touched N files and I expect findings on
dimensions X and Y.* **A report that lands entirely outside the prediction is worth more than one
that confirms it** — and a report that confirms every time is what the dismissal criterion exists to
detect.

## Retirement

**Retired if, after ten dispatches, the operator is picking the role by hand anyway.** That would
mean the routing table is a lookup a person performs faster than a skill, and the shared contract
under it belongs in `AGENTS.md` rather than behind a door nobody opens. **The tally is dispatches
against corrections**: a wrong department chosen and then reversed is what this table prevents, and
zero of those over ten dispatches is the evidence to close it.

## Its boundary

**It dispatches and audits nothing.** Proposing ideas is `skills/rnd/`; **what the findings mean,
and what to do about them, are the operator's.**
