# Testbericht Sicherheit – Auftrag 01, Durchlauf 1

- Vorhaben: `strategiedesign`, Arbeitspaket `wp01`, ref `strategiedesign/wp01`
- geprüfter Commit: `df8a287a070264a3236eb4b39911cd608b7b3eed` (Zweig `strategiedesign/wp01-01`)
- Prüfauftrag: `development/strategiedesign/wp01/tests/01-1-order.md` auf `strategiedesign/wp01`
- Prüfskript: nicht verwendet. Das Prüfskript `components/pipwerk-studio/scripts/check` nimmt die Bibliothek im geprüften Commit noch nicht auf; das ergänzt der Tester Funktion. Ich habe die Befehle aus Abschnitt 12 der technischen Dokumentation der Bibliothek einzeln ausgeführt.
- Grundlagen: Auftrag 01, Spezifikation Abschnitte 3 und 8, Entwicklungs-, Test- und Sicherheitsregeln (Abschnitte 5, 8, 9), `docs/technical/pipwerk-domain.md`, BSI CON.8 und APP.7, OWASP ASVS (Eingabevalidierung, Fehlerbehandlung, Protokollierung, Abhängigkeiten), OWASP API Security Top 10 (API4 Ressourcenverbrauch)

## Ergebnis

**nicht bestanden**

Vier blockierende Befunde (B1 bis B4), ein nicht erfüllter Prüfschritt (O1, `pip-audit`), sechs Hinweise.

## Ausgeführte Prüfungen

Alle Befehle liefen im Arbeitsverzeichnis des Testers, Verzeichnis `packages/domain-core`, auf dem geprüften Commit (`git rev-parse HEAD` = `df8a287a070264a3236eb4b39911cd608b7b3eed`).

| Prüfung | Ergebnis |
| --- | --- |
| `uv sync --frozen` | bestanden |
| `uv run --frozen pytest` | 792 bestanden |
| `uv run --frozen ruff check` | bestanden („All checks passed!“), Regelgruppe `S` (Sicherheit) ist aktiv |
| `uv run --frozen ruff format --check` | bestanden |
| `uv run --frozen mypy` (streng) | bestanden, 46 Dateien |
| `python -m pipwerk_domain.documents.schemas --check ../../contracts/strategies/v1` | bestanden |
| `uv lock --check` | bestanden, Sperrdatei passt zu `pyproject.toml` |
| Suche nach `eval`, `exec`, `compile`, `pickle`, `marshal`, `subprocess`, `os.system`, `__import__`, `import_module`, `open(` in `src/` | keine Treffer |
| Suche im Diff nach Pfaden des Entwicklungsrechners, Zugangsdaten, Schlüsseln | keine Treffer |
| `pip-audit` auf `uv.lock` | **nicht ausgeführt**, siehe O1 |

Eigene Angriffsproben (jeweils mit `uv run --frozen python -c …`, nichts davon im Repository):

| Probe | Ergebnis |
| --- | --- |
| Zerleger: 4000 Vorzeichen, 2048 verkettete `+`, 4096 Ziffern, 4094 Zeichen Text, 64 und 65 Klammern, 1000 offene Funktionsaufrufe | kein Absturz, jeweils unter 0,02 s; 65 Klammern und 1000 Aufrufe ergeben `too_deep` |
| Zerleger ohne `eval` | bestätigt: von Hand geschriebener Lexer und Parser ohne Rekursion (`parser.py`, `lexer.py`), Typprüfung über `postorder` ohne Rekursion (`nodes.py` Zeile 77 bis 87) |
| JSON 5000 Ebenen tief, Objekt 3000 Ebenen tief | abgelehnt als `json_invalid` (Grenze des JSON-Parsers von Pydantic) |
| zusätzliches Feld, Hauptversion `2.0`, UUID in Großbuchstaben, UUID oder Version mit Zeilenumbruch | abgelehnt |
| Ganzzahl mit 4400 Ziffern | abgelehnt (`number out of range`) |
| Regelwerke 16 Ebenen geschachtelt | geprüft ohne Fehler |
| Kette von 200 Regeln, die je die nächste verwenden, in der Strategie und in einem Indikator | geprüft ohne Absturz |
| Ablauf mit 1000 Elementen und 4000 Verbindungen voller Kreise | 0,06 s |
| 480 Berechnungen mit Ausdrücken von 3995 Zeichen (Dokument 1,99 MB) | 2,7 s |
| Kette von Berechnungen | **Absturz ab 125 Gliedern**, siehe B1 |
| fehlerhafte Einstiegspunkte (nachgebildet und als echtes Paket in einem temporären Verzeichnis) | siehe B2 und H4 |
| `NaN`, `Infinity`, `1e999` als Zahl | **angenommen**, siehe B3 |
| 480 Ausdrücke aus 2048 unbekannten Namen (Dokument 2,05 MB) | **14 s, 1064 MB, 983 522 Befunde**, siehe B4 |

