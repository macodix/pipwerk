# Prüfauftrag Sicherheitstest, Auftrag 02, Durchlauf 1

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: Tester Sicherheit
- zu prüfender Commit: `33e87d5d64ca629bd466e6fa0d338ed35ebd42c1` (Zweig `ablauftest/wp01-02`, aufgesetzt auf `13ad9c7475c117e738652b534c69a394c4baa0ef`)
- Auftrag: `development/ablauftest/wp01/orders/02.md` auf dem Zweig `ablauftest/wp01`

## Gegenstand

Prüfe die Sicherheit der Änderungen seit `13ad9c7475c117e738652b534c69a394c4baa0ef` nach BSI-Grundschutz, OWASP und den Sicherheitsregeln in `docs/technical/development-test-security-rules.md`, gegen Abschnitt 5 der Spezifikation. Schwerpunkte: Git-Unterprozesse beim Bau in `buildinfo/gitRevision.ts` (feste Argumentliste, keine Shell, Zeitbegrenzung, Warnungen ohne Git-Ausgabe, Ausnahmetext, Pfad und Kennung), erneute Prüfung des eingesetzten Werts im Browser, Setzen aller Texte als Text und nicht als HTML, Verweis mit `noopener noreferrer`, keine Netzwerkanfrage des Dialogs, Freigabe in `server.fs.allow`. Keine Zugangsdaten, Rechnernamen, Benutzernamen oder Pfade des Entwicklungsrechners im Repository.

Entscheidung des Softwarearchitekten: `server.fs.allow` enthält die Datei `LICENSE` und dieselbe Datei mit dem Zusatz `?raw`, weil Vite den Import mit Zusatz prüft. Freigegeben sein darf nur genau diese Datei, kein Verzeichnis; prüfe das.

## Prüfgrundlagen

- `development/ablauftest/wp01/orders/02.md`
- `development/ablauftest/specification.md`, insbesondere Abschnitte 3.4 bis 3.6 und 5
- `docs/technical/development-test-security-rules.md`, `docs/technical/pipwerk-studio.md`
- Briefing Tester Sicherheit in `docs/technical/agentenrollen-und-briefings.md`

## Ablage

Schreibe den Testbericht ohne Commit als Datei `02-securitytest-1.md` in dein Arbeitsverzeichnis `work/ablauftest/wp01/securitytest/` im Entwicklungsverzeichnis. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig und alle Befunde mit Fundstelle.
