# Prüfbericht Spezifikation, Durchlauf 5 (req-relay-013)

- Vorhaben: `relay`, Rolle QA
- Ergebnis: **bestanden**
- geprüfter Commit: `ce20832e30435a5c0f279bdb114ba51a0a4778f3`
- Umfang: nur die geänderten Stellen von `development/relay/specification.md` (Diff gegen `aad3ec705857c4e5d7d03ba7a4c21d214471aa5d`), vor allem 3.7.

## Antworten auf die drei Fragen

1. **Vollständige Umsetzung von req-relay-013: ja.**
   - Wahl je Nachricht durch den Absender: Feld `receipt` (3.2), vom Absender je Nachricht gesetzt (3.7 „Absender“).
   - Automatische Bestätigung durch die empfangende laufende Komponente nach dem Speichern: 3.7 „Empfänger“, Anschluss ohne Zutun der Komponente.
   - Nachrichten-ID der bestätigten Nachricht: Bezug-Nachrichten-ID von `relay.receipt` (3.7).
   - Meldung an den Anwender nach Fristablauf: 3.7 „Warten“, die Komponente zeigt sie an.
   - Antwort als Bestätigung einer Anfrage: 3.7 „Anfrage“, 6.3.
   - Keine Prüfung des Abholens durch das Relay: 3.7 Absatz 1. Das Relay behandelt `relay.receipt` wie jede Nachricht.
2. **Kein Widerspruch** zu req-relay-001 bis req-relay-013, req-grund-003 bis req-grund-006, req-system-005, req-system-026 und req-system-027.
   - `relay.receipt` folgt dem Nachrichtenformat nach req-grund-004. Das neue Feld ist wahlweise, ohne Angabe „nein“.
   - Bezug-Nachrichten-ID nach req-grund-006.
3. **Nachweis weiter führbar.** Der Abruf setzt `receipt` nie (3.7 „Anfrage“). Die Durchgänge in Abschnitt 8 laufen darum unverändert. Der Test zu 3.7 kommt in Abschnitt 8 hinzu.

## Blockierende Befunde

Keine.

## Hinweise

- H1 (3.7 „Empfänger“, Wiederholung): „schickt die Bestätigung erneut“. Die Bestätigung soll erst nach dem Speichern gehen (req-relay-013). Kommt die Wiederholung, bevor die Komponente „gespeichert“ gemeldet hat, wäre die Bestätigung zu früh. Gilt die erneute Bestätigung nur, wenn die Komponente das Speichern schon gemeldet hat?
- H2 (3.7 „Empfänger“): Der Anschluss quittiert erst nach dem Senden der Bestätigung. Meldet die Komponente das Speichern nie, bleibt die Nachricht unquittiert. Wie lange, und was geschieht dann?
- H3 (3.7 „Warten“): Wer darf eine Wartende erledigen? Genannt ist nur „`relay.receipt` mit ihrer ID als Bezug“. Ob Absender dieser Bestätigung der Adressat der Nachricht sein muss, steht nicht da. Eine Bestätigung von einer fremden Adresse würde sonst das Warten beenden.
- H4 (3.7 „Ausnahmen“): `relay.receipt` mit `receipt` ja wird verworfen. Für `relay.undeliverable` mit `receipt` ja steht nur „verlangt nie“. Wird sie angenommen und das Kennzeichen ignoriert, oder verworfen?
- H5 (3.7 „Anfrage“): Das Verbot von `receipt` im Abruf steht nur dort. Abschnitt 6 selbst nennt es nicht. Zur Klarheit dort einen Verweis aufnehmen.
