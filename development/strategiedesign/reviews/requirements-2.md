# Prüfbericht Dokumente des Auftraggebers, Durchlauf 2 (Nachprüfung)

- Vorhaben: `strategiedesign`
- Phase: 2 Konzeption, Nachprüfung der Dokumente des Auftraggebers
- Rolle: QA
- geprüfter Commit: `77dc527d7f411f7ae0470de98d75b600f964a283` (`main`, entspricht `origin/main` zum Zeitpunkt der Prüfung)
- Vergleichsstand: `e9d5b044735bfaf90369ef4b3d9ceaf76b61ed22` (Durchlauf 1)
- Prüfauftrag: `development/strategiedesign/reviews/requirements-2-order.md`

## Ergebnis

**nicht bestanden**

Von den 43 Befunden aus Durchlauf 1 sind 39 erledigt und 4 nicht erledigt. Zwei der nicht erledigten Befunde sind blockierend (A6, B2). Dazu kommen drei neue blockierende Befunde an geänderten Stellen (N1 bis N3). Blockierend heißt nach „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Der Befund widerspricht einer Anforderung, oder er verhindert, dass ein Testfall so gestaltet werden kann, wie er beschrieben ist.

Kurz gefasst:

- `str-01` lässt sich mit den beschriebenen Strategieparametern nicht vollständig gestalten. Offen ist, wie die Paarungstabelle der Zeiteinheiten im Ablauf abgebildet wird (A6). Offen ist auch, wie lange ein mit „Parameter setzen“ geänderter Wert gilt und welche Handelszeiteinheit die Verwaltung einer Order verwendet (N2).
- Die neuen Festlegungen zu den Objekten der Anwendung widersprechen sich, besonders beim Objekt `Kerze` (N1).
- Die Rolle der Regel „Risiko je Trade“ ist in beiden Testfällen unterschiedlich beschrieben (N3).
- Die Ablage als Dateien widerspricht weiterhin req-system-012 und req-system-015 des Gesamtsystems (B2).

Die übrigen nicht erledigten Befunde (D1, D5) betreffen Begriffe und sind nicht blockierend.

## Geprüfte Unterlagen

- `docs/design/requirements/anforderungen-gesamtsystem.md`
- `docs/design/requirements/anforderungen-strategiedesigner.md`
- `docs/design/domain/fachmodell.md`
- `docs/design/domain/indikator-markttechnik.md`
- `docs/design/strategies/str-01-fachlich-scalping-punkt-2-ausbruch-einfach.md`
- `docs/design/strategies/str-03-fachlich-ema-trendfolge.md`
- `docs/technical/glossar.md` (laut seinem Dokumentstatus verbindlich, Änderungen im Diff enthalten)
- Maßstab: `development/strategiedesign/reviews/requirements-1.md`, `requirements-1-response.md` und die Präsentation `development/strategiedesign/presentations/requirements-1.html`. Wo dort „wie Vorschlag“ steht, wurde der Vorschlag auf der Folie der Präsentation als Entscheidung genommen.

Wie im Auftrag festgelegt, wurden diese Unterlagen nicht geprüft: `anforderungen-handelssystem.md`, die Stellen des Fachmodells zur Ausführung und die Vorlagen unter `docs/design/planning/`. Die Punkte, die `scope.md` als offen aufführt, sind in den Dokumenten als offen gekennzeichnet (req-fach-036, req-fach-049, req-fach-051, req-fach-053, req-fach-054, Indikator Markttechnik Abschnitt 6, Anforderungen Strategiedesigner Abschnitt 9 Punkte 9 und 10, req-ui-012). Sie sind hier kein Befund.

---

## 1. Befunde aus Durchlauf 1

