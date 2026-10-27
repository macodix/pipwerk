# Prüfauftrag Auftrag 16, Durchlauf 2

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `5f708be4e8020af4cbc6cbec1a5b5495cc1ff796` auf Zweig `strategiedesign/wp02-16`, Ausgangscommit `701698e43963ccc77ec909fcbc59cc86ddcd129a`; der Commit enthält den Arbeitszweig mit Auftrag 15 (zusammengeführt)
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/16.md`
- Vorbericht: `strategiedesign/wp02:development/strategiedesign/wp02/tests/16-1-functiontest.md` (nicht bestanden: Befund 1 blockierend; zuletzt geprüft `6b86959cf47efa888e8b6503c0cd6b5e7a300472`)
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`. Nachprüfung: Nur blockierende Befunde verhindern das Bestehen.

## Tester Funktion

- Prüfe die Behebung der Befunde 1 bis 3 aus Durchlauf 1: Kopie `frontend/src/testing/element-types.json` gleich der Antwort des Backends (`test_frontend_type_copy.py`), Ausnahme `ownText` entfernt, Steuerelement `Select` behält eine offene Liste beim Neuzeichnen (Test belegt?), Regel `.react-flow__attribution` entfernt. Befund 4 ist als Verhalten entschieden und kein Mangel.
- Prüfe per Diff gegen `6b86959`, was sonst geändert wurde: Zusammenführung mit Auftrag 15, die geänderten Browsertests (`testcases.spec.ts` baut die Kreuzung aus „vorheriger Wert von“ und Vergleichen, Phone-Test in `expressions.spec.ts`, E13-Test in `surface.spec.ts`, `builder.ts` mit `refreshValue` und `force: true`). Prüfe, dass keine Prüfung abgeschwächt wurde.
- Führe das Prüfskript `components/pipwerk-studio/scripts/check --backend-port <port> --frontend-port <port>` auf freien Ports (nicht 5174 und 8001) vollständig aus. Playwright muss in Chromium, Firefox und WebKit bestehen. Stelle fehlende Ausführungsrechte in deinem eigenen Arbeitsverzeichnis wieder her wie in Durchlauf 1 (`git checkout --` der beiden Skripte; `chmod +x` auf `bin/*` der nicht versionierten `.venv`, falls `uv run` sonst Systemprogramme nimmt).
- Befehle enthalten keine Umgebungsvariablen und keine Kommandoersetzungen.

## Ausführung langer Befehle (verbindlich)

- Das Prüfskript und jeder Befehl, der länger als 5 Minuten dauern kann, laufen im Hintergrund (Bash mit `run_in_background`), Ausgabe in eine Datei unter `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp02/`. Frage den Stand mindestens alle 5 Minuten mit einem kurzen Befehl ab. Ein einzelner Werkzeugaufruf über 15 Minuten erzeugt keinen Herzschlag, und die Sitzung wird beendet.

Ablage: `16-functiontest-2.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
