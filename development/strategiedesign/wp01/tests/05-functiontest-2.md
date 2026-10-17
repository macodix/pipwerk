# Testbericht Tester Funktion – Auftrag 05, Durchlauf 2

- Bezug: `strategiedesign/wp01`, Auftrag `development/strategiedesign/wp01/orders/05.md`, Abschnitt „Nachtrag nach Durchlauf 1 der Tester“, Punkte 4 bis 7
- Übergabedokument: `strategiedesign/wp01:development/strategiedesign/wp01/tests/05-2-order.md`
- geprüfter Commit: `63014a9044c66551e944b40060fa6db5385cd8c1` (Zweig `strategiedesign/wp01-05`, aufgesetzt auf `2dab08193fb62258f84707f2c6f2476a8b1c1273`). Vor der Prüfung im eigenen Arbeitsverzeichnis mit `git rev-parse HEAD` bestätigt.
- Prüfskript: `components/pipwerk-studio/scripts/check` im Commit `f7e234cb3e5dd34e0934f6e9b817dc353c247d52` (Zweig `strategiedesign/wp01-functiontest`). Der letzte Commit, der das Prüfskript im geprüften Commit ändert, ist `f7e234c` (`git log -1 -- components/pipwerk-studio/scripts/check`). `git log 63014a9..origin/strategiedesign/wp01-functiontest` ist leer. Eine Änderung am Prüfskript war nicht nötig.
- Art des Durchlaufs: Nachprüfung der Hinweise H2, H3 und H4 aus `05-functiontest-1.md` und der dafür geänderten Stellen
- Datum: 2026-10-17

## Ergebnis: bestanden

Die Hinweise H2, H3 und H4 sind erledigt. Die geänderten Stellen enthalten keinen neuen Fehler. Alle Prüfungen des Prüfskripts sind bestanden.

## Befunde (blockierend)

Keine.

## Prüfskript

Aufruf: `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp01/functiontest/components/pipwerk-studio/scripts/check --backend-port 8058 --frontend-port 5258`, ohne `--with-audit`, wie im Übergabedokument verlangt. Die Ports 5174 und 8001 habe ich nicht benutzt. Die Ausgabe nennt „checking … at commit 63014a9044c66551e944b40060fa6db5385cd8c1“. Exitcode 0, letzte Zeile „check: all checks passed“.

| Prüfung | Ergebnis |
|---|---|
| Bibliothek: `uv sync --frozen`, pytest, `ruff check`, `ruff format --check`, mypy, Schemata gleich `contracts/strategies/v1` | bestanden: 985 Tests bestanden, mypy ohne Befund in 50 Quelldateien |
| Backend: `uv sync --frozen`, pytest, `ruff check`, `ruff format --check`, mypy | bestanden: 679 Tests bestanden |
| Schreibweise des Namens | bestanden: 459 Nennungen geprüft |
| Oberfläche: `npm ci`, Typprüfung, Vitest, Bau | bestanden: Vitest 244 Tests in 14 Dateien |
| Browsertest in Chromium, Firefox und WebKit | bestanden: 39 bestanden, 6 übersprungen |

Zusätzlich einzeln: `uv run --frozen pytest -q tests/test_user_documentation_examples.py` im Backend: „32 passed“. Die Zahlen stimmen mit den Angaben des Entwicklers überein (Backend 679, Bibliothek 985). Nach dem Lauf ist das Arbeitsverzeichnis sauber (`git status --short` ohne Ausgabe).

## Umfang der Änderung

`git diff --stat 2dab081 63014a9` nennt genau drei Dateien:

- `docs/user/pipwerk-studio.md` (5 Zeilen geändert)
- `docs/technical/pipwerk-studio.md` (1 Zeile geändert)
- `components/pipwerk-studio/backend/tests/test_user_documentation_examples.py` (1 Zeile ersetzt durch 10)

Programmcode, Beispieldateien und Prüfskript sind nicht geändert. Das entspricht der Angabe des Entwicklers.

## Nachprüfung der Hinweise

### H2: Feld `id` auf der obersten Ebene (Auftrag Punkt 4)

`docs/user/pipwerk-studio.md`:

