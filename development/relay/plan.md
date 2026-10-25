# Arbeitspaketplan Vorhaben relay

## Status

- status: `draft`
- stand: 2026-10-25
- komponenten: `packages/relay-core` (neu), `components/pipwerk-relay` (neu), `components/pipwerk-probe` (neu), `components/pipwerk-fetch-mt5`, `contracts/messages/`, `contracts/api/pipwerk-relay/`
- grundlage: [specification.md](specification.md), überarbeitet nach dem [Abnahmebericht wp01](wp01/acceptance/1.md) (Mängel M1 bis M7)
- stand der arbeit: Überarbeitung nach der nicht bestandenen Abnahme von `wp01` (Änderungsnachweis). Frühere Fassung: [Präsentation](presentations/plan-2.html) bestätigt vom Auftraggeber im Chat am 24. Oktober 2026.

## Übersicht

| Paket | Titel | hängt ab von | Stand |
|---|---|---|---|
| `wp01` | pipwerk relay über Verzeichnisse | – (Arbeitszweig auf dem Stand von `backtest/wp02`, Übernahme danach) | `open` |
| `wp02` | Verzeichnis-Weg über SFTP | `wp01` | `open` |
| `wp03` | Übertragungsweg Matrix | `wp01` | `open` |
| `wp04` | Dateien über einen Weg für Dateien | `wp02`, `wp03` | `open` |
| `wp05` | Web-API des Relays | `wp01` | `open` |
| `wp06` | Abruf über pipwerk relay | `wp01`, `backtest/wp02` | `open` |
| `wp07` | Abruf über Matrix | `wp04`, `wp06` | `open` |

Die Pakete folgen den Durchgängen des Nachweises (Spezifikation Abschnitt 8). `wp01` bis `wp05` liefern pipwerk relay und werden ohne MetaTrader 5 und ohne `pipwerk-fetch-mt5` abgenommen, mit den Prüfprogrammen (Mangel M6). `wp01` bringt Installation, Einrichtung nach dem Bedienablauf (Spezifikation 4.6) und die Grundmechanik mit dem einfachsten Übertragungsweg, Verzeichnissen im Dateisystem, zwischen den Rechnern über ein Netzlaufwerk: Durchgang 1 mit den Störungen. Jeder weitere Weg ist ein eigenes Paket: `wp02` SFTP (Durchgang 2), `wp03` Matrix (Durchgang 3), `wp04` die Wege für Dateien (Durchgang 4), `wp05` die Web-API mit dem Weg `http`. `wp06` schließt den Abruf an (Durchgang 5), `wp07` weist ihn über Matrix nach (Durchgang 6) und schließt damit den Nachweis laut `scope.md` ab. `wp02`, `wp03`, `wp05` und `wp06` brauchen nur `wp01` und laufen nebeneinander. Diese Pakete ändern zum Teil dieselben Dateien. Wer zuerst in `main` übernommen wird, entscheidet die Abnahme; vor der Übernahme eines weiteren führt der Entwicklungsleiter `origin/main` in dessen Arbeitszweig zusammen. Ändert das Code, prüfen Tester und QA erneut.

Vor `wp02`, `wp03`, `wp04` und `wp05` ergänzt der Softwarearchitekt den Bedienablauf (Spezifikation 4.6) um die Fragen des jeweiligen Wegs; das Paket beginnt nach der Bestätigung durch den Auftraggeber.

Abschnittsangaben beziehen sich auf die [Spezifikation](specification.md). Grenzwerte gegen Überlast, Pfade der Voreinstellungen, Ports der Testumgebung, Wortlaut der Ausgaben und die Einzelheiten der Tests legen die Aufträge fest.

## wp01 – pipwerk relay über Verzeichnisse

### Ziel

Der Auftraggeber installiert pipwerk relay auf zwei Rechnern aus je einer Datei, richtet es nach dem Bedienablauf ein und verbindet die Rechner über ein Netzlaufwerk, ohne eine Datei von Hand anzulegen und ohne einen Schlüssel zu kopieren. Die Grundmechanik ist funktional und robust: Adresse, Weitergabe über zwei Relays, Signatur, Warteschlange, Wiederholung, unzustellbare Nachricht und Empfangsbestätigung, nachgewiesen mit den Prüfprogrammen im ungestörten Durchgang und unter Störungen.

### Umfang

