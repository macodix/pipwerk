# Prüfbericht QA – Spezifikation, Durchlauf 8 (Nachprüfung)

- Bezug: `strategiedesign`, Prüfauftrag `development/strategiedesign/reviews/specification-8-order.md`
- Phase: 2, Nachprüfung der Spezifikation nach Durchlauf 7
- geprüfter Commit: `33551f516126a952af5c8edfb9b1c9a0fbecb60e` (`origin/main`; ermittelt mit `git log -1 --format=%H -- development/strategiedesign/reviews/specification-8-order.md`; im Arbeitsverzeichnis ausgecheckt und mit `git rev-parse HEAD` bestätigt)
- Maßstab: `git diff 7e98ac51cd72e70d9a560bcbfda17a671c364d3f 33551f516126a952af5c8edfb9b1c9a0fbecb60e -- development/strategiedesign/specification.md`
- Art: Nachprüfung nach „Umfang der Prüfungen“. Geprüft sind nur die Erledigung der Hinweise und die dafür geänderten Stellen. Keine Testumgebung nötig und keine verwendet.

## Ergebnis: bestanden

Ich habe keinen blockierenden Befund gefunden. Die Hinweise N1 bis N3, N5 bis N9 und N11 bis N22 aus `specification-7.md` sind erledigt. Die Strategie des Auftraggebers und die Testfälle `str-01` und `str-03` bleiben nach den geänderten Regeln gültig (Abschnitt „Gegenprobe“ unten).

An den geänderten Stellen sind acht neue Hinweise entstanden (H1 bis H8). Sie verhindern das Bestehen nicht. H1 und H4 sollten vor der Präsentation an den Auftraggeber erledigt sein, weil Abschnitt 10 Punkte 18 und 19 ihm sonst etwas Falsches oder Unvollständiges vorlegen.

N4 und N10 aus `specification-7.md` liegen laut Prüfauftrag beim Projektleiter und sind nicht Gegenstand.

## Grundlagen der Prüfung

- `development/strategiedesign/specification.md` im geprüften Commit, Abschnitte 1 bis 9 und die geänderten Zeilen von Abschnitt 10 und Änderungsnachweis
- der Diff oben
- `development/strategiedesign/reviews/specification-7.md`
- `development/strategiedesign/wp02/acceptance/ema-trendfolge-auftraggeber.strategy.json`
- `docs/design/domain/fachmodell.md`: req-fach-014, req-fach-047, req-fach-049, req-fach-049a, req-fach-051
- `docs/design/requirements/anforderungen-strategiedesigner.md`: req-ui-014 bis req-ui-017, req-param-006, req-ablauf-007
- `docs/design/requirements/anforderungen-gesamtsystem.md`: req-system-024
- `docs/technical/entwicklungsverfahren.md`: „Umfang der Prüfungen“, „Fragen an den Auftraggeber“

## Nachprüfung der Hinweise aus `specification-7.md`

