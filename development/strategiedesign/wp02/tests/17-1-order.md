# Prüfauftrag Auftrag 17, Durchlauf 1

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `ab452de0fb2163d880b6648034e9daa22083678d` auf Zweig `strategiedesign/wp02-17`, Ausgangscommit `5d63c176a05c3c2023f7c9ac7e52846833e120d7`
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/17.md`
- Grundlagen: Spezifikation und Plan auf `strategiedesign/wp02` (`development/strategiedesign/specification.md`, `plan.md`), Abnahmebericht 3 (`development/strategiedesign/wp02/acceptance/3.md`, Mängel E3, E6, E10, E11, E12)
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`.

## Tester Funktion

- Prüfe jeden Punkt des Umfangs 1 bis 5 des Auftrags und seine Abnahmekriterien gegen Code, Tests und technische Dokumentation (`docs/technical/pipwerk-studio.md`, `pipwerk-studio-testfaelle.md`): „Woher kommt der Wert?“ mit nur erlaubten Antworten je Feld, Instrument mit Rückweg, Art des Werts in der Erklärung; kein Baustein „Kreuzung“, „vorheriger Wert von“ nur mit Werten, die einen früheren Wert haben, Aufbau der Kreuzung aus Bausteinen, „EMA-Trendfolge“ öffnet ohne Neubau; Befunde mit Element und Feld, „Zur Stelle“; Durchsicht der Texte in `de.json` und `en.json` (Gleichwertigkeit, kein „Belegung“ als Beschriftung, Eingabefelder mit Beschriftung).
- Prüfe, dass keine Prüfung abgeschwächt, kein Test übersprungen oder deaktiviert und kein Test verwaist ist; die Begründungen der angepassten Tests stehen im Ergebnis des Entwicklers: Prüfe sie gegen den Diff zu `5d63c17`.
- Prüfe, dass im Code kein fester Pfad, Port oder Rechnername steht.
- Führe das Prüfskript `components/pipwerk-studio/scripts/check --backend-port <port> --frontend-port <port>` auf freien Ports (nicht 5174, 8001, 18430 bis 18431, 18511 bis 18514, 18620 bis 18631, 18702 bis 18705) vollständig aus, wenn möglich zweimal hintereinander. Playwright muss in Chromium, Firefox und WebKit bestehen. Stelle fehlende Ausführungsrechte in deinem eigenen Arbeitsverzeichnis wieder her (`git checkout --` der beiden Skripte; `chmod +x` auf `bin/*` der nicht versionierten `.venv`, falls nötig).
- Befehle enthalten keine Umgebungsvariablen und keine Kommandoersetzungen.

## Ausführung langer Befehle (verbindlich)

- Das Prüfskript und jeder Befehl, der länger als 5 Minuten dauern kann, laufen im Hintergrund (Bash mit `run_in_background`), Ausgabe in eine Datei unter `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp02/`. Frage den Stand mindestens alle 5 Minuten mit einem kurzen Befehl ab. Ein einzelner Werkzeugaufruf über 15 Minuten erzeugt keinen Herzschlag, und die Sitzung wird beendet.

Ablage: `17-functiontest-1.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
