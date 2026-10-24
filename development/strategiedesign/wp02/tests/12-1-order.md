# Prüfauftrag Auftrag 12, Durchlauf 1

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `e6288b89f16ceeeeb373831f1926c9845176326a` auf Zweig `strategiedesign/wp02-12`, Ausgangscommit `365e6452bc893d011401e2573abe599b935455f9`
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/12.md` (Aufträge 13 und 14 im selben Verzeichnis grenzen ab)
- Grundlage: `strategiedesign/wp02:development/strategiedesign/specification.md` (Stand 2026-10-23)
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`. Nur blockierende Befunde verhindern das Bestehen.

## Tester Funktion

Prüfe jeden Punkt des Umfangs und jedes technische Abnahmekriterium des Auftrags 12 gegen den Commit.

- Lies die Spezifikation an den Stellen, die der Auftrag nennt, und prüfe den Code gegen den Wortlaut.
- Führe in `components/pipwerk-studio/frontend` `npm ci`, `typecheck`, `build` und Vitest aus, dazu Playwright in Chromium (`--max-failures=20`) und die Schritte des Prüfskripts `components/pipwerk-studio/scripts/check --backend-port <port> --frontend-port <port>` auf freien Ports (nicht 5174 und 8001). Auftrag 12 verlangt Chromium; führe Firefox und WebKit zusätzlich für die Tests aus, die der Auftrag 12 neu schreibt oder ändert (`objects.spec.ts`, `canvas.spec.ts`, `open.spec.ts`, `library.spec.ts`).
- Der Entwickler meldet 3 fehlgeschlagene Browsertests in `e2e/testcases.spec.ts` (str-03 in zwei Größen wegen `first_use` und `refresh`, str-01 wegen des entfernten Eintrags „1-2-3-Trend (Markttechnik)“) und führt sie auf die Aufträge 13 und 14 zurück. Prüfe diese Zuordnung selbst gegen die Aufträge 12 bis 14. Hängt ein fehlgeschlagener Test von Auftrag 12 ab, ist das ein Befund.
- Prüfe, dass ersetzte oder angepasste bisherige Tests begründet sind (Diff gegen den Ausgangscommit) und dass die Änderung von `e2e/builder.ts` und `e2e/support.ts` keine Prüfung abschwächt.
- Prüfe die Dokumentation (technisch, Anwender, Glossar) gegen den Code und dass keine Pfade, Benutzer- oder Rechnernamen des Entwicklungsrechners enthalten sind. Prüfe, dass Texte und Namen des Anwenders als Text gesetzt werden, nie als HTML, und dass kein fester Pfad, Port oder Rechnername im Code steht.
- Der Entwickler entfernt „Stelle im Bereich der Objekte“ („Nach oben“, „Nach unten“) aus der Eigenschaftenansicht. Prüfe gegen Spezifikation und Aufträge 12 und 13, ob das zulässig ist.

## Ausführung langer Befehle (verbindlich)

- Das Prüfskript und jeder Befehl, der länger als 5 Minuten dauern kann, laufen im Hintergrund (Bash mit `run_in_background`). Die Ausgabe geht in eine Datei unter `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp02/`.
- Du fragst den Stand mindestens alle 5 Minuten mit einem eigenen kurzen Befehl ab. Ein einzelner Werkzeugaufruf über 15 Minuten erzeugt keinen Herzschlag, und die Sitzung wird beendet.

Ablage: `12-functiontest-1.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
