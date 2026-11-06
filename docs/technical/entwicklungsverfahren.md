# Entwicklungsverfahren

Stand 2026-11-06. Dieses Dokument beschreibt, wie die Vorhaben von pipwerk abgewickelt werden. Es gilt für alle laufenden und neuen Vorhaben.

## Rollen und Kommunikationsweg

```text
Auftraggeber ⇄ Projektleiter ⇄ Softwarearchitekt   (Phasen 1 bis 3)
                            ⇄ Entwicklungsleiter (Phasen 4 bis 6) ⇄ Entwickler, Tester
Softwarearchitekt ⇄ Entwicklungsleiter (Beginn der Umsetzung, Lücken in Spezifikation oder Plan während Phase 4)
```

Jede Rolle spricht nur mit ihren Nachbarn in dieser Kette. Entwickler und Tester haben keinen Kontakt zum Auftraggeber.

Der Auftraggeber entscheidet den Inhalt der Anforderungsdokumente, des Fachmodells und der Strategiebeschreibungen. Alles andere entscheiden Softwarearchitekt, Entwicklungsleiter und Entwickler in ihrer Zuständigkeit. Eine fehlende Aussage, die in ein Dokument des Auftraggebers gehört, wird nicht selbst getroffen, sondern als Frage an ihn gestellt. Bestätigungen des Auftraggebers erfolgen formlos im Chat; der Projektleiter vermerkt sie mit Datum in der jeweiligen Präsentation.

## Begriffe

| Begriff | Bedeutung |
|---|---|
| Vorhaben | Entwicklungsvorhaben mit eigener Spezifikation und eigenem Arbeitspaketplan |
| Arbeitspaket | Teil eines Vorhabens, der mit einem Ergebnis endet, das der Auftraggeber selbst erprobt und abnimmt |
| Auftrag | Umsetzbare Einheit eines Arbeitspakets für genau einen Entwickler |
| Übergabedokument | Dokument, mit dem eine Rolle ihr Ergebnis an die nächste übergibt, vollständig genug, dass die nächste Rolle ohne Rückgriff auf Gespräche arbeitet |
| Meldung | Kurze Datei, die eine Aufgabe und den Pfad des Übergabedokuments nennt und die Arbeit der empfangenden Rolle anstößt |

## Phasen

| Phase | Rolle | Ergebnis |
|---|---|---|
| 1 Anforderung | Projektleiter | fortgeschriebene Dokumente des Auftraggebers, abgestimmte Präsentation |
| 2 Konzeption | Softwarearchitekt | technische Spezifikation, bei neuer Oberfläche ein Prototyp |
| 3 Planung | Softwarearchitekt | Arbeitspaketplan |
| 4 Umsetzung | Entwicklungsleiter | je Arbeitspaket: Aufträge, Code, Testberichte, laufende Testumgebung |
| 5 Abnahme | Auftraggeber | Abnahmebericht |
| 6 Integration | Entwicklungsleiter | Arbeitspaket in `main` |

Rückwege: fehlende oder geänderte Anforderung zurück in Phase 1, Lücke in der Spezifikation zurück in Phase 2, Änderung am Plan durch Phase 3, Mangel aus der Abnahme zurück in Phase 4.

Spezifikation und Plan werden dem Auftraggeber nicht vorgelegt. Nach der Spezifikation folgen Planung und Umsetzung ohne Unterbrechung. Der Auftraggeber sieht das Ergebnis in der Abnahme.

### Phase 1 – Anforderung

Der Auftraggeber beschreibt Arbeitsabläufe, Objekte und Regeln. Der Projektleiter schreibt die Dokumente des Auftraggebers fort, legt für ein neues Vorhaben dessen Verzeichnis mit `scope.md` an und prüft die [vorgemerkten Anforderungen](../design/requirements/vorgemerkte-anforderungen.md) der betroffenen Bereiche. Er stellt die wichtigsten Aussagen in einer Präsentation dar; Entscheidungen, die nur der Auftraggeber treffen kann, stehen darin als Fragen mit Vorschlag. Nach der Bestätigung meldet er `specify` an den Softwarearchitekten.

