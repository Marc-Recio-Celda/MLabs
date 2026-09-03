# Traps — how each axiom is got wrong

> **Loaded by the reviewer, never by the work.** `AXIOMS.md` is read on every turn and its rows are
> what binds. A trap fires when someone writes the thing an axiom governs — a different event, and a
> rarer one (`AX-4`). Carrying both at the frequency of the more frequent one made neither salient
> and cost **31% of the axiom file on every read**, measured before this file existed.
>
> ⛔ **Nothing here verifies anything**, and nothing here is a rule. Every command lives in the row
> it belongs to; every rule is a row. This file holds only *this is how you get it wrong*.
>
> **Keyed by axiom id, and the id is the only link.** A trap whose axiom has left `AXIOMS.md` is a
> trap for a rule nobody is bound by: it goes, and the log says where. ⚠️ **A trap about a tool
> belongs in that tool's header comment, not here** — here is for traps about the method
> (`skills/compact/` §1).

## PH-1 · Scalability

| Axiom | Trap |
|---|---|
| `AX-1` | **The gate greps the tracked tree, not the history** · **the signature carve-out is scoped by path *and* by term**, and both must hold |
| `AX-20` | ⛔ **No repository is exempt, the authoring one least of all** · **Rule files only**: a task legitimately names paths · **The method's address is the one fact this rule can check today** — identical input must give byte-identical output, and the general form needs a generator that does not exist |
| `AX-39` | **A boundary drawn by topic looks tidiest the day it is drawn and is the first one crossed** — the test is not *do these belong together* but *who changes them, and how often* |
| `AX-45` | **A view nobody passed to the check is a view nobody checks** — the tool reports a target outside the file set rather than skipping it · **a view with no regeneration command is a photograph**, and `AX-20` wants that declared as one rather than implied |
| `AX-19` | **The failure it prevents is an agent correctly judging an artefact's usefulness and never judging its ownership**, which no other permission class catches |

## PH-2 · Sustainability

| Axiom | Trap |
|---|---|
| `AX-18` | **A request authorises what was asked, not what the work leads to** — the second change has a different origin from the first, however continuous the session felt · **Reversibility is never grounds to relax the gate**: version control solves irreversibility, not divergence |
| `AX-33` | **An artefact that still runs is not an artefact that is still right**: nothing breaks, it simply now obeys a rule that no longer says what it said |
| `AX-13` | **The reviewer runs in a fresh context** — one stance per conversation is a mechanism, not a discipline, and a second stance arriving with the first one's context loaded is the failure (`AX-43`) |
| `AX-40` | ⏳ **The trade carries a review date, kept in the log** — the balance is right while the operator is still learning the system and may not be afterwards, and this is the one rule written to be reconsidered · **`AX-28` is this rule's exception procedure, not a restatement of it**: this fires when choosing how the work gets done, that one when a decision is actually taken away |
| `AX-14` | **A premise that holds is not a premise that was checked** — an executor that starts editing before it has run the prediction has skipped the only step this rule adds |

## PH-3 · Data governance

| Axiom | Trap |
|---|---|
| `AX-9` | **A thread with no destination is a failure of the close, not an omission** · **the interval between *I wrote that* and *that is on disk* is where work is lost** |
| `AX-2` | **The first entry is the one that matters**: a log unparseable from line one had its shape retro-fitted, and everything after inherits the guess |
| `AX-11` | **An empty log is a state a check can read; a missing file is a guess** — indistinguishable from one deleted, mis-pathed, or that a brief never reached |
| `AX-23` | **A clean rename is already in the diff and is not listed**; what is listed is the move git could not see — removed here, rewritten there — where the new address exists only if someone wrote it · **Whole files only**: a deleted line is not tractable this way · **coverage is not proof that nothing consumes a thing**, which is why the search is pasted rather than described |
| `AX-42` | **Entities without their fields is a store you can count and not query**: the emission carries every field the record declared, or it has lost exactly what made the record atomic |
| `AX-15` | **The one delegated deletion**: a task may name the entries it closes, and the executor removes exactly those — that decision was made when the task was written |
| `AX-24` | **A field that may legitimately be empty is written empty** — an absent field is indistinguishable from a real zero · **`inherited` is the load-bearing value**, because a constraint you did not choose can only be discovered to be wrong · **never narrate the diff** |
| `AX-37` | **Atomic *for a reader*, not in the abstract** — splitting past what anything will ever query is the accumulation this company refuses · **the direction is decided by who authors, never by which is prettier**: parsing prose costs a parser that grows a branch per format that ever existed, and rendering structure into prose costs nothing · **another format is a declared exception carrying its reason** |

