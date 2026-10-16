# Prüfbericht Dokumente des Auftraggebers, Durchlauf 6 (Nachprüfung)

- Vorhaben: `strategiedesign`
- Phase: 2 Konzeption, Nachprüfung der Dokumente des Auftraggebers
- Rolle: QA
- geprüfter Commit: `d0d888cac5ec9b5332d09a0c8dded8da9a8fbcae` (wie im Prüfauftrag genannt)
- Vergleichsstand: `737541a294355d7a77788b76164191fd0297e7a9` (Durchlauf 5)
- Prüfauftrag: `work/strategiedesign/architect/development/strategiedesign/reviews/requirements-6-order.md`

## Ergebnis

**nicht bestanden**

N8 ist erledigt. Die Hinweise H13, H15, H16 und H17 sind bearbeitet. H14 ist im geprüften Commit nur zum Teil bearbeitet, H18 nicht (siehe unten zu Commit `aa9357d`).

Die Nachprüfung ist trotzdem nicht bestanden. Grund sind zwei neue blockierende Befunde. Beide entstehen aus der Bearbeitung von N8 und H16 an der Regelvorlage „Risiko je Trade“:

- N9: Der eine fachliche Ausdruck der Regelvorlage soll mit `Order.*`, mit `Order.Limitpreis` und mit `Position.*` rechnen. Nach den geänderten Stellen in req-fach-051 und der unveränderten Stelle in req-fach-046 führt das zu einem Fehler der Konsistenzprüfung oder dazu, dass die Regel auf eine Order nicht angewendet wird. Beide Testfälle verwenden diese Regel. Sie lassen sich gestalten, speichern und laden. Nach dem Wortlaut sind sie dann aber nicht ausführbar, oder die Risikoregel bestimmt ihr Volumen nicht.
- N10: Bei einer Stop-Limit-Order bestimmt die Regel mit dem Limitpreis und prüft bei „Order ändern“ mit dem Auslösepreis. Die Testfälle verwenden keine Stop-Limit-Order. Sie sind von N10 nicht betroffen.

Blockierend heißt nach „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Der Befund widerspricht einer Anforderung oder einem Abnahmekriterium, beeinträchtigt die Funktion oder ist eine Sicherheitslücke.

Hinweis zum Stand von `main`: Bei Beginn der Prüfung stand `origin/main` auf `aa9357d29a7f10d3d00fa5f99fe95831273fa979`. Dieser Commit folgt auf den geprüften Commit. Er enthält nur `requirements-5-response.md`, eine Änderung an `scope.md` (Abschnitt „Stand“) und zwei Änderungen am Glossar („Objekttyp“, „Objekte der Anwendung“). Geprüft ist der im Auftrag genannte Commit `d0d888c`. Die drei Änderungen aus `aa9357d` habe ich zusätzlich gelesen. Das Ergebnis dazu steht bei H14, H17 und H18. An N9 und N10 ändert `aa9357d` nichts.

## Geprüfte Unterlagen

- `docs/design/requirements/anforderungen-gesamtsystem.md` (in diesem Durchlauf unverändert)
- `docs/design/requirements/anforderungen-strategiedesigner.md`
- `docs/design/domain/fachmodell.md`
- `docs/design/domain/indikator-markttechnik.md` (in diesem Durchlauf unverändert)
- `docs/design/strategies/str-01-fachlich-scalping-punkt-2-ausbruch-einfach.md` (unverändert)
- `docs/design/strategies/str-03-fachlich-ema-trendfolge.md` (unverändert)
- `docs/technical/glossar.md` und `development/strategiedesign/scope.md` (im geprüften Commit unverändert)
- Maßstab: `development/strategiedesign/reviews/requirements-5.md`, der Grundsatz des Auftraggebers „keine Einschränkung ohne klare Notwendigkeit“ (`requirements-2-response.md`, Zeile 8), die Einträge vom 2026-10-16 (Durchlauf 5) in den Änderungsnachweisen von Fachmodell und Strategiedesigner
- Geprüfte Änderungen: `git diff 737541a294355d7a77788b76164191fd0297e7a9 d0d888cac5ec9b5332d09a0c8dded8da9a8fbcae -- docs/design docs/technical/glossar.md development/strategiedesign/scope.md`. Geändert sind nur Fachmodell (req-fach-013a, req-fach-019, req-fach-021, req-fach-028, req-fach-051, Änderungsnachweis) und Strategiedesigner (req-core-002, req-ui-005, req-ablauf-003, Änderungsnachweis).
- `requirements-5-response.md` lag im geprüften Commit nicht vor. Ich habe sie aus `aa9357d` gelesen. Sie stimmt mit den Änderungen überein, bis auf die Angaben zu Glossar und `scope.md` (siehe H14, H17, H18).

