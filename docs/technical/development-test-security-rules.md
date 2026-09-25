# Entwicklungs-, Test- und Sicherheitsregeln

## Dokumentstatus

- status: `accepted`
- stand: 2026-09-25
- geltungsbereich: gesamtes Pipwerk-Repository

## 1. Zweck und Grundsatz

Dieses Dokument legt verbindliche technische Regeln für Entwicklung, Tests, Sicherheit und den Einsatz externer Frameworks und Werkzeuge fest.

Pipwerk besteht aus vier eigenständig lauffähigen Komponenten. Der gemeinsame Python-Fachkern bleibt von Web-, UI-, Persistenz- und Transportframeworks unabhängig. Frameworks dienen als Adapter und Infrastruktur. Sie dürfen das Fachmodell, Strategieformat oder die Ausführungslogik nicht technisch beherrschen.

Abhängigkeiten werden nur eingeführt, wenn sie einen konkreten Nutzen haben. Eine vorhandene Bibliothek ist kein Grund, Fachlogik an ihre Datenmodelle oder Lebenszyklen zu koppeln.

## 2. Verbindliche Werkzeugentscheidungen

| Werkzeug | Status | Zweck in Pipwerk | Einsatzgrenze |
| --- | --- | --- | --- |
| FastAPI | verbindlich für Python-HTTP-APIs | dokumentierte HTTP-Web-APIs der Komponenten | nur API-/Transportadapter; keine Fachlogik im Framework-Layer |
| Pydantic | verbindlich an externen Python-Datengrenzen | Validierung und Serialisierung von API-, Nachrichten-, Konfigurations- und Vertragsdaten | keine Pydantic-Abhängigkeit als Voraussetzung für fachliche Kernobjekte |
| pytest | verbindlich | Unit-, Komponenten-, Vertrags- und Python-Integrationstests | Tests müssen Fachkern auch ohne gestarteten Webserver prüfen können |
| React | verbindlich für Browseroberflächen | komponentenbasierte Benutzeroberflächen | keine fachliche Ausführungslogik ausschließlich im UI |
| Vite | verbindlich für React-Frontends | Entwicklungsserver und Frontend-Build | Build-Werkzeug, kein Bestandteil von Fachmodell oder Verträgen |
| React Flow (`@xyflow/react`) | verbindlich für den grafischen Strategiedesigner | Darstellung und Bearbeitung des Strategiegraphen | UI-Modell ist nicht das maßgebliche Strategie- oder Ausführungsmodell |
| i18next + react-i18next | verbindlich für Benutzeroberflächen | deutsche und englische UI sowie spätere weitere Sprachen | fachliche IDs, Verträge und gespeicherte Werte bleiben sprachneutral |
| TanStack Query | verbindlich für asynchronen Serverzustand in React-UIs | Abruf, Cache, Aktualisierung und Mutation von HTTP-Daten | kein maßgeblicher Speicher für Orders, Positionen, Strategien oder sonstigen Fachzustand |
| Vitest + Testing Library | verbindlich für Frontend-Unit- und Komponententests | TypeScript-/React-Tests mit benutzernaher DOM-Prüfung | keine ausschließliche Prüfung über Implementierungsdetails oder Snapshots |
| Playwright | verbindlich für Browser-End-to-End-Tests | reale Browserabläufe und komponentenübergreifende UI-Prüfungen | keine Verbindung zu produktiven Brokerkonten oder produktiven Handelsendpunkten |
| SQLAlchemy | später, nur bei nachgewiesenem relationalem Persistenzbedarf | Datenbankzugriff und gegebenenfalls ORM | keine Einführung auf Vorrat; Fachkern bleibt vom ORM unabhängig |
| Alembic | später zusammen mit SQLAlchemy bei veränderlichem relationalem Schema | versionierte Datenbankschemamigrationen | nicht ohne tatsächliche SQL-Persistenz |
| Ruff | verbindlich | Python-Linting und Formatprüfung | ersetzt keine Typprüfung und keine Tests |
| mypy | verbindlich für Python | statische Typprüfung des Python-Codes | Typausnahmen müssen lokal und begründet bleiben |
| TypeScript Compiler | verbindlich | statische Typprüfung des TypeScript-Codes | `strict` ist aktiv; Typprüfung erfolgt ohne Build-Ausgabe |

