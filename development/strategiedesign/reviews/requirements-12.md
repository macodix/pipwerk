# Prüfbericht QA: Dokumente des Auftraggebers, Durchlauf 12 (Nachprüfung zu Beginn von Phase 2)

- Vorhaben: `strategiedesign`, Anlass: Abnahme von Arbeitspaket `wp02`, nicht abgenommen
- Phase: 2 Konzeption, Schritt 1 Nachprüfung
- Prüfauftrag: `development/strategiedesign/reviews/requirements-12-order.md`
- Geprüfter Commit: `8a023d14ee9e256797925d677e5d5deb18a657a2` (`main`, jüngster Commit mit dem Prüfauftrag)
- Maßstab: `git diff c52c6ba53d46785ea91cc11b89a2bd0a60e78c24 8a023d14ee9e256797925d677e5d5deb18a657a2 -- docs/design docs/technical/glossar.md development/strategiedesign/scope.md`

## Ergebnis

**Bestanden.** Alle Hinweise, die `requirements-11-response.md` den Dokumenten des Auftraggebers oder dem Glossar zuordnet, sind so bearbeitet, wie es dort steht. Die geänderten Stellen enthalten keinen blockierenden Befund. Beide Testfälle lassen sich weiterhin vollständig gestalten, speichern und wieder laden. Es gibt 6 Hinweise (N1 bis N6).

Kein Hinweis gehört in die Gruppe „Entscheidung des Auftraggebers“. Der Bericht enthält deshalb keine Fragen an den Auftraggeber.

## Geprüft

1. Geänderte Stellen laut Diff:
   - `fachmodell.md`: req-fach-019 (`Preis`), req-fach-036 (letzter Absatz, Namen), req-fach-046 (`wartende Orders`, `offene Positionen`), req-fach-051 (Absatz 1, Kerze und Tick ohne Instanz), req-fach-053 (Absatz nach der Tabelle, Instrument der Order), Änderungsnachweis (Eintrag zu Durchlauf 9 und zwei neue Einträge).
   - `anforderungen-strategiedesigner.md`: req-fach-015, req-ui-015, req-ui-017, Änderungsnachweis.
   - `glossar.md`: Auslöser, Anwendung einer Strategie, Eingang, Änderungsnachweis.
   - `scope.md`: Abschnitt „Stand“, letzter Absatz.
2. Abgleich mit `requirements-11-response.md` und dem Prüfauftrag (Tabelle unten).
3. Abgleich der geänderten Stellen mit den übrigen geltenden Dokumenten laut `scope.md` und dem Glossar. Gelesen habe ich `fachmodell.md` req-fach-019, req-fach-028, req-fach-029, req-fach-032, req-fach-046 bis req-fach-054; in `anforderungen-strategiedesigner.md` req-ui-014, req-ui-016, req-ablauf-007; `str-01` und `str-03` vollständig. Alle Dokumente laut `scope.md` und das Glossar habe ich durchsucht nach „Tick.Brief“, „Tick.Geld“, „Konto und Instrument“, „zwei Instrumenten“, „Instrument der Anwendung“, „Leerzeichen und Umlaut“, „wartende Orders“, „offene Positionen“ und „auf jedem Instrument“. „Tick.Brief“ und „Tick.Geld“ kommen nicht mehr vor. Zu „Konto und Instrument“ in `str-01` siehe N3.
4. Änderungsnachweise: Jede geänderte Stelle hat einen Eintrag vom 2026-10-19 mit Verweis auf den Hinweis. Der Eintrag zu Durchlauf 9 in `fachmodell.md` stimmt wörtlich mit dem Stand in Commit `26ecff465d067320ec279a3e1bb1c12f4b8bc1e5` überein (mit `git show` und `grep` verglichen). Der Dokumentstatus nennt in `fachmodell.md` und `glossar.md` den 2026-10-19.

## Bearbeitung der Hinweise aus den Durchläufen 10 und 11

