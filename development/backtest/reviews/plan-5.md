# Prüfbericht Plan, Durchlauf 5

- Vorhaben: `backtest`
- geprüfter Commit: `8ca391262012564dfdbf5b2fb99739453b00a6cf` (`main`)
- Gegenstand: geänderte Stellen des Plans (`wp02`, `wp03`, `wp04`, Abdeckung, „Offen“). M4 und `order-04` nicht geprüft (zurückgestellt).

## Ergebnis: bestanden

Der Plan deckt jede geänderte Stelle der Spezifikation ab, und die Abnahmekriterien sind vom Auftraggeber prüfbar. Der Plan folgt der Spezifikation; der blockierende Befund B1 aus [specification-4.md](specification-4.md) liegt in der Spezifikation, nicht im Plan.

## Blockierende Befunde

Keine.

## Abdeckung (geprüft)

- 5.1 (Reihe je Broker): `wp02`, Abdeckung Zeile 13. 5.2: `wp02` Umfang und Kriterium 9. 5.3: `wp02` Umfang, Kriterien 1 und 7. 5.5: `wp02`; Sperre bei Backtest und Chart gespeicherter Backtests in `wp03` (Umfang, umgesetzte Teile, Kriterium 7), Sperre bei Einzelschritt-Sitzung in `wp04` (Umfang, umgesetzte Teile). Kriterium 8 prüft Löschen und Broker.
- M1 und M2: Kriterien 6 und 10. Abschnitte 7, 8.3, 10, 11, 12 liegen in `wp02` und stehen in der Abdeckung.
- M4: unter „Offen“ und im Nicht-Umfang von `wp02` geführt, mit der Grenze je Datei bis dahin; widerspruchsfrei zu Spezifikation 5.3.

## Hinweise (nicht blockierend)

- H1 – `wp02` Kriterium 9 prüft Feiertage nur innerhalb einer Datei. Ändert sich die Spezifikation wegen B1, ist das Kriterium anzupassen.
- H2 – `wp02` Kriterium 8: „Ein gelöschter Zeitraum innerhalb einer Reihe erscheint als Lücke“ gilt nicht für einen Zeitraum, der ganz in ein Wochenende fällt (Spezifikation 5.2).
- H3 – `wp02` Kriterium 7 verlangt Dateien „zusammen größer als die Grenze je Datei“. Der Auftraggeber braucht dafür Dateien in dieser Größe; die Testumgebung sollte die Grenze nennen.
