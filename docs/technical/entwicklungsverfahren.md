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

Beschrieben ist der tatsächliche Stand vom 2026-10-06. Was es noch nicht gibt, ist ausdrücklich als nicht vorhanden gekennzeichnet.

## 1. Überblick: Was passiert mit einem freigegebenen Arbeitsauftrag?

Ein Arbeitsauftrag beschreibt eine abgegrenzte Änderung an Pipwerk: Ziel, Umfang, gewünschtes Verhalten und nachprüfbare Abnahmekriterien. Der Projektleiter klärt den Auftrag mit dem Nutzer und legt ihn als Markdown-Datei im Repository unter `docs/design/planning/work-orders/` ab. Erst wenn der Nutzer den Auftrag freigegeben hat, trägt die Datei den Status `freigegeben`.

Mit diesem Auftrag wird auf dem Entwicklungsrechner der Dispatcher `pipwerk-dispatch` gestartet. Der Dispatcher öffnet eine Claude-Code-Sitzung für den Softwarearchitekten und übergibt ihr den Pfad des Auftrags. Mehr tut der Dispatcher nicht. Er wählt keinen Auftrag aus, er überwacht nicht den Fortschritt und er entscheidet nichts.

Der Softwarearchitekt leitet ab hier das Claude-Code-Team. Er liest den Auftrag und den aktuellen Stand des Repositorys. Er setzt einen Entwickler ein, der die Änderung in einem eigenen Branch umsetzt, prüft und als Pull Request auf GitHub bereitstellt. Danach setzt er die QA ein. Die QA prüft genau diesen Pull Request bei genau einem Commit unabhängig. Findet die QA Mängel, geht der Auftrag zurück an den Entwickler, und die QA prüft den neuen Commit erneut. Das wiederholt sich, bis die QA den Stand freigibt.

Den von der QA freigegebenen Commit stellt der Softwarearchitekt als Teststand bereit. Dafür gibt es das zweite Werkzeug, `pipwerk-dev`. Es setzt einen eigenen Arbeitsbereich auf genau diesen Commit, installiert die Abhängigkeiten, startet die Anwendung und prüft, dass sie antwortet.

Am laufenden Teststand prüft der Projektleiter jedes Abnahmekriterium. Ist der Auftrag erfüllt, probiert der Nutzer die Testversion praktisch aus. Nimmt der Nutzer sie an, gibt der Projektleiter den Abschluss frei, und der Softwarearchitekt lässt den Pull Request mergen. Lehnt der Nutzer ab oder ist ein Kriterium nicht erfüllt, geht der Auftrag zurück in die Korrektur.

Zwei Dinge sind für das Verständnis wichtig:

- **Das Repository ist die maßgebliche Quelle.** Aufträge, Entscheidungen, Agentendefinitionen und Dokumentation liegen dort. Was nur in einem Chat, in einer Agentennachricht oder in `transfer/` steht, ist keine Festlegung.
- **`pipwerk-dispatch` und `pipwerk-dev` haben getrennte Aufgaben.** Der Dispatcher bringt einen Auftrag zum Softwarearchitekten. `pipwerk-dev` verwaltet die Git-Arbeitsbereiche und den Teststand. Keines der beiden Werkzeuge ruft das andere auf.

## 2. Die Beteiligten

### Nutzer

Der Nutzer ist der Auftraggeber. Er trifft die fachlichen Entscheidungen und die grundlegenden Architekturentscheidungen, gibt Arbeitsaufträge frei und probiert die fertige Testversion praktisch aus. Pull Requests, Programmcode oder umfangreiche Dokumentationsänderungen muss er nicht selbst prüfen.

### Projektleiter

Der Projektleiter ist die Schnittstelle zum Nutzer. Er klärt Aufträge, schreibt sie ins Repository, veranlasst den Start des Dispatchers und prüft am Teststand die Abnahmekriterien. Er gehört nicht zum Claude-Code-Team. Derzeit übernimmt ChatGPT diese Rolle.

Zwischen Projektleiter und Dispatcher gibt es noch keine technische Verbindung. Der Aufruf von `pipwerk-dispatch` erfolgt auf dem Entwicklungsrechner. Eine Anbindung über Matrix ist als späterer Schritt vorgesehen und nicht vorhanden.

### pipwerk-dispatch (Dispatcher)

