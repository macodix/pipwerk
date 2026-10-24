# pipwerk relay – technische Dokumentation

## Status

- status: `draft`
- stand: 2026-10-24
- komponenten: `packages/relay-core` (Python-Paket `pipwerk_relaycore`), `contracts/messages/`
- grundlage: [Spezifikation relay](../../development/relay/specification.md), E1, E4 bis E7, 3.1 bis 3.4, Abschnitte 5, 7 und 8 (Bibliothek); [Plan](../../development/relay/plan.md), Paket `wp01`; Auftrag 01
- umfang dieses stands: Bibliothek `relay-core` mit Adresse, Nachricht, Umschlag, Schlüssel der Verbindung, Schnittstelle „Weg“ und Verzeichnis-Weg `files`. Das Relay (`components/pipwerk-relay`), der Anschluss einer Komponente mit Wiederholungserkennung und Empfangsbestätigung (Auftrag 02) und der Abruf kommen in späteren Aufträgen; sie ergänzen dieses Dokument.

## 1. Gegenstand

`relay-core` ist die gemeinsame Bibliothek von pipwerk relay (Spezifikation E1). Sie enthält, was das Relay und jede Komponente brauchen, die Nachrichten sendet oder empfängt:

- die Adresse (Abschnitt 3),
- die Nachricht mit ihren Anlagen (Abschnitt 4),
- den Umschlag mit Prüfwert, der auf jedem Übertragungsweg liegt (Abschnitt 5),
- den Schlüssel der Verbindung und das Verzeichnis für Geheimnisse (Abschnitt 6),
- die Schnittstelle „Weg“ und das Laden eines Wegs nach seinem Namen (Abschnitt 7),
- den Verzeichnis-Weg `files` (Abschnitte 8 und 9).

Die Bibliothek kennt keinen Weg im Code. Sie liest keine Konfiguration und kennt keine festen Pfade, Ports oder Namen: Verzeichnisse, Dateinamen von Schlüsseln, Größen und Namen von Wegen kommen als Parameter oder Konfiguration vom Aufrufer.

Abhängigkeiten zur Laufzeit: Pydantic (Prüfung der Nachricht, des Umschlags und der Angaben eines Wegs). Mehr nicht; alles Übrige ist die Standardbibliothek von Python. Entwicklungsabhängigkeiten: pytest, ruff, mypy, jsonschema (Vergleich der Schemas mit den Modellen) und das Testpaket `pipwerk-relay-testway`.

## 2. Aufbau

| Modul | Aufgabe |
|---|---|
| `address` | Adresse und die Prüfung der Namen ihrer Teile |
| `message` | `Message` und `Attachment` (Pydantic, streng) |
| `envelope` | `Envelope`, `EnvelopeBody`, `Link`, Prüfwert (`compute_mac`), `verify_attachments` |
| `keys` | `ConnectionKey`, `SecretsDirectory` (Schlüssel erzeugen, laden, Rechte prüfen) |
| `_windows_acl` | Prüfung der Zugriffsrechte unter Windows (wird nur dort geladen) |
| `way` | Schnittstelle `Way` (Version 1), `WaySettings`, `ReceivedEnvelope`, `FaultyEnvelope` |
| `loader` | Laden eines Wegs über die Einstiegspunkte der Gruppe `pipwerk_relay.ways` |
| `ways.files` | Verzeichnis-Weg `files` |
| `schemas` | erzeugt die JSON-Schemas unter `contracts/messages/v1/` aus den Modellen |
| `errors` | Fehler und Ablehnungsgründe |

Fehler: Alle Fehler der Bibliothek sind Unterklassen von `RelayCoreError`. `AddressError` (zugleich `ValueError`) meldet einen ungültigen Namen oder eine ungültige Adresse, `EnvelopeRejected` einen abgelehnten Umschlag (Abschnitt 5), `KeyHandlingError` mit `SecretsAccessError` und `KeyFileError` die Schlüssel (Abschnitt 6), `WayError` mit seinen Unterklassen die Wege (Abschnitt 7).

Die Bibliothek ist synchron. Wer sie in einer Schleife mit mehreren Aufgaben braucht, ruft sie aus einem Thread auf.

## 3. Adresse

