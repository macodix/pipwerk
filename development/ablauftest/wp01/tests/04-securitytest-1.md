# Testbericht Sicherheitstest, Auftrag 04, Durchlauf 1

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: Tester Sicherheit
- Prüfauftrag: `development/ablauftest/wp01/tests/04-securitytest-1-order.md` (Zweig `ablauftest/wp01`)
- geprüfter Commit: `62ebf6d1a4c6cebb3e97ab13390a0dad1f35f6ad` (Zweig `ablauftest/wp01-04`)
- Vergleichsstand: `2a153d355391f3ded119f2a0f4480cf84901176a`
- Kontrolle des Stands: `git rev-parse HEAD` im Arbeitsverzeichnis ergab `62ebf6d1a4c6cebb3e97ab13390a0dad1f35f6ad`.

## Ergebnis

**nicht bestanden**

Grund: Befund S1. Die Anwenderdokumentation nennt den fertigen Befehl mit `--host 0.0.0.0`, bevor sie auf die fehlende Anmeldung hinweist.

## Prüfgrundlagen

- Auftrag `development/ablauftest/wp01/orders/04.md`
- `docs/technical/development-test-security-rules.md`, Abschnitt 8 (insbesondere 8.2 Nr. 7, 8.3 Nr. 2 und 5) und Abschnitt 9, Zeile Vite
- `docs/technical/pipwerk-studio.md`, Abschnitt 4a
- `components/pipwerk-studio/scripts/testenv`
- Briefing Tester Sicherheit in `docs/technical/agentenrollen-und-briefings.md`
- Referenzen: BSI IT-Grundschutz CON.8 und APP.7 (Dokumentation sicherer Nutzung), OWASP ASVS (sichere Konfiguration), OWASP API Security Top 10 API8 (Security Misconfiguration)

## Geprüfter Umfang

`git diff 2a153d3…62ebf6d` ändert genau zwei Dateien:

- `docs/user/pipwerk-studio.md`: Abschnitt 2, Schritte 2 und 3, neuer Absatz „Zugriff von anderen Rechnern“ (Zeile 32), Glossar „Netzwerkadresse“ und „Name des Rechners“ (Zeilen 168 und 169)
- `docs/technical/pipwerk-studio.md`: Abschnitt 4a, Eintrag „Oberfläche“ (Zeile 294)

Code, Tests und Skripte sind nicht geändert.

## Prüfungen und Nachweise

### 1. Sicherheitshinweis zu `--host`, auch für eine einzelne Netzwerkadresse

Abgleich mit `components/pipwerk-studio/scripts/testenv`:

- Vorgabe ohne `--host`: `host=127.0.0.1` (Zeile 191). Die Oberfläche bindet an `$host` (Zeilen 280 bis 282). Das Backend bindet immer an `127.0.0.1` (Zeile 271). Die Aussage „Ohne `--host` ist pipwerk Studio nur von Ihrem eigenen Rechner aus erreichbar“ stimmt.
- `url_host` (Zeilen 157 bis 164): `0.0.0.0` wird zu `127.0.0.1`, `::` zu `[::1]`, eine andere Adresse mit `:` wird in eckige Klammern gesetzt, alles andere bleibt unverändert. Die Meldungen von `start` (Zeilen 303 und 304) und `status` (Zeilen 328 und 329) verwenden `url_host`. Die Aussagen in Anwenderdokumentation Zeile 32 und technischer Dokumentation Zeile 294 dazu stimmen. Geprüft durch Lesen des Codes. Ein Aufruf der Funktion war in dieser Prüfumgebung nicht möglich.
- Einzelne Netzwerkadresse: Bei `--host <Adresse>` bindet `vite preview` nur an diese Adresse, und `url_host` gibt sie unverändert aus. Die Aussage „ist pipwerk Studio nur unter dieser Adresse erreichbar, und das Skript nennt diese Adresse“ stimmt. Der folgende Hinweis „Mit `--host` kann jeder, der Ihren Rechner im Netz erreicht, pipwerk Studio benutzen …“ gilt sprachlich für jeden Gebrauch von `--host` und damit auch für eine einzelne Adresse. Die Einschränkung auf eine Adresse wird nicht als Schutz dargestellt.
- Inhalt des bisherigen Hinweises: keine Anmeldung, Einstellungen änderbar, nur in einem vertrauenswürdigen Netz. Alle drei Aussagen sind in Zeile 32 erhalten.
- Technische Dokumentation Abschnitt 4a: Der Absatz „Risiko bei `--host` außerhalb der Loopback-Adresse“ (Zeile 297) ist unverändert. Er stimmt weiter mit dem Code überein: Weiterleitung von `/api` durch `vite preview`, keine Authentisierung, Backend an `127.0.0.1` ohne Schutzwirkung. Die neue Aussage in Zeile 294 widerspricht ihm nicht.

