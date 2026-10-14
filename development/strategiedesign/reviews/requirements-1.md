# Prüfbericht Anforderungsdokumente, Durchlauf 1

- Vorhaben: `strategiedesign`
- Phase: 2 Konzeption, Prüfung der Anforderungsdokumente
- Rolle: QA
- geprüfter Commit: `e9d5b044735bfaf90369ef4b3d9ceaf76b61ed22` (`main`, entspricht `origin/main` zum Zeitpunkt der Prüfung)
- Prüfauftrag: `development/strategiedesign/reviews/requirements-1-order.md`

## Ergebnis

**nicht bestanden**

Die beiden Testfälle `str-01` und `str-03` lassen sich mit den beschriebenen Objekten und Abläufen nicht vollständig gestalten. Es fehlen Objekte, auf deren Eigenschaften beide Testfälle zugreifen (Konto, Instrument, Kurs, Position). Es fehlen die Beschreibungen der Indikatoren EMA und ATR. Es fehlt eine Beschreibung, wie ein früherer Wert einer Eigenschaft angesprochen wird. Dazu kommen Widersprüche zwischen dem Anforderungsdokument des Strategiedesigners und dem Anforderungsdokument des Gesamtsystems sowie innerhalb des Anforderungsdokuments des Strategiedesigners.

## Geprüfte Dokumente

- `docs/design/requirements/anforderungen-gesamtsystem.md`
- `docs/design/requirements/anforderungen-strategiedesigner.md`
- `docs/design/domain/fachmodell.md`
- `docs/design/domain/indikator-markttechnik.md`
- `docs/design/strategies/str-01-fachlich-scalping-punkt-2-ausbruch-einfach.md`
- `docs/design/strategies/str-03-fachlich-ema-trendfolge.md`

Zur Klärung von Begriffen wurde zusätzlich `docs/technical/glossar.md` gelesen. Das Glossar ist laut seinem Dokumentstatus verbindlich für alle Dokumente.

Nicht geprüft wurden laut Prüfauftrag: `anforderungen-handelssystem.md`, die Stellen des Fachmodells zur Ausführung, die Vorlagen unter `docs/design/planning/`. Die drei in `scope.md` genannten offenen Punkte werden nur dort genannt, wo sie für einen Testfall nötig sind (Befund A2).

## Aufbau der Befunde

Jeder Befund nennt Fundstelle, Sachverhalt und eine Frage oder einen Kritikpunkt. Die Befunde sind nach Gruppen geordnet:

- A: Stellen der Testfälle, die sich mit den beschriebenen Objekten und Abläufen nicht abbilden lassen
- B: Widersprüche
- C: Lücken
- D: Mehrdeutige Begriffe
- E: Form und Lesbarkeit

Die Gruppe A ist für den Nachweis des Vorhabens entscheidend.

---

## A. Abbildbarkeit der Testfälle

### A1 – Objekte Konto, Instrument und Kurs fehlen im Fachmodell

- Fundstelle: `fachmodell.md` req-fach-017, req-fach-036, req-fach-039; `str-01` Abschnitte „Voraussetzungen“, 3, 4 und 6; `str-03` Abschnitte „Voraussetzungen“ und 3
- Sachverhalt: Nach req-fach-039 müssen alle Informationen, die eine Regel verwendet, über Objekte und deren definierte Eigenschaften zugänglich sein. Beide Testfälle brauchen solche Informationen:
  - `str-01`: aktueller Spread, Pip- oder Tickgröße, Pip- oder Tickwert, Kapital (Kontostand einschließlich der Gewinne und Verluste offener Positionen), freie Margin, Mindestlot, Volumenschritt, aktueller Kurs auf Tick-Ebene (Abschnitt 6)
  - `str-03`: Schlusskurs der Kerze, Kapital, Tickwert, Mindestvolumen, Volumenschrittweite
  
  Das Fachmodell nennt Konto, Instrument und Marktdaten in req-fach-017 nur als Quellen. Es beschreibt sie nicht als Objekte mit Eigenschaften. `Konto.Kapital` steht in req-fach-036 nur als Beispiel.
- Frage: Welche Objekte mit welchen Eigenschaften stellen diese Informationen bereit? Ist „Kapital“ in `str-03` dasselbe wie in `str-01`, wo es als Kontostand einschließlich offener Gewinne und Verluste bestimmt ist?

### A2 – Indikatoren EMA und ATR sind nicht beschrieben

- Fundstelle: `str-03` Abschnitte „Voraussetzungen“, 2 bis 4 und „Parameter“; `anforderungen-strategiedesigner.md` Abschnitt 9 Punkt 9; `scope.md` „Offene Punkte des Auftraggebers“
- Sachverhalt: `str-03` braucht einen EMA-Indikator und einen ATR-Indikator. Für den Indikator `Markttechnik` gibt es eine eigene Beschreibung mit Parametern und Eigenschaften. Für EMA und ATR gibt es keine. Welche Objekte mitgeliefert werden, ist laut Abschnitt 9 Punkt 9 offen. Nach req-fach-013a kann ein Indikator auch aus Regeln bestehen. Ein EMA braucht aber seinen eigenen vorherigen Wert. Wie ein früherer Wert angesprochen wird, ist nicht beschrieben (Befund A3). Der Anwender kann EMA und ATR deshalb nach dem beschriebenen Stand auch nicht selbst anlegen. Der offene Punkt „Grundausstattung“ ist damit für die Gestaltung von `str-03` nötig. Dasselbe gilt für den Indikator `Markttechnik` in `str-01`: Er muss mitgeliefert werden, ist aber nicht als mitgeliefert festgelegt.
- Frage: Welche Parameter und Eigenschaften haben EMA und ATR, zum Beispiel Periode, Kursquelle (Schlusskurs) und Zeiteinheit? Werden EMA, ATR und Markttechnik für dieses Vorhaben mitgeliefert, obwohl die Grundausstattung sonst offen ist?

