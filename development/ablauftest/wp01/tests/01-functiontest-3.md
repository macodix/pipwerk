# Testbericht Funktionstest, Auftrag 01, Durchlauf 3

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: Tester Funktion
- Übergabedokument: `ablauftest/wp01:development/ablauftest/wp01/tests/01-functiontest-3-order.md`
- geprüfter Commit: `ed5bab216fc29eea9bc954c5399e3f5aafaf3fe3` (Zweig `ablauftest/wp01-01`)
- vorheriger Bericht: `development/ablauftest/wp01/tests/01-functiontest-2.md` zum Commit `83466cd1bd2daab04d1596beca1ec296fee386c4` (Befund F3)
- Commit des Prüfskripts: `4fc779e38b1f32899dcb6dee7facdafc618275ef` (Zweig `ablauftest/wp01-functiontest`, auf GitHub übertragen; Zusammenführung des geprüften Commits in den Zweig, Prüfskript gegenüber `9e1415f9f6b94b02b063ac7f192b978b9fd2caca` unverändert)
- Datum: 2026-10-14

## Ergebnis

**bestanden**

F3 ist behoben. Die Änderung verursacht keine neuen Probleme. Alle Prüfungen des Prüfskripts bestehen.

## Befunde

Keine.

## Nachprüfung der vorherigen Befunde

| Befund | Ergebnis | Nachweis |
| --- | --- | --- |
| F3 (Test hängt davon ab, ob Port 65535 frei ist) | behoben | siehe unten |

`components/pipwerk-studio/backend/tests/test_testenv.py`, Zeilen 321–342: Der Test legt im Suchpfad vor allen anderen Einträgen ein Platzhalterprogramm `python3` ab, das mit Exitcode 0 endet (Zeilen 328–333). Im Testumgebungsskript wird `python3` vor dem ersten `uv`-Aufruf nur in `port_free` verwendet (`components/pipwerk-studio/scripts/testenv`, Zeilen 121–137, Aufrufe Zeilen 247–250). `probe_health` (Zeile 290) folgt erst nach dem `uv`-Aufruf in Zeile 260, den der Platzhalter `uv` mit Exitcode 1 beendet. Der Platzhalter ersetzt also genau die Prüfung freier Ports. Die Parameter lauten jetzt `--frontend-port 065535 --backend-port 00001`. Damit deckt der Test beide Grenzen, 1 und 65535, mit führenden Nullen ab. Port 1 würde ohne den Platzhalter für einen Benutzer ohne Root-Rechte als belegt gelten; durch den Platzhalter spielt das keine Rolle.

Ausgeführt:

1. Port `127.0.0.1:65535` mit einem lauschenden Socket belegt und in derselben Zeit den Test auf `ed5bab2` ausgeführt: 1 bestanden.
2. Gegenprobe: dieselbe Belegung, Test in der Fassung aus `83466cd` (aus `git show` in eine temporäre Testdatei geschrieben, danach gelöscht): scheitert an `assert len(calls) == 1` mit `0 == 1`. Das ist genau der in F3 beschriebene Fehler. Der Aufbau löst F3 also aus, und die neue Fassung besteht ihn.

## Durchgeführte Prüfungen

### Ausgecheckter Commit und Umfang der Änderung

`git -C <Arbeitsverzeichnis> checkout --detach ed5bab216fc29eea9bc954c5399e3f5aafaf3fe3`, danach `rev-parse HEAD`: `ed5bab216fc29eea9bc954c5399e3f5aafaf3fe3`. Der Commit liegt direkt auf `83466cd1bd2daab04d1596beca1ec296fee386c4` (`git log`). `git diff --stat 83466cd… ed5bab2`: nur `components/pipwerk-studio/backend/tests/test_testenv.py`, 11 Zeilen hinzugefügt, 3 entfernt. Das stimmt mit der Angabe des Entwicklers im Übergabedokument überein.

Danach habe ich den geprüften Commit in den Zweig `ablauftest/wp01-functiontest` zusammengeführt (Commit `4fc779e38b1f32899dcb6dee7facdafc618275ef`, ohne Konflikte) und übertragen. Dieser Commit unterscheidet sich vom geprüften Commit nur in `components/pipwerk-studio/scripts/check` und Abschnitt 6.4 von `docs/technical/pipwerk-studio.md` (`git diff --stat ed5bab2 HEAD`).

