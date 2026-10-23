# Spezifikation Vorhaben relay

## Status

- status: `draft`
- stand: 2026-10-23
- komponenten: `packages/relay-core` (neu, gemeinsame Bibliothek für Nachricht und Übertragungswege), `components/pipwerk-relay` (neu, das Relay), `components/pipwerk-fetch-mt5` (Abruf über pipwerk relay, Anfrage-Programm), `contracts/messages/`
- grundlage: [scope.md](scope.md) mit den dort genannten Dokumenten des Auftraggebers. Nachprüfung der Dokumente nach der Abstimmung der Spezifikation bestanden in [requirements-4.md](reviews/requirements-4.md), Nachprüfung von req-relay-013 bestanden in [requirements-5.md](reviews/requirements-5.md).
- stand der arbeit: Fassung nach den Einwänden des Auftraggebers zur [Präsentation](presentations/specification-1.html) (Änderungsnachweis), Prüfung durch die QA bestanden in [specification-4.md](reviews/specification-4.md), Hinweise eingearbeitet. Ergänzung um req-relay-013 (3.7) in Prüfung durch die QA.

## 1. Gegenstand

Das Nachrichtensystem pipwerk relay nach den Anforderungen an das Nachrichtensystem (req-relay-001 bis req-relay-013) mit den ersten Übertragungswegen Matrix und Verzeichnisse („Dateien“ in req-relay-004), Dateien einer Nachricht als Anlage oder über einen Weg für Dateien (req-relay-012), Empfangsbestätigung auf Wunsch des Absenders (req-relay-013), und als erster Anwendungsfall der Austausch mit dem Abruf für MetaTrader 5 (req-relay-007).

Nachweis (`scope.md`): Eine Anfrage mit Broker, Symbol, Zeiteinheit und Zeitraum geht vom Anfrage-Programm (Abschnitt 6.3) über pipwerk relay an den Abruf auf dem Rechner von MetaTrader 5. Die Dateien kommen an die Adresse des Anfrage-Programms zurück. Das gelingt in einem Durchgang über Matrix und in einem Durchgang über Verzeichnisse (Abschnitt 8).

Nicht Gegenstand: der Anschluss des Strategietesters an den Abruf, automatisch und von Hand, und das Ende der Übergangslösung nach req-system-027 (beides Vorhaben `backtest`, req-relay-007; dieses Vorhaben ändert den Strategietester nicht), Nachrichten des Handelssystems, eine Oberfläche des Relays (req-system-008), Prioritäten mit Wirkung (req-relay-009, offen), Verschlüsselung (req-relay-011, offen), weitere Übertragungswege wie E-Mail.

## 2. Architekturentscheidungen

- E1 Bibliothek und Programm getrennt. Die Bibliothek `packages/relay-core` (Paket `pipwerk_relaycore`) enthält Adresse, Nachricht, Format auf dem Übertragungsweg, Schutz gegen Fälschung und die Übertragungswege. Sie verwenden das Relay und jede Komponente, die Nachrichten sendet oder empfängt. Das Relay ist das eigenständige Programm `components/pipwerk-relay` (Paket `pipwerk_relay`). Grund: Auch zwischen Komponente und Relay läuft ein austauschbarer Übertragungsweg (req-relay-002); Komponente und Relay müssen dieselben Wege sprechen. Komponenten binden die Bibliothek wie `pipwerk-marketdata` als Pfadabhängigkeit mit festgeschriebener Version ein (req-system-006).
- E2 Wege ohne offenen Port. Die Übertragungswege Matrix und Verzeichnisse und der Weg für Dateien bauen nur ausgehende Verbindungen auf (Matrix: HTTPS zum Matrix-Server; Verzeichnisse: lokales Verzeichnis oder SFTP-Server). Einen Port öffnet nur die Web-API des Relays nach E3, und nur, wenn die Startkonfiguration sie einschaltet. Der Abruf öffnet keinen Port. Grund: Die Wege brauchen keinen, und Netzzugriffe werden auf das Nötige begrenzt (Sicherheitsregel 8.2 Nr. 7 der Entwicklungsregeln); die Erreichbarkeit der Web-API ist konfigurierbar (req-system-011). Auf dem Rechner von MetaTrader 5 kann der Betreiber das Relay so ohne Dienst im Netz betreiben.
- E3 Web-API des Relays (req-system-009, Befund N2 aus `specification-2.md`, entschieden nach „Rein technische Streitpunkte“). `pipwerk-relay` ist die Hauptkomponente Nachrichtensystem (req-system-001). Ihre Funktionen für eine externe Nutzung sind Senden, Empfangen und der Stand der Warteschlange. Das Relay stellt sie über eine HTTP-Web-API unter `/api/v1/` bereit, beschrieben unter `contracts/api/pipwerk-relay/v1/openapi.json`, mit FastAPI wie pipwerk Studio:
  - Umschlag an das Relay übergeben, als angeschlossene Komponente (Format nach 3.3, geprüft wie jeder Eingang nach 4.1),
  - für eine angeschlossene Komponente bereitliegende Umschläge mit Anlagen abholen und quittieren,
  - Stand der Warteschlange ohne Inhalt.
  Für Komponenten ist die Web-API der Übertragungsweg `http` (Umsetzung auf der Seite der Komponente in `relay-core`, angemeldet nach 3.4). Jede Anfrage ist mit dem Schlüssel der Verbindung der Komponente geprüft (HMAC über Methode, Pfad, Zeitpunkt und Inhalt, mit Schutz gegen Wiederholung; Einzelheiten im Auftrag); ohne gültigen Prüfwert antwortet die Web-API nichts außer einem Fehler ohne Einzelheiten. Adresse und Port stehen in der Startkonfiguration; ohne sie läuft keine Web-API. Prüfung des Kopfs `Host` wie pipwerk Studio. Bis zur Anmeldung nach req-system-011 nur im Netz des Betreibers erreichbar: Ohne Angabe einer Adresse bindet die Web-API nur an `127.0.0.1`; eine andere Adresse muss der Betreiber ausdrücklich eintragen, und er sorgt dafür, dass sie nur in seinem Netz erreichbar ist (Hinweis H1 aus `specification-3.md`). Verwaltet wird das Relay vom Betreiber an der Befehlszeile (Abschnitt 4.5). Das Relay ist eigenständig installierbar wie `pipwerk-fetch-mt5`, mit uv und festgeschriebenen Versionen (Regel 6 der Entwicklungsregeln).
