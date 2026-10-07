# Das Pipwerk-Entwicklungsverfahren

## Status

- status: `draft`
- stand: 2026-10-07
- bereich: Entwicklungsprozess (keine Produktkomponente)

## Worum es in diesem Dokument geht

Dieses Dokument erklärt, wie bei Pipwerk aus einem freigegebenen Arbeitsauftrag eine geprüfte, laufende Testversion wird. Es richtet sich an technisch versierte Menschen, die neu in das Projekt kommen. Es beschreibt zuerst das Gesamtverfahren und danach die Werkzeuge, die Arbeitsbereiche, den Umgang mit Störungen und die Voraussetzungen für einen Entwicklungsrechner.

Das Repository ist öffentlich. Deshalb beschreibt dieses Dokument die Arbeitsweise und die Schnittstellen der lokalen Werkzeuge, aber keine konkrete Serverinstallation: keine Pfade, Benutzer, Rechte oder lokalen Einstellungen. Diese Angaben stehen in einer lokalen Dokumentation auf dem Entwicklungsrechner, im Verzeichnis der lokalen Werkzeuge.

Die Regeln für die einzelnen Rollen stehen nicht hier, sondern in eigenen Dokumenten. Dieses Dokument verweist darauf, statt sie zu wiederholen:

- [Agentenrollen und Briefings](agentenrollen-und-briefings.md) – Aufgaben und Grenzen jeder Rolle;
- [Claude-Code-Agentenstruktur](claude-code-agentenstruktur.md) – wie die Rollen technisch in Claude Code abgebildet sind;
- `.claude/agents/` – die verbindlichen Agentendefinitionen;
- [Entwicklungsplan](../design/planning/entwicklungsplan-strategiedesigner.md) – Grundsätze des Entwicklungsprozesses.

Beschrieben ist der bereinigte Entwicklungsworkflow vom 2026-10-07. Was es noch nicht gibt, ist ausdrücklich als nicht vorhanden gekennzeichnet.

## 1. Überblick: Was passiert mit einem freigegebenen Arbeitsauftrag?

Ein Arbeitsauftrag beschreibt eine abgegrenzte Änderung an Pipwerk: Ziel, Umfang, gewünschtes Verhalten und nachprüfbare Abnahmekriterien. Der Projektleiter klärt den Auftrag mit dem Nutzer und legt ihn als Markdown-Datei im Repository unter `docs/design/planning/work-orders/` ab. Erst wenn der Nutzer den Auftrag freigegeben hat, trägt die Datei den Status `freigegeben`.

Auf Veranlassung des Projektleiters wird auf dem Entwicklungsrechner eine interaktive Claude-Code-Sitzung für den Softwarearchitekten geöffnet. Der Projektleiter übergibt direkt den Repository-Pfad des freigegebenen Auftrags und den maßgeblichen Commit. Der Softwarearchitekt sucht oder pollt nicht nach Aufträgen. Die Vorbereitung und der Start stehen in Abschnitt 4.

Der Softwarearchitekt leitet ab hier das Claude-Code-Team. Er liest den Auftrag und den aktuellen Stand des Repositorys. Er setzt einen Entwickler ein, der die Änderung in einem eigenen Branch umsetzt, prüft und als Pull Request auf GitHub bereitstellt. Danach setzt er die QA ein. Die QA prüft genau diesen Pull Request bei genau einem Commit unabhängig. Findet die QA Mängel, geht der Auftrag zurück an den Entwickler, und die QA prüft den neuen Commit erneut. Das wiederholt sich, bis die QA den Stand freigibt.

Den von der QA freigegebenen Commit stellt der Softwarearchitekt als Teststand bereit. Dafür gibt es das lokale Werkzeug `pipwerk-dev`. Es setzt einen eigenen Arbeitsbereich auf genau diesen Commit, installiert die Abhängigkeiten, startet die Anwendung und prüft, dass sie antwortet.

Am laufenden Teststand prüft der Projektleiter jedes Abnahmekriterium. Ist der Auftrag erfüllt, probiert der Nutzer die Testversion praktisch aus. Nimmt der Nutzer sie an, gibt der Projektleiter den Abschluss frei, und der Softwarearchitekt lässt den Pull Request mergen. Lehnt der Nutzer ab oder ist ein Kriterium nicht erfüllt, geht der Auftrag zurück in die Korrektur.

Zwei Dinge sind für das Verständnis wichtig:

- **Das Repository ist die maßgebliche Quelle.** Aufträge, Entscheidungen, Agentendefinitionen und Dokumentation liegen dort. Was nur in einem Chat, in einer Agentennachricht oder in `transfer/` steht, ist keine Festlegung.
- **`pipwerk-dev` verwaltet die Git-Arbeitsbereiche und den Teststand.** Die Auftragsübergabe erfolgt direkt an das Claude-Code-Team; `pipwerk-dev` startet und steuert keine Agenten.

## 2. Die Beteiligten

