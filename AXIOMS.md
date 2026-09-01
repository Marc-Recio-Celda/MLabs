# AXIOMS — the rules that may never be violated

> **Version:** 1.0.0 — the first tagged release is stage 2's exit condition (`AX-20`).

> **Level 2 of three.** `PHILOSOPHY.md` above says what the company optimises for and breaks every
> tie. **Decisions** below are instance-level and live in the instance's own log. This file holds
> neither purpose nor record.
>
> **An axiom is a rule that lets a model apply a philosophy clause in routine work.** Everything
> here passes one test:
>
> > **Would a competent model, mid-task, do the wrong thing without this line?**
> > No → it is a decision, a philosophy clause, or a step inside a skill.
>
> **And one more, for the company department only:** *would this still bind an instance that is not
> this one — a different person, body of knowledge, projects, toolchain?*
>
> **Format, fixed 2026-08-21.** The row is the **rule**: one or two sentences, complete on their
> own. ⚠️ **If it does not fit in two, it is two axioms or it is a decision.** Everything else —
> edge cases, consequences, why it was amended — goes to `### AX-n` below the table, which a review
> or a dispute loads and routine work does not. *(Before: 3,078 words in the Axiom cells, mean 109,
> `AX-1` at 256. What a model applies from a 250-word cell is its first sentence; the rest was paid
> on every load and read almost never.)*
>
> ⛔ **A retired axiom leaves this file entirely, and the log records where it went.** Its number is
> never reused, so **the gap in the numbering is the trace** — the only trace this file keeps.
> ⚠️ **A tombstone row is loaded on every read to say nothing binds**, and this file is read
> constantly; the log is read when someone asks what happened, which is the only time the answer
> matters. **Identifiers are never reused or renumbered.**
> **Status:** 🟢 in force · 🟡 proposed. **There is no third value.**
> **Anchoring:** a bare `AX-n` here is unambiguous; the moment it leaves this repo it carries its
> anchor (`AX-31`).
>
> **Who touches this file.** Auditors check, never edit. R&D proposes. The operator decides.
> **A change here fires the saturation review over every axiom in every department** — the
> mechanics are `skills/company-auditor/`, not repeated here.
>
> **Departments are nested scopes, not ranks.** This file binds everything, MLabs included; the
> instance department binds everything done in one instance; a project's `architecture.md` binds
> that project alone. **When two disagree the narrower one loses** — it should not have been opened.