## 3. Begründung und Austauschbarkeit

### FastAPI und Pydantic

FastAPI ist für die HTTP-Schicht geeignet und verwendet Pydantic für typisierte Datenverarbeitung. FastAPI bleibt außerhalb des Fachkerns. HTTP-Handler übersetzen zwischen Transportmodellen und fachlichen Schnittstellen.

Pydantic validiert Daten an Systemgrenzen. Pydantic kann Eingaben standardmäßig konvertieren. An sicherheits- oder handelsrelevanten Grenzen wird deshalb explizit geprüft, ob strikte Validierung erforderlich ist. Unbekannte Felder werden bei versionierten Verträgen nicht stillschweigend akzeptiert, wenn dadurch Fehlkonfigurationen oder Vertragsabweichungen verdeckt werden könnten.

Folge: FastAPI kann später ersetzt werden, ohne den Fachkern neu zu entwerfen. Pydantic-Modelle sind keine zwingende Repräsentation interner Fachobjekte.

### React, Vite und React Flow

React bildet die Browseroberflächen. Vite stellt Entwicklungs- und Build-Infrastruktur bereit. React Flow übernimmt Interaktion und Darstellung des grafischen Editors.

Der Strategiegraph besitzt eine frameworkunabhängige, versionierte fachliche Repräsentation. React-Flow-Nodes und -Edges sind Darstellungsobjekte. Sie dürfen nicht zum dauerhaften oder ausführbaren Strategieformat werden.

Folge: React Flow kann ersetzt oder ergänzt werden, ohne Strategieformat und Ausführungskern zu ändern.

### i18next und react-i18next

Sichtbare UI-Texte werden über Übersetzungsschlüssel verwaltet. Persistierte fachliche Werte, IDs, API-Felder und Nachrichtenwerte werden nicht übersetzt. Sprache ist Darstellung, nicht Fachzustand.

Folge: Übersetzungsbibliothek und Sprachen bleiben austauschbar, ohne Verträge oder gespeicherte Strategien zu verändern.

### TanStack Query

TanStack Query verwaltet asynchronen Serverzustand im Browser, einschließlich Cache und Aktualisierung. Der Cache ist niemals autoritative Quelle für handelsrelevanten Zustand.

Mutationen müssen Fehlerzustände behandeln. Nach Mutationen wird der maßgebliche Backendzustand eindeutig synchronisiert. Automatisches Refetching darf keine fachliche Aktion auslösen.

Folge: Die Backend-APIs bleiben unabhängig von TanStack Query.

### SQLAlchemy und Alembic

SQLAlchemy wird erst eingeführt, wenn eine Komponente tatsächlich relationale Persistenz benötigt. Persistenzzugriffe liegen hinter fachlich beziehungsweise anwendungsseitig definierten Schnittstellen. ORM-Klassen bestimmen nicht die öffentlichen Fachobjekte.

Alembic wird nur zusammen mit einer SQLAlchemy-basierten, migrationsbedürftigen Datenbank eingesetzt. Migrationen sind versioniert, überprüfbar und vor produktiver Anwendung an einer Testdatenbank zu prüfen.

Folge: Datenbank und ORM bleiben austauschbare Infrastruktur.

## 4. Entwicklungsregeln

