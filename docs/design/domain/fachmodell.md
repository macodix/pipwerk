# Fachmodell des Trading-Systems

## Dokumentstatus

- status: `draft`
- zweck: Gemeinsame, wiederverwendbare fachliche Begriffe, Objekte und Zusammenhänge für Strategiedesigner und Handelssystem
- zuletzt aktualisiert: `2026-09-24`

## 1. Zweck und Abgrenzung

Dieses Dokument beschreibt das gemeinsame fachliche Modell. Es enthält keine GUI-Anforderungen des Strategiedesigners und keine Infrastruktur- oder Laufzeitanforderungen des Handelssystems. Bestehende Anforderungs-IDs werden zur Nachvollziehbarkeit beibehalten.

## 2. Fachliche Objekte und Zusammenhänge

### req-fach-010 -- Fachliches Objekt Trend

Das fachliche Objekt `Trend` beschreibt die Richtung einer Entwicklung innerhalb einer bestimmten Zeiteinheit.

`Trend` besitzt mindestens folgende Eigenschaften:

-   `Richtung`; sie ist ein Ergebnis des Trends,
-   `Zeiteinheit`; sie bezeichnet die betrachtete Zeitreihe beziehungsweise den Chart und damit den zeitlichen Geltungsbereich der Trendaussage,
-   `Berechnungsverfahren`; es bestimmt, wie die Trendrichtung ermittelt wird.

Ein eigener `Betrachtungshorizont` ist keine allgemeine Eigenschaft des Trends. Benötigte Perioden, Zeitspannen oder Mindestdauern gehören zu dem Berechnungsverfahren beziehungsweise zu den darin verwendeten Komponenten.

Der Trend ist nicht an ein bestimmtes Berechnungsverfahren oder einen bestimmten Indikator gebunden.

### req-fach-011 -- Berechnungsverfahren und Indikatoren eines Trends

Das Berechnungsverfahren eines Trends verwendet einen oder mehrere Indikatoren. Bei mehreren Indikatoren kann das Berechnungsverfahren deren Ergebnisse nach einer geeigneten Verknüpfungsregel zusammenführen. Dazu können insbesondere Übereinstimmung, alternative Erfüllung, Mehrheitsentscheidung, Gewichtung beziehungsweise Priorisierung oder eine eigene Berechnung gehören. Diese Aufzählung ist nicht abschließend.

Das Berechnungsverfahren und seine Indikatoren bestimmen, welche Daten beziehungsweise Wertreihen für die Trendbestimmung benötigt werden. Der fachliche Objekttyp `Trend` legt diese Eingangsdaten nicht allgemein fest.

Die Zeiteinheit ist eine Vorgabe des Trends und kann die Auswahl beziehungsweise Parametrisierung des Berechnungsverfahrens und seiner Komponenten beeinflussen.

### req-fach-012 -- Ergebnisse verwendeter Indikatoren

Indikatoren eines Trend-Berechnungsverfahrens können neben den für die Trendrichtung benötigten Ergebnissen weitere Ergebnisse bereitstellen. Diese Ergebnisse bleiben dem jeweiligen Indikator zugeordnet und werden nicht zu Eigenschaften des Trends.

Sie müssen jedoch über die Struktur des Trendobjekts für andere fachliche Elemente referenzierbar sein. Die konkrete Darstellung und Zugriffssyntax ist noch nicht festgelegt.

### req-fach-013 -- Indikatoren als Objekte

Indikatoren werden als eigenständige Objekte behandelt. Sie besitzen eigene Parameter und stellen definierte Ergebnisse bereit, die in Berechnungsverfahren und Bedingungen verwendet werden können.

Bedingungen vergleichen konkrete Ergebnisse beziehungsweise Ausgaben von Objekten. Ein Indikator mit nur einer fachlich relevanten Ausgabe kann in der Benutzeroberfläche vereinfacht dargestellt werden.

### req-fach-014 -- Zustandswechsel als Bedingung

