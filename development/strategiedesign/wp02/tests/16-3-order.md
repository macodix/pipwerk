# Prüfauftrag Auftrag 16, Durchlauf 3

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `9f7467d15cd95e927d3149f4ff481afe47c215db` auf Zweig `strategiedesign/wp02-16`, Ausgangscommit `4e8b65bcdddf12d4b57952cbf7298134b92fdcc8`
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/16.md`
- Nachbesserung: `strategiedesign/wp02:development/strategiedesign/wp02/tests/16-3-fix.md`
- Vorbericht: `strategiedesign/wp02:development/strategiedesign/wp02/tests/16-2-functiontest.md` (nicht bestanden: Befund 1 blockierend, Test str-01 in Playwright; geprüft `5f708be4e8020af4cbc6cbec1a5b5495cc1ff796`)
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`. Nachprüfung: Nur blockierende Befunde verhindern das Bestehen.

## Tester Funktion

- Prüfe die Behebung von Befund 1 aus Durchlauf 2: Der Entwickler nennt als Ursache, dass sich das Feld zwischen Drücken und Loslassen der Maustaste verschiebt (Antwort des Endpunkts ändert den Satz über dem Editor). Behoben sind `data-pending` am `ExpressionPanel` (`useExpressionSession.ts`, `ExpressionPanel.tsx`), das Warten `settled` in `e2e/support.ts` und `e2e/builder.ts`, ein Vitest-Test in `App.expressions.test.tsx` und die technische Dokumentation. Prüfe, ob die Ursache belegt und die Behebung stimmig ist, und ob die Dokumentation zur Änderung passt.
- Prüfe per Diff gegen `4e8b65b`, dass keine Prüfung abgeschwächt und kein Test übersprungen wurde und dass keine festen Wartezeiten die Lösung sind.
- Führe das Prüfskript `components/pipwerk-studio/scripts/check --backend-port <port> --frontend-port <port>` auf freien Ports (nicht 5174, 8001, 18430 bis 18431, 18511 bis 18514) vollständig aus, wenn möglich zweimal hintereinander. Playwright muss in Chromium, Firefox und WebKit bestehen. Stelle fehlende Ausführungsrechte in deinem eigenen Arbeitsverzeichnis wieder her wie in Durchlauf 2 (`git checkout --` der beiden Skripte; `chmod +x` auf `bin/*` der nicht versionierten `.venv`, falls `uv run` sonst Systemprogramme nimmt).
- Befehle enthalten keine Umgebungsvariablen und keine Kommandoersetzungen.

## Ausführung langer Befehle (verbindlich)

- Das Prüfskript und jeder Befehl, der länger als 5 Minuten dauern kann, laufen im Hintergrund (Bash mit `run_in_background`), Ausgabe in eine Datei unter `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp02/`. Frage den Stand mindestens alle 5 Minuten mit einem kurzen Befehl ab. Ein einzelner Werkzeugaufruf über 15 Minuten erzeugt keinen Herzschlag, und die Sitzung wird beendet.

Ablage: `16-functiontest-3.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
