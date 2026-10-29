# Prüfauftrag Auftrag 18, Durchlauf 2

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `a5112dc3c02fb1760c963414c34fdc1375aef60d` auf Zweig `strategiedesign/wp02-18`, Vorgänger `7f8a0652ce4a0c2bb3f75a71ee1aea1aae99c75e`
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/18.md`, Nachbesserung `strategiedesign/wp02:development/strategiedesign/wp02/tests/18-2-fix.md`, Bericht Durchlauf 1 `strategiedesign/wp02:development/strategiedesign/wp02/tests/18-1-functiontest.md`
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`. Dies ist die Nachprüfung (Durchlauf 2): Prüfe den Befund B1 und ob die Änderungen neue Probleme verursachen. Nur blockierende Befunde verhindern das Bestehen.

## Tester Funktion

- B1: Kreuz an der Linie, Entf und Rücktaste an einer gewählten Verbindung haben Browsertests (`canvas.spec.ts`), und die Tasten sind im Code wirksam (`Canvas.tsx`, `tabIndex`, `styles.css`). Prüfe, ob die Tests die Löschwege tatsächlich aufrufen, ob die Sperre für Eingabefelder getestet ist, ob die technische Dokumentation (`docs/technical/pipwerk-studio.md`, Zeilen 149 und 926) mit Code und Tests übereinstimmt und ob kein Test abgeschwächt, übersprungen oder deaktiviert wurde (Diff zu `7f8a065`).
- Führe das Prüfskript `components/pipwerk-studio/scripts/check --backend-port <port> --frontend-port <port>` auf freien Ports (nicht 5174, 8001, 18430 bis 18431, 18810 bis 18821, 18840 bis 18841, 18900 bis 18903, 18950 bis 18951, 19120 bis 19123, 19311 bis 19312) einmal vollständig aus. Playwright muss in Chromium, Firefox und WebKit bestehen. Prüfe den Dateimodus `100755` von `check` und `testenv` im Commit.
- Befehle enthalten keine Umgebungsvariablen und keine Kommandoersetzungen.

## Ausführung langer Befehle (verbindlich)

- Das Prüfskript und jeder Befehl, der länger als 5 Minuten dauern kann, laufen im Hintergrund (Bash mit `run_in_background`), Ausgabe in eine Datei unter `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp02/`. Frage den Stand mindestens alle 5 Minuten mit einem kurzen Befehl ab. Ein einzelner Werkzeugaufruf über 15 Minuten erzeugt keinen Herzschlag, und die Sitzung wird beendet.
- Schreibe den Testbericht sofort nach Ende der Prüfung und beende danach deine Sitzung.

Ablage: `18-functiontest-2.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