Ein Zustandswechsel wie „Trendrichtung wechselt zu Aufwärts“ ist kein eigenes fachliches Objekt, sondern eine Bedingung auf dem Zustand beziehungsweise Ergebnis eines fachlichen Objekts. Zur Auswertung eines Zustandswechsels müssen vorheriger und aktueller Zustand über Auswertungszyklen hinweg verfügbar sein.

### req-fach-016 -- Einstiegssignal und Order getrennt

Die Einstiegslogik erzeugt ein Einstiegssignal. Das Einstiegssignal eröffnet nicht unmittelbar eine Position, sondern kann zur Erzeugung beziehungsweise Konfiguration einer konkreten Order verwendet werden.

Erstellung, Bestimmung und Prüfung einer konkreten Order richten sich nach dem fachlichen Ordermodell. Freigegebene Orders werden anschließend zur weiteren Verwaltung an den `OrderManager` übergeben.

Eine aktive beziehungsweise beim Broker angenommene Order bedeutet noch nicht, dass eine Position besteht. Eine Position entsteht durch Ausführung; bei Teilausführung können gleichzeitig eine Position und ein noch offener Rest der Order bestehen.

### req-fach-017 -- Informationsquellen des Orderablaufs

Die für Handelbarkeitsprüfung und Orderbestimmung benötigten Informationen stammen aus unterschiedlichen fachlichen Quellen und sind nicht pauschal Eigenschaften des Orderablaufs. Dazu gehören insbesondere Einstiegssignal beziehungsweise Einstiegsdefinition, Strategie beziehungsweise Strategieanwendung, Marktdaten, Konto, Risiko- und Orderregeln, Instrument sowie Broker- beziehungsweise Marginbedingungen.

Der Orderablauf muss diese Informationen verwenden beziehungsweise zusammenführen können. Die genaue Zuordnung und das fachliche Modell des Orderobjekts werden gesondert festgelegt.

### req-fach-018 -- Allgemeines fachliches Objekt Order

`Order` ist ein allgemeines fachliches Objekt für einen Auftrag an ein Handelskonto beziehungsweise dessen Broker.

Eine Order besteht von ihrer Erstellung bis zum Erreichen eines endgültigen Zustands. Dies gilt auch für Pending Orders, die über längere Zeit auf ihre Ausführung warten können. Ein endgültiger Zustand kann insbesondere durch Ausführung, Ablehnung, Stornierung oder Ablauf erreicht werden.

Das allgemeine Objekt `Order` enthält nur Eigenschaften und Verhalten, die für alle spezialisierten Ordertypen gemeinsam gelten.

### req-fach-019 -- Allgemeine Eigenschaften einer Order

Das allgemeine Objekt `Order` besitzt folgende Eigenschaften:

- `Order-ID` -- MUSS; interne eindeutige Identifikation unabhängig von einer gegebenenfalls durch Broker oder Handelskonto vergebenen ID.
- `Status` -- MUSS; aktueller Zustand der Order.
- `Konto` -- MUSS; das Handelskonto, an das die konkrete Order gerichtet ist. Eine konkrete Order kann nicht ohne Kontozuordnung zur Ausführung freigegeben werden.
- `Strategie-ID` -- KANN; Zuordnung zur verursachenden Strategie.
- `Bemerkung` -- KANN; freie zusätzliche Information.
- `geltende Regeln` -- 0..n; die für die Order geltenden Regeln werden der Order übergeben.

Weitere Eigenschaften werden nur dann in `Order` aufgenommen, wenn sie tatsächlich für alle spezialisierten Ordertypen gemeinsam benötigt werden.

### req-fach-020 -- Regeln für Orders

Konkrete Regeln sind nicht Bestandteil der Definition eines Ordertyps. Die für eine Order geltenden Regeln werden der Order übergeben.

Für Orders kann das allgemeine fachliche Objekt `Regel` mit seinen Methoden `prüfen()` und `bestimmen()` verwendet werden:

- `prüfen()` prüft einen fachlichen Sachverhalt und liefert ein eindeutig auswertbares Prüfergebnis.
- `bestimmen()` liefert einen definierten Wert für eine Order-Eigenschaft. Der Rückgabewert muss zu der Eigenschaft passen, deren Wert bestimmt werden soll.

Eine Order-Eigenschaft kann ihren Wert direkt erhalten oder durch eine ihr zugeordnete Regel mittels `bestimmen()` bestimmen lassen. Für Prüfungen kann eine Regel mittels `prüfen()` verwendet werden. Unterschiedliche spezialisierte Regeltypen werden derzeit nicht vorausgesetzt.

### req-fach-021 -- Bestimmung und Prüfung konkreter Orders

Das jeweilige konkrete Orderobjekt ist nach seiner Erstellung für die Bestimmung seiner noch zu bestimmenden Eigenschaften, seine Prüfung und seine Freigabe verantwortlich.

Dabei muss es:

1. direkt übergebene Eigenschaftswerte übernehmen können,
2. über Regeln mittels `bestimmen()` festgelegte Eigenschaftswerte bestimmen können,
3. die Vollständigkeit der für den konkreten Ordertyp erforderlichen Eigenschaften prüfen,
4. die geltenden Regeln mittels `prüfen()` ausführen und deren Ergebnisse auswerten,
5. die Order nur dann zur weiteren Ausführung freigeben, wenn die erforderlichen Eigenschaften bestimmt und die erforderlichen Prüfungen erfolgreich sind.

Kann eine erforderliche Eigenschaft nicht bestimmt werden oder ergibt eine erforderliche Prüfung mittels `prüfen()` kein positives Ergebnis, wird die Order nicht zur Ausführung freigegeben.

### req-fach-023 -- Spezialisierung nach Ordertyp

Konkrete Ordertypen werden als Spezialisierungen des allgemeinen Objekts `Order` modelliert:

`Order -> <Ordertyp>Order`

Ein spezialisiertes Orderobjekt definiert die für seinen Ordertyp zusätzlich erforderlichen Eigenschaften und das entsprechende Verhalten. Diese Eigenschaften können ebenfalls direkt gesetzt oder durch Regeln mittels `bestimmen()` bestimmt werden und durch Regeln mittels `prüfen()` geprüft werden.

### req-fach-024 -- Erweiterbare Ordertypen

Die verfügbaren Ordertypen dürfen nicht als abgeschlossene Liste im allgemeinen Objekt `Order` festgeschrieben werden.

Ein zusätzlicher Ordertyp wird als zusätzliches spezialisiertes Orderobjekt ergänzt. Bestehende Ordertypen sollen dafür nicht geändert werden müssen.

### req-fach-025 -- Ordertypen der ersten Entwicklungsphase

Die erste Entwicklungsphase beschränkt die unterstützten Ordertypen auf die Standard-Ordertypen von MetaTrader 5 (MT5).

Ob ein konkreter MT5-Ordertyp für ein bestimmtes Handelskonto beziehungsweise Instrument tatsächlich verfügbar ist, muss bei seiner Verwendung berücksichtigt werden.

Die Unterstützung weiterer Broker- oder Plattform-Ordertypen ist nicht Bestandteil dieser ersten Entwicklungsphase.

### req-fach-028 -- MarketOrder

`MarketOrder` ist ein spezialisierter Ordertyp für einen Auftrag zur Ausführung zum aktuell verfügbaren Marktpreis.

Zusätzlich zu den allgemeinen Eigenschaften von `Order` besitzt `MarketOrder`:

- `Instrument` -- MUSS; das zu handelnde Instrument.
- `Richtung` -- MUSS; `buy` oder `sell`.
- `Volumen` -- MUSS; die zu handelnde Menge.
- `Stop-Loss` -- KANN.
- `Take-Profit` -- KANN.

