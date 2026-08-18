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
```
`state` ∈ open · pending · resolved · archived. `destination` from the closed vocabulary.

### `queue` — task
```
### T<n> · title <status>
**project:** `<name>`
**Why** *(author, YYYY-MM-DD)*. …
```
`status` ∈ ⬜ 🔨 ⛔ 🔴 ✅. **`project:` is required** — three tasks lacked it until 2026-08-18,
carried over from the pre-split list and never noticed, because nothing read them.

### `park` — idea
```
- **title** — body…
```
Project and scope from the bullet, else from the section heading.

### `compass` — front
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
