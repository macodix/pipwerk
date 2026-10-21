# Prüfbericht Spezifikation backtest, Durchlauf 1

- Ergebnis: **nicht bestanden** (4 blockierende Befunde)
- geprüft: `development/backtest/specification.md` auf `main`, Commit `67c0339d26f4137e8f540b7cf41111dd8fb8e33c`
- Grundlage: Auftrag `reviews/specification-1-order.md`; Anforderungen Gesamtsystem und Strategietester, Fachmodell, `str-01`, `str-03`, `backtest-01`, Prototyp und README

## Gesamteindruck

Die Spezifikation deckt die Anforderungen weitgehend ab. Das gilt für Testlauf, Testzeitraum, Kursdaten, Abwicklung, Testkonto, Strategieparameter, Auslöser `Manuell`, Speichern und Vergleich, Datenbestand, Web-API, Sicherheit und Dokumentation. Die Antworten aus `backtest-01` sind in 3.4, 3.6, 6.1, 6.3, 8 und 13 eingearbeitet. Abschnitt 8 gibt die Punkte 1 bis 7 und den Prototyp richtig wieder, bis auf B3. `str-01` und `str-03` lassen sich nach Abschnitt 9 abbilden, mit den Vorbehalten B1 und B2.

Zur Datei des Prototyps: Sie enthält nur eingebettete Skripte und Stile, keine Verweise nach außen, und die Texte „Start von Hand“ und `flow.set_parameter` kommen nicht mehr vor. Das Öffnen über `file://` habe ich nicht im Browser geprüft, weil auf dem Rechner kein Browser installiert ist. Die Prüfung war nur statisch.

## Blockierende Befunde

**B1 – `Strategie.wartende Orders` und `offene Positionen` auf einem Instrument (3.4, req-fach-046).**
- Sachverhalt: 3.4 zählt „auf dem Instrument des Zusammenhangs (req-fach-046)“. req-fach-046 sagt „auf jedem Instrument“.
- Zuordnung: folgt aus einer Festlegung (req-fach-046). Die Einschränkung hat keine Festlegung und keinen technischen Grund.
- Kritik: Die Spezifikation widerspricht dem Fachmodell. Eine Strategie mit mehreren Instrumenten zählt so falsch.

**B2 – Wann wirkt eine Marktorder oder „Position schließen“ auf die folgenden Elemente? (4.2, 3.4, 9 `str-03`, req-fach-049a)**
- Sachverhalt: Marktorder und Schließen werden „zum nächsten Kurs nach dem Ereignis“ ausgeführt. Die Spezifikation sagt nicht, ob Position, Konto, freie Margin, `Order.Status` und `Strategie.offene Positionen` im Hauptablauf desselben Ereignisses schon den Stand nach dem Schließen zeigen.
- Zuordnung: Sache der Spezifikation.
- Frage: Ist die alte Position beim Start des Hauptablaufs geschlossen, wie req-fach-049a es verlangt („schließen, bevor der Hauptablauf eine neue eröffnet“)? Ohne Antwort ist `str-03` beim Wechsel der Richtung nicht eindeutig prüfbar: Es ist offen, ob `no_money` auftritt und welches Kapital die Risikoregel verwendet.

**B3 – „Zum Testbeginn“ fehlt in 6.3 und 7 und widerspricht E8.**
- Sachverhalt: 8.3 und 8.4 Punkt 3 (bestätigter Prototyp) nennen den Befehl „Zum Testbeginn“. Die Befehlsliste in 6.3 und die Web-API in 7 kennen ihn nicht. E8 schließt ein Zurückgehen aus.
- Zuordnung: Sache der Spezifikation.
- Kritik: Ein bestätigter Bedienpunkt ist im Backend nicht festgelegt. Wie setzt die Sitzung auf den Testbeginn zurück, und was bleibt von Haltepunkten und Befehl `Manuell`?

