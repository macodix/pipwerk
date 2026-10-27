# Prüfauftrag Spezifikation, Durchlauf 8 (Nachprüfung)

- Vorhaben: `relay`
- Phase: 2 Konzeption, Nachprüfung nach `specification-7.md`
- Rolle: QA
- zu prüfender Stand: `main`, der Commit, der diesen Prüfauftrag enthält (`git log -1 --format=%H -- development/relay/reviews/specification-8-order.md`); nenne ihn im Bericht vollständig
- vorheriger Prüfbericht: `development/relay/reviews/specification-7.md` (nicht bestanden, B1)

## Gegenstand

Nachprüfung, beschränkt auf B1 aus `specification-7.md` (Einrichtung des Abrufs auf dem zweiten Rechner) und die dafür und für die Hinweise geänderten Stellen: Spezifikation 4.6 Schritt 2, 4.7 Schritte 2 und 3, Status, Änderungsnachweis. Änderungen sichtbar mit `git diff 021cb226a66e2542d5c12e8da9ad29507093b6b5 <geprüfter Commit> -- development/relay/specification.md`. Ab diesem Durchlauf prüfst du nach „Grenze der Durchläufe“ nur noch Befunde, die Dokumente des Auftraggebers, bestätigte Festlegungen, Abnahmekriterien, den Umfang oder den Bedienablauf aus Sicht des Anwenders berühren; rein technische Einzelheiten sind höchstens Hinweise.

Nicht Gegenstand: alle übrigen Stellen, Hinweise aus früheren Durchläufen (melde sie nicht erneut), der Plan, der Code.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- In `docs/technical/entwicklungsverfahren.md`: „Umfang der Prüfungen“ (Nachprüfung; nur blockierende Befunde verhindern das Bestehen; Hinweise in einer Zeile; höchstens etwa 60 Zeilen), „Grenze der Durchläufe“
- `docs/technical/development-test-security-rules.md`, Abschnitt 5 Nr. 15

## Ablage

Schreibe den Prüfbericht als Datei `specification-8.md` in das Berichtsverzeichnis `work/relay/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
