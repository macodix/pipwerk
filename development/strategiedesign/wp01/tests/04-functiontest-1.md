# Testbericht Tester Funktion – Auftrag 04, Durchlauf 1

- Bezug: `strategiedesign/wp01`, Auftrag `development/strategiedesign/wp01/orders/04.md`
- Übergabedokument: `strategiedesign/wp01:development/strategiedesign/wp01/tests/04-1-order.md`
- geprüfter Commit: `6fee975f6f01ecfecbca44154864e157f20bcfd2` (Zweig `strategiedesign/wp01-04`, aufgesetzt auf `761979bf3e9813d9444bdc7d4c0fe572f38405fa`). Vor der Prüfung im eigenen Arbeitsverzeichnis mit `git rev-parse HEAD` bestätigt.
- Prüfskript: `components/pipwerk-studio/scripts/check` im Commit `f7e234cb3e5dd34e0934f6e9b817dc353c247d52` (Zweig `strategiedesign/wp01-functiontest`, auf GitHub). Der Zweig enthält keine Änderung, die noch nicht im Ausgangscommit liegt: `git log 6fee975..origin/strategiedesign/wp01-functiontest` ist leer. `git diff f7e234c 6fee975 -- components/pipwerk-studio/scripts/check` ist leer. Ich musste den Zweig deshalb nicht neu aufsetzen. Eine Änderung am Prüfskript war nicht nötig.
- Datum: 2026-10-17

## Ergebnis: bestanden

Ich habe keinen blockierenden Befund gefunden.

- Die Beispieldateien und die Anwenderdokumentation decken die Abnahmekriterien 5 und 7 vollständig ab. Die automatischen Tests weisen die beschriebenen Ergebnisse nach. Dazu verwenden sie die Dateien, den JSON-Block und die Tabelle aus der Anwenderdokumentation.
- Die QA-Hinweise H2, H3, H5, H6 und H7 sind erledigt.
- Das Programm ist unverändert.
- Das Prüfskript mit `--with-audit` hat 19 Prüfungen bestanden. Gescheitert ist nur `npm audit` mit dem bekannten Altbefund (Hinweis H1 unten). Dieser Befund gehört laut Auftrag nicht zum Umfang („Nicht-Umfang“: Hinweis H4 der QA).

Einschränkung: Die Schritte konnte ich nicht in einer laufenden Testumgebung ausprobieren. Diese Sitzung lehnt HTTP-Anfragen ab (Hinweis H2 unten). Die Nachweise kommen deshalb aus den Tests mit dem Testclient und aus dem Abgleich der Dokumentation mit den Dateien und dem Code.

## Befunde (blockierend)

Keine.

## Prüfskript

Aufruf: `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp01/functiontest/components/pipwerk-studio/scripts/check --backend-port 8047 --frontend-port 5247 --with-audit`. Die Ausgabe nennt „checking … at commit 6fee975f6f01ecfecbca44154864e157f20bcfd2“. Exitcode 1.

| Prüfung | Ergebnis |
|---|---|
| Bibliothek: `uv sync --frozen`, pytest, `ruff check`, `ruff format --check`, mypy, Schemata gleich `contracts/strategies/v1`, pip-audit | bestanden: pytest 985 bestanden, mypy ohne Befund in 50 Quelldateien, pip-audit „No known vulnerabilities found“ |
| Backend: `uv sync --frozen`, pytest, `ruff check`, `ruff format --check`, mypy, pip-audit | bestanden: pytest 677 bestanden, davon 30 in `test_user_documentation_examples.py`; pip-audit „No known vulnerabilities found“ |
| Schreibweise des Namens | bestanden |
| Oberfläche: `npm ci`, Typprüfung, Vitest, Bau | bestanden: Vitest 244 bestanden |
| `npm audit` | gescheitert: `source-map-js` 1.0.0–1.2.1, GHSA-68fv-2mgg-jv7q, high (Hinweis H1) |
| Browsertest in Chromium, Firefox und WebKit | bestanden: 39 bestanden, 6 übersprungen |

Die Zahlen der Tests stimmen mit den Angaben des Entwicklers überein (Backend 677, Bibliothek 985, 30 neue Tests). Nach dem Lauf ist das Arbeitsverzeichnis sauber (`git status --short` ohne Ausgabe).

