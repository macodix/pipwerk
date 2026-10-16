# Testbericht Sicherheit – Auftrag 01, Durchlauf 5 (Nachprüfung)

- Vorhaben: `strategiedesign`, Arbeitspaket `wp01`, ref `strategiedesign/wp01`
- Übergabedokument: `strategiedesign/wp01:development/strategiedesign/wp01/tests/01-5-order.md`
- geprüfter Commit: `768631af0816c6dc877992a5588715ad75673ffb` (Zweig `strategiedesign/wp01-01`)
- vorher geprüfter Commit: `a601608cad75dc333b9cfb608862207fc5c1eed2` (Bericht `01-securitytest-4.md`, bestanden)
- Umfang: Nachprüfung nach „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Befund B1 aus `01-functiontest-4.md`, Punkte 1 bis 4 der „Anpassung nach Durchlauf 4“ in Auftrag 01 und die dafür geänderten Stellen. Nur blockierende Befunde verhindern das Bestehen.
- Grundlagen: Auftrag 01 mit „Anpassung nach Durchlauf 3“ und „Anpassung nach Durchlauf 4“, Übergabedokument, Entwicklungs-, Test- und Sicherheitsregeln, `docs/technical/pipwerk-domain.md`, BSI CON.8 und APP.7, OWASP ASVS (Eingabevalidierung, Fehlerbehandlung), OWASP API Security Top 10 (API4 Ressourcenverbrauch)

## Ergebnis

**bestanden**

In den geänderten Stellen habe ich keinen blockierenden Befund gefunden. Die Zahl der blockierenden Befunde bleibt bei 0. `rule.order_in_indicator` läuft jetzt über die Zählung je Ausdruck. Die Grenze von 50 Befunden je Ausdruck gilt damit für alle fünf Befunde der abschließenden Liste. H1 und H6 aus den früheren Durchläufen bleiben Hinweise. Neu ist der Hinweis H9 zu Hinweis H2 aus `01-functiontest-4.md`; er betrifft nicht die Änderung dieses Commits.

## Ausgeführte Prüfungen

Vor der Prüfung kontrolliert: `git rev-parse HEAD` im eigenen Arbeitsverzeichnis ergab `768631af0816c6dc877992a5588715ad75673ffb`. `git status --short` war nach der Prüfung leer. Gegenüber `a601608` geändert sind nur `docs/technical/pipwerk-domain.md` (1 Zeile), `consistency/engine.py` (16 Zeilen) und `tests/test_hardening_3.py` (52 Zeilen) (`git diff --stat`).

### Befehle in `packages/domain-core` auf dem geprüften Commit

| Befehl | Ergebnis |
| --- | --- |
| `uv sync --frozen` | bestanden |
| `uv run --frozen pytest` | 958 bestanden (11,76 s) |
| `uv run --frozen ruff check` | „All checks passed!“ |
| `uv run --frozen ruff format --check` | „50 files already formatted“ |
| `uv run --frozen mypy` | „Success: no issues found in 49 source files“ |
| `uv run --frozen python -m pipwerk_domain.documents.schemas --check <Arbeitsverzeichnis>/contracts/strategies/v1` | bestanden, keine Ausgabe |
| `uv lock --check` | bestanden |
| `git diff --stat a601608 768631a -- packages/domain-core/uv.lock packages/domain-core/pyproject.toml contracts` | keine Änderung. `pip-audit` habe ich deshalb nicht erneut ausgeführt. Das Ergebnis aus Durchlauf 2 („No known vulnerabilities found“) gilt für dieselben Abhängigkeiten; der Tester Funktion führt `pip-audit` in diesem Durchlauf mit dem Prüfskript aus. |
| Suche im Diff nach `localhost`, `127.0`, `password`, `secret`, `token`, `api_key`, festen Pfaden, `eval(`, `exec(` | keine Treffer |

### Prüfung des Codes

