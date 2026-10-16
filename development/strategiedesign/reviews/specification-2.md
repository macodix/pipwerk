# Prüfbericht Spezifikation, Durchlauf 2 (Nachprüfung)

- Vorhaben: `strategiedesign`
- Phase: 2 Konzeption, Prüfung der Spezifikation
- Rolle: QA
- geprüfter Commit: `73d9b210c54935652c007c2bc9ca219b1338dab3` (bei Beginn der Prüfung zugleich Stand von `origin/main`)
- Vergleichsstand: `f48d259fa257f5c1fb83f172f0e1cef44134319a` (Durchlauf 1)
- Prüfauftrag: `work/strategiedesign/architect/development/strategiedesign/reviews/specification-2-order.md`
- Gegenstand: `development/strategiedesign/specification.md`

## Ergebnis

**bestanden**

- B1 bis B4 sind erledigt.
- S1 bis S15 sind bearbeitet.
- Die geänderten Stellen enthalten keinen neuen blockierenden Befund.
- Es gibt sieben neue Hinweise (S16 bis S22). Sie verhindern das Bestehen nicht.
- Beide Testfälle lassen sich an den geänderten Stellen weiterhin vollständig gestalten, speichern und laden. Die Konsistenzprüfung meldet für sie keinen Fehler (Abschnitt 4 unten, mit der Einschränkung in S16).