| ID | Status | Axiom | Serves | Check |
|---|---|---|---|---|
| **AX-1** | 🟢 | **Structure is public and depersonalised; state is private.** The method ships as one artefact; everything an operator works on lives in their operations centre, and the method may name that centre and its conventional root — never anything inside it. | PH-5 · PH-3 | `tools/gate.sh` |
| **AX-2** | 🟢 | **Decision logs are append-only and parseable from their first entry**, with the field contract in the file's own header. Retro-fitting a shape onto eighty entries is the migration this avoids. | PH-3 · PH-4 | `interface/model/parse.py` |
| **AX-4** | 🟢 | **A rule earns its place only if it must fire while the work happens; if a pass over the finished artefact could apply it, it is a tool.** The test is whether the information still exists at cleanup time — what is in the artefact becomes a tool, what is only in the author's head stays a rule. | PH-6 | `—` |
| **AX-6** | 🟢 | **A claim cites its evidence, or it is an opinion** — a file and line, a command and its output, or for a claim about the world a properly cited source. **An unnameable source is marked unsourced, and an audit that found nothing says what it checked**; silence is indistinguishable from not having looked. | PH-4 | `—` |
| **AX-7** | 🟢 | **A check carries the guarantee that it runs.** An invariant nobody verifies and a tally nobody has tested are opinions in the shape of facts. | PH-4 | `—` |
| **AX-8** | 🟢 | **A conduct rule without a firing event loses to the stream of requests.** Every rule of conduct names the event that fires it; `AX-4` is the counterweight, or every rule gains an event and none is salient. | PH-6 | `grep -L '^## Fires when' skills/*/SKILL.md` |
| **AX-9** | 🟢 | **A task closes by enumerating every open thread with its destination, and *written* is read back from disk.** ⚠️ **The close is also the firing event for every reviewing role**, so an unclosed task silently disables the company's own detection. | PH-3 | `METHOD.md` §2's six steps |
| **AX-11** | 🟢 | **Every role is hired with its dismissal criterion fixed before it starts, countable by a command.** | PH-6 | `tools/roles-check.sh` |
| **AX-12** | 🟢 | **The governing document states what the system is for, and what it refuses, before any mechanism.** Purpose is what breaks ties when two rules both apply, so it is written where it is read first. | PH-4 | `—` |
| **AX-13** | 🟢 | **Verification never shares a role with generation** — one stance per conversation, and switching means a new conversation rather than a new paragraph. **What can be decided by comparison is a script, not a role**; a role exists to triage the script's report. | PH-4 · PH-2 | `—` |
| **AX-14** | 🟢 | **Allocate work by what each access point is entitled to claim, not by what it can see**: what is handed to an executor is the verification stated as a prediction, never the edit. **An executor whose premise is false against what it actually sees refuses and says so** — which is why every task carries its *why*, not only its *what*. | PH-4 | `—` |
| **AX-15** | 🟢 | **An inbox runs agent → operator, a task list runs operator → agent, and in each the party that removes an item is never the party that added it.** A queue that drains and a history that grows never share a file. | PH-3 | `—` |
| **AX-16** | 🟢 | **Completed work leaves the live list** — deleted, not marked done, its trace becoming a line in a dated append-only log. **Every line of that log cites an artefact**, or it is not written. | PH-6 | `—` |
| **AX-17** | 🟢 | **Three destinations by commitment, not by topic, and everything routes at the moment it is written**: decided → the decision log · undecided → the ideas register, one line while fresh · committed but not started → a task carrying `blocked_by:`. **An item that resists routing is evidence the structure is wrong**, never that the item is special. | PH-6 | `parse.py` reports `with project: n/n` |
| **AX-18** | 🟢 | **The gate is set by the origin of the change, its shape by the channel** — what the agent originated always goes through it, unconditionally, because *is this substantive* is judged by the interested party. **What must be gated is mechanical**: a protected file, an artefact created or retired, or a written rule changed. | PH-4 · PH-2 | `—` |
| **AX-19** | 🟢 | **Work the operator does not own is never modified — however dead it looks** — and observations about it go to its owners' inbox instead. Autonomy applies on one's own branch only. | PH-5 · PH-3 | `—` |
| **AX-20** | 🟢 | **A copy is either a generated view or a declared photograph — there is no third kind.** A view is regenerated and loses on conflict; a photograph carries the date it was frozen, why, and **which copy wins**. Anything else is a duplicate. | PH-5 · PH-3 | `—` |
| **AX-21** | 🟢 | **Startup reads where the work stands from a literal path; knowledge loads only when the reasoning touches it.** **Anything opened beyond the index's row is declared**, and that gap is logged as a repair to the index — economy is bought by routing better, never by tracing less. | PH-6 | `—` |
| **AX-22** | 🟢 | **Evidence comes before the argument and before the deletion**: run the command that would falsify a claim before anything is built on it, and paste the search that found no consumer before deleting anything. **An agent that could not run its checks says so** — one that cannot verify and stays silent is indistinguishable from one whose checks passed. | PH-4 | `—` |
| **AX-23** | 🟢 | **Nothing is deleted; it is located.** Every deliberate exclusion names the address where the original still lives — *"it is somewhere on disk"* is a claim with no check. | PH-3 | `—` |
| **AX-24** | 🟢 | **The log records what has no other record — why, who originated it, and what was discarded — and every field can only be filled while deciding.** Never narrate the diff. **A field that may legitimately be empty is written empty**, because an absent field is indistinguishable from a real zero. | PH-3 · PH-4 | `—` |
| **AX-25** | 🟢 | **Record what you cross, one line, and neither investigate nor fix it.** The firing event is *while doing something else*: going looking is an audit, and fixing in passing turns one reviewable change into two. | PH-6 | `—` |
| **AX-26** | 🟢 | **A standard ships as a copyable template, not as a document to be read.** Prose is met by intention; a template with the files already written is met by default, and divergence becomes deliberate. | PH-1 | `—` |
| **AX-27** | 🟢 | **What will grow names where it breaks** — the volume it was designed for, and the first step that becomes manual beyond it. A design that has not named its breaking point was designed for today. | PH-1 | `metrics.py` against the declared thresholds |
| **AX-28** | 🟢 | **Removing a decision from the operator requires a logged waiver naming what is given up**, and the waiver is what makes it reversible at the trade's review date. **A change the operator cannot restate unaided does not ship.** | PH-2 | `—` |
| **AX-29** | 🟢 | **A live document states its present; its history belongs in the log, and both halves are written in the same act.** A line stays only if the work would come out wrong without it **and** the reader could not have worked it out from the repository — past tense survives only to name a trap they can still fall into. | PH-1 · PH-6 | `skills/compact/` — and `A6` for what a pass cannot decide |
| **AX-30** | 🟢 | **Every repository's agent contract is generated, never hand-written**, with a check that fails on drift. **No repository is exempt, including the one that authors the method half.** | PH-5 · PH-4 | `—` |
| **AX-31** | 🟢 | **A reference carries its scope the moment it leaves the file that minted it** — bare inside its own file, anchored the instant it is cited elsewhere. Added at writing time, because no later sweep can resolve the ambiguity (`AX-4`). | PH-4 | `—` |
| **AX-33** | 🟢 | **Every artefact stamps the version of the rule set it was written against**, and the stamp moves only when the artefact is read whole and cleared. ⚠️ **Bumping it without reading is a lie that costs nothing to tell** and destroys the only drift detector this repository has at zero maintenance cost. | PH-5 | `skills/release-cut/` |

