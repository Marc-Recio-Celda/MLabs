# AGENTS.md — how this company runs

> **Version:** unreleased · pre-release working draft (AX-20).

> The orchestration file: which roles exist, what each does, when each fires, and the rule that
> governs hiring and firing. Every line here must pass two tests: *if an agent ignored it, would
> the work come out wrong?* and *could it have worked this out by reading the repo?* Only
> yes-to-the-first, no-to-the-second stays.

---

## 1. What this repo is to an agent

MLabs is the **structure**, and it is the workspace root: this repo tracks only the structural
allowlist in `.gitignore`, while every child folder — the operator's private **instance**, each
project — is **its own repository, untracked here, forever**. Rules travel with this repo;
state never does. If no instance folder is present, you are editing methodology — nothing
personal is in scope, and nothing personal may enter what git tracks (§4).

**Start here, in this order.** `PHILOSOPHY.md` — what this company optimises for, and what
breaks every tie → `AXIOMS.md` — the rules that follow, already settled and not re-litigated →
this file, for who does what and when → the role file for whatever you are about to act as or
invoke. If an instance folder is present *and the work touches it*, read its `AGENTS.md` for
the binding and stop there: its contents are state, loaded on demand, never by default.

⚠️ **Read what the work needs, not all of it** (AX-21, applied to this file). Designing or
auditing loads all three levels. **Executing a defined task loads the binding and the role file
only** — the axioms are what the close is checked against, not what the work is done through,
and the four documents together are a real load that displaces the work itself.

**Three levels, and nothing is allowed to blur them.** *Philosophy* — six clauses, changed
almost never, only by the operator. *Axioms* — the rules that implement them, never violated,
each naming the clause it serves. *Decisions* — instance-level, with author, date and
reasoning, living in the instance's log and never here. **The same three levels repeat one
floor down inside a project**, with its own auditor, its own axioms and its own log: that is
what makes the shape reproducible rather than bespoke.

**The binding, declared instance-side.** The instance's own `AGENTS.md` declares four things:
its own folder name inside this workspace · **the MLabs release it pins** · **where its ledger
lives** (the append-only log the superauditor writes to, and the dismissal tally greps) · and
**where its denylist lives** for §4's depersonalisation check. The denylist is a list of names
and project words — personal data by definition — so it lives in the instance, never in what
this repo tracks.

## 2. The hierarchy — two lists, not one

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
| **5** | **Coupling** | If this changes, what else must be opened? Split by owner first, rate of change second (AX-10) |

**At close — the vetoes.** Mechanical, cheap, verifiable after the fact, and they reject:

| Order | Veto | The control question |
|---|---|---|
| **1** | **Traceability** | Is it recorded with its reasoning and its origin? |
| **2** | **Single source** | If this fact changes, how many files must be touched? |
| **3** | **Real return** | What concrete work does this unblock, and for whom? |

Ties among vetoes are broken by purpose. The conversation attends to the first list while
designing; the superauditor re-runs both at close, because at close it is the only one that
still will.

## 3. Roles

**Hired — active:**

| Role | What it is | Fires | Defined in |
|---|---|---|---|
| **Superauditor** | The company's long-term health: re-checks, at close, what salience made the conversation skip | a proposal closes (one firing per round, however many files the round touched) | `roles/superauditor.md` |

**Not yet hired — each enters only by the rule in §5, and not before:**

| Role | Would be | Fires |
|---|---|---|
| Auditor | the superauditor's shape, scoped to one project | a proposal closes inside a project |
| R&D | lateral thinking, uncomfortable truths, never annoyed at being ignored | at round close, over the round and its artefacts — never the transcript |
| Messenger | gathers raw information, returns a cited report | on demand |
| Dispatcher | hands each concrete task to a specialist executor | a task exists |
| Bookkeeper | logs, decisions, staleness detection | after execution |
| Analyst | **a script until reading the numbers needs judgement** | periodic |

Two things in the org chart are deliberately **not** roles: the **reasoner** (operator +
assistant — the conversation itself, which cannot be isolated) and the **distributor** (*nothing
is lost* — a rule at round close, not an agent, because its context is the whole conversation).

## 4. Invariants — each carries its check

