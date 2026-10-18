# Testbericht Funktion – Auftrag 01, Durchlauf 3

- Bezug: `strategiedesign/wp02`, Prüfauftrag `development/strategiedesign/wp02/tests/01-3-order.md` (Zweig `strategiedesign/wp02`)
- geprüfter Commit: `0210df5d7fed3b1aa2ae46e68713af2923af4198` (Zweig `strategiedesign/wp02-01`, Elterncommit `a9aa37fc67852ba842b5039ef344208808e7c9c2`)
- Commit des Prüfskripts: `0210df5d7fed3b1aa2ae46e68713af2923af4198` – `components/pipwerk-studio/scripts/check` unverändert. Das Prüfskript deckt die Prüfungen aus Abnahmekriterium 1 und 2 weiter ab. Eine Änderung war nicht nötig. Deshalb gibt es keinen Zweig `strategiedesign/wp02-functiontest`.
- Durchlauf: 3, Nachprüfung von N1 und N2 aus Durchlauf 2 (Punkte 27 und 28), Prüfung von Punkt 29 und der geänderten Stellen auf neue Fehler. N3 ist laut Prüfauftrag nicht Teil dieses Durchlaufs.

## Ergebnis: nicht bestanden

Ein blockierender Befund (N5, neu an einer für Punkt 27 geänderten Stelle der technischen Dokumentation). Drei Hinweise (N6 bis N8). N1 und N2 aus Durchlauf 2 sind erledigt. Punkt 29 ist im Code umgesetzt; die Sicherheitsbewertung von B1 liegt beim Tester Sicherheit.

Hinweis zum Ablauf: Durchlauf 2 hatte einen blockierenden Befund, dieser Durchlauf hat ebenfalls einen. Die Zahl ist nicht gesunken. Nach `docs/technical/entwicklungsverfahren.md` Abschnitt „Grenze der Durchläufe“ geht die Schleife damit an den Softwarearchitekten.

## Ausgeführte Prüfungen

