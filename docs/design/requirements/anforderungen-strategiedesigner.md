# Anforderungen an den Trading-Strategiedesigner

## Dokumentstatus

- status: `draft`
- zweck: Anforderungen an das Werkzeug zur Gestaltung und Bearbeitung von Handelsstrategien
- zuletzt aktualisiert: `2026-10-13`

## 1. Zweck und Abgrenzung

Dieses Dokument enthält ausschließlich Anforderungen an den `Strategiedesigner`. Wiederverwendbare fachliche Definitionen werden in `fachmodell.md` geführt. Anforderungen an die Anwendung und Ausführung von Strategien auf konkreten Konten werden in `anforderungen-handelssystem.md` geführt.

## 2. Systemabgrenzung

### req-grund-001 -- Trennung von Strategiedesigner und Handelssystem

Der `Strategiedesigner` dient der Gestaltung und Bearbeitung von Strategiedefinitionen, Regeln und den darin verwendeten Objekten. Sein Ergebnis ist eine ausführbare Strategiedefinition.

Die Zuordnung einer Strategiedefinition zu einem konkreten Handelskonto und deren laufende Anwendung auf diesem Konto gehören nicht zum Strategiedesigner, sondern zum `Handelssystem`.

Zum Handelssystem gehören insbesondere die zur Laufzeit entstehenden konkreten Orders und Positionen sowie deren Verwaltung und Überwachung. Der `OrderManager` ist Bestandteil des Handelssystems und kein Element, das im Strategiedesigner als Bestandteil einer Strategie platziert wird.

Die übergreifende technische Aufteilung und die eigenständige Ausführbarkeit der Hauptkomponenten werden in `anforderungen-gesamtsystem.md` festgelegt.

### req-grund-002 -- Trennung von Definition und Laufzeitinstanz

Eine Strategiedefinition kann Ordertypen und deren Eigenschaften, Bestimmungsverfahren und Regeln festlegen, ohne einem konkreten Handelskonto zugeordnet zu sein.

Erst bei der Anwendung einer Strategie im Handelssystem erfolgt die Zuordnung zu einem konkreten Konto. Eine daraus erzeugte konkrete, ausführbare `Order` MUSS einem Konto zugeordnet sein.

## 3. Anforderungen an fachliche Arbeit im Designer

### req-fach-001 -- Objekte als Grundlage von Strategien

Der Nutzer muss Strategien mit Objekten erstellen können.

Beispiele sind:

-   Trend,
-   Indikator,
-   Marktphase,
-   Bewegung,
-   Korrektur,
-   Order,
-   Position.

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
Objekt beziehungsweise die darin verwendeten Komponenten bestimmt.

### req-fach-006 -- Fachliche Objekte als Grundlage

Der Strategiedesigner arbeitet primär mit Objekten. Objekte repräsentieren
Begriffe und Funktionen der Handelsdomäne.

Der konkrete Inhalt und die Fähigkeiten eines Objekts dürfen
nicht vollständig und unveränderlich in der Benutzeroberfläche
festgelegt sein. Fachliche Objekte müssen erweiterbar beziehungsweise
konfigurierbar sein und ihre verfügbaren Eigenschaften, Parameter, Eigenschaften und Ergebnisse dem Designer maschinenlesbar zur Verfügung stellen können.

### req-fach-007 -- Zusammensetzbare Objekte

Objekte können andere Objekte oder technische Komponenten verwenden oder enthalten. Dadurch muss ihre konkrete Ausprägung
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

Ein neuer Objekttyp kann insbesondere aus bereits vorhandenen Objekten, Indikatoren, Berechnungen oder anderen verfügbaren Komponenten zusammengesetzt werden.

Dadurch ist das fachliche Vokabular des Designers nicht auf die bei der Entwicklung bekannten Begriffe und Handelsansätze beschränkt. Wiederkehrende benutzerspezifische fachliche Konzepte können einmal definiert und anschließend in unterschiedlichen Strategien wiederverwendet werden.

