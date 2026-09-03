# AGENTS.md — how this company runs

> The orchestration file: which roles exist, what each does, when each fires, and the rule that
> governs hiring and firing. **Every line here passes two tests** — *if an agent ignored it, would
> the work come out wrong?* and *could it have worked this out by reading the repo?* **Only
> yes-then-no stays** (`AX-29`); there is no notes section and nothing overflows — history is
> the log's (`AX-41`), a trap goes to `skills/company-auditor/traps.md`, and everything else is not
> written.

---

## 1. What this repo is to an agent

MLabs is the **structure**, and it is the workspace root: this repo tracks only the structural
allowlist in `.gitignore`, while every child folder — **the operations centre** and each project —
is **its own repository, untracked here, forever**. Rules travel with this repo; state never does.
If the operations centre is not present, you are editing methodology and nothing else is in scope.

**Start here, in this order.** `PHILOSOPHY.md` — what this company optimises for, and what breaks
every tie → `AXIOMS.md` — the rules that follow, already settled and not re-litigated → this file,
for who does what and when → **`METHOD.md` — how work actually flows, which is the one you will use
every day** → **`FLOW.md` — the shape the work moves in, and the declared winner for the plan
lifecycle** → the role file for whatever you are about to act as or invoke → **and then the
operations centre, which is where the work is** (§2).

⚠️ **Read what the work needs, not all of it** (`AX-21`). **Designing or auditing loads all three
levels. Executing a defined task loads the binding, the role file, and `METHOD.md` §2 and §7** — the
loop and the routing table, because the close is not optional and its destination vocabulary lives
there. **The axioms are what the close is *checked against*, not what the work is done through**, and
loading all five documents for a defined task displaces the work itself.

**Three levels, and nothing is allowed to blur them.** *Philosophy* — the clauses, changed almost
never, only by the operator. *Axioms* — the rules that implement them, never violated, each naming
the clause it serves. *Decisions* — concrete, with author, date and reasoning, living instance-side
and never here. **The same three levels repeat one floor down inside a project**, with its own
auditor, its own axioms and its own log.

## 2. The operations centre

**Every MLabs instance has exactly one, and it is where the company actually lives** — the
knowledge, the projects, the decisions, the work in flight, the ledger, the task list, the inbox,
the plan. It is **private**, a sibling folder in this workspace, and **never tracked here**.

> **MLabs is the constitution. The operations centre is the country.**

**Almost nothing real happens without entering it.** This repo tells you *how* to work; the centre
is *where* the work and its entire record are. An agent that has read only MLabs knows every rule
and nothing that has ever happened. So the reading order is **learn the rules once, then go where
the work is** — and only *how much* of it loads is variable: its binding always, its contents by the
routing index and never wholesale (`AX-21`).

**Its name is company vocabulary, not a private name.** MLabs names the role and its conventional
root and names nothing inside it: no project, no person, no path below that root. A stranger
instantiating their own company creates their own, the same way they create their own `main` branch.

**The binding, declared instance-side.** The centre's own contract at its system root — `AGENTS.md`
by default (`skills/build-nexus/layout.md`) — declares **where its ledger lives**, the append-only
log the auditors write to, and **where its denylist lives** for §5's depersonalisation check. The
denylist is a list of names and project words, personal data by definition, so it lives there and
never here. ⚠️ **An instance built before that default carries another name**, so an arriving agent
lists the system root rather than assuming one.

## 3. The hierarchy — two lists, not one

Authority and attention run in opposite directions, on purpose: **vetoes are verifiable at the end,
design pressures cannot be retrofitted** — so the order of attention is the inverse of the order of
authority. Both lists sit *below* `PHILOSOPHY.md`, which decides when they tie.

**While designing** — in this order, because a pressure skipped here cannot be retrofitted:

| Tier | Pressure | The control question |
|---|---|---|
| **1** | **Purpose** | Does it serve the next thing, or only this one? · Does it buy speed at the cost of understanding? · Does it lower the cost of a transition? |
| **2** | **Scale** | Does it hold at 3× today's volume? Which step becomes manual first? |
| **2** | **Context cost** | What must be loaded to do this work, and what does that displace? |
| **3** | **Operator load** | The manual step it adds — is it a *decision* or *transcription*? Transcription is always debt; review is not |
| **3** | **Portability** | Given only the artefacts, does a new agent, tool, model, machine — or the operator in six months — reach productive? |
| **4** | **Migration cost** | How many existing artefacts must be touched, and who consumes the new thing? |
| **5** | **Coupling** | If this changes, what else must be opened? Split by owner first, rate of change second (`PH-1`) |

