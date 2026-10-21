# pipwerk-fetch-mt5 – technische Dokumentation

## Dokumentstatus

- status: `draft`
- stand: 2026-10-21
- komponente: `pipwerk-fetch-mt5`
- vorhaben: `backtest`, Arbeitspaket `wp02`, Auftrag 03 (Spezifikation: E5, 5.1, 5.4, 10, 11)

## 1. Gegenstand

`pipwerk-fetch-mt5` ist die Quelle für historische Kursdaten aus MetaTrader 5 (req-system-027). Es ist ein kleines Programm, das auf dem Rechner läuft, auf dem MetaTrader 5 läuft. Es liest dort mit dem Python-Paket `MetaTrader5` Kerzen, Ticks und die Angaben zu einem Instrument und liefert sie über eine HTTP-Schnittstelle als Dateien im JSON-Format des Imports (`contracts/market-data/v1/`). pipwerk replay stößt es an und importiert das Ergebnis. Weitere Quellen sind weitere Programme mit derselben Schnittstelle, beschrieben unter `contracts/api/pipwerk-fetch/v1/`.

Das Programm bedient nur Anfragen mit dem gemeinsamen Schlüssel, weil es einen Rechner mit Handelssoftware erreicht. Es handelt nie und schreibt nichts in MetaTrader 5; es liest.

## 2. Aufbau

Die Komponente liegt in `components/pipwerk-fetch-mt5/`. Sie hat nur ein Backend, deshalb liegen `pyproject.toml`, `uv.lock`, `src/` und `tests/` unmittelbar darin (bei pipwerk Studio liegen sie im Unterverzeichnis `backend/`, weil es dort auch eine Oberfläche gibt).

| Datei | Inhalt |
| --- | --- |
| `src/pipwerk_fetch_mt5/cli.py` | Startpunkt `pipwerk-fetch-mt5 [-c <PATH>]` |
| `config.py` | Startkonfiguration (INI), Suchorte nach req-system-017 |
| `app.py` | FastAPI-Anwendung: die zwei Endpunkte, Fehlerbehandlung, Middleware |
| `models.py` | Pydantic-Modelle der Anfragen und Antworten, auch die Dateien des Imports |
| `service.py` | die Beschaffung: Zuordnung, Umrechnung nach UTC, Grenzen, Aufbau der Dateien |
| `gateway.py` | die eigene Schnittstelle zu MetaTrader 5 (`TerminalGateway`) und ihre Datentypen |
| `mt5_gateway.py` | Umsetzung der Schnittstelle mit dem Paket `MetaTrader5` |
| `timeconv.py` | Serverzeit nach UTC und zurück, Handelszeiten nach UTC |
| `auth.py`, `host_check.py`, `body_limit.py` | gemeinsamer Schlüssel, Prüfung des Kopfs `Host`, Begrenzung der Anfrage |
| `errors.py` | die Fehler: Kennung, Status, fester Text |
| `fake_source.py` | nachgebildete Quelle für die Tests anderer Komponenten (Abschnitt 8) |
| `contract.py` | erzeugt die Beschreibung der Schnittstelle unter `contracts/api/pipwerk-fetch/v1/` |
| `pipwerk-fetch-mt5.example.ini` | Beispiel der Startkonfiguration |
| `scripts/install.cmd`, `scripts/start.cmd` | Installation und Start unter Windows (Abschnitt 7) |

Fachlogik liegt in `service.py` und kennt weder HTTP noch das Paket `MetaTrader5`; `app.py` übersetzt nur. Das Paket wird erst beim ersten Zugriff geladen (`importlib`), nie beim Import der Module.

Eine Anfrage läuft so: Prüfung des Kopfs `Host`, Prüfung des Schlüssels, Begrenzung der Größe, Prüfung der Anfrage durch Pydantic, `FetchService`, `TerminalGateway`. Die Endpunkte sind gewöhnliche Funktionen, FastAPI führt sie in einem Thread aus; `Mt5Gateway` führt immer nur einen Aufruf des Pakets gleichzeitig aus (Sperre), weil das Paket nicht für Threads gedacht ist. Ein langer Abruf von Ticks lässt Anfragen an `health` deshalb warten.

## 3. Startkonfiguration

Name der Datei: `pipwerk-fetch-mt5.ini`. Sie wird mit `-c <PATH>` gefunden (höchste Priorität) oder an den Suchorten von req-system-017 in dieser Reihenfolge: `%USERPROFILE%\pipwerk\etc`, `%APPDATA%\pipwerk`, `%PROGRAMDATA%\pipwerk` (Windows), `$HOME/pipwerk/etc`, `$HOME/.config/pipwerk`, `/etc/pipwerk` (Linux). Es gilt genau eine Datei, Inhalte mehrerer Dateien werden nicht zusammengeführt. Ohne gültige Datei startet das Programm nicht. Das Beispiel `pipwerk-fetch-mt5.example.ini` erklärt jeden Eintrag; die ausgefüllte Datei steht nie im Repository (`.gitignore` der Komponente).