`<laufende Komponente>.<pipwerk-Netz>.<zuständiges Relay>` (Spezifikation 3.1). Jeder Teil besteht aus 1 bis 63 Buchstaben (nur `A-Z`, `a-z`), Ziffern, `-` und `_`, beginnt mit einem Buchstaben oder einer Ziffer und enthält keinen Punkt. Groß- und Kleinschreibung zählen. Die Prüfung verwendet `fullmatch`; ein Zeilenvorschub am Ende macht einen Namen ungültig. `Address.parse(text)` liefert die drei Teile oder wirft `AddressError`.

Dieselbe Regel gilt für die Namen der beiden Seiten einer Verbindung (`link.from`, `link.to`): der Name einer Komponente oder `<pipwerk-Netz>.<Relay>`. Die Einträge von `hops` haben die Form `<pipwerk-Netz>.<Relay>`.

## 4. Nachricht

`Message` hat die Felder der Spezifikation 3.2. Das Modell ist streng: keine Umwandlung der Typen (eine Zahl als Text ist keine Zahl), zusätzliche Felder werden abgelehnt, das Modell ist unveränderlich. Eine Nachricht wird aus JSON-Text mit `Message.from_json` gelesen oder aus Python-Objekten (`UUID`, `datetime`) gebaut.

| Feld | Regel |
|---|---|
| `id`, `reference_id` | UUID; `reference_id` wahlweise |
| `sender`, `recipient` | Adresse nach Abschnitt 3 |
| `priority` | 1 bis 32 Kleinbuchstaben, Ziffern, `-`, `_`; Pflicht, ohne Wirkung |
| `kind` | Kennung aus Kleinbuchstaben, Ziffern und `_`, durch Punkte gegliedert (`fetch.request`), höchstens 64 Zeichen |
| `content` | ein JSON-Objekt |
| `created_at` | Zeitpunkt mit Zeitzone UTC (Offset 0); eine Zeit ohne Zeitzone oder mit anderem Offset ist ungültig |
| `attachments` | bis zu 256 Anlagen, ohne Angabe leer; die Namen unterscheiden sich |
| `receipt` | ja oder nein, ohne Angabe nein |

Anlage (`Attachment`): `name` (1 bis 128 Zeichen aus Buchstaben, Ziffern und `. _ # + -`, nicht mit einem Punkt am Anfang), `size` (Byte, nicht negativ), `sha256` (64 Kleinbuchstaben und Ziffern, hexadezimal). Der Name einer Anlage wird nie als Pfad verwendet; die Dateien des Verzeichnis-Wegs entstehen nur aus Nachrichten-ID und Nummer (Abschnitt 8). `Attachment.of(name, inhalt)` beschreibt eine Datei durch ihre Größe und ihren SHA-256.

Die Priorität und `receipt` trägt die Bibliothek unverändert weiter. Die Regeln der Empfangsbestätigung (Spezifikation 3.7) setzt Auftrag 02 um.

## 5. Umschlag und Prüfwert

Auf jedem Weg liegt ein Umschlag (Schema `contracts/messages/v1/envelope.schema.json`, Spezifikation 3.3):

- `format`: `pipwerk-relay/1`
- `body`: Text mit dem JSON des Körpers: `message`, `hops` (Relays, über die die Nachricht lief, `<pipwerk-Netz>.<Relay>`, höchstens 64) und `stored`
- `link`: `from`, `to` und `mac`

**Prüfwert.** `mac` ist HMAC-SHA256 mit dem Schlüssel der Verbindung `from`, hexadezimal in Kleinbuchstaben, über die UTF-8-Bytes von `from`, einem Zeilenvorschub, `to`, einem Zeilenvorschub und `body`. Die Zeilenvorschübe halten die drei Teile auseinander: Ein Name kann keinen Zeilenvorschub enthalten, damit ergeben `a`/`bc` und `ab`/`c` verschiedene Prüfwerte. Der Prüfwert wird über den Text von `body` gebildet, nicht über ein neu geordnetes JSON; kein Empfänger braucht die Schreibweise dieser Bibliothek nachzubilden (req-system-010).

Prüfvektor (Schlüssel `000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f`, `from` = `app-a`, `to` = `net1.relay1`, `body` = `{}`):

```
e0e7f9f8af085df155f63c5ae69761d8dee65e349c2d9cf044ff44e107ee90a2
```

Dieser Schlüssel gehört den Beispielen und Tests. Er schützt nichts und wird nie verwendet.

**Aufbau und Prüfung.**

