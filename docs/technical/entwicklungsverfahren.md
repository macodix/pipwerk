# Das Pipwerk-Entwicklungsverfahren

## Status

- status: `draft`
- stand: 2026-10-12
- bereich: Entwicklungsprozess (keine Produktkomponente)
- abgestimmt: [Präsentation Entwicklungsprozess](praesentation-entwicklungsprozess.html), bestätigt vom Auftraggeber im Chat am 12. Oktober 2026

## Geltungsbereich und Dokumentationsorte

Dieses Dokument ist die maßgebliche Beschreibung des Entwicklungsprozesses von Pipwerk: Phasen, Übergabedokumente und ihre Ablage, Schleifen und Eskalation sowie die technische Ausführung auf dem Entwicklungsrechner. Rollen, Verhaltensregeln und Briefings stehen in [Agentenrollen und Briefings](agentenrollen-und-briefings.md). Die technischen Qualitätsanforderungen an Code und Tests stehen in den [Entwicklungs-, Test- und Sicherheitsregeln](development-test-security-rules.md).

Für die Dokumentation gilt: Jede Festlegung steht an genau einer Stelle im Repository. Eine README-Datei dient nur der Orientierung in ihrem Verzeichnis. Sie beschreibt, wozu das Verzeichnis da ist, und verweist auf das zuständige Dokument, enthält aber selbst keine Festlegungen.

Maßgeblich sind das aktuelle Repository und die Übergabedokumente. Chats, Agentenausgaben und Nachrichten zwischen Sitzungen ersetzen keine Repository-Dokumentation.

Eine Aussage wird nicht allein dadurch zu einer Festlegung des Auftraggebers, dass sie in einem Repository-Dokument steht. Inhalte eines mit `draft` gekennzeichneten Dokuments sind Arbeitsstand. Eine veraltete oder widersprüchliche Stelle, die sich anhand bereits getroffener Festlegungen eindeutig korrigieren lässt, wird korrigiert und nicht als neue Frage an den Auftraggeber gegeben.

## Rollen und Kommunikationsweg

```text
Auftraggeber ⇄ Projektleiter ⇄ Softwarearchitekt ⇄ Team (Entwickler, Tester, QA)
```

Jede Rolle spricht nur mit ihren Nachbarn in dieser Kette. Das Team hat keinen direkten Kontakt zum Auftraggeber. Aufgaben und Briefings der Rollen stehen in [Agentenrollen und Briefings](agentenrollen-und-briefings.md).

## Entscheidungsrechte

Der Auftraggeber entscheidet den Inhalt von:

- Anforderungsdokumenten: Arbeitsabläufe und Bedienablauf
- Fachmodell: Handelsobjekte, ihre Eigenschaften und Regeln
- Strategiebeschreibungen

Alles andere entscheiden Softwarearchitekt und Team in ihrer Zuständigkeit. Braucht die Umsetzung eine Aussage, die in eines dieser Dokumente gehört und dort fehlt, wird sie nicht selbst getroffen. Sie geht als Frage an den Auftraggeber.

Bestätigungen des Auftraggebers erfolgen formlos im Chat. Der Projektleiter vermerkt sie mit Datum in der jeweiligen Präsentation. Der Begriff „Fachlichkeit“ wird nicht verwendet.

## Begriffe

| Begriff | Bedeutung |
|---|---|
| Vorhaben | Ein Entwicklungsvorhaben mit eigener Spezifikation und eigenem Arbeitspaketplan, zum Beispiel ein Schritt der Produktplanung. |
| Arbeitspaket | Teil eines Vorhabens, der mit einem Ergebnis endet, das der Auftraggeber selbst prüfen und abnehmen kann. |
| Auftrag | Umsetzbare Einheit eines Arbeitspakets für genau einen Entwickler. |
| Übergabedokument | Dokument, mit dem eine Rolle ihr Ergebnis an die nächste übergibt. Es ist so vollständig, dass die empfangende Rolle ohne Rückgriff auf Gespräche arbeiten kann. |
| Meldung | Kurze Datei, die eine Aufgabe und den Pfad des zugehörigen Übergabedokuments nennt und damit die Arbeit der empfangenden Rolle anstößt. |
| Durchlauf | Eine Runde einer Prüfschleife: Prüfung, Bericht und Korrektur. |

## Phasen

