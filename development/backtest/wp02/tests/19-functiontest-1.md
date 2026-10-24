# Testbericht Funktionstest, Auftrag 19, Durchlauf 1

- Ergebnis: **bestanden**
- geprüfter Commit: `36d44790842a0f22bdd1bcc8df3e87ef2258bad5` (Zweig `backtest/wp02-19`)
- Rolle: Tester Funktion
- Prüfgrundlagen: Auftrag 19, Spezifikation 5.4, 5.6 (letzter Punkt), 10 (Speicherplatz), `docs/technical/development-test-security-rules.md`

## Prüfskript

`components/pipwerk-fetch-mt5/scripts/check` selbst ausgeführt: Exitcode 0. `uv sync --frozen`, pytest (1593 Fälle: 1553 bestanden, 40 überspringen sich selbst, davon 11 neu in `test_files_cleanup.py`), `ruff check`, `ruff format --check`, `mypy` (23 Dateien): alle bestanden.

## Prüfung gegen den Auftrag

| Punkt | Ergebnis | Fundstelle |
|---|---|---|
| Zwischendatei bei Erfolg, Fehler, Strg+C, Signal entfernt | erfüllt | `files.py` `write_file`: `except BaseException` entfernt die Datei, `OSError` wird `write_failed`, sonst wird weitergegeben. `cli.py` `_signals_as_interrupt`: `SIGTERM`, `SIGHUP`, `SIGBREAK` werden zu `KeyboardInterrupt`; Handler werden wiederhergestellt; im Nebenthread keine Änderung. |
| Aufräumen beim Start, nur Muster, nie fertige oder fremde Datei | erfüllt | `files.py` `remove_stale_temporaries`: `fullmatch` auf `\.pipwerk-fetch-mt5-[a-z0-9_]{8}\.tmp`, kein Verweis, kein Verzeichnis, Fehler werden übergangen. Das Muster passt zu `tempfile.mkstemp` (Zeichen `a-z0-9_`). Aufruf in `cli.main` nach der Prüfung des Aufrufs, vor dem Zugriff auf MetaTrader 5. |
| Meldung nur wenn etwas entfernt wurde | erfüllt | `cli.py`; Test `test_nothing_to_remove_says_nothing_about_it` |
| Bestehende Datei bleibt nach Abbruch unverändert | erfüllt | Tests `test_an_interruption_while_writing_…` und `test_ctrl_c_while_writing_leaves_only_finished_files` (Inhalt `old` bleibt, nur fertige Dateien im Verzeichnis) |
| Fertige Dateien bleiben, Exitcode 130, Meldung | erfüllt | `cli.py`; Test Strg+C; kein Widerspruch zur Spezifikation (5.4, 5.6 sagen dazu nichts Gegenteiliges) |
| Tests nach Auftrag Punkt 4 | erfüllt | Abbruch, Fehler, Aufräumen, fremde Dateien (auch Verweis, Verzeichnis, ähnliche Namen), `SIGTERM` im ganzen Aufruf, Handler zurückgesetzt |
| Nicht-Umfang eingehalten | erfüllt | Änderungen nur in `cli.py`, `files.py`, `tests/test_files_cleanup.py`, `docs/technical/pipwerk-fetch-mt5.md` |
| Programmierregeln | keine Beanstandung | `except ValueError, OSError:` ist mit Python `>=3.14` zulässig (Prüfskript besteht). |
| Technische Dokumentation | im Wesentlichen erfüllt | Verhalten, Namensmuster, Exitcode 130, Entscheidung 15, Grenze bei gleichzeitigen Aufrufen und Änderungsnachweis stehen in Abschnitt 3, 4, 14 und der Kopfzeile; Tabelle in Abschnitt 16 nachgeführt. Siehe Befund 1. |

## Befunde

Keine blockierenden Befunde. Zwei nicht blockierende:

1. **Veraltete Testzahl** (gering): `docs/technical/pipwerk-fetch-mt5.md` Zeile 248 nennt „1582 Fälle, davon 1542 bestanden“. Tatsächlich sind es 1593 und 1553 (11 neue Fälle). Die Zeile sollte nachgeführt werden.
2. **Enges Zeitfenster** (gering, nur zur Kenntnis): In `files.py` liegt zwischen `mkstemp` (Zeile 79) und dem `try` (Zeile 84) kein Schutz. Kommt dort genau eine Unterbrechung an, bleibt eine Datei nach dem Namensmuster liegen. Der nächste Aufruf räumt sie auf (Spezifikation 5.6 erfüllt). Keine Änderung nötig.

Nicht geprüft: Verhalten unter Windows (`SIGBREAK`, Umbenennen einer offenen Datei); nur Linux.
