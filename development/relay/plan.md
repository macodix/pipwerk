# Arbeitspaketplan Vorhaben relay

## Status

- status: `draft`
- stand: 2026-10-24
- komponenten: `packages/relay-core` (neu), `components/pipwerk-relay` (neu), `components/pipwerk-fetch-mt5`, `contracts/messages/`, `contracts/api/pipwerk-relay/`
- grundlage: [specification.md](specification.md), [Präsentation](presentations/specification-2.html) bestätigt vom Auftraggeber im Chat am 23. Oktober 2026; Abschnitt 8 geändert nach dem Einwand des Auftraggebers zur [Präsentation des Plans](presentations/plan-1.html)
- prüfung: Durchlauf 1 [plan-1.md](reviews/plan-1.md) bestanden, Hinweise ohne weitere Prüfung eingearbeitet; Fassung nach dem Einwand: Durchlauf 2 [plan-2.md](reviews/plan-2.md) bestanden, Hinweise ohne weitere Prüfung eingearbeitet
- bestätigung: [Präsentation](presentations/plan-2.html) bestätigt vom Auftraggeber im Chat am 24. Oktober 2026

## Übersicht

| Paket | Titel | hängt ab von | Stand |
|---|---|---|---|
| `wp01` | Grundmechanik über Verzeichnisse | `backtest/wp02`, Beginn auf dem von der QA geprüften Stand, Übernahme danach | `open` |
| `wp02` | Verzeichnis-Weg über SFTP | `wp01` | `open` |
| `wp03` | Übertragungsweg Matrix | `wp01` | `open` |
| `wp04` | Dateien über einen Weg für Dateien | `wp02`, `wp03` | `open` |
| `wp05` | Web-API des Relays | `wp01` | `open` |

Die Pakete folgen den Durchgängen des Nachweises (Spezifikation Abschnitt 8), die der Auftraggeber selbst führt. `wp01` bringt die Grundmechanik mit dem einfachsten Übertragungsweg, Verzeichnissen im Dateisystem, und weist nach, dass sie funktioniert und robust ist: Durchgang 1 und die Störungen nach Abschnitt 8. Zwischen den Rechnern liegt dabei ein Netzlaufwerk. Jeder weitere Weg ist ein eigenes Paket: `wp02` SFTP (Durchgang 2), `wp03` Matrix (Durchgang 3), `wp04` die Wege für Dateien (Durchgang 4, braucht Matrix und SFTP), `wp05` die Web-API mit dem Weg `http`. `wp02`, `wp03` und `wp05` brauchen nur `wp01` und laufen nebeneinander. Diese Pakete ändern zum Teil dieselben Dateien. Wer zuerst in `main` übernommen wird, entscheidet die Abnahme; vor der Übernahme eines weiteren führt der Entwicklungsleiter `origin/main` in dessen Arbeitszweig zusammen. Ändert das Code, prüfen Tester und QA erneut.

Abschnittsangaben beziehen sich auf die [Spezifikation](specification.md). Grenzwerte gegen Überlast, Ports der Testumgebung und die Einzelheiten der Tests legen die Aufträge fest.

## wp01 – Grundmechanik über Verzeichnisse

### Ziel

Die Grundmechanik von pipwerk relay ist funktional und robust: Adresse, Weitergabe über zwei Relays, Prüfwert, Warteschlange, Wiederholung, unzustellbare Nachricht, Empfangsbestätigung und Abruf. Alle Strecken laufen über Verzeichnisse im Dateisystem, zwischen den Rechnern über ein Netzlaufwerk. Das zeigt sich im ungestörten Durchgang und unter Störungen.

### Umfang

