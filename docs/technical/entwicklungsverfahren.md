# Das Pipwerk-Entwicklungsverfahren

## Status

- status: `draft`
- stand: 2026-10-09
- bereich: Entwicklungsprozess (keine Produktkomponente)

## Geltungsbereich und Dokumentationsorte

Dieses Dokument ist die maßgebliche Beschreibung des Entwicklungsprozesses von Pipwerk: Ablauf, Planungsebenen, Arbeitsaufträge und ihr Statusmodell, die Programme `ordermgr` und `agentrun`, Runner, parallele Bearbeitung, Arbeitsbereiche und das lokale Hilfswerkzeug `pipwerk-dev`. Rollen, Verhaltensregeln, Briefings, Agentendefinitionen und Skills stehen in [Agentenrollen und Briefings](agentenrollen-und-briefings.md). Die technischen Qualitätsanforderungen an Code und Tests stehen in den [Entwicklungs-, Test- und Sicherheitsregeln](development-test-security-rules.md). Der [Entwicklungsplan](../design/planning/entwicklungsplan-strategiedesigner.md) enthält nur die Produktplanung.

Für die Dokumentation gilt: Jede Festlegung steht an genau einer Stelle unter `docs/`. Eine README-Datei dient nur der Orientierung in ihrem Verzeichnis. Sie beschreibt, wozu das Verzeichnis da ist, und verweist auf das zuständige Dokument, enthält aber selbst keine Festlegungen.

Maßgeblich sind das aktuelle Repository, der freigegebene Arbeitsauftrag und die für die Änderung geltenden Anforderungen und Verträge. Chats, Agentenausgaben und temporäre Übergaben ersetzen keine Repository-Dokumentation. Neue Festlegungen werden in das zuständige Dokument übernommen.

Eine Aussage wird nicht allein dadurch zu einer bestätigten fachlichen Festlegung, dass sie in einem Repository-Dokument steht. Inhalte eines mit `draft` gekennzeichneten Dokuments sind Arbeitsstand und dürfen nicht ohne weitere Grundlage als vom Nutzer bestätigte fachliche Entscheidung behandelt werden. Bei Widersprüchen oder zweifelhafter Herkunft wird zunächst geprüft, ob eine dokumentierte spätere Entscheidung, ein Änderungsnachweis oder die Git-Historie die Aussage eindeutig klärt. Eine veraltete oder widersprüchliche Stelle, die sich anhand bereits getroffener Festlegungen eindeutig korrigieren lässt, wird korrigiert und nicht als neue fachliche Frage an den Nutzer zurückgegeben.

## Beteiligte

| Beteiligter | Aufgabe im Ablauf |
|---|---|
| Nutzer | Auftraggeber. Trifft fachliche und grundlegende Architekturentscheidungen, gibt Aufträge frei, erprobt und nimmt ab. Spricht ausschließlich mit dem Projektleiter. |
| Projektleiter | Plant mit dem Nutzer die Arbeitspakete, klärt und erteilt Aufträge, gibt Entscheidungen des Nutzers als Aufträge weiter, prüft die Abnahmekriterien am Teststand und führt die Liste der Arbeitspakete. |
| `ordermgr` | Programm der Auftragsverwaltung. Übernimmt Aufträge aus dem Repository, führt Status und Akte, übergibt Aufträge an `agentrun`, wertet Ergebnisse aus, regelt die Reihenfolge paralleler Aufträge und gibt jeden Auftrag an das Repository zurück. |
| `agentrun` | Programm für die Läufe des Softwarearchitekten. Richtet den Arbeitsbereich ein, startet und überwacht die Sitzung, beendet sie und baut Arbeitsbereiche ab. |
| Softwarearchitekt | Setzt einen Auftrag mit Entwickler und QA um, stellt den Teststand bereit und führt nach der Abnahme den Merge aus. |
| Entwickler | Implementiert im eigenen Arbeitsbereich und Branch. |
| QA | Prüft unabhängig im eigenen Arbeitsbereich. |
| Runner | Hält `repo/` auf dem Stand von `origin/main`. |

`ordermgr` und `agentrun` sind Skripte, keine Sprachmodell-Sitzungen. `ordermgr` kennt keine Prozesse, `agentrun` setzt keinen Status. Der Projektleiter setzt außer `draft` und `approved` keinen Auftragsstatus. Zuständigkeiten, Entscheidungsgrenzen und Briefings stehen in [Agentenrollen und Briefings](agentenrollen-und-briefings.md).

## Planungsebenen

| Ebene | Inhalt | Ablage |
|---|---|---|
| Entwicklungsplan | Ziel und Reihenfolge der Entwicklung; aus ihm ergeben sich die Arbeitspakete | [Entwicklungsplan](../design/planning/entwicklungsplan-strategiedesigner.md) |
| Arbeitspaket | Ziel, Abgrenzung und Abhängigkeiten einer Planungseinheit | `docs/design/planning/workpackages/AP<n>-<titel>.md` |
| Arbeitsauftrag | umsetzbare und abnehmbare Einheit; nennt sein Arbeitspaket | `work-orders/` und `ordermgr` |

Aus einem Arbeitspaket entstehen ein oder mehrere Arbeitsaufträge. Den Stand aller Arbeitspakete zeigt die Liste `docs/design/planning/workpackages/workpackages.csv`. Sie ist ein Arbeitsdokument mit den Spalten:

| Spalte | Inhalt | eingetragen von |
|---|---|---|
| `id` | Kennung des Arbeitspakets, zum Beispiel `AP2` | Projektleiter |
| `title` | Titel | Projektleiter |
| `status` | `open` (festgelegt), `ordered` (Auftrag erteilt), `testing` (fertig, wartet auf Erprobung durch den Nutzer), `done` (abgenommen) | Projektleiter: `open`, `ordered`, `testing`; Nutzer: `done` |
| `workorders` | Kennungen der zugehörigen Aufträge, durch Leerzeichen getrennt | Projektleiter |
| `testresult` | Ergebnis der Erprobung, bei Abweichungen deren Beschreibung | Nutzer |

