# Testbericht Sicherheitstest, Auftrag 03, Durchlauf 2

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: Tester Sicherheit
- Prüfauftrag: `development/ablauftest/wp01/tests/03-securitytest-2-order.md` auf dem Zweig `ablauftest/wp01`
- geprüfter Commit: `42d3938843f2cf321230a9a04a412bc01e2f40f3` (Zweig `ablauftest/wp01-03`)
- Vergleichsstand: `74cc3edd5623b19f6e3778078f95be5a142c1fb9` (Durchlauf 1, bestanden)
- Datum: 2026-10-14

## Ergebnis

**bestanden**

Keine Befunde. Das neue Beispiel für einen vollständigen Pfad nennt keinen Pfad, Rechnernamen oder Benutzernamen des Entwicklungsrechners. Die drei neuen Testfälle wirken nur in ihrem eigenen temporären Verzeichnis. Die geänderten Abschnitte der technischen Dokumentation stimmen mit Skript und Tests überein. Die Hinweise unten haben keinen Einfluss auf das Ergebnis.

## Prüfgrundlagen

- Prüfauftrag Durchlauf 2 und die weiter geltenden Vorgaben aus `03-securitytest-1-order.md`
- Auftrag `development/ablauftest/wp01/orders/03.md` (Stand Zweig `ablauftest/wp01`)
- `docs/technical/development-test-security-rules.md`, `docs/technical/pipwerk-studio.md` Abschnitte 4a und 6.1, Briefing Tester Sicherheit in `docs/technical/agentenrollen-und-briefings.md`, jeweils Stand des geprüften Commits
- BSI IT-Grundschutz CON.8 (Softwareentwicklung) und APP.7, OWASP ASVS (sichere Konfiguration, keine sensiblen Angaben im Quelltext)

## Kontrolle des Commits

- Arbeitsverzeichnis bestand. `git fetch origin`, `git checkout --detach 42d3938843f2cf321230a9a04a412bc01e2f40f3`, danach `git rev-parse HEAD`: `42d3938843f2cf321230a9a04a412bc01e2f40f3`.
- `git log 74cc3ed..42d3938`: genau ein Commit. Autor und Committer `macodix`. Nachricht „ablauftest/wp01: Anwenderdokumentation nach Testbericht 03-functiontest-1 (F1 bis F4), Test des Aufrufs mit relativem Pfad“, kein Trailer.
- `git diff --stat 74cc3ed 42d3938`: genau 3 Dateien, `components/pipwerk-studio/backend/tests/test_testenv.py` (+71/−1), `docs/technical/pipwerk-studio.md` (+2/−2), `docs/user/pipwerk-studio.md` (+14/−8). Die Angabe des Entwicklers im Prüfauftrag trifft zu. Skript, Code des Backends und der Oberfläche, Konfiguration und Abhängigkeiten sind nicht geändert.

## Durchgeführte Prüfungen und Nachweise

| Nr. | Prüfung | Ergebnis |
|---|---|---|
| P1 | Durchsicht des vollständigen Diffs `74cc3ed..42d3938` | siehe Bewertung |
| P2 | Suche in allen eingefügten Zeilen (`git diff -U0`, nur Zeilen mit `+`) nach `/srv`, `/home`, `/Users`, `/tmp`, dem Namen des Entwicklungsrechners bzw. Entwicklungsverzeichnisses, Namen des Auftraggebers, `passw`, `secret`, `token`, `api_key`, privaten Schlüsseln, `@` und Adressen mit `http` | ein Treffer: das Beispiel `/home/beispiel/pipwerk` in `docs/user/pipwerk-studio.md` Zeile 171. Bewertung siehe Punkt 1. Keine weiteren Treffer. |
| P3 | `git grep` im ganzen Commit (ohne `development/`) nach `/srv/`, `/home/`, `/Users/` und dem Namen des Entwicklungsverzeichnisses | drei Treffer: `.github/workflows/sync-repo.yml` Zeile 26 und `docs/technical/entwicklungsverfahren.md` Zeile 256 (beide unverändert, Hinweis H1) und das Beispiel aus P2 |
| P4 | Durchsicht von `tests/test_testenv.py` vollständig und von `scripts/testenv` vollständig auf Wirkungen der neuen Fälle außerhalb des temporären Verzeichnisses | keine, siehe Punkt 2 |
| P5 | Lauf nur von `tests/test_testenv.py` mit `--basetemp` auf ein eigenes Verzeichnis unter `components/pipwerk-studio/backend/.pytest-tmp` meines Arbeitsverzeichnisses, um die Rückstände der Fälle sichtbar zu machen; `git status --short --ignored` vor und nach dem Lauf | 32 Tests bestanden. Neu war außer `.venv`, `.pytest_cache` und `tests/__pycache__` nur das gewählte Verzeichnis `.pytest-tmp/`. Kein `.testenv/` in der echten Komponente, kein `frontend/dist/`. In den Verzeichnissen der drei neuen Fälle lagen nur `calls.log` und im ersten Fall die absichtlich angelegte `repository/new-file.txt`; kein `.testenv/`, kein `frontend/dist/`. Das Verzeichnis `.pytest-tmp/` habe ich danach entfernt. |
| P6 | Lauf aller Backend-Tests im üblichen Aufbau: `uv --directory <Arbeitsverzeichnis>/components/pipwerk-studio/backend run --frozen pytest -q`; danach `git status --short --ignored` | 148 Tests bestanden (Durchlauf 1: 145, also genau die drei neuen Fälle mehr). Danach neu nur `.venv`, `.pytest_cache`, `src/pipwerk_studio/__pycache__`, `tests/__pycache__`; kein `.testenv/` in der echten Komponente. |
| P7 | Abgleich der geänderten Abschnitte 4a und 6.1 der technischen Dokumentation mit `scripts/testenv` und den neuen Tests | übereinstimmend, siehe Punkt 3 |
| P8 | Abgleich der geänderten Sätze und Glossareinträge der Anwenderdokumentation mit dem Skript, Schwerpunkt sicherheitsrelevante Aussagen | übereinstimmend, siehe Punkt 4 |
| P9 | Abfrage, ob ein Benutzer `beispiel` oder ein Verzeichnis `/home/beispiel` auf dem Entwicklungsrechner besteht (`getent passwd`, `ls`, Lesen von `/etc/passwd`) | nicht ausgeführt: in meiner Laufumgebung abgelehnt. Siehe Punkt 1 und Hinweis H2. |

