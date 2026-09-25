# Anforderungen an den Trading-Strategiedesigner

## Dokumentstatus

- status: `draft`
- zweck: Anforderungen an das Werkzeug zur Gestaltung und Bearbeitung von Handelsstrategien
- zuletzt aktualisiert: `2026-09-25`

## 1. Zweck und Abgrenzung

Dieses Dokument enthält ausschließlich Anforderungen an den `Strategiedesigner`. Wiederverwendbare fachliche Definitionen werden in `fachmodell.md` geführt. Anforderungen an die Anwendung und Ausführung von Strategien auf konkreten Konten werden in `anforderungen-handelssystem.md` geführt.

## 2. Systemabgrenzung

### req-grund-001 -- Trennung von Strategiedesigner und Handelssystem

Der `Strategiedesigner` dient der Gestaltung und Bearbeitung von Strategiedefinitionen, Regeln und den darin verwendeten fachlichen Elementen. Sein Ergebnis ist eine ausführbare Strategiedefinition.

Die Zuordnung einer Strategiedefinition zu einem konkreten Handelskonto und deren laufende Anwendung auf diesem Konto gehören nicht zum Strategiedesigner, sondern zum `Handelssystem`.

Zum Handelssystem gehören insbesondere die zur Laufzeit entstehenden konkreten Orders und Positionen sowie deren Verwaltung und Überwachung. Der `OrderManager` ist Bestandteil des Handelssystems und kein Element, das im Strategiedesigner als Bestandteil einer Strategie platziert wird.

Die übergreifende technische Aufteilung und die eigenständige Ausführbarkeit der Hauptkomponenten werden in `anforderungen-gesamtsystem.md` festgelegt.

### req-grund-002 -- Trennung von Definition und Laufzeitinstanz

Eine Strategiedefinition kann Ordertypen und deren Eigenschaften, Bestimmungsverfahren und Regeln festlegen, ohne einem konkreten Handelskonto zugeordnet zu sein.

Erst bei der Anwendung einer Strategie im Handelssystem erfolgt die Zuordnung zu einem konkreten Konto. Eine daraus erzeugte konkrete, ausführbare `Order` MUSS einem Konto zugeordnet sein.

## 3. Anforderungen an fachliche Arbeit im Designer

### req-fach-001 -- Fachliche Elemente als primäre Bausteine

Der Nutzer muss Strategien mit fachlichen Elementen erstellen können.

Beispiele sind:

-   Trend,
-   Indikator,
-   Marktphase,
-   Bewegung,
-   Korrektur,
-   Order,
-   Position.

Weitere fachliche Elemente können abhängig von der konkreten Strategie,
dem verwendeten Berechnungsverfahren oder anderen fachlichen
Anforderungen hinzukommen.

### req-fach-002 -- Fachbegriffe bleiben sichtbar

Die Fachbegriffe müssen in der grafischen Darstellung sichtbar bleiben.
Sie dürfen auf der primären Arbeitsebene nicht durch allgemeine
technische Begriffe ersetzt werden.

### req-fach-003 -- Ausführbare Bedeutung

Ein fachliches Element darf nicht nur eine grafische Beschriftung sein.
Es benötigt eine eindeutige fachliche Definition und eine ausführbare
Bedeutung für Prüfung, Backtest und Live-Ausführung.

### req-fach-004 -- Fachliche Bedingungen

Der Designer muss Bedingungen aus fachlichen Werten und Ergebnissen
bilden können.

Beispiele:

> Trendrichtung = long

> Trendrichtung != seitwärts

Welche Werte und Ergebnisse für eine Bedingung verfügbar sind, muss sich
aus den tatsächlich verwendeten fachlichen Objekten und Berechnungen
ergeben und darf nicht für einzelne Strategien fest in der
Benutzeroberfläche hinterlegt sein.

### req-fach-005 -- Referenzierbare fachliche Ergebnisse

Ergebnisse einer fachlichen Auswertung müssen von nachfolgenden
Elementen einzeln verwendet werden können.

Welche Ergebnisse verfügbar sind, wird durch das jeweilige fachliche
Objekt beziehungsweise die darin verwendeten Komponenten bestimmt.

### req-fach-006 -- Fachliche Objekte als Grundlage

Der Strategiedesigner arbeitet primär mit fachlichen Objekten
beziehungsweise fachlichen Bausteinen. Fachliche Objekte repräsentieren
Begriffe und Funktionen der Handelsdomäne.

Der konkrete Inhalt und die Fähigkeiten eines fachlichen Objekts dürfen
nicht vollständig und unveränderlich in der Benutzeroberfläche
festgelegt sein. Fachliche Objekte müssen erweiterbar beziehungsweise
konfigurierbar sein und ihre verfügbaren Eigenschaften, Parameter, Ein-
und Ausgaben dem Designer maschinenlesbar zur Verfügung stellen können.

