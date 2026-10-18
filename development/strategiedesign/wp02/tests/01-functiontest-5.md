# Testbericht Funktion – Auftrag 01, Durchlauf 5

- Bezug: `strategiedesign/wp02`, Prüfauftrag `development/strategiedesign/wp02/tests/01-5-order.md` (Zweig `strategiedesign/wp02`)
- geprüfter Commit: `2ec7ad8ee7d53c17e225af2595ae88d54a9aa153` (Zweig `strategiedesign/wp02-01`, Elterncommit `87c0efd20307529a02ab4fed1263c688a982b76b`)
- Commit des Prüfskripts: `2ec7ad8ee7d53c17e225af2595ae88d54a9aa153` – `components/pipwerk-studio/scripts/check` unverändert. Das Prüfskript deckt die Prüfungen aus Abnahmekriterium 1 und 2 weiter ab. Eine Änderung war nicht nötig. Deshalb gibt es keinen Zweig `strategiedesign/wp02-functiontest`.
- Durchlauf: 5, Nachprüfung von N9 bis N11 aus Durchlauf 4 (Punkte 36 bis 39 des Auftrags) und Prüfung der geänderten Stellen auf neue Fehler.

## Ergebnis: bestanden

Kein blockierender Befund. N9, N10 und N11 aus Durchlauf 4 sind erledigt. Drei Hinweise (N12, N13, N14); sie verhindern das Bestehen nicht.

Die Entscheidung des Softwarearchitekten im „Nachtrag nach Durchlauf 4 der Tester“ ist abschließend. Ich habe gegen sie geprüft und keinen Streitpunkt dazu erhoben.

## Ausgeführte Prüfungen

| Prüfung | Ergebnis | Nachweis |
|---|---|---|
| Ausgecheckter Commit | `2ec7ad8ee7d53c17e225af2595ae88d54a9aa153` | `git checkout --detach 2ec7ad8…` und `git rev-parse HEAD` im Arbeitsverzeichnis; das Prüfskript nennt in seiner ersten Zeile denselben Commit |
| Prüfskript `check --backend-port 18751 --frontend-port 18752` (ohne `--with-audit`) | Exitcode 0, „check: all checks passed“ | Bibliothek: pytest 1013 passed, ruff, ruff format, mypy, Schemata gleich `contracts/strategies/v1`. Backend: pytest 742 passed, ruff, ruff format, mypy. Schreibweise: „475 mentions checked, all spelled correctly“. Oberfläche: `npm ci`, Typprüfung, Vitest 42 Dateien mit 746 Tests bestanden, Build. Playwright in Chromium, Firefox und WebKit: 69 passed, 6 skipped |
| Geänderte Dateien | 7 Dateien | `git diff --stat 87c0efd 2ec7ad8`: `Studio.properties.test.tsx`, `document/ops.ts`, `document/ops.test.ts`, `properties/RuleProperties.tsx`, `properties/StrategyProperties.tsx`, `properties/specs.test.ts`, `docs/technical/pipwerk-studio.md`. Keine Änderung an `package.json`/`package-lock.json`, Bibliothek, Backend oder Vertrag |
| Punkt 36 (N9): Code | erfüllt | `document/ops.ts:25-38` `withDatatype`: gleicher Datentyp ändert nichts; sonst `patch` und neuer Datentyp; bei einem anderen Datentyp als `choice` wird `choices` über `removeOwn` entfernt, an einer Kopie. `ops.ts:83-95` `changeStrategyParameterType` verwendet sie. Aufrufe: `StrategyProperties.tsx:106-116` (Wert über `startValue`, bei „bei Anwendung“ `null`) und `RuleProperties.tsx:45-56` (`changeType`, Standardwert `null`), verwendet in `RuleProperties.tsx:100`. Eine Suche nach Auswahlfeldern für den Datentyp (`properties.parameterType`) und nach `ChoicesInput` in `src` findet nur diese beiden Stellen; einen weiteren Ort, an dem der Datentyp einer Definition in der Oberfläche gewechselt wird, gibt es nicht |
| Punkt 36: Tests | erfüllt, mit Hinweis N12 | `Studio.properties.test.tsx:712-802` mit `inventedWire()`: Strategieparameter Auswahl → Zeiteinheit (`:744`: Feld der Werte weg, „Wert von sel“ bietet „bitte wählen“, QQ1, QQ7, gespeichertes Dokument ohne `choices`); Regelparameter Auswahl → Zeiteinheit (`:760`: Standardwert und Wertzeile bieten QQ1, QQ7, gespeicherte Definition ohne `choices`); Gegenprobe Auswahl → Auswahl und Wechsel durch alle Datentypen für den Strategieparameter (`:782`). `ops.test.ts:219-233` für `withDatatype` mit Gegenprobe gleicher Datentyp und Datentyp Auswahl |
| Punkt 36: Ablauf aus N9 nachgestellt | behoben | Der Ablauf aus Durchlauf 4 (Auswahl mit Werten, dann Zeiteinheit) ist genau der Test `:744`; er besteht im Lauf des Prüfskripts |
| Punkt 37 (N10) | erfüllt | `specs.test.ts:116-135`: `instanceParameterSpecs` mit eigenem Parameter vom Datentyp Zeiteinheit mit eigenen `choices` (`k1`, `k2`), ohne eigene `choices` (erfundene Zeiteinheiten `qq1`, `qq7`) und Datentyp Text (keine Werte) |
| Punkt 38 (N11) | erfüllt | `docs/technical/pipwerk-studio.md:157` nennt jetzt „bei einer Funktion ihre Beschreibung aus den Typbeschreibungen (`state/useStudioController.ts`, `expression/completions.ts`)“; beide Dateien gibt es unter `frontend/src/` |
| Punkt 39: Abschnitt 2.3 beschreibt die Entscheidung | erfüllt | `pipwerk-studio.md:141`, Absatz „Entscheidung zu eigenen `choices`“: stimmt mit `ops.ts`, `StrategyProperties.tsx` und `RuleProperties.tsx` überein (Funktionsnamen, Verwendungsstellen, gleicher Datentyp ändert nichts, gelesene Definition mit eigenen `choices` bleibt bis zum Wechsel) |
| Abschnitt 6.2 der technischen Dokumentation | stimmt, mit Hinweis N12 | `pipwerk-studio.md:650` (`ops.test.ts`), `:652` (eigener Parameter einer Instanz), `:656` (Wechsel des Datentyps) |
| Beobachtung des Entwicklers (stehengebliebener fester Wert der Wertzeile) | wird gemeldet und ist erkennbar, siehe eigener Abschnitt; Hinweis N13 | echtes Backend der Testumgebung und vorübergehender Vitest-Test |
| Kriterium 3 (keine Typkenntnis in der Darstellung) | erfüllt | `src/sourceRules.test.ts` besteht im Lauf des Prüfskripts; der Diff fügt keine Kennung eines Typs hinzu |
| Kriterium 5 und 6 (keine Pfade, Benutzernamen, Rechnernamen) | erfüllt für den Diff | Durchsicht des Diffs |

