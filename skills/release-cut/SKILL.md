---
name: release-cut
description: Cuts a public release of the methodology repository — verifies the tracked set against the allowlist, proves the depersonalisation check actually fires before trusting it, runs the cold start, and tags. Use whenever a version is about to be tagged, published, or made public for the first time, and whenever a consuming instance is about to adopt a new release.
---

# release-cut

The gate every invariant in `AGENTS.md` §5 was written for. Until this runs, those invariants
are a hope: they are declared and nothing executes them (`AX-7`).

**Nothing here is optional and the order matters.** Each step can fail the cut; a failed step
stops it rather than being noted and passed.

## 1 · The tracked set is exactly the allowlist

```bash
git ls-files
```

Compare against the `!` lines in `.gitignore`, both directions:

- **A surplus file is a leak.** Investigate it before anything else happens — something entered
  that the default-deny boundary was supposed to stop, and the interesting question is how.
- **An allowlist line with no file behind it is scaffolding.** The line goes.

**Read `git ls-files`, never the working tree.** The tree legitimately holds the private
instance and every project; a check that walks it is wrong by construction here.

## 2 · Prove the depersonalisation check fires, then run it

⚠️ **In this order, always.** A pattern that cannot match returns clean on a repository full of
leaks, and clean output is indistinguishable from a clean repository.

1. **Plant a leak** in a scratch file outside the repository: a line containing several denylist
   terms.
2. **Run the check against the planted file.** It must report every term. If it reports nothing,
   the check is broken — **fix the pattern, not the repository.**
   *The two failures already recorded: `\|` under `grep -E` is a literal pipe and never
   alternates; and a term without word boundaries matches inside ordinary words, which produces
   false positives that train the reader to ignore the check.*
3. **Only now run it over the tracked set.** It must return nothing.

The denylist lives in the instance, never here: a list of names is itself personal data.

## 3 · Structural integrity

| Check | Passes when |
|---|---|
| Axiom numbering | no duplicates, and **gaps are expected** — a retired axiom leaves the file and its number is never reused, so the gap is the trace and the log says where it went |
| Cross-references | `bash tools/axiom-refs.sh <axioms> <SCOPE> <files…>` exits 0, and every `§n` resolves. **A retired axiom has no row, so citing one IS citing a missing id** — one search, not two |
| Coverage | regenerated from the rows, never typed — and it matches |
| Every event-triggered skill | states its dismissal criterion |
| Every skill | has a description saying **what it does and when to use it**, and no two overlap |
| Records are append-only | the diff since the last tag removes no line from **a Record** — a decision log, a ledger, an employee log. ⚠️ **Standing documents are exempt and must be**: an axiom file, a binding and a method evolve, and forcing them to only grow is what fills the central text with deprecated rows |
| No transcribed version | `grep -rn '^> \*\*Version:' $(git ls-files)` **returns nothing.** The release's version is the tag; a number typed into a header is one nothing updates (`AX-36`). ⚠️ **This replaced a per-file stamp that never once agreed with itself** — six values across twenty-five files, a check that had never run at a cut, and the signal it was meant to give — *which files has an audit cleared* — belongs to the auditors' ledger, not to a line at the top of every file |

## 4 · The cold start — the one that actually tests the claim

**Hand a fresh agent nothing but this repository** and ask it to explain the company, place a new
rule in the right department, and **operate the mechanisms** — not just describe them.

**It passes when the agent can do the thing, not when it can summarise the thing.** The
distinction is the whole test: the founding cut failed here, because a stranger could explain
every rule and could not run the tally that the design depends on.

Whatever it could not work out from the repository alone is the release's real defect list.
**Fix it or declare it in the release notes** — an undeclared gap in a cold start is a promise
the repository is not keeping.

## 5 · Tag

> ⚠️ **The cut records the commit it was cut against, and that is not optional.**
> `AX-1`'s clause *"and pins the release it runs"* was **retired** — this instance co-develops MLabs
> rather than consuming it, so the two repositories move in the same round and a pin is what a
> consumer holds. **Retiring the pin removed the field that answered *which MLabs is this?***, so the
> cut answers it instead: the tag message carries the commit, and a cut that does not is a release
> nothing can be reproduced from. ⏳ The clause returns the day MLabs has a consumer that is not its
> co-developer, and it returns as the consumer half only.

Only now. The tag names the release a **consuming** instance will adopt, so it must be the thing that passed
the four steps above, not the thing that was ready before them.

Record in the instance's ledger what this cut checked and what it found — a release with no
record of its own gate is indistinguishable from one that skipped it.

## Verification, as a prediction

State before starting: *the tracked set is N files, the planted leak fires on M terms, the cold
start passes on the tally, and the diff since the last tag removes zero log lines.* Any number
that comes back different is the finding.

## What it does not do

It does not fix what it finds — a leak or a failed cold start stops the cut and becomes work. It
does not run against a working tree. It does not tag anything that has not passed every step.
