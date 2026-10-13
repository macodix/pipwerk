# Prüfbericht Spezifikation, Durchlauf 14

- Vorhaben: `ablauftest`
- Phase: 2 Konzeption, Prüfung der Spezifikation nach Einwand des Auftraggebers, Nachprüfung
- Rolle: QA
- Übergabedokument: `development/ablauftest/reviews/specification-14-order.md`
- geprüfter Commit: `1cbe4b884652a11f497d32a434a1a40956d33f84` (`main`)
- Arbeitsverzeichnis auf `origin/main` = `0ee1083669ba53f4b70a3d652a60fe70051ea34f`. Gegenüber dem geprüften Commit ist dort nur das Übergabedokument hinzugekommen (`git diff --stat 1cbe4b88… 0ee10836…`: 1 Datei, `reviews/specification-14-order.md`). Zeilenangaben gelten für beide Stände.
- Prüfschleife: Durchlauf 14, vom Projektleiter mit der Antwort auf Frage `development/ablauftest/questions/ablauftest-07.md` als Nachprüfung nur für R1 und die dafür geänderten Stellen freigegeben
- Ergebnis: **bestanden**

## Gegenstand und Umfang

Geprüft wurde `development/ablauftest/specification.md` im Umfang der Antwort auf ablauftest-07:

1. Ist der Befund R1 aus `reviews/specification-13.md` behoben?
2. Enthalten die dafür geänderten Stellen neue Fehler?
3. Neue Befunde an unveränderten Stellen nur, wenn sie einer Anforderung widersprechen oder die Umsetzung verhindern.

Nach der Antwort auf ablauftest-07 stehen Befunde, die nur die Ausgestaltung einzelner Tests betreffen, als Hinweise für die Umsetzung in einem eigenen Abschnitt. Sie beeinflussen das Ergebnis nicht.

Ausgewertet wurden:

- `git diff e1f8a8e6… 1cbe4b88… -- development/ablauftest/specification.md`. Geändert sind die Zeile „prüfung“ im Status (Zeile 9), E1 (Zeile 21), die Zeile zu `config.py`, `cli.py`, `app.py`, `revision.py` in Abschnitt 3.1 (Zeile 55), in Abschnitt 4.4 der Punkt „Hilfetext der Kommandozeile“ (Zeile 220) und der neue Absatz „Umbruch des Hilfetexts“ (Zeile 226), der letzte Punkt in Abschnitt 5 (Zeile 238) und der letzte Punkt in Abschnitt 8 (Zeile 294). Das stimmt mit dem Übergabedokument überein.
- `git diff --stat e1f8a8e6… HEAD -- docs components`: keine Änderung. req-ui-010 (`docs/design/requirements/anforderungen-strategiedesigner.md`, Zeilen 287–296) und der Programmcode der Komponente sind seit Durchlauf 13 unverändert. `docs/design/requirements/anforderungen-gesamtsystem.md` nennt den Namen weiterhin nicht (`grep -n -i studio`: kein Treffer).
- Programmcode, um die Vorgaben an den heutigen Ausgaben nachzuvollziehen: `components/pipwerk-studio/backend/src/pipwerk_studio/cli.py` (Zeilen 21–40). Die Komponente verlangt Python ab 3.14 (`backend/pyproject.toml`, Zeile 6).
- `backend/tests/test_cli.py` enthält heute keine Prüfung des Hilfetexts (`grep -n -i "help\|COLUMNS\|format"`: kein Treffer). Technische und Anwenderdokumentation nennen den Hilfetext nicht (`grep -n -i "\-\-help\|Hilfetext"`: kein Treffer).

Python durfte ich in dieser Prüfung nicht ausführen, und den Quelltext von argparse außerhalb des Repositorys durfte ich nicht lesen; beide Aufrufe wurden abgelehnt. Aussagen zum Verhalten von argparse beruhen auf der bekannten Arbeitsweise der Bibliothek. Sie sind **nicht am Rechner geprüft**.

## Kontrolle des Befunds aus Durchlauf 13

### R1 – Hilfetext „so wie pipwerk Studio ihn ausgibt“: Ergebnis hängt von der Breite der Ausgabe ab

