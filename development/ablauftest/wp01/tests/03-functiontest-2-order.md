# Prüfauftrag Funktionstest, Auftrag 03, Durchlauf 2

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: Tester Funktion
- zu prüfender Commit: `42d3938843f2cf321230a9a04a412bc01e2f40f3` (Zweig `ablauftest/wp01-03`)
- Auftrag: `development/ablauftest/wp01/orders/03.md` auf dem Zweig `ablauftest/wp01`
- vorheriger Bericht: `development/ablauftest/wp01/tests/03-functiontest-1.md` auf dem Zweig `ablauftest/wp01` (Commit `74cc3edd5623b19f6e3778078f95be5a142c1fb9`, Befunde F1 bis F4)

## Gegenstand

Nachprüfung nach der Korrektur von F1 bis F4. Prüfe außerdem, ob die Änderungen seit `74cc3edd5623b19f6e3778078f95be5a142c1fb9` neue Probleme verursachen. Führe das Prüfskript vollständig aus.

Vorgaben des Softwarearchitekten zu den Befunden:

- F2: Hauptweg der Anwenderdokumentation bleibt der Aufruf mit relativem Pfad aus dem obersten Verzeichnis. Abschnitt 4a der technischen Dokumentation nennt beide Aufrufe. Neue Fälle in `components/pipwerk-studio/backend/tests/test_testenv.py` weisen den relativen Aufruf nach (zu H1).
- F4: Jeder Befehl in Codeschrift steht in ausführbarer Form mit Pfad.

Geändert sind laut Entwickler `docs/user/pipwerk-studio.md`, `docs/technical/pipwerk-studio.md` (Abschnitte 4a und 6.1) und `components/pipwerk-studio/backend/tests/test_testenv.py`.

Alle übrigen Vorgaben aus `03-functiontest-1-order.md` gelten weiter. Die Testumgebung in `test/ablauftest-wp01/` startest, beendest und veränderst du nicht.

## Ablage

Schreibe den Testbericht ohne Commit als Datei `03-functiontest-2.md` in dein Arbeitsverzeichnis `work/ablauftest/wp01/functiontest/` im Entwicklungsverzeichnis. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit und den Commit des Prüfskripts vollständig und alle Befunde mit Fundstelle.
