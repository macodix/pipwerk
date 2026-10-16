# Testbericht Sicherheit – Auftrag 03, Durchlauf 1

- Bezug: `strategiedesign/wp01`, Prüfauftrag `development/strategiedesign/wp01/tests/03-1-order.md` (Zweig `strategiedesign/wp01`)
- geprüfter Commit: `d91f5f8abc5e9ea4155494505e9cbebb84846d3c` (Zweig `strategiedesign/wp01-03`, aufgesetzt auf `0ee7723df13d1dd286c55b8f321361e6919e73e3`). Im eigenen Arbeitsverzeichnis ausgecheckt, mit `git rev-parse HEAD` bestätigt.
- Prüfgrundlagen: Auftrag `orders/03.md`; Spezifikation Abschnitte 2, 3.6, 3.7, 4.1, 4.2, 7, 8, 9; Plan `wp01`; `docs/technical/development-test-security-rules.md` (Abschnitte 5, 8, 9); `docs/technical/pipwerk-studio.md`; `docs/technical/pipwerk-domain.md`; `docs/user/pipwerk-studio.md`; BSI-Grundschutz (CON.8, APP.7, OPS.1.1.6); OWASP ASVS; OWASP API Security Top 10
- Umfang: erster Durchlauf, vollständig nach `docs/technical/entwicklungsverfahren.md`, Abschnitt „Umfang der Prüfungen“

## Ergebnis: nicht bestanden

Zwei blockierende Befunde:

- S1: Webseiten eines anderen Ursprungs können über DNS-Rebinding schreiben. Die technische Dokumentation sagt das Gegenteil.
- S2: `/docs` lädt fremden Code ohne feste Version und ohne Integritätsprüfung.

Dazu die Hinweise H1 bis H5. Sie verhindern das Bestehen nicht.

## Durchgeführte Prüfungen und Nachweise