## Programmcode unverändert

`git diff --stat 761979b 6fee975 -- components/pipwerk-studio/backend/src components/pipwerk-studio/frontend packages/domain-core/src` hat keine Ausgabe. Geändert sind nur die 15 Dateien aus der Angabe des Entwicklers: Dokumentation, Tests, Beispieldateien und `contracts/strategies/README.md`.

## Prüfung gegen den Auftrag

### Punkt 1, Kriterium 7: Vorlage anlegen, ändern und löschen

`docs/user/pipwerk-studio.md`, Unterabschnitt „Vorlage anlegen, ändern und löschen“, Schritte 1 bis 10.

- Beispieldateien: `regel-vorlage.rule.json` und `regel-vorlage-geaendert.rule.json`.
  - Beide sind vollständige Dokumente mit `format` `pipwerk.rule` und Objekttyp `Regel`.
  - Sie unterscheiden sich nur in `title`, `description` und `expression`. Das prüft `test_the_changed_template_differs_in_title_description_and_expression_only`.
- Stelle und Felder der Instanz sind genau genug angegeben:
  - Schritt 4 nennt die Liste `"rules"` auf der obersten Ebene, direkt unter `"parameters"`. Gegenprobe in `str-03.strategy.json`: Zeile 7 `parameters`, Zeile 23 `rules`, Zeile 56 `elements`.
  - Diese Liste enthält genau einen Eintrag `"name": "risiko"` (Zeilen 24–54).
  - Die Listen `"rules"` in den Elementen sind ausdrücklich ausgeschlossen. Ein solcher Eintrag steht in Zeile 287 (`mindestvolumen`).
  - Wird der Block mit Komma hinter dem Eintrag `risiko` eingefügt, entsteht gültiges JSON.
  - Der Platzhalter `<Kennung der Vorlage>` steht in Anführungszeichen. Das passt zur Anweisung „mit den Anführungszeichen“.
- `test_the_flow_with_a_template_of_the_user_documentation` geht die Schritte 1 bis 10 durch.
  - Er liest den JSON-Block aus der Anwenderdokumentation und setzt die Kennung ein.
  - Er fügt die Instanz hinter `risiko` ein.
  - Geprüft wird:
    - Schritt 1: 201, keine Befunde.
    - Schritt 5: PUT 200, keine Befunde.
    - Schritt 6: `usages` mit genau dem Eintrag `art` `strategies`, Kennung und Titel „EMA-Trendfolge“, `skipped_unreadable` 0.
    - Schritt 8: PUT der geänderten Fassung mit ersetzter Kennung, 200, Titel „Mindestvolumen doppelt“.
    - Schritt 9: DELETE 204, danach GET 404.
    - Schritt 10: Die Antwort ist als Text gleich der aus Schritt 7. Die Instanz `mindest` bleibt mit `origin.template_id`.
  - Bestanden.
- Die Erwartungen in den Schritten stimmen mit `docs/technical/pipwerk-studio.md` 5.2 überein:
  - `usages` und `skipped_unreadable`
  - Die Kennung im Dokument muss bei `PUT` die Kennung im Pfad sein.

### Punkt 1, Kriterium 5: sieben Abwandlungen und PUT

`docs/user/pipwerk-studio.md`, Unterabschnitt „Befunde der Konsistenzprüfung“, Tabelle mit sieben Zeilen.

- Für jede Datei prüft `test_a_changed_version_is_the_test_case_with_the_described_change`, dass sie genau `str-03` mit der beschriebenen Änderung ist. Dazu wird die Änderung in Python ausgeschrieben, über die Web-API normalisiert und verglichen.
- Die Angaben zur Fundstelle stimmen mit `str-03` überein:
  - `str-03` hat zwei Elemente „Kerzenschluss“ (Zeilen 191–193 und 309–311). Die Tabelle unterscheidet sie eindeutig durch `management_of` `null` und die Kennung `fd3b87fb-…`.
  - Von diesem Element geht genau eine Verbindung aus (Zeile 432). Das passt zu Zeile 1 der Tabelle („die Verbindung“).
  - Das neue Element `flow.modify_order` in `str-03-order-aendern-ausserhalb.strategy.json` hat `management_of` `null` (Zeile 439). Das passt zu „zu keiner Verwaltung gehört“.
