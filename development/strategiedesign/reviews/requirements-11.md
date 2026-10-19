# Prüfbericht QA: Dokumente des Auftraggebers, Durchlauf 11 (geänderte Stelle req-fach-053)

- Vorhaben: `strategiedesign`, Anlass: Abnahme von Arbeitspaket `wp02`, nicht abgenommen
- Phase: 1 Anforderung, Prüfung einer geänderten Stelle nach Durchlauf 10
- Prüfauftrag: `development/strategiedesign/reviews/requirements-11-order.md`
- Geprüfter Commit: `c52c6ba53d46785ea91cc11b89a2bd0a60e78c24` (`main`)
- Maßstab: `git diff 26ecff465d067320ec279a3e1bb1c12f4b8bc1e5 c52c6ba53d46785ea91cc11b89a2bd0a60e78c24 -- docs development/strategiedesign/scope.md development/strategiedesign/reviews/requirements-9-response.md` und der letzte Eintrag im Änderungsnachweis von `fachmodell.md`

## Ergebnis

**Bestanden.** Die geänderten Stellen enthalten keinen blockierenden Befund. Beide Testfälle lassen sich weiterhin vollständig gestalten, speichern und wieder laden. Es gibt 6 Hinweise (N1 bis N6).

Die Hinweise N1 und N2 gehören in die Gruppe „Entscheidung des Auftraggebers“. Sie sind für die Testfälle nicht nötig. Sie enthalten deshalb Fragen an den Auftraggeber, verhindern das Bestehen aber nicht.

## Geprüft

1. Geänderte Stellen laut Diff:
   - `fachmodell.md` req-fach-053: Tabelle der Auslösertypen (`Instrument` als Parameter von `Kerzenschluss` und `Tick`) und Absatz nach der Tabelle (Auslöser mit Parameter `Instrument`, Orders auf jedem Instrument, Verweis auf req-fach-028 und req-fach-029, Kennzeichnung als offen entfernt).
   - `fachmodell.md` Änderungsnachweis: Eintrag „Vom Projektleiter nach dem Prüfbericht der QA (`strategiedesign`, Durchlauf 9) …“, Teil zu req-fach-053 und H7.
   - `scope.md`, „Offene Punkte des Auftraggebers“: Punkt „Auslöser und Order auf einem anderen Instrument“ entfernt.
   - `requirements-9-response.md`: Zeile H7.
2. Verweise: req-fach-028 (`MarketOrder`) und req-fach-029 (`StopOrder`, `LimitOrder`, `StopLimitOrder`) führen `Instrument` als MUSS-Eigenschaft. Der Verweis stimmt. `CloseOrder` (req-fach-032) hat kein eigenes `Instrument`, es folgt aus der Position. Das widerspricht dem Satz nicht.
3. Abgleich mit den übrigen geltenden Dokumenten laut `scope.md` und dem Glossar: Gelesen habe ich `fachmodell.md` vollständig. In `anforderungen-strategiedesigner.md`, `anforderungen-gesamtsystem.md`, `indikator-markttechnik.md`, `str-01`, `str-03` und `glossar.md` habe ich alle Stellen zu „Instrument“, „Auslöser“ und „Kerzenschluss“ gelesen. Geprüft habe ich insbesondere die Beispiele aus dem Prüfauftrag:
   - req-fach-046 `wartende Orders` und `offene Positionen`: siehe N1.
   - Glossar „Auslöser“ und „Anwendung einer Strategie“: siehe N5.
   - Weitere Stellen, die an das Instrument der Anwendung binden: req-fach-051 (Kerze ohne Instanz), req-fach-019 (angenommener Preis der Marktorder) und req-core-002 (Regelvorlage „Risiko je Trade“): siehe N2, N3 und N4.
   - `indikator-markttechnik.md` Abschnitt 2 (Parameter `Instrument`, Standardwert „Instrument der Anwendung“) stimmt mit req-fach-053 überein.
   - In `anforderungen-gesamtsystem.md` steht nichts zu Instrumenten oder Auslösern. Kein Widerspruch.
