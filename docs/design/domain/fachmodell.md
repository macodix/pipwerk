# Fachmodell des Trading-Systems

## Dokumentstatus

- status: `draft`
- zweck: Gemeinsame, wiederverwendbare fachliche Begriffe, Objekte und Zusammenhänge für Strategiedesigner und Handelssystem
- zuletzt aktualisiert: `2026-10-19`
- abgestimmt: [Präsentation Fachmodell: Orders und Regelwerke](praesentation-fachmodell.html), bestätigt vom Auftraggeber im Chat am 14. Oktober 2026. Entscheidungen zu den Befunden der QA im Vorhaben `strategiedesign`: [Präsentation Prüfung der Dokumente](../../../development/strategiedesign/presentations/requirements-1.html), bestätigt vom Auftraggeber im Chat am 15. Oktober 2026.

## 1. Zweck und Abgrenzung

Dieses Dokument beschreibt das gemeinsame fachliche Modell. Es enthält keine GUI-Anforderungen des Strategiedesigners und keine Infrastruktur- oder Laufzeitanforderungen des Handelssystems. Bestehende Anforderungs-IDs werden zur Nachvollziehbarkeit beibehalten.

## 2. Objekte und Zusammenhänge

### req-fach-010 -- Objekt Trend

Das Objekt `Trend` beschreibt die Richtung einer Entwicklung innerhalb einer bestimmten Zeiteinheit.

`Trend` besitzt mindestens folgende Eigenschaften:

-   `Richtung` -- vom Berechnungsverfahren ermittelte Eigenschaft,
-   `Zeiteinheit` -- bezeichnet die betrachtete Zeitreihe beziehungsweise den Chart und damit den zeitlichen Geltungsbereich der Trendaussage,
-   `Berechnungsverfahren` -- bestimmt, wie die Trendrichtung ermittelt wird.

Ein eigener `Betrachtungshorizont` ist keine allgemeine Eigenschaft des Trends. Benötigte Perioden, Zeitspannen oder Mindestdauern gehören zu dem Berechnungsverfahren beziehungsweise zu den darin verwendeten Indikatoren.

Der Trend ist nicht an ein bestimmtes Berechnungsverfahren oder einen bestimmten Indikator gebunden.

### req-fach-011 -- Berechnungsverfahren und Indikatoren eines Trends

Das Berechnungsverfahren eines Trends verwendet einen oder mehrere Indikatoren. Bei mehreren Indikatoren kann das Berechnungsverfahren deren Eigenschaften nach einer geeigneten Verknüpfungsregel zusammenführen. Dazu können insbesondere Übereinstimmung, alternative Erfüllung, Mehrheitsentscheidung, Gewichtung beziehungsweise Priorisierung oder eine eigene Berechnung gehören. Diese Aufzählung ist nicht abschließend.

Das Berechnungsverfahren und seine Indikatoren bestimmen, welche Daten beziehungsweise Wertreihen für die Trendbestimmung benötigt werden. Der Objekttyp `Trend` legt diese Eingangsdaten nicht allgemein fest.

Die Zeiteinheit ist eine Vorgabe des Trends und kann die Auswahl beziehungsweise Parametrisierung des Berechnungsverfahrens und seiner Indikatoren beeinflussen.

### req-fach-012 -- Weitere Eigenschaften verwendeter Indikatoren

Indikatoren eines Trend-Berechnungsverfahrens können neben den für die Trendrichtung benötigten Eigenschaften weitere Eigenschaften bereitstellen. Diese Eigenschaften bleiben dem jeweiligen Indikator zugeordnet und werden nicht zu Eigenschaften des Trends.

Sie müssen jedoch über die Struktur des Trendobjekts für andere Elemente referenzierbar sein. In Ausdrücken werden Eigenschaften nach req-fach-036 angesprochen. Wie eine Eigenschaft eines Indikators über den Trend angesprochen wird, ist noch nicht festgelegt.

### req-fach-013 -- Indikatoren als Objekte

Indikatoren werden als eigenständige Objekte behandelt. Sie besitzen eigene Parameter und stellen definierte Eigenschaften bereit, die in Berechnungsverfahren und Bedingungen verwendet werden können.

Bedingungen vergleichen konkrete Eigenschaften von Objekten. Ein Indikator mit nur einer fachlich relevanten berechneten Eigenschaft kann in der Benutzeroberfläche vereinfacht dargestellt werden.

### req-fach-013a -- Aufbau und Wiederverwendung von Indikatoren und Trends

Ein Indikator kann aus fest programmierten Einheiten, aus Regeln oder aus einer Kombination von beidem bestehen. Für die Verwendung in Strategien ist das nicht unterscheidbar: Jeder Indikator beschreibt seine Parameter und berechneten Eigenschaften auf dieselbe Weise.

Ein gespeicherter Indikator, Trend, eine gespeicherte Regel oder ein gespeichertes Regelwerk ist eine `Vorlage`. Fügt der Anwender eine Vorlage in eine Strategie ein, entsteht in der Strategie eine `Instanz`: ein eigenes Objekt mit einem in der Strategie vergebenen Namen (zum Beispiel `EMA21`), das die Werte der Vorlage übernimmt und danach nur dieser Strategie gehört. Änderungen an der Instanz wirken nur in dieser Strategie, Änderungen an der Vorlage wirken nicht auf bestehende Instanzen. Eine Instanz kann als neue Vorlage gespeichert werden. Jede Instanz nennt ihre Herkunft: die Vorlage, aus der sie entstanden ist, und ihren Objekttyp.

Mitgelieferte Objekttypen (req-fach-054) verhalten sich wie Vorlagen. Ein vom Anwender angelegter Indikator hat den Objekttyp `Indikator`, ein vom Anwender angelegter Trend den Objekttyp `Trend`.

### req-fach-014 -- Zustandswechsel als Bedingung

Ein Zustandswechsel wie „Trendrichtung wechselt zu Aufwärts“ ist kein eigenes Objekt, sondern eine Bedingung auf dem Zustand beziehungsweise einer Eigenschaft eines Objekts. Zur Auswertung eines Zustandswechsels müssen vorheriger und aktueller Zustand über Auswertungszyklen hinweg verfügbar sein. In Ausdrücken liefert die Funktion `VORHER` (gespeichert `PREVIOUS`) den Wert einer Eigenschaft bei einer früheren Auswertung: `VORHER(EMA_schnell.Wert)` ist der Wert bei der vorherigen Auswertung, `VORHER(EMA_schnell.Wert; 2)` der Wert zwei Auswertungen zurück (req-fach-036). Offen: ob sich `VORHER` bei einer Strategie mit mehreren Auslösern auf die vorherige Auswertung desselben Auslösers bezieht, und ob Verwaltung und Hauptablauf beim selben Auslöser eine oder zwei Auswertungen sind. Die Frage betrifft die Ausführung und wird vor der Beschreibung des Strategietesters geklärt.

### req-fach-016 -- Strategieentscheidung und Order getrennt

Eine Strategie erzeugt nicht selbst unmittelbar eine konkrete Order. Wenn ihr Ablauf nach Auswertung der erforderlichen Bedingungen eine Order veranlassen soll, erreicht er das Element `Order aufgeben`. Dieses legt Ordertyp und Eigenschaften der Order fest und übergibt die Order an das Handelssystem. Ein zusätzliches Objekt `Signal` wird dafür derzeit nicht benötigt.

Erstellung, Bestimmung und Prüfung einer konkreten Order richten sich nach dem fachlichen Ordermodell. Freigegebene Orders werden anschließend zur weiteren Verwaltung an den `OrderManager` übergeben.

Eine aktive beziehungsweise beim Broker angenommene Order bedeutet noch nicht, dass eine Position besteht. Eine Position entsteht durch Ausführung. Die Ausführung einer Order erzeugt eine `Position` (req-fach-052) als eigenes Objekt, die Order wird nicht zur Position und behält ihren Status. Bei Teilausführung können gleichzeitig eine Position und ein noch offener Rest der Order bestehen.

### req-fach-017 -- Informationsquellen des Orderablaufs

