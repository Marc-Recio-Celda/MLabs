# MLabs

> **Version:** unreleased · pre-release working draft (AX-20).

**A working methodology for building knowledge systems with AI agents — packaged as a company.**

MLabs is not a framework you install. It is the structure of a one-person company whose
employees are AI agents: a hierarchy of design principles, a small set of roles with defined
triggers, procedures packaged as skills, and — the part that makes it different — **a built-in
mechanism that audits its own health and a rule that fires any role that stops earning its
place.**

## The shape

**MLabs is a workspace that is also a repository.** The root you are reading is git-tracked,
and it tracks **only the structure** — this file, the philosophy, the axioms, the
orchestration, the roles, and later the skills and templates. Everything else that lives in the workspace — your
instance, your projects — sits in child folders, **each its own repository, never tracked
here**. Modular work: one clone gives you the whole frame; each piece versions itself.

| In the workspace                                    | What it is                                                                | Tracked by MLabs?      |
| --------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------- |
| The structural files (see `.gitignore`'s allowlist) | The company: hierarchy, roles, skills, templates                          | ✅ public, by release   |
| **NEXUS** — the operations centre                   | Where the company lives: knowledge, projects, logs, decisions, work in flight | ❌ its own private repo |
| Project folders                                     | Each venture's code and data                                              | ❌ each its own repo    |

Two mechanics make the containment safe, and they are rules, not hopes:

- **`.gitignore` is default-deny.** `/*` ignores everything; only explicit `!` lines enter.
  A new file is private until named — the failure mode is safe. The allowlist doubles as the
  manifest: at every release, `git ls-files` is compared against it, and the depersonalisation
  check greps **what git tracks**, not what the tree contains.
- **`git clean` is never run at this root.** It would delete the untracked — which here means
  everything you own. This is the one prohibition that is a rule rather than a tool, because
  deletion is the act no cleanup pass can undo.

MLabs contains **no personal information in what it tracks, by construction** — the invariant
is a command over `git ls-files`, not a promise (see `AGENTS.md` §Invariants).

**NEXUS is the operations centre, and it is not optional.** Every instance of this methodology
has exactly one: a private sibling repository holding the knowledge, the projects, the decision
log, the work in flight and the whole record. **MLabs is the constitution; NEXUS is the
country.** Practically nothing real is done without entering it — this repo says *how* to work,
NEXUS is *where* the work and its history are, and an agent that has read only MLabs knows every
rule and nothing that has ever happened. Adopting this methodology means creating your own
NEXUS, the way you create your own `main` branch.

NEXUS **pins the MLabs release it runs**, the way code pins a dependency. Upgrading is a
deliberate act, so a released structure never shifts under a running instance.

## Three levels, and what is in each today

Governance runs on three levels, and blurring them is the failure this company was founded to
fix — a flat list where everything is a rule has no hierarchy, so it protects whatever is most
salient rather than what matters most.

| Level | File | What it holds | How often it changes |
|---|---|---|---|
| **1 · Philosophy** | `PHILOSOPHY.md` | Six clauses: what this company optimises for, and what it refuses. **Breaks every tie.** | Almost never, and only by the operator |
| **2 · Axioms** | `AXIOMS.md` | 28 rules that implement the clauses and may never be violated. Each names the clause it serves, and the coverage is counted rather than assumed | Rarely. R&D proposes, the operator decides |
| **3 · Decisions** | *in NEXUS* | Concrete choices with their author, date, reasoning and what was discarded — the record, which is never held here | Constantly |

Alongside them, **`METHOD.md` — how work actually flows**: the five kinds of document and the
lifecycle each one owes, the loop from compass to live plan to routed close, and the project
cartridge. The three levels say what is true; `METHOD.md` says what you do on Monday morning.

**The same three levels repeat one floor down inside a project**, with its own axioms, its own
log and its own dedicated auditor. That is what makes the shape reproducible rather than
bespoke: adopting this is not copying one company's rules, it is instantiating a pattern.

Also here: `AGENTS.md` — who does what and when, the invariants and their checks, and the stage
map — and `roles/superauditor.md`, the first and only hired role, whose job is that level 2 is
never quietly violated and never drifts from level 1.

Skills and templates arrive in later stages, one at a time, each accepted by a **cold-start
test**: an agent — or a stranger — given only this repo must reach productive. If a stage fails
that test, the stage is not done.

## Status

Stage 1 — skeleton: philosophy, axioms, orchestration, first role. **Pre-release: no tag exists yet,
so there is nothing to pin** — the first tagged release, with a license, is stage 2's exit
condition. Until then this repo is a working draft and instances reference it by path, at their
own risk, knowingly.
