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
> has **no notes section and no overflow of any kind**; a rule with nowhere to spill either splits
> or does not enter, and that is the only bound this file has ever had that worked.
>
> ⚠️ **The bucket is how it broke last time.** Given a place to put a third sentence, seventeen
> rules put one there — and what was labelled *notes* turned out on measurement to be **fourteen
> live rules and three pieces of history**. A category that exists gets filled.
>
> **Where the other three things go:** a **trap** — *this is how you get it wrong* — is the `Check`
> column, because it must be read by whoever is writing the thing rather than by whoever reviews it
> afterwards (`AX-4`). **History** is the log's, always. A **consequence** that changes no behaviour
> is not written.
>
> ⛔ **The `Check` column carries four states and they are never counted as one number.** A column
> that adds *a command you run* to *a warning you read* can only ever rise, which is the failure
> `AX-36` names.
>
> | | Means | Counting it |
> |---|---|---|
> | `` `$` `` | **a command that executes today and returns a verdict** | this is the number that matters, **and it can fall** |
> | `` `⊘` `` | **owed** — a check is named and does not run: no tool, wrong side of the boundary, or a procedure rather than a command | ⛔ **`AX-7` broken, declared.** Every one is a debt with an address |
> | ⚠️ | **a trap** — read while writing; it verifies nothing | useful, and never counted as a check |
> | `—` | nothing | the honest empty |
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
| **AX-1** | 🟢 | **Structure is public and depersonalised; state is private.** The method ships as one artefact; everything an operator works on lives in their operations centre, and the method may name that centre and its conventional root — never anything inside it. | PH-1 · PH-3 | `$` `bash tools/gate.sh --denylist <the instance's>` · ⚠️ **it greps the tracked tree, not the history**, and the signature carve-out is scoped by path **and** by term, both of which must hold |
| **AX-2** | 🟢 | **Decision logs are append-only and parseable from their first entry**, with the field contract in the file's own header. Retro-fitting a shape onto eighty entries is the migration this avoids. | PH-3 · PH-4 | `$` `python3 interface/model/parse.py --adapter <the instance's>` · ⚠️ **needs the adapter to return a verdict** — without one it only imports |
| **AX-4** | 🟢 | **A rule earns its place only if it must fire while the work happens, and it names the event that fires it**; if a pass over the finished artefact could apply it, it is a tool. ⚠️ **Both halves or neither** — a rule with no firing event loses to the stream of requests, and a rule that gains one just to have one makes none of them salient. | PH-5 | `$` `grep -L '^## Fires when' skills/*/SKILL.md` · ⛔ **it flags 15 of 19 and at most 8 are real** — four spellings of one heading are in use, and the fix is one style in the data, not a wider pattern |
| **AX-6** | 🟢 | **A claim cites its evidence, or it is an opinion** — a file and line, a command and its output, or for a claim about the world a properly cited source; **every line of a log cites an artefact** or it is not written. **An unnameable source is marked unsourced, and a check that found nothing says what it checked**; silence is indistinguishable from not having looked. | PH-4 | `—` |
| **AX-7** | 🟢 | **A check is not adopted until a planted fault has been seen to fire it**, and the same holds for anything else that runs on a trigger. **Plant against the format, not into it** — a plant written in the file's own style reproduces the file's own blind spot, which is how five consecutive counting defects survived a rule written to catch them. | PH-4 | `$` `bash tools/tests/run.sh` — runs every plant and names every runnable check that has none. ⚠️ **Two plants and a negative control each**: the obvious one, the one written in the file's own style, and one that must stay **silent** — without the third, a check that fires on everything passes both plants · **calibrate on the premise that feels obvious**, which is the one nobody instruments |
| **AX-9** | 🟢 | **A task closes by enumerating every open thread with its destination, and *written* is read back from disk.** ⚠️ **A thread with no destination is a failure of the close, not an omission** — and the interval between *I wrote that* and *that is on disk* is where work is lost. | PH-3 | `⊘` **owed** — `METHOD.md` §2's close steps are a procedure, and nothing executes them |
| **AX-11** | 🟢 | **Every role keeps a log, and the log is created empty at the moment of hiring.** ⚠️ **An empty log is a state a check can read; a missing file is a guess** — indistinguishable from one deleted, mis-pathed, or that a brief never reached. | PH-3 · PH-4 | `$` `bash tools/roles-check.sh --skills skills --logs <the instance's>` — reports *a role with no log* and *a log with no role* separately, because the fix is different |
| **AX-13** | 🟢 | **Verification never shares a role with generation** — one stance per conversation, and switching means a new conversation rather than a new paragraph. **What can be decided by comparison is a script, not a role**; a role exists to triage the script's report. | PH-4 · PH-2 | ⚠️ the reviewer runs in a **fresh context**: one stance per conversation is a mechanism, not a discipline, and a second stance arriving with the first one's context loaded is the failure |
| **AX-14** | 🟢 | **Allocate work by what each access point is entitled to claim, not by what it can see**: what is handed to an executor is the verification stated as a prediction, never the edit. **An executor whose premise is false against what it actually sees refuses and says so** — the refusal is an obligation, not a discretion, because whoever plans cannot see the state and the executor is the last point a divergence can be stopped. | PH-4 | `—` |
| **AX-15** | 🟢 | **An inbox runs agent → operator, a task list runs operator → agent, and in each the party that removes an item is never the party that added it.** A queue that drains and a history that grows never share a file. | PH-3 | ⚠️ **the one delegated deletion**: a task may name the entries it closes, and the executor removes exactly those — that decision was made when the task was written |
| **AX-17** | 🟢 | **Three destinations by commitment, not by topic, and everything routes at the moment it is written**: decided → the decision log · undecided → the ideas register, one line while fresh · committed but not started → a task carrying `blocked_by:`. **An item that resists routing is evidence the structure is wrong**, never that the item is special. | PH-5 | `$` `python3 interface/model/parse.py --adapter <the instance's>` reports `with project: n/n` · ⚠️ **an unordered list of pending items is not a third drawer** — the sequence is the graph the `blocked_by:` edges describe |
| **AX-18** | 🟢 | **The gate is set by the origin of the change, its shape by the channel** — what the agent originated always goes through it, unconditionally, because *is this substantive* is judged by the interested party. **What must be gated is mechanical**: a protected file, an artefact created or retired, or a written rule changed. | PH-4 · PH-2 | ⚠️ **Reversibility is never grounds to relax it** — version control solves irreversibility, not divergence |
| **AX-19** | 🟢 | **Work the operator does not own is never modified — however dead it looks.** An observation about it goes to the mailbox **marked as another owner's**, and it cannot become a task without that owner's word or an explicit recorded waiver. | PH-1 · PH-3 | `—` ⚠️ **The failure it prevents is an agent correctly judging an artefact's usefulness and never judging its ownership**, which no other permission class catches |
| **AX-20** | 🟢 | **The same fact does not live in two files.** Where it must, one place is declared the source and the other is a **generated view** — regenerated, and it loses on conflict — or a **declared photograph** carrying the date it was frozen and why; anything else is a duplicate. | PH-1 · PH-3 | `$` `grep -rnE '[~./][A-Za-z0-9_/-]*MLabs' <the instance's rule files>` returns nothing — **the method's address is the one fact this rule can check today**, and a rule file reaches it by scope rather than by path. ⛔ **No repository is exempt, the authoring one least of all** · ⚠️ **Rule files only**: a task legitimately names paths · ⚠️ **Identical input must give byte-identical output** — the general form needs a generator and none exists |
| **AX-21** | 🟢 | **Startup reads where the work stands from a literal path; knowledge loads only when the reasoning touches it.** **Rules travel and maps point** — whatever must survive a fresh checkout is generated *into* it, whatever would go stale if copied is a pointer — and anything opened beyond the index's row is declared and logged as a repair to the index. | PH-5 | ⚠️ **there is exactly one routing index**, and it says not only what exists but when to read it |
| **AX-22** | 🟢 | **Evidence comes before the argument**: run the command that would falsify a claim before anything is built on it. ⛔ **A check that could not run is reported as unrun, never as passed** — one that cannot verify and stays silent is indistinguishable from one whose checks passed. | PH-4 | ⚠️ **Measure only freshly fetched data, and name which copy** · **this axiom owns *could not run*; `AX-6` owns *found nothing***, and collapsing exit 2 into exit 1 is the same failure as collapsing either into exit 0 |
| **AX-23** | 🟢 | **Nothing is deleted; it is located.** Every deliberate exclusion names the address where the original still lives, and **the search that found no consumer is pasted before the deletion, not after** — *"it is somewhere on disk"* is a claim with no check. | PH-3 | `$` `git log --diff-filter=D --name-only <last-tag>..HEAD` — **every file it lists is named, with its new address, in a commit message or a log row.** ⚠️ **A clean rename is not listed and should not be**: git records both addresses, so the relocation is already in the diff · **what it does list is the move git could not see** — removed here, rewritten there — which is the case where the new address exists only if someone wrote it · ⚠️ **Scoped to whole files**: a deleted line is not tractable this way · **coverage is not proof that nothing consumes a thing**, which is why the search is pasted rather than described |
| **AX-24** | 🟢 | **The log records what has no other record — why, who originated it, and what was discarded — and every field can only be filled while deciding.** **`inherited` is the load-bearing value**, because a constraint you did not choose can only be discovered to be wrong; **a discarded thing keeps its entry and its status**, or the same proposal returns in six months with nobody able to say it was answered. | PH-3 · PH-4 | ⚠️ **a field that may legitimately be empty is written empty** — an absent field is indistinguishable from a real zero · **never narrate the diff** |
| **AX-25** | 🟢 | **Record what you cross, one line, and neither investigate nor fix it.** The firing event is *while doing something else*: going looking is an audit, and fixing in passing turns one reviewable change into two. | PH-5 | `—` |
| **AX-26** | 🟢 | **A standard ships as a copyable template, not as a document to be read.** Prose is met by intention; a template with the files already written is met by default, and divergence becomes deliberate. | PH-2 | `—` |
| **AX-27** | 🟢 | **A design names the volume it was built for and the first step that becomes manual beyond it — one line, in the file.** ⛔ **Written when the design is written**: afterwards the number is a guess, and the *why* behind it goes to the log rather than here. | PH-2 · PH-1 | `⊘` **owed** — the design documents that would carry it are instance-side and this repository runs nothing over them. ⚠️ **A design that has not named its breaking point was designed for today** |
| **AX-28** | 🟢 | **A decision is taken away from the operator only with a logged waiver naming what is given up**, and the waiver is what keeps the trade reversible. ⛔ **A change the operator cannot restate unaided does not ship.** | PH-2 | `—` |
| **AX-29** | 🟢 | **A live document states its present and completed work leaves it; the history belongs in the log, and both halves are written in the same act.** A line stays only if the work would come out wrong without it **and** the reader could not have worked it out from the repository — ⚠️ **`AX-6` pulls the other way and `AX-24` resolves it**: the instruction is never *write less*, it is *write the other half*. | PH-5 · PH-3 | `⊘` **owed** — `skills/compact/` is a pass you invoke, not a check that returns a verdict; `A6` covers what a pass cannot decide |
| **AX-31** | 🟢 | **A reference names its target and carries its scope the moment it leaves the file that minted it** — bare inside its own file, anchored the instant it is cited elsewhere, and pointing at a name rather than at a position wherever a renumbering could not be corrected. **Identifiers are never reused or renumbered, so a gap in the numbering is information rather than a mistake.** ⚠️ Added at writing time, because no later sweep can resolve the ambiguity (`AX-4`). | PH-4 · PH-3 | `$` `bash tools/axiom-refs.sh <axioms> <SCOPE> <files…>` — exit 0 clean · 1 unresolved · 2 could not run |
| **AX-33** | 🟢 | **A rule that changes is followed to every artefact citing it, in the same act, and each is read to confirm the change did not alter what it does.** **A rule is cited by id and never paraphrased**, because the citation list is the dependency list. | PH-2 · PH-4 | `$` `grep -rln '<the changed id>' <the tracked set>` — that list is the work, and `bash tools/axiom-refs.sh` proves none was left pointing at a row that no longer exists. ⚠️ **An artefact that still runs is not an artefact that is still right**: nothing breaks, it simply now obeys a rule that no longer says what it said |
| **AX-36** | 🟢 | **A number states what it is out of and where it was read from, or it is not a measurement.** *57 accepted* is a number; *57 of 64, from the log* is a measurement — and **a count typed by hand is already wrong**, because nothing recomputes it when the thing it counts moves. | PH-6 | ⚠️ **the command that produces it appears beside it**, and it is run rather than remembered · **a metric that can only rise is a scoreboard** — one that cannot move in the bad direction hides the failure it was built to catch |
| **AX-37** | 🟢 | **What this company writes is markdown — with LaTeX inside it where there is mathematics — and JSON wherever the thing is a record a query will read.** Both are atomic by design: text a diff shows line by line, and structure a program reads without a parser of its own. | PH-3 · PH-4 | ⚠️ **Another format is a declared exception carrying its reason, never a default** — the day one becomes normal the store needs a converter, and a converter nobody maintains is how a record stops being readable · **where both exist for one thing the JSON is the generated view and loses on conflict** (`AX-20`) |
| **AX-38** | 🟢 | **Editing a structural file is finished when what the edit made untrue has left it, and the rules it cites still hold** — the diff that adds is the same diff that removes. ⛔ **Deprecated text does not announce itself**: the file still runs, still reads as current, and costs that reading every time it is loaded. | PH-5 · PH-4 | `$` `bash tools/axiom-refs.sh` **and** `bash tools/clause-refs.sh` over the files the diff touched — the citation half. ⚠️ **The removal half has no command**: `git diff --numstat` over the structural set shows a file that only grew, which is a line to read rather than a verdict |
| **AX-39** | 🟢 | **Modularity is the default shape: each piece owns its boundary, its lifecycle and its version**, and boundaries are drawn by owner first, rate of change second — never by topic. ⛔ **Coupling is paid on every change; separation is paid once**, when the boundary is drawn. | PH-1 · PH-2 | ⚠️ **A boundary drawn by topic looks tidiest the day it is drawn and is the first one crossed** — the test is not *do these belong together* but *who changes them, and how often* · **an instance groups its projects by owner in the path itself**, so the rule is visible in every path an agent reads |
| **AX-40** | 🟢 | **Where speed and understanding conflict, understanding wins: transcription is handed over, judgement is kept.** ⛔ **A shortcut the operator cannot restate unaided is not speed but debt**, and the interest falls due at the next transition, when the thing that has to change is the thing nobody can explain. | PH-2 · PH-4 | ⏳ **The trade carries a review date** — the balance is right while the operator is still learning the system and may not be afterwards, and this is the one rule here written to be reconsidered. ⚠️ **`AX-28` is this rule's exception procedure, not a restatement of it**: this fires when choosing how the work gets done, that one when a decision is actually taken away |
| **AX-41** | 🟢 | **A structural file states what is true now and never how it got there.** ⛔ **What changed and why is the log's** — a file that explains its own history pays for that explanation on every read, forever, and the explanation is the first half to become false. | PH-5 · PH-3 | `$` `grep -rnE '\b(19\|20)[0-9]{2}-[0-9]{2}-[0-9]{2}\b' $(git ls-files '*.md')` returns nothing. ⚠️ **It catches dated narration, not all narration** — a date is what a change register almost always carries and what prose almost never needs, which is what makes it the one mechanical shadow of this rule |

---

## Coverage — which clause each axiom serves

> ⚠️ **Regenerated, never transcribed** (`AX-2`). A clause at zero is a stated priority nothing
> implements — **except `PH-0`, which is served by the clauses rather than by axioms** and whose
> zero is the design (`PHILOSOPHY.md`). **The count runs over `PH-1`…`PH-6`.**

| Clause | Axioms | Count |
|---|---|---|
| `PH-0` | — | **0, by design** |
| `PH-1` | `AX-1` · `AX-19` · `AX-20` · `AX-27` · `AX-39` | 5 |
| `PH-2` | `AX-13` · `AX-18` · `AX-26` · `AX-27` · `AX-28` · `AX-33` · `AX-39` · `AX-40` | 8 |
| `PH-3` | `AX-1` · `AX-2` · `AX-9` · `AX-11` · `AX-15` · `AX-19` · `AX-20` · `AX-23` · `AX-24` · `AX-29` · `AX-31` · `AX-37` · `AX-41` | 13 |
| `PH-4` | `AX-2` · `AX-6` · `AX-7` · `AX-11` · `AX-13` · `AX-14` · `AX-18` · `AX-22` · `AX-24` · `AX-31` · `AX-33` · `AX-37` · `AX-38` · `AX-40` | 14 |
| `PH-5` | `AX-4` · `AX-17` · `AX-21` · `AX-25` · `AX-29` · `AX-38` · `AX-41` | 7 |
| `PH-6` | `AX-36` | 1 |
