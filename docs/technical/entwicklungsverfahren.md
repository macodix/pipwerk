# Das Pipwerk-Entwicklungsverfahren

## Status

- status: `draft`
- stand: 2026-10-08
- bereich: Entwicklungsprozess (keine Produktkomponente)

## Geltungsbereich

Dieses Dokument beschreibt die weiterhin geltenden, vom Transport eines Arbeitsauftrags unabhängigen Prozessregeln. Die technische Ausführung und Anbindung einer künftigen Entwicklungsautomatisierung sind offen.

Maßgeblich sind das aktuelle Repository, der freigegebene Arbeitsauftrag und die für die Änderung geltenden Anforderungen und Verträge. Chats und temporäre Übergaben ersetzen keine Repository-Dokumentation.

- [Agentenrollen und Briefings](agentenrollen-und-briefings.md) regeln Zuständigkeiten, Entscheidungsgrenzen, Recherche, Dokumentation und Bereinigung eigener Arbeitsreste.
- [Claude-Code-Agentenstruktur](claude-code-agentenstruktur.md) beschreibt die vorhandenen Rollendefinitionen und Skills.
- [Entwicklungsplan](../design/planning/entwicklungsplan-strategiedesigner.md) enthält die Prozessgrundsätze und Produktplanung.
- [Entwicklungs-, Test- und Sicherheitsregeln](development-test-security-rules.md) bestimmen die technischen Qualitätsanforderungen.

## Arbeitsauftrag und Ablauf