- `Envelope.create(message, hops=…, sender=…, recipient=…, key=…)` packt eine Nachricht und bildet den Prüfwert.
- `Envelope.from_json(text, max_bytes=…)` liest einen Umschlag. Ein anderes `format` ergibt `unsupported_format`, jeder andere Formfehler `malformed`, ein zu großer Text `too_large`.
- `envelope.open(keys, recipient=…)` sucht den Schlüssel nach `link.from` (unbekannte Verbindung: `unknown_link`), berechnet den Prüfwert neu und vergleicht in konstanter Zeit (`hmac.compare_digest`; `bad_mac`), prüft dann, dass der Umschlag für die eigene Seite bestimmt ist (`wrong_recipient`) und liest erst danach den Körper (`bad_body`). Der Inhalt einer Nachricht wird nie vor dem Prüfwert gelesen.
- `verify_attachments(message, inhalte)` prüft fehlende oder zusätzliche Dateien, Größe und SHA-256 jeder Anlage (`attachment_missing`, `attachment_unexpected`, `attachment_size`, `attachment_hash`). Weil Größe und SHA-256 im geschützten Teil stehen, fällt auch eine veränderte Anlage auf, ebenso eine nachträglich geänderte Beschreibung (der Prüfwert stimmt dann nicht mehr).
- `envelope.unverified_body()` liest den Körper ohne Prüfwert. Der Verzeichnis-Weg braucht es, um zu wissen, wie viele Anlagen zum Umschlag gehören. Das Ergebnis ist nicht vertrauenswürdig, bis `open` den Prüfwert geprüft hat.

**`stored`.** Das Feld nimmt die Anlagen auf, die über einen Weg für Dateien gehen (Spezifikation 3.6, Paket `wp04`). In diesem Stand reicht das Modell es durch; `unverified_body` und `open` lehnen einen Umschlag ab, in dem es gesetzt ist (`stored_not_supported`). Beim Bauen eines Umschlags wird es nicht geschrieben (`null`).

Der Körper schreibt nicht gesetzte wahlfreie Felder als `null` (`reference_id`, `stored`); beim Lesen sind fehlende Felder und `null` gleich.

**Ablehnungsgründe** (`RejectionReason`, Werte als Text): `malformed`, `unsupported_format`, `too_large`, `unknown_link`, `wrong_recipient`, `bad_mac`, `bad_body`, `stored_not_supported`, `attachment_missing`, `attachment_unexpected`, `attachment_size`, `attachment_hash`. Der Text einer Ablehnung (`EnvelopeRejected`) nennt nur den Grund, nie Inhalt, Schlüssel oder Pfade.

## 6. Schlüssel der Verbindung und Verzeichnis für Geheimnisse

Jede Verbindung hat einen eigenen Schlüssel (Spezifikation E5). Er liegt als Datei im Verzeichnis für Geheimnisse (E6); Datenbank und Konfiguration nennen nur den Dateinamen.

- **Erzeugen.** `SecretsDirectory(pfad).new_key(dateiname)` legt die Datei an (Zufallsquelle `secrets.token_bytes`, 32 Byte, als 64 Kleinbuchstaben und Ziffern mit Zeilenvorschub). Eine vorhandene Datei wird nie überschrieben (`KeyFileError`). Auf POSIX-Systemen wird die Datei mit `O_EXCL` und `0o600` angelegt; die Umask kann die Rechte nicht erweitern.
- **Dateiname.** 1 bis 128 Zeichen aus Buchstaben, Ziffern, `. _ -`, beginnt mit Buchstabe oder Ziffer; nie ein Pfad.
- **Laden.** `load_key(dateiname)` prüft Verzeichnis und Datei, öffnet ohne Links zu folgen, prüft die Rechte noch einmal am geöffneten Handle (POSIX), liest höchstens 4096 Byte und verlangt Kleinbuchstaben und Ziffern, mindestens 32 Byte. Fehlermeldungen nennen den Dateinamen, nie den Inhalt.
- **Prüfen.** `SecretsDirectory.check()` prüft das Verzeichnis und jede Datei darin. Das Relay ruft es beim Start auf und startet sonst nicht (Spezifikation 7).
- **`ConnectionKey`** zeigt den Wert nie in `repr`, `str` oder Fehlern und ist nicht hashbar.

**Rechte unter Linux (jedes POSIX-System).** Verzeichnis und Dateien gehören dem aktuellen Benutzer (`st_uid` = effektive Benutzerkennung). Das Verzeichnis darf für Gruppe und andere keine Rechte haben (`0o700`), eine Datei keine Rechte für Gruppe und andere und keine Ausführungsrechte (`0o600` oder `0o400`). Ein Link statt einer Datei und ein Unterverzeichnis mit offenen Rechten werden abgelehnt (`SecretsAccessError`).

