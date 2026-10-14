# Prüfauftrag Sicherheitstest, Auftrag 04, Durchlauf 1

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: Tester Sicherheit
- zu prüfender Commit: `62ebf6d1a4c6cebb3e97ab13390a0dad1f35f6ad` (Zweig `ablauftest/wp01-04`, aufgesetzt auf `2a153d355391f3ded119f2a0f4480cf84901176a`)
- Auftrag: `development/ablauftest/wp01/orders/04.md` auf dem Zweig `ablauftest/wp01`

## Gegenstand

Prüfe die Änderungen seit `2a153d355391f3ded119f2a0f4480cf84901176a` nach BSI-Grundschutz, OWASP und den Sicherheitsregeln in `docs/technical/development-test-security-rules.md`. Geändert ist nur Dokumentation: Abschnitt 2 und Glossar der Anwenderdokumentation, Abschnitt 4a der technischen Dokumentation. Es geht um den Zugriff von anderen Rechnern mit `--host`.

Prüfe besonders:

- ob der Sicherheitshinweis zu `--host` richtig und vollständig bleibt, auch für eine einzelne Netzwerkadresse
- ob die Anleitung zu einem unsicheren Gebrauch verleitet, ohne vorher zu warnen
- ob die Dokumentation Zugangsdaten, Rechnernamen, Benutzernamen oder Pfade des Entwicklungsrechners enthält

## Prüfgrundlagen

- `development/ablauftest/wp01/orders/04.md`
- `docs/technical/development-test-security-rules.md`, `docs/technical/pipwerk-studio.md`, `components/pipwerk-studio/scripts/testenv`
- Briefing Tester Sicherheit in `docs/technical/agentenrollen-und-briefings.md`

## Ablage

Schreibe den Testbericht ohne Commit als Datei `04-securitytest-1.md` in dein Arbeitsverzeichnis `work/ablauftest/wp01/securitytest/` im Entwicklungsverzeichnis. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig und alle Befunde mit Fundstelle.
