---
name: build-nexus
description: Creates an operations centre from nothing and walks its owner to a first task in flight — invoke on a machine that has cloned MLabs and has no instance yet, or to repair a tree whose base files were never generated; it builds in three separable layers and writes an empty instance, never a copy of an existing one.
---

> **Version:** MLabs 1.1.0

# build-nexus

**The first thing that runs, and the reason the rest can be audited.** Every other skill names files
it expects to exist — a mailbox, a compass, a live plan, a coherence check — and until now nothing
created them. A skill whose verification points at a file nobody generated is the class this company
has found eight times: **a published check that cannot run.** This builds the tree those checks
point at, so they resolve **without any skill knowing which machine it is on** *(the operator,
2026-08-20: "así el auditor encuentra ya los archivos que quiera de forma desacoplada")*.

⚠️ **`AGENTS.md` §3 lists this skill last, under the name `nexus-builder`, and the reason it was
last is now spent.** It was deferred because *"it encodes the shape of an instance, so building it
before the shape stops moving means building it twice."* The shape stopped moving: six document
kinds, the block model, the plan lifecycle, and the rule/skill/role split are all written down.
**The §3 row is renamed to `build-nexus` in the same act** — a verb and its object, like every other
skill here.

## Fires when

- A machine has MLabs and no instance. **This is the normal case and the one the whole design is
  for**: a stranger with a clone and nothing else.
- A tree exists but a base file named by a rule was never generated. **Layer 1 is idempotent**, so
  running it against a live instance repairs the gap and touches nothing that already holds content.

⚠️ **It never fires to move an instance.** Copying an operations centre from one machine to another
is not this skill and is not any skill: it is a repository, and repositories are cloned. **What this
builds is empty**, and that is the point — the test *does the machine build one* is not the test
*does this one move*.

## Reads, in this order

1. **`METHOD.md` §1** — the six document kinds. The tree is derived from the kinds, never from a
   remembered list of filenames.
2. **`layout.md`, beside this file** — the default tree, as data, with its roots as parameters.
   It is the one file in the public set permitted to spell those roots.
3. **Nothing else, in layer 1.** Layer 1 must run on a machine holding only a clone.

## Procedure — three layers, and each one runs alone

**A builder that only works end to end cannot be debugged and cannot be resumed by someone who
stopped halfway.** Each layer takes the previous layer's output and is invoked separately.

### Layer 1 · the skeleton — no reading of the machine

Create the tree from `layout.md`, every file with its **kind declared in its own header** and its
contract written, and **nothing invented as content**. A queue is created empty; a Record is created
with its field contract and no rows; a Compass is created with one `▶` row pointing at *set your
first front*.

⚠️ **A placeholder that survives the build is a defect, not a to-do** (`structure-project`'s rule,
and it applies harder here because nobody reviews a tree they did not write). Either the file
carries its real contract or it is not created.

**`coherence.py` is generated here**, and it ships **refusing to pass**: with no domains configured
it exits **2 — *could not run, which is NOT a pass*** — the same contract `tools/gate.sh` states in
its own header. ⚠️ **A generated checker that returns 0 over zero files is worse than no checker**:
it makes two invariants pass vacuously, which is precisely the defect class this skill exists to
close. **It must be configured before it can succeed, and it says so.**

### Layer 2 · the survey — read-only, and it reports before it writes

Read what is already on the machine and map it: existing project folders, existing notes, an
existing repository. **This is the layer that makes it build itself rather than be filled in by
hand**, and the only one that touches anything pre-existing.

⚠️ **It writes nothing until it has printed what it found and been told to continue.** A builder
that surveys and acts in one step is indistinguishable, from the outside, from a builder that
guessed.

### Layer 3 · the adapter — generated, never hand-written

Emit the adapter the interface is handed at startup, derived from layer 2. **The engine learns the
instance's shape only here** (`interface:AX-1`), and *which panels exist* is adapter configuration
rather than engine code — so a second operator changes their adapter and never forks `app.js`.

### Then: one task in flight

The build is not finished when the tree exists. It ends with **a first front on the compass, a first
live plan, and one thing to do** — because an operations centre with nothing in it teaches its owner
nothing, and the first honest test of any of this is whether they come back to it.

## The one exemption, and why it is one file instead of many

`layout.md` declares the conventional roots — the operations centre's, the projects', the knowledge
domains' — which **gate check 2 forbids naming in the public set**, correctly, since that is how a
program ends up running on exactly one machine. **Three lines carry `gate:allow`, one per root**, and
all three are printed on every gate run.

⚠️ **The first draft spelled the root on all twenty-two rows and the gate printed all twenty-two.**
That is its own failure — *an exemption list too long to read is the same hole as an exemption you
cannot see* — and fixing it was not tidying: parameterising the roots made them **a value rather
than a spelling**, which is what they should have been. **The gate did not just permit the design;
it corrected it.**

⚠️ **Concentrating the exemption is the point.** The alternative is what exists today: the same
knowledge scattered as prose through several skills, where two `gate:allow` lines already sit in
`tools/install-skills.sh` for exactly this reason. **One file that declares the default layout is
auditable; the same fact in six files is not**, and those two existing exemptions should point here
rather than repeat it.

⚠️ **And it is a *default*, not a truth.** An instance that has moved its folders says so in its
binding, and layer 3 reads the binding. `layout.md` is what a machine with no binding starts from.

## Verification, stated as a prediction

1. **On a clone with no instance:** layer 1 produces a tree in which **every file named by any rule
   in `METHOD.md` §1 exists**, and `parse.py` over the generated adapter reports **`problems: []`**.
   ⚠️ **A build that renders but reports problems has failed** — *it mostly worked* is the answer
   this method exists to refuse.
2. **`coherence.py` exits 2**, not 0, before it is configured. If it exits 0 on an empty tree, the
   generated checker is the vacuous-pass defect and the build is worse than not running.
3. **Run twice, the second run changes nothing** — `git status` clean after the second pass. A
   builder that is not idempotent cannot be used to repair.
4. **Nothing of another instance appears.** `tools/gate.sh` over the new tree, with that instance's
   own denylist, returns clean; and the operator's names do not appear anywhere in it.
5. **The cockpit renders a different set of panels than the machine it was built from**, driven only
   by its adapter, **with no edit under `interface/`**. If matching another cockpit needs a code
   edit, base and custom are still one thing — which is a real result, and a negative one.

## What this does not do

- **It does not copy.** Not an instance, not a project, not a note.
- **It does not decide what the instance is for.** `PURPOSE.md` is created with its contract and
  left for its owner: a purpose written by a builder is the validation `PHILOSOPHY.md` refuses.
- **It does not commit**, and it does not add anything to git. What becomes tracked is a decision
  with a gate in front of it.
- **It does not open projects.** That is `structure-project`, invoked once there is something to
  open.

## Retirement

**When a fresh clone needs no procedure** — when the tree is a template a `git clone` already
carries. Until then the skill is the template (`AX-26`), and the day it can be replaced by files is
the day it should be. ⚠️ **Its other end:** if layer 2 stops finding anything to survey because
instances are always built empty and filled by hand, the layer is dead weight and goes, whatever the
skill's overall usefulness.
