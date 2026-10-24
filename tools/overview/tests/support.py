"""Hilfen der Tests: ein Test-Repository, das die Tests selbst anlegen."""

from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
import unittest
from datetime import UTC, datetime, timedelta
from pathlib import Path

import generate

BASE = datetime(2026, 10, 1, 10, 0, 0, tzinfo=UTC)
NOW = datetime(2026, 10, 24, 12, 0, 0, tzinfo=UTC)

PLAN_TEMPLATE = """# Arbeitspaketplan

## Übersicht

| Paket | Titel | hängt ab von | Stand |
|---|---|---|---|
{rows}

{headings}
"""


def stamp(minutes: int) -> str:
    """Zeitpunkt im Dateinamen einer Meldung, ``minutes`` Minuten nach dem Anfang der Tests."""
    return f"{BASE + timedelta(minutes=minutes):%Y%m%d%H%M%S}"


def moment(minutes: int) -> datetime:
    return BASE + timedelta(minutes=minutes)


def plan_text(packages: list[tuple[str, str, str, str]]) -> str:
    """Plan mit Übersichtstabelle: (Kennung, Name, Abhängigkeiten, Stand)."""
    rows = "\n".join(
        f"| `{pid}` | {name} | {deps} | `{state}` |" for pid, name, deps, state in packages
    )
    headings = "\n".join(f"## {pid} – {name}\n\nText." for pid, name, _deps, _state in packages)
    return PLAN_TEMPLATE.format(rows=rows, headings=headings)


class TestRepo:
    """Ein Git-Repository mit Zweig ``main`` in einem eigenen Verzeichnis."""

    def __init__(self, directory: Path) -> None:
        self.root = directory
        self._env = {
            **os.environ,
            "GIT_CONFIG_GLOBAL": os.devnull,
            "GIT_CONFIG_SYSTEM": os.devnull,
        }
        self.git("init", "-q", "-b", "main")
        self.git("config", "user.name", "Test")
        self.git("config", "user.email", "test@example.invalid")
        self.git("config", "commit.gpgsign", "false")

    def git(self, *args: str) -> str:
        result = subprocess.run(
            ["git", "-C", str(self.root), *args],
            capture_output=True,
            check=True,
            env=self._env,
            text=True,
        )
        return result.stdout

    def write(self, path: str, content: str) -> None:
        target = self.root / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")

    def remove(self, path: str) -> None:
        self.git("rm", "-q", "-f", path)

    def commit(self, text: str = "Stand") -> None:
        self.git("add", "-A")
        self.git("commit", "-q", "--allow-empty", "-m", text)

    def scope(self, vorhaben: str, name: str | None = None) -> None:
        lines = [f"# Vorhaben {vorhaben}", ""]
        if name is not None:
            lines += [f"Name: {name}.", ""]
        lines.append("Festlegungen.")
        self.write(f"development/{vorhaben}/scope.md", "\n".join(lines) + "\n")

    def plan(self, vorhaben: str, packages: list[tuple[str, str, str, str]]) -> None:
        self.write(f"development/{vorhaben}/plan.md", plan_text(packages))

    def waiting(self, vorhaben: str, rows: list[tuple[str, str, str]]) -> None:
        lines = ["| ref | Handlung | Zeitpunkt (UTC) |", "|---|---|---|"]
        lines += [f"| `{ref}` | {handlung} | {zeit} |" for ref, handlung, zeit in rows]
        self.write(f"development/{vorhaben}/waiting.md", "\n".join(lines) + "\n")

    def message(
        self,
        recipient: str,
        minutes: int,
        ref: str,
        task: str,
        document: str = "development/x/specification.md",
        text: str = "Kurzer Text.",
        sender: str = "projectlead",
        seq: int = 1,
    ) -> str:
        path = f"development/messages/{recipient}/{stamp(minutes)}-{sender}-{seq:02d}.md"
        self.write(
            path,
            "# Meldung\n\n"
            f"- from: `{sender}`\n- ref: `{ref}`\n- task: `{task}`\n- document: `{document}`\n\n"
            f"{text}\n",
        )
        return path


class RepoCase(unittest.TestCase):
    """Basisklasse: legt je Test ein Repository an und räumt danach auf."""

    repo: TestRepo

    def setUp(self) -> None:
        self._directory = tempfile.mkdtemp(prefix="overview-test-")
        self.addCleanup(shutil.rmtree, self._directory, ignore_errors=True)
        root = Path(self._directory) / "repo"
        root.mkdir()
        self.repo = TestRepo(root)

    def overview(self) -> generate.Overview:
        return generate.build_overview(generate.Source(self.repo.root, "main"), NOW)

    def vorhaben(self, vorhaben_id: str) -> generate.VorhabenModel:
        for model in self.overview().vorhaben:
            if model.id == vorhaben_id:
                return model
        raise AssertionError(f"Vorhaben {vorhaben_id} fehlt in der Übersicht")

    def page(self) -> str:
        template = generate.TEMPLATE_PATH.read_text(encoding="utf-8")
        return generate.render_html(self.overview(), template)
