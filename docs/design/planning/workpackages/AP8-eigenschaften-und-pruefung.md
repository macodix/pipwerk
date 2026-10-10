# AP8 – Eigenschaftenansicht und Prüfung

## Status

- id: `AP8`
- status: `draft`
- stand: 2026-10-10
- komponenten: `components/pipwerk-studio` (Oberfläche)
- pflichtenheft: PH-04, PH-06, PH-10

## Ziel

Parameter jedes Knotens lassen sich in der aus der Typbeschreibung erzeugten Eigenschaftenansicht setzen; Prüfbefunde werden angezeigt und führen zum betroffenen Knoten.

## Umfang

1. Eigenschaftenansicht aus Typbeschreibung: Eingabeelemente je Datentyp, Bindungsart je Parameter (PH-04, PH-10)
2. Auswahl von Verweisen auf Ausgaben anderer Knoten und auf Regeln
3. Ausdruckseingabe mit Rückmeldung aus der Typprüfung
4. Befundliste aus `/api/v1/strategies/validate`, Übersetzung der Befundkennungen, Sprung zum Knoten (PH-06)
5. Deutsch und Englisch, Vitest und Playwright

## Nicht Umfang

- Ausführung oder Vorschau von Werten

## Abhängigkeiten

- setzt voraus: AP7

## Grundlagen

- [Pflichtenheft Schritt 1](../pflichtenheft-strategiedesigner.md)
- [Entwicklungsplan](../entwicklungsplan-strategiedesigner.md)
- [Fachmodell](../../domain/fachmodell.md)
- [Anforderungen Strategiedesigner](../../requirements/anforderungen-strategiedesigner.md)
- [Entwicklungs-, Test- und Sicherheitsregeln](../../../technical/development-test-security-rules.md)
