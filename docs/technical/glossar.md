# Glossar

## Dokumentstatus

- status: `accepted`
- zweck: Verbindliche Begriffe für alle Dokumente, Aufträge und Abstimmungen mit dem Nutzer. Jeder hier fehlende Fachbegriff wird bei seiner Einführung in einem Dokument definiert und hier ergänzt.
- stand: 2026-10-11

## Regeln

- Dokumente, Folien, Aufträge und Antworten an den Nutzer verwenden die Begriffe dieses Glossars. Ein Begriff wird nicht durch ein Synonym oder eine wörtliche Übersetzung aus dem Englischen ersetzt.
- Ein neuer Begriff wird beim ersten Auftreten erklärt: was er bezeichnet und wozu er gebraucht wird. Danach wird er hier eingetragen.
- Produktnamen von Werkzeugen und Bibliotheken werden beim ersten Auftreten in einem Text mit ihrem Zweck genannt.

## Fachliche Begriffe

Die fachlichen Objekte selbst sind im [Fachmodell](../design/domain/fachmodell.md) definiert. Hier stehen nur die Begriffe, die über das Fachmodell hinaus in Dokumentation und Oberfläche verwendet werden.

| Begriff | Bedeutung |
| --- | --- |
| Auslöser | Das Ereignis, bei dem eine Strategie ausgewertet wird, zum Beispiel der Schluss einer Kerze auf einer Zeiteinheit. Jede Strategie hat genau einen Auslöser. |
| Baustein | Ein fachliches Element, das auf der Zeichenfläche platziert wird: ein Indikator, ein Trend, eine Bedingung, eine Berechnung, eine Regel oder die Order-Aktion. In der Graphentheorie heißt das Knoten. Dieses Wort wird nicht verwendet. |
| Bausteintyp | Die Art eines Bausteins, zum Beispiel „gleitender Durchschnitt (EMA)“ oder „Markttechnik-Trend“. Aus einem Bausteintyp werden konkrete Bausteine mit eigenen Parameterwerten angelegt. |
| Bausteinbibliothek | Der Bereich der Oberfläche, der die verfügbaren Bausteintypen und die bereits angelegten, wiederverwendbaren Objekte zur Auswahl anbietet. |
| Verbindung | Eine Linie zwischen zwei Bausteinen auf der Zeichenfläche. Sie bedeutet entweder „danach folgt“ im Ablauf, den wahr- oder falsch-Pfad einer Bedingung oder die Verwendung einer Ausgabe durch einen anderen Baustein. In der Graphentheorie heißt das Kante. Dieses Wort wird nicht verwendet. |
| Verweis | Die Verwendung eines eigenständig gespeicherten Objekts (zum Beispiel einer Regel oder eines Indikators) in einer Strategie über seine Kennung, ohne das Objekt zu kopieren. |
| Ausgabe | Ein Ergebnis, das ein Baustein anderen Bausteinen zur Verfügung stellt, zum Beispiel die Richtung eines Trends oder der Wert eines Indikators. |
| Parameter | Eine einstellbare Eigenschaft eines Bausteins, zum Beispiel die Periode eines gleitenden Durchschnitts. |
| Bindungsart | Die Art, wie ein Parameter seinen Wert erhält: fest in der Strategie eingetragen, durch eine Regel bestimmt, erst bei der Anwendung übergeben, oder aus der Ausgabe eines anderen Bausteins. |
| Zeichenfläche | Der Bereich der Oberfläche, auf dem Bausteine angeordnet und verbunden werden. |
| Eigenschaftenansicht | Der Bereich der Oberfläche, in dem die Parameter des ausgewählten Bausteins angezeigt und geändert werden. |
| Prüfung | Die Kontrolle einer Strategie auf Vollständigkeit und Widerspruchsfreiheit, ohne sie auszuführen. Sie läuft beim Speichern und auf Anforderung. |
| Befund | Ein einzelnes Ergebnis der Prüfung: eine Unstimmigkeit mit Stufe (Fehler oder Hinweis), Beschreibung und dem betroffenen Baustein. |
| Prüffall | Eine Teststrategie, an der nachgewiesen wird, dass eine Funktion wie vorgesehen arbeitet. |

## Technische Begriffe

