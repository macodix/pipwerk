# Testbericht Tester Funktion – Auftrag 03, Durchlauf 1

- Bezug: `strategiedesign/wp01`, Auftrag `development/strategiedesign/wp01/orders/03.md`
- Übergabedokument: `strategiedesign/wp01:development/strategiedesign/wp01/tests/03-1-order.md`
- geprüfter Commit: `d91f5f8abc5e9ea4155494505e9cbebb84846d3c` (Zweig `strategiedesign/wp01-03`), vor der Prüfung mit `git rev-parse HEAD` im eigenen Arbeitsverzeichnis bestätigt
- Prüfskript: `components/pipwerk-studio/scripts/check` im Commit `e9d40a806f8efd66f66cb4c425cc50994e2f0ce7` auf Zweig `strategiedesign/wp01-functiontest` (nach GitHub übertragen). Der Zweig ist wie verlangt auf dem geprüften Commit neu aufgesetzt: `8bb4ab0` und `d709bd4` sind die bisherigen Commits `ebfd0ed` und `46788e3` (einziger Konflikt: Zeile `stand` im Dokumentstatus von `docs/technical/pipwerk-studio.md`, gelöst mit dem Datum des geprüften Commits `2026-10-17`), `e9d40a8` ist neu (siehe „Änderung am Prüfskript“). Die Commits ändern nur das Prüfskript und Abschnitt 6.4 der technischen Dokumentation.
- Datum: 2026-10-17

## Ergebnis: nicht bestanden

Zwei blockierende Befunde (B1, B2). Die Abnahmekriterien 1 bis 7 von `wp01` sind über die Web-API in der Testumgebung erfüllt, die Tests aus Auftrag Punkt 6 sind vorhanden und bestehen, das Prüfskript besteht bis auf den bekannten Altbefund von `npm audit` (H1).

## Befunde (blockierend)

### B1 Ungültig gespeichertes Objektverzeichnis: Endpunkte der Web-API antworten mit nicht dokumentiertem HTTP 500 ohne festen Text

- Fundstelle: `components/pipwerk-studio/backend/src/pipwerk_studio/web_api.py` Zeile 445 bis 470 (`_guarded` fängt `StoredObjectDirectoryInvalidError` nicht); die Ausnahme entsteht in `settings_service.py` Zeile 230 und kommt über `ObjectStore._directory()` (`object_store.py` Zeile 388, 433, 452, 468). Dokumentation: `docs/technical/pipwerk-studio.md` Abschnitt 2.9, Punkt „Fehler des Verzeichnisses“ (Zeile 259), und Abschnitt 5.2, Fehlertabelle (Zeile 440 bis 449).
- Sachverhalt: Steht in `studio_settings.object_directory` ein nicht absoluter Wert (händisch geänderte Datenbank, der in Abschnitt 2.8 beschriebene Fall), antworten Auflisten, Lesen, Anlegen, Ersetzen und Löschen unter `/api/v1/<art>` und `GET /api/v1/<art>/{id}/usages` mit HTTP 500, Medientyp `text/plain` und dem Text `Internal Server Error`. Der interne Endpunkt `GET /api/studio/settings/object-directory` meldet denselben Zustand mit HTTP 503 und festem JSON-Text. Die Fehlertabelle in 5.2 sagt „Die Fehlertexte sind fest“ und nennt diesen Fall nicht; 2.9 nennt als Fehler des Verzeichnisses nur `ObjectDirectoryMissingError`, `ObjectDirectoryUnreadableError` und `ObjectWriteFailedError`. Code und Dokumentation stimmen nicht überein (technisches Abnahmekriterium 5 des Auftrags); Auftrag Punkt 2 und 4 verlangen feste Fehlertexte. Ein Test für diesen Fall fehlt. Es ist derselbe Fall wie Befund B2 aus Auftrag 02, Durchlauf 1, jetzt an den neuen Endpunkten.
- Nachweis (eigene Probe mit `TestClient(app, raise_server_exceptions=False)`, temporäre SQLite-Datei, nach einem gültigen Schreiben des Objektverzeichnisses Wert per SQL auf `relative` gesetzt, 1 Zeile geändert): `GET /api/studio/settings/object-directory` → 503 JSON; `GET /api/v1/strategies`, `GET /api/v1/strategies/{id}`, `POST /api/v1/strategies`, `PUT /api/v1/strategies/{id}`, `DELETE /api/v1/strategies/{id}`, `GET /api/v1/rules/7c1d4e2a-…/usages` → jeweils 500 `text/plain; charset=utf-8` `Internal Server Error`. Unberührt: `GET /api/v1/rules/7c1d4e2a-…` (mitgelieferte Vorlage) → 200, `POST /api/v1/check` → 200, `GET /api/v1/element-types` → 200.