**At close — the vetoes.** Mechanical, cheap, verifiable after the fact, and they reject:

| Order | Veto | The control question |
|---|---|---|
| **1** | **Traceability** | Is it recorded with its reasoning and its origin? |
| **2** | **Single source** | If this fact changes, how many files must be touched? |
| **3** | **Real return** | What concrete work does this unblock, and for whom? |

Ties among vetoes are broken by purpose. **The conversation attends to the first list while
designing; the company auditor re-runs both at close, because at close it is the only one that
still will.**

## 4. Roles

**A role is a skill plus a log plus a dismissal criterion** (`METHOD.md` §5, `AX-11`). The three
auditors share one contract in `skills/audit/`; each role file states **only** its scope, its
trigger and its own checks.

**Hired — active:**

| Role | Scope | Fires | Defined in |
|---|---|---|---|
| **Company auditor** | **the public structure** — what would bind an instance that is not this one. **Checks decisions; does not propose** | a close that changed a company-structural file | `skills/company-auditor/` |
| **Instance auditor** | the operations centre's own health. **Different failures, not a smaller scope**: an instance fails by its checks going quietly vacuous — a glob that stops matching, an invariant run from the wrong root, a permission table that lost its paths | a close that changed the instance's structure or the declared shape of its live set | `skills/instance-auditor/` |
| **Project auditor** | one project's cartridge, plus four checks only it runs. **Hired per project**, each with its own criterion | a close in that project | `skills/project-auditor/` |
| **R&D** | lateral work on the axioms — **kept out of the audit because a role paid for findings must not be invited to invent** | request | `skills/rnd/` |

**What makes a skill a role is the shape of its description**, and it decides when it fires:

| | Its description names | Fires because |
|---|---|---|
| **Role** | **an event** — *"when a task closes"* | something happened. It must never be convenient to skip |
| **Capability** | **a request** — *"when the operator wants X"* | someone asked |
| **Locked** | either, plus `disable-model-invocation: true` | only the operator calls it, by name. ⚠️ **Its description leaves context entirely**, so the model no longer knows it exists — lock only what the model should never reach for |

⚠️ **An event named in prose is a best-effort trigger, not a hook.** A description saying *when a
task closes* fires when the model notices the task closed; wiring a real hook is what closes that
gap.

**There is no `roles/` directory** — a second home for the same employee is a second place to change
one fact. **A role's criterion and standing are governance, not procedure**, and live in the
operations centre's hiring record, out of the role's own sight.

**Written and available — a skill existing is not a hire.** `gather` (collects and cites; its value
is burning someone else's context) · `dispatch` (hands work to the executor entitled to claim the
answer). **Bookkeeper and analyst are proposed and not written** — the four-role architecture is
open in the instance's mailbox, deferred to the audits.

Two things in the org chart are deliberately **not** roles: the **reasoner** (operator + assistant —
the conversation itself, which cannot be isolated) and the **distributor** (*nothing is lost* — a
rule at round close, not an agent, because its context is the whole conversation).

## 5. Invariants — each carries its check

| Invariant | The check |
|---|---|
| **No personal information in what git tracks.** No person's name, no employer, no project name, no path inside the operations centre. Naming the centre itself is vocabulary (§2) | `tools/gate.sh` — greps the instance's denylist over `git ls-files`, and returns nothing. ⚠️ **Test it against a planted leak, and plant against the *format*** |
| **The tracked set is exactly the allowlist** — nothing more, and nothing named that does not exist | `tools/gate.sh` check 3, both directions. A **surplus** file is a leak; a `!` line with **no tracked file behind it** is empty scaffolding, and the line goes |
| **`git clean` is never run at this root.** The untracked here is everything the operator owns | none — prevention only (`AX-4`) |
| **Records are append-only; Standing documents are not.** A log, a ledger and a decision store only grow. **`AXIOMS.md`, this file and `METHOD.md` are Standing and are rewritten to stay true** — what protects them is that every change is read as a diff and agreed, not that nothing may leave | `skills/release-cut/` §3 over the Records. ⚠️ **Forcing a Standing file to only grow is how its centre fills with deprecated rows** |
| **Every structural change carries an axiom or a logged decision** | `git diff <last-tag>..HEAD --stat` against the same range's `AXIOMS.md` additions, at the cut |
| **Every queue and park entry carries `project:`** — a name or `cross` | `interface/model/parse.py --adapter <the instance's>` reports **`with project: n/n`** per kind and **`Nothing unplaceable.`** |
| **Every axiom sits in exactly one tier** (company · instance · project) | a company axiom naming a toolchain, a project or a person belongs one tier down; an instance rule copied into more than one project file is a duplicate with no winner (`AX-20`) |
| **Every axiom names the clause it serves, and every clause has at least one axiom** | the coverage table at the foot of each department, **regenerated and compared**, never transcribed. ⚠️ **No count appears in this cell**, for the reason the cell itself gives |
| **Every role states its dismissal criterion and keeps a log** — the two together are what make it a role | `tools/roles-check.sh --skills skills --logs <the instance's logs dir>`. **The two sets must be the same set**, and each direction is reported separately: *a criterion with no log* and *a log with no criterion* are different problems |
| **A rule that changes is followed to every artefact citing it** (`AX-33`) | `grep -rln '<the id>' $(git ls-files)` gives the dependency list, and `tools/axiom-refs.sh` proves none of them points at a row that no longer exists. ⚠️ **The artefact that breaks loudly is not the risk** — it is the one that still runs and is now wrong |
| **Never push to the stable branch without explicit operator permission** | the binding names the working branch as **a literal value**, and no agent workflow targets the stable one automatically. ⚠️ **A rule whose subject is a phrase cannot be checked; one whose subject is a value can** |

