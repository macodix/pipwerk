# Testbericht Sicherheit – Auftrag 02, Durchlauf 2 (Nachprüfung)

- Bezug: `strategiedesign/wp01`, Prüfauftrag `development/strategiedesign/wp01/tests/02-2-order.md` (Zweig `strategiedesign/wp01`)
- geprüfter Commit: `cdf326f56ec585015c76385e55d51cb0cb19ffb3` (Zweig `strategiedesign/wp01-02`), im eigenen Arbeitsverzeichnis ausgecheckt und mit `git rev-parse HEAD` bestätigt
- vorher geprüfter Commit: `c663d9d5b7414db24b4678bc1a07b493f114b6cb`, Bericht `development/strategiedesign/wp01/tests/02-securitytest-1.md`
- Prüfgrundlagen: Auftrag `orders/02.md` (Umfang Punkte 1, 3, 4, 5, Abnahmekriterien 5 und 6), `docs/technical/entwicklungsverfahren.md` Abschnitt „Umfang der Prüfungen“, `docs/technical/development-test-security-rules.md`, `docs/technical/pipwerk-studio.md` Abschnitte 2.1, 2.8, 4a, 5, 7, 8, 9, BSI-Grundschutz (CON.8, APP.7, OPS.1.1.6), OWASP ASVS, OWASP API Security Top 10
- Umfang: Nachprüfung. Geprüft wurde, ob die Befunde aus Durchlauf 1 behoben sind und ob die dafür geänderten Stellen neue Fehler enthalten (`app.py`, `migrate.py`, `object_store.py`, `storage.py`, `scripts/testenv`, Abschnitte der technischen Dokumentation).

## Ergebnis: nicht bestanden

S1 aus Durchlauf 1 ist behoben. Die Korrektur von S1 in `storage.py` hat einen neuen blockierenden Befund verursacht (S2): Gleichzeitige Schreibzugriffe im selben Backend-Prozess scheitern jetzt mit HTTP 500, am vorher geprüften Commit nicht. Das betrifft den bestehenden Endpunkt für die Sprache und widerspricht Abnahmekriterium 5.

Zahl der blockierenden Befunde: Durchlauf 1 hatte einen (S1), Durchlauf 2 hat einen (S2, neu an einer korrigierten Stelle). Nach `entwicklungsverfahren.md` Abschnitt „Grenze der Durchläufe“ (Zeilen 258 und 259) ist die Zahl nicht gesunken. Ob der Fall deshalb eine Ebene höher geht, entscheidet der Softwarearchitekt.

## Durchgeführte Prüfungen und Nachweise