| Hinweis | Bearbeitung laut Antwort | liegt vor |
|---|---|---|
| 10 N1 | req-ui-017: nur Objekte der Anwendung, die auf der Zeichenfläche liegen können | ja (req-ui-017 Absatz 2: „die Objekte der Anwendung, die auf der Zeichenfläche liegen können“) |
| 10 N2 | Glossar „Eingang“ (Softwarearchitekt); welche Eingänge es gibt: Spezifikation | ja (Eingang auch unverbunden, Parameter als Eingang, Verweis auf req-fach-046 und req-ablauf-007). Siehe N5. Welche Eingänge es gibt: nicht Gegenstand. |
| 10 N3 | req-ui-015: Beispiele, Ergebnisse von Regeln, Dativ | ja („zum Beispiel aus …“, „Ergebnissen vorangehender Elemente und von Regeln“, „Strategieparametern und festen Werten“) |
| 10 N4 | Spezifikation | nicht Gegenstand |
| 10 N5 | req-fach-036: Namen frei, auch mit Bindestrich; Schreibweise im Ausdruck: Spezifikation | ja („auch mit Leerzeichen, Umlauten und Zeichen wie dem Bindestrich“). Passt zu req-ui-016 Absatz 2. |
| 11 N1 | req-fach-046: Zählung auf jedem Instrument | ja. Zum Wortlaut siehe N3, zur Zuordnung N2. |
| 11 N2 | req-fach-051: Kerze und Tick ohne Instanz haben das Instrument des Auslösers | teilweise wörtlich, siehe N1; zur Zuordnung N2 |
| 11 N3 | req-fach-053: Instrument der Order ausdrücklich vorbelegt | ja („ebenso die Eigenschaft `Instrument` einer Order“). Siehe N4. |
| 11 N4 | req-fach-019: Preis ist der Kurs des Instruments der Order; Regelvorlage: Spezifikation | ja („der aktuelle Kurs des Instruments der Order in ihrer Handelsrichtung“). Siehe N4. Regelvorlage: nicht Gegenstand. |
| 11 N5 | req-fach-015: Parameter nach dem Fachmodell; Glossar (Softwarearchitekt) | ja (req-fach-015: „Die Auslösertypen und ihre Parameter legt das Fachmodell fest“; Glossar „Auslöser“ mit Parameter `Instrument`, „Anwendung einer Strategie“ mit weiteren Instrumenten). Siehe N6. |
| 11 N6 | Änderungsnachweis: Eintrag zu Durchlauf 9 zurückgesetzt, Entscheidung zu req-fach-053 als eigener Eintrag | ja (siehe „Geprüft“, Punkt 4) |

## Testfälle

Nur nach den Dokumenten, ohne laufende Anwendung:

- `str-01`: Auslöser `Kerzenschluss` (Abschnitt 1) und in der Verwaltung `Tick` und `Kerzenschluss` (Abschnitt 6) bleiben mit dem Instrument der Anwendung vorbelegt (req-fach-053). Kerze und Tick ohne Instanz haben danach das Instrument der Anwendung (req-fach-051 neu). Die Stop-Order (Abschnitt 5) hat jetzt ausdrücklich das Instrument der Anwendung (req-fach-053 neu). Die Bedingung in Abschnitt 2 lässt sich mit `Strategie.wartende Orders` und `Strategie.offene Positionen` abbilden. Der Testfall handelt nur auf einem Instrument, daher ergibt die neue Zählung (req-fach-046) dasselbe. Die Namen „Entry-Puffer“ und „Stop-Puffer“ sind nach req-fach-036 neu ausdrücklich zulässig.
- `str-03`: Auslöser `Kerzenschluss` (Abschnitte 1 und 4), Marktorder (Abschnitt 3): Preis ist der Kurs des Instruments der Order, das mit dem Instrument der Anwendung vorbelegt ist (req-fach-019, req-fach-053). Das stimmt mit Abschnitt 3 („der aktuelle Kurs“) überein. „Position schließen“ (Abschnitt 4) siehe N4, ohne Auswirkung auf die Gestaltung. Der Name „Stop-Abstand“ ist nach req-fach-036 zulässig.
- Gestalten ohne Formeltext: req-ui-015 nennt die Wertquellen jetzt als Beispiele und ergänzt Ergebnisse von Regeln. Damit bleibt jede in Durchlauf 10 für die Testfälle festgestellte Wertquelle wählbar.
- Speichern und Laden: Keine Änderung führt einen Pflichtparameter ohne Vorbelegung ein. Die Konsistenzprüfung (req-ablauf-007) meldet daher für keinen Testfall einen neuen Fehler. Zum Begriff „Eingang ohne Wert“ siehe N5.