---

## Notes — loaded by a review or a dispute, not by routine work

### AX-1

⚠️ **The depersonalisation half binds the *tracked working tree*, not the history.** The gate greps
`git ls-files`, which by construction cannot see a commit. **Declared rather than pretended**: the
guarantee is *nothing private ships in a checkout*, not *nothing private was ever written* — and
every commit already carries the author's name and email, so a history scrub would not
depersonalise it either.

✍️ **A declared signature is not a leak.** A leak is personal data that travels *because someone
forgot*; an authorship claim travels *because someone decided*, and a body of work that cannot sign
itself cannot be published as anyone's. **Scoped twice and both must hold:** by **path** — only
`LICENSE` and `NOTICE` — and by **term** — only what the denylist's `## SIGNATURE` section lists.
Every other denied term is a leak inside those two files exactly as anywhere else. ⚠️ **A
file-level exemption was rejected**: it would have made `NOTICE` the one place the gate does not
look, which is the shape every real leak finds. Each permitted line is printed on every gate run —
*a permission you cannot see is the same hole as an exemption you cannot see.*

⚫ **The clause *"and pins the release it runs"* was retired 2026-08-19** — a demotion, not a
deletion. This instance **co-develops** MLabs rather than consuming it, so a pin is what a consumer
holds, and the axiom was 🟢 while the only instance in existence was knowingly outside it. ⏳ **It
returns the day MLabs has a consumer that is not its co-developer**, and as the consumer half only.
⚠️ **What replaces it:** a release cut records the commit it was cut against.

### AX-2

The markdown stays the source and the database is a regenerated view, never hand-edited — that is
`AX-20`'s rule, not a second statement of it here. **References name things rather than numbering
them** wherever a renumbering could not be corrected.

### AX-6

The citation is data, not decoration: it enters the generated database beside the decision it
supported, so *what is this built on* becomes a query rather than a re-read.

### AX-12

**The failure was measured, not assumed:** across one instance's most recent 39 rules, the conduct
section was cited **nine times and the purpose once.** Salient rules crowd out founding ones, which
is why purpose is the last court and is written where it is read first.

### AX-13

Structural breaks belong to the script; semantic contradictions belong to whoever is already
working. ⚠️ **One stance per conversation is a mechanism, not a discipline** — a second stance
arriving with the first one's context loaded is the failure, so an auditor runs in a fresh context.

### AX-14