| Befund | Ergebnis | Nachweis |
|---|---|---|
| A1 Konto, Instrument, Kurs | erledigt | Fachmodell req-fach-051 beschreibt Konto, Instrument, Kerze und Tick mit ihren Eigenschaften. „Kapital“ ist einheitlich bestimmt. req-fach-017 verweist darauf. Neue Widersprüche an dieser Stelle: siehe N1. |
| A2 EMA und ATR | erledigt | req-fach-054 legt EMA, ATR und Markttechnik als mitgeliefert fest und beschreibt ihre Parameter und Eigenschaften. |
| A3 frühere Werte | erledigt | req-fach-014 und req-fach-036 führen die Funktion `VORHER` ein (gespeichert `PREVIOUS`). `str-01` Abschnitt 6 vergleicht mit `Order.Stop-Loss`. Zur Bedeutung von „Auswertung“: Hinweis H1. |
| A4 Position, Status, eigene Order | erledigt | req-fach-052 (Position), req-fach-019 (Werte von `Status`), req-fach-049a und req-fach-051 (`Order` und `Position` in der Verwaltung), req-fach-016 (die Ausführung erzeugt eine Position) |
| A5 Auslösertypen | erledigt | req-fach-053 legt Auslösertypen und ihre Parameter fest. `str-01` Abschnitt 6 nennt die Auslöser der Verwaltung. |
| A6 Zeiteinheiten in `str-01`, Paarungstabelle | **nicht erledigt, blockierend** | siehe Abschnitt 2, A6 |
| A7 Zeiteinheit eines Indikators | erledigt | req-fach-054: Jeder Indikator hat den Parameter `Zeiteinheit`, das Instrument kommt aus der Anwendung. Indikator Markttechnik Abschnitt 2 ist ergänzt. |
| A8 Handelsrichtung | erledigt | `str-01` Abschnitt 2 und Indikator Markttechnik Abschnitt 5: Die Handelsrichtung ist die Trendrichtung der Signalzeiteinheit. Auch das Verhalten bei fehlendem oder gegenläufigem Trend ist geregelt. Aus `aufwärts` wird `buy` über die Fallunterscheidung `IF` (req-fach-036). Zur Schreibweise solcher Werte: Hinweis H2. |
| A9 Ausweichen auf die kleinere Handelszeiteinheit | erledigt | req-fach-049 erlaubt `Order aufgeben` unmittelbar an einem Ausgang. req-fach-047 beschreibt `Parameter setzen` und die Rückführung. `str-01` Abschnitte 2 und 4: zuerst die größere Handelszeiteinheit. Für die Bedingung, die die Rückführung beendet, wird die Paarung gebraucht: siehe A6. |
| A10 Reihenfolge von Werten und Regeln | erledigt | req-fach-046: zuerst die direkt übergebenen Werte, dann die Regeln der Strategie, dann die Regeln der Elemente. `str-01` Abschnitt 3: direkte Werte. Neuer Widerspruch beim Volumen: siehe N3. |
| A11 Order ändern | erledigt | req-fach-049a: prüfende Regeln, Ausgänge `geändert` und `nicht geändert`. `str-01` Abschnitt 6 ist angepasst. |
| A12 Berechnungen, Einheiten | erledigt | `str-01` Abschnitt 3 enthält eine Tabelle für Long und Short. req-fach-051 nennt Pip, Punkt und Tickgröße. `str-03` nennt die Tickgröße. Zur Einheit des Spreads: Hinweis H3. |
| A13 Fallunterscheidung | erledigt | req-fach-036: `IF` gehört zur ersten Auswahl. |
| A14 Namen in Ausdrücken | erledigt | req-fach-036: Punkt-Schreibweise, Instanznamen ohne Leerzeichen, sprachneutrale Kennung jeder Eigenschaft, gespeichert wird die Kennung. req-ui-013 beschreibt die Eingabehilfe. Zu Werten und Objektnamen: Hinweise H2 und H7. |
| A15 Strategie in Ausdrücken | erledigt | req-fach-051, Zeile `Strategie`, und req-fach-046 |
| B1 Sprachauswahl und Kopfzeile | erledigt | req-ui-010: Schaltfläche „rechts in der Kopfzeile“ |
| B2 Dateiablage und Speicher | **erster Teil nicht erledigt, blockierend**. Zweiter Teil erledigt (req-ablauf-009). | siehe Abschnitt 2, B2 |
| B3 Gültigkeit einer Order | erledigt | req-fach-027 verweist auf die Verwaltung. |
| B5 Marktphase, Bewegung, Korrektur | erledigt | req-fach-001 |
| B4 Bearbeiten gespeicherter Objekte | erledigt | req-param-005, req-fach-013a (Vorlage und Instanz). Zum Umfang der Änderbarkeit: Hinweis H10. |
| B6 Objekte liefern Ergebnisse | erledigt | req-fach-006, req-ui-007, Abschnitt 9 Punkt 7. Neuer Sprachfehler in Punkt 7: Hinweis H13. |
| B7 ExitOrder | erledigt | req-core-001 |
| B8 Risikogrenze | erledigt | req-core-002. In beiden Testfällen ist die Regel eine Instanz der Regelvorlage „Risiko je Trade“. Zur Rolle dieser Regel: siehe N3. |
| C1 Öffnen | erledigt | req-ablauf-008. Zum Begriff „Verweis“: Hinweis H6. |
| C2 Regeln zuordnen, Eigenschaftenansicht der Strategie | erledigt | req-ui-012 (als vorläufig gekennzeichnet) und req-ui-005 (Klick auf die leere Zeichenfläche) |
| C3 Verbindung oder Ausdruck | erledigt | Glossar „Verbindung“, req-ablauf-003, req-ablauf-007, req-fach-051 |
| C4 Auslöser der Verwaltung | erledigt | req-fach-015, req-fach-049a. Zum Ausgang `gestellt`: Hinweis H11. |
| C5 neues Objekt aus einem Objekttyp | erledigt | req-ablauf-003 |
| C6 Löschen bei Verwendung in Objekten | erledigt | req-ablauf-006 in der Fassung nach Entscheidung 12. Zur Bearbeitungsübersicht: Hinweis H17. |
| C7 Konsistenzprüfung | erledigt | req-ablauf-007 |
| C8 Schutz der Web-API | erledigt | req-system-011 und Anforderungen Strategiedesigner Abschnitt 9 Punkt 10 |
| C9 Dateiname der Startkonfiguration | erledigt | req-system-017 |
| C10 Standanzeige in der Fußzeile | erledigt | req-ui-010 |
| D1 „Komponente“ | **nicht erledigt, nicht blockierend** | Fachmodell req-fach-010 („zu den darin verwendeten Komponenten“) und req-fach-011 („Berechnungsverfahrens und seiner Komponenten“) verwenden „Komponente“ weiter für einen Bestandteil eines Berechnungsverfahrens. Laut `requirements-1-response.md`, Zeile D1, bezeichnet „Komponente“ aber nur noch Teile des Systems. Die Fundstelle req-fach-010 stand bereits in Durchlauf 1. |
| D2 „Prototyp“ | erledigt | req-ui-007, req-fach-046 |
| D3 „Strategiedefinition“ | erledigt | Gesamtsystem req-system-001, -004, -010, -022 |
| D4 technische Ebene, Benennung | erledigt | req-ui-003, req-ui-004, req-ui-005. Zum Wort „Ablaufelement“: Hinweis H5. |
| D5 „Parameter“ einer Order | **nicht erledigt, nicht blockierend** | „Bestimmungsverfahren“ ist ersetzt. „Parameter“ eines Ordertyps steht aber weiter in der Überschrift von req-fach-027 („Ordertyp und Parameter in der Strategie“), in Fachmodell req-fach-016 („legt Ordertyp und Parameter fest“) und im Glossar unter „Order aufgeben“. req-fach-049 sagt dagegen „Ordertyp und Eigenschaften“. |
| E1 Änderungsnachweise | erledigt | Anforderungen Strategiedesigner Abschnitt 10, Fachmodell Abschnitt 3, Dokumentstatus mit Vermerk der Abstimmung |
| E2 Sprachfehler | erledigt | req-param-004, req-ui-007, req-fach-006 |
| E3 Backslashes | erledigt | req-system-017 |
| E4 Schreibweise im Glossar | erledigt | Glossar „Gemeinsame Python-Bibliothek“ |
| E5 Originalbeschreibung | erledigt | `str-01` Abschnitt „Herkunft“ |

