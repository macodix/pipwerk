# Prüfbericht Dokumente des Auftraggebers, Durchlauf 5 (Nachprüfung)

- Vorhaben: `relay`
- Rolle: QA
- Ergebnis: **bestanden**
- geprüfter Commit: `f0aa53ba82e618d5a19fa42b32e8136dc1db5685`
- Umfang: nur req-relay-013 (neu) und der Abschnitt „Stand“ in `development/relay/scope.md`, wie im Prüfauftrag `requirements-5-order.md` verlangt
- Grundlage der Festlegung: Änderungsnachweis in `anforderungen-nachrichtensystem.md` (Entscheidung des Auftraggebers im Chat am 2026-10-23) und `scope.md`, Stand, letzter Eintrag

## Blockierende Befunde

Keine.

## Prüfung 1: Eindeutigkeit und Widersprüche

req-relay-013 gibt die Festlegung „Empfangsbestätigung auf Wunsch des Absenders“ eindeutig wieder. Der Absender wählt je Nachricht. Die empfangende laufende Komponente bestätigt automatisch über pipwerk relay, sobald sie die Nachricht gespeichert hat. Die Bestätigung nennt die Nachrichten-ID. Bleibt sie aus, meldet der Absender das dem Anwender.

Widersprüche habe ich nicht gefunden:

- req-relay-002: Die Bestätigung läuft als Nachricht über die dort beschriebenen Wege und Relays. Zustellung und Bestätigung sind getrennt.
- req-relay-005: Die Bestätigung geht an die Adresse des Absenders. Das deckt sich mit dem Satz „Antworten und Meldungen gehen an die Adresse des Absenders“.
- req-relay-008: Der zweite Absatz von req-relay-013 grenzt ab. Das Relay prüft nicht, ob die Komponente abholt. Es meldet nur, was es nicht zustellen kann. Das widerspricht req-relay-008 nicht.
- req-relay-012: Berührt sich nicht mit der Empfangsbestätigung.
- req-grund-003 bis req-grund-006: Die Bestätigung passt in den Aufbau einer Nachricht. „Nennt die Nachrichten-ID der bestätigten Nachricht“ entspricht `Bezug-Nachrichten-ID` (req-grund-004, req-grund-006). Die Zuordnung ist Sache der Spezifikation.

## Prüfung 2: Nachweis des Vorhabens

Der Nachweis laut `scope.md` bleibt abbildbar. Eine Anfrage erreicht den Abruf, und die Dateien kommen zurück, einmal über Matrix und einmal über Dateien. req-relay-013 ist für den Nachweis nicht erforderlich. Bei einer Anfrage ist die Antwort die Bestätigung, es kommt also keine zusätzliche Strecke dazu.

## Hinweise (nicht blockierend, alle Sache der Spezifikation)

1. req-relay-013, Absatz 1: „je Nachricht“ gilt wörtlich auch für die Empfangsbestätigung selbst, da sie eine Nachricht ist. Die Spezifikation sollte festhalten, dass eine Bestätigung nicht wieder bestätigt wird.
2. req-relay-013, Absatz 2: Die Bestätigung bedeutet „gespeichert“, die Antwort auf eine Anfrage bedeutet „verarbeitet“. Die Frist für eine Antwort kann daher viel länger sein. Die Länge der Fristen legt die Spezifikation je Nachrichtenart fest.
3. Das Kennzeichen „Empfangsbestätigung gewünscht“ gehört nicht zu den Eigenschaften in req-grund-004 („mindestens“). Wo es steht, entscheidet die Spezifikation.
