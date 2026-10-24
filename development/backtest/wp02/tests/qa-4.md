# Prüfbericht QA, Arbeitspaket wp02, Durchlauf 4 (Nachprüfung)

- Ergebnis: **bestanden** (mit Einschränkung: Bedienung der Oberfläche im Browser nicht prüfbar, siehe unten)
- geprüfter Commit: `66cf5c77310e3ce95cbc11872b8c93fb057a7c04` (Zweig `backtest/wp02`), im Arbeitsverzeichnis ausgecheckt
- Testumgebung des Auftrags: Oberfläche 5175, Backend 8002 (nur lesend und für die Ablehnung eines relativen Pfads benutzt, nichts gespeichert). Für Prüfungen mit eigener Konfiguration: eigene Umgebung mit `testenv` auf 5185/8012, danach beendet. Wegwerfdateien in `reports/qa4tmp/`.

## Nicht ausführbar, ehrlich benannt

- Kein Browser (Playwright fehlt): Dialog, Kästchen, Erklärung beim Zeigen, Ansicht „Einstellungen“, Auswahl aus dem Importverzeichnis wurden nicht bedient. Geprüft nur über Web-API (`curl`), Dateisystem, ausgelieferte Texte (`frontend/src/locales/de.json`) und Anwenderdokumentation. Die Browsertests von Auftrag 20 sind weiter ungelaufen.
- Kriterium 11: ohne MetaTrader 5 und ohne Windows nur der Teil ohne MetaTrader 5 prüfbar.

## Kriterium 11 (`pipwerk-fetch-mt5`, Strg+C)

- `uv run pytest tests/test_files_cleanup.py`: 11 bestanden (Unterbrechung beim Schreiben ohne Zwischendatei, bestehende Datei bleibt, Aufräumen alter Zwischendateien, Strg+C und SIGTERM im ganzen Aufruf, Exitcode 130).
- `docs/technical/pipwerk-fetch-mt5.md` Abschnitt 4 „Aufräumen“ beschreibt das schlüssig. Echter Abbruch mit MetaTrader 5 und unter Windows: nicht geprüft.

## Kriterium 12 (Dateien behalten)

- Eigene Umgebung, Importvorgang über die Web-API:
  - `keep=true`: hochgeladene Datei liegt danach im Ablageverzeichnis, `cmp` zur Quelle: gleich. Das gilt auch für die abgelehnte Datei (fehlende Angabe von Instrument und Daten), wie in `docs/user/pipwerk-replay.md` Abschnitt 8 beschrieben. Antwort `"kept":true`.
  - `keep=false`: nach dem Import liegt keine neue Datei im Ablageverzeichnis (`"kept":false`).
  - Datei aus dem Importverzeichnis mit `keep=true` im Vorgang: nicht ins Ablageverzeichnis kopiert.
- Standard „nicht angekreuzt“: `GET /api/replay/settings/files` auf frischer Umgebung gibt `keep_imported_files:false`.
- Vorbelegung und Erklärung beim Zeigen: im Browser nicht bedient. Texte in `de.json` (Zeilen 43, 336, 337) nennen das Ablageverzeichnis (`{{directory}}`) und die Vorbelegung; der Browsertest dazu ist nicht gelaufen.
- Anwenderdokumentation Abschnitt 8 „Dateien behalten“: sagt ausdrücklich „Pflege: … Aufräumen, Sichern und Löschen im Ablageverzeichnis sind Ihre Sache.“ Verständlich und vollständig.

## Kriterium 13 (Einstellungen)

- Vier Werte speichern und erneut lesen (`PUT`/`GET /api/replay/settings/files`): Werte kommen unverändert zurück, `is_default:false`.
- Relativer Pfad (`daten/ablage`, `rel/x`): HTTP 422, „A directory cannot be used. Nothing was saved.“, `not_absolute`; danach unveränderte Werte. Der Text in der Oberfläche (Grund unter dem Feld) ist im Browser nicht gesehen; die deutschen Gründe stehen in der Anwenderdokumentation.
- Auswahl aus dem Importverzeichnis: `GET import-directory` zeigt das Unterverzeichnis `sub`. Ein Vorgang mit einer hochgeladenen (`keep=false`) und einer Datei aus `sub/…csv` (`directory-files`) importiert beide ohne Kopie, auch ein Vorgang mit `keep=true` lässt die Datei im Importverzeichnis (Größe 250 Byte, ein einziges Exemplar, nichts im Ablageverzeichnis).
- Pfad `../up/…` außerhalb des Importverzeichnisses: HTTP 422 `path_invalid`.
- Nach dem Import (Datenbestand der eigenen Umgebung): beide Reihen (EURUSD, GBPUSD) in `series`, Lücken 0.

## Kriterien 1 bis 10 (Stichprobe)

- Start der Umgebung mit leerem Datenbestand, Oberfläche liefert HTTP 200, Import und Reihenliste funktionieren wie oben. Die Testumgebung 8002 liefert leere Reihenliste (leerer Datenbestand, wie im Auftrag). Keine Verschlechterung gesehen. Konten, Löschen und Lückenprüfung nicht erneut geprüft (nur Stichprobe).

## Befunde

Keine blockierenden Befunde.

## Hinweise

- H1: Eine hochgeladene Datei im Ablageverzeichnis hat die Rechte 0600 (`-rw-------`); für den Anwender, der sie dort selbst pflegt, ist das ggf. unerwartet, aber nicht widersprüchlich zu den Kriterien.
- H2: Die Browsertests von Auftrag 20 sollten laufen, sobald ein Playwright-Browser verfügbar ist (Umgebungsgrenze, nicht Gegenstand dieser Prüfung).
