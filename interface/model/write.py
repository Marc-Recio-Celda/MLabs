#!/usr/bin/env python3
"""The inverse of `parse.py` — appending entries in the grammar the parser reads back.

⛔ **This file exists so the two halves stay in step.** A writer that lives in the server
drifts from the grammar in the model, and the drift is silent in the worst way: the write
succeeds, the file grows, and the entry simply never appears in any view again. Every
shape written here has its reader in `parse.py`, and `--selftest` proves the round trip.

⚠️ **A target is named by its adapter label, never by a path.** The client says `plan`; the
adapter says which file that is. A client that could name a path could write anywhere on
the disk the server can reach, and no amount of validation downstream recovers that.
"""

import json
import os
import re
import tempfile
from datetime import date
from pathlib import Path


class WriteError(Exception):
    """Raised with a message written for a person, never a stack trace."""


class Conflict(WriteError):
    """The file changed under the caller. Its own edit is not applied."""


# --------------------------------------------------------------- target resolution

def resolve(adapter, label):
    """The adapter's source with this label, as an absolute path.

    ⚠️ A source declared by `glob` is not a write target: a glob names a set, and there is
    no answer to *which of them* an append belongs in. Only `path` sources are writable.
    """
    root = Path(adapter["root"])
    for src in adapter.get("sources", []):
        if src.get("label") != label:
            continue
        if not src.get("path"):
            raise WriteError(f"source {label!r} is declared by glob, so it names no single "
                             f"file to append to")
        sroot = (root / src["root"]).resolve() if src.get("root") else root
        f = (sroot / src["path"]).resolve()
        if not str(f).startswith(str(sroot)):
            raise WriteError(f"source {label!r} resolves outside its root")
        return f
    raise WriteError(f"no source labelled {label!r} in this adapter — "
                     f"the interface cannot write to a file the instance has not declared")


