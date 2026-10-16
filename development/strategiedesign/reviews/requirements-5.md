# Prüfbericht Dokumente des Auftraggebers, Durchlauf 5 (Nachprüfung)

- Vorhaben: `strategiedesign`
- Phase: 2 Konzeption, Nachprüfung der Dokumente des Auftraggebers
- Rolle: QA
- geprüfter Commit: `737541a294355d7a77788b76164191fd0297e7a9` (`main`, entspricht `origin/main` zum Zeitpunkt der Prüfung)
- Vergleichsstand: `a8d377f41bea2ef170510ef4dfa4e0b344a61619` (Durchlauf 4)
- Prüfauftrag: `development/strategiedesign/reviews/requirements-5-order.md`

## Ergebnis

**nicht bestanden**

N7 ist erledigt. Die Hinweise H1 bis H12 aus Durchlauf 4 sind eingearbeitet.

Die Nachprüfung ist trotzdem nicht bestanden. Grund ist ein neuer blockierender Befund (N8). Er entsteht aus der Bearbeitung von H1 in req-fach-019. Dort ist jetzt der `Preis` einer `StopLimitOrder` der `Limitpreis`. Nach req-fach-029 hat die `StopLimitOrder` aber `Preis` und `Limitpreis` als zwei Eigenschaften, und `Preis` ist dort der Auslösepreis. Die beiden Testfälle verwenden keine Stop-Limit-Order. Sie sind von N8 nicht betroffen.

Blockierend heißt nach „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Der Befund widerspricht einer Anforderung oder einem Abnahmekriterium, beeinträchtigt die Funktion oder ist eine Sicherheitslücke. N8 widerspricht req-fach-029.

Hinweis zum Verfahren: Laut `docs/technical/entwicklungsverfahren.md`, Abschnitt „Grenze der Durchläufe“, hat jede Prüfschleife höchstens drei Durchläufe. Danach geht der Fall eine Ebene höher. Dies ist der fünfte Durchlauf. N8 geht wie N7 auf eine Bearbeitung des Projektleiters zurück, nicht auf eine Entscheidung des Auftraggebers. Ob dafür eine Entscheidung des Auftraggebers nötig ist, entscheidet nicht die QA.

## Geprüfte Unterlagen

- `docs/design/requirements/anforderungen-gesamtsystem.md` (in diesem Durchlauf unverändert)
- `docs/design/requirements/anforderungen-strategiedesigner.md`
- `docs/design/domain/fachmodell.md`
- `docs/design/domain/indikator-markttechnik.md` (in diesem Durchlauf unverändert)
- `docs/design/strategies/str-01-fachlich-scalping-punkt-2-ausbruch-einfach.md`
- `docs/design/strategies/str-03-fachlich-ema-trendfolge.md`
- `docs/technical/glossar.md`
- `development/strategiedesign/scope.md`
- Maßstab: `development/strategiedesign/reviews/requirements-4.md` und `requirements-4-response.md`, dazu der Grundsatz des Auftraggebers „keine Einschränkung ohne klare Notwendigkeit“ aus `requirements-2-response.md`. Für H8 zusätzlich `requirements-3-response.md`.
- Geprüfte Änderungen: `git diff a8d377f41bea2ef170510ef4dfa4e0b344a61619 737541a294355d7a77788b76164191fd0297e7a9 -- docs/design docs/technical/glossar.md development/strategiedesign/scope.md`

Wie im Auftrag festgelegt, wurden nicht geprüft: `anforderungen-handelssystem.md`, die Stellen des Fachmodells zur Ausführung von Strategien, die Vorlagen unter `docs/design/planning/`. Kein Befund sind Punkte, die in `scope.md` unter „Offene Punkte des Auftraggebers“ oder in den Dokumenten als offen gekennzeichnet sind. Dazu gehören die Maßnahme nach der Prüfung mit dem Ausführungspreis (req-fach-021) und die Regel zur freien Margin (req-fach-049).

---

## 1. Befunde aus Durchlauf 4

### Blockierender Befund

