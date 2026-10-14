# Testbericht Funktionstest, Auftrag 04, Durchlauf 1

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: Tester Funktion
- Übergabedokument: `development/ablauftest/wp01/tests/04-functiontest-1-order.md` auf Zweig `ablauftest/wp01`
- geprüfter Commit: `62ebf6d1a4c6cebb3e97ab13390a0dad1f35f6ad` (Zweig `ablauftest/wp01-04`)
- Commit des Prüfskripts: `62ebf6d1a4c6cebb3e97ab13390a0dad1f35f6ad`. Ich habe das Prüfskript nicht geändert. Es wurde zuletzt in `9e1415f9f6b94b02b063ac7f192b978b9fd2caca` geändert. Einen Zweig `ablauftest/wp01-functiontest` habe ich nicht angelegt.

## Ergebnis

**nicht bestanden**

Das Prüfskript besteht (Exitcode 0). Die Meldungen von `start` und `status` bei `--host 0.0.0.0` stimmen mit der Dokumentation überein. Der ursprüngliche Befund B4 ist in diesem Punkt behoben.

Nicht erfüllt ist Abnahmekriterium 1 („Jede Aussage zu Adresse und `--host` stimmt mit dem Code überein“). Die neue Aussage, dass andere Rechner pipwerk Studio über den Namen des Rechners erreichen, widerspricht der Konfiguration von `vite preview` (F1). Eine weitere Aussage in Abschnitt 4a der technischen Dokumentation stimmt bei IPv6-Adressen nicht mit `url_host` überein (F2).

## Befunde

### F1: Zugriff über den Namen des Rechners wird von `vite preview` abgewiesen

Fundstellen:

- `docs/user/pipwerk-studio.md`, Zeile 32: „Andere Rechner verwenden statt `127.0.0.1` die Netzwerkadresse oder den Namen Ihres Rechners (siehe Glossar), also `http://<Netzwerkadresse oder Name des Rechners>:<Port der Oberfläche>/`.“
- `docs/technical/pipwerk-studio.md`, Zeile 294: „… und von anderen Rechnern unter einer Netzwerkadresse oder dem Namen des Rechners erreichbar.“
- Folge für den Glossareintrag „Name des Rechners“ (`docs/user/pipwerk-studio.md`, Zeile 169), den der Fließtext nur für diesen Zugriffsweg einführt.

Sachverhalt:

- `components/pipwerk-studio/frontend/vite.config.ts`, Abschnitt `preview`: Es gibt kein `allowedHosts`. Vite in der festgelegten Version `8.3.1` (`frontend/package.json`, Zeile 41) prüft deshalb bei `vite preview` den Kopf `Host` jeder Anfrage.
- `frontend/node_modules/vite/dist/node/chunks/node.js` (Vite 8.3.1):
  - Zeilen 35421 und 35422: `vite preview` setzt die Prüfung des Kopfs `Host` ein, solange `preview.allowedHosts` nicht `true` ist.
  - Zeilen 16832 bis 16844: Durchgelassen werden IPv4- und IPv6-Adressen, `localhost` und Namen auf `.localhost` sowie die Einträge der Liste. Jeder andere Name wird abgewiesen.
  - Zeilen 16872 bis 16884 und 16906: Eine abgewiesene Anfrage erhält HTTP 403 mit dem Text „Blocked request. This host (…) is not allowed. …“.
  - Zeilen 16890 bis 16900 und 37465 bis 37468: Zur Liste kommen nur `server.host` (`127.0.0.1` aus `vite.config.ts`) und `preview.host`. `preview.host` ist der Wert von `--host`, beim Beispiel der Dokumentation also `0.0.0.0`.
- Ein Browser auf einem anderen Rechner, der `http://<Name des Rechners>:<Port der Oberfläche>/` aufruft, sendet den Namen im Kopf `Host`. Beim dokumentierten Befehl mit `--host 0.0.0.0` erhält er deshalb HTTP 403 statt pipwerk Studio. Das gilt genauso, wenn mit `--host` eine einzelne Netzwerkadresse angegeben ist. Über eine Netzwerkadresse (IPv4) ist der Zugriff möglich.

Nachweisweg: Der Befund stützt sich auf `vite.config.ts` und den installierten Code von Vite. Eine Anfrage an die laufende Testumgebung mit einem Namen im Kopf `Host` konnte ich nicht senden: In meiner Ausführungsumgebung wurde der Aufruf von `curl` abgelehnt (Hinweis H2).

### F2: Adresse bei IPv6-Adressen außer `::` in Abschnitt 4a

Fundstelle: `docs/technical/pipwerk-studio.md`, Zeile 294, „Oberfläche: `http://<host>:<frontend-port>/`. Diese Adresse nennen `start` am Ende und `status`.“ Ausgenommen werden nur `0.0.0.0` und `::`.

