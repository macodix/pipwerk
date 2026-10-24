# Prüfauftrag QA, Arbeitspaket wp02, Durchlauf 3

- Vorhaben: `backtest`
- Arbeitspaket: `wp02`
- Rolle: QA
- zu prüfender Commit: `ae414f2bb94ad6e06469e6087bc3d200f985c6ac` (Arbeitszweig `backtest/wp02`, Aufträge 15 bis 17 zusammengeführt; spätere Commits des Zweigs ändern nur Dateien unter `development/`)
- Testumgebung: läuft aus dem Arbeitsverzeichnis `test/backtest-wp02/` im Entwicklungsverzeichnis auf genau diesem Commit, gestartet mit `components/pipwerk-replay/scripts/testenv start --frontend-port 5175 --backend-port 8002`. Oberfläche: `http://127.0.0.1:5175/`. Backend: `127.0.0.1:8002`. Die Datenbank ist leer. Ein echtes MetaTrader 5 steht nicht zur Verfügung.

## Gegenstand

Der Auftraggeber hat `wp02` in der Abnahme (Versuch 2, `development/backtest/wp02/acceptance/2.md`) nicht abgenommen. Behoben sind die Mängel M1, M2, M3, M5 und M6; M4 (große Dateien) ist zurückgestellt, es gilt die Grenze je Datei nach Spezifikation 5.3. Prüfe das Arbeitspaket `wp02` aus Kundensicht nach den Abnahmekriterien 1 bis 10 in `development/backtest/plan.md`, Abschnitt `wp02`, und die Verständlichkeit und Vollständigkeit der Anwenderdokumentation `docs/user/pipwerk-replay.md` und der technischen Dokumentation `docs/technical/pipwerk-fetch-mt5.md` (Kriterium 10). Prüfe vollständig (neue Fassung des Plans), besonders die Mängel M1, M2, M3, M5 und M6 wörtlich nach dem Abnahmebericht:

- M1: Abschnitt zu `uv` in der Anwenderdokumentation (ein Satz, was es ist und wozu; Installation unter Windows mit Befehl und Prüfung `uv --version`; nur Schritte des Anwenders). Der Windows-Befehl konnte auf dem Entwicklungsrechner nicht gegen die offizielle Anleitung von `uv` abgeglichen werden; gleiche ihn mit deinem Wissen ab und nenne im Bericht, wenn er davon abweicht oder ungeprüft bleibt.
- M2: `docs/technical/pipwerk-fetch-mt5.md` beschreibt vollständig, was auf dem Rechner von MetaTrader 5 installiert wird und läuft.
- M3: Viele Dateien (zusammen größer als die Grenze je Datei) in einem Vorgang, ein Klick auf „Importieren“, keine Meldung zu Gesamtgröße oder Zahl, Stand je Datei, Abbrechen.
- M5: Löschen in den vier Formen mit Rückfrage, Broker verschwindet mit seinen Daten, „Broker für Testläufe“ danach nicht gewählt, Anwenderdokumentation.
- M6: Weihnachten und Silvester/Neujahr keine Lücken (innerhalb einer Datei und zwischen zwei Dateien), ein nicht importierter Handelstag ist eine Lücke.

Hinweise zur Durchführung:

- Starte, beende oder verändere die Testumgebung in `test/backtest-wp02/` nicht. Sie bleibt für die Abnahme durch den Auftraggeber stehen. Arbeite in deiner eigenen Umgebung im Arbeitsverzeichnis `work/backtest/wp02/qa/` auf demselben Commit mit anderen, freien Ports und eigener Datenbank (eigenes `testenv`), und prüfe in der Testumgebung nur, dass sie läuft und die Oberfläche sich zeigt.
- Stelle die Kerzen-Dateien (CSV im Exportformat von MetaTrader 5, JSON nach `contracts/market-data/v1/`, eine fehlerhafte Datei) selbst her. Für die Größe: Beginne mit dem Backend in deiner Umgebung mit der Grenze je Datei der Beispielkonfiguration; ist es zu aufwendig, 32 MiB überschreitende Gesamtgrößen herzustellen, setze `max_upload_bytes` in deiner eigenen Startkonfiguration niedrig und nenne das im Bericht.
- Kriterium 3: MetaTrader 5 steht nicht zur Verfügung. Prüfe die Beschreibung von Einrichtung und Aufruf von `pipwerk-fetch-mt5` auf Verständlichkeit und Vollständigkeit und führe das Prüfskript `components/pipwerk-fetch-mt5/scripts/check` aus; die Einschränkung nennst du im Bericht.
- Kriterium 4 und 5: Neustart des Backends in deiner Umgebung, Wiederkehr des Standard-Testkontos; sechs Fenstergrößen 390 × 844, 844 × 390, 820 × 1180, 1180 × 820, 1366 × 768 und 1920 × 1080, Deutsch und Englisch.
- Technische Nachweise: Prüfskripte `components/pipwerk-replay/scripts/check` (Installation und Browsertests im Hintergrund), `packages/market-data/scripts/check`, `components/pipwerk-fetch-mt5/scripts/check` in deinem Arbeitsverzeichnis; positive Testberichte für die Aufträge 15, 16, 17 und den Sicherheitstest (`development/backtest/wp02/tests/` auf dem Arbeitszweig: `15-functiontest-1.md`, `16-functiontest-1.md`, `17-functiontest-1.md`, `securitytest-3.md`).
- Beachte die Regeln „Umfang der Prüfungen“: vollständiger Durchlauf, nur blockierende Befunde verhindern das Bestehen, Bericht höchstens etwa 60 Zeilen.

## Prüfgrundlagen

- `development/backtest/plan.md`, Abschnitt `wp02`
- `development/backtest/wp02/acceptance/2.md`
- `development/backtest/scope.md` und die dort genannten Dokumente des Auftraggebers (req-system-025, req-system-026, req-system-027, req-test-003)
- `development/backtest/specification.md` (5.1, 5.2, 5.3, 5.5, 8.3 Zeile „Datenbestand“, 12)
- `development/backtest/prototype/README.md`
- `docs/user/pipwerk-replay.md`, `docs/technical/pipwerk-replay.md`, `docs/technical/pipwerk-fetch-mt5.md`
- Briefing QA, Phase 4, in `docs/technical/agentenrollen-und-briefings.md`
- Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`

## Ablage

Schreibe den Prüfbericht ohne Commit als Datei `3.md` in das Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/backtest/wp02/reports/`. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, den Port der Oberfläche und des Backends der Testumgebung und alle Befunde mit Fundstelle.