### Phase 2 – Konzeption

Der Softwarearchitekt erstellt die Spezifikation: Programme, Bausteine, Daten, Schnittstellen, gewählte Technik mit verworfenen Alternativen und Grund, Bedienabläufe von Installation und Einrichtung. Die Spezifikation legt nur fest, was die Arbeitspakete des Vorhabens brauchen. Für eine neue Oberfläche, von der es noch keine umgesetzte Fassung gibt, lässt er vorher einen klickbaren Prototyp bauen, in dem der Auftraggeber die Testfälle des Vorhabens durchspielt. Änderungen an einer umgesetzten Oberfläche werden ohne Prototyp spezifiziert und direkt in der Software umgesetzt. Mit der fertigen Spezifikation beginnt er in derselben Sitzung Phase 3.

### Phase 3 – Planung

Der Softwarearchitekt teilt die Spezifikation in Arbeitspakete mit Ziel, Umfang, Nicht-Umfang, umgesetzten Teilen der Spezifikation, Abhängigkeiten und Abnahmekriterien. Der Plan führt je Paket den Stand `open` oder `done`. Mit dem fertigen Plan meldet der Softwarearchitekt je Paket ohne offene Abhängigkeit `implement` an den Entwicklungsleiter.

### Phase 4 – Umsetzung eines Arbeitspakets

| Rolle | Eingabe | Ergebnis |
|---|---|---|
| Entwicklungsleiter | Arbeitspaket, zugehörige Abschnitte der Spezifikation | Aufträge mit Ziel, Umfang, Abnahmekriterien und den für den Auftrag geltenden Regeln. Nach bestandenen Tests: Aufträge im Arbeitszweig des Pakets zusammengeführt, Testumgebung bereitgestellt |
| Entwickler | ein Auftrag | Code, automatische Tests, technische Dokumentation und Anwenderdokumentation im eigenen Zweig mit benanntem Commit |
| Tester Funktion | Auftrag, Commit des Entwicklers | Testbericht zu genau diesem Commit: erwartetes Verhalten, Grenzfälle, Ergebnis der automatischen Tests |

Der Tester Funktion prüft jeden Commit eines Entwicklers. Eine Nachprüfung prüft nur die Befunde des vorigen Durchlaufs und die dafür geänderten Stellen. Nach zwei Nachprüfungen ohne bestandenes Ergebnis gibt der Entwicklungsleiter das Paket mit `question` an den Projektleiter.

Die Sicherheitsprüfung nach den [Entwicklungs-, Test- und Sicherheitsregeln](development-test-security-rules.md) erfolgt nicht je Arbeitspaket, sondern einmal je Modul vor dessen erstem produktiven Einsatz. Der Auftraggeber löst sie aus. Ihre Befunde werden als Vorhaben bearbeitet.

Findet der Entwicklungsleiter eine Lücke in Spezifikation oder Plan, beschreibt er sie in `<arbeitspaket>/amend-<nn>.md`, meldet `amend` an den Softwarearchitekten und erledigt die davon unabhängigen Teile. Der Softwarearchitekt ergänzt und meldet `amended`. Ändert die Ergänzung eine Anforderung oder eine bestätigte Festlegung des Auftraggebers, stellt er stattdessen eine Frage an den Auftraggeber, und das Paket ruht bis zur Antwort.

Sind alle Aufträge zusammengeführt und läuft die Testumgebung, meldet der Entwicklungsleiter `acceptance` an den Projektleiter.

### Phase 5 – Abnahme