| Hinweis | Stelle jetzt | Ergebnis |
|---|---|---|
| N1 Kennungen gegen Objekte der Anwendung, ungültige Kennungen | 3.3, Absatz „Namen und Kennungen“ und neuer Absatz darunter; 3.3 „Namensräume“ | erledigt: Kennungen werden auch gegen die Objekte der Anwendung und die Funktionen eindeutig gemacht, `n_` vor Ziffern, Ersatz bei leerem Ergebnis. Namen sind auch gegen die Objekte der Anwendung in beiden Sprachen eindeutig, eine neue Instanz heißt „Kerze 2“. Neue Fragen an dieser Stelle: H2, H3 |
| N2 Element mit Objekt hat zwei Namen | 3.3, Absatz „Element“, letzte Sätze | erledigt: Das Element hat keinen eigenen Namen, sein Name ist der Name der Instanz |
| N3 Umwandlung: Kennung unbenannter Bedingungen, Namen | 3.7, erste zwei Punkte; 10 Punkt 18 | Kennung erledigt („Kreuzen“ erhält `kreuzen`). Namen: Die Regel ist festgelegt, das Beispiel und Punkt 18 passen aber nicht zur Datei des Auftraggebers, siehe H1 |
| N5 Argumente von `PREVIOUS` | 3.4, neuer Punkt; 3.6, neue Zeile; Kreuzung mit festem Wert im Absatz „Bausteine“ | erledigt. Die Regel stimmt mit req-fach-014 überein (Objekt mit Zeiteinheit, Tick, Ergebnis einer Berechnung oder Bedingung). Neuer Fall an dieser Stelle: H5 |
| N6 `Instrument` ohne Instanz | 3.1, neuer Absatz; 3.5; 10 Punkt 19 | für Ablauf, Verwaltung und Regeln der Strategie erledigt, als vorläufig gekennzeichnet. Offen geblieben: H4 |
| N7 Instrument und Zeiteinheit eigener Indikatoren | 3.3, Tabelle der Vorlagen, Zeile `Indikator` | erledigt |
| N8 Datentypen der Markttechnik | 3.2, Absatz zu `Markttechnik` | erledigt: Wahrheitswerte, beschriftet „ja“ und „nein“; `AND(mt_signal.trend_intakt; …)` in `str-01` ist damit typrichtig |
| N9 Verbindungen, die der Aufbau nicht vorsieht | 3.3, neue Tabelle „Unzulässige Verbindungen“ und Satz darunter; 3.6, dritte Zeile; 5.3 „Verwaltung“ | erledigt, jede Einschränkung mit Grund. Neue Lücke beim Ziehen in einen Rahmen: H6 |
| N11 Herkunft mitgelieferter Vorlagen | 3.7, dritter Punkt und letzter Absatz | erledigt. E4 und 3.3 „Instanz“ sind nicht angeglichen, siehe H8 |
| N12 Objekte der Anwendung in der Anzeigeform | 3.4, Absatz „Gespeicherte Form und Anzeigeform“ | erledigt: `Konto.Kapital`, englisch `Account.Capital`, Eingabe in beiden Sprachen |
| N13 Entfernen eines verwendeten Objekts | 3.4, neuer Absatz „Entfernen …“; 5.4, letzter Punkt | erledigt: leerer Platz bei zerlegbarem Ausdruck, sonst unbekannter Name; Strategieparameter und Datenverbindung werden „nicht belegt“, Befund nur bei Pflicht und MUSS (req-param-006) |
| N14 Instanzen frei auf der Zeichenfläche | 3.3, Absatz „Element“; 5.3, „Anordnung“ | erledigt: Instanzen haben keine Lage und lassen sich nur im Bereich „Objekte und ihre Werte“ umordnen |
| N15 Einschränkung der Abschnitte ohne Begründung | 3.3, Absatz „Abschnitt“ | erledigt: Begründung ergänzt |
| N16 Prüfkriterien der Fenstergrößen | 5.1, letzter Absatz; 7, Browsertest | erledigt: Menü, Dialoge, Vorlagenansicht, Bausteine, Formeleditor und geführter Aufbau in beiden Smartphone-Größen; `str-03` nur mit Klicks in 390 × 844. Aussage zu „jede Bedienung mit Ziehen“ siehe H7 |
| N17 Klick auf die Zahl der Befunde | 5.1, Zeile „Kopfzeile“ | erledigt: wie im Prototyp, Eigenschaftenansicht der Strategie mit Liste der Befunde |
| N18 Anwenderdokumentation | 9, erster und vierter Punkt | erledigt: vollständige Bedienung nach 5.1 bis 5.5; Abschnitt „Web-API ausprobieren“ zieht in die technische Dokumentation um |
| N19 Alembic | 4.1, zweiter Punkt; 7, Backend; 9, erster Punkt | erledigt |
| N20 Händlersprache für alle Texte | 5.1, Absatz unter der Tabelle | erledigt |
| N21 Bindungsarten der Eigenschaften | 3.1, Zeile „Eigenschaften“ und neue Tabelle der Ausnahmen | erledigt: alle Bindungsarten erlaubt, vier Ausnahmen mit technischem Grund |
| N22 „Eingang“ in zwei Bedeutungen | 3.3, Absatz „Eingang“; 3.6, Spalte „Stufe“; 9, Glossar | erledigt: „Angabe ohne Wert“, mit Hinweis auf den Wortlaut in req-ablauf-007 |

## Gegenprobe an der Strategie des Auftraggebers und den Testfällen

Geprüft habe ich die Datei `ema-trendfolge-auftraggeber.strategy.json` gegen die geänderten Regeln:

- `PREVIOUS` (3.4): Die Datei verwendet nur `PREVIOUS(ema20.wert)` und `PREVIOUS(ema50.wert)` (Zeilen 214 und 350), also Eigenschaften von Indikatoren. Zulässig.
- Unzulässige Verbindungen (3.3): Alle zehn Verbindungen (Zeilen 427 bis 476) liegen innerhalb eines Ablaufs. Der Auslöser der Verwaltung (Zeile 319) ist nur Quelle. Keine Verbindung ist unzulässig.
- Namen gegen Objekte der Anwendung (3.3): Keine Bezeichnung und kein Name in der Datei ist `Konto`, `Instrument`, `Kerze`, `Tick`, `Order`, `Position`, `Strategie` oder eine englische Entsprechung.
- `Instrument` ohne Instanz (3.1): Die Regel `mindestvolumen` am Element „Order aufgeben“ (Zeile 295) und „Risiko je Trade“ (Zeile 50) verwenden `Instrument` in Regeln. Nach 3.1 ist das das Instrument der Order.
- Kennung der unbenannten Bedingung: „Kreuzen“ (Zeilen 207 und 208) erhält `kreuzen`.

`str-01` und `str-03` (Abschnitt 6): Die Ausdrücke mit `PREVIOUS` verwenden nur `ema20.Wert` und `ema50.Wert`. `Instrument.Pip` und `Instrument.Spread` im Hauptablauf von `str-01` bezeichnen nach 3.1 das Instrument der Anwendung; der Auslöser hat das Instrument der Anwendung. Keine Verbindung zwischen Hauptablauf und Verwaltung. Für den Aufbau von `str-03` nur mit Klicks gibt es nach 5.2, 5.3 und 5.4 für jeden Schritt einen Weg: Einfügen und Verbinden per Klick, Eingänge entstehen bei der Wahl in den Bausteinen (5.4, fünfter Punkt).

## Blockierende Befunde

Keine.

## Hinweise (verhindern das Bestehen nicht)

Alle Hinweise betreffen die Spezifikation selbst. Wo ein Hinweis ein Dokument des Auftraggebers berührt, ist die Gruppe nach „Fragen an den Auftraggeber“ genannt. Keiner gehört zur Gruppe „Entscheidung des Auftraggebers“.

### H1 – Beispiel und Abschnitt 10 Punkt 18 passen nicht zur Umwandlungsregel

- Fundstelle: 3.7, zweiter Punkt („Name: die bisherige Bezeichnung, wo es eine gibt; … Sonst der bisherige Name mit Leerzeichen statt `_` und großem Anfangsbuchstaben („Order ausgefuehrt“, „Stop abstand“)“); 10 Punkt 18 („zum Beispiel „Order ausgefuehrt“ statt `order_ausgefuehrt`“). Datei des Auftraggebers, Zeilen 325 und 326 sowie 343 und 344.
- Sachverhalt: In der Datei des Auftraggebers haben die Bedingungen `order_ausgefuehrt` und `kreuzen_gegen_die_position` eine Bezeichnung (`"title"`), und sie lautet genauso wie der Name. Nach der Regel gilt dann die Bezeichnung. Der Auftraggeber sieht also „order_ausgefuehrt“ und „kreuzen_gegen_die_position“, nicht „Order ausgefuehrt“. Die Umsetzung in Leerzeichen greift in dieser Datei nur bei den Strategieparametern und bei der Regel `risiko_je_trade` (ohne Bezeichnung, Zeilen 9, 16, 25). Punkt 18 wird dem Auftraggeber vorgelegt und beschreibt das Ergebnis an seiner eigenen Strategie falsch.
- Gruppe: Sache der Spezifikation.
- Frage: Gilt die Umsetzung in Leerzeichen und großen Anfangsbuchstaben auch für eine Bezeichnung in Programmierschreibweise? Wenn nicht: Werden Beispiel und Punkt 18 an das tatsächliche Ergebnis angepasst?

### H2 – Ersatzkennung bei leerem Ergebnis und Kennungen aus Format 1.0

