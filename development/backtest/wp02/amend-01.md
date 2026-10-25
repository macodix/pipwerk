# Lücke amend-01: „Dateien behalten“ bei gleichem Namen, gleiche oder ineinanderliegende Verzeichnisse

- Vorhaben: `backtest`, Arbeitspaket `wp02`, ref `backtest/wp02`
- von: Entwicklungsleiter
- an: Softwarearchitekt
- Grundlage: Antwort des Projektleiters vom 2026-10-25 in `development/backtest/questions/wp02-01.md` (Punkt 2); Hinweise der Tester in `tests/20-functiontest-1.md` und `tests/securitytest-4.md` auf dem Zweig `backtest/wp02`

## Entscheidung des Projektleiters (wörtlich)

Keine Einschränkung der Verzeichniswahl. Ablage- und Importverzeichnis dürfen gleich sein oder ineinander liegen. Eine vorhandene Datei wird beim Behalten nie ersetzt; bei gleichem Namen erhält die behaltene Datei einen eindeutigen Namen. Das gilt für jede vorhandene Datei im Ablageverzeichnis, nicht nur für Dateien aus dem Importverzeichnis. Ergänzung von 5.3 und 5.7.

## Widerspruch in der Spezifikation

- 5.6, Punkt „Dateien behalten“: „eine Datei gleichen Namens wird ersetzt“. Das widerspricht der Entscheidung und 5.3 („Dateien im Importverzeichnis nie verändert“), wenn Ablage- und Importverzeichnis gleich sind oder ineinander liegen: Die behaltene Datei ersetzt dann eine Datei im Importverzeichnis. Betroffen im Code: `file_keeping.py:67` (ersetzt), `directories.py:112-134` (Prüfung beim Speichern).
- 5.7 fordert beim Speichern keine Prüfung der Verzeichnisse gegeneinander, und das bleibt so (keine Einschränkung).

## Benötigte Ergänzung

1. 5.6: statt „eine Datei gleichen Namens wird ersetzt“: Das Backend ersetzt beim Behalten nie eine vorhandene Datei im Ablageverzeichnis, gleich welcher Herkunft. Bei gleichem Namen erhält die behaltene Datei einen eindeutigen Namen. Festzulegen sind: Bildung des eindeutigen Namens (etwa Zähler vor der Endung), Verhalten bei gleichzeitigen Vorgängen (Anlegen ohne Überschreiben, atomar), Name im Ergebnis je Datei (Feld `kept`, ob der tatsächliche Name genannt wird), Erklärung beim Zeigen.
2. 5.3 und 5.7: Ablage- und Importverzeichnis dürfen gleich sein oder ineinander liegen; Dateien im Importverzeichnis bleiben auch dann unverändert. Die behaltene Datei im selben Verzeichnis erscheint im Importverzeichnis als zusätzliche Datei (kein Fehler). Zwischendateien des Backends (5.6) erscheinen dort weiterhin nicht.
3. Abschnitt Prüfung (Zeilen zu 5.6 und 5.3): Testfälle „Ablage gleich Importverzeichnis“, „Ablage im Importverzeichnis“, „Importverzeichnis im Ablageverzeichnis“, „vorhandene Datei gleichen Namens bleibt unverändert“.
4. Plan: Abnahmekriterien 12 und 13 von `wp02` um diese Fälle ergänzen, soweit nötig.

## Stand der übrigen Arbeit (unabhängig von dieser Lücke, erledigt)

- Auftrag 21 (Playwright 1.64.1, Browsertests): Commit `7f388d4166325f4224c01c13ab969ad6e2248749`, Funktionstest bestanden (`tests/21-functiontest-1.md`), Prüfskript Exitcode 0, 127 von 127 Browsertests bestanden; zusammengeführt in den Arbeitszweig `backtest/wp02`.
- Nach `amended` folgen: Auftrag Backend (eindeutiger Name) und Oberfläche (Texte), Funktionstest, Sicherheitstest, Testumgebung neu starten, QA, `acceptance`.
