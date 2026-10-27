# Testbericht Funktion, Auftrag 15, Durchlauf 1

- Bezug: `strategiedesign/wp02`, geprüfter Commit: `963a1b725e32d98a237f66968abfe9b8a6d85ea2` (Zweig `strategiedesign/wp02-15`, Ausgangscommit `701698e43963ccc77ec909fcbc59cc86ddcd129a`); ausgecheckt und mit `rev-parse HEAD` kontrolliert.
- Prüfskript: unverändert, kein Commit des Prüfskripts.
- **Ergebnis: bestanden** (keine blockierenden Befunde)

## Ausgeführt (alle auf dem Commit, im eigenen Arbeitsverzeichnis)

| Prüfung | Ergebnis |
|---|---|
| Bibliothek: `uv sync --frozen`, pytest | 1795 bestanden |
| Bibliothek: ruff check, ruff format --check, mypy | ohne Befund (79 Dateien) |
| Bibliothek: Schemas gleich `contracts/strategies/v2` und `v1` | gleich |
| Backend: `uv sync --frozen`, pytest | 1044 bestanden |
| Backend: ruff check, ruff format --check, mypy | ohne Befund (61 Dateien) |
| OpenAPI: mit `pipwerk_studio.contract` erzeugt, Vergleich mit `contracts/api/pipwerk-studio/v1/openapi.json` | gleich (`cmp`) |
| Suche nach der Schreibweise „pipwerk Studio“ (Teil von `check`) | keine falsche Schreibweise |
| Vitest, Browsertest | nicht ausgeführt (siehe Hinweis 1) |

Nicht das ganze Skript `check` lief, sondern seine Schritte für Bibliothek und Backend einzeln.

## Auftragspunkte

1. Kreuzung: `blocks.py` und `expressions_api.py` kennen keinen Baustein „Kreuzung“ mehr. Tests belegen die drei Richtungen, auch in `AND` und `OR` (`test_forms_and_blocks.py`, `test_web_api_expressions.py`). Sie belegen auch, dass `str-01`, `str-03` und die gesicherte „EMA-Trendfolge“ unverändert gelesen, geprüft und zurückgebildet werden und im Satz ausgeschrieben erscheinen. Ein Knoten der Art `crossing` ergibt `422`. Die Funktionsliste enthält keine Kreuzung.
2. Datentypwörter (`datatype_label`, `data_types`) und das Kennzeichen „früherer Wert“ (`previous_value`) sind in Bibliothek und Web-API vorhanden und getestet (`test_datatype_labels.py`, `test_web_api_element_types.py`, `test_forms_and_blocks.py`). Die Vorbelegung „Instrument der Anwendung“ und der Rückweg stehen in `default` und `choices` und in der Dokumentation.
3. Befunde mit Element und Feld samt Beschriftung in beiden Sprachen: `consistency/describe.py`, Tests `test_finding_names.py` und `test_web_api_finding_names.py` bestehen.
4. „Verwaltung“: Suche in `src` von Bibliothek und Backend. Es bleiben nur „Order- und Positionsverwaltung“ (auch innerhalb eines Satzes, deutsch und englisch), Feldnamen (`management_of`, `collapsed_managements`) und englische Bezeichner im Code. Der Test in `test_texts.py` prüft dies.
5. Texte: „Startet die Strategie bei jedem Schluss einer Kerze …“ ersetzt „Wertet … aus“. Ein Test (`test_texts.py`) prüft, dass kein Text „Kreuzung“ als Beispiel nennt und jeder Text in beiden Sprachen vorliegt. Stichprobe ohne Beanstandung.
6. Tests: keine übersprungenen oder deaktivierten Tests außer `skipif` auf fehlendes Git in `test_revision.py` (bestehend, zulässig). Die OpenAPI-Beschreibung ist aktuell.
7. Dokumentation: `pipwerk-studio.md`, `pipwerk-domain.md` und `glossar.md` beschreiben den Stand und nennen die Tests dieses Auftrags. Der Eintrag im Änderungsverzeichnis des Glossars ist vorhanden.

## Befunde (nicht blockierend)

1. Umgebung des Prüfers: In dieser Umgebung fehlt bei Dateien im Arbeitsverzeichnis das Ausführungsrecht (`scripts/check`, `scripts/testenv`, Programme in `.venv/bin` und in `node_modules/.bin`). Deshalb lief das Skript `check` nicht als Ganzes, `vitest` meldete „Permission denied“, und `pytest` und `mypy` fanden `pipwerk_domain` beziehungsweise `pydantic` nicht. Über `python -m pytest` und `python -m mypy` laufen sie fehlerfrei. Es liegt kein Fehler des Commits vor. Vitest und Browsertests blieben deshalb ungeprüft; sie gehören laut Auftrag zu den Aufträgen 16 und 17.
2. `docs/technical/pipwerk-studio.md` Zeilen 138, 140 und 141 sowie `pipwerk-studio-testfaelle.md` beschreiben noch die Art `crossing` und die Wahl „Kreuzung“ der Oberfläche. Das gehört in die Aufträge 16 und 17 (Oberfläche).
3. Der Entwickler hat `frontend/src/testing/element-types.json` an die neuen Antworten angepasst (nur Daten, keine Logik). Das ist nicht falsch. Die Oberfläche verwendet `crossing` weiter, bis Auftrag 16/17 sie ändert.
4. Hinterlassene Datei: `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp02/generated-openapi-functiontest.json` (vom Tester zum Vergleich erzeugt). Das Löschen war hier nicht erlaubt; die Datei kann entfernt werden.
