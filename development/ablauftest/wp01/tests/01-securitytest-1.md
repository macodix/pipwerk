# Testbericht Sicherheitstest, Auftrag 01, Durchlauf 1

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: Tester Sicherheit
- Prüfauftrag: `development/ablauftest/wp01/tests/01-securitytest-1-order.md` auf dem Zweig `ablauftest/wp01`
- geprüfter Commit: `d6b354201feb1a8385819ad37946d98150edd1f6` (Zweig `ablauftest/wp01-01`, Ausgangscommit `ff84876f5cacb7cfca77e07441203ba5303909e6`)
- Datum: 2026-10-14

## Ergebnis

**nicht bestanden**

Zwei Befunde (S1, S2). Beide betreffen das Testumgebungsskript und seine Dokumentation. Die geänderten Texte des Backends sind unbedenklich.

## Prüfgrundlagen

- Auftrag `development/ablauftest/wp01/orders/01.md`
- Spezifikation `development/ablauftest/specification.md`, Abschnitte 4.3, 5, 6.1, E9, E10
- `docs/technical/development-test-security-rules.md`, Abschnitte 5, 8 und 9 (Stand des geprüften Commits)
- `docs/technical/pipwerk-studio.md`, Abschnitte 4a, 6.1 und 8 (Stand des geprüften Commits)
- BSI IT-Grundschutz CON.8 und APP.7, OWASP ASVS (Eingabeprüfung, Konfiguration), OWASP API Security Top 10 (API8 Sicherheitsfehlkonfiguration)

## Kontrolle des Commits

`git rev-parse HEAD` im Arbeitsverzeichnis ergab `d6b354201feb1a8385819ad37946d98150edd1f6`. Geändert sind 29 Dateien gegenüber dem Ausgangscommit (`git diff --stat`).

## Durchgeführte Prüfungen und Nachweise

| Nr. | Prüfung | Ergebnis |
|---|---|---|
| P1 | `uv sync --frozen`, danach `pytest -q` im Backend | 133 Tests bestanden |
| P2 | `pytest -q -rs tests/test_testenv.py` | 17 bestanden, keiner übersprungen |
| P3 | `ruff check .` (Regelsatz enthält `S`, flake8-bandit) | keine Meldung |
| P4 | `ruff format --check .` | 15 Dateien formatiert |
| P5 | `mypy` (strict) | keine Meldung in 15 Dateien |
| P6 | `shellcheck` | nicht ausgeführt: auf dem Prüfrechner nicht installiert. Auftrag verlangt die Prüfung nur, falls vorhanden. Eine Syntaxprüfung mit `sh -n` war in dieser Prüfumgebung nicht freigegeben. Das Skript lief in P7 bis P10 vollständig unter `sh`. |
| P7 | Vollständiger Start `testenv start --frontend-port 18431 --backend-port 18432` im eigenen Arbeitsverzeichnis | Start erfolgreich, Meldung `pipwerk Studio is running: http://127.0.0.1:18431/ (backend on 127.0.0.1:18432)` |
| P8 | Bindung der Prozesse (`ss -ltnp`) | Backend nur auf `127.0.0.1:18432`, Oberfläche nur auf `127.0.0.1:18431` |
| P9 | Rechte in `.testenv/` (`ls -la`) | Verzeichnis `drwx--S---` (700); Dateien darin `state`, `backend.log`, `frontend.log`, `pipwerk-studio.ini`, `pipwerk-studio.db`. Inhalt `state`: nur Prozesskennungen, Ports, Host. `backend.log`: nur Start- und Zugriffszeilen von Uvicorn, keine Geheimnisse. INI: nur `[database] url = sqlite:///…/.testenv/pipwerk-studio.db`. |
| P10 | Anfragen an den Port der Oberfläche mit Python `http.client` | `Host: attacker.example` → HTTP 403 „Blocked request“ (Schutz von Vite gegen DNS-Rebinding wirkt); `/api/health` → 200 `{"status":"ok"}`; `/docs` und `/openapi.json` → 200 mit der HTML-Seite der Oberfläche, nicht die Schnittstellenbeschreibung (Weiterleitung nur für `/api`) |
| P11 | Zweiter `start` bei laufender Testumgebung | Abbruch „a test environment is already running“ |
| P12 | `status` laufend, `stop`, danach Kontrolle | `status` nennt Ports; `stop` meldet „test environment stopped“; danach kein Prozess mehr auf den Ports (`ss`), `.testenv/` entfernt |
| P13 | `start … --host --version` (Wert, der wie eine Option aussieht) | Abbruch vor Installation („frontend port … is in use or not available on --version“); Vite wurde nicht erreicht |
| P14 | `start --frontend-port 99999999999999999999 --backend-port 18432` | siehe Befund S1 |
| P15 | Suche im Diff nach lokalen Pfaden, Rechner- und Benutzernamen, Zugangsdaten, Schlüsseln, IP-Adressen außer `127.0.0.1` und `0.0.0.0`, E-Mail-Adressen (`git diff -G …`) | keine Treffer außer `tester@example.invalid` in `test_testenv.py` (reservierte Domain `.invalid`, keine echte Adresse) |
| P16 | Durchsicht des Diffs der Backend-Quellen (`app.py`, `cli.py`, `config.py`, `revision.py`, `settings_service.py`, `storage.py`, `__init__.py`), `pyproject.toml`, Beispielkonfiguration und Oberflächendateien | nur Schreibweise des Namens geändert; keine neuen Endpunkte, Parameter, Felder oder Angaben in Ausgaben (Spezifikation Abschnitt 5 erfüllt) |
| P17 | Durchsicht `scripts/testenv` (Quoting, Pfade, Prozesse, Aufräumen) | siehe Bewertung unten und Befund S1 |
| P18 | Durchsicht `tests/test_testenv.py` und `tests/test_name.py` | siehe Bewertung unten |