Wie im Auftrag festgelegt, wurden nicht geprüft: `anforderungen-handelssystem.md`, die Stellen des Fachmodells zur Ausführung von Strategien, die Vorlagen unter `docs/design/planning/`. Kein Befund sind Punkte, die in `scope.md` unter „Offene Punkte des Auftraggebers“ oder in den Dokumenten als offen gekennzeichnet sind.

---

## 1. Befunde aus Durchlauf 5

### Blockierender Befund

| Befund | Ergebnis | Nachweis |
|---|---|---|
| N8 `Preis` der `StopLimitOrder` hat zwei Bedeutungen | erledigt | Fachmodell req-fach-019, Eigenschaft `Preis`: „bei den wartenden Ordertypen der vorgegebene Preis nach req-fach-029 (bei der `StopLimitOrder` der Auslösepreis, der `Limitpreis` ist dort eine zusätzliche Eigenschaft)“. Das stimmt mit req-fach-029 überein: Die Stop-Order hat `Preis`, die Stop-Limit-Order zusätzlich `Limitpreis`. `Preis` hat nur noch eine Bedeutung. Die Fragen aus N8 sind beantwortet: `Preis` ist der Auslösepreis, der Limitpreis steht in `Limitpreis`, die Regel „Risiko je Trade“ bestimmt mit `Order.Limitpreis` (req-core-002). Eine Einschränkung entsteht aus req-fach-019 nicht. Neue Fehler aus der Bearbeitung: N9 (Teil b), N10 und Hinweis H20. |

### Hinweise H13 bis H18 aus Durchlauf 5

