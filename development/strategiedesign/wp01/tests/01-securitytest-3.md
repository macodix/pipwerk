# Testbericht Sicherheit – Auftrag 01, Durchlauf 3 (Nachprüfung)

- Vorhaben: `strategiedesign`, Arbeitspaket `wp01`, ref `strategiedesign/wp01`
- Übergabedokument: `strategiedesign/wp01:development/strategiedesign/wp01/tests/01-3-order.md`
- geprüfter Commit: `6859b00c09e6126c5cc9f33eed3a3019408a20b4` (Zweig `strategiedesign/wp01-01`)
- vorher geprüfter Commit: `b12816c225bf8fa2fea50acca43e725126e6054b` (Bericht `01-securitytest-2.md`)
- Umfang: Nachprüfung nach „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Befunde aus Durchlauf 2 und die dafür geänderten Stellen. Nur blockierende Befunde verhindern das Bestehen.
- Grundlagen: Auftrag 01, Festlegungen des Softwarearchitekten im Übergabedokument, Entwicklungs-, Test- und Sicherheitsregeln, `docs/technical/pipwerk-domain.md`, BSI CON.8 und APP.7, OWASP ASVS (Eingabevalidierung, Fehlerbehandlung), OWASP API Security Top 10 (API4 Ressourcenverbrauch)

## Ergebnis

**bestanden**

Die drei blockierenden Befunde aus Durchlauf 2 (N1, N2, N3) sind behoben. In den dafür geänderten Stellen habe ich keinen neuen blockierenden Befund gefunden. Die Zahl der blockierenden Befunde sinkt von 3 auf 0. Es bleiben drei Hinweise: H1 (eingeschränkt), H6 (unverändert) und H7 (neu, nicht blockierend).

## Ausgeführte Prüfungen

Vor der Prüfung kontrolliert: `git rev-parse HEAD` im eigenen Arbeitsverzeichnis ergab `6859b00c09e6126c5cc9f33eed3a3019408a20b4`. `git status --short` ist vor und nach der Prüfung leer. Geändert sind gegenüber `b12816c` nur `docs/technical/pipwerk-domain.md`, `engine.py`, `io.py`, `checker.py`, `lexer.py`, `nodes.py`, `parser.py`, `normalize.py`, `registry.py`, `test_hardening.py` und der neue `test_hardening_2.py` (`git diff --stat`).

### Befehle in `packages/domain-core` auf dem geprüften Commit

| Befehl | Ergebnis |
| --- | --- |
| `uv sync --frozen` | bestanden |
| `uv run --frozen pytest` | 940 bestanden |
| `uv run --frozen ruff check` | „All checks passed!“ |
| `uv run --frozen ruff format --check` | „49 files already formatted“ |
| `uv run --frozen mypy` | „Success: no issues found in 48 source files“ |
| `uv run --frozen python -m pipwerk_domain.documents.schemas --check ../../contracts/strategies/v1` | bestanden |
| `uv lock --check` | bestanden |
| `git diff --stat b12816c 6859b00 -- packages/domain-core/uv.lock packages/domain-core/pyproject.toml` | keine Änderung. Das Ergebnis von `pip-audit` aus Durchlauf 2 („No known vulnerabilities found“) gilt deshalb für dieselben Abhängigkeiten. `pip-audit` habe ich in diesem Durchlauf nicht erneut ausgeführt. |
| Suche in `src/` nach `eval(`, `exec(`, `pickle`, `marshal`, `subprocess`, `os.system`, `__import__`, `import_module` | keine Treffer |
| Suche in den hinzugefügten Zeilen des Diffs nach festen Pfaden, `localhost`, `127.0`, `password`, `secret`, API-Schlüsseln | keine Treffer |

### Eigene Angriffsproben

Alle Proben liefen als `uv run --frozen python -c …` im Verzeichnis `packages/domain-core`. Pakete mit Metadaten habe ich in temporären Verzeichnissen außerhalb des Repositorys angelegt, die nach jeder Probe gelöscht wurden. Nichts davon liegt im Repository oder im Arbeitsverzeichnis.

