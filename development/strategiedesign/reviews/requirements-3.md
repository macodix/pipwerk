# Prüfbericht Dokumente des Auftraggebers, Durchlauf 3 (Nachprüfung)

- Vorhaben: `strategiedesign`
- Phase: 2 Konzeption, Nachprüfung der Dokumente des Auftraggebers
- Rolle: QA
- geprüfter Commit: `3169bc31049c5ff38bcea5398c47918604e2884f` (`main`, entspricht `origin/main` zum Zeitpunkt der Prüfung)
- Vergleichsstand: `77dc527d7f411f7ae0470de98d75b600f964a283` (Durchlauf 2)
- Prüfauftrag: `development/strategiedesign/reviews/requirements-3-order.md`

## Ergebnis

**nicht bestanden**

Alle blockierenden Befunde aus Durchlauf 2 sind erledigt: A6, B2, N1, N2 und N3. D1 und D5 sind erledigt. Die Hinweise H1 bis H17 sind eingearbeitet oder verworfen.

Die Nachprüfung ist trotzdem nicht bestanden. Grund sind drei neue blockierende Befunde (N4 bis N6). N4 und N5 entstehen aus der neuen Beschreibung der Regelvorlage „Risiko je Trade“. N6 betrifft eine Stelle in `str-01`, die in diesem Durchlauf umformuliert wurde. Blockierend heißt nach „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Der Befund widerspricht einer Anforderung, oder er verhindert, dass ein Testfall so gestaltet werden kann, wie er beschrieben ist.

Kurz gefasst:

- Die Regelvorlage „Risiko je Trade“ berechnet das Volumen aus dem Einstieg. Eine Marktorder hat keinen Einstiegspreis. Damit ist offen, wie die Regel in `str-03` das Volumen bestimmt (N4).
- Die Regeln der Strategie gelten für jede Order. Ob das auch für die `CloseOrder` gilt, die „Position schließen“ veranlasst, ist nicht beschrieben. Gilt es, dann bestimmt die Risikoregel auch das Volumen beim Schließen. Das widerspricht dem vollständigen Schließen in `str-03` (N5).
- `str-01` prüft, ob genug freie Margin vorhanden ist. Für diese Prüfung fehlt die Angabe, wie viel Margin eine Order braucht. Kein Objekt liefert diesen Wert (N6).

Dies ist der dritte Durchlauf der Prüfschleife. Laut `docs/technical/entwicklungsverfahren.md`, Phase 1, Zeile „Schleifen“, sind höchstens drei Durchläufe aus Prüfung durch die QA und Korrektur durch den Projektleiter vorgesehen. Danach entscheidet der Auftraggeber über die verbleibenden Befunde.

## Geprüfte Unterlagen

- `docs/design/requirements/anforderungen-gesamtsystem.md`
- `docs/design/requirements/anforderungen-strategiedesigner.md`
- `docs/design/domain/fachmodell.md`
- `docs/design/domain/indikator-markttechnik.md` (in diesem Durchlauf unverändert)
- `docs/design/strategies/str-01-fachlich-scalping-punkt-2-ausbruch-einfach.md`
- `docs/design/strategies/str-03-fachlich-ema-trendfolge.md`
- `docs/technical/glossar.md`
- Maßstab: `development/strategiedesign/reviews/requirements-2.md` und `requirements-2-response.md`, dort der Grundsatz des Auftraggebers „keine Einschränkung ohne klare Notwendigkeit“
- Geprüfte Änderungen: `git diff 77dc527d7f411f7ae0470de98d75b600f964a283 3169bc31049c5ff38bcea5398c47918604e2884f -- docs/design docs/technical/glossar.md`

Wie im Auftrag festgelegt, wurden diese Unterlagen nicht geprüft: `anforderungen-handelssystem.md`, die Stellen des Fachmodells zur Ausführung und die Vorlagen unter `docs/design/planning/`. Diese offenen Punkte sind in den Dokumenten als offen gekennzeichnet und hier kein Befund:

