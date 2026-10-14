# Prüfauftrag Funktionstest, Auftrag 04, Durchlauf 1

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: Tester Funktion
- zu prüfender Commit: `62ebf6d1a4c6cebb3e97ab13390a0dad1f35f6ad` (Zweig `ablauftest/wp01-04`, aufgesetzt auf `2a153d355391f3ded119f2a0f4480cf84901176a`)
- Auftrag: `development/ablauftest/wp01/orders/04.md` auf dem Zweig `ablauftest/wp01`

## Gegenstand

Prüfe den Commit gegen Auftrag 04 und Befund B4 aus `development/ablauftest/wp01/reviews/2.md`. Laut Entwickler sind geändert:

- `docs/user/pipwerk-studio.md`: Schritt 2 und 3 und neuer Absatz „Zugriff von anderen Rechnern“ in Abschnitt 2, Glossar
- `docs/technical/pipwerk-studio.md`, Abschnitt 4a: Adresse bei `--host`

Schwerpunkte:

- Jede Aussage zu Adresse und `--host` stimmt mit dem Testumgebungsskript überein (`url_host`, Bindung, Meldungen von `start` und `status`). Führe dazu `start` einmal mit `--host 0.0.0.0` in deinem Arbeitsverzeichnis aus, mit freien Ports außer 18610 und 18611. Vergleiche die gemeldete Adresse und die von `status`. Beende danach mit `stop`.
- Jeder Befehl der Anwenderdokumentation ist so ausführbar, wie er dasteht.
- Die neuen Glossareinträge sind für Leser ohne Vorwissen verständlich und passen zum übrigen Dokument.

Führe das Prüfskript vollständig aus. Die Testumgebung in `test/ablauftest-wp01/` startest, beendest und veränderst du nicht. Brauchst du eine Änderung am Prüfskript, lege den Zweig `ablauftest/wp01-functiontest` neu auf dem zu prüfenden Commit an.

## Prüfgrundlagen

- `development/ablauftest/wp01/orders/04.md`, `development/ablauftest/wp01/reviews/2.md`
- `development/ablauftest/specification.md`, Abschnitte 6.1 und 7
- `docs/technical/pipwerk-studio.md`, Briefing Tester Funktion in `docs/technical/agentenrollen-und-briefings.md`

## Ablage

Schreibe den Testbericht ohne Commit als Datei `04-functiontest-1.md` in dein Arbeitsverzeichnis `work/ablauftest/wp01/functiontest/` im Entwicklungsverzeichnis. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit und den Commit des Prüfskripts vollständig und alle Befunde mit Fundstelle.