### A3 – Zugriff auf frühere Werte ist nicht beschrieben

- Fundstelle: `fachmodell.md` req-fach-014, req-fach-036; `str-03` Abschnitte 2 und 4; `str-01` Abschnitt 6
- Sachverhalt: `str-03` prüft ein Kreuzen. Dafür werden die Werte beider EMA beim vorherigen und beim aktuellen Kerzenschluss verglichen. `str-01` passt Stop-Loss und Take-Profit an, wenn sich der noch nicht endgültige Punkt 1/3 verändert hat. Dafür wird ein früherer Wert mit dem aktuellen verglichen. req-fach-014 verlangt nur, dass der vorherige Zustand verfügbar ist. Wie ein Ausdruck oder eine Bedingung den vorherigen Wert einer Eigenschaft anspricht, ist weder in req-fach-014 noch in req-fach-036 beschrieben.
- Frage: Wie wird in einer Bedingung oder einem Ausdruck der Wert einer Eigenschaft beim vorherigen Kerzenschluss angesprochen? Wie wird in `str-01` der Wert von Punkt 1/3 angesprochen, mit dem die Order gestellt wurde?

### A4 – Objekt Position fehlt, Zugriff auf die eigene Order und Position in der Verwaltung ist nicht beschrieben

- Fundstelle: `fachmodell.md` req-fach-032, req-fach-049a; `anforderungen-strategiedesigner.md` req-fach-001; `str-03` Abschnitt 4; `str-01` Abschnitte 6 und 8
- Sachverhalt: Die Verwaltung von `str-03` braucht die Richtung der Position (für die Prüfung „entgegen der Richtung der Position“ und für die Berechnung des neuen Stop-Loss) und den bisherigen Stop-Loss der Position. Die Verwaltung von `str-01` braucht den Zustand der Order: Order löschen und Order ändern sind nur sinnvoll, solange die Order wartet. Nach der Ausführung wird der Trade laut Abschnitt 8 nicht mehr verändert. `Position` wird in req-fach-001 als Beispiel eines Objekts genannt und in req-fach-032 referenziert. Das Fachmodell beschreibt sie aber nicht als Objekt mit Eigenschaften. Die Order hat die Eigenschaft `Status` (req-fach-019). Ihre Werte sind nicht festgelegt. Wie ein Element der Verwaltung Eigenschaften seiner Order oder Position anspricht, ist nicht beschrieben. Der Änderungsnachweis des Fachmodells vom 2026-10-13 nennt einen „Bezug auf die eigene Order über das Ergebnis von Order aufgeben“. Der aktuelle Text von req-fach-049a enthält diesen Bezug nicht mehr.
- Frage: Welche Eigenschaften hat eine Position, zum Beispiel Richtung, Volumen, Stop-Loss, Take-Profit und Einstiegspreis? Welche Werte hat `Status` einer Order? Wie spricht eine Bedingung in der Verwaltung ihre Order und deren Position an?

### A5 – Auslösertypen und ihre Parameter sind nicht festgelegt

- Fundstelle: `anforderungen-strategiedesigner.md` req-fach-015, req-ablauf-002; `fachmodell.md` req-fach-046, req-fach-049a; `str-01` Abschnitte 1 und 6; `str-03` Abschnitte 1 und 4
- Sachverhalt: Die Testfälle brauchen einen Auslöser „Kerzenschluss“ mit einer Zeiteinheit und einen Auslöser auf Tick-Ebene (`str-01` Abschnitt 6: „Der Durchbruch wird auf Tick-Ebene erkannt“). req-fach-015 nennt den Kerzenschluss nur als Beispiel. req-fach-049a nennt „jeden Tick“ nur als Beispiel. Es ist nicht festgelegt, welche Auslösertypen es gibt und welche Parameter sie haben. req-ablauf-002 legt fest, dass eine neue Strategie mit einem Auslöser beginnt, dessen Parameter noch zu setzen sind. Welche Parameter das sind, steht nirgends. In `str-01` Abschnitt 6 ist außerdem nicht angegeben, bei welchem Auslöser die Veränderung von Punkt 1/3 geprüft wird.
- Frage: Welche Auslösertypen gibt es in diesem Vorhaben und welche Parameter haben sie? Bei welchem Auslöser prüft die Verwaltung von `str-01` die Veränderung von Punkt 1/3?

### A6 – Ein Wert, den mehrere Elemente brauchen, lässt sich ohne Strategieparameter nicht einmal festlegen

- Fundstelle: `fachmodell.md` req-fach-046 letzter Absatz; `anforderungen-strategiedesigner.md` req-param-003, req-param-005; `str-01` Abschnitte 1, 2 und „Parameter“
- Sachverhalt: In `str-01` ist die größere Zeiteinheit ein Parameter mit den Werten M15, H1, H4 oder D1. Von ihr hängen ab: die Zeiteinheit des Indikators auf der Signalzeiteinheit, die beiden möglichen Handelszeiteinheiten nach der Paarungstabelle in Abschnitt 2 und die Zeiteinheit des Auslösers („kleinste zulässige Handelszeiteinheit“). req-fach-046 sieht keine Sammlung von Strategieparametern vor. Parameterwerte werden laut req-param-005 an jeder Verwendungsstelle einzeln gesetzt. Wie eine Tabelle wie die Paarungstabelle in der Strategie abgebildet wird, ist nicht beschrieben. Ein Datentyp „Zeiteinheit“ für Ausdrücke ist ebenfalls nicht beschrieben.
- Frage: Wie wird in `str-01` die größere Zeiteinheit einmal festgelegt oder bei der Anwendung übergeben, sodass die davon abhängigen Zeiteinheiten folgen? Wie wird die Paarungstabelle abgebildet?

### A7 – Indikator Markttechnik hat keinen Parameter für die Zeiteinheit

