# Testbericht Funktion, Auftrag 03, Durchlauf 3

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: Tester Funktion
- Übergabedokument: `development/ablauftest/wp01/tests/03-functiontest-3-order.md` auf Zweig `ablauftest/wp01`
- geprüfter Commit: `33c30fcc30bd12d5a85f9164c548646f1fdf5307` (Zweig `ablauftest/wp01-03`, Elter `42d3938843f2cf321230a9a04a412bc01e2f40f3`)
- Commit des Prüfskripts: `33c30fcc30bd12d5a85f9164c548646f1fdf5307`. Das Prüfskript `components/pipwerk-studio/scripts/check` ist im geprüften Commit unverändert. Es brauchte keine Änderung, denn der Commit ändert nur die Anwenderdokumentation. Ein Zweig `ablauftest/wp01-functiontest` wurde deshalb nicht angelegt.

## Ergebnis

**nicht bestanden**

F5 aus Durchlauf 2 ist behoben. Die neue Fassung des Eintrags „Arbeitsverzeichnis“ passt aber nicht zum Eintrag „nicht committete Änderung“, zum Fließtext und zum Verhalten des Testumgebungsskripts (F6, neu). Außerdem unterscheiden sich die Einträge „Arbeitsverzeichnis“ und „Git-Arbeitsbereich“ nach der Änderung nicht mehr verständlich (F7, neu). Das Prüfskript besteht. Start, Abfrage und Beenden der Testumgebung verhalten sich wie dokumentiert.

Dies ist der dritte Durchlauf der Prüfschleife zu Auftrag 03. Nach der Grenze von drei Durchläufen geht der Fall eine Ebene höher an den Softwarearchitekten.

## Befunde

### F6 (neu): Eintrag „Arbeitsverzeichnis“ zählt auch ignorierte neue Dateien zu den nicht committeten Änderungen

Fundstelle: `docs/user/pipwerk-studio.md`, Zeile 167 (Glossar „Arbeitsverzeichnis“), im Vergleich mit Zeile 166 (Glossar „nicht committete Änderung“) und Zeile 32.

Zeile 167: „Ändern Sie danach Dateien im Arbeitsverzeichnis oder legen Sie neue an, weichen die Dateien vom ausgecheckten Commit ab. Diese Abweichungen heißen nicht committete Änderungen (siehe dort).“

Zeile 166 dagegen: Eine nicht committete Änderung ist „eine neue Datei, die Git nicht ausdrücklich ignoriert“. Zeile 32 sagt dasselbe. Nach Zeile 167 ist jede neue Datei eine nicht committete Änderung, auch eine ignorierte. Die beiden Einträge widersprechen sich.

Zum Verhalten: Ignorierte neue Dateien hindern den Start der Testumgebung nicht. Das steht in der technischen Dokumentation `docs/technical/pipwerk-studio.md`, Zeile 276 („Ignorierte Dateien wie `backend/.venv/`, `frontend/node_modules/`, `frontend/dist/` und `.testenv/` sind zulässig.“). Ich habe es auch beobachtet: In meinem Arbeitsverzeichnis lagen nach dem Prüfskript `backend/.venv`, `frontend/node_modules` und `frontend/dist`. Die Fehlermeldung von `testenv start` nannte nur die nicht ignorierten Berichte, nicht diese Verzeichnisse. Im zweiten Arbeitsverzeichnis war `git status --porcelain` bei laufender Testumgebung leer, obwohl `.testenv/` mit fünf neuen Dateien vorhanden war. Ein Leser, der Zeile 167 folgt, hält solche Dateien für nicht committete Änderungen, die er committen oder verwerfen muss (Zeile 32, Zeile 166).

Maßstab: Auftrag 03, Technisches Abnahmekriterium 2, und Ziel: Die Anwenderdokumentation widerspricht weder sich selbst noch dem Verhalten. Prüfauftrag Durchlauf 3: Die Einträge müssen zum Eintrag „nicht committete Änderung“ passen.

### F7 (neu): „Arbeitsverzeichnis“ und „Git-Arbeitsbereich“ sind nach der Änderung nicht mehr zu unterscheiden

Fundstelle: `docs/user/pipwerk-studio.md`, Zeile 167 (Glossar „Arbeitsverzeichnis“) und Zeile 174 (Glossar „Git-Arbeitsbereich“); betroffen sind auch Zeile 25 und Zeile 32.

Zeile 167 erklärt das Arbeitsverzeichnis jetzt als „ein Verzeichnis, in das Git die Dateien des Repositorys so gelegt hat, wie sie in einem bestimmten Commit festgehalten sind“. Nach dieser Erklärung entsteht jedes Arbeitsverzeichnis durch Git. Zeile 174 erklärt den Git-Arbeitsbereich als „ein Arbeitsverzeichnis, das Git verwaltet“. Das setzt voraus, dass es auch Arbeitsverzeichnisse gibt, die Git nicht verwaltet. Nach Zeile 167 gibt es die nicht mehr. Ein Leser kann aus den beiden Einträgen nicht erkennen, worin sich die Begriffe unterscheiden.