### Nutzer

Der Nutzer ist der Auftraggeber. Er trifft die fachlichen Entscheidungen und die grundlegenden Architekturentscheidungen, gibt Arbeitsaufträge frei und probiert die fertige Testversion praktisch aus. Pull Requests, Programmcode oder umfangreiche Dokumentationsänderungen muss er nicht selbst prüfen.

### Projektleiter

Der Projektleiter ist die Schnittstelle zum Nutzer. Er klärt Aufträge, schreibt sie ins Repository, veranlasst den Teamstart und übergibt den freigegebenen Auftrag direkt an den Softwarearchitekten. Am Teststand prüft er die Abnahmekriterien. Er gehört nicht zum Claude-Code-Team. Derzeit übernimmt ChatGPT diese Rolle.

### Claude-Code-Team

Das Team besteht aus Softwarearchitekt, Entwickler und QA. Alle drei sind Claude-Code-Agenten. Ihre Definitionen liegen im Repository unter `.claude/agents/`, wiederverwendbare Arbeitsschritte unter `.claude/skills/`. Die Teamfunktion von Claude Code („Agent Teams“) ist derzeit experimentell und wird in `.claude/settings.json` eingeschaltet.

Der Softwarearchitekt ist der Leiter des Teams (Team Lead). Er startet Entwickler und QA als sogenannte Teammates. Teammates laufen im selben Claude-Code-Prozess wie der Softwarearchitekt. Sie haben kein eigenes Startverzeichnis. Die Trennung der Arbeitsbereiche beruht deshalb auf verbindlichen Anweisungen in den Agentendefinitionen (Abschnitt 3).

| Rolle | Agentendefinition | Modell (Startkonfiguration) |
|---|---|---|
| Softwarearchitekt | `software-architect` | Opus |
| Entwickler | `developer` | Sonnet |
| QA | `qa` | Opus |

Die Modellzuordnung ist eine Startkonfiguration und kann nach praktischen Erfahrungen geändert werden.

Am Ende eines Auftrags fordert der Softwarearchitekt Entwickler und QA zum Beenden auf. Claude Code stellt die technische Bestätigung dieser Aufforderung dem Softwarearchitekten nicht zuverlässig zu; in einem Test am 2026-10-07 kam sie bei ihm nicht an, obwohl beide Teammates bestätigt hatten. Deshalb schicken Entwickler und QA vor der Bestätigung eine gewöhnliche Nachricht `ABMELDUNG BESTÄTIGT: <rolle>`. Nur diese Nachricht wertet der Softwarearchitekt aus, und nur ihr Fehlen meldet er als fehlende Abmeldung.

### Softwarearchitekt

Der Softwarearchitekt bereitet den Auftrag technisch vor, trifft Architekturentscheidungen innerhalb der dokumentierten Vorgaben und steuert Entwicklung, QA, Korrekturschleifen und Abschluss. Den von der QA freigegebenen Commit stellt er selbst mit `pipwerk-dev start` als Teststand bereit und verifiziert danach mit `pipwerk-dev status` den laufenden Commit. Fachliche Fragen und neue Architekturgrundsätze gibt er über den Projektleiter an den Nutzer weiter.

### Entwickler

Der Entwickler setzt den Auftrag in einem eigenen Branch um, führt die vorgesehenen Prüfungen aus, committet und erstellt den Pull Request. QA-Befunde behebt er im selben Branch.

### QA

Die QA prüft einen bestimmten Pull Request bei einem bestimmten Commit unabhängig gegen Auftrag, Architektur, Projektregeln, Code, Tests und Dokumentation. Sie beschreibt Befunde, legt aber keine Korrekturlösung fest. Eine Freigabe gilt nur für den geprüften Commit. Jede spätere Codeänderung macht sie ungültig.

### Verbindliche Arbeitsregeln für alle Rollen

Zwei Regeln aus [Agentenrollen und Briefings](agentenrollen-und-briefings.md) prägen die tägliche Arbeit besonders. Erstens arbeiten alle Rollen mit dem aktuellen Stand von `main`, dem Auftrag, dem aktuellen Pull Request und den unmittelbar nötigen Referenzen; ältere Historie wird nur bei einem sonst nicht lösbaren Widerspruch oder auf ausdrücklichen Auftrag des Projektleiters untersucht. Zweitens ist Dokumentation Teil jeder Änderung, auch an Werkzeugen, Infrastruktur, Konfiguration und Prozessen. Ohne aktuelle Dokumentation ist eine Änderung nicht fertig, und die QA gibt sie nicht frei.

### GitHub und Pull Requests

GitHub ist die Ablage für das Repository und die Pull Requests. Jede Änderung an Programmcode und wesentlicher Dokumentation läuft über einen Branch und einen Pull Request. Im Pull Request wird ein Arbeitsstand mit Auftrag, Änderungen und Prüfergebnissen nachvollziehbar. Die Steuerung des Ablaufs selbst hängt nicht von GitHub ab.