- Bibliothek `packages/relay-core`: Adresse, Nachricht, Umschlag mit Prüfwert (3.1 bis 3.3, E5), Schnittstelle „Weg“ mit Anmeldung über Einstiegspunkte und eigenen Angaben (3.4), Verzeichnis-Weg `files` über ein Verzeichnis im Dateisystem, auch ein Netzlaufwerk (3.4), Anlagen über den Übertragungsweg, Anschluss einer Komponente (3.5) mit Erkennen von Wiederholungen (E4) und Empfangsbestätigung (3.7); Prüfskript.
- Relay `components/pipwerk-relay`: Weg einer Nachricht (4.1), angeschlossene Komponenten (4.2), Adressbuch und Standard-Relay (4.3), unzustellbare Nachricht (4.4), Konfiguration, Befehle und Begrenzungen (4.5), Prüfkomponente (8), Speicher mit Datenbank und Alembic (E6), Installation mit uv unter Windows und Linux (E3 letzter Satz, E7); Prüfskript und Testumgebungsskript.
- Schemas unter `contracts/messages/v1/` (Abschnitt 5) ohne die Angaben zu Wegen für Dateien (`wp04`).
- Abruf über pipwerk relay in `components/pipwerk-fetch-mt5`: `serve`, Nachrichtenarten, `request`, Abschnitt `[relay]` mit `[relay.way]` (6.1 bis 6.3).
- Sicherheit nach Abschnitt 7 für diese Teile, ohne SFTP, Matrix und Web-API.
- Tests nach Abschnitt 8: Bibliothek mit dem Verzeichnis-Weg über ein lokales Verzeichnis, Empfangsbestätigung, Wege als Erweiterung mit einem Test-Weg, Relay, Abruf; Durchgang 1 und Störungen 1 bis 7 in der Testumgebung mit zwei Relays, gemeinsamem Verzeichnis, Prüfkomponenten und `serve` mit der Nachbildung von `MetaTrader5`.
- Dokumentation (Abschnitt 9) für diese Teile: `docs/technical/pipwerk-relay.md`, `docs/technical/pipwerk-fetch-mt5.md`, `contracts/messages/README.md`, README der Komponenten; `docs/user/pipwerk-relay.md` zu Einrichtung unter Windows und Linux, Schlüsseln, Adressbuch, Verzeichnissen und Netzlaufwerk, Abruf mit `serve` und `request`, Meldungen und ihren Gründen, Empfangsbestätigung, Prüfkomponente und Verhalten bei Störungen; Glossar: Anlage, Umschlag, Eingang, Warteschlange, Schlüssel der Verbindung, angeschlossene Komponente, Empfangsbestätigung, Prüfkomponente.

### Nicht-Umfang

- Verzeichnis-Weg über SFTP (`wp02`)
- Matrix-Weg (`wp03`)
- Wege für Dateien, Feld `stored` und Abschnitt `[relay.file_way]` (`wp04`)
- Web-API und Weg `http` (`wp05`)

### Umgesetzte Teile der Spezifikation

Abschnitt 1 Durchgang über Verzeichnisse, E1, E2 ohne Web-API, E4 bis E7, 3.1 bis 3.3, 3.4 ohne Matrix und SFTP, 3.5, 3.7, 4.1 bis 4.5 ohne Wege für Dateien, Abschnitt 5 ohne `openapi.json` und Wege für Dateien, 6.1 bis 6.3 ohne `[relay.file_way]`, Abschnitt 7 ohne SFTP, Matrix, Web-API und Wege für Dateien, Abschnitt 8 wie im Umfang, Abschnitt 9 wie im Umfang.

### Abhängigkeiten

`backtest/wp02` (`pipwerk-fetch-mt5`, Dateiformat des Imports, `packages/market-data`). Seine Prüfung durch die QA ist bestanden, die Abhängigkeit gilt damit als erfüllt (Entwicklungsverfahren, Abschnitt „Meldungen“). Für `wp01` heißt das:

1. Beginn sofort. Der Arbeitszweig `relay/wp01` wird von Commit `d994dfaf02a49aa1ac0ea954c35e6ce64d8a0f2d` auf `backtest/wp02` angelegt, dem von der QA geprüften Stand (`backtest/wp02:development/backtest/wp02/reviews/2.md`).
2. Neue Commits auf `backtest/wp02` aus dessen Abnahme führt der Entwicklungsleiter mit einem Merge-Commit in `relay/wp01` zusammen, spätestens bevor die QA `wp01` prüft. Ändert ein solcher Merge-Commit Code, prüfen Tester und QA danach erneut.
3. Übernahme in `main` erst nach `backtest/wp02`.

### Abnahmekriterien