| Befund | Ergebnis | Nachweis |
|---|---|---|
| N7 `Order` nur in der Verwaltung verfügbar, Regeln der Strategie verwenden `Order` außerhalb | erledigt | Fachmodell req-fach-051, letzter Satz des ersten Absatzes: „In Ausdrücken einer Regel sind es die Order beziehungsweise die Position, auf die die Regel angewendet wird (req-fach-040), auch bei `Order aufgeben` im Hauptablauf. In Ausdrücken des Ablaufs sind sie in der Verwaltung einer Order verfügbar (req-fach-049a); die Konsistenzprüfung meldet ihre Verwendung im Ablauf außerhalb einer Verwaltung als Fehler.“ Strategiedesigner req-ablauf-003, zweiter Absatz, und Glossar „Objekte der Anwendung“ sind angeglichen. Damit sind Risikoregel und Prüfung des Mindestvolumens als Regeln der Strategie bei „Order aufgeben“ im Hauptablauf zulässig. Die verbleibende Einschränkung betrifft nur Ausdrücke des Ablaufs außerhalb einer Verwaltung. Dort gibt es keine bestimmte Order und Position, auf die sich der Name beziehen könnte. Die Einschränkung ist also begründet. Restpunkte: Hinweise H13 und H14. |

### Hinweise H1 bis H12 aus Durchlauf 4

| Hinweis | Ergebnis | Nachweis |
|---|---|---|
| H1 `Preis` als Eigenschaft jeder Order | eingearbeitet, mit neuem Fehler | req-fach-019: `Preis` -- MUSS als allgemeine Eigenschaft, mit Festlegung für `StopLimitOrder` und `CloseOrder`. req-fach-028 verweist darauf. Die Festlegung für die `StopLimitOrder` führt zu N8. Restpunkt zur `CloseOrder`: Hinweis H15. |
| H2 Prüfung nach der Ausführung | eingearbeitet | req-fach-021, letzter Absatz: Prüfung mit dem Ausführungspreis für Orders mit angenommenem Preis, Maßnahme als offen gekennzeichnet („Betrifft die Ausführung“). `str-03` Abschnitt 4: Satz entfernt. „Offene fachliche Fragen“: Die Ausführung prüft, nicht der Ablauf. `scope.md` nennt den Punkt unter „Offene Punkte des Auftraggebers“. Restpunkt: Hinweis H16. |
| H3 Eingangswerte für die prüfende Rolle | eingearbeitet | req-core-002: Eingangswerte getrennt für „Order ändern“ (`Order.Preis`, `Order.Stop-Loss`, `Order.Volumen`) und „Position ändern“ (`Position.Einstiegspreis`, `Position.Stop-Loss`, `Position.Volumen`), Unterscheidung durch Fallunterscheidung. Restpunkt: Hinweis H16. |
| H4 Geltungsbereich des Grundsatzes „Regel wird nicht angewendet“ | eingearbeitet | req-fach-046, vorletzter Absatz: „Für Regeln der Strategie und Regeln der Elemente gilt gleichermaßen … ohne Fehler oder Meldung“. |
| H5 Order, Position und Strategie als Instanzen | eingearbeitet | req-fach-051: „mit Ausnahme von `Order`, `Position` und `Strategie`“ und „werden nicht als Instanz auf die Zeichenfläche gelegt“. req-ablauf-003: Nur Konto, Instrument, Kerze und Tick stehen in der Elementbibliothek. Restpunkt: Hinweis H13. |
| H6 Doppelte Nennung in req-fach-001 | eingearbeitet | req-fach-001: `Order` und `Position` stehen nur noch unter den Objekten der Anwendung. |
| H7 Objekttyp eines angelegten Indikators | eingearbeitet | req-ui-005: „Ein vom Anwender angelegter Indikator hat den Objekttyp „Indikator“, ein mitgelieferter Indikator ist selbst ein Objekttyp“. Schreibweise `EMA21` in req-ui-005, req-ablauf-003 und Glossar einheitlich. Restpunkt: Hinweis H17. |
| H8 Herkunft der Änderungen vom 2026-10-16 | eingearbeitet | Änderungsnachweise von Fachmodell und Strategiedesigner trennen für Durchlauf 3 „Entscheidungen des Auftraggebers“ und „Vom Projektleiter nach Hinweisen der QA“. Die Zuordnung stimmt mit `requirements-3-response.md` überein. Durchlauf 4 ist als „vom Projektleiter“ vermerkt, wie in `requirements-4-response.md`. |
| H9 Reihenfolge der Änderungsnachweise | eingearbeitet | Fachmodell und Strategiedesigner aufsteigend, Glossar absteigend nach Datum. Kleiner Restpunkt im Glossar: Die beiden Einträge vom 2026-10-16 stehen in der Reihenfolge Durchlauf 3, Durchlauf 4, also innerhalb des Datums aufsteigend. |
| H10 Bezug von „es“ in `str-03` | eingearbeitet | `str-03` Abschnitt 3: „Liegt das Volumen unter dem Mindestvolumen …“. |
| H11 Eingangswerte in `str-01` | eingearbeitet | `str-01` Abschnitt 4: „aus Einstieg, Stop-Loss, Tickgröße, Tickwert und einer Risikogrenze“. |
| H12 Margin-Prüfung nicht als offen gekennzeichnet | eingearbeitet | req-fach-049, zweiter Absatz: „Offen: eine Regel zur freien Margin; den Marginbedarf einer Order liefert derzeit kein Objekt.“ `scope.md`, „Offene Punkte des Auftraggebers“: neuer Punkt mit `VORHER`, `Parameter setzen`, Maßnahme nach der Prüfung mit dem Ausführungspreis, Margin-Regel und Spread in `str-01`. |

