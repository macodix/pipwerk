# Gestaltungsprinzipien

## Dokumentstatus

- status: `accepted`
- stand: 2026-09-25

## Ermöglichendes Softwaredesign

Pipwerk wird grundsätzlich offen, erweiterbar und konfigurierbar gestaltet. Fachliche oder technische Möglichkeiten werden nicht ohne dokumentierten guten Grund ausgeschlossen oder dauerhaft festgeschrieben.

Gute Gründe für Einschränkungen sind insbesondere:

- fachliche Korrektheit;
- IT-Sicherheit;
- Konsistenz und Datenintegrität;
- technische Kompatibilität;
- nachweisbar erforderliche Komplexitätsbegrenzung.

Einschränkungen werden so eng wie erforderlich umgesetzt. Konfigurierbare Regeln und erweiterbare Schnittstellen haben Vorrang vor fest eingebauten Grenzen.

Aktuelle Anforderungen dürfen spätere Erweiterungen nicht unnötig verhindern. Erweiterbarkeit vorzusehen verpflichtet jedoch nicht dazu, alle denkbaren Funktionen sofort zu implementieren.

## Prüfung

Bei Anforderungen, Architekturentscheidungen und Code-Reviews wird geprüft:

1. Welche Möglichkeit wird durch die Entscheidung ausgeschlossen?
2. Welcher konkrete gute Grund rechtfertigt diese Einschränkung?
3. Kann das Ziel durch Konfiguration, Erweiterungspunkt oder eine engere Einschränkung erreicht werden?
4. Ist die Begründung im maßgeblichen Dokument nachvollziehbar festgehalten?
