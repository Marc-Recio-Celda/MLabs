---
name: build-nexus
description: Builds an operations centre from nothing and then walks its owner through the reference structure block by block, letting them adopt, adapt or skip each piece — invoke on a machine that has cloned the method and has no instance yet, or to repair a tree whose base files were never generated. It writes an empty instance, never a copy of an existing one.
---

# build-nexus

**The first thing that runs, and the reason the rest can be audited.** Every other skill names files
it expects to exist — a mailbox, a compass, a live plan, a notebook, a coherence check — and until
this ran, nothing created them. A skill whose verification points at a file nobody generated is the
class this company has found more than a dozen times: **a published check that cannot run.**

⚠️ **What this skill sells is structure, and the buyer chooses which parts they take.** That is a
change of stance made 2026-09-05 and it goes the opposite way from the obvious one: **the method
stops trying to be generic.** Skills may name the reference instance's actual documents, in the
reference instance's actual words, because *the tutorial is where a different owner gets them
rewritten*. Generalising every skill until it fits everyone produced skills that fit nobody, and it
cost the concreteness that made them work.

⚠️ **This skill encodes the shape of an instance**, so it is rewritten whenever that shape moves —
the six document kinds, the block model, the plan lifecycle, the capture layer.

## Occasion
- A machine has the method and no instance. **This is the normal case and the one the whole design
  is for**: a stranger with a clone and nothing else.
- A tree exists but a base file named by a rule was never generated. **Layer 1 is idempotent**, so
  running it against a live instance repairs the gap and touches nothing that already holds content.

⚠️ **It never fires to move an instance.** Copying an operations centre from one machine to another
is not this skill and is not any skill: it is a repository, and repositories are cloned. **What this
builds is empty**, and that is the point — *does the machine build one* is not *does this one move*.

## Reads, in this order

1. **`METHOD.md` §1** — the six document kinds. The tree is derived from the kinds, never from a
   remembered list of filenames.
2. **`layout.md`, beside this file** — the default tree, as data, with its roots as parameters. It
   is the one file in the public set permitted to spell those roots.
3. **Nothing else, in layer 1.** Layer 1 must run on a machine holding only a clone.

## Procedure — three layers and a tutorial, and each one runs alone

**A builder that only works end to end cannot be debugged and cannot be resumed by someone who
stopped halfway.** Each stage takes the previous one's output and is invoked separately.

### Layer 1 · the skeleton — no reading of the machine

⛔ **Ask one question before writing anything: where does the operations centre go?** Beside the
method repository, or inside its working tree untracked by it. **Both are live arrangements and the
binding records the answer.** ⚠️ **Create `$CENTRE/` first and every path under it** — a builder that
creates `98_` and `99_` in whatever directory it happens to stand in has produced a tree no rule
describes, and that is a reported defect, not a hypothetical.

Then create the tree from `layout.md`, every file with **its kind declared in its own header** and
its contract written, and **nothing invented as content**. A queue is created empty; a Record is
created with its field contract and no rows; a Compass is created with one `▶` reading *set your
first front*.

⚠️ **A placeholder that survives the build is a defect, not a to-do**, and it applies harder here
than anywhere: nobody reviews a tree they did not write. Either the file carries its real contract or
it is not created.

**`coherence.py` is generated here**, and it ships **refusing to pass**: with no domains configured
it exits **2 — *could not run, which is NOT a pass*** — the contract `tools/gate.sh` states in its
own header. ⚠️ **A generated checker that returns 0 over zero files is worse than no checker**: it
makes two invariants pass vacuously, which is exactly the defect class this skill exists to close.

### Layer 2 · the survey — read-only, and it reports before it writes

Read what is already on the machine and map it: existing project folders, existing notes, an existing
repository. **This is the layer that makes it build itself rather than be filled in by hand**, and
the only one that touches anything pre-existing.

⚠️ **It writes nothing until it has printed what it found and been told to continue.** A builder that
surveys and acts in one step is indistinguishable, from outside, from a builder that guessed.

### Layer 3 · the adapter — generated, never hand-written

Emit the adapter the interface is handed at startup, derived from layer 2. **The engine learns the
instance's shape only here**, and *which panels exist* is adapter configuration rather than engine
code — so a second operator changes their adapter and never forks the front end.

---

## The tutorial — the part that makes it structure rather than a copy

**Layer 1 gives them a skeleton. The tutorial gives them the reference structure, block by block,
and three doors at each one.** It is a conversation, not a script, and it never runs unasked.

For each block — the capture layer, the queues, the boards, the decision record, the axiom
department, the project cartridge, the knowledge vault, the auditors — say **what it is, what it
costs to keep, and what breaks without it**, and then:

