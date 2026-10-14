# Prüfauftrag Funktionstest, Auftrag 01, Durchlauf 2

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: Tester Funktion
- zu prüfender Commit: `83466cd1bd2daab04d1596beca1ec296fee386c4` (Zweig `ablauftest/wp01-01`)
- Auftrag: `development/ablauftest/wp01/orders/01.md` auf dem Zweig `ablauftest/wp01`
- vorheriger Bericht: `development/ablauftest/wp01/tests/01-functiontest-1.md` auf dem Zweig `ablauftest/wp01` (Commit `d6b354201feb1a8385819ad37946d98150edd1f6`, Befunde F1 und F2)

## Gegenstand

Nachprüfung nach der Korrektur der Befunde F1 und F2 aus Durchlauf 1 und der Befunde S1 und S2 aus `development/ablauftest/wp01/tests/01-securitytest-1.md`. Prüfe die vorherigen Befunde und ob die Änderungen seit `d6b354201feb1a8385819ad37946d98150edd1f6` neue Probleme verursachen, einschließlich der geänderten Dokumentation. Führe das Prüfskript vollständig aus.

Setze deinen Zweig `ablauftest/wp01-functiontest` auf den zu prüfenden Commit auf, zum Beispiel durch Zusammenführen dieses Commits in deinen Zweig, übertrage ihn und nenne den Commit des Prüfskripts im Bericht.

Entscheidung des Softwarearchitekten zu deiner offenen Frage: `pip-audit` und `npm audit` laufen im Prüfskript nur mit `--with-audit`, so wie du es umgesetzt und in Abschnitt 6.4 beschrieben hast. Der bekannte Befund zu `source-map-js` ist nicht Gegenstand dieses Pakets.

Alle übrigen Vorgaben aus `development/ablauftest/wp01/tests/01-functiontest-1-order.md` gelten weiter.

## Ablage

Schreibe den Testbericht ohne Commit als Datei `01-functiontest-2.md` in dein Arbeitsverzeichnis `work/ablauftest/wp01/functiontest/` im Entwicklungsverzeichnis. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit und den Commit des Prüfskripts vollständig und alle Befunde mit Fundstelle.