| Frage aus R1 | Neue Fassung | Ergebnis |
|---|---|---|
| Bei welcher Breite der Ausgabe wird der Hilfetext geprüft? | Zeile 220: bei den Breiten 40, 80 und 200 Zeichen, eingestellt über die Umgebungsvariable `COLUMNS` im Test. | beantwortet |
| Gilt ein Name, den der automatische Zeilenumbruch von argparse zwischen „pipwerk“ und „Studio“ trennt, als richtig geschrieben? | Zeile 226: Der Parser verwendet `argparse.RawTextHelpFormatter`. argparse bricht Beschreibung und Hilfetexte dann nicht mehr selbst um; die Zeilenumbrüche stehen im Programmcode, und der Name steht dort nie getrennt. Die Frage stellt sich damit nicht mehr. Ein getrennter Name im Programmcode ist nach Zeile 217 nicht richtig geschrieben und lässt den Test bei jeder Breite scheitern. | gegenstandslos durch die Änderung |
| Verstößt ein Umbruch beim Anwender gegen req-ui-010, oder gilt nur der Wortlaut ohne Zeilenumbruch? | Zeile 226: Bricht ein Terminal eine zu lange Zeile bei der Anzeige um, ist das eine Darstellung des Terminals, keine Ausgabe von pipwerk Studio. Der Softwarearchitekt hat das in ablauftest-07 dem Projektleiter vorgelegt; der Projektleiter hat Durchlauf 14 auf dieser Grundlage freigegeben. | beantwortet; die Bewertung gegenüber req-ui-010 liegt nicht bei der QA |

Nachvollzogen (nicht am Rechner geprüft):

- Mit `RawTextHelpFormatter` zerlegt argparse Beschreibung und Hilfetexte nur an den Zeilenumbrüchen im Text und bricht nicht nach der Breite um. Die Zeile `usage:` bricht argparse weiter nach der Breite um. Sie enthält nach `cli.py`, Zeilen 23 und 26–39, nur `pipwerk-studio` und die Parameter. Das stimmt mit Zeile 226 überein.
- Damit hängt das Ergebnis der Prüfung „richtig geschrieben“ für den Hilfetext nicht mehr von der Umgebung ab. Der Test bei drei Breiten weist das nach.
- Der Vergleich der Zeilen bei den drei Breiten (Zeile 220) weist zusätzlich nach, dass argparse die Zeilen nicht umbricht.

**R1 ist behoben.**

## Prüfung der geänderten Stellen auf neue Fehler

Ohne Befund geprüft:

- Status, Zeile 9: Die Ergänzung nennt Durchlauf 13, die Behebung von Q1, die Einarbeitung von R1 in E1 und den Abschnitten 3.1, 4.4, 5 und 8, die Frage ablauftest-07, die Freigabe von Durchlauf 14 und die Berichtigung in Abschnitt 4.4 vor Durchlauf 14. Das stimmt mit dem Diff überein.
- E1, Zeile 21; Abschnitt 5, Zeile 238; Abschnitt 8, Zeile 294: Alle drei Stellen nennen den Umbruch des Hilfetexts mit gleichem Wortlaut als einzige Änderung neben den Texten nach E10. Sie widersprechen sich nicht. Die Änderung ändert keinen Endpunkt und kein Datenformat; der Verweis auf Abschnitt 4.4 ist richtig.
- Abschnitt 3.1, Zeile 55: Die Änderung in `cli.py` ist der Datei zugeordnet, in der der Parser steht (`cli.py`, Zeile 22). Die Tabelle bleibt vollständig.
- Zeile 226: Die Begründung für `RawTextHelpFormatter`, die Aussage zur Zeile `usage:` und die Abgrenzung zum Umbruch durch das Terminal sind schlüssig und widersprechen req-ui-010 nicht. Die Aussage „nicht am Rechner geprüft“ ist gekennzeichnet.
- Zeile 220: Die Breiten sind festgelegt, das Mittel (`COLUMNS`) ist genannt, die Prüfung „richtig geschrieben“ gilt bei jeder Breite. Die Ausnahme der Einrückung ist begründet.

Ich habe an den geänderten Stellen keinen neuen Befund gefunden, der über die Ausgestaltung der Tests hinausgeht. Die Punkte zur Ausgestaltung stehen unten als Hinweise für die Umsetzung.

## Unveränderte Stellen

Ich habe keinen neuen Befund an unveränderten Stellen gefunden, der einer Anforderung widerspricht oder die Umsetzung verhindert.

## Befunde

Keine.

## Hinweise für die Umsetzung

Diese Hinweise betreffen nur die Ausgestaltung einzelner Tests. Nach der Antwort auf ablauftest-07 beeinflussen sie das Ergebnis nicht; Entwickler und Tester lösen sie in Phase 4. Das beschriebene Verhalten von argparse ist **nicht am Rechner geprüft**.

### U1 – Vergleich der Zeilen „ohne führende Leerzeichen“ bei Parametern mit kurzem Namen

