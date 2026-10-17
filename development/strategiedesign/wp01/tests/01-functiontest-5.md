# Testbericht Funktion – Auftrag 01, Durchlauf 5 (Nachprüfung)

- Vorhaben: `strategiedesign`, Arbeitspaket `wp01`, ref `strategiedesign/wp01`
- Übergabedokument: `strategiedesign/wp01:development/strategiedesign/wp01/tests/01-5-order.md`
- geprüfter Commit: `768631af0816c6dc877992a5588715ad75673ffb` (Zweig `strategiedesign/wp01-01`, gleich `origin/strategiedesign/wp01-01`)
- vorher geprüfter Commit: `a601608cad75dc333b9cfb608862207fc5c1eed2` (Bericht `01-functiontest-4.md`)
- Commit des Prüfskripts: `81f85d213241bdbaea0aa4e0390c84a5e3821bb2` (Zweig `strategiedesign/wp01-functiontest`, neu aufgesetzt auf dem geprüften Commit, nach GitHub übertragen)
- Prüfgebiet: Funktion, Code und technische Dokumentation
- Umfang: Nachprüfung nach „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Befund B1 aus Durchlauf 4, die Punkte 1 bis 4 der „Anpassung nach Durchlauf 4“ im Auftrag (`strategiedesign/wp01:development/strategiedesign/wp01/orders/01.md`) und die dafür geänderten Stellen. Nur blockierende Befunde verhindern das Bestehen.

## Ergebnis

**nicht bestanden**

1 blockierender Befund (B1), 2 Hinweise (H1, H2).

- Befund B1 aus Durchlauf 4 ist behoben. `rule.order_in_indicator` wird mitgezählt und steht nie nach `findings.truncated`.
- Die Punkte 1 bis 3 der Anpassung sind erfüllt.
- Punkt 4 ist erfüllt: Abschnitt 11 nennt die abschließende Liste.
- Nicht erfüllt: Die Beschreibung von `test_hardening_3.py` in Abschnitt 12 von `docs/technical/pipwerk-domain.md` ist veraltet. Sie nennt die vier neuen Tests nicht (B1 unten).

Die Zahl der blockierenden Befunde dieses Prüfgebiets bleibt bei 1 (Durchlauf 4: 1, Durchlauf 5: 1). B1 ist ein neuer Befund an einer geänderten Stelle, nicht der Befund B1 aus Durchlauf 4.

## Ausgeführte Prüfungen

Vor der Prüfung kontrolliert:

- `git rev-parse origin/strategiedesign/wp01-01` ergab `768631af0816c6dc877992a5588715ad75673ffb`.
- Im eigenen Arbeitsverzeichnis ergab `git rev-parse HEAD~2` denselben Commit. Darüber liegen nur die beiden Commits des Prüfskripts.
- Der geprüfte Commit ändert gegenüber `a601608` nur drei Dateien (`git diff --stat`): `docs/technical/pipwerk-domain.md` (1 Zeile), `consistency/engine.py` und `tests/test_hardening_3.py`.

### Prüfskript

Der Zweig `strategiedesign/wp01-functiontest` ist nach Übergabedokument neu aufgesetzt, mit `git rebase --onto 768631a a601608`. Die Commits `edb60aa` und `57a9145` sind unverändert als `36578a8` und `81f85d2` übernommen. Gegenüber dem geprüften Commit ändern sie nur `components/pipwerk-studio/scripts/check` und `docs/technical/pipwerk-studio.md`. Eine weitere Änderung am Prüfskript war nicht nötig. Übertragen wurde mit `push --force-with-lease` gegen den vorherigen Stand `57a9145`.

Aufruf: `<Arbeitsverzeichnis>/components/pipwerk-studio/scripts/check --backend-port 18101 --frontend-port 15271 --with-audit`. Ausgabe: „checking … at commit 81f85d213241bdbaea0aa4e0390c84a5e3821bb2“. Exitcode 1, 19 von 20 Prüfungen bestanden:

