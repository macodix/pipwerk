# Testbericht Tester Funktion – Auftrag 05, Durchlauf 1

- Bezug: `strategiedesign/wp01`, Auftrag `development/strategiedesign/wp01/orders/05.md`
- Übergabedokument: `strategiedesign/wp01:development/strategiedesign/wp01/tests/05-1-order.md`
- geprüfter Commit: `2dab08193fb62258f84707f2c6f2476a8b1c1273` (Zweig `strategiedesign/wp01-05`, aufgesetzt auf `39a2a7dffcebc44860254d5cb1f97d026a638260`). Vor der Prüfung im eigenen Arbeitsverzeichnis mit `git rev-parse HEAD` bestätigt.
- Prüfskript: `components/pipwerk-studio/scripts/check` im Commit `f7e234cb3e5dd34e0934f6e9b817dc353c247d52` (Zweig `strategiedesign/wp01-functiontest`, auf GitHub). Der Zweig enthält keine Änderung, die nicht schon im geprüften Commit liegt: `git log 2dab081..origin/strategiedesign/wp01-functiontest` ist leer. Der letzte Commit, der das Prüfskript im geprüften Commit ändert, ist ebenfalls `f7e234c` (`git log -1 -- components/pipwerk-studio/scripts/check`). Ich musste den Zweig deshalb nicht neu aufsetzen. Eine Änderung am Prüfskript war nicht nötig.
- Art des Durchlaufs: erster Durchlauf, vollständig
- Datum: 2026-10-17

## Ergebnis: bestanden

Ich habe keinen blockierenden Befund gefunden.

- Die geänderten Stellen zu H8 und H9 sind eindeutig. Sie stimmen mit Code, Beispieldateien und `docs/technical/pipwerk-domain.md` überein.
- Die Hinweise H8 und H9 der QA und H3 aus `04-functiontest-1.md` sind erledigt.
- Der Programmcode ist unverändert.
- Das Prüfskript mit `--with-audit` hat 19 Prüfungen bestanden. Gescheitert ist nur `npm audit` mit dem bekannten Altbefund (Hinweis H1). Er gehört laut Auftrag nicht zum Umfang („Nicht-Umfang“: Hinweis H4 der QA).

Die Schritte der Anwenderdokumentation habe ich nicht über HTTP in einer laufenden Testumgebung ausgeführt. Das Übergabedokument verlangt das nicht. Die Nachweise kommen aus den Tests mit dem Testclient und aus dem Abgleich von Text, Dateien und Code.

## Befunde (blockierend)

Keine.

## Prüfskript

Aufruf: `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp01/functiontest/components/pipwerk-studio/scripts/check --backend-port 8057 --frontend-port 5257 --with-audit`. Die Ports 5174 und 8001 der Testumgebung des Pakets habe ich nicht benutzt. Die Ausgabe nennt „checking … at commit 2dab08193fb62258f84707f2c6f2476a8b1c1273“. Exitcode 1.

| Prüfung | Ergebnis |
|---|---|
| Bibliothek: `uv sync --frozen`, pytest, `ruff check`, `ruff format --check`, mypy, Schemata gleich `contracts/strategies/v1`, pip-audit | bestanden: pytest 985 bestanden, mypy ohne Befund in 50 Quelldateien, pip-audit „No known vulnerabilities found“ |
| Backend: `uv sync --frozen`, pytest, `ruff check`, `ruff format --check`, mypy, pip-audit | bestanden: pytest 679 bestanden |
| Schreibweise des Namens | bestanden |
| Oberfläche: `npm ci`, Typprüfung, Vitest, Bau | bestanden |
| `npm audit` | gescheitert: `source-map-js` 1.0.0–1.2.1, GHSA-68fv-2mgg-jv7q, high (Hinweis H1) |
| Browsertest in Chromium, Firefox und WebKit | bestanden: 39 bestanden, 6 übersprungen |

Zusätzlich einzeln ausgeführt:

- `uv run --frozen pytest -q` im Backend: „679 passed“.
- `uv run --frozen pytest -q tests/test_user_documentation_examples.py`: „32 passed“. Das sind die 30 Tests aus Auftrag 04 und die zwei neuen.
- `npm audit` in der Oberfläche: derselbe Befund wie oben.

Die Zahlen stimmen mit den Angaben des Entwicklers überein (Backend 679, Bibliothek 985). Nach dem Lauf ist das Arbeitsverzeichnis sauber (`git status --short` ohne Ausgabe).

## Programmcode unverändert

`git diff --stat 39a2a7d 2dab081` nennt genau zwei Dateien:

- `docs/user/pipwerk-studio.md` (18 Zeilen geändert)
- `components/pipwerk-studio/backend/tests/test_user_documentation_examples.py` (19 Zeilen neu)

Programmcode, Beispieldateien und Prüfskript sind nicht geändert. Das entspricht der Angabe des Entwicklers.