Das temporäre Verzeichnis der Probe zu B2 hat Python selbst wieder entfernt (`tempfile.TemporaryDirectory`). Eine Hilfsdatei für `pip-audit` im Berichtsverzeichnis habe ich wieder gelöscht.

## Befunde

### B1 – Konsistenzprüfung bricht bei einer Kette von Berechnungen mit `RecursionError` ab (blockierend)

- Fundstelle: `packages/domain-core/src/pipwerk_domain/consistency/engine.py` Zeile 513 bis 536 (`_element_symbol`, `_calculation_type`), `packages/domain-core/src/pipwerk_domain/expressions/symbols.py` Zeile 45 bis 56 (`Symbol.value_type`), `packages/domain-core/src/pipwerk_domain/consistency/engine.py` Zeile 306 bis 320 (`analyze_cached`)
- Sachverhalt: Den Ergebnistyp einer Berechnung ermittelt die Prüfung erst bei Bedarf. Verwendet der Ausdruck der Berechnung `c0` das Ergebnis von `c1`, dieser das von `c2` und so weiter, ruft jede Stufe `analyze` erneut auf, bevor die vorige fertig ist. Je Glied entstehen acht Python-Aufrufe (`analyze_cached`, `analyze`, `run`, `_type_of`, `_name`, `value_type`, `<lambda>`, `_calculation_type`). Ab 125 Gliedern ist die Rekursionsgrenze von Python überschritten.
- Nachweis: Strategie mit einem Auslöser `trigger.tick` und n Berechnungen `c<i>` mit Ausdruck `c<i+1>.ergebnis + 1`. `read_document` nimmt das Dokument an, es hält alle Begrenzungen aus Punkt 10 ein (bei n = 200 sind es 38 KB). `check_strategy` liefert bei n = 124 ein Ergebnis und endet bei n = 125, 200, 400 und 999 mit `RecursionError: maximum recursion depth exceeded`. `normalize_strategy` nutzt dieselbe Prüfung.
- Bezug: Auftrag Punkt 10 und Spezifikation Abschnitt 8 (Schutz gegen Überlast, OWASP API4), Prüfauftrag „Verhalten bei sehr langen, tief geschachtelten oder bösartigen Eingaben (Rekursion …)“. Ein gültiges Dokument innerhalb aller Begrenzungen bringt die Konsistenzprüfung zum Absturz statt zu Befunden. Die Konsistenzprüfung läuft nach Spezifikation 4.2 bei jedem Speichern und bei `POST /api/v1/check`. Abschnitt 7 und 11 der technischen Dokumentation sagen, tiefe Eingaben erschöpften den Stapel nicht. Für die Konsistenzprüfung trifft das nicht zu. Kein Test prüft lange Ketten zwischen Ausdrücken.

### B2 – Ein Paket mit fehlerhaften Metadaten der Einstiegspunkte verhindert das ganze Register (blockierend)

