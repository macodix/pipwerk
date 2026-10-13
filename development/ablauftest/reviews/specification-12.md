# Prüfbericht Spezifikation, Durchlauf 12

- Vorhaben: `ablauftest`
- Phase: 2 Konzeption, Prüfung der Spezifikation nach Einwand des Auftraggebers, Nachprüfung
- Rolle: QA
- Übergabedokument: `development/ablauftest/reviews/specification-12-order.md`
- geprüfter Commit: `72e46e94dfde7ab96b26e89d2c8ba7c6d8ea0ecd` (`main`)
- Arbeitsverzeichnis auf `origin/main` = `3e1d39184842420f6ae862103fc6d7a51f75afc1`. Gegenüber dem geprüften Commit ist dort nur das Übergabedokument hinzugekommen (`git diff --stat 72e46e94… 3e1d391…`: 1 Datei, `reviews/specification-12-order.md`). Zeilenangaben gelten für beide Stände.
- Prüfschleife: Durchlauf 12, vom Projektleiter mit der Antwort auf Frage `development/ablauftest/questions/ablauftest-05.md` als Nachprüfung freigegeben
- Ergebnis: **nicht bestanden**

## Gegenstand und Umfang

Geprüft wurde `development/ablauftest/specification.md` im Umfang der Antwort auf ablauftest-05:

1. Sind die Befunde P1 und P2 aus `reviews/specification-11.md` behoben?
2. Enthalten die dafür geänderten Stellen neue Fehler?
3. Neue Befunde an unveränderten Stellen nur, wenn sie einer Anforderung widersprechen oder die Umsetzung verhindern.

Ausgewertet wurden:

- `git diff c0836262… 72e46e94… -- development/ablauftest/specification.md`. Geändert sind die Zeile „prüfung“ im Status (Zeile 9), E10 (Zeile 30) und Abschnitt 4.4 (Zeilen 217–224). Das stimmt mit dem Übergabedokument überein.
- `git diff --stat c0836262… HEAD`: Außer der Spezifikation sind nur Unterlagen unter `development/` geändert. req-ui-010 (`docs/design/requirements/anforderungen-strategiedesigner.md`, Zeilen 287–296) ist seit Durchlauf 11 unverändert. `docs/design/requirements/anforderungen-gesamtsystem.md` nennt den Namen weiterhin nicht (`grep -n -i studio`: kein Treffer). Ein Widerspruch zu E10 besteht dort nicht.
- Programmcode der Komponente, um die neue Prüfvorschrift in Abschnitt 4.4 an den heutigen Texten nachzuvollziehen: `backend/src/pipwerk_studio/cli.py`, `app.py`, `config.py`, `revision.py`, `settings_service.py`.

Python konnte ich in dieser Prüfung nicht ausführen. Aussagen zum Verhalten von argparse, FastAPI und Pydantic beruhen auf dem Lesen des Codes und sind **nicht am Rechner geprüft**.

## Kontrolle der Befunde aus Durchlauf 11

### P1 – Prüfung der Schnittstellenbeschreibung gegen die Bezeichner nach E10

| Frage aus P1 | Neue Fassung | Ergebnis |
|---|---|---|
| Gehört das Feld `title` der Schemas zur Prüfung? | Zeile 224: Die Felder `title` unter `components.schemas` und unter `paths` werden nicht geprüft. | beantwortet |
| Ist dieser Titel eine Nennung oder ein Bezeichner? | Zeile 224: Bezeichner nach E10, weil Pydantic und FastAPI ihn aus Namen von Klassen, Feldern und Parametern erzeugen. | beantwortet |
| Heißt „enthält ‚Studio‘“ Zeichenfolge oder ganzes Wort? | Zeile 217: ganzes Wort, Groß- und Kleinschreibung beachtet, Wortgrenzen wie bei `\bStudio\b`. `StudioLanguage` ist damit kein Treffer. | beantwortet |

Die geprüften Felder sind einzeln genannt: `info.title` genau „pipwerk Studio“; `info.description`; unter `paths` jedes `summary` und `description`; unter `components.schemas` jedes `description`, auch bei Eigenschaften. Nach dem Code in `app.py` liegen die heutigen Nennungen genau in diesen Feldern: Titel in Zeile 120, `summary` und `description` in den Zeilen 128–135, 149–156 und 164–170, Docstrings der Modelle in den Zeilen 46, 58 und 70. Alle lassen sich nach E10 so umschreiben, dass die Prüfung besteht.

