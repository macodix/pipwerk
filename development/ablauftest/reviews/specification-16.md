# Prüfbericht Spezifikation, Durchlauf 16

- Vorhaben: `ablauftest`
- Phase: 2 Konzeption, Prüfung der Spezifikation, Nachprüfung nach dem Einwand des Auftraggebers vom 14.10.2026
- Rolle: QA
- Übergabedokument: `development/ablauftest/reviews/specification-16-order.md`
- geprüfter Commit: `ad72f879f2caa83a3c6e08c388eeb46baaf55063`
- Prüfgegenstand: `development/ablauftest/specification.md`

## Ergebnis

**bestanden**

Der Hinweis V1 aus Durchlauf 15 ist erledigt. An den geänderten Stellen gibt es keinen neuen Befund. Ein Punkt zur Ausgestaltung des Tests steht unten als Hinweis für die Umsetzung (W1).

## 1. Geprüfter Stand

- Das Arbeitsverzeichnis steht auf `origin/main`, Commit `629a38eac7c5aff514a5b9e8563bb78639649279`. Dieser Commit enthält gegenüber `ad72f879…` nur das Übergabedokument `development/ablauftest/reviews/specification-16-order.md` (`git diff --stat ad72f879f2caa83a3c6e08c388eeb46baaf55063 origin/main`: eine Datei, 36 eingefügte Zeilen). Die Spezifikation ist in beiden Commits gleich.
- Änderungen seit Durchlauf 15: `git diff 47b2a764c163121544a56fbf897b81a65584d714 ad72f879f2caa83a3c6e08c388eeb46baaf55063 -- development/ablauftest/specification.md`. Geändert sind genau die Zeile „prüfung“ im Status (Zeile 9) und der Absatz „Umbruch des Hilfetexts“ in Abschnitt 4.4 (Zeile 226). Das entspricht dem Übergabedokument.

## 2. Hinweis V1 aus Durchlauf 15

| Hinweis | Inhalt | Neue Fassung (Zeile 226) | Ergebnis |
|---|---|---|---|
| V1 | Die Spezifikation sagte, argparse breche „an Leerzeichen“ um. argparse bricht aber auch nach Bindestrichen und trennt zu lange Wörter. Ein Bezeichner `pipwerk-studio` in einem Hilfetext könnte getrennt und vom Test nicht erkannt werden. | argparse bricht mit dem Modul `textwrap` um: an Leerzeichen, nach Bindestrichen und bei zu langen Wörtern auch innerhalb des Worts. Gekennzeichnet als „laut Dokumentation von Python, nicht am Rechner geprüft“. Beschreibung und Hilfetexte enthalten den Bezeichner `pipwerk-studio` nicht. Der Programmname steht nur in der Zeile `usage:` und vor Fehlermeldungen. | erledigt |

Einzelheiten:

- Die Beschreibung des Umbruchs stimmt mit meiner Kenntnis von argparse überein: `HelpFormatter` bricht Beschreibung und Hilfetexte mit `textwrap` in dessen Grundeinstellung um. Am Rechner konnte ich das nicht prüfen; das Ausführen von Python und das Lesen der Python-Bibliothek waren in dieser Prüfung nicht erlaubt. Die Spezifikation kennzeichnet die Aussage selbst als nicht am Rechner geprüft. Das reicht für die Spezifikation.
- Die neue Festlegung beantwortet die Frage aus V1: Der Test muss den Bezeichner in Beschreibung und Hilfetexten nicht erkennen, weil er dort nicht steht.
- Der heutige Stand von `components/pipwerk-studio/backend/src/pipwerk_studio/cli.py` passt dazu: `prog="pipwerk-studio"` (Zeile 23). Beschreibung (Zeile 24) und Hilfetexte (Zeilen 31 bis 39) enthalten den Bezeichner nicht. Den Programmnamen setzt der Code selbst nur vor zwei Fehlermeldungen (Zeilen 50 und 57).
- Für den Namen „pipwerk Studio“ ändert der Umbruch nach Bindestrichen nichts. Ein Umbruch zwischen „pipwerk“ und „Studio“ zählt nach dem Einwand nicht als Fehler (Folie 5, `presentations/specification.html` Zeile 119). Die Spezifikation hält das weiter fest (Zeile 226).