| Phase | Ergebnis |
|---|---|
| 1 Anforderung | fortgeschriebenes Anforderungsdokument und abgestimmte Präsentation |
| 2 Konzeption | technische Spezifikation, bei Bedarf Prototypen |
| 3 Planung | Arbeitspaketplan |
| 4 Umsetzung | je Arbeitspaket: Aufträge, Code, Tests, QA |
| 5 Abnahme | Erprobung durch den Auftraggeber |
| 6 Integration | Übernahme in den Hauptstand |

Rückwege:

- Fehlende oder geänderte Anforderung aus jeder Phase: zurück in Phase 1.
- Lücke in der Spezifikation: zurück in Phase 2.
- Mangel in der Abnahme: zurück in Phase 4.
- Änderung am Plan: wieder durch Phase 3.

Ein Arbeitspaket beginnt, sobald alle Pakete, von denen es laut Plan abhängt, abgenommen und übernommen sind. Pakete ohne offene Abhängigkeit beginnen sofort und parallel.

### Phase 1 – Anforderung

- Rollen: Auftraggeber, Projektleiter
- Eingabe: Vorhaben des Auftraggebers, Rückmeldungen aus allen späteren Phasen
- Tätigkeit: Der Auftraggeber beschreibt Arbeitsabläufe, Handelsobjekte und Regeln. Der Projektleiter fragt nach, schreibt das Anforderungsdokument fort und erstellt eine Präsentation der wichtigsten Aussagen. Beide stimmen die Präsentation ab. Der Projektleiter legt für ein neues Vorhaben dessen Verzeichnis mit `scope.md` an und führt dort die geltenden Anforderungsdokumente.
- Ergebnis: fortgeschriebenes Anforderungsdokument und abgestimmte Präsentation, beide im Repository, Bestätigung in der Präsentation vermerkt
- Rückkopplung: Das Anforderungsdokument ist ein lebendes Dokument. Jede fehlende oder geänderte Anforderung aus späteren Phasen kommt hierher zurück.

### Phase 2 – Konzeption

- Rollen: Softwarearchitekt, Entwickler, QA, Projektleiter, Auftraggeber
- Eingabe: Anforderungsdokumente laut `scope.md`
- Tätigkeit:
  1. Die QA prüft jedes Anforderungsdokument laut `scope.md` und seine Widerspruchsfreiheit zum Anforderungsdokument des Gesamtsystems. Sie sucht Widersprüche, Lücken, mehrdeutige Begriffe, nicht gekennzeichnete offene Fragen und Umsetzungsdetails.
  2. Der Prüfbericht geht über den Softwarearchitekten an den Projektleiter. Was nur der Auftraggeber entscheiden kann, geht in Phase 1. Den Rest korrigiert der Projektleiter ohne den Auftraggeber.
  3. Der Softwarearchitekt erstellt die technische Spezifikation. Ist unklar, ob oder wie etwas umsetzbar ist, beauftragt er Entwickler mit Probeumsetzungen und vorzeigbaren Prototypen.
  4. Die QA prüft die Spezifikation gegen die Anforderungen.
  5. Der Projektleiter macht aus Spezifikation und Prototypen eine Präsentation und stimmt sie mit dem Auftraggeber ab.
- Ergebnis: Prüfbericht der QA zu den Anforderungsdokumenten, technische Spezifikation, bei Bedarf Prototypen, Prüfbericht der QA zur Spezifikation, abgestimmte Präsentation mit Vermerk der Bestätigung
- Schleifen: QA und Softwarearchitekt höchstens drei Durchläufe, dann Eskalation. Einwände des Auftraggebers führen zu einem neuen Durchlauf, bis alle einig sind. Fehlende Anforderungen gehen in Phase 1.

### Phase 3 – Planung

- Rollen: Softwarearchitekt erstellt den Plan, QA prüft ihn, Projektleiter präsentiert, Auftraggeber bestätigt
- Eingabe: abgestimmte technische Spezifikation, Anforderungsdokumente
- Tätigkeit: Der Softwarearchitekt teilt die Spezifikation in Arbeitspakete. Die QA prüft, ob jede Anforderung durch die Spezifikation und jeder Teil der Spezifikation durch ein Arbeitspaket abgedeckt ist, und schreibt einen Prüfbericht. Ein Plan mit positivem Prüfbericht geht an den Projektleiter, der ihn präsentiert und abstimmt.
- Ergebnis: Arbeitspaketplan, positiver Prüfbericht, abgestimmte Präsentation mit Vermerk der Bestätigung, alles im Repository
- Schleifen: Befunde mit konkreten Fragen und Kritikpunkten zurück an den Softwarearchitekten, höchstens drei Durchläufe, dann Eskalation. Die Abstimmung mit dem Auftraggeber endet mit seiner Bestätigung.

