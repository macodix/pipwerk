# Das Pipwerk-Entwicklungsverfahren

## Status

- status: `draft`
- stand: 2026-10-08
- bereich: Entwicklungsprozess (keine Produktkomponente)

## Geltungsbereich und Dokumentationsorte

Dieses Dokument ist die maßgebliche Beschreibung des Entwicklungsprozesses von Pipwerk: Ablauf, Arbeitsaufträge und ihr Statusmodell, Auftragsverwaltung, Runner, Benachrichtigung, parallele Bearbeitung, Arbeitsbereiche und das lokale Hilfswerkzeug `pipwerk-dev`. Rollen, Verhaltensregeln, Briefings, Agentendefinitionen und Skills stehen in [Agentenrollen und Briefings](agentenrollen-und-briefings.md). Die technischen Qualitätsanforderungen an Code und Tests stehen in den [Entwicklungs-, Test- und Sicherheitsregeln](development-test-security-rules.md). Der [Entwicklungsplan](../design/planning/entwicklungsplan-strategiedesigner.md) enthält nur die Produktplanung.

Für die Dokumentation gilt: Jede Festlegung steht an genau einer Stelle unter `docs/`. Eine README-Datei dient nur der Orientierung in ihrem Verzeichnis. Sie beschreibt, wozu das Verzeichnis da ist, und verweist auf das zuständige Dokument, enthält aber selbst keine Festlegungen.

Maßgeblich sind das aktuelle Repository, der freigegebene Arbeitsauftrag und die für die Änderung geltenden Anforderungen und Verträge. Chats, Agentenausgaben und temporäre Übergaben ersetzen keine Repository-Dokumentation. Neue Festlegungen werden in das zuständige Dokument übernommen.

Eine Aussage wird nicht allein dadurch zu einer bestätigten fachlichen Festlegung, dass sie in einem Repository-Dokument steht. Inhalte eines mit `draft` gekennzeichneten Dokuments sind Arbeitsstand und dürfen nicht ohne weitere Grundlage als vom Nutzer bestätigte fachliche Entscheidung behandelt werden. Bei Widersprüchen oder zweifelhafter Herkunft wird zunächst geprüft, ob eine dokumentierte spätere Entscheidung, ein Änderungsnachweis oder die Git-Historie die Aussage eindeutig klärt. Eine veraltete oder widersprüchliche Stelle, die sich anhand bereits getroffener Festlegungen eindeutig korrigieren lässt, wird korrigiert und nicht als neue fachliche Frage an den Nutzer zurückgegeben.

## Beteiligte

| Beteiligter | Aufgabe im Ablauf |
|---|---|
| Nutzer | Auftraggeber. Trifft fachliche und grundlegende Architekturentscheidungen, gibt Aufträge frei, erprobt und nimmt ab. Spricht ausschließlich mit dem Projektleiter. |
| Projektleiter | Klärt Aufträge mit dem Nutzer, legt sie ab, gibt Entscheidungen des Nutzers an die Auftragsverwaltung weiter, prüft die Abnahmekriterien am Teststand und benachrichtigt den Nutzer. |
| Auftragsverwaltung | Verwaltet jeden Auftrag von der Freigabe bis zum Abschluss: Statuswechsel, Anstoß des Softwarearchitekten, Übernahme seiner Ergebnisse, Reihenfolge paralleler Aufträge. |
| Softwarearchitekt | Setzt einen Auftrag mit Entwickler und QA um, stellt den Teststand bereit und führt nach der Abnahme den Merge aus. |
| Entwickler | Implementiert im eigenen Arbeitsbereich und Branch. |
| QA | Prüft unabhängig im eigenen Arbeitsbereich. |
| Runner | Hält `repo/` auf dem Stand von `origin/main`. |

Projektleiter und Auftragsverwaltung sind getrennte Rollen. Der Projektleiter setzt außer `draft` und `approved` keinen Auftragsstatus. Die Auftragsverwaltung trifft keine fachlichen Entscheidungen und steuert Entwickler und QA nicht direkt. Zuständigkeiten, Entscheidungsgrenzen und Briefings stehen in [Agentenrollen und Briefings](agentenrollen-und-briefings.md).

## Ablauf eines Arbeitsauftrags

1. Der Projektleiter klärt den Auftrag mit dem Nutzer, legt ihn als Pull Request mit Status `draft` an und merget ihn nach Freigabe durch den Nutzer mit Status `approved` nach `work-orders/approved/`. Ein Auftrag wird erst freigegeben, wenn die für die Umsetzung erforderlichen fachlichen Fragen geklärt sind.
2. Der Runner bringt `repo/` auf den neuen Stand. Die Auftragsverwaltung findet den Auftrag bei ihrer nächsten Prüfung, prüft ihn und stößt den Softwarearchitekten an oder reiht den Auftrag ein.
3. Der Softwarearchitekt prüft den aktuellen Repository-Stand und die Grundlagen und lässt den Auftrag vom Entwickler im eigenen Branch umsetzen. Der Entwickler führt die vorgesehenen Prüfungen aus, aktualisiert die Dokumentation und erstellt einen Pull Request.
4. Die QA prüft unabhängig Auftrag, Ausgangsstand, Pull Request und Commit, Code, Tests und Dokumentation. Befunde werden vollständig korrigiert und erneut geprüft. Eine Fertigmeldung ersetzt die QA nicht.
5. Der Softwarearchitekt stellt genau den von der QA freigegebenen Commit als Teststand bereit und prüft Erreichbarkeit und Commit-Identität. Eine spätere Codeänderung erfordert erneute QA. Er schreibt das Ergebnis in seine Ergebnisdatei; die Auftragsverwaltung setzt `acceptance`.
6. Der Projektleiter prüft jedes Abnahmekriterium am Teststand. Erst bei erfülltem Auftrag erhält der Nutzer den Stand zur Erprobung. Abweichungen gibt der Projektleiter als Ablehnung an die Auftragsverwaltung weiter.
7. Nach Abnahme durch den Nutzer trägt der Projektleiter die Abnahme in den Auftrag ein. Die Auftragsverwaltung stößt den Softwarearchitekten zum Merge an und setzt nach dessen Bestätigung `closed`. Gemergt wird mit einem Merge-Commit, nicht durch Zusammenfassen (Squash), damit die Commits des Arbeitsbranches in `main` enthalten bleiben.

