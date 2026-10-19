# Prüfbericht QA: Dokumente des Auftraggebers, Durchlauf 10 (Nachprüfung)

- Vorhaben: `strategiedesign`, Anlass: Abnahme von Arbeitspaket `wp02`, nicht abgenommen
- Phase: 1 Anforderung, Nachprüfung der geänderten Stellen nach Durchlauf 9
- Prüfauftrag: `development/strategiedesign/reviews/requirements-10-order.md`
- Geprüfter Commit: `26ecff465d067320ec279a3e1bb1c12f4b8bc1e5` (`main`)
- Maßstab: `git diff 69fbbc52d1000277accf1028ce44d3e5e99826b4 26ecff465d067320ec279a3e1bb1c12f4b8bc1e5 -- docs development/strategiedesign/scope.md` und die Einträge zu Durchlauf 9 in den Änderungsnachweisen von `fachmodell.md`, `indikator-markttechnik.md`, `anforderungen-strategiedesigner.md` und `glossar.md`

## Ergebnis

**Bestanden.** Die blockierenden Befunde B1 bis B5 aus Durchlauf 9 sind erledigt. Die geänderten Stellen enthalten keinen neuen blockierenden Befund. Es gibt 5 Hinweise (N1 bis N5).

Kein Hinweis gehört in die Gruppe „Entscheidung des Auftraggebers“. Der Bericht enthält deshalb keine Fragen an den Auftraggeber.

## Geprüft

1. Geänderte Stellen laut Diff:
   - `scope.md`: offene Punkte (Instrument, ZigZag), Abschnitt „Stand“.
   - `fachmodell.md`: req-fach-035, req-fach-036, req-fach-046, req-fach-051 (Tabelle), req-fach-053, req-fach-054.
   - `indikator-markttechnik.md`: Abschnitt 1 und Abschnitt 2.
   - `anforderungen-strategiedesigner.md`: req-param-005, req-ui-003, req-ui-005, req-ui-015, req-ui-017, req-ablauf-002, req-ablauf-004, req-ablauf-007, req-ablauf-008, Abschnitt 9 Punkt 9.
   - `glossar.md`: Herkunft, Strategieparameter, Element, Verbindung, Ablaufverbindung, Datenverbindung, Ausgang, Eingang, Index.
2. Änderungsnachweise: Jede geänderte Stelle hat einen passenden Eintrag vom 2026-10-19. Die genannten Kennungen passen zu den Abschnitten. Der Dokumentstatus nennt in allen vier Dokumenten den 2026-10-19.
3. Abgleich mit den übrigen geltenden Dokumenten laut `scope.md`: Ich habe `anforderungen-gesamtsystem.md`, `str-01`, `str-03` und das Glossar gegen die geänderten Stellen gelesen. Gezielt durchsucht habe ich alle Dokumente nach „Bezeichnung“, „Leerzeichen“, „Markt und Konto“ und „Baustein“. „Bezeichnung“ steht nur noch beim Instrument (req-fach-051, Tabelle; req-fach-053, „eigene Bezeichnung“ eines festen Instruments, als offen gekennzeichnet), in req-core-001 im allgemeinen Wortsinn und in einem Eintrag des Änderungsnachweises von `indikator-markttechnik.md`. Das ist kein Widerspruch zu req-ui-016. „Markt und Konto“ kommt nicht mehr vor. Das Gesamtsystem enthält zu Namen nur req-system-023 („Vom Nutzer vergebene Namen … werden durch einen Sprachwechsel nicht übersetzt“). Das passt zu req-ui-016.
4. Testfälle, nur nach den Dokumenten, ohne laufende Anwendung:
   - `str-03` ohne Formeltext: Abschnitt 2 braucht `EMA20.Wert`, `EMA50.Wert` und „vorheriger Wert von“ (req-ui-015). Abschnitt 3 braucht `Kerze.Schluss`, `ATR14.Wert` und das Ergebnis der Berechnung des Stop-Loss. Abschnitt 4 braucht `Order.Status`, `Position.Stop-Loss` und `Position.Richtung`. Alle Werte nennt req-ui-015 jetzt als Wertquelle: Eigenschaften verbundener Objekte, Objekte der Anwendung einschließlich `Order` und `Position`, Ergebnisse vorangehender Elemente. Die Darstellung in den Bausteinen ist Sache der Spezifikation.
   - `str-01` ohne Formeltext: Abschnitt 1 braucht `Trend intakt` und `Phase` der Markttechnik. Abschnitt 2 braucht `Trendrichtung`, `Punkt 2`, `Punkt 1/3`, `Strategie.wartende Orders` und `Strategie.offene Positionen`. Abschnitt 3 braucht `Instrument.Spread` und die Strategieparameter Entry-Puffer und Stop-Puffer. Abschnitt 6 braucht `Tick`, `Order.Stop-Loss` und das Ergebnis der neuen Berechnung. Alle Werte sind nach req-ui-015 wählbar.
   - Gestalten mit Formeltext bleibt für beide Testfälle möglich (req-ui-015, Ansicht für Fortgeschrittene; req-ui-014 Absatz 2).
   - Speichern und Laden: Die Änderungen verhindern sie für keinen der beiden Testfälle. Die Instanznamen der Testfälle (`EMA20`, `EMA50`, `ATR14`) enthalten keine Leerzeichen. Zu Namen mit Bindestrich siehe N5.
   - Parameter `Instrument`: Beide Testfälle arbeiten nur mit dem Instrument der Anwendung. Der Standardwert „Instrument der Anwendung“ (req-fach-053, `indikator-markttechnik.md` Abschnitt 2) genügt. Die offene Frage aus H7 ist für die Testfälle nicht nötig.
   - `Markttechnik` mit den Parametern des ZigZag (`indikator-markttechnik.md` Abschnitt 1 und 2, req-fach-054) passt zu `str-01` (Voraussetzungen, Parameter „ZigZag-Einstellung“). Eine eigene ZigZag-Instanz ist nicht nötig.

