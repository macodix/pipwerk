---
name: pipwerk-escalation
description: Ordnet offene fachliche, architektonische und technische Entscheidungen der zuständigen Pipwerk-Rolle zu.
---

Lies vor der Ausführung `docs/technical/agentenrollen-und-briefings.md`. Befolge die Abschnitte „Verbindliche Anweisungen und Lösungsorientierung“, „Recherche-Umfang“, „Dokumentationspflicht“ und „Entscheidungs- und Eskalationsregeln“ vollständig.

# pipwerk-escalation

Ordne Entscheidungsbedarf zu:
- Fachliche Anforderung, Verhalten, Umfang oder Abnahmekriterium: Entscheidung des Auftraggebers. Entwickler und QA melden sie dem Softwarearchitekten; der Softwarearchitekt meldet sie mit `question` in der Ergebnisdatei. Die Auftragsverwaltung setzt den Auftrag auf `blocked`, der Projektleiter klärt die Frage mit dem Nutzer.
- Architektur innerhalb bestehender Regeln: Softwarearchitekt.
- Neue oder geänderte grundlegende Architekturfestlegung: Entscheidung des Auftraggebers auf demselben Weg wie fachliche Fragen.
- Implementierungsdetail ohne Änderung von fachlichem Verhalten, Auftragsumfang, Abnahmekriterien oder Architekturvorgaben: Entwickler.
- QA-Befund: QA beschreibt den Befund, entscheidet nicht die Korrekturlösung.

Eine Eskalation nennt Referenz, konkrete Frage, Zuständigkeitsgrenze und entscheidende Rolle. Keine Entscheidung vorwegnehmen. Setze alle davon unabhängigen Schritte fort, bevor der Softwarearchitekt `question` meldet.