| Hinweis | Ergebnis | Nachweis |
|---|---|---|
| H13 Einleitung und Tabelle von req-fach-051 | bearbeitet | req-fach-051, erster Satz: „von `Konto`, `Instrument`, `Kerze` und `Tick` kann eine Strategie beliebig viele Instanzen verwenden“. Vierter Satz: „Sie sind in Ausdrücken verfügbar, … (`Order` und `Position` nur dort, wo sie bestimmt sind, siehe unten)“. Tabelle, Zeile `Order`, `Position`: „in einer Regel die Order beziehungsweise Position, auf die die Regel angewendet wird; in der Verwaltung …“. |
| H14 Bedeutung von `Order` und `Position` in einer Regel | im Fachmodell bearbeitet; im geprüften Commit im Glossar nicht bearbeitet | Fachmodell req-fach-051, erster Absatz: Regel auf eine Order: „`Order` ist diese Order, `Position` ist nicht verfügbar“. Regel auf eine Position: „`Position` ist diese Position und `Order` die Order, aus der sie entstanden ist“. Beide Fragen aus H14 sind damit beantwortet. req-ablauf-003 ist geändert: „Order und Position bezeichnen in einer Regel die Order beziehungsweise Position, auf die die Regel angewendet wird“. Das Glossar „Objekte der Anwendung“ sagt im geprüften Commit weiter: „in einer Regel die Order, auf die sie angewendet wird, im Ablauf die Order der Verwaltung“. Die Antwort an die QA nennt eine Änderung am Glossar. Sie ist erst in `aa9357d` enthalten. Restpunkt: Hinweis H21. Die neue Festlegung führt zu N9 (Teil a). |
| H15 `Preis` der `CloseOrder` | bearbeitet | req-fach-019: „Bei `MarketOrder` und `CloseOrder` wird er nicht vorgegeben: bis zur Ausführung der angenommene Preis, das ist der aktuelle Kurs (`Tick.Brief` für einen Kauf, `Tick.Geld` für einen Verkauf), ab der Ausführung der Ausführungspreis“. req-fach-021: Die Prüfung nach der Ausführung gilt nur für die `MarketOrder`. Die Frage aus H15 ist beantwortet. Kleiner Restpunkt: Hinweis H22. |
| H16 Fälle in „Risiko je Trade“ | bearbeitet, mit neuem Fehler | req-core-002: „bei „Position ändern“ und nach der Ausführung mit `Position.Einstiegspreis`, `Position.Stop-Loss` und `Position.Volumen`“. req-fach-021: erneute Prüfung „auf die entstandene Position (req-fach-052) mit ihrem Einstiegspreis“. Die erste Frage aus H16 ist beantwortet. Zur zweiten Frage steht jetzt: „Ob die Regel bestimmt oder prüft, ergibt sich aus dem Aufruf …, ob sie mit Order oder Position rechnet, aus dem Objekt, auf das sie angewendet wird (req-fach-051).“ Der Satz zur Fallunterscheidung ist entfernt. Wie ein einziger Ausdruck die Fälle abbildet, folgt daraus nicht. Daraus entsteht N9. |
| H17 Fundstelle für den Objekttyp „Indikator“ | bearbeitet | Fachmodell req-fach-013a, zweiter Absatz: „Ein vom Anwender angelegter Indikator hat den Objekttyp `Indikator`, ein vom Anwender angelegter Trend den Objekttyp `Trend`.“ Der Verweis in req-ui-005 führt jetzt zu dieser Festlegung. Das Glossar „Objekttyp“ nennt „Indikator“ im geprüften Commit noch nicht. In `aa9357d` ist das nachgetragen. Restpunkt: Hinweis H19. |
| H18 Zahl der Durchläufe in `scope.md` | im geprüften Commit nicht bearbeitet | `scope.md`, Abschnitt „Stand“, beginnt im geprüften Commit weiter mit „Prüfschleife der Dokumente des Auftraggebers in drei Durchläufen“. In `aa9357d` ist die Zahl entfernt, und Durchlauf 5 ist ergänzt. Dort ist H18 bearbeitet. |

---

## 2. Neue blockierende Befunde

### N9 – Der Ausdruck der Regelvorlage „Risiko je Trade“ lässt sich nach den Dokumenten nicht widerspruchsfrei schreiben

