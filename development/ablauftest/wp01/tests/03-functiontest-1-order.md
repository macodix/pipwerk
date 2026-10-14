# Prüfauftrag Funktionstest, Auftrag 03, Durchlauf 1

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: Tester Funktion
- zu prüfender Commit: `74cc3edd5623b19f6e3778078f95be5a142c1fb9` (Zweig `ablauftest/wp01-03`, aufgesetzt auf `27678be771b96402262288695d35bac050d38058`)
- Auftrag: `development/ablauftest/wp01/orders/03.md` auf dem Zweig `ablauftest/wp01`

## Gegenstand

Prüfe den Commit gegen Auftrag 03 und gegen die Befunde B1 bis B3 aus dem Prüfbericht der QA `development/ablauftest/wp01/reviews/1.md`. Laut Entwickler ändert der Commit nur `docs/user/pipwerk-studio.md`.

Schwerpunkte:

- Jeder Befehl der Anwenderdokumentation ist so, wie er dasteht, aus dem genannten Verzeichnis ausführbar. Führe `start`, `status` und `stop` des Testumgebungsskripts so aus, wie es die Anwenderdokumentation beschreibt. Verwende dafür freie Ports, nicht 18610 und 18611; dort läuft die Testumgebung des Pakets.
- Prüfe, dass nach `stop` und erneutem `start` wieder Deutsch eingestellt ist.
- Prüfe, dass keine Aussage der Anwenderdokumentation dem Verhalten oder der technischen Dokumentation widerspricht.
- Prüfe die Erklärungen im Glossar.

Die Testumgebung in `test/ablauftest-wp01/` startest, beendest und veränderst du nicht.

Dein Zweig `ablauftest/wp01-functiontest` ist bereits in den Arbeitszweig zusammengeführt. Auf GitHub wurde er entfernt. Das Prüfskript liegt im zu prüfenden Commit. Ist eine Änderung am Prüfskript nötig, lege den Zweig neu auf dem zu prüfenden Commit an. Nenne den Commit des Prüfskripts im Bericht.

## Prüfgrundlagen

- `development/ablauftest/wp01/orders/03.md`, `development/ablauftest/wp01/reviews/1.md`
- `development/ablauftest/specification.md`, Abschnitt 7
- `docs/technical/pipwerk-studio.md`, `docs/technical/development-test-security-rules.md`
- Briefing Tester Funktion in `docs/technical/agentenrollen-und-briefings.md`

## Ablage

Schreibe den Testbericht ohne Commit als Datei `03-functiontest-1.md` in dein Arbeitsverzeichnis `work/ablauftest/wp01/functiontest/` im Entwicklungsverzeichnis. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit und den Commit des Prüfskripts vollständig und alle Befunde mit Fundstelle.
