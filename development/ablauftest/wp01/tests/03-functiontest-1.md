# Testbericht Funktion, Auftrag 03, Durchlauf 1

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: Tester Funktion
- Übergabedokument: `development/ablauftest/wp01/tests/03-functiontest-1-order.md` auf Zweig `ablauftest/wp01`
- geprüfter Commit: `74cc3edd5623b19f6e3778078f95be5a142c1fb9` (Zweig `ablauftest/wp01-03`, Elter `27678be771b96402262288695d35bac050d38058`)
- Commit des Prüfskripts: `74cc3edd5623b19f6e3778078f95be5a142c1fb9`. Das Prüfskript `components/pipwerk-studio/scripts/check` ist im geprüften Commit unverändert und brauchte keine Änderung, weil der Commit nur die Anwenderdokumentation ändert. Ein Zweig `ablauftest/wp01-functiontest` wurde deshalb nicht neu angelegt.

## Ergebnis

**nicht bestanden**

B2 ist behoben. B1 ist bis auf zwei Stellen in Abschnitt 5 und 6 behoben (F4). B3 ist nicht vollständig behoben (F1, F3). Die Anwenderdokumentation erlaubt einen Aufruf mit relativem Pfad, Abschnitt 4a der technischen Dokumentation nennt nur den absoluten Pfad (F2). Den Aufruf mit relativem Pfad konnte ich in meiner Ausführungsumgebung nicht ausführen (H1). Den Wechsel der Sprache vor `stop` konnte ich nicht ausführen (H2). Das Prüfskript besteht.

## Befunde

### F1: Glossarbegriff „ausgecheckt“ widerspricht seiner Verwendung im Dokument

Fundstelle: `docs/user/pipwerk-studio.md`, Zeile 170 (Glossar „ausgecheckt“), Zeile 167 (Glossar „Arbeitsverzeichnis“); Verwendung in Zeilen 32, 99, 107 und 109.

Zeile 170 erklärt: „Ein Commit ist ausgecheckt, wenn die Dateien des Arbeitsverzeichnisses diesem Commit entsprechen.“ Nach dieser Erklärung ist bei einer nicht committeten Änderung kein Commit ausgecheckt. Zeile 109 sagt aber für genau diesen Fall: „Nach einem Neustart von Oberfläche und Hintergrunddienst nennen beide den Commit, der dann ausgecheckt ist. Nicht committete Änderungen gehören zu keinem Commit. Der laufende Code weicht deshalb auch nach dem Neustart vom angezeigten Commit ab …“. Ebenso Zeile 107 („bei nicht committeten Änderungen“ im Zusammenhang mit dem ausgecheckten Commit). Tatsächlich ermitteln Backend und Bau den Commit mit `git rev-parse HEAD` (technische Dokumentation, Abschnitt 2.6, Zeile 144, und Abschnitt 2.7, Zeile 188). Das liefert den Commit auch bei nicht committeten Änderungen. Die Erklärung im Glossar passt also weder zum Fließtext noch zum Verhalten.

Dasselbe gilt für „Arbeitsverzeichnis“ in Zeile 167: „das die Dateien des Repositorys in einem bestimmten Commit enthält“. Zeile 32 nennt dagegen den Fall, dass „das Arbeitsverzeichnis nicht genau einem Commit entspricht“. Nach der Erklärung in Zeile 167 kann dieser Fall nicht eintreten.

Maßstab: Auftrag 03, Umfang Punkt 3 („Die Erklärungen sind für Leser ohne Vorwissen verständlich“) und technisches Abnahmekriterium 2.

### F2: Aufruf mit relativem Pfad stimmt nicht mit Abschnitt 4a der technischen Dokumentation überein

Fundstellen: `docs/user/pipwerk-studio.md`, Zeilen 25, 27, 29 und 30; `docs/technical/pipwerk-studio.md`, Abschnitt 4a, Zeile 263 und Zeilen 266 bis 268.

