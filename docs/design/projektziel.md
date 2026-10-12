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

Einzelne Strategien, etwa der Punkt-2-Ausbruch oder die EMA-Trendfolge, sind Prüffälle für den jeweiligen Entwicklungsstand und nicht Bestandteil des Ziels.

## Abgrenzung

pipwerk ist eine reine Handelssoftware und bleibt es. Das Neue an pipwerk ist der Strategiedesigner.

pipwerk ist nicht:

- ein Anbieter von Kursdaten,
- eine Depot- oder Steuerverwaltung,
- eine Anlageberatung,
- ein Broker.

## Aufbau

pipwerk ist, soweit technisch sinnvoll machbar, aus Modulen aufgebaut. Jedes Modul ist eigenständig lauffähig. Das dient der Stabilität und erlaubt, die Module auf verschiedenen Rechnern zu betreiben.

## Schreibweise

Der Name des Systems wird klein geschrieben: pipwerk.

## Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-12 | Erstanlage aus der Abstimmung mit dem Auftraggeber. Abgrenzung und Aufbau ergänzt. |