1. Änderungen an Programmcode und wesentlicher Dokumentation erfolgen über Branch und Pull Request.
2. Jede Änderung muss einer dokumentierten Anforderung, Entscheidung, Fehlerbehebung oder einem klar beschriebenen technischen Zweck zugeordnet sein.
3. Fachkern, Transport, Persistenz und Benutzeroberfläche werden durch definierte Schnittstellen getrennt.
4. Keine Frameworkklasse darf erforderlich sein, um eine fachliche Kernoperation auszuführen.
5. Öffentliche API-, Nachrichten- und Strategieformate liegen versioniert unter `contracts/`.
6. Vertragsänderungen benötigen Kompatibilitätsprüfung und zugehörige Tests.
7. Abhängigkeiten werden mit reproduzierbarer Versionsauflösung verwaltet. Aktualisierungen werden geprüft und nicht ungeprüft automatisch in produktive Builds übernommen.
8. Python-Code muss Ruff-Prüfung und mypy-Typprüfung bestehen.
9. TypeScript-Code muss die TypeScript-Prüfung mit `strict` und ohne Emit bestehen.
10. Automatische Formatter dürfen keine fachlichen oder sicherheitsrelevanten Änderungen verdecken.
11. Frameworks werden nicht verwendet, um bereits definierte Fachobjekte unnötig durch frameworkeigene Modelle zu ersetzen.
12. Neue Abhängigkeiten benötigen einen dokumentierten Zweck und eine Prüfung auf Lizenz, Wartungszustand, Sicherheitsrisiko und Kopplungswirkung.
13. Python-Code folgt PEP 8, soweit keine begründete und dokumentierte Pipwerk-Regel abweicht. Typannotationen richten sich nach dem aktuellen Python-Typisierungssystem; PEP 484 bildet dafür eine grundlegende Referenz. Python-Paket- und Abhängigkeitsversionen verwenden PEP-440-konforme Versionsangaben.
14. PEP-Regeln ergänzen die Pipwerk-Regeln. PEPs werden nicht als allgemeines IT-Sicherheitsregelwerk behandelt.

## 5. Testregeln

Es gelten mindestens vier Testebenen:

- Unit-Tests prüfen Fachlogik isoliert und deterministisch.
- Komponententests prüfen eine eigenständig lauffähige Pipwerk-Komponente einschließlich ihrer Adapter.
- Vertrags- und Integrationstests prüfen versionierte Formate und die Zusammenarbeit zwischen Komponenten.
- End-to-End-Tests prüfen wesentliche Benutzerabläufe im Browser.

Für jede Fehlerbehebung wird ein Test ergänzt, der den Fehler vor der Korrektur nachweisen kann, soweit dies technisch sinnvoll reproduzierbar ist.

Fachliche Berechnungen müssen mit fest definierten Eingabedaten reproduzierbar sein. Zeit, Zufall, Marktfeeds und externe Dienste werden in Unit-Tests kontrolliert oder ersetzt.

Frontendtests mit Testing Library prüfen bevorzugt sichtbares und zugängliches Benutzerverhalten statt interne React-Strukturen. Playwright-Tests laufen isoliert und verwenden definierte Testdaten.

Tests dürfen standardmäßig keine kostenpflichtigen, produktiven oder handelsauslösenden externen Dienste ansprechen. Tests mit externen Systemen benötigen eine ausdrückliche Kennzeichnung und getrennte Konfiguration.

Ein Pull Request ist technisch nicht abnahmefähig, solange für den betroffenen Bereich vorgeschriebene Tests, Lint- oder Typprüfungen fehlschlagen.

## 6. Sicherheitsregeln

### 6.1 Sicherheitsreferenzen

Für Pipwerk werden folgende Regelwerke als verbindliche Referenzen für die Ableitung und Prüfung konkreter Sicherheitsanforderungen verwendet:

- **BSI IT-Grundschutz** als übergeordnete Referenz für Informationssicherheit. Für die Softwareentwicklung sind insbesondere `CON.8 Software-Entwicklung`, `APP.7 Entwicklung von Individualsoftware`, `OPS.1.1.3 Patch- und Änderungsmanagement` und `OPS.1.1.6 Software-Tests und -Freigaben` zu berücksichtigen. Weitere Bausteine werden einbezogen, sobald Architektur oder Betrieb ihren Anwendungsbereich berühren.
- **OWASP Application Security Verification Standard (ASVS)** als überprüfbare technische Sicherheitsreferenz für Webanwendungen.
- **OWASP API Security Top 10** als ergänzende Referenz für die besonderen Risiken der HTTP-Web-APIs.
- **Python Enhancement Proposals (PEPs)** für Python-spezifische Entwicklungsstandards. Sie ersetzen kein Informationssicherheitsregelwerk.

Die Anwendung dieser Referenzen bedeutet nicht, dass Pipwerk pauschal eine BSI-, OWASP- oder sonstige Zertifizierung oder vollständige Konformität beansprucht. Für jedes Arbeitspaket werden die tatsächlich einschlägigen Anforderungen bestimmt und in prüfbare Pipwerk-Anforderungen beziehungsweise Abnahmekriterien überführt.

