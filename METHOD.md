# METHOD — how work actually flows

> **Version:** 1.0.0

> **The fourth document, and the only one you use every day.** `PHILOSOPHY.md` says what this
> company optimises for; `AXIOMS.md` what may never be violated; **this file says how work
> actually moves**; and NEXUS holds what happened. The first two are read once and rarely
> again. This one is the shape of a working day, and it is what makes the company reproducible
> rather than a set of opinions — a stranger who reads only the axioms knows the constraints
> and still has no idea what to do on Monday morning.

---

## 1. Six kinds of document, and the kind matters more than the name

Every artefact is exactly one kind, and **the kind fixes its lifecycle**. Mixing two kinds in
one file is the most frequently recorded failure in this company's history: a queue that never
empties, a record someone edited, a plan that quietly became a backlog.

| Kind | Lifecycle | Failure if mixed |
|---|---|---|
| **Record** | Append-only. Never edited, never deleted, grows forever. The receipt | Editing it destroys the only copy of what was true then |
| **Queue** | Filled by one side, drained by the other; an item leaves when it is done (AX-15). **Not a stack and not first-in-first-out** — the order is the operator's to set and reset at any time; what a queue guarantees is that nothing leaves without a destination, never that things leave in the order they arrived | A queue that only grows stops saying what is left |
| **Compass** | Tiny, rewritten in place, **one active front**. Read at every open, updated at every close | A compass with eight priorities never contradicts reality, so it is never corrected |
| **Live plan** | **Rewritten continuously while the work happens; CLOSED when the work closes — never emptied** (`FLOW.md` rule 3). It becomes a plan record and stays readable; deleting it drops the order, the reason for that order, and the items discarded with their reasons, which live nowhere else | A live plan that survives its task has become a backlog. ⚠️ And one that is *deleted* takes `PH-3` with it in exactly the case `PH-3` was written for |
| **Park** | No date, no commitment, no obligation to revisit | A park with dates is a task list nobody agreed to |
| **Standing** | Rewritten in place; always states what is true *now* or what must hold. Never appended to, never emptied | A standing document that grows by accretion has become a record nobody can trust as current |

⚠️ **Two queues at different speeds, and the fast one reports rather than files.** An instance
that runs a fast lane beside its deliberative queue **must not let the fast one file into the
slow one**: its entries are trivial by construction, so every doubt becomes an entry, and the
loop has no bound. **The drainer's channel back is its drain report** — what it did, what it
could not do, and what the entry taught — read at the next open and answered by whoever holds
the context.

The three levels of governance sit above all six: philosophy, axioms, then decisions — and
**decisions are Records.** A definition, a set of axioms, a state file and a sequenced plan are
all **Standing**: each is rewritten to stay true, and none is ever a place things accumulate.

---

## 2. The loop

**A session starts in one of two ways, and both end at the compass.**

- **The operator opens with an intent** — *"today I want to do X"*. The agent reads the compass
  anyway and, if X is not the `▶` row, **says so before working**: not to refuse, but because one
  of the two is out of date and this is the only moment that is cheap to discover. The operator
  overrides freely; what is not allowed is proceeding silently.
- **The operator opens with nothing.** Then the agent reads the compass and reports: here is the
  active front, here is what it waits on, here is what is queued behind it — *shall we?* An
  opening with no intent is not an absence of instruction; it is an instruction to orient.

Either way `COMPASS.md` names one active front `▶` and points at where that work is described;
it describes none of it.

**Open the live plan on that front.** `PLAN.md` is rewritten to hold *this task and
nothing else*: the concrete items, in the order they will be done, and the reasoning for that
order. It is not a summary written afterwards — it is written *while* deciding, which is what
makes it worth anything.

**Work the list, striking through as you go.** Every item leaves with a **destination**, and
the vocabulary is closed:

| Destination | Means |
|---|---|
| ✅ resolved here | done in this task; the trace goes to a Record |
| → task list | needs execution; becomes a task with its why (AX-14) |
| → integrated | landed in code or in a document; the diff is the evidence |
| → park | worth keeping, not now; goes to an ideas register |
| → mailbox | belongs to someone else's inbox, or is a passive finding you must not fix here (AX-25) |
| ⚫ discarded | rejected — **with its reason**, which is the half that has no other record (AX-24) |

