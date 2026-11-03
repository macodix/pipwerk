# Prüfauftrag Auftrag 21, Durchlauf 1

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `e545a97b075a67884e33efcf7bbe1690ce123243` auf Zweig `strategiedesign/wp02-21`, Vorgänger `ea495766b04407ac2233852853991f106a3cb0b4`
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/21.md`; Grundlage: `docs/technical/development-test-security-rules.md` Abschnitt 5 Entwicklungsregeln, Abschnitt 7 Testregeln, Abschnitt 8.2 Grundregeln; Spezifikation 3.4, 5.1, 5.4, 5.5
- Es prüft nur der Tester Funktion. Nur blockierende Befunde verhindern das Bestehen.

## Tester Funktion

- F2: Feld „Name der Strategie“ mit sichtbarer Beschriftung, leer, grauer Hinweistext, der mit dem ersten Zeichen verschwindet; sieht aus wie ein Eingabefeld. Der Entwickler hat das Speichern mit leerem Namen unverändert gelassen und „(noch ohne Name)“ eingeführt; prüfe, ob das dem Auftrag entspricht und ob Speichern, Öffnen-Liste und Rückfragen damit richtig funktionieren.
- F7: Bereich „Verwendete Werte“ ausgeblendet beziehungsweise ein Satz; der zweite Absatz entfällt überall; Darstellung je Typ wie im Ergebnis des Entwicklers.
- F9: „Entfernen“ an jedem Teil von „und“/„oder“ (Tastatur, Erklärung), Zustand danach gültig und bearbeitbar.
- F10: Übernahme des Vergleichs als erster Teil, Rückfrage bei Verlust mit „Abbrechen“ und „Wechseln“, keine Rückfrage bei leerer Bedingung, Tabelle der Wechsel in `docs/technical/pipwerk-studio.md` stimmt zum Verhalten und ist in `blocks.test.ts` geprüft. Der Entwickler hat zusätzlich „und/oder mit genau einem Teil“ wieder zum Vergleich gemacht (nicht im Auftrag): Prüfe, ob das mit F9/F10 verträglich ist.
- F11: Frage „Was soll geprüft werden?“ mit ganzen Antworten, „Ausdruck“ ersetzt durch „Formel“ in Oberfläche, Befunden und Anwenderdokumentation, Durchsicht der Feldbeschriftungen (Liste im Ergebnis des Entwicklers: nicht in der Liste Genanntes auf Einzelwörter ohne Aussage prüfen).
- Alle neuen Texte in `de.json` und `en.json` (Schlüsselgleichheit).
- Prüfe, ob kein Test abgeschwächt, übersprungen oder deaktiviert wurde (Diff zu `ea49576`; geänderte bestehende Tests nennt der Entwickler: `blocks.test.ts`, `locales.test.ts`, `App.flows.test.tsx`, `workflows.spec.ts`, `support.ts`, `canvas.spec.ts`, `App.usedValues.test.tsx`, `fields.spec.ts`, `surface.spec.ts`, `App.expressions.test.tsx`, `used.spec.ts`, `library.spec.ts`) und ob kein fester Pfad, Port oder Rechnername im Code steht. Der Entwickler hat Playwright und das Prüfskript nicht ausführen können; `e2e/conditions.spec.ts` ist nie gelaufen.
- Führe das Prüfskript `components/pipwerk-studio/scripts/check --backend-port <port> --frontend-port <port>` auf freien Ports (nicht 5174, 8001, 5274, 8101, 18930 bis 18951) einmal vollständig aus. Playwright muss in Chromium, Firefox und WebKit bestehen. Es laufen währenddessen keine weiteren Prüfläufe. Prüfe den Dateimodus `100755` von `check` und `testenv` im Commit.
- Prüfe, dass `docs/user/pipwerk-studio.md`, `docs/technical/pipwerk-studio.md` und `docs/technical/pipwerk-studio-testfaelle.md` zum Verhalten und zu den Beschriftungen passen.
- Befehle enthalten keine Umgebungsvariablen und keine Kommandoersetzungen.

## Ausführung langer Befehle (verbindlich)

- Das Prüfskript und jeder Befehl, der länger als 5 Minuten dauern kann, laufen im Hintergrund (Bash mit `run_in_background`), Ausgabe in eine Datei unter `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp02/`. Frage den Stand mindestens alle 5 Minuten mit einem kurzen Befehl ab. Ein einzelner Werkzeugaufruf über 15 Minuten erzeugt keinen Herzschlag, und die Sitzung wird beendet.
- Schreibe den Testbericht sofort nach Ende der Prüfung und beende danach deine Sitzung.

Ablage: `21-functiontest-1.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