| Probe | Ergebnis |
| --- | --- |
| N1: gültiges Paket `goodpkg` neben einem Paket mit der Zeile `noeq` in `[pipwerk.element_types]`, in `[console_scripts]`, ohne Abschnitt, mit ungültigem UTF-8 in `entry_points.txt`, ohne `METADATA`, mit einem Verzeichnis statt `entry_points.txt` | in jedem Fall `LoadReport(loaded=('good',), failed=())`, der Typ des gültigen Pakets ist im Register, `EMA` ebenfalls. Protokoll nur mit Paketname (bei fehlendem Namen `'?'`) und Klasse der Ausnahme (`TypeError`, `UnicodeDecodeError`), ohne Pfad und ohne Inhalt der Metadaten. |
| N1: Paketname mit Schrägstrichen und `\n` im Text | wird mit `%r` maskiert protokolliert, kein Pfad des temporären Verzeichnisses im Protokoll |
| N1: dasselbe Paket zweimal, die erste Fundstelle fehlerhaft, die zweite gültig | die gültige zweite Fundstelle wird nicht geladen. Das entspricht `importlib.metadata`: Dort gilt die erste Fundstelle eines Pakets (die Gegenprobe `entry_points(group=…)` scheitert an derselben Fundstelle mit `TypeError`). Kein Befund. |
| N2: Vorlage Indikator, Vorlage Regel und Vorlage Trend mit `Strategie.x+…` (300 Namen) | je 50 `rule.unresolved_name` und ein `findings.truncated` mit `scope` = `expression`, `limit` = 50 |
| N2: gemischt 49 `q` und 300 `Strategie.x`; 50 `q` und 1 `Strategie.x`; 300 `q` | je 50 Befunde des Ausdrucks und ein `findings.truncated` |
| N2: Vorlage Indikator mit 500 Eigenschaften zu je 300 `Strategie.x` | `check_template` 1001 Befunde in 0,08 s; `normalize_template` 0,26 s, mit `strategie.x` in Kleinschreibung (Umschreibung nötig) 0,86 s |
| N3: Escape `\ud800` im Titel, `\udfff` in `description`, umgekehrtes Paar `\ude00\ud83d` | `DocumentError` |
| N3: dasselbe als Python-Objekt (Wert, Schlüssel, verschachtelt in `elements`) | `DocumentError` |
| N3: Objektmodell mit Titel `\udbff`, dann `write_document` | `DocumentError` statt `UnicodeEncodeError` |
| N3: gültiges Paar `😀`, `\u0000` im Text, Umlaut als UTF-8-Bytes | angenommen, als UTF-8 schreibbar, erneutes Lesen ergibt dasselbe Objekt |
| Bytes: UTF-8 mit BOM, UTF-16-LE und UTF-32-BE ohne BOM, Ersatzzeichen als Bytes `ED A0 80`, überlange Folge `C0 AF`, `bytearray` | jeweils `DocumentError` |
| Text mit vorangestelltem `U+FEFF` | `DocumentError` |
| `PREVIOUS`: 998 Berechnungen als Kette mit `PREVIOUS(c<i+1>.ergebnis) + c<i+1>.ergebnis`; Kreis nur über `PREVIOUS`; Kette mit `previous ( C<i+1>.Ergebnis ; 2 ) + …`; umgekehrte Kette | kein Absturz, Prüfung unter 0,1 s, Normalisierung fehlerfrei; kein `calculation.circular_reference` bei Bezügen nur über `PREVIOUS` |
| `PREVIOUS` mit ungültigem Argument im Kreis: `PREVIOUS(c.ergebnis + 1)`, `PREVIOUS((c.ergebnis))`, `PREVIOUS(q + c.ergebnis)` | kein Absturz; 998 beziehungsweise 1000 `expression.invalid`, beim zweiten zusätzlich `calculation.circular_reference`. Die Fälle sind ohnehin ungültig (`PREVIOUS` verlangt einen Namen, `pipwerk-domain.md` Zeile 552). |
| Neue reguläre Ausdrücke `_PREVIOUS_NAME` (`engine.py`), `_NAME_TEXT` und `_STRING_TEXT` (`checker.py`) mit Eingaben von etwa 4096 Zeichen: `PREVIOUS` mit Leerzeichen, `PREVIOUS(` wiederholt, `a.` wiederholt, `a…a(`, Anführungszeichen, Namen mit Leerzeichen | jeweils höchstens 4 ms, kein Rückverfolgen mit großem Aufwand |
| Normalisierung an der Grenze von 2 MiB (441 Berechnungen, Ausdrücke von 4085 bis 4091 Zeichen), je drei Läufe | `q+…+KONTO`: 5,0 s; `q*…*KONTO`: 5,0 bis 5,3 s; `1+…+KONTO`: 3,2 s; `if(1;1;1)+…`: 2,9 s; `-…-KONTO`: 3,2 s; `konto.kapital+…`: 0,9 s. Höchster Speicher des Prozesses 45 MB. |
| Vergleich: Prüfung derselben Dokumente | `1+…+1` ohne Befund: 5,0 s; `-…-KONTO`: 5,2 s; `konto.kapital+…`: 1,8 s; bei vielen Befunden 0,2 bis 0,4 s (Ende an der Grenze von 1000 Befunden). Die Normalisierung liegt damit im ungünstigsten Fall in der Größenordnung der ungünstigsten Prüfung (je etwa 5 s), wie festgelegt. Durchlauf 2: Normalisierung bis 8,5 s. |
| Syntaxbaum aus `-` × 4080 und `1` (Knoten mit `eq=False`) | `==` vergleicht nur die Identität, `hash()` arbeitet; `repr()` endet mit `RecursionError` |
| Python-Objekt mit einer Liste, die sich selbst enthält, in `elements`, an `parse_document` | **läuft ohne Ende**, siehe H7 |

