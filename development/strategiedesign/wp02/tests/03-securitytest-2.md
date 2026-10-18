# Testbericht Sicherheit – Auftrag 03, Durchlauf 2

- Bezug: `strategiedesign/wp02`
- Übergabedokument: `strategiedesign/wp02:development/strategiedesign/wp02/tests/03-2-order.md`
- geprüfter Commit: `13f1b4ac7b7039ef3c404ac02d0e74cd6516d3ab` (Zweig `strategiedesign/wp02-03`, Elterncommit `cfa7107f0fc4a1fecc7bccce51327aedce3225e3`)
- Prüfgrundlagen: Auftrag `strategiedesign/wp02:development/strategiedesign/wp02/orders/03.md`, besonders „Nachtrag nach Durchlauf 1 der Tester“ (Punkte 7 bis 9); Prüfauftrag, Abschnitt „Tester Sicherheit“; vorheriger Bericht `03-securitytest-1.md` (B1, H1, H2); `docs/technical/development-test-security-rules.md`; `docs/technical/pipwerk-studio.md` Abschnitte 2.8, 5.2 und 8; BSI-Grundschutz (CON.8, APP.7); OWASP ASVS (Kapitel Fehlerbehandlung und Protokollierung) und OWASP API Security Top 10
- Durchlauf: zweiter, Nachprüfung (Befunde und Hinweise aus Durchlauf 1, geänderte Stellen)

## Ergebnis: bestanden

Kein blockierender Befund. B1 aus Durchlauf 1 ist erledigt. H1 und H2 aus Durchlauf 1 sind durch Punkt 8 des Nachtrags erledigt. Ein neuer Hinweis (H3) zur Dokumentation. Ein Hinweis zum Aufräumen (H4).

## Kontrolle der Befunde aus Durchlauf 1

### B1 (Durchlauf 1, blockierend): Protokoll bei `500` mit Ausnahmetext und Pfad – erledigt

- Fundstelle jetzt: `components/pipwerk-studio/backend/src/pipwerk_studio/web_api.py:459-469` (`_log_failure`) und `:501-506` (`_guarded`).
- Sachverhalt: Beide Fälle mit Antwort `500` in `_guarded` (`ObjectDirectoryUnreadableError`, `ObjectWriteFailedError`) rufen `_log_failure` auf. Sie schreibt einen festen Text und in Klammern die Klasse der letzten Ausnahme der Kette über `__cause__` und, wenn sie eine ganze Zahl ist, `errno`. Es gibt kein `exc_info` mehr. Eine andere Stelle mit `exc_info` gibt es in `web_api.py` nicht (Suche nach `logger.` und `exc_info`: nur Zeilen 469 und 499). Zeile 499 (`503`, gespeichertes Objektverzeichnis ungültig) protokolliert den Text von `StoredObjectDirectoryInvalidError`. Dieser Text ist fest und nennt keinen Pfad (`settings_service.py:230-232`).
- `_guarded` umschließt alle sieben Endpunkte unter `/api/v1/` mit Zugriff auf die Ablage (`web_api.py:606, 633, 655, 691, 715, 745, 805`). Jedes `OSError` der Ablage wird vorher in eine Ausnahme mit festem Text umgesetzt (`object_store.py:166, 224, 410, 424, 460`; `object_service.py:273, 329, 352, 413`).
- Eigene Probe (Backend-Anwendung mit Testclient, eigener Handler am Wurzel-Logger ab `DEBUG`, für jeden Eintrag Text, `exc_info`, `exc_text` und `stack_info` ausgewertet, je Fall ein eigenes temporäres Verzeichnis, Prozess ohne Rechte des Administrators):

  | Fall | Antwort | Eintrag im Protokoll |
  |---|---|---|
  | `POST`, Objektverzeichnis unterhalb einer Datei | `500`, fester Text | `An object file could not be written or deleted. (NotADirectoryError, errno 20)` |
  | `PUT` auf fehlende Datei, Verzeichnis unterhalb einer Datei | `500`, fester Text | wie oben |
  | `GET` Liste, Verzeichnis unterhalb einer Datei | `500`, fester Text | `The object directory cannot be read. (NotADirectoryError, errno 20)` |
  | `PUT` auf fehlende Datei, Verzeichnis mit Rechten 0500 | `500`, fester Text | `An object file could not be written or deleted. (PermissionError, errno 13)` |
  | `POST`, Verzeichnis 0500 | `500`, fester Text | wie oben |
  | `PUT` auf vorhandene Datei, Verzeichnis 0500 | `500`, fester Text | wie oben |
  | `DELETE` auf vorhandene Datei, Verzeichnis 0500 | `500`, fester Text | wie oben |
  | `GET` Liste, Verzeichnis 0000 | `500`, fester Text | `The object directory cannot be read. (PermissionError, errno 13)` |
  | `PUT`, unter dem Dateinamen liegt ein Verzeichnis | `500`, fester Text | `An object file could not be written or deleted. (ObjectWriteError)` |

  In allen Fällen: genau der erwartete Eintrag mit Stufe `ERROR` geschrieben; im gesamten Protokoll weder der Pfad des Falls noch `[Errno` noch der Text der ursprünglichen Ausnahme (`Not a directory`, `Permission denied`) noch `Traceback` noch ein Pfad einer Quelldatei; `exc_info` bei keinem Eintrag gesetzt. Die Antworten nennen keinen Pfad.