- E4 Zustellung mindestens einmal, Wiederholung erkennbar. Eine Nachricht gilt beim Relay erst als angenommen, wenn sie in seiner Warteschlange gespeichert ist; erst dann entfernt es sie vom Eingang. Aus der Warteschlange entfernt es sie erst, wenn der nächste Weg die Übergabe bestätigt hat. Fällt etwas dazwischen aus, kann eine Nachricht doppelt ankommen. Relay und Bibliothek verwerfen eine Wiederholung, die sie in einer einstellbaren Frist schon gesehen haben (Voreinstellung 7 Tage): die Bibliothek eine Nachrichten-ID, das Relay eine Übergabe nach 4.1 Schritt 4. Grund: Nach einem Absturz geht keine Nachricht verloren, und eine Wiederholung wird nicht zweimal verarbeitet.
- E5 Schutz je Verbindung. Jede Verbindung (Komponente mit ihrem Relay, Relay mit Relay) hat einen eigenen geheimen Schlüssel. Wer eine Nachricht auf einen Weg legt, berechnet über sie einen Prüfwert HMAC-SHA256 mit dem Schlüssel dieser Verbindung. Der Empfänger prüft ihn und verwirft die Nachricht, wenn er nicht stimmt (req-relay-010). Grund: Eine einfache Prüfsumme erkennt nur zufällige Veränderung; eine Fälschung kann sie mit berechnen (Hinweis H6 aus `requirements-1.md`). Ein Schlüssel je Verbindung hält einen bekannt gewordenen Schlüssel auf eine Verbindung beschränkt. Der Prüfwert steht außerhalb der Nachricht, eine spätere Verschlüsselung (req-relay-011) bleibt möglich. Die Relays eines pipwerk-Netzes betreibt der Betreiber; ihnen wird vertraut. Ein Schutz von Absender zu Empfänger über alle Relays hinweg ist nicht Gegenstand; der Aufbau verhindert ihn nicht und er kann mit der Verschlüsselung folgen (Hinweis H6 aus `specification-1.md`).
- E6 Speicher. Warteschlange, gesehene Nachrichten-IDs und Betriebskonfiguration des Relays liegen in einer Datenbank über SQLAlchemy mit Alembic (req-system-015, req-system-016), Anlagen in einem Verzeichnis. Datenbank und Verzeichnis nennt die Startkonfiguration `pipwerk-relay.ini` (req-system-017, req-system-018). Geheimnisse (Schlüssel der Verbindungen, Zugang zu Matrix und SFTP) liegen als Dateien in einem Verzeichnis für Geheimnisse, das die Startkonfiguration nennt; Datenbank und Betriebskonfiguration nennen nur den Dateinamen. Grund: Eine Sicherung oder Ausgabe der Datenbank enthält dann keine Geheimnisse.
- E7 Plattformen. Relay und Bibliothek laufen unter Windows und Linux. Grund: Der Abruf läuft auf dem Rechner von MetaTrader 5, also unter Windows, und braucht dort ein Relay (req-relay-001). Installation wie `pipwerk-fetch-mt5` mit uv und Skripten für Windows.

## 3. Bibliothek relay-core

### 3.1 Adresse

`<laufende Komponente>.<pipwerk-Netz>.<zuständiges Relay>` (req-relay-005). Jeder Teil besteht aus 1 bis 63 Buchstaben, Ziffern, `-` und `_`, beginnt mit einem Buchstaben oder einer Ziffer und enthält keinen Punkt. Grund: Der Punkt trennt die Teile (Hinweis N2 aus `requirements-2.md`); die Teile kommen in Dateinamen des Verzeichnis-Wegs vor. Groß- und Kleinschreibung zählen.

Die Namen vergibt der Betreiber (N2): den Namen der laufenden Komponente in ihrer Konfiguration und beim Anschluss an ihr Relay (4.2), den Namen des pipwerk-Netzes und des Relays in der Betriebskonfiguration des Relays. Das Relay selbst sendet Meldungen mit der Adresse `relay.<pipwerk-Netz>.<Relay>`; der Name `relay` ist deshalb an jedem Relay für Komponenten gesperrt.

### 3.2 Nachricht

Felder nach req-grund-004, Schema `contracts/messages/v1/message.schema.json`:

| Feld | Inhalt |
|---|---|
| `id` | Nachrichten-ID, UUID, vom Absender vergeben |
| `sender`, `recipient` | Adressen nach 3.1 |
| `priority` | Priorität. Die Werte sind offen (req-relay-009); das Feld nimmt eine Kennung aus 1 bis 32 Kleinbuchstaben, Ziffern, `-` und `_` an, das Relay überträgt sie unverändert und richtet sich nicht nach ihr. Der Abruf verwendet `normal` (Hinweis H9 aus `requirements-1.md`). |
| `kind` | Nachrichtenart, Kennung wie `fetch.request` |
| `content` | Inhalt, ein JSON-Objekt nach dem Schema der Nachrichtenart |
| `reference_id` | Bezug-Nachrichten-ID, wahlweise |
| `created_at` | Zeitpunkt der Erstellung, UTC |
| `attachments` | Anlagen, wahlweise: je Anlage Name, Größe in Byte und SHA-256 |
| `receipt` | Empfangsbestätigung gewünscht, ja oder nein, ohne Angabe nein (req-relay-013, 3.7) |

Anlagen sind die Dateien, die zur Nachricht gehören (req-relay-012), zum Beispiel die Dateien einer Lieferung (Hinweis H2 aus `requirements-1.md`). Der Inhalt nennt sie über ihren Namen. Übertragen werden sie als Anlage über den Übertragungsweg oder über einen Weg für Dateien (3.6); jede empfangende Seite prüft Größe und SHA-256. Weil beide im geschützten Teil stehen (3.3), ist auch eine veränderte Anlage erkannt. Name einer Anlage: 1 bis 128 Zeichen aus Buchstaben, Ziffern und `. _ # + -`, nicht mit einem Punkt am Anfang. Er wird nie als Pfad verwendet.

### 3.3 Format auf dem Übertragungsweg

Auf jedem Weg liegt ein Umschlag (Schema `contracts/messages/v1/envelope.schema.json`):

- `format`: `pipwerk-relay/1`
- `body`: Text mit dem JSON der Nachricht, der Liste `hops` der Relays, über die sie bisher lief (`<pipwerk-Netz>.<Relay>`), und wahlweise der Liste `stored` der Anlagen, die auf dieser Verbindung über den Weg für Dateien gehen (3.6)
- `link`: `from` (Name der sendenden Seite der Verbindung: Name der Komponente oder `<pipwerk-Netz>.<Relay>`), `to` (empfangende Seite), `mac` (HMAC-SHA256 über die Bytes von `from`, `to` und `body`, hexadezimal)

Der Prüfwert wird über den Text gebildet, nicht über ein neu geordnetes JSON. Grund: So braucht kein Empfänger, auch nicht einer in einer anderen Sprache, dieselbe Schreibweise des JSON nachzubilden (req-system-010). Jedes Relay prüft `mac` mit dem Schlüssel der Verbindung `from`, ergänzt `hops` und bildet für den nächsten Weg einen neuen Umschlag mit dem `stored` dieser Verbindung.

### 3.4 Übertragungswege

Ein Übertragungsweg ist eine Umsetzung der Schnittstelle „Weg“ mit: Umschlag mit Anlagen an ein Ziel übergeben (mit Bestätigung), eingegangene Umschläge mit Anlagen aus einem Eingang lesen, einen gelesenen Umschlag nach dem Speichern quittieren. Ziel und Eingang beschreibt der Weg mit eigenen Angaben. Jeder Weg hat eine einstellbare Höchstgröße für Umschlag und Anlagen. Anlagen, die über einen Weg für Dateien gehen (3.6), überträgt der Übertragungsweg nicht.

