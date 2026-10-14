# Testbericht Funktionstest, Auftrag 01, Durchlauf 1

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: Tester Funktion
- Übergabedokument: `ablauftest/wp01:development/ablauftest/wp01/tests/01-functiontest-1-order.md`
- geprüfter Commit: `d6b354201feb1a8385819ad37946d98150edd1f6` (Zweig `ablauftest/wp01-01`)
- Commit des Prüfskripts: `bdbd28e501bfe3eb4a1fe069e1f90094fa6e9909` (Zweig `ablauftest/wp01-functiontest`, auf GitHub übertragen, aufgesetzt auf dem geprüften Commit)
- Datum: 2026-10-14

## Ergebnis

**nicht bestanden**

Grund: zwei Befunde F1 und F2 im Testumgebungsskript. Beide betreffen die Prüfung der Ports in `testenv start`. Alle automatischen Prüfungen bestehen.

## Befunde

### F1 – Zu große Portnummer wird nicht als ungültiger Parameter abgewiesen

- Fundstelle: `components/pipwerk-studio/scripts/testenv`, Zeilen 97–104 (`require_port`)
- Sachverhalt: Eine Portnummer aus Ziffern, die größer ist als der Zahlenbereich der Shell, besteht die Prüfung. Der Vergleich `[ "$2" -lt 1 ] || [ "$2" -gt 65535 ]` scheitert dann mit einem Fehler der Shell. Beide Bedingungen gelten damit als falsch, und `die` wird nicht aufgerufen. Das Skript läuft weiter: Es prüft Git und die Programme und bricht erst in der Prüfung des freien Ports ab. Die Fehlerausgabe enthält zwei Meldungen der Shell, einen Python-Traceback und die falsche Ursache „port … is in use or not available“.
- Nachweis (Arbeitsverzeichnis ohne Änderungen):

  ```text
  testenv start --frontend-port 99999999999999999999 --backend-port 28200
  .../testenv: 101: [: Illegal number: 99999999999999999999
  .../testenv: 101: [: Illegal number: 99999999999999999999
  Traceback (most recent call last):
    ...
  OverflowError: bind(): port must be 0-65535.
  testenv: frontend port 99999999999999999999 is in use or not available on 127.0.0.1
  ```

  Exitcode 1.
- Bezug: technische Dokumentation `docs/technical/pipwerk-studio.md`, Abschnitt 4a, `start` Punkt 1 („ganze Zahlen von 1 bis 65535“) und erster Abbruchfall „ungültige oder fehlende Parameter“ mit einer Meldung, die die Ursache nennt; Auftrag 01, technisches Abnahmekriterium 1. Die Grenzwerte 0 und 65536 weist das Skript richtig ab (geprüft).

### F2 – Gleiche Ports in anderer Schreibweise werden nicht als gleich erkannt

- Fundstelle: `components/pipwerk-studio/scripts/testenv`, Zeilen 200–201
- Sachverhalt: Das Skript vergleicht die beiden Ports als Text. `028300` und `28300` gelten deshalb als verschieden, obwohl sie denselben Port bezeichnen. Die Prüfung der freien Ports besteht für beide. Das Skript installiert danach die Abhängigkeiten, baut die Oberfläche und startet beide Prozesse. Erst dann scheitert das Backend am belegten Port. Das Skript räumt danach richtig auf (`.testenv/` entfernt, kein Prozess und kein offener Port übrig, geprüft mit `testenv status` und `ss -ltnp`).
- Nachweis:

  ```text
  testenv start --frontend-port 028300 --backend-port 28300
  ...
  testenv: building the user interface
  ...
  testenv: the backend exited during start
  testenv: last lines of the backend log:
  ...
  ERROR:    [Errno 98] error while attempting to bind on address ('127.0.0.1', 28300): [errno 98] address already in use
  ```

- Bezug: technische Dokumentation Abschnitt 4a, `start` Punkt 1 („… und verschieden“) und erster Abbruchfall „ungültige oder fehlende Parameter“; Auftrag 01, technisches Abnahmekriterium 1.

## Durchgeführte Prüfungen

### Ausgecheckter Commit

`git -C <Arbeitsverzeichnis> rev-parse HEAD` vor der Prüfung: `d6b354201feb1a8385819ad37946d98150edd1f6`. Der Commit liegt direkt auf dem Ausgangscommit `ff84876f5cacb7cfca77e07441203ba5303909e6` aus Auftrag 01 (`git merge-base`).

### Prüfskript

