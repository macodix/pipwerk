# Testbericht Sicherheit – Auftrag 03, Durchlauf 4

- Bezug: `strategiedesign/wp02`
- Übergabedokument: `strategiedesign/wp02:development/strategiedesign/wp02/tests/03-4-order.md`
- geprüfter Commit: `9c97cc925897ef358dc74668ec68bcf970cf1389` (Zweig `strategiedesign/wp02-03`, Elterncommit `f0345bb3370d9c9cba8fd8ca27e133ce5ddf50ab`)
- Prüfgrundlagen: Auftrag `strategiedesign/wp02:development/strategiedesign/wp02/orders/03.md`, besonders „Nachtrag nach Durchlauf 3 der Tester“ (Punkte 13 bis 16) und Punkt 10; Prüfauftrag, Abschnitt „Tester Sicherheit“; vorheriger Bericht `03-securitytest-3.md` (H4, H5, H6) und B1 aus `03-securitytest-1.md`; `docs/technical/development-test-security-rules.md`; `docs/technical/pipwerk-studio.md` Abschnitt 5.2; BSI-Grundschutz (CON.8, APP.7); OWASP ASVS (Fehlerbehandlung und Protokollierung, Dateibehandlung)
- Durchlauf: vierter, Nachprüfung

## Ergebnis: bestanden

Kein blockierender Befund. Die geänderten festen Texte enthalten keine Pfade und keine Systemdetails. Der Test nach Punkt 13 ist vollständig und besteht. Das Verhalten bei belegten Namen und das Protokoll bei `500` sind unverändert. H5 und H6 aus Durchlauf 3 sind erledigt. H4 aus Durchlauf 3 ist weiter offen (Handlung außerhalb meiner Zuständigkeit). Ein neuer Hinweis H7, nicht blockierend.

## Umfang der Änderung

`git diff --stat f0345bb 9c97cc9` nennt fünf Dateien:

- `components/pipwerk-studio/backend/src/pipwerk_studio/object_service.py` (nur Docstrings)
- `components/pipwerk-studio/backend/src/pipwerk_studio/web_api.py` (nur die Konstanten `OBJECT_KIND_CONFLICT_TEXT` und `OBJECT_NAME_TAKEN_TEXT`, Zeile 106-113)
- `components/pipwerk-studio/backend/tests/test_web_api_objects.py` (erwarteter Text)
- `components/pipwerk-studio/backend/tests/test_web_api_unreadable.py` (Test nach Punkt 13, erwartete Texte)
- `docs/technical/pipwerk-studio.md` (Abschnitt 5.2 und Fehlertabelle)

Abhängigkeiten, Begrenzungen und `openapi.json` sind nicht geändert. Die Texte stehen nicht in `openapi.json` (Suche im Arbeitsverzeichnis, siehe unten). Der Abgleich der erzeugten Beschreibung mit der Datei besteht (`tests/test_contract.py`).

## Prüfung der geänderten festen Texte

- `web_api.py:106-109`: „An entry of another kind has this identifier in the object directory (any entry, for example a file, a symbolic link or a directory). Nothing was written.“
- `web_api.py:110-113`: „The file name of the object in the object directory is taken by an entry that is no readable regular file (for example a symbolic link or a directory). Nothing was written.“

Beide Texte sind fest. Sie enthalten keinen Pfad, keinen Dateinamen, keine Endung `.json`, keine Kennung, keinen Ausnahmetext und keine Angabe über Rechner oder Benutzer. Die Probe prüft die Texte auf Pfad des temporären Verzeichnisses, `.json` und `/`: kein Treffer.