| Prüfung | Ergebnis |
| --- | --- |
| Prüfskript `components/pipwerk-studio/scripts/check --with-audit` (Ports 18731 und 18732) | Backend: `uv sync --frozen`, pytest (321 bestanden), `ruff check`, `ruff format --check`, mypy bestanden; Suche nach der Schreibweise des Namens bestanden (397 Nennungen); `pip-audit`: „No known vulnerabilities found“; Oberfläche: `npm ci`, Typprüfung, Vitest (244 bestanden), Bau bestanden; Browsertest 39 bestanden, 6 übersprungen. `npm audit` gescheitert, unverändert H6 aus Durchlauf 1. Exitcode des Skripts 1, nur wegen `npm audit`. |
| Lockdatei | `backend/uv.lock` und `pyproject.toml` sind zwischen beiden Commits unverändert (`git diff --stat`). |
| S1: Migration bricht mit Ausnahme ab (eigene Probe, `op.add_column` in Revision `0002` führt die Änderung aus und löst dann eine Ausnahme aus, eigener Prozess) | Datenbank des bisherigen Schemas mit Sprache `en` und neue Datenbank: Exitcode 1, Meldung „A migration of the pipwerk Studio database schema failed. The changes of this start were rolled back.“ ohne Ausnahmetext. Keine Datei `studio.db-journal` bleibt liegen. Der nächste Start endet mit Exitcode 0, danach Revision `0002`, Spalten `id`, `language`, `object_directory`, Sprache `en` erhalten. |
| S1: Prozess wird während der Migration beendet (eigene Probe, `SIGKILL` unmittelbar nach `op.add_column`) | Beide Ausgangslagen: Ein Rollback-Journal bleibt liegen (SQLite stellt beim nächsten Öffnen den alten Stand her). Der nächste Start endet mit Exitcode 0, Revision `0002`, Sprache `en` erhalten. Am vorher geprüften Commit war die Datenbank in diesem Fall dauerhaft nicht startbar (Durchlauf 1, S1). |
| S1: Tests und Dokumentation | `tests/test_migrations.py` enthält vier neue Tests (Fehler in `0002` für beide Ausgangslagen, Start über die CLI, nicht erreichbare Datenbank); sie bestehen. Abschnitte 2.1 und 8 beschreiben Transaktion, Rücknahme und Meldung so, wie die Probe es zeigt. |
| Verschieben bei ungültigem gespeichertem Wert (Funktion B2) | Code: `StoredObjectDirectoryInvalidError` wird mit HTTP 409 und festem Text beantwortet (`app.py` Zeilen 350–355). Der protokollierte Text der Ausnahme nennt keinen Pfad (`settings_service.py` Zeile 231). |
| Ziel nicht anlegbar (Funktion H3) | `ObjectTargetNotCreatableError` ist eine Unterklasse von `ObjectMoveError` und wird vor dieser abgefangen (`app.py` Zeilen 356–358). Antwort HTTP 500 mit festem Text, ohne Pfad; Ausnahme nur im Protokoll. |
| H1: Austausch durch eine symbolische Verknüpfung nach dem Auflisten (eigene Probe) | Die Datei wird nach dem Auflisten durch eine Verknüpfung auf eine fremde Datei ersetzt: `ObjectMoveError`, nichts verschoben, die andere Datei zurückgeholt, Quelle vollständig, fremde Datei unverändert (Verknüpfungszähler 1). |
| H1: Kopierweg (eigene Probe, `os.link` mit `EXDEV` simuliert, Austausch vor dem Öffnen) | Öffnen scheitert mit `ELOOP` (Fehler 40) wegen `O_NOFOLLOW`, keine Datei und keine temporäre Datei im Ziel. |
| H1: Zurückholen (eigene Probe, verschobene Datei im Ziel durch Verknüpfung ersetzt) | Die Datei erscheint in der Liste der nicht zurückgeholten Dateien. Die Verknüpfung bleibt im Ziel. Die fremde Datei ist nicht verknüpft (Verknüpfungszähler 1). |
| H1: Austausch im Zeitfenster zwischen `lstat`-Prüfung und `os.link` (eigene Probe) | Die Verknüpfung wird nicht verfolgt: Ins Ziel kommt die Verknüpfung selbst, keine harte Verknüpfung auf die fremde Datei (Verknüpfungszähler 1). Das Verschieben scheitert dabei nicht, siehe H8. |
| H4: Testumgebungsskript | `scripts/testenv` Zeile 275 ruft `python -I -c` auf. `tests/test_testenv.py` prüft den Schalter. Abschnitt 4a beschreibt ihn. |
| Gleichzeitiges Schreiben, Ebene des Dienstes (eigene Probe, eine Engine, vier Threads, je 6 Sekunden `set_language` und `get_language`) | am geprüften Commit zwei Läufe: 435 und 458 Fehler `sqlite3.OperationalError: database is locked`; am vorher geprüften Commit: 0 Fehler bei 4501 Durchläufen. Siehe S2. |
| Gleichzeitiges Schreiben über HTTP (eigene Probe, Backend über `pipwerk_studio.cli` mit INI und SQLite, sechs Clients, je 6 Sekunden `PUT /api/studio/settings/language`) | am geprüften Commit zwei Läufe: 335 von 1515 und 347 von 1599 Antworten HTTP 500 „Internal Server Error“, im Protokoll „database is locked“; am vorher geprüften Commit: 2710 Antworten HTTP 200, keine 500. Mit `PUT /api/studio/settings/object-directory` (`"move": false`) gemischt: in einem von zwei Läufen 2 × 500 bei der Sprache und 1 × 500 beim Objektverzeichnis. Nach der Last antworten `/api/health` und `GET` der Sprache wieder mit 200. Siehe S2. |

