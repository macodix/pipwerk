# Testbericht Tester Funktion, Auftrag 12, Durchlauf 1

- Bezug: `strategiedesign/wp02`, Auftrag 12 (`orders/12.md`), Grundlage Spezifikation Stand 2026-10-23
- geprüfter Commit: `e6288b89f16ceeeeb373831f1926c9845176326a` (Zweig `strategiedesign/wp02-12`, Ausgangscommit `365e6452bc893d011401e2573abe599b935455f9`); im Arbeitsverzeichnis ausgecheckt und mit `rev-parse HEAD` kontrolliert
- Prüfskript: unverändert, keine Änderung im Zweig `strategiedesign/wp02-12-functiontest`
- **Ergebnis: bestanden** (keine blockierenden Befunde; 2 Hinweise)

## Ausgeführt
- `npm ci`, `typecheck`, `build`: Exitcode 0. Vitest: 46 Dateien, 561 Tests bestanden.
- `scripts/check --backend-port 18412 --frontend-port 18413`: Exitcode 1, allein wegen der 3 vom Entwickler gemeldeten Tests in `e2e/testcases.spec.ts` (siehe unten). Bibliothek, Backend (1032 Tests, ruff, mypy), Schreibweise des Namens, `npm ci`, `typecheck`, Vitest und `build` bestehen. Playwright: 252 Tests, 243 bestanden, 9 fehlgeschlagen (3 Tests in je Chromium, Firefox, WebKit).
- Chromium, Firefox und WebKit laufen im Prüfskript alle mit den gleichen Tests. `objects.spec.ts`, `canvas.spec.ts`, `open.spec.ts`, `library.spec.ts` bestehen in allen drei Browsern. Einen zweiten Lauf mit `--max-failures=20` habe ich nicht gestartet: Der Lauf des Prüfskripts enthält Chromium vollständig (84 Tests, 3 Fehlschläge, alle in `testcases.spec.ts`).

## Zuordnung der 3 Fehlschläge zu den Aufträgen
- str-03 (1366 × 768 und 390 × 844): Unterschied nur bei `first_use` (erwartet gesetzt, gebaut `null`) und `refresh` (erwartet `true`, gebaut `false`) der Eingänge des Hauptablaufs in den Verwaltungen. Der Test baut die Ausdrücke mit `bindExpr` aus Bausteinen. Der Eingang aus den Bausteinen (`expression/inputs.ts`), „Aktualisieren“ unter „Verwendete Werte“ und die Wahl des Elements der ersten Verwendung in der Eigenschaftenansicht sind Umfang von Auftrag 13 (Punkte 1 bis 3); der Aufbau der Testfälle ist Auftrag 14 Punkt 1. Auftrag 12 schreibt `first_use` beim Verbinden auf der Zeichenfläche (`connectValue`, `setFirstUse`, getestet). Zuordnung: zutreffend, kein Befund zu Auftrag 12.
- str-01: `1-2-3-Trend (Markttechnik)` steht nicht mehr in der Bibliothek. Auftrag 09 Punkt 6 entfernt `Markttechnik` aus der Anmeldung; der Diff Ausgangscommit bis Prüfcommit ändert weder Bibliothek noch Backend noch `testcases.spec.ts`. Zuordnung: zutreffend (Auftrag 14 Punkt 1), kein Befund zu Auftrag 12.

## Punkte des Auftrags 12
- Punkte 1 bis 8 sind im Code, in Vitest und in Playwright belegt: Lage beim Element der ersten Verwendung in beiden Ausrichtungen (`objects.spec.ts`), kein Bereich für Objekte, Karte mit Zeilen und „Alle n anzeigen“, durchgezogene und gestrichelte Linien, Umschalter mit Start „Auswahl“, Legende mit 5 Zeilen, Verbinden mit Ziehen und Klick, Ablehnung an Elementen ohne Verwendbarkeit (`usable`), ein Eingangspunkt je Element, Verschieben einer Karte und „Neu anordnen“, unbekannter Typ rot. Die Verwendbarkeit kommt aus `POST /api/v1/usage`; die Oberfläche rechnet sie nicht selbst.
- Ersetzte Tests sind begründet: `canvas.spec.ts` (Linien-Umschalter, Karte verschieben statt „Stelle im Bereich der Objekte“; Ziel „StopLoss“ statt „Position ändern“, weil EMA50 dort nach 3.3 nicht verwendbar ist), `open.spec.ts` (Lage der Karten statt Bereich), `library.spec.ts` (`lane-empty` nicht mehr vorhanden), `App.generic.test.tsx`, `ops.test.ts` (`moveObject`, `placeObject` ersetzt durch `setFirstUse`). Eine Prüfung wird nirgends abgeschwächt.
- `e2e/builder.ts` (`zoom-fit` vor jedem Klick statt `scrollIntoViewIfNeeded`) und `e2e/support.ts` (wartet auf `data-usage="report"` und gesetzte Ansicht) verschärfen oder erhalten die Prüfung: Der Klick auf das Ziel bleibt, Sichtbarkeit und Trefferfläche prüft Playwright weiter.
- Entfernen von „Stelle im Bereich der Objekte“ („Nach oben“, „Nach unten“): zulässig. Spezifikation 5.3 und 5.4 kennen weder diesen Bereich noch eine solche Stelle; Auftrag 12 Punkt 1 verlangt „kein eigener Bereich und kein Kasten für Objekte“; Auftrag 13 Punkt 1 listet die Felder der Eigenschaftenansicht ohne sie. Anwenderdokumentation (Abschnitte 3.4, 6.3, Tabelle „ohne Ziehen“) ist angepasst.
- Code: kein `innerHTML` und kein `dangerouslySetInnerHTML` in `src`; `sourceRules.test.ts` (fester Pfad, Port, Rechnername) besteht. Die Treffer für `127.0.0.1`, `5173` und `/home/beispiel` in der Dokumentation stehen schon vor Auftrag 12 und betreffen Beschreibungen der Testumgebung und ein erfundenes Beispiel, nicht den Entwicklungsrechner.
- Dokumentation: `docs/technical/pipwerk-studio.md`, `docs/user/pipwerk-studio.md` und das Glossar („Element der ersten Verwendung“, „Datenverbindung“, Änderungsnachweis) stimmen mit dem Code überein; es bleiben keine Verweise auf „Objekte und ihre Werte“ oder den Bereich der Objekte (Suche in Code und Dokumenten).

## Befunde
Blockierend: keine.

Hinweise (verhindern das Bestehen nicht):
1. `docs/user/pipwerk-studio.md` Glossar nennt den Eintrag „Schritt der ersten Verwendung“, das Glossar im Entwicklungsverzeichnis „Element der ersten Verwendung“; die Anwenderdokumentation sagt „Schritt“ (Anwendersprache). Bei Auftrag 14 (Glossar berichtigen) auf einheitliche Benennung achten.
2. Auftrag 13 sollte ausdrücklich festlegen, dass auch ein Eingang aus den Bausteinen und aus der Eigenschaftenansicht das Element der ersten Verwendung schreibt (`expression/inputs.ts` und `ElementView.tsx` rufen `addInput` ohne `setFirstUse`). Sonst bleibt der Unterschied bei `first_use` in str-03 bestehen. Das ist keine Abweichung von Auftrag 12.