## Prüfung gegen den Auftrag

### Punkt 1, Hinweis H8: Ersetzen im „Request body“, nicht in der Datei

`docs/user/pipwerk-studio.md`, Teil „Web-API ausprobieren“, Zeilen 36–104. Geprüft habe ich jeden Schritt, der Text einfügt, kopiert oder ändert:

| Stelle | Zeile | Ergebnis |
|---|---|---|
| „Beispieldokumente“, allgemeine Regel | 51 | eindeutig: Dateien im Arbeitsverzeichnis werden nie geändert und nicht neu gespeichert. Ersetzt wird im Text, der im „Request body“ eingefügt ist. Die Begründung stimmt: `testenv start` bricht bei einer Änderung ab (`components/pipwerk-studio/scripts/testenv`, Zeilen 223–231, `git status --porcelain`). Abschnitt 2, Zeile 34, sagt dasselbe. |
| Erster Teil, Schritt 4 | 43 | eindeutig: Das Feld `id` im „Request body“ muss die Kennung aus dem Pfad enthalten; ersetzt wird im eingefügten Text, nicht in der Datei. |
| Vorlage, Schritt 3 | 59 | eindeutig: Kopie des „Response body“, bearbeitet im Texteditor, nicht im Arbeitsverzeichnis gespeichert. |
| Vorlage, Schritt 4 | 60 | eindeutig: Einfügen in das kopierte Dokument, nicht in eine Datei des Arbeitsverzeichnisses. |
| Vorlage, Schritt 5 | 75 | eindeutig: das geänderte Dokument aus Schritt 4 im „Request body“. |
| Vorlage, Schritt 7 | 77 | eindeutig im Sinn von H8: keine Datei im Arbeitsverzeichnis überschreiben (siehe Hinweis H3). |
| Vorlage, Schritt 8 | 78 | eindeutig: Inhalt im „Request body“ einfügen, dann im eingefügten Text im Feld `id` ersetzen; „Die Datei im Arbeitsverzeichnis bleibt unverändert.“ `regel-vorlage-geaendert.rule.json` hat genau ein Feld `id` (`grep -c '"id"'` ergibt 1). |
| „Befunde verhindern das Speichern nicht“, Schritt 2 | 103 | eindeutig in Bezug auf Datei und „Request body“, wortgleich mit Schritt 8 (siehe Hinweis H2). |
| Erster Teil, Schritt 2; Vorlage, Schritte 1 und 2; Befunde, Schritt 1 | 41, 57, 58, 102 | Hier wird nichts ersetzt. Die allgemeine Regel in Zeile 51 gilt. |

Der alte Satz „Ersetzen Sie vorher im Feld `id` der Datei …“ steht nicht mehr in der Datei. Das prüft auch der neue Test.

### Punkt 2, Hinweis H9 und H3 aus `04-functiontest-1.md`: Stelle des Befunds

Tabelle „Befunde der Konsistenzprüfung“, Zeile 2 (Zeile 91 der Datei). Der Text nennt jetzt:

- die Felder `details.start` und `details.end` mit den Werten 13 und 14,
- dass ab 0 und in Zeichen des Ausdrucks gezählt wird,
- dass `start` das erste Zeichen der Stelle ist und `end` die Stelle hinter dem letzten Zeichen.

Abgleich:

- Code: `pipwerk_domain/consistency/engine.py`, Zeilen 501–508: Die Angaben `start` und `end` des Befunds im Ausdruck stehen in `details` des Befunds `expression.invalid`.
- `docs/technical/pipwerk-domain.md`, Zeile 273: „Positionen sind Zeichenpositionen (beginnend bei 0): `start` ist das erste Zeichen, `end` die Stelle hinter dem letzten Zeichen.“ Zeile 378 nennt `start` und `end` in den Angaben von `expression.invalid`. Der Text der Anwenderdokumentation stimmt damit überein.
- Gegenprobe von Hand: In `ema20.wert > > 1` stehen die Zeichen `>` an den Positionen 11 und 13. Das zweite `>` hat also `start` 13 und `end` 14.
- Test: `test_the_details_named_in_the_documentation` prüft gegen die Antwort der Web-API `{"issue": "syntax", "start": 13, "end": 14, "found": ">"}` (Zeile 231). Bestanden.

### Punkt 3: Tests

- `test_the_documentation_names_the_fields_and_counting_of_the_position` liest die Zeile der Tabelle mit `str-03-schreibfehler.strategy.json` aus dem Unterabschnitt und prüft die Texte `details.start`, `details.end`, „13 und 14“, „ab 0“ und „hinter ihrem letzten“. Bestanden.
- `test_the_steps_replace_the_identifier_in_the_request_body_not_in_the_file` prüft, dass der alte Satz fehlt und die beiden neuen Sätze je zweimal vorkommen (Schritt 8 und Befunde, Schritt 2). Bestanden.
- Die übrigen 30 Tests, die die Anwenderdokumentation lesen, bestehen mit dem geänderten Text.
- Die Felder der Stelle prüfte `test_the_details_named_in_the_documentation` schon vorher gegen die Antwort. Die neuen Tests sichern den Text der Dokumentation. Zusammen weisen sie nach, dass Text und Antwort übereinstimmen.
- `ruff check`, `ruff format --check` und mypy bestehen. Die Tests sind deterministisch.