Die Anwenderdokumentation nennt als Hauptweg den Aufruf mit relativem Pfad `components/pipwerk-studio/scripts/testenv …` aus dem obersten Verzeichnis des Arbeitsverzeichnisses. Abschnitt 4a sagt: „das Skript wird mit absolutem Pfad aus einem beliebigen Verzeichnis aufgerufen“, und nennt nur `<Arbeitsverzeichnis>/components/pipwerk-studio/scripts/testenv …`. Der Aufruf mit relativem Pfad steht in Abschnitt 4a nicht. Auftrag 03, Umfang Punkt 1, verlangt: „Der Aufruf muss mit dem Verhalten des Skripts und mit Abschnitt 4a der technischen Dokumentation übereinstimmen.“ Der Nicht-Umfang des Auftrags lässt für Widersprüche aus Punkt 1 eine Angleichung der technischen Dokumentation zu. Der Commit ändert die technische Dokumentation nicht (`git show --stat`: nur `docs/user/pipwerk-studio.md`).

Nach dem Code ist der relative Aufruf möglich: `testenv`, Zeile 44, bestimmt das Verzeichnis des Skripts aus `dirname -- "$0"` und wechselt dorthin; ein relativer Pfad wird dabei gegen das aktuelle Verzeichnis aufgelöst. Ausgeführt habe ich ihn nicht (H1). `tests/test_testenv.py` ruft das Skript nur mit absolutem Pfad auf (Zeile 131, `str(self.root / SCRIPT)`, Zeile 137 `cwd=self.base`).

### F3: Weitere Begriffe ohne Erklärung

Fundstelle: `docs/user/pipwerk-studio.md`, Zeile 25 und Zeile 171.

Auftrag 03, Umfang Punkt 3: „Jeder weitere Begriff, der ohne Vorwissen nicht verständlich ist, kommt ebenso ins Glossar.“

- Zeile 25, mit diesem Commit neu: „Statt des relativen Pfads können Sie auch den vollständigen Pfad des Skripts angeben“. „relativer Pfad“ und „vollständiger Pfad“ werden weder im Satz noch im Glossar erklärt. Für einen Leser ohne Vorwissen ist nicht erkennbar, wie der vollständige Pfad aussieht.
- Zeile 171, Glossar „INI-Startkonfiguration“: „Eine Textdatei im INI-Format“. „INI-Format“ wird nicht erklärt. Die Erklärung setzt damit genau das Vorwissen voraus, das sie ersetzen soll.

### F4: `testenv stop` und `start` ohne Pfad in Abschnitt 5 und 6

Fundstelle: `docs/user/pipwerk-studio.md`, Zeile 130 (Abschnitt 5) und Zeile 148 (Abschnitt 6); ebenso Zeile 30 („Nach einem erneuten `start`“).

Abschnitt 2 nennt die Befehle jetzt mit Pfad. Zeile 130 und Zeile 148 schreiben dagegen weiter `testenv stop` als Befehl in Codeschrift, ohne Pfad und ohne Verzeichnis. So eingegeben findet die Shell kein Programm `testenv`; das war der Sachverhalt von B1. Technisches Abnahmekriterium 1 von Auftrag 03: „Jeder Befehl in der Anwenderdokumentation ist so, wie er dasteht, aus dem genannten Verzeichnis ausführbar.“ Zeile 130 verweist zwar auf Abschnitt 2, nennt den Befehl aber selbst in ausführbarer Form.

## Prüfung der Schwerpunkte und Abnahmekriterien

