# Testbericht Tester Funktion, Auftrag 10, Durchlauf 1

- Bezug: `strategiedesign/wp02`, Auftrag `strategiedesign/wp02:development/strategiedesign/wp02/orders/10.md`
- geprüfter Commit: `43fa30e5fcc212fc0a56d9fd1f7be7bdcab53a5f` (Zweig `strategiedesign/wp02-10`, auf GitHub vorhanden, Autor `macodix`)
- Ergebnis: **bestanden** (blockierende Befunde: keine). Einschränkung: Playwright war nicht ausführbar (siehe Prüfskript).
- Prüfskript: unverändert (kein Commit im Zweig `…-functiontest`)

## Ergebnisse

| Prüfung | Ergebnis |
|---|---|
| `packages/domain-core`: `uv sync --frozen`, `pytest` (1748), `ruff check`, `ruff format --check`, `mypy` | bestanden |
| `backend`: `uv sync --frozen`, `pytest` (1032), `ruff check`, `ruff format --check`, `mypy` | bestanden |
| Schemata `contracts/strategies/v2/` und `v1/` gleich den erzeugten; OpenAPI-Datei gleich der erzeugten (`test_contract`); Namensschreibweise (`git grep`) | bestanden |
| `testenv start/status/stop` auf freien Ports; „EMA-Trendfolge“ liegt im Objektverzeichnis | bestanden |
| „EMA-Trendfolge“ (Datei 1.0 und aus dem Objektverzeichnis): `/check` null Befunde, `/usage` (erste Verwendung `flow`, Eingänge mit „Aktualisieren“ in der Verwaltung), `PUT` 200 ohne Befunde | bestanden |
| `str-01`, `str-03` in 2.0: `/check` null Befunde; Namen, Kennungen nach Abschnitt 6, keine Lage | bestanden |
| `str-03` in 1.0: null Befunde, Umwandlung legt Aktualisieren-Eingänge nur in der Verwaltung an; `str-01` in 1.0: nur `Markttechnik`-Folgen (unbekannter Typ) | bestanden |
| 1.0 mit `trigger.manual_start`, „Parameter setzen“, `Markttechnik`: `trigger.manual`, Typen unbekannt, Belegung unverändert, Lesen–Schreiben–Lesen gleich | bestanden |
| Befundtabelle 3.6 (siehe unten) | bestanden |
| Sichtbare Namen: Zweig „falsch“ ohne die im Zweig „wahr“ ermittelte Instanz; als Text eingegeben → `instance.not_usable` | bestanden |
| Namensvorschlag `/api/v1/insert`: „Trend H1 EMA 20“, bei Vergabe „EMA 20 2 EMA 20“, Ausdrücke umgeschrieben; Fehlerfälle (beide/keines, Typ unbekannt, Name 201 Zeichen) 422 mit Kennung | bestanden |
| Entfernen `/api/v1/removals`: Vorschau, `apply`, leerer Platz (`expression.empty`), Verwaltung geht mit; unbekanntes Ziel 422 `removal.target_unknown` | bestanden |
| Grenzen (Abschnitt 8): Body über 2 MiB → 413 an `/usage`, `/insert`, `/removals`, `/check`; 51 Eingänge, 21 Argumente, Name 201 Zeichen → 422; 775 Elemente: `/check`, `/usage`, `/removals` je unter 1 s | bestanden |
| Dokumentation Punkt 11: alle 37 Kennungen der Befunde in `pipwerk-domain.md`, alle 36 Fehlerkennungen in `pipwerk-studio.md`; Beispiele „Web-API ausprobieren“ durch `test_web_api_documentation_examples.py`; keine Pfade, Benutzer-, Rechnernamen in den geänderten Zeilen | bestanden |
| Glossar gegen Spezifikation 3.3 und `origin/main`: nur Änderungen an Einträgen der Spezifikation, keine Einträge von `main` verloren | bestanden |
| H1 (Fallfehler): „wenn der jüngste Wendepunkt …“ in allen drei `wendepunkt_N_endgueltig`; 741 Texte auf gleiche Fehler durchsucht, keine | bestanden |

