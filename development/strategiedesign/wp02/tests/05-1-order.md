# Prüfauftrag Auftrag 05, Durchlauf 1

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `752a1340a3bbdc320692044aaa03cb4f69caeccd` auf Zweig `strategiedesign/wp02-05`, Ausgangscommit des Auftrags `74cdbae6e90d5db891790671dd6fcdbd23cddcac`
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/05.md` (Fassung auf `strategiedesign/wp02`, ESLint und Prettier entfallen)
- Prüfgrundlagen: Auftrag, Spezifikation `development/strategiedesign/specification.md` auf `main`, Plan `wp02`, `docs/technical/development-test-security-rules.md`, `docs/technical/pipwerk-studio.md` auf dem Stand des Commits
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`. Dies ist der erste Durchlauf, er ist vollständig. Nur blockierende Befunde verhindern das Bestehen.

## Angaben des Entwicklers

- Typprüfung und Vitest (402 Tests) bestehen. Browsertests im Stub-Betrieb (`npm run e2e:stub`): bestanden, 4 Tests des Dialogs „Über pipwerk Studio“ je Browser übersprungen.
- Nicht gelaufen: Browsertests gegen das echte Backend und das Prüfskript, weil Auftrag 04 noch nicht in `strategiedesign/wp02` zusammengeführt war. Der Entwickler ergänzt das nach der Zusammenführung; dieser Durchlauf prüft den Code, die Tests und die Dokumentation dieses Commits.

## Tester Funktion

Prüfe alle Punkte des Umfangs und die technischen Abnahmekriterien 1 bis 3 und 5 ff. des Auftrags, soweit sie ohne das Backend aus Auftrag 04 prüfbar sind (`npm ci`, Typprüfung, Vitest, `npm run e2e:stub`, Code, Dokumentation). Nenne, was nicht prüfbar war, als offen und nicht als bestanden. Änderungen am Prüfskript im Zweig `strategiedesign/wp02-functiontest`; nenne den Commit des Prüfskripts. Falls du Ports brauchst: `18761` und `18762`.

Ablage: `05-functiontest-1.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
