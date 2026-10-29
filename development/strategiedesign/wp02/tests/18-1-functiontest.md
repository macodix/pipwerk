# Testbericht Tester Funktion: Auftrag 18, Durchlauf 1

- Geprüfter Commit: `7f8a0652ce4a0c2bb3f75a71ee1aea1aae99c75e` (Zweig `strategiedesign/wp02-18`, Ausgangscommit `89fc4d9481777590ecd5edd30c835745d10eadab`). Im Arbeitsverzeichnis ausgecheckt und mit `rev-parse HEAD` bestätigt.
- Prüfskript: unverändert, kein Commit im Zweig `-functiontest`.
- **Ergebnis: nicht bestanden** (ein blockierender Befund, B1).

## Prüfskript
- `components/pipwerk-studio/scripts/check` auf den Ports 19120/19121 und danach 19122/19123, nacheinander: beide Läufe Exitcode 0, „all checks passed“.
- Playwright: 357 Tests bestanden in Chromium, Firefox und WebKit (16,2 min je Lauf). Vitest, Typprüfung, Build, Backend- und Bibliothekstests, ruff und mypy bestanden.
- Dateimodus `100755` für `check` und `testenv` im Commit; Ausführungsrechte im Arbeitsverzeichnis vorhanden.

## Befunde
**B1 (blockierend): Kreuz an der Linie und Taste „Entf“ sind nicht mehr getestet.**
- Fundstelle: `frontend/src/canvas/edges.tsx:31–47` (Schaltfläche `edge-delete`), `Canvas.tsx:546–553` (Entf/Rücktaste), `flowModel.ts:430` (`deletable`).
- Sachverhalt: Der Browsertest `canvas.spec.ts` wurde von `edge-delete` auf die Eigenschaftenansicht umgestellt. Kein Test in `src` oder `e2e` ruft das Kreuz oder die Taste noch auf (Suche nach `edge-delete`, `Delete`, `Backspace`). Der Code bleibt aktiv, die technische Dokumentation (`docs/technical/pipwerk-studio.md`, Zeile 149) sagt ausdrücklich, dass beide weiter löschen. Zwei Löschwege sind damit ohne Test.
- Hinweis: Die Spezifikation 5.3 nennt das Löschen in der Eigenschaftenansicht und hält das Löschen auf der Zeichenfläche für einen offenen Punkt des Auftraggebers (req-ui-017). Ob das Kreuz bleibt, entscheide nicht ich. Bleibt es, braucht es Tests, sonst ist es zu entfernen.

## Geprüft ohne Befund
- Umfang 1: `docs/user/pipwerk-studio.md` enthält keine Prüf- oder Abnahmeanleitung, keine Befundkennungen, keine der genannten Programmbegriffe (Suche). Verbindung löschen in der Eigenschaftenansicht (Abschnitt 6.2 Punkt 4), Kreuzen aus „Vorheriger Wert von“ (6.3), „Woher kommt der Wert?“ (6.4), Vorlagen (6.10), Legende, Neue Strategie ohne Assistent (Zeile 285), Befunde und „Zur Stelle“ (8) sind vorhanden. Vollständigkeit der übrigen Arbeitsabläufe aus 5.5 nur stichprobenartig gelesen.
- Auswahl und Löschen einer Verbindung entsprechen der Spezifikation 5.3 (Zeile 433). Umsetzung (`ConnectionView`), Texte in `de.json`/`en.json`, Zustandstest in `studioState.test.ts` und Browsertest `canvas.spec.ts` sind vorhanden; die Technikdokumentation beschreibt sie.
- `test_the_user_documentation_holds_no_instructions_to_try_the_web_api`: Die Prüfung ist schärfer als vorher (drei Zeichenketten neu in der Verbotsliste, nur die Verweisprüfung auf die technische Dokumentation bleibt).
- Umbenennung der Beispieldatei: alle Verweise (Test, `pipwerk-domain.md`, `pipwerk-studio.md`) nennen den neuen Namen; kein Verweis auf `str-03-manuell-in-verwaltung` im Stand.
- Kein neues `skip`, `fixme`, `xfail` im Diff; die vorhandenen `skipif` stammen aus dem Ausgangsstand.
- Verweise auf Assistent, „Verwaltung“ und Baustein „Kreuzung“: in Code, Tests, Skripten und aktueller Dokumentation keine außer in Tests, die ihr Fehlen prüfen, und in Änderungsnachweisen des Glossars (Historie). Die Kreuzung als Zusammensetzung ist ausgeschrieben.
- Kein fester Pfad, Port oder Rechnername im Code: Treffer sind nur Loopback-Vorgaben (`127.0.0.1`, `localhost`) und die Regelprüfung `sourceRules.test.ts`.
- Technische Dokumentation und Glossar zu `str-01`/`str-03` und Order- und Positionsverwaltung nur stichprobenartig mit dem Code abgeglichen, kein Widerspruch gefunden.

## Anmerkung zum Ablauf
Die Ausgabe der Läufe liegt unter dem Aufgabenverzeichnis der Sitzung (`/tmp`), nicht unter `work/strategiedesign/wp02/`; das Werkzeug legt den Ort selbst fest.
