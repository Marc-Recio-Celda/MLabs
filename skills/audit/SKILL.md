---
name: audit
description: Dispatches an auditor over a closed task — company, instance or project, whichever department the work touched — or runs the saturation or promotion review. **Invoked by the operator, never automatic.** The natural moment is when an active front closes; use it also after a long stretch of work, or whenever you want a reading you did not ask for.
---

> **Version:** MLabs 1.1.0

# audit

This skill **dispatches** an auditor; it does not perform the audit.

> ⚠️ **It is also the declared winner for everything the three auditors share** (`MLabs:AX-20`) —
> the brief, the output shape, the ledger entry, the log row, the dismissal mechanics.
> **A role file states its scope, its trigger and its own checks, and cites this one for the rest.**
>
> **Why the contract lives here and not inside one of the roles.** It lived in `company-auditor`
> until 2026-08-19, and `instance-auditor` did not cite it — it **restated the whole file**, so both
> carried the sentence *"this file is where the row contract is defined; every other auditor cites
> it rather than restating it"* and each declared itself the winner (`CA-054`, `CA-064`, `IA-006`).
> The departments differ in **scope and not in force**, so no role is senior enough to own another's
> contract. The dispatcher is nobody's peer, and it already held half of this material.

## Which one to dispatch

| Department the task touched | Dispatch | Its definition, which is the single source |
|---|---|---|
| The public structure — philosophy, the company axioms, the method, a skill, the allowlist | **company-auditor** | `skills/company-auditor/` |
| The operations centre — its own axiom department, its binding, the shape of its live set | **instance-auditor** | `skills/instance-auditor/` |
| One project's cartridge — its architecture, its contract, its own tooling | **project-auditor** | `skills/project-auditor/` |

⚠️ **There is no `roles/` directory.** This file said *"the role's definition is
`roles/superauditor.md` and it is the single source"* until 2026-08-19 — a path `MLabs:AGENTS.md`
forbids and `git ls-files` cannot find — and then restated that role's triggers in the wording
`M-115` had retired. **The dispatcher sent the role to a path that did not exist and briefed it
from a rule no longer in force.**

**Two auditors on one close is the expensive one doing work it was not hired for.** If a task
genuinely spans two departments, dispatch the higher one and **say the lower was not run** — an
unrun check is reported as unrun, never as passed (`MLabs:AX-22`).

⚠️ **Nothing here fires by itself.** The automatic trigger was retired 2026-08-18: five firings in
one session cost more context than the work they audited. **The cost, named because it is real:**
these roles existed as events precisely so they would *never be convenient to skip*, and they are
now convenient to skip. The compensation the operator chose is an interface that makes the state
visible enough that skipping is a decision rather than a drift. **If findings start arriving only
from the operator noticing things, that trade failed and this line is the evidence to reopen it.**

## The brief — fresh context, every time

The audit runs as a subagent that **has not seen the conversation and must not**: it reads from
disk, and the live plan is how it sees the round's *reasoning* without reading a transcript
(`METHOD.md` §3).

**The brief is three things and nothing else:** the role file's checklist · the paths the task
touched · that task's live plan.

⚠️ **The brief never contains the dismissal thresholds — nor names the file that holds them.**
An auditor that knows it is retired for agreeing has an incentive to manufacture findings, which
destroys the measurement it exists to produce. `instance-auditor`'s first firing was briefed with
**the instance's hiring record** and **read `K` and `N` before it could know what the line was**,
and said so (`IA-007`). Point the brief at the checklist, never at the record.

⚠️ **And if the task itself touched the hiring record, that path is withheld from the brief and the
report says which path was withheld.** There is no file an auditor can never be pointed at — the
brief is *the paths the task touched*, and any file can be touched. So the rule is on the
dispatcher, not on the filing cabinet: **withhold, and declare the withholding**, because a brief
silently missing a path is indistinguishable from a round that did not touch it.