## Befunde aus Durchlauf 9

### Blockierende Befunde

| Befund | Stand | Nachweis |
|---|---|---|
| B1 – Bausteine ohne Formeltext | erledigt | req-ui-015 Satz 1 nennt jetzt „allem, was ein Ausdruck ansprechen kann“, ausdrücklich `Order`, `Position`, `Strategie` und Ergebnisse vorangehender Elemente. Beide Testfälle lassen sich danach ohne Formeltext gestalten (siehe „Geprüft“, Punkt 4). Zur Aufzählung siehe N3. |
| B2 – Namen mit Leerzeichen gegen req-fach-036 | erledigt | req-fach-036, letzter Absatz: „Namen dürfen Leerzeichen und Umlaute enthalten (… req-ui-016). Offen für die Spezifikation: wie ein solcher Name im Ausdruck geschrieben und gespeichert wird.“ Der Satz „ohne Leerzeichen“ ist entfernt. Zu anderen Zeichen siehe N5. |
| B3 – „genau ein Name“ gegen `Bezeichnung` | erledigt | `Name` statt `Bezeichnung` in req-fach-035 (mit Satz zur Instanz), req-fach-046, req-param-005, req-ui-003, req-ui-005, req-ablauf-002, req-ablauf-004, req-ablauf-008 und im Glossar (Herkunft, Index). Die `Bezeichnung` des Instruments bleibt als Eigenschaft des Instruments. Zu req-ui-003 siehe N4. |
| B4 – Glossar „nicht über Verbindungen“ | erledigt | Glossar: Der Satz „Eigenschaften werden nicht über Verbindungen … verwendet“ ist entfernt. Neu sind Ablaufverbindung, Datenverbindung, Ausgang und Eingang. Sie passen zu req-ui-014. Zum Eintrag „Eingang“ siehe N2. |
| B5 – Parameter `Instrument` | erledigt | req-fach-046 (Strategieparameter), req-fach-051 (Tabelle: `Instrument`, `Kerze`, `Tick`), req-fach-054 Satz 3 und Tabelle (`EMA`, `ATR`, `ZigZag`), `indikator-markttechnik.md` Abschnitt 2. Alle Stellen stimmen jetzt mit req-fach-053 überein. Der Satz „das Instrument kommt aus der Anwendung der Strategie“ in req-fach-054 ist entfernt. |

### Hinweise

Die Bearbeitung laut `requirements-9-response.md`:

| Hinweis | Bearbeitung laut Antwort | liegt vor |
|---|---|---|
| H1 | req-ui-017: „Objekte der Anwendung“ statt „Markt und Konto“, Bereich gehört zur Zeichenfläche | ja (req-ui-017 Absatz 2). Zur neuen Formulierung siehe N1. |
| H2 | Spezifikation | nicht Gegenstand |
| H3 | Glossar, Eintrag „Element“ | ja |
| H4 | req-ablauf-007: Ausnahme für optionale und bei der Anwendung übergebene Parameter; Kreise über Datenverbindungen: Spezifikation | ja (req-ablauf-007, vierter Punkt). Siehe N2. |
| H5 | Spezifikation | nicht Gegenstand |
| H6 | Spezifikation | nicht Gegenstand |
| H7 | in req-fach-053 und `scope.md` als offen gekennzeichnet | ja |
| H8 | `ZigZag` in Abschnitt 9 Punkt 9 und in `scope.md` | ja |
| H9 | erste Lesart in req-fach-054 und `indikator-markttechnik.md` Abschnitt 1; Namen der Eigenschaften: Spezifikation | ja |
| H10 | req-fach-046 Belegung über Datenverbindung; Glossar | ja (req-fach-046 letzter Absatz; Glossar „Strategieparameter“) |

