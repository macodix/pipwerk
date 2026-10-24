# Testbericht Funktionstest, Auftrag 16, Durchlauf 1

- Ergebnis: **bestanden**
- geprüfter Commit: `4a30a147130032f3c2c02b18fa63d64a4bf20154` (Zweig `backtest/wp02-16`), im Arbeitsverzeichnis ausgecheckt und mit `git rev-parse HEAD` bestätigt
- Commit des Prüfskripts: `4a30a147130032f3c2c02b18fa63d64a4bf20154` (Prüfskript unverändert, kein eigener Zweig `-functiontest`)
- Auftrag: `development/backtest/wp02/orders/16.md`; Gegenstand: `docs/technical/pipwerk-fetch-mt5.md`, Abschnitte 10 und 16

## Prüfskript

`components/pipwerk-fetch-mt5/scripts/check` (absoluter Pfad): Exitcode 0. `uv sync --frozen`, pytest (1542 bestanden, 40 übersprungen, 1582 gesammelt, passt zu Abschnitt 13), `ruff check`, `ruff format --check`, `mypy` bestanden. `--with-audit` nicht ausgeführt (kein Netz; Auftrag verlangt es nicht).

## Abgleich mit `uv.lock` und `pyproject.toml`

- `requires-python = ">=3.14,<3.15"` in `pyproject.toml`, `requires-python = "==3.14.*"` in `uv.lock` (Zeile 2): konsistent, kein Befund.
- 32 Einträge `[[package]]` in `uv.lock` gezählt; 9 (Komponente und 8 Pakete) in der Tabelle 16.3 plus 23 in der Liste „nicht von `install.cmd` installiert“ ergeben 32. Jede Version stimmt mit `uv.lock` überein (alle 32 einzeln verglichen). Nichts steht im Text, was nicht in `uv.lock` steht.
- Größen der Räder (win_amd64 bzw. `any`, cp314) in 16.3 stimmen mit `size` in `uv.lock` überein; Summe 15 690 064 Byte nachgerechnet.
- Abhängigkeiten: `pydantic` → `annotated-types`, `pydantic-core`, `typing-extensions`, `typing-inspection` (Zeilen 404 bis 409); `MetaTrader5` → `numpy` (Zeile 242). Stimmt. `MetaTrader5` hat nur ein Rad `cp314-cp314-win_amd64`, keine Quelldatei (Zeile 246). Stimmt mit der Begründung in 16.2 und Entscheidung 14.
- `hatchling==1.32.4` in `[build-system]`, nicht in `uv.lock`: stimmt.
- Skripte: `install.cmd` und `fetch.cmd` enthalten genau je einen `uv`-Befehl wie in 16.1 wiedergegeben; `.venv` laut Kommentar `install.cmd` Zeilen 4 und 5. Messwert 0,25 s: eigener Lauf von `uv run --frozen pipwerk-fetch-mt5 --help`, `real 0m0.240s`, `uv 0.5.9` bestätigt.
- Kein Modul in `src/` importiert `socket`, `http`, `ssl`, `asyncio`, `urllib` oder `requests` (Suche ohne Treffer). Keine Pfade des Entwicklungsrechners, keine Zugangsdaten im neuen Text. Nicht ausführbare Angaben (Windows, Verhalten von `uv`) sind als abgeleitet und nicht ausgeführt gekennzeichnet. `README.md` widerspricht dem neuen Text nicht (nennt keine Python-Version).

## Befunde

Blockierende Befunde: keine.

Hinweise (verhindern das Bestehen nicht):

- H1: `docs/technical/pipwerk-fetch-mt5.md`, Zeile 181 (Abschnitt 10, Schritt 3) sagt „Python (mindestens 3.14)“, und Zeile 373 (16.6) „kein Python ≥ 3.14“. Nach `requires-python` ist es genau 3.14.x (`>=3.14,<3.15`). Widerspricht Abschnitt 16.2 und Entscheidung 14.
- H2: Zeile 311 (16.1) belegt „kein Eintrag in der Registrierung, kein Dienst, keine geplante Aufgabe, kein Autostart, keine Änderung von `PATH`“ mit „Kommentar in `install.cmd`, Zeilen 4 bis 6“. Der Kommentar (Zeilen 6 und 7) sagt nur, dass das Python des Systems unverändert bleibt. Die übrigen Aussagen folgen nur aus dem einen `uv`-Befehl. Beleg und Zeilen anpassen.
- H3: Zeile 321 nennt als Quelle aller 32 Einträge `https://pypi.org/simple`; die Komponente selbst und `pipwerk-marketdata` sind Pfadquellen (im selben Satz richtig genannt). Die Zahl „alle“ ist dadurch ungenau (30 Einträge von PyPI). Kleiner Wortfehler.
- H4: 16.3 nennt für `alembic` und `sqlalchemy` „Datenbank dieser Tests“; `uv.lock` bindet `alembic` über `pipwerk-marketdata` (Zeile 367). Zweck ist im Text als nicht aus der Sperrdatei gekennzeichnet; kein Fehler.

Hinweis zum Arbeitsverzeichnis: Die ungetrackte Datei `probe_ft11.py` im Wurzelverzeichnis stammt nicht aus dieser Prüfung und wurde nicht angefasst.