**An item struck through with no destination is a failure of the close, not an omission** (AX-9).

**When an item spawns others, write them down immediately, right after the current one.** Even
— *especially* — when they have nothing to do with what you are on. An idea that arrives while
you are deep in something else is the one that gets lost, and "I'll remember it" is the exact
moment PH-3 is broken. Writing it down is not the same as doing it: it takes its place in the
list and gets a destination like everything else. Most will be ⚫ or → park, and that is a
successful outcome, not a wasted line.

**Two review surfaces, two scopes.** The **diff** is the gate for one change: applied, left
uncommitted, read by the operator. The **branch** is the gate for a session, which is what makes
undoing ten files touched in one pass cheap. A bulk mechanical change starts from a clean tree
and lands as its own commit, or the diff cannot separate the agent's side effects from the
operator's edits.

**An idea the operator voices in passing is written down in the same turn.** Not at the close,
not when the task ends: **in the turn it is said.** It goes to the park with its `project:`, one
line, and the work continues — nobody stops to evaluate it. This is the one capture rule whose
firing event is *someone spoke*, and it has to fire live because a conversation ends and takes
its contents with it. An idea that has to be remembered has already been lost, and *"I'll add it
at the close"* is the same failure with a delay.

**Close the task, in this order — the order is the point.**

1. Every line struck, every residue routed to a destination.
1b. **Update the `state.md` of every project the task touched**, by rule rather than by habit.
   **The test is the file's own: would this still be true if work stopped today?** If the answer
   changed during the task and the file did not, the close is not done. ⚠️ **Numbered `1b` rather
   than renumbering**, so every reference to steps 2–6 elsewhere still resolves.
2. **Read each destination back from disk.** *Written* is verified, never remembered (AX-9);
   the interval between "I wrote that" and "that is on disk" is where work is lost.
3. **Then the audit fires — but only if a structural file changed** (`skills/company-auditor/`
   holds the list, and the list of what is *not* structural is the load-bearing half). Most
   closes do not qualify and should not: the close writes the live set and the logs by
   definition, so an audit that counted those would fire every time and be read none of the
   times. When it does fire it reads the artefacts *and the live plan, which is still full* —
   the plan is the only record of how the task thought, and emptying it first leaves the
   auditor reading a blank file while believing it read the reasoning. **The audit precedes
   the erasure, always.** The operator can also call it on any close, for any reason.
4. **Then the plan is closed** — and only then. ⚠️ **Closed, not emptied** (`FLOW.md` rule 3, the
   declared winner). Deleting it drops the two things that live nowhere else: **the
   order and why that order**, and **the items discarded with their reason** — `PH-3` in exactly
   the case it was written for. Closing costs nothing visually: a closed plan leaves the working
   view the same way a deleted one would, and it becomes what a sub-block's row expands into —
   not *that* it finished, but *how* it went.
5. **Print what was touched — derived from the close, never written from memory.** One line per
   file, no pasted diffs. ⚠️ **A session report is not a Record and must not be written like one**,
   because a claim in it is read as evidence and nothing contrasts it against the tree. What comes
   out of the diff goes here; **what does not is narrative and goes to the
   ledger, which is a Record and where a claim can be checked against the round it describes.**
   *A report nobody contrasts against the tree is the same failure class as a check that cannot
   fail.* The table is not the review;
   it is the index that says where to look, and it is what makes an unasked-for change visible
   at a glance.
6. Then the compass moves.

**Within a round the order is fixed: integrate, write the decision down, *then* dispatch the
next task.** A decision left unwritten comes back as an open debate, and the state record carries
a freshness marker naming how far integration has reached — version history says when a file
changed, never how far the inbox was drained.

⚠️ **The same applies to a mid-task firing** (the five-item cap): the plan is rewritten
continuously, so a firing at item five must see items one to five. **Strike lines through;
do not delete them.** The plan is cleared once, at the close, never during.

---

