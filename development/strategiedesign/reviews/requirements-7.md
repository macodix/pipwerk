# Prüfbericht Dokumente des Auftraggebers, Durchlauf 7 (Nachprüfung)

- Vorhaben: `strategiedesign`
- Phase: 2 Konzeption, Nachprüfung der Dokumente des Auftraggebers
- Rolle: QA
- geprüfter Commit: `15fcc2e511277baf7601a5ff6a1b9de7fb121584` (bei Beginn der Prüfung zugleich Stand von `origin/main`)
- Vergleichsstand: `d0d888cac5ec9b5332d09a0c8dded8da9a8fbcae` (Durchlauf 6)
- Prüfauftrag: `work/strategiedesign/architect/development/strategiedesign/reviews/requirements-7-order.md`

## Ergebnis

**bestanden**

N9 und N10 sind erledigt. H19 ist begründet verworfen. H20 und H22 sind bearbeitet. H21 ist nicht bearbeitet: Die Begründung in der Antwort trifft nicht zu (siehe unten).

Die geänderten Stellen enthalten keinen neuen blockierenden Befund. Es gibt fünf neue Hinweise (H23 bis H27). Beide Testfälle lassen sich an den geänderten Stellen gestalten, speichern und wieder laden.

Blockierend heißt nach „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Der Befund widerspricht einer Anforderung oder einem Abnahmekriterium, beeinträchtigt die Funktion oder ist eine Sicherheitslücke. Alles andere ist ein Hinweis und verhindert das Bestehen nicht.

## Geprüfte Unterlagen

- `docs/design/requirements/anforderungen-gesamtsystem.md` (unverändert)
- `docs/design/requirements/anforderungen-strategiedesigner.md`
- `docs/design/domain/fachmodell.md`
- `docs/design/domain/indikator-markttechnik.md` (unverändert)
- `docs/design/strategies/str-01-fachlich-scalping-punkt-2-ausbruch-einfach.md` (unverändert)
- `docs/design/strategies/str-03-fachlich-ema-trendfolge.md` (unverändert)
- `docs/technical/glossar.md` und `development/strategiedesign/scope.md`
- Maßstab: `development/strategiedesign/reviews/requirements-6.md`, `development/strategiedesign/reviews/requirements-6-response.md`, die Einträge zu Durchlauf 6 in den Änderungsnachweisen von Fachmodell und Strategiedesigner
- Geprüfte Änderungen: `git diff d0d888cac5ec9b5332d09a0c8dded8da9a8fbcae 15fcc2e511277baf7601a5ff6a1b9de7fb121584 -- docs/design docs/technical/glossar.md development/strategiedesign/scope.md`. Geändert sind: Fachmodell req-fach-019, req-fach-049a, req-fach-051 und Änderungsnachweis; Strategiedesigner req-core-002 und Änderungsnachweis; Glossar „Objekttyp“ und „Objekte der Anwendung“; `scope.md`, Abschnitt „Stand“. Die Änderungen am Glossar stammen aus Commit `aa9357d` und lagen schon in Durchlauf 6 zur Ansicht vor. `15fcc2e` ändert das Glossar nicht.

Wie im Auftrag festgelegt, wurden nicht geprüft: `anforderungen-handelssystem.md`, die Stellen des Fachmodells zur Ausführung von Strategien, die Vorlagen unter `docs/design/planning/`, die Frage einer höheren Ebene. Kein Befund sind Punkte, die in `scope.md` unter „Offene Punkte des Auftraggebers“ oder in den Dokumenten als offen gekennzeichnet sind.

---

## 1. Blockierende Befunde aus Durchlauf 6

Maßstab ist die Entscheidung des Auftraggebers in `requirements-6-response.md`, Zeile 8: Die Dokumente legen die Regelvorlage „Risiko je Trade“ nur fachlich fest. Wie der Ausdruck Orders, Positionen und Ordertypen abbildet, legt die Spezifikation fest. Erledigt heißt: An diesen Stellen steht kein Widerspruch mehr, der eine solche Abbildung ausschließt.

