# Testbericht Funktionstest, Auftrag 22, Durchlauf 1

- Ergebnis: **bestanden**
- geprüfter Commit: `eff54da67f9ceb56245de7a716795c72c968b111` (Zweig `backtest/wp02-22`, Basis `f9a8536ff2c4fa99da0f622f640c43e2f472c0dc`)
- Prüfskript: unverändert, keine Änderung, kein Prüfskript-Commit

## Prüfskript, Backend-Schritte (selbst ausgeführt, Einzelschritte von `components/pipwerk-replay/scripts/check`)

- `uv sync --frozen`: ok
- `pytest`: 987 bestanden, 1 übersprungen (Test nur für Windows), 135 s
- `ruff check`: ok; `ruff format --check`: 62 Dateien ok; `mypy`: keine Fehler in 62 Dateien
- `openapi.json` entspricht der Anwendung (`pipwerk_replay.contract --check`): ok
- Suche nach alten Namen und nach der entfernten Beschaffung: keine Treffer
- Frontend und Browsertest nicht ausgeführt (Oberfläche ist nicht Gegenstand, Auftrag 23)
- Ports wurden nicht gebraucht: die Backend-Schritte laufen ohne Ports und ohne Testumgebung

## Gegenstand

1. Eindeutiger Name und Anlegen (`file_keeping.py`): in Ordnung.
   - `os.link` der fertig geschriebenen Zwischendatei auf den Zielnamen. `FileExistsError` führt zur nächsten Nummer.
   - Die Vorabprüfung mit `os.path.lexists` wählt nur die Nummer. Sie erkennt Datei, Verzeichnis und Verweis, auch einen hängenden.
   - Endung ab dem letzten Punkt; ein Punkt am Anfang zählt nicht.
   - Kürzen vor der Nummer, in Bytes (`PC_NAME_MAX`) und in ganzen Zeichen.
   - Höchstzahl `MAX_NAME_ATTEMPTS` = 100, begründet; danach `KeepFailedError`.
   - Die Zwischendatei wird im `finally` immer entfernt, auch bei `KeyboardInterrupt`.
   - Im Pfad der behaltenen Dateien kommt kein `os.replace`, `rename` oder `Path.replace` vor (Suche und AST-Test).
2. `kept_as`: in Modell, Beispielen, Dienst und Beschreibung `openapi.json` (Pflichtfeld, `null` erlaubt) vorhanden. Der Test gegen die Beschreibung ist grün. Ein eigener Test lehnt eine Antwort ab, in der `kept` und `kept_as` nicht zusammenpassen.
3. Verzeichnisse gegeneinander: `directories.py` prüft sie auch im Basiscommit nicht. Es ist nichts zu entfernen, und der Code enthält keine solche Prüfung. Zwischendateien erkennt `is_temporary_name` am Namensmuster. Die Liste zeigt sie in keinem Verzeichnis, auch nicht über einen Verweis auf sie.
4. Tests (`tests/test_file_keeping.py`, 658 neue Zeilen, gegen das echte Backend): Alle Fälle aus Umfang 6 sind vorhanden und prüfen echt.
   - Gleichzeitigkeit: Threads mit `Barrier`, 6 Anfragen über die Web-API in 15 Runden, dazu 16 `keep_file`-Aufrufe in 25 Runden. Geprüft werden verschiedene Namen, Inhalte vollständig und keine Zwischendatei.
   - Wettlauf: Haken an `_taken` legt den Namen nach der Prüfung an. Ergebnis ist `x (2).csv`, die fremde Datei bleibt.
   - Höchstzahl: `os.link` liefert immer `FileExistsError`. Ergebnis ist 503, genau 100 verschiedene Nummern, nichts importiert, keine Datei.
   - Weitere Fälle: Verweise (Datei außerhalb, Verzeichnis, hängend), Verzeichnis als Name, zu lange Namen und Verzeichnisse ineinander.
   - Die bestehenden Tests zu „Ersetzen“ sind berichtigt (`test_import_directory.py`, `test_market_import.py`).
5. Dokumentation (`docs/technical/pipwerk-replay.md`, README) nennt Verfahren, Höchstzahl mit Begründung, `kept_as` und die Verzeichnisse; die Texte stimmen mit dem Code überein. Im Programmcode stehen keine festen Pfade, Namen oder Ports.

## Befunde

- Blockierend: keine.
- Hinweis: Eine hochgeladene Datei, deren Name mit `.pipwerk-replay-tmp-` beginnt, wird nicht behalten (`KeepFailedError` → 503). Das ist folgerichtig, weil der Name der Zwischendatei vorbehalten ist. Der Auftrag sagt dazu nichts, die Dokumentation könnte es einen Satz lang nennen.
- Hinweis: Auf einem Dateisystem ohne harte Verknüpfung wird nichts behalten. Das ist in der Dokumentation als gewollt begründet.
