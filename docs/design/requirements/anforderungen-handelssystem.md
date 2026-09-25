# Anforderungen an das Handelssystem

## Dokumentstatus

- status: `draft`
- zweck: Anforderungen an Anwendung und Ausführung von Strategien auf konkreten Handelskonten
- zuletzt aktualisiert: `2026-09-24`

## 1. Zweck und Abgrenzung

Das Handelssystem beginnt dort, wo Strategiedefinitionen auf konkrete Konten angewendet und zur Laufzeit ausgeführt werden. Das gemeinsame fachliche Modell steht in `fachmodell.md`; Anforderungen an die Gestaltung von Strategien stehen in `anforderungen-strategiedesigner.md`.

Der `OrderManager`, der `OrderBuilder`, Kontoanbindung, laufende Orderverwaltung und das fachliche Nachrichtensystem gehören zum Handelssystem. Die technische Aufteilung in Programme oder eigenständig ausführbare Module bleibt offen.

## 2. Kommunikation im Handelssystem

### req-grund-003 -- Fachliches Nachrichtensystem

Für die Kommunikation zwischen eigenständig arbeitenden Komponenten des Handelssystems wird ein gemeinsames fachliches Nachrichtensystem vorgesehen. Komponenten übergeben vollständig beschriebene Nachrichten an einen Übertragungsmechanismus und müssen Nachrichten von diesem empfangen können.

Der Übertragungsmechanismus ist für Transport und Adressauflösung zuständig. Seine konkrete technische Ausgestaltung und Benennung sind noch nicht festgelegt. Insbesondere wird nicht vorausgesetzt, dass Sender und Empfänger im selben Prozess oder auf demselben Rechner laufen.

### req-grund-004 -- Allgemeines Nachrichtenformat

Eine Nachricht besitzt mindestens folgende Eigenschaften:

- `Nachrichten-ID` -- MUSS; vom Absender vergebene eindeutige Identifikation der einzelnen Nachricht.
- `Absender` -- MUSS; fachlicher Absender der Nachricht.
- `Adressat` -- MUSS; fachliches Ziel der Nachricht. Bei Nachrichten des `OrderManager` an die Kontoanbindung ist dies das betreffende `Konto`. Die Auflösung des fachlichen Adressaten auf den tatsächlichen Kommunikationsweg beziehungsweise die zuständige Komponente ist Aufgabe des Übertragungsmechanismus.
- `Priorität` -- MUSS; bestimmt die relative Dringlichkeit der Nachricht. Konkrete Prioritätswerte und deren Wirkung sind noch nicht festgelegt.
- `Nachrichtenart` -- MUSS; bezeichnet die vom Empfänger zu verarbeitende fachliche Funktion beziehungsweise den Zweck der Nachricht. Für einen ersten Prototyp kann die Nachrichtenart dem Namen der zugehörigen Empfangsfunktion entsprechen.
- `Inhalt` -- MUSS; enthält die für die Nachrichtenart erforderlichen fachlichen Daten beziehungsweise fachlichen Objekte.
- `Bezug-Nachrichten-ID` -- KANN; verweist insbesondere bei einer Antwort auf die auslösende Nachricht.

Die Bedeutung einer Nachricht darf nicht davon abhängen, dass Informationen wie der Absender aus dem Format der `Nachrichten-ID` abgeleitet werden.

### req-grund-005 -- Fachliche Objekte als Nachrichteninhalt

Vorhandene fachliche Objekte sollen unmittelbar als Nachrichteninhalt verwendet werden können, wenn sie den benötigten Inhalt bereits vollständig beschreiben. Eine konkrete `Order` kann damit beispielsweise als Inhalt einer Nachricht zur Übermittlung dieser Order dienen.

Für Abfragen und Rückmeldungen werden nur die fachlichen Nachrichtenarten und Inhalte definiert, die tatsächlich benötigt werden. Eine zusätzliche Hierarchie aus Anfrage-, Antwort- und Ereignisobjekten wird derzeit nicht vorausgesetzt.

