# Testbericht Funktionstest, Auftrag 04, Durchlauf 3

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: Tester Funktion
- Übergabedokument: `development/ablauftest/wp01/tests/04-functiontest-3-order.md` auf Zweig `ablauftest/wp01`
- geprüfter Commit: `7c1a6b3214e17b8b292670a6e29a0cbe01b83637` (Zweig `ablauftest/wp01-04`, Elterncommit `1148fa60f578ac54539b9642de8e3850e390bb02`)
- Commit des Prüfskripts: `7c1a6b3214e17b8b292670a6e29a0cbe01b83637`. Ich habe das Prüfskript nicht geändert. Es wurde zuletzt in `9e1415f9f6b94b02b063ac7f192b978b9fd2caca` geändert (`git log -1 -- components/pipwerk-studio/scripts/check`). Einen Zweig `ablauftest/wp01-functiontest` habe ich nicht angelegt.
- Kontrolle des Stands: `git rev-parse HEAD` im Arbeitsverzeichnis ergab `7c1a6b3214e17b8b292670a6e29a0cbe01b83637`. `git ls-remote origin ablauftest/wp01-04` nennt denselben Commit.

## Ergebnis

**bestanden**

Die Befunde F3 und F4 aus Durchlauf 2 sind behoben. Dasselbe gilt für die gleichlautenden Befunde S2 und S3 des Sicherheitstests, soweit sie den Funktionstest betreffen. Die Änderung hat keinen neuen Fehler verursacht. Das Prüfskript besteht (letzte Zeile „check: all checks passed“). Die Meldungen von `start` und `status` bei `--host 0.0.0.0` stimmen mit der Dokumentation überein. Alle Abnahmekriterien von Auftrag 04 sind erfüllt. Zwei Einschränkungen des Prüfwegs stehen unter „Hinweise“ (H1 und H2).

## Geprüfter Umfang

`git diff --stat 1148fa6… 7c1a6b3…`: Es sind genau zwei Dateien geändert, mit 4 Zeilen hinzu und 3 Zeilen weg.

- `docs/user/pipwerk-studio.md`: Glossar, Zeilen 168 und 169
- `docs/technical/pipwerk-studio.md`: Abschnitt 4a, Zeile 295, und Abschnitt 8, Zeile 491

Code, Tests, Skripte und `vite.config.ts` sind nicht geändert.

## Kontrolle der vorherigen Befunde

| Befund | Ergebnis | Nachweis |
|---|---|---|
| F3 (S2), Glossareintrag „nicht committete Änderung“ fehlt in der Tabelle | behoben | `docs/user/pipwerk-studio.md`: Zeile 168 enthält nur noch den Eintrag „Netzwerkadresse“ und endet mit `… alle Netzwerkadressen dieses Rechners. |`. Zeile 169 ist wieder der eigene Eintrag „nicht committete Änderung“. Sein Text ist Wort für Wort derselbe wie im Elterncommit, nur auf eigener Zeile (Diff `1148fa6…7c1a6b3`, Abschnitt `@@ -165,7 +165,8 @@`). Ich habe die Tabelle in den Zeilen 155 bis 187 Zeile für Zeile durchgesehen. Jede Zeile hat genau zwei Zellen. Die Verweise in Zeile 38 („siehe Glossar in Abschnitt 7“) und Zeile 178 (Eintrag „ausgecheckt“: „steht unter „nicht committete Änderung““) haben wieder ein Ziel. Die Darstellung selbst habe ich nicht gesehen. Der Nachweis stützt sich auf den Quelltext. |
| F4 (S3), „Ein Name des Rechners wird abgewiesen“ gilt nicht, wenn `--host` einen Namen angibt | behoben | siehe unten, Abgleich jeder Aussage mit dem Code |

### Abgleich von Abschnitt 4a, Zeile 295, mit dem Code

Code: `components/pipwerk-studio/scripts/testenv` und installierter Code von Vite 8.3.1 (`frontend/node_modules/vite/package.json`, Zeile 3: `"version": "8.3.1"`, installiert durch das Prüfskript mit `npm ci`). Zeilenangaben ohne Datei beziehen sich auf `node_modules/vite/dist/node/chunks/node.js`.

