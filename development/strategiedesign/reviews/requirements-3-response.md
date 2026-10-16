# Bearbeitung des Prüfberichts, Durchlauf 3 (Nachprüfung)

- Vorhaben: `strategiedesign`
- Prüfbericht: [requirements-3.md](requirements-3.md)
- Rolle: Projektleiter
- Stand: 2026-10-16

Dritter Durchlauf der Prüfschleife. Über die blockierenden Befunde hat der Auftraggeber im Chat am 2026-10-16 entschieden.

## Entscheidungen des Auftraggebers

| Befund | Entscheidung | Fundstelle |
|---|---|---|
| N4 | Jede Order hat einen Preis. Bei einer Marktorder wird er bis zur Ausführung angenommen (aktueller Kurs), danach gilt der Ausführungspreis. Die Regel „Risiko je Trade“ rechnet mit diesem Preis und prüft nach der Ausführung mit dem Ausführungspreis erneut. Bei „Position ändern“ rechnet sie ab dem Einstiegspreis der Position. Ein fachlicher Ausdruck für alle Ordertypen. | Fachmodell req-fach-028; Anforderungen Strategiedesigner req-core-002; `str-03` Abschnitte 3 und 4 |
| N5 | Eine Schließorder hat keinen Stop-Loss, eine Risikoregel kann auf sie nicht angewendet werden. Allgemein: Eine Regel, die eine Eigenschaft voraussetzt, die der Ordertyp nicht hat, wird auf diese Order nicht angewendet. „Position schließen“ ohne Volumenangabe schließt ganz. | Fachmodell req-fach-046; `str-03` Abschnitt 4 |
| N6 | Die Prüfung der freien Margin wird für den Testfall nicht gebraucht und ist aus `str-01` genommen. Ob es dafür eine Regelvorlage gibt, bleibt offen. | `str-01` Voraussetzungen, Abschnitt 4 |

Welche Maßnahme folgt, wenn die Prüfung nach der Ausführung die Risikogrenze überschritten findet, legt `str-03` nicht fest; als offene fachliche Frage vermerkt, für die Gestaltung ohne Bedeutung.

## Vom Projektleiter bearbeitet

| Hinweis | Bearbeitung |
|---|---|
| H1 | req-fach-051: Ohne Instanz auf der Zeichenfläche hat die Kerze die Zeiteinheit des Auslösers `Kerzenschluss`; bei anderen Auslösern muss eine Kerze mit gesetzter Zeiteinheit liegen, sonst Fehler der Konsistenzprüfung. Mit Instanzen gelten deren Parameter. |
| H2 | req-fach-051: Order und Position nur in der Verwaltung verfügbar, sonst Fehler der Konsistenzprüfung. req-fach-001 und req-ablauf-003 zählen alle Objekte der Anwendung auf. |
| H3 | Ein mitgelieferter Indikator ist ein Objekttyp (req-fach-013a). Beispiel in req-ui-005 und Glossar „Objekttyp“ angepasst, „Markttechnik-Trend“ entfernt. |
| H4 | `str-01` Abschnitt 4: Beispiel entfernt, „kleinere Zeiteinheiten“ als andere Werte der beiden Strategieparameter. |
| H5 | `str-01` Abschnitt 2: Vorgabe an den Anwender, keine Prüfung. |
| H6 | req-core-002: Eingangswerte vollständig aufgezählt, einschließlich Tickgröße und Kapital. `str-01` Voraussetzungen nennen die Tickgröße. |
| H7 | „Vorhaben `strategiedesign`“ statt „erste Ausbaustufe“ (req-system-015). Glossar: Objektspeicher, Objektverzeichnis. req-ui-009 ohne doppeltes „Verzeichnis“. |
| H8 | Bestätigungsvermerke von `str-01` und `str-03` ergänzt. |
| H9 | Glossar „Bindungsart“ um Strategieparameter ergänzt. |
