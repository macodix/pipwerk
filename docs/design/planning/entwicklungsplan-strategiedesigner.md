# Entwicklungsplan – Trading-Strategiedesigner

## Status

- status: `draft`
- zweck: Fortschreibbare Festlegungen für Entwicklung und Qualitätssicherung des Prototyps
- stand: 2026-10-06

## 1. Ziel und Gegenstand

Wir entwickeln zunächst einen benutzbaren Prototyp des Strategiedesigners. Er soll fachliche Strategien verständlich gestalten, bearbeiten und als prüfbare Strategiedefinition darstellen können. Die Entwicklung des Handelssystems ist davon getrennt. Der Prototyp wird an zwei unterschiedlichen Strategien erprobt:

1. einer Trendfolge mit zwei exponentiellen gleitenden Durchschnitten (EMA), aus dem vorhandenen Testentwurf;
2. der Punkt-2-Ausbruchstrategie des Nutzers.

Die Teststrategien sind Anwendungsfälle für den Designer. Beispielwerte und Entwürfe werden nicht automatisch zu allgemeinen Anforderungen. Offene fachliche Fragen bleiben offen, bis sie geklärt sind.

## Projekt- und Komponentennamen

Das Gesamtsystem und das gemeinsame öffentliche GitHub-Repository heißen **Pipwerk** beziehungsweise `pipwerk`. Das Repository liegt unter `https://github.com/macodix/pipwerk` und verwendet die GNU General Public License v3.0.

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

Die Dokumentation im Repository wird nach Zweck und Zielgruppe getrennt:

| Verzeichnis | Inhalt |
|---|---|
| `docs/design/` | Anforderungen, Fachmodell, Strategiebeschreibungen, Planungen, Entscheidungen und GUI-Entwürfe |
| `docs/technical/` | technische Dokumentation für Entwicklung, Schnittstellen, Installation, Betrieb und Sicherheit |
| `docs/user/` | Anwenderdokumentation der vier Hauptkomponenten |

Dateipräfixe zur Kennzeichnung dieser Dokumentarten sind nicht erforderlich. Der Dokumentstatus wird innerhalb der jeweiligen Datei geführt.

Für die spätere Systeminstallation gelten grundsätzlich folgende Zuordnungen:

| Pfad | Inhalt |
|---|---|
| `/usr/bin/` | Startprogramme und Kommandozeilenbefehle |
| `/usr/lib/pipwerk/` | Programmcode und mitgelieferte Bibliotheken |
| `/usr/share/pipwerk/` | statische Oberflächendateien, Vorlagen und unveränderliche Daten |
| `/usr/share/doc/pipwerk/` | gemeinsame Projekt-, Architektur-, technische und Anwenderdokumentation |
| `/usr/share/man/` | Handbuchseiten für Kommandozeilenprogramme |
| `/etc/pipwerk/<komponente>/` | systemweite Konfiguration der jeweiligen Komponente |
| `/var/lib/pipwerk/<komponente>/` | persistente Anwendungsdaten der jeweiligen Komponente |
| `/var/log/pipwerk/<komponente>/` | Protokolldateien, soweit diese nicht ausschließlich über das Systemjournal geführt werden |
| `/run/pipwerk/<komponente>/` | flüchtige Laufzeitdaten |
| `/var/cache/pipwerk/<komponente>/` | wiederherstellbare Cache-Daten |

Keine Komponente schreibt während des Betriebs nach `/usr`. Dokumentation und zur Laufzeit benötigte unveränderliche Dateien bleiben getrennt. Abweichende Strukturen für Benutzerinstallationen oder Container werden gesondert dokumentiert.

## 2. Rollen

| Beteiligter | Aufgabe |
|---|---|
| Nutzer / Auftraggeber | Fachliche Entscheidungen und grundlegende Architekturentscheidungen treffen, Arbeitsaufträge freigeben und das tatsächliche Verhalten des laufenden Prototyps praktisch erproben und abnehmen. Eine eigene Prüfung von Pull Requests, Programmcode oder umfangreichen Dokumentationsänderungen ist nicht erforderlich. |
| Projektleiter-Agent | Anforderungen und Arbeitsaufträge mit dem Nutzer klären und formulieren, fachliche Entscheidungen dokumentieren, freigegebene Aufträge aktiv anstoßen und nach der Testbereitstellung die Auftragserfüllung gegen die Abnahmekriterien prüfen. |
| Softwarearchitekt-Agent | Softwarearchitektur und technische Konzeption verantworten, Architekturentscheidungen innerhalb dokumentierter Vorgaben treffen und dokumentieren, Architekturkonformität überwachen und den automatisierten Entwicklungsablauf orchestrieren. |
| Entwicklungs-Agent | Vereinbarte Aufträge innerhalb der fachlichen und architektonischen Vorgaben im eigenen Arbeitsbereich implementieren, technische Prüfungen ausführen, Änderungen und Prüfergebnisse bereitstellen und festgestellte Mängel korrigieren. |
| QA-Agent | Technische Qualität unabhängig von der Entwicklung gegen Auftrag, Architekturvorgaben, Repository-Stand, Code, Tests, Dokumentation und technische Projektregeln prüfen. |