- `rule.order_in_indicator` entsteht nur an zwei Stellen (Suche nach `RULE_ORDER_IN_INDICATOR` in `src/`): `engine.py` Zeile 1186 bis 1192 (Regel) und Zeile 1265 bis 1271 (Regelwerk). Beide rufen `_expression_finding` auf.
- Schlüssel der Regel ist `(id(rule), "expression")`. Das ist derselbe Schlüssel wie in `_report(rule, "expression", …)` (Zeile 1209, Schlüssel in Zeile 477) und in `_check_result` (Zeile 1218 und 1235). Schlüssel des Regelwerks ist `(id(rule), "result_expression")`, gleich `_report(rule, "result_expression", …)` in Zeile 1263.
- `_expression_finding` (Zeile 534 bis 553) wird nur für die fünf Befunde der abschließenden Liste aufgerufen: Zeile 492 und 505 (`rule.unresolved_name`), 496 (`expression.invalid`), 524 (`expression.order_outside_management`), 1218 und 1235 (`rule.result_mismatch`), 1186 und 1265 (`rule.order_in_indicator`). `calculation.circular_reference` und `candle.no_instance` (Zeile 1453) laufen über `_add` und zählen nicht. Das entspricht Punkt 1 der „Anpassung nach Durchlauf 4“.
- Bei der Regel steht `rule.order_in_indicator` vor den Befunden der Analyse, beim Regelwerk danach. Nach einem `findings.truncated` gibt `_expression_finding` sofort zurück (Zeile 547 und 548). Damit kommt in beiden Fällen kein Befund des Ausdrucks nach `findings.truncated`.

### Eigene Angriffsproben

Alle Proben liefen als `uv run --frozen python -c …` im Verzeichnis `packages/domain-core`. Dabei sind keine Dateien entstanden. Ausdruck: `c`-mal `Strategie.x`, verbunden mit `+`, dazu `+Order.volumen > 0`.

| Probe | Ergebnis |
| --- | --- |
| Vorlage `Indikator`, Regel `r`, `c` = 0, 1, 49 | 1, 2, 50 Befunde, kein `findings.truncated`, `rule.order_in_indicator` als erster Befund |
| Vorlage `Indikator`, Regel `r`, `c` = 50, 51, 60, 300 | je 51 Befunde: `rule.order_in_indicator`, 49 Hinweise, `findings.truncated` als letzter Befund |
| Vorlage `Indikator`, Regelwerk `w`, `c` = 0, 1, 49 | 1, 2, 50 Befunde, kein `findings.truncated`, `rule.order_in_indicator` als letzter Befund |
| Vorlage `Indikator`, Regelwerk `w`, `c` = 50, 51, 60, 300 | je 51 Befunde: 50 Hinweise, `findings.truncated` als letzter Befund, kein `rule.order_in_indicator` danach |
| Vorlage `Trend`, dieselben Fälle für Regel und Regelwerk | dasselbe Verhalten; dazu je 2 Befunde der Vorlage, die zu keinem Ausdruck gehören |
| Vorlage `Indikator` mit 200 Regeln, je `c` = 60 | 1001 Befunde in 0,06 s, letzter Befund `findings.truncated` mit `scope` `check`. Die Grenze je Prüfung bleibt wirksam. |
| Regelwerk `w` mit innerer Regel `a` (`Order.volumen > 0`) und Ergebnisausdruck `c` = 60 plus `+a` | 49 Hinweise und 1 `expression.invalid` für `result_expression`, `findings.truncated` für `result_expression`; `rule.order_in_indicator` für `w.a` zählt zum Ausdruck von `a`, nicht zum Ergebnisausdruck. Jeder Ausdruck wird für sich gezählt. |
| zwei Regeln, die sich gegenseitig nennen und `Order` bzw. `Position` verwenden | 2 Befunde `expression.invalid`, unter 1 ms. Die Prüfung `uses_order` endet bei einem Kreis. |

Die neuen Tests (`test_hardening_3.py` Zeile 137 bis 185) decken Punkt 3 der Anpassung ab: Regel und Regelwerk in einer Vorlage `Indikator` mit 60 Befunden plus `rule.order_in_indicator` (`findings.truncated` als letzter Befund des Ausdrucks und der ganzen Liste) und die Gegenprobe mit 49 plus 1 ohne `findings.truncated`. Alle bestanden.

## Nachprüfung

