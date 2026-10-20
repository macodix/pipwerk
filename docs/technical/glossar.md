# Glossar

## Dokumentstatus

- status: `accepted`
- zweck: Verbindliche Begriffe für alle Dokumente, Aufträge und Abstimmungen mit dem Auftraggeber. Jeder hier fehlende Fachbegriff wird bei seiner Einführung in einem Dokument definiert und hier ergänzt.
- stand: 2026-10-20

## Regeln

- Dokumente, Folien, Aufträge und Antworten an den Auftraggeber verwenden die Begriffe dieses Glossars. Ein Begriff wird nicht durch ein Synonym oder eine wörtliche Übersetzung aus dem Englischen ersetzt.
- Ein neuer Begriff wird beim ersten Auftreten erklärt: was er bezeichnet und wozu er gebraucht wird. Danach wird er hier eingetragen.
- Produktnamen von Werkzeugen und Bibliotheken werden beim ersten Auftreten in einem Text mit ihrem Zweck genannt.

## Fachliche Begriffe

Die fachlichen Objekte selbst sind im [Fachmodell](../design/domain/fachmodell.md) definiert. Hier stehen nur die Begriffe, die über das Fachmodell hinaus in Dokumentation und Oberfläche verwendet werden.

| Begriff | Bedeutung |
| --- | --- |
| Objekt | Etwas, mit dem ein Händler arbeitet, beschrieben im Fachmodell, zum Beispiel Strategie, Trend, Indikator, Regel, Regelwerk oder Order. Ein Objekt hat Eigenschaften, unabhängig davon, ob und wie es auf der Zeichenfläche dargestellt wird. Die Begriffe „Handelsobjekt“ und „fachliches Objekt“ werden nicht verwendet. |
| Objekttyp | Die Art eines Objekts, zum Beispiel „Regel“, „Trend“, „Indikator“ oder ein mitgelieferter Indikator wie „EMA“ oder „Markttechnik“ (Fachmodell req-fach-013a, req-fach-054). Aus einem Objekttyp werden konkrete Objekte mit eigenen Parameterwerten angelegt. |
| Vorlage | Ein gespeichertes Objekt (Indikator, Trend, Regel, Regelwerk) mit Standardwerten. Beim Einfügen in eine Strategie entsteht daraus eine Instanz. |
| Instanz | Das Objekt, das beim Einfügen einer Vorlage oder eines Objekttyps in eine Strategie entsteht. Es ist eine vollständige Kopie: Es übernimmt die Standardwerte und den übrigen Inhalt der Vorlage, trägt einen in der Strategie vergebenen Namen (zum Beispiel EMA21), gehört nur dieser Strategie und nennt seine Herkunft. Eine Instanz kann auch in einer anderen Instanz oder in einer Vorlage enthalten sein (ein Indikator in einem Trend, eine Regel in einem Regelwerk). Zur Ausführung braucht sie ihre Vorlage nicht. |
| Herkunft | Die Angabe einer Instanz, woraus sie entstanden ist: der Objekttyp und, wenn sie aus einer Vorlage entstand, Kennung und Name der Vorlage zum Zeitpunkt des Einfügens (ein Name je Objekt, req-ui-016). Bei einem eingefügten Objekttyp (zum Beispiel `EMA`) fehlen Kennung und Name. Spätere Änderungen oder das Löschen der Vorlage ändern die Herkunft nicht. |
| Kennung | Der sprachneutrale Name eines Typs, einer Eigenschaft, eines Parameters, eines Ausgangs oder eines festgelegten Werts, in Dokumenten und Ausdrücken gespeichert (zum Beispiel `trend_intakt`, `stop_loss`, `flow.condition`). Kennungen von Eigenschaften, Parametern und Werten werden nach einer festen Regel aus dem deutschen Namen gebildet; die Oberfläche zeigt den Namen in der gewählten Sprache. Objekte und Elemente der Strategie tragen eine UUID als Kennung. |
| Namensraum | Die Menge der Namen, die ein Ausdruck an einer Stelle ansprechen kann: von innen nach außen die Parameter einer Regel, die Regeln derselben Liste, der umgebende Namensraum (Strategie oder Vorlage) und die Objekte der Anwendung. Ein innerer Name verdeckt einen äußeren; zwei Namen derselben Ebene sind ein Fehler (Spezifikation 3.3). |
| Ausdruck | Text in der Formelsprache OpenFormula (eine Auswahl), der einen Wert berechnet: in einer Bedingung, Berechnung, Regel, Belegung oder eigenen Eigenschaft. Die Bibliothek zerlegt und prüft ihn, wertet ihn aber nicht aus. Namen stehen in Punkt-Schreibweise (`ema20.wert`), Argumente werden mit `;` getrennt. |
| Normalisierte Schreibweise | Die Schreibweise eines Ausdrucks, in der Namen die Schreibweise ihrer Kennung und Funktionen die Schreibweise der Norm haben (`order.VOLUMEN` wird zu `Order.volumen`, `if(…)` zu `IF(…)`). Alles andere bleibt Zeichen für Zeichen erhalten. Gespeichert wird sie. |
| nicht verfügbar | Der Wert eines Ausdrucks, wenn er eine Eigenschaft ansprechen würde, die das Objekt im Zusammenhang der Auswertung nicht hat, zum Beispiel `Order.limitpreis` bei einer Stop-Order oder `Position`, solange die Order noch keine Position hat (`#N/A` nach OpenFormula). Jede Rechnung damit ergibt „nicht verfügbar“; `ISNA` und `IFNA` fangen ihn ab. Die Wirkung bei der Ausführung steht in der technischen Dokumentation der gemeinsamen Python-Bibliothek. |
| leer | Der Wert einer Eigenschaft ohne Wert: eine Eigenschaft, die der Anwender nicht belegt hat (KANN), oder eine, die das Objekt gerade nicht belegt, zum Beispiel `punkt_2` der Markttechnik ohne Trend. Rechnen und Vergleichen mit „leer“ ist ein Fehler der Auswertung; `ISBLANK` prüft darauf. Nicht zu verwechseln mit „nicht verfügbar“. |
| Objekte der Anwendung | Konto, Instrument, Kerze, Tick, Order, Position und Strategie: Objekte, deren Werte das Handelssystem beziehungsweise der Strategietester bereitstellt. Ihr Objekttyp wird nicht vom Anwender gestaltet und nicht als Vorlage gespeichert. Konto, Instrument, Kerze und Tick können Parameter haben und mehrfach als Instanz verwendet werden. Order und Position bezeichnen in einer Regel die Order beziehungsweise Position, auf die die Regel angewendet wird, im Ablauf die Order und Position der Verwaltung (Fachmodell req-fach-051). |
| Strategieparameter | Ein Wert oder ein Objekt, das an einer Stelle der Strategie festgelegt und überall in ihr verwendet wird, zum Beispiel die Handelszeiteinheit oder ein Instrument (Fachmodell req-fach-046). Er kann im Ablauf mit dem Element „Parameter setzen“ geändert werden. |
| Element | Alles, was der Anwender auf der Zeichenfläche einer Strategie nutzt. Ein Element zeigt ein Objekt (zum Beispiel einen Trend) oder einen Teil des Ablaufs, der kein Objekt ist (Auslöser, Bedingung, Berechnung, Parameter setzen, Order aufgeben, Order ändern, Order löschen, Position ändern, Position schließen, Verbindung). Ob ein Element in mehreren Strategien verwendet werden kann, ist eine Eigenschaft seines Typs, kein eigener Begriff. Die Begriffe „Knoten“ und „Ablaufelement“ werden nicht verwendet. „Baustein“ bezeichnet kein Element, sondern einen Teil einer Bedingung oder Berechnung: einen Wert, einen Vergleich oder eine Verknüpfung (req-ui-015). |
| Elementtyp | Die Art eines Elements, zum Beispiel ein Objekttyp, „Bedingung“ oder „Order aufgeben“. |
| Elementbibliothek | Der Bereich der Oberfläche, der die verfügbaren Elementtypen und die bereits angelegten Objekte zur Auswahl anbietet. |
| Auslöser | Ein Element, das festlegt, bei welchem Ereignis eine Strategie oder die Verwaltung einer Order ausgewertet wird: Kerzenschluss einer Zeiteinheit, Tick oder externes Ereignis. Ein Auslöser steht am Anfang des Ablaufs oder der Verwaltung. Kerzenschluss und Tick haben den Parameter `Instrument`, vorbelegt mit dem Instrument der Anwendung (req-fach-053). Eine Strategie kann Auslöser haben, muss aber nicht; ebenso die Verwaltung einer Order (Anforderungen an den Strategiedesigner req-fach-015). |
| Anwendung einer Strategie | Die Zuordnung einer Strategie zu einem Konto und einem Instrument. Sie besteht, bis der Nutzer sie aufhebt. Dieselbe Strategie, zwei verschiedenen Instrumenten zugeordnet, sind zwei Anwendungen. Eine Anwendung kann über den Parameter `Instrument` ihrer Auslöser und Objekte und die Eigenschaft `Instrument` ihrer Orders auch weitere Instrumente verwenden und darauf handeln (req-fach-053). |
| Auswertung | Ein Durchlauf des Ablaufs einer Anwendung, zum Beispiel bei jedem Kerzenschluss, wenn die Strategie einen Auslöser dafür hat. Wie eine Strategie oder Verwaltung ohne Auslöser ausgewertet wird, ist offen (Anforderungen an den Strategiedesigner req-fach-015). |
| Verwaltung einer Order | Der Teil des Ablaufs nach dem Ausgang „gestellt“ von „Order aufgeben“. Er gilt für genau diese Order und die daraus entstehende Position, kann eigene Auslöser haben (Anforderungen an den Strategiedesigner req-fach-015) und besteht, bis die Order gelöscht oder abgelaufen oder die Position geschlossen ist. |
| Order aufgeben | Das Element, das im Ablauf eine Order veranlasst. Es legt Ordertyp und Eigenschaften der Order fest und übergibt die Order an das Handelssystem. Es hat die Ausgänge „gestellt“ und „nicht gestellt“. |
| Order ändern | Das Element, das Preis, Stop-Loss, Take-Profit oder Gültigkeit einer wartenden Order ändert. Es hat die Ausgänge „geändert“ und „nicht geändert“. |
| Order löschen | Das Element, das eine wartende Order löscht. |
| Position ändern | Das Element, das Stop-Loss oder Take-Profit einer offenen Position ändert. Es hat die Ausgänge „geändert“ und „nicht geändert“. |
| Parameter setzen | Das Element, das einem Strategieparameter im Ablauf einen Wert zuweist. |
| Position schließen | Das Element, das eine offene Position ganz oder teilweise schließt. |
| Regelwerk | Eine benannte, geordnete Sammlung konfigurierter Regeln mit festgelegten Werten. Die Regeln behalten darin ihre Einzelergebnisse. |
| Verbindung | Ein Element in Form einer Linie zwischen zwei Elementen auf der Zeichenfläche, von einem Ausgang zu einem Eingang. Eine Verbindung ist eine Ablaufverbindung oder eine Datenverbindung; beide sind sichtbar unterschieden (req-ui-014). Das Wort „Kante“ wird nicht verwendet. |
| Ablaufverbindung | Eine Verbindung, die die Reihenfolge festlegt: „danach folgt“ im Ablauf, der wahr- oder falsch-Pfad einer Bedingung oder ein anderer Ausgang eines Elements des Ablaufs (req-ui-014). |
| Datenverbindung | Eine Verbindung, die den Weg eines Werts festlegt: von einer Eigenschaft eines Objekts auf der Zeichenfläche zu einem Eingang eines anderen Elements, zum Beispiel einer Bedingung, einer Berechnung, „Order aufgeben“ oder dem Parameter eines anderen Objekts. Ein Ausdruck kann die Eigenschaft auch direkt über den Namen ansprechen; beide Wege führen zum selben Ergebnis (req-ui-014). |
| Ausgang | Die Stelle eines Elements, an der eine Verbindung beginnt: für Ablaufverbindungen die Ausgänge des Ablaufs, zum Beispiel „wahr“ und „falsch“ einer Bedingung oder „gestellt“ und „nicht gestellt“ von „Order aufgeben“; für Datenverbindungen jede Eigenschaft eines Objekts auf der Zeichenfläche (req-ui-014). |
| Eingang | Die Stelle eines Elements, an der eine Verbindung ankommen kann: beim Element des Ablaufs die Stelle für die ankommende Ablaufverbindung, außerdem jede Stelle, an der das Element einen Wert über eine Datenverbindung erhalten kann, zum Beispiel ein Parameter eines Objekts. Ein Eingang kann verbunden oder unverbunden sein; ein unverbundener Parameter erhält seinen Wert auf einem der anderen Wege nach req-fach-046. Ein verbundener Eingang erscheint im Ausdruck des Elements unter seinem Namen (req-ui-014, req-ablauf-007). |
| Eigenschaft | Alles, was ein Objekt beschreibt, ob vom Anwender eingestellt oder vom Objekt ermittelt. Die Richtung eines Trends ist eine Eigenschaft, auch wenn sie berechnet wird. |
| Parameter | Eine Eigenschaft, die der Anwender einstellt, zum Beispiel die Zeiteinheit eines Trends oder die Periode eines gleitenden Durchschnitts. |
| Ergebnis | Das, was eine Regel, eine Bedingung oder eine Berechnung liefert. Objekte liefern keine Ergebnisse, sondern haben Eigenschaften. Der Begriff „Ausgabe“ wird nicht verwendet. |
| Bindungsart | Die Art, wie ein Parameter seinen Wert erhält: fest in der Strategie eingetragen, aus einem Strategieparameter, durch eine Berechnung oder Regel bestimmt, erst bei der Anwendung übergeben, oder aus einer Eigenschaft eines anderen Objekts (Fachmodell req-fach-046). |
| Objektspeicher | Der Ort, an dem Strategien und Vorlagen dauerhaft abgelegt werden, getrennt von den übrigen Daten der Komponente. Als Einstellung wahlfrei: Objektverzeichnis oder Datenbank (Gesamtsystem req-system-012, req-system-015). |
| Objektverzeichnis | Ein Objektspeicher als Dateiverzeichnis mit einer Datei `<Kennung>.<Art>.json` je Objekt (Strategie oder Vorlage). Im Vorhaben `strategiedesign` die einzige Form des Objektspeichers. Der Pfad ist eine Einstellung von pipwerk Studio. Die Dateien sind die einzige Quelle der Objekte; eine Datei, die sich nicht lesen lässt, erscheint in der Liste als „nicht lesbar“ und wird nicht verändert. |
| Zeichenfläche | Der Bereich der Oberfläche, auf dem Elemente angeordnet und verbunden werden. |
| Eigenschaftenansicht | Der Bereich der Oberfläche, in dem die Eigenschaften des ausgewählten Elements angezeigt und seine Parameter geändert werden. |
| Konsistenzprüfung | Die Kontrolle einer Strategie oder einer Vorlage auf Vollständigkeit und Widerspruchsfreiheit, ohne sie auszuführen. Sie läuft beim Speichern und auf Anforderung und ist in der gemeinsamen Python-Bibliothek umgesetzt. Nicht zu verwechseln mit dem Prüfen durch eine Regel. |
| Pflichtparameter | Ein Parameter, der einen Wert haben muss, damit die Konsistenzprüfung keinen Fehler meldet. Welche Parameter Pflicht sind, legt der Objekttyp fest. Alle anderen Parameter sind optional. |
| Standardwert | Der Wert eines Parameters, den eine Vorlage vorgibt. Er wird beim Einfügen in eine Strategie von der Instanz übernommen und dort geändert. |
| Befund | Ein einzelnes Ergebnis der Konsistenzprüfung: eine Unstimmigkeit mit Stufe (Fehler oder Hinweis), Kennung des Befunds, dem betroffenen Element, der betroffenen Instanz oder Regel (oder keinem) und Angaben für den Text. Die Texte stehen in der Oberfläche, nicht in der Bibliothek. |
| Testfall | Eine Teststrategie, an der nachgewiesen wird, dass eine Funktion wie vorgesehen arbeitet. |
| Strategietester | Funktion, in der eine Strategie an historischen Kursdaten Schritt für Schritt abläuft, um zu prüfen, ob sie arbeitet wie gedacht (Anforderungen Strategietester und Backtester). |
| Backtester | Funktion, in der eine Strategie an historischen Kursdaten ohne Unterbrechung über einen Testzeitraum abläuft. Ergebnis sind Kontoentwicklung, Trades und Kennzahlen. Ein einzelner solcher Lauf heißt Backtest. |
| Testlauf | Anwendung einer Strategie auf ein Instrument in einem Testzeitraum mit einem Testkonto, im Strategietester oder im Backtester (req-test-001). |
| Testzeitraum | Zeitraum der historischen Kursdaten, über den ein Testlauf geht (req-test-002). |
| Testkonto | Benannter, gespeicherter Satz von Kontowerten für die Abwicklung eines Testlaufs: Anfangskapital, Kontowährung, Hebel, Spread, Kommission (req-test-005). |
| Interne Order | Order im Strategietester oder Backtester. pipwerk wickelt sie rechnerisch gegen historische Kurse ab, ein Broker erhält sie nicht (req-test-004). |
| Handelnde Stelle | Auswertung im Strategietester, in der der Ablauf „Order aufgeben“, „Order ändern“, „Order löschen“, „Position ändern“ oder „Position schließen“ erreicht (req-test-011). |
| Datenbestand historischer Kursdaten | Von pipwerk geführter Bestand an Kerzen, Ticks und Angaben zum Instrument, aus dem Strategietester und Backtester lesen (req-system-025). |
| Import | Übernahme von Dateien im festgelegten Dateiformat in den Datenbestand historischer Kursdaten (req-system-026). |
| Beschaffung | Holen von Kursdaten und Angaben zum Instrument aus einer Quelle, zum Beispiel MetaTrader 5, als Dateien für den Import (req-system-027). |