- Bibliothek:
  - `uv sync --frozen`
  - pytest: 958 Tests bestanden (11,77 s)
  - `ruff check`: „All checks passed!“
  - `ruff format --check`: „50 files already formatted“
  - mypy: „Success: no issues found in 49 source files“
  - Abgleich der Schemata mit `contracts/strategies/v1`
  - `pip-audit`: „No known vulnerabilities found“
- Backend: `uv sync --frozen`, pytest mit 148 Tests, `ruff check`, `ruff format --check` (15 Dateien), mypy (15 Dateien), `pip-audit` mit „No known vulnerabilities found“
- Suche nach der Schreibweise des Namens: 343 Nennungen, alle richtig
- Oberfläche: `npm ci`, Typprüfung, Vitest mit 244 Tests, Bau
- Browsertest in Chromium, Firefox und WebKit: 39 bestanden, 6 übersprungen. Übersprungen sind die Fälle ohne Git-Arbeitsverzeichnis (`docs/technical/pipwerk-studio.md` Abschnitt 6.3).

Gescheitert ist nur `frontend: npm audit`: `source-map-js` 1.0.0 bis 1.2.1, Schwere „high“, GHSA-68fv-2mgg-jv7q. Das ist der bekannte Befund aus `docs/technical/pipwerk-studio.md` Abschnitt 7 und 9, wie in Durchlauf 4. Der geprüfte Commit ändert nichts an der Oberfläche. Deshalb ist das kein Befund dieses Commits.

Die Zahl der Tests der Bibliothek stieg von 954 (Durchlauf 4) auf 958, passend zu den vier neuen Tests.

### Kontrolle des Befunds aus Durchlauf 4 und der Punkte der Anpassung

Alle Proben liefen als eigene Python-Skripte mit `uv run --frozen python` gegen die Bibliothek im Verzeichnis `packages/domain-core`. Sie verwendeten `check_template` und die Hilfsfunktionen aus `tests/helpers.py`. Die Skripte lagen unter `packages/domain-core/.venv/probe/` (von Git ignoriert) und sind entfernt.