---

## 2. Blockierende Befunde

### A6 – Paarungstabelle und abgeleitete Zeiteinheiten in `str-01` (aus Durchlauf 1, nicht erledigt)

- Fundstelle: `str-01` Abschnitte 1, 2, 4 und „Parameter“ (Zeile Handelszeiteinheit: „gemäß festgelegter Paarung“); Fachmodell req-fach-046 (Strategieparameter), req-fach-047 (`Parameter setzen`, Rückführung), req-fach-053 (Auslöser `Kerzenschluss` mit Parameter `Zeiteinheit`)
- Sachverhalt: Durchlauf 1 fragte, wie die größere Zeiteinheit einmal festgelegt wird, sodass die davon abhängigen Zeiteinheiten folgen, und wie die Paarungstabelle abgebildet wird. Entschieden ist: Signalzeiteinheit und Handelszeiteinheit sind Strategieparameter, und `Parameter setzen` stellt die Handelszeiteinheit um. Der Ablauf von `str-01` braucht an drei Stellen eine Zeiteinheit, die sich aus der Signalzeiteinheit nach der Paarungstabelle ergibt:
  1. Der Auslöser des Hauptablaufs ist der „Kerzenschluss der kleinsten zulässigen Handelszeiteinheit“ (Abschnitt 1).
  2. `Parameter setzen` stellt auf die „kleinere zulässige Handelszeiteinheit“ um (Abschnitt 4).
  3. Die Rückführung muss nach req-fach-047 durch eine Bedingung enden. In `str-01` lautet sie: „ist bereits die kleinste zulässige Handelszeiteinheit“ (Abschnitt 4).

  Die Dokumente beschreiben nicht, wie diese Werte zustande kommen. Ob ein Ausdruck mit Zeiteinheiten rechnen oder sie vergleichen kann, ist nicht beschrieben. Ein Datentyp „Zeiteinheit“ in Ausdrücken ist nicht beschrieben. Ob der Parameter `Zeiteinheit` eines Auslösers mit einem Strategieparameter oder einem Ausdruck belegt werden kann, ist nicht beschrieben: req-fach-046, letzter Absatz, nennt diese Belegungsarten nur für „Eigenschaften verwendeter Objekte“, und ein Auslöser ist ein Element, kein Objekt. Die Parametertabelle von `str-01` nennt nur die zwei Strategieparameter, keine dritte Zeiteinheit.
