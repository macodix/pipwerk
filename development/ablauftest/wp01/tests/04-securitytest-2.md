# Testbericht Sicherheitstest, Auftrag 04, Durchlauf 2

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: Tester Sicherheit
- Prüfauftrag: `development/ablauftest/wp01/tests/04-securitytest-2-order.md` (Zweig `ablauftest/wp01`)
- geprüfter Commit: `1148fa60f578ac54539b9642de8e3850e390bb02` (Zweig `ablauftest/wp01-04`)
- Vergleichsstand: `62ebf6d1a4c6cebb3e97ab13390a0dad1f35f6ad` (geprüft in Durchlauf 1)
- Kontrolle des Stands: `git rev-parse HEAD` im Arbeitsverzeichnis ergab `1148fa60f578ac54539b9642de8e3850e390bb02`.

## Ergebnis

**nicht bestanden**

Der frühere Befund S1 ist behoben. Die Änderung verursacht zwei neue Befunde:

- S2: Die Glossartabelle der Anwenderdokumentation ist beschädigt. Der Eintrag „nicht committete Änderung“ fällt dadurch weg.
- S3: Abschnitt 8 und Abschnitt 4a der technischen Dokumentation beschreiben die Prüfung des Kopfs `Host` allgemeiner, als der Code von Vite sie ausführt.

## Prüfgrundlagen

- Auftrag `development/ablauftest/wp01/orders/04.md`
- Prüfaufträge `04-securitytest-1-order.md` und `04-securitytest-2-order.md`. Die Vorgaben von Durchlauf 1 gelten weiter.
- vorherige Berichte `04-securitytest-1.md` (S1) und `04-functiontest-1.md` (F1, F2)
- `docs/technical/development-test-security-rules.md`, Abschnitt 8 und Abschnitt 9, Zeile Vite
- `docs/technical/pipwerk-studio.md`, Abschnitte 4a und 8
- `components/pipwerk-studio/scripts/testenv`, `components/pipwerk-studio/frontend/vite.config.ts`
- installierter Code von Vite `8.3.1` (festgelegt in `frontend/package.json`, Zeile 41)
- Briefing Tester Sicherheit in `docs/technical/agentenrollen-und-briefings.md`
- Referenzen: BSI IT-Grundschutz CON.8 (Dokumentation zur sicheren Nutzung), OWASP API Security Top 10 API8 (Security Misconfiguration), OWASP ASVS (sichere Konfiguration)

## Geprüfter Umfang

`git diff --stat 62ebf6d… 1148fa6…`: Es sind genau zwei Dateien geändert, mit 5 Zeilen hinzu und 6 Zeilen weg.

- `docs/user/pipwerk-studio.md`: Absatz „Zugriff von anderen Rechnern“ (Zeile 32) und Glossar (Zeile 168, der Eintrag „Name des Rechners“ ist entfernt)
- `docs/technical/pipwerk-studio.md`: Abschnitt 4a (Zeilen 294 und 295, Zeile 295 ist neu) und Abschnitt 8 (Zeile 491)

Code, Tests, Skripte und die Konfiguration von Vite sind nicht geändert.

## Nachprüfung der vorherigen Befunde

### S1 (Befehl mit `--host 0.0.0.0` vor dem Sicherheitshinweis): behoben

`docs/user/pipwerk-studio.md`, Zeile 32: Der Absatz beginnt jetzt mit „Achtung, lesen Sie zuerst diesen Hinweis.“ Danach folgen alle drei Aussagen des bisherigen Hinweises: Jeder im Netz kann pipwerk Studio benutzen und Einstellungen ändern. Es gibt keine Anmeldung. `--host` gehört nur in ein vertrauenswürdiges Netz. Erst danach steht der vollständige Befehl mit `--host 0.0.0.0`. Der Inhalt des Hinweises ist unverändert. Er gilt sprachlich für jeden Gebrauch von `--host` und damit auch für eine einzelne Netzwerkadresse.

### F1 (Zugriff über den Namen des Rechners): aus Sicht der Sicherheit erledigt, Rest siehe S3

Die Anwenderdokumentation nennt für andere Rechner nur noch die Netzwerkadresse (Zeile 32). Sie sagt ausdrücklich, dass ein Name wie `mein-rechner` abgewiesen wird. Für die beiden dort beschriebenen Aufrufe stimmt das. Beim Aufruf mit `--host 0.0.0.0` und beim Aufruf mit einer einzelnen Netzwerkadresse enthält die Liste der erlaubten Werte keinen Namen (siehe Nachweise zu S3). Die allgemeinere Aussage in der technischen Dokumentation betrifft Befund S3.

Die Entscheidung, die Konfiguration von Vite ohne `allowedHosts` zu lassen, ist aus Sicht der Sicherheit richtig. Mit `allowedHosts: true` wäre die Prüfung abgeschaltet (`node.js`, Zeile 35422), und die Oberfläche wäre für DNS-Rebinding angreifbar. Das gilt auch ohne `--host`, also an `127.0.0.1`.

