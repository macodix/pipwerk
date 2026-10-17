# Testbericht Tester Funktion – Auftrag 03, Durchlauf 2 (Nachprüfung)

- Bezug: `strategiedesign/wp01`, Auftrag `development/strategiedesign/wp01/orders/03.md`, Abschnitt „Festlegungen nach Durchlauf 1“
- Übergabedokument: `strategiedesign/wp01:development/strategiedesign/wp01/tests/03-2-order.md`
- geprüfter Commit: `9e5bd7bd73baf3bc1b5898b36f2b56da0f238762` (Zweig `strategiedesign/wp01-03`), vor der Prüfung mit `git rev-parse HEAD` im eigenen Arbeitsverzeichnis bestätigt
- vorher geprüfter Commit: `d91f5f8abc5e9ea4155494505e9cbebb84846d3c` (Bericht `tests/03-functiontest-1.md`)
- Prüfskript: `components/pipwerk-studio/scripts/check` im Commit `f7e234cb3e5dd34e0934f6e9b817dc353c247d52` auf Zweig `strategiedesign/wp01-functiontest` (nach GitHub übertragen). Der Zweig ist wie verlangt auf dem geprüften Commit neu aufgesetzt (`git rebase --onto 9e5bd7b d91f5f8`, ohne Konflikt): `9f43764`, `c4b9625` und `f7e234c` sind die bisherigen Commits `8bb4ab0`, `d709bd4` und `e9d40a8`. Sie ändern nur das Prüfskript und Abschnitt 6.4 von `docs/technical/pipwerk-studio.md` (`git diff --stat 9e5bd7b f7e234c`: 2 Dateien). Inhaltlich war keine weitere Änderung am Prüfskript nötig.
- Datum: 2026-10-17

## Ergebnis: bestanden

Die blockierenden Befunde B1 und B2 aus Durchlauf 1 sind behoben. Die Punkte 1 bis 6 der Festlegungen sind umgesetzt, soweit sie zum Funktionstest gehören. Ich habe keinen neuen blockierenden Befund gefunden. Das Prüfskript besteht bis auf den bekannten Altbefund von `npm audit` (H1). Die Abnahmekriterien 1 bis 7 von `wp01` sind über `/docs` und die Web-API in einer eigenen Testumgebung weiter erfüllt. Die Oberfläche arbeitet über ihren Proxy weiter.

## Befunde (blockierend)

Keine.

## Vorherige Befunde

### B1 Ungültig gespeichertes Objektverzeichnis – behoben

- Code: `web_api.py` `_guarded` fängt `StoredObjectDirectoryInvalidError` und antwortet mit 503 und `STORED_OBJECT_DIRECTORY_INVALID_TEXT`. Die Konstante liegt jetzt in `web_api.py`; `app.py` nimmt sie von dort. Der interne Endpunkt antwortet also mit demselben Text. Die Fehlerantworten 503 sind für Auflisten, Lesen, Löschen und `usages` in der Beschreibung ergänzt. `contracts/api/pipwerk-studio/v1/openapi.json` ist neu erzeugt; `tests/test_contract.py` besteht.
- Test: `tests/test_web_api_invalid_directory.py` prüft alle fünf Arten mit Auflisten, Lesen, Anlegen, Ersetzen, Löschen und `usages` (je 503, fester Text, `application/json`, kein Pfad, kein Ausnahmetext). Weitere Fälle: gleiche Antwort wie der interne Endpunkt, `usages` der mitgelieferten Vorlage, unberührte Endpunkte, Reparatur durch Speichern der Einstellung, Protokoll ohne Wert.
- Eigene Probe am laufenden Backend der Testumgebung: Wert in `studio_settings.object_directory` per SQL auf `relative` gesetzt (1 Zeile). Ergebnisse:
  - 503, `application/json`, `{"detail":"The stored pipwerk Studio object directory is invalid."}` bei `GET /api/studio/settings/object-directory`, `GET /api/v1/strategies`, `GET /api/v1/trends`, `GET`, `PUT`, `DELETE /api/v1/strategies/{id}`, `POST /api/v1/strategies` und `GET /api/v1/rules/7c1d4e2a-…/usages`.
  - 200 bei `GET /api/v1/rules/7c1d4e2a-…`, `GET /api/v1/element-types` und `POST /api/v1/check`.
  - Das Protokoll des Backends enthält „The stored pipwerk Studio object directory is not an absolute path.“ und nicht den Wert `relative`.
- Dokumentation: Abschnitt 2.9 (Punkt „Fehler des Verzeichnisses“) und 5.2 (neue Zeile 503 in der Fehlertabelle) nennen den Fall. Beide stimmen mit dem Verhalten überein.

### B2 Abschnitt 7.1, Kopplung von FastAPI – behoben