Folge für den Fließtext: Zeile 32 behandelt den Fall, dass das Skript nicht in einem Git-Arbeitsbereich liegt, zum Beispiel in einem Verzeichnis mit entpackten Dateien (Zeile 174). Nach Zeile 167 ist ein solches Verzeichnis kein Arbeitsverzeichnis. Zeile 25 sagt aber, man ruft die Befehle im obersten Verzeichnis des Arbeitsverzeichnisses auf, und das Skript arbeite „immer auf dem Arbeitsverzeichnis, in dem es liegt“. Für diesen Fall gibt es nach dem Glossar kein Arbeitsverzeichnis.

Die frühere Fassung (Commit `42d3938843f2cf321230a9a04a412bc01e2f40f3`, Zeile 167: „Das Verzeichnis auf Ihrem Rechner mit den Dateien des Repositorys.“) ließ diesen Unterschied zu.

Maßstab: Auftrag 03, Umfang Punkt 3 („Die Erklärungen sind für Leser ohne Vorwissen verständlich.“), und Ziel: Die Anwenderdokumentation widerspricht sich nicht selbst. Prüfauftrag Durchlauf 3: Es dürfen durch die Änderung keine neuen Probleme entstehen.

## Nachprüfung des Befunds aus Durchlauf 2

| Befund | Ergebnis | Nachweis |
|---|---|---|
| F5, „kommen zum Commit hinzu“ und „gehören zu keinem Commit“ im selben Satz; Bild „steht auf einem Commit“ unerklärt; Herkunft der Dateien nicht genannt | behoben | `git diff 42d3938… 33c30fc…` ändert nur die Zeilen 167 und 175. Zeile 167 und Zeile 175 enthalten „kommen … hinzu“ und „steht auf“ nicht mehr. Zeile 167 sagt jetzt, dass Git die Dateien so in das Verzeichnis gelegt hat, wie sie im Commit festgehalten sind. Zeile 175 erklärt „ausgecheckt“ mit demselben Vorgang und ohne Bild. Zeile 175 („Diese Änderungen gehören zu keinem Commit, bis Sie sie committen.“) stimmt mit Zeile 109 und Zeile 166 überein. Die neuen Mängel im Eintrag „Arbeitsverzeichnis“ stehen unter F6 und F7. |

## Prüfung der Änderungen auf neue Probleme

| Prüfpunkt | Ergebnis | Nachweis |
|---|---|---|
| Geprüfter Commit ausgecheckt | erfüllt | `git -C <Arbeitsverzeichnis> rev-parse HEAD`: `33c30fcc30bd12d5a85f9164c548646f1fdf5307`. Erste Zeile des Prüfskripts: „check: checking … at commit 33c30fcc30bd12d5a85f9164c548646f1fdf5307“. Fußzeile der gestarteten Testumgebung: „Stand: 33c30fc“ (Bildschirmfoto). |
| Umfang des Commits | erfüllt | `git show --stat`: nur `docs/user/pipwerk-studio.md`, 2 Zeilen eingefügt, 2 entfernt. Das stimmt mit der Angabe des Entwicklers überein. |
| „ausgecheckt“ gegen Fließtext | erfüllt | Zeile 65 („auf einen anderen Commit gesetzt (ausgecheckt, siehe Glossar)“), Zeile 99, 107 und 109 passen zu Zeile 175. Der Satz „Das Wechseln auf einen anderen Commit heißt auschecken.“ ist entfallen. Zeile 65 bleibt trotzdem verständlich: Nach Zeile 175 ist nach dem Wechsel der Commit ausgecheckt, dessen Dateien Git in das Arbeitsverzeichnis gelegt hat. |
| „Arbeitsverzeichnis“ gegen „nicht committete Änderung“ | nicht erfüllt | siehe F6 |
| „Arbeitsverzeichnis“ gegen „Git-Arbeitsbereich“ und Fließtext | nicht erfüllt | siehe F7 |
| Technische Dokumentation | erfüllt | Der Commit ändert sie nicht. `git grep` nach „Arbeitsverzeichnis“, „ausgecheckt“ und „oberste“ in beiden Dokumenten: Die technische Dokumentation (Zeilen 143, 177, 198, 263, 276, 501, 525) widerspricht den neuen Einträgen nicht. Sie verwendet für die Unterscheidung „Arbeitsverzeichnis von Git“ (Zeilen 271, 285, 444). |
| Schreibweise nach E10 | erfüllt | Suche des Prüfskripts: „333 mentions checked, all spelled correctly“. |
| Keine Zugangsdaten, Rechnernamen, Benutzernamen oder Pfade des Entwicklungsrechners | erfüllt | Die beiden geänderten Zeilen enthalten keine Pfade und keine Namen. |

