# Prüfbericht Arbeitspaketplan relay, Durchlauf 4 (Nachprüfung)

- Ergebnis: **bestanden**
- geprüfter Commit: `021cb226a66e2542d5c12e8da9ad29507093b6b5` (`main`, enthält `plan-4-order.md`)
- Gegenstand: `development/relay/plan.md`, geänderte Stellen gegenüber `69b324edb7ff607d4798399771bf30eaf6105be3`
- Gelesen: Diff des Plans, `wp01` und `wp06` ganz, Spezifikation E1, E9, 4.7, 6.1, 9, 10, Prüfbericht `plan-3.md`

## Vorherige Befunde

- B1 behoben. `wp05` Kriterium 1, `wp06` Kriterien 1 und 2 und `wp07` Kriterium 1 verlangen jetzt „ohne Anleitung“ nach den Fragen der Einrichtung und dem bestätigten Bedienablauf (4.6 beziehungsweise 4.7). `wp07` nutzt `pipwerk-relay-setup` statt der Anwenderdokumentation.
- B2 behoben. `wp01` Kriterium 8 deckt die Namen aus Kleinbuchstaben und Ziffern ab (E9). Das neue Kriterium 9 deckt M5 ab: Programme nach Aufgabe benannt, `pipwerk-relay` ohne Unterbefehle, Einrichtung, Schlüsselerzeugung, Status und Prüfprogramme als eigene Programme.
- Ergänzung 4.7: `wp06` nimmt `pipwerk-fetch-mt5-setup` in Umfang, umgesetzte Teile (E1, 4.7), Kriterium 1 und Abdeckungstabelle (Zeile 4.7) auf. Beginn erst nach Bestätigung von 4.7. Widerspruchsfrei zur Spezifikation (E1, 6.1, Abschnitt 9).
- Die Änderungen zu H1 bis H7 aus `plan-3.md` sind eingearbeitet und enthalten keinen neuen Fehler. H2 bleibt mit Begründung unverändert.

## Blockierende Befunde

Keine.

## Hinweise

- H1: `wp06` Umfang (Dokumentation) und Kriterium 5 nennen `pipwerk-fetch-mt5-setup` nicht, Spezifikation Abschnitt 9 verlangt es in `docs/technical/pipwerk-fetch-mt5.md` und die Einrichtung des Abrufs in der Anwenderdokumentation.
- H2: `wp01` Kriterium 9 nennt Datenbank, Warteschlange und Prüffunktion nicht ausdrücklich als „nicht im Programm des Relays“; Schlüsselerzeugung und Prüfprogramme sind genannt.
- H3: `wp06` Kriterium 1 prüft die Frage und Kontrollanzeige der Zeitzone (4.7) nicht ausdrücklich; sie fällt unter „ohne Anleitung nach den Fragen der Einrichtung“.