Ein Arbeitsauftrag enthält Kennung, Ziel, Umfang und Nicht-Umfang, nachprüfbare Abnahmekriterien, geltende Referenzen und offene Punkte. Ablage und Statusverlauf regelt der Abschnitt [Auftragsablage und Statusverlauf](#auftragsablage-und-statusverlauf).

1. Der Projektleiter klärt den Auftrag mit dem Nutzer und dokumentiert ihn im Repository. Er wird erst nach Nutzerfreigabe und Klärung der erforderlichen fachlichen Fragen umgesetzt.
2. Der Softwarearchitekt erhält eine eindeutige Auftragsreferenz, prüft den aktuellen Repository-Stand und bereitet die Umsetzung innerhalb dokumentierter Architekturvorgaben vor.
3. Der Entwickler implementiert im eigenen Branch und Arbeitsbereich, führt die vorgesehenen Prüfungen aus, aktualisiert die Dokumentation und erstellt einen Pull Request.
4. Die unabhängige QA prüft Auftrag, Ausgangsstand, konkreten PR und Commit, Code, Tests und Dokumentation. Befunde werden vollständig korrigiert und erneut geprüft. Eine Fertigmeldung ersetzt die QA nicht.
5. Der Softwarearchitekt stellt genau den QA-freigegebenen Commit als Teststand bereit, startet die Anwendung und prüft Erreichbarkeit und Commit-Identität. Eine spätere Codeänderung erfordert erneute QA.
6. Der Projektleiter prüft jedes Abnahmekriterium am Teststand. Erst bei erfülltem Auftrag erhält der Nutzer den Stand zur praktischen Erprobung. Abweichungen führen zurück in die Korrektur.
7. Erst nach Nutzerabnahme und Abschlussfreigabe durch den Projektleiter veranlasst der Softwarearchitekt Merge und Abschluss und prüft den übernommenen Stand.

Änderungen an Programmcode und wesentlicher Dokumentation erfolgen über Branch und Pull Request. Übergaben benennen Arbeitsauftrag, Branch, PR, Commit und Prüfergebnis eindeutig. Der Nutzer muss weder PRs technisch prüfen noch den Teststand selbst installieren und starten.

## Auftragsablage und Statusverlauf

Jeder Arbeitsauftrag ist eine eigene Markdown-Datei unter `work-orders/`. Der Status steht im Abschnitt „Status“ der Datei im Feld `status`. Dieser Eintrag ist maßgeblich. Zusätzlich liegt die Datei im Unterverzeichnis, das ihrem Status zugeordnet ist. Die Verzeichnisse dienen der Übersicht; mehrere Status dürfen demselben Verzeichnis zugeordnet sein.

| Status | Bedeutung | Verzeichnis | gesetzt von |
|---|---|---|---|
| `draft` | Auftrag in Klärung | keins; liegt nur im Pull Request des Auftrags | Projektleiter |
| `approved` | vom Nutzer freigegeben | `approved/` | Projektleiter mit dem Merge des Auftrags nach Nutzerfreigabe |
| `in-progress` | in Umsetzung, Korrektur oder QA | `in-progress/` | Softwarearchitekt bei Arbeitsbeginn; Projektleiter bei „Auftrag nicht erfüllt“ oder Ablehnung durch den Nutzer |
| `acceptance` | Teststand bereit; Prüfung durch Projektleiter und Erprobung durch den Nutzer | `acceptance/` | Softwarearchitekt nach verifizierter Testbereitstellung |
| `closed` | abgenommen, gemergt und abgeschlossen | `closed/` | Softwarearchitekt nach Abschlussfreigabe und kontrolliertem Merge |

Weitere Status werden in diese Tabelle aufgenommen, bevor sie verwendet werden. Stimmen Statuseintrag und Verzeichnis nicht überein, ist das ein Fehler, den die Rolle behebt, die den Statuswechsel ausgeführt hat.

Inhaltliche Änderungen eines Auftrags erfolgen über Branch und Pull Request und nach der Freigabe nur mit Zustimmung des Nutzers. Ein reiner Statuswechsel – Änderung des Feldes `status` und Verschiebung der Datei, ohne sonstige Inhaltsänderung – ist Verwaltungsarbeit und wird direkt auf `main` gebucht. Der Softwarearchitekt verändert dafür `repo/` nicht lokal, sondern bucht den Statuswechsel ohne lokalen Arbeitsbereich, zum Beispiel über die GitHub-API, und bringt `repo/` danach mit `pipwerk-dev sync-repo` auf den neuen Stand.

Die Ablage in Statusverzeichnissen ist eine Übergangslösung. Ob Status und Verlauf später in einem anderen System geführt werden, ist offen. Der Statuseintrag in der Datei bleibt deshalb unabhängig von den Verzeichnissen erhalten.

## Geplanter Anstoß der Umsetzung

Dieser Abschnitt beschreibt das beschlossene Ziel. Die Einrichtung ist noch nicht erfolgt; bis dahin stößt der Nutzer die Sitzung des Softwarearchitekten an.

- Ein GitHub-Actions-Workflow startet bei einem Push auf `main`, der Dateien unter `work-orders/approved/` ändert. Er setzt die Umsetzung nur für dort neu hinzugekommene Dateien in Gang; andere Änderungen, etwa das Herausschieben einer Datei beim Statuswechsel, beenden ihn ohne Wirkung.
- Der Workflow läuft auf einem selbst betriebenen Runner auf dem Entwicklungsrechner unter einem eigenen Benutzer mit eingeschränkten Rechten. Er hat keine Auslöser für Pull Requests, damit Änderungsvorschläge Dritter im öffentlichen Repository keinen Code auf dem Entwicklungsrechner ausführen.
- Der Runner prüft die [verbindliche Aufrufschnittstelle](claude-code-agentenstruktur.md#verbindliche-aufrufschnittstelle) und startet die Sitzung des Softwarearchitekten mit der Auftragsreferenz in `repo/`. Das Agententeam wird über tmux gestartet; ob die Teamfunktion so zuverlässig läuft, ist durch einen Probelauf nachzuweisen.
- Claude Code wird über ein Claude-Abo mit festem Monatspreis betrieben, nicht verbrauchsabhängig abgerechnet. Eine Kostenbegrenzung je Lauf ist deshalb nicht vorgesehen; das Erreichen der Nutzungsgrenze unterbricht die Arbeit nur.

Offen sind die konkrete Workflow-Definition, die Einrichtung des Runners und der Nachweis eines vollständigen Durchlaufs gemäß dem [Entwicklungsplan](../design/planning/entwicklungsplan-strategiedesigner.md#ziel-der-entwicklungsautomatisierung).

## Arbeitsbereiche und Umgang mit Fehlern

Entwicklung und unabhängige QA verwenden getrennte Arbeitsbereiche. Die festen Arbeitsbereiche und ihre Schutzregeln stehen im folgenden Abschnitt. Ausgangs- beziehungsweise Prüfcommit werden im jeweiligen Auftrag eindeutig benannt. Der Teststand entspricht unverändert dem freigegebenen Commit.

Eigene Fehler, unvollständige Änderungen und Testreste werden vor der Übergabe vollständig beseitigt. Fremde Änderungen werden nicht verworfen. Die zuständige Rolle wird anhand von Diff, Auftragsreferenzen und Prüfnachweisen ermittelt. Nur zwingend fehlende Entscheidungen, Berechtigungen oder Handlungen außerhalb der eigenen Zuständigkeit werden eskaliert; unabhängige Arbeiten werden fortgesetzt.

## Verbindliche Arbeitsbereiche

Auf dem Entwicklungsrechner gibt es ein Pipwerk-Entwicklungsverzeichnis. Darin liegen nebeneinander die folgenden Verzeichnisse. Die Namen sind fest, weil Werkzeuge und Agentendefinitionen sie verwenden.

Die Verzeichnisse `repo/`, `implement/`, `review/` und `test/` sind Git-Arbeitsbereiche desselben Repositorys. `repo/` ist ein normaler Klon von GitHub, die übrigen drei sind daran angehängte Worktrees. Ein Worktree ist ein zusätzliches Arbeitsverzeichnis, das sich die Git-Daten mit `repo/` teilt, aber einen eigenen Branch oder Commit ausgecheckt hat.

Die Agenten finden das Pipwerk-Entwicklungsverzeichnis über die Umgebungsvariable `PIPWERK_DEV_ROOT`. Jedes aufrufende Programm muss sie gemäß der [verbindlichen Aufrufschnittstelle](claude-code-agentenstruktur.md#verbindliche-aufrufschnittstelle) prüfen und in der Prozessumgebung des Teams bereitstellen. Die konkrete Umsetzung des Aufrufers ist offen. Kein Agent setzt, überschreibt oder entfernt sie; alle verwenden nur den gesetzten Wert und schreiben Pfade über die Variable. Der Softwarearchitekt nennt Entwickler und QA ihre Arbeitsbereiche deshalb nur als `$PIPWERK_DEV_ROOT/implement` und `$PIPWERK_DEV_ROOT/review`, nie als ausgeschriebenen Pfad. Die Agentendefinitionen enthalten keine Pfade des Rechners. Ist die Variable nicht gesetzt, brechen die Agenten ab.

### repo/ – Referenz-Repository

`repo/` ist das Arbeitsverzeichnis des Softwarearchitekten. Die Claude-Code-Sitzung wird dort gestartet, damit Claude Code die Agentendefinitionen aus `repo/.claude/` liest. Deshalb muss `repo/` auf dem aktuellen Stand von `origin/main` stehen und darf keine lokalen Änderungen haben. Dieser Zustand muss vor Arbeitsbeginn geprüft werden.

Der Softwarearchitekt arbeitet ausschließlich mit `repo/` als eigenem Arbeitsverzeichnis. Inhalte anderer Arbeitsbereiche prüft er über absolute Pfade, ohne in sie zu wechseln. Entwickler und QA dürfen `repo/` lesen, aber nichts darin ändern.

Auf den aktuellen Stand gebracht wird `repo/` mit `pipwerk-dev sync-repo`. Sonst verändert `pipwerk-dev` dort nur Verwaltungsdaten: Es holt mit `git fetch` den Stand von GitHub und legt von dort aus die anderen Worktrees an. Den lokalen Branch `main` bewegt nur `sync-repo`.

### implement/ – Arbeitsbereich des Entwicklers

Nur der Entwickler ändert hier etwas, und zwar in seinem Arbeitsbranch. Zu Beginn eines Auftrags legt er den Branch mit `pipwerk-dev prepare` auf dem Ausgangsstand an, den der Softwarearchitekt nennt. Der Branch `main` wird hier nie ausgecheckt.

### review/ – Arbeitsbereich der QA

Dieser Bereich ist von `implement/` getrennt, damit die QA einen Stand unabhängig vom Entwickler prüfen kann. Nur die QA arbeitet hier. Sie legt für einen Auftrag einen lokalen Prüfbranch auf dem zu prüfenden Commit an und bringt ihn für eine erneute Prüfung auf den neuen Commit. Sie committet und pusht dort nichts.

### test/ – Teststand

Nur `pipwerk-dev` verändert diesen Arbeitsbereich: `pipwerk-dev start` und `pipwerk-dev update test` setzen ihn auf einen bestimmten Commit, ohne Branch („detached“). Von Hand oder von einem Agenten wird hier nichts geändert, sonst entspräche der Teststand nicht mehr dem freigegebenen Commit.

### transfer/ – Ablage für Arbeitsergebnisse

Hier liegen Arbeitsergebnisse zwischen den Beteiligten, zum Beispiel Berichte und Übergabenotizen. Die Inhalte sind keine Projektfestlegungen. Was dauerhaft gelten soll, wird in die zuständige Dokumentation im Repository übernommen. Kein Werkzeug verändert dieses Verzeichnis.

### scripts/ – lokale Werkzeuge

Hier liegen `pipwerk-dev`, seine automatischen Tests und die lokale Dokumentation der Entwicklungsumgebung. Diese Dateien gehören nicht zum Pipwerk-Repository. Das Team ändert sie nicht.

### Lokales Zustandsverzeichnis

`pipwerk-dev` schreibt seine Zustands- und Protokolldateien in ein lokales Zustandsverzeichnis des ausführenden Benutzers außerhalb aller Arbeitsbereiche. Nichts davon gelangt ins Repository.

## Lokales Hilfswerkzeug pipwerk-dev

`pipwerk-dev` verwaltet Git-Arbeitsbereiche, Prüfungen und Teststände unabhängig von der Auftragsübermittlung. Seine bestehenden Schutzregeln und seine Verwendung durch die Agenten bleiben erhalten. Damit wird keine neue Auftragsanbindung festgelegt.

Das Werkzeug ist nicht im Repository enthalten. Seine konkrete Installation, Konfiguration und Sicherung sind lokal zu dokumentieren; aus dieser Beschreibung folgt kein Nachweis über den aktuellen Zustand eines Entwicklungsrechners. Zugangsdaten und lokale Zustandsdateien gehören nicht ins öffentliche Repository.

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

`sync-repo` aktualisiert das lokale Referenz-Repository, wenn `origin/main` inzwischen weiter ist, zum Beispiel nach dem Merge eines Pull Requests. Es holt den Stand von GitHub und spult den Branch `main` in `repo/` per Fast-Forward auf `origin/main` vor.

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


## Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-08 | Auftragsablage nach `work-orders/` auf oberster Ebene verlegt. |
| 2026-10-07 | Auftragsablage mit Statusfeld und Statusverzeichnissen, Statuswechsel als Verwaltungsarbeit auf `main` und geplanten Anstoß über GitHub Actions festgelegt. |
| 2026-10-07 | Verworfene Auftrags- und Sitzungsautomatisierung entfernt; transportunabhängige Prozessregeln und die eigenständige Schnittstelle des lokalen Hilfswerkzeugs erhalten. Frühere Fassungen sind in Git nachvollziehbar. |