## PH-4 · Traceability

| Axiom | Trap |
|---|---|
| `AX-7` | **Two plants and a negative control each**: the obvious one, the one written in the file's own style, and one that must stay **silent** — without the third, a check that fires on everything passes both plants · **calibrate on the premise that feels obvious**, which is the one nobody instruments |
| `AX-31` | **The anchor is added at writing time**, because no later sweep can resolve the ambiguity (`AX-4`) · **A reference check cannot see a reassigned id** — one that still resolves while meaning something else is invisible to any such check, which is what makes stable identifiers the half nothing verifies · **`AX-6` owns *what must be cited*; `AX-31` owns *that the citation still resolves*** |
| `AX-22` | **Measure only freshly fetched data, and name which copy** · **`AX-22` owns *could not run*; `AX-6` owns *found nothing***, and collapsing exit 2 into exit 1 is the same failure as collapsing either into exit 0 |
| `AX-43` | **No check is possible, and inventing one would be the failure `AX-7` names** — *was this done by code or by a model* leaves no trace in the artefact · **the tell is a procedure written as prose where a command would fit**: counting, comparing, listing and reformatting are all code, and a step that describes them instead of naming the command has already made the choice |
| `AX-6` | **An unnameable source is marked unsourced**, never dropped · **A check that found nothing says what it checked**, because silence is indistinguishable from not having looked |

## PH-5 · Attention

| Axiom | Trap |
|---|---|
| `AX-29` | ⛔ **This says how something leaves, never that it must** — which documents empty and which close intact is the method's to say · **`AX-6` pulls the other way and `AX-24` resolves it**: the instruction is never *write less*, it is *write the other half* · **`AX-41` owns *no history here*; `AX-29` owns *how the removal is paid for*** |
| `AX-4` | **Both halves or neither** — a rule with no firing event loses to the stream of requests, and a rule that gains one just to have one makes none of them salient |
| `AX-17` | **An unordered list of pending items is not a destination** — *committed but not started* carries an order, and that order is a property of the items rather than a document that lists them · **the three addresses are the method's**, and the rule outlives the method changing them |
| `AX-38` | **The removal half has no command**: `git diff --numstat` over the structural set shows a file that only grew, which is a line to read rather than a verdict |
| `AX-41` | **The tell is a sentence the reader cannot follow without knowing what was tried** — *never a hook*, *not a number*, *no longer fires*: each of them names something absent, and the same rule stated positively needs none of them · **The pattern is looser than a year test on purpose** — it may not contain a pipe, and `[0-9]{4}` is what a year test costs once the alternation is gone · **It catches dated narration, not all narration** — a date is what a change register almost always carries and what prose almost never needs, which is what makes it the one mechanical shadow of this rule |
| `AX-21` | **There is exactly one routing index**, and it says not only what exists but when to read it |

## PH-6 · Measurement

| Axiom | Trap |
|---|---|
| `AX-36` | **The command that produces it appears beside it**, and it is run rather than remembered · **`AX-36` owns *what the number is out of and where it came from*; `AX-44` owns *whether it could have come out worse*** |
| `AX-44` | **No check is possible, and the reason is structural**: whether a number could have come out worse is a property of how it was produced, and the artefact keeps only the number · **the tell is a figure with no way to get worse** — a check whose accuracy holds while its coverage collapses reports perfectly and measures nothing, and one that passes over zero records is that failure in its pure form |

---

**Axioms with no trap recorded:** `AX-26` · `AX-28` · `AX-25`. Not an omission to be filled — a
category that exists gets filled, and a trap invented to complete a table is the failure `AX-7`
names, one tier up.