Befundtabelle 3.6, je Zeile Befund und Gegenprobe (str-03 abgewandelt, `POST /api/v1/check`; Gegenprobe = unverändert, leer): Auslöser ohne Verbindung; Element nicht erreicht; Hauptablauf ohne Auslöser (Hinweis, einziger Befund der leeren Strategie); Instrument ungültig; unzulässige Verbindung; Schreibfehler; leerer Ausdruck; `PREVIOUS` ungültig; Datenverbindung zu unbekannter Instanz/Eigenschaft/Methode (`data.unknown`); „Aktualisieren“ bei `Regel` (`input.refresh_not_allowed`), bei EMA erlaubt; Instanz nicht verwendbar (Eingang und nur im Ausdruck), verwendbar in der Verwaltung; gespeicherte erste Verwendung später/in der Verwaltung/unbekannt/ohne Verwendung durch das Element; `Manuell` in der Verwaltung; Name doppelt (Name, Objekt der Anwendung, Kennung ohne Groß-/Kleinschreibung, Strategieparameter, Parameter einer Regel); Instanz ohne Verbindung (Gegenprobe: nur im Ausdruck verwendet → kein Befund); Eingang ohne Verwendung (Hinweis); `Markttechnik` und `flow.set_parameter` (`type.unknown`); Kreis ohne Bedingung; `Order` außerhalb der Verwaltung. Methode mit unpassenden Argumenten: die mitgelieferten Typen haben keine Methoden, geprüft nur durch die Tests (`test_usage.py`, `INPUT_ARGUMENTS`).

## Prüfskript (Kriterium 3)

`scripts/check` kennt weder Chromium-Beschränkung noch `--max-failures`; seine Schritte einzeln: `npm ci`, `typecheck` (bestanden), `build` (bestanden, in `testenv start`).

- Vitest: 44 von 456 Tests scheitern (13 Dateien), 412 bestehen. 40 durch die alten Gruppen: `parseGroup` wirft `Unexpected response: types[0].group` (`elementTypes`, `ops`, `own`, `libraryModel` (2), `scene` (10), `describe`, `removal`, `flowModel`); die 25 Tests in `App.flows` (10), `App.expressions` (12), `App.open`, `Wizard` (3) scheitern an `menu-new` gesperrt (`toBeEnabled`), wegen der nicht geladenen Typen aus der gemeinsamen Ursache geschlossen, nicht je Test einzeln belegt. Kein Befund, Auftrag 11. Dazu 2 neue: `locales.test.ts` (de, en) „jede Kennung der Bibliothek hat Text und Weg zur Behebung“; es fehlen die Texte für `input.refresh_not_allowed`, `instance.not_usable`, `trigger.manual_in_management`, `instance.unconnected`. Nach Punkt 4 des Auftrags stehen die Texte in der Oberfläche; ich werte das als Folge der neuen Kennungen der bisherigen Oberfläche (Auftrag 11), nicht als Befund (Hinweis H3).
- Playwright Chromium (`--max-failures=20`, Ports 18000/15173): **nicht ausführbar.** Alle 20 Tests scheitern in `browserType.launch`: Chromium (`chromium_headless_shell-1243`) ist auf dem Rechner nicht installiert; 57 nicht gelaufen. Herunterladen ist mir nicht freigegeben. Der Lauf aus Durchlauf 1 von Auftrag 09 hatte den Browser noch. Die E2E-Tests sind daher nicht beurteilt (Hinweis H4).

## Befunde

Blockierend: keine.

Hinweise:
- H1: `str-01.strategy.json`: Name der Regel der Strategie ist `risiko` (klein, wie die Kennung); `str-03` hat „Risiko“. Spezifikation 6 verlangt Namen in Händlersprache.
- H2: Eine gespeicherte erste Verwendung, die das Element gar nicht verwendet, wird ohne Meldung übergangen (`test_a_stored_first_use_that_the_element_does_not_use_is_ignored`); nur zur Kenntnis.
- H3: Neue Kennungen ohne Texte in der Oberfläche (`locales.test.ts`); Auftrag 11 muss sie liefern.
- H4: Playwright-Browser fehlt auf dem Prüfrechner (`npx playwright install` nötig, vom Menschen oder Entwicklungsleiter); bis dahin sind die Browsertests nicht beurteilbar.
- H5: `frontend/src/testing/typeDescriptions.ts` kennt noch `Markttechnik` und `flow.set_parameter` (Oberfläche, Auftrag 11).

## Kriterien

1 erfüllt, 2 erfüllt, 3 teilweise: Bibliothek, Backend, Typecheck, Build, Vitest geprüft (Fehler nur durch Oberfläche, einzeln genannt); Playwright nicht ausführbar, 4 erfüllt (kein fester Pfad/Port/Rechnername in den geänderten Zeilen, keine Auswertung von Ausdrücken, kein `eval`), 5 erfüllt, 6 erfüllt (Commit auf `origin/strategiedesign/wp02-10`).
