# Fachmodell des Trading-Systems

## Dokumentstatus

- status: `draft`
- zweck: Gemeinsame, wiederverwendbare fachliche Begriffe, Objekte und Zusammenhänge für Strategiedesigner und Handelssystem
- zuletzt aktualisiert: `2026-10-13`

## 1. Zweck und Abgrenzung

Dieses Dokument beschreibt das gemeinsame fachliche Modell. Es enthält keine GUI-Anforderungen des Strategiedesigners und keine Infrastruktur- oder Laufzeitanforderungen des Handelssystems. Bestehende Anforderungs-IDs werden zur Nachvollziehbarkeit beibehalten.

## 2. Objekte und Zusammenhänge

### req-fach-010 -- Objekt Trend

Das Objekt `Trend` beschreibt die Richtung einer Entwicklung innerhalb einer bestimmten Zeiteinheit.

`Trend` besitzt mindestens folgende Eigenschaften:

-   `Richtung` -- vom Berechnungsverfahren ermittelte Eigenschaft,
-   `Zeiteinheit` -- bezeichnet die betrachtete Zeitreihe beziehungsweise den Chart und damit den zeitlichen Geltungsbereich der Trendaussage,
-   `Berechnungsverfahren` -- bestimmt, wie die Trendrichtung ermittelt wird.

Ein eigener `Betrachtungshorizont` ist keine allgemeine Eigenschaft des Trends. Benötigte Perioden, Zeitspannen oder Mindestdauern gehören zu dem Berechnungsverfahren beziehungsweise zu den darin verwendeten Komponenten.

Der Trend ist nicht an ein bestimmtes Berechnungsverfahren oder einen bestimmten Indikator gebunden.

### req-fach-011 -- Berechnungsverfahren und Indikatoren eines Trends

Das Berechnungsverfahren eines Trends verwendet einen oder mehrere Indikatoren. Bei mehreren Indikatoren kann das Berechnungsverfahren deren Eigenschaften nach einer geeigneten Verknüpfungsregel zusammenführen. Dazu können insbesondere Übereinstimmung, alternative Erfüllung, Mehrheitsentscheidung, Gewichtung beziehungsweise Priorisierung oder eine eigene Berechnung gehören. Diese Aufzählung ist nicht abschließend.

Das Berechnungsverfahren und seine Indikatoren bestimmen, welche Daten beziehungsweise Wertreihen für die Trendbestimmung benötigt werden. Der Objekttyp `Trend` legt diese Eingangsdaten nicht allgemein fest.

Die Zeiteinheit ist eine Vorgabe des Trends und kann die Auswahl beziehungsweise Parametrisierung des Berechnungsverfahrens und seiner Komponenten beeinflussen.

### req-fach-012 -- Weitere Eigenschaften verwendeter Indikatoren

Indikatoren eines Trend-Berechnungsverfahrens können neben den für die Trendrichtung benötigten Eigenschaften weitere Eigenschaften bereitstellen. Diese Eigenschaften bleiben dem jeweiligen Indikator zugeordnet und werden nicht zu Eigenschaften des Trends.

Sie müssen jedoch über die Struktur des Trendobjekts für andere Elemente referenzierbar sein. Die konkrete Darstellung und Zugriffssyntax ist noch nicht festgelegt.

### req-fach-013 -- Indikatoren als Objekte

Indikatoren werden als eigenständige Objekte behandelt. Sie besitzen eigene Parameter und stellen definierte Eigenschaften bereit, die in Berechnungsverfahren und Bedingungen verwendet werden können.

Bedingungen vergleichen konkrete Eigenschaften von Objekten. Ein Indikator mit nur einer fachlich relevanten berechneten Eigenschaft kann in der Benutzeroberfläche vereinfacht dargestellt werden.

### req-fach-013a -- Aufbau und Wiederverwendung von Indikatoren und Trends

Ein Indikator kann aus fest programmierten Einheiten, aus Regeln oder aus einer Kombination von beidem bestehen. Für die Verwendung in Strategien ist das nicht unterscheidbar: Jeder Indikator beschreibt seine Parameter und berechneten Eigenschaften auf dieselbe Weise.

