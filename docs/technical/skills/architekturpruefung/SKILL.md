---
name: architekturpruefung
description: Einen Entwurf unabhängig prüfen, ob er die Qualitätsziele erfüllt und ob es eine bessere Lösung gibt. Läuft als Unteragent ohne Kenntnis der Überlegungen des Verfassers.
---

# Architekturprüfung

## Zweck
Schwächen eines Entwurfs finden, die sein Verfasser selbst nicht sieht. Ob die Anforderungen
vollständig umgesetzt sind, prüft die QA, nicht diese Prüfung.

## Grundlage
Nur diese Dokumente:
- die Entwurfsabschnitte der Spezifikation
- die Anforderungen des Vorhabens, zum Verständnis
- Qualitätskriterien und Designgrundsätze
- der bestehende Aufbau des Projekts, soweit der Entwurf ihn berührt

Keine Prüfberichte, keine Fragen und Antworten, keine Begründungen außerhalb der Spezifikation.

## 1. Qualitätsziele
- Ist jedes Merkmal der Qualitätskriterien behandelt oder begründet ausgeschlossen?
- Ist jedes Ziel prüfbar?
- Sind Rahmenbedingungen und Datenmengen hergeleitet, mit Reserve, Grenze und Verhalten
  bei Überschreitung?

## 2. Aufbau
- Hat jedes Programm und jeder Baustein genau eine Aufgabe, nach den Begriffen der
  Designgrundsätze?
- Haben Bausteine festgelegte Schnittstellen? Gibt es zyklische Abhängigkeiten?
- Ist jede fachliche Regel an genau einer Stelle umgesetzt?
- Sind Fremdsysteme über Schnittstellen angebunden?
- Wird Vorhandenes genutzt, wo es passt?

## 3. Entscheidungen
Je wesentliche Entscheidung:
- Wurde ein naheliegender Weg übersehen?
- Ist die Bewertung der Wege stimmig?
- Erfüllt ein anderer Weg die Qualitätsziele besser oder ebenso gut mit weniger Aufwand?

Außerdem: Fehlt eine Entscheidung, die der Entwurf braucht?

## 4. Bedienabläufe
Jeden Ablauf als Anwender ohne Vorwissen gedanklich durchspielen, von der Installation bis zum
Entfernen, einschließlich Fehlerfall:
- Wo muss der Anwender etwas wissen, das ihm niemand sagt?
- Wo muss er Hand anlegen, obwohl das Programm es selbst könnte?
- Widerspricht ein Schritt den Grundsätzen der Dialoggestaltung oder den Regeln zur
  Bedienbarkeit in den Qualitätskriterien?

## 5. Belastungsfälle
Hält der Entwurf bei:
- Absturz oder Abbruch mitten im Vorgang,
- gleichzeitigem Zugriff auf dieselben Daten,
- Ausfall oder Fehlverhalten eines Fremdsystems,
- dem Zehnfachen der angenommenen Datenmenge,
- jeder zugelassenen Plattform und jedem zugelassenen Fremdsystem?

## 6. Prüffragen
Die Prüffragen der Designgrundsätze für jede wesentliche Entscheidung beantworten.

## Befunde
Blockierend ist ein Befund, wenn:
- ein Qualitätsziel mit dem Entwurf nicht erreichbar ist,
- die Datenintegrität gefährdet ist,
- gegen einen Designgrundsatz ohne Begründung verstoßen wird,
- eine wesentliche Entscheidung fehlt,
- ein anderer Weg nachweislich besser ist: Er erfüllt die Ziele besser oder ebenso gut mit
  weniger Aufwand.

Alles andere ist ein Hinweis.

Je Befund: Fundstelle, was vorliegt, gegen welches Ziel oder welchen Grundsatz es verstößt,
Vorschlag. Bei einem besseren Weg: den Weg konkret beschreiben und an denselben Zielen bewerten.

## Ergebnis
Als Antwort an den Auftraggeber dieser Prüfung, höchstens etwa 60 Zeilen:
- bestanden oder nicht bestanden
- Befunde, blockierende zuerst

## Nicht zulässig
- Anforderungen auf Vollständigkeit prüfen, das ist Aufgabe der QA
- Formulierungen und Schreibweisen bemängeln
- Befunde ohne Bezug zu einem Ziel oder Grundsatz
- Geschmack als Befund
- einen anderen Weg vorschlagen, ohne ihn zu bewerten
