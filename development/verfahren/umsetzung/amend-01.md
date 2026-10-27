# Lücke in der Spezifikation: Nachweise, die die Umsetzung nicht erbringen kann (amend 01)

- Vorhaben: `verfahren`, ref `verfahren`
- von: Entwicklungsleiter
- an: Softwarearchitekt
- Stand: 2026-10-26

## Stand der Umsetzung

Arbeitszweig `verfahren/umsetzung`, Commit `60dd7ebdaaac8b819edb82a71f3f08783a730df7`. Aufträge 01 bis 10 sind zusammengeführt. Tester Funktion (je Auftrag), Tester Sicherheit (Nachprüfung `security-2.md`) und QA (Nachprüfung `qa-2.md`) haben bestanden. Berichte: `verfahren/umsetzung:development/verfahren/umsetzung/tests/`. Eine Testumgebung mit Dienst gibt es nicht, das Vorhaben hat keinen Dienst.

Die unabhängigen Teile sind erledigt. Zwei Nachweise sind aus der Umsetzung heraus nicht zu erbringen, beide verweist die Spezifikation auf `amend`.

## 1. Suchtext der Nutzungsgrenze (3.3 Punkt 5)

Hindernis: Das Team hat keine echte Ausgabe von Claude Code bei erreichter Nutzungsgrenze. Eine Probe würde das gemeinsame Nutzungskontingent erschöpfen und war nicht freigegeben. Das Protokoll in `run/` war den Sitzungen nicht zugänglich. `LIMIT_TEXT` und `LIMIT_TIME_PATTERN` in `agentrun` und `startrole` sind deshalb Platzhalter; die Ersatzprogramm-Szenarien `limit-*` verwenden denselben Platzhalter. Ohne echten Wortlaut erkennt `agentrun` auf dem Entwicklungsrechner keine Pause; ein Stillstand durch die Nutzungsgrenze gilt wie bisher als Abbruch (im README beschrieben).

Benötigte Entscheidung: Wie wird der Wortlaut nachgewiesen?

Vorschlag: Der Projektleiter lässt den Wortlaut aus einer echten Sitzung auf dem Entwicklungsrechner übernehmen, sobald eine Sitzung die Grenze erreicht hat (Protokoll in `run/` oder sichtbarer Inhalt der tmux-Sitzung), und gibt ihn in einer Meldung `answer` mit dem Fund an. Der Entwicklungsleiter trägt ihn dann in `agentrun`, `startrole` und die Szenarien `limit-*` ein und lässt Tester Funktion und QA nachprüfen. Bis dahin wird der Platzhalter ausdrücklich als offen abgenommen (E2: Installation erst danach).

## 2. Push des Workflows auf `main` (7.1)

Hindernis: Ob `main` den direkten Push des Workflows `overview` zulässt, lässt sich erst prüfen, wenn Workflow und `tools/overview/generate.py` auf `main` liegen, und nur auf GitHub (Schutzregeln, Einstellung „Workflow permissions“). Der Zugriff darauf ist dem Team nicht freigegeben.

Vorschlag: Der Nachweis erfolgt bei der Integration (`integrate`): Der Entwicklungsleiter übernimmt den abgenommenen Commit nach `main` und prüft den ersten Lauf des Workflows. Scheitert der Push an einer Schutzregel, geht das als Frage über den Projektleiter an den Auftraggeber, weil die Einstellung nur der Mensch ändern darf.

## 3. Weitere Punkte für den Softwarearchitekten

- Spezifikation 3.2 Punkt 2: Schlägt auch der Neustart mit dem ursprünglichen Startauftrag fehl, zählt `agentrun` das als weiteren Abbruch und startet sofort erneut; die Spezifikation nennt diesen Fall nicht (Hinweis des Testers Funktion zu Auftrag 09). Vorschlag: Spezifikation ergänzen.
- Die beiden Verfahrensdokumente `entwicklungsverfahren.md` und `agentenrollen-und-briefings.md` sind auf `origin/main` weitergelaufen; beim Zusammenführen entstehen Konflikte (Hinweis 1 der QA). Ich löse sie bei `integrate` auf und lasse die QA die aufgelösten Stellen prüfen, wenn sie Festlegungen berühren.
- Offene Hinweise der QA, nicht in meiner Zuständigkeit (qa-1.md Hinweise 3, 4, 9): Adresse der Übersicht in den READMEs, Ort des Formats von `waiting.md`, Wort „Prototypen“ in der bestätigten Präsentation `praesentation-entwicklungsprozess.html`.

## Ergebnis (Softwarearchitekt, 2026-10-26)

Die Spezifikation ist ergänzt, siehe ihren Änderungsnachweis vom 2026-10-26. Prüfung durch die QA bestanden: `development/verfahren/reviews/specification-5.md`.

1. Wortlaut der Nutzungsgrenze: 3.3 Punkt 5. Auch der Softwarearchitekt hat keinen belegten Wortlaut; Probe, `run/` und Suche außerhalb waren in seiner Sitzung nicht zugänglich. Der Platzhalter bleibt, die Pause wird bis zum Nachweis als Stillstand behandelt, der Nachweis erfolgt im Betrieb. Damit ist ein Satz der Festlegung 1 bis zum Nachweis nicht erfüllt. Die Ergänzung ist deshalb nicht rein technisch: Meldung `present` an den Projektleiter, die Umsetzung ruht bis zur Bestätigung durch den Auftraggeber und wird dann mit `implement` fortgesetzt.
2. Push des Workflows: 7.1. Nachweis bei `integrate` an einem Commit des Workflows auf `origin/main` innerhalb von 30 Minuten, sonst `question`.
3. Weitere Punkte:
   - Fehlgeschlagener Neustart: 3.2 Punkt 2, wie umgesetzt.
   - Konflikte der Verfahrensdokumente: wie vorgeschlagen bei `integrate`, keine Änderung der Spezifikation.
   - Hinweis 3 der QA: 7.1, Ort der Seite bis zum festen Link in Verfahren und README.
   - Hinweis 4 der QA: Abschnitt 8, Format von `waiting.md` in die Ablage des Verfahrens, die README verweist darauf.
   - Hinweis 9 der QA: Abschnitt 8, die Präsentation Entwicklungsprozess wird nach der Regel im Status des Verfahrens angeglichen.
   - Diese Punkte sind rein technisch. Sie gelten für die Fortsetzung der Umsetzung zusammen mit Punkt 1.
