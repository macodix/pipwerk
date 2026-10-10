# AP4 – Bausteine der Teststrategien

## Status

- id: `AP4`
- status: `draft`
- stand: 2026-10-10
- komponenten: `packages/domain-core`
- pflichtenheft: PH-04, PH-11

## Ziel

Alle in PH-11 genannten Bausteintypen sind im Fachkern angemeldet, beschreiben sich vollständig in Deutsch und Englisch und bestehen die strukturelle Prüfung in beiden Prüffällen.

## Umfang

1. Auslöser, Indikatoren, Trendverfahren, Bedingung, Berechnung, Regel, RegelSet, OrderBuilder-Aktion (PH-11)
2. Ordertypen `market`, `close`, `buy_stop`, `sell_stop`, `buy_limit`, `sell_limit`
3. Beide Prüffälle als Strategieobjekte in Tests aufgebaut und strukturell fehlerfrei

## Nicht Umfang

- Berechnung von Indikatorwerten oder Ausführung
- Dokumentdateien der Prüffälle (AP9)

## Abhängigkeiten

- setzt voraus: AP2

## Grundlagen

- [Pflichtenheft Schritt 1](../pflichtenheft-strategiedesigner.md)
- [Entwicklungsplan](../entwicklungsplan-strategiedesigner.md)
- [Fachmodell](../../domain/fachmodell.md)
- [Anforderungen Strategiedesigner](../../requirements/anforderungen-strategiedesigner.md)
- [Entwicklungs-, Test- und Sicherheitsregeln](../../../technical/development-test-security-rules.md)
