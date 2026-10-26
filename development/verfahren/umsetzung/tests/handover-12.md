# Übergabe an den Tester Funktion: Auftrag 12

- zu prüfender Commit: `f8717516e389506ddfca9401342a85c605becbff` (Zweig `verfahren/umsetzung-12`, aufgesetzt auf `552aef81089b62a3823e7622a053b3231e1be3f4`)
- auftrag: `verfahren/umsetzung:development/verfahren/umsetzung/orders/12.md`
- prüfgrundlagen: Auftrag 12; Abnahmebericht Mangel M1 (`git show origin/main:development/verfahren/umsetzung/acceptance/1.md`); `docs/technical/entwicklungsverfahren.md`, Abschnitt „Entwicklungsverzeichnis“ (Skripte lesen keine Werte aus der Umgebung, keine Ersatzwerte `${NAME:-wert}`, feste Werte als einfache Zuweisung direkt nach dem Kopfkommentar). Diff gegen `552aef81089b62a3823e7622a053b3231e1be3f4`. Prüfe in `tools/devhost/` (auch `tests/fakes/` und `tests/testenv`) auf Werte aus der Umgebung und auf Ersatzwerte, auf Platzhalter statt Pfaden in der Repository-Kopie, dass README und Verfahrensdokument zum Code passen und dass das Verhalten der Skripte unverändert ist. Lass alle Tests über `tools/devhost/tests/testenv test` laufen (im Hintergrund, Stand in kürzeren Abständen abfragen).
- bericht: Dateiname `12-functiontest-1.md` im Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/verfahren/reports/`
- umfang der prüfungen: Regeln „Umfang der Prüfungen“ im Entwicklungsverfahren