| Prüfung | Ergebnis |
| --- | --- |
| Prüfskript `components/pipwerk-studio/scripts/check --with-audit` (Stand des geprüften Commits), freie Ports | Backend: `uv sync --frozen`, pytest (532 bestanden), `ruff check`, `ruff format --check`, mypy bestanden. Suche nach der Schreibweise des Namens bestanden (447 Stellen). `pip-audit` bestanden. Oberfläche: `npm ci`, Typprüfung, Vitest, Bau bestanden. Browsertest: 39 bestanden, 6 übersprungen. `npm audit` gescheitert (siehe H1). |
| `pip-audit` | „No known vulnerabilities found“ für alle festgeschriebenen Pakete, darunter `pydantic` 2.13.5 und `pydantic-core` 2.46.5 (Abhängigkeiten der Bibliothek), `fastapi` 0.141.1, `starlette` 1.7.0 und `uvicorn` 0.54.0. Die Zeile `-e ../../../packages/domain-core` aus `uv export --no-emit-project` überspringt pip-audit; das ist kein Fehler. Gemeint ist der offene Punkt des Entwicklers. Die Bibliothek ist eigener Code und steht nicht auf PyPI. Ihre einzige Laufzeitabhängigkeit `pydantic` wird mit geprüft. |
| Lockdatei `components/pipwerk-studio/backend/uv.lock` | `uv lock --check` endet mit Exitcode 0 („Resolved 35 packages“). Die von Hand ergänzte Eintragung stimmt also mit der Auflösung durch uv überein. `pipwerk-domain` 0.1.0 steht mit `source = { editable = "../../../packages/domain-core" }` und Abhängigkeit `pydantic` (`==2.13.5`) darin. `uv sync --frozen` installiert genau diese Fassung. Keine unerwarteten neuen transitiven Abhängigkeiten. |
| Begrenzung des Bodys (Testumgebung, rohe HTTP-Anfragen) | `Content-Length` über 2 MiB: 413 ohne Lesen. Chunked mit 2,5 MiB: 413. Endloser chunked-Strom: 413 nach Überschreiten der Grenze. Body mit genau 2 097 152 Bytes: wird gelesen (422 wegen Schema). Ein Byte mehr: 413. Falsches `Content-Length` (10 angegeben, 3 MiB gesendet): uvicorn/h11 bricht mit 400 ab, die Anwendung erhält nur 10 Bytes. Nicht numerisches `Content-Length`: 400. `PUT` und unbekannter Pfad unter `/api/v1/`: 413. `Content-Encoding: gzip` wird nicht entpackt (422, keine Kompressionsbombe). Code: `body_limit.py` zählt die empfangenen Bytes unabhängig von `Content-Length` und hält höchstens Grenze plus ein Teilstück. |
| Medientyp | ohne `Content-Type`, `text/plain`, `application/x-www-form-urlencoded`, `multipart/form-data`, `application/json-patch+json`, `application/jsonx`: 415 mit festem Text. Angenommen: `application/json` mit `charset`, in Großbuchstaben und mit führendem Leerzeichen. Die drei Medientypen einfacher Browseranfragen sind damit ausgeschlossen. |
| CORS | `OPTIONS` mit fremdem `Origin`: 405 ohne `Access-Control-*`. Keine Antwort setzt `Access-Control-Allow-Origin`. Im Backend gibt es weder `CORSMiddleware` noch `TrustedHostMiddleware` (Suche in `backend/src`). |
| Kopf `Host` | Backend: `Host: rebind.example:<port>` mit `Origin: http://rebind.example:<port>` → `POST /api/v1/strategies` 201, `DELETE` 204. Oberfläche (`vite preview`): fremder `Host` 403. Siehe S1. |
| UUID im Pfad | `abc`, `%2e%2e%2f` und ein Wert mit Nullzeichen ergeben 422 mit Ort `["path","id"]`. `../…` und `..%2F..%2Fetc%2Fpasswd` ergeben 404 (Router). Großbuchstaben, ohne Bindestriche, in `{}` und als `urn:uuid:` werden angenommen und auf die kanonische Form gebracht (siehe H2). Der Dateiname entsteht nur über `object_file_name()` aus der kanonischen UUID. |
| Schema, `extra="forbid"`, strenge Prüfung | zusätzliches Feld: 422 `extra_forbidden`. Zahl statt Text: 422 `string_type`. Kein JSON, `NaN`, doppelter Schlüssel, 200 000-fache Schachtelung, Zahl mit 100 000 Ziffern, BOM, UTF-16, ungültiges UTF-8, einzelnes Surrogat, Array, `null`, leerer Body: jeweils 422 mit festem Text, Ort leer, Typ `value_error` oder `model_attributes_type`. Sehr langer Schlüssel: Ort auf 100 Zeichen gekürzt. 5000 zusätzliche Felder: genau 50 Fehlerorte, Antwort 2560 Bytes. Die Antwortmodelle in `web_api.py` erben `extra="forbid"` von `_Model`; `Saved<Art>` wird mit `extra="forbid"` erzeugt. |
| Art und `format` | gültige Regelvorlage an `/strategies`, Strategie an `/rules`, Regeldokument per `PUT` auf eine Strategie: 422 `format_mismatch`. Abweichende Kennung bei `PUT`: 422 `id_mismatch`. |
| Begrenzungen der Bibliothek | Ausdruck über 4096 Zeichen: 422 `string_too_long`. Schachtelung 70: 422. 201 Regeln, 1001 Elemente, 201 Strategieparameter: 422 `too_long`. Instanzen 18 Ebenen tief: 422. Höchster gemessener Aufwand innerhalb der Grenzen: 730 KB Body mit 200 Ausdrücken voller Namen. `POST /api/v1/check` braucht dafür 1,1 s; die Antwort hat 3,9 MB und ist durch `MAX_NAMES_PER_CHECK` (20 000) begrenzt. Speichern braucht 1,1 s; `usages` und Liste danach je unter 0,1 s. |
| Lesen von Dateien bis 16 MiB, nicht lesbare Dateien | Datei mit 16 MiB + 1 Byte, Datei mit fremder Kennung: in der Liste `unreadable: true`. `GET`, `PUT`, `DELETE` und `usages` ergeben 409 mit festem Text; die Datei bleibt unverändert (Größe geprüft). Symbolische Verknüpfung auf eine Systemdatei und FIFO unter einem Objektnamen: nicht aufgelistet; `GET`, `PUT`, `DELETE` und `usages` ergeben 404; Verknüpfung und FIFO bleiben bestehen, kein Blockieren. Code: `_read_file` liest höchstens `max_bytes + 1` mit `O_NOFOLLOW`. |
| Dateizugriff im Objektverzeichnis | neue Dateien `0600`, Verzeichnis `0700` (plus Setgid-Bit, das vom übergeordneten Verzeichnis stammt). `create` prüft unter der Sperre, dass der neue Name frei ist; `replace` und `delete` prüfen unter der Sperre Lesbarkeit und Existenz. Dateinamen nur aus geprüfter UUID und fester Art. |
| Mitgelieferte Vorlage „Risiko je Trade“ | `GET` 200. `PUT` und `DELETE` unter allen fünf Arten: 403. `POST` einer Kopie ergibt eine neue Kennung. Die Vorlage ist danach unverändert. `create` vergibt nie die Kennung einer mitgelieferten Vorlage. |
| Fehlermeldungen ohne Pfade und Ausnahmetexte | Objektverzeichnis auf eine Datei gesetzt: Liste und `usages` 500 „The object directory of pipwerk Studio cannot be read.“, Anlegen 500 „The object file could not be written or deleted.“. Kein Pfad, kein Ausnahmetext. Fehlerorte nennen nie Werte (`include_input=False`, `include_context=False`). Zufallstest mit 1500 abgewandelten Dokumenten (Testfälle `str-01`, `str-03` und die mitgelieferte Vorlage) gegen `POST /api/v1/check` und `POST /api/v1/<art>`: 2528 × 422, 236 × 200, 236 × 201. Kein 5xx. Jedes gespeicherte Dokument ließ sich wieder lesen. |
| Beschreibung unter `contracts/api/` | enthält keine internen Endpunkte (`/api/studio`, `/api/health`: 0 Treffer). |
| Anwenderdokumentation, Warnung zu `--host` | `docs/user/pipwerk-studio.md` Zeile 32 nennt das Anlegen, Ändern und Löschen von Strategien und Vorlagen und das Ändern des Objektverzeichnisses durch andere im Netz; Zeile 160 wiederholt das. Erfüllt. |
| Technische Dokumentation Abschnitt 8 | Zeile 674 nennt die neuen schreibenden Endpunkte, Begrenzungen, Maßnahmen und das Risiko bei `--host`. Maßnahme (4) ist falsch, siehe S1. |
| Hinzugefügter Code: Geheimnisse, feste Pfade, gefährliche Aufrufe | Suche im Diff nach Zugangsdaten, Rechnerpfaden, `eval`, `exec`, `shell=True`, `pickle`, `yaml.load`: keine Treffer. `subprocess.run` nur in `tests/test_contract.py`, mit fester Argumentliste und Zeitbegrenzung. Die Änderung an `scripts/testenv` prüft nur, ob die Bibliothek vorhanden ist. |