- die Geltungsdauer eines mit `Parameter setzen` gesetzten Werts (req-fach-047, letzter Absatz)
- der Bezug von `VORHER` (req-fach-014)
- H4 aus Durchlauf 2 (`str-01`, „Offene fachliche Fragen“)

Die beiden Testfälle verwenden `Parameter setzen` nicht. Für die Gestaltung der Testfälle wird keiner dieser Punkte gebraucht.

---

## 1. Befunde aus Durchlauf 2

### Blockierende Befunde

| Befund | Ergebnis | Nachweis |
|---|---|---|
| A6 Paarungstabelle, abgeleitete Zeiteinheiten in `str-01` | erledigt | `str-01` Abschnitt 1: Der Auslöser `Kerzenschluss` erhält seine Zeiteinheit aus dem Strategieparameter Handelszeiteinheit. Fachmodell req-fach-046, letzter Absatz: Auch Parameter von Elementen, zum Beispiel die Zeiteinheit eines Auslösers, können mit einem Strategieparameter belegt werden. `str-01` Abschnitt 2 und die Parametertabelle: Die Paarungstabelle ist nur eine Empfehlung für die Werte, nicht Teil des Ablaufs. Die Abschnitte 1, 2 und 4 brauchen keine abgeleitete Zeiteinheit mehr. Zum Neustart mit einem anderen Paar: Hinweis H4. |
| B2 Ablage als Dateien gegenüber req-system-012 und req-system-015 | erledigt | Gesamtsystem req-system-012, zweiter Absatz: Objektspeicher und übrige Daten sind getrennt. req-system-015, letzter Absatz: Der Objektspeicher ist ein Verzeichnis oder eine Datenbank über SQLAlchemy. In der ersten Ausbaustufe gibt es nur das Verzeichnis. Die Änderung steht im Änderungsnachweis des Gesamtsystems. Strategiedesigner req-ui-009 verweist darauf. Zu den Begriffen: Hinweis H7. |
| N1 Objekte der Anwendung, Kerze | erledigt | Fachmodell req-fach-051: „genau einmal vorhanden“ und „keine Parameter“ sind entfallen. Die Kerze hat den Parameter `Zeiteinheit`. Mehrere Instanzen mit eigenem Namen sind möglich. Bei nur einer Verwendung heißt das Objekt im Ausdruck wie sein Objekttyp, und die Kerze hat die Zeiteinheit des Auslösers. Glossar „Objekte der Anwendung“ und Strategiedesigner req-ablauf-003 sind angeglichen. Restpunkte: Hinweise H1 und H2. |
| N2 Geltungsdauer von „Parameter setzen“, Handelszeiteinheit der Verwaltung | erledigt | `str-01` Abschnitt 4: Die Strategie wechselt nicht selbst die Handelszeiteinheit. Abschnitt 6 und die Parametertabelle: Die Verwaltung arbeitet auf der Handelszeiteinheit. Diese ändert sich im Ablauf nicht mehr. Fachmodell req-fach-047: Die Geltungsdauer ist als offen gekennzeichnet. Sie wird für die Testfälle nicht gebraucht. |
| N3 Rolle der Regel „Risiko je Trade“, Herkunft des Volumens | erledigt | Fachmodell req-fach-020: Eine Regel bestimmt eine Eigenschaft, solange diese änderbar ist, und prüft sie danach. Strategiedesigner req-core-002 beschreibt die Regelvorlage mit Parameter, Aufgabe und Rundung. `str-01` Abschnitte 4 und 6 und `str-03` Abschnitt 3 sagen übereinstimmend: Die Regel bestimmt das Volumen. Der Widerspruch in `str-03` ist beseitigt. Neue Fehler in der Beschreibung der Regelvorlage: N4 und N5. |

### Nicht blockierende Befunde