- Fundstelle: `indikator-markttechnik.md` Abschnitte 1, 2 und 5; `anforderungen-strategiedesigner.md` req-param-005
- Sachverhalt: Der Indikator wird laut Abschnitt 1 „auf verschiedenen Zeiteinheiten verwendet“. `str-01` verwendet ihn auf der Signalzeiteinheit und auf der Handelszeiteinheit. Abschnitt 2 nennt nur die Parameter Depth, Deviation und Backstep. Nach req-param-005 ist alles, was sich zwischen Strategien unterscheiden kann, ein Parameter des Objekts. Für EMA und ATR gilt dieselbe Frage (Befund A2).
- Frage: Woher erhält ein Indikator seine Zeiteinheit? Ist sie ein Parameter des Indikators? Erhält er das Instrument aus der Anwendung der Strategie?

### A8 – Zuordnung von Trendrichtung zu Orderrichtung und Verhalten bei abweichendem Trend auf der Handelszeiteinheit

- Fundstelle: `str-01` Abschnitte „Handelsidee“, 2 und 5; `indikator-markttechnik.md` Abschnitte 4.1 und 5; `anforderungen-strategiedesigner.md` req-fach-004; `fachmodell.md` req-fach-028, req-fach-029
- Sachverhalt: In `str-01` wird „immer in Richtung des erkannten Trends“ gehandelt. Laut `indikator-markttechnik.md` Abschnitt 5 werden auf der Signalzeiteinheit nur `Trend intakt` und `Phase` verwendet, nicht `Trendrichtung`. Woher die Handelsrichtung kommt, ist damit nicht eindeutig. Auf der Handelszeiteinheit werden `Punkt 2` und `Punkt 1/3` verwendet. Diese sind nach Abschnitt 4.1 nicht belegt, wenn dort `kein Trend` vorliegt, und gespiegelt, wenn dort ein Trend in Gegenrichtung vorliegt. `str-01` beschreibt nicht, was in diesen Fällen geschieht. Die Werte der Richtung sind in den Dokumenten verschieden benannt: `aufwärts`/`abwärts`/`kein Trend` (Markttechnik), `buy`/`sell` (Order), `long`/`seitwärts` (Beispiele in req-fach-004).
- Frage: Aus welcher Eigenschaft welcher Zeiteinheit ergibt sich die Handelsrichtung in `str-01`? Was geschieht, wenn auf der Handelszeiteinheit kein Trend oder ein Trend in Gegenrichtung vorliegt? Wie wird aus `aufwärts` die Orderrichtung `buy`?

### A9 – Ausweichen auf die kleinere Handelszeiteinheit widerspricht req-fach-049

- Fundstelle: `str-01` Abschnitte 2 und 4; `fachmodell.md` req-fach-049 erster und zweiter Absatz
- Sachverhalt: Ist der Trade auf der gewählten Handelszeiteinheit nicht handelbar, wird er laut `str-01` Abschnitt 4 auf der kleineren Handelszeiteinheit vollständig neu geplant. Der naheliegende Weg ist der Ausgang `abgelehnt` des ersten Elements `Order aufgeben`. req-fach-049 sagt im ersten Absatz: `Order aufgeben` „wird nur erreicht, wenn eine vorherige Bedingung auf den entsprechenden Ablaufpfad verzweigt“. Der zweite Absatz erlaubt, dass der Ablauf an beiden Ausgängen weitergeht. In `str-01` Abschnitt 2 heißt es außerdem, eine kleinere Handelszeiteinheit „wird gewählt“. Es bleibt offen, ob der Anwender sie als Parameter wählt oder ob immer zuerst die größere der beiden Handelszeiteinheiten geplant wird.
- Frage: Darf ein Element `Order aufgeben` unmittelbar am Ausgang `abgelehnt` eines anderen Elements `Order aufgeben` folgen? Wird in `str-01` immer zuerst die größere der beiden zulässigen Handelszeiteinheiten geplant, oder wählt der Anwender die Handelszeiteinheit?

### A10 – Reihenfolge der Regeln verhindert die Volumenregel der Strategie

- Fundstelle: `fachmodell.md` req-fach-046 Absatz „Regeln der Strategie …“, req-fach-021; `str-01` Abschnitt 4; `str-03` Abschnitt 3
- Sachverhalt: In `str-01` gilt die Risikoregel „für die ganze Strategie“. Sie berechnet das Volumen aus Einstieg und Stop-Loss. Nach req-fach-046 werden zuerst die Regeln der Strategie angewendet, danach die Regeln der Elemente. Werden Einstieg und Stop-Loss durch Regeln des Elements `Order aufgeben` bestimmt, stehen sie bei der Anwendung der Strategieregel noch nicht fest. Nach req-fach-021 werden direkt übergebene Werte vor den bestimmenden Regeln übernommen. Ob Einstieg und Stop-Loss als direkte Werte oder durch Regeln gesetzt werden sollen, ist nicht beschrieben.
- Frage: Ist beabsichtigt, dass eine bestimmende Regel der Strategie keine Werte verwenden kann, die erst Regeln eines Elements bestimmen? Wie sollen Einstieg und Stop-Loss in `str-01` an die Order kommen?

### A11 – Prüfung nach Order ändern ist nicht beschrieben

- Fundstelle: `str-01` Abschnitt 6; `fachmodell.md` req-fach-046, req-fach-049, req-fach-049a
- Sachverhalt: Nach einer Anpassung von Stop-Loss und Take-Profit werden in `str-01` Risiko, Volumen und Margin erneut geprüft. Passt das nicht mehr, wird die Order gelöscht. Die Regeln der Strategie gelten laut req-fach-046 „für jede Order, die die Strategie aufgibt“. Ob sie auch bei `Order ändern` angewendet werden, ist nicht beschrieben. `Order aufgeben` hat die Ausgänge `gestellt` und `abgelehnt`. Für `Order ändern` sind keine Ausgänge beschrieben.
- Frage: Werden prüfende Regeln auch bei `Order ändern` angewendet? Welche Ausgänge hat `Order ändern`? Oder soll die erneute Prüfung in `str-01` vor `Order ändern` durch Bedingungen erfolgen?

