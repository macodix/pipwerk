# Prüfauftrag Funktionstest, Auftrag 02, Durchlauf 2

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: Tester Funktion
- zu prüfender Commit: `92381f9525193e02566e685bae2223d518cf95bd` (Zweig `ablauftest/wp01-02`)
- Auftrag: `development/ablauftest/wp01/orders/02.md` auf dem Zweig `ablauftest/wp01`
- vorheriger Bericht: `development/ablauftest/wp01/tests/02-functiontest-1.md` auf dem Zweig `ablauftest/wp01` (Commit `33e87d5d64ca629bd466e6fa0d338ed35ebd42c1`, Befunde F1 bis F5)

## Gegenstand

Nachprüfung nach der Korrektur der Befunde F1 bis F5. Prüfe die vorherigen Befunde und ob die Änderungen seit `33e87d5d64ca629bd466e6fa0d338ed35ebd42c1` neue Probleme verursachen. Führe das Prüfskript vollständig aus.

Entscheidung des Softwarearchitekten zu F3: Es gilt Abschnitt 4.2 der Spezifikation wörtlich. Bei offenem Dialog bleibt der Fokus im Dialog, auch bei Tab vom letzten und Umschalt+Tab vom ersten fokussierbaren Element. Weil der Browser das in Chromium und WebKit nicht vollständig leistet, hält der Dialog den Fokus selbst: Tab und Umschalt+Tab springen an den Enden innerhalb des Dialogs weiter. Alles andere an E8 bleibt. Der Browsertest prüft streng, dass der Fokus nach jedem Tastendruck im Dialog liegt.

Zu F4: Der Fall „ohne Git-Arbeitsbereich unbekannt“ ist ein eigener Test, der in einem Git-Arbeitsbereich als übersprungen erscheint.

Führe den zu prüfenden Commit in deinen Zweig `ablauftest/wp01-functiontest` zusammen, übertrage ihn und nenne den Commit des Prüfskripts im Bericht. Alle übrigen Vorgaben aus `development/ablauftest/wp01/tests/02-functiontest-1-order.md` gelten weiter.

## Ablage

Schreibe den Testbericht ohne Commit als Datei `02-functiontest-2.md` in dein Arbeitsverzeichnis `work/ablauftest/wp01/functiontest/` im Entwicklungsverzeichnis. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit und den Commit des Prüfskripts vollständig und alle Befunde mit Fundstelle.
