#!/usr/bin/env python3
"""Turn an operations centre's markdown into typed entities.

Pure: no DOM, no server, no network. Runnable on its own, which is what makes the
rest safe to change — a view can be rewritten without touching what a task *is*.

    python3 parse.py --adapter <path>            report what parses and what does not
    python3 parse.py --adapter <path> --json     the entities, for a view to render

Two rules, both bought expensively:

  * **Fields are read by name, never by position.** A positional reader returns the
    wrong field the moment a column is added, and returns it silently.
  * **Nothing is skipped.** An entry this cannot place is reported with its file and
    line. A parser that drops what it does not understand turns a lossless record
    into a lossy one, quietly.

Standard library only.
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path

KINDS = ("compass", "plan", "queue", "park", "record", "standing", "skills", "records",
         "philosophy", "axioms", "doc")


# The board's id grammar, in ONE place. ⛔ Never copy it. A second copy diverges, and a
# sub-block whose suffix the copy does not accept matches nothing and is DROPPED WITH NO
# REPORT — in the parser whose own GRAMMAR.md rule 2 says nothing may be skipped.
BLOCK_ID    = re.compile(r"^[A-Z]{1,3}[0-9]+$")
SUBBLOCK_ID = re.compile(r"^[A-Z]{1,3}[0-9]+(\.[0-9A-Za-z]+)?$")
# The first cell's LEADING token, anchored. Anchored because the previous form searched
# anywhere in the cell and would take a capital from the middle of a sentence.
HEAD_TOKEN  = re.compile(r"[`*\s]*([A-Za-z0-9._-]+)")
# ⚠️ And the line between *unplaceable* and *not an id at all*: a token TRYING to be an id
# — letters then a digit. Without it the first version of this fix reported 19 rows from
# neighbouring tables (`| Edge | Here | There |`), and a check that cries wolf gets deleted.
ID_LIKE     = re.compile(r"^[A-Za-z]{1,3}[0-9]")
# ⚠️ And the line between a heading that FAILED to be a block and one that never tried:
# the separator. `### `B3` · Title` is a block heading with a broken id and is reported;
# `### B3's Metrics Are Three, Not One` is prose that merely starts with an id-shaped word
# and is not. Without this the fix reported a real, correct heading in a real project file.
HEADING_SHAPE = re.compile(r"^###\s+[`*]*([A-Za-z0-9._-]+)[`*]*\s*[·–-]")


class Problem(dict):
    def __init__(self, path, line, why, text=""):
        super().__init__(path=str(path), line=line, why=why, text=text.strip()[:120])


# ---------------------------------------------------------------- field readers

# A field key: bolded, and either opening the line or following a `·` separator. ⚠️ Anything
# looser reads `**bold**` inside a value as a new field and truncates the value before it.
FIELD_KEY = re.compile(r"(?:(?<=^)|(?<=·\s))\*\*(?P<k>[A-Za-z][\w ’'-]*?):?\*\*:?\s*")


def kv_block(lines, start):
    """`**Field:** value` lines following a header, **several fields to a line**.

    ⚠️ THIS READ ONE FIELD PER LINE AND TOOK THE REST OF THE LINE AS ITS VALUE. The task list
    writes `**project:** `x` · **from** `MAILBOX` · **Closes:** …` on one line, so `project` came
    back carrying the two fields after it — **48 of 60 tasks, 49 distinct values of a field whose
    vocabulary is four** — while `parse_queue`'s own *"a queue entry with no `project:`"* check
    reported **zero problems**, because the field was not empty, merely wrong. A filter nobody can
    see is broken is the failure `AX-7` names.

    A key is `**Name**` or `**Name:**` at the start of the line or just after a `·`; anything else
    bolded belongs to a value. Each value runs to the next key.
    """
    out = {}
    for raw in lines[start:]:
        if raw.startswith("#"):
            break
        s = raw.strip()
        if s.startswith(">"):
            s = s[1:].strip()
        hits = list(FIELD_KEY.finditer(s))
        if not hits or hits[0].start() != 0:
            continue
        for n, m in enumerate(hits):
            end = hits[n + 1].start() if n + 1 < len(hits) else len(s)
            v = re.sub(r"[·|,;]\s*$", "", s[m.end():end].strip()).strip()
            out[m.group("k").strip().lower().replace(" ", "_")] = v
    return out


def table_rows(lines, start):
    """Rows of the first markdown table at or after `start`, keyed by header name.

    Keyed, not indexed: a positional reader returns the wrong field the moment a
    column is added, and returns it without complaining.
    """
    i, header = start, None
    rows = []
    while i < len(lines):
        line = lines[i]
        if line.strip().startswith("|"):
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if header is None:
                header = cells
            elif re.fullmatch(r"[\s:|-]+", line.strip()):
                pass
            else:
                if len(cells) == len(header):
                    rows.append((i + 1, dict(zip(header, cells))))
                else:
                    rows.append((i + 1, {"_malformed": line, "_cells": len(cells),
                                         "_expected": len(header)}))
        elif header is not None and line.strip() == "":
            header = None            # blank line ends a table; the next one re-reads its header
        i += 1
    return rows


def slug(*parts):
    t = " ".join(str(p) for p in parts if p)
    t = re.sub(r"[*`~\[\]()]", "", t).strip().lower()
    t = re.sub(r"[^a-z0-9]+", "-", t).strip("-")
    return t[:70] or "unnamed"


def assign_ids(entities):
    """A stable address per entity, so a view can link to one and patch it alone.

    Deliberately NOT file+line: a line number changes on every edit above it, which
    would make every id in the file churn whenever anything is inserted. The key is
    the entity's own name — the thing a person would use to refer to it.
    """
    seen = {}
    for e in entities:
        k = e["kind"]
        # A record from the store already carries its identity — that is what the
        # conversion bought. Slugging over it would replace a real `D3` with a made-up
        # name and break every reference that points at it.
        if e.get("_record_id"):
            base = slug(k, e.get("project"), e["_record_id"])
            n = seen.get(base, 0) + 1
            seen[base] = n
            e["id"] = e["_record_id"] if n == 1 else f'{e["_record_id"]}-{n}'
            e["uid"] = base if n == 1 else f"{base}-{n}"
            continue
        if k == "task":
            base = slug(k, e.get("id_raw") or e.get("title"))
        elif k == "project-state":
            base = slug(k, e.get("project"))
        elif k == "plan-item":
            base = slug(k, e.get("project"), e.get("index"))
        else:
            base = slug(k, e.get("project"), e.get("title") or e.get("name"))
        n = seen.get(base, 0) + 1
        seen[base] = n
        e["id"] = base if n == 1 else f"{base}-{n}"
    return entities


def header_of(lines, i):
    """The header row of the table containing line `i`, or None."""
    j = i
    while j >= 0 and lines[j].strip().startswith("|"):
        j -= 1
    j += 1
    if j >= i:
        return None
    head = [c.strip() for c in lines[j].strip().strip("|").split("|")]
    return head if head and not re.fullmatch(r"[\s:|-]+", lines[j].strip()) else None


def clean(s):
    """Strip markdown emphasis and code ticks from a field value."""
    return re.sub(r"[*`]", "", s or "").strip()


# ------------------------------------------------------------------- per kind

def parse_queue(path, text):
    """Mailbox and task list. Both are `###` headers; their field sets differ."""
    ents, probs, lines = [], [], text.splitlines()
    for i, line in enumerate(lines):
        if not line.startswith("### "):
            continue
        head = line[4:]

        m = re.match(r"^\[(?P<state>[\w-]+)\]\s*→\s*(?P<destination>.+?)\s*·\s*"
                     r"project:\s*(?P<project>\S+?)\s*—\s*(?P<title>.+?)\s*·\s*"
                     r"\((?P<author>[^,]+),\s*(?P<date>\d{4}-\d{2}-\d{2})\)\s*$", head)
        if m:
            f = {k: clean(v) for k, v in m.groupdict().items()}
            # ⛔ The body is the entry. An earlier version read the header only, so every
            # argument an agent wrote — the cost, the evidence, the thing the operator has
            # to weigh — was dropped in silence while `Nothing unplaceable.` printed
            # underneath. That is the failure rule 2 of `GRAMMAR.md` exists to prevent, and
            # it is invisible precisely because the entry still appears, with a title.
            body, k = [], i + 1
            while k < len(lines) and not lines[k].startswith("### "):
                body.append(lines[k])
                k += 1
            ents.append({"kind": "mailbox-entry", "id": None, "line": i + 1,
                         "body": "\n".join(body).strip(), **f})
            continue

        m = re.match(r"^(?P<id>T\d+)\s*·\s*(?P<title>.+?)\s*(?P<status>[⬜🔨⛔🔴✅])?\s*$", head)
        if m:
            f = {k: clean(v) for k, v in m.groupdict().items() if v}
            fields = kv_block(lines, i + 1)
            why = re.search(r"\*\*Why\*\*\s*\*?\(?(?P<author>[^,)]+),\s*"
                            r"(?P<date>\d{4}-\d{2}-\d{2})\)?", "\n".join(lines[i:i + 12]))
            f["id_raw"] = f.pop("id", None)
            # ⛔ The why is the whole point of a task and is never discarded — an executor
            # that does not know the purpose cannot test the premise, and testing it is its job.
            body, k = [], i + 1
            while k < len(lines) and not lines[k].startswith("### "):
                body.append(lines[k]); k += 1
            blob = "\n".join(body)
            # Both shapes exist in the same file — `**Why.**` and `**Why** *(who, date)*.`
            # Converging them is P1's job; reading both is this parser's, because a field
            # that only parses in one of two live formats reports two thirds as missing.
            wm = re.search(r"\*\*Why[.:]?\*\*\s*(?:\*\([^)]*\)\*)?[.:]?\s*(.+?)"
                           r"(?=\n\*\*[A-Z]|\n---|\Z)", blob, re.S)
            # ⚠️ A citation is an id, never a sentence. `**Board:** A5.1 · and it carries …` is
            # how all three live ones are written, so the id is taken and the prose after it is
            # not: a join key with commentary glued to it joins nothing.
            bm = re.match(r"[`*]*([A-Z]{1,3}\d+\.\d+)", clean(fields.get("board", "")))
            board_id = bm.group(1) if bm else ""
            # ⚠️ `board`, `from` and `closes` were parsed and then thrown away here. `board` is
            # the citation that joins the agenda to the map — the one thing you cannot see today
            # is which sub-block a committed task belongs to — and it was **one dictionary key**
            # away the whole time. Emitted whether or not the task carries them (`AX-24`): a task
            # that arrived whole legitimately has no block above it (`FLOW.md`).
            ents.append({"kind": "task", "line": i + 1,
                         "project": clean(fields.get("project", "")),
                         "board": board_id,
                         "from": clean(fields.get("from", "")),
                         "closes": clean(fields.get("closes", "")),
                         "author": clean(why.group("author")) if why else None,
                         "date": why.group("date") if why else None,
                         "why": clean(wm.group(1))[:600] if wm else None, **f})
            continue

        probs.append(Problem(path, i + 1, "a `###` entry matching neither the mailbox "
                                          "nor the task shape", head))
    for e in ents:
        if not e.get("project"):
            probs.append(Problem(path, e["line"],
                                 "a queue entry with no `project:` — the field the filter "
                                 "depends on and nothing else can infer", e.get("title", "")))
        # ⚠️ AND ONE THAT IS PRESENT BUT NOT A PROJECT NAME. The empty case was the only one
        # checked, so a `project:` carrying a whole sentence passed as filled — 48 of 60 tasks,
        # reported as zero problems. **A check that only sees absence cannot see wrongness.**
        elif " · " in e["project"] or len(e["project"]) > 40:
            probs.append(Problem(path, e["line"],
                                 "a `project:` that is not a project name — the filter reads it "
                                 "whole, so anything after the name silently becomes a new value",
                                 e["project"][:120]))
    return ents, probs


def parse_park(path, text):
    """Ideas. `project:`/`scope:` are declared per section and inherited by its bullets."""
    ents, probs, lines = [], [], text.splitlines()
    section = {"project": None, "scope": None, "heading": None}
    for i, line in enumerate(lines):
        h = re.match(r"^##+\s+(?P<h>.+?)\s*$", line)
        if h:
            head = h.group("h")
            section = {"heading": clean(re.split(r"—|·", head)[0]),
                       "project": (re.search(r"project:\s*`?([\w-]+)`?", head) or [None, section["project"]])[1],
                       "scope": (re.search(r"scope:\s*`?([\w-]+)`?", head) or [None, section["scope"]])[1]}
            continue
        if not line.startswith("- "):
            continue
        # ⛔ The title may wrap, so join forward until the closing ** is in view.
        # Requiring both markers on ONE line skips every wrapped entry in silence, while
        # the file goes on printing "Nothing unplaceable".
        joined, k = line, i
        while "**" in joined and joined.count("**") < 2 and k + 1 < len(lines):
            k += 1
            joined += " " + lines[k].strip()
        m = re.match(r"^-\s+\*\*(?P<title>.+?)\*\*\s*(?P<sep>—|·|\.)?\s*(?P<body>.*)$", joined)
        if not m:
            probs.append(Problem(path, i + 1,
                                 "a park bullet whose title could not be read", line))
            continue
        body = m.group("body")
        j = k + 1
        while j < len(lines) and lines[j].startswith("  ") and lines[j].strip():
            body += " " + lines[j].strip()
            j += 1
        inline_p = re.search(r"project:\s*`?([\w-]+)`?", body)
        inline_s = re.search(r"scope:\s*`?([\w-]+)`?", body)
        ents.append({"kind": "idea", "line": i + 1, "title": clean(m.group("title")),
                     "project": inline_p.group(1) if inline_p else section["project"],
                     "scope": inline_s.group(1) if inline_s else section["scope"],
                     "section": section["heading"], "body": body.strip()})
    for e in ents:
        if not e["project"]:
            probs.append(Problem(path, e["line"],
                                 "an idea with no `project:` on it and none on its section",
                                 e["title"]))
    return ents, probs


def parse_compass(path, text):
    """Fronts. The `▶` column is the marker; the board tables carry the rest."""
    ents, probs, lines = [], [], text.splitlines()
    project = None
    for i, line in enumerate(lines):
        h = re.match(r"^###\s+`?(?P<p>[\w-]+)`?", line)
        if h:
            project = h.group("p")
        cells = None
        if line.strip().startswith("|") and not re.fullmatch(r"[\s:|-]+", line.strip()):
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if not cells or len(cells) < 3:
            continue
        # ⛔ Read by header NAME, never by index. One inserted column shifts every
        # positional field and reports nothing — silently, with plausible output.
        row = header_of(lines, i)
        if cells[0] in ("▶", "⏸", "?") or re.fullmatch(r"\d+", cells[0]):
            g = dict(zip(row, cells)) if row and len(row) == len(cells) else {}
            fname = clean(g.get("Front", cells[1] if len(cells) > 1 else ""))
            desc_in = clean(g.get("Where it is described", cells[2] if len(cells) > 2 else ""))
            moves_w = clean(g.get("Moves when", cells[3] if len(cells) > 3 else None))

            row_proj = project
            if not row_proj:
                pm = re.search(r"/(?:[^/]+/)?([^/]+)/nexus", desc_in)
                if pm:
                    row_proj = pm.group(1)
                elif re.search(r"\b([a-zA-Z0-9_\-]+):[A-Z0-9]", desc_in):
                    row_proj = re.search(r"\b([a-zA-Z0-9_\-]+):[A-Z0-9]", desc_in).group(1)

            ents.append({"kind": "front", "line": i + 1, "marker": cells[0],
                         # ⚠️ Which table a row came from is a FACT the file states and the
                         # view cannot recover: the summary table is the ranked queue, the
                         # board tables are per-project detail about the same fronts. Left
                         # untagged, every front appears twice on any board built from these
                         # — once ranked and once not — and the duplicate looks like a
                         # second front rather than a second mention.
                         "row": "summary",
                         "active": cells[0] == "▶",
                         "name": fname,
                         "described_in": desc_in,
                         "moves_when": moves_w,
                         "project": row_proj})
            if row and len(row) != len(cells):
                probs.append(Problem(path, i + 1,
                                     f"a compass row with {len(cells)} cells against a "
                                     f"{len(row)}-column header", line))
        elif project and cells[0] not in ("Front", "") and not cells[0].startswith("---"):
            g = dict(zip(row, cells)) if row and len(row) == len(cells) else {}
            ents.append({"kind": "front", "line": i + 1, "marker": None, "active": False,
                         "row": "board",
                         "name": clean(g.get("Front", cells[0])),
                         "waits_on": clean(g.get("Waits on", cells[1] if len(cells) > 1 else "")),
                         "note": clean(g.get("Note", cells[2] if len(cells) > 2 else None)),
                         "project": project})
    # ⚠️ `exactly one ▶` was the rule until 2026-09-05 and `M-135` retired it. It existed because
    # there was ONE live plan file, so one task could hold the sheet — it was a statement about a
    # scarce resource, not about attention. Each task now owns its sheet, nothing is contended, and
    # several active tasks is a normal working day. ⛔ THE CHECK BLOCKED THE COCKPIT THE DAY THE
    # DECISION LANDED: it reported an error over a board that was correct, which is worse than no
    # check — a false alarm teaches the reader to stop reading the channel.
    #
    # What is still decidable, and it is the only thing: a board with work on it and NOTHING
    # active. The new rule is a FLOOR — *if work is happening, at least one task is active* — and a
    # static reader cannot know whether work is happening. It CAN see that the board holds tasks
    # and none carries the marker, which is the state nobody meant to be in.
    # ⛔ Several active is NOT reported, at any count. There is no ceiling by rule; the bound is
    # the wall stating its active count and somebody reading it.
    active = [e for e in ents if e.get("active")]
    waiting = [e for e in ents if not e.get("active") and e.get("kind") in ("front", "task")]
    if not active and waiting:
        probs.append(Problem(path, 0,
            f"the board holds {len(waiting)} task(s) and none is active — the floor is at least "
            f"one `▶` whenever work is happening"))
    return ents, probs


def parse_plan(path, text):
    """Live plan items and metadata. A struck line without a destination is a failed close."""
    ents, probs, lines = [], [], text.splitlines()
    # The plan holds one task, so its items inherit that task's project from the header.
    hp = re.search(r"\*\*project:\*\*\s*`?([\w-]+)`?", text)
    plan_project = hp.group(1) if hp else None

    # A plan names what it is working on. It was `**Task:**` and a `**Compass row:**`;
    # since the plan model landed it is `**Plan:**` + `**Sub-block:**` + `**Front:**`.
    # Both are read, because records written under the old header are not rewritten.
    task_match = (re.search(r"\*\*Task:\*\*\s*`?([^·\n]+)`?", text)
                  or re.search(r"\*\*Sub-block:\*\*\s*`?([^·\n]+)`?", text))
    compass_match = (re.search(r"\*\*Compass row:\*\*\s*([^\n·]+)", text)
                     or re.search(r"\*\*Front:\*\*\s*([^\n·]+)", text))
    plan_id_match = re.search(r"\*\*Plan:\*\*\s*`?([\w-]+)`?", text)
    status_match = re.search(r"\*\*Status:\*\*\s*`?(active|paused|closed)`?", text)
    opened_match = re.search(r"\*\*Opened:\*\*\s*([^\n·]+)", text)
    order_why_match = re.search(r"## The order, and why this order\s*\n\n(.*?)(?=\n##|\Z)", text, re.DOTALL)
    order_why_text = clean(order_why_match.group(1)) if order_why_match else ""

    ents.append({
        "kind": "live-plan-meta",
        "title": clean(task_match.group(1)) if task_match else "Plan en vuelo",
        "task": clean(task_match.group(1)) if task_match else None,
        "project": plan_project,
        "compass_row": clean(compass_match.group(1)) if compass_match else None,
        "opened": clean(opened_match.group(1)) if opened_match else None,
        "order_why": order_why_text[:1000] if order_why_text else "",
        "plan_id": plan_id_match.group(1) if plan_id_match else None,
        "status": status_match.group(1) if status_match else "active"
    })

    # The outcome vocabulary, and it is TWO vocabularies because two are on disk.
    # `SCHEMA.md` and `FLOW.md` declare `done · mailbox ·
    # ideas · discarded`; this pattern knew only the older `✅ resolved · → integrated ·
    # → park · ⚫`. A plan written to the declared contract therefore had every closed
    # item reported as *a failed close* — the mirror of a pattern that cannot match, and
    # just as useless: a check that fires when it should not is a check nobody reads.
    # Both forms are accepted; the schema's is canonical and the older one is history.
    # ⚠️ `[^`]*` was `[^\x60]*` here and it is greedy: with no closing backtick on the line
    # it ran to the end, so `→ MAILBOX` swallowed everything written after it — the item's
    # author note among it. A destination is one token, so the tail is spelled as one.
    DEST = (r"(✅ *`?resolved`?|✅ *`?done`?|→ *`?TASKS[\w./-]*`?|→ *integrated"
            r"|→ *`?MAILBOX[\w./-]*`?|→ *`?IDEAS[\w./-]*`?|→ *park|⚫ *`?discarded`?"
            r"|⚫|`?discarded`?)")

    # Which of `FLOW.md`'s four a destination is. The view paints by outcome, so it needs
    # the outcome and not the spelling — ⚠️ **and the spellings are what differ between two
    # eras of the same file**, which is why the mapping lives here rather than in the view.
    def outcome_of(dest):
        if not dest:
            return None
        d = dest.lower()
        if "discard" in d or "⚫" in d:
            return "discarded"
        if "mailbox" in d or "integrated" in d:
            return "mailbox"
        if "idea" in d or "park" in d:
            return "ideas"
        if "task" in d:
            return "mailbox"
        return "done"

    # ⛔ A section is not decoration. `FLOW.md` nests the work and the operator asked for a
    # sheet that shows it, so headings inside a plan group its items — and a group may be
    # ORDERED (numbered, one after another) or UNORDERED (bulleted, no sequence implied).
    # ⚠️ Forcing every item into one numbered run is what makes a plan read as a sequence
    # that does not exist, and the operator then works it in that false order.
    ORDER_WHY = "the order, and why this order"
    section = subsection = None
    in_order_why = False
    seen = set()

    def push(i, raw_index, body, ordered):
        struck = "~~" in body
        dest = re.search(DEST, body)
        destination = clean(dest.group(0)) if dest else None
        text = body
        if destination:
            # The destination is a field, so it leaves the text. Left in, the view prints
            # it twice — once as prose and once as its own tag.
            text = re.sub(DEST, "", text)
        # An item written from the office carries who wrote it and when, in the same shape
        # every other record in this method uses. Nothing new to learn, and nothing to
        # migrate: an item without it simply has no author.
        note = re.search(r"\*\(([^,)]+),\s*(\d{4}-\d{2}-\d{2})\)\*\s*$", text.strip())
        if note:
            text = text[:note.start()]
        ents.append({"kind": "plan-item", "line": i + 1, "index": raw_index,
                     "project": plan_project,
                     "section": section, "subsection": subsection, "ordered": ordered,
                     "struck": struck, "destination": destination,
                     "outcome": outcome_of(destination),
                     "author": clean(note.group(1)) if note else None,
                     "date": note.group(2) if note else None,
                     "text": clean(re.sub(r"~~", "", text))[:300]})
        if struck and not destination:
            probs.append(Problem(path, i + 1,
                                 "a struck plan item with no destination — a failed close", body))

    for i, line in enumerate(lines):
        h = re.match(r"^(?P<hashes>#{2,3})\s+(?P<h>.+?)\s*$", line)
        if h:
            head = clean(h.group("h"))
            if len(h.group("hashes")) == 2:
                section, subsection = head, None
            else:
                subsection = head
            in_order_why = head.lower().startswith(ORDER_WHY)
            if not in_order_why:
                ents.append({"kind": "plan-section", "line": i + 1, "project": plan_project,
                             "level": len(h.group("hashes")), "title": head,
                             "section": section, "subsection": subsection})
            continue
        if in_order_why or i in seen:
            continue

        m = re.match(r"^(?P<n>\d+)\.\s+(?P<text>.+)$", line)
        bullet = None if m else re.match(r"^[-*]\s+(?P<text>.+)$", line)
        if not m and not bullet:
            continue
        body = (m or bullet).group("text")
        j = i + 1
        # A continuation is indented under its item. ⚠️ It must not swallow the NEXT item,
        # which is why each consumed line is recorded: an indented `1.` is a nested item in
        # some plans and a wrapped line in others, and only the marker tells them apart.
        while j < len(lines) and lines[j].startswith("   ") and lines[j].strip():
            if re.match(r"^\s+(?:\d+\.|[-*])\s+", lines[j]):
                break
            body += " " + lines[j].strip()
            seen.add(j)
            j += 1
        push(i, int(m.group("n")) if m else None, body, ordered=bool(m))
    return ents, probs


def parse_standing(path, text, project_pattern=None):
    """A project's state. Reads its header fields, definition, phase, and ramified blocks."""
    lines = text.splitlines()
    probs = []   # nothing is dropped — GRAMMAR.md rule 2, which this function broke in four places
    first = next((i for i, l in enumerate(lines) if l.startswith("# ")), -1)
    fields = kv_block(lines, first + 1)
    title = lines[first][2:].strip() if first >= 0 else path.stem

    project = None
    # The owner a project sits under — a laboratory, a workspace. It is NOT a second field
    # to maintain: the adapter's `project_from` already captures it from the path, and this
    # only stops discarding it. Every queue entry inherits it through `project`, so the
    # grouping is stated once, by where the cartridge lives, and never transcribed.
    lab = None
    if project_pattern:
        m = re.search(project_pattern, str(path).replace("\\", "/"))
        if m:
            project = (m.groupdict().get("project") or (m.group(1) if m.groups() else None))
            lab = m.groupdict().get("lab")

    # 1. Extract Phase Summary from blockquote
    phase_summary = ""
    for line in lines[:20]:
        line_s = line.strip()
        if line_s.startswith(">") and any(k.lower() in line_s.lower() for k in ["phase", "iteration", "mvp", "pre-phase", "paused", "built"]):
            cleaned = line_s.lstrip("> *").strip()
            parts = [p.strip().replace("**", "").replace("`", "") for p in cleaned.split("·")]
            # Filter out pure Last updated parts or resume points
            descriptive_parts = [p for p in parts if not p.lower().startswith("last updated") and not p.lower().startswith("resume point") and not p.lower().startswith("this file")]
            if descriptive_parts:
                phase_summary = " · ".join(descriptive_parts[:2])
                break

    # 2. Extract Project Definition ("## 1. What it is")
    definition = ""
    in_what = False
    what_lines = []
    for line in lines:
        if re.match(r"^##\s+\d*\.?\s*What\b", line, re.I):
            in_what = True
            continue
        elif in_what and (line.startswith("## ") or line.startswith("---") or line.startswith("|") or line.startswith("```")):
            break
        elif in_what:
            l_strip = line.strip()
            if l_strip and not l_strip.startswith(">"):
                what_lines.append(l_strip)
            elif what_lines and not l_strip:
                break

    # Fallback to definition.md if the plan (`state.md` before `M-135`) has no What section
    if not what_lines:
        def_file = path.parent / "definition.md"
        if def_file.exists():
            try:
                def_text = def_file.read_text(encoding="utf-8")
                in_def_what = False
                for dline in def_text.splitlines():
                    if re.match(r"^##\s+\d*\.?\s*What\b", dline, re.I):
                        in_def_what = True
                        continue
                    elif in_def_what and (dline.startswith("## ") or dline.startswith("---") or dline.startswith("|")):
                        break
                    elif in_def_what:
                        dl_strip = dline.strip()
                        if dl_strip and not dl_strip.startswith(">"):
                            what_lines.append(dl_strip)
                        elif what_lines and not dl_strip:
                            break
            except Exception:
                pass

    if what_lines:
        definition = " ".join(what_lines).replace("**", "").replace("`", "")

    # 3. Extract Ramified Blocks & Subblocks Hierarchy
    board_blocks = []
    current_block = None
    in_board_section = False

    for i, line in enumerate(lines):
        # Detect start of board or progress sections
        if re.search(r"^##\s+\d*\.?\s*(The board|Progress by Block|Roadmap|Blocks)\b", line, re.I):
            in_board_section = True
            current_block = None
            continue
        # Stop board extraction if we hit a different level-2 section like "Active risks", "Iteration history", etc.
        elif in_board_section and re.match(r"^##\s+\d*\.?\s*(Active risks|Cross-project|Iteration history|Do not re-investigate|Sources|Topology|Evidence|Where it stands|Notes|Appendix)", line, re.I):
            in_board_section = False
            current_block = None
            break

        if not in_board_section:
            continue

        # Format A: ### `Xn` · Block Title
        m_head = re.match(r"^###\s+[`\*]*([A-Z0-9\._-]+)[`\*]*\s*[·–-]\s*(.+)", line)
        if m_head:
            b_id = m_head.group(1).strip()
            # Only valid block ids like A1, B3, S1, TR1, P2, etc.
            if BLOCK_ID.match(b_id):
                b_title = m_head.group(2).strip()
                current_block = {
                    "id": b_id,
                    "title": b_title.replace("**", "").replace("`", ""),
                    "status": "active" if any(sym in b_title for sym in ["🔨", "▶", "⛔"]) else ("completed" if "✅" in b_title else "pending"),
                    "summary": b_title.replace("**", "").replace("`", ""),
                    "subblocks": []
                }
                board_blocks.append(current_block)
                continue
            elif ID_LIKE.match(b_id):
                probs.append(Problem(path, i + 1, f"a board block id the grammar cannot place: {b_id!r}", line))
                current_block = None   # and DETACH: never let this heading's rows join the block above
                continue

        # ⚠️ A `###` heading the pattern above could not read AT ALL still ends the previous
        # block. Without this, its rows kept appending to the block above it — which is worse
        # than dropping them: a row that belongs nowhere was being shown under a real id, and
        # nothing said so. Reported only when the heading is TRYING to be an id.
        if line.startswith("### "):
            tried = HEADING_SHAPE.match(line)
            if tried and ID_LIKE.match(tried.group(1)):
                probs.append(Problem(path, i + 1, f"a board heading the grammar cannot read: {tried.group(1)!r}", line))
            current_block = None
            continue

        if current_block and line.startswith("|") and not line.startswith("|---") and not line.startswith("| #") and not line.startswith("| |") and not line.startswith("| Kind"):
            parts = [p.strip() for p in line.split("|")[1:-1]]
            if len(parts) >= 3 and not parts[0].startswith("---"):
                sub_id_m = HEAD_TOKEN.match(parts[0])
                if sub_id_m:
                    sub_id = sub_id_m.group(1)
                    # Validate subblock pattern e.g. A1.1, B8.2, S1.3, TR1.2
                    if SUBBLOCK_ID.match(sub_id):
                        # BY NAME, which is the rule `GRAMMAR.md` calls non-negotiable and which
                        # `parse_compass` already obeys. ⚠️ THIS READER WAS POSITIONAL — `parts[1]`,
                        # `parts[2]`, `parts[-1]`, never `parts[3]` — so the five-column board tables
                        # lost their `Waits on` cell entirely: 125 of 198 sub-block rows are in one,
                        # and 78 carry a real dependency. **That is the dependency graph an order of
                        # work needs, and it was discarded without a word.**
                        head = header_of(lines, i) or []
                        g = dict(zip(head, parts)) if len(head) == len(parts) else None
                        if g is None:
                            probs.append(Problem(path, i + 1,
                                "a board row whose cell count does not match its header — read by "
                                f"position as a fallback ({len(parts)} cells, header {len(head)})",
                                line))
                            g = {}
                            kind = parts[1] if len(parts) > 1 else ""
                            what = parts[2] if len(parts) > 2 else ""
                            status_str = parts[-1] if len(parts) >= 4 else ""
                        else:
                            kind = g.get("Kind", "")
                            what = g.get("What", "")
                            status_str = g.get("Status", "")
                        # ⚠️ EMITTED WHETHER OR NOT THE TABLE HAS THE COLUMN (`AX-24`): a field that
                        # may legitimately be empty is written empty, so a consumer can tell "no
                        # dependency" from "this reader never looked".
                        waits = clean(g.get("Waits on") or g.get("Waits On") or g.get("Depends On") or "")
                        current_block["subblocks"].append({
                            "id": sub_id,
                            "kind": kind,
                            "title": what.replace("**", "").replace("`", ""),
                            "desc": what.replace("**", "").replace("`", ""),
                            "waits_on": "" if waits in ("—", "-", "–") else waits,
                            # ⚠️ `"open"` WAS IN THIS LIST AND IS A SUBSTRING, NOT A MARKER. It
                            # matched any status cell whose prose contained the letters — 22 rows
                            # painted `active` while their marker said ⬜. The markers are the
                            # vocabulary; a word in a sentence is not one.
                            "status": "completed" if "✅" in status_str else ("active" if any(s in status_str for s in ["🔨", "▶", "🔴"]) else "pending")
                        })
                    elif ID_LIKE.match(sub_id):
                        probs.append(Problem(path, i + 1, f"a sub-block id the grammar cannot place: {sub_id!r}", line))

    # Format B: "Progress by Block" Table
    if not board_blocks:
        in_prog = False
        for i, line in enumerate(lines):
            if "Progress by Block" in line:
                in_prog = True
                continue
            elif in_prog and (line.startswith("## ") or line.startswith("---")):
                in_prog = False
            elif in_prog and line.startswith("|") and not line.startswith("|---") and not line.startswith("| Block"):
                parts = [p.strip() for p in line.split("|")[1:-1]]
                if len(parts) >= 3 and not parts[0].startswith("---"):
                    b_id_m = HEAD_TOKEN.match(parts[0])
                    if b_id_m and BLOCK_ID.match(b_id_m.group(1)):
                        b_id = b_id_m.group(1)
                        b_name = parts[0].replace(b_id, "").replace("**", "").replace("`", "").strip()
                        status_raw = parts[1]
                        what = parts[2].replace("**", "").replace("`", "")
                        board_blocks.append({
                            "id": b_id,
                            "title": b_name or what,
                            "status": "completed" if "✅" in status_raw else ("active" if any(s in status_raw for s in ["🔨", "▶"]) else "pending"),
                            "summary": what,
                            "subblocks": []
                        })
                    elif ID_LIKE.match(b_id_m.group(1)):
                        probs.append(Problem(path, i + 1, f"a board block id the grammar cannot place: {b_id_m.group(1)!r}", line))

        # Match subblocks sections like "## 6. B8 — Sub-Blocks"
        for b in board_blocks:
            b_id_str = b["id"]
            sub_sec_name = b_id_str + " — Sub-Blocks"
            in_sub = False
            for i, line in enumerate(lines):
                if sub_sec_name in line or (b_id_str in line and "Sub-Blocks" in line):
                    in_sub = True
                    continue
                elif in_sub and (line.startswith("## ") or line.startswith("---")):
                    in_sub = False
                elif in_sub and line.startswith("|") and not line.startswith("|---") and not line.startswith("| #") and not line.startswith("| Sub-block"):
                    parts = [p.strip() for p in line.split("|")[1:-1]]
                    if len(parts) >= 3 and not parts[0].startswith("---"):
                        sub_id_m = HEAD_TOKEN.match(parts[0])
                        if sub_id_m:
                            sub_id = sub_id_m.group(1)
                            if SUBBLOCK_ID.match(sub_id):
                                sub_title = parts[1] if len(parts) > 1 else ""
                                sub_closes = parts[2] if len(parts) > 2 else ""
                                sub_status = parts[3] if len(parts) > 3 else (parts[-1] if len(parts) >= 3 else "")
                                b["subblocks"].append({
                                    "id": sub_id,
                                    "title": sub_title.replace("**", "").replace("`", ""),
                                    "desc": sub_closes.replace("**", "").replace("`", ""),
                                    "status": "completed" if "✅" in sub_status else ("active" if any(s in sub_status for s in ["🔨", "▶"]) else "pending")
                                })
                            elif ID_LIKE.match(sub_id):
                                probs.append(Problem(path, i + 1, f"a sub-block id the grammar cannot place: {sub_id!r}", line))

    # 4. Extract Code Repo and Remote URL from metadata tables
    code_repo = ""
    remote_url = ""
    for line in lines:
        if re.search(r"\|\s*\*{0,2}Remote\*{0,2}\s*\|", line, re.I):
            parts = [p.strip() for p in line.split("|")[1:-1]]
            if len(parts) >= 2:
                remote_url = parts[1].replace("`", "").split("—")[0].strip()
        elif re.search(r"\|\s*\*{0,2}Code repo\*{0,2}\s*\|", line, re.I):
            parts = [p.strip() for p in line.split("|")[1:-1]]
            if len(parts) >= 2:
                code_repo = parts[1].replace("`", "").split("—")[0].strip()

    # Fallback to definition.md if not in the plan (`state.md` before `M-135`)
    if (not code_repo or not remote_url) and (path.parent / "definition.md").exists():
        try:
            def_text = (path.parent / "definition.md").read_text(encoding="utf-8")
            for line in def_text.splitlines():
                if not remote_url and re.search(r"\|\s*\*{0,2}Remote\*{0,2}\s*\|", line, re.I):
                    parts = [p.strip() for p in line.split("|")[1:-1]]
                    if len(parts) >= 2:
                        remote_url = parts[1].replace("`", "").split("—")[0].strip()
                elif not code_repo and re.search(r"\|\s*\*{0,2}Code repo\*{0,2}\s*\|", line, re.I):
                    parts = [p.strip() for p in line.split("|")[1:-1]]
                    if len(parts) >= 2:
                        code_repo = parts[1].replace("`", "").split("—")[0].strip()
        except Exception:
            pass

    if not code_repo:
        try:
            code_repo = str(path.parent.parent.resolve())
        except Exception:
            code_repo = f"~/Documents/{project}"

    # Extract Git metadata (branch, latest commit) if repo exists
    git_info = {}
    if code_repo:
        try:
            import subprocess
            repo_dir = Path(os.path.expanduser(code_repo)).resolve()
            if not repo_dir.exists() and (path.parent.parent / project).exists():
                repo_dir = path.parent.parent / project
            if (repo_dir / ".git").exists() or repo_dir.is_dir():
                branch = subprocess.check_output(
                    ["git", "-C", str(repo_dir), "branch", "--show-current"],
                    text=True, stderr=subprocess.DEVNULL, timeout=0.5
                ).strip()
                commit_out = subprocess.check_output(
                    ["git", "-C", str(repo_dir), "log", "-1", "--format=%h	%s	%cd", "--date=short"],
                    text=True, stderr=subprocess.DEVNULL, timeout=0.5
                ).strip().split("	")
                if len(commit_out) >= 3:
                    git_info = {
                        "git_branch": branch or "main",
                        "git_commit": commit_out[0],
                        "git_commit_msg": commit_out[1],
                        "git_commit_date": commit_out[2]
                    }
                elif len(commit_out) == 1 and commit_out[0]:
                    git_info = {
                        "git_branch": branch or "main",
                        "git_commit": commit_out[0]
                    }
        except Exception:
            pass

    # Look for README.md, guide.md, HOW-TO-USE.md, or definition.md for Visual Usage Guide
    readme_content = ""
    readme_path = ""
    readme_type = "readme"

    possible_readmes = [
        (path.parent / "guide.md", "guide"),
        (path.parent / "usage.md", "guide"),
        (path.parent / "README.md", "readme"),
        (path.parent.parent / "README.md", "readme"),
        (path.parent.parent / "HOW-TO-USE.md", "how-to-use"),
    ]
    if code_repo:
        try:
            r_dir = Path(os.path.expanduser(code_repo)).resolve()
            possible_readmes.insert(0, (r_dir / "README.md", "readme"))
            possible_readmes.insert(1, (r_dir / "guide.md", "guide"))
        except Exception:
            pass

    for rp, rtype in possible_readmes:
        if rp.exists() and rp.is_file():
            try:
                readme_content = rp.read_text(encoding="utf-8")
                readme_path = str(rp)
                readme_type = rtype
                break
            except Exception:
                pass

    # Extract full definition & architecture contents
    definition_content = ""
    def_file = path.parent / "definition.md"
    if def_file.exists() and def_file.is_file():
        try:
            definition_content = def_file.read_text(encoding="utf-8")
        except Exception:
            pass

    # Fallback to definition if no dedicated README was found
    if not readme_content and definition_content:
        readme_content = definition_content
        readme_path = str(def_file)
        readme_type = "definition"

    architecture_content = ""
    # ⚠️ RENAMED 2026-09-05 by `M-135`: `architecture.md` -> `axioms.md`. BOTH are resolved, new
    # name first, because a tree is half migrated for most of a migration's life and an engine
    # that only knows one name reports a whole department as absent rather than as moved.
    # ⛔ This literal is engine code naming an instance file, which the adapter contract forbids
    # (`interface:AX-1`): the engine is supposed to learn every path from `interface.json`. It is
    # left here and declared rather than quietly fixed, because moving it into the adapter is a
    # change to the source schema and that is its own decision, not a side effect of a rename.
    arch_file = next((f for f in (path.parent / "axioms.md", path.parent / "architecture.md")
                      if f.exists() and f.is_file()), None)
    if arch_file is not None:
        try:
            architecture_content = arch_file.read_text(encoding="utf-8")
        except Exception:
            pass

    # Extract any sub-guides under Guides/
    extra_guides = {}
    guides_dir = path.parent / "Guides"
    if guides_dir.exists() and guides_dir.is_dir():
        for gf in sorted(guides_dir.glob("*.md")):
            try:
                extra_guides[gf.stem] = gf.read_text(encoding="utf-8")
            except Exception:
                pass

    # Tech stack detection & tailored quickstart commands based on keywords
    tech_stack = "Python / Modular Pipeline"
    target_repo = code_repo or f"~/Documents/{project or 'project'}"
    quick_install = f"cd {target_repo} && python3 -m venv .venv && source .venv/bin/activate && pip install -e ."
    quick_run = "python main.py"
    quick_test = "pytest tests/"

    all_text = f"{readme_content} {definition} {architecture_content}".lower()

    if "astro" in all_text or "static site" in all_text:
        tech_stack = "Astro / HTML5 / CSS3 / TypeScript"
        quick_install = f"cd {target_repo} && npm install"
        quick_run = "npm run dev"
        quick_test = "npm run build && npm run preview"
    elif "react" in all_text or "vite" in all_text or "sqlite (225" in all_text:
        tech_stack = "React / Vite / TypeScript / FastAPI"
        quick_install = f"cd {target_repo} && npm install && (cd backend && pip install -r requirements.txt)"
        quick_run = "npm run dev"
        quick_test = "npm test && pytest backend/"
    elif "server.py" in all_text or "cockpit" in all_text or "operations centre" in all_text:
        tech_stack = "Vanilla JS / Modern CSS / Python Engine"
        quick_install = f"cd {target_repo} && ./tools/install-hooks.sh"
        quick_run = "python3 interface/server.py --port 8776"
        quick_test = "tools/gate.sh"
    elif "docling" in all_text or "pix2tex" in all_text or "latex-ocr" in all_text:
        tech_stack = "Python (Docling / PyMuPDF / Pix2Tex / LaTeX-OCR)"
        quick_install = f"cd {target_repo} && python3 -m venv .venv && source .venv/bin/activate && pip install -e ."
        quick_run = "python -m cli convert input_folder/ --output out/"
        quick_test = "pytest tests/ -v"
    elif "grapedia" in all_text or "litellm" in all_text or "navarro-payá" in all_text:
        tech_stack = "Python (LiteLLM / Pydantic / PyMuPDF / GRAPEDIA)"
        quick_install = f"cd {target_repo} && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
        quick_run = "python -m pipeline.main --paper paper.pdf"
        quick_test = "pytest tests/"
    elif "reinforcement learning" in all_text or "gymnasium" in all_text or "irrigation" in all_text:
        tech_stack = "Python (Reinforcement Learning / Gymnasium / InfluxDB)"
        quick_install = f"cd {target_repo} && python3 -m venv .venv && source .venv/bin/activate && pip install -e ."
        quick_run = "python -m sim.main"
        quick_test = "pytest tests/"
    elif "xauusd" in all_text or "backtrader" in all_text or "regime detection" in all_text:
        tech_stack = "Python (Pandas / Backtrader / MetaTrader 5)"
        quick_install = f"cd {target_repo} && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
        quick_run = "python -m backtest.main --strategy gold_regime"
        quick_test = "pytest tests/"
    elif "transcriptomics" in all_text or "scanpy" in all_text or "deseq2" in all_text:
        tech_stack = "Python / R (BioConductor / Scanpy / Nextflow)"
        quick_install = f"cd {target_repo} && python3 -m venv .venv && source .venv/bin/activate && pip install -e ."
        quick_run = "python -m pipeline.main --config config.yaml"
        quick_test = "pytest tests/"
    elif "how-to-use" in str(readme_path).lower() or "[project]" in all_text:
        tech_stack = "MLabs Cartridge Specification / Markdown"
        quick_install = "cp -r template/ <target_directory>"
        quick_run = "python3 -m skills.structure_project"
        quick_test = "tools/gate.sh"

    ent = {
        "kind": "project-state",
        "line": 1,
        "title": clean(title),
        "project": project,
        "lab": lab,
        "definition": definition,
        "phase_summary": phase_summary,
        "code_repo": code_repo,
        "remote_url": remote_url,
        "git_branch": git_info.get("git_branch", ""),
        "git_commit": git_info.get("git_commit", ""),
        "git_commit_msg": git_info.get("git_commit_msg", ""),
        "git_commit_date": git_info.get("git_commit_date", ""),
        "readme_content": readme_content,
        "readme_path": readme_path,
        "readme_type": readme_type,
        "definition_content": definition_content,
        "architecture_content": architecture_content,
        "extra_guides": extra_guides,
        "tech_stack": tech_stack,
        "quick_install": quick_install,
        "quick_run": quick_run,
        "quick_test": quick_test,
        "blocks": board_blocks,
        **fields
    }

    # ⚠️ `probs` is initialised at the TOP of this function — the board extraction reports
    # into it, and a reset here would discard exactly those findings.
    for req in ("last_updated", "next_action"):
        if req not in fields:
            probs.append(Problem(path, 1, f"a project state with no `{req.replace('_',' ')}` field"))
    return [ent], probs


