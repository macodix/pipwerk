# Testbericht Sicherheit – Auftrag 03, Durchlauf 2 (Nachprüfung)

- Bezug: `strategiedesign/wp01`, Prüfauftrag `development/strategiedesign/wp01/tests/03-2-order.md` (Zweig `strategiedesign/wp01`)
- geprüfter Commit: `9e5bd7bd73baf3bc1b5898b36f2b56da0f238762` (Zweig `strategiedesign/wp01-03`). Im eigenen Arbeitsverzeichnis ausgecheckt, mit `git rev-parse HEAD` bestätigt.
- vorher geprüfter Commit: `d91f5f8abc5e9ea4155494505e9cbebb84846d3c` (Bericht `03-securitytest-1.md`, Befunde S1 und S2)
- Prüfgrundlagen: Auftrag `orders/03.md`, Abschnitt „Festlegungen nach Durchlauf 1“ (Punkte 1 bis 6); Bericht `03-securitytest-1.md`; `docs/technical/development-test-security-rules.md`; `docs/technical/pipwerk-studio.md` (Abschnitte 2.2, 2.9, 2.10, 2.11, 4a, 5.2, 6.1, 7, 8, 9); `docs/user/pipwerk-studio.md`; BSI-Grundschutz (CON.8, APP.7); OWASP ASVS; OWASP API Security Top 10
- Umfang: Nachprüfung nach „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: die blockierenden Befunde S1 und S2, die Punkte der Festlegungen und die dafür geänderten Stellen (`git diff d91f5f8 9e5bd7b`, 17 Dateien). Nur blockierende Befunde verhindern das Bestehen.

## Ergebnis: bestanden

S1 und S2 sind behoben. Es gibt keinen neuen blockierenden Befund. Dazu kommen die Hinweise H6 und H7. Die Hinweise H1 bis H5 aus Durchlauf 1 bleiben nach Punkt 6 der Festlegungen Hinweise.

## Durchgeführte Prüfungen und Nachweise

