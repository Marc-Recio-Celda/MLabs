"""Run from the repository root: python3 interface/tests/task_sheets.py."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('office_server', Path(__file__).resolve().parents[1] / 'server.py')
server = importlib.util.module_from_spec(spec)
spec.loader.exec_module(server)


class TaskSheets(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        (self.root / 'work/plans').mkdir(parents=True)
        (self.root / 'projects/lab/sample/nexus').mkdir(parents=True)
        self.write('work/wall.md', '''# The task wall
## The wall
### ▶ `sample` · First task
**Serves** an objective · **Sheet** `plans/first.md`

Current activity begins here
and continues on the second line.

**Why it is committed** — a reason
that must not disappear.
**What it affects** — a first thing · **not** an inline field
and a second thing.
### ▶ `sample` · Second task
**Serves** another objective · **Sheet** `sample/nexus/plan.md A2.7`

A different current activity.
**Why it is committed** — another reason
**What it affects** — another thing
''')
        self.write('work/plans/first.md', '''# First sheet
**Task:** First task
**Now:** Read the first source.
## Items
1. Read the first source.
2. ~~Finish the previous item.~~ ✅ done — result.md
''')
        self.write('projects/lab/sample/nexus/plan.md', '''# Project plan
### A2 · Earlier work
| Id | What | Status |
|---|---|---|
| **A2.7** | SECOND-SHEET-ONLY | pending |
| **A2.70** | WRONG-NEIGHBOUR | pending |
### A3 · Unrelated
UNRELATED-BLOCK
''')
        self.write('work/retired.md', '# Retired global plan\n## Items\n1. WRONG-GLOBAL-PLAN\n')
        self.write('adapter.json', json.dumps({'root': '.', 'browse': ['work', 'projects'], 'sources': [
            {'label': 'Wall', 'kind': 'compass', 'path': 'work/wall.md'},
            {'label': 'Retired', 'kind': 'plan', 'path': 'work/retired.md'}]}))
        self.adapter = server.load_adapter(self.root / 'adapter.json')
        self.fronts = server.model.parse_adapter(self.root / 'adapter.json')['entities']
        self.fronts = [f for f in self.fronts if f['kind'] == 'front']

    def write(self, path, content):
        (self.root / path).write_text(content)

    def sheet(self, index=0):
        return server.task_sheet(self.adapter, self.fronts[index]['id'])

    def test_two_active_tasks_never_share_global_plan(self):
        first, second = self.sheet(), self.sheet(1)
        self.assertTrue(first['available'])
        self.assertEqual(first['current'], 'Read the first source.')
        self.assertEqual(len(first['items']), 2)
        self.assertTrue(first['items'][1]['struck'])
        self.assertIn('SECOND-SHEET-ONLY', second['body'])
        for sheet in (first, second):
            self.assertNotIn('WRONG-GLOBAL-PLAN', sheet['body'])
            self.assertNotIn('WRONG-NEIGHBOUR', sheet['body'])
            self.assertNotIn('UNRELATED-BLOCK', sheet['body'])
        self.assertEqual(second['items'], [])  # roadmap rows are not ordered task steps

    def test_wall_preserves_multiline_activity_and_fields(self):
        self.assertIn('continues on the second line', self.fronts[0]['description'])
        self.assertIn('must not disappear', self.fronts[0]['why'])
        self.assertIn('second thing', self.fronts[0]['affects'])

    def test_missing_task_or_sheet_never_falls_back(self):
        self.assertFalse(server.task_sheet(self.adapter, 'missing')['available'])
        (self.root / 'work/plans/first.md').unlink()
        self.assertFalse(self.sheet()['available'])

    def test_ambiguous_reference_is_reported(self):
        (self.root / 'projects/other/sample/nexus').mkdir(parents=True)
        self.write('projects/other/sample/nexus/plan.md', '# Other project')
        self.assertFalse(self.sheet(1)['available'])

    def test_symlink_escape_is_not_read(self):
        outside = self.root / 'secret.md'
        outside.write_text('PRIVATE-OUTSIDE')
        f = self.root / 'work/plans/first.md'
        f.unlink()
        f.symlink_to(outside)
        self.assertFalse(self.sheet()['available'])

    def test_letter_suffix_uses_the_shared_id_grammar(self):
        wall = (self.root / 'work/wall.md').read_text().replace('plan.md A2.7', 'plan.md A2.7a')
        self.write('work/wall.md', wall)
        roadmap = (self.root / 'projects/lab/sample/nexus/plan.md').read_text().replace('**A2.7**', '**A2.7a**')
        self.write('projects/lab/sample/nexus/plan.md', roadmap)
        self.assertIn('SECOND-SHEET-ONLY', self.sheet(1)['body'])
        self.assertNotIn('WRONG-NEIGHBOUR', self.sheet(1)['body'])

    def test_missing_fragment_does_not_return_whole_roadmap(self):
        self.write('projects/lab/sample/nexus/plan.md', '# A2.70 only\nWRONG-NEIGHBOUR')
        self.assertFalse(self.sheet(1)['available'])


if __name__ == '__main__':
    unittest.main()
