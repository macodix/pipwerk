# Prüfbericht Dokumente des Auftraggebers, Durchlauf 4 (Nachprüfung)

- Vorhaben: `relay`, Rolle QA, Phase 1
- Ergebnis: **bestanden**
- geprüfter Commit: `11752e98abb25f42b24d36b3b5fce773193d952c` (Diff gegen `11752e98abb25f42b24d36b3b5fce773193d952c~1` gelesen)
- vorheriger Bericht: `development/relay/reviews/requirements-3.md` (bestanden)

## Blockierende Befunde

Keine.

## Prüfung 1: req-relay-012

- Die Festlegung ist eindeutig wiedergegeben: zwei Arten (Anlage über den Übertragungsweg der Nachricht, eigener Weg für Dateien mit Ortsangabe in der Nachricht), beide verfügbar, Wahl und Wege legt die Spezifikation fest.
- Mit req-relay-002, -003 und -007 kein Widerspruch. req-relay-007 Schritt 2 verweist auf req-relay-012. Die Anlage läuft über den Übertragungsweg der Nachricht (req-relay-003). Zum eigenen Weg für Dateien sagt req-relay-003 nichts, widerspricht aber nicht. Die Wege legt nach req-relay-012 die Spezifikation fest.
- req-relay-010 ist erfüllbar: Die Prüfung von Dateien beider Arten fordert req-relay-012 selbst.

## Prüfung 2: „Abruf“ statt „Beschaffung“

- Ersetzt ohne Sinnänderung: req-relay-005, req-relay-007, req-system-027 (Überschrift und alle Absätze), Strategietester Abschnitt 1, req-test-001, req-test-003 (alle Stellen), Glossar (Eintrag), beide `scope.md`.
- `grep -i beschaff` über `docs/design`, `docs/technical/glossar.md` und beide `scope.md` findet nur noch Einträge in Änderungsnachweisen und im Stand (Verlauf) sowie den Satz zur Ersetzung in `anforderungen-nachrichtensystem.md` Zeile 8. Keine Stelle im Fließtext der Anforderungen ist übrig.

## Prüfung 3: Nachweis laut `development/relay/scope.md`

Abbildbar. Anfrage mit Broker, Symbol, Zeiteinheit und Zeitraum (req-relay-007 Schritt 1) über Matrix und über Dateien (req-relay-004). Rückgabe der Dateien an die Adresse des Absenders (req-relay-007 Schritt 2, req-relay-012, req-relay-005).

## Hinweise (nicht blockierend)

- H1 (Sache der Spezifikation): `anforderungen-nachrichtensystem.md` req-relay-004 nennt „Dateien“ als Übertragungsweg für Nachrichten, req-relay-012 spricht von „Dateien“ als Inhalt einer Nachricht. Gleiches Wort, zwei Bedeutungen. Die Spezifikation sollte die beiden Begriffe trennen.
- H2 (Sache der Spezifikation): req-relay-012 Satz „der Empfänger erkennt …“ nennt den Empfänger, req-relay-010 das empfangende Relay. Wer die Datei prüft, legt die Spezifikation fest.
- H3 (Sache der Spezifikation): Wer die Datei auf dem eigenen Weg überträgt, steht nicht in req-relay-012, obwohl nach req-relay-001 eine Komponente nur mit dem Relay ihres Rechners spricht. Das regelt die Spezifikation.
- H4 (folgt aus einer Festlegung): Der Status in `anforderungen-nachrichtensystem.md` Zeile 8 nennt „Prüfung durch die QA ausstehend“. Nach diesem Bericht ist der Vermerk zu aktualisieren.