Ein Arbeitspaket enthält Ziel, Umfang, Nicht-Umfang, die umgesetzten Teile der Spezifikation, Abhängigkeiten und Abnahmekriterien. Der Plan führt je Paket den Stand `open` oder `done`.

### Phase 4 – Umsetzung eines Arbeitspakets

| Rolle | Eingabe | Ergebnis |
|---|---|---|
| Softwarearchitekt | Arbeitspaket, Spezifikation | Aufträge mit Ziel, Umfang, technischen Abnahmekriterien und zuständigem Entwickler. Nach bestandenen Tests: Aufträge im Arbeitszweig des Pakets zusammengeführt, Testumgebung bereitgestellt. |
| Entwickler | ein Auftrag | Code, Unit-Tests (Tests einzelner Funktionen), technische Dokumentation und vorerst die Anwenderdokumentation, im eigenen Zweig mit benanntem Commit |
| Tester | Auftrag, Commit des Entwicklers, Regeln seines Prüfgebiets | Testbericht zu genau diesem Commit |
| QA | Arbeitspaket, Anforderungsdokumente, laufende Testumgebung, Anwenderdokumentation | Prüfbericht aus Kundensicht: Anforderungen erfüllt, Software aus Kundensicht funktionsfähig, Anwenderdokumentation verständlich und vollständig |

Prüfgebiete der Tester:

- Funktionstest: erwartetes Verhalten, Grenzfälle und Grenzwerte, automatische Tests und ihre Auswertung
- Code- und Dokumentationsprüfung: Programmierregeln, bewährte Verfahren, technische Dokumentation
- Sicherheitsprüfung: Sicherheitsregeln nach BSI-Grundschutz und OWASP

Die QA prüft erst, wenn alle Aufträge des Pakets zusammengeführt sind und die Testumgebung läuft. Ändert sich danach der Code, ist eine erneute Prüfung durch Tester und QA erforderlich.

Ergebnis der Phase: umgesetztes Arbeitspaket auf einem benannten Commit des Arbeitszweigs, positive Testberichte, positiver Prüfbericht der QA, laufende Testumgebung.

### Phase 5 – Abnahme

1. Der Projektleiter übergibt dem Auftraggeber die Testumgebung mit einer kurzen Anleitung: was neu ist und wie es ausprobiert wird.
2. Der Auftraggeber erprobt und nimmt formlos ab oder nennt Mängel.
3. Der Projektleiter schreibt den Abnahmebericht mit der Abnahme oder den Mängeln. Projektleiter und Softwarearchitekt klären jeden Mangel. Der Softwarearchitekt lässt ihn über sein Team in Phase 4 beheben.
4. Nach drei erfolglosen Versuchen gilt ein Mangel als nicht lösbar. Der Projektleiter legt vor, was geht und was nicht. Der Auftraggeber entscheidet.

Ergebnis: abgenommenes Arbeitspaket, Abnahme im Abnahmebericht vermerkt.

### Phase 6 – Integration

Der Softwarearchitekt übernimmt genau den abgenommenen Commit mit einem Merge-Commit in `main`. Er beendet die Testumgebung, entfernt Arbeitsverzeichnisse und Zweige des Pakets und trägt das Paket im Arbeitspaketplan mit `done` ein.

Ergebnis: Arbeitspaket im Hauptstand, keine Reste aus der Umsetzung. Danach beginnen die Pakete, deren Abhängigkeiten jetzt erfüllt sind.

## Übergabedokumente

| von | an | Dokument |
|---|---|---|
| Auftraggeber, Projektleiter | Softwarearchitekt | Anforderungsdokument |
| Softwarearchitekt | QA, Projektleiter | Spezifikation, Arbeitspaketplan |
| QA | Softwarearchitekt | Prüfbericht |
| Softwarearchitekt | Entwickler | Auftrag |
| Entwickler | Tester | Code mit Commit, technische Dokumentation |
| Tester | Entwickler, Softwarearchitekt | Testbericht |
| Projektleiter | Softwarearchitekt | Abnahmebericht mit den Mängeln |

Direkte Nachrichten zwischen Agenten sind kein Übergabeweg.

### Ablage

Anforderungsdokumente, eines für das Gesamtsystem und je eines je Komponente, bleiben als lebende Dokumente unter `docs/design/requirements/`. Alle anderen Übergabedokumente liegen unter `development/`:

```text
development/
  messages/
    architect/            Meldungen an den Softwarearchitekten
    projectlead/          Meldungen an den Projektleiter
  <vorhaben>/
    scope.md              geltende Anforderungsdokumente (Projektleiter)
    specification.md      technische Spezifikation (Softwarearchitekt)
    plan.md               Arbeitspaketplan (Softwarearchitekt)
    reviews/              Prüfberichte der QA zu Anforderungen, Spezifikation und Plan
    presentations/        Präsentationen mit Vermerk der Bestätigung (Projektleiter)
    questions/            Fragen an den Auftraggeber mit Antwort
    <arbeitspaket>/
      orders/             Aufträge an die Entwickler (Softwarearchitekt)
      tests/              Testberichte (Tester)
      reviews/            Prüfberichte der QA
      acceptance/         Abnahmeberichte (Projektleiter)
```

Namen von Vorhaben bestehen aus Kleinbuchstaben und Ziffern. Arbeitspakete heißen `wp` mit zweistelliger Nummer, zum Beispiel `wp01`, Aufträge zweistellig nummeriert, zum Beispiel `orders/01.md`. Berichtsdateien nennen den Gegenstand und die Nummer des Durchlaufs:

| Bericht | Datei |
|---|---|
| Prüfbericht der QA in den Phasen 2 und 3 | `reviews/requirements-<n>.md`, `reviews/specification-<n>.md`, `reviews/plan-<n>.md` |
| Testbericht | `<arbeitspaket>/tests/<auftrag>-<prüfgebiet>-<n>.md` mit Prüfgebiet `functiontest` oder `securitytest` |
| Prüfbericht der QA in Phase 4 | `<arbeitspaket>/reviews/<n>.md` |
| Abnahmebericht | `<arbeitspaket>/acceptance/<n>.md` |
| Frage | `questions/<name>-<nn>.md` mit dem Namen des Vorhabens beziehungsweise Arbeitspakets aus `ref` |

Test- und Prüfberichte nennen den geprüften Commit vollständig. Abnahmeberichte schreibt der Projektleiter direkt auf `main`, alle anderen Dokumente eines Arbeitspakets liegen bis zur Integration auf seinem Arbeitszweig. Eine Frage nennt die unterbrochene Aufgabe und ihren Stand. Der Projektleiter trägt die Antwort des Auftraggebers in dasselbe Dokument ein.

Tester und QA schreiben ihren Bericht unter dem Dateinamen, den der Softwarearchitekt in ihrem Übergabedokument nennt, in ihr eigenes Arbeitsverzeichnis, ohne ihn zu committen. Der Softwarearchitekt kopiert ihn in sein Arbeitsverzeichnis und bringt Aufträge und Berichte eines Arbeitspakets auf dessen Arbeitszweig, die Dokumente der Phasen 2 und 3 auf `main`.

### Meldungen

Eine Meldung ist eine Markdown-Datei `development/messages/<empfänger>/<JJJJMMTThhmmss>-<absender>-<nn>.md` mit dem Zeitpunkt ihrer Erstellung und einer laufenden Nummer innerhalb eines Commits. Die Felder sind maschinenlesbare Bezeichner und deshalb englisch:

| Feld | Inhalt |
|---|---|
| `from` | `projectlead`, `architect` oder `agentrun` |
| `ref` | `<vorhaben>` oder `<vorhaben>/<arbeitspaket>` |
| `task` | Aufgabe, siehe unten |
| `document` | Pfad des Übergabedokuments im Repository. Liegt es auf einem Arbeitszweig, in der Form `<zweig>:<pfad>`. |

Darunter steht bei Bedarf ein kurzer Text. Inhalte gehören in das Übergabedokument, nicht in die Meldung.