Nach den Prüfungen wurden alle von mir erzeugten, von Git ignorierten Dateien im Arbeitsverzeichnis entfernt (`git clean -fdX -- components/pipwerk-studio`). Diese Datei ist die einzige nicht versionierte Datei.

## Bewertung ohne Befund

Testumgebungsskript `components/pipwerk-studio/scripts/testenv`:

- Alle Variablen sind in Aufrufen in doppelte Anführungszeichen gesetzt. Es gibt kein `eval`, keine zusammengesetzten Befehlszeichenketten und keine Auswertung von Eingaben durch eine zweite Shell. Python-Hilfsprogramme (`port_free`, `probe_health`) erhalten Host, Port und URL als Argumente (`sys.argv`), nicht im Programmtext.
- Geerbte `GIT_DIR`, `GIT_WORK_TREE` und `GIT_INDEX_FILE` werden entfernt (Zeile 23). `CDPATH` ist beim Bestimmen der Verzeichnisse leer (Zeilen 44 und 46).
- Die Prüfung auf nicht committete Änderungen erfolgt vor jeder Installation, jedem Bau und jedem Start (Zeilen 209 bis 218); bestätigt durch P2.
- `--host` ist auf `A-Za-z0-9.:_-` begrenzt (Zeile 203), Standard `127.0.0.1`. Das Backend bindet sich fest an `127.0.0.1` (Zeile 259). Die Weiterleitung von Vite verwendet `http://127.0.0.1:<backend-port>` (Zeile 266).
- Der Pfad des Arbeitsverzeichnisses wird auf `%` und Zeilenumbruch geprüft, bevor er in die INI geschrieben wird (Zeilen 223 bis 226). Damit ist keine Einschleusung über die Interpolation von `configparser` oder eine zweite Zeile möglich.
- `.testenv/` wird mit Rechten 700 angelegt (Zeile 243, P9). Prozesskennungen werden vor `kill` mit `kill -0` und einer Markierung in der Befehlszeile geprüft (Zeilen 66 bis 88). `rm -rf` wirkt nur auf das aus dem Skriptpfad bestimmte `.testenv/`.
- Bei jedem Fehler und bei `INT`, `TERM`, `HUP` beendet `on_exit` die gestarteten Prozesse und entfernt `.testenv/` (Zeilen 160 bis 176, 240 bis 241); bestätigt durch die Gegenprobe in P2.
- Abhängigkeiten werden nur nach Lockdateien installiert (`uv sync --frozen`, `npm ci`; Zeilen 248 bis 249), entsprechend Abschnitt 5 Nr. 7 der Regeln.
- Die Erreichbarkeitsprüfung umgeht Proxy-Einstellungen der Umgebung (`ProxyHandler({})`, Zeile 136) und hat eine Zeitbegrenzung.
- Keine festen Ports, Pfade oder Rechnernamen.

