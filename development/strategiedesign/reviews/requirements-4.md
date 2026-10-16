# Prüfbericht Dokumente des Auftraggebers, Durchlauf 4 (Nachprüfung)

- Vorhaben: `strategiedesign`
- Phase: 2 Konzeption, Nachprüfung der Dokumente des Auftraggebers
- Rolle: QA
- geprüfter Commit: `a8d377f41bea2ef170510ef4dfa4e0b344a61619` (`main`, entspricht `origin/main` zum Zeitpunkt der Prüfung)
- Vergleichsstand: `3169bc31049c5ff38bcea5398c47918604e2884f` (Durchlauf 3)
- Prüfauftrag: `development/strategiedesign/reviews/requirements-4-order.md`

## Ergebnis

**nicht bestanden**

Die blockierenden Befunde N4, N5 und N6 aus Durchlauf 3 sind erledigt. Maßstab waren die Entscheidungen des Auftraggebers in `requirements-3-response.md`. Die Hinweise H1 bis H9 sind eingearbeitet. Bei H2 und H6 gibt es Restpunkte (Abschnitt 3).

Die Nachprüfung ist trotzdem nicht bestanden. Grund ist ein neuer blockierender Befund (N7). Er entsteht aus der Bearbeitung von H2 in req-fach-051. Dort steht jetzt: `Order` und `Position` sind nur in der Verwaltung einer Order verfügbar. Die Konsistenzprüfung meldet jede Verwendung an anderer Stelle als Fehler. Die Regelvorlage „Risiko je Trade“ verwendet aber `Order.Preis` und `Order.Stop-Loss`. In beiden Testfällen ist sie eine Regel der Strategie. Sie wirkt schon bei „Order aufgeben“ im Hauptablauf, also außerhalb der Verwaltung. Nach dem Wortlaut wären beide Testfälle bei der Konsistenzprüfung fehlerhaft.

Blockierend heißt nach „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Der Befund widerspricht einer Anforderung oder einem Abnahmekriterium, beeinträchtigt die Funktion oder ist eine Sicherheitslücke.

Hinweis zum Verfahren: Laut `docs/technical/entwicklungsverfahren.md`, Phase 1, Zeile „Schleifen“, hat diese Prüfschleife höchstens drei Durchläufe. Danach entscheidet der Auftraggeber über die verbleibenden Befunde. Dies ist der vierte Durchlauf. Ob für N7 eine Entscheidung des Auftraggebers nötig ist, entscheidet nicht die QA.

## Geprüfte Unterlagen

- `docs/design/requirements/anforderungen-gesamtsystem.md`
- `docs/design/requirements/anforderungen-strategiedesigner.md`
- `docs/design/domain/fachmodell.md`
- `docs/design/domain/indikator-markttechnik.md` (in diesem Durchlauf unverändert)
- `docs/design/strategies/str-01-fachlich-scalping-punkt-2-ausbruch-einfach.md`
- `docs/design/strategies/str-03-fachlich-ema-trendfolge.md`
- `docs/technical/glossar.md`
- `development/strategiedesign/scope.md`
- Maßstab: `development/strategiedesign/reviews/requirements-3.md` und `requirements-3-response.md`, dazu der Grundsatz des Auftraggebers „keine Einschränkung ohne klare Notwendigkeit“ aus `requirements-2-response.md`
- Geprüfte Änderungen: `git diff 3169bc31049c5ff38bcea5398c47918604e2884f a8d377f41bea2ef170510ef4dfa4e0b344a61619 -- docs/design docs/technical/glossar.md`

Wie im Auftrag festgelegt, wurden nicht geprüft: `anforderungen-handelssystem.md`, die Stellen des Fachmodells zur Ausführung von Strategien, die Vorlagen unter `docs/design/planning/`. Ebenfalls kein Befund ist ein Punkt, der als offen gekennzeichnet ist. Dazu gehört die Maßnahme bei überschrittener Risikogrenze nach der Ausführung, die in `str-03` unter „Offene fachliche Fragen“ steht. Zur Regelvorlage für die Margin-Prüfung: Hinweis H12.