Der Dispatcher übergibt einen ausdrücklich genannten, freigegebenen Auftrag an den Softwarearchitekten. Er startet dafür eine interaktive Claude-Code-Sitzung in `tmux`, zeigt ihren Zustand an, setzt sie nach einem Abbruch fort und beendet sie. Einzelheiten stehen in Abschnitt 4.

### Claude-Code-Team

Das Team besteht aus Softwarearchitekt, Entwickler und QA. Alle drei sind Claude-Code-Agenten. Ihre Definitionen liegen im Repository unter `.claude/agents/`, wiederverwendbare Arbeitsschritte unter `.claude/skills/`. Die Teamfunktion von Claude Code („Agent Teams“) ist derzeit experimentell und wird in `.claude/settings.json` eingeschaltet.

Der Softwarearchitekt ist der Leiter des Teams (Team Lead). Er startet Entwickler und QA als sogenannte Teammates. Teammates laufen im selben Claude-Code-Prozess wie der Softwarearchitekt. Sie haben kein eigenes Startverzeichnis. Die Trennung der Arbeitsbereiche beruht deshalb auf verbindlichen Anweisungen in den Agentendefinitionen (Abschnitt 3).

| Rolle | Agentendefinition | Modell (Startkonfiguration) |
|---|---|---|
| Softwarearchitekt | `software-architect` | Opus |
| Entwickler | `developer` | Sonnet |
| QA | `qa` | Opus |

Die Modellzuordnung ist eine Startkonfiguration und kann nach praktischen Erfahrungen geändert werden.

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

Die Agenten finden das Pipwerk-Entwicklungsverzeichnis über die Umgebungsvariable `PIPWERK_DEV_ROOT`. Der Dispatcher setzt sie beim Start der Sitzung. Die Agentendefinitionen enthalten deshalb keine Pfade des Rechners. Ist die Variable nicht gesetzt, brechen die Agenten ab.

### repo/ – Referenz-Repository

`repo/` ist das Arbeitsverzeichnis des Softwarearchitekten. Der Dispatcher startet die Claude-Code-Sitzung dort, und Claude Code liest die Agentendefinitionen aus `repo/.claude/`. Deshalb muss `repo/` auf dem aktuellen Stand von `origin/main` stehen und darf keine lokalen Änderungen haben. Der Dispatcher prüft das vor jedem Start.

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

Hier liegen `pipwerk-dev`, `pipwerk-dispatch`, ihre automatischen Tests und die lokale Dokumentation der Entwicklungsumgebung. Diese Dateien gehören nicht zum Pipwerk-Repository (Abschnitt 9). Das Team ändert sie nicht.

### Lokales Zustandsverzeichnis

Beide Werkzeuge schreiben ihre Zustands- und Protokolldateien in ein lokales Zustandsverzeichnis des ausführenden Benutzers außerhalb aller Arbeitsbereiche. Nichts davon gelangt ins Repository.

## 4. pipwerk-dispatch

### Zweck

Der Dispatcher bringt einen freigegebenen Arbeitsauftrag zum Softwarearchitekten. Claude-Code-Teams brauchen eine interaktive Sitzung; der nicht interaktive Modus `claude -p` ist dafür nicht geeignet und wird nicht verwendet. Damit eine interaktive Sitzung ohne geöffnetes Terminal weiterläuft, startet der Dispatcher sie in `tmux`. `tmux` ist ein Programm, das Terminal-Sitzungen im Hintergrund weiterlaufen lässt; man kann sich jederzeit dazuschalten und wieder lösen.

Der Dispatcher kümmert sich nur um diese eine Sitzung: starten, Zustand anzeigen, nach einem Abbruch fortsetzen, beenden. Er liest keine Ergebnisse aus und erkennt nicht, ob ein Auftrag fertig ist.

### Voraussetzungen

- `repo/` steht auf dem Stand von `origin/main`, mindestens im Verzeichnis `.claude/`, und hat keine lokalen Änderungen. Dafür gibt es `pipwerk-dev sync-repo`.
- `git`, `tmux` und Claude Code sind installiert, und Claude Code ist für den ausführenden Benutzer angemeldet.
- Der Auftrag liegt auf `origin/main` und hat den Status `freigegeben`.

### Befehle im Überblick

