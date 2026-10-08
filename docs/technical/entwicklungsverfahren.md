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

## Stand der Einführung

Dieses Dokument beschreibt den beschlossenen Prozess mit Auftragsverwaltung, Runner und paralleler Bearbeitung. Er wird in einem Schritt eingeführt (siehe [Einführung](#einführung)). Bis dahin gilt die folgende Übergangsregel:

- Der Nutzer startet die Sitzung des Softwarearchitekten von Hand in `repo/` und nennt ihm den Auftrag.
- Die Aufgaben der Auftragsverwaltung führt der Softwarearchitekt aus, soweit sie für einen einzelnen Auftrag nötig sind: Er setzt die Status `inprogress`, `acceptance` und `closed` und meldet Rückfragen und Ergebnisse in seiner Sitzung.
- Es wird nur ein Auftrag gleichzeitig bearbeitet. Es gelten die festen Arbeitsbereiche aus [Arbeitsbereiche bis zur Einführung](#arbeitsbereiche-bis-zur-einführung) und die heutigen Befehle von `pipwerk-dev`.

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
7. Nach Abnahme durch den Nutzer trägt der Projektleiter die Abnahme in den Auftrag ein. Die Auftragsverwaltung stößt den Softwarearchitekten zum Merge an und setzt nach dessen Bestätigung `closed`.

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

Die Feldnamen sind maschinenlesbare Bezeichner und deshalb englisch. Die Auftragskennung hat die Form `WO-JJJJ-MM-TT-NNN` und wird auch in Verzeichnis- und Sitzungsnamen verwendet.

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
| `approved` | `blocked` | Pflichtfelder fehlen oder sind ungültig |
| `queued` | `inprogress` | alle betroffenen Komponenten frei; Softwarearchitekt angestoßen |
| `inprogress` | `acceptance` | Ergebnis `ready` des Softwarearchitekten |
| `inprogress` | `blocked` | Ergebnis `question` oder `failed`, oder die Sitzung des Softwarearchitekten endete ohne Ergebnis |
| `inprogress` | `closed` | Ergebnis `merged` nach Abnahme |
| `blocked` | `inprogress` | Entscheidung des Auftraggebers eingetragen; Softwarearchitekt erneut angestoßen |
| `blocked` | `queued` | Entscheidung eingetragen, eine betroffene Komponente inzwischen belegt |
| `acceptance` | `inprogress` | Ablehnung mit Abweichungen oder Abnahme eingetragen; Softwarearchitekt zur Korrektur beziehungsweise zum Merge angestoßen |
| `approved`, `queued`, `inprogress`, `blocked`, `acceptance` | `cancelled` | Rückzug durch den Auftraggeber eingetragen |

`closed` und `cancelled` sind Endzustände. Ein weiterer Status wird erst verwendet, nachdem er in beide Tabellen aufgenommen wurde. Stimmen Statuseintrag und Verzeichnis nicht überein, ist das ein Fehler, den die Auftragsverwaltung bei ihrer nächsten Prüfung behebt.

### Änderungen an einem Auftrag

Inhaltliche Änderungen eines Auftrags erfolgen über Branch und Pull Request und nach der Freigabe nur mit Zustimmung des Nutzers.

Drei Arten von Änderungen sind Verwaltungsarbeit und werden direkt auf `main` gebucht, ohne lokalen Arbeitsbereich, zum Beispiel über die GitHub-API:

- Statuswechsel mit Verschieben der Datei und Eintrag im Verlauf, durch die Auftragsverwaltung;
- Einträge im Abschnitt „Offene Punkte“ bei einem Wechsel nach `blocked`, durch die Auftragsverwaltung;
- Einträge im Abschnitt „Entscheidungen des Auftraggebers“, durch den Projektleiter.

Eine Entscheidung des Auftraggebers ist ein Eintrag mit Datum und einer der Entscheidungsarten `accept` (Abnahme), `reject` (Ablehnung mit Liste der Abweichungen), `cancel` (Rückzug) oder `answer` (Antwort auf einen offenen Punkt, mit Bezug auf diesen). Die Auftragsverwaltung erkennt neue Einträge daran, dass ihr Datum nach dem letzten Eintrag im Verlauf liegt.

## Auftragsverwaltung

Die Auftragsverwaltung verwaltet jeden Auftrag von der Freigabe bis zum Abschluss. Sie ist eine Übergangslösung bis zur Entwicklung einer allgemeinen Nachrichten- und Auftragsverwaltung als Teil von Pipwerk. Sie wird als dauerhaft laufender Agent betrieben, den ein systemd-Dienst in einer tmux-Sitzung startet und nach einem Abbruch neu startet. Ihre Rollendefinition legt das Prüfintervall fest, als Standardwert 5 Minuten.

Bei jeder Prüfung liest die Auftragsverwaltung alle Auftragsdateien in `$PIPWERK_DEV_ROOT/repo/work-orders/`. Sie arbeitet nicht in `repo/` und verändert es nicht. Sie handelt wie folgt:

| Lage | Handlung |
|---|---|
| Auftrag mit `approved` | Pflichtfelder prüfen; bei Mangel `blocked` mit dem Mangel als offenem Punkt. Sonst Komponenten prüfen: belegt `queued`, frei anstoßen und `inprogress`. |
| Auftrag mit `queued` | Sind alle betroffenen Komponenten frei, anstoßen und `inprogress`. Ältere Aufträge zuerst. |
| Auftrag mit `inprogress`, Sitzung läuft | nichts |
| Auftrag mit `inprogress`, Sitzung beendet, Ergebnisdatei vorhanden | Ergebnis übernehmen: `ready` nach `acceptance`, `question` und `failed` nach `blocked` mit dem Text als offenem Punkt, `merged` nach `closed` und Arbeitsbereiche des Auftrags abbauen |
| Auftrag mit `inprogress`, Sitzung beendet, keine Ergebnisdatei | `blocked`; Abbruch als offenen Punkt vermerken |
| neue Entscheidung `answer` bei `blocked` | Softwarearchitekten mit der Antwort erneut anstoßen und `inprogress`, bei belegter Komponente `queued` |
| neue Entscheidung `reject` bei `acceptance` | Softwarearchitekten mit der Liste der Abweichungen zur Korrektur anstoßen und `inprogress` |
| neue Entscheidung `accept` bei `acceptance` | Softwarearchitekten zum Merge anstoßen und `inprogress` |
| neue Entscheidung `cancel` | laufende Sitzung beenden, Arbeitsbereiche abbauen und `cancelled` |

Lehnt `pipwerk-dev remove` den Abbau der Arbeitsbereiche ab, zum Beispiel wegen nicht übertragener Commits, vermerkt die Auftragsverwaltung den Grund im Verlauf und lässt die Arbeitsbereiche bestehen.

Anstoßen heißt: den Arbeitsbereich `coordinate/` des Auftrags anlegen und darin die Sitzung des Softwarearchitekten in einer tmux-Sitzung `pipwerk-<auftragskennung>` starten. Die Auftragsverwaltung ist dabei der Aufrufer im Sinne der [Aufrufschnittstelle](agentenrollen-und-briefings.md#aufrufschnittstelle). Der Startauftrag nennt die Auftragskennung und die Aufgabe: umsetzen, korrigieren mit Abweichungen, mit einer Antwort fortsetzen oder mergen.

Ob die Sitzung läuft, prüft die Auftragsverwaltung mit `tmux has-session -t pipwerk-<auftragskennung>`. Eine Komponente gilt als belegt, solange ein Auftrag, der sie nennt, auf `inprogress`, `blocked` oder `acceptance` steht.

Die Auftragsverwaltung hält keinen Stand im Gedächtnis ihrer Sitzung. Ihr gesamter Stand ergibt sich aus Auftragsdateien, tmux-Sitzungen und Ergebnisdateien. Ein Neustart ist deshalb jederzeit möglich. Jede Handlung prüft vor der Ausführung den aktuellen Stand, sodass eine wiederholte Prüfung nichts doppelt ausführt. Schlägt ein Statuswechsel fehl, weil sich die Datei auf `main` inzwischen geändert hat, wird er bei der nächsten Prüfung neu bewertet.

### Ergebnisdatei des Softwarearchitekten

Der Softwarearchitekt schreibt als letzte Handlung seiner Sitzung die Datei `$PIPWERK_DEV_ROOT/transfer/<auftragskennung>/result.json`:

| Feld | Inhalt |
|---|---|
| `id` | Auftragskennung |
| `outcome` | `ready` (Teststand bereit), `question` (Rückfrage an den Auftraggeber), `failed` (Arbeit nicht möglich) oder `merged` (Merge abgeschlossen) |
| `commit` | vollständiger Commit-Hash des Teststands beziehungsweise des Merge, sonst leer |
| `pull_request` | Nummer des Pull Requests, sonst leer |
| `text` | Rückfrage, Fehlerbeschreibung oder Hinweise zum Teststand in ganzen Sätzen |
| `created` | Zeitpunkt der Erstellung |

Nach der Übernahme benennt die Auftragsverwaltung die Datei in `result-JJJJMMTThhmmss.json` um, gebildet aus `created`. Damit bleibt jedes Ergebnis erhalten, und ein neues ist eindeutig erkennbar.

## Runner

Ein GitHub-Actions-Workflow auf einem selbst betriebenen Runner auf dem Entwicklungsrechner hält `repo/` aktuell. Er startet bei jedem Push auf `main` und führt `pipwerk-dev sync-repo` aus. Weitere Aufgaben hat er nicht.

Der Runner läuft als systemd-Dienst unter dem Benutzer, dem die Arbeitsbereiche gehören. `PIPWERK_DEV_ROOT` steht in der Umgebungsdatei des Runners. Der Workflow hat keine Auslöser für Pull Requests, damit Änderungsvorschläge Dritter im öffentlichen Repository keinen Code auf dem Entwicklungsrechner ausführen. Schlägt `sync-repo` fehl, ist das im Lauf auf GitHub sichtbar; der nächste Push holt die Aktualisierung nach.

## Benachrichtigung des Nutzers

Eine geplante Prüfung des Projektleiters liest stündlich die Statusfelder der Aufträge auf `main`. Ist ein Auftrag seit der letzten Prüfung auf `acceptance` oder `blocked` gewechselt, erhält der Nutzer eine Benachrichtigung mit Auftragskennung und einem Satz zum Inhalt. Der Nutzer kann den Stand außerdem jederzeit beim Projektleiter erfragen.

## Parallele Bearbeitung

Mehrere Aufträge werden gleichzeitig bearbeitet, wenn sie keine gemeinsame Komponente betreffen. Als je eigene Komponente gelten jede Hauptkomponente unter `components/`, jedes Paket unter `packages/`, `contracts/` sowie übergreifende Dokumente und Regeln außerhalb einer Komponente unter dem Namen `common`.

Die Einschränkung ist keine technische Notwendigkeit von Git. Sie vermeidet Konflikte beim Zusammenführen und damit erneute QA-Läufe. Wird ein paralleler Auftrag zuerst gemergt, bringt der andere seinen Branch auf den neuen Stand von `main`; danach ist eine erneute QA erforderlich.

Jeder Auftrag erhält eigene Arbeitsbereiche, jede Komponente einen eigenen Teststand, und jedes Agententeam läuft in einer eigenen tmux-Sitzung (siehe [Arbeitsbereiche nach der Einführung](#arbeitsbereiche-nach-der-einführung)).

## Arbeitsbereiche nach der Einführung

Unter dem Pipwerk-Entwicklungsverzeichnis `$PIPWERK_DEV_ROOT` liegen:

| Verzeichnis | Inhalt | verändert von |
|---|---|---|
| `repo/` | Klon des Repositorys auf dem Stand von `origin/main`; Träger der gemeinsamen Git-Daten | nur `pipwerk-dev sync-repo` |
| `work/<auftragskennung>/coordinate/` | Worktree des Softwarearchitekten, Commit von `origin/main` beim Anstoßen, ohne Branch; Arbeitsverzeichnis seiner Sitzung | Auftragsverwaltung über `pipwerk-dev` |
| `work/<auftragskennung>/implement/` | Worktree des Entwicklers mit dem Arbeitsbranch | Entwickler |
| `work/<auftragskennung>/review/` | Worktree der QA mit dem lokalen Prüfbranch | QA |
| `test/<komponente>/` | Teststand der Komponente, ohne Branch auf einem freigegebenen Commit | nur `pipwerk-dev` |
| `transfer/` | Arbeitsergebnisse und Ergebnisdateien, keine Projektfestlegungen | Agenten |
| `scripts/` | `pipwerk-dev` und seine lokale Dokumentation, nicht Teil des Repositorys | nicht durch das Team |

Kein Agent arbeitet in `repo/`. Entwickler und QA finden ihren Arbeitsbereich über `$PIPWERK_DEV_ROOT` und die Auftragskennung in `$PIPWERK_ORDER_ID`. Die Agentendefinitionen enthalten keine Pfade des Rechners.

Jeder Worktree enthält alle Dateien des Repositorys, also auch `.claude/`. Wirksam sind nur die Agentendefinitionen im Arbeitsverzeichnis der Sitzung des Softwarearchitekten, also in `coordinate/`. Sie entsprechen damit dem Stand von `main` beim Anstoßen.

## Arbeitsbereiche und Umgang mit Fehlern

Entwicklung und unabhängige QA verwenden getrennte Arbeitsbereiche. Die Arbeitsbereiche und ihre Schutzregeln stehen in den Abschnitten [Arbeitsbereiche bis zur Einführung](#arbeitsbereiche-bis-zur-einführung) und [Arbeitsbereiche nach der Einführung](#arbeitsbereiche-nach-der-einführung). Ausgangs- beziehungsweise Prüfcommit werden im jeweiligen Auftrag eindeutig benannt. Der Teststand entspricht unverändert dem freigegebenen Commit.

Eigene Fehler, unvollständige Änderungen und Testreste werden vor der Übergabe vollständig beseitigt. Fremde Änderungen werden nicht verworfen. Die zuständige Rolle wird anhand von Diff, Auftragsreferenzen und Prüfnachweisen ermittelt. Nur zwingend fehlende Entscheidungen, Berechtigungen oder Handlungen außerhalb der eigenen Zuständigkeit werden eskaliert; unabhängige Arbeiten werden fortgesetzt.

## Arbeitsbereiche bis zur Einführung

Dieser Abschnitt gilt bis zur [Einführung](#einführung). Danach gelten die [Arbeitsbereiche nach der Einführung](#arbeitsbereiche-nach-der-einführung).

Auf dem Entwicklungsrechner gibt es ein Pipwerk-Entwicklungsverzeichnis. Darin liegen nebeneinander die folgenden Verzeichnisse. Die Namen sind fest, weil Werkzeuge und Agentendefinitionen sie verwenden.

Die Verzeichnisse `repo/`, `implement/`, `review/` und `test/` sind Git-Arbeitsbereiche desselben Repositorys. `repo/` ist ein normaler Klon von GitHub, die übrigen drei sind daran angehängte Worktrees. Ein Worktree ist ein zusätzliches Arbeitsverzeichnis, das sich die Git-Daten mit `repo/` teilt, aber einen eigenen Branch oder Commit ausgecheckt hat.

Die Agenten finden das Pipwerk-Entwicklungsverzeichnis über die Umgebungsvariable `PIPWERK_DEV_ROOT`. Jedes aufrufende Programm muss sie gemäß der [Aufrufschnittstelle](agentenrollen-und-briefings.md#aufrufschnittstelle) prüfen und in der Prozessumgebung des Teams bereitstellen. Bis zur Einführung ist der Nutzer der Aufrufer, der die Sitzung von Hand startet. Kein Agent setzt, überschreibt oder entfernt sie; alle verwenden nur den gesetzten Wert und schreiben Pfade über die Variable. Der Softwarearchitekt nennt Entwickler und QA ihre Arbeitsbereiche deshalb nur als `$PIPWERK_DEV_ROOT/implement` und `$PIPWERK_DEV_ROOT/review`, nie als ausgeschriebenen Pfad. Die Agentendefinitionen enthalten keine Pfade des Rechners. Ist die Variable nicht gesetzt, brechen die Agenten ab.

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

Die folgenden Unterabschnitte beschreiben den heutigen Stand des Werkzeugs. Die geplante Erweiterung steht in [Erweiterung für den Parallelbetrieb](#erweiterung-für-den-parallelbetrieb).

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

### Erweiterung für den Parallelbetrieb

Für die [Arbeitsbereiche nach der Einführung](#arbeitsbereiche-nach-der-einführung) muss `pipwerk-dev` folgende Anforderungen erfüllen. Das Werkzeug wird nicht vom Agententeam geändert, sondern in einer eigenen Claude-Code-Sitzung auf Grundlage dieses Abschnitts.

Befehle:

```sh
pipwerk-dev sync-repo
pipwerk-dev prepare --order <auftragskennung> coordinate --base <commit>
pipwerk-dev prepare --order <auftragskennung> <implement|review> <branch> --base <commit>
pipwerk-dev update  --order <auftragskennung> <implement|review> <ref>
pipwerk-dev test    <komponente> --order <auftragskennung> --workspace <implement|review>
pipwerk-dev start   <komponente> <commit-hash>
pipwerk-dev stop    <komponente>
pipwerk-dev remove  --order <auftragskennung>
pipwerk-dev status  [--order <auftragskennung>]
```

1. **Arbeitsbereiche je Auftrag:** `prepare` legt die Worktrees unter `work/<auftragskennung>/` an. `coordinate` wird ohne Branch auf den genannten Commit gesetzt. Die bisherigen Schutzregeln von `prepare` und `update` gelten für jeden dieser Worktrees unverändert.
2. **Abbau:** `remove` entfernt die Worktrees und lokalen Branches eines Auftrags. Es bricht ohne Änderung ab, wenn ein Worktree lokale Änderungen hat, ein lokaler Branch Commits enthält, die nicht auf `origin` liegen, oder in einem der Worktrees ein verwalteter Prozess oder eine Claude-Code-Sitzung läuft.
3. **Teststand je Komponente:** `start`, `stop` und `status` arbeiten je Komponente unter `test/<komponente>/` mit eigenen, je Komponente konfigurierten Ports und getrennter Testdatenbank. Teststände verschiedener Komponenten laufen gleichzeitig. Für dieselbe Komponente bricht `start` weiterhin ab, wenn sie aus einem anderen Commit läuft. Die übrigen Regeln von `start` bleiben erhalten.
4. **Parallele Prüfungen:** `test` vergibt je Lauf freie Ports für die Browser-End-to-End-Tests, für Pipwerk Studio über `PIPWERK_STUDIO_E2E_BACKEND_PORT` und `PIPWERK_STUDIO_E2E_FRONTEND_PORT` (siehe [Pipwerk Studio – technische Dokumentation](pipwerk-studio.md)).
5. **Sperren je Bereich:** Ein Aufruf sperrt nur den betroffenen Auftragsarbeitsbereich oder Teststand. Operationen auf den gemeinsamen Git-Daten wie `git fetch` und das Anlegen oder Entfernen von Worktrees werden kurz gemeinsam gesperrt. Ein gesperrter Aufruf endet mit Exitcode 3 und nennt den Grund.
6. **Referenz-Repository:** `sync-repo` behält seine Abbruchbedingungen.
7. **Erweiterbare Komponentenliste:** Prüfschritte, Startbefehle, Erreichbarkeitsprüfungen und Ports werden je Komponente beschrieben. Eine weitere Komponente kann ergänzt werden, ohne die Logik für Arbeitsbereiche, Sperren und Prozessverwaltung zu ändern. Umgesetzt wird zunächst nur `pipwerk-studio`.
8. **Zustandsübersicht:** `status` ohne `--order` zeigt alle Auftragsarbeitsbereiche und alle Teststände. `status` verändert nichts.
9. **Unveränderte Grundsätze:** Ausgabe mit `--json`, Exitcodes 0 bis 3, Protokolle im lokalen Zustandsverzeichnis, Ersetzen von Zugangsdaten in Ausgaben und Protokollen, kein Verändern fremder Daten, `main` bewegt nur `sync-repo`, `pipwerk-dev` startet keine Agenten und kennt keine Auftragsinhalte.
10. **Umstellung:** Die bisherigen Arbeitsbereiche `implement/`, `review/` und `test/` werden nur entfernt, wenn sie keine lokalen Änderungen und keine nicht übertragenen Commits enthalten. Andernfalls bricht die Umstellung ab und nennt die betroffenen Dateien und Commits.
11. **Nachweis:** Die automatischen Tests von `pipwerk-dev` decken jede dieser Anforderungen ab, insbesondere zwei gleichzeitige Aufträge, zwei gleichzeitige Prüfläufe und zwei gleichzeitige Teststände verschiedener Komponenten. Die lokale Dokumentation in `scripts/` wird vollständig aktualisiert.

## Einführung

Der beschlossene Prozess wird in einem Schritt eingeführt, weil seine Teile voneinander abhängen. Zum Einführungspaket gehören:

1. die Erweiterung von `pipwerk-dev` für den Parallelbetrieb;
2. die Rollendefinitionen von Softwarearchitekt, Entwickler und QA mit den neuen Arbeitsbereichen und Befehlen, ohne Statuswechsel und mit der Ergebnisdatei statt der Meldung an den Projektleiter;
3. die Skills `pipwerk-test-deployment`, `pipwerk-close-work-order` und `pipwerk-escalation` mit denselben Änderungen;
4. die neue Rollendefinition der Auftragsverwaltung und ihr systemd-Dienst;
5. die Freigaben in `.claude/settings.json`, damit Sitzungen ohne Bediener die in den Rollendefinitionen und Skills vorgesehenen Befehle ohne Rückfrage ausführen;
6. der Workflow des Runners;
7. die geplante Benachrichtigung des Nutzers;
8. die Aktualisierung dieses Dokuments und der [Agentenrollen und Briefings](agentenrollen-und-briefings.md): Wegfall der Übergangsregel und der Arbeitsbereiche bis zur Einführung.

Der Runner wird nicht vor der Erweiterung von `pipwerk-dev` in Betrieb genommen. Bis dahin arbeitet der Softwarearchitekt in `repo/`, und `sync-repo` würde während seiner Arbeit abgelehnt.

Vor der Freigabe des eingeführten Prozesses ist ein vollständiger Durchlauf nachzuweisen: Auftrag, Implementierung, unabhängige QA, Korrektur und erneute QA, Rückfrage, commitgebundene Testbereitstellung, Prüfung durch den Projektleiter, Abnahme und kontrollierter Abschluss. Der Nachweis verwendet einen kleinen echten Code-Auftrag an Pipwerk Studio.

## Weitere Qualitätswerkzeuge

Die verbindlichen Prüfwerkzeuge und Qualitätsregeln stehen in den [Entwicklungs-, Test- und Sicherheitsregeln](development-test-security-rules.md) und gelten unabhängig vom Stand der Einführung.

Spec Kit ist erst nach einem nachgewiesenen Durchlauf als zusätzliche Qualitätsschicht für Spezifikation, Klärung, Planung und prüfbare Arbeitsaufträge vorgesehen. Es ersetzt weder die maßgebliche Dokumentation noch die Rollen und die unabhängige QA. Weitere Werkzeuge, insbesondere Vertrags-, Sicherheits-, Architektur-, Property-based- oder Mutationstests, werden anschließend bedarfsgerecht bewertet. Ein Werkzeug gilt erst dann als Qualitätsgewinn, wenn Aufgabe, Prüfkriterium und Wirkung nachgewiesen sind.

Zugangsdaten und API-Schlüssel gehören nicht ins Repository. Claude Code wird über ein Claude-Abo mit festem Monatspreis betrieben, nicht verbrauchsabhängig. Eine Kostenbegrenzung je Lauf ist deshalb nicht vorgesehen; das Erreichen der Nutzungsgrenze unterbricht die Arbeit nur. Die Modellzuordnung der Rollen ist änderbare Laufzeitkonfiguration. Anbieterunabhängigkeit beziehungsweise der Einsatz mehrerer Sprachmodell-Anbieter ist derzeit keine Anforderung an den Entwicklungsprozess.

## Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-08 | Zum maßgeblichen Prozessdokument ausgebaut: Prozessinhalte aus Entwicklungsplan übernommen, Dokumentationsorte, Beteiligte, vollständiges Statusmodell mit zulässigen Übergängen, Pflichtfelder und Abschnitte eines Auftrags, Auftragsverwaltung, Ergebnisdatei, Runner, Benachrichtigung, parallele Bearbeitung, Arbeitsbereiche nach der Einführung, Erweiterung von `pipwerk-dev` und Einführung festgelegt; Übergangsregel bis zur Einführung ergänzt. |
| 2026-10-08 | Auftragsablage nach `work-orders/` auf oberster Ebene verlegt. |
| 2026-10-07 | Auftragsablage mit Statusfeld und Statusverzeichnissen, Statuswechsel als Verwaltungsarbeit auf `main` und geplanten Anstoß über GitHub Actions festgelegt. |
| 2026-10-07 | Verworfene Auftrags- und Sitzungsautomatisierung entfernt; transportunabhängige Prozessregeln und die eigenständige Schnittstelle des lokalen Hilfswerkzeugs erhalten. Frühere Fassungen sind in Git nachvollziehbar. |