---

## 1. Befunde aus Durchlauf 3

### Blockierende Befunde

| Befund | Ergebnis | Nachweis |
|---|---|---|
| N4 Einstieg der Regelvorlage „Risiko je Trade“ bei einer Marktorder | erledigt | Fachmodell req-fach-028, letzter Absatz: „Jede Order hat einen `Preis`.“ Bei der Marktorder ist das bis zur Ausführung der aktuelle Kurs (`Tick.Brief` bei `buy`, `Tick.Geld` bei `sell`), danach der Ausführungspreis. „Regeln rechnen mit diesem Preis.“ Strategiedesigner req-core-002: Eingangswert `Order.Preis` für alle Ordertypen, erneute Prüfung nach der Ausführung, bei „Position ändern“ Rechnung ab `Position.Einstiegspreis`. `str-03` Abschnitte 3 und 4 sind angeglichen. Damit sind alle drei Fragen aus Durchlauf 3 beantwortet. Restpunkte: Hinweise H1 bis H3. |
| N5 Regeln der Strategie bei „Position schließen“ | erledigt | Fachmodell req-fach-046, Absatz „Regeln der Strategie …“: Eine Regel, die eine Eigenschaft voraussetzt, die der Ordertyp nicht hat, wird auf diese Order nicht angewendet. Eine Risikoregel mit Stop-Loss gilt nicht für eine `CloseOrder`. Strategiedesigner req-core-002, letzter Satz: „Für eine Schließorder gilt sie nicht.“ `str-03` Abschnitt 4: „Position schließen“ ohne Volumenangabe schließt ganz, die Risikoregel gilt für die Schließorder nicht. Das entspricht req-fach-032 und req-fach-049a. Restpunkt: Hinweis H4. |
| N6 Prüfung der freien Margin in `str-01` | erledigt | `str-01` Voraussetzungen: Die freie Margin wird nicht mehr genannt. Abschnitt 4: „Eine Prüfung der freien Margin ist nicht Teil dieses Testfalls.“ Bestätigungsvermerk: „Margin-Prüfung aus dem Testfall genommen im Chat am 2026-10-16“. Restpunkt außerhalb der Testfälle: Hinweis H12. |

### Hinweise H1 bis H9 aus Durchlauf 3

| Hinweis | Ergebnis | Nachweis |
|---|---|---|
| H1 Zeiteinheit einer einzeln verwendeten Kerze | eingearbeitet | req-fach-051, erster Absatz: Liegt keine Kerze als Instanz auf der Zeichenfläche, gilt die Zeiteinheit des Auslösers `Kerzenschluss`. Bei anderen Auslösern muss eine Kerze mit gesetzter Zeiteinheit auf der Zeichenfläche liegen, sonst Fehler. Liegen Instanzen dort, gelten deren Parameter. Alle drei Teilfragen sind beantwortet. |
| H2 Order, Position und Strategie als Objekte der Anwendung | eingearbeitet, mit neuem Fehler | req-fach-051: Order und Position nur in der Verwaltung. req-fach-001, req-ablauf-003 und Glossar zählen alle sieben Objekte auf. Die Einschränkung führt zu N7. Weitere Restpunkte: Hinweise H5 und H6. |
| H3 Objekttyp eines mitgelieferten Indikators | eingearbeitet | req-ui-005: „ema21, aus Objekttyp EMA“. Glossar „Objekttyp“: EMA und Markttechnik als Objekttypen, „Markttechnik-Trend“ entfernt. Restpunkt: Hinweis H7. |
| H4 „Nächstkleineres Zeiteinheitenpaar“ | eingearbeitet | `str-01` Abschnitt 4, letzter Absatz: „mit kleineren Zeiteinheiten“, Neustart mit anderen Werten der beiden Strategieparameter. |
| H5 Handelszeiteinheit kleiner als Signalzeiteinheit | eingearbeitet | `str-01` Abschnitt 2: Vorgabe an den Anwender, keine Prüfung im Ablauf oder in der Konsistenzprüfung. |
| H6 Eingangswerte der Regelvorlage | eingearbeitet, mit Restpunkt | req-core-002 nennt Tickgröße und Kapital. `str-01` Voraussetzungen nennen die Tickgröße. Für die prüfende Rolle fehlen weiterhin Eingangswerte (Hinweis H3). |
| H7 Begriffe zum Objektspeicher | eingearbeitet | req-system-015 und req-ui-009: „Vorhaben `strategiedesign`“, Objektverzeichnis. Glossar: Einträge „Objektspeicher“ und „Objektverzeichnis“. req-ui-009 nennt „Verzeichnis“ nicht mehr doppelt. |
| H8 Bestätigungsvermerke der Testfälle | eingearbeitet | `str-01` und `str-03`, Abschnitt „Bestätigungsvermerk“: Risikoregel und Entscheidungen vom 2026-10-16 vermerkt. |
| H9 Bindungsart im Glossar | eingearbeitet | Glossar „Bindungsart“ nennt den Strategieparameter, mit Verweis auf req-fach-046. |