- Bibliothek `packages/relay-core`: Adresse, Nachricht, Umschlag mit Signatur und Schlüsselpaar (3.1 bis 3.3, E5), Schnittstelle „Weg“ mit Anmeldung über Einstiegspunkte und eigenen Angaben (3.4), Verzeichnis-Weg `files` über ein Verzeichnis im Dateisystem, auch ein Netzlaufwerk (3.4), Anlagen über den Übertragungsweg, Anschluss einer Komponente nur mit ihrem Namen (3.5) mit Erkennen von Wiederholungen (E4) und Empfangsbestätigung (3.7); Prüfskript.
- `components/pipwerk-relay` mit den Programmen `pipwerk-relay`, `pipwerk-relay-setup` und `pipwerk-relay-status` (E1): Weg einer Nachricht (4.1), angeschlossene Komponenten (4.2), Adressbuch mit Verbinden über den gemeinsamen Weg und Prüfcode, Standard-Relay (4.3), unzustellbare Nachricht (4.4), Konfiguration, Begrenzungen und Start bei der Anmeldung unter Windows und Linux (4.5), Bedienablauf der Einrichtung (4.6) ohne die Fragen der Wege anderer Pakete, Speicher mit Datenbank und Aktualisieren des Schemas beim Start (E6), deutsche Ausgaben (E9); Prüfskript und Testumgebungsskript.
- `components/pipwerk-probe` mit `pipwerk-probe-send` und `pipwerk-probe-receive` (E1, 8).
- Installationsdateien `pipwerk-relay-<Version>.zip` und `pipwerk-probe-<Version>.zip` mit Installationsskript für Windows und Linux, Skript zum Bau, Ablage als Anlage eines Releases auf GitHub (E8).
- Schemas unter `contracts/messages/v1/` (Abschnitt 5) ohne die Angaben zu Wegen für Dateien (`wp04`) und ohne die Nachrichtenarten des Abrufs (`wp06`).
- Sicherheit nach Abschnitt 7 für diese Teile, ohne SFTP, Matrix, Web-API und Wege für Dateien; Prüfung von `cryptography` nach Regel 12.
- Tests nach Abschnitt 8: Bibliothek mit dem Verzeichnis-Weg über ein lokales Verzeichnis, Empfangsbestätigung, Wege als Erweiterung mit einem Test-Weg, Relay, Einrichtung, Bau und Installation unter Linux, Prüfprogramme; Durchgang 1 und Störungen 1 bis 7 in der Testumgebung mit zwei Relays aus den Installationsdateien, gemeinsamem Verzeichnis und Prüfprogrammen.
- Dokumentation (Abschnitt 9) für diese Teile: `docs/technical/pipwerk-relay.md`, `contracts/messages/README.md`, README der Komponenten; `docs/user/pipwerk-relay.md` entlang des Bedienablaufs zu Installation, Einrichtung, Komponenten, zweitem Rechner, späteren Änderungen, Status, Prüfprogrammen, Meldungen und ihren Gründen, Empfangsbestätigung und Verhalten bei Störungen; Glossar: Anlage, Umschlag, Eingang, Warteschlange, Schlüsselpaar, Prüfcode, angeschlossene Komponente, Empfangsbestätigung, Prüfprogramm, Installationsdatei.

### Nicht-Umfang

- Verzeichnis-Weg über SFTP (`wp02`), Matrix-Weg (`wp03`), Wege für Dateien mit Feld `stored` (`wp04`), Web-API und Weg `http` (`wp05`)
- Abruf über pipwerk relay: `serve`, `request`, Nachrichtenarten `fetch.*`, Abschnitt `[relay]` von `pipwerk-fetch-mt5` (`wp06`)

### Umgesetzte Teile der Spezifikation

E1, E2 ohne Web-API, E4 bis E9 ohne Installationsdatei von `pipwerk-fetch-mt5`, 3.1 bis 3.3, 3.4 ohne Matrix und SFTP, 3.5, 3.7, 4.1 bis 4.6 ohne Wege für Dateien, Web-API und die Fragen anderer Wege, Abschnitt 5 ohne `openapi.json`, Wege für Dateien und Nachrichtenarten des Abrufs, Abschnitt 7 ohne SFTP, Matrix, Web-API und Wege für Dateien, Abschnitt 8 wie im Umfang, Abschnitt 9 wie im Umfang.

### Abhängigkeiten

Keine fachliche. Der Arbeitszweig `relay/wp01` besteht und wird überarbeitet. Er wurde vom von der QA geprüften Stand von `backtest/wp02` angelegt (Commit `d994dfaf02a49aa1ac0ea954c35e6ce64d8a0f2d`); in `main` übernommen wird er deshalb erst nach `backtest/wp02`. Was auf dem Arbeitszweig zum Abruf über pipwerk relay schon umgesetzt ist, gehört zu `wp06`; der Entwicklungsleiter nimmt es aus `wp01` heraus und führt es in `wp06` fort.

