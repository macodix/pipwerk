# Entwicklungsplan – Trading-Strategiedesigner

## Status

- status: `draft`
- zweck: Fortschreibbare Festlegungen für Entwicklung und Qualitätssicherung des Prototyps
- stand: 2026-09-25

## 1. Ziel und Gegenstand

Wir entwickeln zunächst einen benutzbaren Prototyp des Strategiedesigners. Er soll fachliche Strategien verständlich gestalten, bearbeiten und als prüfbare Strategiedefinition darstellen können. Die Entwicklung des Handelssystems ist davon getrennt. Der Prototyp wird an zwei unterschiedlichen Strategien erprobt:

1. einer Trendfolge mit zwei exponentiellen gleitenden Durchschnitten (EMA), aus dem vorhandenen Testentwurf;
2. der Punkt-2-Ausbruchstrategie des Nutzers.

Die Teststrategien sind Anwendungsfälle für den Designer. Beispielwerte und Entwürfe werden nicht automatisch zu allgemeinen Anforderungen. Offene fachliche Fragen bleiben offen, bis sie geklärt sind.

## Projekt- und Komponentennamen

Das Gesamtsystem und das gemeinsame GitHub-Repository heißen **Pipwerk** beziehungsweise `pipwerk`.

| Hauptkomponente | Produktname | Technischer Name |
|---|---|---|
| Strategiedesigner | Pipwerk Studio | `pipwerk-studio` |
| Strategietester | Pipwerk Backtest | `pipwerk-backtest` |
| Handelssystem | Pipwerk Trader | `pipwerk-trader` |
| Nachrichtensystem | Pipwerk Relay | `pipwerk-relay` |

## Entwicklungsreihenfolge

Die Entwicklung beginnt mit dem Prototyp des Strategiedesigners. Danach folgen Nachrichtensystem, Strategietester und Handelssystem.

Nach den ersten belastbaren Erfahrungen mit dem Strategiedesigner-Prototyp darf die Entwicklung parallel fortgesetzt werden. Insbesondere können die Weiterentwicklung des Strategiedesigners und die Entwicklung der übrigen Hauptkomponenten gleichzeitig erfolgen. Voraussetzung sind ausreichend stabile gemeinsame Grundlagen und Schnittstellenverträge.

Der Strategiedesigner-Prototyp soll insbesondere Erkenntnisse und wiederverwendbare Grundlagen für Python-Fachkern, Web-API, Strategieformat, React-Komponenten, Mehrsprachigkeit, Tests und IT-Sicherheit liefern.

## Mehrsprachigkeit des Prototyps

Die Benutzeroberfläche wird von Beginn an in Deutsch und Englisch umgesetzt. Fachliche Beschriftungen, Bedien- und Prüfmeldungen werden in beiden Sprachen geprüft. Gespeicherte Strategien behalten beim Sprachwechsel ihre Bedeutung; nutzerdefinierte Texte werden nicht automatisch übersetzt. Die fachliche Anforderung steht in `anforderungen-strategiedesigner.md` (`req-ui-007`).

## Sprache im Programmcode

Alle selbst definierten Bezeichner im Programmcode sind Englisch: Klassen und Objekttypen, Eigenschaften, Methoden, Funktionen, Parameter, Variablen, Konstanten und interne Kennungen. Dies gilt auch für maschinenlesbare Namen in Schnittstellen und gespeicherten Strategiedefinitionen. Bereits festgelegte externe Bezeichner einer angebundenen Schnittstelle werden nicht allein dafür umbenannt.

Die deutschsprachigen Fachbegriffe der Konzeptdokumente werden bei der Umsetzung eindeutig auf englische Codebezeichner abgebildet. Sichtbare Texte der Benutzeroberfläche werden getrennt davon auf Deutsch und Englisch bereitgestellt. Benutzerdefinierte Namen und Texte bleiben unverändert.

## Technische Aufteilung des Prototyps

