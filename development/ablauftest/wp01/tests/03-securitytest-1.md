# Testbericht Sicherheitstest, Auftrag 03, Durchlauf 1

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: Tester Sicherheit
- Prüfauftrag: `development/ablauftest/wp01/tests/03-securitytest-1-order.md` auf dem Zweig `ablauftest/wp01`
- geprüfter Commit: `74cc3edd5623b19f6e3778078f95be5a142c1fb9` (Zweig `ablauftest/wp01-03`)
- Vergleichsstand: `27678be771b96402262288695d35bac050d38058`
- Datum: 2026-10-14

## Ergebnis

**bestanden**

Keine Befunde. Die sicherheitsrelevanten Aussagen der geänderten Anwenderdokumentation stimmen mit dem Testumgebungsskript, dem Backend und der technischen Dokumentation überein. Die Änderung enthält keine Zugangsdaten, Rechnernamen, Benutzernamen und keine Pfade des Entwicklungsrechners. Die Hinweise unten haben keinen Einfluss auf das Ergebnis.

## Prüfgrundlagen

- Auftrag `development/ablauftest/wp01/orders/03.md` (Stand Zweig `ablauftest/wp01`)
- `docs/technical/development-test-security-rules.md`, Abschnitte 8.2 und 8.3
- `docs/technical/pipwerk-studio.md`, Abschnitt 4a „Start als Testumgebung“ und Abschnitt zur Sicherheit (Zeilen 263 bis 297 und 490 bis 492)
- Briefing Tester Sicherheit in `docs/technical/agentenrollen-und-briefings.md`
- jeweils Stand des geprüften Commits
- BSI IT-Grundschutz CON.8 und APP.7 (Dokumentation sicherheitsrelevanter Konfiguration), OWASP ASVS (sichere Konfiguration, Dokumentation von Sicherheitseinstellungen)

## Kontrolle des Commits

- Arbeitsverzeichnis bestand; `git fetch origin`, `git checkout --detach 74cc3edd5623b19f6e3778078f95be5a142c1fb9`, danach `git rev-parse HEAD`: `74cc3edd5623b19f6e3778078f95be5a142c1fb9`.
- `git log 27678be..74cc3ed`: genau ein Commit, Autor und Committer `macodix`, Nachricht „ablauftest/wp01: Anwenderdokumentation nach Prüfbericht der QA (B1 bis B3)“, kein Trailer.
- `git diff --stat 27678be 74cc3ed`: genau 1 Datei, `docs/user/pipwerk-studio.md`, 33 Zeilen eingefügt, 18 entfernt. Die Angabe des Entwicklers im Prüfauftrag trifft zu. Kein Code, keine Tests, keine Skripte, keine Konfiguration und keine Abhängigkeiten sind geändert.

## Durchgeführte Prüfungen und Nachweise

