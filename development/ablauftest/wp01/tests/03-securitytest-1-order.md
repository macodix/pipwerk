# Prüfauftrag Sicherheitstest, Auftrag 03, Durchlauf 1

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: Tester Sicherheit
- zu prüfender Commit: `74cc3edd5623b19f6e3778078f95be5a142c1fb9` (Zweig `ablauftest/wp01-03`, aufgesetzt auf `27678be771b96402262288695d35bac050d38058`)
- Auftrag: `development/ablauftest/wp01/orders/03.md` auf dem Zweig `ablauftest/wp01`

## Gegenstand

Prüfe die Änderungen seit `27678be771b96402262288695d35bac050d38058` nach BSI-Grundschutz, OWASP und den Sicherheitsregeln in `docs/technical/development-test-security-rules.md`. Laut Entwickler ist nur `docs/user/pipwerk-studio.md` geändert.

Prüfe besonders:

- Sicherheitsrelevante Aussagen der Anwenderdokumentation sind richtig und vollständig. Dazu gehören der Hinweis zu `--host`, das Verhalten beim Beenden der Testumgebung und die Aufrufe.
- Im Repository stehen keine Zugangsdaten, Rechnernamen, Benutzernamen und keine Pfade des Entwicklungsrechners.

## Prüfgrundlagen

- `development/ablauftest/wp01/orders/03.md`
- `docs/technical/development-test-security-rules.md`, `docs/technical/pipwerk-studio.md`
- Briefing Tester Sicherheit in `docs/technical/agentenrollen-und-briefings.md`

## Ablage

Schreibe den Testbericht ohne Commit als Datei `03-securitytest-1.md` in dein Arbeitsverzeichnis `work/ablauftest/wp01/securitytest/` im Entwicklungsverzeichnis. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig und alle Befunde mit Fundstelle.