Dies ist eine Nachprüfung nach „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`. Geprüft wurde, ob die Befunde behoben sind und ob die geänderten Stellen neue Fehler enthalten. Maßstab war `git diff f48d259fa257f5c1fb83f172f0e1cef44134319a 73d9b210c54935652c007c2bc9ca219b1338dab3 -- development/strategiedesign/specification.md`. Nur blockierende Befunde verhindern das Bestehen.

## 1. Geprüfte Unterlagen

- `development/strategiedesign/specification.md` (Stand des geprüften Commits) und der Diff gegen den Vergleichsstand
- `development/strategiedesign/scope.md`, `development/strategiedesign/reviews/specification-1.md`
- `docs/design/domain/fachmodell.md`, `docs/design/domain/indikator-markttechnik.md`
- `docs/design/requirements/anforderungen-strategiedesigner.md` (Abschnitte 4 bis 7)
- `docs/design/strategies/str-01-fachlich-scalping-punkt-2-ausbruch-einfach.md`, `docs/design/strategies/str-03-fachlich-ema-trendfolge.md`
- `docs/technical/glossar.md`, `docs/technical/pipwerk-studio.md` (Abschnitte 2.1, 8, 9), nur für S13
- `development/strategiedesign/reviews/requirements-7.md` (H23, H24), nur für S1

Wie im Auftrag festgelegt, wurden nicht geprüft: die Ausführung von Strategien, die in `scope.md` und den Dokumenten als offen gekennzeichneten Punkte, die Vorlagen unter `docs/design/planning/`, die Frage, ob die Prüfschleife eine Ebene höher geht.

---

## 2. Blockierende Befunde aus Durchlauf 1

| Befund | Ergebnis | Nachweis |
|---|---|---|
| B1 Regelvorlage „Risiko je Trade“: Betrag des Abstands und Division durch null | erledigt | Abschnitt 3.5 |
| B2 Wirkung von Fehler und „leer“ außerhalb von Regeln | erledigt | Abschnitt 3.4, Abschnitt 10 Punkt 8 |
| B3 Eigenschaften enthaltener Indikatoren | erledigt | Abschnitt 3.3, Abschnitt 10 Punkt 7 |
| B4 Indikator aus Regeln | erledigt | Abschnitt 3.3, Tabelle der Vorlagen |

### B1 – erledigt

- Der Ausdruck nimmt jetzt den Abstand in Verlustrichtung (`A_Order`, `A_Position`), nicht mehr den Betrag. Ist der Abstand kleiner oder gleich null, liefert er das vorhandene Volumen. Er teilt dann nicht.
- Nachgerechnet mit dem Beispiel aus Durchlauf 1 (Kauf, Einstiegspreis 1,1000):
  - Stop-Loss 1,1000: `A_Position` = 0. Ergebnis `Position.Volumen`. Vergleich `höchstens` ist erfüllt. Keine Division.
  - Stop-Loss 1,1060: `A_Position` = −0,0060. Ergebnis `Position.Volumen`. Die Prüfung ist erfüllt. Das Nachziehen in `str-03` geht weiter.
  - Verkauf, Einstiegspreis 1,1000, Stop-Loss auf 1,0950 nachgezogen: `A_Position` = −0,0050. Die Prüfung ist erfüllt.
- Weitere Fälle nachgerechnet:
  - Schließorder: Die Regel wird auf eine Order angewendet. `Position` ist dann „nicht verfügbar“ (Abschnitt 3.4). `ISNA(Position.Volumen)` ist wahr. `Order.Richtung` hat die `CloseOrder` nicht (Fachmodell req-fach-032). Das Ergebnis ist „nicht verfügbar“, die Regel wird nicht angewendet. Das entspricht req-fach-046 und req-core-002.
  - Marktorder: `Order.Limitpreis` ist „nicht verfügbar“, `IFNA` nimmt `Order.Preis`. Stop-Limit-Order: gerechnet wird mit `Order.Limitpreis`.
  - Ohne Stop-Loss: Die Rechnung mit „leer“ ist ein Fehler. Das Volumen ist nicht bestimmbar beziehungsweise die Prüfung nicht erfüllt. Das entspricht der Tabelle in Abschnitt 3.5 und Abschnitt 10 Punkt 5.
  - „Order aufgeben“ mit Stop-Loss auf der Gewinnseite: Das Ergebnis ist das noch leere Volumen. Die Regel kann nicht bestimmen, der Ausgang ist `nicht gestellt`. Abschnitt 3.5 nennt das ausdrücklich.
- Alle Namen im Ausdruck sind im Zusammenhang „Regel“ bekannt: `Order.Richtung`, `Order.Preis`, `Order.Limitpreis`, `Order.Stop_Loss`, `Order.Volumen` (req-fach-019, req-fach-028, req-fach-029), `Position.Richtung`, `Position.Einstiegspreis`, `Position.Stop_Loss`, `Position.Volumen` (req-fach-052), `Konto.Kapital`, `Instrument.Tickgroesse`, `Instrument.Tickwert`, `Instrument.Volumenschritt` (req-fach-051).

### B2 – erledigt

- Abschnitt 3.4 legt jetzt in einer Tabelle die Wirkung für jede Stelle fest: Regel, Bedingung, Berechnung, Belegung bei den vier Elementen für Orders und Positionen, „Parameter setzen“ und eigene Eigenschaft eines Indikators oder Trends. Die Division durch null und die übrigen Fehlerwerte von OpenFormula sind als Fehler genannt.
- Die Fälle aus Durchlauf 1 haben jetzt eine Bedeutung:
  - `str-01`, erste Bedingung, ohne Trend: Der Vergleich mit „leer“ ist ein Fehler. Die Bedingung nimmt `falsch`. Es wird kein Trade geplant.
  - `str-01`, Verwaltung beim Tick, `punkt_13` „leer“: Die Bedingung nimmt `falsch`. Die Order wird nicht gelöscht.
- Die Festlegung steht als Punkt 8 in Abschnitt 10 zur Bestätigung durch den Auftraggeber. Die Folge für `str-01` ist dort genannt.

### B3 – erledigt

- Eigenschaften enthaltener Indikatoren sind jetzt über die Struktur des umgebenden Objekts ansprechbar, mehrstufig, zum Beispiel `trend_h1.ema20.Wert`. Sie bleiben Eigenschaften des Indikators. Das entspricht req-fach-012 („bleiben dem jeweiligen Indikator zugeordnet“, „über die Struktur des Trendobjekts … referenzierbar“).
- Die Schreibweise füllt den offenen Punkt aus req-fach-012. Sie steht als Punkt 7 in Abschnitt 10 zur Bestätigung.

### B4 – erledigt

- Die Vorlage `Indikator` enthält jetzt Regeln und Regelwerke als Instanzen. Ein Ausdruck einer eigenen Eigenschaft kann `regel.Ergebnis` verwenden. Damit ist ein Indikator aus Regeln, aus fest programmierten Einheiten oder aus beidem abbildbar (req-fach-013a).
- Das Verfahren „Ausdruck“ des Trends erhält dieselben Möglichkeiten.

---

## 3. Hinweise aus Durchlauf 1

| Hinweis | Ergebnis | Fundstelle der Bearbeitung |
|---|---|---|
| S1 H24 nur für den Hauptablauf | bearbeitet | 3.4: `Position` in der Verwaltung vor der Ausführung „nicht verfügbar“; Regel wird im Zusammenhang des verwendenden Ausdrucks ausgewertet, auch in einer anderen Regel (req-fach-038); in der Verwaltung sieht sie deren Order und Position; Verwendung in Indikator und Trend ist ein Fehler |
| S2 Inhalt einer Instanz | bearbeitet | 3.3, Absatz „Instanz“: gesamter Inhalt der Vorlage, Vorlage zur Ausführung nicht nötig |
| S3 Namen in Ausdrücken von Vorlagen | bearbeitet | 3.3, Absatz „Namensräume“; 3.4, Punkt „Namen“; 3.1, Bindungsart „Parameter“ mit Parameter der Vorlage |
| S4 Parameter je Berechnungsverfahren | bearbeitet | 3.1, Feld „Parameter“ (Gültigkeit abhängig von einem anderen Parameter); 3.3, Zeile `Trend` |
| S5 Bedienung beim Bearbeiten einer Vorlage | bearbeitet | 5.2, Zeilen „Objekt anlegen, öffnen, ändern“ und „Löschen“ |
| S6 Inhalt der Elementbibliothek | bearbeitet | 5.1, Zeile „links“: Auslöser und Objekte der Anwendung `Konto`, `Instrument`, `Kerze`, `Tick` (entspricht req-fach-051 und req-ablauf-003) |
| S7 Voraussetzungen für null Fehler | bearbeitet | 3.1: `Instrument`, `Konto`, `Order-ID`, `Status`, `Strategie-ID` belegt die Anwendung; Text mit der Kennung eines Werts belegt eine Auswahl. Siehe S16 |
| S8 Namen von Regeln in Regelwerken | bearbeitet | 3.3, Absatz „Namensräume“ (`regelwerk.regel`, zwei Instanzen in zwei Namensräumen); 3.6, Zeile „Name doppelt vergeben“. Siehe S17 |
| S9 Bindungsart „Regel“ | bearbeitet | 3.1: keine eigene Bindungsart, ein Weg, Reihenfolge nach req-fach-046 |
| S10 Prüfung der Rückführung | bearbeitet | 3.6: Kreis ohne Bedingung mit einem Ausgang aus dem Kreis oder ohne Fortsetzung |
| S11 Verschieben des Objektverzeichnisses | bearbeitet | 4.1: Rückholen bei Fehler, Meldung mit beiden Verzeichnissen, offene Strategie bleibt offen. Entspricht req-ablauf-009 |
| S12 Bildungsregel der Kennungen | bearbeitet | 3.1: „andere Zeichen entfallen“, „Punkt 1/3“ ergibt `punkt_13` |
| S13 Dokumentation | bearbeitet | 9: Ausdruckssprache und Befunde in der Anwenderdokumentation, Berichtigung der vier Glossareinträge, Alembic in Abschnitt 2.1. Siehe S22 |
| S14 Folgen der fachlichen Festlegung | bearbeitet | 10, Absatz „Folgen der fachlichen Festlegungen“ |
| S15 Element mit unbekanntem Typ | bearbeitet | 3.7, zweiter Absatz. Siehe S20 |

---

## 4. Abbildbarkeit der Testfälle an den geänderten Stellen (Prüfpunkt 4)

| Testfall | gestalten | speichern | laden | Konsistenzprüfung ohne Fehler |
|---|---|---|---|---|
| `str-01` | ja | ja | ja | ja |
| `str-03` | ja | ja | ja | ja, wenn die Typbeschreibung der `MarketOrder` den `Preis` als nicht vom Anwender belegt führt (S16) |

Geprüft wurden die geänderten Stellen gegen Abschnitt 6 der Spezifikation und die Testfälle:

- Namensräume (3.3): Alle Namen der Testfälle stehen im Namensraum der Strategie: Instanzen, Berechnungen, Strategieparameter und die Regel `risiko`. Die Regel des Elements `mindestvolumen` spricht nur Objekte der Anwendung an. Keine Kurzform in Abschnitt 6 vergibt einen Namen doppelt. Die Namen der Bedingungen legt der Auftrag fest.
- Bindungsart „Parameter“ (3.1): Die Zeiteinheiten der Instanzen und Auslöser aus Strategieparametern sind abbildbar.
- Wegfall der Bindungsart „Regel“ (3.1): Das Volumen bestimmt `risiko` als Regel der Strategie. Die MUSS-Eigenschaft `Volumen` ist damit kein Fehler (3.6).
- Belegung einer Auswahl mit Text (3.1): `IF(…; "buy"; "sell")` in `str-01` und `richtung.Ergebnis` in `str-03` ergeben keinen Fehler „unpassender Typ“. `"buy"` und `"sell"` sind die Werte der Richtung (req-fach-028, req-fach-029).
- Von der Anwendung belegte Eigenschaften (3.1): `Instrument` und `Konto` sind kein Fehler mehr, obwohl Abschnitt 6 sie nicht belegt. Zum `Preis` der Marktorder siehe S16.
- Kennungen (3.1): `punkt_13`, `trend_intakt`, `aufwaerts`, `ausgefuehrt`, `stop_loss` folgen der neuen Regel.
- Neuer Ausdruck „Risiko je Trade“ (3.5): ohne Fehler in beiden Testfällen (Abschnitt 2, B1).
- Rückführung (3.6): Keiner der Testfälle hat einen Kreis im Ablauf.
- Wirkungstabelle (3.4) und Abschnitt 10 Punkt 8: Sie ändern nur die Bedeutung bei der Ausführung, nicht Gestaltung, Speichern und Laden. Beobachtung ohne eigenen Hinweis: `str-01` Abschnitt 6 sagt „Durchbricht der Kurs den letzten Punkt 1/3 … Die Order wird gelöscht.“ Ob Punkt 1/3 in diesem Moment noch belegt ist, hängt an der Bestimmung von Trend und Punkten in `indikator-markttechnik.md` Abschnitt 4. Diese ist nach `scope.md` offen. Abschnitt 10 Punkt 8 legt die Folge dem Auftraggeber vor.
- Speichern und Laden: Abschnitt 3.7 ist nur um das Verhalten bei unbekanntem Typ ergänzt. Dokumentformat, Schemata und Rundweg sind unverändert.

---

## 5. Neue Befunde

Keine blockierenden Befunde.

## 6. Neue Hinweise (nicht blockierend)

### S16 – Von der Anwendung belegte Eigenschaften: Preis der Marktorder und Position der Schließorder fehlen

- Fundstelle: Spezifikation Abschnitt 3.1, Zeile „Eigenschaften“ („`Instrument`, `Konto`, `Order-ID`, `Status` und `Strategie-ID` belegt die Anwendung, nicht der Anwender“), Abschnitt 3.6, Zeile „MUSS-Eigenschaft der Order, die der Anwender belegt“. Bezug: Fachmodell req-fach-019 (`Preis` MUSS; „Bei `MarketOrder` und `CloseOrder` wird er nicht vorgegeben“), req-fach-028, req-fach-032 (`Position` MUSS bei `CloseOrder`), Testfall `str-03` Abschnitt 3.
- Sachverhalt: Die neue Aufzählung nennt fünf Eigenschaften. Sie sagt nicht, ob sie vollständig ist. Es fehlen der `Preis` bei `MarketOrder` und `CloseOrder` und die `Position` der `CloseOrder`. Liest ein Auftrag die Aufzählung als vollständig, ist der `Preis` der Marktorder eine MUSS-Eigenschaft, die der Anwender belegt. Abschnitt 6 belegt ihn für `str-03` nicht. Dann meldet die Konsistenzprüfung für `str-03` einen Fehler. Das Feld „ob der Anwender sie belegt“ je Ordertyp und req-fach-028 lassen die richtige Lesart zu. Deshalb ist der Punkt nicht blockierend.
- Frage: Ist die Aufzählung abschließend? Wenn nicht: Wo steht, dass der Preis bei Marktorder und Schließorder und die Position der Schließorder nicht vom Anwender belegt werden?

### S17 – Namensräume der Regeln eines Elements und der Regeln in einer Vorlage

- Fundstelle: Spezifikation Abschnitt 3.3, Absatz „Namensräume“; Abschnitt 3.4, Punkt „Namen“ und Absatz nach der Tabelle „Zusammenhang“ („Spricht der Ausdruck einer Vorlage einen Namen an, … geprüft wird der Name in jeder Strategie, die die Regel enthält“). Bezug: req-fach-036, req-fach-038, req-fach-040, req-fach-013a.
- Sachverhalt:
  - Die Regeln eines Elements sind „nur in den Ausdrücken der Regeln dieses Elements“ ansprechbar. Offen ist, ob diese Ausdrücke auch die Regeln der Strategie sehen. Haben eine Regel der Strategie und eine Regel des Elements denselben Namen, ist offen, welche gemeint ist und ob das ein Fehler „Name doppelt vergeben“ ist. Abschnitt 3.3 erlaubt das ausdrücklich („zwei Instanzen in zwei Namensräumen“).
  - Eine Regel in einer Vorlage `Indikator` oder `Trend`: Offen ist, ob ihr Ausdruck die eigenen Parameter und enthaltenen Instanzen der Vorlage sieht. Beide stehen ohne Punkt beziehungsweise mit ihrem Namen, ebenso die Parameter der Regel. Gleiche Namen sind dann nicht unterscheidbar. Nach Abschnitt 3.4 wird ein unbekannter Name einer Regel „in jeder Strategie“ geprüft. Die Namen einer Vorlage stehen aber nicht im Namensraum der Strategie.
- Die Testfälle sind nicht betroffen.
- Frage: Welche Namen sieht der Ausdruck einer Regel eines Elements und einer Regel in einer Vorlage, und was gilt bei gleichen Namen?

### S18 – Typprüfung einer Regel, deren Ergebnis die Verwaltung verwendet

- Fundstelle: Spezifikation Abschnitt 3.4, Tabelle „Zusammenhang“ und Satz „Eine Regel, deren Ergebnis ein anderer Ausdruck verwendet, wird im Zusammenhang dieses Ausdrucks ausgewertet“.
- Sachverhalt: Eine Regel wird gegen „Eigenschaften aller Ordertypen“ geprüft. Ein Ausdruck der Verwaltung kennt nur die Eigenschaften „des Ordertyps dieses ‚Order aufgeben‘“. Beispiel: Ein Ausdruck in der Verwaltung einer Stop-Order verwendet `risiko.Ergebnis`. `risiko` spricht `Order.Limitpreis` an. Offen ist, ob die Konsistenzprüfung das als „unbekannte Eigenschaft“ meldet oder ob der Wert bei der Ausführung „nicht verfügbar“ ist (Abschnitt 3.4, erster Punkt zu fehlenden Werten). Die Testfälle verwenden kein Regelergebnis in der Verwaltung.
- Frage: Gilt der neue Satz nur für die Auswertung oder auch für die Typprüfung?

### S19 – Eingabehilfe bei mehrstufigen Namen

- Fundstelle: Spezifikation Abschnitt 5.3, Punkt „Ausdruckseingabe“ (unverändert), gegen die geänderten Abschnitte 3.3 (`trend_h1.ema20.Wert`, `regelwerk.regel`) und 3.4 („mehrstufig“). Bezug: req-ui-013.
- Sachverhalt: Die Eingabehilfe bietet nach Name und Punkt „die Eigenschaften dieses Objekts“ an. Nach `trend_h1.` braucht der Anwender auch die enthaltenen Instanzen, nach dem Namen eines Regelwerks dessen Regeln. Das steht nicht da. req-ui-013 verlangt nur die Eigenschaften. Ein Widerspruch zur Anforderung ist es daher nicht.
- Frage: Bietet die Eingabehilfe auch enthaltene Instanzen und Regeln an?

### S20 – Element mit unbekanntem Typ „verbinden“

- Fundstelle: Spezifikation Abschnitt 3.7, zweiter Absatz („es lässt sich verschieben, verbinden und löschen“), gegen Abschnitt 3.1, Feld „Ausgänge“.
- Sachverhalt: Die Ausgänge eines Elements stehen in seiner Typbeschreibung. Ein Element mit unbekanntem Typ hat keine. Offen ist, ob es nur als Ziel verbunden werden kann. Ebenso offen ist, wie die Oberfläche die gespeicherten Verbindungen von seinen Ausgängen zeigt.
- Frage: Welche Anschlüsse zeigt ein Element ohne Typbeschreibung?

### S21 – Wirkungstabelle: Belegung von Parametern und Gesamtergebnis eines Regelwerks

- Fundstelle: Spezifikation Abschnitt 3.4, Tabelle „Wirkung bei der Ausführung“; Abschnitt 3.1, Bindungsart „Ausdruck“; Abschnitt 3.3, Zeile `Regelwerk` („optional ein Ausdruck für das Gesamtergebnis“). Bezug: req-fach-046 letzter Absatz, req-fach-043.
- Sachverhalt: Die Tabelle nennt die Belegung von Eigenschaften der Order. Ein Parameter einer Instanz oder eines Auslösers kann ebenfalls mit einem Ausdruck belegt werden (3.1, req-fach-046), zum Beispiel die Periode eines EMA. Für diesen Fall und für den Ausdruck des Gesamtergebnisses eines Regelwerks steht keine Wirkung da. Die Testfälle belegen Parameter nur mit festen Werten und Strategieparametern und verwenden kein Gesamtergebnis.
- Frage: Was bewirkt ein Fehler, „leer“ oder „nicht verfügbar“ in diesen beiden Fällen?

### S22 – Technische Dokumentation: weitere Stellen zu Alembic und Web-API

- Fundstelle: Spezifikation Abschnitt 9, erster Punkt. Bezug: `docs/technical/pipwerk-studio.md` Abschnitt 9 „Bekannte Einschränkungen“ („Alembic wird nicht eingesetzt …“, „Die öffentliche Web-API und ihre Versionierung sind nicht festgelegt“) und Abschnitt 8 („Das Backend enthält eine schreibende Funktion: das Speichern der Oberflächensprache“).
- Sachverhalt: Abschnitt 9 der Spezifikation nennt nur die Aussage in Abschnitt 2.1. Die Aussagen in Abschnitt 8 und 9 der technischen Dokumentation werden mit dem Vorhaben ebenfalls falsch.
- Kritikpunkt: Die Liste der zu berichtigenden Stellen ist unvollständig. Die einzelnen Stellen kann auch der Auftrag festlegen.

---

## 7. Zusammenfassung

| Art | Anzahl | Ergebnis |
|---|---|---|
| blockierende Befunde aus Durchlauf 1 | 4 (B1 bis B4) | alle erledigt |
| Hinweise aus Durchlauf 1 | 15 (S1 bis S15) | alle bearbeitet |
| neue blockierende Befunde | 0 | – |
| neue Hinweise | 7 (S16 bis S22) | nicht blockierend |

Die Nachprüfung ist bestanden. Die neuen Hinweise werden nach „Umfang der Prüfungen“ bei der nächsten passenden Gelegenheit erledigt oder verworfen. S16 betrifft die Konsistenzprüfung von `str-03` und sollte spätestens im Auftrag zur Typbeschreibung der Ordertypen beantwortet sein.
