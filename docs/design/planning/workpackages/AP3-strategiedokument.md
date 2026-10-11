# AP3 – Dokumente und Schemata

## Status

- id: `AP3`
- status: `draft`
- stand: 2026-10-11
- komponenten: `packages/domain-core`, `contracts/strategies`
- pflichtenheft: PH-01, PH-07

## Ziel

Strategien, Indikatoren, Trends, Regeln und RegelSets werden als JSON-Dokumente geschrieben und gelesen. Schreiben und Lesen ergeben dasselbe Objekt. Die Schemata liegen versioniert unter `contracts/strategies/v1/`.

## Umfang

1. Pydantic-Modelle an der Schnittstelle je Objekttyp
2. Abbildung Objekt ↔ JSON-Dokument je Objekttyp, mit pytest geprüft
3. Schemata erzeugen und unter `contracts/strategies/v1/` ablegen, Strategieschema aus den Schemata der enthaltenen Objekttypen zusammengesetzt
4. Prüfung beim Laden gegen Schema und Formatversion
5. Technische Dokumentation der Dokumente und Schemata unter `docs/technical/`

## Nicht Umfang

- Ablage in Dateien und Index (AP5)
- Oberfläche

## Abhängigkeiten

- setzt voraus: AP2

## Grundlagen

- [Pflichtenheft Schritt 1](../pflichtenheft-strategiedesigner.md)
- [Glossar](../../../technical/glossar.md)
- [Entwicklungsplan](../entwicklungsplan-strategiedesigner.md)
- [Fachmodell](../../domain/fachmodell.md)
- [Anforderungen Strategiedesigner](../../requirements/anforderungen-strategiedesigner.md)
- [Entwicklungs-, Test- und Sicherheitsregeln](../../../technical/development-test-security-rules.md)
