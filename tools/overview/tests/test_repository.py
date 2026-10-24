"""Aufruf gegen das Repository, in dem der Test liegt (Abnahmekriterium aus Auftrag 01)."""

from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

import generate

from .support import RepoCase
from .test_limits import EXTERNAL_RESOURCES, FORBIDDEN, scan

TOOL_DIRECTORY = Path(__file__).resolve().parent.parent
ROOT = TOOL_DIRECTORY.parent.parent
VORHABEN = "verfahren"


def git(*args: str) -> str:
    result = subprocess.run(
        ["git", "-C", str(ROOT), *args],
        capture_output=True,
        check=True,
        text=True,
    )
    return result.stdout


def state() -> tuple[str, str, str]:
    """Alles, was ein Lauf im Repository verändern könnte: Arbeitskopie, Zweige, Index."""
    return (
        git("status", "--porcelain", "--untracked-files=all"),
        git("for-each-ref"),
        git("rev-parse", "HEAD"),
    )


class OwnRepository(unittest.TestCase):
    """Der Test hängt nicht vom Stand des Vorhabens ab, nur davon, dass es in ``main`` steht."""

    def setUp(self) -> None:
        try:
            top = Path(git("rev-parse", "--show-toplevel").strip()).resolve()
            shallow = git("rev-parse", "--is-shallow-repository").strip() == "true"
            self.ref = generate.default_ref(ROOT)
        except (subprocess.CalledProcessError, FileNotFoundError, generate.GenerateError) as error:
            self.skipTest(f"Geschichte des Repositorys nicht verfügbar: {error}")
        if top != ROOT.resolve():
            self.skipTest("der Test liegt nicht in der Wurzel eines Git-Arbeitsverzeichnisses")
        if shallow:
            self.skipTest("flacher Klon: die Geschichte der Meldungen fehlt")
        scope = subprocess.run(
            ["git", "-C", str(ROOT), "show", f"{self.ref}:development/{VORHABEN}/scope.md"],
            capture_output=True,
            text=True,
            check=False,
        )
        if scope.returncode != 0:
            self.skipTest(f"{self.ref} enthält das Vorhaben {VORHABEN} nicht")
        name = generate.parse_name(scope.stdout)
        if name is None:
            self.skipTest(f"scope.md von {VORHABEN} enthält keine Zeile „Name:“")
        self.name = name

    def run_generate(self) -> tuple[str, tuple[str, str, str], tuple[str, str, str], list[str]]:
        with tempfile.TemporaryDirectory(prefix="overview-own-") as directory:
            output = Path(directory) / "overview.html"
            before = state()
            result = subprocess.run(
                [sys.executable, str(TOOL_DIRECTORY / "generate.py"), str(ROOT), str(output)],
                capture_output=True,
                text=True,
                check=False,
                cwd=directory,
            )
            after = state()
            self.assertEqual(result.returncode, 0, result.stderr)
            written = sorted(path.name for path in Path(directory).iterdir())
            return output.read_text(encoding="utf-8"), before, after, written

    def test_page_shows_the_vorhaben_and_keeps_the_limits(self) -> None:
        page, _before, _after, _written = self.run_generate()
        scanner = scan(page)
        self.assertIn(VORHABEN, scanner.ids)
        self.assertTrue(any(f"{VORHABEN}/{nr}" in scanner.ids for nr in range(1, 7)))
        self.assertTrue(any(self.name in text for text in scanner.texts), self.name)
        for name, pattern in FORBIDDEN.items():
            for item in [*scanner.texts, *scanner.values]:
                self.assertIsNone(pattern.search(item), f"{name}: {item!r}")
        self.assertIsNone(EXTERNAL_RESOURCES.search(page))
        self.assertNotRegex(page, r"https?:")

    def test_run_writes_only_the_output_file(self) -> None:
        _page, before, after, written = self.run_generate()
        self.assertEqual(written, ["overview.html"])
        self.assertEqual(before, after)


class DefaultRef(RepoCase):
    """Ohne ``--ref`` liest das Skript ``origin/main``, sonst ``main`` (Hinweis H2)."""

    def setUp(self) -> None:
        super().setUp()
        self.repo.scope("abc", "Probe")
        self.repo.commit()
        self.output = self.repo.root.parent / "overview.html"

    def test_without_origin_it_reads_main(self) -> None:
        self.assertEqual(generate.default_ref(self.repo.root), "main")

    def test_origin_main_wins_over_a_local_main_that_is_ahead(self) -> None:
        self.repo.git("update-ref", "refs/remotes/origin/main", "HEAD")
        self.repo.scope("zwei", "Nur lokal")
        self.repo.commit()
        self.assertEqual(generate.default_ref(self.repo.root), "origin/main")
        self.assertEqual(generate.main([str(self.repo.root), str(self.output)]), 0)
        text = self.output.read_text(encoding="utf-8")
        self.assertIn("Probe", text)
        self.assertNotIn("Nur lokal", text)

    def test_origin_main_alone_is_enough(self) -> None:
        self.repo.git("update-ref", "refs/remotes/origin/main", "HEAD")
        self.repo.git("branch", "-m", "main", "anders")
        self.assertEqual(generate.default_ref(self.repo.root), "origin/main")

    def test_explicit_ref_is_taken_as_given(self) -> None:
        self.repo.git("update-ref", "refs/remotes/origin/main", "HEAD")
        self.repo.scope("zwei", "Nur lokal")
        self.repo.commit()
        code = generate.main([str(self.repo.root), str(self.output), "--ref", "main"])
        self.assertEqual(code, 0)
        self.assertIn("Nur lokal", self.output.read_text(encoding="utf-8"))

    def test_neither_branch_ends_with_an_error(self) -> None:
        self.repo.git("branch", "-m", "main", "anders")
        with self.assertRaises(generate.GenerateError):
            generate.default_ref(self.repo.root)
