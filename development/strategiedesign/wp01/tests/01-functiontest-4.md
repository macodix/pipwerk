# Testbericht Funktion – Auftrag 01, Durchlauf 4 (Nachprüfung)

- Vorhaben: `strategiedesign`, Arbeitspaket `wp01`, ref `strategiedesign/wp01`
- Übergabedokument: `strategiedesign/wp01:development/strategiedesign/wp01/tests/01-4-order.md`
- geprüfter Commit: `a601608cad75dc333b9cfb608862207fc5c1eed2` (Zweig `strategiedesign/wp01-01`)
- vorher geprüfter Commit: `6859b00c09e6126c5cc9f33eed3a3019408a20b4` (Bericht `01-functiontest-3.md`)
- Commit des Prüfskripts: `57a914594be159a0e0f2e5be294a25c149dc2f51` (Zweig `strategiedesign/wp01-functiontest`, neu aufgesetzt auf dem geprüften Commit, nach GitHub übertragen)
- Prüfgebiet: Funktion, Code und technische Dokumentation
- Umfang: Nachprüfung nach „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Befunde aus Durchlauf 3, die Punkte 1 bis 6 der „Anpassung nach Durchlauf 3“ im Auftrag (`strategiedesign/wp01:development/strategiedesign/wp01/orders/01.md`) und die dafür geänderten Stellen. Nur blockierende Befunde verhindern das Bestehen.

## Ergebnis

**nicht bestanden**

1 blockierender Befund (B1), 3 Hinweise (H1 bis H3). Der blockierende Befund B1 aus Durchlauf 3 (`expression.order_outside_management` nach `findings.truncated`) ist behoben. Die Punkte 2 bis 6 der Anpassung sind erfüllt. Punkt 1 ist nicht vollständig erfüllt: Der Befund `rule.order_in_indicator` entsteht aus der Namensauflösung eines Ausdrucks, wird aber nicht mitgezählt und steht beim Regelwerk nach `findings.truncated` (B1 unten). Die Zahl der blockierenden Befunde dieses Prüfgebiets bleibt bei 1 (Durchlauf 3: 1, Durchlauf 4: 1).

## Ausgeführte Prüfungen

Vor der Prüfung kontrolliert: `git rev-parse HEAD` im eigenen Arbeitsverzeichnis ergab `a601608cad75dc333b9cfb608862207fc5c1eed2`. Der Commit ändert gegenüber `6859b00` nur `docs/technical/pipwerk-domain.md`, `consistency/engine.py`, `documents/io.py`, `test_hardening.py`, `test_hardening_2.py` und den neuen `test_hardening_3.py` (`git diff --stat`, 6 Dateien).

### Prüfskript

Der Zweig `strategiedesign/wp01-functiontest` ist nach Übergabedokument auf den geprüften Commit neu aufgesetzt. Die Commits `5efe173` und `3b68ad9` sind unverändert als `edb60aa` und `57a9145` übernommen. Gegenüber dem geprüften Commit ändern sie nur `components/pipwerk-studio/scripts/check` und `docs/technical/pipwerk-studio.md`. Eine weitere Änderung am Prüfskript war nicht nötig: Es nimmt `packages/domain-core` bereits auf, auch mit `pip-audit`. Übertragen mit `push --force-with-lease` gegen den vorherigen Stand `3b68ad9`.

Aufruf: `<Arbeitsverzeichnis>/components/pipwerk-studio/scripts/check --backend-port 18101 --frontend-port 15271 --with-audit` auf Commit `57a9145`. Ausgabe: „checking … at commit 57a914594be159a0e0f2e5be294a25c149dc2f51“.

