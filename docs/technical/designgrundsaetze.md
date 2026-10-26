# Designgrundsätze

## Dokumentstatus

- status: `accepted`
- stand: 2026-10-26
- geltungsbereich: Entwicklungsprozess, projektunabhängig
- abgestimmt: Festlegung des Auftraggebers im Chat am 2026-10-26; Abschnitt 1 aus den Gestaltungsprinzipien vom 2026-09-25

## Geltung

- Die Grundsätze gelten für Entwurf, Umsetzung und Prüfung, für alle Rollen.
- Sie beschreiben den Normalfall und seinen Zweck. Abweichungen sind mit Begründung zulässig.
- Anforderungen des Auftraggebers gehen vor.
- Was die Software leisten muss, steht in den [Qualitätskriterien](qualitaetskriterien.md).
- Bei konkreten Unklarheiten wird in den Originalquellen nachgelesen.

## 1. Ermöglichen statt einschränken

- Software wird offen, erweiterbar und konfigurierbar gestaltet. Möglichkeiten werden nur mit dokumentiertem Grund ausgeschlossen.
- Gute Gründe sind fachliche Korrektheit, Sicherheit, Datenintegrität, technische Kompatibilität und nachweisbar nötige Begrenzung der Komplexität.
- Eine Einschränkung ist so eng wie nötig. Konfiguration und Erweiterungspunkte haben Vorrang vor fest eingebauten Grenzen.
- Erweiterbarkeit vorzusehen heißt nicht, alles sofort umzusetzen.

## 2. Aufbau

- **Eine Aufgabe je Programm** *(Modularity, McIlroy)*. Betrieb, Einrichtung und Werkzeuge für Tests sind getrennte Programme. Verschiedene Aufgaben werden nicht über Unterbefehle in einem Programm gebündelt.
- **Bausteine mit klaren Schnittstellen** *(Modularity)*. Jeder Baustein hat eine Aufgabe und eine festgelegte Schnittstelle. Es gibt keine zyklischen Abhängigkeiten.
- **Fachliche Regeln an einer Stelle.** Oberfläche, Schnittstellen und Tests verwenden diese Stelle, statt die Regeln nachzubilden.
- **Was entschieden wird, getrennt davon, wie es ausgeführt wird** *(Separation)*. Einstellungen und Regeln sind getrennt vom Code, der sie ausführt. Die Oberfläche ist getrennt von der Verarbeitung.
- **Fremdsysteme über Schnittstellen.** Datenbank, Übertragungsweg und Datenquellen sind austauschbar, ohne dass sich die Fachlogik ändert.
- **Zusammenarbeit mit anderen Programmen** *(Composition)*. Ein- und Ausgaben haben beschriebene Formate, damit andere Programme sie nutzen können.

## 3. Einfachheit

- **Einfach vor raffiniert** *(Simplicity, Clarity)*. Code wird so geschrieben, dass ihn ein anderer ohne Erklärung versteht. Komplexität nur, wo die Aufgabe sie verlangt.
- **Klein vor groß** *(Parsimony)*. Ein großes Programm nur, wenn nachweislich nichts Kleineres reicht.
- **Wissen in Daten statt in Code** *(Representation)*. Wo es geht, stecken Regeln und Varianten in Tabellen oder Konfiguration, und der Code bleibt einfach.
- **Erst richtig, dann schnell** *(Optimization)*. Erst funktionsfähig, dann nur dort beschleunigen, wo eine festgelegte Vorgabe nicht erreicht wird.

## 4. Verhalten

- **Keine Überraschungen** *(Least Surprise)*. Bedienung, Namen und Verhalten folgen dem, was der Anwender von vergleichbarer Software kennt.
- **Ruhig im Erfolgsfall** *(Silence)*. Ausgaben nur, wenn sie etwas mitteilen: Ergebnis, Fortschritt bei langen Vorgängen, Warnung, Fehler.
- **Laut und früh scheitern** *(Repair)*. Ein Fehler wird sofort und deutlich gemeldet, nicht verschleppt oder verschwiegen.
- **Sichtbar und nachvollziehbar** *(Transparency, Robustness)*. Zustand und Ablauf lassen sich ohne Debugger erkennen, über Status, Protokoll und klare Meldungen. Robust ist, was einfach und durchschaubar ist.

## 5. Arbeitsweise