| Nr. | Prüfung | Ergebnis |
|---|---|---|
| P1 | Durchsicht des vollständigen Diffs `27678be..74cc3ed` | nur Text der Anwenderdokumentation, siehe Bewertung |
| P2 | Durchsicht aller eingefügten Zeilen (`git diff -U0`) auf Zugangsdaten, Schlüssel, Rechnernamen, Benutzernamen, absolute Pfade, Adressen | keine Treffer. Neu sind nur relative Pfade im Repository (`components/pipwerk-studio/scripts/testenv`, `LICENSE`, `components`). Die einzige Adresse `https://github.com/macodix/pipwerk` (Glossar „Repository“) ist unverändert und öffentlich. |
| P3 | `git grep` im ganzen Commit nach `/srv/`, `/home/`, `/Users/`, `aixlab`, `passw`, `secret`, `token`, `api_key`, privaten Schlüsseln und typischen Tokenmustern | keine Treffer in der Änderung. Außerhalb der Änderung: siehe Hinweis H1. In `backend/tests/test_revision.py` nur die Prüfwerte `/secret/path`; im Lizenztext das Wort „password“. |
| P4 | Abgleich der Aussagen zu `--host` (Anwenderdokumentation Zeile 27) mit `scripts/testenv` und `frontend/vite.config.ts` | übereinstimmend, siehe Bewertung Punkt 1 |
| P5 | Abgleich der Aussagen zum Beenden (Zeilen 29, 130, 148) mit `scripts/testenv` und dem Backend | übereinstimmend, siehe Bewertung Punkt 2 |
| P6 | Abgleich der Aufrufe und der Abbruchfälle (Zeilen 25 bis 32) mit `scripts/testenv` | übereinstimmend, siehe Bewertung Punkt 3 |
| P7 | `git ls-files -s` für `components/pipwerk-studio/scripts/testenv` | Modus `100755`, also ausführbar wie dokumentiert |
| P8 | Backend-Tests mit `uv --directory <Arbeitsverzeichnis>/components/pipwerk-studio/backend run --frozen pytest -q`, darin `tests/test_testenv.py` (Abbruch ohne Git und bei nicht committeten Änderungen vor jeder Wirkung, `status` und `stop` ohne Testumgebung) | 145 Tests bestanden |
| P9 | Ausführung von `scripts/testenv` selbst (`start`, `status`, `stop`) | nicht ausgeführt: Die Ausführung des Skripts war in meiner Laufumgebung nicht erlaubt (Aufruf abgelehnt, mit relativem und mit absolutem Pfad). Die Aussagen sind deshalb am Code des Skripts und durch P8 geprüft, nicht an einer laufenden Testumgebung. Siehe Hinweis H3. |

## Bewertung der Änderung

1. Hinweis zu `--host` (Zeile 27, unverändert, im Zusammenhang geprüft): `testenv` setzt ohne Angabe `host=127.0.0.1` (Zeile 191), startet das Backend immer mit `--host 127.0.0.1` (Zeile 271) und `vite preview` mit `--host "$host"` (Zeile 281). `vite.config.ts` leitet in `preview` alle Anfragen unter `/api` an das Backend weiter. Die Aussage „Ohne `--host` ist pipwerk Studio nur von Ihrem eigenen Rechner aus erreichbar“ ist damit richtig. Die Warnung, dass mit einer anderen Adresse jeder im Netz pipwerk Studio benutzen und Einstellungen ändern kann und dass es keine Anmeldung gibt, deckt sich mit der technischen Dokumentation Zeilen 297 und 490 (schreibender Endpunkt `PUT /api/studio/settings/language`, keine Authentisierung). Die Empfehlung „nur in einem Netz, dem Sie vertrauen“ entspricht der sicheren Voreinstellung nach Regel 8.3 Nr. 2.
2. Beenden (Zeilen 29, 130, 148): `cmd_stop` beendet beide Prozesse und führt `rm -rf "$env_dir"` aus (`testenv` Zeilen 315 und 316). Die Datenbank liegt in `$env_dir` (`url = sqlite:///$env_dir/pipwerk-studio.db`, Zeile 267). Ohne gespeicherten Wert liefert das Backend `DEFAULT_LANGUAGE = "de"` (`backend/src/pipwerk_studio/settings_service.py` Zeilen 26 und 53). Die Aussage, dass `stop` die Datenbank entfernt und nach einem erneuten `start` wieder Deutsch eingestellt ist, ist richtig. Sie stimmt mit der technischen Dokumentation Zeile 290 überein. Die Einschränkung in Abschnitt 5 auf „nur ein Neuladen der Browserseite“ ist auch für den Fall richtig, dass die Prozesse ohne `stop` enden: Ein neuer `start` entfernt dann ebenfalls `.testenv/` (Zeile 245). Aus Sicht der Sicherheit ist das Entfernen der Datenbank und der Protokolle beim Beenden günstig, weil keine Reste der Testumgebung bleiben. Regel 8.2 Nr. 10 (destruktive Operationen) ist nicht berührt: Die Testumgebung enthält nur die Spracheinstellung, und der Verlust ist jetzt dokumentiert.
3. Aufrufe und Abbruchfälle (Zeilen 25 bis 32): Das Skript bestimmt sein Arbeitsverzeichnis aus `$0` (Zeilen 44 bis 50). Die Aussagen „arbeitet immer auf dem Arbeitsverzeichnis, in dem es liegt“ und „aus einem beliebigen Verzeichnis mit vollständigem Pfad“ sind richtig. Der Aufruf mit relativem Pfad aus dem obersten Verzeichnis braucht keine Suche über `PATH`; es wird also kein gleichnamiges fremdes Programm aufgerufen. Der neue Satz „Der Start bricht auch ab, wenn das Skript nicht in einem Git-Arbeitsbereich liegt“ entspricht Zeilen 222 und 223. Diese Prüfung und die Prüfung auf nicht committete Änderungen (Zeilen 224 bis 230) liegen vor jeder Installation, jedem Bau und jedem Start; die Aussage „In diesem Fall wurde nichts installiert, gebaut oder gestartet“ ist richtig und durch `tests/test_testenv.py` abgesichert (P8).
4. Glossar: Die neuen Einträge enthalten keine sicherheitsrelevanten Falschaussagen. „INI-Startkonfiguration“ nennt die Datenbankverbindung; dass diese Zugangsdaten enthalten kann, steht in der technischen Dokumentation Zeile 492 und betrifft die Testumgebung nicht, weil sie eine lokale SQLite-Datei verwendet.