```sh
pipwerk-dispatch start docs/design/planning/work-orders/<auftrag>.md
pipwerk-dispatch start --test-order <lokale Testauftragsdatei>
pipwerk-dispatch status [--json]
pipwerk-dispatch restart
pipwerk-dispatch stop [--force]
```

### start – einen Auftrag übergeben

`start` wird verwendet, wenn ein neuer, freigegebener Auftrag bearbeitet werden soll und kein anderer Lauf existiert. Der Auftrag wird als Pfad relativ zum Repository angegeben.

Der Dispatcher prüft in dieser Reihenfolge:

1. Es gibt keinen gespeicherten Lauf und keine `tmux`-Sitzung mit dem Namen des Dispatchers.
2. Der Pfad liegt unter `docs/design/planning/work-orders/` und endet auf `.md`.
3. Nach einem `git fetch` ist die Datei auf `origin/main` vorhanden. Geprüft wird die Datei auf GitHub-Stand, nicht eine lokale Kopie.
4. Die Datei enthält die Zeile ``- status: `freigegeben` ``.
5. `repo/` hat keine lokalen Änderungen, auch keine neuen, nicht versionierten Dateien.
6. Das Verzeichnis `.claude/` in `repo/` ist identisch mit dem auf `origin/main`.

Ist alles erfüllt, startet der Dispatcher in `repo/` den Befehl `claude --agent software-architect` und setzt dabei `PIPWERK_DEV_ROOT`. Als erste Eingabe erhält der Softwarearchitekt einen Satz mit dem Pfad des Auftrags und dem Commit von `origin/main`, auf dem der Auftrag geprüft wurde. Damit ist der Auftrag aktiv übergeben; der Softwarearchitekt sucht nicht selbst nach Aufträgen.

Umgebungsvariablen einer aufrufenden Claude-Code-Sitzung, etwa Sitzungskennungen oder Sitzungstoken, gibt der Dispatcher nicht an die neue Sitzung weiter. Das ist wichtig, wenn der Dispatcher selbst aus einer Claude-Code-Sitzung heraus aufgerufen wird.

### start --test-order – Probelauf mit einem Testauftrag

Mit `--test-order` wird statt eines Repository-Auftrags eine lokale Datei übergeben. Das dient zum gefahrlosen Prüfen des Dispatchers und des Teams, zum Beispiel mit einem Auftrag, der nur lesende Befehle erlaubt.

Die Datei muss mit absolutem Pfad angegeben werden, darf nicht in `repo/` liegen und muss ebenfalls den Status `freigegeben` tragen. Der Softwarearchitekt erfährt in der ersten Eingabe ausdrücklich, dass es ein Testauftrag ist. Alle anderen Prüfungen und Abläufe sind dieselben wie bei `start`.

### Die tmux-Sitzung und die Claude-Sitzung

Der Dispatcher verwendet einen eigenen `tmux`-Server mit einer eindeutig benannten Sitzung. Dadurch kommt er nie mit anderen `tmux`-Sitzungen des Benutzers in Berührung. Man kann sich in die Sitzung einschalten, dem Team zusehen und eingreifen; `status` nennt den Befehl dafür.

Jeder Lauf bekommt eine eigene Claude-Sitzungskennung. Der Dispatcher legt sie beim Start fest und speichert sie. Über diese Kennung setzt `restart` später genau diese Sitzung fort.

### status – nachsehen, was läuft

`status` verändert nichts und kann jederzeit aufgerufen werden. Es meldet einen von fünf Zuständen:

| Zustand | Bedeutung |
|---|---|
| kein Lauf | Es gibt keinen gespeicherten Lauf und keine Sitzung. `start` ist möglich. |
| Lauf aktiv | Der Claude-Prozess des Softwarearchitekten läuft. |
| Claude beendet | Die Sitzung existiert noch, aber Claude ist beendet. Der Exitstatus wird angezeigt. |
| tmux-Session fehlt | Der Lauf ist gespeichert, die `tmux`-Sitzung gibt es aber nicht mehr, etwa nach einem Neustart des Rechners. |
| fremde oder unbekannte tmux-Session | Eine Sitzung mit dem Namen des Dispatchers existiert, gehört aber nicht zum gespeicherten Lauf. Der Dispatcher fasst sie nicht an. |