Die Zeile `fastapi` nennt jetzt `app.py`, `web_api.py`, `body_limit.py`, `host_check.py` und `docs_page.py` und Starlette 1.7.0 für die Middleware. Nachweis: `grep` nach `from fastapi`/`from starlette` unter `backend/src/pipwerk_studio` findet genau diese fünf Module. Starlette importieren nur `body_limit.py` und `host_check.py`, wie angegeben.

### Hinweise aus Durchlauf 1

- H2 (Erweiterungen der Bibliothek): durch Festlegung 1 angenommen, kein Befund.
- H3 (Abschnitt 6.1, `pip-audit`): Der Satz beschreibt jetzt das geprüfte Verhalten und den Schalter im Prüfskript. Er stimmt mit dem Prüfskript (`f7e234c`) und Abschnitt 6.4 überein.
- H4 (Sperre der Ablage doppelt in Abschnitt 9): erledigt, ein Eintrag.
- H5 („binden“): erledigt, Abschnitt 1 schreibt „bindet“.
- H7 (Anwenderdokumentation zu `/docs`): erledigt. „Web-API ausprobieren“ nennt Swagger UI 5.33.1 von `cdn.jsdelivr.net`, die Prüfsumme und die leere Seite ohne Internet.
- H1 und H6 bleiben Hinweise (Festlegung 6), siehe unten. H8 betraf nur die Angabe des Entwicklers. Diesmal stimmt sie: 647 Tests im Backend, 975 Tests in der Bibliothek.

## Festlegungen nach Durchlauf 1

1. Erweiterungen der Bibliothek: angenommen. Die Bibliothek ist in diesem Commit nicht weiter geändert (`git diff --stat d91f5f8 9e5bd7b` nennt keine Datei unter `packages/`).
2. Ungültiges Objektverzeichnis: erfüllt, siehe B1.
3. Prüfung des Kopfs `Host`: erfüllt.
   - Code: `host_check.py` ist die zuletzt hinzugefügte und damit äußerste eigene Middleware in `app.py`. Voreinstellung `127.0.0.1`, `localhost`, `::1`. Weitere Namen kommen aus `[server] allowed_hosts` (`config.py`), aus `--allowed-host` (`cli.py`) und aus `create_app(…, allowed_hosts=…)`. Ungültige Einträge lassen den Start mit Exitcode 1 scheitern. Kein fester Name im Code außer der dokumentierten Voreinstellung.
   - `scripts/testenv` übergibt `--allowed-host <Wert von --host>`, nur wenn `--host` angegeben ist, und bei `0.0.0.0` und `::` zusätzlich `*ip`.
   - Tests: `tests/test_host_check.py` deckt alle Fälle der Festlegung ab: erlaubter und fremder Name, mit und ohne Port, IPv6 in Klammern, fehlender Kopf, dazu doppelter Kopf, Großschreibung, abschließender Punkt, `*ip`, Startkonfiguration und Aufrufparameter. `tests/test_testenv.py` prüft die an das Backend übergebenen Argumente für sechs Fälle und den durchgelassenen Kopf der Oberfläche. Der Browsertest läuft über den Proxy von `vite preview` mit `changeOrigin: false` (`frontend/vite.config.ts` Zeile 15) gegen ein Backend mit Voreinstellung und besteht.
   - Eigene Probe am Backend der Testumgebung (`Host` von Hand gesetzt):
     - 200 für `127.0.0.1:<Port>`, `127.0.0.1`, `localhost:<Port>`, `[::1]:<Port>`, `LOCALHOST` und `localhost.`.
     - 400 mit festem Text für `rebind.example:<Port>`, `127.0.0.2`, `testserver`, `::1` (ohne Klammern), leeren Kopf, `localhost:<Port>:1` und `[::1`.
     - `POST /api/v1/strategies` und `/docs` mit fremdem Namen: 400; danach liegt keine Datei im Objektverzeichnis.
     - Über den Port der Oberfläche: `localhost:<Port>` ergibt 200; ein fremder Name wird schon von `vite preview` mit 403 abgewiesen.
   - Dokumentation: Abschnitte 2.2, 2.10, 4a (Schritt 5 und „Aufruf von anderen Rechnern“), 5.2, 6.1 und 8 (Maßnahme 4 berichtigt, Maßnahme 7 neu) stimmen mit dem Code überein. `pipwerk-studio.example.ini` nennt den Abschnitt `[server]`.