Two independent axes fix the strongest available claim: *can it read the source* and *can it
execute*. An access point given copies may claim only what it was given; one that reads the source
may claim what is there; **only one that can run things may claim that something passes.** The
executor's refusal is an obligation and not a discretion: whoever plans cannot see the state and
whoever executes can, so the executor is the last point at which a divergence can be stopped.

### AX-15

**An access point working beside the operator writes to neither queue** — it simply says the thing.
**The inbox is versioned and travels with its repository**: a local inbox on five machines is not
one private inbox, it is five. **The one delegated deletion:** a task may name the entries it
closes, and the executor deletes exactly those, because that decision was made when the task was
written.

### AX-17

⚠️ **The third drawer is a field, not a document** (`METHOD.md` §2, 2026-08-19). This axiom said
*"a sequenced plan with blocks, dependencies and a fallback"* until 2026-08-21 and was contradicting
the method it serves: committed-but-not-started work is a task carrying `blocked_by:`, and the
sequence is the graph those edges describe. **An unordered list of pending items is not a third
drawer.**

⚠️ **The operator's inclination is to remove this axiom** *(2026-08-21)*, **held for the auditor.**
Once the third drawer is a field, what remains is *route at the moment of writing* — which `AX-25`
and `AX-9` may already carry between them. **Whether that leaves a rule or a restatement is the
saturation review's call, not the party that just rewrote it** (`AX-13`). The registers split by tense — state is the present, the task list the imperative, the
inbox what arrived — and a decision that changes the order updates it in the same act.

### AX-18

Reversibility is never grounds to relax the gate: version control solves irreversibility, not
divergence. **The shape follows the channel** — asynchronous through the inbox where the agent
cannot reach the operator in the same turn, synchronous in session where it can; and because a
synchronous gate loses the delay and the second reading, a change passing through one writes its log
line in the same act.

### AX-19

The other permission classes all describe things the operator or the agent owns, so none of them can
catch this. **The failure it prevents is an agent correctly evaluating an artefact's usefulness and
never evaluating its ownership.** The conduct that goes with the class loads from a flag rather than
sitting in the core rules (`AX-4`).

### AX-20

**Generated output is byte-identical for identical input** — no run-time timestamps — so drift is
detected by comparing content and history carries no empty diffs.

### AX-21

**Rules travel, maps point.** Whatever must survive a fresh checkout of one repository alone is
generated *into* it; whatever would go stale if copied is a pointer. **There is exactly one routing
index**, and it says not only what exists but when to read it.

### AX-22

**Calibrate on the premise that feels obvious** — that is the one nobody instruments. **Measure only
freshly fetched data and name which copy you measured**, or the check launders a stale reading into
a measured claim. **Test coverage is not proof that nothing consumes a thing**: coverage says what
is tested, not what is used. A session closes by running the checks and only then publishing, in
that order.

### AX-24

**`inherited` is the load-bearing value.** A constraint you did not choose can only be discovered to
be wrong, and writing it as your own decision hides the line between what is renegotiable and what
is not. **A discarded thing keeps its entry and its status**, or the same proposal returns in six
months with nobody able to say it was already answered.

### AX-29

The cost compounds: **a document carrying its own changelog becomes unreadable at exactly the length
where it matters**, and the reader who pays is the one who arrives latest and knows least. ⚠️ **A
later pass can strip archaeology but cannot tell whether it was ever logged**, which is why both
halves are written in the same act — deleting unlogged history is the loss `PH-3` forbids.
⚠️ **`AX-6` and this axiom pull against each other and `AX-24` is where the tension resolves.** An
agent citing its evidence *in the file it is editing* is obeying one and breaking the other; the
instruction is not *write less* but *write the other half*.

### AX-30

A hand-written contract is the first place two repositories quietly stop agreeing, **and the
exemption granted to the authoring repo is the one every later exemption cites.** This method's own
`AGENTS.md` is hand-written today and the debt is declared in that file rather than hidden.

### AX-33

