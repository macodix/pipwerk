# Testbericht Tester Funktion – Auftrag 03, Durchlauf 2

- Vorhaben `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- Prüfauftrag: `strategiedesign/wp02:development/strategiedesign/wp02/tests/03-2-order.md`
- geprüfter Commit: `13f1b4ac7b7039ef3c404ac02d0e74cd6516d3ab` (Zweig `strategiedesign/wp02-03`, Elterncommit `cfa7107f0fc4a1fecc7bccce51327aedce3225e3`)
- Prüfskript: `components/pipwerk-studio/scripts/check` im Stand des geprüften Commits `13f1b4ac7b7039ef3c404ac02d0e74cd6516d3ab`. Es war keine Änderung nötig. Deshalb gibt es keinen Zweig `strategiedesign/wp02-functiontest` und keinen eigenen Commit des Prüfskripts.
- Grundlagen: Auftrag `development/strategiedesign/wp02/orders/03.md`, besonders „Nachtrag nach Durchlauf 1 der Tester“ (Punkte 7 bis 9) und „Technische Abnahmekriterien“; Testbericht `03-functiontest-1.md`; `docs/technical/pipwerk-studio.md` und `docs/technical/entwicklungsverfahren.md` („Umfang der Prüfungen“), im Stand des geprüften Commits
- Art der Prüfung: Nachprüfung. Geprüft sind die Punkte 7 und 8, die Hinweise H1 und H2 aus Durchlauf 1 und die geänderten Stellen (Diff `cfa7107…13f1b4a`: `object_service.py`, `object_store.py`, `web_api.py`, zwei Testdateien, `openapi.json`, `docs/technical/pipwerk-studio.md`).

## Ergebnis

**nicht bestanden**

Zwei blockierende Befunde (B1, B2). Beide betreffen Punkt 8: Die technische Dokumentation sagt für zwei Fälle etwas anderes, als der Code tut (Abnahmekriterium 5). B1 widerspricht außerdem dem Wortlaut von Punkt 8 des Nachtrags. Punkt 7 ist erfüllt. Das Prüfskript endet mit Exitcode 0.

## Nachweise

| Prüfung | Ergebnis | Nachweis |
|---|---|---|
| Ausgecheckter Commit | `13f1b4ac7b7039ef3c404ac02d0e74cd6516d3ab` | `git -C <Arbeitsverzeichnis> rev-parse HEAD` vor und nach der Prüfung |
| Prüfskript `check --backend-port 18441 --frontend-port 18442` (ohne `--with-audit`) | Exitcode 0, „all checks passed“ | Bibliothek: `uv sync --frozen`, pytest 1013 bestanden, ruff check, ruff format --check, mypy, Abgleich der Schemata; Backend: `uv sync --frozen`, pytest 697 bestanden, ruff check, ruff format --check, mypy; Suche nach der Schreibweise des Namens (463 Stellen); Oberfläche: `npm ci`, Typprüfung, Vitest 244 bestanden, Bau; Browsertest 39 bestanden, 6 übersprungen (die Fälle „without a Git working tree“, wie in Durchlauf 1) |
| Punkt 7: Protokoll bei `500` | erfüllt | `web_api.py`, Zeilen 459–469 (`_log_failure`) und 501–506: fester Text, Klasse der ursprünglichen Ausnahme (Kette über `__cause__`), `errno` falls vorhanden, kein `exc_info`. Eigene Proben über den Testclient, Logger `pipwerk_studio.web_api`: `PUT` (Ersetzen), `DELETE` und `POST` in einem Verzeichnis ohne Schreibrecht: je `500` und `An object file could not be written or deleted. (PermissionError, errno 13)`; `GET /api/v1/rules` in einem Verzeichnis ohne Leserecht: `500` und `The object directory cannot be read. (PermissionError, errno 13)`; Verzeichnis unter dem Dateinamen: `… (ObjectWriteError)` ohne Fehlernummer. In keinem Fall enthält das Protokoll den Pfad des Objektverzeichnisses oder „Traceback“; `exc_info` ist bei allen Einträgen leer. |
| Punkt 7: Test | vorhanden, bestanden | `tests/test_web_api_errors.py`, Zeile 418 `test_the_log_of_a_500_has_a_fixed_text_with_the_class_and_the_error_number`: zwei Einträge geschrieben (Gegenprobe), kein Pfad, kein Ausnahmetext („Not a directory“), kein „Traceback“, kein `exc_info` |
| Punkt 7: Dokumentation | erfüllt | `docs/technical/pipwerk-studio.md`, Zeile 477 (Abschnitt 5.2, unter der Fehlertabelle) und Abschnitt 8, Maßnahme 5 (Zeile 708) nennen den Inhalt des Protokolls; stimmt mit den Proben überein. Eine Suche nach „Protokoll“ in der Datei findet keine weitere Stelle zu `500`. |
| Punkt 8: symbolische Verknüpfung derselben Art | `409`, nichts geschrieben | Test `test_a_symbolic_link_is_neither_listed_nor_read_nor_deleted` und `test_a_dangling_symbolic_link_of_the_same_kind_blocks_saving` (`tests/test_web_api_unreadable.py`, Zeilen 170, 212). Eigene Probe, Verknüpfung auf eine gültige Regel außerhalb des Objektverzeichnisses: `PUT` `409` mit „A symbolic link lies under the file name of the object in the object directory. Nothing was written.“, `GET` `404`, `DELETE` `404`, nicht in der Liste, Verknüpfung besteht, Ziel Byte für Byte unverändert, keine weitere Datei im Verzeichnis. Verknüpfung auf ein Verzeichnis: `409`, das Verzeichnis bleibt leer. |
| Punkt 8: symbolische Verknüpfung einer anderen Art, keine Datei der Art des Pfades | `409`, nichts geschrieben | Test `test_a_symbolic_link_of_another_kind_blocks_saving` (Zeile 192, mit und ohne Ziel). Eigene Probe, Verknüpfung auf ein Verzeichnis unter `<id>.strategy.json`, `PUT /api/v1/rules/<id>`: `409` mit dem Text von `ObjectKindConflictError`. |
| Punkt 8: symbolische Verknüpfung einer anderen Art, Datei der Art des Pfades vorhanden | **`200`, geschrieben** | siehe B1 |
| Punkt 8: Dokumentation | teilweise falsch | siehe B1 und B2; Fehlertabelle 5.2 (zwei Zeilen `409`) und Testbeschreibung (Zeile 537) stimmen |
| `openapi.json` | gleich der erzeugten Beschreibung | `tests/test_contract.py` bestanden (Prüfskript); Diff ändert nur die Beschreibung von `409` und von `PUT` |
| H2 aus Durchlauf 1 | bleibt, entschieden | Entscheidung des Softwarearchitekten im Nachtrag; `registry.py` nicht geändert |
| Programmierregeln | erfüllt | ruff, ruff format, mypy ohne Befund; keine festen Pfade, Ports oder Rechnernamen in den geänderten Dateien; Dateiname in `is_link` nur über `object_file_name` (`object_store.py`, Zeile 467), also aus geprüfter UUID und fester Art |
| Aufräumen | erledigt | eigene Probedatei unter `backend/tests/` und das dabei entstandene `__pycache__/` dieses Verzeichnisses (vom Prüfskript und von meinen Proben erzeugt, von Git ignoriert) entfernt; `git status --short` leer |

Hinweis zum Ablauf: Ich habe die Probedatei einmal angelegt, als das Prüfskript noch lief. Ich habe sie wieder entfernt, bevor ruff, ruff format und mypy des Backends liefen (Ausgabe: „collected 697 items“ vor dem Anlegen; nach dem Entfernen liefen ruff und mypy). Das Ergebnis des Prüfskripts ist davon nicht berührt. Die Proben liefen danach getrennt.

## Befunde

### B1 – Symbolische Verknüpfung einer anderen Art blockiert das Ersetzen nicht (blockierend)

- Fundstelle: `components/pipwerk-studio/backend/src/pipwerk_studio/object_service.py`, Zeilen 380–395; `docs/technical/pipwerk-studio.md`, Zeile 452 (Abschnitt 5.2, Punkt „Speichern“) und Zeile 236 (Abschnitt 2.8); Auftrag 03, Nachtrag Punkt 8
- Sachverhalt: Die Prüfung auf Verknüpfungen (`is_link`) läuft nur, wenn unter der Art des Pfades keine Datei liegt (`if created:`). Probe: `PUT /api/v1/rules/<id>` legt die Regel an (`201`). Danach liegt unter `<id>.indicator.json` eine symbolische Verknüpfung. Ein zweites `PUT /api/v1/rules/<id>` antwortet `200` und schreibt die Regel. Punkt 8 des Nachtrags sagt: „Liegt unter einem Dateinamen der Kennung im aktuellen Objektverzeichnis eine symbolische Verknüpfung, gleich welcher Art, ist der Name belegt: `PUT` antwortet `409` mit festem Text und schreibt nichts“. Die technische Dokumentation sagt in 5.2 ebenfalls ohne Einschränkung: „Liegt unter dem Dateinamen der Kennung eine symbolische Verknüpfung …, gleich ob unter der Art des Pfades oder unter einer anderen Art, ist der Name belegt: `PUT` antwortet `409` … und schreibt nichts“. Code einerseits, Auftrag und Dokumentation andererseits stimmen für diesen Fall nicht überein (Abnahmekriterium 5). Kein Test deckt den Fall ab; die Tests in `test_web_api_unreadable.py`, Zeilen 192 und 212, legen nur die Verknüpfung an, keine Datei der Art des Pfades.
- Dazu gehörig, aus dem Stand vor diesem Commit: Mit einer regulären Datei einer anderen Art verhält es sich ebenso. Probe: Regel `<id>` vorhanden, dazu `<id>.indicator.json` als Datei; `PUT /api/v1/rules/<id>` antwortet `200`. Die Dokumentation (5.2, „Liegt im aktuellen Verzeichnis eine Datei derselben Kennung mit einer anderen Art …, antwortet `PUT` mit `409`“) schränkt das ebenfalls nicht auf das Anlegen ein. Diesen Fall habe ich in Durchlauf 1 nicht geprüft. Ob die Regel für andere Arten nur beim Anlegen gilt (dann ist die Dokumentation zu ändern) oder auch beim Ersetzen (dann der Code), ist nach Auftrag und Dokumentation nicht eindeutig.

### B2 – Abschnitt 2.8 überträgt die Antwort `409` sprachlich auf ein Verzeichnis unter dem Dateinamen (blockierend)

- Fundstelle: `docs/technical/pipwerk-studio.md`, Zeile 236 (Abschnitt 2.8, letzter Punkt der Ablage)
- Sachverhalt: Der Commit hat in den Satz zu symbolischen Verknüpfungen den Teil „beim Speichern (`PUT`, Abschnitt 5.2) gilt der Name einer Verknüpfung … als belegt (HTTP 409 mit festem Text)“ eingefügt. Der unveränderte Folgesatz lautet: „Dasselbe gilt für ein Verzeichnis mit dem Namen einer Objektdatei.“ Er bezieht sich damit auch auf die Antwort `409`. Der Code verhält sich anders. Probe: Verzeichnis `<id>.rule.json` im Objektverzeichnis, `PUT /api/v1/rules/<id>` antwortet `500` („The object file could not be written or deleted.“, Protokoll `… (ObjectWriteError)`). Verzeichnis `<id>.ruleset.json`, `PUT /api/v1/rules/<id>` antwortet `201` und legt die Regel an. Die Dokumentation stimmt damit für diesen Fall nicht mit dem Code überein (Abnahmekriterium 5). Das Verhalten selbst war vor diesem Commit dasselbe; neu ist die Aussage der Dokumentation.

## Hinweise

### H1 – Verzeichnis und Verknüpfung auf ein Verzeichnis werden bei einer anderen Art verschieden behandelt

- Fundstelle: `object_service.py`, Zeilen 386–394
- Sachverhalt: Eine symbolische Verknüpfung unter `<id>.strategy.json`, die auf ein Verzeichnis zeigt, ergibt bei `PUT /api/v1/rules/<id>` `409`. Ein echtes Verzeichnis unter `<id>.ruleset.json` ergibt `201`, die Regel wird angelegt. Ein Verzeichnis unter der Art des Pfades ergibt `500` statt `409`. Der Auftrag regelt Verzeichnisse nicht. Die Einordnung ist eine Entscheidung des Softwarearchitekten; sie hängt mit B2 zusammen.

## Stand der Befunde aus Durchlauf 1

| Befund | Stand |
|---|---|
| Funktion H1 (unterschiedliche Statuscodes für einen belegten Namen) | für Verknüpfungen beim Anlegen erledigt (`409`); beim Ersetzen nicht, siehe B1; für Verzeichnisse weiter `500`, siehe B2 und H1 |
| Funktion H2 (eigene `choices` fremder Typen) | vom Softwarearchitekten entschieden: bleibt; unverändert |
| Sicherheit B1 (Protokoll bei `500`) | aus Sicht der Funktion erledigt (Punkt 7); die Bewertung liegt beim Tester Sicherheit |
