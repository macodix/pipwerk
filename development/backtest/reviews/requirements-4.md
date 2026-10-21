# Prüfbericht Dokumente des Auftraggebers, Vorhaben backtest, Durchlauf 4 (Nachprüfung)

- Rolle: QA
- Phase: 1 Anforderung, Nachprüfung vor der Präsentation
- geprüfter Stand: `main`, Commit `42b60dbdf678d37fdccaecc5341a81fe9dc9902d`
- Vorheriger Durchlauf: `requirements-3.md` (Commit `4356fa63ccbe5d7b90364871f3d2a6eaf7688526`, nicht bestanden: M1, M2)
- Ergebnis: **bestanden**
- neue blockierende Befunde: 0, Hinweise: 5 (H6 bis H10)

## Stand der Befunde aus Durchlauf 3

| Befund | Stand | Beleg |
|---|---|---|
| M1 | erledigt | Anforderungen Strategietester req-test-008: Liefert ein Indikator zu Beginn noch keine Werte, läuft der Testlauf weiter, Bedingungen mit diesen Werten gelten als nicht erfüllt. `str-01` Abschnitt 1: „kein Trend“, auch solange der `ZigZag` noch keine zwei endgültigen Hochs und Tiefs geliefert hat. Beide Aussagen passen zusammen, in beiden Betriebsarten (req-test-008 nennt keine Einschränkung). Die Fragen aus M1 sind beantwortet; Kursdaten vor dem Testzeitraum sind nicht nötig. |
| M2 | erledigt | req-test-004 (Absatz „Die interne Abwicklung verhält sich wie ein Broker“): Eine Order, die ein Broker ablehnen würde, wird abgelehnt, „Order aufgeben“ nimmt den Ausgang „nicht gestellt“, der Grund ist sichtbar. `str-01` Abschnitt 1: Hat der Kurs den Einstieg überschritten, ist die Stop-Order abgelehnt, es entsteht kein Trade. Der Ausgang „nicht gestellt“ existiert (Fachmodell req-fach-049, Zeile 362); der Hauptablauf plant beim nächsten Auslöser neu (`str-01` Abschnitt 6). Dieselbe Strategie führt über denselben Zeitraum zu denselben Trades. |
| H4 (Fachmodell) | erledigt | `fachmodell.md` Punkt-Schreibweise: Beispiele jetzt `letztes_hoch`, `wartende_orders`; Anzeigenamen `letztes Hoch`, `wartende Orders`. `wartende Orders` ist Eigenschaft der Strategie (req-fach-046); das letzte Hoch liefert der `ZigZag` (req-fach-054). Kein `punkt_13` und kein `Punkt 1/3` mehr im Fachmodell. |

## Neue blockierende Befunde

Keine.

## Hinweise

- H6 (folgt aus Festlegung 2026-10-21, req-test-008): `glossar.md` Eintrag „leer“ sagt: „Rechnen und Vergleichen mit ‚leer‘ ist ein Fehler der Auswertung“, und nennt als Beispiel das vorletzte Hoch des `ZigZag`. req-test-008 und `str-01` Abschnitt 1 behandeln genau diesen Fall im Testlauf anders (Bedingung nicht erfüllt, kein Abbruch). Das Glossar sagt nicht, dass dafür req-test-008 vorgeht. Der Wortlaut des Glossars ist nicht Teil der Festlegung.
- H7 (Spezifikation): `str-01` Abschnitt 1 sagt „lehnt der Broker ab“ und „den Einstieg überschritten“. Im Strategietester gibt es keinen Broker (req-test-004), und „Einstieg“ ist weder der Einstiegsbezug noch der Preis der Stop-Order (Einstiegsbezug + Spread + Puffer). Zwischen beiden Preisen wird die Order nicht abgelehnt; maßgeblich sind die Regeln der Ablehnung, die req-test-004 der Spezifikation überlässt.
- H8 (Spezifikation): Fachmodell req-fach-049 (Zeile 362) nennt als Gründe für „nicht gestellt“ nur nicht bestimmbare Eigenschaften und nicht erfüllte Regeln, nicht die Ablehnung durch die Abwicklung. req-test-004 nennt nur „Order aufgeben“; ob dasselbe für „Order ändern“ (Ausgang „nicht geändert“) und „Position ändern“ gilt, steht nicht da.
- H9 (Spezifikation): „Der Grund der Ablehnung ist sichtbar … im Backtest im Ergebnis“ (req-test-004): req-test-022 (gespeichertes Ergebnis) nennt abgelehnte Orders und ihre Gründe nicht. Darstellung ist Sache der Spezifikation.
- H10 (Spezifikation): req-test-008 nennt nur „Bedingungen“. Werte leerer Indikatoren in Berechnungen oder Eigenschaften einer Order sind nicht erwähnt (für Orders deckt Fachmodell Zeile 362 es ab: „nicht gestellt“, wenn eine Eigenschaft nicht bestimmt werden kann). req-test-008 steht vor req-test-005; kein Fehler.

## Zuordnung

| Befund | blockierend | Zuordnung |
|---|---|---|
| H6 | nein | folgt aus Festlegung (req-test-008) |
| H7, H8, H9, H10 | nein | Sache der Spezifikation |

## Nachweis des Vorhabens

Mit den geänderten Stellen ist `str-01` in beiden Betriebsarten ausführbar, wie beschrieben: Anfang des Testlaufs (kein Trend), Stop-Order auf der falschen Seite des Kurses (nicht gestellt, kein Trade). Widersprüche zu nicht geänderten Stellen derselben Dokumente wurden bis auf H6 nicht gefunden. Verweise auf `Markttechnik` stehen nur beim zurückgestellten Indikator und im Änderungsverlauf.