### req-grund-006 -- Pull und Push über dasselbe Nachrichtenmodell

Das Nachrichtensystem muss sowohl angeforderte Kommunikation als auch unaufgeforderte Mitteilungen unterstützen.

Bei einer Abfrage erzeugt der anfragende Absender eine eigene `Nachrichten-ID`. Eine Antwort kann über `Bezug-Nachrichten-ID` eindeutig auf diese Nachricht verweisen.

Eine Komponente kann dieselbe fachliche Information auch ohne vorausgehende Anfrage senden. Damit können insbesondere Zustandsänderungen zeitnah übermittelt werden, während zusätzlich eine aktive Abfrage des aktuellen Zustands möglich bleibt.

Für den `OrderManager` sind derzeit insbesondere folgende Kommunikationsbedarfe bekannt:

- Übermittlung einer konkreten Order an das der Order zugeordnete Konto,
- Abfrage von `Orderinformation` zur Statuspflege und Überwachung,
- Empfang von `Orderinformation` als Antwort auf eine Abfrage oder als unaufgeforderte Mitteilung,
- Abfrage von `Kontoinformation`; dabei sollen die verfügbaren aktuellen Kontoparameter gemeinsam geliefert werden, statt für einzelne Kontowerte jeweils eigene Anfragearten zu definieren.

Die konkreten Nachrichtenarten, ihre endgültige Benennung sowie die genaue Struktur von `Orderinformation` und `Kontoinformation` werden bei ihrer fachlichen Definition festgelegt.

## 3. Ordererzeugung und Orderverwaltung zur Laufzeit

### req-grund-007 -- OrderBuilder zwischen Signal und OrderManager

Das fachliche Ergebnis einer Strategie ist ein `Signal`. Ein Signal führt nicht zwingend zur Erzeugung einer Order und muss unabhängig vom Ordermodell des Handelssystems weiterverarbeitet werden können. Insbesondere muss eine alternative Verarbeitung oder Weitergabe des Signals, beispielsweise an ein anderes Handelssystem beziehungsweise eine andere Handelsplattform, möglich bleiben.

Für die Ausführung eines Signals im eigenen Handelssystem gibt es einen `OrderBuilder` als Schnittstelle beziehungsweise Komponente des Handelssystems. Der `OrderBuilder` ist kein zusätzliches fachliches Trading-Objekt.

Der `OrderBuilder` erhält das Signal, die zugehörige Order-Konfiguration aus der Strategiedefinition und das konkrete `Konto`, auf dem die Strategie angewendet wird. Daraus erzeugt er eine konkrete Order des konfigurierten Ordertyps und übergibt ihr die vorgesehenen direkten Eigenschaftswerte und Regeln. Dazu gehört auch eine in der Strategie konfigurierte Bedingung oder Regel für die fortbestehende Gültigkeit einer aktiven Order.

Die fachliche Bestimmung noch zu bestimmender Order-Eigenschaften sowie die fachliche Prüfung der Order bleiben Aufgabe der Order und der von ihr verwendeten Regeln. Der `OrderBuilder` übernimmt diese Aufgaben nicht.

Nur eine erfolgreich freigegebene konkrete Order wird an den `OrderManager` übergeben. Der `OrderManager` benötigt dafür keine Kenntnis der verursachenden Strategie oder des Signals.

### req-fach-022 -- OrderManager

Für die Verwaltung bestehender Orders gibt es einen eigenständigen `OrderManager`.

Der `OrderManager` verwaltet mehrere gleichzeitig bestehende Orders und deren Lebenszyklus. Dazu gehören insbesondere die Verwaltung aktiver Orders anhand ihrer Order-ID und die Überwachung ihres Status.