### pipwerk-dev

`pipwerk-dev` verwaltet auf dem Entwicklungsrechner die Git-Arbeitsbereiche, führt die automatischen Prüfungen einer Komponente aus und stellt einen bestimmten Commit als Teststand bereit. Einzelheiten stehen in Abschnitt 5.

## 3. Arbeitsbereiche

Auf dem Entwicklungsrechner gibt es ein Pipwerk-Entwicklungsverzeichnis. Darin liegen nebeneinander die folgenden Verzeichnisse. Die Namen sind fest, weil Werkzeuge und Agentendefinitionen sie verwenden.

Die Verzeichnisse `repo/`, `implement/`, `review/` und `test/` sind Git-Arbeitsbereiche desselben Repositorys. `repo/` ist ein normaler Klon von GitHub, die übrigen drei sind daran angehängte Worktrees. Ein Worktree ist ein zusätzliches Arbeitsverzeichnis, das sich die Git-Daten mit `repo/` teilt, aber einen eigenen Branch oder Commit ausgecheckt hat.

Die Agenten finden das Pipwerk-Entwicklungsverzeichnis über die Umgebungsvariable `PIPWERK_DEV_ROOT`. Sie wird vor dem Start von Claude Code in der lokalen Startumgebung gesetzt und an das Team vererbt. Kein Agent setzt, überschreibt oder entfernt sie; alle verwenden nur den gesetzten Wert und schreiben Pfade über die Variable. Der Softwarearchitekt nennt Entwickler und QA ihre Arbeitsbereiche deshalb nur als `$PIPWERK_DEV_ROOT/implement` und `$PIPWERK_DEV_ROOT/review`, nie als ausgeschriebenen Pfad. Die Agentendefinitionen enthalten keine Pfade des Rechners. Ist die Variable nicht gesetzt, brechen die Agenten ab.

### repo/ – Referenz-Repository

`repo/` ist das Arbeitsverzeichnis des Softwarearchitekten. Die Claude-Code-Sitzung wird dort gestartet, und Claude Code liest die Agentendefinitionen aus `repo/.claude/`. Deshalb muss `repo/` auf dem aktuellen Stand von `origin/main` stehen und darf keine lokalen Änderungen haben. Dies wird vor jedem Teamstart geprüft (Abschnitt 4).

Der Softwarearchitekt arbeitet ausschließlich mit `repo/` als eigenem Arbeitsverzeichnis. Inhalte anderer Arbeitsbereiche prüft er über absolute Pfade, ohne in sie zu wechseln. Entwickler und QA dürfen `repo/` lesen, aber nichts darin ändern.

Auf den aktuellen Stand gebracht wird `repo/` mit `pipwerk-dev sync-repo` (Abschnitt 5). Sonst verändert `pipwerk-dev` dort nur Verwaltungsdaten: Es holt mit `git fetch` den Stand von GitHub und legt von dort aus die anderen Worktrees an. Den lokalen Branch `main` bewegt nur `sync-repo`.

### implement/ – Arbeitsbereich des Entwicklers

Nur der Entwickler ändert hier etwas, und zwar in seinem Arbeitsbranch. Zu Beginn eines Auftrags legt er den Branch mit `pipwerk-dev prepare` auf dem Ausgangsstand an, den der Softwarearchitekt nennt. Der Branch `main` wird hier nie ausgecheckt.

### review/ – Arbeitsbereich der QA

Dieser Bereich ist von `implement/` getrennt, damit die QA einen Stand unabhängig vom Entwickler prüfen kann. Nur die QA arbeitet hier. Sie legt für einen Auftrag einen lokalen Prüfbranch auf dem zu prüfenden Commit an und bringt ihn für eine erneute Prüfung auf den neuen Commit. Sie committet und pusht dort nichts.

### test/ – Teststand

Nur `pipwerk-dev` verändert diesen Arbeitsbereich: `pipwerk-dev start` und `pipwerk-dev update test` setzen ihn auf einen bestimmten Commit, ohne Branch („detached“). Von Hand oder von einem Agenten wird hier nichts geändert, sonst entspräche der Teststand nicht mehr dem freigegebenen Commit.

### transfer/ – Ablage für Arbeitsergebnisse

Hier liegen Arbeitsergebnisse zwischen den Beteiligten, zum Beispiel Berichte und Übergabenotizen. Die Inhalte sind keine Projektfestlegungen. Was dauerhaft gelten soll, wird in die zuständige Dokumentation im Repository übernommen. Kein Werkzeug verändert dieses Verzeichnis.

### scripts/ – lokale Werkzeuge

Hier liegen `pipwerk-dev`, seine automatischen Tests und die lokale Dokumentation der Entwicklungsumgebung. Diese Dateien gehören nicht zum Pipwerk-Repository (Abschnitt 9). Das Team ändert sie nicht.

### Lokales Zustandsverzeichnis

