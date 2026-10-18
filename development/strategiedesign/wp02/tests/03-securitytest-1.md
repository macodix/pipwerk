# Testbericht Sicherheit – Auftrag 03, Durchlauf 1

- Bezug: `strategiedesign/wp02`
- Übergabedokument: `strategiedesign/wp02:development/strategiedesign/wp02/tests/03-1-order.md`
- geprüfter Commit: `cfa7107f0fc4a1fecc7bccce51327aedce3225e3` (Zweig `strategiedesign/wp02-03`, Elterncommit `fba6663d333b24672f9684e1c91ac8c92999e989`)
- Prüfgrundlagen: Auftrag `strategiedesign/wp02:development/strategiedesign/wp02/orders/03.md` (Punkte 1, 2, 4; Abnahmekriterien 1, 4, 5), Prüfauftrag Abschnitt „Tester Sicherheit“, `docs/technical/development-test-security-rules.md` Abschnitte 5, 8 und 9, `docs/technical/pipwerk-studio.md` Abschnitte 2.8, 5.2 und 8, Spezifikation `development/strategiedesign/specification.md` auf `origin/main` Abschnitt 8, BSI-Grundschutz (CON.8, APP.7), OWASP ASVS und OWASP API Security Top 10
- Durchlauf: erster, vollständig

## Ergebnis: nicht bestanden

Ein blockierender Befund (B1). Zwei Hinweise (H1, H2).

Nicht erfüllt ist das Prüfkriterium „keine Ausnahmetexte oder Pfade in Antworten und Protokoll, auch bei `500`“ für das Protokoll. Die Antworten erfüllen es. Alle anderen Prüfpunkte des Prüfauftrags sind erfüllt.

## Befunde

### B1 (blockierend): Protokoll bei `500` von `PUT` enthält Ausnahmetext und Pfad des Objektverzeichnisses

- Fundstelle: `components/pipwerk-studio/backend/src/pipwerk_studio/web_api.py:485` (Funktion `_guarded`, ab Zeile 454): `logger.error("An object file could not be written or deleted.", exc_info=error)`. Gleich gebaut ist Zeile 482 für `ObjectDirectoryUnreadableError`.
- Sachverhalt: Mit `exc_info` schreibt das Protokoll die ganze Kette der Ausnahmen. Dazu gehört das ursprüngliche `OSError` aus `object_store.py`, dessen Text den Pfad nennt. Außerdem stehen die Quelldateien des Backends mit ihrem Pfad im Stapel der Aufrufe.
- Nachweis durch eigene Probe (Backend-Anwendung mit Testclient, Protokoll mit einem eigenen Handler am Wurzel-Logger erfasst, Stapel mit `traceback.format_exception` aufbereitet, Fallverzeichnis unten als `<fall>` ersetzt):
  - `PUT` auf eine fehlende Datei, Objektverzeichnis unterhalb einer Datei (Verzeichnis lässt sich nicht anlegen): Antwort `500` `{"detail":"The object file could not be written or deleted."}` ohne Pfad. Im Protokoll steht `NotADirectoryError: [Errno 20] Not a directory: '<fall>/file/objects'`.
  - `PUT` auf eine fehlende Datei, Objektverzeichnis vorhanden, aber nicht beschreibbar (Rechte 0500): Antwort `500` ohne Pfad. Im Protokoll steht `PermissionError: [Errno 13] Permission denied: '<fall>/home/.local/share/pipwerk/studio/objects/.<zufall>.tmp'`.
  - `PUT` mit symbolischer Verknüpfung unter dem Dateinamen: Antwort `500` ohne Pfad. Im Protokoll steht kein Pfad des Falls, aber der Stapel der Aufrufe mit den Pfaden der Quelldateien.