4. Testfälle, nur nach den Dokumenten, ohne laufende Anwendung:
   - `str-01`: Auslöser `Kerzenschluss` der Handelszeiteinheit (Abschnitt 1) und in der Verwaltung `Tick` und `Kerzenschluss` (Abschnitt 6). Der neue Parameter `Instrument` ist mit dem Instrument der Anwendung vorbelegt (req-fach-053). Der Testfall muss ihn nicht setzen. Die Stop-Order (Abschnitt 5) braucht `Instrument` (req-fach-029, MUSS). Der Testfall nennt es nicht. Nach Satz 1 des Absatzes in req-fach-053 („Das Instrument kommt aus der Anwendung der Strategie, sofern die Strategie kein anderes festlegt“) ist es das Instrument der Anwendung. Zur Lesart siehe N3. Die Bedingung in Abschnitt 2 („auf diesem Konto und Instrument“) entspricht req-fach-046. Der Testfall gibt nur Orders auf dem Instrument der Anwendung auf.
   - `str-03`: Auslöser `Kerzenschluss` (Abschnitt 1) und in der Verwaltung (Abschnitt 4), Marktorder (Abschnitt 3). Wie bei `str-01`: Vorbelegung des Auslösers genügt, das Instrument der Marktorder folgt aus req-fach-053 Satz 1.
   - Speichern und Laden: Die Änderung fügt den Auslösern einen Parameter mit Standardwert hinzu. Das verhindert Speichern und Laden für keinen der beiden Testfälle. Zu Pflichtparametern ohne Wert (req-param-006, req-ablauf-007) kommt es nicht, weil der Parameter vorbelegt ist.
   - Der als offen gekennzeichnete Punkt „wie ein festes Instrument bezeichnet wird“ (req-fach-053) ist für die Testfälle nicht nötig. Beide verwenden kein festes Instrument.

## Blockierende Befunde

Keine.

## Hinweise

### N1 – req-fach-046: `wartende Orders` und `offene Positionen` zählen nur auf dem Instrument der Anwendung

- Fundstelle: `fachmodell.md` req-fach-046, Aufzählung („`wartende Orders` und `offene Positionen` -- Anzahl der Orders und Positionen, die diese Strategie auf dem Konto und Instrument gestellt beziehungsweise eröffnet hat, auf dem sie gerade läuft. … Vorläufig: …“). Dagegen req-fach-053 neu („So kann eine Strategie … auf ihnen Orders aufgeben. Das Instrument einer Order … ist nicht auf das Instrument der Anwendung beschränkt.“). Dazu `str-01` Abschnitt 2 („auf diesem Konto und Instrument“).
- Sachverhalt: Eine Strategie kann jetzt Orders auf anderen Instrumenten als dem der Anwendung aufgeben. Die beiden Eigenschaften zählen nach dem Wortlaut nur Orders und Positionen auf dem Instrument der Anwendung. Orders und Positionen derselben Anwendung auf anderen Instrumenten zählen danach nicht mit, und es gibt keine Eigenschaft, die sie zählt. Ob das so gewollt ist, sagt kein Dokument. Die Eigenschaften sind als vorläufig gekennzeichnet, nicht als offen. Beide Testfälle handeln nur auf dem Instrument der Anwendung. Für sie ist die Frage nicht nötig.
- Zuordnung: Entscheidung des Auftraggebers. Welche Orders und Positionen eine Eigenschaft der Strategie zählt, ist eine fachliche Regel und in keinem Dokument für Orders auf anderen Instrumenten festgelegt.
- Fragen:
  1. Sollen `wartende Orders` und `offene Positionen` weiterhin nur Orders und Positionen auf dem Instrument der Anwendung zählen, oder alle Orders und Positionen der Anwendung, gleich auf welchem Instrument?
  2. Braucht eine Strategie, die auf mehreren Instrumenten handelt, die Anzahl je Instrument?

### N2 – Kerze und Tick ohne Instanz bei einem Auslöser auf einem anderen Instrument

- Fundstelle: `fachmodell.md` req-fach-051, Absatz 1 („Liegt keine Instanz eines Objekts der Anwendung auf der Zeichenfläche, spricht ein Ausdruck es unter dem Namen seines Objekttyps an (`Kerze.Schluss`); die Kerze hat dann die Zeiteinheit des Auslösers `Kerzenschluss`, der die Auswertung gestartet hat.“). Dazu req-fach-053, Tabelle („`Kerzenschluss` | `Instrument`, `Zeiteinheit` | die abgeschlossene `Kerze` dieser Zeiteinheit“; „`Tick` | `Instrument` | den neuen `Tick`“) und Absatz („`Instrument`, `Kerze`, `Tick` … haben den Parameter `Instrument`, vorbelegt mit dem Instrument der Anwendung“).
- Sachverhalt: Ein Auslöser `Kerzenschluss` kann jetzt auf Instrument B stehen, die Anwendung läuft auf Instrument A. Ein Ausdruck spricht `Kerze.Schluss` ohne Instanz an. Nach req-fach-051 übernimmt die Kerze die Zeiteinheit des Auslösers. Über das Instrument sagt req-fach-051 nichts. Nach req-fach-053 ist es dann das Instrument der Anwendung, also A. Die Kerze hätte damit die Zeiteinheit des Auslösers, aber nicht sein Instrument. Die Tabelle in req-fach-053 sagt, der Auslöser „liefert“ die abgeschlossene Kerze, nennt aber nicht, von welchem Instrument. Für `Tick` ohne Instanz gilt dasselbe. Beide Testfälle arbeiten nur auf dem Instrument der Anwendung. Dort fallen beide Lesarten zusammen.
- Zuordnung: Entscheidung des Auftraggebers. Welche Kerze ein Ausdruck ohne Instanz meint, ist eine fachliche Regel. Für ein anderes Instrument als das der Anwendung legt sie kein Dokument fest.
- Frage: Wenn ein Auslöser `Kerzenschluss` oder `Tick` auf einem anderen Instrument als dem der Anwendung die Auswertung startet: Meint `Kerze` beziehungsweise `Tick` ohne Instanz dann die Kerze und den Tick des Auslösers oder die des Instruments der Anwendung?

