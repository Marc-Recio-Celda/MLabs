---
name: create-note
description: Writes and edits every note in the instance's knowledge vault and nothing else does; fires when the operator asks for a new note or a change to an existing one, hands over a course syllabus to ingest, asks for a sub-domain's scaffolding, or wants something learned from their own working experience turned into vault theory.
---

# create-note

## Occasion
The operator names a note, hands over a syllabus, asks for scaffolding, or has something from their
own work to condense. **The one door into the knowledge domains** (`NEXUS:AX-4`): no other skill, no
sweep, no script completing the structure, no agent acting on its own reading of what is missing. The
operator's working experience enters through this same door — what they learned on a project becomes
a note by this procedure, under the same standard and the same gates as a syllabus block. Those notes
are 🔴: the write is authorised per change (`NEXUS:AX-3`) and the commit message names `create-note`.

## Read first, in this order

1. **The Router** — the vault's index of indexes, reached at the path the binding declares — and in
   it **only** the *Loading Protocol* row for the target domain.
2. **The domain index that row names**, and nothing from any other domain.
3. **The Router's bridge table for the pair**, when the note crosses domains.

⚠️ **No filename appears above, and that is the rule rather than the style.** A skill that spells
the vault's own files runs on exactly one machine and publishes that machine's shape (`MLabs:AX-1`).
**The Router is reached through the binding; every index is reached through the Router.** This skill
knows the two hops and neither path.

Anything opened beyond that is declared, and the declaration is logged as a defect in the Router
(`MLabs:AX-21`). A domain with no index takes no notes until it has one (`NEXUS:AX-8`) — say so
and stop.

## Procedure

### Phase 1 — Attachment (a syllabus; a single named note skips to Phase 3)

1. Read the syllabus whole and list its knowledge blocks.
2. Classify each against the domain index: **already covered** → one line to
   the instance mailbox for the audit, never rewritten here · **extends** a sub-domain → new
   note · **new coherent body** → propose a sub-domain, a domain only for a whole field.
3. Output `block → domain/sub-domain → extend | create | exists`. **Gate: the operator approves.**

### Phase 2 — Structure

4. Propose the note list with hierarchical numeric prefixes, the sub-domain's scaffolding
   (`Introduction-[dom].md`, `_Protocol-[dom].md`, `_Summary-[dom].md`), and each topic's home.
5. Mark each note's `type/` (step 10) — it fixes the code policy — and sketch its internal links
   and cross-domain bridges. **Gate: the operator approves before any write.**

### Phase 3 — Write, one note per turn (`continue` takes the next)

6. **Placement.** Content notes sit flat in `<sub-domain>/Phases-[dom]/`; scaffolding at the
   sub-domain root, **one set per sub-domain, not per phase**. ⚠️ **A domain the index marks *flat*
   takes no scaffolding at all** — the index says which, and a skill that remembers which is a skill
   that is wrong the first time a domain changes shape.
7. **Numbering.** Take the next free prefix in that folder. The prefix orders, the alias
   addresses, nothing already numbered moves (`NEXUS:AX-5`).
8. **Frontmatter**, four keys, this order (`NEXUS:AX-6` — written whole, key order preserved):
```yaml
---
tags:
  - type/[concept|maths|algorithm|engineering|tool]
  - domain/[dom]
  - [subtopic]
aliases:
  - [name without prefix, then synonyms]
status: complete
audit: ok
---
```
`type/algorithm` adds `library` and `class`. Scaffolding carries `type/protocol`,
`type/summary`, `type/intro`.

⚠️ **The vocabulary is English, everywhere and without exception** — tag values, scaffolding
filenames, folder names, headings. Mixed-language vocabulary is what left the Router linking
`[[_Protocol-storage]]` at files named `_Protocolo-storage`: two files, each wrong about the
other, and broken links nobody sees until they are followed. Renaming happens only through a
script that reconciles every reference in the same pass (`NEXUS:AX-5`).

