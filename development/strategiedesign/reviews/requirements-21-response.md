# Bearbeitung der Befunde, Durchlauf 21

- Vorhaben: `strategiedesign`
- Prüfbericht: [requirements-21.md](requirements-21.md), nicht bestanden, blockierende Befunde B1 und B2, Hinweise H1 bis H4
- Rolle: Projektleiter
- Stand: 2026-10-27

Kein Befund braucht eine Entscheidung des Auftraggebers. Beide blockierenden Befunde folgen aus den Festlegungen vom 27. Oktober 2026 (`wp02/acceptance/3.md`, E1 und E9).

| Befund | Zuständig | Bearbeitung |
|---|---|---|
| B1 | Projektleiter, erledigt | `str-01` (Zeilen 86, 109) und `str-03` (Zeilen 38, 45): „Order- und Positionsverwaltung“ statt „Verwaltung“. Weitere Treffer gibt es in beiden Dokumenten nicht; die Überschrift „Aktiven Trade verwalten“ in `str-01` verwendet das Verb, nicht den Begriff. |
| B2 | Softwarearchitekt, erledigt | Glossar „Assistent“ als offener Punkt gekennzeichnet (Commit `864356d`). |
| H1 | Projektleiter, erledigt | Fachmodell Abschnitt zur Order: „an den `OrderManager` übergeben, der sie weiterführt und überwacht“; Anforderungen Strategiedesigner Abschnitt 1: „deren Führung und Überwachung“. Vermerk in beiden Änderungsnachweisen (Zeile vom 2026-10-27). |
| H2 | Projektleiter, erledigt | req-ui-016: „hat sich nicht bewährt“ ohne Bezug auf die Abnahme. |
| H3 | offen | Vorlagen für Rechnungen wie die Kreuzung bleiben offener Punkt in req-ui-015; Entscheidung mit `wp03`. Kein Eintrag im Fachmodell, solange nicht entschieden. |
| H4 | erledigt | mit B1 geprüft. |

Nachprüfung: `str-01`, `str-03`, die geänderten Sätze aus H1 und H2, Glossar „Assistent“.
