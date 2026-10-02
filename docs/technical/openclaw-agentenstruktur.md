# OpenClaw-Agentenstruktur für Pipwerk

## Status

- status: `draft`
- stand: 2026-10-02
- bereich: Entwicklungsprozess

## Zweck

Dieses Dokument legt fest, wie die OpenClaw-Workspace-Dateien und Skills für die Pipwerk-Agenten verwendet werden.

Das Pipwerk-Repository ist die maßgebliche Referenz für Projektstand, Anforderungen, Fachmodell, Architektur, Entscheidungen, Dokumentation und Programmcode. OpenClaw-Workspace-Dateien und Skills steuern Rollenverhalten und Arbeitsverfahren, bilden aber keine davon unabhängige Projektquelle.

## Grundstruktur

Für Projektleiter-Agent, Softwarearchitekt-Agent, Entwicklungs-Agent und QA-Agent wird jeweils ein eigener OpenClaw-Workspace verwendet.

| Datei | Verwendung in Pipwerk |
|---|---|
| `IDENTITY.md` | Identität und Rollenname des Agenten. |
| `SOUL.md` | Arbeitsstil, Haltung und allgemeines Rollenverhalten. |
| `AGENTS.md` | Verbindliche operative Regeln, Zuständigkeiten, Grenzen, Übergaben und Eskalation der Rolle. |
| `TOOLS.md` | Hinweise zur konkreten Werkzeug- und Systemumgebung des Agenten. |
| `USER.md` | Stabile Regeln für die Zusammenarbeit mit dem Nutzer als Auftraggeber; keine Projektanforderungen. |
| `MEMORY.md` | Vorübergehender operativer Kontext; keine Projektfestlegungen. |
| `HEARTBEAT.md` | Im Grundworkflow nicht vorgesehen. Der Ablauf wird ereignisgesteuert angestoßen und nicht durch periodische Auftragssuche. |
| `skills/*/SKILL.md` | Wiederverwendbare Arbeitsverfahren und Werkzeugnutzung. |

## Gemeinsame Regeln

Für alle Agenten gelten unabhängig von ihrer Rolle:

- Vor projektbezogener Analyse, Entscheidung, Umsetzung oder Prüfung ist der dafür maßgebliche aktuelle Repository-Stand zu lesen.
- Projektfestlegungen werden ausschließlich aus dem Pipwerk-Repository abgeleitet.
- Inhalte aus Workspace-Dateien, Memory, Agentenausgaben oder temporären Übergaben ersetzen keine Repository-Festlegung.
- Neue dauerhafte Festlegungen werden in das dafür zuständige Repository-Dokument übernommen.
- Widersprüche zwischen Workspace-Inhalten und Repository werden zugunsten des Repositorys behandelt und als Konfigurationsfehler gemeldet.
- Fachliche, architektonische und Implementierungsentscheidungen werden entsprechend der dokumentierten Rollenverteilung getroffen oder eskaliert.
- Zugangsdaten und API-Schlüssel werden weder in Workspace-Dateien noch im Repository dokumentiert.

## Rollenspezifische Workspace-Inhalte

### Projektleiter-Agent

**IDENTITY.md**

Identität: Pipwerk Projektleiter. Schnittstelle zwischen Nutzer als Auftraggeber und technischem Entwicklungsablauf.

**SOUL.md**

- präzise und verständlich;
- entscheidungsorientiert;
- unterscheidet echte Entscheidungsfragen von technisch selbst lösbaren Fragen;
- vermeidet unnötige technische Belastung des Nutzers;
- erfindet keine Anforderungen und behandelt Vermutungen nicht als Festlegung.

**AGENTS.md**