- Der gemeinsame fachliche Kern wird in Python implementiert. Dort liegen die Definitionen fachlicher Objekttypen und ihre fachliche Prüf- und Auswertungslogik. Strategiedesigner, Strategietester und Handelssystem verwenden denselben versionierten Python-Kern, statt fachliche Objekte in mehreren Sprachen unabhängig zu implementieren.
- Strategiedesigner, Strategietester und Handelssystem erhalten jeweils eine eigenständig lauffähige Browseroberfläche mit TypeScript, React und CSS. React Flow ist die vorgesehene Grundlage für die grafische Anordnung fachlicher Elemente im Strategiedesigner; die konkrete Einbindung wird am Prototyp geprüft.
- Die Oberfläche erhält Beschreibungen der verfügbaren fachlichen Objekte, Parameter und Ergebnisse aus dem Python-Kern und übermittelt Konfigurationen an ihn. TypeScript enthält keine zweite, eigenständige Implementierung ihrer fachlichen Bedeutung.
- Die Darstellung der Oberfläche ist über CSS gestaltbar. Eine Funktion zur Anpassung des Designs durch Nutzer gehört nicht zum derzeitigen Prototypumfang.
- Die drei Oberflächen verwenden dieselben Gestaltungsregeln und, wo fachlich passend, gemeinsame versionierte UI-Komponenten sowie dieselbe Deutsch-Englisch-Sprachunterstützung. Jede Anwendung liefert die benötigten UI-Komponenten selbst mit. Unterschiedliche Aufgaben dürfen unterschiedliche Ansichten erfordern; die fachliche Trennung der Hauptkomponenten bleibt bestehen.
- Das Nachrichtensystem wird als eigenständig lauffähige Python-Komponente entwickelt. Eine eigene Benutzeroberfläche ist derzeit nicht festgelegt.
- Jede Hauptkomponente enthält beziehungsweise installiert ihre benötigte Version gemeinsamer Bibliotheken. Keine Hauptkomponente setzt einen zentral laufenden gemeinsamen Fachkern, denselben Prozess oder denselben Rechner voraus.
- Jede Hauptkomponente erhält eine dokumentierte HTTP-Web-API für die zur externen Nutzung vorgesehenen Funktionen. Dadurch können insbesondere andere Programme, n8n, OpenClaw und alternative Oberflächen Funktionen aufrufen, ohne die mitgelieferte GUI zu bedienen. Eingehende Ereignisse können über ausdrücklich definierte Webhook-Endpunkte angenommen werden.
- Die React-Oberfläche kommuniziert mit dem Python-Backend über eine direkte API und bei Bedarf über eine Echtzeitschnittstelle. Das Nachrichtensystem dient der Kommunikation zwischen Hauptkomponenten und ersetzt nicht pauschal die interne GUI-Backend-Schnittstelle.
- Web-API, Format der Strategiedefinition, Nachrichtenformate und gemeinsame fachliche Datenformate werden als versionierte Verträge behandelt. Eine Komponente kann durch eine andere Implementierung ersetzt werden, wenn diese Verträge und das vereinbarte fachliche Verhalten eingehalten werden.
- Externe Erreichbarkeit, Authentifizierung und Berechtigungen müssen konfigurierbar sein. Schreibende, ausführende und handelsbezogene Funktionen werden nicht ungeschützt veröffentlicht.
- Die konkrete Schnittstelle zwischen Python-Kern und Oberfläche sowie das Format gespeicherter Strategien sind noch festzulegen.

## Webstandards und Browserkompatibilität

Die Browseroberflächen werden nach offenen Webstandards entwickelt und nicht auf einen bestimmten Browser oder eine bestimmte Browserversion zugeschnitten. Browserspezifische Funktionen und proprietäre Erweiterungen werden vermieden, soweit sie nicht technisch zwingend erforderlich und ausdrücklich begründet sind.

Die Umsetzung verwendet standardisierte HTML-, CSS- und Web-APIs. Unterschiede in der Browserunterstützung werden durch Prüfung der benötigten Funktionen, geeignete Alternativen und automatisierte Tests in mehreren unabhängigen Browser-Engines behandelt. Browser und Browserversionen sind Testumgebungen, nicht die fachliche oder technische Grundlage der Anwendung.

## Versionsstrategie