- Erster Lauf: Exitcode 1, 18 von 20 Prüfungen bestanden. Gescheitert: `frontend: npm audit` (siehe unten) und ein Browsertest in Firefox („shows commit and commit date as tooltip and accessible description“, Zeitüberschreitung nach 30 s). Während dieses Laufs liefen gleichzeitig meine eigenen Proben mit hoher Last. Der geprüfte Commit ändert nichts an der Oberfläche.
- Zweiter Lauf ohne gleichzeitige Last: Exitcode 1, 19 von 20 Prüfungen bestanden:
  - Bibliothek: `uv sync --frozen`; pytest mit 954 Tests bestanden (11,66 s); `ruff check` „All checks passed!“; `ruff format --check` „50 files already formatted“ (erster Lauf); mypy „Success: no issues found in 49 source files“ (erster Lauf); Abgleich der Schemata mit `contracts/strategies/v1`; `pip-audit` für `packages/domain-core/uv.lock` mit „No known vulnerabilities found“
  - Backend: `uv sync --frozen`, pytest mit 148 Tests, `ruff check`, `ruff format --check`, mypy, `pip-audit` mit „No known vulnerabilities found“
  - Suche nach der Schreibweise des Namens: 343 Nennungen, alle richtig
  - Oberfläche: `npm ci`, Typprüfung, Vitest mit 244 Tests, Bau
  - Browsertest: 39 bestanden, 6 übersprungen (die Fälle ohne Git-Arbeitsverzeichnis, `docs/technical/pipwerk-studio.md` Abschnitt 6.3)

Gescheitert ist nur `frontend: npm audit`: `source-map-js` 1.0.0 bis 1.2.1, Schwere „high“, GHSA-68fv-2mgg-jv7q. Das ist der bekannte Befund aus `docs/technical/pipwerk-studio.md` Abschnitt 7 und 9. Der geprüfte Commit ändert nichts an der Oberfläche. Deshalb ist das kein Befund dieses Commits.

### Kontrolle der Befunde aus Durchlauf 3 und der Punkte der Anpassung

Alle Proben liefen als eigene Python-Skripte mit `uv run --frozen python` gegen die Bibliothek im Verzeichnis `packages/domain-core`. Die Skripte lagen unter `packages/domain-core/.venv/probe/` (von Git ignoriert) und sind entfernt.

