# [Name der Strategie] – technische Spezifikation

## Status und Grundlage

- strategie-id: `[str-xx]`
- status: `draft`
- fachliche Grundlage: `[Dateiname und bestätigte Version]`
- zuletzt geprüft: `[JJJJ-MM-TT]`

Diese Spezifikation wird erst erstellt, wenn die fachliche Strategiebeschreibung bestätigt ist. Sie ersetzt weder die Originalbeschreibung noch die fachliche Fassung.

## Ausführungsrahmen

### Markt- und Zeitbezug

[Instrumente, Datenquelle, Zeitzone, Zeiteinheiten, Session und Kalender.]

### Auswertungszeitpunkte

[Tick, neue Kerze, Kerzenschluss, Timer, Brokerereignis oder manuelle Freigabe.]

### Ausführungsmodell

[Orderarten, Fill-Modell, Teil-Fills, Slippage, Spread, Gebühren und Fehlerbehandlung.]

## Zustände

Für jeden Zustand werden Bedeutung, Eintritt und erlaubte Übergänge beschrieben.

### `[zustand-id]` – [Bezeichnung]

- Bedeutung: [Beschreibung]
- Eintritt durch: [Ereignis und Bedingungen]
- ausgeführte Aktionen: [Aktionen]
- möglicher Austritt: [Übergänge]

## Regeln im Ausführungsablauf

Die Regeln stehen in zeitlicher Reihenfolge. Jede Regel besitzt genau einen Auslöser und ein eindeutiges Ergebnis.

### `[regel-id]` – [Tätigkeit]

- Zustand: `[zustand-id]`
- Auslöser: [Ereignis]
- Voraussetzungen: [Bedingungen]
- Eingaben: [Daten]
- Aktion: [Berechnung, Prüfung oder Orderaktion]
- Ergebnis: [Daten, Ereignis oder neuer Zustand]
- Fehler-/Alternativpfad: [Reaktion]

## Berechnungen

### `[berechnung-id]` – [Ergebnis]

- Eingaben: [Werte einschließlich Einheit]
- Formel/Algorithmus: [eindeutige Regel]
- Rundung: [Regel]
- Gültigkeitsbereich: [Bedingungen]
- Ergebnisdatentyp: [Typ und Einheit]

## Parameter

| Parameter-ID | Bedeutung | Typ/Einheit | Standardwert | Grenzen | Änderbar während der Ausführung |
|---|---|---|---|---|---|
| `[par-xx]` | [Bedeutung] | [Typ] | [Wert] | [Grenzen] | [ja/nein] |

## Daten und gespeicherte Werte

| Daten-ID | Bedeutung | Herkunft | Zeitbezug | vorläufig/bestätigt | Lebensdauer |
|---|---|---|---|---|---|
| `[data-xx]` | [Bedeutung] | [Quelle] | [Tick/Kerze/Session] | [Status] | [Dauer] |

## Order- und Risikoregeln

[Zusammenhängende Beschreibung der Erzeugung, Prüfung, Änderung und Stornierung von Orders sowie der Verwaltung aktiver Positionen.]

## Fehler- und Ausnahmebehandlung

[Nur technisch oder fachlich notwendige Ausnahmefälle: fehlende Daten, Brokerablehnung, Teil-Fill, Verbindungsunterbrechung, ungültige Parameter oder widersprüchlicher Zustand.]

## Abbildung im Strategiedesigner

### Hauptansicht

[Welche fachlichen Schritte bleiben sichtbar?]

### Untergraphen

[Welche Details werden eingeklappt?]

### Benötigte Knotentypen

| Knoten-ID | Aufgabe | Eingänge | Ausgänge | zugehörige Regel |
|---|---|---|---|---|
| `[node-xx]` | [Aufgabe] | [Ports] | [Ports] | `[regel-id]` |

### Benötigte Verbindungstypen

[Daten-, Ereignis-, Zustands- und Orderverbindungen mit Datentypen.]

## Prüffälle

### `[test-id]` – [Bezeichnung]

- Ausgangszustand: [Zustand und Daten]
- Ereignis: [Auslöser]
- erwartetes Verhalten: [Aktionen und Folgezustand]

## Offene technische Entscheidungen

1. [Entscheidung]

## Freigabe

- gegen fachliche Beschreibung geprüft: `[ja/nein]`
- technisch geprüft durch: `[Name]`
- Ergebnis: `[offen/bestätigt]`
- Datum: `[JJJJ-MM-TT]`
