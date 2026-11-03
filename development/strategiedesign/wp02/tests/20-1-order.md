# Prüfauftrag Auftrag 20, Durchlauf 1

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `afe466008c6357fcf7a5ab02b3b6a442f8958063` auf Zweig `strategiedesign/wp02-20`, Vorgänger `ea495766b04407ac2233852853991f106a3cb0b4`
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/20.md`; Grundlage: `docs/technical/development-test-security-rules.md` Abschnitt 5 Entwicklungsregeln, Abschnitt 7 Testregeln, Abschnitt 8.2 Grundregeln; Spezifikation 5.2, 5.3, 5.5
- Es prüft nur der Tester Funktion. Nur blockierende Befunde verhindern das Bestehen.

## Tester Funktion

- F1: Ohne geöffnete Strategie steht in der Bibliothek ein bleibender Satz; Einträge sind erkennbar nicht verwendbar, nicht ziehbar, Klick und Eingabetaste ohne Wirkung, Erklärung bleibt erreichbar; der Satz verschwindet nach „Neue Strategie“ und „Öffnen“; die Meldung „Öffnen Sie zuerst …“ ist entfallen. Der Satz steht nicht auf der Zeichenfläche.
- F3: Auslöser sind in der Bibliothek gekennzeichnet (aus `kind` der Typbeschreibung, keine festen Kennungen im Code); die Gruppen und ihre Reihenfolge nach 5.2 sind unverändert; ein erstes Element, das kein Auslöser ist, erzeugt per Klick, Ziehen und „Verbindung“ die Meldung in der Eigenschaftenansicht, der Befund „Hauptablauf ohne Auslöser“ bleibt; der Hinweis der leeren Strategie nennt die Auslöser.
- F8: Kennzeichnung „Schritt im Ablauf“ / „liefert Werte“ in der Bibliothek, unterschiedliche Kastenform von Schritten und Objekten (auch ohne Farbe erkennbar), Legende nennt beide Formen, jede Ablehnung einer Verbindung nennt den Grund in der Eigenschaftenansicht (Ziehen und Klick). Prüfe die vom Entwickler genannten Ablehnungsgründe und ob eine Ablehnung ohne Grund bleibt. Prüfe, dass der Fall „Indikator am Ablaufausgang des Auslösers“ den Grund zeigt.
- Alle neuen Texte stehen in `de.json` und `en.json` (Schlüsselgleichheit), ohne Programmierbegriffe und ohne Einzelwörter ohne Aussage.
- Prüfe, ob kein Test abgeschwächt, übersprungen oder deaktiviert wurde (Diff zu `ea49576`; die Änderungen an bestehenden Tests nennt der Entwickler: `App.hints.test.tsx`, `App.canvas.test.tsx`, `canvas.spec.ts`, `surface.spec.ts`, `library.spec.ts`, `ops.test.ts`) und ob kein fester Pfad, Port oder Rechnername im Code steht. Der Entwickler hat Playwright und das Prüfskript nicht ausführen können; die neuen Browsertests (`e2e/roles.spec.ts`) sind nie gelaufen.
- Führe das Prüfskript `components/pipwerk-studio/scripts/check --backend-port <port> --frontend-port <port>` auf freien Ports (nicht 5174, 8001, 5274, 8101, 18930 bis 18941) einmal vollständig aus. Playwright muss in Chromium, Firefox und WebKit bestehen. Es laufen währenddessen keine weiteren Prüfläufe. Prüfe den Dateimodus `100755` von `check` und `testenv` im Commit.
- Prüfe, dass die Dokumentation (`docs/user/pipwerk-studio.md`, `docs/technical/pipwerk-studio.md`) zum Verhalten passt.
- Befehle enthalten keine Umgebungsvariablen und keine Kommandoersetzungen.

## Ausführung langer Befehle (verbindlich)

- Das Prüfskript und jeder Befehl, der länger als 5 Minuten dauern kann, laufen im Hintergrund (Bash mit `run_in_background`), Ausgabe in eine Datei unter `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp02/`. Frage den Stand mindestens alle 5 Minuten mit einem kurzen Befehl ab. Ein einzelner Werkzeugaufruf über 15 Minuten erzeugt keinen Herzschlag, und die Sitzung wird beendet.
- Schreibe den Testbericht sofort nach Ende der Prüfung und beende danach deine Sitzung.

Ablage: `20-functiontest-1.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
