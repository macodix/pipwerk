# Testbericht Sicherheit, Arbeitszweig strategiedesign/wp02, Durchlauf 1

- Ergebnis: **bestanden** (keine blockierenden Befunde)
- Geprüfter Commit: `3ad5bc48bdf31396a8e2e144abdb17074c915fe8` (Arbeitsverzeichnis darauf ausgecheckt und mit `git rev-parse` kontrolliert; Vergleichsstand `main` `c79b1f8f73cb0f9f844f0cd96709530997eb6041`)
- Grundlagen: Spezifikation Abschnitt 8, `docs/technical/development-test-security-rules.md` (Abschnitt 8), BSI CON.8/APP.7, OWASP ASVS und API Security Top 10. Erster und einziger Durchlauf, vollständig.

## Geprüft

| Bereich | Ergebnis |
|---|---|
| `/api/v1/expressions`, `/api/v1/keys` (`expressions_api.py`, `web_api.py`) | Ausdrücke werden nur gelesen, zerlegt und geprüft (`render`, `analyze`, `to_blocks`), nie ausgeführt; kein `eval`/`exec` im Pfad. Eingabe strikt validiert (`model_validate(strict=True)`, `ApiModel` ohne unbekannte Felder), 1 bis 50 Einträge, Ausdruck ≤ 4096 Zeichen und Schachtelung ≤ 64, Pointer ≤ 1000 Zeichen, Name ≤ 200, Blöcke ≤ 200 Ebenen. Blocktiefe wird vor dem Modellbau iterativ geprüft, Bau und Umwandlung ohne Rekursion. Pointer: `split_pointer` prüft RFC 6901, Auflösung nur über die Tabelle `checker.contexts` (kein Durchlaufen des Dokuments mit fremdem Pfad); ungültig → 422 `expressions.pointer_invalid`. Content-Type muss `application/json` sein (`_json_body`). |
| Lesen Format 1.0/2.0 (`documents/io.py`) | Strikte JSON-Prüfung (kein NaN/Infinity, keine doppelten Schlüssel, keine Byte-Order-Marke, `RecursionError` abgefangen), einzelne Surrogate abgelehnt, Zyklen und Mehrfachverweise ohne Rekursion durchlaufen. Format 1.0 nur über `^1\.[0-9]+$` und die Modelle 1.0 (strikt), danach Umwandlung; höhere Hauptversion und unbekannte Felder fallen durch die Modelle als `document.invalid` (422). Größe: Body ≤ 2 MiB (`BodyLimitMiddleware`, zählt auch ohne/falschem `Content-Length`), Dateien ≤ `MAX_STORED_FILE_BYTES` beim Lesen. |
| Fehlerantworten (`errors.py`, `web_api.py`) | Feste Texte aus der Tabelle `ERROR_CODES`, Code und Parameter; Validierungsfehler nennen Ort und Typ, nie Werte; Protokoll nur Klasse und errno (`_log_failure`), kein Pfad, keine Ausnahmetexte. Nicht erfasste Fehler liefert Starlette als Klartext „Internal Server Error“ ohne Einzelheiten. |
| Dateizugriffe (`object_store.py`) | Dateiname nur aus geprüfter UUID (kleingeschrieben, `fullmatch`, `uuid.UUID`) und festen Arten; `O_NOFOLLOW`, `lstat`, keine Symlink-Verfolgung, Schreiben über temporäre Datei, `fsync`, `os.replace`; Verzeichnis mit 0700; Verschieben ohne Überschreiben (Hardlink, `FileExistsError`). Pfad-Eingaben des Anwenders erreichen keinen Dateinamen. |
| Host- und Herkunftsprüfung (`host_check.py`) | Äußerste Middleware, alle Pfade; fehlender oder doppelter `Host` → 400; Port, IPv6, Punkt am Ende, Groß-/Kleinschreibung geprüft; `*ip` nur auf ausdrückliche Einstellung. Schreibende Endpunkte verlangen `application/json` (löst bei fremder Herkunft einen Preflight aus). |
| Oberfläche | Kein `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, `document.write` in `frontend/src` (`git grep`); Ausdruckstexte und Befunde werden als React-Text ausgegeben. Der einzige `href` (`AboutDialog.tsx:106`) stammt aus `package.json` und wird gegen `^https://github.com/…` geprüft (`repository.ts`), mit `rel="noopener noreferrer"`. Kennungen in URLs mit `encodeURIComponent` (`api/objects.ts`). Kein `localStorage`/`sessionStorage`, kein `window.open`. |
| Zugangsdaten und Pfade im Repository | `git grep` nach Schlüsseln, Kennwörtern, Tokens, privaten Schlüsseln und Pfaden von Rechner und Benutzer in Komponente, Bibliothek, Verträgen, Dokumentation und Aufträgen: keine Zugangsdaten. Treffer nur auf `/var/lib/pipwerk/…` (dokumentierter Standardort, FHS), erfundene Beispielpfade `/home/beispiel/…` und Testdaten wie „secret“ in Negativtests. |
| Abhängigkeiten Oberfläche | `npm audit` (alle): 2 Hinweise „high“, siehe H1. `npm audit --omit=dev`: 0 Schwachstellen. |
| Tests | `pytest` auf `test_host_check`, `test_body_limit`, `test_web_api_expressions`, `test_web_api_keys`, `test_web_api_errors`, `test_web_api_format`, `test_error_codes`: 346 bestanden. |