## Nachprüfung der Befunde aus Durchlauf 2

| Befund | Ergebnis |
| --- | --- |
| N1 fehlerhafte Metadaten eines Pakets verhindern alle Einstiegspunkte | behoben. `_installed_entry_points` (`registry.py` Zeile 191 bis 229) liest die Pakete über `distributions()` einzeln, jedes in einem eigenen Schutz. Gültige Einstiegspunkte anderer Pakete werden geladen (Proben oben). Die Dokumentation (`pipwerk-domain.md` Zeile 112) beschreibt das jetzt zutreffend; der Bezug der folgenden Sätze auf den Einstiegspunkt ist richtiggestellt („Ein fehlerhafter Einstiegspunkt meldet nichts an …“). Tests: `test_hardening_2.py` Zeile 66 bis 123. |
| N2 Grenze je Ausdruck gilt nicht für Hinweise in Vorlagen | behoben. `_report` (`engine.py` Zeile 473 bis 532) zählt die Hinweise `rule.unresolved_name` mit den Problemen der Analyse zusammen und setzt danach einmal `findings.truncated`. Dokumentation `pipwerk-domain.md` Zeile 471 angepasst. Tests: `test_hardening_2.py` Zeile 129 bis 154. |
| N3 einzelne Ersatzzeichen werden angenommen | behoben. `parse_document` lehnt einzelne Ersatzzeichen in Schlüsseln und Werten ab (`io.py` Zeile 44 und 48 bis 61), auch bei einem Python-Objekt. `document_to_json` lehnt sie beim Schreiben ab (`io.py` Zeile 110 bis 113). Bytes müssen UTF-8 ohne BOM sein (`io.py` Zeile 88 bis 92). Dokumentation `pipwerk-domain.md` Zeile 437 angepasst. Tests: `test_hardening_2.py` Zeile 164 bis 221. |
| H1 rekursive `==`, `hash()` und `repr()` der Knoten | eingeschränkt: `==` und `hash()` arbeiten jetzt über die Identität (`eq=False`, `nodes.py`), ohne Rekursion. `repr()` bleibt rekursiv. Der Hinweis bleibt für `repr()`. |
| H6 Wertebereiche handelsrelevanter Werte | nicht Gegenstand der Korrektur, unverändert, der Hinweis bleibt |

## Befunde

Keine blockierenden Befunde.

