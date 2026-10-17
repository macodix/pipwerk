# Anforderungen an den Trading-Strategiedesigner

## Dokumentstatus

- status: `draft`
- zweck: Anforderungen an das Werkzeug zur Gestaltung und Bearbeitung von Handelsstrategien
- zuletzt aktualisiert: `2026-10-18`
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

Marktphase, Bewegung und Korrektur sind keine eigenen Objekte, sondern Werte der Eigenschaft `Phase` eines Indikators, zum Beispiel des Indikators Markttechnik.

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

Strategieabläufe werden durch Auslöser gestartet beziehungsweise erneut ausgewertet. Eine Strategie kann Auslöser haben, muss aber nicht; ebenso die Verwaltung einer Order. Offen: wie eine Strategie oder Verwaltung ohne Auslöser ausgewertet wird, zum Beispiel durch Start von Hand. Die Frage betrifft die Ausführung und wird vor der Beschreibung des Strategietesters geklärt. Jeder Auslöser ist ein Element auf der Zeichenfläche und steht am Anfang des Ablaufs oder am Anfang der Verwaltung einer Order (Fachmodell, req-fach-049a). Die Auslösertypen legt das Fachmodell fest (req-fach-053): Kerzenschluss mit Zeiteinheit, Tick und externes Ereignis. Die Verwaltung einer Order kann eigene Auslöser-Elemente haben, innerhalb des Bereichs der Zeichenfläche, der am Ausgang „gestellt“ beginnt.

Die Wiederholung einer Strategieauswertung ergibt sich aus erneut eintretenden Auslösern und erfordert nicht zwingend eine sichtbare grafische Rückschleife.

### req-fach-027 -- Ordertyp und Eigenschaften der Order in der Strategie

Eine Strategie muss den zu verwendenden Ordertyp festlegen können. Für den gewählten Ordertyp muss die Strategie dessen Eigenschaften mit direkten Werten und/oder Regeln mittels `bestimmen()` belegen können.

Welche Eigenschaften verfügbar beziehungsweise erforderlich sind, ergibt sich aus dem konkreten Ordertyp.

Unter welchen Bedingungen eine gestellte, noch wartende Order bestehen bleibt, legt die Strategie in der Verwaltung dieser Order fest (Fachmodell, req-fach-049a), etwa wenn ein Setup nach dem Stellen einer wartenden Order entfällt.

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

Beim Einfügen in eine Strategie entsteht eine Instanz, die die Standardwerte der Vorlage übernimmt und in der Strategie einen eigenen Namen erhält. Die Instanz ist in der Strategie in vollem Umfang änderbar, auch nach dem Speichern: ihre Parameter, bei einer Regel der fachliche Ausdruck, bei einem Regelwerk die enthaltenen Regeln und ihre Werte. Eine Änderung betrifft nur diese Strategie. Eine Vorlage kann in Bezeichnung, Beschreibung, Standardwerten und, bei Regeln, im fachlichen Ausdruck geändert werden, bestehende Instanzen bleiben davon unberührt. Eine Instanz kann als neue Vorlage gespeichert werden.

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

Elemente des Ablaufs (Bedingung, Berechnung, Parameter setzen, Order aufgeben, Order ändern, Order löschen, Position ändern, Position schließen) müssen eine Tätigkeit oder eine konkrete Prüfung
ausdrücken. Reine Substantive wie „Marktstruktur", „Handelsplanung" oder
„Pending Order" genügen nicht als Ablaufschritt. Jedes Element des Ablaufs trägt die Bezeichnung seines Elementtyps als Tätigkeit, der Anwender kann sie ändern. Elemente, die ein Objekt zeigen, tragen den Namen des Objekts.

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

Die Eigenschaftenansicht einer Instanz zeigt deren Herkunft: die Vorlage, aus der sie entstanden ist, und ihren Objekttyp, zum Beispiel „EMA21, aus Objekttyp EMA“ oder „Risiko, aus Vorlage Risiko je Trade, Objekttyp Regel“. Ein mitgelieferter Indikator ist selbst ein Objekttyp, ein vom Anwender angelegter hat den Objekttyp „Indikator“ (Fachmodell req-fach-013a). Die Eigenschaftenansicht der Strategie selbst (Bezeichnung, Beschreibung, Strategieparameter, Regeln und Regelwerke der Strategie) öffnet ein Klick auf die leere Zeichenfläche.

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

Regeln und Regelwerke stehen nicht als Elemente auf der Zeichenfläche. Der Anwender ordnet sie in der Eigenschaftenansicht der Strategie oder eines Elements („Order aufgeben“, „Order ändern“, „Position ändern“, „Position schließen“) aus der Elementbibliothek zu, einzeln oder als Regelwerk. Vorläufig: Der Auftraggeber hält diese Lösung noch nicht für abschließend. Ob Regeln als eigene Elemente auf der Zeichenfläche gebraucht werden, wird mit den Testfällen erprobt.

### req-ui-013 -- Eingabehilfe für Ausdrücke

Bei der Eingabe eines Ausdrucks zeigt der Designer nach einem Objektnamen und einem Punkt die verfügbaren Eigenschaften dieses Objekts zur Auswahl an, einschließlich der Eigenschaften der Objekte der Anwendung (Fachmodell req-fach-051).

## 7. Arbeitsabläufe

### req-ablauf-001 -- Arbeitsabläufe des Strategiedesigners

Der Strategiedesigner bietet folgende Arbeitsabläufe:

1. Strategie anlegen, öffnen, bearbeiten, speichern, schließen, löschen
2. Objekt (Vorlage) anlegen, öffnen, bearbeiten, speichern, löschen (Indikator, Trend, Regel, Regelwerk)
3. Konsistenzprüfung Strategie und Objekt
4. Einstellungen ändern