## Technische Begriffe

| Begriff | Bedeutung |
| --- | --- |
| Gemeinsame Python-Bibliothek | Das Python-Paket `packages/domain-core` (Paketname `pipwerk_domain`). Es enthält die fachlichen Objekte, ihre Prüf- und Rechenlogik und die Beschreibung der Elementtypen. pipwerk Studio, pipwerk backtest und pipwerk trader binden es ein. |
| Typbeschreibung | Die maschinenlesbare Beschreibung eines Elementtyps oder Objekttyps mit den Feldern Kennung, Art (Auslöser, Element des Ablaufs, Objekttyp, Objekt der Anwendung, Ordertyp, Berechnungsverfahren des Trends), Beschriftung (Name und Beschreibung in Deutsch und Englisch), Parameter (Kennung, Datentyp, Pflicht oder optional, Standardwert, zulässige Werte, erlaubte Bindungsarten, Beschriftung), Eigenschaften (Kennung, Datentyp, MUSS oder KANN, Beschriftung; bei Ordertypen, ob der Anwender sie belegt), Ausgänge, „Regeln zulässig“ und „auf Zeichenfläche“. Die Oberfläche baut daraus Elementbibliothek, Elemente und Eigenschaftenansicht auf. |
| Elementregister | Die Stelle in der gemeinsamen Python-Bibliothek, an der alle Elementtypen und Objekttypen (und die Berechnungsverfahren des Trends) angemeldet sind und von der sie nach Kennung oder als Liste abgefragt werden. Weitere Python-Pakete melden Typen über den Einstiegspunkt `pipwerk.element_types` an. |
| Strategiedokument | Die Darstellung einer Strategie als JSON-Text. Sie wird für Datei, Web-API und Nachrichten verwendet. |
| Strategiedatei | Eine Datei im Objektverzeichnis, die ein Strategiedokument enthält. Sie ist die verbindliche Fassung der Strategie. |
| Schema | Die formale Beschreibung, welche Felder ein Dokument enthalten muss und welche Werte zulässig sind. Pipwerk verwendet JSON-Schema. Schemata liegen versioniert unter `contracts/`. |
| Formatversion | Die Versionsnummer des Schemas, nach dem ein Dokument geschrieben wurde. Sie steht im Dokument und erlaubt, ältere Dateien später zu erkennen und zu überführen. |
| Index | Ein Verzeichnis der gespeicherten Objekte mit Kennung, Name und Beschreibung, das sich aus den Dateien neu aufbauen lässt. In pipwerk Studio gibt es keinen Index und keine Tabelle dafür in der Datenbank (Entscheidung E5): Ein Index wäre nur eine zweite Fassung derselben Daten. Die Dateien im Objektverzeichnis sind die einzige Quelle, das Backend liest sie bei Bedarf. Wird das zu langsam, kann später ein Index ergänzt werden. |
| Schnittstelle | Eine Stelle, an der Daten in ein Programm hinein- oder herauskommen: die Web-API, das Lesen und Schreiben von Dateien, das Lesen der Konfiguration. |
| Web-API | Die über HTTP erreichbare Schnittstelle einer Komponente. Jede Adresse darin heißt Endpunkt. Die öffentliche Web-API von pipwerk Studio liegt unter `/api/v1/` und ist unter `contracts/api/` beschrieben; die übrigen Endpunkte unter `/api/` sind interne Verbindungen der Komponente. |
| Testumgebung | Die auf dem Entwicklungsrechner aus dem Commit eines Arbeitspakets gestartete Komponente. Die QA prüft dort aus Kundensicht, der Auftraggeber erprobt dort und nimmt ab. |
| Entwicklungsrechner | Der Rechner, auf dem Arbeitsverzeichnisse, Testumgebungen und die Sitzungen von Softwarearchitekt und Team liegen. |
| Vorhaben, Arbeitspaket, Auftrag, Übergabedokument, Meldung, Durchlauf | Begriffe des Entwicklungsprozesses, definiert in [Das Pipwerk-Entwicklungsverfahren](entwicklungsverfahren.md#begriffe). |

## Werkzeuge und Bibliotheken

| Name | Zweck in Pipwerk |
| --- | --- |
| FastAPI | Python-Bibliothek, mit der die Web-API einer Komponente gebaut wird. |
| Pydantic | Python-Bibliothek, die Daten an den Schnittstellen prüft und umwandelt: Sie liest JSON ein, prüft Felder und Typen und erzeugt daraus Python-Objekte. Aus ihren Modellen wird das JSON-Schema erzeugt. In der gemeinsamen Python-Bibliothek wird sie nur im Teilpaket für Dokumente (`pipwerk_domain.documents`) verwendet; das Objektmodell besteht aus einfachen Python-Klassen ohne Pydantic. |
| SQLAlchemy | Python-Bibliothek für den Zugriff auf relationale Datenbanken. Welche Datenbank dahinter liegt (derzeit SQLite), steht in der Konfiguration. |
| Alembic | Werkzeug zu SQLAlchemy, das Änderungen am Datenbankaufbau versioniert durchführt. Eine bestehende Datenbank wird damit auf einen neuen Aufbau gebracht, ohne sie neu anzulegen. |
| pytest | Werkzeug für automatische Tests von Python-Code. |
| React, TypeScript, Vite | Grundlage der Browseroberfläche: React für die Bedienelemente, TypeScript als Programmiersprache, Vite zum Bauen und für den Entwicklungsbetrieb. |
| React Flow | Bibliothek für die Zeichenfläche: Anordnen und Verbinden von Elementen im Browser. |
| i18next | Bibliothek für die deutschen und englischen Texte der Oberfläche. |
| TanStack Query | Bibliothek, mit der die Oberfläche Daten der Web-API abruft und zwischenspeichert. |
| Vitest, Testing Library | Werkzeuge für automatische Tests der Oberfläche ohne Browser. |
| Playwright | Werkzeug für automatische Tests in einem echten Browser. Es bedient die Oberfläche wie ein Nutzer. |
| Ruff, mypy | Werkzeuge, die Python-Code auf Stil und Typfehler prüfen. |
| uv | Werkzeug, das Python-Pakete installiert und ihre Versionen festschreibt. |
| tmux | Programm, das Terminalsitzungen im Hintergrund weiterlaufen lässt. Jede Sitzung des Softwarearchitekten läuft in einer eigenen tmux-Sitzung. |

## Änderungsnachweis
| Datum | Änderung |
| --- | --- |
| 2026-10-20 | Auslöser, Auswertung, Verwaltung einer Order: Fundort von req-fach-015 genannt (Anforderungen an den Strategiedesigner, nicht Fachmodell). Folgt aus dem Fundort der Kennung. Hinweis H15 aus `development/backtest/reviews/requirements-1.md`. |
| 2026-10-19 | Strategietester, Backtester, Testlauf, Testzeitraum, Testkonto, Interne Order, Handelnde Stelle, Datenbestand historischer Kursdaten, Import, Beschaffung ergänzt. |
| 2026-10-19 | Eingang auch unverbunden, Parameter als Eingang (req-ui-014, req-ablauf-007; Hinweis N2 aus `development/strategiedesign/reviews/requirements-10.md`). Auslöser mit Parameter `Instrument`, Anwendung mit weiteren Instrumenten (req-fach-053, Entscheidung des Auftraggebers vom 2026-10-19; Hinweis N5 aus `development/strategiedesign/reviews/requirements-11.md`). Satzfolge im Eintrag „Auslöser“ (Hinweis N6 aus `development/strategiedesign/reviews/requirements-12.md`). |
| 2026-10-19 | An die Festlegungen des Auftraggebers vom 2026-10-19 angeglichen: Verbindung als Ablaufverbindung oder Datenverbindung, Ausgang und Eingang ergänzt (req-ui-014, Befund B4); „Baustein“ als Teil einer Bedingung (req-ui-015, Hinweis H3); Strategieparameter auch als Objekt (req-fach-046, Hinweis H10); Name statt Bezeichnung bei Herkunft und Index (req-ui-016, Befund B3). Alle aus `development/strategiedesign/reviews/requirements-9.md`. |
| 2026-10-18 | Auslöser, Auswertung und Verwaltung einer Order an die Entscheidung des Auftraggebers vom 2026-10-18 angeglichen: Auslöser optional, Auswertung ohne Auslöser offen (req-fach-015). Befund B1 aus `development/strategiedesign/reviews/requirements-8.md`. |
| 2026-10-17 | Vorhaben `strategiedesign`, Arbeitspaket `wp01`, Auftrag 03: Index (keine Tabelle in der Datenbank, E5) und Strategiedatei (Objektverzeichnis statt Strategieverzeichnis) berichtigt; Objektverzeichnis und Web-API (öffentliche Web-API unter `/api/v1/`) ergänzt. |
| 2026-10-16 | Vorhaben `strategiedesign`, Arbeitspaket `wp01`, Auftrag 01: Begriffe der gemeinsamen Python-Bibliothek ergänzt (nicht verfügbar, leer, Herkunft, Kennung, Namensraum, Ausdruck, normalisierte Schreibweise); Instanz, Konsistenzprüfung, Befund, Typbeschreibung, Elementregister und Pydantic berichtigt. |
| 2026-10-16 | Objektspeicher und Objektverzeichnis ergänzt, Objekttyp und Bindungsart angepasst. Nachprüfung der QA, Durchlauf 3. |
| 2026-10-16 | Objekte der Anwendung: Order und Position aus dem Zusammenhang. Nachprüfung der QA, Durchlauf 4. |
| 2026-10-15 | Vorlage, Instanz, Objekte der Anwendung, Strategieparameter, Parameter setzen ergänzt. Verweis entfernt. Auslöser, Regelwerk, Verbindung, Standardwert und Ausgänge der Elemente angepasst. Entscheidungen des Auftraggebers im Chat am 2026-10-15 (Vorhaben `strategiedesign`). |
| 2026-10-15 | Objekte der Anwendung: mit Parametern und mehreren Instanzen. Order aufgeben: Eigenschaften statt Parameter. Änderungsnachweis nach Datum geordnet. Entscheidungen des Auftraggebers im Chat am 2026-10-15 (Vorhaben `strategiedesign`, Nachprüfung der QA). |
| 2026-10-14 | Begriff „Testfall“ statt „Prüffall“ (Auftraggeber im Chat). |
| 2026-10-14 | Anwendung einer Strategie, Auswertung und Verwaltung einer Order ergänzt. |
| 2026-10-14 | Order aufgeben: Ausgänge gestellt und abgelehnt. |
| 2026-10-14 | Schreibweise „pipwerk Studio“ nach req-ui-010 im Eintrag „Gemeinsame Python-Bibliothek“. |
| 2026-10-13 | Elemente Order ändern, Order löschen, Position ändern, Position schließen ergänzt. |
| 2026-10-12 | Konsistenzprüfung statt Prüfung, Pflichtparameter und Standardwert ergänzt. |
| 2026-10-12 | Begriffe abgestimmt: Objekt, Objekttyp, Element, Elementtyp, Elementbibliothek, Auslöser, Order aufgeben, Regelwerk, Eigenschaft, Parameter, Ergebnis. Baustein, Ausgabe und Order-Aktion entfallen. |
| 2026-10-12 | Testumgebung und Entwicklungsrechner an den neuen Entwicklungsprozess angepasst, Begriffe des Entwicklungsprozesses verwiesen. |
| 2026-10-11 | Erstfassung. „Teststand“ durch „Testumgebung“ ersetzt. |
