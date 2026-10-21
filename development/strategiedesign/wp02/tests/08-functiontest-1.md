# Testbericht Tester Funktion, Auftrag 08, Durchlauf 1

- Bezug: `strategiedesign/wp02`, Übergabedokument `08-1-order.md`
- Geprüfter Commit: `7f2b146db5e3177ff42d57a3bd8b0893693a98d2` (Zweig `strategiedesign/wp02-08`), ausgecheckt und mit `rev-parse HEAD` kontrolliert
- Ausgangscommit: `f2c1c8af22d9cfa9eba83b70984ea3ab5141bd3b`
- Prüfskript `check`: laut Prüfauftrag nicht ausgeführt (Code unverändert); kein Commit am Prüfskript

## Ergebnis: bestanden

Keine blockierenden Befunde.

## Prüfungen

1. **Diff nur unter `docs/`**: bestanden. `git diff --stat` zum Ausgangscommit: `docs/technical/pipwerk-studio.md` und `docs/user/pipwerk-studio.md`, je eine Zeile.
2. **Übereinstimmung mit `.choice-cards`** (`styles.css` Zeile 2120–2124: `display: grid`, `grid-template-columns: repeat(auto-fit, minmax(min(150px, 100%), 1fr))`, `gap: 9px`): bestanden.
   - Technische Dokumentation (Zeile 140) nennt Regel, Mindestbreite 150 px und „so viele Spalten, wie passen“ wörtlich wie im Stylesheet.
   - Rechnung der Spalten bei drei Karten: Eigenschaftenansicht `.props` hat 14 px Innenabstand je Seite.
     - 390 × 844: 390 − 28 = 362 px, zwei Spalten (309 px), drei bräuchten 468 px. Stimmt.
     - 844 × 390 und 820 × 1180: Seitenbereich 340 px, abzüglich 1 px Rand und 28 px Innenabstand = 311 px, zwei Spalten (309 px). Stimmt.
   - Anwenderdokumentation (Abschnitt 9): „zwei Karten nebeneinander und die dritte darunter“ stimmt mit der Rechnung.
3. **Keine Pfade, Benutzer- oder Rechnernamen**: bestanden. Die hinzugefügten Zeilen des Diffs enthalten keine solchen Angaben.
4. **Alte Aussage nicht wiederholt**: bestanden. In `docs/` gibt es zu Wahlkarten nur drei Stellen (Anwenderdokumentation Zeile 546, technische Dokumentation Zeilen 140 und 846). „untereinander“ und „füllen die Breite“ stehen dort nicht mehr. Andere Treffer („untereinander“ in `pipwerk-domain.md` und in Präsentationen, „füllen die Breite“ für Dialoge unter 700 Pixel) betreffen andere Sachverhalte.

## Hinweise (nicht blockierend)

- H1: Die Rechnung für 340 px lässt 2 px Reserve (311 gegen 309). Eine klassische Bildlaufleiste im Seitenbereich (etwa 15 px) ergäbe nur eine Spalte. Die Aussage gilt für Fenster ohne eingeblendete Bildlaufleiste. Ich habe sie nicht im Browser gemessen (nur aus dem Stylesheet gerechnet).
- H2: Die Anwenderdokumentation sagt „in einem schmalen Fenster“. Auch bei 1180 × 820 und breiter (Eigenschaftenansicht 380 px) stehen zwei Karten nebeneinander und die dritte darunter; die Einschränkung auf schmale Fenster ist dort nicht nötig.
- H3: `appearance.spec.ts` prüft nur Abstände und die Lage im Fenster, nicht die Spaltenzahl der Karten. Die dokumentierte Aussage „zwei nebeneinander, eine darunter“ hat keinen automatischen Test.
- H4: Der Befehl zum Anlegen des Berichtsverzeichnisses wurde in dieser Sitzung verweigert (Bash gesperrt). Die späteren Prüfschritte, insbesondere der Pfadsuchlauf über den Diff, beruhen auf der vollständigen Diff-Ausgabe, die ich zuvor gelesen habe.
