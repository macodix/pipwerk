# Prüfauftrag Auftrag 11, Durchlauf 1

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `313361f801c2d2d23d8f9000b21cbbc79f726b5b` auf Zweig `strategiedesign/wp02-11`, Ausgangscommit `37ecdeca4868b656bf5747ba8223e0374bcefab3`
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/11.md` (Aufträge 12 bis 14 im selben Verzeichnis grenzen ab, was nicht zu Auftrag 11 gehört)
- Grundlage: `strategiedesign/wp02:development/strategiedesign/specification.md` (Stand 2026-10-23)
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`. Nur blockierende Befunde verhindern das Bestehen.

## Tester Funktion

Prüfe jeden Punkt des Umfangs und jedes technische Abnahmekriterium des Auftrags 11 gegen den Commit.

- Lies die Spezifikation an den Stellen, die der Auftrag nennt, und prüfe den Code gegen den Wortlaut.
- Führe in `components/pipwerk-studio/frontend` `npm ci`, `typecheck`, `build` und Vitest aus, dazu Playwright in Chromium und das Prüfskript `components/pipwerk-studio/scripts/check --backend-port <port> --frontend-port <port>` auf freien Ports (nicht 5174 und 8001).
- Der Entwickler meldet 3 fehlgeschlagene Browsertests in `e2e/testcases.spec.ts` (str-03 in zwei Größen wegen `first_use` null, str-01 wegen des entfernten Eintrags „1-2-3-Trend (Markttechnik)“) und führt sie auf die Aufträge 12 bis 14 zurück. Prüfe diese Zuordnung selbst gegen die Aufträge 12 bis 14. Hängt ein fehlgeschlagener Test nicht von diesen Aufträgen ab, ist das ein Befund. Der Auftrag lässt `testcases.spec.ts` bis Auftrag 14 stehen, soweit er von Auftrag 12 und 13 abhängt.
- Prüfe, dass keine bisherigen Tests ohne Begründung angepasst wurden (Diff gegen den Ausgangscommit).
- Prüfe die Dokumentation (Punkt 9) gegen den Code, das Glossar „Assistent“ gegen die Spezifikation, und dass keine Pfade, Benutzer- oder Rechnernamen des Entwicklungsrechners enthalten sind. Prüfe, dass Texte und Namen des Anwenders als Text gesetzt werden, nie als HTML, und dass kein fester Pfad, Port oder Rechnername im Code steht.
- Prüfe `locales.test.ts` und die Befundtexte beider Sprachen gegen die Kennungen in `docs/technical/pipwerk-domain.md`.

## Ausführung langer Befehle (verbindlich)

- Das Prüfskript und jeder Befehl, der länger als 5 Minuten dauern kann, laufen im Hintergrund (Bash mit `run_in_background`). Die Ausgabe geht in eine Datei unter `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp02/`.
- Du fragst den Stand mindestens alle 5 Minuten mit einem eigenen kurzen Befehl ab. Ein einzelner Werkzeugaufruf über 15 Minuten erzeugt keinen Herzschlag, und die Sitzung wird beendet.

Ablage: `11-functiontest-1.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