## 3. Why the live plan is the load-bearing piece

It looks like a scratchpad. It is the only document in the system that holds **reasoning while
it is happening**, and that gives it two properties nothing else has.

**It is the durable substitute for conversation memory.** Everything else is written after the
fact: a record says what was decided, never the four things considered on the way. A working
conversation holds all of that and then ends. The live plan is where the middle of the thinking
lands on disk — which is what lets a reviewing agent see the round's *reasoning* while still
reading only from disk, never a transcript. **Without it, either the reviewer reads the
transcript (and inherits its blind spots) or it reviews conclusions with no access to how they
were reached.**

**It is the answer to "what is happening right now".** No Record can answer that — records are
past tense. No compass can — it is one line. This is the natural source of a live dashboard,
whenever one gets built, precisely because it is the only file whose content is the present.

⚠️ **And it is closed, not emptied and not archived** — §2 step 4 is the winner and this line
does not restate it. What must not happen is a live plan that *accumulates*: that is the backlog
`AX-17` dissolved, returning under a friendlier name.

---

## 4. The two channels, in practice

Two queues, running in opposite directions, and **neither side empties its own** (AX-15):

- **Mailbox** — agent → operator. Un-integrated deltas: what an agent found, proposed, or
  crossed. Every entry declares its destination from the closed vocabulary above.
- **Task list** — operator → agent. Work to execute, each task carrying **its why**, because an
  executor that does not know the purpose cannot refuse a task whose premise is false (AX-14).

A triage is the loop applied to the mailbox — **with one step that cannot be skipped, because
AX-15 says nobody drains the queue they fill.** The agent enumerates the entries into the live
plan and **proposes** a destination for each; **the operator confirms the table**; only then is
anything removed. The agent's hands do the deleting, the operator's judgement authorises it —
and the one delegated case stays as AX-15 states it: a task that *names* the entries it closes,
because the decision to close them was made when the task was written.

The mailbox ends empty, or with what is unresolved **named explicitly**: a mailbox that goes in
full and comes out full means the session closed nothing.

⚠️ **Triage is scoped by filter, never "the whole mailbox".** One front triages one project, or
one destination class — not thirty entries at once. That is not tidiness: a thirty-entry triage
sits behind a single `▶` for as long as it takes, which is exactly the front that never closes.

---

## 5. One live set, not one per project

**Every live artefact is central in NEXUS and carries a `project:` field. Only Records stay with
their project.**

| Kind | Where it lives | Why |
|---|---|---|
| Compass · Live plan · Queue · Park | **One set, in NEXUS, spanning every project** | They are written and *chosen from* across projects |
| Record | **In the project's own cartridge** | They are read one project at a time, after the fact |

The line is not arbitrary: **you never decide what to do next by reading a record, and you never
choose work one project at a time.** Deciding what comes next means looking at everything at
once and filtering; reading what happened means opening one project and following it down. Put
each artefact where its actual use is.

**This does not violate modularity — it is what PH-5 asks for.** Owner first, rate of change
second. The owner of every planning artefact is the same person; a queue per project is a split
**by topic**, which PH-5 rules out in as many words. The `project:` field is the rate-of-change
slicing *inside* the file, which is where PH-5 puts it.

**What it buys, and the cost it pays.** One schema per kind instead of one per kind per project:
the generated database (AX-2) gets one table for tasks, not eleven, and the interface **filters**
instead of aggregating — a filter over one table is trivial where an aggregation over eleven
drifting files is a project of its own. Cross-project items get a home for the first time.
Startup reads one set (PH-6).

⚠️ **The cost is real and it is paid immediately: one long file is harder to read than eleven
short ones — until something filters it.** Centralising without the filter is the worse half of
both designs. So the first view of the interface is **the live task list**, and it is not a
nice-to-have: it is the other half of this decision, and until it exists this arrangement is
running at a deliberate, temporary loss.

⚠️ **The one field that may never be empty is `project:`.** An entry without it cannot be routed
and cannot be filtered — it is invisible in exactly the tool built to make everything visible.
Its value is a project name or **`cross`**, which is what gives cross-project work a home rather
than a gap: a `cross` item routes, filters and sequences like any other, including into a
sequenced plan, AX-17's third drawer.
`AGENTS.md` §5 carries the check; a queue entry without the field is a defect, not a style
lapse.