### F2 (Adresse bei IPv6-Adressen in Abschnitt 4a): erledigt

`docs/technical/pipwerk-studio.md`, Zeile 294, beschreibt jetzt alle vier Fälle von `url_host`. Abgleich mit `testenv`, Zeilen 157 bis 164: `0.0.0.0` wird zu `127.0.0.1` (Zeile 159). `::` wird zu `[::1]` (Zeile 160). Jeder Wert mit `:` steht in eckigen Klammern (Zeile 161). Jeder andere Wert bleibt unverändert (Zeile 162). Die Beschreibung stimmt. Für die Sicherheit ergibt sich daraus nichts Neues.

## Prüfungen und Nachweise zum geänderten Stand

### 1. Sicherheitshinweis zu `--host`

- Die Reihenfolge ist richtig: erst der Hinweis, dann der Befehl (siehe S1).
- Zeile 32 nennt außer dem Befehl mit `--host 0.0.0.0` keinen weiteren Befehl. Der Befehl verwendet nur Parameter, die `cmd_start` prüft (`testenv`, Zeilen 192 bis 216).
- Abschnitt 4a, Absatz „Risiko bei `--host` außerhalb der Loopback-Adresse“ (Zeile 297): Der Absatz ist unverändert und stimmt weiter mit `testenv` überein. Das Backend ist an `127.0.0.1` gebunden (Zeile 271). `vite preview` bindet sich an `--host` (Zeilen 280 bis 282) und leitet `/api` weiter (`vite.config.ts`, Zeilen 14 bis 16 und 48).
- Abschnitt 8 (Zeile 491) sagt weiter, dass das Risiko nicht durch eine Maßnahme im Skript gemindert ist. Die neue Aussage zur Prüfung des Kopfs `Host` beschreibt diese Prüfung als Schutz vor DNS-Rebinding. Sie stellt die Prüfung nicht als Zugriffsschutz gegen andere Rechner dar. Das ist richtig. Ein Rechner im Netz, der die Netzwerkadresse verwendet, wird nicht abgewiesen (`node.js`, Zeilen 16825 und 16836).

Ergebnis: kein Befund.

### 2. Prüfung des Kopfs `Host` in Vite 8.3.1

Zur Prüfung habe ich die Abhängigkeiten der Oberfläche mit `npm ci --ignore-scripts` in meinem Arbeitsverzeichnis installiert. `node_modules/vite/package.json`, Zeile 3, nennt `"version": "8.3.1"`. Danach habe ich `node_modules` wieder entfernt. Belege in `node_modules/vite/dist/node/chunks/node.js`:

- Zeilen 35353 bis 35358: `preview.allowedHosts` übernimmt `server.allowedHosts`, wenn es nicht gesetzt ist. Die Voreinstellung ist `[]` (Zeile 24982). `vite.config.ts` setzt kein `allowedHosts` (Zeilen 37 bis 49).
- Zeilen 35421 und 35422: `vite preview` setzt die Prüfung ein, solange `allowedHosts` nicht `true` ist und kein HTTPS verwendet wird.
- Zeilen 16832 bis 16844: Erlaubt sind IPv4- und IPv6-Adressen, `localhost`, jeder Name auf `.localhost` und jeder Eintrag der Liste.
- Zeilen 16890 bis 16900 und 37466 bis 37468: In die Liste kommen `server.host` und `preview.host`.
- `node_modules/vite/dist/node/cli.js`, Zeilen 819 bis 823: Der Wert von `--host` beim Aufruf von `vite preview` wird zu `preview.host`.
- Zeilen 16872 bis 16881: Eine abgewiesene Anfrage erhält HTTP 403.

Zum Schutz vor DNS-Rebinding: Ein Angreifer verwendet dabei einen eigenen Namen, der auf den Rechner zeigt. Dieser Name steht nicht in der Liste und wird abgewiesen. Die Aussage in Zeile 295 trifft also zu. Zur Genauigkeit der übrigen Aussagen siehe S3.

Die Prüfung wurde durch Lesen des Codes festgestellt. Anfragen an eine laufende Testumgebung habe ich nicht gesendet.

### 3. Zugangsdaten, Rechnernamen, Benutzernamen, Pfade des Entwicklungsrechners

Ich habe die hinzugefügten Zeilen des Diffs `62ebf6d… 1148fa6…` durchsucht. Gesucht habe ich nach dem Namen, dem Benutzernamen und der Domäne des Entwicklungsrechners sowie nach `/srv/`, `/home/`, `aixlab`, `token`, `passw`, `secret`, `key` und `macodix`. Es gab keinen Treffer. `mein-rechner` ist ein erfundenes Beispiel und nicht der Name des Entwicklungsrechners.

Ergebnis: kein Befund.