---

## 2. Neuer blockierender Befund

### N7 – `Order` nur in der Verwaltung verfügbar, Regeln der Strategie verwenden `Order` außerhalb

- Fundstelle: Fachmodell req-fach-051, erster Absatz, letzter Satz (in diesem Durchlauf neu). Strategiedesigner req-ablauf-003, zweiter Absatz (neu). Dagegen: Strategiedesigner req-core-002 (Eingangswerte `Order.Preis`, `Order.Stop-Loss`). Fachmodell req-fach-036, letzter Absatz (`Order`, `Position` als Namen in Ausdrücken von Regeln). req-fach-040 (Kontextbindung einer Regel). req-fach-046 (Regeln der Strategie gelten für jede Order). req-fach-049 (prüfende Regel bei „Order aufgeben“, zum Beispiel Mindestvolumen). Glossar „Objekte der Anwendung“ („in Ausdrücken sind sie immer verfügbar“). Strategiedesigner req-ablauf-007 („unbekannte Eigenschaft“, Fehler; „Eine Strategie mit Fehlern kann nicht ausgeführt werden“). `str-01` Abschnitt 4. `str-03` Abschnitt 3.
- Sachverhalt: req-fach-051 sagt jetzt: „`Order` und `Position` sind nur in der Verwaltung einer Order verfügbar (req-fach-049a), die Konsistenzprüfung meldet ihre Verwendung an anderer Stelle als Fehler.“ req-ablauf-003 sagt dasselbe. Die Verwaltung ist nach req-fach-049a „der Teil des Ablaufs, der am Ausgang `gestellt` von `Order aufgeben` folgt“.
  Die Regelvorlage „Risiko je Trade“ hat laut req-core-002 die Eingangswerte `Order.Preis` und `Order.Stop-Loss`. In `str-01` (Abschnitt 4) und `str-03` (Abschnitt 3) ist sie eine Regel der Strategie. Sie bestimmt das Volumen, wenn „Order aufgeben“ im Hauptablauf die Order aufgibt. Eine Regel der Strategie gehört nicht zum Ablauf der Verwaltung. Dasselbe gilt für die Prüfung des Mindestvolumens in beiden Testfällen. Laut req-fach-049 ist sie eine prüfende Regel der Strategie oder des Elements „Order aufgeben“. Sie braucht das Volumen der Order. Auch die Vorlage selbst wird beim Speichern geprüft (req-ablauf-007) und liegt in keiner Verwaltung.
  Nach dem Wortlaut von req-fach-051 meldet die Konsistenzprüfung diese Regeln als Fehler. Eine Strategie mit Fehlern kann nicht ausgeführt werden (req-ablauf-007). Nach req-grund-001 ist das Ergebnis des Strategiedesigners aber eine ausführbare Strategie. Dagegen sehen req-fach-036 ausdrücklich `Order` und `Position` als Namen in Ausdrücken von Regeln vor. Nach req-fach-040 wird das Objekt einer Regel aus dem Zusammenhang ihrer Anwendung bestimmt. Das Glossar sagt weiter, Objekte der Anwendung seien „in Ausdrücken immer verfügbar“.
  Die Einschränkung stammt aus der Bearbeitung von H2. Laut `requirements-3-response.md` hat sie der Projektleiter vorgenommen. Laut Änderungsnachweis des Fachmodells (Eintrag 2026-10-16) ist sie eine Entscheidung des Auftraggebers. Der Grundsatz des Auftraggebers ist „keine Einschränkung ohne klare Notwendigkeit“.
