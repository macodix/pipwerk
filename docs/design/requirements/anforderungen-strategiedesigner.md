# Anforderungen an den Trading-Strategiedesigner

## Dokumentstatus

- status: `draft`
- zweck: Anforderungen an das Werkzeug zur Gestaltung und Bearbeitung von Handelsstrategien
- zuletzt aktualisiert: `2026-10-22`
- abgestimmt: [Präsentation Anforderungen Strategiedesigner](praesentation-anforderungen-strategiedesigner.html), bestätigt vom Auftraggeber im Chat am 13. Oktober 2026 nach erster Durchsicht. Entscheidungen zu den Befunden der QA im Vorhaben `strategiedesign`: [Präsentation Prüfung der Dokumente](../../../development/strategiedesign/presentations/requirements-1.html), bestätigt vom Auftraggeber im Chat am 15. Oktober 2026.

## 1. Zweck und Abgrenzung

Dieses Dokument enthält ausschließlich Anforderungen an den `Strategiedesigner`. Wiederverwendbare fachliche Definitionen werden in `fachmodell.md` geführt. Anforderungen an die Anwendung und Ausführung von Strategien auf konkreten Konten werden in `anforderungen-handelssystem.md` geführt.

## 2. Systemabgrenzung

### req-grund-001 -- Trennung von Strategiedesigner und Handelssystem

Der `Strategiedesigner` dient der Gestaltung und Bearbeitung von Strategien, Regeln und den darin verwendeten Objekten. Sein Ergebnis ist eine ausführbare Strategie.

Die Zuordnung einer Strategie zu einem konkreten Handelskonto und deren laufende Anwendung auf diesem Konto gehören nicht zum Strategiedesigner, sondern zum `Handelssystem`.

Zum Handelssystem gehören insbesondere die zur Laufzeit entstehenden konkreten Orders und Positionen sowie deren Verwaltung und Überwachung. Der `OrderManager` ist Bestandteil des Handelssystems und kein Element, das im Strategiedesigner als Bestandteil einer Strategie platziert wird.

Die übergreifende technische Aufteilung und die eigenständige Ausführbarkeit der Hauptkomponenten werden in `anforderungen-gesamtsystem.md` festgelegt.

### req-grund-002 -- Trennung von Definition und Laufzeitinstanz

Eine Strategie kann Ordertypen, deren Eigenschaften und die Regeln zu ihrer Bestimmung und Prüfung festlegen, ohne einem konkreten Handelskonto zugeordnet zu sein.

Erst bei der Anwendung einer Strategie im Handelssystem erfolgt die Zuordnung zu einem konkreten Konto. Eine daraus erzeugte konkrete, ausführbare `Order` MUSS einem Konto zugeordnet sein.

## 3. Anforderungen an fachliche Arbeit im Designer

### req-fach-001 -- Objekte als Grundlage von Strategien

Der Nutzer muss Strategien mit Objekten erstellen können.

Beispiele sind:

-   Trend,
-   Indikator,
-   Konto, Instrument, Kerze, Tick, Order, Position, Strategie (Objekte der Anwendung, Fachmodell req-fach-051).

Marktphase, Bewegung und Korrektur sind keine eigenen Objekte. Sie ergeben sich aus Eigenschaften eines Indikators und dem Kurs, zum Beispiel aus den Wendepunkten des `ZigZag`.

Weitere Objekte können abhängig von der konkreten Strategie,
dem verwendeten Berechnungsverfahren oder anderen fachlichen
Anforderungen hinzukommen.

### req-fach-002 -- Fachbegriffe bleiben sichtbar

Die Fachbegriffe müssen in der grafischen Darstellung sichtbar bleiben.
Sie dürfen auf der primären Arbeitsebene nicht durch allgemeine
technische Begriffe ersetzt werden.

### req-fach-003 -- Ausführbare Bedeutung

Ein Objekt darf nicht nur eine grafische Beschriftung sein.
Es benötigt eine eindeutige fachliche Definition und eine ausführbare
Bedeutung für Prüfung, Backtest und Live-Ausführung.

### req-fach-004 -- Fachliche Bedingungen

Der Designer muss Bedingungen aus Eigenschaften von Objekten und Ergebnissen
bilden können.

Beispiele:

> Trendrichtung = long

> Trendrichtung != seitwärts

Welche Eigenschaften und Ergebnisse für eine Bedingung verfügbar sind, muss sich
aus den tatsächlich verwendeten Objekten und Berechnungen
ergeben und darf nicht für einzelne Strategien fest in der
Benutzeroberfläche hinterlegt sein.

### req-fach-005 -- Referenzierbare Eigenschaften und Ergebnisse

Eigenschaften von Objekten und Ergebnisse von Regeln, Bedingungen und Berechnungen müssen von nachfolgenden
Elementen einzeln verwendet werden können.

Welche Eigenschaften verfügbar sind, wird durch das jeweilige
Objekt beziehungsweise die darin verwendeten anderen Objekte und Berechnungsverfahren bestimmt.

### req-fach-006 -- Fachliche Objekte als Grundlage

Der Strategiedesigner arbeitet primär mit Objekten. Objekte repräsentieren
Begriffe und Funktionen der Handelsdomäne.

Der konkrete Inhalt und die Fähigkeiten eines Objekts dürfen
nicht vollständig und unveränderlich in der Benutzeroberfläche
festgelegt sein. Fachliche Objekte müssen erweiterbar beziehungsweise
konfigurierbar sein und ihre verfügbaren Eigenschaften und Parameter dem Designer maschinenlesbar zur Verfügung stellen können.

### req-fach-007 -- Zusammensetzbare Objekte

Objekte können andere Objekte oder Berechnungsverfahren verwenden oder enthalten. Dadurch muss ihre konkrete Ausprägung
konfigurierbar sein.

Beispielsweise kann ein Objekt `Trend` ein oder mehrere
Verfahren beziehungsweise Indikatoren zur Trendbestimmung verwenden.
Welche Indikatoren verwendet werden, ist nicht generell durch den
Designer vorgegeben, sondern Bestandteil der jeweiligen Konfiguration.

Die Benutzeroberfläche muss die von einem konkret konfigurierten Objekt
bereitgestellten Eigenschaften und Parameter dynamisch
darstellen können.

### req-fach-008 -- Keine unbegründete Austauschbarkeit

Unterschiedliche Berechnungsverfahren dürfen nicht allein deshalb als
austauschbar behandelt werden, weil sie einzelne gleich benannte
Eigenschaften liefern.

Eine Strategie kann Eigenschaften benötigen, die nur bestimmte
Verfahren bereitstellen. Beispielsweise kann eine Strategie neben einer
Trendrichtung zusätzliche Eigenschaften benötigen. Der Designer
muss solche Abhängigkeiten abbilden und prüfen können.

### req-fach-009 – Benutzerdefinierte Objekttypen

Der Strategiedesigner muss die Definition neuer Objekttypen ermöglichen, ohne dass dafür der Strategiedesigner selbst geändert werden muss.

Benutzerdefinierte Objekttypen müssen hinsichtlich Konfiguration, Parametrisierung, Eigenschaften sowie Wiederverwendung grundsätzlich wie mitgelieferte Objekttypen behandelt werden können.

Ein neuer Objekttyp kann insbesondere aus bereits vorhandenen Objekten, Indikatoren, Berechnungen oder Berechnungsverfahren zusammengesetzt werden.

Dadurch ist das fachliche Vokabular des Designers nicht auf die bei der Entwicklung bekannten Begriffe und Handelsansätze beschränkt. Wiederkehrende benutzerspezifische fachliche Konzepte können einmal definiert und anschließend in unterschiedlichen Strategien wiederverwendet werden.

Die konkrete technische Repräsentation eines Objekttyps – beispielsweise als Klasse, Schema, Graphdefinition oder durch einen anderen Mechanismus – ist nicht Bestandteil dieser Anforderung.

### req-fach-015 -- Auslöser für Strategieauswertung