def parse_skills(path, text):
    """A skill's own frontmatter, which is the only place its trigger is authored.

    Typing a guide beside fourteen descriptions creates a second index that drifts
    the first time one changes. This reads the descriptions instead.
    """
    fm = re.match(r"^---\n(.*?)\n---", text, re.S)
    if not fm:
        return [], [Problem(path, 1, "a skill file with no frontmatter block")]
    fields = {}
    for m in re.finditer(r"^(?P<k>[a-z-]+):\s*(?P<v>.+?)\s*$", fm.group(1), re.M):
        fields[m.group("k")] = m.group("v")
    name = fields.get("name") or path.parent.name
    desc = fields.get("description", "")
    # An event names when it fires; a request names who asks. The distinction is the
    # whole point of the guide — and it can only be READ, never guessed.
    #
    # ⚠️ The first version of this matched any of `fires|whenever|when a task`, and
    # got four of fourteen wrong, including `rnd`, whose description says in as many
    # words "Never fires on its own." A classification that is confidently wrong is
    # worse than one that says it does not know, so anything unproven is `unclear`
    # and carries the sentence a reader must judge.
    locked = fields.get("disable-model-invocation", "").lower() == "true"
    d = desc.lower()
    if locked:
        trigger, evidence = "locked", "disable-model-invocation: true"
    elif re.search(r"never fires on its own|invoked on demand|request-triggered", d):
        trigger, evidence = "request", "it says so explicitly"
    elif (m := re.search(r"\bfires (?:when|on|once)\b[^.]*", d)):
        trigger, evidence = "event", m.group(0).strip()
    elif (m := re.search(r"\buse (?:at the close|whenever an?\b[^.]*changes)\b[^.]*", d)):
        # ⛔ A description naming a MOMENT rather than a wish is an event, however it is
        # phrased — "use at the close" is an event, and reading it as a request files the
        # audit door under things you call when you feel like it.
        trigger, evidence = "event", m.group(0).strip()
    elif (m := re.search(r"\b(?:use|invoke) (?:when|it when|at|before|whenever|after|to)\b[^.]*", d)):
        trigger, evidence = "request", m.group(0).strip()
    elif (m := re.search(r"\bwhen (?:a|an|the) \w+[^.]*", d)):
        # It does state a condition; what it does not state is who acts on it.
        trigger, evidence = "unclear", f"states a condition but not who acts: \u201c{m.group(0).strip()[:70]}\u201d"
    else:
        trigger, evidence = "unclear", None
    when = re.split(r"(?<=[.])\s+", desc)
    return [{"kind": "skill", "line": 1, "title": name, "project": None,
             "trigger": trigger, "evidence": evidence,
             "summary": when[0] if when else desc,
             "when": " ".join(when[1:]).strip() or None, "description": desc}], []