- Bezug: Prüfauftrag, Abschnitt „Tester Sicherheit“ („Anlegen des Verzeichnisses … keine Ausnahmetexte oder Pfade in Antworten und Protokoll, auch bei `500`“); Regel 8.3 Punkt 4 der Entwicklungs-, Test- und Sicherheitsregeln (Protokoll ohne unnötige schützenswerte Daten); OWASP ASVS, Kapitel Protokollierung (keine unnötigen Systemdetails).
- Einordnung: Der Fall „Verzeichnis lässt sich beim `PUT` nicht anlegen“ ist mit diesem Commit neu, weil `PUT` jetzt das Verzeichnis anlegt (`object_service.py:370` bis `386`, dann `object_store.py:221`). Die Stelle des Protokolls selbst ist nicht geändert: `exc_info` steht schon auf dem Elterncommit (`web_api.py:473` und `476` dort), und dasselbe gilt dort für `POST`, `DELETE` und `PUT` auf eine vorhandene Datei. `docs/technical/pipwerk-studio.md:707`, Maßnahme (5), sagt „Ausnahmen werden im Protokoll vermerkt“ und legt nicht fest, ob Text und Pfad dazugehören. Der Auftrag 03 nennt die Anforderung für `PUT` nicht; er nennt sie nur für das Register (Punkt 1, Hinweis H1).
- Benötigte Entscheidung (Softwarearchitekt): ob das Prüfkriterium für das Protokoll bei `500` in diesem Auftrag gilt, oder ob es außerhalb dieses Auftrags behandelt wird und die Dokumentation das Verhalten dann beschreibt. Kein Test prüft bisher den Inhalt des Protokolls bei `500` (`tests/test_web_api_errors.py:397`, `tests/test_web_api_unreadable.py:161` prüfen nur die Antwort).

### H1 (Hinweis): Eine symbolische Verknüpfung einer anderen Art zählt beim Anlegen nicht als Konflikt

- Fundstelle: `object_service.py`, `replace`, Schleife über `OBJECT_KINDS` mit `self._store.read_bytes(other, object_id, 0).status != "missing"`.
- Sachverhalt: `read_bytes` meldet eine symbolische Verknüpfung als `missing` (`object_store.py:185`). Liegt unter `<uuid>.<andere art>.json` eine Verknüpfung, wird die Datei der angefragten Art trotzdem angelegt. Die Verknüpfung und ihr Ziel bleiben unverändert. Das entspricht der Festlegung „Symbolische Verknüpfungen werden nicht verfolgt … Lesen … behandeln sie als nicht vorhanden“ (`pipwerk-studio.md` Abschnitt 2.8). Ein Sicherheitsrisiko ergibt sich daraus nicht. Die Beschreibung in Abschnitt 5.2 („Datei derselben Kennung mit einer anderen Art (auch eine nicht lesbare)“) nennt diesen Fall nicht ausdrücklich.

### H2 (Hinweis): Antwort `500` bei symbolischer Verknüpfung

- Sachverhalt: `PUT` auf einen Dateinamen, unter dem eine symbolische Verknüpfung liegt, antwortet `500` mit festem Text. Die Verknüpfung und ihr Ziel bleiben unverändert (eigene Probe und `tests/test_web_api_unreadable.py:161-176`). Aus Sicht der Sicherheit ist das in Ordnung: nichts wird überschrieben, die Antwort nennt keinen Pfad. Das Protokoll dazu fällt unter B1. Ob `500` dem Auftrag entspricht, bewertet nach dem Prüfauftrag der Tester Funktion.

## Durchgeführte Prüfungen und Nachweise

1. **Arbeitsverzeichnis.** Das Arbeitsverzeichnis bestand. Nach `git fetch origin` und `git checkout --detach cfa7107f0fc4a1fecc7bccce51327aedce3225e3` ergab `git rev-parse HEAD` `cfa7107f0fc4a1fecc7bccce51327aedce3225e3`. `git log` zeigt `fba6663` als direkten Elterncommit. Nach allen Läufen meldete `git status --short` keine Änderungen.