### req-fach-007 -- Zusammensetzbare fachliche Objekte

Fachliche Objekte können andere fachliche beziehungsweise technische
Objekte verwenden oder enthalten. Dadurch muss ihre konkrete Ausprägung
konfigurierbar sein.

Beispielsweise kann ein fachliches Objekt `Trend` ein oder mehrere
Verfahren beziehungsweise Indikatoren zur Trendbestimmung verwenden.
Welche Indikatoren verwendet werden, ist nicht generell durch den
Designer vorgegeben, sondern Bestandteil der jeweiligen Konfiguration.

Die Benutzeroberfläche muss die von einem konkret konfigurierten Objekt
bereitgestellten Eigenschaften, Parameter und Ergebnisse dynamisch
darstellen können.

### req-fach-008 -- Keine unbegründete Austauschbarkeit

Unterschiedliche Berechnungsverfahren dürfen nicht allein deshalb als
austauschbar behandelt werden, weil sie einzelne gleich benannte
Ergebnisse liefern.

Eine Strategie kann fachliche Ergebnisse benötigen, die nur bestimmte
Verfahren bereitstellen. Beispielsweise kann eine Strategie neben einer
Trendrichtung zusätzliche fachliche Merkmale benötigen. Der Designer
muss solche Abhängigkeiten abbilden und prüfen können.

### req-fach-009 – Benutzerdefinierte fachliche Objekttypen

Der Strategiedesigner muss die Definition neuer fachlicher Objekttypen ermöglichen, ohne dass dafür der Strategiedesigner selbst geändert werden muss.

Benutzerdefinierte fachliche Objekttypen müssen hinsichtlich Konfiguration, Parametrisierung, Ein- und Ausgaben sowie Wiederverwendung grundsätzlich wie mitgelieferte fachliche Objekttypen behandelt werden können.

Ein neuer fachlicher Objekttyp kann insbesondere aus bereits vorhandenen fachlichen Objekten, Indikatoren, Berechnungen oder anderen verfügbaren Komponenten zusammengesetzt werden.

Dadurch ist das fachliche Vokabular des Designers nicht auf die bei der Entwicklung bekannten Begriffe und Handelsansätze beschränkt. Wiederkehrende benutzerspezifische fachliche Konzepte können einmal definiert und anschließend in unterschiedlichen Strategien wiederverwendet werden.

Die konkrete technische Repräsentation eines fachlichen Objekttyps – beispielsweise als Klasse, Schema, Graphdefinition oder durch einen anderen Mechanismus – ist nicht Bestandteil dieser Anforderung.

### req-fach-015 -- Auslöser für Strategieauswertung

Strategieabläufe werden durch einen fachlich benannten Auslöser gestartet beziehungsweise erneut ausgewertet. Auslöser sind nicht auf periodische Prüfungen beschränkt. Ein zeitbasierter Auslöser kann beispielsweise ein Kerzenschluss sein; andere ereignisbasierte Auslöser müssen grundsätzlich möglich sein.

Die Wiederholung einer Strategieauswertung ergibt sich aus erneut eintretenden Auslösern und erfordert nicht zwingend eine sichtbare grafische Rückschleife.

### req-fach-027 -- Ordertyp und Parameter in der Strategie

Eine Strategie muss den zu verwendenden Ordertyp festlegen können. Für den gewählten Ordertyp muss die Strategie dessen verfügbare Parameter mit direkten Werten und/oder Regeln mittels `bestimmen()` belegen können.

Welche Parameter verfügbar beziehungsweise erforderlich sind, ergibt sich aus dem konkreten Ordertyp.

Die Strategie muss außerdem festlegen können, unter welchen fachlichen Bedingungen eine aus ihr hervorgehende noch aktive Order gültig bleibt. Dazu kann sie eine Bedingung oder Regel für die spätere Prüfung konfigurieren, etwa wenn ein Setup nach dem Stellen einer Pending Order entfällt. Diese Konfiguration wird bei der Ordererzeugung an die konkrete Order übergeben.

## 4. Konfiguration und Parameter

### req-param-001 -- Konfigurierbare fachliche Objekte

Fachliche Objekte müssen konfigurierbar sein. Zur Konfiguration kann
insbesondere die Zuordnung anderer Objekte oder Komponenten gehören.

Beispielsweise kann einem fachlichen Objekt ein bestimmter Indikator
oder ein bestimmtes Berechnungsverfahren zugeordnet werden.

### req-param-002 -- Parametrisierbare fachliche Objekte und Komponenten

Fachliche Objekte und die von ihnen verwendeten Komponenten müssen
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
fachlicher Objekte, Indikatoren oder Strategien nicht fest
einprogrammieren müssen.

