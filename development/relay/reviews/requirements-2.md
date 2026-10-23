# Prüfbericht QA: Dokumente des Auftraggebers, Vorhaben relay, Durchlauf 2 (Nachprüfung)

- Ergebnis: **bestanden** (0 blockierende Befunde)
- Geprüfter Commit: `2736fa181ea1b072c2e80bbb7f58a9ed7f24ed49` (`main`)
- Geprüft: Erledigung von B1 bis B3 und H5 aus `requirements-1.md`, die dafür geänderten Stellen (`git diff bec2b0f..2736fa1`), Nachweis des Vorhabens laut `development/relay/scope.md`.

## Stand der früheren Befunde

- B1 erledigt: Der Nachweis läuft ohne Strategietester (`relay/scope.md`, Beschreibung und Nachweis; req-relay-007). Broker und Symbol stehen als offener Punkt in `development/backtest/scope.md` (als „Offen“ gekennzeichnet). req-relay-007 nennt Broker und Symbol als Inhalt der Anfrage. Kein Widerspruch zu req-system-027.
- B2 erledigt: Der Absender ist eine Adresse (req-grund-004, req-relay-005). Antworten und Meldungen nach req-relay-008 gehen an die Adresse des Absenders (req-relay-005).
- B3 erledigt: Die Adresse hat drei benannte Teile `<laufende Komponente>.<pipwerk-Netz>.<zuständiges Relay>` (req-relay-005). Das Beispiel passt dazu. Das Relay ist aus der Adresse bestimmbar (req-relay-006).
- H5 erledigt: Das Glossar hat Nachrichtensystem, Nachricht, Relay, Übertragungsweg, Adressbuch, Standard-Relay, Laufende Komponente, Adresse, pipwerk-Netz und Betreiber. „Instanz“ ist im Nachrichtensystem durch „laufende Komponente“ ersetzt, das Glossar grenzt sie von der Instanz im Strategiedesigner ab. „Beschaffung“ nennt pipwerk relay. In Nachrichtensystem und Handelssystem kommt „Instanz“ nur noch in Änderungsnachweisen vor.

## Blockierende Befunde

Keine.

## Hinweise (nicht blockierend)

- N1 (Lücke, `relay/scope.md` Nachweis, req-relay-007 Schritt 1): Der Nachweis lässt sich bis auf den Absender abbilden. Welche laufende Komponente die Anfrage schickt und die Dateien an ihrer Adresse empfängt, ist nicht benannt. Die Anfrage braucht einen Absender mit Adresse (req-grund-004), und der Strategietester entfällt. Für die Umsetzung kann ein Prüfprogramm diese Rolle übernehmen. Sache der Spezifikation.
- N2 (Spezifikation, req-relay-005): Wer den Namen der laufenden Komponente vergibt, steht nicht da. Das Beispiel `pipwerk-trader` entspricht weiter dem Namen einer Komponente. Ob Namen den Punkt enthalten dürfen (er trennt die Teile), ist nicht gesagt.
- N3 (Spezifikation, req-relay-007 letzter Absatz): „Bis dahin gilt die Übergangslösung“ nennt den Zeitpunkt nicht. Gemeint ist wohl der Anschluss durch `backtest`. Verwandt mit H10 aus Durchlauf 1.

## Widerspruchsfreiheit der geänderten Stellen

- req-relay-005, req-relay-007, req-grund-004, Übermittlung der Order, Glossar, `relay/scope.md` und `backtest/scope.md`: kein Widerspruch untereinander. Die geltenden Dokumente in `relay/scope.md` passen zu den verbleibenden Verweisen (req-system-026, req-system-027).
