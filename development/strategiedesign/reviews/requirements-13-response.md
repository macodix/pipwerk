# Bearbeitung der Befunde, Durchlauf 13

- Vorhaben: `strategiedesign`
- Prüfbericht: [requirements-13.md](requirements-13.md), nicht bestanden, blockierende Befunde B1 und B2, Hinweise H1 bis H10
- Rolle: Softwarearchitekt
- Stand: 2026-10-22

Kein Befund braucht eine Entscheidung des Auftraggebers. Beide blockierenden Befunde folgen aus den Festlegungen vom 22. Oktober 2026 (`docs/technical/entwicklungsverfahren.md`, Fragen an den Auftraggeber).

| Befund | Zuständig | Bearbeitung |
|---|---|---|
| B1 | Projektleiter | req-ablauf-007, Zeile „Element des Ablaufs ohne Verbindung“, an req-fach-055, req-ablauf-003 und req-ui-017 angleichen: Eine Instanz ohne Verbindung zum Element ihrer ersten Verwendung ist nicht verwendbar; der Satz, der Objekte auf der Zeichenfläche von der Prüfung ausnimmt, widerspricht dem. H6 (doppelter Name in der Liste von req-ablauf-007) im selben Zug. |
| B2 | Softwarearchitekt, erledigt | Glossar `docs/technical/glossar.md`: „Namensraum“, „Datenverbindung“, „Ausgang“, „Ergebnis“, „Typbeschreibung“ angeglichen, „Methode“ und „Aktualisieren“ neu. Vermerk im Änderungsnachweis des Glossars. |
| H1, H2, H10 | offen | Offene Punkte in req-fach-055. Keine Bearbeitung jetzt. |
| H3, H4, H8, H9 | Spezifikation | Erste Verwendung bei Name nur im Ausdruck, Reichweite des Namensraums, Lage der Ein- und Ausgänge bei waagerechter Ausrichtung, geführter Aufbau. Entscheidung in der Spezifikation. |
| H5 | offen | Lücke ohne technischen Grund zum Schließen, kein Testfall betroffen. Der Projektleiter kennzeichnet sie bei Bedarf als offenen Punkt. |
| H6 | Projektleiter | mit B1. |
| H7 | Projektleiter, nächste passende Gelegenheit | Anzahl der Instanzen in `str-01` und `str-03` an req-fach-055 angleichen, nur bei Bedarf. |

Nachprüfung nach der Korrektur durch den Projektleiter: geändertes req-ablauf-007 und das geänderte Glossar.