**Rechte unter Windows (Entscheidung des Entwicklers).** Windows kennt keine Dateirechte nach POSIX-Art, geprüft wird die Zugriffsliste (`_windows_acl`, über `ctypes` und die Funktionen `GetNamedSecurityInfoW`, `GetAclInformation`, `GetAce`):

1. Der Eigentümer ist der aktuelle Benutzer oder die Gruppe Administratoren.
2. Es gibt eine Zugriffsliste (eine fehlende Liste gibt allen Zugriff).
3. Jeder Eintrag, der Zugriff erlaubt, nennt den Eigentümer, den aktuellen Benutzer, das Systemkonto (`S-1-5-18`) oder die Gruppe Administratoren (`S-1-5-32-544`). Einträge, die Zugriff verweigern, werden übergangen; Einträge einer unbekannten Art lassen die Prüfung scheitern.

Eine neue Datei erbt die Rechte des Verzeichnisses. Der Betreiber richtet das Verzeichnis für Geheimnisse deshalb einmal so ein, dass nur sein Benutzer (und das System) Zugriff hat, und entzieht die Vererbung der übergeordneten Verzeichnisse. Erfüllt eine neue Schlüsseldatei die Prüfung nicht, wird sie gelöscht und `SecretsAccessError` geworfen.

**Stand des Nachweises.** Die Prüfung unter POSIX ist durch Tests belegt (`tests/test_keys.py`). Die Prüfung unter Windows ist noch nicht ausgeführt, weder auf dem Entwicklungsrechner noch in einer Testumgebung; sie braucht einen Lauf auf einem Windows-Rechner, bevor sie als erprobt gilt.

## 7. Schnittstelle „Weg“

Ein Übertragungsweg ist eine Unterklasse von `Way` (Schnittstelle Version 1, `WAY_API_VERSION`). Die Schnittstelle ist versioniert; eine Änderung, die vorhandene Wege bricht, ist eine neue Version neben der alten, und `load_way_class` lehnt einen Weg einer anderen Version ab.

| Aufruf | Bedeutung |
|---|---|
| `send(envelope, attachments)` | Umschlag mit Anlagen (Inhalte in der Reihenfolge von `message.attachments`) übergeben. Die Rückkehr ist die Bestätigung, dass der Weg alles übernommen hat. |
| `read(limit=100)` | Eingegangene Umschläge lesen, älteste zuerst. Ergebnis: `ReceivedEnvelope` (Token, Umschlag, Anlagen, Zeitpunkt des Eingangs) oder `FaultyEnvelope` (Token, Grund, Zeitpunkt). |
| `acknowledge(token)` | Den gelesenen Umschlag nach dem Speichern quittieren; der Weg entfernt ihn aus dem Eingang. Wiederholbar. |

Fehler: `WayUnavailableError` (Ziel oder Eingang nicht erreichbar; Relay und Anschluss wiederholen), `WayTooLargeError` (Umschlag oder Anlage über der Höchstgröße; Wiederholen hilft nicht), `WayRefusedError` (der Weg weist den Umschlag aus einem anderen Grund ab), `WayError` als gemeinsame Grundlage.

Ein beschädigter Umschlag, dessen Anlage fehlt oder nicht stimmt, kommt von `read` als `FaultyEnvelope` und nie als `ReceivedEnvelope`. Das Verwerfen (Protokoll, `acknowledge`) ist Sache des Anschlusses und des Relays.

**Höchstgröße.** Jeder Weg hat die Angaben `max_envelope_bytes` (Voreinstellung 1 MiB) und `max_attachment_bytes` (je Anlage, Voreinstellung 256 MiB). Anlagen werden im Arbeitsspeicher übergeben; die Höchstgröße begrenzt deshalb auch den Speicherbedarf.

**Eigene Angaben.** Eine Konfiguration reicht den Block mit den Angaben eines Wegs unverändert durch (Spezifikation 3.4, Befund N1). Der Weg prüft ihn mit seinem eigenen Modell (`Way.settings_model`, eine Unterklasse von `WaySettings`), lehnt unbekannte Angaben ab und wandelt Zahlen aus Text um, weil der Block aus einer INI-Datei kommen kann. Ein Fehler (`WaySettingsError`) nennt die Einträge (`entries`), nie ihre Werte.