Die Liste und die Akten in `work-orders/outgoing/` zeigen den gesamten Arbeitsstand. Eine gesonderte Benachrichtigung oder Überwachung durch den Projektleiter gibt es nicht. Der Projektleiter liest zu Beginn jeder Arbeit mit dem Nutzer `work-orders/outgoing/` und die Liste.

## Ablauf eines Arbeitsauftrags

1. Der Projektleiter klärt den Auftrag mit dem Nutzer und legt ihn als Pull Request mit Status `draft` in `work-orders/incoming/` an. Nach Freigabe durch den Nutzer setzt er `approved`, merget und setzt das Arbeitspaket auf `ordered`. Ein Auftrag wird erst freigegeben, wenn die für die Umsetzung erforderlichen fachlichen Fragen geklärt sind.
2. Der Runner bringt `repo/` auf den neuen Stand. `ordermgr` übernimmt den Auftrag, prüft ihn und übergibt ihn an `agentrun` oder reiht ihn ein.
3. `agentrun` startet den Softwarearchitekten. Dieser lässt den Auftrag vom Entwickler im eigenen Branch umsetzen. Der Entwickler führt die vorgesehenen Prüfungen aus, aktualisiert die Dokumentation und erstellt einen Pull Request.
4. Die QA prüft unabhängig Auftrag, Ausgangsstand, Pull Request und Commit, Code, Tests und Dokumentation. Befunde werden vollständig korrigiert und erneut geprüft. Eine Fertigmeldung ersetzt die QA nicht.
5. Der Softwarearchitekt stellt genau den von der QA freigegebenen Commit als Teststand bereit, prüft Erreichbarkeit und Commit-Identität und trägt das Ergebnis `ready` in die Akte ein. Eine spätere Codeänderung erfordert erneute QA. `agentrun` beendet die Sitzung, `ordermgr` setzt `acceptance` und legt die Akte nach `work-orders/outgoing/`.
6. Der Projektleiter prüft jedes Abnahmekriterium am Teststand. Abweichungen gibt er mit einem Auftrag der Art `decision` und der Entscheidung `reject` weiter. Ist der Auftrag erfüllt, setzt er das Arbeitspaket auf `testing`.
7. Der Nutzer erprobt den Teststand und trägt das Ergebnis in die Liste der Arbeitspakete ein. Bei Abnahme erteilt der Projektleiter einen Auftrag `decision` mit `accept`, bei Abweichungen mit `reject`. Nach `accept` lässt `ordermgr` den Softwarearchitekten mergen und setzt nach dessen Ergebnis `merged` den Status `closed`. Gemergt wird mit einem Merge-Commit, nicht durch Zusammenfassen (Squash), damit die Commits des Arbeitsbranches in `main` enthalten bleiben.

Änderungen an Programmcode und wesentlicher Dokumentation erfolgen über Branch und Pull Request. Übergaben benennen Arbeitsauftrag, Branch, Pull Request, Commit und Prüfergebnis eindeutig. Der Nutzer muss weder Pull Requests technisch prüfen noch den Teststand selbst installieren und starten.

Jeder Pull Request enthält mindestens den Bezug auf den Arbeitsauftrag und seine Abnahmekriterien, eine kurze Beschreibung der tatsächlich vorgenommenen Änderungen, das Ergebnis der ausgeführten Prüfungen sowie offene Punkte und bekannte Einschränkungen. Die QA bestätigt nur, was durch Code, Tests oder andere zugängliche Nachweise überprüfbar ist.

## Arbeitsaufträge

### Ablage im Repository

Das Repository dient `ordermgr` als Eingangs- und Ausgangswarteschlange:

| Verzeichnis | Inhalt |
|---|---|
| `work-orders/incoming/` | Aufträge mit Status `approved`, die `ordermgr` noch nicht übernommen hat; im Pull Request eines Auftrags auch der Entwurf mit `draft` |
| `work-orders/outgoing/` | von `ordermgr` zurückgegebene Akten: endgültig abgeschlossene Aufträge sowie Kopien der Akten, die auf eine Entscheidung warten |

`ordermgr` entfernt einen übernommenen Auftrag mit einem Commit aus `incoming/`. Während der Bearbeitung liegt der maßgebliche Auftrag bei `ordermgr`. Jeder Auftrag kommt zuletzt nach `outgoing/` zurück.

### Arten von Aufträgen

| Art | Inhalt | Wirkung |
|---|---|---|
| `work` | Arbeitsauftrag | `ordermgr` lässt ihn umsetzen |
| `decision` | Bezugsauftrag und Entscheidung des Auftraggebers: `accept` (Abnahme), `reject` (Ablehnung mit Liste der Abweichungen) oder `answer` (Antwort auf einen offenen Punkt) | `ordermgr` trägt die Entscheidung in die Akte des Bezugsauftrags ein und handelt danach |
| `cancel` | Bezugsauftrag | `ordermgr` storniert den Bezugsauftrag sofort |
| `status` | optional ein Bezugsauftrag, sonst alle Aufträge | `ordermgr` trägt eine Übersicht in die Akte dieses Auftrags ein |

Aufträge der Arten `decision`, `cancel` und `status` erteilt der Projektleiter direkt auf `main` ohne Pull Request. Sie gehen nach ihrer Ausführung selbst nach `outgoing/`. So bleibt nachvollziehbar, wer wann was veranlasst hat.

### Inhalt

Jeder Auftrag ist genau eine Markdown-Datei. Ihr Dateiname ist die Auftragskennung mit der Endung `.md`, zum Beispiel `WO-2026-10-08-001.md`. Die Auftragskennung hat die Form `WO-JJJJ-MM-TT-NNN`, gilt für alle Arten und bleibt vom Eingang bis zur Rückgabe gleich. Neue Arbeitsaufträge werden aus der Vorlage [`work-orders/template.md`](../../work-orders/template.md) erstellt.

Der Abschnitt „Status“ enthält die Felder:

| Feld | Inhalt | Pflicht bei |
|---|---|---|
| `id` | Auftragskennung | allen Arten |
| `type` | `work`, `decision`, `cancel` oder `status` | allen Arten |
| `status` | Status nach dem [Statusmodell](#statusmodell) | allen Arten |
| `client` | Auftraggeber, derzeit immer `Nutzer` | allen Arten |
| `workpackage` | Kennung des Arbeitspakets | `work` |
| `components` | betroffene Komponenten, siehe [Parallele Bearbeitung](#parallele-bearbeitung) | `work` |
| `ref` | Kennung des Bezugsauftrags | `decision`, `cancel`; bei `status` optional |
| `decision` | `accept`, `reject` oder `answer` | `decision` |

Ein Auftrag der Art `work` enthält außerdem Titel, Ziel, Umfang und Nicht-Umfang, nachprüfbare Abnahmekriterien, Referenzen auf alle geltenden Anforderungen, Verträge und Architekturregeln, den Abschnitt „Offene Punkte“ (ist er leer, steht dort `keine`) und den Abschnitt „Akte“. Ein Auftrag der Arten `decision`, `cancel` und `status` enthält einen Titel, den Abschnitt „Inhalt“ mit den Abweichungen, der Antwort oder dem Grund und den Abschnitt „Akte“.

Die Feldnamen und Werte sind maschinenlesbare Bezeichner und deshalb englisch.

### Akte

Der Abschnitt „Akte“ enthält die vollständige Bearbeitungsgeschichte des Auftrags in zeitlicher Reihenfolge, je Eintrag eine Zeile:

```text
JJJJ-MM-TTThh:mm:ss – <art> – <inhalt>
```

| Art | Inhalt | geschrieben von |
|---|---|---|
| `status` | `<alter Status> → <neuer Status> – Anlass` | `ordermgr` |
| `start` | Aufgabe des Laufs: `implement` (umsetzen), `rework` (korrigieren, mit der Liste der Abweichungen), `resume` (mit der Antwort fortsetzen), `merge` (nach Abnahme mergen) oder `cleanup` (Arbeitsbereiche abbauen), dazu der Inhalt | `ordermgr` |
| `decision` | Kennung des Entscheidungsauftrags, Entscheidung und Inhalt | `ordermgr` |
| `result` | `<ergebnis> – commit <hash> – pr <nummer> – <text>`; `commit` und `pr` entfallen, wenn es keine gibt | Softwarearchitekt oder `agentrun` |
| `overview` | Übersicht bei einem Auftrag der Art `status` | `ordermgr` |

Ergebnisse sind:

| Ergebnis | Bedeutung | geschrieben von |
|---|---|---|
| `ready` | Teststand bereit | Softwarearchitekt |
| `question` | Rückfrage an den Auftraggeber | Softwarearchitekt |
| `failed` | Arbeit nicht möglich; auch Startfehler, Ende der Sitzung ohne Ergebnis und fehlender Herzschlag | Softwarearchitekt oder `agentrun` |
| `merged` | Merge abgeschlossen | Softwarearchitekt |
| `stopped` | Lauf auf Stornierung beendet und Arbeitsbereiche abgebaut | `agentrun` |
| `cleaned` | Arbeitsbereiche abgebaut | `agentrun` |

Der Text eines Ergebnisses steht in ganzen Sätzen in derselben Zeile. Teaminterne Kommunikation und Prüfprotokolle gehören nicht in die Akte; sie stehen im Pull Request. Außer den Einträgen in der Akte und dem Feld `status` verändert niemand den Inhalt eines übernommenen Auftrags. Inhaltliche Änderungen erfolgen nur mit Zustimmung des Nutzers über einen neuen Auftrag.

### Statusmodell

Der Status steht im Feld `status` des Auftrags. Dieser Eintrag ist maßgeblich. Das Verzeichnis zeigt, wer gerade zuständig ist.

| Status | Bedeutung | Verzeichnis | gesetzt von |
|---|---|---|---|
| `draft` | Auftrag in Klärung | `work-orders/incoming/` nur im Pull Request des Auftrags | Projektleiter |
| `approved` | vom Nutzer freigegeben, noch nicht geprüft | `work-orders/incoming/`, nach der Übernahme `new/` | Projektleiter mit dem Merge |
| `queued` | wartet, weil eine betroffene Komponente belegt ist | `new/` | `ordermgr` |
| `inprogress` | Lauf des Softwarearchitekten | `running/`, nach dem Lauf `returned/` | `ordermgr` |
| `blocked` | wartet auf eine Entscheidung des Auftraggebers; der Grund steht unter „Offene Punkte“ | `waiting/`, bei einem unbrauchbaren Auftrag `failed/`; Kopie in `work-orders/outgoing/` | `ordermgr` |
| `acceptance` | Teststand bereit; Prüfung durch den Projektleiter und Erprobung durch den Nutzer | `waiting/`; Kopie in `work-orders/outgoing/` | `ordermgr` |
| `closed` | abgeschlossen | `done/` und `work-orders/outgoing/` | `ordermgr` |
| `cancelled` | vom Auftraggeber storniert | während des Abbaus `running/` und `returned/`, danach `done/` und `work-orders/outgoing/` | `ordermgr` |

Die Verzeichnisse ohne Pfad liegen unter `ordermgr/orders/` (siehe [ordermgr](#ordermgr)).

Zulässig sind nur diese Statuswechsel:

| von | nach | Anlass |
|---|---|---|
| `draft` | `approved` | Freigabe durch den Nutzer; Merge des Auftrags durch den Projektleiter |
| `approved` | `inprogress` | Art `work`, Auftrag brauchbar, alle betroffenen Komponenten frei; an `agentrun` übergeben |
| `approved` | `queued` | Art `work`, Auftrag brauchbar, eine betroffene Komponente belegt |
| `approved` | `blocked` | Auftrag unbrauchbar: Pflichtangabe fehlt oder ist ungültig, Kennung schon vorhanden, Bezugsauftrag fehlt oder die Entscheidung passt nicht zu seinem Status |
| `approved` | `closed` | Art `decision`, `cancel` oder `status` ausgeführt |
| `queued` | `inprogress` | alle betroffenen Komponenten frei; an `agentrun` übergeben |
| `inprogress` | `acceptance` | Ergebnis `ready` |
| `inprogress` | `blocked` | Ergebnis `question` oder `failed` |
| `inprogress` | `closed` | Ergebnis `merged` |
| `blocked` | `inprogress` | Entscheidung `answer`; an `agentrun` zur Fortsetzung übergeben |
| `blocked` | `queued` | Entscheidung `answer`, eine betroffene Komponente inzwischen belegt |
| `acceptance` | `inprogress` | Entscheidung `reject` oder `accept`; an `agentrun` zur Korrektur beziehungsweise zum Merge übergeben |
| `approved`, `queued`, `inprogress`, `blocked`, `acceptance` | `cancelled` | Auftrag der Art `cancel` |

`closed` und `cancelled` sind Endzustände. Ein unbrauchbarer Auftrag in `failed/` wird nicht fortgesetzt; der Projektleiter erteilt bei Bedarf einen neuen Auftrag mit neuer Kennung. Ein weiterer Status wird erst verwendet, nachdem er in beide Tabellen aufgenommen wurde.

Ein Auftrag mit `blocked` nach einem Lauf wird mit `answer` fortgesetzt, auch nach `failed`. Die Antwort nennt dann, was geändert wurde oder wie fortzufahren ist.

## ordermgr

`ordermgr` ist das Programm der Auftragsverwaltung. Es ist ein Shell-Skript, das dauerhaft läuft und mit `inotifywait` auf neue Dateien wartet. Es ist eigenständig: Programm, Laufzeitdateien und Daten liegen im eigenen Verzeichnis `ordermgr/` neben `repo/`, nicht im Repository und nicht in `scripts/`. Die Pfade stehen vorläufig als Variablen im Skript.

```text
ordermgr/
  bin/ordermgr
  run/ordermgr.pid
  orders/
    new/        übernommen, noch nicht übergeben (approved, queued)
    running/    an agentrun übergeben
    returned/   von agentrun zurück
    waiting/    wartet auf Entscheidung (blocked, acceptance)
    done/       closed, cancelled
    failed/     unbrauchbar (blocked)
```

Zuständig für die Dateien in `running/` sind `agentrun` und der Softwarearchitekt, für alle anderen Verzeichnisse `ordermgr`. `ordermgr` verändert keine Datei in `running/`.

### Überwachung

`ordermgr` wartet mit `inotifywait` auf neue Dateien in `repo/work-orders/incoming/` und in `orders/returned/`. Beim Start und nach jeder Handlung bewertet es den gesamten Stand neu, sodass ein Neustart jederzeit möglich ist und nichts doppelt ausgeführt wird. Es hält keinen Stand außerhalb der Dateien. Sein Arbeitsverzeichnis liegt nicht in `repo/`, weil `sync-repo` sonst ablehnt.

Ein Cron-Job prüft regelmäßig, ob der Prozess aus `run/ordermgr.pid` läuft, und startet `ordermgr` sonst neu. Eine Instanz startet nicht, wenn bereits eine läuft.

### Handlungen

In dieser Reihenfolge, innerhalb jeder Stufe in aufsteigender Reihenfolge der Auftragskennung:

1. **Rückkehr aus `returned/`:** Ergebnis aus der Akte übernehmen: `ready` nach `acceptance`, `question` und `failed` nach `blocked` mit dem Text als offenem Punkt, `merged` nach `closed`; nach `stopped` und `cleaned` bleibt `cancelled`. Danach Auftrag nach `waiting/` beziehungsweise `done/` verschieben und an das Repository zurückgeben.
2. **Eingang aus `incoming/`:** Auftrag nach `new/` kopieren und mit einem Commit aus `incoming/` entfernen. Danach je nach Art:
   - `work`: Pflichtangaben prüfen. Unbrauchbar nach `blocked` in `failed/`, sonst weiter mit Stufe 3.
   - `decision`: Entscheidung in die Akte des Bezugsauftrags in `waiting/` eintragen. `answer` bei `blocked` übergibt mit `resume`, `reject` bei `acceptance` mit `rework`, `accept` bei `acceptance` mit `merge`; bei belegter Komponente wird der Bezugsauftrag `queued` und nach `new/` verschoben.
   - `cancel`: Bezugsauftrag in `new/` sofort `cancelled` und nach `done/`; in `waiting/` `cancelled` und mit `cleanup` nach `running/`; in `running/` Stornierung bei `agentrun` anfordern (siehe [agentrun](#agentrun)) und `cancelled` beim Rückkehren setzen.
   - `status`: Übersicht mit Kennung, Titel, Status, Verzeichnis und letztem Akteneintrag des Bezugsauftrags oder aller Aufträge in die Akte eintragen.
   Ausgeführte Aufträge der Arten `decision`, `cancel` und `status` werden `closed`, unbrauchbare `blocked`; beide gehen an das Repository zurück.
3. **Übergabe aus `new/`:** Sind alle betroffenen Komponenten frei, `start` mit der Aufgabe in die Akte eintragen, `inprogress` setzen und nach `running/` verschieben, sonst `queued`.

Eine Komponente ist belegt, solange ein anderer Auftrag, der sie nennt, in `running/`, `returned/` oder `waiting/` liegt.

### Rückgabe an das Repository

Liegt ein Auftrag danach in `waiting/`, `done/` oder `failed/`, schreibt `ordermgr` seine aktuelle Fassung mit einem Commit nach `work-orders/outgoing/<auftragskennung>.md` und überschreibt dabei eine frühere Kopie. Die Commits erzeugt `ordermgr` direkt auf `main` ohne lokalen Arbeitsbereich, zum Beispiel über die Git-Data-API von GitHub, mit der Nachricht `work-orders: <auftragskennung> <alter Status> -> <neuer Status>`. Schlägt ein Commit fehl, wiederholt `ordermgr` ihn bei der nächsten Bewertung; der Auftrag bei `ordermgr` bleibt maßgeblich.

## agentrun

`agentrun` führt die Läufe des Softwarearchitekten aus. Es ist ein Shell-Skript in `scripts/`, das wie `ordermgr` dauerhaft läuft und mit `inotifywait` das Verzeichnis `ordermgr/orders/running/` überwacht. Es setzt keinen Status und trifft keine Entscheidungen. Seine PID-Datei `run/agentrun.pid` wird wie bei `ordermgr` von einem Cron-Job geprüft.

### Lauf

Für jeden Auftrag in `running/` liest `agentrun` den letzten Eintrag `start`:

- `implement`, `rework`, `resume`, `merge`: Fehlt `work/<auftragskennung>/coordinate`, legt `agentrun` es mit `pipwerk-dev prepare --order <auftragskennung> coordinate --base <aktueller Commit von origin/main>` an. Dann startet es die Sitzung des Softwarearchitekten in einer tmux-Sitzung, deren Name die Auftragskennung ist, mit `claude --agent software-architect`, Arbeitsverzeichnis `coordinate`, `PIPWERK_DEV_ROOT` und `PIPWERK_ORDER_ID` als Umgebungsvariablen und dem absoluten Pfad der Auftragsdatei im Startauftrag.
- `cleanup`: Arbeitsbereiche mit `pipwerk-dev remove --order <auftragskennung>` abbauen, Ergebnis `cleaned` eintragen.

Der Lauf endet, wenn einer dieser Fälle eintritt:

| Fall | Handlung |
|---|---|
| Ergebnis des Softwarearchitekten nach dem letzten `start` in der Akte | Sitzung beenden; bei `merged` Arbeitsbereiche abbauen |
| Sitzung ließ sich nicht starten | Ergebnis `failed` mit dem Startfehler eintragen |
| Sitzung besteht nicht mehr, kein Ergebnis | Ergebnis `failed` – Sitzung ohne Ergebnis beendet |
| 15 Minuten kein Herzschlag | Sitzung beenden, Ergebnis `failed` – kein Herzschlag seit 15 Minuten |
| Stornierung angefordert | Sitzung beenden, Arbeitsbereiche abbauen, Ergebnis `stopped` |

Danach verschiebt `agentrun` den Auftrag nach `returned/`. Lehnt `pipwerk-dev remove` den Abbau ab, nennt `agentrun` den Grund im Text des Ergebnisses. Eine Stornierung fordert `ordermgr` mit einer leeren Datei `running/<auftragskennung>.stop` an; `agentrun` entfernt sie nach der Rückgabe.

Eine interaktive Claude-Code-Sitzung beendet sich nicht von selbst. `agentrun` beendet sie mit `tmux kill-session -t <auftragskennung>`. Beim Start bewertet `agentrun` alle Aufträge in `running/` neu: Besteht ihre Sitzung, überwacht es sie weiter.

### Herzschlag

Ein Hook von Claude Code für die Ereignisse `PreToolUse` und `PostToolUse` ruft bei jedem Werkzeugaufruf das Skript `scripts/heartbeat` auf. Es liest das Arbeitsverzeichnis aus den Hook-Daten. Liegt es unter `work/<auftragskennung>/`, aktualisiert es den Zeitstempel von `run/<auftragskennung>.heartbeat`; sonst tut es nichts. Es gibt nichts aus und endet immer mit Exitcode 0, damit es Claude Code nicht beeinflusst. Weil Softwarearchitekt, Entwickler und QA unter `work/<auftragskennung>/` arbeiten, zählt die Tätigkeit aller drei.

Gemessen wird ab dem späteren Zeitpunkt von Start des Laufs und letztem Herzschlag. Ein einzelner Bash-Aufruf läuft in Claude Code höchstens 10 Minuten; 15 Minuten ohne Werkzeugaufruf bedeuten, dass keine Sitzung des Auftrags mehr arbeitet. Das gilt auch, wenn eine Sitzung auf eine Freigabe, eine Eingabe oder das Ende einer Pause wegen der Nutzungsgrenze wartet. Der Projektleiter setzt den Auftrag dann mit `answer` fort.

Der Hook steht in den Benutzereinstellungen von Claude Code auf dem Entwicklungsrechner, nicht in `.claude/settings.json` des Repositorys, weil er einen Pfad des Rechners enthält.

## Runner

Ein GitHub-Actions-Workflow auf einem selbst betriebenen Runner auf dem Entwicklungsrechner hält `repo/` aktuell. Er startet bei jedem Push auf `main` und kann auf GitHub zusätzlich von Hand gestartet werden. Er führt `pipwerk-dev sync-repo` aus. Weitere Aufgaben hat er nicht.

Der Runner läuft als systemd-Dienst unter dem Benutzer, dem die Arbeitsbereiche gehören. `PIPWERK_DEV_ROOT` steht in der Umgebungsdatei des Runners. Der Workflow hat keine Auslöser für Pull Requests. Das allein genügt nicht, weil ein Pull Request aus einer fremden Kopie des Repositorys eigene Workflow-Dateien mitbringen kann. Deshalb verlangt das Repository für Workflows aus Pull Requests aller externen Beitragenden eine Freigabe durch den Nutzer (siehe [Einrichtung auf dem Entwicklungsrechner](#einrichtung-auf-dem-entwicklungsrechner)). Ein solcher Workflow wird nicht freigegeben. Schlägt `sync-repo` fehl, ist das im Lauf auf GitHub sichtbar; der nächste Push holt die Aktualisierung nach.

## Parallele Bearbeitung

Mehrere Aufträge werden gleichzeitig bearbeitet, wenn sie keine gemeinsame Komponente betreffen. Als je eigene Komponente gelten jede Hauptkomponente unter `components/`, jedes Paket unter `packages/`, `contracts/` sowie übergreifende Dokumente und Regeln außerhalb einer Komponente unter dem Namen `common`.

Die Einschränkung ist keine technische Notwendigkeit von Git. Sie vermeidet Konflikte beim Zusammenführen und damit erneute QA-Läufe. Wird ein paralleler Auftrag zuerst gemergt, bringt der andere seinen Branch auf den neuen Stand von `main`; danach ist eine erneute QA erforderlich.

Jeder Auftrag erhält eigene Arbeitsbereiche, jede Komponente einen eigenen Teststand, und jedes Agententeam läuft in einer eigenen tmux-Sitzung (siehe [Arbeitsbereiche](#arbeitsbereiche)).

## Arbeitsbereiche

Unter dem Pipwerk-Entwicklungsverzeichnis `$PIPWERK_DEV_ROOT` liegen:

| Verzeichnis | Inhalt | verändert von |
|---|---|---|
| `repo/` | Klon des Repositorys auf dem Stand von `origin/main`; Träger der gemeinsamen Git-Daten | nur `pipwerk-dev sync-repo` |
| `work/<auftragskennung>/coordinate/` | Worktree des Softwarearchitekten, Commit von `origin/main` beim ersten Lauf, ohne Branch; Arbeitsverzeichnis seiner Sitzungen für diesen Auftrag | `agentrun` über `pipwerk-dev` |
| `work/<auftragskennung>/implement/` | Worktree des Entwicklers mit dem Arbeitsbranch | Entwickler |
| `work/<auftragskennung>/review/` | Worktree der QA mit dem lokalen Prüfbranch | QA |
| `test/<komponente>/` | Teststand der Komponente, ohne Branch auf einem freigegebenen Commit | nur `pipwerk-dev` |
| `scripts/` | `pipwerk-dev`, `agentrun` und `heartbeat` mit ihrer lokalen Dokumentation, nicht Teil des Repositorys | nicht durch das Team |
| `run/` | `agentrun.pid` und je Auftrag `<auftragskennung>.heartbeat` | `agentrun`, `heartbeat` |
| `ordermgr/` | Programm, Laufzeitdateien und Aufträge der Auftragsverwaltung, siehe [ordermgr](#ordermgr) | `ordermgr`; `running/` auch `agentrun` und Softwarearchitekt |

Kein Agent arbeitet in `repo/`. Entwickler und QA finden ihren Arbeitsbereich über `$PIPWERK_DEV_ROOT` und die Auftragskennung in `$PIPWERK_ORDER_ID`. Die Agentendefinitionen enthalten keine Pfade des Rechners.

Jeder Worktree enthält alle Dateien des Repositorys, also auch `.claude/`. Wirksam sind nur die Agentendefinitionen im Arbeitsverzeichnis der Sitzung des Softwarearchitekten, also in `coordinate/`. Sie entsprechen damit dem Stand von `main` beim ersten Lauf des Auftrags und bleiben für alle seine Sitzungen gleich.

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
pipwerk-dev migrate
```

Für `repo/` gibt es nur `sync-repo`. `--base` ist bei `prepare` Pflicht. Jedes Kommando nimmt die Option `--json` an und gibt dann genau ein JSON-Objekt aus. Das ist für Agenten und andere Programme gedacht. Die Kennung `order-management` ist in `pipwerk-dev` noch reserviert; sie wird nicht mehr verwendet.

### Referenz-Repository aktualisieren: sync-repo

`sync-repo` holt den Stand von GitHub und spult den Branch `main` in `repo/` per Fast-Forward auf `origin/main` vor. Es verwirft und überschreibt nie etwas. Es bricht mit Exitcode 3 ohne Änderung ab, wenn `repo/` nicht auf `main` steht, lokale Änderungen oder eine unterbrochene Git-Operation hat, `main` eigene Commits hat, die nicht auf `origin/main` liegen, oder ein anderer Prozess in `repo/` arbeitet. Steht `repo/` schon auf `origin/main`, meldet es Erfolg, ohne etwas zu tun.

### Arbeitsbereiche einrichten: prepare

`prepare` legt einen Worktree unter `work/<auftragskennung>/` an. `coordinate` wird ohne Branch auf den genannten Commit gesetzt; besteht es bereits auf einem anderen Commit, lehnt `prepare` ab. `implement` und `review` erhalten einen neuen Branch auf dem genannten Commit; für `order-management` sind sie ein falscher Aufruf. Die von `prepare` angelegten Branches merkt sich `pipwerk-dev` in `orders/<auftragskennung>.json` im Zustandsverzeichnis.

`prepare` bricht ohne Änderung ab, wenn der Arbeitsbereich lokale Änderungen hat, dort ein von `pipwerk-dev` gestarteter Prozess läuft, der Branch schon lokal oder auf GitHub existiert, der Arbeitsbereich auf `main` steht oder fremde Daten enthält oder der Wechsel ignorierte Dateien überschreiben würde. Steht der Arbeitsbereich schon genau auf diesem Branch und Stand, meldet es Erfolg, ohne etwas zu tun.

### Arbeitsbereiche nachziehen: update

`update` bringt `implement` oder `review` eines Auftrags per Fast-Forward des ausgecheckten Branches auf den angegebenen Git-Stand. Ist das nicht möglich, bricht es ab. Lokale Änderungen, auch neue nicht versionierte Dateien, führen immer zum Abbruch.

### Arbeitsbereiche abbauen: remove

`remove` entfernt die Worktrees eines Auftrags sowie die ausgecheckten und die von `prepare` angelegten Branches. Es bricht ohne Änderung ab, wenn ein Worktree lokale Änderungen hat, ein Branch oder `coordinate` Commits enthält, die nicht auf `origin` liegen, in `work/<auftragskennung>/` irgendein Prozess läuft, dort fremde Einträge liegen oder ein Branch des Auftrags anderswo ausgecheckt ist.

### Umstellung: migrate

`migrate` entfernt die früheren festen Arbeitsbereiche `implement/`, `review/` und `test/`. Es bricht ab, wenn einer davon lokale Änderungen, nicht übertragene Commits, laufende Prozesse oder fremde Daten enthält, und nennt sie. Ignorierte Dateien in diesen Bereichen werden mit entfernt, die Testdatenbank im Zustandsverzeichnis bleibt erhalten. Die lokalen Branches der früheren Bereiche bleiben bestehen. `start` lehnt ab, solange die Umstellung nicht ausgeführt ist.

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

`status` zeigt `repo/` nicht an. Es zeigt für jeden Auftragsarbeitsbereich den Commit, den Branch oder „detached HEAD“, die Zahl lokaler Änderungen und laufende Prozesse, für jeden Teststand den laufenden Commit, die Prozesse und das Ergebnis der Erreichbarkeitsprüfungen. Mit `--order` beschränkt es sich auf einen Auftrag. `status` verändert nichts, auch nicht den Git-Index.

### Protokolle

Im lokalen Zustandsverzeichnis führt `pipwerk-dev` ein Protokoll mit einer Zeile je zustandsänderndem Aufruf, die vollständige Ausgabe jeder Prüfung und Einrichtung, die Liste der gestarteten Prozesse und die Ausgabe der Teststände. Zugangsdaten in Adressen, GitHub-Token und Werte nach Angaben wie `token=`, `password=` oder `Authorization:` ersetzt `pipwerk-dev` vor der Ausgabe und vor dem Schreiben in Protokolle durch `***`.

### Sperren, Fehler und Exitcodes

`pipwerk-dev` bricht lieber ab, als einen unklaren Zustand zu verändern. Jede Ablehnung nennt den Grund. Die Exitcodes sind: 0 Erfolg, 1 fehlgeschlagen, 2 falscher Aufruf, 3 verweigert. Ein Aufruf sperrt nur den betroffenen Auftragsarbeitsbereich, Teststand oder bei `sync-repo` nur `repo/`. Ist dieser Bereich gesperrt, endet der Aufruf sofort mit Exitcode 3. Operationen auf den gemeinsamen Git-Daten wie `git fetch` und das Anlegen oder Entfernen von Worktrees werden gemeinsam gesperrt; auf diese Sperre wartet ein Aufruf bis zu 120 Sekunden, einstellbar mit `PIPWERK_DEV_GIT_LOCK_TIMEOUT`, und endet erst dann mit Exitcode 3.

### Erweiterbarkeit

Prüfschritte, Startbefehle, Erreichbarkeitsprüfungen und Ports sind je Komponente beschrieben. Eine weitere Komponente wird ergänzt, ohne die Logik für Arbeitsbereiche, Sperren und Prozessverwaltung zu ändern; ihre Ports werden bei der Aufnahme festgelegt.

## Einrichtung auf dem Entwicklungsrechner

Die folgenden Schritte richten den Prozess auf dem Entwicklungsrechner ein. Sie werden vom Nutzer ausgeführt und lokal dokumentiert.

1. `pipwerk-dev` in der Fassung dieses Dokuments installieren und einmal `pipwerk-dev migrate` ausführen.
2. Den Runner als systemd-Dienst unter dem Benutzer betreiben, dem die Arbeitsbereiche gehören, mit `PIPWERK_DEV_ROOT` in seiner Umgebungsdatei.
3. Für diesen Benutzer `gh` mit Schreibrecht auf das Repository anmelden und Claude Code mit dem Claude-Abo anmelden. Claude Code einmal interaktiv in `repo/` starten und die Vertrauensabfrage für den Ordner bestätigen. Danach diese Sitzung beenden und `repo/` verlassen. Laut Claude-Code-Dokumentation gilt dieses Vertrauen auch für die Worktrees unter `work/`, weil sie zum selben Repository gehören; eine unbestätigte Abfrage würde eine unbediente Sitzung anhalten.
4. Im Repository auf GitHub unter Settings → Actions → General für Workflows aus Pull Requests die Freigabe für alle externen Beitragenden verlangen.
5. In den Benutzereinstellungen von Claude Code (`~/.claude/settings.json`) die rechnerspezifischen Einträge vornehmen: den Aufruf von `pipwerk-dev` mit seinem absoluten Pfad freigeben, Schreibrechte für Dateien unterhalb des Entwicklungsverzeichnisses freigeben und den Hook für `heartbeat` eintragen (siehe [Herzschlag](#herzschlag)). Die allgemeinen Freigaben stehen in `.claude/settings.json` im Repository. Eine nicht freigegebene Aktion hält eine unbediente Sitzung an.
6. `inotify-tools` installieren, `ordermgr` nach `ordermgr/bin/` und `agentrun` und `heartbeat` nach `scripts/` installieren und die Cron-Jobs für die Prüfung beider PID-Dateien einrichten. Beide Programme werden aus einem Verzeichnis außerhalb von `repo/` gestartet. Solange irgendein Prozess, auch eine Shell, ein tmux-Server oder eine Claude-Code-Sitzung, sein Arbeitsverzeichnis in `repo/` hat, lehnt `sync-repo` die Aktualisierung mit Exitcode 3 ab.

Vor der Freigabe des Prozesses ist ein vollständiger Durchlauf nachzuweisen: Auftrag, Implementierung, unabhängige QA, Korrektur und erneute QA, Rückfrage, commitgebundene Testbereitstellung, Prüfung durch den Projektleiter, Abnahme und kontrollierter Abschluss sowie eine Stornierung. Der Nachweis verwendet einen kleinen echten Code-Auftrag an Pipwerk Studio. Er weist zugleich nach, dass die Teamfunktion in einer tmux-Sitzung zuverlässig läuft, dass der Herzschlag aus den Sitzungen von Softwarearchitekt, Entwickler und QA ankommt, dass in den Worktrees keine Vertrauensabfrage erscheint und dass alle vorgesehenen Befehle freigegeben sind.

## Einführung von ordermgr und agentrun

`ordermgr`, `agentrun` und `heartbeat` werden nicht vom Agententeam entwickelt, weil das Team erst mit ihnen arbeitsfähig ist. Sie entstehen wie `pipwerk-dev` in einer eigenen Claude-Code-Sitzung auf dem Entwicklungsrechner auf Grundlage dieses Dokuments; ihre lokale Dokumentation liegt bei den Programmen. Zum Einführungspaket gehören außerdem:

1. die Rollendefinition des Softwarearchitekten und die Skills `pipwerk-test-deployment`, `pipwerk-close-work-order` und `pipwerk-escalation`: Auftrag über den übergebenen Pfad lesen, Ergebnis als Eintrag `result` in die Akte schreiben, keine Ergebnisdatei und kein `transfer/`;
2. die Entfernung der Rollendefinition `order-management`, von `tools/order-management/` und der nur dafür eingetragenen Freigaben in `.claude/settings.json`;
3. `work-orders/` mit `incoming/`, `outgoing/` und der neuen Vorlage; die bisherigen Aufträge werden nach `outgoing/` verschoben und nach ihrer Kennung benannt;
4. die Übernahme des offenen Auftrags WO-2026-10-08-001 in `ordermgr`.

Bis zur Einführung beschreibt dieses Dokument den Zielstand; die Rollendefinitionen im Repository entsprechen noch dem vorherigen Verfahren.

## Weitere Qualitätswerkzeuge

Die verbindlichen Prüfwerkzeuge und Qualitätsregeln stehen in den [Entwicklungs-, Test- und Sicherheitsregeln](development-test-security-rules.md) und gelten unverändert.

Spec Kit ist erst nach einem nachgewiesenen Durchlauf als zusätzliche Qualitätsschicht für Spezifikation, Klärung, Planung und prüfbare Arbeitsaufträge vorgesehen. Es ersetzt weder die maßgebliche Dokumentation noch die Rollen und die unabhängige QA. Weitere Werkzeuge, insbesondere Vertrags-, Sicherheits-, Architektur-, Property-based- oder Mutationstests, werden anschließend bedarfsgerecht bewertet. Ein Werkzeug gilt erst dann als Qualitätsgewinn, wenn Aufgabe, Prüfkriterium und Wirkung nachgewiesen sind.

Zugangsdaten und API-Schlüssel gehören nicht ins Repository. Claude Code wird über ein Claude-Abo mit festem Monatspreis betrieben, nicht verbrauchsabhängig. Eine Kostenbegrenzung je Lauf ist deshalb nicht vorgesehen; das Erreichen der Nutzungsgrenze unterbricht die Arbeit nur. Die Modellzuordnung der Rollen ist änderbare Laufzeitkonfiguration. Anbieterunabhängigkeit beziehungsweise der Einsatz mehrerer Sprachmodell-Anbieter ist derzeit keine Anforderung an den Entwicklungsprozess.

## Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-09 | Auftragsverwaltung als Skript `ordermgr` statt Claude-Code-Sitzung; Läufe des Softwarearchitekten mit `agentrun` und Herzschlag statt Höchstdauer; Repository als Eingangs- und Ausgangswarteschlange; Auftrag als Akte in einer Datei; Auftragsarten `decision`, `cancel` und `status`; Planungsebenen mit Arbeitspaketen und Arbeitspaketliste; Benachrichtigung des Nutzers, Ergebnisdatei und `transfer/` entfallen. |
| 2026-10-08 | `start.sh` startet tmux aus `$PIPWERK_DEV_ROOT`, damit der tmux-Server `sync-repo` nicht blockiert. |
| 2026-10-08 | Einrichtung: Start der Auftragsverwaltung und Vertrauensabfrage so beschrieben, dass kein Prozess in `repo/` verbleibt. |
| 2026-10-08 | Höchstdauer einer Architektensitzung (Anfangswert 3 Stunden) mit Übergang nach `blocked` ohne Beenden der Sitzung und Übernahme eines späteren Ergebnisses festgelegt. |
| 2026-10-08 | Einrichtung: `PIPWERK_DEV_ROOT` in der Anmeldeumgebung als Voraussetzung für `start.sh` ergänzt. |
| 2026-10-08 | Beschreibung von `pipwerk-dev` an die umgesetzte Fassung angeglichen: Befehl `migrate`, Pflichtangabe `--base`, strengere Abbruchbedingungen von `remove`, Wartezeit auf die Sperre der gemeinsamen Git-Daten. |
| 2026-10-08 | Festgelegt: Merge mit Merge-Commit, `coordinate/` auf dem Stand des ersten Anstoßes, Zeitpunkte auf die Sekunde, Reihenfolge und Belegung in der Auftragsverwaltung, Nachholen des Aufräumens, Freigabepflicht für Workflows aus fremden Pull Requests, Vertrauensabfrage über `repo/`. |
| 2026-10-08 | Prozess mit Auftragsverwaltung, Runner und paralleler Bearbeitung eingeführt: Übergangsregel und feste Arbeitsbereiche entfernt, `pipwerk-dev` mit Arbeitsbereichen je Auftrag und Teststand je Komponente beschrieben, Einrichtung auf dem Entwicklungsrechner und Arbeitskopie der Auftragsverwaltung ergänzt. |
| 2026-10-08 | Betrieb der Auftragsverwaltung als dauerhafte Sitzung mit `/loop` über `initialPrompt` festgelegt; tmux-Sitzungsname gleich Auftragskennung; Übernahme des Ergebnisses unabhängig vom Sitzungsende und Beenden der Sitzung durch die Auftragsverwaltung; Freigaben präzisiert. |
| 2026-10-08 | Zum maßgeblichen Prozessdokument ausgebaut: Prozessinhalte aus Entwicklungsplan übernommen, Dokumentationsorte, Beteiligte, vollständiges Statusmodell mit zulässigen Übergängen, Pflichtfelder und Abschnitte eines Auftrags, Auftragsverwaltung, Ergebnisdatei, Runner, Benachrichtigung, parallele Bearbeitung, Arbeitsbereiche nach der Einführung, Erweiterung von `pipwerk-dev` und Einführung festgelegt; Übergangsregel bis zur Einführung ergänzt. |
| 2026-10-08 | Auftragsablage nach `work-orders/` auf oberster Ebene verlegt. |
| 2026-10-07 | Auftragsablage mit Statusfeld und Statusverzeichnissen, Statuswechsel als Verwaltungsarbeit auf `main` und geplanten Anstoß über GitHub Actions festgelegt. |
| 2026-10-07 | Verworfene Auftrags- und Sitzungsautomatisierung entfernt; transportunabhängige Prozessregeln und die eigenständige Schnittstelle des lokalen Hilfswerkzeugs erhalten. Frühere Fassungen sind in Git nachvollziehbar. |
