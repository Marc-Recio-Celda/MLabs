# AXIOMS — the rules that may never be violated

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
> **The row is the rule**: one or two sentences, complete on their own. ⛔ **If it does not fit in
> two, it is two axioms, or a `Check`, or a decision — and there is no fourth option.** This file
> has **no notes section and no overflow of any kind**: **a category that exists gets filled**, so a
> rule with nowhere to spill either splits or does not enter.
>
> **Where the other three things go:** a **trap** — *this is how you get it wrong* — is
> `skills/company-auditor/traps.md`, keyed by axiom id, and that file says why (`AX-4`).
> **History** is the log's,
> always. A **consequence** that changes no behaviour is not written.
>
> ⛔ **The `Check` column holds the state, the command, and what a reader needs to read that
> command's result — nothing else.** Its three states are never counted as one number: a column that
> adds *a command you run* to *a warning you read* can only ever rise, which is the failure `AX-36`
> names.
>
> | | Means | Counting it |
> |---|---|---|
> | `` `$` `` | **a command that executes today and returns a verdict** | this is the number that matters, **and it can fall** |
> | `` `⊘` `` | **owed** — a check is named and does not run: no tool, wrong side of the boundary, or a procedure rather than a command | ⛔ **`AX-7` broken, declared.** Every one is a debt with an address |
> | `—` | nothing | the honest empty |
>
> ⛔ **A retired axiom leaves this file entirely and the log records where it went**, so the gap in
> the numbering is the trace (`AX-31`) — a tombstone row would be loaded on every read to say that
> nothing binds. **Status:** 🟢 in force · 🟡 proposed. **There is no third value.**
>
> **Who touches this file.** Auditors check, never edit. R&D proposes. The operator decides.
> **A change here fires the saturation review over every axiom in every department** — the
> mechanics are `skills/company-auditor/`, not repeated here.
>
> **The rows are grouped by the first clause they serve, and inside a group by check state** —
> `` `⊘` `` first, then `` `$` ``, then nothing, so what is broken sits at the top of its section. **An axiom serving two clauses appears once**; the coverage table at the foot counts
> it under both, which is why that table and these sections do not add to the same number.
>
> **Departments are nested scopes, not ranks.** This file binds everything, MLabs included; the
> instance department binds everything done in one instance; a project's `architecture.md` binds
> that project alone. **When two disagree the narrower one loses** — it should not have been opened.

## PH-1 · Scalability

| ID        | Status | Axiom                                                                                                                                                                                                                                                                                                                                            | Serves      | Check                                                                                                                                                                           |
| --------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AX-1**  | 🟢     | **Structure is public and depersonalised; state is private.** The method ships as one artefact; everything an operator works on lives in their operations centre, and the method may name that centre and its conventional root — never anything inside it.                                                                                      | PH-1 · PH-3 | `$` `bash tools/gate.sh --denylist <the instance's>` — the tracked tree, never the history                                                                                      |
| **AX-20** | 🟢     | **The same fact does not live in two files.** Where it must, one place is declared the source and the other is a **generated view** — regenerated, and it loses on conflict — or a **declared photograph** carrying the date it was frozen and why; anything else is a duplicate.                                                                | PH-1 · PH-3 | `$` `grep -rnE '[~./][A-Za-z0-9_/-]*MLabs' <the instance's rule files>` returns nothing · `bash tools/dup-prose.sh <the structural files>` — the same prose in two of them      |
| **AX-39** | 🟢     | **Modularity is the default shape: each piece owns its boundary, its lifecycle and its version**, and boundaries are drawn by owner first, rate of change second — never by topic. ⛔ **A boundary costs once and coupling costs forever** (`PH-1`).                                                                                              | PH-1 · PH-2 | `—`                                                                                                                                                                             |
| **AX-45** | 🟢     | **A source names every copy derived from it, and every copy names its source** — a **generated** copy adds the command that rebuilds it, a **frozen** copy the date it was taken and why. ⛔ **A copy that only points upward is invisible from above** — the edit that invalidates it happens in the source, where nothing says the copy exists. | PH-1 · PH-4 | `$` `bash tools/view-refs.sh <every source and copy>` — four marks: `Generates:`/`Generated from:` when a command rebuilds it, `Frozen copies:`/`Frozen from:` when nothing can |
| **AX-19** | 🟢     | **Work the operator does not own is never modified — however dead it looks.** An observation about it goes to the mailbox **marked as another owner's**, and it cannot become a task without that owner's word or an explicit recorded waiver.                                                                                                   | PH-1 · PH-3 | `—`                                                                                                                                                                             |

