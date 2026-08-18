---
name: release-cut
description: Cuts a public release of the methodology repository — verifies the tracked set against the allowlist, proves the depersonalisation check actually fires before trusting it, runs the cold start, and tags. Use whenever a version is about to be tagged, published, or made public for the first time, and whenever an instance is about to pin a new release.
---

> **Version:** MLabs 1.1.0

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
| Axiom numbering | contiguous, no duplicates, retired entries kept as ⚫ rows rather than removed |
| Cross-references | every `AX-n` and every section reference resolves; **none points at a retired identifier** |
| Coverage | regenerated from the rows, never typed — and it matches |
| Every event-triggered skill | states its dismissal criterion |
| Every skill | has a description saying **what it does and when to use it**, and no two overlap |
| Append-only | the diff since the last tag removes no line from a decision log |
| Version stamps | every tracked document names the release it was written against |

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

Only now. The tag names the release an instance will pin, so it must be the thing that passed
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
