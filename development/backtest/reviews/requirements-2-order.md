# Prüfauftrag Dokumente des Auftraggebers, Durchlauf 2

- Vorhaben: `backtest`
- Phase: 1 Anforderung, Nachprüfung vor der Präsentation
- Rolle: QA
- zu prüfender Stand: `main`, Commit `5a1072494849c0110f86804686ecb092dd9b6d3a`
- Vorheriger Durchlauf: [requirements-1.md](requirements-1.md), geprüft auf Commit `b2179b9206ff20401271a50bcc115979588ad5dc`, nicht bestanden
- Bearbeitung durch den Projektleiter: [requirements-1-response.md](requirements-1-response.md)

## Gegenstand

Dies ist eine Nachprüfung. Prüfe nur:

1. ob die blockierenden Befunde B1 bis B6 aus `requirements-1.md` erledigt sind, so wie `requirements-1-response.md` es angibt,
2. ob die dafür und für H7, H8, H15 und H16 geänderten Stellen neue Fehler enthalten: Widersprüche, Lücken, mehrdeutige Begriffe, nicht gekennzeichnete offene Fragen, auch Widersprüche zu nicht geänderten Stellen derselben Dokumente.

Die geänderten Stellen zeigt `git diff b2179b9206ff20401271a50bcc115979588ad5dc 5a1072494849c0110f86804686ecb092dd9b6d3a` für diese Dateien:

- `docs/design/requirements/anforderungen-gesamtsystem.md`
- `docs/design/requirements/anforderungen-strategietester-backtester.md`
- `docs/design/domain/fachmodell.md`
- `docs/design/domain/indikator-markttechnik.md`
- `docs/design/strategies/str-01-fachlich-scalping-punkt-2-ausbruch-einfach.md`
- `docs/design/strategies/str-03-fachlich-ema-trendfolge.md`
- `docs/technical/glossar.md`
- `development/backtest/scope.md`

`scope.md` grenzt die Testfälle `str-01` und `str-03` jetzt als Prüfmaterial ab: Geprüft wird nur, ob der Strategietester sie in beiden Betriebsarten (Einzelschritt-Test und Backtest) so ausführen kann, wie sie beschrieben sind, nicht ihr fachlicher Inhalt.

Nicht Gegenstand:

- Stellen, die seit dem ersten Durchlauf nicht geändert wurden, außer eine geänderte Stelle widerspricht ihnen
- die Hinweise aus `requirements-1.md`, die der Projektleiter als offenen Punkt (H6, H13, H14) oder als Sache der Spezifikation eingeordnet hat. Melde sie nicht erneut.
- Änderungen in `anforderungen-strategiedesigner.md`; sie gehören zum Vorhaben `strategiedesign`. Ein Befund ist es nur, wenn eine Änderung dort einem geprüften Dokument widerspricht.
- die technischen Dokumente unter `docs/technical/` außer dem Glossar

## Prüfgrundlagen

- Briefing QA, Phase 1, in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“, „Fragen an den Auftraggeber“ (einschließlich „Keine Einschränkung ohne Erfordernis“ und „Lücken“) und „Grenze der Durchläufe“ in `docs/technical/entwicklungsverfahren.md`. Dies ist eine Nachprüfung: Nenne nur noch offene und neue Befunde. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis in einer Zeile. Eine Lücke ist nur blockierend, wenn ohne sie Betrieb, Umsetzung oder Sicherheit der Software beeinträchtigt sind. Der Bericht umfasst höchstens etwa 60 Zeilen.
- `development/backtest/scope.md`

Ordne jeden Befund nach „Fragen an den Auftraggeber“ zu: folgt aus einer Festlegung (mit Angabe der Festlegung), Sache der Spezifikation, offener Punkt oder Entscheidung des Auftraggebers. Fragen stellst du nur in der letzten Gruppe. Kommt ein Befund aus Durchlauf 1 unverändert wieder, kennzeichne ihn so.

Nenne zu jedem Befund Fundstelle (Datei und Abschnitt oder Kennung), Sachverhalt, Zuordnung und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als Datei `requirements-2.md` in das Berichtsverzeichnis `work/backtest/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, je Befund B1 bis B6 „erledigt“ oder „offen“, alle neuen blockierenden Befunde und getrennt davon die Hinweise.