Testumgebung mit `testenv start` auf freien Ports gestartet und mit `testenv stop` beendet; die Ports sind danach wieder frei. Die Prüfprogramme lagen nur vorübergehend im Arbeitsverzeichnis und sind gelöscht. Am geprüften Commit wurde nichts geändert.

## Befunde

### S1 (blockierend): Webseiten eines anderen Ursprungs können über DNS-Rebinding Strategien und Vorlagen anlegen, ändern und löschen

- Fundstelle: `components/pipwerk-studio/backend/src/pipwerk_studio/app.py` Zeile 247 ff. (`create_app`: keine Prüfung des Kopfs `Host` oder `Origin`); `web_api.py` Zeilen 473–479 (`_json_body`, einziger Schutz: der Medientyp). `docs/technical/pipwerk-studio.md` Zeile 674, Maßnahme (4): „eine Webseite eines anderen Ursprungs kann ohne Erlaubnis des Backends nicht schreiben (keine CORS-Freigabe)“. Der Prüfauftrag nennt „Medientyp und Schreiben von fremden Webseiten“ ausdrücklich.
- Sachverhalt: Das Backend der Testumgebung ist im Browser des Anwenders direkt unter `127.0.0.1:<backend-port>` erreichbar. Es nimmt Anfragen mit jedem `Host` an. Nachweis in der Testumgebung: `POST /api/v1/strategies` mit `Host: rebind.example:<port>`, `Origin: http://rebind.example:<port>` und `Content-Type: application/json` ergab 201. `DELETE` derselben Strategie mit diesen Köpfen ergab 204.
- Angriff: Eine fremde Webseite lässt ihren Namen nach dem Laden auf `127.0.0.1` auflösen (DNS-Rebinding). Für den Browser gilt die Anfrage dann als Anfrage desselben Ursprungs. Er sendet `POST`, `PUT` und `DELETE` mit `application/json` ohne CORS-Vorabanfrage und liest die Antworten. Die Seite kann so alle Strategien und Vorlagen lesen, anlegen, ändern und löschen. Das geht ohne `--host` und von außerhalb des vom Betreiber kontrollierten Netzes. Den Port des Backends kann die Seite durch Probieren finden.
- `vite preview` weist fremde Namen im Kopf `Host` mit 403 ab (geprüft: 403). Das gilt nur für den Port der Oberfläche, nicht für den des Backends.
- Die Maßnahme (4) der technischen Dokumentation schützt nur gegen Anfragen von einem anderen Ursprung, nicht gegen DNS-Rebinding. Die Aussage, eine fremde Webseite könne nicht schreiben, trifft deshalb nicht zu. Die Dokumentation nennt das Risiko nur für `--host` außerhalb der Loopback-Adresse.
- Bezug: OWASP API Security Top 10 API8 (Sicherheitskonfiguration); Regel 8.3 Nr. 2 (sichere Voreinstellungen) und Nr. 9; Spezifikation 8, erster Punkt (Betrieb ohne Anmeldung nur im vom Betreiber kontrollierten Netz). Der Angriff kommt hier von außerhalb dieses Netzes.
- Vorgeschichte: Für das interne `PUT /api/studio/settings/object-directory` ist dieselbe Lücke im Bericht `02-securitytest-1.md` als Hinweis H3 vermerkt. Mit den neuen schreibenden Endpunkten und der neuen, falschen Aussage in der Dokumentation stufe ich sie hier als blockierend ein. Ob das Risiko ohne Maßnahme hingenommen wird, entscheidet nicht der Tester. Das wäre eine Entscheidung des Softwarearchitekten oder darüber.