Sachverhalt: `components/pipwerk-studio/scripts/testenv`, Zeile 161 (`*:*) printf '[%s]' "$1"`): Bei jeder anderen IPv6-Adresse in `--host`, zum Beispiel `::1`, melden `start` (Zeilen 303 und 304) und `status` (Zeilen 328 und 329) die Adresse in eckigen Klammern, also `http://[::1]:<frontend-port>/`. Nach Zeile 294 wäre es `http://::1:<frontend-port>/`. Die Zeile wurde in diesem Commit geändert und nennt `url_host` als Grundlage. Die Zeichen `:` sind in `--host` zulässig (Zeile 215). Die Anwenderdokumentation ist davon nicht betroffen, weil sie IPv6 nicht nennt.

## Prüfung der Schwerpunkte und Abnahmekriterien

| Nr. | Ergebnis | Nachweis |
|---|---|---|
| 1, B4 behoben, Aussagen stimmen mit dem Code überein | **nicht erfüllt** | Erfüllt sind: Schritt 2 (Zeile 28) nennt die Adresse aus der Meldung am Ende von `start` und aus `status`. Ohne `--host` ist das `http://127.0.0.1:<Port>/` (`testenv`, Zeile 191, Zeilen 303 und 304). Der Satz „Nur wenn Sie … gilt diese Adresse.“ ist entfallen. Zeile 32: Bei `0.0.0.0` gilt auf dem eigenen Rechner `127.0.0.1` (`url_host`, Zeile 159). Bei einer einzelnen Adresse nennt das Skript diese Adresse (Zeile 162), und `vite preview` bindet sich nur an diese Adresse (Zeile 281). Ohne `--host` ist pipwerk Studio nur vom eigenen Rechner erreichbar (Bindung an `127.0.0.1`). Der Sicherheitshinweis ist inhaltlich erhalten. Schritt 3 (Zeile 29): `status` nennt Adressen und Ports von Oberfläche und Backend (Zeilen 327 bis 330). Abschnitt 4a, Zeile 294: Meldungen bei `0.0.0.0` und `::` stimmen mit `url_host` überein. Nicht erfüllt: F1 und F2. |
| Lauf mit `--host 0.0.0.0` | erfüllt | siehe Abschnitt „Lauf der Testumgebung“ |
| 2, jeder Befehl ausführbar, wie er dasteht | erfüllt, mit Einschränkung | Der neue Befehl in Zeile 32 hat dieselbe Form und Reihenfolge wie mein Lauf. Ich habe nur die Platzhalter durch Ports ersetzt und den vollständigen Pfad verwendet. Die Parameter entsprechen `cmd_start` (Zeilen 192 bis 205). Die Schritte 2 und 3 zeigen `status`; `status` und `stop` habe ich mit vollständigem Pfad ausgeführt. Die Form mit relativem Pfad durfte ich nicht ausführen (H2). Die Ausführung mit relativem Pfad weisen die Fälle in `backend/tests/test_testenv.py` nach (im Prüfskript bestanden). |
| Glossar „Netzwerkadresse“, „Name des Rechners“ | erfüllt | Zeilen 168 und 169: Einträge in ganzen Sätzen mit Beispiel. `127.0.0.1` ist als Adresse des eigenen Rechners erklärt, `0.0.0.0` als „alle Netzwerkadressen dieses Rechners“. „Hostname“ ist als anderes Wort genannt. Stil und Form der Tabelle passen zu den übrigen Einträgen. Der Fließtext verweist darauf (Zeilen 28 und 32). Der Inhalt des Eintrags „Name des Rechners“ ist richtig. Den Zugriffsweg, für den er eingeführt wird, betrifft F1. |
| 3, Prüfskript besteht | erfüllt | siehe Abschnitt „Prüfskript“ |
| 4, ein Commit im Zweig `ablauftest/wp01-04` | erfüllt | `git diff --stat 2a153d3… 62ebf6d…`: nur `docs/technical/pipwerk-studio.md` (1 Zeile) und `docs/user/pipwerk-studio.md` (8 Zeilen). `2a153d3…` ist Vorfahre (`git merge-base --is-ancestor`). Keine Änderung an Code, Tests oder Skripten. |
| Abschnitt 4a nur bei Widerspruch angeglichen | erfüllt | Die alte Zeile `http://<host>:<frontend-port>/` widersprach bei `0.0.0.0` dem Code. Die Angleichung betrifft nur diese Zeile; zu ihrem Inhalt siehe F1 und F2. |

## Lauf der Testumgebung