Die konkrete technische Repräsentation eines Objekttyps – beispielsweise als Klasse, Schema, Graphdefinition oder durch einen anderen Mechanismus – ist nicht Bestandteil dieser Anforderung.

### req-fach-015 -- Auslöser für Strategieauswertung

Strategieabläufe werden durch Auslöser gestartet beziehungsweise erneut ausgewertet. Eine Strategie hat mindestens einen Auslöser. Jeder Auslöser ist ein Element auf der Zeichenfläche und steht am Anfang des Ablaufs. Auslöser sind nicht auf periodische Prüfungen beschränkt. Ein zeitbasierter Auslöser kann beispielsweise ein Kerzenschluss sein. Andere ereignisbasierte Auslöser müssen grundsätzlich möglich sein.

Die Wiederholung einer Strategieauswertung ergibt sich aus erneut eintretenden Auslösern und erfordert nicht zwingend eine sichtbare grafische Rückschleife.

### req-fach-027 -- Ordertyp und Parameter in der Strategie

Eine Strategie muss den zu verwendenden Ordertyp festlegen können. Für den gewählten Ordertyp muss die Strategie dessen verfügbare Parameter mit direkten Werten und/oder Regeln mittels `bestimmen()` belegen können.

Welche Parameter verfügbar beziehungsweise erforderlich sind, ergibt sich aus dem konkreten Ordertyp.

Die Strategie muss außerdem festlegen können, unter welchen fachlichen Bedingungen eine aus ihr hervorgehende noch aktive Order gültig bleibt. Dazu kann sie eine Bedingung oder Regel für die spätere Prüfung konfigurieren, etwa wenn ein Setup nach dem Stellen einer Pending Order entfällt. Diese Konfiguration wird bei der Ordererzeugung an die konkrete Order übergeben.

## 4. Konfiguration und Parameter

### req-param-001 -- Konfigurierbare Objekte

Objekte müssen konfigurierbar sein. Zur Konfiguration kann
insbesondere die Zuordnung anderer Objekte oder Komponenten gehören.

Beispielsweise kann einem Objekt ein bestimmter Indikator
oder ein bestimmtes Berechnungsverfahren zugeordnet werden.

### req-param-002 -- Parametrisierbare Objekte und Komponenten

Objekte und die von ihnen verwendeten Komponenten müssen
parametrisierbar sein.

Parameter können beispielsweise sein:

-   Zeiteinheiten,
-   Periodenlängen,
-   Anzahl zu berücksichtigender Kerzen,
-   Schwellenwerte,
-   Parameter eines verwendeten Indikators.

Die verfügbaren Parameter sowie deren Datentypen, zulässige Werte und
gegebenenfalls Standardwerte müssen durch die jeweilige Komponente
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
von Objekten wie Indikatoren oder Strategien nicht fest
einprogrammieren müssen.

Die verwendeten Objekte und Komponenten müssen die für Darstellung und
Konfiguration notwendigen Informationen maschinenlesbar bereitstellen.
Die konkrete technische Umsetzung dieses Mechanismus ist noch nicht
festgelegt.

### req-param-005 -- Parameter und Standardwerte eines gespeicherten Objekts

Ein gespeichertes Objekt legt seinen Objekttyp, seine Parameter und deren Standardwerte fest. Alles, was sich zwischen Strategien unterscheiden kann, ist ein Parameter des Objekts. Beim Trend ist auch das Berechnungsverfahren ein Parameter. Je nach gewähltem Verfahren zeigt die Eigenschaftenansicht die zugehörigen weiteren Parameter.

Die Werte der Parameter legt jede Strategie an der Stelle fest, an der sie das Objekt verwendet. Beim Einfügen werden die Standardwerte übernommen. Eine Änderung eines Parameterwerts in einer Strategie betrifft nur diese Strategie.

Das Bearbeiten eines gespeicherten Objekts beschränkt sich auf das Ergänzen von Parametern und das Ändern von Standardwerten.

### req-param-006 -- Pflichtparameter und optionale Parameter

