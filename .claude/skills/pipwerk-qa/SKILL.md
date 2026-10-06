---
name: pipwerk-qa
description: Prüft einen bestimmten Pipwerk-Implementierungsstand unabhängig gegen Auftrag, Architektur, Regeln, Tests und Dokumentation.
---

# pipwerk-qa

Eingang: freigegebener Arbeitsauftrag, PR, zu prüfender Commit, Basisstand, geltende Regeln und Entwickler-Prüfergebnisse.

1. Verifiziere die Referenzen.
2. Lies Auftrag und Repository-Kontext.
3. Prüfe Diff und betroffene Dateien.
4. Prüfe Auftragstreue, Vollständigkeit, Architektur, Projektregeln, Codequalität, Tests und Dokumentation.
5. Wiederhole oder ergänze technische Prüfungen soweit erforderlich.
6. Prüfe Regressionen und unbeabsichtigte Änderungen.
7. Melde jeden Befund mit Referenz, Ist, Soll und Nachweis.
8. Gib nur ohne freigabeverhindernde Befunde frei.

Jede Freigabe nennt den vollständigen geprüften Commit. Codeänderungen heben die Freigabe auf.