Die für Handelbarkeitsprüfung und Orderbestimmung benötigten Informationen stammen aus unterschiedlichen fachlichen Quellen und sind nicht pauschal Eigenschaften des Orderablaufs. Dazu gehören insbesondere die im Strategieablauf bestimmte Order-Konfiguration, Strategie beziehungsweise Strategieanwendung, Marktdaten, Konto, Risiko- und Orderregeln, Instrument sowie Broker- beziehungsweise Marginbedingungen.

Der Orderablauf muss diese Informationen verwenden beziehungsweise zusammenführen können. Konto, Instrument, Kerze und Tick sind Objekte der Anwendung nach req-fach-051.

### req-fach-018 -- Allgemeines Objekt Order

`Order` ist ein allgemeines Objekt für einen Auftrag an ein Handelskonto beziehungsweise dessen Broker.

Eine Order besteht von ihrer Erstellung bis zum Erreichen eines endgültigen Zustands. Dies gilt auch für Pending Orders, die über längere Zeit auf ihre Ausführung warten können. Ein endgültiger Zustand kann insbesondere durch Ausführung, Ablehnung, Stornierung oder Ablauf erreicht werden.

Das allgemeine Objekt `Order` enthält nur Eigenschaften und Verhalten, die für alle spezialisierten Ordertypen gemeinsam gelten.

### req-fach-019 -- Allgemeine Eigenschaften einer Order

Das allgemeine Objekt `Order` besitzt folgende Eigenschaften:

- `Order-ID` -- MUSS; interne eindeutige Identifikation unabhängig von einer gegebenenfalls durch Broker oder Handelskonto vergebenen ID.
- `Status` -- MUSS; aktueller Zustand der Order mit den Werten `wartend`, `teilausgeführt`, `ausgeführt`, `gelöscht`, `abgelaufen`, `abgelehnt`.
- `Konto` -- MUSS; das Handelskonto, an das die konkrete Order gerichtet ist. Eine konkrete Order kann nicht ohne Kontozuordnung zur Ausführung freigegeben werden.
- `Strategie-ID` -- KANN; Zuordnung zur verursachenden Strategie.
- `Bemerkung` -- KANN; freie zusätzliche Information.
- `geltende Regeln` -- 0..n; die für die Order geltenden Regeln werden der Order übergeben.
- `Preis` -- MUSS; bei den wartenden Ordertypen der vorgegebene Preis nach req-fach-029 (bei der `StopLimitOrder` der Auslösepreis, der `Limitpreis` ist dort eine zusätzliche Eigenschaft). Bei `MarketOrder` und `CloseOrder` wird er nicht vorgegeben: bis zur Ausführung der angenommene Preis, das ist der aktuelle Kurs in Handelsrichtung der Order (`Tick.Brief` bei `buy`, `Tick.Geld` bei `sell`; bei der `CloseOrder` die Gegenrichtung der Position), ab der Ausführung der Ausführungspreis (req-fach-028).

Weitere Eigenschaften werden nur dann in `Order` aufgenommen, wenn sie tatsächlich für alle spezialisierten Ordertypen gemeinsam benötigt werden.

### req-fach-020 -- Regeln für Orders

Konkrete Regeln sind nicht Bestandteil der Definition eines Ordertyps. Die für eine Order geltenden Regeln werden der Order übergeben.

Für Orders kann das allgemeine Objekt `Regel` mit seinen Methoden `prüfen()` und `bestimmen()` verwendet werden:

- `prüfen()` prüft einen fachlichen Sachverhalt und liefert ein eindeutig auswertbares Prüfergebnis.
- `bestimmen()` liefert einen definierten Wert für eine Order-Eigenschaft. Der Rückgabewert muss zu der Eigenschaft passen, deren Wert bestimmt werden soll.

Eine Order-Eigenschaft kann ihren Wert direkt erhalten oder durch eine ihr zugeordnete Regel mittels `bestimmen()` bestimmen lassen. Für Prüfungen kann eine Regel mittels `prüfen()` verwendet werden. Dieselbe Regel kann beides: Sie bestimmt eine Eigenschaft, solange diese änderbar ist, und prüft sie, wenn sie nicht mehr änderbar ist, zum Beispiel das Volumen einer wartenden Order bei `Order ändern` (req-fach-049a). Unterschiedliche spezialisierte Regeltypen werden derzeit nicht vorausgesetzt.

### req-fach-021 -- Bestimmung und Prüfung konkreter Orders

Das jeweilige konkrete Orderobjekt ist nach seiner Erstellung für die Bestimmung seiner noch zu bestimmenden Eigenschaften, seine Prüfung und seine Freigabe verantwortlich.

Dabei muss es:

1. direkt übergebene Eigenschaftswerte übernehmen können,
2. über Regeln mittels `bestimmen()` festgelegte Eigenschaftswerte bestimmen können,
3. die Vollständigkeit der für den konkreten Ordertyp erforderlichen Eigenschaften prüfen,
4. die geltenden Regeln mittels `prüfen()` ausführen und deren Ergebnisse auswerten,
5. die Order nur dann zur weiteren Ausführung freigeben, wenn die erforderlichen Eigenschaften bestimmt und die erforderlichen Prüfungen erfolgreich sind.

Kann eine erforderliche Eigenschaft nicht bestimmt werden oder ergibt eine erforderliche Prüfung mittels `prüfen()` kein positives Ergebnis, wird die Order nicht zur Ausführung freigegeben.

Wurde eine `MarketOrder` mit einem angenommenen Preis freigegeben (req-fach-028), werden die prüfenden Regeln nach der Ausführung erneut angewendet, auf die entstandene Position (req-fach-052) mit ihrem Einstiegspreis. Offen: welche Maßnahme bei einem negativen Ergebnis folgt. Betrifft die Ausführung.

### req-fach-023 -- Spezialisierung nach Ordertyp

Konkrete Ordertypen werden als Spezialisierungen des allgemeinen Objekts `Order` modelliert:

`Order -> <Ordertyp>Order`

Ein spezialisiertes Orderobjekt definiert die für seinen Ordertyp zusätzlich erforderlichen Eigenschaften und das entsprechende Verhalten. Diese Eigenschaften können ebenfalls direkt gesetzt oder durch Regeln mittels `bestimmen()` bestimmt werden und durch Regeln mittels `prüfen()` geprüft werden.

### req-fach-024 -- Erweiterbare Ordertypen

Die verfügbaren Ordertypen dürfen nicht als abgeschlossene Liste im allgemeinen Objekt `Order` festgeschrieben werden.

Ein zusätzlicher Ordertyp wird als zusätzliches spezialisiertes Orderobjekt ergänzt. Bestehende Ordertypen sollen dafür nicht geändert werden müssen.

### req-fach-025 -- Ordertypen der ersten Entwicklungsphase

Die erste Entwicklungsphase beschränkt die unterstützten Ordertypen auf Ordertypen, deren Bedeutung den Standard-Ordertypen von MetaTrader 5 (MT5) entspricht.

Ob ein Ordertyp für ein bestimmtes Handelskonto beziehungsweise Instrument tatsächlich verfügbar ist, wird nach req-fach-030 geprüft.

Anbindungen weiterer Handelssoftware sind nicht Bestandteil dieser ersten Entwicklungsphase.

### req-fach-028 -- MarketOrder

`MarketOrder` (Marktorder) ist ein spezialisierter Ordertyp für einen Auftrag zur Ausführung zum aktuell verfügbaren Marktpreis.

Zusätzlich zu den allgemeinen Eigenschaften von `Order` besitzt `MarketOrder`:

- `Instrument` -- MUSS; das zu handelnde Instrument.
- `Richtung` -- MUSS; `buy` oder `sell`.
- `Volumen` -- MUSS; die zu handelnde Menge.
- `Stop-Loss` -- KANN.
- `Take-Profit` -- KANN.

Der `Preis` (req-fach-019) wird bei der `MarketOrder` nicht vorgegeben: bis zur Ausführung der angenommene Preis, ab der Ausführung der Ausführungspreis. Regeln rechnen mit diesem Preis (Anforderungen Strategiedesigner req-core-002).

### req-fach-029 -- Wartende Ordertypen

Als Spezialisierungen von `Order` werden drei wartende Ordertypen geführt. Ihre Bedeutung entspricht den Pending-Ordertypen von MetaTrader 5. Wie bei `MarketOrder` ist die Handelsrichtung eine Eigenschaft und nicht Bestandteil des Typs.