Eigene Angaben eines Wegs (Befund N1 aus `specification-2.md`, entschieden nach „Rein technische Streitpunkte“): Überall, wo eine Konfiguration einen Weg nennt, steht neben seinem Namen ein Block mit seinen eigenen Angaben. In der Betriebskonfiguration des Relays ist das das Objekt `settings` jedes Eingangs, jedes Ziels einer angeschlossenen Komponente und jedes Eintrags im Adressbuch; das Schema `relay-config.schema.json` lässt darin beliebige Felder zu. In einer Startkonfiguration im INI-Format ist es ein eigener Abschnitt, bei `pipwerk-fetch-mt5` `[relay.way]` neben `[relay]`. Diese Blöcke sind von „zusätzliche Felder ablehnen“ (Abschnitt 5) und „unbekannte Einträge abweisen“ (6.1) ausgenommen: Bibliothek, Relay und Komponente reichen sie unverändert an den Weg weiter. Der Weg prüft sie selbst streng mit seinem eigenen Modell und lehnt unbekannte Angaben ab; ein Fehler nennt den Eintrag, nie seinen Wert. Grund: Nur so braucht ein neuer Weg weder ein geändertes Schema noch eine geänderte Prüfung der Komponente (req-relay-003), und die strenge Prüfung bleibt erhalten, nur an der Stelle, die die Angaben kennt.

Wege sind Erweiterungen (req-relay-003, Befund B2 aus `specification-1.md`): Jeder Weg meldet sich über einen Python-Einstiegspunkt der Gruppe `pipwerk_relay.ways` unter seinem Namen an. Bibliothek, Relay und Komponenten kennen keinen Weg im Code; sie laden den Weg, dessen Namen die Konfiguration nennt. Ein weiterer Weg ist ein eigenes Paket. Der Betreiber nimmt es als zusätzliche Abhängigkeit in die Installation von Relay oder Komponente auf, mit festgeschriebener Version in der Sperrdatei dieser Installation (Hinweis H3 aus `specification-2.md`; das Verfahren beschreibt die Anwenderdokumentation). Code von Komponenten, Relay und vorhandenen Wegen bleibt dabei unverändert; die Konfiguration nennt den neuen Namen und seine Angaben. Matrix und der Verzeichnis-Weg sind auf dieselbe Weise angemeldet, liegen aber in der Bibliothek, weil jede Installation sie braucht (req-relay-004). Die Schnittstelle „Weg“ ist versioniert; eine Änderung, die vorhandene Wege bricht, ist eine neue Version neben der alten.

Matrix (`matrix`, req-relay-004):

- Jede Seite (Relay oder Komponente) ist ein eigener Benutzer auf dem Matrix-Server des Betreibers. Ziel und Eingang sind Räume. Zugang mit einem Zugriffsschlüssel des Benutzers aus dem Verzeichnis für Geheimnisse.
- Ein Umschlag ist ein Ereignis `m.room.message`. Sein Text ist eine lesbare Zeile mit Nachrichtenart, Absender, Adressat, Nachrichten-ID und den Namen der Anlagen, damit der Anwender den Austausch im Chat mitverfolgen kann (req-relay-004). Der Umschlag selbst steht in einem eigenen Feld des Ereignisses.
- Anlagen werden in den Medienspeicher des Matrix-Servers geladen; der Umschlag nennt ihre Medien-Adresse. Die Höchstgröße einer Anlage muss zur Grenze des Matrix-Servers passen; der Betreiber stellt beide ein.
- Quittieren: Ereignisse bleiben im Raum stehen, damit der Anwender den Verlauf sieht. Der Leser liest seine Eingangsräume über die Synchronisation der Client-Server-API mit einem Filter auf diese Räume und merkt sich je Matrix-Benutzer die Stelle, bis zu der er alles gespeichert hat (Zeichen `next_batch` der Synchronisation, Hinweis H2 aus `specification-2.md`). Er speichert sie erst nach den gelesenen Nachrichten. Nach einem Neustart liest er ab dieser Stelle weiter. Was dabei doppelt kommt, verwirft E4.
- Umsetzung über die Client-Server-API von Matrix mit `httpx`, ohne weitere Matrix-Bibliothek. Grund: Gebraucht werden nur Senden, Lesen eines Raums und Medien; Ende-zu-Ende-Verschlüsselung von Matrix ist nicht nötig (req-relay-011).
- Nur HTTPS mit Prüfung des Zertifikats. Unverschlüsseltes HTTP nur zu `localhost` und nur mit ausdrücklicher Einstellung, für Tests.

Verzeichnisse (`files`, in req-relay-004 „Dateien“, Hinweis H3 aus `requirements-1.md`; Hinweis H1 aus `requirements-4.md`: Die Spezifikation nennt diesen Übertragungsweg „Verzeichnis-Weg“, damit er nicht mit den Dateien einer Nachricht verwechselt wird):

- Ziel und Eingang sind Verzeichnisse: ein Verzeichnis im Dateisystem des Rechners (auch ein vom Betreiber eingebundenes Netzlaufwerk) oder ein Verzeichnis auf einem SFTP-Server (Rechner, Port, Benutzer, Pfad; Schlüssel und bekannter Schlüssel des Servers aus dem Verzeichnis für Geheimnisse). Ein unbekannter oder geänderter Schlüssel des Servers bricht die Verbindung ab.
- Je Umschlag eine Datei `<Nachrichten-ID>.json`, je Anlage `<Nachrichten-ID>.<Nummer>.att`. Geschrieben wird unter einem vorläufigen Namen und dann umbenannt, die Anlagen vor dem Umschlag. Ein Leser sieht so nie einen halben Umschlag und findet zu jedem Umschlag seine Anlagen. Nach dem Quittieren entfernt der Leser die Dateien.
- SFTP mit `asyncssh`. Grund: Die Bibliothek bietet Client und Server; der Server dient den Tests und der Testumgebung. Lizenz und Wartungszustand prüft der Auftrag (Regel 12 der Entwicklungsregeln).

Zwischen Relays auf verschiedenen Rechnern braucht der Verzeichnis-Weg ein gemeinsames Verzeichnis: einen SFTP-Server oder ein Netzlaufwerk, das der Betreiber bereitstellt.

### 3.5 Anschluss einer Komponente

Die Bibliothek bietet Komponenten einen Anschluss mit: eigene Adresse, Weg und Angaben zu Ziel (Eingang des Relays) und Eingang (wo das Relay für die Komponente ablegt), Schlüssel der Verbindung, wahlweise Weg für Dateien mit Schwelle (3.6). Er sendet Nachrichten mit Anlagen und liefert empfangene Nachrichten mit geprüften Anlagen, ohne Wiederholungen (E4). Woher eine Komponente diese Angaben nimmt, legt die Komponente fest (Hinweis H2 aus `requirements-3.md`); bei `pipwerk-fetch-mt5` ist es die Startkonfiguration (6.1).

### 3.6 Dateien einer Nachricht (req-relay-012)

Jede Verbindung (Komponente mit ihrem Relay, Relay mit Relay) überträgt die Anlagen einer Nachricht auf eine von zwei Arten:

1. als Anlage über den Übertragungsweg der Verbindung (3.4),
2. über einen Weg für Dateien. Die sendende Seite legt die Datei dort ab, der Weg vergibt einen Ort. Der Umschlag nennt in `stored` je so übertragener Anlage ihren Namen, den Namen des Wegs für Dateien und den Ort (req-relay-012: „Die Nachricht nennt dann, wo die Datei liegt“).