- `test_check_reports_exactly_the_findings_of_the_documentation` prüft für jede Datei, dass `POST /api/v1/check` genau die Befunde der Tabelle meldet, mit `level`, `code` und `element`, und nichts speichert. Bestanden. Damit stimmt auch der Satz „Zu den Änderungen 2 bis 7 … keinen weiteren“.
- `test_the_details_named_in_the_documentation` prüft die genannten Angaben in `details` und `subject`. Bestanden.
  - Für den Schreibfehler: `syntax`, `start` 13, `end` 14, `found` `>`. Gegenprobe von Hand: In `ema20.wert > > 1` steht das zweite `>` an der Zeichenposition 13, gezählt ab 0.
- `test_put_saves_a_changed_version_with_its_findings` geht die drei Schritte zum Speichern mit Befunden durch: anlegen, Kennung ersetzen, PUT 200 mit denselben Befunden, GET liefert die Fassung. Bestanden.
- `test_the_documentation_names_the_findings_of_every_change` liest die Tabelle aus der Anwenderdokumentation und prüft je Datei die Codes der Befunde. Bestanden.
- Die Felder eines Befunds in der Anwenderdokumentation sind `level`, `code`, `element`, `subject` und `details`. Sie stimmen mit `FindingModel` in `contracts/api/pipwerk-studio/v1/openapi.json` überein (Zeilen 3039–3090).
- Gültigkeit der Beispiele gegen das Schema und in der gespeicherten Schreibweise:
  - `packages/domain-core/tests/test_schemas.py` prüft, dass alle neun Beispiele gegen ihr Schema gültig sind und dass `write_document(read_document(text)) == text` gilt. Bestanden.
  - `test_every_example_is_a_valid_document_and_named_in_the_user_documentation` prüft, dass jede Datei genau einmal vorkommt und in der Anwenderdokumentation genannt ist. Bestanden.
- Seiteneffekt geprüft: `write_schemas` und `differing_schemas` in `pipwerk_domain/documents/schemas.py` (Zeilen 51–69) behandeln nur die Schemadateien. Das neue Verzeichnis `examples` stört das Neuerzeugen und den Vergleich nicht. Die Prüfung „schemas equal“ im Prüfskript hat bestanden.

### Punkte 2 bis 6 (Hinweise der QA)

| Hinweis | Ergebnis | Nachweis |
|---|---|---|
| H5 | erledigt | `docs/user/pipwerk-studio.md` Zeile 47: „mit dem Feld `unreadable` und dem Wert `true` (auf Deutsch: nicht lesbar)“. Entspricht `unreadable` in `GET /api/v1/<art>` (technische Dokumentation, 5.2, Zeile 437). |
| H6 | erledigt | Glossar, Eintrag „Datenbank“: nennt die Einstellung „Objektverzeichnis“ und dass Strategien und Vorlagen als Dateien im Objektverzeichnis liegen, nicht in der Datenbank. |
| H2 | erledigt | Die Zeile „sqlalchemy“ in 7.1 nennt `storage.py`, `settings_service.py`, `migrate.py`, `cli.py` (nur `sqlalchemy.exc`) und `migrations/versions/v0001_initial.py` und `v0002_object_directory.py`. `grep -rl sqlalchemy backend/src` findet genau diese Module. Dazu kommt `migrations/script.py.mako`: die Vorlage für neue Migrationen, kein Modul. Für `cli.py` stimmt „nur `sqlalchemy.exc`“ (Zeile 15). |
| H3 | erledigt | Abschnitt 8, „Öffentliche Web-API“: Die Maßnahmen stehen jetzt in der Reihenfolge (1) bis (8). Maßnahme (4) verweist auf „Maßnahme 7 unten“, und (7) folgt danach. Die Verweise stimmen. Die Sätze, die vorher hinter (6) standen, folgen jetzt mit „Weiter gilt:“ nach (8). Der Inhalt ist unverändert. |
| H7 | erledigt | Abschnitt 7, zweiter Absatz: Der Satz endet jetzt „… durch die Arbeiten an Bibliothek, Web-API und Ablage nicht berührt; er ist in Abschnitt 9 als nicht behoben geführt.“ Das stimmt mit Abschnitt 9 überein („Der `npm audit`-Befund … ist nicht behoben“). Die weiteren Umformulierungen in Abschnitt 8 („gehört nicht zum Umfang dieses Standes“) und Abschnitt 9 („Benutzerkonten gibt es in diesem Stand nicht“) sind sachlich richtig. |

