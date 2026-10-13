# Vorhaben ablauftest

Erster vollständiger Durchlauf des [Entwicklungsverfahrens](../../docs/technical/entwicklungsverfahren.md) nach dessen Neufassung vom 12. Oktober 2026. Gegenstand ist der Dialog „Über pipwerk Studio“ in Pipwerk Studio. Das Vorhaben wird nach dem Verfahren bearbeitet wie jedes andere, bis zur Integration in `main`.

## Geltende Anforderungsdokumente

- [Anforderungen an den Trading-Strategiedesigner](../../docs/design/requirements/anforderungen-strategiedesigner.md), nur req-ui-010 „Angaben zu pipwerk Studio“
- [Anforderungen an das Gesamtsystem](../../docs/design/requirements/anforderungen-gesamtsystem.md), nur für die Prüfung der Widerspruchsfreiheit von req-ui-010

Die übrigen Anforderungen dieser Dokumente gehören nicht zum Vorhaben und werden nicht geprüft.

## Stand

Phase 2. Prüfbericht der QA zu den Anforderungen, Durchlauf 1 ([requirements-1.md](reviews/requirements-1.md)): nicht bestanden. B5 und B7 vom Projektleiter korrigiert, B1 bis B4 und B6 vom Auftraggeber im Chat am 13. Oktober 2026 entschieden und in req-ui-010 eingearbeitet. Die Frage nach dem Autoren- oder Committer-Datum aus B2 beantwortet die Spezifikation. Frage ablauftest-01 beantwortet: Aufrufstelle festgelegt, Stand ohne Abfrage bei GitHub. Prüfschleife zur Spezifikation nach drei Durchläufen nicht bestanden, Frage ablauftest-02 beantwortet: Stand genau in Testumgebung und Installation, im Entwicklungsbetrieb Commit vom Start.