## Bewertung der Änderung

1. Beispiel für einen vollständigen Pfad (`docs/user/pipwerk-studio.md` Zeile 171): Das Beispiel lautet `/home/beispiel/pipwerk` und ist im Text ausdrücklich als „erfundenes Beispiel“ gekennzeichnet. Es stimmt nicht mit dem Entwicklungsverzeichnis überein, das mir im Startauftrag genannt ist und das in `docs/technical/entwicklungsverfahren.md` Zeile 256 steht. Es enthält keinen Rechnernamen. „beispiel“ ist ein allgemeines Wort und weder der Name des Autors noch des Auftraggebers. Ob auf dem Entwicklungsrechner zufällig ein Benutzer dieses Namens besteht, konnte ich nicht abfragen (P9). Weitere Pfade, Namen oder Adressen bringt die Änderung nicht ein (P2). Das Glossarbeispiel zum INI-Format (Zeile 177) zeigt nur `[database]` und `url = …` ohne Wert, also keine Zugangsdaten.
2. Neue Testfälle (`tests/test_testenv.py` Zeilen 142 bis 170 und 287 bis 330): `run_relative` ruft `sh components/pipwerk-studio/scripts/testenv …` mit `cwd=self.root` auf. `self.root` liegt unter `tmp_path/caseN` (Zeilen 87 und 193). Das Skript bestimmt alle Verzeichnisse aus `$0` relativ zum aktuellen Verzeichnis (`testenv` Zeilen 44 bis 50), also im Nachbau. Alle Schreibvorgänge des Skripts gehen nach `$env_dir` im Nachbau (Zeilen 254 bis 257, 265, 272, 282) und werden beim Fehlschlag wieder entfernt (Zeile 183). Die Platzhalter für `uv`, `npm` und `npx` liegen in `base/placeholders` und schreiben nur in `base/calls.log` (Zeilen 40, 89, 100 bis 105, 114). `python3` für die Portprüfung bindet nur kurz einen Socket an 127.0.0.1 und gibt ihn frei (Zeilen 121 bis 137). Git ist durch `GIT_CEILING_DIRECTORIES`, `GIT_CONFIG_GLOBAL=/dev/null`, `GIT_CONFIG_NOSYSTEM` und das Entfernen geerbter `GIT_*`-Variablen vom umgebenden Arbeitsbereich und der Konfiguration des Benutzers getrennt (Zeilen 32 bis 39, 106 bis 112; Skript Zeile 23). Der Pfad im Aufruf enthält einen Schrägstrich; die Shell sucht ihn deshalb nicht über `PATH`. Die Läufe P5 und P6 bestätigen: keine Rückstände außerhalb des temporären Verzeichnisses, kein gestarteter Prozess (`started_processes`, Zeile 175, in jedem Fall geprüft).
3. Technische Dokumentation: Abschnitt 4a (Zeile 263) sagt neu, dass das Skript auch mit relativem Pfad aufgerufen werden kann und dann auf dem Arbeitsverzeichnis arbeitet, in dem es liegt, nicht auf dem aktuellen Verzeichnis. Das entspricht `testenv` Zeilen 44 bis 50 und wird durch den Fall in Zeile 302 nachgewiesen (`uv --directory <backend des Nachbaus> sync --frozen`). Der neue Satz zu den drei Fällen in Abschnitt 6.1 (Zeile 343) beschreibt die Fälle in Zeilen 287 bis 330 richtig. Die Aussage „Es enthält keine festen Ports, Pfade oder Rechnernamen“ trifft weiter zu.
4. Anwenderdokumentation: Die Aussagen zum Beenden (Zeilen 30, 130, 148) nennen jetzt den vollständigen Befehl; die Sache ist unverändert und in Durchlauf 1 am Skript geprüft (`cmd_stop`, Zeilen 315 und 316). Der Hinweis zu `--host` (Zeile 28) ist unverändert. Die Glossareinträge „relativer Pfad“ und „vollständiger Pfad“ sind richtig: Ein relativer Pfad gilt vom aktuellen Verzeichnis aus; das Skript arbeitet trotzdem immer auf seinem eigenen Arbeitsverzeichnis (Zeile 25 und `testenv` Zeilen 44 bis 50). Die übrigen geänderten Glossareinträge (Arbeitsverzeichnis, Verzeichnis, Pfad, Skript, ausgecheckt, INI-Startkonfiguration, INI-Format, Fokus) enthalten keine sicherheitsrelevanten Aussagen.

