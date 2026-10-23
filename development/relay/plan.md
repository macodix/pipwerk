# Arbeitspaketplan Vorhaben relay

## Status

- status: `draft`
- stand: 2026-10-23
- komponenten: `packages/relay-core` (neu), `components/pipwerk-relay` (neu), `components/pipwerk-fetch-mt5`, `contracts/messages/`, `contracts/api/pipwerk-relay/`
- grundlage: [specification.md](specification.md), [Präsentation](presentations/specification-2.html) bestätigt vom Auftraggeber im Chat am 23. Oktober 2026
- prüfung: Durchlauf 1 [plan-1.md](reviews/plan-1.md) bestanden, Hinweise ohne weitere Prüfung eingearbeitet

## Übersicht

| Paket | Titel | hängt ab von | Stand |
|---|---|---|---|
| `wp01` | Relay und Abruf über Verzeichnisse | `backtest/wp02`, Beginn auf dem von der QA geprüften Stand, Übernahme danach | `open` |
| `wp02` | Übertragungsweg Matrix | `wp01` | `open` |
| `wp03` | Dateien über einen Weg für Dateien | `wp02` | `open` |
| `wp04` | Web-API des Relays | `wp01` | `open` |

Die Pakete folgen den Durchgängen des Nachweises (Spezifikation Abschnitt 8), die der Auftraggeber selbst führt. `wp01` bringt Bibliothek, Relay und den Abruf über pipwerk relay mit dem Verzeichnis-Weg und endet mit Durchgang 2. Die Empfangsbestätigung gehört zu `wp01`, weil sie festlegt, wann der Anschluss einer Komponente quittiert und eine Nachricht als gesehen vermerkt (3.5, 3.7, E4). `wp02` fügt Matrix hinzu und endet mit Durchgang 1. `wp03` bringt die Wege für Dateien und endet mit Durchgang 3, der Matrix braucht. `wp04` bringt die Web-API mit dem Weg `http`; es braucht nur `wp01` und läuft neben `wp02` und `wp03`. Diese Pakete ändern zum Teil dieselben Dateien. Wer zuerst in `main` übernommen wird, entscheidet die Abnahme; vor der Übernahme des jeweils anderen führt der Entwicklungsleiter `origin/main` in dessen Arbeitszweig zusammen. Ändert das Code, prüfen Tester und QA erneut.

Abschnittsangaben beziehen sich auf die [Spezifikation](specification.md). Grenzwerte gegen Überlast, Ports der Testumgebung und die Einzelheiten der Tests legen die Aufträge fest.

## wp01 – Relay und Abruf über Verzeichnisse

### Ziel

Auf zwei Rechnern läuft je ein Relay. Das Anfrage-Programm schickt über die Relays eine Anfrage an den Abruf auf dem Rechner von MetaTrader 5 und erhält die Dateien zurück, alle Strecken über Verzeichnisse.

### Umfang

