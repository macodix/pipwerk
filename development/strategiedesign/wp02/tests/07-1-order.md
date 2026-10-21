# Prüfauftrag Auftrag 07, Durchlauf 1

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `40c5b7f695ea89a61c98f2aaf4ca4b5a03dbbe6a` auf Zweig `strategiedesign/wp02-07`, Ausgangscommit des Auftrags `dd9b705787fd27c7a03ea1ab5ce6287b7b2affd0` (enthält die Aufträge 01 bis 06)
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/07.md`; Befunde B1 und B2 stehen in `strategiedesign/wp02:development/strategiedesign/wp02/reviews/2.md`
- Prüfgrundlagen: Auftrag, Prüfbericht der QA, Spezifikation `development/strategiedesign/specification.md` auf `main` (5.1, 5.5), Plan `wp02`, `docs/technical/development-test-security-rules.md`, `docs/technical/pipwerk-studio.md` und `docs/user/pipwerk-studio.md` auf dem Stand des Commits
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`. Dies ist der erste Durchlauf zu diesem Auftrag. Nur blockierende Befunde verhindern das Bestehen.

## Angaben des Entwicklers

- Prüfskript `check --backend-port 18311 --frontend-port 15311` endet mit Exitcode 0. Vitest 479 Tests, Browsertests 231 in Chromium, Firefox und WebKit.
- Keine Änderung am Backend.

## Tester Funktion

Führe das Prüfskript `components/pipwerk-studio/scripts/check` auf freien Ports aus (nicht 5174, 8001; nimm `--backend-port 18391 --frontend-port 18392`) und belege den Exitcode. Prüfe alle Punkte des Umfangs und alle technischen Abnahmekriterien des Auftrags, Code, Tests und Dokumentation. Prüfe besonders, dass die Klassen aus `Wizard.tsx` im gebauten Stylesheet Regeln haben, dass die Regelvorlage in Englisch und Deutsch vollständig in der gewählten Sprache erscheint und dass die Änderungen keine bestehende Prüfung abschwächen. Änderungen am Prüfskript im Zweig `strategiedesign/wp02-functiontest`; nenne den Commit des Prüfskripts.

Ablage: `07-functiontest-1.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