**Anmeldung als Erweiterung.** Jeder Weg meldet sich über einen Einstiegspunkt der Gruppe `pipwerk_relay.ways` unter seinem Namen an (1 bis 32 Zeichen: Kleinbuchstabe am Anfang, dann Kleinbuchstaben, Ziffern, `-`, `_`):

```toml
[project.entry-points."pipwerk_relay.ways"]
files = "pipwerk_relaycore.ways.files:FilesWay"
```

`load_way(name, angaben)` sucht den Einstiegspunkt, lädt die Klasse, prüft, dass sie eine Unterklasse von `Way` der unterstützten Version ist, und erzeugt den Weg aus den Angaben. Fehler (`WayLoadError`): unbekannter Name, derselbe Name von zwei Paketen (kein Weg wird geladen), Fehler beim Laden (ohne Einzelheiten des fremden Pakets), kein `Way`, andere Version. `available_ways()` listet die angemeldeten Namen. Ein weiterer Weg ist ein eigenes Paket, das der Betreiber als zusätzliche Abhängigkeit in die Installation aufnimmt; Bibliothek, Relay und Komponenten bleiben unverändert.

**Test-Weg.** `tests/packages/pipwerk-relay-testway` ist ein eigenes Paket (Weg `memory`, Umschläge im Arbeitsspeicher, eigene Angaben `box` und `refuse`). Es ist Entwicklungsabhängigkeit der Bibliothek (`[tool.uv.sources]`) und wird nur über seinen Einstiegspunkt geladen; `tests/test_way_loading.py` belegt, dass die Bibliothek ihn nicht im Code nennt.

## 8. Verzeichnis-Weg `files`

Name `files`, Klasse `FilesWay`, Angaben `directory` (Pflicht), `max_envelope_bytes`, `max_attachment_bytes`. Ziel und Eingang sind ein Verzeichnis im Dateisystem, auch ein eingebundenes Netzlaufwerk. Zwei Seiten, die in entgegengesetzter Richtung austauschen, nennen dasselbe Verzeichnis oder zwei Verzeichnisse.

**Dateien.**

- `<Nachrichten-ID>.json`: der Umschlag (Text von `Envelope.to_json()`),
- `<Nachrichten-ID>.<Nummer>.att`: die Anlage mit der Nummer (ab 0, in der Reihenfolge von `message.attachments`).

Die Nachrichten-ID ist die UUID in der Schreibweise mit Bindestrichen und Kleinbuchstaben. Dateinamen entstehen nur aus ihr und der Nummer. Namen von Anlagen, Adressen und andere Angaben der Nachricht kommen in keinem Dateinamen vor. Der Leser nimmt nur Dateien an, deren Name genau dem Aufbau entspricht; alles andere im Verzeichnis ignoriert er.

**Senden** (`send`).

1. Prüfung: Die Anlagen passen zur Beschreibung in der Nachricht (Anzahl, Größe, SHA-256; sonst `EnvelopeRejected`); Umschlag und jede Anlage liegen unter der Höchstgröße (sonst `WayTooLargeError`, es wird nichts geschrieben).
2. Jede Datei wird unter einem vorläufigen Namen `<Name>.<Zufall>.part` im selben Verzeichnis geschrieben (`O_EXCL`), auf den Datenträger geschrieben (`fsync`) und dann mit `os.replace` auf den endgültigen Namen umbenannt. Danach wird das Verzeichnis geschrieben (`fsync`, wo das System es zulässt).
3. Die Anlagen kommen vor dem Umschlag. Der Umschlag erscheint erst, wenn alle Anlagen unter ihrem endgültigen Namen liegen.
4. Scheitert ein Schritt, wird die vorläufige Datei entfernt; bereits umbenannte Anlagen bleiben ohne Umschlag liegen (der Leser ignoriert sie, ein erneutes Senden derselben Nachricht ersetzt sie).

Dieselbe Nachricht noch einmal zu senden ersetzt die Dateien ganzheitlich (`os.replace`); der Leser sieht jeweils die alte oder die neue Fassung.

**Lesen** (`read`).

