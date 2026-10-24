# Übersicht europäischer Broker mit Handels-API

Stand: 2026-10-24
Status: Recherche, keine Festlegung
Zweck: Grundlage für spätere Entscheidung über Broker-Anbindungen des Pipwerk-Trader

## Geltungsbereich

Berücksichtigt werden Broker mit Sitz oder regulierter Niederlassung in der EU, die eine dokumentierte, programmatisch nutzbare Schnittstelle für Orderaufgabe, Positionsabfrage und Marktdatenbezug anbieten. Reine Depotbanken ohne Handels-API sind nicht enthalten.

## Übersichtstabelle

| Broker | Sitz / Regulierung | API-Typ | Preismodell (Aktien/ETF) | Kleinste Handelseinheit |
|---|---|---|---|---|
| Interactive Brokers (IBKR) | USA, EU-Tochter Irland (CBI), BaFin-Niederlassung | TWS API, Web API (REST), FIX, Excel | EU-Aktien: ab 0,05 %, mindestens 1,25 €; US-Aktien: 0,0035 USD je Stück; Tiered- oder Fixed-Modell | Bruchstücke bei vielen US- und EU-Aktien, ab ca. 1 EUR Nominal |
| CapTrader (IBKR-Reseller, Deutschland) | Deutschland, BaFin | Über IBKR-API (TWS, Web, FIX) | EU-Aktien: 2 € je Order bis 500 Stück, darüber gestaffelt; US-Aktien: 2 Cent je Stück, mindestens 2 USD | Bruchstücke verfügbar, laut Anbieter nicht über API/FIX nutzbar |
| LYNX (IBKR-Reseller, NL/DE) | Niederlande, AFM | Über IBKR-API (TWS, FIX) | Xetra: 5,80 € + 0,14 %; US: ab 5 USD | Ganze Stücke; Bruchstücke laut Anbieter nicht über API |
| Saxo Bank | Dänemark, BaFin-Niederlassung | OpenAPI (REST + Streaming), FIX | Aktien gestaffelt nach Kontoklasse (Classic/Platinum/VIP), z. B. DE: 0,08 %, mindestens 3 € | Aktien: ganze Stücke; Bruchstücke nur bei Krypto-FX-Paaren und CFD-Indizes |
| Pepperstone | UK/Australien, BaFin-Lizenz Deutschland | cTrader Open API, MT4/MT5-API, FIX | CFD/Forex: spreadbasiert (Razor: ab 0,0 Pips + 7 USD je Lot Round-Turn) | Forex: 0,01 Lot (1.000 Einheiten Basiswährung) |
| GBE Brokers | Zypern, Niederlassung Hamburg | MT4/MT5-API, FIX | Forex/CFD: Spread + Kommission (Pro-Konto: 5 USD je Lot und Seite) | Forex: 0,01 Lot |
| XTB | Polen, BaFin-Lizenz | xAPI (proprietär, SDK für Python und Java) | Aktien/ETF: 0 % bis 100.000 € Monatsumsatz; darüber 0,2 %, mindestens 10 € | Aktien: Bruchstücke ab 10 € Nominal |

### Broker ohne öffentliche Handels-API

DEGIRO, Trade Republic, Scalable Capital, Comdirect, ING, Consorsbank. Für die Pipwerk-Trader-Anbindung aktuell nicht nutzbar.

## Eignung für kleines Kapital bis 1.000 EUR

Für Konten unter 1.000 EUR entscheidet die Mindestgebühr je Order und die Granularität der Positionsgröße darüber, ob ein Broker nutzbar ist.

| Broker | Eignung bei Kapital < 1.000 EUR |
|---|---|
| IBKR direkt | Geeignet. Keine Mindesteinlage, Bruchstücke über API, niedrige Stückkosten. |
| CapTrader | Eingeschränkt. Mindestgebühr 2 € je Order ist bei kleinen Tickets eine hohe relative Belastung. Bruchstücke ohnehin nicht über API. |
| LYNX | Nicht geeignet. Mindestgebühr 5,80 € zehrt kleine Positionen auf. |
| Saxo | Eingeschränkt. Mindestgebühr 3 €; Bruchstückhandel bei Aktien nicht verfügbar. |
| Pepperstone | Geeignet für CFD/Forex. Micro-Lots ab 0,01, keine Mindestgebühr, nur Spread und Kommission je Lot. |
| GBE Brokers | Geeignet für CFD/Forex. Micro-Lots ab 0,01. |
| XTB | Geeignet. Bruchstücke ab 10 € Nominal, keine Ordergebühr unterhalb der Umsatzschwelle. |

## Hinweise zur API-Technik

- IBKR-Infrastruktur ist faktischer Standard in Europa. CapTrader und LYNX nutzen dieselbe API-Basis mit eigener Preisstaffel und deutschem Service.
- Die cTrader Open API (Pepperstone u. a.) verwendet Protocol Buffers über TLS mit persistenter Streaming-Verbindung; offiziell unterstützte SDKs für Python, C#, Java.
- MT4/MT5-APIs sind an die MetaTrader-Terminals gebunden und werden über Expert Advisors in MQL betrieben. Für serverseitige Automatisierung außerhalb des Terminals weniger geeignet als native REST- oder Protobuf-APIs.
- Alle genannten Broker bieten Demo-/Paper-Trading-Konten mit identischem API-Zugang. Für Backtest und Forward-Test ohne Echtgeld nutzbar.
- Regulatorische Beschränkungen (ESMA) für Privatkunden: maximaler Hebel 1:30 für Major-Forex, 1:20 für Minor-Forex, Gold und Hauptindizes, 1:5 für Aktien-CFDs. Negative-Balance-Protection ist Pflicht.

## Offene Fragen

- Welche Produktklassen soll der Pipwerk-Trader anbinden (Aktien, CFD, Forex, Futures, Optionen)? Die Produktauswahl schränkt die Broker-Auswahl ein.
- Welche Anforderungen bestehen an Latenz, Durchsatz und Ausführungsqualität? Davon hängt die Wahl zwischen REST/Protobuf und FIX ab.
- Welche Anforderungen bestehen an die Dauer der Marktdaten-Historie und an Live-Streaming-Umfang?
- Sollen mehrere Broker parallel anbindbar sein oder genügt einer? Bei mehreren Brokern wird eine Broker-Abstraktionsschicht nötig.
- Soll die Demo-/Paper-Trading-Umgebung des Brokers Teststand für Pipwerk sein oder wird eine eigene Simulationsschicht gebaut?

## Quellen

Angaben stammen von den Anbieter-Webseiten und aktuellen Vergleichsportalen (Stand 2026-10). Konditionen und API-Umfang ändern sich häufig; vor einer Festlegung sind die Angaben direkt beim jeweiligen Anbieter zu verifizieren.