| Befund oder Punkt | Ergebnis | Nachweis |
| --- | --- | --- |
| B1 aus Durchlauf 4 (`rule.order_in_indicator` nicht gezählt, beim Regelwerk nach `findings.truncated`) | behoben | `engine.py` Zeile 1185 bis 1192 (Regel, Schlüssel `(id(rule), "expression")`) und Zeile 1264 bis 1271 (Regelwerk, Schlüssel `(id(rule), "result_expression")`) rufen `_expression_finding` auf. Die Schlüssel sind gleich denen in `_report` (Zeile 477, Aufrufe in Zeile 1209 und 1263) und in `_check_result` (Zeile 1218, 1235). Proben in einer Vorlage `Indikator` mit Ausdruck aus n-mal `Strategie.x` und `+Order.volumen > 0`: siehe Tabelle unten. |
| Punkt 1: abschließende Liste | erfüllt | Die fünf Kennungen werden in `engine.py` nur in Aufrufen von `_expression_finding` erzeugt: Zeile 493, 497, 508, 527, 1189, 1221, 1238, 1268 (Suche nach `fc.EXPRESSION_INVALID`, `fc.RULE_UNRESOLVED_NAME`, `fc.EXPRESSION_ORDER_OUTSIDE_MANAGEMENT`, `fc.RULE_RESULT_MISMATCH`, `fc.RULE_ORDER_IN_INDICATOR`). Außer `engine.py` und `findings.py` verwendet kein Modul unter `src/` diese Kennungen. `calculation.circular_reference` (Zeile 349 bis 351) und `candle.no_instance` (Zeile 1453) laufen über `_add` und zählen nicht. |
| Punkt 2: Zuordnung und Zählung | erfüllt | Siehe Tabelle unten. Bei jeder Probe höchstens 50 Befunde des Ausdrucks. Fallen weitere an, folgt genau ein `findings.truncated` (`scope` `expression`, `field` `expression` oder `result_expression`, `instance` der Regel oder des Regelwerks) als letzter Befund des Ausdrucks. Danach kommt kein Befund aus der Liste zu diesem Ausdruck. |
| Punkt 3: Tests | erfüllt | `test_hardening_3.py` Zeile 137 bis 185: Regel und Regelwerk in einer Vorlage `Indikator` mit 60 Hinweisen plus `rule.order_in_indicator`. `assert_order_cut` prüft 51 Befunde des Ausdrucks, `findings.truncated` als letzten Befund des Ausdrucks und als letzten Befund der ganzen Liste. Gegenprobe je 49 plus `rule.order_in_indicator`: genau ein `rule.order_in_indicator`, kein `findings.truncated`, 50 Befunde. Mit dem Code aus Durchlauf 4 scheitern die Tests mit 60: Bei der Regel wären es 52 Befunde des Ausdrucks, beim Regelwerk wäre `rule.order_in_indicator` der letzte Befund. Die Tests mit 60 statt genau 50 folgen derselben Art wie die Tests aus Durchlauf 3 (Zeile 74 und 99), die in Durchlauf 4 als erfüllt galten. Den Grenzwert 50 plus 1 habe ich mit Proben geprüft (Tabelle unten). Alle vier Tests bestanden. |
| Punkt 4: Abschnitt 11 | erfüllt | `docs/technical/pipwerk-domain.md` Zeile 471 nennt die abschließende Liste der fünf Kennungen, die Zuordnung von `rule.order_in_indicator` und dass `calculation.circular_reference` und `candle.no_instance` nicht zählen. Das stimmt mit dem Code überein. |
| geänderte Stellen: Dokumentation | nicht erfüllt | siehe B1 |

Proben (Vorlage, Art, n = Anzahl `Strategie.x`; Befunde gesamt; Stelle von `rule.order_in_indicator` und `findings.truncated` in der Liste, gezählt ab 0):

| Vorlage | Art | n | Befunde | `rule.order_in_indicator` | `findings.truncated` |
| --- | --- | --- | --- | --- | --- |
| Indikator | Regel | 0 | 1 | 0 | – |
| Indikator | Regel | 48 | 49 | 0 | – |
| Indikator | Regel | 49 | 50 | 0 | – |
| Indikator | Regel | 50 | 51 | 0 | 50 (letzter) |
| Indikator | Regel | 51, 60 | 51 | 0 | 50 (letzter) |
| Indikator | Regelwerk | 0 | 1 | 0 | – |
| Indikator | Regelwerk | 48 | 49 | 48 | – |
| Indikator | Regelwerk | 49 | 50 | 49 | – |
| Indikator | Regelwerk | 50, 51, 60 | 51 | entfällt | 50 (letzter) |
| Trend | Regel und Regelwerk | gleiche n | wie Indikator plus 2 | wie Indikator | wie Indikator, letzter |

Beim Trend kommen zwei Befunde der Vorlage selbst dazu: `trend.direction_missing` und `parameter.missing`. Sie nennen keinen Ausdruck.

Weitere Proben:

- Regel `a` in einem Regelwerk `werk` in einer Vorlage `Indikator`, mit 49-mal `Strategie.x` und `+Order.volumen > 0`: `rule.order_in_indicator` für `werk.a` und 49 Hinweise, also 50 ohne `findings.truncated`. Mit 50: 50 Befunde und `findings.truncated` (`instance` `werk.a`). Der Ergebnisausdruck von `werk` wird getrennt gezählt.
- Regel `r2`, die `Order` nur über die Regel `r1` anspricht (`AND(<n-mal Strategie.x> > 0; r1)`): `rule.order_in_indicator` für `r2` zählt zum Ausdruck von `r2`. Mit n = 49, 50 und 60 je 50 Befunde des Ausdrucks und `findings.truncated` als letzter. Für `r1` steht `rule.order_in_indicator` einzeln.
- `rule.order_in_indicator` zusammen mit `rule.result_mismatch` (Ausdruck ohne Vergleich): Mit 48 Hinweisen 50 Befunde, `rule.result_mismatch` als letzter, kein `findings.truncated`. Mit 49 Hinweisen 50 Befunde, dann `findings.truncated` als letzter, kein `rule.result_mismatch`.
- Zwei Regeln mit je 60 Hinweisen plus `Order`: je 50 Befunde und je ein `findings.truncated`, zusammen 102.