## Befunde

### S2: Glossartabelle beschädigt, Eintrag „nicht committete Änderung“ fehlt in der Darstellung

- Fundstelle: `docs/user/pipwerk-studio.md`, Zeile 168
- Sachverhalt: Beim Entfernen des Eintrags „Name des Rechners“ sind die Zeile „Netzwerkadresse“ und die Zeile „nicht committete Änderung“ zu einer Zeile verschmolzen. Sie sind durch `||` verbunden: „… alle Netzwerkadressen dieses Rechners. || nicht committete Änderung | Eine Änderung … |“. Die Tabelle hat zwei Spalten (Zeilen 155 und 156). In der Darstellung von GitHub (GitHub Flavored Markdown) werden überzählige Zellen einer Zeile verworfen. Der Eintrag „nicht committete Änderung“ erscheint dann nicht mehr im Glossar. Zeile 38 („Zu „nicht committete Änderung“ siehe Glossar in Abschnitt 7.“) und Zeile 177 („steht unter „nicht committete Änderung““) verweisen auf diesen Eintrag. Im Vergleichsstand `62ebf6d…` war der Eintrag eine eigene Zeile. Das ist kein Sicherheitsmangel im engeren Sinn. Es ist aber ein neuer Fehler, den die Änderung verursacht hat, und die Dokumentation ist dadurch nicht mehr in sich stimmig.
- Bezug: Dokumentationspflicht; Prüfauftrag Durchlauf 2 („ob die Änderungen … neue Probleme verursachen“)

### S3: Prüfung des Kopfs `Host` allgemeiner beschrieben, als sie im Code arbeitet

- Fundstellen:
  - `docs/technical/pipwerk-studio.md`, Zeile 295: „Ein Name des Rechners wird abgewiesen. Grund: `vite preview` prüft den Kopf `Host` der Anfrage und lässt nur Adressen und `localhost` zu“
  - `docs/technical/pipwerk-studio.md`, Zeile 491 (Abschnitt 8, Sicherheit): „`vite preview` prüft den Kopf `Host` der Anfragen (Schutz vor DNS-Rebinding) und weist Anfragen mit einem Namen des Rechners ab“
- Sachverhalt: Das Testumgebungsskript lässt für `--host` ausdrücklich auch einen Namen zu („--host must be an address or a host name“, `testenv`, Zeilen 214 und 215). Es gibt den Wert an `vite preview --host` weiter (Zeile 281). Vite übernimmt diesen Wert in `preview.host` (`cli.js`, Zeile 822) und nimmt ihn in die Liste der erlaubten Werte auf (`node.js`, Zeilen 16894 und 37468). Wird `--host` mit dem Namen des Rechners angegeben, wird eine Anfrage mit diesem Namen also **nicht** abgewiesen. Außerdem lässt die Prüfung neben `localhost` jeden Namen auf `.localhost` zu (`node.js`, Zeile 16838). Die beiden Sätze stellen die Prüfung in Abschnitt 8 deshalb als allgemeiner dar, als sie ist. Die Aussage zum Schutz vor DNS-Rebinding bleibt richtig. Die Anwenderdokumentation ist nicht betroffen, weil sie nur `0.0.0.0` und eine einzelne Netzwerkadresse als Wert für `--host` beschreibt (Zeile 32).
- Bezug: `docs/technical/development-test-security-rules.md`, Abschnitt 8 (zutreffende Dokumentation der Sicherheitsmaßnahmen); BSI CON.8 (Dokumentation); Auftrag 04, Abnahmekriterium 1 („Jede Aussage zu Adresse und `--host` stimmt mit dem Code … überein“)

## Hinweis außerhalb des Prüfgegenstands (kein Befund dieses Commits)

- `docs/user/pipwerk-studio.md`, Zeile 32: Die Aussage „nur von Ihrem eigenen Rechner aus erreichbar“ ist richtig. Ohne Anmeldung können auf einem Rechner mit mehreren Benutzern aber auch andere angemeldete Benutzer dieses Rechners pipwerk Studio benutzen. Das galt schon vor Auftrag 04. Der Hinweis wiederholt Durchlauf 1 und dient nur zur Kenntnis.

## Nicht durchgeführte Prüfungen

- Eine Anfrage mit einem Namen im Kopf `Host` an eine laufende Testumgebung habe ich nicht gesendet. S3 und die Aussagen zur Prüfung des Kopfs `Host` stützen sich auf den installierten Code von Vite 8.3.1.
- Das Prüfskript (Abnahmekriterium 3) gehört dem Tester Funktion. Ich habe es nicht ausgeführt.

## Zustand des Arbeitsverzeichnisses

Nach der Prüfung zeigte `git status --porcelain --ignored` nur die früheren, nicht committeten Testberichte. Dazu kommt dieser Bericht. Das für die Prüfung installierte `node_modules` habe ich wieder entfernt.