1. Das Verzeichnis wird nach Dateien `<UUID>.json` durchsucht (keine Links, nur reguläre Dateien), nach Zeitpunkt der letzten Änderung und Name geordnet, die ersten `limit` werden gelesen.
2. Jede Datei wird ohne Links zu folgen geöffnet, auf Größe geprüft, bevor sie gelesen wird, und als Umschlag gelesen. Der Körper wird ohne Prüfwert gelesen (nur für Aufbau und Zahl der Anlagen); seine Nachrichten-ID muss dem Dateinamen entsprechen.
3. Jede Anlage wird gelesen und gegen Größe und SHA-256 des Körpers geprüft.
4. Ist etwas davon nicht in Ordnung, kommt der Umschlag als `FaultyEnvelope` mit dem Grund (`malformed`, `unsupported_format`, `too_large`, `bad_body`, `stored_not_supported`, `attachment_missing`, `attachment_size`, `attachment_hash`). `modified_at` (UTC) ist der Zeitpunkt der letzten Änderung der Umschlagdatei laut Dateisystem.
5. Eine Umschlagdatei, die zwischen Auflisten und Öffnen verschwindet (anderer Leser), wird übersprungen.

Der Leser prüft den Prüfwert nicht; das tut `Envelope.open` des Aufrufers mit dem Schlüssel der Verbindung. Der Weg liest, ohne etwas zu entfernen.

**Quittieren** (`acknowledge(token)`). Das Token ist die Nachrichten-ID; jedes andere Token (Pfadzeichen, Großbuchstaben, falsche Länge) wird mit `WayError` abgelehnt. Entfernt wird zuerst der Umschlag, dann seine Anlagen (gesucht in der Liste des Verzeichnisses, nicht durch Muster im Dateisystem). Ein Absturz dazwischen lässt höchstens Anlagen ohne Umschlag zurück. Der Aufruf ist wiederholbar. Er entfernt auch die Dateien eines als fehlerhaft gemeldeten Umschlags; das ist der Verwerfungsschritt des Aufrufers.

**Fehler des Verzeichnisses.** Ist das Verzeichnis nicht vorhanden, kein Verzeichnis oder wirft das Dateisystem einen Fehler (`OSError`: nicht erreichbar, Zugriff verweigert, Ein-/Ausgabefehler, abgebrochene Verbindung), wirft der Weg `WayUnavailableError`. Der Text nennt die Art des Fehlers (zum Beispiel `ENOENT`), nie einen Pfad. Der Fehler ist wiederholbar: Sobald das Verzeichnis wieder da ist, arbeitet derselbe Weg weiter, ohne neu erzeugt zu werden.

**Rechte der Dateien.** Die Dateien werden mit den Standardrechten des Betriebssystems angelegt (`0o666` abzüglich Umask), damit zwei Relays unter verschiedenen Benutzern über ein gemeinsames Verzeichnis tauschen können. Wer ein Verzeichnis lesen darf, regelt der Betreiber über die Rechte des Verzeichnisses. Der Inhalt ist durch den Prüfwert gegen Fälschung geschützt, nicht gegen Mitlesen (Verschlüsselung ist offen, req-relay-011).

## 9. Annahmen und Grenzen des Umbenennens auf einem Netzlaufwerk

Der Weg macht für Netzlaufwerke (SMB, NFS) folgende Annahmen. Sie gelten für jedes Verzeichnis; auf einem lokalen Dateisystem sind sie erfüllt.