`pipwerk-dev` schreibt seine Zustands- und Protokolldateien in ein lokales Zustandsverzeichnis des ausführenden Benutzers außerhalb aller Arbeitsbereiche. Nichts davon gelangt ins Repository.

## 4. Team starten und Auftrag übergeben

Claude Code wird interaktiv als Softwarearchitekt gestartet. Der nicht interaktive Modus `claude -p` wird für diesen Teamablauf nicht verwendet.

Vor dem Start sind auf dem Entwicklungsrechner folgende Schritte auszuführen:

1. `PIPWERK_DEV_ROOT` in der lokalen Startumgebung auf den absoluten Pfad des vorhandenen Pipwerk-Entwicklungsverzeichnisses setzen und exportieren. Der konkrete Wert gehört in die lokale Einrichtung, nicht ins Repository. Claude Code und die Teammates erben ihn; die Agenten selbst setzen oder verändern ihn nicht.
2. Vor einer neuen Sitzung `"$PIPWERK_DEV_ROOT/scripts/pipwerk-dev" sync-repo` ausführen. Bei einem Fehler die Ursache klären; keine lokalen Änderungen verwerfen und den Start nicht fortsetzen. Während einer laufenden Sitzung wird `repo/` nicht aktualisiert.
3. Prüfen, dass `repo/` sauber auf `main` steht und `HEAD` mit `origin/main` übereinstimmt. Den vollständigen Commit mit `git -C "$PIPWERK_DEV_ROOT/repo" rev-parse HEAD` feststellen. Der ausdrücklich ausgewählte Auftrag muss auf diesem Stand unter `docs/design/planning/work-orders/` liegen und den Status `freigegeben` haben.
4. Den Team Lead starten:

   ```sh
   test -n "$PIPWERK_DEV_ROOT" && cd "$PIPWERK_DEV_ROOT/repo" && claude --agent software-architect
   ```

5. In der interaktiven Sitzung den Repository-Pfad des freigegebenen Arbeitsauftrags und den vollständigen Commit übergeben. Der Softwarearchitekt liest genau diesen Auftrag und übernimmt die weitere Orchestrierung.

Nach Abschluss meldet der Softwarearchitekt die Abmeldung seiner Teammates entsprechend den Agentendefinitionen. Die interaktive Sitzung kann danach mit `/exit` beendet werden.

## 5. pipwerk-dev

### Zweck

`pipwerk-dev` erledigt auf dem Entwicklungsrechner die wiederkehrenden technischen Schritte rund um die Git-Arbeitsbereiche und den Teststand. Es bringt das Referenz-Repository auf den Stand von `origin/main`, richtet die anderen Arbeitsbereiche ein und bringt sie auf einen Stand, führt die automatischen Prüfungen einer Komponente aus und startet einen bestimmten Commit als Teststand. Derzeit unterstützt es nur die Komponente `pipwerk-studio`.

`pipwerk-dev` startet keine Agenten und weiß nichts von Arbeitsaufträgen.

### Befehle im Überblick

```sh
pipwerk-dev sync-repo
pipwerk-dev prepare <implement|review|test> <branch> [--base REF]
pipwerk-dev update <implement|review|test> <ref>
pipwerk-dev test pipwerk-studio --workspace <implement|review|test>
pipwerk-dev start pipwerk-studio <commit-hash>
pipwerk-dev stop [pipwerk-studio]
pipwerk-dev status [--workspace <implement|review|test>]
```

Bei `prepare`, `update`, `test` und `status` kann `repo/` nicht angegeben werden; für `repo/` gibt es nur `sync-repo`. Jedes Kommando nimmt die Option `--json` an und gibt dann genau ein JSON-Objekt aus. Das ist für Agenten und andere Programme gedacht.

### Referenz-Repository aktualisieren: sync-repo

`sync-repo` wird vor dem Start einer neuen Claude-Code-Sitzung verwendet, wenn `origin/main` inzwischen weiter ist, zum Beispiel nach dem Merge eines Pull Requests. Es holt den Stand von GitHub und spult den Branch `main` in `repo/` per Fast-Forward auf `origin/main` vor.

`sync-repo` verwirft und überschreibt nie etwas. Es bricht mit Exitcode 3 ohne Änderung ab, wenn

- `repo/` nicht auf dem Branch `main` steht,
- `repo/` lokale Änderungen hat, auch neue, nicht versionierte Dateien oder eine unterbrochene Git-Operation,
- `main` eigene Commits hat, die nicht auf `origin/main` liegen, so dass kein Fast-Forward möglich ist,
- ein anderer Prozess in `repo/` arbeitet, zum Beispiel eine laufende Claude-Code-Sitzung des Softwarearchitekten.

Steht `repo/` schon auf `origin/main`, meldet es Erfolg, ohne etwas zu tun.

### Arbeitsbereiche einrichten: prepare