### req-ablauf-002 -- Strategie anlegen

Der Anwender wählt „Neue Strategie“. Es öffnet sich eine leere Zeichenfläche ohne Elemente. Bezeichnung und Beschreibung gibt der Anwender in der Eigenschaftenansicht der Strategie ein. Beide sind jederzeit änderbar. Gespeichert wird erst, wenn der Anwender speichert.

### req-ablauf-003 -- Objekte in einer Strategie verwenden

Der Anwender zieht einen Objekttyp oder eine gespeicherte Vorlage aus der Elementbibliothek auf die Zeichenfläche. Es entsteht eine Instanz mit den Standardwerten des Objekttyps beziehungsweise der Vorlage. In der Eigenschaftenansicht gibt der Anwender der Instanz einen Namen (zum Beispiel `EMA21`), unter dem sie in Ausdrücken dieser Strategie angesprochen wird, und setzt ihre Parameter. Zwei Instanzen aus derselben Vorlage sind zwei Objekte der Strategie. Die Instanz wird mit der Strategie gespeichert. Auf Wunsch speichert der Anwender sie als neue Vorlage, die danach in der Elementbibliothek für andere Strategien zur Verfügung steht.

Die Objekte der Anwendung (Fachmodell req-fach-051) sind in Ausdrücken verfügbar; Order und Position bezeichnen in einer Regel die Order beziehungsweise Position, auf die die Regel angewendet wird, und im Ablauf die Order und Position der Verwaltung. Konto, Instrument, Kerze und Tick stehen zusätzlich in der Elementbibliothek und können wie andere Objekte als Instanz auf die Zeichenfläche gelegt werden, um ihre Eigenschaften zu zeigen und ihre Parameter zu setzen, zum Beispiel die Zeiteinheit einer Kerze. Eine Strategie kann mehrere Instanzen davon verwenden. Sie brauchen keine Ablaufverbindung, ebenso wenig wie Indikatoren und Trends.

### req-ablauf-004 -- Objekt anlegen (vorläufig)

Der Anwender wählt in der Elementbibliothek „Neues Objekt“ und einen Objekttyp. In der Eigenschaftenansicht gibt er Bezeichnung, Beschreibung und die Standardwerte der Parameter ein. Nach dem Speichern steht das Objekt in der Elementbibliothek.

### req-ablauf-005 -- Strategie speichern und schließen (vorläufig)

Beim Speichern läuft die Konsistenzprüfung. Befunde werden angezeigt. Gespeichert wird auch bei Befunden. Beim Schließen einer Strategie mit ungespeicherten Änderungen fragt der Designer: speichern, verwerfen oder abbrechen.

### req-ablauf-006 -- Strategie und Objekt löschen

Eine Strategie wird nach Rückfrage gelöscht. Eine Vorlage wird nach Rückfrage gelöscht, bestehende Instanzen in Strategien und anderen Vorlagen bleiben unverändert, weil sie die Werte der Vorlage übernommen haben. Der Designer zeigt vor dem Löschen, welche Strategien und Vorlagen Instanzen aus dieser Vorlage enthalten.

### req-ablauf-007 -- Konsistenzprüfung Strategie

Die Konsistenzprüfung läuft beim Speichern einer Strategie oder einer Vorlage (Regel, Regelwerk, Indikator, Trend) und auf Anforderung. Sie findet mindestens:

- Auslöser ohne Verbindung in den Ablauf (Fehler)
- Element des Ablaufs ohne Verbindung (Fehler). Für Objekte auf der Zeichenfläche (Indikatoren, Trends, Objekte der Anwendung) gilt das nicht, sie werden über Ausdrücke verwendet.
- Fehlerhafter Ausdruck, zum Beispiel Schreibfehler, unbekannte Funktion oder unbekannte Eigenschaft (Fehler)
- Ergebnis einer bestimmenden Regel passt nicht zur Eigenschaft, die sie bestimmt (Fehler)
- Rückführung im Ablauf ohne Bedingung, die sie beendet (Fehler)
- Pflichtparameter ohne Wert, der auch nicht erst bei der Anwendung übergeben wird (Fehler)
- Bedingung, die eine Eigenschaft verwendet, die das Objekt nicht hat (Fehler)
- Regelwerk, dessen Reihenfolge nicht auswertbar ist: Vorwärtsbezug oder Zirkelbezug nach req-fach-045 (Fehler)
- Kein Element „Order aufgeben“ erreichbar (Hinweis)

Speichern ist immer möglich, auch bei Fehlern. Eine Strategie mit Fehlern kann nicht ausgeführt werden. Die Anzeige der Befunde regelt req-ui-011.

### req-ablauf-008 -- Strategie und Objekt öffnen

Der Menüpunkt „Öffnen“ zeigt eine Liste der gespeicherten Strategien mit Bezeichnung, Beschreibung und Zeitpunkt der letzten Änderung. Die Auswahl lädt die Strategie auf die Zeichenfläche. Eine gespeicherte Vorlage öffnet der Anwender aus der Elementbibliothek in ihrer Eigenschaftenansicht. Enthält eine Strategiedatei ein Element, dessen Elementtyp oder Objekttyp der Strategiedesigner nicht kennt, wird die Strategie trotzdem geöffnet und das betroffene Element mit einem Befund der Konsistenzprüfung markiert.

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
9.  Welche Objekte über EMA, ATR und Markttechnik hinaus (Fachmodell req-fach-054) als Grundausstattung mitgeliefert werden. Entscheidung, wenn Erfahrung vorliegt, was gebraucht wird.
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
