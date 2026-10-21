# Frage backtest-01 – Bestätigung des Prototyps pipwerk replay, „Start von Hand“, „Parameter setzen“

- Vorhaben: `backtest`, ref `backtest`
- von: Softwarearchitekt
- an: Projektleiter
- Stand: 2026-10-21

## Unterbrochene Aufgabe

`specify` für `backtest` (Phase 2). Stand:

- Nachprüfung der Dokumente des Auftraggebers, Durchlauf 5: bestanden (`development/backtest/reviews/requirements-5.md`, geprüft auf Commit `e80090ca20e7794523c386e79bc6e38b06c0286a`). Hinweis H12 (Eintrag „leer“ in `docs/technical/pipwerk-domain.md`) ist erledigt. Hinweis H11 betrifft ein Dokument des Auftraggebers und steht unten bei den Hinweisen.
- Klickbarer Prototyp der gesamten Oberfläche von pipwerk replay ist fertig. Auftrag: `development/backtest/prototype/order-01.md`. Zweig `backtest/proto-replay`, Commit `73a39da4d53c1dde582a81c99410c0cbf8b07d22`. Alle sechs technischen Abnahmekriterien des Auftrags sind erfüllt. Nachweis: Die Browsertests auf diesem Commit habe ich selbst laufen lassen, Ergebnis `35 passed` (Simulation, Chromium, Firefox, WebKit): `str-01` im Einzelschritt-Test und `str-03` im Backtest nur über die Bedienung durchgespielt, Anordnung in den sechs Fenstergrößen nach req-system-024, Start über `file://` ohne Fehler.
- Entwurf der Spezifikation ohne Oberfläche: `development/backtest/specification.md` auf `main`, Commit `427c6c936acd9977a071144a94b8e57818a3d226`. Abschnitte 1 bis 7 und 9 bis 13 stehen, von der QA noch nicht geprüft. Abschnitt 8 (Oberfläche) fehlt.
- Wartet auf die Antworten: Abschnitt 8 nach dem bestätigten Prototyp, Antworten zu Fragen 2 und 3 in die Spezifikation, dann Prüfung der Spezifikation durch die QA, danach `present`.

## Wo der Prototyp liegt

- Zum Ausprobieren: `development/backtest/prototype/pipwerk-replay-prototyp.html` auf `main`. Die Datei im Browser öffnen, ohne Server und ohne Internetverbindung. Unter „Testlauf“ stehen die Strategie „EMA-Trendfolge“ des Auftraggebers, die Testfälle `str-01` und `str-03` und ein Beispiel. Oben wird zwischen Einzelschritt-Test und Backtest umgeschaltet. Testkonten und gespeicherte Backtests bleiben nur im Speicher dieses Browsers.
- Bildschirmbilder (36 Stück, Einzelschritt-Test `str-01` und Backtest-Ergebnis `str-03` in allen sechs Fenstergrößen, dazu Vorbereitung, Kursdaten, Datenbestand, abgelehnte Order, Vergleich): `backtest/proto-replay:components/pipwerk-backtest/prototype/screenshots/`.
- Beschreibung, Bedienung in Kürze und alle Entscheidungen des Entwicklers: `backtest/proto-replay:components/pipwerk-backtest/prototype/README.md`.

Was der Prototyp nur vortäuscht: Die Kurse sind erfunden und bei jedem Start gleich. Als letzter vollständiger Handelstag gilt fest der 2026-10-20. Ein kleiner Interpreter wertet die Strategien aus und wickelt Orders wie ein Broker ab. Swap, Margin (außer bei der Prüfung der Order) und Umrechnung zwischen Währungen rechnet er nicht. Beschaffung und Import ändern nur die Anzeige des Datenbestands. Die Ergebnisse sagen nichts über die Strategien.

Abweichungen, die beim Durchspielen auffallen:

- `str-01` zeigt im Prototyp noch den Indikator „1-2-3-Trend (Markttechnik)“, weil das Strategiedokument unter `contracts/strategies/v1/testcases/` ihn noch verwendet. Die Beschreibung `str-01` nennt inzwischen den ZigZag. Die Spezifikation, Abschnitt 9, sieht die Umstellung des Strategiedokuments auf den ZigZag vor.
- Die Strategie „EMA-Trendfolge“ des Auftraggebers hat den Stop-Abstand 0. Ihre Orders werden deshalb abgelehnt (Margin oder Risikoregel), bis der Wert im Testlauf geändert wird. Das ist so gewollt und zeigt abgelehnte Orders mit Grund.
- Die vierte Strategie „EMA-Trendfolge mit Vergleichsinstrument“ ist erfunden. Sie zeigt einen Strategieparameter vom Typ Instrument.

