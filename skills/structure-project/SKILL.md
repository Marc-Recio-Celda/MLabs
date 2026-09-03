---
name: structure-project
description: Creates a project's cartridge under the method — definition, state, decision log, agent log, and its own axioms once it has one — plus the agent contract where the repository is owned, and a compass row; when a new project starts or when work already underway is brought under the method for the first time.
---

# structure-project

## Occasion
**A new project starts**, or a body of work already underway is brought under the method. One
firing produces **one cartridge and one compass row**.

**Where it writes:** the operations centre, at its projects root. **Path shapes only — the literal
root is the instance's, declared in its binding.**

## The procedure

**1. Copy the template.** The cartridge is copied, never typed (`MLabs:AX-26`). Copy it whole, then
substitute every placeholder — the project's name, its path, its own `AX-n` series — in one pass.
**A placeholder that survives the copy is a defect, not a to-do.**

**Every file below goes in the project's `nexus/` folder**, which is the cartridge — the project's
own directory holds its code and its data, and `nexus/` holds what governs them.

**The cartridge's files and what each holds are `MLabs:METHOD.md` §2's.** What this procedure adds
is **when two of them are created at all**: `architecture.md` and `skills/` **open with their first
entry and never as an empty container.**

**2. Fill `definition.md`, and purpose comes before mechanism.** ⛔ **What this project is for, and
what it refuses, is written before any procedure** — purpose is what breaks a tie when two rules both
apply, so it goes where it is read first. Measurable objective · context · deliverables and their format ·
success criteria · constraints · data available. **Then, in its own section, what this project is
not.** The negative half is written now, while the boundary is still visible to the author: **it
keeps scope from arriving unannounced, and no later pass can reconstruct it** (`MLabs:AX-4`).

**3. Open `architecture.md` — the project's own axiom department.** It opens with at least one rule
or it is not opened at all; **an empty axiom file reads as *this project has no constraints*.** Each
entry is numbered in the project's own series, bare inside this file and anchored the moment it is
cited anywhere else (`MLabs:AX-31`), and each names the clause it serves. Which rules belong here is
settled by the placement test below.

**4. Open `Decision_Log.md`.** Parseable from the first entry, with the field contract in the file's
own header (`MLabs:AX-2`); every entry carries author, date, reasoning and **what was discarded**
(`MLabs:AX-24`). **The first entry is the one that created the project:** why it exists, and what
shape was rejected for it.

**5. Open `state.md` and `Decision_Log.md` as live documents.** Both state their present and
neither carries a changelog (`MLabs:AX-41`).

- `state.md` — current position, what it waits on, and the active risks with the fallback agreed
  for each, all of it against `METHOD.md` §2 step 1b's test. ⚠️ **`next action` is a required field,
  not a courtesy** — a state file without one is a project whose next move lives in somebody's head,
  and `interface/model/parse.py` reports its absence by name.
- ⚠️ **No sequenced-plan file.** `AX-17`'s third drawer **is a field, not a document** — the rule
  is that axiom's, and the consequence here is that the cartridge has one file fewer than an author
  expects.

**6. Place the agent contract — only in a repository the operator owns.** It holds what is true of
**this** repository and reaches the method by reference: it is the one file naming where MLabs
lives, and every rule it needs from there is cited, never copied (`MLabs:AX-20`).

- **Owned** → at the root of the code repository, local half filled: build and test commands, the
  working branch, the invariants that hold only here and the check for each.
- **Not owned** → **it is not dropped in.** Adding a file to someone else's repository is exactly
  the unrequested change the ownership class exists to stop (`MLabs:AX-19`). The contract stays in
  the cartridge; observations about that repository go to its owners, not into this instance's
  queues.

**6b. Add the project's name to the instance's denylist, and prove the gate fires on it.** A new
cartridge introduces a new **private identifier**, and the depersonalisation gate greps a fixed list
of words: **a name nobody adds is a name the gate cannot see, and it returns clean on a real leak.**

**Adding the word is not the step. Proving the pattern matches the name as spelled is.** A term can
sit on the list for weeks and still fail to match the directory it names — **a `\b` boundary does
not exist between a letter and a digit**, so a name ending in a version number escapes a bare word
match.

```bash
# `bash <script>`, never `./<script>` — the execute bit is not part of the check, and a
# sync or a checkout that drops it turns a working script into "Permission denied".
bash tools/denylist-coverage.sh --denylist <the instance's> --projects <its projects root>
```

**Empty is the only passing result**, and **exit 2 means the check did not run — which is not a
pass.** Then plant the new name into a tracked file and watch `tools/gate.sh` block it. ⚠️ **The two
are not the same test and neither substitutes for the other:** coverage asks whether the gate *can*
see the name, the plant asks whether it *does*.

**7. Register the project in the compass.** One row, **edges not nodes**: the compass points at
where the work is described and describes none of it (`METHOD.md` §2). **A new cartridge does not
take the `▶` by arriving** — exactly one active front exists across every project, and moving it is
the operator's act. Anything this structuring turns up that is not this task leaves with a
destination from the closed vocabulary, one line, **with `project:` filled in** (`MLabs:AX-25`).

## ⚠️ The live set stays central

**Which live artefacts are central and which Records stay with their project is `METHOD.md` §5's.**
⛔ **Creating a per-project copy of one is the single most likely failure of this procedure**, and it
fails twice over: the copy is a duplicate with no declared winner (`MLabs:AX-20`), and **its entries
are invisible to the `project:` filter that is the whole point of centralising.** Prediction 2
checks it mechanically, and is worth running even when one agent wrote the cartridge in a single
pass.

## Placing the project's first rules

**The placement test is `METHOD.md` §6's**, and **placing a rule is the case that loads all three
departments whole** — so run it with all three open.

## Verification — stated as a prediction, then run

Write the predictions **before** running anything; the executor returns the real output and **the
gap is the finding** (`MLabs:AX-14`). **Plant one fault and confirm each check catches it before
trusting a clean run** (`MLabs:AX-7`).

| # | Prediction |
|---|---|
| 1 | Listing the cartridge returns **step 1's four files**, plus `architecture.md` and `skills/` only where they have content, plus the agent contract only where step 6 leaves it there |
| 2 | Searching the cartridge for the central queue and park filenames returns **nothing** |
| 3 | Searching the cartridge for template placeholders returns **nothing** |
| 4 | `architecture.md` holds ≥ 1 axiom; every one is bare, every foreign rule cited in it is anchored |
| 5 | `Decision_Log.md` holds ≥ 1 entry, and its header states the field contract |
| 6 | The compass holds exactly one `▶` across every project, and a row naming this one |
| 7 | Every new queue or park entry carries `project:` — entry count and `project:` count match |
| 8 | The agent contract sits at the code repository root **iff** the operator owns it; otherwise in the cartridge and nowhere else |
| **9** | **The denylist coverage check returns empty**, and the new name, planted into a tracked file, makes the release gate fire. **A name added and never tested is a name that may still be invisible** |

**An unrunnable check is reported unrun** (`MLabs:AX-22`).

## What it does not do

- **Create anything central.** It writes into the existing central set; it never creates a second one.
- **Hire the project's auditor** — its own act, under `MLabs:AX-11`, with the dismissal criterion
  fixed before the first firing.
- **Touch a repository the operator does not own** (`MLabs:AX-19`).
- **Set the active front.** It adds the row; the operator moves the `▶`.
- **Amend the company or instance axiom files.** A rule that fails the project test is **proposed
  upward, never written upward.**