Zusätzlich zeigt `status` den Auftrag, die `tmux`-Sitzung, die Claude-Sitzungskennung, den Startzeitpunkt und die Zahl der Wiederanläufe. Mit `status --json` kommt dieselbe Information maschinenlesbar.

„Lauf aktiv“ bedeutet nur, dass der Claude-Prozess läuft. Eine interaktive Sitzung bleibt auch dann offen, wenn der Softwarearchitekt fertig ist und auf eine Eingabe wartet. Ob gearbeitet wird oder das Ergebnis vorliegt, sieht man nur in der Sitzung selbst.

### restart – nach einem Abbruch fortsetzen

`restart` wird verwendet, wenn Claude beendet wurde oder abgestürzt ist oder die `tmux`-Sitzung fehlt, der Auftrag aber weiter bearbeitet werden soll. Der Dispatcher setzt dann dieselbe Claude-Sitzung mit `claude --resume` fort. Der Softwarearchitekt erhält dazu den Hinweis, dass es ein Wiederanlauf mit unverändertem Auftrag ist und er den erreichten Stand anhand von Repository, Branches und Pull Requests feststellen soll.

`restart` nimmt nur den bisherigen Auftrag an. Wird ein anderer Auftrag angegeben, bricht es ab. Bei einem laufenden Claude-Prozess ist kein Wiederanlauf möglich. Vorher prüft der Dispatcher `repo/` genauso wie bei `start`.

### stop und stop --force – einen Lauf abschließen

`stop` wird verwendet, wenn ein Lauf erledigt ist und der nächste Auftrag gestartet werden soll. Es beendet die `tmux`-Sitzung des Laufs und löscht den gespeicherten Lauf. Danach meldet `status` „kein Lauf“.

Läuft Claude noch, verweigert `stop` das, damit kein arbeitendes Team versehentlich abgebrochen wird. Der übliche Weg ist, sich in die Sitzung einzuschalten, Claude dort mit `/exit` zu beenden und danach `stop` aufzurufen. `stop --force` beendet auch einen laufenden Lauf; das ist für einen bewussten Abbruch gedacht. Eine fremde Sitzung beendet `stop` nie.

### Schutz vor Doppelstarts

Es gibt höchstens einen Pipwerk-Teamlauf. Solange ein Lauf gespeichert ist, egal ob aktiv, beendet oder ohne Sitzung, verweigert `start` einen weiteren. Zusätzlich verhindert eine Sperre, dass zwei Aufrufe von `start`, `restart` oder `stop` gleichzeitig arbeiten.

### Zustandsdaten

Im lokalen Zustandsverzeichnis speichert der Dispatcher den aktuellen Lauf (Auftrag, Commit von `origin/main`, Claude-Sitzungskennung, `tmux`-Sitzung, Startzeit, Zahl der Wiederanläufe) und ein Protokoll mit einer Zeile je `start`, `restart` und `stop`. `stop` löscht den gespeicherten Lauf, das Protokoll bleibt. Zugangsdaten und API-Schlüssel speichert der Dispatcher nicht und gibt sie nicht aus.

### Exitcodes

| Code | Bedeutung |
|---|---|
| 0 | Erfolg |
| 1 | Ausführung fehlgeschlagen, zum Beispiel ein `git`- oder `tmux`-Befehl oder ein fehlendes Programm |
| 2 | falscher Aufruf, zum Beispiel kein oder ein falsch geformter Auftragspfad |
| 3 | verweigert, zum Beispiel wegen eines bestehenden Laufs, eines nicht freigegebenen Auftrags oder eines nicht sauberen `repo/` |

### Typische Fehlermeldungen

| Meldung | Ursache und Abhilfe |
|---|---|
| „Es läuft bereits ein Pipwerk-Teamlauf für …“ | Ein Lauf ist aktiv. Mit `status` nachsehen; erst nach Abschluss mit `stop` neu starten. |
| „Lauf für … ist nicht aktiv (ended)“ | Claude ist beendet, der Lauf aber noch gespeichert. Fortsetzen mit `restart` oder abschließen mit `stop`. |
| „Arbeitsauftrag nicht auf origin/main … vorhanden“ | Der Auftrag ist noch nicht auf `main` gemergt oder der Pfad ist falsch. |
| „Arbeitsauftrag hat nicht den Status `freigegeben`.“ | Der Auftrag ist nicht freigegeben. Der Dispatcher startet ihn nicht. |
| „… hat lokale Änderungen.“ | In `repo/` liegen Änderungen. Sie müssen geklärt werden, bevor ein Lauf startet. |
| „… hat nicht die Claude-Konfiguration von origin/main.“ | `repo/` ist veraltet. Mit `pipwerk-dev sync-repo` nachziehen. |
| „Ein anderer pipwerk-dispatch-Aufruf läuft gerade.“ | Ein zweiter Aufruf läuft gleichzeitig. Kurz warten und erneut versuchen. |

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