| Abschnitt | Eintrag | Bedeutung |
| --- | --- | --- |
| `[server]` | `host` | Adresse, an der das Programm lauscht; Voreinstellung `127.0.0.1` |
| | `port` | Port; Voreinstellung `8765` |
| | `allowed_hosts` | Namen und IP-Adressen, die der Kopf `Host` zusätzlich tragen darf (Abschnitt 6); `*ip` erlaubt jede IP-Adresse |
| `[security]` | `shared_key` | Pflicht. Der gemeinsame Schlüssel: 16 bis 256 druckbare ASCII-Zeichen ohne Leerzeichen |
| `[broker]` | `server_time_zone` | Pflicht. IANA-Name der Zeitzone der Serverzeit des Brokers (Abschnitt 5) |
| | `name` | Name des Brokers in den Dateien; ohne Angabe der Name des Handelsservers, mit dem MetaTrader 5 verbunden ist |
| | `max_rows_per_request` | Höchstzahl der Zeilen einer Antwort; Voreinstellung 50000, höchstens 1000000 |
| `[metatrader5]` | `path`, `login`, `password`, `server`, `timeout_ms` | Angaben zur Verbindung; alle optional. Ohne sie hängt sich das Programm an das laufende Terminal mit dem Konto, in dem es angemeldet ist. `timeout_ms`: 1000 bis 600000, Voreinstellung 60000 |
| `[symbols]` | `<Bezeichnung> = <Symbol>` | Zuordnungstabelle (Abschnitt 4) |

Die Datei wird streng gelesen: Ein unbekannter Abschnitt oder Eintrag, eine Zahl außerhalb des Bereichs, eine unbekannte Zeitzone oder ein Schlüssel, der zu kurz ist oder Leerzeichen enthält, lässt den Start scheitern. Prozentzeichen in Werten werden nicht ausgewertet. Die Fehlermeldungen nennen den fehlerhaften Eintrag, nie einen Wert der Datei; bei einem Syntaxfehler nennen sie nur die Zeilennummer, weil configparser sonst die Zeile mit dem Schlüssel wiederholt. `repr()` der Konfiguration zeigt weder den Schlüssel noch das Kennwort. Die Anschrift und der Port stehen nur hier, nicht auf der Kommandozeile; das Programm kennt nur `-c`.

Das Programm erlaubt im Kopf `Host` zusätzlich zu den Voreinstellungen die eingestellte Adresse, wenn sie keine Sammeladresse (`0.0.0.0`, `::`) ist. Bei `host = 0.0.0.0` gehört `*ip` oder die Liste der Namen in `allowed_hosts`.

## 4. Zuordnung Bezeichnung zu Symbol

pipwerk replay fragt nach einem Instrument mit seiner Bezeichnung (zum Beispiel `EURUSD`). Der Broker nennt es vielleicht `EURUSD.r`. Die Tabelle `[symbols]` ordnet zu; Groß- und Kleinschreibung zählen. Ohne Eintrag gilt die Bezeichnung selbst als Symbol (Spezifikation 5.4). Die Dateien nennen immer die Bezeichnung, nie das Symbol des Brokers. Kennt der Broker das Symbol nicht, ist die Antwort `symbol_unknown`. Bevor das Programm Daten liest, wählt es das Symbol im Marktfenster von MetaTrader 5 aus (`symbol_select`); das Symbol bleibt dort danach stehen. Das ist eine Veränderung der Ansicht des Anwenders in MetaTrader 5, aber keine am Konto.

## 5. Zeitzone und Zeitpunkte

MetaTrader 5 liefert die Serverzeit des Brokers. Das Paket gibt sie als Sekunden seit 1970 zurück, als wäre die Serverzeit UTC; Zeitpunkte, die man ihm übergibt, liest es ebenso. `Mt5Gateway` liest `time` deshalb als Sekunden der Uhr des Servers und übergibt Serverzeiten als Datum mit `UTC` nur als Träger, ohne Umrechnung. Die Umrechnung nach UTC macht allein `service.py` mit der Zeitzone aus `server_time_zone` (Spezifikation 5.1), mit Sommerzeit:

- Eine Ortszeit, die beim Zurückstellen der Uhr doppelt vorkommt, gilt als die frühere (Regel des Imports).
- Eine Ortszeit, die beim Vorstellen der Uhr fehlt, lässt sich nicht umrechnen. Die Zeile wird ausgelassen und gezählt (`time_does_not_exist`).