- Fragen: Gilt die Einschränkung „nur in der Verwaltung“ auch für Ausdrücke von Regeln? Das betrifft Regeln der Strategie, Regeln an „Order aufgeben“ und gespeicherte Regelvorlagen. Wenn nein: Für welche Ausdrücke gilt sie, und wie wird `Order` in einer Regel außerhalb der Verwaltung bestimmt? Wenn ja: Wie verwendet die Regel „Risiko je Trade“ Preis, Stop-Loss und Volumen der Order, die „Order aufgeben“ gerade aufgibt? Wer hat die Einschränkung festgelegt, der Auftraggeber oder der Projektleiter?

---

## 3. Hinweise (nicht blockierend)

### H1 – `Preis` als Eigenschaft jeder Order

- Fundstelle: Fachmodell req-fach-028, letzter Absatz; req-fach-019; req-fach-029 (Tabelle, `StopLimitOrder`); req-fach-032 (`CloseOrder`); Strategiedesigner req-core-002
- Sachverhalt: „Jede Order hat einen `Preis`“ steht nur im Abschnitt zur `MarketOrder`. Die Liste der allgemeinen Eigenschaften in req-fach-019 enthält `Preis` nicht. Nach dem letzten Satz von req-fach-019 gehört eine Eigenschaft dorthin, wenn alle Ordertypen sie brauchen. Auch die Liste der `MarketOrder` in req-fach-028 nennt `Preis` nicht. Was der Preis einer `CloseOrder` ist, steht nirgends. Bei der `StopLimitOrder` ist `Preis` der Auslösepreis. Eingestiegen wird dort aber zum `Limitpreis`. Die Regel „Risiko je Trade“ rechnet laut req-core-002 mit `Order.Preis` für alle Ordertypen. Bei einer Stop-Limit-Order wäre das der Auslösepreis. Die Testfälle sind nicht betroffen.
- Fragen: Gehört `Preis` zu den allgemeinen Eigenschaften in req-fach-019? Welchen Preis hat eine `CloseOrder`? Ab welchem Preis rechnet die Regel bei einer Stop-Limit-Order?

### H2 – Prüfung nach der Ausführung nur in req-core-002 beschrieben

- Fundstelle: Strategiedesigner req-core-002 („nach der Ausführung prüft die Regel mit dem Ausführungspreis erneut“); Fachmodell req-fach-020, req-fach-021, req-fach-049a; `str-03` Abschnitt 4 und „Offene fachliche Fragen“
- Sachverhalt: Das Fachmodell nennt als Zeitpunkte für Regeln nur das Aufgeben einer Order (req-fach-021, req-fach-049) sowie „Order ändern“ und „Position ändern“ (req-fach-049a). Eine Anwendung nach der Ausführung beschreibt es nicht. Nicht beschrieben ist auch, ob sie nur für diese Regelvorlage gilt oder für alle prüfenden Regeln, und ob sie nur für Marktorders gilt. Was bei Nichteinhaltung folgt, ist nur in `str-03` als offen gekennzeichnet, und nur für diesen Testfall. In req-core-002 und im Fachmodell ist es nicht als offen gekennzeichnet. In `str-03` Abschnitt 4 steht der Satz in der Beschreibung der Verwaltung. Der Leser kann ihn als Teil des Ablaufs der Verwaltung missverstehen, den der Anwender gestaltet. Für die Gestaltung der Testfälle wird der Punkt nicht gebraucht.
- Fragen: Wo im Fachmodell wird die Anwendung von Regeln nach der Ausführung beschrieben? Ist offen, was bei Nichteinhaltung folgt, und gilt das allgemein oder nur für `str-03`?

