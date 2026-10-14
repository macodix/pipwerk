# Prüfauftrag Funktionstest, Auftrag 04, Durchlauf 2

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: Tester Funktion
- zu prüfender Commit: `1148fa60f578ac54539b9642de8e3850e390bb02` (Zweig `ablauftest/wp01-04`)
- Auftrag: `development/ablauftest/wp01/orders/04.md` auf dem Zweig `ablauftest/wp01`
- vorherige Berichte: `development/ablauftest/wp01/tests/04-functiontest-1.md` (F1, F2) und `04-securitytest-1.md` (S1) zu `62ebf6d1a4c6cebb3e97ab13390a0dad1f35f6ad`

## Gegenstand

Nachprüfung nach der Korrektur von F1, F2 und S1. Entscheidungen des Softwarearchitekten:

- S1: Der Sicherheitshinweis steht vor dem Befehl mit `--host 0.0.0.0`.
- F1: Die Konfiguration von Vite bleibt unverändert. Es gibt kein `allowedHosts`, damit der Schutz vor DNS-Rebinding erhalten bleibt. Die Dokumentation nennt nur die Netzwerkadresse und sagt, dass ein Name des Rechners abgewiesen wird. Die technische Dokumentation nennt dazu den Grund.
- F2: Abschnitt 4a gibt die Regel von `url_host` vollständig wieder.

Prüfe die vorherigen Befunde und ob die Änderungen seit `62ebf6d1a4c6cebb3e97ab13390a0dad1f35f6ad` neue Probleme verursachen. Führe das Prüfskript vollständig aus. Alle übrigen Vorgaben aus `04-functiontest-1-order.md` gelten weiter.

## Ablage

Schreibe den Testbericht ohne Commit als Datei `04-functiontest-2.md` in dein Arbeitsverzeichnis `work/ablauftest/wp01/functiontest/` im Entwicklungsverzeichnis. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit und den Commit des Prüfskripts vollständig und alle Befunde mit Fundstelle.
