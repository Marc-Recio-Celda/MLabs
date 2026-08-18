# AGENTS.md — how this company runs

> **Version:** 1.1.0

> The orchestration file: which roles exist, what each does, when each fires, and the rule that
> governs hiring and firing. Every line here must pass two tests: *if an agent ignored it, would
> the work come out wrong?* and *could it have worked this out by reading the repo?* Only
> yes-to-the-first, no-to-the-second stays.

---

## 1. What this repo is to an agent

MLabs is the **structure**, and it is the workspace root: this repo tracks only the structural
allowlist in `.gitignore`, while every child folder — **NEXUS** and each project — is **its own
repository, untracked here, forever**. Rules travel with this repo; state never does. If NEXUS
is not present, you are editing methodology and nothing else is in scope — and nothing personal
may enter what git tracks (§5).

**Start here, in this order.** `PHILOSOPHY.md` — what this company optimises for, and what
breaks every tie → `AXIOMS.md` — the rules that follow, already settled and not re-litigated →
this file, for who does what and when → **`METHOD.md` — how work actually flows, which is the
one you will use every day** → the role file for whatever you are about to act as or invoke →
**and then NEXUS, which is where the work is** (§2). The first three are read once and rarely
again; `METHOD.md` is the shape of a working day; NEXUS is entered for almost everything.

⚠️ **Read what the work needs, not all of it** (AX-21, applied to this file). Designing or
auditing loads all three levels. **Executing a defined task loads NEXUS's binding, the role file,
and `METHOD.md` §2 and §7** — the loop and the routing table, because the close is not optional
and its destination vocabulary lives there. The axioms are what the close is *checked against*,
not what the work is done through; loading all five documents for a defined task displaces the
work itself.

**Three levels, and nothing is allowed to blur them.** *Philosophy* — six clauses, changed
almost never, only by the operator. *Axioms* — the rules that implement them, never violated,
each naming the clause it serves. *Decisions* — concrete, with author, date and reasoning,
living in NEXUS and never here. **The same three levels repeat one floor down inside a
project**, with its own auditor, its own axioms and its own log: that is what makes the shape
reproducible rather than bespoke.

## 2. NEXUS — the operations centre

**Every MLabs instance has exactly one, and it is where the company actually lives.** The
knowledge, the projects, the decisions with their authors and dates, the work in flight, the
ledger, the task list, the inbox, the plan — all of it is in NEXUS. It is **private**, it is a
sibling folder in this workspace, and it is **never tracked here**.

> **MLabs is the constitution. NEXUS is the country.**

The practical consequence, which this file understated until it was corrected: **almost nothing
real happens without entering NEXUS.** This repo tells you *how* to work; NEXUS is *where* the
work and its entire record are. An agent that has read only MLabs knows every rule and nothing
that has ever happened — it cannot say what is being built, what was decided last week, what is
blocked, or what it is supposed to do next. It knows the law of a country it has not visited.

So the reading order below is not "MLabs, then optionally NEXUS". It is: **learn the rules once,
then go where the work is.** What stays true is only *how much* of NEXUS gets loaded — its
binding always, its contents by the routing index and never wholesale (AX-21).

**NEXUS is company vocabulary, not a private name.** MLabs names the role and its conventional
root, and names nothing inside it: no project, no person, no path below the root. That is the
invariant the depersonalisation check enforces, and naming the operations centre does not
weaken it — a stranger instantiating their own company creates their own NEXUS, the same way
they create their own `main` branch.

**The binding, declared NEXUS-side.** NEXUS's own `AGENTS.md` declares: **the MLabs release it
pins** · **where its ledger lives** (the append-only log the company auditor writes to and the
dismissal tally greps) · and **where its denylist lives** for §5's depersonalisation check. The
denylist is a list of names and project words — personal data by definition — so it lives in
NEXUS, never here.

## 3. The hierarchy — two lists, not one

Authority and attention run in opposite directions, on purpose: **vetoes are verifiable at the
end, design pressures cannot be retrofitted** — so the order of attention is the inverse of the
order of authority. Both lists sit *below* `PHILOSOPHY.md`, which decides when they tie.

**While designing** — in this order, because a pressure skipped here cannot be retrofitted:

| Tier | Pressure | The control question |
|---|---|---|
| **1** | **Purpose** | Does it serve the next thing, or only this one? · Does it buy speed at the cost of understanding? · Does it lower the cost of a transition? |
| **2** | **Scale** | Does it hold at 3× today's volume? Which step becomes manual first? |
| **2** | **Context cost** | What must be loaded to do this work, and what does that displace? |
| **3** | **Operator load** | The manual step it adds — is it a *decision* or *transcription*? Transcription is always debt; review is not |
| **3** | **Portability** | Given only the artefacts, does a new agent, tool, model, machine — or the operator in six months — reach productive? |
| **4** | **Migration cost** | How many existing artefacts must be touched, and who consumes the new thing? |
| **5** | **Coupling** | If this changes, what else must be opened? Split by owner first, rate of change second (PH-5) |

**At close — the vetoes.** Mechanical, cheap, verifiable after the fact, and they reject:

| Order | Veto | The control question |
|---|---|---|
| **1** | **Traceability** | Is it recorded with its reasoning and its origin? |
| **2** | **Single source** | If this fact changes, how many files must be touched? |
| **3** | **Real return** | What concrete work does this unblock, and for whom? |

Ties among vetoes are broken by purpose. The conversation attends to the first list while
designing; the company auditor re-runs both at close, because at close it is the only one that
still will.

## 4. Roles

**Hired — active:**

| Role | What it is | Fires | Defined in |
|---|---|---|---|
| **Company auditor** | The company's long-term health: re-checks, at close, what salience made the conversation skip. **Checks decisions; does not propose** | four triggers — see `skills/company-auditor/`, the single source | `skills/company-auditor/` |

**Every employee is a skill file. What makes one a *role* is the shape of its description.**

| | Its description names | Fires because |
|---|---|---|
| **Role** | **an event** — *"when a task closes"*, *"when an axiom set changes"* | something happened. It must never be convenient to skip |
| **Capability** | **a request** — *"when the operator wants X"* | someone asked |
| **Locked** | either, plus `disable-model-invocation: true` | only the operator calls it, by name. **The cost: its description leaves context entirely**, so the model no longer knows the skill exists — lock only what the model should never reach for, never a door it is supposed to route through |

There is no `roles/` directory: a second home for the same employee is a second place to change
one fact. What a role additionally needs — its dismissal criterion, its thresholds, its standing
— is **governance, not procedure**, and lives in the operations centre's hiring record, out of
the role's own sight.

⚠️ **An event named in prose is a best-effort trigger, not a hook.** A description saying *when a
task closes* fires when the model notices the task closed. That is the same independence gap the
audit's own record declares, and wiring a real hook is what closes it.

**Written, not hired: R&D** (`skills/rnd/`) — lateral work on the axioms, kept separate from the
audit because a role paid for findings must not be invited to invent, and left request-triggered
because it would otherwise fire on rounds with nothing to reconsider.

**Written and available.** A skill existing is not a hire: an event-triggered one only counts
against §6 when the operator turns it on for real work.

| Role | Status | What it is |
|---|---|---|
| **Auditor** | ✅ written · `skills/project-auditor/` | the company auditor's shape scoped to one project. **Hired per project**, each with its own criterion |
| **Gatherer** | ✅ written · `skills/gather/` | collects and cites; **its value is burning someone else's context** |
| **Dispatcher** | ✅ written · `skills/dispatch/` | hands work to the executor entitled to claim the answer |
| Bookkeeper | ⏸ not written | logs, decisions, staleness. ⚠️ **Probably not a role**: staleness is decidable by comparison, which makes it a script (AX-13). What is left is writing entries, which every skill already does at its own close |
| Analyst | ⏸ not written | **a script until reading the numbers needs judgement.** Three of the five health metrics are computable today and none is computed; build the numbers, then decide whether reading them needs a hire |

Two things in the org chart are deliberately **not** roles: the **reasoner** (operator +
assistant — the conversation itself, which cannot be isolated) and the **distributor** (*nothing
is lost* — a rule at round close, not an agent, because its context is the whole conversation).

## 5. Invariants — each carries its check

