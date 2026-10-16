# Bearbeitung des Prüfberichts, Durchlauf 6 (Nachprüfung)

- Vorhaben: `strategiedesign`
- Prüfbericht: [requirements-6.md](requirements-6.md)
- Rolle: Projektleiter
- Stand: 2026-10-16

Die Zahl der blockierenden Befunde war gestiegen, die Schleife ging an den Auftraggeber. Seine Entscheidung im Chat am 2026-10-16: Die Beschreibung der Regelvorlage „Risiko je Trade“ in req-core-002 wird auf die fachliche Festlegung zurückgeführt. Wie der Ausdruck Orders, Positionen und Ordertypen abbildet, ist Sache der Spezifikation. Die Detaillierung der Durchläufe 3 bis 5 stammte vom Projektleiter.

| Befund | Bearbeitung |
|---|---|
| N9, N10 | req-core-002 neu gefasst: Parameter Risikogrenze; Verlust vom Preis bis zum Stop-Loss höchstens die Risikogrenze; bestimmt das Volumen, solange es änderbar ist, prüft danach; nicht für Schließorders; Abbildung im Ausdruck in der Spezifikation. req-fach-051: Order und Position in einer Regel sind die Order beziehungsweise Position, auf die die Regel angewendet wird, ohne Fehlermeldung der Konsistenzprüfung für Regeln. |
| H19 | Nicht bearbeitet. Für die Testfälle ohne Bedeutung, keine Festlegung ohne Notwendigkeit. |
| H20 | req-fach-049a: „Order ändern“ ändert bei der Stop-Limit-Order auch den Limitpreis. |
| H21 | Durch die Vereinfachung in req-fach-051 sagen Fachmodell, req-ablauf-003 und Glossar dasselbe. |
| H22 | req-fach-019: Kurs in Handelsrichtung der Order, bei der CloseOrder die Gegenrichtung der Position. |