Für den Vergleich mit dem vorher geprüften Commit habe ich in meinem Arbeitsverzeichnis kurz `c663d9d5b7414db24b4678bc1a07b493f114b6cb` ausgecheckt. Danach habe ich wieder `cdf326f56ec585015c76385e55d51cb0cb19ffb3` ausgecheckt und mit `git rev-parse HEAD` bestätigt. `git status --short` ist leer. Die Prüfprogramme lagen in einem eigenen Verzeichnis außerhalb des Repositorys. Ich habe sie nach der Prüfung entfernt. Am geprüften Commit wurde nichts geändert.

Ein erster Lauf der HTTP-Probe ließ das Backend hängen. Ursache war meine Probe: Die Fehlerausgabe des Backends ging in eine Pipe, die erst am Ende gelesen wurde. Ein Thread-Abzug mit `faulthandler` zeigte den Hauptthread blockiert in `logging` beim Schreiben. Mit Ausgabe in eine Datei trat kein Hänger auf. Die Zahlen oben stammen aus den Läufen mit Ausgabe in eine Datei.

## Befunde aus Durchlauf 1

| Befund | Stand |
| --- | --- |
| S1 (blockierend): Migration auf SQLite nicht atomar | behoben (Nachweise in der Tabelle oben). Die Korrektur verursacht S2. |
| H1: Verschieben folgt einer Verknüpfung, die nach dem Auflisten entsteht | behoben. Für ein verbleibendes Zeitfenster stimmt die Dokumentation nicht ganz, siehe H8. |
| H2: Objektverzeichnis auch in fremd beschreibbaren Verzeichnissen | unverändert, Hinweis bleibt |
| H3: Backend prüft den Kopf `Host` nicht | unverändert, Hinweis bleibt |
| H4: `python -c` lädt Module aus dem aktuellen Verzeichnis | behoben (`-I`) |
| H5: Lockdatei teilweise ungeprüft | Veröffentlichungsdaten und das Ergebnis von `pip-audit` stehen jetzt in Abschnitt 7; die Einträge „nachzuholen“ in Abschnitt 7 und 9 sind entfernt. Die Hashes der sdists und der Wheels anderer Plattformen habe ich nicht gegen PyPI abgeglichen; Hinweis bleibt insoweit. |
| H6: `npm audit` meldet `source-map-js` 1.2.1 | unverändert, dokumentiert, Hinweis bleibt |
| H7: keine Begrenzung der Größe des Request-Body | unverändert, Hinweis bleibt |

## Neue Befunde

### S2 (blockierend): Gleichzeitige Schreibzugriffe scheitern mit HTTP 500

