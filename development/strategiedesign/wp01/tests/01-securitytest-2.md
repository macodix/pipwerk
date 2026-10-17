# Testbericht Sicherheit – Auftrag 01, Durchlauf 2 (Nachprüfung)

- Vorhaben: `strategiedesign`, Arbeitspaket `wp01`, ref `strategiedesign/wp01`
- Übergabedokument: `strategiedesign/wp01:development/strategiedesign/wp01/tests/01-2-order.md`
- geprüfter Commit: `b12816c225bf8fa2fea50acca43e725126e6054b` (Zweig `strategiedesign/wp01-01`)
- vorher geprüfter Commit: `df8a287a070264a3236eb4b39911cd608b7b3eed` (Bericht `01-securitytest-1.md`)
- Commit des Prüfskripts: `3717430022cd53c4c87a76cc6ea40c7db8895776` (Zweig `strategiedesign/wp01-functiontest`). Er ändert gegenüber dem geprüften Commit nur `components/pipwerk-studio/scripts/check` und `docs/technical/pipwerk-studio.md` (`git diff --stat`).
- Umfang: Nachprüfung nach „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Befunde aus Durchlauf 1 und die dafür geänderten Stellen. Nur blockierende Befunde verhindern das Bestehen.
- Grundlagen: Auftrag 01, Festlegungen des Softwarearchitekten im Übergabedokument, Entwicklungs-, Test- und Sicherheitsregeln, `docs/technical/pipwerk-domain.md`, BSI CON.8 und APP.7, OWASP ASVS (Eingabevalidierung, Fehlerbehandlung), OWASP API Security Top 10 (API4 Ressourcenverbrauch)

## Ergebnis

**nicht bestanden**

Drei blockierende Befunde (N1, N2, N3). Die vier blockierenden Befunde aus Durchlauf 1 sind in ihrer Wirkung behoben. N1 und N2 sind Reste an den Stellen von B2 und B4, N3 ist neu durch die Korrektur von B3 und H5 entstanden. Die Zahl der blockierenden Befunde sinkt von 4 auf 3. Der nicht erfüllte Prüfschritt O1 (`pip-audit`) ist erledigt: keine bekannten Lücken.

## Ausgeführte Prüfungen

Vor der Prüfung kontrolliert: `git rev-parse HEAD` im eigenen Arbeitsverzeichnis ergab `b12816c225bf8fa2fea50acca43e725126e6054b`. Für das Prüfskript stand das Arbeitsverzeichnis auf `3717430`, danach wieder auf dem geprüften Commit. `git status` ist danach leer.

### Befehle in `packages/domain-core` auf dem geprüften Commit

| Befehl | Ergebnis |
| --- | --- |
| `uv sync --frozen` | bestanden |
| `uv run --frozen pytest` | 912 bestanden |
| `uv run --frozen ruff check` | „All checks passed!“ |
| `uv run --frozen ruff format --check` | „48 files already formatted“ |
| `uv run --frozen mypy` | „Success: no issues found in 47 source files“ |
| `uv run --frozen python -m pipwerk_domain.documents.schemas --check ../../contracts/strategies/v1` | bestanden |
| `uv lock --check` | bestanden |
| Suche in `src/` nach `eval(`, `exec(`, `compile(`, `pickle`, `marshal`, `subprocess`, `os.system`, `__import__`, `import_module`, `open(` | keine Treffer außer `re.compile` |
| Suche in `src/` nach breiten `except`-Zweigen und nach Stellen, die Befunde ohne `_add` anhängen | `registry.py` Zeile 114 und 202 (gewollt), `engine.py` Zeile 258 (`findings.truncated`) und 394 (`_add`). Kein Zweig fängt die interne Ausnahme `_FindingLimit` ab. |

### Prüfskript mit `pip-audit` (O1)

Aufruf: `<Arbeitsverzeichnis>/components/pipwerk-studio/scripts/check --backend-port 18761 --frontend-port 18762 --with-audit` auf Commit `3717430` (Ausgabe: „checking … at commit 3717430022cd53c4c87a76cc6ea40c7db8895776“). Zwei Läufe, gleiches Ergebnis.