Ein konfigurierter Indikator und ein konfigurierter Trend sind eigenständige Objekte. Sie werden einmal angelegt und können in beliebig vielen Strategien verwendet werden. Eine Strategie verweist auf sie und enthält sie nicht als Kopie.

### req-fach-014 -- Zustandswechsel als Bedingung

Ein Zustandswechsel wie „Trendrichtung wechselt zu Aufwärts“ ist kein eigenes Objekt, sondern eine Bedingung auf dem Zustand beziehungsweise einer Eigenschaft eines Objekts. Zur Auswertung eines Zustandswechsels müssen vorheriger und aktueller Zustand über Auswertungszyklen hinweg verfügbar sein.

### req-fach-016 -- Strategieentscheidung und Order getrennt

Eine Strategie erzeugt nicht selbst unmittelbar eine konkrete Order. Wenn ihr Ablauf nach Auswertung der erforderlichen Bedingungen eine Order veranlassen soll, erreicht er das Element `Order aufgeben`. Dieses legt Ordertyp und Parameter fest und übergibt die Order an das Handelssystem. Ein zusätzliches Objekt `Signal` wird dafür derzeit nicht benötigt.

Erstellung, Bestimmung und Prüfung einer konkreten Order richten sich nach dem fachlichen Ordermodell. Freigegebene Orders werden anschließend zur weiteren Verwaltung an den `OrderManager` übergeben.

Eine aktive beziehungsweise beim Broker angenommene Order bedeutet noch nicht, dass eine Position besteht. Eine Position entsteht durch Ausführung. Bei Teilausführung können gleichzeitig eine Position und ein noch offener Rest der Order bestehen.

### req-fach-017 -- Informationsquellen des Orderablaufs

Die für Handelbarkeitsprüfung und Orderbestimmung benötigten Informationen stammen aus unterschiedlichen fachlichen Quellen und sind nicht pauschal Eigenschaften des Orderablaufs. Dazu gehören insbesondere die im Strategieablauf bestimmte Order-Konfiguration, Strategie beziehungsweise Strategieanwendung, Marktdaten, Konto, Risiko- und Orderregeln, Instrument sowie Broker- beziehungsweise Marginbedingungen.

Der Orderablauf muss diese Informationen verwenden beziehungsweise zusammenführen können. Die genaue Zuordnung und das fachliche Modell des Orderobjekts werden gesondert festgelegt.

### req-fach-018 -- Allgemeines Objekt Order

`Order` ist ein allgemeines Objekt für einen Auftrag an ein Handelskonto beziehungsweise dessen Broker.

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

Für Orders kann das allgemeine Objekt `Regel` mit seinen Methoden `prüfen()` und `bestimmen()` verwendet werden:

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

Ein vorgegebener Orderpreis ist keine Eigenschaft der `MarketOrder`. Der tatsächliche Ausführungspreis entsteht bei der Ausführung.

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
- `Bezeichnung` -- fachlich verständliche Benennung der Regel.
- `fachlicher Ausdruck` -- Definition der fachlichen Berechnung beziehungsweise Prüfung der Regel.

### req-fach-036 -- Fachlicher Ausdruck einer Regel

Der fachliche Ausdruck einer Regel kann verwenden:

- konstante Werte,
- Eigenschaften von Objekten,
- Ergebnisse anderer Regeln,
- arithmetische Operatoren,
- Vergleichsoperatoren,
- logische Operatoren.

Für die erste Fassung wird der Ausdruck auf diese Operatorarten begrenzt. Funktionen innerhalb des fachlichen Ausdrucks sind derzeit nicht festgelegt.

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

`Regelwerk` ist eine benannte, geordnete Sammlung eigenständiger Regeln. Es dient dazu, mehrere Regeln gemeinsam zu verwenden beziehungsweise auszuwerten, ohne sie dadurch zu einer einzelnen Regel zusammenzufassen.

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