### Abnahmekriterien

Voraussetzung: zwei Rechner des Auftraggebers, darunter einer mit Windows, und ein Netzlaufwerk, das auf beiden eingebunden ist. MetaTrader 5 und `pipwerk-fetch-mt5` werden nicht gebraucht.

1. Installation: Der Auftraggeber installiert pipwerk relay und die Prüfprogramme auf beiden Rechnern nach der Anwenderdokumentation aus je einer heruntergeladenen Datei, ohne das Repository und ohne weitere Ordner. Danach sind die Programme in einem neuen Fenster unter ihrem Namen aufrufbar.
2. Einrichtung: Er richtet beide Relays mit `pipwerk-relay-setup` ein und verbindet sie über das Netzlaufwerk mit Vergleich des Prüfcodes. Er legt dabei keine Datei von Hand an, öffnet keine Konfigurationsdatei, führt keinen Befehl ohne erklärten Zweck aus und kopiert keinen Schlüssel. Nach einem Neustart eines Rechners und der Anmeldung läuft dessen Relay wieder.
3. Bedienbarkeit: Er führt Einrichtung und Verbinden nur nach den Fragen der Einrichtung aus, ohne Anleitung, so wie der Bedienablauf (Spezifikation 4.6) es beschreibt.
4. Durchgang 1: Eine Nachricht von `pipwerk-probe-send` mit Datei und Bestätigung kommt bei `pipwerk-probe-receive` auf dem anderen Rechner mit unveränderter Datei an; der Absender zeigt die Bestätigung an. Ohne verlangte Bestätigung kommt keine. `pipwerk-relay-status` zeigt beide Relays verbunden und die angeschlossenen Prüfprogramme.
5. Störungen 1 bis 3 (Abschnitt 8): Relay des Empfängers angehalten, Netzlaufwerk getrennt, Relay während einer Folge von Nachrichten mit Dateien hart beendet. Danach fehlt keine Nachricht und keine Datei, und keine kommt doppelt an. `pipwerk-relay-status` zeigt die wartende Nachricht mit Stand, ohne Inhalt. Mit kurzer Frist endet eine Nachricht bei getrenntem Netzlaufwerk mit `relay_unreachable`; `pipwerk-probe-send` zeigt die Meldung an.
6. Störungen 4 und 5: Ein im Netzlaufwerk veränderter Umschlag, eine veränderte Anlage oder ein Umschlag mit falscher Signatur wird verworfen und ohne Inhalt im Protokoll vermerkt; der Absender erhält keine Meldung und nach der Frist die Anzeige der ausgebliebenen Bestätigung. Ein noch einmal abgelegter Umschlag erreicht die Komponente nicht zweimal; war eine Bestätigung verlangt, wird sie erneut geschickt.
7. Störungen 6 und 7: Unbekannte Komponente, unbekanntes Relay ohne Standard-Relay, Schleife über die zwei Relays und zu große Anlage enden je mit einer Meldung mit Grund, die `pipwerk-probe-send` anzeigt. Läuft `pipwerk-probe-receive` nicht, meldet der Absender nach der Frist die ausgebliebene Bestätigung, und nach seinem Start kommt die Nachricht an.
8. Alle Ausgaben der Programme sind deutsch. Relays und Prüfprogramme öffnen keinen Port.
9. Die Anwenderdokumentation beschreibt Installation, Einrichtung, Verbinden, spätere Änderungen, Status, Prüfprogramme, Meldungen, Empfangsbestätigung und das Verhalten bei Störungen verständlich und vollständig, auch wie der Anwender jede Störung nach Abschnitt 8 herbeiführt.

Technische Nachweise im Prüfbericht der QA: Die Prüfskripte von `relay-core`, `pipwerk-relay` und `pipwerk-probe` enden mit Exitcode 0 auf dem bereitgestellten Commit, darin die Tests nach Abschnitt 8 für dieses Paket. Die Installationsdateien lassen sich bauen und unter Linux installieren. Durchgang 1 und Störungen 1 bis 7 laufen in der Testumgebung mit dem erwarteten Ergebnis. Positive Testberichte beider Tester liegen vor.

## wp02 – Verzeichnis-Weg über SFTP

### Ziel

Zwischen den Relays liegt das gemeinsame Verzeichnis auf einem SFTP-Server statt auf einem Netzlaufwerk.

### Umfang