### Technische Abnahmekriterien des Auftrags

| Nr. | Ergebnis | Nachweis |
|---|---|---|
| 1 | erfüllt | Prüfskript: alle Prüfungen für Bibliothek und Backend bestanden (siehe oben) |
| 2 | erfüllt | Abschnitte „Punkt 1“ und „Punkt 2“ oben |
| 3 | erfüllt | Suche nach `/srv`, `/home`, `/tmp`, Rechner- und Benutzernamen in den beiden geänderten Dateien: Treffer nur in unveränderten Zeilen, nämlich die öffentliche Adresse des Repositorys (Zeilen 157 und 232) und der als erfunden gekennzeichnete Beispielpfad `/home/beispiel/pipwerk` (Zeile 252) |
| 4 | erfüllt | Commit `2dab08193fb62258f84707f2c6f2476a8b1c1273` auf `origin/strategiedesign/wp01-05` |

### Technische Dokumentation

- `docs/technical/pipwerk-domain.md` braucht keine Änderung. Die Zeilen 273 und 378 beschreiben Stelle und Felder schon richtig.
- `docs/technical/pipwerk-studio.md`, Zeile 384, verweist weiter richtig auf die Anwenderdokumentation und auf `test_user_documentation_examples.py`.
- `docs/technical/pipwerk-studio.md`, Zeile 530, fasst den Inhalt von `test_user_documentation_examples.py` zusammen. Die beiden neuen Tests sind darin nicht eigens genannt (Hinweis H4). Die Zusammenfassung ist nicht falsch. Sie zählt auch bisher nicht jeden Test einzeln auf.

## Nachprüfung der Hinweise

| Hinweis | Ergebnis | Nachweis |
|---|---|---|
| H8 der QA (`reviews/2.md`) | erledigt | Punkt 1 oben |
| H9 der QA (`reviews/2.md`) | erledigt | Punkt 2 oben |
| H3 aus `04-functiontest-1.md` | erledigt | gleich H9, Punkt 2 oben |

## Hinweise

Die Hinweise verhindern das Bestehen nicht.

- H1: `npm audit` scheitert weiter am bekannten Befund `source-map-js` (GHSA-68fv-2mgg-jv7q). Das entspricht Hinweis H4 der QA. Laut Auftrag 05 gehört er nicht zum Umfang. `docs/technical/pipwerk-studio.md` Abschnitte 7 und 9 führen ihn als nicht behoben.
- H2: `docs/user/pipwerk-studio.md`, Zeile 103 („Befunde verhindern das Speichern nicht“, Schritt 2): „Ersetzen Sie dann im eingefügten Text, im Feld `id`, die Kennung …“. Eine Strategie hat viele Felder `id`. `str-03-schreibfehler.strategy.json` hat 16 davon (`grep -c '"id"'`): eines auf der obersten Ebene (Zeile 4) und eines je Element. Gemeint ist das Feld auf der obersten Ebene. Der Text sagt das nicht. Schritt 4 in Zeile 60 benennt die oberste Ebene dagegen ausdrücklich. Folge eines Irrtums: Die Kennung auf der obersten Ebene passt dann nicht zum Pfad, und `PUT` weist das Dokument ab. Dateien im Arbeitsverzeichnis bleiben dabei unverändert. Der Mangel war vor Auftrag 05 schon da und ist nicht Gegenstand von H8.
- H3: `docs/user/pipwerk-studio.md`, Zeile 77 (Vorlage, Schritt 7): „ohne eine Datei im Arbeitsverzeichnis zu überschreiben“. Der Text verbietet das Überschreiben. Er verbietet nicht, die Kopie als neue Datei im Arbeitsverzeichnis zu speichern. Auch eine neue, nicht ignorierte Datei lässt den nächsten Start der Testumgebung abbrechen (Zeile 34; `testenv`, Zeilen 223–231). Schritt 3 in Zeile 59 ist strenger: „ohne sie im Arbeitsverzeichnis zu speichern“. Die allgemeine Regel in Zeile 51 betrifft nur die vorhandenen Dateien.
- H4: `docs/technical/pipwerk-studio.md`, Zeile 530: Die Zusammenfassung von `test_user_documentation_examples.py` nennt die beiden neuen Prüfungen nicht. Das sind: Die Anwenderdokumentation nennt Felder und Zählung der Stelle, und die Schritte ersetzen im „Request body“, nicht in der Datei.