- Fundstelle: `components/pipwerk-studio/backend/src/pipwerk_studio/storage.py`, Zeilen 60–61 und 66–85 (`_make_sqlite_transactions_explicit`, Ereignis `begin` mit `BEGIN`) zusammen mit `settings_service.py`, Zeilen 193–219 (`_update_record`: erst `session.get`, dann Änderung und `commit` in derselben Transaktion). Der Kommentar in `storage.py` Zeilen 54–58 sagt: „a busy timeout makes concurrent write transactions wait for the SQLite file lock instead of failing immediately“. Die technische Dokumentation sagt in Abschnitt 2.1: „Das gilt für alle Verbindungen der Engine.“ Eine Folge für gleichzeitige Zugriffe nennt sie nicht.
- Sachverhalt: Seit diesem Commit beginnt jede Transaktion der Engine mit `BEGIN` (aufgeschoben). Der Lesezugriff zu Beginn von `_update_record` hält danach eine gemeinsame Sperre bis zum Ende der Transaktion. Schreiben zwei Anfragen gleichzeitig, will jede ihre Sperre zum Schreiben erweitern. SQLite meldet dann einer der beiden sofort „database is locked“. Die Wartezeit von 30 Sekunden greift in diesem Fall nicht. Am vorher geprüften Commit begann der Treiber die Transaktion erst beim Schreiben. Der Lesezugriff hielt keine Sperre über die Anweisung hinaus, und konkurrierende Schreibzugriffe warteten.
- Nachweis: siehe Tabelle, Zeilen „Gleichzeitiges Schreiben“. Am geprüften Commit endeten über HTTP rund 22 % der gleichzeitigen `PUT`-Anfragen auf die Sprache mit HTTP 500 (335 von 1515 und 347 von 1599). Am vorher geprüften Commit waren es 0 von 2710. `PUT /api/studio/settings/object-directory` ist ebenso betroffen. Mit `"move": true` folgt dann ein Zurückholen und HTTP 500 „Moving the object files failed …“ (Code-Pfad `settings_service.py` Zeilen 274–280; nicht eigens mit Last geprüft). FastAPI führt die synchronen Endpunkte in mehreren Threads aus, deshalb reichen gleichzeitige Anfragen an einen einzigen Backend-Prozess, zum Beispiel aus zwei Browser-Tabs oder von einem Client, der Anfragen wiederholt.
- Auswirkung: Ein bestehender Endpunkt verhält sich anders als vorher (Abnahmekriterium 5 des Auftrags). Die Verfügbarkeit des Schreibens sinkt bei gleichzeitigen Zugriffen (BSI CON.8 und APP.7, Ziel Verfügbarkeit). Gespeicherte Daten gehen nicht verloren, und die Antwort nennt keine Details. Die Tests bilden gleichzeitiges Schreiben über die Engine mit `BEGIN` nicht ab. Der Kommentar in `storage.py` trifft nicht mehr zu.
- Bezug: Auftrag 02, Abnahmekriterium 5; Entwicklungsverfahren, „Umfang der Prüfungen“ (Befund an einer korrigierten Stelle, beeinträchtigt die Funktion).

## Hinweise

### H8: Dokumentation des Verschiebens bei Austausch durch eine Verknüpfung trifft ein Zeitfenster nicht

- Fundstelle: `docs/technical/pipwerk-studio.md` Abschnitt 2.8, Punkt 5 („… wird nicht verfolgt … und das Verschieben scheitert“); `object_store.py` Zeilen 258–266 (`_link`) und 279–282.
- Sachverhalt: Wird die Datei nach dem Auflisten ersetzt, scheitert das Verschieben wie beschrieben. Wird sie erst zwischen der erneuten Prüfung mit `lstat` (Zeile 279) und `os.link(…, follow_symlinks=False)` (Zeile 264) ersetzt, scheitert nichts. Unter Linux kommt die Verknüpfung selbst ins neue Verzeichnis, und der alte Name wird entfernt. Die Verknüpfung wird nicht verfolgt. Dort wird sie wie jede Verknüpfung unter einem Objektnamen nicht aufgelistet und nicht gelesen. Die Aussage „das Verschieben scheitert“ gilt für dieses Zeitfenster also nicht. Eine Sicherheitslücke entsteht dadurch nicht, deshalb Hinweis.
- Ungeprüft: Unter Windows meldet `os.supports_follow_symlinks` für `os.link` keine Unterstützung. Dann ruft `_link` `os.link` ohne Schalter auf (Zeile 266). Wie sich das dort bei einer Verknüpfung verhält, ist nicht geprüft (keine Windows-Umgebung).

## Nicht geprüft

- Verhalten unter Windows (Rechte, Pfadregeln, `os.link` und Verknüpfungen auf NTFS): keine Windows-Umgebung.
- Hashes der Lockdatei außer den drei in Durchlauf 1 bestätigten Dateien: unverändert nicht gegen PyPI abgeglichen (H5).
- Die Veröffentlichungsdaten in Abschnitt 7 (alembic 2026-09-11, mako 2026-09-22, markupsafe 2026-10-02) habe ich nicht selbst gegen PyPI abgeglichen.
