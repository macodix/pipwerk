---
name: pipwerk-close-work-order
description: Führt nach Nutzerabnahme den kontrollierten technischen Abschluss und Merge eines Pipwerk-Arbeitsauftrags durch und verifiziert den übernommenen Codezustand.
---

# pipwerk-close-work-order

## Zweck

Nach erfolgreicher Nutzerabnahme den freigegebenen Arbeitsstand kontrolliert abschließen.

## Verfahren

1. Verifiziere die ausdrückliche Abschlussfreigabe des Projektleiters nach Nutzerabnahme.
2. Bestimme den abgenommenen und QA-geprüften Codezustand.
3. Führe den vorgesehenen Merge-/Abschlussprozess aus.
4. Verifiziere, dass der beabsichtigte abgenommene Codeinhalt in den Zielstand übernommen wurde.
5. Prüfe den resultierenden Repository-Status.
6. Melde Abweichungen; erkläre das Arbeitspaket nicht eigenmächtig für abgeschlossen, wenn der übernommene Stand nicht dem abgenommenen Inhalt entspricht.
