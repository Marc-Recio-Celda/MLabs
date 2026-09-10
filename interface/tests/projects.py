"""Run from the repository root: python3 interface/tests/projects.py."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('project_server', Path(__file__).resolve().parents[1] / 'server.py')
server = importlib.util.module_from_spec(spec)
spec.loader.exec_module(server)


class Projects(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        for name in ('sample', 'sample-extra'):
            (self.root / f'projects/group/{name}/nexus').mkdir(parents=True)
            self.write(f'{name}/objectives.md', f'# Objectives\n\n## What is deliberately not an objective\n\nWRONG-DEFINITION\n\n## Objectives\n\n{name}-OBJECTIVE\n')
            self.write(f'{name}/definition.md', f'# Definition\n\n## What It Is\n\n{name}-DEFINITION\n')
            self.write(f'{name}/axioms.md', '# Axioms\n\n## The board\n\n### Z9 · WRONG-PLAN\n')
            self.write(f'{name}/plan.md', f'''# Plan
**Last updated:** 2026-09-01 · **integrated through** `D12`
**Next action:** Read {name}'s own sources.
## The board
### A1 · Real block
| Id | Kind | What | Waits on | Status |
|---|---|---|---|---|
| **A1.1** | work | {name}-PLAN | — | pending |
''')
            self.write(f'{name}/Decision_Log.md', '# Decisions\n\n### D12 · A real decision\n')
        sources = [{'label': role, 'kind': 'standing', 'role': role,
                    'glob': f'projects/*/*/nexus/{filename}',
                    'project_from': r'projects/(?P<lab>[^/]+)/(?P<project>[^/]+)/nexus/'}
                   for role, filename in [('objectives', 'objectives.md'), ('axioms', 'axioms.md'),
                                          ('definition', 'definition.md'), ('plan', 'plan.md'),
                                          ('decisions', 'Decision_Log.md')]]
        (self.root / 'adapter.json').write_text(json.dumps({'root': '.', 'browse': ['projects'], 'sources': sources}))
        self.adapter = server.load_adapter(self.root / 'adapter.json')

    def write(self, suffix, text):
        name, filename = suffix.split('/', 1)
        (self.root / f'projects/group/{name}/nexus/{filename}').write_text(text)

    def projects(self):
        return [p for p in server.model.parse_adapter(self.root / 'adapter.json')['entities']
                if p['kind'] == 'project-state']

    def test_document_roles_compose_one_project(self):
        projects = self.projects()
        self.assertEqual(len(projects), 2)
        project = next(p for p in projects if p['project'] == 'sample')
        self.assertEqual(project['definition'], 'sample-DEFINITION')
        self.assertEqual([b['id'] for b in project['blocks']], ['A1'])
        self.assertEqual(project['integrated_through'], 'D12')
        self.assertEqual(project['last_updated'], '2026-09-01')
        self.assertEqual(len(project['documents']), 5)
        self.assertNotIn('WRONG-DEFINITION', project['definition'])

    def test_missing_metadata_is_not_guessed(self):
        self.write('sample/plan.md', '# Plan\n\nNo state metadata here.\n')
        project = next(p for p in self.projects() if p['project'] == 'sample')
        self.assertIsNone(project.get('last_updated'))
        self.assertIsNone(project.get('integrated_through'))
        self.assertIsNone(project.get('status'))
        self.assertIsNone(project.get('next_action'))

    def test_reader_is_scoped_to_exact_project(self):
        result = server.project_files(self.adapter, 'sample')
        self.assertTrue(result['available'])
        names = [f['path'] for f in result['files']]
        self.assertIn('nexus/objectives.md', names)
        document = server.project_file(self.adapter, 'sample', 'nexus/objectives.md')
        self.assertIn('sample-OBJECTIVE', document['body'])
        self.assertNotIn('sample-extra-OBJECTIVE', document['body'])
        self.assertFalse(server.project_file(self.adapter, 'sample', '../sample-extra/nexus/objectives.md')['available'])
        self.assertFalse(server.project_file(self.adapter, 'missing', 'nexus/plan.md')['available'])

    def test_objective_cards_preserve_fields_and_plan_keeps_source_status(self):
        self.write('sample/objectives.md', '# Objectives\n\n| Id | Objective | Met when |\n|---|---|---|\n| O1 | Exact objective | Exact acceptance |\n')
        doc = server.project_file(self.adapter, 'sample', 'nexus/objectives.md')
        self.assertEqual(doc['objectives'][0]['id'], 'O1')
        self.assertEqual(doc['objectives'][0]['fields'], [('Objective', 'Exact objective'), ('Met when', 'Exact acceptance')])
        plan = server.project_file(self.adapter, 'sample', 'nexus/plan.md')
        self.assertEqual(plan['blocks'][0]['subblocks'][0]['status_text'], 'pending')

    def test_other_markdown_and_containment(self):
        project = self.root / 'projects/group/sample'
        (project / 'notes').mkdir()
        (project / 'notes/experiment.md').write_text('# Experiment\nUseful context')
        (project / 'notes/code.py').write_text('not markdown')
        (project / 'notes/escape.md').symlink_to(self.root / 'projects/group/sample-extra/nexus/plan.md')
        names = [f['path'] for f in server.project_files(self.adapter, 'sample')['files']]
        self.assertIn('notes/experiment.md', names)
        self.assertNotIn('notes/escape.md', names)
        self.assertNotIn('notes/code.py', names)
        self.assertFalse(server.project_file(self.adapter, 'sample', 'notes/escape.md')['available'])

    def test_supporting_table_is_not_a_list_of_empty_plan_steps(self):
        path = self.root / 'projects/group/sample/nexus/plan.md'
        with path.open('a') as handle:
            handle.write('\n| Id | Finding | Result |\n|---|---|---|\n| F1 | Supporting evidence | Closed |\n')
        document = server.project_file(self.adapter, 'sample', 'nexus/plan.md')
        self.assertEqual([s['id'] for s in document['blocks'][0]['subblocks']], ['A1.1'])
        self.assertIn('Supporting evidence', document['body'])

    def test_duplicate_project_names_are_not_merged(self):
        other = self.root / 'projects/other/sample/nexus'
        other.mkdir(parents=True)
        (other / 'plan.md').write_text('# A different cartridge')
        self.assertFalse(server.project_files(self.adapter, 'sample')['available'])

    def test_outline_does_not_turn_code_examples_into_headings(self):
        self.write('sample/Decision_Log.md', '# Decisions\n\n```markdown\n### Dn template\n```\n\n### D12 Real decision\n')
        doc = server.project_file(self.adapter, 'sample', 'nexus/Decision_Log.md')
        self.assertEqual([h['title'] for h in doc['outline']], ['Decisions', 'D12 Real decision'])


if __name__ == '__main__':
    unittest.main()