## PH-2 · Sustainability

| ID | Status | Axiom | Serves | Check |
|---|---|---|---|---|
| **AX-18** | 🟢 | **What the operator asked for proceeds at the operator's pace; what the agent originated waits for the operator's word.** ⛔ **Whether a change is substantive is not the agent's to judge**, so what is gated is mechanical instead: a protected file, an artefact created or retired, or a written rule changed. | PH-2 | `$` `bash tools/perm-paths.sh <the instance's permission table>` — every path a colour protects still resolves |
| **AX-33** | 🟢 | **A rule that changes is followed to every artefact citing it, in the same act, and each is read to confirm the change did not alter what it does.** **A rule is cited by id and never paraphrased**, because the citation list is the dependency list. | PH-2 · PH-4 | `$` `grep -rln '<the changed id>' <the tracked set>` — that list is the work, and `tools/axiom-refs.sh` over it proves none was left pointing at a row that no longer exists |
| **AX-13** | 🟢 | **Verification never shares a role with generation** — one stance per conversation, and switching means a new conversation rather than a new paragraph. | PH-2 | `—` |
| **AX-40** | 🟢 | **Where speed and understanding conflict, understanding wins: transcription is handed over, judgement is kept.** ⛔ **A shortcut the operator cannot restate unaided is not speed but debt**, and the interest falls due at the next transition, when the thing that has to change is the thing nobody can explain. | PH-2 · PH-4 | `—` |
| **AX-14** | 🟢 | **Whoever plans cannot see the state, so what an executor is handed is a prediction to verify and never an edit to apply.** ⛔ **An executor whose premise is false against what it actually sees refuses and says so** — the refusal is an obligation and not a discretion, because it is the last point a divergence can be stopped. | PH-2 | `—` |
| **AX-26** | 🟢 | **A standard ships as a copyable template, not as a document to be read.** Prose is met by intention; a template with the files already written is met by default, and divergence becomes deliberate. | PH-2 | `—` |
| **AX-28** | 🟢 | **A decision is taken away from the operator only with a logged waiver naming what is given up**, and the waiver is what keeps the trade reversible. ⛔ **A change the operator cannot restate unaided does not ship.** | PH-2 | `—` |

## PH-3 · Data governance

| ID | Status | Axiom | Serves | Check |
|---|---|---|---|---|
| **AX-9** | 🟢 | **Every open thread leaves the close with a destination, and *written* means read back from disk.** | PH-3 | `⊘` **owed** — `METHOD.md` §2's close steps are a procedure, and nothing executes them |
| **AX-2** | 🟢 | **Decision logs are append-only and parseable from their first entry**, with the field contract in the file's own header. **Retro-fitting a shape onto a log that has been growing for a year is the migration this avoids.** | PH-3 · PH-4 | `$` `python3 interface/model/parse.py --adapter <the instance's>` — **the verdict is the entries it could not place**, and it exits 1 when there are any |
| **AX-11** | 🟢 | **Every role keeps a log, and the log is created empty at the moment of hiring.** | PH-3 · PH-4 | `$` `bash tools/roles-check.sh --skills skills --logs <the instance's>` — reports *a role with no log* and *a log with no role* separately |
| **AX-23** | 🟢 | **Nothing is deleted; it is located.** Every deliberate exclusion names the address where the original still lives, and **the search that found no consumer is pasted before the deletion, not after** — *"it is somewhere on disk"* is a claim with no check. | PH-3 | `$` `git log --diff-filter=D --name-only <last cut>..HEAD`, or the whole history until a first cut exists — **every file it lists is named, with its new address, in a commit message or a log row** |
| **AX-42** | 🟢 | **Every record is emitted as queryable data, and the emission is generated from the record rather than kept beside it.** ⛔ **A record that can only be read is one nobody measures** — and no question about cost, rate or coverage can be asked of a store that answers only by being read whole. | PH-3 · PH-6 | `$` `python3 interface/model/parse.py --adapter <the instance's> --json` emits the entities with their fields. ⛔ **A source marked `optional` that resolves to no file makes this pass over zero records** — vacuous, not verified |
| **AX-15** | 🟢 | **A mailbox runs agent → operator, a task list runs operator → agent, and in each the party that removes an item is never the party that added it.** A queue that drains and a history that grows never share a file. | PH-3 | `—` |
| **AX-24** | 🟢 | **The log records what has no other record — why, who originated it, and what was discarded — and every field can only be filled while deciding.** **A discarded thing keeps its entry and its status**, or the same proposal returns later with nobody able to say it was answered. | PH-3 · PH-4 | `—` |
| **AX-37** | 🟢 | **A record is written in the most atomic form its reader needs: one fact per row, and a field of its own for anything that will be filtered, counted or queried.** **The source is whichever form the thing is authored in and the other is generated** — markdown where a person writes it, with LaTeX where there is mathematics; JSON where a program produces it. | PH-3 · PH-4 | `—` |

