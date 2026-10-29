# Prüfauftrag Auftrag 18, Durchlauf 1

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `7f8a0652ce4a0c2bb3f75a71ee1aea1aae99c75e` auf Zweig `strategiedesign/wp02-18`, Ausgangscommit `89fc4d9481777590ecd5edd30c835745d10eadab`
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/18.md`
- Grundlagen: Spezifikation und Plan auf `strategiedesign/wp02` (`development/strategiedesign/specification.md`, `plan.md`, Abschnitte 5, 6, 7, 9; Kriterien 1, 2, 3, 4, 13), Abnahmebericht 3 (`development/strategiedesign/wp02/acceptance/3.md`, Mangel E5)
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`.

## Tester Funktion

- Prüfe jeden Punkt des Umfangs 1 bis 6 des Auftrags und seine Abnahmekriterien gegen Code, Tests, Dokumentation und Skripte. Die Anwenderdokumentation `docs/user/pipwerk-studio.md` prüfst du auf Vollständigkeit nach Punkt 1 und auf die verbotenen Inhalte (Prüf-/Abnahmeanleitungen, Programmbegriffe, Kennungen), die technische Dokumentation und das Glossar auf Übereinstimmung mit dem Code.
- Der Entwickler hat über den Umfang hinaus die Auswahl und das Löschen einer Verbindung in der Eigenschaftenansicht gebaut (Spezifikation 5.3; `studioState.ts`, `Canvas.tsx`, `PropertiesPanel.tsx`, Texte, Tests). Prüfe, ob das der Spezifikation 5.3 entspricht, getestet und dokumentiert ist, und ob der Backend-Test `test_the_user_documentation_holds_no_instructions_to_try_the_web_api` die Prüfung nicht abschwächt. Prüfe die Umbenennung der Beispieldatei `str-03-manuell-in-order-und-positionsverwaltung.strategy.json` und alle Verweise darauf.
- Prüfe, dass keine Prüfung abgeschwächt, kein Test übersprungen oder deaktiviert und kein Test verwaist ist (Diff zu `89fc4d9`), dass keine Verweise auf den Assistenten, die Kurzform „Verwaltung“ und den Baustein „Kreuzung“ bleiben (außer der Kreuzung als Zusammensetzung) und dass im Code kein fester Pfad, Port oder Rechnername steht.
- Führe das Prüfskript `components/pipwerk-studio/scripts/check --backend-port <port> --frontend-port <port>` auf freien Ports (nicht 5174, 8001, 18430 bis 18431, 18810 bis 18821, 18840 bis 18841, 18900 bis 18903, 18950 bis 18951) vollständig aus, wenn möglich zweimal hintereinander, nie zwei Läufe gleichzeitig. Playwright muss in Chromium, Firefox und WebKit bestehen. Stelle fehlende Ausführungsrechte in deinem eigenen Arbeitsverzeichnis wieder her (`git checkout --` der beiden Skripte; `chmod +x` auf `bin/*` der nicht versionierten `.venv`, falls nötig); prüfe den Dateimodus `100755` im Commit.
- Befehle enthalten keine Umgebungsvariablen und keine Kommandoersetzungen.

## Ausführung langer Befehle (verbindlich)

- Das Prüfskript und jeder Befehl, der länger als 5 Minuten dauern kann, laufen im Hintergrund (Bash mit `run_in_background`), Ausgabe in eine Datei unter `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp02/`. Frage den Stand mindestens alle 5 Minuten mit einem kurzen Befehl ab. Ein einzelner Werkzeugaufruf über 15 Minuten erzeugt keinen Herzschlag, und die Sitzung wird beendet.

Ablage: `18-functiontest-1.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
