"""Erzeugt die Testseite für den Browsertest.

Das Skript legt in einem temporären Verzeichnis ein Test-Repository mit acht Vorhaben an
(alle Zeilen des Entwurfs: ohne Plan, mit Plan, wartend, Lücke in der Spezifikation, fertig,
ohne Meldung, sehr langer Name), lässt ``generate.py`` daraus die Seite erzeugen und schreibt
sie in die angegebene Datei. Aufruf: ``make_fixture.py <ausgabedatei>``. Das Skript berührt kein
anderes Repository.
"""

from __future__ import annotations

import shutil
import sys
import tempfile
from datetime import UTC, datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))

import generate  # noqa: E402
from tests.support import BASE, TestRepo  # noqa: E402

NOW = datetime(2026, 10, 24, 12, 0, 0, tzinfo=UTC)


def at(day: int, hour: int, minute: int) -> int:
    """Minuten seit ``BASE`` für einen Zeitpunkt im Oktober 2026."""
    moment = datetime(2026, 10, day, hour, minute, tzinfo=UTC)
    return int((moment - BASE).total_seconds() // 60)


def build(repo: TestRepo) -> None:
    repo.scope("verfahren", "Entwicklungsverfahren verbessern")
    repo.message("architect", at(10, 9, 0), "verfahren", "check")
    repo.message("architect", at(24, 9, 12), "verfahren", "specify")

    repo.scope("backtest", "Strategietester")
    repo.plan(
        "backtest",
        [
            ("wp01", "Kursdaten und Datenbestand", "", "done"),
            ("wp02", "Einzelschritt-Test", "`wp01`", "open"),
            ("wp03", "Backtest und Vergleich", "`wp02`", "open"),
        ],
    )
    repo.message("devlead", at(14, 9, 0), "backtest/wp01", "implement")
    repo.message("projectlead", at(17, 10, 0), "backtest/wp01", "integrated")
    repo.message("devlead", at(20, 9, 0), "backtest/wp02", "implement")
    repo.message("projectlead", at(23, 15, 0), "backtest/wp02", "acceptance")
    repo.waiting("backtest", [("backtest/wp02", "Abnahme durchführen", "2026-10-24T08:05:00Z")])

    repo.scope("strategiedesign", "Strategiedesigner")
    repo.plan(
        "strategiedesign",
        [
            ("wp01", "Grundgerüst", "", "done"),
            ("wp02", "Bearbeiten von Strategien", "`wp01`", "open"),
        ],
    )
    repo.message("projectlead", at(20, 11, 0), "strategiedesign/wp01", "integrated")
    repo.message("devlead", at(24, 7, 30), "strategiedesign/wp02", "implement")

    repo.scope("relay", "Verbindung zum Broker")
    repo.plan(
        "relay",
        [("wp01", "Abruf von Kursdaten", "", "open"), ("wp02", "Handel", "`wp01`", "open")],
    )
    repo.message("devlead", at(23, 10, 0), "relay/wp01", "implement")
    repo.message("architect", at(23, 16, 48), "relay/wp01", "amend")

    repo.scope("beispiel", "Neues Vorhaben")
    repo.message("architect", at(24, 8, 0), "beispiel", "check")
    repo.waiting("beispiel", [("beispiel", "Frage beantworten", "2026-10-24T09:05:00Z")])

    repo.scope("berichte", "Berichte")

    repo.scope("ablauftest", "Über-Dialog")
    repo.plan(
        "ablauftest",
        [("wp01", "Dialog anlegen", "", "done"), ("wp02", "Dialog anzeigen", "`wp01`", "done")],
    )
    repo.message("projectlead", at(12, 9, 0), "ablauftest/wp01", "integrated")
    repo.message("projectlead", at(14, 9, 0), "ablauftest/wp02", "integrated")

    repo.scope(
        "langname",
        "Donaudampfschifffahrtsgesellschaftskapitänsmützenüberarbeitungsvorhaben",
    )
    repo.plan(
        "langname",
        [("wp01", "Donaudampfschifffahrtsgesellschaftskapitänsmützenpaket", "", "open")],
    )
    repo.message("devlead", at(22, 9, 0), "langname/wp01", "implement")
    repo.commit("Testdaten")


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print("Aufruf: make_fixture.py <ausgabedatei>", file=sys.stderr)
        return 2
    output = Path(argv[1]).resolve()
    directory = Path(tempfile.mkdtemp(prefix="overview-browser-"))
    try:
        root = directory / "repo"
        root.mkdir()
        build(TestRepo(root))
        generate.generate(root, output, "main", NOW)
    finally:
        shutil.rmtree(directory, ignore_errors=True)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