Test `components/pipwerk-studio/backend/tests/test_testenv.py`: Läuft in einem temporären Nachbau, ersetzt `uv`, `npm` und `npx` durch Platzhalter, trennt Git über `GIT_CEILING_DIRECTORIES`, `GIT_CONFIG_GLOBAL=/dev/null` und `GIT_CONFIG_NOSYSTEM`, entfernt geerbte `GIT_*`-Variablen, verwendet freie Ports und eine Zeitbegrenzung von 60 Sekunden. Keine Zugangsdaten, keine Netzzugriffe nach außen, keine Seiteneffekte außerhalb des temporären Verzeichnisses.

Test `components/pipwerk-studio/backend/tests/test_name.py`: arbeitet mit temporären Datenbanken und isoliertem `HOME`; keine sicherheitsrelevanten Seiteneffekte.

Backend: Die geänderten Ausgabetexte (`detail` der HTTP-Antwort 503, Protokolleinträge, Fehlermeldung beim Start, Hilfetext, Schnittstellenbeschreibung) enthalten nur die andere Schreibweise. Die Ausnahme in `settings_service.py` nennt wie bisher den gespeicherten Wert; sie gelangt nur in das Protokoll, nicht in die HTTP-Antwort (unverändert gegenüber dem Ausgangscommit).

## Befunde

### S1 Bereichsprüfung der Ports wirkungslos bei Zahlen außerhalb des Zahlenbereichs der Shell

- Fundstelle: `components/pipwerk-studio/scripts/testenv`, Funktion `require_port`, Zeilen 97 bis 104; Folge in `port_free`, Zeilen 111 bis 127
- Sachverhalt: `require_port` lässt nur Ziffern zu und prüft dann mit `[ "$2" -lt 1 ] || [ "$2" -gt 65535 ]`. Bei einer Zahl, die die Shell nicht als ganze Zahl verarbeiten kann, endet `[` mit einem Fehler und Status ungleich 0. Die Bedingung gilt dann als falsch, `die` wird nicht aufgerufen, und der Wert gilt als gültiger Port.
- Nachweis (P14): `testenv start --frontend-port 99999999999999999999 --backend-port 18432` gibt zweimal `testenv: 101: [: Illegal number: 99999999999999999999` aus. Danach laufen die Prüfung des Git-Zustands und die Prüfung der Programme. Abgebrochen wird erst in `port_free` durch eine nicht abgefangene Python-Ausnahme `OverflowError: bind(): port must be 0-65535` mit vollständigem Traceback und der unzutreffenden Meldung `frontend port 99999999999999999999 is in use or not available on 127.0.0.1`. Für `--backend-port` gilt derselbe Weg.
- Auswirkung: Installiert, gebaut oder gestartet wird nichts. Die Eingabeprüfung an der Systemgrenze greift aber nicht; der Abbruch beruht auf einem zufälligen Nebeneffekt in einer späteren Funktion. Die Fehlermeldung nennt nicht die Ursache.
- Verletzte Vorgaben: Regeln Abschnitt 8.2 Nr. 2 (externe Eingaben an der Systemgrenze validieren); Spezifikation Abschnitt 6.1 und Dokumentation Abschnitt 4a Nr. 1 und Abschnitt 8 („die Parameter werden zuvor geprüft (Ports als Zahlen …)“, „ganze Zahlen von 1 bis 65535“); Auftrag Abnahmekriterium 1. Der Test `test_invalid_call_is_rejected_before_anything_happens` deckt nur `70000` ab, nicht diesen Fall (Regeln Abschnitt 8.2 Nr. 11).