Grenzen: Eingabe per Touch ist nicht geprüft. Ziehen im Chart und auf der Fläche verschiebt nur die Ansicht.

## Fragen

### 1. Bestätigung des Prototyps

Benötigte Entscheidung: Bestätigt der Auftraggeber den Prototyp als Vorlage für Spezifikation und Umsetzung der Oberfläche (Entwicklungsverfahren, Phase 2, Schritt 2)? Er soll dafür die Testfälle `str-01` im Einzelschritt-Test und `str-03` im Backtest ohne Anleitung durchspielen, in den Fenstergrößen, die er nutzt.

Im Prototyp sind folgende Punkte so gelöst. Die Anforderungen legen sie nicht fest. Mit der Bestätigung gelten sie als bestätigt; jeder Einwand geht mit `revise` zurück:

1. Anordnung nach Fenstergröße: ab 1500 Pixel Breite stehen Strategie, Chart, Konto und Orders sowie Eigenschaften gleichzeitig. Von 1100 bis 1499 Pixel teilen sich Konto und Orders und die Eigenschaften einen Bereich mit Reitern. Unter 1100 Pixel steht ein Bereich nach dem anderen mit einer Leiste unten; bei hohen Tablets bleibt der Chart oben stehen. Das Ergebnis des Backtests folgt derselben Staffelung.
2. Auswertungen im Einzelschritt-Test: Jeder Auslöser (Kerzenschluss, Tick) ergibt eine Auswertung. Fallen Verwaltung und Hauptablauf auf denselben Zeitpunkt, zeigt eine Leiste die Reihenfolge, zuerst die Verwaltung.
3. „Einzelschritt“ am Ende einer Auswertung geht zum ersten Element der nächsten Auswertung. „Nächste handelnde Stelle“ hält auch an einem Haltepunkt. Ein Haltepunkt wird mit einem kleinen Kreis an der Ecke eines Elements gesetzt und entfernt. „Zum Testbeginn“ zeigt die ersten Auswertungen, in denen Indikatoren noch keine Werte haben.
4. Abgelehnte Order: Die Auswertung trägt vorab die Marke „endet mit abgelehnter Order“. Der Grund steht am Element „Order aufgeben“, in der Eigenschaftenansicht, im Protokoll und als rotes Kreuz im Chart. Im Ergebnis des Backtests stehen abgelehnte Orders mit Grund auf einem eigenen Reiter neben den Trades, ihre Anzahl bei den Kennzahlen.
5. Testkonto: Änderungen im Testlauf gelten nur für diesen Testlauf. Gespeichert wird nur über „Änderung im Testkonto speichern“ oder „Als neues Testkonto speichern“. Geänderte Angaben zum Instrument gelten nur für den Testlauf und werden nie gespeichert.
6. Kursdaten beim Start: Eine Liste nennt je Instrument, Zeiteinheit und Zeitraum, was gebraucht wird und was vorliegt. Fehlendes wird beim Start mit Fortschrittsanzeige beschafft. Lässt es sich nicht beschaffen, startet der Testlauf nicht, und die Meldung nennt die fehlenden Daten und den Grund.
7. Ergebnis des Backtests: Der Gewinn eines Trades ist nach Spread und Kommission. Die Spalte „Kosten“ nennt Kommission und Spreadanteil des Trades zur Information. Ein Klick auf einen Trade zeigt seine Stelle im Chart: Pfeil bei Eröffnung, Kreis bei Schließung, Linie dazwischen grün bei Gewinn, rot bei Verlust.

Vorschlag: Prototyp bestätigen.

### 2. „Start von Hand“ im Testlauf

Sachverhalt: Wann der Auslöser „Start von Hand“ in einem Testlauf eintritt, ist offen (Anforderungen Strategietester, Abschnitt 5, Punkt 2; Fachmodell req-fach-053). Die Testfälle verwenden ihn nicht.

Benötigte Entscheidung: Wann tritt „Start von Hand“ in einem Testlauf ein?