`sync-repo` wird verwendet, bevor der Dispatcher einen Auftrag startet, wenn `origin/main` inzwischen weiter ist, zum Beispiel nach dem Merge eines Pull Requests. Es holt den Stand von GitHub und spult den Branch `main` in `repo/` per Fast-Forward auf `origin/main` vor.

`sync-repo` verwirft und überschreibt nie etwas. Es bricht mit Exitcode 3 ohne Änderung ab, wenn

- `repo/` nicht auf dem Branch `main` steht,
- `repo/` lokale Änderungen hat, auch neue, nicht versionierte Dateien oder eine unterbrochene Git-Operation,
- `main` eigene Commits hat, die nicht auf `origin/main` liegen, so dass kein Fast-Forward möglich ist,
- ein anderer Prozess in `repo/` arbeitet, zum Beispiel eine laufende Claude-Code-Sitzung des Softwarearchitekten.

Steht `repo/` schon auf `origin/main`, meldet es Erfolg, ohne etwas zu tun. Danach nimmt der Dispatcher den Stand an.

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

`pipwerk-dev` bricht lieber ab, als einen unklaren Zustand zu verändern. Jede Ablehnung nennt den Grund. Die Exitcodes entsprechen denen des Dispatchers: 0 Erfolg, 1 fehlgeschlagen, 2 falscher Aufruf, 3 verweigert. Ein zweiter zustandsändernder Aufruf, während einer läuft, endet mit Exitcode 3.

## 6. Ein Arbeitsauftrag von Anfang bis Ende

Die folgende Übersicht zeigt, wer welchen Schritt ausführt und welches Werkzeug dabei verwendet wird. Die Regeln jeder Rolle stehen in [Agentenrollen und Briefings](agentenrollen-und-briefings.md).

| Schritt | Wer | Womit |
|---|---|---|
| 1. Auftrag klären, schreiben, freigeben | Projektleiter mit Nutzer | Pull Request mit der Auftragsdatei unter `docs/design/planning/work-orders/`; Status `freigegeben` |
| 2. Referenz-Repository nachziehen | auf dem Entwicklungsrechner | `pipwerk-dev sync-repo` |
| 3. Auftrag übergeben | auf Veranlassung des Projektleiters | `pipwerk-dispatch start <auftrag>` |
| 4. Auftrag übernehmen und vorbereiten | Softwarearchitekt | Claude-Code-Sitzung in `repo/` |
| 5. Umsetzen | Entwickler (Teammate) | `pipwerk-dev prepare implement …`, dann Arbeitsbranch in `implement/` |
| 6. Pull Request erstellen | Entwickler | GitHub |
| 7. Unabhängig prüfen | QA (Teammate) | `pipwerk-dev prepare review …` bzw. `update review …`, dann Prüfung in `review/` |
| 8. Korrigieren, falls nötig | Softwarearchitekt steuert, Entwickler korrigiert, QA prüft erneut | wie Schritte 5 bis 7 |
| 9. Teststand bereitstellen | Softwarearchitekt | `pipwerk-dev start pipwerk-studio <commit>` |
| 10. Abnahmekriterien prüfen | Projektleiter | laufender Teststand |
| 11. Praktisch erproben | Nutzer | laufender Teststand |
| 12. Abschluss und Merge | Projektleiter gibt frei, Softwarearchitekt führt aus | GitHub; danach `/exit` in der Sitzung und `pipwerk-dispatch stop` |

Zu einzelnen Schritten:

**Schritte 2 und 3.** Der Dispatcher wird erst gestartet, wenn der Auftrag auf `main` liegt; vorher findet er die Datei auf `origin/main` nicht. Hat ein Merge Dateien unter `.claude/` geändert, nimmt der Dispatcher `repo/` erst nach `sync-repo` an.