- Fundstelle: `specification.md`, Zeile 220 („Zusätzlich sind die Zeilen der Beschreibung und der Hilfetexte der Parameter bei allen drei Breiten gleich, verglichen ohne die führenden Leerzeichen.“), zusammen mit Zeile 226 („Nur die Einrückung der Hilfetexte der Parameter wählt argparse nach der Breite“).
- Sachverhalt:
  - argparse setzt die Hilfetexte der Parameter in eine Spalte. Deren Lage hängt von der Breite ab: bei 80 und 200 Zeichen in der Regel Spalte 24, bei 40 Zeichen weiter links.
  - Bei einem Parameter mit langem Namen, heute `-c, --config CONFIG_PATH`, beginnt der Hilfetext in einer eigenen Zeile. Dort ist der Unterschied nur die Einrückung. Das deckt Zeile 220 ab.
  - Bei Parametern mit kurzem Namen, heute `-h, --help`, `--host HOST` und `--port PORT` (`cli.py`, Zeilen 38–39), steht die erste Zeile des Hilfetexts in derselben Ausgabezeile wie der Name des Parameters. Zwischen Name und Hilfetext stehen Leerzeichen bis zur Spalte. Deren Anzahl hängt von der Breite ab. Diese Leerzeichen sind keine führenden Leerzeichen der Ausgabezeile.
- Auswirkung: Vergleicht der Test ganze Ausgabezeilen und entfernt nur die führenden Leerzeichen, scheitert er bei 40 Zeichen an diesen Zeilen, obwohl argparse nichts umbricht. Der Test muss die Hilfetexte von den Namen der Parameter trennen, oder Zeile 220 ist so zu verstehen, dass nur die Zeilen des Hilfetexts selbst verglichen werden.
- Frage: Ist mit „Zeilen der Hilfetexte“ nur der Text des Hilfetexts gemeint, ohne den Namen des Parameters und die Leerzeichen davor? Wie grenzt der Test Beschreibung und Hilfetexte von der Zeile `usage:` und den Namen der Parameter ab, die sich nach der Breite ändern dürfen?

### U2 – Länge der Zeilen bei 80 Zeichen ohne genannten Nachweis

- Fundstelle: `specification.md`, Zeile 226 („Die Zeilen sind so umbrochen, dass der Hilfetext bei 80 Zeichen Breite keine Zeile länger als 80 Zeichen hat.“), Zeile 220.
- Sachverhalt: Zeile 226 stellt eine Vorgabe an den Programmcode. Die Liste der Tests in Zeile 220 nennt dafür keine Prüfung. Die Spalte der Hilfetexte liegt bei 80 Zeichen in der Regel bei 24; eine Zeile des Hilfetexts darf dann höchstens 56 Zeichen lang sein.
- Frage: Prüft ein Test diese Vorgabe, oder weist sie der Tester Funktion beim Lesen des Codes nach?

### U3 – Farbige Ausgabe von argparse unter Python 3.14

- Fundstelle: `specification.md`, Zeile 220; `backend/pyproject.toml`, Zeile 6 (`requires-python = ">=3.14"`).
- Sachverhalt: Nach meiner Kenntnis kann argparse ab Python 3.14 den Hilfetext farbig ausgeben. Ob es das tut, hängt vom Ausgabeziel und von Umgebungsvariablen wie `FORCE_COLOR`, `NO_COLOR` und `PYTHON_COLORS` ab. Eingefärbt werden nach meiner Kenntnis Programmname, Namen der Parameter und Überschriften, nicht die Texte. Steuerzeichen für Farben in der Ausgabe könnten den Vergleich der Zeilen beeinflussen. Das ist **nicht geprüft**.
- Frage: Legt der Test die Farbausgabe fest, zum Beispiel über die Umgebung, damit sein Ergebnis nicht von der Umgebung des Prüfenden abhängt?

## Hinweise außerhalb der Befunde

- Zeile 217: Der Nebensatz „den die Kommandozeile Hilfetext und Fehlermeldungen voranstellt“ ist weiterhin schwer zu lesen (Hinweis aus Durchlauf 13). Die Bedeutung ist aus dem Zusammenhang eindeutig; kein Befund.
- Die Frage aus R1, ob ein Umbruch durch das Terminal beim Anwender gegen req-ui-010 verstößt, beantwortet die Spezifikation in Zeile 226 aus technischer Sicht. Abschnitt 9 legt sie dem Auftraggeber nicht vor. Der Softwarearchitekt hat in ablauftest-07 dazu festgehalten: Sieht der Auftraggeber das anders, ist es eine Frage zu req-ui-010. Ob sie ihm vorgelegt wird, entscheidet nicht die QA.

## Hinweis zur Prüfschleife

Durchlauf 14 hat der Projektleiter einzeln als Nachprüfung freigegeben (Antwort auf `questions/ablauftest-07.md`). Die Prüfung ist bestanden; nach dem Vorschlag des Softwarearchitekten in derselben Frage geht die Spezifikation mit `present` an den Projektleiter. Das veranlasst nicht die QA.