### A12 – Berechnungen von Einstieg, Stop-Loss und Take-Profit sind mehrdeutig

- Fundstelle: `str-01` Abschnitte 3, 4 und „Parameter“; `str-03` Abschnitte „Voraussetzungen“ und 3; `indikator-markttechnik.md` Abschnitt 2
- Sachverhalt:
  - Einstieg: „Zum Punkt 2 werden der Spread und ein Puffer berücksichtigt.“ Ob der Spread beim Short-Trade ebenfalls addiert wird oder „spiegelbildlich“ auch für den Spread gilt, ist nicht eindeutig.
  - Take-Profit: „effektives CRV von 1:1 unter Berücksichtigung des Spreads und des vorgesehenen Puffers“. Welcher Puffer gemeint ist (Entry-Puffer, Stop-Puffer oder beide) und wie der Spread eingerechnet wird, ist nicht eindeutig.
  - Einheiten: Die Puffer werden in Pips angegeben, Deviation des Indikators in Punkten, Voraussetzungen nennen Pip- oder Tickgröße. Wie Pip, Punkt und Tick zueinander stehen, ist nicht beschrieben.
  - `str-01` nennt in den Voraussetzungen die „Pip- oder Tickgröße“, in Abschnitt 4 den „Pip- beziehungsweise Tickwert“. `str-03` nennt nur den Tickwert. Für die Umrechnung des Abstands bis zum Stop-Loss in einen Geldbetrag wird auch die Tickgröße gebraucht.
- Frage: Wie lauten die Berechnungen von Einstieg, Stop-Loss und Take-Profit für Long und Short? Welche Instrumentangaben braucht `str-03` für die Volumenberechnung?

### A13 – Bedingungen für Long und Short brauchen eine Fallunterscheidung im Ausdruck

- Fundstelle: `fachmodell.md` req-fach-036 „Offen“; `str-01` Abschnitt 3; `str-03` Abschnitte 3 und 4
- Sachverhalt: Beide Testfälle behandeln Long und Short in einer Strategie mit spiegelbildlichen Berechnungen, zum Beispiel Stop-Loss „beim Kauf 2 ATR unter, beim Verkauf 2 ATR über dem Schlusskurs“. Das lässt sich entweder durch getrennte Zweige im Ablauf oder durch eine Fallunterscheidung im Ausdruck abbilden. Die Mindestauswahl der Funktionen in req-fach-036 nennt Abrunden, Aufrunden, Minimum, Maximum und Betrag, aber keine Fallunterscheidung (in OpenFormula `IF`). Die Auswahl der Funktionen ist laut `scope.md` offen und nicht blockierend. Für die Gestaltung der Testfälle ist sie nötig, soweit ein Ausdruck eine nicht ausgewählte Funktion verwendet.
- Frage: Gehört eine Fallunterscheidung zur ersten Auswahl der Funktionen, oder werden Long und Short in getrennten Zweigen gestaltet?

### A14 – Eigenschaftsnamen in Ausdrücken

- Fundstelle: `fachmodell.md` req-fach-036; `indikator-markttechnik.md` Abschnitt 4; `fachmodell.md` req-fach-046; `anforderungen-strategiedesigner.md` req-ui-007
- Sachverhalt: Eigenschaften werden in Ausdrücken in der Form `Konto.Kapital` angesprochen. Mehrere Eigenschaften, die die Testfälle brauchen, enthalten Leerzeichen oder einen Schrägstrich: `Trend intakt`, `Punkt 1/3`, `Punkt 1/3 endgültig`, `wartende Orders`, `offene Positionen`. Wie solche Namen in einem Ausdruck geschrieben werden, ist nicht beschrieben. Nach req-ui-007 muss die Zuordnung von Eigenschaften unabhängig vom angezeigten Sprachtext erfolgen. Für Funktionen ist festgelegt, dass sie mit ihrem Namen aus der Norm gespeichert werden. Für Objekte und Eigenschaften in einem gespeicherten Ausdruck fehlt eine solche Festlegung. Das betrifft Speichern und Laden der Testfälle.
- Frage: Wie werden Objekte und Eigenschaften in einem Ausdruck angesprochen, wenn ihr Name Leerzeichen oder Sonderzeichen enthält? Mit welchem Namen werden sie im gespeicherten Ausdruck abgelegt, wenn die Oberfläche Deutsch oder Englisch zeigt?

### A15 – Wie die Strategie selbst in einer Bedingung angesprochen wird

- Fundstelle: `fachmodell.md` req-fach-046 (`wartende Orders`, `offene Positionen`); `str-01` Abschnitt 2
- Sachverhalt: `str-01` beendet die Auswertung, wenn bereits eine wartende Order oder offene Position der Strategie besteht. Dafür sind die vorläufigen Eigenschaften `wartende Orders` und `offene Positionen` der Strategie vorgesehen. Die Vorläufigkeit ist gekennzeichnet. Nicht beschrieben ist, wie eine Bedingung Eigenschaften der Strategie selbst anspricht, da die Strategie kein Element auf der Zeichenfläche ist.
- Frage: Wie spricht eine Bedingung Eigenschaften der eigenen Strategie an?

---

## B. Widersprüche

### B1 – Sprachauswahl in der Kopfzeile und nur in den Einstellungen

- Fundstelle: `anforderungen-strategiedesigner.md` req-ui-009 und req-ui-010 Absatz „Der Dialog wird über …“
- Sachverhalt: req-ui-009: Die Auswahl der Oberflächensprache befindet sich im Bereich „Einstellungen“ „und nicht an anderer Stelle der Oberfläche“. req-ui-010: Die Schaltfläche „Über pipwerk Studio“ steht „in der Kopfzeile rechts neben der Sprachauswahl“.
- Frage: Wo befindet sich die Sprachauswahl? Wo steht die Schaltfläche „Über pipwerk Studio“, wenn die Sprachauswahl nicht in der Kopfzeile steht?

