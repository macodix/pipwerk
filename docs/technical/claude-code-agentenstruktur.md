# Claude-Code-Agentenstruktur für Pipwerk

## Status

- status: `draft`
- stand: 2026-10-06
- bereich: Entwicklungsprozess

## Zweck

Dieses Dokument legt die erste technische Zielstruktur für den Pipwerk-Entwicklungsworkflow mit Claude Code Agent Teams fest. Sie ersetzt OpenClaw im kritischen Entwicklungsablauf.

Das Pipwerk-Repository bleibt die maßgebliche Referenz. Agentendefinitionen, Skills und Teamkommunikation dürfen keine davon unabhängigen Projektfestlegungen bilden.

## Abgrenzung

Die Einführung erfolgt bewusst in getrennten Schritten:

1. Claude-Struktur erstellen und testen.
2. Dispatcher erstellen und testen.
3. Matrix-Anbindung ergänzen.

Der Dispatcher (Schritt 2) ist umgesetzt und getestet; er ist im Abschnitt „Dispatcher“ beschrieben. Die Matrix-Anbindung (Schritt 3) ist nicht Bestandteil dieses Dokuments.

## Rollen

Der Projektleiter bleibt außerhalb des Claude-Agent-Teams. Er klärt Arbeitsaufträge mit dem Nutzer, hält sie im Repository fest und stößt über den Dispatcher den technischen Ablauf an.

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

Die fachlich weiterhin gültigen Rollenregeln und Skills wurden aus der bisherigen Struktur in die Claude-Code-Struktur überführt. OpenClaw-spezifische Dateien wie `IDENTITY.md`, `SOUL.md`, `AGENTS.md`, `USER.md`, `MEMORY.md` und `HEARTBEAT.md` sind für diese Zielstruktur nicht maßgeblich.

## Startverzeichnis und Arbeitsbereiche

Alle Arbeitsbereiche liegen nebeneinander im Pipwerk-Entwicklungsverzeichnis des Entwicklungsrechners. Die Agenten finden es über die Umgebungsvariable `PIPWERK_DEV_ROOT`, die der Dispatcher beim Start setzt; die Agentendefinitionen enthalten deshalb keine Pfade des Rechners. Die interaktive Session des Softwarearchitekten als Team Lead wird aus dem Referenz-Repository `repo/` gestartet:

```
cd "$PIPWERK_DEV_ROOT/repo" && claude --agent software-architect
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

Welcher freigegebene Auftrag gestartet wird, bestimmt der Projektleiter. Der Dispatcher übergibt diesen Auftrag; er wählt selbst keinen Auftrag aus. Diese Logik gehört nicht in die Agentenrollen.

## Historie und Nachvollziehbarkeit

Die frühere OpenClaw-Konfiguration ist aus dem aktuellen Repository-Stand entfernt. Ihre Historie bleibt über Git nachvollziehbar.

Änderungen an Rollen, Skills und Ablauf erfolgen weiterhin versioniert über Branch und Pull Request. Git-Historie, Arbeitsaufträge, PRs und commitgebundene QA-Ergebnisse bilden den nachvollziehbaren Verlauf.

## Dispatcher

Claude Code Agent Teams werden in einer interaktiven Claude-Code-Session betrieben. Der nicht-interaktive `claude -p`-Modus ist für den vorgesehenen Team-Lead-Ablauf mit Teammates nicht geeignet und wird nicht verwendet.

Der Dispatcher `pipwerk-dispatch` ist lokale Entwicklungsinfrastruktur und nicht Bestandteil des Repositorys. Er startet die interaktive Session des Softwarearchitekten in `tmux` aus `repo/` und übergibt ihr aktiv den vom Projektleiter genannten freigegebenen Arbeitsauftrag. Funktionsweise, Bedienung und Wiederanlauf sind in [Das Pipwerk-Entwicklungsverfahren](entwicklungsverfahren.md) beschrieben. Eine Matrix-Anbindung ist nicht vorhanden.

## Test vor Dispatcher

Vor dem Bau des Dispatchers ist nachzuweisen, dass:
1. der Softwarearchitekt als Team Lead Entwickler und QA einsetzen kann;
2. Entwickler und QA die vorgesehenen unterschiedlichen Rollen und Modelle verwenden;
3. Übergaben mit eindeutigen Repository-Referenzen funktionieren;
4. QA an einen konkreten Commit gebunden ist;
5. eine Korrekturschleife Entwickler → QA funktioniert;
6. Eskalationsbedarf an den externen Projektleiter zurückgegeben werden kann.

Erst nach erfolgreichem Nachweis folgt der Dispatcher.

## Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-06 | Rechnerpfade durch `PIPWERK_DEV_ROOT` und Arbeitsbereichsnamen ersetzt; Vorbereitung der Arbeitsbereiche durch Entwickler und QA mit `pipwerk-dev` verankert. |
| 2026-10-06 | Beschreibung des Dispatchers in das Dokument zum Entwicklungsverfahren verlagert; hier nur noch Abgrenzung und Verweis. |
| 2026-10-06 | Arbeitsverzeichnis des Softwarearchitekten abgesichert: ausschließlich `repo/`, kein Wechsel in andere Worktrees; Prüfung anderer Arbeitsbereiche mit absoluten Pfaden. |
| 2026-10-06 | Dispatcher-Stand dokumentiert: Dispatcher umgesetzt und getestet; Auftragsauswahl durch den Projektleiter, Übergabe und Lebenszyklus der interaktiven `tmux`-Session durch den Dispatcher. |
| 2026-10-06 | Startverzeichnis des Team Leads und Arbeitsbereiche der Teammates festgelegt; Arbeitstrennung als Anweisung in den Agentendefinitionen. |
| 2026-10-06 | Dispatcher-Randbedingung dokumentiert: Agent Teams benötigen eine interaktive Claude-Code-Session; spätere Automatisierung über `tmux`, nicht über `claude -p`. Unwirksames `skills`-Frontmatter aus Agentendefinitionen entfernt. |
| 2026-10-05 | Agent-Team-Aktivierung ergänzt und OpenClaw-Altstruktur aus dem aktuellen Repository-Stand entfernt. |
| 2026-10-05 | Erstfassung: OpenClaw im kritischen Entwicklungsablauf durch Claude Code Agent Teams ersetzt; Projektleiter außerhalb des Teams; Reihenfolge Claude-Struktur → Dispatcher → Matrix festgelegt. |