| Empfänger | `task` | Anlass | `document` |
|---|---|---|---|
| Softwarearchitekt | `check` | Phase 2 beginnen: Prüfung der Anforderungsdokumente durch die QA | `scope.md` |
| Softwarearchitekt | `specify` | Spezifikation erstellen oder nach einer Lücke ergänzen | `scope.md` |
| Softwarearchitekt | `revise` | Einwände des Auftraggebers zu Spezifikation oder Plan einarbeiten | Präsentation mit den Einwänden |
| Softwarearchitekt | `plan` | Phase 3 beginnen oder Plan ändern | `specification.md` |
| Softwarearchitekt | `implement` | Phase 4 eines Arbeitspakets beginnen oder fortsetzen | `plan.md` |
| Softwarearchitekt | `fix` | Mängel aus der Abnahme beheben | Abnahmebericht |
| Softwarearchitekt | `integrate` | abgenommenes Paket übernehmen | Abnahmebericht |
| Softwarearchitekt | `answer` | Antwort auf eine Frage, unterbrochene Aufgabe fortsetzen | Frage mit Antwort |
| Projektleiter | `review` | Prüfbericht der QA zu den Anforderungsdokumenten | Prüfbericht |
| Projektleiter | `present` | Spezifikation oder Plan zur Präsentation und Abstimmung | `specification.md` oder `plan.md` |
| Projektleiter | `acceptance` | Testumgebung für die Abnahme bereit | positiver Prüfbericht der QA auf dem Arbeitszweig mit Commit und Port der Testumgebung |
| Projektleiter | `question` | Frage an den Auftraggeber oder Eskalation | Frage |
| Projektleiter | `integrated` | Paket in den Hauptstand übernommen | `plan.md` |
| Projektleiter | `failed` | Absturz oder Stillstand einer Sitzung, von `agentrun` | die Meldung, mit der die Sitzung gestartet wurde |

Findet der Softwarearchitekt in Phase 4 eine Lücke in der Spezifikation oder braucht der Plan eine Änderung, ergänzt er Spezifikation beziehungsweise Plan, lässt sie von der QA prüfen und meldet `present`. Das Paket ruht bis zur Bestätigung. Der Projektleiter setzt es danach mit `implement` fort.

Nach der Bestätigung des Plans schreibt der Projektleiter je Paket ohne Abhängigkeit eine Meldung `implement`. Bei der Integration schreibt der Softwarearchitekt im selben Commit wie seine Meldung `integrated` eine Meldung `implement` an sich selbst für jedes Paket, dessen Abhängigkeiten jetzt erfüllt sind.

Der Empfänger entfernt eine bearbeitete Meldung im selben Commit wie seine Antwort. Nach `failed` entfernt der Projektleiter die ursprüngliche Meldung und stößt die Arbeit mit einer neuen Meldung erneut an.

### Arbeiten auf main

Wer ein Dokument auf `main` bringt, arbeitet in einem eigenen Arbeitsverzeichnis ohne Zweig auf dem aktuellen Stand von `origin/main` und überträgt mit `git push origin HEAD:main`. Lehnt GitHub ab, weil `main` inzwischen weiter ist, holt er den neuen Stand, setzt seinen Commit darauf und überträgt erneut. Einen Merge-Commit der Integration führt er dabei auf dem neuen Stand neu aus. Meldungen und Dokumente gelten erst als übergeben, wenn sie auf `origin/main` liegen.

## Schleifen und Eskalation

Jede Prüfschleife hat höchstens drei Durchläufe. Danach geht der Fall eine Ebene höher: Entwickler → Softwarearchitekt → Projektleiter → Auftraggeber.

| Schleife nach drei erfolglosen Durchläufen | Weiter an |
|---|---|
| Tester und Entwickler | Softwarearchitekt, der die Aufträge anpasst. Nach drei weiteren Durchläufen an den Projektleiter. |
| QA und Softwarearchitekt | Projektleiter. Er übersetzt den Streitpunkt verständlich und legt ihn dem Auftraggeber zur Entscheidung vor. Fehlt eine Anforderung, geht sie in Phase 1. |
| Mangel in der Abnahme | Projektleiter und Softwarearchitekt erklären ihn als nicht lösbar. Der Auftraggeber entscheidet. |

Die Abstimmung mit dem Auftraggeber endet mit seiner Bestätigung.

## Technische Ausführung

### Entwicklungsverzeichnis

Unter dem Pipwerk-Entwicklungsverzeichnis `$PIPWERK_DEV_ROOT` auf dem Entwicklungsrechner liegen:

| Verzeichnis | Inhalt | verändert von |
|---|---|---|
| `repo/` | Klon des Repositorys auf dem Stand von `origin/main`, Träger der gemeinsamen Git-Daten | Stand von `main` nur der Runner |
| `work/<vorhaben>/<rolle>/` | Arbeitsverzeichnisse der Phasen 2 und 3 | die jeweilige Rolle |
| `work/<vorhaben>/<arbeitspaket>/<rolle>/` | Arbeitsverzeichnisse der Phase 4 | die jeweilige Rolle |
| `test/<vorhaben>-<arbeitspaket>/` | Testumgebung eines Arbeitspakets | Softwarearchitekt |
| `scripts/` | `agentrun` und `heartbeat`, nicht Teil des Repositorys | nicht durch das Team |
| `run/` | `agentrun.pid`, Herzschlagdateien und die Liste der gestarteten Meldungen | `agentrun`, `heartbeat` |
| `devteam/` | Konfiguration der Rollen für Claude Code und die Startskripte | nicht durch das Team |
| `transfer/` | Ablage des Auftraggebers für Dateiübergaben außerhalb des Ablaufs | Auftraggeber und auf seine Anweisung |