- Fundstelle: Strategiedesigner req-core-002, zweiter Absatz (in diesem Durchlauf geändert). Fachmodell req-fach-051, erster Absatz, letzte drei Sätze (in diesem Durchlauf geändert). Dagegen: Fachmodell req-fach-035 (eine Regel hat einen `fachlichen Ausdruck`), req-fach-036 (Punkt-Schreibweise `Objekt.Eigenschaft`, erste Auswahl der Funktionen), req-fach-046 (Regeln der Strategie gelten für jede Order; Grundsatz „Regel wird nicht angewendet“), req-fach-049a (Regeln gelten auch bei `Order ändern` und `Position ändern`), req-fach-019 (Eigenschaften der Order), Strategiedesigner req-ablauf-007 (Strategie mit Fehlern kann nicht ausgeführt werden).
- Sachverhalt: Nach req-core-002 rechnet dieselbe Regel je nach Fall mit verschiedenen Eingangswerten:
  - bei „Order aufgeben“ mit `Order.Preis`, bei einer Stop-Limit-Order mit `Order.Limitpreis`,
  - bei „Order ändern“ mit `Order.Preis`, `Order.Stop-Loss`, `Order.Volumen`,
  - bei „Position ändern“ und nach der Ausführung mit `Position.Einstiegspreis`, `Position.Stop-Loss`, `Position.Volumen`.

  Eine Regel hat einen fachlichen Ausdruck in OpenFormula (req-fach-035, req-fach-036). Der Satz „Der eine fachliche Ausdruck der Vorlage unterscheidet die Fälle mit einer Fallunterscheidung“ ist entfernt. An seiner Stelle steht: „ob sie mit Order oder Position rechnet, [ergibt sich] aus dem Objekt, auf das sie angewendet wird (req-fach-051)“. Nach den Dokumenten führt das zu zwei Widersprüchen:

  a) `Position` in einer Regel, die auf eine Order angewendet wird. req-fach-051 sagt jetzt: In einer Regel auf eine Order „ist `Order` diese Order, `Position` ist nicht verfügbar“, und „Die Konsistenzprüfung meldet eine Verwendung außerhalb dieser Fälle als Fehler.“ Vor diesem Durchlauf galt diese Meldung nur für Ausdrücke „im Ablauf außerhalb einer Verwaltung“. Die Risikoregel ist in beiden Testfällen eine Regel der Strategie. Sie gilt für jede Order (req-fach-046) und auch bei „Position ändern“ (req-fach-049a). Ihr Ausdruck muss für „Position ändern“ `Position.*` enthalten. Mit `Order.*` allein würde sie bei „Position ändern“ die Werte der ursprünglichen Order prüfen, nicht den neuen Stop-Loss der Position. Dann wäre sie durch eine Änderung zu umgehen. Das schließt req-fach-049a aus. Derselbe Ausdruck wird auch bei „Order aufgeben“ angewendet. Dort ist `Position` „nicht verfügbar“. Nach dem Wortlaut meldet die Konsistenzprüfung einen Fehler. Eine Strategie mit Fehlern kann nicht ausgeführt werden (req-ablauf-007).

  b) `Order.Limitpreis` in einer Regel, die auf eine andere Order angewendet wird. `Limitpreis` hat nur die `StopLimitOrder` (req-fach-029). req-fach-046 sagt: „Eine Regel, die eine Eigenschaft voraussetzt, die der Ordertyp nicht hat, wird auf diese Order nicht angewendet, ohne Fehler oder Meldung“. Enthält der Ausdruck `Order.Limitpreis`, wird die Regel nach dem Wortlaut auf `MarketOrder`, `StopOrder` und `LimitOrder` nicht angewendet. Dann bestimmt sie in `str-01` (Stop-Order) und `str-03` (Marktorder) kein Volumen. Eine Fallunterscheidung nach dem Ordertyp kann der Ausdruck nicht schreiben. `Order` hat keine Eigenschaft für den Ordertyp (req-fach-019). Die erste Auswahl der Funktionen (req-fach-036) enthält keine Funktion, die prüft, ob eine Eigenschaft vorhanden ist.

  Die Regelvorlage ist mitgeliefert. Der Anwender legt in den Testfällen nur eine Instanz an (req-core-002). Der fachliche Ausdruck der Vorlage muss aber in der Spezifikation festgelegt werden. Aus den Dokumenten lässt er sich nicht so festlegen, dass er req-core-002, req-fach-046 und req-fach-051 zugleich erfüllt.
- Auswirkung auf die Testfälle: Beide Testfälle lassen sich gestalten, speichern und laden. Speichern ist auch bei Fehlern möglich (req-ablauf-005, req-ablauf-007). Nach Teil a meldet die Konsistenzprüfung in beiden Testfällen einen Fehler an der Risikoregel, und die Strategie ist nicht ausführbar. Nach Teil b bestimmt die Risikoregel in beiden Testfällen kein Volumen. Damit widerspricht der Stand der Beschreibung der Risikoregel in `str-01` Abschnitt 4 und `str-03` Abschnitt 3: „Das Volumen bestimmt die Risikoregel der Strategie“.
- Fragen:
  - Wie bildet der eine fachliche Ausdruck der Regelvorlage die Fälle ab: Order oder Position, und bei der Stop-Limit-Order den Limitpreis? Oder hat die Vorlage mehr als einen Ausdruck? Das wäre eine Abweichung von req-fach-035.
  - Gilt die Meldung der Konsistenzprüfung in req-fach-051 („eine Verwendung außerhalb dieser Fälle“) auch für Regeln der Strategie? Diese Regeln werden auf Orders und auf Positionen angewendet.
  - „Setzt“ eine Regel nach req-fach-046 eine Eigenschaft auch dann „voraus“, wenn ihr Ausdruck die Eigenschaft nur in einem Zweig einer Fallunterscheidung verwendet?