### H3 – Eingangswerte für die prüfende Rolle der Regelvorlage

- Fundstelle: Strategiedesigner req-core-002; Fachmodell req-fach-052; `str-03` Abschnitt 4
- Sachverhalt: Die Liste der Eingangswerte nennt kein Volumen. Für die Prüfung „ob der Verlust bis zum Stop-Loss die Risikogrenze einhält“ wird das Volumen gebraucht: bei „Order ändern“ das der Order, bei „Position ändern“ und nach der Ausführung das der Position. Der Text nennt `Position.Einstiegspreis`. Die Liste nennt diesen Wert nicht. Bei „Position ändern“ ist der neue Stop-Loss der Stop-Loss der Position. `Order.Stop-Loss` behält den ursprünglichen Wert. Die Liste nennt nur `Order.Stop-Loss`. Laut Entscheidung zu N4 gilt „ein fachlicher Ausdruck für alle Ordertypen“. Wie dieser eine Ausdruck zwischen Order und Position unterscheidet, ist nicht gesagt.
- Kritikpunkt: Die Liste der Eingangswerte ist für die prüfende Rolle unvollständig.

### H4 – Geltungsbereich des Grundsatzes „Regel wird nicht angewendet“

- Fundstelle: Fachmodell req-fach-046, Absatz „Regeln der Strategie …“; Strategiedesigner req-ui-012, req-ablauf-007
- Sachverhalt: Laut Entscheidung des Auftraggebers zu N5 gilt allgemein: Eine Regel wird auf eine Order nicht angewendet, wenn sie eine Eigenschaft voraussetzt, die der Ordertyp nicht hat. Im Fachmodell steht der Satz bei den Regeln der Strategie, vor dem Satz über die Regeln der Elemente. Ob er auch für Regeln an einem Element gilt, ist dadurch nicht eindeutig. Ein Beispiel ist eine Risikoregel am Element „Position schließen“ (req-ui-012). Offen ist auch, ob die Konsistenzprüfung eine solche Zuordnung als „unbekannte Eigenschaft“ meldet (req-ablauf-007) oder ob die Regel ohne Meldung nicht angewendet wird.
- Fragen: Gilt der Grundsatz auch für Regeln an Elementen? Meldet die Konsistenzprüfung eine Regel an einem Element, die der Ordertyp dieses Elements nicht erfüllen kann?

### H5 – Order, Position und Strategie als Instanzen auf der Zeichenfläche

- Fundstelle: Fachmodell req-fach-051, erster Absatz; Strategiedesigner req-ablauf-003, zweiter Absatz; Glossar „Objekte der Anwendung“
- Sachverhalt: Alle Objekte der Anwendung können „wie andere Objekte als Instanz auf die Zeichenfläche gelegt werden“. Eine Strategie kann mehrere Instanzen davon verwenden. Liegen Instanzen dort, sprechen Ausdrücke sie über ihren Namen an. Das gilt jetzt auch für Order, Position und Strategie. Nicht beschrieben ist, welche Order eine selbst gelegte Instanz `Order` bezeichnet, ob sie in der Verwaltung liegen muss und was mehrere Instanzen von `Strategie` bedeuten. Die Testfälle legen keine solche Instanz.
- Frage: Können Order, Position und Strategie als Instanz auf die Zeichenfläche gelegt werden, auch mehrfach?

### H6 – Doppelte Nennung in req-fach-001

- Fundstelle: Strategiedesigner req-fach-001, Aufzählung
- Sachverhalt: Die Aufzählung nennt `Order` und `Position` zweimal: einmal als eigene Beispiele, einmal unter den Objekten der Anwendung. Ob damit zwei verschiedene Dinge gemeint sind, bleibt offen.

