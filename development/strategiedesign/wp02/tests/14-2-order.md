# Prüfauftrag Auftrag 14, Durchlauf 2

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `6b51381e3948d19dfa0d38704ccc17ab101b4f88` auf Zweig `strategiedesign/wp02-14`, Ausgangscommit `58159e1784f115ca28aaac6f557d22db9759422f`
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/14.md`
- Vorbericht: `strategiedesign/wp02:development/strategiedesign/wp02/tests/14-1-functiontest.md` (Durchlauf 1, nicht bestanden, ein blockierender Befund)
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`. Nur blockierende Befunde verhindern das Bestehen.

## Tester Funktion

- Prüfe, dass die Befunde 1 bis 5 des Durchlaufs 1 behoben sind: feste Ports (`playwright.config.ts` ohne Rückfallwerte, `sourceRules.test.ts` erfasst `playwright.config.ts` und `e2e/`, Dokumentation 6.3), veraltete Verweise in `docs/technical/pipwerk-studio.md` (Zeilen 13 und 161), `e2e/hints.spec.ts` (Rückfrage wird erwartet), `e2e/layout.spec.ts` (kein `dispatchEvent` mehr; echter Klick nach Verschieben der Ansicht; prüfe, dass das keine Prüfung abschwächt).
- Führe in `components/pipwerk-studio/frontend` `npm ci`, `typecheck`, `build` und Vitest aus, dazu das Prüfskript `components/pipwerk-studio/scripts/check --backend-port <port> --frontend-port <port>` auf freien Ports (nicht 5174 und 8001). Playwright muss in Chromium, Firefox und WebKit bestehen.
- Der Entwickler meldet einen einmaligen Fehlschlag in WebKit: `e2e/contents.spec.ts:127` („an own ruleset …“), die Statusanzeige blieb nach dem Speichern auf „ungespeichert“; allein 20 von 20 bestanden. Prüfe, ob dahinter ein Fehler der Oberfläche steht (Zustand nach dem Speichern, Wettlauf) und nicht nur ein Zeitproblem des Tests. Sichere bei einem Fehlschlag den Fehlerkontext (`test-results`) in eine Datei unter `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp02/`, bevor du erneut läufst. Wiederhole den Test in WebKit mehrfach unter Last (zum Beispiel mit mehreren Arbeitern).
- Prüfe nur die Änderungen seit `e314263112c5ea3ac65d0ed504069c4dc580e34a` neu im Einzelnen; den übrigen Umfang hast du im Durchlauf 1 geprüft, bei unverändertem Code gilt das Ergebnis.

## Ausführung langer Befehle (verbindlich)

- Das Prüfskript und jeder Befehl, der länger als 5 Minuten dauern kann, laufen im Hintergrund (Bash mit `run_in_background`). Die Ausgabe geht in eine Datei unter `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp02/`.
- Du fragst den Stand mindestens alle 5 Minuten mit einem eigenen kurzen Befehl ab. Ein einzelner Werkzeugaufruf über 15 Minuten erzeugt keinen Herzschlag, und die Sitzung wird beendet.

Ablage: `14-functiontest-2.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
