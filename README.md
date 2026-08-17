# MLabs

**A working methodology for building knowledge systems with AI agents — packaged as a company.**

MLabs is not a framework you install. It is the structure of a one-person company whose
employees are AI agents: a hierarchy of design principles, a small set of roles with defined
triggers, procedures packaged as skills, and — the part that makes it different — **a built-in
mechanism that audits its own health and a rule that fires any role that stops earning its
place.**

## The shape

**MLabs is a workspace that is also a repository.** The root you are reading is git-tracked,
and it tracks **only the structure** — this file, the orchestration, the decision log, the
roles, and later the skills and templates. Everything else that lives in the workspace — your
instance, your projects — sits in child folders, **each its own repository, never tracked
here**. Modular work: one clone gives you the whole frame; each piece versions itself.

| In the workspace                                    | What it is                                                                | Tracked by MLabs?      |
| --------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------- |
| The structural files (see `.gitignore`'s allowlist) | The company: hierarchy, roles, skills, templates                          | ✅ public, by release   |
| **The instance** (e.g. `NEXUS/`)                    | Everything personal: knowledge, projects, logs, decisions, work in flight | ❌ its own private repo |
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

An instance **pins the MLabs release it runs**, the way code pins a dependency. Upgrading is a
deliberate act, so a released structure never shifts under a running instance.

## What is in it today

- `AGENTS.md` — the orchestration: which roles exist, what each does, when each fires, and the
  hiring/dismissal rule that governs them all.
- `DECISIONS.md` — this repo's decision log. It opens with the set of rules the founding
  instance had already learned, each marked `inherited` with a pointer to its origin.
- `roles/superauditor.md` — the first and only hired role: the company's long-term health.

Skills and templates arrive in later stages, one at a time, each accepted by a **cold-start
test**: an agent — or a stranger — given only this repo must reach productive. If a stage fails
that test, the stage is not done.

## Status

Stage 1 — skeleton: orchestration, inherited log, first role. **Pre-release: no tag exists yet,
so there is nothing to pin** — the first tagged release, with a license, is stage 2's exit
condition. Until then this repo is a working draft and instances reference it by path, at their
own risk, knowingly.