| Prüfpunkt | Ergebnis | Nachweis |
|---|---|---|
| Geprüfter Commit ausgecheckt | erfüllt | `git -C <Arbeitsverzeichnis> rev-parse HEAD`: `74cc3edd5623b19f6e3778078f95be5a142c1fb9`. Fußzeile der gestarteten Testumgebung: „Stand: 74cc3ed“ (Bildschirmfoto). |
| Umfang des Commits | erfüllt | `git show --stat`: nur `docs/user/pipwerk-studio.md`, 33 Einfügungen, 18 Löschungen. Wie vom Entwickler angegeben. |
| B1, Befehle mit Pfad und Verzeichnis | teilweise | Abschnitt 2, Zeilen 25 bis 30: Verzeichnis (oberstes Verzeichnis mit `LICENSE`) und Pfad im Befehl genannt. Offen: F2, F4, H1. |
| `start`, `status`, `stop` nach Anwenderdokumentation | erfüllt mit absolutem Pfad | Siehe Abschnitt „Ablauf der Testumgebung“. |
| B2, Sprache nach `stop` und erneutem `start` | erfüllt | Zeilen 30, 130 und 148 sagen es. Verhalten: `testenv`, Zeile 267 (Datenbank unter `.testenv/`), Zeile 316 (`rm -rf "$env_dir"`). Nach `stop` war `.testenv/` nicht mehr vorhanden (`ls -a` der Komponente). Nach erneutem `start` zeigte die Oberfläche „Sprache: Deutsch“ (Bildschirmfoto). Zum Wechsel vor `stop` siehe H2. Technische Dokumentation Zeile 290 stimmt überein. |
| B3, Glossar | nicht erfüllt | Alle geforderten Begriffe sind enthalten: Arbeitsverzeichnis (167), Git (168), Git-Arbeitsbereich (169), ausgecheckt (170), INI-Startkonfiguration (171). „Arbeitsstand“ ist ersetzt (Zeile 56, „Kennung des Commits“; `grep -n Arbeitsstand` ohne Treffer). Neu erklärt sind zusätzlich Datenbank, Oberfläche, Bau, Entwicklungsserver, Terminal, Fokus und Hilfstechnik; der Fließtext verweist jeweils auf das Glossar. Mängel: F1, F3. |
| Erklärungen im Glossar gegen Verhalten | teilweise | Geprüft gegen die technische Dokumentation: Git (Abschnitt 2.6 und 2.7, `git rev-parse HEAD`, `git log -1 --format=%cI`), Bau (E3, E7), Entwicklungsserver (Abschnitt 2.3), Datenbank und INI-Startkonfiguration (Abschnitt 2.1, 2.2), Git-Arbeitsbereich (Abschnitt 2.6, „kein Git-Arbeitsbereich“ ergibt „nicht ermittelbar“), Fokus (Abschnitt 2.7). Passend. Nicht passend: „ausgecheckt“ und „Arbeitsverzeichnis“ (F1). |
| Aussagen gegen Verhalten und technische Dokumentation | nicht erfüllt | F1, F2. Übrige neue Aussagen geprüft: Abbruch ohne Git-Arbeitsbereich (Zeile 32) entspricht `testenv`, Zeile 222/223, und Abschnitt 4a, Zeile 285. Abbruch bei nicht ignorierter neuer Datei (Zeile 32) selbst ausgelöst, siehe unten. „Das Skript arbeitet immer auf dem Arbeitsverzeichnis, in dem es liegt“ (Zeile 25) entspricht `testenv`, Zeilen 44 bis 50, und wurde im Ablauf bestätigt (Aufruf aus einem anderen Verzeichnis). |
| Schreibweise nach E10 | erfüllt | Suche des Prüfskripts bestanden. |
| Prüfskript | erfüllt | siehe unten |

### Ablauf der Testumgebung

Ports 28431 (Oberfläche) und 28432 (Backend), nicht 18610 und 18611. Die Testumgebung in `test/ablauftest-wp01/` habe ich nicht angefasst.

1. In meinem Arbeitsverzeichnis liegen acht nicht committete Testberichte früherer Durchläufe (`01-functiontest-1.md` bis `02-functiontest-5.md`). `testenv start --frontend-port 28431 --backend-port 28432` mit absolutem Pfad endete mit Exitcode 1 und der Meldung „testenv: the working directory has uncommitted changes or new files that are not ignored; the test environment starts only from exactly one commit.“ und der Liste der acht Dateien. Das bestätigt Zeile 32 der Anwenderdokumentation.
2. Die Berichte durfte ich nicht verschieben. Für den Lauf habe ich deshalb ein zweites, sauberes Arbeitsverzeichnis auf demselben Commit angelegt (`git worktree add --detach … 74cc3edd…`, Unterverzeichnis `testenv-run` meines Arbeitsverzeichnisses). `git rev-parse HEAD` dort: `74cc3edd5623b19f6e3778078f95be5a142c1fb9`; `git status --porcelain --ignored` leer.
3. `start` mit absolutem Pfad, aufgerufen aus meinem Arbeitsverzeichnis, also nicht aus dem Arbeitsverzeichnis des Skripts: Exitcode 0, letzte Zeile „testenv: pipwerk Studio is running: http://127.0.0.1:28431/ (backend on 127.0.0.1:28432)“.
4. `status`: „testenv: running“, „user interface: http://127.0.0.1:28431/“, „backend: http://127.0.0.1:28432/“.
5. `.testenv/` enthielt `backend.log`, `frontend.log`, `pipwerk-studio.db`, `pipwerk-studio.ini`, `state`.
6. Bildschirmfoto mit der Playwright-Kommandozeile: Kopfzeile „pipwerk Studio“, „Sprache: Deutsch“, Fußzeile „Backend: verbunden“, „Stand: 74cc3ed“.
7. `stop`: „testenv: test environment stopped“. Danach war `.testenv/` nicht mehr vorhanden. `status`: „testenv: not running“, Exitcode 1.
8. Erneuter `start` mit denselben Ports: Exitcode 0, dieselbe Meldung wie in Schritt 3. Bildschirmfoto: „Sprache: Deutsch“, „Backend: verbunden“, „Stand: 74cc3ed“.
9. `stop`: „testenv: test environment stopped“. Danach `git worktree remove --force` des zweiten Arbeitsverzeichnisses und Löschen der Bildschirmfotos. `git status --porcelain` meines Arbeitsverzeichnisses zeigt danach nur die acht früheren Berichte und diesen Bericht.