Die Rollennamen der Arbeitsverzeichnisse sind `architect`, `backend`, `frontend`, `functiontest`, `securitytest` und `qa`. In Phase 4 hat der Softwarearchitekt zusätzlich `architectmain` für seine Arbeit auf `main`. Ein weiterer Entwickler desselben Gebiets erhält eine Nummer, zum Beispiel `backend2`.

Kein Agent arbeitet in `repo/`. `agentrun` legt das leere Arbeitsverzeichnis des Softwarearchitekten an, falls es fehlt, und startet die Sitzung darin. Die Rollen richten ihr Arbeitsverzeichnis selbst mit `git worktree add` aus `repo/` ein. Folgesitzungen desselben Arbeitspakets verwenden die bestehenden Arbeitsverzeichnisse weiter. Der Softwarearchitekt entfernt die Arbeitsverzeichnisse der Phasen 2 und 3 am Ende jeder Sitzung, die der Phase 4 bei der Integration, jeweils für alle Rollen.

### Zweige

| Zweig | Inhalt | angelegt von |
|---|---|---|
| `main` | Hauptstand. Dokumente der Phasen 1 bis 3, Meldungen, Fragen, Abnahmeberichte und übernommene Arbeitspakete | – |
| `<vorhaben>/<arbeitspaket>` | Arbeitszweig des Pakets mit Aufträgen, Berichten und zusammengeführten Aufträgen | Softwarearchitekt |
| `<vorhaben>/<arbeitspaket>-<auftrag>` | Zweig eines Entwicklers für einen Auftrag | Entwickler |
| `<vorhaben>/<arbeitspaket>-functiontest` | Änderungen am Prüfskript, aufgesetzt auf dem zu prüfenden Commit | Tester Funktion |
| `<vorhaben>/proto-<name>` | Prototyp der Phase 2, wird nicht übernommen | Entwickler |

Alle Zweige werden nach GitHub übertragen. Der Softwarearchitekt führt einen Auftragszweig nach positiven Testberichten mit einem Merge-Commit in den Arbeitszweig zusammen und entfernt ihn danach. Den Zweig des Testers Funktion führt er vor der Prüfung durch die QA zusammen. Ein Testbericht nennt neben dem geprüften Commit den Commit des verwendeten Prüfskripts. Eine Änderung nur am Prüfskript macht vorhandene Testberichte nicht ungültig. Prototypzweige entfernt er nach der Abstimmung der Spezifikation.

### agentrun

`agentrun` ist ein Shell-Skript in `scripts/`. Es läuft dauerhaft und überwacht mit `inotifywait` das Verzeichnis `repo/development/messages/architect/`.

- Für jede neue Meldung startet es eine Sitzung des Softwarearchitekten in einer tmux-Sitzung. Name der tmux-Sitzung und Herzschlagdatei leiten sich aus `ref` ab. Der Startauftrag nennt den Pfad der Meldung und das Entwicklungsverzeichnis. Arbeitsverzeichnis ist `work/<ref>/architect/`.
- Je `ref` läuft höchstens eine Sitzung. Eine weitere Meldung mit demselben `ref` startet erst nach dem Ende der laufenden Sitzung.
- Jede Meldung startet es genau einmal und vermerkt sie in `run/`.
- Es beendet die Sitzung, sobald in `repo/development/messages/projectlead/` nach dem Start eine Meldung des Softwarearchitekten mit demselben `ref` liegt. Mit dieser Antwortmeldung endet jede Sitzung, auch bei einer Frage.
- Besteht die Sitzung nicht mehr ohne Antwortmeldung oder fehlt der Herzschlag 15 Minuten lang, beendet es die Sitzung und schreibt eine Meldung `failed` an den Projektleiter. Diese Meldung legt es über die Schnittstelle für Dateiinhalte der GitHub-API direkt auf `main` an, ohne Arbeitsverzeichnis.

Die Sitzung startet mit festen Einstellungsquellen, sodass Agentendefinitionen, Skills, Hooks und Freigaben ausschließlich aus `devteam/` kommen:

```sh
claude --setting-sources project --permission-mode default \
  --plugin-dir ROOT/devteam --settings ROOT/devteam/settings.json \
  --agent devteam:software-architect "<Startauftrag>"
```