### The central set, by literal path

| File | Kind | Holds |
|---|---|---|
| `COMPASS.md` | Compass | one `▶`, edges not nodes, every project |
| `PLAN.md` | Live plan | the task in flight, and only it |
| `MAILBOX.md` | Queue | agent → operator, every project |
| `TASKS.md` | Queue | operator → agent, every project |
| `IDEAS.md` | Park | undecided, every project |

Named literally because AX-21 requires it: *"the central file for that kind"* is not a path, and
an agent that has to guess has already failed the cold start.

### What this was designed for, and where it breaks first

Required by AX-27(b), and answered rather than deferred. **Designed for ~10 projects and ~50
open items across all queues.** The first thing to become manual is **triage**, and it breaks
earlier than the rest: at roughly **25–30 open entries** a single triage stops fitting behind
one active front, and the five-item audit cap turns it into six firings inside one front that
never closes. **The mitigation is structural and stated above — triage is scoped by
filter, never taken whole** — which keeps the breaking point a property of the *unfiltered*
pile rather than of the design. The second to go is reading: one file per kind is
harder to scan than eleven short ones until something filters it, which is why the interface's
first view is the live task list and not a nice-to-have.

### What a project cartridge still holds

**Four files, and two more only when they have content.**

| File | Kind | Holds |
|---|---|---|
| `definition.md` | Standing | what this project is, and explicitly what it is not |
| `state.md` | Standing | the present tense: would this still be true if work stopped today? |
| `Decision_Log.md` | Record | `Dn` with author, date, reasoning, and what was discarded |
| `LOG_AGENTS.md` | Record | what each agent did **in this project** |
| `architecture.md` | Standing | the project's own axioms — **created when the first one exists**, never as an empty table |
| `skills/` | — | procedures that only make sense here — **created when the first one exists** |

**No sequenced-plan file.** AX-17's third drawer is not a document: **it is a field.** Committed
but not started work is a task in the central list carrying `blocked_by:`, and the sequence is
the graph those edges describe — which is what a database wants and what an interface can render.
A per-project plan file duplicated the tasks it ordered and went stale the moment one moved.
Where the *reasoning* for an order matters, it is a decision; where the fallback matters, it is
a decision too.

**No references file.** A source is cited **in the decision it supported** (`AX-6`), which is
what puts it in the generated database next to the thing it justified. Reading not yet tied to a
decision is a park entry with the project's tag — not a second bibliography nobody prunes.

No mailbox, no task list, no ideas file: those are central now.

### And a project may have skills of its own — it usually should

A skill is hosted at **the level of the least general thing it names**, applied one floor down. A
procedure that only makes sense inside one project — its ingestion, its release ritual, its
evaluation harness — lives in that project's `nexus/skills/<name>/SKILL.md` and loads only when
working there.

**This is the drain that keeps a project's axiom department small.** Most of what looks like a
project rule is really a project *procedure*: something written once and followed, rather than
held in mind on every turn — which is `AX-4`'s test, and it resolves toward *tool*. With nowhere
to put those, they pile up as axioms nobody can hold, and the department inflates until it stops
being read.

| Where a project's know-how goes | Passes if |
|---|---|
| `architecture.md` — a project **axiom** | it must fire *while* the work happens, and no later pass could apply it |
| `nexus/skills/` — a project **skill** | it is a procedure someone follows, invoked when that work comes up |
| `Decision_Log.md` — a **decision** | it is a choice already made that binds nothing going forward |

**Three short skills beat one long axiom department**, and the reason is load: a skill is paid
once, when invoked; an axiom is paid on every turn of every task in that project.

⚠️ **Skills are not free, and the cost is not where it looks.** A skill's *body* loads only when
it fires, but its **name and description are always in context** — so the count of skills is paid
continuously and their bodies are not. Two consequences: **write the description to say what it
does *and* when to use it**, because that sentence is the entire trigger; and **keep descriptions
distinct**, because two that overlap mean the wrong one fires and neither author finds out. The
budget to watch is the sum of descriptions, never the sum of skills.

