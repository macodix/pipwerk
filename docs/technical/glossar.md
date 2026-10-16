# Glossar

## Dokumentstatus

- status: `accepted`
- zweck: Verbindliche Begriffe für alle Dokumente, Aufträge und Abstimmungen mit dem Auftraggeber. Jeder hier fehlende Fachbegriff wird bei seiner Einführung in einem Dokument definiert und hier ergänzt.
- stand: 2026-10-15

## Regeln

- Dokumente, Folien, Aufträge und Antworten an den Auftraggeber verwenden die Begriffe dieses Glossars. Ein Begriff wird nicht durch ein Synonym oder eine wörtliche Übersetzung aus dem Englischen ersetzt.
- Ein neuer Begriff wird beim ersten Auftreten erklärt: was er bezeichnet und wozu er gebraucht wird. Danach wird er hier eingetragen.
- Produktnamen von Werkzeugen und Bibliotheken werden beim ersten Auftreten in einem Text mit ihrem Zweck genannt.

## Fachliche Begriffe

Die fachlichen Objekte selbst sind im [Fachmodell](../design/domain/fachmodell.md) definiert. Hier stehen nur die Begriffe, die über das Fachmodell hinaus in Dokumentation und Oberfläche verwendet werden.

| Begriff | Bedeutung |
| --- | --- |
| Objekt | Etwas, mit dem ein Händler arbeitet, beschrieben im Fachmodell, zum Beispiel Strategie, Trend, Indikator, Regel, Regelwerk oder Order. Ein Objekt hat Eigenschaften, unabhängig davon, ob und wie es auf der Zeichenfläche dargestellt wird. Die Begriffe „Handelsobjekt“ und „fachliches Objekt“ werden nicht verwendet. |
| Objekttyp | Die Art eines Objekts, zum Beispiel „Regel“, „Trend“ oder ein mitgelieferter Indikator wie „EMA“ oder „Markttechnik“ (Fachmodell req-fach-013a, req-fach-054). Aus einem Objekttyp werden konkrete Objekte mit eigenen Parameterwerten angelegt. |
| Vorlage | Ein gespeichertes Objekt (Indikator, Trend, Regel, Regelwerk) mit Standardwerten. Beim Einfügen in eine Strategie entsteht daraus eine Instanz. |
| Instanz | Das Objekt, das beim Einfügen einer Vorlage oder eines Objekttyps in eine Strategie entsteht. Es übernimmt die Standardwerte, trägt einen in der Strategie vergebenen Namen (zum Beispiel EMA21), gehört nur dieser Strategie und nennt seine Herkunft. |
| Objekte der Anwendung | Konto, Instrument, Kerze, Tick, Order, Position und Strategie: Objekte, deren Werte das Handelssystem beziehungsweise der Strategietester bereitstellt. Ihr Objekttyp wird nicht vom Anwender gestaltet und nicht als Vorlage gespeichert. Konto, Instrument, Kerze und Tick können Parameter haben und mehrfach als Instanz verwendet werden. Order und Position bezeichnen in einer Regel die Order, auf die sie angewendet wird, im Ablauf die Order der Verwaltung (Fachmodell req-fach-051). |
| Strategieparameter | Ein Wert, der an einer Stelle der Strategie festgelegt und überall in ihr verwendet wird, zum Beispiel die Handelszeiteinheit. Er kann im Ablauf mit dem Element „Parameter setzen“ geändert werden. |
| Element | Alles, was der Anwender auf der Zeichenfläche einer Strategie nutzt. Ein Element zeigt ein Objekt (zum Beispiel einen Trend) oder einen Teil des Ablaufs, der kein Objekt ist (Auslöser, Bedingung, Berechnung, Parameter setzen, Order aufgeben, Order ändern, Order löschen, Position ändern, Position schließen, Verbindung). Ob ein Element in mehreren Strategien verwendet werden kann, ist eine Eigenschaft seines Typs, kein eigener Begriff. Die Begriffe „Baustein“, „Knoten“ und „Ablaufelement“ werden nicht verwendet. |
| Elementtyp | Die Art eines Elements, zum Beispiel ein Objekttyp, „Bedingung“ oder „Order aufgeben“. |
| Elementbibliothek | Der Bereich der Oberfläche, der die verfügbaren Elementtypen und die bereits angelegten Objekte zur Auswahl anbietet. |
| Auslöser | Ein Element, das festlegt, bei welchem Ereignis eine Strategie oder die Verwaltung einer Order ausgewertet wird: Kerzenschluss einer Zeiteinheit, Tick oder externes Ereignis. Es steht am Anfang des Ablaufs oder der Verwaltung. Jede Strategie hat mindestens einen Auslöser. |
| Anwendung einer Strategie | Die Zuordnung einer Strategie zu einem Konto und einem Instrument. Sie besteht, bis der Nutzer sie aufhebt. Dieselbe Strategie auf zwei Instrumenten sind zwei Anwendungen. |
| Auswertung | Ein Durchlauf des Ablaufs einer Anwendung, ausgelöst durch einen Auslöser, zum Beispiel jeden Kerzenschluss. |
| Verwaltung einer Order | Der Teil des Ablaufs nach dem Ausgang „gestellt“ von „Order aufgeben“. Er läuft mit eigenen Auslösern für genau diese Order und die daraus entstehende Position, bis die Order gelöscht oder abgelaufen oder die Position geschlossen ist. |
| Order aufgeben | Das Element, das im Ablauf eine Order veranlasst. Es legt Ordertyp und Eigenschaften der Order fest und übergibt die Order an das Handelssystem. Es hat die Ausgänge „gestellt“ und „nicht gestellt“. |
| Order ändern | Das Element, das Preis, Stop-Loss, Take-Profit oder Gültigkeit einer wartenden Order ändert. Es hat die Ausgänge „geändert“ und „nicht geändert“. |
| Order löschen | Das Element, das eine wartende Order löscht. |
| Position ändern | Das Element, das Stop-Loss oder Take-Profit einer offenen Position ändert. Es hat die Ausgänge „geändert“ und „nicht geändert“. |
| Parameter setzen | Das Element, das einem Strategieparameter im Ablauf einen Wert zuweist. |
| Position schließen | Das Element, das eine offene Position ganz oder teilweise schließt. |
| Regelwerk | Eine benannte, geordnete Sammlung konfigurierter Regeln mit festgelegten Werten. Die Regeln behalten darin ihre Einzelergebnisse. |
| Verbindung | Ein Element in Form einer Linie zwischen zwei Elementen auf der Zeichenfläche. Sie bedeutet „danach folgt“ im Ablauf, den wahr- oder falsch-Pfad einer Bedingung oder einen Ausgang eines Elements. Eigenschaften werden nicht über Verbindungen, sondern in Ausdrücken verwendet. Das Wort „Kante“ wird nicht verwendet. |
| Eigenschaft | Alles, was ein Objekt beschreibt, ob vom Anwender eingestellt oder vom Objekt ermittelt. Die Richtung eines Trends ist eine Eigenschaft, auch wenn sie berechnet wird. |
| Parameter | Eine Eigenschaft, die der Anwender einstellt, zum Beispiel die Zeiteinheit eines Trends oder die Periode eines gleitenden Durchschnitts. |
| Ergebnis | Das, was eine Regel, eine Bedingung oder eine Berechnung liefert. Objekte liefern keine Ergebnisse, sondern haben Eigenschaften. Der Begriff „Ausgabe“ wird nicht verwendet. |
| Bindungsart | Die Art, wie ein Parameter seinen Wert erhält: fest in der Strategie eingetragen, aus einem Strategieparameter, durch eine Berechnung oder Regel bestimmt, erst bei der Anwendung übergeben, oder aus einer Eigenschaft eines anderen Objekts (Fachmodell req-fach-046). |
| Objektspeicher | Der Ort, an dem Strategien und Vorlagen dauerhaft abgelegt werden, getrennt von den übrigen Daten der Komponente. Als Einstellung wahlfrei: Objektverzeichnis oder Datenbank (Gesamtsystem req-system-012, req-system-015). |
| Objektverzeichnis | Ein Objektspeicher als Dateiverzeichnis mit einer Datei je Objekt. Im Vorhaben `strategiedesign` die einzige Form des Objektspeichers. |
| Zeichenfläche | Der Bereich der Oberfläche, auf dem Elemente angeordnet und verbunden werden. |
| Eigenschaftenansicht | Der Bereich der Oberfläche, in dem die Eigenschaften des ausgewählten Elements angezeigt und seine Parameter geändert werden. |
| Konsistenzprüfung | Die Kontrolle einer Strategie auf Vollständigkeit und Widerspruchsfreiheit, ohne sie auszuführen. Sie läuft beim Speichern und auf Anforderung. Nicht zu verwechseln mit dem Prüfen durch eine Regel. |
| Pflichtparameter | Ein Parameter, der einen Wert haben muss, damit die Konsistenzprüfung keinen Fehler meldet. Welche Parameter Pflicht sind, legt der Objekttyp fest. Alle anderen Parameter sind optional. |
| Standardwert | Der Wert eines Parameters, den eine Vorlage vorgibt. Er wird beim Einfügen in eine Strategie von der Instanz übernommen und dort geändert. |
| Befund | Ein einzelnes Ergebnis der Konsistenzprüfung: eine Unstimmigkeit mit Stufe (Fehler oder Hinweis), Beschreibung und dem betroffenen Element. |
| Testfall | Eine Teststrategie, an der nachgewiesen wird, dass eine Funktion wie vorgesehen arbeitet. |