### Prüfskript

Aufruf mit absolutem Pfad nach Abschnitt 6.4: `<Arbeitsverzeichnis>/components/pipwerk-studio/scripts/check --backend-port 28421 --frontend-port 28422`, ohne `--with-audit`. Letzte Ausgabe „check: all checks passed“; diese Zeile gibt das Skript nur aus, wenn keine Prüfung gescheitert ist (`check`, Zeilen 212 und 214). Bestanden: `uv sync --frozen`, pytest, ruff check, ruff format --check, mypy, Suche nach der Schreibweise, `npm ci`, typecheck, Vitest, Build, Browsertest. Browsertest: 39 bestanden, 6 übersprungen (je Browser die zwei Fälle „without a Git working tree“, wie vorgesehen in einem Git-Arbeitsbereich).

Abschnitt 6.4 und das Prüfskript sind durch den Commit nicht berührt und stimmen weiter überein.

## Hinweise

- H1, Aufruf mit relativem Pfad nicht ausgeführt: Meine Ausführungsregeln verbieten den Wechsel des aktuellen Verzeichnisses und Aufrufe mit relativem Pfad; der Versuch `components/pipwerk-studio/scripts/testenv status` wurde von der Ausführungsumgebung abgelehnt. Ausgeführt habe ich die in Zeile 25 genannte zweite Form, den vollständigen Pfad aus einem anderen Verzeichnis. Die erste Form ist nur durch Lesen des Codes belegt (F2). Benötigt wird eine Entscheidung des Softwarearchitekten, ob dieser Nachweis genügt oder wer den Aufruf mit relativem Pfad ausführt.
- H2, Sprachwechsel vor `stop` nicht ausgeführt: In meiner Ausführungsumgebung waren `curl`, eigene Python-Aufrufe und `sqlite3` nicht erlaubt; WebFetch erreicht keine lokalen Adressen. Die Sprache in der laufenden Testumgebung konnte ich deshalb nicht auf Englisch stellen. Belegt ist: Die Datenbank liegt in `.testenv/`, `stop` entfernt das Verzeichnis, nach erneutem `start` ist Deutsch eingestellt. Dass eine zuvor gewählte englische Sprache verloren geht, folgt daraus und aus der technischen Dokumentation (Zeile 290); beobachtet habe ich es nicht. Wer die Berechtigungen der Tester festlegt, entscheidet, ob der Tester Funktion künftig Anfragen an `127.0.0.1` stellen darf.
- H3: Die acht nicht committeten Testberichte früherer Durchläufe in meinem Arbeitsverzeichnis verhindern dort einen Start der Testumgebung. Ich habe sie nicht verändert.
- H4: Ignorierte Abhängigkeiten und Bauergebnisse des Prüfskripts (`backend/.venv`, Zwischenspeicher von mypy, pytest und ruff, `__pycache__`, `frontend/node_modules`, `frontend/dist`, `frontend/dist-e2e`, `frontend/test-results`; laut `git status --porcelain --ignored` alle ignoriert) bleiben in meinem Arbeitsverzeichnis.
