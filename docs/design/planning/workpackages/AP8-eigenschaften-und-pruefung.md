# AP8 – Eigenschaftenansicht und Prüfung

## Status

- id: `AP8`
- status: `draft`
- stand: 2026-10-11
- komponenten: `components/pipwerk-studio` (Oberfläche)
- pflichtenheft: PH-04, PH-06, PH-10

## Ziel

Parameter jedes Bausteins lassen sich in der aus der Typbeschreibung erzeugten Eigenschaftenansicht setzen. Befunde der Prüfung werden angezeigt und führen zum betroffenen Baustein.

## Umfang

1. Eigenschaftenansicht aus Typbeschreibung: Eingabeelemente je Datentyp, Bindungsart je Parameter (PH-04, PH-10)
2. Auswahl von Verweisen auf Ausgaben anderer Bausteine, auf eigenständige Objekte und auf Regeln
3. Ausdruckseingabe mit Rückmeldung aus der Typprüfung
4. Befundliste aus `/api/v1/strategies/validate`, Übersetzung der Befundkennungen, Sprung zum Baustein (PH-06)
5. Deutsch und Englisch, Vitest und Playwright

## Nicht Umfang

- Ausführung oder Vorschau von Werten

## Abhängigkeiten

- setzt voraus: AP7

## Grundlagen

- [Pflichtenheft Schritt 1](../pflichtenheft-strategiedesigner.md)
- [Glossar](../../../technical/glossar.md)
- [Entwicklungsplan](../entwicklungsplan-strategiedesigner.md)
- [Fachmodell](../../domain/fachmodell.md)
- [Anforderungen Strategiedesigner](../../requirements/anforderungen-strategiedesigner.md)
- [Entwicklungs-, Test- und Sicherheitsregeln](../../../technical/development-test-security-rules.md)
