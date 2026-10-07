# Claude-Code-Agentenstruktur für Pipwerk

## Status

- status: `draft`
- stand: 2026-10-07
- bereich: Entwicklungsprozess

## Zweck und Abgrenzung

Dieses Dokument beschreibt die im Repository vorhandenen Claude-Code-Rollendefinitionen und Skills. Verbindliche Zuständigkeiten stehen in [Agentenrollen und Briefings](agentenrollen-und-briefings.md), der transportunabhängige Ablauf in [Das Pipwerk-Entwicklungsverfahren](entwicklungsverfahren.md).

Die Anbindung des Claude-Code-Agent-Teams an eine künftige Automatisierung, insbesondere Auftragsübermittlung, Start und Wiederanlauf, ist offen. Der Projektleiter bleibt außerhalb des Teams und die Schnittstelle zum Nutzer.

## Rollendefinitionen

| Rolle | Datei | Vorhandene Modellkonfiguration |
|---|---|---|
| Softwarearchitekt | `.claude/agents/software-architect.md` | Opus |
| Entwickler | `.claude/agents/developer.md` | Sonnet |
| QA | `.claude/agents/qa.md` | Opus |

Die vorhandene Modellzuordnung bleibt eine änderbare Laufzeitkonfiguration, keine fachliche Rollenregel. Entwicklung und QA bleiben unabhängig und getrennt. Der Softwarearchitekt koordiniert Architektur, Umsetzung, Korrektur und Testbereitstellung innerhalb der dokumentierten Zuständigkeiten.

## Verbindliche Arbeitsbereiche

Die bestehenden Verzeichnisse bleiben verbindlich:

| Rolle | Arbeitsbereich |
|---|---|
| Softwarearchitekt / Team Lead | `$PIPWERK_DEV_ROOT/repo` |
| Entwickler | `$PIPWERK_DEV_ROOT/implement` |
| QA | `$PIPWERK_DEV_ROOT/review` |
| Testbereitstellung durch `pipwerk-dev` | `$PIPWERK_DEV_ROOT/test` |

### Verbindliche Aufrufschnittstelle

Diese Vorgaben gelten für jedes Programm und Skript, das das Agententeam startet, unabhängig vom verwendeten Startmechanismus:

- `PIPWERK_DEV_ROOT` ist eine Pflichtangabe in der Prozessumgebung. Der Wert ist der absolute Pfad des Pipwerk-Entwicklungsverzeichnisses, unter dem die oben genannten Arbeitsbereiche liegen.
- Das aufrufende Programm liest den Wert aus seiner Konfiguration und übergibt ihn beim Prozessstart als Umgebungsvariable. Eine Erwähnung im Prompt oder eine nicht exportierte Shell-Variable genügt nicht.
- Vor dem Start prüft der Aufrufer, dass der Wert nicht leer ist, auf das vorgesehene Entwicklungsverzeichnis zeigt und das Referenz-Repository unter `repo/` zugänglich ist. Bei fehlendem oder ungültigem Wert startet er das Team nicht und meldet die verletzte Voraussetzung. Es gibt keinen geratenen Ersatzpfad.
- Die Sitzung des Softwarearchitekten startet in `$PIPWERK_DEV_ROOT/repo`. Der Wert muss auch in der Ausführungsumgebung der Teammates verfügbar sein; er darf bei ihrer Erstellung oder beim Weiterreichen von Prozessumgebungen nicht verloren gehen.
- Kein Agent setzt oder verändert die Variable. Fehlt sie beim Agenten, bricht er wie in seiner Rollendefinition vorgeschrieben ab. Diese zusätzliche Prüfung ersetzt nicht die Prüfung des Aufrufers.

Jede Umsetzung eines Aufrufers muss nachweisen, dass der konfigurierte Wert beim Team Lead und den Teammates ankommt, die bestehenden Arbeitsbereichsregeln eingehalten werden und ein fehlender oder ungültiger Wert den Start verhindert. Die konkrete Umsetzung des Aufrufers bleibt offen; diese Schnittstelle setzt keinen neuen Workflow voraus.

Der Softwarearchitekt bleibt in seinem Referenz-Repository. Entwickler und QA wechseln vor jedem Shell-Befehl wie in ihren Agentendefinitionen vorgeschrieben in ihren eigenen Arbeitsbereich. Sie dürfen das Referenz-Repository nur lesen. Vorbereitung und Prüfung der Arbeitsbereiche erfolgen weiterhin über `pipwerk-dev`; seine Schutzprüfungen dürfen nicht umgangen werden. Testbereitstellung und Commit-Verifikation bleiben ebenfalls an dieses Werkzeug gebunden. Einzelheiten stehen in [Das Pipwerk-Entwicklungsverfahren](entwicklungsverfahren.md).

Arbeitsbranch, Ausgangsstand, PR und Prüfcommit werden eindeutig übergeben. Die feste Arbeitstrennung ist eine Agentenanweisung und keine technische Zugriffssperre zwischen den Verzeichnissen.

## Teamfunktion und interne Kommunikation

Die bestehende Teamfunktion bleibt in `.claude/settings.json` über `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` aktiviert. Der Softwarearchitekt ist Team Lead und setzt Entwickler und QA als getrennte Teammates ein. Die Modellkonfiguration bleibt unverändert.

Die operative Kommunikation erfolgt innerhalb des Teams. Die vorhandene Abmelderegel bleibt erhalten: Entwickler und QA senden vor der technischen Bestätigung einer Beendigungsaufforderung die Nachricht `ABMELDUNG BESTÄTIGT: developer` beziehungsweise `ABMELDUNG BESTÄTIGT: qa`. Der Softwarearchitekt wertet diese Nachricht aus und meldet eine Abmeldung nur bei fehlender Nachricht als fehlend. Diese Regel betrifft die teaminterne Kommunikation, nicht den Start oder Wiederanlauf des Teams.

Die Teamfunktion ersetzt keine Isolation der Arbeitsbereiche. Die Rollendefinitionen verlangen weiterhin die oben festgelegten getrennten Bereiche für Entwicklung und QA.

## Wiederverwendbare Arbeitsschritte

Die Dateien unter `.claude/skills/` enthalten:

- `pipwerk-repository-context`: aktuellen Repository-Stand und geltende Referenzen prüfen;
- `pipwerk-implementation`: Auftrag umsetzen, prüfen, dokumentieren und als PR bereitstellen;
- `pipwerk-qa`: unabhängig prüfen und das Ergebnis an einen Commit binden;
- `pipwerk-test-deployment`: freigegebenen Commit bereitstellen und verifizieren;
- `pipwerk-escalation`: Entscheidungsbedarf der zuständigen Rolle zuordnen;
- `pipwerk-close-work-order`: nach Nutzerabnahme und Abschlussfreigabe Merge und Ergebnis kontrollieren.

## Übergaben und Nachvollziehbarkeit

Übergaben benennen Arbeitsauftrag, Branch, PR, vollständigen Commit und Prüfergebnisse eindeutig. Operative Agentenkommunikation ersetzt keine Projektfestlegung. Dauerhafte Entscheidungen gehören in die zuständige Repository-Dokumentation. Änderungen an Rollen und Skills erfolgen versioniert über Branch und Pull Request.

## Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-07 | Rollendefinitionen und Skills von verworfener externer Laufzeitsteuerung entkoppelt; feste Arbeitsbereiche, Werkzeugbindung, Teamfunktion und interne Kommunikation erhalten. Frühere Fassungen sind in Git nachvollziehbar. |
