# AP2 – Grundmodell der gemeinsamen Python-Bibliothek

## Status

- id: `AP2`
- status: `draft`
- stand: 2026-10-11
- komponenten: `packages/domain-core`
- pflichtenheft: PH-01, PH-02, PH-03, PH-04, PH-05, PH-06

## Ziel

Die gemeinsame Python-Bibliothek `pipwerk_domain` mit Typbeschreibung, Bausteinregister, Datentypen, Bindungsarten, Strategie und ihren Objekten, Ausdrucks-Parser und Prüfung steht und ist mit pytest geprüft.

## Umfang

1. Paket `packages/domain-core` einrichten (uv, Ruff, mypy, pytest)
2. Typbeschreibung, Datentypen, Bindungsarten (PH-02, PH-04)
3. Bausteinregister mit Einstiegspunkt (PH-03)
4. Strategie mit Auslöser, Bausteinen, Verbindungen und Verweisen auf eigenständige Objekte (PH-05)
5. Ausdrucks-Parser mit Typprüfung, ohne Auswertung (PH-11)
6. Prüfung mit Befunden (PH-06)
7. Zwei Platzhalter-Bausteintypen für die Tests

## Nicht Umfang

- konkrete Bausteintypen der Prüffälle (AP4)
- JSON-Dokumente und Schemata (AP3)
- Ausführung von Strategien

## Abhängigkeiten

- setzt voraus: AP1

## Grundlagen

- [Pflichtenheft Schritt 1](../pflichtenheft-strategiedesigner.md)
- [Glossar](../../../technical/glossar.md)
- [Entwicklungsplan](../entwicklungsplan-strategiedesigner.md)
- [Fachmodell](../../domain/fachmodell.md)
- [Anforderungen Strategiedesigner](../../requirements/anforderungen-strategiedesigner.md)
- [Entwicklungs-, Test- und Sicherheitsregeln](../../../technical/development-test-security-rules.md)
