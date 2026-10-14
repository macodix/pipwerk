# Prüfauftrag QA, Arbeitspaket wp01, Durchlauf 3

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: QA
- zu prüfender Commit: `e60fd1c2655e7ca9e5fe9d00ad871117dd94d11d` (Arbeitszweig `ablauftest/wp01`, Aufträge 01 bis 04 zusammengeführt)
- Testumgebung: Arbeitsverzeichnis `test/ablauftest-wp01/` im Entwicklungsverzeichnis, neu gestartet auf genau diesem Commit mit `components/pipwerk-studio/scripts/testenv start --frontend-port 18610 --backend-port 18611`. Oberfläche: `http://127.0.0.1:18610/`. Backend: `127.0.0.1:18611`.
- vorheriger Bericht: `development/ablauftest/wp01/reviews/2.md` auf dem Arbeitszweig (Commit `1f1d52a2382f04d9d4207396f8ec25951e7cf916`, Befund B4)

## Gegenstand

Befund B4 ist über Auftrag 04 behoben (`development/ablauftest/wp01/orders/04.md`, Testberichte `development/ablauftest/wp01/tests/04-*`). Seit `1f1d52a2382f04d9d4207396f8ec25951e7cf916` sind nur `docs/user/pipwerk-studio.md` und `docs/technical/pipwerk-studio.md` geändert:

- Adresse im Browser
- Absatz „Zugriff von anderen Rechnern“ mit `--host`
- Glossar
- Abschnitte 4a und 8 der technischen Dokumentation

Entscheidung des Softwarearchitekten: Die Konfiguration von Vite bleibt ohne `allowedHosts`. Andere Rechner verwenden deshalb die Netzwerkadresse.

Der Stand hat sich seit deiner Prüfung geändert. Prüfe deshalb das Arbeitspaket erneut: alle Abnahmekriterien 1 bis 13 aus `development/ablauftest/plan.md`, Abschnitt `wp01`, und B4. Prüfe die Anwenderdokumentation als Ganzes auf Verständlichkeit und Vollständigkeit. Führe die Befehle der Anwenderdokumentation so aus, wie sie dort stehen, einschließlich des Starts mit `--host 0.0.0.0`. Verwende dafür dein Arbeitsverzeichnis und freie Ports.

Die Hinweise zur Durchführung aus `development/ablauftest/wp01/reviews/1-order.md` gelten weiter. Die Testumgebung auf den Ports 18610 und 18611 startest, beendest und veränderst du nicht. Für die technischen Nachweise führst du das Prüfskript aus und prüfst die Testberichte, je Auftrag und Prüfgebiet den letzten Durchlauf.

Dies ist der dritte Durchlauf der Prüfschleife zwischen QA und Softwarearchitekt.

## Prüfgrundlagen

wie in `development/ablauftest/wp01/reviews/1-order.md`, zusätzlich `development/ablauftest/wp01/reviews/2.md` und `development/ablauftest/wp01/orders/04.md`.

## Ablage

Schreibe den Prüfbericht ohne Commit als Datei `3.md` in dein Arbeitsverzeichnis `work/ablauftest/wp01/qa/` im Entwicklungsverzeichnis. Der Bericht nennt:

- „bestanden“ oder „nicht bestanden“
- den geprüften Commit vollständig
- die Ports von Oberfläche und Backend der Testumgebung
- alle Befunde mit Fundstelle
