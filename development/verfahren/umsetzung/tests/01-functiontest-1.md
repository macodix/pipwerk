# Testbericht Tester Funktion: Auftrag 01 (Durchlauf 1)

- geprüfter Commit: `9981662d12542c6bfe41783c823d5aa9e2e11de2` (Zweig `verfahren/umsetzung-01`), im Arbeitsverzeichnis ausgecheckt und kontrolliert
- grundlage: Auftrag 01, `development/verfahren/specification.md` (E4, E5, 7.1 bis 7.3), Entwicklungs-, Test- und Sicherheitsregeln
- prüfskript: nicht geändert, kein Commit des Prüfskripts

## Ergebnis: nicht bestanden

Grund: Ein technisches Abnahmekriterium konnte ich nicht prüfen (Befund B1). Alle übrigen ausgeführten Prüfungen sind bestanden.

## Ausgeführte Prüfungen

| Prüfung | Ergebnis |
|---|---|
| `python3 -m unittest` in `tools/overview/` (über `uv`) | bestanden, 62 Tests, OK |
| `ruff check` | bestanden |
| `ruff format --check` | bestanden (10 Dateien) |
| `mypy --config-file mypy.ini generate.py tests` | bestanden, keine Fehler in 9 Dateien |
| Codeprüfung gegen 7.2: Tabellenzeilen, Bezugsmeldung, `waiting.md` (*), Vorhaben ohne Plan, Paket ohne Meldung („wartet“ mit Abhängigkeiten), `done`, Farben, Reihenfolge nach 7.4 Punkt 4 | keine Abweichung gefunden |
| Quelle allein `main` über `git`, nur lesend; Geschichte von `development/messages/` mit entfernten Meldungen | wie beschrieben umgesetzt |
| 7.3: Suche in Vorlage, Skript und README nach URLs, `src=`, `<link`, `@import`, absoluten Pfaden, Ports | keine Treffer (nur CSS-Maße); Meldungstexte werden nicht ausgegeben |
| Feste Pfade des Entwicklungsrechners im Code | keine gefunden |
| Technische Dokumentation `tools/overview/README.md` | vorhanden (100 Zeilen), passt zum Aufruf im Skript |
| Tests decken ab: Tabellenzeilen, `waiting.md`, Pakete, Vorhaben ohne Plan und ohne `scope.md`, Grenzen 7.3, Aufruf | vorhanden (`test_table`, `test_waiting`, `test_packages`, `test_vorhaben`, `test_limits`, `test_cli`) |

## Befunde

- **B1 (blockierend, Prüfung nicht ausführbar):** Das Abnahmekriterium „Aufruf gegen das Repository selbst erzeugt eine Datei, die für das Vorhaben `verfahren` den Stand ‚Umsetzung‘, gelb, bei ‚Team‘ zeigt“ ist ungeprüft. Der Aufruf von `generate.py` gegen das Arbeitsverzeichnis (Ausgabe nach `/tmp` und in das Arbeitsverzeichnis) wurde in meiner Sitzung von der Berechtigungsprüfung abgelehnt; ich habe das nicht umgangen. Die Unit-Tests ersetzen diese Prüfung nicht. Nachprüfung mit freigegebenem Aufruf nötig.
- Hinweis H1: Das Arbeitsverzeichnis wurde während der Prüfung von außen auf den Commit `d7a5bf5` (Zweig `verfahren/umsetzung-03`) umgesetzt. Ich habe wieder auf `9981662` gesetzt, danach vor und nach jedem Lauf den Commit kontrolliert. Ein anderer Prozess nutzt vermutlich dasselbe Verzeichnis.
- Hinweis H2: Der Aufruf gegen das Repository liest den lokalen Zweig `main` des gemeinsamen Repositorys, nicht `origin/main`. Ob beide gleich sind, habe ich nicht geprüft.
