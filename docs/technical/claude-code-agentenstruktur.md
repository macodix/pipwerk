# Claude-Code-Agentenstruktur für Pipwerk

## Status

- status: `draft`
- stand: 2026-10-05
- bereich: Entwicklungsprozess

## Zweck

Dieses Dokument legt die erste technische Zielstruktur für den Pipwerk-Entwicklungsworkflow mit Claude Code Agent Teams fest. Sie ersetzt OpenClaw im kritischen Entwicklungsablauf.

Das Pipwerk-Repository bleibt die maßgebliche Referenz. Agentendefinitionen, Skills und Teamkommunikation dürfen keine davon unabhängigen Projektfestlegungen bilden.

## Abgrenzung

Die Einführung erfolgt bewusst in getrennten Schritten:

1. Claude-Struktur erstellen und testen.
2. Dispatcher erstellen und testen.
3. Matrix-Anbindung ergänzen.

Dieses Dokument und die zugehörige Konfiguration behandeln Schritt 1. Dispatcher und Matrix sind nicht Bestandteil dieser Änderung.

## Rollen

Der Projektleiter bleibt außerhalb des Claude-Agent-Teams. Er klärt Arbeitsaufträge mit dem Nutzer, hält sie im Repository fest und stößt später über den Dispatcher den technischen Ablauf an.

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

## Kommunikation und Übergaben

Innerhalb eines laufenden Claude-Agent-Teams erfolgt die operative Kommunikation über die Agent-Team-Kommunikation von Claude Code. Dauerhafte Projektzustände werden dadurch nicht ersetzt.

Für nachvollziehbare Übergaben gelten weiterhin eindeutige Repository-Referenzen:
- Arbeitsauftrag;
- Branch;
- Pull Request;
- Commit;
- QA-Ergebnis mit geprüftem Commit.

Der spätere Dispatcher bestimmt, welcher freigegebene Auftrag gestartet wird. Diese Logik gehört nicht in die Agentenrollen.

## Historie und Nachvollziehbarkeit

Die frühere OpenClaw-Konfiguration ist aus dem aktuellen Repository-Stand entfernt. Ihre Historie bleibt über Git nachvollziehbar.

Änderungen an Rollen, Skills und Ablauf erfolgen weiterhin versioniert über Branch und Pull Request. Git-Historie, Arbeitsaufträge, PRs und commitgebundene QA-Ergebnisse bilden den nachvollziehbaren Verlauf.

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
| 2026-10-06 | Dispatcher-Randbedingung dokumentiert: Agent Teams benötigen eine interaktive Claude-Code-Session; spätere Automatisierung über `tmux`, nicht über `claude -p`. Unwirksames `skills`-Frontmatter aus Agentendefinitionen entfernt. |
| 2026-10-05 | Agent-Team-Aktivierung ergänzt und OpenClaw-Altstruktur aus dem aktuellen Repository-Stand entfernt. |
| 2026-10-05 | Erstfassung: OpenClaw im kritischen Entwicklungsablauf durch Claude Code Agent Teams ersetzt; Projektleiter außerhalb des Teams; Reihenfolge Claude-Struktur → Dispatcher → Matrix festgelegt. |