| Befund | Ergebnis | Nachweis |
|---|---|---|
| D1 „Komponente“ | erledigt | req-fach-010 und req-fach-011 sagen jetzt „Indikatoren“. Im Fachmodell steht „Komponente“ nur noch in req-fach-033. Dort bezeichnet das Wort Teile des Systems („spätere Positionsverwaltung“). |
| D5 „Parameter“ einer Order | erledigt | req-fach-016, Überschrift von req-fach-027 und Glossar „Order aufgeben“ sagen jetzt „Eigenschaften der Order“. In den geprüften Dokumenten kommt „Ordertyp und Parameter“ nicht mehr vor. |

### Hinweise H1 bis H17

| Hinweis | Ergebnis | Nachweis |
|---|---|---|
| H1 | eingearbeitet | req-fach-014: als offen gekennzeichnet, mit Bezug auf die Ausführung |
| H2 | eingearbeitet | req-fach-036: Kennungen auch für die Namen der Objekttypen der Anwendung und für festgelegte Werte |
| H3 | eingearbeitet | req-fach-051: Spread, Pip und Punkt als Kursdifferenz |
| H4 | eingearbeitet | `str-01` „Offene fachliche Fragen“ |
| H5 | eingearbeitet | req-ui-003, req-ablauf-007. „Ablaufelement“ steht in den geprüften Dokumenten nur noch im Glossar (als nicht verwendeter Begriff) und in einem älteren Eintrag des Änderungsnachweises. |
| H6 | eingearbeitet | req-ablauf-008 |
| H7 | eingearbeitet | req-fach-036 und req-ui-005. Zum neuen Beispiel in req-ui-005: Hinweis H3. |
| H8 | verworfen | kein Befund |
| H9 | eingearbeitet | req-ui-012 |
| H10 | eingearbeitet | req-param-005 |
| H11 | eingearbeitet | req-fach-049, zweiter Absatz |
| H12 | eingearbeitet | req-fach-052 |
| H13 | eingearbeitet | Strategiedesigner Abschnitt 9 Punkt 7 |
| H14 | eingearbeitet | `str-01` Voraussetzungen. Zur Tickgröße: Hinweis H6. |
| H15 | eingearbeitet | Glossar, Änderungsnachweis: absteigend nach Datum geordnet |
| H16 | eingearbeitet | Strategiedesigner Abschnitt 9 Punkt 10 |
| H17 | eingearbeitet | `requirements-1-response.md`, Zeile C6 |

---

## 2. Neue blockierende Befunde

### N4 – Einstieg der Regelvorlage „Risiko je Trade“ bei einer Marktorder

- Fundstelle: Strategiedesigner req-core-002, zweiter Absatz; Fachmodell req-fach-028 (MarketOrder), req-fach-020, req-fach-035, req-fach-039; `str-03` Abschnitte 3 und 4
- Sachverhalt: Die mitgelieferte Regelvorlage bestimmt das Volumen „aus Einstieg, Stop-Loss, Tickwert des Instruments und Risikogrenze“. Bei der Stop-Order in `str-01` ist der Einstieg der Preis der Order. `str-03` gibt aber eine Marktorder auf. Laut req-fach-028 hat eine Marktorder keinen Orderpreis: „Ein vorgegebener Orderpreis ist keine Eigenschaft der `MarketOrder`.“ Nach req-fach-039 darf eine Regel nur Eigenschaften von Objekten verwenden. Welcher Wert bei einer Marktorder als Einstieg gilt, beschreibt kein Dokument. Möglich wären zum Beispiel der Schlusskurs der Kerze, auf den sich der Stop-Loss in `str-03` bezieht, oder der aktuelle Geld- oder Briefkurs. Die Regelvorlage wird mitgeliefert. Ihr fachlicher Ausdruck muss also in der Spezifikation festgelegt werden. Laut `str-03` verwendet der Testfall eine Instanz dieser Vorlage. Verwendet der Ausdruck eine Eigenschaft, die die Marktorder nicht hat, meldet die Konsistenzprüfung einen Fehler (req-ablauf-007, „unbekannte Eigenschaft“). Eine Strategie mit Fehlern kann nicht ausgeführt werden.
  Dieselbe Lücke betrifft die Prüfung bei „Position ändern“ in `str-03` Abschnitt 4. req-core-002 sagt, die Regel prüft dort, „ob der Verlust bis zum Stop-Loss die Risikogrenze einhält“. Ob der Verlust ab dem Einstiegspreis der Position oder ab dem aktuellen Kurs gerechnet wird, ist nicht gesagt.