Der Objekttyp legt fest, welche Parameter Pflichtparameter und welche optional sind. Ein Pflichtparameter ohne Wert, der auch nicht erst bei der Anwendung übergeben wird, ist bei der Konsistenzprüfung ein Fehler. Ein optionaler Parameter ohne Wert ist kein Befund.

## 5. Gemeinsamer Kern des Designers

### req-core-001 -- Ansatzunabhängige Objekte

Der Strategiedesigner stellt Objekte für die Gestaltung von Strategien bereit. Ihre Auswahl und Darstellung richten sich nach der fachlichen Bedeutung im Strategieablauf. Dazu gehören die bereits beschriebenen Objekte wie `Strategie`, `Regel` und konfigurierbare Ordertypen. Weitere Objekte können hinzukommen.

Allgemeine Ablaufbegriffe wie „Entry“ oder „Exit“ sind keine eigenständigen Objekttypen allein aufgrund ihrer Bezeichnung. Der Designer zeigt die jeweils tatsächlich verwendeten Objekte und Tätigkeiten. Welche zusätzlichen Ordertypen, etwa eine `ExitOrder`, benötigt und wie sie definiert werden, ist im Fachmodell festzulegen.

### req-core-002 -- Trennung von Strategie und allgemeinen Regeln

Allgemeine Risiko-, Konto-, Instrument- und Brokerregeln dürfen nicht
als Eigenschaften einer einzelnen Strategie dupliziert werden. Eine
Strategie muss diese Regeln bei Bedarf referenzieren können.

## 6. Darstellung und Detaillierung

### req-ui-001 -- Fachliche Hauptansicht

Die Hauptansicht einer Strategie muss den fachlichen Ablauf zeigen.
Technische Details dürfen die fachliche Lesbarkeit nicht überlagern.

### req-ui-002 -- Ein- und ausklappbare Details

Komplexe Elemente sollen intern aus detaillierteren Elementen
bestehen können. Der Nutzer muss diese Details bei Bedarf öffnen können.

### req-ui-003 -- Tätigkeiten und Prüfungen im Ablauf

Elemente des Ablaufs müssen eine Tätigkeit oder eine konkrete Prüfung
ausdrücken. Reine Substantive wie „Marktstruktur", „Handelsplanung" oder
„Pending Order" genügen nicht als Ablaufschritt.

Geeignete Beispiele sind:

-   „Trend und Marktphase prüfen",
-   „Trade planen",
-   „Handelbarkeit prüfen",
-   „Pending Order stellen",
-   „Ausstehende Order überwachen".

### req-ui-004 -- Fachlicher und technischer Detailgrad getrennt

Die fachliche Darstellung und die technische Ausführungsspezifikation
müssen getrennte, miteinander verknüpfte Ebenen bilden.

### req-ui-005 -- Dynamische Eigenschaftenansicht

Auswahl und Konfiguration eines Objekts erfolgen über eine
zugehörige Eigenschaftenansicht.

Diese Eigenschaftenansicht muss soweit möglich dynamisch aus den vom
konkreten Objekt und seinen verwendeten Komponenten bereitgestellten
Metadaten aufgebaut werden. Sie darf keine Kenntnis einer konkreten
Handelsstrategie voraussetzen.

### req-ui-006 -- Hierarchische Darstellung komplexer Abläufe

Die Strategie muss als verständliche Gesamtübersicht darstellbar bleiben. Komplexe Teilabläufe wie Einstieg, Orderablauf und Positionsmanagement müssen separat detailliert werden können, ohne ihre Verbindung im Gesamtprozess zu verlieren. Die endgültige Aufteilung und Benennung dieser Teilbereiche ist noch nicht festgelegt.

### req-ui-007 -- Deutsch und Englisch als Oberflächensprachen

Der Prototyp unterstützt Deutsch und Englisch als auswählbare Sprachen der Benutzeroberfläche. Dazu gehören insbesondere Menüs, Beschriftungen und Erläuterungen von Objekten, Eigenschaften und Ergebnissen sowie Meldungen zur Konsistenzprüfung einer Strategie.