## PH-4 · Traceability

| ID | Status | Axiom | Serves | Check |
|---|---|---|---|---|
| **AX-7** | 🟢 | **A check is not adopted until a planted fault has been seen to fire it**, and the same holds for anything else that runs on a condition. **Plant against the format, not into it** — a plant written in the file's own style reproduces the file's own blind spot. | PH-4 | `$` `bash tools/tests/run.sh` — runs every plant and names every runnable check that has none |
| **AX-31** | 🟢 | **Identifiers are never reused or renumbered, so a gap in the numbering is information rather than a mistake.** **A reference carries its scope the moment it leaves the file that minted it** — bare inside, anchored outside — and points at a name rather than a position wherever a renumbering could not be corrected. | PH-4 · PH-3 | `$` `bash tools/axiom-refs.sh <axioms-file> <SCOPE> <files…>` · `bash tools/section-refs.sh <files…>` — each exit 0 clean · 1 unresolved · 2 could not run. **A `§n` is a position and an `AX-n` is a name**, so the positional half needs its own command |
| **AX-22** | 🟢 | **Evidence comes before the argument**: run the command that would falsify a claim before anything is built on it. ⛔ **A check that could not run is reported as unrun, never as passed** — one that cannot verify and stays silent is indistinguishable from one whose checks passed. | PH-4 | `—` |
| **AX-43** | 🟢 | **What code can do, code does; the model is called only for what needs judgement.** ⛔ **A model call cannot be replayed, so it cannot be tested** — and it spends, every single time, the window that the judgement it was called for is going to need. | PH-4 · PH-5 | `—` |
| **AX-6** | 🟢 | **A claim cites its evidence or it is an opinion, and the citation's form follows where the evidence came from** — from inside, the address it lives at, a file and line, or a command and its output; from outside, a source that can be fetched and versioned. **Every line of a log cites an artefact** or it is not written. | PH-4 | `—` |
| **AX-46** | 🟡 | **A record of joint human–model work is readable without the conversation that produced it.** ⛔ Every artefact the operator is expected to act on — a queue entry, a task, a sub-block — carries **what it is · what is happening, in prose · what judgement is being asked for · what moves if it moves**, and an artefact that costs re-explaining has already failed `PH-4`. | PH-4 | `⊘` **owed, and the address is `interface/model/parse.py`**, which already parses these entries. It must **name** the entry missing a field — a count would say four are short and not which four |

## PH-5 · Attention