1. **Umbenennen im selben Verzeichnis ist vollständig oder gar nicht.** Die vorläufige und die endgültige Datei liegen im selben Verzeichnis derselben Freigabe. `os.replace` ist auf NTFS, ext4, XFS und über SMB2/3 und NFS eine einzelne Umbenennung auf dem Server; ein Leser sieht die Datei entweder gar nicht oder vollständig. Nicht unterstützt sind Dateisysteme und Einbindungen, bei denen Umbenennen als Kopieren und Löschen ausgeführt wird (manche Dateisystem-Brücken für Objektspeicher, Dateisysteme ohne atomares Umbenennen).
2. **Daten sind vor dem Umbenennen auf dem Server.** Der Weg ruft vor dem Umbenennen `fsync` auf. Das reicht, wenn der Client `fsync` an den Server weitergibt (SMB: Flush-Anfrage, NFS: `COMMIT`). Einbindungen mit abgeschalteter Weitergabe (zum Beispiel `nostrictsync` bei Linux-CIFS) heben diese Zusicherung auf; der Betreiber verwendet sie nicht.
3. **Der Zwischenspeicher des Clients kann Einträge verspätet zeigen.** SMB- und NFS-Clients halten Verzeichnislisten und negative Treffer („Datei nicht vorhanden“) einige Sekunden. Ein Leser kann einen Umschlag sehen, bevor er eine seiner Anlagen sieht. Der Weg meldet das als `FaultyEnvelope` mit `attachment_missing`. Dieser Fall ist deshalb nicht endgültig: **Der Aufrufer verwirft einen Umschlag mit fehlender Anlage erst, wenn `modified_at` länger zurückliegt als eine Schonfrist** (länger als der Zwischenspeicher der Einbindung hält; als Richtwert für das Relay mehrere Minuten, einstellbar) und liest ihn vorher bei jedem Durchlauf erneut. Die Schonfrist empfiehlt sich für alle Gründe zu Anlagen (`attachment_missing`, `attachment_size`, `attachment_hash`), denn ein Zwischenspeicher kann auch eine ältere Größe oder einen älteren Inhalt zeigen. Die Schonfrist selbst setzt das Relay um (späterer Auftrag); die Bibliothek liefert dafür `modified_at`.
4. **Keine Sperren.** Der Weg verwendet keine Dateisperren und keine Lease-Verfahren. Zwei Leser desselben Eingangs können denselben Umschlag lesen; die Wiederholungserkennung (Spezifikation E4) verwirft die zweite Übergabe. Vorgesehen ist ein Leser je Eingang.
5. **Uhren.** `modified_at` ist die Zeit des Dateisystems (auf einem Netzlaufwerk die Uhr des Servers). Der Aufrufer vergleicht sie mit seiner eigenen Uhr; die Schonfrist muss größer sein als die Abweichung der Uhren.
6. **Verbindungsabbruch.** Ein Abbruch während des Schreibens lässt `*.part`-Dateien zurück und niemals einen halben Umschlag. Der Weg räumt `*.part`-Dateien nicht auf; das Aufräumen nach einer Frist gehört zum Relay (Spezifikation 3.6, 4.5).
7. **Groß- und Kleinschreibung.** Alle Namen bestehen aus Kleinbuchstaben, Ziffern, Bindestrichen und Punkten; Dateisysteme, die Groß- und Kleinschreibung nicht unterscheiden, ändern nichts.
8. **Links.** Der Weg folgt keinem Link: Ein Link anstelle einer Umschlagdatei wird ignoriert, ein Link anstelle einer Anlage zählt als fehlende Anlage.
9. **Zugriffsrechte der Einbindung.** Wer schreibt und liest, braucht Schreib- und Leserecht im Verzeichnis, einschließlich Löschen und Umbenennen. Fehlt ein Recht, meldet der Weg `WayUnavailableError`.

Die Annahmen 1 bis 3 sind die Voraussetzung dafür, dass ein Leser nie einen halben Umschlag sieht; belegt sind sie auf einem lokalen Dateisystem durch die Tests. Ein Lauf auf einem Netzlaufwerk gehört zur Testumgebung des Pakets (Spezifikation 8, Durchgang 1).

## 10. Sicherheit der Teile

Zuordnung zu den Sicherheitsregeln ([Entwicklungs-, Test- und Sicherheitsregeln](development-test-security-rules.md), 8.2, 8.3) und zu BSI-Grundschutz und OWASP ASVS, soweit sie auf die Bibliothek anwendbar sind:

| Anforderung | Umsetzung | Test |
|---|---|---|
| Eingaben an der Grenze prüfen (Regel 8.2 Nr. 2; ASVS V5) | Nachricht, Umschlag, Körper und Angaben eines Wegs sind strenge Pydantic-Modelle, zusätzliche Felder werden abgelehnt; Adressen, Namen, Größen und IDs haben feste Formen | `test_message`, `test_envelope`, `test_address`, `test_schemas` |
| Kryptografie (ASVS V6; BSI CON.1) | HMAC-SHA256 der Standardbibliothek, Vergleich mit `hmac.compare_digest`, Schlüssel 32 Byte aus `secrets`; keine eigene Kryptografie | `test_envelope`, `test_keys` |
| Fälschung erkennen (req-relay-010) | veränderte Nachricht, veränderte Anlage, falscher Schlüssel, unbekannte Verbindung, verschobene Teile des Prüfwerts | `test_envelope` |
| Umgang mit Geheimnissen (Regel 8.2 Nr. 1; ASVS V2.10) | Schlüssel nur als Datei im Verzeichnis für Geheimnisse, Rechte geprüft, nie in Text, Fehlern oder Protokoll | `test_keys`, `test_way_loading` |
| Dateizugriffe (Regel 8.3 Nr. 5; ASVS V12) | Dateinamen nur aus geprüften Teilen, Tokens geprüft, keine Links, Größe vor dem Lesen geprüft, Schreiben atomar | `test_files_way` |
| Fehlerbehandlung ohne Einzelheiten (Regel 8.2 Nr. 8; ASVS V7) | Fehler nennen Grund, Eintrag oder Dateiname, nie Wert, Pfad oder Inhalt | `test_envelope`, `test_way_loading`, `test_files_way` |
| Begrenzung von Ressourcen (OWASP API4) | Höchstgrößen von Umschlag und Anlage, Zahl der Anlagen (256) und der Einträge von `hops` (64), `limit` beim Lesen | `test_files_way`, `test_message` |
| Erweiterungen (Regel 12; BSI APP.7) | Wege nur über Einstiegspunkte, Name doppelt: kein Laden, Fehler ohne Einzelheiten, Version der Schnittstelle geprüft | `test_way_loading` |

