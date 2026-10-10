# AP5 – Web-API und Ablage in Pipwerk Studio

## Status

- id: `AP5`
- status: `draft`
- stand: 2026-10-10
- komponenten: `components/pipwerk-studio` (Backend), `contracts/api`
- pflichtenheft: PH-08, PH-09

## Ziel

Pipwerk Studio bietet die Web-API `/api/v1/` für Bausteintypen und Strategien; Strategien liegen als Dateien im konfigurierten Verzeichnis, der Index in der Datenbank.

## Umfang

1. INI-Eintrag `[strategies] directory` (PH-08)
2. Tabelle `strategy_index`, Einführung von Alembic (PH-08)
3. Dateiablage, Index, Abgleich Dateien → Index
4. Endpunkte nach PH-09 einschließlich Prüfen, Import, Export
5. OpenAPI-Beschreibung unter `contracts/api/pipwerk-studio/v1/openapi.json`
6. Technische Dokumentation (`docs/technical/pipwerk-studio.md`)

## Nicht Umfang

- Oberfläche
- Authentifizierung und Berechtigungen

## Abhängigkeiten

- setzt voraus: AP3, AP4

## Grundlagen

- [Pflichtenheft Schritt 1](../pflichtenheft-strategiedesigner.md)
- [Entwicklungsplan](../entwicklungsplan-strategiedesigner.md)
- [Fachmodell](../../domain/fachmodell.md)
- [Anforderungen Strategiedesigner](../../requirements/anforderungen-strategiedesigner.md)
- [Entwicklungs-, Test- und Sicherheitsregeln](../../../technical/development-test-security-rules.md)