| Aussage | Ergebnis | Nachweis |
|---|---|---|
| „`vite preview` prüft den Kopf `Host` jeder Anfrage (Schutz vor DNS-Rebinding).“ | stimmt | Zeile 35422: Die Prüfung wird eingesetzt, wenn `allowedHosts` nicht `true` ist und kein HTTPS verwendet wird. `vite.config.ts` setzt weder `allowedHosts` noch `https` (Zeilen 37 bis 49). Voreinstellung von `allowedHosts` ist eine Liste (Zeile 35358 übernimmt `server.allowedHosts`). Zu Anfragen ohne Kopf `Host` siehe H3. |
| „Zugelassen sind IP-Adressen, `localhost` und Namen auf `.localhost` sowie der mit `--host` angegebene Wert.“ | stimmt | Zeile 16836: IPv4- und IPv6-Adressen werden zugelassen. Zeile 16838: `localhost` und jeder Name auf `.localhost`. Zeilen 16839 und 16840: jeder Eintrag der Liste. In die Liste kommt `preview.host` (Zeile 16894, Zeilen 37466 bis 37468). `vite preview --host <Wert>` setzt `preview.host` (`node_modules/vite/dist/node/cli.js`, Zeilen 819 bis 823). `testenv` gibt `--host` unverändert an `vite preview --host` weiter (Zeilen 280 und 281). Außerdem kommt `server.host` aus `vite.config.ts`, Zeile 38, in die Liste. Das ist `127.0.0.1`, also eine IP-Adresse, und ändert die Aussage nicht. |
| „Die Konfiguration setzt kein `allowedHosts`.“ | stimmt | `vite.config.ts`, Zeilen 32 bis 55: kein `allowedHosts`. |
| „Beim Start mit `--host 0.0.0.0` oder mit einer Netzwerkadresse verwenden andere Rechner deshalb die Netzwerkadresse. Ein Name des Rechners wird dann mit HTTP 403 abgewiesen.“ | stimmt | Mit einer Adresse in `--host` enthält die Liste nur Adressen. Ein Name, der weder `localhost` ist noch auf `.localhost` endet, wird abgewiesen (Zeile 16843). Die Antwort ist HTTP 403 (Zeile 16878). |
| „Ist mit `--host` ein Name angegeben, ist genau dieser Name zugelassen.“ | stimmt | `testenv`, Zeile 215 lässt einen Namen zu. Zeile 16840 vergleicht exakt (`allowedHost === hostname`). Ein Wert mit führendem Punkt würde nach Zeile 16841 auch Unternamen zulassen. Ein solcher Wert scheitert aber schon an der Bindung (`port_free "$host"`, `testenv`, Zeile 249). Für einen gültigen Namen gilt die Aussage. |

Zeile 295 widerspricht Zeile 294 (Regel von `url_host`) nicht. Zeile 294 ist unverändert und stimmt weiter mit `testenv`, Zeilen 157 bis 164, überein.

### Abgleich von Abschnitt 8, Zeile 491, mit dem Code

Der geänderte Satz lautet: „`vite preview` prüft den Kopf `Host` jeder Anfrage (Schutz vor DNS-Rebinding) und lässt nur IP-Adressen, `localhost`, Namen auf `.localhost` und den mit `--host` angegebenen Wert zu; die Konfiguration setzt kein `allowedHosts` (Einzelheiten in Abschnitt 4a).“ Er sagt inhaltlich dasselbe wie Zeile 295 und stimmt mit denselben Nachweisen. Die frühere allgemeine Aussage „weist Anfragen mit einem Namen des Rechners ab“ ist entfernt. `grep` nach „Host“ und „allowedHosts“ in `docs/technical/pipwerk-studio.md` findet nur die Zeilen 295 und 491. Es gibt keine weitere Stelle mit der alten Aussage.

### Anwenderdokumentation

`docs/user/pipwerk-studio.md`, Zeile 32 ist unverändert. Der Satz „ein Name wie `mein-rechner` … funktioniert nicht, pipwerk Studio weist die Anfrage ab“ bezieht sich auf den Befehl mit `--host 0.0.0.0` und stimmt dafür (siehe Tabelle oben). Er widerspricht der neuen Zeile 295 nicht.

