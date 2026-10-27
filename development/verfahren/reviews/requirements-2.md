# Prüfbericht Dokumente des Auftraggebers, Vorhaben verfahren, Durchlauf 2 (Nachprüfung)

- Ergebnis: **bestanden** (0 blockierende Befunde)
- Geprüfter Commit: `051e6c8dcdd1d7b58bbfc6f22337d05ba4cc7d2f`
- Gegenstand: `development/verfahren/scope.md`, geänderte Stellen in den Festlegungen 1, 5 und 7 (Diff zu `b2ed4d6b14704836597ab91102b1d1144830a931`) und der neue Eintrag unter „Stand“. Nicht geprüft: H1 bis H15, unveränderte Stellen, der offene Punkt zu den Präsentationen.

## Antworten auf die Prüfpunkte

1. **B1 erledigt: ja.** Festlegung 5 nennt jetzt die einzelne Ansicht als Maßstab, auch für eine neue Ansicht in einer bestehenden Komponente. „Umgesetzt“ heißt: Die Ansicht lässt sich in der Testumgebung öffnen und bedienen. „Oberfläche“ und „Grundgerüst“ kommen nicht mehr vor. Die beiden Fragen aus Durchlauf 1 sind damit beantwortet. Zwei Restunschärfen stehen als Hinweise H18 und H19.
2. **H16 beantwortet: ja.** Festlegung 1: Der Projektleiter bearbeitet die Meldung nach dem dritten Abbruch selbst und wendet sich nur nach Festlegung 2 an den Auftraggeber. **H17 beantwortet: ja.** Festlegung 7: „alle drei Bedingungen zugleich“.
3. **Neue Widersprüche: keine.** Festlegung 1 (neuer Satz) stimmt mit Festlegung 2 überein. Festlegung 5 und 7 widersprechen keiner anderen Festlegung. Neu gefunden ist ein Sprachfehler (H20), der den Sinn nicht ändert.

## Blockierende Befunde

Keine.

## Hinweise (je eine Zeile)

Sache der Spezifikation:
- H18 (F5): „Ansicht“ ist nicht abgegrenzt (Seite, Dialog, Zustand einer Seite?). Die Spezifikation muss festlegen, was als eine Ansicht zählt.
- H19 (F5): „in der Testumgebung“: Es ist nicht gesagt, ob die Testumgebung eines noch nicht integrierten Arbeitspakets genügt oder ob die Ansicht im integrierten Stand bestehen muss. „bedienen lässt“ ist ohne Prüfkriterium. Die Spezifikation legt Zeitpunkt und Kriterium fest.
- H21 (F1): „bearbeitet sie selbst“ nennt nicht, was der Projektleiter nach dem dritten Abbruch tut (erneut starten, Ursache suchen, Aufgabe ändern) und ab wann er den Auftraggeber braucht. Die Spezifikation regelt das zusammen mit H7 und H8.

Sprachlich:
- H20 (F7): Der Satz „Sie blockiert die Arbeit vollständig blockiert, das Verhalten von pipwerk für den Anwender betrifft und … nicht selbst lösen können“ hat ein doppeltes „blockiert“ und eine nicht parallele Satzfolge. Die Bedeutung bleibt erkennbar. Der Wortlaut ist zu berichtigen.

Offen aus Durchlauf 1 und hier nicht erneut geprüft: H1 bis H15 (werden in technischen Dokumenten und Spezifikation erledigt).
