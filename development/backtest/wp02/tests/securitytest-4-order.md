# Prüfauftrag Sicherheitstest, Arbeitspaket wp02, Durchlauf 4

- Vorhaben: `backtest`
- Arbeitspaket: `wp02`
- Rolle: Tester Sicherheit
- zu prüfender Commit: `66cf5c77310e3ce95cbc11872b8c93fb057a7c04` (Zweig `backtest/wp02`, Aufträge 18, 19 und 20 zusammengeführt)
- Aufträge: `development/backtest/wp02/orders/18.md` bis `20.md` auf dem Zweig `backtest/wp02`

## Gegenstand

Durchlauf 3 (`tests/securitytest-3.md`) galt dem Commit `ae414f2bb94ad6e06469e6087bc3d200f985c6ac`. Prüfe die Änderungen seit diesem Commit (`git diff ae414f2bb94ad6e06469e6087bc3d200f985c6ac 66cf5c77310e3ce95cbc11872b8c93fb057a7c04`, ohne `development/`) nach BSI-Grundschutz, OWASP und den Sicherheitsregeln in `docs/technical/development-test-security-rules.md` und Abschnitt 11 der Spezifikation, und ob sie bisher bestandene Prüfungen verschlechtern. Schwerpunkte:

- Importverzeichnis (`import-directory`, `import-directory/preview`, `import-processes/{id}/directory-files`): Pfadauflösung (`..`, absolute Pfade, symbolische Verweise nach außen, Verzeichnis statt Datei, Sonderdateien wie Geräte und Pipes, Wettlauf zwischen Prüfung und Öffnen), nie schreiben, entfernen oder verschieben, Informationsabfluss in Listen und Fehlerantworten (Pfade des Servers), Begrenzung der Antwort, Rechenzeit bei großen Verzeichnissen.
- Einstellungen (`/api/replay/settings/files`): Prüfung der Verzeichnisse, Anlegen von Verzeichnissen beim Speichern (Wirkung auf das Dateisystem, Berechtigung), Erreichbarkeit nur auf dem internen Weg, Fehlerantworten.
- Dateien behalten: Dateiname (Bereinigung, `.`/`..`, Namen mit Pfadanteilen, Zwischendatei-Präfix), Schreiben im Ablageverzeichnis (Verweise, Ersetzen, Rechte), Zwischendateien bei Fehler und Absturz, Speicherplatz (Dauerbelastung), kein Rest ohne „Dateien behalten“.
- Platz der Datenbank: `auto_vacuum`, `VACUUM` beim Start (Dauer, Speicherbedarf), `incremental_vacuum` (Dauer unter Transaktionen).
- Oberfläche: Ansicht „Einstellungen“ und Auswahl im Importverzeichnis (Namen als Text, nie als HTML), Abhängigkeiten (`npm audit`, `pip-audit`).
- `pipwerk-fetch-mt5`: Entfernen von Zwischendateien beim Start (nur Muster, nie fremde Dateien), Signalbehandlung.
- Keine Zugangsdaten, Rechnernamen, Benutzernamen oder Pfade des Entwicklungsrechners im Repository.

Beachte die Regeln „Umfang der Prüfungen“ (Nachprüfung der Änderungen, nur blockierende Befunde verhindern das Bestehen, Bericht höchstens etwa 60 Zeilen). Lege Wegwerfdateien nur im Berichtsverzeichnis an, nie in einem Git-Arbeitsverzeichnis.

## Prüfgrundlagen

- `development/backtest/wp02/orders/18.md` bis `20.md`, `development/backtest/wp02/tests/securitytest-3.md`, die Berichte `tests/18-functiontest-1.md`, `19-functiontest-1.md`, `20-functiontest-1.md`, `20-functiontest-2.md`
- `development/backtest/specification.md`, Abschnitte 5, 7, 11
- `docs/technical/development-test-security-rules.md`, `docs/technical/pipwerk-replay.md`, `docs/technical/pipwerk-marketdata.md`, `docs/technical/pipwerk-fetch-mt5.md`
- Briefing Tester Sicherheit in `docs/technical/agentenrollen-und-briefings.md`
- Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`

Hinweis aus dem Funktionstest (kein Auftrag zum Ändern): Ablage- und Importverzeichnis können dasselbe Verzeichnis sein; „Dateien behalten“ ersetzte dann eine gleichnamige Datei im Importverzeichnis (`file_keeping.py`, `directories.py`). Bewerte es nach Sicherheit.

## Ablage

Schreibe den Testbericht ohne Commit als Datei `securitytest-4.md` in das Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/backtest/wp02/reports/`. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig und alle Befunde mit Fundstelle.
