# Prüfauftrag Sicherheitstest, Auftrag 01, Durchlauf 1

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: Tester Sicherheit
- zu prüfender Commit: `d6b354201feb1a8385819ad37946d98150edd1f6` (Zweig `ablauftest/wp01-01`)
- Auftrag: `development/ablauftest/wp01/orders/01.md` auf dem Zweig `ablauftest/wp01`

## Gegenstand

Prüfe die Sicherheit des Commits nach BSI-Grundschutz, OWASP und den Sicherheitsregeln in `docs/technical/development-test-security-rules.md`. Schwerpunkte: das neue Shell-Skript `components/pipwerk-studio/scripts/testenv` (Umgang mit Parametern und Pfaden, Quoting, gestartete Prozesse, Bindung an Adressen, Prozesskennungen und Protokolle in `.testenv/`, Aufräumen), der Test `test_testenv.py` und die geänderten Texte des Backends (Abschnitt 5 der Spezifikation: nur Texte geändert, kein neues Verhalten, keine neuen Angaben in Ausgaben). Keine Zugangsdaten, Rechnernamen, Benutzernamen oder Pfade des Entwicklungsrechners im Repository.

## Prüfgrundlagen

- `development/ablauftest/wp01/orders/01.md`
- `development/ablauftest/specification.md`, Abschnitte 5, 6.1 und E9, E10
- `docs/technical/development-test-security-rules.md`, `docs/technical/pipwerk-studio.md`
- Briefing Tester Sicherheit in `docs/technical/agentenrollen-und-briefings.md`

## Ablage

Schreibe den Testbericht ohne Commit als Datei `01-securitytest-1.md` in dein Arbeitsverzeichnis `work/ablauftest/wp01/securitytest/` im Entwicklungsverzeichnis. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig und alle Befunde mit Fundstelle.