| Ordertyp | Bedeutung | zusätzliche Eigenschaften |
|---|---|---|
| `StopOrder` (Stop-Order) | Ausführung, sobald der Kurs den Preis in Handelsrichtung erreicht: Kauf über, Verkauf unter dem aktuellen Kurs | `Instrument` -- MUSS, `Richtung` -- MUSS (`buy` oder `sell`), `Volumen` -- MUSS, `Preis` -- MUSS, `Stop-Loss` -- KANN, `Take-Profit` -- KANN, `Gültigkeit` -- MUSS, Standardwert „bis auf Widerruf“ |
| `LimitOrder` (Limit-Order) | Ausführung, sobald der Kurs den Preis gegen die Handelsrichtung erreicht: Kauf unter, Verkauf über dem aktuellen Kurs | wie Stop-Order |
| `StopLimitOrder` (Stop-Limit-Order) | Beim Erreichen des Auslösepreises wird eine Limit-Order zum Limitpreis gestellt | wie Stop-Order, zusätzlich `Limitpreis` -- MUSS |

Die Eigenschaft `Gültigkeit` legt fest, wann eine wartende Order ohne Ausführung endet:

| Wert | Bedeutung | Zusatzangabe |
|---|---|---|
| bis auf Widerruf | gilt, bis sie ausgeführt oder gelöscht wird | -- |
| bis Tagesende | endet mit dem aktuellen Handelstag | -- |
| bis Zeitpunkt | endet zu einer festen Zeit | `Ablaufzeit` -- MUSS |
| bis Ende eines Tages | endet am Ende eines bestimmten Tages | `Datum` -- MUSS |

Zusammen mit `MarketOrder` (Marktorder) gibt es damit vier Ordertypen zum Eröffnen. Die Kompatibilitätsliste der Anbindung an MetaTrader 5 ordnet jede Kombination aus Ordertyp und Richtung dem dortigen Typ zu, zum Beispiel Stop-Order mit Richtung `buy` dem Typ Buy Stop.

Die Ausführungsbedingung, also das Verhalten, wenn zum gewünschten Preis nicht das ganze Volumen verfügbar ist, ist bewusst nicht Teil der Strategie. Die Anbindung an die Handelssoftware wählt einen Wert, den Konto und Instrument zulassen. Teilausführungen sind nach req-fach-016 berücksichtigt. Braucht eine Strategie später eine bestimmte Ausführungsbedingung, wird sie ergänzt.

Ebenso ist die zulässige Kursabweichung einer Marktorder nicht Teil der Strategie. Sie wirkt bei MetaTrader 5 nur bei bestimmten Ausführungsarten des Kontos. Die Anbindung setzt sie, wo das Konto sie verlangt.

Das Schließen einer Position gegen eine Gegenposition (bei MetaTrader 5 möglich bei Konten, die gegenläufige Positionen im selben Instrument zulassen) ist in der ersten Fassung nicht vorgesehen. Es wird bei Bedarf ergänzt.

Offen: ob das Handelssystem Ausführungsbedingung oder Kursabweichung später je Konto oder Strategieanwendung einstellbar macht.

### req-fach-030 -- Ordertypen und Kompatibilitätsliste der Anbindungen

Ordertypen sind Objekte von Pipwerk mit eigenen Namen. Eine Strategie verwendet diese Ordertypen und ist damit unabhängig von Konto und Handelssoftware. Die Bedeutung jedes Ordertyps ist im Fachmodell so genau beschrieben, dass sich für jede Handelssoftware prüfen lässt, ob sie ihn mit genau dieser Bedeutung ausführen kann. Vorbild für Umfang und Bedeutung sind die Ordertypen von MetaTrader 5.

Es gibt keine Ordertypen, deren Verfügbarkeit bei jeder Handelssoftware und jedem Broker gewährleistet ist. Jede Anbindung an eine Handelssoftware führt eine Kompatibilitätsliste: Sie gibt an, welche Ordertypen und welche Aktionen von Pipwerk (zum Beispiel Order ändern) die Handelssoftware mit genau der beschriebenen Bedeutung ausführt und wie sie dort heißen. Weicht das Verhalten der Handelssoftware ab, gilt der Ordertyp beziehungsweise die Aktion dort als nicht verfügbar. Annähernde Übersetzungen gibt es nicht.

Bei der Zuordnung einer Strategie zu einem Konto wird geprüft, ob Handelssoftware, Broker und Instrument des Kontos alle in der Strategie verwendeten Ordertypen und Aktionen anbieten. Grundlage ist die Kompatibilitätsliste der Anbindung. Ist das nicht der Fall, wird die Zuordnung mit Angabe des Grundes abgelehnt.

### req-fach-032 -- CloseOrder

`CloseOrder` ist ein spezialisierter Ordertyp zum vollständigen oder teilweisen Schließen einer bestehenden Position.

Zusätzlich zu den allgemeinen Eigenschaften von `Order` besitzt `CloseOrder`:

- `Position` -- MUSS; eindeutige Referenz auf die zu schließende Position.
- `Volumen` -- KANN; das zu schließende Volumen.

Ist kein Volumen angegeben, wird die gesamte Position geschlossen. Ist ein zulässiges geringeres Volumen angegeben, wird die Position teilweise geschlossen. Ein angegebenes Volumen darf das Volumen der referenzierten Position nicht überschreiten.

Instrument und Handelsrichtung werden nicht zusätzlich in `CloseOrder` geführt, sofern sie eindeutig aus der referenzierten Position hervorgehen.

Für `CloseOrder` gelten die allgemeinen Mechanismen von `Order` für direkte Werte, Regeln zur Bestimmung und Prüfung sowie Freigabe. Darüber hinaus ist derzeit kein eigener fachlicher Methodenbestand erforderlich.

### req-fach-033 -- Strategieunabhängige Nutzung von Orderobjekten

Orderobjekte sind strategieunabhängige Objekte. Sie können von unterschiedlichen fachlichen Komponenten erzeugt und verwendet werden.

Eine Strategie erzeugt selbst keine konkrete Order. Wenn der Strategieablauf nach Auswertung seiner Bedingungen eine Order veranlassen soll, übergibt das Element `Order aufgeben` die Order an das Handelssystem. Dafür wird derzeit kein zusätzliches Objekt `Signal` vorausgesetzt. Andere fachliche Komponenten, insbesondere eine spätere Positionsverwaltung, können unabhängig davon ebenfalls Orders erzeugen und an den `OrderManager` übergeben.

### req-fach-034 -- Allgemeines Objekt Regel

`Regel` ist ein eigenständig adressierbares und wiederverwendbares Objekt. Konkrete Regeln müssen in der GUI verfügbar sein und von Elementen und anderen Objekten verwendet werden können.

### req-fach-035 -- Eigenschaften einer Regel

Eine Regel besitzt mindestens folgende fachliche Eigenschaften:

- `Regel-ID` -- eindeutige Identifikation der Regel.
- `Name` -- fachlich verständliche Benennung der Regel. Eine Instanz erhält in der Strategie ihren eigenen Namen (req-fach-013a), eine Regel hat also immer genau einen Namen.
- `fachlicher Ausdruck` -- Definition der fachlichen Berechnung beziehungsweise Prüfung der Regel.
- `Parameter` -- 0..n; Werte, die bei jeder Verwendung der Regel belegt werden können, zum Beispiel ein Prozentsatz. Der fachliche Ausdruck verwendet sie wie konstante Werte.

### req-fach-036 -- Fachlicher Ausdruck einer Regel

Der fachliche Ausdruck einer Regel kann verwenden:

- konstante Werte,
- Parameter der Regel,
- Eigenschaften von Objekten,
- Ergebnisse anderer Regeln,
- arithmetische Operatoren,
- Vergleichsoperatoren,
- logische Operatoren,
- Funktionen.

Der fachliche Ausdruck wird in der Formelsprache OpenFormula geschrieben. OpenFormula ist die genormte Formelsprache für Tabellenkalkulationen (ISO/IEC 26300, Teil 2) und entspricht weitgehend der Schreibweise von Excel und LibreOffice. An die Stelle von Zellbezügen treten Eigenschaften von Objekten und Parameter der Regel, zum Beispiel `Konto.Kapital`.