| Stelle | Zeile | Ergebnis |
|---|---|---|
| Erster Teil, Schritt 4 | 43 | eindeutig: „Das Feld `id` auf der obersten Ebene des Dokuments im „Request body“ muss die Kennung aus dem Pfad enthalten“; dazu „Die Felder `id` der Elemente bleiben unverändert.“ |
| Vorlage, Schritt 8 | 78 | eindeutig: „die Kennung im Feld `id` auf der obersten Ebene des Dokuments“. `regel-vorlage-geaendert.rule.json` hat genau ein Feld `id`, auf der obersten Ebene in Zeile 4 (`grep -c '"id"'` ergibt 1). Der Zusatz zu den Elementen fehlt hier; er ist bei dieser Datei nicht nötig. |
| „Befunde verhindern das Speichern nicht“, Schritt 2 | 103 | eindeutig: Feld `id` auf der obersten Ebene, Felder `id` der Elemente unverändert. `str-03-schreibfehler.strategy.json` hat 16 Felder `id`, das der obersten Ebene in Zeile 4. |

Abgleich mit dem Code: `web_api.py` Zeile 460 meldet bei abweichender Kennung den Ort `["id"]`, also das Feld auf der obersten Ebene. Text und Code stimmen überein. H2 ist erledigt.

### H3: keine neue Datei im Arbeitsverzeichnis (Auftrag Punkt 5)

- „Beispieldokumente“, Zeile 51: Die Regel nennt jetzt auch Kopien von Antworten und geänderte Dokumente: „speichern Sie nicht als neue Datei im Arbeitsverzeichnis, sondern nur außerhalb davon oder gar nicht“. Die Begründung „Eine geänderte oder neue Datei wäre eine nicht committete Änderung“ stimmt mit Zeile 34 und dem Startskript überein (neue, nicht ignorierte Dateien lassen den Start abbrechen).
- Vorlage, Schritt 7, Zeile 77: „ohne sie im Arbeitsverzeichnis zu speichern, weder in einer vorhandenen noch in einer neuen Datei“.
- Vorlage, Schritt 3, Zeile 59 („ohne sie im Arbeitsverzeichnis zu speichern“) und Schritt 4, Zeile 60, waren schon streng genug.
- Kein anderer Schritt des Teils „Web-API ausprobieren“ (Zeilen 36–104) lässt das Speichern im Arbeitsverzeichnis zu.

H3 ist erledigt.

### H4: Zusammenfassung des Testmoduls (Auftrag Punkt 6)

`docs/technical/pipwerk-studio.md`, Zeile 530, nennt jetzt: die Zeile der Tabelle zu `expression.invalid` mit `details.start`, `details.end`, Zählung ab 0 und Stelle 13 bis 14, den Abgleich mit der Antwort, das Ersetzen im Feld `id` auf der obersten Ebene im „Request body“ (nicht in der Datei, nicht in den Feldern `id` der Elemente) und das Verbot neuer Dateien. Das entspricht den Tests `test_the_documentation_names_the_fields_and_counting_of_the_position`, `test_the_details_named_in_the_documentation` und `test_the_steps_replace_the_identifier_in_the_request_body_not_in_the_file`. H4 ist erledigt.

### Tests (Auftrag Punkt 7)

`test_the_steps_replace_the_identifier_in_the_request_body_not_in_the_file` (Zeilen 215–228; der nächste Test beginnt in Zeile 231) prüft:

- den Satz zum Ersetzen im Feld `id` auf der obersten Ebene genau zweimal (Zeilen 78 und 103 der Anwenderdokumentation),
- in Schritt 4 des ersten Teils die Nennung der obersten Ebene; der Ausschnitt `split("4. `PUT /api/v1/strategies/{id}`")[1]` trifft Zeile 43, denn Schritt 5 der Vorlage beginnt mit „5.“,
- den Satz zu den Feldern `id` der Elemente genau zweimal (Zeilen 43 und 103),
- die drei Texte zum Verbot neuer Dateien (Zeilen 51, 77, 59).

Die Prüfungen treffen die geänderten Stellen. Der Test besteht, ebenso `ruff check`, `ruff format --check` und mypy über das Prüfskript.

## Neue Probleme durch die Änderungen

Keine gefunden. Die geänderten Zeilen enthalten keine Pfade, Benutzer- oder Rechnernamen des Entwicklungsrechners (Durchsicht des vollständigen `git diff 2dab081 63014a9`).

## Hinweise

Die Hinweise verhindern das Bestehen nicht.

- H1: `npm audit` war in diesem Durchlauf nicht verlangt und lief nicht. Der bekannte Befund `source-map-js` (Hinweis H1 aus `05-functiontest-1.md`, Hinweis H4 der QA) gehört laut Auftrag nicht zum Umfang.
