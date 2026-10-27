# Testbericht Funktion – Auftrag 16, Durchlauf 1

- Bezug: `strategiedesign/wp02`
- geprüfter Commit: `6b86959cf47efa888e8b6503c0cd6b5e7a300472` (Zweig `strategiedesign/wp02-16`), ausgecheckt und mit `rev-parse` kontrolliert
- Prüfskript: unverändert, kein eigener Commit
- **Ergebnis: nicht bestanden** (ein blockierender Befund)

## Ausgeführt

`components/pipwerk-studio/scripts/check --backend-port 18216 --frontend-port 18217`, zwei Läufe (Logs `ft16-check.log`, `ft16-check2.log` unter `work/strategiedesign/wp02/`). Ausführungsrecht von `check` und `testenv` vorher wiederhergestellt.

| Schritt | Lauf 1 | Lauf 2 |
|---|---|---|
| Bibliothek: pytest, mypy | scheitert (Umgebung, siehe U1) | bestanden |
| Bibliothek: ruff, Schemas v1/v2 | bestanden | bestanden |
| Backend: pytest | scheitert (U1) | **scheitert: Befund 1** (1 von 1032) |
| Backend: ruff, mypy | mypy scheitert (U1) | bestanden |
| Namensprüfung, `npm ci`, typecheck | bestanden | bestanden |
| Vitest | 51 Dateien, 633 Tests bestanden | bestanden |
| build | bestanden | bestanden |
| Playwright (Chromium, Firefox, WebKit) | 341 bestanden, 1 fehlgeschlagen (Befund 2) | 342 bestanden |

## Ursache der gescheiterten Python-Schritte (U1): Umgebung, nicht Commit

In `packages/domain-core/.venv/bin` und `components/pipwerk-studio/backend/.venv/bin` haben `pytest`, `mypy`, `py.test` und die übrigen Programme den Dateimodus 644 statt 755. `uv run` findet dort kein ausführbares Programm und nimmt das auf dem Rechner (pytest 9.0.2 mit typeguard, eigenes mypy) mit Systempython. Folge: `ModuleNotFoundError: No module named 'pipwerk_domain'` und `'fastapi'`, mypy „Cannot find module pydantic“. Dieselbe Rechteänderung wie bei `check` und `testenv`. Nach `chmod +x` auf `bin/*` der beiden `.venv` (nicht versioniert, `.venv/` ist ignoriert) liefen die Schritte (Lauf 2). Der Commit enthält keine Ursache dafür.

## Befunde

1. **blockierend** – `components/pipwerk-studio/backend/tests/test_frontend_type_copy.py::test_the_copy_of_the_user_interface_equals_the_answer_of_the_backend` scheitert. Der Commit ändert `frontend/src/testing/element-types.json` (Texte „Verwaltung“ → „Order- und Positionsverwaltung“, de und en; Beschreibungen von „Order aufgeben“, „Order löschen“, Eigenschaft `Order` u. a.). Das Backend liefert die alten Texte (Auftrag 15 fehlt im Commit). Kopie und Antwort sind verschieden, Prüfskript Schritt „backend: pytest“ endet mit Fehler. Abnahmekriterium 1 (Prüfskript/Tests) ist so nicht erfüllt, auch wenn die Texte selbst nicht Gegenstand sind.
2. nicht blockierend – Playwright, Chromium, Lauf 1: `e2e/testcases.spec.ts:290` (str-01) fällt aus, Zeitüberschreitung in `e2e/support.ts:80` (`openList`, aufgerufen aus `builder.ts:94` `setCond`). Lauf 2 besteht, Firefox und WebKit bestehen. Die Hilfsfunktion öffnet die Liste mehrfach neu, mit dem Kommentar, die Oberfläche zeichne das Feld nach der Antwort des Backends neu und die Liste sei dann weg. Das deutet auf ein Steuerelement hin, das beim Neuzeichnen zuklappt (Zufallsausfall, Ursache nicht belegt).
3. nicht blockierend – `src/styles.css:1243` enthält noch die Regel `.react-flow__attribution`, und zwei Tests (`App.canvas.test.tsx:124`, `e2e/surface.spec.ts:188`) nennen die Klasse. Der Hinweis ist mit `hideAttribution` abgeschaltet; die Regel ist ohne Wirkung. Suche nach „React Flow“ in Texten der Oberfläche: nichts.
4. Hinweis, kein Mangel – `convertCondition` (`expression/blocks.ts:282`): Beim Wechsel der Art wird die bisherige Bedingung durch eine neue leere der gewählten Art ersetzt (nur „und“ ↔ „oder“ behält die Teile). Vorher blieb die Bedingung als Teil erhalten. Spezifikation 3.4 und 5.4 legen den Umgang mit der bisherigen Bedingung nicht fest; der Mangel E13 (Erklärung angehängt statt ersetzt) ist damit behoben und mit Test (`blocks.test.ts:135`, `surface.spec.ts:75`) in beide Richtungen belegt. Der Verlust bereits eingegebener Werte ohne Rückfrage ist Verhalten, das der Auftrag nicht verlangt; Entscheidung beim Auftraggeber.

## Prüfung der Punkte 1 bis 10

- 1 (E1): Suche „Verwaltung“ ohne „Order- und Positionsverwaltung“ in `src`, `e2e`: nichts (nur Wörterliste in `locales.test.ts`). Test `locales.test.ts`, `surface.spec.ts`. Erfüllt.
- 2 (E2): `PropertiesPanel.tsx` rollt zu `sec-findings`; Test in `surface.spec.ts` in allen Größen bestanden. Erfüllt.
- 3 (E4): keine `<select>`, `<datalist>` im Code; `ui/controls.tsx` `Select` mit Pfeiltasten, Home/End, Enter, Leertaste, Escape, Tippsuche, `role=combobox`/`listbox`, `aria-label`, volle Breite unter 1100 px; `choices.spec.ts`, `Select.test.tsx` bestanden. Erfüllt.
- 4 (E9, E6): Verzeichnis `src/wizard`, Zustand, Texte, Stile und Tests entfernt; Suche „Assistent“, „wizard“ in `src`, `e2e`, `docs/technical/pipwerk-studio.md`: nur die Erklärung des Wegfalls in Abschnitt „Kein geführter Aufbau“ (Zeile 147). Erfüllt.
- 5 (E13): siehe Befund 4. Erfüllt.
- 6 (B1): „Neue Strategie“ ruft `checkAfterOpen` auf. Erfüllt (`workflows.spec.ts`).
- 7 (B2), 8 (B3), 9 (B4): Tests in `surface.spec.ts`/`workflows.spec.ts` bestanden. B3 mit Befund 3.
- 10: Vitest und Playwright laufen ohne übersprungene oder deaktivierte Tests (Lauf 2: 342 bestanden, keine übersprungenen).
- Kriterium 3: kein fester Pfad, Port oder Rechnername in `src` gefunden.
- Technische Dokumentation `docs/technical/pipwerk-studio.md` ist angepasst (Abschnitte zu Bedingungen, Wegfall des Assistenten, Tests).