### B2 – Ablage als Dateien in einem Verzeichnis aus den Einstellungen gegenüber Speicherschnittstelle und Startkonfiguration

- Fundstelle: `anforderungen-strategiedesigner.md` req-ui-009; `anforderungen-gesamtsystem.md` req-system-012, req-system-015, req-system-016
- Sachverhalt: req-ui-009 legt Strategien und die übrigen eigenständig gespeicherten Objekte als Dateien in einem Verzeichnis ab. Das Verzeichnis wird im Bereich „Einstellungen“ angezeigt und geändert. Nach req-system-015 wird für persistente Datenspeicherung SQLAlchemy verwendet. Nach req-system-016 enthält die Startkonfiguration (INI-Datei) die Informationen, um die konfigurierten Speicher zu finden. Einstellungen, die über die Oberfläche geändert werden, liegen im Speicher der Komponente. Wenn das Verzeichnis ein Speicher ist, gehört es nach req-system-016 in die Startkonfiguration und nicht in die über die Oberfläche änderbaren Einstellungen. Dann wäre auch die Dateiablage an SQLAlchemy vorbei ein Widerspruch zu req-system-015. Außerdem ist nicht beschrieben, was mit den vorhandenen Dateien geschieht, wenn das Verzeichnis geändert wird.
- Frage: Ist das Ablageverzeichnis ein Speicher im Sinne von req-system-012 bis req-system-016? Wenn ja, wie verhält sich die Dateiablage zu req-system-015 und die Änderung über die Oberfläche zu req-system-016? Was geschieht beim Ändern des Verzeichnisses mit den vorhandenen Strategien und Objekten?

### B3 – Zwei Wege für die fortbestehende Gültigkeit einer Order

- Fundstelle: `anforderungen-strategiedesigner.md` req-fach-027 dritter Absatz; `fachmodell.md` req-fach-049a
- Sachverhalt: req-fach-027: Die Strategie konfiguriert eine Bedingung oder Regel, unter der eine aktive Order gültig bleibt. Diese Konfiguration wird bei der Ordererzeugung an die Order übergeben. req-fach-049a: Jede gestellte Order erhält eine Verwaltung im Ablauf der Strategie, die mit `Order löschen` auf die Order wirkt. `str-01` Abschnitt 6 verwendet die Verwaltung. Beide Beschreibungen regeln denselben Sachverhalt auf verschiedene Weise.
- Frage: Gilt req-fach-027 dritter Absatz neben der Verwaltung weiter? Wenn ja, wodurch unterscheiden sich beide Wege?

### B4 – Bearbeiten eines gespeicherten Objekts

- Fundstelle: `anforderungen-strategiedesigner.md` req-param-005 letzter Absatz, req-param-002, req-param-006, req-ablauf-001 Punkt 2, req-ablauf-004
- Sachverhalt: req-param-005: Das Bearbeiten eines gespeicherten Objekts beschränkt sich auf das Ergänzen von Parametern und das Ändern von Standardwerten. req-ablauf-004: Beim Anlegen werden Bezeichnung und Beschreibung eingegeben. Ob diese später geändert werden können, ist durch req-param-005 ausgeschlossen, ohne dass es ausdrücklich gesagt wird. req-param-002 und req-param-006: Die Parameter beschreibt die Komponente beziehungsweise der Objekttyp. Wie der Anwender einem Objekt Parameter ergänzt, die der Objekttyp nicht kennt, ist nicht beschrieben.
- Frage: Können Bezeichnung und Beschreibung eines gespeicherten Objekts geändert werden? Was bedeutet „Ergänzen von Parametern“, wenn der Objekttyp die Parameter festlegt?

### B5 – Positions-, Marktphasen-, Bewegungs- und Korrekturobjekte

- Fundstelle: `anforderungen-strategiedesigner.md` req-fach-001; `indikator-markttechnik.md` Abschnitt 4
- Sachverhalt: req-fach-001 nennt Marktphase, Bewegung, Korrektur und Position als Beispiele für Objekte. Im Indikator Markttechnik ist `Phase` eine Eigenschaft mit den Werten `Bewegung` und `Korrektur`. Das Fachmodell beschreibt keines dieser vier als Objekt (zu Position siehe A4).
- Frage: Sind Marktphase, Bewegung und Korrektur Objekte oder Werte einer Eigenschaft?

### B6 – Objekte liefern Ergebnisse

- Fundstelle: `anforderungen-strategiedesigner.md` req-fach-006, req-ui-007 zweiter Absatz, Abschnitt 9 Punkt 7; `docs/technical/glossar.md` „Ergebnis“
- Sachverhalt: Das Glossar legt fest: „Objekte liefern keine Ergebnisse, sondern haben Eigenschaften.“ req-fach-006 verlangt, dass Objekte „ihre verfügbaren Eigenschaften, Parameter, Eigenschaften und Ergebnisse“ bereitstellen. Abschnitt 9 Punkt 7 spricht ebenfalls von Ergebnissen der Objekte.
- Kritikpunkt: Die Stellen widersprechen der festgelegten Begriffstrennung. In req-fach-006 steht „Eigenschaften“ doppelt.

### B7 – ExitOrder als noch festzulegender Ordertyp

- Fundstelle: `anforderungen-strategiedesigner.md` req-core-001; `fachmodell.md` req-fach-032, req-fach-049a
- Sachverhalt: req-core-001 sagt, welche zusätzlichen Ordertypen „etwa eine ExitOrder“ benötigt werden, sei im Fachmodell festzulegen. Das Fachmodell enthält `CloseOrder` und das Element `Position schließen`. Eine `ExitOrder` kommt dort nicht vor.
- Frage: Ist die Frage nach einer `ExitOrder` durch `CloseOrder` erledigt oder weiterhin offen? Wenn offen, ist sie nicht als offen gekennzeichnet.

### B8 – Risikogrenze als Kontoangabe, als allgemeine Regel oder als Strategieregel