| Prüfung | Ergebnis | Nachweis |
|---|---|---|
| Ausgecheckter Commit | `0210df5d7fed3b1aa2ae46e68713af2923af4198` | `git rev-parse HEAD` im Arbeitsverzeichnis nach `git checkout --detach 0210df5…` |
| Prüfskript `check --backend-port 18631 --frontend-port 18632` (ohne `--with-audit`) | Exitcode 0, „check: all checks passed“ | Bibliothek pytest 1013 passed; Backend pytest 742 passed; ruff, ruff format, mypy, Schemata bestanden; Schreibweise: 475 Nennungen, alle richtig; `npm ci`, Typprüfung, Build bestanden; Vitest 42 Dateien, 734 Tests bestanden; Playwright in Chromium, Firefox und WebKit 69 passed, 6 skipped |
| Geänderte Dateien | 13 Dateien | `git diff --stat a9aa37f 0210df5`: nur Oberfläche (`components/pipwerk-studio/frontend/src/…`) und `docs/technical/pipwerk-studio.md`; keine Änderung an `package.json`/`package-lock.json`, Bibliothek, Backend oder Vertrag |
| Punkt 27 (N1): Wertzeile eigener Parameter vom Datentyp Zeiteinheit | erfüllt | `properties/specs.ts:105-120` `definitionSpecs(definitions, timeUnits)` setzt bei `time_unit` ohne eigene `choices` die Zeiteinheiten; Aufrufe `RuleProperties.tsx:207` mit `timeUnitChoices(types)`, `specs.ts:181` (`instanceParameterSpecs`) mit `timeUnitChoices(index)`, `ElementProperties.tsx:153` übergibt den Typindex. Andere Aufrufer von `definitionSpecs` gibt es nicht (Suche in `src`). Tests: `specs.test.ts:87-103` (erfundene Zeiteinheiten `qq1`, `qq7`, Gegenprobe mit eigenen `choices` und Datentyp Text), `specs.test.ts:105-114` (eigener Parameter einer Instanz, erfundene Zeiteinheiten), `Studio.properties.test.tsx:373-389` (Wertzeile eines eigenen Parameters einer neuen Regel bis zum Speichern) |
| Punkt 27: Dokumentation Abschnitt 2.3 „Werte der Zeiteinheit“ | nicht erfüllt, siehe N5 | `docs/technical/pipwerk-studio.md:141` |
| Punkt 28 (N2): Datentyp der Vorschläge in der gewählten Sprache | erfüllt | `expression/scope.ts:41-44` `datatypeLabel` über `getOwn` auf `resources[language].translation.datatype`; eingesetzt an allen vier Stellen mit Datentyp: `scope.ts:55` (Eigenschaft eines Typs), `:118` (eigene Eigenschaft einer Instanz), `:145` (Strategieparameter), `:191` (eigener Parameter einer Regel). Tests `scope.test.ts:312-366` für Deutsch und Englisch an allen vier Stellen, Gegenprobe mit unbekanntem Datentyp und mit `constructor` |
| Punkt 29: `instanceFromTemplate` | erfüllt | `document/build.ts:118-119` mit `hasOwn`/`setOwn`; Test `build.test.ts:125-147` mit `constructor`, `toString`, `__proto__` und Gegenprobe (vorhandener Wert der Vorlage bleibt) |
| Punkt 29: weitere Stellen in `src` | keine offene Stelle gefunden | Eigene Suche in `components/pipwerk-studio/frontend/src` außerhalb der Tests nach `in`, `obj[key]`, `obj[key] =`, `delete obj[key]`, `?.[`. Umgestellt: `canvas/layout.ts:248`, `:255`, `:266`; `canvas/flowModel.ts:161`, `:166`, `:205`, `:268`, `:369-375`; `state/editorState.ts:78-79`. Übrige Treffer mit festen Schlüsseln: `findingText.ts:164` (Schleife über die feste Liste `knownDetails`), `parse.ts:72` (feste Schlüssel `instances`, `rules`), `ops.ts:123` (`section` ist `'parameters' \| 'properties'`), `revisionApi.ts`, `buildRevision.ts`, `repository.ts`, `api.ts`, `settingsApi.ts`, `http.ts` (`in` mit festen Feldnamen), `ids.ts:32-33` (ein einzelnes Zeichen, kein Name eines Felds von `Object.prototype` hat die Länge 1), Zugriffe mit `[language]`. Die Liste des Entwicklers stimmt damit überein. |
| Kriterium 3 (keine Typkenntnis in der Darstellung) | erfüllt | `src/sourceRules.test.ts` besteht im Lauf des Prüfskripts; der Diff fügt keine Kennung eines Typs hinzu |
| Kriterium 5 und 6 (keine Pfade, Benutzernamen, Rechnernamen) | erfüllt für den Diff | Durchsicht des Diffs von `docs/technical/pipwerk-studio.md` und der Quelltexte |
| Abschnitt 6.2 der technischen Dokumentation | stimmt | `pipwerk-studio.md:650-656` nennt die neuen Tests in `build.test.ts`, `specs.test.ts` und `src/expression/*.test.ts` |
| Eigene Nachprüfung N5 | Befund bestätigt | vorübergehender Vitest-Test, danach entfernt; Ablauf unter N5 |

Den vorübergehenden Test habe ich mit `git clean -f` auf genau diese Datei entfernt. `git status --short` zeigt danach keine Ausgabe. Im Arbeitsverzeichnis bleiben nur die von `.gitignore` erfassten Erzeugnisse des Prüfskripts (`node_modules`, `dist`, `.venv`, Zwischenspeicher).

## Blockierende Befunde

### N5 – Dokumentation „Werte der Zeiteinheit“ stimmt nicht mit dem Code überein; eigene `choices` gelten nur in der Wertzeile

- Grundlage: Auftrag Punkt 27 („`docs/technical/pipwerk-studio.md` Abschnitt 2.3, Punkt ‚Werte der Zeiteinheit‘, stimmt danach mit dem Code überein“); technisches Abnahmekriterium 6.
- Fundstelle Dokumentation: `docs/technical/pipwerk-studio.md:141`, in diesem Commit geändert: „Für jede Eingabe eines Werts vom Datentyp Zeiteinheit, zu dem es keine Beschreibung gibt, nimmt `timeUnitChoices` die `choices` … aus den Typbeschreibungen, sofern die Definition selbst keine `choices` nennt: für Strategieparameter (Wert), den Standardwert eines eigenen Parameters einer Regel und die Wertzeile eines eigenen Parameters einer Regel oder einer Instanz …“
- Fundstellen Code:
  - `properties/StrategyProperties.tsx:135-139` (Wert eines Strategieparameters) und `properties/RuleProperties.tsx:119-123` (Standardwert eines eigenen Parameters einer Regel): bei `time_unit` immer `timeUnitChoices(types)`. Eigene `choices` der Definition bleiben unbeachtet.
  - `properties/specs.ts:113-116` (Wertzeile): eigene `choices` gehen vor, nur ohne sie kommen die Zeiteinheiten der Typbeschreibungen.