2. **Werkzeuge (Abnahmekriterium 1), selbst ausgeführt.**
   - `uv sync --frozen` in `packages/domain-core` und `components/pipwerk-studio/backend`: ohne Fehler.
   - `uv run --frozen pytest`: Bibliothek 1013 bestanden, Backend 693 bestanden.
   - `uv run --frozen ruff check`: beide „All checks passed!“. `ruff format --check`: 52 beziehungsweise 50 Dateien formatiert. `uv run --frozen mypy`: beide „Success: no issues found“.

3. **Dateiname bei `PUT` auf eine fehlende Datei.**
   - Der Pfadparameter ist eine UUID (`ObjectId`, sonst `422`). `replace` prüft Art und Kennung erneut (`check_object_kind`, `check_object_id`); die Ablage bildet den Namen nur mit `object_file_name` aus UUID in Kleinschreibung und fester Art (`object_store.py:123-144`). Der Prüfungsschritt für die andere Art verwendet nur die feste Liste `OBJECT_KINDS`.
   - Eigene Probe: `PUT /api/v1/rules/../x` und `..%2F..%2Fx` ergeben `404` (keine Route), `<uuid>.json` und `%2e%2e` ergeben `422`. Eine UUID in Großbuchstaben ergibt `200` und ersetzt die Datei mit dem kanonischen Namen; es entsteht keine zweite Datei. Außerhalb des Objektverzeichnisses entstand keine Datei. Keine Antwort enthielt den Pfad des Falls.

4. **Anlegen des Verzeichnisses und Schreiben.**
   - Eigene Probe: `PUT` auf eine fehlende Datei bei fehlendem Verzeichnis ergibt `201` mit `id`, `document`, `findings`. Das Verzeichnis hat die Rechte 0700, die Datei 0600.
   - Schreiben über eine temporäre Datei im selben Verzeichnis, `fsync`, `os.replace` (`object_store.py:215-239`); der Commit ändert `object_store.py` nicht.
   - Die Entscheidung „anlegen oder ersetzen“ und die Prüfung auf eine andere Art laufen unter der Sperre der Ablage (`object_service.py`, `with self._store.lock`).
   - Eigene Probe: Datei derselben Kennung als `rule` vorhanden, `PUT` als `rulesets` ergibt `409` mit festem Text; im Verzeichnis liegt danach nur die Datei `rule`.

5. **Kein Überschreiben über symbolische Verknüpfungen.** `_write_file` lehnt einen vorhandenen Namen ab, der keine reguläre Datei ist (`object_store.py:223-224`, Prüfung mit `lstat`). `os.replace` ersetzt einen Verzeichniseintrag und folgt keiner Verknüpfung. Eigene Probe und Test `test_web_api_unreadable.py:161`: `500`, Verknüpfung und Ziel unverändert.

6. **Antworten ohne Ausnahmetext und Pfad.** Alle neuen und geänderten Antworten haben feste Texte (`OBJECT_KIND_CONFLICT_TEXT`, `web_api.py`; `_error_responses` 409). Die Proben zu `500` (Verzeichnis nicht anlegbar, nicht beschreibbar, Verknüpfung) lieferten nur `{"detail":"The object file could not be written or deleted."}`. Das Protokoll siehe B1.

7. **Protokoll des Registers.** `registry.py:125-131` protokolliert einen fehlerhaften Einstiegspunkt nur mit Name, Gruppe und Klasse der Ausnahme, ohne Text und ohne `exc_info`. Der neue Fehler „mehr als ein Ausgang mit der Verwaltung“ (`_check_valid`, `registry.py:196-199`) läuft über diesen Weg, auch bei Anmeldung über eine Funktion (`_register_all_or_none` prüft vor dem Anmelden). Test `test_type_fields.py:95-113` prüft genau einen Eintrag, die Klasse `RegistryError`, keinen Text der Ausnahme und `exc_info is None`. Ein fehlerhaftes Objekt in `outputs` führt zu einer Ausnahme, die derselbe Weg abfängt.

