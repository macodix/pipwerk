# Sicherheitsbericht Nachprüfung, Arbeitspaket wp02 (Aufträge 15 bis 18)

- Bezug: `strategiedesign/wp02`, Übergabedokument `development/strategiedesign/wp02/tests/sec-4-order.md`
- Geprüfter Commit: `91c86c3943ce120eba726ae9d689538e5fa1880b` (ausgecheckt und mit `git rev-parse HEAD` bestätigt). Vergleichsstand: `adef3772f8027285a601a7ee4883cff6633ae06c`.
- Ergebnis: **bestanden**. Es gibt keinen blockierenden Befund.
- Umfang: Unterschied beider Commits unter `components/`, `docs/` und `contracts/` (118 Dateien). Grundlage: BSI-Grundschutz (CON.8, APP.7), OWASP ASVS und API Top 10, `docs/technical/development-test-security-rules.md` Abschnitt 8.

## Prüfergebnisse

| Punkt | Ergebnis |
|---|---|
| XSS, Ausgabe fremder Texte | Kein Treffer für `innerHTML`, `dangerouslySetInnerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `new Function`, `outerHTML` in `components/`. Neue Texte (`elementName`, `subjectName`, `fieldLabel`, `datatype_label`) erscheinen nur als React-Textknoten (`FindingsList.tsx`). `escapeValue: false` in `i18n.ts:34` ist deshalb unkritisch, weil kein `<Trans>` und kein HTML-Einsatz vorkommt. |
| Neue Ausgabestellen | Im Diff von `frontend/src` kein neues `href`, `src`, `window.open`, `location`, `localStorage`, `sessionStorage`, `postMessage`, `setAttribute` oder `dangerous*`. |
| Tastenereignisse | `Canvas.tsx` `onKeyDown`: Entf und Rücktaste löschen nur bei ausgewählter Verbindung und nicht in `INPUT`, `TEXTAREA`, `SELECT`. Die Löschung geht über den bestehenden Weg `actions.disconnect`. Die neue `Select`-Komponente in `ui/controls.tsx` fängt Tasten nur am eigenen Feld ab. Alt, Strg und Meta werden ignoriert. Die Selektorfolge `[id="…"]` nutzt eine von React erzeugte `useId`-Kennung, keine fremden Daten. |
| Feste Werte, Zugangsdaten, Pfade, Rechnernamen | Keine Zugangsdaten und keine Pfade oder Rechnernamen des Entwicklungsrechners im geänderten Code. `vite.config.ts` hat keinen Standardwert mehr für die Backend-Adresse. Ohne `PIPWERK_STUDIO_BACKEND_URL` antwortet `/api` mit 503 und einem Text ohne Pfad. `playwright.config.ts` und `scripts/check` verlangen die Ports als Parameter. Die Ports 8000 und 5173 stehen nur in `cli.py` (Vorgabe `--port`, unverändert), in der README und in Tests (unverändert). |
| Bindung an lokale Adressen | `vite.config.ts`: `server.host` und `preview.host` sind `127.0.0.1` mit `strictPort`. `cli.py:40`: `--host` Vorgabe `127.0.0.1` (unverändert). Das Playwright-Backend und -Frontend nutzen `http://127.0.0.1:<Port>`. Die Host-Prüfung (`HostCheckMiddleware`, `app.py:236`) ist unverändert. |
| CORS | Weder `CORSMiddleware` noch `allow_origins` im Backend. Keine Änderung gegenüber dem bestandenen Stand. |
| Backend, Pfadzugriffe und Fehlerantworten | Der Backend-Diff (`api_models.py`, `expressions_api.py`, `web_api.py`) fügt nur Felder für Anzeigetexte hinzu (`element_name`, `subject_name`, `field_label`, `datatype_label`, `data_types`) und entfernt die Blockart `crossing`. Es gibt keinen neuen Pfad-, Datei- oder Shell-Zugriff. Eingaben laufen weiter über Pydantic mit `ApiModel`. Die Fehlerbehandlung ist unverändert. Die Tests zu Fehlerantworten ohne interne Pfade (`test_object_directory_api.py`) sind unverändert vorhanden. |
| Abhängigkeiten | `package.json`, `package-lock.json`, `pyproject.toml` und `uv.lock` sind zwischen beiden Commits unverändert (leerer Diff). `npm audit --omit=dev`: 0 Funde. |
| Beispieldatei | `str-03-…` ist nur umbenannt (Inhalt gleich); die Tests laden sie über `load_case("str-03")`. Es gibt keinen Sicherheitsbezug. |
| Dokumentation | Die Sicherheitsregeln (`development-test-security-rules.md`) sind in Abschnitt 8 nicht abgeschwächt. Die Änderungen dort betreffen 5 Zeilen. |

## Befunde

Blockierend: keine.

Hinweise (verhindern das Bestehen nicht):

1. `npm audit` mit Entwicklungsabhängigkeiten meldet 5 Funde: `undici` (high), `source-map-js` (high), `vite` 8.3.0 bis 8.3.2 über `launch-editor` (high), `vitest` und `@vitest/mocker` (moderate). Sie betreffen nur Entwicklungs- und Testwerkzeuge und nicht das ausgelieferte Programm. Die Abhängigkeiten sind gegenüber dem bestandenen Stand unverändert. Ein Aktualisierungslauf (`npm audit fix`) wäre bei Gelegenheit sinnvoll.
2. `pip-audit` konnte ich nicht ausführen. Das Werkzeug wurde in dieser Sitzung abgelehnt (Befehl `uvx pip-audit` auf der exportierten Anforderungsliste, Ausgabe nach `/tmp`: „Permission to use Bash has been denied … don't ask mode“). Ersatzweise habe ich die gesperrten Versionen des Backends mit `uv export --frozen` gelesen und `uv.lock` auf Änderungen verglichen: keine Änderung seit dem bestandenen Stand `adef3772`. Die Prüfung gegen die aktuelle Schwachstellendatenbank fehlt. Der Entwicklungsleiter sollte sie über `scripts/check --with-audit` nachholen.
3. Die Arbeitskopie zeigt `components/pipwerk-studio/scripts/check` und `testenv` als geändert (nur Dateimodus, 0 Zeilen). Der Unterschied liegt nicht in den Commits und hat keinen Einfluss auf diese Prüfung.
4. Nicht ausgeführt: die Browsertests (Playwright) und das Starten der Testumgebung. Die Bindung an lokale Adressen habe ich nur im Code geprüft, nicht am laufenden Dienst.