4. `/docs` ohne ungeprüften fremden Code: erfüllt, soweit im Funktionstest prüfbar.
   - Code: `docs_page.py` setzt Version `5.33.1`, Adressen und Prüfsummen als Konstanten. `app.py` erzeugt die Anwendung mit `docs_url=None` und `redoc_url=None`.
   - Ausgelieferte Seite in der Testumgebung:
     - genau zwei `https://`-Adressen, beide unter `swagger-ui-dist@5.33.1`;
     - zwei Attribute `integrity` mit den Werten aus Abschnitt 2.11 und `crossorigin="anonymous"`;
     - Symbol `data:,`; weder `fastapi.tiangolo.com` noch `@5/`;
     - `/redoc` antwortet mit 404.
   - Tests: `tests/test_docs_page.py` prüft die Seite und dass die Dokumentation Version und Prüfsummen nennt.
   - Dokumentation: Abschnitt 2.11 nennt Herkunft, Risiko und Grenze; Abschnitt 8 Maßnahme 8 verweist darauf. Abschnitt 4a und die Anwenderdokumentation nennen das Laden aus dem Internet.
   - Die Übereinstimmung der Prüfsummen mit den veröffentlichten Dateien habe ich nicht nachgerechnet, siehe „Nicht geprüft“.
5. Abschnitt 7.1: erfüllt, siehe B2.
6. Hinweise H3, H4, H5: erledigt, siehe oben.

## Hinweise (nicht blockierend)

- H1 `npm audit` scheitert mit dem bekannten Befund `source-map-js` (GHSA-68fv-2mgg-jv7q). Er ist unverändert seit dem Ausgangsstand und in Abschnitt 7 und 9 der technischen Dokumentation genannt. Das Prüfskript endet deshalb mit Exitcode 1.
- H6 (aus Durchlauf 1, unverändert): `PUT`/`DELETE` mit der Kennung von „Risiko je Trade“ unter einer anderen Art antworten mit 403, `GET` mit 404.
- H9 `components/pipwerk-studio/backend/src/pipwerk_studio/docs_page.py`, Docstring des Moduls, Zeile 18 bis 19: „see the technical documentation, section 8, for how to compute them again“. Wie die Prüfsummen berechnet werden, steht in Abschnitt 2.11 („Herkunft der Prüfsummen“). Abschnitt 8 verweist nur dorthin.
- H10 `docs/technical/pipwerk-studio.md` Abschnitt 8, Absatz „Öffentliche Web-API“: Die Maßnahmen stehen in der Reihenfolge (1), (2), (3), (4), (7), (8), (5), (6). Inhaltlich ist der Absatz richtig.

## Durchgeführte Prüfungen

### Prüfskript

Aufruf `…/components/pipwerk-studio/scripts/check --backend-port 28743 --frontend-port 28744 --with-audit` am Stand `f7e234c` (geprüfter Commit plus Prüfskript). Exitcode 1 wegen H1.

| Schritt | Ergebnis |
|---|---|
| library: uv sync --frozen | bestanden |
| library: pytest | bestanden, 975 Tests |
| library: ruff check, ruff format --check, mypy | bestanden |
| library: Schemata gleich `contracts/strategies/v1` | bestanden |
| library: pip-audit | bestanden, „No known vulnerabilities found“ |
| backend: uv sync --frozen | bestanden |
| backend: pytest | bestanden, 647 Tests |
| backend: ruff check, ruff format --check, mypy | bestanden |
| Suche nach der Schreibweise des Namens | bestanden, 453 Treffer |
| backend: pip-audit (ohne `pipwerk-domain`) | bestanden, „No known vulnerabilities found“ |
| frontend: npm ci, typecheck, Vitest (244 Tests), build | bestanden |
| frontend: npm audit | nicht bestanden, Altbefund H1 |
| Browsertest Chromium, Firefox, WebKit | bestanden, 39 bestanden, 6 übersprungen (Fälle ohne Git-Arbeitsbereich, wie bisher) |

Technisches Abnahmekriterium 1 des Auftrags ist erfüllt.

### Abnahmekriterien von `wp01` in der Testumgebung

Die Testumgebung lief auf dem geprüften Commit `9e5bd7b` (losgelöst ausgecheckt, `git status` leer). Aufruf: `testenv start --frontend-port 28745 --backend-port 28746`, danach `testenv stop`; `testenv status` meldet „not running“, `git status` ist leer. Die Abfragen liefen über HTTP mit Python aus der Umgebung des Backends.

1. Erfüllt.
   - Seite der Oberfläche: 200 `text/html`.
   - Über den Port der Oberfläche (Proxy): `/api/health` ergibt `{"status":"ok"}`, auch mit `Host: localhost:<Port>`. Die Sprache ließ sich lesen und schreiben (`en`, zurück `de`). `/api/studio/revision` nennt `9e5bd7bd73baf3bc1b5898b36f2b56da0f238762`. Objektverzeichnis `…/.testenv/objects` (`is_default` falsch). `/api/v1/element-types` über den Proxy ergibt 200.
