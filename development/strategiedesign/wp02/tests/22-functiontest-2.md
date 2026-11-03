# Testbericht Auftrag 22, Durchlauf 2 (Nachprüfung)

Geprüfter Commit: `f1196c83aed7eff67b783859e2caa1e61b12816a` (Zweig `strategiedesign/wp02-22`), Vorgänger `a2aab998b08ea041b5ca4929a2b758173eea80a9`. HEAD im Arbeitsverzeichnis kontrolliert.

## Erwartetes Verhalten

- B1: `test_remove_an_instance_with_its_uses` schreibt nach dem Entfernen von `ema20` genau 3 Befunde `EXPRESSION_EMPTY` fest (vorher `>= 1`).
- Der Diff zum Vorgänger ändert nur diesen Test.

## Prüfung

- B1 erfüllt: `len(empty) == 3`, drei verschiedene Elemente (`len({item.element …}) == 3`), das Element „kreuzen“ ist darunter, alle drei Befunde haben Feld `parameter:ausdruck` und Grund `slot`, Startpositionen genau `[3, 16, 43]`. Der Test besteht.
- Diff: `git diff a2aab99..f1196c8` zeigt eine Datei, `packages/domain-core/tests/test_operations.py`, nur dieser Test. Kein Code der Bibliothek geändert.
- Bibliothek `packages/domain-core`:
  - pytest: 1799 bestanden
  - ruff check: bestanden; ruff format --check: 80 Dateien formatiert
  - mypy: keine Fehler in 79 Quelldateien
- Prüfskript `check` laut Prüfauftrag nicht ausgeführt.

## Grenzfälle

Nicht über den Auftrag hinaus geprüft (Nachprüfung). Vermerk: Dass genau drei Elemente `ema20` verwendeten, folgt aus dem Test selbst (Anzahl, Verschiedenheit, „kreuzen“ enthalten); die Namen der beiden anderen Elemente prüft der Test nicht einzeln. Das ist kein Mangel gegen den Prüfauftrag.

## Ergebnis

bestanden. Keine Befunde.