In meinem Arbeitsverzeichnis liegen die nicht committeten früheren Testberichte. Dort bricht `start` immer ab (`testenv`, Zeilen 224 bis 230). Für den Lauf habe ich deshalb ein zweites Arbeitsverzeichnis als Unterverzeichnis `testenv-run` meines Arbeitsverzeichnisses angelegt (`git worktree add --detach … 62ebf6d…`). Dort ergab `git rev-parse HEAD` `62ebf6d1a4c6cebb3e97ab13390a0dad1f35f6ad`, `git status --porcelain --ignored` war leer. Die Ports 18610 und 18611 habe ich nicht verwendet.

1. `<testenv-run>/components/pipwerk-studio/scripts/testenv start --frontend-port 28541 --backend-port 28542 --host 0.0.0.0`: letzte Zeile „testenv: pipwerk Studio is running: http://127.0.0.1:28541/ (backend on 127.0.0.1:28542)“.
2. `status`: „testenv: running“, „user interface: http://127.0.0.1:28541/“, „backend: http://127.0.0.1:28542/“. Die Adresse ist dieselbe wie bei `start`.
3. `ss -ltn`: Die Oberfläche lauscht auf `0.0.0.0:28541`, das Backend auf `127.0.0.1:28542`. Das passt zu Zeile 32 der Anwenderdokumentation und zu Abschnitt 4a, Schritt 1.
4. `start` hat beim Warten `/api/health` über `http://127.0.0.1:28541` mit `{"status": "ok"}` erreicht (`testenv`, Zeilen 288 bis 299). Damit ist die Oberfläche auf dem eigenen Rechner unter `127.0.0.1` erreichbar.
5. `stop`: „testenv: test environment stopped“. Danach `status`: „testenv: not running“. `ss` zeigte keine Ports 28541 und 28542 mehr. `.testenv/` war nicht mehr vorhanden.
6. Danach habe ich das zweite Arbeitsverzeichnis mit `git worktree remove --force` entfernt. `git worktree list` nennt es nicht mehr.

## Prüfskript

Aufruf: `<Arbeitsverzeichnis>/components/pipwerk-studio/scripts/check --backend-port 28551 --frontend-port 28550`, ohne `--with-audit`. Erste Zeile: „check: checking … at commit 62ebf6d1a4c6cebb3e97ab13390a0dad1f35f6ad“. Ende: „check: all checks passed“, Exitcode 0.

| Prüfung | Ergebnis |
|---|---|
| `uv sync --frozen` | bestanden |
| pytest | 148 bestanden |
| ruff check, ruff format --check, mypy | bestanden |
| Schreibweise des Namens | „337 mentions checked, all spelled correctly“ |
| `npm ci` | bestanden. Meldet eine Sicherheitslücke hoher Stufe; das ist der bekannte Befund aus Abschnitt 7 der technischen Dokumentation. |
| typecheck | bestanden |
| Vitest | 14 Dateien, 244 Tests bestanden |
| Build | bestanden |
| Browsertest Chromium, Firefox, WebKit | 39 bestanden, 6 übersprungen (je Browser die zwei Fälle „without a Git working tree“, vorgesehen im Git-Arbeitsbereich) |

Abschnitt 6.4 der technischen Dokumentation und das Prüfskript sind in diesem Commit nicht geändert. Das Prüfskript braucht für diesen Auftrag keine Änderung, weil der Commit nur Dokumentation ändert.

## Hinweise

- H1: Für `url_host` und die gemeldete Adresse bei `--host` gibt es keinen automatischen Test. `backend/tests/test_testenv.py` nennt `--host` nur bei einem ungültigen Wert (Zeile 343). Das Verhalten bei `0.0.0.0` belegt in diesem Durchlauf nur mein Lauf von Hand. Das ist kein Befund zu diesem Auftrag, weil er Änderungen an Tests ausschließt.
- H2, Prüfweg: In meiner Ausführungsumgebung wurden `curl` und der Aufruf des Testumgebungsskripts mit relativem Pfad abgelehnt. Deshalb konnte ich F1 nicht mit einer Anfrage belegen und die Befehle nur mit vollständigem Pfad ausführen. Benötigt wird eine Entscheidung, ob der Tester Funktion HTTP-Anfragen an die eigene Testumgebung und Befehle mit relativem Pfad ausführen darf. Zuständig ist, wer die Berechtigungen der Tester festlegt. Die übrigen Prüfungen hängen davon nicht ab.
- H3: Die Testumgebung in `test/ablauftest-wp01/` habe ich weder gestartet noch beendet noch verändert.
- H4: In meinem Arbeitsverzeichnis zeigt `git status --porcelain` nur die zwölf früheren Berichte und diesen Bericht. Ignorierte Abhängigkeiten und Bauergebnisse des Prüfskripts bleiben liegen.