Ein vorgegebener Orderpreis ist keine Eigenschaft der `MarketOrder`; der tatsächliche Ausführungspreis entsteht bei der Ausführung.

### req-fach-032 -- CloseOrder

`CloseOrder` ist ein spezialisierter Ordertyp zum vollständigen oder teilweisen Schließen einer bestehenden Position.

Zusätzlich zu den allgemeinen Eigenschaften von `Order` besitzt `CloseOrder`:

- `Position` -- MUSS; eindeutige Referenz auf die zu schließende Position.
- `Volumen` -- KANN; das zu schließende Volumen.

Ist kein Volumen angegeben, wird die gesamte Position geschlossen. Ist ein zulässiges geringeres Volumen angegeben, wird die Position teilweise geschlossen. Ein angegebenes Volumen darf das Volumen der referenzierten Position nicht überschreiten.

Instrument und Handelsrichtung werden nicht zusätzlich in `CloseOrder` geführt, sofern sie eindeutig aus der referenzierten Position hervorgehen.

Für `CloseOrder` gelten die allgemeinen Mechanismen von `Order` für direkte Werte, Regeln zur Bestimmung und Prüfung sowie Freigabe. Darüber hinaus ist derzeit kein eigener fachlicher Methodenbestand erforderlich.

### req-fach-033 -- Strategieunabhängige Nutzung von Orderobjekten

Orderobjekte sind strategieunabhängige fachliche Objekte. Sie können von unterschiedlichen fachlichen Komponenten erzeugt und verwendet werden.

Eine Strategie erzeugt selbst keine konkrete Order, sondern ein `Signal`. Für die Ausführung eines Signals im eigenen Handelssystem erzeugt der `OrderBuilder` daraus die konkrete Order. Andere fachliche Komponenten, insbesondere eine spätere Positionsverwaltung, können unabhängig davon ebenfalls Orders erzeugen und an den `OrderManager` übergeben.

### req-fach-034 -- Allgemeines fachliches Objekt Regel

`Regel` ist ein eigenständig adressierbares und wiederverwendbares fachliches Element des Designers. Konkrete Regeln müssen in der GUI verfügbar sein und von anderen fachlichen Elementen verwendet werden können.

### req-fach-035 -- Eigenschaften einer Regel

Eine Regel besitzt mindestens folgende fachliche Eigenschaften:

- `Regel-ID` -- eindeutige Identifikation der Regel.
- `Bezeichnung` -- fachlich verständliche Benennung der Regel.
- `fachlicher Ausdruck` -- Definition der fachlichen Berechnung beziehungsweise Prüfung der Regel.

### req-fach-036 -- Fachlicher Ausdruck einer Regel

Der fachliche Ausdruck einer Regel kann verwenden:

- konstante Werte,
- Eigenschaften und Ergebnisse fachlicher Objekte,
- Ergebnisse anderer Regeln,
- arithmetische Operatoren,
- Vergleichsoperatoren,
- logische Operatoren.

Für die erste Fassung wird der Ausdruck auf diese Operatorarten begrenzt. Funktionen innerhalb des fachlichen Ausdrucks sind derzeit nicht festgelegt.

### req-fach-037 -- Prüfen und Bestimmen durch Regeln

Regeln können für zwei fachliche Aufgaben verwendet werden:

- `prüfen` prüft einen fachlichen Sachverhalt und liefert ein auswertbares Prüfergebnis.
- `bestimmen` bestimmt einen fachlichen Wert.

Derzeit gibt es dafür einen gemeinsamen fachlichen Objekttyp `Regel`. Ob später unterschiedliche spezialisierte Regeltypen benötigt werden, ist nicht festgelegt.

### req-fach-037a -- Bedingungen und Regeln

Eine Bedingung ist Bestandteil der fachlichen Strategie-Logik und wertet einen fachlichen Sachverhalt aus. Sie ist kein Regelobjekt und muss nicht als wiederverwendbare Regel definiert werden.