Die verfügbaren Funktionen sind eine Auswahl aus OpenFormula. Ihre Bedeutung richtet sich nach der Norm. Die Auswahl wird bei Bedarf erweitert. Eigene Funktionen werden nur ergänzt, wenn OpenFormula keine passende enthält. Gespeichert werden Funktionen mit ihrem Namen aus der Norm.

Die erste Auswahl umfasst mindestens Abrunden und Aufrunden auf eine Schrittweite, Minimum, Maximum, Betrag und die Fallunterscheidung (`IF`). Dazu kommt die eigene Funktion `PREVIOUS` für frühere Werte (req-fach-014), weil OpenFormula keine entsprechende Funktion enthält. Offen: welche weiteren Funktionen die erste Auswahl umfasst und ob die Oberfläche Funktionsnamen in der gewählten Sprache anzeigt, zum Beispiel `ABRUNDEN` statt `ROUNDDOWN` oder `WENN` statt `IF`.

Objekte und Eigenschaften werden in der Punkt-Schreibweise angesprochen: `Objekt.Eigenschaft`. Objekte der Anwendung (req-fach-051) heißen im Ausdruck wie sie heißen: `Konto`, `Instrument`, `Kerze`, `Tick`, `Order`, `Position`, `Strategie`. Instanzen in einer Strategie spricht ein Ausdruck unter dem Namen an, den der Anwender vergeben hat. Namen dürfen Leerzeichen und Umlaute enthalten (Anforderungen Strategiedesigner req-ui-016). Offen für die Spezifikation: wie ein solcher Name im Ausdruck geschrieben und gespeichert wird. Jede Eigenschaft hat eine sprachneutrale Kennung ohne Leerzeichen und Sonderzeichen, zum Beispiel `trend_intakt`, `punkt_13`. Gespeichert wird die Kennung, die Oberfläche zeigt den Namen in der gewählten Sprache. Das gilt ebenso für die Namen der Objekttypen der Anwendung und für festgelegte Werte von Eigenschaften wie `aufwärts`, `Bewegung` oder `ausgeführt`. Die in diesem Dokument verwendeten Namen mit Leerzeichen (`Trend intakt`, `Punkt 1/3`) sind die Anzeigenamen.

### req-fach-037 -- Prüfen und Bestimmen durch Regeln

Regeln können für zwei fachliche Aufgaben verwendet werden:

- `prüfen` prüft einen fachlichen Sachverhalt und liefert ein auswertbares Prüfergebnis.
- `bestimmen` bestimmt einen fachlichen Wert.

Derzeit gibt es dafür einen gemeinsamen Objekttyp `Regel`. Ob später unterschiedliche spezialisierte Regeltypen benötigt werden, ist nicht festgelegt.

### req-fach-037a -- Bedingungen und Regeln

Eine Bedingung ist Bestandteil der fachlichen Strategie-Logik und wertet einen fachlichen Sachverhalt aus. Sie ist kein Regelobjekt und muss nicht als wiederverwendbare Regel definiert werden.

Eine Bedingung kann unmittelbar Eigenschaften von Objekten verwenden und Ergebnisse von Regeln einbeziehen. Regeln bleiben dabei eigenständige, adressierbare und wiederverwendbare Objekte.

### req-fach-038 -- Komponierbare Regeln und freie Granularität

Eine Regel darf Ergebnisse anderer Regeln in ihrem fachlichen Ausdruck verwenden. Regeln sind damit fachlich komponierbar.

Es besteht keine Verpflichtung, Regeln in einzelne Teilregeln zu zerlegen. Eine fachliche Berechnung kann unmittelbar Bestandteil einer Regel sein. Eine feinere Zerlegung in eigenständige Regeln muss jedoch möglich sein, insbesondere wenn die Teilregeln eigenständig wiederverwendet werden sollen.

### req-fach-039 -- Fachliche Informationsquellen für Regeln

Alle fachlichen Informationen, die in Regeln verwendet werden, müssen über Objekte und deren definierte Eigenschaften zugänglich sein. Regeln greifen nicht auf fachlich nicht abgebildete technische Rohdaten oder versteckte Variablen zurück.

### req-fach-040 -- Kontextbindung einer Regel

Eine Regel kann unabhängig von konkreten Objektinstanzen definiert werden. Der fachliche Ausdruck beschreibt die benötigten Objekte, Eigenschaften und Ergebnisse.

Die Zuordnung zu den konkreten Objektinstanzen erfolgt bei der Anwendung beziehungsweise Ausführung der Regel aus dem jeweiligen fachlichen Kontext. Ist ein benötigtes Objekt durch diesen Kontext bereits eindeutig bestimmt, muss es in der Regeldefinition nicht als konkrete Instanz festgelegt werden.

### req-fach-041 -- Regelwerk als geordnete Regelsammlung

`Regelwerk` ist eine benannte, geordnete Sammlung konfigurierter Regeln, also von Regeln mit festgelegten Parameterwerten, zum Beispiel „Risikoregeln“: Risiko je Trade höchstens 1 % des Kapitals, keine Order ohne Stop-Loss. Es dient dazu, mehrere Regeln gemeinsam zu verwenden beziehungsweise auszuwerten, ohne sie dadurch zu einer einzelnen Regel zusammenzufassen. Ein Regelwerk wird einer Strategie oder einem Element als Ganzes zugeordnet. Gespeicherte Regelwerke sind Vorlagen nach req-fach-013a.

Dieselbe Regel kann in mehreren Regelwerken verwendet werden. Die Mitgliedschaft in einem Regelwerk verändert die Regel selbst nicht.

### req-fach-042 -- Einzelergebnisse im Regelwerk

Die in einem Regelwerk enthaltenen Regeln behalten ihre Identität und ihre jeweiligen Ergebnisse. Ein Regelwerk kann daher Regeln mit unterschiedlichen Aufgaben und Ergebnisarten enthalten, insbesondere Regeln zum `prüfen` und Regeln zum `bestimmen`.

### req-fach-043 -- Optionales Gesamtergebnis eines Regelwerks

Ein Regelwerk besitzt nicht zwingend ein eigenes Gesamtergebnis.

Soll ein Regelwerk ein Gesamtergebnis liefern, muss dessen Bestimmung ausdrücklich definiert sein. Aus den Ergebnissen der enthaltenen Regeln wird kein automatisches Gesamtergebnis abgeleitet.

### req-fach-044 -- Reihenfolge der Regeln im Regelwerk

Die Reihenfolge der enthaltenen Regeln ist Bestandteil des Regelwerks. Die Regeln werden grundsätzlich in dieser Reihenfolge ausgewertet. Der Nutzer muss die Reihenfolge ändern können.

### req-fach-045 -- Fehlerhafte Reihenfolge im Regelwerk

Ein Regelwerk ist fehlerhaft, wenn es in seiner festgelegten Reihenfolge nicht auswertbar ist. Das ist insbesondere der Fall, wenn

- eine Regel das Ergebnis einer Regel verwendet, die im selben Regelwerk erst später steht,
- Regeln sich gegenseitig verwenden, direkt oder über Zwischenstufen (Zirkelbezug).

Die Reihenfolge wird nicht selbsttätig geändert. Der Nutzer legt sie fest. Erkennung und Anzeige gehören zur Konsistenzprüfung des Strategiedesigners.


### req-fach-046 -- Objekt Strategie

`Strategie` ist ein Objekt. Sie beschreibt die im Strategiedesigner erstellte Handelsstrategie.

Eine Strategie besitzt mindestens:

- `Strategie-ID` -- eindeutige, vom Namen unabhängige Identifikation,
- `Name` -- vom Anwender änderbare fachliche Benennung,
- `Beschreibung` -- freie Beschreibung beziehungsweise Anmerkung,
- `Auslöser` -- 0..n Auslöser, die festlegen, bei welchem Ereignis die Strategie ausgewertet werden soll,
- `Ablauf` -- die im Designer festgelegte fachliche Abfolge,
- strategiebezogene `Regeln` -- soweit Regeln für die Strategie als Ganzes gelten, einzeln oder als Regelwerk.
- `Strategieparameter` -- 0..n; Werte, die an einer Stelle festgelegt werden und überall in der Strategie verwendbar sind, zum Beispiel `Strategie.Handelszeiteinheit`. Ein Strategieparameter kann im Ablauf mit dem Element `Parameter setzen` geändert werden (req-fach-047). Sein Wert kann in der Strategie festgelegt oder erst bei der Anwendung übergeben werden. Ein Strategieparameter kann auch ein Objekt sein, zum Beispiel ein `Instrument`; Ausdrücke sprechen dann dessen Eigenschaften an (`Strategie.Filterinstrument.Spread`), und Instrumente, Kerzen, Ticks und Indikatoren können es als Wert ihres Parameters `Instrument` verwenden (req-fach-053).
- `wartende Orders` und `offene Positionen` -- Anzahl der Orders und Positionen, die diese Strategie auf dem Konto und Instrument gestellt beziehungsweise eröffnet hat, auf dem sie gerade läuft. Diese Eigenschaften sind nur bei der Ausführung belegt und dienen Bedingungen im Ablauf. Vorläufig: Der Auftraggeber hält diese Lösung noch nicht für abschließend. Sie wird mit den Testfällen erprobt.

Regeln der Strategie gelten für jede Order, die die Strategie aufgibt. Zusätzlich kann jedes Element im Ablauf eigene Regeln haben, insbesondere ein Element `Order aufgeben` für seine Order. Dieselbe Regel kann an beiden Stellen verwendet werden. Bestimmen mehrere Regeln dieselbe Eigenschaft einer Order, gilt der Wert der zuletzt angewendeten, gleich ob es dieselbe oder eine andere Regel ist. Zuerst übernimmt die Order die Werte, die ihr direkt übergeben werden, zum Beispiel Ergebnisse von Berechnungen im Ablauf (req-fach-021). Danach werden die Regeln der Strategie angewendet, dann die Regeln der Elemente in der Reihenfolge des Ablaufs. Eine bestimmende Regel der Strategie kann daher direkt übergebene Werte verwenden, aber keine Werte, die erst eine Regel eines Elements bestimmt. So kann eine Strategie grundsätzlich mit 1 % Risiko arbeiten und für eine bestimmte Order 2 % festlegen. Prüfende Regeln ändern die Order nicht und heben einander daher nicht auf. Sie prüfen die Order, nachdem alle Eigenschaften bestimmt sind (req-fach-021). Die Order muss jede Prüfung bestehen. Für Regeln der Strategie und Regeln der Elemente gilt gleichermaßen: Eine Regel, die eine Eigenschaft voraussetzt, die der Ordertyp nicht hat, wird auf diese Order nicht angewendet, ohne Fehler oder Meldung; eine Risikoregel mit Stop-Loss gilt deshalb nicht für eine `CloseOrder` (req-fach-032). Die Strategie legt die Regeln fest. Angewendet werden sie vom Strategietester und vom Handelssystem, nicht vom Strategiedesigner.

Eine Strategie kann Auslöser haben, muss aber nicht. Eine Obergrenze besteht nicht. Offen: wie eine Strategie ohne Auslöser ausgewertet wird, zum Beispiel durch Start von Hand; die Frage betrifft die Ausführung und wird vor der Beschreibung des Strategietesters geklärt. Jeder Auslöser ist ein Element auf der Zeichenfläche und steht am Anfang des Ablaufs oder am Anfang der Verwaltung einer Order (req-fach-049a). Er besitzt eine eigene Verbindung in den Ablauf. Mehrere Auslöser können auf denselben oder auf verschiedene Teile des Ablaufs führen.

Eine eigene Versionsangabe der Strategie wird derzeit nicht vorausgesetzt. Eine zentrale, vom Ablauf getrennte Liste aller verwendeten Objekte wird ebenfalls nicht vorausgesetzt. Die verwendeten Objekte sind Bestandteil des Ablaufs dort, wo sie verwendet werden.

Parameter und Eigenschaften verwendeter Objekte und Parameter von Elementen, zum Beispiel die Zeiteinheit eines Auslösers, können mit einem festen Wert, mit einem Strategieparameter, über eine Datenverbindung aus einer Eigenschaft eines anderen Objekts (Anforderungen Strategiedesigner req-ui-014), durch eine Berechnung beziehungsweise eine Regel oder erst bei der Anwendung der Strategie zur Laufzeit belegt werden.

### req-fach-047 -- Ablauf einer Strategie

Der `Ablauf` ist Bestandteil einer Strategie und derzeit kein eigenständiges Objekt. Er bildet fachlich das ab, was der Nutzer im Designer als Strategie anordnet und verbindet.

Die Ablaufverbindung ist sequenziell und legt fest, welches Element als Nächstes ausgeführt wird. Eine Bedingung kann den Ablauf anhand ihres Ergebnisses verzweigen. Der `wahr`-Pfad führt zu einem nachfolgenden Element. Ein `falsch`-Pfad kann zu einem anderen Element führen oder ohne Fortsetzung enden.

Ein eigenes Start- oder Endelement wird nicht vorausgesetzt. Die Auswertung beginnt bei dem Auslöser-Element, das eingetreten ist, und folgt dessen Verbindung. Wo sie ohne Auslöser beginnt, ist offen (req-fach-046). Ein Ablaufpfad endet, wenn kein weiteres Element folgt.

Das Element `Parameter setzen` weist einem Strategieparameter einen Wert zu. Eine Verbindung darf zu einem früheren Element des Ablaufs zurückführen, damit eine Prüfung mit geänderten Strategieparametern innerhalb derselben Auswertung erneut durchlaufen wird. Beispiel: Kommt die Order auf der gewählten Handelszeiteinheit nicht zustande, setzt der Ablauf die Handelszeiteinheit auf die nächstkleinere und beginnt die Prüfung von vorn. Eine solche Rückführung muss durch eine Bedingung enden, die Konsistenzprüfung meldet Rückführungen ohne Ende.

Offen: ob ein mit `Parameter setzen` geänderter Wert nur bis zum Ende der Auswertung oder darüber hinaus gilt. Für die Testfälle des Vorhabens `strategiedesign` wird `Parameter setzen` nicht gebraucht, die Frage betrifft die Ausführung.

### req-fach-048 -- Berechnung im Strategieablauf

Eine `Berechnung` ist ein Element und derzeit kein eigenständiges Objekt.

Sie wertet einen fachlichen Ausdruck aus und liefert ein Ergebnis. Der Ausdruck wird wie bei Regeln in OpenFormula geschrieben (req-fach-036). Als Eingaben können insbesondere konstante Werte, Eigenschaften von Objekten sowie Ergebnisse von Regeln und anderen Berechnungen verwendet werden.

Eine Berechnung muss nicht als `Regel` definiert werden. Die technische Auswertung von Berechnungen, Regeln und Bedingungen darf gemeinsame Mechanismen verwenden. Ihre unterschiedliche fachliche Bedeutung bleibt erhalten.

### req-fach-049 -- Order aufgeben im Strategieablauf

`Order aufgeben` ist das Element im Strategieablauf, das eine Order veranlasst. Es legt Ordertyp und Eigenschaften der Order fest und übergibt die Order an das Handelssystem. Es wird über den Ablauf erreicht, in der Regel über den Pfad einer Bedingung, es darf aber auch unmittelbar an einem Ausgang eines anderen Elements folgen, zum Beispiel am Ausgang `nicht gestellt` eines anderen `Order aufgeben`.

`Order aufgeben` hat zwei Ausgänge: `gestellt` und `nicht gestellt`. Der Ausgang `nicht gestellt` wird genommen, wenn eine Eigenschaft der Order nicht bestimmt werden kann oder eine prüfende Regel der Strategie oder des Elements nicht erfüllt ist, zum Beispiel weil das Volumen unter dem Mindestvolumen liegt. Offen: eine Regel zur freien Margin; den Marginbedarf einer Order liefert derzeit kein Objekt. Am Ausgang `gestellt` beginnt die Verwaltung der Order (req-fach-049a); hat sie eigene Auslöser, wird sie nicht sofort, sondern erst bei diesen durchlaufen. Am Ausgang `nicht gestellt` geht der Ablauf sofort weiter, auch mit einer erneuten Prüfung von vorn mit geänderten Strategieparametern (req-fach-047). Ist an einem Ausgang nichts verbunden, endet dort der Ablaufpfad.

