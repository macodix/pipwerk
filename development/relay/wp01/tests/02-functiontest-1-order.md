# Prüfauftrag Tester Funktion: Auftrag 02, Durchlauf 1

- ref: `relay/wp01`
- zu prüfender Commit: `487f59966134088052e7e3d5bd76a89c3f9d13b2` (Zweig `relay/wp01-02`)
- Prüfgrundlagen: Auftrag `development/relay/wp01/orders/02.md`, `development/relay/specification.md` (E4, 3.5, 3.7, 4.4, Abschnitt 5, 7, 8), `development/relay/plan.md` (`wp01`), `docs/technical/development-test-security-rules.md`; Prüfskript `packages/relay-core/scripts/check`. Der Auftrag liegt auf `relay/wp01`, nicht im Zweig des Commits: `git show origin/relay/wp01:development/relay/wp01/orders/02.md`.
- Bericht: Dateiname `02-functiontest-1.md` im Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/relay/wp01/reports/`.
- Umfang: erster Durchlauf vollständig; Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md#umfang-der-prüfungen`, nur blockierende Befunde verhindern das Bestehen.
- Entscheidung des Entwicklungsleiters zu einer Abweichung: Der Entwickler vermerkt die Nachrichten-ID als gesehen, bevor er die Bestätigung schickt, und quittiert erst danach (Dokumentation Abschnitt 12). Spezifikation 3.7 nennt erst Bestätigung, dann Quittieren und Vermerken. Prüfe, ob das beobachtbare Verhalten nach 3.7 und Abschnitt 8 gleich bleibt (keine doppelte Übergabe, keine verlorene Bestätigung, keine Nachricht als gesehen ohne gemeldetes Speichern). Ist es gleich, ist das kein Befund. Ebenso die Schonfrist von 5 Minuten bei fehlenden Anlagen.
- Hinweis zu Windows: Die Rechteprüfung unter Windows ist nicht ausgeführt, dokumentiert, kein Befund.
