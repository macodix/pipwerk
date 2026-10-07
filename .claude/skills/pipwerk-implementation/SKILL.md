---
name: pipwerk-implementation
description: Setzt einen freigegebenen Pipwerk-Arbeitsauftrag um und stellt geprüften Commit und Pull Request bereit.
---

# pipwerk-implementation

1. Lies Arbeitsauftrag und Repository-Kontext.
2. Eskaliere fehlende Entscheidungen außerhalb der Entwicklungszuständigkeit.
3. Arbeite im vorgesehenen Branch.
4. Implementiere nur den vereinbarten Scope.
5. Ergänze erforderliche Tests und technische Dokumentation.
6. Führe die vorgesehenen Prüfungen aus.
7. Prüfe den Diff auf unbeabsichtigte Änderungen.
8. Committe den geprüften Stand.
9. Erstelle oder aktualisiere den PR mit Auftragsreferenz, Änderungen und Prüfungen.
10. Übergib PR und Commit eindeutig an den Softwarearchitekten.

Bei QA-Korrekturen: Befund beheben, relevante Prüfungen wiederholen und neuen Commit übergeben.

Verwende `PIPWERK_DEV_ROOT` nur, wie der Dispatcher sie gesetzt hat; setze, exportiere oder überschreibe sie nie.
