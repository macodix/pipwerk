"""Aufruf: liest nur, schreibt nur die Ausgabedatei."""

from __future__ import annotations

import io
import subprocess
import sys
from contextlib import redirect_stderr
from pathlib import Path

import generate

from .support import NOW, RepoCase

SCRIPT = Path(generate.__file__).resolve()


class CommandLine(RepoCase):
    def setUp(self) -> None:
        super().setUp()
        self.repo.scope("abc", "Probe")
        self.repo.message("devlead", 1, "abc", "implement")
        self.repo.commit()
        self.output = self.repo.root.parent / "overview.html"

    def test_writes_only_the_output_file(self) -> None:
        head = self.repo.git("rev-parse", "HEAD")
        status = self.repo.git("status", "--porcelain")
        code = generate.main(
            [str(self.repo.root), str(self.output), "--now", "2026-10-24T12:00:00Z"]
        )
        self.assertEqual(code, 0)
        self.assertTrue(self.output.is_file())
        self.assertEqual(self.repo.git("status", "--porcelain"), status)
        self.assertEqual(self.repo.git("rev-parse", "HEAD"), head)
        self.assertEqual(self.output.read_text(encoding="utf-8"), self.page())

    def test_runs_as_a_script(self) -> None:
        result = subprocess.run(
            [sys.executable, str(SCRIPT), str(self.repo.root), str(self.output)],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        text = self.output.read_text(encoding="utf-8")
        self.assertIn("Stand der Vorhaben", text)
        self.assertIn('id="abc/4"', text)

    def test_same_input_same_output(self) -> None:
        arguments = [str(self.repo.root), str(self.output), "--now", "2026-10-24T12:00:00Z"]
        generate.main(arguments)
        first = self.output.read_bytes()
        generate.main(arguments)
        self.assertEqual(self.output.read_bytes(), first)

    def test_not_a_repository_ends_with_an_error(self) -> None:
        empty = self.repo.root.parent / "leer"
        empty.mkdir()
        errors = io.StringIO()
        with redirect_stderr(errors):
            code = generate.main([str(empty), str(self.output)])
        self.assertEqual(code, 1)
        self.assertIn("Fehler", errors.getvalue())
        self.assertFalse(self.output.exists())

    def test_missing_branch_ends_with_an_error(self) -> None:
        errors = io.StringIO()
        with redirect_stderr(errors):
            code = generate.main([str(self.repo.root), str(self.output), "--ref", "gibtesnicht"])
        self.assertEqual(code, 1)

    def test_repository_without_commits_ends_with_an_error(self) -> None:
        other = self.repo.root.parent / "ohnecommits"
        other.mkdir()
        subprocess.run(["git", "-C", str(other), "init", "-q", "-b", "main"], check=True)
        with self.assertRaises(generate.GenerateError):
            generate.Source(other, "main")

    def test_repository_without_vorhaben_gives_an_empty_overview(self) -> None:
        self.repo.remove("development/abc/scope.md")
        self.repo.commit()
        self.assertEqual(
            generate.build_overview(generate.Source(self.repo.root, "main"), NOW).vorhaben, []
        )
