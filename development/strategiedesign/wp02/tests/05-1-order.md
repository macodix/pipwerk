# Prüfauftrag Auftrag 05, Durchlauf 1

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `fa95dd6e9b92aafeecd3b3dca6b2a15443e2eee1` auf Zweig `strategiedesign/wp02-05`, Ausgangscommit des Auftrags `74cdbae6e90d5db891790671dd6fcdbd23cddcac`; der Zweig enthält Auftrag 04 (`feb2832c9bacc90932db0550b8e0f5262223b505`) über `strategiedesign/wp02`
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/05.md` (ESLint und Prettier entfallen)
- Prüfgrundlagen: Auftrag, Spezifikation `development/strategiedesign/specification.md` auf `main`, Plan `wp02`, `docs/technical/development-test-security-rules.md`, `docs/technical/pipwerk-studio.md` auf dem Stand des Commits
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`. Dies ist der erste Durchlauf, er ist vollständig. Nur blockierende Befunde verhindern das Bestehen.

## Angaben des Entwicklers

- Das Prüfskript `check --backend-port 18771 --frontend-port 18772` endet mit Exitcode 0. Vitest 403 Tests, Browsertests gegen das echte Backend 150 von 150 in Chromium, Firefox und WebKit.
- Behoben: neun Befundtexte, Wertlinien bei `null` im Baum der Bausteine, Zustand zwischen Browsertests.
- Die sechs Bildschirmbilder in `work/strategiedesign/wp02/reports/05-screenshots/` sind vom früheren Lauf im Stub-Betrieb.

## Tester Funktion

Führe das Prüfskript `components/pipwerk-studio/scripts/check` auf freien Ports aus (nicht 5174, 8001; nimm `--backend-port 18761 --frontend-port 18762`) und belege den Exitcode. Prüfe alle Punkte des Umfangs und alle technischen Abnahmekriterien des Auftrags, Code, Tests und Dokumentation. Änderungen am Prüfskript im Zweig `strategiedesign/wp02-functiontest`; nenne den Commit des Prüfskripts.

Ablage: `05-functiontest-1.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
