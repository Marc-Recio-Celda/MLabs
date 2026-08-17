# METHOD — how work actually flows

> **Version:** unreleased · pre-release working draft (AX-20).

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
| **Live plan** | **Rewritten continuously while the work happens; emptied when it closes** | A live plan that survives its task has become a backlog |
| **Park** | No date, no commitment, no obligation to revisit | A park with dates is a task list nobody agreed to |
| **Standing** | Rewritten in place; always states what is true *now* or what must hold. Never appended to, never emptied | A standing document that grows by accretion has become a record nobody can trust as current |

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

Either way `Schedule.md` names one active front `▶` and points at where that work is described;
it describes none of it.

**Open the live plan on that front.** `Current_plan.md` is rewritten to hold *this task and
nothing else*: the concrete items, in the order they will be done, and the reasoning for that
order. It is not a summary written afterwards — it is written *while* deciding, which is what
makes it worth anything.

**Work the list, striking through as you go.** Every item leaves with a **destination**, and
the vocabulary is closed:

| Destination | Means |
|---|---|
| ✅ resolved here | done in this task; the trace goes to a Record |
| → task list | needs execution; becomes a task with its why (AX-16) |
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

**Close the task, in this order — the order is the point.**

1. Every line struck, every residue routed to a destination.
2. **Read each destination back from disk.** *Written* is verified, never remembered (AX-9);
   the interval between "I wrote that" and "that is on disk" is where work is lost.
3. **Then the superauditor fires** — over the artefacts *and over the live plan, which is still
   full.* This is why the order matters: the plan is the only record of how the task thought,
   and emptying it first would leave the auditor reading a blank file while believing it had
   read the reasoning. **The audit precedes the erasure, always.**
4. **Then the plan is emptied** — and only then.
5. Then the compass moves.

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

**And it is emptied, not archived.** The temptation is to keep it "for the history". Don't: the
history is the Record's job, and a live plan that accumulates is the backlog AX-17 dissolved,
returning under a friendlier name. What survives a task is its routed residue, not its
scratchpad.

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

**This does not violate modularity — it is what AX-10 asks for.** Owner first, rate of change
second. The owner of every planning artefact is the same person; five mailboxes with one owner
was a split **by topic**, which AX-10 forbids in as many words. The `project:` field is the
rate-of-change slicing *inside* the file, which is where AX-10 puts it.

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
| `Schedule.md` | Compass | one `▶`, edges not nodes, every project |
| `Current_plan.md` | Live plan | the task in flight, and only it |
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

| File | Kind | Holds |
|---|---|---|
| `definition.md` | Standing | what this project is, and explicitly what it is not |
| `architecture.md` | Standing | **the project's own axioms** (`AX-n`, project-scoped): what may never be violated *here* |
| `state.md` | Standing | the present tense: would this still be true if work stopped today? |
| `workflow.md` | Standing | the future tense: the sequenced plan, with blocks, dependencies and a fallback — AX-17's third drawer |
| `Decision_Log.md` | Record | `Dn` with author, date, reasoning, and what was discarded |
| `LOG_AGENTS.md` | Record | what each agent did **in this project** |

No mailbox, no task list, no ideas file: those are central now. **The three levels still repeat**
— the company's philosophy inherited unchanged, the project's axioms its own, its decisions its
own — and **each project gets its own dedicated auditor**, hired under the same rule with its own
dismissal criterion. That repetition is the claim to reproducibility: adopting this is not
copying one company's rules, it is instantiating a pattern that knows how to instantiate itself.

## 6. How the repositories connect

```
MLabs/                      the constitution — public, released, no state
├── PHILOSOPHY · AXIOMS · METHOD · AGENTS · roles/
│
├── NEXUS/                  the operations centre — private, and the hub
│   ├── AGENTS.md           the binding: pins an MLabs release; declares ledger and denylist
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

**Three tiers of axioms, and the test that keeps them apart:**

| Tier | Lives in | Passes if |
|---|---|---|
| **Company** | MLabs `AXIOMS.md` | it would bind an instance that is not this one |
| **Instance** | NEXUS `AXIOMS.md` | it binds **everything this operator does**, across every project — whether or not a stranger would also adopt it |
| **Project** | the project's `architecture.md` | it binds this project only |

**The tiers are exhaustive by construction: the middle one is defined by breadth of *this*
operator's work, not by whether a stranger would agree.** The most common real rule sits exactly
there: *"every repository runs its formatter before commit"* binds every one of your repos and
fails the company test, since it assumes a toolchain. It is an **instance** axiom, and a tier
test that forces it downward would copy it into every project file — a duplicate with no
declared winner (AX-20).

An axiom in the wrong tier is the dilution failure returning by the back door: a project rule in
the company file makes that file unusable by anyone else. **When in doubt it goes down, not up** —
promoting later costs one restatement; demoting later means a public file is wrong for however
long nobody notices.

**Every `AGENTS.md` in the chain is generated, never hand-written** (AX-21): the method half
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
| Committed, sequenced, but not started | The project's `workflow.md` — **not** the task list, **not** the compass. Cross-project: the same, under `project: cross` |
| Anything going into a queue or a park | The central file for that kind, **with `project:` filled in** |
| What you are doing right now | `Current_plan.md` |
| What comes next across all projects | `Schedule.md`, one `▶` |
| A rule that binds any instance | Propose it as an axiom |
| A rule that binds all your work but no stranger's | The instance's own `AXIOMS.md` |
| A rule that binds one project | That project's `architecture.md` |
| Anything narrower than that | It is a decision, not an axiom |

**If something fits nowhere, the structure is wrong, not the item** (AX-17). Redefine the
structure rather than grant the exception.
