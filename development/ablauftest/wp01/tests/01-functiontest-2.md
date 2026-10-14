# Testbericht Funktionstest, Auftrag 01, Durchlauf 2

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: Tester Funktion
- Übergabedokument: `ablauftest/wp01:development/ablauftest/wp01/tests/01-functiontest-2-order.md`
- geprüfter Commit: `83466cd1bd2daab04d1596beca1ec296fee386c4` (Zweig `ablauftest/wp01-01`)
- vorheriger Bericht: `development/ablauftest/wp01/tests/01-functiontest-1.md` zum Commit `d6b354201feb1a8385819ad37946d98150edd1f6`
- Commit des Prüfskripts: `9e1415f9f6b94b02b063ac7f192b978b9fd2caca` (Zweig `ablauftest/wp01-functiontest`, auf GitHub übertragen; enthält den geprüften Commit durch Zusammenführung)
- Datum: 2026-10-14

## Ergebnis

**nicht bestanden**

F1 und F2 aus Durchlauf 1 sind behoben. Die Dokumentation zu S2 ist richtig und mit dem Verhalten des Skripts stimmig. Alle Prüfungen des Prüfskripts bestehen. Ein neuer Befund F3: Ein neu hinzugekommener Test hängt davon ab, dass der feste Port 65535 auf dem Prüfrechner frei ist.

## Befunde

### F3 – Neuer Test hängt davon ab, ob der feste Port 65535 frei ist

- Fundstelle: `components/pipwerk-studio/backend/tests/test_testenv.py`, Zeilen 321–335 (`test_ports_with_leading_zeros_and_the_limits_are_accepted`)
- Sachverhalt: Der Test ruft `testenv start --frontend-port 065535 --backend-port 00<freier Port>` auf. Er verlangt, dass genau ein Platzhalteraufruf `uv …` stattfindet (Zeilen 332–334). Das Skript prüft vor diesem Aufruf, ob der Port der Oberfläche frei ist (`components/pipwerk-studio/scripts/testenv`, Zeilen 249–250, vor Zeile 260). Lauscht auf dem Prüfrechner ein Prozess auf `127.0.0.1:65535`, bricht das Skript dort mit „frontend port 65535 is in use or not available on 127.0.0.1“ ab. Dann gibt es keinen Platzhalteraufruf, und der Test scheitert, obwohl die geprüfte Portprüfung richtig arbeitet. Das Ergebnis des Tests hängt damit vom Zustand des Rechners ab. Für den Port des Backends verwendet derselbe Test `_free_port()` (Zeile 325), für den Port der Oberfläche nicht.
- Nachweis: Ablauf aus dem Quelltext der beiden genannten Stellen. Auf diesem Prüfrechner war Port 65535 frei; der Test bestand (siehe Prüfskript). Den Fall mit belegtem Port 65535 konnte ich in dieser Sitzung nicht ausführen, weil das Belegen eines Ports und `ss` nicht freigegeben waren.
- Bezug: `docs/technical/development-test-security-rules.md`, Abschnitt 9, Zeile pytest („isolierte, reproduzierbare Fixtures“).

## Nachprüfung der vorherigen Befunde

| Befund | Ergebnis | Nachweis |
| --- | --- | --- |
| F1 (zu große Portnummer) | behoben | `testenv start --frontend-port 99999999999999999999 --backend-port 28200`: Exitcode 1, nur „testenv: --frontend-port must be a number between 1 and 65535“, keine Meldung der Shell, kein Traceback. Ebenso `--backend-port 18446744073709551617`, `--frontend-port 100000`, `065536`, `000`, `+5`: je Exitcode 1 mit der Meldung zum Parameter. |
| F2 (gleiche Ports in anderer Schreibweise) | behoben | `--frontend-port 028300 --backend-port 28300` und `--frontend-port 28300 --backend-port 0028300`: je Exitcode 1, „--frontend-port and --backend-port must differ“, vor der Prüfung des Git-Zustands. |
| S1 (Sicherheitstest, gleiche Ursache wie F1) | aus Sicht der Funktionsprüfung behoben | wie F1; neuer Test `test_port_boundaries_are_checked_before_anything_happens` mit 11 Fällen, darunter 99999999999999999999, 9223372036854775808, Ziffernfolge mit 28 Stellen, 0, 0000, 65536, −1 und drei Fälle gleicher Ports mit führenden Nullen. Er prüft Exitcode, Meldung, keine Meldung „Illegal number“, kein Traceback und dass nichts geschehen ist. Abnahme für S1 liegt beim Tester Sicherheit. |
| S2 (Risiko bei `--host`) | aus Sicht der Funktionsprüfung behoben | siehe Abschnitt „Dokumentation“. Abnahme für S2 liegt beim Tester Sicherheit. |

