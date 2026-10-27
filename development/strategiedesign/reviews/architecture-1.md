# Architekturprüfung, Durchlauf 1

- Vorhaben: `strategiedesign`, Phase 2
- Gegenstand: Spezifikation in der Fassung vom 2026-10-27, nur die geänderten Stellen gegenüber Commit `dd0bf1a70c11b46c3e6aff7ac7ec8775a3935bc6` (Mängel E1, E9, E11, E12 der dritten Abnahme von `wp02`)
- Prüfer: Unteragent mit frischem Kontext nach dem Skill `architecture-review`; Grundlage nur Spezifikation, Anforderungen, Fachmodell, Qualitätskriterien und Designgrundsätze
- Umfang: Für frühere Fassungen der Spezifikation liegt keine Architekturprüfung vor. Diese Prüfung umfasst nur die Änderungen dieser Fassung.

## Ergebnis

**Bestanden.** Kein blockierender Befund, drei Hinweise.

Ohne Befund geprüft: Feldnamen `management_of` und `collapsed_managements` unverändert, keine Gefahr für die Datenintegrität (3.7); ein Baustein je Operator oder Funktion, gespeicherte Kreuzungen bleiben gültig, Regel an einer Stelle (3.4); nach dem Wegfall des Assistenten kein widersprechender Verweis, leere Strategie nennt den nächsten Schritt (5.1, 5.5); die Frage „Woher kommt der Wert?“ ist nur eine andere Beschriftung derselben Bindungsarten (3.1, 5.4). Prüffragen der Designgrundsätze: Ausgeschlossen wird nur, was der Auftraggeber gestrichen hat; ein nachweislich besserer Weg wurde nicht gefunden.

## Hinweise und Antworten

| Nr. | Hinweis | Grundsatz | Antwort |
|---|---|---|---|
| 1 | Kein Rückweg zur Vorbelegung „das Instrument, auf dem die Strategie läuft“; offen, was gilt, wenn der Anwender „anderes Instrument wählen“ antippt und nichts eingibt (5.4). | Steuerbarkeit, Robustheit gegen Benutzungsfehler | Übernommen: Solange eine andere Belegung gilt, bietet das Feld „wieder das Instrument, auf dem die Strategie läuft“ an; ohne Eingabe bleibt die Vorbelegung (5.4). |
| 2 | Datentyp an zwei Stellen verschieden geregelt (5.4 Erklärung, 5.3 Karte, Formeleditor); keine Stelle legt fest, woher die Wörter für die Datentypen kommen. | Regel an einer Stelle, Erwartungskonformität, E2 | Übernommen: Die Bibliothek liefert zu jedem Datentyp eine Beschriftung in Deutsch und Englisch mit den Typbeschreibungen, beim Objekt den Namen des Objekttyps; Erklärung, Karte und Formeleditor verwenden sie (3.1, 5.3, 5.4). |
| 3 | „vorheriger Wert von“ bietet auch Werte ohne früheren Wert an; der Fehler zeigt sich erst bei der Prüfung (3.4, 5.4). | Robustheit gegen Benutzungsfehler (verhindern statt melden), E2 | Übernommen: Die sichtbaren Namen kennzeichnen je Wert, ob er einen früheren Wert hat; die Bausteine bieten für das Argument nur diese an; Browsertest ergänzt (3.4, 5.4, 7). |

Abgelehnte blockierende Befunde zur Entscheidung des Auftraggebers: keine.
