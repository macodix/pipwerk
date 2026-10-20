# Prüfbericht QA: Dokumente des Auftraggebers, Durchlauf 9 (geänderte Stellen)

- Vorhaben: `strategiedesign`, Anlass: Abnahme von Arbeitspaket `wp02`, nicht abgenommen
- Phase: 1 Anforderung, Prüfung der geänderten Stellen (Rückkopplung aus Phase 5)
- Prüfauftrag: `development/strategiedesign/reviews/requirements-9-order.md`
- Geprüfter Commit: `69fbbc52d1000277accf1028ce44d3e5e99826b4` (`main`)
- Maßstab: `git diff 0bc0a862b8be5b56dda496535b6d59db1588bc50~1 69fbbc52d1000277accf1028ce44d3e5e99826b4 -- docs/design` und die Einträge vom 2026-10-18 und 2026-10-19 in den Änderungsnachweisen der vier Dokumente

## Ergebnis

**Nicht bestanden.** 5 blockierende Befunde, 10 Hinweise.

Kein blockierender Befund gehört in die Gruppe „Entscheidung des Auftraggebers“. Nur Hinweis H7 gehört in diese Gruppe. Er ist für die Testfälle nicht nötig.

## Geprüft

1. Geänderte Stellen: req-system-024; req-fach-015, req-ablauf-002, req-ui-014 bis req-ui-017, req-ablauf-003, req-ablauf-007; req-fach-046, req-fach-049, req-fach-049a, req-fach-051, req-fach-053, req-fach-054; `indikator-markttechnik.md` Abschnitt 1. Dazu die Einträge in den Änderungsnachweisen. Jede geänderte Stelle hat einen passenden Eintrag im Änderungsnachweis. Die Kennungen in den Einträgen passen zu den Abschnitten.
2. Unveränderte Stellen: Ich habe die geltenden Dokumente laut `scope.md` und das Glossar `docs/technical/glossar.md` vollständig gelesen. Gezielt durchsucht habe ich die Stellen zu „Bezeichnung“, „Name“, „Verbindung“, „Ausdruck“, „Zeichenfläche“, „Instrument“, „Indikator“, „Trend“, „Markttechnik“ und „ZigZag“. Das Ergebnis steht in B2 bis B5 und in den Hinweisen.
3. Die vier Beispiele aus dem Prüfauftrag:
   - Ein Name statt Name und Bezeichnung (req-ui-016): Widerspruch, siehe B2 und B3.
   - Werte über Datenverbindungen (req-ui-014): Widerspruch im Glossar, siehe B4.
   - Parameter `Instrument` (req-fach-053): Widerspruch im selben Dokument, siehe B5.
   - `Markttechnik` in der Gruppe der Trends (req-fach-054): kein Widerspruch. req-fach-054 und `indikator-markttechnik.md` Abschnitt 1 sagen beide, dass nur die Oberfläche ihn so nennt und dort einordnet. Er bleibt ein Indikator. Das passt zu req-fach-001, req-fach-054 Satz 1, zum Glossar („Objekttyp“) und zu `str-01` („Voraussetzungen“). Zur Formulierung „baut auf `ZigZag` auf“ siehe H9.
4. Änderungen vom 2026-10-19 gegen die Stellen vom 2026-10-18 (Auslöser optional): Ich habe keinen Widerspruch gefunden. req-ui-016 nennt im geführten Aufbau zuerst einen Auslöser. Der Aufbau kann jederzeit verlassen werden. Er verlangt also keinen Auslöser. req-ui-017 („Eingang oben“) und req-fach-053 (Parameter `Instrument`) ändern nichts an den Regeln vom 2026-10-18.
5. Testfälle: Ich habe nur die Dokumente geprüft, keine laufende Anwendung.
   - `str-03`: Gestalten mit Formeltext bleibt möglich. Die Ausdrucksansicht bleibt erhalten (req-ui-015, req-ui-014 Absatz 2). Ohne Formeltext lässt sich `str-03` nach dem Wortlaut nicht vollständig gestalten, siehe B1.
   - `str-01`: Für `str-01` gilt dasselbe, siehe B1.
   - Speichern und Laden: Die Änderungen verhindern sie für keinen der beiden Testfälle. Wie Namen mit Leerzeichen in gespeicherten Ausdrücken stehen, ist nach B2 zu klären.