**P1 ist behoben.**

### P2 – Geltungsbereich der Kurzform „Studio“

| Frage aus P2 | Neue Fassung (E10, Zeile 30) | Ergebnis |
|---|---|---|
| Gilt die Ersetzung der Kurzform auch für Testtexte, Paketbeschreibung und Beispielkonfiguration? | Ersetzt wird in (a), (b) und (c). In (d) wird nur die volle Form angeglichen; die Kurzform darf dort überall bleiben, „auch in Testtexten, Paketbeschreibung, Beispielkonfiguration und Texten von Ausnahmen“. | beantwortet |
| Fallen nicht ausgegebene Texte von Ausnahmen unter „Kommentare und Docstrings“ oder unter die übrigen Teile von (d)? | Sie sind ausdrücklich genannt; die Kurzform darf bleiben. „Wird ein Text aus (d) angezeigt oder ausgegeben, gilt für ihn (a) beziehungsweise (b).“ | beantwortet |

Der frühere Widerspruch zwischen den beiden Sätzen ist entfallen. Die genannten Beispiele sind jetzt eindeutig: `frontend/e2e/studio.spec.ts`, `frontend/src/settingsApi.test.ts`, `frontend/src/settingsApi.ts` und `frontend/src/revisionApi.ts` dürfen die Kurzform behalten. Abschnitt 3.1 (Zeile 76: `revisionApi.ts` „nur die Verschiebungen“) widerspricht dem nicht mehr. Die Ausnahme in `settings_service.py`, Zeile 59, wird in `app.py`, Zeile 141, protokolliert und ist damit eine Ausgabe nach (b). Das stimmt mit Abschnitt 3.1, Zeile 56, und mit der Prüfung in Abschnitt 4.4, Zeile 223, überein.

**P2 ist behoben.**

## Prüfung der geänderten Stellen auf neue Fehler

Ohne Befund geprüft:

- Status, Zeile 9: Die Ergänzung zu Durchlauf 11 nennt die Änderungen an E10 und Abschnitt 4.4 und die Frage ablauftest-05 richtig.
- E10, Zeile 30: Die übrigen Teile (Bezeichner, Ausnahme von `docs/design/` und `development/`) sind unverändert. Das Beispiel „Studio-Komponente“ ist jetzt (c) zugeordnet und stimmt mit Abschnitt 7, Zeile 274, überein.
- Abschnitt 4.4, Zeile 222: Die Protokolleinträge in `revision.py`, Zeilen 85 und 165, nennen heute die Kurzform. Nach E10 (b) erhalten sie „pipwerk Studio“. Die Forderung „enthält ‚pipwerk Studio‘“ ist damit erfüllbar.
- Abschnitt 4.4, Zeile 223: Der Protokolleintrag bei ungültiger gespeicherter Sprache ist der Text der Ausnahme (`app.py`, Zeile 141). Er muss nur richtig geschrieben sein. Das widerspricht E10 nicht.

### Q1 – Die neue Bedeutung von „richtig geschrieben“ schließt den Programmnamen `pipwerk-studio` aus, der nach E10 bleibt

