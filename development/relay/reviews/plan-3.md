# Prüfbericht Arbeitspaketplan relay, Durchlauf 3

- Ergebnis: **nicht bestanden**
- geprüfter Commit: `69b324edb7ff607d4798399771bf30eaf6105be3` (`main`, enthält `plan-3-order.md`)
- Gegenstand: `development/relay/plan.md`, geänderte Stellen gegenüber `5871ed93f1d26e96a50c3d53bfd0da58a8cd395d`
- Gelesen: Plan, Spezifikation (Stand 2026-10-25), `scope.md`, Abnahmebericht `wp01/acceptance/1.md`

## Geprüft ohne Befund

- Abdeckung (Frage 1): Jeder Teil der Spezifikation hat in „Abdeckung der Spezifikation“ ein Paket. Die Anforderungen aus `scope.md` sind durch Spezifikation und `wp01` bis `wp07` abgedeckt. Der Nachweis läuft über Verzeichnisse (`wp06`) und Matrix (`wp07`).
- M6 (Frage 3): Die Kriterien von `wp01` bis `wp05` nennen weder MetaTrader 5 noch `pipwerk-fetch-mt5`. `wp01` Kriterium 4 verlangt Prüfprogramme, die Voraussetzung nennt beides ausdrücklich nicht. Der Abruf steckt nur in `wp06` und `wp07`.
- M1 bis M4 sind in den Kriterien 1 und 2 von `wp01` prüfbar abgedeckt: aus einer Datei installiert, keine Datei von Hand, kein Befehl ohne Zweck, kein Schlüssel kopiert, Prüfcode verglichen.
- Reihenfolge und Abhängigkeiten (Frage 4): Übersicht, Abschnitte „Abhängigkeiten“ und Absatz unter der Übersicht stimmen überein. Die Reihenfolge `wp01`, dann `wp02`, `wp03`, `wp05`, `wp06` nebeneinander, dann `wp04`, dann `wp07` ist widerspruchsfrei.

## Blockierende Befunde

**B1 – Kein Kriterium zur Bedienbarkeit ohne Anleitung in `wp05`, `wp06`, `wp07`** (Entwicklungsverfahren, Phase 3, Absatz zum Inhalt eines Arbeitspakets; Frage 2)
- `wp01` Kriterium 3 sowie `wp02` Kriterium 1, `wp03` Kriterium 1 und `wp04` Kriterium 1 verlangen „ohne Anleitung nach den Fragen der Einrichtung“.
- `wp05` Kriterium 1: Der Auftraggeber schaltet die Web-API in `pipwerk-relay-setup` ein. Das ist Bedienung der Einrichtung, aber das Kriterium sagt nichts zu „ohne Anleitung“.
- `wp06` Kriterien 1 und 2: Installation und Aufruf von `pipwerk-fetch-mt5-serve` und `pipwerk-fetch-request` sind neue Bedienung. Das Paket hat kein Bedienbarkeitskriterium.
- `wp07` Kriterium 1: Der Auftraggeber stellt „nach der Anwenderdokumentation“ auf Matrix um. Das ist ausdrücklich mit Anleitung und kein Kriterium zur Bedienbarkeit.
- Frage: Welches Kriterium prüft in diesen drei Paketen, dass der Auftraggeber den Testfall ohne Anleitung ausführt, und woran hält er sich dabei (bestätigter Bedienablauf oder Spezifikation)?

**B2 – M5 und M7 sind in den Kriterien von `wp01` nicht prüfbar abgedeckt** (Frage 3)
- M5 (Abnahmebericht): Programme nach Funktion getrennt und benannt, kein Mehrzweck-Programm, Schlüssel, Datenbank, Warteschlange und Prüfkomponente nicht im Relay. Die Kriterien 1 bis 9 benutzen die getrennten Programme, verlangen aber an keiner Stelle, dass `pipwerk-relay` keine Unterbefehle hat und dass Schlüsselerzeugung, Datenbank und Prüffunktion nicht im Programm des Relays liegen. Spezifikation E1 und Abschnitt 10 legen das fest, das Abnahmekriterium fehlt.
- M7: Kriterium 8 deckt nur „Alle Ausgaben deutsch“ ab. Die zweite Hälfte von M7, Beispielnamen und Vorschläge nur aus Kleinbuchstaben und Ziffern (E9), steht in keinem Kriterium.
- Frage: Mit welchem Kriterium weist der Auftraggeber bei der Abnahme von `wp01` nach, dass M5 und die Bezeichner aus M7 behoben sind?

## Hinweise

- H1: Der Plan sagt nicht, dass `wp01` erst nach Bestätigung von 4.6 durch den Auftraggeber beginnt (Abnahmebericht: „bevor etwas umgesetzt wird“). Nur `wp02` bis `wp05` nennen die Bestätigung (Absatz unter der Übersicht). `wp06` hat keinen festgelegten Bedienablauf, `wp07` ebenfalls nicht.
- H2: `wp01` „Abhängigkeiten“: Der Plan begründet die Übernahme nach `backtest/wp02` mit dem Anlegen des Zweigs. Nach dem Herausnehmen des Abrufs ändert `wp01` `pipwerk-fetch-mt5` nicht mehr; ob die Reihenfolge noch nötig ist, bleibt offen.
- H3: Der Plan sagt nicht, wann der Entwickler die Abruf-Teile von `relay/wp01` vor der Übernahme von `wp01` sichert und in welchen Zweig sie für `wp06` kommen. Sie beruhen auf dem alten Aufbau (ein Programm, gemeinsamer Schlüssel je Verbindung).
- H4: „Umgesetzte Teile“ von `wp01` nennt E1 ohne Einschränkung, die Programme des Abrufs gehören aber zu `wp06`.
- H5: Die Spezifikation fordert, dass die Tests für den Aufruf von `pipwerk-fetch-mt5` an der Befehlszeile prüfen, dass er `relay-core` nicht lädt (6.1). Der Umfang von `wp06` nennt das nicht.
- H6: Der Schlüssel einer Komponente bei einem anderen Weg (E5) und „Weg einer Komponente umstellen“ (4.6 Schritt 5) sind in der Abdeckungstabelle keinem Paket ausdrücklich zugeordnet. Gemeint sind wohl `wp03` und `wp05`.
- H7: `wp01` Kriterium 7 prüft bei Störung 7 nicht, dass die späte Bestätigung nur im Protokoll steht (Spezifikation 8, Störung 7).