- `Strategie-ID` -- eindeutige, von der Bezeichnung unabhängige Identifikation,
- `Bezeichnung` -- vom Nutzer änderbare fachliche Benennung,
- `Beschreibung` -- freie Beschreibung beziehungsweise Anmerkung,
- `Auslöser` -- ein oder mehrere Auslöser, die festlegen, bei welchem Ereignis die Strategie ausgewertet werden soll,
- `Ablauf` -- die im Designer festgelegte fachliche Abfolge,
- strategiebezogene `Regeln` -- soweit Regeln für die Strategie als Ganzes gelten.

Eine Strategie hat mindestens einen Auslöser. Eine Obergrenze besteht nicht. Jeder Auslöser ist ein Element auf der Zeichenfläche und steht am Anfang des Ablaufs. Er besitzt eine eigene Verbindung in den Ablauf. Mehrere Auslöser können auf denselben oder auf verschiedene Teile des Ablaufs führen.

Eine eigene Versionsangabe der Strategie wird für den ersten Prototyp derzeit nicht vorausgesetzt. Eine zentrale, vom Ablauf getrennte Liste aller verwendeten Objekte wird ebenfalls nicht vorausgesetzt. Die verwendeten Objekte sind Bestandteil des Ablaufs dort, wo sie verwendet werden.

Eine gesonderte Sammlung von Strategieparametern wird derzeit nicht vorausgesetzt. Eigenschaften verwendeter Objekte können mit einem festen Wert, durch eine Berechnung beziehungsweise eine Regel oder erst bei der Anwendung der Strategie zur Laufzeit belegt werden. Eigene Parameter der Strategie können ergänzt werden, wenn dafür ein konkreter fachlicher Bedarf entsteht.

### req-fach-047 -- Ablauf einer Strategie

Der `Ablauf` ist Bestandteil einer Strategie und derzeit kein eigenständiges Objekt. Er bildet fachlich das ab, was der Nutzer im Designer als Strategie anordnet und verbindet.

Die Ablaufverbindung ist sequenziell und legt fest, welches Element als Nächstes ausgeführt wird. Eine Bedingung kann den Ablauf anhand ihres Ergebnisses verzweigen. Der `wahr`-Pfad führt zu einem nachfolgenden Element. Ein `falsch`-Pfad kann zu einem anderen Element führen oder ohne Fortsetzung enden.

Ein eigenes Start- oder Endelement wird nicht vorausgesetzt. Die Auswertung beginnt bei dem Auslöser-Element, das eingetreten ist, und folgt dessen Verbindung. Ein Ablaufpfad endet, wenn kein weiteres Element folgt.

### req-fach-048 -- Berechnung im Strategieablauf

Eine `Berechnung` ist ein Element und derzeit kein eigenständiges Objekt.

Sie wertet einen fachlichen Ausdruck aus und liefert ein Ergebnis. Als Eingaben können insbesondere konstante Werte, Eigenschaften von Objekten sowie Ergebnisse von Regeln und anderen Berechnungen verwendet werden.

Eine Berechnung muss nicht als `Regel` definiert werden. Die technische Auswertung von Berechnungen, Regeln und Bedingungen darf gemeinsame Mechanismen verwenden. Ihre unterschiedliche fachliche Bedeutung bleibt erhalten.

### req-fach-049 -- Order aufgeben im Strategieablauf

`Order aufgeben` ist das Element im Strategieablauf, das eine Order veranlasst. Es legt Ordertyp und Parameter der Order fest und übergibt die Order an das Handelssystem. Es wird nur erreicht, wenn eine vorherige Bedingung auf den entsprechenden Ablaufpfad verzweigt. Ist die Bedingung nicht erfüllt und besitzt der andere Pfad keine Fortsetzung, endet dieser Ablaufpfad.

Offen: ob das Handelssystem dafür einen eigenen OrderBuilder verwendet.

Ein allgemeiner Objekttyp `Aktion` wird daraus derzeit nicht abgeleitet.

### req-fach-049a -- Elemente für bestehende Orders und Positionen