Offen: ob das Handelssystem dafür einen eigenen OrderBuilder verwendet.

Ein allgemeiner Objekttyp `Aktion` wird daraus derzeit nicht abgeleitet.

### req-fach-049a -- Elemente für bestehende Orders und Positionen

Neben `Order aufgeben` gibt es im Strategieablauf vier Elemente, die auf bereits bestehende Orders oder Positionen wirken:

| Element | wirkt auf | Inhalt |
|---|---|---|
| `Order ändern` | wartende Order | Preis, bei der Stop-Limit-Order auch Limitpreis, Stop-Loss, Take-Profit, Gültigkeit. Ausgänge `geändert` und `nicht geändert`. |
| `Order löschen` | wartende Order | -- |
| `Position ändern` | offene Position | Stop-Loss, Take-Profit. Ausgänge `geändert` und `nicht geändert`. |
| `Position schließen` | offene Position | ganz oder teilweise; Volumen KANN, ohne Volumen wird die Position ganz geschlossen |

`Position schließen` veranlasst eine `CloseOrder` nach req-fach-032. Die Namen folgen den Aktionen von MetaTrader 5. Die prüfenden Regeln der Strategie und des Elements gelten auch bei `Order ändern` und `Position ändern`: Sie werden auf die geänderte Order beziehungsweise Position angewendet. Ist eine Regel nicht erfüllt, bleibt die Order beziehungsweise Position unverändert und der Ausgang `nicht geändert` wird genommen. Eine Risikoregel kann durch eine Änderung nicht umgangen werden. Ob eine Handelssoftware diese Aktionen anbietet, ergibt sich aus der Kompatibilitätsliste nach req-fach-030.

Jede gestellte Order erhält ihre eigene Verwaltung. Die Verwaltung ist der Teil des Ablaufs, der am Ausgang `gestellt` von `Order aufgeben` folgt. Sie läuft für genau diese Order und die Position, die durch ihre Ausführung entsteht: zuerst für die wartende Order (ändern, löschen), nach der Ausführung für die Position (ändern, schließen). Welche Elemente gerade anwendbar sind, steuert der Anwender über Bedingungen auf `Order.Status`. Die Verwaltung kann eigene Auslöser-Elemente haben (req-fach-053), zum Beispiel jeden Tick oder jeden Kerzenschluss. Hat sie eigene Auslöser, wird sie beim Stellen der Order nicht durchlaufen, sondern erst bei diesen. Sie endet, wenn die Order gelöscht oder abgelaufen oder die Position geschlossen ist. In Ausdrücken der Verwaltung bezeichnen `Order` und `Position` die eigene Order und die daraus entstandene Position.

`Order ändern`, `Order löschen`, `Position ändern` und `Position schließen` stehen in der Verwaltung und wirken nur auf deren Order beziehungsweise Position. Stellt eine spätere Auswertung der Strategie eine weitere Order, erhält diese ihre eigene Verwaltung. Orders und Positionen verschiedener Verwaltungen beeinflussen sich nicht. Orders und Positionen, die nicht von der Strategie stammen, werden nie verändert.

Tritt ein Auslöser ein, werden zuerst die Verwaltungen der bestehenden Orders und Positionen ausgewertet, danach der Hauptablauf der Strategie. Ein Signal in Gegenrichtung kann so die bestehende Position schließen, bevor der Hauptablauf eine neue eröffnet.


### req-fach-051 -- Objekte der Anwendung

Objekte der Anwendung sind Objekte wie alle anderen: Sie können Parameter haben, und von `Konto`, `Instrument`, `Kerze` und `Tick` kann eine Strategie beliebig viele Instanzen verwenden, jede mit eigenem Namen (zum Beispiel `KerzeH1` und `KerzeM15`). Der Unterschied zu den übrigen Objekten: Ihre Werte stellt die Anwendung bereit, das Handelssystem aus Broker und Konto, der Strategietester aus den Einstellungen des Testlaufs, zum Beispiel angenommenes Kapital, Spread und Brokerbedingungen. Der Anwender gestaltet ihren Objekttyp nicht, und sie werden nicht als Vorlage gespeichert. Im Strategiedesigner existieren sie als Typbeschreibung, damit Ausdrücke ihre Eigenschaften verwenden und die Konsistenzprüfung sie kennt. Sie sind in Ausdrücken verfügbar, ohne auf der Zeichenfläche zu liegen (`Order` und `Position` nur dort, wo sie bestimmt sind, siehe unten), und können, mit Ausnahme von `Order`, `Position` und `Strategie`, als Elemente auf die Zeichenfläche gelegt werden, um ihre Eigenschaften zu zeigen und ihre Parameter zu setzen. Liegt keine Instanz eines Objekts der Anwendung auf der Zeichenfläche, spricht ein Ausdruck es unter dem Namen seines Objekttyps an (`Kerze.Schluss`); die Kerze hat dann die Zeiteinheit des Auslösers `Kerzenschluss`, der die Auswertung gestartet hat. Startet ein anderer Auslöser oder kein Auslöser die Auswertung, muss eine Kerze mit gesetzter Zeiteinheit auf der Zeichenfläche liegen, sonst meldet die Konsistenzprüfung einen Fehler. Liegen Instanzen auf der Zeichenfläche, gelten ihre gesetzten Parameter, und Ausdrücke sprechen sie über ihren Namen an (req-fach-036). `Order`, `Position` und `Strategie` werden nicht als Instanz auf die Zeichenfläche gelegt; welche Order und Position gemeint sind, ergibt sich aus dem Zusammenhang (req-fach-040): In einer Regel bezeichnen sie die Order beziehungsweise die Position, auf die die Regel angewendet wird; wird eine Regel auf eine Position angewendet, ist `Order` die Order, aus der die Position entstanden ist. In Ausdrücken des Ablaufs bezeichnen sie die Order und Position der Verwaltung (req-fach-049a); im Ablauf außerhalb einer Verwaltung meldet die Konsistenzprüfung ihre Verwendung als Fehler, auch über das Ergebnis einer Regel. Eine Regel, die `Order` oder `Position` anspricht, selbst oder über das Ergebnis einer anderen Regel, steht nur dort, wo eine Order vorhanden ist: als Regel der Strategie, am Element „Order aufgeben“ oder in dessen Verwaltung. In einem Indikator oder Trend, auch in einem Regelwerk darin, meldet die Konsistenzprüfung schon das Einfügen einer solchen Regel als Fehler.

| Objekt | Parameter und Eigenschaften |
|---|---|
| `Konto` | `Kapital` (Kontostand einschließlich der Gewinne und Verluste offener Positionen), `freie Margin`, `Währung` |
| `Instrument` | Parameter `Instrument` (req-fach-053); Eigenschaften `Bezeichnung`, `Tickgröße`, `Tickwert`, `Punkt`, `Pip`, `Spread`, `Mindestvolumen`, `Volumenschritt` |
| `Kerze` | Parameter `Instrument` (req-fach-053), `Zeiteinheit`; Eigenschaften `Eröffnung`, `Hoch`, `Tief`, `Schluss`, `Volumen`, `Zeitpunkt` der jeweils letzten abgeschlossenen Kerze dieser Zeiteinheit |
| `Tick` | Parameter `Instrument` (req-fach-053); Eigenschaften `Geld`, `Brief`, `Zeitpunkt` des jeweils letzten Ticks |
| `Order`, `Position` | in einer Regel die Order beziehungsweise Position, auf die die Regel angewendet wird; in der Verwaltung einer Order die eigene Order und die daraus entstandene Position (req-fach-019, req-fach-052, req-fach-049a), jede Verwaltung hat ihre eigene |
| `Strategie` | die eigene Strategie mit ihren Strategieparametern und Eigenschaften (req-fach-046) |

Spread, Pip und Punkt liefert das Instrument als Kursdifferenz. Pip und Punkt sind Vielfache der Tickgröße des Instruments. Die Umrechnung zwischen Pip, Punkt und Tickgröße ergibt sich aus den Eigenschaften des Instruments, ein Ausdruck rechnet mit ihnen wie mit anderen Werten.

Offen: ein Objekt `Kurs` für Strategien, die nicht mit Kerzen arbeiten.