### N10 – Risikoregel bei der Stop-Limit-Order: bestimmen mit dem Limitpreis, prüfen mit dem Auslösepreis

- Fundstelle: Strategiedesigner req-core-002, zweiter Absatz (in diesem Durchlauf geändert): bestimmend mit „`Order.Preis` (bei einer Stop-Limit-Order `Order.Limitpreis`)“, prüfend „bei „Order ändern“ mit `Order.Preis`, `Order.Stop-Loss` und `Order.Volumen`“. Dazu: Fachmodell req-fach-019 (`Preis` der `StopLimitOrder` ist der Auslösepreis), req-fach-020 („Dieselbe Regel kann beides: Sie bestimmt eine Eigenschaft, solange diese änderbar ist, und prüft sie, wenn nicht mehr änderbar …, zum Beispiel das Volumen einer wartenden Order bei `Order ändern`“), req-fach-049a.
- Sachverhalt: Bei einer Stop-Limit-Order bestimmt die Regel das Volumen aus dem Abstand zwischen Limitpreis und Stop-Loss. Bei „Order ändern“ prüft sie das Volumen mit dem Abstand zwischen `Order.Preis`, also dem Auslösepreis, und dem Stop-Loss. Die Ausnahme für die Stop-Limit-Order steht nur beim Bestimmen. Die beiden Abstände sind verschieden. Damit liefert dieselbe Regel für dieselbe, unveränderte Order zwei verschiedene Ergebnisse.
  Beispiel nach der Bedeutung der Pending-Ordertypen von MetaTrader 5 (req-fach-029): Kauf-Stop-Limit mit Auslösepreis 1,1000, Limitpreis 1,0990, Stop-Loss 1,0950, Kapital 10 000, Risikogrenze 1 %, Tickgröße 0,0001, Tickwert 10 je Lot. Die Regel bestimmt aus 40 Ticks das Volumen 0,25 Lot (Verlust 100). Ändert der Ablauf danach nur den Take-Profit mit „Order ändern“, prüft die Regel mit 50 Ticks: Verlust 125, also über der Risikogrenze. „Order ändern“ nimmt den Ausgang „nicht geändert“. Bei einer Stop-Limit-Order, deren Volumen die Risikoregel bestimmt hat, scheitert so in der Regel jede Änderung. Liegt der Limitpreis dagegen weiter vom Stop-Loss entfernt als der Auslösepreis, prüft die Regel milder, als sie bestimmt hat.
- Auswirkung auf die Testfälle: keine. `str-01` und `str-03` verwenden keine Stop-Limit-Order.
- Fragen: Mit welchem Preis prüft die Regel „Risiko je Trade“ bei „Order ändern“ eine Stop-Limit-Order? Sollen Bestimmen und Prüfen bei derselben Order mit demselben Preis rechnen?

---

## 3. Hinweise (nicht blockierend)

### H19 – Objekttyp einer als Vorlage gespeicherten Instanz eines mitgelieferten Indikators