---

## 2. Neuer blockierender Befund

### N8 – `Preis` der `StopLimitOrder` hat zwei Bedeutungen

- Fundstelle: Fachmodell req-fach-019, Eigenschaft `Preis` (in diesem Durchlauf neu). Dagegen: Fachmodell req-fach-029, Tabelle der wartenden Ordertypen, Zeilen `StopOrder` und `StopLimitOrder`. Betroffen außerdem: req-fach-049a (`Order ändern` ändert den Preis), Strategiedesigner req-core-002 (Eingangswert `Order.Preis`).
- Sachverhalt: req-fach-019 sagt jetzt: „Bei Ordertypen mit vorgegebenem Preis ist es dieser (bei der `StopLimitOrder` der `Limitpreis`)“. req-fach-029 sagt zur `StopLimitOrder`: „Beim Erreichen des Auslösepreises wird eine Limit-Order zum Limitpreis gestellt“. Ihre Eigenschaften sind „wie Stop-Order, zusätzlich `Limitpreis` -- MUSS“. Die Stop-Order hat `Preis` -- MUSS. Die einzige Eigenschaft der `StopLimitOrder`, die den Auslösepreis aufnehmen kann, ist also `Preis`.
  Nach req-fach-019 ist `Preis` aber der Limitpreis. Dann hat dieselbe Eigenschaft zwei Bedeutungen. Oder die `StopLimitOrder` hat keine Eigenschaft für den Auslösepreis. Im zweiten Fall lässt sich eine Stop-Limit-Order mit verschiedenem Auslöse- und Limitpreis nicht beschreiben. Sie gehört nach req-fach-025 und req-fach-029 zu den Ordertypen der ersten Entwicklungsphase. Unklar ist dann auch, welchen Preis „Order ändern“ bei einer Stop-Limit-Order ändert (req-fach-049a).
  Die Festlegung stammt laut `requirements-4-response.md` (Zeile H1) und Änderungsnachweis des Fachmodells (Eintrag 2026-10-16, Durchlauf 4) vom Projektleiter. Hinweis H1 aus Durchlauf 4 hatte gefragt, ab welchem Preis die Regel bei einer Stop-Limit-Order rechnet. Er hatte nicht vorgeschlagen, `Preis` umzudeuten.
- Fragen: Ist `Preis` bei der `StopLimitOrder` der Auslösepreis oder der Limitpreis? Wenn der Limitpreis: In welcher Eigenschaft steht der Auslösepreis? Mit welchem der beiden Preise rechnet die Regel „Risiko je Trade“ bei einer Stop-Limit-Order?

---

## 3. Hinweise (nicht blockierend)

### H13 – req-fach-051 widerspricht sich in Einleitung und Tabelle

- Fundstelle: Fachmodell req-fach-051, erster und vierter Satz des ersten Absatzes; Tabelle, Zeile `Order`, `Position`
- Sachverhalt: Der erste Satz sagt weiter für alle Objekte der Anwendung: „eine Strategie kann beliebig viele Instanzen davon verwenden, jede mit eigenem Namen“. Der vierte Satz sagt: „Sie sind in Ausdrücken immer verfügbar“. Weiter hinten im selben Absatz gilt beides für `Order`, `Position` und `Strategie` nicht mehr: keine Instanz, und `Order` und `Position` im Ablauf nur in der Verwaltung. Die Tabelle beschreibt `Order` und `Position` weiter nur als „in der Verwaltung einer Order die eigene Order und die daraus entstandene Position“. Die neue Bedeutung in Ausdrücken einer Regel fehlt dort.
- Kritikpunkt: Einleitung und Tabelle passen nicht mehr zum letzten Satz des Absatzes. Ein Leser der Tabelle findet die Bedeutung von `Order` in einer Regel nicht.