⚠️ **Every check here reads `git ls-files` or a diff, never the working tree** — the tree at this
root legitimately holds the instance and every project, which are none of this repo's business. A
check that walks the tree (`find`, a bare `grep -r`) is wrong by construction here.

⚠️ **Until the first release these checks run by hand at each cut, which is a hope and not a
guarantee** (`AX-7`). Wiring them into CI, a release script or a hook is stage 2's gate.

⛔ **An invariant this repository exempts itself from is not an invariant.** The exemption granted to
the authoring repo is the one every later exemption cites, and it is granted by whoever is least
able to see the cost of granting it.

⚠️ **And every check states the root it runs from.** *The same correct check, run from the wrong
checkout or the wrong root, returns clean* — the sibling of *a pattern that cannot match*, and not a
smaller problem. **A check that cannot state its root has not been run**, and **exit 0, exit 1 and
exit 2 are three different answers**; collapsing *could not run* into *passed* is how a check becomes
decoration. The three implementations here are the pattern to copy.

## 6. Hiring and firing

**Both are the operator's act.** A role states its dismissal criterion when it is written and keeps a
log from the moment it is hired (`AX-11`); **the criterion exists to give the operator something to
read the log against, not to retire a role by arithmetic.** ⚠️ **A threshold that fires on its own
retires a role on the round that happened to be quiet** — a property of the round, not of the role.
The criterion lives in the instance's hiring record, out of the role's own sight.

## 7. Gates

- **A task closes** → if a structural file changed, **the auditor for the department that changed**
  is invoked — one of them, not two; `skills/audit/` routes — once, over everything the task
  touched, **after** the destinations are read back and **before** the live plan is closed
  (`METHOD.md` §2). **A close that touched only the live set, the logs, notes, code or content does
  not fire it.** Each role file states its own two lists — structural, and expressly not
  structural. The operator may invoke it on any close.
- **Every close** → every open thread is enumerated with its destination, and *written* is claimed
  only after reading the file back from disk. **A thread with no destination is a failure of the
  close, not an omission.**
- **A release is cut** → all §5 checks run, the cold-start test runs, the version is tagged.
  Instances upgrade by choice, never by drift.

## 8. Stage map

| Stage | Content | Gate |
|---|---|---|
| **1 — done** | skeleton: `PHILOSOPHY.md`, `AXIOMS.md`, this file, `METHOD.md`, the company auditor | cold start: an agent given only this repo explains the company and **can operate its rules** |
| **2 — half done** | ✅ the split executed and the generic halves moved in · ✅ licence and first tagged release · ⬜ **§5's checks still need a human at every cut**, which is the half that decides the stage | **the checks run themselves.** Until then §5 is a documented procedure, and `AX-7` says what that is worth |
| **3 — written** | the operating skills, plus `create-note` — the one door to a knowledge base | each carries its verification as a prediction. ⚠️ **The end-to-end gate has never been run as a test** — the loop has run in practice, which is a different claim |
| **4 — now** | ✅ `compact`, run over the whole tracked set · ⬜ the collaborative-repo pass · ⬜ **the templates the standards ship as** — `AX-26` asks for them and nothing in the tracked set is one | each skill's own prediction |
| **✅ done, out of order** | **`build-nexus`** — creates an operations centre from nothing and walks its owner to a first task. Was listed last because it encodes the shape of an instance; **the shape stopped moving, so it moved** | a stranger, given only this repo and the skill, ends with a working instance and a first task in flight |
| later | roles beyond those hired, strictly by §6 | each role's own criterion |
