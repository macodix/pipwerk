# Prüfauftrag Auftrag 04, Durchlauf 1

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `feb2832c9bacc90932db0550b8e0f5262223b505` auf Zweig `strategiedesign/wp02-04`, Ausgangscommit des Auftrags `74cdbae6e90d5db891790671dd6fcdbd23cddcac`
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/04.md`
- Prüfgrundlagen: Auftrag mit Abschnitt „Schnittstelle“, Spezifikation `development/strategiedesign/specification.md` auf `main` (Fassung vom 2026-10-20), Plan `wp02`, Abnahmebericht `acceptance/1.md`, `docs/technical/development-test-security-rules.md`, `docs/technical/pipwerk-domain.md`, `docs/technical/pipwerk-studio.md` auf dem Stand des Commits
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`. Dies ist der erste Durchlauf, er ist vollständig. Nur blockierende Befunde verhindern das Bestehen.

## Angaben des Entwicklers

- Bibliothek 1445 Tests, Backend 937 Tests bestanden; Ruff und mypy ohne Befund.
- Das Prüfskript `check` endet mit Exitcode 1 allein wegen Tests der bisherigen Oberfläche (sie kennt die Bindungsart `connection` nicht). Der Auftrag 05 ersetzt diese Oberfläche und wird getrennt geprüft. Prüfe, dass nur diese Tests scheitern, und nenne die Fehlschläge einzeln.

## Tester Funktion

Führe das Prüfskript `components/pipwerk-studio/scripts/check` auf freien Ports aus (nicht 5174, 8001; nimm `--backend-port 18751 --frontend-port 18752`) und belege den Exitcode. Prüfe alle Punkte des Umfangs und der technischen Abnahmekriterien des Auftrags, die Tests nach Abschnitt 7 der Spezifikation, die Dokumentation (Punkt 13) und die Regeln „Umfang der Prüfungen“. Änderungen am Prüfskript im Zweig `strategiedesign/wp02-functiontest`; nenne den Commit des Prüfskripts.

Ablage: `04-functiontest-1.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
