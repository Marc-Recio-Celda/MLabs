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
| **AX-1** | 🟢 | **Structure is public and depersonalised; state is private.** The method ships as one artefact; everything an operator works on lives in their operations centre, and the method may name that centre and its conventional root — never anything inside it. | PH-5 · PH-3 | `tools/gate.sh` — ⚠️ **it greps the tracked tree, not the history**, and the signature carve-out is scoped by path **and** by term, both of which must hold |
| **AX-2** | 🟢 | **Decision logs are append-only and parseable from their first entry**, with the field contract in the file's own header. Retro-fitting a shape onto eighty entries is the migration this avoids. | PH-3 · PH-4 | `interface/model/parse.py` |
| **AX-4** | 🟢 | **A rule earns its place only if it must fire while the work happens, and it names the event that fires it**; if a pass over the finished artefact could apply it, it is a tool. ⚠️ **Both halves or neither** — a rule with no firing event loses to the stream of requests, and a rule that gains one just to have one makes none of them salient. | PH-6 | `grep -L '^## Fires when' skills/*/SKILL.md` |
| **AX-6** | 🟢 | **A claim cites its evidence, or it is an opinion** — a file and line, a command and its output, or for a claim about the world a properly cited source; **every line of a log cites an artefact** or it is not written. **An unnameable source is marked unsourced, and a check that found nothing says what it checked**; silence is indistinguishable from not having looked. | PH-4 | `—` |
| **AX-7** | 🟢 | **A check carries the guarantee that it runs.** An invariant nobody verifies and a tally nobody has tested are opinions in the shape of facts. | PH-4 | plant a fault **against the format, not into it**, and watch it fire · **calibrate on the premise that feels obvious** — that is the one nobody instruments · **measure only freshly fetched data and name which copy** · **coverage is not proof that nothing consumes a thing** |
| **AX-9** | 🟢 | **A task closes by enumerating every open thread with its destination, and *written* is read back from disk.** ⚠️ **The close is also the firing event for every reviewing role**, so an unclosed task silently disables the company's own detection. | PH-3 | `METHOD.md` §2's close steps |
| **AX-11** | 🟢 | **Every role is hired with its dismissal criterion fixed before it starts, countable by a command.** | PH-6 | `tools/roles-check.sh` — ⚠️ **it measures headings and logs, not the two numbers**, which by the concealment rule can never be in the file it greps |
| **AX-12** | 🟢 | **The governing document states what the system is for, and what it refuses, before any mechanism.** Purpose is what breaks ties when two rules both apply, so it is written where it is read first. | PH-4 | `—` |
| **AX-13** | 🟢 | **Verification never shares a role with generation** — one stance per conversation, and switching means a new conversation rather than a new paragraph. **What can be decided by comparison is a script, not a role**; a role exists to triage the script's report. | PH-4 · PH-2 | the reviewer runs in a **fresh context**: one stance per conversation is a mechanism, not a discipline, and a second stance arriving with the first one's context loaded is the failure |
| **AX-14** | 🟢 | **Allocate work by what each access point is entitled to claim, not by what it can see**: what is handed to an executor is the verification stated as a prediction, never the edit. **An executor whose premise is false against what it actually sees refuses and says so** — the refusal is an obligation, not a discretion, because whoever plans cannot see the state and the executor is the last point a divergence can be stopped. | PH-4 | `—` |
| **AX-15** | 🟢 | **An inbox runs agent → operator, a task list runs operator → agent, and in each the party that removes an item is never the party that added it.** A queue that drains and a history that grows never share a file. | PH-3 | **the one delegated deletion**: a task may name the entries it closes, and the executor removes exactly those — that decision was made when the task was written |
| **AX-17** | 🟢 | **Three destinations by commitment, not by topic, and everything routes at the moment it is written**: decided → the decision log · undecided → the ideas register, one line while fresh · committed but not started → a task carrying `blocked_by:`. **An item that resists routing is evidence the structure is wrong**, never that the item is special. | PH-6 | `parse.py` reports `with project: n/n` · ⚠️ **an unordered list of pending items is not a third drawer** — the sequence is the graph the `blocked_by:` edges describe |
| **AX-18** | 🟢 | **The gate is set by the origin of the change, its shape by the channel** — what the agent originated always goes through it, unconditionally, because *is this substantive* is judged by the interested party. **What must be gated is mechanical**: a protected file, an artefact created or retired, or a written rule changed. | PH-4 · PH-2 | ⚠️ **Reversibility is never grounds to relax it** — version control solves irreversibility, not divergence |
| **AX-19** | 🟢 | **Work the operator does not own is never modified — however dead it looks** — and observations about it go to its owners' inbox instead. ⚠️ **The failure it prevents is an agent correctly judging an artefact's usefulness and never judging its ownership**, which no other permission class can catch. | PH-5 · PH-3 | `—` |
| **AX-20** | 🟢 | **A copy is either a generated view or a declared photograph — there is no third kind.** A view is regenerated and loses on conflict; a photograph carries the date it was frozen, why, and **which copy wins**. Anything else is a duplicate. | PH-5 · PH-3 | regenerate twice and diff: **identical input gives byte-identical output**, so no run-time timestamps and no empty diffs in history |
| **AX-21** | 🟢 | **Startup reads where the work stands from a literal path; knowledge loads only when the reasoning touches it.** **Rules travel and maps point** — whatever must survive a fresh checkout is generated *into* it, whatever would go stale if copied is a pointer — and anything opened beyond the index's row is declared and logged as a repair to the index. | PH-6 | **there is exactly one routing index**, and it says not only what exists but when to read it |
| **AX-22** | 🟢 | **Evidence comes before the argument and before the deletion**: run the command that would falsify a claim before anything is built on it, and paste the search that found no consumer before deleting anything. | PH-4 | `—` |
| **AX-23** | 🟢 | **Nothing is deleted; it is located.** Every deliberate exclusion names the address where the original still lives — *"it is somewhere on disk"* is a claim with no check. | PH-3 | `—` |
| **AX-24** | 🟢 | **The log records what has no other record — why, who originated it, and what was discarded — and every field can only be filled while deciding.** **`inherited` is the load-bearing value**, because a constraint you did not choose can only be discovered to be wrong; **a discarded thing keeps its entry and its status**, or the same proposal returns in six months with nobody able to say it was answered. | PH-3 · PH-4 | **a field that may legitimately be empty is written empty** — an absent field is indistinguishable from a real zero · **never narrate the diff** |
| **AX-25** | 🟢 | **Record what you cross, one line, and neither investigate nor fix it.** The firing event is *while doing something else*: going looking is an audit, and fixing in passing turns one reviewable change into two. | PH-6 | `—` |
| **AX-26** | 🟢 | **A standard ships as a copyable template, not as a document to be read.** Prose is met by intention; a template with the files already written is met by default, and divergence becomes deliberate. | PH-1 | `—` |
| **AX-27** | 🟢 | **What will grow names where it breaks** — the volume it was designed for, and the first step that becomes manual beyond it. A design that has not named its breaking point was designed for today. | PH-1 | `metrics.py` against the declared thresholds |
| **AX-28** | 🟢 | **Removing a decision from the operator requires a logged waiver naming what is given up**, and the waiver is what makes it reversible at the trade's review date. **A change the operator cannot restate unaided does not ship.** | PH-2 | `—` |
| **AX-29** | 🟢 | **A live document states its present and completed work leaves it; the history belongs in the log, and both halves are written in the same act.** A line stays only if the work would come out wrong without it **and** the reader could not have worked it out from the repository — ⚠️ **`AX-6` pulls the other way and `AX-24` resolves it**: the instruction is never *write less*, it is *write the other half*. | PH-1 · PH-6 | `skills/compact/` — and `A6` for what a pass cannot decide |
| **AX-30** | 🟢 | **Every repository's agent contract is generated, never hand-written**, with a check that fails on drift. ⚠️ **A hand-written contract is the first place two repositories quietly stop agreeing, and the exemption granted to the authoring repo is the one every later exemption cites** — so no repository is exempt, including this one. | PH-5 · PH-4 | `—` |
| **AX-31** | 🟢 | **A reference carries its scope the moment it leaves the file that minted it** — bare inside its own file, anchored the instant it is cited elsewhere. Added at writing time, because no later sweep can resolve the ambiguity (`AX-4`). | PH-4 | `bash tools/axiom-refs.sh <axioms> <SCOPE> <files…>` |
| **AX-33** | 🟢 | **Every artefact stamps the version of the rule set it was written against**, and the stamp moves only when the artefact is read whole and cleared. ⚠️ **Editing a row is not reviewing a file, and bumping without reading is a lie that costs nothing to tell** — it reports a review that did not happen and destroys the only drift detector this repository has at zero cost. | PH-5 | `skills/release-cut/` checks that stamps agree; **only an auditor moves one** |
| **AX-34** | 🟢 | **A queue is versioned and travels with the repository it serves** — a local inbox on five machines is not one inbox, it is five, and nothing reconciles them. **An access point working beside the operator writes to neither queue**; it simply says the thing. | PH-3 · PH-5 | `—` |
| **AX-35** | 🟢 | **References name things; they do not number them** — wherever a renumbering could not be corrected, the address is the name. Identifiers are never reused or renumbered, so a gap is information rather than a mistake. | PH-3 | `—` |
| **AX-36** | 🟢 | **A number states what it is out of and where it was read from, or it is not a measurement.** *57 accepted* is a number; *57 of 64, from the log* is a measurement — and **a count typed by hand is already wrong**, because nothing recomputes it when the thing it counts moves. | PH-7 | **the command that produces it appears beside it**, and it is run rather than remembered · ⚠️ **a metric that can only rise is a scoreboard** — one that cannot move in the bad direction hides the failure it was built to catch |

---

## Coverage — which clause each axiom serves

> ⚠️ **Regenerated, never transcribed** (`AX-2`). A clause at zero is a stated priority nothing
> implements.

| Clause | Axioms | Count |
|---|---|---|
| `PH-1` | `AX-26` · `AX-27` · `AX-29` | 3 |
| `PH-2` | `AX-13` · `AX-18` · `AX-28` | 3 |
| `PH-3` | `AX-1` · `AX-2` · `AX-9` · `AX-15` · `AX-19` · `AX-20` · `AX-23` · `AX-24` · `AX-34` · `AX-35` | 10 |
| `PH-4` | `AX-2` · `AX-6` · `AX-7` · `AX-12` · `AX-13` · `AX-14` · `AX-18` · `AX-22` · `AX-24` · `AX-30` · `AX-31` | 11 |
| `PH-5` | `AX-1` · `AX-19` · `AX-20` · `AX-30` · `AX-33` · `AX-34` | 6 |
| `PH-6` | `AX-4` · `AX-11` · `AX-17` · `AX-21` · `AX-25` · `AX-29` | 6 |
| `PH-7` | `AX-36` | 1 |