- Fundstelle: Fachmodell req-fach-013a, zweiter Absatz (in diesem Durchlauf geändert); erster Absatz („Eine Instanz kann als neue Vorlage gespeichert werden. Jede Instanz nennt ihre Herkunft: … ihren Objekttyp“); Strategiedesigner req-ui-005, req-ablauf-004
- Sachverhalt: Neu steht: „Ein vom Anwender angelegter Indikator hat den Objekttyp `Indikator`“. Ein Anwender kann einen Indikator auf zwei Wegen anlegen: mit „Neues Objekt“ (req-ablauf-004) oder indem er eine Instanz eines mitgelieferten Indikators, etwa `EMA`, als neue Vorlage speichert (req-fach-013a). Für den zweiten Weg ist offen, ob die neue Vorlage den Objekttyp `EMA` behält oder den Objekttyp `Indikator` hat. Dasselbe gilt für einen Trend. Für die Testfälle ohne Bedeutung: Sie speichern keine Instanz als Vorlage.
- Frage: Welchen Objekttyp hat eine Vorlage, die aus einer Instanz eines mitgelieferten Indikators gespeichert wurde?

### H20 – `Order ändern` kann den Limitpreis einer Stop-Limit-Order nicht ändern

- Fundstelle: Fachmodell req-fach-049a, Tabelle, Zeile `Order ändern`: „Preis, Stop-Loss, Take-Profit, Gültigkeit“ (unverändert). Zusammen mit req-fach-019 (in diesem Durchlauf geändert).
- Sachverhalt: Seit diesem Durchlauf ist `Preis` bei der `StopLimitOrder` eindeutig der Auslösepreis. Damit kann „Order ändern“ den `Limitpreis` nicht ändern. In Durchlauf 5 war das noch unklar (N8). MetaTrader 5, das Vorbild für Bedeutung und Aktionen (req-fach-025, req-fach-030), kann beim Ändern einer Stop-Limit-Order auch den Limitpreis ändern. Das ist nicht in den Dokumenten belegt, sondern Kenntnis der QA. Ob das eine Einschränkung im Sinn des Grundsatzes „keine Einschränkung ohne klare Notwendigkeit“ ist, entscheidet nicht die QA. Für die Testfälle ohne Bedeutung.
- Frage: Soll „Order ändern“ bei einer Stop-Limit-Order auch den Limitpreis ändern können?

### H21 – Kurzfassung in req-ablauf-003 und im Glossar

- Fundstelle: Strategiedesigner req-ablauf-003, zweiter Absatz (geändert); Glossar „Objekte der Anwendung“ (im geprüften Commit unverändert, in `aa9357d` geändert)
- Sachverhalt: Die Antwort an die QA nennt req-ablauf-003 und das Glossar „gleichbedeutend gefasst“. Beide sagen: „Order und Position bezeichnen in einer Regel die Order beziehungsweise Position, auf die die Regel angewendet wird“. Das Fachmodell sagt mehr: In einer Regel auf eine Position ist `Order` die Order, aus der sie entstanden ist, und in einer Regel auf eine Order ist `Position` nicht verfügbar. Die Kurzfassung widerspricht dem nicht, nennt diese beiden Fälle aber nicht. Im geprüften Commit steht im Glossar noch die alte Fassung („die Order, auf die sie angewendet wird, im Ablauf die Order der Verwaltung“).
- Kritikpunkt: Ein Leser von req-ablauf-003 oder dem Glossar erfährt nicht, was `Order` in einer Regel auf eine Position bezeichnet.

### H22 – „Kauf“ und „Verkauf“ bei der `CloseOrder`

- Fundstelle: Fachmodell req-fach-019, Eigenschaft `Preis` (geändert); req-fach-032
- Sachverhalt: Der angenommene Preis ist „`Tick.Brief` für einen Kauf, `Tick.Geld` für einen Verkauf“. Die `CloseOrder` hat keine Richtung. Ihre Richtung geht aus der Position hervor (req-fach-032). Gemeint ist vermutlich die Gegenrichtung der Position: Das Schließen einer Kaufposition ist ein Verkauf zu `Tick.Geld`. Das steht nicht da. Liest man „Kauf“ als Richtung der Position, folgt der falsche Kurs.
- Kritikpunkt: Bei der `CloseOrder` ist nicht ausdrücklich gesagt, ob sich „Kauf“ und „Verkauf“ auf die Order oder auf die zu schließende Position beziehen.

---

## 4. Abbildbarkeit der Testfälle an den geänderten Stellen