- **Zeit der Entwickler vor Rechenzeit** *(Economy)*. Bei gleichem Ergebnis gewinnt die Lösung, die weniger Entwicklungs- und Pflegeaufwand macht.
- **Erzeugen statt von Hand schreiben** *(Generation)*. Gleichförmiges wie Schnittstellenbeschreibungen oder Datenmodelle wird erzeugt, wo das zuverlässiger ist.
- **Keinem Weg blind vertrauen** *(Diversity)*. Es gibt nicht die eine richtige Lösung, Alternativen werden geprüft.
- **Für die Zukunft entwerfen** *(Extensibility)*. Formate und Schnittstellen haben Versionen und lassen Erweiterungen zu.

## 6. Code-Ebene (SOLID)

- **Eine Verantwortung je Klasse** *(Single Responsibility)*. Eine Klasse hat genau einen Grund, sich zu ändern.
- **Erweitern statt ändern** *(Open/Closed)*. Neues Verhalten kommt durch Ergänzung hinzu, ohne bestehenden, geprüften Code zu ändern.
- **Ersetzbarkeit** *(Liskov Substitution)*. Eine abgeleitete Klasse lässt sich überall einsetzen, wo die Basisklasse erwartet wird, ohne dass sich das Verhalten unerwartet ändert.
- **Schmale Schnittstellen** *(Interface Segregation)*. Kein Baustein hängt von Funktionen ab, die er nicht braucht.
- **Abhängigkeit von Schnittstellen** *(Dependency Inversion)*. Die Fachlogik hängt von Schnittstellen ab, nicht von konkreter Technik. Die Technik setzt die Schnittstelle um.

## 7. Beschreibung des Entwurfs (arc42)

Der Entwurf in einer Spezifikation folgt der Gliederung von arc42. Abschnitte ohne Inhalt für das Vorhaben entfallen mit einem Satz Begründung. Die wichtigsten Abschnitte:

| Abschnitt | Inhalt |
|---|---|
| Einführung und Ziele | Aufgabe, wichtigste Qualitätsziele nach den [Qualitätskriterien](qualitaetskriterien.md) |
| Randbedingungen | Vorgaben, die den Entwurf einschränken: Plattformen, vorgegebene Technik, Regeln |
| Kontextabgrenzung | was zum System gehört, welche Fremdsysteme und Anwender es berührt, über welche Schnittstellen |
| Lösungsstrategie | die grundlegenden Entscheidungen in wenigen Sätzen |
| Bausteinsicht | Programme und Bausteine mit ihrer Aufgabe und ihren Schnittstellen |
| Laufzeitsicht | wichtige Abläufe, einschließlich Installation, Einrichtung, Aktualisierung und Fehlerfall |
| Verteilungssicht | auf welchen Rechnern was läuft und wie sie verbunden sind |
| Querschnittliche Konzepte | Regeln für alle Bausteine: Datenhaltung, Fehlerbehandlung, Protokolle, Sicherheit, Sprache |
| Architekturentscheidungen | jede wesentliche Entscheidung mit verworfenen Alternativen und Grund |
| Qualitätsanforderungen | prüfbare Qualitätsziele mit Vorgaben |
| Risiken und technische Schulden | bekannte Schwächen und was daraus folgen kann |

## 8. Prüffragen

Bei jeder Entwurfsentscheidung:

1. Welche Möglichkeit schließt die Entscheidung aus, und mit welchem Grund?
2. Ließe sich das Ziel durch Konfiguration, einen Erweiterungspunkt oder eine engere Einschränkung erreichen?
3. Hat jedes Programm und jeder Baustein genau eine Aufgabe?
4. Gibt es eine einfachere Lösung, die die Ziele ebenso erfüllt?
5. Ist die Begründung im zuständigen Dokument festgehalten?

## Quellen

- Eric S. Raymond: The Art of Unix Programming, Kapitel 1 (Unix-Regeln)
- Robert C. Martin: SOLID-Prinzipien
- arc42, Vorlage zur Architekturdokumentation, arc42.org

## Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-26 | Angelegt aus den Gestaltungsprinzipien (`docs/design/architecture/gestaltungsprinzipien.md`, entfernt), ergänzt um Aufbau, Unix-Regeln, SOLID, arc42 und Prüffragen. Festlegung des Auftraggebers im Chat am 2026-10-26. |