- Fundstelle: `str-01` Abschnitte „Voraussetzungen“ und 4; `anforderungen-strategiedesigner.md` req-core-002, req-doc-004; `fachmodell.md` req-fach-046
- Sachverhalt: `str-01` „Voraussetzungen“ nennt die „Risikogrenze des Kontos“. Abschnitt 4 legt 1 % als Risikoregel fest, die „für die ganze Strategie“ gilt. `str-03` legt ebenfalls 1 % fest. req-core-002 und req-doc-004: Allgemeine Risikoregeln werden nicht als Eigenschaft einer Strategie dupliziert, sondern referenziert und außerhalb der Strategiebeschreibung gepflegt.
- Frage: Ist die Risikogrenze von 1 % eine Angabe des Kontos, eine allgemeine Risikoregel nach req-core-002, auf die die Strategie verweist, oder eine Regel der Strategie?

---

## C. Lücken

### C1 – Öffnen einer gespeicherten Strategie ist nicht beschrieben

- Fundstelle: `anforderungen-strategiedesigner.md` req-ablauf-001 bis req-ablauf-006; `scope.md` Nachweis
- Sachverhalt: req-ablauf-001 nennt „öffnen“ für Strategien und Objekte. Ein Ablauf dazu fehlt: Woraus wählt der Anwender (Liste, Datei, Elementbibliothek), was wird angezeigt, was geschieht beim Öffnen einer Strategie, die Verweise auf nicht mehr vorhandene oder geänderte Objekte enthält? Das Wiederladen ist Teil des Nachweises des Vorhabens.
- Frage: Wie öffnet der Anwender eine gespeicherte Strategie und ein gespeichertes Objekt?

### C2 – Regeln an Strategie und Element zuordnen, Regelwerk verwenden

- Fundstelle: `fachmodell.md` req-fach-034, req-fach-041 bis req-fach-046; `anforderungen-strategiedesigner.md` req-ablauf-002, req-ablauf-003, req-ablauf-007; Glossar „Eigenschaftenansicht“
- Sachverhalt: Nach req-fach-046 hat die Strategie eigene Regeln, und jedes Element kann eigene Regeln haben. Wie der Anwender einer Strategie oder einem Element eine Regel zuordnet, ist nicht beschrieben. Ebenso ist nicht beschrieben, ob eine Regel als Element auf der Zeichenfläche steht. Steht sie dort ohne Verbindung, wäre sie nach req-ablauf-007 ein Fehler „Element ohne Verbindung“. Wo ein Regelwerk in einer Strategie verwendet wird, beschreibt keines der Dokumente. Die Eigenschaftenansicht zeigt laut Glossar das ausgewählte Element. Die Strategie ist kein Element. Wie der Anwender die Eigenschaftenansicht der Strategie aufruft (req-ablauf-002), ist nicht beschrieben.
- Frage: Wie ordnet der Anwender Regeln und Regelwerke einer Strategie und einem Element zu? Wie ruft er die Eigenschaftenansicht der Strategie auf?

### C3 – Verwendung einer Eigenschaft: Verbindung oder Ausdruck

- Fundstelle: Glossar „Verbindung“; `anforderungen-strategiedesigner.md` req-ablauf-007; `fachmodell.md` req-fach-036
- Sachverhalt: Laut Glossar kann eine Verbindung die Verwendung einer Eigenschaft durch ein anderes Element bedeuten. Ausdrücke sprechen Eigenschaften im Text an (`Konto.Kapital`). Ob ein Indikator-Element, dessen Eigenschaft nur in einem Ausdruck verwendet wird, eine gezeichnete Verbindung braucht, ist nicht beschrieben. Davon hängt ab, ob die Konsistenzprüfung es als „Element ohne Verbindung“ meldet. Ein Objekt wie Konto oder Instrument (A1) steht möglicherweise gar nicht auf der Zeichenfläche.
- Frage: Muss jede Verwendung einer Eigenschaft als Verbindung gezeichnet sein? Müssen Objekte wie Konto oder Instrument auf der Zeichenfläche stehen, damit ein Ausdruck sie verwenden kann?

### C4 – Anschluss der Auslöser der Verwaltung

- Fundstelle: `fachmodell.md` req-fach-046, req-fach-049a; `anforderungen-strategiedesigner.md` req-fach-015, req-ablauf-007
- Sachverhalt: Die Verwaltung ist der Teil des Ablaufs nach dem Ausgang `gestellt`. Sie hat eigene Auslöser. Wie ein Auslöser auf der Zeichenfläche einer Verwaltung zugeordnet wird und wie er mit dem Teil nach `gestellt` verbunden wird, ist nicht beschrieben. Offen ist auch, ob der Teil nach `gestellt` beim Stellen der Order einmal durchlaufen wird oder nur bei den Auslösern der Verwaltung.
- Frage: Wie wird ein Auslöser der Verwaltung einer Order auf der Zeichenfläche angeschlossen? Wird der Teil nach `gestellt` beim Stellen sofort einmal durchlaufen?

### C5 – Neues Objekt aus einem Objekttyp in einer Strategie

- Fundstelle: `anforderungen-strategiedesigner.md` req-ablauf-003 erster Absatz, req-ablauf-004, req-param-005
- Sachverhalt: Zieht der Anwender einen Objekttyp auf die Zeichenfläche, wird das Objekt beim Speichern der Strategie als eigenes Objekt mitgespeichert. Nicht beschrieben ist, wo der Anwender dabei Bezeichnung und Beschreibung des neuen Objekts eingibt und ob die in der Strategie gesetzten Werte zu den Standardwerten des neuen Objekts werden. In `str-03` würde der Anwender zwei EMA aus demselben Objekttyp einfügen. Ob dadurch zwei gespeicherte Objekte entstehen, ist nicht eindeutig.
- Frage: Werden die in der Strategie gesetzten Parameterwerte zu Standardwerten des neu gespeicherten Objekts? Wo gibt der Anwender Bezeichnung und Beschreibung ein?

