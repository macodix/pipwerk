# Testbericht Funktion – Auftrag 01, Durchlauf 2 (Nachprüfung)

- Vorhaben: `strategiedesign`, Arbeitspaket `wp01`, ref `strategiedesign/wp01`
- Übergabedokument: `strategiedesign/wp01:development/strategiedesign/wp01/tests/01-2-order.md`
- geprüfter Commit: `b12816c225bf8fa2fea50acca43e725126e6054b` (Zweig `strategiedesign/wp01-01`)
- vorher geprüfter Commit: `df8a287a070264a3236eb4b39911cd608b7b3eed` (Bericht `01-functiontest-1.md`)
- Commit des Prüfskripts: `3717430022cd53c4c87a76cc6ea40c7db8895776` (Zweig `strategiedesign/wp01-functiontest`, neu aufgesetzt auf dem geprüften Commit, nach GitHub übertragen)
- Prüfgebiet: Funktion, Code und technische Dokumentation
- Umfang: Nachprüfung nach „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Befunde aus Durchlauf 1 und die dafür geänderten Stellen

## Ergebnis

**nicht bestanden**

1 blockierender Befund (N1), 3 neue Hinweise (N2, N3, N5); N4 nennt die zwei Hinweise aus Durchlauf 1, die bestehen bleiben. Von den 4 blockierenden Befunden aus Durchlauf 1 sind alle behoben. Die Zahl der blockierenden Befunde sinkt von 4 auf 1.

## Ausgeführte Prüfungen

Vor der Prüfung kontrolliert: `git rev-parse HEAD` im eigenen Arbeitsverzeichnis ergab `b12816c225bf8fa2fea50acca43e725126e6054b`.

### Automatische Prüfungen in `packages/domain-core` auf dem geprüften Commit

| Befehl | Ergebnis |
| --- | --- |
| `uv sync --frozen` | Exitcode 0 |
| `uv run --frozen pytest` | 912 Tests bestanden |
| `uv run --frozen ruff check` | „All checks passed!“ |
| `uv run --frozen ruff format --check` | „48 files already formatted“ |
| `uv run --frozen mypy` | „Success: no issues found in 47 source files“ |
| `uv run --frozen python -m pipwerk_domain.documents.schemas --check ../../contracts/strategies/v1` | Exitcode 0 |

### Prüfskript

Änderung nach Übergabedokument: Der Zweig `strategiedesign/wp01-functiontest` ist auf den geprüften Commit neu aufgesetzt. Der frühere Commit `661e815` ist als `e67d7b9` übernommen. Neu ist Commit `3717430`: Mit `--with-audit` läuft `pip-audit` jetzt auch für `packages/domain-core/uv.lock`, gleich aufgerufen wie für das Backend (`uv export --frozen --no-hashes --no-emit-project`, dann `uvx pip-audit -r … --no-deps --disable-pip`), als eigener Schritt direkt nach den Prüfungen der Bibliothek. `docs/technical/pipwerk-studio.md` Abschnitt 6.4 ist angepasst (Parameter `--with-audit` nennt beide Lockdateien, Reihenfolge jetzt 8 Schritte). Die beiden Commits ändern gegenüber dem geprüften Commit nur `components/pipwerk-studio/scripts/check` und `docs/technical/pipwerk-studio.md`.

Aufruf: `<Arbeitsverzeichnis>/components/pipwerk-studio/scripts/check --backend-port 18101 --frontend-port 15271 --with-audit` auf Commit `3717430` (Ausgabe: „checking … at commit 3717430022cd53c4c87a76cc6ea40c7db8895776“). Ergebnis: Exitcode 1. 19 von 20 Prüfungen bestanden:

- Bibliothek: `uv sync --frozen`, pytest (912 Tests), `ruff check`, `ruff format --check`, mypy, Abgleich der Schemata, **`pip-audit`: 23 Pakete aus `packages/domain-core/uv.lock`, „No known vulnerabilities found“**
- Backend: `uv sync --frozen`, pytest (148 Tests), `ruff check`, `ruff format --check`, mypy, `pip-audit`
- Suche nach der Schreibweise des Namens
- Oberfläche: `npm ci`, Typprüfung, Vitest, Bau
- Browsertest: 39 bestanden, 6 übersprungen (die Fälle ohne Git-Arbeitsverzeichnis, Abschnitt 6.3)

