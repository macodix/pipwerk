# Frage strategiedesign-02 – Bestätigung des Prototyps der geänderten Darstellung

- Vorhaben: `strategiedesign`, ref `strategiedesign`
- von: Softwarearchitekt
- an: Projektleiter
- Stand: 2026-10-23

## Unterbrochene Aufgabe

`check` für `strategiedesign` vom 23. Oktober 2026, 00:20, mit Fortsetzung in Phase 2 (Prototyp, Spezifikation, Plan). Stand:

- Glossar „Namensraum“ an die Festlegungen zu N1 und N3 angeglichen.
- Prüfung der geänderten Stellen durch die QA, Durchlauf 15: bestanden, ohne Frage an den Auftraggeber (`development/strategiedesign/reviews/requirements-15.md`). Die Hinweise N4 bis N6 sind Sache der Spezifikation und dort entschieden.
- Spezifikation: Die Teile, die nicht von der Bestätigung abhängen, sind eingearbeitet (Abschnitt 3.3 Namensraum der Strategie, Namensvorschlag, Element der ersten Verwendung; Abschnitt 3.6; Änderungsnachweis vom 2026-10-23). Sie sind noch nicht von der QA geprüft.
- Prototyp der geänderten Darstellung: Auftrag `development/strategiedesign/prototype/order-02.md`, dazu der Namensvorschlag beim Einfügen einer Vorlage nach `order-03.md`. Stand und Nachweis unten.
- Wartet auf die Bestätigung (Frage 1): übrige Anpassung der Spezifikation, Prüfung durch die QA, `present`; danach der neue Plan.

Die Meldung `question` vom 22. Oktober 2026, 22:43 UTC, zu diesem Dokument gilt für den früheren Stand. Lege bitte diesen Stand vor.

## Wo der Prototyp liegt

- Zum Ausprobieren: `development/strategiedesign/prototype/pipwerk-studio-prototyp.html` auf `main`. Die Datei im Browser öffnen, ohne Server und ohne Internetverbindung. Beim Start ist „EMA-Trendfolge“ des Auftraggebers offen, unter „Öffnen“ stehen außerdem `str-01` und `str-03`.
- Bildschirmbilder, darunter „EMA-Trendfolge“ senkrecht und waagerecht, eine Verwendung mit Methode und „Aktualisieren“ und die Gruppen der Bibliothek: `strategiedesign/proto-studio:components/pipwerk-studio/prototype/screenshots/`.
- Beschreibung und alle Entscheidungen des Entwicklers: `strategiedesign/proto-studio:components/pipwerk-studio/prototype/README.md`.

Stand des Prototyps: Zweig `strategiedesign/proto-studio`, Commit `6294ac17edc8b9a6cf8080fab87439a84951a5ff` (Auftrag `order-03.md` auf `order-02.md`). Alle technischen Abnahmekriterien beider Aufträge sind erfüllt. Nachweis: Browsertests auf diesem Commit, `73 passed` (Chromium, Firefox, WebKit, Bildschirmbilder). Zum Ausprobieren des Namensvorschlags stehen in der Bibliothek die Vorlagen „Trend H1“ (mit „EMA 20“ und „EMA 50“) und das Regelwerk „Order-Check“ (mit „Mindestvolumen“ und „Stop-Loss gesetzt“).

Was der Prototyp beim Namensraum nicht zeigt, gilt aber nach der Spezifikation: Regeln der Strategie und eines Elements sind in Bausteinen und Formeleditor nicht wählbar; doppelte Namen unter den Strategieparametern, ein Parameter einer Vorlage mit dem Namen einer Instanz und ein Name der übrigen Strategie im Inhalt einer Instanz werden nicht gemeldet.

Was der Prototyp nur vortäuscht: Er rechnet nichts und hat kein Backend. Die Prüfung läuft im Browser nach. Welche Objekttypen Methoden haben und welche das Aktualisieren vorsehen, ist im Fachmodell offen (req-fach-055). Der Prototyp nimmt dafür die Vorschläge unten an.

## Fragen

