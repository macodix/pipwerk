# AP3 – Strategiedokument und Vertrag

## Status

- id: `AP3`
- status: `draft`
- stand: 2026-10-10
- komponenten: `packages/domain-core`, `contracts/strategies`
- pflichtenheft: PH-01, PH-07

## Ziel

Strategien lassen sich verlustfrei in das JSON-Dokument und zurück wandeln; das JSON-Schema liegt versioniert unter `contracts/strategies/v1/`.

## Umfang

1. Pydantic-Grenzmodelle für das Dokument
2. Abbildung Fachkernobjekt ↔ Dokument in beide Richtungen
3. Schema-Erzeugung und Ablage unter `contracts/strategies/v1/strategy.schema.json`
4. Prüfung beim Laden gegen Schema und Formatversion
5. Technische Dokumentation des Vertrags unter `docs/technical/`

## Nicht Umfang

- Ablage in Dateien und Index (AP5)
- Oberfläche

## Abhängigkeiten

- setzt voraus: AP2

## Grundlagen

- [Pflichtenheft Schritt 1](../pflichtenheft-strategiedesigner.md)
- [Entwicklungsplan](../entwicklungsplan-strategiedesigner.md)
- [Fachmodell](../../domain/fachmodell.md)
- [Anforderungen Strategiedesigner](../../requirements/anforderungen-strategiedesigner.md)
- [Entwicklungs-, Test- und Sicherheitsregeln](../../../technical/development-test-security-rules.md)
