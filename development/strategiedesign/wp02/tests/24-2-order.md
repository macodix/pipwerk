# Prüfauftrag Auftrag 24, Durchlauf 2 (Nachprüfung)

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `1029bb32b67a98a8fb71a7c6a72b936d8fc89fb0` auf Zweig `strategiedesign/wp02-24`, Vorgänger `049b0a9c65bfc7086b07f03f9f32e5be4852d8b6` (Merge mit `origin/strategiedesign/wp02`, enthält Auftrag 23)
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/24.md`, Nachbesserung `strategiedesign/wp02:development/strategiedesign/wp02/tests/24-2-fix.md`; Grundlage: `docs/technical/development-test-security-rules.md` Abschnitt 7 Testregeln
- Es prüft nur der Tester Funktion. Nachprüfung: nur die Befunde B1 und B2 des Berichts `24-functiontest-1.md` und die dafür geänderten Stellen.

## Tester Funktion

- B1: Prüfe, dass `e2e/fields.spec.ts:109` in Chromium, Firefox und WebKit besteht, dass die Behebung (`flex-wrap: wrap` an `.menu` in `styles.css`) die Überdeckung von `menu-settings` durch `findings-count` beseitigt, und prüfe den neuen Test in `e2e/layout.spec.ts` (`expectNothingOver`): Fängt er die Überdeckung? Prüfe das, indem du die Behebung in einem eigenen Prüfverzeichnis zurücknimmst und den Test scheitern siehst; ist das nicht möglich, nenne es. Prüfe, dass kein Test abgeschwächt, übersprungen oder deaktiviert wurde.
- B2: Prüfe, dass `tests/test_frontend_type_copy.py` besteht und dass `check` mit Exitcode 0 endet (einmal, im Hintergrund, rund 20 Minuten).
- Prüfe die Dokumentationsänderung in `docs/technical/pipwerk-studio.md` (Kopfzeile) gegen den Code, und Dateimodus `100755` von `check` und `testenv`.
- Befehle enthalten keine Umgebungsvariablen und keine Kommandoersetzungen.

## Ausführung langer Befehle (verbindlich)

- Jeder Befehl, der länger als 5 Minuten dauern kann, läuft im Hintergrund (Bash mit `run_in_background`), Ausgabe in eine Datei unter `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp02/`. Frage den Stand mindestens alle 5 Minuten mit einem kurzen Befehl ab. Ein einzelner Werkzeugaufruf über 15 Minuten erzeugt keinen Herzschlag, und die Sitzung wird beendet.
- Schreibe den Testbericht sofort nach Ende der Prüfung und beende danach deine Sitzung.

Ablage: `24-functiontest-2.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