### Ablauf der Testumgebung

Ports 28531 (Oberfläche) und 28532 (Backend), nicht 18610 und 18611. Die Testumgebung in `test/ablauftest-wp01/` habe ich nicht angefasst.

1. `testenv start --frontend-port 28531 --backend-port 28532` mit vollständigem Pfad in meinem Arbeitsverzeichnis: Exitcode 1, Meldung „testenv: the working directory has uncommitted changes or new files that are not ignored; the test environment starts only from exactly one commit.“ und eine Liste der nicht committeten früheren Testberichte. Die ignorierten Verzeichnisse des Prüfskripts nennt die Liste nicht (Nachweis zu F6).
2. Für den Lauf habe ich ein zweites, sauberes Arbeitsverzeichnis auf demselben Commit angelegt (`git worktree add --detach … 33c30fc…`, Unterverzeichnis `testenv-run` meines Arbeitsverzeichnisses). `git status --porcelain --ignored` war dort leer.
3. `start` mit vollständigem Pfad: Letzte Zeile „testenv: pipwerk Studio is running: http://127.0.0.1:28531/ (backend on 127.0.0.1:28532)“.
4. `status`: „testenv: running“, „user interface: http://127.0.0.1:28531/“, „backend: http://127.0.0.1:28532/“.
5. `.testenv/` enthielt `backend.log`, `frontend.log`, `pipwerk-studio.db`, `pipwerk-studio.ini` und `state`. `git status --porcelain` war dabei leer (Nachweis zu F6).
6. Bildschirmfoto mit der Playwright-Kommandozeile: Kopfzeile „pipwerk Studio“, „Sprache“ mit „Deutsch“, „Über pipwerk Studio“; Fußzeile „Backend: verbunden“, „Stand: 33c30fc“.
7. `stop`: „testenv: test environment stopped“. Danach ist `.testenv/` nicht mehr vorhanden (`ls -a` der Komponente). `status`: „testenv: not running“, Exitcode 1.
8. Erneuter `start` mit denselben Ports: dieselbe Meldung wie in Schritt 3. Bildschirmfoto: „Deutsch“, „Backend: verbunden“, „Stand: 33c30fc“.
9. `stop`: „testenv: test environment stopped“. Danach habe ich das zweite Arbeitsverzeichnis mit `git worktree remove --force` entfernt. Die Bildschirmfotos lagen in dessen `.testenv/` und sind mit entfernt. `git status --porcelain` meines Arbeitsverzeichnisses zeigt danach nur die zehn früheren Berichte.

### Prüfskript

Aufruf mit vollständigem Pfad nach Abschnitt 6.4: `<Arbeitsverzeichnis>/components/pipwerk-studio/scripts/check --backend-port 28521 --frontend-port 28522`, ohne `--with-audit`. Ich habe es zweimal vollständig ausgeführt, beide Male mit demselben Ergebnis. Erste Zeile: „check: checking … at commit 33c30fcc30bd12d5a85f9164c548646f1fdf5307“. Letzte Zeile: „check: all checks passed“. Bestanden haben: `uv sync --frozen`, pytest (148 bestanden), ruff check, ruff format --check, mypy (15 Quelldateien), die Suche nach der Schreibweise, `npm ci`, typecheck, Vitest (244 bestanden in 14 Dateien), Build und der Browsertest (39 bestanden, 6 übersprungen). Übersprungen wurden in jedem Browser die zwei Fälle „without a Git working tree“. Das ist so vorgesehen, weil der Test in einem Git-Arbeitsbereich läuft.

## Hinweise

- H2 aus Durchlauf 2 besteht weiter: Den Wechsel auf Englisch vor `stop` habe ich nicht ausgeführt. In Durchlauf 1 und 2 hat die Ausführungsumgebung `curl` abgelehnt. Der Verlust der Sprache folgt aus dem belegten Entfernen von `.testenv/` samt Datenbank (Schritt 7). Offen bleibt die Entscheidung, ob der Tester Funktion Anfragen an `127.0.0.1` stellen darf. Zuständig ist, wer die Berechtigungen der Tester festlegt.
- H5: Der Satz „Sein oberstes Verzeichnis ist das Verzeichnis, in dem `LICENSE` liegt.“ ist aus dem Eintrag „Arbeitsverzeichnis“ entfallen. Die Glossarzeile 170 verwendet „obersten Verzeichnis des Arbeitsverzeichnisses“ weiter ohne Erklärung. Zeile 25 erklärt den Ausdruck im Fließtext („also in dem Verzeichnis, in dem auch die Datei `LICENSE` liegt“). Einen Befund sehe ich darin nicht.
- H3 und H4 aus Durchlauf 2 gelten weiter: Nicht committete frühere Testberichte verhindern in meinem Arbeitsverzeichnis den Start der Testumgebung. Abhängigkeiten und Bauergebnisse des Prüfskripts bleiben dort und werden laut `git status --porcelain` ignoriert.