## Technische Begriffe

| Begriff | Bedeutung |
| --- | --- |
| Gemeinsame Python-Bibliothek | Das Python-Paket `packages/domain-core` (Paketname `pipwerk_domain`). Es enthält die fachlichen Objekte, ihre Prüf- und Rechenlogik und die Beschreibung der Elementtypen. pipwerk Studio, pipwerk backtest und pipwerk trader binden es ein. |
| Typbeschreibung | Die maschinenlesbare Beschreibung eines Elementtyps: Kennung, Beschriftungen in Deutsch und Englisch, Parameter mit Datentyp und erlaubten Bindungsarten, Eingaben, Eigenschaften und Ergebnisse. Die Oberfläche baut daraus Elementbibliothek, Elemente und Eigenschaftenansicht auf. |
| Elementregister | Die Stelle in der gemeinsamen Python-Bibliothek, an der alle Elementtypen angemeldet sind und von der sie abgefragt werden. |
| Strategiedokument | Die Darstellung einer Strategie als JSON-Text. Sie wird für Datei, Web-API und Nachrichten verwendet. |
| Strategiedatei | Eine Datei im Strategieverzeichnis, die ein Strategiedokument enthält. Sie ist die verbindliche Fassung der Strategie. |
| Schema | Die formale Beschreibung, welche Felder ein Dokument enthalten muss und welche Werte zulässig sind. Pipwerk verwendet JSON-Schema. Schemata liegen versioniert unter `contracts/`. |
| Formatversion | Die Versionsnummer des Schemas, nach dem ein Dokument geschrieben wurde. Sie steht im Dokument und erlaubt, ältere Dateien später zu erkennen und zu überführen. |
| Index | Eine Tabelle in der Datenbank mit Kennung, Bezeichnung, Beschreibung, Formatversion, Dateiname und Zeitstempeln jedes gespeicherten Objekts. Der Index enthält das Objekt nicht, sondern verweist auf seine Datei, und lässt sich aus den Dateien neu aufbauen. |
| Schnittstelle | Eine Stelle, an der Daten in ein Programm hinein- oder herauskommen: die Web-API, das Lesen und Schreiben von Dateien, das Lesen der Konfiguration. |
| Web-API | Die über HTTP erreichbare Schnittstelle einer Komponente. Jede Adresse darin heißt Endpunkt. |
| Testumgebung | Die auf dem Entwicklungsrechner aus dem Commit eines Arbeitspakets gestartete Komponente. Die QA prüft dort aus Kundensicht, der Auftraggeber erprobt dort und nimmt ab. |
| Entwicklungsrechner | Der Rechner, auf dem Arbeitsverzeichnisse, Testumgebungen und die Sitzungen von Softwarearchitekt und Team liegen. |
| Vorhaben, Arbeitspaket, Auftrag, Übergabedokument, Meldung, Durchlauf | Begriffe des Entwicklungsprozesses, definiert in [Das Pipwerk-Entwicklungsverfahren](entwicklungsverfahren.md#begriffe). |

## Werkzeuge und Bibliotheken

| Name | Zweck in Pipwerk |
| --- | --- |
| FastAPI | Python-Bibliothek, mit der die Web-API einer Komponente gebaut wird. |
| Pydantic | Python-Bibliothek, die Daten an den Schnittstellen prüft und umwandelt: Sie liest JSON ein, prüft Felder und Typen und erzeugt daraus Python-Objekte. Aus ihren Modellen wird das JSON-Schema erzeugt. In der gemeinsamen Python-Bibliothek wird sie nicht verwendet. |
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