Wann welche Art: Je Verbindung nennt die Konfiguration wahlweise einen Weg für Dateien mit seinen eigenen Angaben und eine Schwelle in Byte; mit einem Weg für Dateien ist die Schwelle Pflicht. Anlagen über der Schwelle gehen über den Weg für Dateien, die übrigen als Anlage. Ohne Weg für Dateien gehen alle Anlagen als Anlage. Übersteigt eine Anlage die Höchstgröße des Wegs, über den sie gehen soll, Übertragungsweg oder Weg für Dateien, ist die Nachricht unzustellbar mit Grund `too_large` (4.1 Schritt 7). Grund: Was eine Verbindung tragen kann, hängt von ihren Wegen ab, zum Beispiel begrenzt ein Matrix-Server die Größe von Medien, ein SFTP-Server nur der Speicherplatz. Der Absender kennt die Wege hinter seinem Relay nicht. Deshalb entscheidet jede Verbindung für sich; Name, Größe und SHA-256 der Anlage in der Nachricht bleiben auf dem ganzen Weg gleich.

Wer überträgt (Hinweis H3 aus `requirements-4.md`): immer die sendende Seite einer Verbindung, also die Bibliothek im Anschluss der Komponente (3.5) oder das Relay. Eine Komponente nutzt nur den Weg für Dateien der Verbindung mit dem Relay ihres Rechners (req-relay-001).

Wer prüft (Hinweis H2 aus `requirements-4.md`): jede empfangende Seite, also jedes Relay unterwegs und zuletzt der Anschluss der empfangenden Komponente (req-relay-010, req-relay-012). Sie holt jede Anlage aus `stored` vom Weg für Dateien der Verbindung, die sich aus `link.from` ergibt, prüft Größe und SHA-256 gegen die Nachricht und speichert sie wie eine Anlage. Nennt `stored` einen anderen Weg für Dateien als den der Verbindung, fehlt die Datei oder stimmen Größe oder SHA-256 nicht, wird der Umschlag verworfen wie nach 4.1 Schritt 1. `stored` steht im `body` und ist damit durch `mac` geschützt. Die Dateien holt sie erst nach der Prüfung auf Wiederholung (4.1 Schritt 4); eine Wiederholung wird ohne Holen der Dateien verworfen und quittiert. Erst nach dem Speichern und Quittieren des Umschlags entfernt die empfangende Seite die Datei vom Weg für Dateien, bei einem verworfenen Umschlag sofort. Die sendende Seite legt alle Dateien ab, bevor sie den Umschlag übergibt. Dateien, die nach einer einstellbaren Frist (Voreinstellung 7 Tage wie E4) noch auf dem Weg für Dateien liegen, entfernt die empfangende Seite; der Platz auf einem Weg für Dateien ist einstellbar begrenzt (4.5).

Ein Weg für Dateien ist eine Umsetzung der Schnittstelle „Weg für Dateien“ mit: Datei ablegen (liefert den Ort), Datei an einem Ort lesen, Datei an einem Ort entfernen. Eigene Angaben, Prüfung, Anmeldung als Erweiterung über einen Einstiegspunkt (Gruppe `pipwerk_relay.file_ways`) und Versionierung wie bei den Übertragungswegen (3.4). Beide Seiten einer Verbindung nennen in ihrer Konfiguration denselben Weg für Dateien mit Angaben, die auf denselben Speicher zeigen.

Erster Weg für Dateien: `filestore`, ein Verzeichnis im Dateisystem oder auf einem SFTP-Server, umgesetzt wie der Verzeichnis-Weg (3.4). Der Ort ist ein Dateiname, den der Weg aus der Nachrichten-ID, der Nummer der Anlage und einem Zufallsteil bildet; geschrieben wird unter einem vorläufigen Namen und dann umbenannt. Der Weg nimmt beim Lesen und Entfernen nur Orte an, die diesem Aufbau entsprechen (Abschnitt 7). Damit lassen sich zum Beispiel Nachrichten über Matrix und große Dateien über einen SFTP-Server übertragen.

### 3.7 Empfangsbestätigung (req-relay-013)

Die Empfangsbestätigung ist eine Aufgabe des Anschlusses (3.5) auf beiden Seiten. Das Relay behandelt sie wie jede Nachricht und prüft nicht, ob eine Komponente eine Nachricht abholt (req-relay-013 Absatz 2).

- Absender: Die Komponente setzt beim Senden je Nachricht `receipt` (3.2) und wahlweise eine Frist. Ohne Frist gilt die Voreinstellung des Anschlusses (einstellbar, Voreinstellung 1 Stunde). Die Frist steht nicht in der Nachricht; nur der Absender braucht sie.
- Empfänger: Der Anschluss übergibt die Nachricht der Komponente. Meldet die Komponente, dass sie die Nachricht gespeichert hat, schickt der Anschluss ohne weiteres Zutun der Komponente eine Nachricht `relay.receipt` an die Adresse des Absenders: Absender ist die Adresse der empfangenden Komponente, Bezug-Nachrichten-ID die ID der bestätigten Nachricht (req-grund-006), Inhalt leer, Priorität wie die bestätigte Nachricht, `receipt` nein. Erst danach quittiert er den Eingang. Kommt eine Nachricht mit `receipt` als Wiederholung (E4) noch einmal, schickt der Anschluss die Bestätigung erneut, ohne die Nachricht der Komponente noch einmal zu übergeben. Grund: Eine Bestätigung kann verloren gegangen sein; eine zweite schadet nicht, der Absender verwirft sie.
- Warten: Der Anschluss des Absenders merkt sich jede gesendete Nachricht mit `receipt` mit ihrer Frist, so dauerhaft wie die gesehenen Nachrichten-IDs (E4), damit ein Neustart keine offene Bestätigung verliert. Trifft `relay.receipt` mit ihrer ID als Bezug ein, ist sie erledigt. Trifft `relay.undeliverable` zu ihr ein, ist sie ebenfalls erledigt; die Komponente erhält die Meldung nach req-relay-008. Läuft die Frist ab, meldet der Anschluss der Komponente die Nachrichten-ID, Nachrichtenart und Adressat der Nachricht ohne Bestätigung. Die Komponente zeigt das dem Anwender an, so wie eine Meldung nach req-relay-008. Eine spätere Bestätigung wird dann nur im Protokoll vermerkt.
- Ausnahmen: `relay.receipt` und `relay.undeliverable` verlangen nie eine Bestätigung; eine Nachricht `relay.receipt` mit `receipt` ja wird verworfen wie eine ungültige Nachricht. Grund: Sonst entstünden Bestätigungen über Bestätigungen.
- Anfrage: Bei einer Anfrage ist die Antwort die Bestätigung (req-relay-013 Absatz 2). Der Abruf (Abschnitt 6) setzt `receipt` deshalb in keiner seiner Nachrichtenarten; das Anfrage-Programm wartet auf `fetch.result` (6.3).

## 4. Relay

### 4.1 Weg einer Nachricht

