# Prüfbericht Spezifikation, Durchlauf 13

- Vorhaben: `ablauftest`
- Phase: 2 Konzeption, Prüfung der Spezifikation nach Einwand des Auftraggebers, Nachprüfung
- Rolle: QA
- Übergabedokument: `development/ablauftest/reviews/specification-13-order.md`
- geprüfter Commit: `e1f8a8e605d3ffb8f11f652fc28220dbb0904556` (`main`)
- Arbeitsverzeichnis auf `origin/main` = `55c5ec2b5686e16cb46c71883771a466b428a14d`. Gegenüber dem geprüften Commit ist dort nur das Übergabedokument hinzugekommen (`git diff --stat e1f8a8e… HEAD`: 1 Datei, `reviews/specification-13-order.md`). Zeilenangaben gelten für beide Stände.
- Prüfschleife: Durchlauf 13, vom Projektleiter mit der Antwort auf Frage `development/ablauftest/questions/ablauftest-06.md` als Nachprüfung freigegeben
- Ergebnis: **nicht bestanden**

## Gegenstand und Umfang

Geprüft wurde `development/ablauftest/specification.md` im Umfang der Antwort auf ablauftest-06:

1. Ist der Befund Q1 aus `reviews/specification-12.md` behoben?
2. Enthalten die dafür geänderten Stellen neue Fehler?
3. Neue Befunde an unveränderten Stellen nur, wenn sie einer Anforderung widersprechen oder die Umsetzung verhindern.

Ausgewertet wurden:

- `git diff 72e46e94… e1f8a8e6… -- development/ablauftest/specification.md`. Geändert sind die Zeile „prüfung“ im Status (Zeile 9) und Abschnitt 4.4: der einleitende Absatz (Zeile 217) und der erste Punkt der Liste (Zeile 219). Das stimmt mit dem Übergabedokument überein.
- `git diff --stat 72e46e94… HEAD -- docs components`: keine Änderung. req-ui-010 (`docs/design/requirements/anforderungen-strategiedesigner.md`, Zeilen 287–296) und der Programmcode der Komponente sind seit Durchlauf 12 unverändert. `docs/design/requirements/anforderungen-gesamtsystem.md` nennt den Namen weiterhin nicht (`grep -n -i studio`: kein Treffer).
- Programmcode, um die geänderte Prüfvorschrift an den heutigen Ausgaben nachzuvollziehen: `components/pipwerk-studio/backend/src/pipwerk_studio/cli.py` und `config.py`.

Python durfte ich in dieser Prüfung nicht ausführen; der Aufruf wurde abgelehnt. Aussagen zum Verhalten von argparse beruhen auf dem Lesen des Codes und auf der bekannten Arbeitsweise der Bibliothek. Sie sind **nicht am Rechner geprüft**.

## Kontrolle des Befunds aus Durchlauf 12

### Q1 – Bedeutung von „richtig geschrieben“ und Programmname `pipwerk-studio`

| Frage aus Q1 | Neue Fassung | Ergebnis |
|---|---|---|
| Gilt der Bezeichner `pipwerk-studio` in einem geprüften Text als richtig geschrieben, wie bei der Suche im Repository? | Zeile 217: Jede Zeichenfolge `pipwerk[ -]studio` lautet genau „pipwerk Studio“ oder genau den Bezeichner `pipwerk-studio` in Kleinbuchstaben, „wie bei der Suche unten“. Das stimmt wörtlich mit Zeile 226 überein. | beantwortet |
| Meint die Fehlermeldung beim Start den Text der Ausnahme oder die ausgegebene Zeile mit dem Programmnamen davor? | Zeile 217: Geprüft wird der Text, so wie pipwerk Studio ihn ausgibt, einschließlich des vorangestellten Programmnamens. Zeile 219: „als vollständige Ausgabe auf der Fehlerausgabe“. | beantwortet |

Nachvollzogen an den heutigen Ausgaben:

- Fehlermeldung beim Start: `cli.py`, Zeile 50, gibt `pipwerk-studio: <Text>` aus. Der Text aus `config.py`, Zeilen 98–100, nennt die durchsuchten Orte mit dem Dateinamen `pipwerk-studio.ini` (`config.py`, Zeile 20). Beides ist der Bezeichner in Kleinbuchstaben und gilt nach Zeile 217 jetzt als richtig geschrieben. Der Rest des Textes lässt sich nach E10 umschreiben.
- Hilfetext: Die Zeile `usage: pipwerk-studio …` (`cli.py`, Zeile 23, `prog="pipwerk-studio"`) gilt als richtig geschrieben. Das Wort „Studio“ kommt darin nicht vor, weil `pipwerk-studio` kleingeschrieben ist und die Prüfung von `\bStudio\b` Groß- und Kleinschreibung beachtet.
- Damit widerspricht die Prüfregel nicht mehr E10 (Zeile 30) und Abschnitt 8 (Zeile 289), die den Programmnamen unverändert lassen. Das deckt sich mit der Antwort des Projektleiters auf ablauftest-06: Der Programmname bleibt als technischer Name.

**Q1 ist behoben.**

## Prüfung der geänderten Stellen auf neue Fehler

Ohne Befund geprüft:

- Status, Zeile 9: Die Ergänzung nennt Durchlauf 12, die Behebung von P1 und P2, die Einarbeitung von Q1 in Abschnitt 4.4, die Frage ablauftest-06 und die Freigabe von Durchlauf 13 richtig.
- Zeile 219: „als vollständige Ausgabe auf der Fehlerausgabe“ ist eindeutig. Die Ausgabe in `cli.py`, Zeile 50, ist eine einzige Zeile ohne Umbruch durch das Programm.
- Zeile 217, erster Satzteil: Die Zulassung von `pipwerk-studio` stimmt mit der Suche in Zeile 226 überein.

### R1 – Hilfetext „so wie pipwerk Studio ihn ausgibt“: Ergebnis hängt von der Breite der Ausgabe ab

- Fundstelle: `specification.md`, Zeile 217 (neuer Satz „Geprüft wird jeweils der Text, so wie pipwerk Studio ihn ausgibt …“), zusammen mit Zeile 220 (Hilfetext der Kommandozeile).
- Sachverhalt:
  - Der neue Satz in Zeile 217 legt fest, dass der Text geprüft wird, so wie er ausgegeben wird. Für den Hilfetext ist das die Ausgabe von argparse.
  - argparse bricht Beschreibung und Hilfetexte der Parameter selbst in Zeilen um. Die Breite richtet sich nach der Breite des Terminals (`shutil.get_terminal_size`, auch über die Umgebungsvariable `COLUMNS`). Ohne Terminal gilt eine Ersatzbreite von 80 Zeichen. Umgebrochen wird an Leerzeichen. Danach folgt eine Einrückung. Dieses Verhalten ist **nicht am Rechner geprüft**.
  - Der Hilfetext von `--config` nennt den Namen heute mitten im Satz (`cli.py`, Zeilen 34–35: „… are searched. Pipwerk Studio does not start …“). Die Beschreibung des Parsers nennt ihn ebenfalls (`cli.py`, Zeile 24). Nach E10 bleibt der Name dort und lautet „pipwerk Studio“.
  - Fällt der Umbruch bei einer Breite zwischen „pipwerk“ und „Studio“, steht in der Ausgabe „pipwerk“, ein Zeilenumbruch, Leerzeichen und dann „Studio“. Nach Zeile 217 ist dieser Text nicht richtig geschrieben: Das Wort „Studio“ steht nicht unmittelbar nach „pipwerk “. Bei derselben Fassung des Programmcodes besteht die Prüfung bei einer anderen Breite. Nach meiner Rechnung von Hand bricht die heutige Fassung bei 80 Zeichen den Namen nicht um; bei anderen Breiten und nach einer Umformulierung kann das anders sein.
  - Die Spezifikation legt nicht fest, bei welcher Breite der Hilfetext geprüft wird. Sie sagt auch nicht, ob ein Name, den der Umbruch von argparse trennt, als richtig geschrieben gilt.
  - In der Fassung von Durchlauf 12 war offen, ob der ausgegebene Text oder der Text im Programmcode gemeint ist. Erst die Festlegung auf den ausgegebenen Text macht den Umbruch für das Ergebnis maßgeblich.