Die verwendeten Objekte und Komponenten müssen die für Darstellung und
Konfiguration notwendigen Informationen maschinenlesbar bereitstellen.
Die konkrete technische Umsetzung dieses Mechanismus ist noch nicht
festgelegt.

## 5. Gemeinsamer Kern des Designers

### req-core-001 -- Ansatzunabhängige fachliche Objekte

Der Strategiedesigner stellt fachliche Objekte für die Gestaltung von Strategien bereit. Ihre Auswahl und Darstellung richten sich nach der fachlichen Bedeutung im Strategieablauf. Dazu gehören die bereits beschriebenen Objekte wie `Signal`, `Regel` und konfigurierbare Ordertypen; weitere fachliche Objekte können hinzukommen.

Allgemeine Ablaufbegriffe wie „Entry“ oder „Exit“ sind keine eigenständigen Objekttypen allein aufgrund ihrer Bezeichnung. Der Designer zeigt die jeweils tatsächlich verwendeten fachlichen Objekte und Tätigkeiten. Welche zusätzlichen Ordertypen, etwa eine `ExitOrder`, benötigt und wie sie definiert werden, ist im Fachmodell festzulegen.

### req-core-002 -- Trennung von Strategie und allgemeinen Regeln

Allgemeine Risiko-, Konto-, Instrument- und Brokerregeln dürfen nicht
als Eigenschaften einer einzelnen Strategie dupliziert werden. Eine
Strategie muss diese Regeln bei Bedarf referenzieren können.

## 6. Darstellung und Detaillierung

### req-ui-001 -- Fachliche Hauptansicht

Die Hauptansicht einer Strategie muss den fachlichen Ablauf zeigen.
Technische Details dürfen die fachliche Lesbarkeit nicht überlagern.

### req-ui-002 -- Ein- und ausklappbare Details

Komplexe fachliche Elemente sollen intern aus detaillierteren Elementen
bestehen können. Der Nutzer muss diese Details bei Bedarf öffnen können.

### req-ui-003 -- Tätigkeiten und Prüfungen im Ablauf

Ablaufelemente müssen eine Tätigkeit oder eine konkrete Prüfung
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

Auswahl und Konfiguration eines fachlichen Objekts erfolgen über eine
zugehörige Eigenschaftenansicht.

Diese Eigenschaftenansicht muss soweit möglich dynamisch aus den vom
konkreten Objekt und seinen verwendeten Komponenten bereitgestellten
Metadaten aufgebaut werden. Sie darf keine Kenntnis einer konkreten
Handelsstrategie voraussetzen.

### req-ui-006 -- Hierarchische Darstellung komplexer Abläufe

Die Strategie muss als verständliche Gesamtübersicht darstellbar bleiben. Komplexe Teilabläufe wie Einstieg, Orderablauf und Positionsmanagement müssen separat detailliert werden können, ohne ihre Verbindung im Gesamtprozess zu verlieren. Die endgültige Aufteilung und Benennung dieser Teilbereiche ist noch nicht festgelegt.

### req-ui-007 -- Deutsch und Englisch als Oberflächensprachen

Der Prototyp unterstützt Deutsch und Englisch als auswählbare Sprachen der Benutzeroberfläche. Dazu gehören insbesondere Menüs, Beschriftungen und Erläuterungen fachlicher Objekte, Parameter und Ergebnisse sowie Meldungen zur Prüfung einer Strategie.

Ein Wechsel der Oberflächensprache darf die fachliche Bedeutung oder gespeicherte Konfiguration einer Strategie nicht verändern. Die Zuordnung fachlicher Objekte, Eigenschaften und Ergebnisse muss unabhängig vom angezeigten Sprachtext erfolgen. Vom Nutzer vergebene Namen und frei eingegebene Texte werden durch einen Sprachwechsel nicht automatisch übersetzt.

## 7. Dokumententrennung

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

## 8. Noch offene Punkte


Die folgenden Punkte sind noch nicht entschieden:

1.  Wie fachliche Objekte und Definitionen erstellt, strukturiert,
    versioniert und erweitert werden.
2.  Wie Nutzer eigene fachliche Objekte beziehungsweise Definitionen
    bereitstellen können.
3.  Welche allgemeinen technischen Elemente fortgeschrittene Nutzer
    direkt verwenden dürfen.
4.  Wie die Kompatibilität zwischen fachlichen Objekten,
    Berechnungsverfahren und benötigten Ergebnissen geprüft und
    dargestellt wird.
5.  Wie fachliche Elemente intern in ausführbare technische Elemente
    übersetzt werden.
6.  Wie Änderungen einer Fachdefinition bestehende Strategien und
    Backtests beeinflussen.
7.  Mit welchem technischen Mechanismus Objekte ihre Eigenschaften,
    Parameter, Ein- und Ausgaben für Designer und GUI maschinenlesbar
    bereitstellen.

## 9. Änderungsnachweis


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
