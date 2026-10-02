# Pipwerk OpenClaw agent configuration

Versionierte Vorlagen für die OpenClaw-Workspaces der Pipwerk-Agenten.

## Verwendung

Die Dateien dieses Verzeichnisses werden in die jeweiligen OpenClaw-Workspaces übernommen. Das Pipwerk-Repository bleibt die maßgebliche Referenz für Projektstand, Anforderungen, Fachmodell, Architektur, Entscheidungen, Dokumentation und Programmcode.

Die Vorlagen enthalten deshalb keine davon unabhängigen Projektfestlegungen. Vor projektbezogener Arbeit muss der Agent den aktuellen maßgeblichen Repository-Stand lesen.

## Agenten

- `project-manager/` – Projektleiter-Agent
- `software-architect/` – Softwarearchitekt-Agent
- `developer/` – Entwicklungs-Agent
- `qa/` – QA-Agent
- `shared-skills/` – gemeinsam verwendete Skills

## Versionierung

Änderungen an diesen Vorlagen erfolgen über das Pipwerk-Repository und den normalen Branch-/Pull-Request-Prozess. Installierte Workspace-Dateien sollen aus einer eindeutig bestimmten Repository-Version erzeugt bzw. aktualisiert werden.