### H14 – Bedeutung von `Order` und `Position` in einer Regel

- Fundstelle: Fachmodell req-fach-051, erster Absatz, letzter Teil; Strategiedesigner req-ablauf-003, zweiter Absatz; Glossar „Objekte der Anwendung“
- Sachverhalt: Das Fachmodell sagt: In einer Regel sind es „die Order beziehungsweise die Position, auf die die Regel angewendet wird“. req-ablauf-003 und Glossar sagen: „Order und Position bezeichnen in einer Regel die Order, auf die sie angewendet wird“. Danach bezeichnet auch `Position` eine Order. Offen bleibt in allen drei Texten:
  - Was bezeichnet `Position` in einer Regel bei „Order aufgeben“ oder „Order ändern“, wenn es noch keine Position gibt?
  - Was bezeichnet `Order` in einer Regel bei „Position ändern“, die auf die Position angewendet wird? Die Order, aus der die Position entstanden ist?
  Das ist für H16 wichtig. Die Regelvorlage „Risiko je Trade“ verwendet in einem Ausdruck `Order.*` und `Position.*`.
- Fragen: Was bezeichnen `Order` und `Position` in einer Regel, wenn die Regel auf das jeweils andere Objekt angewendet wird? Ist die kürzere Fassung in req-ablauf-003 und Glossar gleichbedeutend mit dem Fachmodell gemeint?

### H15 – `Preis` der `CloseOrder`

- Fundstelle: Fachmodell req-fach-019, Eigenschaft `Preis`, letzter Satz; req-fach-021, letzter Absatz
- Sachverhalt: req-fach-019 nennt zwei Fälle: „sonst bis zur Ausführung der angenommene Preis und ab der Ausführung der Ausführungspreis“ und danach eigens „Bei einer `CloseOrder` ist es der aktuelle Kurs, zu dem die Position geschlossen wird“. Ob der Preis einer `CloseOrder` nach der Ausführung der Ausführungspreis wird, ist dadurch nicht eindeutig. Auch nicht, welcher Kurs gemeint ist (`Tick.Geld` oder `Tick.Brief`, je nach Richtung der Position). Ebenso unklar ist, ob eine `CloseOrder` eine Order „mit einem angenommenen Preis“ im Sinn von req-fach-021 ist. Für die Testfälle ohne Bedeutung: Die Risikoregel gilt für die Schließorder nicht.
- Frage: Ist der aktuelle Kurs der `CloseOrder` ein angenommener Preis, der nach der Ausführung durch den Ausführungspreis ersetzt wird?

### H16 – Fälle der Fallunterscheidung in „Risiko je Trade“

- Fundstelle: Strategiedesigner req-core-002; Fachmodell req-fach-020, req-fach-021 (letzter Absatz)
- Sachverhalt: req-core-002 nennt drei Fälle mit Eingangswerten: bestimmend bei „Order aufgeben“, prüfend bei „Order ändern“, prüfend bei „Position ändern“. Ein vierter Fall ist die erneute Prüfung nach der Ausführung (req-fach-021). Für ihn nennt req-core-002 keine Eingangswerte: Rechnet die Regel dann mit `Order.Preis` (jetzt Ausführungspreis), `Order.Stop-Loss` und `Order.Volumen` oder mit den Werten der Position? Außerdem sagt req-core-002: „Der eine fachliche Ausdruck der Vorlage unterscheidet die Fälle mit einer Fallunterscheidung“. Woran der Ausdruck die Fälle erkennt, steht nicht da. `Order.Status` hat keinen eigenen Wert für eine Order, die gerade aufgegeben wird (req-fach-019). Siehe auch H14. Für die Gestaltung der Testfälle ohne Bedeutung: Die Vorlage ist mitgeliefert, der Anwender verwendet nur eine Instanz.
- Fragen: Mit welchen Eingangswerten prüft die Regel nach der Ausführung? Woran unterscheidet der Ausdruck die Fälle?

### H17 – Fundstelle für den Objekttyp „Indikator“