`prepare` wird verwendet, wenn in `implement/`, `review/` oder `test/` ein neuer Branch beginnen soll. Es holt den aktuellen Stand von GitHub und legt den Branch auf `origin/main` an, oder auf einem mit `--base` genannten Stand. Fehlt der Arbeitsbereich oder ist er leer, wird er als Worktree angelegt.

`prepare` bricht ohne Änderung ab, wenn der Arbeitsbereich lokale Änderungen hat, wenn dort ein von `pipwerk-dev` gestarteter Prozess läuft, wenn der Branch schon lokal oder auf GitHub existiert, wenn der Arbeitsbereich auf `main` steht oder fremde Daten enthält, oder wenn der Wechsel ignorierte Dateien überschreiben würde. Steht der Arbeitsbereich schon genau auf diesem Branch und Stand, meldet es Erfolg, ohne etwas zu tun.

### Arbeitsbereiche nachziehen: update

`update` bringt einen Arbeitsbereich auf einen angegebenen Git-Stand. In `implement/` und `review/` geschieht das nur als Vorspulen (Fast-Forward) des ausgecheckten Branches; ist das nicht möglich, bricht es ab. `test/` wird ohne Branch auf den Commit gesetzt und beim ersten Mal als Worktree angelegt. Lokale Änderungen, auch neue nicht versionierte Dateien, führen immer zum Abbruch.

### Wie Entwickler und QA ihre Arbeitsbereiche vorbereiten

Entwickler und QA bereiten ihre Arbeitsbereiche selbst mit `pipwerk-dev` vor. Die verbindlichen Befehle stehen in den Agentendefinitionen; hier ist der Zusammenhang beschrieben.

Der Softwarearchitekt nennt dem Entwickler den Namen des Arbeitsbranches und den Ausgangsstand als vollständigen Commit-Hash. Der Entwickler legt den Branch mit `pipwerk-dev prepare implement <branch> --base <commit>` an und prüft danach Branch und Commit. Korrekturen macht er im selben Branch ohne erneutes `prepare`.

Der QA nennt der Softwarearchitekt den Pull Request, den zu prüfenden Commit und den Namen eines lokalen Prüfbranches. Für die erste Prüfung legt die QA den Prüfbranch mit `pipwerk-dev prepare review <prüfbranch> --base <commit>` an. Für eine erneute Prüfung nach Korrekturen bringt sie ihn mit `pipwerk-dev update review <commit>` auf den neuen Commit. Vor der Prüfung kontrolliert sie, dass genau dieser Commit ausgecheckt ist.

Keine der beiden Rollen verändert dafür `repo/`. Endet `pipwerk-dev` mit einem Fehler, melden Entwickler und QA die Meldung dem Softwarearchitekten und umgehen sie nicht mit eigenen Git-Befehlen. Nur wenn `pipwerk-dev` meldet, dass gerade ein anderer Aufruf läuft, wiederholen sie den Aufruf einmal.

### Automatische Prüfungen: test

`test` führt im angegebenen Arbeitsbereich die für Pipwerk Studio vorgesehenen Prüfungen aus. Für das Backend sind das `uv sync --frozen`, `pytest`, `ruff check`, `ruff format --check` und `mypy`. Für die Oberfläche sind es `npm ci`, `npm run typecheck`, `npm test` und `npm run e2e`. Schlägt ein Schritt fehl, laufen die davon unabhängigen Schritte weiter; Schritte, die einen fehlgeschlagenen voraussetzen, werden übersprungen. Das Kommando endet dann mit Exitcode 1 und nennt die Datei mit der vollständigen Ausgabe.

### Teststand bereitstellen und starten: start

`start` wird verwendet, wenn ein von der QA freigegebener Commit als laufende Testversion bereitgestellt werden soll. Es nimmt nur einen Commit-Hash an, keinen Branch- oder Tag-Namen. So kann sich der Stand zwischen Freigabe und Start nicht unbemerkt verschieben. Danach geschieht Folgendes:

1. Der Commit muss Pipwerk Studio enthalten, und die Ports müssen frei sein. Sind sie von fremden Programmen belegt, bricht `start` ab und fasst diese Programme nicht an.
2. `test/` wird auf den Commit gesetzt.
3. Die Abhängigkeiten werden installiert: `uv sync --frozen` für das Backend und `npm ci` für die Oberfläche.
4. Die lokale Startkonfiguration wird geschrieben (siehe unten).
5. Backend und Oberfläche werden gestartet: das Backend mit `pipwerk-studio -c <INI>`, die Oberfläche als Vite-Entwicklungsserver. Vite leitet Anfragen unter `/api` an das Backend weiter. Beide sind nur vom eigenen Rechner aus erreichbar.
6. Innerhalb von 60 Sekunden müssen drei Adressen antworten: `/api/health` des Backends mit `{"status": "ok"}`, die Startseite der Oberfläche und `/api/health` über die Oberfläche. Antwortet etwas nicht, beendet `start` die gerade gestarteten Prozesse wieder und meldet einen Fehler.