Wird von einer einschlägigen Sicherheitsanforderung abgewichen, wird die Abweichung mit Grund, Risiko und gegebenenfalls Ersatzmaßnahme dokumentiert. Sicherheitsanforderungen werden so konkret formuliert, dass ihre Umsetzung überprüft werden kann.

### 6.2 Grundregeln


1. Geheimnisse, API-Schlüssel, Broker-Zugangsdaten und Tokens werden niemals im Repository, in Testdaten oder in normalen Logs gespeichert.
2. Externe Eingaben werden an der Systemgrenze validiert. Dies gilt besonders für Strategieimporte, Nachrichten, HTTP-Anfragen, Konfiguration und Brokerdaten.
3. Handelsrelevante Werte werden nicht allein durch implizite Typkonvertierung akzeptiert. Zulässige Wertebereiche und fachliche Invarianten werden zusätzlich geprüft.
4. Der Browser ist keine vertrauenswürdige Sicherheitsgrenze. Berechtigungen und handelsrelevante Prüfungen werden serverseitig durchgesetzt.
5. Produktiver Handel und Tests sind technisch getrennt. Testläufe dürfen nicht durch eine bloße UI-Auswahl versehentlich produktive Orders erzeugen.
6. Ordererzeugung, -änderung und -stornierung benötigen nachvollziehbare Zustandsübergänge und ausreichende Protokollierung ohne Geheimnisse.
7. Netzwerkzugriffe werden auf die tatsächlich benötigten Ziele und Protokolle begrenzt.
8. Fehlermeldungen an externe Clients dürfen keine Zugangsdaten, internen Geheimnisse oder unnötigen Systemdetails offenlegen.
9. Abhängigkeiten werden vor Einführung und bei Aktualisierung auf bekannte Sicherheitsprobleme und unerwartete transitive Abhängigkeiten geprüft.
10. Datenbankmigrationen und andere destruktive Operationen benötigen Sicherungs-, Rücksetz- oder Wiederherstellungsverfahren entsprechend dem tatsächlichen Schadensrisiko.
11. Sicherheitsrelevante Regeln werden durch automatisierte Tests abgesichert, soweit sie technisch prüfbar sind.
12. Sicherheitsmechanismen dürfen nicht ausschließlich von React, React Flow, TanStack Query oder anderen Browserbibliotheken abhängen.

### 6.3 Mindestanforderungen aus den Referenzwerken

Für Entwicklung und Betrieb gelten mindestens folgende Grundsätze, soweit sie auf die jeweilige Komponente anwendbar sind:

1. Sicherheitsanforderungen werden bereits bei Anforderung und Entwurf berücksichtigt und nicht erst nach der Implementierung geprüft.
2. Sichere Voreinstellungen und das Prinzip geringstmöglicher Rechte werden angewendet.
3. Entwicklungs-, Test- und Produktivumgebungen sowie ihre Zugangsdaten werden getrennt.
4. Sicherheitsrelevante Ereignisse werden nachvollziehbar protokolliert; Geheimnisse und unnötige personenbezogene oder schützenswerte Daten werden dabei vermieden.
5. Eingaben, Authentisierung, Autorisierung, Sitzungen, Fehlerbehandlung, Kryptografie, Dateizugriffe, Netzwerkzugriffe und externe APIs werden entsprechend ihrem Risiko geprüft.
6. Änderungen an Abhängigkeiten und Plattformen unterliegen Patch-, Änderungs- und Sicherheitsprüfung.
7. Nichtfunktionale Sicherheitstests, Regressionstests und bei entsprechendem Risiko Penetrationstests werden vorgesehen.
8. Für Webanwendungen werden einschlägige ASVS-Anforderungen in konkrete Tests oder überprüfbare Abnahmekriterien überführt.
9. Für APIs werden insbesondere Autorisierung auf Objekt- und Funktionsebene, Authentisierung, Ressourcenbegrenzung, Sicherheitskonfiguration, Inventarisierung und der sichere Umgang mit fremden APIs geprüft.
10. Welche BSI- und OWASP-Anforderungen für eine konkrete Pipwerk-Komponente gelten, wird spätestens vor deren produktiver Freigabe dokumentiert.