| Bezug | Ergebnis |
| --- | --- |
| B1 aus `01-functiontest-4.md` (`rule.order_in_indicator` nicht gezählt, beim Regelwerk nach `findings.truncated`) | behoben, siehe Prüfung des Codes und Proben oben |
| Punkt 1 der Anpassung: abschließende Liste | erfüllt: genau die fünf Befunde laufen über `_expression_finding` |
| Punkt 2 der Anpassung: Zuordnung von `rule.order_in_indicator` | erfüllt: Regel zum Feld `expression`, Regelwerk zum Feld `result_expression`, dieselbe Zählung |
| Punkt 3 der Anpassung: Tests | vorhanden und bestanden (`test_hardening_3.py` Zeile 137 bis 185) |
| Punkt 4 der Anpassung: Dokumentation | erfüllt: `docs/technical/pipwerk-domain.md` Zeile 471 nennt die abschließende Liste, die Zuordnung von `rule.order_in_indicator` und dass `calculation.circular_reference` und `candle.no_instance` nicht zählen. Das stimmt mit dem Code überein. |
| H1 und H6 aus Durchlauf 1 | nicht Gegenstand der Korrektur, unverändert, die Hinweise bleiben |

## Befunde

Keine blockierenden Befunde.

## Hinweise

- H1 (aus Durchlauf 1, unverändert): Die Schachtelungstiefe zählt nur Klammern und Funktionsaufrufe. Vorzeichen und verkettete Operatoren ergeben Syntaxbäume mit mehreren tausend Ebenen. `repr()` eines solchen Baums endet mit `RecursionError`. Die Bibliothek ruft `repr()` der Knoten selbst nicht auf.
- H6 (aus Durchlauf 1, unverändert): Wertebereiche handelsrelevanter Werte sind nicht festgelegt. Das ist eine Frage an Spezifikation oder Auftrag.
- H9 (neu, Bewertung von Hinweis H2 aus `01-functiontest-4.md`, nicht durch diesen Commit verursacht): `DocumentError` ist die `ValidationError` von Pydantic (`io.py` Zeile 20). Wird ein Python-Objekt mit mehrfach eingehängten Listen an `parse_document` gegeben, endet `parse_document` sofort mit `DocumentError`, und `errors(include_input=False)` endet sofort. `str()` der Ausnahme braucht aber Zeit, die mit jeder Ebene von geteilten Listen etwa verdoppelt wird. Gemessen: 16 Ebenen 0,018 s, 20 Ebenen 0,27 s, 22 Ebenen 0,92 s; der Text selbst hat jeweils nur 366 Zeichen. Die Bibliothek wandelt `DocumentError` selbst nicht in Text um (Suche nach `str(`, `repr(`, `logger.exception`, `exc_info` in `src/`: nur `io.py` Zeile 114, dort `str()` eines Fehlers von `json.loads`). Aus JSON gelesene Daten enthalten keine geteilten Teile. Ein solches Objekt kann nur ein Aufrufer bauen, der selbst Code ausführt. Bewertung: kein Angriffsweg über Eingaben von außen, deshalb nicht blockierend. Ein Aufrufer, der Python-Objekte unbekannter Herkunft übergibt und Fehler protokolliert, sollte `errors(include_input=False)` statt `str()` verwenden. Ob das in `docs/technical/pipwerk-domain.md` steht, habe ich nicht geprüft; das liegt außerhalb des Umfangs dieser Nachprüfung.

## Geprüft ohne Befund

- `rule.order_in_indicator` trägt in den Angaben kein Feld und keinen Inhalt der Eingabe (`engine.py` Zeile 1186 bis 1192 und 1265 bis 1271). Die Angaben von `findings.truncated` enthalten nur Grenze, Bereich, Feld, Element und Instanz (Zeile 563 bis 573).
- Der Speicher für die Zählung je Ausdruck (`_budgets`, `engine.py` Zeile 235) erhält durch die Änderung keine neuen Schlüssel: Regel und Regelwerk verwenden die Schlüssel, die `_report` für denselben Ausdruck ohnehin anlegt.
- Keine festen Pfade, Ports, Rechnernamen oder Zugangsdaten in den geänderten Zeilen. `uv.lock`, `pyproject.toml` und `contracts/` unverändert.