Der Projektleiter übergibt dem Auftraggeber die Testumgebung mit einer kurzen Anleitung: was neu ist und wie es ausprobiert wird. Der Auftraggeber erprobt und nimmt formlos ab oder nennt Mängel. Der Projektleiter schreibt den Abnahmebericht und meldet bei Mängeln `fix`, bei Abnahme `integrate` an den Entwicklungsleiter. Kommt ein Mangel nach einer Behebung unverändert zurück, legt der Projektleiter dem Auftraggeber vor, was geht und was nicht. Der Auftraggeber entscheidet.

### Phase 6 – Integration

Der Entwicklungsleiter übernimmt den abgenommenen Commit mit einem Merge-Commit in `main`, beendet die Testumgebung, entfernt Arbeitsverzeichnisse und Zweige des Pakets, trägt das Paket im Plan mit `done` ein und meldet `integrated` an den Projektleiter. Für jedes Paket, dessen Abhängigkeiten jetzt erfüllt sind, schreibt er im selben Commit eine Meldung `implement` an sich selbst.

Eine Abhängigkeit gilt als erfüllt, sobald das Paket mit `acceptance` gemeldet ist. Das abhängige Paket beginnt auf diesem Stand und übernimmt spätere Korrekturen aus der Abnahme.

## Kontext der Sitzungen

Jede Sitzung liest nur, was ihre Aufgabe braucht:

| Rolle | Liest |
|---|---|
| Softwarearchitekt | Meldung, `scope.md` und die dort genannten Dokumente des Auftraggebers, bei `amend` nur das Dokument der Lücke und den betroffenen Abschnitt der Spezifikation |
| Entwicklungsleiter | Meldung, das Arbeitspaket im Plan, die darin genannten Abschnitte der Spezifikation |
| Entwickler | Auftrag, die darin genannten Abschnitte der Spezifikation, den betroffenen Code |
| Tester | Auftrag, Commit des Entwicklers, die im Auftrag genannten Regeln |

Die [Entwicklungs-, Test- und Sicherheitsregeln](development-test-security-rules.md) und das [Glossar](glossar.md) werden nicht vollständig gelesen. Der Auftrag nennt die Regeln, die für ihn gelten. Erkenntnisse, die eine spätere Sitzung braucht, stehen im Übergabedokument, nicht im Sitzungsverlauf.

## Fragen an den Auftraggeber

Dem Auftraggeber wird nur vorgelegt, was nur er entscheiden kann: Arbeitsabläufe, Bedienablauf, Objekte, Regeln und Abnahme, die in keinem geltenden Dokument festgelegt sind. Alles andere entscheiden die Rollen selbst. Eine Lücke in den Dokumenten des Auftraggebers wird nur geschlossen, wenn die Software sonst nicht umgesetzt oder nicht sicher betrieben werden kann; sonst wird sie als offener Punkt vermerkt. Was die Dokumente des Auftraggebers nicht einschränken, ist erlaubt. Eine Frage nennt die unterbrochene Aufgabe, alle offenen Fragen dieser Aufgabe und je Frage einen Vorschlag; der Projektleiter trägt die Antworten in dasselbe Dokument ein und meldet `answer`.

## Übergabedokumente

```text
development/
  messages/
    architect/            Meldungen an den Softwarearchitekten
    devlead/              Meldungen an den Entwicklungsleiter
    projectlead/          Meldungen an den Projektleiter
  <vorhaben>/
    scope.md              geltende Dokumente des Auftraggebers (Projektleiter)
    specification.md      technische Spezifikation (Softwarearchitekt)
    plan.md               Arbeitspaketplan (Softwarearchitekt)
    presentations/        Präsentationen der Phase 1 mit Vermerk der Bestätigung (Projektleiter)
    questions/            Fragen an den Auftraggeber mit Antwort
    <arbeitspaket>/
      orders/             Aufträge an die Entwickler (Entwicklungsleiter)
      tests/              Testberichte (Tester)
      acceptance/         Abnahmeberichte (Projektleiter)
```