Läuft Pipwerk Studio bereits aus demselben Commit und ist erreichbar, startet `start` nichts neu und meldet Erfolg. Läuft es aus einem anderen Commit, bricht `start` ab; vorher ist `stop` nötig.

### Lokale Startkonfiguration und Testdatenbank

Pipwerk Studio startet nur mit einer gültigen INI-Startkonfiguration, die die Datenbank angibt (siehe [Pipwerk Studio – technische Dokumentation](pipwerk-studio.md)). `pipwerk-dev` schreibt diese INI vor jedem Start in sein lokales Zustandsverzeichnis. Sie verweist auf eine SQLite-Datenbank im selben Verzeichnis. Beide Dateien liegen außerhalb des Repositorys und können nicht versehentlich committet werden.

Die Testdatenbank bleibt über Neustarts und über verschiedene Teststände hinweg erhalten. Eine im Teststand gespeicherte Einstellung, zum Beispiel die Oberflächensprache, ist deshalb auch beim nächsten Teststand noch vorhanden. Sie wird nicht automatisch zurückgesetzt. Wird später ein Test mit frischer Datenbank gebraucht, wird dafür ein ausdrücklich ausgelöster Vorgang festgelegt; einen solchen gibt es derzeit nicht.

### Beenden: stop

`stop` beendet nur Prozesse, die `pipwerk-dev start` gestartet hat. Jeder Prozess wird beim Start in einer eigenen Prozessgruppe gestartet, und `pipwerk-dev` merkt sich Prozessnummer und Startzeitpunkt. So werden nach einem Neustart oder bei wiederverwendeten Prozessnummern keine fremden Prozesse getroffen. Die Prozesse erhalten zuerst die Aufforderung zum Beenden und nach zehn Sekunden ein hartes Ende.

### Zustand ansehen: status

`status` zeigt für jeden Arbeitsbereich den Commit, den Branch oder „detached HEAD“ und die Zahl lokaler Änderungen. Für Pipwerk Studio zeigt es den laufenden Commit, die Prozesse und das Ergebnis der drei Erreichbarkeitsprüfungen. `status` verändert nichts, auch nicht den Git-Index.

### Protokolle

Im lokalen Zustandsverzeichnis führt `pipwerk-dev` ein Protokoll mit einer Zeile je zustandsänderndem Aufruf, die vollständige Ausgabe jeder Prüfung und Einrichtung, die Liste der gestarteten Prozesse und die Ausgabe von Backend und Oberfläche. Zugangsdaten in Adressen, GitHub-Token und Werte nach Angaben wie `token=`, `password=` oder `Authorization:` ersetzt `pipwerk-dev` vor der Ausgabe und vor dem Schreiben in Protokolle durch `***`.

### Verhalten bei Fehlern und Exitcodes

`pipwerk-dev` bricht lieber ab, als einen unklaren Zustand zu verändern. Jede Ablehnung nennt den Grund. Die Exitcodes sind: 0 Erfolg, 1 fehlgeschlagen, 2 falscher Aufruf, 3 verweigert. Ein zweiter zustandsändernder Aufruf, während einer läuft, endet mit Exitcode 3.

## 6. Ein Arbeitsauftrag von Anfang bis Ende

Die folgende Übersicht zeigt, wer welchen Schritt ausführt und welches Werkzeug dabei verwendet wird. Die Regeln jeder Rolle stehen in [Agentenrollen und Briefings](agentenrollen-und-briefings.md).

| Schritt | Wer | Womit |
|---|---|---|
| 1. Auftrag klären, schreiben, freigeben | Projektleiter mit Nutzer | Pull Request mit der Auftragsdatei unter `docs/design/planning/work-orders/`; Status `freigegeben` |
| 2. Referenz-Repository nachziehen | auf dem Entwicklungsrechner | `pipwerk-dev sync-repo` |
| 3. Auftrag übergeben | auf Veranlassung des Projektleiters | interaktive Sitzung gemäß Abschnitt 4; Auftragspfad und Commit direkt übergeben |
| 4. Auftrag übernehmen und vorbereiten | Softwarearchitekt | Claude-Code-Sitzung in `repo/` |
| 5. Umsetzen | Entwickler (Teammate) | `pipwerk-dev prepare implement …`, dann Arbeitsbranch in `implement/` |
| 6. Pull Request erstellen | Entwickler | GitHub |
| 7. Unabhängig prüfen | QA (Teammate) | `pipwerk-dev prepare review …` bzw. `update review …`, dann Prüfung in `review/` |
| 8. Korrigieren, falls nötig | Softwarearchitekt steuert, Entwickler korrigiert, QA prüft erneut | wie Schritte 5 bis 7 |
| 9. Teststand bereitstellen | Softwarearchitekt | `pipwerk-dev start pipwerk-studio <commit>` |
| 10. Abnahmekriterien prüfen | Projektleiter | laufender Teststand |
| 11. Praktisch erproben | Nutzer | laufender Teststand |
| 12. Abschluss und Merge | Projektleiter gibt frei, Softwarearchitekt führt aus | GitHub; Teammates abmelden, danach `/exit` in der Sitzung |

