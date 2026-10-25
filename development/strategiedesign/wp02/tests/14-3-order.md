# Prüfauftrag Auftrag 14, Durchlauf 3

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `05c396c05831228a5d3ffbd99945c1dbafbaf7d6` auf Zweig `strategiedesign/wp02-14`, Ausgangscommit `58159e1784f115ca28aaac6f557d22db9759422f`
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/14.md`
- Vorberichte: `strategiedesign/wp02:development/strategiedesign/wp02/tests/14-1-functiontest.md`, `14-2-functiontest.md` (Durchlauf 2 bestanden, Hinweis 1 zum Wettlauf beim Speichern; zuletzt geprüft `6b51381e3948d19dfa0d38704ccc17ab101b4f88`)
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`. Nur blockierende Befunde verhindern das Bestehen.

## Tester Funktion

- Neu seit `6b51381e3948d19dfa0d38704ccc17ab101b4f88`: Der Entwickler behebt den Wettlauf zwischen Speichern und laufender Umwandlung eines Ausdrucks (`useStudioController.ts`: `trackChange`, `settleChanges`, Vergleich des gespeicherten mit dem offenen Dokument nach Inhalt statt Identität; `useExpressionSession.ts`; neuer Vitest-Test `src/App.saveWaits.test.tsx`; neuer Browsertest in `e2e/contents.spec.ts`; Dokumentation 2.3, 6.2, 6.3). Prüfe den Diff `6b51381..05c396c` im Einzelnen:
  - Speichern und Prüfen warten auf alle angemeldeten Änderungen; keine Verklemmung (Anmeldung wird in jedem Fall freigegeben, auch bei Fehler der Schnittstelle und beim Abbau der Sitzung), kein Verlust einer Änderung, die während des Speicherns eintrifft.
  - Der Vergleich nach Inhalt ersetzt das offene Dokument nur, wenn nichts Neues dazukam; eine Änderung während des Speicherns bleibt als „ungespeichert“ erhalten.
  - Die neuen Tests scheitern ohne die Korrektur (Gegenprobe: Warten in `save` entfernen und Vitest `App.saveWaits.test.tsx` laufen lassen, danach zurücksetzen; das Arbeitsverzeichnis muss auf dem geprüften Commit unverändert bleiben).
- Führe in `components/pipwerk-studio/frontend` `npm ci`, `typecheck`, `build` und Vitest aus, dazu das Prüfskript `components/pipwerk-studio/scripts/check --backend-port <port> --frontend-port <port>` auf freien Ports (nicht 5174 und 8001). Playwright muss in Chromium, Firefox und WebKit bestehen. Die Ports übergibt das Prüfskript; rufe Playwright nur über das Prüfskript auf, wenn dir Befehle mit Umgebungsvariablen nicht möglich sind.
- Der übrige Umfang und die Behebungen 1 bis 5 aus Durchlauf 1 gelten bei unverändertem Code weiter; prüfe per Diff gegen `6b51381`, dass nichts anderes geändert wurde.

## Ausführung langer Befehle (verbindlich)

- Das Prüfskript und jeder Befehl, der länger als 5 Minuten dauern kann, laufen im Hintergrund (Bash mit `run_in_background`). Die Ausgabe geht in eine Datei unter `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp02/`.
- Du fragst den Stand mindestens alle 5 Minuten mit einem eigenen kurzen Befehl ab. Ein einzelner Werkzeugaufruf über 15 Minuten erzeugt keinen Herzschlag, und die Sitzung wird beendet.

Ablage: `14-functiontest-3.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