Folge der ersten Regel: Die zweite Stunde einer doppelten Stunde bekäme dieselben UTC-Zeitpunkte wie die erste. Das Programm erkennt die zweite Stunde daran, dass die Serverzeit der Zeilen zurückgeht oder ihr UTC-Zeitpunkt außerhalb des gelesenen Abschnitts liegt, und lässt sie aus (`double_local_time`), statt zwei Zeilen für einen UTC-Zeitpunkt zu liefern. Die Daten dieser einen Stunde fehlen dann im Ergebnis; das Ergebnis nennt sie unter `omitted` (offener Punkt 4).

Die Anfrage nennt `start` (eingeschlossen) und `end` (ausgeschlossen) mit Zeitzone; sie werden nach UTC umgerechnet. Zahlen gelten nicht als Zeitpunkt. Jahre vor 1970 und nach 2100 und `start` nicht vor `end` weist die Prüfung ab. Alle Zeitpunkte der Antwort sind UTC, `2026-01-05T10:00:00.000Z` (Millisekunden, abschließendes `Z`).

Ein großer Zeitraum wird in mehrere Abrufe zerlegt: Kerzen in Schritte von höchstens 10000 Kerzen, Ticks in Schritte von 6 Stunden. Die Schritte werden in UTC geschnitten und als Serverzeit übergeben. Ein Schritt behält nur Zeilen, deren Serverzeit in ihm liegt; was das Paket an den Rändern zusätzlich liefert, gehört zum Nachbarschritt. Ein Test mit einem Gateway, das stets alle Zeilen liefert, weist nach, dass keine Zeile doppelt oder gar nicht ankommt.

## 6. Schnittstelle

Die Beschreibung (OpenAPI) liegt unter `contracts/api/pipwerk-fetch/v1/openapi.json`. Sie wird aus dem Programm erzeugt (`python -m pipwerk_fetch_mt5.contract <Datei>`, `--check` vergleicht, `--examples <Verzeichnis>` schreibt oder prüft die Beispiele unter `examples/`); ein Test vergleicht Datei und Programm. Das Programm hat weder `/docs` noch `/openapi.json`, denn es antwortet ohne Schlüssel auf nichts.

Jede Anfrage trägt den Schlüssel als `Authorization: Bearer <Schlüssel>`.

### 6.1 `POST /api/v1/fetch`

Anfrage (Pydantic, zusätzliche Felder abgelehnt, keine stillschweigende Umwandlung):

| `kind` | Felder | Antwort |
| --- | --- | --- |
| `candles` | `instrument`, `time_unit`, `start`, `end` | Kerzen, `file` nach `candles.schema.json` |
| `ticks` | `instrument`, `start`, `end` | Ticks, `file` nach `ticks.schema.json` |
| `instrument` | `instrument` | Angaben zum Instrument, `file` nach `instrument.schema.json` |

`instrument` ist die Bezeichnung (1 bis 128 Zeichen ohne Steuerzeichen, kein Leerzeichen am Rand). `time_unit` ist eine der Zeiteinheiten von MetaTrader 5, klein geschrieben wie im Schema des Imports: `m1 m2 m3 m4 m5 m6 m10 m12 m15 m20 m30 h1 h2 h3 h4 h6 h8 h12 d1 w1 mn1`. Die Anfrage ist höchstens 8 KiB groß.

Antwort 200: `{"file": …, "omitted_count": n, "omitted": […]}`. `file` ist genau die Datei, die der Import liest (das Schema steht in Auftrag 02; die Modelle in `models.py` schreiben es aus, damit das Programm von keiner anderen Komponente abhängt). `omitted` nennt höchstens die ersten 100 ausgelassenen Zeilen mit Serverzeit und Grund, `omitted_count` alle. Gründe: `time_does_not_exist`, `double_local_time`, `duplicate_time` (Kerze mit der Zeit der vorigen), `invalid_price` (Preis nicht endlich oder nicht über null).

Inhalt der Dateien:

- Kerzen: `version` 1, `kind`, `broker`, `instrument`, `time_unit`, `period` (der angefragte Zeitraum; die Quelle deckt ihn ab, auch wo es keine Kerze gibt, zum Beispiel am Wochenende), `trading_hours` (Abschnitt 6.3), `candles` mit `time` (Eröffnung), `open`, `high`, `low`, `close`, `volume` (das Tickvolumen; das echte Volumen liefert das Programm nicht), `spread` (Punkte, wie geliefert). Es sind Geldkurse (Bid) wie von MetaTrader 5 geliefert.
- Ticks: wie Kerzen, mit `ticks` aus `time` (Millisekunden), `bid`, `ask`. MetaTrader 5 wird nach den Änderungen von Geld und Brief gefragt (`COPY_TICKS_INFO`). Mehrere Ticks in derselben Millisekunde bleiben alle erhalten.
- Instrument: `acquired_at` (Zeitpunkt der Beschaffung), `tick_size`, `tick_value` (Wert eines Ticks je Lot in der Währung `tick_value_currency`, die der Gewinnwährung des Symbols), `point`, `pip`, `spread`, `min_volume`, `volume_step`, `contract_size`, `swap_long`, `swap_short`, `swap_triple_weekday`, `margin_per_lot`.
  - `pip`: zehn Punkte bei einem Symbol mit drei oder fünf Stellen, sonst ein Punkt. MetaTrader 5 liefert keinen Pip; das ist die übliche Regel der Broker (Entscheidung des Entwicklers).
  - `spread`: der aktuelle Spread in Punkten mal `point`, also als Kursdifferenz, wie das Schema es verlangt.
  - `margin_per_lot`: die Margin für ein Lot, wie das Terminal sie berechnet (`order_calc_margin`, Kauf eines Lots zum aktuellen Brief; es kennt den Hebel). Gelingt das nicht, gilt die Anfangsmargin des Symbols, wenn es eine nennt, sonst `null`. Die Währung der Margin steht nicht in der Datei.
  - Gibt MetaTrader 5 einen Wert, den das Schema ablehnt (Tickgröße, Tickwert, Punkt, Kontraktgröße, Mindestvolumen oder Volumenschritt nicht über null oder nicht endlich, Swap nicht endlich, Währung nicht 2 bis 10 Buchstaben oder Ziffern), antwortet das Programm mit `invalid_broker_data`, statt eine Datei zu liefern, die der Import ablehnt.

Die Zahl der Kerzen eines Zeitraums wird vor dem Lesen geschätzt (Zeitraum geteilt durch die Dauer der Zeiteinheit, ein Monat zu 30 Tagen); ist sie größer als `max_rows_per_request`, antwortet das Programm `range_too_large`, ohne zu lesen. Ticks werden beim Lesen gezählt. Ein Zeitraum ohne eine einzige Zeile ist `no_data`.

### 6.2 `GET /api/v1/health`

Antwort `{"status": "ok"}`, wenn MetaTrader 5 läuft und mit seinem Handelsserver verbunden ist; sonst 503 `terminal_unavailable`.

### 6.3 Handelszeiten

Das Paket `MetaTrader5` bietet keine Funktion für die Handelszeiten eines Symbols (die gibt es nur in MQL5). Das Programm liefert deshalb für MetaTrader 5 keine: `trading_hours` ist `null`, und der Import lässt die gespeicherten Handelszeiten der Reihe dann unverändert. `TerminalGateway.sessions()` ist für Quellen vorgesehen, die welche kennen; die nachgebildete Quelle tut es. Wochensitzungen der Serverzeit lassen sich nur dann nach UTC bringen, wenn der Versatz der Zeitzone das ganze Jahr gleich ist; bei Sommerzeit wäre die Sitzung in UTC im Sommer und im Winter eine andere, und das Programm liefert dann `null` statt einer falschen Liste. Sitzungen über Mitternacht werden an der Mitternacht geteilt (Format des Schemas).

### 6.4 Fehler

Jeder Fehler hat die Form `{"error": {"code": …, "reason": …}}` und einen festen Text. Der Text nennt weder Werte der Anfrage noch Ausnahmetexte noch Angaben der Startkonfiguration. `fields` (nur bei `invalid_request`) nennt die Namen der ungültigen Felder der Schnittstelle, nie den Namen eines Felds, das es nicht gibt.

| Kennung | Status | Text |
| --- | --- | --- |
| `unauthorized` | 401 | Schlüssel fehlt oder ist falsch |
| `host_not_allowed` | 400 | Der Kopf Host der Anfrage ist nicht erlaubt |
| `body_too_large` | 413 | Die Anfrage ist größer als die erlaubten 8 KiB |
| `invalid_request` | 422 | Die Anfrage ist ungültig |
| `not_found` | 404 | Pfad oder Methode unbekannt |
| `symbol_unknown` | 404 | Symbol beim Broker unbekannt |
| `no_data` | 404 | Daten beim Broker nicht vorhanden |
| `range_too_large` | 422 | Zeitraum zu groß: mehr Zeilen als je Anfrage erlaubt, bitte einen kleineren Zeitraum anfragen |
| `terminal_unavailable` | 503 | MetaTrader 5 nicht erreichbar |
| `broker_error` | 502 | MetaTrader 5 hat die Abfrage mit einem Fehler beendet |
| `broker_unknown` | 502 | Der Name des Brokers ist nicht bestimmbar |
| `invalid_broker_data` | 502 | Der Broker liefert ungültige Angaben zum Instrument |
| `internal_error` | 500 | Interner Fehler im Programm |