def _atomic_write(path, text):
    """Write via a neighbouring temp file and rename, so a crash leaves the old file whole.

    ⚠️ Writing in place truncates first. A failure between truncate and write loses the
    mailbox — and the mailbox is the one file whose contents nobody can reconstruct.
    """
    fd, tmp = tempfile.mkstemp(dir=str(path.parent), prefix=".", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            fh.write(text)
        os.replace(tmp, path)
    except BaseException:
        Path(tmp).unlink(missing_ok=True)
        raise


def _read(path):
    if not path.is_file():
        raise WriteError(f"the file this source names does not exist: {path}")
    return path.read_text(encoding="utf-8")


def _today():
    return date.today().isoformat()


# ------------------------------------------------------------------------ appends

def append_mailbox(adapter, *, title, project, destination, body="",
                   author="operator", state="open"):
    """`### [state] → destination · project: X — title · (author, date)` plus its body."""
    path = resolve(adapter, "mailbox")
    text = _read(path)
    head = (f"### [{state}] → {destination} · project: {project} — {title} "
            f"· ({author}, {_today()})")
    block = head + ("\n" + body.strip() if body.strip() else "")
    new = text.rstrip("\n") + "\n\n" + block + "\n"
    _atomic_write(path, new)
    return {"file": path.name, "line": new[:new.index(head)].count("\n") + 1, "wrote": head}


def append_idea(adapter, *, title, body="", project="cross", scope="general",
                author="operator"):
    """`- **title** — body`, with `project:`/`scope:` inline so the bullet is self-describing.

    ⚠️ Inline rather than relying on the section heading: an idea appended to the end of a
    file inherits whatever section happens to be last, which is how an idea ends up filed
    under a project it has nothing to do with.
    """
    path = resolve(adapter, "ideas")
    text = _read(path)
    tail = f" · project: `{project}` · scope: `{scope}`"
    line = f"- **{title.strip()}** — {body.strip() or title.strip()}{tail}"
    new = text.rstrip("\n") + "\n" + line + "\n"
    _atomic_write(path, new)
    return {"file": path.name, "line": new.rstrip("\n").count("\n") + 1, "wrote": line}


def append_task(adapter, *, title, project, why, status="⬜", board=None, author="operator"):
    """`### T<n> · title <status>` with its `project:`, its `Board:` and its `Why`.

    ⛔ The `why` is required by the grammar and by `AX-14`: an executor that does not know
    the purpose cannot refuse a task whose premise is false.

    ⚠️ `board` is the sub-block this task belongs to, and it is what joins the agenda to the
    map. **It is optional and its absence is legitimate** — a task that arrived whole has no
    block above it (`FLOW.md`) — but a writer that could not emit it at all guaranteed the
    join would stay at three tasks out of sixty, which is where it was.
    ⛔ **It is an id, never a sentence**: the reader takes the id and drops whatever follows.
    """
    if not (why or "").strip():
        raise WriteError("a task with no `why` — the field an executor needs to refuse a "
                         "task whose premise is false (`AX-14`)")
    if board and not re.fullmatch(r"[A-Z]{1,3}\d+\.\d+", board.strip()):
        raise WriteError(f"a `board` that is not a sub-block id: {board!r} — the join reads it "
                         "as an address, and an address with prose in it addresses nothing")
    path = resolve(adapter, "tasks")
    text = _read(path)
    used = [int(n) for n in re.findall(r"^###\s+T(\d+)\s*·", text, re.M)]
    n = max(used) + 1 if used else 1
    block = (f"### T{n} · {title.strip()} {status}\n"
             f"**project:** `{project}`"
             + (f" · **Board:** `{board.strip()}`" if board else "") + "\n"
             f"**Why** *({author}, {_today()})*. {why.strip()}")
    new = text.rstrip("\n") + "\n\n" + block + "\n"
    _atomic_write(path, new)
    return {"file": path.name, "id": f"T{n}",
            "line": new[:new.index(block)].count("\n") + 1, "wrote": block.splitlines()[0]}


def append_plan_item(adapter, *, text_, section=None, ordered=True, author="operator"):
    """An item, in `section` if one is named and at the end of the sheet otherwise.

    ⚠️ It is written **with no destination**, which is the whole point: the note lands as
    an open item and where it goes is decided afterwards, together. A writer that also
    chose the destination would be deciding the thing the operator asked to decide.
    """
    path = resolve(adapter, "plan")
    text = _read(path)
    lines = text.splitlines()

    # Where the section ends — the next heading of the same or higher level, else the file.
    start, stop = 0, len(lines)
    if section:
        for i, ln in enumerate(lines):
            h = re.match(r"^(#{2,3})\s+(.+?)\s*$", ln)
            if not h:
                continue
            if h.group(2).strip().lower() == section.strip().lower():
                start, level = i + 1, len(h.group(1))
                for j in range(i + 1, len(lines)):
                    h2 = re.match(r"^(#{1,3})\s+", lines[j])
                    if h2 and len(h2.group(1)) <= level:
                        stop = j
                        break
                else:
                    stop = len(lines)
                break
        else:
            raise WriteError(f"the plan has no section called {section!r}")

    used = [int(m.group(1)) for m in
            (re.match(r"^(\d+)\.\s", lines[k]) for k in range(start, stop)) if m]
    body = text_.strip()
    line = (f"{max(used) + 1 if used else 1}. {body}" if ordered else f"- {body}")
    line += f" *({author}, {_today()})*"

    # Insert after the section's last non-blank line, so the item joins its list rather
    # than landing under the blank run that separates the section from the next one.
    at = stop
    while at > start and not lines[at - 1].strip():
        at -= 1
    lines.insert(at, line)
    _atomic_write(path, "\n".join(lines).rstrip("\n") + "\n")
    return {"file": path.name, "line": at + 1, "wrote": line}


def route_plan_item(adapter, *, line, expect, outcome):
    """Strike an item and give it its destination — `FLOW.md`'s four and nothing else.

    ⚠️ `expect` is the text the caller saw. If the line no longer starts with it, the file
    moved under them and the edit is refused. Without that check a stale office tab strikes
    whichever item has drifted into that line number, which is a silent wrong write.
    """
    DEST = {"done": "✅ done", "mailbox": "→ MAILBOX", "ideas": "→ IDEAS",
            "discarded": "⚫ discarded"}
    if outcome not in DEST:
        raise WriteError(f"{outcome!r} is not one of the four outcomes `FLOW.md` declares: "
                         + " · ".join(DEST))
    path = resolve(adapter, "plan")
    text = _read(path)
    lines = text.splitlines()
    i = int(line) - 1
    if not (0 <= i < len(lines)):
        raise Conflict(f"line {line} is past the end of {path.name} — reload the office")
    current = lines[i]
    # ⚠️ The caller saw the CLEANED text and the file holds raw markdown, so a direct
    # containment test fails on every item carrying a backtick or a bold run — which is
    # most of them. Both sides are flattened the same way before comparing; the check is
    # still "is this the line you saw", it just stops mistaking formatting for a change.
    def flat(t):
        return re.sub(r"[^a-z0-9]+", "", str(t).lower())
    if expect and flat(expect)[:40] not in flat(current):
        raise Conflict(f"line {line} of {path.name} no longer reads as it did when the "
                       f"office loaded it — reload before routing this item")

    m = re.match(r"^(?P<lead>\s*(?:\d+\.|[-*])\s+)(?P<rest>.*)$", current)
    if not m:
        raise Conflict(f"line {line} of {path.name} is not a plan item")
    rest = m.group("rest")
    if "~~" in rest:
        raise WriteError("that item is already routed — reopen it before routing it again")
    note = re.search(r"\s*\*\([^,)]+,\s*\d{4}-\d{2}-\d{2}\)\*\s*$", rest)
    tail = note.group(0) if note else ""
    core = rest[:note.start()] if note else rest
    lines[i] = f"{m.group('lead')}~~{core.strip()}~~ {DEST[outcome]}{tail}"
    _atomic_write(path, "\n".join(lines) + "\n")
    return {"file": path.name, "line": line, "wrote": lines[i], "outcome": outcome}


# ------------------------------------------------------------------------ journal

def journal_path(adapter):
    """Beside the adapter, which is instance-side by definition.

    ⛔ Never inside this repository: the journal is a record of one operator's session and
    `AGENTS.md` §5 keeps every such thing out of what git tracks here.
    """
    p = adapter.get("path")
    if not p:
        return None
    return Path(p).parent / ".office-journal.jsonl"


def record(adapter, event):
    """Append one write to the journal. A journal that cannot be written never blocks a
    write that already succeeded — the entry is on disk either way, and the parser will
    find it on the next poll."""
    path = journal_path(adapter)
    if not path:
        return
    event = {"at": __import__("datetime").datetime.now().isoformat(timespec="seconds"), **event}
    try:
        with path.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(event, ensure_ascii=False) + "\n")
    except OSError:
        pass


def read_journal(adapter, limit=60):
    path = journal_path(adapter)
    if not path or not path.is_file():
        return []
    out = []
    for ln in path.read_text(encoding="utf-8", errors="replace").splitlines()[-limit:]:
        try:
            out.append(json.loads(ln))
        except json.JSONDecodeError:
            continue
    return out
