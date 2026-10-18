# Testbericht Sicherheit – Auftrag 03, Durchlauf 6

- Bezug: `strategiedesign/wp02`
- Übergabedokument: `strategiedesign/wp02:development/strategiedesign/wp02/tests/03-6-order.md`
- geprüfter Commit: `b7c86bcf51c192ccc7ad093c5229a0077e51dc12` (Zweig `strategiedesign/wp02-03`, Elterncommit `811370d78275a6a2203fdf57b31a20b25b1c4ec2`)
- Prüfgrundlagen: Auftrag `strategiedesign/wp02:development/strategiedesign/wp02/orders/03.md`, „Nachtrag nach Durchlauf 5 der Tester“ (Punkte 19 bis 22); Prüfauftrag, Abschnitt „Tester Sicherheit“; vorheriger Bericht `03-securitytest-5.md` (bestanden, H4 offen); `docs/technical/development-test-security-rules.md`; BSI-Grundschutz (CON.8, APP.7); OWASP ASVS (Fehlerbehandlung und Protokollierung)
- Durchlauf: sechster, Nachprüfung

## Ergebnis: bestanden

Kein blockierender Befund. Der Commit ändert nur einen Docstring und drei Sätze der technischen Dokumentation. Die neuen Texte nennen keine Pfade und keine Systemdetails. Verhalten und Protokoll sind unverändert. H4 aus früheren Durchläufen ist weiter offen. Die Handlung liegt außerhalb meiner Zuständigkeit. H4 blockiert nicht.

## Nur Dokumentation und ein Docstring geändert

`git diff --stat 811370d b7c86bc` nennt zwei Dateien:

- `components/pipwerk-studio/backend/src/pipwerk_studio/object_store.py`: 4 Zeilen hinzugefügt, 2 entfernt (`--numstat`). Alle liegen im Docstring von `_write_file` (Zeile 216-222). Die Liste der geänderten Zeilen (`git diff -U0 … -- components`, nur Zeilen mit `+` und `-`) enthält nur diese Docstring-Zeilen. Keine Anweisung, keine Bedingung und kein Aufruf ist geändert.
- `docs/technical/pipwerk-studio.md`: je drei Zeilen in Abschnitt 2.8 (Absatz „Sperren“) und Abschnitt 2.9 (Absatz zu nicht lesbaren Dateien, Absatz „Speichern“).

Tests, Abhängigkeiten (`uv.lock`), Verträge (`contracts/`), Begrenzungen und `packages/` sind nicht im Diff.

## Keine Pfade und keine Systemdetails

Die hinzugefügten Zeilen des Diffs habe ich durchsucht nach: `/srv`, `/home`, `/tmp`, `/var`, `passw`, `token`, `secret`, `localhost`, `127.0`, Namen der Rechnerumgebung und des Autors, `claude`, `anthropic`, URLs, `@`, `errno`, `traceback`. Ergebnis: 0 Treffer.

Die neuen Texte beschreiben die Fälle allgemein („Any entry under the name that is not a regular file“; „ein Eintrag, der keine lesbare gewöhnliche Datei ist“). Verknüpfung und Verzeichnis stehen nur als Beispiele. Genannt werden Klassen- und Fehlernamen des Codes (`ObjectWriteError`, `ObjectNameTakenError`, `ObjectKindConflictError`, `ObjectUnreadableError`, `ObjectWriteFailedError`, `BuiltinObjectError`, `DocumentIdentifierError`). Diese stehen schon in der Dokumentation und im Code. Es sind keine Angaben über das System eines Betreibers.

Die Urheberangaben des Commits sind `macodix` als Autor und Committer (`git log -1 --format`). Die Commit-Nachricht nennt keine Urheberschaft eines Werkzeugs.

## Verhalten und Protokoll unverändert