⚠️ **Fire before the live plan closes**, not after. This is the most common way to get the close
wrong, and it fails silently. `IA-005` is the same failure from the other side: a round fired with
the *previous* round's plan still in place, so the audit read reasoning that belonged to another
task. ⚠️ **Closed, not emptied** — the plan becomes a **closed plan record** at the path the
instance's binding declares, and stays readable, which also means a late audit can still be given the right plan by id.

⚠️ **The fresh context above is a discipline, not yet a mechanism.** `context: fork` in a role's
frontmatter would enforce it, and would also stop the audit's reading from displacing the working
conversation's. It is **not set**, for one reason: a forked skill defaults to running in the
background, and these roles must finish **before** the plan closes. Setting `context: fork`
therefore requires `background: false` alongside it, and that pair has a minimum tool version.
**Verify the version, then set both or neither** — setting only the first inverts the close order
silently, which is the failure two paragraphs up.

## How an auditor answers — the shape, for all three

Findings, or the list of what was checked and found nothing — **silence is not available**
(`MLabs:AX-6`). An auditor that may stay silent drifts toward silence, because silence is always
safe and never looks wrong; the account of what was checked is what keeps it honest.

A finding **cites a file and line, or a command and its output**. Anything requiring execution the
role cannot perform is flagged as unrun, never claimed.

```
Checked: <the role's own check ids>
Finding — <one line>
  Evidence: <file:line, or command + output>
  Cost if ignored: <one line>
Or: Nothing. <checks run> against <files read>; <one line per veto on why it did not fire>.
```

**No idea slot.** A role paid for findings is not invited to invent: a reserved slot gets filled
every firing, and then ideas start arriving dressed as findings, because findings are what the tally
counts. **A sentence is something you may say; a slot is something you must fill** — one plain
sentence outside the report is fine, unformatted, never counted and never expected. Lateral work
belongs to `skills/rnd/`.

## What an auditor does not do

It does not reject — only the operator acts on a veto. It does not read the transcript. It does not
edit files and it does not commit. **It does not propose**: a suggestion is not a finding, and if a
tally ever counts one as the other, the role has stopped being what it is for.

**And it does not redefine what it audits.** A role paid to find faults must not be invited to fix
them by redesign, or it starts finding exactly the problems its redesign resolves. The auditor says
*this is not true any more*; deciding *what is true instead* is `skills/redefine-project/` and the
operator's, with an agent holding the pen.

## What comes back, and what to do with it

1. **The operator adjudicates.** Not every finding is genuine, and the count that binds is the one
   they accept.
2. **One row per finding** in the role's log — one file per role, at the path the instance's
   binding declares for employee logs. Contract below.
3. **One ledger entry per firing** in the operations centre's `LOG_AGENTS.md`: the narrative.
4. **Only the operator acts on a veto.** The role reports; it never rejects.
5. **Apply what survives** — and where a finding is accepted and not fixed, say so and why. An
   accepted finding with no visible outcome is the audit quietly becoming decoration.

### The ledger entry

```markdown
### [<role>] — round <N> · <scope> · (<role>, <date>)

**Verdict:** <N> findings
<the report>
```

⚠️ **`[superauditor]` is the historical prefix and is never renamed.** Rounds 1–7 fired under it,
when one role held company **and** instance scope, and six rounds of history carry it. Renaming
would make every past firing invisible to any command that greps it, which is the one thing a ledger
exists to prevent. **Per-role prefixes apply from round 8 forward.** The same holds for the `Origin`
column in the axiom departments — append-only records of who found what, not labels to keep current.

### The log row — defined here, cited by all three

**Every employee-skill keeps a log**, one row per **finding**, not per firing: the firing is the
`Round` column, so counting rows gives findings and counting distinct rounds gives firings, **both
from the same table**. State is the instance's; this file says only that the log exists and what a
row carries.

