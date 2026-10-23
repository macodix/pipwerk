# Frage strategiedesign-03 – erneute Bestätigung des Prototyps

- Vorhaben: `strategiedesign`, ref `strategiedesign`
- von: Softwarearchitekt
- an: Projektleiter
- Stand: 2026-10-23

## Unterbrochene Aufgabe

`revise` für `strategiedesign` vom 23. Oktober 2026, 02:12 UTC: Einwände des Auftraggebers zum Prototyp aus `questions/strategiedesign-02.md`, Abschnitt „Antwort“. Stand:

- Prüfung der geänderten Stelle req-ui-016 („Assistent“) durch die QA, Durchlauf 16: bestanden, ohne Frage an den Auftraggeber (`development/strategiedesign/reviews/requirements-16.md`).
- Hinweise daraus: H2 (englische Bezeichnung „Assistant“) in der Spezifikation 5.5 eingearbeitet, H3 Eintrag „Assistent“ im Glossar. H1 und H4 betreffen Dokumente des Auftraggebers, siehe unten.
- Spezifikation: „Assistent“ in 5.1, 5.5 und 7; Elementbibliothek und Zeichenfläche bleiben bedienbar, während der Assistent läuft.
- Prototyp nach Auftrag `development/strategiedesign/prototype/order-04.md` geändert, Stand unten.
- Wartet auf die Bestätigung: übrige Anpassung der Spezifikation, Prüfung durch die QA, `present`; danach der neue Plan. Unverändert gilt der übrige Stand aus `strategiedesign-02.md`.

## Wo der Prototyp liegt

- Zum Ausprobieren: `development/strategiedesign/prototype/pipwerk-studio-prototyp.html` auf `main`, im Browser öffnen, ohne Server und ohne Internetverbindung. Gespeichertes aus einem früheren Test bleibt im Browser erhalten; „Neue Strategie“ beginnt immer leer.
- Bildschirmbilder, darunter „Neue Strategie“ in 1366 × 768 und die Elementbibliothek bei laufendem Assistenten in 390 × 844: `strategiedesign/proto-studio:components/pipwerk-studio/prototype/screenshots/`.
- Beschreibung und Entscheidungen des Entwicklers: `strategiedesign/proto-studio:components/pipwerk-studio/prototype/README.md`, Abschnitt „Entscheidungen zu Auftrag 04“.

Stand des Prototyps: Zweig `strategiedesign/proto-studio`, Commit `675cbbabe62ea77c78accd9b0f9ff45fb373c341`. Alle technischen Abnahmekriterien von `order-04.md` sind erfüllt. Nachweis: Browsertests auf diesem Commit, `138 passed` (Chromium, Firefox, WebKit, Bildschirmbilder).

## Was sich geändert hat

1. **Elementbibliothek nach „Neue Strategie“.** Eine Schaltfläche mit der Beschriftung „Elementbibliothek zeigen“ gab es im vorgelegten Prototyp nicht; der Entwickler konnte keine Schaltfläche ohne Funktion nachstellen. Gefunden hat er: Der Assistent und der Hinweis der leeren Zeichenfläche nennen die Elementbibliothek, bieten aber keinen Weg dorthin. In Fenstern bis 1099 Pixel Breite ist die Bibliothek verdeckt. Jetzt gibt es dort im Assistenten und auf der leeren Zeichenfläche die Schaltfläche „Elementbibliothek zeigen“. Der Assistent bleibt dabei offen. In breiteren Fenstern ist die Bibliothek immer sichtbar.
2. **Assistent.** Der geführte Aufbau heißt in der Oberfläche überall „Assistent“, im Englischen „Assistant“. Die Wendung „geführter Aufbau“ kommt in keinem Text der Oberfläche vor; ein Browsertest prüft das in beiden Sprachen.
3. **Alle Schaltflächen geprüft.** Ein Browsertest klickt in allen sechs Fenstergrößen nach „Neue Strategie“, in jedem der fünf Schritte des Assistenten und nach „Ohne Assistent weiterarbeiten“ jede Schaltfläche und jeden Reiter einzeln an. Jede bewirkt etwas. Dabei kam ein Mangel heraus und ist behoben: In 1180 × 820 lagen die Indikatoren, die der Assistent anlegt, verdeckt unter der Elementbibliothek. Jetzt rückt die Ansicht wie beim Einfügen aus der Bibliothek zu jedem neuen Element.

## Hinweise der QA zu Dokumenten des Auftraggebers

Nicht blockierend, zur Entscheidung des Projektleiters, ob er sie aufgreift (`reviews/requirements-16.md`):

- H1: `strategieregister.md` (Zeilen str-03 bis str-08) und `str-05-fachlich-zeitgebundener-volatilitaetsausbruch.md` sagen „Testentwurf des Assistenten“ und meinen einen KI-Assistenten. „Assistent“ hat damit zwei Bedeutungen. Beide Dateien stehen nicht in `scope.md`.
- H4: In req-ui-016 bezieht sich „er“ in „In der Oberfläche heißt er „Assistent““ auf „geführter Aufbau“; nach dem Nebensatz davor ist der Bezug lesbar, aber nicht eindeutig.

## Fragen

### 1. Bestätigung des Prototyps

Benötigte Entscheidung: Bestätigt der Auftraggeber den Prototyp im Stand `675cbbabe62ea77c78accd9b0f9ff45fb373c341` als Vorlage für Spezifikation und Umsetzung? Er soll dafür „Neue Strategie“ mit dem Assistenten, seine „EMA-Trendfolge“ und die Testfälle ohne Anleitung ansehen und ändern, senkrecht und waagerecht, auch in einem schmalen Fenster.

Mit der Bestätigung gelten die Punkte 1 bis 12 aus `strategiedesign-02.md`, Frage 1, und die Punkte 1 bis 3 oben als bestätigt. Jeder Einwand geht mit `revise` zurück.

Vorschlag: Prototyp bestätigen.

## Antwort

Projektleiter, 2026-10-23, nach Rücksprache mit dem Auftraggeber im Chat:

1. Nicht bestätigt. Einwand aus dem Test des Auftraggebers: Der Hinweis „Keine Strategie geöffnet“ erscheint zweimal, auf der Zeichenfläche und in der Eigenschaftenansicht. Hinweise und Dialoge des Strategiedesigners erscheinen nur in der Eigenschaftenansicht, auch der Assistent (req-ui-016 angeglichen). Die Schaltfläche „Elementbibliothek zeigen“ in schmalen Fenstern bleibt.

Nachtrag, Projektleiter, 2026-10-23, 07:30, weitere Einwände aus dem Test des Auftraggebers:

2. Indikatoren wie der EMA stehen weiterhin in einem eigenen Kasten und nicht neben dem Element ihrer ersten Verwendung (req-ui-017, Punkt 1 aus `strategiedesign-02.md`). Das ergibt wieder lange, sich kreuzende Linien quer über die Zeichenfläche.
3. Ein eingefügter EMA zeigt als Ausgang nur „Zahl“. Die Eigenschaftenansicht des Objekts beschreibt jede gelieferte Eigenschaft und Methode: was der Wert aussagt und wozu er dient. Der Ausgang zeigt den Namen der Eigenschaft (req-ui-016 angeglichen).
4. Löschen einer Verbindung direkt auf der Zeichenfläche ist ein offener Diskussionspunkt (req-ui-017), kein Einwand. Bisher geht es über die Eigenschaftenansicht.