2. Erfüllt. `/docs` ergibt 200 und lädt Swagger UI in der Version 5.33.1 mit `integrity`. `/openapi.json` enthält alle Pfade aus 4.2 mit genau den Methoden der Tabelle und die internen Endpunkte. Titel „pipwerk Studio“.
3. Erfüllt.
   - 30 Typen, jeder mit Namen in Deutsch und Englisch.
   - „Risiko je Trade“ mit Parameter `risikogrenze` (Prozent, Pflicht, 0.01), `determined_property` `volumen` und `comparison` `hoechstens`.
   - 15 Funktionen (`IF` bis `FALSE`).
4. Erfüllt. `POST` mit `str-01` und `str-03` ergibt je 201 mit leerer Liste der Befunde und neuer Kennung. `GET` liefert jeweils dasselbe Dokument bis auf Kennung und Zeitpunkt. Die Liste nennt beide. Im Objektverzeichnis liegen genau zwei Dateien `<id>.strategy.json`.
5. Erfüllt. `POST /api/v1/check` mit abgewandeltem `str-03` meldet:
   - ohne Auslöser: `strategy.no_trigger`;
   - Schreibfehler: `expression.invalid`, `syntax`, `start` 13, `end` 14, gefunden `*`;
   - unbekannter Name: `expression.invalid`, `unknown_name`, 0 bis 7;
   - Order im Hauptablauf: `expression.order_outside_management`;
   - Regel mit Order in einem Indikator: `rule.order_in_indicator`;
   - Order ändern außerhalb einer Verwaltung: `flow.management_only`;
   - unbekannter Elementtyp: `type.unknown`.

   `PUT` ohne Auslöser ergibt 200 mit `strategy.no_trigger`; danach liefert `GET` die geänderte Fassung.
6. Erfüllt. Ein zusätzliches Feld oben (`POST /api/v1/strategies`) und tief im Dokument (`POST /api/v1/check`) ergibt 422 mit Ort und `extra_forbidden`, ohne den Wert.
7. Erfüllt. Vorlage `Regel` angelegt (201) und geändert (200). Eine Instanz daraus wurde in `str-01` gespeichert. `usages` nennt diese Strategie mit `skipped_unreadable` 0. `DELETE` ergibt 204, danach ergibt `GET` 404. Die Strategie ist danach unverändert. „Risiko je Trade“: `GET` ergibt 200, `DELETE` ergibt 403.

### Code und Dokumentation

Gelesen: die Änderungen des Commits an `app.py`, `cli.py`, `config.py`, `web_api.py`, die neuen Module `host_check.py` und `docs_page.py`, `pyproject.toml` (Ausnahme `S104` nur für Tests, begründet), `pipwerk-studio.example.ini`, `scripts/testenv`, `tests/conftest.py`, die neuen Tests `test_host_check.py`, `test_docs_page.py`, `test_web_api_invalid_directory.py` und die Ergänzungen in `test_testenv.py`.

- Technisches Abnahmekriterium 3 (E2): Die neuen Module kennen keinen Element- oder Objekttyp.
- Technisches Abnahmekriterium 4: kein fester Pfad und kein Port im Code. Die einzigen festen Namen sind die dokumentierte Voreinstellung der Liste und die Adresse des Auslieferungsnetzes aus Festlegung 4.
- Dokumentation: `docs/technical/pipwerk-studio.md` Abschnitte 1, 2.2, 2.9, 2.10, 2.11, 4a, 5.2, 6.1, 7.1, 8 und 9 sowie `docs/user/pipwerk-studio.md` („Web-API ausprobieren“) stimmen mit dem Code überein, bis auf H9 und H10.
- Durch die Änderungen sind keine weiteren Stellen falsch geworden: Abschnitt 6.1 zum Test des Testumgebungsskripts („die INI nur `[database]` mit `url`“) gilt weiter, weil `testenv` die Namen als Aufrufparameter übergibt.

## Nicht geprüft

- Übereinstimmung der Prüfsummen in `docs_page.py` mit den Dateien von `swagger-ui-dist@5.33.1` auf `cdn.jsdelivr.net` und in der npm-Paketquelle sowie das Veröffentlichungsdatum 2026-10-01. Eigene Abfragen ins Internet waren in meiner Umgebung nicht zugelassen. Das Übergabedokument weist diese Prüfung dem Tester Sicherheit zu.
- Darstellung von `/docs` im Browser (kein Browser mit Internetzugang in meiner Umgebung). Geprüft sind die ausgelieferte Seite und `/openapi.json`.
- Start der Testumgebung mit `--host` außerhalb von `127.0.0.1`. Dieser Weg ist durch `tests/test_testenv.py` mit Platzhalterprogrammen abgedeckt, aber nicht mit laufenden Prozessen.