Neben `Order aufgeben` gibt es im Strategieablauf vier Elemente, die auf bereits bestehende Orders oder Positionen wirken:

| Element | wirkt auf | Inhalt |
|---|---|---|
| `Order ändern` | wartende Order | Preis, Stop-Loss, Take-Profit, Gültigkeit |
| `Order löschen` | wartende Order | -- |
| `Position ändern` | offene Position | Stop-Loss, Take-Profit |
| `Position schließen` | offene Position | ganz oder teilweise; Volumen KANN, ohne Volumen wird die Position ganz geschlossen |

`Position schließen` veranlasst eine `CloseOrder` nach req-fach-032. Die Namen folgen den Aktionen von MetaTrader 5. Ob eine Handelssoftware diese Aktionen anbietet, ergibt sich aus der Kompatibilitätsliste nach req-fach-030.

Offen: wie ein Element die betroffene Order beziehungsweise Position bestimmt.


## 3. Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-11 | Aufbau und Wiederverwendung von Indikatoren und Trends festgelegt. Pending-Ordertypen von MetaTrader 5 als Entwurf ergänzt. Herkunft und Verfügbarkeit von Ordertypen festgelegt. Abgestimmt mit dem Nutzer am 2026-10-11. |
| 2026-09-24 | Aus dem bisherigen gemeinsamen Anforderungsdokument ausgegliedert. Bestehende fachliche Festlegungen und IDs wurden übernommen. |
| 2026-09-25 | `Strategie` als fachliches Objekt sowie Ablauf, Berechnung und Beauftragung des `OrderBuilder` konkretisiert; separates `Signal`-Objekt aus dem aktuellen Modell entfernt. |
| 2026-10-12 | Begriffe abgestimmt: Objekt, Element, Regelwerk, Eigenschaft, Parameter, Ergebnis. Mehrere Auslöser als Elemente zulässig. Element „Order aufgeben“, OrderBuilder offen. |
| 2026-10-13 | req-fach-045: fehlerhafte Reihenfolge im Regelwerk festgelegt (Vorwärtsbezug, Zirkelbezug, keine selbsttätige Umsortierung). Abgestimmt mit dem Auftraggeber im Chat am 2026-10-13. |
| 2026-10-13 | req-fach-030 geändert: eigene Ordertypen von Pipwerk mit Bedeutung nach MetaTrader 5, Kompatibilitätsliste je Anbindung, keine annähernde Übersetzung. req-fach-025 und req-fach-029 angeglichen. Abgestimmt mit dem Auftraggeber im Chat am 2026-10-13. |
| 2026-10-13 | req-fach-049a: Elemente Order ändern, Order löschen, Position ändern, Position schließen. Abgestimmt mit dem Auftraggeber im Chat am 2026-10-13. |
| 2026-10-13 | req-fach-029: Handelsrichtung als Eigenschaft bei allen Ordertypen, drei wartende Ordertypen Stop-Order, Limit-Order, Stop-Limit-Order. Abgestimmt mit dem Auftraggeber im Chat am 2026-10-13. |
| 2026-10-13 | req-fach-029: Gültigkeit wartender Orders mit vier Werten statt Ablaufzeit. Abgestimmt mit dem Auftraggeber im Chat am 2026-10-13. |
| 2026-10-13 | req-fach-029: Ausführungsbedingung bewusst nicht Teil der Strategie, Wahl durch die Anbindung. Abgestimmt mit dem Auftraggeber im Chat am 2026-10-13. |
| 2026-10-13 | req-fach-029: zulässige Kursabweichung nicht Teil der Strategie, möglicherweise später im Handelssystem. Abgestimmt mit dem Auftraggeber im Chat am 2026-10-13. |
| 2026-10-13 | req-fach-029: Schließen gegen Gegenposition nicht vorgesehen. Erfassung der Ordertypen nach MetaTrader 5 abgeschlossen, Vermerk Entwurf entfernt. Abgestimmt mit dem Auftraggeber im Chat am 2026-10-13. |