### N3 – Instrument einer Order: Vorbelegung nur aus Satz 1 ableitbar

- Fundstelle: `fachmodell.md` req-fach-053, Absatz nach der Tabelle, Satz 1 („Das Instrument kommt aus der Anwendung der Strategie, sofern die Strategie kein anderes festlegt: `Instrument`, `Kerze`, `Tick`, die Auslöser `Kerzenschluss` und `Tick` und jeder Indikator haben den Parameter `Instrument`, vorbelegt mit dem Instrument der Anwendung“) und Satz 3 („Das Instrument einer Order ist ihre Eigenschaft (req-fach-028, req-fach-029) und nicht auf das Instrument der Anwendung beschränkt.“). Dazu req-fach-028 und req-fach-029 (`Instrument` -- MUSS), `str-01` Abschnitt 5, `str-03` Abschnitt 3.
- Sachverhalt: Die Aufzählung nach dem Doppelpunkt nennt die Objekte, deren Parameter `Instrument` mit dem Instrument der Anwendung vorbelegt ist. Die Order steht nicht darin. Bei ihr ist `Instrument` eine Eigenschaft, kein Parameter. Satz 3 sagt nur, dass sie nicht auf das Instrument der Anwendung beschränkt ist, nicht, womit sie vorbelegt ist. Die Testfälle nennen das Instrument der Order nicht. Dass es das Instrument der Anwendung ist, ergibt sich nur aus dem Satzanfang „sofern die Strategie kein anderes festlegt“. Diese Lesart trägt. Deshalb führe ich den Punkt nicht als blockierend.
- Zuordnung: folgt aus einer Festlegung (req-fach-053 Satz 1). Wie die Vorbelegung in der Typbeschreibung von „Order aufgeben“ erscheint: Sache der Spezifikation.
- Kritikpunkt: Die Vorbelegung des Instruments einer Order ist nicht so ausdrücklich genannt wie bei den Objekten in der Aufzählung.

### N4 – Werte des Instruments in Regeln und im angenommenen Preis einer Order auf einem anderen Instrument

- Fundstelle: `fachmodell.md` req-fach-019, Eigenschaft `Preis` („der aktuelle Kurs in Handelsrichtung der Order (`Tick.Brief` bei `buy`, `Tick.Geld` bei `sell` …)“); req-fach-051, Absatz 1 (`Order` und `Position` sind in einer Regel aus dem Zusammenhang bestimmt, `Instrument` und `Tick` nicht); `anforderungen-strategiedesigner.md` req-core-002, Absatz 2 (Regelvorlage „Risiko je Trade“: Volumen „abgerundet auf den Volumenschritt“, „Wie der fachliche Ausdruck der Vorlage das … abbildet, legt die Spezifikation fest.“). Dazu req-fach-053 neu.
- Sachverhalt: Für eine Order auf Instrument B braucht die Risikoregel Tickgröße, Tickwert und Volumenschritt von B, und der angenommene Preis einer Marktorder ist der Kurs von B. Ohne Instanz bezeichnen `Instrument` und `Tick` in einem Ausdruck aber das Instrument der Anwendung (req-fach-053, req-fach-051). Die Klammer in req-fach-019 nennt `Tick.Brief` ohne Bezug auf das Instrument der Order. Der Hauptsatz („der aktuelle Kurs in Handelsrichtung der Order“) bindet den Preis an die Order. Über die Eigenschaft `Instrument` der Order sind die Werte von B erreichbar, Ausdrücke über zwei Punkte sind in req-fach-046 vorgesehen (`Strategie.Filterinstrument.Spread`). Die Testfälle sind nicht betroffen, sie handeln nur auf dem Instrument der Anwendung.
- Zuordnung: Preis der Order: folgt aus einer Festlegung (req-fach-019 Hauptsatz, req-fach-053). Ausdruck der Regelvorlage „Risiko je Trade“: Sache der Spezifikation (req-core-002 Absatz 2).
- Kritikpunkt: Die Klammer in req-fach-019 und die Aufzählung der Werte in req-core-002 lassen sich so lesen, als gälten immer die Werte des Instruments der Anwendung. Seit req-fach-053 neu stimmt das für Orders auf anderen Instrumenten nicht.