Hat eine Strategie Auslöser, starten diese ihren Ablauf beziehungsweise werten ihn erneut aus. Eine Strategie kann Auslöser haben, muss aber nicht; ebenso die Order- und Positionsverwaltung. Jede Auswertung beginnt an einem Auslöser. Für den Start von Hand gibt es den Auslöser „Manuell“. Er steht nur im Hauptablauf, nicht in der Order- und Positionsverwaltung (Fachmodell req-fach-053). Eine Strategie ohne Auslöser lässt sich speichern, wird aber nicht ausgewertet. Jeder Auslöser ist ein Element auf der Zeichenfläche und steht am Anfang des Ablaufs oder am Anfang der Order- und Positionsverwaltung (Fachmodell, req-fach-049a). Die Auslösertypen und ihre Parameter legt das Fachmodell fest (req-fach-053): Kerzenschluss, Tick, Manuell und externes Ereignis. Die Order- und Positionsverwaltung kann eigene Auslöser-Elemente haben, innerhalb des Bereichs der Zeichenfläche, der am Ausgang „gestellt“ beginnt.

Bei einer Strategie mit Auslösern ergibt sich die Wiederholung einer Strategieauswertung aus erneut eintretenden Auslösern und erfordert nicht zwingend eine sichtbare grafische Rückschleife.

### req-fach-027 -- Ordertyp und Eigenschaften der Order in der Strategie

Eine Strategie muss den zu verwendenden Ordertyp festlegen können. Für den gewählten Ordertyp muss die Strategie dessen Eigenschaften mit direkten Werten und/oder Regeln mittels `bestimmen()` belegen können.

Welche Eigenschaften verfügbar beziehungsweise erforderlich sind, ergibt sich aus dem konkreten Ordertyp.

Unter welchen Bedingungen eine gestellte, noch wartende Order bestehen bleibt, legt die Strategie in der Order- und Positionsverwaltung dieser Order fest (Fachmodell, req-fach-049a), etwa wenn ein Setup nach dem Stellen einer wartenden Order entfällt.

## 4. Konfiguration und Parameter

### req-param-001 -- Konfigurierbare Objekte

Objekte müssen konfigurierbar sein. Zur Konfiguration kann
insbesondere die Zuordnung anderer Objekte oder Berechnungsverfahren gehören.

Beispielsweise kann einem Objekt ein bestimmter Indikator
oder ein bestimmtes Berechnungsverfahren zugeordnet werden.

### req-param-002 -- Parametrisierbare Objekte

Objekte und die von ihnen verwendeten Berechnungsverfahren müssen
parametrisierbar sein.

Parameter können beispielsweise sein:

-   Zeiteinheiten,
-   Periodenlängen,
-   Anzahl zu berücksichtigender Kerzen,
-   Schwellenwerte,
-   Parameter eines verwendeten Indikators.

Die verfügbaren Parameter sowie deren Datentypen, zulässige Werte und
gegebenenfalls Standardwerte müssen durch den jeweiligen Objekttyp
beschrieben werden und durch den Designer auslesbar sein.

### req-param-003 -- Zeitpunkt der Parameterbindung

Ein Parameter muss nicht zwingend bereits bei der Definition einer
Strategie einen konkreten Wert erhalten.

Der Strategiedesigner muss mindestens unterscheiden können zwischen:

-   einem bereits in der Strategie festgelegten Parameterwert und
-   einem Parameter, dessen Wert erst bei der Anwendung beziehungsweise
    Laufzeit der Strategie übergeben wird.

Dadurch kann eine Strategie beispielsweise ein Instrument oder eine
Zeiteinheit fest vorgeben oder diese Größen erst zur Laufzeit erhalten.

### req-param-004 -- Selbstbeschreibung für die Benutzeroberfläche

Die Benutzeroberfläche darf die Eigenschaften und Parameter konkreter
Objekte wie Indikatoren oder Strategien nicht fest
einprogrammieren müssen.

Die verwendeten Objekte und Berechnungsverfahren müssen die für Darstellung und
Konfiguration notwendigen Informationen maschinenlesbar bereitstellen.
Die konkrete technische Umsetzung dieses Mechanismus ist noch nicht
festgelegt.

### req-param-005 -- Parameter und Standardwerte eines gespeicherten Objekts

Ein gespeichertes Objekt ist eine Vorlage (Fachmodell req-fach-013a). Es legt seinen Objekttyp und die Standardwerte seiner Parameter fest. Beim Trend ist auch das Berechnungsverfahren ein Parameter. Je nach gewähltem Verfahren zeigt die Eigenschaftenansicht die zugehörigen weiteren Parameter.

Beim Einfügen in eine Strategie entsteht eine Instanz, die die Standardwerte der Vorlage übernimmt und in der Strategie einen eigenen Namen erhält. Die Instanz ist in der Strategie in vollem Umfang änderbar, auch nach dem Speichern: ihre Parameter, bei einer Regel der fachliche Ausdruck, bei einem Regelwerk die enthaltenen Regeln und ihre Werte. Eine Änderung betrifft nur diese Strategie. Eine Vorlage kann in Name, Beschreibung, Standardwerten und, bei Regeln, im fachlichen Ausdruck geändert werden, bestehende Instanzen bleiben davon unberührt. Eine Instanz kann als neue Vorlage gespeichert werden.

### req-param-006 -- Pflichtparameter und optionale Parameter

Der Objekttyp legt fest, welche Parameter Pflichtparameter und welche optional sind. Ein Pflichtparameter ohne Wert, der auch nicht erst bei der Anwendung übergeben wird, ist bei der Konsistenzprüfung ein Fehler. Ein optionaler Parameter ohne Wert ist kein Befund.

## 5. Gemeinsamer Kern des Designers

### req-core-001 -- Ansatzunabhängige Objekte

Der Strategiedesigner stellt Objekte für die Gestaltung von Strategien bereit. Ihre Auswahl und Darstellung richten sich nach der fachlichen Bedeutung im Strategieablauf. Dazu gehören die bereits beschriebenen Objekte wie `Strategie`, `Regel` und konfigurierbare Ordertypen. Weitere Objekte können hinzukommen.

Allgemeine Ablaufbegriffe wie „Entry“ oder „Exit“ sind keine eigenständigen Objekttypen allein aufgrund ihrer Bezeichnung. Der Designer zeigt die jeweils tatsächlich verwendeten Objekte und Tätigkeiten. Ordertypen legt das Fachmodell fest. Das Schließen einer Position erfolgt mit dem Element `Position schließen` über eine `CloseOrder` (Fachmodell, req-fach-032 und req-fach-049a). Eine eigene `ExitOrder` gibt es nicht.

### req-core-002 -- Trennung von Strategie und allgemeinen Regeln

Allgemeine Risiko-, Konto-, Instrument- und Brokerregeln werden als Vorlagen von Regeln und Regelwerken außerhalb der einzelnen Strategie gepflegt. Eine Strategie übernimmt sie als Instanz mit den Standardwerten der Vorlage (req-param-005), zum Beispiel die Regel „Risiko je Trade“.

Mitgelieferte Regelvorlage „Risiko je Trade“: Parameter `Risikogrenze` (Standardwert 1 % des Kapitals). Fachlich: Der Verlust vom Preis bis zum Stop-Loss darf höchstens die Risikogrenze betragen. Solange das Volumen änderbar ist, bestimmt die Regel es daraus, abgerundet auf den Volumenschritt; danach prüft sie diese Bedingung (Fachmodell req-fach-020, req-fach-021, req-fach-049a). Für eine Schließorder gilt sie nicht (Fachmodell req-fach-046). Wie der fachliche Ausdruck der Vorlage das für Orders, Positionen und die Ordertypen abbildet, legt die Spezifikation fest.

## 6. Darstellung und Detaillierung

### req-ui-001 -- Fachliche Hauptansicht

Die Hauptansicht einer Strategie muss den fachlichen Ablauf zeigen.
Technische Details dürfen die fachliche Lesbarkeit nicht überlagern.

### req-ui-002 -- Ein- und ausklappbare Details

