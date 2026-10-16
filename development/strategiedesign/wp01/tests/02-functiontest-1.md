# Testbericht Tester Funktion – Auftrag 02, Durchlauf 1

- Bezug: `strategiedesign/wp01`, Auftrag `development/strategiedesign/wp01/orders/02.md`
- Übergabedokument: `strategiedesign/wp01:development/strategiedesign/wp01/tests/02-1-order.md`
- geprüfter Commit: `c663d9d5b7414db24b4678bc1a07b493f114b6cb` (Zweig `strategiedesign/wp01-02`), vor der Prüfung mit `git rev-parse HEAD` im eigenen Arbeitsverzeichnis bestätigt
- Prüfskript: `components/pipwerk-studio/scripts/check` im geprüften Commit `c663d9d5b7414db24b4678bc1a07b493f114b6cb` (letzte Änderung der Datei in `9e1415f`). Keine Änderung am Prüfskript, kein Zweig `strategiedesign/wp01-functiontest` angelegt: Die Aufnahme von `packages/domain-core` erfolgt laut Übergabedokument bei der Prüfung von Auftrag 01.
- Datum: 2026-10-16

## Ergebnis: nicht bestanden

Zwei blockierende Befunde (B1, B2), beide in der technischen Dokumentation beziehungsweise der Abhängigkeitsprüfung. Funktion, Tests und Code erfüllen den Auftrag im Übrigen.

## Befunde (blockierend)

### B1 Prüfung der neuen Abhängigkeiten nicht durchgeführt und nicht dokumentiert

- Fundstelle: `docs/technical/pipwerk-studio.md` Abschnitt 7 (Absatz „Alembic (mit Mako und MarkupSafe) kam am 2026-10-16 hinzu …“ und Tabelle 7.1, Spalte „Veröffentlicht“ = „nicht ermittelt“ für alembic, mako, markupsafe) und Abschnitt 9 („Die Veröffentlichungsdaten der neuen Abhängigkeiten und die Prüfung mit `pip-audit` sind noch nachzuholen“).
- Sachverhalt: Auftrag 02 Umfang Punkt 1 verlangt für Alembic die „Prüfung auf Lizenz und bekannte Sicherheitslücken“; Regel 5.12 der Entwicklungs-, Test- und Sicherheitsregeln verlangt für neue Abhängigkeiten einen dokumentierten Zweck und eine Prüfung auf Lizenz, Wartungszustand, Sicherheitsrisiko und Kopplungswirkung; Regel 8.2 Nr. 9 die Prüfung vor Einführung. Die Dokumentation des Commits hält fest, dass `pip-audit` und die Ermittlung der Veröffentlichungsdaten nicht durchgeführt wurden. Abnahmekriterium 6 (Dokumentation stimmt mit dem Stand überein) und die Pflicht aus Auftrag Punkt 1 sind damit nicht erfüllt.
- Nachweis aus dieser Prüfung: `check --with-audit` hat `pip-audit` auf die festgeschriebenen Python-Abhängigkeiten einschließlich `alembic==1.20.0`, `mako==1.4.3`, `markupsafe==3.0.4` ausgeführt: „No known vulnerabilities found“ (Schritt „backend: pip-audit“ bestanden). Das Ergebnis und die Veröffentlichungsdaten stehen nicht in der Dokumentation; die Veröffentlichungsdaten habe ich nicht ermittelt (Abruf von PyPI war in meiner Umgebung nicht zugelassen).

### B2 PUT mit „verschieben“ bei ungültigem gespeichertem Objektverzeichnis endet mit undokumentiertem HTTP 500

