# Prüfauftrag Arbeitspaketplan, Durchlauf 4 (Nachprüfung)

- Vorhaben: `relay`
- Phase: 3 Planung, Nachprüfung nach `plan-3.md`
- Rolle: QA
- zu prüfender Stand: `main`, der Commit, der diesen Prüfauftrag enthält (`git log -1 --format=%H -- development/relay/reviews/plan-4-order.md`); nenne ihn im Bericht vollständig
- vorheriger Prüfbericht: `development/relay/reviews/plan-3.md` (nicht bestanden, B1 und B2)

## Gegenstand

Dies ist eine Nachprüfung. Prüfe nur, ob B1 (Kriterien zur Bedienbarkeit ohne Anleitung in `wp05`, `wp06`, `wp07`) und B2 (M5 und Namen aus M7 in den Kriterien von `wp01`) aus `plan-3.md` behoben sind und ob die dafür und für die Hinweise geänderten Stellen neue Fehler enthalten. Die Spezifikation ist parallel um die Einrichtung des Abrufs ergänzt (Spezifikation 4.7, Programm `pipwerk-fetch-mt5-setup`); prüfe, ob `wp06` und die Abdeckung das aufnehmen. Änderungen sichtbar mit `git diff 69b324edb7ff607d4798399771bf30eaf6105be3 <geprüfter Commit> -- development/relay/plan.md`; der letzte Eintrag des Änderungsnachweises nennt die Stellen.

Nicht Gegenstand: alle übrigen Stellen, Hinweise aus früheren Durchläufen (melde sie nicht erneut), die Spezifikation selbst (eigener Prüfauftrag `specification-7-order.md`), der Code.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- In `docs/technical/entwicklungsverfahren.md`: Phase 3 mit dem Absatz zum Inhalt eines Arbeitspakets, „Umfang der Prüfungen“ (Nachprüfung; nur blockierende Befunde verhindern das Bestehen; Hinweise in einer Zeile; höchstens etwa 60 Zeilen)
- `development/relay/specification.md`, `development/relay/wp01/acceptance/1.md`

Nenne zu jedem Befund Fundstelle, Sachverhalt und einen konkreten Kritikpunkt oder eine Frage. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `plan-4.md` in das Berichtsverzeichnis `work/relay/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