| Field | Contract |
|---|---|
| `ID` | `<prefix><nnn>`, never recycled, never renumbered |
| `Round` · `Date` | the firing, and the day |
| `Acc` | **the operator's ruling.** `y` accepted · `wrong` a false positive · `misrouted` true but another role's department · `declined` true and in scope, not acted on · `deferred` held for a named future event · `—` **not yet adjudicated**. `K` counts `y`; **precision counts `wrong` and nothing else** ⚠️ *Split 2026-08-20 — a single `n` had been carrying three different events and only the first is a quality failure. This file is the declared winner and was publishing the pre-split vocabulary for a day (`CA-071`)* |
| `Status` | `fixed-same-round` · `fixed-later` · `open` · `accepted-not-fixed` · `withdrawn` |
| **`Repeat of`** | **the earlier ID this recurs, or `—`. The field the log exists for.** It may cite **another role's prefix** — a finding one auditor raises and another re-raises is still a repeat |
| `Finding` · `Where` | one line each; the reasoning stays in the ledger |

⚠️ **Read your own log before reporting.** A finding you raised before and that is still `open` is
**a repeat, not a new finding** — say so and cite the ID. Without that the dismissal rule miscounts
in the direction that never retires anyone: `N` counts firings that add nothing, and three unfixed
findings re-raised score as three new ones.

⚠️ **The reader, and its proof against an adversarial plant, live in the employee-log directory's
own `README.md`** — instance-side, at the path the binding declares. This table is the structure it
implements; that file is the state.

## The tally — read from the logs, not from the ledger

**`AGENTS.md` §6 needs `N` and `K` countable per role, and the logs already are**: one file per
role, a `Round` column and an `Acc` column, parsed **by column name**.

```bash
python3 <the instance's metrics script> --json   # → audits.<role>.firings · .operator_accepted
```

⚠️ **The literal path is the instance's and is declared in its binding, never here.** A public file
that hard-codes a path below an operations centre is a program that runs on exactly one machine —
which is the failure `AX-1` exists to prevent, and the release gate blocks it.

⚠️ **This is a move, and it is what makes the numbers reproducible.** The tally used to grep
`LOG_AGENTS.md`, where **all three roles publish**, so from the moment there were two roles one
command counted them together and nothing separated them (`IA-006`). The ledger keeps the narrative;
the log keeps the data. **The instance's hiring record** already says *Firings — computed, by the metrics script* in
one cell and *the tally lives in the ledger* in another; **this settles it in favour of the first.**

⚠️ **The filename is deliberately absent from this file, 2026-08-20** (`CA-073`). Until then the
paragraph forbidding the brief to name the hiring record **named it three times, twice more further
down** — so a dispatcher reading the prohibition learned the filename from the prohibition. The
record is reached the way every other instance path is: **through the binding**, never by a name
written here.

⚠️ **Rounds 1–7 belong to both scopes and count toward neither role's dismissal.** One role held
both jurisdictions; splitting that history retroactively would be inventing a measurement.
**The per-role clocks start at round 8**, and saying so is the honest form of the alternative.

⚠️ **Test the tally against a planted row before trusting it** (`MLabs:AX-7`), and **plant against
the format, not merely into it** — a plant written in the file's own style reproduces the file's own
blind spot, which is how five consecutive counting defects survived a rule written to catch them.

## Verification, as a prediction

Before dispatching, state what you expect: *this round touched N files and I expect findings on
dimensions X and Y.* A report that lands entirely outside the prediction is worth more than one that
confirms it — and a report that confirms every time is what the dismissal criterion exists to detect.

## Retirement

⚠️ **Renamed from `## Dismissal` on 2026-08-21, and the rename is the finding.** This section was
written to satisfy a §5 invariant that counted the *heading* across every skill — so one word carried
three different meanings and the check could not tell them apart. **A dismissal ends a role and needs
a log (`AX-11`); a retirement ends a skill and needs neither.** This is the second: `audit`
dispatches, it is not hired, and nothing about it belongs in an employee log.

**Retired if, after ten dispatches, the operator is picking the role by hand anyway.** That would
mean the routing table is a lookup a person performs faster than a skill, and the shared contract
under it belongs in `AGENTS.md` rather than behind a door nobody opens. **The tally is dispatches
against corrections**: a wrong department chosen and then reversed is what this table prevents, and
zero of those over ten dispatches is the evidence to close it.

## What this skill does not do

It does not audit — it dispatches. It does not propose ideas. It does not decide what the findings
mean. It does not fix what they name.
