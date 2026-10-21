# Projektziel pipwerk

## Status

- status: `accepted`
- stand: 2026-10-12
- abgestimmt: [Präsentation Projektziel](praesentation-projektziel.html), bestätigt vom Auftraggeber im Chat am 12. Oktober 2026

Dieses Dokument ist das oberste Dokument des Auftraggebers. Jede Anforderung an pipwerk muss sich auf den hier beschriebenen Zweck zurückführen lassen.

## Zweck

pipwerk ist ein grafisches, benutzerfreundliches System zum automatisierten Handel von Finanzinstrumenten. Es erlaubt:

- die grafische Gestaltung und Prüfung von Handelsstrategien,
- das Backtesting dieser Strategien mit grafischer Auswertung,
- die automatisierte oder teilautomatisierte Anwendung dieser Strategien auf bestehende Handelskonten bei Brokern,
- die grafische Auswertung der gehandelten Strategien.

Finanzinstrumente sind Aktien, ETFs, Devisen, Futures, CFDs, Optionen und vergleichbare handelbare Werte.

## Zielgruppe

pipwerk kann grundsätzlich jeder Händler benutzen, der es möchte. Maßstab für Entscheidungen sind zunächst die Bedürfnisse des Auftraggebers.

## Ziel

Das Ziel ist eine Software, die den beschriebenen Zweck erfüllt.

## Erfolgskriterien

Das Ziel ist erreicht, wenn:

1. Beliebige Handelsstrategien lassen sich im Designer grafisch bauen und prüfen, ohne Programmcode zu schreiben. Neue fachliche Bausteine können ergänzt werden, ohne pipwerk zu ändern.
2. Jede so gebaute Strategie lässt sich ohne weitere Bearbeitung automatisiert gegen historische Kursdaten testen. Das Ergebnis wird grafisch ausgewertet.
3. Jede so gebaute Strategie lässt sich ohne weitere Bearbeitung automatisiert oder teilautomatisiert auf einem Handelskonto bei einem Broker handeln.
4. Die gehandelten Strategien lassen sich grafisch auswerten.

Einzelne Strategien, etwa der Punkt-2-Ausbruch oder die EMA-Trendfolge, sind Testfälle für den jeweiligen Entwicklungsstand und nicht Bestandteil des Ziels.

## Abgrenzung

pipwerk ist eine reine Handelssoftware und bleibt es. Das Neue an pipwerk ist der Strategiedesigner.

pipwerk ist nicht:

- ein Anbieter von Kursdaten,
- eine Depot- oder Steuerverwaltung,
- eine Anlageberatung,
- ein Broker.

## Aufbau

pipwerk ist, soweit technisch sinnvoll machbar, aus Modulen aufgebaut. Jedes Modul ist eigenständig lauffähig. Das dient der Stabilität und erlaubt, die Module auf verschiedenen Rechnern zu betreiben.

| Modul | Name | Aufgabe |
|---|---|---|
| Strategiedesigner | pipwerk Studio | Strategien gestalten und prüfen |
| Strategietester | pipwerk replay | Strategien gegen historische Kursdaten testen, Ergebnis grafisch auswerten |
| Handelssystem | pipwerk trader | Strategien auf Handelskonten anwenden, gehandelte Strategien grafisch auswerten |
| Kontoverwaltung | pipwerk vault | Handelskonten mit Broker, Instrumenten und deren Eigenschaften, Kontostand, Positionen und Orders. Liefert diese Informationen an alle Module. |
| Verbindungsmodul | pipwerk bridge | Je Handelsplattform oder Datenquelle ein Modul, zunächst pipwerk bridge mt5 für MetaTrader 5. Übersetzt zwischen pipwerk und der jeweiligen Schnittstelle: Orders, Kontodaten, laufende und historische Kursdaten. |
| Nachrichtensystem | pipwerk relay | Technischer Austausch zwischen den Modulen |

Was nicht entschieden ist, bleibt als Möglichkeit offen und wird durch den Aufbau nicht verhindert. Das gilt insbesondere für historische Kursdaten aus anderen Quellen als dem Broker.

## Schreibweise

Der Name des Systems wird klein geschrieben: pipwerk.

## Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-12 | Erstanlage aus der Abstimmung mit dem Auftraggeber. Abgrenzung, Aufbau und Module ergänzt. |
| 2026-10-13 | Schreibweise „pipwerk Studio“ (Auftraggeber im Chat). |
| 2026-10-14 | Begriff „Testfall“ statt „Prüffall“ (Auftraggeber im Chat). |
| 2026-10-21 | Produktname des Strategietesters pipwerk replay statt pipwerk backtest. Entscheidung des Auftraggebers im Chat am 2026-10-21. |