- `library: pip-audit`: 23 Pakete aus `packages/domain-core/uv.lock`, „No known vulnerabilities found“, bestanden.
- `backend: pip-audit`: „No known vulnerabilities found“, bestanden.
- Alle übrigen Schritte bestanden (Bibliothek, Backend, Suche nach der Schreibweise des Namens, `npm ci`, Typprüfung, Vitest, Bau, Browsertest mit 39 bestanden und 6 übersprungen).
- Gescheitert ist nur `frontend: npm audit`: `source-map-js` 1.0.0 bis 1.2.1, Schwere „high“, GHSA-68fv-2mgg-jv7q. Das ist der bekannte Befund der Oberfläche aus `docs/technical/pipwerk-studio.md`. Der geprüfte Commit ändert die Oberfläche nicht. Es ist kein Befund dieses Commits.

### Eigene Angriffsproben

Alle Proben liefen als `uv run --frozen python -c …` im Verzeichnis `packages/domain-core`. Nichts davon liegt im Repository oder im Arbeitsverzeichnis. Einstiegspunkte habe ich nur im Speicher nachgebildet (eigene `Distribution` über `sys.meta_path`), ohne Dateien.

| Probe | Ergebnis |
| --- | --- |
| B1: Kette von Berechnungen `c<i>` mit `c<i+1>.ergebnis + 1`, 124, 125, 200 und 998 Glieder, über `write_document` und `read_document` | kein Absturz, 998 Glieder: Prüfung 0,06 s, Normalisierung fehlerfrei. Gleiches Ergebnis in umgekehrter Reihenfolge und mit `C<i>.Ergebnis` in Großschreibung. |
| B1: Kreis aus 500 Berechnungen, Berechnung mit Bezug auf sich selbst | je ein Befund `calculation.circular_reference`, kein Absturz |
| B2: fehlerhafte Zeile `noeq` in `entry_points.txt` unter `[pipwerk.element_types]` und unter einer anderen Gruppe, Datei ohne Abschnitt | `create_registry()` liefert ein Register mit allen 30 mitgelieferten Typen, `check_strategy` arbeitet. Protokoll: „The entry points of the group pipwerk.element_types could not be read (TypeError)“, ohne Text und Pfad. Siehe aber N1. |
| H4: Einstiegspunkt `sys:exit` neben einem fehlenden Modul | beide als fehlgeschlagen protokolliert (`SystemExit`, `ModuleNotFoundError`), Register mit 30 Typen, Prozess läuft weiter |
| B3: `NaN`, `Infinity`, `-Infinity` als Risikogrenze und als Standardwert | abgelehnt als `DocumentError` („… is no JSON value“) |
| B3: `1e999`, `-1e999` als Risikogrenze, `1e999` als `x` | abgelehnt (`finite_number` beziehungsweise kein zulässiger Typ) |
| H5: Schlüssel `title` zweimal | abgelehnt („duplicate key in a JSON object“) |
| JSON 100 000 Ebenen tief (Liste), Objekt 90 000 Ebenen tief in einem Zusatzfeld | abgelehnt („nested too deep“), 0,01 s |
| Objekt 50 000 Ebenen tief als `x` und als Wert einer Belegung | abgelehnt als Fehler der Validierung, 0,3 s und 1,1 s, kein Absturz |
| Ganzzahl mit 4400 Ziffern | abgelehnt (Grenze von Python für Ganzzahlen aus Text) |
| B4: 480 Berechnungen mit `q+q+…` (2048 Namen), Dokument 2,15 MB | `read_document` 0,18 s, `check_strategy` 0,41 s, 1001 Befunde (981 `expression.invalid`, 20 `findings.truncated`), höchster Speicher des Prozesses 40 MB (Durchlauf 1: 14 s, 983 522 Befunde, 1064 MB). `normalize_strategy` ohne Grenze je Prüfung: 8,5 s, 55 MB. |
| B4: 480 Berechnungen mit `Konto+Konto+…` (682 Namen) | Prüfung 0,22 s, 1001 Befunde, 40 MB. Normalisierung 4,3 s, 55 MB. |
| Vergleich: 480 Berechnungen mit `1+1+…` (2048 Zahlen, ohne Befund), Dokument 2,15 MB | Prüfung 6,2 s, Normalisierung 6,7 s, 40 MB. Am vorher geprüften Commit mit derselben Probe: 8,2 s und 11,6 s. Die Rechenzeit an der Grenze von 2 MiB ist also nicht gestiegen. |
| Grenze je Ausdruck in Vorlagen: Vorlage Indikator und Vorlage Regel mit `Strategie.x+Strategie.x+…` (300 Namen) | **300 Befunde aus einem Ausdruck, kein `findings.truncated`**, siehe N2 |
| Neue reguläre Ausdrücke (`_TEXTS`, `_NAME_BEFORE_POINT` in `engine.py`, `_TOKEN` in `lexer.py`, `_NAME` in `namespaces.py`) mit 4095 Zeichen aus `"`, `"a`, `a."`, `x.`, offenen Texten und 100 000 Zeichen für `is_valid_name` | jeweils unter 1 ms, kein Rückverfolgen mit großem Aufwand |
| H2: `is_valid_name("ema20\n")` | `False` |
| H3: `еma20` mit kyrillischem `е`, `١٢ + 1`, `12٣ + 1` | `invalid_character` beziehungsweise `invalid_number`; `is_valid_name` mit kyrillischem `е` liefert `False` |
| Einzelnes Ersatzzeichen `\ud800` als Escape in einem Text | **angenommen, danach nicht als UTF-8 schreibbar**, siehe N3 |

