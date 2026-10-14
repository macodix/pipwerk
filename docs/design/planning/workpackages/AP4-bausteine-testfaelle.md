# AP4 – Bausteintypen der Testfälle

## Status

- id: `AP4`
- status: `accepted`
- stand: 2026-10-14
- komponenten: `packages/domain-core`
- pflichtenheft: PH-04, PH-11

## Ziel

Alle in PH-11 genannten Bausteintypen sind in der gemeinsamen Python-Bibliothek angemeldet, beschreiben sich vollständig in Deutsch und Englisch, die Indikatoren berechnen ihre Werte, und beide Testfälle bestehen die Prüfung.

## Umfang

1. Auslöser, Indikatoren mit Berechnung (EMA, ATR, ZigZag), Trendverfahren (EMA-Kreuzung, Markttechnik), Bedingung, Berechnung, Regel, RegelSet, Order-Aktion (PH-11)
2. Ordertypen von Pipwerk nach req-fach-030 des Fachmodells (`MarketOrder`, `StopOrder`, `LimitOrder`, `StopLimitOrder`, `CloseOrder`), angemeldet über den Einstiegspunkt
3. Beide Testfälle als Objekte in Tests aufgebaut und fehlerfrei geprüft

## Nicht Umfang

- Anbindung an Kursdaten und Auswertung des Ablaufs
- Dokumentdateien der Testfälle (AP9)

## Abhängigkeiten

- setzt voraus: AP2

## Grundlagen

- [Pflichtenheft Schritt 1](../pflichtenheft-strategiedesigner.md)
- [Glossar](../../../technical/glossar.md)
- [Entwicklungsplan](../entwicklungsplan-strategiedesigner.md)
- [Fachmodell](../../domain/fachmodell.md)
- [Anforderungen Strategiedesigner](../../requirements/anforderungen-strategiedesigner.md)
- [Entwicklungs-, Test- und Sicherheitsregeln](../../../technical/development-test-security-rules.md)
