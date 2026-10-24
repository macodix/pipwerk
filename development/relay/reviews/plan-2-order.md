# Prüfauftrag Plan, Durchlauf 2

- Vorhaben: `relay`
- Phase: 3 Planung, Einwand des Auftraggebers (`revise`)
- Rolle: QA
- zu prüfender Stand: `main`, Commit `40e5ea8a51fa913a9e559a1453d6c1741d65e36c`

## Gegenstand

Der Auftraggeber hat zur Präsentation `development/relay/presentations/plan-1.html` eingewandt (Festlegung in `development/relay/scope.md`, Stand 2026-10-24): `wp01` prüft die Grundmechanik (Adresse, Weitergabe über zwei Relays, Prüfwert, Warteschlange, Wiederholung, unzustellbare Nachricht, Empfangsbestätigung, Abruf) nur mit Verzeichnissen im Dateisystem, ohne SFTP. Zwischen zwei Rechnern ist das gemeinsame Verzeichnis ein vom Betreiber eingebundenes Netzlaufwerk (Spezifikation 3.4). Ziel der Abnahme von `wp01`: Die Grundmechanik ist funktional und robust; die Abnahmekriterien zeigen das, auch bei Störungen. SFTP wird ein eigenes Paket nach `wp01`, wie Matrix, Weg für Dateien und Web-API.

Geändert wurden: Spezifikation Abschnitt 8 (Prüfkomponente, Störungen, Testumgebung, Durchgänge 1 bis 4) mit den Folgestellen 4.5, 5 und 9; der ganze Plan `development/relay/plan.md`. Die Änderungsnachweise beider Dokumente nennen die Stellen.

Prüfe nur die geänderten Stellen und ihre Folgen:

1. Setzen Spezifikation Abschnitt 8 und Plan den Einwand vollständig um? Nutzt `wp01` nur Verzeichnisse im Dateisystem mit Netzlaufwerk zwischen den Rechnern, und ist SFTP ein eigenes Paket?
2. Zeigen die Abnahmekriterien von `wp01` jeden der genannten Teile der Grundmechanik, und zeigen sie die Robustheit unter Störungen? Kann der Auftraggeber jedes Kriterium selbst prüfen, auch die Empfangsbestätigung?
3. Widersprechen die geänderten Stellen dem übrigen Text der Spezifikation (insbesondere 3.4, 3.7, 4.1, 4.4, E4) oder den Anforderungen laut `scope.md`? Schränken sie etwas ohne Grundlage ein?
4. Ist jeder Teil der Spezifikation weiterhin durch ein Paket abgedeckt (Abschnitt „Abdeckung der Spezifikation“), sind die Abhängigkeiten der fünf Pakete schlüssig und ohne Zyklus, und lässt sich der Nachweis laut `scope.md` mit den Abnahmekriterien führen?

Nicht Gegenstand: die übrigen, unveränderten Teile der Spezifikation (Prüfung bestanden in `reviews/specification-5.md`), Spezifikation und Plan von `backtest`, Testdetails und Formulierungen, die in die Aufträge gehören.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- In `docs/technical/entwicklungsverfahren.md`: „Phase 3 – Planung“, „Meldungen“, „Umfang der Prüfungen“ (Detailtiefe nach Umfang; Plan und Spezifikation legen nur Bausteine, Entscheidungen und Abnahmekriterien fest; nur blockierende Befunde verhindern das Bestehen, alles andere ist ein Hinweis in einer Zeile; höchstens etwa 60 Zeilen), „Fragen an den Auftraggeber“ (einschließlich „Keine Einschränkung ohne Erfordernis“)
- `development/relay/scope.md` mit den dort genannten Anforderungsdokumenten, `development/relay/specification.md`, `development/relay/plan.md`, `development/relay/presentations/plan-1.html` (Einwand im Bestätigungsvermerk)

Nenne zu jedem Befund Fundstelle, Sachverhalt und einen konkreten Kritikpunkt oder eine Frage. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `plan-2.md` in das Berichtsverzeichnis `work/relay/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