Für Software, Laufzeiten und Werkzeuge, die in den konfigurierten Paketquellen der eingesetzten Ubuntu- beziehungsweise Debian-Version verfügbar sind, werden grundsätzlich die dort bereitgestellten Versionen verwendet. Das Projekt setzt ohne begründete Notwendigkeit keine neuere externe Version voraus.

Software und Bibliotheken, die außerhalb dieser Paketquellen bezogen werden, werden zu Beginn der Entwicklung auf eine zu diesem Zeitpunkt aktuelle und geeignete Version festgelegt. Direkte und transitive Abhängigkeiten werden soweit technisch möglich durch Lockdateien oder gleichwertige Mechanismen reproduzierbar festgeschrieben.

Spätere Versionsänderungen erfolgen kontrolliert mit Prüfung der Kompatibilität, Tests und erforderlichen Migrationen. Sicherheitsaktualisierungen werden dadurch nicht ausgeschlossen.

## Dateisystem- und Verzeichnisstruktur

Die spätere Struktur für Installation, Konfiguration, variable Daten, Protokolle und gemeinsam genutzte Dateien orientiert sich grob am Unix Filesystem Hierarchy Standard (FHS). Die konkrete Zuordnung wird für jede Hauptkomponente im Zuge ihrer Implementierung festgelegt. Fachlich oder technisch sinnvolle Abweichungen sind zulässig und werden dokumentiert.

Die Verzeichnisstruktur des Entwicklungsrepositorys muss nicht mit der späteren Installationsstruktur übereinstimmen. Das gemeinsame Repository `pipwerk` erhält folgende Grundstruktur:

| Verzeichnis | Inhalt |
|---|---|
| `components/pipwerk-studio/` | Strategiedesigner mit Python-Backend und React-Oberfläche |
| `components/pipwerk-backtest/` | Strategietester mit Python-Backend und React-Oberfläche |
| `components/pipwerk-trader/` | Handelssystem mit Python-Backend und React-Oberfläche |
| `components/pipwerk-relay/` | Nachrichtensystem |
| `packages/domain-core/` | gemeinsamer Python-Fachkern |
| `packages/ui-components/` | gemeinsame TypeScript-/React-Komponenten |
| `contracts/api/` | versionierte API-Verträge |
| `contracts/messages/` | versionierte Nachrichtenformate |
| `contracts/strategies/` | versionierte Schemata für Strategiedefinitionen |
| `docs/` | gemeinsame Architektur-, Entwicklungs- und Betriebsdokumentation |
| `tests/integration/` | komponentenübergreifende Tests |
| `tools/` | gemeinsame Entwicklungs- und Prüfwerkzeuge |
| `deploy/` | Installations-, Paket- und Dienstdefinitionen |

Jede Hauptkomponente enthält ihre eigenen Verzeichnisse für Backend, Oberfläche soweit vorhanden, Tests, Dokumentation, Beispielkonfigurationen und komponentenspezifische Werkzeuge. Jede Hauptkomponente bleibt eigenständig baubar, installierbar und startbar.

Für die spätere Systeminstallation gelten grundsätzlich folgende Zuordnungen:

| Pfad | Inhalt |
|---|---|
| `/usr/bin/` | Startprogramme und Kommandozeilenbefehle |
| `/usr/lib/pipwerk/` | Programmcode und mitgelieferte Bibliotheken |
| `/usr/share/pipwerk/` | statische Oberflächendateien, Vorlagen und unveränderliche Daten |
| `/etc/pipwerk/<komponente>/` | systemweite Konfiguration der jeweiligen Komponente |
| `/var/lib/pipwerk/<komponente>/` | persistente Anwendungsdaten der jeweiligen Komponente |
| `/var/log/pipwerk/<komponente>/` | Protokolldateien, soweit diese nicht ausschließlich über das Systemjournal geführt werden |
| `/run/pipwerk/<komponente>/` | flüchtige Laufzeitdaten |
| `/var/cache/pipwerk/<komponente>/` | wiederherstellbare Cache-Daten |

Keine Komponente schreibt während des Betriebs nach `/usr`. Abweichende Strukturen für Benutzerinstallationen oder Container werden gesondert dokumentiert.

