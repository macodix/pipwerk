# Prüfauftrag Auftrag 17, Durchlauf 2

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `e96d4601bf008a59b1d29191024c41752c1a15b5` auf Zweig `strategiedesign/wp02-17`, Ausgangscommit `ab452de0fb2163d880b6648034e9daa22083678d` (Nachbesserung nach `tests/17-1-functiontest.md`, Auftrag `tests/17-2-fix.md`)
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/17.md`
- Grundlagen: Spezifikation und Plan auf `strategiedesign/wp02` (`development/strategiedesign/specification.md`, `plan.md`), Abnahmebericht 3 (`development/strategiedesign/wp02/acceptance/3.md`, Mängel E3, E6, E10, E11, E12), Testbericht `development/strategiedesign/wp02/tests/17-1-functiontest.md`
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`.

## Tester Funktion

- Prüfe die Behebung der Befunde B1, B2, H1 und H2 aus `tests/17-1-functiontest.md` gegen den Diff zu `ab452de` (Entscheidungen in `tests/17-2-fix.md`) und suche nach weiteren Fundstellen derselben Art („Kreuzung“ als Art einer Bedingung in Dokumentation, Programmierbegriffe in sichtbaren Texten, feste Werte in Konfigurationsdateien, Datentyp als Chip).
- Prüfe jeden Punkt des Umfangs 1 bis 5 des Auftrags und seine Abnahmekriterien gegen Code, Tests und technische Dokumentation (`docs/technical/pipwerk-studio.md`, `pipwerk-studio-testfaelle.md`), soweit der Diff sie berührt.
- Prüfe, dass keine Prüfung abgeschwächt, kein Test übersprungen oder deaktiviert und kein Test verwaist ist; prüfe die angepassten Tests gegen den Diff zu `ab452de`.
- Prüfe, dass im Code kein fester Pfad, Port oder Rechnername steht (auch `vite.config.ts`).
- Führe das Prüfskript `components/pipwerk-studio/scripts/check --backend-port <port> --frontend-port <port>` auf freien Ports (nicht 5174, 8001, 18430 bis 18431, 18810 bis 18821, 18840 bis 18841) vollständig aus, wenn möglich zweimal hintereinander, nie zwei Läufe gleichzeitig. Playwright muss in Chromium, Firefox und WebKit bestehen. Stelle fehlende Ausführungsrechte in deinem eigenen Arbeitsverzeichnis wieder her (`git checkout --` der beiden Skripte; `chmod +x` auf `bin/*` der nicht versionierten `.venv`, falls nötig).
- Befehle enthalten keine Umgebungsvariablen und keine Kommandoersetzungen.

## Ausführung langer Befehle (verbindlich)

- Das Prüfskript und jeder Befehl, der länger als 5 Minuten dauern kann, laufen im Hintergrund (Bash mit `run_in_background`), Ausgabe in eine Datei unter `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp02/`. Frage den Stand mindestens alle 5 Minuten mit einem kurzen Befehl ab. Ein einzelner Werkzeugaufruf über 15 Minuten erzeugt keinen Herzschlag, und die Sitzung wird beendet.

Ablage: `17-functiontest-2.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
