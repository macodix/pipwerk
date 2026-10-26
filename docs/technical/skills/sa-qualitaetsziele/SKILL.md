---
name: sa-qualitaetsziele
description: Rahmenbedingungen und prüfbare Qualitätsziele eines Vorhabens festlegen, bevor der Entwurf beginnt.
---

# Qualitätsziele festlegen

## Zweck
Festlegen, was die Software neben ihren Funktionen leisten muss und unter welchen
Bedingungen. Entwurf, Prüfung und Abnahme werden an diesen Zielen gemessen.

## Grundlage
- Qualitätskriterien und Designgrundsätze (ganz lesen)
- Anforderungen des Vorhabens
- Rahmenbedingungen des Projekts

## 1. Rahmenbedingungen
Aus dem Projektdokument übernehmen. Ergänzen, was für das Vorhaben neu ist oder abweicht:
- Wer benutzt die Software, mit welchem Vorwissen? Wer betreibt sie?
- Auf welchen Rechnern und Betriebssystemen läuft sie? Auf einem Rechner oder auf mehreren?
- Läuft sie dauernd, oder wird sie gestartet und beendet?
- Wie viele Anwender oder Vorgänge laufen gleichzeitig?
- Welche Fremdsysteme sind vorgegeben oder zugelassen, zum Beispiel Datenbanksysteme oder Dienste?
- Welche Technik ist im Projekt bereits gesetzt?

Was nur der Auftraggeber wissen kann: als Annahme mit Begründung festlegen und in der
Vorlage des Entwurfs zur Bestätigung zeigen. Fragen nur, wenn keine vernünftige Annahme
möglich ist. Was technisch ist: selbst festlegen, mit Grund.

**Datenmengen schätzen statt erfragen.**
- Die Größenordnung aus Fachwissen herleiten. Den Anwender höchstens nach Ausgangsgrößen fragen, die er kennt.
- Die Herleitung nennen und als Annahme zur Bestätigung vorlegen.
- Mit Reserve entwerfen, zum Beispiel das Zehnfache der Schätzung.
- Festlegen, wo die Grenze liegt, was das Programm bei Überschreitung tut und wie der Entwurf darüber hinaus erweitert würde.

## 2. Leitfragen je Merkmal

**Datenintegrität und Zuverlässigkeit**
- Welche Daten dürfen auf keinen Fall verloren gehen oder falsch werden?
- Was geschieht bei einem Absturz mitten im Vorgang, bei Abbruch durch den Anwender, bei Stromausfall?
- Was geschieht, wenn zwei Vorgänge gleichzeitig dieselben Daten ändern?
- Welche Daten kommen von außen? Wie werden sie geprüft, was geschieht mit fehlerhaften?
- Was geschieht, wenn ein Fremdsystem nicht antwortet oder Unsinn liefert?
- Wann muss die Software laufen: dauernd, zu bestimmten Zeiten oder nur bei Bedarf?
- Wie lange darf sie höchstens ausfallen, und wie schnell muss sie danach wieder laufen?
- Darf sie für eine Aktualisierung angehalten werden?
- Wie wird ein Ausfall bemerkt, und wer erfährt davon?

**Sicherheit**
- Wer darf was? Gibt es Zugriff über das Netz?
- Welche Geheimnisse gibt es? Wer erzeugt sie, wo liegen sie?
- Welche Rechte braucht das Programm bei der Installation und im Betrieb?

**Bedienbarkeit** (Grundsätze nach ISO 9241-110 in den Qualitätskriterien)
- Welche Aufgaben erledigt der Anwender, in welcher Reihenfolge? Geht das ohne unnötige Schritte?
- Wie kommt die Software auf den Rechner? Was muss vorher vorhanden sein?
- Was muss der Anwender bei der Einrichtung angeben, was ermittelt das Programm selbst?
- Wie wird aktualisiert, und was bleibt dabei erhalten?
- Woran erkennt der Anwender, dass alles läuft? Was tut er bei einem Fehler?
- Welche Aktionen lassen sich nicht rückgängig machen?
- Welche Vorgänge dauern lange?

