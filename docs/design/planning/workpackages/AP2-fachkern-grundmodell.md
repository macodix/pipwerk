# AP2 – Fachkern-Grundmodell

## Status

- id: `AP2`
- status: `draft`
- stand: 2026-10-10
- komponenten: `packages/domain-core`
- pflichtenheft: PH-01, PH-02, PH-03, PH-04, PH-05, PH-06

## Ziel

Das Python-Paket `pipwerk_domain` mit Typbeschreibung, Bausteinregister, Datentypen, Strategieobjekt und struktureller Prüfung steht und ist per pytest geprüft.

## Umfang

1. Paket `packages/domain-core` einrichten (uv, Ruff, mypy, pytest)
2. Typbeschreibung und Datentypen (PH-02, PH-04)
3. Bausteinregister mit Einstiegspunkt (PH-03)
4. Strategieobjekt mit Knoten, Kanten, Parameterbindungen (PH-05)
5. Ausdrucks-Parser mit Typprüfung, ohne Auswertung (PH-11)
6. Strukturelle Prüfung mit Befundliste (PH-06)
7. Zwei Platzhalter-Bausteintypen für Tests

## Nicht Umfang

- konkrete Bausteine der Teststrategien (AP4)
- Serialisierung (AP3)
- Ausführung von Strategien

## Abhängigkeiten

- setzt voraus: AP1

## Grundlagen

- [Pflichtenheft Schritt 1](../pflichtenheft-strategiedesigner.md)
- [Entwicklungsplan](../entwicklungsplan-strategiedesigner.md)
- [Fachmodell](../../domain/fachmodell.md)
- [Anforderungen Strategiedesigner](../../requirements/anforderungen-strategiedesigner.md)
- [Entwicklungs-, Test- und Sicherheitsregeln](../../../technical/development-test-security-rules.md)