### req-fach-052 -- Position

`Position` ist das Objekt, das durch die Ausführung einer Order entsteht (req-fach-016). Es besitzt mindestens:

- `Instrument`,
- `Richtung` -- `buy` oder `sell`,
- `Volumen`,
- `Einstiegspreis`,
- `Stop-Loss` -- KANN,
- `Take-Profit` -- KANN,
- `offener Gewinn oder Verlust`.

### req-fach-053 -- Auslösertypen

Ein Auslöser ist das Ereignis, bei dem der Ablauf einer Strategie oder die Verwaltung einer Order ausgewertet wird. Auslösertypen:

| Auslösertyp | Parameter | liefert |
|---|---|---|
| `Kerzenschluss` | `Instrument`, `Zeiteinheit` | die abgeschlossene `Kerze` dieser Zeiteinheit |
| `Tick` | `Instrument` | den neuen `Tick` |
| `externes Ereignis` | offen | offen |

Das Instrument kommt aus der Anwendung der Strategie, sofern die Strategie kein anderes festlegt: `Instrument`, `Kerze`, `Tick`, die Auslöser `Kerzenschluss` und `Tick` und jeder Indikator haben den Parameter `Instrument`, vorbelegt mit dem Instrument der Anwendung; belegt werden kann er auch mit einem Strategieparameter vom Objekttyp `Instrument` oder einem festen Instrument. So kann eine Strategie mehrere Instrumente betrachten, von ihnen ausgelöst werden und auf ihnen Orders aufgeben. Das Instrument einer Order ist ihre Eigenschaft (req-fach-019) und nicht auf das Instrument der Anwendung beschränkt. Offen: wie ein festes Instrument bezeichnet wird (Symbol des Brokers oder eigene Bezeichnung), betrifft die Kontoverwaltung. Ein externes Ereignis kommt von außerhalb der Anwendung über eine Schnittstelle, zum Beispiel als Nachricht oder Aufruf eines externen Programms, eines externen Indikators oder eines Agenten, der Nachrichten auswertet. Offen: welche Daten ein externes Ereignis mitbringt und wie es die Strategie erreicht. Für das Vorhaben `strategiedesign` werden `Kerzenschluss` und `Tick` umgesetzt.

### req-fach-054 -- Mitgelieferte Indikatoren

Mitgeliefert werden mindestens die Indikatoren `EMA`, `ATR`, `ZigZag` und `Markttechnik`. Ihre Parameter folgen dem Muster der entsprechenden Indikatoren von MetaTrader 5. Jeder Indikator hat die Parameter `Instrument` (req-fach-053) und `Zeiteinheit`.

| Indikator | Parameter | Eigenschaften |
|---|---|---|
| `EMA` (exponentieller gleitender Durchschnitt) | `Instrument`, `Zeiteinheit`, `Periode`, `Verschiebung` (Standard 0), `Anwenden auf` (Kurs der Kerze, aus dem der Durchschnitt berechnet wird, wie in MetaTrader 5; Standard Schlusskurs) | `Wert` |
| `ATR` (Average True Range) | `Instrument`, `Zeiteinheit`, `Periode` | `Wert` |
| `ZigZag` | `Instrument`, `Zeiteinheit`, `Depth` (Standard 12), `Deviation` (Standard 5), `Backstep` (Standard 3); Verfahren des in MetaTrader 5 mitgelieferten ZigZag | die Wendepunkte, je Wendepunkt Kurs, Hoch oder Tief und ob endgültig. Offen: wie viele zurückliegende Wendepunkte Ausdrücke ansprechen können. |
| `Markttechnik` | siehe [Indikator Markttechnik](indikator-markttechnik.md) | siehe dort |

In der Oberfläche heißt `Markttechnik` „1-2-3-Trend (Markttechnik)“ und steht wie selbst angelegte Trends in der Gruppe der Trends. Er baut auf `ZigZag` auf: Er rechnet selbst nach dessen Verfahren und hat dessen Parameter ([Indikator Markttechnik](indikator-markttechnik.md), Abschnitt 2), eine eigene Instanz von `ZigZag` braucht er nicht.

Offen: weitere mitgelieferte Indikatoren und die Einbindung von Expert Advisors als Objekte.