- Fragen: Wie wird in `str-01` aus der Signalzeiteinheit die größere und die kleinere zulässige Handelszeiteinheit bestimmt? Wird die Paarungstabelle im Ablauf abgebildet, oder werden beide Handelszeiteinheiten bei der Anwendung übergeben? Woher erhält der Auslöser des Hauptablaufs seine Zeiteinheit? Kann ein Ausdruck Zeiteinheiten vergleichen?

### B2 – Ablage als Dateien gegenüber req-system-012 und req-system-015 (aus Durchlauf 1, erster Teil nicht erledigt)

- Fundstelle: Anforderungen Strategiedesigner req-ui-009; Gesamtsystem req-system-012, req-system-015
- Sachverhalt: req-ui-009 legt jetzt fest: „Die Dateien sind die verbindliche Fassung der Objekte, ein Verzeichnis der Objekte im Speicher der Komponente lässt sich aus ihnen neu erzeugen (req-system-015).“ Strategien und Vorlagen werden damit dauerhaft als Dateien gespeichert, nicht über SQLAlchemy. req-system-015 sagt: „Für persistente Datenspeicherung wird SQLAlchemy als gemeinsame Speicherschnittstelle verwendet.“ req-system-012 sagt: „Pipwerk schreibt kein bestimmtes Speicher-Backend für das Gesamtsystem oder eine Komponente fest.“ Das Dateiverzeichnis ist eine solche Festlegung. Der Verweis in req-ui-009 auf req-system-015 erklärt nicht, warum die Dateiablage mit req-system-015 vereinbar ist. Das Gesamtsystem ist unverändert geblieben. Die Bearbeitung (`requirements-1-response.md`, Zeile B2) stützt die Korrektur auf eine Entscheidung vom 2026-10-12. Laut Änderungsnachweis von `anforderungen-strategiedesigner.md` betrifft diese Entscheidung nur das Objektverzeichnis als Einstellung. Über das Verhältnis zu req-system-015 sagt sie nichts.
- Frage an den Auftraggeber: Ist die Ablage von Strategien und Vorlagen als Dateien eine gewollte Ausnahme von req-system-012 und req-system-015? Wenn ja: Wo im Anforderungsdokument des Gesamtsystems wird diese Ausnahme festgehalten?

### N1 – Objekte der Anwendung: „genau einmal vorhanden“, „keine Parameter“ und die Zeiteinheit der Kerze (neu)