Andere Stellen mit `WO-…` (Abschnitt 1, Zeile 13; Architekturentscheidungen Zeilen 158 und 169) nennen die Herkunft früherer Teile. Sie sind keine veralteten Aussagen über den Umfang. Sie gehören nicht zum Hinweis H7.

### Punkt 7: Tests

Vorhanden und bestanden:

- `components/pipwerk-studio/backend/tests/test_user_documentation_examples.py` (30 Tests)
- Erweiterung von `packages/domain-core/tests/test_schemas.py`

Jedes Beispiel wird geladen, gegen das Schema geprüft und über den Testclient verwendet. Die Tests lesen den Block der Instanz und die Tabelle aus der Anwenderdokumentation. Sie sind deterministisch, mit festen Kennungen und den Testfalldokumenten aus dem Repository. `ruff` und `mypy` bestehen.

### Punkt 8 und Dokumentation

- `docs/technical/pipwerk-studio.md` 4a (Zeile 384) verweist für die Kriterien 5 und 7 auf die Anwenderdokumentation, Abschnitt 2, „Web-API ausprobieren“, und auf die Tests.
- 6.1 beschreibt `test_user_documentation_examples.py` passend zum Inhalt des Tests.
- `docs/technical/pipwerk-domain.md` beschreibt die Beispieldokumente im neuen Abschnitt 10.3. Die Tabelle in Abschnitt 12 nennt die Beispiele bei `test_schemas.py`.
- `contracts/strategies/README.md` nennt `testcases/` und `examples/`.
- Das Glossar der Anwenderdokumentation enthält neu „Vorlage“, „Instanz“, „Konsistenzprüfung“ und „Befund“. Die Einträge sind sachlich richtig.
- In den geänderten Dateien stehen keine Pfade, Benutzernamen oder Rechnernamen des Entwicklungsrechners.

## Hinweise

Die Hinweise verhindern das Bestehen nicht.

- H1: `npm audit` scheitert weiter am bekannten Befund `source-map-js` (GHSA-68fv-2mgg-jv7q). Das entspricht QA-Hinweis H4. Laut Auftrag 04 gehört er nicht zum Umfang. Er ist in `docs/technical/pipwerk-studio.md` Abschnitt 7 und 9 als nicht behoben geführt.
- H2: Prüfung in der laufenden Testumgebung nicht möglich, Berechtigung fehlt.
  - Ich habe die Testumgebung im eigenen Arbeitsverzeichnis auf den Ports 5248 und 8048 gestartet. Die Meldung war „pipwerk Studio is running: http://127.0.0.1:5248/ (backend on 127.0.0.1:8048)“.
  - Danach wurde `curl` auf `http://127.0.0.1:8048/docs` abgelehnt („Permission to use Bash has been denied“). Die Testumgebung habe ich wieder beendet. `.testenv/` ist entfernt, `git status` ist sauber.
  - Die Schritte habe ich deshalb nicht über HTTP und `/docs` ausgeführt. Sie sind über den Testclient derselben Anwendung nachgewiesen (siehe oben).
  - In Auftrag 03, Durchlauf 2, waren solche Anfragen noch möglich (Bericht `03-functiontest-2.md`).
  - Benötigte Handlung: Die Sitzung des Testers Funktion braucht die Freigabe, HTTP-Anfragen an `http://127.0.0.1:<eigener Port>` zu senden. Zuständig ist der Projektleiter (Freigaben in `devteam/`), über den Softwarearchitekten. Dieselbe Lücke nennt die QA in ihrem Prüfbericht als Befund B1.
- H3: `docs/user/pipwerk-studio.md`, Tabelle „Befunde der Konsistenzprüfung“, Zeile 2: „der Stelle 13 bis 14“.
  - Die Anwenderdokumentation nennt nicht die Felder `details.start` und `details.end`. Sie sagt auch nicht, dass ab 0 gezählt wird und `end` hinter dem letzten Zeichen liegt. Das steht nur in `docs/technical/pipwerk-domain.md` Zeile 273.
  - Der Zusatz „(das zweite `>`)“ macht die Stelle trotzdem eindeutig.