Ausgeführt auf dem Commit des Prüfskripts, also dem geprüften Commit zuzüglich Prüfskript und Abschnitt 6.4:

```text
components/pipwerk-studio/scripts/check --backend-port 28100 --frontend-port 28173
```

Ergebnis: Exitcode 0, „all checks passed“.

| Prüfung | Ergebnis |
| --- | --- |
| `uv sync --frozen` | bestanden |
| pytest | 133 bestanden, darunter `test_name.py` (12) und `test_testenv.py` (17) |
| ruff check | bestanden |
| ruff format --check | bestanden |
| mypy | bestanden, 15 Dateien |
| Suche im Repository nach Abschnitt 4.4 | bestanden, 242 Treffer, alle „pipwerk Studio“ oder `pipwerk-studio` |
| `npm ci` | bestanden |
| typecheck | bestanden |
| Vitest | 110 bestanden in 7 Dateien |
| Build | bestanden |
| Browsertest (Chromium, Firefox, WebKit) | 12 bestanden, 3 übersprungen („shows no tooltip without a Git working tree“, wie vorgesehen in einem Git-Arbeitsbereich) |

Der Browsertest läuft in diesem Commit gegen den Entwicklungsserver. Das ist nach dem Übergabedokument kein Befund.

Zusätzlich mit `--with-audit`: `pip-audit` meldet keine bekannten Sicherheitslücken. `npm audit` scheitert am bekannten Befund `source-map-js` 1.2.1 (GHSA-68fv-2mgg-jv7q). Dieser Befund ist in Abschnitt 7 und 9 der technischen Dokumentation genannt und nicht Gegenstand von Auftrag 01.

Die Auswertung der Suche wurde an `docs/design/` gegengeprüft: Dort liefert dieselbe Suche Treffer mit falscher Schreibweise (zum Beispiel `docs/design/planning/pflichtenheft-strategiedesigner.md:12`). Das Ausgabeformat `Datei:Zeile:Treffer` passt zum Filter des Prüfskripts, der nur genau „pipwerk Studio“ und `pipwerk-studio` zulässt.

### Testumgebungsskript von Hand

Gestartet im eigenen Arbeitsverzeichnis ohne nicht committete Änderungen:

| Fall | Ergebnis |
| --- | --- |
| `start --frontend-port 28273 --backend-port 28200` | Installation, Bau, Start; Meldung „pipwerk Studio is running: http://127.0.0.1:28273/ (backend on 127.0.0.1:28200)“. `backend.log` zeigt die Anfrage `GET /api/health` über die Weiterleitung. Beide Prozesse lauschen nur auf `127.0.0.1` (`ss -ltnp`). INI mit eigener SQLite-Datei in `.testenv/`. |
| `status` bei laufender Testumgebung | Exitcode 0, nennt beide Adressen |
| zweiter `start` bei laufender Testumgebung | Exitcode 1, „a test environment is already running“ |
| `stop` | Exitcode 0, `.testenv/` entfernt, beide Ports frei |
| `status` nach `stop` | Exitcode 1, „not running“ |
| belegter Port des Backends, belegter Port der Oberfläche | je Exitcode 1 mit Nennung des Ports, vor der Installation |
| Port 0, Port 65536 | je Exitcode 1, „must be a number between 1 and 65535“ |
| zu große Portnummer | Befund F1 |
| gleiche Ports in anderer Schreibweise | Befund F2 |
| `status` mit zusätzlichem Argument | Exitcode 2 mit Aufrufhinweis |
| `pipwerk-studio --help` und Start ohne Startkonfiguration, aufgerufen wie in Abschnitt 4a | Name „pipwerk Studio“, Fehlermeldung wie in Abschnitt 2.2 |

Der Abbruch bei nicht committeten Änderungen und neuen Dateien ist durch `test_testenv.py` belegt (alle fünf Fälle aus Abschnitt 4.3 der Spezifikation und die Gegenprobe, bestanden).

### Tests gegen die Spezifikation

- `test_testenv.py` deckt alle Fälle aus Abschnitt 4.3 ab: geänderte Datei in der Komponente, geänderte `LICENSE`, neue Datei in der Komponente, neue Datei im Wurzelverzeichnis, ohne Git; jeweils kein Platzhalteraufruf, kein `.testenv/`, kein `frontend/dist/`, kein laufender Prozess; Gegenprobe mit ignorierter Datei unter `frontend/node_modules/`. Nachbau aus `git ls-files`, Trennung über `GIT_CEILING_DIRECTORIES`, Überspringen ohne Git.
- `test_name.py` deckt alle Punkte aus Abschnitt 4.4 ab, einschließlich der Breiten 40, 80 und 200, der abgeschalteten Farbe und des Zusammenfassens der Ausgabe, sowie W1 (kein `pipwerk-studio` und kein Zeilenumbruch in Beschreibung und Hilfetexten, Standardformatierer).