- Verzeichnis-Weg `files` über SFTP in `packages/relay-core` mit `asyncssh`: Rechner, Port, Benutzer, Pfad, Anmeldung mit dem Schlüsselpaar der Seite, Schlüssel des Servers nach Bestätigung (3.4).
- Fragen des Wegs in der Einrichtung nach dem ergänzten Bedienablauf (4.6).
- Sicherheit nach Abschnitt 7 für SFTP; Prüfung von `asyncssh` nach Regel 12.
- Tests nach Abschnitt 8: Verzeichnis-Weg über einen SFTP-Server aus `asyncssh` im Test; Testumgebung um einen SFTP-Server erweitert, Durchgang 2.
- Dokumentation: `docs/technical/pipwerk-relay.md` zu SFTP, `docs/user/pipwerk-relay.md` zu SFTP-Server, Anmeldung und Schlüssel des Servers.

### Nicht-Umfang

- Weg für Dateien über SFTP (`wp04`)

### Umgesetzte Teile der Spezifikation

Abschnitt 8 Durchgang 2, 3.4 Verzeichnis-Weg über SFTP, 4.6 für SFTP, Abschnitt 7 für SFTP, Abschnitt 8 SFTP in Bibliothek und Testumgebung, Abschnitt 9 für SFTP.

### Abhängigkeiten

`wp01`; Bedienablauf für SFTP bestätigt.

### Abnahmekriterien

Voraussetzung: die Einrichtung aus `wp01` und ein SFTP-Server des Betreibers.

1. Der Auftraggeber stellt mit `pipwerk-relay-setup` die Strecke zwischen den Relays auf ein Verzeichnis auf dem SFTP-Server um, ohne Anleitung nach den Fragen der Einrichtung.
2. Durchgang 2: Nachrichten mit Dateien und Bestätigung zwischen den Prüfprogrammen kommen an.
3. Ist der SFTP-Server zeitweise nicht erreichbar, wartet die Nachricht in der Warteschlange und wird danach zugestellt. Ein geänderter Schlüssel des Servers bricht die Verbindung ab, mit Vermerk im Protokoll (Spezifikation Abschnitt 8, Durchgang 2).
4. Die Anwenderdokumentation beschreibt SFTP-Server, Anmeldung und Schlüssel des Servers verständlich und vollständig.

Technische Nachweise im Prüfbericht der QA: Die Prüfskripte von `relay-core`, `pipwerk-relay` und `pipwerk-probe` enden mit Exitcode 0 auf dem bereitgestellten Commit, darin die Tests nach Abschnitt 8 für SFTP und Durchgang 2 in der Testumgebung. Positive Testberichte beider Tester liegen vor.

## wp03 – Übertragungsweg Matrix

### Ziel

Alle Strecken laufen über Matrix. Der Anwender verfolgt den Austausch im Chat.

### Umfang

- Matrix-Weg `matrix` in `packages/relay-core` (3.4) mit Anlagen im Medienspeicher und Lesen ab der gemerkten Stelle.
- Fragen des Wegs in der Einrichtung nach dem ergänzten Bedienablauf (4.6), auch für die Strecke zwischen Komponente und Relay.
- Sicherheit nach Abschnitt 7 für Matrix; Prüfung von `httpx` und `matrix-synapse` nach Regel 12.
- Tests nach Abschnitt 8: Matrix-Weg gegen eine Nachbildung der Client-Server-API; Testumgebung um einen Matrix-Server (Synapse mit SQLite) erweitert, Durchgang 3.
- Dokumentation: `docs/technical/pipwerk-relay.md` zum Matrix-Weg, `docs/user/pipwerk-relay.md` zu Matrix-Benutzern, Räumen und Umstellung.

### Nicht-Umfang

- Wege für Dateien (`wp04`)
- Ende-zu-Ende-Verschlüsselung von Matrix (req-relay-011)

### Umgesetzte Teile der Spezifikation

Abschnitt 1 Durchgang über Matrix, 3.4 Matrix, 4.6 für Matrix, Abschnitt 7 für Matrix, Abschnitt 8 Matrix-Weg, Testumgebung mit Matrix-Server und Durchgang 3, Abschnitt 9 für Matrix.

### Abhängigkeiten

`wp01`; Bedienablauf für Matrix bestätigt.

### Abnahmekriterien

Voraussetzung: Matrix-Server des Betreibers und die Einrichtung aus `wp01`.

