"""Behavior regressions. All fixtures/output require an explicit evidence root.

Run: python3 -B test_discovery_paths.py SCRIPT EVIDENCE_DIRECTORY
"""
import importlib.util
import json
import os
import shutil
from pathlib import Path
import subprocess
import sys
import unittest
from unittest.mock import patch

SCRIPT = Path(sys.argv[1]).absolute()
ROOT = Path(sys.argv[2]).absolute()
sys.argv[1:] = []
ROOT.mkdir(parents=True, exist_ok=True)
SECRET = 'sk-' + 'A' * 24
BODY = 'BODY-CANARY-DO-NOT-EMIT'
ENV = 'ENV-CANARY-DO-NOT-EMIT'
BROKEN = 'BROKEN-TOML-DO-NOT-EMIT'


def put(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(value)
    return path


def agent(home, filename='normal.md'):
    return put(home / '.claude/agents' / filename,
               '---\nname: helper\nmodel: fixture-model\n---\n' + BODY)


class ScannerTests(unittest.TestCase):
    def setUp(self):
        self.root = ROOT / self._testMethodName
        self.root.mkdir()
        self.home = self.root / 'home'
        self.project = self.root / 'project'
        self.bin = self.root / 'bin'
        for path in (self.home, self.project, self.bin):
            path.mkdir()
        self.sequence = 0

    def fake(self, directory, name='dim'):
        marker = directory / (name + '-EXECUTED')
        binary = put(directory / name,
                     '#!/bin/sh\nprintf ran > ' + "'" + str(marker) + "'" +
                     '\nprintf \'[{"id":"fixture-cli","providerId":"fixture"}]\'\n')
        binary.chmod(0o700)
        return marker

    def run_scan(self, *, home=None, project=None, path=None, no_cli=True, extra=(), env_home=None):
        home = home or self.home
        argv = [sys.executable, '-B', str(SCRIPT), '--home', str(home),
                '--project', str(project or self.project)]
        if no_cli:
            argv.append('--no-cli')
        argv.extend(extra)
        env = {'HOME': str(env_home or self.home), 'PATH': str(path or self.bin),
               'PYTHONDONTWRITEBYTECODE': '1', 'LC_ALL': 'C'}
        proc = subprocess.run(argv, env=env, cwd=self.root, capture_output=True,
                              text=True, timeout=30)
        out = self.root / ('run-%02d' % self.sequence)
        self.sequence += 1
        out.mkdir()
        (out / 'stdout.txt').write_text(proc.stdout)
        (out / 'stderr.txt').write_text(proc.stderr)
        (out / 'command.json').write_text(json.dumps(
            {'argv': argv, 'cwd': str(self.root), 'env': env, 'exit_code': proc.returncode}, indent=2))
        return proc

    def data(self, **kwargs):
        proc = self.run_scan(**kwargs)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        result = json.loads(proc.stdout)
        self.assertEqual(result['schema_version'], 1)
        self.assertTrue(all(m['callable'] is None for m in result['models']))
        for canary in (BODY, ENV, BROKEN):
            self.assertNotIn(canary, proc.stdout + proc.stderr)
        return result, proc.stdout

    def test_nondirectory_path_scan(self):
        file = put(self.root / 'file', 'ordinary file')
        alias = self.root / 'file-link'
        alias.symlink_to('file')
        markers = [self.fake(self.bin, name) for name in ('codex', 'dim')]
        for node in (file, alias):
            for suffix in ('/../bin', '/./../bin', '/../bin/'):
                path = str(node) + suffix
                with self.subTest(path=path):
                    self.assertIsNone(shutil.which('codex', path=path))
                    data, _ = self.data(path=path, no_cli=False)
                    self.assertFalse(any(a['found'] for a in data['agents']['installed']))
                    self.assertEqual(data['diagnostics']['cli']['reason'], 'dim_not_on_path')
                    self.assertFalse(any(marker.exists() for marker in markers))
        data, _ = self.data(path=str(file) + '/../bin' + os.pathsep + str(self.bin),
                            no_cli=False)
        self.assertEqual(data['diagnostics']['cli']['binary'], str(self.bin / 'dim'))
        self.assertTrue(markers[1].exists())

    def test_checked_target_directory_components(self):
        spec = importlib.util.spec_from_file_location(
            'component_paths', SCRIPT.parent / 'discovery_paths.py')
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        file = put(self.root / 'file', 'ordinary file')
        alias = self.root / 'file-link'
        alias.symlink_to('file')
        directory_link = self.root / 'directory-link'
        directory_link.symlink_to('bin')
        target_with_dotdot = self.root / 'target-with-dotdot'
        target_with_dotdot.symlink_to('file/../bin')
        invalid = [str(node) + suffix for node in (file, alias)
                   for suffix in ('/', '/.', '/..', '/../bin', '/./../bin')]
        invalid.append(str(target_with_dotdot))
        for path in invalid:
            with self.subTest(path=path):
                with self.assertRaises(NotADirectoryError):
                    os.stat(path)
                self.assertEqual(module.checked_target(path, lambda _: False),
                                 (None, 'unavailable'))
        for path, expected in ((str(file), file), (str(alias), file),
                               (str(self.bin) + '/', self.bin),
                               (str(self.bin) + '/.', self.bin),
                               (str(self.bin) + '/..', self.root),
                               (str(directory_link) + '/../file', file)):
            with self.subTest(path=path):
                os.stat(path)
                self.assertEqual(module.checked_target(path, lambda _: False),
                                 (str(expected), None))

    def test_path_canaries_and_values(self):
        home = self.root / SECRET / 'home'
        project = self.root / ('ghp_' + 'B' * 20) / 'project'
        agent(home, SECRET + '.md')
        agent(project, SECRET + '.md')
        put(home / '.codex/config.toml', 'model = "' + BROKEN)
        put(home / '.claude/settings.json', json.dumps({'model': 'normal-model', 'env': {'KEY': ENV}}))
        put(home / '.claude/agents/rejected.md', '---\nname: helper\nmodel: ' + SECRET + '\n---\n')
        data, raw = self.data(home=home, project=project)
        self.assertNotIn(SECRET, raw)
        self.assertNotIn('ghp_' + 'B' * 20, raw)
        self.assertEqual(len(data['agents']['defined']), 3)
        self.assertIn('fixture-model', raw)
        self.assertIn('<redacted>', data['agents']['defined'][0]['path'])
        self.assertTrue(data['diagnostics']['parse_errors'])
        self.assertGreater(data['diagnostics']['secret_rejections'], 0)

    def test_installed_and_cli_path_redaction(self):
        directory = self.root / SECRET / 'bin'
        marker = self.fake(directory)
        data, raw = self.data(path=directory, no_cli=False)
        self.assertTrue(marker.exists())
        self.assertTrue(data['diagnostics']['cli']['ran'])
        self.assertNotIn(SECRET, raw)
        self.assertIn('<redacted>', data['diagnostics']['cli']['binary'])

    def test_forbidden_only(self):
        for part in ('.cursor', 'cursor'):
            directory = self.root / part / 'bin'
            marker = self.fake(directory, 'codex')
            data, raw = self.data(path=directory)
            self.assertFalse(any(a['found'] for a in data['agents']['installed']))
            self.assertNotIn(str(directory), raw)
            self.assertFalse(marker.exists())
            self.assertGreater(data['diagnostics']['path_lookup_rejections']['forbidden_path'], 0)

    def test_forbidden_dim_not_executed(self):
        directory = self.root / '.cursor/bin'
        marker = self.fake(directory)
        data, raw = self.data(path=directory, no_cli=False)
        self.assertFalse(marker.exists())
        self.assertFalse(data['diagnostics']['cli']['ran'])
        self.assertEqual(data['diagnostics']['cli']['reason'], 'dim_not_on_path')
        self.assertNotIn(str(directory), raw)

    def test_mixed_path(self):
        blocked = self.root / '.cursor/bin'
        bad = self.fake(blocked)
        good = self.fake(self.bin)
        data, raw = self.data(path=str(blocked) + os.pathsep + str(self.bin), no_cli=False)
        self.assertTrue(good.exists())
        self.assertFalse(bad.exists())
        self.assertEqual(data['diagnostics']['cli']['binary'], str(self.bin / 'dim'))
        self.assertNotIn(str(blocked), raw)

    def test_clean_and_no_cli_and_home_override(self):
        markers = [self.fake(self.bin, name) for name in ('dim', 'codex', 'claude', 'opencode', 'ollama', 'lms')]
        agent(self.home)
        data, _ = self.data()
        self.assertTrue(all(a['found'] for a in data['agents']['installed']))
        self.assertFalse(any(p.exists() for p in markers))
        other = self.root / 'other-home'
        other.mkdir()
        data, _ = self.data(home=other, no_cli=False)
        self.assertEqual(data['diagnostics']['cli']['reason'], 'home_override_is_not_real_home')
        self.assertFalse(any(p.exists() for p in markers))
        data, _ = self.data(no_cli=False)
        self.assertTrue(markers[0].exists())
        self.assertFalse(any(p.exists() for p in markers[1:]))
        self.assertEqual(data['diagnostics']['cli']['reason'], 'ok')
        self.assertEqual(data['models'][0]['id'], 'fixture-model')

    def test_path_symlinks(self):
        blocked = self.root / '.cursor/bin'
        bad = self.fake(blocked)
        alias = self.root / 'alias-bin'
        alias.symlink_to(blocked)
        data, raw = self.data(path=alias, no_cli=False)
        self.assertFalse(bad.exists())
        self.assertFalse(data['diagnostics']['cli']['ran'])
        (self.bin / 'dim').symlink_to(blocked / 'dim')
        data, _ = self.data(no_cli=False)
        self.assertFalse(bad.exists())
        self.assertFalse(data['diagnostics']['cli']['ran'])
        cellar = self.root / 'Cellar/dim/1/bin'
        good = self.fake(cellar)
        (self.bin / 'dim').unlink()
        (self.bin / 'dim').symlink_to('../Cellar/dim/1/bin/dim')
        data, _ = self.data(no_cli=False)
        self.assertTrue(good.exists())
        self.assertTrue(data['diagnostics']['cli']['ran'])

    def test_no_forbidden_target_access(self):
        sys.path.insert(0, str(SCRIPT.parent))
        helper = SCRIPT.parent / 'discovery_paths.py'
        self.assertTrue(helper.exists(), 'baseline lacks safe lookup')
        spec = importlib.util.spec_from_file_location('paths_under_test', helper)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        blocked = self.root / '.cursor/bin'
        self.fake(blocked)
        alias = self.root / 'alias'
        alias.symlink_to(blocked)
        executable = self.bin / 'dim'
        executable.symlink_to(blocked / 'dim')
        forbidden = lambda p: bool(set(str(p).lower().split('/')) & {'.cursor', 'cursor'})
        calls = []
        def watched(original):
            def check(path, *args, **kwargs):
                self.assertFalse(forbidden(path), 'touched forbidden lexical path')
                calls.append(str(path))
                return original(path, *args, **kwargs)
            return check
        with patch.object(module.os, 'lstat', watched(os.lstat)), \
             patch.object(module.os, 'stat', watched(os.stat)), \
             patch.object(module.os, 'access', watched(os.access)):
            for candidate in (blocked / 'dim', alias / 'dim', executable):
                target, reason = module.checked_target(str(candidate), forbidden)
                self.assertIsNone(target)
                self.assertIn('forbidden', reason)
        self.assertNotIn(str(alias / 'dim'), calls)
        target, reason = module.checked_target(str(alias) + '/../bin/dim', forbidden)
        self.assertIsNone(target)
        self.assertEqual(reason, 'forbidden_symlink_target')

    def test_root_and_descendant_symlinks(self):
        agent(self.home)
        alias = self.root / 'ancestor'
        alias.symlink_to(self.root)
        data, raw = self.data(home=alias / 'home', no_cli=False)
        self.assertIn('fixture-model', raw)
        self.assertEqual(data['diagnostics']['cli']['reason'], 'home_override_is_not_real_home')
        root_link = self.root / 'root-link'
        root_link.symlink_to(self.home)
        data, _ = self.data(home=root_link)
        self.assertFalse(data['agents']['defined'])
        alternate = self.root / 'alternate'
        alternate.mkdir()
        (alternate / '.claude').symlink_to(self.home / '.claude')
        data, _ = self.data(home=alternate)
        self.assertFalse(data['agents']['defined'])
        nested = self.root / 'nested'
        (nested / '.claude').mkdir(parents=True)
        (nested / '.claude/agents').symlink_to(self.home / '.claude/agents')
        data, _ = self.data(home=nested)
        self.assertFalse(data['agents']['defined'])
        final = self.home / '.claude/agents/link.md'
        final.symlink_to(self.home / '.claude/agents/normal.md')
        data, _ = self.data()
        self.assertEqual(len(data['agents']['defined']), 1)
        self.assertTrue(data['diagnostics']['skipped']['symlinks'])

    def test_error_output(self):
        blocked = put(self.root / SECRET, 'not a directory')
        proc = self.run_scan(extra=('--output', str(blocked / 'out.json')))
        self.assertNotEqual(proc.returncode, 0)
        self.assertNotIn(SECRET, proc.stdout + proc.stderr)
        self.assertIn('FileExistsError', proc.stderr)
        proc = self.run_scan(extra=('--unknown', str(blocked)))
        self.assertEqual(proc.returncode, 2)
        self.assertNotIn(SECRET, proc.stdout + proc.stderr)


if __name__ == '__main__':
    unittest.main(verbosity=2)
