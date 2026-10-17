# Testbericht Funktion – Auftrag 01, Durchlauf 3 (Nachprüfung)

- Vorhaben: `strategiedesign`, Arbeitspaket `wp01`, ref `strategiedesign/wp01`
- Übergabedokument: `strategiedesign/wp01:development/strategiedesign/wp01/tests/01-3-order.md`
- geprüfter Commit: `6859b00c09e6126c5cc9f33eed3a3019408a20b4` (Zweig `strategiedesign/wp01-01`)
- vorher geprüfter Commit: `b12816c225bf8fa2fea50acca43e725126e6054b` (Bericht `01-functiontest-2.md`)
- Commit des Prüfskripts: `3b68ad98b6f6a64bbbde9491a565c9e3544d1e41` (Zweig `strategiedesign/wp01-functiontest`, neu aufgesetzt auf dem geprüften Commit, nach GitHub übertragen)
- Prüfgebiet: Funktion, Code und technische Dokumentation
- Umfang: Nachprüfung nach „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Befunde aus Durchlauf 2, die dafür geänderten Stellen und die Festlegungen des Softwarearchitekten im Übergabedokument. Nur blockierende Befunde verhindern das Bestehen.

## Ergebnis

**nicht bestanden**

1 blockierender Befund (B1), 3 Hinweise (H1 bis H3). Der blockierende Befund N1 aus Durchlauf 2 ist behoben. B1 ist neu: Er liegt an der Stelle, die für die Festlegung „Grenze von 50 Befunden je Ausdruck für alle Befunde“ geändert wurde. Die Zahl der blockierenden Befunde dieses Prüfgebiets bleibt bei 1 (Durchlauf 2: 1, Durchlauf 3: 1).

## Ausgeführte Prüfungen

Vor der Prüfung kontrolliert: `git rev-parse HEAD` im eigenen Arbeitsverzeichnis ergab `6859b00c09e6126c5cc9f33eed3a3019408a20b4`. Der Commit ändert gegenüber `b12816c` nur `packages/domain-core` und `docs/technical/pipwerk-domain.md` (`git diff --stat`, 11 Dateien).

### Prüfskript

Der Zweig `strategiedesign/wp01-functiontest` ist nach Übergabedokument auf den geprüften Commit neu aufgesetzt. Die Commits `e67d7b9` und `3717430` sind unverändert als `5efe173` und `3b68ad9` übernommen. Eine weitere Änderung am Prüfskript war nicht nötig. Gegenüber dem geprüften Commit ändern die beiden Commits nur `components/pipwerk-studio/scripts/check` und `docs/technical/pipwerk-studio.md`. Übertragen mit `push --force-with-lease` gegen den vorherigen Stand `3717430`.

Aufruf: `<Arbeitsverzeichnis>/components/pipwerk-studio/scripts/check --backend-port 18101 --frontend-port 15271 --with-audit` auf Commit `3b68ad9`. Ausgabe: „checking … at commit 3b68ad98b6f6a64bbbde9491a565c9e3544d1e41“. Ergebnis: Exitcode 1. 19 von 20 Prüfungen bestanden:

- Bibliothek: `uv sync --frozen`; pytest mit 940 Tests bestanden (9,80 s); `ruff check` „All checks passed!“; `ruff format --check` „49 files already formatted“; mypy „Success: no issues found in 48 source files“; Abgleich der Schemata mit `contracts/strategies/v1`; `pip-audit` für 23 Pakete aus `packages/domain-core/uv.lock` mit „No known vulnerabilities found“
- Backend: `uv sync --frozen`, pytest mit 148 Tests, `ruff check`, `ruff format --check`, mypy, `pip-audit` mit „No known vulnerabilities found“
- Suche nach der Schreibweise des Namens: 343 Nennungen, alle richtig
- Oberfläche: `npm ci`, Typprüfung, Vitest mit 244 Tests, Bau
- Browsertest: 39 bestanden, 6 übersprungen (die Fälle ohne Git-Arbeitsverzeichnis, `docs/technical/pipwerk-studio.md` Abschnitt 6.3)

Gescheitert ist nur `frontend: npm audit`: `source-map-js` 1.0.0 bis 1.2.1, Schwere „high“, GHSA-68fv-2mgg-jv7q. Das ist der bekannte Befund aus `docs/technical/pipwerk-studio.md` Abschnitt 7 und 9. Der geprüfte Commit ändert nichts an der Oberfläche. Deshalb ist das kein Befund dieses Commits.

### Kontrolle der Befunde aus Durchlauf 2 und der Festlegungen