| Befund oder Punkt | Ergebnis | Nachweis |
| --- | --- | --- |
| B1 aus Durchlauf 3 (`expression.order_outside_management` nach `findings.truncated`) | behoben | Berechnung im Hauptablauf mit 60-mal `q` und `+Order.volumen`: 50 Befunde `expression.invalid`, danach `findings.truncated` (`scope` `expression`, `field` `parameter:ausdruck`) als letzter Befund, kein `expression.order_outside_management`. Mit 49-mal `q`: 49 plus 1, kein `findings.truncated`. `engine.py` Zeile 523 bis 532 zählt über `_expression_finding`. |
| Punkt 1: Zählung an einer Stelle | für die vier genannten Befunde erfüllt, für `rule.order_in_indicator` nicht | `_expression_finding` (`engine.py` Zeile 534 bis 553) zählt `expression.invalid`, `rule.unresolved_name` (auch mit `issue` `unknown_property`), `expression.order_outside_management` und `rule.result_mismatch` (Zeile 1212 und 1229, Schlüssel `(id(rule), "expression")` gleich dem Schlüssel in `_report`). `_expression_overflow` (Zeile 555 bis 573) setzt `findings.truncated` höchstens einmal. Proben: Regel mit 60-mal `q` und `+1`; mit 50-mal `q` und `+1`; mit 60-mal `q` und unbekannter bestimmter Eigenschaft (`reason` `unknown_property`); Vorlage Indikator mit Eigenschaft aus 60-mal `Strategie.x` und `+Order.volumen`; Vorlage Regelwerk mit Ergebnisausdruck aus 60-mal `Strategie.x`; zwei Regeln mit je 60 Befunden (je ein `findings.truncated`): jeweils 50 Befunde und `findings.truncated` als letzter Befund des Ausdrucks. Mit 49-mal `q` und unbekannter Eigenschaft: 50 Befunde, kein `findings.truncated`. Abweichung siehe B1. |
| Punkt 2: Tests | erfüllt | `test_hardening_3.py` Zeile 74 bis 160: 50 plus `expression.order_outside_management` (Zeile 74), 49 plus 1 (Zeile 80), 50 plus `rule.result_mismatch` (Zeile 99), 49 plus 1 (Zeile 106), Vorlage mit 40 Hinweisen und 40 Fehlern (Zeile 118), Gegenprobe 49 plus 1 (Zeile 129). `assert_limited` prüft höchstens 50 und `findings.truncated` als letzten Befund des Ausdrucks in der ganzen Liste. Alle bestanden. |
| Punkt 3 und H1 aus Durchlauf 3: Zeitgrenzen | erfüllt | Siehe „Zeitgrenzen der Tests auf langsameren Rechnern“. Alle fünf Tests prüfen `assert not tracemalloc.is_tracing()` vor der Zeitmessung und messen Speicher getrennt (`test_hardening.py` Zeile 624 bis 637, `test_hardening_2.py` Zeile 328 bis 344 und 353 bis 365, `test_hardening_3.py` Zeile 195 bis 199). `test_normalization_of_a_hostile_document_is_bounded` (`test_hardening.py` Zeile 640 bis 650) startet `tracemalloc` nicht. |
| Punkt 4 und H8 Sicherheit: Normalisierung mit Umschreiben | erfüllt | `test_the_normalization_of_2_mib_rewrites_every_expression` (`test_hardening_3.py` Zeile 187 bis 204): 450 Berechnungen aus `KONTO.Kapital+…`, Größe zwischen 90 % und 100 % von 2 MiB, jeder Ausdruck wird zu `Konto.kapital+…` umgeschrieben (Zeile 202 bis 203). |
| Punkt 5, H2 aus Durchlauf 3 und H8 Sicherheit: Dokumentation | erfüllt | Suche nach „5 s“ und „unter 5“ in `docs/technical/pipwerk-domain.md`: kein Treffer. Abschnitt 9.2 (Zeile 416) und 11 (Zeile 474) nennen den Zweck der Tests, die Messung ohne `tracemalloc`, den Faktor 10 Reserve und „keine Antwortzeit“; Zeile 474 sagt für gültige große Dokumente keine Zeit zu. Zeile 471 beschreibt die Grenze je Ausdruck; Abweichung siehe B1. |
| Punkt 6 und H7 Sicherheit: Ersatzzeichen bei Kreisen und geteilten Teilen | erfüllt | `_reject_lone_surrogates` (`io.py` Zeile 49 bis 80) mit `visited` und `on_path`, ohne Rekursion. Proben: Element, das sich selbst enthält; Liste `elements`, die das Dokument enthält; Kreis über zwei Listen: jeweils `DocumentError` „an object that contains itself“ in unter 0,001 s. Dasselbe Element zweimal und dieselbe Belegung zweimal eingehängt: gelesen. Ersatzzeichen nur in einem geteilten Teil und als Schlüssel in einem geteilten Objekt: `DocumentError`. 200 000 Ebenen von Listen: `DocumentError` in 0,99 s, kein `RecursionError`. Geteilte Teile mit 2^60 Wegen aus Listen und aus Objekten: Durchlauf 0,0002 bis 0,0003 s, `parse_document` endet mit `DocumentError` in 0,0002 s. Tests `test_hardening_3.py` Zeile 210 bis 255. Abschnitt 10 (Zeile 437) beschreibt das. Siehe auch H2. |
| H3 aus Durchlauf 3 (Hinweise H4 und H6 aus Durchlauf 1) | unverändert, bleiben Hinweise | nicht Gegenstand der Anpassung; die betroffenen Stellen hat der Commit nicht geändert (`git diff --stat`) |

### Zeitgrenzen der Tests auf langsameren Rechnern

Die Abschnitte mit Zeitmessung aus den Tests habe ich mit denselben Eingaben (über die Hilfsfunktionen der Testmodule) einzeln gemessen, ohne `tracemalloc`. Ein langsamerer Rechner ist nachgebildet: 2 und 4 Prozesse gleichzeitig auf einem Prozessorkern (Bindung mit `os.sched_setaffinity`). Jeder Prozess hat dann etwa die Hälfte oder ein Viertel des Kerns. Angegeben ist der höchste Wert der Prozesse.

