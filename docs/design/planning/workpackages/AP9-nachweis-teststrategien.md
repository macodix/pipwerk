# AP9 – Nachweis mit den Teststrategien

## Status

- id: `AP9`
- status: `draft`
- stand: 2026-10-10
- komponenten: `components/pipwerk-studio`, `contracts/strategies`
- pflichtenheft: PH-12

## Ziel

Beide Prüffälle sind als Strategiedokumente abgelegt und werden in der Oberfläche aus der leeren Fläche aufgebaut, gespeichert, neu geladen und mit dem abgelegten Dokument verglichen.

## Umfang

1. Strategiedokumente `str-03` und `str-01` unter `contracts/strategies/v1/examples/`
2. pytest: Schema-Gültigkeit, strukturelle Fehlerfreiheit, verlustfreie Hin- und Rückwandlung
3. Playwright: Aufbau, Speichern, Neuladen, Export, Vergleich je Prüffall (PH-12)
4. Anwenderdokumentation `docs/user/pipwerk-studio.md` für Schritt 1

## Nicht Umfang

- weitere Strategien
- Ausführung

## Abhängigkeiten

- setzt voraus: AP8

## Grundlagen

- [Pflichtenheft Schritt 1](../pflichtenheft-strategiedesigner.md)
- [Entwicklungsplan](../entwicklungsplan-strategiedesigner.md)
- [Fachmodell](../../domain/fachmodell.md)
- [Anforderungen Strategiedesigner](../../requirements/anforderungen-strategiedesigner.md)
- [Entwicklungs-, Test- und Sicherheitsregeln](../../../technical/development-test-security-rules.md)