## Blockierende Befunde

Keine.

## Hinweise

### N1 – req-fach-051: Tick und Instrument ohne Instanz, wenn ein anderer Auslöser die Auswertung startet

- Fundstelle: `fachmodell.md` req-fach-051, Absatz 1 („die Kerze hat dann Zeiteinheit und Instrument des Auslösers `Kerzenschluss`, der die Auswertung gestartet hat, ebenso der `Tick` das Instrument des Auslösers `Tick`“). Dazu `requirements-11-response.md`, Zeile 11 N2 („Kerze und Tick ohne Instanz haben das Instrument des Auslösers“) und req-fach-053, Absatz nach der Tabelle (Vorbelegung mit dem Instrument der Anwendung).
- Sachverhalt: Der Text regelt den Tick ohne Instanz nur für den Fall, dass ein Auslöser `Tick` die Auswertung startet. Startet ein Auslöser `Kerzenschluss` auf Instrument B die Auswertung, hat `Kerze` ohne Instanz das Instrument B. Für `Tick` ohne Instanz sagt req-fach-051 dann nichts. Nach req-fach-053 wäre es das Instrument der Anwendung A. Ebenso bleibt `Instrument` ohne Instanz (zum Beispiel `Instrument.Spread`) immer A. Ein Ausdruck verwendet dann Kerze von B, Tick und Spread von A. Die Antwort sagt allgemein „das Instrument des Auslösers“, der Text ist enger. Beide Testfälle arbeiten nur auf dem Instrument der Anwendung. Dort fallen alle Lesarten zusammen.
- Zuordnung: folgt aus einer Festlegung, soweit die Bearbeitung von 11 N2 gilt (req-fach-051 neu: Kerze ohne Instanz übernimmt das Instrument des Auslösers; Antwort zu 11 N2). Zur Zuordnung dieser Bearbeitung selbst siehe N2.
- Kritikpunkt: Der Text deckt nicht alle Fälle ab, die die Antwort zu 11 N2 beschreibt. Für `Tick` bei einem anderen Auslöser und für `Instrument` ohne Instanz fehlt eine Aussage, welches Instrument gilt.

### N2 – Zuordnung der Bearbeitung von 11 N1 und 11 N2

- Fundstelle: `requirements-11-response.md`, Absatz 1 („Durchlauf 11 N1 und N2 folgen aus der Regel ‚Keine Einschränkung ohne Erfordernis‘ … und der Entscheidung zu req-fach-053“). Dazu `fachmodell.md` Änderungsnachweis, letzter Eintrag, sowie `entwicklungsverfahren.md`, „Fragen an den Auftraggeber“, letzter Absatz („Ist die Zuordnung nicht eindeutig, entscheidet der Softwarearchitekt; nur wenn er sie nicht treffen kann, gilt der Befund als Entscheidung des Auftraggebers.“).
- Sachverhalt: Durchlauf 11 hat N1 und N2 der Gruppe „Entscheidung des Auftraggebers“ zugeordnet. Der Projektleiter hat beide ohne Vorlage bearbeitet. Bei 11 N1 hob die alte Fassung eine Zählung auf, die auf ein Instrument beschränkt war. Die Regel „Keine Einschränkung ohne Erfordernis“ trägt diese Bearbeitung nachvollziehbar. Bei 11 N2 standen zwei Lesarten zur Wahl: das Instrument der Anwendung oder das des Auslösers. Keine der beiden schränkt ein, denn eine Kerze mit gesetztem Instrument kann der Anwender in beiden Fällen auf die Zeichenfläche legen (req-fach-051, req-fach-053). Welche Einschränkung die Regel hier aufhebt, nennen weder die Antwort noch der Änderungsnachweis. Die Zuordnung ist damit nicht eindeutig. Ob der Softwarearchitekt sie entschieden hat, geht aus den Dokumenten nicht hervor. Die Testfälle sind nicht betroffen.
- Zuordnung: nicht eindeutig. Nach `entwicklungsverfahren.md`, „Fragen an den Auftraggeber“, entscheidet darüber der Softwarearchitekt.
- Kritikpunkt: Die Begründung, dass die Bearbeitung von 11 N2 ohne Vorlage aus der Regel „Keine Einschränkung ohne Erfordernis“ folgt, ist nicht nachvollziehbar belegt. Eine Entscheidung des Softwarearchitekten über die Zuordnung ist nicht dokumentiert.

