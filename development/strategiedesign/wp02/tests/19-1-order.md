# Prüfauftrag Auftrag 19, Durchlauf 1

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `63a9bfa6bdf1c20c9b2b6c927073fb56bbcee17c` auf Zweig `strategiedesign/wp02-19`, Vorgänger `106f6388b83343e4ae86243f7e316ca1240b544b`
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/19.md`; Grundlage: `strategiedesign/wp02:development/strategiedesign/wp02/conformance-1.md` (Befunde K1, K2)
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`. Nur blockierende Befunde verhindern das Bestehen.

## Tester Funktion

- K1: Prüfe, dass jedes Einfügen einer Vorlage und eines Objekttyps (Element, Regel, Instanzliste; Klick, Ziehen, Liste „Regel oder Regelwerk hinzufügen …“) `POST /api/v1/insert` aufruft und die Oberfläche keine Namen, Kennungen oder Ausdrücke selbst bildet (E2). Prüfe die im Ergebnis des Entwicklers genannten Ausnahmen (Auslöser, Schritte, Bedingung, Berechnung, Strategieparameter, eigene Parameter und Eigenschaften) auf ihre Berechtigung. Prüfe, dass das Dokument sich erst mit der Antwort ändert, dass bei einem Fehler das Dokument unverändert bleibt und der Anwender eine Ursache mit Abhilfe sieht, dass zwei rasche Einfügungen keine doppelten Namen ergeben und dass `fakeInsert.ts` keine Namenslogik enthält, die das Backend nicht hat. Der Fall zwei Regeln „Mindestvolumen“ (Ergebnis „Prüfregeln Mindestvolumen“, `pruefregeln_mindestvolumen`, kein `name.duplicate`) muss in Test und gegen das echte Backend bestehen.
- K2: Prüfe, dass `docs/technical/pipwerk-studio.md` und die Kopfkommentare den Prototyp nicht bestätigt nennen und nicht sagen, die Bedienung stamme von dort, dass sie die Dateien mit Code des Prototyps nennen (`arrange/layout.ts`, `arrange/scene.ts`, `styles.css`, `ui/Icon.tsx`, `ui/TipLayer.tsx` und die getrennt genannte zweite Gruppe) und dass die Angaben zum Einfügen (Elementbibliothek, 5.2.4) zum Code passen.
- Prüfe, ob kein Test abgeschwächt, übersprungen oder deaktiviert wurde (Diff zu `106f638`) und ob kein fester Pfad, Port oder Rechnername im Code steht.
- Führe das Prüfskript `components/pipwerk-studio/scripts/check --backend-port <port> --frontend-port <port>` auf freien Ports (nicht 5174, 8001, 5274, 8101, 18930 bis 18935) einmal vollständig aus. Playwright muss in Chromium, Firefox und WebKit bestehen. Prüfe den Dateimodus `100755` von `check` und `testenv` im Commit.
- Befehle enthalten keine Umgebungsvariablen und keine Kommandoersetzungen.

## Ausführung langer Befehle (verbindlich)

- Das Prüfskript und jeder Befehl, der länger als 5 Minuten dauern kann, laufen im Hintergrund (Bash mit `run_in_background`), Ausgabe in eine Datei unter `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp02/`. Frage den Stand mindestens alle 5 Minuten mit einem kurzen Befehl ab. Ein einzelner Werkzeugaufruf über 15 Minuten erzeugt keinen Herzschlag, und die Sitzung wird beendet.
- Schreibe den Testbericht sofort nach Ende der Prüfung und beende danach deine Sitzung.

Ablage: `19-functiontest-1.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