Voraussetzung: MetaTrader 5 auf einem Rechner des Auftraggebers, ein zweiter Rechner und ein Netzlaufwerk, das auf beiden Rechnern eingebunden ist.

1. Der Auftraggeber richtet nach der Anwenderdokumentation auf dem Rechner von MetaTrader 5 ein Relay, `serve` und eine Prüfkomponente ein, auf dem zweiten Rechner ein Relay, das Anfrage-Programm und eine Prüfkomponente, mit Schlüsseln und Adressbuch. Zwischen Komponente und Relay liegt ein Verzeichnis auf dem Rechner, zwischen den Relays ein Verzeichnis auf dem Netzlaufwerk.
2. Durchgang 1: Eine Anfrage mit Broker, Symbol, Zeiteinheiten, Ticks und Zeitraum liefert die Dateien ins Zielverzeichnis des Anfrage-Programms, mit einer Zeile je Datei und dem Ergebnis. Die Dateien lassen sich ohne Änderung in den Datenbestand von pipwerk replay importieren. Eine Anfrage mit einem anderen Broker als dem angemeldeten Handelsserver endet mit dem Grund `broker_mismatch`.
3. Empfangsbestätigung: Eine Nachricht der Prüfkomponente mit Datei und Bestätigung kommt beim anderen Rechner mit unveränderter Datei an; der Absender zeigt die Bestätigung an. Ohne verlangte Bestätigung kommt keine.
4. Störungen 1 bis 3 (Abschnitt 8): Relay des Empfängers beendet, Netzlaufwerk getrennt, Relay während einer Lieferung des Abrufs hart beendet. Danach fehlt keine Nachricht und keine Datei, und keine kommt doppelt an. `pipwerk-relay queue` zeigt die wartende Nachricht mit Stand, ohne Inhalt. Mit kurzer Frist endet eine Nachricht der Prüfkomponente bei getrenntem Netzlaufwerk mit `relay_unreachable`; die sendende Prüfkomponente zeigt die Meldung an.
5. Störungen 4 und 5: Ein im Netzlaufwerk veränderter Umschlag, eine veränderte Anlage oder ein Umschlag mit falschem Schlüssel wird verworfen und ohne Inhalt im Protokoll vermerkt; die sendende Prüfkomponente erhält keine Meldung und nach der Frist die Anzeige der ausgebliebenen Bestätigung. Ein noch einmal abgelegter Umschlag erreicht die Komponente nicht zweimal; war eine Bestätigung verlangt, wird sie erneut geschickt.
6. Störungen 6 und 7: Unbekannte Komponente, unbekanntes Relay ohne Standard-Relay, Schleife über die zwei Relays und zu große Anlage enden je mit einer Meldung mit Grund, die die sendende Prüfkomponente anzeigt. Eine Anfrage des Anfrage-Programms an eine unbekannte Komponente endet mit der Meldung und Exitcode 1. Läuft die empfangende Prüfkomponente nicht, meldet der Absender nach der Frist die ausgebliebene Bestätigung, und nach ihrem Start kommt die Nachricht an.
7. Relays, `serve` und Prüfkomponenten öffnen keinen Port. Der bisherige Aufruf von `pipwerk-fetch-mt5` an der Befehlszeile arbeitet wie vorher.
8. Die Anwenderdokumentation beschreibt Einrichtung, Schlüssel, Adressbuch, Verzeichnisse und Netzlaufwerk, Abruf, Meldungen, Empfangsbestätigung, Prüfkomponente und das Verhalten bei Störungen verständlich und vollständig, auch wie der Anwender jede Störung nach Abschnitt 8 herbeiführt.

Technische Nachweise im Prüfbericht der QA: Die Prüfskripte von `relay-core`, `pipwerk-relay` und `pipwerk-fetch-mt5` enden mit Exitcode 0 auf dem bereitgestellten Commit, darin die Tests nach Abschnitt 8 für dieses Paket. Durchgang 1 und Störungen 1 bis 7 laufen in der Testumgebung mit dem erwarteten Ergebnis. Positive Testberichte beider Tester liegen vor.

## wp02 – Verzeichnis-Weg über SFTP

### Ziel