- Fundstelle: Fachmodell req-fach-051 (erster Absatz und Tabelle), req-fach-053 (Spalte „liefert“); Anforderungen Strategiedesigner req-ablauf-003 zweiter Absatz, req-fach-001; Glossar „Objekte der Anwendung“; `str-03` Abschnitte 3 und 4
- Sachverhalt: req-fach-051 sagt: Objekte der Anwendung sind „je Anwendung einer Strategie genau einmal vorhanden“ und „haben keine Parameter“. Dazu gibt es drei Widersprüche:
  1. `Kerze` besteht laut Tabelle „je Zeiteinheit, die die Strategie verwendet“. Bei mehreren Zeiteinheiten ist sie mehrfach vorhanden.
  2. req-ablauf-003 sagt, die Kerze kann auf die Zeichenfläche gelegt werden, „um … bei der Kerze die Zeiteinheit zu setzen“. Eine Zeiteinheit zu setzen heißt, einen Parameter zu setzen.
  3. `Order` und `Position` gehören laut Tabelle und Glossar zu den Objekten der Anwendung. Nach req-fach-049a hat aber jede gestellte Order eine eigene Verwaltung. Eine Anwendung kann also mehrere Orders und Positionen haben.

  Wie ein Ausdruck die Kerze einer bestimmten Zeiteinheit anspricht, ist nicht beschrieben. `Kerze.Schluss` ist nur eindeutig, wenn die Strategie eine einzige Zeiteinheit verwendet oder wenn `Kerze` immer die Kerze des eingetretenen Auslösers meint. req-fach-053 deutet das zweite an („liefert die abgeschlossene Kerze dieser Zeiteinheit“), legt es aber nicht fest. `str-03` braucht den Schlusskurs der Kerze in Abschnitt 3 und in der Verwaltung (Abschnitt 4). Außerdem zählen req-fach-001 und req-ablauf-003 nur Konto, Instrument, Kerze und Tick als Objekte der Anwendung auf, req-fach-051 und das Glossar zusätzlich Order, Position und Strategie.
- Fragen: Hat die Kerze eine Zeiteinheit, die der Anwender setzt? Wenn ja, ist sie ein Parameter, im Widerspruch zu „keine Parameter“? Wie spricht ein Ausdruck die Kerze einer bestimmten Zeiteinheit an? Gilt „genau einmal vorhanden“ für Kerze, Order und Position, und in welchem Sinn?

### N2 – Geltungsdauer von „Parameter setzen“ und Handelszeiteinheit der Verwaltung in `str-01` (neu)

- Fundstelle: Fachmodell req-fach-046 (Strategieparameter), req-fach-047 (`Parameter setzen`), req-fach-049a (Verwaltung); `str-01` Abschnitte 2, 4 und 6
- Sachverhalt: `Parameter setzen` ändert einen Strategieparameter. Die Rückführung dient laut req-fach-047 dazu, eine Prüfung „innerhalb derselben Auswertung“ erneut zu durchlaufen. Ob der geänderte Wert nach dem Ende der Auswertung bestehen bleibt oder zum festgelegten beziehungsweise übergebenen Wert zurückkehrt, ist nicht beschrieben. Davon hängt `str-01` an zwei Stellen ab:
  1. Abschnitt 2: „Zuerst gilt die größere der beiden zulässigen“. Das gilt nur, wenn der Wert bei der nächsten Auswertung zurückgesetzt ist. Andernfalls bliebe die Strategie nach dem ersten Ausweichen dauerhaft auf der kleineren Handelszeiteinheit.
  2. Abschnitt 6: Die Verwaltung wird beim „Kerzenschluss der Handelszeiteinheit“ ausgelöst und vergleicht den Punkt 1/3 der Markttechnik-Instanz auf der Handelszeiteinheit. Ein Strategieparameter gilt für die ganze Strategie, nicht für eine einzelne Verwaltung. Wurde die Order auf der kleineren Handelszeiteinheit gestellt und gilt danach wieder die größere, dann rechnen Auslöser und Indikator der Verwaltung auf einer anderen Zeiteinheit als der, auf der die Order geplant wurde.
- Fragen: Gilt ein mit `Parameter setzen` geänderter Strategieparameter nur bis zum Ende der Auswertung oder dauerhaft? Mit welcher Handelszeiteinheit arbeitet die Verwaltung einer Order in `str-01`, wenn der Strategieparameter sich nach dem Stellen der Order ändert?

### N3 – Rolle der Regel „Risiko je Trade“ und Herkunft des Volumens (neu)