## Nachprüfung der Befunde aus Durchlauf 1

| Befund | Ergebnis |
| --- | --- |
| B1 `RecursionError` bei Kette von Berechnungen | behoben. `_analyze_calculations` (`engine.py` Zeile 321 bis 364) analysiert die Berechnungen in der Reihenfolge der stark zusammenhängenden Komponenten (`graph.py`, ohne Rekursion). `_calculation_type` (`engine.py` Zeile 646 bis 656) ruft keine Analyse mehr auf. Kreise ergeben `calculation.circular_reference`. |
| B2 fehlerhafte Metadaten verhindern das Register | Wirkung behoben: Das Register entsteht mit allen mitgelieferten Typen. Rest: siehe N1. |
| B3 `NaN` und `Infinity` | behoben. Ablehnung beim Lesen von JSON-Text (`parse_constant`), an jedem Zahlenfeld (`FiniteFloat`), beim Schreiben `allow_nan=False`, in der Prüfung fester Werte `isfinite`. Neue Folge der Umstellung auf `json.loads`: siehe N3. |
| B4 Flut von Befunden | Wirkung behoben: Prüfung eines Dokuments von 2 MiB in 0,4 s mit 40 MB statt 14 s mit 1 GB. Rest: siehe N2. |
| O1 `pip-audit` | erledigt, keine bekannten Lücken (siehe oben) |
| H1 Tiefe über Vorzeichen und Operatoren | nicht Gegenstand der Korrektur, unverändert, der Hinweis bleibt |
| H2 `$` vor Zeilenumbruch | behoben (`fullmatch`) |
| H3 Namen und Zahlen nach Unicode | behoben (nur ASCII) |
| H4 `SystemExit` beim Laden | behoben |
| H5 doppelte Schlüssel | behoben |
| H6 Wertebereiche handelsrelevanter Werte | unverändert, der Hinweis bleibt. Ergänzung: Eine Risikogrenze mit 4000 Ziffern wird angenommen, `-5` und `1e308` ebenfalls, jeweils ohne Befund der Prüfung. |

## Befunde

### N1 – Fehlerhafte Metadaten eines Pakets verhindern weiterhin das Laden aller gültigen Einstiegspunkte (blockierend)

