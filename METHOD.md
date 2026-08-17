# METHOD — how work actually flows

> **Version:** unreleased · pre-release working draft (AX-20).

> **The fourth document, and the only one you use every day.** `PHILOSOPHY.md` says what this
> company optimises for; `AXIOMS.md` what may never be violated; **this file says how work
> actually moves**; and NEXUS holds what happened. The first two are read once and rarely
> again. This one is the shape of a working day, and it is what makes the company reproducible
> rather than a set of opinions — a stranger who reads only the axioms knows the constraints
> and still has no idea what to do on Monday morning.

---

## 1. Five kinds of document, and the kind matters more than the name

Every artefact is exactly one kind, and **the kind fixes its lifecycle**. Mixing two kinds in
one file is the most frequently recorded failure in this company's history: a queue that never
empties, a record someone edited, a plan that quietly became a backlog.

| Kind | Lifecycle | Failure if mixed |
|---|---|---|
| **Record** | Append-only. Never edited, never deleted, grows forever. The receipt | Editing it destroys the only copy of what was true then |
| **Queue** | Filled by one side, drained by the other; an item leaves when it is done (AX-15) | A queue that only grows stops saying what is left |
| **Compass** | Tiny, rewritten in place, **one active front**. Read at every open, updated at every close | A compass with eight priorities never contradicts reality, so it is never corrected |
| **Live plan** | **Rewritten continuously while the work happens; emptied when it closes** | A live plan that survives its task has become a backlog |
| **Park** | No date, no commitment, no obligation to revisit | A park with dates is a task list nobody agreed to |

The three levels of governance sit above all five: philosophy, axioms, then decisions — and
**decisions are Records.**

---

## 2. The loop

**Open on the compass.** `Schedule.md` names one active front `▶` and points at where that work
is described; it describes none of it. If what you are about to do is not that row, one of the
two is wrong — **say so before working.** Finding that out on open is the whole reason the file
exists.

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
| ⚫ discarded | rejected — **with its reason**, which is the half that has no other record (AX-24) |

**An item struck through with no destination is a failure of the close, not an omission** (AX-9).

**When an item spawns others, write them down immediately, right after the current one.** Even
— *especially* — when they have nothing to do with what you are on. An idea that arrives while
you are deep in something else is the one that gets lost, and "I'll remember it" is the exact
moment PH-3 is broken. Writing it down is not the same as doing it: it takes its place in the
list and gets a destination like everything else. Most will be ⚫ or → park, and that is a
successful outcome, not a wasted line.

**Close the task.** Every line struck, every residue routed, the plan emptied. Then the
superauditor fires. Then the compass moves.

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

A triage is just the loop applied to the mailbox: the compass says *triage*, the live plan
enumerates the entries, each leaves with a destination, the mailbox ends empty or with what is
unresolved **named explicitly** — a mailbox that goes in full and comes out full means the
session closed nothing.

---

## 5. The same shape, one floor down: the project pattern

A project is not a smaller company; it is the same shape instantiated. Every project gets a
`nexus/` cartridge — copied from the template, never authored from scratch (AX-26) — holding
one file per kind:

| File | Kind | Holds |
|---|---|---|
| `definition.md` | — | what this project is, and explicitly what it is not |
| `architecture.md` | — | **the project's own axioms** (`AX-n`, project-scoped): what must never be violated *here* |
| `Decision_Log.md` | Record | `Dn` with author, date, reasoning, and what was discarded |
| `LOG_AGENTS.md` | Record | what each agent actually did |
| `state.md` | — | the present tense: would this still be true if work stopped today? |
| `workflow.md` | — | the future tense: the sequenced plan, with blocks, dependencies and a fallback |
| `MAILBOX_agents.md` · `TASKS_agents.md` | Queue | the two channels, scoped to this project |
| `Ideas.md` | Park | undecided, no date |

**The three levels repeat exactly:** the company's philosophy is inherited unchanged, the
project's axioms are its own, and its decisions are its own. **Each project gets its own
dedicated auditor** — the superauditor's shape scoped to one project — hired under the same
rule, with its own dismissal criterion.

That repetition is the whole claim to reproducibility: adopting this is not copying one
company's rules, it is instantiating a pattern that already knows how to instantiate itself.

---

## 6. Routing table — "I have X, where does it go?"

| What you have | Where it goes |
|---|---|
| A choice that is now settled | Decision log — with who, when, why, and **what was discarded** |
| Something an agent did | Agent log |
| Something *you* delivered, including what leaves no commit | Work log, one line, citing an artefact |
| Something an agent found while doing something else | Mailbox, one line, no investigating, no fixing (AX-25) |
| Something that needs executing | Task list, with its why |
| Something interesting with no commitment | Ideas — one line while fresh; expand only if it survives a second reading |
| Committed, sequenced, but not started | The project's `workflow.md` — **not** the task list, **not** the compass |
| What you are doing right now | `Current_plan.md` |
| What comes next across all projects | `Schedule.md`, one `▶` |
| A rule that binds any instance | Propose it as an axiom |
| A rule that binds only this instance | It is a decision, not an axiom |

**If something fits nowhere, the structure is wrong, not the item** (AX-17). Redefine the
structure rather than grant the exception.