### Durchsicht der Änderung

- Der Platzhalter wirkt nur in diesem einen Test: Er ändert `replica.environment` der eigenen Kopie, die je Fall neu angelegt wird (`make_replica`, Zeilen 163–174).
- Der Kommentar in den Zeilen 325–327 nennt Zweck und Grund des Platzhalters.
- `_free_port()` wird weiter in `Replica.start` verwendet (Zeile 144–146) und ist damit nicht verwaist.
- ruff check, ruff format --check und mypy bestehen (siehe Prüfskript).

### Prüfskript

Aufgerufen mit absolutem Pfad unter meinem Arbeitsverzeichnis auf `4fc779e38b1f32899dcb6dee7facdafc618275ef` mit `--backend-port 28100 --frontend-port 28173`: Ausgabe „all checks passed“. Diese Zeile gibt das Skript nur aus, wenn kein Schritt gescheitert ist (`scripts/check`, Zeilen 210–214).

| Prüfung | Ergebnis |
| --- | --- |
| `uv sync --frozen` | bestanden |
| pytest | 145 bestanden, keiner übersprungen, darunter `test_testenv.py` 29 und `test_name.py` 12 |
| ruff check | bestanden |
| ruff format --check | bestanden, 15 Dateien |
| mypy | bestanden, 15 Dateien |
| Suche im Repository nach Abschnitt 4.4 | bestanden, 244 Treffer, alle richtig geschrieben |
| `npm ci` | bestanden |
| typecheck | bestanden |
| Vitest | 110 bestanden in 7 Dateien |
| Build | bestanden |
| Browsertest (Chromium, Firefox, WebKit) | 12 bestanden, 3 übersprungen („shows no tooltip without a Git working tree“, wie vorgesehen in einem Git-Arbeitsbereich) |

`pip-audit` und `npm audit` liefen nach der Entscheidung des Softwarearchitekten nicht mit (nur mit `--with-audit`). `npm ci` meldet eine Schwachstelle der Stufe „high“; das ist der bekannte Befund zu `source-map-js`, der nach dem Übergabedokument zu Durchlauf 2 nicht Gegenstand dieses Pakets ist.

### Dokumentation

Der Commit ändert keine Dokumentation. `docs/technical/pipwerk-studio.md`, Abschnitt 6.1, Zeile 297, beschreibt den Test des Testumgebungsskripts. Die Aussage, `uv`, `npm` und `npx` seien durch Platzhalter ersetzt, bleibt richtig. Den einzelnen Fall zur Annahme von Ports mit führenden Nullen nennt der Abschnitt nicht eigens; das war schon in Durchlauf 2 so und ist dort als abgedeckt bewertet. Die Dokumentation ist damit weder falsch noch veraltet.

## Änderung des Testers am Prüfskript

Keine. Das Prüfskript deckt den geprüften Stand unverändert ab. Der Commit `4fc779e38b1f32899dcb6dee7facdafc618275ef` ist nur die Zusammenführung des geprüften Commits in den Zweig `ablauftest/wp01-functiontest`.

## Hinweise ohne Einfluss auf das Ergebnis

- Der Docstring des Moduls `test_testenv.py` (Zeilen 5–6) nennt als Platzhalter nur `uv`, `npm` und `npx`. Der zusätzliche Platzhalter `python3` in einem einzelnen Test ist an Ort und Stelle kommentiert. Die Aussage des Docstrings bleibt für den gemeinsamen Aufbau richtig.

## Nicht geprüft

- `shellcheck` ist auf dem Prüfrechner nicht installiert. Auftrag 01, Kriterium 1, verlangt die Prüfung nur, „falls vorhanden“.
- Ein vollständiger Start der Testumgebung von Hand: Der Commit ändert nur eine Testdatei; das Testumgebungsskript ist gegenüber dem in Durchlauf 2 geprüften Stand unverändert (`git diff --stat`).

## Geltung

Dieser Bericht gilt nur für den Commit `ed5bab216fc29eea9bc954c5399e3f5aafaf3fe3`.