| Test | Grenze | allein | 2 Prozesse je Kern | 4 Prozesse je Kern |
| --- | --- | --- | --- | --- |
| `test_hardening.py::test_a_document_of_2_mib_is_checked_within_time_and_memory` | 10 s | 0,41 s (4 %) | 0,86 s (9 %) | 1,76 s (18 %) |
| `test_hardening.py::test_normalization_of_a_hostile_document_is_bounded` | 10 s | 0,59 s (6 %) | 1,13 s (11 %) | 2,24 s (22 %) |
| `test_hardening_2.py::test_the_normalization_of_a_document_of_2_mib_is_within_time_and_memory` | 15 s | 1,30 s (9 %) | 2,58 s (17 %) | 5,45 s (36 %) |
| `test_hardening_2.py::test_the_normalization_of_a_template_with_many_hints_is_within_time_and_memory` | 10 s | 0,22 s (2 %) | 0,47 s (5 %) | 1,17 s (12 %) |
| `test_hardening_3.py::test_the_normalization_of_2_mib_rewrites_every_expression` | 15 s | 1,05 s (7 %) | 1,97 s (13 %) | 4,10 s (27 %) |

Die Reserve auf diesem Rechner liegt zwischen Faktor 11,5 und 45. Die Messwerte entsprechen denen des Entwicklers aus dem Übergabedokument (0,37 s, 1,26 s, 0,95 s, 0,53 s, 0,23 s). Die Kommentare in den Tests („about 25 times“, „about 12 times“, „about 40 times“) passen dazu. Der Test `test_a_part_that_is_attached_many_times_is_walked_once` hat ebenfalls 15 s; der Durchlauf braucht dort unter 0,001 s.

Beurteilung: Auch bei einem Viertel eines Kerns erreicht kein Test mehr als 36 % seiner Grenze. Ein Rechner, der etwa 11-mal langsamer ist als dieser, würde den engsten Test erst erreichen. Die Zeitgrenzen sind damit auf langsameren Rechnern und unter gleichzeitiger Last verlässlich im Sinn der Regel „deterministisch“ (`docs/technical/development-test-security-rules.md`). Hinweis H1 aus Durchlauf 3 ist erledigt. Messung mit Testabdeckung habe ich nicht ausgeführt.

## Befunde

### B1 – `rule.order_in_indicator` wird nicht zur Grenze eines Ausdrucks gezählt und folgt beim Regelwerk nach `findings.truncated` (blockierend)

- Fundstelle: `packages/domain-core/src/pipwerk_domain/consistency/engine.py` Zeile 1185 bis 1186 (Regel: `self._add(Level.ERROR, fc.RULE_ORDER_IN_INDICATOR, …)` nach `item.uses_order()`, vor `_check_regel`) und Zeile 1254 bis 1261 (Regelwerk: `self._report(rule, "result_expression", …)`, danach `self._add(… fc.RULE_ORDER_IN_INDICATOR …)` nach `self._names_order_directly(analysis)`); `docs/technical/pipwerk-domain.md` Abschnitt 11, Zeile 471.
- Sachverhalt:
  - Vorlage Indikator mit einem Regelwerk `w` (Regel `a` mit `1 > 0`) und dem Ergebnisausdruck aus 60-mal `Strategie.x` und `+Order.volumen > 0`: `check_template` liefert 50 Hinweise `rule.unresolved_name`, dann `findings.truncated` (`scope` `expression`, `field` `result_expression`, `instance` `w`) und danach als 52. Befund `rule.order_in_indicator` für `w`. Mit 50-mal `Strategie.x`: 50 Hinweise und `rule.order_in_indicator`, also 51 Befunde ohne `findings.truncated`.
  - Vorlage Indikator mit der Regel `r` und dem Ausdruck aus 60-mal `Strategie.x` und `+Order.volumen > 0`: zuerst `rule.order_in_indicator` für `r`, dann 50 Hinweise und `findings.truncated`. Mit 50-mal `Strategie.x`: `rule.order_in_indicator` und 50 Hinweise, also 51 Befunde ohne `findings.truncated`.