- Fragen an den Auftraggeber: Welcher Wert ist der Einstieg der Regel „Risiko je Trade“ bei einer Marktorder? Gilt ein und derselbe fachliche Ausdruck der Vorlage für Stop-Order und Marktorder? Ab welchem Kurs rechnet die Regel bei „Position ändern“ den Verlust bis zum Stop-Loss?

### N5 – Regeln der Strategie bei „Position schließen“

- Fundstelle: Fachmodell req-fach-046, Absatz „Regeln der Strategie gelten für jede Order, die die Strategie aufgibt“; req-fach-032 (CloseOrder, `Volumen` KANN, ohne Volumen ganz geschlossen); req-fach-049a (`Position schließen` veranlasst eine `CloseOrder`, keine Ausgänge); Strategiedesigner req-core-002, req-ui-012; `str-03` Abschnitt 4
- Sachverhalt: In `str-03` ist „Risiko je Trade“ eine Regel der Strategie. Bei einem Kreuzen in Gegenrichtung wird die Position laut Abschnitt 4 „ganz geschlossen“. „Position schließen“ veranlasst eine `CloseOrder`. Ob diese zu den Orders gehört, „die die Strategie aufgibt“, ist nicht beschrieben. req-ui-012 erlaubt seit diesem Durchlauf Regeln am Element „Position schließen“. Das spricht dafür, dass Regeln für die CloseOrder gelten. Gilt die Regel der Strategie auch für die CloseOrder, dann ergibt sich ein Widerspruch: Laut req-core-002 bestimmt die Regel „das Volumen einer Order“. Das Volumen der CloseOrder ist änderbar, die Regel würde es also bestimmen. Die Position würde dann nicht ganz geschlossen. Die CloseOrder hat außerdem weder Preis noch Stop-Loss. Die Regel könnte das Volumen also gar nicht bestimmen. Laut req-fach-021 wird die Order dann nicht freigegeben. Für „Position schließen“ ist kein Ausgang beschrieben. req-core-002 nennt die prüfende Rolle nur für „Order ändern“ und „Position ändern“, nicht für „Position schließen“.
- Fragen an den Auftraggeber: Gelten die Regeln der Strategie auch für die CloseOrder von „Position schließen“? Wenn ja: Was tut die Regel „Risiko je Trade“ bei einer CloseOrder? Wie wird in `str-03` erreicht, dass die Position ganz geschlossen wird?

### N6 – Prüfung der freien Margin in `str-01` ohne Angabe des Marginbedarfs