### 1. Bestätigung des Prototyps

Benötigte Entscheidung: Bestätigt der Auftraggeber die geänderte Darstellung als Vorlage für Spezifikation und Umsetzung? Er soll dafür seine „EMA-Trendfolge“ und die Testfälle ohne Anleitung ansehen und ändern, senkrecht und waagerecht.

Im Prototyp so gelöst; mit der Bestätigung gelten die Punkte als bestätigt, jeder Einwand geht mit `revise` zurück:

1. Objekte liegen neben dem Element ihrer ersten Verwendung (waagerecht darüber), mit einer immer sichtbaren durchgezogenen Linie dorthin. Den Bereich „Objekte und ihre Werte“ gibt es nicht mehr.
2. Erste Verwendung ist das Element, mit dem der Anwender das Objekt zuerst verbunden hat: durch Ziehen auf das Element oder durch Klick in der Bibliothek, wenn ein Element gewählt ist. Fällt ein Objekt auf freie Fläche, zeigt es einen Hinweis, bis es verbunden ist. Bei bestehenden Strategien ohne solche Verbindung gilt das erste Element im Ablauf, das den Namen in einem Ausdruck verwendet.
3. Weitere Verwendungen sind gestrichelte Linien. Umschalter „Weitere Verwendungen: Alle / Auswahl / Aus“, beim Start „Auswahl“ (nur die Linien des gewählten Elements), weil „Alle“ bei der „EMA-Trendfolge“ viele Linien quer über die Fläche legt.
4. Jede Linie trägt in der Mitte die übergebene Eigenschaft oder Methode, zum Beispiel „Wert“ oder „Wert vor 3 Kerzen“. Mehrere Werte desselben Objekts für dasselbe Element sind eine Linie mit allen Namen.
5. In der Eigenschaftenansicht eines Elements steht unter „Verwendete Werte“ je Objekt die Wahl von Eigenschaft oder Methode, ihre Angaben und der Schalter „Aktualisieren“. Eine Linie mit „Aktualisieren“ hat das Zeichen ↻.
6. Methoden, Vorschlag: `EMA` und `ATR` haben „Wert vor … Kerzen“.
7. Aktualisieren, Vorschlag: alle mitgelieferten Objekttypen und `Konto`, `Instrument`, `Kerze`, `Tick` sehen es vor; eine eigene Vorlage übernimmt es von ihrem Objekttyp.
8. Gruppen der Elementbibliothek in dieser Reihenfolge: Ablaufsteuerung, Berechnung, Indikatoren, Trends, Marktdaten, Konto, Aktionen, Regeln und Regelwerke. Für die Objekte die fachlichen Namen ohne Oberbegriff (Vorschlag des Projektleiters in req-ui-018). „Strategieparameter ändern“ steht unter „Berechnung“.
9. Die Prüfung meldet zusätzlich: Objekt ohne Verbindung zum Element seiner ersten Verwendung, doppelter Name, Verwendung auf einem Weg, der die erste Verwendung nicht durchläuft (Vorschlag des Projektleiters in req-fach-055). Die Verwaltung einer Order darf Objekte des Hauptablaufs verwenden.
10. Ausrichtung umschaltbar wie bisher. Regeln bleiben in der Eigenschaftenansicht.
11. Namensvorschlag beim Einfügen einer Vorlage, die selbst Instanzen oder Regeln enthält: „<Name der neuen Instanz> <bisheriger Name>“, zum Beispiel „Trend H1 EMA 20“; ist der Name vergeben, mit angehängter Zahl. Der Anwender kann jeden Namen ändern. Umbenennen der umgebenden Instanz ändert die enthaltenen Namen nicht (req-ablauf-003, Form nach Spezifikation 3.3).
12. Eine Instanz, die nur im Ausdruck verwendet wird, gilt als verbunden, auch wenn erst ein späteres Element sie verwendet; sie liegt beim ersten Element im Ablauf, das sie verwendet (req-ui-014).

Vorschlag: Prototyp mit den Punkten 1 bis 12 bestätigen.