- Bibliothek `packages/relay-core`: Adresse, Nachricht, Umschlag mit Prüfwert (3.1 bis 3.3, E5), Schnittstelle „Weg“ mit Anmeldung über Einstiegspunkte und eigenen Angaben (3.4), Verzeichnis-Weg `files` über ein lokales Verzeichnis und über SFTP (3.4), Anlagen über den Übertragungsweg, Anschluss einer Komponente (3.5) mit Erkennen von Wiederholungen (E4) und Empfangsbestätigung (3.7); Prüfskript.
- Relay `components/pipwerk-relay`: Weg einer Nachricht (4.1), angeschlossene Komponenten (4.2), Adressbuch und Standard-Relay (4.3), unzustellbare Nachricht (4.4), Konfiguration, Befehle und Begrenzungen (4.5), Speicher mit Datenbank und Alembic (E6), Installation mit uv unter Windows und Linux (E3 letzter Satz, E7); Prüfskript und Testumgebungsskript.
- Schemas unter `contracts/messages/v1/` (Abschnitt 5) ohne die Angaben zu Wegen für Dateien (`wp03`).
- Abruf über pipwerk relay in `components/pipwerk-fetch-mt5`: `serve`, Nachrichtenarten, `request`, Abschnitt `[relay]` mit `[relay.way]` (6.1 bis 6.3).
- Sicherheit nach Abschnitt 7 für diese Teile, ohne Matrix und Web-API; Prüfung von `asyncssh` nach Regel 12.
- Tests nach Abschnitt 8: Bibliothek ohne Matrix-Weg, Empfangsbestätigung, Wege als Erweiterung mit einem Test-Weg, Relay, Abruf. Testumgebung mit zwei Relays, SFTP-Server aus `asyncssh` und `serve` mit der Nachbildung von `MetaTrader5`.
- Dokumentation (Abschnitt 9) für diese Teile: `docs/technical/pipwerk-relay.md`, `docs/technical/pipwerk-fetch-mt5.md`, `contracts/messages/README.md`, README der Komponenten; `docs/user/pipwerk-relay.md` zu Einrichtung unter Windows und Linux, Schlüsseln, Adressbuch, Verzeichnissen und SFTP, Abruf mit `serve` und `request`, Meldungen und ihren Gründen, Empfangsbestätigung; Glossar: Anlage, Umschlag, Eingang, Warteschlange, Schlüssel der Verbindung, angeschlossene Komponente, Empfangsbestätigung.

### Nicht-Umfang

- Matrix-Weg (`wp02`)
- Wege für Dateien, Feld `stored` und Abschnitt `[relay.file_way]` (`wp03`)
- Web-API und Weg `http` (`wp04`)

### Umgesetzte Teile der Spezifikation

Abschnitt 1 Durchgang 2, E1, E2 ohne Web-API, E4 bis E7, 3.1 bis 3.3, 3.4 ohne Matrix, 3.5, 3.7, 4.1 bis 4.5 ohne Wege für Dateien, Abschnitt 5 ohne `openapi.json` und Wege für Dateien, 6.1 bis 6.3 ohne `[relay.file_way]`, Abschnitt 7 ohne Web-API und Wege für Dateien, Abschnitt 8 wie im Umfang, Abschnitt 9 wie im Umfang.

### Abhängigkeiten

`backtest/wp02` (`pipwerk-fetch-mt5`, Dateiformat des Imports, `packages/market-data`). Seine Prüfung durch die QA ist bestanden, die Abhängigkeit gilt damit als erfüllt (Entwicklungsverfahren, Abschnitt „Meldungen“). Für `wp01` heißt das:

1. Beginn sofort. Der Arbeitszweig `relay/wp01` wird von Commit `d994dfaf02a49aa1ac0ea954c35e6ce64d8a0f2d` auf `backtest/wp02` angelegt, dem von der QA geprüften Stand (`backtest/wp02:development/backtest/wp02/reviews/2.md`).
2. Neue Commits auf `backtest/wp02` aus dessen Abnahme führt der Entwicklungsleiter mit einem Merge-Commit in `relay/wp01` zusammen, spätestens bevor die QA `wp01` prüft. Ändert ein solcher Merge-Commit Code, prüfen Tester und QA danach erneut.
3. Übernahme in `main` erst nach `backtest/wp02`.

### Abnahmekriterien

Voraussetzung: MetaTrader 5 auf einem Rechner des Auftraggebers, ein zweiter Rechner und ein SFTP-Server des Betreibers.