| Befund | Ergebnis | Nachweis |
|---|---|---|
| N9 Ausdruck der Regelvorlage nicht widerspruchsfrei schreibbar | erledigt | Teil a: req-fach-051 meldet einen Fehler der Konsistenzprüfung nur noch für die Verwendung von `Order` und `Position` „im Ablauf außerhalb einer Verwaltung“. Für Regeln gibt es diese Meldung nicht mehr. Der Satz „`Position` ist nicht verfügbar“ ist entfernt. Ein Ausdruck, der `Position.*` enthält, führt also nicht mehr nach dem Wortlaut zu einem Fehler und damit nicht nach req-ablauf-007 zu einer nicht ausführbaren Strategie. Teil b: req-core-002 schreibt die Eingangswerte nicht mehr vor, auch nicht `Order.Limitpreis`. Fachlich steht nur noch: „Der Verlust vom Preis bis zum Stop-Loss darf höchstens die Risikogrenze betragen.“ Damit erzwingt kein Dokument mehr eine Eigenschaft, die nach req-fach-046 die Anwendung auf Stop-Order und Marktorder verhindert. Wie der Ausdruck Order und Position unterscheidet, legt nach req-core-002, letzter Satz, die Spezifikation fest. Die Dokumente schließen das nicht aus: req-fach-036 lässt die Erweiterung der Funktionsauswahl „bei Bedarf“ zu. Offen bleibt, was `Position` in einer Regel auf eine Order bezeichnet. Das ist Hinweis H23, kein Widerspruch. |
| N10 Stop-Limit-Order: bestimmen mit Limitpreis, prüfen mit Auslösepreis | erledigt | req-core-002 nennt jetzt einen einzigen „Preis“ für Bestimmen und Prüfen. Die Ausnahme für die Stop-Limit-Order beim Bestimmen ist entfernt. Damit schreiben die Dokumente keine zwei verschiedenen Preise für dieselbe Order mehr vor. Welcher Preis einer Stop-Limit-Order im Ausdruck verwendet wird, gehört nach req-core-002, letzter Satz („für … die Ordertypen“), zur Spezifikation. |

## 2. Hinweise aus Durchlauf 6

| Hinweis | Ergebnis | Nachweis |
|---|---|---|
| H19 Objekttyp einer als Vorlage gespeicherten Instanz eines mitgelieferten Indikators | verworfen | `requirements-6-response.md`: „Nicht bearbeitet. Für die Testfälle ohne Bedeutung, keine Festlegung ohne Notwendigkeit.“ Die Begründung ist angegeben. req-fach-013a ist unverändert. |
| H20 `Order ändern` kann den Limitpreis nicht ändern | bearbeitet | req-fach-049a, Tabelle, Zeile `Order ändern`: „Preis, bei der Stop-Limit-Order auch Limitpreis, Stop-Loss, Take-Profit, Gültigkeit“. Das Glossar ist nicht nachgezogen, siehe Hinweis H25. |
| H21 Kurzfassung in req-ablauf-003 und im Glossar | nicht bearbeitet | Die Antwort sagt: „Durch die Vereinfachung in req-fach-051 sagen Fachmodell, req-ablauf-003 und Glossar dasselbe.“ Das trifft nicht zu. req-fach-051 sagt weiter: „wird eine Regel auf eine Position angewendet, ist `Order` die Order, aus der die Position entstanden ist“. req-ablauf-003, zweiter Absatz, und Glossar „Objekte der Anwendung“ sagen das nicht. Der Kritikpunkt aus H21 besteht unverändert: Ein Leser von req-ablauf-003 oder dem Glossar erfährt nicht, was `Order` in einer Regel auf eine Position bezeichnet. Nicht blockierend: Das Fachmodell ist die Quelle der Objekte (Glossar, Abschnitt „Fachliche Begriffe“, erster Satz), und die Kurzfassungen widersprechen ihm nicht. |
| H22 „Kauf“ und „Verkauf“ bei der `CloseOrder` | bearbeitet | req-fach-019, Eigenschaft `Preis`: „der aktuelle Kurs in Handelsrichtung der Order (`Tick.Brief` bei `buy`, `Tick.Geld` bei `sell`; bei der `CloseOrder` die Gegenrichtung der Position)“. Das Schließen einer Kaufposition ist damit eindeutig ein Verkauf zu `Tick.Geld`. |

---

## 3. Neue blockierende Befunde

Keine.

## 4. Neue Hinweise (nicht blockierend)

### H23 – Bedeutung von `Position` in einer Regel, die auf eine Order angewendet wird