- Fundstelle: `str-01` Abschnitte 3, 4 und 6; `str-03` Abschnitt 3; Fachmodell req-fach-020, req-fach-035, req-fach-046; Anforderungen Strategiedesigner req-core-002
- Sachverhalt: Die Regelvorlage „Risiko je Trade“ wird an mehreren Stellen in verschiedenen Rollen beschrieben:
  - `str-01` Abschnitt 4: Aus Einstieg, Stop-Loss, Tickwert und Risikogrenze „wird das Handelsvolumen berechnet“. Die Risikoregel gilt als Regel der Strategie. Abschnitt 3 nennt nur Einstieg, Stop-Loss und Take-Profit als Berechnungen im Ablauf. Das Volumen bestimmt also die Regel.
  - `str-01` Abschnitt 6: Dieselbe Regel steht unter den „prüfenden Regeln der Strategie (Risiko, Volumen, Margin)“.
  - `str-03` Abschnitt 3: „Das Volumen bestimmt die Risikoregel der Strategie“. Zwei Sätze später: „Stop-Loss und Volumen werden als Berechnungen im Ablauf ermittelt“, und das Volumen wird auf die Volumenschrittweite abgerundet.

  Nach req-fach-046 übernimmt die Order zuerst die direkt übergebenen Werte, danach wendet sie die Regeln der Strategie an. Bestimmt die Regel das Volumen, überschreibt sie das Volumen aus der Berechnung. Ist die Regel nur prüfend, bestimmt sie das Volumen nicht. `str-03` beschreibt also zwei unvereinbare Wege. Ob eine Regel mit einem einzigen fachlichen Ausdruck (req-fach-035) zugleich bestimmen und prüfen kann, wie `str-01` Abschnitte 4 und 6 voraussetzen, ist nicht beschrieben. Inhalt, Parameter und Aufgabe der Regelvorlage „Risiko je Trade“ (bestimmen, prüfen oder beides, und welche Eigenschaft) stehen in keinem Dokument. Die Vorlage wird nur mit dem Standardwert 1 % genannt (req-core-002).
- Fragen: Bestimmt die Regel „Risiko je Trade“ das Volumen, prüft sie es, oder tut sie beides? Wird das Volumen in `str-03` durch eine Berechnung im Ablauf oder durch die Regel festgelegt, und wer rundet es auf die Volumenschrittweite ab? Wie ist die Regelvorlage „Risiko je Trade“ fachlich beschrieben?

---

## 3. Hinweise (nicht blockierend)

### H1 – Bedeutung von „Auswertung“ bei `VORHER`

- Fundstelle: Fachmodell req-fach-014, req-fach-049a, letzter Absatz; Glossar „Auswertung“; `str-03` Abschnitte 2, 4 und 5
- Sachverhalt: `VORHER` liefert den Wert „bei der vorherigen Auswertung“. Laut Glossar ist eine Auswertung „ein Durchlauf des Ablaufs einer Anwendung, ausgelöst durch einen Auslöser“. Beim selben Kerzenschluss werden in `str-03` zuerst die Verwaltung und dann der Hauptablauf ausgewertet, jeweils mit eigenem Auslöser-Element. Hat eine Strategie Auslöser verschiedener Art (Tick und Kerzenschluss), ist offen, ob `VORHER` sich auf die vorherige Auswertung dieses Auslösers bezieht oder auf irgendeine. Durchlauf 1 fragte nach dem Wert „beim vorherigen Kerzenschluss“.
- Frage: Sind Verwaltung und Hauptablauf beim selben Auslöser eine Auswertung oder zwei? Bezieht sich `VORHER` auf die vorherige Auswertung desselben Auslösers? Die Frage betrifft die Ausführung. Sie sollte geklärt sein, bevor der Strategietester beschrieben wird.

### H2 – Schreibweise von Werten in Ausdrücken

- Fundstelle: Fachmodell req-fach-036 (Kennungen), req-fach-019 (Werte von `Status`), req-fach-028 (`buy`, `sell`); Indikator Markttechnik Abschnitt 4; Anforderungen Strategiedesigner req-ui-007; `str-03` Abschnitt 4 (`Order.Status` gleich `ausgeführt`)
- Sachverhalt: Für Eigenschaften gibt es sprachneutrale Kennungen. Für Werte wie `aufwärts`, `kein Trend`, `Bewegung`, `ausgeführt` ist nicht festgelegt, wie sie in einem Ausdruck geschrieben und gespeichert werden. Auch Objekte der Anwendung „heißen im Ausdruck wie sie heißen“. Ob sie in der englischen Oberfläche anders angezeigt werden, ist nicht gesagt.
- Frage: Haben auch Werte und die Namen der Objekte der Anwendung eine sprachneutrale Kennung?

### H3 – Einheit von Spread, Pip und Punkt

- Fundstelle: Fachmodell req-fach-051 (Instrument); `str-01` Abschnitt 3
- Sachverhalt: Die Berechnungen addieren „Punkt 2 + Spread + Entry-Puffer“. Ob `Instrument.Spread`, `Pip` und `Punkt` als Kursdifferenz oder als Anzahl von Ticks oder Punkten geliefert werden, ist nicht festgelegt. Die Puffer sind in Pips angegeben.
- Frage: In welcher Einheit liefert das Instrument Spread, Pip und Punkt?