1. Das Relay liest seine Eingänge in einstellbaren Abständen. Für jeden Umschlag bestimmt es aus `link.from` die Verbindung und prüft `mac`. Stimmt er nicht, ist die Verbindung unbekannt, oder fehlt eine Anlage oder stimmen ihre Größe oder SHA-256 nicht, gleich auf welcher Art übertragen (3.6), verwirft es den Umschlag und vermerkt das im Protokoll ohne Inhalt (req-relay-010). Eine Meldung nach req-relay-008 schickt es dann nicht. Grund: Der Absender einer gefälschten Nachricht ist nicht verlässlich; eine Meldung ginge an jemanden, der nichts gesendet hat (Hinweis H6 aus `requirements-1.md`).
2. Kommt die Nachricht von einer angeschlossenen Komponente, muss ihr Absender `<Name der Komponente>.<eigenes pipwerk-Netz>.<eigenes Relay>` sein. Sonst wird sie nicht weitergegeben; die Komponente erhält an ihre richtige Adresse eine Meldung nach 4.4 mit Grund `sender_invalid`. Grund: Eine Komponente kann keine Nachricht unter fremder Adresse senden. Weil der Schlüssel die Komponente ausweist, erreicht die Meldung den wirklichen Absender.
3. Schleife (Hinweis H11 aus `requirements-1.md`, Befund B1 aus `specification-1.md`): Steht das eigene Relay schon in `hops`, oder hat `hops` die einstellbare Höchstzahl erreicht (Voreinstellung 8), ist die Nachricht unzustellbar mit Grund `loop`. Grund: Ein Relay trägt sich erst beim Weitergeben in `hops` ein. Eine Wiederholung derselben Übergabe kommt deshalb ohne das eigene Relay in `hops` an, eine Nachricht, die im Kreis gelaufen ist, mit ihm. So unterscheiden sich Schleife und Wiederholung.
4. Wiederholung (E4): Kennzeichen einer Übergabe ist die Nachrichten-ID zusammen mit der Zahl der Einträge in `hops`. Hat das Relay dieses Kennzeichen in der Frist nach E4 schon gesehen, verwirft es den Umschlag und quittiert ihn. Das Relay prüft das vor den Schritten 2 und 3, damit eine wiederholte Übergabe keine zweite Meldung `sender_invalid` oder `loop` erzeugt (Hinweis H1 aus `specification-2.md`). Eine im Kreis gelaufene Nachricht hat mehr Einträge in `hops` als bei ihrem ersten Durchgang und gilt deshalb nicht als Wiederholung (Schritt 3).
5. Sonst speichert das Relay die Nachricht mit Anlagen in der Warteschlange und quittiert den Eingang. Eine Nachricht nach Schritt 3 wird mit ihrer Meldung ebenso gespeichert und dann nicht weitergegeben.
6. Weitergabe nach der Adresse des Adressaten (req-relay-006):
   - Ist das zuständige Relay dieses Relay im eigenen pipwerk-Netz: Zustellung an die angeschlossene Komponente mit diesem Namen. Gibt es sie nicht: unzustellbar mit Grund `unknown_recipient`.
   - Steht `<pipwerk-Netz>.<zuständiges Relay>` im Adressbuch: Übergabe über den dort genannten Weg.
   - Sonst Übergabe an das Standard-Relay. Ist keines eingestellt: unzustellbar mit Grund `unknown_relay`.
7. Scheitert eine Übergabe, versucht das Relay sie in wachsenden Abständen erneut. Gelingt sie nicht innerhalb einer einstellbaren Frist (Voreinstellung 24 Stunden): unzustellbar mit Grund `relay_unreachable` beziehungsweise `recipient_unreachable`. Ist eine Nachricht für einen Weg zu groß: unzustellbar mit Grund `too_large`. Die Fristen sind technische Voreinstellungen; hinnehmbare Laufzeiten bleiben ein offener Punkt der Anforderungen.

Jede Annahme, Weitergabe, Zustellung und Verwerfung steht im Protokoll mit Nachrichten-ID, Nachrichtenart, Absender, Adressat, Weg und Ergebnis, nie mit Inhalt, Anlagen oder Geheimnissen.

### 4.2 Angeschlossene Komponenten

Je angeschlossener Komponente: Name (Teil der Adresse), Weg mit Ziel (wo das Relay für sie ablegt), Datei des Schlüssels der Verbindung, wahlweise Weg für Dateien mit Schwelle (3.6). Die Komponente legt ihre Nachrichten in einem Eingang des Relays ab; welche Komponente gesendet hat, ergibt sich aus `link.from` und dem Schlüssel.

### 4.3 Adressbuch und Standard-Relay

Je Eintrag: pipwerk-Netz und Name des Relays, Weg mit Ziel, Datei des Schlüssels der Verbindung (req-relay-006), wahlweise Weg für Dateien mit Schwelle (3.6). Das Standard-Relay ist ein Eintrag des Adressbuchs, der als solcher gekennzeichnet ist. Das Relay liest Umschläge eines anderen Relays nur, wenn dieses im Adressbuch steht; so kennt es den Schlüssel. Grund: Ohne Schlüssel lässt sich eine Nachricht nicht prüfen (E5). Zwei Relays, die Nachrichten austauschen, tragen sich deshalb gegenseitig ein.

### 4.4 Unzustellbare Nachricht

Das Relay, bei dem die Zustellung scheitert, schickt dem Absender eine Nachricht `relay.undeliverable` (req-relay-008): Absender `relay.<pipwerk-Netz>.<Relay>`, Bezug-Nachrichten-ID die ID der unzustellbaren Nachricht, Inhalt mit Grund (Kennung und fester Text), Adressat und Nachrichtenart der unzustellbaren Nachricht. Gründe (Hinweis H4 aus `specification-2.md`): `sender_invalid` (falscher Absender einer angeschlossenen Komponente, 4.1 Schritt 2), `loop` (Schleife, Schritt 3), `unknown_recipient`, `unknown_relay` (Schritt 6), `relay_unreachable`, `recipient_unreachable`, `too_large` (Schritt 7). Ist eine solche Meldung selbst unzustellbar, wird sie verworfen und im Protokoll vermerkt, ohne neue Meldung (H11). Grund: Sonst könnten Meldungen über Meldungen ohne Ende entstehen.

### 4.5 Konfiguration und Bedienung

- Startkonfiguration `pipwerk-relay.ini` (req-system-016, req-system-017): Verbindung zur Datenbank, Verzeichnis der Anlagen, Verzeichnis für Geheimnisse, Protokoll.
- Betriebskonfiguration in der Datenbank: pipwerk-Netz und Name des Relays, Eingänge mit ihren Wegen, angeschlossene Komponenten (4.2), Adressbuch mit Standard-Relay (4.3), Wege für Dateien mit Schwellen (3.6), Fristen, Abstände und Höchstgrößen. Der Betreiber schreibt sie als JSON-Datei nach `contracts/messages/v1/relay-config.schema.json` und lädt sie mit `pipwerk-relay config load <Datei>`; `pipwerk-relay config show` gibt sie aus. Eine ungültige Datei wird ganz abgelehnt. Ein laufendes Relay übernimmt eine geladene Betriebskonfiguration ohne Neustart.
- Befehle: `pipwerk-relay run` (läuft, bis es beendet wird), `pipwerk-relay config load|show`, `pipwerk-relay key new <Datei>` (erzeugt einen Schlüssel für eine Verbindung im Verzeichnis für Geheimnisse; der Betreiber gibt eine Kopie der anderen Seite), `pipwerk-relay queue` (Nachrichten in der Warteschlange mit Stand, ohne Inhalt), `pipwerk-relay migrate`.
- Begrenzungen gegen Überlast: Größe von Umschlag und Anlagen je Übertragungsweg und je Weg für Dateien, Platz auf einem Weg für Dateien (3.6), Zahl der Nachrichten in der Warteschlange und Platz für Anlagen. Werte legen die Aufträge fest. Ist eine Grenze erreicht, nimmt das Relay aus seinen Eingängen nichts mehr an, bis wieder Platz ist; die Umschläge bleiben im Eingang liegen.

