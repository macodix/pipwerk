# Testbericht Tester Funktion – Auftrag 03, Durchlauf 6

- Vorhaben `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- Prüfauftrag: `strategiedesign/wp02:development/strategiedesign/wp02/tests/03-6-order.md`
- geprüfter Commit: `b7c86bcf51c192ccc7ad093c5229a0077e51dc12` (Zweig `strategiedesign/wp02-03`, Elterncommit `811370d78275a6a2203fdf57b31a20b25b1c4ec2`; `origin/strategiedesign/wp02-03` zeigt auf diesen Commit)
- Prüfskript: `components/pipwerk-studio/scripts/check` im Stand des geprüften Commits `b7c86bcf51c192ccc7ad093c5229a0077e51dc12`. Es war keine Änderung nötig. Deshalb gibt es keinen Zweig `strategiedesign/wp02-functiontest` und keinen eigenen Commit des Prüfskripts.
- Grundlagen: Auftrag `development/strategiedesign/wp02/orders/03.md`, besonders „Nachtrag nach Durchlauf 5 der Tester“ (Punkte 19 bis 22) und „Technische Abnahmekriterien“; Testbericht `03-functiontest-5.md`; `docs/technical/entwicklungsverfahren.md` („Umfang der Prüfungen“, Zeilen 246–259) und `docs/technical/agentenrollen-und-briefings.md` („Dokumentationspflicht“, Zeilen 70–73), im Stand des geprüften Commits
- Art der Prüfung: Nachprüfung. Geprüft sind B1 und H1 aus Durchlauf 5, die geänderten Stellen (Diff `811370d…b7c86bc`: `object_store.py`, Docstring `_write_file`; `docs/technical/pipwerk-studio.md`, Abschnitte 2.8 und 2.9) und nach Punkt 21 die Aussagen der Abschnitte 2.8, 2.9 und 5.2 zu Speichern, Anlegen und Ersetzen gegen `object_service.py` und `object_store.py`.

## Ergebnis

**bestanden**

B1 und H1 aus Durchlauf 5 sind erledigt. Die geänderten Sätze stimmen mit `object_service.py` und `object_store.py` überein. Es gibt keinen blockierenden Befund. Zwei Hinweise zur Formulierung in Abschnitt 2.9 stehen unten; sie verhindern das Bestehen nicht (`entwicklungsverfahren.md`, Zeile 252). Das Prüfskript endet mit Exitcode 0.

## Nachweise

| Prüfung | Ergebnis | Nachweis |
|---|---|---|
| Ausgecheckter Commit | `b7c86bcf51c192ccc7ad093c5229a0077e51dc12` | `git -C <Arbeitsverzeichnis> rev-parse HEAD` vor und nach der Prüfung |
| Prüfskript `check --backend-port 18571 --frontend-port 18572` (ohne `--with-audit`) | **Exitcode 0**, „check: all checks passed“ | Exitcode aus der Meldung der Laufzeitumgebung über das Ende des Befehls („completed (exit code 0)“). Bibliothek: `uv sync --frozen`, pytest 1013 bestanden, ruff check, ruff format --check, mypy (51 Quelldateien), Abgleich der Schemata mit `contracts/strategies/v1`; Backend: `uv sync --frozen`, pytest 742 bestanden, ruff check, ruff format --check, mypy (50 Quelldateien); Suche nach der Schreibweise des Namens (463 Stellen); Oberfläche: `npm ci`, Typprüfung, Vitest 244 bestanden, Bau; Browsertest 39 bestanden, 6 übersprungen (wie in Durchlauf 5) |
| Nur Dokumentation und Docstring geändert | ja | Diff `811370d…b7c86bc`: 2 Dateien, 7 Zeilen hinzu, 5 entfernt; in `object_store.py` nur der Docstring von `_write_file` (Zeilen 218–221) |
| Abnahmekriterien 4 und 5 (keine festen Pfade, Ports, Rechner- oder Benutzernamen) | erfüllt | Suche im Diff nach Pfaden des Entwicklungsrechners, Rechnernamen, `127.0.0.1` und `localhost`: kein Treffer |
| Abnahmekriterium 6 | erfüllt | Commit auf `strategiedesign/wp02-03`, auf GitHub vorhanden (`origin/strategiedesign/wp02-03` = `b7c86bc…`) |
| Aufräumen | nichts zu entfernen | Ich habe im Arbeitsverzeichnis keine Dateien angelegt; `git status --short` nach dem Prüfskript leer |

### Punkte 19 bis 21: geprüfte Aussagen

Code-Stellen: `components/pipwerk-studio/backend/src/pipwerk_studio/object_service.py` (OS) und `object_store.py` (ST) im geprüften Commit.

| Stelle in `docs/technical/pipwerk-studio.md` | Aussage | Ergebnis |
|---|---|---|
| 2.8, Zeile 233 | `write` legt an oder ersetzt; `PUT` legt damit eine fehlende Datei im aktuellen Verzeichnis an | stimmt: ST Zeilen 414–419; OS Zeilen 390 und 401 |
| 2.8, Zeile 234 | Schreiben über temporäre Datei, `fsync`, `os.replace`, `fsync` des Verzeichnisses; bei Fehler `ObjectWriteError` | stimmt: ST Zeilen 223–241, 422–426 |
| 2.8, Zeile 235 | fehlendes Verzeichnis wird beim Schreiben mit `0o700` angelegt | stimmt: ST Zeile 223 |
| 2.8, Zeile 236 | Schreiben unter dem Namen einer Verknüpfung scheitert, ohne sie oder ihr Ziel zu ändern; `has_entry` mit `os.path.lexists` | stimmt: ST Zeilen 225–226, 466–473 |
| 2.8, Zeile 248 (geändert) | `replace` speichert im aktuellen Verzeichnis, auch ohne vorhandene Datei, solange der Name nicht nach 5.2 belegt ist | stimmt: OS Zeilen 386–401 |
| 2.9, Zeile 259 (geändert) | nicht lesbare Datei: Lesen, Ersetzen, Löschen scheitern mit `ObjectUnreadableError` | stimmt: OS Zeilen 255–260, 388–389, 415 |
| 2.9, Zeile 259 (geändert) | Verknüpfungen bleiben in Liste, Lesen und Löschen unbeachtet; bei `replace` belegen sie den Namen | stimmt: ST Zeilen 155–176, 185–186, 455; OS Zeilen 391–395; siehe Hinweis H2 |
| 2.9, Zeile 260 (geändert) | Prüfung des `format` (`DocumentKindError`), bei `replace` mitgelieferte Vorlage (`BuiltinObjectError`) und Kennung (`DocumentIdentifierError`) | stimmt in der Sache: OS Zeilen 347–348, 379–384; Reihenfolge siehe Hinweis H1 |
| 2.9, Zeile 260 (geändert) | `replace` prüft nicht, dass die Datei vorhanden ist; bereitet zuerst vor, prüft dann unter der Sperre | stimmt: OS Zeilen 385–386 (`_prepare` vor `with self._store.lock`) |
| 2.9, Zeile 260 (geändert) | nicht lesbare Datei der Art des Pfades → `ObjectUnreadableError` | stimmt: OS Zeilen 387–389 |
| 2.9, Zeile 260 (geändert) | sonst Eintrag, der keine lesbare gewöhnliche Datei ist (Verknüpfung, Verzeichnis) → `ObjectNameTakenError` | stimmt: OS Zeilen 390–395; ST Zeile 186 (solche Einträge lesen als `missing`) |
| 2.9, Zeile 260 (geändert) | irgendein Eintrag derselben Kennung mit anderer Art → `ObjectKindConflictError`; dann nichts geschrieben | stimmt: OS Zeilen 396–400, Schreiben erst Zeile 401 |
| 2.9, Zeile 260 (geändert) | fehlende Datei wird angelegt (`created`), fehlendes Verzeichnis ebenfalls, sonst ersetzt | stimmt: OS Zeilen 390, 402; ST Zeile 223 |
| 2.9, Zeile 260 (geändert) | `create`: neue UUID v4; unter der Sperre wird eine UUID verworfen, unter deren Name eine lesbare oder nicht lesbare Datei liegt; höchstens zehn Versuche, sonst `ObjectWriteFailedError` | stimmt: OS Zeilen 70, 349–360 (`read_bytes(…, 0)` liefert für jede gewöhnliche Datei `ok` oder `unreadable`) |
| 2.9, Zeile 260 (geändert) | `create`: anderer Eintrag, der keine gewöhnliche Datei ist → Schreiben scheitert (`ObjectWriteFailedError`) | stimmt: ST Zeilen 186, 225–226; OS Zeilen 336–337 |
| 2.9, Zeile 260 | zu großer Text → `DocumentTooLargeError`, nichts gespeichert | stimmt: OS Zeilen 327–328, vor dem Schreiben |
| 5.2, Zeilen 440, 451–456 | `PUT` `200`/`201`; nicht lesbare Datei `409`; Regel unter der Sperre; Verknüpfungen nie verfolgt; Verzeichnis wird angelegt; Liste, Lesen, Löschen unverändert | stimmt: OS Zeilen 386–402; ST Zeilen 223, 466–473; `web_api.py` Zeilen 689–695 |
| 5.2, Zeile 452 | Prüfungen vor dem Schreiben: mitgelieferte Vorlage `403`, Art, Kennung, Größe, Schema | stimmt: OS Zeilen 379–385 |
| 5.2, Tabelle Zeilen 468–476 | `403`, `409` (drei Fälle), `413` beim Speichern, `500` beim Schreiben | stimmt mit den Ausnahmen in OS überein; unverändert seit Durchlauf 5 |
| Docstring `_write_file`, ST Zeilen 216–222 (geändert) | jeder Eintrag, der keine gewöhnliche Datei ist (Verknüpfung, Verzeichnis), wird nicht ersetzt; `ObjectWriteError`, nichts geschrieben | stimmt: ST Zeilen 225–226, Prüfung vor dem Anlegen der temporären Datei |

## Befunde

Keine blockierenden Befunde.

## Hinweise

### H1 – Abschnitt 2.9 lässt sich so lesen, als werde die Art vor der mitgelieferten Vorlage geprüft

- Fundstelle: `docs/technical/pipwerk-studio.md`, Abschnitt 2.9, Zeile 260: „Der Dienst prüft zuerst, dass das `format` des Dokuments zur Art passt (`DocumentKindError`); bei `replace` außerdem, dass die Kennung nicht die einer mitgelieferten Vorlage ist (`BuiltinObjectError`) und dass `id` die Kennung des Pfads ist (`DocumentIdentifierError`).“
- Sachverhalt: `ObjectService.replace` prüft die mitgelieferte Vorlage vor der Art (`object_service.py`, Zeilen 379–382). Ein `PUT` mit der Kennung einer mitgelieferten Vorlage und einem nicht passenden `format` ergibt deshalb `403`, nicht `422`. Der Satz legt die Reihenfolge zwischen den Prüfungen nicht ausdrücklich fest („zuerst“ grenzt die Prüfungen gegen das spätere Vorbereiten und Schreiben ab), Abschnitt 5.2, Zeile 452, nennt die Reihenfolge des Codes. Deshalb Hinweis.

### H2 – Satz zu nicht beachteten Einträgen schließt Dateien ohne Objektnamen in „belegen den Namen“ ein

- Fundstelle: `docs/technical/pipwerk-studio.md`, Abschnitt 2.9, Zeile 259: „Dateien, die keinen Namen einer Objektdatei tragen, und symbolische Verknüpfungen bleiben in Liste, Lesen und Löschen unbeachtet (Abschnitt 2.8); beim Speichern mit `replace` belegen sie den Namen (Abschnitt 5.2).“
- Sachverhalt: „sie“ bezieht sich grammatisch auf beide Gruppen. Eine Datei ohne Namen einer Objektdatei kann den Namen einer Objektdatei nicht belegen; gemeint sind nach dem Code (`object_service.py`, Zeilen 391–400) Verknüpfungen und andere Einträge unter dem Namen einer Objektdatei. Verzeichnisse unter einem Objektnamen nennt der Satz nicht; Abschnitt 2.8, Zeile 236, und 5.2 beschreiben sie richtig. Keine falsche Aussage zum Verhalten, deshalb Hinweis.

## Stand der Befunde aus Durchlauf 5

| Befund | Stand |
|---|---|
| B1 (Abschnitt 2.9 verlangt für `replace` eine vorhandene Datei) | erledigt: Zeile 260 beschreibt Art, Kennung, mitgelieferte Vorlage, Regel aus Punkt 10 mit Verweis auf 5.2, Anlegen einer fehlenden Datei und die Sperre wie der Code (Tabelle oben) |
| H1 (Docstring `_write_file` nennt nur die Verknüpfung) | erledigt: `object_store.py`, Zeilen 218–221, jeder Eintrag, der keine gewöhnliche Datei ist, Verknüpfung und Verzeichnis als Beispiele |

Die Zahl der blockierenden Befunde ist von 1 auf 0 gesunken.
