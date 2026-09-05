# The entry grammar

> **What an entity is, in the markdown an operations centre already keeps.** This is the contract
> between the files and every view built on them. It is deliberately **descriptive of files that
> exist** rather than a syntax invented for a program: a grammar that today's files mostly fail is
> a grammar nobody will keep.
>
> **It was written after the parser, from what the parser found** — the other order produces rules
> that fit the author's memory of the files instead of the files.

## Two rules that are not negotiable

**Fields are read by name, never by position.** A positional reader returns the wrong field the
moment a column is added, and returns it *silently*. That cost five findings in one day, in one
instance, and it is why every table here is keyed by its header row.

**Nothing is skipped.** An entry that cannot be placed is reported with its file and line. A parser
that drops what it does not understand turns a lossless record into a lossy one without saying so —
which is the one thing this whole system exists to prevent.

> ⛔ **The id grammar is spelled once and every site imports it.** Four copies is how a sub-block
> with a letter suffix matches nothing and vanishes **while `Nothing unplaceable.` prints
> underneath** — a silent drop, which is the one failure a parser must never have.
>
> ⚠️ **Reporting was the easy half.** The first attempt reported *nineteen* rows from neighbouring
> tables and one correct heading in a real file — and **a check that cries wolf gets deleted**, which
> would have left this rule with no implementation at all. So the parser now distinguishes an entry
> that **tried to be an id and failed** (letters then a digit; a heading with its separator) from
> text that was never an id. **The line between *unplaceable* and *not an entry* is part of the rule,
> not an implementation detail** — without it, obeying rule 2 makes the output unreadable.

## Inheritance — a fact is written once

| Entity | Gets its project from |
|---|---|
| mailbox entry · task | **its own header.** Required; nothing else can infer it |
| idea | its own text, else **its section heading** |
| front | its board section heading. The summary table's rows are cross-project and carry none |
| plan item | the plan's `**project:**` header — a plan holds one task |
| project state | **its folder.** Repeating it inside would be a second place for one fact to be wrong |

## The kinds

### `queue` — mailbox entry
```
### [state] → destination · project: <name|cross> — title · (author, YYYY-MM-DD)
**Serves**  the objective it serves
**What**    what is happening, in prose
**Asks**    what judgement it is asking the operator for
**Affects** what moves if it moves

…anything else stays as prose, and is returned as `prose`.
```
`state` ∈ open · pending · resolved · archived. `destination` from the closed vocabulary.

**The four fields are `AX-46`'s**, and an entry that is `open` or `pending` and lacks one is
**named** — never counted, because *four are short* does not say which four. A closed entry is not
asked for them: nobody is going to act on it. ⚠️ **The names are not the wall's** and that is
deliberate: an entry arrives **to be routed**, not committed, so `Sheet` and *committed* mean
nothing yet — and **`Asks` is the field that separates an entry from a task.**

⚠️ **An entry written before this contract still parses.** Its four fields come back empty, its body
comes back whole as `prose`, and the reader is told what is missing. A contract that stops reading
what is already written does not get adopted.

### `compass` — the wall
```
### <marker> `<project>` · <title>
**Serves** the objective it serves · **Sheet** `<plan id>`
**Why it is committed** what is happening, in prose
**What it affects** what moves if it moves
**Drains** <the queue this task drains, if it drains one>
```
`marker` ∈ ▶ active · ⏸ paused · ⬜ pending · ✅ done · ✖ cancelled. A `## Bin` heading puts every
task below it in the bin — terminal, and **marked as which**.

**Three of the four are required** (`Serves`, `Why it is committed`, `What it affects`) and each
missing one is named. `Sheet` is a join key and `Drains` is optional: **a task that drains nothing
has nothing to declare**, and where it is present the view can check `FLOW.md`'s rule that a
drain's state is derived from its count rather than chosen.

⛔ **The marker comes first because it is the one field a reader scans for**, and the one a pattern
can anchor on without knowing anything else about the line.

⚠️ **The wall's entities are emitted as `front`, not `task`.** The panel that renders them has
always called them fronts, and a vocabulary the model prefers is not worth a view that renders
nothing. `state`, `marker`, `serves`, `why`, `affects` and `sheet` ride alongside for whoever
wants the newer words.

### `queue` — task
```
### T<n> · title <status>
**project:** `<name>`
**Why** *(author, YYYY-MM-DD)*. …
```
`status` ∈ ⬜ 🔨 ⛔ 🔴 ✅. **`project:` is required** — ⚠️ **an entry can lack it for
months without anyone noticing, because nothing reads a field no check counts.**

### `park` — idea
```
- **title** — body…
```
Project and scope from the bullet, else from the section heading.

### `compass` — front, the older table shape
Read only when the file holds no wall blocks. ⛔ **A file that calls itself a wall and parses as
zero tasks is broken, not a table** — without that distinction, dropping the markers turns a
seven-task board into a two-row table and reports clean.

Summary table: `| marker | name | described in | moves when |`, marker ∈ ▶ ⏸ ? or a rank.
**Exactly one `▶` across the file**; the parser reports the count when it is not one.
Board tables: `| Front | Waits on | Note |`, under a `### \`project\`` heading.

### `plan` — plan item
```
<n>. text                          — pending
<n>. ~~text~~ <destination>        — struck, and a destination is REQUIRED
```
A struck item with no destination is reported as **a failed close**, which is what the method's
close rule calls it.

### `standing` — project state
A blockquote of `**Field:** value` after the title. **Required: `Last updated`, `Next action`.**

## What this grammar does not do

It does not parse note content, decision logs or agent logs — those are `record`, and a record is
read by a human or by a purpose-built script, not by the view layer. It does not validate
destinations against the closed vocabulary yet. And it does not invent an `id` for entries that
have none: a mailbox entry is identified by file and line until the files give it better.
