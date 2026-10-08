# Arbeitsauftrag WO-2026-10-08-001 – Anzeige des Stands in Pipwerk Studio

## Status

- id: `WO-2026-10-08-001`
- status: `approved`
- client: Nutzer
- components: `pipwerk-studio`

## Ziel

Pipwerk Studio zeigt in seiner Oberfläche an, aus welchem Commit es läuft. Bei jeder Prüfung und Abnahme ist damit sofort erkennbar, welcher Stand bereitgestellt ist. Der Auftrag dient zugleich als Nachweisdurchlauf für das Entwicklungsverfahren.

## Umfang

Die Fußzeile der Oberfläche zeigt rechts neben der Anzeige des Backend-Status den Stand als Kurzform des Commits mit 7 Zeichen an. Auf Deutsch lautet die Anzeige „Stand: <kurzform>“, auf Englisch „Revision: <kurzform>“. Ein Sprachwechsel schaltet die Bezeichnung um.

Lässt sich der Stand nicht ermitteln, zum Beispiel bei einem Start außerhalb eines Git-Arbeitsbereichs, zeigt die Fußzeile „Stand: unbekannt“ beziehungsweise „Revision: unknown“. Pipwerk Studio startet und arbeitet in diesem Fall normal.

Wie der Stand technisch ermittelt und an die Oberfläche übergeben wird, entscheidet der Softwarearchitekt.

## Nicht-Umfang

- Versionsnummern, Releases oder Build-Datum;
- Anzeige des Stands an anderer Stelle als in der Fußzeile;
- sonstige Änderungen an Oberfläche oder Verhalten.

## Abnahmekriterien

1. Die Fußzeile zeigt rechts neben dem Backend-Status den Stand als Kurzform des Commits mit 7 Zeichen.
2. Auf Deutsch lautet die Anzeige „Stand: <kurzform>“, auf Englisch „Revision: <kurzform>“; ein Sprachwechsel schaltet sie um.
3. Am Teststand stimmt die angezeigte Kurzform mit den ersten 7 Zeichen des Commits überein, den `pipwerk-dev status` für den Teststand von `pipwerk-studio` meldet.
4. Ist der Stand nicht ermittelbar, zeigt die Fußzeile „Stand: unbekannt“ beziehungsweise „Revision: unknown“, und Pipwerk Studio startet normal.
5. Alle in den Entwicklungs-, Test- und Sicherheitsregeln vorgeschriebenen Prüfungen bestehen.
6. Technische Dokumentation und Anwenderdokumentation von Pipwerk Studio beschreiben die Anzeige.

## Referenzen

- `docs/design/requirements/anforderungen-strategiedesigner.md`, `req-ui-007` (Deutsch und Englisch als Oberflächensprachen)
- `docs/technical/development-test-security-rules.md`
- `docs/technical/pipwerk-studio.md`
- `docs/user/pipwerk-studio.md`
- `docs/technical/entwicklungsverfahren.md`

## Offene Punkte

keine

## Entscheidungen des Auftraggebers

2026-10-08T15:25:00 – Freigabe des Auftrags durch den Nutzer.

## Verlauf