| Invariant | The check |
|---|---|
| **No personal information in what git tracks.** No person's name, no employer, no project name, no path inside NEXUS. Naming NEXUS itself is vocabulary (§2), not a leak | the release gate greps the instance's denylist over `git ls-files` output — what is *tracked*, since the working tree legitimately holds the private children — and it returns nothing. ⚠️ Test the grep against a planted leak before trusting it: a pattern that cannot match returns clean on a leak |
| **The tracked set is exactly the allowlist** — nothing more, and nothing named that does not exist | `git ls-files` compared against `.gitignore`'s `!` lines at every release cut. A **surplus** file is a leak, investigated before anything else happens; a `!` line with **no tracked file behind it** is empty scaffolding, and the line goes |
| **`git clean` is never run at this root.** The untracked here is everything the operator owns | none — prevention only. Deletion has no cleanup pass, which is exactly why this is a rule and not a tool (AX-4) |
| **The axioms are append-only.** Entries are never rewritten; later entries supersede | `git diff <last-tag>..HEAD -- AXIOMS.md \| grep -c '^-[^-]'` returns **0** — nothing removed, nothing altered, only appended |
| **Every structural change carries an axiom or a logged decision.** A change to the hierarchy, the roles or these invariants with nothing behind it is reverted | `git diff <last-tag>..HEAD --stat` against the same range's `AXIOMS.md` additions, on release cut |
| **Every queue and park entry carries `project:`** — a name or `cross`. The field the filter depends on is the field nothing else can infer | `grep -c '^- ' <file>` against `grep -c 'project:' <file>` on each central queue: the two must match, and a mismatch names the unrouted entries |
| **Every axiom sits in exactly one tier** (company · instance · project) | at each cut, a company axiom that names a toolchain, a project or a person belongs one tier down; an instance rule copied into more than one project file is a duplicate with no winner (AX-20) |
| **Every axiom names the clause it serves, and every clause has at least one axiom** | the coverage table at the foot of `AXIOMS.md`, regenerated at each cut; a clause at zero is a stated priority nothing implements |
| **Every event-triggered skill states its dismissal criterion** | grep for `## Dismissal` in `skills/*/SKILL.md` — the *pattern and tally contract*; the chosen thresholds live in the instance's hiring record, out of that skill's own sight |

⚠️ **Every check here reads `git ls-files` or a diff, never the working tree** — the tree at this
root legitimately holds the instance and every project, which are none of this repo's business.
A check that walks the tree (`find`, a bare `grep -r`) is wrong by construction here, and the
founding round shipped one before catching it.

⚠️ **This file violates AX-30 today and the debt is declared rather than hidden.** AX-30 says an
agent contract is generated from a method half and a repository half, with a check that fails on
drift, and that no repository is exempt — including this one. This file is hand-written; the
generator is stage 2's work. Recorded here because an axiom broken silently by its own repo is
the precedent every later exemption will cite.

⚠️ **Until the first release these run by hand at each cut — that is a hope, not a guarantee**
(AX-7). Wiring them into something that runs without a human — CI, a release script, a hook —
is part of stage 2's gate, not an option.

## 6. Hiring and firing

**The rule is AX-11; it is not restated here.** What this file adds is the shape the numbers
take: each role sets its own **N** — consecutive firings adding nothing, after which it is
retired — and **K** — genuine findings, after which the *next* role may be hired, one, not
several. Both are fixed before the role's first firing, both are countable by a command over the
instance's ledger, and both live in the instance's hiring record, out of the role's own sight.

## 7. Gates

- **A task closes** → **if a structural file changed or a decision was logged**, the company auditor is invoked, once, over everything the task touched — after the destinations are read back and **before** the live plan is emptied (`METHOD.md` §2). Its four triggers are stated in full in `skills/company-auditor/`, which is the single source; this line is the gate, not the definition.
- **Every close** → every open thread is enumerated with its destination, and *written* is
  claimed only after reading the file back from disk. A thread with no destination is a failure
  of the close, not an omission.
- **A release is cut** → all §5 checks run, the cold-start test runs, the version is tagged.
  Instances upgrade by choice, never by drift.

## 8. Stage map

| Stage | Content | Gate |
|---|---|---|
| **1 — now** | skeleton: `PHILOSOPHY.md`, `AXIOMS.md`, this file, `METHOD.md`, the company auditor | cold start: an agent given only this repo explains the company and **can operate its rules**, tally included. The passing run is recorded in the instance's ledger |
| 2 | the split executes: generic halves of the founding instance's method layer move in; §5's checks get wired to run without a human; first tagged release + license | cold start repeats; the instance still runs; the checks run themselves |
| **3 — now** | the operating skills: `open-session` · `triage` · `audit` · `rnd` · `learn` · `correct-exercise` · `structure-project`, plus `create-note` in the instance, which is the one door to its knowledge base | each carries its verification as a prediction; the loop runs end to end without the operator narrating it |
| 4 | `code-cleanup` and `collaborative-repo` — the two cleanup skills, and the templates the standards ship as | each skill's own prediction |
| last | **`nexus-builder`** — the skill that creates a new NEXUS from nothing and walks its owner into working in it. **Deliberately last**: it encodes the shape of an instance, so building it before the shape stops moving means building it twice | a stranger, given only this repo and the skill, ends with a working NEXUS and a first task in flight |
| later | roles beyond the company auditor, strictly by §6 | each role's own criterion |
