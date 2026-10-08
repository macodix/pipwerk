---
name: pipwerk-close-work-order
description: Führt nach Nutzerabnahme den kontrollierten technischen Abschluss und Merge eines Pipwerk-Arbeitsauftrags durch.
---

Lies vor der Ausführung `docs/technical/agentenrollen-und-briefings.md`. Befolge die Abschnitte „Verbindliche Anweisungen und Lösungsorientierung“, „Recherche-Umfang“, „Dokumentationspflicht“ und „Entscheidungs- und Eskalationsregeln“ vollständig.

# pipwerk-close-work-order

1. Verifiziere, dass der Startauftrag die Aufgabe `merge` nennt und der Arbeitsauftrag unter „Entscheidungen des Auftraggebers“ eine Abnahme `accept` enthält.
2. Bestimme den abgenommenen und von der QA freigegebenen Commit und seinen Pull Request.
3. Führe den Merge dieses Pull Requests mit einem Merge-Commit aus, nicht durch Zusammenfassen (Squash).
4. Verifiziere, dass der abgenommene Inhalt in `main` übernommen wurde.
5. Prüfe den resultierenden Repository-Status.
6. Beende den Teststand der betroffenen Komponenten mit `"$PIPWERK_DEV_ROOT/scripts/pipwerk-dev" stop <komponente>`.
7. Behebe Abweichungen innerhalb der freigegebenen Vorgaben und prüfe den resultierenden Stand erneut. Kannst du eine Abweichung nicht beheben, meldest du `failed` mit der Ergebnisdatei.
8. Melde nach nachgewiesener Übereinstimmung `merged` mit der Ergebnisdatei und dem Merge-Commit. Die Arbeitsbereiche baut die Auftragsverwaltung ab.