Zu einzelnen Schritten:

**Schritte 2 und 3.** Vor dem Teamstart liegt der freigegebene Auftrag auf `main`, und `repo/` wird mit `sync-repo` aktualisiert. So liest die neue Sitzung auch nach Änderungen unter `.claude/` die aktuellen Agentendefinitionen und Skills. Die Prüfungen und die direkte Auftragsübergabe stehen in Abschnitt 4.

**Schritt 9.** Der Softwarearchitekt stellt genau den Commit bereit, den die QA freigegeben hat, und übergibt `pipwerk-dev start` dafür den vollständigen Commit-Hash. Läuft noch ein Teststand aus einem anderen Commit, beendet er ihn vorher mit `pipwerk-dev stop`. `pipwerk-dev start` meldet erst Erfolg, wenn die Anwendung antwortet. Danach prüft der Softwarearchitekt mit `pipwerk-dev status`, dass der laufende Commit der freigegebene ist, und übergibt erst dann an den Projektleiter. Ändert sich nach der Freigabe der Code, ist die QA-Freigabe ungültig, und es wird erst nach erneuter Freigabe bereitgestellt.

**Schritt 12.** Nach dem Merge ist die Sitzung des Softwarearchitekten noch offen. Nach Abmeldung der Teammates wird sie mit `/exit` beendet. Vor dem nächsten Auftrag wird `repo/` erneut mit `pipwerk-dev sync-repo` aktualisiert.

## 7. Störungen und Wiederanlauf

**Claude wurde beendet oder ist abgestürzt.** Vor einer weiteren Bearbeitung werden Auftrag, Branch, Pull Request, letzter Commit und vorhandene QA-Ergebnisse festgestellt. Der Projektleiter übergibt den Auftrag mit diesen Referenzen erneut an den Softwarearchitekten. Ein unbekannter oder geänderter Commit übernimmt keine frühere QA-Freigabe.

**Claude Code wartet beim ersten Start auf eine Vertrauensbestätigung.** Die Abfrage wird in der interaktiven Sitzung für das vorgesehene Repository beantwortet, bevor der Auftrag übergeben wird.

**Der Auftrag ist nicht freigegeben oder nicht auf main.** Der Projektleiter klärt die Freigabe und sorgt dafür, dass der Auftrag auf `main` liegt. Vorher beginnt keine Bearbeitung durch das Team.

**repo/ ist veraltet.** `pipwerk-dev sync-repo` aufrufen. Verweigert es den Fast-Forward, nennt die Meldung den Grund.

**repo/ ist nicht sauber oder steht nicht auf main.** `sync-repo` verwirft nichts. Zuerst muss geklärt werden, woher die Änderungen oder der andere Branch stammen. Erst danach wird `repo/` von Hand bereinigt und `sync-repo` erneut aufgerufen.

**pipwerk-dev verweigert die Vorbereitung eines Arbeitsbereichs**, etwa wegen liegengebliebener Dateien in `implement/` oder `review/`. Der betroffene Agent meldet das dem Softwarearchitekten. Dieser ermittelt anhand von Diff, Auftragsreferenzen und Laufprotokollen den Ursprung und beauftragt die zuständige Rolle mit der Bereinigung ihrer eigenen Artefakte. Fremde Änderungen werden nicht verworfen. Nur wenn der Ursprung nicht feststellbar ist, fordert der Projektleiter vom Nutzer die Entscheidung zur Erhaltung oder Entfernung der konkret benannten Dateien an.

**Entwickler oder QA haben in einem fremden Arbeitsbereich etwas verändert.** Der Entwickler ist angewiesen, in diesem Fall die Arbeit abzubrechen und den Verstoß dem Softwarearchitekten zu melden; fremde Bereiche bereinigt er nicht selbst. Der Softwarearchitekt lässt zuerst bereinigen und übergibt einen fehlerhaften Stand nicht an die QA. Die QA bewertet einen Pull Request mit fremden oder nicht zum Auftrag gehörenden Änderungen als „nicht bestanden“. `pipwerk-dev status` zeigt, in welchem Arbeitsbereich lokale Änderungen liegen.

**Der Teststand startet nicht.** Die Meldung von `pipwerk-dev start` nennt den Grund, etwa belegte Ports, fehlgeschlagene Abhängigkeiten oder eine fehlende Komponente im Commit. Die vollständige Ausgabe steht in den Protokollen von `pipwerk-dev`. Die Prozesse, die `start` selbst gestartet hatte, sind in diesem Fall bereits wieder beendet.