- Auswirkung: Wörtlich umgesetzt hängt das Ergebnis des Tests in Zeile 220 von der Umgebung ab, in der der Test läuft, zum Beispiel davon, ob pytest die Ausgabe abfängt oder in ein Terminal schreibt und wie breit es ist. Derselbe Stand kann beim Entwickler bestehen und beim Tester Funktion scheitern. Der Entwickler muss die Breite selbst festlegen oder die Prüfung abweichend von Zeile 217 auslegen. Ein Anwender mit einem Terminal einer bestimmten Breite sieht den Namen auf zwei Zeilen verteilt.
- Kritikpunkt: Die Prüfregel für den Hilfetext ist mit dem neuen Satz in Zeile 217 nicht eindeutig. Ihr Ergebnis ist bei unverändertem Programmcode nicht unabhängig von der Umgebung.
- Fragen:
  - Bei welcher Breite der Ausgabe wird der Hilfetext geprüft?
  - Gilt ein Name, den der automatische Zeilenumbruch von argparse zwischen „pipwerk“ und „Studio“ trennt, als richtig geschrieben?
  - Ob ein solcher Umbruch beim Anwender gegen „Überall, wo pipwerk Studio seinen Namen … ausgibt, lautet er ‚pipwerk Studio‘“ in req-ui-010 (Zeile 296) verstößt, entscheidet nicht die QA. Ist das für die Spezifikation zu klären, oder gilt nur der Wortlaut des Textes ohne Zeilenumbruch?

## Unveränderte Stellen

Ich habe keinen neuen Befund an unveränderten Stellen gefunden, der einer Anforderung widerspricht oder die Umsetzung verhindert.

## Hinweise außerhalb der Befunde

Diese Hinweise beeinflussen das Ergebnis nicht.

- Zeile 217: Der Nebensatz „den die Kommandozeile Hilfetext und Fehlermeldungen voranstellt“ ist ohne Komma schwer zu lesen. Gemeint ist erkennbar: Die Kommandozeile stellt den Programmnamen dem Hilfetext und den Fehlermeldungen voran. Beim Hilfetext steht er genau genommen nach „usage:“. Ich führe das nicht als Befund, weil die Bedeutung aus dem Zusammenhang eindeutig ist.
- Zeile 217 lässt den Bezeichner `pipwerk-studio` in jedem geprüften Text zu. Ein Text, der pipwerk Studio mit dem Bezeichner statt mit dem Namen nennt, besteht die Prüfung deshalb, wenn er an anderer Stelle „pipwerk Studio“ enthält. Dieselbe Grenze hat die Suche in Zeile 226 schon in den früheren Fassungen. E10 als Vorgabe bleibt davon unberührt; die Tests sind nach Zeile 217 eine Mindestprüfung.
- `development/ablauftest/scope.md`, Zeile 3, ist korrigiert und schreibt jetzt „pipwerk Studio“. Der Hinweis aus Durchlauf 12 ist damit erledigt.
- Den Programmnamen `pipwerk-studio` in Hilfetext und Fehlermeldungen hat der Projektleiter mit der Antwort auf ablauftest-06 als technischen Namen bestätigt. Der Hinweis aus den Durchläufen 11 und 12 entfällt damit.

## Hinweis zur Prüfschleife

Durchlauf 13 hat der Projektleiter einzeln als Nachprüfung freigegeben (Antwort auf `questions/ablauftest-06.md`). Nach dem Vorschlag des Softwarearchitekten in derselben Frage geht der Fall bei einem neuen Befund wieder an den Projektleiter. Ob ein weiterer Durchlauf stattfindet, entscheidet nicht die QA.