Gescheitert ist nur `npm audit`: ein Befund mit hoher Schwere zu `source-map-js` 1.0.0 bis 1.2.1 (GHSA-68fv-2mgg-jv7q). Das ist der bekannte Befund aus `docs/technical/pipwerk-studio.md` Abschnitt 7 und 9. Der geprüfte Commit ändert nichts an der Oberfläche. Deshalb ist das kein Befund dieses Commits.

### Kontrolle der Befunde aus Durchlauf 1

Alle Gegenproben liefen mit eigenen Python-Aufrufen gegen die Bibliothek. Die Dateien lagen unter `packages/domain-core/.venv/` (von Git ignoriert) und sind entfernt.

| Befund | Ergebnis | Nachweis |
| --- | --- | --- |
| B1 Strategieparameter in Regelwerk, Indikator, Trend | behoben, entspricht der Festlegung des Softwarearchitekten | Strategie mit Parameter `p`: `Strategie.p` ohne Befund in einem Regelwerk der Strategie, in einem Regelwerk in den Regeln eines Elements, in einer eigenen Eigenschaft eines Indikators und in einem Regelwerk in einem Indikator. `Strategie.q` ergibt dort jeweils `expression.invalid` (`unknown_property`). Ein Strategieparameter vom Typ Text in `Strategie.t > 0` ergibt `type_mismatch`; der Typ des Parameters wird also verwendet. Das Ergebnis einer Berechnung bleibt im Regelwerk unsichtbar (`unknown_name`). Vorlagen `Regel`, `Regelwerk`, `Indikator` und Regelwerk im Indikator, für sich geprüft: `Strategie.x` ergibt den Hinweis `rule.unresolved_name`. `Strategie.wartende_orders` im Regelwerk ohne Befund. Dokumentation Abschnitt 6 und 14 Punkt 8 beschreiben das. |
| B2 `NaN` und `Infinity` | behoben | `str-03` mit `NaN`, `Infinity`, `-Infinity` und `1e999` als Risikogrenze wird von `read_document` abgelehnt (`DocumentError`). Tests in `test_hardening.py` decken alle Zahlenfelder ab, auch Python-Objekte und das Schreiben (`allow_nan=False`). `str-01` und `str-03`: null Befunde, Schreiben ergibt Zeichen für Zeichen den Dateiinhalt, Normalisierung ändert nichts. |
| B3 `str-01`, `stop_neu` | behoben | Ausdruck jetzt `IF(Order.richtung = "buy"; …)`, gleich wie `ziel_neu`. Test `test_str_01_management_calculations_use_the_direction_of_the_order` prüft das. |
| B4 Name mit Zeilenumbruch | behoben | `is_valid_name` mit `fullmatch` und ASCII-Klassen: `abc\n`, `abc\r`, `еma20` (kyrillisch), `a١`, `ä`, `1a`, `a b` ungültig; `ema20`, `_x`, `a_b` gültig. Berechnung `c\n` und Instanz `ema20\n` ergeben `name.invalid`. |
| H1 README | erledigt | Beide README-Dateien enthalten nur noch Zweck und Verweis. |
| H2 Glossar | erledigt | „Berechnungsverfahren des Trends“ steht in der Aufzählung. |
| H3 Unicode-Ziffern | erledigt | `٣ + 1`, `１ + 1`, `abcе`, `Ä`, `1 ٣` ergeben Schreibfehler `invalid_character` mit richtiger Stelle. Unicode-Leerraum bleibt erlaubt. Dokumentation 7.1 beschreibt das. |
| H4 Unterstrich | unverändert, bleibt Hinweis | Festlegung in Abschnitt 3.2 und 14. |
| H5 Stelle bei Auswahlwerten | erledigt | `IF(TRUE(); "buy"; "x")`: Stelle 18 bis 21 (der Text `"x"`). Auch in Klammern, `IFNA` und geschachteltem `IF` je unbekanntem Text ein Befund an seiner Stelle. |
| H6 `PREVIOUS` Anzahl 0 | unverändert, bleibt Hinweis | nicht Gegenstand der Korrektur |
| H7 Trend ohne Richtung | erledigt | Instanz und Vorlage mit Verfahren „Ausdruck“ ohne `richtung` ergeben `trend.direction_missing`; mit `Richtung` (andere Schreibweise) kein Befund; ohne Belegung des Verfahrens gilt der Standard. |