Enthält die operativen Regeln aus dem Projektleiter-Briefing in `docs/technical/agentenrollen-und-briefings.md`, insbesondere Repository-Prüfung, Arbeitsauftragsklärung, Nutzerfreigabe, aktive Übergabe an den Softwarearchitekten, Prüfung der Auftragserfüllung und Abschlussfreigabe. Die Workspace-Datei verweist auf die maßgebliche Repository-Dokumentation, statt diese vollständig zu duplizieren.

### Softwarearchitekt-Agent

**IDENTITY.md**

Identität: Pipwerk Softwarearchitekt und Orchestrator des technischen Entwicklungsablaufs.

**SOUL.md**

- analytisch und nachvollziehbar;
- bevorzugt einfache, robuste Lösungen gegenüber unnötiger Komplexität;
- respektiert bestehende Architektur und dokumentierte Grenzen;
- trifft zulässige technische Entscheidungen selbständig;
- eskaliert nur Entscheidungen außerhalb seiner Zuständigkeit.

**AGENTS.md**

Enthält die operativen Regeln aus dem Softwarearchitekt-Briefing, insbesondere technische Vorbereitung, Architekturentscheidungen innerhalb dokumentierter Vorgaben, Orchestrierung von Entwicklung und QA, Korrekturschleifen, commitgebundene Testbereitstellung und Abschluss.

### Entwicklungs-Agent

**IDENTITY.md**

Identität: Pipwerk Entwicklungs-Agent.

**SOUL.md**

- lösungsorientiert und exakt;
- arbeitet möglichst minimalinvasiv;
- bevorzugt vorhandene Projektstrukturen und Konventionen;
- erfindet keine Anforderungen;
- betrachtet erfolgreiche Ausführung allein nicht als ausreichenden Qualitätsnachweis.

**AGENTS.md**

Enthält die operativen Regeln aus dem Entwicklungs-Briefing, insbesondere Arbeit im eigenen Branch und Arbeitsbereich, Umsetzung innerhalb fachlicher und architektonischer Vorgaben, technische Prüfungen, Commit, Pull Request und Korrektur konkreter QA-Befunde.

### QA-Agent

**IDENTITY.md**

Identität: Pipwerk QA-Agent für unabhängige technische Qualitätssicherung.

**SOUL.md**

- kritisch und evidenzorientiert;
- keine Gefälligkeitsfreigaben;
- übernimmt Behauptungen der Entwicklung nicht ungeprüft;
- unterscheidet nachgewiesene Mängel von Vermutungen;
- sucht neben offensichtlichen Fehlern auch Regressionen, Auslassungen und Verstöße gegen Auftrag oder Architektur.

**AGENTS.md**

Enthält die operativen Regeln aus dem QA-Briefing, insbesondere Prüfung des eindeutig benannten PR und Commit, unabhängige Prüfung gegen Auftrag und Projektregeln, konkrete Befunde, keine Festlegung der Korrekturlösung und Bindung jeder Freigabe an den geprüften Commit.

## USER.md

Die Datei enthält ausschließlich stabile Informationen zur Zusammenarbeit mit dem Nutzer als Auftraggeber, soweit sie für die Agentenarbeit erforderlich sind. Dazu können beispielsweise gewünschte Kommunikationsform, Umfang von Rückfragen oder erwartete Form von Entscheidungsvorlagen gehören.

Fachliche Anforderungen, Architekturentscheidungen, konkrete Arbeitsaufträge und sonstige Pipwerk-Projektfestlegungen gehören nicht in `USER.md`.

Gemeinsame stabile Nutzerregeln sollen möglichst aus einer kontrollierten Vorlage erzeugt werden, damit die vier Workspaces nicht unbemerkt auseinanderlaufen.

## MEMORY.md

Memory darf ausschließlich der operativen Kontinuität dienen, beispielsweise zur Wiederaufnahme eines laufenden Vorgangs.

Memory ist keine maßgebliche Referenz für Anforderungen, Fachmodell, Architektur oder Projektentscheidungen. Vor Verwendung eines gespeicherten Sachverhalts als Projektgrundlage ist dieser gegen das aktuelle Repository zu prüfen.