## 3. Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-09-24 | Aus dem bisherigen gemeinsamen Anforderungsdokument ausgegliedert. Bestehende fachliche Festlegungen und IDs wurden übernommen. |
| 2026-09-25 | `Strategie` als fachliches Objekt sowie Ablauf, Berechnung und Beauftragung des `OrderBuilder` konkretisiert; separates `Signal`-Objekt aus dem aktuellen Modell entfernt. |
| 2026-10-11 | Aufbau und Wiederverwendung von Indikatoren und Trends festgelegt. Pending-Ordertypen von MetaTrader 5 als Entwurf ergänzt. Herkunft und Verfügbarkeit von Ordertypen festgelegt. Abgestimmt mit dem Nutzer am 2026-10-11. |
| 2026-10-12 | Begriffe abgestimmt: Objekt, Element, Regelwerk, Eigenschaft, Parameter, Ergebnis. Mehrere Auslöser als Elemente zulässig. Element „Order aufgeben“, OrderBuilder offen. |
| 2026-10-13 | req-fach-045: fehlerhafte Reihenfolge im Regelwerk festgelegt (Vorwärtsbezug, Zirkelbezug, keine selbsttätige Umsortierung). Abgestimmt mit dem Auftraggeber im Chat am 2026-10-13. |
| 2026-10-13 | req-fach-030 geändert: eigene Ordertypen von Pipwerk mit Bedeutung nach MetaTrader 5, Kompatibilitätsliste je Anbindung, keine annähernde Übersetzung. req-fach-025 und req-fach-029 angeglichen. Abgestimmt mit dem Auftraggeber im Chat am 2026-10-13. |
| 2026-10-13 | req-fach-049a: Elemente Order ändern, Order löschen, Position ändern, Position schließen. Abgestimmt mit dem Auftraggeber im Chat am 2026-10-13. |
| 2026-10-13 | req-fach-029: Handelsrichtung als Eigenschaft bei allen Ordertypen, drei wartende Ordertypen Stop-Order, Limit-Order, Stop-Limit-Order. Abgestimmt mit dem Auftraggeber im Chat am 2026-10-13. |
| 2026-10-13 | req-fach-029: Gültigkeit wartender Orders mit vier Werten statt Ablaufzeit. Abgestimmt mit dem Auftraggeber im Chat am 2026-10-13. |
| 2026-10-13 | req-fach-029: Ausführungsbedingung bewusst nicht Teil der Strategie, Wahl durch die Anbindung. Abgestimmt mit dem Auftraggeber im Chat am 2026-10-13. |
| 2026-10-13 | req-fach-029: zulässige Kursabweichung nicht Teil der Strategie, möglicherweise später im Handelssystem. Abgestimmt mit dem Auftraggeber im Chat am 2026-10-13. |
| 2026-10-13 | req-fach-029: Schließen gegen Gegenposition nicht vorgesehen. Erfassung der Ordertypen nach MetaTrader 5 abgeschlossen, Vermerk Entwurf entfernt. Abgestimmt mit dem Auftraggeber im Chat am 2026-10-13. |
| 2026-10-13 | req-fach-049a: Bezug auf die eigene Order über das Ergebnis von Order aufgeben. Abgestimmt mit dem Auftraggeber im Chat am 2026-10-13. |
| 2026-10-14 | req-fach-049a: offene Frage ergänzt, welche Order bei mehreren gestellten Orders gemeint ist. |
| 2026-10-14 | req-fach-046: Regeln der Strategie gelten für jede ihrer Orders, Elemente können eigene Regeln haben, Anwendung durch Strategietester und Handelssystem. Abgestimmt mit dem Auftraggeber im Chat am 2026-10-14. |
| 2026-10-14 | req-fach-046: bei mehreren Regeln für dieselbe Eigenschaft gilt die zuletzt angewendete. Abgestimmt mit dem Auftraggeber im Chat am 2026-10-14. |
| 2026-10-14 | req-fach-035, 036, 046: Regeln haben Parameter. Bei bestimmenden Regeln gilt der zuletzt bestimmte Wert einer Eigenschaft, prüfende Regeln heben einander nicht auf. Abgestimmt mit dem Auftraggeber im Chat am 2026-10-14. |
| 2026-10-14 | req-fach-049: Ausgänge gestellt und abgelehnt bei Order aufgeben. Abgestimmt mit dem Auftraggeber im Chat am 2026-10-14. |
| 2026-10-14 | req-fach-036: fachlicher Ausdruck in OpenFormula, Funktionen als Auswahl aus der Norm. req-fach-012 und 048 angeglichen. Abgestimmt mit dem Auftraggeber im Chat am 2026-10-14. |
| 2026-10-14 | req-fach-049a: eigene Verwaltung je gestellter Order mit eigenen Auslösern, ersetzt die offene Frage nach der gemeinten Order. req-fach-046 angeglichen. Abgestimmt mit dem Auftraggeber im Chat am 2026-10-14. |
| 2026-10-14 | req-fach-046: Eigenschaften wartende Orders und offene Positionen der Strategie, vorläufig. Abgestimmt mit dem Auftraggeber im Chat am 2026-10-14. |
| 2026-10-14 | req-fach-049a: bei einem Auslöser zuerst die Verwaltungen, dann der Hauptablauf. Abgestimmt mit dem Auftraggeber im Chat am 2026-10-14. |
| 2026-10-14 | Begriff „Testfall“ statt „Prüffall“ (Auftraggeber im Chat). |
| 2026-10-14 | Eindeutige Korrekturen nach dem Prüfbericht der QA zu `strategiedesign`: „Prototyp“ in req-fach-046 entfernt, Änderungsnachweis nach Datum geordnet. |
| 2026-10-15 | Entscheidungen des Auftraggebers zu den Befunden der QA (`strategiedesign`, Durchlauf 1): Objekte der Anwendung (req-fach-051), Position (req-fach-052), Auslösertypen (req-fach-053), mitgelieferte Indikatoren (req-fach-054), Vorlage und Instanz statt Verweis (req-fach-013a), Funktion VORHER (req-fach-014, req-fach-036), Statuswerte der Order (req-fach-019), Fallunterscheidung und Schreibweise von Namen (req-fach-036), Regelwerk als Sammlung konfigurierter Regeln (req-fach-041), Strategieparameter und Reihenfolge von Werten und Regeln (req-fach-046), Parameter setzen und Rückführung (req-fach-047), Ausgang „nicht gestellt“ (req-fach-049), prüfende Regeln und Ausgänge bei Ändern, Auslöser der Verwaltung, Order und Position (req-fach-016, req-fach-049a). Abgestimmt mit dem Auftraggeber im Chat am 2026-10-15. |
| 2026-10-15 | Entscheidungen des Auftraggebers zur Nachprüfung der QA (`strategiedesign`, Durchlauf 2): Objekte der Anwendung mit Parametern und mehreren Instanzen (req-fach-051), Regel kann bestimmen und prüfen (req-fach-020), Belegung von Parametern der Elemente (req-fach-046), Geltungsdauer von Parameter setzen und Bezug von VORHER als offen gekennzeichnet (req-fach-047, req-fach-014), Verwaltung am Ausgang gestellt (req-fach-049), Instrument der Position (req-fach-052), Einheit von Spread, Pip und Punkt (req-fach-051), Kennungen für Werte (req-fach-036), Begriffe Indikator statt Komponente (req-fach-010, req-fach-011) und Eigenschaften statt Parameter (req-fach-016). Abgestimmt mit dem Auftraggeber im Chat am 2026-10-15. |
| 2026-10-16 | Nachprüfung der QA (`strategiedesign`, Durchlauf 3). Entscheidungen des Auftraggebers im Chat am 2026-10-16: Preis der Marktorder (req-fach-028), Regel nur bei vorhandenen Eigenschaften, keine Risikoregel für CloseOrder (req-fach-046). Vom Projektleiter nach Hinweisen der QA: Zeiteinheit der einzeln verwendeten Kerze (req-fach-051). |
| 2026-10-16 | Nachprüfung der QA (`strategiedesign`, Durchlauf 4), vom Projektleiter: Order und Position in Regeln aus dem Zusammenhang, nicht auf der Zeichenfläche (req-fach-051), Preis als allgemeine Eigenschaft (req-fach-019, req-fach-028), Prüfung nach Ausführung mit offener Maßnahme (req-fach-021), Grundsatz für alle Regeln (req-fach-046), Margin-Regel offen (req-fach-049). |
| 2026-10-16 | Nachprüfung der QA (`strategiedesign`, Durchlauf 5), vom Projektleiter: Preis der StopLimitOrder ist der Auslösepreis, Preis der CloseOrder (req-fach-019, req-fach-028), Prüfung nach Ausführung auf der Position (req-fach-021), Bedeutung von Order und Position in Regeln (req-fach-051), Objekttyp angelegter Indikatoren und Trends (req-fach-013a). |
| 2026-10-16 | Nachprüfung der QA (`strategiedesign`, Durchlauf 6), vom Projektleiter: Order und Position in Regeln vereinfacht (req-fach-051), Preis der CloseOrder (req-fach-019), Limitpreis bei Order ändern (req-fach-049a). |
| 2026-10-16 | Abstimmung der Spezifikation (`strategiedesign`), Entscheidung des Auftraggebers zu Festlegung 4, vom Projektleiter: Eine Regel mit `Order` oder `Position` steht nur als Regel der Strategie, an „Order aufgeben“ oder in dessen Verwaltung; in Indikator oder Trend ist das Einfügen ein Fehler (req-fach-051, Hinweis S26 aus `development/strategiedesign/reviews/specification-3.md`). |
| 2026-10-18 | Entscheidung des Auftraggebers im Chat am 2026-10-18: Auslöser sind optional, für die Strategie und für die Verwaltung einer Order (req-fach-046, req-fach-047, req-fach-049a); `Kerze` ohne Instanz auch ohne Auslöser nur mit Instanz auf der Zeichenfläche (req-fach-051). Auswertung ohne Auslöser offen. |
| 2026-10-18 | Vom Projektleiter, Folge der Entscheidung vom selben Tag: Durchlauf der Verwaltung beim Stellen der Order auf Verwaltungen mit eigenen Auslösern beschränkt (req-fach-049, req-fach-049a). Hinweis H1 aus `development/strategiedesign/reviews/requirements-8.md`. |
| 2026-10-19 | req-fach-054: `ZigZag` als eigener mitgelieferter Indikator; `Markttechnik` heißt in der Oberfläche „1-2-3-Trend (Markttechnik)“, steht bei den Trends und baut auf `ZigZag` auf. Entscheidung des Auftraggebers im Chat am 2026-10-19 (Abnahme `strategiedesign/wp02`). |
| 2026-10-19 | req-fach-046, req-fach-053: Strategieparameter können Objekte sein, zum Beispiel ein `Instrument`; Instrument, Kerze, Tick und Indikatoren haben den Parameter `Instrument`, vorbelegt mit dem Instrument der Anwendung. Entscheidung des Auftraggebers im Chat am 2026-10-19. |
| 2026-10-19 | req-fach-054: Parameter `Kursquelle` des EMA heißt `Anwenden auf` wie in MetaTrader 5. Feststellung des Auftraggebers im Chat am 2026-10-19: „Kursquelle“ war erfunden und falsch. |
| 2026-10-19 | Vom Projektleiter nach dem Prüfbericht der QA (`strategiedesign`, Durchlauf 9), Folge der Festlegungen vom selben Tag: Namen mit Leerzeichen, Schreibweise im Ausdruck offen für die Spezifikation (req-fach-036, B2); `Name` statt `Bezeichnung` bei Regel und Strategie (req-fach-035, req-fach-046, B3); Parameter `Instrument` in req-fach-046, req-fach-051 und req-fach-054 wie in req-fach-053 (B5); Belegung über Datenverbindung (req-fach-046, H10); Auslöser mit Parameter `Instrument`, Order auf jedem Instrument (req-fach-053, H7, Entscheidung des Auftraggebers im Chat am 2026-10-19: keine Einschränkung ohne Notwendigkeit); `Markttechnik` rechnet selbst nach dem Verfahren des `ZigZag` (req-fach-054, H9). |
