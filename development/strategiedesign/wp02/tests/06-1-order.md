# Prüfauftrag Auftrag 06, Durchlauf 1

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `8023d25b0bc3102c7f4267b018c141671ec799ae` auf Zweig `strategiedesign/wp02-06`, Ausgangscommit des Auftrags `1bd5e49c14d5330a39c5ad93c747699ec078a3a8` (enthält die Aufträge 04 und 05)
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/06.md`
- Prüfgrundlagen: Auftrag, Spezifikation `development/strategiedesign/specification.md` auf `main`, Plan `wp02`, `docs/technical/development-test-security-rules.md`, `docs/technical/pipwerk-studio.md`, `docs/technical/pipwerk-studio-testfaelle.md` auf dem Stand des Commits
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`. Dies ist der erste Durchlauf, er ist vollständig. Nur blockierende Befunde verhindern das Bestehen.

## Angaben des Entwicklers

- Prüfskript `check --backend-port 18781 --frontend-port 18782` endet mit Exitcode 0. Vitest 474 Tests, Browsertests gegen das echte Backend 210 von 210 in Chromium, Firefox und WebKit.
- Keine Änderung am Backend. Die Vitest-Tests nutzen ein Backend im Speicher mit kleinem Teil der Ausdrucksprache; die echte Sprache weisen die Browsertests nach.

## Tester Funktion

Führe das Prüfskript `components/pipwerk-studio/scripts/check` auf freien Ports aus (nicht 5174, 8001; nimm `--backend-port 18791 --frontend-port 18792`) und belege den Exitcode. Prüfe alle Punkte des Umfangs und alle technischen Abnahmekriterien des Auftrags, Code, Tests und Dokumentation (Anwenderdokumentation auf Vollständigkeit gegen Auftrag Punkt 9 und Spezifikation Abschnitt 9). Änderungen am Prüfskript im Zweig `strategiedesign/wp02-functiontest`; nenne den Commit des Prüfskripts.

Ablage: `06-functiontest-1.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