- Fundstelle: `specification.md`, Zeile 217 (Abschnitt 4.4, Bedeutung von „richtig geschrieben“), mit den Zeilen 219 und 220. Dagegen stehen E10 (Zeile 30), Abschnitt 8 (Zeile 289) und die Suche in Abschnitt 4.4 (Zeile 226).
- Sachverhalt:
  - Zeile 217 lautet: „Der Text enthält keine Zeichenfolge `pipwerk[ -]studio` (ohne Beachtung der Groß- und Kleinschreibung) in anderer Schreibweise als ‚pipwerk Studio‘“. Der Bezeichner `pipwerk-studio` passt auf das Muster und ist eine andere Schreibweise als „pipwerk Studio“. Nach dieser Bedeutung ist ein Text mit `pipwerk-studio` also nicht richtig geschrieben.
  - E10 (Zeile 30) und Abschnitt 8 (Zeile 289) lassen den Programmnamen `pipwerk-studio` ausdrücklich unverändert.
  - Zeile 220 verlangt für den Hilfetext der Kommandozeile (`--help`): enthält „pipwerk Studio“ und ist richtig geschrieben. Der Parser setzt `prog="pipwerk-studio"` (`cli.py`, Zeile 23). argparse beginnt den Hilfetext mit der Zeile `usage: pipwerk-studio …`. Dieses Verhalten von argparse ist **nicht am Rechner geprüft**. Im Bericht zu Durchlauf 11 steht derselbe Sachverhalt; der Softwarearchitekt führt ihn in ablauftest-05 unter „Hinweise außerhalb der Frage“ selbst an.
  - Zeile 219 verlangt dasselbe für die Fehlermeldung beim Start ohne Startkonfiguration. `cli.py`, Zeile 50, gibt sie als `pipwerk-studio: <Text>` auf der Fehlerausgabe aus. Ob die Prüfung den Text der Ausnahme oder die ausgegebene Zeile meint, sagt Zeile 219 nicht. Ist die ausgegebene Zeile gemeint, gilt dasselbe wie beim Hilfetext.
  - Die Suche im Repository (Zeile 226) lässt den Bezeichner `pipwerk-studio` in Kleinbuchstaben ausdrücklich zu. Die neue Bedeutung in Zeile 217 enthält diese Ausnahme nicht.
  - Die Fassung aus Durchlauf 11 verlangte nur „weder ‚Pipwerk Studio‘ noch die Kurzform ‚Studio‘ ohne vorangestelltes ‚pipwerk ‘“. Der Programmname war damit nicht betroffen. Der Fehler ist mit der Änderung zu P1 neu entstanden.
- Auswirkung: Wörtlich umgesetzt scheitert der Test des Hilfetexts, solange der Programmname `pipwerk-studio` bleibt. Der Entwickler muss dann entweder den Programmnamen ändern, was E10 verbietet, oder die Prüfung abweichend von Zeile 217 auslegen. Dasselbe gilt für die Fehlermeldung beim Start, wenn die ausgegebene Zeile geprüft wird. Die Umsetzung ist an dieser Stelle nicht eindeutig möglich.
- Kritikpunkt: Die Bedeutung von „richtig geschrieben“ in Zeile 217 widerspricht E10 und der Suche in Zeile 226, weil sie den nach E10 unveränderten Bezeichner `pipwerk-studio` als falsche Schreibweise wertet.
- Fragen:
  - Gilt der Bezeichner `pipwerk-studio` in einem geprüften Text als richtig geschrieben, wie bei der Suche in Zeile 226?
  - Meint „Fehlermeldung beim Start ohne Startkonfiguration“ in Zeile 219 den Text der Ausnahme oder die Zeile, die das Programm auf der Fehlerausgabe ausgibt, einschließlich des Programmnamens davor?

## Unveränderte Stellen

Ich habe keinen neuen Befund an unveränderten Stellen gefunden, der einer Anforderung widerspricht oder die Umsetzung verhindert.

## Hinweise außerhalb der Befunde

Diese Hinweise beeinflussen das Ergebnis nicht.

- E10, Zeile 30: Die Aufzählung in (d) nennt „Paketbeschreibung, Beispielkonfiguration, Kommentare, Docstrings und Testtexte im Programmcode“. Texte von Ausnahmen stehen dort nicht. Erst der spätere Satz „auch in … Texten von Ausnahmen“ ordnet sie (d) zu. Zusammen mit dem Satz „Wird ein Text aus (d) angezeigt oder ausgegeben, gilt (a) beziehungsweise (b)“ ist das Ergebnis eindeutig. Ich führe es deshalb nicht als Befund.
- Der Hinweis aus Durchlauf 11 zum Programmnamen in Ausgaben (`usage: pipwerk-studio`, `pipwerk-studio:` vor Fehlermeldungen) gilt weiter. Ob der Auftraggeber „wo pipwerk Studio seinen Namen … ausgibt“ ebenso versteht wie E10, entscheidet nicht die QA. Befund Q1 betrifft davon unabhängig nur die Widersprüchlichkeit innerhalb der Spezifikation.
- `development/ablauftest/scope.md`, Zeile 3, schreibt weiter „Pipwerk Studio“. Das Dokument gehört dem Projektleiter.

## Hinweis zur Prüfschleife

Durchlauf 12 hat der Projektleiter einzeln als Nachprüfung freigegeben (Antwort auf `questions/ablauftest-05.md`). Der Vorschlag des Softwarearchitekten in derselben Frage sieht vor, dass der Fall bei einem erneuten Befund wieder an den Projektleiter geht. Ob ein weiterer Durchlauf stattfindet, entscheidet nicht die QA.