Ein Wechsel der Oberflächensprache darf die fachliche Bedeutung oder gespeicherte Konfiguration einer Strategie nicht verändern. Die Zuordnung von Objekten, Eigenschaften und Ergebnisse muss unabhängig vom angezeigten Sprachtext erfolgen. Vom Nutzer vergebene Namen und frei eingegebene Texte werden durch einen Sprachwechsel nicht automatisch übersetzt.

### req-ui-008 -- Dauerhafte Oberflächensprache des Strategiedesigners

Der Strategiedesigner muss die gewählte Oberflächensprache als zentrale Einstellung der Komponente dauerhaft speichern. Wenn noch keine Sprache gespeichert ist, startet der Strategiedesigner auf Deutsch. Nach der Auswahl von Englisch oder dem Rückwechsel zu Deutsch muss die gewählte Sprache sowohl nach einem Neuladen der Oberfläche als auch nach einem Neustart des Strategiedesigners wiederhergestellt werden.

Die Einstellung gilt ausschließlich für den Strategiedesigner. Ihre Änderung darf weder Strategieinhalte noch sonstige fachliche Konfigurationen verändern. Die Sprache wird nicht im Browser und nicht benutzerbezogen gespeichert. Benutzerkonten, Anmeldung und weitere Oberflächensprachen gehören nicht zu dieser Anforderung.

### req-ui-009 -- Einstellungsbereich

Der Strategiedesigner bietet einen eigenen Menüpunkt „Einstellungen“. Dort werden alle Einstellungen der Komponente angezeigt und geändert, die über die Oberfläche änderbar sind. Die Auswahl der Oberflächensprache Deutsch oder Englisch (req-ui-007, req-ui-008) befindet sich in diesem Bereich und nicht an anderer Stelle der Oberfläche. Das Verzeichnis, in dem Strategien und die übrigen eigenständig gespeicherten Objekte als Dateien abgelegt werden, wird ebenfalls dort angezeigt und geändert. Weitere Einstellungen kommen dort hinzu, wenn sie festgelegt werden.

### req-ui-010 -- Angaben zu pipwerk studio

pipwerk studio, der Strategiedesigner (Name laut [Projektziel](../projektziel.md)), zeigt auf Anforderung des Anwenders einen Dialog „Über pipwerk studio“. Er enthält:

- den Namen „pipwerk studio“
- den Stand: die vollständige Kennung des Commits, aus dem pipwerk studio läuft, mit Datum und Uhrzeit dieses Commits in der Ortszeit des Browsers. Kennung, Datum und Uhrzeit sind in der bereitgestellten Software selbst enthalten. Für die Anzeige wird keine Internetverbindung genutzt. Fehlen die Angaben, steht dort „unbekannt“.
- die Lizenz: Name und vollständiger Text der „GNU General Public License, Version 3“, immer im englischen Original
- die Adresse https://github.com/macodix/pipwerk als Verweis, der sich in einem neuen Tab öffnet

Der Dialog wird über die Schaltfläche „Über pipwerk studio“ (englisch „About pipwerk studio“) in der Kopfzeile rechts neben der Sprachauswahl geöffnet. Solange der Dialog offen ist, ist die übrige Oberfläche gesperrt. Der Dialog wird nur mit der Schaltfläche „Schließen“ oder der Escape-Taste geschlossen. Alle übrigen Texte des Dialogs folgen der Oberflächensprache (req-ui-007). Die Standanzeige in der Fußzeile bleibt bestehen.


## 7. Arbeitsabläufe

### req-ablauf-001 -- Arbeitsabläufe des Strategiedesigners

Der Strategiedesigner bietet folgende Arbeitsabläufe:

1. Strategie anlegen, öffnen, bearbeiten, speichern, schließen, löschen
2. Objekt anlegen, öffnen, bearbeiten, speichern, löschen (Indikator, Trend, Regel, Regelwerk)
3. Konsistenzprüfung Strategie
4. Einstellungen ändern

