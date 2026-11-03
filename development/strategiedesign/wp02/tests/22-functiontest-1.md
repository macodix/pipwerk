# Testbericht Tester Funktion, Auftrag 22, Durchlauf 1

- Vorhaben `strategiedesign`, Arbeitspaket `wp02`, Bezug `strategiedesign/wp02`
- geprüfter Commit: `a2aab998b08ea041b5ca4929a2b758173eea80a9` (Zweig `strategiedesign/wp02-22`, Vorgänger `ea495766b04407ac2233852853991f106a3cb0b4`), im Arbeitsverzeichnis mit `git rev-parse HEAD` bestätigt
- Prüfauftrag: `development/strategiedesign/wp02/tests/22-1-order.md`; Auftrag: `orders/22.md`

## Ergebnis: nicht bestanden

Ein blockierender Befund (B1). Alle automatischen Prüfungen bestehen.

## Befunde

### B1 (blockierend): `test_remove_an_instance_with_its_uses` ist abgeschwächt

- `packages/domain-core/tests/test_operations.py`: Die Prüfung wurde von `>= 4` auf `>= 1` geändert.
- Die genaue Zahl habe ich im Commit ermittelt (`remove_element(strategy, element_of(strategy, "ema20"))` auf `str-03`, dann `only(check_strategy(strategy), fc.EXPRESSION_EMPTY)`): **genau 3 Befunde**. Sie liegen an drei verschiedenen Elementen, alle im Feld `parameter:ausdruck`, `reason` = `slot`, `start` 3, 16 und 43.
- Der Test kann diese Zahl festschreiben (`== 3`). Das ist deterministisch und gehört zum Zweck des Tests und des Auftrags: Befunde anderer Elemente und Felder bleiben vollständig. Mit `>= 1` bestünde der Test auch, wenn zwei der drei Elemente ihren Befund verlören.
- Auftrag Punkt 5 verlangt, dass ein Test nur geändert wird, wenn er die Mehrfachmeldung festschrieb, und nicht abgeschwächt wird. Das ist hier verletzt.
- Erwartete Behebung (nicht von mir ausgeführt): `== 3`, möglichst mit Prüfung der drei Elemente.

## Geprüft, ohne Befund

1. **Schleife über `analysis.slots`**: Sie steht in `consistency/engine.py` an genau zwei Stellen (Zeilen 863 und 1060, `grep`). Beide sind auf `[:1]` geändert. Die übrigen Treffer von `slots` sind `dataclass(slots=True)` und die Definition in `expressions/checker.py`.
2. **`analysis.slots[:1]`**: Plätze entstehen nur mit `reason` = `slot` (`checker.py` Zeile 410). Die Plätze sind nach Stelle sortiert (`self.slots.sort()`, Zeile 347). Der erste Platz behält Stelle und Reihenfolge. Es werden nie Plätze verschiedener Ursache zusammengefasst. `reason` = `missing` kehrt vorher zurück und kommt nicht zusammen mit Plätzen vor. Befunde anderer Ursache im selben Feld (`expression.invalid`, `instrument.invalid`, `rule.unresolved_name`) bleiben je Fehlerstelle erhalten. Der neue Test `test_an_empty_place_and_another_error_in_one_field_stay_two_findings` bestätigt das.
3. **Fall aus der Abnahme**: Vier Verwendungen ergeben einen Befund (`test_a_removed_object_used_four_times_gives_one_finding`, Bibliothek). Dasselbe gilt über `/api/v1/removals` und `/api/v1/check` (`test_a_removed_object_used_four_times_in_one_field_gives_one_finding`). Der Ausdrucksendpunkt ist mit `test_several_empty_places_are_one_finding` (`start` = 16, der erste Platz) abgedeckt. Befunde eines anderen Elements bleiben (zwei Elemente → zwei Befunde, `test_empty_places_of_different_elements_stay_separate`). Gleichung `IF([]; 1; [])` ergibt einen Befund bei (3, 5).
4. **Die beiden anderen geänderten Tests** (`test_an_empty_place_in_an_expression_is_an_error` auf eine Stelle, `test_remove_a_strategy_parameter` von 4 auf 2) schrieben die Mehrfachmeldung fest. Die Änderung ist begründet und nicht abgeschwächt (genaue Zahl 2).
5. **Automatische Tests**: Bibliothek `pytest` 1799 bestanden, `ruff check` und `ruff format --check` ohne Befund, `mypy` ohne Fehler (79 Dateien). Das Prüfskript `check --backend-port 18940 --frontend-port 18941` endete mit Exitcode 0 („all checks passed“): Bibliothek, Schemas, Backend (1046 Tests, ruff, mypy), Namensprüfung, Frontend (typecheck, Vitest 671, build) und Playwright mit 378 Tests in Chromium, Firefox und WebKit ohne Fehlschlag. Ausgabe: `work/strategiedesign/wp02/ft22-check.txt`.
6. **Dateimodus**: `scripts/check` und `scripts/testenv` sind `100755` (`git ls-tree`).
7. **Kein fester Pfad, Port oder Rechnername** in den hinzugefügten Zeilen des Commits (Suche im Diff ohne Treffer).
8. **Dokumentation**: `docs/technical/pipwerk-domain.md` Abschnitt 9.7 (neu) und die Zeile in Abschnitt 5 passen zum Code (`Checker._report` und `_context_findings`, `slots[:1]`, Aufbau des Befunds unverändert). Die Dokumentationsbeispiele werden durch die Backend-Tests (`test_web_api_documentation_examples.py`) geprüft und bestehen.

## Hinweis (nicht blockierend)

Das Prüfskript und alle Prüfläufe sind mit dem Commit erfolgt. Der Auftrag nennt den Fall „zwei Bedingungen mit je einer Verwendung → zwei Befunde“; der Test `test_empty_places_of_different_elements_stay_separate` deckt ihn mit zwei Elementen ab (eines mit zwei Plätzen, eines mit einem).

## Urteil

**nicht bestanden**: B1 (Test abgeschwächt, genaue Zahl 3 muss festgeschrieben werden).