Split from `AX-20` on 2026-08-21: it is about drift on **originals**, not about copies, and it is
cited independently by `release-cut` and by `company-auditor`'s `A6`. ⚠️ **The stamp answers *which
rule set was this written against*, so a file at an old version is reporting that nobody has
reviewed it since** — that is the signal, working. **Editing a row is not reviewing a file.**
`release-cut` checks that stamps agree and has no step that makes them agree, so the act belongs to
the auditors, who are the only readers that read a file whole.

---

## Provenance — who originated each, and where the original decision lives

> Decision-time data (`AX-24`), read by an audit and never during routine work.
> `op` operator · `inh` inherited · `sa` saturation review. `M-nn` resolves only for the operator.

| ID | Origin | ID | Origin |
|---|---|---|---|
| `AX-1` | op `M-108` · `M-109` | `AX-17` | inh `M-74` `M-28` `M-36` `M-54` `M-95` |
| `AX-2` | inh `M-87` · `M-93` | `AX-18` | inh `M-34` `M-59` `M-64` |
| `AX-4` | inh `M-101` · `M-107` | `AX-19` | inh `M-103` |
| `AX-6` | inh `M-72` | `AX-20` | inh `M-66` `M-97` `M-33` `M-47` |
| `AX-7` | inh `M-90` | `AX-21` | inh `M-79` `M-52` `M-67` `M-53` |
| `AX-8` | inh `M-96` | `AX-22` | inh `M-84` `M-91` `M-81` `M-85` `M-51` `M-70` |
| `AX-9` | inh `M-105` | `AX-23` | inh `M-80` |
| `AX-11` | inh `M-106` | `AX-24` | inh `M-41` `M-55` `M-77` `M-100` |
| `AX-12` | inh `M-03` | `AX-25` | inh `M-24` |
| `AX-13` | inh `M-02` · `M-69` · `M-11` | `AX-26` | inh `M-22` · `M-44` |
| `AX-14` | inh `M-63` · `M-82` · `M-49` | `AX-27` | `sa` round 3 |
| `AX-15` | inh `M-65` `M-05` `M-15` `M-58` `M-48` `M-07` `M-76` | `AX-28` | `sa` round 3 |
| `AX-16` | inh `M-42` · `M-99` · `M-88` | `AX-29` | op · inh `M-25` · `M-71` |
| | | `AX-30` | inh `M-73` · split from `AX-21` by `sa` |
| | | `AX-31` | inh `M-89` · `M-102` · split from `AX-23` by `sa` |
| | | `AX-33` | split from `AX-20`, 2026-08-21 |

---

## Coverage — which clause each axiom serves

> ⚠️ **Regenerated, never transcribed** (`AX-2`). A clause at zero is a stated priority nothing
> implements.

| Clause | Axioms | Count |
|---|---|---|
| `PH-1` | `AX-26` · `AX-27` · `AX-29` | 3 |
| `PH-2` | `AX-13` · `AX-18` · `AX-28` | 3 |
| `PH-3` | `AX-1` · `AX-2` · `AX-9` · `AX-15` · `AX-19` · `AX-20` · `AX-23` · `AX-24` | 8 |
| `PH-4` | `AX-2` · `AX-6` · `AX-7` · `AX-12` · `AX-13` · `AX-14` · `AX-18` · `AX-22` · `AX-24` · `AX-30` · `AX-31` | 11 |
| `PH-5` | `AX-1` · `AX-19` · `AX-20` · `AX-30` · `AX-33` | 5 |
| `PH-6` | `AX-4` · `AX-8` · `AX-11` · `AX-16` · `AX-17` · `AX-21` · `AX-25` · `AX-29` | 8 |
| `PH-7` | — | **0** |

⚠️ **`PH-7` sits at zero and has since it arrived.** *What is not measured cannot be improved, and
cannot be proved* is implemented by no axiom — the metrics exist as a script and as a role's report,
and nothing at this level requires them. **Either an axiom is missing or the clause is doing its
work one level up**, and that is the question the next saturation review answers rather than this
file.

⚠️ **`Check` is a required column and most rows read `—`.** `AX-7` says a check carries the
guarantee that it runs; **an axiom with no check is the one that becomes intuition.** The empty
cells are a debt with a name, which is the point of writing the column before the checks exist.