### S2 Erreichbarkeit der Schnittstelle ohne Authentisierung bei `--host` außerhalb von `127.0.0.1` nicht dokumentiert

- Fundstelle: `docs/technical/pipwerk-studio.md`, Abschnitt 8 (Zeile 390) und Abschnitt 4a (Zeilen 229, 233, 249); `docs/user/pipwerk-studio.md`, Zeile 26; Verhalten in `components/pipwerk-studio/scripts/testenv`, Zeilen 202 bis 204 und 264 bis 271, mit `components/pipwerk-studio/frontend/vite.config.ts`, Zeilen 8 bis 23
- Sachverhalt: `--host` nimmt jede Adresse an, auch `0.0.0.0` oder `::`. `vite preview` bindet sich daran und leitet alle Anfragen unter `/api` an das Backend weiter, auch das schreibende `PUT /api/studio/settings/language`. Bei einer Adresse außerhalb der Loopback-Schnittstelle sind damit alle Endpunkte des Backends aus dem Netz über den Port der Oberfläche erreichbar. Eine Authentisierung gibt es nicht (Dokumentation Abschnitt 8, letzter Satz). Das Skript gibt dazu keinen Hinweis aus.
- Die Dokumentation nennt diesen Zusammenhang nicht. Abschnitt 8 hebt hervor, dass sich das Backend „nur an `127.0.0.1`“ bindet und die Schnittstellenbeschreibung „nur auf `127.0.0.1` erreichbar“ ist. Das ist zutreffend (P8, P10), legt aber nahe, das Backend sei vom Netz getrennt. Dass die Endpunkte selbst über `<host>:<frontend-port>/api/…` ohne Authentisierung erreichbar werden, steht weder dort noch in Abschnitt 4a noch in der Anwenderdokumentation, die `--host` als Möglichkeit nennt.
- Verletzte Vorgaben: Regeln Abschnitt 8.1, letzter Absatz (Abweichung von einer einschlägigen Sicherheitsanforderung mit Grund, Risiko und gegebenenfalls Ersatzmaßnahme dokumentieren); Abschnitt 8.2 Nr. 7 (Netzwerkzugriffe auf das Benötigte begrenzen); Abschnitt 8.3 Nr. 2 (sichere Voreinstellung; erfüllt durch den Standard `127.0.0.1`, die Abweichung ist aber nicht beschrieben); Abschnitt 9 Zeile Vite (Server von Vite nicht als Sicherheitsgrenze behandeln); OWASP API Security Top 10 API8; Auftrag Abnahmekriterium 7 (Dokumentation vollständig und konsistent).
- Hinweis zur Einordnung: Der Parameter `--host` selbst ist von der Spezifikation (Abschnitt 6.1) vorgegeben. Beanstandet ist die fehlende Beschreibung des Risikos.

## Hinweise ohne Einfluss auf das Ergebnis

- H1: Die Markierung, mit der `pid_matches` eine verzeichnete Prozesskennung bestätigt, ist für die Oberfläche nur die Zeichenfolge `vite` (Zeilen 91, 230, 281, 313). Wird eine verzeichnete Kennung nach einem Neustart des Rechners von einem anderen Prozess desselben Benutzers wiederverwendet, dessen Befehlszeile `vite` enthält, beendet `stop` diesen Prozess. Die Spezifikation verlangt keinen bestimmten Schutz; die Auswirkung ist auf Prozesse desselben Benutzers begrenzt.
- H2: `git status --porcelain` (Zeile 212) berücksichtigt neben den versionierten `.gitignore`-Dateien auch die Ausschlüsse des Benutzers (`core.excludesFile`) und `.git/info/exclude`. Eine nur dort ausgeschlossene neue Datei verhindert den Start nicht. Das betrifft die Genauigkeit des Stands nach E9 und gehört in die Funktionsprüfung; hier nur vermerkt.
- H3: Für `shellcheck` (Abnahmekriterium 1, „falls vorhanden“) fehlt das Programm auf dem Prüfrechner. Diese Prüfung ist durch mich nicht erfolgt.

## Geltung

Dieser Bericht gilt nur für den Commit `d6b354201feb1a8385819ad37946d98150edd1f6`.