- Fundstelle: `packages/domain-core/src/pipwerk_domain/registry.py` Zeile 111 bis 115 (`entry_points(group=…)` und die Schleife stehen außerhalb von `try`), `packages/domain-core/src/pipwerk_domain/defaults.py` Zeile 9 bis 22
- Sachverhalt: Nur `entry_point.load()` und das Anmelden sind gegen Fehler geschützt. Das Lesen der Einstiegspunkte aus den Metadaten der installierten Pakete ist es nicht. Enthält die Datei `entry_points.txt` irgendeines installierten Pakets eine Zeile ohne `=`, wirft `importlib.metadata.entry_points()` eine Ausnahme. Das gilt auch für eine andere Gruppe als `pipwerk.element_types`. `create_registry()` und `default_registry()` enden dann mit dieser Ausnahme. Es entsteht kein Register, auch nicht mit den mitgelieferten Typen. `check_strategy` und `check_template` ohne eigenes Register sind damit unbenutzbar.
- Nachweis: temporäres Paket `evilpkg-1.0.dist-info` auf `sys.path`. Mit `entry_points.txt` = `[pipwerk.element_types]` und den Einträgen `missing = nonexistent_mod_xyz:attr`, `bad = !!!not valid`, `raiser = evil_mod_q` (Modul wirft beim Import) gilt: Register mit 30 Typen, drei Warnungen nur mit Name und Ausnahmeklasse (`ModuleNotFoundError`, `AttributeError`, `RuntimeError`), kein Ausnahmetext, kein Pfad. Das ist richtig. Mit einer Zeile `noeq` unter `[pipwerk.element_types]` oder unter `[other.group]` gilt: `create_registry()` wirft `TypeError: Pair.__new__() missing 1 required positional argument: 'value'` (Aufrufstelle `defaults.py` Zeile 15), kein Register, keine Warnung.
- Bezug: Auftrag Punkt 2 („Ein fehlerhafter Einstiegspunkt verhindert das Laden der übrigen nicht“), Prüfauftrag „Einstiegspunkt `pipwerk.element_types` (fehlerhafte Pakete …)“, Abschnitt 3.3 der technischen Dokumentation. Die Tests in `test_registry.py` decken nur Fehler beim Laden ab, nicht Fehler beim Lesen der Metadaten.

### B3 – `NaN` und `Infinity` werden als Zahl angenommen, geschrieben wird dann kein gültiges JSON (blockierend)

- Fundstelle: `packages/domain-core/src/pipwerk_domain/documents/models.py` Zeile 76, 107, 125 (`bool | int | float | str`), Zeile 163 und 164 (`x`, `y`), `packages/domain-core/src/pipwerk_domain/documents/io.py` Zeile 40 und 55, `packages/domain-core/src/pipwerk_domain/consistency/engine.py` Zeile 1275 und 1276 (`_fixed_problem`)
- Sachverhalt: Die strengen Modelle nehmen die JSON-fremden Werte `NaN`, `Infinity` und `-Infinity` sowie `1e999` (wird `inf`) als Zahl an. Die Konsistenzprüfung meldet nichts. `write_document` schreibt sie mit `json.dumps` als `NaN` und `Infinity`. Das ist kein gültiges JSON nach RFC 8259. Das Schema unter `contracts/strategies/v1/` kann solche Werte nicht beschreiben. Ein Dokument, das die Bibliothek annimmt und schreibt, entspricht damit weder JSON noch dem eigenen Vertrag. Ein strenger JSON-Leser, zum Beispiel `JSON.parse` im Browser, lehnt es ab. Bei `NaN` ergibt Schreiben und erneutes Lesen nicht dasselbe Objekt, weil `NaN` ungleich `NaN` ist.
- Nachweis: In `str-03.strategy.json` den Wert der Risikogrenze von `risiko` (`0.01`) durch `Infinity` oder `NaN` ersetzt. `read_document` nimmt das Dokument an. `check_strategy` liefert 0 Fehler. In der Ausgabe von `write_document` findet ein strenger Leser (`json.loads` mit `parse_constant`, der abbricht) die Konstante `Infinity` beziehungsweise `NaN`. `parse_document` mit einem Python-Objekt nimmt `x = nan` ebenfalls an.
- Bezug: Sicherheitsregeln 8.2 Nr. 2 und 3 (Validierung an der Systemgrenze; handelsrelevante Werte nicht ohne Prüfung der Wertebereiche), Abschnitt 9 Zeile „Pydantic“ (Grenzwerte und ungültige Werte testen), Auftrag Punkt 9 (streng; Schreiben und erneutes Lesen ergeben dasselbe Objekt), Prüfauftrag „strenge Validierung der Dokumente“. Die Risikogrenze bestimmt das Volumen jeder Order.

### B4 – Ein Dokument von 2 MiB erzeugt fast eine Million Befunde, 14 s Rechenzeit und 1 GB Speicher (blockierend)

