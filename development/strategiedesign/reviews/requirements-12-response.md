# Bearbeitung der Hinweise, Durchlauf 12

- Vorhaben: `strategiedesign`
- Prüfbericht: [requirements-12.md](requirements-12.md), bestanden, Hinweise N1 bis N6
- Rolle: Softwarearchitekt
- Stand: 2026-10-19

Die Nachprüfung zu Beginn von Phase 2 ist bestanden. Kein Hinweis braucht eine Entscheidung des Auftraggebers. Hinweise verhindern das Bestehen nicht und werden bei der nächsten passenden Gelegenheit erledigt (`docs/technical/entwicklungsverfahren.md`, Umfang der Prüfungen).

| Hinweis | Bearbeitung |
|---|---|
| N1 | Projektleiter, nächste passende Gelegenheit: req-fach-051 nennt das Instrument von `Tick` und `Instrument` ohne Instanz nur für den Fall des Auslösers `Tick`. Für die Testfälle und den Prototyp ohne Wirkung. |
| N2 | Zuordnung vom Softwarearchitekten entschieden: Die Bearbeitung von 11 N2 folgt aus einer Festlegung. req-fach-053 legt in der Tabelle fest, dass der Auslöser `Kerzenschluss` „die abgeschlossene `Kerze` dieser Zeiteinheit“ liefert, und gibt ihm den Parameter `Instrument`. Die gelieferte Kerze ist damit die Kerze des Instruments dieses Auslösers. req-fach-051 sagt das nun ausdrücklich, wie zuvor schon für die Zeiteinheit. Keine Vorlage beim Auftraggeber. |
| N3 | Projektleiter, nächste passende Gelegenheit: Wortlaut „auf jedem Instrument“ in req-fach-046 als Gesamtzahl über alle Instrumente der Anwendung eindeutig fassen (Bearbeitung 11 N1). |
| N4 | Projektleiter, nächste passende Gelegenheit: Instrument der `CloseOrder` ist das Instrument ihrer Position (req-fach-032, req-fach-052); Bezug von „er“ in req-fach-053. |
| N5 | Spezifikation: Welche Eingänge einen Wert brauchen und welcher Befund gemeldet wird, legt die Spezifikation fest. Die Stelle für die Ablaufverbindung fällt unter „Element des Ablaufs ohne Verbindung“, nicht unter „Eingang ohne Wert“. |
| N6 | Glossar „Auslöser“: Satzfolge berichtigt. |