Zwischen den Relays liegt das gemeinsame Verzeichnis auf einem SFTP-Server statt auf einem Netzlaufwerk.

### Umfang

- Verzeichnis-Weg `files` über SFTP in `packages/relay-core` mit `asyncssh`: Rechner, Port, Benutzer, Pfad, Schlüssel und bekannter Schlüssel des Servers aus dem Verzeichnis für Geheimnisse (3.4).
- Sicherheit nach Abschnitt 7 für SFTP (Prüfung des Schlüssels des Servers, Schlüssel nur im Verzeichnis für Geheimnisse); Prüfung von `asyncssh` nach Regel 12.
- Tests nach Abschnitt 8: Verzeichnis-Weg über einen SFTP-Server aus `asyncssh` im Test; Testumgebung um einen SFTP-Server erweitert, Durchgang 2.
- Dokumentation: `docs/technical/pipwerk-relay.md` zu SFTP, `docs/user/pipwerk-relay.md` zu SFTP-Server, Schlüsseln und bekanntem Schlüssel des Servers.

### Nicht-Umfang

- Weg für Dateien über SFTP (`wp04`)

### Umgesetzte Teile der Spezifikation

Abschnitt 8 Durchgang 2, 3.4 Verzeichnis-Weg über SFTP, Abschnitt 7 für SFTP, Abschnitt 8 SFTP in Bibliothek und Testumgebung, Abschnitt 9 für SFTP.

### Abhängigkeiten

`wp01`

### Abnahmekriterien

Voraussetzung: die Einrichtung aus `wp01` und ein SFTP-Server des Betreibers.

1. Der Auftraggeber stellt nach der Anwenderdokumentation die Strecke zwischen den Relays auf ein Verzeichnis auf dem SFTP-Server um.
2. Durchgang 2: Eine Anfrage liefert die Dateien ins Zielverzeichnis des Anfrage-Programms; sie lassen sich in den Datenbestand von pipwerk replay importieren.
3. Ist der SFTP-Server zeitweise nicht erreichbar, wartet die Nachricht in der Warteschlange und wird danach zugestellt. Ein geänderter Schlüssel des Servers bricht die Verbindung ab, mit Vermerk im Protokoll (Spezifikation Abschnitt 8, Durchgang 2).
4. Die Anwenderdokumentation beschreibt SFTP-Server und Schlüssel verständlich und vollständig.

Technische Nachweise im Prüfbericht der QA: Die Prüfskripte von `relay-core`, `pipwerk-relay` und `pipwerk-fetch-mt5` enden mit Exitcode 0 auf dem bereitgestellten Commit, darin die Tests nach Abschnitt 8 für SFTP und Durchgang 2 in der Testumgebung. Positive Testberichte beider Tester liegen vor.

## wp03 – Übertragungsweg Matrix

### Ziel

Alle Strecken laufen über Matrix. Der Anwender verfolgt den Austausch im Chat.

### Umfang

- Matrix-Weg `matrix` in `packages/relay-core` (3.4) mit Anlagen im Medienspeicher und Lesen ab der gemerkten Stelle.
- Sicherheit nach Abschnitt 7 für Matrix (HTTPS mit Prüfung des Zertifikats, Zugriffsschlüssel nur im Verzeichnis für Geheimnisse); Prüfung von `httpx` und `matrix-synapse` nach Regel 12.
- Tests nach Abschnitt 8: Matrix-Weg gegen eine Nachbildung der Client-Server-API; Testumgebung um einen Matrix-Server (Synapse mit SQLite) erweitert, Durchgang 3.
- Dokumentation: `docs/technical/pipwerk-relay.md` zum Matrix-Weg, `docs/user/pipwerk-relay.md` zu Matrix-Benutzern und Räumen.

### Nicht-Umfang

- Wege für Dateien (`wp04`)
- Ende-zu-Ende-Verschlüsselung von Matrix (req-relay-011)

### Umgesetzte Teile der Spezifikation

Abschnitt 1 Durchgang über Matrix, 3.4 Matrix, Abschnitt 7 für Matrix, Abschnitt 8 Matrix-Weg, Testumgebung mit Matrix-Server und Durchgang 3, Abschnitt 9 für Matrix.