1. Der Auftraggeber stellt mit `pipwerk-relay-setup` alle Strecken auf Matrix um, ohne Anleitung nach den Fragen der Einrichtung.
2. Durchgang 3: Nachrichten mit Dateien und Bestätigung zwischen den Prüfprogrammen kommen an.
3. Im Chat zeigt jede Nachricht eine lesbare deutsche Zeile mit Nachrichtenart, Absender, Adressat, Nachrichten-ID und den Namen der Anlagen.
4. Ist der Matrix-Server zeitweise nicht erreichbar oder wird ein Relay hart beendet und neu gestartet, erreicht danach jede Nachricht die Komponente genau einmal (Spezifikation Abschnitt 8, Durchgang 3).
5. Die Anwenderdokumentation beschreibt Matrix-Benutzer, Räume und Umstellung verständlich und vollständig.

Technische Nachweise im Prüfbericht der QA: Die Prüfskripte von `relay-core`, `pipwerk-relay` und `pipwerk-probe` enden mit Exitcode 0 auf dem bereitgestellten Commit, darin die Tests nach Abschnitt 8 für den Matrix-Weg und Durchgang 3 in der Testumgebung. Positive Testberichte beider Tester liegen vor.

## wp04 – Dateien über einen Weg für Dateien

### Ziel

Große Dateien gehen über einen Weg für Dateien, die Nachrichten über Matrix. Jede Verbindung wählt nach ihrer Schwelle.

### Umfang

- Schnittstelle „Weg für Dateien“ mit Anmeldung über Einstiegspunkte, Weg `filestore` im Dateisystem und über SFTP, Feld `stored`, Wahl nach Schwelle, Prüfung, Entfernen nach Quittieren und nach Frist, `too_large` für beide Wege (3.3, 3.6, 4.1 Schritte 1 und 7).
- Wege für Dateien in der Betriebskonfiguration (4.2, 4.3, 4.5 mit Platz auf einem Weg für Dateien) und in den Fragen der Einrichtung nach dem ergänzten Bedienablauf (4.6); Weg für Dateien der Verbindung zwischen Prüfprogramm und Relay (3.5, 3.6).
- Sicherheit nach Abschnitt 7 für Orte aus `stored`.
- Tests nach Abschnitt 8: Dateien einer Nachricht, Wege als Erweiterung mit einem Test-Weg für Dateien; Durchgang 4 in der Testumgebung.
- Dokumentation: `docs/technical/pipwerk-relay.md` zu Wegen für Dateien, `docs/user/pipwerk-relay.md` zu Weg für Dateien und Schwelle; Glossar: Weg für Dateien.

### Nicht-Umfang

- weitere Wege für Dateien außer `filestore`

### Umgesetzte Teile der Spezifikation

Abschnitt 8 Durchgang 4, 3.3 `stored`, 3.6, 4.1 bis 4.6 für Wege für Dateien, Abschnitt 5 für Wege für Dateien, Abschnitt 7 für Wege für Dateien, Abschnitt 8 Dateien einer Nachricht und Test-Weg für Dateien, Abschnitt 9 für Wege für Dateien.

### Abhängigkeiten

`wp02` (SFTP), `wp03` (Matrix); Bedienablauf für Wege für Dateien bestätigt.

### Abnahmekriterien

Voraussetzung: die Einrichtung aus `wp03` und ein SFTP-Server des Betreibers.

1. Der Auftraggeber stellt mit `pipwerk-relay-setup` auf jeder Strecke einen Weg für Dateien auf dem SFTP-Server mit einer Schwelle ein, ohne Anleitung nach den Fragen der Einrichtung.
2. Durchgang 4: Nachrichten der Prüfprogramme mit großen und kleinen Dateien kommen an. Dateien über der Schwelle liegen unterwegs auf dem SFTP-Server, die übrigen erscheinen als Anlage im Chat.
3. Nach der Zustellung liegen keine Dateien der Nachrichten mehr auf dem SFTP-Server.
4. Die Anwenderdokumentation beschreibt Weg für Dateien und Schwelle verständlich und vollständig.

Technische Nachweise im Prüfbericht der QA: Die Prüfskripte von `relay-core`, `pipwerk-relay` und `pipwerk-probe` enden mit Exitcode 0 auf dem bereitgestellten Commit, darin die Tests nach Abschnitt 8 für Dateien einer Nachricht und Durchgang 4 in der Testumgebung. Positive Testberichte beider Tester liegen vor.

## wp05 – Web-API des Relays

### Ziel

Das Relay stellt Senden, Empfangen und den Stand der Warteschlange über eine Web-API bereit. Eine Komponente kann sie als Übertragungsweg `http` zu ihrem Relay nutzen.

### Umfang

