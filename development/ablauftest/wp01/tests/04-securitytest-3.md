# Testbericht Sicherheitstest, Auftrag 04, Durchlauf 3

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: Tester Sicherheit
- Prüfauftrag: `development/ablauftest/wp01/tests/04-securitytest-3-order.md` (Zweig `ablauftest/wp01`)
- geprüfter Commit: `7c1a6b3214e17b8b292670a6e29a0cbe01b83637` (Zweig `ablauftest/wp01-04`, Elterncommit `1148fa60f578ac54539b9642de8e3850e390bb02`)
- Kontrolle des Stands: `git rev-parse HEAD` im Arbeitsverzeichnis ergab `7c1a6b3214e17b8b292670a6e29a0cbe01b83637`. `git ls-remote origin ablauftest/wp01-04` nennt denselben Commit.

## Ergebnis

**bestanden**

Die Befunde S2 und S3 aus Durchlauf 2 sind behoben. Die Änderung hat keine neuen Befunde verursacht.

## Prüfgrundlagen

- Auftrag `development/ablauftest/wp01/orders/04.md`
- Prüfaufträge `04-securitytest-1-order.md` bis `04-securitytest-3-order.md`. Die Vorgaben von Durchlauf 1 gelten weiter.
- vorherige Berichte `04-securitytest-2.md` (S2, S3) und `04-functiontest-2.md` (F3, F4)
- `docs/technical/development-test-security-rules.md`, `docs/technical/pipwerk-studio.md` (Abschnitte 4a und 8), `docs/user/pipwerk-studio.md` (Abschnitt 2 und Glossar)
- `components/pipwerk-studio/scripts/testenv`, `components/pipwerk-studio/frontend/vite.config.ts`
- installierter Code von Vite `8.3.1` (festgelegt in `components/pipwerk-studio/frontend/package.json`, Zeile 41)
- Briefing Tester Sicherheit in `docs/technical/agentenrollen-und-briefings.md`
- Referenzen: BSI IT-Grundschutz CON.8 (Dokumentation), OWASP API Security Top 10 API8 (Security Misconfiguration), OWASP ASVS (sichere Konfiguration)

Der Prüfauftrag sagt, Abschnitt 4a und Abschnitt 8 folgen einem Wortlaut, den der Softwarearchitekt vorgegeben hat. Dieser Wortlaut liegt nicht im Repository (Zweig `ablauftest/wp01`, Verzeichnis `development/ablauftest/wp01/`). Ich habe die Aussagen deshalb gegen den Code geprüft, nicht gegen den Wortlaut.

## Geprüfter Umfang

`git diff --stat 1148fa6… 7c1a6b3…`: Es sind genau zwei Dateien geändert, mit 4 Zeilen hinzu und 3 Zeilen weg.

- `docs/user/pipwerk-studio.md`: Glossar, Zeilen 168 und 169
- `docs/technical/pipwerk-studio.md`: Abschnitt 4a (Zeile 295) und Abschnitt 8 (Zeile 491)

Code, Tests, Skripte und die Konfiguration von Vite sind nicht geändert. Seit dem Ausgangsstand `2a153d355391f3ded119f2a0f4480cf84901176a` sind insgesamt nur diese beiden Dateien geändert.

## Nachprüfung der vorherigen Befunde

### S2 (Glossartabelle beschädigt): behoben

`docs/user/pipwerk-studio.md`, Zeile 168 („Netzwerkadresse“) und Zeile 169 („nicht committete Änderung“) sind wieder zwei eigene Zeilen mit je zwei Zellen, wie die Kopfzeile (Zeilen 155 und 156). Der Diff `62ebf6d… 7c1a6b3…` zeigt im Glossar nur noch das Entfernen des Eintrags „Name des Rechners“. Beide Zeilen sind gleich wie im Stand `62ebf6d…`. Die Verweise in Zeile 38 und Zeile 178 („steht unter „nicht committete Änderung““) finden den Eintrag wieder.

### S3 (Prüfung des Kopfs `Host` allgemeiner beschrieben, als sie arbeitet): behoben

Neue Aussagen in `docs/technical/pipwerk-studio.md`, Zeile 295 (Abschnitt 4a) und Zeile 491 (Abschnitt 8), abgeglichen mit `node_modules/vite/dist/node/chunks/node.js` und `cli.js` von Vite 8.3.1:

| Aussage | Beleg im Code | Ergebnis |
|---|---|---|
| `vite preview` prüft den Kopf `Host` jeder Anfrage | `node.js`, Zeile 35422: Prüfung, solange `allowedHosts` nicht `true` ist und kein HTTPS verwendet wird. `vite.config.ts` setzt weder `allowedHosts` noch `https` (Zeilen 37 bis 49). `testenv` startet `vite preview` ohne HTTPS (Zeilen 280 und 281). Die Prüfung steht vor der Weiterleitung von `/api` (`node.js`, Zeilen 35422 und 35430). | stimmt |
| Schutz vor DNS-Rebinding | Ein fremder Name steht nicht in der Liste und wird abgewiesen (`node.js`, Zeilen 16838 bis 16843). | stimmt |
| Zugelassen sind IP-Adressen, `localhost` und Namen auf `.localhost` | `node.js`, Zeile 16836 (IPv4 und IPv6) und Zeile 16838 (`localhost`, Endung `.localhost`) | stimmt |
| sowie der mit `--host` angegebene Wert; ist ein Name angegeben, ist genau dieser Name zugelassen | `testenv`, Zeile 281: Weitergabe an `vite preview --host`. `cli.js`, Zeile 822: wird zu `preview.host`. `node.js`, Zeile 16894 und Zeilen 37466 bis 37468: kommt in die Liste. Zeile 16840: genauer Vergleich. Sonst steht nur `server.host` `127.0.0.1` in der Liste (`vite.config.ts`, Zeile 39), also eine IP-Adresse. | stimmt |
| Die Konfiguration setzt kein `allowedHosts` | `vite.config.ts`, Zeilen 37 bis 49. Voreinstellung über `server.allowedHosts` (`node.js`, Zeile 35357). | stimmt |
| Bei `--host 0.0.0.0` oder einer Netzwerkadresse wird ein Name des Rechners mit HTTP 403 abgewiesen | Die Liste enthält dann nur IP-Adressen. Ein Name, der nicht `localhost` ist und nicht auf `.localhost` endet, wird abgewiesen. Antwort mit Status 403 (`node.js`, Zeilen 16872 bis 16881, `writeHead(403, …)` in Zeile 16878). | stimmt |