- Fundstelle: `components/pipwerk-studio/backend/src/pipwerk_studio/settings_service.py` Zeile 271 (`source = self.effective_object_directory()` in `set_object_directory`), `app.py` `write_object_directory` (fängt `StoredObjectDirectoryInvalidError` nicht); Dokumentation `docs/technical/pipwerk-studio.md` Abschnitt 2.8 („Ein gespeicherter Wert, der nicht absolut ist …: Lesen meldet HTTP 503, ein gültiges Schreiben behebt es.“) und Abschnitt 5 (Fehlertabelle des Schreibens).
- Sachverhalt: Ist in `studio_settings.object_directory` ein nicht absoluter Wert gespeichert, löst `PUT /api/studio/settings/object-directory` mit `{"path": "<absoluter Pfad>", "move": true}` eine nicht behandelte `StoredObjectDirectoryInvalidError` aus. Antwort: HTTP 500 mit dem Text `Internal Server Error` (kein JSON), die Einstellung bleibt fehlerhaft. Mit `"move": false` wird der Wert ersetzt (HTTP 200). Die Dokumentation sagt, ein gültiges Schreiben behebe den Zustand, und die Fehlertabelle in Abschnitt 5 nennt diesen Fall nicht. Code und Dokumentation stimmen nicht überein (Abnahmekriterium 6); Auftrag Punkt 5 verlangt Fehler mit HTTP-Status und festem Text in der dokumentierten Form.
- Nachweis (eigene Probe mit `TestClient(app, raise_server_exceptions=False)`, temporäre SQLite-Datei, Wert per SQL auf `relative` gesetzt): `GET` → 503 `{"detail":"The stored pipwerk Studio object directory is invalid."}`; `PUT move=true` → 500 `Internal Server Error`; `PUT move=false` → 200.

## Hinweise (nicht blockierend)

- H1 `uv.lock`, von Hand ergänzt: `uv lock --locked` (uv 0.5.9) meldet „Resolved 34 packages“ ohne Abweichung und ändert nichts; `uv sync --frozen` installiert alembic 1.20.0, mako 1.4.3, markupsafe 3.0.4 mit Prüfung der Hashes für die auf diesem Rechner verwendeten Dateien (Linux, CPython 3.14). Nicht geprüft: die Hashes und Größen der übrigen Dateien (andere Plattformen, sdists) gegen PyPI – der Abruf war in meiner Umgebung nicht zugelassen. Den neuen Einträgen fehlt `upload-time`, den übrigen nicht; die Datei ist damit nicht von einem einzigen uv-Lauf erzeugt. Ob eine neuere uv-Version beim nächsten `uv lock` die Einträge umschreibt, ist ungeprüft.
- H2 `npm audit` (Schritt des Prüfskripts mit `--with-audit`) scheitert mit dem bekannten Befund `source-map-js` 1.2.1 (GHSA-68fv-2mgg-jv7q). Er besteht unverändert seit dem Ausgangsstand und ist in Abschnitt 7 und 9 der technischen Dokumentation genannt; nicht Gegenstand dieses Auftrags. Das Prüfskript endet deshalb mit Exitcode 1.
- H3 Ist das neue Objektverzeichnis eine vorhandene reguläre Datei, antwortet `PUT … move=true` mit HTTP 500 und dem Text „… The files were brought back …“, obwohl nichts verschoben wurde (Ursache: `mkdir` scheitert vor dem Verschieben). Verhalten korrekt (nichts verändert, Einstellung alt), der Text trifft den Fall nur ungenau.
- H4 Beim Verschieben über Kopieren (anderes Dateisystem) bleibt der Zeitpunkt der letzten Änderung nicht erhalten; die Dokumentation sagt das zutreffend nur für das Verknüpfen. Für die Liste mit „letzter Änderung“ (Spezifikation 4.2) ändert sich damit nach einem Verschieben über Dateisystemgrenzen die Anzeige.
- H5 `HTTP 500` nach gescheitertem Verschieben schreibt im Backend-Protokoll die Ausnahme mit Pfaden (`exc_info`). Das betrifft nur das Protokoll, nicht die Antwort; Bewertung liegt beim Tester Sicherheit.

## Durchgeführte Prüfungen

### Prüfskript

Aufruf: `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp01/functiontest/components/pipwerk-studio/scripts/check --backend-port 28741 --frontend-port 28742 --with-audit`, Exitcode 1.

| Schritt | Ergebnis |
|---|---|
| backend: uv sync --frozen | bestanden |
| backend: pytest | bestanden, 310 Tests |
| backend: ruff check | bestanden |
| backend: ruff format --check | bestanden, 27 Dateien |
| backend: mypy | bestanden, 27 Dateien |
| Suche nach der Schreibweise des Namens | bestanden, 391 Treffer |
| backend: pip-audit | bestanden, keine bekannten Sicherheitslücken |
| frontend: npm ci, typecheck, Vitest (244 Tests), build | bestanden |
| frontend: npm audit | nicht bestanden, Altbefund H2 |
| Browsertest Chromium, Firefox, WebKit | bestanden, 39 bestanden, 6 übersprungen (Fälle ohne Git-Arbeitsbereich, wie bisher) |

