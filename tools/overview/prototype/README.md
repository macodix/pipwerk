# Prototyp: Stand der Vorhaben

Klickbarer Oberflächenentwurf der Übersichtsseite (Festlegung 6 in `development/verfahren/scope.md`). Prototyp, wird nicht übernommen und nicht aus dem Repository erzeugt.

## Start

- Ansehen: `uebersicht-prototyp.html` im Browser öffnen (`file://`). Eine Datei, eingebettete Stile, kein JavaScript, keine externen Dateien, keine Links.
- Browsertest installieren: im Verzeichnis `npm install`, einmalig `npx playwright install chromium firefox webkit`.
- Browsertest (Chromium, schreibt auch die Bildschirmbilder nach `screenshots/`): `npm test`.
- Dieselben Tests in Firefox beziehungsweise WebKit: `npm run test:firefox`, `npm run test:webkit`; alle drei: `npm run test:alle`.

Der Test prüft in den Fenstergrößen 390×844, 844×390, 820×1180, 1180×820, 1366×768 und 1920×1080: keine waagerechte Bildlaufleiste, kein Element ragt rechts hinaus, keine überlappenden Blöcke, Zeilen und Zellen, der Bereich „Wartet auf Sie“ liegt vollständig im sichtbaren Fenster, keine Fehler in der Konsole. Dazu: Auf- und Zuklappen der abgeschlossenen Vorhaben, keine Links und Pfade, Hervorhebung nicht nur über die Farbe.

## Beispieldaten

Fest in der Datei eingetragen, oben auf der Seite als Beispiel gekennzeichnet. Zeitpunkt „erzeugt am 24.10.2026 um 09:40 Uhr“ ebenfalls fest.

| Vorhaben | Kennung | Stand |
|---|---|---|
| Entwicklungsverfahren verbessern | `verfahren` | Konzeption, beim Softwarearchitekten, keine Pakete |
| Strategietester | `backtest` | Umsetzung; `wp01` fertig, `wp02` Abnahme beim Auftraggeber, `wp03` wartet |
| Strategiedesigner | `strategiedesign` | Umsetzung; `wp01` fertig, `wp02` Umsetzung beim Team |
| Verbindung zum Broker | `relay` | Umsetzung; `wp01` Umsetzung beim Softwarearchitekten (Lücke in der Spezifikation), `wp02` wartet |
| Neues Vorhaben | `beispiel` | Anforderung, beim Auftraggeber (Frage beantworten) |
| Über-Dialog | `ablauftest` | alle Pakete fertig, unter „Abgeschlossene Vorhaben“ |

## Entscheidungen

Aus dem Auftrag nicht vorgegeben und von mir festgelegt:

1. Reihenfolge der Vorhaben wie im Auftrag aufgezählt, nicht nach Dringlichkeit. Was auf den Auftraggeber wartet, steht ohnehin im Bereich ganz oben.
2. Hervorhebung: kräftiger Rahmen, getönter Grund, vorangestelltes Zeichen ▶ und in Zeilen die Marke „Wartet auf Sie“. Sie ist so auch ohne Farbe erkennbar. Ein Paket, das auf den Auftraggeber wartet, steht in seinem Vorhaben zuoberst vor den übrigen laufenden Paketen.
3. Einträge in „Wartet auf Sie“: erst die Aufgabe fett, rechts „seit …“, darunter Vorhaben mit Kennung und, falls vorhanden, Paket mit Kennung. Die Aufgabe für `beispiel` und `backtest` ergibt sich aus Phase und Stelle („Frage beantworten“ bei Anforderung, „Abnahme durchführen“ bei Abnahme).
4. Reihenfolge der Pakete im Vorhaben: Auftraggeber zuerst, dann laufende, dann wartende, fertige zuletzt, zurückgenommen (graue Schrift, kleiner).
5. Zeitangaben „seit“ mit Datum und Uhrzeit in Ortszeit. Bei fertigen Paketen „in main seit <Datum>“, bei wartenden Paketen „–“ für „Bei“ und „Seit“, dazu ein Hinweis, worauf sie warten („auf wp02“). Hinweis und die Zeiten sind Beispiel.
6. Vorhaben ohne Pakete zeigen eine Zeile mit Phase, Stelle und Zeitpunkt statt der Tabelle. Die Phase des Vorhabens steht dort in der Zeile, bei Vorhaben mit Paketen neben dem Namen.
7. „Projektleiter“ als Wert für „bei wem“ (Vorschlag im Auftrag) kommt in den Beispieldaten nicht vor und ist nicht dargestellt; die Darstellung wäre dieselbe wie bei den anderen Stellen.
8. „Abgeschlossene Vorhaben“ als ein gemeinsames, zugeklapptes Feld mit der Anzahl in der Überschrift. Phase des abgeschlossenen Vorhabens: Integration. Namen der Pakete des Über-Dialogs sind von mir als Beispiel erfunden.
9. Schmale Fenster (bis 720 Pixel Breite): jede Tabellenzeile wird zu einer Karte mit beschrifteten Angaben. Spaltenbreiten sind in allen Tabellen gleich, damit die Blöcke untereinander ruhig wirken.
10. Niedrige Fenster (bis 460 Pixel Höhe, Querformat am Telefon): Kopf und „Wartet auf Sie“ sind enger gesetzt, damit der Bereich vollständig ohne Bildlauf sichtbar bleibt.
11. Gestaltung: hell, warmer Grau-Grund, weiße Karten, Systemschrift (keine Schrift aus dem Netz), Hervorhebung in Bernstein.
12. Testwerkzeug: Playwright 1.64.1 (aktuelle Version, die 1.49.1 hatte laut `npm audit` einen Befund). Die Bildschirmbilder entstehen im Chromium-Lauf.

Nicht erfüllbar mit dem Prototyp und offen für den Auftraggeber: ob die Aufgabentexte („Präsentation bestätigen“, „Frage beantworten“, „Abnahme durchführen“) so aus dem Stand im Repository ablesbar sind, entscheidet die Spezifikation.
