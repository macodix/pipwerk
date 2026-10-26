# Qualitätskriterien

## Dokumentstatus

- status: `accepted`
- stand: 2026-10-26
- geltungsbereich: Entwicklungsprozess, projektunabhängig
- abgestimmt: Festlegung des Auftraggebers im Chat am 2026-10-26

## Geltung

- Die Kriterien gelten für Entwurf, Technikwahl, Umsetzung und Prüfung, für alle Rollen.
- Sie beschreiben den Normalfall und seinen Zweck. Abweichungen sind mit Begründung zulässig.
- Anforderungen des Auftraggebers gehen vor.
- Ein Kriterium ist kein Grund, eine Lösung abzulehnen, wenn ihr Zweck auf anderem Weg erfüllt ist.
- Grundsätze für Aufbau und Code stehen in den [Designgrundsätzen](designgrundsaetze.md).
- Die Gliederung der Merkmale folgt ISO/IEC 25010. Bei konkreten Unklarheiten wird in den Originalquellen nachgelesen.

## Datenintegrität

Daten gehen nicht verloren und werden nicht unbemerkt verfälscht, auch bei Absturz, Abbruch, gleichzeitigem Zugriff und Fehlern von Fremdsystemen.

## Zuverlässigkeit

- Ein schreibender Vorgang wird ganz oder gar nicht ausgeführt. Abbruch oder Absturz hinterlassen keinen halben Stand.
- Nach einem Absturz lässt sich das Programm ohne Reparatur von Hand wieder starten. Es setzt fort oder meldet, was verloren ist.
- Daten von außen werden geprüft, bevor sie weiterverarbeitet werden. Fehlerhafte Daten werden mit Grund abgewiesen. Ob der fehlerfreie Rest übernommen wird, ist festgelegt und wird gemeldet. Nichts wird unbemerkt nur teilweise übernommen.
- Fällt ein Fremdsystem aus, meldet das Programm es und wiederholt, wo sinnvoll, statt abzustürzen.

## Sicherheit

- Ohne ausdrückliche Einstellung ist kein Dienst von außen erreichbar. Der Zugriff von außen ist durch Anmeldung oder gleichwertig geschützt.
- Geheimnisse liegen nur in geschützten Dateien, nie im Code, im Repository oder in Protokollen.
- Im Betrieb hat das Programm nur die nötigen Rechte. Administratorrechte nur, wo sie unvermeidbar sind, mit Begründung.
- Abhängigkeiten haben feste Versionen und Prüfsummen.

## Bedienbarkeit, einschließlich Installation und Einrichtung

Grundsätze der Dialoggestaltung nach DIN EN ISO 9241-110:

| Grundsatz | Bedeutung |
|---|---|
| Aufgabenangemessenheit | Der Dialog unterstützt die Aufgabe des Anwenders ohne unnötige Schritte. |
| Selbstbeschreibungsfähigkeit | Der Anwender erkennt jederzeit, wo er ist, was er tun kann und wie. |
| Erwartungskonformität | Die Software verhält sich einheitlich und so, wie der Anwender es aus seiner Arbeit und vergleichbarer Software erwartet. |
| Erlernbarkeit | Die Bedienung erschließt sich ohne Handbuch und unterstützt die Einarbeitung. |
| Steuerbarkeit | Der Anwender bestimmt Ablauf und Tempo, kann unterbrechen, abbrechen und zurückgehen. |
| Robustheit gegen Benutzungsfehler | Fehler werden verhindert oder erkannt und lassen sich mit wenig Aufwand korrigieren. |
| Benutzerbindung | Darstellung und Ablauf sind ansprechend und laden zur Nutzung ein. |

Konkret:

- Die Installation geht aus einer Datei oder mit einem Befehl. Was vorher vorhanden sein muss, wird mitinstalliert oder genannt.
- Das Programm legt seine Konfiguration bei der Einrichtung selbst an. Für die übliche Einrichtung muss der Anwender keine Datei von Hand anlegen oder ausfüllen. Eine lesbare Konfigurationsdatei, die der Anwender ändern kann, ist zulässig.
- Schritte, die zum Betrieb gehören, zum Beispiel das Anpassen der Datenbank nach einer Aktualisierung, führt das Programm selbst aus. Der Anwender muss sie nicht von Hand anstoßen.
- Alle Ausgaben stehen durchgehend in der eingestellten Sprache.
- Fehlermeldungen nennen die Ursache und was der Anwender tun kann.
- Vor dem Löschen oder Überschreiben von Daten, die sich nicht wiederherstellen lassen, fragt das Programm nach und bietet eine Sicherung an, oder der Vorgang lässt sich rückgängig machen.
- Vorgänge, die länger als einige Sekunden dauern, zeigen ihren Fortschritt und lassen sich abbrechen.

## Wartbarkeit

- Bausteine sind einzeln testbar.
- Im Code stehen keine festen Werte für Veränderliches wie Pfade, Ports oder Namen.
- Protokolle nennen Zeit, Baustein und Ursache, sodass sich ein Fehler ohne Debugger eingrenzen lässt.

## Flexibilität und Skalierbarkeit

- Eingaben, die groß werden können, werden als Strom verarbeitet. Der Speicherbedarf hängt dann nicht von ihrer Größe ab.
- Der Entwurf nennt die erwartete Datenmenge und die Grenze, bis zu der er trägt.
- Eine Aktualisierung erhält Einrichtung und Daten.
- Die Software verhält sich auf allen festgelegten Plattformen gleich.

## Kompatibilität

- Das Programm belegt nur Ports, Dateien und Verzeichnisse, die einstellbar oder ihm zugewiesen sind, und ändert keine fremden Einstellungen.
- Eingriffe in das Betriebssystem oder seine Konfiguration nur nach Abstimmung mit dem Auftraggeber.
- Austauschformate sind versioniert und beschrieben.

## Leistungseffizienz

- Vorgaben gibt es nur, wo der Anwender wartet oder große Mengen anfallen, und immer mit den Bedingungen, unter denen sie gelten.
- Die Oberfläche reagiert ohne spürbare Verzögerung. Was länger dauert, läuft im Hintergrund.

## Zielkonflikte

Widersprechen sich Ziele, zum Beispiel einfache Anmeldung und Mehr-Faktor-Anmeldung:

1. Den Konflikt benennen.
2. Eine Lösung suchen, die beide Ziele so weit wie möglich erfüllt, zum Beispiel Mehr-Faktor-Anmeldung nur beim Zugriff von außen.
3. Den Kompromiss mit Begründung festhalten.
4. Berührt der Kompromiss eine Anforderung des Auftraggebers, entscheidet der Auftraggeber.

## Vorzug bei gleichwertigen Lösungen

In dieser Reihenfolge:

1. die einfachere Lösung,
2. die im Projekt bereits verwendete Technik,
3. verbreitete Standardtechnik,
4. weniger Abhängigkeiten.

## Quellen

- ISO/IEC 25010, Qualitätsmodell für Softwareprodukte
- DIN EN ISO 9241-110, Interaktionsprinzipien

## Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-26 | Angelegt. Festlegung des Auftraggebers im Chat am 2026-10-26. |
