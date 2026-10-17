# Testbericht Sicherheit – Auftrag 01, Durchlauf 4 (Nachprüfung)

- Vorhaben: `strategiedesign`, Arbeitspaket `wp01`, ref `strategiedesign/wp01`
- Übergabedokument: `strategiedesign/wp01:development/strategiedesign/wp01/tests/01-4-order.md`
- geprüfter Commit: `a601608cad75dc333b9cfb608862207fc5c1eed2` (Zweig `strategiedesign/wp01-01`)
- vorher geprüfter Commit: `6859b00c09e6126c5cc9f33eed3a3019408a20b4` (Bericht `01-securitytest-3.md`, bestanden)
- Umfang: Nachprüfung nach „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md` (Zeile 246 bis 252): Hinweise aus Durchlauf 3, Punkte 1 bis 6 der „Anpassung nach Durchlauf 3“ in Auftrag 01 und die dafür geänderten Stellen. Nur blockierende Befunde verhindern das Bestehen.
- Grundlagen: Auftrag 01 mit „Anpassung nach Durchlauf 3“, Übergabedokument, Entwicklungs-, Test- und Sicherheitsregeln, `docs/technical/pipwerk-domain.md`, BSI CON.8 und APP.7, OWASP ASVS (Eingabevalidierung, Fehlerbehandlung), OWASP API Security Top 10 (API4 Ressourcenverbrauch)

## Ergebnis

**bestanden**

In den geänderten Stellen habe ich keinen blockierenden Befund gefunden. Die Zahl der blockierenden Befunde bleibt bei 0. Die Hinweise H7 und H8 aus Durchlauf 3 sind erledigt. H1 und H6 bleiben unverändert als Hinweise.

## Ausgeführte Prüfungen

Vor der Prüfung kontrolliert: `git rev-parse HEAD` im eigenen Arbeitsverzeichnis ergab `a601608cad75dc333b9cfb608862207fc5c1eed2`. `git status --short` war nach der Prüfung leer. Gegenüber `6859b00` geändert sind nur `docs/technical/pipwerk-domain.md`, `consistency/engine.py`, `documents/io.py`, `tests/test_hardening.py`, `tests/test_hardening_2.py` und der neue `tests/test_hardening_3.py` (`git diff --stat`).

### Befehle in `packages/domain-core` auf dem geprüften Commit

| Befehl | Ergebnis |
| --- | --- |
| `uv sync --frozen` | bestanden |
| `uv run --frozen pytest` | 954 bestanden (11,8 s) |
| `uv run --frozen ruff check` | „All checks passed!“ |
| `uv run --frozen ruff format --check` | „50 files already formatted“ |
| `uv run --frozen mypy` | „Success: no issues found in 49 source files“ |
| `uv run --frozen python -m pipwerk_domain.documents.schemas --check ../../contracts/strategies/v1` | bestanden, keine Ausgabe |
| `uv lock --check` | bestanden |
| `git diff --stat 6859b00 a601608 -- packages/domain-core/uv.lock packages/domain-core/pyproject.toml contracts` | keine Änderung. `pip-audit` habe ich deshalb nicht erneut ausgeführt. Das Ergebnis aus Durchlauf 2 („No known vulnerabilities found“) gilt für dieselben Abhängigkeiten. |
| Suche in `src/` nach `eval(`, `exec(`, `pickle`, `marshal`, `subprocess`, `os.system`, `__import__`, `import_module` | keine Treffer |
| Suche im Diff nach festen Pfaden, `localhost`, `127.0`, `password`, `secret`, `token`, `api_key` | keine Treffer |

### Eigene Angriffsproben

Alle Proben liefen als `uv run --frozen python -c …` im Verzeichnis `packages/domain-core`. Dabei sind keine Dateien entstanden.

**Prüfung auf Ersatzzeichen bei Python-Objekten (Punkt 6, `io.py` Zeile 49 bis 80).** Jede Probe lief in einem eigenen Faden mit einer Zeitgrenze von 20 s.

| Probe | Ergebnis |
| --- | --- |
| Liste enthält sich selbst (in `elements`); Objekt enthält sich selbst (oberste Ebene); Kreis über zwei Listen; Kreis in einem unbekannten Feld | jeweils `DocumentError` „an object that contains itself“, unter 1 ms |
| Kreis 100 000 Ebenen tief | `DocumentError`, 0,12 s, keine Rekursion |
| dieselbe Liste in 40 und in 200 Ebenen doppelt eingehängt (2^40 bzw. 2^200 Wege); dasselbe Objekt in 60 Ebenen doppelt eingehängt | jeweils sofort `DocumentError` der Validierung (kein Element), unter 1 ms |
| 1 000 000 Ebenen ohne Kreis | `DocumentError` der Validierung, 1,9 s, kein `RecursionError` |
| dieselbe leere Liste 2 000 000-mal; 2 000 000 verschiedene leere Listen | `DocumentError` (höchstens 1000 Elemente), 1,7 s bzw. 2,6 s. Die Prüfung auf Ersatzzeichen läuft vor der Validierung linear über das ganze Objekt. |
| geteiltes Objekt mit Ersatzzeichen im Schlüssel; Ersatzzeichen hinter einem geteilten Teil | `DocumentError` „a text with a single surrogate character“. Das Merken besuchter Teile überspringt keinen noch nicht geprüften Text. |
| Tupel mit Ersatzzeichen in `elements` (Tupel durchläuft die Prüfung nicht) | `DocumentError` der strengen Validierung („Input should be a valid list“) |
| gültiges Dokument; gültiges Dokument mit demselben Element-Objekt zweimal in `elements` | angenommen. Ein geteiltes Teil ohne Kreis wird nicht als Kreis gemeldet. |
| Unterklasse von `list` mit endlosem `__iter__` | `MemoryError` bei einer Grenze von 2 GiB Adressraum. Ein solches Objekt kommt nur von einem Aufrufer, der selbst Code ausführt; aus JSON kann es nicht entstehen. Kein Befund. |

Die Merkliste `on_path` enthält genau die Behälter, deren Teile noch nicht fertig durchlaufen sind (Marke `_LEAVE` hinter der Kennung, `io.py` Zeile 74 und 75). Die Prüfung meldet einen Kreis deshalb nur, wenn ein Behälter in sich selbst vorkommt. Die Kennungen aus `id()` bleiben eindeutig, weil alle Teile über `data` erreichbar bleiben (`io.py` Zeile 56).

**Grenze der Befunde je Ausdruck (Punkt 1, `engine.py` Zeile 475 bis 573, 1212 und 1229).**

| Probe | Befunde des Ausdrucks |
| --- | --- |
| Regel der Strategie mit 60, 50 und 49 Schreibfehlern plus falschem Ergebnistyp | 60 und 50: 50 `expression.invalid` + `findings.truncated` als letzter Befund, kein `rule.result_mismatch`. 49: 49 + 1 `rule.result_mismatch`, kein `findings.truncated` |
| Regel mit 60 bzw. 49 Schreibfehlern und unbekannter bestimmter Eigenschaft (`reason` `unknown_property`) | 60: 50 + `findings.truncated`. 49: 49 + 1 `rule.result_mismatch` |
| Ergebnisausdruck eines Regelwerks mit 60 Fehlern; Regel in einem Regelwerk mit 60 Fehlern | je 50 + `findings.truncated` |
| Berechnung mit 60, 50 und 49 Fehlern plus `Order.volumen` außerhalb der Verwaltung | 60 und 50: 50 + `findings.truncated`, kein `expression.order_outside_management`. 49: 49 + 1 `expression.order_outside_management` |
| Vorlage Regel mit 300 Hinweisen; mit 30 Hinweisen, 30 Fehlern und falschem Ergebnistyp; mit 49 Hinweisen und falschem Ergebnistyp | 50 + `findings.truncated`; 50 (30 Fehler, 20 Hinweise) + `findings.truncated`; 49 + 1 `rule.result_mismatch` |
| Vorlage Indikator, Eigenschaft mit 300 bzw. 49 Hinweisen plus `Order.volumen` | 50 + `findings.truncated`; 49 + 1 `expression.order_outside_management` |

In jeder Probe kommt nach `findings.truncated` kein Befund dieses Ausdrucks mehr. Die Suche nach `field=` in `engine.py` ergibt nur die Stellen in `_report` und `_expression_overflow`. `rule.result_mismatch` läuft über denselben Schlüssel `(id(rule), "expression")` wie die Analyse der Regel (`engine.py` Zeile 182 und 1203). Damit habe ich keinen Befund eines Ausdrucks gefunden, der an der Zählung vorbeigeht.

**Laufzeit an der Grenze von 2 MiB (Punkte 3 bis 5).** Je zwei Läufe, ohne `tracemalloc`:

| Dokument (453 bis 463 Berechnungen) | Normalisierung | Prüfung |
| --- | --- | --- |
| `KONTO.Kapital+…` (Dokument des Tests zu Punkt 4) | 0,94 s | 1,7 s |
| `q+…+KONTO` | 4,8 bis 5,0 s | 0,4 s (Ende an der Grenze von 1000 Befunden) |
| `q*…*KONTO` | 5,1 bis 5,2 s | 0,4 s |
| `-…-KONTO` | 3,1 bis 3,4 s | 4,8 s |
| `1+…+konto.kapital` | 3,3 s | 5,1 bis 5,8 s |

Normalisierung und Prüfung liegen im ungünstigsten Fall je bei etwa 5 s. Das entspricht Durchlauf 3, das Verhalten ist unverändert. `pipwerk-domain.md` Zeile 416 und 474 sagen dafür jetzt keine Zeit mehr zu und nennen die Tests als Schutz vor Ausreißern. Das stimmt mit dem Code und mit Punkt 5 überein.

## Nachprüfung der Hinweise aus Durchlauf 3

| Hinweis | Ergebnis |
| --- | --- |
| H7 Prüfung auf Ersatzzeichen läuft bei einem Kreis ohne Ende; geteilte Teile werden mehrfach durchlaufen | erledigt. `_reject_lone_surrogates` (`io.py` Zeile 49 bis 80) führt die Mengen `visited` und `on_path`. Ein Kreis ist ein `DocumentError`, ein geteiltes Teil wird einmal durchlaufen (Proben oben). Tests: `test_hardening_3.py` Zeile 210 bis 255. Dokumentation: `pipwerk-domain.md` Zeile 437. |
| H8 Test der Normalisierung von 2 MiB zerlegt nichts; „unter 5 s“ in der Dokumentation | erledigt nach Punkt 4 und 5 der Anpassung. `test_the_normalization_of_2_mib_rewrites_every_expression` (`test_hardening_3.py` Zeile 187 bis 204) verwendet `KONTO.Kapital+…` und prüft, dass jeder Ausdruck umgeschrieben ist. „unter 5 s“ steht nicht mehr in `pipwerk-domain.md` (Suche nach `5 s`: kein Treffer zu Laufzeiten). Das Testdokument ist nicht das ungünstigste (0,94 s gegenüber etwa 5 s, Tabelle oben). Punkt 4 verlangt das nicht, und nach Punkt 3 belegt der Test keine Antwortzeit. |
| H1 `repr()` der Knoten rekursiv | nicht Gegenstand der Korrektur, unverändert, der Hinweis bleibt |
| H6 Wertebereiche handelsrelevanter Werte | nicht Gegenstand der Korrektur, unverändert, der Hinweis bleibt |

## Prüfung der Punkte 1 bis 6 der Anpassung (Sicherheitssicht)

| Punkt | Ergebnis |
| --- | --- |
| 1 Grenze von 50 Befunden je Ausdruck an einer Stelle | erfüllt. Zählung in `Checker._expression_finding`, genau ein `findings.truncated` über `Checker._expression_overflow` (`engine.py` Zeile 534 bis 573). Proben oben. |
| 2 Tests zu Punkt 1 mit Gegenprobe | vorhanden: `test_hardening_3.py` Zeile 74 bis 160 |
| 3 Zeitgrenzen ohne `tracemalloc`, Zeit und Speicher getrennt | erfüllt: `test_hardening.py` Zeile 621 bis 637, `test_hardening_2.py` Zeile 326 bis 331 und 353 bis 356, `test_hardening_3.py` Zeile 195 bis 199 und 239 bis 242, jeweils mit `assert not tracemalloc.is_tracing()` vor der Zeitmessung (außer Zeile 239). Die Reserve habe ich für den Test zu Punkt 4 nachgemessen: 0,94 s bei 15 s. |
| 4 Normalisierung von 2 MiB mit Umschreiben jedes Ausdrucks | erfüllt, siehe H8 |
| 5 keine Zahl „unter 5 s“ in 9.2 und 11 | erfüllt: `pipwerk-domain.md` Zeile 416 und 474 |
| 6 Prüfung auf Ersatzzeichen endet für jede Eingabe | erfüllt, siehe H7 |

## Befunde

Keine blockierenden Befunde.

## Hinweise

- H1 (aus Durchlauf 1, unverändert): Die Schachtelungstiefe zählt nur Klammern und Funktionsaufrufe. Vorzeichen und verkettete Operatoren ergeben Syntaxbäume mit mehreren tausend Ebenen. `repr()` eines solchen Baums endet mit `RecursionError`. Die Bibliothek ruft `repr()` der Knoten selbst nicht auf.
- H6 (aus Durchlauf 1, unverändert): Wertebereiche handelsrelevanter Werte sind nicht festgelegt. Das ist eine Frage an Spezifikation oder Auftrag.

## Geprüft ohne Befund

- Fehlermeldungen der neuen Prüfung („an object that contains itself“) enthalten weder Inhalt noch Pfad der Eingabe (`io.py` Zeile 69, `_error` mit `input` = `None`, Zeile 83 bis 87).
- Der Speicher für die Zählung je Ausdruck (`_budgets`, `engine.py` Zeile 235) wächst höchstens mit der Zahl der Ausdrücke eines Dokuments. Diese Zahl ist durch die Begrenzungen aus Abschnitt 11 beschränkt.
- In der Normalisierung (`spelling_only`) zählt `_expression_finding` mit, `_add` legt aber keinen Befund an (`engine.py` Zeile 404 und 405). Die Befundliste bleibt leer.
- Keine festen Pfade, Ports, Rechnernamen oder Zugangsdaten in den geänderten Zeilen. `uv.lock`, `pyproject.toml` und `contracts/` unverändert.
