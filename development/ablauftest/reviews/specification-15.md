# Prüfbericht Spezifikation, Durchlauf 15

- Vorhaben: `ablauftest`
- Phase: 2 Konzeption, Prüfung der Spezifikation nach Einwand des Auftraggebers
- Rolle: QA
- Übergabedokument: `development/ablauftest/reviews/specification-15-order.md`
- geprüfter Commit: `47b2a764c163121544a56fbf897b81a65584d714` (`main`)
- Arbeitsverzeichnis auf `origin/main` = `c7a174412050a97e3017bb3942b0abe772c192ce`. Gegenüber dem geprüften Commit ist dort nur das Übergabedokument hinzugekommen (`git diff --stat 47b2a764… c7a17441…`: 1 Datei, `reviews/specification-15-order.md`). Zeilenangaben gelten für beide Stände.
- Prüfschleife: Durchlauf 15, erster Durchlauf nach dem Einwand des Auftraggebers vom 14. Oktober 2026. Nach `docs/technical/entwicklungsverfahren.md`, Zeile 90, führt ein Einwand des Auftraggebers zu einem neuen Durchlauf. Die Grenze von drei Durchläufen ist eingehalten.
- Ergebnis: **bestanden**

## Gegenstand und Umfang

Geprüft wurde `development/ablauftest/specification.md` gegen req-ui-010 und, soweit es req-ui-010 berührt, gegen `docs/design/requirements/anforderungen-gesamtsystem.md`, im Umfang des Übergabedokuments:

1. Ist der Einwand vollständig und richtig eingearbeitet?
2. Enthalten die dafür geänderten Stellen neue Fehler?
3. Sind die Hinweise U1 bis U3 aus Durchlauf 14 gegenstandslos oder gelöst, wie der Status der Spezifikation es nennt?
4. Neue Befunde an unveränderten Stellen nur, wenn sie einer Anforderung widersprechen oder die Umsetzung verhindern.

Befunde, die nur die Ausgestaltung einzelner Tests betreffen, stehen als Hinweise für die Umsetzung in einem eigenen Abschnitt. Sie beeinflussen das Ergebnis nicht.

Ausgewertet wurden:

- `git diff 1cbe4b88… 47b2a764… -- development/ablauftest/specification.md`. Geändert sind „stand“ (Zeile 6) und „prüfung“ (Zeile 9) im Status, E1 (Zeile 21), die Zeile zu `config.py`, `cli.py`, `app.py`, `revision.py` in Abschnitt 3.1 (Zeile 55), in Abschnitt 4.4 der Punkt „Hilfetext der Kommandozeile“ (Zeile 220) und der Absatz „Umbruch des Hilfetexts“ (Zeile 226), der letzte Punkt in Abschnitt 5 (Zeile 238) und der letzte Punkt in Abschnitt 8 (Zeile 294). Das stimmt mit dem Übergabedokument überein.
- Einwand auf Folie 5 in `development/ablauftest/presentations/specification.html` (`git diff 1cbe4b88… 47b2a764… -- development/ablauftest/presentations/specification.html`).
- Prüfbericht Durchlauf 14, `development/ablauftest/reviews/specification-14.md`, Hinweise U1 bis U3.
- `git diff --stat 1cbe4b88… 47b2a764… -- docs components`: keine Änderung. req-ui-010 (`docs/design/requirements/anforderungen-strategiedesigner.md`, Zeilen 287–296) und der Programmcode der Komponente sind seit Durchlauf 14 unverändert. `anforderungen-gesamtsystem.md` nennt den Namen weiterhin nicht (`grep -n -i studio`: kein Treffer).
- Programmcode zum Nachvollziehen: `components/pipwerk-studio/backend/src/pipwerk_studio/cli.py`, Zeilen 21–40.
- Suche in der ganzen Spezifikation nach Resten der alten Lösung (`grep -n -i "RawText\|Umbruch\|umbr\|COLUMNS\|Hilfetext\|Breite"`): `RawTextHelpFormatter` kommt nur noch im Status (Zeile 9) als entfallen vor. Feste Zeilenumbrüche, der Vergleich der Zeilen und die Grenze von 80 Zeichen je Zeile stehen an keiner Stelle mehr.

Python durfte ich in dieser Prüfung nicht ausführen, und den Quelltext von argparse außerhalb des Repositorys durfte ich nicht lesen; beide Aufrufe wurden abgelehnt. Aussagen zum Verhalten von argparse und zur Wirkung der Umgebungsvariablen beruhen auf der bekannten Arbeitsweise der Bibliothek und der Dokumentation von Python. Sie sind **nicht am Rechner geprüft**.

## 1. Einarbeitung des Einwands

