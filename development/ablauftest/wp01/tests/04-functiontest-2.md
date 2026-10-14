# Testbericht Funktionstest, Auftrag 04, Durchlauf 2

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: Tester Funktion
- Übergabedokument: `development/ablauftest/wp01/tests/04-functiontest-2-order.md` auf Zweig `ablauftest/wp01`
- geprüfter Commit: `1148fa60f578ac54539b9642de8e3850e390bb02` (Zweig `ablauftest/wp01-04`, Elterncommit `62ebf6d1a4c6cebb3e97ab13390a0dad1f35f6ad`)
- Commit des Prüfskripts: `1148fa60f578ac54539b9642de8e3850e390bb02`. Ich habe das Prüfskript nicht geändert. Es wurde zuletzt in `9e1415f9f6b94b02b063ac7f192b978b9fd2caca` geändert (`git log -1 -- components/pipwerk-studio/scripts/check`). Einen Zweig `ablauftest/wp01-functiontest` habe ich nicht angelegt.
- Kontrolle des Stands: `git rev-parse HEAD` im Arbeitsverzeichnis ergab `1148fa60f578ac54539b9642de8e3850e390bb02`. `git ls-remote origin ablauftest/wp01-04` nennt denselben Commit.

## Ergebnis

**nicht bestanden**

Die Befunde F1 und F2 aus Durchlauf 1 und S1 aus dem Sicherheitstest sind behoben. Das Prüfskript besteht (letzte Zeile „check: all checks passed“). Die Meldungen von `start` und `status` bei `--host 0.0.0.0` stimmen mit der Dokumentation überein.

Die Änderung hat zwei neue Fehler verursacht:

- F3: Im Glossar der Anwenderdokumentation ist der Eintrag „nicht committete Änderung“ in die Zeile „Netzwerkadresse“ gerutscht. In der Tabelle fehlt er dadurch.
- F4: Die technische Dokumentation sagt allgemein, dass ein Name des Rechners abgewiesen wird und dass `vite preview` nur Adressen und `localhost` zulässt. Das stimmt nicht, wenn `--host` selbst einen Namen angibt. Das Skript lässt das ausdrücklich zu.

Damit ist Abnahmekriterium 1 nicht erfüllt („Jede Aussage zu Adresse und `--host` stimmt mit dem Code des Testumgebungsskripts überein“, F4). Die Anwenderdokumentation ist unvollständig (F3). Nach der Dokumentationspflicht gebe ich nicht frei.

## Kontrolle der vorherigen Befunde

| Befund | Ergebnis | Nachweis |
|---|---|---|
| F1, Zugriff über den Namen des Rechners | behoben, wie entschieden | `docs/user/pipwerk-studio.md`, Zeile 32: Andere Rechner verwenden die Netzwerkadresse. Ein Name wie `mein-rechner` „funktioniert nicht, pipwerk Studio weist die Anfrage ab“. Der Glossareintrag „Name des Rechners“ ist entfernt, und kein Text verweist mehr darauf (`grep` nach „Name des Rechners“ und „Hostname“ in `docs/user/pipwerk-studio.md`: kein Treffer). `docs/technical/pipwerk-studio.md`, Zeile 294 nennt nur noch die Netzwerkadresse. Zeile 295 nennt den Grund: Prüfung des Kopfs `Host`, kein `allowedHosts`, Schutz vor DNS-Rebinding. `components/pipwerk-studio/frontend/vite.config.ts` ist unverändert und hat kein `allowedHosts` (Zeilen 45 bis 49). Für den Befehl der Anwenderdokumentation (`--host 0.0.0.0`) und für eine einzelne Netzwerkadresse stimmt die Aussage mit Vite 8.3.1 überein (`node_modules/vite/dist/node/chunks/node.js`, Zeilen 16832 bis 16844, 16890 bis 16900, 35421 und 35422, 37465 bis 37468). Den allgemeinen Satz in Zeile 295 betrifft der neue Befund F4. |
| F2, Regel von `url_host` in Abschnitt 4a | behoben | `docs/technical/pipwerk-studio.md`, Zeile 294 gibt alle vier Fälle wieder: `0.0.0.0` wird `127.0.0.1`, `::` wird `[::1]`, jeder Wert mit Doppelpunkt steht in eckigen Klammern, jeder andere Wert gilt unverändert. Das entspricht `components/pipwerk-studio/scripts/testenv`, Zeilen 157 bis 164, in Reihenfolge und Inhalt. |
| S1, Sicherheitshinweis vor dem Befehl | behoben | `docs/user/pipwerk-studio.md`, Zeile 32: Der Absatz beginnt mit „Achtung, lesen Sie zuerst diesen Hinweis.“ Es folgen keine Anmeldung, Einstellungen änderbar und nur in einem vertrauenswürdigen Netz. Erst danach steht der Befehl mit `--host 0.0.0.0`. Der Inhalt des bisherigen Hinweises ist vollständig erhalten. |