| Begriff | Bedeutung |
| --- | --- |
| Gemeinsame Python-Bibliothek | Das Python-Paket `packages/domain-core` (Paketname `pipwerk_domain`). Es enthält die fachlichen Objekte, ihre Prüf- und Rechenlogik und die Beschreibung der Bausteintypen. Pipwerk Studio, Pipwerk Backtest und Pipwerk Trader binden es ein. |
| Typbeschreibung | Die maschinenlesbare Beschreibung eines Bausteintyps: Kennung, Beschriftungen in Deutsch und Englisch, Parameter mit Datentyp und erlaubten Bindungsarten, Eingaben, Ausgaben. Die Oberfläche baut daraus Bausteinbibliothek, Bausteine und Eigenschaftenansicht auf. |
| Bausteinregister | Die Stelle in der gemeinsamen Python-Bibliothek, an der alle Bausteintypen angemeldet sind und von der sie abgefragt werden. |
| Strategiedokument | Die Darstellung einer Strategie als JSON-Text. Sie wird für Datei, Web-API, Export und Import verwendet. |
| Strategiedatei | Eine Datei im Strategieverzeichnis, die ein Strategiedokument enthält. Sie ist die verbindliche Fassung der Strategie. |
| Schema | Die formale Beschreibung, welche Felder ein Dokument enthalten muss und welche Werte zulässig sind. Pipwerk verwendet JSON-Schema. Schemata liegen versioniert unter `contracts/`. |
| Formatversion | Die Versionsnummer des Schemas, nach dem ein Dokument geschrieben wurde. Sie steht im Dokument und erlaubt, ältere Dateien später zu erkennen und zu überführen. |
| Index | Eine Tabelle in der Datenbank mit Kennung, Bezeichnung, Beschreibung, Formatversion, Dateiname und Zeitstempeln jedes gespeicherten Objekts. Der Index enthält das Objekt nicht, sondern verweist auf seine Datei, und lässt sich aus den Dateien neu aufbauen. |
| Schnittstelle | Eine Stelle, an der Daten in ein Programm hinein- oder herauskommen: die Web-API, das Lesen und Schreiben von Dateien, das Lesen der Konfiguration. |
| Web-API | Die über HTTP erreichbare Schnittstelle einer Komponente. Jede Adresse darin heißt Endpunkt. |
| Testumgebung | Die auf dem Entwicklungsrechner aus einem von der QA freigegebenen Commit gestartete Komponente. Der Projektleiter prüft dort die Abnahmekriterien, der Nutzer erprobt dort die Funktion. |
| Entwicklungsrechner | Der Rechner, auf dem Arbeitsbereiche, Testumgebungen, Auftragsverwaltung und Agentenläufe liegen. |

## Werkzeuge und Bibliotheken

| Name | Zweck in Pipwerk |
| --- | --- |
| FastAPI | Python-Bibliothek, mit der die Web-API einer Komponente gebaut wird. |
| Pydantic | Python-Bibliothek, die Daten an den Schnittstellen prüft und umwandelt: Sie liest JSON ein, prüft Felder und Typen und erzeugt daraus Python-Objekte. Aus ihren Modellen wird das JSON-Schema erzeugt. In der gemeinsamen Python-Bibliothek wird sie nicht verwendet. |
| SQLAlchemy | Python-Bibliothek für den Zugriff auf relationale Datenbanken. Welche Datenbank dahinter liegt (derzeit SQLite), steht in der Konfiguration. |
| Alembic | Werkzeug zu SQLAlchemy, das Änderungen am Datenbankaufbau versioniert durchführt. Eine bestehende Datenbank wird damit auf einen neuen Aufbau gebracht, ohne sie neu anzulegen. |
| pytest | Werkzeug für automatische Tests von Python-Code. |
| React, TypeScript, Vite | Grundlage der Browseroberfläche: React für die Bedienelemente, TypeScript als Programmiersprache, Vite zum Bauen und für den Entwicklungsbetrieb. |
| React Flow | Bibliothek für die Zeichenfläche: Anordnen und Verbinden von Bausteinen im Browser. |
| i18next | Bibliothek für die deutschen und englischen Texte der Oberfläche. |
| TanStack Query | Bibliothek, mit der die Oberfläche Daten der Web-API abruft und zwischenspeichert. |
| Vitest, Testing Library | Werkzeuge für automatische Tests der Oberfläche ohne Browser. |
| Playwright | Werkzeug für automatische Tests in einem echten Browser. Es bedient die Oberfläche wie ein Nutzer. |
| Ruff, mypy | Werkzeuge, die Python-Code auf Stil und Typfehler prüfen. |
| uv | Werkzeug, das Python-Pakete installiert und ihre Versionen festschreibt. |
| tmux | Programm, das Terminalsitzungen im Hintergrund weiterlaufen lässt. Jedes Agententeam läuft in einer eigenen tmux-Sitzung. |

## Änderungsnachweis

| Datum | Änderung |
| --- | --- |
| 2026-10-11 | Erstfassung. „Teststand“ durch „Testumgebung“ ersetzt. |
