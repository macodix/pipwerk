# Claude-Code-Agentenstruktur für Pipwerk

## Status

- status: `draft`
- stand: 2026-10-07
- bereich: Entwicklungsprozess

## Zweck

Dieses Dokument legt die erste technische Zielstruktur für den Pipwerk-Entwicklungsworkflow mit Claude Code Agent Teams fest.

Das Pipwerk-Repository bleibt die maßgebliche Referenz. Agentendefinitionen, Skills und Teamkommunikation dürfen keine davon unabhängigen Projektfestlegungen bilden.

## Abgrenzung

Der Entwicklungsworkflow besteht aus dem Claude-Code-Team und dem lokalen Werkzeug `pipwerk-dev` für Arbeitsbereiche, Prüfungen und Testbereitstellung. Der Projektleiter übergibt den freigegebenen Auftrag direkt an den Softwarearchitekten.

## Rollen

Der Projektleiter bleibt außerhalb des Claude-Agent-Teams. Er klärt Arbeitsaufträge mit dem Nutzer, hält sie im Repository fest und stößt durch direkte Auftragsübergabe an den Softwarearchitekten den technischen Ablauf an.

Das Claude-Agent-Team besteht aus:

| Rolle | Funktion | Modell |
|---|---|---|
| Softwarearchitekt | Team Lead, Architektur und Orchestrierung | Opus |
| Entwickler | Implementierung und technische Eigenprüfung | Sonnet |
| QA | unabhängige technische Qualitätssicherung | Opus |

Entwicklung und QA bleiben getrennte Rollen. Die QA prüft unabhängig und darf ihre eigene Korrekturlösung nicht verbindlich vorgeben.

Die Modellzuordnung ist die festgelegte Startkonfiguration für den ersten Versuch und kann nach Auswertung geändert werden.

## Claude-Code-Struktur

Projektbezogene Definitionen liegen direkt im Repository. Agent Teams werden über `.claude/settings.json` mit `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` aktiviert. Die Funktion ist in Claude Code derzeit experimentell.

- `.claude/agents/software-architect.md`
- `.claude/agents/developer.md`
- `.claude/agents/qa.md`
- `.claude/skills/*/SKILL.md`

## Startverzeichnis und Arbeitsbereiche

Alle Arbeitsbereiche liegen nebeneinander im Pipwerk-Entwicklungsverzeichnis des Entwicklungsrechners. Die Agenten finden es über die Umgebungsvariable `PIPWERK_DEV_ROOT`, die vor dem Start von Claude Code in der lokalen Startumgebung gesetzt und an das Team vererbt wird; kein Agent setzt oder verändert sie. Die Agentendefinitionen enthalten deshalb keine Pfade des Rechners. Die interaktive Session des Softwarearchitekten als Team Lead wird aus dem Referenz-Repository `repo/` gestartet:

```
test -n "$PIPWERK_DEV_ROOT" && cd "$PIPWERK_DEV_ROOT/repo" && claude --agent software-architect
```

Teammates erhalten in Claude Code kein eigenes Arbeitsverzeichnis; sie starten im Verzeichnis des Team Leads. Eine Worktree-Isolation wie bei Subagents gilt für Teammates nicht. Die Arbeitstrennung ist deshalb als verbindliche Anweisung in den Agentendefinitionen festgelegt:

| Rolle | Arbeitsbereich |
|---|---|
| Softwarearchitekt / Team Lead | `repo/` |
| Entwickler | ausschließlich Worktree `implement/` |
| QA | ausschließlich Worktree `review/` |

Der Softwarearchitekt arbeitet ausschließlich mit `repo/` als eigenem Arbeitsverzeichnis und wechselt es nicht nach `implement/`, `review/` oder in andere Worktrees. Inhalte anderer Arbeitsbereiche prüft er mit absoluten Pfaden oder Befehlen, die sein Arbeitsverzeichnis nicht dauerhaft verändern.

Entwickler und QA dürfen `repo/` als Referenz lesen, dort aber keine Änderungen vornehmen. Ihre Arbeitsbereiche bereiten sie selbst mit `pipwerk-dev` vor; die Befehle stehen in den Agentendefinitionen. Eine zusätzliche `isolation: worktree`-Konfiguration wird nicht verwendet.

## Kommunikation und Übergaben

Innerhalb eines laufenden Claude-Agent-Teams erfolgt die operative Kommunikation über die Agent-Team-Kommunikation von Claude Code. Dauerhafte Projektzustände werden dadurch nicht ersetzt.

Für nachvollziehbare Übergaben gelten weiterhin eindeutige Repository-Referenzen:
- Arbeitsauftrag;
- Branch;
- Pull Request;
- Commit;
- QA-Ergebnis mit geprüftem Commit.

Welcher freigegebene Auftrag gestartet wird, bestimmt der Projektleiter. Er übergibt dem Softwarearchitekten den Repository-Pfad des Auftrags und den maßgeblichen Commit. Der Softwarearchitekt sucht oder pollt nicht nach Aufträgen.

## Historie und Nachvollziehbarkeit

Änderungen an Rollen, Skills und Ablauf erfolgen weiterhin versioniert über Branch und Pull Request. Git-Historie, Arbeitsaufträge, PRs und commitgebundene QA-Ergebnisse bilden den nachvollziehbaren Verlauf.

## Interaktiver Teamstart

Claude Code Agent Teams werden in einer interaktiven Claude-Code-Session betrieben. Der nicht-interaktive `claude -p`-Modus wird für den vorgesehenen Team-Lead-Ablauf mit Teammates nicht verwendet.

Vor dem Start werden die lokale Startumgebung und `repo/` vorbereitet. Anschließend wird der freigegebene Auftrag direkt in der Sitzung übergeben. Die Schritte stehen in [Das Pipwerk-Entwicklungsverfahren](entwicklungsverfahren.md), Abschnitt 4.

## Funktionsnachweis des Teams

Für den Grundworkflow ist nachzuweisen, dass:
1. der Softwarearchitekt als Team Lead Entwickler und QA einsetzen kann;
2. Entwickler und QA die vorgesehenen unterschiedlichen Rollen und Modelle verwenden;
3. Übergaben mit eindeutigen Repository-Referenzen funktionieren;
4. QA an einen konkreten Commit gebunden ist;
5. eine Korrekturschleife Entwickler → QA funktioniert;
6. Eskalationsbedarf an den externen Projektleiter zurückgegeben werden kann.

## Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-07 | Veraltete Startinfrastruktur entfernt; direkter Teamstart und Vererbung von `PIPWERK_DEV_ROOT` aus der lokalen Startumgebung beschrieben. |
| 2026-10-06 | Rechnerpfade durch `PIPWERK_DEV_ROOT` und Arbeitsbereichsnamen ersetzt; Vorbereitung der Arbeitsbereiche durch Entwickler und QA mit `pipwerk-dev` verankert. |
| 2026-10-06 | Arbeitsverzeichnis des Softwarearchitekten abgesichert: ausschließlich `repo/`, kein Wechsel in andere Worktrees; Prüfung anderer Arbeitsbereiche mit absoluten Pfaden. |
| 2026-10-06 | Startverzeichnis des Team Leads und Arbeitsbereiche der Teammates festgelegt; Arbeitstrennung als Anweisung in den Agentendefinitionen. |
| 2026-10-06 | Unwirksames `skills`-Frontmatter aus Agentendefinitionen entfernt. |
| 2026-10-05 | Agent-Team-Aktivierung ergänzt. |
| 2026-10-05 | Erstfassung mit Claude Code Agent Teams und Projektleiter außerhalb des Teams. |
