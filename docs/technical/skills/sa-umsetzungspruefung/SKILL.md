---
name: sa-umsetzungspruefung
description: Vor der Abnahme prüfen, ob die Umsetzung eines Arbeitspakets dem Entwurf entspricht und seine Qualitätsziele erfüllt.
---

# Prüfung der Umsetzung gegen den Entwurf

## Zweck
Abweichungen vom Entwurf finden, bevor der Auftraggeber abnimmt. Die Funktionen prüfen
Tester und QA, hier geht es um Aufbau, Technik, Bedienabläufe und Qualitätsziele.

## Grundlage
- die Teile der Spezifikation, die das Paket umsetzt: Aufbau, Entscheidungen,
  Bedienabläufe, Qualitätsziele
- der geprüfte Stand der Umsetzung und die laufende Testumgebung
- der Prüfbericht der QA

## 1. Aufbau
- Gibt es genau die entworfenen Programme, mit den entworfenen Namen und Aufgaben?
  Keine zusätzlichen Unterbefehle, kein Programm mit mehreren Aufgaben.
- Entsprechen Bausteine und Abhängigkeiten dem Entwurf? Keine zyklischen Abhängigkeiten.
- Ist jede fachliche Regel an genau einer Stelle umgesetzt und nicht zusätzlich an anderer
  Stelle nachgebaut?
- Sind Fremdsysteme über die entworfene Schnittstelle angebunden?
- Ist die Technik so eingesetzt wie entschieden? Gibt es neue Abhängigkeiten ohne Begründung?
- Daten: Schreibende Vorgänge ganz oder gar nicht? Passt das Programm die Datenhaltung
  bei einer neuen Fassung selbst an?

## 2. Bedienabläufe selbst durchführen
Auf einem frischen Stand der Testumgebung, so wie der Anwender:
- Installation aus dem ausgelieferten Paket, nicht aus dem Quellcode
- Einrichtung beim ersten Start
- die Hauptaufgabe des Pakets
- Aktualisierung von der vorigen Fassung, wenn es eine gibt
- Fehlerfälle herbeiführen: Fremdsystem nicht erreichbar, Abbruch während eines langen
  Vorgangs, fehlerhafte Eingabe
- Entfernen

Je Ablauf festhalten: was laut Spezifikation geschehen soll und was tatsächlich geschieht.

## 3. Qualitätsziele
- Jedes Ziel, das das Paket betrifft, nach der in der Spezifikation genannten Prüfung prüfen.
- Messen nur bei Zielen mit Vorgabe, unter den dort genannten Bedingungen. Die Bedingungen
  im Bericht nennen und andere Ursachen eines Ergebnisses ausschließen, zum Beispiel ein
  langsames Dateisystem.

## 4. Querschnittliches
- Alle Ausgaben in der eingestellten Sprache.
- Fehlermeldungen nennen Ursache und Abhilfe.
- Protokolle nennen Zeit, Baustein und Ursache.
- Keine festen Werte für Veränderliches, keine Geheimnisse im Code oder in Protokollen.

## 5. Bewerten
- Eine Abweichung vom Entwurf oder ein verfehltes Qualitätsziel ist ein blockierender Befund.
- Ist die Abweichung die bessere Lösung, wird stattdessen die Spezifikation angepasst,
  auf dem Weg für Lücken in der Spezifikation.
- Was Tester und QA bereits prüfen, wird nicht wiederholt.

## Ergebnis
Prüfbericht von höchstens etwa 60 Zeilen:
- bestanden oder nicht bestanden, geprüfter Stand
- durchgeführte Bedienabläufe mit Ergebnis
- geprüfte Qualitätsziele mit Ergebnis und Bedingungen
- je Befund: Fundstelle, Soll laut Spezifikation, Ist, blockierend oder Hinweis

## Nicht zulässig
- bestehen lassen, ohne Installation und Einrichtung selbst durchgeführt zu haben
- nur den Code lesen statt die Abläufe durchzuführen
- Befunde ohne Soll und Ist