def parse_records(path, text):
    """A record from the JSON store. No grammar, because there is nothing to guess.

    This is what the conversion bought: the shapes below still parse prose, with all
    the ambiguity that implies, while a record either has a field or does not. When
    every collection has moved, most of this file goes.
    """
    try:
        r = json.loads(text)
    except json.JSONDecodeError as e:
        return [], [Problem(path, 1, f"a record that is not valid JSON: {e}")]
    if not isinstance(r, dict) or "id" not in r:
        return [], [Problem(path, 1, "a record with no id")]
    r.setdefault("project", None)
    r["_record_id"] = r["id"]     # so assign_ids keeps it instead of slugging over it
    return [r], []


# ------------------------------------------------------- the structural files
#
# ⛔ These read MLabs' OWN documents — the philosophy, the axioms, the method — and they
# exist so no view ever transcribes them. A page that retypes a clause is a second copy of
# a fact with no winner (`AX-20`), and it drifts silently: the first build of this
# interface described `PH-0` as something it stopped being, invented a clause that was
# never there, and omitted `PH-6` entirely — while looking authoritative.

def parse_philosophy(path, text):
    """Clauses. `PH-0` is the objective; the rest are ways of losing it."""
    ents, probs, lines = [], [], text.splitlines()
    heads = [(i, m) for i, l in enumerate(lines)
             if (m := re.match(r"^##\s+(?P<id>PH-\d+)\s+·\s+(?P<title>.+?)\s*$", l))]
    # ⛔ Una cláusula acaba en el SIGUIENTE `##` de cualquier tipo, no en el siguiente
    # `## PH-n`. La última no tiene otra cláusula detrás, así que con la segunda regla se
    # tragaba todo lo que viniera después — «What this company refuses» y «How the levels
    # are used» salían dentro de `PH-6` como si fueran suyos.
    allheads = [i for i, l in enumerate(lines) if l.startswith("## ")]
    for k, (i, m) in enumerate(heads):
        stop = next((j for j in allheads if j > i), len(lines))
        # A trailing `---` belongs to the file, not to the last clause.
        while stop > i and lines[stop - 1].strip() in ("", "---"):
            stop -= 1
        body = lines[i + 1:stop]
        # The epigraph is the blockquote that opens a clause, when it has one. Not every
        # clause does, and inventing one for those that do not is writing philosophy.
        epigraph = None
        j = 0
        while j < len(body) and not body[j].strip():
            j += 1
        if j < len(body) and body[j].startswith(">"):
            quote = []
            while j < len(body) and body[j].startswith(">"):
                quote.append(body[j].lstrip("> ").strip())
                j += 1
            epigraph = clean(" ".join(quote))
        rest = "\n".join(body[j:]).strip()
        # `⛔ **Where it stops**` is the boundary between this clause and its neighbour, and
        # it is the paragraph a reader needs most — so it is a field, not prose in the middle.
        bound = re.search(r"^⛔\s+\*\*Where it stops.*", rest, re.M)
        ents.append({"kind": "clause", "id": m.group("id"), "line": i + 1,
                     "title": clean(m.group("title")), "epigraph": epigraph,
                     "body": rest,
                     "boundary": rest[bound.start():].strip() if bound else None,
                     "objective": m.group("id") == "PH-0"})
    if not ents:
        probs.append(Problem(path, 1, "a philosophy file with no `## PH-n ·` clause in it"))
    # What the company refuses, which is philosophy and not decoration.
    ref = re.search(r"^## What this company refuses\s*\n(.*?)(?=\n## |\Z)", text, re.S | re.M)
    if ref:
        for b in re.finditer(r"^- \*\*(?P<t>.+?)\*\*\s*(?P<b>.*?)(?=\n- \*\*|\Z)",
                             ref.group(1), re.S | re.M):
            ents.append({"kind": "refusal", "line": 0, "project": None,
                         "title": clean(b.group("t")).rstrip("."),
                         "body": clean(b.group("b"))[:600]})
    return ents, probs


