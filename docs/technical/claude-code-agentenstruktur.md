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

Die interaktive Session des Softwarearchitekten als Team Lead wird aus `/srv/aixlab/dev/pipwerk/repo` gestartet:

```
cd /srv/aixlab/dev/pipwerk/repo && claude --agent software-architect
```

Teammates erhalten in Claude Code kein eigenes Arbeitsverzeichnis; sie starten im Verzeichnis des Team Leads. Eine Worktree-Isolation wie bei Subagents gilt für Teammates nicht. Die Arbeitstrennung ist deshalb als verbindliche Anweisung in den Agentendefinitionen festgelegt:

| Rolle | Arbeitsbereich |
|---|---|
| Softwarearchitekt / Team Lead | `/srv/aixlab/dev/pipwerk/repo` |
| Entwickler | ausschließlich vorhandener Worktree `/srv/aixlab/dev/pipwerk/implement` |
| QA | ausschließlich vorhandener Worktree `/srv/aixlab/dev/pipwerk/review` |

Entwickler und QA dürfen `repo/` als Referenz lesen, dort aber keine Änderungen vornehmen. Eine zusätzliche `isolation: worktree`-Konfiguration wird nicht verwendet.

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

Der Dispatcher ist lokale Entwicklungsinfrastruktur unter `/srv/aixlab/dev/pipwerk/scripts/` und nicht Bestandteil des Repositorys. Seine Laufzeitdaten liegen ebenfalls außerhalb des Repositorys. Er erhält den freigegebenen Arbeitsauftrag ausdrücklich vom Projektleiter als Pfad unter `docs/design/planning/work-orders/` und prüft, dass die Datei auf `origin/main` vorhanden ist und den Status `freigegeben` hat.

Der Dispatcher startet eine eindeutig benannte `tmux`-Session und darin aus `/srv/aixlab/dev/pipwerk/repo` die interaktive Session `claude --agent software-architect`. Die Auftragsreferenz mit dem Commit von `origin/main` wird als erste Eingabe aktiv übergeben; der Softwarearchitekt pollt nicht. Vor dem Start prüft der Dispatcher, dass `repo/` keine lokalen Änderungen hat und die Claude-Konfiguration von `origin/main` enthält.

Es läuft höchstens ein Pipwerk-Teamlauf. Der Dispatcher zeigt an, ob ein Lauf aktiv ist, welcher Auftrag zugehört und welche `tmux`-Session verwendet wird. Nach beendetem oder abgebrochenem Claude-Prozess setzt ein Wiederanlauf dieselbe Claude-Session mit demselben Auftrag fort; ein anderer Auftrag wird dabei nicht angenommen. Zugangsdaten und API-Schlüssel werden vom Dispatcher weder gespeichert noch ausgegeben. Eine Matrix-Anbindung gehört nicht zum Dispatcher.

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
| 2026-10-06 | Dispatcher-Stand dokumentiert: Dispatcher umgesetzt und getestet; Auftragsauswahl durch den Projektleiter, Übergabe und Lebenszyklus der interaktiven `tmux`-Session durch den Dispatcher. |
| 2026-10-06 | Startverzeichnis des Team Leads und Arbeitsbereiche der Teammates festgelegt; Arbeitstrennung als Anweisung in den Agentendefinitionen. |
| 2026-10-06 | Dispatcher-Randbedingung dokumentiert: Agent Teams benötigen eine interaktive Claude-Code-Session; spätere Automatisierung über `tmux`, nicht über `claude -p`. Unwirksames `skills`-Frontmatter aus Agentendefinitionen entfernt. |
| 2026-10-05 | Agent-Team-Aktivierung ergänzt und OpenClaw-Altstruktur aus dem aktuellen Repository-Stand entfernt. |
| 2026-10-05 | Erstfassung: OpenClaw im kritischen Entwicklungsablauf durch Claude Code Agent Teams ersetzt; Projektleiter außerhalb des Teams; Reihenfolge Claude-Struktur → Dispatcher → Matrix festgelegt. |