Zuordnung der Fehler von MetaTrader 5 (`mt5_gateway.py`, nach `last_error()` des Pakets): Fehler der Verbindung (Code −10000 und darunter) und Anmeldefehler (−6) ergeben `terminal_unavailable` und lassen das Programm beim nächsten Aufruf neu verbinden; −4 (nicht gefunden) und Erfolg ohne Zeilen ergeben eine leere Liste, also `no_data`; alle anderen Fehler `broker_error`. Diese Codes stammen aus der Dokumentation des Pakets; sie sind nicht gegen ein echtes MetaTrader 5 geprüft.

## 7. Einrichtung auf dem Rechner von MetaTrader 5 (Windows)

Das Paket `MetaTrader5` läuft nur unter Windows und braucht ein installiertes MetaTrader 5. Die Anwenderanleitung dazu schreibt Auftrag 05; hier die technischen Schritte.

1. uv installieren (https://docs.astral.sh/uv/); es lädt bei Bedarf Python 3.14.
2. Das Verzeichnis `components/pipwerk-fetch-mt5` des Repositorys auf den Rechner legen.
3. `scripts\install.cmd` ausführen. Es installiert die Laufzeitabhängigkeiten nach `uv.lock` (mit `MetaTrader5`, ohne Entwicklungswerkzeuge) in `.venv` unter der Komponente und verändert Python des Systems nicht.
4. `pipwerk-fetch-mt5.example.ini` als `pipwerk-fetch-mt5.ini` nach `%USERPROFILE%\pipwerk\etc` kopieren, `shared_key` und `server_time_zone` ausfüllen, `host` und `allowed_hosts` für den Zugriff von pipwerk replay einstellen. Die Datei so schützen, dass nur der Benutzer des Programms sie lesen kann. Denselben Schlüssel trägt pipwerk replay in seine Startkonfiguration ein.
5. MetaTrader 5 starten und am Konto anmelden. Der Algo-Handel muss nicht eingeschaltet sein; das Programm handelt nie.
6. `scripts\start.cmd` starten (Parameter gehen an das Programm, zum Beispiel `-c <PATH>`). Das Arbeitsverzeichnis bleibt das des Aufrufs. Das Programm lauscht an `host:port` der Datei; Beenden mit Strg+C. Ein dauerhafter Start (Aufgabenplanung) ist Sache des Betreibers.
7. Prüfen: `GET /api/v1/health` mit dem Schlüssel muss `ok` liefern.

Das Programm gehört in das vom Betreiber kontrollierte Netz (req-system-011). Es spricht kein TLS; wer es über ein anderes Netz erreichbar macht, schützt es selbst (Abschnitt 9).

Auf Linux lässt sich alles bis auf den Zugriff auf MetaTrader 5 installieren und starten: `uv --directory components/pipwerk-fetch-mt5 sync --frozen` und `… run pipwerk-fetch-mt5 -c <Datei>`. Das Paket `MetaTrader5` kommt dabei nicht auf den Rechner (Abschnitt 10).

## 8. Nachgebildete Quelle für Tests

`pipwerk_fetch_mt5.fake_source` ist das echte Programm mit einem nachgebildeten MetaTrader 5 darunter: dieselbe HTTP-Schnittstelle, dieselben Prüfungen des Schlüssels, des Kopfs `Host` und der Größe, dieselben Fehler, dieselben Dateien. pipwerk replay (Auftrag 04) kann sie für seine Tests verwenden. Die Beschreibung der Verwendung steht auch in `components/pipwerk-fetch-mt5/README.md`.

- `create_fake_source_app(shared_key=FAKE_SHARED_KEY, *, gateway=None, time_zone="UTC", max_rows=50000, broker_name=None, symbols=None, allowed_hosts=("testserver", "*ip"), clock=None)` liefert die ASGI-Anwendung, für `fastapi.testclient.TestClient` oder `httpx` mit ASGI-Transport (ohne Netz und Port). `FAKE_SHARED_KEY` ist ein Testwert und kein Geheimnis. Der Testclient sendet `Host: testserver`; die Voreinstellung erlaubt das.
- `python -m pipwerk_fetch_mt5.fake_source --port 8766 [--host …] [--key …] [--time-zone …] [--max-rows …]` startet dieselbe Anwendung als Programm, für Tests, die eine echte Verbindung brauchen.
- Die Daten sind fest und deterministisch (keine Uhr, keine Zufallszahlen; die Antwort ist auf jedem Rechner dieselbe). Instrumente `EURUSD`, `GBPUSD`, `USDJPY`; jede andere Bezeichnung ergibt `symbol_unknown`. Kerzen aller 21 Zeiteinheiten, ausgerichtet wie die echten (Minuten, Stunden und Tage am Servertag, Wochen am Sonntag, Monate am Ersten); Tageskerzen Montag bis Freitag; keine Kerze und kein Tick von Freitag 22:00 bis Sonntag 22:00 Serverzeit. Kerzen verschiedener Zeiteinheiten passen nicht zueinander (eine H1-Kerze ist nicht die Summe ihrer M1-Kerzen). Ticks etwa alle 1,5 Sekunden mit Millisekunden. Handelszeiten Sonntag 22:00 bis Freitag 22:00 in den Dateien, solange die Zeitzone der Quelle keine Sommerzeit hat (Voreinstellung `UTC`). Margin: `EURUSD` wird vom „Terminal“ berechnet (1100), `GBPUSD` nennt 1300 selbst, `USDJPY` hat keine (`null`).
- Fehler auf Wunsch: Ein `FakeGateway` (Parameter `gateway`) mit `available = False` antwortet überall `terminal_unavailable`; `fail(symbol, code, kinds)` lässt das Lesen von `candles`, `ticks` oder `instrument` (Angaben) für dieses Symbol mit `broker_error`, `no_data` oder `terminal_unavailable` scheitern; `clear_failures()` hebt das auf. `symbol_unknown` ergibt eine unbekannte Bezeichnung, `range_too_large` ein kleines `max_rows`, `unauthorized` ein falscher Schlüssel, `invalid_request` eine ungültige Anfrage, `host_not_allowed` ein anderer Kopf `Host`.

## 9. Sicherheit

Grundlage: Spezifikation 5.4 und 11, `development-test-security-rules.md` Abschnitt 8, OWASP API Security Top 10.

- **Schlüssel (API2).** Ohne den richtigen Schlüssel antwortet das Programm auf jedem Pfad und mit jeder Methode, auch bei unbekannten Pfaden, ungültigem Inhalt oder zu großer Anfrage, immer gleich mit 401 `unauthorized`; es sagt nichts über Instrumente, Pfade oder den Grund. Fehlender, falscher, doppelter Kopf, anderes Schema, Schlüssel in der Adresse oder im Inhalt: alles dasselbe. Der Vergleich geschieht in konstanter Zeit: `hmac.compare_digest` über die SHA-256-Werte beider Schlüssel (gleiche Länge, unabhängig von der Länge des Schlüssels). Die Prüfung läuft vor dem Lesen des Inhalts und vor dem Routing.
- **Der Schlüssel erscheint nirgends**: nicht in Antworten, Protokollen, Fehlermeldungen oder der Ausgabe beim Start; ein Test durchsucht Antworten, Köpfe, Protokoll und Ausgabe nach ihm. Ausnahmetexte werden nicht ausgegeben (die Protokolle nennen den Namen der Ausnahmeklasse oder den Code von MetaTrader 5). Kennwort und Anmeldung für MetaTrader 5 stehen nur in der Startkonfiguration und werden nicht protokolliert.
- **Kopf `Host` (API8).** Wie in pipwerk Studio (Abschnitt 2.10 dort), als kleine eigene Kopie, weil die Komponente allein auf einem anderen Rechner läuft: Der Name im Kopf muss in der Liste stehen (Voreinstellung `127.0.0.1`, `localhost`, `::1`, dazu `allowed_hosts` und die eingestellte Adresse), sonst 400 `host_not_allowed`. Die Prüfung ist die äußerste und läuft vor der des Schlüssels.
- **Größe (API4).** Die Anfrage ist auf 8 KiB begrenzt (413), geprüft vor dem Lesen, auch bei falschem `Content-Length`. Die Antwort ist auf `max_rows_per_request` Zeilen begrenzt; es gibt nie mehr als 100 benannte ausgelassene Zeilen. Eine Anfrage nach einem zu großen Zeitraum wird abgewiesen, bevor MetaTrader 5 etwas liest.
- **Eingaben.** Pydantic lehnt zusätzliche Felder ab und wandelt nichts stillschweigend um (keine Zahl als Zeitpunkt, kein Zeitpunkt ohne Zeitzone). Bezeichnungen sind auf 128 Zeichen ohne Steuerzeichen begrenzt. Die Bezeichnung geht nur als Symbol an MetaTrader 5 und wird nie als Befehl, Pfad oder Abfrage verwendet.
- **Nur lesen.** Das Programm ruft keine Funktion des Pakets auf, die handelt (`order_send` und andere). Es berechnet die Margin mit `order_calc_margin`, das nichts auslöst.
- **Netz (req-system-011).** Voreinstellung ist `127.0.0.1`. Es gibt kein TLS und keine Begrenzung der Fehlversuche beim Schlüssel; der Schlüssel muss lang und zufällig sein (Beispiel in der INI), und das Programm gehört in das vom Betreiber kontrollierte Netz. Wer von außerhalb erreichbar macht, setzt einen Vorsatz mit TLS und Zugangsbeschränkung davor. Rest-Risiko: Wer den Schlüssel und einen erlaubten Namen hat, kann Kursdaten und Angaben des Kontos lesen, die MetaTrader 5 liefert (Instrumente, Kurse); Angaben über das Konto selbst liefert das Programm nicht.
- **Abhängigkeiten.** Siehe Abschnitt 10.

## 10. Abhängigkeiten

Alle direkten und indirekten Abhängigkeiten stehen in `uv.lock` (erzeugt mit uv 0.5.9; das Format der Datei unterscheidet sich von dem der Lockdatei von pipwerk Studio, die ein neueres uv schrieb). Laufzeit: `fastapi`, `uvicorn`, `tzdata`. `tzdata` ist nötig, weil Windows keine Zeitzonendatenbank hat, aus der `zoneinfo` lesen könnte. Pydantic kommt mit FastAPI. Optional, nur Windows: `MetaTrader5` (Extra `mt5`, Markierung `sys_platform == 'win32'`), das `numpy` mitbringt. Entwicklung: `pytest`, `httpx2`, `ruff`, `mypy`, `jsonschema` und `types-jsonschema` (prüft die Dateien gegen die Schemata des Imports).

Installation und Tests auf Linux brauchen `MetaTrader5` nicht: Es ist nur über das Extra erreichbar, und die Tests ersetzen das Paket durch eine Nachbildung des Moduls (`tests/support.py`, `FakeMt5Module`). Ein Test sichert zu, dass kein Modul des Programms das Paket beim Import lädt.

Neue Abhängigkeiten gegenüber pipwerk Studio sind nur `tzdata`, `MetaTrader5` mit `numpy`, `jsonschema` mit seinen Paketen. Geprüft ist am 2026-10-21 nur, dass sich die Auflösung durchführen lässt und `MetaTrader5` 5.0.6231 ein Rad für Python 3.14 unter Windows hat (`cp314-win_amd64`). Lizenz, Wartungszustand und Sicherheitsmeldungen von `MetaTrader5`, `tzdata`, `jsonschema` und der neuen Pakete sind nicht geprüft (kein Zugriff auf das Paketverzeichnis im Netz im Auftrag; offener Punkt 7). `pip-audit` lief nicht.

## 11. Prüfungen

Im Verzeichnis `components/pipwerk-fetch-mt5` (Linux, ohne das Paket `MetaTrader5`):

```
uv sync --frozen
uv run --frozen pytest
uv run --frozen ruff check
uv run --frozen ruff format --check
uv run --frozen mypy
```

Das Prüfskript der Tester für diese Komponente ist nicht Teil des Auftrags. Ein Test gegen ein echtes MetaTrader 5 gibt es nicht; ihn macht der Auftraggeber in der Abnahme.

Die Tests (pytest, 350 Fälle; vier davon prüfen die Dateien gegen `contracts/market-data/v1/` und werden übersprungen, solange das Verzeichnis im Arbeitsverzeichnis fehlt):

| Datei | Inhalt |
| --- | --- |
| `test_config.py` | jeder Eintrag, Pflichtangaben, ungültige Werte, unbekannte Einträge, Suchorte und Reihenfolge (POSIX und Windows), kein Wert in Fehlermeldungen |
| `test_timeconv.py` | Winter- und Sommerzeit, fehlende und doppelte Ortszeit am Wechsel (Europe/Athens, 2026), Millisekunden |
| `test_service.py` | jede Art, Zeitzone mit Sommerzeitwechsel im Frühjahr und im Herbst (auch bei Beginn mitten in der doppelten Stunde), Grenzen, Aufteilung in Abrufe ohne Lücke und Überlappung, ausgelassene Zeilen, Zuordnungstabelle, Handelszeiten, `period`, Pip und Spread, Margin, jeder Fehlergrund des Dienstes |
| `test_mt5_gateway.py` | Übersetzung zum Paket gegen eine Nachbildung des Moduls: Verbindung, Wiederverbindung, Fehlercodes, Zeiten als Serverzeit, Ende ausgeschlossen, Tickflags, Margin; kein Import des Pakets beim Laden |
| `test_api.py` | jede Art über HTTP, jede Fehlerkennung mit Status und Text, Prüfung der Anfrage, keine Wiederholung von Eingaben, unbekannte Pfade |
| `test_security.py` | Schlüssel fehlt, falsch, richtig und alle Abwandlungen; Antwort ohne Schlüssel immer gleich; Vergleich in konstanter Zeit; Schlüssel in keiner Ausgabe; Kopf `Host`; Größe der Anfrage |
| `test_fake_source.py` | Festigkeit der Daten, jede Zeiteinheit und ihre Ausrichtung, Wochenende, Handelszeiten, Fehler auf Wunsch, Betrieb als Programm auf einem Port |
| `test_contract.py` | Beschreibung gleich dem Programm, Beispiele gleich den Antworten, Dateien gegen die Schemata des Imports |
| `test_cli.py` | `-c`, Suchorte, Start mit Adresse und Port der Datei, Abbruch ohne gültige Datei, das echte Programm als Prozess |
| `test_repository.py` | Beispiel der INI, `MetaTrader5` nur als Extra für Windows, Startskripte, keine Schlüssel und keine Angaben des Entwicklungsrechners in den Dateien |

## 12. Entscheidungen

Fest gelegt vom Entwickler, soweit die Spezifikation es offenlässt:

1. Aufbau flach, ohne Unterverzeichnis `backend/` (Abschnitt 2).
2. Die Dateien sind genau die des Imports (`contracts/market-data/v1/`, Stand des Auftrags 02, gelesen vom Zweig `backtest/wp02-02`). Die Antwort ist eine Hülle: `file` plus `omitted`. Grund: Hinweise auf ausgelassene Zeilen haben in der Datei keinen Platz, weil das Schema zusätzliche Felder ablehnt.
3. Anfrage: ein Endpunkt `POST /api/v1/fetch` mit `kind` `candles`, `ticks`, `instrument`; Zeiteinheiten klein geschrieben wie im Schema (`time_unit`).
4. Fehler als Kennung und fester deutscher Text; Text wie in Spezifikation 5.4.
5. Begrenzungen: Anfrage 8 KiB, Antwort 50000 Zeilen (einstellbar bis 1000000), Schritte von 10000 Kerzen und 6 Stunden, 100 benannte ausgelassene Zeilen.
6. Schlüssel: 16 bis 256 druckbare ASCII-Zeichen; `Authorization: Bearer`.
7. `volume` einer Kerze ist das Tickvolumen.
8. `pip` und `spread` wie in Abschnitt 6.1; Margin vom Terminal berechnet.
9. Eigene Kopien von `host_check.py` und `body_limit.py` statt einer Abhängigkeit von pipwerk Studio.
10. Die Zeitzone ist Pflicht; ohne sie startet das Programm nicht. Es gibt keine Voreinstellung, weil eine falsche Zeitzone die Daten still verschiebt.

## 13. Offene Punkte

1. **Doppelte Stunde.** Nach der Regel „doppelte Ortszeit gilt als die frühere“ fehlt die zweite Stunde beim Zurückstellen der Uhr (einmal im Jahr, Abschnitt 5). Genauer wäre, die zweite Stunde an der Reihenfolge zu erkennen und als die spätere zu rechnen. Das ist eine Änderung der Festlegung in 5.1; sie braucht eine Entscheidung.
2. **Handelszeiten** liefert das Paket nicht (Abschnitt 6.3). Die Ersatzregel des Datenbestands (Wochenende Freitag 22:00 bis Sonntag 22:00 UTC) gilt dann; bei Brokern mit anderer Schließzeit entstehen Lücken, die keine sind (`pipwerk-marketdata.md`, Grenzen der Ersatzregel).
3. **Fehlende Angaben im Schema.** Das Schema der Angaben zum Instrument hat keine Felder für die Art des Swaps (`swap_mode`: Punkte, Währung, Prozent, …) und für die Währung der Margin. Die Werte `swap_long` und `swap_short` sind deshalb in der Einheit des Brokers und ohne ihre Art nicht sicher zu deuten. Das Programm kennt beide Angaben (`SymbolInfo`) und liefert sie nicht.
4. **Leere Antwort.** Ein Zeitraum ohne Zeile ist `no_data`. Das Schema erlaubt eine leere Reihe mit `period`; dann würde zum Beispiel ein Feiertag nicht als fehlend gelten. Wegen Spezifikation 5.4 (Fehler „Daten beim Broker nicht vorhanden“) ist es ein Fehler; die Entscheidung gehört zu pipwerk replay.
5. **Serverzeit des Pakets.** Dass das Paket die Serverzeit als Sekunden „wie UTC“ liefert und annimmt (Abschnitt 5), ist aus der Dokumentation und dem bekannten Verhalten abgeleitet, nicht an einem echten MetaTrader 5 geprüft. Ebenso die Fehlercodes (Abschnitt 6.4) und `swap_rollover3days` (0 ist Sonntag). Prüfung in der Abnahme: eine Kerze M1 mit bekannter Serverzeit anfragen.
6. **`contracts/market-data/v1/`** gehört zu Auftrag 02 und ist in diesem Zweig nicht enthalten. Die vier Tests dagegen laufen erst nach dem Zusammenführen; der Entwickler hat sie mit den Schemata vom Zweig `backtest/wp02-02` ausgeführt (alle bestanden). Die Hülle der Antwort (Punkt 2 der Entscheidungen) bleibt abzugleichen.
7. **Abhängigkeiten** (Abschnitt 10): Lizenz und Wartungszustand von `MetaTrader5` sind ungeprüft; ein Aufruf von `pip-audit` steht aus.
8. **Dauerhafter Betrieb** unter Windows (Dienst oder Aufgabenplanung), TLS und eine Begrenzung der Fehlversuche beim Schlüssel sind nicht Teil dieses Stands (Abschnitt 9).