### H7 – Objekttyp eines vom Anwender angelegten Indikators

- Fundstelle: Glossar „Objekttyp“; Strategiedesigner req-ui-005, req-ablauf-004, req-fach-009
- Sachverhalt: Nach dem neuen Glossar ist ein mitgelieferter Indikator wie „EMA“ selbst ein Objekttyp. Daneben werden „Regel“ und „Trend“ als Objekttypen genannt. Beim Anlegen eines Objekts wählt der Anwender laut req-ablauf-004 „einen Objekttyp“. Ob er dort „Indikator“ wählt und welchen Objekttyp die Herkunftsangabe nach req-ui-005 dann nennt, ist nicht gesagt. Das Beispiel in req-ui-005 schreibt `ema21`, req-ablauf-003 und `str-03` schreiben `EMA21`.
- Frage: Welchen Objekttyp hat ein vom Anwender angelegter Indikator?

### H8 – Herkunft der Änderungen vom 2026-10-16

- Fundstelle: `requirements-3-response.md`, Abschnitt „Vom Projektleiter bearbeitet“; Änderungsnachweis des Fachmodells und des Strategiedesigners, Einträge 2026-10-16
- Sachverhalt: Laut `requirements-3-response.md` hat der Projektleiter H1, H2, H3, H6 und H7 bearbeitet. Die Änderungsnachweise führen diese Änderungen als „Entscheidungen des Auftraggebers … abgestimmt im Chat am 2026-10-16“. Ein Beispiel ist req-fach-051 (Kerze, Order und Position). Wer die Festlegung getroffen hat, ist dadurch unklar. Das betrifft auch N7.
- Frage: Welche der Änderungen vom 2026-10-16 hat der Auftraggeber entschieden?

### H9 – Reihenfolge der Änderungsnachweise

- Fundstelle: Änderungsnachweise von Fachmodell, Strategiedesigner und Glossar
- Sachverhalt: Fachmodell und Strategiedesigner sind aufsteigend nach Datum geordnet. Der neue Eintrag vom 2026-10-16 steht vor einem Eintrag vom 2026-10-15. Das Glossar ist absteigend geordnet. Der Eintrag vom 2026-10-16 steht dort zwischen zwei Einträgen vom 2026-10-15. Zum Ordnen nach Datum gab es in Durchlauf 2 den Hinweis H15.

### H10 – Bezug von „es“ in `str-03` Abschnitt 3

- Fundstelle: `str-03` Abschnitt 3, letzte zwei Sätze
- Sachverhalt: Zwischen den Satz über das Volumen und den Satz „Liegt es unter dem Mindestvolumen …“ wurde ein Satz über den Preis eingefügt. „Es“ bezieht sich jetzt nicht mehr eindeutig auf das Volumen.

### H11 – Eingangswerte in `str-01` Abschnitt 4

- Fundstelle: `str-01` Abschnitt 4, erster Absatz; Strategiedesigner req-core-002
- Sachverhalt: `str-01` beschreibt die Regel weiter mit „aus Einstieg, Stop-Loss, Tickwert und einer Risikogrenze“. Die Tickgröße fehlt dort. Laut req-core-002 ist sie ein Eingangswert. Laut `str-01` Voraussetzungen wird sie benötigt.

### H12 – Margin-Prüfung im Fachmodell nicht als offen gekennzeichnet