Änderungen an Programmcode und wesentlicher Dokumentation erfolgen über Branch und Pull Request. Übergaben benennen Arbeitsauftrag, Branch, Pull Request, Commit und Prüfergebnis eindeutig. Der Nutzer muss weder Pull Requests technisch prüfen noch den Teststand selbst installieren und starten.

Jeder Pull Request enthält mindestens den Bezug auf den Arbeitsauftrag und seine Abnahmekriterien, eine kurze Beschreibung der tatsächlich vorgenommenen Änderungen, das Ergebnis der ausgeführten Prüfungen sowie offene Punkte und bekannte Einschränkungen. Die QA bestätigt nur, was durch Code, Tests oder andere zugängliche Nachweise überprüfbar ist.

## Arbeitsaufträge

### Inhalt

Jeder Arbeitsauftrag ist eine eigene Markdown-Datei unter `work-orders/`. Neue Aufträge werden aus der Vorlage [`work-orders/template.md`](../../work-orders/template.md) erstellt. Ein Auftrag enthält:

- im Abschnitt „Status“ die Felder `id` (Auftragskennung), `status`, `client` (Auftraggeber) und `components` (betroffene Komponenten, siehe [Parallele Bearbeitung](#parallele-bearbeitung)); `client` ist derzeit immer `Nutzer`;
- Titel, Ziel, Umfang und Nicht-Umfang, nachprüfbare Abnahmekriterien und Referenzen auf alle geltenden Anforderungen, Verträge und Architekturregeln;
- den Abschnitt „Offene Punkte“; ist er leer, steht dort `keine`;
- den Abschnitt „Entscheidungen des Auftraggebers“, in den der Projektleiter Entscheidungen des Nutzers einträgt;
- den Abschnitt „Verlauf“, in den die Auftragsverwaltung jeden Statuswechsel einträgt.

Die Feldnamen sind maschinenlesbare Bezeichner und deshalb englisch. Die Auftragskennung hat die Form `WO-JJJJ-MM-TT-NNN` und wird auch in Verzeichnis- und Sitzungsnamen verwendet. Der Dateiname eines Auftrags beginnt mit seiner Auftragskennung. Zeitpunkte in den Abschnitten „Entscheidungen des Auftraggebers“ und „Verlauf“ haben die Form `JJJJ-MM-TTThh:mm:ss`.

### Statusmodell

Der Status steht im Feld `status` der Auftragsdatei. Dieser Eintrag ist maßgeblich. Zusätzlich liegt die Datei im Unterverzeichnis, das ihrem Status zugeordnet ist. Die Verzeichnisse dienen der Übersicht; mehrere Status können demselben Verzeichnis zugeordnet sein.

| Status | Bedeutung | Verzeichnis | gesetzt von |
|---|---|---|---|
| `draft` | Auftrag in Klärung | `approved/`, aber nur im Pull Request des Auftrags; auf `main` erst mit dem Merge | Projektleiter |
| `approved` | vom Nutzer freigegeben, von der Auftragsverwaltung noch nicht übernommen | `approved/` | Projektleiter mit dem Merge nach Freigabe |
| `queued` | übernommen, wartet, weil eine betroffene Komponente belegt ist | `approved/` | Auftragsverwaltung |
| `inprogress` | in Umsetzung, Korrektur, QA, Testbereitstellung oder Merge | `inprogress/` | Auftragsverwaltung |
| `blocked` | wartet auf eine Entscheidung oder Handlung des Auftraggebers; der Grund steht unter „Offene Punkte“ | `inprogress/` | Auftragsverwaltung |
| `acceptance` | Teststand bereit; Prüfung durch den Projektleiter und Erprobung durch den Nutzer | `acceptance/` | Auftragsverwaltung |
| `closed` | abgenommen, gemergt und abgeschlossen | `closed/` | Auftragsverwaltung |
| `cancelled` | vom Auftraggeber zurückgezogen | `closed/` | Auftragsverwaltung |

Zulässig sind nur diese Statuswechsel:

| von | nach | Anlass |
|---|---|---|
| `draft` | `approved` | Freigabe durch den Nutzer; Merge des Auftrags durch den Projektleiter |
| `approved` | `inprogress` | Pflichtfelder vollständig, alle betroffenen Komponenten frei; Softwarearchitekt angestoßen |
| `approved` | `queued` | Pflichtfelder vollständig, eine betroffene Komponente belegt |
| `approved` | `blocked` | Pflichtfelder fehlen oder sind ungültig, oder die Sitzung des Softwarearchitekten ließ sich nicht starten |
| `queued` | `inprogress` | alle betroffenen Komponenten frei; Softwarearchitekt angestoßen |
| `queued` | `blocked` | die Sitzung des Softwarearchitekten ließ sich nicht starten |
| `inprogress` | `acceptance` | Ergebnis `ready` des Softwarearchitekten |
| `inprogress` | `blocked` | Ergebnis `question` oder `failed`, oder die Sitzung des Softwarearchitekten endete ohne Ergebnis |
| `inprogress` | `closed` | Ergebnis `merged` nach Abnahme |
| `blocked` | `inprogress` | Entscheidung des Auftraggebers eingetragen oder fehlende Pflichtfelder ergänzt; Softwarearchitekt angestoßen |
| `blocked` | `queued` | Entscheidung eingetragen oder fehlende Pflichtfelder ergänzt, eine betroffene Komponente inzwischen belegt |
| `acceptance` | `inprogress` | Ablehnung mit Abweichungen oder Abnahme eingetragen; Softwarearchitekt zur Korrektur beziehungsweise zum Merge angestoßen |
| `approved`, `queued`, `inprogress`, `blocked`, `acceptance` | `cancelled` | Rückzug durch den Auftraggeber eingetragen |

`closed` und `cancelled` sind Endzustände. Ein weiterer Status wird erst verwendet, nachdem er in beide Tabellen aufgenommen wurde. Stimmen Statuseintrag und Verzeichnis nicht überein, ist das ein Fehler, den die Auftragsverwaltung bei ihrer nächsten Prüfung behebt.

### Änderungen an einem Auftrag

Inhaltliche Änderungen eines Auftrags erfolgen über Branch und Pull Request und nach der Freigabe nur mit Zustimmung des Nutzers.

Drei Arten von Änderungen sind Verwaltungsarbeit und werden direkt auf `main` gebucht, ohne lokalen Arbeitsbereich, zum Beispiel über die GitHub-API:

- Statuswechsel mit Verschieben der Datei und Eintrag im Verlauf, durch die Auftragsverwaltung;
- Einträge im Abschnitt „Offene Punkte“ bei einem Wechsel nach `blocked`, durch die Auftragsverwaltung;
- Einträge im Abschnitt „Entscheidungen des Auftraggebers“, durch den Projektleiter.

Eine Entscheidung des Auftraggebers ist ein Eintrag mit Zeitpunkt und einer der Entscheidungsarten `accept` (Abnahme), `reject` (Ablehnung mit Liste der Abweichungen), `cancel` (Rückzug) oder `answer` (Antwort auf einen offenen Punkt, mit Bezug auf diesen). Die Auftragsverwaltung erkennt neue Einträge daran, dass ihr Zeitpunkt nach dem Zeitpunkt des letzten Eintrags im Verlauf liegt.

## Auftragsverwaltung

Die Auftragsverwaltung verwaltet jeden Auftrag von der Freigabe bis zum Abschluss. Sie ist eine Übergangslösung bis zur Entwicklung einer allgemeinen Nachrichten- und Auftragsverwaltung als Teil von Pipwerk. Sie läuft als dauerhafte Claude-Code-Sitzung in der tmux-Sitzung `order-management` und wird mit `tools/order-management/start.sh` gestartet (siehe [Einrichtung auf dem Entwicklungsrechner](#einrichtung-auf-dem-entwicklungsrechner)). Ihre Rollendefinition legt im Feld `initialPrompt` die wiederkehrende Prüfung mit dem eingebauten Befehl `/loop` fest. Das Prüfintervall steht dort, als Standardwert 5 Minuten.

Eine mit `/loop` angelegte wiederkehrende Aufgabe erlischt laut Claude-Code-Dokumentation nach 7 Tagen. Die Sitzung wird deshalb spätestens alle 7 Tage neu gestartet. Wird ihr Gesprächsverlauf zu groß, wird sie früher neu gestartet; der Neustart kann dann über einen Cron-Job erfolgen. Dass `/loop` als `initialPrompt` wie vorgesehen arbeitet, ist in der Claude-Code-Dokumentation nicht beschrieben und wird im Nachweisdurchlauf geprüft.

Bei jeder Prüfung liest die Auftragsverwaltung alle Auftragsdateien in `$PIPWERK_DEV_ROOT/repo/work-orders/`, auch in `closed/`, damit ein unterbrochenes Aufräumen nachgeholt wird. Sie arbeitet nicht in `repo/` und verändert es nicht. Sie handelt wie folgt:

| Lage | Handlung |
|---|---|
| Auftrag mit `queued` | Sind alle betroffenen Komponenten frei, anstoßen und `inprogress`. |
| Auftrag mit `approved` | Pflichtfelder prüfen; bei Mangel `blocked` mit dem Mangel als offenem Punkt. Sonst Komponenten prüfen: belegt `queued`, frei anstoßen und `inprogress`. |
| Auftrag mit `blocked`, nie angestoßen | Pflichtfelder erneut prüfen; sind sie vollständig, wie bei `approved` verfahren. |
| Auftrag mit `inprogress`, Ergebnisdatei vorhanden | Ergebnis übernehmen: `ready` nach `acceptance`, `question` und `failed` nach `blocked` mit dem Text als offenem Punkt, `merged` nach `closed`. Nur wenn der Statuswechsel gelungen ist: die tmux-Sitzung des Auftrags beenden, bei `merged` danach die Arbeitsbereiche abbauen, und die Ergebnisdatei umbenennen. |
| Auftrag mit `inprogress`, keine Ergebnisdatei, Sitzung läuft | nichts |
| Auftrag mit `inprogress`, keine Ergebnisdatei, keine Sitzung | `blocked`; Abbruch als offenen Punkt vermerken |
| neue Entscheidung `answer` bei `blocked`, schon angestoßen | Softwarearchitekten mit der Antwort erneut anstoßen und `inprogress`, bei belegter Komponente `queued` |
| neue Entscheidung `reject` bei `acceptance` | Softwarearchitekten mit der Liste der Abweichungen zur Korrektur anstoßen und `inprogress` |
| neue Entscheidung `accept` bei `acceptance` | Softwarearchitekten zum Merge anstoßen und `inprogress` |
| neue Entscheidung `cancel` | `cancelled`; danach tmux-Sitzung des Auftrags beenden und Arbeitsbereiche abbauen |
| Auftrag mit `closed` oder `cancelled`, noch mit tmux-Sitzung, Arbeitsbereich oder nicht umbenannter Ergebnisdatei | Aufräumen nachholen: Sitzung beenden, Arbeitsbereiche abbauen, Ergebnisdatei umbenennen |

Die Aufträge werden in dieser Reihenfolge behandelt: zuerst Aufträge mit `inprogress`, dann neue Entscheidungen, dann nie angestoßene Aufträge mit `blocked`, dann `queued` und zuletzt `approved`, innerhalb jeder Stufe in aufsteigender Reihenfolge der Auftragskennung. Das Aufräumen bei `closed` und `cancelled` erfolgt am Ende jeder Prüfung. Nach jedem Anstoß gelten die Komponenten des angestoßenen Auftrags sofort als belegt, auch wenn `repo/` den neuen Status noch nicht zeigt. Bei der Belegung zählt ein Auftrag seine eigenen Komponenten nicht mit. Ein Auftrag gilt als „nie angestoßen“, wenn für ihn kein Arbeitsbereich unter `work/<auftragskennung>/` besteht. Stimmen Statuseintrag und Verzeichnis eines Auftrags nicht überein, verschiebt die Auftragsverwaltung die Datei in das Verzeichnis seines Status.

Lehnt `pipwerk-dev remove` den Abbau der Arbeitsbereiche ab, zum Beispiel wegen nicht übertragener Commits, vermerkt die Auftragsverwaltung den Grund im Verlauf und lässt die Arbeitsbereiche bestehen.

Anstoßen heißt: den Startauftrag schreiben, den Arbeitsbereich `coordinate/` des Auftrags anlegen, falls er noch nicht besteht, und darin die Sitzung des Softwarearchitekten mit `claude --agent software-architect` in einer tmux-Sitzung starten, deren Name die Auftragskennung ist. Die Auftragsverwaltung ist dabei der Aufrufer im Sinne der [Aufrufschnittstelle](agentenrollen-und-briefings.md#aufrufschnittstelle). Der Startauftrag liegt in `$PIPWERK_DEV_ROOT/transfer/<auftragskennung>/start.md`. Er nennt die Auftragskennung, den Pfad der Auftragsdatei und die Aufgabe: `implement` (umsetzen), `rework` (korrigieren, mit der Liste der Abweichungen), `resume` (mit der Antwort auf einen offenen Punkt fortsetzen) oder `merge` (nach Abnahme mergen). Lässt sich die Sitzung nicht starten, setzt die Auftragsverwaltung den Auftrag mit dem Startfehler als offenem Punkt auf `blocked`; `inprogress` setzt sie erst nach erfolgreichem Start.

Eine interaktive Claude-Code-Sitzung beendet sich nicht von selbst. Ob die Sitzung eines Auftrags besteht, prüft die Auftragsverwaltung mit `tmux has-session -t <auftragskennung>`; beendet wird sie mit `tmux kill-session -t <auftragskennung>`. Weil der Sitzungsname die Auftragskennung ist, sind parallele Sitzungen eindeutig unterscheidbar. Eine Komponente gilt als belegt, solange ein Auftrag, der sie nennt, auf `inprogress` oder `acceptance` steht oder nach einem Anstoß auf `blocked`. Ein nie angestoßener Auftrag mit `blocked` belegt keine Komponente.

Die Auftragsverwaltung hält keinen Stand im Gedächtnis ihrer Sitzung. Ihr gesamter Stand ergibt sich aus Auftragsdateien, tmux-Sitzungen und Ergebnisdateien. Ein Neustart ist deshalb jederzeit möglich. Jede Handlung prüft vor der Ausführung den aktuellen Stand, sodass eine wiederholte Prüfung nichts doppelt ausführt. Vor einem Statuswechsel prüft sie, dass der Status auf `main` noch dem erwarteten alten Status entspricht. Schlägt ein Statuswechsel fehl, weil sich `main` inzwischen geändert hat, unterbleiben alle davon abhängigen Schritte, und der Auftrag wird bei der nächsten Prüfung neu bewertet.

### Ergebnisdatei des Softwarearchitekten

Der Softwarearchitekt schreibt als letzte Handlung die Datei `$PIPWERK_DEV_ROOT/transfer/<auftragskennung>/result.json`:

| Feld | Inhalt |
|---|---|
| `id` | Auftragskennung |
| `outcome` | `ready` (Teststand bereit), `question` (Rückfrage an den Auftraggeber), `failed` (Arbeit nicht möglich) oder `merged` (Merge abgeschlossen) |
| `commit` | vollständiger Commit-Hash des Teststands beziehungsweise des Merge, sonst leer |
| `pull_request` | Nummer des Pull Requests, sonst leer |
| `text` | Rückfrage, Fehlerbeschreibung oder Hinweise zum Teststand in ganzen Sätzen |
| `created` | Zeitpunkt der Erstellung |

Seine Sitzung bleibt danach geöffnet, bis die Auftragsverwaltung sie beendet. Nach der Übernahme benennt die Auftragsverwaltung die Datei in `result-JJJJMMTThhmmss.json` um, gebildet aus `created`. Damit bleibt jedes Ergebnis erhalten, und ein neues ist eindeutig erkennbar.

## Runner

Ein GitHub-Actions-Workflow auf einem selbst betriebenen Runner auf dem Entwicklungsrechner hält `repo/` aktuell. Er startet bei jedem Push auf `main` und kann auf GitHub zusätzlich von Hand gestartet werden. Er führt `pipwerk-dev sync-repo` aus. Weitere Aufgaben hat er nicht.

Der Runner läuft als systemd-Dienst unter dem Benutzer, dem die Arbeitsbereiche gehören. `PIPWERK_DEV_ROOT` steht in der Umgebungsdatei des Runners. Der Workflow hat keine Auslöser für Pull Requests. Das allein genügt nicht, weil ein Pull Request aus einer fremden Kopie des Repositorys eigene Workflow-Dateien mitbringen kann. Deshalb verlangt das Repository für Workflows aus Pull Requests aller externen Beitragenden eine Freigabe durch den Nutzer (siehe [Einrichtung auf dem Entwicklungsrechner](#einrichtung-auf-dem-entwicklungsrechner)). Ein solcher Workflow wird nicht freigegeben. Schlägt `sync-repo` fehl, ist das im Lauf auf GitHub sichtbar; der nächste Push holt die Aktualisierung nach.

## Benachrichtigung des Nutzers

Eine geplante Prüfung des Projektleiters liest stündlich die Statusfelder der Aufträge auf `main`. Ist ein Auftrag seit der letzten Prüfung auf `acceptance` oder `blocked` gewechselt, erhält der Nutzer eine Benachrichtigung mit Auftragskennung und einem Satz zum Inhalt. Der Nutzer kann den Stand außerdem jederzeit beim Projektleiter erfragen.

## Parallele Bearbeitung

Mehrere Aufträge werden gleichzeitig bearbeitet, wenn sie keine gemeinsame Komponente betreffen. Als je eigene Komponente gelten jede Hauptkomponente unter `components/`, jedes Paket unter `packages/`, `contracts/` sowie übergreifende Dokumente und Regeln außerhalb einer Komponente unter dem Namen `common`.

Die Einschränkung ist keine technische Notwendigkeit von Git. Sie vermeidet Konflikte beim Zusammenführen und damit erneute QA-Läufe. Wird ein paralleler Auftrag zuerst gemergt, bringt der andere seinen Branch auf den neuen Stand von `main`; danach ist eine erneute QA erforderlich.

Jeder Auftrag erhält eigene Arbeitsbereiche, jede Komponente einen eigenen Teststand, und jedes Agententeam läuft in einer eigenen tmux-Sitzung (siehe [Arbeitsbereiche](#arbeitsbereiche)).

## Arbeitsbereiche

Unter dem Pipwerk-Entwicklungsverzeichnis `$PIPWERK_DEV_ROOT` liegen:

| Verzeichnis | Inhalt | verändert von |
|---|---|---|
| `repo/` | Klon des Repositorys auf dem Stand von `origin/main`; Träger der gemeinsamen Git-Daten | nur `pipwerk-dev sync-repo` |
| `work/<auftragskennung>/coordinate/` | Worktree des Softwarearchitekten, Commit von `origin/main` beim ersten Anstoß, ohne Branch; Arbeitsverzeichnis seiner Sitzungen für diesen Auftrag | Auftragsverwaltung über `pipwerk-dev` |
| `work/<auftragskennung>/implement/` | Worktree des Entwicklers mit dem Arbeitsbranch | Entwickler |
| `work/<auftragskennung>/review/` | Worktree der QA mit dem lokalen Prüfbranch | QA |
| `work/order-management/coordinate/` | Arbeitskopie der Auftragsverwaltung, Commit von `origin/main` bei ihrem Start, ohne Branch | `tools/order-management/start.sh` über `pipwerk-dev` |
| `test/<komponente>/` | Teststand der Komponente, ohne Branch auf einem freigegebenen Commit | nur `pipwerk-dev` |
| `transfer/` | Arbeitsergebnisse, je Auftrag unter `transfer/<auftragskennung>/` Startauftrag und Ergebnisdateien; keine Projektfestlegungen | Agenten |
| `scripts/` | `pipwerk-dev` und seine lokale Dokumentation, nicht Teil des Repositorys | nicht durch das Team |

Kein Agent arbeitet in `repo/`. Entwickler und QA finden ihren Arbeitsbereich über `$PIPWERK_DEV_ROOT` und die Auftragskennung in `$PIPWERK_ORDER_ID`. Die Agentendefinitionen enthalten keine Pfade des Rechners.

Jeder Worktree enthält alle Dateien des Repositorys, also auch `.claude/`. Wirksam sind nur die Agentendefinitionen im Arbeitsverzeichnis der Sitzung des Softwarearchitekten, also in `coordinate/`. Sie entsprechen damit dem Stand von `main` beim ersten Anstoß des Auftrags und bleiben für alle seine Sitzungen gleich.

## Arbeitsbereiche und Umgang mit Fehlern

Entwicklung und unabhängige QA verwenden getrennte Arbeitsbereiche. Die Arbeitsbereiche und ihre Schutzregeln stehen im Abschnitt [Arbeitsbereiche](#arbeitsbereiche). Ausgangs- beziehungsweise Prüfcommit werden im jeweiligen Auftrag eindeutig benannt. Der Teststand entspricht unverändert dem freigegebenen Commit.

Eigene Fehler, unvollständige Änderungen und Testreste werden vor der Übergabe vollständig beseitigt. Fremde Änderungen werden nicht verworfen. Die zuständige Rolle wird anhand von Diff, Auftragsreferenzen und Prüfnachweisen ermittelt. Nur zwingend fehlende Entscheidungen, Berechtigungen oder Handlungen außerhalb der eigenen Zuständigkeit werden eskaliert; unabhängige Arbeiten werden fortgesetzt.

## Lokales Hilfswerkzeug pipwerk-dev

`pipwerk-dev` erledigt auf dem Entwicklungsrechner die wiederkehrenden technischen Schritte rund um die Git-Arbeitsbereiche und Teststände. Es bringt das Referenz-Repository auf den Stand von `origin/main`, richtet die Arbeitsbereiche eines Auftrags ein, bringt sie auf einen Stand und baut sie wieder ab, führt die automatischen Prüfungen einer Komponente aus und startet einen bestimmten Commit als Teststand einer Komponente. Derzeit unterstützt es die Komponente `pipwerk-studio`. `pipwerk-dev` startet keine Agenten und kennt keine Auftragsinhalte.

Das Werkzeug ist nicht im Repository enthalten. Es wird nicht vom Agententeam geändert, sondern in einer eigenen Claude-Code-Sitzung auf Grundlage dieses Abschnitts. Seine Installation, Konfiguration und Sicherung sind lokal in `scripts/` dokumentiert. Zugangsdaten und lokale Zustandsdateien gehören nicht ins öffentliche Repository.

### Befehle im Überblick

```sh
pipwerk-dev sync-repo
pipwerk-dev prepare --order <auftragskennung> coordinate --base <commit>
pipwerk-dev prepare --order <auftragskennung> <implement|review> <branch> --base <commit>
pipwerk-dev update  --order <auftragskennung> <implement|review> <ref>
pipwerk-dev remove  --order <auftragskennung>
pipwerk-dev test    <komponente> --order <auftragskennung> --workspace <implement|review>
pipwerk-dev start   <komponente> <commit-hash>
pipwerk-dev stop    <komponente>
pipwerk-dev status  [--order <auftragskennung>]
```

Für `repo/` gibt es nur `sync-repo`. Jedes Kommando nimmt die Option `--json` an und gibt dann genau ein JSON-Objekt aus. Das ist für Agenten und andere Programme gedacht. Die Kennung `order-management` ist für die Arbeitskopie der Auftragsverwaltung reserviert.

### Referenz-Repository aktualisieren: sync-repo

`sync-repo` holt den Stand von GitHub und spult den Branch `main` in `repo/` per Fast-Forward auf `origin/main` vor. Es verwirft und überschreibt nie etwas. Es bricht mit Exitcode 3 ohne Änderung ab, wenn `repo/` nicht auf `main` steht, lokale Änderungen oder eine unterbrochene Git-Operation hat, `main` eigene Commits hat, die nicht auf `origin/main` liegen, oder ein anderer Prozess in `repo/` arbeitet. Steht `repo/` schon auf `origin/main`, meldet es Erfolg, ohne etwas zu tun.

### Arbeitsbereiche einrichten: prepare

`prepare` legt einen Worktree unter `work/<auftragskennung>/` an. `coordinate` wird ohne Branch auf den genannten Commit gesetzt. `implement` und `review` erhalten einen neuen Branch auf dem genannten Commit.

`prepare` bricht ohne Änderung ab, wenn der Arbeitsbereich lokale Änderungen hat, dort ein von `pipwerk-dev` gestarteter Prozess läuft, der Branch schon lokal oder auf GitHub existiert, der Arbeitsbereich auf `main` steht oder fremde Daten enthält oder der Wechsel ignorierte Dateien überschreiben würde. Steht der Arbeitsbereich schon genau auf diesem Branch und Stand, meldet es Erfolg, ohne etwas zu tun.

### Arbeitsbereiche nachziehen: update

`update` bringt `implement` oder `review` eines Auftrags per Fast-Forward des ausgecheckten Branches auf den angegebenen Git-Stand. Ist das nicht möglich, bricht es ab. Lokale Änderungen, auch neue nicht versionierte Dateien, führen immer zum Abbruch.

### Arbeitsbereiche abbauen: remove

`remove` entfernt die Worktrees und lokalen Branches eines Auftrags. Es bricht ohne Änderung ab, wenn ein Worktree lokale Änderungen hat, ein lokaler Branch Commits enthält, die nicht auf `origin` liegen, oder in einem der Worktrees ein verwalteter Prozess oder eine Claude-Code-Sitzung läuft.

### Wie Entwickler und QA ihre Arbeitsbereiche vorbereiten

Die verbindlichen Befehle stehen in den Agentendefinitionen; hier ist der Zusammenhang beschrieben. Der Softwarearchitekt nennt dem Entwickler den Namen des Arbeitsbranches und den Ausgangsstand als vollständigen Commit-Hash. Der Entwickler legt den Branch mit `prepare … implement` an und prüft danach Branch und Commit. Korrekturen macht er im selben Branch ohne erneutes `prepare`.

Der QA nennt der Softwarearchitekt den Pull Request, den zu prüfenden Commit und den Namen eines lokalen Prüfbranches. Für die erste Prüfung legt die QA den Prüfbranch mit `prepare … review` an, für eine erneute Prüfung bringt sie ihn mit `update … review` auf den neuen Commit. Vor der Prüfung kontrolliert sie, dass genau dieser Commit ausgecheckt ist.

Endet `pipwerk-dev` mit einem Fehler, melden Entwickler und QA die Meldung dem Softwarearchitekten und umgehen sie nicht mit eigenen Git-Befehlen. Nur wenn `pipwerk-dev` meldet, dass gerade ein anderer Aufruf denselben Bereich sperrt, wiederholen sie den Aufruf einmal.

### Automatische Prüfungen: test

`test` führt im angegebenen Arbeitsbereich die für die Komponente vorgesehenen Prüfungen aus. Für Pipwerk Studio sind das für das Backend `uv sync --frozen`, `pytest`, `ruff check`, `ruff format --check` und `mypy`, für die Oberfläche `npm ci`, `npm run typecheck`, `npm test` und `npm run e2e`. Für die Browser-End-to-End-Tests vergibt `pipwerk-dev` je Lauf freie Ports über `PIPWERK_STUDIO_E2E_BACKEND_PORT` und `PIPWERK_STUDIO_E2E_FRONTEND_PORT` (siehe [Pipwerk Studio – technische Dokumentation](pipwerk-studio.md)), damit Prüfläufe mehrerer Aufträge gleichzeitig laufen können. Schlägt ein Schritt fehl, laufen die davon unabhängigen Schritte weiter; Schritte, die einen fehlgeschlagenen voraussetzen, werden übersprungen. Das Kommando endet dann mit Exitcode 1 und nennt die Datei mit der vollständigen Ausgabe.

### Teststand bereitstellen und starten: start

`start` stellt einen von der QA freigegebenen Commit als laufenden Teststand einer Komponente unter `test/<komponente>/` bereit. Es nimmt nur einen Commit-Hash an, keinen Branch- oder Tag-Namen. Danach geschieht für Pipwerk Studio Folgendes:

1. Der Commit muss die Komponente enthalten, und ihre Ports müssen frei sein. Sind sie von fremden Programmen belegt, bricht `start` ab und fasst diese Programme nicht an.
2. `test/<komponente>/` wird ohne Branch auf den Commit gesetzt.
3. Die Abhängigkeiten werden installiert: `uv sync --frozen` für das Backend und `npm ci` für die Oberfläche.
4. Die lokale Startkonfiguration wird geschrieben (siehe unten).
5. Backend und Oberfläche werden gestartet: das Backend mit `pipwerk-studio -c <INI>`, die Oberfläche als Vite-Entwicklungsserver. Vite leitet Anfragen unter `/api` an das Backend weiter. Beide sind nur vom eigenen Rechner aus erreichbar.
6. Innerhalb von 60 Sekunden müssen drei Adressen antworten: `/api/health` des Backends mit `{"status": "ok"}`, die Startseite der Oberfläche und `/api/health` über die Oberfläche. Antwortet etwas nicht, beendet `start` die gerade gestarteten Prozesse wieder und meldet einen Fehler.

Jede Komponente hat eigene, konfigurierte Ports, sodass Teststände verschiedener Komponenten gleichzeitig laufen. Für Pipwerk Studio sind das standardmäßig 8000 für das Backend und 5173 für die Oberfläche. Läuft die Komponente bereits aus demselben Commit und ist erreichbar, startet `start` nichts neu und meldet Erfolg. Läuft sie aus einem anderen Commit, bricht `start` ab; vorher ist `stop` nötig.

### Lokale Startkonfiguration und Testdatenbank

Pipwerk Studio startet nur mit einer gültigen INI-Startkonfiguration, die die Datenbank angibt (siehe [Pipwerk Studio – technische Dokumentation](pipwerk-studio.md)). `pipwerk-dev` schreibt diese INI vor jedem Start in sein lokales Zustandsverzeichnis. Sie verweist auf eine SQLite-Datenbank im selben Verzeichnis, getrennt je Komponente. Beide Dateien liegen außerhalb des Repositorys.

Die Testdatenbank bleibt über Neustarts und über verschiedene Teststände hinweg erhalten und wird nicht automatisch zurückgesetzt. Wird später ein Test mit frischer Datenbank gebraucht, wird dafür ein ausdrücklich ausgelöster Vorgang festgelegt; einen solchen gibt es derzeit nicht.

### Beenden: stop

`stop` beendet nur Prozesse, die `pipwerk-dev start` für die genannte Komponente gestartet hat. Jeder Prozess wird beim Start in einer eigenen Prozessgruppe gestartet, und `pipwerk-dev` merkt sich Prozessnummer und Startzeitpunkt. So werden nach einem Neustart oder bei wiederverwendeten Prozessnummern keine fremden Prozesse getroffen. Die Prozesse erhalten zuerst die Aufforderung zum Beenden und nach zehn Sekunden ein hartes Ende.

### Zustand ansehen: status

`status` zeigt für jeden Auftragsarbeitsbereich den Commit, den Branch oder „detached HEAD“, die Zahl lokaler Änderungen und laufende Prozesse, für jeden Teststand den laufenden Commit, die Prozesse und das Ergebnis der Erreichbarkeitsprüfungen. Mit `--order` beschränkt es sich auf einen Auftrag. `status` verändert nichts, auch nicht den Git-Index.

### Protokolle

Im lokalen Zustandsverzeichnis führt `pipwerk-dev` ein Protokoll mit einer Zeile je zustandsänderndem Aufruf, die vollständige Ausgabe jeder Prüfung und Einrichtung, die Liste der gestarteten Prozesse und die Ausgabe der Teststände. Zugangsdaten in Adressen, GitHub-Token und Werte nach Angaben wie `token=`, `password=` oder `Authorization:` ersetzt `pipwerk-dev` vor der Ausgabe und vor dem Schreiben in Protokolle durch `***`.

### Sperren, Fehler und Exitcodes

`pipwerk-dev` bricht lieber ab, als einen unklaren Zustand zu verändern. Jede Ablehnung nennt den Grund. Die Exitcodes sind: 0 Erfolg, 1 fehlgeschlagen, 2 falscher Aufruf, 3 verweigert. Ein Aufruf sperrt nur den betroffenen Auftragsarbeitsbereich oder Teststand; Operationen auf den gemeinsamen Git-Daten wie `git fetch` und das Anlegen oder Entfernen von Worktrees werden kurz gemeinsam gesperrt. Ein gesperrter Aufruf endet mit Exitcode 3.

### Erweiterbarkeit

Prüfschritte, Startbefehle, Erreichbarkeitsprüfungen und Ports sind je Komponente beschrieben. Eine weitere Komponente wird ergänzt, ohne die Logik für Arbeitsbereiche, Sperren und Prozessverwaltung zu ändern; ihre Ports werden bei der Aufnahme festgelegt.

## Einrichtung auf dem Entwicklungsrechner

Die folgenden Schritte richten den Prozess auf dem Entwicklungsrechner ein. Sie werden vom Nutzer ausgeführt und lokal dokumentiert.

1. `pipwerk-dev` in der Fassung dieses Dokuments installieren. Bei der Umstellung werden die bisherigen festen Arbeitsbereiche `implement/`, `review/` und `test/` nur entfernt, wenn sie keine lokalen Änderungen und keine nicht übertragenen Commits enthalten.
2. Den Runner als systemd-Dienst unter dem Benutzer betreiben, dem die Arbeitsbereiche gehören, mit `PIPWERK_DEV_ROOT` in seiner Umgebungsdatei.
3. Für diesen Benutzer `gh` mit Schreibrecht auf das Repository anmelden und Claude Code mit dem Claude-Abo anmelden. Claude Code einmal interaktiv in `repo/` starten und die Vertrauensabfrage für den Ordner bestätigen. Laut Claude-Code-Dokumentation gilt dieses Vertrauen auch für die Worktrees unter `work/`, weil sie zum selben Repository gehören; eine unbestätigte Abfrage würde eine unbediente Sitzung anhalten.
4. Im Repository auf GitHub unter Settings → Actions → General für Workflows aus Pull Requests die Freigabe für alle externen Beitragenden verlangen.
5. In den Benutzereinstellungen von Claude Code (`~/.claude/settings.json`) die rechnerspezifischen Freigaben eintragen: den Aufruf von `pipwerk-dev` mit seinem absoluten Pfad und Schreibrechte für Dateien unterhalb des Entwicklungsverzeichnisses. Die allgemeinen Freigaben stehen in `.claude/settings.json` im Repository. Eine nicht freigegebene Aktion hält eine unbediente Sitzung an.
6. Die Auftragsverwaltung mit `tools/order-management/start.sh` starten. Das Skript beendet eine laufende Sitzung, legt die Arbeitskopie `work/order-management/coordinate` auf dem aktuellen Stand von `origin/main` neu an und startet `claude --agent order-management` in der tmux-Sitzung `order-management`. Es wird spätestens alle 7 Tage erneut ausgeführt, bei Bedarf über einen Cron-Job.
7. Der Projektleiter richtet die geplante Benachrichtigung des Nutzers ein.

Vor der Freigabe des Prozesses ist ein vollständiger Durchlauf nachzuweisen: Auftrag, Implementierung, unabhängige QA, Korrektur und erneute QA, Rückfrage, commitgebundene Testbereitstellung, Prüfung durch den Projektleiter, Abnahme und kontrollierter Abschluss. Der Nachweis verwendet einen kleinen echten Code-Auftrag an Pipwerk Studio. Er weist zugleich nach, dass `/loop` als `initialPrompt` arbeitet, dass die Teamfunktion in einer tmux-Sitzung zuverlässig läuft, dass in den Worktrees keine Vertrauensabfrage erscheint und dass alle vorgesehenen Befehle freigegeben sind.

## Weitere Qualitätswerkzeuge

Die verbindlichen Prüfwerkzeuge und Qualitätsregeln stehen in den [Entwicklungs-, Test- und Sicherheitsregeln](development-test-security-rules.md) und gelten unverändert.

Spec Kit ist erst nach einem nachgewiesenen Durchlauf als zusätzliche Qualitätsschicht für Spezifikation, Klärung, Planung und prüfbare Arbeitsaufträge vorgesehen. Es ersetzt weder die maßgebliche Dokumentation noch die Rollen und die unabhängige QA. Weitere Werkzeuge, insbesondere Vertrags-, Sicherheits-, Architektur-, Property-based- oder Mutationstests, werden anschließend bedarfsgerecht bewertet. Ein Werkzeug gilt erst dann als Qualitätsgewinn, wenn Aufgabe, Prüfkriterium und Wirkung nachgewiesen sind.

Zugangsdaten und API-Schlüssel gehören nicht ins Repository. Claude Code wird über ein Claude-Abo mit festem Monatspreis betrieben, nicht verbrauchsabhängig. Eine Kostenbegrenzung je Lauf ist deshalb nicht vorgesehen; das Erreichen der Nutzungsgrenze unterbricht die Arbeit nur. Die Modellzuordnung der Rollen ist änderbare Laufzeitkonfiguration. Anbieterunabhängigkeit beziehungsweise der Einsatz mehrerer Sprachmodell-Anbieter ist derzeit keine Anforderung an den Entwicklungsprozess.

## Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-08 | Festgelegt: Merge mit Merge-Commit, `coordinate/` auf dem Stand des ersten Anstoßes, Zeitpunkte auf die Sekunde, Reihenfolge und Belegung in der Auftragsverwaltung, Nachholen des Aufräumens, Freigabepflicht für Workflows aus fremden Pull Requests, Vertrauensabfrage über `repo/`. |
| 2026-10-08 | Prozess mit Auftragsverwaltung, Runner und paralleler Bearbeitung eingeführt: Übergangsregel und feste Arbeitsbereiche entfernt, `pipwerk-dev` mit Arbeitsbereichen je Auftrag und Teststand je Komponente beschrieben, Einrichtung auf dem Entwicklungsrechner und Arbeitskopie der Auftragsverwaltung ergänzt. |
| 2026-10-08 | Betrieb der Auftragsverwaltung als dauerhafte Sitzung mit `/loop` über `initialPrompt` festgelegt; tmux-Sitzungsname gleich Auftragskennung; Übernahme des Ergebnisses unabhängig vom Sitzungsende und Beenden der Sitzung durch die Auftragsverwaltung; Freigaben präzisiert. |
| 2026-10-08 | Zum maßgeblichen Prozessdokument ausgebaut: Prozessinhalte aus Entwicklungsplan übernommen, Dokumentationsorte, Beteiligte, vollständiges Statusmodell mit zulässigen Übergängen, Pflichtfelder und Abschnitte eines Auftrags, Auftragsverwaltung, Ergebnisdatei, Runner, Benachrichtigung, parallele Bearbeitung, Arbeitsbereiche nach der Einführung, Erweiterung von `pipwerk-dev` und Einführung festgelegt; Übergangsregel bis zur Einführung ergänzt. |
| 2026-10-08 | Auftragsablage nach `work-orders/` auf oberster Ebene verlegt. |
| 2026-10-07 | Auftragsablage mit Statusfeld und Statusverzeichnissen, Statuswechsel als Verwaltungsarbeit auf `main` und geplanten Anstoß über GitHub Actions festgelegt. |
| 2026-10-07 | Verworfene Auftrags- und Sitzungsautomatisierung entfernt; transportunabhängige Prozessregeln und die eigenständige Schnittstelle des lokalen Hilfswerkzeugs erhalten. Frühere Fassungen sind in Git nachvollziehbar. |
