# Prüfauftrag Sicherheitstest, Auftrag 04, Durchlauf 3

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: Tester Sicherheit
- zu prüfender Commit: `7c1a6b3214e17b8b292670a6e29a0cbe01b83637` (Zweig `ablauftest/wp01-04`)
- Auftrag: `development/ablauftest/wp01/orders/04.md` auf dem Zweig `ablauftest/wp01`
- vorherige Berichte: `development/ablauftest/wp01/tests/04-securitytest-2.md` (S2, S3) und `04-functiontest-2.md` (F3, F4) zu `1148fa60f578ac54539b9642de8e3850e390bb02`

## Gegenstand

Nachprüfung nach der Korrektur von S2/F3 und S3/F4. Laut Entwickler ist Folgendes geändert:

- Die Glossarzeile ist wieder in zwei Zeilen getrennt.
- Abschnitt 4a und Abschnitt 8 der technischen Dokumentation beschreiben die Prüfung des Kopfs `Host` nach dem Wortlaut, den der Softwarearchitekt vorgegeben hat.

Prüfe die vorherigen Befunde gegen den Code von Vite und des Testumgebungsskripts. Prüfe außerdem, ob durch die Änderung neue Probleme entstanden sind. Alle übrigen Vorgaben aus `04-securitytest-1-order.md` gelten weiter. Dies ist der dritte Durchlauf der Schleife.

## Ablage

Schreibe den Testbericht ohne Commit als Datei `04-securitytest-3.md` in dein Arbeitsverzeichnis `work/ablauftest/wp01/securitytest/` im Entwicklungsverzeichnis. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig und alle Befunde mit Fundstelle.