Der Projektleiter entscheidet keine fachlichen Fragen anstelle des Nutzers. Der Softwarearchitekt darf dokumentierte Architekturvorgaben anwenden und innerhalb dieser Vorgaben Architekturentscheidungen treffen; neue Architekturgrundsätze oder Änderungen bestehender Architekturvorgaben bedürfen der Entscheidung des Nutzers über den Projektleiter. Normale Implementierungsentscheidungen innerhalb dieser Grenzen trifft der Entwicklungs-Agent.

Eine Fertigmeldung des Entwicklungs-Agenten ersetzt weder die unabhängige QA noch die Prüfung der Auftragserfüllung durch den Projektleiter noch die praktische Erprobung durch den Nutzer.

## 3. Ablauf je Arbeitspaket

1. **Repository-Stand prüfen:** Vor Analyse, Planung, Arbeitsauftrag oder Prüfung wird der aktuelle Stand von `main` gelesen. Das Repository ist die maßgebliche Projektquelle.
2. **Grundlagen prüfen:** Projektleiter und Softwarearchitekt prüfen die jeweils einschlägigen Anforderungen, Fachmodelle, Entscheidungen, Architekturvorgaben und technischen Regeln auf ausreichende Eindeutigkeit und erkennbare Widersprüche. Fachliche Widersprüche klärt der Projektleiter mit dem Nutzer; Architekturfragen innerhalb bestehender Vorgaben entscheidet der Softwarearchitekt. Neue Architekturgrundsätze oder Änderungen bestehender Vorgaben werden über den Projektleiter dem Nutzer vorgelegt.
3. **Auftrag festlegen und freigeben:** Nutzer und Projektleiter-Agent vereinbaren fachliches Ziel, Geltungsbereich, gewünschtes Verhalten und nachprüfbare Abnahmekriterien. Der Auftrag wird unter `docs/design/planning/work-orders/` abgelegt. Nicht entschiedene Punkte werden ausdrücklich als offen gekennzeichnet. Ein Auftrag wird erst ausgeführt, wenn die für die Umsetzung erforderlichen fachlichen Fragen geklärt und der Auftrag vom Nutzer freigegeben wurde.
4. **Auftrag aktiv übergeben:** Nach Nutzerfreigabe stößt der Projektleiter-Agent den Softwarearchitekt-Agenten aktiv an und übergibt die eindeutige Referenz auf den freigegebenen Arbeitsauftrag. Der Softwarearchitekt sucht oder pollt nicht nach neuen Aufträgen.
5. **Technisch vorbereiten und umsetzen:** Der Softwarearchitekt prüft die technischen und architektonischen Grundlagen und übergibt Auftrag und geltende Architekturvorgaben an den Entwicklungs-Agenten. Dieser arbeitet im eigenen Branch und Arbeitsbereich, setzt den Auftrag um, führt die vorgesehenen technischen Prüfungen aus und erstellt einen Pull Request.
6. **Unabhängige QA:** Der Softwarearchitekt übergibt dem QA-Agenten den freigegebenen Auftrag und Abnahmekriterien, konkreten Pull Request und Commit, maßgeblichen Ausgangsstand von `main`, geltende Architektur- und Technikregeln sowie die Prüfnachweise des Entwicklungs-Agenten. QA prüft unabhängig und gibt bei Bestehen ausschließlich den eindeutig geprüften Commit frei.
7. **Mängel beheben:** Bei negativer QA klassifiziert der Softwarearchitekt die Befunde. Implementierungsbefunde gehen an den Entwicklungs-Agenten; Architekturprobleme bearbeitet der Softwarearchitekt innerhalb seiner Zuständigkeit; fachlicher Klärungsbedarf geht über den Projektleiter an den Nutzer. Nach jeder Codeänderung erfolgt erneut unabhängige QA. Die Schleife läuft bis zur bestandenen QA oder bis fehlender Fortschritt beziehungsweise eine Entscheidung außerhalb der Zuständigkeit eine Eskalation erfordert.
8. **Teststand bereitstellen:** Nach bestandener QA wird exakt der von QA freigegebene Commit bereitgestellt. Benötigte Abhängigkeiten werden eingerichtet, erforderliche Prozesse gestartet und ihre Erreichbarkeit geprüft. Vor der Übergabe wird verifiziert, dass der laufende Teststand exakt diesem Commit entspricht. Ändert sich danach der Code, ist die QA-Freigabe ungültig und eine erneute QA-Prüfung erforderlich.
9. **Auftragserfüllung prüfen:** Der Projektleiter-Agent prüft am laufenden Teststand jedes Abnahmekriterium. Bei „Auftrag nicht erfüllt“ gehen konkrete Abweichungen an den Softwarearchitekten, der die Korrektur über Entwicklung, QA, erneute Testbereitstellung und erneute Projektleiterprüfung steuert. Nur erforderliche fachliche oder grundlegende Architekturentscheidungen werden dem Nutzer vorgelegt.
10. **Nutzererprobung:** Erst nach „Auftrag erfüllt“ erhält der Nutzer den bereitgestellten Stand zur praktischen fachlichen Erprobung. Der Nutzer muss den Pull Request nicht selbst lesen, technisch prüfen oder den Teststand manuell installieren und starten.
11. **Abschluss:** Nach erfolgreicher Erprobung und Abnahme durch den Nutzer gibt der Projektleiter-Agent den Abschluss frei. Der Softwarearchitekt veranlasst Merge und Abschluss und kontrolliert, dass der vorgesehene freigegebene Stand übernommen wurde. Bei Ablehnung durch den Nutzer geht der Auftrag zurück in den Klärungs- beziehungsweise Korrekturprozess.