Eine Bedingung kann unmittelbar Eigenschaften und Ergebnisse fachlicher Objekte verwenden und Ergebnisse von Regeln einbeziehen. Regeln bleiben dabei eigenständige, adressierbare und wiederverwendbare fachliche Objekte.

### req-fach-038 -- Komponierbare Regeln und freie Granularität

Eine Regel darf Ergebnisse anderer Regeln in ihrem fachlichen Ausdruck verwenden. Regeln sind damit fachlich komponierbar.

Es besteht keine Verpflichtung, Regeln in einzelne Teilregeln zu zerlegen. Eine fachliche Berechnung kann unmittelbar Bestandteil einer Regel sein. Eine feinere Zerlegung in eigenständige Regeln muss jedoch möglich sein, insbesondere wenn die Teilregeln eigenständig wiederverwendet werden sollen.

### req-fach-039 -- Fachliche Informationsquellen für Regeln

Alle fachlichen Informationen, die in Regeln verwendet werden, müssen über fachliche Objekte und deren definierte Eigenschaften oder Ergebnisse zugänglich sein. Regeln greifen nicht auf fachlich nicht abgebildete technische Rohdaten oder versteckte Variablen zurück.

### req-fach-040 -- Kontextbindung einer Regel

Eine Regel kann unabhängig von konkreten Objektinstanzen definiert werden. Der fachliche Ausdruck beschreibt die benötigten fachlichen Objekte, Eigenschaften und Ergebnisse.

Die Zuordnung zu den konkreten Objektinstanzen erfolgt bei der Anwendung beziehungsweise Ausführung der Regel aus dem jeweiligen fachlichen Kontext. Ist ein benötigtes Objekt durch diesen Kontext bereits eindeutig bestimmt, muss es in der Regeldefinition nicht als konkrete Instanz festgelegt werden.

### req-fach-041 -- RegelSet als geordnete Regelsammlung

`RegelSet` ist eine benannte, geordnete Sammlung eigenständiger Regeln. Es dient dazu, mehrere Regeln gemeinsam zu verwenden beziehungsweise auszuwerten, ohne sie dadurch zu einer einzelnen Regel zusammenzufassen.

Dieselbe Regel kann in mehreren RegelSets verwendet werden. Die Mitgliedschaft in einem RegelSet verändert die Regel selbst nicht.

### req-fach-042 -- Einzelergebnisse im RegelSet

Die in einem RegelSet enthaltenen Regeln behalten ihre Identität und ihre jeweiligen Ergebnisse. Ein RegelSet kann daher Regeln mit unterschiedlichen Aufgaben und Ergebnisarten enthalten, insbesondere Regeln zum `prüfen` und Regeln zum `bestimmen`.

### req-fach-043 -- Optionales Gesamtergebnis eines RegelSets

Ein RegelSet besitzt nicht zwingend ein eigenes Gesamtergebnis.

Soll ein RegelSet ein Gesamtergebnis liefern, muss dessen Bestimmung ausdrücklich definiert sein. Aus den Ergebnissen der enthaltenen Regeln wird kein automatisches Gesamtergebnis abgeleitet.

### req-fach-044 -- Reihenfolge der Regeln im RegelSet

Die Reihenfolge der enthaltenen Regeln ist Bestandteil des RegelSets. Die Regeln werden grundsätzlich in dieser Reihenfolge ausgewertet. Der Nutzer muss die Reihenfolge ändern können.

### req-fach-045 -- Behandlung fehlerhafter Reihenfolgen offen

Wie ungültige Reihenfolgen, nicht erfüllte Abhängigkeiten oder vergleichbare Konfigurationsfehler erkannt und behandelt werden, ist derzeit nicht festgelegt. Dies kann später im Zusammenhang mit der Validierung, dem Testen oder Debuggen von Strategien konkretisiert werden.


## 3. Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-09-24 | Aus dem bisherigen gemeinsamen Anforderungsdokument ausgegliedert. Bestehende fachliche Festlegungen und IDs wurden übernommen. |