1. Der Auftraggeber richtet nach der Anwenderdokumentation auf dem Rechner von MetaTrader 5 ein Relay und `serve` ein, auf dem zweiten Rechner ein Relay und das Anfrage-Programm, mit Schlüsseln und Adressbuch. Zwischen Komponente und Relay liegt ein Verzeichnis auf dem Rechner, zwischen den Relays ein Verzeichnis auf dem SFTP-Server.
2. Durchgang 2: Eine Anfrage mit Broker, Symbol, Zeiteinheiten, Ticks und Zeitraum liefert die Dateien ins Zielverzeichnis des Anfrage-Programms, mit einer Zeile je Datei und dem Ergebnis. Die Dateien lassen sich ohne Änderung in den Datenbestand von pipwerk replay importieren.
3. Eine Anfrage mit einem anderen Broker als dem angemeldeten Handelsserver endet mit dem Grund `broker_mismatch`. Eine Anfrage an eine Komponente, die es nicht gibt, endet mit einer Meldung über die unzustellbare Nachricht mit Grund und Exitcode 1.
4. `pipwerk-relay queue` zeigt die Nachrichten der Warteschlange mit Stand, ohne Inhalt. Relay und `serve` öffnen keinen Port.
5. Der bisherige Aufruf von `pipwerk-fetch-mt5` an der Befehlszeile arbeitet wie vorher.
6. Die Anwenderdokumentation beschreibt Einrichtung, Schlüssel, Adressbuch, Verzeichnisse und SFTP, Abruf, Meldungen und Empfangsbestätigung verständlich und vollständig.

Technische Nachweise im Prüfbericht der QA: Die Prüfskripte von `relay-core`, `pipwerk-relay` und `pipwerk-fetch-mt5` enden mit Exitcode 0 auf dem bereitgestellten Commit, darin die Tests nach Abschnitt 8 für dieses Paket, auch die Empfangsbestätigung, und der Durchgang über Verzeichnisse in der Testumgebung. Die Empfangsbestätigung zeigt keiner der Durchgänge, weil der Abruf sie nicht verlangt (6.2); sie ist deshalb nur über diese Tests nachgewiesen. Positive Testberichte beider Tester liegen vor.

## wp02 – Übertragungsweg Matrix

### Ziel

Alle Strecken laufen über Matrix. Der Anwender verfolgt den Austausch im Chat.

### Umfang

- Matrix-Weg `matrix` in `packages/relay-core` (3.4) mit Anlagen im Medienspeicher und Lesen ab der gemerkten Stelle.
- Sicherheit nach Abschnitt 7 für Matrix (HTTPS mit Prüfung des Zertifikats, Zugriffsschlüssel nur im Verzeichnis für Geheimnisse); Prüfung von `httpx` und `matrix-synapse` nach Regel 12.
- Tests nach Abschnitt 8: Matrix-Weg gegen eine Nachbildung der Client-Server-API; Testumgebung um einen Matrix-Server (Synapse mit SQLite) erweitert.
- Dokumentation: `docs/technical/pipwerk-relay.md` zum Matrix-Weg, `docs/user/pipwerk-relay.md` zu Matrix-Benutzern und Räumen.

### Nicht-Umfang

- Wege für Dateien (`wp03`)
- Ende-zu-Ende-Verschlüsselung von Matrix (req-relay-011)

### Umgesetzte Teile der Spezifikation

Abschnitt 1 Durchgang 1, 3.4 Matrix, Abschnitt 7 für Matrix, Abschnitt 8 Matrix-Weg, Testumgebung mit Matrix-Server und Durchgang 1, Abschnitt 9 für Matrix.

### Abhängigkeiten

`wp01`

### Abnahmekriterien

Voraussetzung: Matrix-Server des Betreibers und die Einrichtung aus `wp01`.

1. Der Auftraggeber legt nach der Anwenderdokumentation die Matrix-Benutzer und Räume an und stellt alle Strecken auf Matrix um.
2. Durchgang 1: Eine Anfrage liefert die Dateien ins Zielverzeichnis des Anfrage-Programms; sie lassen sich in den Datenbestand von pipwerk replay importieren.
3. Im Chat zeigt jede Nachricht eine lesbare Zeile mit Nachrichtenart, Absender, Adressat, Nachrichten-ID und den Namen der Anlagen.
4. Die Anwenderdokumentation beschreibt Matrix-Benutzer, Räume und Umstellung verständlich und vollständig.

