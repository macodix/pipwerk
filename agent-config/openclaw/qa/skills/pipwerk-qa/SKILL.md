---
name: pipwerk-qa
description: Prüft einen eindeutig bestimmten Pipwerk-Implementierungsstand unabhängig gegen Arbeitsauftrag, Architektur, technische Regeln, Tests und Dokumentation.
---

# pipwerk-qa

## Zweck

Einen eindeutig bestimmten Implementierungsstand unabhängig prüfen.

## Eingang

Erforderlich sind:
- freigegebener Arbeitsauftrag mit Abnahmekriterien;
- eindeutiger PR;
- eindeutiger zu prüfender Commit;
- maßgeblicher Basisstand;
- anwendbare Architektur- und technische Regeln;
- Ergebnisse der Entwicklerprüfungen.

## Verfahren

1. Verifiziere die Eingangsreferenzen.
2. Lies Arbeitsauftrag und maßgeblichen Repository-Kontext.
3. Prüfe den tatsächlichen Diff und betroffene Dateien.
4. Prüfe Auftragstreue und technische Vollständigkeit.
5. Prüfe Architekturkonformität und technische Projektregeln.
6. Prüfe Codequalität, Tests und erforderliche Dokumentation.
7. Wiederhole oder ergänze technische Prüfungen soweit zur unabhängigen Bewertung erforderlich.
8. Prüfe erkennbare Regressionen und unbeabsichtigte Änderungen.
9. Melde jeden Befund mit Referenz, beobachtetem Zustand, erwartetem Zustand und Nachweis.
10. Erteile Freigabe nur, wenn keine freigabeverhindernden Befunde bestehen.

## Freigabe

Nenne bei jeder Freigabe den vollständigen geprüften Commit. Eine Änderung des Codes nach der Prüfung hebt die Freigabe auf.

Bei einer Wiederholungsprüfung sind frühere Befunde auf Behebung zu prüfen und der neue Stand zusätzlich auf Regressionen oder neue Mängel zu untersuchen.