### req-ablauf-002 -- Strategie anlegen

Der Anwender wählt „Neue Strategie“. Es öffnet sich eine leere Zeichenfläche mit einem Auslöser-Element, dessen Parameter noch zu setzen sind. Bezeichnung und Beschreibung gibt der Anwender in der Eigenschaftenansicht der Strategie ein. Beide sind jederzeit änderbar. Gespeichert wird erst, wenn der Anwender speichert.

### req-ablauf-003 -- Objekte in einer Strategie verwenden

Der Anwender zieht einen Objekttyp aus der Elementbibliothek auf die Zeichenfläche und setzt die Parameter in der Eigenschaftenansicht. Beim Speichern der Strategie wird das Objekt als eigenes Objekt mitgespeichert und steht danach in der Elementbibliothek für andere Strategien zur Verfügung.

Alternativ zieht der Anwender ein bereits gespeichertes Objekt aus der Elementbibliothek auf die Zeichenfläche. Die Parameterwerte setzt die Strategie an der Verwendungsstelle (req-param-005).

### req-ablauf-004 -- Objekt anlegen (vorläufig)

Der Anwender wählt in der Elementbibliothek „Neues Objekt“ und einen Objekttyp. In der Eigenschaftenansicht gibt er Bezeichnung, Beschreibung und die Standardwerte der Parameter ein. Nach dem Speichern steht das Objekt in der Elementbibliothek.

### req-ablauf-005 -- Strategie speichern und schließen (vorläufig)

Beim Speichern läuft die Konsistenzprüfung. Befunde werden angezeigt. Gespeichert wird auch bei Befunden. Beim Schließen einer Strategie mit ungespeicherten Änderungen fragt der Designer: speichern, verwerfen oder abbrechen.

### req-ablauf-006 -- Strategie und Objekt löschen

Eine Strategie wird nach Rückfrage gelöscht. Ein Objekt, das noch in Strategien verwendet wird, kann nicht gelöscht werden. Der Designer zeigt, welche Strategien es verwenden.

### req-ablauf-007 -- Konsistenzprüfung Strategie

Die Konsistenzprüfung läuft beim Speichern und auf Anforderung. Sie findet mindestens:

- Auslöser ohne Verbindung in den Ablauf (Fehler)
- Element ohne Verbindung (Fehler)
- Pflichtparameter ohne Wert, der auch nicht erst bei der Anwendung übergeben wird (Fehler)
- Bedingung, die eine Eigenschaft verwendet, die das Objekt nicht hat (Fehler)
- Kein Element „Order aufgeben“ erreichbar (Hinweis)

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
7.  Mit welchem technischen Mechanismus Objekte ihre Eigenschaften,
    Parameter und Ergebnisse für Designer und GUI maschinenlesbar
    bereitstellen.
8.  Ob Pipwerk künftig Benutzerkonten benötigt. Falls Benutzerkonten
    eingeführt werden, ist gesondert zu entscheiden, ob die
    Oberflächensprache pro Benutzer gespeichert wird.
9.  Welche Objekte als Grundausstattung mitgeliefert werden. Entscheidung, wenn Erfahrung vorliegt, was gebraucht wird.

## 10. Änderungsnachweis


  -----------------------------------------------------------------------
  Datum                               Änderung
  ----------------------------------- -----------------------------------
  2026-09-18                          Erstanlage aus den bestätigten
                                      Diskussionsergebnissen

  2026-09-20                          Festlegung „eigene Fachbibliothek
                                      je Handelsansatz" entfernt;
                                      Anforderungen zu konfigurierbaren
                                      und parametrisierbaren fachlichen
                                      Objekten, dynamisch
                                      bereitgestellten
                                      Eigenschaften/Ergebnissen,
                                      Parameterbindung zur
                                      Strategiedefinition oder Laufzeit
                                      und dynamischer
                                      GUI-Eigenschaftenansicht ergänzt
  -----------------------------------------------------------------------
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
