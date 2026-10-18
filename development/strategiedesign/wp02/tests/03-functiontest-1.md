# Testbericht Tester Funktion – Auftrag 03, Durchlauf 1

- Vorhaben `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- Prüfauftrag: `strategiedesign/wp02:development/strategiedesign/wp02/tests/03-1-order.md`
- geprüfter Commit: `cfa7107f0fc4a1fecc7bccce51327aedce3225e3` (Zweig `strategiedesign/wp02-03`, aufgesetzt auf `fba6663d333b24672f9684e1c91ac8c92999e989`)
- Prüfskript: `components/pipwerk-studio/scripts/check` im Stand des geprüften Commits `cfa7107f0fc4a1fecc7bccce51327aedce3225e3`. Es war keine Änderung nötig: Der neue Abgleich der Testkopie läuft als Test des Backends mit. Deshalb gibt es keinen Zweig `strategiedesign/wp02-functiontest` und keinen eigenen Commit des Prüfskripts.
- Grundlagen: Auftrag `development/strategiedesign/wp02/orders/03.md`; Spezifikation `development/strategiedesign/specification.md` auf `origin/main` (Commit `d51105a730fd929974cf1b0bd26e66b318510cdc`, 2026-10-18), Abschnitte 3.1, 3.3, 3.6, 4.1, 4.2, 7, 8; `docs/technical/development-test-security-rules.md`, `docs/technical/pipwerk-domain.md`, `docs/technical/pipwerk-studio.md`, `docs/technical/entwicklungsverfahren.md` („Umfang der Prüfungen“), alle im Stand des geprüften Commits

## Ergebnis

**bestanden**

Kein blockierender Befund. Zwei Hinweise (H1, H2). Sie verhindern das Bestehen nicht.

## Nachweise

| Prüfung | Ergebnis | Nachweis |
|---|---|---|
| Ausgecheckter Commit | `cfa7107f0fc4a1fecc7bccce51327aedce3225e3` | `git -C <Arbeitsverzeichnis> rev-parse HEAD` vor und nach der Prüfung |
| Prüfskript `check --backend-port 18431 --frontend-port 18432` (ohne `--with-audit`) | Exitcode 0, „all checks passed“ | Bibliothek: `uv sync --frozen`, pytest 1013 bestanden, ruff check, ruff format --check, mypy, Abgleich der Schemata; Backend: `uv sync --frozen`, pytest 693 bestanden, ruff check, ruff format --check, mypy; Suche nach der Schreibweise des Namens; Oberfläche: `npm ci`, Typprüfung, Vitest 244 bestanden, Bau; Browsertest 39 bestanden, 6 übersprungen (die Fälle „without a Git working tree“, je Browser 2; sie gelten nur ohne Git-Arbeitsverzeichnis) |
| Typbeschreibung über `GET /api/v1/element-types` (Testumgebung, Backend auf 127.0.0.1:18434, `curl`) | wie Auftrag Punkt 1 | `holds_management` nur bei `flow.place_order`/`gestellt`; `named` genau bei `flow.condition` und `flow.calculation`; `strategy_parameters` genau bei `Strategie`; alle Typen tragen die Felder; jedes Feld vom Datentyp `time_unit` (`trigger.candle_close`, `Kerze`, `EMA`, `ATR`, `Markttechnik`, `Trend`, jeweils `zeiteinheit`) hat 21 `choices` von `m1` bis `mn1`, Beschriftung bis `MN1` |
| Testkopie `frontend/src/testing/element-types.json` | gleich der Antwort | Vergleich der mit `curl` geholten Antwort mit der Datei: gleich. Der in der Testdatei genannte Befehl `uv run --frozen python tests/test_frontend_type_copy.py` im Verzeichnis des Backends schreibt die Datei ohne Änderung neu (`git status` danach leer). Der Pfad wird aus `Path(__file__).resolve().parents[4]` bestimmt (`tests/web_api_support.py`, Zeile 13), nicht fest eingetragen. |
| Leere Strategie | kein Befund | `POST /api/v1/check` mit einer Strategie ohne Elemente: `{"findings":[]}`; ebenso `PUT` einer leeren Strategie: `findings` leer |
| `PUT` auf fehlende Datei | `201`, Datei angelegt, Befunde | `PUT /api/v1/strategies/2222…` ohne vorhandene Datei: `201`; zweites `PUT`: `200` |
| `PUT` mit Datei derselben Kennung anderer Art | `409`, nichts geschrieben | `PUT /api/v1/rules/2222…` neben `2222….strategy.json`: `409` mit festem Text „An object of another kind has this identifier in the object directory. Nothing was written.“ |
| Ablauf „anlegen, Objektverzeichnis ohne Verschieben ändern, speichern“ | wie Spezifikation 4.1 | Objektverzeichnis auf ein noch nicht vorhandenes Verzeichnis zwei Ebenen tief gesetzt (`move: false`), dann `PUT`: `201`; Verzeichnisse angelegt (das letzte mit Rechten nur für den Benutzer), Datei mit Rechten nur für den Benutzer; SHA-256 der Datei im alten Verzeichnis vor und nach dem Speichern gleich; die Antwort enthält `flow.no_incoming`, `flow.no_order_reachable` (Hinweis) und `candle.no_instance` für das Element ohne Auslöser |
| Konsistenzprüfung nach Punkt 1a, eigene Proben über die Bibliothek | 20 von 20 wie erwartet | leere Strategie ohne Befund; ohne Auslöser kein `strategy.no_trigger`, aber `flow.no_incoming` und `flow.no_order_reachable`; nur ein Auslöser oder nur eine Instanz: Hinweis `flow.no_order_reachable`; `candle.no_instance`: Element im Hauptablauf nur über `trigger.candle_close` erreicht, Verwaltung mit `trigger.tick`: kein Befund, dazu eine Regel der Strategie: Fehler `(None, "r")`; nicht verbundenes Element neben einem `trigger.candle_close`: Fehler; Instanz `Kerze` ohne Zeiteinheit hebt den Befund nicht auf, mit Zeiteinheit schon; Element einer inneren Verwaltung ohne eigenen Auslöser, die äußere Verwaltung hat `trigger.candle_close`: Fehler; Berechnung nur über `trigger.tick` erreicht: Fehler; zwei Regeln eines Elements: je ein Befund; zwei Verwendungen in einem Ausdruck: ein Befund |
| Ungültige Typbeschreibung (zwei Ausgänge mit der Verwaltung), eigene Proben | nicht angemeldet | als Funktion am Einstiegspunkt (auch der vorher angemeldete gültige Typ fehlt danach) und als einzelne Beschreibung: in `failed`, Warnung nur mit Name und Klasse `RegistryError` |
| Zeiteinheiten bei einem Typ über den Einstiegspunkt, eigene Probe | eingesetzt | Parameter vom Datentyp `time_unit` eines zusätzlichen Berechnungsverfahrens erscheint beim `Trend` mit allen 21 Zeiteinheiten; `get()` und `list()` liefern dieselbe Beschreibung |
| Testfälle `str-01`, `str-03` | ohne Fehler, Dateien unverändert | `test_testcases.py` bestanden; der Diff gegen den Ausgangscommit enthält keine Datei unter `contracts/strategies/v1/testcases/` |
| Tests nach Auftrag Punkt 5 | vorhanden und bestanden | `packages/domain-core/tests/test_type_fields.py`, `test_consistency_flow.py` (leere Strategie, ohne Auslöser, `candle.no_instance` mit allen verlangten Fällen und Gegenproben, `flow.no_order_reachable` drei Fälle), `test_testcases.py`, `test_documentation.py`; `components/pipwerk-studio/backend/tests/test_web_api_objects.py` (`201`, `200`, fehlendes Verzeichnis, `409` ohne Schreiben, Ablauf B1), `test_frontend_type_copy.py`, `test_web_api_unreadable.py`, `test_user_documentation_examples.py` |
| Programmierregeln | erfüllt | ruff, ruff format und mypy ohne Befund (Prüfskript); keine festen Pfade, Ports oder Rechnernamen in den geänderten Dateien; Dateiname weiter nur aus `check_object_id` und `check_object_kind` (`object_service.py`, Zeilen 363–364) |
| Technische Dokumentation | vollständig und gleich dem Code | `pipwerk-domain.md` 3.1, 3.3, Abschnitt 9 (Tabelle ohne `strategy.no_trigger`, Absatz zu Strategien ohne Auslöser, `candle.no_instance`, `flow.no_order_reachable`), Testtabelle; `glossar.md` „Typbeschreibung“ mit Eintrag im Änderungsnachweis; `pipwerk-studio.md` 2.8, 5.2 (Tabelle, Verhalten, Fehlertabelle `404`/`409`), Testbeschreibung; `docs/user/pipwerk-studio.md` Zeile 1 der Tabelle und Absatz zu `PUT`. Eine Suche im Commit nach `no_trigger`, „Ersetzen legt nie“ und „replacing never“ findet außerhalb der Tests und des neuen Absatzes nichts mehr. Die Glossareinträge „Auslöser“, „Auswertung“ und „Verwaltung einer Order“ sind unverändert. |
| Aufräumen | erledigt | Testumgebung mit `testenv stop` beendet, `.testenv/` entfernt; meine Probendatei entfernt; `git status --short --ignored` zeigt keine Reste von mir |

Nicht selbst nachgeprüft: `PUT` auf eine symbolische Verknüpfung über die laufende Testumgebung. Das Anlegen einer Verknüpfung war mir in dieser Umgebung nicht erlaubt. Der Fall ist durch den automatischen Test `test_a_symbolic_link_is_neither_listed_nor_read_nor_deleted` (`components/pipwerk-studio/backend/tests/test_web_api_unreadable.py`, Zeile 161) abgedeckt. Dieser Test hat bestanden: `500`, die Verknüpfung bleibt bestehen, ihr Ziel bleibt unverändert.

## Bewertung der Antwort `500` bei einer symbolischen Verknüpfung

Die Antwort entspricht dem Auftrag und den Regeln. Der Auftrag (Punkt 2) regelt den Fall nicht. `docs/technical/pipwerk-studio.md` Abschnitt 2.8 legt fest, dass Schreiben unter dem Namen einer Verknüpfung scheitert und Verknüpfung und Ziel nicht ändert. Spezifikation 8 verlangt Dateizugriff nur über geprüfte Namen, und Regel 8.2.8 verbietet unnötige Systemdetails in Fehlermeldungen. Die Antwort hat den festen Text „The object file could not be written or deleted.“ ohne Pfad. Sie steht in der technischen Dokumentation (Abschnitt 5.2, Punkt „Speichern“, und Fehlertabelle `500`) und ist durch einen Test belegt. Zur Einordnung des Statuscodes siehe H1.

## Befunde

Keine blockierenden Befunde.

## Hinweise

### H1 – Unterschiedliche Statuscodes für einen belegten Dateinamen beim Speichern

- Fundstelle: `components/pipwerk-studio/backend/src/pipwerk_studio/object_service.py`, Zeilen 373–386; `docs/technical/pipwerk-studio.md`, Abschnitt 5.2, Punkt „Speichern (`PUT`…)“
- Sachverhalt: Drei Fälle verhindern beim Speichern das Schreiben. Bei einer nicht lesbaren Datei derselben Art ist die Antwort `409`. Bei einer Datei derselben Kennung mit anderer Art ist sie ebenfalls `409`. Liegt unter dem Dateinamen eine symbolische Verknüpfung, liest `_load` den Namen als „fehlt“. Erst das Schreiben scheitert, und die Antwort ist `500` mit Fehlerprotokoll. Der Anwender bekommt also für einen belegten Namen im Objektverzeichnis einmal einen Konflikt und einmal einen Serverfehler gemeldet. Beides ist dokumentiert und verletzt keine Vorgabe. Die Einordnung ist eine Entscheidung des Softwarearchitekten.

### H2 – Zeiteinheiten in `choices` nur bei Beschreibungen ohne eigene Werte

- Fundstelle: `packages/domain-core/src/pipwerk_domain/registry.py`, Zeilen 202–205; `docs/technical/pipwerk-domain.md`, Abschnitt 3.1, Absatz „Zeiteinheiten“
- Sachverhalt: Das Register setzt `TIME_UNITS` nur dann ein, wenn ein Parameter oder eine Eigenschaft vom Datentyp `time_unit` keine eigenen `choices` hat. Ein Typ über den Einstiegspunkt, der eigene Werte nennt, behält diese, auch wenn es nur ein Teil der Zeiteinheiten ist. Der Auftrag (Punkt 1, vierter Unterpunkt) sagt: „nennen in `choices` alle Zeiteinheiten“. Bei allen mitgelieferten Typen ist das erfüllt (siehe Nachweise). Das Verhalten ist in der technischen Dokumentation beschrieben. Die Ausnahme betrifft nur fremde Typen.