### Prüfung der geänderten Stellen

- Reihenfolge der Berechnungen (`_analyze_calculations`): Ketten mit 2, 125 und 999 Berechnungen ohne Befund und ohne Absturz (999 Glieder: 0,06 s). Der Ergebnistyp wird weitergegeben: Berechnung `a` = `b.ergebnis + 1` mit `b` = `"x"` ergibt `type_mismatch`; eine Bedingung auf einer Berechnung mit Text ebenfalls. Ein Fehler im Ausdruck einer Berechnung wird genau einmal gemeldet. `Order` in einer Berechnung des Hauptablaufs ergibt weiter `expression.order_outside_management`. Normalisierung von Berechnungen wie vorher.
- `calculation.circular_reference`: `a` ↔ `b` und `a` = `a.ergebnis + 1` werden gemeldet. Kein falscher Kreis bei einem Namen in einem Text (`"b.x"`), nach `Strategie.` oder in anderer Schreibweise (`A.ergebnis`). Siehe Hinweis N2.
- Grenzen der Befunde: Ausdruck mit 2048 unbekannten Namen (4095 Zeichen) ergibt 50 Befunde und `findings.truncated` (`scope` `expression`). 480 solche Berechnungen: 1001 Befunde, der letzte `findings.truncated` (`limit` 1000, `scope` `check`), 0,46 s. Ebenso mit 200 Regeln der Strategie, 480 Bedingungen und einer Vorlage `Regelwerk`. Genau 1000 Befunde (20 Ausdrücke mit je 50) ergeben keinen Befund `findings.truncated`. Siehe Hinweis N3.
- Lexer mit regulärem Ausdruck: Zahlen, Namen mit Punkt, Operatoren (`<>`, `<=`, `>=`), `1.`, `.5`, `1e5`, `a.`, `a..b` mit denselben Schreibfehlern wie dokumentiert. 912 Tests bestanden, darunter alle Tests des Parsers.
- Lesen eines JSON-Textes (`_load_json`): doppelte Schlüssel auf oberster Ebene und in einem Element abgelehnt; 100, 1000 und 100000 Ebenen als `DocumentError`, kein Absturz. Siehe Hinweis N5.
- Register: `SystemExit` beim Laden und fehlerhafte Metadaten sind abgefangen, die mitgelieferten Typen bleiben. Siehe Befund N1.
- Dokumentation: `docs/technical/pipwerk-domain.md` Abschnitte 3.3, 6, 7.1, 7.3, 9.2, 10, 11, 12 und 14 gegen den Code geprüft; `test_documentation.py` bestanden. Abweichung siehe N1.

## Befunde

### N1 – Fehlerhafte Metadaten eines fremden Pakets verhindern das Laden aller gültigen Einstiegspunkte; die Dokumentation sagt das Gegenteil (blockierend)