Einwand laut Folie 5: keine festen Zeilenumbrüche im Hilfetext der Kommandozeile; der Hilfetext bricht wie bisher nach der Breite des Terminals um; der Test fasst die Zeilen vor dem Vergleich zusammen, sodass ein Umbruch zwischen „pipwerk“ und „Studio“ nicht als Fehler zählt; die übrigen Änderungen sind nicht beanstandet.

| Teil des Einwands | Stelle in der Spezifikation | Ergebnis |
|---|---|---|
| keine festen Zeilenumbrüche | Zeile 226: Der Parser behält den Formatierer ohne Angabe (`argparse.HelpFormatter`), einen anderen gibt es nicht. Beschreibung und Hilfetexte enthalten keine eigenen Zeilenumbrüche. | eingearbeitet |
| Umbruch wie bisher nach der Breite des Terminals | Zeile 226: argparse bricht sie wie bisher nach der Breite um. Zeile 55: Der Hilfetext bricht weiter nach der Breite um. `cli.py`, Zeile 22–25, setzt heute keinen Formatierer; das ist der bisherige Zustand. | eingearbeitet |
| Test fasst vor dem Vergleich zusammen | Zeile 220: Jede Folge von Leerzeichen, Tabulatoren und Zeilenumbrüchen wird vor der Prüfung zu einem Leerzeichen. | eingearbeitet |
| Umbruch zwischen „pipwerk“ und „Studio“ zählt nicht als Fehler | Zeile 220 und Zeile 226, mit Verweis auf Folie 5. Nach dem Zusammenfassen steht „pipwerk Studio“ mit genau einem Leerzeichen; die Bedingung aus Zeile 217 („unmittelbar nach ‚pipwerk ‘“) ist dann erfüllt. | eingearbeitet |
| übrige Änderungen nicht beanstandet | Die übrigen Inhalte von E10 und Abschnitt 4.4 sind unverändert (Diff). | richtig |

Die Spezifikation trifft keine eigene Festlegung über den Einwand hinaus. Die Aussage, dass ein Umbruch im Namen nicht als Fehler zählt, ist dem Auftraggeber zugeordnet (Zeile 226).

**Der Einwand ist vollständig und richtig eingearbeitet.**

## 2. Prüfung der geänderten Stellen auf neue Fehler

Ohne Befund geprüft:

- Status, Zeilen 6 und 9: Datum 2026-10-14 passt zum Einwand. Die Ergänzung nennt Durchlauf 14 als bestanden, die Hinweise U1 bis U3, den Einwand mit Verweis auf Folie 5, die eingearbeiteten Stellen E1 und Abschnitte 3.1, 4.4, 5 und 8 sowie Durchlauf 15 als ersten nach dem Einwand. Das stimmt mit dem Diff überein.
- E1 (Zeile 21), Abschnitt 5 (Zeile 238), Abschnitt 8 (Zeile 294): Der Umbruch des Hilfetexts ist als Änderung im Backend an allen drei Stellen gleichlautend entfernt. „Im Backend ändern sich nur Texte nach E10“ ist wieder richtig, weil das Verhalten der Kommandozeile gleich bleibt. Die drei Stellen widersprechen sich nicht.
- Abschnitt 3.1, Zeile 55: „Sonst unverändert“ steht nicht im Widerspruch zu Zeile 226, die den Namen im Programmcode in einer Zeile und einem Zeichenkettenliteral verlangt. Heute ist der Name in `cli.py`, Zeilen 34–35, auf zwei Literale verteilt („Pipwerk “ / „Studio“). Das Zusammenführen gehört zur Änderung der Schreibweise im Hilfetext, die Zeile 55 nennt.
- Zeile 226, letzter Satz: Ohne diese Vorgabe könnte der Name im Programmcode auf zwei Zeilen verteilt stehen, die Suche mit `git grep` (Zeile 228) fände ihn dann nicht. Die Vorgabe schließt diese Lücke. Der Test des Hilfetexts (Zeile 220) prüft die Ausgabe unabhängig davon.
- Zeile 220: Die Prüfung „richtig geschrieben“ gilt bei jeder der drei Breiten. Mit dem Zusammenfassen hängt das Ergebnis nicht mehr davon ab, wo argparse umbricht. Der Wegfall des Vergleichs der Zeilen ist folgerichtig, weil feste Zeilen nicht mehr verlangt sind.
- Zeile 217 nennt als geprüften Text „den Text, so wie pipwerk Studio ihn ausgibt“. Zeile 220 regelt für den Hilfetext ausdrücklich das Zusammenfassen davor. Die besondere Regel geht der allgemeinen vor; das ist eindeutig.
- req-ui-010 bleibt erfüllt, soweit es die Ausgabe betrifft: argparse fasst nach meiner Kenntnis Leerzeichen in Beschreibung und Hilfetexten selbst zusammen, bevor es umbricht. In der Ausgabe stehen zwischen „pipwerk“ und „Studio“ daher nur ein Leerzeichen oder ein Zeilenumbruch mit Einrückung. Das zweite ist nach dem Einwand zulässig. **Nicht am Rechner geprüft.**

