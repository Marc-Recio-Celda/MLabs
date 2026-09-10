# Read-only document interface

Run from the repository root with Python 3:

```sh
python3 interface/server.py --adapter /path/to/instance/interface.json --port 8770
```

The adapter supplies the instance root, model sources and browsable directories. Library sections
are optional declarations over those same directories. For example, in an adapter beside a
`knowledge` directory:

```json
{
  "root": ".",
  "sources": [],
  "browse": ["knowledge"],
  "library": {
    "sections": [{"root": "knowledge", "label": "Knowledge"}]
  }
}
```

Sections use the declared order and labels. Subjects follow the actual subdirectories. The
catalog holds metadata; a document body is fetched only when opened. `/api/file` accepts both
`root` (the exact browse declaration) and `path` (relative to it). Legacy unscoped requests fail
when several directories contain the same path. Resolved paths and symlinks must stay inside
their declared directory, and document endpoints accept Markdown only.

The Library search combines titles, filenames and aliases with text search. The header's global
search still covers all browsable directories. Routes preserve the selected document, subject,
search scope and section anchor; reading positions and disclosures are local to the browser tab.
Source updates invalidate affected document bodies. The broader model still reloads as a whole.

The reader supports Markdown, nested lists, tables, Obsidian links and callouts, TeX formulas and
Mermaid diagrams. Exact filenames take precedence; unnumbered names and aliases resolve only to
a unique document. Missing and ambiguous references are visible. Old heading names are reported
when their document opens. Absent attachments, unsupported formulas and invalid diagrams retain
readable source. Original Markdown remains available below every document.

Prebuilt rendering libraries, fonts, licences and checksums live in `vendor/`. There is no build,
bundler or dependency installation. Mermaid loads on demand. Raw source HTML stays text; TeX
trust is disabled and Mermaid uses strict security.

Checks, run from the repository root:

```sh
python3 interface/tests/library.py
node interface/tests/library.mjs
bash interface/tests/traversal.sh
bash interface/tests/exposure.sh
```

Browser verification also covers section → subject → document, links between notes, ambiguous
destinations, search scope, source refresh, Back/reload, long documents with diagrams and readable
fallbacks. The test fixtures use their own temporary directories; knowledge notes are not edited.
