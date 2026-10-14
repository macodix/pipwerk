# Prüfauftrag QA, Arbeitspaket wp01, Durchlauf 2

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: QA
- zu prüfender Commit: `1f1d52a2382f04d9d4207396f8ec25951e7cf916` (Arbeitszweig `ablauftest/wp01`, Aufträge 01 bis 03 zusammengeführt)
- Testumgebung: Arbeitsverzeichnis `test/ablauftest-wp01/` im Entwicklungsverzeichnis, neu gestartet auf genau diesem Commit mit `components/pipwerk-studio/scripts/testenv start --frontend-port 18610 --backend-port 18611`. Oberfläche: `http://127.0.0.1:18610/`. Backend: `127.0.0.1:18611`.
- vorheriger Bericht: `development/ablauftest/wp01/reviews/1.md` auf dem Arbeitszweig (Commit `855e0eb4d80c7d458fd361d8ad8f3cc0f76e0651`, Befunde B1 bis B3)

## Gegenstand

Die Befunde B1 bis B3 sind über Auftrag 03 behoben: `development/ablauftest/wp01/orders/03.md`, Testberichte `development/ablauftest/wp01/tests/03-*`. Seit `855e0eb4d80c7d458fd361d8ad8f3cc0f76e0651` haben sich geändert:

- `docs/user/pipwerk-studio.md`
- `docs/technical/pipwerk-studio.md`, Abschnitte 4a und 6.1
- `components/pipwerk-studio/backend/tests/test_testenv.py`, neue Fälle für den Aufruf über einen relativen Pfad

Der Code hat sich seit deiner Prüfung geändert. Prüfe deshalb das Arbeitspaket erneut:

- alle Abnahmekriterien 1 bis 13 aus `development/ablauftest/plan.md`, Abschnitt `wp01`
- die Befunde B1 bis B3
- die Anwenderdokumentation als Ganzes auf Verständlichkeit und Vollständigkeit

Die Befehle der Anwenderdokumentation führst du so aus, wie sie dort stehen.

Die Hinweise zur Durchführung aus `development/ablauftest/wp01/reviews/1-order.md` gelten weiter. Die Testumgebung auf den Ports 18610 und 18611 startest, beendest und veränderst du nicht. Für eigene Läufe verwendest du dein Arbeitsverzeichnis und andere freie Ports. Für die technischen Nachweise führst du das Prüfskript aus und prüfst die Testberichte. Maßgeblich ist je Auftrag und Prüfgebiet der letzte Durchlauf.

## Prüfgrundlagen

wie in `development/ablauftest/wp01/reviews/1-order.md`, zusätzlich `development/ablauftest/wp01/reviews/1.md` und `development/ablauftest/wp01/orders/03.md`.

## Ablage

Schreibe den Prüfbericht ohne Commit als Datei `2.md` in dein Arbeitsverzeichnis `work/ablauftest/wp01/qa/` im Entwicklungsverzeichnis. Der Bericht nennt:

- „bestanden“ oder „nicht bestanden“
- den geprüften Commit vollständig
- den Port der Oberfläche und den Port des Backends der Testumgebung
- alle Befunde mit Fundstelle
