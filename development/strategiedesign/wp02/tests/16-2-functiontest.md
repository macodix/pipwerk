# Testbericht Funktion – Auftrag 16, Durchlauf 2

- Bezug: `strategiedesign/wp02`
- geprüfter Commit: `5f708be4e8020af4cbc6cbec1a5b5495cc1ff796` (Zweig `strategiedesign/wp02-16`), ausgecheckt und mit `rev-parse` kontrolliert
- Prüfskript: unverändert, kein eigener Commit
- **Ergebnis: nicht bestanden** (ein blockierender Befund)

## Ausgeführt

`components/pipwerk-studio/scripts/check --backend-port 18316 --frontend-port 18317`, ein vollständiger Lauf (Log `ft16-2-check.log` unter `work/strategiedesign/wp02/`). `check` und `testenv` vorher per `git checkout --` wiederhergestellt, `chmod +x` auf `bin/*` der beiden `.venv`.

| Schritt | Ergebnis |
|---|---|
| Bibliothek: pytest (1795), ruff, mypy, Schemas v1/v2 | bestanden |
| Backend: pytest (1044, darunter `test_frontend_type_copy.py`), ruff, mypy | bestanden |
| Namensprüfung, `npm ci`, typecheck, build | bestanden |
| Vitest | 51 Dateien, 634 Tests bestanden |
| Playwright (Chromium, Firefox, WebKit) | **341 bestanden, 1 fehlgeschlagen** (Befund 1) |

## Befunde

1. **blockierend** – Playwright, Chromium: `e2e/testcases.spec.ts:300` (str-01 „Scalping Punkt 2 Ausbruch“) fällt aus, „Timeout 10000ms exceeded while waiting on the predicate“ in `e2e/support.ts:80` (`openList`), aufgerufen über `choose` → `setCond` (`builder.ts:94`) → `setValue` (`builder.ts:74`) → `setCalculation` (`builder.ts:215`) → `buildStr01` (`testcases.spec.ts:268`). Das ist dieselbe Fehlerstelle wie Befund 2 aus Durchlauf 1. Firefox und WebKit bestehen (Test 328 in WebKit, entsprechend in Firefox). Das Prüfskript endet mit „check: FAILED: browser test“; die Vorgabe „Playwright muss in Chromium, Firefox und WebKit bestehen“ ist nicht erfüllt. Die Behebung (Auftrag: Select behält eine offene Liste beim Neuzeichnen) hat den Ausfall nicht beseitigt. Ursache nicht belegt: Seitenabbild im `error-context.md` zeigt die Oberfläche ohne offene Liste. Ob der Ausfall zufällig oder von der Maschinenlast abhängig ist, ist mit einem Lauf nicht entschieden; ein zweiter Lauf wurde nicht gemacht. Der Befund kommt nach der Korrektur unverändert wieder (Grenze der Durchläufe).

## Prüfung der Befunde aus Durchlauf 1

- Befund 1 (Kopie `element-types.json` gleich Antwort des Backends): behoben. `test_frontend_type_copy.py` besteht im Backend-pytest (1044 bestanden).
- Befund 2 (Select beim Neuzeichnen): Code geändert (`ui/controls.tsx`: `openedHere`, `domPath`, Wiederöffnen in `useLayoutEffect` innerhalb von 2000 ms, `closeList`, `onBlur` mit `isConnected`). Test belegt: `Select.test.tsx` „stays open when the interface draws the field anew …“ (Wiederöffnen, Fokus, kein Wiederöffnen nach Escape), Vitest besteht. Im Browser besteht der Fall aber nicht zuverlässig, siehe Befund 1 oben. Hinweis, kein Mangel: Die Lösung beruht auf einem modulweiten Zustand und einer Zeitgrenze von 2 s; sie öffnet eine Liste, die an gleicher Stelle im Seitenbaum neu erscheint, auch wenn es ein anderes Feld ist.
- Befund 3 (`.react-flow__attribution`): Regel aus `styles.css` entfernt; die beiden Test-Zeilen sind ebenfalls entfernt. Behoben.
- Befund 4: als Verhalten entschieden, nicht geprüft.

## Diff gegen `6b86959`

- Zusammenführung mit Auftrag 15: Bibliothek (`catalog.py`, `consistency/describe.py`, `expressions/blocks.py` u. a.), Backend, `openapi.json`, technische Dokumentation (`pipwerk-domain.md`, `pipwerk-studio.md`, `glossar.md`) mit eigenen Tests; Tests bestehen.
- `testcases.spec.ts`: Kreuzung ist als „vorheriger Wert von“ (`prev`) mit `<=`/`>` beziehungsweise `>=`/`<` gebaut (`crossingUp`/`crossingDown`), str-03 nutzt `or` über beide Richtungen. Gleiche Aussage wie zuvor, nicht abgeschwächt (Block „Kreuzen“ entfällt mit Auftrag 15). `expressions.spec.ts` (Phone-Test): gleiche Bedingung als `and` aus zwei Vergleichen, Prüfungen von Sichtbarkeit und Satz unverändert.
- `surface.spec.ts`: E13-Test nutzt „Nicht“ statt der Kreuzung, beide Richtungen und die Gleichheit der Sätze bleiben geprüft. Die Hilfsfunktion `ownText` ist entfernt; die Prüfung auf die Kurzform läuft jetzt über den ganzen Seitentext (`pageText`), also strenger. Entfernt: die Zeile `toHaveCount(0)` auf `.react-flow__attribution` (ebenso in `App.canvas.test.tsx`); der Text „React Flow“ wird weiter geprüft. Das ist die Folge der entfernten Regel, keine Abschwächung.
- `builder.ts`: `refreshValue` mit `check({ force: true })` (Kommentar: Kasten des Schalters liegt über dem Feld). Das umgeht die Prüfung der Anklickbarkeit; die Wirkung des Schalters wird danach weiter geprüft. Hinweis, kein Mangel.
- Keine übersprungenen oder deaktivierten Tests (Playwright-Lauf: 341 bestanden, 1 fehlgeschlagen, 0 übersprungen).