| Prüfung | Ergebnis |
| --- | --- |
| Prüfskript `components/pipwerk-studio/scripts/check --with-audit` (Stand des geprüften Commits), freie Ports | Backend: `uv sync --frozen`, pytest (647 bestanden), `ruff check`, `ruff format --check`, mypy (48 Quelldateien) bestanden. Suche nach der Schreibweise des Namens bestanden (453 Stellen). `pip-audit`: „No known vulnerabilities found“, bestanden. Oberfläche: `npm ci`, Typprüfung, Vitest (244), Bau bestanden. Browsertest: 39 bestanden. `npm audit` gescheitert, unverändert Hinweis H1 (`source-map-js` 1.2.1, GHSA-68fv-2mgg-jv7q). Gesamter Exitcode 1, nur wegen `npm audit`. |
| `pip-audit` der Bibliothek `packages/domain-core` | Nicht ausgeführt: Der Aufruf von `uvx pip-audit` für die Lockdatei der Bibliothek wurde in dieser Prüfumgebung nicht zugelassen. Die Bibliothek ist in diesem Commit nicht geändert (`git diff --stat` ohne Dateien unter `packages/`). Ihre Laufzeitabhängigkeit `pydantic` 2.13.5 mit `pydantic-core` 2.46.5 steht in der Liste des Backends und wurde dort ohne Befund geprüft. Siehe H7. |
| S1: Kopf `Host`, rohe HTTP-Anfragen an ein selbst gestartetes Backend (`pipwerk-studio -c <INI> --host 127.0.0.1 --port <frei>`) | Voreinstellung: erlaubt (200) sind `127.0.0.1`, `127.0.0.1:<Port>`, `127.0.0.1.`, `localhost:<Port>`, `LOCALHOST:<Port>`, `localhost.:<Port>`, `[::1]`, `[::1]:<Port>`, `[0:0:0:0:0:0:0:1]`. Abgewiesen mit 400 und festem Text `{"detail":"The Host header of the request is not allowed."}`: `rebind.example`, `rebind.example:<Port>`, `REBIND.EXAMPLE.`, `localhost.rebind.example`, `127.0.0.1.nip.io`, `localhost..`, `localhost:abc`, `localhost:`, `localhost:123456`, `user@localhost`, `localhost@rebind.example`, `localhost,rebind.example`, `localhost rebind.example`, leerer Kopf, `::1` ohne Klammern, `[::1`, `[::1]x`, `[::1]:`, `[::ffff:127.0.0.1]`, `0x7f000001`, `2130706433`, `10.1.2.3`, Nicht-ASCII-Byte, fehlender Kopf bei HTTP/1.0. Fehlender Kopf bei HTTP/1.1 und doppelter Kopf (gleich oder verschieden): 400 von uvicorn/h11 („Invalid HTTP request received.“), die Anwendung wird nicht erreicht (siehe H6). Der fremde Name im Kopf wird in der Antwort nicht wiederholt. |
| S1: alle Pfade und Methoden mit fremdem `Host` | `POST /api/v1/strategies`, `PUT /api/studio/settings/object-directory`, `PUT /api/studio/settings/language`, `GET /docs`, `GET /openapi.json`, `OPTIONS /api/v1/strategies`, unbekannter Pfad: jeweils 400. `POST` mit `Content-Length` 3 MiB: 400 vor der Begrenzung des Bodys (nicht 413). WebSocket-Upgrade: 400. `X-Forwarded-Host: localhost` und `Forwarded: host=localhost` bei fremdem `Host`: 400, die Köpfe werden nicht ausgewertet. Anfrage in absoluter Form `GET http://127.0.0.1/… ` mit `Host: rebind.example`: 400. Code: `HostCheckMiddleware` wird in `app.py` als letzte Middleware hinzugefügt und ist damit die äußerste Anwendungs-Middleware; sie liest genau einen Kopf `host`. |
| S1: Eintrag `*ip` (`--allowed-host '*ip'`) | Jede gültige IP-Adresse erlaubt (`10.1.2.3`, `192.0.2.7`, `[::ffff:127.0.0.1]`: 200). Jeder Name bleibt abgewiesen (`rebind.example`, `127.0.0.1.nip.io`, `localhost.rebind.example`: 400). Nicht kanonische IPv4-Schreibweisen (`0x7f000001`, `2130706433`) gelten nicht als IP-Adresse und werden abgewiesen. Bewertung: DNS-Rebinding setzt einen Namen im Kopf `Host` voraus. Eine Seite, deren Ursprung eine IP-Adresse ist, erreicht im Browser nur diese Adresse und nicht das Backend. `*ip` öffnet deshalb keinen Weg für DNS-Rebinding. Das Risiko durch Teilnehmer des Netzes bei `--host 0.0.0.0` und `--host ::` bleibt und ist in Abschnitt 2.10 und 8 der technischen Dokumentation genannt. `testenv` setzt `*ip` nur bei genau `0.0.0.0` und `::` (Zeilen 302–306). |
| S1: weitere erlaubte Namen | `--allowed-host Studio.Example.` erlaubt `Host: Studio.Example` (Groß- und Kleinschreibung und abschließender Punkt vereinheitlicht). `--allowed-host '[2001:DB8::1]'` erlaubt `Host: [2001:db8:0::1]` (verkürzte Form verglichen). Die Voreinstellung bleibt dabei erhalten; `10.1.2.3` bleibt abgewiesen. |
| S1: ungültige Einträge | `--allowed-host` mit `evil example`, `a/b`, `*`, `*.example`, leerem Wert, `[::1`, `1:2`: Exitcode 1, Meldung „invalid value of --allowed-host: An allowed host must be a name or an IP address.“, der Wert wird nicht ausgegeben. Startkonfiguration mit `[server] allowed_hosts = good.example, bad host`: Exitcode 1, Meldung nennt den Pfad der INI-Datei und den Abschnitt, nicht den Eintrag. Kein Platzhalter für Namen möglich. |
| S1: Weg über den Proxy der Oberfläche (`testenv start --host 127.0.0.2` auf freien Ports) | Über den Port der Oberfläche mit ihrem eigenen Kopf `Host`: `/api/health` 200, `GET /api/v1/element-types` 200, `GET /api/v1/strategies` 200. `Host: localhost:<Port>` und `127.0.0.1:<Port>`: 200. `Host: rebind.example`: 403 von `vite preview`. Direkt am Port des Backends: `POST /api/v1/strategies` und `GET /api/v1/strategies` mit `Host: rebind.example:<Port>`: 400; `Host: 127.0.0.2:<Port>` (Wert von `--host`): 200. Danach `testenv stop`; die Ports sind wieder frei (`ss -ltn`). |
| S1: Dokumentation | Abschnitt 2.10 beschreibt Maßnahme, Liste, Voreinstellung, `*ip`, Weg über den Proxy und die Grenze der Maßnahme. Maßnahme (4) in Abschnitt 8 sagt nicht mehr, eine fremde Webseite könne nicht schreiben; sie verweist auf Maßnahme (7) gegen DNS-Rebinding. Abschnitt 2.2, 4a, 5.2 (Tabelle, Zeile 400), `pipwerk-studio.example.ini` und die Anwenderdokumentation („Rufen Sie den Hintergrunddienst mit der Adresse `127.0.0.1` oder `localhost` auf“) stimmen mit dem gemessenen Verhalten überein, bis auf H6. |
| S2: ausgelieferte Seite `/docs` (Testclient, `Host 127.0.0.1`) | Genau zwei fremde Ressourcen: `https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.33.1/swagger-ui.css` und `…/swagger-ui-bundle.js`, beide mit `integrity="sha384-…"` und `crossorigin="anonymous"`. Symbol `data:,`. Das einzige eingebettete Skript enthält keine Adresse außer `/openapi.json`, Einstellungen `layout: "BaseLayout"`. `/redoc` 404, `/docs/oauth2-redirect` 404. |
| S2: Prüfsummen gegen die veröffentlichten Dateien | `npm pack swagger-ui-dist@5.33.1` aus der npm-Paketquelle, SHA-384 (Base64) der Dateien im Archiv selbst berechnet: `swagger-ui-bundle.js` 1 586 002 Bytes, `sha384-ZPehFMQommnnuaZ4rpxgkgTT2DKFVp4hZC/7pLit+9Lek9T1YGSo23eHFbvNkXkw`; `swagger-ui.css` 186 154 Bytes, `sha384-Ov4/wv3j2bmct8cDc5X4ngJZohVPzEmc6uDPH8WeljUxO5vtoykvMEfbu9Vh6RaW`. Beide gleich den Konstanten in `docs_page.py` Zeilen 33–36 und den Angaben in Abschnitt 2.11 (auch die Größen). `package.json` im Archiv nennt Version 5.33.1. Der Vergleich mit den Dateien von `cdn.jsdelivr.net` selbst wurde nicht ausgeführt: Der Abruf vom CDN wurde in dieser Prüfumgebung nicht zugelassen. Weicht die Datei des CDN ab, verwirft der Browser sie wegen `integrity`; `/docs` bliebe dann leer, fremder Code würde nicht ausgeführt. |
| S2: keine weitere fremde Ressource zur Laufzeit | Stylesheet: 24 Einträge `url(…)`, alle `data:`-Adressen, kein `@import`, als Adresse nur der SVG-Namensraum `http://www.w3.org/2000/svg`. Skript: Das Abzeichen des Validators (`OnlineValidatorBadge`, lädt sonst ein Bild von `validator.swagger.io` mit der Adresse der Beschreibung) wird nur in `StandaloneLayout` der Datei `swagger-ui-standalone-preset.js` verwendet. Diese Datei wird nicht geladen, die Seite nutzt `BaseLayout`. Weitere Adressen im Skript sind Verweise in Texten und Lizenzen, keine geladenen Ressourcen. Die Darstellung im Browser habe ich nicht geprüft. |
| S2: Dokumentation | Abschnitt 2.11 nennt Herkunft, Version, Adressen, Prüfsummen, Verfahren der Berechnung, Risiko und Grenze. Abschnitt 8 Maßnahme (8), Abschnitt 4a und die Anwenderdokumentation („Web-API ausprobieren“) nennen, dass `/docs` Swagger UI aus dem Internet lädt und ohne Zugang leer bleibt. `tests/test_docs_page.py` prüft feste Version, `integrity`, `crossorigin`, keine weitere fremde Adresse, kein `/redoc` und die Nennung in der Dokumentation. |
| Punkt 2: ungültig gespeichertes Objektverzeichnis | `web_api.py` Zeilen 467–471: Antwort 503 mit festem Text `STORED_OBJECT_DIRECTORY_INVALID_TEXT`, ohne Pfad und ohne Ausnahmetext. Der Ausnahmetext geht nur in das Protokoll. Tests in `tests/test_web_api_invalid_directory.py` laufen im Prüfskript mit (647 bestanden). |
| Geänderter Code: Geheimnisse, feste Pfade, gefährliche Aufrufe | Suche im Diff nach Zugangsdaten, Rechnerpfaden, `eval`, `exec`, `shell=True`, `pickle`, `yaml.load`: keine Treffer. Beispielwerte nur aus Dokumentationsbereichen (`studio.example`, `192.0.2.7`). `testenv` übergibt `--allowed-host` über `set --` als eigene Argumente, ohne Auswertung durch die Shell; der Wert von `--host` ist vorher auf Buchstaben, Ziffern und `.:_-` geprüft (Zeile 219). `pyproject.toml`: Ausnahme `S104` nur für `tests/**`. |