## Blockierende Befunde

### B1 – Bausteine ohne Formeltext: Werte aus Order, Position, Strategie und aus Ergebnissen sind nicht wählbar

- Fundstelle: `anforderungen-strategiedesigner.md` req-ui-015, Satz 1 („Werte wählt er aus verbundenen Objekten, Strategieparametern oder festen Werten“). Dazu req-ui-014, Absatz 1 („Jede Eigenschaft eines Objekts auf der Zeichenfläche … ist ein Ausgang“). Betroffen sind `str-03` Abschnitt 3 und 4 sowie `str-01` Abschnitt 2 und 6.
- Sachverhalt:
  - Nach req-ui-015 stellt der Anwender Bedingungen und Berechnungen zusammen, „ohne Formeln zu schreiben“. Werte gibt es dort nur aus drei Quellen: verbundene Objekte, Strategieparameter und feste Werte. Die Aufzählung ist abschließend; ein „zum Beispiel“ steht nur bei den Vergleichen.
  - Ein verbundenes Objekt braucht nach req-ui-014 einen Ausgang auf der Zeichenfläche. `Order`, `Position` und `Strategie` liegen aber nie auf der Zeichenfläche (Fachmodell req-fach-051). Sie haben also keinen Ausgang. Die übrigen Objekte der Anwendung brauchen keine Instanz auf der Zeichenfläche (req-fach-051: `Kerze.Schluss` ohne Instanz).
  - Ergebnisse von Berechnungen, Bedingungen und Regeln sind ebenfalls keine Quelle. Eine Berechnung ist kein Objekt (req-fach-048). req-ui-014 kennt nur Eigenschaften von Objekten als Ausgänge. Nach req-fach-005 und req-fach-048 müssen nachfolgende Elemente diese Ergebnisse aber verwenden können.
  - Die Testfälle brauchen genau diese Werte:
    - `str-03` Abschnitt 4: `Order.Status`, `Position.Stop-Loss` und `Position.Richtung`. Abschnitt 3: Der Stop-Loss ist das Ergebnis einer Berechnung und wird der Order übergeben.
    - `str-01` Abschnitt 2: wartende Order oder offene Position der Strategie, also `Strategie.wartende Orders` und `Strategie.offene Positionen` (req-fach-046). Abschnitt 6: `Order.Stop-Loss`. Abschnitt 3: Ergebnisse der Berechnungen Einstieg, Stop-Loss und Take-Profit.
  - Nach dem Wortlaut lassen sich beide Testfälle deshalb nicht ohne Formeltext gestalten. Der Befund widerspricht req-ui-015 (Satz 1 und „beide Ansichten zeigen dieselbe Bedingung“).
- Zuordnung: folgt aus einer Festlegung. Maßgeblich sind req-ui-015 („ohne Formeln zu schreiben“, „beide Ansichten zeigen dieselbe Bedingung“), req-fach-005, req-fach-048 und req-fach-051 („in Ausdrücken verfügbar, ohne auf der Zeichenfläche zu liegen“). Wie diese Werte in den Bausteinen erscheinen, ist Sache der Spezifikation. Hält der Softwarearchitekt die Zuordnung nicht für eindeutig, entscheidet er sie nach „Fragen an den Auftraggeber“.
- Kritikpunkt: Die Aufzählung der Wertquellen in req-ui-015 ist enger als das, was Ausdrücke ansprechen dürfen. Damit gilt „beide Ansichten zeigen dieselbe Bedingung“ für die Testfälle nicht.

### B2 – Namen mit Leerzeichen gegen „Namen ohne Leerzeichen“ im Fachmodell

- Fundstelle: `fachmodell.md` req-fach-036, letzter Absatz („Instanzen in einer Strategie tragen den vom Anwender vergebenen Namen ohne Leerzeichen, zum Beispiel `markttechnik_h1.trend_intakt`“). Dagegen `anforderungen-strategiedesigner.md` req-ui-016, Absatz 2 („Namen vergibt der Anwender frei, mit Leerzeichen und Umlauten (zum Beispiel „Stop-Abstand“, „EMA 20“)“).
- Sachverhalt: req-ui-016 verlangt Namen mit Leerzeichen. req-fach-036 schließt sie für Instanzen aus. Beide Sätze gelten. Daraus folgt auch: Unklar ist, wie ein Name mit Leerzeichen in einem Ausdruck in Punkt-Schreibweise steht. Das betrifft auch das Glossar, Eintrag „Ausdruck“ („Namen stehen in Punkt-Schreibweise (`ema20.wert`)“).
- Zuordnung: folgt aus einer Festlegung (req-ui-016, Festlegung des Auftraggebers vom 2026-10-19). Wie ein Name mit Leerzeichen im Ausdruck geschrieben und gespeichert wird, ist Sache der Spezifikation.
- Kritikpunkt: req-fach-036 widerspricht req-ui-016 im Wortlaut.