### N3 – req-fach-046: „auf jedem Instrument“ lässt zwei Lesarten zu

- Fundstelle: `fachmodell.md` req-fach-046 („`wartende Orders` und `offene Positionen` -- Anzahl der Orders und Positionen, die diese Anwendung der Strategie gestellt beziehungsweise eröffnet hat, auf jedem Instrument.“). Dazu `str-01` Abschnitt 2 („Besteht aus dieser Strategie auf diesem Konto und Instrument bereits eine wartende Order oder eine offene Position …“).
- Sachverhalt: Die Antwort zu 11 N1 meint eine Zählung über alle Instrumente der Anwendung. „Anzahl …, auf jedem Instrument“ lässt sich aber auch als eine Anzahl je Instrument lesen. Die Frage nach einer Anzahl je Instrument aus Durchlauf 11 N1 bleibt damit im Text mehrdeutig. `str-01` Abschnitt 2 spricht weiter von „diesem Konto und Instrument“. Weil `str-01` nur auf dem Instrument der Anwendung handelt, ergibt sich derselbe Wert. Die Abbildung des Testfalls ist nicht betroffen.
- Zuordnung: folgt aus einer Festlegung (Bearbeitung 11 N1, `requirements-11-response.md`: „zählen auf jedem Instrument der Anwendung“; Eigenschaft als vorläufig gekennzeichnet).
- Kritikpunkt: Der Wortlaut sagt nicht eindeutig, ob eine Gesamtzahl über alle Instrumente oder eine Anzahl je Instrument gemeint ist.

### N4 – req-fach-053 und req-fach-019: Instrument der Order bei der `CloseOrder` und Bezug von „er“

- Fundstelle: `fachmodell.md` req-fach-053, Absatz nach der Tabelle („… haben den Parameter `Instrument`, vorbelegt mit dem Instrument der Anwendung, ebenso die Eigenschaft `Instrument` einer Order; belegt werden kann er auch mit einem Strategieparameter …“). req-fach-019 `Preis` („der aktuelle Kurs des Instruments der Order in ihrer Handelsrichtung …; bei der `CloseOrder` die Gegenrichtung der Position“). Dazu req-fach-028 und req-fach-029 (`Instrument` -- MUSS), req-fach-032 (`CloseOrder` mit `Position`, ohne `Instrument`), req-fach-052 (`Position` mit `Instrument`). Betroffen: `str-03` Abschnitt 4 („Position schließen“).
- Sachverhalt:
  - `Instrument` ist keine allgemeine Eigenschaft von `Order` (req-fach-019), sondern eine der `MarketOrder` und der wartenden Ordertypen. Die `CloseOrder` hat kein eigenes Instrument, es folgt aus ihrer Position. req-fach-053 („die Eigenschaft `Instrument` einer Order“, vorbelegt mit dem Instrument der Anwendung) und req-fach-019 („Kurs des Instruments der Order“, ausdrücklich auch für die `CloseOrder`) sprechen trotzdem allgemein vom Instrument der Order. Gemeint ist bei der `CloseOrder` das Instrument der Position. Das steht nicht da. Die Vorbelegung mit dem Instrument der Anwendung passt bei der `CloseOrder` nicht, wenn die Position auf einem anderen Instrument liegt.
  - Im selben Satz bezieht sich „belegt werden kann er“ auf „den Parameter“. Die neu eingefügte „Eigenschaft `Instrument` einer Order“ ist davon sprachlich nicht erfasst. Dass sie ebenso belegt werden kann, ergibt sich aus req-fach-046, letzter Absatz („Parameter und Eigenschaften verwendeter Objekte … können mit einem festen Wert, mit einem Strategieparameter … belegt werden“).
  - Für `str-03` ohne Auswirkung: Die Schließorder liegt auf dem Instrument der Anwendung, ihr Preis wird im Testfall nicht verwendet.