## Blockierende Befunde

Keine.

## Hinweise

### N1 – req-ui-017: „Objekte der Anwendung“ schließt `Order`, `Position` und `Strategie` ein

- Fundstelle: `anforderungen-strategiedesigner.md` req-ui-017, Absatz 2 („Objekte ohne Ablaufverbindung (Indikatoren, Trends, Objekte der Anwendung nach Fachmodell req-fach-051) liegen … in einem eigenen Bereich der Zeichenfläche“). Dagegen `fachmodell.md` req-fach-051 („mit Ausnahme von `Order`, `Position` und `Strategie`“, „werden nicht als Instanz auf die Zeichenfläche gelegt“), req-ablauf-003 Absatz 2 (nur Konto, Instrument, Kerze und Tick) und Glossar „Objekte der Anwendung“ (alle sieben).
- Sachverhalt: Mit H1 wurde „Markt und Konto“ durch „Objekte der Anwendung nach Fachmodell req-fach-051“ ersetzt. Nach req-fach-051 und dem Glossar gehören dazu auch `Order`, `Position` und `Strategie`. Wörtlich gelesen liegen sie damit im eigenen Bereich der Zeichenfläche. Das widerspricht req-fach-051. Man kann den Satz auch so lesen, dass er nur für Objekte gilt, die auf der Zeichenfläche liegen können. Dann besteht kein Widerspruch. Weil diese Lesart möglich ist, führe ich den Punkt als Hinweis.
- Zuordnung: folgt aus einer Festlegung (req-fach-051, req-ablauf-003).
- Kritikpunkt: Die Aufzählung in req-ui-017 ist weiter als die Objekte, die auf der Zeichenfläche liegen dürfen.

### N2 – Glossar „Eingang“ und req-ablauf-007 „Eingang ohne Wert“

- Fundstelle: Glossar, Eintrag „Eingang“ („die ankommende Ablaufverbindung … oder ein Wert, den das Element über eine Datenverbindung erhält. Ein verbundener Eingang …“). `anforderungen-strategiedesigner.md` req-ablauf-007, vierter Punkt („Eingang ohne Wert (Fehler), ausgenommen optionale Parameter … und Parameter, deren Wert erst bei der Anwendung übergeben wird“) und achter Punkt („Pflichtparameter ohne Wert, der auch nicht erst bei der Anwendung übergeben wird (Fehler)“).
- Sachverhalt:
  - Nach dem Glossar ist ein Eingang „ein Wert, den das Element über eine Datenverbindung erhält“. Ein solcher Eingang hat immer einen Wert. Derselbe Eintrag spricht aber von einem „verbundenen“ Eingang, es gibt also auch unverbundene. req-ablauf-007 setzt außerdem voraus, dass Parameter Eingänge sind, auch ohne Datenverbindung. Das Glossar sagt das nicht.
  - Für Pflichtparameter decken sich der vierte und der achte Punkt von req-ablauf-007. Welche Eingänge außer Parametern der vierte Punkt meint, sagt der Text nicht.
- Zuordnung: Wortlaut des Glossars: folgt aus einer Festlegung (req-ui-014: „Ein verbundener Eingang“, Parameter als Eingang; req-ablauf-007). Welche Eingänge es gibt und welcher Befund bei einem Pflichtparameter gemeldet wird: Sache der Spezifikation.
- Kritikpunkt: Der Begriff „Eingang“ ist im Glossar enger gefasst, als req-ablauf-007 ihn verwendet.

### N3 – req-ui-015: Aufzählung der Wertquellen ohne Ergebnisse von Regeln

