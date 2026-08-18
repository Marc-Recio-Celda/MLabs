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

KINDS = ("compass", "plan", "queue", "park", "record", "standing", "skills")


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

    Keyed, not indexed: this is the lesson `metrics.py` paid five findings for.
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
            ents.append({"kind": "task", "line": i + 1,
                         "project": clean(fields.get("project", "")),
                         "author": clean(why.group("author")) if why else None,
                         "date": why.group("date") if why else None, **f})
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
        m = re.match(r"^-\s+\*\*(?P<title>.+?)\*\*\s*(?P<sep>—|·|\.)?\s*(?P<body>.*)$", line)
        if not m:
            continue
        body = m.group("body")
        j = i + 1
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
        if cells[0] in ("▶", "⏸", "?") or re.fullmatch(r"\d+", cells[0]):
            ents.append({"kind": "front", "line": i + 1, "marker": cells[0],
                         "active": cells[0] == "▶", "name": clean(cells[1]),
                         "described_in": clean(cells[2]),
                         "moves_when": clean(cells[3]) if len(cells) > 3 else None,
                         "project": project})
        elif project and cells[0] not in ("Front", "") and not cells[0].startswith("---"):
            ents.append({"kind": "front", "line": i + 1, "marker": None, "active": False,
                         "name": clean(cells[0]), "waits_on": clean(cells[1]),
                         "note": clean(cells[2]) if len(cells) > 2 else None,
                         "project": project})
    active = [e for e in ents if e.get("active")]
    if len(active) != 1:
        probs.append(Problem(path, 0, f"the compass must hold exactly one `▶`; found {len(active)}"))
    return ents, probs


def parse_plan(path, text):
    """Live plan items. A struck line without a destination is a failed close."""
    ents, probs, lines = [], [], text.splitlines()
    # The plan holds one task, so its items inherit that task's project from the header.
    hp = re.search(r"\*\*project:\*\*\s*`?([\w-]+)`?", text)
    plan_project = hp.group(1) if hp else None
    DEST = r"(✅ resolved|→ *`?TASKS[^`]*`?|→ *integrated|→ *`?MAILBOX[^`]*`?|→ *park|⚫)"
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
                     "text": clean(re.sub(r"~~", "", body))[:200]})
        if struck and not dest:
            probs.append(Problem(path, i + 1,
                                 "a struck plan item with no destination — a failed close", body))
    return ents, probs


def parse_standing(path, text, project_pattern=None):
    """A project's state. Its fields live in a blockquote of `**Field:** value`."""
    lines = text.splitlines()
    # Start after the title, not at line 0: `kv_block` stops at the first heading, and
    # line 0 IS a heading — so reading from 0 returned an empty field set for every
    # state file, and the report blamed six files for the parser's own bug.
    first = next((i for i, l in enumerate(lines) if l.startswith("# ")), -1)
    fields = kv_block(lines, first + 1)
    title = lines[first][2:].strip() if first >= 0 else path.stem
    # The project is the folder, not a field — requiring it to be repeated inside
    # would be a second place for one fact to be wrong. But WHICH folder is an
    # instance fact, so the adapter hands over the pattern and the engine only
    # applies it. This function held a hard-coded instance path until 2026-08-18,
    # caught by AX-1's structural grep the same hour the axiom was written.
    project = None
    if project_pattern:
        m = re.search(project_pattern, str(path).replace("\\", "/"))
        if m:
            project = (m.groupdict().get("project") or (m.group(1) if m.groups() else None))
    ent = {"kind": "project-state", "line": 1, "title": clean(title),
           "project": project, **fields}
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
    elif (m := re.search(r"\b(?:use|invoke) (?:when|it when|at|before|whenever|after|to)\b[^.]*", d)):
        trigger, evidence = "request", m.group(0).strip()
    else:
        trigger, evidence = "unclear", None
    when = re.split(r"(?<=[.])\s+", desc)
    return [{"kind": "skill", "line": 1, "title": name, "project": None,
             "trigger": trigger, "evidence": evidence,
             "summary": when[0] if when else desc,
             "when": " ".join(when[1:]).strip() or None, "description": desc}], []


PARSERS = {"skills": parse_skills, "queue": parse_queue, "park": parse_park, "compass": parse_compass,
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
        if not paths:
            problems.append(Problem(src.get("path") or src.get("glob"), 0,
                                    f"source {src['label']!r} resolved to no file"))
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