- Zuordnung: folgt aus einer Festlegung (req-fach-032: `CloseOrder` referenziert die Position; req-fach-052: `Position.Instrument`; req-fach-046 letzter Absatz).
- Kritikpunkt: Bei der `CloseOrder` ist nicht ausdrücklich gesagt, dass das Instrument der Order das Instrument der Position ist. Der Satz in req-fach-053 erfasst die Eigenschaft der Order sprachlich nicht bei der Belegung.

### N5 – Glossar „Eingang“ schließt die Ablaufverbindung ein, req-ablauf-007 spricht von „Eingang ohne Wert“

- Fundstelle: `glossar.md`, Eintrag „Eingang“ („die Stelle eines Elements, an der eine Verbindung ankommen kann: beim Element des Ablaufs die Stelle für die ankommende Ablaufverbindung, außerdem jede Stelle, an der das Element einen Wert über eine Datenverbindung erhalten kann …“). Dazu `anforderungen-strategiedesigner.md` req-ablauf-007, zweiter Punkt („Element des Ablaufs ohne Verbindung (Fehler)“) und vierter Punkt („Eingang ohne Wert (Fehler), ausgenommen optionale Parameter … und Parameter, deren Wert erst bei der Anwendung übergeben wird“).
- Sachverhalt: Nach dem neuen Eintrag ist auch die Stelle für die ankommende Ablaufverbindung ein Eingang. Diese Stelle erhält nie einen Wert. Wörtlich gelesen hat damit jedes Element des Ablaufs einen „Eingang ohne Wert“ nach dem vierten Punkt. Gemeint ist dort erkennbar nur ein Eingang für Werte. Eine fehlende Ablaufverbindung deckt der zweite Punkt ab. Die Testfälle sind nicht betroffen, wenn man den vierten Punkt so liest.
- Zuordnung: Sache der Spezifikation (welche Eingänge es gibt und welcher Befund gemeldet wird, wie schon 10 N2 laut `requirements-11-response.md`).
- Kritikpunkt: Mit dem erweiterten Eintrag „Eingang“ ist der vierte Punkt von req-ablauf-007 weiter gefasst als gemeint.

### N6 – Glossar „Auslöser“: Bezug von „Es“

- Fundstelle: `glossar.md`, Eintrag „Auslöser“ („… Kerzenschluss und Tick haben den Parameter `Instrument`, vorbelegt mit dem Instrument der Anwendung (req-fach-053). Es steht am Anfang des Ablaufs oder der Verwaltung.“).
- Sachverhalt: Der neue Satz steht zwischen dem ersten Satz („Ein Element, das …“) und „Es steht am Anfang“. „Es“ bezieht sich auf das Element im ersten Satz. Der Satz davor hat aber „Kerzenschluss und Tick“ als Subjekt. Der Bezug ist dadurch schwerer zu erkennen. Die Bedeutung bleibt eindeutig, weil Kerzenschluss und Tick zwei sind und „Es“ Einzahl ist.
- Zuordnung: folgt aus einer Festlegung (req-fach-015: Auslöser ist ein Element am Anfang des Ablaufs oder der Verwaltung).
- Kritikpunkt: Der eingefügte Satz trennt „Es“ von seinem Bezugswort.

## Nicht geprüft

Nach dem Prüfauftrag nicht Gegenstand:

- seit Durchlauf 11 unveränderte Stellen, soweit sie keiner geänderten Stelle widersprechen
- die der Spezifikation zugeordneten Hinweise 10 N4, Teile von 10 N2 (welche Eingänge es gibt), 10 N5 (Schreibweise im Ausdruck) und 11 N4 (Ausdruck der Regelvorlage „Risiko je Trade“)
- `anforderungen-handelssystem.md` und die Stellen des Fachmodells zur Ausführung
- die Vorlagen unter `docs/design/planning/`
- Spezifikation, Plan und der Code von `wp02`
- die als offen gekennzeichneten Punkte, darunter die Bezeichnung eines festen Instruments und das externe Ereignis (req-fach-053) und die Schreibweise von Namen im Ausdruck (req-fach-036). Keiner davon ist für Gestaltung, Speichern oder Laden der Testfälle nötig.
- die technischen Dokumente außer dem Glossar

Ob die Prüfschleife eine Ebene höher geht, entscheidet nicht die QA.