Eine interaktive Sitzung beendet sich nicht von selbst. `agentrun` beendet sie mit `tmux kill-session`. Ein Cron-Job prüft, ob der Prozess aus `run/agentrun.pid` läuft, und startet `agentrun` sonst neu. Beim Start bewertet `agentrun` alle Meldungen und laufenden Sitzungen neu.

### Herzschlag

Ein Hook von Claude Code für die Ereignisse `PreToolUse`, `PostToolUse` und `PostToolUseFailure` ruft bei jedem Werkzeugaufruf das Skript `scripts/heartbeat` auf. Es liest das Arbeitsverzeichnis aus den Hook-Daten. Liegt es unter `work/<vorhaben>/<rolle>/` oder `work/<vorhaben>/<arbeitspaket>/<rolle>/`, aktualisiert es den Zeitstempel der Herzschlagdatei dieses `ref` in `run/`. Sonst tut es nichts. Es gibt nichts aus und endet immer mit Exitcode 0.

Tester und QA laufen mit demselben Hook. Ihre Tätigkeit zählt über ihre Arbeitsverzeichnisse unter `work/` zum `ref` des Arbeitspakets.

Gemessen wird ab dem späteren Zeitpunkt von Start der Sitzung und letztem Herzschlag. 15 Minuten ohne Herzschlag gelten als Stillstand, auch wenn die Sitzung auf eine Freigabe oder das Ende einer Pause wegen der Nutzungsgrenze wartet.

### Start von Entwickler, Tester und QA

Der Softwarearchitekt startet sie mit dem Pfad ihres Übergabedokuments.

- Entwickler laufen als Unteragenten seiner Sitzung, je Entwicklergebiet mit eigener Agentendefinition. Mehrere Entwickler gleichzeitig nur für voneinander unabhängige Teile, jeder mit eigenem Arbeitsverzeichnis.
- Tester und QA startet er über ein Startskript je Rolle in `devteam/bin/`. Das ausgeführte Programm ist einstellbar, derzeit Claude Code mit Hooks, Skills und Freigaben aus `devteam/`. Er startet das Skript im Hintergrund und wartet auf den Bericht.
- Eine Teamfunktion mit direkten Nachrichten zwischen Agenten wird nicht verwendet.

### Skripte je Komponente

Im Verzeichnis jeder Komponente liegen:

- ein Prüfskript vom Tester, das die automatischen Prüfungen der Komponente ausführt
- ein Testumgebungsskript vom Entwickler, das die Komponente aus einem Arbeitsverzeichnis als Testumgebung startet und beendet

Ports und Datenbank sind Parameter oder Konfiguration, keine festen Werte. Name und Aufruf der Skripte stehen in der technischen Dokumentation der Komponente. Ein übergreifendes Skript für mehrere Komponenten gibt es nicht. Bei `fix` startet der Softwarearchitekt die Testumgebung mit dem neuen Commit neu.

### Runner

Ein GitHub-Actions-Workflow auf einem selbst betriebenen Runner auf dem Entwicklungsrechner hält `repo/` per Fast-Forward auf dem Stand von `origin/main`. Er startet bei jedem Push auf `main` und kann auf GitHub zusätzlich von Hand gestartet werden. Weitere Aufgaben hat er nicht.

Der Runner läuft als systemd-Dienst unter dem Benutzer, dem die Arbeitsverzeichnisse gehören. `PIPWERK_DEV_ROOT` steht in seiner Umgebungsdatei. Der Workflow hat keine Auslöser für Pull Requests. Das Repository verlangt für Workflows aus Pull Requests aller externen Beitragenden eine Freigabe durch den Auftraggeber. Ein solcher Workflow wird nicht freigegeben.

### Konfiguration der Rollen

Die Claude-Code-Konfiguration ist Implementierungsdetail des Entwicklungsrechners und liegt nicht im Repository:

```text
devteam/
  .claude-plugin/plugin.json   Name devteam
  agents/                      Softwarearchitekt und Entwickler
  skills/                      Skills der Rollen
  bin/                         Startskripte für Tester und QA
  hooks/hooks.json             Herzschlag
  settings.json                Freigaben
```

Maßgeblich für Inhalt und Verhalten der Rollen sind die Briefings in [Agentenrollen und Briefings](agentenrollen-und-briefings.md). Die Dateien in `devteam/` setzen sie um. Änderungen daran veranlasst der Projektleiter mit einer Anweisung in `transfer/` an eine Sitzung auf dem Entwicklungsrechner.