### S2 (blockierend): `/docs` lädt Skript und Stylesheet von einem CDN ohne feste Version und ohne Integritätsprüfung

- Fundstelle: `components/pipwerk-studio/backend/src/pipwerk_studio/app.py` Zeile 247 (`FastAPI(...)` mit der Voreinstellung für `/docs`). Ausgelieferte Seite `GET /docs` (geprüft): `<script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js">`, Stylesheet `…/swagger-ui-dist@5/swagger-ui.css`, Symbol von `https://fastapi.tiangolo.com/img/favicon.png`; kein Attribut `integrity`. `docs/technical/pipwerk-studio.md` Zeile 362.
- Sachverhalt: `/docs` ist der vorgesehene Weg, die Abnahmekriterien zu prüfen (Auftrag, Ziel). Die Seite führt Code eines Dritten im Ursprung des Backends aus. Die Version ist nur auf die Hauptversion 5 festgelegt; jede neue 5.x-Fassung auf dem CDN wird ungeprüft geladen. Ein manipuliertes oder fehlerhaftes Paket hätte vollen Zugriff auf alle Endpunkte desselben Ursprungs. Das umfasst Anlegen, Ändern und Löschen aller Strategien und Vorlagen und `PUT /api/studio/settings/object-directory` (Dateien verschieben). Außerdem erfährt jeder Aufruf von `/docs` zwei fremde Server.
- Die technische Dokumentation (Zeile 362) nennt nur die Folge für die Erreichbarkeit („ohne Zugang des Browsers dorthin bleibt `/docs` leer“). Sie nennt weder das Risiko des fremden Codes noch die fehlende Festlegung der Version oder eine Ersatzmaßnahme.
- Bezug: OWASP ASVS (Integrität extern geladener Ressourcen, Subresource Integrity); Regel 5 Nr. 7 und 8.2 Nr. 9 (reproduzierbare, geprüfte Abhängigkeiten); 8.2 Nr. 7 (Netzwerkzugriffe begrenzen); 8.1 (Abweichung mit Grund, Risiko und Ersatzmaßnahme dokumentieren); 6 Nr. 6 (Versionen der Drittkomponenten reproduzierbar festgelegt).