## 2. Rollen

| Beteiligter | Aufgabe |
|---|---|
| Nutzer | Fachliche Entscheidungen treffen; Bedienung und Verhalten des laufenden Prototyps praktisch prüfen; Ergebnisse freigeben. |
| ChatGPT in diesem Projektchat | Konzept und Softwaredesign mit dem Nutzer entwickeln; Arbeitsaufträge mit Prüfkriterien formulieren; die Umsetzung im Repository gegen Auftrag, Fachmodell und Anforderungen prüfen; konkrete Korrekturen benennen. |
| Claude Code auf dem Entwicklungsrechner | Vereinbarte Aufträge implementieren; lokale technische Prüfungen ausführen; Änderungen und Prüfergebnisse im Repository bereitstellen; festgestellte Mängel korrigieren. |

Eine Fertigmeldung des implementierenden Agenten ersetzt weder die unabhängige Prüfung der Änderung noch die praktische Erprobung durch den Nutzer.

## 3. Ablauf je Arbeitspaket

1. **Auftrag festlegen:** Fachliches Ziel, Geltungsbereich, gewünschtes Verhalten und nachprüfbare Abnahmekriterien hier vereinbaren. Nicht entschiedene Punkte ausdrücklich kennzeichnen.
2. **Umsetzen:** Claude Code arbeitet im Projekt auf dem Entwicklungsrechner in einem eigenen Branch. Es führt passende technische Prüfungen aus und erstellt einen Pull Request mit Änderung und Prüfergebnissen.
3. **Umsetzung prüfen:** ChatGPT liest Auftrag, geänderten Code und zugehörige Tests im Pull Request. Es prüft insbesondere Vollständigkeit, fachliche Konsistenz, Abweichungen vom Auftrag und erkennbare Fehler. Die Prüfung stützt sich auf den tatsächlichen Stand im Repository.
4. **Mängel beheben:** Claude Code korrigiert konkrete Befunde. ChatGPT prüft die betroffenen Änderungen erneut.
5. **Funktion erproben:** Der Nutzer bedient den Prototyp auf seinem Rechner anhand der beiden Strategien und meldet Abweichungen. Fachliche Änderungswünsche werden als neue oder angepasste Arbeitsaufträge behandelt.
6. **Abschluss festhalten:** Ein Arbeitspaket gilt erst nach bestandener Umsetzungsprüfung und erforderlicher praktischer Erprobung als abgeschlossen.

GitHub dient zur nachvollziehbaren Ablage und Prüfung abgegrenzter Zwischenstände. Es ist nicht erforderlich, jede lokale Änderung sofort zu veröffentlichen.

## Test und spätere Ablaufanalyse

Automatische Tests sollen strukturell ungültige Konfigurationen und eindeutig prüfbare Fehler erkennen. Derzeit wird nicht vorausgesetzt, dass beliebig komplexe Strategien vollständig durch allgemeine deterministische Regeln auf fachliche Widerspruchsfreiheit geprüft werden können. Umfang und Grenzen einer solchen Strategievalidierung bleiben offen.

Als spätere Funktion ist ein Strategiedebugger vorgesehen. Er soll die schrittweise Ausführung einer Strategie und die Betrachtung der dabei verwendeten Eingaben, Zustände, Regeln und Ergebnisse ermöglichen. Diese Funktion gehört nicht zum ersten Strategiedesigner-Prototyp und wird konkretisiert, nachdem die grundlegende Ausführung von Strategien steht.

## 4. Prüfnachweise

Jeder Pull Request enthält mindestens:

- Bezug auf den vereinbarten Arbeitsauftrag und seine Abnahmekriterien;
- kurze Beschreibung der tatsächlich vorgenommenen Änderungen;
- Ergebnis der ausgeführten technischen Prüfungen;
- noch offene Punkte und bekannte Einschränkungen.

ChatGPT bestätigt nur, was durch Code, Tests oder andere zugängliche Nachweise überprüfbar ist. Die praktische Nutzbarkeit bestätigt der Nutzer nach eigener Erprobung.

