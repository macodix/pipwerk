# Prüfauftrag Auftrag 13, Durchlauf 1

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `4b5dfe3f69bf1f3e3bff28c8c24cc3a5bfc2cf9a` auf Zweig `strategiedesign/wp02-13`, Ausgangscommit `264c2acbaee7de846f0198d88faafb8bf8ae01e3`
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/13.md` mit der Ergänzung am Ende (Aufträge 12 und 14 im selben Verzeichnis grenzen ab)
- Grundlage: `strategiedesign/wp02:development/strategiedesign/specification.md` (Stand 2026-10-23)
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`. Nur blockierende Befunde verhindern das Bestehen.

## Tester Funktion

Prüfe jeden Punkt des Umfangs (1 bis 11) und jedes technische Abnahmekriterium des Auftrags 13 gegen den Commit.

- Lies die Spezifikation an den Stellen, die der Auftrag nennt, und prüfe den Code gegen den Wortlaut.
- Führe in `components/pipwerk-studio/frontend` `npm ci`, `typecheck`, `build` und Vitest aus, dazu Playwright in Chromium (`--max-failures=20`) und die Schritte des Prüfskripts `components/pipwerk-studio/scripts/check --backend-port <port> --frontend-port <port>` auf freien Ports (nicht 5174 und 8001).
- Der Entwickler meldet 3 fehlgeschlagene Browsertests `str-01` (Chromium, Firefox, WebKit) wegen des entfernten Eintrags „1-2-3-Trend (Markttechnik)“ und führt sie auf Auftrag 14 Punkt 1 zurück. Prüfe diese Zuordnung selbst. `str-03` besteht laut Entwickler jetzt.
- Prüfe, dass ersetzte oder angepasste bisherige Tests begründet sind (Diff gegen den Ausgangscommit), insbesondere `e2e/compare.ts` (Zuordnung von `first_use` nach Stelle im Dokument) und `testcases.spec.ts`/`e2e/builder.ts` (keine Prüfung abgeschwächt, kein Ausdruck als Text eingegeben).
- Prüfe die Ergänzung am Ende des Auftrags: Ein Eingang aus Bausteinen, Formelansicht, „Verwendete Werte“ und der Wahl des Elements schreibt `first_use`, ein gespeicherter Wert bleibt.
- Prüfe die Dokumentation (technisch, Anwender, Glossar) gegen den Code und dass keine Pfade, Benutzer- oder Rechnernamen des Entwicklungsrechners enthalten sind. Prüfe, dass Texte und Namen des Anwenders als Text gesetzt werden, nie als HTML, und dass kein fester Pfad, Port oder Rechnername im Code steht.

## Ausführung langer Befehle (verbindlich)

- Das Prüfskript und jeder Befehl, der länger als 5 Minuten dauern kann, laufen im Hintergrund (Bash mit `run_in_background`). Die Ausgabe geht in eine Datei unter `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp02/`.
- Du fragst den Stand mindestens alle 5 Minuten mit einem eigenen kurzen Befehl ab. Ein einzelner Werkzeugaufruf über 15 Minuten erzeugt keinen Herzschlag, und die Sitzung wird beendet.

Ablage: `13-functiontest-1.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