### C6 – Löschen von Objekten, die in anderen Objekten verwendet werden

- Fundstelle: `anforderungen-strategiedesigner.md` req-ablauf-006; `fachmodell.md` req-fach-011, req-fach-038, req-fach-041
- Sachverhalt: req-ablauf-006 verhindert das Löschen eines Objekts, das in Strategien verwendet wird. Eine Regel kann aber auch in einer anderen Regel oder einem Regelwerk verwendet werden, ein Indikator in einem Trend.
- Frage: Kann ein Objekt gelöscht werden, das in einem anderen Objekt verwendet wird?

### C7 – Konsistenzprüfung von Ausdrücken und eigenständig gespeicherten Objekten

- Fundstelle: `anforderungen-strategiedesigner.md` req-ablauf-001 Punkt 3, req-ablauf-007; `fachmodell.md` req-fach-020, req-fach-045
- Sachverhalt: Die Konsistenzprüfung ist nur für Strategien beschrieben. Regeln und Regelwerke werden aber auch eigenständig gespeichert. Ein Regelwerk mit Vorwärtsbezug wird erst gemeldet, wenn eine Strategie geprüft wird. Die Liste in req-ablauf-007 enthält keinen Befund für fehlerhafte Ausdrücke (Schreibfehler, unbekannte Funktion) und keinen für eine bestimmende Regel, deren Rückgabewert nicht zur Eigenschaft passt (req-fach-020). Die Liste ist mit „mindestens“ eingeleitet.
- Frage: Werden eigenständig gespeicherte Regeln und Regelwerke beim Speichern geprüft? Gehören fehlerhafte Ausdrücke und unpassende Rückgabewerte zu den Befunden?

### C8 – Schutz der Web-API ohne Benutzerkonten

- Fundstelle: `anforderungen-gesamtsystem.md` req-system-011; `anforderungen-strategiedesigner.md` req-ui-008 zweiter Absatz, Abschnitt 9 Punkt 8
- Sachverhalt: req-system-011: Schreibende Funktionen dürfen nicht ohne geeignete Authentifizierung und Autorisierung extern zugänglich sein. Speichern und Löschen von Strategien sind schreibende Funktionen. req-ui-008 nimmt Anmeldung und Benutzerkonten aus. Ob es Benutzerkonten geben wird, ist offen. Was „extern zugänglich“ heißt, ist nicht festgelegt.
- Frage: Was bedeutet „extern zugänglich“? Muss die Web-API von pipwerk Studio in diesem Vorhaben eine Authentifizierung haben, oder genügt es, sie nicht extern erreichbar zu machen?

### C9 – Dateiname der Startkonfiguration

- Fundstelle: `anforderungen-gesamtsystem.md` req-system-017
- Sachverhalt: Die Orte `$HOME/pipwerk/etc`, `$HOME/.config/pipwerk`, `/etc/pipwerk` und die Windows-Entsprechungen sind Verzeichnisse. Welche Datei darin gesucht wird, ist nicht festgelegt. Laufen mehrere Komponenten auf einem Rechner, braucht jede eine eigene Startkonfiguration (req-system-018).
- Frage: Wie heißt die Startkonfiguration einer Komponente in diesen Verzeichnissen?

### C10 – Standanzeige in der Fußzeile

- Fundstelle: `anforderungen-strategiedesigner.md` req-ui-010 Absatz „Der Dialog wird über …“
- Sachverhalt: „Die Standanzeige in der Fußzeile bleibt bestehen.“ Eine Fußzeile mit Standanzeige ist in keinem Anforderungsdokument beschrieben. Der Satz setzt einen Stand voraus, den das Dokument nicht nennt.
- Frage: Was zeigt die Standanzeige in der Fußzeile?

---

## D. Mehrdeutige Begriffe

### D1 – „Komponente“ und „technische Komponente“

- Fundstelle: `anforderungen-strategiedesigner.md` req-fach-005, req-fach-006, req-fach-007, req-fach-009, req-param-001, req-param-002, req-param-004, req-ui-005, req-ui-008, req-ui-009; `anforderungen-gesamtsystem.md` req-system-013, req-system-016; `fachmodell.md` req-fach-010
- Sachverhalt: „Komponente“ bezeichnet im Gesamtsystem einen Teil des Systems mit eigenem Speicher und eigener Startkonfiguration (req-system-013, req-system-016). Im Anforderungsdokument des Strategiedesigners bezeichnet es in req-ui-008 und req-ui-009 ebenfalls das Programm, in req-fach-005 bis req-param-004 und req-ui-005 dagegen einen Bestandteil eines Objekts („die darin verwendeten Komponenten“). Das Glossar enthält den Begriff nicht.
- Frage: Was ist eine Komponente eines Objekts? Ist sie ein Objekt, ein Indikator, ein Berechnungsverfahren oder etwas Eigenes?

### D2 – „Prototyp“

- Fundstelle: `anforderungen-strategiedesigner.md` req-ui-007; `fachmodell.md` req-fach-046 („für den ersten Prototyp“); `docs/technical/entwicklungsverfahren.md` Phase 2 (Prototyp als nicht übernommene Probeumsetzung)
- Sachverhalt: Im Entwicklungsverfahren ist ein Prototyp eine Probeumsetzung, die nicht übernommen wird. In req-ui-007 und req-fach-046 ist offenbar das Produkt gemeint. req-system-023 verlangt Mehrsprachigkeit „von Beginn an“ für jede Oberfläche.
- Frage: Was ist mit „Prototyp“ in req-ui-007 und req-fach-046 gemeint? Gilt die Aussage für dieses Vorhaben?

### D3 – „Strategiedefinition“, „Strategie“, „Strategiedokument“