| Door | What happens | What it costs them |
|---|---|---|
| **Adopt** | the reference document is created by the skill that owns it | nothing — it is already written |
| **Adapt** | **they edit the skill**, in their own clone, to name their documents instead | one conversation, once |
| **Skip** | nothing is created, and the skills that name it are told so | the checks that read it report **unconfigured**, never *pass* |

⚠️ **Adapt means they edit their own files, and there is no machinery behind it** *(the operator,
2026-09-05: "¿para qué se le va a generar una copia? el usuario puede editar sus propios archivos")*.
**Their clone is theirs.** A derived-skill layer with an override registry was designed and thrown
out the same day: it invented a second place a skill could live, a rule about which one wins, and a
check to enforce the rule — **three mechanisms to avoid one `git` edit that git already handles.**
⛔ **What the tutorial owes them is the conversation, not a copy**: what this block is for, what
breaks without it, and which lines of the skill to change. A user who diverges holds a fork, which is
what a fork is for.

⛔ **Skip is a first-class answer and must not degrade into a silent pass.** A block nobody took
leaves its checks reporting *not configured* — exit 2, the same contract as everywhere else. **An
instance that skipped the vault and gets a green coherence check has been lied to by its own
builder.**

⚠️ **The tutorial is also how the reference instance stays honest.** Every block it cannot explain in
terms of *what breaks without it* is a block that should not be sold — and finding one is a finding
about the method, filed like any other.

### Then: one task in flight

The build is not finished when the tree exists. It ends with **a first front on the compass, a first
live plan, and one thing to do** — because an operations centre with nothing in it teaches its owner
nothing, and the first honest test of any of this is whether they come back to it.

---

## The one exemption, and why it is one file instead of many

`layout.md` declares the conventional roots — the centre's, the system's, the projects', the
knowledge domains' — which gate check 2 forbids naming in the public set, correctly, since that is
how a program ends up running on exactly one machine. **Four lines carry `gate:allow`, one per
root**, and all four are printed on every gate run.

⚠️ **The first draft spelled the root on all twenty-two rows and the gate printed all twenty-two.**
*An exemption list too long to read is the same hole as an exemption you cannot see* — and fixing it
was not tidying: parameterising the roots made them **a value rather than a spelling**, which is what
they should always have been. **The gate did not just permit the design; it corrected it.**

## Verification, stated as a prediction

1. **On a clone with no instance:** layer 1 produces a tree in which **every file named by any rule
   in `METHOD.md` §1 exists, all of it inside `$CENTRE/`**, and `parse.py` over the generated adapter
   reports **`problems: []`**. ⚠️ **A build that renders but reports problems has failed.**
2. **The container exists and nothing landed beside it.** `ls` at the build directory shows
   `$CENTRE/` and **neither `$SYS` nor `$PROJ` loose**. ⚠️ **Plant it**: run the builder from a
   directory that already holds a stray `$SYS` and confirm it reports rather than merges.
3. **Every project folder has a `nexus/`.** `find $PROJ -mindepth 1 -maxdepth 3 -type d` — every
   leaf project directory contains one, or the builder names the ones that do not.
4. **`coherence.py` exits 2**, not 0, before it is configured. If it exits 0 on an empty tree the
   generated checker is the vacuous-pass defect and the build is worse than not running.
5. **Run twice, the second run changes nothing** — `git status` clean after the second pass. A
   builder that is not idempotent cannot be used to repair.
6. **Nothing of another instance appears.** `tools/gate.sh` over the new tree, with that instance's
   own denylist, returns clean, and the reference operator's names appear nowhere in it.
7. **After the tutorial, a skipped block reports *unconfigured* and not *pass*.** ⚠️ **Plant it**:
   skip the knowledge vault, then run the coherence check and confirm it exits 2. A green check over
   a block the owner declined is the builder lying about the tree it just made.

## What this does not do

- **It does not copy.** Not an instance, not a project, not a note.
- **It does not decide what the instance is for.** `PURPOSE.md` is created with its contract and left
  empty: a purpose written by a builder is the validation `PHILOSOPHY.md` refuses. ⚠️ **Creating it
  empty is not the same as not creating it** — a new operator reported the missing file as the first
  thing they went looking for.
- **It does not commit**, and it adds nothing to git. What becomes tracked is a decision with a gate
  in front of it.
- **It does not open projects.** That is `structure-project`. **It does check that every project
  folder has its `nexus/`**, because a missing cartridge folder is a broken tree whoever made it.

## Retirement

**When a fresh clone needs no procedure** — when the tree is a template a `git clone` already
carries. Until then the skill is the template, and the day it can be replaced by files is the day it
should be. ⚠️ **Its other end:** if layer 2 stops finding anything to survey because instances are
always built empty and filled by hand, the layer is dead weight and goes, whatever the skill's
overall usefulness. ⚠️ **And a third:** if every tutorial conversation ends in *adopt* for every block, the three doors
are theatre and the tutorial is a README.