### Code

Die Änderung in `engine.py` ersetzt zwei Aufrufe von `_add` durch `_expression_finding`, mit denselben Angaben (Stufe, Kennung, Element, Instanz oder Regel, ohne weitere Angaben). Die Befunde sehen damit gleich aus wie vorher. `ruff`, `ruff format` und mypy bestanden (siehe Prüfskript). Neue Fehler an den geänderten Stellen habe ich nicht gefunden.

## Befunde

### B1 – Abschnitt 12 beschreibt die neuen Tests in `test_hardening_3.py` nicht (blockierend)

- Fundstelle: `docs/technical/pipwerk-domain.md` Zeile 509, Abschnitt 12, Tabelle „Die Tests (pytest) umfassen“.
- Sachverhalt: Die Zeile beschreibt `test_hardening_3.py` so: „die Grenze von 50 Befunden je Ausdruck mit `expression.order_outside_management`, `rule.result_mismatch` und Hinweisen in Vorlagen (jeweils mit Gegenprobe), …“. Der geprüfte Commit fügt in dieser Datei vier Tests hinzu (Zeile 137 bis 185): die Grenze mit `rule.order_in_indicator` für eine Regel und für ein Regelwerk in einer Vorlage `Indikator`, je mit Gegenprobe. Die Zeile nennt die einzelnen Fälle der Grenze, aber `rule.order_in_indicator` nicht. Der Commit ändert in der Dokumentation nur Zeile 471 (`git diff a601608 768631a -- docs/`).
- Bezug: Technisches Abnahmekriterium 6 des Auftrags: `docs/technical/pipwerk-domain.md` beschreibt alles aus Punkt 13, dazu gehören „Prüfungen mit Befehlen“, und stimmt mit dem Code überein. Nach der Dokumentationspflicht des Testers Funktion wird nicht freigegeben, wenn technische Dokumentation veraltet ist. Die Zeile beschreibt eine im Commit geänderte Testdatei und ist mit diesem Commit veraltet.

## Hinweise

- H1 – Grenzwert in den neuen Tests: Die Tests mit Kürzung verwenden 60 Hinweise plus `rule.order_in_indicator`, nicht genau 50 plus 1. Punkt 3 der Anpassung spricht von „50 Befunden des Ausdrucks plus `rule.order_in_indicator`“. Die Tests decken den Fehler aus Durchlauf 4 trotzdem auf (siehe Tabelle, Punkt 3). Den Grenzwert 50 plus 1 habe ich mit Proben bestätigt. Die Tests aus Durchlauf 3 sind genauso gebaut. Deshalb ist das kein blockierender Befund.
- H2 – Hinweise H2 (Text der Fehlermeldung bei geteilten Teilen) und H3 (Hinweise H4 und H6 aus Durchlauf 1) aus Durchlauf 4 bestehen unverändert. Sie gehören nicht zur Anpassung. Der Commit ändert die betroffenen Stellen nicht (`git diff --stat`).

## Bereinigung

Die eigenen Probeskripte lagen unter `packages/domain-core/.venv/probe/` (von Git ignoriert) und sind entfernt. Das Arbeitsverzeichnis steht auf Commit `81f85d2` des Prüfskripts (Zweig `strategiedesign/wp01-functiontest`, gleich `origin`). `git status --short` meldet keine Änderungen.