Vorschlag (Spezifikation, Abschnitt 13, Punkt 1): Er tritt einmal zu Beginn des Testzeitraums ein, vor der ersten Kerze, mit Kontostand gleich Anfangskapital, ohne Orders und ohne Positionen. Eine Strategie, die nur diesen Auslöser hat, läuft damit genau einmal. Im Einzelschritt-Test kann der Anwender ihn zusätzlich an der aktuellen Stelle auslösen. In einer Verwaltung tritt er nicht ein. Der Prototyp zeigt den ersten Teil, also einmal zu Beginn des Testzeitraums: als Karte in der Vorbereitung und mit einem Schalter, der ihn im Testlauf sichtbar macht. Das zusätzliche Auslösen von Hand im Einzelschritt-Test zeigt er nicht.

### 3. Geltung von „Parameter setzen“ im Testlauf

Sachverhalt: Wie lange ein mit „Parameter setzen“ geänderter Strategieparameter gilt, ist offen (Fachmodell req-fach-047). Die Testfälle verwenden das Element nicht.

Benötigte Entscheidung: Gilt der geänderte Wert nur bis zum Ende der Auswertung oder für den Rest des Testlaufs?

Vorschlag (Spezifikation, Abschnitt 13, Punkt 2): Der geänderte Wert gilt bis zum Ende der Auswertung. Die nächste Auswertung beginnt wieder mit dem Wert des Testlaufs. Begründung: Jede Auswertung hängt dann nur vom Kurs und vom Zustand des Kontos ab, und ein Testlauf ist leichter nachzuvollziehen.

## Hinweise an den Projektleiter, keine Fragen

- H11 aus `development/backtest/reviews/requirements-5.md`: In `docs/design/requirements/anforderungen-strategietester.md` nennt die Zeile „zuletzt aktualisiert“ noch den 2026-10-19, und die Änderungshistorie hat keinen Eintrag für die Änderung des Status. Das Dokument gehört dem Auftraggeber; ich ändere es nicht.

## Antwort


### Zu 1. Bestätigung des Prototyps

Bestätigt vom Auftraggeber im Chat am 2026-10-21 als Vorlage für Spezifikation und Umsetzung der Oberfläche, einschließlich der dort genannten Punkte 1 bis 7. Der Prototyp reicht für die ersten Versuche. Die Übersicht wird nach der praktischen Erprobung überarbeitet. Was sich bewährt und was nicht, wird dann festgestellt und über die Dokumente des Auftraggebers eingebracht.

### Zu 2. „Start von Hand“ im Testlauf

Entscheidung des Auftraggebers im Chat am 2026-10-21, eingearbeitet vom Projektleiter:

- Der Auslöser heißt künftig „Manuell“ (Fachmodell req-fach-053, Anforderungen an den Strategiedesigner req-fach-015).
- Er ist nur im Hauptablauf zulässig. In der Verwaltung einer Order meldet die Konsistenzprüfung einen Fehler. Das gilt allgemein, nicht nur im Testlauf.
- Im Testlauf tritt er einmal ein, standardmäßig zu Beginn des Testzeitraums vor der ersten Kerze. Wahlweise gibt der Anwender einen Zeitpunkt im Testzeitraum ein, zum Beispiel für eine bestimmte Marktphase. Im Einzelschritt-Test kann der Anwender ihn zusätzlich an der aktuellen Stelle auslösen (Anforderungen an den Strategietester req-test-015, offener Punkt 2 erledigt).
- Umbenennung in Glossar, Spezifikation und Strategiedokumenten ist Sache des Softwarearchitekten.

### Zu 3. Geltung von „Parameter setzen“

Entscheidung des Auftraggebers im Chat am 2026-10-21, eingearbeitet vom Projektleiter (Fachmodell req-fach-047, Anforderungen an den Strategiedesigner req-ui-003):

- Das Element „Parameter setzen“ entfällt. Strategieparameter werden im Ablauf nicht geändert und behalten während eines Testlaufs oder einer Anwendung ihren Startwert.
- Eine zweite Prüfung mit anderem Wert verwendet einen weiteren Strategieparameter, gegebenenfalls mit Rückführung im Ablauf.
- Das Beispiel mit der Handelszeiteinheit ist gestrichen. Es war nur eine mögliche Vorgehensweise, keine Anforderung.
- Folgen in Glossar, Spezifikation (Abschnitte 3.4 und 13), Strategieformat und Prototyp sind Sache des Softwarearchitekten.

### Zu H11

Erledigt vom Projektleiter (Commit `a9990e8`).