Alle Gegenproben liefen als eigene Python-Skripte mit `uv run --frozen python` gegen die Bibliothek. Die Skripte lagen unter `packages/domain-core/.venv/` (von Git ignoriert) und sind entfernt.

| Befund und Festlegung | Ergebnis | Nachweis |
| --- | --- | --- |
| N1 Einstiegspunkte je Paket | behoben, entspricht der Festlegung | `registry.py` Zeile 191 bis 229 liest je Paket über `distributions()`. Gültiger Einstiegspunkt `good` in `goodpkg` neben `badpkg` mit `noeq` unter `[other.group]`, unter `[pipwerk.element_types]`, mit Paketnamen, der vor `goodpkg` sortiert, und mit Zeilenumbruch im Namen: jedes Mal `LoadReport(loaded=('good',), failed=())`, `plugin.good` und `EMA` im Register. Warnung „The entry points of the package 'badpkg' are ignored, its metadata cannot be read (TypeError)“, ohne Pfad und ohne Inhalt der Datei. Abschnitt 3.3 (Zeile 112) beschreibt das. Der Satz „Ein fehlerhafter Einstiegspunkt meldet nichts an …“ ist jetzt eindeutig. |
| N2 `PREVIOUS` auf das eigene Ergebnis | erledigt, entspricht der Festlegung | Berechnung `z` mit `PREVIOUS(z.ergebnis) + 1`, mit `PREVIOUS ( z.ergebnis ) + 1` und mit `PREVIOUS(z.ergebnis; 3) + 1`: kein Befund. `IF(PREVIOUS(z.ergebnis) > 0; z.ergebnis; 0)` und `"PREVIOUS(" & z.ergebnis`: je ein Befund `calculation.circular_reference`. `a` = `PREVIOUS(b.ergebnis) + 1` mit `b` = `a.ergebnis * 2`, und beide Richtungen mit `PREVIOUS`: kein Befund. Regel `r` mit `PREVIOUS(r.ergebnis)`: kein Befund; mit `r.ergebnis`: `ruleset.reference_order` (`cycle`). Regelwerk mit `a` = `PREVIOUS(b.ergebnis)` vor `b`: kein Befund. Abschnitt 9.2 (Zeile 406) beschreibt das. |
| N3 Normalisierung ohne Befunde, Laufzeit und Speicher | erledigt, entspricht der Festlegung | Siehe „Normalisierung“ unten. |
| N4 Hinweise H4 und H6 aus Durchlauf 1 | unverändert, bleiben Hinweise | nicht Gegenstand der Korrektur |
| N5 Kodierung von Bytes | erledigt, entspricht der Festlegung | UTF-8 mit Umlaut und Emoji angenommen und als UTF-8 schreibbar. Abgelehnt als `DocumentError`: Byte-Order-Mark, UTF-16 und UTF-32 mit und ohne BOM, Latin-1, ein Ersatzzeichen in CESU-8 (`ed a0 80`). Abschnitt 10 (Zeile 437) beschreibt das. |
| Festlegung einzelne Ersatzzeichen (Sicherheit N3) | erfüllt | Abgelehnt als `DocumentError`: `\ud800` bis `\udfff` als Escape in Titel, Schlüssel, Belegung in einem Element und in einem Ausdruck; ein umgekehrtes Paar `\ude00\ud83d`. Beim Schreiben einer Strategie und einer Vorlage mit Ersatzzeichen in Titel oder Belegung: `DocumentError`. Ein gültiges Paar `😀` wird gelesen und geschrieben. |
| Festlegung Grenze von 50 für alle Befunde eines Ausdrucks (Sicherheit N2) | für Hinweise erfüllt, nicht für alle Befunde | Vorlage Regel mit `Strategie.x` 51-mal, mit 40-mal `Strategie.x` und 40-mal `q`, Vorlage Indikator mit 300-mal und Vorlage Regelwerk mit 70-mal `Strategie.x`: jeweils 50 Befunde und ein `findings.truncated` mit `scope` `expression`. 49-mal `Strategie.x` und einmal `q`: 50 Befunde, kein `findings.truncated`. Abweichung siehe B1. |

### Normalisierung

- Vergleich der neuen Normalisierung (`spelling_only`) mit der Normalisierung über die volle Analyse (Checker ohne `spelling_only`, wie im vorher geprüften Commit): ein eigenes pytest-Plugin rief beide für jede Strategie und Vorlage auf, die die 940 Tests prüfen. Dazu kamen je drei Kopien mit Groß- und Kleinschreibung aller Buchstaben außerhalb von Texten nach Zufall. Ergebnis: 1236 Vergleiche, davon 927 mit veränderter Schreibweise, 0 Abweichungen, 0 Ausnahmen. Alle 940 Tests bestanden dabei.
- Laufzeit und Speicher bei rund 2 MiB (440 Berechnungen mit je einem Ausdruck nahe 4096 Zeichen), Prüfung und Normalisierung auf diesem Rechner:

| Ausdruck | Prüfung | Normalisierung |
| --- | --- | --- |
| `q+q+…` (Test) | 0,39 s | 1,22 s |
| `KONTO+KONTO+…` | 0,22 s | 1,61 s |
| `KONTO+1+1+…` | 5,18 s | 3,18 s |
| `KONTO.Kapital+…` | 1,71 s | 0,93 s |
| `if(1;1;1)+…` | 0,28 s | 2,70 s |
| `KONTO+---…-1` | 4,68 s | 3,14 s |
| `1+1+…` | 5,24 s | 0,15 s |
| `KONTO*(1+(1+…))` mit 63 Klammern | 0,22 s | 1,80 s |

  Höchster Speicher des Prozesses (`ru_maxrss`) für `q+q`, `KONTO+1`, `KONTO+---` und `1+1`: 36 bis 38 MB bei Prüfung und Normalisierung. Die Normalisierung liegt damit in der Größenordnung der Prüfung. Siehe auch H2.
- Ein Ausdruck ohne zu ändernde Schreibweise wird nicht zerlegt; ein Ausdruck mit Schreibfehler und unbekannte Namen bleiben erhalten (Tests in `test_hardening_2.py`, Vergleich oben). Abschnitt 9.2 (Zeile 416) beschreibt das.

### Zeitgrenzen der Tests auf langsameren Rechnern

Die Abschnitte mit Zeitmessung aus den Tests habe ich einzeln nachgebaut und gemessen. Ein langsamerer Rechner ist nachgebildet: 2 und 4 Prozesse gleichzeitig auf einem Prozessorkern. Jeder Prozess hat dann etwa die Hälfte oder ein Viertel des Kerns.

| Test | Grenze | allein | 2 Prozesse je Kern | 4 Prozesse je Kern |
| --- | --- | --- | --- | --- |
| `test_hardening.py::test_a_document_of_2_mib_is_checked_within_time_and_memory` (Prüfung, gemessen während `tracemalloc` läuft) | 5 s | 1,38 s (28 %) | 3,04 s (61 %) | 5,79 s (116 %) |
| `test_hardening_2.py::test_the_normalization_of_a_document_of_2_mib_is_within_time_and_memory` | 5 s | 1,26 s (25 %) | 2,58 s (52 %) | 5,01 bis 5,16 s (100 bis 103 %) |
| `test_hardening_2.py::test_the_normalization_of_a_template_with_many_hints_is_within_time_and_memory` | 5 s | 0,22 s (4 %) | 0,46 s (9 %) | 0,91 bis 0,95 s (19 %) |
| `test_hardening.py::test_normalization_of_a_hostile_document_is_bounded` | 10 s | 0,56 s (6 %) | 1,25 s (12 %) | 2,24 bis 2,31 s (23 %) |

Beurteilung siehe H1.

### Prüfung der geänderten Stellen

- Lexer: `Token` als `NamedTuple`. Parser: Vorrang als Feld von `_Pending`, Knoten mit `eq=False` und nicht eingefroren. Alle Tests des Parsers und der Ausdrücke bestanden. Der Vergleich der Normalisierung oben zeigt gleiche Ergebnisse. Ob Code die Knoten irgendwo nach Wert vergleicht, habe ich nicht eigens gesucht. Der Kopfkommentar von `nodes.py` nennt die Entscheidung. `docs/technical/pipwerk-domain.md` sagt nichts über eingefrorene Knoten (Zeile 65 betrifft nur Typbeschreibungen).
- Neue reguläre Ausdrücke `_PREVIOUS_NAME` (`engine.py` Zeile 61) und `_NAME_TEXT`, `_STRING_TEXT` (`checker.py` Zeile 225 bis 228): ohne verschachtelte Wiederholung. In den Laufzeitmessungen oben mit 4096 Zeichen kein auffälliger Ausdruck.
- `_reject_lone_surrogates` (`io.py` Zeile 48 bis 61) läuft ohne Rekursion über Werte und Schlüssel; tief geschachtelte Eingaben lehnt bereits `_load_json` ab.
- Dokumentation: `docs/technical/pipwerk-domain.md` Abschnitte 3.3, 9.2, 10, 11 und 12 gegen den Code geprüft; `test_documentation.py` bestanden. Abweichung siehe B1.

## Befunde

### B1 – `expression.order_outside_management` kommt zu den 50 Befunden eines Ausdrucks hinzu und folgt nach `findings.truncated` (blockierend)

