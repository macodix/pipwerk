# Prüfauftrag Auftrag 14, Durchlauf 1

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `e314263112c5ea3ac65d0ed504069c4dc580e34a` auf Zweig `strategiedesign/wp02-14`, Ausgangscommit `58159e1784f115ca28aaac6f557d22db9759422f`
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/14.md`
- Grundlage: `strategiedesign/wp02:development/strategiedesign/specification.md` (Stand 2026-10-23), Testfalldokumente unter `contracts/strategies/v2/testcases/`
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`. Nur blockierende Befunde verhindern das Bestehen.

## Tester Funktion

Prüfe jeden Punkt des Umfangs (1 bis 6) und jedes technische Abnahmekriterium des Auftrags 14 gegen den Commit.

- Führe in `components/pipwerk-studio/frontend` `npm ci`, `typecheck`, `build` und Vitest aus, dazu das Prüfskript `components/pipwerk-studio/scripts/check --backend-port <port> --frontend-port <port>` auf freien Ports (nicht 5174 und 8001). Playwright muss in Chromium, Firefox und WebKit bestehen; kein Test darf übersprungen oder deaktiviert sein.
- Prüfe `str-01` und `str-03`: Aufbau nur über die Bedienung, kein Ausdruck als Text, Speichern, Neuladen, Vergleich mit dem Testfalldokument. Prüfe besonders die Änderung in `e2e/compare.ts` (Eingänge eines Elements werden als Menge geordnet): Sie darf keine Abweichung verdecken, die das Testfalldokument festlegt. Prüfe `refreshValue`, `expectSaved` und `expectUnsaved` auf Schärfe.
- Prüfe die sechs Größen (5.1) mit geöffneter gesicherter „EMA-Trendfolge“, die Smartphone-Größen mit Menü, Dialogen, Bausteinen, Formeleditor und Assistent, `hints.spec.ts` und die Weitere-Browsertests-Liste (Punkt 3). Prüfe, dass die Änderung an `layout.spec.ts` (Klick auf die Karte statt der überlagerten Werkzeugleiste) keine Prüfung abschwächt.
- Prüfe die Entfernung des Stub-Betriebs (`e2e/run-stub.mjs`, `e2e:stub`, `PIPWERK_STUDIO_E2E_STUB`): Keine Prüfung entfällt, keine Verweise bleiben in Dokumentation und Skripten.
- Prüfe, ob die Standardports in `playwright.config.ts` (Rückfall 18000 und 15173) gegen Kriterium 4 („Kein fester Pfad, Port oder Rechnername im Code“) und `sourceRules.test.ts` verstoßen; benenne es als Befund, wenn ja.
- Prüfe Prüfskript und Testumgebungsskript (Punkt 5): Das Testumgebungsskript setzt das Objektverzeichnis unter `.testenv/` und legt die gesicherte „EMA-Trendfolge“ ab; starte es in einem freien Verzeichnis auf freien Ports, wenn möglich, und beende es danach.
- Prüfe die Dokumentation (Punkt 6) gegen Code und Browsertests: `pipwerk-studio-testfaelle.md` (Schritte passen zu den Tests), `pipwerk-studio.md`, `docs/user/pipwerk-studio.md` (alle Arbeitsabläufe aus 5.5 ohne Vorlagen aus `wp03`, keine Test- und Abnahmeanleitungen), `docs/user/README.md`, Glossare, Querverweise; keine Pfade, Benutzer- oder Rechnernamen des Entwicklungsrechners.

## Ausführung langer Befehle (verbindlich)

- Das Prüfskript und jeder Befehl, der länger als 5 Minuten dauern kann, laufen im Hintergrund (Bash mit `run_in_background`). Die Ausgabe geht in eine Datei unter `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp02/`.
- Du fragst den Stand mindestens alle 5 Minuten mit einem eigenen kurzen Befehl ab. Ein einzelner Werkzeugaufruf über 15 Minuten erzeugt keinen Herzschlag, und die Sitzung wird beendet.

Ablage: `14-functiontest-1.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
