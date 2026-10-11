# AP7 – Bearbeitung auf der Zeichenfläche

## Status

- id: `AP7`
- status: `draft`
- stand: 2026-10-11
- komponenten: `components/pipwerk-studio` (Oberfläche)
- pflichtenheft: PH-02, PH-05, PH-10

## Ziel

Bausteine lassen sich aus der Bausteinbibliothek auf die Zeichenfläche ziehen, verbinden, verschieben und löschen. Eigenständige Objekte werden per Verweis eingefügt. Das Strategiedokument wird aus der Zeichenfläche abgeleitet und gespeichert.

## Umfang

1. Bausteinbibliothek mit zwei Ebenen: Bausteintypen aus `/api/v1/node-types` und vorhandene eigenständige Objekte, nach Kategorien, mit Suche
2. Darstellung der Bausteine je Kategorie mit Ablauf- und Ausgabeanschlüssen
3. Verbinden über Anschlüsse `next`, `true`, `false` sowie Ausgabe → Eingabe
4. Ableitung des Strategiedokuments aus der Zeichenfläche und zurück (PH-10)
5. Deutsch und Englisch, Vitest und Playwright

## Nicht Umfang

- Parameter bearbeiten (AP8)

## Abhängigkeiten

- setzt voraus: AP6

## Grundlagen

- [Pflichtenheft Schritt 1](../pflichtenheft-strategiedesigner.md)
- [Glossar](../../../technical/glossar.md)
- [Entwicklungsplan](../entwicklungsplan-strategiedesigner.md)
- [Fachmodell](../../domain/fachmodell.md)
- [Anforderungen Strategiedesigner](../../requirements/anforderungen-strategiedesigner.md)
- [Entwicklungs-, Test- und Sicherheitsregeln](../../../technical/development-test-security-rules.md)