**Wartbarkeit**
- Welche Teile werden sich voraussichtlich ändern?
- Wie wird ein Fehler im Betrieb eingegrenzt?

**Flexibilität und Skalierbarkeit**
- Welche Teile könnten ausgetauscht werden, zum Beispiel Datenbank, Datenquelle oder Übertragungsweg?
- Bis zu welcher Datenmenge und Anwenderzahl muss der Entwurf tragen?
- Auf welchen Plattformen muss die Software laufen?

**Kompatibilität**
- Mit welchen Systemen arbeitet die Software zusammen, über welche Formate?
- Was belegt sie auf dem Rechner, zum Beispiel Ports, Verzeichnisse oder Dienste? Greift sie in das Betriebssystem ein?

**Leistungseffizienz**
- Wo wartet der Anwender, und wie lange ist das zumutbar?
- Wo fallen große Mengen an?

## 3. Ziele prüfbar formulieren

| Nicht prüfbar | Prüfbar |
|---|---|
| schnell | Import von 100 Mio. Datensätzen in höchstens 30 Minuten auf dem festgelegten Zielrechner |
| einfach zu installieren | Installation aus einer Datei. Danach startet die Einrichtung von selbst, keine Datei muss bearbeitet werden. |
| sicher | ohne Einstellung nur lokal erreichbar, Zugriff über das Netz nur mit Anmeldung |
| robust | Ein Absturz während des Imports hinterlässt keinen Teilbestand. Nach dem Neustart ist der Stand vor dem Import vorhanden. |
| benutzerfreundlich | Ein Anwender richtet die Software beim ersten Mal ohne Handbuch ein. |
| skalierbar | trägt bis 1 Mrd. Datensätze; darüber weist das Programm auf die Grenze hin |

Messbare Vorgaben nur, wo eine Messung unter festgelegten Bedingungen sinnvoll ist.
Sonst eine prüfbare Aussage.

## 4. Herkunft und Zielkonflikte
- Je Ziel die Herkunft: Anforderung, Qualitätskriterium oder eigene Festlegung mit Grund.
- Zielkonflikte nach dem Abschnitt „Zielkonflikte“ der Qualitätskriterien lösen und festhalten.

## 5. Prüfliste vor Abschluss
- Installiert der Anwender, ohne Quellcode zu holen oder Verzeichnisse zusammenzusuchen?
- Ist beschrieben, was installiert wird und was danach läuft?
- Muss der Anwender eine Datei von Hand anlegen oder ausfüllen?
- Muss er einen Schritt anstoßen, den das Programm selbst erledigen kann?
- Sind Werkzeuge für Tests vom Betrieb getrennt?
- Sind alle Ausgaben in einer Sprache?
- Lässt sich das Vorhaben ohne Module abnehmen, die nicht zu ihm gehören?
- Erschließt sich die Bedienung ohne Erklärung?
- Sind große Dateien und viele Dateien auf einmal berücksichtigt?

## Ergebnis
Die Abschnitte der Spezifikation nach arc42:
- Einführung und Ziele: die drei bis fünf wichtigsten Qualitätsziele
- Randbedingungen
- Qualitätsanforderungen: Tabelle Merkmal | Ziel | Prüfung | Herkunft
- Merkmale, die nicht gelten, jeweils mit Grund
- Zielkonflikte und ihre Lösung
- Annahmen zur Bestätigung durch den Auftraggeber, jede mit Begründung
- Fragen an den Auftraggeber, nur wo keine Annahme möglich ist, jede mit Vorschlag

## Nicht zulässig
- Ziele, die nicht prüfbar sind
- Ziele, die nur Anforderungen wiederholen
- Vorgaben, deren Einhaltung von nicht festgelegten Bedingungen abhängt
- Ziele ohne Nutzen für Anwender oder Betrieb