GitHub dient zur nachvollziehbaren Ablage und Prüfung abgegrenzter Zwischenstände. Änderungen an Programmcode und wesentlicher Dokumentation erfolgen grundsätzlich über Branch und Pull Request.

### Lokale Arbeitsbereiche

Auf dem Entwicklungsrechner werden getrennte Git-Arbeitsbereiche verwendet:

- `repo/` -- Referenz-Worktree für den aktuellen Stand von `main`;
- `implement/` -- Arbeitsbereich für den Implementierungs-Agenten;
- `review/` -- unabhängiger Arbeitsbereich für den QA-Agenten;
- `transfer/` -- Übergabeverzeichnis für Analyse-, Prüf- und sonstige temporäre Arbeitsergebnisse zwischen den beteiligten Werkzeugen;
- `scripts/` -- lokale, nicht zum Produkt gehörende Automatisierung für Einrichtung, Aktualisierung, Start, Stop und Status der Entwicklungs- und Teststände auf dem Entwicklungsrechner.

Entwicklungs- und QA-Agent erhalten denselben freigegebenen Arbeitsauftrag und müssen sich auf denselben maßgeblichen Ausgangsstand beziehen. QA prüft zusätzlich den eindeutig benannten PR und Commit. Inhalte aus `transfer/` sind Arbeitsergebnisse und keine Projektfestlegungen. Dauerhafte Festlegungen werden in die zuständige Dokumentation im Repository übernommen.

### Automatisierter agentenbasierter Entwicklungsablauf

Ziel ist, die manuelle Tätigkeit des Nutzers auf fachliche und grundlegende Architekturentscheidungen, die Freigabe von Arbeitsaufträgen und die abschließende fachliche Erprobung der bereitgestellten Anwendung zu beschränken. Die technischen Schritte dazwischen werden automatisiert ausgeführt.

Als technische Grundlage der Agenten werden Claude Code Agent Teams verwendet; die technische Abbildung ist in `docs/technical/claude-code-agentenstruktur.md` festgelegt. Der Projektleiter-Agent bleibt außerhalb des Claude-Agent-Teams und bildet die Schnittstelle zum Nutzer. Nach Freigabe eines Arbeitsauftrags stößt er den Softwarearchitekt-Agenten aktiv mit eindeutiger Auftragsreferenz an. Der Softwarearchitekt verantwortet Architektur und technische Konzeption und orchestriert Entwicklung, QA, Korrekturschleifen und Testbereitstellung. Die KI-Modelle werden über einen API-Key-basierten Multi-LLM-Anbieter angebunden; der Prozess darf nicht an einen einzelnen Anbieter oder ein einzelnes Modell gebunden werden.