- Fundstelle: `packages/domain-core/src/pipwerk_domain/consistency/engine.py` Zeile 521 bis 541 (`_report`: `findings.truncated` mit `scope` `expression`, danach ohne Zählung `EXPRESSION_ORDER_OUTSIDE_MANAGEMENT`); `docs/technical/pipwerk-domain.md` Abschnitt 11, Zeile 471.
- Sachverhalt: Berechnung im Hauptablauf mit dem Ausdruck `q+q+…` (60-mal `q`) `+Order.volumen`. `check_strategy` liefert für diesen Ausdruck 50 Befunde `expression.invalid`, danach `findings.truncated` (`limit` 50, `scope` `expression`, `field` `parameter:ausdruck`) und danach einen 51. Befund `expression.order_outside_management` mit demselben Element und `field` `parameter:ausdruck`. Gegenprobe mit 49-mal `q`: 49 plus 1, also 50 Befunde, kein `findings.truncated`.
- Bezug: Festlegung des Softwarearchitekten im Übergabedokument: „Die Grenze von 50 Befunden je Ausdruck gilt für alle Befunde eines Ausdrucks.“ Die Dokumentation sagt in Zeile 471: „alle Befunde je Ausdruck, Fehler und Hinweise (auch `rule.unresolved_name`) zusammen; weitere entfallen, dazu kommt `findings.truncated`“. Der Code liefert für einen Ausdruck 51 Befunde, einer davon steht nach dem Befund, der das Entfallen weiterer Befunde meldet. Das widerspricht der Festlegung und Abnahmekriterium 6 (Dokumentation stimmt mit dem Code überein). Die Menge ist auf einen zusätzlichen Befund je Ausdruck begrenzt. Kein Test prüft die Grenze zusammen mit `expression.order_outside_management`.

## Hinweise

- H1 – Zeitgrenzen der Tests: Auf diesem Rechner haben die beiden Tests mit 5 s etwa den Faktor 3,5 bis 4 Reserve. Bei einem Viertel eines Kerns scheitern beide: 5,79 s und 5,01 bis 5,16 s (Tabelle oben). Der Test der Prüfung misst die Zeit, während `tracemalloc` läuft; allein ohne `tracemalloc` braucht die Prüfung 0,39 s, mit `tracemalloc` 1,38 s. Der Entwickler meldet für die Normalisierung „im ungünstigsten Fall 4,1 s, Testgrenze 5 s“. Welches Dokument das war, steht nicht im Übergabedokument. War es das Dokument des Tests, bleiben auf dem Rechner des Entwicklers nur rund 20 % Reserve. Beurteilung: Auf einem Rechner wie diesem und ohne starke Last sind die Grenzen verlässlich. Auf einem Rechner, der 3,5-mal langsamer ist, unter starker gleichzeitiger Last oder mit Messung der Testabdeckung sind sie es nicht. Die Tests sind dann nicht mehr deterministisch (`docs/technical/development-test-security-rules.md` Zeile 119 und 126). Die übrigen zwei Zeitgrenzen haben mindestens den Faktor 4 Reserve auch bei einem Viertel eines Kerns.
- H2 – Laufzeit gültiger großer Dokumente: Eine gültige Strategie von 1,93 MB mit 400 Regeln (200 der Strategie, 200 eines Elements), jede mit einem Parameter `p` und dem Ausdruck `P+P+…>0` (2046 Namen): `check_strategy` 8,87 s ohne Befund, `normalize_strategy` 8,30 s. Die Normalisierung liegt in der Größenordnung der Prüfung, wie festgelegt. Beide liegen aber deutlich über den „unter 5 s“, die Abschnitt 9.2 und 11 für Dokumente von 2 MiB nennen. Diese Angaben beziehen sich laut Text auf Dokumente mit lauter fehlerhaften Ausdrücken und auf den Test. Die Bewertung der Überlast gehört zum Tester Sicherheit.
- H3 – Hinweise H4 (Unterstrich) und H6 (`PREVIOUS` mit Anzahl 0) aus Durchlauf 1 bestehen unverändert.

## Bereinigung

Die eigenen Prüfskripte und das pytest-Plugin für den Vergleich lagen unter `packages/domain-core/.venv/probe/` (von Git ignoriert) und sind entfernt. Die Testpakete für die Einstiegspunkte lagen in temporären Verzeichnissen und sind gelöscht. Das Arbeitsverzeichnis steht auf Commit `3b68ad9` des Prüfskripts (Zweig `strategiedesign/wp01-functiontest`, gleich `origin`); `git status` meldet keine Änderungen.