def parse_axioms(path, text):
    """Rows, keyed by header name, plus the coverage table read as its own fact."""
    ents, probs, lines = [], [], text.splitlines()
    section = None
    for i, line in enumerate(lines):
        h = re.match(r"^##\s+(?P<id>PH-\d+)\s+·\s+(?P<title>.+?)\s*$", line)
        if h:
            section = h.group("id")
            continue
        if not line.strip().startswith("|"):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        row = header_of(lines, i)
        if not row or len(row) != len(cells):
            continue
        g = dict(zip(row, cells))
        # ⛔ By header NAME. The `Check` column moved once already, and a positional reader
        # would have shown every axiom's `Serves` list in the column that decides whether
        # the rule is enforced — plausibly, and wrongly.
        aid = re.match(r"^\*\*(AX-\d+)\*\*$", g.get("ID", "") or "")
        if aid:
            check = g.get("Check", "") or ""
            state = ("$" if check.startswith("`$`") else
                     "owed" if check.startswith("`⊘`") else "none")
            ents.append({"kind": "axiom", "id": aid.group(1), "line": i + 1,
                         "status": "in-force" if "🟢" in g.get("Status", "") else "proposed",
                         "text": g.get("Axiom", ""),
                         "serves": re.findall(r"PH-\d+", g.get("Serves", "")),
                         "check": check, "check_state": state, "section": section})
            continue
        cov = re.match(r"^`(PH-\d+)`$", g.get("Clause", "") or "")
        if cov:
            ents.append({"kind": "coverage", "id": cov.group(1), "line": i + 1,
                         "axioms": re.findall(r"AX-\d+", g.get("Axioms", "")),
                         "count": clean(g.get("Count", ""))})
    if not ents:
        probs.append(Problem(path, 1, "an axioms file with no `AX-n` row in it"))
    return ents, probs