- Fundstelle: `str-01` Abschnitt 4, zweiter Absatz (in diesem Durchlauf umformuliert), Voraussetzungen; Fachmodell req-fach-049 („weil … die freie Margin nicht reicht“), req-fach-051 (Konto, Instrument), req-fach-017, req-fach-039
- Sachverhalt: `str-01` Abschnitt 4 prüft, „ob ausreichend freie Margin vorhanden ist“. Laut req-fach-049 macht das eine prüfende Regel der Strategie oder des Elements. Für die Prüfung braucht man die freie Margin des Kontos und die Margin, die die geplante Order benötigt. `Konto.freie Margin` ist beschrieben. Den Marginbedarf einer Order liefert kein Objekt: weder `Instrument` noch `Order` noch ein anderes Objekt der Anwendung. Auch Angaben, aus denen er sich berechnen ließe, gibt es nicht. req-fach-017 nennt „Broker- beziehungsweise Marginbedingungen“ nur als Informationsquelle. Nach req-fach-039 darf eine Regel keine Daten verwenden, die nicht als Eigenschaft eines Objekts abgebildet sind. Die Prüfung lässt sich also nicht als Regel gestalten, so wie `str-01` sie beschreibt. Die Prüfung des Mindestvolumens dagegen lässt sich mit `Instrument.Mindestvolumen` gestalten.
- Fragen an den Auftraggeber: Gestaltet der Anwender die Margin-Prüfung in `str-01` als Regel? Wenn ja: Woher kommt der Marginbedarf der Order? Oder prüft das Handelssystem beziehungsweise der Strategietester die Margin selbst, ohne Regel der Strategie?

---

## 3. Hinweise (nicht blockierend)

### H1 – Zeiteinheit einer einzeln verwendeten Kerze

- Fundstelle: Fachmodell req-fach-051, erster Absatz; Strategiedesigner req-ablauf-003, zweiter Absatz
- Sachverhalt: Bei nur einer Verwendung „hat die Kerze die Zeiteinheit des Auslösers, der die Auswertung gestartet hat“. Laut req-ablauf-003 kann der Anwender aber eine Kerze auf die Zeichenfläche legen und ihre Zeiteinheit setzen. Bei einer einzigen gelegten Kerze mit gesetzter Zeiteinheit ist unklar, welche Zeiteinheit gilt: die gesetzte oder die des Auslösers. Auch wann eine Kerze als „nur einmal verwendet“ gilt, ist nicht gesagt: Zählt die Verwendung von `Kerze.Schluss` in einem Ausdruck ohne gelegte Kerze mit? Außerdem hat der Auslöser `Tick` keine Zeiteinheit (req-fach-053). Wenn er die Auswertung startet, ist die Zeiteinheit der Kerze nicht bestimmt. Die Testfälle sind nicht betroffen: `str-03` verwendet die Kerze nur bei `Kerzenschluss`, `str-01` verwendet keine Kerze.
- Frage: Welche Zeiteinheit hat eine einzeln verwendete Kerze, wenn ihre Zeiteinheit gesetzt ist oder wenn ein Tick die Auswertung startet?

### H2 – Order, Position und Strategie als Objekte der Anwendung

- Fundstelle: Fachmodell req-fach-051 („in Ausdrücken immer verfügbar“, Tabelle Zeile `Order`, `Position`); Glossar „Objekte der Anwendung“; Strategiedesigner req-fach-001, req-ablauf-003
- Sachverhalt: Objekte der Anwendung sind laut req-fach-051 und Glossar „in Ausdrücken immer verfügbar“. `Order` und `Position` gibt es laut Tabelle aber nur „in der Verwaltung einer Order“. Ob die Konsistenzprüfung `Order.Status` im Hauptablauf als Fehler meldet, ist dadurch offen. req-fach-001 und req-ablauf-003 nennen als Objekte der Anwendung weiter nur Konto, Instrument, Kerze und Tick. req-fach-051 und das Glossar nennen zusätzlich Order, Position und Strategie. Dieser Teil von N1 aus Durchlauf 2 ist unverändert.
- Frage: Sind Order und Position außerhalb einer Verwaltung in Ausdrücken verfügbar? Gehören Order, Position und Strategie zu den Objekten der Anwendung, die req-ablauf-003 in der Elementbibliothek anbietet?

### H3 – Was ist der Objekttyp eines mitgelieferten Indikators?