- Web-API des Relays mit FastAPI unter `/api/v1/`, Prüfung jeder Anfrage mit der Signatur der Komponente, Prüfung des Kopfs `Host`, Einschalten mit Adresse und Port in der Einrichtung (E2, E3, 4.6); Beschreibung `contracts/api/pipwerk-relay/v1/openapi.json`.
- Weg `http` in `packages/relay-core` für Komponenten (E3), wählbar bei den Prüfprogrammen.
- Sicherheit nach Abschnitt 7 für die Web-API; Prüfung der neuen Abhängigkeiten nach Regel 12.
- Tests nach Abschnitt 8: Web-API.
- Dokumentation: `docs/technical/pipwerk-relay.md` zur Web-API, `docs/user/pipwerk-relay.md` zum Einschalten der Web-API und zum Weg `http`.

### Nicht-Umfang

- Anmeldung weiterer Nutzer nach req-system-011
- Oberfläche des Relays (req-system-008)

### Umgesetzte Teile der Spezifikation

E2 und E3 für die Web-API, 4.6 für die Web-API, Abschnitt 5 `openapi.json`, Abschnitt 7 erster Punkt, Abschnitt 8 Web-API, Abschnitt 9 für die Web-API.

### Abhängigkeiten

`wp01`; Bedienablauf für die Web-API bestätigt.

### Abnahmekriterien

Voraussetzung: die Einrichtung aus `wp01`.

1. Der Auftraggeber schaltet mit `pipwerk-relay-setup` die Web-API des Relays auf einem Rechner ein und lässt ein Prüfprogramm über den Weg `http` senden und empfangen. Die Nachrichten kommen an wie in `wp01`.
2. Ohne Einschalten öffnet das Relay keinen Port; eingeschaltet ohne Adresse ist die Web-API nur auf dem eigenen Rechner erreichbar.
3. Die Anwenderdokumentation beschreibt Web-API und Weg `http` verständlich und vollständig.

Technische Nachweise im Prüfbericht der QA: Die Prüfskripte von `relay-core`, `pipwerk-relay` und `pipwerk-probe` enden mit Exitcode 0 auf dem bereitgestellten Commit, darin die Tests nach Abschnitt 8 für die Web-API und der Abgleich mit `openapi.json`. Positive Testberichte beider Tester liegen vor.

## wp06 – Abruf über pipwerk relay

### Ziel

Eine Anfrage vom zweiten Rechner erreicht über pipwerk relay den Abruf auf dem Rechner von MetaTrader 5, und die Dateien kommen zurück. Alle Strecken laufen über Verzeichnisse wie in `wp01`.

### Umfang

- Abruf über pipwerk relay in `components/pipwerk-fetch-mt5`: `serve`, Nachrichtenarten `fetch.request`, `fetch.file`, `fetch.result`, `request`, Abschnitt `[relay]` mit Voreinstellungen (6.1 bis 6.3), deutsche Ausgaben (E9).
- Installationsdatei von `pipwerk-fetch-mt5` nach E8, damit der Abruf ohne das Repository auf den Rechner von MetaTrader 5 kommt.
- Schemas der Nachrichtenarten des Abrufs unter `contracts/messages/v1/` (Abschnitt 5).
- Sicherheit nach Abschnitt 7 für den Abruf.
- Tests nach Abschnitt 8: Abruf; Testumgebung um `serve` mit der Nachbildung von `MetaTrader5` erweitert, Durchgang 5.
- Dokumentation: `docs/technical/pipwerk-fetch-mt5.md` (`serve`, `request`, Abschnitt `[relay]`, Installationsdatei), `docs/user/pipwerk-relay.md` zum Abruf mit `serve` und `request`, Anwenderdokumentation von `pipwerk-fetch-mt5` zur Installation aus der Datei.

### Nicht-Umfang

- Abruf über Matrix und Wege für Dateien (`wp07`)
- Anschluss des Strategietesters an den Abruf (Vorhaben `backtest`)

### Umgesetzte Teile der Spezifikation

Abschnitt 1 Nachweis über Verzeichnisse, E8 für `pipwerk-fetch-mt5`, E9 für den Abruf, 6.1 bis 6.3 ohne `[relay.file_way]`, Abschnitt 5 Nachrichtenarten des Abrufs, Abschnitt 7 für den Abruf, Abschnitt 8 Abruf und Durchgang 5, Abschnitt 9 für den Abruf.

### Abhängigkeiten

`wp01`; `backtest/wp02` (`pipwerk-fetch-mt5`, Dateiformat des Imports, `packages/market-data`). Die schon umgesetzten Teile des Abrufs vom Arbeitszweig `relay/wp01` führt der Entwicklungsleiter hier fort. Übernahme in `main` nach `wp01` und `backtest/wp02`.

