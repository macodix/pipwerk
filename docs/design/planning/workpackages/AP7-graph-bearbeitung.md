# AP7 – Bearbeitung des Strategiegraphen

## Status

- id: `AP7`
- status: `draft`
- stand: 2026-10-10
- komponenten: `components/pipwerk-studio` (Oberfläche)
- pflichtenheft: PH-02, PH-05, PH-10

## Ziel

Bausteine lassen sich aus der Bibliothek auf die Fläche ziehen, verbinden, verschieben und löschen; das Strategiedokument wird aus der Fläche abgeleitet und gespeichert.

## Umfang

1. Bausteinbibliothek aus `/api/v1/node-types`, nach Kategorien, mit Suche
2. Knotendarstellung je Kategorie mit Ablauf- und Ausgabeanschlüssen
3. Verbinden über Anschlüsse `next`, `true`, `false`, Ausgaben → Eingaben
4. Ableitung des Strategiedokuments aus dem React-Flow-Zustand und zurück (PH-10)
5. Deutsch und Englisch, Vitest und Playwright

## Nicht Umfang

- Parameter bearbeiten (AP8)

## Abhängigkeiten

- setzt voraus: AP6

## Grundlagen

- [Pflichtenheft Schritt 1](../pflichtenheft-strategiedesigner.md)
- [Entwicklungsplan](../entwicklungsplan-strategiedesigner.md)
- [Fachmodell](../../domain/fachmodell.md)
- [Anforderungen Strategiedesigner](../../requirements/anforderungen-strategiedesigner.md)
- [Entwicklungs-, Test- und Sicherheitsregeln](../../../technical/development-test-security-rules.md)
