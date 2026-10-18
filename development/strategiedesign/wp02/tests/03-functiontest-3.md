# Testbericht Tester Funktion – Auftrag 03, Durchlauf 3

- Vorhaben `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- Prüfauftrag: `strategiedesign/wp02:development/strategiedesign/wp02/tests/03-3-order.md`
- geprüfter Commit: `f0345bb3370d9c9cba8fd8ca27e133ce5ddf50ab` (Zweig `strategiedesign/wp02-03`, Elterncommit `13f1b4ac7b7039ef3c404ac02d0e74cd6516d3ab`)
- Prüfskript: `components/pipwerk-studio/scripts/check` im Stand des geprüften Commits `f0345bb3370d9c9cba8fd8ca27e133ce5ddf50ab`. Es war keine Änderung nötig. Deshalb gibt es keinen Zweig `strategiedesign/wp02-functiontest` und keinen eigenen Commit des Prüfskripts.
- Grundlagen: Auftrag `development/strategiedesign/wp02/orders/03.md`, besonders „Nachtrag nach Durchlauf 2 der Tester“ (Punkte 10 bis 12) und „Technische Abnahmekriterien“; Testbericht `03-functiontest-2.md`; `docs/technical/pipwerk-studio.md` und `docs/technical/entwicklungsverfahren.md` („Umfang der Prüfungen“), im Stand des geprüften Commits
- Art der Prüfung: Nachprüfung. Geprüft sind die Punkte 10 bis 12, die Befunde B1, B2 und H1 aus Durchlauf 2 und die geänderten Stellen (Diff `13f1b4a…f0345bb`: `object_service.py`, `object_store.py`, `web_api.py`, `tests/test_web_api_objects.py`, `tests/test_web_api_unreadable.py`, `openapi.json`, `docs/technical/pipwerk-studio.md`).

## Ergebnis

**nicht bestanden**

Ein blockierender Befund (B1): Punkt 10 verlangt Tests für jede Zeile der Regel, jeweils beim Anlegen und beim Ersetzen. Für die Zeile „lesbare gewöhnliche Datei unter einer anderen Art“ fehlt der Test beim Ersetzen. Genau das war der Fall aus B1 von Durchlauf 2. Das Verhalten des Codes ist in diesem Fall richtig (eigene Probe, siehe Nachweise). Die Befunde B1 und B2 aus Durchlauf 2 sind im Code und in der Dokumentation erledigt. Das Prüfskript endet mit Exitcode 0.

## Nachweise

| Prüfung | Ergebnis | Nachweis |
|---|---|---|
| Ausgecheckter Commit | `f0345bb3370d9c9cba8fd8ca27e133ce5ddf50ab` | `git -C <Arbeitsverzeichnis> rev-parse HEAD` vor und nach der Prüfung |
| Prüfskript `check --backend-port 18451 --frontend-port 18452` (ohne `--with-audit`) | **Exitcode 0**, „check: all checks passed“ | Exitcode aus der Meldung der Laufzeitumgebung über das Ende des Befehls („completed (exit code 0)“). Bibliothek: `uv sync --frozen`, pytest 1013 bestanden, ruff check, ruff format --check, mypy, Abgleich der Schemata; Backend: `uv sync --frozen`, pytest 726 bestanden, ruff check, ruff format --check, mypy; Suche nach der Schreibweise des Namens (463 Stellen); Oberfläche: `npm ci`, Typprüfung, Vitest 244 bestanden, Bau; Browsertest 39 bestanden, 6 übersprungen (wie in Durchlauf 2) |
| Punkt 10, Code | erfüllt | `object_service.py`, Zeilen 376–390: nicht lesbare Datei der Art des Pfades → `ObjectUnreadableError`; fehlt die Datei, aber `has_entry` findet einen Eintrag → `ObjectNameTakenError`; danach für jede andere Art `has_entry` → `ObjectKindConflictError`, ohne Bedingung `created`, also beim Anlegen und beim Ersetzen. `object_store.py`, Zeilen 464–470: `has_entry` mit `os.path.lexists` (folgt keiner Verknüpfung), Dateiname nur über `object_file_name` (geprüfte UUID, feste Art). |
| Punkt 10, eigene Proben (Testclient, temporäre Testdatei im Arbeitsverzeichnis, danach entfernt) | alle wie verlangt | Ersetzen (gültige Regel vorhanden) mit gültigem Indikator, gültigem Regelwerk, Datei unter `strategy` und `trend` derselben Kennung: je `409`, Text von `ObjectKindConflictError`, keine `findings` in der Antwort, Objektverzeichnis (Namen, Inhalt, Änderungszeit) unverändert, Pfad des Objektverzeichnisses nicht im Protokoll. Datei ohne Leserecht (Rechte 000) unter der Art des Pfades: `409` „The object file cannot be read …“; unter einer anderen Art beim Ersetzen: `409` Konflikt. Verknüpfung auf ein Verzeichnis unter der Art des Pfades: `409`, Zielverzeichnis bleibt leer. Verzeichnis mit Inhalt unter einer anderen Art beim Ersetzen: `409`, Inhalt unverändert; `GET` dieser Art `404`, `GET` der Regel `200`. Fehlendes Objektverzeichnis: `201` mit `findings`, Verzeichnis mit Rechten `0700` angelegt; danach `200` mit `findings`. Verzeichnis unter einer **anderen** Kennung: `200` (kein Fehlalarm). Benannte Pipe unter der Art des Pfades und unter einer anderen Art: `409`, ohne Hängen (siehe H1). |
| Punkt 10, Tests | teilweise | `tests/test_web_api_unreadable.py`: Zeilen 259–283 (`test_any_entry_of_another_kind_blocks_creating_and_replacing`, 3 andere Arten × 4 Einträge × Anlegen/Ersetzen, Abbild des Verzeichnisses und Ziel der Verknüpfung vorher und nachher), 286–303 (Verknüpfung mit und ohne Ziel, Verzeichnis unter der Art des Pfades), 306–316 (nicht lesbare Datei), 319–329 (`201`, `200`); `tests/test_web_api_objects.py`, Zeile 340 (gültige Datei anderer Art, nur beim Anlegen). Lücke siehe B1. |
| Punkt 11, Dokumentation | erfüllt | `docs/technical/pipwerk-studio.md`, Zeile 236 (2.8): verweist für `PUT` auf 5.2; der Satz zu Verzeichnissen nennt keine Antwort mehr, nur „weder aufgelistet noch gelesen, gelöscht oder verändert“ (B2 aus Durchlauf 2 erledigt). Zeilen 452–456 (5.2, „Speichern“) und Fehlertabelle (zwei Zeilen `409`, Zeilen 471–472) beschreiben die Regel aus Punkt 10 Zeile für Zeile; Texte gleich den Konstanten in `web_api.py`, Zeilen 106–113, und den Proben. Kein Satz überträgt eine Antwort auf einen Fall, für den sie nicht gilt. Zeile 541 (Testbeschreibung) stimmt mit den Tests überein; sie nennt den fehlenden Fall auch nicht. |
| `openapi.json` | gleich der erzeugten Beschreibung | `tests/test_contract.py` bestanden (Prüfskript); Diff ändert nur Beschreibungstexte (25 Zeilen) |
| Veraltete Texte | keine im Repository | Suche nach dem alten Text von `ObjectKindConflictError`, dem alten Text von `ObjectNameTakenError` und `is_link` in `*.py`, `*.md`, `*.json`, `*.ts`, `*.tsx`: nur der Docstring in `object_service.py`, Zeile 90 (siehe H2) |
| Anwenderdokumentation | stimmt | `docs/user/pipwerk-studio.md`, Zeile 106 nennt `409` für eine Datei anderer Art; das ist eine richtige Teilaussage der Regel |
| Programmierregeln, Abnahmekriterium 4 | erfüllt | ruff, ruff format, mypy ohne Befund; kein fester Pfad, Port oder Rechnername in den geänderten Dateien |
| Aufräumen | erledigt | eigene Probedatei unter `backend/tests/` und das von Prüfskript und Proben erzeugte, von Git ignorierte `backend/tests/__pycache__/` entfernt; `git status --short` leer. Die Proben liefen erst nach dem Ende des Prüfskripts. |

## Befunde

### B1 – Test für eine lesbare Datei einer anderen Art beim Ersetzen fehlt (blockierend)

- Fundstelle: `components/pipwerk-studio/backend/tests/test_web_api_unreadable.py`, Zeile 256 (`ENTRIES = ["bad file", "link", "dangling link", "directory"]`) und Zeilen 240–252 (`make_entry` kennt den Fall `"valid file"`, er wird nirgends verwendet); `tests/test_web_api_objects.py`, Zeile 340; Auftrag 03, Punkt 10, zweite und letzte Zeile
- Sachverhalt: Punkt 10 nennt unter einer anderen Art „gewöhnliche Datei (lesbar oder nicht)“ und verlangt „Tests für jede Zeile, jeweils beim Anlegen und beim Ersetzen (vorher eine gültige Datei der Art des Pfades)“. Der parametrisierte Test deckt unter einer anderen Art nur die nicht lesbare Datei (`{`), Verknüpfung mit und ohne Ziel und Verzeichnis ab. Die lesbare, gültige Datei einer anderen Art ist nur beim Anlegen getestet (`test_web_api_objects.py`, Zeile 340: Regel vorhanden, `PUT /api/v1/indicators/<id>` auf einen fehlenden Indikator). Beim Ersetzen (gültige Datei der Art des Pfades vorhanden, dazu eine gültige Datei einer anderen Art) gibt es keinen Test. Das ist der Fall aus B1 von Durchlauf 2 („Regel vorhanden, dazu `<id>.indicator.json` als Datei; `PUT /api/v1/rules/<id>` antwortet `200`“). Der Code verhält sich jetzt richtig (eigene Probe: `409`, nichts geschrieben); es fehlt der verlangte Test. Der Fall widerspricht damit einer Anforderung des Auftrags (Punkt 10).

## Hinweise

### H1 – Andere Einträge als Verknüpfung und Verzeichnis

- Fundstelle: `object_service.py`, Zeilen 381–389; `web_api.py`, Zeilen 106–113; `docs/technical/pipwerk-studio.md`, Zeilen 453–454
- Sachverhalt: Eine benannte Pipe (oder ein anderer Eintrag, der keine gewöhnliche Datei ist) unter der Art des Pfades ergibt `409` mit dem Text „A symbolic link or a directory lies under the file name …“, unter einer anderen Art `409` mit „An entry of another kind (a file, a symbolic link or a directory) …“. Das Verhalten entspricht Punkt 10 („ein Eintrag, der keine lesbare gewöhnliche Datei dieser Art ist“). Die Dokumentation zählt mit „nämlich“ nur Verknüpfung und Verzeichnis beziehungsweise Datei, Verknüpfung und Verzeichnis auf, und der feste Text nennt den Eintrag nicht zutreffend. Die Antwort selbst ist richtig; der Fall ist im Auftrag nicht ausdrücklich genannt.

### H2 – Docstrings nicht nachgezogen

- Fundstelle: `object_service.py`, Zeile 90 (`ObjectNameTakenError`: „A symbolic link lies under the file name of the object …“) und Zeilen 359–360 (`replace`: „A file of the same identifier of another kind is not touched and nothing is written.“)
- Sachverhalt: Beide Texte beschreiben den Stand vor diesem Commit. `ObjectNameTakenError` gilt jetzt auch für ein Verzeichnis; `replace` lehnt jeden Eintrag einer anderen Art ab und auch Verknüpfung und Verzeichnis unter der Art des Pfades. Falsch sind die Sätze nicht, nur unvollständig. Die technische Dokumentation unter `docs/` ist richtig.

## Stand der Befunde aus Durchlauf 2

| Befund | Stand |
|---|---|
| B1 (Verknüpfung oder Datei einer anderen Art blockiert das Ersetzen nicht) | im Code erledigt: Ersetzen mit Verknüpfung, Verzeichnis, lesbarer und nicht lesbarer Datei einer anderen Art ergibt `409`, nichts geschrieben (Tests und eigene Proben); Test für die lesbare Datei beim Ersetzen fehlt, siehe B1 dieses Berichts |
| B2 (2.8 überträgt `409` auf ein Verzeichnis) | erledigt: Verzeichnis unter der Art des Pfades ergibt jetzt `409` (vorher `500`), Abschnitt 2.8 verweist auf 5.2 und nennt keine Antwort mehr |
| H1 (Verzeichnis und Verknüpfung bei anderer Art verschieden behandelt) | erledigt: Verzeichnis, Verknüpfung und Datei einer anderen Art ergeben gleich `409` mit demselben Text |
