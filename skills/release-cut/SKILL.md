---
name: release-cut
description: Cuts a public release of the methodology repository — verifies the tracked set against the allowlist, proves the depersonalisation check actually fires before trusting it, runs the cold start, and tags. Use whenever a version is about to be tagged, published, or made public for the first time, and whenever a consuming instance is about to adopt a new release.
---

# release-cut

The gate every invariant in `AGENTS.md` §5 was written for. **Until this runs, those invariants are
declared and nothing executes them** (`AX-7`).

⛔ **Nothing here is optional and the order matters.** Each step can fail the cut, and **a failed
step stops it** rather than being noted and passed.

## Occasion
**A version is about to be tagged, published, or made public for the first time**, or a consuming
instance is about to adopt a new release.

## 1 · The tracked set is exactly the allowlist

```bash
git ls-files
```

**Compare against the `!` lines in `.gitignore`, in both directions** — the invariant is
`AGENTS.md` §5's, and what this step adds is what to do with each result. **A surplus file is
investigated before anything else happens**: something crossed a default-deny boundary and *how* is
the interesting question. **An allowlist line with nothing behind it is scaffolding, and the line
goes.**

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
| Cross-references, axioms | `bash tools/axiom-refs.sh <axioms> <SCOPE> <files…>` exits 0. **A retired axiom has no row, so citing one IS citing a missing id** — one search, not two |
| Cross-references, sections | `bash tools/section-refs.sh <files…>` exits 0. ⚠️ **A dissolved section is cited by whoever dissolved it** — all three this check found on the day it was written were that, and `axiom-refs` had never covered them |
| Cross-references, clauses | `bash tools/clause-refs.sh PHILOSOPHY.md <files…>` exits 0. ⚠️ **It catches a clause that was removed, and cannot catch one that was reassigned** — an id that still resolves after it means something else is invisible to any reference check, which is why `AX-31` says a reference names its target rather than numbering it |
| Every check has been seen to fire | `bash tools/tests/run.sh` exits 0 (`AX-7`). It runs each check against **two plants and a negative control**, and names every runnable check with no test at all. ⚠️ **A check nobody has planted against is a claim, not a check** — and the plant that matters is the one written in the file's own style |
| Coverage | regenerated from the rows, never typed — and it matches |
| Roles and logs are the same set | `bash tools/roles-check.sh --skills skills --logs <the instance's>` exits 0. ⚠️ **`## Dismissal` ends a role and `## Retirement` ends a skill** (`METHOD.md` §5) — the check only works because the two words were separated, and a third meaning on either stops it measuring |
| Every skill carries an occasion | `grep -L '^## Occasion' skills/*/SKILL.md` returns nothing (`AX-4`) |
| Descriptions are distinct | every one meets `METHOD.md` §5's shape, and **no two of them overlap** — that budget is paid on every turn of every session, and an overlap misroutes silently |
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

**It fixes nothing it finds** — a leak or a failed cold start stops the cut and becomes work. **It
reads `git ls-files` and never a working tree**, and **it tags only what has passed every step
above.**
