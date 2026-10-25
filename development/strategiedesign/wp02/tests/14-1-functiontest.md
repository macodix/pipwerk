# Testbericht Funktion: Auftrag 14, Durchlauf 1

- Ergebnis: **nicht bestanden** (1 blockierender Befund)
- geprüfter Commit: `e314263112c5ea3ac65d0ed504069c4dc580e34a` (Zweig `strategiedesign/wp02-14`), ausgecheckt und mit `git rev-parse HEAD` kontrolliert
- Prüfskript: unverändert, Stand des geprüften Commits; kein Zweig `-functiontest` angelegt

## Ausgeführt

- `components/pipwerk-studio/scripts/check --backend-port 18101 --frontend-port 18102` (beide frei): Exitcode 0. Bibliothek, Backend (1032 Tests), Namenssuche, `npm ci`, `typecheck`, Vitest, `build` bestanden. Playwright: 294 bestanden in Chromium, Firefox und WebKit, 0 fehlgeschlagen. In `e2e/` gibt es kein `skip`, `fixme`, `only` oder `fail`.
- `testenv start` auf 18111/18112: läuft, das Objektverzeichnis liegt unter `.testenv/`, die Liste der Strategien nennt die gesicherte „EMA-Trendfolge“. `testenv stop` hat es beendet.

## Befunde

### Blockierend

1. Fester Port im Code (Kriterium 4): `frontend/playwright.config.ts` Zeilen 5 und 6 setzen die Rückfallwerte 18000 und 15173. `src/sourceRules.test.ts` durchsucht nur `src/` und erfasst das nicht. Das Prüfskript übergibt Ports immer, aber Kriterium 4 verlangt „kein fester Port im Code“. `docs/technical/pipwerk-studio.md` (Abschnitt 6.3) nennt dieselben Ports als Standard.

### Hinweise (nicht blockierend)

2. `docs/technical/pipwerk-studio.md` Zeile 13 sagt noch „Auftrag 06 schreibt sie für die neue Oberfläche neu“. Das ist durch die Aufträge 06 bis 14 überholt.
3. `docs/technical/pipwerk-studio.md` Zeile 161 sagt „Bis Auftrag 04 zusammengeführt ist, laufen die Tests der Oberfläche gegen ein Backend im Speicher“. Gemeint sind nur noch die Vitest-Tests, und „Annahmen … nach dem Zusammenführen zu prüfen“ ist veraltet.
4. `e2e/hints.spec.ts` Zeile 54 bis 57: Die Rückfrage beim Schließen wird nur bedient, wenn sie sichtbar ist (`if (await discard.isVisible())`). Ein Test, der ohne Rückfrage durchläuft, würde das nicht bemerken. Der Test sollte die Rückfrage erwarten.
5. `e2e/layout.spec.ts` verwendet `dispatchEvent('click')` auf die Karte, weil in 844 × 390 die Werkzeugleiste die Karte überlagert. Die Rückfrage-Prüfung (`withinWindow('remove-users')`) bleibt gleich scharf; die Überlagerung selbst prüft der Test nicht eigens (die Anordnungstests prüfen Überlappung der Bereiche).

## Ergebnis der Punktprüfung

- Punkt 1: `str-01` und `str-03` (str-03 auch in 390 × 844 nur mit Klicks) bauen aus der leeren Zeichenfläche, speichern, laden neu, vergleichen zweimal mit dem Testfall. `compare.ts`: `inputs` werden auf beiden Seiten nach ihrem Inhalt geordnet; Objekt, Eigenschaft, Argumente, `refresh` und `first_use` bleiben im Vergleich, ein Unterschied bleibt sichtbar. Spezifikation Abschnitt 3.3 und 7 schreiben keine Reihenfolge der Eingänge vor. `refreshValue` prüft die Zahl der Schalter und schaltet alle ein; `expectSaved` und `expectUnsaved` vergleichen den vollständigen Text. In Ordnung.
- Punkt 2: sechs Größen und Smartphone-Größen mit Menü, Rückfragen und den übrigen Fenstern bestanden. Bausteine, Formeleditor und Assistent stehen in `expressions.spec.ts` und sind bestanden.
- Punkt 3: `hints.spec.ts` und die übrigen Tests der Liste sind vorhanden und bestanden.
- Punkt 4: Es gibt keine verwaisten, deaktivierten oder übersprungenen Tests.
- Stub-Betrieb: `run-stub.mjs`, `e2e:stub` und `PIPWERK_STUDIO_E2E_STUB` sind entfernt. Verweise bleiben nur im Änderungsabschnitt der Dokumentation (als Vermerk der Entfernung). `fakeApi.ts` dient den Vitest-Tests.
- Punkt 5: Prüfskript und Testumgebungsskript sind aktuell (siehe oben).
- Punkt 6: `pipwerk-studio-testfaelle.md` stimmt in Reihenfolge, Namen und Belegungen mit den Tests überein (Stichprobe der Schritte von `str-03` und `str-01`). `docs/user/pipwerk-studio.md` und `docs/user/README.md` enthalten keine Test- und Abnahmeverweise und keine Entwicklungspfade; die Adressen `127.0.0.1` dort sind Produktangaben. Die Glossare sind ergänzt (Kennung im Ausdruck, Abschnitt, Instanz).