Komplexe Elemente sollen intern aus detaillierteren Elementen
bestehen können. Der Nutzer muss diese Details bei Bedarf öffnen können.

### req-ui-003 -- Tätigkeiten und Prüfungen im Ablauf

Elemente des Ablaufs (Bedingung, Berechnung, Order aufgeben, Order ändern, Order löschen, Position ändern, Position schließen) müssen eine Tätigkeit oder eine konkrete Prüfung
ausdrücken. Reine Substantive wie „Marktstruktur", „Handelsplanung" oder
„Pending Order" genügen nicht als Ablaufschritt. Jedes Element des Ablaufs trägt als Namen zunächst die Tätigkeit seines Elementtyps, der Anwender kann ihn ändern. Elemente, die ein Objekt zeigen, tragen den Namen des Objekts.

Geeignete Beispiele sind:

-   „Trend und Marktphase prüfen",
-   „Trade planen",
-   „Handelbarkeit prüfen",
-   „Pending Order stellen",
-   „Ausstehende Order überwachen".

### req-ui-004 -- Fachlicher und technischer Detailgrad getrennt

Die fachliche Darstellung ist die Zeichenfläche mit ihren Elementen. Die technische Ebene ist das gespeicherte Strategiedokument. Beide bilden getrennte, miteinander verknüpfte Ebenen: Jedes Element der Zeichenfläche entspricht einem Teil des Strategiedokuments.

### req-ui-005 -- Dynamische Eigenschaftenansicht

Auswahl und Konfiguration eines Objekts erfolgen über eine
zugehörige Eigenschaftenansicht.

Diese Eigenschaftenansicht muss soweit möglich dynamisch aus den vom
konkreten Objekt und seinen verwendeten Berechnungsverfahren bereitgestellten
Metadaten aufgebaut werden. Sie darf keine Kenntnis einer konkreten
Handelsstrategie voraussetzen.

Die Eigenschaftenansicht einer Instanz zeigt deren Herkunft: die Vorlage, aus der sie entstanden ist, und ihren Objekttyp, zum Beispiel „EMA21, aus Objekttyp EMA“ oder „Risiko, aus Vorlage Risiko je Trade, Objekttyp Regel“. Ein mitgelieferter Indikator ist selbst ein Objekttyp, ein vom Anwender angelegter hat den Objekttyp „Indikator“ (Fachmodell req-fach-013a). Die Eigenschaftenansicht der Strategie selbst (Name, Beschreibung, Strategieparameter, Regeln und Regelwerke der Strategie) öffnet ein Klick auf die leere Zeichenfläche.

### req-ui-006 -- Hierarchische Darstellung komplexer Abläufe

Die Strategie muss als verständliche Gesamtübersicht darstellbar bleiben. Komplexe Teilabläufe wie Einstieg, Orderablauf und Positionsmanagement müssen separat detailliert werden können, ohne ihre Verbindung im Gesamtprozess zu verlieren. Die endgültige Aufteilung und Benennung dieser Teilbereiche ist noch nicht festgelegt.

### req-ui-007 -- Deutsch und Englisch als Oberflächensprachen

Der Strategiedesigner unterstützt Deutsch und Englisch als auswählbare Sprachen der Benutzeroberfläche. Dazu gehören insbesondere Menüs, Beschriftungen und Erläuterungen von Objekten, Eigenschaften, Parametern und Ergebnissen sowie Meldungen zur Konsistenzprüfung einer Strategie.

Ein Wechsel der Oberflächensprache darf die fachliche Bedeutung oder gespeicherte Konfiguration einer Strategie nicht verändern. Die Zuordnung von Objekten, Eigenschaften und Ergebnissen muss unabhängig vom angezeigten Sprachtext erfolgen. Vom Nutzer vergebene Namen und frei eingegebene Texte werden durch einen Sprachwechsel nicht automatisch übersetzt.

### req-ui-008 -- Dauerhafte Oberflächensprache des Strategiedesigners

Der Strategiedesigner muss die gewählte Oberflächensprache als zentrale Einstellung der Komponente dauerhaft speichern. Wenn noch keine Sprache gespeichert ist, startet der Strategiedesigner auf Deutsch. Nach der Auswahl von Englisch oder dem Rückwechsel zu Deutsch muss die gewählte Sprache sowohl nach einem Neuladen der Oberfläche als auch nach einem Neustart des Strategiedesigners wiederhergestellt werden.

Die Einstellung gilt ausschließlich für den Strategiedesigner. Ihre Änderung darf weder Strategieinhalte noch sonstige fachliche Konfigurationen verändern. Die Sprache wird nicht im Browser und nicht benutzerbezogen gespeichert. Benutzerkonten, Anmeldung und weitere Oberflächensprachen gehören nicht zu dieser Anforderung.

### req-ui-009 -- Einstellungsbereich

Der Strategiedesigner bietet einen eigenen Menüpunkt „Einstellungen“. Dort werden alle Einstellungen der Komponente angezeigt und geändert, die über die Oberfläche änderbar sind. Die Auswahl der Oberflächensprache Deutsch oder Englisch (req-ui-007, req-ui-008) befindet sich in diesem Bereich und nicht an anderer Stelle der Oberfläche. Der Objektspeicher (Gesamtsystem req-system-012, req-system-015), in dem Strategien und die übrigen eigenständig gespeicherten Objekte abgelegt werden, wird ebenfalls dort angezeigt und geändert. Im Vorhaben `strategiedesign` ist er ein Objektverzeichnis: ein Dateiverzeichnis mit einer Datei je Objekt. Die Einstellung selbst liegt im Speicher der Komponente (req-system-016). Die Dateien sind die verbindliche Fassung der Objekte; was die Komponente sonst über die Objekte im Speicher hält, lässt sich aus ihnen neu erzeugen. Weitere Einstellungen kommen dort hinzu, wenn sie festgelegt werden.

### req-ui-010 -- Angaben zu pipwerk Studio

pipwerk Studio, der Strategiedesigner (Name laut [Projektziel](../projektziel.md)), zeigt auf Anforderung des Anwenders einen Dialog „Über pipwerk Studio“. Er enthält:

- den Namen „pipwerk Studio“
- den Stand: die vollständige Kennung des Commits, aus dem pipwerk Studio läuft, mit Datum und Uhrzeit dieses Commits in der Ortszeit des Browsers. Kennung, Datum und Uhrzeit sind in der bereitgestellten Software selbst enthalten. Für die Anzeige wird keine Internetverbindung genutzt. Fehlen die Angaben, steht dort „unbekannt“. Genau sein muss die Angabe in der Testumgebung und in jeder späteren Installation. Im Entwicklungsbetrieb, in dem Änderungen an den Dateien sofort wirken, nennt der Dialog den Commit vom Start der Programme. Die Anwenderdokumentation erklärt diese Abweichung und beschreibt die Testumgebung als Weg, pipwerk Studio zu starten.
- die Lizenz: Name und vollständiger Text der „GNU General Public License, Version 3“, immer im englischen Original
- die Adresse https://github.com/macodix/pipwerk als Verweis, der sich in einem neuen Tab öffnet

Der Dialog wird über die Schaltfläche „Über pipwerk Studio“ (englisch „About pipwerk Studio“) rechts in der Kopfzeile geöffnet. Solange der Dialog offen ist, ist die übrige Oberfläche gesperrt. Der Dialog wird nur mit der Schaltfläche „Schließen“ oder der Escape-Taste geschlossen. Alle übrigen Texte des Dialogs folgen der Oberflächensprache (req-ui-007). Unabhängig vom Dialog zeigt die Fußzeile ständig den Stand in Kurzform, vollständig beim Überfahren mit dem Mauszeiger, „unbekannt“, wenn er sich nicht ermitteln lässt. Überall, wo pipwerk Studio seinen Namen anzeigt oder ausgibt, lautet er „pipwerk Studio“, ebenso in der Dokumentation. Ein Zeilenumbruch zwischen „pipwerk“ und „Studio“ ist zulässig.

### req-ui-011 -- Anzeige von Befunden der Konsistenzprüfung