- Fundstelle: Fachmodell req-fach-049, zweiter Absatz („oder die freie Margin nicht reicht“); req-fach-039; req-fach-051 (Konto, Instrument); `requirements-3-response.md`, Zeile N6; `scope.md`, „Offene Punkte des Auftraggebers“
- Sachverhalt: Laut Entscheidung zu N6 ist offen, ob es eine Regelvorlage zur Margin-Prüfung gibt. In den geltenden Dokumenten ist das nicht als offen gekennzeichnet. req-fach-049 nennt die Margin-Prüfung weiter als Beispiel einer prüfenden Regel. Den Marginbedarf einer Order liefert aber kein Objekt (Durchlauf 3, N6). Nach req-fach-039 lässt sich eine solche Regel daher nicht bilden. Auch `scope.md`, Abschnitt „Offene Punkte des Auftraggebers“, ist nicht ergänzt. Dort fehlen auch die anderen offenen Punkte aus Durchlauf 2 und 3: Bezug von `VORHER`, Geltungsdauer von `Parameter setzen`, Maßnahme nach der Prüfung nach Ausführung. Für die Testfälle wird nichts davon gebraucht.
- Frage: Soll die Margin-Prüfung in req-fach-049 als offen gekennzeichnet werden?

---

## 4. Abbildbarkeit der Testfälle an den geänderten Stellen

| Testfall | Ergebnis | Hinderungsgrund |
|---|---|---|
| `str-01` | nicht widerspruchsfrei abbildbar | N7: Risikoregel und Prüfung des Mindestvolumens verwenden `Order` außerhalb der Verwaltung |
| `str-03` | nicht widerspruchsfrei abbildbar | N7: wie `str-01` |

Gestalten, Speichern und Laden sind laut req-ablauf-005 und req-ablauf-007 auch mit Fehlern der Konsistenzprüfung möglich. Nach dem Wortlaut von req-fach-051 wären beide Testfälle danach aber als fehlerhaft markiert und nicht ausführbar. Nach req-grund-001 ist das Ergebnis des Strategiedesigners eine ausführbare Strategie.

An den geänderten Stellen lassen sich alle anderen Teile beider Testfälle mit den beschriebenen Objekten und Arbeitsabläufen gestalten:

- Preis der Marktorder in `str-03` aus `Tick.Brief` beziehungsweise `Tick.Geld` (req-fach-028)
- Risikoregel als Regel der Strategie: bestimmend bei „Order aufgeben“, prüfend bei „Order ändern“ (`str-01`) und „Position ändern“ (`str-03`), sofern N7 geklärt ist
- „Position schließen“ ohne Volumenangabe in `str-03`, ohne Anwendung der Risikoregel (req-fach-046, req-fach-049a)
- `Kerze.Schluss` in `str-03` ohne Kerze auf der Zeichenfläche: Hauptablauf und Verwaltung haben den Auslöser `Kerzenschluss` (req-fach-051)
- `Order.Status`, `Order.Stop-Loss`, `Position.Stop-Loss`, `Position.Richtung` in den Verwaltungen beider Testfälle (req-fach-051, req-fach-049a)
- `str-01` ohne Margin-Prüfung, mit Prüfung des Mindestvolumens (`Instrument.Mindestvolumen`), sofern N7 geklärt ist
- Herkunftsangabe der Instanzen (req-ui-005)

Speichern und Laden sind durch req-system-012, req-system-015, req-ui-009, req-ablauf-003 und req-ablauf-008 beschrieben. Die Begriffe Objektspeicher und Objektverzeichnis stehen jetzt im Glossar. An diesen Stellen gibt es keinen neuen Hinderungsgrund.

## 5. Zusammenfassung

| Art | Anzahl | blockierend |
|---|---|---|
| blockierende Befunde aus Durchlauf 3, erledigt | 3 (N4, N5, N6) | – |
| Hinweise aus Durchlauf 3 | 9 eingearbeitet (H2 mit neuem Fehler N7, H6 mit Restpunkt) | – |
| neue Befunde | 1 (N7) | ja |
| Hinweise | 12 (H1 bis H12) | nein |

Die Nachprüfung ist nicht bestanden. Grund ist N7. Laut `docs/technical/entwicklungsverfahren.md` geht der Bericht über den Softwarearchitekten an den Projektleiter. Die Grenze von drei Durchläufen dieser Prüfschleife ist überschritten. Ob über N7 der Auftraggeber entscheidet, liegt nicht bei der QA. Die Hinweise kann der Projektleiter bearbeiten oder verwerfen.
