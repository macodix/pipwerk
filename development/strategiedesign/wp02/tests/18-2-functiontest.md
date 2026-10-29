# Testbericht Tester Funktion, Auftrag 18, Durchlauf 2 (Nachprüfung)

- Ergebnis: **bestanden**
- Bezug: `strategiedesign/wp02`, Zweig `strategiedesign/wp02-18`
- Geprüfter Commit: `a5112dc3c02fb1760c963414c34fdc1375aef60d` (Vorgänger `7f8a0652ce4a0c2bb3f75a71ee1aea1aae99c75e`), ausgecheckt und mit `rev-parse HEAD` kontrolliert.
- Prüfskript: unverändert, kein eigener Commit des Prüfskripts.

## Prüfskript

`components/pipwerk-studio/scripts/check --backend-port 19500 --frontend-port 19501`, einmal vollständig: „check: all checks passed“, Exit 0.

- Bibliothek: pytest 1795 bestanden, ruff, ruff format, mypy, Schemas v1 und v2 gleich.
- Backend: pytest 1044 bestanden, ruff, ruff format, mypy; Rechtschreibung des Namens (486 Nennungen) richtig.
- Frontend: npm ci, Typprüfung, Vitest 664 bestanden (53 Dateien), Build.
- Browsertests: 369 bestanden in Chromium, Firefox und WebKit (16,7 min), keine fehlgeschlagenen, übersprungenen oder unsteten Tests ausgewiesen.
- Dateimodus: `check` und `testenv` sind `100755` im Commit (`git ls-tree`).

## Befund B1 (Löschwege einer Verbindung)

Behoben.

- Die Tests rufen die Wege tatsächlich auf (`canvas.spec.ts`, ab Zeile 394): `edge-delete` anklicken (Kreuz, Testkennung in `edges.tsx:38`), `keyboard.press('Delete')`, `keyboard.press('Backspace')`. Je Weg wird geprüft: Linie auf der Zeichenfläche weg, Zustand „ungespeichert“, gespeichertes Dokument ohne Verbindung (vorher 1, nachher 0) und die Befunde `trigger.unconnected` und `flow.not_reached` nach „Prüfen“ (vorher nicht vorhanden). Alle 12 Läufe (4 Tests mal 3 Browser) bestanden.
- Sperre für Eingabefelder: Test „the keys Delete and Backspace delete nothing while the input focus lies in a text field“ sendet beide Tasten aus dem Feld „Name des Abschnitts“; die Verbindung bleibt. Bestanden in allen drei Browsern.
- Code: `Canvas.tsx` Zeilen 544 bis 556 behandelt `Delete` und `Backspace` und verwirft Ereignisse aus `INPUT`, `TEXTAREA`, `SELECT`; `tabIndex={-1}` (Zeile 581) und `outline: none` (`styles.css`) im Diff.
- Dokumentation: `docs/technical/pipwerk-studio.md` Zeile 149 (Tasten „Entf“ und „Rücktaste“, `tabIndex={-1}`, Sperre für Eingabefeld, Textbereich, Auswahl) und Zeile 926 (Tests, Befundcodes, Textfeld) stimmen mit Code und Tests überein.
- Diff zu `7f8a065`: nur Ergänzungen in 4 Dateien (93 Zeilen neu, 2 ersetzt). Kein Test geändert, abgeschwächt, übersprungen oder deaktiviert; kein `skip`, `fixme` oder `only` in `e2e/`.

## Neue Probleme

Keine blockierenden. Hinweis (nicht blockierend): Der Test der Sperre deckt nur ein Eingabefeld (`INPUT`) ab. Textbereich und Auswahl, die der Code ebenfalls ausnimmt, haben keinen eigenen Test.

## Befundliste

- Blockierend: keine.
- Hinweis H1: Sperre nur für `INPUT` getestet (siehe oben).