## Hinweise (nicht blockierend)

### H1: `npm audit` meldet eine Schwachstelle der Stufe „high“ in `source-map-js` 1.2.1

- Fundstelle: `components/pipwerk-studio/frontend/package-lock.json`. Abhängigkeit über `vite@8.3.1 → postcss@8.5.28` und `jsdom@30.1.1 → css-tree@3.2.1`. GHSA-68fv-2mgg-jv7q: Denial of Service über manipulierte Source Maps.
- Sachverhalt: Die Oberfläche ist in diesem Commit unverändert (`git diff --stat` für `components/pipwerk-studio/frontend` leer). Betroffen sind Bau- und Testwerkzeuge, nicht der ausgelieferte Code, und sie verarbeiten nur eigene Quellen. Das Prüfskript endet wegen `npm audit` trotzdem nicht mit Exitcode 0. Die Abhängigkeit muss nach Regel 8.2 Nr. 9 geprüft und aktualisiert werden. Das gehört nicht zum Umfang dieses Auftrags.

### H2: UUID im Pfad auch in nicht kanonischer Schreibweise angenommen

- Fundstelle: `web_api.py` Zeile 483 (`ObjectId`, Pydantic `UUID` im Standardmodus).
- Sachverhalt: `GET /api/v1/strategies/{id}` liefert 200 mit Großbuchstaben, ohne Bindestriche, in `{}` und mit `urn:uuid:`. Der Wert wird kanonisch gemacht, bevor ein Dateiname entsteht. Das ist kein Risiko für den Dateizugriff. Die Beschreibung unter `contracts/api/` nennt aber `format: uuid`. Die Ablage selbst lehnt nicht kanonische Formen ab (`check_object_id`). Schnittstelle und Ablage sind damit verschieden streng.

### H3: Body der internen Endpunkte außerhalb von `/api/v1/` nicht begrenzt

- Fundstelle: `web_api.py` Zeile 764 (`BodyLimitMiddleware` nur mit Präfix `/api/v1`).
- Sachverhalt: `PUT /api/studio/settings/language` mit 3 MiB Body: 422. Der ganze Body wird gelesen und als JSON zerlegt; es gibt keine Größengrenze. Das ist älter als dieser Auftrag. Spezifikation 8 begrenzt nur die Größe eines Dokuments.

### H4: Zu großer Body über den Port der Oberfläche ergibt 502 statt 413

- Sachverhalt: `POST /api/v1/check` mit 3 MiB über `vite preview` ergab 502. Das Backend antwortet mit 413 und schließt die Verbindung, bevor der Proxy alles gesendet hat. Der Body wird trotzdem abgewiesen; nur der Statuscode ist ein anderer.

### H5: Keine Sicherheitsköpfe in den Antworten der Web-API

- Sachverhalt: Die Antworten (zum Beispiel `GET /api/v1/element-types`) enthalten nur `content-type`, `content-length`, `date` und `server`. Es fehlen `X-Content-Type-Options: nosniff` und `Cache-Control` für Antworten mit Dokumentinhalten. Weil alle Antworten JSON mit dem richtigen Medientyp sind, ist das Risiko gering (OWASP ASVS, HTTP-Sicherheitsköpfe).

## Kontrolle vorheriger Befunde

Entfällt; erster Durchlauf zu Auftrag 03.

## Geprüfter Commit

`d91f5f8abc5e9ea4155494505e9cbebb84846d3c`