| ID | Status | Axiom | Serves | Check |
|---|---|---|---|---|
| **AX-29** | 🟢 | **What leaves a document and what records it leaving are one edit, never two.** **A line stays only if the work would come out wrong without it and the reader could not have worked it out from the repository.** | PH-5 · PH-3 | `⊘` **owed** — `skills/compact/` is a pass you invoke, not a check that returns a verdict; `company-auditor:A6` covers what a pass cannot decide |
| **AX-4** | 🟢 | **A rule earns its place only if it must fire while the work happens, and it names the event that fires it**; if a pass over the finished artefact could apply it, it is a tool. | PH-5 | `$` `grep -L '^## Occasion' skills/*/SKILL.md` — every skill it names has no occasion written at all |
| **AX-17** | 🟢 | **Everything routes at the moment it is written, and by commitment rather than by topic** — decided, not yet decided, and committed but not started go to three different places, and the method says which. **An item that resists routing is evidence the structure is wrong**, never that the item is special. | PH-5 | `$` `python3 interface/model/parse.py --adapter <the instance's>` reports `with project: n/n` |
| **AX-38** | 🟢 | **Editing a structural file is finished when what the edit made untrue has left it, and the rules it cites still hold** — the diff that adds is the same diff that removes. ⛔ **Deprecated text does not announce itself**: the file still runs, still reads as current, and costs that reading every time it is loaded. | PH-5 · PH-4 | `$` `bash tools/axiom-refs.sh AXIOMS.md <SCOPE> <the files the diff touched>` **and** `bash tools/clause-refs.sh PHILOSOPHY.md <the same files>` — the citation half only |
| **AX-41** | 🟢 | **A structural file states what is true now — never how it got there, and never the mechanism that was rejected.** ⛔ **What changed, what was discarded, and why, are the log's** — a file that explains itself against an absent alternative teaches the absent thing on every read, and the reader who arrives later cannot tell which of the two is in force. | PH-5 · PH-3 | `$` `grep -rnE '\b[0-9]{4}-[0-9]{2}-[0-9]{2}\b' $(git ls-files '*.md')` returns nothing. ⛔ **A pattern published in this table may not contain a pipe** — escaped it is a literal to `grep -E`, and it is still a column separator either way |
| **AX-21** | 🟢 | **Startup reads where the work stands from a literal path; knowledge loads only when the reasoning touches it.** **Rules travel and maps point** — whatever must survive a fresh checkout is generated *into* it, whatever would go stale if copied is a pointer — and anything opened beyond the index's row is declared and logged as a repair to the index. | PH-5 | `—` |
| **AX-25** | 🟢 | **Record what you cross, one line, and neither investigate nor fix it.** The firing event is *while doing something else*: going looking is an audit, and fixing in passing turns one reviewable change into two. | PH-5 | `—` |

## PH-6 · Measurement

| ID | Status | Axiom | Serves | Check |
|---|---|---|---|---|
| **AX-36** | 🟢 | **A number states what it is out of and where it was read from, or it is not a measurement.** *57 accepted* is a number; *57 of 64, from the log* is a measurement — and **a count typed by hand is already wrong**, because nothing recomputes it when the thing it counts moves. | PH-6 | `—` |
| **AX-44** | 🟢 | **A measurement carries the runs that went badly, and one that cannot move in the bad direction is not a measurement but a scoreboard.** ⛔ **What was rejected, withdrawn or never confirmed belongs inside the number rather than in an appendix**, and a reader who finds one missing is entitled to assume the rest were dropped too. | PH-6 | `—` |

---

## Coverage — which clause each axiom serves

> ⚠️ **`AX-46` is 🟡 and is deliberately absent from the coverage table below**, which counts what is
> in force. A proposal that inflates its own clause's count is the failure `AX-44` names. It was
> written 2026-09-05 because `PH-4` — *a system whose owner cannot explain it cannot be corrected by
> him* — had thirteen axioms and **not one about the legibility of the artefacts the owner reads**:
> all thirteen are provenance, evidence, verification or tracking. `AX-6` gets you a claim that
> **cites** its evidence, which makes it verifiable, not understandable.

> ⚠️ **Regenerated, never transcribed** (`AX-2`). A clause at zero is a stated priority nothing
> implements — **except `PH-0`, whose zero is the design** and whose reason is `PHILOSOPHY.md`'s to
> give. **The count runs over `PH-1`…`PH-6`.**

| Clause | Axioms | Count |
|---|---|---|
| `PH-0` | — | **0, by design** |
| `PH-1` | `AX-1` · `AX-20` · `AX-39` · `AX-45` · `AX-19` | 5 |
| `PH-2` | `AX-39` · `AX-18` · `AX-33` · `AX-13` · `AX-40` · `AX-14` · `AX-26` · `AX-28` | 8 |
| `PH-3` | `AX-1` · `AX-20` · `AX-19` · `AX-9` · `AX-2` · `AX-11` · `AX-23` · `AX-42` · `AX-15` · `AX-24` · `AX-37` · `AX-31` · `AX-29` · `AX-41` | 14 |
| `PH-4` | `AX-45` · `AX-33` · `AX-40` · `AX-2` · `AX-11` · `AX-24` · `AX-37` · `AX-7` · `AX-31` · `AX-22` · `AX-43` · `AX-6` · `AX-38` | 13 |
| `PH-5` | `AX-43` · `AX-29` · `AX-4` · `AX-17` · `AX-38` · `AX-41` · `AX-21` · `AX-25` | 8 |
| `PH-6` | `AX-42` · `AX-36` · `AX-44` | 3 |
