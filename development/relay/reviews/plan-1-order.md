# Prüfauftrag Plan, Durchlauf 1

- Vorhaben: `relay`
- Phase: 3 Planung
- Rolle: QA
- zu prüfender Stand: `main`, Commit `0bf2be63a59cf42f0954b6b2bee087d141d2e33e`

## Gegenstand

Erster Durchlauf, vollständig. Prüfe den Arbeitspaketplan `development/relay/plan.md` gegen die Spezifikation `development/relay/specification.md` und die Anforderungen laut `development/relay/scope.md`:

1. Ist jede Anforderung laut `scope.md` durch die Spezifikation und jeder Teil der Spezifikation durch ein Arbeitspaket abgedeckt (Abschnitt „Abdeckung der Spezifikation“)?
2. Hat jedes Paket Ziel, Umfang, Nicht-Umfang, umgesetzte Teile der Spezifikation, Abhängigkeiten und Abnahmekriterien, und endet es mit einem Ergebnis, das der Auftraggeber selbst prüfen kann?
3. Lässt sich der Nachweis laut `scope.md` mit den Abnahmekriterien der Pakete führen?
4. Sind die Abhängigkeiten schlüssig, insbesondere der Beginn von `wp01` auf dem von der QA geprüften Stand von `backtest/wp02` (`backtest/wp02:development/backtest/wp02/reviews/2.md`)?
5. Schränkt ein Abnahmekriterium etwas ein, was Anforderungen und Spezifikation nicht einschränken, oder widerspricht es ihnen?

Nicht Gegenstand: die Spezifikation selbst (Prüfung bestanden in `reviews/specification-5.md`), Spezifikation und Plan von `backtest`, Testdetails und Formulierungen, die in die Aufträge gehören.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- In `docs/technical/entwicklungsverfahren.md`: „Phase 3 – Planung“, „Meldungen“ (Abhängigkeit gilt als erfüllt, sobald die Prüfung der QA bestanden ist), „Umfang der Prüfungen“ (Detailtiefe nach Umfang: Plan legt nur Bausteine, Entscheidungen und Abnahmekriterien fest; Testdetails gehören in die Aufträge; erster Durchlauf vollständig; nur blockierende Befunde verhindern das Bestehen, alles andere ist ein Hinweis in einer Zeile; höchstens etwa 60 Zeilen), „Fragen an den Auftraggeber“ (einschließlich „Keine Einschränkung ohne Erfordernis“)
- `development/relay/scope.md` mit den dort genannten Anforderungsdokumenten, `development/relay/specification.md`

Nenne zu jedem Befund Fundstelle, Sachverhalt und einen konkreten Kritikpunkt oder eine Frage. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `plan-1.md` in das Berichtsverzeichnis `work/relay/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
