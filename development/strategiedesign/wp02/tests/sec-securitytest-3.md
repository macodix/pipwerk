# Testbericht Sicherheit 3 – strategiedesign/wp02 (Nachprüfung)

- Geprüfter Commit: `adef3772f8027285a601a7ee4883cff6633ae06c` (ausgecheckt und mit `rev-parse HEAD` kontrolliert), verglichen mit `bb200ef3abffed8aab9e55f8ef508971d624145f` (`sec-securitytest-2.md`).
- Umfang: `git diff bb200ef3 adef3772` unter `components/`, `docs/` und der von `components/` genutzten Bibliothek `packages/domain-core/src`. Nur statische Prüfung; Läufe über `uv run` waren in dieser Sitzung nicht erlaubt (siehe Lücken).

## Ergebnis: bestanden

Keine blockierenden Befunde.

## Prüfpunkte

| Punkt | Ergebnis |
|---|---|
| Eingabevalidierung `/usage`, `/insert`, `/removals` | Alle drei lesen den Body über `_json_body` (nur `application/json`) und `load_json` (Grenze `MAX_DOCUMENT_BYTES` = 2 MiB). Die Modelle werden mit `model_validate(strict=True)` geprüft. `target` hat `max_length=MAX_KEY_LENGTH`, `name` und `object_type` `MAX_NAME_LENGTH`, `language` ist `Literal["de","en"]`, `kind` ist `Literal`. `InsertRequest` verlangt genau eines aus `template` und `object_type`. `/usage` begrenzt die Liste der Einsatzorte auf `MAX_USAGE_ENTRIES` = 20000 (`usage.py` Z. 294) und meldet das mit `truncated` und `usable_at_omitted`. |
| Fehlerantworten | Fachfehler laufen über feste Codes (`usage.strategy_required`, `insert.template_invalid`, `insert.type_unknown`, `removal.strategy_required`, `removal.target_unknown`) mit festem englischem Text. `_guarded` gibt für Objektverzeichnisfehler feste Codes zurück und protokolliert Ursachen nur im Log. Kein Pfad und kein Ausnahmetext in den neuen Antworten. |
| Pfadzugriff im Objektverzeichnis | `object_service.py` ist im Diff unverändert. Die neuen Endpunkte greifen nicht auf Dateien zu: Sie arbeiten nur auf dem übergebenen Dokument im Speicher. |
| Ausdrücke | `grep` nach `eval(`, `exec(`, `compile(`, `__import__`, `pickle`, `ast.literal_eval` in `packages/domain-core/src` und `components/` (ohne Tests): keine Treffer außer `importlib.metadata` in `registry.py` (unverändert, nur Metadaten). Ausdrücke werden von Lexer und Parser (`lexer.py`, `parser.py`) in Knoten umgesetzt, nicht ausgeführt. Der neue `MethodCall` ist nur ein Knoten. Tiefe wird durch `_check_block_depth` / `MAX_BLOCK_DEPTH` begrenzt. |
| XSS | `grep` nach `innerHTML`, `dangerouslySetInnerHTML`, `eval(`, `new Function`, `document.write` in `frontend/src` und `frontend/e2e`: keine Treffer. Fremde Texte (Namen, Beschreibungen, Befundtexte, Ausdrücke, Eigenschaftenansicht, Formeleditor) gehen über React-Textknoten. |
| Abhängigkeiten npm | `package.json`: nur `@playwright/test` 1.63.0 → 1.64.1 (Entwicklungsabhängigkeit); `e2e:stub` entfällt. `npm audit --omit=dev`: 0 Schwachstellen. `npm audit` gesamt: 5 (3 high, 2 moderate), alle Entwicklungsabhängigkeiten: `vite` 8.3.0–8.3.2, `source-map-js`, `undici` 8.11.2 (über `jsdom`), `@vitest/mocker`/`vitest`. Neu gegenüber Bericht 2: `undici`, `vitest`. Die Pakete laufen nur in Test und Entwicklung, nicht in der ausgelieferten Oberfläche. |
| Abhängigkeiten Python | `pyproject.toml` und `uv.lock` im Diff unverändert. Keine neuen Pakete. |
| Zugangsdaten, Pfade, Rechnernamen | Die hinzugefügten Zeilen unter `components/` und `docs/` enthalten keine Passwörter, Schlüssel, absoluten Entwicklerpfade (`/srv`, `/home`) und keine `.conf`-Dateien. Treffer auf „token“ sind Ausdruckssymbole; Treffer auf `https://` sind `resolved`-Adressen von `registry.npmjs.org` in `package-lock.json`. |
| Bindung und CORS | `cli.py`: `--host` Standard `127.0.0.1`. `e2e/start-backend.mjs` startet das Backend mit `--host 127.0.0.1`. Der Host-Check (`host_check.py`) ist unverändert. Keine CORS-Konfiguration im Code (`allow_origins` ohne Treffer); die Medientyp-Prüfung auf `application/json` erzwingt für fremde Ursprünge eine Preflight-Anfrage. |
| Browsertests | `playwright.config.ts` verlangt beide Ports als Parameter (1–65535, keine Standardports), `reuseExistingServer: false`. Der Stubmodus samt `run-stub.mjs` ist entfernt; die Tests laufen gegen das echte Backend. |

## Hinweise (nicht blockierend)

- H1 (offen aus Bericht 1): `vite` auf 8.3.5 und `source-map-js` auf einen behobenen Stand heben.
- H3 (neu): `undici` (über `jsdom`) auf einen Stand nach 8.12.1 und `vitest` auf 5.0.5 heben; nur Entwicklungsabhängigkeiten.
- H2 (offen aus Bericht 1): Python-Pakete sind nicht mit `pip-audit` geprüft; keine Änderung an den Python-Abhängigkeiten in diesem Stand.
- H4 (neu): `.github/workflows/sync-repo.yml` setzt `cancel-in-progress: true` (liegt außerhalb des Umfangs `components/` und `docs/`); ein abgebrochener Lauf könnte einen Abgleich unvollständig lassen.

## Lücken der Prüfung

- `pip-audit` und die Backend-Tests (`uv run pytest`) wurden nicht ausgeführt: Der Aufruf von `uv` wurde in dieser Sitzung verweigert. Die Aussagen zu den Endpunkten beruhen auf dem Lesen von `usage_api.py`, `web_api.py`, `errors.py` und der Bibliothek, nicht auf Anfragen an einen laufenden Server. Kein Befund hängt davon ab.