### H4 – Vergleich mit `Order.Stop-Loss` bei Short-Trades

- Fundstelle: `str-01` Abschnitte 3 und 6
- Sachverhalt: Beim Short-Trade enthält der Stop-Loss den Spread zum Zeitpunkt der Planung (Punkt 1/3 + Stop-Puffer + Spread). Abschnitt 6 erkennt eine Veränderung von Punkt 1/3 durch einen Vergleich mit `Order.Stop-Loss`. Ändert sich der Spread, weicht der neu berechnete Wert ab, auch wenn Punkt 1/3 gleich geblieben ist.
- Frage: Ist eine Anpassung bei verändertem Spread beabsichtigt?

### H5 – Wort „Ablaufelement“

- Fundstelle: Glossar „Element“ („Die Begriffe … ‚Ablaufelement‘ werden nicht verwendet“); Anforderungen Strategiedesigner req-ui-003, req-ablauf-007
- Kritikpunkt: Die geänderten Stellen verwenden genau das Wort, das das verbindliche Glossar ausschließt.

### H6 – „Verweis“ in req-ablauf-008

- Fundstelle: Anforderungen Strategiedesigner req-ablauf-008; Glossar, Änderungsnachweis 2026-10-15 („Verweis entfernt“); Fachmodell req-fach-013a
- Sachverhalt: Im Modell aus Vorlage und Instanz enthält eine Strategie Instanzen, keine Verweise auf Vorlagen. req-ablauf-008 spricht weiter von einem „Verweis, der sich nicht auflösen lässt“.
- Frage: Welcher Verweis ist gemeint, zum Beispiel auf einen nicht mehr vorhandenen Objekttyp?

### H7 – Uneinheitliche Beispiele für Namen

- Fundstelle: Fachmodell req-fach-036 (`markttechnik_trend.intakt`, daneben die Kennung `trend_intakt`); Anforderungen Strategiedesigner req-ui-005 („aus Vorlage Markttechnik-Trend, Objekttyp Trend“); Indikator Markttechnik Abschnitt 1 (Markttechnik ist ein Indikator)
- Kritikpunkt: Die Beispiele passen nicht zu den Kennungen und zum Objekttyp des Indikators Markttechnik.

### H8 – Anzeigename `VORHER` gegenüber offener Sprachfrage

- Fundstelle: Fachmodell req-fach-014, req-fach-036 letzter Satz des Absatzes zur ersten Auswahl
- Sachverhalt: Für `PREVIOUS` ist der deutsche Anzeigename `VORHER` festgelegt. Ob die Oberfläche Funktionsnamen überhaupt in der gewählten Sprache anzeigt, ist im selben Abschnitt offen.

### H9 – Elemente mit eigenen Regeln

- Fundstelle: Anforderungen Strategiedesigner req-ui-012; Fachmodell req-fach-046 („jedes Element im Ablauf“), req-fach-032 (`CloseOrder` mit Regeln)
- Sachverhalt: req-ui-012 nennt nur „Order aufgeben“, „Order ändern“ und „Position ändern“. Nach req-fach-046 kann jedes Element Regeln haben. Auch `Position schließen` veranlasst eine Order, für die Regeln gelten.

### H10 – Umfang der Änderbarkeit einer Instanz

- Fundstelle: Anforderungen Strategiedesigner req-param-005; `requirements-1-response.md`, Entscheidung 12 („in vollem Umfang änderbar“)
- Sachverhalt: req-param-005 nennt nur die Parameter der Instanz als änderbar. Nicht genannt sind der fachliche Ausdruck einer Regelinstanz und die Regeln in einer Instanz eines Regelwerks.

### H11 – Was am Ausgang `gestellt` folgt

- Fundstelle: Fachmodell req-fach-049 („An beiden Ausgängen kann der Ablauf weitergehen“), req-fach-049a („Beim Stellen der Order wird sie nicht durchlaufen“); Anforderungen Strategiedesigner req-fach-015
- Sachverhalt: Wird alles nach `gestellt` erst bei den Auslösern der Verwaltung durchlaufen, geht der Ablauf am Ausgang `gestellt` nicht sofort weiter. Wie der Bereich der Verwaltung mit dem Ausgang verbunden ist, beschreibt nur req-fach-015 („Bereich der Zeichenfläche, der am Ausgang ‚gestellt‘ beginnt“).

