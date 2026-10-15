# Bearbeitung des Prüfberichts, Durchlauf 2 (Nachprüfung)

- Vorhaben: `strategiedesign`
- Prüfbericht: [requirements-2.md](requirements-2.md)
- Rolle: Projektleiter
- Stand: 2026-10-15

Grundsatz des Auftraggebers für alle Dokumente, im Chat am 2026-10-15: keine Einschränkung ohne klare Notwendigkeit. Danach wurden die Befunde bearbeitet.

## Entscheidungen des Auftraggebers

Im Chat am 2026-10-15 entschieden, ohne Präsentation, und in die Dokumente eingearbeitet.

| Befund | Entscheidung | Fundstelle |
|---|---|---|
| A6, N2 | In `str-01` gibt es kein Ausweichen auf eine kleinere Handelszeiteinheit im Ablauf. Die Strategie hat zwei Zeiteinheiten als Strategieparameter, der Auslöser und die Verwaltung der Order arbeiten auf der Handelszeiteinheit. Die Paarungstabelle ist eine Empfehlung für die Werte, kein Teil des Ablaufs. Endet ein gültiges Setup nicht in einer Order, KANN bei der Anwendung festgelegt werden, dass die Strategie mit dem nächstkleineren Zeiteinheitenpaar erneut gestartet wird; das ist ein Neustart mit anderen Parametern und nicht Teil des Testfalls. `Parameter setzen` und die Rückführung werden in den Testfällen nicht gebraucht; die Geltungsdauer eines gesetzten Werts ist im Fachmodell als offen gekennzeichnet. | `str-01` Voraussetzungen, Abschnitte 1, 2, 4, 6, Parameter; Fachmodell req-fach-046 (Belegung der Parameter von Elementen), req-fach-047 (offen) |
| B2 | Objektspeicher (Strategien, Vorlagen) und übrige Daten werden getrennt. Wo der Objektspeicher liegt, ist eine Einstellung: Verzeichnis oder Datenbank über SQLAlchemy. Erste Ausbaustufe: Verzeichnis. Alle übrigen Daten über SQLAlchemy. | Gesamtsystem req-system-012, req-system-015; Anforderungen Strategiedesigner req-ui-009 |
| N1 | Objekte der Anwendung sind Objekte wie alle anderen: Sie können Parameter haben (die Kerze die Zeiteinheit), und eine Strategie kann beliebig viele Instanzen davon verwenden, jede mit eigenem Namen. Der einzige Unterschied: Ihre Werte liefert die Anwendung, ihr Objekttyp wird nicht vom Anwender gestaltet. „Genau einmal vorhanden“ und „keine Parameter“ sind zurückgenommen; beides stammte aus dem Vorschlag des Projektleiters zu Frage 1 des Durchlaufs 1, nicht vom Auftraggeber. Verwendet eine Strategie ein Objekt der Anwendung nur einmal, spricht ein Ausdruck es unter dem Namen des Objekttyps an, die Kerze hat dann die Zeiteinheit des eingetretenen Auslösers. | Fachmodell req-fach-051; Anforderungen Strategiedesigner req-ablauf-003; Glossar „Objekte der Anwendung“ |
| N3 | Eine Regel kann bestimmen und prüfen: Sie bestimmt eine Eigenschaft, solange diese änderbar ist, und prüft sie sonst. Das Volumen kann als Berechnung im Ablauf ermittelt oder von einer Regel bestimmt werden, beides zulässig. In beiden Testfällen bestimmt die Regelvorlage „Risiko je Trade“ das Volumen, abgerundet auf den Volumenschritt, und prüft beim Ändern einer Order. Die Regelvorlage ist beschrieben. | Fachmodell req-fach-020; Anforderungen Strategiedesigner req-core-002; `str-01` Abschnitte 4 und 6; `str-03` Abschnitt 3 |

## Vom Projektleiter bearbeitet

| Befund | Bearbeitung |
|---|---|
| D1 | req-fach-010 und req-fach-011: „Indikatoren“ statt „Komponenten“. |
| D5 | „Eigenschaften der Order“ statt „Parameter“ in req-fach-016, in der Überschrift von req-fach-027 und im Glossar „Order aufgeben“. |
| H1 | Bezug von `VORHER` bei mehreren Auslösern und die Zählung der Auswertungen in req-fach-014 als offen gekennzeichnet. Betrifft die Ausführung, wird vor der Beschreibung des Strategietesters geklärt. |
| H2 | req-fach-036: Auch die Namen der Objekttypen der Anwendung und festgelegte Werte von Eigenschaften haben eine sprachneutrale Kennung. |
| H3 | req-fach-051: Spread, Pip und Punkt liefert das Instrument als Kursdifferenz. |
| H4 | Nicht entschieden. In `str-01` unter „Offene fachliche Fragen“ aufgenommen, für die Gestaltung im Strategiedesigner ohne Bedeutung. |
| H5 | „Element des Ablaufs“ statt „Ablaufelement“ in req-ui-003 und req-ablauf-007. |
| H6 | req-ablauf-008: Element, dessen Elementtyp oder Objekttyp nicht bekannt ist, statt „Verweis“. |
| H7 | Beispiele angepasst: req-fach-036 `markttechnik_h1.trend_intakt`, req-ui-005 „ema21, aus Vorlage EMA, Objekttyp Indikator“. |
| H8 | Verworfen. Der Anzeigename `VORHER` gilt, die Frage nach weiteren deutschen Funktionsnamen bleibt offen (req-fach-036). |
| H9 | req-ui-012: „Position schließen“ ergänzt. |
| H10 | req-param-005: Instanz in vollem Umfang änderbar, einschließlich fachlicher Ausdruck einer Regel und Regeln eines Regelwerks. |
| H11 | req-fach-049: Am Ausgang `gestellt` beginnt die Verwaltung, sie wird erst bei ihren Auslösern durchlaufen; am Ausgang `nicht gestellt` geht der Ablauf sofort weiter. |
| H12 | req-fach-052: Eigenschaft `Instrument` der Position ergänzt. |
| H13 | Abschnitt 9 Punkt 7: Komma entfernt. |
| H14 | `str-01` Voraussetzungen: Kapital, Tickwert, Mindestvolumen statt Mindestlot; Entry-Puffer und Stop-Puffer als Strategieparameter. |
| H15 | Änderungsnachweis des Glossars nach Datum geordnet. |
| H16 | Abschnitt 9 Punkt 10: vom Betreiber kontrolliertes Netz, Betreiber und Anwender dort dieselbe Person. |
| H17 | Zeile C6 in `requirements-1-response.md` berichtigt. |