## Hinweise

- H1 (aus Durchlauf 1, eingeschränkt): Die Schachtelungstiefe zählt nur Klammern und Funktionsaufrufe. Vorzeichen und verkettete Operatoren ergeben Syntaxbäume mit mehreren tausend Ebenen. `repr()` eines solchen Baums endet mit `RecursionError` (Probe oben). Die Bibliothek ruft `repr()` der Knoten selbst nicht auf; betroffen wäre nur eine Ausgabe zur Fehlersuche.
- H6 (aus Durchlauf 1, unverändert): Wertebereiche handelsrelevanter Werte sind nicht festgelegt. Das ist eine Frage an Spezifikation oder Auftrag.
- H7 (neu, nicht blockierend): `_reject_lone_surrogates` (`packages/domain-core/src/pipwerk_domain/documents/io.py` Zeile 48 bis 61) durchläuft ein übergebenes Python-Objekt ohne Merkliste bereits besuchter Objekte. Enthält eine Liste sich selbst, läuft `parse_document` ohne Ende (Probe: nach 5 s stand der Prozess in `io.py` Zeile 57, Abbruch von außen). Mehrfach eingehängte gleiche Listen werden entsprechend oft durchlaufen, bei tiefer Schachtelung exponentiell oft. Im vorher geprüften Commit hat die Validierung mit Pydantic dasselbe Objekt mit einem `ValidationError` abgelehnt (Gegenprobe mit `_ADAPTER.validate_python` auf dem geprüften Commit). Nicht blockierend, weil ein aus JSON gelesenes Objekt weder Kreise noch geteilte Teile enthält und es im geprüften Stand keinen Aufrufer außerhalb der Bibliothek gibt (Suche nach `parse_document` und `read_document` außerhalb von `tests/`: nur `documents/__init__.py` und `documents/io.py`). Ein Programm, das Python-Objekte an `parse_document` übergibt, ist davon betroffen.
- H8 (neu, nicht blockierend): Der Test `test_the_normalization_of_a_document_of_2_mib_is_within_time_and_memory` (`test_hardening_2.py` Zeile 321 bis 341) verwendet ein Dokument aus `q+q+…`. Darin ist nichts umzuschreiben; `analyze_spelling` (`checker.py`) zerlegt diese Ausdrücke deshalb gar nicht (`_would_change` liefert nein). Der Test misst damit nicht den Weg mit Zerlegung. Im ungünstigsten Fall mit Zerlegung (ein umzuschreibender Name am Ende, Proben oben) dauert die Normalisierung hier 5,0 bis 5,3 s, also an oder über der Zahl „unter 5 s“, die `pipwerk-domain.md` Zeile 416 nennt. Die Festlegung „in der Größenordnung der Prüfung“ ist erfüllt; die Zahl in der Dokumentation gilt nur für das Testdokument.

## Geprüft ohne Befund

- Einstiegspunkte je Paket: Protokoll nur mit Paketname (über `%r` maskiert) und Klasse der Ausnahme, ohne Pfad, ohne Inhalt der Metadaten, ohne Rückverfolgung. Scheitert schon die Liste der Pakete, bleiben die mitgelieferten Typen (Test `test_hardening_2.py` Zeile 112).
- Normalisierung ohne Befunde: `_add` kehrt bei `spelling_only` sofort zurück, die Befundliste bleibt leer; Speicher an der Grenze von 2 MiB höchstens 45 MB.
- Neuer Lexer mit `NamedTuple` und Parser mit Vorrang im `_Pending`: unverändertes Verhalten in allen Proben, keine Rekursion.
- `PREVIOUS` ohne Abhängigkeit: Der reguläre Ausdruck in `engine.py` und die Markierung im Syntaxbaum (`checker.py`) weichen nur bei ungültigen Argumenten von `PREVIOUS` voneinander ab; dort meldet die Prüfung `expression.invalid`, kein Absturz und keine Rekursion.
- Keine festen Pfade, Ports, Rechnernamen oder Zugangsdaten in den hinzugefügten Zeilen; `uv.lock` und `pyproject.toml` unverändert.
