# Testbericht Tester Funktion: Auftrag 02, Durchlauf 1

- ergebnis: **bestanden**
- geprüfter Commit: `216b725556b5f24972ce5650387a91290bd898f3` (Zweig `verfahren/umsetzung-02`), ausgecheckt und kontrolliert
- prüfskript: nicht geändert, kein eigener Zweig
- grundlagen: Auftrag 02, Spezifikation 7.3 und 7.4, Oberflächenentwurf, Umfang der Prüfungen

## Ausgeführte Prüfungen

| Prüfung | Ergebnis |
|---|---|
| Unit-Tests (`uv --directory tools/overview run python3 -m unittest`) | 62 Tests, OK |
| `ruff check .` | bestanden |
| `ruff format --check .` | 11 Dateien formatiert |
| `mypy --config-file mypy.ini` | keine Fehler in 9 Dateien |
| `npm … run install-browsers-local` | Chromium, Firefox, WebKit unter `browser/node_modules` abgelegt |
| `npm … run test-local` | 270 bestanden, 0 fehlgeschlagen (Chromium, Firefox, WebKit; 1,2 min) |

Abgedeckt durch den Browsertest: sechs Fenstergrößen mit 13 Ankern auf allen drei Ebenen (keine waagerechte Bildlaufleiste, nichts übereinander), Kontrast 4,5 : 1, Navigation mit Pfadleiste und Zurück-Taste, Tastatur mit Fokus, Stand als Farbe und Wort, Hervorhebung auf drei Ebenen, Zeitpunkte in UTC und Ortszeit (zwei Zeitzonen, ohne Skript UTC), nichts aus dem Netz.

## Abgleich mit Auftrag und Spezifikation

- Template: Pfadleiste ohne Skript verborgen, Verweise `a.kasten`, Fokusrahmen 3 px mit Ring, Hervorhebung 5 px `#1c4f9c`, Systemschrift, keine `url(` und kein `@import` (7.4 Punkte 1 bis 10 erfüllt, soweit der Browsertest sie prüft).
- Datenmodell von `generate.py` nicht geändert (Diff zu `9981662`: nur `template.html`, Browsertest, README, `.gitignore`).
- Technische Dokumentation (`tools/overview/README.md`): Gestaltung, Browsertest und Aufruf beschrieben und mit dem Stand übereinstimmend.

## Befunde

Keine blockierenden Befunde.

## Hinweise

- H1: `run-browser-test` (README, Abschnitt „Browsertest“) selbst nicht ausgeführt. Es verwendet `cd` und `npm ci`, die Browser liegen nicht im Benutzer-Cache. Geprüft wurde der gleichwertige Weg `install-browsers-local` und `test-local`. Das README nennt beide.
- H2: Der Tastaturtest prüft nur die Kästchen der ersten Ebene; Pfadleiste und zweite Ebene werden per Enter geprüft, aber nicht jedes Kästchen per Tab.
- H3: Die Optik (Farbwirkung, Lesbarkeit) wurde nicht gesehen, nur rechnerisch geprüft (Kontrast, Layout).