## Bewertung der Beobachtung des Entwicklers

Frage des Prüfauftrags: Meldet die Konsistenzprüfung einen stehengebliebenen Wert so, dass der Anwender ihn erkennt?

Ergebnis: Ja, nach „Prüfen“ oder „Speichern“. Vorher zeigt die Oberfläche keinen Hinweis.

Nachweise:

1. Echtes Backend: Testumgebung mit `testenv start --frontend-port 18762 --backend-port 18761 --host 127.0.0.1` aus dem geprüften Commit, danach `testenv stop`. `POST /api/v1/check` mit einer Strategie mit einer Regel `zz` (Typ `Regel`), eigener Parameter `sel` vom Datentyp `time_unit` ohne `choices`, Belegung `{"kind": "fixed", "value": "a"}`. Das ist der Stand des Dokuments nach dem Wechsel in der Oberfläche. Antwort: ein Befund `level: error`, `code: parameter.binding_invalid`, `element: null`, `subject: "zz"`, `details.reason: "choice_value"`, `parameter: "sel"`, `values: ["a"]`, `allowed`: die 21 Zeiteinheiten der Bibliothek. Gegenprobe mit dem Wert `h1`: keine Befunde. Ursache in der Bibliothek: `packages/domain-core/src/pipwerk_domain/consistency/engine.py:1558-1559` (`_fixed_problem`), erlaubte Werte über `choice_ids` (`typedesc.py:223-229`).
2. Oberfläche: vorübergehender Vitest-Test mit den echten Typbeschreibungen. Das Backend im Speicher meldet genau den Befund aus Schritt 1. Ablauf: Strategie öffnen, Regel `zz` auswählen, Datentyp von `sel` von Auswahl (`a`, `b`, fester Wert `a`) auf Zeiteinheit.
   - Die Wertzeile „sel“ zeigt `a` als gewählten Eintrag, danach M1 bis MN1 (`ValueInput.tsx:141-145`).
   - Vor „Prüfen“ steht in der Ansicht der Regel kein Befund.
   - Nach „Prüfen“ steht unter „Befunde dieser Regel“ genau ein Text: „Die Belegung von „sel“ passt nicht: der feste Wert gehört nicht zur Auswahl.“

   Der Test hat bestanden. Ich habe ihn danach mit `git clean -f` auf genau diese Datei entfernt.

Der Anwender erkennt also den Parameter und dass der feste Wert nicht passt. Zur Wortwahl siehe Hinweis N13. Der stehengebliebene Wert selbst ist kein neuer Fehler: Schon im Elterncommit änderte der Wechsel des Datentyps die Belegung der Wertzeile nicht (`git diff 87c0efd 2ec7ad8`, alter Aufruf `update(index, { datatype, default: null })`). Die Entscheidung im Nachtrag regelt nur die `choices` der Definition.