### B2 Abschnitt 7.1 der technischen Dokumentation nennt FastAPI nur in `app.py`

- Fundstelle: `docs/technical/pipwerk-studio.md` Abschnitt 7.1, Zeile 636: `| fastapi | … | HTTP-Schnittstelle des Backends | nur in `app.py`; keine Fachlogik |`.
- Sachverhalt: Mit diesem Auftrag verwenden auch `web_api.py` (FastAPI) und `body_limit.py` (FastAPI und Starlette) das Paket; `git grep` nach Importen von `fastapi` und `starlette` unter `backend/src/pipwerk_studio` findet `app.py`, `web_api.py` und `body_limit.py`. Die Spalte „Kopplung“ ist dadurch falsch geworden. Auftrag Punkt 7 verlangt die Berichtigung aller Stellen, die durch die Änderung falsch werden (Hinweis S22), technisches Abnahmekriterium 5 die Übereinstimmung mit dem Code. Die Zeile zu Pydantic darunter ist dagegen angepasst.

## Hinweise (nicht blockierend)

- H1 `npm audit` (Schritt des Prüfskripts mit `--with-audit`) scheitert mit dem bekannten Befund `source-map-js` 1.2.1 (GHSA-68fv-2mgg-jv7q), unverändert seit dem Ausgangsstand und in Abschnitt 7 und 9 der technischen Dokumentation genannt. Das Prüfskript endet deshalb mit Exitcode 1.
- H2 Änderungen an der Bibliothek: Auftrag 03, Nicht-Umfang, schließt Änderungen an der Bibliothek außer zur Behebung eines Fehlers aus. Der Entwickler nennt die Änderungen selbst als Erweiterungen (`NameOccurrence`, `NameSegment`, `ExpressionNames`, `CheckResult`, `check_strategy_with_names`, `check_template_with_names`, `MAX_NAMES_PER_CHECK`, Parameter `collect_names`, `builtin_templates()`, `py.typed`). Sie sind nötig, damit `/api/v1/check` die erkannten Namen liefert (Spezifikation 4.2, 5.3) und das Backend keine einzelne Vorlage kennt (E2); sie sind getestet (`packages/domain-core/tests/test_check_names.py`) und dokumentiert (`docs/technical/pipwerk-domain.md` Abschnitte 2, 5.1, 9.3, 11, 12). Benötigte Entscheidung: ob diese Erweiterungen trotz Nicht-Umfang angenommen werden. Zuständig: Softwarearchitekt.
- H3 `docs/technical/pipwerk-studio.md` Abschnitt 6.1, Zeile 536: „Ob `pip-audit` an dieser Zeile … scheitert, ist nicht geprüft“. Jetzt geprüft: Ohne `--no-emit-package pipwerk-domain` scheitert `pip-audit` nicht, sondern überspringt die Zeile mit „-e -/-/-/packages/domain-core could not deduce package version from URL requirement“ und meldet für die übrigen Pakete „No known vulnerabilities found“ (erster Lauf des Prüfskripts, Stand `d709bd4`). Mit dem Schalter (Stand `e9d40a8`) entfällt die Zeile, Ergebnis ebenfalls „No known vulnerabilities found“.
- H4 Abschnitt 9 nennt die Sperre der Ablage zweimal (Zeile 690 und 693).
- H5 Abschnitt 1, Zeile 13: „Mit Auftrag 03 binden das Backend …“ statt „bindet“.
- H6 `PUT` und `DELETE` mit der Kennung von „Risiko je Trade“ unter einer anderen Art (zum Beispiel `/api/v1/strategies/7c1d4e2a-…`) antworten mit 403, `GET` unter derselben Adresse mit 404. Die Fehlertabelle in 5.2 deckt beides, das Verhalten ist aber uneinheitlich.
- H7 Die Anwenderdokumentation (`docs/user/pipwerk-studio.md`, „Web-API ausprobieren“) sagt nicht, dass `/docs` Swagger UI aus dem Internet lädt und ohne Zugang dorthin leer bleibt; die technische Dokumentation (Abschnitt 4a) sagt es. Nachweis: Die Seite `/docs` des Backends der Testumgebung verweist auf `https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/…`.
- H8 Angabe des Entwicklers „Backend: 531 Tests“: In beiden Läufen des Prüfskripts liefen 532 Tests des Backends, alle bestanden.