### B3 – „genau ein Name“ gegen unveränderte Stellen mit `Bezeichnung`

- Fundstelle: `anforderungen-strategiedesigner.md` req-ui-016, Absatz 2 („Ein Objekt, ein Element und ein Strategieparameter haben genau einen Namen; eine getrennte Bezeichnung entfällt.“). Dagegen:
  - `fachmodell.md` req-fach-035: Eine Regel hat `Regel-ID` und `Bezeichnung`. Nach req-fach-013a erhält jede Instanz in der Strategie zusätzlich einen Namen.
  - `fachmodell.md` req-fach-046: Die Strategie hat eine `Bezeichnung`. Nach req-fach-046 Satz 1 ist sie ein Objekt.
  - `anforderungen-strategiedesigner.md`: req-param-005 und req-ablauf-004 (Vorlage mit „Bezeichnung“); req-ablauf-002, req-ui-005 und req-ablauf-008 (Strategie mit „Bezeichnung“); req-ui-003 (Element des Ablaufs trägt „die Bezeichnung seines Elementtyps“, änderbar).
  - Glossar, Eintrag „Herkunft“ („Kennung und Bezeichnung der Vorlage“).
- Sachverhalt:
  - Bei der Regel steht ein inhaltlicher Widerspruch. Eine Instanz einer Regel hätte die `Bezeichnung` aus req-fach-035 und den Namen aus req-fach-013a nebeneinander. Genau das schließt req-ui-016 aus. Das ist auch der Mangel M14 der Abnahme.
  - Bei Strategie, Vorlage und Element des Ablaufs gibt es nur eine Benennung. Sie heißt dort aber „Bezeichnung“, in req-ui-016 „Name“. Wer die Dokumente liest, kann nicht erkennen, ob beide dasselbe meinen. Das Glossar verbietet Synonyme (Abschnitt „Regeln“).
  - Nicht betroffen ist die Eigenschaft `Bezeichnung` des Instruments (req-fach-051, Tabelle). Sie beschreibt das Instrument selbst und ist keine Benennung durch den Anwender.
- Zuordnung: folgt aus einer Festlegung (req-ui-016, Festlegung des Auftraggebers vom 2026-10-19; Strategie und Vorlagen sind Objekte nach req-fach-046 und req-fach-013a).
- Kritikpunkt: Die Stellen mit `Bezeichnung` widersprechen req-ui-016 bei der Regel inhaltlich, sonst im Begriff.

### B4 – Glossar: Eigenschaften „nicht über Verbindungen“

- Fundstelle: `docs/technical/glossar.md`, Eintrag „Verbindung“ („Eigenschaften werden nicht über Verbindungen, sondern in Ausdrücken verwendet.“). Stand des Glossars 2026-10-18, Status `accepted`, Zweck „Verbindliche Begriffe für alle Dokumente, Aufträge und Abstimmungen“.
- Sachverhalt:
  - req-ui-014 legt fest, dass Eigenschaften über Datenverbindungen an Eingänge anderer Elemente gehen. Der Eintrag im Glossar schließt das aus. Ein Auftrag, der sich auf das Glossar stützt, würde Datenverbindungen weglassen.
  - Die neuen Begriffe „Datenverbindung“, „Ablaufverbindung“ und „Eingang“ fehlen im Glossar. Nach der Regel des Glossars (Zweck: „Jeder hier fehlende Fachbegriff wird … hier ergänzt“) gehören sie hinein.
  - „Ausgang“ steht im Glossar nur für Ausgänge des Ablaufs (Eintrag „Kennung“: `flow.condition`). In req-ui-014 ist auch jede Eigenschaft ein Ausgang.