Ich habe an den geänderten Stellen keinen neuen Befund gefunden. Ein Punkt zur Genauigkeit einer Aussage steht unten als Hinweis für die Umsetzung (V1).

## 3. Hinweise U1 bis U3 aus Durchlauf 14

| Hinweis | Inhalt | Neue Fassung | Ergebnis |
|---|---|---|---|
| U1 | Vergleich der Zeilen „ohne führende Leerzeichen“ scheitert bei Parametern mit kurzem Namen | Der Vergleich der Zeilen bei den drei Breiten entfällt (Zeile 220). | gegenstandslos |
| U2 | Länge der Zeilen bei 80 Zeichen ohne genannten Nachweis | Die Vorgabe „keine Zeile länger als 80 Zeichen“ entfällt (Zeile 226); argparse bricht selbst nach der Breite um. | gegenstandslos |
| U3 | Farbige Ausgabe von argparse unter Python 3.14 | Zeile 220: Der Test setzt `PYTHON_COLORS=0` und `NO_COLOR=1` und entfernt `FORCE_COLOR`. Nach der Dokumentation von Python hat `PYTHON_COLORS` Vorrang vor `NO_COLOR` und dieses Vorrang vor `FORCE_COLOR`. Die Farbe ist damit unabhängig von der Umgebung des Prüfenden abgeschaltet. Die Spezifikation kennzeichnet das als nicht am Rechner geprüft. | gelöst (nicht am Rechner geprüft) |

Die Angaben im Status (Zeile 9) zu U1 bis U3 sind richtig.

## 4. Unveränderte Stellen

Ich habe keinen neuen Befund an unveränderten Stellen gefunden, der einer Anforderung widerspricht oder die Umsetzung verhindert.

## Befunde

Keine.

## Hinweise für die Umsetzung

Dieser Hinweis betrifft nur die Genauigkeit einer Aussage, die die Ausgestaltung des Tests berührt. Er beeinflusst das Ergebnis nicht; Entwickler und Tester lösen ihn in Phase 4. Das beschriebene Verhalten von argparse ist **nicht am Rechner geprüft**.

### V1 – argparse bricht nicht nur an Leerzeichen um

- Fundstelle: `specification.md`, Zeile 226 („argparse bricht sie wie bisher nach der Breite des Terminals an Leerzeichen um“), zusammen mit Zeile 220.
- Sachverhalt: Nach meiner Kenntnis verwendet der Formatierer von argparse für Beschreibung und Hilfetexte das Modul `textwrap` mit dessen Grundeinstellung. Damit bricht er auch nach einem Bindestrich um und trennt Wörter, die länger als die verfügbare Breite sind. Bei 40 Zeichen Breite stehen für die Hilfetexte der Parameter nur etwa 20 Zeichen zur Verfügung.
- Auswirkung: Für den Namen „pipwerk Studio“ ändert das nichts. Ein Bezeichner wie `pipwerk-studio` in einer Beschreibung könnte aber als „pipwerk-“ und „studio“ ausgegeben werden; nach dem Zusammenfassen stünde dort „pipwerk- studio“. Der Test scheitert daran nicht, er erkennt den Bezeichner dann aber auch nicht. Heute enthalten Beschreibung und Hilfetexte in `cli.py` keinen solchen Bezeichner.
- Frage: Ist „an Leerzeichen“ in Zeile 226 nur als Beschreibung gemeint, oder soll der Test sich darauf verlassen? Prüft der Test bei 40 Zeichen Breite auch, dass kein Bezeichner `pipwerk-studio` in Beschreibung oder Hilfetexten getrennt wird, oder ist das ohne Bedeutung?

## Hinweise außerhalb der Befunde

- Der Einwand regelt, dass ein Umbruch zwischen „pipwerk“ und „Studio“ im Hilfetext nicht als Fehler zählt. Festgehalten ist das auf Folie 5 der Präsentation und in Abschnitt 4.4 der Spezifikation. Der Wortlaut von req-ui-010 („Überall, wo pipwerk Studio seinen Namen anzeigt oder ausgibt, lautet er ‚pipwerk Studio‘“, Zeile 296) ist unverändert. Ob req-ui-010 dazu ergänzt wird, entscheidet nicht die QA.
- Zeile 217: Der Nebensatz „den die Kommandozeile Hilfetext und Fehlermeldungen voranstellt“ ist weiterhin schwer zu lesen (Hinweis aus Durchlauf 13 und 14). Die Bedeutung ist aus dem Zusammenhang eindeutig; kein Befund.
