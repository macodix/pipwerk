# Das Pipwerk-Entwicklungsverfahren

## Status

- status: `draft`
- stand: 2026-10-24
- bereich: Entwicklungsprozess (keine Produktkomponente)
- abgestimmt: [Präsentation Entwicklungsprozess](praesentation-entwicklungsprozess.html), bestätigt vom Auftraggeber im Chat am 12. Oktober 2026. Prüfung durch die QA in Phase 1 bestätigt am 14. Oktober 2026.

## Kurzfassung

Für die meisten Aufgaben genügt dieser Abschnitt. Die übrigen Abschnitte werden nur gelesen, wenn die Aufgabe sie betrifft.

- Kette: Auftraggeber ⇄ Projektleiter ⇄ Softwarearchitekt (Phasen 1 bis 3) beziehungsweise Entwicklungsleiter (Phasen 4 bis 6) ⇄ Team (Entwickler, Tester, QA). Jede Rolle spricht nur mit ihren Nachbarn. Softwarearchitekt und Entwicklungsleiter sprechen über `amend` und `amended` miteinander.
- Der Auftraggeber entscheidet Anforderungsdokumente, Fachmodell und Strategiebeschreibungen. Alles andere entscheiden Softwarearchitekt, Entwicklungsleiter und Team.
- Phasen: 1 Anforderung (QA prüft die Dokumente des Auftraggebers, Abstimmung), 2 Konzeption (Spezifikation, Machbarkeitstest bei Bedarf, Oberflächenentwurf je Ansicht ohne umgesetzte Fassung, Abstimmung), 3 Planung (benannte Arbeitspakete, Abstimmung), 4 Umsetzung (Aufträge, Tester, QA), 5 Abnahme durch den Auftraggeber, 6 Integration in `main`.
- Rückwege: fehlende Anforderung → Phase 1, Lücke der Spezifikation → Phase 2, Mangel in der Abnahme → Phase 4, Planänderung → Phase 3.
- Übergabe nur über Übergabedokumente und Meldungen unter `development/` auf `origin/main`.
- Prüfungen: erster Durchlauf vollständig, danach nur Nachprüfung; nur blockierende Befunde verhindern das Bestehen; bestanden ist bestanden.
- Dem Auftraggeber wird nur vorgelegt, was nur er entscheiden kann. Korrekturen aus bestehenden Festlegungen, Fragen der Spezifikation und offene Punkte erledigen die Rollen selbst.
- Prüfschleifen laufen, solange die blockierenden Befunde weniger werden, sonst eine Ebene höher.
- Rein technische Streitpunkte entscheidet der Softwarearchitekt abschließend, in Phase 4 der Entwicklungsleiter, solange Spezifikation und Plan unverändert bleiben.
- Eine abgebrochene Sitzung setzt `agentrun` selbst fort. Der Projektleiter erhält erst nach dem dritten Abbruch derselben Meldung eine Meldung `failed`. Eine Pause wegen der Nutzungsgrenze ist kein Abbruch.
- Der Projektleiter wendet sich nur an den Auftraggeber, wenn dieser etwas tun muss. Jedes Vorhaben und jedes Arbeitspaket hat einen Namen; gegenüber dem Auftraggeber gelten die Namen. Eine Übersicht zeigt den Stand aller Vorhaben ([Übersicht](#übersicht)).
- Ausführung auf dem Entwicklungsrechner: Runner, `agentrun`, Herzschlag, Rollen in `devteam/`, Modelle nach [Verbrauch des Nutzungskontingents](#verbrauch-des-nutzungskontingents).

## Geltungsbereich und Dokumentationsorte

Dieses Dokument ist die maßgebliche Beschreibung des Entwicklungsprozesses von Pipwerk: Phasen, Übergabedokumente und ihre Ablage, Schleifen und Eskalation sowie die technische Ausführung auf dem Entwicklungsrechner. Rollen, Verhaltensregeln und Briefings stehen in [Agentenrollen und Briefings](agentenrollen-und-briefings.md). Die technischen Qualitätsanforderungen an Code und Tests stehen in den [Entwicklungs-, Test- und Sicherheitsregeln](development-test-security-rules.md).

Für die Dokumentation gilt: Jede Festlegung steht an genau einer Stelle im Repository. Eine README-Datei dient nur der Orientierung in ihrem Verzeichnis. Sie beschreibt, wozu das Verzeichnis da ist, und verweist auf das zuständige Dokument, enthält aber selbst keine Festlegungen.

Maßgeblich sind das aktuelle Repository und die Übergabedokumente. Chats, Agentenausgaben und Nachrichten zwischen Sitzungen ersetzen keine Repository-Dokumentation.

Eine Aussage wird nicht allein dadurch zu einer Festlegung des Auftraggebers, dass sie in einem Repository-Dokument steht. Inhalte eines mit `draft` gekennzeichneten Dokuments sind Arbeitsstand. Eine veraltete oder widersprüchliche Stelle, die sich anhand bereits getroffener Festlegungen eindeutig korrigieren lässt, wird korrigiert und nicht als neue Frage an den Auftraggeber gegeben.

## Rollen und Kommunikationsweg

```text
Auftraggeber ⇄ Projektleiter ⇄ Softwarearchitekt   (Phasen 1 bis 3) ⇄ Team (Entwickler, Tester, QA)
                            ⇄ Entwicklungsleiter (Phasen 4 bis 6) ⇄ Team
Softwarearchitekt ⇄ Entwicklungsleiter (Lücken in Spezifikation oder Plan während Phase 4)
```

Jede Rolle spricht nur mit ihren Nachbarn in dieser Kette. Das Team hat keinen direkten Kontakt zum Auftraggeber. Aufgaben und Briefings der Rollen stehen in [Agentenrollen und Briefings](agentenrollen-und-briefings.md).

## Entscheidungsrechte

Der Auftraggeber entscheidet den Inhalt von:

- Anforderungsdokumenten: Arbeitsabläufe und Bedienablauf
- Fachmodell: Objekte, ihre Eigenschaften und Regeln
- Strategiebeschreibungen

Alles andere entscheiden Softwarearchitekt, Entwicklungsleiter und Team in ihrer Zuständigkeit. Braucht die Umsetzung eine Aussage, die in eines dieser Dokumente gehört und dort fehlt, wird sie nicht selbst getroffen. Sie geht als Frage an den Auftraggeber.

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
| Name | Sprechender Name eines Vorhabens oder Arbeitspakets, zusätzlich zur Kennung. Gegenüber dem Auftraggeber werden Namen verwendet, intern Kennungen. Der Name eines Vorhabens steht in `scope.md` in der Zeile `Name: …` unter der Überschrift, der Name eines Arbeitspakets im Plan in der Überschrift `## wp01 – <Name>`. |
| Ansicht | Eine Seite oder ein eigenständiger Dialog einer Oberfläche mit eigenem Bedienablauf. Reiter, Zustände und Teilbereiche einer Seite gehören zu ihrer Ansicht. Eine Ansicht ist umgesetzt, sobald sie sich in einer Testumgebung öffnen und bedienen lässt oder in `main` übernommen ist. Ab dann ist jeder Wunsch dazu eine Änderung am bestehenden System. |
| Oberflächenentwurf | Vorzeigbarer Entwurf einer Ansicht, in dem der Auftraggeber die Bedienung ausprobiert, bevor die Ansicht spezifiziert und umgesetzt wird. |
| Machbarkeitstest | Vorzeigbare Umsetzung eines Teils, mit der der Softwarearchitekt klärt, ob oder wie etwas umsetzbar ist. Er beauftragt sie allein. |
| Abbruch | Eine Sitzung besteht nicht mehr, ohne dass die Antwortmeldung vorliegt, oder ihr Herzschlag fehlt 15 Minuten lang, oder ihr Start schlägt fehl. Eine Pause wegen der Nutzungsgrenze ist kein Abbruch. |
| Wiedervorlage | Einmalige Erinnerung zu einem festen Zeitpunkt, die den Chat des Projektleiters weckt. Der Chat setzt sie sich selbst, siehe Briefing Projektleiter in [Agentenrollen und Briefings](agentenrollen-und-briefings.md#briefing-projektleiter). |

## Phasen

| Phase | Ergebnis |
|---|---|
| 1 Anforderung | fortgeschriebene und von der QA geprüfte Dokumente des Auftraggebers, abgestimmte Präsentation |
| 2 Konzeption | technische Spezifikation, bei Bedarf Machbarkeitstests und Oberflächenentwürfe |
| 3 Planung | Arbeitspaketplan mit benannten Arbeitspaketen |
| 4 Umsetzung | je Arbeitspaket: Aufträge, Code, Tests, QA |
| 5 Abnahme | Erprobung durch den Auftraggeber |
| 6 Integration | Übernahme in `main` |

Die Namen der Phasen sind fest und lauten wie in der Tabelle.

Rückwege:

- Fehlende oder geänderte Anforderung aus jeder Phase: zurück in Phase 1.
- Lücke in der Spezifikation: zurück in Phase 2.
- Mangel in der Abnahme: zurück in Phase 4.
- Änderung am Plan: wieder durch Phase 3.

Ein Arbeitspaket beginnt, sobald alle Pakete, von denen es laut Plan abhängt, abgenommen und übernommen sind. Pakete ohne offene Abhängigkeit beginnen sofort und parallel.

### Phase 1 – Anforderung

- Rollen: Auftraggeber, Projektleiter, Softwarearchitekt und QA für die Prüfung
- Eingabe: Vorhaben des Auftraggebers, Rückmeldungen aus allen späteren Phasen
- Tätigkeit:
  1. Der Auftraggeber beschreibt Arbeitsabläufe, Objekte und Regeln. Der Projektleiter fragt nach und schreibt die Dokumente des Auftraggebers fort: Anforderungsdokumente, Fachmodell, Strategiebeschreibungen. Für ein neues Vorhaben legt er dessen Verzeichnis mit `scope.md` an und führt dort die geltenden Dokumente des Auftraggebers. Den Namen des Vorhabens legt er dabei mit dem Auftraggeber fest.
  2. Der Projektleiter stößt mit der Meldung `check` die Prüfung an. Die QA prüft jedes Dokument laut `scope.md` und seine Widerspruchsfreiheit zum Anforderungsdokument des Gesamtsystems. Sie sucht Widersprüche, Lücken, mehrdeutige Begriffe, nicht gekennzeichnete offene Fragen und Umsetzungsdetails. Nennt `scope.md` Testfälle, prüft sie außerdem, ob sich jeder Testfall mit den beschriebenen Objekten und Arbeitsabläufen vollständig abbilden lässt.
  3. Der Prüfbericht geht über den Softwarearchitekten an den Projektleiter. Was sich anhand bestehender Festlegungen eindeutig korrigieren lässt, korrigiert er ohne den Auftraggeber.
  4. Der Projektleiter erstellt eine Präsentation der wichtigsten Aussagen. Sie enthält die Befunde, die nur der Auftraggeber entscheiden kann, als Fragen mit Vorschlag. Beide stimmen die Präsentation ab. Der Projektleiter arbeitet die Entscheidungen in die Dokumente ein.
- Ergebnis: fortgeschriebene Dokumente des Auftraggebers, Prüfbericht der QA, abgestimmte Präsentation mit Vermerk der Bestätigung, alles im Repository
- Schleifen: Prüfung durch die QA und Korrektur durch den Projektleiter nach [Grenze der Durchläufe](#grenze-der-durchläufe). Befunde, die nur der Auftraggeber entscheiden kann, gehen sofort an ihn. Die Nachprüfung nach der Abstimmung ist der erste Schritt von Phase 2.
- Rückkopplung: Die Dokumente des Auftraggebers sind lebende Dokumente. Jede fehlende oder geänderte Anforderung aus späteren Phasen kommt hierher zurück und wird vor der Präsentation erneut von der QA geprüft, beschränkt auf die geänderten Stellen. Vorgelegt wird nur nach [Fragen an den Auftraggeber](#fragen-an-den-auftraggeber); ein Arbeitspaket ruht nur, solange eine solche Entscheidung aussteht.

### Phase 2 – Konzeption

- Rollen: Softwarearchitekt, Entwickler, QA, Projektleiter, Auftraggeber
- Eingabe: abgestimmte Dokumente des Auftraggebers laut `scope.md`, Prüfbericht der QA aus Phase 1
- Tätigkeit:
  1. Die QA prüft nach, ob die Befunde aus Phase 1 erledigt sind und ob die dafür geänderten Stellen neue Fehler enthalten. Ist die Nachprüfung nicht bestanden, geht der Prüfbericht über den Softwarearchitekten an den Projektleiter zurück in Phase 1.
  2. Der Softwarearchitekt erstellt die technische Spezifikation. Ist unklar, ob oder wie etwas umsetzbar ist, beauftragt er Entwickler mit Machbarkeitstests. Den Machbarkeitstest beauftragt der Softwarearchitekt allein, in Phase 2 und bei `amend`. Für jede Ansicht, von der es noch keine umgesetzte Fassung gibt, auch für eine neue Ansicht in einer bestehenden Komponente, lässt er vor der Spezifikation der Ansicht einen Oberflächenentwurf bauen, in dem der Auftraggeber die Testfälle des Vorhabens ohne Anleitung durchspielen kann, in den Fenstergrößen nach req-system-024. Die Ansicht wird erst spezifiziert und umgesetzt, wenn der Auftraggeber den Oberflächenentwurf bestätigt hat. Änderungen an einer umgesetzten Ansicht, auch neue oder geänderte Anforderungen und Mängel aus ihrer Abnahme, werden ohne Oberflächenentwurf spezifiziert, direkt in der Software umgesetzt und in der Testumgebung abgenommen. Ausnahme: Projektleiter, Softwarearchitekt oder Entwicklungsleiter können auch für eine umgesetzte Ansicht einen Oberflächenentwurf vorschlagen, der Entwicklungsleiter über `amend` an den Softwarearchitekten. Der Vorschlag geht als Frage über den Projektleiter an den Auftraggeber, der ihn bestätigt oder ablehnt.
  3. Die QA prüft die Spezifikation gegen die Dokumente des Auftraggebers.
  4. Der Projektleiter macht aus Spezifikation und Oberflächenentwürfen eine Präsentation und stimmt sie mit dem Auftraggeber ab.
- Ergebnis: bestandene Nachprüfung der Dokumente des Auftraggebers, technische Spezifikation, bei Bedarf Machbarkeitstests und bestätigte Oberflächenentwürfe, Prüfbericht der QA zur Spezifikation, abgestimmte Präsentation mit Vermerk der Bestätigung
- Schleifen: QA und Softwarearchitekt nach [Grenze der Durchläufe](#grenze-der-durchläufe). Einwände des Auftraggebers führen zu einem neuen Durchlauf, bis alle einig sind. Fehlende Anforderungen gehen in Phase 1.

### Phase 3 – Planung

- Rollen: Softwarearchitekt erstellt den Plan, QA prüft ihn, Projektleiter präsentiert, Auftraggeber bestätigt
- Eingabe: abgestimmte technische Spezifikation, Anforderungsdokumente
- Tätigkeit: Der Softwarearchitekt teilt die Spezifikation in Arbeitspakete und benennt jedes im Plan (`## wp01 – <Name>`). Der Auftraggeber bestätigt die Namen mit der Präsentation des Plans. Ein Paket, das durch `amend` entsteht, benennt er in der Planänderung; der Auftraggeber bestätigt den Namen mit der Präsentation dazu. Bestehende Vorhaben und Pakete ohne Namen erhalten ihn bei der nächsten Arbeit daran: Vorhaben durch den Projektleiter mit dem Auftraggeber, Pakete durch den Softwarearchitekten bei der nächsten Planänderung. Bis dahin gilt die Kennung. Die QA prüft, ob jede Anforderung durch die Spezifikation und jeder Teil der Spezifikation durch ein Arbeitspaket abgedeckt ist, und schreibt einen Prüfbericht. Ein Plan mit positivem Prüfbericht geht an den Projektleiter, der ihn präsentiert und abstimmt.
- Ergebnis: Arbeitspaketplan, positiver Prüfbericht, abgestimmte Präsentation mit Vermerk der Bestätigung, alles im Repository
- Schleifen: Befunde mit konkreten Fragen und Kritikpunkten zurück an den Softwarearchitekten, nach [Grenze der Durchläufe](#grenze-der-durchläufe). Die Abstimmung mit dem Auftraggeber endet mit seiner Bestätigung.

Ein Arbeitspaket enthält Ziel, Umfang, Nicht-Umfang, die umgesetzten Teile der Spezifikation, Abhängigkeiten und Abnahmekriterien. Ein Paket mit Benutzeroberfläche hat mindestens ein Abnahmekriterium zur Bedienbarkeit: Der Auftraggeber führt einen Testfall ohne Anleitung aus und hält sich dabei an den bestätigten Oberflächenentwurf beziehungsweise bei einer umgesetzten Ansicht an die Spezifikation. Der Plan führt je Paket den Stand `open` oder `done`.

### Phase 4 – Umsetzung eines Arbeitspakets

| Rolle | Eingabe | Ergebnis |
|---|---|---|
| Entwicklungsleiter | Arbeitspaket, Spezifikation | Aufträge mit Ziel, Umfang, technischen Abnahmekriterien und zuständigem Entwickler. Nach bestandenen Tests: Aufträge im Arbeitszweig des Pakets zusammengeführt, Testumgebung bereitgestellt. |
| Entwickler | ein Auftrag | Code, Unit-Tests (Tests einzelner Funktionen), technische Dokumentation und vorerst die Anwenderdokumentation, im eigenen Zweig mit benanntem Commit |
| Tester | Auftrag, Commit des Entwicklers, Regeln seines Prüfgebiets | Testbericht zu genau diesem Commit |
| QA | Arbeitspaket, Anforderungsdokumente, laufende Testumgebung, Anwenderdokumentation | Prüfbericht aus Kundensicht: Anforderungen erfüllt, Software aus Kundensicht funktionsfähig, Anwenderdokumentation verständlich und vollständig |

Prüfgebiete der Tester:

- Funktionstest: erwartetes Verhalten, Grenzfälle und Grenzwerte, automatische Tests und ihre Auswertung
- Code- und Dokumentationsprüfung: Programmierregeln, bewährte Verfahren, technische Dokumentation
- Sicherheitsprüfung: Sicherheitsregeln nach BSI-Grundschutz und OWASP

Der Tester Funktion prüft jeden Commit eines Entwicklers. Der Tester Sicherheit prüft einmal je Arbeitspaket den Arbeitszweig, nachdem alle Aufträge zusammengeführt sind und bevor die QA prüft. Seine Befunde gehen als Aufträge an die Entwickler; die Korrektur-Commits prüfen Tester Funktion und, beschränkt auf die Befunde, Tester Sicherheit.

Die QA prüft erst, wenn alle Aufträge des Pakets zusammengeführt sind und die Testumgebung läuft. Ändert sich danach der Code, ist eine erneute Prüfung durch Tester und QA erforderlich.

Ergebnis der Phase: umgesetztes Arbeitspaket auf einem benannten Commit des Arbeitszweigs, positive Testberichte, positiver Prüfbericht der QA, laufende Testumgebung.

### Phase 5 – Abnahme

1. Der Projektleiter übergibt dem Auftraggeber die Testumgebung mit einer kurzen Anleitung: was neu ist und wie es ausprobiert wird.
2. Der Auftraggeber erprobt und nimmt formlos ab oder nennt Mängel.
3. Der Projektleiter schreibt den Abnahmebericht mit der Abnahme oder den Mängeln. Projektleiter und Entwicklungsleiter klären jeden Mangel. Der Entwicklungsleiter lässt ihn über sein Team in Phase 4 beheben.
4. Kommt ein Mangel nach einer Behebung unverändert zurück oder wird die Zahl der Mängel nicht kleiner, gilt er als nicht lösbar ([Grenze der Durchläufe](#grenze-der-durchläufe)). Der Projektleiter legt vor, was geht und was nicht. Der Auftraggeber entscheidet.

Ergebnis: abgenommenes Arbeitspaket, Abnahme im Abnahmebericht vermerkt.

### Phase 6 – Integration

Der Entwicklungsleiter übernimmt genau den abgenommenen Commit mit einem Merge-Commit in `main`. Er beendet die Testumgebung, entfernt Arbeitsverzeichnisse und Zweige des Pakets und trägt das Paket im Arbeitspaketplan mit `done` ein.

Ergebnis: Arbeitspaket in `main`, keine Reste aus der Umsetzung. Danach beginnen die Pakete, deren Abhängigkeiten jetzt erfüllt sind.

## Übergabedokumente

| von | an | Dokument |
|---|---|---|
| Auftraggeber, Projektleiter | Softwarearchitekt | Dokumente des Auftraggebers laut `scope.md` |
| Softwarearchitekt | QA, Projektleiter | Spezifikation, Arbeitspaketplan |
| QA | Softwarearchitekt | Prüfbericht |
| Entwicklungsleiter, Softwarearchitekt für Machbarkeitstests und Oberflächenentwürfe | Entwickler | Auftrag |
| Entwickler | Tester | Code mit Commit, technische Dokumentation |
| Tester | Entwickler, Entwicklungsleiter | Testbericht |
| QA | Entwicklungsleiter | Prüfbericht in Phase 4 |
| Entwicklungsleiter | Softwarearchitekt | Lücke in Spezifikation oder Plan |
| Projektleiter | Entwicklungsleiter | Abnahmebericht mit den Mängeln |

Direkte Nachrichten zwischen Agenten sind kein Übergabeweg.

### Ablage

Anforderungsdokumente, eines für das Gesamtsystem und je eines je Komponente, bleiben als lebende Dokumente unter `docs/design/requirements/`. Alle anderen Übergabedokumente liegen unter `development/`:

```text
development/
  messages/
    architect/            Meldungen an den Softwarearchitekten
    devlead/              Meldungen an den Entwicklungsleiter
    projectlead/          unbearbeitete Meldungen an den Projektleiter
  overview.html           Übersicht über den Stand der Vorhaben (erzeugt, nicht von Hand gepflegt; Ort siehe Abschnitt „Übersicht“)
  <vorhaben>/
    scope.md              geltende Dokumente des Auftraggebers und Name des Vorhabens (Projektleiter)
    followup.md           Übernahme des Vorhabens durch einen Chat des Projektleiters
    waiting.md            Vorlagen, die auf den Auftraggeber warten, Format der Zeilen im Eingang des Projektleiters (Projektleiter)
    specification.md      technische Spezifikation (Softwarearchitekt)
    plan.md               Arbeitspaketplan mit Namen der Pakete (Softwarearchitekt)
    reviews/              Prüfberichte der QA zu den Dokumenten des Auftraggebers, Spezifikation und Plan
    presentations/        Präsentationen mit Vermerk der Bestätigung (Projektleiter)
    questions/            Fragen an den Auftraggeber mit Antwort
    <arbeitspaket>/
      orders/             Aufträge an die Entwickler (Entwicklungsleiter)
      tests/              Testberichte (Tester)
      reviews/            Prüfberichte der QA
      acceptance/         Abnahmeberichte (Projektleiter)
```

Kennungen von Vorhaben bestehen aus Kleinbuchstaben und Ziffern. Die Kennungen der Arbeitspakete heißen `wp` mit zweistelliger Nummer, zum Beispiel `wp01`, Aufträge zweistellig nummeriert, zum Beispiel `orders/01.md`. Berichtsdateien nennen den Gegenstand und die Nummer des Durchlaufs:

| Bericht | Datei |
|---|---|
| Prüfbericht der QA in den Phasen 1 bis 3 | `reviews/requirements-<n>.md`, `reviews/specification-<n>.md`, `reviews/plan-<n>.md` |
| Testbericht | `<arbeitspaket>/tests/<auftrag>-functiontest-<n>.md`, Sicherheitsprüfung `<arbeitspaket>/tests/securitytest-<n>.md` |
| Prüfbericht der QA in Phase 4 | `<arbeitspaket>/reviews/<n>.md` |
| Abnahmebericht | `<arbeitspaket>/acceptance/<n>.md` |
| Frage | `questions/<name>-<nn>.md` mit dem Namen des Vorhabens beziehungsweise Arbeitspakets aus `ref` |
| Lücke in Spezifikation oder Plan | `<arbeitspaket>/amend-<nn>.md` |

Test- und Prüfberichte nennen den geprüften Commit vollständig. Abnahmeberichte schreibt der Projektleiter direkt auf `main`, alle anderen Dokumente eines Arbeitspakets liegen bis zur Integration auf seinem Arbeitszweig. Eine Frage nennt die unterbrochene Aufgabe und ihren Stand. Sie enthält alle offenen Fragen dieser Aufgabe, nummeriert und jede mit einem Vorschlag. Softwarearchitekt und Entwicklungsleiter stellen sie erst, wenn die Aufgabe ohne Antwort nicht weiterkommt, und bearbeiten vorher alle Teile, die nicht von den Antworten abhängen. Der Projektleiter trägt die Antworten des Auftraggebers in dasselbe Dokument ein und meldet `answer` an die fragende Rolle erst, wenn alle Fragen beantwortet sind.

Tester und QA schreiben ihren Bericht unter dem Dateinamen, den Softwarearchitekt oder Entwicklungsleiter in ihrem Übergabedokument nennt, in das Berichtsverzeichnis `work/<ref>/reports/`, also außerhalb jedes Git-Arbeitsverzeichnisses. Ihr eigenes Arbeitsverzeichnis bleibt dadurch frei von nicht committeten Dateien, sodass dort zum Beispiel eine Testumgebung startet. Die beauftragende Rolle kopiert den Bericht in ihr Arbeitsverzeichnis. Der Entwicklungsleiter bringt Aufträge und Berichte eines Arbeitspakets auf dessen Arbeitszweig, der Softwarearchitekt die Dokumente der Phasen 2 und 3 auf `main`.

### Meldungen

Eine Meldung ist eine Markdown-Datei `development/messages/<empfänger>/<JJJJMMTThhmmss>-<absender>-<nn>.md` mit dem Zeitpunkt ihrer Erstellung in UTC und einer laufenden Nummer innerhalb eines Commits. Aufbau:

```markdown
# Meldung

- from: `architect`
- ref: `<vorhaben>/<arbeitspaket>`
- task: `acceptance`
- document: `<zweig>:<pfad>`

Kurzer Text bei Bedarf.
```

Die Felder sind maschinenlesbare Bezeichner und deshalb englisch:

| Feld | Inhalt |
|---|---|
| `from` | `projectlead`, `architect`, `devlead` oder `agentrun` |
| `ref` | `<vorhaben>` oder `<vorhaben>/<arbeitspaket>` |
| `task` | Aufgabe, siehe unten |
| `document` | Pfad des Übergabedokuments im Repository. Liegt es auf einem Arbeitszweig, in der Form `<zweig>:<pfad>`. |

Darunter steht bei Bedarf ein kurzer Text. Inhalte gehören in das Übergabedokument, nicht in die Meldung.

| Empfänger | `task` | Anlass | `document` |
|---|---|---|---|
| Softwarearchitekt | `check` | Phase 1: Prüfung der Dokumente des Auftraggebers durch die QA vor der Präsentation | `scope.md` |
| Softwarearchitekt | `specify` | Phase 2 beginnen: Nachprüfung der Dokumente des Auftraggebers, dann Spezifikation erstellen oder nach einer Lücke ergänzen | `scope.md` |
| Softwarearchitekt | `revise` | Einwände des Auftraggebers zu Spezifikation oder Plan einarbeiten | Präsentation mit den Einwänden |
| Softwarearchitekt | `plan` | Phase 3 beginnen oder Plan ändern | `specification.md` |
| Entwicklungsleiter | `implement` | Phase 4 eines Arbeitspakets beginnen oder fortsetzen | `plan.md` |
| Entwicklungsleiter | `fix` | Mängel aus der Abnahme beheben | Abnahmebericht |
| Entwicklungsleiter | `integrate` | abgenommenes Paket übernehmen | Abnahmebericht |
| Softwarearchitekt | `amend` | Phase 4: Lücke in Spezifikation oder Plan schließen, oder Oberflächenentwurf für eine umgesetzte Ansicht vorschlagen | Dokument der Lücke |
| Entwicklungsleiter | `amended` | Lücke geschlossen, Paket fortsetzen | Dokument der Lücke mit Ergebnis |
| fragende Rolle | `answer` | Antwort auf eine Frage, unterbrochene Aufgabe fortsetzen | Frage mit Antwort |
| Projektleiter | `review` | Prüfbericht der QA zu den Dokumenten des Auftraggebers, auch eine nicht bestandene Nachprüfung | Prüfbericht |
| Projektleiter | `present` | Spezifikation oder Plan zur Präsentation und Abstimmung, auch nach `amend` | `specification.md` oder `plan.md` |
| Projektleiter | `acceptance` | Testumgebung für die Abnahme bereit | positiver Prüfbericht der QA auf dem Arbeitszweig mit Commit und Port der Testumgebung |
| Projektleiter | `question` | Frage an den Auftraggeber oder Eskalation | Frage |
| Projektleiter | `integrated` | Paket in `main` übernommen | `plan.md` |
| Projektleiter | `failed` | dritter Abbruch derselben Meldung oder Meldung mit ungültigem `ref` (sofort), von `agentrun`; der Text nennt die Zahl der Abbrüche und die Art des letzten | die Meldung, mit der die Sitzung gestartet wurde |

Findet der Entwicklungsleiter in Phase 4 eine Lücke in der Spezifikation oder braucht der Plan eine Änderung, beschreibt er sie in `<arbeitspaket>/amend-<nn>.md` auf `main`, meldet `amend` an den Softwarearchitekten und beendet die Sitzung, nachdem er alle davon unabhängigen Teile erledigt hat. Der Softwarearchitekt ergänzt Spezifikation beziehungsweise Plan und lässt sie von der QA prüfen. Ist die Ergänzung rein technisch, entscheidet er sie selbst, vermerkt sie im Änderungsnachweis von Spezifikation beziehungsweise Plan und meldet nach bestandener Prüfung `amended` an den Entwicklungsleiter, der das Paket ohne Pause fortsetzt. Rein technisch ist eine Ergänzung, wenn sie keine Anforderung, kein Fachmodell, keine Strategiebeschreibung, keine bestätigte Festlegung der Spezifikation, kein Abnahmekriterium und keinen Umfang eines Arbeitspakets ändert; ist die Zuordnung nicht eindeutig, gilt sie als nicht rein technisch. Nur dann meldet er `present`, das Paket ruht bis zur Bestätigung, und der Projektleiter setzt es danach mit `implement` an den Entwicklungsleiter fort.

Eine Abhängigkeit von einem Paket gilt als erfüllt, sobald dessen Prüfung durch die QA bestanden ist. Das abhängige Paket beginnt auf diesem Stand und übernimmt spätere Korrekturen aus der Abnahme. In `main` übernommen wird es erst nach dem Paket, von dem es abhängt. Nach der Bestätigung des Plans schreibt der Projektleiter je Paket ohne offene Abhängigkeit eine Meldung `implement`. Bei der Integration schreibt der Entwicklungsleiter im selben Commit wie seine Meldung `integrated` eine Meldung `implement` an sich selbst für jedes Paket, dessen Abhängigkeiten jetzt erfüllt sind.

Der Empfänger entfernt eine bearbeitete Meldung im selben Commit wie seine Antwort. Nach `failed` berichtigt der Projektleiter die Ursache, entfernt die ursprüngliche Meldung und stößt die Arbeit mit einer neuen Meldung erneut an.

#### Eingang des Projektleiters

`development/messages/projectlead/` enthält nur unbearbeitete Meldungen.

1. Bearbeitet ist eine Meldung, wenn der Projektleiter ihre Folgehandlung erledigt hat: Antwortmeldung, Eintrag in einem Dokument, Anweisung in `transfer/` oder Vorlage beim Auftraggeber. Er entfernt sie im selben Commit.
2. Legt er dem Auftraggeber etwas vor (`present`, `question` mit Fragen an den Auftraggeber, `acceptance`, `review` mit Befunden der Gruppe „Entscheidung des Auftraggebers“, die Präsentation eines Ergebnisses), trägt er im selben Commit in `development/<vorhaben>/waiting.md` eine Zeile ein: `ref`, Handlung und Zeitpunkt der Vorlage in UTC. Die Handlung ist bei `present`, `review` und einem Vorhaben ohne Plan „Präsentation bestätigen“, bei `question` „Frage beantworten“, bei `acceptance` „Abnahme durchführen“. Hat der Auftraggeber geantwortet, entfernt er die Zeile im selben Commit wie seine Folgemeldung. Die Datei ist die einzige Quelle der [Übersicht](#übersicht) dafür, was auf den Auftraggeber wartet. Sie enthält keine Namen von Rechnern oder Benutzern.
3. Überholt ist eine Meldung, wenn nach ihr eine Meldung mit demselben `ref` an den Projektleiter vorliegt, die denselben Anlass erledigt, zum Beispiel ein neuer Prüfbericht zu demselben Dokument. Der Projektleiter des Vorhabens entfernt sie zusammen mit der späteren. Meldungen anderer Vorhaben entfernt er nie.

Wie der Chat des Projektleiters den Eingang prüft, steht im [Briefing Projektleiter](agentenrollen-und-briefings.md#briefing-projektleiter). Die erste Wiedervorlage liegt 20 Minuten, die zweite als Rückfall 40 Minuten nach der Aktivierung.

### Arbeiten auf main

Wer ein Dokument auf `main` bringt, arbeitet in einem eigenen Arbeitsverzeichnis ohne Zweig auf dem aktuellen Stand von `origin/main` und überträgt mit `git push origin HEAD:main`. Lehnt GitHub ab, weil `main` inzwischen weiter ist, holt er den neuen Stand, setzt seinen Commit darauf und überträgt erneut. Einen Merge-Commit der Integration führt er dabei auf dem neuen Stand neu aus. Meldungen und Dokumente gelten erst als übergeben, wenn sie auf `origin/main` liegen.

## Schleifen und Eskalation

### Umfang der Prüfungen

Diese Regeln gelten für jede Prüfung durch QA und Tester, in allen Phasen:

- **Detailtiefe nach Umfang.** Spezifikation und Plan legen nur Bausteine, Entscheidungen und Abnahmekriterien fest, so knapp, wie der Umfang des Vorhabens es erlaubt. Testdetails, Formulierungen und Schreibweisen von Pfaden gehören in die Aufträge, nicht in Spezifikation oder Plan.
- **Erster Durchlauf vollständig.** Der erste Durchlauf meldet alle Befunde auf einmal. Jeder weitere Durchlauf ist eine Nachprüfung: Er prüft nur, ob die Befunde behoben sind und ob die dafür geänderten Stellen neue Fehler enthalten.
- **Nur blockierende Befunde.** Ein Befund verhindert das Bestehen nur, wenn er einer Anforderung oder einem Abnahmekriterium widerspricht, die Funktion beeinträchtigt oder eine Sicherheitslücke ist. Alles andere steht im Bericht als Hinweis. Hinweise verhindern das Bestehen nicht und werden bei der nächsten passenden Gelegenheit erledigt oder verworfen.
- **Kurze Berichte.** Ein Prüf- oder Testbericht umfasst höchstens etwa 60 Zeilen. Jeder Hinweis steht in einer Zeile. Eine Nachprüfung nennt nur die noch offenen und die neuen Befunde.
- **Bestanden ist bestanden.** Nach einer bestandenen Prüfung folgt keine weitere Prüfung, nur weil Hinweise eingearbeitet wurden. Das Dokument geht mit dem bestandenen Prüfbericht in den nächsten Schritt; die eingearbeiteten Hinweise nennt der Änderungsnachweis.

### Fragen an den Auftraggeber

Dem Auftraggeber wird nur vorgelegt, was nur er entscheiden kann: Arbeitsabläufe, Bedienablauf, Objekte, Regeln und Abnahme, die in keinem geltenden Dokument festgelegt sind. Alles andere erledigen die Rollen selbst, ohne Frage, ohne Präsentation und ohne Pause eines Arbeitspakets:

- **Folgt aus einer Festlegung.** Ergibt sich die Korrektur eindeutig aus einer bestehenden Festlegung oder Entscheidung des Auftraggebers, zum Beispiel das Angleichen von Glossar, Folgesätzen oder Verweisen, korrigiert der Projektleiter die Dokumente des Auftraggebers und der Softwarearchitekt die technischen Dokumente einschließlich Glossar, in Phase 4 der Entwicklungsleiter, soweit Spezifikation und Plan nicht betroffen sind. Vermerk im Änderungsnachweis mit Verweis auf die Festlegung.
- **Sache der Spezifikation.** Betrifft ein Befund, wie eine Anforderung umgesetzt, dargestellt oder geprüft wird, entscheidet der Softwarearchitekt in der Spezifikation.
- **Offener Punkt.** Ist eine Frage in den Dokumenten des Auftraggebers als offen gekennzeichnet und für die laufende Arbeit nicht nötig, bleibt sie offen. Sie wird nicht vorgelegt.

**Keine Einschränkung ohne Erfordernis.** Was die Dokumente des Auftraggebers nicht einschränken, ist erlaubt. Eine Einschränkung braucht eine ausdrückliche Festlegung des Auftraggebers oder eine begründete technische Erfordernis, die in der Spezifikation mit Begründung dokumentiert ist. Eine Lücke ist kein Anlass für eine Frage, ob eingeschränkt werden soll. Ein Text, der ohne eine solche Grundlage einschränkt, ist ein Befund, der aus dieser Regel folgt, und wird ohne Vorlage korrigiert.

**Lücken.** Eine Lücke in den Dokumenten des Auftraggebers muss nur geschlossen werden, wenn es dafür einen guten technischen Grund gibt: Ohne sie lässt sich die Software nicht sicher betreiben oder nicht umsetzen, oder die Sicherheit der Software ist beeinträchtigt. Nur dann ist sie ein blockierender Befund, und nur dann gibt es eine Rückfrage. Jede andere Lücke dokumentiert die QA als Hinweis, der Projektleiter kennzeichnet sie bei Bedarf als offenen Punkt. Sie unterbricht den Entwicklungsprozess nicht.

Die QA ordnet jeden Befund zu Dokumenten des Auftraggebers einer dieser Gruppen oder der Gruppe „Entscheidung des Auftraggebers“ zu und stellt Fragen nur in dieser Gruppe. Ein Prüfbericht ohne Befund in dieser Gruppe geht nicht an den Auftraggeber. Ist die Zuordnung nicht eindeutig, entscheidet der Softwarearchitekt; nur wenn er sie nicht treffen kann, gilt der Befund als Entscheidung des Auftraggebers.

### Grenze der Durchläufe

Die Grenze einer Prüfschleife richtet sich nach ihrem Fortschritt, nicht nach einer festen Zahl von Durchläufen:

- Eine Schleife läuft weiter, solange jeder Durchlauf weniger blockierende Befunde hat als der vorige. Neue Befunde an korrigierten Stellen zählen mit.
- Sie geht eine Ebene höher (Entwickler → Entwicklungsleiter beziehungsweise Softwarearchitekt → Projektleiter → Auftraggeber), wenn ein blockierender Befund nach einer Korrektur unverändert wiederkommt oder wenn die Zahl der blockierenden Befunde nicht sinkt.
- Ab dem dritten Durchlauf einer Prüfung von Spezifikation oder Plan entscheidet der Softwarearchitekt verbleibende rein technische Befunde selbst nach [Rein technische Streitpunkte](#rein-technische-streitpunkte) und vermerkt sie im Änderungsnachweis; die QA prüft danach nur noch Befunde, die Dokumente des Auftraggebers, bestätigte Festlegungen, Abnahmekriterien oder den Umfang berühren.
- Ein Befund, den nur eine höhere Ebene entscheiden kann, geht sofort dorthin, ohne das Ende der Schleife abzuwarten. Die übrigen Befunde werden währenddessen weiter bearbeitet.

| Schleife ohne Fortschritt | Weiter an |
|---|---|
| Tester und Entwickler | Entwicklungsleiter, der die Aufträge anpasst. Bleibt der Fortschritt weiter aus, entscheidet er nach [Rein technische Streitpunkte](#rein-technische-streitpunkte) oder gibt den Fall an den Projektleiter. |
| QA und Softwarearchitekt, QA und Entwicklungsleiter | Projektleiter. Er übersetzt den Streitpunkt verständlich und legt ihn dem Auftraggeber zur Entscheidung vor. Fehlt eine Anforderung, geht sie in Phase 1. |
| QA und Projektleiter | Auftraggeber. Der Projektleiter legt ihm die verbleibenden Befunde gesammelt vor. |
| Mangel in der Abnahme | Projektleiter und Entwicklungsleiter erklären ihn als nicht lösbar. Der Auftraggeber entscheidet. |

### Rein technische Streitpunkte

Betrifft eine Schleife ohne Fortschritt nur die technische Umsetzung, entscheidet in den Phasen 2 und 3 der Softwarearchitekt abschließend und schreibt die Entscheidung mit Begründung in die Spezifikation. In Phase 4 entscheidet der Entwicklungsleiter abschließend und schreibt sie in den Auftrag; ändert die Entscheidung Spezifikation oder Plan, meldet er `amend`. Bei einer Schleife zwischen QA und einer der beiden Rollen gilt deren Entscheidung ebenso, die QA vermerkt den Streitpunkt im Prüfbericht als entschieden.

Nur technisch ist ein Streitpunkt, wenn seine Entscheidung keine Anforderung, kein Fachmodell, keine Strategiebeschreibung, keine bestätigte Festlegung der Spezifikation, kein Abnahmekriterium und keinen Umfang eines Arbeitspakets ändert. Berührt sie einen dieser Punkte oder ist die Zuordnung nicht eindeutig, geht der Fall nach der Tabelle oben an den Projektleiter und von ihm an den Auftraggeber.

Die Abstimmung mit dem Auftraggeber endet mit seiner Bestätigung.

## Technische Ausführung

### Entwicklungsverzeichnis

Das Entwicklungsverzeichnis auf dem Entwicklungsrechner ist `/srv/aixlab/dev/pipwerk`. Es gibt dafür keine Umgebungsvariable. Der Workflow des Runners nennt den Pfad fest. `agentrun`, `heartbeat` und `startrole` nennen ihn nicht, sondern ermitteln das Entwicklungsverzeichnis aus ihrem eigenen Ablageort: `scripts/` liegt direkt, `devteam/lib/` zwei Ebenen unter dem Entwicklungsverzeichnis. Ihre Quellen liegen mit ihren Tests im Repository unter `tools/devhost/`, damit Entwickler sie in ihrem Zweig ändern und Tester sie prüfen können. Installiert werden sie nach `scripts/` beziehungsweise `devteam/lib/`. Die Installation gehört nicht zur Arbeit des Teams: Nach der Bestätigung des Ergebnisses durch den Auftraggeber veranlasst sie der Projektleiter mit einer Anweisung in `transfer/` an eine Sitzung auf dem Entwicklungsrechner, wie bisher für `devteam/`. Darin liegen:

| Verzeichnis | Inhalt | verändert von |
|---|---|---|
| `repo/` | Klon des Repositorys auf dem Stand von `origin/main`, Träger der gemeinsamen Git-Daten | Stand von `main` nur der Runner |
| `work/<vorhaben>/<rolle>/` | Arbeitsverzeichnisse der Phasen 2 und 3 | die jeweilige Rolle |
| `work/<vorhaben>/<arbeitspaket>/<rolle>/` | Arbeitsverzeichnisse der Phase 4 | die jeweilige Rolle |
| `work/<ref>/reports/` | Berichte von Tester und QA, kein Git-Arbeitsverzeichnis | Tester und QA |
| `test/<vorhaben>-<arbeitspaket>/` | Testumgebung eines Arbeitspakets | Entwicklungsleiter |
| `test/<ref>/` | Testumgebung für die Skripte `agentrun`, `heartbeat` und `startrole`: eine vollständige Kopie dieser Verzeichnisstruktur mit einem lokalen Git-Repository als `origin` und einem Ersatzprogramm für `claude`, das Sitzungen, Abbrüche und Pausen wegen der Nutzungsgrenze nachstellt. Programmaufruf und Prüfabstände sind Parameter. So lassen sich Abbruch, Fortsetzung und Pause prüfen, ohne den laufenden Betrieb und das Nutzungskontingent zu berühren. | Entwicklungsleiter |
| `scripts/` | `agentrun`, `heartbeat` und `pidcheck` mit Tests und Beschreibung, installiert aus `tools/devhost/` (außer `pidcheck`) | nicht durch das Team |
| `run/` | PID-Datei, Sperren und Protokoll von `agentrun`, Liste der gestarteten Meldungen, je laufender Sitzung Zustands- und Herzschlagdatei mit Kennung der Sitzung und Zähler der Abbrüche, Vermerk einer Pause wegen der Nutzungsgrenze, noch nicht übertragene Meldungen `failed` | `agentrun`, `heartbeat`, `pidcheck` |
| `devteam/` | Konfiguration der Rollen für Claude Code und die Startskripte | nicht durch das Team |
| `transfer/` | Ablage des Auftraggebers für Dateiübergaben außerhalb des Ablaufs | Auftraggeber und auf seine Anweisung |

Die Rollennamen der Arbeitsverzeichnisse sind `architect`, `devlead`, `backend`, `frontend`, `functiontest`, `securitytest` und `qa`. In Phase 4 hat der Entwicklungsleiter zusätzlich `devleadmain` für seine Arbeit auf `main`, der Softwarearchitekt bei `amend` `architectmain`. Ein weiterer Entwickler desselben Gebiets erhält eine Nummer, zum Beispiel `backend2`.

Kein Agent arbeitet in `repo/`. `agentrun` legt das leere Arbeitsverzeichnis der gestarteten Rolle an, falls es fehlt, und startet die Sitzung darin. Die Rollen richten ihr Arbeitsverzeichnis selbst mit `git worktree add` aus `repo/` ein. Folgesitzungen desselben Arbeitspakets verwenden die bestehenden Arbeitsverzeichnisse weiter. Der Softwarearchitekt entfernt die Arbeitsverzeichnisse der Phasen 2 und 3 und nach `amend` sein eigenes am Ende jeder Sitzung, der Entwicklungsleiter die der Phase 4 bei der Integration, jeweils für alle Rollen und mit `git worktree remove`, dazu das Berichtsverzeichnis `work/<ref>/reports/`, sein eigenes Arbeitsverzeichnis als letzten Befehl. Leere Verzeichnisse unter `work/<ref>/` entfernt danach `agentrun`.

### Zweige

| Zweig | Inhalt | angelegt von |
|---|---|---|
| `main` | Dokumente der Phasen 1 bis 3, Meldungen, Fragen, Abnahmeberichte und übernommene Arbeitspakete | – |
| `<vorhaben>/<arbeitspaket>` | Arbeitszweig des Pakets mit Aufträgen, Berichten und zusammengeführten Aufträgen | Entwicklungsleiter |
| `<vorhaben>/<arbeitspaket>-<auftrag>` | Zweig eines Entwicklers für einen Auftrag | Entwickler |
| `<vorhaben>/<arbeitspaket>-functiontest` | Änderungen am Prüfskript, aufgesetzt auf dem zu prüfenden Commit | Tester Funktion |
| `<vorhaben>/proto-<name>` | Machbarkeitstest oder Oberflächenentwurf der Phase 2, wird nicht übernommen | Entwickler |

Alle Zweige werden nach GitHub übertragen. Der Entwicklungsleiter führt einen Auftragszweig nach positiven Testberichten mit einem Merge-Commit in den Arbeitszweig zusammen und entfernt ihn danach. Den Zweig des Testers Funktion führt er vor der Prüfung durch die QA zusammen. Ein Testbericht nennt neben dem geprüften Commit den Commit des verwendeten Prüfskripts. Eine Änderung nur am Prüfskript macht vorhandene Testberichte nicht ungültig. Zweige für Machbarkeitstests und Oberflächenentwürfe entfernt der Softwarearchitekt nach der Abstimmung der Spezifikation.

### agentrun

`agentrun` ist ein Shell-Skript in `scripts/`. Es läuft dauerhaft und überwacht mit `inotifywait` die Verzeichnisse `repo/development/messages/architect/` und `repo/development/messages/devlead/`.

- Für jede neue Meldung startet es eine Sitzung der Empfängerrolle in einer tmux-Sitzung: Agentendefinition `software-architect` für `architect/`, `devlead` für `devlead/`. Name der tmux-Sitzung und der Dateien in `run/` ist `ref` mit `-` statt `/`, zum Beispiel `studio1-wp01`. Der Startauftrag nennt den Pfad der Meldung und das Entwicklungsverzeichnis. Arbeitsverzeichnis ist `work/<ref>/architect/` beziehungsweise `work/<ref>/devlead/`.
- Je `ref` läuft höchstens eine Sitzung, über beide Rollen hinweg. Eine weitere Meldung mit demselben `ref` startet erst nach dem Ende der laufenden Sitzung.
- Jede Meldung startet es genau einmal und vermerkt sie in `run/`. Nach einem Abbruch setzt es die Sitzung höchstens zweimal fort ([Fortsetzung nach einem Abbruch](#fortsetzung-nach-einem-abbruch)).
- Es beendet die Sitzung, sobald in `repo/development/messages/projectlead/` oder im Verzeichnis der jeweils anderen Rolle nach dem Start eine Meldung der gestarteten Rolle mit demselben `ref` liegt. Mit dieser Antwortmeldung endet jede Sitzung, auch bei einer Frage oder bei `amend`.
- Nach dem dritten Abbruch derselben Meldung schreibt es eine Meldung `failed` an den Projektleiter. Diese Meldung legt es über die Schnittstelle für Dateiinhalte der GitHub-API direkt auf `main` an, ohne Arbeitsverzeichnis. Gelingt das nicht, wiederholt es den Versuch bei jeder Prüfung. Eine Meldung mit ungültigem `ref` führt sofort zu `failed`, ohne Fortsetzung.

Die Sitzung startet mit festen Einstellungsquellen, sodass Agentendefinitionen, Skills, Hooks und Freigaben ausschließlich aus `devteam/` kommen:

```sh
claude --setting-sources project --permission-mode dontAsk \
  --plugin-dir ROOT/devteam --settings ROOT/devteam/settings.json \
  --session-id <kennung> \
  --agent devteam:<rolle> "<Startauftrag>"
```

`ROOT` ist das Entwicklungsverzeichnis. `<rolle>` ist `software-architect` oder `devlead`. Das Modell steht in der Agentendefinition der Rolle ([Verbrauch des Nutzungskontingents](#verbrauch-des-nutzungskontingents)).

Eine interaktive Sitzung beendet sich nicht von selbst. `agentrun` beendet sie mit `tmux kill-session`. Ein Cron-Job prüft, ob der Prozess aus `run/agentrun.pid` läuft, und startet `agentrun` sonst neu. Beim Start bewertet `agentrun` alle Meldungen und laufenden Sitzungen neu.

#### Fortsetzung nach einem Abbruch

Abbrüche derselben Aufgabe in Folge sind Abbrüche derselben Meldung. Der Zähler gehört zur Meldung und endet mit ihr. Eine neue Meldung beginnt bei null.

1. `agentrun` startet jede Sitzung mit einer eigenen Kennung (`--session-id`) und vermerkt Kennung und Zähler der Abbrüche in der Zustandsdatei der Sitzung in `run/`.
2. Bei einem Abbruch beendet es die tmux-Sitzung, falls sie noch besteht, erhöht den Zähler und setzt die Sitzung mit `--resume <kennung>` im selben Arbeitsverzeichnis fort. Der Startauftrag der Fortsetzung lautet sinngemäß: Die Sitzung wurde abgebrochen; prüfe den Stand deines Arbeitsverzeichnisses und setze die Aufgabe dort fort, wo sie abgebrochen ist. Lässt sich die Sitzung nicht fortsetzen, startet es sie mit dem ursprünglichen Startauftrag neu; das zählt als derselbe Abbruch.
3. Nach dem dritten Abbruch derselben Meldung setzt es nicht fort und schreibt `failed` an den Projektleiter. Die Meldung nennt im Text die Zahl der Abbrüche und die Art des letzten Abbruchs (Absturz, Stillstand oder fehlgeschlagener Start).

Der Projektleiter bearbeitet `failed` selbst ([Briefing Projektleiter](agentenrollen-und-briefings.md#briefing-projektleiter)).

#### Pause wegen der Nutzungsgrenze

Eine Pause ist kein Abbruch.

1. Fehlt der Herzschlag einer Sitzung länger als 15 Minuten, liest `agentrun` vor der Entscheidung über einen Stillstand den sichtbaren Inhalt der tmux-Sitzung. Enthält er die Meldung von Claude Code über die erreichte Nutzungsgrenze, gilt die Sitzung als pausiert. Der Suchtext steht als Variable am Anfang von `agentrun`.
2. Das Nutzungskontingent ist für alle Sitzungen gemeinsam. Solange eine Sitzung pausiert ist, wertet `agentrun` bei keiner Sitzung fehlenden Herzschlag als Stillstand. Es vermerkt die Pause in `run/`.
3. Nennt die Meldung einen Zeitpunkt, prüft `agentrun` ab diesem Zeitpunkt, sonst alle 15 Minuten, ob die Grenze aufgehoben ist, und schickt der pausierten Sitzung dann mit `tmux send-keys` die Aufforderung, fortzufahren. Mit der Fortsetzung beginnt die Messung des Herzschlags für alle Sitzungen neu.

### Herzschlag

Ein Hook von Claude Code für die Ereignisse `PreToolUse`, `PostToolUse` und `PostToolUseFailure` ruft bei jedem Werkzeugaufruf das Skript `scripts/heartbeat` auf. Es liest das Arbeitsverzeichnis aus den Hook-Daten. Liegt es unter `work/<vorhaben>/<rolle>/` oder `work/<vorhaben>/<arbeitspaket>/<rolle>/`, aktualisiert es den Zeitstempel der Herzschlagdatei dieses `ref` in `run/`. Sonst tut es nichts. Es gibt nichts aus und endet immer mit Exitcode 0.

Der Hook löst auch bei Werkzeugaufrufen der Unteragenten aus und meldet dabei immer das Startverzeichnis der Sitzung, also `work/<ref>/architect/` beziehungsweise `work/<ref>/devlead/`. Tester und QA laufen mit demselben Hook. Ihre Tätigkeit zählt über ihre Arbeitsverzeichnisse unter `work/` zum `ref` des Arbeitspakets.

Gemessen wird ab dem späteren Zeitpunkt von Start der Sitzung und letztem Herzschlag. 15 Minuten ohne Herzschlag gelten als Stillstand, auch wenn die Sitzung auf eine Freigabe wartet. Ausgenommen ist eine Pause wegen der Nutzungsgrenze ([Pause wegen der Nutzungsgrenze](#pause-wegen-der-nutzungsgrenze)).

### Start von Entwickler, Tester und QA

Entwicklungsleiter und, für Prüfungen, Machbarkeitstests und Oberflächenentwürfe der Phasen 1 bis 3, Softwarearchitekt starten sie mit dem Pfad ihres Übergabedokuments.

- Entwickler laufen als Unteragenten seiner Sitzung, je Entwicklergebiet mit eigener Agentendefinition. Mehrere Entwickler gleichzeitig nur für voneinander unabhängige Teile, jeder mit eigenem Arbeitsverzeichnis. Ein Unteragent arbeitet im Startverzeichnis der Sitzung, ein `cd` gilt nur für den einzelnen Befehl. Entwickler nennen ihr Arbeitsverzeichnis deshalb in jedem Befehl mit absolutem Pfad, zum Beispiel mit `git -C`.
- Tester und QA startet er über ein Startskript je Rolle in `devteam/bin/`. Das ausgeführte Programm ist einstellbar, derzeit Claude Code mit Hooks, Skills und Freigaben aus `devteam/`. Er startet das Skript im Hintergrund und wartet auf den Bericht.
  - Endet das Programm ohne Bericht, setzt das Startskript die Sitzung mit `--resume` fort, höchstens zweimal. Nach dem dritten Abbruch endet es mit Fehler und nennt die Zahl der Abbrüche und die Art des letzten; die steuernde Rolle behandelt das wie bisher.
  - Endet das Programm wegen der Nutzungsgrenze, wartet das Skript wie `agentrun` bei einer Pause und setzt die Sitzung mit `--resume` fort. Während des Wartens ruft es alle 5 Minuten `heartbeat` mit dem Arbeitsverzeichnis der Rolle auf, damit die steuernde Sitzung nicht als Stillstand gilt. Das Ergebnis des Skripts ändert sich dadurch nicht.
- Eine Teamfunktion mit direkten Nachrichten zwischen Agenten wird nicht verwendet.

### Skripte je Komponente

Im Verzeichnis jeder Komponente liegen:

- ein Prüfskript vom Tester, das die automatischen Prüfungen der Komponente ausführt
- ein Testumgebungsskript vom Entwickler, das die Komponente aus einem Arbeitsverzeichnis als Testumgebung startet und beendet

Ports und Datenbank sind Parameter oder Konfiguration, keine festen Werte. Die Testumgebung zur Abnahme verwendet feste Ports, damit der Auftraggeber seinen Tunnel nicht anpassen muss:

| Komponente | Oberfläche | Hintergrunddienst |
|---|---|---|
| pipwerk Studio | 5174 | 8001 |

Laufen ausnahmsweise mehrere Testumgebungen derselben Komponente gleichzeitig, nennt die Meldung `acceptance` die abweichenden Ports. Die Ports des Entwicklungsbetriebs (pipwerk Studio: 5173 und 8000) und der Browsertests bleiben davon unberührt. Name und Aufruf der Skripte stehen in der technischen Dokumentation der Komponente. Ein übergreifendes Skript für mehrere Komponenten gibt es nicht. Bei `fix` startet der Entwicklungsleiter die Testumgebung mit dem neuen Commit neu.

### Runner

Ein GitHub-Actions-Workflow auf einem selbst betriebenen Runner auf dem Entwicklungsrechner hält `repo/` per Fast-Forward auf dem Stand von `origin/main`. Steht `repo/` nicht auf `main` oder hat es lokale Änderungen, bricht er ohne Änderung ab. Er startet bei jedem Push auf `main` und kann auf GitHub zusätzlich von Hand gestartet werden. Ein neuer Lauf bricht einen noch laufenden oder wartenden Lauf ab, weil jeder Lauf auf den neuesten Stand von `main` bringt. Weitere Aufgaben hat er nicht.

Der Runner läuft als systemd-Dienst unter dem Benutzer, dem die Arbeitsverzeichnisse gehören. Der Workflow hat keine Auslöser für Pull Requests. Das Repository verlangt für Workflows aus Pull Requests aller externen Beitragenden eine Freigabe durch den Auftraggeber. Ein solcher Workflow wird nicht freigegeben.

### Übersicht

Die Übersicht ist eine Seite, die den Stand aller Vorhaben in drei Ebenen zeigt: je Vorhaben ein Kästchen, darunter die sechs Phasen, darunter die Arbeitspakete der Phase. Sie zeigt auch, wer gerade am Zug ist und was auf den Auftraggeber wartet.

**Quelle.** Quelle ist allein `main`: `scope.md`, `plan.md` und `waiting.md` jedes Vorhabens und die Geschichte der Meldungen unter `development/messages/`. Zustände aus `run/` und Arbeitszweige werden nicht verwendet. Jede Sitzung endet mit einer Meldung; die jüngste Meldung eines `ref` beschreibt deshalb den Stand.

**Erzeugung.**

- Die Seite ist die Datei `development/overview.html` auf `main`, eine einzige HTML-Datei ohne externe Dateien. Ort der Seite ist dieser Pfad auf `main`. Der feste Link wird noch festgelegt.
- Das Skript `tools/overview/generate.py` erzeugt sie. Es ist Python 3 ohne fremde Pakete und hat Unit-Tests. Aufruf mit dem Wurzelverzeichnis eines Repositorys mit vollständiger Geschichte und dem Pfad der Ausgabedatei. Es liest nur und schreibt nur die Ausgabedatei.
- Der Workflow `.github/workflows/overview.yml` führt es aus. Auslöser sind ein Push auf `main` mit Änderungen unter `development/` außer `development/overview.html` und der Start von Hand. Er läuft auf einem von GitHub betriebenen Runner, nicht auf dem selbst betriebenen, hat nur das Recht `contents: write` und keine Auslöser für Pull Requests. Ein neuer Lauf bricht einen laufenden ab. Der Checkout holt die vollständige Geschichte. Ändert sich die Datei, schreibt der Workflow sie mit einem eigenen Commit auf `main`. Wird der Push abgelehnt, holt er den neuen Stand, erzeugt neu und versucht es bis zu dreimal. Ein Commit mit dem Schlüssel des Workflows startet keinen weiteren Workflow. Das Repository muss dem Workflow den Push auf `main` erlauben.
- Die Seite enthält Namen, Kennungen, Phasen, Rollen und Zeitpunkte, keine Namen von Rechnern oder Benutzern, keine Pfade, keine Ports und keine Links auf Ziele außerhalb der Seite. Der Inhalt von Meldungen erscheint nicht.

**Stand eines Vorhabens und eines Pakets.** Für jedes `ref` gilt die jüngste Meldung in der Geschichte von `development/messages/` (nach dem Zeitpunkt im Dateinamen), ob noch vorhanden oder schon entfernt. Ihr Zeitpunkt ist „seit“.

| jüngste Meldung | Phase | bei wem |
|---|---|---|
| `check`, `review` | Anforderung | `check`: Softwarearchitekt; `review`: Projektleiter* |
| `specify`; `revise`, `present` zur Spezifikation | Konzeption | `specify`, `revise`: Softwarearchitekt; `present`: Projektleiter* |
| `plan`; `revise`, `present` zum Plan | Planung | `plan`, `revise`: Softwarearchitekt; `present`: Projektleiter* |
| `implement`, `fix`, `amended`, `answer` an den Entwicklungsleiter | Umsetzung | Team |
| `amend`, `answer` an den Softwarearchitekten | wie die Bezugsmeldung | Softwarearchitekt |
| `question` | wie die Bezugsmeldung | Projektleiter* |
| `acceptance` | Abnahme | Projektleiter* |
| `integrate` | Integration | Team |
| `integrated` | fertig | – |
| `failed` | wie die Bezugsmeldung | Projektleiter |

- \* Steht für das `ref` eine Zeile in `development/<vorhaben>/waiting.md` ([Eingang des Projektleiters](#eingang-des-projektleiters)), ist „bei wem“ „Auftraggeber“, die Handlung die der Zeile und „seit“ ihr Zeitpunkt, gleich welche Meldung die jüngste ist. Sonst gilt die Tabelle. Hat der Projektleiter eine Meldung ohne Antwortmeldung erledigt, zum Beispiel mit einer Anweisung in `transfer/`, bleibt „bei wem“ „Projektleiter“, bis eine jüngere Meldung desselben `ref` vorliegt. Ebenso bleibt die Zeile in `waiting.md` stehen, bis der Projektleiter sie mit seiner Folgemeldung entfernt.
- Bezugsmeldung ist die jüngste ältere Meldung desselben `ref`, deren Aufgabe in der Tabelle eine Phase hat. Gibt es keine, gilt die Phase des Vorhabens.
- Ob `revise` und `present` zur Spezifikation oder zum Plan gehören, ergibt das Feld `document`.
- Die Phase des Vorhabens ist die seiner jüngsten Meldung mit `ref` des Vorhabens, nach der ersten Meldung `implement` „Umsetzung“, bis alle Pakete fertig sind.
- Ein Vorhaben ohne `plan.md` hat keine Pakete. Seine Meldungen der Phasen 4 bis 6 tragen das `ref` des Vorhabens. Phase und „bei wem“ folgen allein diesen Meldungen nach der Tabelle; eine Phase ist grün, sobald seine jüngste Meldung zu einer späteren Phase gehört, das Vorhaben ist grün nach `integrated`.
- Pakete stehen in der Reihenfolge des Plans. Ein Paket ohne Meldung hat die Phase „wartet“, mit den Paketen, von denen es laut Plan abhängt. Ein Paket mit `done` im Plan ist „fertig“.
- „Wartet auf den Auftraggeber“ sind genau die Einträge mit „bei wem: Auftraggeber“, also die Zeilen von `waiting.md`.
- Ein Vorhaben ohne `scope.md` oder ein `ref` ohne Vorhaben erscheint nicht. Ein Vorhaben oder Paket ohne Namen erscheint mit seiner Kennung.
- Farben: Ein Vorhaben ist grau ohne Meldung, grün, wenn alle Pakete fertig sind, sonst gelb. Eine Phase ist grün, wenn das Vorhaben beziehungsweise alle Pakete sie hinter sich haben, gelb, wenn das Vorhaben oder mindestens ein Paket in ihr ist, sonst grau. Ein Paket ist in einer der Phasen 4 bis 6 grau, solange es sie nicht erreicht hat, gelb, solange es in ihr ist, und grün danach.

### Konfiguration der Rollen

Die Claude-Code-Konfiguration ist Implementierungsdetail des Entwicklungsrechners und liegt nicht im Repository:

```text
devteam/
  .claude-plugin/plugin.json   Name devteam
  agents/                      software-architect, devlead, backend, frontend, functiontest, securitytest, qa
  bin/                         Startskripte functiontest, securitytest, qa
  lib/startrole                gemeinsamer Teil der Startskripte (Quelle: tools/devhost/)
  start.conf                   Programmaufruf der Startskripte
  hooks/hooks.json             Herzschlag
  settings.json                Freigaben
```

Ein Startskript wird mit `ref` und dem Pfad des Übergabedokuments aufgerufen. Das Übergabedokument liegt unter `work/` oder wird als `<zweig>:<pfad>` angegeben. Die Freigaben erlauben Lesen in `work/`, `test/` und `repo/`, Schreiben nur in `work/` und `test/`. HTTP-Anfragen sind nur mit `curl` an `http://127.0.0.1:<port>/<pfad>` und `http://localhost:<port>/<pfad>` freigegeben, mit Optionen vor oder nach der URL, für die Prüfung in einer Testumgebung durch Tester und QA. Die Regeln stehen je erster Ziffer des Ports einzeln (zum Beispiel `Bash(curl http://127.0.0.1:8*/*)` und `Bash(curl -* http://127.0.0.1:8*/*)`), weil Claude Code `:*` nur am Ende einer Regel als Platzhalter liest. Prüfskripte unter `work/` sind mit absolutem Pfad freigegeben, dazu `npx playwright`, `node` mit Skript unter `work/` und die lesenden Befehle `ls`, `grep`, `test` und `sed -n` (Stand 2026-10-21, Frage `strategiedesign/wp02-01`).

Maßgeblich für Inhalt und Verhalten der Rollen sind die Briefings in [Agentenrollen und Briefings](agentenrollen-und-briefings.md). Die Rollendateien in `devteam/agents/` kopieren sie nicht, sondern weisen jede Rolle an, bei jedem Start ihre Abschnitte aus `repo/` (Stand `main`) zu lesen. Sie enthalten nur Angaben, die allein den Entwicklungsrechner betreffen. Eine Änderung der Briefings braucht deshalb keine Änderung in `devteam/`. Andere Änderungen an `devteam/` veranlasst der Projektleiter mit einer Anweisung in `transfer/` an eine Sitzung auf dem Entwicklungsrechner.

### Einrichtung auf dem Entwicklungsrechner

Die Schritte führt der Auftraggeber aus oder lässt sie von einer Sitzung auf dem Entwicklungsrechner ausführen. Sie werden lokal dokumentiert.

1. Runner als systemd-Dienst unter dem Benutzer der Arbeitsverzeichnisse betreiben.
2. Für diesen Benutzer `gh` mit Schreibrecht auf das Repository und Claude Code mit dem Claude-Abo anmelden. Claude Code einmal interaktiv im Entwicklungsverzeichnis starten, die Vertrauensabfrage bestätigen, die Sitzung beenden und das Verzeichnis verlassen. Das Vertrauen gilt für alle Unterverzeichnisse, auch für neu angelegte unter `work/`.
3. Im Repository auf GitHub für Workflows aus Pull Requests die Freigabe für alle externen Beitragenden verlangen.
4. `devteam/` anlegen.
5. `inotify-tools` installieren, `agentrun` und `heartbeat` aus `tools/devhost/` nach `scripts/` und `startrole` nach `devteam/lib/` installieren und den Cron-Job für `run/agentrun.pid` einrichten. `agentrun` wird aus einem Verzeichnis außerhalb von `repo/` gestartet.

## Weitere Qualitätswerkzeuge

Die verbindlichen Prüfwerkzeuge und Qualitätsregeln stehen in den [Entwicklungs-, Test- und Sicherheitsregeln](development-test-security-rules.md).

Weitere Werkzeuge, insbesondere Schnittstellen-, Architektur-, Property-based- oder Mutationstests, werden bedarfsgerecht bewertet. Ein Werkzeug gilt erst dann als Qualitätsgewinn, wenn Aufgabe, Prüfkriterium und Wirkung nachgewiesen sind.

Zugangsdaten und API-Schlüssel gehören nicht ins Repository. Claude Code wird über ein Claude-Abo mit festem Monatspreis betrieben. Das Erreichen der Nutzungsgrenze unterbricht die Arbeit nur. Die Modellzuordnung der Rollen ist änderbare Laufzeitkonfiguration.

### Verbrauch des Nutzungskontingents

Alle Rollen teilen sich ein Nutzungskontingent. Um es zu schonen, gilt:

- **Modell.** Der Softwarearchitekt arbeitet mit Opus, weil Fehler in Spezifikation und Plan viele Prüfdurchläufe auslösen. Entwicklungsleiter, Entwickler, Tester und QA arbeiten mit Sonnet. Das Modell steht in der Agentendefinition beziehungsweise im Startskript der Rolle. Der Projektleiter wählt das Modell in seiner Sitzung selbst: Opus für Phase 1 und Abstimmungen, Sonnet für Routine.
- **Gezielt lesen.** Jede Rolle liest von diesem Dokument und von [Agentenrollen und Briefings](agentenrollen-und-briefings.md) die Kurzfassung und die Abschnitte ihrer Aufgabe, große Dateien abschnittsweise. Vollständig gelesen wird nur das eigene Übergabedokument.
- **Parallele Arbeit** bleibt zulässig.

## Offene Punkte

- Vergleich von Claude und Codex als Tester mit gezielt eingebauten Fehlern, sobald der erste Durchlauf steht.
- Eigene Rolle für die Anwenderdokumentation, nur falls die Dokumente der Entwickler nicht genügen.

## Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-26 | Ablage und Übersicht: Format der Zeilen von `waiting.md` nur im Eingang des Projektleiters, Ort der Seite `development/overview.html` auf `main` mit Hinweis auf den noch festzulegenden festen Link. Vorhaben `verfahren`, Auftrag 11. |
| 2026-10-26 | Meldungstabelle: `failed` auch für eine Meldung mit ungültigem `ref` (sofort). `amend` auch, um einen Oberflächenentwurf für eine umgesetzte Ansicht vorzuschlagen. Vorhaben `verfahren`, Auftrag 10. |
| 2026-10-24 | Eingang des Projektleiters: Die zweite Wiedervorlage liegt 40 Minuten nach der Aktivierung, nicht 40 Minuten nach der ersten. Entscheidung des Entwicklungsleiters (Vorhaben `verfahren`, Auftrag 04). |
| 2026-10-24 | Vorhaben `verfahren` (Festlegungen 1 bis 7 des Auftraggebers im Chat am 2026-10-24, Spezifikation `development/verfahren/specification.md`): Abbruch, Fortsetzung durch `agentrun` und `startrole`, Pause wegen der Nutzungsgrenze, `failed` erst nach dem dritten Abbruch; Quellen der Skripte unter `tools/devhost/` und Ermittlung des Entwicklungsverzeichnisses aus dem Ablageort; Testumgebung der Skripte; Wiedervorlage und Eingang des Projektleiters mit `waiting.md` und `followup.md`; Namen von Vorhaben, Paketen und Phasen; Machbarkeitstest und Oberflächenentwurf je Ansicht als einzige Begriffe für Prototypen; neuer Abschnitt „Übersicht“ mit `overview.html` und Workflow `overview.yml`. |
| 2026-10-23 | Oberflächenentwurf nur für eine Oberfläche ohne umgesetzte Fassung. Änderungen an einer umgesetzten Oberfläche werden ohne Oberflächenentwurf direkt in der Software umgesetzt und in der Testumgebung abgenommen. Festlegung des Auftraggebers im Chat am 2026-10-23. |
| 2026-10-23 | Phase 2: Mängel aus der Abnahme einer umgesetzten Oberfläche ohne neuen Oberflächenentwurf direkt in der Software beheben. Anlass: Abnahme `backtest/wp02`, Oberflächenentwurf der Ansicht „Datenbestand“. Entscheidung des Auftraggebers im Chat am 2026-10-23. |
| 2026-10-23 | Runner: Ein neuer Lauf bricht einen laufenden oder wartenden ab (`cancel-in-progress: true` in `.github/workflows/sync-repo.yml`), damit ein Lauf, den der Runner nicht annimmt, die folgenden nicht blockiert. |
| 2026-10-22 | Erfundenen Begriff „Hauptstand“ durch den Zweignamen `main` ersetzt. Forderung des Auftraggebers im Chat am 2026-10-22. |
| 2026-10-21 | Abhängigkeit zwischen Paketen gilt mit bestandener Prüfung der QA als erfüllt, nicht erst mit der Übernahme. Festlegung des Auftraggebers im Chat am 2026-10-21 (`backtest`). |
| 2026-10-21 | Konfiguration der Rollen: Freigaben für Tester und QA erweitert (Prüfskript mit absolutem Pfad, `npx playwright`, `node`, `curl` mit Optionen vor der URL, `ls`, `grep`, `sed -n`), Schreibweise der `curl`-Regeln berichtigt. Anlass: Frage `strategiedesign/wp02-01`. |
| 2026-10-21 | Umfang der Prüfungen: Berichte höchstens etwa 60 Zeilen. Grenze der Durchläufe: ab dem dritten Durchlauf entscheidet der Softwarearchitekt rein technische Befunde zu Spezifikation und Plan selbst. Phase 4: Sicherheitsprüfung einmal je Arbeitspaket statt je Commit. Festlegung des Auftraggebers im Chat am 2026-10-21. Anlass: Verbrauch des Nutzungskontingents. |
| 2026-10-21 | Rolle Entwicklungsleiter (`devlead`) für die Phasen 4 bis 6 vom Softwarearchitekten abgetrennt: Meldungen `implement`, `fix`, `integrate` an den Entwicklungsleiter, neue Meldungen `amend` und `amended` für Lücken in Spezifikation oder Plan, `agentrun` überwacht beide Empfängerverzeichnisse. Modelle: Softwarearchitekt Opus, übrige Rollen Sonnet. Festlegung des Auftraggebers im Chat am 2026-10-21. |
| 2026-10-21 | Kurzfassung am Anfang. Abschnitt „Verbrauch des Nutzungskontingents“: Sonnet für alle Rollen, gezieltes Lesen. Anlass: Sitzungslimit nach kurzer Zeit erreicht. Festlegung des Auftraggebers im Chat am 2026-10-20. |
| 2026-10-20 | Umfang der Prüfungen: nach bestandener Prüfung keine weitere Prüfung nur für eingearbeitete Hinweise. Anlass: Spezifikation `strategiedesign` nach bestandenen Durchläufen 7 und 8 erneut zur Prüfung (Durchlauf 9), Sitzung danach wegen fehlenden Herzschlags beendet. |
| 2026-10-19 | Konfiguration der Rollen: Rollendateien verweisen auf die Briefings im Repository statt sie zu kopieren. Umgesetzt auf dem Entwicklungsrechner am 2026-10-19, Probelauf aller sechs Rollen bestanden. Festlegung des Auftraggebers im Chat am 2026-10-19. |
| 2026-10-19 | Fragen an den Auftraggeber: Regel „Lücken“, nur Lücken mit gutem technischem Grund (Betrieb, Umsetzbarkeit, Sicherheit) blockieren und führen zu Rückfragen, alle anderen werden dokumentiert, ohne den Entwicklungsprozess zu unterbrechen. Festlegung des Auftraggebers im Chat am 2026-10-19. |
| 2026-10-19 | Fragen an den Auftraggeber: Regel „Keine Einschränkung ohne Erfordernis“. Anlass: Hinweis H7 in `development/strategiedesign/reviews/requirements-9.md`, Frage nach einer Einschränkung, die nur aus einer Formulierung des Projektleiters folgte. Festlegung des Auftraggebers im Chat am 2026-10-19. |
| 2026-10-19 | Phase 2: Oberflächenentwurf vor Spezifikation und Umsetzung jeder neuen oder wesentlich geänderten Oberfläche, Bestätigung durch den Auftraggeber. Phase 3: Abnahmekriterium zur Bedienbarkeit für jedes Paket mit Oberfläche. Anlass: `strategiedesign/wp02` nicht abgenommen, Bedienung ohne Anleitung nicht erschließbar. Entscheidung des Auftraggebers im Chat am 2026-10-19. |
| 2026-10-18 | Fragen an den Auftraggeber: nur zu Entscheidungen, die nur er treffen kann. Korrekturen, die aus einer Festlegung folgen (auch Glossar), Fragen der Spezifikation und als offen gekennzeichnete Punkte erledigen die Rollen ohne Vorlage und ohne Pause; die QA ordnet ihre Befunde zu. Anlass: Rückfragen in `development/strategiedesign/reviews/requirements-8.md`, die alle ohne Auftraggeber zu klären waren. Forderung des Auftraggebers im Chat am 2026-10-18. |
| 2026-10-18 | Rein technische Ergänzungen der Spezifikation oder des Plans in Phase 4 entscheidet der Softwarearchitekt nach Prüfung durch die QA selbst, ohne Pause des Pakets; `present` nur bei Berührung von Dokumenten des Auftraggebers, bestätigten Festlegungen, Abnahmekriterien oder Umfang. Anlass: `wp02` ruhte 14 Stunden für eine rein technische Ergänzung (`development/strategiedesign/reviews/specification-4.md`). Entscheidung des Auftraggebers im Chat am 2026-10-18. |
| 2026-10-17 | Aufruf von `agentrun` an den Stand auf dem Entwicklungsrechner angeglichen: `--permission-mode dontAsk` (`scripts/agentrun`, `devteam/start.conf`). Freigaben in `devteam/settings.json` auf den Bedarf der Rollen eingeengt und je Rolle mit Probelauf geprüft (Bericht `transfer/20261017-freigaben-pruefen-bericht.md`). |
| 2026-10-17 | Freigabe für HTTP-Anfragen mit `curl` an die Testumgebung auf dem eigenen Rechner. Anlass: Frage `strategiedesign/questions/wp01-03.md`. Entscheidung des Auftraggebers im Chat am 2026-10-17. |
| 2026-10-17 | Rein technische Streitpunkte: Eine Schleife ohne Fortschritt, deren Entscheidung weder Dokumente des Auftraggebers noch bestätigte Festlegungen, Abnahmekriterien oder Umfang ändert, entscheidet der Softwarearchitekt abschließend. Anlass: Frage `strategiedesign/questions/wp01-01.md`. Entscheidung des Auftraggebers im Chat am 2026-10-17. |
| 2026-10-16 | Grenze der Durchläufe nach Fortschritt statt nach fester Zahl: weiter, solange die blockierenden Befunde weniger werden; eine Ebene höher bei unverändert wiederkehrendem Befund oder gleichbleibender Zahl; Befunde für eine höhere Ebene sofort dorthin. Phasen 1, 2, 3 und 5 angeglichen. Entscheidung des Auftraggebers im Chat am 2026-10-16. |
| 2026-10-14 | Berichte von Tester und QA im Berichtsverzeichnis `work/<ref>/reports/` statt ohne Commit im eigenen Arbeitsverzeichnis (Ablauftest, Hinweis H1 der QA). |
| 2026-10-14 | Feste Ports der Testumgebung zur Abnahme, pipwerk Studio 5174 und 8001 (Auftraggeber im Chat). |
| 2026-10-14 | Fragen gesammelt: Ein Fragedokument enthält alle offenen Fragen einer Aufgabe. Der Softwarearchitekt stellt sie erst, wenn die Aufgabe ohne Antwort nicht weiterkommt, der Projektleiter meldet `answer` erst nach der letzten Antwort. Anlass: neun einzelne Fragen im Ablauftest, jede mit Wartezeit und neuer Sitzung. Bestätigt vom Auftraggeber im Chat. |
| 2026-10-14 | Prüfung der Dokumente des Auftraggebers durch die QA in Phase 1 vor der Präsentation statt zu Beginn von Phase 2. Geprüft werden alle Dokumente des Auftraggebers laut `scope.md`, also auch Fachmodell und Strategiebeschreibungen, bei Testfällen auch deren Abbildbarkeit. Phase 2 beginnt mit `specify` und einer Nachprüfung. Anlass: Befunde der QA zu bereits bestätigten Dokumenten erzwangen eine zweite Entscheidungsrunde. Bestätigt vom Auftraggeber im Chat. |
| 2026-10-14 | Umfang der Prüfungen: Detailtiefe nach Umfang, erster Durchlauf vollständig, danach Nachprüfung, nur blockierende Befunde. Bestätigt vom Auftraggeber im Chat, gilt ab sofort auch für das laufende Vorhaben `ablauftest`. |
| 2026-10-13 | Umgebungsvariable `PIPWERK_DEV_ROOT` abgeschafft: fester Pfad im Workflow und als Variable `ROOT` in jedem Skript. Ursache des Abbruchs im ersten Ablauftest: `heartbeat` schrieb ohne die Variable keinen Herzschlag. |
| 2026-10-12 | „Handelsobjekte“ durch „Objekte“ ersetzt (Glossar). |
| 2026-10-12 | Einrichtung auf dem Entwicklungsrechner übernommen: Aufbau einer Meldung, Inhalt von `run/` und `devteam/`, Aufräumen der Arbeitsverzeichnisse, weitere Fälle von `failed`. |
| 2026-10-12 | Runner aktualisiert `repo/` mit Git statt `pipwerk-dev`. |
| 2026-10-12 | Ergebnis des Versuchs auf dem Entwicklungsrechner: Hook löst bei Unteragenten aus, Vertrauen des Entwicklungsverzeichnisses gilt für `work/`. Absolute Pfade für Entwickler. |
| 2026-10-12 | Herzschlag von Tester und QA über den Hook von Claude Code, kein eigener Herzschlag der Startskripte. |
| 2026-10-12 | An die bestätigte Präsentation des Entwicklungsprozesses angepasst: sechs Phasen mit Rückwegen, Entscheidungsrechte, Übergabedokumente mit Ablage unter `development/` und Meldungen, Schleifen und Eskalation, Start von Entwickler, Tester und QA, Skripte je Komponente. Auftragsverwaltung `ordermgr` mit Statusmodell und Akte, `work-orders/`, Arbeitspaketliste und `pipwerk-dev` entfallen. |
| 2026-10-12 | `pipwerk-dev` unterstützt `domain-core`: Prüfungen und Bereitstellung ohne laufendes Programm. Prüfung der Abnahmekriterien bei einer Bibliothek. |
| 2026-10-10 | Beteiligte: Arbeitsteilung zwischen Nutzer und Projektleiter aufgenommen. |
| 2026-10-10 | Startauftrag von `agentrun` mit Entwicklungsverzeichnis und Auftragskennung; Abschnitt zur Einführung entfernt. |
| 2026-10-09 | `work-orders/` auf `incoming/` und `outgoing/` umgestellt, neue Vorlage mit Akte. |
| 2026-10-09 | Claude-Code-Konfiguration aus dem Repository nach `devteam/` verlegt. |
| 2026-10-09 | Auftragsverwaltung als Skript `ordermgr`, Läufe des Softwarearchitekten mit `agentrun` und Herzschlag. |
| 2026-10-08 | Prozess mit Auftragsverwaltung, Runner und paralleler Bearbeitung eingeführt. Frühere Fassungen sind in Git nachvollziehbar. |