## Blockierende Befunde

Keine.

## Hinweise (verhindern das Bestehen nicht)

- **H1 Abhängigkeit Oberfläche.** `npm audit` meldet `vite` 8.3.1 (Bereich 8.3.0 bis 8.3.2; über `launch-editor`, drei Hinweise) und `source-map-js` 1.2.1 (Ereignisschleife, über `postcss`/`jsdom`) als „high“. Beide sind reine Entwicklungsabhängigkeiten (`--omit=dev`: 0). Die Testumgebung startet `vite preview` (`scripts/testenv:332`), nicht den Entwicklungsserver mit `launch-editor`; `vite.config.ts` bindet auf 127.0.0.1. Nach Prüfung nicht erreichbar. Bei nächster Gelegenheit `vite` auf einen behobenen Stand heben (von npm genannt: 8.3.5) und `source-map-js` aktualisieren.
- **H2 Python-Pakete nicht gegen Schwachstellendatenbank geprüft.** `pip-audit` konnte ich nicht ausführen (Aufruf in dieser Sitzung nicht freigegeben). Geprüft ist nur die Auflösung in `uv.lock` (Export): fastapi 0.141.1, starlette 1.7.0, pydantic 2.13.5, uvicorn 0.54.0, sqlalchemy 2.1.3, alembic 1.20.0; Versionen festgelegt, keine unerwarteten transitiven Pakete. Eine Schwachstellenprüfung der Python-Pakete steht offen.
- **H3 Fehlerantwort `object_directory.move_not_restored`** nennt Quell- und Zielverzeichnis sowie Dateinamen (`app.py:285-303`). Das ist im Vertrag so beschrieben und betrifft nur den internen Einstellungsendpunkt, dient aber der Wiederherstellung durch den Anwender; gegen Regel 8.2.8 („unnötige Systemdetails“) abwägen, falls die API über den lokalen Rechner hinaus erreichbar wird.
- **H4 Nicht geprüft:** Verhalten unter Last (Dauer von `analyze`/`check_with_contexts` bei 50 Einträgen mit Ausdrücken an den Grenzen) nicht gemessen; die Grenzen sind gesetzt, die Laufzeit je Anfrage ist nicht begrenzt. Authentisierung gibt es nicht (lokale Komponente, Zugriff nur über die Host-Prüfung begrenzt), das entspricht der Spezifikation.

## Hinweis zu meiner Arbeit

Beim Export der Paketliste habe ich versehentlich die Datei `work/strategiedesign/wp02/reports/sec-req-1.txt` angelegt. Das Löschen wurde mir nicht freigegeben. Die Datei ist ein Artefakt dieser Prüfung, kein Bericht, und kann entfernt werden.
