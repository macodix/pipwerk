# Frage strategiedesign-02 – Bestätigung des Prototyps der geänderten Darstellung

- Vorhaben: `strategiedesign`, ref `strategiedesign`
- von: Softwarearchitekt
- an: Projektleiter
- Stand: 2026-10-23

## Unterbrochene Aufgabe

`specify` für `strategiedesign` (Phase 2). Stand:

- Nachprüfung der Dokumente des Auftraggebers, Durchlauf 14: bestanden (`development/strategiedesign/reviews/requirements-14.md`). Die Hinweise N1 bis N3 sind Sache der Spezifikation und werden dort entschieden.
- Prototyp der geänderten Darstellung ist fertig. Auftrag: `development/strategiedesign/prototype/order-02.md`. Zweig `strategiedesign/proto-studio`, Commit `87b86924ad5cf6485e821793a204b63d7955f168`. Alle acht technischen Abnahmekriterien sind erfüllt; Nachweis unten.
- Wartet auf die Bestätigung (Frage 1): Anpassung der Spezifikation einschließlich N1 bis N3, Prüfung durch die QA, `present`; danach der neue Plan.

Hinweis: Während der Arbeit hast du die Meldung `specify` durch die Meldung `check` vom 23. Oktober 2026, 00:20, ersetzt (Commit `8666e91`). Diese Sitzung gehört zur ersetzten Meldung. Die Meldung `check` bearbeitet die nächste Sitzung des Softwarearchitekten: Glossar „Namensraum“, Prüfung der geänderten Stellen durch die QA. Den Prototyp unten kannst du dem Auftraggeber schon jetzt vorlegen. Die Festlegung zu N1 setzt er bereits so um. Die neuen Namensvorschläge für Instanzen in einer eingefügten Vorlage (req-ablauf-003, Festlegung zu N3) zeigt er noch nicht. Ich ergänze sie nach bestandener Prüfung, ohne dass es dafür eine weitere Bestätigung braucht, es sei denn, der Auftraggeber will sie im Prototyp sehen.

## Wo der Prototyp liegt

- Zum Ausprobieren: `development/strategiedesign/prototype/pipwerk-studio-prototyp.html` auf `main`. Die Datei im Browser öffnen, ohne Server und ohne Internetverbindung. Beim Start ist „EMA-Trendfolge“ des Auftraggebers offen, unter „Öffnen“ stehen außerdem `str-01` und `str-03`.
- Bildschirmbilder, darunter „EMA-Trendfolge“ senkrecht und waagerecht, eine Verwendung mit Methode und „Aktualisieren“ und die Gruppen der Bibliothek: `strategiedesign/proto-studio:components/pipwerk-studio/prototype/screenshots/`.
- Beschreibung und alle Entscheidungen des Entwicklers: `strategiedesign/proto-studio:components/pipwerk-studio/prototype/README.md`.

Nachweis: Browsertests auf dem Commit oben, von mir selbst ausgeführt: `49 passed` (alle Tests in Chromium, Start über `file://` ohne Fehler auch in Firefox und WebKit).

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

Vorschlag: Prototyp mit den Punkten 1 bis 10 bestätigen.