### Einrichtung auf dem Entwicklungsrechner

Die Schritte führt der Auftraggeber aus oder lässt sie von einer Sitzung auf dem Entwicklungsrechner ausführen. Sie werden lokal dokumentiert.

1. Runner als systemd-Dienst unter dem Benutzer der Arbeitsverzeichnisse betreiben, mit `PIPWERK_DEV_ROOT` in seiner Umgebungsdatei.
2. Für diesen Benutzer `gh` mit Schreibrecht auf das Repository und Claude Code mit dem Claude-Abo anmelden. Claude Code einmal interaktiv in `repo/` und in `work/` starten, die Vertrauensabfrage jeweils bestätigen, die Sitzung beenden und das Verzeichnis verlassen.
3. Im Repository auf GitHub für Workflows aus Pull Requests die Freigabe für alle externen Beitragenden verlangen.
4. `devteam/` anlegen.
5. `inotify-tools` installieren, `agentrun` und `heartbeat` nach `scripts/` installieren und den Cron-Job für `run/agentrun.pid` einrichten. `agentrun` wird aus einem Verzeichnis außerhalb von `repo/` gestartet.

## Weitere Qualitätswerkzeuge

Die verbindlichen Prüfwerkzeuge und Qualitätsregeln stehen in den [Entwicklungs-, Test- und Sicherheitsregeln](development-test-security-rules.md).

Weitere Werkzeuge, insbesondere Vertrags-, Architektur-, Property-based- oder Mutationstests, werden bedarfsgerecht bewertet. Ein Werkzeug gilt erst dann als Qualitätsgewinn, wenn Aufgabe, Prüfkriterium und Wirkung nachgewiesen sind.

Zugangsdaten und API-Schlüssel gehören nicht ins Repository. Claude Code wird über ein Claude-Abo mit festem Monatspreis betrieben. Das Erreichen der Nutzungsgrenze unterbricht die Arbeit nur. Die Modellzuordnung der Rollen ist änderbare Laufzeitkonfiguration.

## Offene Punkte

- Ob der Hook bei Werkzeugaufrufen von Unteragenten auslöst, wird auf dem Entwicklungsrechner geprüft.
- Ob eine Sitzung in einem neu angelegten Verzeichnis unter `work/` ohne Vertrauensabfrage startet, wird mit demselben Versuch geprüft.
- Der Runner-Workflow ruft derzeit noch `pipwerk-dev sync-repo` auf. Mit dem Wegfall von `pipwerk-dev` wird dieser Aufruf durch einen Git-Befehl im Workflow ersetzt.
- Vergleich von Claude und Codex als Tester mit gezielt eingebauten Fehlern, sobald der erste Durchlauf steht.
- Eigene Rolle für die Anwenderdokumentation, nur falls die Dokumente der Entwickler nicht genügen.

## Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-12 | Herzschlag von Tester und QA über den Hook von Claude Code, kein eigener Herzschlag der Startskripte. |
| 2026-10-12 | An die bestätigte Präsentation des Entwicklungsprozesses angepasst: sechs Phasen mit Rückwegen, Entscheidungsrechte, Übergabedokumente mit Ablage unter `development/` und Meldungen, Schleifen und Eskalation, Start von Entwickler, Tester und QA, Skripte je Komponente. Auftragsverwaltung `ordermgr` mit Statusmodell und Akte, `work-orders/`, Arbeitspaketliste und `pipwerk-dev` entfallen. |
| 2026-10-12 | `pipwerk-dev` unterstützt `domain-core`: Prüfungen und Bereitstellung ohne laufendes Programm. Prüfung der Abnahmekriterien bei einer Bibliothek. |
| 2026-10-10 | Beteiligte: Arbeitsteilung zwischen Nutzer und Projektleiter aufgenommen. |
| 2026-10-10 | Startauftrag von `agentrun` mit Entwicklungsverzeichnis und Auftragskennung; Abschnitt zur Einführung entfernt. |
| 2026-10-09 | `work-orders/` auf `incoming/` und `outgoing/` umgestellt, neue Vorlage mit Akte. |
| 2026-10-09 | Claude-Code-Konfiguration aus dem Repository nach `devteam/` verlegt. |
| 2026-10-09 | Auftragsverwaltung als Skript `ordermgr`, Läufe des Softwarearchitekten mit `agentrun` und Herzschlag. |
| 2026-10-08 | Prozess mit Auftragsverwaltung, Runner und paralleler Bearbeitung eingeführt. Frühere Fassungen sind in Git nachvollziehbar. |
