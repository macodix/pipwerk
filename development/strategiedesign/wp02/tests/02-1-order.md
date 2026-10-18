# Prüfauftrag Auftrag 02, Durchlauf 1

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `b9cc906c6981a927961ca9bd08cbd51f01249529` auf Zweig `strategiedesign/wp02-02`. Er enthält den Arbeitszweig `strategiedesign/wp02` auf `f42b0ab4fe570cf75692a4be039eabe6e6544b6d` (Aufträge 01 und 03 zusammengeführt, `main` mit dem angeglichenen Glossar).
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/02.md` mit dem Abschnitt „Fortsetzung vom 2026-10-18“
- Prüfgrundlagen: der Auftrag; `development/strategiedesign/specification.md` (Abschnitte 3.4, 3.6, 5.2 bis 5.4, 6, 7 Punkt Browsertest, 9 Punkt 3); `development/strategiedesign/plan.md` (`wp02`, Abnahmekriterien 1 bis 12); `development/strategiedesign/scope.md` mit den Testfällen `str-01` und `str-03` und ihren Dokumenten unter `contracts/strategies/v1/testcases/`; `docs/technical/development-test-security-rules.md`, `docs/technical/pipwerk-studio.md`, `docs/technical/pipwerk-domain.md`, `docs/technical/glossar.md`, `docs/user/pipwerk-studio.md`
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`. Dieser Durchlauf ist der erste und vollständig. Nur blockierende Befunde verhindern das Bestehen, alles andere steht als Hinweis im Bericht.

## Angaben des Entwicklers

- Neue Browsertests `e2e/testcases.spec.ts` (`str-01`, `str-03` aus „Neue Strategie“ nur über Bedienhandlungen, Vergleich ohne Kennungen, Lage und Zeitpunkte), `e2e/workflows.spec.ts` (Objektverzeichnis ändern, Sprache, Befunde), `e2e/strategies.spec.ts` (Rückfragen, Öffnen und Löschen, Regeln, unbekannter Typ); Hilfen in `e2e/support.ts` und `e2e/builder.ts`.
- `src/userDocumentation.test.ts`: Gegenüberstellung der Anleitung in der Anwenderdokumentation mit den Testfalldokumenten (technisches Abnahmekriterium 4) und der Befundtexte mit `de.json`.
- Anwenderdokumentation mit Arbeitsabläufen, Schreibweise der Ausdrücke, Befunden und beiden Testfällen als Anleitung; technische Dokumentation Abschnitt 6.3 und Nachweise zur Sprache (H4); Glossar „Zeiteinheit“ und „Datentyp“.
- Vitest 784 Tests, Browsertests 123 bestanden und 6 übersprungen (die bestehenden Tests „ohne Git-Arbeitsbereich“); Prüfskript „all checks passed“ auf dem Stand `fc58f4dbcb930996874f5330f937964d2c38a7a6`. Der letzte Commit ändert nur die Anwenderdokumentation (Verwaltung „kann“ eigene Auslöser haben).
- Keine Fehler in Bibliothek, Backend oder Web-API gefunden.

## Tester Funktion

Führe das Prüfskript `components/pipwerk-studio/scripts/check` ohne `--with-audit` auf freien Ports aus, nicht 5174 und 8001, und belege den Exitcode. Prüfe gegen den Auftrag, besonders die technischen Abnahmekriterien 1 bis 5: Die Testfälle werden wirklich nur über Bedienhandlungen aufgebaut, der Vergleich mit dem Testfalldokument ist vollständig, die Browsertests decken die Abnahmekriterien 2, 5, 7 bis 11 von `wp02` ab, die Ausdrücke der Anleitung stimmen mit den Testfalldokumenten überein. Prüfe Programmierregeln und die technische Dokumentation auf Vollständigkeit und Übereinstimmung mit dem Code, die Anwenderdokumentation auf Übereinstimmung mit Oberfläche, Code und Glossar. Änderungen am Prüfskript machst du im Zweig `strategiedesign/wp02-functiontest`, aufgesetzt auf dem geprüften Commit. Nenne den Commit des Prüfskripts.

Ablage: `02-functiontest-1.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis

## Tester Sicherheit

Prüfe den Commit nach BSI-Grundschutz, OWASP und den Sicherheitsregeln: Browsertests schreiben nicht außerhalb ihres temporären Verzeichnisses und stellen das Objektverzeichnis wieder her, das Ersetzen von Antworten mit `page.route` bleibt auf die Tests beschränkt, keine festen Ports, Pfade, Rechnernamen oder Zugangsdaten in Code, Tests und Dokumentation, Abhängigkeiten unverändert, keine Änderung am Produktionscode, die Texte als HTML auswertet.

Ablage: `02-securitytest-1.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