- Zuordnung: folgt aus einer Festlegung (req-ui-014, Entscheidung des Auftraggebers vom 2026-10-19). Das Glossar gleicht der Softwarearchitekt an.
- Kritikpunkt: Das Glossar widerspricht req-ui-014.

### B5 – Parameter `Instrument`: req-fach-054 und Tabellen widersprechen req-fach-053

- Fundstelle: `fachmodell.md`:
  - req-fach-054, Satz 3 („Jeder Indikator hat den Parameter `Zeiteinheit`, das Instrument kommt aus der Anwendung der Strategie.“) und die Tabelle dort. Sie nennt bei keinem Indikator den Parameter `Instrument`.
  - req-fach-051, Tabelle: bei `Instrument` und `Tick` keine Parameter, bei `Kerze` nur `Zeiteinheit`.
  - req-fach-046, Strategieparameter: „Kerzen, Ticks und Indikatoren können es als ihr Instrument verwenden“, ohne `Instrument`.
  - Dagegen req-fach-053, Absatz nach der Tabelle: „`Instrument`, `Kerze`, `Tick` und jeder Indikator haben den Parameter `Instrument`, vorbelegt mit dem Instrument der Anwendung“.
- Sachverhalt: req-fach-054 wurde am 2026-10-19 geändert. Satz 3 blieb dabei stehen. Er legt fest, dass das Instrument eines Indikators immer aus der Anwendung kommt. req-fach-053 erlaubt ein anderes Instrument. Die Tabellen in req-fach-051 und req-fach-054 sind nach req-ui-005 und req-param-002 Grundlage der Eigenschaftenansicht. Ihnen fehlt der neue Parameter.
- Zuordnung: folgt aus einer Festlegung (req-fach-053, Entscheidung des Auftraggebers vom 2026-10-19, Änderungsnachweis des Fachmodells).
- Kritikpunkt: Das Fachmodell widerspricht sich in req-fach-053 und req-fach-054 im Wortlaut.

## Hinweise

### H1 – req-ui-017: „Markt und Konto“ und „nicht frei auf der Zeichenfläche“

- Fundstelle: `anforderungen-strategiedesigner.md` req-ui-017, Absatz 2. Dagegen die unveränderten Stellen, nach denen Objekte „auf der Zeichenfläche“ liegen: req-fach-051 („muss eine Kerze mit gesetzter Zeiteinheit auf der Zeichenfläche liegen“, „Liegen Instanzen auf der Zeichenfläche“), req-ablauf-003, req-ablauf-007, req-ui-014 und Glossar „Zeichenfläche“.
- Sachverhalt:
  - „Markt und Konto“ ist in keinem geltenden Dokument definiert. Es steht nur im Abnahmebericht (M8) als Gruppe der Elementbibliothek mit Konto, Instrument, Kerze, Tick. Die Dokumente nennen diese Objekte „Objekte der Anwendung“ (req-fach-051).
  - Nach req-ui-017 liegen diese Objekte „nicht frei auf der Zeichenfläche, sondern geordnet in einem eigenen Bereich neben dem Ablauf“. Der Wortlaut sagt nicht, ob dieser Bereich zur Zeichenfläche gehört. Davon hängen die Regeln in req-fach-051 ab, zum Beispiel der Fehler bei fehlender Kerze.
- Zuordnung: folgt aus einer Festlegung (req-fach-051 für die Objekte; req-ui-017 und req-fach-051 zusammen: Die Objekte bleiben Instanzen der Strategie).
- Kritikpunkt: Der Begriff ist nicht eingeführt. Die Lage des Bereichs ist mehrdeutig.

### H2 – req-ui-017: „Jedes Element hat seinen Eingang oben“

- Fundstelle: `anforderungen-strategiedesigner.md` req-ui-017, Absatz 1. Dazu req-ui-014 (mehrere Eingänge je Element) und Glossar „Element“ (auch Elemente, die ein Objekt zeigen).
- Sachverhalt: Ein Auslöser hat keinen Eingang. Ein Element, das ein Objekt zeigt, liegt nach Absatz 2 nicht im Ablauf. Seine Ausgänge führen zur Seite. Eine Bedingung hat nach req-ui-014 außerdem mehrere Eingänge für Werte. „Eingang“ und „Ausgang“ meinen in req-ui-014 und req-ui-017 also Verschiedenes.
- Zuordnung: Sache der Spezifikation (req-ui-014: „Offen für die Spezifikation: Darstellung der Ein- und Ausgänge“). Die Begriffe im Glossar: siehe B4.