- Fundstelle: `packages/domain-core/src/pipwerk_domain/expressions/checker.py` Zeile 244 bis 251 (ein Befund je unbekanntem Namen), `packages/domain-core/src/pipwerk_domain/consistency/engine.py` Zeile 352 bis 371 (`_report` übernimmt jeden Befund eines Ausdrucks), `packages/domain-core/src/pipwerk_domain/limits.py`
- Sachverhalt: Die Begrenzungen aus Punkt 10 sind umgesetzt. Die Zahl der Befunde je Ausdruck und je Dokument ist aber unbegrenzt. Ein Ausdruck von 4095 Zeichen kann 2048 unbekannte Namen enthalten und ergibt dann 2048 Befunde. 480 solche Berechnungen passen in 2 MiB.
- Nachweis: Strategie mit 480 Berechnungen, Ausdruck `q+q+…+q` (2048 Namen), Dokument 2 047 817 Bytes. `read_document`: 0,19 s, 35 MB. `check_strategy`: 13,96 s, 983 522 Befunde, höchster Speicherbedarf des Prozesses 1064 MB. Die Angaben der Befunde als JSON: 105 MB. Mit `Konto+Konto+…` (682 Namen, Objekt ohne Wert): 6 s, 327 842 Befunde, 1487 MB.
- Bezug: Spezifikation Abschnitt 8 (Begrenzungen gegen Überlast, OWASP API4 Unrestricted Resource Consumption), Prüfauftrag „Verhalten bei … bösartigen Eingaben (… Laufzeit, Speicher)“. Die Grenze von 2 MiB je Dokument soll den Aufwand begrenzen. Hier wird sie um mehr als das 500-Fache beim Speicher übertroffen. `POST /api/v1/check` und Speichern sind nach Spezifikation 8 ohne Anmeldung erreichbar. Wenige gleichzeitige Anfragen erschöpfen den Speicher des Backends.

## Nicht erfüllter Prüfschritt

### O1 – `pip-audit` auf `packages/domain-core/uv.lock` nicht ausgeführt

- Bezug: Prüfauftrag „neue Abhängigkeiten mit `pip-audit` auf `packages/domain-core/uv.lock`“, Sicherheitsregeln 8.2 Nr. 9 und 5 Nr. 12
- Bereits geprüft: Die Liste der festgeschriebenen Pakete habe ich mit `uv export --frozen --all-groups --no-emit-project` ermittelt (23 Pakete). Laufzeit: `pydantic` 2.13.5, `pydantic-core` 2.46.5, `annotated-types` 0.8.0, `typing-extensions` 4.16.0, `typing-inspection` 0.4.4. Diese Versionen stimmen mit `components/pipwerk-studio/backend/uv.lock` überein. Neu im Repository sind nur Werkzeuge der Entwicklung: `jsonschema` 4.26.0, `jsonschema-specifications` 2025.9.1, `referencing` 0.37.0, `rpds-py` 2026.9.1, `attrs` 26.1.0, `types-jsonschema` 4.26.0.20261006; dazu neuere Fassungen von `mypy` 2.4.0, `ruff` 0.17.1, `librt` 0.16.0, `ast-serialize` 0.13.0. Alle Pakete stammen von `https://pypi.org/simple` und tragen Hashwerte. `uv lock --check` ist bestanden. Lizenzen und Zweck stehen in Abschnitt 13 der technischen Dokumentation.
- Was fehlt: Der Aufruf `uvx pip-audit …` ist in meiner Umgebung nicht freigegeben. Jeder Versuch wurde von der Freigabe der Sitzung abgelehnt. Das Ergebnis von `pip-audit` liegt für diesen Commit deshalb nicht vor. Aus diesem Bericht folgt keine Aussage über bekannte Sicherheitslücken der Abhängigkeiten.
- Benötigt: Freigabe von `uvx pip-audit` für den Tester Sicherheit oder Ausführung durch eine Rolle, die es darf. Zuständig: Softwarearchitekt.

## Hinweise