Befunde der Konsistenzprüfung erscheinen nicht als Meldung, die weggeklickt werden muss. Soweit möglich wird das betroffene Element auf der Zeichenfläche rot umrandet oder rot hinterlegt. Wählt der Nutzer das Element aus, steht der Befundtext in der Eigenschaftenansicht (req-ui-005) neben den Eigenschaften des Elements.

Meldungen, die bestätigt werden müssen, sind kritischen Fehlern vorbehalten, etwa wenn das Speichern selbst fehlschlägt.

Offen: Anzeige von Befunden, die keinem einzelnen Element zugeordnet sind, und Darstellung von Hinweisen.

### req-ui-012 -- Regeln und Regelwerke zuordnen (vorläufig)

Regeln und Regelwerke stehen nicht als Elemente auf der Zeichenfläche. Der Anwender ordnet sie in der Eigenschaftenansicht der Strategie oder eines Elements („Order aufgeben“, „Order ändern“, „Position ändern“, „Position schließen“) aus der Elementbibliothek zu, einzeln oder als Regelwerk. Vorläufig: Der Auftraggeber hält diese Lösung noch nicht für abschließend, sie bleibt aber vorerst bestehen. Offen: die Darstellung von Regeln auf der Zeichenfläche. Vorschlag des Projektleiters: Eine Regel hat einen Geltungsbereich, entweder ein Element (die Regel hängt am Element), einen Bereich (beschrifteter Rahmen um mehrere Elemente; die Regel wird an jedem Element im Rahmen ausgewertet, für das sie gilt) oder die ganze Strategie (angezeigt oben in der Zeichnung).

### req-ui-018 -- Gruppen der Elementbibliothek

Die Elementbibliothek gliedert die Elemente nach ihrer Aufgabe, ähnlich der Gliederung von Programmiersprachen:

- Ablaufsteuerung: Auslöser, Bedingung, Verbindung
- Berechnung
- Objekte, die Werte liefern, in fachlichen Gruppen, zum Beispiel Indikatoren, Trends, Marktdaten (`Instrument`, `Kerze`, `Tick`) und Konto
- Aktionen: Order aufgeben, Order ändern, Order löschen, Position ändern, Position schließen
- Regeln und Regelwerke (req-ui-012)

Mitgelieferte Objekttypen und eigene Vorlagen stehen in der Gruppe ihres Objekttyps. Offen: die sichtbaren Namen der Gruppen. Vorschlag des Projektleiters: für die Objekte die fachlichen Gruppennamen ohne gemeinsamen Oberbegriff.

### req-ui-013 -- Eingabehilfe für Ausdrücke

Bei der Eingabe eines Ausdrucks zeigt der Designer nach einem Objektnamen und einem Punkt die verfügbaren Eigenschaften dieses Objekts zur Auswahl an, einschließlich der Eigenschaften der Objekte der Anwendung (Fachmodell req-fach-051).

## 7. Arbeitsabläufe

### req-ui-014 -- Werte als Datenverbindungen

Objekte liefern Werte. Jede Eigenschaft eines Objekts auf der Zeichenfläche, zum Beispiel `Wert` eines EMA oder `Trendrichtung` des 1-2-3-Trends, ist ein Ausgang, den der Anwender per Linie mit einem Eingang eines anderen Elements verbindet, zum Beispiel mit einer Bedingung, einer Berechnung, „Order aufgeben“ oder dem Parameter eines anderen Objekts. Ein verbundener Eingang erscheint im Ausdruck des Elements unter seinem Namen. Datenverbindungen sind von Ablaufverbindungen sichtbar unterschieden: Ablaufverbindungen legen die Reihenfolge fest, Datenverbindungen den Weg eines Werts.

Ausdrücke dürfen Eigenschaften weiterhin auch direkt über den Namen ansprechen (`ema20.Wert`); beide Wege führen zum selben Ergebnis. Bausteine und Verbinden bieten an einer Stelle nur Instanzen an, die dort verwendbar sind (Fachmodell req-fach-055): Im Zweig „falsch“ einer Bedingung steht ein Indikator, der erst im Zweig „wahr“ ermittelt wird, nicht zur Wahl. Steht eine solche Instanz trotzdem in einem Ausdruck, meldet die Konsistenzprüfung einen Fehler. Wird ein Name nur im Ausdruck verwendet, zeigt die Zeichenfläche die Verwendung trotzdem als Datenverbindung an. Sie gilt als Verbindung nach req-ablauf-003. Der vorgesehene Weg ist, das Objekt zuerst auf die Zeichenfläche zu ziehen und dann zu verbinden.

Die Beschriftung einer Datenverbindung nennt die übergebene Eigenschaft oder Methode. Bei jeder Verwendung wählt der Anwender in der Eigenschaftenansicht die Eigenschaft oder Methode und, wo der Objekttyp es vorsieht, den Schalter „Aktualisieren“: Die Instanz ermittelt ihre Werte neu, bevor sie sie übergibt (Fachmodell req-fach-055).

Offen für die Spezifikation: Darstellung der Ein- und Ausgänge, Bündelung vieler Ausgänge eines Objekts, Verhalten beim Umbenennen und Löschen eines verbundenen Objekts.

### req-ui-015 -- Bedingungen und Berechnungen ohne Formeltext

Der Anwender stellt Bedingungen und Berechnungen aus Bausteinen zusammen, ohne Formeln zu schreiben: Werte wählt er aus allem, was ein Ausdruck ansprechen kann, zum Beispiel aus Eigenschaften verbundener Objekte, Eigenschaften der Objekte der Anwendung einschließlich `Order`, `Position` und `Strategie` (Fachmodell req-fach-051), Ergebnissen vorangehender Elemente und von Regeln (Fachmodell req-fach-005, req-fach-048), Strategieparametern und festen Werten. Vergleiche und Verknüpfungen wählt er aus Listen in Händlersprache, zum Beispiel „ist größer als“, „und“, „oder“, „vorheriger Wert von“. Eine Rechnung, die nur zu bestimmten Indikatoren gehört, zum Beispiel die Kreuzung zweier Linien, ist kein eigener Baustein; sie entsteht aus „vorheriger Wert von“ und Vergleichen. Offen: ob solche Rechnungen als eigene Vorlagen angeboten werden. Die Zeichenfläche und die Eigenschaftenansicht zeigen die Bedingung als lesbaren Satz. Die Schreibweise als Ausdruck bleibt als Ansicht für Fortgeschrittene erhalten, mit einem Formeleditor: mehrzeilige Eingabe, farbige Hervorhebung von Namen, Funktionen und Werten, Markierung zusammengehöriger Klammern, Fehler unterstrichen an der Stelle mit Erklärung beim Zeigen, nach `Objekt.` die Liste der Eigenschaften mit Datentyp und kurzer Erklärung, bei Funktionen die Erklärung der Argumente während der Eingabe; beide Ansichten zeigen dieselbe Bedingung.

### req-ui-016 -- Bedienerführung

Die Bedienung erschließt sich ohne Handbuch. Jeder leere Zustand nennt den nächsten sinnvollen Schritt. Jedes Element der Elementbibliothek und jedes Feld der Eigenschaftenansicht hat eine kurze Erklärung in Händlersprache, die beim Zeigen erscheint, auch für Parameter wie „Anwenden auf“ eines EMA. Die Eigenschaftenansicht eines Objekts beschreibt jede Eigenschaft und Methode, die es liefert: was der Wert aussagt und wozu er dient, zum Beispiel beim EMA, was der gelieferte Wert ist und wofür man ihn in einer Strategie verwendet. Ein Ausgang zeigt den Namen der Eigenschaft, nicht nur ihren Datentyp wie „Zahl“. Offen: ein geführter Aufbau einer neuen Strategie. Er folgt dem Ablauf und dem Fachmodell, insbesondere entsteht eine Instanz bei dem Element ihrer ersten Verwendung (Fachmodell req-fach-055), und hinterlässt verbundene Elemente. Eine erste Fassung (Auslöser, Indikatoren, Bedingung, Order) hat sich in der Abnahme nicht bewährt. Hinweise und Dialoge des Strategiedesigners, zum Beispiel „Keine Strategie geöffnet“, erscheinen in der Eigenschaftenansicht und nur dort, nicht zusätzlich auf der Zeichenfläche. Befunde nennen, wie man sie behebt, und führen per Klick zur Stelle.