- Fundstelle: 3.3, Absatz „Namen und Kennungen“ („Ist das Ergebnis leer, nimmt sie die Kennung des Typs“); 3.1, Zeile „Kennung“ (Elementtypen zum Beispiel `flow.condition`); 3.7, erster Punkt („Kennung im Ausdruck: der bisherige Name“).
- Sachverhalt: Erstens enthält die Kennung eines Elementtyps einen Punkt. Eine Bedingung mit einem Namen nur aus Sonderzeichen erhielte `flow.condition`. Im Ausdruck liest sich das als Objekt `flow` mit Eigenschaft `condition`. Strategieparameter, eigene Parameter und eigene Eigenschaften einer Vorlage haben keinen Typ mit Kennung. Zweitens übernimmt die Umwandlung aus 1.0 den bisherigen Namen als Kennung. Ob sie ihn auch gegen die Objekte der Anwendung und die Funktionen eindeutig macht wie beim Anlegen, sagt 3.7 nicht. Ein Dokument 1.0 mit einer Instanz `kerze` hätte dann wieder den Fall aus N1 von `specification-7.md`. Die Datei des Auftraggebers ist nicht betroffen.
- Gruppe: Sache der Spezifikation.
- Fragen: Welche Kennung erhält ein Name ohne verwertbare Zeichen bei Bedingung, Berechnung, Strategieparameter und eigenem Parameter? Was geschieht beim Lesen von 1.0 mit einem Namen, der mit einem Objekt der Anwendung oder einer Funktion zusammenfällt?

### H3 – Eindeutigkeit gegen Objekte der Anwendung auch bei Strategieparametern

- Fundstelle: 3.3, neuer Absatz unter „Namen und Kennungen“ („Namen müssen innerhalb ihres Namensraums eindeutig sein, auch gegen die Namen der Objekte der Anwendung in beiden Sprachen, weil die Anzeigeform sie sonst nicht unterscheiden kann“); 3.3 „Namensräume“ (Strategieparameter gehören zum Namensraum der Strategie); 3.4 (Strategieparameter stehen als `Strategie.x`); req-ui-016 („Namen vergibt der Anwender frei“).
- Sachverhalt: Ein Strategieparameter steht in der Anzeigeform immer hinter `Strategie.`, etwa `Strategie.Instrument` für einen Parameter vom Datentyp Objekt `Instrument`. Er ist dort vom Objekt der Anwendung `Instrument` unterscheidbar. Der Grund der Einschränkung trifft auf Strategieparameter also nicht zu. Nach „Keine Einschränkung ohne Erfordernis“ braucht die Einschränkung für sie einen eigenen Grund.
- Gruppe: folgt aus der Regel „Keine Einschränkung ohne Erfordernis“; Sache der Spezifikation.
- Kritikpunkt: Die Einschränkung gilt für Strategieparameter ohne passende Begründung.

### H4 – `Instrument` ohne Instanz: Indikatoren und Trends nicht geregelt, Abweichung von `Kerze` nicht genannt

- Fundstelle: 3.1, neuer Absatz „`Instrument` ohne Instanz“; 10 Punkt 19. Fachmodell req-fach-051 (`Kerze` ohne Instanz hat Zeiteinheit und Instrument des Auslösers `Kerzenschluss`).
- Sachverhalt: Erstens regelt 3.1 Regeln, Verwaltung und Hauptablauf. Nicht geregelt sind eine Regel in einem Indikator oder Trend und der Ausdruck einer eigenen Eigenschaft eines Indikators. Dort gibt es keine Order, auf die die Regel angewendet wird, und keinen Ablauf. Ein Indikator hat aber selbst den Parameter `Instrument` (3.3, Zeile `Indikator`). Zweitens: Startet ein `Kerzenschluss` mit einem anderen festen Instrument den Hauptablauf, ist `Kerze` nach req-fach-051 die Kerze dieses Instruments, `Instrument` nach 3.1 aber das Instrument der Anwendung. Ein Ausdruck wie `Kerze.Schluss - 2 * Instrument.Pip` rechnet dann mit zwei Instrumenten. Punkt 19 nennt das dem Auftraggeber nicht. Die Testfälle sind nicht betroffen, weil ihre Auslöser das Instrument der Anwendung haben.
- Gruppe: Lücke im Fachmodell, nicht blockierend (der Punkt ist vorläufig und wird vorgelegt); für Indikatoren und Trends Sache der Spezifikation.
- Fragen: Was bezeichnet `Instrument` ohne Instanz in einem Indikator oder Trend? Soll Punkt 19 die Abweichung zwischen `Kerze` und `Instrument` bei einem Auslöser mit anderem Instrument nennen?

### H5 – Kreuzung mit einem Strategieparameter