**The three levels still repeat**
— the company's philosophy inherited unchanged, the project's axioms its own, its decisions its
own — and **each project gets its own dedicated auditor**, hired under the same rule with its own
dismissal criterion. That repetition is the claim to reproducibility: adopting this is not
copying one company's rules, it is instantiating a pattern that knows how to instantiate itself.

### Rule · skill · role — three things, and only one of them fires by itself

⚠️ **Nothing here is a new taxonomy** — the repository already implements all three, and naming
them is what stops *should this be a skill or a rule* being re-argued every time it comes up.

| | Loads | Costs | Accountable |
|---|---|---|---|
| **Rule** | always — it lives in a document already open | **every turn**, which is why `AX-4` makes a rule earn its place against being a tool | no |
| **Skill** | when invoked | its **description**, continuously; its body only when it fires | no |
| **Role** | when invoked, **never automatically** | the same as a skill | **yes** — a log and a criterion that can fire it |

**A role is a skill plus two things: a log and a dismissal criterion** (`AX-11`). That is the whole
difference. **Accountability, not capability, is what makes something a role.**

⛔ **A definition that claims to be observable is a check, and it is run or it is a claim.**
⚠️ **One heading cannot carry three meanings** — a role's firing criterion, a skill's retirement
condition, and a section written to satisfy the grep are three different things, and a count over
them measures none. **Two words, and the difference is the log:**

| Heading | Ends | Needs a log | Needs a hiring decision |
|---|---|---|---|
| `## Dismissal` | a **role** | yes — **created at hiring, empty, with its contract** | yes — the threshold is fixed before the first firing (`AX-11`) |
| `## Retirement` | a **skill** | no | no — it is retired when the repository can do without it |

**Checked by `MLabs:tools/roles-check.sh`**, which compares the two sets and reports each direction
separately: *a criterion with no log* and *a log with no criterion* are different problems and the
fix is different. ⚠️ **The log is created by the act of hiring, not by the first firing.** **An empty log is a
state; a missing file is a guess** — an absent file is indistinguishable from one deleted,
mis-pathed, or that a brief never reached, and reading an absence as a fact is how this method
produced four false findings. ⚠️ **An ageing empty log is evidence of nothing on its own**: a role
whose firing event has not occurred is healthy, not idle. **The honest measure is firing events passed against firings
recorded**, and a log with no firing event behind it says nothing. ⚠️ **It only works because the
words were separated first** — attach a third meaning to either heading and it stops measuring
anything.

⚠️ **Nothing auto-fires, and that is a measured decision rather than an omission.** The automatic
audit trigger was retired after five firings in one session cost more context than the work they
audited. So *what fires* is only the mechanical checks — the gate, the pre-commit hook, the close —
and **everything else is requested.** A design that quietly assumes a role will notice something is
assuming a trigger that was deliberately removed.

⚠️ **The consequence for where a check goes.** If it must fire while the work happens, it is a
**rule** and belongs in a document that is already loaded — never in a new skill, because a skill
that has to be remembered is not a check. If it can wait to be asked for, it is a **skill**; if it
also needs to answer for its own record, it is a **role**.

## 6. How the repositories connect

```
MLabs/                      the constitution — public, released, no state
├── PHILOSOPHY · AXIOMS · METHOD · FLOW · AGENTS · skills/ · tools/
│
├── NEXUS/                  the operations centre — private, and the hub
│   ├── AGENTS.md           the binding: names the MLabs it runs; declares ledger and denylist
│   ├── AXIOMS.md           the instance's own axioms — what MLabs cannot know
│   ├── <live set>          compass · live plan · mailbox · tasks · ideas — every project
│   ├── <records>           method log · agent ledger · work log
│   └── projects/<p>/       cartridge: definition · axioms · decisions · state · plan
│
└── <code repo>/            each its own repository
    └── AGENTS.md           generated: MLabs' method half + this repo's local half
```