Namen von Vorhaben bestehen aus Kleinbuchstaben und Ziffern. Arbeitspakete heißen `wp` mit zweistelliger Nummer, Aufträge `orders/<nn>.md`, Testberichte `tests/<auftrag>-functiontest-<n>.md`, Abnahmeberichte `acceptance/<n>.md`, Fragen `questions/<name>-<nn>.md`, Lücken `<arbeitspaket>/amend-<nn>.md`. Testberichte nennen den geprüften Commit vollständig. Abnahmeberichte, Spezifikation, Plan und Präsentationen liegen auf `main`, die übrigen Dokumente eines Arbeitspakets bis zur Integration auf dessen Arbeitszweig. Verzeichnisse `reviews/` aus früheren Durchläufen bleiben als Bestand und werden nicht fortgeschrieben.

### Meldungen

Eine Meldung ist eine Markdown-Datei `development/messages/<empfänger>/<JJJJMMTThhmmss>-<absender>-<nn>.md` mit dem Zeitpunkt in UTC:

```markdown
# Meldung

- from: `architect`
- ref: `<vorhaben>/<arbeitspaket>`
- task: `acceptance`
- document: `<zweig>:<pfad>`
```

`from` ist `projectlead`, `architect` oder `devlead`. `document` nennt das Übergabedokument, auf einem Arbeitszweig in der Form `<zweig>:<pfad>`. Inhalte gehören in das Übergabedokument, nicht in die Meldung.

| Empfänger | `task` | Anlass | `document` |
|---|---|---|---|
| Softwarearchitekt | `specify` | Phase 2 beginnen | `scope.md` |
| Softwarearchitekt | `plan` | Phase 3 beginnen oder Plan ändern | `specification.md` |
| Softwarearchitekt | `amend` | Lücke in Spezifikation oder Plan schließen | Dokument der Lücke |
| Entwicklungsleiter | `implement` | Phase 4 beginnen oder fortsetzen | `plan.md` |
| Entwicklungsleiter | `amended` | Lücke geschlossen, Paket fortsetzen | Dokument der Lücke mit Ergebnis |
| Entwicklungsleiter | `fix` | Mängel aus der Abnahme beheben | Abnahmebericht |
| Entwicklungsleiter | `integrate` | abgenommenes Paket übernehmen | Abnahmebericht |
| fragende Rolle | `answer` | Frage beantwortet, Aufgabe fortsetzen | Frage mit Antwort |
| Projektleiter | `acceptance` | Testumgebung für die Abnahme bereit | Testberichte auf dem Arbeitszweig mit Commit und Port der Testumgebung |
| Projektleiter | `question` | Frage an den Auftraggeber | Frage |
| Projektleiter | `integrated` | Paket in `main` übernommen | `plan.md` |

Jede Sitzung von Softwarearchitekt und Entwicklungsleiter endet mit mindestens einer Antwortmeldung; nach `specify` sind es die Meldungen `implement` für alle Pakete ohne offene Abhängigkeit. Der Empfänger entfernt eine bearbeitete Meldung im selben Commit wie seine Antwort. Meldungen und Dokumente gelten erst als übergeben, wenn sie auf `origin/main` liegen. Wer auf `main` schreibt, arbeitet auf dem aktuellen Stand von `origin/main` und überträgt mit `git push origin HEAD:main`; lehnt GitHub ab, holt er den neuen Stand, setzt seinen Commit darauf und überträgt erneut.

## Vorgemerkte Anforderungen

Anforderungen und Überlegungen des Auftraggebers, die nicht sofort umgesetzt werden, trägt der Projektleiter in [vorgemerkte Anforderungen](../design/requirements/vorgemerkte-anforderungen.md) ein. Vor jedem neuen Vorhaben prüft er die Einträge der betroffenen Bereiche. Der Softwarearchitekt nennt im Plan die Einträge mit Priorität `erforderlich`, deren Teil der Software ein Arbeitspaket ohnehin ändert.