### Code und Schreibweise

- Schreibweise nach E10 in allen Dateien des Plans geändert. Die Kurzform „Studio“ steht nur noch in Kommentaren, Docstrings, Testtexten und nicht angezeigten Ausnahmetexten des Programmcodes (E10 d, zulässig). In Dokumentation, `index.html` und den Übersetzungsdateien steht sie nicht mehr (Suche mit `git grep -P '(?<!pipwerk )\bStudio\b'`).
- Oberflächendateien: nur Schreibweise und zugehörige Erwartungen geändert, im Browsertest neu die Prüfung des Seitentitels.
- Eintrag `.testenv/` am Ende von `components/pipwerk-studio/.gitignore`.
- Das Testumgebungsskript enthält keine festen Ports, Pfade oder Rechnernamen.

### Technische Dokumentation

Geprüft gegen Auftrag 01, Umfang Punkt 5: Abschnitt 1 (Stand und Gegenstand), Abschnitt 4a mit Aufruf, Voraussetzungen (mit `python3` und `ps` nach Entscheidung des Softwarearchitekten), Abbruchfällen, Adresse der Schnittstellenbeschreibung und Aufruf der Kommandozeile, Abschnitt 5, Abschnitt 6.1 mit den drei neuen Punkten (Suche als eigener Punkt, ohne unzulässige Schreibweisen), Abschnitt 8, Abschnitt 9 und Glossar. Die Beschreibung stimmt mit dem Verhalten des Skripts überein, abgesehen von den Abweichungen in F1 und F2. Die Nummer 6.4 war vom Entwickler nicht belegt. Wiedergegebene Ausgaben (Abschnitte 2.1 und 2.2) stimmen mit der Ausgabe des Backends überein.

## Änderung des Testers am Prüfskript

Commit `bdbd28e501bfe3eb4a1fe069e1f90094fa6e9909` im Zweig `ablauftest/wp01-functiontest`:

- neu: `components/pipwerk-studio/scripts/check` nach Abschnitt 6.2 der Spezifikation, mit der Suche im Repository nach Abschnitt 4.4. Die Ports des Browsertests sind Pflichtparameter.
- neu: Abschnitt 6.4 „Prüfskript“ in `docs/technical/pipwerk-studio.md` mit Name, Aufruf, Parametern, Reihenfolge, Exitcodes und Voraussetzungen.

## Nicht geprüft

- `shellcheck` ist auf dem Prüfrechner nicht installiert. Auftrag 01, Kriterium 1, verlangt die Prüfung nur, „falls vorhanden“.
- HTTP-Abfragen von Hand an die laufende Testumgebung (Seitentitel, `/api/studio/revision`, `/docs` und `/openapi.json` am Port des Backends, `/docs` am Port der Oberfläche) waren in dieser Sitzung nicht erlaubt. Gesundheitsprüfung über den Port der Oberfläche: belegt durch den erfolgreichen `start` und `backend.log`. Seitentitel und Überschrift: belegt durch den Browsertest. Titel und Texte der Schnittstellenbeschreibung: belegt durch `test_name.py`.

## Offene Entscheidung für den Softwarearchitekten

- Bezug: Spezifikation Abschnitt 6.2 („führt die Prüfungen aus Abschnitt 6.1 bis 6.3 … aus und endet mit Exitcode 0 nur, wenn alle bestehen“). Abschnitte 6.1 und 6.2 der technischen Dokumentation enthalten `pip-audit` und `npm audit`.
- Nachweis: `npm audit` endet auf diesem Commit wegen des bekannten Befunds aus Abschnitt 7 mit Exitcode 1. Mit beiden Audits könnte das Prüfskript nie mit 0 enden. Der Plan verlangt aber Exitcode 0 als technischen Nachweis, und Kriterium 6 von Auftrag 01 nennt die Audits nicht.
- Umsetzung im Prüfskript: Beide Audits laufen nur mit dem Parameter `--with-audit`. Das steht in Abschnitt 6.4.
- Benötigte Entscheidung: ob die Audits ohne Parameter Teil des Prüfskripts sein sollen. Zuständig ist der Softwarearchitekt.