8. **Begrenzungen gegen Überlast.** Die Änderungen enthalten keine geänderte Konstante `MAX_…`, keine Änderung der Begrenzung des Body (2 MiB) und keine der Begrenzungen der Bibliothek (Suche im Diff nach `MAX_`, `limit`, `2 MiB`: keine Treffer in Code). Die Konsistenzprüfung führt zwei Erreichbarkeitsläufe über den Graphen aus (`engine.py`, `reachable(candle_triggers, …) - reachable(other_triggers, …)`), linear in Elementen und Verbindungen, die schon begrenzt sind. Die Zahl der Befunde `candle.no_instance` bleibt durch die Schlüssel von `_candle_uses` (Element, Gegenstand) eindeutig; die entfernte Menge `reported` war doppelt. `_with_time_units` im Register ist linear in den Parametern und Eigenschaften.

9. **Keine festen Ports, Pfade, Rechnernamen oder Zugangsdaten (Abnahmekriterien 4, 5).**
   - Suche in den hinzugefügten Zeilen des Diffs nach `127.0.0.1`, `localhost`, `/srv`, `/home`, `/var`, `/tmp`, Rechner- und Benutzernamen, `password`, `token`, `secret`, Ports: einziger Treffer ist `base_url="http://127.0.0.1"` im Test `test_frontend_type_copy.py:42`; das ist die Adresse, die das Backend zulässt, wie in `tests/conftest.py`.
   - `test_frontend_type_copy.py` bestimmt den Pfad der Testkopie aus `REPOSITORY` (`web_api_support.py:13`, aus der Lage der Testdatei); beim Aufruf als Skript schreibt es nur diese eine Datei.
   - Die Testkopie `frontend/src/testing/element-types.json` (56989 Bytes) enthält keinen Pfad, Rechner- oder Benutzernamen (Suche nach `"/…"`, `/srv`, `/home`, `/tmp` und den Namen: keine Treffer).
   - Die geänderte Dokumentation (`pipwerk-studio.md`, `pipwerk-domain.md`, `glossar.md`, `docs/user/pipwerk-studio.md`) enthält in den geänderten Zeilen keine Pfade, Benutzer- oder Rechnernamen des Entwicklungsrechners.

10. **Abhängigkeiten.** Die 21 geänderten Dateien (`git diff --stat fba6663…cfa7107`) enthalten keine `pyproject.toml`, keine `uv.lock`, keine `package.json` und keine `package-lock.json`. `uv sync --frozen` meldete in beiden Paketen keine Änderung („Audited 33 packages“, „Audited 23 packages“).

11. **Weitere Punkte nach OWASP API Security Top 10.**
    - API1/API5 (Zugriff auf Objekte und Funktionen): unverändert ohne Anmeldung, wie in `pipwerk-studio.md` Abschnitt 8 beschrieben. `PUT` kann jetzt Dateien anlegen; das war mit `POST` schon möglich und ist in Abschnitt 8 als Risiko bei `--host` außerhalb der Loopback-Adresse genannt („Dateien der Größe bis 2 MiB je Anfrage ablegen“).
    - API3 (Felder der Antwort): Die neuen Felder `holds_management`, `named`, `strategy_parameters` sind Daten der Typbeschreibung; die Modelle lassen keine zusätzlichen Felder zu (`_Model`).
    - Mitgelieferte Vorlagen bleiben vor dem Schreiben mit `403` geschützt (Prüfung vor dem Laden, unverändert).

## Aufräumen

Die Proben liefen als Befehl ohne eigene Datei. Ihre vier temporären Fallverzeichnisse im temporären Verzeichnis des Systems wurden danach entfernt (Ausgabe „4 entfernt; uebrig: []“). Im Arbeitsverzeichnis sind keine Änderungen geblieben.