- Fundstelle: `anforderungen-gesamtsystem.md` req-system-001, req-system-004, req-system-010; `anforderungen-strategiedesigner.md` req-grund-001, req-grund-002; `fachmodell.md` req-fach-046; Glossar „Strategiedokument“
- Sachverhalt: Die Dokumente verwenden „Strategiedefinition“, „Strategie“ (Objekt) und „Strategiedokument“ (Glossar). „Strategiedefinition“ ist nicht definiert.
- Frage: Bezeichnen „Strategiedefinition“ und „Strategie“ dasselbe?

### D4 – „technische Ausführungsspezifikation“ und Ablaufschritte

- Fundstelle: `anforderungen-strategiedesigner.md` req-ui-003, req-ui-004
- Sachverhalt: req-ui-004 verlangt getrennte, verknüpfte Ebenen für die fachliche Darstellung und die „technische Ausführungsspezifikation“. Was die technische Ausführungsspezifikation ist und ob sie eine Ansicht im Strategiedesigner ist, steht nicht fest. req-ui-003 verlangt, dass Elemente des Ablaufs eine Tätigkeit oder Prüfung ausdrücken („Trend und Marktphase prüfen“). Elemente, die ein Objekt zeigen (Indikator, Trend), sind Substantive. Ob ein Anwender Ablaufschritte selbst benennt oder die Namen der Elementtypen gelten, ist nicht beschrieben.
- Frage: Was ist die technische Ausführungsspezifikation in req-ui-004? Gilt req-ui-003 auch für Elemente, die ein Objekt zeigen? Wer benennt einen Ablaufschritt?

### D5 – „Parameter“ einer Order und „Bestimmungsverfahren“

- Fundstelle: `anforderungen-strategiedesigner.md` req-fach-027, req-grund-002; `fachmodell.md` req-fach-019, req-fach-049
- Sachverhalt: req-fach-027 und req-fach-049 sprechen von „Parametern“ des Ordertyps. Das Fachmodell beschreibt die Angaben einer Order als „Eigenschaften“, darunter solche, die der Anwender nicht setzt (`Order-ID`, `Status`). req-grund-002 nennt „Bestimmungsverfahren“, das nirgends definiert ist.
- Frage: Sind die „Parameter“ eines Ordertyps genau die Eigenschaften, die in der Strategie gesetzt werden? Was ist ein Bestimmungsverfahren?

---

## E. Form und Lesbarkeit

### E1 – Änderungsnachweis des Anforderungsdokuments Strategiedesigner

- Fundstelle: `anforderungen-strategiedesigner.md` Abschnitt 10, Dokumentstatus
- Sachverhalt: Die Tabelle mischt zwei Tabellenschreibweisen und Leerzeilen zwischen Zeilen. Sie wird nicht als eine Tabelle dargestellt. Der Eintrag vom 2026-10-14 zu req-ui-010 steht vor Einträgen vom 2026-10-13. Der Dokumentstatus nennt „zuletzt aktualisiert: 2026-10-13“, der Änderungsnachweis enthält Einträge vom 2026-10-14. Der Dokumentstatus enthält keinen Vermerk „abgestimmt“, obwohl die Präsentation `praesentation-anforderungen-strategiedesigner.html` eine Bestätigung vom 13. Oktober 2026 vermerkt. Im Fachmodell steht der Eintrag vom 2026-10-11 vor dem vom 2026-09-24.
- Kritikpunkt: Widerspricht req-system-021 (gut lesbar) und erschwert die Nachvollziehbarkeit des Stands.

### E2 – Sprachliche Fehler

- Fundstelle: `anforderungen-strategiedesigner.md` req-param-004 („Eigenschaften und Parameter konkreter von Objekten“), req-ui-007 („Eigenschaften und Ergebnisse muss“), req-fach-006 („Eigenschaften“ doppelt)
- Kritikpunkt: Die Sätze sind grammatisch fehlerhaft und dadurch nicht eindeutig lesbar (req-system-021).

### E3 – Doppelte Backslashes in den Windows-Pfaden

- Fundstelle: `anforderungen-gesamtsystem.md` req-system-017
- Sachverhalt: Die Pfade stehen in Code-Schreibweise als `%USERPROFILE%\\pipwerk\\etc`. In dieser Schreibweise werden beide Backslashes angezeigt.
- Frage: Ist ein einfacher Backslash gemeint?

### E4 – Schreibweise des Namens im Glossar

- Fundstelle: `anforderungen-strategiedesigner.md` req-ui-010 letzter Absatz; `docs/technical/glossar.md` „Gemeinsame Python-Bibliothek“
- Sachverhalt: req-ui-010 verlangt die Schreibweise „pipwerk Studio“ auch in der Dokumentation. Das Glossar schreibt „Pipwerk Studio“. Das Glossar ist nicht Gegenstand dieser Prüfung. Der Hinweis betrifft die Einhaltung von req-ui-010.

### E5 – Originalbeschreibung von `str-01` nicht im Repository

- Fundstelle: `str-01` Abschnitte „Status“ und „Originalbeschreibung“
- Sachverhalt: Als Quelle und Originalbeschreibung ist `scalping-punkt-2-ausbruch-einfach(1).md` genannt. Die Datei liegt nicht im Repository. Der Abschnitt „Originalbeschreibung“ enthält nur den Dateinamen.
- Frage: Soll die Originalbeschreibung im Repository liegen, oder ist der Abschnitt nur ein Herkunftsvermerk?

---

## Zusammenfassung

| Gruppe | Anzahl | entscheidend für den Nachweis |
|---|---|---|
| A Abbildbarkeit der Testfälle | 15 | ja |
| B Widersprüche | 8 | B3 und B8 betreffen die Testfälle |
| C Lücken | 10 | C1 bis C5 betreffen Gestaltung, Speichern oder Laden |
| D Mehrdeutige Begriffe | 5 | nein |
| E Form und Lesbarkeit | 5 | nein |

Die Prüfung ist nicht bestanden. Die Befunde der Gruppe A und die Befunde C1 bis C5 verhindern, dass sich `str-01` und `str-03` mit den beschriebenen Objekten und Abläufen vollständig gestalten, speichern und wieder laden lassen.