## Durchgeführte Prüfungen

### Prüfskript

Aufruf zweimal mit `--backend-port 28743 --frontend-port 28744 --with-audit`: erster Lauf am Stand `d709bd4` (Prüfskript vor der Änderung), zweiter Lauf am Stand `e9d40a8` (maßgeblich). Beide Stände enthalten den geprüften Commit unverändert; sie ändern nur das Prüfskript und Abschnitt 6.4. Exitcode jeweils 1 wegen H1.

| Schritt | Ergebnis (Lauf am Stand `e9d40a8`) |
|---|---|
| library: uv sync --frozen | bestanden |
| library: pytest | bestanden, 975 Tests |
| library: ruff check, ruff format --check, mypy | bestanden |
| library: Schemata gleich `contracts/strategies/v1` | bestanden |
| library: pip-audit | bestanden, keine bekannten Sicherheitslücken |
| backend: uv sync --frozen | bestanden |
| backend: pytest | bestanden, 532 Tests |
| backend: ruff check, ruff format --check, mypy | bestanden |
| Suche nach der Schreibweise des Namens | bestanden, 447 Treffer |
| backend: pip-audit (ohne `pipwerk-domain`) | bestanden, keine bekannten Sicherheitslücken |
| frontend: npm ci, typecheck, Vitest (244 Tests), build | bestanden |
| frontend: npm audit | nicht bestanden, Altbefund H1 |
| Browsertest Chromium, Firefox, WebKit | bestanden, 39 bestanden, 6 übersprungen (Fälle ohne Git-Arbeitsbereich, wie bisher) |

Technisches Abnahmekriterium 1 des Auftrags (Prüfungen von Backend und Bibliothek, Oberfläche und Browsertest unverändert) ist erfüllt.

### Änderung am Prüfskript

Offener Punkt des Entwicklers: `pip_audit` erzeugte die Anforderungsliste des Backends ohne `--no-emit-package pipwerk-domain`, abweichend vom Aufruf in Abschnitt 6.1, auf den Abschnitt 6.4 verweist. Commit `e9d40a8`: Die Funktion `pip_audit` gibt weitere Schalter an `uv export` weiter; der Schritt des Backends übergibt `--no-emit-package pipwerk-domain`. Die Bibliothek prüft weiterhin ihr eigener Schritt mit `packages/domain-core/uv.lock`. Abschnitt 6.4 Punkt 5 ist angepasst. Nachweis: `uv export … --no-emit-package pipwerk-domain` im Backend liefert die Liste ohne die Zeile `-e ../../../packages/domain-core`, mit `pydantic==2.13.5`; zweiter Lauf des Prüfskripts bestanden.

### Lockdatei `components/pipwerk-studio/backend/uv.lock`

- `uv lock --check --offline` und `uv lock --locked` (uv 0.5.9) melden „Resolved 35 packages“ ohne Änderung; die Datei blieb unverändert (`git status` leer).
- `uv sync --frozen` installiert die Bibliothek editierbar; Tests, mypy und die Testumgebung laufen damit.
- Der Eintrag `pipwerk-domain` (Version `0.1.0`, `source = { editable = "../../../packages/domain-core" }`, `requires-dist` `pydantic==2.13.5`, `requires-dev` gleich `packages/domain-core/pyproject.toml`) passt zur `pyproject.toml` der Bibliothek; `pydantic` 2.13.5 ist dieselbe Version wie in der Lockdatei des Backends.
- Nicht geprüft: Vergleich mit einer Auflösung durch uv in einer Kopie (`uv lock` auf der Lockdatei vor dem Auftrag). Das Anlegen der Kopie war in meiner Umgebung nicht zugelassen.