Namen vergibt der Anwender frei, mit Leerzeichen und Umlauten (zum Beispiel „Stop-Abstand“, „EMA 20“). Ein Objekt, ein Element und ein Strategieparameter haben genau einen Namen; eine getrennte Bezeichnung entfällt. Interne Kennungen bildet die Anwendung selbst und zeigt sie nicht.

### req-ui-017 -- Anordnung auf der Zeichenfläche

Der Ablauf verläuft senkrecht von oben nach unten. Jedes Element hat seinen Eingang oben und seine Ausgänge unten; bei einer Bedingung liegen `wahr` und `falsch` unten nebeneinander. Die Anwendung ordnet die Elemente selbst an, sodass Linien sich möglichst nicht kreuzen; der Anwender kann sie verschieben.

Objekte ohne Ablaufverbindung (Indikatoren, Trends und die Objekte der Anwendung, die auf der Zeichenfläche liegen können, nach Fachmodell req-fach-051) liegen bei dem Element, das sie zuerst verwendet, und sind mit ihm verbunden (Fachmodell req-fach-055): bei senkrechtem Ablauf daneben, bei waagerechtem darüber oder darunter. Weitere Verwendungen zeigen ihre Datenverbindungen (req-ui-014), die sich ein- und ausblenden lassen. Einen eigenen Bereich der Zeichenfläche für Objekte gibt es nicht.

Auch eine einfache Strategie bleibt auf einen Blick überschaubar: Zusammengehörige Schritte lassen sich zu einem benannten Abschnitt zusammenfassen und einklappen (req-ui-006), zum Beispiel „Einstieg“, „Order“, „Order- und Positionsverwaltung“. Die Ausrichtung lässt sich zwischen senkrecht und waagerecht umschalten.

Offen, Diskussionspunkt des Auftraggebers: Löschen einer Verbindung direkt auf der Zeichenfläche, zum Beispiel Linie anklicken und mit der Entf-Taste löschen. Bisher geht das über die Eigenschaftenansicht.

### req-ablauf-001 -- Arbeitsabläufe des Strategiedesigners

Der Strategiedesigner bietet folgende Arbeitsabläufe:

1. Strategie anlegen, öffnen, bearbeiten, speichern, schließen, löschen
2. Objekt (Vorlage) anlegen, öffnen, bearbeiten, speichern, löschen (Indikator, Trend, Regel, Regelwerk)
3. Konsistenzprüfung Strategie und Objekt
4. Einstellungen ändern

### req-ablauf-002 -- Strategie anlegen

Der Anwender wählt „Neue Strategie“. Es öffnet sich eine leere Zeichenfläche ohne Elemente. Name und Beschreibung gibt der Anwender in der Eigenschaftenansicht der Strategie ein. Beide sind jederzeit änderbar. Gespeichert wird erst, wenn der Anwender speichert.

### req-ablauf-003 -- Objekte in einer Strategie verwenden

Der Anwender zieht einen Objekttyp oder eine gespeicherte Vorlage aus der Elementbibliothek auf die Zeichenfläche und verbindet sie mit dem Element, das sie zuerst verwendet (Fachmodell req-fach-055). Erst dann ist sie verwendbar. Es entsteht eine Instanz mit den Standardwerten des Objekttyps beziehungsweise der Vorlage. In der Eigenschaftenansicht gibt der Anwender der Instanz einen Namen (zum Beispiel `EMA21`), unter dem sie in Ausdrücken dieser Strategie angesprochen wird, und setzt ihre Parameter. Enthält die Vorlage selbst Instanzen, zum Beispiel ein Trend Indikatoren oder ein Regelwerk Regeln, schlägt pipwerk Studio für jede davon einen Namen vor, der aus dem Namen der neuen Instanz und ihrem bisherigen Namen gebildet ist. Der Anwender kann ihn ändern. Die genaue Form des Vorschlags legt die Spezifikation fest. Zwei Instanzen aus derselben Vorlage sind zwei Objekte der Strategie. Die Instanz wird mit der Strategie gespeichert. Auf Wunsch speichert der Anwender sie als neue Vorlage, die danach in der Elementbibliothek für andere Strategien zur Verfügung steht.

Die Objekte der Anwendung (Fachmodell req-fach-051) sind in Ausdrücken verfügbar; Order und Position bezeichnen in einer Regel die Order beziehungsweise Position, auf die die Regel angewendet wird, und im Ablauf die Order und Position der Order- und Positionsverwaltung. Konto, Instrument, Kerze und Tick stehen zusätzlich in der Elementbibliothek und können wie andere Objekte als Instanz auf die Zeichenfläche gelegt werden, um ihre Eigenschaften zu zeigen und ihre Parameter zu setzen, zum Beispiel die Zeiteinheit einer Kerze. Eine Strategie kann mehrere Instanzen davon verwenden. Sie brauchen keine Ablaufverbindung, ebenso wenig wie Indikatoren und Trends; ihre Werte geben sie über Datenverbindungen weiter (req-ui-014).

### req-ablauf-004 -- Objekt anlegen (vorläufig)

Der Anwender wählt in der Elementbibliothek „Neues Objekt“ und einen Objekttyp. In der Eigenschaftenansicht gibt er Name, Beschreibung und die Standardwerte der Parameter ein. Nach dem Speichern steht das Objekt in der Elementbibliothek.

### req-ablauf-005 -- Strategie speichern und schließen (vorläufig)

Beim Speichern läuft die Konsistenzprüfung. Befunde werden angezeigt. Gespeichert wird auch bei Befunden. Beim Schließen einer Strategie mit ungespeicherten Änderungen fragt der Designer: speichern, verwerfen oder abbrechen.

### req-ablauf-006 -- Strategie und Objekt löschen

Eine Strategie wird nach Rückfrage gelöscht. Eine Vorlage wird nach Rückfrage gelöscht, bestehende Instanzen in Strategien und anderen Vorlagen bleiben unverändert, weil sie die Werte der Vorlage übernommen haben. Der Designer zeigt vor dem Löschen, welche Strategien und Vorlagen Instanzen aus dieser Vorlage enthalten.

### req-ablauf-007 -- Konsistenzprüfung Strategie

Die Konsistenzprüfung läuft beim Speichern einer Strategie oder einer Vorlage (Regel, Regelwerk, Indikator, Trend) und auf Anforderung. Sie findet mindestens:

- Auslöser ohne Verbindung in den Ablauf (Fehler)
- Element des Ablaufs ohne Verbindung (Fehler)
- Instanz eines Indikators, eines Trends oder eines Objekts der Anwendung ohne Verbindung zu dem Element, das sie zuerst verwendet (Fehler, req-ablauf-003, Fachmodell req-fach-055)
- Name einer Instanz, der in der Strategie mehr als einmal vergeben ist (Fehler, Fachmodell req-fach-055)
- Instanz in einem Ausdruck an einer Stelle, an der sie nicht verwendbar ist (Fehler, Fachmodell req-fach-055, req-ui-014)
- Datenverbindung zwischen unverträglichen Datentypen (Fehler)
- Eingang ohne Wert (Fehler), ausgenommen optionale Parameter (req-param-006) und Parameter, deren Wert erst bei der Anwendung übergeben wird
- Fehlerhafter Ausdruck, zum Beispiel Schreibfehler, unbekannte Funktion oder unbekannte Eigenschaft (Fehler)
- Ergebnis einer bestimmenden Regel passt nicht zur Eigenschaft, die sie bestimmt (Fehler)
- Rückführung im Ablauf ohne Bedingung, die sie beendet (Fehler)
- Pflichtparameter ohne Wert, der auch nicht erst bei der Anwendung übergeben wird (Fehler)
- Bedingung, die eine Eigenschaft verwendet, die das Objekt nicht hat (Fehler)
- Regelwerk, dessen Reihenfolge nicht auswertbar ist: Vorwärtsbezug oder Zirkelbezug nach req-fach-045 (Fehler)
- Kein Element „Order aufgeben“ erreichbar (Hinweis)
- Strategie ohne Auslöser, sie startet nie (Hinweis)
- Festes Instrument mit ungültiger Bezeichnung (Fehler, Fachmodell req-fach-053)