## 5. Bestehende Grundlagen

Fachliche Definitionen stehen in `fachmodell.md`. Anforderungen an den Designer stehen in `anforderungen-strategiedesigner.md`; Anforderungen an die Ausführung stehen in `anforderungen-handelssystem.md`. Dieser Entwicklungsplan ersetzt diese Dokumente nicht und enthält keine neuen fachlichen Handelsregeln.

## 6. Noch festzulegen

- Datenformat für die dauerhafte Ablage und die Weitergabe von Strategien zwischen den Hauptkomponenten und über deren Schnittstellen; Bearbeitung als viertes eigenes Thema in einem eigenen Projektchat. Dabei sind insbesondere Schema, Versionierung, Validierung, Kompatibilität und Migration zu klären;
- verbindliches Entwicklungsregelwerk für Python, TypeScript/React, Dokumentation, Tests und IT-Sicherheit; Bearbeitung als eigene Aufgabe in einem eigenen Projektchat. Dabei sind mindestens Python-PEPs, TypeScript-Prüfregeln, BSI IT-Grundschutz einschließlich `CON.8 Software-Entwicklung`, OWASP ASVS und OWASP API Security zu bewerten und in ein priorisiertes projektspezifisches Regelwerk zu überführen;
- Umfang des ersten Arbeitspakets und dessen Abnahmekriterien;
- Verfahren für Versionsfreigabe und Zusammenführung geprüfter Änderungen;
- weitere Anforderungen an Entwicklungsprozess, Prüfung und Dokumentation.

Konkrete Installations-, Start- und Betriebsverfahren werden am entstehenden, lauffähigen Prototyp festgelegt und erprobt. Ihre vollständige Vorabdefinition ist keine Voraussetzung für den Beginn der Prototypentwicklung.

## 7. Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-09-24 | Erstfassung mit Rollen, Ablauf, Prüfnachweisen und offenen Festlegungen. |
| 2026-09-24 | Python als gemeinsamer fachlicher Kern, TypeScript/React als Browseroberfläche, CSS-Gestaltung und Schnittstellenabgrenzung festgehalten. |
| 2026-09-24 | Gemeinsame Oberflächentechnik und konsistentes Erscheinungsbild für Designer und späteres Handelssystem ergänzt. |
| 2026-09-25 | Vier eigenständig lauffähige Hauptkomponenten berücksichtigt; Python für Fachkern und Backends sowie TypeScript/React/CSS für die Oberflächen von Designer, Tester und Handelssystem festgelegt. |
| 2026-09-25 | Web-APIs, Webhooks, direkte GUI-Backend-Kommunikation und Austauschbarkeit über versionierte Schnittstellenverträge ergänzt. |
| 2026-09-25 | Entwicklungsreihenfolge und zwei eigene Folgeaufgaben für Strategieformat sowie Entwicklungs-, Test- und Sicherheitsregelwerk festgelegt. |
| 2026-09-25 | Offene Webstandards als Grundlage der Browseroberflächen festgelegt; Bindung an einen einzelnen Browser oder eine Browserversion ausgeschlossen. |
| 2026-09-25 | Grenzen allgemeiner automatischer Strategievalidierung offengelassen und Strategiedebugger als spätere Funktion vorgemerkt. |
| 2026-09-25 | Versionsstrategie für Ubuntu-/Debian-Pakete und extern bezogene Software einschließlich reproduzierbarer Abhängigkeiten festgelegt. |
| 2026-09-25 | Grobe Orientierung der späteren Dateisystemstruktur am Unix FHS ergänzt; Repository-Zeitpunkt präzisiert und Installations- und Startverfahren in die Prototypentwicklung verlagert. |
| 2026-09-25 | Datenformat für Ablage und Weitergabe von Strategien ausdrücklich als viertes eigenes Klärungsthema festgehalten. |
| 2026-09-25 | Pipwerk als Name für Gesamtsystem und Repository sowie Pipwerk Studio, Pipwerk Backtest, Pipwerk Trader und Pipwerk Relay als Komponentennamen festgelegt; Repository- und FHS-orientierte Installationsstruktur konkretisiert. |