## 5. Nachrichtenformate unter contracts

`contracts/messages/v1/`: `envelope.schema.json`, `message.schema.json`, `relay-config.schema.json`, je Nachrichtenart ein Schema des Inhalts (`relay.undeliverable`, `relay.receipt`, `fetch.request`, `fetch.file`, `fetch.result`), Beispiele. Dazu die Web-API nach E3 unter `contracts/api/pipwerk-relay/v1/openapi.json`. Beschrieben in `contracts/messages/README.md` und in der technischen Dokumentation (req-system-022). Pydantic prüft an jeder Grenze und lehnt zusätzliche Felder ab.

## 6. Abruf über pipwerk relay

### 6.1 Abruf als laufende Komponente

`pipwerk-fetch-mt5` erhält den Befehl `pipwerk-fetch-mt5 serve`. Er läuft auf dem Rechner von MetaTrader 5, bis der Anwender ihn beendet, empfängt über das Relay dieses Rechners Anfragen und beantwortet sie (Hinweis H4 aus `requirements-1.md`). Angaben zum Anschluss (3.5) stehen in einem neuen Abschnitt `[relay]` der Startkonfiguration `pipwerk-fetch-mt5.ini`, die eigenen Angaben eines Wegs für Dateien (3.6) im Abschnitt `[relay.file_way]`, ausgenommen von der Abweisung unbekannter Einträge wie `[relay.way]` (3.4). Der bisherige Aufruf an der Befehlszeile bleibt unverändert. Grund: Er schränkt niemanden ein und bleibt ein Weg ohne Relay.

Folgen für `pipwerk-fetch-mt5` (Hinweise H1 und H2 aus `specification-1.md`), umgesetzt und dokumentiert in diesem Vorhaben: `relay-core` und die Wege kommen als Abhängigkeiten hinzu. Die Zusicherungen „kein Socket, keine Namensauflösung, kein Netzmodul“ gelten weiter für den Aufruf an der Befehlszeile; die Module dieses Aufrufs laden `relay-core` nicht, und die Tests prüfen das für diesen Aufruf. `serve` und `request` verbinden sich nur über den Weg aus `[relay]`. Die Startkonfiguration kennt den Abschnitt `[relay]`; unbekannte Abschnitte und Einträge werden weiter abgewiesen. `server_time_zone` ist Pflicht für den Aufruf an der Befehlszeile und für `serve`, nicht für `request`, weil `request` MetaTrader 5 nicht liest.

Welche laufende Komponente für den Abruf bei einem Broker zuständig ist, nennt der Anfragende aus seiner Konfiguration (req-relay-005).

### 6.2 Nachrichtenarten

Alle Antworten gehen an die Adresse des Absenders der Anfrage, mit deren ID als Bezug-Nachrichten-ID (req-relay-005, req-grund-006). Hinweis H1 aus `requirements-1.md`:

| Nachrichtenart | Inhalt |
|---|---|
| `fetch.request` | `broker` (Name des Handelsservers), `symbol` (Symbol beim Broker), wahlweise `instrument` (Bezeichnung für die Dateien; ohne Angabe gilt das Symbol), `time_units` (Liste von Zeiteinheiten, leer möglich), `ticks` (ja oder nein), `from`, `to` (UTC, `from` eingeschlossen, `to` ausgeschlossen) |
| `fetch.file` | eine Datei als Anlage: Name nach `pipwerk-fetch-mt5`, Art (Zeiteinheit, `TICKS` oder `CONTRACT`), Zahl der Zeilen, ausgelassene Zeilen nach Grund |
| `fetch.result` | Abschluss: Namen aller gelieferten Dateien und je Teil, der sich nicht holen ließ, Art, Zeitraum, Grund (Kennung und Text nach `pipwerk-fetch-mt5`) |

Ablauf: Der Abruf prüft die Anfrage. Ist sie ungültig oder nennt sie einen anderen Broker als den Handelsserver, an dem MetaTrader 5 angemeldet ist, antwortet sie nur mit `fetch.result` mit dem Grund (`request_invalid`, `broker_mismatch`). Sonst holt sie die Teile wie der Aufruf an der Befehlszeile, die Angaben zum Instrument immer mit, schickt jede Datei als eigene Nachricht `fetch.file` und zum Schluss `fetch.result`. Grund für eine Nachricht je Datei: Jede Datei bleibt unter den Grenzen von `pipwerk-fetch-mt5` (`max_rows_per_file`); geht eine Übergabe schief, wird nur diese Datei wiederholt. Ob eine Datei als Anlage oder über einen Weg für Dateien geht, entscheidet jede Verbindung nach 3.6; große Tick-Dateien brauchen auf einer Strecke über Matrix in der Regel einen Weg für Dateien. Einen Zeitraum, der die Grenzen übersteigt, nennt `fetch.result` mit dem Grund `range_too_large`; der Anfragende teilt ihn auf.

Die Dateien nennen die Bezeichnung `instrument`, ohne sie das Symbol. Die Zuordnungstabelle `[symbols]` gilt nur für den Aufruf an der Befehlszeile, weil die Anfrage das Symbol selbst nennt (req-relay-007). Die Bezeichnung, die in Dateinamen und Dateien eingeht, muss den Regeln für Dateinamen von `pipwerk-fetch-mt5` entsprechen, sonst ist die Anfrage `request_invalid`. Ein Symbol mit anderen Zeichen (zum Beispiel einem Leerzeichen) ist also nur mit einer Bezeichnung anzufragen; das Symbol geht dann nur an MetaTrader 5 (Hinweis H3 aus `specification-1.md`). Grund: Dateinamen entstehen nur aus geprüften Teilen (Abschnitt 7).

Der Abruf bearbeitet Anfragen nacheinander. Grund: MetaTrader 5 wird über eine einzige Verbindung gelesen.

### 6.3 Anfrage-Programm

`pipwerk-fetch-mt5 request` ist eine laufende Komponente, die eine Anfrage schickt und die Lieferung empfängt (Hinweis N1 aus `requirements-2.md`). Aufruf mit Adresse des Abrufs, Broker, Symbol, wahlweise Bezeichnung, Zeiteinheiten, Ticks, Zeitraum und Zielverzeichnis; eigene Adresse und Anschluss aus `[relay]` der Startkonfiguration. Es schreibt jede Datei aus `fetch.file` ins Zielverzeichnis, gibt je Datei eine Zeile und am Ende das Ergebnis aus `fetch.result` aus und endet mit den Exitcodes des Aufrufs an der Befehlszeile. Eine Meldung `relay.undeliverable` zeigt es mit Grund an und endet mit Exitcode 1 (req-relay-008). Kommt bis zu einer Wartezeit (Angabe beim Aufruf, Voreinstellung 30 Minuten) kein `fetch.result`, endet es mit einer Meldung und Exitcode 1 (Hinweis H8 aus `requirements-1.md`). Es läuft unter Windows und Linux und braucht das Paket `MetaTrader5` nicht.