- Test: `tests/test_web_api_errors.py:418-440` prüft `POST` und Liste mit dem Fall „Verzeichnis unterhalb einer Datei“: zwei Einträge (Gegenprobe), fester Anfang, `errno`, kein `exc_info`, kein Pfad, kein Ausnahmetext, kein „Traceback“. Der Test besteht (eigener Lauf, siehe unten).
- Dokumentation: `docs/technical/pipwerk-studio.md:477` (Abschnitt 5.2) und `:708`, Maßnahme (5) (Abschnitt 8), nennen den Inhalt des Protokolls. Das Beispiel in Zeile 477 stimmt mit dem beobachteten Eintrag überein.

### H1 (Durchlauf 1): symbolische Verknüpfung einer anderen Art zählt nicht als Konflikt – erledigt

- Fundstelle: `object_service.py:381-394`, `object_store.py:464-470` (`is_link`).
- Sachverhalt: Wird die Datei angelegt (Lesen ergibt `missing`), prüft `replace` unter der Sperre der Ablage zuerst eine Verknüpfung unter dem eigenen Namen (`ObjectNameTakenError`, `409`) und dann für jede andere Art Verknüpfung oder Datei (`ObjectKindConflictError`, `409`). `is_link` verwendet `os.path.islink` und folgt der Verknüpfung nicht; der Name entsteht über `object_file_name` aus geprüfter UUID und fester Art. Die Sperre ist ein `threading.RLock` (`object_store.py:385`); der erneute Eintritt in `is_link` blockiert nicht.
- Eigene Probe: Verknüpfung unter `<uuid>.rule.json`, `<uuid>.ruleset.json` und `<uuid>.strategy.json`, jeweils mit Ziel Datei außerhalb des Objektverzeichnisses, ohne Ziel und mit Ziel Verzeichnis; dazu `PUT` mit der Kennung in Großbuchstaben. Ergebnis in allen zehn Fällen: `PUT /api/v1/rules/<uuid>` `409` mit dem festen Text (`A symbolic link lies …` bei gleicher Art, `An object of another kind …` bei anderer Art), keine Datei angelegt, Verknüpfung (Ziel nach `readlink`, Zeitpunkt) und Ziel (Inhalt, Zeitpunkt, Rechte) unverändert, kein Eintrag im Protokoll, kein Pfad in der Antwort. Liste, Lesen und Löschen danach unverändert: Liste leer, Lesen `404`, Löschen `404`, Verknüpfung und Ziel weiter unverändert.
- Tests: `tests/test_web_api_unreadable.py:170-188` (gleiche Art mit Ziel), `:191-209` (andere Art mit und ohne Ziel), `:212-222` (gleiche Art ohne Ziel). Sie bestehen.

### H2 (Durchlauf 1): Antwort `500` bei symbolischer Verknüpfung – erledigt

Nach Punkt 8 des Nachtrags antwortet `PUT` jetzt `409` mit festem Text und schreibt nichts (Nachweis unter H1). Der Weg `500` über `_write_file` (`object_store.py:223-224`) bleibt als zweite Sicherung für eine Verknüpfung, die zwischen Prüfung und Schreiben entsteht; `os.replace` ersetzt dann höchstens den Verzeichniseintrag und folgt keiner Verknüpfung.

## Neue Hinweise

### H3 (Hinweis): Satz zum Verzeichnis unter dem Namen einer Objektdatei ist nach der Ergänzung missverständlich

