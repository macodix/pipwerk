# Testbericht Funktion – Auftrag 01, Durchlauf 1

- Vorhaben: `strategiedesign`, Arbeitspaket `wp01`, ref `strategiedesign/wp01`
- Übergabedokument: `strategiedesign/wp01:development/strategiedesign/wp01/tests/01-1-order.md`
- geprüfter Commit: `df8a287a070264a3236eb4b39911cd608b7b3eed` (Zweig `strategiedesign/wp01-01`)
- Commit des Prüfskripts: `661e8151635afa154ec92343e00c5d2aa35abefd` (Zweig `strategiedesign/wp01-functiontest`, aufgesetzt auf dem geprüften Commit, nach GitHub übertragen)
- Prüfgebiet: Funktion, Code und technische Dokumentation
- Umfang: erster Durchlauf, vollständig (Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`)

## Ergebnis

**nicht bestanden**

4 blockierende Befunde (B1 bis B4), 7 Hinweise (H1 bis H7).

## Ausgeführte Prüfungen

Vor der Prüfung kontrolliert: `git rev-parse HEAD` im eigenen Arbeitsverzeichnis ergab `df8a287a070264a3236eb4b39911cd608b7b3eed`.

### Automatische Prüfungen in `packages/domain-core`

| Befehl | Ergebnis |
| --- | --- |
| `uv sync --frozen` | Exitcode 0 |
| `uv run --frozen pytest` | 792 Tests bestanden |
| `uv run --frozen ruff check` | „All checks passed!“ |
| `uv run --frozen ruff format --check` | „47 files already formatted“ |
| `uv run --frozen mypy` | „Success: no issues found in 46 source files“ (streng, `strict = true` in `pyproject.toml`) |
| `uv run --frozen python -m pipwerk_domain.documents.schemas --check ../../contracts/strategies/v1` | Exitcode 0, keine Ausgabe |

### Prüfskript

Das Prüfskript `components/pipwerk-studio/scripts/check` nimmt jetzt die Bibliothek auf (Spezifikation Abschnitt 7, letzter Punkt): `uv sync --frozen`, `pytest`, `ruff check`, `ruff format --check`, `mypy` in `packages/domain-core` und der Abgleich der Schemata mit `contracts/strategies/v1`, jeweils als eigene Prüfung vor den Prüfungen des Backends. Abschnitt 6.4 der technischen Dokumentation von pipwerk Studio (`docs/technical/pipwerk-studio.md`) ist angepasst (Gegenstand, Reihenfolge der Prüfungen, Exitcode 2 bei fehlendem Verzeichnis), der Stand des Dokuments auf 2026-10-16 gesetzt. Commit `661e8151635afa154ec92343e00c5d2aa35abefd`; er ändert gegenüber dem geprüften Commit nur diese beiden Dateien.

Aufruf: `<Arbeitsverzeichnis>/components/pipwerk-studio/scripts/check --backend-port 18101 --frontend-port 15271`, ausgeführt auf dem Commit des Prüfskripts (Ausgabe: „checking … at commit 661e8151635afa154ec92343e00c5d2aa35abefd“). Ergebnis: Exitcode 0, „all checks passed“. Alle 17 Prüfungen bestanden: Bibliothek (6 Prüfungen, 792 Tests), Backend (5 Prüfungen, 148 Tests), Suche nach der Schreibweise des Namens (343 Treffer, alle richtig), Oberfläche (`npm ci`, Typprüfung, Vitest mit 244 Tests, Bau) und Browsertest (39 bestanden, 6 übersprungen; die übersprungenen sind die Fälle ohne Git-Arbeitsverzeichnis, Abschnitt 6.3). Ohne `--with-audit` ausgeführt; `pip-audit` für die Bibliothek prüft der Tester Sicherheit.

### Eigene Gegenproben

Mit eigenen Python-Aufrufen gegen die Bibliothek (außerhalb des Repositorys, danach entfernt) geprüft:

- Testfalldokumente `str-01` und `str-03`: Inhalt Element für Element und Verbindung für Verbindung mit Spezifikation Abschnitt 6 und den Testfällen verglichen; beide laden, null Befunde, Schreiben ergibt Zeichen für Zeichen den Dateiinhalt, Normalisierung ändert nichts. Eine absichtlich in Groß- und Kleinschreibung verfälschte Fassung von `str-01` (Namen, Eigenschaften, Funktionen) wird durch `normalize_strategy` wieder genau zum gespeicherten Dokument; das Argument bleibt unverändert, die Funktion ist idempotent. Ergebnis: Befund B3.
- Namensräume (Hinweis S17): Regel des Elements verdeckt gleichnamige Regel der Strategie ohne `name.duplicate`; Gegenprobe ohne Regel des Elements ergibt `rule.result_mismatch` aus der Regel der Strategie; Parameter einer Regel verdeckt eine Regel derselben Liste; doppelte Namen auf derselben Ebene (Regeln der Strategie, Instanz und Regel, Berechnung und Instanz, Regeln eines Elements) ergeben `name.duplicate`; Regel in Indikator und Regelwerk sieht die Namen der Strategie nicht. Ergebnis: wie im Auftrag, außer Befund B1.
- Zusammenhang der Typprüfung (S18, S27): Regel der Strategie mit `Order.limitpreis`, deren Ergebnis die Verwaltung einer `MarketOrder` verwendet, ergibt keinen Befund; Gegenprobe `Order.limitpreis` direkt in dieser Verwaltung ergibt `expression.invalid` (`unknown_property`); Ergebnis einer solchen Regel im Hauptablauf ergibt `expression.order_outside_management`. Vorlagen `Regel` und `Regelwerk` mit `Order.limitpreis` und `Position.einstiegspreis` ohne Befund. Regel mit `Order`/`Position` in Indikator, in Regelwerk im Indikator und über das Ergebnis einer anderen Regel ergibt `rule.order_in_indicator`. Ergebnis: wie im Auftrag.
- Von der Anwendung belegte Eigenschaften (S16): `MarketOrder` ohne `preis` ohne Befund, `StopOrder` ohne `preis` ergibt `order.property_missing`; Belegung von `order_id` oder von `preis` bei `MarketOrder` ergibt `parameter.binding_invalid` (`set_by_application`); fehlender `limitpreis` der `StopLimitOrder` und fehlende `ablaufzeit` bei `gueltigkeit` = `bis_zeitpunkt` werden gemeldet; Volumen über bestimmende Regel der Strategie gilt als belegt, über eine nur prüfende Regel nicht. Ergebnis: wie im Auftrag.
- Befunde aus 3.6 mit Gegenprobe: neben den vorhandenen Tests (160 Tests in `test_consistency_flow.py` und `test_consistency_rules.py`) eigene Fälle zu Rückführungen (über „Order aufgeben“ ohne Bedingung, Bedingung mit beiden Ausgängen im Kreis, Gegenprobe mit offenem Ausgang), verschachtelter Verwaltung, `candle.no_instance` (Tick-Auslöser in Hauptablauf und Verwaltung, Gegenprobe mit Instanz `Kerze` mit Zeiteinheit), unverbundenem Auslöser, `flow.no_order_reachable`, `Parameter setzen`, Strategieparametern und Vorwärts- und Zirkelbezug. Ergebnis: wie in Spezifikation und technischer Dokumentation.
- Ausdrücke: etwa 60 Ausdrücke mit Werten, Rangfolge (`-2^2`, `2^-2`), Prozent, Texten mit doppeltem Anführungszeichen, allen Schreibfehlern, unbekannter Funktion, unbekanntem Namen und unbekannter Eigenschaft, unpassenden Typen, Werten einer Auswahl, Zahl der Argumente, `PREVIOUS`, erkannten Namen mit Stelle und Kennung (`resolved`, `segments`), Normalisierung. Ergebnis: wie dokumentiert, außer Hinweisen H3, H5, H6.
- Begrenzungen am Grenzwert und darüber beim Lesen eines Dokuments: 1000/1001 Elemente, 4000/4001 Verbindungen, 200/201 Regeln (Strategie, Element, Regelwerk), 200/201 Strategieparameter, Schachtelung von Instanzen 16/17 sowie 100, 1000 und 100000 Ebenen als JSON-Text (Ablehnung als `DocumentError`, kein Stapelüberlauf), Ausdruckslänge 4096/4097 (Belegung, Regel, eigene Eigenschaft), Schachtelungstiefe 64/65 (Belegung, Gesamtergebnis). Im Parser: Tiefe 64/65 mit Klammern und mit Funktionsaufrufen, 4000 Vorzeichen und eine Kette mit 2048 Summanden ohne Stapelüberlauf. Ergebnis: alle Grenzen wie gefordert.
- Dokumente: Hauptversion `1.0` und `1.7` angenommen, `2.0`, `10.0`, `0.9`, `1`, `1.0.1` abgelehnt; zusätzliche Felder abgelehnt; keine Umwandlung von Text oder Wahrheitswert in Zahl; unbekannter Elementtyp und Objekttyp mit allen Belegungen (auch fehlerhaftem Ausdruck und Bindungsart `application`) erhalten, `type.unknown` gemeldet; Schreiben und Lesen der Regelvorlage „Risiko je Trade“ gleich, ohne Befund, Ausdruck wie Spezifikation 3.5 mit beiden Abständen ausgeschrieben. Ergebnis: wie gefordert, außer Befund B2.
- Abnahmekriterien 4 und 5: Suche in `src/` nach `pydantic`, `fastapi`, `sqlalchemy`, `eval(`, `exec(`, `compile(`, `__import__`, `importlib`: Pydantic nur in `documents/models.py` und `documents/io.py`, `importlib.metadata` nur für den Einstiegspunkt in `registry.py`, `compile` nur als `re.compile`. Keine festen Pfade, Ports oder Rechnernamen gefunden; `test_architecture.py` prüft das zusätzlich.
- Abhängigkeiten: `pydantic` 2.13.5 und die übrigen Laufzeitpakete haben in `packages/domain-core/uv.lock` dieselben Versionen wie in `components/pipwerk-studio/backend/uv.lock` und wie in Abschnitt 13 der technischen Dokumentation. `pyproject.toml`: hatchling, `requires-python = ">=3.14"`, Version `0.1.0`.
- Dokumentation: `docs/technical/pipwerk-domain.md` gegen Auftrag Punkt 13 und gegen den Code, `docs/technical/glossar.md` (alle verlangten Begriffe vorhanden, „Pydantic“ und „Typbeschreibung“ berichtigt), `packages/domain-core/README.md`, `docs/technical/README.md`, `contracts/strategies/README.md`. Hinweise S21, S24, S25 stehen in Abschnitt 8, S16 in 4.2, S17 in 6, S18 und S27 in 7.5. Ergebnis: Befund B4, Hinweise H1, H2.

### Prüfung der Festlegungen des Entwicklers

| Festlegung | Ergebnis |
| --- | --- |
| Datentyp `object` | kein Widerspruch; Ergänzung zu Spezifikation 3.1 |
| Zeiteinheiten klein (`h1`, `mn1`) | kein Widerspruch; folgt der Bildungsregel aus 3.1 |
| Bildungsregel behält Unterstrich | weicht vom Wortlaut der Spezifikation 3.1 ab, ohne Wirkung auf die Kennungen: Hinweis H4 |
| Regelwerk als geschlossener Namensraum | entspricht Auftrag Punkt 6 für die Namen der Strategie; schließt aber auch die Strategieparameter unter `Strategie` aus: Befund B1 |
| prüfende Regel und Bedingung liefern einen Wahrheitswert | kein Widerspruch (Spezifikation 3.5) |
| Zirkelbezug in jeder Regelliste, Vorwärtsbezug nur im Regelwerk | kein Widerspruch (req-fach-045, Spezifikation 3.6) |
| englische Beschriftungen und Werte der Kursquelle von `EMA` | kein Widerspruch; Werte entsprechen den Kursquellen von MetaTrader 5 (req-fach-054) |
| Werte der Strategieparameter von `str-01` | kein Widerspruch; `h1`/`m15` ist eine Paarung der Empfehlungstabelle, Puffer 3 liegt im Bereich 3 bis 5 Pips |
| zusätzliche Befunde | kein Widerspruch zur Tabelle in 3.6; Mängel bei `name.invalid`: Befund B4 |

## Befunde

### B1 – Strategieparameter in Regelwerk, Indikator und Trend nicht ansprechbar (blockierend)

- Fundstelle: `packages/domain-core/src/pipwerk_domain/consistency/engine.py` Zeile 215 (`self._closed = application_scope(registry)` ohne Strategieparameter) und Zeile 431 (Namensraum der Regeln eines Regelwerks `Scope(self._closed)`); ebenso der Namensraum von Indikator- und Trend-Instanzen. Beschrieben in `docs/technical/pipwerk-domain.md` Abschnitt 6, Tabelle Zeilen „Regel in einem `Regelwerk`“ und „Regel in einer Vorlage `Indikator` oder `Trend`“ sowie Zeile 254.
- Sachverhalt: In einem Regelwerk, auch als Regel der Strategie, und in Ausdrücken einer Indikator- oder Trend-Instanz in der Strategie ist `Strategie.<Strategieparameter>` ein Fehler `expression.invalid` (`unknown_property`), obwohl die Strategie den Parameter hat. Gegenprobe:
  - Strategie mit Parameter `p` (Zahl, 1), Regel der Strategie `r` mit `Strategie.p > 0`: kein Befund.
  - Dieselbe Regel `r` in einem Regelwerk `rw` als Regel der Strategie: `expression.invalid`, `subject` `rw.r`, `property` `p`.
  - Eigene Eigenschaft `x` = `Strategie.p * 2` einer Instanz `Indikator` in derselben Strategie: `expression.invalid`, `property` `p`.
  - Vorlage `Regel` mit `Strategie.x > 1`: Hinweis `rule.unresolved_name` („geprüft wird der Name in jeder Strategie“); Vorlage `Regelwerk` mit derselben Regel: Fehler `expression.invalid`.
  - `Strategie.wartende_orders` ist im Regelwerk und im Indikator ohne Befund ansprechbar; ausgeschlossen sind nur die Strategieparameter.
- Widerspruch: req-fach-046 („Strategieparameter … überall in der Strategie verwendbar, zum Beispiel `Strategie.Handelszeiteinheit`“), Spezifikation 3.4 („Objekt ist … oder `Strategie` mit einem Strategieparameter“). Auftrag Punkt 6 schließt für Regeln in Indikator, Trend und Regelwerk die Namen der Strategie aus, lässt aber „danach die Objekte der Anwendung“ zu; `Strategie` ist ein Objekt der Anwendung, dessen Eigenschaften die Strategieparameter sind (req-fach-051, Tabelle). Außerdem behandelt die Bibliothek denselben Ausdruck in einer Regelvorlage als später in der Strategie prüfbar (Hinweis), in einem Regelwerk als Fehler, auch wenn die Strategie den Parameter hat. Ob Strategieparameter unter `Strategie` in Regelwerk, Indikator und Trend gelten sollen, ist zu entscheiden; die jetzige Umsetzung schließt sie aus, ohne dass Auftrag oder Spezifikation das festlegen.

### B2 – `NaN` und `Infinity` werden angenommen und als ungültiges JSON geschrieben (blockierend)

- Fundstelle: `packages/domain-core/src/pipwerk_domain/documents/models.py` (Felder vom Typ `float` und `bool | int | float | str`, zum Beispiel Zeilen 76, 107, 125, 163, 164; Pydantic lässt `inf` und `nan` ohne `allow_inf_nan=False` zu), `packages/domain-core/src/pipwerk_domain/documents/io.py` Zeile 55 (`json.dumps` schreibt `NaN`/`Infinity`).
- Sachverhalt: `str-03.strategy.json` mit `"value": NaN` (beziehungsweise `Infinity`, `-Infinity`) beim Strategieparameter `stop_abstand` wird von `read_document` angenommen; die Konsistenzprüfung meldet keinen Befund. `write_document` schreibt den Text `NaN` beziehungsweise `Infinity`; ein strenger JSON-Leser (`json.loads` mit Ablehnung dieser Konstanten) weist die Ausgabe als ungültiges JSON ab (RFC 8259 kennt diese Werte nicht, das JSON-Schema unter `contracts/strategies/v1/` kann sie nicht ausdrücken). Bei `NaN` ergibt erneutes Lesen nicht dasselbe Objekt (`read_document(write_document(o)) == o` ist falsch). Ebenso `x`, `y` eines Elements und feste Werte von Belegungen, zum Beispiel `volumen` mit `NaN` ohne Befund.
- Widerspruch: Auftrag Punkt 9 („Schreiben und erneutes Lesen ergeben dasselbe Objekt“, Validierung „streng“), Spezifikation 3.7 und 8 (Pydantic streng), Entwicklungsregeln 8.2 Punkt 3 (zulässige Wertebereiche handelsrelevanter Werte). Eine so gespeicherte Datei ist für andere JSON-Leser, etwa die Oberfläche, nicht lesbar.

### B3 – `str-01`: neuer Stop-Loss in der Verwaltung folgt der Signalzeiteinheit statt der Richtung der Order (blockierend)

- Fundstelle: `contracts/strategies/v1/testcases/str-01.strategy.json`, Element `stop_neu` (Zeile 433 ff.), Ausdruck `IF(mt_signal.trendrichtung = "aufwaerts"; mt_handel.punkt_13 - Strategie.stop_puffer * Instrument.pip; mt_handel.punkt_13 + Strategie.stop_puffer * Instrument.pip + Instrument.spread)`; dagegen `ziel_neu` (Zeile 475) mit `IF(Order.richtung = "buy"; …)`.
- Sachverhalt: In der Verwaltung einer wartenden Order wird der neue Stop-Loss nach der aktuellen Trendrichtung der Signalzeiteinheit berechnet, nicht nach der Richtung der Order. Wechselt `mt_signal.trendrichtung` während eine Kauforder wartet auf `kein_trend` oder `abwaerts`, ergibt `stop_neu` die Formel für den Verkauf (Punkt 1/3 + Stop-Puffer + Spread). Die Bedingung „Stop-Loss weicht ab“ ist dann wahr, und „Order ändern“ setzt für die Kauforder diesen Stop-Loss, `ziel_neu` rechnet mit der Kaufformel weiter. Die beiden Berechnungen derselben Verwaltung verwenden verschiedene Richtungen.
- Widerspruch: Testfall `str-01`, Abschnitt 3 (Stop-Loss Long: Punkt 1/3 − Stop-Puffer) und Abschnitt 6 (neu berechneter Stop-Loss als Stop-Loss-Bezug der Order); Auftrag Abnahmekriterium 3 und Punkt 11 („nach Abschnitt 6 und den Testfällen“). Spezifikation Abschnitt 6 nennt für `stop_neu` keinen Ausdruck. Die Tests in `test_testcases.py` prüfen diesen Fall nicht.

### B4 – `name.invalid` erkennt einen Namen mit abschließendem Zeilenumbruch nicht (blockierend, Dokumentation und Code stimmen nicht überein)

- Fundstelle: `packages/domain-core/src/pipwerk_domain/namespaces.py` Zeile 31 (`re.compile(r"^[^\W\d]\w*$")` mit `match`; `$` trifft auch vor einem abschließenden `\n`), Zeilen 37 bis 40; `docs/technical/pipwerk-domain.md` Abschnitt 6, Zeile 255.
- Sachverhalt: `is_valid_name("abc\n")` ist wahr. Eine Instanz `ema20\n` und eine Berechnung mit Namen `c\n` ergeben keinen Befund. Ein Ausdruck kann diese Namen nicht ansprechen (der Zeilenumbruch beendet den Namen), und `ema20` und `ema20\n` gelten nicht als doppelt.
- Widerspruch: Technische Dokumentation Abschnitt 6 („Namen … müssen aus Buchstaben, Ziffern und `_` bestehen …, sonst meldet die Prüfung `name.invalid`“) und Docstring von `is_valid_name` („no space“); Spezifikation 3.2/3.3 (Name ohne Leerzeichen). Die Tests zu `name.invalid` (`test_invalid_names`) prüfen den Fall nicht.

## Hinweise

- H1 – `packages/domain-core/README.md` führt die Prüfbefehle selbst auf, und `contracts/strategies/README.md` enthält die Festlegung „must not be edited by hand“. Nach `docs/technical/entwicklungsverfahren.md` („Geltungsbereich und Dokumentationsorte“) enthält eine README-Datei keine Festlegungen und verweist auf das zuständige Dokument; die Befehle stehen bereits in Abschnitt 12 von `docs/technical/pipwerk-domain.md` (dort zusätzlich der Abgleich der Schemata, der im README fehlt).
- H2 – `docs/technical/glossar.md`, Eintrag „Typbeschreibung“: Die Aufzählung der Arten nennt die Art `trend_method` (Berechnungsverfahren des Trends) nicht, die `docs/technical/pipwerk-domain.md` Abschnitt 3.1 und der Code führen.
- H3 – Ziffern: Der Lexer (`expressions/lexer.py` Zeile 39, `\d`) nimmt alle Unicode-Ziffern als Zahl an, etwa `٣ + 1` oder die Vollbreitenziffer `１`; beide ergeben keinen Befund. Spezifikation 3.4 nennt „Zahlen mit Dezimalpunkt“; die Dokumentation sagt dazu nichts.
- H4 – Bildungsregel: `identifier_from_name` behält einen vorhandenen Unterstrich (`a_b` ergibt `a_b`), Spezifikation 3.1 lässt „andere Zeichen entfallen“. Keine der mitgelieferten Kennungen ist davon betroffen; die Abweichung ist in Abschnitt 3.2 und 14 der technischen Dokumentation als Festlegung genannt.
- H5 – Stelle von `unknown_choice_value` mit Grund `result`: Bei `IF(TRUE(); "buy"; "x")` als Belegung von `richtung` umfasst die Stelle den ganzen Ausdruck (0 bis 22), nicht den Text `"x"`; bei einem Vergleich zeigt die Stelle dagegen auf den Text. Für die Markierung über `/api/v1/check` ist die Stelle ungenau.
- H6 – `PREVIOUS(Konto.kapital; 0)` meldet `type_mismatch` mit `expected` = `integer` und `found` = `integer`; die Angaben für den Text nennen nicht, dass die Anzahl ab 1 verlangt ist.
- H7 – Vorlage `Trend` mit Verfahren „Ausdruck“ ohne eigene Eigenschaft `richtung` ergibt keinen Befund; Spezifikation 3.3 sieht „je einen Ausdruck für die Eigenschaft `Richtung`“ vor. Die Tabelle in 3.6 enthält dafür keinen Befund.

## Bereinigung

Die eigenen Prüfaufrufe und Protokolle lagen unter `packages/domain-core/.venv/` (von Git ignoriert) und sind entfernt. Das Arbeitsverzeichnis enthält keine nicht committeten Änderungen.
