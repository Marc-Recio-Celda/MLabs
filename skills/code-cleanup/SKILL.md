---
name: code-cleanup
description: Strips archaeology and private vocabulary from code before it is shared or released — comments written as changelogs, identifiers that only resolve inside the operator's knowledge base, wikilinks that resolve nowhere, and non-English text. Use before opening a pull request, before publishing a repository, after copying a module between repositories, or whenever a diff is about to be read by someone who has never seen the knowledge base.
---

> **Version:** MLabs 1.0.0

# code-cleanup

The pass that exists so four rules do not have to fire on every turn of every session. Each of
these **can be applied to the finished artefact**, which is precisely why none of them is an
axiom (`AX-4`).

## When it fires

Before a pull request · before a repository is published or released · after a module is copied
between repositories · whenever a reader who has never seen the operator's knowledge base is
about to read the code.

**Not while writing.** That is the point: the author writes freely and this runs once, at the
end, over the diff or the directory.

## What it removes

### 1 · Comments and docstrings written as changelogs

The most common and the most expensive, because it compounds — a file carrying its own history
becomes unreadable at exactly the length where it matters most, and the reader who pays is the
one who arrives latest and knows least (`AX-29`).

| Goes | Stays |
|---|---|
| *"this used to be X"* · *"replaces the old…"* · *"changed because…"* | a constraint that bites **today** |
| an intention that never landed | **a trap someone already fell into** |
| a description of *what* the code does | *why* it does it that way |
| a header comment on a 200-line file explaining the module's evolution | a note beside the line it explains |

**The asymmetry that decides it:** a reader can reconstruct *what* code does by reading it, and
cannot reconstruct *why*. Comments about the *what* are also the ones that rot fastest, because
the code moves underneath them.

**Where the removed history goes:** if it is not already in the decision log, it is written
there **in the same act** — a pass can strip archaeology but cannot tell whether it was ever
logged, and deleting unlogged history is the one loss the philosophy forbids.

### 2 · Identifiers that only resolve inside the knowledge base

Decision, axiom, block and section identifiers — `Dn`, `AX-n`, `M-n`, `§n`. To a reader without
the base, one of these is a **dangling pointer**: it announces that an explanation exists and
then fails to provide it.

Rewrite the reference as the reason it stood for, or drop it. **Do not** leave the identifier
and add a gloss — that is two dangling pointers.

### 3 · Wikilinks, in any code repository

`[[Note]]` resolves only inside the knowledge base's own editor. In a code repository it renders
as literal brackets on the web view — **broken for the operator as much as for anyone**. A
reference to the base is a path or a plain name, never a wikilink. This applies to the
operator's own private repositories too; the failure is the format, not the audience.

### 4 · Text not in the project's language

Comments, docstrings, log strings and error messages left in another language. Translate rather
than delete: the content was worth writing.

## The procedure

1. **Scope it** — a diff, a directory, or a repository. Say which before starting.
2. **Search each class separately** and report the counts before changing anything.
3. **⚠️ Test the pattern before trusting it.** A pattern that cannot match returns clean on a
   file full of hits, and clean output is indistinguishable from a clean repository. Plant one
   of each class in a scratch file and confirm the search fires (`AX-7`).
   **The known trap:** `\b` does not match before `§`, which is not a word character — a
   word-boundary search silently misses every section reference.
4. **Rewrite, do not only delete.** A comment removed because it was archaeology may still have
   been the only record of a real constraint; that goes to the decision log first.
5. **Land it as its own commit**, from a clean tree, so the diff shows only this pass.

## Verification, as a prediction

State it before running: *this pass touches N files, removes A changelog comments, B private
identifiers, C wikilinks and D non-English strings, and changes no behaviour.*

**The strongest check is that the build output is byte-identical** where the language allows it
— identical bundle hash, identical compiled artefact. That is the proof that only comments moved.
Where it does not, the test suite passing unchanged is the substitute.

**Run it a second time: it must return nothing.** A pass that still finds hits on the second run
either missed them or created them.

## What it does not do

It does not change behaviour, rename anything, or reformat. It does not decide whether a
constraint is real — where a comment might be load-bearing, it asks. It does not touch a
repository the operator does not own: there the findings go to that project's owners, and
nothing is edited.