- Fundstelle: `docs/technical/pipwerk-studio.md:236` (Abschnitt 2.8).
- Sachverhalt: Der Satz endet jetzt mit „… beim Speichern (`PUT`, Abschnitt 5.2) gilt der Name einer Verknüpfung … als belegt (HTTP 409 mit festem Text). Dasselbe gilt für ein Verzeichnis mit dem Namen einer Objektdatei.“ Der letzte Satz lässt sich so lesen, dass auch ein Verzeichnis unter dem Namen `409` ergibt. Tatsächlich antwortet `PUT` in diesem Fall `500` (eigene Probe, Tabelle oben, letzte Zeile); ein Verzeichnis unter dem Namen einer anderen Art zählt nicht als Konflikt (`read_bytes` meldet `missing`, `is_link` falsch). Aus Sicht der Sicherheit ist das Verhalten in Ordnung: nichts wird geschrieben, Antwort und Protokoll nennen keinen Pfad. Abweichung nur in der Klarheit der Dokumentation.

### H4 (Hinweis): Verzeichnis des Prüfskripts nicht entfernt

- Fundstelle: Verzeichnis `work/strategiedesign/wp02/securitytest-probe/` im Entwicklungsverzeichnis mit der Datei `probe.py` (eigenes Prüfskript dieses Durchlaufs, außerhalb des Repositorys und außerhalb des Arbeitsverzeichnisses).
- Sachverhalt: Das Entfernen mit `rm` wurde in dieser Umgebung nicht zugelassen. Die temporären Fallverzeichnisse des Skripts hat das Skript selbst entfernt (Ausgabe „removed 21 remaining []“; 20 Fälle und ein Fall aus einem abgebrochenen ersten Lauf). Das Verzeichnis enthält keine Zugangsdaten und keine Daten des Rechners.
- Benötigte Handlung (Softwarearchitekt oder Projektleiter): das Verzeichnis `work/strategiedesign/wp02/securitytest-probe/` löschen.

## Durchgeführte Prüfungen und Nachweise

1. **Arbeitsverzeichnis.** Das Arbeitsverzeichnis bestand. Nach `git fetch origin` und `git checkout --detach 13f1b4ac7b7039ef3c404ac02d0e74cd6516d3ab` ergab `git rev-parse HEAD` `13f1b4ac7b7039ef3c404ac02d0e74cd6516d3ab`. `git log` zeigt `cfa7107` als Elterncommit. Nach allen Läufen meldete `git status --short` keine Änderungen.
2. **Werkzeuge (Abnahmekriterium 1, über Punkt 9), selbst ausgeführt.**
   - Backend: `uv sync --frozen` („Audited 33 packages“), `uv run --frozen pytest` 697 bestanden, `ruff check` „All checks passed!“, `ruff format --check` „50 files already formatted“, `mypy` „Success: no issues found in 50 source files“.
   - Bibliothek: `uv sync --frozen` („Audited 23 packages“), `uv run --frozen pytest` 1013 bestanden. Der Commit ändert nichts unter `packages/`.
3. **Umfang der Änderung.** `git diff --name-only cfa7107…13f1b4a`: `object_service.py`, `object_store.py`, `web_api.py`, zwei Testdateien, `openapi.json`, `docs/technical/pipwerk-studio.md`. Keine Änderung an `pyproject.toml`, `uv.lock`, `package.json`, `package-lock.json`; Abhängigkeiten unverändert. Keine Änderung an Begrenzungen (`MAX_…`, Body 2 MiB). `openapi.json` ändert nur die Beschreibungstexte zu `409` und `PUT`.
4. **B1** und **Punkt 8**: siehe „Kontrolle der Befunde aus Durchlauf 1“.
5. **Neue Ausnahme und Antwort.** `ObjectNameTakenError` wird in `_guarded` vor allen Fällen mit Protokoll auf `409` mit festem Text `OBJECT_NAME_TAKEN_TEXT` abgebildet (`web_api.py:109-112, 482-483`; Klasse `object_service.py:89-90`); kein Eintrag im Protokoll, kein Pfad.
6. **Feste Werte (Abnahmekriterien 4, 5).** Suche im Diff (`git diff -G` nach `srv`, `home`, `tmp`, `127.0`, `localhost`, `password`, `token`, `secret` und dem Namen der Rechnerumgebung): Treffer nur `tmp_path` in Tests und unveränderter Text zu `127.0.0.1` und `localhost` in der Dokumentation (Kontext der geänderten Zeile in Abschnitt 8). Keine Pfade, Rechner- oder Benutzernamen des Entwicklungsrechners, keine Zugangsdaten, keine Ports im Code.

## Aufräumen

Die temporären Fallverzeichnisse des Prüfskripts im temporären Verzeichnis des Systems sind entfernt (Ausgabe des Skripts). Im Arbeitsverzeichnis sind keine Änderungen geblieben. Das Verzeichnis des Prüfskripts ist nicht entfernt (H4).
