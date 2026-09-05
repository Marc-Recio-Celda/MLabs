# layout — the default tree, as data

> **Read by `build-nexus` layer 1, and by nothing else.** This is the **only file that names the
> conventional roots**, and it names each **once**, so the gate prints four lines rather than one for
> every path.
>
> ⚠️ **The exemption is concentrated here on purpose.** The same knowledge is otherwise scattered as
> prose across several skills, and `tools/install-skills.sh` already carries two `gate:allow` lines
> for the same reason. **One file declaring the default layout is auditable; the same fact in six
> files is not** — and an exemption you can list is a debt, while one you cannot see is a hole.
>
> ⚠️ **It is a DEFAULT, not a truth.** An instance that has moved its folders says so in its binding,
> and layer 3 reads the binding. This is what a machine with **no** binding starts from.

## The four roots, named once

⚠️ **`CENTRE` was missing until 2026-09-05 and its absence was a real defect, reported by an
operator who ran the builder:** *"actualmente build-nexus no crea los documentos dentro de una
carpeta de nexus, y solo genera la carpeta 98 y 99."* The file parameterised what goes **inside** the
operations centre and never named **the centre itself**, so a builder standing anywhere created
`98_` and `99_` loose in that directory. ⛔ **A layout that names every child and not the parent is
not a layout**, and every path below is now anchored.

```
CENTRE = NEXUS        # the conventional root of the operations centre
SYS    = 99_SYSTEM    # the system folder
PROJ   = 98_PROJECTS  # gate:allow the projects root — the ONE name still exempted, because what
#                       is under it is the operator's own work and the gate forbids naming it
IDX    = 00_INDEXES   # the router
DOM    = 01_ .. 08_   # the knowledge domains, and they are optional
```

⚠️ **Three of these five stopped needing an exemption on 2026-09-05.** The gate used to forbid
naming *anything* below an instance's root, so this file carried four `gate:allow` lines and every
skill that wanted to say where the mailbox lives had to paraphrase instead. **The line moved to where
the machine-specific part actually is:** the system folder and the knowledge domains are the same on
every instance built from this method and may be named; `$PROJ` holds one person's projects and may
not. ⛔ **`$PROJ` keeps its exemption and this file is the only place it is spelled.**

## Where every path below starts

⛔ **Every path is relative to `$CENTRE/`, which the builder creates.** Where `$CENTRE` itself sits —
beside the method repository or inside it — **is the owner's choice and the binding records it**;
the builder asks once and never guesses. ⚠️ **Both arrangements are live today**, which is why this
is a question and not a default: the reference instance keeps `$CENTRE` inside the method
repository's working tree, untracked by it, and the layout must not contradict a tree that works.

## The tree

Each line names a path **under a root above** and the **kind** (`METHOD.md` §1) of what is created
there. The kind is the contract; the filename is a convention this file declares.

```
# ── the operations centre ────────────────────────────────────────────────────
$CENTRE/                       —          created FIRST. Everything below is inside it
$CENTRE/AGENTS.md              Standing   the binding — the one file naming the method repository
$CENTRE/CLAUDE.md              Standing   four lines; its body is `@AGENTS.md`
$SYS/PURPOSE.md                Standing   what this instance is for, and what it refuses — created
#                                         with its contract and LEFT EMPTY for its owner. ⚠️ Its
#                                         absence was reported by a new operator as the first thing
#                                         they missed: a tree with no statement of purpose gives a
#                                         cold reader nothing to decide with
$SYS/AXIOMS.md                 Standing   the instance's own axiom department
$SYS/COMPASS.md                Compass    one ▶, seeded with *set your first front*
$SYS/PLAN.md                   Live plan  the active plan, or the id of it
$SYS/notebook/README.md        Standing   the capture contract: one line, four outcomes, the link
$SYS/notebook/agents.md        Queue      what an agent crossed (AX-25). Created empty
$SYS/notebook/<owner>.md       Queue      the operator's sheet, named by them. Created empty
$SYS/MAILBOX.md                Queue      agent → operator, and NOT a human entry point
$SYS/TASKS.md                  Queue      produced by triage, never typed
$SYS/IDEAS.md                  Park       deliberately not doing, with the reason
$SYS/LOG_METHOD.md             Record     decisions about the method
$SYS/LOG_AGENTS.md             Record     what each agent did, per round
$SYS/LOG_WORK.md               Record     what the operator delivered
$SYS/LOG_EXTERNAL.md           Record     defects found in code the operator does not own
$SYS/logs/README.md            Standing   the employee-log contract and the weights
$SYS/logs/                     —          one Record per role, created when the role is
$SYS/data/SCHEMA.md            Standing   the field contract for the record store
$SYS/scripts/metrics.py        —          the numbers, computed and never transcribed ⚠️ debt, below
$SYS/scripts/coherence.py      —          the vault check. Ships exiting 2 — see below
$SYS/denylist.txt              Standing   HARD · SOFT · SIGNATURE. Created EMPTY
$SYS/interface.json            —          the adapter, generated by layer 3
# ⚠️ FLOW.md and METHOD.md are NOT created here — they ship with the method, at its root.
# An instance that writes its own has a flow no method file describes.
# ⚠️ FAST-TASKS.md is NOT created — retired 2026-09-05 into $SYS/notebook/ (M-134).
# ── projects ─────────────────────────────────────────────────────────────────
$PROJ/                         —          one folder per project
$PROJ/[<owner>/]<project>/     —          the grouping level is optional and is the owner's call
$PROJ/…/<project>/nexus/       —          ⛔ CREATED WITH THE PROJECT, ALWAYS. See below
$PROJ/_example/nexus/          —          ⛔ ONE worked-through example project, every file present
#                                         and EMPTY under its own contract. See *the examples*
# ── the router and the knowledge, and one domain is built ────────────────────
$IDX/00_ROUTER.md              Standing   where each domain begins and what it holds
$DOM/_example/                 —          ⛔ ONE domain with the note shapes, empty:
#                                         `_Protocol-*` · `_Summary-*` · `Introduction-*` · a note
```