## Kontrolle vorheriger Befunde

Durchlauf 1 (`03-securitytest-1.md`, Commit `74cc3edd5623b19f6e3778078f95be5a142c1fb9`) hatte keine Befunde. Zu den Hinweisen:

- H1 (Pfad des Entwicklungsverzeichnisses in `.github/workflows/sync-repo.yml` Zeile 26 und `docs/technical/entwicklungsverfahren.md` Zeile 256): unverändert vorhanden (P3). Beide Dateien sind nicht Teil dieses Commits. Die Entscheidung steht weiter aus, siehe Hinweis H1 unten.
- H2 aus Durchlauf 1 (Adresse `0.0.0.0` im Browser): Zeile 28 ist unverändert; die Frage gehört weiter zur Funktionsprüfung.
- H3 aus Durchlauf 1 (Skript nicht ausführbar in meiner Laufumgebung): Das Skript wurde in diesem Durchlauf nur über die automatischen Tests ausgeführt (P5, P6), nicht von mir direkt.

## Befunde

Keine.

## Hinweise ohne Einfluss auf das Ergebnis

- **H1** (außerhalb der Änderung, bestehende Festlegung) Das Repository enthält den Pfad des Entwicklungsverzeichnisses auf dem Entwicklungsrechner in `.github/workflows/sync-repo.yml` Zeile 26 und `docs/technical/entwicklungsverfahren.md` Zeile 256. Letztere legt ausdrücklich fest, dass Skripte und der Workflow den Pfad fest nennen. Das widerspricht der Regel „Schreibe keine … Pfade des Entwicklungsrechners in das Repository“ in `docs/technical/agentenrollen-und-briefings.md`. Benötigt wird eine Entscheidung, ob diese Festlegung als Ausnahme gilt. Zuständig ist der Softwarearchitekt, für die Briefings der Projektleiter mit dem Auftraggeber. Unverändert seit Durchlauf 1.
- **H2** (Prüfumfang) Ob auf dem Entwicklungsrechner ein Benutzer `beispiel` oder ein Verzeichnis `/home/beispiel` besteht, konnte ich nicht abfragen (P9). Das Beispiel ist als erfunden gekennzeichnet und weicht vom bekannten Entwicklungsverzeichnis ab; ich bewerte es deshalb ohne Befund. Ein Abgleich mit der Benutzerliste des Rechners bleibt offen. Zuständig wäre eine Rolle mit Lesezugriff auf den Rechner.
- **H3** (Prüfumfang) Wie in Durchlauf 1 habe ich `scripts/testenv` nicht selbst mit laufender Testumgebung ausgeführt. Die Aussagen sind am Code und durch die automatischen Tests geprüft. Die Prüfung in der laufenden Testumgebung ist Gegenstand der QA.

## Arbeitsverzeichnis

Die von meinen Testläufen erzeugten Dateien habe ich entfernt: `components/pipwerk-studio/backend/.pytest-tmp/` mit `rm -rf`, danach `backend/.venv`, `backend/.pytest_cache`, `backend/src/pipwerk_studio/__pycache__` und `backend/tests/__pycache__` mit `git clean -fdX -- components/pipwerk-studio`. Nicht versioniert sind nur meine Berichte `01-securitytest-1.md` bis `01-securitytest-3.md`, `02-securitytest-1.md` bis `02-securitytest-5.md`, `03-securitytest-1.md` und dieser Bericht. Die temporären Verzeichnisse von pytest aus P6 liegen im üblichen temporären Verzeichnis des Systems außerhalb des Repositorys und werden von pytest selbst verwaltet.

## Geltung

Dieser Bericht gilt nur für den Commit `42d3938843f2cf321230a9a04a412bc01e2f40f3`.