Die Prüfprogramme lagen nur vorübergehend in einem eigenen Verzeichnis außerhalb des Arbeitsverzeichnisses und sind gelöscht. Am geprüften Commit wurde nichts geändert (`git status --short` leer).

## Kontrolle vorheriger Befunde

### S1 (blockierend in Durchlauf 1): DNS-Rebinding – behoben

Eine Anfrage mit fremdem Namen im Kopf `Host` wird auf jedem Pfad mit 400 abgewiesen, bevor die Anwendung sie verarbeitet. Das gilt auch für schreibende Anfragen und für `PUT /api/studio/settings/object-directory`. Der in Durchlauf 1 gezeigte Angriff (`POST` 201 und `DELETE` 204 mit `Host: rebind.example:<Port>`) ergibt jetzt 400. Der Weg über den Proxy der Oberfläche arbeitet weiter. Die falsche Aussage in Maßnahme (4) ist entfernt. Nachweise siehe Tabelle.

### S2 (blockierend in Durchlauf 1): `/docs` ohne feste Version und Integritätsprüfung – behoben

`/docs` lädt Swagger UI in der festen Version 5.33.1 mit `integrity` und `crossorigin="anonymous"` und sonst keine fremde Ressource. Die Prüfsummen sind gleich den selbst berechneten Werten aus dem npm-Archiv. Der Vergleich mit den Dateien des CDN fehlt (siehe Tabelle); er ändert die Sicherheitsbewertung nicht, weil der Browser eine abweichende Datei verwirft.