### Abhängigkeiten

`wp01`

### Abnahmekriterien

Voraussetzung: Matrix-Server des Betreibers und die Einrichtung aus `wp01`.

1. Der Auftraggeber legt nach der Anwenderdokumentation die Matrix-Benutzer und Räume an und stellt alle Strecken auf Matrix um.
2. Durchgang 3: Eine Anfrage liefert die Dateien ins Zielverzeichnis des Anfrage-Programms; sie lassen sich in den Datenbestand von pipwerk replay importieren.
3. Im Chat zeigt jede Nachricht eine lesbare Zeile mit Nachrichtenart, Absender, Adressat, Nachrichten-ID und den Namen der Anlagen.
4. Ist der Matrix-Server zeitweise nicht erreichbar oder wird ein Relay hart beendet und neu gestartet, erreicht danach jede Nachricht die Komponente genau einmal (Spezifikation Abschnitt 8, Durchgang 3).
5. Die Anwenderdokumentation beschreibt Matrix-Benutzer, Räume und Umstellung verständlich und vollständig.

Technische Nachweise im Prüfbericht der QA: Die Prüfskripte von `relay-core`, `pipwerk-relay` und `pipwerk-fetch-mt5` enden mit Exitcode 0 auf dem bereitgestellten Commit, darin die Tests nach Abschnitt 8 für den Matrix-Weg und Durchgang 3 in der Testumgebung. Positive Testberichte beider Tester liegen vor.

## wp04 – Dateien über einen Weg für Dateien

### Ziel

Große Dateien gehen über einen Weg für Dateien, die Nachrichten über Matrix. Jede Verbindung wählt nach ihrer Schwelle.

### Umfang

- Schnittstelle „Weg für Dateien“ mit Anmeldung über Einstiegspunkte, Weg `filestore` im Dateisystem und über SFTP, Feld `stored`, Wahl nach Schwelle, Prüfung, Entfernen nach Quittieren und nach Frist, `too_large` für beide Wege (3.3, 3.6, 4.1 Schritte 1 und 7).
- Wege für Dateien in der Betriebskonfiguration (4.2, 4.3, 4.5 mit Platz auf einem Weg für Dateien) und in `relay-config.schema.json`; Abschnitt `[relay.file_way]` von `pipwerk-fetch-mt5` (6.1).
- Sicherheit nach Abschnitt 7 für Orte aus `stored`.
- Tests nach Abschnitt 8: Dateien einer Nachricht, Wege als Erweiterung mit einem Test-Weg für Dateien; Durchgang 4 in der Testumgebung.
- Dokumentation: `docs/technical/pipwerk-relay.md` zu Wegen für Dateien, `docs/user/pipwerk-relay.md` zu Weg für Dateien und Schwelle; Glossar: Weg für Dateien.

### Nicht-Umfang

- weitere Wege für Dateien außer `filestore`

### Umgesetzte Teile der Spezifikation

Abschnitt 8 Durchgang 4, 3.3 `stored`, 3.6, 4.1 bis 4.5 für Wege für Dateien, Abschnitt 5 für Wege für Dateien, 6.1 `[relay.file_way]`, Abschnitt 7 für Wege für Dateien, Abschnitt 8 Dateien einer Nachricht und Test-Weg für Dateien, Abschnitt 9 für Wege für Dateien.

### Abhängigkeiten

`wp02` (SFTP), `wp03` (Matrix)

### Abnahmekriterien

Voraussetzung: die Einrichtung aus `wp03` und ein SFTP-Server des Betreibers.

1. Der Auftraggeber stellt nach der Anwenderdokumentation auf jeder Strecke einen Weg für Dateien auf dem SFTP-Server mit einer Schwelle ein.
2. Durchgang 4: Eine Anfrage mit Ticks liefert alle Dateien ins Zielverzeichnis des Anfrage-Programms. Dateien über der Schwelle liegen unterwegs auf dem SFTP-Server, die übrigen erscheinen als Anlage im Chat. Die Dateien lassen sich in den Datenbestand von pipwerk replay importieren.
3. Nach der Lieferung liegen keine Dateien der Anfrage mehr auf dem SFTP-Server.
4. Die Anwenderdokumentation beschreibt Weg für Dateien und Schwelle verständlich und vollständig.