- Fundstelle: `packages/domain-core/src/pipwerk_domain/registry.py` Zeile 111 bis 120; `docs/technical/pipwerk-domain.md` Zeile 112
- Sachverhalt: `importlib.metadata.entry_points(group=…)` liest die Metadaten aller installierten Pakete in einem Aufruf. Scheitert das an einem einzigen Paket, fängt der Code die Ausnahme jetzt ab und gibt `LoadReport((), ())` zurück. Damit wird kein einziger Einstiegspunkt geladen, auch nicht die gültigen Einstiegspunkte anderer Pakete. Das Register enthält dann nur die mitgelieferten Typen.
- Nachweis: zwei nachgebildete Pakete. `goodpkg` mit `[pipwerk.element_types]` und `good = …`. Nur `goodpkg` installiert: `LoadReport(loaded=(), failed=('good',))`, der Einstiegspunkt wird also versucht (das Ziel ist in der Probe absichtlich nicht vorhanden). Dazu `badpkg` mit `[pipwerk.element_types]` und der Zeile `noeq`: `LoadReport(loaded=(), failed=())`, Protokoll „The entry points of the group pipwerk.element_types could not be read (TypeError)“. `good` wird gar nicht mehr versucht. Dasselbe gilt, wenn `noeq` in `badpkg` unter `[console_scripts]` steht, also in einer fremden Gruppe.
- Bezug: Auftrag Punkt 2: „Ein fehlerhafter Einstiegspunkt verhindert das Laden der übrigen nicht.“ Die technische Dokumentation sagt in Zeile 112 ausdrücklich: „Dasselbe gilt für fehlerhafte Metadaten der Einstiegspunkte irgendeines installierten Pakets (zum Beispiel eine Zeile ohne `=`, auch in einer anderen Gruppe)“. Das trifft für die übrigen Einstiegspunkte nicht zu. Ein beliebiges installiertes Paket mit fehlerhaften Metadaten schaltet damit alle Erweiterungen ab, ohne dass `LoadReport` einen fehlgeschlagenen Einstiegspunkt nennt. Der Satz in Zeile 112 ist außerdem so eingefügt, dass sich die folgenden Sätze („Er meldet nichts an …“) auf die Metadaten statt auf den Einstiegspunkt beziehen. Die Tests in `test_hardening.py` prüfen nur, dass das Register mit den mitgelieferten Typen entsteht, nicht das Laden gültiger Einstiegspunkte neben fehlerhaften Metadaten.

### N2 – Grenze von 50 Befunden je Ausdruck gilt nicht für Hinweise auf unbekannte Strategieparameter in Vorlagen (blockierend)

- Fundstelle: `packages/domain-core/src/pipwerk_domain/consistency/engine.py` Zeile 491 bis 505 (`_report`, Schleife über `analysis.names`)
- Sachverhalt: Die Grenze je Ausdruck sitzt in `_Checker._issue` (`checker.py`) und begrenzt nur die Probleme der Analyse. In einer für sich geprüften Vorlage erzeugt `_report` zusätzlich für jeden Namen mit einem unaufgelösten Teil (`Strategie.<unbekannt>`) einen Hinweis `rule.unresolved_name`. Diese Schleife zählt nicht gegen die Grenze je Ausdruck und setzt kein `findings.truncated` mit `scope` = `expression`. Begrenzt ist sie nur durch die Grenze von 1000 je Prüfung.
- Nachweis: Vorlage Indikator mit einer Eigenschaft `e` und dem Ausdruck `Strategie.x+Strategie.x+…` (300 Namen): `check_template` liefert 300 Befunde `rule.unresolved_name` für `property_definition:e` und keinen Befund `findings.truncated`. Vorlage Regel mit demselben Ausdruck und `> 0`: 300 Befunde. Gegenprobe Vorlage Regel mit `q+q+…` (300 unbekannte Namen): 50 Befunde und `findings.truncated`, wie festgelegt. Eine Vorlage Indikator mit 500 solcher Eigenschaften (Dokument 2,1 MB): `check_template` 1001 Befunde in 0,02 s. `normalize_template` (ohne Grenze je Prüfung) sammelt intern 170 500 Befunde, 3,0 s, höchster Speicher 104 MB.
- Bezug: Festlegung des Softwarearchitekten zu Sicherheit B4 im Übergabedokument („höchstens 50 Befunde je Ausdruck“), `docs/technical/pipwerk-domain.md` Zeile 407 und 471 („weitere entfallen, dazu kommt `findings.truncated`“). Die Wirkung auf den Ressourcenverbrauch ist durch die Grenze je Prüfung begrenzt. Die Festlegung und die Dokumentation sind für diese Art von Befund aber nicht erfüllt.

### N3 – Texte mit einzelnem Ersatzzeichen werden seit der Umstellung auf `json.loads` angenommen und lassen sich nicht als UTF-8 schreiben (blockierend)