- Der Vertrag lässt `choices` bei jeder Parameterdefinition zu, auch bei `time_unit` (`contracts/strategies/v1/rule.schema.json:261-267`). Ein gelesenes Dokument oder eine Vorlage kann so eine Definition also enthalten. In der Oberfläche selbst lassen sich eigene `choices` nur beim Datentyp Auswahl eingeben (`RuleProperties.tsx:96`, `StrategyProperties.tsx:121`).
- Sachverhalt, mit einem vorübergehenden Vitest-Test nachgewiesen (Oberfläche mit dem Backend im Speicher und den echten Typbeschreibungen):
  1. `str-03` mit zwei Ergänzungen öffnen: Strategieparameter `sp` (`time_unit`, `choices: ["m1","h1"]`, Wert `m1`) und Regel `zz` der Strategie mit eigenem Parameter `p` (`time_unit`, `choices: ["m1","h1"]`, Standardwert `m1`) und Belegung `p` fest `m1`.
  2. „Wert von sp“ bietet M1, M2, … MN1 an (21 Werte), nicht m1 und h1.
  3. Regel `zz` wählen. „Standardwert von p“ bietet M1, M2, … MN1 an (21 Werte).
  4. Die Wertzeile „p“ bietet nur „m1“ und „h1“ an.
- Folge: Für Strategieparameter und Standardwert ist die Aussage der Dokumentation „sofern die Definition selbst keine `choices` nennt“ falsch. Für denselben Parameter einer Regel bieten Standardwert und Wertzeile verschiedene Werte an.
- Ob der Code oder die Dokumentation anzupassen ist, lege ich nicht fest.

## Hinweise (verhindern das Bestehen nicht)

### N6 – Test der Wertzeile einer Regel nur mit den echten Zeiteinheiten

Punkt 27 verlangt Tests für die Wertzeile eines eigenen Parameters einer Regel und einer Instanz mit erfundenen Zeiteinheiten. Für die Instanz gibt es ihn (`specs.test.ts:105-114`, `qq1`, `qq7`). Für die Regel prüft `Studio.properties.test.tsx:373-389` mit den echten Typbeschreibungen (M1, H1). Die erfundenen Zeiteinheiten prüft nur der allgemeine Test von `definitionSpecs` (`specs.test.ts:87-103`); diese Funktion nutzt die Regel (`RuleProperties.tsx:207`). Die Verdrahtung in `RuleProperties` mit erfundenen Typen ist nicht eigens getestet.

### N7 – Weitere Angaben neben Vorschlägen nicht übersetzt

`expression/scope.ts:79` zeigt neben „Ergebnis“ den festen Text `result`, `scope.ts:88` neben einer Regel `rule`, auch in der deutschen Oberfläche. `scope.ts:110` zeigt neben einer Instanz die Kennung des Objekttyps statt seiner Beschriftung. Das sind keine Datentypen und damit nicht Gegenstand von Punkt 28; die Stellen sind in diesem Commit nicht geändert. Auftrag Punkt 13 verlangt alle neuen Texte in beiden Sprachen.

### N8 – Kommentar zu `timeUnitChoices` veraltet

`model/typeIndex.ts:115`: „Strategy parameters and parameters of rules use these values.“ Seit diesem Commit nutzen auch eigene Parameter einer Instanz diese Werte (`specs.ts:181`).

## Nachprüfung der Befunde aus Durchlauf 2

| Punkt | Stand | Nachweis |
|---|---|---|
| N1 Wertzeile eigener Parameter vom Datentyp Zeiteinheit | behoben | siehe Tabelle oben, Punkt 27; die Dokumentation dazu siehe N5 |
| N2 Datentyp der Vorschläge als Kennung | behoben | siehe Tabelle oben, Punkt 28 |
| N3 Fachdokumente „mindestens einen Auslöser“ | nicht geprüft | laut Prüfauftrag nicht Teil dieses Durchlaufs |
| N4 Testkopie der Typbeschreibungen | unverändert erledigt | `test_frontend_type_copy.py` im Backend-Lauf des Prüfskripts bestanden (742 passed) |

## Vom Entwickler gemeldete Angaben

- Vitest 734, Browsertests 69 bestanden und 6 übersprungen, Prüfskript „all checks passed“: stimmt mit meinem Lauf überein.
- Punkt 27, „Dokumentation Abschnitt 2.3“: Die Wertzeile ist richtig beschrieben; die Aussage zu Strategieparametern und Standardwert trifft nicht zu (N5).
- Punkt 28 und 29 einschließlich der Liste der geprüften Stellen: stimmt mit meiner Prüfung überein.