**Schritt 9.** Der Softwarearchitekt stellt genau den Commit bereit, den die QA freigegeben hat, und übergibt `pipwerk-dev start` dafür den vollständigen Commit-Hash. Läuft noch ein Teststand aus einem anderen Commit, beendet er ihn vorher mit `pipwerk-dev stop`. `pipwerk-dev start` meldet erst Erfolg, wenn die Anwendung antwortet. Danach prüft der Softwarearchitekt mit `pipwerk-dev status`, dass der laufende Commit der freigegebene ist, und übergibt erst dann an den Projektleiter. Ändert sich nach der Freigabe der Code, ist die QA-Freigabe ungültig, und es wird erst nach erneuter Freigabe bereitgestellt.

**Schritt 12.** Nach dem Merge ist die Sitzung des Softwarearchitekten noch offen. Erst nach `stop` kann der nächste Auftrag gestartet werden.

## 7. Störungen und Wiederanlauf

**Der Dispatcher meldet, dass bereits ein Lauf existiert.** Mit `pipwerk-dispatch status` nachsehen, welcher Auftrag läuft. Ist er erledigt, die Sitzung mit `/exit` und `pipwerk-dispatch stop` abschließen. Ein zweiter Lauf parallel ist nicht vorgesehen.

**Claude wurde beendet oder ist abgestürzt.** `status` meldet „Claude beendet“ mit dem Exitstatus. Soll der Auftrag weiterlaufen, `pipwerk-dispatch restart` aufrufen; der Softwarearchitekt setzt dieselbe Sitzung fort. Soll er nicht weiterlaufen, `pipwerk-dispatch stop` aufrufen.

**Die Sitzung des Softwarearchitekten beginnt nicht mit der Arbeit, obwohl `status` „Lauf aktiv“ meldet.** Beim ersten Start in einem Verzeichnis, das Claude Code noch nicht kennt, fragt Claude Code, ob man dem Ordner vertraut, und wartet auf die Antwort. Man schaltet sich in die Sitzung ein und bestätigt die Abfrage einmalig.

**Die tmux-Sitzung fehlt**, zum Beispiel nach einem Neustart des Rechners. `status` meldet „tmux-Session fehlt“. `restart` legt die Sitzung neu an und setzt die Claude-Sitzung fort.

**Der Auftrag ist nicht freigegeben oder nicht auf main.** Der Dispatcher verweigert den Start. Der Projektleiter klärt die Freigabe und sorgt dafür, dass der Auftrag auf `main` liegt.

**repo/ ist veraltet.** `pipwerk-dev sync-repo` aufrufen. Verweigert es den Fast-Forward, nennt die Meldung den Grund.

**repo/ ist nicht sauber oder steht nicht auf main.** Weder der Dispatcher noch `sync-repo` verwerfen etwas. Zuerst muss geklärt werden, woher die Änderungen oder der andere Branch stammen. Erst danach wird `repo/` von Hand bereinigt und `sync-repo` erneut aufgerufen.

**pipwerk-dev verweigert die Vorbereitung eines Arbeitsbereichs**, etwa wegen liegengebliebener Dateien in `implement/` oder `review/`. Der betroffene Agent meldet das dem Softwarearchitekten, dieser über den Projektleiter. Die Bereinigung geschieht bewusst von Hand, nicht durch die Agenten.

**Entwickler oder QA haben in einem fremden Arbeitsbereich etwas verändert.** Der Entwickler ist angewiesen, in diesem Fall die Arbeit abzubrechen und den Verstoß dem Softwarearchitekten zu melden; fremde Bereiche bereinigt er nicht selbst. Der Softwarearchitekt lässt zuerst bereinigen und übergibt einen fehlerhaften Stand nicht an die QA. Die QA bewertet einen Pull Request mit fremden oder nicht zum Auftrag gehörenden Änderungen als „nicht bestanden“. `pipwerk-dev status` zeigt, in welchem Arbeitsbereich lokale Änderungen liegen.

**Der Teststand startet nicht.** Die Meldung von `pipwerk-dev start` nennt den Grund, etwa belegte Ports, fehlgeschlagene Abhängigkeiten oder eine fehlende Komponente im Commit. Die vollständige Ausgabe steht in den Protokollen von `pipwerk-dev`. Die Prozesse, die `start` selbst gestartet hatte, sind in diesem Fall bereits wieder beendet.