- Fundstelle: Strategiedesigner req-ui-005 („ema21, aus Vorlage EMA, Objekttyp Indikator“); Fachmodell req-fach-013a („Mitgelieferte Objekttypen (req-fach-054) verhalten sich wie Vorlagen“); Glossar „Objekttyp“ (Beispiele „gleitender Durchschnitt (EMA)“, „Markttechnik-Trend“)
- Sachverhalt: Das neue Beispiel in req-ui-005 nennt EMA eine Vorlage und „Indikator“ den Objekttyp. Nach req-fach-013a und dem Glossar ist EMA selbst ein Objekttyp. Das Glossar nennt außerdem weiter „Markttechnik-Trend“ als Beispiel eines Objekttyps. Markttechnik ist aber ein Indikator (Indikator Markttechnik, Abschnitt 1). Die Herkunftsangabe einer Instanz hängt davon ab, was als Objekttyp gilt.
- Frage: Ist bei einer EMA-Instanz „EMA“ oder „Indikator“ der Objekttyp?

### H4 – „Nächstkleineres Zeiteinheitenpaar“ in `str-01`

- Fundstelle: `str-01` Abschnitt 4, letzter Absatz, Paarungstabelle in Abschnitt 2
- Sachverhalt: Das Beispiel nennt „M15/M5 statt H1/M15“ als nächstkleineres Paar. Dabei ändert sich auch die Signalzeiteinheit. Nach der Paarungstabelle ist zu H1 auch M5 möglich. H1/M5 wäre also ebenfalls ein kleineres Paar. Der Satz beschreibt außerdem etwas, das bei der Anwendung der Strategie festgelegt werden kann, also im Handelssystem. Ob `anforderungen-handelssystem.md` das vorsieht, wurde nicht geprüft, weil das Dokument nicht Gegenstand ist. Für den Testfall hat der Satz keine Bedeutung.
- Frage: Was ist das „nächstkleinere Zeiteinheitenpaar“?

### H5 – „Die Handelszeiteinheit ist kleiner als die Signalzeiteinheit“

- Fundstelle: `str-01` Abschnitt 2, erster Satz; Parametertabelle Zeile Handelszeiteinheit
- Sachverhalt: Nicht gesagt ist, ob das eine Bedingung im Ablauf ist, ein Befund der Konsistenzprüfung oder nur eine Vorgabe an den Anwender bei der Wahl der Werte. Die Werte können erst bei der Anwendung übergeben werden (req-fach-046).
- Frage: Wird geprüft, dass die Handelszeiteinheit kleiner ist? Wenn ja, wo?

### H6 – Tickgröße für die Volumenberechnung

- Fundstelle: Strategiedesigner req-core-002; `str-01` Abschnitt 4 und Voraussetzungen; Fachmodell req-fach-051 (Spread, Pip, Punkt als Kursdifferenz)
- Sachverhalt: Die Regel rechnet laut req-core-002 mit „Einstieg, Stop-Loss, Tickwert … und Risikogrenze“. Der Abstand zwischen Einstieg und Stop-Loss ist eine Kursdifferenz. Um ihn mit dem Tickwert zu verrechnen, braucht man die Tickgröße. `str-03` nennt die Tickgröße in den Voraussetzungen, `str-01` und req-core-002 nicht. Die Risikogrenze ist ein Anteil des Kapitals. Damit braucht die Regel auch `Konto.Kapital`. req-core-002 nennt das nur über den Standardwert „1 % des Kapitals“.
- Kritikpunkt: Die Eingangswerte der Regelvorlage sind nicht vollständig aufgezählt.

### H7 – Begriffe zum Objektspeicher