| Invariant | The check |
|---|---|
| **No personal information in what git tracks.** No names, no employer, no project names from any instance | the release gate greps the instance's denylist over `git ls-files` output — what is *tracked*, since the working tree legitimately holds the private children — and it returns nothing. ⚠️ Test the grep against a planted leak before trusting it — the founding round shipped a broken one that could never match |
| **The tracked set is exactly the allowlist** — nothing more, and nothing named that does not exist | `git ls-files` compared against `.gitignore`'s `!` lines at every release cut. A **surplus** file is a leak, investigated before anything else happens; a `!` line with **no tracked file behind it** is empty scaffolding, and the line goes |
| **`git clean` is never run at this root.** The untracked here is everything the operator owns | none — prevention only. Deletion has no cleanup pass, which is exactly why this is a rule and not a tool (AX-5) |
| **The axioms are append-only.** Entries are never rewritten; later entries supersede | `git diff <last-tag>..HEAD -- AXIOMS.md \| grep -c '^-[^-]'` returns **0** — nothing removed, nothing altered, only appended |
| **Every structural change carries an axiom or a logged decision.** A change to the hierarchy, the roles or these invariants with nothing behind it is reverted | `git diff <last-tag>..HEAD --stat` against the same range's `AXIOMS.md` additions, on release cut |
| **Every axiom names the clause it serves, and every clause has at least one axiom** | the coverage table at the foot of `AXIOMS.md`, regenerated at each cut; a clause at zero is a stated priority nothing implements |
| **Every role file states its dismissal criterion** | grep for `## Dismissal` in `roles/*.md` — the *pattern and tally contract*; the operator's chosen thresholds live in the instance's hiring record, out of the role's own sight |

⚠️ **Every check here reads `git ls-files` or a diff, never the working tree** — the tree at this
root legitimately holds the instance and every project, which are none of this repo's business.
A check that walks the tree (`find`, a bare `grep -r`) is wrong by construction here, and the
founding round shipped one before catching it.

⚠️ **This file violates AX-21 today and the debt is declared rather than hidden.** AX-21 says an
agent contract is generated from a method half and a repository half, with a check that fails on
drift, and that no repository is exempt — including this one. This file is hand-written; the
generator is stage 2's work. Recorded here because an axiom broken silently by its own repo is
the precedent every later exemption will cite.

⚠️ **Until the first release these run by hand at each cut — that is a hope, not a guarantee**
(AX-7). Wiring them into something that runs without a human — CI, a release script, a hook —
is part of stage 2's gate, not an option.

## 5. Hiring and firing

**The rule is AX-11; it is not restated here.** What this file adds is the shape the numbers
take: each role sets its own **N** — consecutive firings adding nothing, after which it is
retired — and **K** — genuine findings, after which the *next* role may be hired, one, not
several. Both are fixed before the role's first firing, both are countable by a command over the
instance's ledger, and both live in the instance's hiring record, out of the role's own sight.

## 6. Gates

- **A proposal closes** → the superauditor fires, once, over everything the round touched.
- **A round closes** → every open thread is enumerated with its destination, and *written* is
  claimed only after reading the file back from disk. A thread with no destination is a failure
  of the close, not an omission.
- **A release is cut** → all §4 checks run, the cold-start test runs, the version is tagged.
  Instances upgrade by choice, never by drift.

## 7. Stage map

| Stage | Content | Gate |
|---|---|---|
| **1 — now** | skeleton: `PHILOSOPHY.md`, `AXIOMS.md` opened with the founding sweep, this file, the superauditor | cold start: an agent with only this repo explains the company and **can operate its rules** — including the tally. First run **failed** on exactly that and the contract was fixed; the pass that counts is recorded in the instance's ledger |
| 2 | the split executes: generic halves of the founding instance's method layer move in; §4's checks get wired to run without a human; first tagged release + license | cold start repeats; the instance still runs; the checks run themselves |
| 3+ | skills, one per stage: create-notes · structure-a-project · correct-exercises · learn · code-cleanup · collaborative-repo · **instantiate** (create your own instance) | each skill's own verification, stated as a prediction before it runs |
| later | roles beyond the superauditor, strictly by §5 | each role's own criterion |