Technische Nachweise im Prüfbericht der QA: Die Prüfskripte von `relay-core`, `pipwerk-relay` und `pipwerk-fetch-mt5` enden mit Exitcode 0 auf dem bereitgestellten Commit, darin die Tests nach Abschnitt 8 für den Matrix-Weg und der Durchgang über Matrix in der Testumgebung. Positive Testberichte beider Tester liegen vor.

## wp03 – Dateien über einen Weg für Dateien

### Ziel

Große Dateien gehen über einen Weg für Dateien, die Nachrichten über Matrix. Jede Verbindung wählt nach ihrer Schwelle.

### Umfang

- Schnittstelle „Weg für Dateien“ mit Anmeldung über Einstiegspunkte, Weg `filestore` im Dateisystem und über SFTP, Feld `stored`, Wahl nach Schwelle, Prüfung, Entfernen nach Quittieren und nach Frist, `too_large` für beide Wege (3.3, 3.6, 4.1 Schritte 1 und 7).
- Wege für Dateien in der Betriebskonfiguration (4.2, 4.3, 4.5 mit Platz auf einem Weg für Dateien) und in `relay-config.schema.json`; Abschnitt `[relay.file_way]` von `pipwerk-fetch-mt5` (6.1).
- Sicherheit nach Abschnitt 7 für Orte aus `stored`.
- Tests nach Abschnitt 8: Dateien einer Nachricht, Wege als Erweiterung mit einem Test-Weg für Dateien; Durchgang 3 in der Testumgebung.
- Dokumentation: `docs/technical/pipwerk-relay.md` zu Wegen für Dateien, `docs/user/pipwerk-relay.md` zu Weg für Dateien und Schwelle; Glossar: Weg für Dateien.

### Nicht-Umfang

- weitere Wege für Dateien außer `filestore`

### Umgesetzte Teile der Spezifikation

Abschnitt 1 Durchgang 3, 3.3 `stored`, 3.6, 4.1 bis 4.5 für Wege für Dateien, Abschnitt 5 für Wege für Dateien, 6.1 `[relay.file_way]`, Abschnitt 7 für Wege für Dateien, Abschnitt 8 Dateien einer Nachricht, Test-Weg für Dateien und Durchgang 3, Abschnitt 9 für Wege für Dateien.

### Abhängigkeiten

`wp02`

### Abnahmekriterien

Voraussetzung: die Einrichtung aus `wp02` und ein SFTP-Server des Betreibers.

1. Der Auftraggeber stellt nach der Anwenderdokumentation auf jeder Strecke einen Weg für Dateien auf dem SFTP-Server mit einer Schwelle ein.
2. Durchgang 3: Eine Anfrage mit Ticks liefert alle Dateien ins Zielverzeichnis des Anfrage-Programms. Dateien über der Schwelle liegen unterwegs auf dem SFTP-Server, die übrigen erscheinen als Anlage im Chat. Die Dateien lassen sich in den Datenbestand von pipwerk replay importieren.
3. Nach der Lieferung liegen keine Dateien der Anfrage mehr auf dem SFTP-Server.
4. Die Anwenderdokumentation beschreibt Weg für Dateien und Schwelle verständlich und vollständig.

Technische Nachweise im Prüfbericht der QA: Die Prüfskripte von `relay-core`, `pipwerk-relay` und `pipwerk-fetch-mt5` enden mit Exitcode 0 auf dem bereitgestellten Commit, darin die Tests nach Abschnitt 8 für Dateien einer Nachricht und der Durchgang 3 in der Testumgebung. Positive Testberichte beider Tester liegen vor.

## wp04 – Web-API des Relays

### Ziel

Das Relay stellt Senden, Empfangen und den Stand der Warteschlange über eine Web-API bereit. Eine Komponente kann sie als Übertragungsweg `http` zu ihrem Relay nutzen.

### Umfang