**The chain runs one way, and every link is a literal path — never a search.** A code repo names
NEXUS. NEXUS names MLabs, once, in its binding. MLabs names nothing. An agent dropped into any
repository can walk *up* the chain to the rules and *across* to the work, and never has to guess.

**Three departments of axioms — nested scopes, not ranks.** The company binds everything, an
instance binds everything done in it, a project's own file binds that project alone; ⚠️ **when two
disagree the narrower one loses**, because it should not have been opened over ground the wider one
already governed. **They are reviewed together** whenever any changes, since a rule can only
contradict a rule it shares a reader with.

> ⚠️ **What an agent loads is decided by the task, not by the tier — `AGENTS.md` §2 wins.**
> ⛔ **Loading all three departments for a defined task costs multiples of the budget §2 sets, and
> the multiple rises with every project opened.** Measure it before assuming otherwise; the numbers
> are in the log and go stale the moment a department changes.
>
> | Doing | Loads |
> |---|---|
> | **A defined task** | the binding · `METHOD` §2/§7 · the role file · **the departments it is about to touch** |
> | **Designing, auditing, or placing a rule** | **all three departments, whole** — there the contradiction *between* levels is the work, and reading one is reading none |
>
> **The force is unchanged.** All three bind absolutely inside their jurisdiction; what changed is
> that *binding* and *loaded into context right now* stopped being the same sentence. An axiom you
> did not read still binds you — that is what makes it an axiom rather than a reminder.


| Department | Lives in | Passes if |
|---|---|---|
| **Company** | MLabs `AXIOMS.md` | it would bind an instance that is not this one |
| **Instance** | NEXUS `AXIOMS.md` | it binds **everything this operator does**, across every project — whether or not a stranger would also adopt it |
| **Project** | the project's `architecture.md` | it binds this project only |

**The departments are exhaustive by construction: the middle one is defined by breadth of *this*
operator's work, not by whether a stranger would agree.** The most common real rule sits exactly
there: *"every repository runs its formatter before commit"* binds every one of your repos and
fails the company test, since it assumes a toolchain. It is an **instance** axiom, and a test
that forces it downward would copy it into every project file — a duplicate with no
declared winner (AX-20).

An axiom in the wrong department is the dilution failure returning by the back door: a project rule in
the company file makes that file unusable by anyone else. **When in doubt it goes down, not up** —
promoting later costs one restatement; demoting later means a public file is wrong for however
long nobody notices.

**Every `AGENTS.md` in the chain is generated, never hand-written** (AX-30): the method half
comes from MLabs, the local half lives beside its own repository, and a script concatenates them
into a file nobody edits, with a check that fails on drift.

## 7. Routing table — "I have X, where does it go?"

| What you have | Where it goes |
|---|---|
| A choice that is now settled, about one project | **That project's** `Decision_Log.md` — who, when, why, and **what was discarded** |
| A choice that is now settled, about the instance or its method | **The instance's** method log |
| Something an agent did inside a project | **That project's** `LOG_AGENTS.md` |
| Something an agent did at instance level — including every audit firing | **The instance's** ledger, named in the binding |
| Something *you* delivered, including what leaves no commit | Work log, one line, citing an artefact |
| Something an agent found while doing something else | `MAILBOX.md`, one line, no investigating, no fixing (AX-25) |
| Something that needs executing | `TASKS.md`, with its why |
| Something interesting with no commitment | `IDEAS.md` — one line while fresh; expand only if it survives a second reading |
| Committed, sequenced, but not started | `TASKS.md`, with `blocked_by:` naming what must land first. The sequence is a graph over the tasks, never a second document |
| Anything going into a queue or a park | The central file for that kind, **with `project:` filled in** |
| What you are doing right now | `PLAN.md` |
| What comes next across all projects | `COMPASS.md`, one `▶` |
| A rule that binds any instance | Propose it as an axiom |
| A rule that binds all your work but no stranger's | The instance's own `AXIOMS.md` |
| A rule that binds one project | That project's `architecture.md` |
| Anything narrower than that | It is a decision, not an axiom |

**If something fits nowhere, the structure is wrong, not the item** (AX-17). Redefine the
structure rather than grant the exception.