Der automatisierte Ablauf umfasst mindestens:

1. Projektleiter klärt und dokumentiert den Arbeitsauftrag mit dem Nutzer und erhält dessen Freigabe;
2. Projektleiter stößt den Softwarearchitekten aktiv mit eindeutiger Auftragsreferenz an;
3. Softwarearchitekt liest den maßgeblichen Repository-Stand und die einschlägige Dokumentation, trifft zulässige Architekturentscheidungen und übergibt Auftrag und Vorgaben an die Entwicklung;
4. Entwicklungs-Agent implementiert, prüft technisch, committet und erstellt den Pull Request;
5. Softwarearchitekt übergibt einen eindeutigen Prüfauftrag an den getrennten QA-Agenten;
6. QA prüft unabhängig und bindet ein positives Ergebnis an einen konkreten Commit;
7. bei Befunden steuert der Softwarearchitekt die Korrektur und erneute QA; fachliche Fragen gehen über den Projektleiter an den Nutzer;
8. nach bestandener QA wird exakt der freigegebene Commit bereitgestellt, gestartet, auf Erreichbarkeit geprüft und seine Identität verifiziert;
9. Projektleiter prüft den laufenden Teststand gegen alle Abnahmekriterien; bei Abweichungen läuft die Korrekturschleife erneut;
10. erst nach „Auftrag erfüllt“ wird der Stand dem Nutzer zur praktischen Erprobung übergeben;
11. nach Nutzerabnahme gibt der Projektleiter den Abschluss frei; der Softwarearchitekt veranlasst und kontrolliert Merge und Abschluss.

GitHub bleibt Repository und Pull-Request-Ablage. Die Entwicklungsorchestrierung wird nicht von GitHub abhängig gemacht. n8n ist für den Kernablauf nicht erforderlich; eine spätere Verwendung für davon unabhängige Automatisierungen bleibt möglich.

Freigegebene Arbeitsaufträge liegen unter `docs/design/planning/work-orders/`. Der Pfad des konkreten Auftrags wird bei der aktiven Übergabe mitgegeben; ein Repository-Polling zur Auftragserkennung ist nicht vorgesehen.

Vor Freigabe des automatisierten Grundworkflows wird geprüft, ob die dokumentierten Architekturvorgaben ausreichend sind, damit der Softwarearchitekt innerhalb klarer Grenzen selbständig entscheiden kann. Relevante Architekturentscheidungen werden dokumentiert. Neue Architekturgrundsätze oder Änderungen bestehender Vorgaben werden nicht selbständig eingeführt.

Zugangsdaten und API-Schlüssel werden nicht im Repository gespeichert. Die technische Umsetzung dieser Zielarchitektur gilt erst nach einem nachgewiesenen vollständigen Durchlauf als eingerichtet.

### Ausbau des Entwicklungsprozesses

Der Entwicklungsprozess wird stufenweise erweitert. Die Stufen werden in der folgenden Reihenfolge umgesetzt und jeweils funktionsfähig nachgewiesen, bevor die nächste Stufe in den automatisierten Ablauf aufgenommen wird:

1. **Agentischer Grundworkflow:** Zuerst wird ausschließlich der vollständige Ablauf mit Projektleiter-Agent, Softwarearchitekt-Agent, Entwicklungs-Agent, unabhängigem QA-Agent, automatischer Korrekturschleife und anschließender Testbereitstellung eingerichtet und Ende-zu-Ende nachgewiesen.
2. **Spec Kit:** Erst nach einem funktionierenden Grundworkflow wird Spec Kit als zusätzliche Qualitätsschicht für Spezifikation, Klärung, Planung und prüfbare Arbeitsaufträge integriert. Spec Kit ersetzt weder die maßgebliche Pipwerk-Dokumentation noch den Projektleiter, Softwarearchitekt oder den unabhängigen QA-Agenten.
3. **Linter und Codechecker:** Erst danach werden geeignete statische Prüfwerkzeuge für die tatsächlich verwendeten Sprachen und Komponenten ausgewählt und als automatische Quality Gates in den bestehenden Ablauf aufgenommen.
4. **Weitere Qualitätswerkzeuge:** Weitere Werkzeuge, insbesondere für spezialisierte Tests, Vertragsprüfung, Sicherheitsprüfung, Architekturprüfung, Property-based Testing oder Mutation Testing, werden anschließend bedarfsgerecht bewertet und schrittweise ergänzt.