Die neuen Tests weisen die Fehler vor der Korrektur nach (Regeln Abschnitt 7, „Für jede Fehlerbehebung wird ein Test ergänzt …“): Auf dem Stand `d6b3542` hätte der Fall `99999999999999999999` die Meldung „Illegal number“ erzeugt und der Fall `028300`/`28300` keine Meldung „must differ“ (beides belegt in Durchlauf 1).

## Durchgeführte Prüfungen

### Ausgecheckter Commit

`git -C <Arbeitsverzeichnis> checkout --detach 83466cd1bd2daab04d1596beca1ec296fee386c4`, danach `rev-parse HEAD`: `83466cd1bd2daab04d1596beca1ec296fee386c4`. Der Commit liegt direkt auf `d6b354201feb1a8385819ad37946d98150edd1f6`. Geändert sind gegenüber diesem vier Dateien: `scripts/testenv`, `backend/tests/test_testenv.py`, `docs/technical/pipwerk-studio.md`, `docs/user/pipwerk-studio.md` (`git diff --stat`).

Danach habe ich den geprüften Commit in den Zweig `ablauftest/wp01-functiontest` zusammengeführt (Commit `0aeeade2223d287ee53dcdb1db11e9376dc924f9`). Dieser Commit unterscheidet sich vom geprüften Commit nur in `components/pipwerk-studio/scripts/check` und Abschnitt 6.4 von `docs/technical/pipwerk-studio.md` (`git diff --stat 83466cd… HEAD`).

### Prüfskript

Aufgerufen mit absolutem Pfad unter meinem Arbeitsverzeichnis, zweimal:

1. auf `0aeeade2223d287ee53dcdb1db11e9376dc924f9` mit `--backend-port 28100 --frontend-port 28173`: Exitcode 0, „all checks passed“
2. auf `9e1415f9f6b94b02b063ac7f192b978b9fd2caca` (nach meiner Korrektur des Prüfskripts, siehe unten) mit `--backend-port 028100 --frontend-port 028173`: Exitcode 0, „all checks passed“. Uvicorn meldet „running on http://127.0.0.1:28100“; die führenden Nullen werden also entfernt weitergegeben.

| Prüfung | Ergebnis (beide Läufe gleich) |
| --- | --- |
| `uv sync --frozen` | bestanden |
| pytest | 145 bestanden, keiner übersprungen, darunter `test_testenv.py` 29 (vorher 17) und `test_name.py` 12 |
| ruff check | bestanden |
| ruff format --check | bestanden, 15 Dateien |
| mypy | bestanden, 15 Dateien |
| Suche im Repository nach Abschnitt 4.4 | bestanden, 244 Treffer, alle „pipwerk Studio“ oder `pipwerk-studio` |
| `npm ci` | bestanden |
| typecheck | bestanden |
| Vitest | 110 bestanden in 7 Dateien |
| Build | bestanden |
| Browsertest (Chromium, Firefox, WebKit) | 12 bestanden, 3 übersprungen („shows no tooltip without a Git working tree“, wie vorgesehen in einem Git-Arbeitsbereich) |

`pip-audit` und `npm audit` liefen nach der Entscheidung des Softwarearchitekten nicht mit (nur mit `--with-audit`). Der bekannte Befund zu `source-map-js` ist nicht Gegenstand dieses Pakets.

### Testumgebungsskript von Hand

| Aufruf `testenv start …` | Ergebnis |
| --- | --- |
| `--frontend-port 99999999999999999999 --backend-port 28200` | Exitcode 1, „--frontend-port must be a number between 1 and 65535“ |
| `--frontend-port 28200 --backend-port 18446744073709551617` | Exitcode 1, „--backend-port must be a number …“ |
| `--frontend-port 100000 …` (6 Stellen), `065536`, `000`, `+5` | je Exitcode 1, „--frontend-port must be a number …“ |
| `--frontend-port 028300 --backend-port 28300` | Exitcode 1, „… must differ“ |
| `--frontend-port 28300 --backend-port 0028300` | Exitcode 1, „… must differ“ |
| `--frontend-port 065535 --backend-port 01` | Parameter angenommen; Abbruch erst in der Prüfung des Git-Zustands wegen meines nicht committeten Berichts aus Durchlauf 1 (Exitcode 1, Meldung nennt `?? 01-functiontest-1.md`) |

