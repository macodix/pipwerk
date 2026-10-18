# Testbericht Tester Funktion – Auftrag 03, Durchlauf 5

- Vorhaben `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- Prüfauftrag: `strategiedesign/wp02:development/strategiedesign/wp02/tests/03-5-order.md`
- geprüfter Commit: `811370d78275a6a2203fdf57b31a20b25b1c4ec2` (Zweig `strategiedesign/wp02-03`, Elterncommit `9c97cc925897ef358dc74668ec68bcf970cf1389`)
- Prüfskript: `components/pipwerk-studio/scripts/check` im Stand des geprüften Commits `811370d78275a6a2203fdf57b31a20b25b1c4ec2`. Es war keine Änderung nötig. Deshalb gibt es keinen Zweig `strategiedesign/wp02-functiontest` und keinen eigenen Commit des Prüfskripts.
- Grundlagen: Auftrag `development/strategiedesign/wp02/orders/03.md`, besonders Punkt 10 und „Nachtrag nach Durchlauf 4 der Tester“ (Punkte 17 und 18) und „Technische Abnahmekriterien“; Testbericht `03-functiontest-4.md`; `docs/technical/entwicklungsverfahren.md` („Umfang der Prüfungen“, Zeilen 246–252) und `docs/technical/agentenrollen-und-briefings.md` („Dokumentationspflicht“, Zeilen 70–73), im Stand des geprüften Commits
- Art der Prüfung: Nachprüfung. Geprüft sind B1 und H1 aus Durchlauf 4, die geänderten Stellen (Diff `9c97cc9…811370d`: `object_service.py`, `object_store.py`, `web_api.py`, `contracts/api/pipwerk-studio/v1/openapi.json`, `docs/technical/pipwerk-studio.md`, `docs/user/pipwerk-studio.md`) und, wie Punkt 17 und der Prüfauftrag verlangen, alle Stellen, die die Regel aus Punkt 10 beschreiben.

## Ergebnis

**nicht bestanden**

Ein blockierender Befund (B1): `docs/technical/pipwerk-studio.md`, Abschnitt 2.9, Zeile 260, beschreibt für `replace` weiter die Prüfung, „dass die Datei vorhanden und lesbar ist“. Das widerspricht dem Code und der Regel aus Punkt 10 (eine fehlende Datei wird angelegt, `201`). Nach `docs/technical/agentenrollen-und-briefings.md`, Zeile 73, gibt der Tester Funktion bei falscher technischer Dokumentation nicht frei.

B1 und H1 aus Durchlauf 4 sind erledigt. Alle in diesem Commit geänderten Stellen nennen den Fall allgemein und stimmen mit dem Code überein. Das Prüfskript endet mit Exitcode 0.

Die Zahl der blockierenden Befunde ist gegenüber Durchlauf 4 nicht gesunken (1 → 1). Nach `docs/technical/entwicklungsverfahren.md`, Zeile 259, geht die Schleife damit an den Softwarearchitekten.

## Nachweise

| Prüfung | Ergebnis | Nachweis |
|---|---|---|
| Ausgecheckter Commit | `811370d78275a6a2203fdf57b31a20b25b1c4ec2` | `git -C <Arbeitsverzeichnis> rev-parse HEAD` vor und nach der Prüfung; `HEAD^` = `9c97cc925897ef358dc74668ec68bcf970cf1389` |
| Prüfskript `check --backend-port 18471 --frontend-port 18472` (ohne `--with-audit`) | **Exitcode 0**, „check: all checks passed“ | Exitcode aus der Meldung der Laufzeitumgebung über das Ende des Befehls („completed (exit code 0)“). Bibliothek: `uv sync --frozen`, pytest 1013 bestanden, ruff check, ruff format --check, mypy, Abgleich der Schemata mit `contracts/strategies/v1`; Backend: `uv sync --frozen`, pytest 742 bestanden (darunter `tests/test_contract.py`: erzeugte Beschreibung gleich `openapi.json`), ruff check, ruff format --check, mypy (50 Quelldateien); Suche nach der Schreibweise des Namens (463 Stellen); Oberfläche: `npm ci`, Typprüfung, Vitest 244 bestanden, Bau; Browsertest 39 bestanden, 6 übersprungen (wie in Durchlauf 4) |
| Nur Beschreibungen geändert | ja | Diff `9c97cc9…811370d`: in den `*.py`-Dateien ändern sich nur Docstrings (`ObjectKindConflictError`, `has_entry`), ein Kommentar (`replace`, Zeilen 392–394) und zwei Beschreibungstexte in `web_api.py` (Antwort `409`, Zeilen 531–534; `PUT`, Zeilen 675–679). Keine Änderung unter `backend/tests/` und `scripts/`. |
| Punkt 18, `openapi.json` | neu erzeugt, gleich der erzeugten Beschreibung | Alle fünf Beschreibungen von `PUT` und alle Beschreibungen der Antwort `409` tragen den neuen Text aus `web_api.py`; `tests/test_contract.py` bestanden (Prüfskript) |
| Abnahmekriterium 4 | erfüllt | kein fester Pfad, Port oder Rechnername in den geänderten Stellen |
| Aufräumen | nichts zu entfernen | Ich habe keine eigenen Dateien angelegt; `git status --short` nach dem Prüfskript leer |

### Punkt 17: Stellen, die die Regel aus Punkt 10 beschreiben

Gesucht mit `grep` nach „symbolic“, „Verknüpfung“, „regular file“, „gewöhnliche“, „another kind“, „anderen Art“, „belegt“, `NameTaken`, `KindConflict`, `has_entry` und `409` in `components/pipwerk-studio/backend/src/`, `docs/technical/pipwerk-studio.md` und `docs/user/pipwerk-studio.md`.

| Stelle | Stand |
|---|---|
| `object_service.py`, Zeilen 85–90, `ObjectKindConflictError` | allgemein („Any entry blocks saving, whatever it is“), Datei, Verknüpfung, Verzeichnis als Beispiele; gleich dem Code (Zeile 399: `has_entry` für jede andere Art) |
| `object_service.py`, Zeilen 93–98, `ObjectNameTakenError` | allgemein (Eintrag, der keine lesbare gewöhnliche Datei ist), Beispiele |
| `object_service.py`, Zeilen 363–370, Docstring `replace`; Kommentare Zeilen 392–394 und 397–398 | allgemein; gleich dem Code (Zeilen 387–401) |
| `object_store.py`, Zeilen 464–471, `has_entry` | allgemein, Beispiele; gleich dem Code (`os.path.lexists`) |
| `web_api.py`, Zeilen 106–113, feste Texte der beiden Antworten `409` | allgemein, Beispiele (unverändert seit Durchlauf 4) |
| `web_api.py`, Zeilen 531–534, Beschreibung der Antwort `409`, daraus `openapi.json` | allgemein, Beispiele (H1 aus Durchlauf 4 erledigt) |
| `web_api.py`, Zeilen 675–679, Beschreibung von `PUT`, daraus `openapi.json` | allgemein, Beispiele, auch die nicht lesbare Datei; „Links are never followed“ (H1 aus Durchlauf 4 erledigt) |
| `docs/technical/pipwerk-studio.md`, Abschnitt 2.8, Zeile 236 | verweist für `PUT` auf die Regel in 5.2; gleich dem Code |
| `docs/technical/pipwerk-studio.md`, Abschnitt 2.9, Zeile 260 | **falsch, siehe B1** |
| `docs/technical/pipwerk-studio.md`, Abschnitt 5.2, Zeilen 440, 451–456 und Tabelle Zeilen 469–472 | allgemein, Beispiele; Texte gleich den Konstanten in `web_api.py` |
| `docs/technical/pipwerk-studio.md`, Abschnitt 6.1, Zeile 534 (`test_web_api_objects.py`) | „mit einem Eintrag derselben Kennung unter einer anderen Art `409` ohne Schreiben“; die Tests dort (Zeilen 340–382) prüfen eine gültige und eine nicht lesbare Datei einer anderen Art; die Aussage trifft zu |
| `docs/technical/pipwerk-studio.md`, Abschnitt 6.1, Zeile 541 (`test_web_api_unreadable.py`) | nennt alle geprüften Einträge: unter der Art des Pfades nicht lesbare Datei, Verknüpfung mit und ohne Ziel, Verzeichnis (Test Zeilen 306–334), unter jeder anderen Art auch die lesbare, gültige Datei (Test Zeile 274: `ENTRIES`), alle vier anderen Arten (Zeile 279); B1 aus Durchlauf 4 erledigt |
| `docs/technical/pipwerk-studio.md`, Abschnitt 8, Zeilen 710 und 712 | keine abschließende Aufzählung; Verknüpfungen nicht verfolgt, keine fremde Datei überschrieben; trifft zu |
| `docs/user/pipwerk-studio.md`, Zeile 106 | allgemein, Beispiele; gleich dem Code |
| `docs/user/pipwerk-studio.md`, Zeile 47 | nicht lesbare Datei `409`; trifft zu |

## Befunde

### B1 – Abschnitt 2.9 verlangt für `replace` eine vorhandene Datei (blockierend)

- Fundstelle: `docs/technical/pipwerk-studio.md`, Abschnitt 2.9, Zeile 260: „Speichern (`create`, `replace`): Der Dienst prüft zuerst, dass das `format` des Dokuments zur Art passt (`DocumentKindError`); bei `replace` außerdem, dass `id` die Kennung des Pfads ist (`DocumentIdentifierError`) und dass die Datei vorhanden und lesbar ist (unter der Sperre der Ablage, damit kein Löschen dazwischenkommt).“
- Sachverhalt: `ObjectService.replace` prüft nicht, dass die Datei vorhanden ist. Fehlt sie, legt es sie an (`object_service.py`, Zeile 390: `created = loaded.status == "missing"`, Zeile 401: Schreiben; Antwort `201`). Das ist die Zeile „fehlt → anlegen (`201`)“ der Regel aus Punkt 10 und Punkt 2 des Auftrags. Abschnitt 2.9 beschreibt den Stand vor Auftrag 03: Der Satz steht unverändert schon im Ausgangscommit `fba6663d333b24672f9684e1c91ac8c92999e989` (`git show fba6663…:docs/technical/pipwerk-studio.md`, gleiche Zeile 260). Er nennt auch die übrigen Fälle der Regel nicht (Eintrag, der keine lesbare gewöhnliche Datei ist; Eintrag einer anderen Art) und verweist nicht auf 5.2. Abschnitt 5.2, Zeile 453, beschreibt das Verhalten richtig; die beiden Abschnitte widersprechen sich. Punkt 17 verlangt, alle Stellen zu finden, die die Regel beschreiben. Nach `docs/technical/agentenrollen-und-briefings.md`, Zeile 73, gibt der Tester Funktion bei falscher technischer Dokumentation nicht frei.

## Hinweise

### H1 – Docstring von `_write_file` nennt nur die Verknüpfung

- Fundstelle: `components/pipwerk-studio/backend/src/pipwerk_studio/object_store.py`, Zeilen 218–219: „A file other than a regular file under the name (a symbolic link) is not replaced.“
- Sachverhalt: Der Code (Zeile 223: `os.path.lexists(target) and not _is_regular_file(target)`) ersetzt keinen Eintrag, der keine gewöhnliche Datei ist, also auch kein Verzeichnis. Die Klammer liest sich wie eine abschließende Aufzählung. Die Stelle beschreibt den Schutz der Ablage beim Schreiben, nicht die Antwort `409` aus Punkt 10, und ist nicht falsch, nur unvollständig; deshalb Hinweis. Sie ist seit Durchlauf 4 unverändert.

## Stand der Befunde aus Durchlauf 4

| Befund | Stand |
|---|---|
| B1 (Beschreibung der Tests nennt die lesbare Datei einer anderen Art nicht) | erledigt: `docs/technical/pipwerk-studio.md`, Zeile 541 |
| H1 (Beschreibung in `openapi.json` zählt Verknüpfung und Verzeichnis abschließend auf) | erledigt: `web_api.py`, Zeilen 531–534 und 675–679, `openapi.json` neu erzeugt, `tests/test_contract.py` bestanden |