- Web-API des Relays mit FastAPI unter `/api/v1/`, Prüfung jeder Anfrage mit dem Schlüssel der Verbindung, Prüfung des Kopfs `Host`, Bindung nur nach Startkonfiguration (E2, E3); Beschreibung `contracts/api/pipwerk-relay/v1/openapi.json`.
- Weg `http` in `packages/relay-core` für Komponenten (E3).
- Sicherheit nach Abschnitt 7 für die Web-API; Prüfung der neuen Abhängigkeiten der Web-API und des Wegs `http` nach Regel 12.
- Tests nach Abschnitt 8: Web-API.
- Dokumentation: `docs/technical/pipwerk-relay.md` zur Web-API, `docs/user/pipwerk-relay.md` zum Einschalten der Web-API und zum Weg `http`.

### Nicht-Umfang

- Anmeldung weiterer Nutzer nach req-system-011
- Oberfläche des Relays (req-system-008)

### Umgesetzte Teile der Spezifikation

E2 und E3 für die Web-API, Abschnitt 5 `openapi.json`, Abschnitt 7 erster Punkt, Abschnitt 8 Web-API, Abschnitt 9 für die Web-API.

### Abhängigkeiten

`wp01`

### Abnahmekriterien

Voraussetzung: die Einrichtung aus `wp01`.

1. Der Auftraggeber schaltet nach der Anwenderdokumentation die Web-API des Relays auf dem zweiten Rechner ein und stellt das Anfrage-Programm auf den Weg `http` um. Eine Anfrage liefert die Dateien wie in `wp01`.
2. Ohne Eintrag in der Startkonfiguration öffnet das Relay keinen Port; mit Eintrag ohne Adresse ist die Web-API nur auf dem eigenen Rechner erreichbar.
3. Die Anwenderdokumentation beschreibt Web-API und Weg `http` verständlich und vollständig.

Technische Nachweise im Prüfbericht der QA: Die Prüfskripte von `relay-core` und `pipwerk-relay` enden mit Exitcode 0 auf dem bereitgestellten Commit, darin die Tests nach Abschnitt 8 für die Web-API und der Abgleich mit `openapi.json`. Positive Testberichte beider Tester liegen vor.

## Abdeckung der Spezifikation

| Teil der Spezifikation | Paket |
|---|---|
| 1 Nachweis | `wp01` (Durchgang 2), `wp02` (Durchgang 1), `wp03` (Durchgang 3) |
| 2 E1, E4 bis E7 | `wp01` |
| 2 E2 | `wp01` (Wege ohne Port), `wp04` (Web-API) |
| 2 E3 | `wp04`; Installation `wp01` |
| 3.1 bis 3.3 | `wp01`; `stored` `wp03` |
| 3.4 | `wp01` (Schnittstelle, Erweiterungen, Verzeichnis-Weg), `wp02` (Matrix), `wp04` (Weg `http` nach E3) |
| 3.5, 3.7 | `wp01` |
| 3.6 | `wp03` |
| 4.1 bis 4.5 | `wp01`; Wege für Dateien `wp03` |
| 5 | `wp01`; Wege für Dateien `wp03`; `openapi.json` `wp04` |
| 6.1 bis 6.3 | `wp01`; `[relay.file_way]` `wp03` |
| 7 | `wp01` bis `wp04` je nach Teil |
| 8 | `wp01` bis `wp04` je nach Teil |
| 9 | `wp01` bis `wp04` je nach Teil |
| 10 | über die dort genannten Abschnitte |

## Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-23 | Plan angelegt: vier Pakete. `wp01` auf dem von der QA geprüften Stand von `backtest/wp02`, `wp02` und `wp04` nach `wp01`, `wp03` nach `wp02`. Prüfung bestanden in [plan-1.md](reviews/plan-1.md). |
| 2026-10-23 | Hinweise aus [plan-1.md](reviews/plan-1.md) (bestanden) ohne weitere Prüfung eingearbeitet: H1 Empfangsbestätigung im technischen Nachweis von `wp01`; H2 Weg `http` in der Abdeckung von 3.4; H3 Sicherheit in `wp01` ohne Matrix und Web-API; H4 Prüfung nach Regel 12 in `wp01` und `wp04`; H5 Übernahme von `wp02`, `wp03` und `wp04` (Übersicht). |