Durchsicht des Codes (`scripts/testenv`, Zeilen 97–114 und 206–286): Nach `require_port` werden `frontend_port` und `backend_port` durch den Wert ohne führende Nullen ersetzt (Zeilen 209, 211). Alle späteren Verwendungen (Vergleich, Portprüfung, Start von Backend und `vite preview`, `PIPWERK_STUDIO_BACKEND_URL`, Zustandsdatei, Adresse der Gesundheitsprüfung) verwenden diese Variablen. Die Längenprüfung (`??????*`, ab 6 Stellen) hält Werte aus der Rechnung der Shell heraus; der leere Wert nach dem Entfernen der Nullen deckt 0 ab. Für Ports ohne führende Nullen ist der Wert unverändert; der übrige Ablauf von `start`, `stop` und `status` ist gegenüber `d6b3542` nicht geändert (`git diff`).

### Dokumentation

- `docs/technical/pipwerk-studio.md`, Abschnitt 4a, neuer Absatz „Risiko bei `--host` außerhalb der Loopback-Adresse“ und Abschnitt 8: stimmen mit dem Skript überein. Das Backend wird fest an `127.0.0.1` gebunden (`scripts/testenv`, Zeile 271), `vite preview` an `--host` (Zeile 281), die Weiterleitung `/api` an das Backend über `PIPWERK_STUDIO_BACKEND_URL` (Zeile 278). Das schreibende `PUT /api/studio/settings/language` steht in Abschnitt 5 der Dokumentation. Abschnitt 8 nennt das Risiko, die fehlende Minderung im Skript und die Voreinstellung.
- `docs/user/pipwerk-studio.md`, Abschnitt 2, Punkt 2: Hinweis zu `--host` in verständlicher Sprache, ohne Widerspruch zur technischen Dokumentation.
- Abschnitt 4a, Punkt 1 („ganze Zahlen von 1 bis 65535 und verschieden“) stimmt mit dem korrigierten Verhalten überein. Abschnitt 6.1 („weist ungültige Aufrufe (fehlende, ungültige oder gleiche Ports …) … ab“) deckt die neuen Testfälle ab.
- Die Suche im Repository (Abschnitt 4.4) besteht auch mit den geänderten Dokumenten.

## Änderung des Testers am Prüfskript

Commit `9e1415f9f6b94b02b063ac7f192b978b9fd2caca` im Zweig `ablauftest/wp01-functiontest`, auf GitHub übertragen:

- `components/pipwerk-studio/scripts/check`: Die Portprüfung hatte denselben Fehler wie F1 und F2 im Testumgebungsskript. Sie entfernt jetzt führende Nullen, weist Werte ab 6 Stellen und den Wert 0 ab und vergleicht die Ports ohne führende Nullen. Geprüft: `--backend-port 99999999999999999999`, `000` und `--frontend-port 065536` je Exitcode 2 mit „… must be a number between 1 and 65535“; `--backend-port 028100 --frontend-port 28100` Exitcode 2 mit „… must differ“; vollständiger Lauf mit `028100`/`028173` siehe oben.
- Abschnitt 6.4 von `docs/technical/pipwerk-studio.md` bleibt richtig („ganze Zahl von 1 bis 65535“, „verschieden“); keine Änderung nötig.

## Hinweise ohne Einfluss auf das Ergebnis

- H2 aus dem Sicherheitstest (Ausschlüsse über `core.excludesFile` und `.git/info/exclude`): Das Skript verwendet `git status --porcelain` für die ganze Wurzel, so wie es die Spezifikation in Abschnitt 6.1 vorschreibt. Gegenüber Auftrag und Spezifikation ist das kein Befund in diesem Commit.

## Nicht geprüft

- Vollständiger Start der Testumgebung von Hand auf diesem Commit: Mein Arbeitsverzeichnis enthält den nicht committeten Bericht aus Durchlauf 1. `start` bricht deshalb, wie vorgesehen, in der Prüfung des Git-Zustands ab. Das Verschieben der Datei war in dieser Sitzung nicht freigegeben. Der Ablauf nach der Prüfung der Parameter ist gegenüber dem in Durchlauf 1 vollständig gestarteten Commit `d6b3542` nicht geändert (siehe Durchsicht des Codes).
- Lauf von `test_ports_with_leading_zeros_and_the_limits_are_accepted` bei belegtem Port 65535 (siehe F3).
- `shellcheck` ist auf dem Prüfrechner nicht installiert. Auftrag 01, Kriterium 1, verlangt die Prüfung nur, „falls vorhanden“.

## Geltung

Dieser Bericht gilt nur für den Commit `83466cd1bd2daab04d1596beca1ec296fee386c4`.