Speichern ist immer möglich, auch bei Fehlern. Eine Strategie mit Fehlern kann nicht ausgeführt werden. Die Anzeige der Befunde regelt req-ui-011.

### req-ablauf-008 -- Strategie und Objekt öffnen

Der Menüpunkt „Öffnen“ zeigt eine Liste der gespeicherten Strategien mit Name, Beschreibung und Zeitpunkt der letzten Änderung. Die Auswahl lädt die Strategie auf die Zeichenfläche. Eine gespeicherte Vorlage öffnet der Anwender aus der Elementbibliothek in ihrer Eigenschaftenansicht. Enthält eine Strategiedatei ein Element, dessen Elementtyp oder Objekttyp der Strategiedesigner nicht kennt, wird die Strategie trotzdem geöffnet und das betroffene Element mit einem Befund der Konsistenzprüfung markiert.

### req-ablauf-009 -- Objektverzeichnis ändern

Ändert der Anwender in den Einstellungen das Objektverzeichnis (req-ui-009), fragt der Designer, ob die vorhandenen Dateien in das neue Verzeichnis verschoben werden sollen. Bei „Ja“ verschiebt er sie. Bei „Nein“ bleibt das alte Verzeichnis unverändert, und der Designer zeigt ab jetzt den Inhalt des neuen.

## 8. Dokumententrennung

### req-doc-001 -- Strategiebeschreibung getrennt halten

Eine fachliche Strategiebeschreibung enthält ausschließlich die
Handelsidee, die fachlichen Voraussetzungen und den fachlichen
Handelsablauf.

### req-doc-002 -- Fachdefinitionen getrennt halten

Wiederverwendbare fachliche Definitionen werden außerhalb einzelner
Strategiebeschreibungen geführt und nicht in jede Strategie kopiert.

Wie diese Definitionen strukturiert, gruppiert oder technisch
organisiert werden, ist noch nicht festgelegt.

### req-doc-003 -- Produktanforderungen getrennt halten

Anforderungen an den Strategiedesigner werden ausschließlich in diesem
oder einem daraus abgeleiteten Anforderungsdokument geführt. Sie dürfen
nicht in fachliche Strategiebeschreibungen eingefügt werden.

### req-doc-004 -- Allgemeine Handelsregeln getrennt halten

Übergreifende Risiko-, Money-Management-, Konto-, Instrument- und
Brokerregeln werden außerhalb einzelner Strategiebeschreibungen
gepflegt.

## 9. Noch offene Punkte


Die folgenden Punkte sind noch nicht entschieden:

1.  Wie Objekte und Definitionen erstellt, strukturiert,
    versioniert und erweitert werden.
2.  Wie Nutzer eigene Objekte beziehungsweise Definitionen
    bereitstellen können.
3.  Welche allgemeinen technischen Elemente fortgeschrittene Nutzer
    direkt verwenden dürfen.
4.  Wie die Kompatibilität zwischen Objekten,
    Berechnungsverfahren und benötigten Eigenschaften geprüft und
    dargestellt wird.
5.  Wie Elemente intern in ausführbare technische Einheiten
    übersetzt werden.
6.  Wie Änderungen einer Fachdefinition bestehende Strategien und
    Backtests beeinflussen.
7.  Mit welchem technischen Mechanismus Objekte ihre Eigenschaften
    und Parameter für Designer und Oberfläche maschinenlesbar
    bereitstellen.
8.  Ob Pipwerk künftig Benutzerkonten benötigt. Falls Benutzerkonten
    eingeführt werden, ist gesondert zu entscheiden, ob die
    Oberflächensprache pro Benutzer gespeichert wird.
9.  Welche Objekte über EMA, ATR und ZigZag hinaus (Fachmodell req-fach-054) als Grundausstattung mitgeliefert werden. Entscheidung, wenn Erfahrung vorliegt, was gebraucht wird.
10. Anmeldung und Berechtigung für die Web-API (Gesamtsystem req-system-011). Im Vorhaben `strategiedesign` ohne Anmeldung, pipwerk Studio ist dort nur in einem vom Betreiber kontrollierten Netz erreichbar; Betreiber und Anwender sind dort dieselbe Person.

