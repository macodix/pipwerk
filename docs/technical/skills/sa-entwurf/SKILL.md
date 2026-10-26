---
name: sa-entwurf
description: Aufbau, Technik und Bedienabläufe eines Vorhabens entwerfen und begründen, nach festgelegten Qualitätszielen.
---

# Entwurf erstellen

## Zweck
Die Software so entwerfen, dass sie die Qualitätsziele erfüllt, und jede wesentliche
Entscheidung nachvollziehbar begründen.

## Grundlage
- Ergebnis von sa-qualitaetsziele
- Designgrundsätze (Begriffe Programm, Baustein, Aufgabe) und Qualitätskriterien
- Anforderungen des Vorhabens
- bestehender Aufbau des Projekts: welche Programme, Bausteine und Technik es schon gibt

## 1. Kontext abgrenzen
- Was gehört zum Vorhaben, was nicht?
- Welche Anwender und Fremdsysteme berührt es, über welche Schnittstellen und Formate?

## 2. Aufbau
**Programme**
- Je Aufgabe ein Programm, benannt nach der Aufgabe (Aufgabe nach den Begriffen der Designgrundsätze).
- Betrieb, Einrichtung, Verwaltung und Werkzeuge für Tests sind getrennte Programme.
- Je Programm: Aufgabe, wer es startet, wie lange es läuft.

**Bausteine**
- Je Baustein: eine Aufgabe, eine Schnittstelle, wovon er abhängt.
- Fachliche Regeln an genau einer Stelle. Oberfläche und Schnittstellen nutzen sie.
- Fremdsysteme über eine Schnittstelle angebunden.
- Keine zyklischen Abhängigkeiten.
- Vorhandene Bausteine des Projekts nutzen, bevor neue entstehen.

**Daten**
- Welche Daten, wo gespeichert, wem gehören sie?
- Wie bleiben sie bei Absturz, Abbruch und gleichzeitigem Zugriff richtig?
- Wie ändert sich ihr Format bei einer neuen Fassung, und wie werden alte Daten übernommen?

**Verteilung**
- Was läuft auf welchem Rechner? Wie sind die Rechner verbunden?
- Was ist von außen erreichbar?

## 3. Technik auswählen
Wesentlich ist eine Wahl, wenn sie später schwer zu ändern ist, mehrere Bausteine betrifft,
eine neue Abhängigkeit bringt oder Datenhaltung, Formate oder Übertragung festlegt.

Für jede wesentliche Wahl:
1. Mindestens zwei Wege nennen. Die bereits im Projekt verwendete Technik ist immer einer davon,
   sofern es sie gibt.
2. Jeden Weg an den Qualitätszielen und Randbedingungen bewerten:

   | Kriterium | Weg A | Weg B |
   |---|---|---|
   | Qualitätsziel … | erfüllt / teilweise / nicht, mit Grund | … |

3. Nach Fachwissen entscheiden. Bei Gleichstand gelten die Vorzugsregeln der Qualitätskriterien.
4. Ist unklar, ob ein Weg überhaupt machbar ist: Probeumsetzung beauftragen.
5. Messen nur, wenn alle Bedingungen des Entwicklungsverfahrens erfüllt sind: konkrete Frage,
   vorher genannte Folge jedes Ergebnisses, festgelegte Bedingungen, angemessener Aufwand.

## 4. Entscheidungen festhalten
Je wesentliche Entscheidung:
- **Frage:** was zu entscheiden war
- **Wege:** die betrachteten Wege mit Bewertung
- **Entscheidung** und **Grund**
- **Folgen:** was damit festliegt, was ausgeschlossen ist, welche Risiken bleiben

„Wie bisher“ oder „wie in Komponente X“ allein ist kein Grund.

## 5. Bedienabläufe
Aus Sicht des Anwenders, Schritt für Schritt: was er tut und was er sieht.
- Installation
- Einrichtung beim ersten Start
- tägliche Nutzung der Hauptaufgaben
- Aktualisierung
- Überwachung: Woran erkennt er, dass alles läuft?
- Fehlerfall: Was sieht er, was tut er?
- Entfernen

Jeden Ablauf gegen die Grundsätze der Dialoggestaltung und die Regeln zur Bedienbarkeit
in den Qualitätskriterien prüfen.

## 6. Querschnittliche Konzepte
Regeln, die für alle Bausteine gelten, nur soweit das Vorhaben sie berührt:
Datenhaltung und Transaktionen, Fehlerbehandlung, Protokolle, Konfiguration,
Sprache der Ausgaben, Sicherheit.

## 7. Selbstprüfung
- Je Qualitätsziel: Welcher Teil des Entwurfs erfüllt es? Ziele ohne Antwort sind Lücken.
- Die Prüffragen der Designgrundsätze für jede wesentliche Entscheidung beantworten.
- Die Prüfliste aus sa-qualitaetsziele, Abschnitt 5, auf den Entwurf anwenden.

## Ergebnis
Die Abschnitte der Spezifikation nach arc42: Kontextabgrenzung, Lösungsstrategie,
Bausteinsicht, Laufzeitsicht mit den Bedienabläufen, Verteilungssicht, querschnittliche
Konzepte, Architekturentscheidungen, Risiken. Dazu die Annahmen für die Vorlage des
Entwurfs an den Auftraggeber.

## Nicht zulässig
- Entscheidungen ohne betrachtete Alternative
- Bedienabläufe als bloße Befehlsliste ohne das, was der Anwender sieht
- Bausteine oder Programme ohne genannte Aufgabe
- neue Technik, wo die vorhandene die Ziele ebenso erfüllt