| Testfall | gestalten | speichern | laden | Hinderungsgrund |
|---|---|---|---|---|
| `str-01` | ja, nach Wortlaut mit Fehler der Konsistenzprüfung oder ohne bestimmtes Volumen | ja | ja | N9 |
| `str-03` | ja, nach Wortlaut mit Fehler der Konsistenzprüfung oder ohne bestimmtes Volumen | ja | ja | N9 |

Geprüft an den geänderten Stellen:

- Risikoregel als Regel der Strategie bei „Order aufgeben“, in `str-01` auch bei „Order ändern“, in `str-03` auch bei „Position ändern“. Hier greift N9. Teil a: `Position.*` im Ausdruck führt nach req-fach-051 zu einem Fehler der Konsistenzprüfung. Teil b: `Order.Limitpreis` führt nach req-fach-046 dazu, dass die Regel auf Stop-Order und Marktorder nicht angewendet wird.
- `str-01`: Der Preis der Stop-Order ist der berechnete Einstieg (req-fach-019, „vorgegebene Preis nach req-fach-029“). In der Verwaltung sind `Order.Stop-Loss` und `Order.Status` verfügbar (req-fach-051, „In Ausdrücken des Ablaufs sind beide in der Verwaltung einer Order verfügbar“). Hier hindert nichts.
- `str-03`: Der Preis der Marktorder bis zur Ausführung ist der aktuelle Kurs (req-fach-019, req-fach-028). In der Verwaltung sind `Order.Status`, `Position.Stop-Loss` und `Position.Richtung` verfügbar (req-fach-051). „Position schließen“ ohne Volumen: Die Risikoregel gilt nicht für die Schließorder (req-fach-046, unverändert). Die Prüfung nach der Ausführung gehört zur Ausführung (req-fach-021). Hier hindert nichts außer N9.
- `EMA20`, `EMA50` und die ATR-Instanz in `str-03` sind Instanzen mitgelieferter Objekttypen. Die neue Festlegung in req-fach-013a betrifft sie nicht.

Speichern und Laden sind durch req-system-012, req-system-015, req-ui-009, req-ablauf-003, req-ablauf-005 und req-ablauf-008 beschrieben. An diesen Stellen ist in diesem Durchlauf nur req-ablauf-003, zweiter Absatz, geändert. Diese Änderung betrifft Speichern und Laden nicht. Speichern ist auch bei Fehlern der Konsistenzprüfung möglich (req-ablauf-007). N9 verhindert also weder Speichern noch Laden. Nach dem Wortlaut verhindert N9 aber, dass die Strategie ausführbar ist oder dass die Risikoregel das Volumen so bestimmt, wie beide Testfälle es beschreiben.

## 5. Zusammenfassung

| Art | Anzahl | blockierend |
|---|---|---|
| blockierende Befunde aus Durchlauf 5, erledigt | 1 (N8) | – |
| Hinweise aus Durchlauf 5 | H13, H15, H16, H17 bearbeitet (H16 mit neuem Fehler N9); H14 im Fachmodell bearbeitet, im Glossar erst in `aa9357d`; H18 im geprüften Commit nicht bearbeitet, in `aa9357d` bearbeitet | – |
| neue Befunde | 2 (N9, N10) | ja |
| Hinweise | 4 (H19 bis H22) | nein |

Die Nachprüfung ist nicht bestanden. Gründe sind N9 und N10. Laut `docs/technical/entwicklungsverfahren.md` geht der Bericht über den Softwarearchitekten an den Projektleiter. Durchlauf 5 hatte einen blockierenden Befund, dieser Durchlauf hat zwei. Beide gehen auf Bearbeitungen des Projektleiters zurück (Änderungsnachweise, Einträge vom 2026-10-16, Durchlauf 5: „vom Projektleiter“). Ob die Schleife nach „Grenze der Durchläufe“ eine Ebene höher geht, entscheidet nicht die QA. Die Hinweise kann der Projektleiter bearbeiten oder verwerfen.