Die Auswahl konkreter Werkzeuge der Stufen 3 und 4 wird erst getroffen, wenn die vorhergehenden Stufen funktionsfähig sind und der tatsächliche Prüfbedarf der entstandenen Software bekannt ist. Das Hinzufügen eines Werkzeugs gilt nicht als Qualitätsgewinn, solange seine Aufgabe, sein Prüfkriterium und seine Wirkung auf den Entwicklungsablauf nicht festgelegt und nachgewiesen sind.

### Gültigkeit von Dokumentinhalten und Entscheidungen

Eine Aussage wird nicht allein dadurch zu einer bestätigten fachlichen Festlegung, dass sie in einem Repository-Dokument steht. Der Dokumentstatus und die Herkunft der Aussage sind zu berücksichtigen.

Insbesondere sind Inhalte eines mit `draft` gekennzeichneten Dokuments Arbeitsstand. Sie dürfen nicht ohne weitere Grundlage als vom Nutzer bestätigte fachliche Entscheidung behandelt werden. Bei Widersprüchen oder zweifelhafter Herkunft ist zunächst zu prüfen, ob eine bereits dokumentierte spätere Entscheidung, ein Änderungsnachweis oder die Git-Historie die Aussage eindeutig klärt.

Eine erkennbare veraltete oder widersprüchliche Dokumentationsstelle wird nicht als neue fachliche Frage an den Nutzer zurückgegeben, wenn sie anhand bereits getroffener und dokumentierter Festlegungen eindeutig korrigiert werden kann. Nur tatsächlich noch offene fachliche Entscheidungen werden dem Nutzer zur Entscheidung vorgelegt.

Chatverläufe, Agentenausgaben und Dateien in `transfer/` sind kein dauerhafter Dokumentationsspeicher. Neue Festlegungen werden in das dafür zuständige Dokument im Repository übernommen.

## Test und spätere Ablaufanalyse

Automatische Tests sollen strukturell ungültige Konfigurationen und eindeutig prüfbare Fehler erkennen. Derzeit wird nicht vorausgesetzt, dass beliebig komplexe Strategien vollständig durch allgemeine deterministische Regeln auf fachliche Widerspruchsfreiheit geprüft werden können. Umfang und Grenzen einer solchen Strategievalidierung bleiben offen.

Als spätere Funktion ist ein Strategiedebugger vorgesehen. Er soll die schrittweise Ausführung einer Strategie und die Betrachtung der dabei verwendeten Eingaben, Zustände, Regeln und Ergebnisse ermöglichen. Diese Funktion gehört nicht zum ersten Strategiedesigner-Prototyp und wird konkretisiert, nachdem die grundlegende Ausführung von Strategien steht.

## 4. Prüfnachweise

Jeder Pull Request enthält mindestens:

- Bezug auf den vereinbarten Arbeitsauftrag und seine Abnahmekriterien;
- kurze Beschreibung der tatsächlich vorgenommenen Änderungen;
- Ergebnis der ausgeführten technischen Prüfungen;
- noch offene Punkte und bekannte Einschränkungen.

ChatGPT bestätigt nur, was durch Code, Tests oder andere zugängliche Nachweise überprüfbar ist. Die technische und dokumentarische PR-Prüfung wird nicht auf den Nutzer verlagert. Die praktische Nutzbarkeit beurteilt der Nutzer nach eigener Erprobung.

## 5. Bestehende Grundlagen

Fachliche Definitionen stehen in `fachmodell.md`. Anforderungen an den Designer stehen in `anforderungen-strategiedesigner.md`; Anforderungen an die Ausführung stehen in `anforderungen-handelssystem.md`. Dieser Entwicklungsplan ersetzt diese Dokumente nicht und enthält keine neuen fachlichen Handelsregeln.

## 6. Noch festzulegen