- Fundstelle: Fachmodell req-fach-051, erster Absatz, vorletzter und letzter Satz, und erster Absatz, vierter Satz („`Order` und `Position` nur dort, wo sie bestimmt sind, siehe unten“); Tabelle, Zeile `Order`, `Position` (alle in diesem Durchlauf geändert)
- Sachverhalt: Bis Durchlauf 6 stand: In einer Regel auf eine Order ist „`Position` … nicht verfügbar“, mit Fehler der Konsistenzprüfung. Beides ist entfernt. Jetzt steht: „In einer Regel bezeichnen sie die Order beziehungsweise die Position, auf die die Regel angewendet wird“. Wird eine Regel auf eine Order angewendet, etwa bei `Order aufgeben`, gibt es keine Position, auf die sie angewendet wird. Was `Position` dann bezeichnet, steht nicht da. Es gibt auch keine Meldung mehr. Der Verweis „nur dort, wo sie bestimmt sind, siehe unten“ führt für diesen Fall ins Leere. Die Risikoregel braucht genau diesen Fall: Sie wird bei `Order aufgeben` auf eine Order und bei `Position ändern` auf eine Position angewendet. Nach der Entscheidung des Auftraggebers legt die Spezifikation fest, wie ihr Ausdruck das abbildet. Ob damit auch die Bedeutung von `Position` in einer Regel auf eine Order der Spezifikation überlassen ist, steht in keinem Dokument.
- Frage: Was bezeichnet `Position` in einer Regel, die auf eine Order angewendet wird? Ist das ausdrücklich der Spezifikation überlassen?

### H24 – `Order` und `Position` in einer Regel, die auf keine Order und keine Position angewendet wird

- Fundstelle: Fachmodell req-fach-051, erster Absatz, letzter Satz (geändert). Dazu unverändert: req-fach-036 (ein Ausdruck kann „Ergebnisse anderer Regeln“ verwenden), req-fach-037a (eine Bedingung kann Ergebnisse von Regeln einbeziehen), req-fach-048 (eine Berechnung ebenso), req-fach-013a (ein Indikator kann aus Regeln bestehen).
- Sachverhalt: Eine Regel kann auch verwendet werden, ohne auf eine Order oder Position angewendet zu werden: etwa ihr Ergebnis in einer Bedingung des Hauptablaufs oder als Teil eines Indikators. Bis Durchlauf 6 meldete die Konsistenzprüfung „eine Verwendung außerhalb dieser Fälle als Fehler“. Jetzt meldet sie nur noch die Verwendung „im Ablauf außerhalb einer Verwaltung“. Ob eine Regel, deren Ergebnis eine Bedingung des Hauptablaufs verwendet, als „im Ablauf“ gilt, ist nicht gesagt. Für einen Indikator aus Regeln gilt der Satz nicht. Die Testfälle sind nicht betroffen: Sie verwenden `Order` und `Position` nur in der Risikoregel und in der Verwaltung.
- Frage: Was bezeichnen `Order` und `Position` in einer Regel, die nicht auf eine Order oder Position angewendet wird, und meldet die Konsistenzprüfung diese Verwendung?

### H25 – Glossar „Order ändern“ ohne Limitpreis

- Fundstelle: Glossar, Eintrag „Order ändern“ (unverändert): „Das Element, das Preis, Stop-Loss, Take-Profit oder Gültigkeit einer wartenden Order ändert.“ Dagegen Fachmodell req-fach-049a (in diesem Durchlauf geändert): „Preis, bei der Stop-Limit-Order auch Limitpreis, Stop-Loss, Take-Profit, Gültigkeit“.
- Sachverhalt: Die Bearbeitung von H20 ist im Glossar nicht nachgezogen. Die Aufzählung im Glossar ist damit enger als req-fach-049a. Für die Testfälle ohne Bedeutung, sie verwenden keine Stop-Limit-Order.
- Kritikpunkt: Glossar und Fachmodell nennen für „Order ändern“ verschiedene änderbare Eigenschaften.

### H26 – Verweis in req-fach-028 auf req-core-002

- Fundstelle: Fachmodell req-fach-028, letzter Absatz (unverändert): „Regeln rechnen mit diesem Preis (Anforderungen Strategiedesigner req-core-002).“ Dazu Strategiedesigner req-core-002 (geändert).
- Sachverhalt: req-core-002 sagte bis Durchlauf 6: „Bei einer Marktorder ist der Preis bis zur Ausführung der angenommene Preis, der aktuelle Kurs“. Dieser Satz ist entfernt. Der Verweis in req-fach-028 nennt req-core-002 als Beleg für eine Aussage, die dort nicht mehr steht. Ein Widerspruch entsteht nicht. req-fach-028 trägt die Aussage selbst, und req-core-002 spricht weiter vom „Preis“.
- Kritikpunkt: Der Verweis führt zu einer Stelle, die die Aussage nicht mehr enthält.