## Kontrolle vorheriger Befunde

Für Auftrag 03 ist dies der erste Durchlauf. Die Hinweise aus Auftrag 02 betreffen Dateien, die dieser Commit nicht ändert.

## Befunde

Keine.

## Hinweise ohne Einfluss auf das Ergebnis

- **H1** (außerhalb der Änderung, bestehende Festlegung, Zuständigkeit Softwarearchitekt bzw. Projektleiter) Das Repository enthält den Pfad des Entwicklungsverzeichnisses auf dem Entwicklungsrechner an zwei Stellen: `.github/workflows/sync-repo.yml` Zeile 26 und `docs/technical/entwicklungsverfahren.md` Zeile 256. Beide Stellen sind nicht Teil dieses Commits. `docs/technical/entwicklungsverfahren.md` Zeile 256 legt ausdrücklich fest, dass Skripte und der Workflow des Runners den Pfad fest nennen. Das steht im Widerspruch zur Regel „Schreibe keine … Pfade des Entwicklungsrechners in das Repository“ in `docs/technical/agentenrollen-und-briefings.md` Zeile 62. Benötigt wird eine Entscheidung, ob diese Festlegung als Ausnahme von der Regel gilt; zuständig ist der Softwarearchitekt, für die Briefings der Projektleiter mit dem Auftraggeber.
- **H2** (unverändert, Text vor dieser Änderung, ohne Sicherheitswirkung) Zeile 27 sagt, mit `--host` gelte „diese Adresse“ für den Browser, und nennt als Beispiel `0.0.0.0`. Das Skript selbst gibt für `0.0.0.0` die Adresse `http://127.0.0.1:<port>/` aus (`url_host`, `testenv` Zeile 159). Ob ein Browser `http://0.0.0.0:<port>/` öffnet, habe ich nicht geprüft. Die Frage gehört zur Funktionsprüfung.
- **H3** (Prüfumfang) Das Testumgebungsskript konnte ich nicht ausführen (P9). Ein Durchlauf `start`, Sprache auf Englisch, `stop`, `start`, Sprache wieder Deutsch, ist deshalb von mir nicht an einer laufenden Testumgebung nachgewiesen, sondern am Code und mit den automatischen Tests. Die Ausführung in der laufenden Testumgebung ist Gegenstand der QA.

## Arbeitsverzeichnis

Die von meinem Testlauf P8 erzeugten ignorierten Dateien (`backend/.venv`, `backend/.pytest_cache`, `backend/src/pipwerk_studio/__pycache__`, `backend/tests/__pycache__`) habe ich danach mit `git clean -fdX -- components/pipwerk-studio` entfernt. Nicht versioniert sind nur meine Berichte `01-securitytest-1.md` bis `01-securitytest-3.md`, `02-securitytest-1.md` bis `02-securitytest-5.md` und dieser Bericht.

## Geltung

Dieser Bericht gilt nur für den Commit `74cc3edd5623b19f6e3778078f95be5a142c1fb9`.