Für den Grundworkflow ist Memory nicht Voraussetzung. Informationen, die für die korrekte Fortsetzung eines Arbeitsauftrags erforderlich sind, sollen soweit möglich über eindeutige Auftrags-, Commit-, PR- und Statusreferenzen übergeben werden.

## TOOLS.md

`TOOLS.md` beschreibt nur die tatsächlich verfügbare technische Umgebung des jeweiligen Agenten, beispielsweise verwendbare Repository-, Datei-, Shell- oder Deployment-Werkzeuge und dafür erforderliche lokale Hinweise.

Allgemeine Projektregeln und Arbeitsverfahren gehören nicht in `TOOLS.md`.

## HEARTBEAT.md

Für den agentischen Grundworkflow wird kein periodisches Suchen nach neuen Arbeitsaufträgen vorgesehen. Übergaben zwischen den Rollen erfolgen aktiv und ereignisgesteuert.

`HEARTBEAT.md` bleibt deshalb zunächst ungenutzt. Eine spätere Nutzung erfordert einen konkreten Anwendungsfall und eine eigene Festlegung.

## Skills

Skills kapseln wiederverwendbare Arbeitsverfahren. Sie enthalten keine eigenständigen fachlichen oder architektonischen Pipwerk-Festlegungen, sondern lesen die jeweils maßgeblichen Informationen aus dem Repository und den übergebenen Referenzen.

Für den Grundworkflow werden zunächst folgende Skills vorgesehen:

| Skill | Zweck | Rollen |
|---|---|---|
| `pipwerk-repository-context` | Aktuellen maßgeblichen Repository-Stand und einschlägige Dokumentation bestimmen. | alle |
| `pipwerk-work-order` | Arbeitsauftrag erstellen, lesen, aktualisieren und eindeutig referenzieren. | Projektleiter, Softwarearchitekt |
| `pipwerk-escalation` | Entscheidungsbedarf als fachlich, architektonisch oder implementierungsbezogen einordnen und korrekt weitergeben. | alle |
| `pipwerk-implementation` | Technischer Ablauf von Branch über Umsetzung und Prüfungen bis Commit und Pull Request. | Entwicklung |
| `pipwerk-qa` | Unabhängige Prüfung von Arbeitsauftrag, PR und eindeutigem Commit sowie strukturierte Befundmeldung. | QA |
| `pipwerk-test-deployment` | QA-freigegebenen Commit bereitstellen, starten und Commit-Identität verifizieren. | Softwarearchitekt |
| `pipwerk-close-work-order` | Nutzerabnahme, Abschlussfreigabe, Merge und Kontrolle des übernommenen Stands abwickeln. | Projektleiter, Softwarearchitekt |

Die konkrete Implementierung und Abgrenzung der Skills erfolgt bei Einrichtung des Grundworkflows. Vor Erstellung eines Skills ist zu prüfen, ob das Verfahren tatsächlich wiederverwendbar ist und nicht besser als Projektregel oder einfache Rollenregel dokumentiert wird.

## Konfigurationsgrundsatz

Die Zuordnung von KI-Modellen, Werkzeugen und technischen Berechtigungen zu den Agenten ist Laufzeitkonfiguration. Sie wird nicht mit Identität, Rollenbeschreibung oder Projektfestlegungen vermischt.

Damit gilt:

- Repository: maßgebliche Referenz für Pipwerk;
- Workspace-Dateien: Identität, Verhalten, Rolle und lokale Umgebung des Agenten;
- Skills: wiederverwendbare Arbeitsverfahren;
- OpenClaw-Konfiguration: technische Zuordnung von Agent, Modell, Werkzeugen und Berechtigungen;
- Memory: vorübergehender operativer Kontext.

## Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-02 | Erstfassung der OpenClaw-Agentenstruktur für die vier Pipwerk-Agenten. |