### H27 – Änderungsnachweis und Stand des Glossars

- Fundstelle: Glossar, Abschnitt „Dokumentstatus“ („stand: 2026-10-15“) und „Änderungsnachweis“
- Sachverhalt: Die Einträge „Objekttyp“ (Objekttyp „Indikator“) und „Objekte der Anwendung“ (Order und Position in einer Regel) sind in Commit `aa9357d` geändert, zur Bearbeitung von Durchlauf 5. Der Änderungsnachweis hat dazu keinen Eintrag. Der letzte Eintrag betrifft Durchlauf 4. Der Stand nennt den 2026-10-15, obwohl der Änderungsnachweis schon Einträge vom 2026-10-16 hat.
- Kritikpunkt: Der Änderungsnachweis des Glossars ist für Durchlauf 5 unvollständig, und der Stand passt nicht zu ihm.

---

## 5. Abbildbarkeit der Testfälle an den geänderten Stellen

| Testfall | gestalten | speichern | laden | Hinderungsgrund |
|---|---|---|---|---|
| `str-01` | ja | ja | ja | keiner |
| `str-03` | ja | ja | ja | keiner |

Geprüft an den geänderten Stellen:

- Risikoregel (req-core-002, req-fach-051): In beiden Testfällen ist sie eine Instanz der mitgelieferten Regelvorlage „Risiko je Trade“ mit dem Wert 1 % (`str-01` Abschnitt 4, `str-03` Abschnitt 3). Der Anwender legt nur die Instanz an und setzt die Risikogrenze. Die Beschreibung in den Testfällen stimmt mit req-core-002 überein: Das Volumen wird so bestimmt, dass der Verlust vom Preis bis zum Stop-Loss höchstens die Risikogrenze beträgt, abgerundet auf den Volumenschritt. In `str-01` prüft die Regel bei „Order ändern“, in `str-03` bei „Position ändern“. Beides folgt aus „danach prüft sie diese Bedingung“ in req-core-002 und aus req-fach-049a. Nach req-fach-051 meldet die Konsistenzprüfung keinen Fehler mehr, wenn der Ausdruck `Position` verwendet. Die Strategie ist damit nicht schon nach dem Wortlaut der Dokumente nicht ausführbar, wie es N9 Teil a beschrieben hatte. Den fachlichen Ausdruck der Vorlage legt die Spezifikation fest.
- `str-01`, „Order ändern“ an einer Stop-Order (req-fach-049a): Die Ergänzung betrifft nur die Stop-Limit-Order. In der Verwaltung sind `Order.Stop-Loss` und `Order.Status` verfügbar (req-fach-051, „In Ausdrücken des Ablaufs bezeichnen sie die Order und Position der Verwaltung“). Hier hindert nichts.
- `str-03`, „Position schließen“ (req-fach-019): Die Neufassung des Preises der `CloseOrder` betrifft nur die Ausführung. Die Risikoregel gilt für die Schließorder nicht (req-fach-046, req-core-002). In der Verwaltung sind `Order.Status`, `Position.Stop-Loss` und `Position.Richtung` verfügbar (req-fach-051). Hier hindert nichts.

Speichern und Laden sind durch req-system-012, req-system-015, req-ui-009, req-ablauf-003, req-ablauf-005 und req-ablauf-008 beschrieben. Keine dieser Stellen ist in diesem Durchlauf geändert. Speichern ist auch bei Befunden der Konsistenzprüfung möglich (req-ablauf-005, req-ablauf-007).

## 6. Zusammenfassung

| Art | Ergebnis | blockierend |
|---|---|---|
| blockierende Befunde aus Durchlauf 6 | N9 erledigt, N10 erledigt | – |
| Hinweise aus Durchlauf 6 | H19 verworfen, H20 bearbeitet, H21 nicht bearbeitet, H22 bearbeitet | nein |
| neue blockierende Befunde | keine | – |
| neue Hinweise | 5 (H23 bis H27) | nein |

Die Nachprüfung ist bestanden. Die Hinweise H21 und H23 bis H27 verhindern das Bestehen nicht. Nach „Umfang der Prüfungen“ werden sie bei der nächsten passenden Gelegenheit erledigt oder verworfen. H23 und H24 betreffen die Bedeutung von `Order` und `Position` in Regeln. Sie berühren damit den Teil, den der Auftraggeber der Spezifikation zugewiesen hat.