- Fundstelle: 3.4, Absatz „Bausteine“ („Ist B ein fester Wert, steht B statt `PREVIOUS(B)`“); 3.4, neuer Punkt zu `PREVIOUS` (ein Strategieparameter als Argument ist ein Fehler); 3.6, neue Zeile zu `PREVIOUS`. req-ui-015 (Werte aus allem, was ein Ausdruck ansprechen kann, auch Strategieparameter).
- Sachverhalt: „EMA 20 kreuzt Schwelle nach oben“ mit einem Strategieparameter als B ergibt `PREVIOUS(Strategie.schwelle)`. Das ist nach der neuen Regel ein Fehler. Die Ausnahme gilt nur für einen festen Wert. Ob die Bausteine einen Strategieparameter als B anbieten und welcher Ausdruck dann entsteht, sagt die Spezifikation nicht. Ist A ein Strategieparameter, ein Ergebnis einer Regel oder ein fester Wert, gilt dasselbe.
- Gruppe: Sache der Spezifikation.
- Frage: Welche Werte bietet die Kreuzung für A und B an, und welcher Ausdruck entsteht bei einem Strategieparameter als B?

### H6 – Ziehen in einen Rahmen: Zugehörigkeit zum Abschnitt

- Fundstelle: 3.3, Absatz „Abschnitt“ („nur zu einem Abschnitt seines Ablaufs“, neue Begründung); 3.3, Satz unter der Tabelle der unzulässigen Verbindungen; 5.3, Punkt „Verwaltung“.
- Sachverhalt: Für ein Element, das in einen Rahmen gezogen oder aus ihm herausgezogen wird, regelt die Spezifikation jetzt die Verbindungen. Gehört das Element zu einem Abschnitt seines bisherigen Ablaufs, gehört es danach zu einem Abschnitt eines anderen Ablaufs. Das schließt 3.3 aus. Was mit der Zugehörigkeit geschieht, sagt die Spezifikation nicht.
- Gruppe: Sache der Spezifikation.
- Frage: Verlässt das Element beim Ziehen in einen Rahmen oder aus ihm heraus seinen Abschnitt?

### H7 – „Jede Bedienung, die Ziehen verwendet, hat einen Weg ohne Ziehen“ ist nicht vollständig belegt

- Fundstelle: 5.1, letzter Satz des letzten Absatzes. Dagegen 5.3: „Verwaltung“ (Elemente „herausgezogen gehören sie nicht mehr dazu“), „Anordnung“ (Instanzen im Bereich umordnen, Elemente verschieben). req-system-024 („alle Funktionen bleiben erreichbar und bedienbar“).
- Sachverhalt: Der Satz nennt Wege ohne Ziehen für Einfügen, Verbinden und Werte. Für das Herausnehmen eines Elements aus einer Verwaltung, für das Umordnen der Instanzen und für das Verschieben eines Elements nennt die Spezifikation keinen Weg ohne Ziehen. Auf einem Touchgerät gilt nach 5.2 der Klick. Der Aufbau von `str-03` braucht diese Bedienungen nicht, der Browsertest in 7 deckt sie deshalb nicht ab.
- Gruppe: Sache der Spezifikation.
- Kritikpunkt: Die Aussage in 5.1 gilt nach dem Text nicht für jede Bedienung mit Ziehen. Offen ist, ob diese Bedienungen auf Touchgeräten erreichbar sein müssen.

### H8 – Herkunft einer Instanz: E4 und 3.3 nicht an 3.7 angeglichen

- Fundstelle: E4 („Sie nennen ihre Herkunft (Kennung und Name der Vorlage zum Zeitpunkt des Einfügens, Objekttyp)“); 3.3, Absatz „Instanz“ („Herkunft (Objekttyp, Kennung und Name der Vorlage oder leer bei Einfügen eines Objekttyps)“). Dagegen 3.7, dritter Punkt und letzter Absatz (bei mitgelieferter Vorlage oder Objekttyp nur die Kennung, der Name nur bei einer eigenen Vorlage).
- Sachverhalt: E4 und 3.3 nennen den Namen der Vorlage für jede Herkunft. 3.7 schließt ihn für mitgelieferte Vorlagen aus. Ein Entwickler, der nach 3.3 das Objektmodell baut, speichert den Namen bei „Risiko je Trade“ weiter.
- Gruppe: Sache der Spezifikation.
- Kritikpunkt: Drei Stellen beschreiben die Herkunft unterschiedlich.

## Nicht geprüft

- Unveränderte Stellen der Spezifikation, Dokumente des Auftraggebers, Glossar, Arbeitspaketplan, Code (laut Prüfauftrag nicht Gegenstand).
- N4 und N10 aus `specification-7.md` (beim Projektleiter).
- Prototyp und Testumgebung; für diese Nachprüfung nicht nötig.