Die Dateien lassen sich ohne Änderung in den Datenbestand importieren (req-system-026). Das Anfrage-Programm importiert nicht selbst (Abschnitt 1, Nicht Gegenstand).

## 7. Sicherheit

- Kein Port außer der eingeschalteten Web-API (E2, E3); sie prüft jede Anfrage mit dem Schlüssel der Verbindung, begrenzt Größe und Zahl der Anfragen und gibt Fehler ohne Einzelheiten zurück. Ausgehende Verbindungen nur zu den eingestellten Zielen und Wegen für Dateien: Matrix-Server über HTTPS mit Prüfung des Zertifikats, SFTP-Server mit Prüfung seines Schlüssels.
- Jede eingehende Nachricht wird vor jeder Verarbeitung an Prüfwert, Verbindung, Größe und Schema geprüft (E5, 4.1). Zusätzliche Felder werden abgelehnt.
- Schlüssel, Zugriffsschlüssel von Matrix und Schlüssel für SFTP nur im Verzeichnis für Geheimnisse (E6), nie in Repository, Datenbank, Protokoll oder Fehlermeldung. Das Relay prüft beim Start, dass das Verzeichnis und seine Dateien nur für den eigenen Benutzer lesbar sind, und startet sonst nicht (unter Windows über die Zugriffsrechte, Einzelheiten im Auftrag).
- Namen von Anlagen, Nachrichten-IDs, Adressen und Orte aus `stored` werden nie unmittelbar als Pfad verwendet. Dateien des Verzeichnis-Wegs, des Wegs für Dateien und des Verzeichnisses der Anlagen entstehen nur aus geprüften Teilen; ein Ort, der nicht dem Aufbau seines Wegs für Dateien entspricht, wird abgewiesen (3.6).
- Begrenzungen nach 4.5. Wiederholte Nachrichten nach E4.
- Der Abruf liest nur aus MetaTrader 5 und handelt nie, wie bisher.
- Neue Abhängigkeiten (`httpx`, `asyncssh`, in der Testumgebung `matrix-synapse`) prüft der jeweilige Auftrag auf Lizenz, Wartungszustand, Sicherheitsrisiko und Kopplung (Regel 12 der Entwicklungsregeln). `matrix-synapse` gehört nur zur Testumgebung und wird mit pipwerk nicht ausgeliefert. Die einschlägigen Anforderungen aus BSI-Grundschutz und OWASP ASVS (Eingabeprüfung, Kryptografie, sichere Kommunikation, Umgang mit Geheimnissen, Protokollierung, Konfiguration) nennt die technische Dokumentation von pipwerk relay mit ihrer Umsetzung (Technikregeln 8.3 Nr. 10, Hinweis H8 aus `specification-1.md`).

## 8. Tests und Nachweis

- Bibliothek (pytest): Adresse, Nachricht, Umschlag und Prüfwert mit veränderten und gefälschten Umschlägen und Anlagen, Verzeichnis-Weg über ein lokales Verzeichnis und über einen SFTP-Server aus `asyncssh` im Test, Matrix-Weg gegen eine Nachbildung der Client-Server-API, Anschluss mit Wiederholung.
- Dateien einer Nachricht (3.6): Anlagen unter und über der Schwelle über Matrix und Weg für Dateien `filestore`; ohne Weg für Dateien `too_large`; fehlende, veränderte und mit fremdem Weg oder ungültigem Ort genannte Datei wird verworfen; Datei wird erst nach dem Quittieren entfernt.
- Empfangsbestätigung (3.7): Nachricht mit `receipt` über zwei Relays wird nach dem Speichern bestätigt, mit der ID als Bezug; ohne `receipt` keine Bestätigung; Frist abgelaufen wird der Komponente gemeldet, auch nach einem Neustart des Absenders; unzustellbare Nachricht beendet das Warten ohne zweite Meldung; Wiederholung erzeugt eine zweite Bestätigung ohne zweite Übergabe an die Komponente; `relay.receipt` mit `receipt` ja wird verworfen.
- Wege als Erweiterung: ein Test-Weg und ein Test-Weg für Dateien aus einem eigenen Paket mit eigenen Angaben werden über ihren Einstiegspunkt geladen, ohne Änderung an Bibliothek, Relay, Komponente oder Schema der Betriebskonfiguration (3.4, 3.6).
- Web-API (pytest): Übergeben, Abholen und Stand gegen `openapi.json`, über den Weg `http`; Anfragen ohne, mit falschem und mit wiederholtem Prüfwert werden abgelehnt; ohne Angabe in der Startkonfiguration öffnet das Relay keinen Port (E2, E3).
- Relay (pytest): Weitergabe im eigenen Relay, über das Adressbuch und über eine Kette von Standard-Relays, jeder Grund nach 4.1 mit Meldung, Schleife neben Wiederholung derselben Übergabe, Wiederholung einer Nachricht mit Meldung ohne zweite Meldung, unzustellbare Meldung ohne neue Meldung, verworfene Fälschung ohne Meldung, Wiederanlauf nach Abbruch ohne Verlust (E4), Laden der Betriebskonfiguration, Migration.
- Abruf (pytest): `serve` und `request` über zwei Relays mit der Nachbildung von `MetaTrader5` aus den Tests von `pipwerk-fetch-mt5`, mit gültiger Anfrage, fremdem Broker, ungültiger Anfrage, Teilen mit Grund; die gelieferten Dateien lassen sich mit `pipwerk-marketdata` importieren.
- Testumgebung: zwei Relays, ein Matrix-Server (Synapse aus dem Python-Paket `matrix-synapse` mit SQLite, nur für die Testumgebung) und ein SFTP-Server aus `asyncssh`, `serve` mit der Nachbildung von `MetaTrader5`. Darin läuft der Nachweis für Tester und QA.
- Nachweis durch den Auftraggeber (`scope.md`, Hinweis H1 aus `requirements-3.md`): Auf dem Rechner von MetaTrader 5 laufen ein Relay und `serve`, auf einem zweiten Rechner ein Relay und das Anfrage-Programm. Durchgang 1: alle Strecken über Matrix auf dem Matrix-Server des Betreibers, der Anwender verfolgt den Austausch im Chat. Durchgang 2: alle Strecken über Verzeichnisse, zwischen Komponente und Relay ein Verzeichnis auf dem Rechner, zwischen den Relays ein Verzeichnis auf einem SFTP-Server des Betreibers. Durchgang 3 (req-relay-012): Nachrichten wie in Durchgang 1 über Matrix, eine Anfrage mit Ticks; Dateien über der Schwelle gehen auf jeder Strecke über einen Weg für Dateien auf dem SFTP-Server des Betreibers, die übrigen als Anlage über Matrix. In allen Durchgängen kommen die Dateien beim Anfrage-Programm an und lassen sich im Datenbestand von pipwerk replay importieren.

## 9. Dokumentation