## Blockierende Befunde

Keine.

## Hinweise (verhindern das Bestehen nicht)

### N12 – Gegenprobe Auswahl → Auswahl und Wechsel durch alle Datentypen nur für den Strategieparameter über die Oberfläche

Punkt 36 verlangt „Tests über die Oberfläche für Strategieparameter und Regelparameter: … Gegenprobe: Wechsel von Auswahl zu Auswahl ist kein Wechsel, Werte bleiben“. Für den Regelparameter fehlt die Gegenprobe über die Oberfläche; `Studio.properties.test.tsx:782-801` prüft nur den Strategieparameter. Für den Regelparameter ist das Verhalten über die gemeinsame Funktion `withDatatype` geprüft (`ops.test.ts:227-232`), die `RuleProperties.tsx:52` aufruft.

`docs/technical/pipwerk-studio.md:656` lautet: „Wechsel des Datentyps von Auswahl zu Zeiteinheit und durch alle Datentypen entfernt die `choices` bei Strategieparameter und Regelparameter, Gegenprobe Auswahl zu Auswahl“. Man kann das so lesen, dass beide Fälle für beide Parameterarten getestet sind. Für den Regelparameter ist nur der Wechsel von Auswahl zu Zeiteinheit getestet.

Ich führe das als Hinweis: Die Funktion ist nicht beeinträchtigt, und die gemeinsame Funktion ist geprüft. Durchlauf 4 hat die gleichartige Lücke N10 ebenso eingestuft. Die Aussage in Zeile 656 ist mehrdeutig, aber nicht eindeutig falsch.

### N13 – Text des Befunds zu einem stehengebliebenen Wert nennt „Auswahl“ statt Zeiteinheit

Bei einem Parameter vom Datentyp Zeiteinheit lautet der Befund „… der feste Wert gehört nicht zur Auswahl.“ (`locales/de.json:206`, `findings.bindingReasons.choice_value`). Die Oberfläche zeigt für diesen Parameter den Datentyp „Zeiteinheit“. Die erlaubten Werte schickt das Backend mit (`details.allowed`), der Text nennt sie nicht. Der Befund ist trotzdem dem Parameter zuzuordnen und als „passt nicht“ erkennbar. Die Stelle wurde in diesem Commit nicht geändert.

### N14 – Stehengebliebener Wert ist vor „Prüfen“ nicht gekennzeichnet

Nach dem Wechsel des Datentyps eines Regelparameters bleibt eine feste Belegung der Wertzeile erhalten (`RuleProperties.tsx:45-56` ändert `parameter_values` nicht). Die Wertzeile zeigt den alten Wert wie einen gültigen Eintrag (`ValueInput.tsx:141-145`). Einen Befund dazu gibt es erst nach „Prüfen“ oder „Speichern“. Das betrifft den Wechsel zu jedem Datentyp, zum Beispiel einen Text `a` nach dem Wechsel auf Zahl; die Bibliothek meldet dann den Grund `type` (`engine.py:1556-1557`). Das habe ich nur im Code gelesen, nicht mit einem Test belegt. Das Verhalten bestand schon im Elterncommit. Ob die Oberfläche die Belegung beim Wechsel ändern soll, lege ich nicht fest.

## Nachprüfung der Befunde aus Durchlauf 4

| Punkt | Stand | Nachweis |
|---|---|---|
| N9 Wechsel Auswahl → Zeiteinheit bietet alte Werte an | behoben | `withDatatype` entfernt `choices` (`ops.ts:25-38`), verwendet bei Strategie- und Regelparameter; Tests `Studio.properties.test.tsx:744`, `:760` |
| N10 Test eigener Parameter einer Instanz mit eigenen `choices` | behoben | `specs.test.ts:116-135` |
| N11 Aufzählung der Angaben ohne Funktionen | behoben | `pipwerk-studio.md:157` |

## Vom Entwickler gemeldete Angaben

- Vitest 746, Browsertests 69 bestanden und 6 übersprungen, Prüfskript „all checks passed“: stimmt mit meinem Lauf überein.
- Punkt 36 bis 39: stimmen mit dem Code überein. Die Gegenprobe über die Oberfläche fehlt für den Regelparameter (N12).
- Beobachtung zum stehengebliebenen Wert: bestätigt. Die Bibliothek meldet ihn, die Oberfläche zeigt ihn nach „Prüfen“ an der Regel (siehe Bewertung, N13, N14).

## Arbeitsverzeichnis

Den vorübergehenden Test habe ich mit `git clean -f` auf genau diese Datei entfernt. Die Testumgebung ist gestoppt. `git status --short` zeigt danach keine Ausgabe. Im Arbeitsverzeichnis bleiben nur die von `.gitignore` erfassten Erzeugnisse des Prüfskripts und der Testumgebung. Ein Befehl enthielt versehentlich ein `cd` in das Quellverzeichnis der Oberfläche; er hat nur gelesen (`grep`) und nichts verändert.