### Abnahmekriterien

Voraussetzung: die Einrichtung aus `wp01`, MetaTrader 5 auf dem Windows-Rechner, angemeldet am Konto eines Brokers.

1. Der Auftraggeber installiert `pipwerk-fetch-mt5` auf beiden Rechnern nach der Anwenderdokumentation aus einer heruntergeladenen Datei, ohne das Repository, und startet `serve` auf dem Rechner von MetaTrader 5. `serve` schließt sich ohne weitere Einrichtung an das Relay an und zeigt seine Adresse.
2. Durchgang 5: Eine Anfrage mit `request` mit Broker, Symbol, Zeiteinheiten, Ticks und Zeitraum liefert die Dateien ins Zielverzeichnis, mit einer deutschen Zeile je Datei und dem Ergebnis. Die Dateien lassen sich ohne Änderung in den Datenbestand von pipwerk replay importieren. Eine Anfrage mit einem anderen Broker als dem angemeldeten Handelsserver endet mit dem Grund `broker_mismatch`; eine Anfrage an eine unbekannte Komponente endet mit der Meldung und Exitcode 1.
3. Wird ein Relay während einer Lieferung hart beendet und neu gestartet, fehlt danach keine Datei, und keine kommt doppelt an.
4. Der bisherige Aufruf von `pipwerk-fetch-mt5` an der Befehlszeile arbeitet wie vorher; `serve` und `request` öffnen keinen Port.
5. Die Anwenderdokumentation beschreibt Installation, `serve` und `request` verständlich und vollständig.

Technische Nachweise im Prüfbericht der QA: Die Prüfskripte von `relay-core`, `pipwerk-relay` und `pipwerk-fetch-mt5` enden mit Exitcode 0 auf dem bereitgestellten Commit, darin die Tests nach Abschnitt 8 für den Abruf und Durchgang 5 in der Testumgebung. Positive Testberichte beider Tester liegen vor.

## wp07 – Abruf über Matrix

### Ziel

Der Abruf läuft über Matrix, große Dateien über einen Weg für Dateien. Damit ist der Nachweis laut `scope.md` vollständig.

### Umfang

- Abschnitt `[relay.file_way]` von `pipwerk-fetch-mt5` (6.1).
- Testumgebung mit `serve` über Matrix und Weg für Dateien, Durchgang 6.
- Dokumentation: `docs/user/pipwerk-relay.md` und Anwenderdokumentation von `pipwerk-fetch-mt5` zum Abruf über Matrix mit Weg für Dateien.

### Nicht-Umfang

- Änderungen an Matrix-Weg und Weg für Dateien selbst (`wp03`, `wp04`)

### Umgesetzte Teile der Spezifikation

Abschnitt 1 Nachweis über Matrix, 6.1 `[relay.file_way]`, Abschnitt 8 Durchgang 6, Abschnitt 9 für den Abruf über Matrix.

### Abhängigkeiten

`wp04`, `wp06`

### Abnahmekriterien

Voraussetzung: die Einrichtung aus `wp04` und `wp06`.

1. Der Auftraggeber stellt die Strecken von `serve` und `request` nach der Anwenderdokumentation auf Matrix mit Weg für Dateien um.
2. Durchgang 6: Eine Anfrage mit Ticks liefert alle Dateien ins Zielverzeichnis; Dateien über der Schwelle liegen unterwegs auf dem SFTP-Server, die übrigen erscheinen als Anlage im Chat. Die Dateien lassen sich in den Datenbestand von pipwerk replay importieren. Danach liegen keine Dateien der Anfrage mehr auf dem SFTP-Server.
3. Die Anwenderdokumentation beschreibt die Umstellung verständlich und vollständig.

Technische Nachweise im Prüfbericht der QA: Die Prüfskripte von `relay-core`, `pipwerk-relay` und `pipwerk-fetch-mt5` enden mit Exitcode 0 auf dem bereitgestellten Commit; Durchgang 6 läuft in der Testumgebung. Positive Testberichte beider Tester liegen vor.

## Abdeckung der Spezifikation

