# Prüfbericht Spezifikation und Plan, Durchlauf 6

- Vorhaben: `backtest`
- Rolle: QA
- Ergebnis: **bestanden**
- geprüfter Stand: `main`, Commit `26df50322617fac7fcfc4b7acca0f039ed4a68b9`
- Gegenstand: Änderungen gegenüber `d1ec3cc10f06408e45365bef90f4782695bf4655` in `specification.md`, `plan.md`, `prototype/order-04.md`, `docs/technical/glossar.md`
- Grundlage: req-system-025 bis req-system-028, `scope.md`, Prüfauftrag `specification-6-order.md`

## Blockierende Befunde

Keine.

## Prüfung nach Fragen

1. **Spezifikation 5.6** setzt req-system-028 Absatz für Absatz um:
   - Keine Kopien und nur ein Platz für die Daten: Punkt „Eine Ablageform“.
   - Entfernen nach Abbruch, Fehler und Absturz: Punkte „Import“ und `pipwerk-fetch-mt5`. Der Import-Vorgang bleibt im Arbeitsspeicher (5.5), die temporäre Datei ist namenlos.
   - Behalten als Wahl des Anwenders mit Ablageverzeichnis und Pflege durch den Anwender: Punkt „Dateien behalten“ mit Kästchen, nicht angekreuzt vorbelegt.
   - Format wählen und begründen: Punkt „Formate“.
   - Widerspruchsfrei zu 5.3 (Verweis auf Version 2), 5.5 (Vorgang nur im Arbeitsspeicher), 8.3 (Kästchen im Dialog), 10 (Tests), 11 (Dateiname ohne Verzeichnisteile, nicht `.` oder `..`) und 12 (Anwenderdokumentation).
   - Zu req-system-025 bis req-system-027: Der Abruf über pipwerk relay bleibt ausdrücklich dem späteren Vorhaben überlassen, mit „Entfernen“ als Vorgabe. Die Zwischendatei von `pipwerk-fetch-mt5` passt zu 5.4.
   - **Bewertung des JSON-Formats:** nachvollziehbar. Ich habe den ersten Tick aus `examples/ticks.json` (Zweig `backtest/wp02`) kompakt gezählt: 63 Byte. Das stimmt. Die Verhältnisse 63/44 = 1,43 und 63/37 = 1,70 stimmen mit „1,4- bis 1,7-Fache“ überein. Die CSV-Zeilen von MetaTrader 5 (37 und 44 Byte) habe ich mangels Beispieldatei nicht nachgezählt.
2. **Plan 5.6**: Umfang von `wp02` (Speicherplatz, Tests), Nicht-Umfang (Version 2), umgesetzte Teile („5.6 ohne den letzten Punkt“), Abdeckungstabelle und „Offen“ sind stimmig zur Spezifikation. Kriterien 11 und 12 kann der Auftraggeber selbst prüfen: Strg+C bei `pipwerk-fetch-mt5` und Blick ins Zielverzeichnis; Kästchen und Ablageverzeichnis im Dialog und ein Blick ins Verzeichnis. Die technischen Nachweise nennen den Punkt Speicherplatz.
3. **`prototype/order-04.md`**: kein Widerspruch zu 5.6 oder req-system-028. 4a misst die Kandidaten für Version 2 (JSON-Liste, CSV) wie in 5.6 und lässt Version 1 weg, wie dort begründet. Punkt 5 (Teilstücke entfernen) entspricht 5.6. Der Abschnitt „Speicherplatz“ rechnet 5,8 GB + Version 2 + Datenbank höchstens so groß wie die Datei, also etwa 17,4 GB, und bleibt unter der Grenze von 20 GB.
4. **Glossar**: „Import“, „Ablageverzeichnis“ und „Ablageform“ passen zu req-system-028.

## Hinweise

- H1: Die Zählung in 5.6 ist uneinheitlich. „63 Byte“ je Tick im JSON-Objekt enthält das Trennzeichen zwischen den Ticks nicht, die „26 Byte Schlüsselnamen, Anführungszeichen, Klammern und Trennzeichen“ schon (63 − 38 Nutzbyte = 25). Die „32 Byte“ der Listenform enthalten das Komma. Mit Komma sind es 64 Byte, das Ergebnis „1,4- bis 1,7-Fache“ bleibt. Die Zählweise sollte einheitlich genannt werden.
- H2: Zu req-system-028 Absatz „Format wählen“: `wp02` liefert weiter Version 1 (JSON), die Wahl von Version 2 folgt erst im Paket für große Dateien. Das steht in 5.6 und im Plan offen und folgt der zurückgestellten Probeumsetzung. Der Auftraggeber sollte es bei der Abnahme als bewusst offen wissen.
- H3: Die zwei Zusagen „Platz nach Löschen und Ersetzen zurückgeben“ und „keine Reste bei Abbruch, Fehler, Absturz“ stehen nur in den Tests (Abschnitt 10), in keinem Abnahmekriterium. Kriterium 12 deckt nur die Dateien im Ablageverzeichnis ab. Der Auftraggeber kann sie also nicht selbst prüfen, etwa an der Größe der Datenbankdatei vor und nach dem Löschen. Falls das gewollt ist, genügt der Nachweis durch die Tester.
- H4: „Eine Datei gleichen Namens wird ersetzt“ (5.6) ersetzt behaltene Dateien ohne Rückfrage. Die Anwenderdokumentation sollte das mit der Pflege durch den Anwender nennen.