Die Aussagen stimmen auch mit der Anwenderdokumentation überein. `docs/user/pipwerk-studio.md`, Zeile 32 beschreibt nur `--host 0.0.0.0` und eine einzelne Netzwerkadresse. Für diese Fälle sagt sie, dass ein Name abgewiesen wird.

Abschnitt 8 stellt die Prüfung weiter nur als Schutz vor DNS-Rebinding dar und nicht als Zugriffsschutz gegen andere Rechner. Der Satz „Das Risiko ist nicht durch eine Maßnahme im Skript gemindert“ bleibt stehen. Das ist richtig, denn ein Rechner im Netz, der die Netzwerkadresse verwendet, wird nicht abgewiesen (`node.js`, Zeile 16836).

## Prüfungen zum geänderten Stand

### 1. Sicherheitshinweis zu `--host`

`docs/user/pipwerk-studio.md`, Zeile 32 ist in diesem Commit nicht geändert. Der Hinweis steht weiter vor dem Befehl mit `--host 0.0.0.0` und ist inhaltlich vollständig (Durchlauf 2, S1). Der Absatz „Risiko bei `--host` außerhalb der Loopback-Adresse“ in Abschnitt 4a (Zeile 297) ist unverändert. Ergebnis: kein Befund.

### 2. Zugangsdaten, Rechnernamen, Benutzernamen, Pfade des Entwicklungsrechners

Ich habe alle hinzugefügten Zeilen des Diffs `1148fa6… 7c1a6b3…` gelesen. Sie enthalten keine Zugangsdaten, keinen Namen und keine Domäne des Entwicklungsrechners, keinen Benutzernamen und keinen Pfad unter `/srv/` oder `/home/`. Autor und Committer ist `macodix`. Die Commit-Nachricht nennt weder „Claude“ noch „Anthropic“. Ergebnis: kein Befund.

### 3. Nachweisweg

Zur Prüfung habe ich die Abhängigkeiten der Oberfläche mit `npm ci --ignore-scripts` in meinem Arbeitsverzeichnis installiert. `node_modules/vite/package.json`, Zeile 3 nennt `"version": "8.3.1"`. Danach habe ich `node_modules` wieder entfernt. Die Aussagen zur Prüfung des Kopfs `Host` stützen sich auf das Lesen des Codes. Eine Anfrage an eine laufende Testumgebung habe ich nicht gesendet.

## Befunde

Keine.

## Hinweise (keine Befunde)

- H1: Die Aufzählung „Zugelassen sind …“ in Zeile 295 und „lässt nur … zu“ in Zeile 491 nennt zwei Sonderfälle des Codes nicht. Eine Anfrage ganz ohne Kopf `Host` wird durchgelassen (`node.js`, Zeile 16855). Bei HTTP/1.1 weist Node.js eine solche Anfrage nach meinem Kenntnisstand schon selbst ab; das habe ich nicht geprüft. Außerdem wird ein Wert durchgelassen, der mit `file:` oder `<Name>-extension:` beginnt (`node.js`, Zeilen 16831 und 16833). Ich werte das nicht als Befund. Ein Browser sendet bei DNS-Rebinding immer einen Kopf `Host` mit dem Namen des Angreifers, deshalb bleibt der beschriebene Schutz wirksam. Ein Rechner im Netz erreicht über diese Sonderfälle nichts, was er nicht schon über die Netzwerkadresse erreicht. Die Aussagen beschreiben die zugelassenen Namen und Adressen richtig.
- H2 (wie in Durchlauf 1 und 2): Ohne Anmeldung können auf einem Rechner mit mehreren Benutzern auch andere angemeldete Benutzer pipwerk Studio benutzen, auch ohne `--host`. Das galt schon vor Auftrag 04.

## Nicht durchgeführte Prüfungen

- Anfragen mit einem Namen im Kopf `Host` an eine laufende Testumgebung habe ich nicht gesendet. Die Belege stammen aus dem installierten Code von Vite 8.3.1 und aus `testenv`.
- Das Prüfskript (Abnahmekriterium 3) gehört dem Tester Funktion. Ich habe es nicht ausgeführt.

## Zustand des Arbeitsverzeichnisses

Nach der Prüfung zeigte `git status --porcelain --ignored` nur die früheren, nicht committeten Testberichte. Dazu kommt dieser Bericht. Das für die Prüfung installierte `node_modules` habe ich wieder entfernt.