Ergebnis: richtig und vollständig. Kein Befund.

### 2. Verleitung zu unsicherem Gebrauch ohne vorherige Warnung

Siehe Befund S1.

### 3. Zugangsdaten, Rechnernamen, Benutzernamen, Pfade des Entwicklungsrechners

- Der Diff wurde nach dem Namen, dem Benutzernamen und der Netzwerkadresse des Entwicklungsrechners sowie nach `/srv/`, `/home/`, `aixlab`, `token`, `passw`, `secret` und `key` durchsucht. Es gab keinen Treffer.
- Die Beispiele `192.168.0.12` und `mein-rechner` im Glossar sind nicht die Adresse und nicht der Name des Entwicklungsrechners. `192.168.0.12` ist eine Adresse aus einem privaten Adressbereich (RFC 1918).
- Beide Dateien wurden vollständig durchsucht. Treffer gab es nur außerhalb des Diffs: die öffentliche Repository-Adresse `https://github.com/macodix/pipwerk` und das als erfunden gekennzeichnete Beispiel `/home/beispiel/pipwerk`. Beides ist nicht Gegenstand dieser Änderung und keine Angabe des Entwicklungsrechners.

Ergebnis: kein Befund.

### 4. Sonstige Sicherheitsaspekte der Änderung

- Glossar „Netzwerkadresse“: Die Aussage, dass `127.0.0.1` nur vom eigenen Rechner aus erreichbar ist, stimmt. Dass `0.0.0.0` „alle Netzwerkadressen dieses Rechners“ bedeutet, stellt die Erreichbarkeit eher zu weit als zu eng dar, denn `0.0.0.0` umfasst nur IPv4. Das unterschätzt die Gefährdung nicht. Kein Befund.
- Es werden keine neuen Befehle eingeführt außer dem Beispiel mit `--host 0.0.0.0`. Der Befehl verwendet nur Parameter, die das Skript prüft (Zeilen 192 bis 216). Kein weiterer Befund.

## Befunde

### S1: Ausführbarer Befehl mit `--host 0.0.0.0` steht vor dem Sicherheitshinweis

- Fundstelle: `docs/user/pipwerk-studio.md`, Zeile 32, Absatz „Zugriff von anderen Rechnern“
- Sachverhalt: Der Absatz nennt im dritten Satz den vollständigen, kopierfertigen Befehl `components/pipwerk-studio/scripts/testenv start … --host 0.0.0.0`. Der Hinweis, dass jeder im Netz pipwerk Studio benutzen und Einstellungen ändern kann, dass es keine Anmeldung gibt und dass `--host` nur in einem vertrauenswürdigen Netz zu verwenden ist, folgt erst nach fünf weiteren Sätzen am Ende des Absatzes („Achtung: …“). Vor dem Befehl steht nur, dass andere Rechner damit zugreifen können. Wer den Befehl übernimmt, ohne den Absatz zu Ende zu lesen, macht pipwerk Studio mit allen Endpunkten unter `/api` ohne Authentisierung im Netz erreichbar, darunter das schreibende `PUT /api/studio/settings/language` (technische Dokumentation Zeile 297). Im Vergleichsstand gab es keinen fertigen Befehl mit `--host`. Die Prüfauftragsfrage, ob die Anleitung ohne vorherige Warnung zu unsicherem Gebrauch verleitet, ist daher zu bejahen.
- Bezug: `docs/technical/development-test-security-rules.md` 8.3 Nr. 2 (sichere Voreinstellungen) und Abschnitt 9, Zeile Vite (Entwicklungsserver nicht als Sicherheitsgrenze behandeln); OWASP API Security Top 10 API8 (Security Misconfiguration); BSI CON.8 (Dokumentation zur sicheren Nutzung)

## Hinweis außerhalb des Prüfgegenstands (kein Befund dieses Commits)

- `docs/user/pipwerk-studio.md`, Zeile 32 (übernommen aus dem Vergleichsstand): „nur von Ihrem eigenen Rechner aus erreichbar“ ist richtig. Ohne Anmeldung können auf einem Rechner mit mehreren Benutzern aber auch andere angemeldete Benutzer dieses Rechners pipwerk Studio benutzen und Einstellungen ändern. Das war schon vor diesem Commit so und wird nur zur Kenntnis gegeben.

## Nicht durchgeführte Prüfungen

- Die Funktion `url_host` und die Meldungen von `start` und `status` wurden nicht ausgeführt, weil Befehle mit Variablen in dieser Prüfumgebung gesperrt sind. Die Übereinstimmung wurde durch Lesen des Codes festgestellt (Zeilen 157 bis 164, 303 und 304, 328 und 329).
- Das Prüfskript (technisches Abnahmekriterium 3 des Auftrags) gehört zum Tester Funktion und wurde hier nicht ausgeführt.