## 7. Werkzeugbezogene Test- und Sicherheitsanforderungen

| Werkzeug | Erforderliche Regeln |
| --- | --- |
| FastAPI | API-Vertragstests; Validierungsfehler testen; Authentisierung/Autorisierung serverseitig; keine Fachlogik nur im Handler |
| Pydantic | Grenzwerte, ungültige und zusätzliche Felder testen; bei kritischen Daten Konvertierungsverhalten bewusst festlegen; Validierung nicht mit fachlicher Korrektheit verwechseln |
| pytest | isolierte, reproduzierbare Fixtures; keine unkontrollierten produktiven Seiteneffekte |
| React | sicherheitskritische Entscheidungen nicht nur clientseitig; Verhalten statt interne Komponentenstruktur testen |
| Vite | Entwicklungsserver nicht als Produktions-Sicherheitsgrenze behandeln; Build-Konfiguration reproduzierbar halten |
| React Flow | Serialisierung getrennt vom UI-Zustand testen; ungültige Graphen dürfen durch UI-Manipulation keine Fachvalidierung umgehen |
| i18next/react-i18next | Übersetzungsschlüssel testen; keine sicherheits- oder fachlogische Entscheidung anhand übersetzter Texte |
| TanStack Query | Cache-Veraltung, Fehler, Wiederholung und Mutationen testen; Cache niemals als autoritativen Handelszustand behandeln |
| Vitest/Testing Library | deterministische Tests; benutzernahe und zugängliche Selektoren bevorzugen |
| Playwright | isolierte Browserkontexte; Testkonten/Testendpunkte; keine produktiven Brokerzugänge |
| SQLAlchemy | Transaktionen, Constraints und Fehlerfälle testen; keine ungeprüften dynamischen SQL-Fragmente |
| Alembic | Upgrades an Testdatenbank prüfen; bei riskanten Migrationen Wiederherstellung testen |
| Ruff | im CI ohne automatische Änderung prüfen; sicherheitsbezogene Regeln ergänzen, wo sinnvoll |
| mypy | Typprüfung im CI; `Any` und Ignorierungen an kritischen Grenzen minimieren und begründen |
| TypeScript | `strict` im CI; kein Umgehen kritischer Typfehler durch unkontrolliertes `any` oder Typzusicherungen |

## 8. Quellen und überprüfte technische Grundlagen

Technische Aussagen dieses Dokuments wurden am 2026-09-25 gegen die jeweilige offizielle Dokumentation geprüft:

- FastAPI: https://fastapi.tiangolo.com/
- Pydantic: https://docs.pydantic.dev/latest/concepts/models/
- pytest: https://docs.pytest.org/en/stable/explanation/fixtures.html
- React: https://react.dev/learn
- Vite: https://vite.dev/
- React Flow: https://reactflow.dev/
- react-i18next: https://react.i18next.com/
- TanStack Query: https://tanstack.com/query/latest/docs/framework/react/
- Vitest: https://vitest.dev/
- Testing Library: https://testing-library.com/docs/
- Playwright: https://playwright.dev/docs/intro
- SQLAlchemy: https://docs.sqlalchemy.org/en/20/
- Alembic: https://alembic.sqlalchemy.org/en/latest/
- Ruff: https://docs.astral.sh/ruff/
- mypy: https://mypy.readthedocs.io/
- TypeScript: https://www.typescriptlang.org/docs/
- PEP 8: https://peps.python.org/pep-0008/
- PEP 440: https://peps.python.org/pep-0440/
- PEP 484: https://peps.python.org/pep-0484/
- BSI IT-Grundschutz, insbesondere CON.8 Software-Entwicklung sowie die zugehörigen Bausteine des aktuellen IT-Grundschutz-Kompendiums: https://www.bsi.bund.de/grundschutz
- OWASP Application Security Verification Standard (ASVS): https://owasp.org/www-project-application-security-verification-standard/
- OWASP API Security Top 10: https://owasp.org/www-project-api-security/
