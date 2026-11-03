# Prüfauftrag Auftrag 20, Durchlauf 3 (zweite Nachprüfung)

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `f3bfcf548676ae7cc0a10c9612eb2600ac0bfbf0` auf Zweig `strategiedesign/wp02-20` (derselbe Commit wie in Durchlauf 2)
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/20.md`; vorheriger Bericht: `strategiedesign/wp02:development/strategiedesign/wp02/tests/20-functiontest-2.md`
- Es prüft nur der Tester Funktion. Eine Nachprüfung prüft nur die Befunde des vorigen Durchlaufs und die dafür geänderten Stellen.

## Tester Funktion

- B1 bis B3 sind in Durchlauf 2 als behoben festgestellt; sie werden nicht erneut geprüft.
- N1: Browsertest `e2e/testcases.spec.ts` „str-01 Scalping Punkt 2 Ausbruch is built by operating the interface and equals the test case“ schlug in Durchlauf 2 in Chromium fehl (`locator.check: Clicking the checkbox did not change its state`, `e2e/builder.ts` `refreshValue`). Der Commit ändert diese Stellen nicht, in Durchlauf 1 bestand der Test. Prüfe, ob der Fehler unregelmäßig ist:
  1. Führe diesen einen Test in Chromium allein fünfmal nacheinander aus (`--repeat-each 5`, falls das Prüfskript oder Playwright es zulässt, sonst fünf Aufrufe) und nenne die Ergebnisse je Lauf.
  2. Führe danach das Prüfskript `components/pipwerk-studio/scripts/check --backend-port <port> --frontend-port <port>` auf freien Ports (nicht 5174, 8001, 5274, 8101, 18930 bis 18971) einmal vollständig aus. Playwright muss in Chromium, Firefox und WebKit bestehen.
  3. Schlägt N1 wieder fehl: Nenne, ob die Ursache im Test (Wettlauf beim Klick auf den Schalter „Aktualisieren“) oder im Code liegt, mit Beleg (Zeile, Ausgabe), und ob er auch auf dem Vorgänger `afe466008c6357fcf7a5ab02b3b6a442f8958063` oder auf `main` auftritt, soweit du das mit einem Einzellauf prüfen kannst.
- Es laufen währenddessen keine weiteren Prüfläufe. Prüfe den Dateimodus `100755` von `check` und `testenv`.
- Befehle enthalten keine Umgebungsvariablen und keine Kommandoersetzungen.

## Ausführung langer Befehle (verbindlich)

- Das Prüfskript und jeder Befehl, der länger als 5 Minuten dauern kann, laufen im Hintergrund (Bash mit `run_in_background`), Ausgabe in eine Datei unter `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp02/`. Frage den Stand mindestens alle 5 Minuten mit einem kurzen Befehl ab. Ein einzelner Werkzeugaufruf über 15 Minuten erzeugt keinen Herzschlag, und die Sitzung wird beendet.
- Schreibe den Testbericht sofort nach Ende der Prüfung und beende danach deine Sitzung.

Ablage: `20-functiontest-3.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