- Fundstelle: Strategiedesigner req-ui-005, zweiter Satz; Fachmodell req-fach-013a; Glossar „Objekttyp“
- Sachverhalt: req-ui-005 verweist für „Ein vom Anwender angelegter Indikator hat den Objekttyp „Indikator““ auf req-fach-013a. Dort steht das nicht. req-fach-013a sagt nur: „Mitgelieferte Objekttypen (req-fach-054) verhalten sich wie Vorlagen.“ Das Glossar nennt „Indikator“ nicht unter den Beispielen für Objekttypen.
- Kritikpunkt: Die Festlegung steht nur im Strategiedesigner, der Verweis führt nicht zu ihr.

### H18 – Zahl der Durchläufe in `scope.md`

- Fundstelle: `scope.md`, Abschnitt „Stand“
- Sachverhalt: Der Text beginnt mit „Prüfschleife der Dokumente des Auftraggebers in drei Durchläufen“ und zählt danach vier Durchläufe auf.

---

## 4. Abbildbarkeit der Testfälle an den geänderten Stellen

| Testfall | Ergebnis | Hinderungsgrund |
|---|---|---|
| `str-01` | abbildbar | keiner |
| `str-03` | abbildbar | keiner |

Beide Testfälle lassen sich an den geänderten Stellen mit den beschriebenen Objekten und Arbeitsabläufen gestalten:

- Risikoregel als Regel der Strategie mit `Order.Preis` und `Order.Stop-Loss` bei „Order aufgeben“ im Hauptablauf: ohne Fehler der Konsistenzprüfung (req-fach-051, N7 erledigt).
- Prüfung des Mindestvolumens (`Instrument.Mindestvolumen`, Volumen der Order) als prüfende Regel bei „Order aufgeben“: zulässig (req-fach-049, req-fach-051).
- `str-01`: Preis der Stop-Order ist der berechnete Einstieg (req-fach-019, „vorgegebener Preis“). Die Risikoregel prüft bei „Order ändern“ mit `Order.Preis`, `Order.Stop-Loss`, `Order.Volumen` (req-core-002). `Strategie.wartende Orders` und `Strategie.offene Positionen` im Hauptablauf: `Strategie` ist in Ausdrücken verfügbar, ohne auf der Zeichenfläche zu liegen (req-fach-051). In der Verwaltung `Order.Stop-Loss` und `Order.Status` (req-fach-049a).
- `str-03`: Preis der Marktorder bis zur Ausführung der aktuelle Kurs (req-fach-019, req-fach-028). Die Risikoregel prüft bei „Position ändern“ mit `Position.Einstiegspreis`, `Position.Stop-Loss`, `Position.Volumen` (req-core-002). „Position schließen“ ohne Volumen, Risikoregel nicht angewendet, ohne Meldung (req-fach-046). In der Verwaltung `Order.Status`, `Position.Stop-Loss`, `Position.Richtung` (req-fach-049a, req-fach-051). Die Prüfung nach der Ausführung gehört zur Ausführung, nicht zum Ablauf (`str-03`, „Offene fachliche Fragen“).
- Die Eigenschaftenansicht der Strategie mit Strategieparametern und Regeln öffnet ein Klick auf die leere Zeichenfläche (req-ui-005). Dass `Strategie` nicht als Instanz auf die Zeichenfläche gelegt wird, hindert daher nicht.
- Keiner der beiden Testfälle verwendet eine Stop-Limit-Order. N8 betrifft sie nicht.

Speichern und Laden sind durch req-system-012, req-system-015, req-ui-009, req-ablauf-003 und req-ablauf-008 beschrieben. Diese Stellen sind in diesem Durchlauf nicht geändert. An den geänderten Stellen gibt es keinen Hinderungsgrund für Speichern oder Laden.

## 5. Zusammenfassung

| Art | Anzahl | blockierend |
|---|---|---|
| blockierende Befunde aus Durchlauf 4, erledigt | 1 (N7) | – |
| Hinweise aus Durchlauf 4 | 12 eingearbeitet (H1 mit neuem Fehler N8, H9 mit kleinem Restpunkt) | – |
| neue Befunde | 1 (N8) | ja |
| Hinweise | 6 (H13 bis H18) | nein |

Die Nachprüfung ist nicht bestanden. Grund ist N8. Laut `docs/technical/entwicklungsverfahren.md` geht der Bericht über den Softwarearchitekten an den Projektleiter. Die Grenze von drei Durchläufen dieser Prüfschleife ist überschritten. Ob über N8 der Auftraggeber entscheidet, liegt nicht bei der QA. Die Hinweise kann der Projektleiter bearbeiten oder verwerfen.