Die fachliche Bestimmung von Order-Eigenschaften und die fachliche Auswertung der für eine konkrete Order geltenden Regeln gehören nicht zur Aufgabe des `OrderManager`. Der `OrderManager` darf erforderliche Prüfungen anstoßen und auf deren Ergebnis reagieren; die fachliche Auswertung selbst erfolgt durch die Order beziehungsweise die von ihr verwendete Regel.

### req-fach-026 -- Trennung von Strategiedefinition, Order und Kontoanbindung

Eine Strategie muss bei ihrer Gestaltung und Definition nicht an ein bestimmtes Handelskonto gebunden sein.

Eine konkrete `Order` ist dagegen immer ein Auftrag an ein bestimmtes Handelskonto. Vor ihrer Freigabe zur Ausführung MUSS daher das Zielkonto bestimmt und als Eigenschaft der Order gesetzt sein.

Die technische Anbindung dieses Kontos wird vom fachlichen Ordermodell getrennt. Eine Konto-Schnittstelle bildet die fachliche Order auf die Möglichkeiten des konkreten Handelskontos beziehungsweise Brokers ab.

### req-fach-029 -- Übergabe freigegebener Orders

Nach erfolgreicher Bestimmung und Prüfung wird eine freigegebene Order an den `OrderManager` übergeben.

Der `OrderManager` übermittelt die Order über das fachliche Nachrichtensystem an das der Order zugeordnete `Konto`. Die Auflösung auf die zuständige Konto-Schnittstelle und den konkreten Kommunikationsweg erfolgt durch den Übertragungsmechanismus. Anschließend verwaltet der `OrderManager` den weiteren Lebenszyklus der Order.

Das Orderobjekt selbst muss die konkrete Konto- oder MT5-Anbindung nicht kennen.

### req-fach-030 -- Getrennte Zustände von Order und OrderManager

Der fachliche Zustand einer Order und der Verarbeitungszustand der Order im `OrderManager` sind getrennt zu behandeln.

Der Orderstatus beschreibt den Zustand der Order selbst. Der Verarbeitungsstatus des `OrderManager` beschreibt dagegen, wie der `OrderManager` die Order aktuell verarbeitet beziehungsweise verwaltet.

Die konkreten Statuswerte und ihre Abbildung auf MT5 sind noch festzulegen.

### req-fach-031 -- Überwachung aktiver Orders

Bei aktiven Orders sind mindestens zwei unterschiedliche Sachverhalte zu überwachen:

- der externe Zustand der beim Handelssystem beziehungsweise Broker liegenden Order,
- die fortbestehende fachliche Gültigkeit der Order.

Eine Order kann fachlich ungültig werden, bevor sie ausgeführt wurde, beispielsweise wenn die Handelssituation, auf der sie beruht, nicht mehr besteht.

Die Order hält beziehungsweise verwendet die für ihre fortbestehende Gültigkeit maßgebliche Bedingung oder Regel, die ihr beim Erzeugen aus der Strategiekonfiguration übergeben wurde. Der `OrderManager` stößt eine Prüfung an, wenn sie periodisch fällig ist oder wenn eine Nachricht eine Prüfung fordert beziehungsweise erforderlich macht. Die fachliche Auswertung der Bedingung beziehungsweise Regel erfolgt nicht im `OrderManager`. Ergibt die Prüfung, dass eine aktive Order fachlich ungültig ist, veranlasst der `OrderManager` ihre Stornierung über das fachliche Nachrichtensystem.

Eine Order kann damit einen endgültigen Zustand erreichen, ohne jemals eine Position erzeugt zu haben.

## 4. Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-09-24 | Aus dem bisherigen gemeinsamen Anforderungsdokument ausgegliedert. OrderManager-, Kontoanbindungs-, Überwachungs- und Kommunikationsanforderungen wurden übernommen. |
| 2026-09-24 | `OrderBuilder` zwischen Signal und OrderManager ergänzt; Übergabe und Stornierung auf das fachliche Nachrichtensystem korrigiert; Auslösung von Orderprüfungen auf periodische Prüfung oder auslösende Nachricht präzisiert. |
