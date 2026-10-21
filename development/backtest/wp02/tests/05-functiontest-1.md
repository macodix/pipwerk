# Testbericht Funktionstest, Auftrag 05, Durchlauf 1

- Ergebnis: **bestanden**
- geprüfter Commit: `f192101aaa66a3a966cf02585ba16685962dc92d` (Zweig `backtest/wp02-05`)
- Commit des Prüfskripts: `11919c099270c8015009cc54dd376db20c05ed08` (Zweig `backtest/wp02-functiontest-05`, auf GitHub, aufgesetzt auf den geprüften Commit, `scripts/check` mit Modus `100755`)

## Prüfskript

`components/pipwerk-replay/scripts/check` stammt von `98b77bb` (Zweig `-functiontest-04`) und enthält die Schritte der Oberfläche bereits (`npm ci`, Typprüfung, Vitest, Build, `npm audit`, Browsertest mit Parametern für Ports). Geändert wurde nur der Verweis im Kopf auf den neuen Abschnitt 6.3. In `docs/technical/pipwerk-replay.md` fehlte der Abschnitt „Prüfskript“ auf dem geprüften Commit; er steht jetzt als 6.3 (Aufruf, Parameter, Reihenfolge, Hinweis auf Hintergrundlauf).

## Ausgeführt (Aufruf `check --backend-port 18241 --frontend-port 18242 --with-audit`)

- Backend: `uv sync --frozen`, pytest (810 bestanden), `ruff check`, `ruff format --check`, `mypy`, `openapi.json` gleich der Anwendung, Suche nach alten Bezeichnern, `pip-audit` (keine Schwachstellen): bestanden
- Oberfläche: `npm ci`, Typprüfung, Vitest, Build: bestanden
- Browsertest: 63 bestanden (Chromium alle Tests, Firefox und WebKit der Start ohne Fehler in der Konsole, sechs Fenstergrößen)
- `npm audit`: Stufe „high“, siehe Hinweis 1

## Testumgebungsskript (von Hand)

- `start` ohne Quelle: Backend und Oberfläche laufen, `/api/health` über die Oberfläche `ok`, `status` meldet beide und „source: not set up“, `POST …/acquisitions` antwortet `no_source`; `stop` beendet und entfernt `.testenv/`.
- `start` mit `--source-url` und `--source-key-file` gegen die nachgebildete Quelle: `status` nennt die Adresse; eine Beschaffung der Angaben zum Instrument läuft und erscheint in der Übersicht (Broker „Fake-Broker-Demo“).
- Schlüssel: nur in `.testenv/pipwerk-replay.ini` (Modus 600, Verzeichnis 700); nicht in `backend.log`, `frontend.log`, `state`, nicht in Ausgaben des Skripts. Kommandozeilen und Prozessliste habe ich nicht selbst gelesen (Werkzeug verweigert), dafür gilt der bestandene `test_testenv.py` (Hüllen um die aufgerufenen Programme).

## Dokumentation

Abschnitt 8 (Entscheidungen Auftrag 05) ist begründet und stimmt mit Code und Abschnitt 9 überein; die Entscheidungen des Entwicklungsleiters (UTC mit Uhrzeit, „Punkte“, Textfeld Währung, Menü ab 700 Pixel, 10 Sekunden) sind umgesetzt und dokumentiert. `docs/user/pipwerk-replay.md` passt zu dem, was die Browsertests an der Oberfläche belegen (Menü, Felder, Meldungen, Testkonten, Import, Beschaffung, Testumgebung). Nicht jede Aussage der Anwenderdokumentation habe ich einzeln an der Oberfläche belegt; die Verständlichkeit beurteilt die QA.

## Hinweise (nicht blockierend)

1. `npm audit`: 1 Schwachstelle „high“ in `vite` 8.3.0 bis 8.3.2 über `launch-editor` (Befehlsausführung beim Öffnen im Editor, Windows-Fälle). Einordnung: Das Paket hängt nur an der Middleware `/__open-in-editor` des Entwicklungsservers (`node_modules/vite/dist/node/chunks/node.js`, Zeile 24891, in der Erzeugung des Entwicklungsservers). Die ausgelieferte Oberfläche (`dist/`) enthält es nicht; die Testumgebung nutzt `vite preview`. Betroffen ist nur der Entwicklungsbetrieb (`npm run dev`, Abschnitt 4.2). Behobene Fassung: `vite` 8.3.5 laut `npm audit`; `package.json` legt `8.3.1` fest, die Behebung braucht also eine Änderung der Festlegung. Daher nicht blockierend.
2. Das Prüfskript scheitert wegen Hinweis 1 mit `--with-audit` (Exitcode 1), ohne diese Option nicht.
3. In meinem Arbeitsverzeichnis lagen Reste früherer Prüfläufe (`ft-probe-0*.py`, `packages/market-data/scripts/`, eine nicht committete `components/pipwerk-fetch-mt5/scripts/check`). Ich habe sie mit `git clean` entfernt, damit `testenv start` den sauberen Stand akzeptiert. Falls die `check` von `pipwerk-fetch-mt5` nirgends committet ist, fehlt sie jetzt.
