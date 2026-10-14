# Prüfauftrag Funktionstest, Auftrag 01, Durchlauf 1

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: Tester Funktion
- zu prüfender Commit: `d6b354201feb1a8385819ad37946d98150edd1f6` (Zweig `ablauftest/wp01-01`)
- Auftrag: `development/ablauftest/wp01/orders/01.md` auf dem Zweig `ablauftest/wp01`

## Gegenstand

Prüfe den Commit gegen Auftrag 01 und die Spezifikation: Funktion, Grenzfälle, automatische Tests, Programmierregeln und technische Dokumentation.

Lege das Prüfskript `components/pipwerk-studio/scripts/check` nach Abschnitt 6.2 der Spezifikation an, einschließlich der Suche im Repository nach Abschnitt 4.4, und beschreibe Name, Aufruf und Parameter in einem neuen Abschnitt 6.4 „Prüfskript“ in `docs/technical/pipwerk-studio.md` (Plan, Zeile „Prüfskript“). Arbeite dafür im Zweig `ablauftest/wp01-functiontest`, aufgesetzt auf dem zu prüfenden Commit, übertrage ihn nach GitHub und nenne den Commit des Prüfskripts im Bericht.

Der Browsertest läuft in diesem Commit noch gegen den Entwicklungsserver; die Umstellung auf die gebaute Oberfläche ist Gegenstand von Auftrag 02 und kein Befund zu Auftrag 01.

Entscheidungen des Softwarearchitekten zu Rückfragen des Entwicklers (kein Befund, sofern sonst richtig umgesetzt):

- Der neue Abschnitt „Start als Testumgebung“ trägt die Nummer 4a.
- `testenv status` endet mit 0, wenn die Testumgebung läuft, sonst mit 1; `testenv stop` ohne Testumgebung endet mit 0.
- Das Skript braucht zusätzlich `python3` und `ps`; das steht in der technischen Dokumentation.

## Prüfgrundlagen

- `development/ablauftest/wp01/orders/01.md`
- `development/ablauftest/specification.md`, `development/ablauftest/plan.md`
- `docs/technical/pipwerk-studio.md`, `docs/technical/development-test-security-rules.md`
- Briefing Tester Funktion in `docs/technical/agentenrollen-und-briefings.md`

## Ablage

Schreibe den Testbericht ohne Commit als Datei `01-functiontest-1.md` in dein Arbeitsverzeichnis `work/ablauftest/wp01/functiontest/` im Entwicklungsverzeichnis. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit und den Commit des Prüfskripts vollständig und alle Befunde mit Fundstelle.