Abnahmekriterium 1 (fünf Backend-Prüfungen, Oberfläche und Browsertest unverändert) ist erfüllt.

### Tests aus Auftrag Punkt 7

Alle geforderten Fälle sind vorhanden und bestehen: `tests/test_migrations.py` (neue Datenbank, Schema vor Alembic mit gespeicherter Sprache, zweiter Start, neuere und unbekannte Revision, Migrationen im Paket, keine `alembic.ini`), `tests/test_object_directory_setting.py` (Standard je Herkunft für POSIX und Windows, ohne und mit leerer oder relativer Umgebungsvariable), `tests/test_object_store.py` (Datei je Objekt, ungültige UUID und Art in jeder Funktion, temporäre Datei mit `fsync` vor Umbenennen, abgebrochenes Schreiben, Verzeichnis mit `0o700`, fremde Dateien, Verknüpfungen), `tests/test_object_directory_move.py` (Verschieben, Nichtverschieben, Konflikt, Datei nach der Prüfung, Scheitern unterwegs, Scheitern des Zurückholens, Sperren), `tests/test_object_directory_api.py` (beide Endpunkte, zusätzliche Felder, relative Pfade, 409, 500), `tests/test_testenv.py` (Objektverzeichnis unter `.testenv/`). Ein Test für B2 fehlt.

### Eigene Proben (Python der Backend-Umgebung, temporäre Verzeichnisse)

- Datenbank im Schema des Ausgangscommits (`studio_settings` mit `id`, `language`, Sprache `en`): Start mit dem neuen Stand liefert `{"language": "en"}`, Version `0002`, Spalten `id, language, object_directory`; zweiter Start ohne Änderung. Abnahmekriterium 3 erfüllt.
- Datenbank mit Revision `0099`: `DatabaseMigrationError` mit festem Text, Datei bytegleich unverändert.
- PUT-Fälle: relativer, leerer Pfad und Pfad mit Nullzeichen → 422 „must be an absolute path“; `move` als Text oder Zahl, fehlendes Feld, zusätzliches Feld, Pfad als Liste, Pfad mit 4097 Zeichen, kein JSON → 422 mit festem Text; Pfad mit 4096 Zeichen → 200; POST, DELETE → 405.
- Verschieben in ein Unterverzeichnis der Quelle: nur die Objektdatei wird verschoben; temporärer Rest, fremde Datei und Verknüpfung bleiben; neues Verzeichnis `0o700`.
- Verknüpfung ohne Ziel unter gleichem Namen im Ziel → 409, nichts verschoben. Ziel gleich Quelle → 200 ohne Änderung.
- `HOME` nicht gesetzt → `{"path": null, "is_default": true}`.
- Gebautes Wheel (`uv build --wheel`) enthält `pipwerk_studio/migrations/` mit `env.py`, `script.py.mako` und beiden Revisionen.
- Abnahmekriterium 4: `git grep` im Quellcode findet als feste Pfade nur `/etc/pipwerk` und `/var/lib/pipwerk` (Standardorte aus 4.1) und den bisherigen Standardwert `127.0.0.1` von `--host`. Dateinamen entstehen nur in `object_file_name()` aus geprüfter UUID und fester Art.

### Code und Dokumentation

Code gelesen: `object_store.py`, `settings_service.py`, `app.py`, `config.py`, `cli.py`, `storage.py`, `migrate.py`, `migrations/`, Änderung an `scripts/testenv`. Dokumentation geprüft: `docs/technical/pipwerk-studio.md` Abschnitte 1, 2.1, 2.2, 2.8, 4a, 5, 6.1, 7, 8, 9, Glossar; `docs/user/pipwerk-studio.md` (Hinweis H3 aus `reviews/plan-2.md` umgesetzt). Außer B1 und B2 keine Abweichung zwischen Code und Dokumentation gefunden. Die eigenen Entscheidungen des Entwicklers (Feldnamen, Abbruch bei unbekanntem Schema, Zeile mit `de`, 503 bei ungültigem gespeichertem Wert, Verknüpfung im Ziel als Konflikt, Logger in `test_name.py`) widersprechen weder Auftrag noch Spezifikation und sind dokumentiert.

## Nicht geprüft

- Hashes der neuen Lockeinträge für andere Plattformen und Veröffentlichungsdaten der neuen Pakete (kein Netzabruf zugelassen, H1, B1).
- Betrieb unter Windows (nur über die Tests mit übergebenen Umgebungen).