9. **Body.** Lean prose with tables, `⚠️` for a caution, `🚀` for a modern technique. No *Module
   Summary*, no *Concept Map*, no *Cheatsheet*, no filler heading. Condensing cuts verbosity and
   never content: every concept of the source survives, denser.
```markdown
# Title

> **Definition:** [1–3 sentences a retrieval query returns whole as the canonical answer].

## [dense sections]
## Relationships
- [[Note]] — what this dependency is for.

---
#domain #subtopic
```
10. **Code policy by type.** Python is the stack; ggplot2, Tableau, D3, Shiny and R appear as
    paradigm references beside their Python equivalent, never as the main block.

| `type/` | Code |
|---|---|
| `concept` | none |
| `maths` | none — `$LaTeX$` where it clarifies |
| `algorithm` | Python (sklearn) + signature + `## 📚 Sources` |
| `engineering` | Python-first, commands |
| `tool` | the paradigm and its Python equivalent; a snippet only if essential |

11. **Links** are prefix-free aliases — `[[Encoding]]`, not `[[5.4-Encoding]]` — verified against
    the index, cross-domain ones against the Router's bridges. Mermaid diagrams go in a code
    block with a `> ![[name.png|500]]` placeholder; the operator renders the PNG.
12. **Protocol is not technique.** `_Protocol-[dom]` carries `> **Definition**`,
    `## 🛡️ Expert checklist` (anchored steps, ⚠️/🚀), an optional Mermaid `## Visual flow`,
    `## Frequent decisions` (situation → action) and `## Relationships`. It says **when and in
    what order**, links the technique note, never restates it. ⚠️ **One home per technique, and
    every other mention is a link to it.** Which note is the home is the *index's* answer, never
    this file's — a routing table kept in a skill goes stale silently, and a technique with two
    homes is the duplication Phase 1 exists to catch, arriving through the back door.
13. **Sources.** Raw material stays in the external sources vault the binding names; the note is the
    condensation and cites the original by address (`NEXUS:AX-7`). An unnameable source is marked
    unsourced, not quietly asserted (`MLabs:AX-6`). Content beyond the source is allowed where a
    working data scientist needs it, and is flagged — 🚀 on a protocol step, and in a note:
```markdown
> [!abstract] 🚀 NEXUS UPDATE (external)
> **Origin:** [official doc / standard / practice] · **Why:** [reason]
```
14. **Synchronise in the same turn as the note.** Append to the domain index:
```
📄 [Note-Name.md] [✅]
   ├── Summary: [one line]
   ├── Concepts: [key ones]
   ├── Code: [Python / — ]
   ├── Depends on: [[...]]
   └── Required by: [[...]]
```
A new cross-domain dependency gets a row in the Router's bridge table. A closed sub-domain gets
its scaffolding. The index counter and the Router's Global Progress row both move.

## Verification — stated before the write, run after

State these as the prediction, run them, report every gap (`MLabs:AX-14`, `MLabs:AX-22`); a check
that could not be run is reported as not run, never as passed.

1. the instance coherence script clean on the new file: the four keys present, none dropped
   anywhere in the same diff.
2. Every wikilink resolves to an `aliases:` entry in the loaded index; none names a numbered file.
3. The note's prefix was free in its folder, and no existing prefix changed.
4. The index gained one 📄 block per note; its counter and the Router's row moved by that number.
5. Every cross-domain link has a bridge row; every `type/algorithm` note has `library`, `class`
   and `## 📚 Sources`.
6. `Module Summary|Concept Map|Cheatsheet` greps empty, and the tracked diff is markdown only.
7. The commit message names `create-note`.

## Not this skill

- **Repairing an existing note** — the audit's; what this skill crosses goes one line to
  the instance mailbox, uninvestigated and unfixed (`MLabs:AX-25`).
- **Creating what already exists.** Phase 1's classification is the check; a duplicate is its
  failure.
- **Writing before both gates close**, or writing more than the note in hand in one turn.
- **Touching the Router** beyond its bridge row and counter, or any index outside the domain.
- **Opening a domain**, committing for the operator, breaking the code policy, or leaving a note
  unsynchronised.
