# Prüfauftrag Auftrag 08, Durchlauf 1

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `7f2b146db5e3177ff42d57a3bd8b0893693a98d2` auf Zweig `strategiedesign/wp02-08`, Ausgangscommit `f2c1c8af22d9cfa9eba83b70984ea3ab5141bd3b`
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/08.md`; Befund B3 in `strategiedesign/wp02:development/strategiedesign/wp02/reviews/3.md`
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`. Nur blockierende Befunde verhindern das Bestehen.

## Tester Funktion

Der Auftrag ändert nur Dokumentation. Prüfe, dass der Diff zum Ausgangscommit nur Dateien unter `docs/` enthält, dass die Aussagen zu den Wahlkarten in `docs/user/pipwerk-studio.md` (Abschnitt 9) und `docs/technical/pipwerk-studio.md` mit der Regel `.choice-cards` in `components/pipwerk-studio/frontend/src/styles.css` übereinstimmen, dass keine Pfade, Benutzer- oder Rechnernamen des Entwicklungsrechners enthalten sind und dass keine weitere Stelle der Dokumentation die alte Aussage („untereinander“, „füllen die Breite“) wiederholt. Das Prüfskript `check` musst du nicht ausführen (Code unverändert).

Ablage: `08-functiontest-1.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