## 10. Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-09-18 | Erstanlage aus den bestätigten Diskussionsergebnissen |
| 2026-09-20 | Festlegung „eigene Fachbibliothek je Handelsansatz“ entfernt. Anforderungen zu konfigurierbaren und parametrisierbaren Objekten, dynamisch bereitgestellten Eigenschaften und Ergebnissen, Parameterbindung zur Strategie oder Laufzeit und dynamischer Eigenschaftenansicht ergänzt. |
| 2026-09-20 | Benutzerdefinierte, wiederverwendbare fachliche Objekttypen als Erweiterungsmechanismus ergänzt |
| 2026-09-22 | Fachliches Objekt `Trend` mit Richtung, Zeiteinheit, Betrachtungshorizont und Berechnungsverfahren sowie Zuordnung von Indikatoren und deren Ergebnissen konkretisiert |
| 2026-09-22 | Festlegungen aus der GUI-/Ablaufdiskussion ergänzt: Indikatoren als Objekte, Zustandswechsel als Bedingungen, allgemeine Auslöser, Trennung Einstiegssignal/Order/Position, grober Orderablauf, Informationsquellen und hierarchische Darstellung; Betrachtungshorizont als allgemeine Trend-Eigenschaft korrigiert |
| 2026-09-23 | Zwischenergebnis zum fachlichen Ordermodell ergänzt: allgemeines Orderobjekt, Regelverarbeitung, OrderManager, Spezialisierung und Erweiterbarkeit nach Ordertyp, MT5-Begrenzung der ersten Entwicklungsphase und Trennung der Kontoanbindung |
| 2026-09-23 | Ordermodell ergänzt um Strategie-Konfiguration des Ordertyps, `MarketOrder`, Übergabe freigegebener Orders, getrennte Zustände, Überwachung der fortbestehenden Gültigkeit, `CloseOrder` und strategieunabhängige Nutzung von Orderobjekten |
| 2026-09-24 | Fachliches Objekt `Regel` ergänzt: Eigenschaften, fachlicher Ausdruck, Prüfen/Bestimmen, Komposition und freie Granularität, Zugriff auf fachliche Informationen, Kontextbindung und Verfügbarkeit konkreter Regeln in der GUI |
| 2026-09-24 | Konsistenzbereinigung: veralteten Orderablauf entfernt; Verantwortlichkeit des OrderManagers beim Anstoßen von Prüfungen präzisiert; einheitliches Regelobjekt mit `prüfen()`/`bestimmen()` durchgängig verwendet; Verhältnis von Bedingungen und Regeln klargestellt |
| 2026-09-24 | Fachliches Objekt `RegelSet` ergänzt: benannte geordnete Sammlung eigenständiger Regeln, Erhalt der Einzelergebnisse, optionales explizit definiertes Gesamtergebnis, änderbare Auswertungsreihenfolge; Behandlung fehlerhafter Reihenfolgen bewusst offengelassen |
| 2026-09-24 | Grundlegende Festlegungen zum fachlichen Nachrichtensystem ergänzt: vollständig adressierte Nachrichten mit ID, Absender, Adressat, Priorität, Nachrichtenart, Inhalt und optionalem Bezug; fachliche Objekte als Inhalt; gemeinsames Modell für Pull und Push; aktueller Kommunikationsbedarf des OrderManagers festgehalten |
| 2026-09-24 | Bestehendes Gesamtdokument in `fachmodell.md`, `anforderungen-strategiedesigner.md` und `anforderungen-handelssystem.md` getrennt; bestehende Anforderungen inhaltlich erhalten und nach Zuständigkeit zugeordnet. |
| 2026-09-25 | Übergreifende Festlegung zur technischen Aufteilung in `anforderungen-gesamtsystem.md` verlagert; bisherige Offenhaltung der technischen Aufteilung entfernt. |
| 2026-09-25 | Veralteten Verweis auf `Signal` als fachliches Objekt entfernt und `Strategie` als fachliches Objekt berücksichtigt. |
| 2026-10-04 | Dauerhafte, komponentenweite Auswahl von Deutsch oder Englisch für den Strategiedesigner einschließlich Standardsprache, Abgrenzung und offenem Folgepunkt zu Benutzerkonten festgelegt. |
| 2026-10-12 | Einstellungsbereich mit der Sprachauswahl als eigener Menüpunkt festgelegt. |
| 2026-10-12 | Objektverzeichnis als Einstellung im Einstellungsbereich. |
| 2026-10-12 | Begriffe abgestimmt: Objekt statt fachliches Objekt oder fachliches Element, Element für alles auf der Zeichenfläche, Eigenschaft, Parameter und Ergebnis unterschieden. Auslöser als Elemente, mindestens einer je Strategie. |
| 2026-10-12 | Arbeitsabläufe (Abschnitt 7), Parameter und Standardwerte gespeicherter Objekte, Pflicht- und optionale Parameter, Konsistenzprüfung. Grundausstattung an Objekten als offen aufgenommen. |
| 2026-10-13 | Dialog „Über pipwerk studio“ (req-ui-010), Aufrufstelle offen. |
| 2026-10-13 | req-ui-010 nach Prüfbericht präzisiert: Inhalt des Stands, Lizenztext im Original, Adresse als Verweis, gesperrte Oberfläche, Name laut Projektziel. Bestätigt vom Auftraggeber im Chat. |
| 2026-10-13 | req-ui-010: Aufrufstelle festgelegt; Stand in der Software enthalten, keine Abfrage bei GitHub. Antwort des Auftraggebers auf Frage ablauftest-01. |
| 2026-10-13 | req-ui-010: Stand genau in Testumgebung und Installation, im Entwicklungsbetrieb Commit vom Start, Abweichung in der Anwenderdokumentation erklärt. Antwort des Auftraggebers auf Frage ablauftest-02. |
| 2026-10-13 | Schreibweise des Namens in req-ui-010: „pipwerk Studio“ (Auftraggeber im Chat). |
| 2026-10-13 | req-ui-010: Name überall einheitlich „pipwerk Studio“, folgt aus der Festlegung des Namens durch den Auftraggeber. |
| 2026-10-13 | Konsistenzprüfung um fehlerhafte Reihenfolge im Regelwerk ergänzt, Speichern immer möglich. Anzeige der Befunde am Element (req-ui-011). Abgestimmt mit dem Auftraggeber im Chat. |
| 2026-10-14 | req-ui-010: Zeilenumbruch zwischen „pipwerk“ und „Studio“ zulässig (Auftraggeber im Chat). |
| 2026-10-14 | Auslöser auch am Anfang der Verwaltung einer Order. Abgestimmt mit dem Auftraggeber im Chat. |
| 2026-10-14 | Eindeutige Korrekturen nach dem Prüfbericht der QA zu `strategiedesign`: „Strategie“ statt „Strategiedefinition“, „Berechnungsverfahren“ statt „Komponente“ eines Objekts, „Eigenschaften“ statt „Parameter“ eines Ordertyps, Marktphase, Bewegung und Korrektur als Werte der Eigenschaft Phase, Objekte liefern keine Ergebnisse, Gültigkeit wartender Orders über die Verwaltung, keine ExitOrder, Objektverzeichnis und Speicher, Aufrufstelle des Dialogs „Über pipwerk Studio“ ohne Bezug auf die Sprachauswahl, Standanzeige beschrieben, Löschschutz auch bei Verwendung in Objekten, sprachliche Fehler, Änderungsnachweis als eine Tabelle. |
| 2026-10-15 | Entscheidungen des Auftraggebers zu den Befunden der QA (`strategiedesign`, Durchlauf 1): Objekte der Anwendung (req-fach-001, req-ablauf-003), Auslösertypen (req-fach-015), Vorlage und Instanz (req-param-005, req-core-002, req-ablauf-003, req-ablauf-006), Benennung von Ablaufelementen (req-ui-003), fachliche und technische Ebene (req-ui-004), Herkunft und Eigenschaftenansicht der Strategie (req-ui-005), Regeln zuordnen vorläufig (req-ui-012), Eingabehilfe (req-ui-013), Konsistenzprüfung erweitert (req-ablauf-007), Öffnen (req-ablauf-008), Objektverzeichnis ändern (req-ablauf-009), Anmeldung als offener Punkt. Abgestimmt mit dem Auftraggeber im Chat am 2026-10-15. |
| 2026-10-15 | Entscheidungen des Auftraggebers zur Nachprüfung der QA (`strategiedesign`, Durchlauf 2): Objektspeicher als Einstellung (req-ui-009), Objekte der Anwendung mit Parametern und mehreren Instanzen (req-ablauf-003), Regelvorlage „Risiko je Trade“ beschrieben (req-core-002), Instanz in vollem Umfang änderbar (req-param-005), „Position schließen“ mit Regeln (req-ui-012), Öffnen bei unbekanntem Typ (req-ablauf-008), Beispiel in req-ui-005, Begriff „Ablaufelement“ entfernt (req-ui-003, req-ablauf-007), Sprachfehler Abschnitt 9 Punkt 7, Betreiber in Abschnitt 9 Punkt 10, Überschrift req-fach-027. Abgestimmt mit dem Auftraggeber im Chat am 2026-10-15. |
| 2026-10-16 | Nachprüfung der QA (`strategiedesign`, Durchlauf 3). Entscheidungen des Auftraggebers im Chat am 2026-10-16: Preis der Marktorder, Prüfung nach Ausführung, keine Anwendung der Risikoregel auf Schließorders (req-core-002). Vom Projektleiter nach Hinweisen der QA: Eingangswerte der Regelvorlage, Objekte der Anwendung vollständig aufgezählt (req-fach-001, req-ablauf-003), Beispiel Herkunft (req-ui-005), Begriffe Objektspeicher und Objektverzeichnis (req-ui-009). |
| 2026-10-16 | Nachprüfung der QA (`strategiedesign`, Durchlauf 4), vom Projektleiter: Order und Position in Regeln aus dem Zusammenhang (req-ablauf-003), Eingangswerte der prüfenden Rolle (req-core-002), doppelte Nennung entfernt (req-fach-001), Objekttyp eines angelegten Indikators (req-ui-005). |
| 2026-10-16 | Nachprüfung der QA (`strategiedesign`, Durchlauf 5), vom Projektleiter: Limitpreis bei der Stop-Limit-Order, Prüfung nach Ausführung auf der Position, Unterscheidung der Fälle (req-core-002); Order und Position in Regeln (req-ablauf-003). |
| 2026-10-16 | Nachprüfung der QA (`strategiedesign`, Durchlauf 6). Entscheidung des Auftraggebers im Chat am 2026-10-16: Regelvorlage „Risiko je Trade“ in req-core-002 auf die fachliche Festlegung zurückgeführt, die Abbildung im Ausdruck ist Sache der Spezifikation. |
| 2026-10-18 | Entscheidung des Auftraggebers im Chat am 2026-10-18: Auslöser sind optional, für die Strategie und für die Verwaltung einer Order (req-fach-015); „Neue Strategie“ öffnet eine leere Zeichenfläche (req-ablauf-002). Grundsatz: keine Einschränkung ohne klare Notwendigkeit. Auswertung ohne Auslöser offen. Anlass: Ergänzung der Spezifikation in Phase 4 (`strategiedesign/wp02`, `development/strategiedesign/reviews/specification-4.md`). |
| 2026-10-18 | Vom Projektleiter, Folge der Entscheidung vom selben Tag: Sätze zum Start und zur Wiederholung der Auswertung auf Strategien mit Auslösern beschränkt (req-fach-015). Hinweis H1 aus `development/strategiedesign/reviews/requirements-8.md`. |
| 2026-10-19 | req-ui-014 neu: Werte von Objekten als Datenverbindungen zu Eingängen anderer Elemente, Ausdrücke mit Namen bleiben zulässig; req-ablauf-003 und req-ablauf-007 angepasst. Entscheidung des Auftraggebers im Chat am 2026-10-19 (Abnahme `strategiedesign/wp02`): „Der Sinn von Indikatoren ist, dass sie Werte liefern.“ |
| 2026-10-19 | req-ui-015 neu: Bedingungen und Berechnungen aus Bausteinen ohne Formeltext, Ausdruck als Ansicht für Fortgeschrittene mit Editor. req-ui-016 neu: Bedienerführung, freie Namen, ein Name statt Name und Bezeichnung. Festlegungen des Auftraggebers im Chat am 2026-10-19 (Abnahme `strategiedesign/wp02`). |
| 2026-10-19 | req-ui-017 neu: senkrechter Ablauf mit Eingang oben und Ausgängen unten, automatische Anordnung, eigener Bereich für Objekte ohne Ablaufverbindung, zusammenfassbare Abschnitte. Festlegung des Auftraggebers im Chat am 2026-10-19 (Abnahme `strategiedesign/wp02`). |
| 2026-10-19 | Vom Projektleiter nach dem Prüfbericht der QA (`strategiedesign`, Durchlauf 9), Folge der Festlegungen vom selben Tag: Wertquellen der Bausteine wie in Ausdrücken (req-ui-015, B1); Name statt Bezeichnung (req-param-005, req-ui-003, req-ui-005, req-ablauf-002, req-ablauf-004, req-ablauf-008, B3); Bereich für Objekte ohne Ablaufverbindung gehört zur Zeichenfläche, Objekte der Anwendung statt „Markt und Konto“ (req-ui-017, H1); Eingang ohne Wert ausgenommen optionale und bei der Anwendung übergebene Parameter (req-ablauf-007, H4); `ZigZag` in Abschnitt 9 Punkt 9 (H8). |
| 2026-10-19 | Vom Projektleiter nach den Hinweisen der QA (`strategiedesign`, Durchläufe 10 und 11): eigener Bereich nur für Objekte der Anwendung, die auf der Zeichenfläche liegen können (req-ui-017), Wertquellen als Beispiele, mit Ergebnissen von Regeln (req-ui-015), Parameter der Auslöser nach dem Fachmodell (req-fach-015). |
| 2026-10-19 | Auswertung ohne Auslöser wird mit den Anforderungen an das Handelssystem geklärt und darf durch den Aufbau nicht ausgeschlossen werden. Festlegung des Auftraggebers im Chat am 2026-10-19. |
| 2026-10-20 | req-fach-015: Auslöser „Start von Hand“, jede Auswertung beginnt an einem Auslöser; req-ablauf-007: Hinweis bei einer Strategie ohne Auslöser. Entscheidung des Auftraggebers im Chat am 2026-10-20 (Abstimmung der Spezifikation `strategiedesign`, Punkt 17). |
| 2026-10-20 | req-ablauf-007: Prüfung der Bezeichnung fester Instrumente. Entscheidung des Auftraggebers im Chat am 2026-10-20 (Abstimmung der Spezifikation `strategiedesign`, Punkte 16 und 19). |
| 2026-10-21 | Bewegung und Korrektur ohne Eigenschaft `Phase` (Indikator Markttechnik). Entscheidung des Auftraggebers im Chat am 2026-10-21. |
| 2026-10-21 | Indikator Markttechnik zurückgestellt (Fachmodell req-fach-054). Entscheidung des Auftraggebers im Chat am 2026-10-21. |
| 2026-10-21 | req-fach-015: Auslöser „Start von Hand“ heißt „Manuell“ und steht nur im Hauptablauf, nicht in der Verwaltung einer Order. Entscheidung des Auftraggebers im Chat am 2026-10-21 (`backtest`, Frage backtest-01). |
| 2026-10-21 | req-ui-003: Element „Parameter setzen“ entfällt (Fachmodell req-fach-047). Entscheidung des Auftraggebers im Chat am 2026-10-21 (`backtest`, Frage backtest-01). |
| 2026-10-21 | req-fach-015: Liste der Auslösertypen an die Benennung „Manuell“ angeglichen. Vom Projektleiter nach dem Hinweis des Softwarearchitekten (`backtest`, Spezifikation). |
| 2026-10-22 | req-ui-017: Objekte liegen beim Element ihrer ersten Verwendung statt in einem eigenen Bereich, Ausrichtung umschaltbar. req-ui-014: Beschriftung der Datenverbindung, Wahl von Eigenschaft oder Methode, Schalter „Aktualisieren“. req-ablauf-003: Instanz erst mit Verbindung zum ersten verwendenden Element verwendbar. req-ui-018 neu: Gruppen der Elementbibliothek, Namen offen. req-ui-012: bleibt vorerst, Darstellung von Regeln offen mit Vorschlag. Festlegung des Auftraggebers im Chat am 2026-10-22 (Abnahme `strategiedesign/wp02`, Versuch 2). |
| 2026-10-22 | req-ablauf-007: Instanz ohne Verbindung zum Element ihrer ersten Verwendung und doppelter Name einer Instanz sind Fehler, Ausnahme für Objekte auf der Zeichenfläche entfällt. Vom Projektleiter nach dem Prüfbericht der QA (`strategiedesign`, Durchlauf 13, B1 und H6), Folge der Festlegungen vom selben Tag. |
| 2026-10-23 | req-ui-014: Verwendung nur im Ausdruck gilt als Verbindung, vorgesehener Weg ist das Ziehen auf die Zeichenfläche. req-ablauf-003: Namensvorschlag für Instanzen, die in einer eingefügten Vorlage enthalten sind. Festlegung des Auftraggebers im Chat am 2026-10-23 (Hinweise N1 und N3 aus `development/strategiedesign/reviews/requirements-14.md`). |
| 2026-10-23 | req-ui-016: Der geführte Aufbau heißt in der Oberfläche „Assistent“. Festlegung des Auftraggebers im Chat am 2026-10-23 (Prototyp, Frage strategiedesign-02). |
| 2026-10-23 | req-ui-016: Hinweise und Dialoge des Strategiedesigners nur in der Eigenschaftenansicht. Festlegung des Auftraggebers im Chat am 2026-10-23 (Prototyp, Frage strategiedesign-03). |
| 2026-10-23 | req-ui-016: Beschreibung der gelieferten Eigenschaften und Methoden in der Eigenschaftenansicht eines Objekts, Ausgang mit Namen der Eigenschaft. req-ui-017: Löschen einer Verbindung auf der Zeichenfläche als offener Diskussionspunkt. Festlegung des Auftraggebers im Chat am 2026-10-23 (Prototyp, Frage strategiedesign-03). |
| 2026-10-23 | req-ui-014: Nur an der Stelle verwendbare Instanzen zur Wahl, sonst Fehler der Konsistenzprüfung. Festlegung des Auftraggebers im Chat am 2026-10-23 (Abstimmung `specification-3.html`, Punkt 24). |
| 2026-10-23 | req-ablauf-007: Instanz an einer Stelle, an der sie nicht verwendbar ist. Folge der Festlegung zu Punkt 24 der Abstimmung `specification-3.html`, Hinweis H1 in `development/strategiedesign/reviews/requirements-19.md`. |
| 2026-10-27 | Begriff „Verwaltung einer Order“ heißt „Order- und Positionsverwaltung“ (req-fach-015, req-fach-027, req-ui-017, req-ablauf-003). req-ui-016: geführter Aufbau („Assistent“) wird offener Punkt. req-ui-015: Kreuzung kein eigener Baustein. Entscheidungen des Auftraggebers im Chat am 2026-10-27 (Abnahme `strategiedesign/wp02`, `development/strategiedesign/wp02/acceptance/3.md`, E1, E9, E12). |