### H3 – req-ui-015: „Bausteine“

- Fundstelle: `anforderungen-strategiedesigner.md` req-ui-015, Satz 1 („aus Bausteinen zusammen“). Dagegen Glossar, Eintrag „Element“: „Die Begriffe „Baustein“, „Knoten“ und „Ablaufelement“ werden nicht verwendet.“
- Sachverhalt: req-ui-015 verwendet ein Wort, das das Glossar ausschließt. Gemeint sind dort Teile einer Bedingung, keine Elemente. Die Bedeutung ist im Zusammenhang erkennbar.
- Zuordnung: folgt aus einer Festlegung (Glossar, Regel „kein Synonym“). Welcher der beiden Texte angepasst wird, entscheiden Projektleiter und Softwarearchitekt.

### H4 – Konsistenzprüfung: „Eingang ohne Wert“ und Kreise über Datenverbindungen

- Fundstelle: `anforderungen-strategiedesigner.md` req-ablauf-007, dritter Punkt („Datenverbindung zwischen unverträglichen Datentypen oder Eingang ohne Wert (Fehler)“). Dagegen req-param-006 („Ein optionaler Parameter ohne Wert ist kein Befund“) und req-ui-014 („dem Parameter eines anderen Objekts“).
- Sachverhalt:
  - Ist ein Parameter ein Eingang, wäre ein optionaler Parameter ohne Wert ein Fehler. Ebenso ein Parameter, dessen Wert erst bei der Anwendung kommt. req-param-006 sagt das Gegenteil.
  - Werden Parameter aus Eigenschaften anderer Objekte belegt, kann ein Kreis entstehen: Objekt A nimmt einen Wert von B, B einen von A. req-ablauf-007 nennt dafür keine Prüfung. Bei Regelwerken gibt es sie (Zirkelbezug, req-fach-045).
- Zuordnung: folgt aus einer Festlegung (req-param-006) für den ersten Punkt. Der zweite Punkt ist Sache der Spezifikation („findet mindestens“).

### H5 – req-ui-014: Anzeige als Datenverbindung ohne Quelle auf der Zeichenfläche

- Fundstelle: `anforderungen-strategiedesigner.md` req-ui-014, Absatz 2 („Wird ein Name nur im Ausdruck verwendet, zeigt die Zeichenfläche die Verwendung trotzdem als Datenverbindung an.“).
- Sachverhalt: Ausdrücke dürfen Objekte ansprechen, die nicht auf der Zeichenfläche liegen: `Order`, `Position`, `Strategie` mit ihren Strategieparametern und Objekte der Anwendung ohne Instanz (`Kerze.Schluss`, req-fach-051). Von dort kann keine Linie ausgehen.
- Zuordnung: Sache der Spezifikation (Darstellung).

### H6 – req-ablauf-002 nennt den geführten Aufbau nicht

- Fundstelle: `anforderungen-strategiedesigner.md` req-ablauf-002 („Es öffnet sich eine leere Zeichenfläche ohne Elemente.“) und req-ui-016, Absatz 1 („„Neue Strategie“ bietet einen geführten Aufbau an … der jederzeit verlassen werden kann“).
- Sachverhalt: Der Arbeitsablauf „Strategie anlegen“ beschreibt nur die leere Zeichenfläche. Der geführte Aufbau steht nur in req-ui-016. Die beiden Sätze widersprechen sich nicht. Offen bleibt aber, wann der Aufbau angeboten wird und was nach dem Verlassen bleibt.
- Zuordnung: Sache der Spezifikation.

### H7 – Mehrere Instrumente: Auslöser und Order