## Neue Befunde

### F3: Glossareintrag „nicht committete Änderung“ fehlt in der Tabelle

Fundstelle: `docs/user/pipwerk-studio.md`, Zeile 168

Sachverhalt:

- Im Commit wurde der Eintrag „Name des Rechners“ entfernt. Dabei ist der Zeilenumbruch zwischen den Einträgen „Netzwerkadresse“ und „nicht committete Änderung“ verloren gegangen. Zeile 168 endet jetzt mit `… alle Netzwerkadressen dieses Rechners. || nicht committete Änderung | Eine Änderung an einer Datei … (verwerfen). |`. Im Elterncommit `62ebf6d…` waren das zwei eigene Zeilen (Diff `62ebf6d…1148fa6`, Datei `docs/user/pipwerk-studio.md`, Abschnitt `@@ -165,9 +165,7 @@`).
- Die Tabelle hat zwei Spalten (Zeilen 155 und 156). Zeile 168 hat jetzt fünf Zellen. Nach der Spezifikation von GitHub Flavored Markdown (Abschnitt „Tables“) werden Zellen über die Zahl der Kopfzellen hinaus verworfen. Dargestellt wird nur „Netzwerkadresse“ mit seiner Erklärung. Der Begriff „nicht committete Änderung“ und seine Erklärung fehlen in der dargestellten Tabelle. Die Darstellung selbst habe ich nicht gesehen. Der Befund stützt sich auf den Quelltext und die Spezifikation.
- Auf diesen Eintrag verweisen Zeile 38 („Zu „nicht committete Änderung“ siehe Glossar in Abschnitt 7.“) und Zeile 177 (Eintrag „ausgecheckt“: „steht unter „nicht committete Änderung““). Er erklärt auch Zeile 164 (Eintrag „Testumgebung“) und Zeile 34 (Abbruch bei einer nicht committeten Änderung). Diese Verweise laufen ins Leere.
- Der Befund liegt außerhalb der Befunde F1, F2 und S1. Er ist durch die Änderung seit `62ebf6d…` entstanden.

### F4: „Ein Name des Rechners wird abgewiesen“ gilt nicht, wenn `--host` einen Namen angibt

Fundstellen:

- `docs/technical/pipwerk-studio.md`, Zeile 295: „Andere Rechner müssen die Netzwerkadresse des Rechners verwenden. Ein Name des Rechners wird abgewiesen. Grund: `vite preview` prüft den Kopf `Host` der Anfrage und lässt nur Adressen und `localhost` zu; die Konfiguration setzt kein `allowedHosts`.“
- `docs/technical/pipwerk-studio.md`, Zeile 491 (Abschnitt 8): „`vite preview` prüft den Kopf `Host` der Anfragen (Schutz vor DNS-Rebinding) und weist Anfragen mit einem Namen des Rechners ab“

Sachverhalt:

- Das Testumgebungsskript nimmt für `--host` ausdrücklich einen Namen an: Fehlermeldung „--host must be an address or a host name“ und Zeichen `A-Za-z0-9.:_-` (`components/pipwerk-studio/scripts/testenv`, Zeile 215). Der Wert wird unverändert an `vite preview --host` weitergegeben (Zeilen 280 und 281). `url_host` meldet ihn unverändert (Zeile 162). Abschnitt 4a, Zeile 294 beschreibt diesen Fall selbst („jeder andere Wert gilt unverändert“).
- Vite 8.3.1 übernimmt den Wert von `--host` als `preview.host` (`node_modules/vite/dist/node/cli.js`, Zeilen 819 bis 823). Dieser Wert kommt zur Liste der erlaubten Namen hinzu (`node.js`, Zeile 16894 in `getAdditionalAllowedHosts` und Zeilen 37465 bis 37468). Ein Name in dieser Liste wird durchgelassen (`node.js`, Zeile 16840).
- Folge: Mit `--host <Name des Rechners>` lässt `vite preview` Anfragen mit genau diesem Namen im Kopf `Host` zu. Dann sind die Aussagen „Andere Rechner müssen die Netzwerkadresse verwenden“, „Ein Name des Rechners wird abgewiesen“ und „lässt nur Adressen und `localhost` zu“ falsch. Außerdem lässt `vite preview` immer auch jeden Namen auf `.localhost` zu (`node.js`, Zeile 16838). Auch das fehlt in der Regel „nur Adressen und `localhost`“.
- Die Anwenderdokumentation ist nicht betroffen. Ihr Satz in Zeile 32 bezieht sich auf den Befehl mit `0.0.0.0`, und dort stimmt er.

Nachweisweg: Code des Testumgebungsskripts und installierter Code von Vite. Eine Anfrage mit einem Namen im Kopf `Host` konnte ich nicht senden, weil `curl` in meiner Ausführungsumgebung wieder abgelehnt wurde (Hinweis H2). Einen Start mit einem Namen in `--host` habe ich nicht ausgeführt.

## Prüfung der Abnahmekriterien

| Nr. | Ergebnis | Nachweis |
|---|---|---|
| 1, B4 behoben, jede Aussage zu Adresse und `--host` stimmt mit dem Code überein | **nicht erfüllt** | Erfüllt sind: Schritt 2 (Zeile 28), Schritt 3 (Zeile 29) und Zeile 32 der Anwenderdokumentation (siehe Tabelle der vorherigen Befunde und Lauf der Testumgebung). Abschnitt 4a, Zeile 294 stimmt mit `url_host` überein. Nicht erfüllt: F4. |
| 2, jeder Befehl ausführbar, wie er dasteht | erfüllt, mit derselben Einschränkung wie in Durchlauf 1 | Die Befehle sind unverändert. Nur ihre Stellung in Zeile 32 hat sich geändert. Den Befehl mit `--host 0.0.0.0` habe ich in derselben Form ausgeführt. Ich habe nur die Platzhalter durch Ports ersetzt und den vollständigen Pfad verwendet. `status` und `stop` habe ich ebenfalls mit vollständigem Pfad ausgeführt. Die Form mit relativem Pfad weisen die Fälle in `backend/tests/test_testenv.py` nach (im Prüfskript bestanden). |
| Glossar | **nicht erfüllt** | F3. Der Eintrag „Netzwerkadresse“ selbst ist unverändert und richtig. Der Fließtext verweist darauf (Zeilen 28 und 32). |
| 3, Prüfskript besteht | erfüllt | siehe Abschnitt „Prüfskript“ |
| 4, ein Commit im Zweig `ablauftest/wp01-04` | erfüllt | `1148fa6…` ist der Stand von `origin/ablauftest/wp01-04`. Elterncommit ist `62ebf6d…`. `git diff --stat 62ebf6d… 1148fa6…`: nur `docs/technical/pipwerk-studio.md` (5 Zeilen) und `docs/user/pipwerk-studio.md` (6 Zeilen). Keine Änderung an Code, Tests oder Skripten. Autor `macodix`. In der Commit-Nachricht und im Diff wird weder „Claude“ noch „Anthropic“ genannt. |
| Konfiguration von Vite unverändert (Entscheidung zu F1) | erfüllt | `vite.config.ts` ist im Diff nicht enthalten. |

## Lauf der Testumgebung

Wie in Durchlauf 1 bricht `start` in meinem Arbeitsverzeichnis ab, weil dort die nicht committeten Berichte liegen. Ich habe deshalb ein zweites Arbeitsverzeichnis `testenv-run` unter meinem Arbeitsverzeichnis angelegt (`git worktree add --detach … 1148fa6…`). Dort ergab `git rev-parse HEAD` `1148fa60f578ac54539b9642de8e3850e390bb02`, und `git status --porcelain --ignored` war leer. Die Ports 18610 und 18611 habe ich nicht verwendet.