- H1 Schachtelungstiefe nur über Klammern: `MAX_EXPRESSION_NESTING` zählt Klammern und Funktionsaufrufe (`expressions/__init__.py` Zeile 23 bis 46, `parser.py` Zeile 166 und 233). Vorzeichen und Operatoren zählen nicht. `-` 4000-mal vor einer Zahl ergibt einen Syntaxbaum mit 4001 Ebenen, 2048 verkettete `+` einen mit 2048 Ebenen. Die Bibliothek verarbeitet Bäume ohne Rekursion, das ist heute kein Problem. Die Knoten sind aber eingefrorene `dataclass`-Objekte. Ein Vergleich (`==`), `hash()` oder `repr()` eines solchen Baums arbeitet rekursiv und würde abbrechen. Die technische Dokumentation, Abschnitt 11, nennt die Bedeutung der Grenze richtig.
- H2 `is_valid_name` (`namespaces.py` Zeile 31 und 37) prüft mit `^…$` und `re.match`. In Python passt `$` auch vor einem Zeilenumbruch am Ende. `is_valid_name("ema20\n")` liefert `True`. Ein solcher Name ist in keinem Ausdruck ansprechbar.
- H3 Namen und Zahlen nach Unicode: `\w` und `\d` (`lexer.py` Zeile 39 und 40, `namespaces.py` Zeile 31) lassen Buchstaben und Ziffern aller Schriften zu. `еma20` mit kyrillischem `е` ist ein gültiger Name und sieht aus wie `ema20`. `١٢ + 1` (arabisch-indische Ziffern) wird als Zahl 12 gelesen.
- H4 Ein Einstiegspunkt, dessen Modul beim Laden `SystemExit` auslöst, beendet `load_entry_points` (`registry.py` Zeile 120 fängt nur `Exception`). Die übrigen Einstiegspunkte werden nicht geladen, der Prozess endet. Nachweis mit nachgebildetem Einstiegspunkt: `SystemExit` gelangt bis zum Aufrufer.
- H5 Doppelte Schlüssel in einem JSON-Objekt sind erlaubt, der letzte Wert gilt (`"title":"x","title":"y"` ergibt `y`). Andere JSON-Leser können den ersten Wert nehmen.
- H6 Wertebereiche handelsrelevanter Werte: Eine Risikogrenze von `-5` oder `1e308` besteht Validierung und Konsistenzprüfung ohne Befund. Spezifikation und Auftrag legen keine Wertebereiche fest. Sicherheitsregel 8.2 Nr. 3 verlangt die Prüfung zulässiger Wertebereiche für handelsrelevante Werte. Das ist eine Frage an Spezifikation oder Auftrag, kein Fehler dieses Commits.

## Geprüft ohne Befund

- Zerlegung von Ausdrücken: eigener Lexer und Parser, kein `eval`, `exec`, `compile` und kein Parsergenerator; der Test `test_architecture.py` sichert das ab.
- Begrenzungen aus Auftrag Punkt 10: alle Werte als Konstanten in `limits.py`, geprüft beim Lesen (`models.py`): Länge und Tiefe von Ausdrücken auch in Belegungen, Elemente, Verbindungen, Regeln je Liste, Strategieparameter, Schachtelung von Instanzen vor dem Aufbau der Modelle ohne Rekursion (`_check_nesting`). `MAX_DOCUMENT_BYTES` ist als Konstante vorhanden.
- Strenge Validierung: `extra="forbid"` und `strict=True` an allen Modellen, UUID-Muster, Hauptversion über Muster `^1\.[0-9]+$`.
- Protokoll des Einstiegspunkts: nur Name (mit `%r`, ein Zeilenumbruch im Namen erscheint als `\n` und kann keine Zeile einschleusen) und Klasse der Ausnahme, kein Ausnahmetext, keine Rückverfolgung, kein Pfad.
- Keine festen Pfade, Ports, Rechnernamen, Zugangsdaten im Commit. Der Befehl der Schemata schreibt nur in das übergebene Verzeichnis.
- Abhängigkeiten zur Laufzeit nur Pydantic in der Version von pipwerk Studio (2.13.5).

## Festlegungen des Entwicklers (Abschnitt 14 der technischen Dokumentation)

Aus Sicht der Sicherheit widerspricht keine der genannten Festlegungen dem Auftrag, der Spezifikation oder den Sicherheitsregeln. Die zusätzlichen Befunde (`rule.unresolved_name`, `connection.invalid`, `parameter.binding_invalid`, `name.invalid`, `element.rules_not_allowed`, `element.management_invalid`, `rule.invalid_type`, `rule.comparison_missing`) vergrößern die Zahl möglicher Befunde je Dokument. Sie sind in B4 mit berücksichtigt, aber nicht dessen Ursache.