**B4 – Standard-Testkonto „nicht löschbar“ (6.2, 8.3, req-test-005).**
- Sachverhalt: req-test-005 sagt, der Anwender kann Testkonten löschen. Die Spezifikation schränkt das ohne Begründung ein. Im bestätigten Prototyp ließ sich das Standard-Testkonto löschen (README: es ist beim nächsten Start wieder da).
- Zuordnung: Sache der Spezifikation. Das ist die Regel „Keine Einschränkung ohne Erfordernis“.
- Kritik: Eine Festlegung des Auftraggebers oder eine technische Begründung fehlt. Ohne beides ist die Einschränkung zu streichen.

## Hinweise

1. 6.4, 6.3, 3.4: Begrenzungen ohne Begründung. Das sind 10 000 abgelehnte Orders (req-test-004 verlangt den Grund im Ergebnis), 5 000 Punkte der Kontokurve und 60 Minuten Sitzung. Die Begründung gehört in die Spezifikation.
2. 6.3: „Manuell auslösen“ nur zwischen zwei Auswertungen. req-test-015 sagt „an der aktuellen Stelle“. Der Grund „Zustand nicht abgeschlossen“ ist nicht zwingend, weil der Zustand an jedem Element vorliegt.
3. 4.2: „Konto aufgebraucht“ beendet den Testlauf. req-test-020 verlangt den Lauf über den Testzeitraum. Das lässt sich mit req-test-004 („wie ein Broker“) begründen, die Begründung fehlt.
4. 5.1, 5.3: Die Zeitbasis ist unklar. MetaTrader 5 und sein CSV-Export liefern Serverzeit. Die Spezifikation speichert UTC. Die Umrechnung beim Import und bei der Beschaffung ist nicht genannt. Sie wirkt auf Tageswechsel, Swap, Gültigkeit und die Wochenendgrenze in 5.2.
5. 8.4 Punkt 2: „Jedes Ereignis ergibt eine Auswertung.“ 3.4 startet je Ereignis mehrere Auswertungen (jede Verwaltung und den Hauptablauf).
6. 6.4 und 8.4 Punkt 7: Die Spalte „Kosten“ nennt einmal Kommission und Swap, einmal Kommission und Spreadanteil. Unklar ist, ob der Gewinn eines Trades den Swap enthält.
7. 3.5: Die prüfenden Regeln bei „Order ändern“ und „Position ändern“ (req-fach-049a) sind nicht beschrieben. `str-01` braucht sie, weil es die Order bei `nicht geändert` löscht.
8. 6.1: Ein per Ausdruck gebildetes Instrument führt zur Ablehnung `market_closed`. Der Grund führt in die Irre, und die Einschränkung ist nicht begründet.
9. 6.1: „Letzter vollständiger Handelstag“ ist als Vortag (UTC) gefasst. Ein Samstag oder Sonntag ist kein Handelstag (req-test-002).
10. 6.5, 8.2: req-test-022 sagt „im Strategiedesigner ansehen“. Die Spezifikation zeigt die getestete Fassung in pipwerk replay (vom Prototyp bestätigt). Wortlaut mit dem Auftraggeber abgleichen oder festhalten.
11. 5.4, 11: Der gemeinsame Schlüssel liegt in der Betriebskonfiguration, also in der Datenbank. Die Übertragung ist nicht gesichert. Dass die Startkonfiguration von `pipwerk-fetch-mt5` req-system-017 und -018 folgt (`-c`, Windows-Pfade), steht nicht dort.
12. 5.1: Die Kontraktgröße aus req-system-025 steht nicht in der Liste der Angaben zum Instrument. Es gibt nur den Verweis „nach req-system-025“.
13. 3.3: „Alle älteren Wendepunkte sind endgültig.“ Der ZigZag von MetaTrader 5 verschiebt innerhalb von Backstep mehr als den jüngsten Punkt. Der Auftrag und der Test gegen MetaTrader-Werte (10) klären das.