def parse_doc(path, text):
    """A structural document, whole, with its outline. The view renders the markdown."""
    lines = text.splitlines()
    outline = [{"level": len(m.group(1)), "title": clean(m.group(2)), "line": i + 1}
               for i, l in enumerate(lines)
               if (m := re.match(r"^(#{1,3})\s+(.+?)\s*$", l))]
    title = outline[0]["title"] if outline and outline[0]["level"] == 1 else Path(path).stem
    return [{"kind": "doc", "id": Path(path).stem, "line": 1, "title": title,
             "outline": outline[1:], "body": text,
             "words": len(text.split()), "lines": len(lines)}], []


PARSERS = {"philosophy": parse_philosophy, "axioms": parse_axioms, "doc": parse_doc,
           "records": parse_records, "skills": parse_skills, "queue": parse_queue, "park": parse_park, "compass": parse_compass,
           "plan": parse_plan, "standing": parse_standing, "record": lambda p, t: ([], [])}


# ----------------------------------------------------------------------- entry

def parse_adapter(adapter_path):
    p = Path(adapter_path).expanduser()
    data = json.loads(p.read_text(encoding="utf-8"))
    root = (p.parent / data.get("root", ".")).resolve()
    entities, problems = [], []
    for src in data["sources"]:
        kind = src.get("kind")
        # A source may declare its own root. That is how the skills guide reads files
        # outside the operations centre without the engine being told where that is.
        sroot = (root / src["root"]).resolve() if src.get("root") else root
        paths = ([sroot / src["path"]] if src.get("path")
                 else sorted(sroot.glob(src.get("glob", ""))))
        if not paths and not src.get("optional"):
            problems.append(Problem(src.get("path") or src.get("glob"), 0,
                                    f"source {src['label']!r} resolved to no file"))
        # A glob reports nothing when ONE of its containers is empty — so the source
        # may declare what it expects to find one of. Without this the Projects tab
        # was a list of projects that have a state file, presented as the list of
        # projects: two were missing and nothing said so.
        for container in sorted(sroot.glob(src["expect"])) if src.get("expect") else []:
            if container.is_dir() and not any(str(f).startswith(str(container)) for f in paths):
                problems.append(Problem(container, 0,
                                        f"{container.name} matches {src['expect']!r} but has no "
                                        f"file for {src['label']!r}"))
        for f in paths:
            if not f.is_file():
                problems.append(Problem(f, 0, f"source {src['label']!r} names a missing file"))
                continue
            body = f.read_text(encoding="utf-8", errors="replace")
            if kind == "standing":
                ents, probs = PARSERS[kind](f, body, src.get("project_from"))
            else:
                ents, probs = PARSERS[kind](f, body)
            for e in ents:
                if kind == "records":
                    e["kind"] = src.get("entity") or "record"
                e["source"] = src["label"]
                try:
                    e["file"] = str(f.relative_to(sroot))
                except ValueError:
                    e["file"] = f.name
            entities += ents
            problems += probs
    # The lab is a property of the PROJECT, so it is resolved once here and inherited, never
    # written on an entry. A queue that carries `project:` can then be filtered by owner —
    # several repositories under one lab are one front worked as many — without ~97 entries
    # restating a fact the tree already states, and without a project that changes owner
    # needing every one of its entries edited.
    # ⚠️ NO LAB IS NAMED HERE. `interface/` is public and tracked, and the release gate greps
    # it: a lab name in a comment is a leak the engine has no reason to carry, since the tree
    # supplies every one of them at run time.
    labs = {e["project"]: e["lab"] for e in entities
            if e["kind"] == "project-state" and e.get("project") and e.get("lab")}
    for e in entities:
        # `cross` and `nexus` belong to no lab, and that is an answer, not a gap.
        if e["kind"] != "project-state" and e.get("project") in labs:
            e["lab"] = labs[e["project"]]

    assign_ids(entities)
    dupes = [e["id"] for e in entities if e["id"].rsplit("-", 1)[-1].isdigit()
             and not e["id"].rsplit("-", 1)[-1].startswith("0")]
    return {"root": str(root), "entities": entities, "problems": problems,
            "counts": {k: sum(1 for e in entities if e["kind"] == k)
                       for k in sorted({e["kind"] for e in entities})}}


def main():
    ap = argparse.ArgumentParser(description="Parse an operations centre into entities.")
    ap.add_argument("--adapter", required=True)
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    r = parse_adapter(args.adapter)
    if args.json:
        print(json.dumps(r, indent=2, ensure_ascii=False))
        return 0

    by_kind = {}
    for e in r["entities"]:
        by_kind.setdefault(e["kind"], []).append(e)
    print(f"\n  Parsed {len(r['entities'])} entities from {r['root']}\n")
    for k, v in sorted(by_kind.items()):
        with_project = sum(1 for e in v if e.get("project"))
        print(f"    {k:<15} {len(v):>4}   with project: {with_project}/{len(v)}")

    print(f"\n  {len(r['problems'])} entries could not be placed. "
          f"None was skipped:\n" if r["problems"] else "\n  Nothing unplaceable.\n")
    for p in r["problems"]:
        rel = p["path"]
        if rel.startswith(r["root"]):
            rel = rel[len(r["root"]):].lstrip("/")
        loc = f"{rel}:{p['line']}" if p["line"] else rel
        print(f"    {loc}\n        {p['why']}")
        if p["text"]:
            print(f"        {p['text']}")
    return 1 if r["problems"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