## The examples — one project and one domain, every file present and empty

*(the operator, 2026-09-05: "debería crearse 00, 01 con un ejemplo de notas de temario vacías
—protocolo, resumen, notas etc—, 98 con un ejemplo de proyecto y sus archivos vacíos, y 99 con las
cosas necesarias de sistema")*

⚠️ **This is the difference between a skeleton and a thing a stranger can use, and the evidence is a
person.** A new operator ran the builder, got numbered folders and no idea what went in them, and the
first thing they went looking for was a file that had not been created. **An empty tree teaches
nothing about its own shape; one worked example teaches all of it**, and it costs two folders.

| | What is created | Why an example and not a README |
|---|---|---|
| `$PROJ/_example/nexus/` | **every cartridge file, present and empty under its own contract** — the definition, the rules, the decision record, the plan, the log | A README describes the shape; the example **is** the shape, so a reader copies it instead of interpreting a description of it |
| `$DOM/_example/` | **the note shapes, empty**: a `_Protocol-*`, a `_Summary-*`, an `Introduction-*` and one ordinary note | The reading order is the whole convention, and it is invisible in prose and obvious in a folder |
| `$IDX/00_ROUTER.md` | where each domain begins and what it holds | Without it the numbered folders are numbers |

⛔ **Empty means empty of content and full of contract.** Every example file carries its kind, its
header and what it is for — and **nothing invented as content**. A placeholder that survives the
build is a defect, and here it is worse than elsewhere: the example is the thing being copied, so a
placeholder in it propagates into every project the owner ever opens.

⛔ **`_example` is deleted by its owner, not by the builder**, and the leading underscore is what
keeps it out of every glob that enumerates real projects and real domains. ⚠️ **Check that**: the
project glob and `metrics.py` both skip names beginning `_`, and the template already relies on it.

## `<project>/nexus/` is created with the project, and this was the second reported defect

*"dentro de 98 los proyectos no se crean con la carpeta nexus donde se almacenarán sus archivos"* —
the same operator, the same run.

⚠️ **`structure-project` states the rule and states it once, in its preamble**: *"every file below
goes in the project's `nexus/` folder."* It is never repeated at the step that writes the files, so a
model working step by step writes them one level up and violates a rule it read four screens
earlier. ⛔ **A constraint stated in a preamble and absent from the step it constrains is a
convention, not a rule** — this is the same shape as every *published check that cannot match* in
this company's log, and the fix is the same: put it where it fires.

**So: the folder is part of creating the project, not part of filling it.** A project directory with
no `nexus/` is an incomplete creation and the builder reports it, whichever skill made it.

## Three files whose creation is a decision, not a default

- **`denylist.txt` is created EMPTY, and the gate refuses to pass on an empty denylist.** That is
  deliberate: **a list of the owner's own private names cannot be guessed**, and a builder that
  seeded it with plausible entries would produce a gate that looks armed and is not. ⚠️ The first
  release cut fails until the owner fills it. **That failure is the feature.** ✅ What the clone does
  carry is the check that keeps it current — `tools/denylist-coverage.sh`, which compares the gate's
  own pattern against the names on disk. The list is the owner's; keeping it from going stale is the
  method's.

- **`metrics.py` is generated here and should not be** *(declared debt)*. Its logic is the six
  document kinds and the log contracts — both the method's — and only its paths are the instance's.
  A builder that emits a copy per instance produces **a different measuring stick per operator**,
  which is the one thing a measurement tool must never be. ⚠️ **And the copies have already
  diverged**: its project branch matches single literal spaces, so a column-aligned axiom table reads
  29 rows of 34 while its company branch, which uses `\s*`, reads all 34.

- **`coherence.py` ships exiting `2` — *could not run, which is NOT a pass*** — the contract
  `tools/gate.sh` states in its own header. With no domains configured it must not return 0.
  ⚠️ **Two instance invariants name this file**, and a generated checker returning 0 over zero files
  would make both pass vacuously: the exact defect class the builder exists to close, committed by
  the builder.

- **`AGENTS.md` is the binding and is the ONE file that resolves the method to an address.**
  Everything else reaches it through the binding, by scope prefix. ⚠️ **A second file holding the
  path is a second place to edit the day the method moves**, and the one that gets missed is the one
  an agent reads. **It also records which skills this instance has overridden** — see the tutorial.

⚠️ **The tree above is the whole answer.** A file not on it is not created — there is no second list
of deliberate omissions, because a list of absences grows with every layout this method has ever
abandoned and is never once read by the builder *(the operator: "¿para qué especificar lo que no
crea? Simplemente di lo que crea")*.