## Neue Befunde

Keine.

## Prüfung der Abnahmekriterien

| Nr. | Ergebnis | Nachweis |
|---|---|---|
| 1, B4 behoben, jede Aussage zu Adresse und `--host` stimmt mit dem Code überein | erfüllt | Anwenderdokumentation Zeilen 28, 29 und 32 unverändert und wie in Durchlauf 2 belegt. Technische Dokumentation Zeilen 294, 295 und 491: siehe Abgleich oben. Lauf der Testumgebung: siehe unten. |
| 2, jeder Befehl ausführbar, wie er dasteht | erfüllt, mit derselben Einschränkung wie in Durchlauf 1 und 2 | Die Befehle sind seit Durchlauf 2 unverändert. Den Befehl mit `--host 0.0.0.0` habe ich in derselben Form ausgeführt. Ich habe nur die Platzhalter durch Ports ersetzt und den vollständigen Pfad verwendet. Die Form mit relativem Pfad weisen die Fälle in `backend/tests/test_testenv.py` nach (im Prüfskript bestanden). |
| Glossar | erfüllt | Eintrag „Netzwerkadresse“ (Zeile 168) unverändert und richtig. Eintrag „nicht committete Änderung“ (Zeile 169) wieder vorhanden. Der Fließtext verweist auf das Glossar (Zeilen 28 und 32). |
| 3, Prüfskript besteht | erfüllt | siehe Abschnitt „Prüfskript“ |
| 4, ein Commit im Zweig `ablauftest/wp01-04` | erfüllt | `7c1a6b3…` ist der Stand von `origin/ablauftest/wp01-04`. Elterncommit ist `1148fa6…`. Autor `macodix`. In der Commit-Nachricht und im Diff wird weder „Claude“ noch „Anthropic“ genannt. Keine Änderung an Code, Tests oder Skripten. |
| Konfiguration von Vite unverändert (Entscheidung zu F1) | erfüllt | `vite.config.ts` ist im Diff nicht enthalten. |
| Keine Rechnernamen, Benutzernamen, Pfade oder Zugangsdaten | erfüllt | Die hinzugefügten Zeilen des Diffs enthalten nur `.localhost`, `localhost`, `0.0.0.0`, `allowedHosts` und `--host`, keine Angaben des Entwicklungsrechners. |

## Lauf der Testumgebung

`start` bricht in meinem Arbeitsverzeichnis ab, weil dort die nicht committeten Berichte liegen. Ich habe deshalb wie in Durchlauf 2 ein zweites Arbeitsverzeichnis `testenv-run` unter meinem Arbeitsverzeichnis angelegt (`git worktree add --detach … 7c1a6b3…`). Dort ergab `git rev-parse HEAD` `7c1a6b3214e17b8b292670a6e29a0cbe01b83637`, und `git status --porcelain --ignored` war leer. Die Ports 18610 und 18611 habe ich nicht verwendet.

1. `<testenv-run>/components/pipwerk-studio/scripts/testenv start --frontend-port 28541 --backend-port 28542 --host 0.0.0.0`: letzte Zeile „testenv: pipwerk Studio is running: http://127.0.0.1:28541/ (backend on 127.0.0.1:28542)“.
2. `status`: „testenv: running“, „user interface: http://127.0.0.1:28541/“, „backend: http://127.0.0.1:28542/“. Die Adresse ist dieselbe wie bei `start`, wie Zeile 32 der Anwenderdokumentation und Zeile 294 der technischen Dokumentation sagen.
3. `ss -ltn`: Die Oberfläche lauscht auf `0.0.0.0:28541`, das Backend auf `127.0.0.1:28542`.
4. Eine Anfrage mit einem Namen im Kopf `Host` mit `curl` wurde in meiner Ausführungsumgebung abgelehnt (H2).
5. `stop`: „testenv: test environment stopped“. Danach `status`: „testenv: not running“. `ss -ltn` zeigte die Ports 28541 und 28542 nicht mehr. `components/pipwerk-studio/.testenv` war nicht mehr vorhanden.
6. Das zweite Arbeitsverzeichnis habe ich mit `git worktree remove --force` entfernt. `git worktree list` nennt es nicht mehr.

