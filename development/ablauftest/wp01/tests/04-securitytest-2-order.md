# Prüfauftrag Sicherheitstest, Auftrag 04, Durchlauf 2

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: Tester Sicherheit
- zu prüfender Commit: `1148fa60f578ac54539b9642de8e3850e390bb02` (Zweig `ablauftest/wp01-04`)
- Auftrag: `development/ablauftest/wp01/orders/04.md` auf dem Zweig `ablauftest/wp01`
- vorherige Berichte: `development/ablauftest/wp01/tests/04-securitytest-1.md` (S1) und `04-functiontest-1.md` (F1, F2) zu `62ebf6d1a4c6cebb3e97ab13390a0dad1f35f6ad`

## Gegenstand

Nachprüfung nach der Korrektur von S1, F1 und F2. Es wurde nur Dokumentation geändert. Der Sicherheitshinweis steht jetzt vor dem Befehl. Die Konfiguration von Vite bleibt nach Entscheidung des Softwarearchitekten unverändert, ohne `allowedHosts`, damit die Prüfung des Kopfs `Host` als Schutz vor DNS-Rebinding erhalten bleibt. Die Dokumentation nennt nur noch die Netzwerkadresse und beschreibt diese Prüfung in den Abschnitten 4a und 8 der technischen Dokumentation.

Prüfe die vorherigen Befunde und ob die Änderungen seit `62ebf6d1a4c6cebb3e97ab13390a0dad1f35f6ad` neue Probleme verursachen. Alle übrigen Vorgaben aus `04-securitytest-1-order.md` gelten weiter.

## Ablage

Schreibe den Testbericht ohne Commit als Datei `04-securitytest-2.md` in dein Arbeitsverzeichnis `work/ablauftest/wp01/securitytest/` im Entwicklungsverzeichnis. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig und alle Befunde mit Fundstelle.
