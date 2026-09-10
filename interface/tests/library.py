"""Run from the repository root: python3 interface/tests/library.py."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('library_server', Path(__file__).resolve().parents[1] / 'server.py')
server = importlib.util.module_from_spec(spec)
spec.loader.exec_module(server)


class Library(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        for name in ('science', 'arts', 'private'):
            (self.root / name / 'topic').mkdir(parents=True)
            (self.root / name / 'topic/Index.md').write_text(f'---\naliases: ["Alias {name}"]\n---\n# {name}\n\nUnique {name} body.\n')
        (self.root / 'science/leak.md').symlink_to(self.root / 'private/topic/Index.md')
        (self.root / 'adapter.json').write_text(json.dumps({'root': '.', 'browse': ['science', 'arts'],
            'library': {'sections': [{'root': 'science', 'label': 'Science'}]}}))
        self.adapter = server.load_adapter(self.root / 'adapter.json')

    def test_exact_root_and_ambiguous_legacy_path(self):
        self.assertIn('Unique arts body.', server.read_file(self.adapter, 'topic/Index.md', 'arts')['body'])
        self.assertFalse(server.read_file(self.adapter, 'topic/Index.md')['available'])

    def test_root_is_an_allowlist_and_paths_stay_inside(self):
        for root, path in [('private', 'topic/Index.md'), ('science', '../private/topic/Index.md'),
                           ('science', '%2e%2e/private/topic/Index.md'), ('science', 'leak.md'),
                           ('science', str(self.root / 'private/topic/Index.md'))]:
            self.assertFalse(server.read_file(self.adapter, path, root)['available'], (root, path))

    def test_catalog_uses_adapter_sections_and_excludes_symlink(self):
        tree = server.tree(self.adapter)
        self.assertEqual(tree['sections'], [{'root': 'science', 'label': 'Science'}])
        self.assertEqual(len(tree['files']), 2)
        self.assertEqual(tree['files'][0]['aliases'], ['Alias science'])

    def test_library_search_does_not_include_other_browsable_rooms(self):
        self.assertEqual(server.search(self.adapter, 'arts', library=True)['hits'], [])
        self.assertEqual(len(server.search(self.adapter, 'Unique', library=True)['hits']), 1)
        self.assertEqual(len(server.search(self.adapter, 'Unique')['hits']), 2)
        self.assertTrue(server.search(self.adapter, 'Alias science', library=True)['hits'])

    def test_version_changes_when_text_changes_and_deletion_disappears(self):
        before = server.tree(self.adapter)['files'][0]['version']
        file = self.root / 'science/topic/Index.md'
        file.write_text('# Changed\n')
        self.assertNotEqual(server.tree(self.adapter)['files'][0]['version'], before)
        file.unlink()
        self.assertFalse(any(f['root'] == 'science' for f in server.tree(self.adapter)['files']))


if __name__ == '__main__':
    unittest.main()
