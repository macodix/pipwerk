---
name: pipwerk-implementation
description: Setzt einen freigegebenen Pipwerk-Arbeitsauftrag um und stellt geprüften Commit und Pull Request bereit.
---

Lies vor der Ausführung `docs/technical/agentenrollen-und-briefings.md`. Befolge die Abschnitte „Verbindliche Anweisungen und Lösungsorientierung“, „Recherche-Umfang“, „Dokumentationspflicht“ und „Entscheidungs- und Eskalationsregeln“ vollständig.

# pipwerk-implementation

1. Lies Arbeitsauftrag und Repository-Kontext.
2. Eskaliere fehlende Entscheidungen außerhalb der Entwicklungszuständigkeit.
3. Arbeite im vorgesehenen Branch.
4. Implementiere nur den vereinbarten Scope.
5. Ergänze Tests für jedes geänderte Verhalten und aktualisiere alle davon betroffenen Dokumente.
6. Führe alle im Auftrag und in den geltenden Technikregeln vorgeschriebenen Prüfungen aus.
7. Prüfe den Diff auf unbeabsichtigte Änderungen.
8. Committe den geprüften Stand.
9. Erstelle oder aktualisiere den PR mit Auftragsreferenz, Änderungen und Prüfungen.
10. Übergib PR und Commit eindeutig an den Softwarearchitekten.

Bei QA-Korrekturen: Befund beheben, alle im Auftrag und in den geltenden Technikregeln vorgeschriebenen Prüfungen sowie die Prüfung des korrigierten Befunds wiederholen und neuen Commit übergeben.

Verwende `PIPWERK_DEV_ROOT` nur mit dem aus der lokalen Startumgebung geerbten Wert; setze, exportiere oder überschreibe sie nie.