## 3. Geänderte Stellen auf neue Fehler

- Zeile 226: Kein Widerspruch zu req-ui-010, zu E10 (Zeile 30) oder zum Punkt „Hilfetext der Kommandozeile“ (Zeile 220). Dass Beschreibung und Hilfetexte den Bezeichner nicht enthalten, ist eine zusätzliche Festlegung für den Programmcode. E10 erlaubt Bezeichner, verlangt sie aber nirgends in Hilfetexten. Deshalb gibt es keinen Konflikt.
- Zeile 226 widerspricht nicht dem Einwand auf Folie 5: Es gibt weiterhin keinen eigenen Formatierer und keine festen Zeilenumbrüche.
- Zeile 9 (Status): Die Einträge zu Durchlauf 15 und V1 sind richtig. Durchlauf 15 ist bestanden, und V1 ist in Abschnitt 4.4 eingearbeitet.

Kein neuer Befund.

## 4. Unveränderte Stellen

Ich habe an unveränderten Stellen nichts gefunden, das einer Anforderung widerspricht oder die Umsetzung verhindert.

## Befunde

keine

## Hinweise für die Umsetzung

Diese Hinweise betreffen nur die Ausgestaltung einzelner Tests oder die Lesbarkeit. Sie machen die Prüfung nicht „nicht bestanden“.

### W1 – Neue Festlegung in Abschnitt 4.4 ohne Prüfung

- Fundstelle: `specification.md`, Zeile 226 („Beschreibung und Hilfetexte enthalten deshalb den Bezeichner `pipwerk-studio` nicht“), zusammen mit Zeile 217, Zeile 220 und Zeile 228.
- Sachverhalt: Keiner der genannten Tests prüft diese Festlegung. Wird der Bezeichner bei 40 Zeichen Breite nach dem Bindestrich getrennt, steht nach dem Zusammenfassen „pipwerk- studio“. Darauf passt weder das Muster `pipwerk[ -]studio` noch `\bStudio\b`. Der Test schlägt dann nicht an. Die Suche im Repository (Zeile 228) lässt den Bezeichner im Programmcode als zulässigen Treffer durch.
- Frage: Soll der Test diese Festlegung prüfen, zum Beispiel an der unformatierten Beschreibung und den Hilfetexten des Parsers? Oder genügt es, sie bei der Prüfung des Codes zu sichten? Das entscheiden Entwickler und Tester in Phase 4.

### W2 – Bezug von „Dabei“ in Zeile 226

- Fundstelle: `specification.md`, Zeile 226, Satz „Dabei kann ein Umbruch zwischen „pipwerk“ und „Studio“ fallen.“
- Sachverhalt: Vor der Änderung stand dieser Satz direkt nach dem Satz über den Umbruch. Jetzt folgt er auf den Satz über den Programmnamen. „Dabei“ bezieht sich weiter auf den Umbruch durch argparse; das ist aus dem Zusammenhang eindeutig. Kein Befund, nur ein Hinweis zur Lesbarkeit.

### Aus früheren Durchläufen

- Zeile 217: Der Nebensatz „den die Kommandozeile Hilfetext und Fehlermeldungen voranstellt“ ist weiterhin schwer zu lesen (Hinweis aus Durchlauf 13 bis 15). Die Bedeutung ist eindeutig; kein Befund.
- Der Wortlaut von req-ui-010 ist unverändert. Dass ein Umbruch zwischen „pipwerk“ und „Studio“ im Hilfetext nicht als Fehler zählt, steht nur auf Folie 5 und in der Spezifikation. Ob req-ui-010 ergänzt wird, entscheidet nicht die QA (Hinweis aus Durchlauf 15).
