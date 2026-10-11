# AP9 – Nachweis für Schritt 1

## Status

- id: `AP9`
- status: `draft`
- stand: 2026-10-11
- komponenten: `components/pipwerk-studio`, `contracts/strategies`
- pflichtenheft: PH-12

## Ziel

Beide Prüffälle liegen als Dokumentdateien im Repository, bestehen die automatischen Tests der gemeinsamen Python-Bibliothek und werden im Browsertest aus der leeren Zeichenfläche aufgebaut, gespeichert, neu geladen, exportiert und mit den Dateien verglichen.

## Umfang

1. Dokumentdateien der Prüffälle `str-03` und `str-01` mit ihren eigenständigen Objekten unter `contracts/strategies/v1/testcases/`
2. pytest: Schema-Gültigkeit, fehlerfreie Prüfung, Schreiben und Lesen ergeben dasselbe Objekt
3. Playwright: Aufbau, Speichern, Neuladen, Export, Vergleich je Prüffall (PH-12)
4. Anwenderdokumentation `docs/user/pipwerk-studio.md` für Schritt 1

## Nicht Umfang

- weitere Strategien
- Ausführung

## Abhängigkeiten

- setzt voraus: AP8

## Grundlagen

- [Pflichtenheft Schritt 1](../pflichtenheft-strategiedesigner.md)
- [Glossar](../../../technical/glossar.md)
- [Entwicklungsplan](../entwicklungsplan-strategiedesigner.md)
- [Fachmodell](../../domain/fachmodell.md)
- [Anforderungen Strategiedesigner](../../requirements/anforderungen-strategiedesigner.md)
- [Entwicklungs-, Test- und Sicherheitsregeln](../../../technical/development-test-security-rules.md)