Abweichungen und Grenzen: Die Windows-Prüfung der Zugriffsrechte ist nicht ausgeführt (Abschnitt 6). Mitlesen auf dem Weg verhindert die Bibliothek nicht (Verschlüsselung ist offen, req-relay-011). Ein Schutz von Absender zu Empfänger über alle Relays gehört nicht zum Umfang (Spezifikation E5).

Neue Abhängigkeiten (Regel 12): keine. Pydantic 2.13.5 (Lizenz MIT, gepflegt) war schon Abhängigkeit der Bibliotheken `pipwerk_domain` und `pipwerk_marketdata`.

## 11. Schemas und Beispiele

`contracts/messages/v1/` enthält `message.schema.json` und `envelope.schema.json` (JSON Schema 2020-12), erzeugt aus den Modellen mit `pipwerk-relaycore-schemas <Verzeichnis>`, Beispiele unter `examples/` und ungültige Beispiele unter `examples/invalid/`; beschrieben in [contracts/messages/README.md](../../contracts/messages/README.md). `tests/test_schemas.py` prüft, dass die Dateien genau vom Modell erzeugt werden, dass gültige und ungültige Beispiele von Schema und Modell gleich beurteilt werden und dass Schema und Modell in einer Reihe von Grenzfällen übereinstimmen. Regeln, die ein Schema nicht ausdrücken kann (verschiedene Namen der Anlagen, Zeit in UTC, Form eines Zeitpunkts), prüft nur das Modell.

## 12. Prüfskript

`packages/relay-core/scripts/check [--with-audit]` führt auf dem Arbeitsverzeichnis, zu dem das Skript gehört, nacheinander aus: `uv sync --frozen`, `pytest`, `ruff check`, `ruff format --check`, `mypy`, mit `--with-audit` zusätzlich `pip-audit`. Es endet mit Exitcode 0, nur wenn alle Prüfungen bestehen. Es enthält keine festen Pfade, Ports oder Rechnernamen und lässt sich aus jedem Verzeichnis aufrufen.

## 13. Tests

| Datei | Prüft |
|---|---|
| `test_address.py` | gültige und ungültige Adressen und Namen |
| `test_message.py` | Nachricht und Anlage: Felder, Grenzen, Namen, strenge Typen, Zeit in UTC |
| `test_envelope.py` | Umschlag und Prüfwert: veränderte Nachricht, veränderte Anlage, falscher Schlüssel, unbekannte Verbindung, falscher Empfänger, `stored`, Formfehler, Prüfvektor |
| `test_keys.py` | Schlüssel erzeugen, laden, Rechte, Links, Namen |
| `test_way_loading.py` | Test-Weg als Erweiterung aus eigenem Paket, Angaben, Fehler ohne Werte, Laden: unbekannt, doppelt, Version, kaputt |
| `test_files_way.py` | Verzeichnis-Weg: Senden, Lesen, Quittieren, halber Umschlag, Anlagen vor Umschlag, nicht erreichbares Verzeichnis, Dateinamen mit Pfadzeichen, fehlerhafte Umschläge, Größen, gleichzeitiger Schreiber und Leser |
| `test_schemas.py` | Schemas, Beispiele und Modelle stimmen überein |
| `test_documentation.py` | Dokumentation nennt Ablehnungsgründe, Fehler und Schnittstellen |

## Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-24 | Erstfassung (Vorhaben `relay`, Paket `wp01`, Auftrag 01): Bibliothek `relay-core` mit Adresse, Nachricht, Umschlag, Schlüssel, Schnittstelle „Weg“, Verzeichnis-Weg. |