- Fundstelle: `packages/domain-core/src/pipwerk_domain/documents/io.py` Zeile 39 und 63 bis 69 (`_load_json` mit `json.loads`), Zeile 84 (`json.dumps(…, ensure_ascii=False, …)`)
- Sachverhalt: Für B3 und H5 liest `parse_document` einen JSON-Text jetzt mit `json.loads` statt mit dem JSON-Leser von Pydantic. `json.loads` nimmt das Escape eines einzelnen Ersatzzeichens (`\ud800` bis `\udfff` ohne Partner) an und erzeugt daraus eine Zeichenkette, die kein gültiges Unicode ist. Die strengen Modelle nehmen sie an, die Konsistenzprüfung meldet nichts. `write_document` gibt sie wegen `ensure_ascii=False` unverändert aus. Das Ergebnis lässt sich nicht als UTF-8 kodieren.
- Nachweis: In `str-03.strategy.json` den Titel mit `\ud800` beginnen lassen. `read_document` nimmt das Dokument an, `check_strategy` liefert 0 Fehler. `write_document` liefert einen Text mit dem Zeichen U+D800. `.encode("utf-8")` auf diesem Text endet mit `UnicodeEncodeError`. Gegenprobe mit dem JSON-Leser des vorher geprüften Commits (`TypeAdapter(dict).validate_json(…, strict=True)`): `ValidationError` „Invalid JSON: unexpected end of hex escape“. Ein gültiges Paar (`😀`) wird von beiden richtig gelesen.
- Bezug: Sicherheitsregel 8.2 Nr. 2 (Validierung an der Systemgrenze), Auftrag Punkt 9 (streng; Schreiben und erneutes Lesen ergeben dasselbe Objekt), `docs/technical/pipwerk-domain.md` Zeile 437 („Geschrieben wird nur gültiges JSON“; „Text, der kein gültiges JSON ist“ wird abgelehnt). Ein Dokument, das die Bibliothek annimmt, lässt sich nicht als Datei oder HTTP-Antwort in UTF-8 ausgeben. Das Speichern einer solchen Strategie endet mit einer Ausnahme statt mit einem Fehler der Validierung. Das ist eine neue Lücke durch die Korrektur, im vorher geprüften Commit wurde ein solches Dokument abgelehnt. Kein Test deckt einzelne Ersatzzeichen ab.

## Hinweise

- H1 (aus Durchlauf 1, unverändert): Die Schachtelungstiefe zählt nur Klammern und Funktionsaufrufe. Vorzeichen und verkettete Operatoren ergeben Syntaxbäume mit mehreren tausend Ebenen. Die Bibliothek verarbeitet sie ohne Rekursion. `==`, `hash()` und `repr()` der eingefrorenen Knoten arbeiten aber rekursiv.
- H6 (aus Durchlauf 1, ergänzt): Wertebereiche handelsrelevanter Werte sind nicht festgelegt. Eine Risikogrenze von `-5`, `1e308` oder einer Ganzzahl mit 4000 Ziffern besteht Validierung und Konsistenzprüfung ohne Befund. Das ist eine Frage an Spezifikation oder Auftrag.

## Geprüft ohne Befund

- Schutz vor Kreisen und Ketten zwischen Berechnungen ohne Rekursion; Tarjan in `graph.py` ohne Rekursion.
- Abbruch der Prüfung an der Grenze von 1000 Befunden über die interne Ausnahme `_FindingLimit`. Sie wird nur in `check_strategy` und `check_template` abgefangen, sonst nirgends.
- Freigabe des Syntaxbaums nach dem Melden (`Analysis.release`) und Normalisierung über `parsed_ok`.
- Neuer Lexer mit einem regulären Ausdruck: nur ASCII für Namen und Zahlen, keine aufwendige Rückverfolgung.
- Fehlermeldungen beim Lesen: `_error` setzt `input` auf `None`, die Meldungen enthalten weder den Eingabetext noch einen Pfad.
- Protokoll beim Scheitern der Metadaten: nur Gruppe und Klasse der Ausnahme, kein Text, kein Pfad.
- `RUF001` ist nur für `tests/**` abgeschaltet, nicht für `src/`.
- Keine festen Pfade, Ports, Rechnernamen oder Zugangsdaten im Diff zwischen `df8a287` und `b12816c` (Suche in den hinzugefügten Zeilen; Treffer nur für den Namen `_TOKEN` im Lexer). Die Lockdatei ist unverändert gültig (`uv lock --check`).
