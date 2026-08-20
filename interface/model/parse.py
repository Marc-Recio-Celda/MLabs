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
import re
import sys
from pathlib import Path

KINDS = ("compass", "plan", "queue", "park", "record", "standing", "skills", "records")


class Problem(dict):
    def __init__(self, path, line, why, text=""):
        super().__init__(path=str(path), line=line, why=why, text=text.strip()[:120])


# ---------------------------------------------------------------- field readers

def kv_block(lines, start):
    """`**Field:** value` and `> **Field:** value` lines following a header."""
    out = {}
    for raw in lines[start:]:
        if raw.startswith("#"):
            break
        m = re.match(r"^>?\s*\*\*(?P<k>[A-Za-z][\w ’'-]*):?\*\*[: ]\s*(?P<v>.+?)\s*$", raw)
        if m:
            out[m.group("k").strip().lower().replace(" ", "_")] = m.group("v").strip()
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
            ents.append({"kind": "mailbox-entry", "id": None, "line": i + 1, **f})
            continue

        m = re.match(r"^(?P<id>T\d+)\s*·\s*(?P<title>.+?)\s*(?P<status>[⬜🔨⛔🔴✅])?\s*$", head)
        if m:
            f = {k: clean(v) for k, v in m.groupdict().items() if v}
            fields = kv_block(lines, i + 1)
            why = re.search(r"\*\*Why\*\*\s*\*?\(?(?P<author>[^,)]+),\s*"
                            r"(?P<date>\d{4}-\d{2}-\d{2})\)?", "\n".join(lines[i:i + 12]))
            f["id_raw"] = f.pop("id", None)
            # The why is the whole point of a task — an executor that does not know the
            # purpose cannot test the premise, and testing it is its job. It was matched
            # for author and date and then discarded until 2026-08-18.
            body, k = [], i + 1
            while k < len(lines) and not lines[k].startswith("### "):
                body.append(lines[k]); k += 1
            blob = "\n".join(body)
            # Both shapes exist in the same file — `**Why.**` and `**Why** *(who, date)*.`
            # Converging them is P1's job; reading both is this parser's, because a field
            # that only parses in one of two live formats reports two thirds as missing.
            wm = re.search(r"\*\*Why[.:]?\*\*\s*(?:\*\([^)]*\)\*)?[.:]?\s*(.+?)"
                           r"(?=\n\*\*[A-Z]|\n---|\Z)", blob, re.S)
            ents.append({"kind": "task", "line": i + 1,
                         "project": clean(fields.get("project", "")),
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
        # The title may wrap. Join forward until the closing ** is in view, then match.
        # Until 2026-08-18 this required both markers on one line and SKIPPED the rest
        # in silence — one live entry was being dropped from the model while the file
        # printed "Nothing unplaceable".
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
        # Read by header name, not by index. This block was positional until
        # 2026-08-18 — in the one file whose grammar states, twice, that positional
        # reading is what five earlier findings were spent on. One inserted column
        # shifted every field and reported nothing.
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
                         "name": clean(g.get("Front", cells[0])),
                         "waits_on": clean(g.get("Waits on", cells[1] if len(cells) > 1 else "")),
                         "note": clean(g.get("Note", cells[2] if len(cells) > 2 else None)),
                         "project": project})
    active = [e for e in ents if e.get("active")]
    if len(active) != 1:
        probs.append(Problem(path, 0, f"the compass must hold exactly one `▶`; found {len(active)}"))
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
    # `SCHEMA.md`, `FLOW.md` and `current-plan/SKILL.md` all declare `done · mailbox ·
    # ideas · discarded`; this pattern knew only the older `✅ resolved · → integrated ·
    # → park · ⚫`. A plan written to the declared contract therefore had every closed
    # item reported as *a failed close* — the mirror of a pattern that cannot match, and
    # just as useless: a check that fires when it should not is a check nobody reads.
    # Both forms are accepted; the schema's is canonical and the older one is history.
    DEST = (r"(✅ *`?resolved`?|✅ *`?done`?|→ *`?TASKS[^`]*`?|→ *integrated"
            r"|→ *`?MAILBOX[^`]*`?|→ *`?IDEAS[^`]*`?|→ *park|⚫|`?discarded`?)")
    for i, line in enumerate(lines):
        m = re.match(r"^(?P<n>\d+)\.\s+(?P<text>.+)$", line)
        if not m:
            continue
        body = m.group("text")
        j = i + 1
        while j < len(lines) and lines[j].startswith("   ") and lines[j].strip():
            body += " " + lines[j].strip()
            j += 1
        struck = "~~" in body
        dest = re.search(DEST, body)
        ents.append({"kind": "plan-item", "line": i + 1, "index": int(m.group("n")),
                     "project": plan_project,
                     "struck": struck, "destination": clean(dest.group(0)) if dest else None,
                     "text": clean(re.sub(r"~~", "", body))[:300]})
        if struck and not dest:
            probs.append(Problem(path, i + 1,
                                 "a struck plan item with no destination — a failed close", body))
    return ents, probs