### Abnahmekriterien von `wp01` in der Testumgebung

`testenv start --frontend-port 28745 --backend-port 28746` am Stand `e9d40a8`, danach `testenv stop` und `testenv status` („not running“). Abfragen über HTTP mit Python aus der Umgebung des Backends (Standardbibliothek).

1. Erfüllt. Seite der Oberfläche 200 `text/html`; über den Port der Oberfläche `/api/health` → `{"status":"ok"}`, Sprache lesen und schreiben (`en`, zurück `de`), `/api/studio/revision` nennt `e9d40a8`, Objektverzeichnis `…/components/pipwerk-studio/.testenv/objects` (`is_default` falsch). Der Browsertest des Prüfskripts besteht.
2. Erfüllt. `/docs` am Port des Backends 200 mit Swagger UI; `/openapi.json` enthält alle Pfade aus 4.2 mit genau den Methoden der Tabelle; Titel „pipwerk Studio“.
3. Erfüllt. 30 Typen: Auslöser `trigger.candle_close`, `trigger.tick`; acht Elemente des Ablaufs; fünf Ordertypen; `Konto`, `Instrument`, `Kerze`, `Tick`, `Order`, `Position`, `Strategie`; `EMA`, `ATR`, `Markttechnik`; `Indikator`, `Trend`, `Regel`, `Regelwerk`; Verfahren `trend_method.expression`. Jeder Typ hat Namen in Deutsch und Englisch. „Risiko je Trade“ mit Parameter `risikogrenze` (Prozent, Pflicht, 0.01), `determined_property` `volumen`, `comparison` `hoechstens` und dem Ausdruck aus 3.5 in normalisierter Schreibweise der Kennungen, Abstand an beiden Stellen ausgeschrieben. Funktionen `ABS, AND, CEILING, FALSE, FLOOR, IF, IFNA, ISBLANK, ISNA, MAX, MIN, NOT, OR, PREVIOUS, TRUE`.
4. Erfüllt. `POST /api/v1/strategies` mit `str-01` und `str-03`: je 201 mit leerer Liste der Befunde; `GET /api/v1/strategies` nennt beide; `GET …/{id}` gleich dem Testfalldokument bis auf `id`; im Objektverzeichnis der Testumgebung je eine Datei `<id>.strategy.json`.
5. Erfüllt. `POST /api/v1/check` mit abgewandeltem `str-03`: `strategy.no_trigger`; Schreibfehler `expression.invalid` mit `start` 12, `end` 13 (Zeichen `*`); unbekannter Name `expression.invalid` `unknown_name` mit Stelle 0 bis 5; `expression.order_outside_management`; `rule.order_in_indicator`; `flow.management_only` für „Order ändern“; `type.unknown`. `PUT` einer Fassung ohne Auslöser: 200 mit `strategy.no_trigger`, danach liefert `GET` die geänderte Fassung.
6. Erfüllt. Zusätzliches Feld oben (`POST /api/v1/strategies`) und tief im Dokument (`POST /api/v1/check`) → 422 mit Ort und `extra_forbidden`, ohne Wert.
7. Erfüllt. Vorlage `Regel` angelegt (201), geändert (200), Instanz daraus als Regel am Element „Order aufgeben“ in `str-01` gespeichert; `GET /api/v1/rules/{id}/usages` nennt diese Strategie; `DELETE` → 204, danach `GET` → 404; die Strategie ist danach unverändert.

### Eigene Proben (TestClient, temporäre Datenbank) und Grenzfälle

- Medientyp: `text/plain`, `application/jsonx`, ohne `Content-Type` → 415. Leerer Body, `[]`, `null`, unbekanntes `format` → 422 mit festem Text. `format_version` `2.0` → 422, `1.7` → 200 (nur höhere Hauptversion abgelehnt, 3.7).
- Kennung im Pfad: Großschreibung, ohne Bindestriche, in geschweiften Klammern und als `urn:uuid:` bezeichnen dasselbe Objekt (Pydantic `UUID`, danach kanonisch); Kennung im Dokument in Großbuchstaben → 422 `string_pattern_mismatch`.
- `PATCH` → 405, unbekannter Pfad und `/api/v1` → 404.
- Größe des Bodys am laufenden Backend (Uvicorn): Body in Stücken (`Transfer-Encoding: chunked`) mit 2 MiB + 1 Byte und mit 6 MiB → 413; genau 2 MiB → angenommen (422, weil nur Leerzeichen); `Content-Length` 2 MiB + 1 ohne Body → sofort 413.
- `POST /api/v1/check` ohne Objektverzeichnis und bei ungültig gespeichertem Objektverzeichnis → 200 (prüft ohne Ablage).