### H12 – Position ohne Instrument

- Fundstelle: Fachmodell req-fach-052, req-fach-032
- Sachverhalt: `CloseOrder` entnimmt das Instrument der Position. Die Position hat keine Eigenschaft `Instrument`. Die Liste in req-fach-052 ist mit „mindestens“ eingeleitet.

### H13 – Sprachfehler

- Fundstelle: Anforderungen Strategiedesigner Abschnitt 9 Punkt 7 („ihre Eigenschaften, und Parameter“)
- Kritikpunkt: Das Komma ist bei der Korrektur zu B6 stehen geblieben (req-system-021).

### H14 – Voraussetzungen in `str-01`

- Fundstelle: `str-01` Abschnitte „Voraussetzungen“ und 4; Fachmodell req-fach-051
- Sachverhalt: Abschnitt 4 verwendet Kapital und Tickwert. Die Voraussetzungen nennen beide nicht. Die Voraussetzungen sprechen von „Mindestlot“, das Instrument hat die Eigenschaft `Mindestvolumen`. Ob Entry-Puffer und Stop-Puffer Strategieparameter sind, sagt die Parametertabelle nicht.

### H15 – Änderungsnachweis des Glossars

- Fundstelle: `docs/technical/glossar.md`, Abschnitt Änderungsnachweis
- Sachverhalt: Die Einträge sind nicht nach Datum geordnet. Der Eintrag vom 2026-10-14 steht zwischen 2026-10-13 und 2026-10-12, der vom 2026-10-15 am Ende. In Durchlauf 1 wurde derselbe Mangel in den anderen Dokumenten beanstandet (E1).

### H16 – „Betreiber“ und „Anwender“

- Fundstelle: Gesamtsystem req-system-011 („vom Betreiber kontrollierten Netzes“); Anforderungen Strategiedesigner Abschnitt 9 Punkt 10 („im eigenen Netz des Anwenders“)
- Frage: Sind Betreiber und Anwender hier dieselbe Person?

### H17 – Bearbeitungsübersicht zu C6 überholt

- Fundstelle: `development/strategiedesign/reviews/requirements-1-response.md`, Zeile C6
- Sachverhalt: Die Zeile beschreibt einen Löschschutz bei Verwendung in anderen Objekten. Nach Entscheidung 12 erlaubt req-ablauf-006 das Löschen einer Vorlage, ihre Instanzen bleiben bestehen. Das Dokument des Auftraggebers ist richtig, nur die Übersicht ist veraltet.

---

## 4. Abbildbarkeit der Testfälle an den geänderten Stellen

| Testfall | Ergebnis | Hinderungsgründe |
|---|---|---|
| `str-01` | nicht vollständig abbildbar | A6 (Auslöser-Zeiteinheit, Umschalten und Ende der Rückführung nach der Paarungstabelle), N2 (Geltungsdauer von `Parameter setzen`, Zeiteinheit der Verwaltung), N3 (Rolle der Risikoregel) |
| `str-03` | nicht eindeutig abbildbar | N1 (Ansprechen der Kerze), N3 (Volumen durch Berechnung oder durch Regel) |

Alle anderen Stellen beider Testfälle lassen sich mit den beschriebenen Objekten und Arbeitsabläufen abbilden: Objekte der Anwendung, Indikatoren, `VORHER`, Position, Auslöser, Verwaltung, Ausgänge, Fallunterscheidung, Instanzen, Zuordnung von Regeln, Speichern und Öffnen.

## 5. Zusammenfassung

| Art | Anzahl | blockierend |
|---|---|---|
| Befunde aus Durchlauf 1, erledigt | 39 | – |
| Befunde aus Durchlauf 1, nicht erledigt | 4 (A6, B2 erster Teil, D1, D5) | A6, B2 |
| neue Befunde | 3 (N1, N2, N3) | alle |
| Hinweise | 17 (H1 bis H17) | keine |

Die Nachprüfung ist nicht bestanden. Wie in `docs/technical/entwicklungsverfahren.md`, Phase 2, vorgesehen, geht der Bericht über den Softwarearchitekten an den Projektleiter zurück in Phase 1. Über A6, B2, N1, N2 und N3 entscheidet der Auftraggeber. D1, D5 und die Hinweise kann der Projektleiter nach eigener Einschätzung bearbeiten oder verwerfen.