- technische Dokumentation: `docs/technical/pipwerk-relay.md` (neu, Bibliothek und Relay: Aufbau, Formate, Übertragungswege, Wege für Dateien, Weitergabe, Konfiguration, Sicherheit, Betrieb), `docs/technical/pipwerk-fetch-mt5.md` (`serve`, `request`, Abschnitt `[relay]`), `contracts/messages/README.md`, README der Komponenten
- Anwenderdokumentation `docs/user/pipwerk-relay.md` (neu): Relay einrichten unter Windows und Linux, Schlüssel austauschen, Adressbuch, Matrix-Benutzer und Räume, Verzeichnisse und SFTP, Weg für Dateien und Schwelle, Abruf über pipwerk relay mit `serve` und `request`, Meldungen und ihre Gründe, Empfangsbestätigung und ihre Frist
- Glossar: Anlage, Umschlag, Eingang, Warteschlange, Schlüssel der Verbindung, angeschlossene Komponente, Weg für Dateien, Empfangsbestätigung

## 10. Entscheidungen zu Hinweisen der QA

| Hinweis | Entscheidung |
|---|---|
| `requirements-1.md` H1 | Nachrichtenarten des Abrufs mit Fehlern des Abrufs in 6.2 |
| H2 | Dateien als Anlagen (3.2), eine Nachricht je Datei (6.2), Medienspeicher von Matrix (3.4), Weg für Dateien (3.6) |
| H3 | Verzeichnis-Weg: lokales Verzeichnis oder SFTP; Angaben je Eintrag des Adressbuchs (3.4, 4.3) |
| H4 | Abruf läuft mit `serve` dauernd als laufende Komponente (6.1) |
| H5 | erledigt vom Projektleiter (Glossar) |
| H6 | HMAC je Verbindung statt Prüfsumme; bei Fälschung keine Meldung (E5, 4.1) |
| H7 | gehört zu `backtest` (1) |
| H8 | Wartezeit des Anfrage-Programms (6.3), Fristen des Relays (4.1) |
| H9 | Priorität als Kennung, Abruf `normal`, ohne Wirkung (3.2) |
| H10 | Übergangslösung bis zur Festlegung in `backtest` (1) |
| H11 | keine Meldung über eine unzustellbare Meldung (4.4), Schleife über `hops` (4.1) |
| `requirements-2.md` N1 | Anfrage-Programm als Absender (6.3) |
| N2 | Namen vergibt der Betreiber, Zeichen ohne Punkt (3.1) |
| N3 | wie H10 (1) |
| `requirements-3.md` H1 | Nachweis mit allen Strecken je Weg (8) |
| H2 | Angaben zum Anschluss je Komponente (3.5, 6.1) |
| `requirements-4.md` H1 | Übertragungsweg „Verzeichnis-Weg“, getrennt von den Dateien einer Nachricht (3.4) |
| H2 | jede empfangende Seite prüft (3.6) |
| H3 | die sendende Seite jeder Verbindung überträgt (3.6) |
| H4 | Status der Anforderungen, Sache des Projektleiters |
| `specification-4.md` H1 | Schwelle Pflicht mit Weg für Dateien, `too_large` für beide Wege (3.6) |
| H2 | Wiederholung vor dem Holen der Dateien (3.6) |
| H3 | Entfernen bei Verwerfen und nach Frist, Platz begrenzt (3.6, 4.5) |
| H4 | ohne Änderung: `stored` steht im Umschlag, der die Nachricht trägt |
| H5 | Weg für Dateien heißt `filestore` (3.6, 8) |
| `requirements-5.md` H1 | eine Bestätigung wird nie bestätigt (3.7) |
| H2 | Frist je Nachricht vom Absender, sonst Voreinstellung des Anschlusses; Antwort auf eine Anfrage mit eigener Wartezeit (3.7, 6.3) |
| H3 | Kennzeichen `receipt` in der Nachricht (3.2) |

## Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-23 | Erstfassung. |
| 2026-10-23 | Nach dem Prüfbericht [specification-1.md](reviews/specification-1.md): B1 Schleife vor Wiederholung geprüft (4.1 Schritt 3); B2 Wege als Erweiterungen über Einstiegspunkte (3.4, 8). Hinweise: H1, H2 Folgen für `pipwerk-fetch-mt5` (6.1); H3 Bezeichnung und Symbol (6.2); H4 Quittieren bei Matrix (3.4); H5 Meldung `sender_invalid` (4.1 Schritt 2); H6 Vertrauen in die Relays (E5); H7 Hauptkomponente und Installation (E2, E3); H8 Abhängigkeiten, BSI und OWASP (7). H9 ohne Änderung. |
| 2026-10-23 | Nach dem Prüfbericht [specification-2.md](reviews/specification-2.md) (Zahl der blockierenden Befunde nicht gesunken; beide nur technisch, entschieden nach „Rein technische Streitpunkte“): N1 eigene Angaben eines Wegs als durchgereichter Block, den der Weg selbst prüft (3.4); N2 Web-API des Relays nach req-system-009 mit Weg `http` (E2, E3, 7). Hinweise: H1 Wiederholung vor Meldungen, Kennzeichen mit `hops` (E4, 4.1 Schritt 4); H2 Zeichen der Synchronisation je Matrix-Benutzer (3.4); H3 Aufnahme eines Wegs in die Installation (3.4); H4 Gründe in 4.4; H5 doppelte Nennung in 8. |
| 2026-10-23 | Hinweise aus [specification-3.md](reviews/specification-3.md) (bestanden) ohne weitere Prüfung eingearbeitet: H1 Web-API ohne Angabe nur an `127.0.0.1` (E3). H2 ohne Änderung: Die Web-API steht angeschlossenen Komponenten mit Schlüssel offen; weitere Nutzer folgen mit der Anmeldung nach req-system-011. |
| 2026-10-23 | Nach den Einwänden des Auftraggebers zur Präsentation [specification-1.html](presentations/specification-1.html) und der Nachprüfung [requirements-4.md](reviews/requirements-4.md): req-relay-012 Dateien als Anlage oder über einen Weg für Dateien, Wahl je Verbindung nach Schwelle (1, E2, 3.2, 3.3, 3.4, 3.5, 3.6 neu, 4.1, 4.2, 4.3, 4.5, 6.2, 7, 8 mit Durchgang 3, 9, 10); „Abruf“ statt „Beschaffung“ (überall); pipwerk replay nicht mehr im Abschnitt zum Abruf, bisheriger Abschnitt 6.4 in Abschnitt 1 „Nicht Gegenstand“; Übertragungsweg „Verzeichnis-Weg“ (H1 aus `requirements-4.md`); Hinweise H2, H3 aus `requirements-4.md` (3.6). Prüfung bestanden in [specification-4.md](reviews/specification-4.md). |
| 2026-10-23 | Hinweise aus [specification-4.md](reviews/specification-4.md) (bestanden) ohne weitere Prüfung eingearbeitet: H1 Schwelle Pflicht, `too_large` auch für den Weg für Dateien; H2 Wiederholung vor dem Holen der Dateien; H3 Entfernen und Platz auf dem Weg für Dateien (3.6, 4.5); H5 Name `filestore` (3.6, 8). H4 ohne Änderung. |
| 2026-10-23 | Nach der Nachprüfung [requirements-5.md](reviews/requirements-5.md): req-relay-013 Empfangsbestätigung auf Wunsch des Absenders (1, 3.2 Feld `receipt`, 3.7 neu, 5 Nachrichtenart `relay.receipt`, 8, 9, 10 mit Hinweisen H1 bis H3 aus `requirements-5.md`). |