### Tests aus Auftrag Punkt 6

Vorhanden und bestanden: `test_web_api_element_types.py`, `test_web_api_objects.py` (beide Testfälle anlegen, auflisten, lesen, je eine Datei; alle fünf Arten; die sieben abgewandelten Fassungen durch `check` und `PUT`; Normalisierung; mitgelieferte Vorlage), `test_web_api_templates.py` (Vorlage `Regel` mit `usages` und unveränderter Strategie), `test_web_api_check.py`, `test_web_api_errors.py` (zusätzliches Feld, Body über 2 MiB, 415, Begrenzungen der Bibliothek), `test_body_limit.py`, `test_web_api_unreadable.py`, `test_contract.py`, `test_name.py` (ergänzt), `test_object_store.py` (ergänzt), `test_testenv.py` (Nachbau mit `packages/domain-core/**`). Der Fall aus B1 hat keinen Test. Eigener Abgleich: `python -m pipwerk_studio.contract --check contracts/api/pipwerk-studio/v1/openapi.json` endet mit 0; die Datei enthält genau die 17 Pfade unter `/api/v1/`, Titel „pipwerk Studio“, Version `1.0.0`.

### Code und Dokumentation

Code gelesen: `web_api.py`, `object_service.py`, `body_limit.py`, `contract.py`, Änderungen an `app.py`, `object_store.py`, `pyproject.toml`, `uv.lock`, `scripts/testenv`, Änderungen der Bibliothek (`consistency/`, `defaults.py`, `limits.py`, `py.typed`). Technisches Abnahmekriterium 3 (E2): In `web_api.py`, `object_service.py`, `body_limit.py` und `contract.py` steht keine Kennung eines Element- oder Objekttyps und keine Kennung von „Risiko je Trade“; die Tests prüfen das zusätzlich für den ganzen Quelltext. Technisches Abnahmekriterium 4: keine festen Pfade, Ports oder Rechnernamen in diesen Dateien. Dokumentation geprüft: `docs/technical/pipwerk-studio.md` Abschnitte 1, 2, 2.9, 4a, 5, 6.1, 6.4, 7, 8, 9, 10; `docs/user/pipwerk-studio.md` (Warnung zu `--host` nennt Anlegen, Ändern und Löschen von Strategien und Vorlagen und das Ändern des Objektverzeichnisses; `testenv stop` entfernt die gespeicherten Strategien und Vorlagen); `docs/technical/glossar.md` („Index“, „Strategiedatei“ berichtigt, „Objektverzeichnis“ und „Web-API“ ergänzt); `docs/technical/pipwerk-domain.md` (Abschnitte 2, 5.1, 9.3, 11, 12); `contracts/api/README.md` (Verweis vorhanden). Außer B1, B2 und den Hinweisen keine Abweichung gefunden. Die eigenen Entscheidungen des Entwicklers (409 für nicht lesbare Dateien, Begriff „nicht lesbar“, 403 für „Risiko je Trade“, 415, 16 MiB und 2 MiB, CDN für `/docs`) widersprechen weder Auftrag noch Spezifikation und sind dokumentiert.

## Nicht geprüft

- Vergleich der Lockdatei mit einer Auflösung durch uv in einer Kopie (Anlegen der Kopie nicht zugelassen); Hashes für andere Plattformen.
- `/docs` im Browser mit Swagger UI (kein Browser in meiner Umgebung); geprüft sind die ausgelieferte Seite und `/openapi.json`.
- Zwei temporäre Verzeichnisse meiner Proben im temporären Verzeichnis des Systems (Präfix `ftprobe`) konnte ich nicht entfernen; das Löschen war in meiner Umgebung nicht zugelassen. Sie liegen außerhalb des Repositorys und der Arbeitsverzeichnisse.