Die Texte nennen den Fall allgemein und Verknüpfung und Verzeichnis nur als Beispiele (Punkt 14). Die alten Texte kommen im Arbeitsverzeichnis nicht mehr vor. Die Suche nach „A symbolic link or a directory lies“ und „An entry of another kind (a file“ ergab keinen Treffer. Die neuen Texte stehen nur in `web_api.py`, in den beiden Testdateien und in `docs/technical/pipwerk-studio.md:453, 454, 471, 472`, jeweils wörtlich gleich.

## Prüfung der Tests nach Punkt 13

`tests/test_web_api_unreadable.py:243-302`:

- `ENTRIES` umfasst jetzt `valid file`, `bad file`, `link`, `dangling link`, `directory` (Zeile 274).
- `other_kind` umfasst `indicator`, `ruleset`, `strategy`, `trend`, also alle Arten außer `rule`, der Art des Pfades (Zeile 279).
- `replacing` ist `False` und `True` (Zeile 280). Beim Ersetzen liegt vorher eine gültige Datei `<id>.rule.json`.
- `valid file` schreibt mit `valid_document_text` ein gültiges Dokument der Art des Dateinamens (Zeile 243-254, 262-263).
- Jeder Fall verlangt `409` mit dem festen Text. Er vergleicht das Abbild des Objektverzeichnisses ohne Verfolgen von Verknüpfungen und den Inhalt des Ziels vorher und nachher (Zeile 299-302).

Eigener Lauf mit `-v`: 40 Fälle ausgewählt, 40 bestanden (2 × 4 × 5).

Eigene Probe, dass die Datei `valid file` wirklich lesbar und gültig ist: Ich habe `valid_document_text(<art>, BAD_ID)` als `<id>.<art>.json` in ein leeres Objektverzeichnis gelegt und mit `GET /api/v1/<art>/<id>` gelesen. Ergebnis: `indicator` 200, `ruleset` 200, `trend` 200, `strategy` 200. Der Test prüft also den Fall „lesbare, gültige Datei einer anderen Art“.

## Verhalten bei belegten Namen unverändert

- Diff: In `object_service.py` ändern sich nur die Docstrings von `ObjectKindConflictError`, `ObjectNameTakenError` und `replace` (Zeile 85-97 und 363-369). In `web_api.py` ändern sich nur die beiden Konstanten. Die Prüfungen in `replace`, `ObjectStore.has_entry` und `_write_file` sind nicht geändert.
- Eigene Probe:

  | Fall | Antwort | Objektverzeichnis |
  |---|---|---|
  | FIFO unter `<id>.rule.json`, `PUT /api/v1/rules/<id>` | `409`, `OBJECT_NAME_TAKEN_TEXT` | unverändert |
  | FIFO unter `<id>.trend.json`, `PUT /api/v1/rules/<id>` | `409`, `OBJECT_KIND_CONFLICT_TEXT` | unverändert |
  | kein fremder Eintrag | `201` | Datei angelegt |

  Die Anfrage bleibt am FIFO nicht hängen. Das entspricht Durchlauf 3.
- Die übrigen Tests zu belegten Namen in `test_web_api_unreadable.py` und `test_web_api_objects.py` bestehen im Gesamtlauf.

## Protokoll bei `500` unverändert

- `web_api.py:460-470` (`_log_failure`) ist im Diff nicht enthalten.
- Eigene Probe: Ersetzen bei einem Objektverzeichnis mit den Rechten 0500. Antwort `500` mit `{"detail": "The object file could not be written or deleted."}`. Ein eigener Handler am Wurzel-Logger nahm ab `DEBUG` auf. Im Protokoll steht genau ein Eintrag zum Fehler: „An object file could not be written or deleted. (PermissionError, errno 13)“. Das Protokoll enthält weder den Pfad des temporären Verzeichnisses noch „Traceback“, „[Errno“ oder „Permission denied“.
- `tests/test_web_api_errors.py` besteht (eigener Lauf zusammen mit `tests/test_contract.py`: 69 bestanden).

## Kontrolle der Hinweise aus Durchlauf 3

### H5: Fester Text und Dokumentation nennen nur Verknüpfung und Verzeichnis – erledigt

Die Texte (`web_api.py:106-113`) und `docs/technical/pipwerk-studio.md:453-454, 471-472` nennen den Fall allgemein. Verknüpfung und Verzeichnis stehen nur noch als Beispiele („zum Beispiel“, „for example“). Das „nämlich“ ist entfernt. Ein FIFO fällt unter die allgemeine Beschreibung.

### H6: Tests decken `trend` unter einer anderen Art nicht ab – erledigt

`trend` ist in `other_kind` enthalten (Zeile 279), siehe Fälle `[*-trend-*]` im Lauf oben. Ein FIFO kommt in den Tests weiter nicht vor. Punkt 13 verlangt das nicht. Die eigene Probe bestätigt das Verhalten.

### H4: Verzeichnis des Prüfskripts nicht entfernt – nicht erledigt

- Fundstelle: Verzeichnis `work/strategiedesign/wp02/securitytest-probe/` im Entwicklungsverzeichnis, mit `probe.py` und `probe3.py` aus früheren Durchläufen. Es besteht weiter (`ls -la`).
- Sachverhalt: In diesem Durchlauf habe ich kein Prüfskript als Datei angelegt. Die Probe lief als Befehl ohne Datei, mit einem eigenen temporären Verzeichnis, das sie am Ende entfernt hat („removed True“).
- Benötigte Handlung (Softwarearchitekt oder Projektleiter): das Verzeichnis `work/strategiedesign/wp02/securitytest-probe/` löschen.

## Neuer Hinweis (nicht blockierend)

### H7: Docstring von `ObjectKindConflictError` zählt die Einträge abschließend auf

- Fundstelle: `components/pipwerk-studio/backend/src/pipwerk_studio/object_service.py:86-89`, „Any entry blocks saving: a file (readable or not), a symbolic link or a directory.“
- Sachverhalt: Der Satz nennt drei Arten von Einträgen ohne „for example“. Nach dem Code (Probe FIFO unter `<id>.trend.json`) blockiert auch jeder andere Eintrag. Der erste Satz „Any entry blocks saving“ stimmt. Die Aufzählung danach liest sich aber als vollständig. Punkt 15 nennt nur die Docstrings von `ObjectNameTakenError` und `replace`; beide beschreiben die Regel allgemein. Deshalb ist das kein Verstoß gegen den Auftrag. Aus Sicht der Sicherheit ist das Verhalten in Ordnung.

## Durchgeführte Prüfungen und Nachweise

1. **Arbeitsverzeichnis.** `test -e …/securitytest/.git`: vorhanden. Danach `git fetch origin` und `git checkout --detach 9c97cc925897ef358dc74668ec68bcf970cf1389`. `git rev-parse HEAD` ergab `9c97cc925897ef358dc74668ec68bcf970cf1389`, vor und nach allen Läufen. `git status --short` war nach allen Läufen leer.
2. **Werkzeuge Backend, selbst ausgeführt:**
   - `uv sync --frozen`: „Audited 33 packages“
   - `uv run --frozen pytest`: 742 bestanden
   - `ruff check`: „All checks passed!“
   - `ruff format --check`: „50 files already formatted“
   - `mypy`: „Success: no issues found in 50 source files“

   Die Bibliothek habe ich nicht ausgeführt, weil der Commit nichts unter `packages/` ändert (`git diff --stat`). Das Prüfskript liegt beim Tester Funktion (Prüfauftrag).
3. **Feste Werte (Abnahmekriterien 4 und 5).** Ich habe die hinzugefügten Zeilen des Diffs durchsucht nach: `/srv`, `/home`, `/tmp`, `password`, `token`, `secret`, `localhost`, `127.0`, Namen der Rechnerumgebung und des Autors. Es gab keinen Treffer.
4. **Feste Texte, Tests nach Punkt 13, Verhalten und Protokoll:** siehe oben.

## Aufräumen

- Die Probe lief ohne Datei. Ihr temporäres Verzeichnis ist entfernt.
- Im Arbeitsverzeichnis sind keine Änderungen geblieben.
- Das Verzeichnis `work/strategiedesign/wp02/securitytest-probe/` aus früheren Durchläufen besteht weiter (H4).