def parse_standing(path, text, project_pattern=None):
    """A project's state. Reads its header fields, definition, phase, and ramified blocks."""
    lines = text.splitlines()
    first = next((i for i, l in enumerate(lines) if l.startswith("# ")), -1)
    fields = kv_block(lines, first + 1)
    title = lines[first][2:].strip() if first >= 0 else path.stem

    project = None
    if project_pattern:
        m = re.search(project_pattern, str(path).replace("\\", "/"))
        if m:
            project = (m.groupdict().get("project") or (m.group(1) if m.groups() else None))

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

    # Fallback to definition.md if state.md has no What section
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

    for line in lines:
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
            if re.match(r"^[A-Z]{1,3}[0-9]+$", b_id):
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

        if current_block and line.startswith("|") and not line.startswith("|---") and not line.startswith("| #") and not line.startswith("| |") and not line.startswith("| Kind"):
            parts = [p.strip() for p in line.split("|")[1:-1]]
            if len(parts) >= 3 and not parts[0].startswith("---"):
                sub_id_m = re.search(r"([A-Z0-9\._-]+)", parts[0])
                if sub_id_m:
                    sub_id = sub_id_m.group(1)
                    # Validate subblock pattern e.g. A1.1, B8.2, S1.3, TR1.2
                    if re.match(r"^[A-Z]{1,3}[0-9]+(\.[0-9]+)?$", sub_id):
                        kind = parts[1] if len(parts) > 1 else ""
                        what = parts[2] if len(parts) > 2 else ""
                        status_str = parts[-1] if len(parts) >= 4 else ""
                        current_block["subblocks"].append({
                            "id": sub_id,
                            "kind": kind,
                            "title": what.replace("**", "").replace("`", ""),
                            "desc": what.replace("**", "").replace("`", ""),
                            "status": "completed" if "✅" in status_str else ("active" if any(s in status_str for s in ["🔨", "▶", "🔴", "open"]) else "pending")
                        })

    # Format B: "Progress by Block" Table
    if not board_blocks:
        in_prog = False
        for line in lines:
            if "Progress by Block" in line:
                in_prog = True
                continue
            elif in_prog and (line.startswith("## ") or line.startswith("---")):
                in_prog = False
            elif in_prog and line.startswith("|") and not line.startswith("|---") and not line.startswith("| Block"):
                parts = [p.strip() for p in line.split("|")[1:-1]]
                if len(parts) >= 3 and not parts[0].startswith("---"):
                    b_id_m = re.search(r"\b([A-Z0-9\._-]+)\b", parts[0])
                    if b_id_m and re.match(r"^[A-Z]{1,3}[0-9]+$", b_id_m.group(1)):
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

        # Match subblocks sections like "## 6. B8 — Sub-Blocks"
        for b in board_blocks:
            b_id_str = b["id"]
            sub_sec_name = b_id_str + " — Sub-Blocks"
            in_sub = False
            for line in lines:
                if sub_sec_name in line or (b_id_str in line and "Sub-Blocks" in line):
                    in_sub = True
                    continue
                elif in_sub and (line.startswith("## ") or line.startswith("---")):
                    in_sub = False
                elif in_sub and line.startswith("|") and not line.startswith("|---") and not line.startswith("| #") and not line.startswith("| Sub-block"):
                    parts = [p.strip() for p in line.split("|")[1:-1]]
                    if len(parts) >= 3 and not parts[0].startswith("---"):
                        sub_id_m = re.search(r"([A-Z0-9\._-]+)", parts[0])
                        if sub_id_m:
                            sub_id = sub_id_m.group(1)
                            if re.match(r"^[A-Z]{1,3}[0-9]+(\.[0-9]+)?$", sub_id):
                                sub_title = parts[1] if len(parts) > 1 else ""
                                sub_closes = parts[2] if len(parts) > 2 else ""
                                sub_status = parts[3] if len(parts) > 3 else (parts[-1] if len(parts) >= 3 else "")
                                b["subblocks"].append({
                                    "id": sub_id,
                                    "title": sub_title.replace("**", "").replace("`", ""),
                                    "desc": sub_closes.replace("**", "").replace("`", ""),
                                    "status": "completed" if "✅" in sub_status else ("active" if any(s in sub_status for s in ["🔨", "▶"]) else "pending")
                                })

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

    # Fallback to definition.md if not in state.md
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

    ent = {
        "kind": "project-state",
        "line": 1,
        "title": clean(title),
        "project": project,
        "definition": definition,
        "phase_summary": phase_summary,
        "code_repo": code_repo,
        "remote_url": remote_url,
        "git_branch": git_info.get("git_branch", ""),
        "git_commit": git_info.get("git_commit", ""),
        "git_commit_msg": git_info.get("git_commit_msg", ""),
        "git_commit_date": git_info.get("git_commit_date", ""),
        "blocks": board_blocks,
        **fields
    }

    probs = []
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
        # A description naming a moment rather than a wish is an event, however it is
        # phrased. `audit` read as a request until 2026-08-18 on "use at the close",
        # which filed the audit door under things you call when you feel like it.
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


PARSERS = {"records": parse_records, "skills": parse_skills, "queue": parse_queue, "park": parse_park, "compass": parse_compass,
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