- Fundstelle: Gesamtsystem req-system-012, req-system-015; Strategiedesigner req-ui-009; Glossar
- Sachverhalt: req-system-015 sagt „erste Ausbaustufe“, req-ui-009 sagt „Vorhaben `strategiedesign`“. Ob beides dasselbe meint, ist nicht gesagt. „Objektspeicher“, „Objektverzeichnis“ und „Ausbaustufe“ stehen nicht im Glossar (req-system-021). In req-ui-009 hat „Verzeichnis“ zwei Bedeutungen: das Objektverzeichnis mit den Dateien und das „Verzeichnis der Objekte im Speicher der Komponente“, das sich aus den Dateien neu erzeugen lässt.
- Frage: Ist die „erste Ausbaustufe“ das Vorhaben `strategiedesign`? Was ist das „Verzeichnis der Objekte im Speicher der Komponente“?

### H8 – Bestätigungsvermerke der Testfälle

- Fundstelle: `str-01` und `str-03`, Abschnitt „Bestätigungsvermerk“
- Sachverhalt: Die Abschnitte zur Risikoregel wurden in beiden Testfällen nach Entscheidung N3 geändert. Der Vermerk in `str-01` nennt nur die „Klarstellung zur Handelszeiteinheit“. Der Vermerk in `str-03` ist unverändert. Laut `requirements-2-response.md` hat der Auftraggeber N3 entschieden. Die Vermerke zeigen das nicht.

### H9 – Bindungsart im Glossar gegenüber req-fach-046

- Fundstelle: Glossar „Bindungsart“; Fachmodell req-fach-046, letzter Absatz
- Sachverhalt: req-fach-046 nennt als Belegung auch den Strategieparameter. In `str-01` belegt er die Zeiteinheit des Auslösers. Die Bindungsarten im Glossar nennen den Strategieparameter nicht.

---

## 4. Abbildbarkeit der Testfälle an den geänderten Stellen

| Testfall | Ergebnis | Hinderungsgründe |
|---|---|---|
| `str-01` | nicht vollständig abbildbar | N6 (Margin-Prüfung) |
| `str-03` | nicht eindeutig abbildbar | N4 (Einstieg der Risikoregel bei der Marktorder, Bezug der Prüfung bei „Position ändern“), N5 (Risikoregel beim Schließen der Position) |

An den geänderten Stellen lassen sich alle anderen Teile beider Testfälle mit den beschriebenen Objekten und Arbeitsabläufen gestalten:

- Auslöser mit der Zeiteinheit aus einem Strategieparameter
- zwei Instanzen des Indikators Markttechnik auf Signalzeiteinheit und Handelszeiteinheit
- Entry-Puffer und Stop-Puffer als Strategieparameter
- Verwaltung auf der Handelszeiteinheit
- Risikoregel bei der Stop-Order in `str-01`, bestimmend und bei „Order ändern“ prüfend
- Prüfung des Mindestvolumens
- `Kerze.Schluss` in `str-03` bei nur einer Kerze
- Instanzen von Objekten der Anwendung

Speichern und Laden sind durch req-system-015, req-ui-009, req-ablauf-003 und req-ablauf-008 beschrieben: Objektverzeichnis mit einer Datei je Objekt, Instanzen werden mit der Strategie gespeichert, Öffnen auch bei unbekanntem Typ.

## 5. Zusammenfassung

| Art | Anzahl | blockierend |
|---|---|---|
| blockierende Befunde aus Durchlauf 2, erledigt | 5 (A6, B2, N1, N2, N3) | – |
| nicht blockierende Befunde aus Durchlauf 2, erledigt | 2 (D1, D5) | – |
| Hinweise aus Durchlauf 2 | 16 eingearbeitet, 1 verworfen (H8) | – |
| neue Befunde | 3 (N4, N5, N6) | alle |
| Hinweise | 9 (H1 bis H9) | keine |

Die Nachprüfung ist nicht bestanden. Laut `docs/technical/entwicklungsverfahren.md`, Phase 2, geht der Bericht über den Softwarearchitekten an den Projektleiter zurück in Phase 1. Dies war der dritte Durchlauf. Über N4, N5 und N6 entscheidet der Auftraggeber. Die Hinweise kann der Projektleiter selbst bearbeiten oder verwerfen.
