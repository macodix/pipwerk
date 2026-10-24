# Prüfauftrag Tester Funktion: Auftrag 03, Durchlauf 1

- ref: `relay/wp01`
- zu prüfender Commit: `aeb85ece49405b4b7aa9725549d6e3f60d3c2a17` (Zweig `relay/wp01-03`)
- Prüfgrundlagen: Auftrag `development/relay/wp01/orders/03.md` (liegt auf `relay/wp01`: `git show origin/relay/wp01:development/relay/wp01/orders/03.md`), `development/relay/specification.md` (E3 letzter Satz, E4 bis E7, 4.1 bis 4.5, Abschnitt 5, 7, 8 Relay), `development/relay/plan.md` (`wp01`), Berichte `development/relay/wp01/tests/01-functiontest-1.md` und `02-functiontest-1.md` (Hinweise für das Relay), `docs/technical/development-test-security-rules.md`; Prüfskripte `components/pipwerk-relay/scripts/check` und `packages/relay-core/scripts/check` (der Auftrag hat `relay-core` geändert: `Way.clean_up`, `migrate_scripts`).
- Bericht: Dateiname `03-functiontest-1.md` im Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/relay/wp01/reports/`.
- Umfang: erster Durchlauf vollständig; Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md#umfang-der-prüfungen`, nur blockierende Befunde verhindern das Bestehen.
- Hinweise: Windows-Rechteprüfung nicht ausgeführt (kein Befund). Prüfe besonders Reihenfolge von Wiederholung, Absender und Schleife (4.1 Schritte 2 bis 4), Speichern vor Quittieren (E4), Meldungen ohne Meldung über Meldung, Fälschung ohne Meldung, Wiederanlauf, Begrenzungen und die Schonfrist für fehlerhafte Umschläge. Die Voreinstellungen (Abschnitt 21 und 25 der Dokumentation) legte der Entwickler fest.