- Datenformat für die dauerhafte Ablage und die Weitergabe von Strategien zwischen den Hauptkomponenten und über deren Schnittstellen; Bearbeitung als viertes eigenes Thema in einem eigenen Projektchat. Dabei sind insbesondere Schema, Versionierung, Validierung, Kompatibilität und Migration zu klären;
- Bereitstellung der browserbasierten Oberflächen im regulären Betrieb: integrierter Webserver der jeweiligen Pipwerk-Komponente, externer Webserver beziehungsweise Reverse Proxy oder anderes Betriebsmodell;
- Prozessmodell der Hauptkomponenten: Festlegung, welche Teile einer Hauptkomponente als eigene Prozesse laufen und wie sie gestartet, beendet und überwacht werden;
- gemeinsamer Betrieb mehrerer Hauptkomponenten auf demselben Rechner: Adressen, Ports sowie Prozess- und Diensttrennung;
- Adressierung mehrerer Browseroberflächen: insbesondere getrennte Domains beziehungsweise Subdomains, Pfade oder ein anderes geeignetes Verfahren;
- Verantwortung für HTTPS/TLS im regulären Betrieb: Pipwerk-Komponente selbst oder vorgeschalteter Webserver beziehungsweise Reverse Proxy;
- Abgrenzung von Entwicklungsbetrieb, Testbetrieb und regulärem Betrieb einschließlich der jeweils vorgesehenen Bereitstellung der Browseroberflächen;
- weitere Anforderungen an Entwicklungsprozess, Prüfung und Dokumentation.

Konkrete Installations-, Start- und Betriebsverfahren werden am entstehenden, lauffähigen Prototyp festgelegt und erprobt. Ihre vollständige Vorabdefinition ist keine Voraussetzung für den Beginn der Prototypentwicklung.

## 7. Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-02 | Rollen und automatisierten Ablauf auf Projektleiter, Softwarearchitekt, Entwicklung und QA umgestellt; aktive Auftragsübergabe, Entscheidungsgrenzen, commitgebundene QA-Freigabe, Projektleiterprüfung und Abschlussprozess festgelegt. |
| 2026-10-04 | Dauerhaftes Verhalten der Oberflächensprache des Strategiedesigners nach fachlicher Festlegung nicht mehr als offen geführt. |
| 2026-10-06 | Veraltete Angabe OpenClaw als technische Grundlage der Agenten entsprechend der Umstellung auf Claude Code Agent Teams korrigiert. |
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
| 2026-09-25 | Öffentliches Repository `macodix/pipwerk` mit GPL-3.0 angelegt; Dokumentation in Entwurfs-, technische und Anwenderdokumentation gegliedert und FHS-Pfad für installierte Dokumentation ergänzt. |
| 2026-09-27 | Entwicklungsprozess um Repository-Vorprüfung, Codex als unabhängige Prüfinstanz, getrennte lokale Worktrees, `transfer/` sowie Regeln zur Gültigkeit von Draft-Dokumenten und Agentenergebnissen ergänzt. |
| 2026-09-27 | Nutzerrolle präzisiert: keine eigene PR-, Code- oder umfangreiche Dokumentationsprüfung erforderlich; ChatGPT/Codex übernehmen die unabhängige Prüfung und legen nur entscheidungsrelevante Punkte sowie eine kurze Ergebniszusammenfassung vor. |
| 2026-09-27 | AP1 nach Annahme des Arbeitsauftrags nicht mehr als offen geführt; dauerhaftes Verhalten der Oberflächensprache als später zu klärender Punkt festgehalten. |
| 2026-09-27 | Offene Betriebsfragen der browserbasierten Oberflächen zu Webserver/Reverse Proxy, Prozessmodell, gemeinsamem Komponentenbetrieb, Adressierung, HTTPS/TLS und Betriebsarten konkret festgehalten. |
| 2026-09-27 | Übergabe zur praktischen Erprobung präzisiert: Teststand wird vor Übergabe auf dem Entwicklungsrechner bereitgestellt, gestartet und geprüft; lokale Rechnerautomatisierung liegt unter `/srv/aixlab/dev/pipwerk/scripts/`. |
| 2026-09-30 | Zielarchitektur für einen automatisierten agentenbasierten Entwicklungsablauf festgelegt: lokaler KI-Koordinator, API-Key-basierter Multi-LLM-Anbieter, getrennte Implementierungs- und Review-Agenten, automatische Korrekturschleife und Testbereitstellung; GitHub bleibt Repository und PR-Ablage. |
| 2026-09-30 | Stufenweiser Ausbau des Entwicklungsprozesses festgelegt: zuerst agentischer Grundworkflow, danach Spec Kit, anschließend Linter und Codechecker und erst danach weitere Qualitätswerkzeuge. |