- Fundstelle: `anforderungen-strategiedesigner.md` req-ui-015, Satz 1 („allem, was ein Ausdruck ansprechen kann, also aus Eigenschaften verbundener Objekte, …, Ergebnisse vorangehender Elemente (Fachmodell req-fach-005, req-fach-048), Strategieparameter und feste Werte“). Dazu `anforderungen-strategiedesigner.md` req-fach-005 und `fachmodell.md` req-fach-036 („Ergebnisse anderer Regeln“) und req-fach-037a („Eine Bedingung kann … Ergebnisse von Regeln einbeziehen“).
- Sachverhalt:
  - Der maßgebliche Satzteil „allem, was ein Ausdruck ansprechen kann“ schließt Ergebnisse von Regeln ein. Die mit „also“ angeschlossene Aufzählung nennt sie nicht. Regeln sind keine Elemente (req-ui-012), fallen also nicht unter „Ergebnisse vorangehender Elemente“. Der angeführte req-fach-005 nennt Regeln ausdrücklich. Die Testfälle brauchen in Bedingungen keine Ergebnisse von Regeln. Das Volumen bestimmt die Risikoregel an der Order selbst.
  - Sprachlich: „aus … Ergebnisse vorangehender Elemente“ müsste im Dativ stehen.
- Zuordnung: folgt aus einer Festlegung (req-fach-005, req-fach-037a, req-ui-015 „allem, was ein Ausdruck ansprechen kann“).
- Kritikpunkt: Die Aufzählung ist enger als der Satzteil, den sie erläutert.

### N4 – req-ui-003: „die Tätigkeit seines Elementtyps“

- Fundstelle: `anforderungen-strategiedesigner.md` req-ui-003, Absatz 1 („Jedes Element des Ablaufs trägt als Namen zunächst die Tätigkeit seines Elementtyps, der Anwender kann ihn ändern.“).
- Sachverhalt: Vorher hieß es „die Bezeichnung seines Elementtyps als Tätigkeit“. Jetzt ist die „Tätigkeit des Elementtyps“ der erste Name. Kein Dokument legt fest, welche Tätigkeit ein Elementtyp hat. Bei „Order aufgeben“ ist der Name des Typs schon eine Tätigkeit. Bei „Bedingung“ und „Berechnung“ ist er ein Substantiv. Nach req-ui-003 genügt ein reines Substantiv aber nicht als Ablaufschritt.
- Zuordnung: Sache der Spezifikation (erster Name eines neuen Elements).
- Kritikpunkt: Der Ausdruck „Tätigkeit seines Elementtyps“ ist nicht eingeführt.

### N5 – Namen mit anderen Zeichen als Leerzeichen und Umlauten

- Fundstelle: `fachmodell.md` req-fach-036, letzter Absatz („Namen dürfen Leerzeichen und Umlaute enthalten … Offen für die Spezifikation: wie ein solcher Name im Ausdruck geschrieben und gespeichert wird.“). Dagegen `anforderungen-strategiedesigner.md` req-ui-016, Absatz 2 („Namen vergibt der Anwender frei … (zum Beispiel „Stop-Abstand“ …)“). Betroffen: `str-01` (Strategieparameter „Entry-Puffer“, „Stop-Puffer“), `str-03` (Parameter „Stop-Abstand“).
- Sachverhalt: Nach req-ui-016 sind Namen frei, das Beispiel enthält einen Bindestrich. req-fach-036 nennt nur Leerzeichen und Umlaute. Für die Schreibweise im Ausdruck ist offen nur „ein solcher Name“. Ein Bindestrich ist in einem Ausdruck zugleich das Minuszeichen. Nach dem Wortlaut ist unklar, ob die offene Frage auch Namen mit Bindestrich oder anderen Sonderzeichen umfasst. Die Testfälle verwenden solche Namen.
- Zuordnung: Sache der Spezifikation (Schreibweise und Speicherung im Ausdruck). Dass Namen frei sind, folgt aus einer Festlegung (req-ui-016).
- Kritikpunkt: Die offene Frage in req-fach-036 ist enger gefasst als die freie Namensvergabe in req-ui-016.

## Nicht geprüft

Nach dem Prüfauftrag nicht Gegenstand:

- seit Durchlauf 9 unveränderte Stellen, soweit sie keiner geänderten Stelle widersprechen
- `anforderungen-handelssystem.md` und die Stellen des Fachmodells zur Ausführung
- die Vorlagen unter `docs/design/planning/`
- Spezifikation, Plan und der Code von `wp02`
- die als offen gekennzeichneten Punkte, darunter die Schreibweise von Namen im Ausdruck (req-fach-036), Auslöser und Order auf anderem Instrument (req-fach-053), Darstellung der Ein- und Ausgänge (req-ui-014) und die Ausrichtung (req-ui-017)
- die der Spezifikation zugeordneten Punkte H2, H5, H6, Kreise über Datenverbindungen (H4), Namen der ZigZag-Eigenschaften (H9), Darstellung der Werte in den Bausteinen (B1) und Schreibweise von Namen mit Leerzeichen im Ausdruck (B2)
- die technischen Dokumente außer dem Glossar

Ob die Prüfschleife eine Ebene höher geht, entscheidet nicht die QA.