- Es ist kein Code geändert (siehe oben). `_log_failure`, `ObjectService.replace`, `ObjectService.create` und `ObjectStore.has_entry` kommen im Diff nicht vor.
- Die geänderten Texte habe ich mit dem Code verglichen, soweit sie sicherheitsrelevante Aussagen machen:
  - Docstring `_write_file`: `object_store.py:225-226` wirft `ObjectWriteError`, wenn unter dem Namen ein Eintrag liegt (`os.path.lexists`) und dieser nach `os.lstat` keine gewöhnliche Datei ist (`_is_regular_file`, Zeile 147-152). Eine Verknüpfung wird also nicht verfolgt und nicht ersetzt. Die temporäre Datei wird erst danach angelegt (Zeile 227). Die Aussage „nothing is written“ stimmt: Wird der Fehler geworfen, liegt ein Eintrag im Verzeichnis. Das Verzeichnis besteht also schon, und `mkdir` in Zeile 223 legt nichts an.
  - Abschnitt 2.9, `replace`: `object_service.py:379-401`. Die mitgelieferte Vorlage wird abgewiesen (`BuiltinObjectError`), die Kennung des Dokuments muss die des Pfades sein (`DocumentIdentifierError`). Unter der Sperre der Ablage wird geprüft: nicht lesbare Datei (`ObjectUnreadableError`), anderer Eintrag unter dem Namen (`ObjectNameTakenError`), Eintrag derselben Kennung mit anderer Art (`ObjectKindConflictError`). Erst dann wird geschrieben. Die Beschreibung stimmt damit überein. Die Prüfungen schließen bei Zweifel ab: Es wird nichts geschrieben.
  - Abschnitt 2.9, `create`: `object_service.py:349-360`. Höchstens `_ATTEMPTS` Versuche. Eine UUID wird verworfen, wenn `read_bytes` nicht „missing“ liefert. Eine Verknüpfung liefert „missing“ (`object_store.py:185-186`). Dann scheitert `_write_file` mit `ObjectWriteError`, das zu `ObjectWriteFailedError` wird (`object_service.py:336-337`). Die Beschreibung stimmt damit überein.
  - Abschnitt 2.8, Satz zum Speichern nach Wechsel des Verzeichnisses: verweist auf die Regel in Abschnitt 5.2 und stimmt mit `replace` überein (siehe oben).
- Die Reihenfolge der Prüfungen im Text weicht leicht vom Code ab („zuerst `format`“, im Code wird die mitgelieferte Vorlage vor `format` geprüft, Zeile 379-382). Beide Prüfungen laufen vor jedem Zugriff auf die Ablage. Für die Sicherheit hat die Reihenfolge keine Bedeutung. Ob der Text so genau genug ist, prüft die Tester Funktion (Punkt 21). Ich führe das nicht als Befund.
- Eigene Läufe im Backend des Arbeitsverzeichnisses:
  - `uv sync --frozen`: „Audited 33 packages“
  - `uv run --frozen pytest -q`: 742 bestanden
  - `ruff check`: „All checks passed!“
  - `ruff format --check`: „50 files already formatted“
  - `mypy`: „Success: no issues found in 50 source files“
- Die Bibliothek und das Prüfskript habe ich nicht ausgeführt. Der Commit ändert nichts unter `packages/`. Das Prüfskript führt nach dem Prüfauftrag die Tester Funktion aus.

## Kontrolle der Befunde aus Durchlauf 5

Durchlauf 5 hatte keine neuen Befunde. Offen war H4.

### H4: Verzeichnis der Prüfskripte nicht entfernt – nicht erledigt

- Fundstelle: Verzeichnis `work/strategiedesign/wp02/securitytest-probe/` im Entwicklungsverzeichnis. Darin liegen weiter `probe.py` und `probe3.py` aus früheren Durchläufen (`ls -la`).
- Sachverhalt: In diesem Durchlauf habe ich dort nichts angelegt. Das Verzeichnis liegt außerhalb meines Arbeitsverzeichnisses.
- Benötigte Handlung, zuständig Softwarearchitekt oder Projektleiter: das Verzeichnis `work/strategiedesign/wp02/securitytest-probe/` löschen.

## Neue Befunde

Keine.

## Durchgeführte Schritte

1. Übergabedokument mit `git fetch origin` und `git show origin/strategiedesign/wp02:…/03-6-order.md` gelesen, dazu „Nachtrag nach Durchlauf 5“ im Auftrag 03 und den Bericht `03-securitytest-5.md`.
2. Arbeitsverzeichnis: `test -e …/securitytest/.git`: vorhanden. Danach `git fetch origin` und `git checkout --detach b7c86bcf51c192ccc7ad093c5229a0077e51dc12`. `git rev-parse HEAD` ergab `b7c86bcf51c192ccc7ad093c5229a0077e51dc12`, auch nach allen Läufen. `git status --short` war nach allen Läufen leer.
3. Diff zum Elterncommit vollständig gelesen, Code von `_write_file`, `_is_regular_file`, `create` und `replace` gelesen.
4. Suchen und Werkzeugläufe, siehe oben.

## Aufräumen

Ich habe keine Dateien angelegt, außer diesem Bericht. Im Arbeitsverzeichnis sind keine Änderungen geblieben.