**Backend oder Oberfläche sind nicht erreichbar.** `pipwerk-dev status` zeigt, welcher Prozess läuft und welche der drei Adressen antwortet. Das Protokoll des betroffenen Prozesses nennt meist die Ursache, zum Beispiel eine ungültige Startkonfiguration. Danach `pipwerk-dev stop` und erneut `pipwerk-dev start` mit demselben Commit.

**Die QA findet einen Fehler.** Das ist der normale Korrekturweg und keine Störung: Der Softwarearchitekt ordnet den Befund ein, der Entwickler korrigiert, die QA prüft den neuen Commit.

**Der Nutzer lehnt den Teststand ab.** Der Projektleiter klärt die Gründe und, wenn nötig, den Auftrag. Danach steuert der Softwarearchitekt die Korrektur über Entwicklung, QA und eine neue Testbereitstellung. Läuft die Sitzung des Softwarearchitekten nicht mehr, wird sie mit `pipwerk-dispatch restart` fortgesetzt.

## 8. Voraussetzungen für einen Entwicklungsrechner

Die konkrete Einrichtung des Entwicklungsrechners steht in der lokalen Dokumentation. Allgemein werden gebraucht:

- **Programme:** Git, Python 3 ab Version 3.11 für die lokalen Werkzeuge, uv für das Backend, Node.js mit npm für die Oberfläche, die Playwright-Browser für die Oberflächentests, `tmux`, Claude Code und die GitHub-Kommandozeile `gh`, mit der die Agenten Pull Requests anlegen.
- **Anmeldungen:** Claude Code muss für den ausführenden Benutzer angemeldet sein. `gh` muss bei GitHub mit einem Konto angemeldet sein, das Branches pushen und Pull Requests anlegen darf. Zugangsdaten gehören weder ins Repository noch in die Werkzeuge.
- **Einstellungen von Claude Code:** Im Repository schaltet `.claude/settings.json` nur die Teamfunktion ein. Die Einstellungen des Benutzers müssen den Agenten erlauben, aus `repo/` heraus auf die übrigen Arbeitsbereiche zuzugreifen, und sollten eine Arbeit ohne Rückfragen zu Berechtigungen ermöglichen.
- **Verzeichnisse:** das Pipwerk-Entwicklungsverzeichnis mit `repo/` als Klon des Repositorys auf `main`, `transfer/` und `scripts/` mit den lokalen Werkzeugen. `implement/`, `review/` und `test/` legt `pipwerk-dev` als Worktrees an.

Eine automatische Einrichtung gibt es nicht.

## 9. Lokale Werkzeuge und öffentliches Repository

`pipwerk-dev` und `pipwerk-dispatch` gehören zur lokalen Entwicklungsinfrastruktur und werden nicht in diesem Repository versioniert. Sie enthalten die konkrete, serverbezogene Umsetzung und bleiben deshalb außerhalb des öffentlichen Repositorys. Dieses Dokument beschreibt nur ihre Aufgabe, ihre Schnittstelle und ihre Rolle im Entwicklungsverfahren.

Weil das Verfahren auf diese Werkzeuge angewiesen ist, müssen sie außerhalb des öffentlichen Repositorys gesichert und nachvollziehbar versioniert werden. Wo und wie, entscheidet der Nutzer; eine solche Ablage gibt es derzeit noch nicht.

## Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-07 | Störungsfall „Vertrauensabfrage beim ersten Start“ ergänzt. |
| 2026-10-07 | Testbereitstellung durch den Softwarearchitekten mit `pipwerk-dev start` und Verifikation verbindlich beschrieben; Verweis auf Recherche-Umfang und Dokumentationspflicht. |
| 2026-10-06 | Serverbezogene Angaben entfernt; `pipwerk-dev sync-repo`, die Umgebungsvariable `PIPWERK_DEV_ROOT` und die Vorbereitung der Arbeitsbereiche durch Entwickler und QA beschrieben; Testdatenbank ausdrücklich als dauerhaft festgehalten; lokale Werkzeuge bleiben außerhalb des öffentlichen Repositorys. |
| 2026-10-06 | Erstfassung: Gesamtverfahren, Beteiligte, Verzeichnisse, `pipwerk-dispatch`, `pipwerk-dev`, Ablauf eines Auftrags, Störungen und Einrichtung. |
