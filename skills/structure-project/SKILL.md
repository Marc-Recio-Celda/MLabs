---
name: structure-project
description: Creates a project's cartridge under the method — definition, project-scoped axioms, decision log, state, sequenced plan, agent contract and compass row — when a new project starts or when work already underway is brought under the method for the first time.
---

# structure-project

**Firing event** (`MLabs:AX-8`): a new project starts, **or** a body of work already underway is
brought under the method. One firing produces one cartridge and one compass row.

**Where it writes:** the operations centre, at `projects/<project>/`. Path shapes only — the
literal root is the instance's, declared in its binding.

## The procedure

**1. Copy the template.** The cartridge is copied, never typed (`MLabs:AX-26`). Copy the project
template whole, then substitute every placeholder — the project's name, its path, its own `AX-n`
series — in one pass. A placeholder that survives the copy is a defect, not a to-do. Six files,
and no others:

| File | Kind | Holds |
|---|---|---|
| `definition.md` | Standing | what this project is, and explicitly what it is not |
| `architecture.md` | Standing | this project's own axioms |
| `state.md` | Standing | the present |
| `workflow.md` | Standing | the future, sequenced |
| `Decision_Log.md` | Record | `Dn`, with what was discarded |
| `LOG_AGENTS.md` | Record | what each agent did in this project |

**2. Fill `definition.md`.** Measurable objective · context · deliverables and their format ·
success criteria · constraints · data available. **Then, in its own section, what this project is
not.** The negative half is written now, while the boundary is still visible to the author: it
keeps scope from arriving unannounced, and no later pass can reconstruct it (`MLabs:AX-4`).

**3. Open `architecture.md` — the project's own axiom department.** It opens with at least one
rule or it is not opened at all; an empty axiom file reads as *this project has no constraints*.
Each entry is numbered `AX-n` in the project's own series, bare inside this file and anchored the
moment it is cited anywhere else (`MLabs:AX-31`), and each names the clause it serves. Which rules
belong here is settled by the placement test below.

**4. Open `Decision_Log.md`.** Parseable from the first entry, with the field contract in the
file's own header (`MLabs:AX-2`); every entry carries author, date, reasoning and **what was
discarded** (`MLabs:AX-24`). The first entry is the one that created the project: why it exists,
and what shape was rejected for it.

**5. Write `state.md` in the present, `workflow.md` in the future.** The registers split by tense
(`MLabs:AX-17`) and neither carries a changelog (`MLabs:AX-29`).

- `state.md` — the test is *would this still be true if work stopped today?* Current position,
  what it waits on, the active risks with the fallback agreed for each.
- `workflow.md` — blocks, dependencies, a verifiable deliverable per block, and a fallback. This
  is the third drawer; an unordered list of pending items is not one.

**6. Place the agent contract — only in a repository the operator owns.** It is generated from the
method half plus the repository's local half, never typed, with a check that fails on drift
(`MLabs:AX-30`).

- **Owned** → at the root of the code repository, local half filled: build and test commands, the
  working branch, the invariants that hold only here and the check for each. Every line passes
  both of `MLabs:AX-29`'s tests or it is cut.
- **Not owned** → **it is not dropped in.** Adding a file to someone else's repository is exactly
  the unrequested change the ownership class exists to stop (`MLabs:AX-19`). The contract stays in
  the cartridge; observations about that repository go to its owners, not into this instance's
  queues.

**7. Register the project in the compass.** One row, edges not nodes: the compass points at where
the work is described and describes none of it (`METHOD.md` §2). A new cartridge does not take the
`▶` by arriving — exactly one active front exists across every project, and moving it is the
operator's act. Anything this structuring turns up that is not this task leaves with a destination
from the closed vocabulary, one line, **with `project:` filled in** (`MLabs:AX-25`).

## ⚠️ What a cartridge never contains

**No mailbox. No task list. No ideas file. No live plan. No compass of its own.**

Those five are **one central set spanning every project**, filtered by the `project:` field, and
`METHOD.md` §5 names each by literal path. Creating a per-project copy of any of them is the
single most likely failure of this procedure, and it fails twice over: the copy is a duplicate
with no declared winner (`MLabs:AX-20`), and its entries are invisible to the filter that is the
whole point of centralising. **Only Records stay with their project.** Prediction 2 below checks
it mechanically, and is worth running even when one agent wrote the cartridge in a single pass.

## The placement test — which department a rule belongs to

Three departments, **different scope, identical force**; none overrides another, and an agent
working in the project loads all three (`METHOD.md` §6).

| Department | Lives in | Passes if |
|---|---|---|
| Company | the company axiom file | it would bind an instance that is not this one |
| Instance | the operations centre's axiom file | it binds **everything this operator does**, across every project — whether or not a stranger would adopt it |
| Project | this project's `architecture.md` | it binds this project only |

Anything narrower than the third row is not an axiom but a decision, and `METHOD.md` §7 routes it.
**When in doubt it goes down, not up** — promoting later costs one restatement, while demoting
later means a public file was wrong for however long nobody noticed. A rule that would have to be
copied into several project files is an instance rule pushed one level too far (`MLabs:AX-20`).

## Verification — stated as a prediction, then run

Write the predictions **before** running anything; the executor returns the real output and **the
gap is the finding** (`MLabs:AX-14`). Plant one fault and confirm each check catches it before
trusting a clean run (`MLabs:AX-7`).

| # | Prediction |
|---|---|
| 1 | Listing the cartridge returns the six files of step 1, plus the agent contract only where step 6 leaves it there |
| 2 | Searching the cartridge for the central queue and park filenames returns **nothing** |
| 3 | Searching the cartridge for template placeholders returns **nothing** |
| 4 | `architecture.md` holds ≥ 1 `AX-n`; every `AX-n` in it is bare, every foreign rule cited in it is anchored |
| 5 | `Decision_Log.md` holds ≥ 1 entry, and its header states the field contract |
| 6 | The compass holds exactly one `▶` across every project, and a row naming this one |
| 7 | Every new queue or park entry carries `project:` — entry count and `project:` count match |
| 8 | The agent contract sits at the code repository root **iff** the operator owns it; otherwise in the cartridge and nowhere else |

An unrunnable check is reported as unrun, never as passed (`MLabs:AX-22`).

## What it does not do

- **Execute.** No block of `workflow.md` is run here; structuring ends at the compass row.
- **Create anything central.** It writes into the existing central set; it never creates a second one.
- **Hire the project's auditor** — its own act, under `MLabs:AX-11`, with the dismissal criterion
  fixed before the first firing.
- **Touch a repository the operator does not own** (`MLabs:AX-19`).
- **Set the active front.** It adds the row; the operator moves the `▶`.
- **Amend the company or instance axiom files.** A rule that fails the project test is proposed
  upward, never written upward.