- Fundstelle: `fachmodell.md` req-fach-053, Absatz nach der Tabelle („Das Instrument kommt aus der Anwendung der Strategie, sofern die Strategie kein anderes festlegt … So kann eine Strategie mehrere Instrumente betrachten.“). Dazu die Tabelle der Auslösertypen in req-fach-053 und `Instrument` als Eigenschaft von `MarketOrder` und der wartenden Ordertypen (req-fach-028, req-fach-029). Außerdem req-fach-046 (`wartende Orders`, `offene Positionen` „auf dem Konto und Instrument …, auf dem sie gerade läuft“) und Glossar „Anwendung einer Strategie“.
- Sachverhalt: Der Satz steht im Abschnitt über Auslöser. Die Auslöser `Kerzenschluss` und `Tick` haben aber keinen Parameter `Instrument`. Ebenso sagen die Dokumente nicht, ob „betrachten“ auch das Handeln auf einem anderen Instrument einschließt. Beide Testfälle arbeiten nur mit dem Instrument der Anwendung. Für sie ist die Frage nicht nötig.
- Zuordnung: Entscheidung des Auftraggebers. Kein Dokument legt das fest.
- Fragen:
  1. Kann ein Auslöser `Kerzenschluss` oder `Tick` sich auf ein anderes Instrument als das der Anwendung beziehen?
  2. Darf eine Strategie eine Order auf einem anderen Instrument als dem der Anwendung aufgeben, oder betrachtet sie andere Instrumente nur?

### H8 – Grundausstattung „über EMA, ATR und Markttechnik hinaus“ ohne ZigZag

- Fundstelle: `anforderungen-strategiedesigner.md` Abschnitt 9, Punkt 9. `development/strategiedesign/scope.md`, Abschnitt „Offene Punkte des Auftraggebers“, Punkt „Strategiedesigner“.
- Sachverhalt: Seit dem 2026-10-19 gehört `ZigZag` zu den mitgelieferten Indikatoren (req-fach-054). Beide Stellen nennen ihn nicht.
- Zuordnung: folgt aus einer Festlegung (req-fach-054, Entscheidung des Auftraggebers vom 2026-10-19).

### H9 – ZigZag: Namen der Eigenschaften, „baut auf ZigZag auf“

- Fundstelle: `fachmodell.md` req-fach-054, Zeile `ZigZag` der Tabelle und Satz unter der Tabelle. `indikator-markttechnik.md` Abschnitt 1 und Abschnitt 2.
- Sachverhalt:
  - Bei `ZigZag` stehen die Eigenschaften nur beschrieben („die Wendepunkte, je Wendepunkt Kurs, Hoch oder Tief und ob endgültig“). Anders als bei `EMA`, `ATR` und `Markttechnik` fehlen Namen.
  - „Er baut auf `ZigZag` auf“ lässt zwei Lesarten zu: Markttechnik rechnet intern mit dem ZigZag-Verfahren, oder der Anwender verbindet eine ZigZag-Instanz mit ihm. `indikator-markttechnik.md` Abschnitt 2 gibt dem Indikator selbst die Parameter des ZigZag. Das spricht für die erste Lesart. `str-01` nennt keine eigene ZigZag-Instanz.
- Zuordnung: Sache der Spezifikation für die Namen. Die erste Lesart folgt aus einer Festlegung (`indikator-markttechnik.md` Abschnitt 2).

### H10 – Folgesätze zu Strategieparametern und Bindung

- Fundstelle: `fachmodell.md` req-fach-046, letzter Absatz (Belegung von Parametern: fester Wert, Strategieparameter, Berechnung oder Regel, Anwendung). Glossar, Eintrag „Strategieparameter“ („Ein Wert …“).
- Sachverhalt: Nach req-ui-014 kann ein Parameter auch über eine Datenverbindung aus der Eigenschaft eines anderen Objekts belegt werden. req-fach-046 nennt das nicht. Das Glossar nennt es bereits unter „Bindungsart“. Nach req-fach-046 kann ein Strategieparameter seit dem 2026-10-19 auch ein Objekt sein. Der Glossareintrag spricht nur von einem Wert.
- Zuordnung: folgt aus einer Festlegung (req-ui-014 und req-fach-046, Entscheidungen des Auftraggebers vom 2026-10-19).

## Nicht geprüft

Nach dem Prüfauftrag nicht Gegenstand:

- `anforderungen-handelssystem.md` und die Stellen des Fachmodells zur Ausführung
- die Vorlagen unter `docs/design/planning/`
- Spezifikation, Plan und der Code von `wp02`
- der Abnahmebericht als Prüfgegenstand
- die als offen gekennzeichneten Punkte, darunter „Offen für die Spezifikation“ (req-ui-014), „Offen für den Prototyp“ (req-ui-017) und die geprüften Fenstergrößen (req-system-024)
- die technischen Dokumente außer dem Glossar

Ob die Prüfschleife eine Ebene höher geht, entscheidet nicht die QA.
