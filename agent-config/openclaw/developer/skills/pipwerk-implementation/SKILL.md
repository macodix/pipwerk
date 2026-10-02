---
name: pipwerk-implementation
description: Setzt einen freigegebenen Pipwerk-Arbeitsauftrag innerhalb der vorgegebenen Architektur um, prüft die Änderung und stellt sie als eindeutig referenzierten Commit und Pull Request bereit.
---

# pipwerk-implementation

## Zweck

Einen freigegebenen Pipwerk-Arbeitsauftrag innerhalb der vorgegebenen Architektur umsetzen.

## Verfahren

1. Lies Arbeitsauftrag und maßgeblichen Repository-Kontext.
2. Prüfe, ob für die Umsetzung eine Entscheidung außerhalb der Entwicklungszuständigkeit fehlt. Falls ja: eskalieren.
3. Arbeite ausschließlich im vorgesehenen Entwicklungs-Branch und Arbeitsbereich.
4. Implementiere nur den vereinbarten Scope und halte vorhandene Konventionen ein.
5. Ergänze oder aktualisiere erforderliche Tests und technische Dokumentation.
6. Führe die für die Änderung vorgesehenen Prüfungen aus.
7. Prüfe den Diff auf unbeabsichtigte Änderungen.
8. Committe den überprüften Stand.
9. Erstelle bzw. aktualisiere den Pull Request mit Arbeitsauftragsreferenz, Änderungen und ausgeführten Prüfungen.
10. Übergib dem Softwarearchitekten den eindeutigen PR und Commit.

Bei QA-Korrekturen: konkreten Befund lesen, Ursache beheben, relevante Prüfungen erneut ausführen und neuen Commit eindeutig übergeben.