1. `<testenv-run>/components/pipwerk-studio/scripts/testenv start --frontend-port 28541 --backend-port 28542 --host 0.0.0.0`: letzte Zeile „testenv: pipwerk Studio is running: http://127.0.0.1:28541/ (backend on 127.0.0.1:28542)“.
2. `status`: „testenv: running“, „user interface: http://127.0.0.1:28541/“, „backend: http://127.0.0.1:28542/“. Die Adresse ist dieselbe wie bei `start`, wie Zeile 32 der Anwenderdokumentation und Zeile 294 der technischen Dokumentation sagen.
3. `ss -ltn`: Die Oberfläche lauscht auf `0.0.0.0:28541`, das Backend auf `127.0.0.1:28542`.
4. Eine Anfrage mit einem Namen im Kopf `Host` mit `curl` wurde abgelehnt (H2).
5. `stop`: „testenv: test environment stopped“. Danach `status`: „testenv: not running“. `ss` zeigte die Ports 28541 und 28542 nicht mehr. `.testenv` war nicht mehr vorhanden.
6. Das zweite Arbeitsverzeichnis habe ich mit `git worktree remove --force` entfernt. `git worktree list` nennt es nicht mehr.

## Prüfskript

Aufruf: `<Arbeitsverzeichnis>/components/pipwerk-studio/scripts/check --backend-port 28551 --frontend-port 28550`, ohne `--with-audit`. Erste Zeile: „check: checking <Arbeitsverzeichnis> at commit 1148fa60f578ac54539b9642de8e3850e390bb02“. Ende: „check: all checks passed“. Ich habe das Skript zweimal vollständig ausgeführt: einmal mit dem Ende der Ausgabe und einmal gefiltert auf die Zeilen mit den Ergebnissen. Beide Läufe sind bestanden.

| Prüfung | Ergebnis |
|---|---|
| `uv sync --frozen` | bestanden |
| pytest | 148 bestanden |
| ruff check, ruff format --check, mypy | bestanden |
| Schreibweise des Namens | „338 mentions checked, all spelled correctly“ (Durchlauf 1: 337. Woher die zusätzliche Nennung kommt, habe ich nicht untersucht. Die Prüfung ist bestanden.) |
| `npm ci` | bestanden. Meldet eine Sicherheitslücke hoher Stufe. Das ist der bekannte Befund aus Abschnitt 7 der technischen Dokumentation. |
| typecheck | bestanden |
| Vitest | 14 Dateien, 244 Tests bestanden |
| Build | bestanden |
| Browsertest Chromium, Firefox, WebKit | 39 bestanden, 6 übersprungen (je Browser die zwei vorgesehenen Fälle „without a Git working tree“) |

Das Prüfskript prüft keine Markdown-Tabellen. Deshalb hat es F3 nicht erkannt. Abschnitt 6.4 der technischen Dokumentation und das Prüfskript sind in diesem Commit nicht geändert. Das Prüfskript braucht für diesen Auftrag keine Änderung, weil der Commit nur Dokumentation ändert.

## Hinweise

- H1 (wie Durchlauf 1): Für `url_host` und für die gemeldete Adresse bei `--host` gibt es keinen automatischen Test. Das ist kein Befund zu diesem Auftrag, weil er Änderungen an Tests ausschließt.
- H2, Prüfweg (wie Durchlauf 1, weiter offen): In meiner Ausführungsumgebung wurde `curl` wieder abgelehnt. F1 und F4 kann ich deshalb nur mit dem Code belegen, nicht mit einer Anfrage. Benötigt wird eine Entscheidung, ob der Tester Funktion HTTP-Anfragen an die eigene Testumgebung senden darf. Zuständig ist, wer die Berechtigungen der Tester festlegt. Die übrigen Prüfungen hängen davon nicht ab.
- H3: Die Testumgebung in `test/ablauftest-wp01/` habe ich weder gestartet noch beendet noch verändert.
- H4: In meinem Arbeitsverzeichnis zeigt `git status --porcelain` nur die früheren Berichte und diesen Bericht. Ignorierte Abhängigkeiten und Bauergebnisse des Prüfskripts bleiben liegen.