### N5 – Glossar und req-fach-015: Auslöser ohne Instrument, Anwendung „auf zwei Instrumenten“

- Fundstelle: `glossar.md`, Eintrag „Auslöser“ („Kerzenschluss einer Zeiteinheit, Tick oder externes Ereignis“) und Eintrag „Anwendung einer Strategie“ („Die Zuordnung einer Strategie zu einem Konto und einem Instrument. … Dieselbe Strategie auf zwei Instrumenten sind zwei Anwendungen.“). Dazu `anforderungen-strategiedesigner.md` req-fach-015 („Die Auslösertypen legt das Fachmodell fest (req-fach-053): Kerzenschluss mit Zeiteinheit, Tick und externes Ereignis.“).
- Sachverhalt:
  - Glossar „Auslöser“ und req-fach-015 nennen beim Kerzenschluss nur die Zeiteinheit. Sie widersprechen req-fach-053 nicht, weil req-fach-015 auf das Fachmodell verweist. Der Parameter `Instrument` fehlt aber.
  - „Dieselbe Strategie auf zwei Instrumenten sind zwei Anwendungen“: Seit req-fach-053 neu kann eine einzige Anwendung auf mehreren Instrumenten handeln und von mehreren ausgelöst werden. Der Satz meint das Instrument, dem die Strategie zugeordnet ist. Wörtlich gelesen widerspricht er einer Anwendung, die auf zwei Instrumenten handelt.
- Zuordnung: folgt aus einer Festlegung (req-fach-053, Entscheidung des Auftraggebers vom 2026-10-19). Glossar: Softwarearchitekt. req-fach-015: Projektleiter.
- Kritikpunkt: Glossar und Folgesatz in req-fach-015 sind nicht an req-fach-053 neu angeglichen.

### N6 – Änderungsnachweis: bestehender Eintrag überschrieben statt neuer Eintrag

- Fundstelle: `fachmodell.md` Abschnitt 3, letzter Eintrag („Vom Projektleiter nach dem Prüfbericht der QA (`strategiedesign`, Durchlauf 9) … Auslöser mit Parameter `Instrument`, Order auf jedem Instrument (req-fach-053, H7, Entscheidung des Auftraggebers im Chat am 2026-10-19: keine Einschränkung ohne Notwendigkeit) …“).
- Sachverhalt: Laut Diff wurde der bestehende Eintrag zu Durchlauf 9 geändert. Vorher stand dort „Auslöser und Order auf anderem Instrument als offen gekennzeichnet (req-fach-053, H7)“. Diesen Stand hat Durchlauf 10 geprüft. Jetzt beschreibt derselbe Eintrag die spätere Entscheidung des Auftraggebers. Dass req-fach-053 zwischenzeitlich einen offenen Punkt hatte, geht aus dem Änderungsnachweis nicht mehr hervor. Der Eintrag schreibt die Entscheidung außerdem dem Projektleiter „nach dem Prüfbericht der QA (Durchlauf 9)“ zu, obwohl sie eine eigene Entscheidung des Auftraggebers ist. Die anderen Entscheidungen vom selben Tag haben eigene Einträge.
- Zuordnung: folgt aus einer Festlegung (`entwicklungsverfahren.md`, „Fragen an den Auftraggeber“: Vermerk im Änderungsnachweis mit Verweis auf die Festlegung).
- Kritikpunkt: Die Änderung ist im Änderungsnachweis nicht als eigener Schritt nachvollziehbar.

## Nicht geprüft

Nach dem Prüfauftrag nicht Gegenstand:

- seit Durchlauf 10 unveränderte Stellen, soweit sie der geänderten Stelle nicht widersprechen
- die Hinweise N1 bis N5 aus Durchlauf 10
- `anforderungen-handelssystem.md` und die Stellen des Fachmodells zur Ausführung. Ohne Bewertung beobachtet: req-fach-030 Absatz 3 prüft bei der Zuordnung zu einem Konto die Ordertypen für „Handelssoftware, Broker und Instrument des Kontos“. Orders auf anderen Instrumenten (req-fach-053 neu) erfasst der Wortlaut nicht. Das betrifft die Ausführung.
- die Vorlagen unter `docs/design/planning/`
- Spezifikation, Plan und der Code von `wp02`
- die als offen gekennzeichneten Punkte, darunter die Bezeichnung eines festen Instruments und das externe Ereignis (req-fach-053). Keiner davon ist für Gestaltung, Speichern oder Laden der Testfälle nötig.
- die technischen Dokumente außer dem Glossar

Ob die Prüfschleife eine Ebene höher geht, entscheidet nicht die QA.