**Backend oder Oberfläche sind nicht erreichbar.** `pipwerk-dev status` zeigt, welcher Prozess läuft und welche der drei Adressen antwortet. Das Protokoll des betroffenen Prozesses nennt meist die Ursache, zum Beispiel eine ungültige Startkonfiguration. Danach `pipwerk-dev stop` und erneut `pipwerk-dev start` mit demselben Commit.

**Die QA findet einen Fehler.** Das ist der normale Korrekturweg und keine Störung: Der Softwarearchitekt ordnet den Befund ein, der Entwickler korrigiert, die QA prüft den neuen Commit.

**Der Nutzer lehnt den Teststand ab.** Der Projektleiter klärt die Gründe und, wenn nötig, den Auftrag. Danach steuert der Softwarearchitekt die Korrektur über Entwicklung, QA und eine neue Testbereitstellung. Läuft die Sitzung des Softwarearchitekten nicht mehr, erfolgt eine erneute Übergabe mit Auftrag, aktuellem PR und Commit wie oben beschrieben.

## 8. Voraussetzungen für einen Entwicklungsrechner

Die konkrete Einrichtung des Entwicklungsrechners steht in der lokalen Dokumentation. Allgemein werden gebraucht:

- **Programme:** Git, Python 3 ab Version 3.11 für die lokalen Werkzeuge, uv für das Backend, Node.js mit npm für die Oberfläche, die Playwright-Browser für die Oberflächentests, Claude Code und die GitHub-Kommandozeile `gh`, mit der die Agenten Pull Requests anlegen.
- **Anmeldungen:** Claude Code muss für den ausführenden Benutzer angemeldet sein. `gh` muss bei GitHub mit einem Konto angemeldet sein, das Branches pushen und Pull Requests anlegen darf. Zugangsdaten gehören weder ins Repository noch in die Werkzeuge.
- **Einstellungen von Claude Code:** Im Repository schaltet `.claude/settings.json` nur die Teamfunktion ein. Die Einstellungen des Benutzers müssen den Agenten erlauben, aus `repo/` heraus auf die übrigen Arbeitsbereiche zuzugreifen, und müssen die für den freigegebenen Auftrag benötigten Werkzeuge und Arbeitsbereiche freigeben.
- **Verzeichnisse:** das Pipwerk-Entwicklungsverzeichnis mit `repo/` als Klon des Repositorys auf `main`, `transfer/` und `scripts/` mit den lokalen Werkzeugen. `implement/`, `review/` und `test/` legt `pipwerk-dev` als Worktrees an.

Eine automatische Einrichtung gibt es nicht.

## 9. Lokale Werkzeuge und öffentliches Repository

`pipwerk-dev` gehört zur lokalen Entwicklungsinfrastruktur und wird nicht in diesem Repository versioniert. Es enthält die konkrete, serverbezogene Umsetzung und bleibt deshalb außerhalb des öffentlichen Repositorys. Dieses Dokument beschreibt seine Aufgabe, seine Schnittstelle und seine Rolle im Entwicklungsverfahren.

Weil das Verfahren auf dieses Werkzeug angewiesen ist, muss es außerhalb des öffentlichen Repositorys gesichert und nachvollziehbar versioniert werden. Wo und wie, entscheidet der Nutzer; eine solche Ablage gibt es derzeit noch nicht.

## Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-07 | Veraltete Start- und Sitzungsverwaltung entfernt; direkte Auftragsübergabe und lokale Startumgebung dokumentiert. Claude-Team und `pipwerk-dev` bleiben erhalten. |
| 2026-10-07 | Bereinigung eigener Arbeitsreste durch die zuständige Rolle verbindlich geregelt; Nutzerentscheidung ausschließlich bei ungeklärtem Ursprung. |
| 2026-10-07 | Agentendefinitionen: vor dem Wechsel in den Arbeitsbereich ist nur die Prüfung erlaubt, ob `PIPWERK_DEV_ROOT` gesetzt ist. |
| 2026-10-07 | Keine ausgeschriebenen Pfade in Aufträgen; Abmeldung der Teammates über die Nachricht `ABMELDUNG BESTÄTIGT`. |
| 2026-10-07 | Störungsfall „Vertrauensabfrage beim ersten Start“ ergänzt. |
| 2026-10-07 | Testbereitstellung durch den Softwarearchitekten mit `pipwerk-dev start` und Verifikation verbindlich beschrieben; Verweis auf Recherche-Umfang und Dokumentationspflicht. |
| 2026-10-06 | Serverbezogene Angaben entfernt; `pipwerk-dev sync-repo`, die Umgebungsvariable `PIPWERK_DEV_ROOT` und die Vorbereitung der Arbeitsbereiche durch Entwickler und QA beschrieben; Testdatenbank ausdrücklich als dauerhaft festgehalten; lokale Werkzeuge bleiben außerhalb des öffentlichen Repositorys. |
| 2026-10-06 | Erstfassung: Gesamtverfahren, Beteiligte, Verzeichnisse, `pipwerk-dev`, Ablauf eines Auftrags, Störungen und Einrichtung. |
