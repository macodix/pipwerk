# Testbericht Funktionstest, Auftrag 12, Durchlauf 1

- Ergebnis: **bestanden**
- Geprüfter Commit: `200efe1f8b577da6265da5c4bbbcd00eb45f6f14` (Zweig `backtest/wp02-12`), ausgecheckt und kontrolliert.
- Commit des Prüfskripts: `f53124a9261a9d1fcd1728d3b314b160ae91b039` (Zweig `backtest/wp02-functiontest-12`, auf GitHub). Änderung gegenüber dem geprüften Commit: neuer Schritt „backend: no acquisition and no source“ in `components/pipwerk-replay/scripts/check`. Das Skript auf `backtest/wp02-functiontest-05` unterscheidet sich im Skript `check` nicht vom geprüften Commit.

## Durchgeführt

- `scripts/check --backend-port 18801 --frontend-port 18802 --with-audit` (Stand vor dem neuen Schritt): Backend vollständig bestanden. Das sind `uv sync --frozen`, pytest (752 bestanden), `ruff check`, `ruff format --check`, mypy, Vertrag `openapi.json` gleich der Anwendung, Suche nach alten Namen und pip-audit. Vitest (275) und Build der Oberfläche bestanden.
- Der neue Schritt lief nicht im Gesamtlauf. Seine Suche allein habe ich per `git grep` ausgeführt: keine Treffer. Die Schritte danach habe ich nicht erneut gelaufen.
- Browsertest: scheitert, alle 63 Tests (Chromium). `e2e/stack.ts:114` startet `pipwerk_fetch_mt5.fake_source`, das aus der Entwicklungsgruppe entfallen ist. Das ist von der Oberfläche erwartet (Auftrag 14) und kein Befund zu diesem Auftrag.
- Eigene Probeläufe gegen ein frisches Backend (curl, SQLite):
  - Vorschau (JSON mit Broker; CSV nur nach Dateiname; Name `../../etc/…` ergibt nur den letzten Teil).
  - Import mehrerer Dateien mit einer abgelehnten Datei (`header_invalid`), CSV ohne Instrument (`series_invalid`), unbekannte Zeitzone (`timezone_unknown`), Name mit `..\`.
  - Liste mit Filter (ohne Beachtung der Schreibweise), Seiten und Gesamtzahl; unbekannte Daten-Kennung ergibt eine leere Liste; `limit=1001` und `offset=-1` ergeben 422.
  - Einzelheiten: Lücken, `contract: null`; `data=H1` (Großschreibung) und unbekannte Kennung ergeben 404 in Händlersprache, kein Serverfehler.
  - Brokerliste; Broker für Testläufe (Rückfall auf den ersten Broker, `chosen:false`); Setzen auf einen unbekannten Broker ergibt 422 `broker_not_in_data_stock`.
  - Formularfehler: fehlender Broker (422), fremdes Feld (422), `instrument` mit falscher Zahl (422), kein `multipart` (415), keine Datei (422), `Origin` fremd (403).
  - Grenzen mit kleiner Konfiguration (Dateien 2, je Datei 1024 Byte): drei Dateien ergeben 413 `too_many_files`; die zu große Datei wird einzeln abgelehnt (`too_large`), die übrige importiert.
  - Eine Startkonfiguration mit `[source]` startet ohne Fehler.
- Herkunftsprüfung hinter dem Proxy: Backend und `vite preview` (Proxy ohne `changeOrigin`, `vite.config.ts:16`) auf getrennten Ports. Eine Anfrage über den Oberflächenport mit passendem `Origin` ergibt 200. Eine Anfrage mit abweichendem Namen (`localhost` gegen `127.0.0.1`) ergibt 403, wie vorgesehen. Der Betrieb wird nicht verhindert.
- Code gelesen: `marketdata_api.py`, `import_form.py`, `marketdata_service.py`, `internal_api.py`, `body_limit.py`, `pyproject.toml`, Migration `v0003`, `scripts/testenv`. Dokumentation gegen Code verglichen: `docs/technical/pipwerk-replay.md` (2.7 bis 2.9, 4a, 5, 6), Glossar (Beschaffung, Quelle, Standardquelle und Änderungsnachweis; „Broker für Testläufe“ nur gesucht, nicht abgeglichen), `contracts/api/README.md`.
- Beschaffung vollständig entfallen: `acquisition.py` fehlt; `pyproject.toml`, `uv.lock`, `pipwerk-replay.example.ini` und Quelltext haben keine Quelle und keine Abhängigkeit auf `pipwerk-fetch-mt5`. `httpx2` steht nur noch in der Entwicklungsgruppe. Reste stehen nur in Migration `v0002`/`v0003`, Tests und `config.py` (Hinweis auf die alte Konfiguration), wie dokumentiert.
- Testumgebungsskript: `status` (Exitcode 1, „not running“), unbekannter Befehl (Usage, 2). `start` verweigert korrekt bei uncommitted/ungetrackten Dateien. Ein vollständiger Lauf von `start` war in meinem Arbeitsverzeichnis nicht möglich (siehe Hinweis 1). Ersatzweise habe ich Backend und `vite preview` von Hand gestartet (siehe oben). Der Quelltext von `testenv` enthält keine Parameter und keinen Code für eine Quelle mehr.

## Befunde

Blockierende Befunde: keine.

Hinweise (verhindern das Bestehen nicht):

1. Im Arbeitsverzeichnis `functiontest` liegt die ungetrackte Datei `probe_ft11.py` (mein Wegwerfskript aus Auftrag 11, das Löschen wird verweigert). Sie verhindert `testenv start` dort; dessen Ablauf `start`/`stop` ist deshalb nicht in einem Stück durchgespielt worden.
2. `docs/technical/pipwerk-replay.md:551`: „Das Testumgebungsskript … verlangt `--source-url` und `--source-key-file` zusammen“ ist veraltet und widerspricht Zeile 302 und 2.9.
3. `components/pipwerk-replay/README.md:55` und `docs/technical/pipwerk-replay.md:466,468`: nennen noch `PIPWERK_REPLAY_E2E_SOURCE_PORT` und die nachgebildete Quelle (Browsertests, bis Auftrag 14 dokumentiert).
4. `marketdata_api.py` (Liste, Einzelheiten): Fehler in der Abfrage (`limit=1001`, `offset=-1`) melden `detail` mit „The request body does not fit the schema.“ oder „The request is invalid.“ (je Pfad verschieden), obwohl es keine Anfrage mit Textkörper ist. Die Meldung ist uneinheitlich.
5. `npm audit` (mit `--with-audit`) meldet 3 Schwachstellen in `vite` (Oberfläche, unverändert in diesem Auftrag); gehört zu Auftrag 14.
6. Unter `reports/` liegen meine Wegwerfdateien `ft-replay.ini`, `ft-replay.db`, `ft12/` (nicht im Repository).