## Prüfskript

Aufruf: `<Arbeitsverzeichnis>/components/pipwerk-studio/scripts/check --backend-port 28551 --frontend-port 28550`, ohne `--with-audit`. Erste Zeile: „check: checking <Arbeitsverzeichnis> at commit 7c1a6b3214e17b8b292670a6e29a0cbe01b83637“. Ende: „check: all checks passed“. Ich habe das Skript zweimal vollständig ausgeführt: einmal mit dem Ende der Ausgabe und einmal gefiltert auf die Zeilen mit den Ergebnissen. Beide Läufe sind bestanden.

| Prüfung | Ergebnis |
|---|---|
| `uv sync --frozen` | bestanden |
| pytest | 148 bestanden |
| ruff check, ruff format --check, mypy | bestanden |
| Schreibweise des Namens | „338 mentions checked, all spelled correctly“ |
| `npm ci` | bestanden. Meldet eine Sicherheitslücke hoher Stufe. Das ist der bekannte Befund aus Abschnitt 7 der technischen Dokumentation. |
| typecheck | bestanden |
| Vitest | 14 Dateien, 244 Tests bestanden |
| Build | bestanden |
| Browsertest Chromium, Firefox, WebKit | 39 bestanden, 6 übersprungen (je Browser die zwei vorgesehenen Fälle „without a Git working tree“) |

Abschnitt 6.4 der technischen Dokumentation und das Prüfskript sind in diesem Commit nicht geändert. Das Prüfskript braucht für diesen Auftrag keine Änderung, weil der Commit nur Dokumentation ändert.

## Hinweise

- H1 (wie Durchlauf 1 und 2): Für `url_host`, für die gemeldete Adresse bei `--host` und für die Prüfung des Kopfs `Host` gibt es keinen automatischen Test. Das ist kein Befund zu diesem Auftrag, weil er Änderungen an Tests ausschließt.
- H2, Prüfweg (wie Durchlauf 1 und 2, weiter offen): In meiner Ausführungsumgebung wurde `curl` wieder abgelehnt. Die Aussagen zur Prüfung des Kopfs `Host` (F4) kann ich deshalb nur mit dem Code belegen, nicht mit einer Anfrage. Benötigt wird eine Entscheidung, ob der Tester Funktion HTTP-Anfragen an die eigene Testumgebung senden darf. Zuständig ist, wer die Berechtigungen der Tester festlegt. Die übrigen Prüfungen hängen davon nicht ab.
- H3, Grenzfälle der Prüfung in Vite, kein Befund: Vite lässt außerdem Anfragen ohne Kopf `Host` durch (Zeile 16855) und Werte, die mit `file:` oder `<Name>-extension:` beginnen (Zeilen 16831 und 16833). Abschnitt 8 sagt „lässt nur … zu“. Ich werte das nicht als Befund. Beide Fälle enthalten weder eine Adresse noch einen Namen eines Rechners. Ein Browser sendet bei einem Aufruf über einen Namen immer diesen Namen im Kopf `Host`. Die Aussage zu Adressen und Namen, um die es in Abschnitt 4a und 8 geht, bleibt damit richtig.
- H4, Vorgabe des Softwarearchitekten nicht im Repository: Das Übergabedokument sagt, die Beschreibung folge dem Wortlaut, den der Softwarearchitekt vorgegeben hat. Diesen Wortlaut habe ich im Zweig `ablauftest/wp01` nicht gefunden (`git grep` nach „Wortlaut“ und „vorgegeben“ unter `development/ablauftest`; `orders/04.md` hat keinen Abschnitt dazu). Einen Abgleich mit dem Wortlaut konnte ich deshalb nicht machen. Ich habe stattdessen jede Aussage mit dem Code geprüft (siehe oben). Zuständig für die Ablage der Vorgabe ist der Softwarearchitekt.
- H5: Die Testumgebung in `test/ablauftest-wp01/` habe ich weder gestartet noch beendet noch verändert.
- H6: In meinem Arbeitsverzeichnis liegen außer den versionierten Dateien nur die früheren Berichte und dieser Bericht. Ignorierte Abhängigkeiten und Bauergebnisse des Prüfskripts bleiben liegen.