### Hinweise H1 bis H5 aus Durchlauf 1

Nach Punkt 6 der Festlegungen bleiben sie Hinweise. H1 (`npm audit`) besteht unverändert. H2, H3, H4 und H5 betreffen nicht geänderte Stellen und sind nicht erneut geprüft.

## Neue Hinweise (nicht blockierend)

### H6: Fehlender und doppelter Kopf `Host` bei HTTP/1.1 ergeben nicht den dokumentierten festen Text

- Fundstelle: `docs/technical/pipwerk-studio.md` Abschnitt 2.10, erster Punkt („Ein fehlender, mehrfacher … Kopf … wird ebenso abgewiesen“ mit dem festen Text) und Abschnitt 5.2, Tabelle, Zeile 400.
- Sachverhalt: Bei HTTP/1.1 ohne Kopf `Host` und mit zwei Köpfen `Host` antwortet uvicorn/h11 selbst mit 400 und dem Text „Invalid HTTP request received.“. Die Anwendung erhält die Anfrage nicht; der feste JSON-Text erscheint nur bei HTTP/1.0 ohne Kopf. Die Anfrage wird in beiden Fällen abgewiesen. Ein Risiko besteht nicht; nur Antworttext und Medientyp weichen von der Beschreibung ab.

### H7: Abschnitt 6.1 beschreibt einen Schritt, den das Prüfskript dieses Commits nicht enthält

- Fundstelle: `docs/technical/pipwerk-studio.md` Zeile 564 („Das Prüfskript übergibt den Schalter `--no-emit-package pipwerk-domain` … die Bibliothek prüft ein eigener Schritt mit der Lockdatei der Bibliothek“); `components/pipwerk-studio/scripts/check` Zeilen 164–170 im geprüften Commit.
- Sachverhalt: Das Prüfskript im geprüften Commit ruft `uv export --frozen --no-hashes --no-emit-project` ohne `--no-emit-package` auf und hat keinen Schritt für die Lockdatei der Bibliothek. Die Beschreibung passt zum Prüfskript auf dem Zweig `strategiedesign/wp01-functiontest` (dort Zeile 226). Folge für die Sicherheit: Die Entwicklungsabhängigkeiten der Bibliothek (zum Beispiel `jsonschema`, `referencing`, `rpds-py`, `attrs`) prüft das Prüfskript dieses Commits nicht mit `pip-audit`. Ich konnte diese Prüfung hier nicht selbst ausführen (siehe Tabelle). Die Laufzeitabhängigkeit der Bibliothek ist über die Liste des Backends geprüft. Das Prüfskript hält der Tester Funktion; nach dem Neuaufsetzen seines Zweigs auf den geprüften Commit stimmt die Beschreibung voraussichtlich. Das ist nicht geprüft.

## Nicht ausgeführte Prüfungen

- Abruf von `swagger-ui-bundle.js` und `swagger-ui.css` von `cdn.jsdelivr.net` zum Vergleich mit dem npm-Archiv: in dieser Prüfumgebung nicht zugelassen.
- `pip-audit` für die Lockdatei von `packages/domain-core`: in dieser Prüfumgebung nicht zugelassen.
- Darstellung von `/docs` im Browser.
- Testumgebung mit `--host 0.0.0.0` oder `--host ::`: nicht gestartet, um das Backend nicht in das Netz des Prüfrechners zu öffnen. `*ip` ist direkt am Backend geprüft, die Übergabe durch `testenv` im Code (Zeilen 302–306).

Keine dieser Lücken betrifft einen blockierenden Befund: S1 ist vollständig am Backend und über den Proxy nachgewiesen, S2 an der ausgelieferten Seite und am npm-Archiv.

## Geprüfter Commit

`9e5bd7bd73baf3bc1b5898b36f2b56da0f238762`