Technische Nachweise im Prüfbericht der QA: Die Prüfskripte von `relay-core`, `pipwerk-relay` und `pipwerk-fetch-mt5` enden mit Exitcode 0 auf dem bereitgestellten Commit, darin die Tests nach Abschnitt 8 für Dateien einer Nachricht und Durchgang 4 in der Testumgebung. Positive Testberichte beider Tester liegen vor.

## wp05 – Web-API des Relays

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
| 1 Nachweis | `wp01` (Verzeichnisse), `wp03` (Matrix) |
| 2 E1, E4 bis E7 | `wp01` |
| 2 E2 | `wp01` (Wege ohne Port), `wp05` (Web-API) |
| 2 E3 | `wp05`; Installation `wp01` |
| 3.1 bis 3.3 | `wp01`; `stored` `wp04` |
| 3.4 | `wp01` (Schnittstelle, Erweiterungen, Verzeichnis-Weg im Dateisystem), `wp02` (Verzeichnis-Weg über SFTP), `wp03` (Matrix), `wp05` (Weg `http` nach E3) |
| 3.5, 3.7 | `wp01` |
| 3.6 | `wp04` |
| 4.1 bis 4.5 | `wp01`; Wege für Dateien `wp04` |
| 5 | `wp01`; Wege für Dateien `wp04`; `openapi.json` `wp05` |
| 6.1 bis 6.3 | `wp01`; `[relay.file_way]` `wp04` |
| 7 | `wp01` bis `wp05` je nach Teil |
| 8 Prüfkomponente, Störungen | `wp01` |
| 8 Durchgänge | `wp01` (1), `wp02` (2), `wp03` (3), `wp04` (4) |
| 8 übrige Tests | `wp01` bis `wp05` je nach Teil |
| 9 | `wp01` bis `wp05` je nach Teil |
| 10 | über die dort genannten Abschnitte |

## Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-23 | Plan angelegt: vier Pakete. `wp01` auf dem von der QA geprüften Stand von `backtest/wp02`, `wp02` und `wp04` nach `wp01`, `wp03` nach `wp02`. Prüfung bestanden in [plan-1.md](reviews/plan-1.md). |
| 2026-10-23 | Hinweise aus [plan-1.md](reviews/plan-1.md) (bestanden) ohne weitere Prüfung eingearbeitet: H1 Empfangsbestätigung im technischen Nachweis von `wp01`; H2 Weg `http` in der Abdeckung von 3.4; H3 Sicherheit in `wp01` ohne Matrix und Web-API; H4 Prüfung nach Regel 12 in `wp01` und `wp04`; H5 Übernahme von `wp02`, `wp03` und `wp04` (Übersicht). |
| 2026-10-24 | Nach dem Einwand des Auftraggebers zur Präsentation [plan-1.html](presentations/plan-1.html) (Festlegung in `scope.md`, Stand 2026-10-24): `wp01` weist die Grundmechanik nur mit Verzeichnissen im Dateisystem nach, zwischen den Rechnern über ein Netzlaufwerk, mit Abnahmekriterien zur Robustheit unter Störungen und zur Empfangsbestätigung über die Prüfkomponente (Spezifikation Abschnitt 8). SFTP neues Paket `wp02`; Matrix wird `wp03`, Wege für Dateien `wp04` nach `wp02` und `wp03`, Web-API `wp05`. Durchgänge nach der neuen Nummerierung der Spezifikation. Abnahmekriterium zur Robustheit auch in `wp02` und `wp03`. Prüfung bestanden in [plan-2.md](reviews/plan-2.md). |
| 2026-10-24 | Hinweise aus [plan-2.md](reviews/plan-2.md) (bestanden) ohne weitere Prüfung eingearbeitet: H1 in `wp01` Kriterien 4 und 6 die anzeigende Komponente genannt; H2 falscher Schlüssel und erneute Bestätigung in Kriterium 5; H3 Herbeiführen der Störungen in der Anwenderdokumentation (Kriterium 8); H6 Prüfkomponente im Glossar. H4 und H5 betreffen die Spezifikation (dort eingearbeitet). |
