# AP5 – Web-API und Ablage in Pipwerk Studio

## Status

- id: `AP5`
- status: `accepted`
- stand: 2026-10-12
- komponenten: `components/pipwerk-studio` (Backend), `contracts/api`
- pflichtenheft: PH-08, PH-09

## Ziel

Pipwerk Studio bietet die Web-API `/api/v1/` für Bausteintypen, Strategien, Indikatoren, Trends, Regeln und RegelSets. Die Objekte liegen als Dateien im Objektverzeichnis, die Indizes in der Datenbank.

## Umfang

1. Einstellung Objektverzeichnis in `studio_settings` mit Anfangswerten nach PH-08, lesen und ändern ohne Neustart über interne Endpunkte unter `/api/studio/settings/` wie bei der Sprache
2. Indextabellen je Objektart und `object_reference` mit Fremdschlüsseln, Einführung von Alembic (PH-08)
3. Dateiablage, Indizes, Abgleich Dateien → Index
4. Endpunkte nach PH-09 einschließlich Prüfen und Löschschutz für verwendete Objekte (PH-08)
5. OpenAPI-Beschreibung unter `contracts/api/pipwerk-studio/v1/openapi.json`
6. Technische Dokumentation (`docs/technical/pipwerk-studio.md`)

## Nicht Umfang

- Oberfläche
- Authentifizierung und Berechtigungen

## Abhängigkeiten

- setzt voraus: AP3, AP4

## Grundlagen

- [Pflichtenheft Schritt 1](../pflichtenheft-strategiedesigner.md)
- [Glossar](../../../technical/glossar.md)
- [Entwicklungsplan](../entwicklungsplan-strategiedesigner.md)
- [Fachmodell](../../domain/fachmodell.md)
- [Anforderungen Strategiedesigner](../../requirements/anforderungen-strategiedesigner.md)
- [Entwicklungs-, Test- und Sicherheitsregeln](../../../technical/development-test-security-rules.md)