| Teil der Spezifikation | Paket |
|---|---|
| 1 Nachweis | `wp01` bis `wp05` (pipwerk relay), `wp06` (Abruf über Verzeichnisse), `wp07` (Abruf über Matrix) |
| 2 E1, E4 bis E7, E9 | `wp01`; E9 für den Abruf `wp06` |
| 2 E2 | `wp01` (Wege ohne Port), `wp05` (Web-API) |
| 2 E3 | `wp05` |
| 2 E8 | `wp01`; `pipwerk-fetch-mt5` `wp06` |
| 3.1 bis 3.3 | `wp01`; `stored` `wp04` |
| 3.4 | `wp01` (Schnittstelle, Erweiterungen, Verzeichnis-Weg im Dateisystem), `wp02` (SFTP), `wp03` (Matrix), `wp05` (Weg `http`) |
| 3.5, 3.7 | `wp01` |
| 3.6 | `wp04` |
| 4.1 bis 4.5 | `wp01`; Wege für Dateien `wp04`; Web-API `wp05` |
| 4.6 | `wp01`; Fragen der Wege `wp02` bis `wp05` |
| 5 | `wp01`; Wege für Dateien `wp04`; `openapi.json` `wp05`; Nachrichtenarten des Abrufs `wp06` |
| 6.1 bis 6.3 | `wp06`; `[relay.file_way]` `wp07` |
| 7 | `wp01` bis `wp06` je nach Teil |
| 8 Prüfprogramme, Störungen, Einrichtung | `wp01` |
| 8 Durchgänge | `wp01` (1), `wp02` (2), `wp03` (3), `wp04` (4), `wp06` (5), `wp07` (6) |
| 8 übrige Tests | `wp01` bis `wp06` je nach Teil |
| 9 | `wp01` bis `wp07` je nach Teil |
| 10 | über die dort genannten Abschnitte |

## Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-23 | Plan angelegt: vier Pakete. `wp01` auf dem von der QA geprüften Stand von `backtest/wp02`, `wp02` und `wp04` nach `wp01`, `wp03` nach `wp02`. Prüfung bestanden in [plan-1.md](reviews/plan-1.md). |
| 2026-10-23 | Hinweise aus [plan-1.md](reviews/plan-1.md) (bestanden) ohne weitere Prüfung eingearbeitet: H1 Empfangsbestätigung im technischen Nachweis von `wp01`; H2 Weg `http` in der Abdeckung von 3.4; H3 Sicherheit in `wp01` ohne Matrix und Web-API; H4 Prüfung nach Regel 12 in `wp01` und `wp04`; H5 Übernahme von `wp02`, `wp03` und `wp04` (Übersicht). |
| 2026-10-24 | Nach dem Einwand des Auftraggebers zur Präsentation [plan-1.html](presentations/plan-1.html) (Festlegung in `scope.md`, Stand 2026-10-24): `wp01` weist die Grundmechanik nur mit Verzeichnissen im Dateisystem nach, zwischen den Rechnern über ein Netzlaufwerk, mit Abnahmekriterien zur Robustheit unter Störungen und zur Empfangsbestätigung über die Prüfkomponente (Spezifikation Abschnitt 8). SFTP neues Paket `wp02`; Matrix wird `wp03`, Wege für Dateien `wp04` nach `wp02` und `wp03`, Web-API `wp05`. Durchgänge nach der neuen Nummerierung der Spezifikation. Abnahmekriterium zur Robustheit auch in `wp02` und `wp03`. Prüfung bestanden in [plan-2.md](reviews/plan-2.md). |
| 2026-10-24 | Hinweise aus [plan-2.md](reviews/plan-2.md) (bestanden) ohne weitere Prüfung eingearbeitet: H1 in `wp01` Kriterien 4 und 6 die anzeigende Komponente genannt; H2 falscher Schlüssel und erneute Bestätigung in Kriterium 5; H3 Herbeiführen der Störungen in der Anwenderdokumentation (Kriterium 8); H6 Prüfkomponente im Glossar. H4 und H5 betreffen die Spezifikation (dort eingearbeitet). |
| 2026-10-25 | Überarbeitung nach der nicht bestandenen Abnahme von `wp01` ([Abnahmebericht](wp01/acceptance/1.md), Mängel M1 bis M7, Spezifikation Abschnitt 10): `wp01` liefert pipwerk relay allein mit Installationsdateien, Einrichtung nach dem Bedienablauf, getrennten Programmen und Prüfprogrammen und wird ohne MetaTrader 5 abgenommen, mit Kriterien zu Installation, Einrichtung ohne Handarbeit, Bedienbarkeit und deutschen Ausgaben; der Abruf über pipwerk relay ist neues Paket `wp06` (Durchgang 5), der Abruf über Matrix neues Paket `wp07` (Durchgang 6); `wp02` bis `wp05` werden mit den Prüfprogrammen abgenommen und beginnen nach Bestätigung des Bedienablaufs ihres Wegs. |