- Bezug: Punkt 1 der „Anpassung nach Durchlauf 3“: „Ein Befund gehört zu einem Ausdruck, wenn er dessen Element oder Regel und dessen Feld nennt oder aus der Zerlegung, der Typprüfung oder der Namensauflösung dieses Ausdrucks entsteht. Dazu gehören mindestens …“. `rule.order_in_indicator` entsteht aus der Namensauflösung: Beim Regelwerk prüft `_names_order_directly`, ob ein aufgelöster Name des Ergebnisausdrucks `Order` oder `Position` ist (`engine.py` Zeile 471 bis 473). Bei der Regel prüft `item.uses_order()` die Namen ihres Ausdrucks, auch über das Ergebnis anderer Regeln. Der Befund ist das Gegenstück zu `expression.order_outside_management` im Indikator und Trend (Abschnitt 7.5, Zeile 329). Der Code liefert für einen Ausdruck damit 51 Befunde ohne `findings.truncated` und beim Regelwerk einen Befund nach `findings.truncated`. Das widerspricht „Je Ausdruck gibt es höchstens 50 solche Befunde“ und „danach kommt kein Befund dieses Ausdrucks mehr“. Die Dokumentation sagt in Zeile 471 dasselbe wie der Auftrag; sie stimmt hier nicht mit dem Code überein (Abnahmekriterium 6). Die Menge ist auf einen zusätzlichen Befund je Regel oder Regelwerk begrenzt. Kein Test in `test_hardening_3.py` prüft die Grenze zusammen mit `rule.order_in_indicator`.

## Hinweise

- H1 – Grenze der Zuordnung zu einem Ausdruck: Zwei weitere Befunde entstehen aus den Namen eines Ausdrucks, werden nicht mitgezählt und betreffen nach meiner Prüfung nicht nur einen Ausdruck. `calculation.circular_reference` (Kreis über Berechnungen, erkannt mit `_NAME_BEFORE_POINT` im Text des Ausdrucks) steht vor den 50 Befunden des Ausdrucks: Probe mit 60-mal `q` und `+wert.ergebnis` in der Berechnung `wert` ergab 1 plus 50 plus `findings.truncated`. `candle.no_instance` wird je Element und Instanz nach allen Ausdrücken gemeldet (`engine.py` Zeile 1422 bis 1443). Beide nennen kein Feld und hängen vom Ablauf oder von mehreren Berechnungen ab. Ob sie nach der Festlegung in Punkt 1 zu einem Ausdruck gehören, entscheidet der Softwarearchitekt; die Dokumentation in Zeile 471 nennt sie nicht.
- H2 – Text der Fehlermeldung bei geteilten Teilen: `parse_document` endet für ein Python-Objekt mit 2^60 Wegen über geteilte Listen nach 0,0002 s mit `DocumentError`. Wandelt ein Aufrufer diese Ausnahme in Text um (`str(error)`), baut Pydantic die Darstellung des Eingabewerts (`input_value`) über alle Wege auf: bei 2^20 Wegen 0,39 s, bei 2^22 Wegen 1,65 s, bei 2^40 und 2^60 Wegen kein Ende innerhalb von 20 s. `error.errors(include_input=False)` endet sofort. Das liegt außerhalb von Punkt 6 (die Prüfung auf Ersatzzeichen endet) und betrifft nur Python-Objekte; aus JSON gelesene Daten enthalten keine geteilten Teile. Der vorher geprüfte Commit verhält sich bei der Validierung mit Pydantic gleich. Die Bewertung gehört zum Tester Sicherheit.
- H3 – Hinweise H4 (Unterstrich) und H6 (`PREVIOUS` mit Anzahl 0) aus Durchlauf 1 bestehen unverändert.

## Bereinigung

Die eigenen Prüfskripte lagen unter `packages/domain-core/.venv/probe/` (von Git ignoriert) und sind entfernt. Das Arbeitsverzeichnis steht auf Commit `57a9145` des Prüfskripts (Zweig `strategiedesign/wp01-functiontest`, gleich `origin`); `git status --short` meldet keine Änderungen.