- Fundstelle: `packages/domain-core/src/pipwerk_domain/registry.py` Zeilen 111 bis 120 (`entry_points(group=ENTRY_POINT_GROUP)` im `try`, bei einer Ausnahme `return LoadReport((), ())`); `docs/technical/pipwerk-domain.md` Abschnitt 3.3, Zeile 112.
- Sachverhalt: Nachweis mit zwei Paketen in einem Verzeichnis auf `sys.path`. Paket `goodpkg` meldet unter `[pipwerk.element_types]` einen gültigen Einstiegspunkt `good` an. Allein geladen: `LoadReport(loaded=('good',), failed=())`. Dazu ein Paket `badpkg`, dessen `entry_points.txt` in einer **anderen** Gruppe (`[other.group]`) eine Zeile `noeq` ohne `=` hat. Dann ergibt `load_entry_points()` `LoadReport(loaded=(), failed=())` und die Warnung „The entry points of the group pipwerk.element_types could not be read (TypeError)“. Der gültige Einstiegspunkt `good` wird nicht geladen und steht auch nicht unter `failed`.
- Widerspruch: Abschnitt 3.3 sagt: „Ein fehlerhafter Einstiegspunkt … verhindert das Laden der übrigen nicht. Dasselbe gilt für fehlerhafte Metadaten der Einstiegspunkte irgendeines installierten Pakets (zum Beispiel eine Zeile ohne `=`, auch in einer anderen Gruppe)“. Im Code verhindern solche Metadaten das Laden aller übrigen Einstiegspunkte. Auftrag 01 Punkt 2 („Ein fehlerhafter Einstiegspunkt verhindert das Laden der übrigen nicht“). Ein einziges fremdes Paket mit fehlerhaften Metadaten nimmt also allen Erweiterungen ihre Typen. Strategien mit diesen Typen ergeben dann `type.unknown`. Die Tests (`test_faulty_metadata_of_the_entry_points_leave_the_delivered_types`) prüfen nur die mitgelieferten Typen, nicht einen gleichzeitig vorhandenen gültigen Einstiegspunkt.
- Außerdem ist der Absatz in Abschnitt 3.3 durch den eingefügten Satz unklar: Der folgende Satz „Er meldet nichts an …“ bezieht sich jetzt dem Wortlaut nach auf die Metadaten, gemeint ist der fehlerhafte Einstiegspunkt.

## Hinweise

- N2 – `PREVIOUS` auf das eigene Ergebnis: Eine Berechnung `z` mit `PREVIOUS(z.ergebnis) + 1` ergibt den Fehler `calculation.circular_reference`. Nach req-fach-014 (`docs/design/domain/fachmodell.md` Zeile 60) liefert `PREVIOUS` den Wert bei einer früheren Auswertung, zum Beispiel für einen Zähler; in der laufenden Auswertung ist das kein Kreis. `PREVIOUS(z.ergebnis)` in einer anderen Berechnung ergibt keinen Befund. Regeln verhalten sich schon im vorher geprüften Commit gleich (`PREVIOUS(r.ergebnis) >= 0` ergibt `ruleset.reference_order` mit `kind` `cycle`). Im vorher geprüften Commit führte die Selbstbezüglichkeit bei Berechnungen zum Absturz (Befund B1 des Testers Sicherheit), es gab also kein gültiges Verhalten. Spezifikation und Auftrag legen den Fall nicht fest; Abschnitt 9.2 der Dokumentation erwähnt `PREVIOUS` nicht. Zu entscheiden: ob `PREVIOUS` auf das eigene Ergebnis ein Kreis ist.
- N3 – Laufzeit der Normalisierung: `normalize_strategy` prüft ohne die Grenze von 1000 Befunden (Abschnitt 9.2, so dokumentiert). Für ein Dokument mit 480 Berechnungen aus je 2048 unbekannten Namen (rund 2 MiB) braucht sie 8,7 s, `check_strategy` dagegen 0,46 s; 200 solche Regeln 3,8 s. Ob die Normalisierung beim Speichern im Backend läuft, legt ein späteres Arbeitspaket fest; die Bewertung der Überlast gehört zum Tester Sicherheit.
- N4 – Hinweise H4 und H6 aus Durchlauf 1 bestehen unverändert.
- N5 – Kodierung beim Lesen von Bytes: `read_document` liest Bytes jetzt mit `json.loads`. Damit werden UTF-8 mit BOM, UTF-16 und UTF-32 angenommen; Latin-1 wird abgelehnt. Spezifikation, Auftrag und Dokumentation nennen keine Kodierung. RFC 8259 verlangt UTF-8 für den Austausch zwischen Systemen.

## Bereinigung

Die eigenen Prüfaufrufe, Testpakete und Protokolle lagen unter `packages/domain-core/.venv/probe/` (von Git ignoriert) und sind entfernt. Das Arbeitsverzeichnis steht auf Commit `3717430` des Prüfskripts und enthält keine nicht committeten Änderungen.
