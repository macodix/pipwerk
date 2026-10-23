# Prüfauftrag Spezifikation, Durchlauf 1

- Vorhaben: `backtest`
- Phase: 2 Konzeption, Prüfung der Spezifikation
- Rolle: QA
- zu prüfender Stand: `main`, Commit `67c0339d26f4137e8f540b7cf41111dd8fb8e33c`

## Gegenstand

`development/backtest/specification.md`.

Prüfe, ob die Spezifikation die Anforderungen der Dokumente laut `development/backtest/scope.md`, Abschnitt „Geltende Dokumente“, vollständig und richtig umsetzt:

- `docs/design/requirements/anforderungen-gesamtsystem.md`
- `docs/design/requirements/anforderungen-strategietester.md`
- `docs/design/domain/fachmodell.md`, soweit es die Ausführung von Strategien, Orders, Positionen und Regeln betrifft
- Testfälle `str-01` und `str-03` unter `docs/design/strategies/` als Prüfmaterial nach `scope.md`, Abschnitt „Prüfmaterial“

## Umfang der Prüfung

1. Jede Anforderung, die das Vorhaben betrifft (Testlauf, Testzeitraum, Kursdaten, interne Abwicklung, Testkonto, Strategieparameter, Einzelschritt-Test, Auslöser `Manuell`, Backtest, Speichern und Vergleich, Datenbestand mit Import und Beschaffung, Oberfläche, Web-API, Sicherheit, Dokumentation), ist durch die Spezifikation abgedeckt und richtig umgesetzt.
2. Die Spezifikation widerspricht keiner Anforderung und keiner Festlegung des Fachmodells und trifft keine Entscheidung, die dem Auftraggeber zusteht. Die Antworten des Auftraggebers in `development/backtest/questions/backtest-01.md` sind richtig eingearbeitet (Abschnitte 3.4, 3.6, 6.1, 6.3, 8, 13).
3. Beide Testfälle lassen sich mit der Spezifikation im Einzelschritt-Test prüfen und im Backtest über den vorbelegten Testzeitraum testen, ohne die Strategie zu bearbeiten (Abschnitt 9).
4. Abschnitt 8 gibt den bestätigten Prototyp richtig wieder: `development/backtest/prototype/pipwerk-replay-prototyp.html` und `development/backtest/prototype/README.md`; die Punkte 1 bis 7 der Frage 1 in `backtest-01.md`. Die Datei lässt sich im Browser über `file://` öffnen.
5. Einschränkungen, die die Spezifikation trifft, sind begründet („Keine Einschränkung ohne Erfordernis“).

Nicht Gegenstand: die Dokumente des Auftraggebers selbst (in Phase 1 und der Nachprüfung `reviews/requirements-5.md` geprüft); der fachliche Inhalt der Testfälle; die Spezifikation des Vorhabens `strategiedesign` außer als Grundlage, auf die verwiesen wird; der zurückgestellte Indikator `Markttechnik`; die als offen gekennzeichneten Punkte laut `scope.md`.

## Prüfgrundlagen

- Briefing QA, Phase 2 Spezifikation, in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Dies ist der erste Durchlauf, melde alle Befunde auf einmal. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis in einer Zeile. Spezifikationen legen nur Bausteine, Entscheidungen und Abnahmekriterien fest, so knapp, wie der Umfang es erlaubt; Testdetails, Formulierungen, Schreibweisen von Pfaden und vollständige Listen von Kennungen gehören in die Aufträge und sind kein Befund. Der Bericht umfasst höchstens etwa 60 Zeilen.
- „Fragen an den Auftraggeber“ in `docs/technical/entwicklungsverfahren.md`, einschließlich „Keine Einschränkung ohne Erfordernis“ und „Lücken“
- `docs/technical/pipwerk-studio.md`, `docs/technical/pipwerk-domain.md`, `docs/technical/development-test-security-rules.md`, `docs/technical/glossar.md`
- Spezifikation `development/strategiedesign/specification.md`, auf die die Spezifikation verweist

Nenne zu jedem Befund Fundstelle (Abschnitt der Spezifikation und Anforderung), Sachverhalt, Zuordnung nach „Fragen an den Auftraggeber“ und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als Datei `specification-1.md` in das Berichtsverzeichnis `work/backtest/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, die blockierenden Befunde und getrennt davon die Hinweise.
