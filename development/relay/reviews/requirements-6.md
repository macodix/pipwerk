# Prüfbericht Dokumente des Auftraggebers, Durchlauf 6 (Nachprüfung)

- Vorhaben: `relay`, Rolle QA, Phase 2 (Nachprüfung vor Überarbeitung der Spezifikation)
- Ergebnis: **bestanden**
- geprüfter Commit: `5871ed93f1d26e96a50c3d53bfd0da58a8cd395d` (Diff gegen `f0aa53ba82e618d5a19fa42b32e8136dc1db5685` gelesen)
- Umfang: wie im Prüfauftrag `requirements-6-order.md`: Befunde aus `requirements-5.md`, req-system-028, Status in den Anforderungen an das Nachrichtensystem, „Stand“ in `scope.md`, Nachweis des Vorhabens

## Blockierende Befunde

Keine.

## Prüfung 1: Befunde aus requirements-5.md

`requirements-5.md` hat keine blockierenden Befunde und drei Hinweise, alle Sache der Spezifikation. Im Diff ist req-relay-013 unverändert. Es gibt also nichts zu erledigen, und die Hinweise bleiben bei der Spezifikation. Ich melde sie nicht erneut.

## Prüfung 2: Widersprüche der geänderten Stellen

**Status in den Anforderungen an das Nachrichtensystem (Zeile 8).** Der Satz nennt `requirements-4.md` und `requirements-5.md` als bestanden. Beide Berichte liegen im Repository. `requirements-4.md` nennt „bestanden“ (Zeile 3), `requirements-5.md` ebenso. Ein Widerspruch zu req-relay-001 bis req-relay-013 entsteht nicht, der Inhalt der Anforderungen ist unverändert.

**`scope.md`, Abschnitt „Stand“ (neue Einträge ab 2026-10-23).** Die Einträge sind Verlauf und enthalten keine Anforderung. Alle verlinkten Dateien (`specification-4.md`, `specification-5.md`, `specification-2.html`, `plan-1.md`, `plan-2.md`, `plan-1.html`, `plan-2.html`, `wp01/acceptance/1.md`) liegen im Repository. Die Festlegung vom 2026-10-24 (erstes Paket nur mit lokalen Verzeichnissen) schränkt req-relay-003 und req-relay-004 nicht ein. Sie betrifft die Reihenfolge der Pakete, nicht die Anforderungen. Ein Widerspruch zu req-relay-001 bis req-relay-013 besteht nicht.

**req-system-028 gegen req-relay-001 bis req-relay-013 und req-system-005, req-system-026, req-system-027.** Ich habe keinen Widerspruch gefunden:

- req-relay-002, req-relay-003, req-relay-012: Nachrichten und Dateien müssen unterwegs zwischengespeichert werden. Das ist ein Erfordernis, req-system-028 verbietet nur Kopien „ohne Erfordernis“. Das Entfernen von Teilstücken und Zwischenergebnissen durch die Komponente selbst passt zur Übertragung von Dateien.
- req-relay-008, req-relay-013: Meldungen und Bestätigungen sind kleine Nachrichten, die Anforderung berührt sie nicht.
- req-system-005: Die Anforderung legt keine Umsetzung des Transports fest, req-system-028 auch nicht.
- req-system-026: Der Import übernimmt die Daten in den Datenbestand. Das deckt sich mit „genau eine Ablageform“ und „Importierte Dateien braucht die Komponente danach nicht mehr“. Abbrechen und Fortschritt bleiben unberührt. Abgebrochene Importe fallen unter das Entfernen nach Abbruch.
- req-system-027: Die Dateien des Abrufs sind Dateien, die „der Abruf schreibt“. Das Format des Imports bleibt festgelegt (siehe Hinweis 1).

## Prüfung 3: Nachweis des Vorhabens

Der Nachweis laut `scope.md` bleibt abbildbar. Eine Anfrage mit Broker, Symbol, Zeiteinheit und Zeitraum erreicht über Matrix und über Dateien den Abruf, die Dateien kommen an die Adresse des Absenders zurück. req-system-028 verlangt dafür zusätzlich nur, dass Zwischenstücke entfernt werden und die Dateien nach dem Import nicht ohne Wunsch des Anwenders bleiben. Das lässt sich bei beiden Wegen nachweisen.

## Hinweise (nicht blockierend, alle Sache der Spezifikation)

1. req-system-028, Absatz 3, gegen req-system-026 und req-system-027: „effizientestes Format“ bei Dateien, die der Abruf schreibt, trifft auf das Dateiformat des Imports, das req-system-026 mit „JSON oder CSV“ benennt. Die Spezifikation begründet die Wahl innerhalb dieser Festlegung. Ein anderes Format wäre eine Änderung der Festlegung und Sache des Auftraggebers.
2. req-system-028, Absatz 4: „Beim Import legt der Anwender fest, ob die Dateien behalten werden.“ Beim automatischen Abruf mit Import (req-system-027, req-test-003) ist kein Anwender beteiligt. Die Spezifikation legt fest, wann diese Wahl getroffen wird (zum Beispiel als Einstellung).
3. `scope.md`, „Geltende Dokumente“, nennt req-system-005, req-system-026 und req-system-027 „insbesondere“. req-system-028 kommt für das Vorhaben hinzu. Die Aufnahme in `scope.md` entscheidet der Projektleiter.
