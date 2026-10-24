# pipwerk relay – technische Dokumentation

## Status

- status: `draft`
- stand: 2026-10-24
- komponenten: `packages/relay-core` (Python-Paket `pipwerk_relaycore`), `components/pipwerk-relay` (Python-Paket `pipwerk_relay`), `contracts/messages/`
- grundlage: [Spezifikation relay](../../development/relay/specification.md), E1, E3 letzter Satz, E4 bis E7, 3.1 bis 3.5, 3.7, 4.1 bis 4.5, Abschnitte 5, 7 und 8; [Plan](../../development/relay/plan.md), Paket `wp01`; Aufträge 01 bis 04
- umfang dieses stands: Teil A (Abschnitte 1 bis 17) die Bibliothek `relay-core` mit Adresse, Nachricht, Umschlag, Schlüssel der Verbindung, Schnittstelle „Weg“, Verzeichnis-Weg `files`, den Inhalten der Nachrichtenarten `relay.receipt`, `relay.undeliverable` und `probe.message`, dem Anschluss einer Komponente mit Prüfung, Wiederholungserkennung und Empfangsbestätigung, der Verbindung aus der Startkonfiguration (Abschnitt 11.1) sowie der Datenbank des Anschlusses. Teil B (Abschnitte 18 bis 34) das Relay `pipwerk-relay` mit Weg einer Nachricht, Speicher, Konfiguration, Befehlen, Begrenzungen und Sicherheit, die Prüfkomponente (Abschnitt 31), die Testumgebung (Abschnitt 32) und die Tests der Störungen 1 bis 7 (Abschnitt 33). Der Abruf (Aufträge 05 und 06) ergänzt dieses Dokument; sein Teil steht in `pipwerk-fetch-mt5.md`.

## 1. Gegenstand

`relay-core` ist die gemeinsame Bibliothek von pipwerk relay (Spezifikation E1). Sie enthält, was das Relay und jede Komponente brauchen, die Nachrichten sendet oder empfängt:

- die Adresse (Abschnitt 3),
- die Nachricht mit ihren Anlagen (Abschnitt 4),
- den Umschlag mit Prüfwert, der auf jedem Übertragungsweg liegt (Abschnitt 5),
- den Schlüssel der Verbindung und das Verzeichnis für Geheimnisse (Abschnitt 6),
- die Schnittstelle „Weg“ und das Laden eines Wegs nach seinem Namen (Abschnitt 7),
- den Verzeichnis-Weg `files` (Abschnitte 8 und 9),
- die Inhalte der Nachrichtenarten, die die Bibliothek selbst kennt (Abschnitt 10),
- den Anschluss einer Komponente `Connector`: Senden, Lesen mit Prüfung, Wiederholungen (Abschnitt 11) und Empfangsbestätigung (Abschnitt 12),
- die Verbindung einer Komponente aus ihrer Startkonfiguration: `[relay]` und `[relay.way]` lesen und den Anschluss öffnen (Abschnitt 11.1),
- die Datenbank des Anschlusses (Abschnitt 13).

Die Bibliothek kennt keinen Weg im Code. Sie liest keine Konfiguration und kennt keine festen Pfade, Ports oder Namen: Verzeichnisse, Dateinamen von Schlüsseln, Größen und Namen von Wegen kommen als Parameter oder Konfiguration vom Aufrufer.

Abhängigkeiten zur Laufzeit: Pydantic (Prüfung der Nachricht, des Umschlags und der Angaben eines Wegs), SQLAlchemy und Alembic (Datenbank des Anschlusses, Abschnitt 13; Alembic bringt Mako und MarkupSafe mit). Alles Übrige ist die Standardbibliothek von Python. Entwicklungsabhängigkeiten: pytest, ruff, mypy, jsonschema (Vergleich der Schemas mit den Modellen) und das Testpaket `pipwerk-relay-testway`.

## 2. Aufbau

| Modul | Aufgabe |
|---|---|
| `address` | Adresse und die Prüfung der Namen ihrer Teile |
| `message` | `Message` und `Attachment` (Pydantic, streng) |
| `envelope` | `Envelope`, `EnvelopeBody`, `Link`, Prüfwert (`compute_mac`), `verify_attachments` |
| `keys` | `ConnectionKey`, `SecretsDirectory` (Schlüssel erzeugen, laden, Rechte prüfen) |
| `_windows_acl` | Prüfung der Zugriffsrechte unter Windows (wird nur dort geladen) |
| `way` | Schnittstelle `Way` (Version 1) mit `send`, `read`, `acknowledge` und `clean_up`, `WaySettings`, `ReceivedEnvelope`, `FaultyEnvelope` |
| `loader` | Laden eines Wegs über die Einstiegspunkte der Gruppe `pipwerk_relay.ways` |
| `ways.files` | Verzeichnis-Weg `files` |
| `contents` | Inhalte von `relay.receipt`, `relay.undeliverable`, `probe.message`; Gründe der Unzustellbarkeit |
| `connector` | Anschluss einer Komponente: `Connector`, `ConnectorConfig`, `WayConfig`, `Handler`, `PollResult` |
| `connection` | die Verbindung aus der Startkonfiguration: `ConnectionSettings`, `read_connection_settings`, `connector_config`, `open_connector`, `ConnectionSettingsError` (Abschnitt 11.1) |
| `store` | `ConnectorStore`: gesehene Nachrichten-IDs und wartende Bestätigungen |
| `tables`, `migrate`, `migrations` | Tabellen (SQLAlchemy Core), Migration (Alembic: `migrate_database` für die Tabellen des Anschlusses, `migrate_scripts` für die Migrationen eines Programms wie des Relays), Versionen der Migration |
| `schemas` | erzeugt die JSON-Schemas unter `contracts/messages/v1/` aus den Modellen |
| `errors` | Fehler und Ablehnungsgründe |

Fehler: Alle Fehler der Bibliothek sind Unterklassen von `RelayCoreError`. `AddressError` (zugleich `ValueError`) meldet einen ungültigen Namen oder eine ungültige Adresse, `EnvelopeRejected` einen abgelehnten Umschlag (Abschnitt 5), `KeyHandlingError` mit `SecretsAccessError` und `KeyFileError` die Schlüssel (Abschnitt 6), `WayError` mit seinen Unterklassen die Wege (Abschnitt 7), `DatabaseMigrationError` eine gescheiterte Migration der Datenbank des Anschlusses (Abschnitt 13).

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
| `receipt` | ja oder nein, ohne Angabe nein; bei den Arten `relay.receipt` und `relay.undeliverable` nie ja |

Anlage (`Attachment`): `name` (1 bis 128 Zeichen aus Buchstaben, Ziffern und `. _ # + -`, nicht mit einem Punkt am Anfang), `size` (Byte, nicht negativ), `sha256` (64 Kleinbuchstaben und Ziffern, hexadezimal). Der Name einer Anlage wird nie als Pfad verwendet; die Dateien des Verzeichnis-Wegs entstehen nur aus Nachrichten-ID und Nummer (Abschnitt 8). `Attachment.of(name, inhalt)` beschreibt eine Datei durch ihre Größe und ihren SHA-256.

Die Priorität und `receipt` trägt die Bibliothek unverändert weiter. Eine Nachricht der Art `relay.receipt` oder `relay.undeliverable` mit `receipt` ja ist ungültig (Spezifikation 3.7, „Ausnahmen“): Das Modell lehnt sie ab, und das Schema `message.schema.json` drückt die Regel mit `if`/`then` aus. Grund: Sonst entstünden Bestätigungen über Bestätigungen. Die übrigen Regeln der Empfangsbestätigung stehen in Abschnitt 12.

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

**Ablehnungsgründe** (`RejectionReason`, Werte als Text): `malformed`, `unsupported_format`, `too_large`, `unknown_link`, `wrong_recipient`, `bad_mac`, `bad_body`, `bad_content`, `stored_not_supported`, `attachment_missing`, `attachment_unexpected`, `attachment_size`, `attachment_hash`. `bad_content` meldet der Anschluss (Abschnitt 11), wenn der Inhalt einer Nachricht einer Art, die die Bibliothek kennt, nicht zu deren Schema passt. Der Text einer Ablehnung (`EnvelopeRejected`) nennt nur den Grund, nie Inhalt, Schlüssel oder Pfade.

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
| `clean_up(older_than, now)` | Wahlfrei, ohne Überschreiben tut der Aufruf nichts und liefert 0. Entfernt, was ein unterbrochenes `send` zurücklässt, wenn es älter ist als `older_than`; liefert die Zahl der entfernten Dateien. Das Relay ruft ihn von Zeit zu Zeit für jeden Weg auf (Abschnitt 26). Wie `read` wirft er `WayUnavailableError`, wenn der Weg nicht erreichbar ist. Er ergänzt die Schnittstelle, ohne einen vorhandenen Weg zu brechen; `WAY_API_VERSION` bleibt 1. |

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
3. **Der Zwischenspeicher des Clients kann Einträge verspätet zeigen.** SMB- und NFS-Clients halten Verzeichnislisten und negative Treffer („Datei nicht vorhanden“) einige Sekunden. Ein Leser kann einen Umschlag sehen, bevor er eine seiner Anlagen sieht. Der Weg meldet das als `FaultyEnvelope` mit `attachment_missing`. Dieser Fall ist deshalb nicht endgültig: **Der Aufrufer verwirft einen Umschlag mit fehlender Anlage erst, wenn `modified_at` länger zurückliegt als eine Schonfrist** (länger als der Zwischenspeicher der Einbindung hält; als Richtwert für das Relay mehrere Minuten, einstellbar) und liest ihn vorher bei jedem Durchlauf erneut. Die Schonfrist empfiehlt sich für alle Gründe zu Anlagen (`attachment_missing`, `attachment_size`, `attachment_hash`), denn ein Zwischenspeicher kann auch eine ältere Größe oder einen älteren Inhalt zeigen. Die Schonfrist selbst setzt das Relay um (Abschnitt 26); die Bibliothek liefert dafür `modified_at`. `read` liest die ältesten `limit` Umschläge; liegen so viele fehlerhafte, noch nicht verworfene Umschläge im Eingang, dass sie alle ersten Plätze besetzen, kommen neuere nicht an die Reihe. Das Relay liest deshalb in diesem Fall mit wachsendem `limit` (Abschnitt 26).
4. **Keine Sperren.** Der Weg verwendet keine Dateisperren und keine Lease-Verfahren. Zwei Leser desselben Eingangs können denselben Umschlag lesen; die Wiederholungserkennung (Spezifikation E4) verwirft die zweite Übergabe. Vorgesehen ist ein Leser je Eingang.
5. **Uhren.** `modified_at` ist die Zeit des Dateisystems (auf einem Netzlaufwerk die Uhr des Servers). Der Aufrufer vergleicht sie mit seiner eigenen Uhr; die Schonfrist muss größer sein als die Abweichung der Uhren.
6. **Verbindungsabbruch.** Ein Abbruch während des Schreibens lässt `*.part`-Dateien und Anlagen ohne Umschlag zurück und niemals einen halben Umschlag. `read` und `send` räumen sie nicht auf. `clean_up(older_than, now)` entfernt sie, wenn sie älter sind als `older_than`: Dateien `<Nachrichten-ID>.json.<16 Zeichen>.part` und `<Nachrichten-ID>.<Nummer>.att.<16 Zeichen>.part`, und Anlagen `<Nachrichten-ID>.<Nummer>.att`, zu denen es keinen Umschlag `<Nachrichten-ID>.json` gibt. Alles andere im Verzeichnis, auch Dateien, die dem Aufbau fast entsprechen, bleibt unberührt. Das Relay ruft `clean_up` auf (Abschnitt 26). Das Alter ist das der letzten Änderung laut Dateisystem (Annahme 5).
7. **Groß- und Kleinschreibung.** Alle Namen bestehen aus Kleinbuchstaben, Ziffern, Bindestrichen und Punkten; Dateisysteme, die Groß- und Kleinschreibung nicht unterscheiden, ändern nichts.
8. **Links.** Der Weg folgt keinem Link: Ein Link anstelle einer Umschlagdatei wird ignoriert, ein Link anstelle einer Anlage zählt als fehlende Anlage.
9. **Zugriffsrechte der Einbindung.** Wer schreibt und liest, braucht Schreib- und Leserecht im Verzeichnis, einschließlich Löschen und Umbenennen. Fehlt ein Recht, meldet der Weg `WayUnavailableError`.

Die Annahmen 1 bis 3 sind die Voraussetzung dafür, dass ein Leser nie einen halben Umschlag sieht; belegt sind sie auf einem lokalen Dateisystem durch die Tests. Ein Lauf auf einem Netzlaufwerk gehört zur Testumgebung des Pakets (Spezifikation 8, Durchgang 1).

## 10. Inhalte der Nachrichtenarten

Für die Arten, die die Bibliothek selbst sendet oder kennt, gibt es ein Modell des Inhalts (`pipwerk_relaycore.contents`, `CONTENT_MODELS`) und ein Schema unter `contracts/messages/v1/` (`<Art>.schema.json`). Die Modelle sind streng, zusätzliche Felder werden abgelehnt. Alle anderen Arten (zum Beispiel `fetch.request`) prüft die Bibliothek nicht; das tut die Komponente, die sie definiert.

| Art | Inhalt | Schema |
|---|---|---|
| `relay.receipt` | leer (`{}`); die Bezug-Nachrichten-ID nennt die bestätigte Nachricht | `relay.receipt.schema.json` |
| `relay.undeliverable` | `reason` (Grund), `text` (fester Text zum Grund, 1 bis 200 Zeichen), `recipient` (Adresse des Adressaten der unzustellbaren Nachricht), `kind` (Art dieser Nachricht) | `relay.undeliverable.schema.json` |
| `probe.message` | `text` (1 bis 1000 Zeichen) | `probe.message.schema.json` |

Die Konstanten `KIND_RECEIPT`, `KIND_UNDELIVERABLE` und `KIND_PROBE` nennen die Arten. `is_valid_content(art, inhalt)` prüft einen Inhalt gegen sein Modell; eine unbekannte Art ist immer gültig.

**Gründe der Unzustellbarkeit** (`UndeliverableReason`, Spezifikation 4.4). Jeder Grund hat einen festen Text (`reason.text`, englisch, höchstens 200 Zeichen), den das Relay in `text` einträgt; `UndeliverableContent.of(grund, adressat, art)` bildet den Inhalt, `to_content()` liefert das JSON-Objekt für eine Nachricht. Die Texte sind eine Hilfe für die Anzeige; maßgeblich ist die Kennung.

| Grund | fester Text |
|---|---|
| `sender_invalid` | The sender address does not belong to the component that sent the message. |
| `loop` | The message went around in a circle between relays. |
| `unknown_recipient` | No component with the name of the recipient is connected to the responsible relay. |
| `unknown_relay` | The responsible relay of the recipient is unknown and no standard relay is set. |
| `relay_unreachable` | The next relay could not be reached in time. |
| `recipient_unreachable` | The recipient could not be reached in time. |
| `too_large` | The message or an attachment is too large for a way. |

## 11. Anschluss einer Komponente

Der Anschluss (`Connector`, Modul `connector`; Spezifikation 3.5, E4) ist das, was eine Komponente zum Senden und Empfangen von Nachrichten benutzt. Eine Komponente hat einen Anschluss und ruft `send` und `poll` nicht gleichzeitig aus mehreren Threads auf; die Bibliothek ist synchron (Abschnitt 2).

**Angaben** (`ConnectorConfig`). Woher die Komponente sie nimmt, legt sie selbst fest (Spezifikation 3.5).

| Angabe | Bedeutung |
|---|---|
| `address` | eigene Adresse (`Address`) |
| `key` | Schlüssel der Verbindung mit dem Relay (`ConnectionKey`, Abschnitt 6) |
| `target` | `WayConfig(name, angaben)`: Weg und eigene Angaben des Ziels, wo das Relay liest, was die Komponente sendet |
| `inbox` | `WayConfig(name, angaben)`: Weg und eigene Angaben des Eingangs, wo das Relay ablegt, was für die Komponente bestimmt ist |
| `database` | Pfad der SQLite-Datei des Anschlusses (Abschnitt 13); das Verzeichnis muss bestehen |
| `relay_link` | Name der Relay-Seite der Verbindung, `<pipwerk-Netz>.<Relay>`; ohne Angabe das Relay der Adresse |
| `seen_for` | Frist, in der eine Nachrichten-ID als gesehen gilt (Voreinstellung 7 Tage, `DEFAULT_SEEN_FOR`) |
| `receipt_timeout` | Frist auf eine Empfangsbestätigung, wenn die Nachricht keine eigene nennt (Voreinstellung 1 Stunde, `DEFAULT_RECEIPT_TIMEOUT`) |
| `attachment_grace` | Schonfrist für Umschläge mit fehlender oder nicht stimmender Anlage (Voreinstellung 5 Minuten, `DEFAULT_ATTACHMENT_GRACE`) |

Die Namen der beiden Seiten der Verbindung sind der Name der Komponente (`address.component`) und `relay_link`. Der Anschluss kennt keinen Weg im Code: `target.name` und `inbox.name` werden über `load_way` geladen (Abschnitt 7), die Angaben reicht er unverändert an den Weg weiter. Ein unbekannter Weg oder fehlerhafte Angaben (`WayLoadError`, `WaySettingsError`) verhindern das Öffnen; vorher wird nichts angelegt. Die Datenbank wird beim Öffnen migriert (Abschnitt 13). `close()` oder `with Connector(…) as anschluss` gibt sie frei. Der Parameter `clock` (nur für Tests) ersetzt die Uhr.

**Senden** (`send(adressat, art, inhalt, attachments=…, priority=…, reference_id=…, receipt=…, receipt_timeout=…)`). Der Anschluss vergibt die Nachrichten-ID (UUID) und den Zeitpunkt, setzt die eigene Adresse als Absender, beschreibt die Anlagen (Name, Größe, SHA-256), packt alles mit `hops` leer in einen Umschlag, schützt ihn mit dem Schlüssel (`from` = Name der Komponente, `to` = `relay_link`) und übergibt ihn dem Weg des Ziels. Die Rückgabe ist die gesendete `Message`. Fehler: ein ungültiger Wert (`pydantic.ValidationError`, zugleich `ValueError`: Adresse, Priorität, Art, Anlagenname, doppelter Anlagenname, `receipt` bei `relay.receipt`/`relay.undeliverable`), ein Inhalt, der nicht zur Art passt (`ValueError`), eine Frist ohne `receipt` oder eine Frist, die nicht positiv ist (`ValueError`), und die Fehler des Wegs (`WayUnavailableError`, `WayTooLargeError`, `WayRefusedError`). Bei einem Fehler des Wegs steht keine Nachricht im Ziel und nichts wartet auf eine Bestätigung. Unverändert gilt: Senden braucht kein Relay in Betrieb; der Umschlag liegt im Ziel, bis das Relay ihn liest.

**Lesen** (`poll(handler, limit=100)`). Ein Durchlauf liest den Eingang einmal und tut für jeden Umschlag der Reihe nach:

1. Ist der Umschlag fehlerhaft (`FaultyEnvelope` des Wegs) und ist der Grund eine Anlage (`attachment_missing`, `attachment_size`, `attachment_hash`), bleibt er im Eingang, solange sein Zeitpunkt (`modified_at`) weniger als die Schonfrist zurückliegt; das kann eine Verzögerung des Dateisystems sein (Abschnitt 9, Annahme 3). Danach und bei jedem anderen Grund wird er verworfen.
2. Prüfung, in dieser Reihenfolge: Prüfwert und Verbindung (`Envelope.open` mit dem Schlüssel; `bad_mac`, `unknown_link`), Umschlag für die eigene Seite (`wrong_recipient`), Körper (`bad_body`, darin auch die Regel zu `receipt` aus Abschnitt 4), Größe und SHA-256 jeder Anlage (`attachment_*`), Adressat der Nachricht ist die eigene Adresse (`wrong_recipient`), Inhalt passt zur Art (`bad_content`). Was nicht besteht, wird verworfen: Der Umschlag wird quittiert (`acknowledge`), im Protokoll steht eine Zeile mit der Kennung der Datei und dem Grund, ohne Inhalt (req-relay-010). Es geht keine Meldung an den Absender (Spezifikation 4.1 Schritt 1).
3. Ist die Nachrichten-ID innerhalb der Frist schon gesehen, ist es eine Wiederholung (E4): Sie wird nicht übergeben, sondern quittiert; verlangt sie eine Bestätigung, wird diese noch einmal geschickt (Abschnitt 12).
4. Eine Nachricht `relay.receipt` geht nicht an die Komponente, sondern wird als Bestätigung behandelt (Abschnitt 12).
5. Jede andere Nachricht übergibt der Anschluss mit `handler.store(ReceivedMessage)` an die Komponente. `ReceivedMessage` hat `message`, `hops` und `attachments` (Inhalte in der Reihenfolge von `message.attachments`) und `files` (Anlagen nach Namen). Kehrt `store` zurück, hat die Komponente die Nachricht gespeichert. Löst `store` eine Ausnahme aus (`Exception`), vermerkt der Anschluss das im Protokoll (Kennung, Art, Absender und Name der Ausnahme, nie deren Text), lässt den Umschlag im Eingang und die ID ungesehen; der nächste Durchlauf übergibt die Nachricht erneut, auch nach einem Neustart. Endet die Komponente (zum Beispiel durch `KeyboardInterrupt` oder einen Absturz), geschieht dasselbe.
6. Nach `store`: Handelt es sich um `relay.undeliverable` mit Bezug auf eine wartende Nachricht, endet deren Warten (Abschnitt 12). Dann wird die ID als gesehen vermerkt, bei `receipt` die Bestätigung geschickt und der Umschlag quittiert.

Danach meldet der Anschluss die Nachrichten, deren Frist auf eine Bestätigung abgelaufen ist (Abschnitt 12). Das Ergebnis ist ein `PollResult` mit Zählern (`delivered`, `repeated`, `dropped`, `postponed`, `failed`, `receipts`, `missing_receipts`) und `available`. Ist der Eingang nicht erreichbar (`WayUnavailableError`), wirft `poll` nichts: Es vermerkt den Fehler im Protokoll, setzt `available` auf falsch und liest beim nächsten Aufruf erneut (Spezifikation 8, Störung 2). Der Aufrufer legt die Abstände der Durchläufe fest.

**Komponente** (`Handler`). `store(received)` ist Pflicht. `receipt_arrived(ReceiptArrived)` und `receipt_missing(ReceiptMissing)` sind wahlweise und tun ohne Überschreiben nichts. Löst eine davon eine Ausnahme aus, gilt das als nicht entgegengenommen: Die Bestätigung bleibt im Eingang beziehungsweise der Eintrag in der Datenbank, und der nächste Durchlauf versucht es erneut.

**Protokoll.** Der Anschluss schreibt über `logging` unter dem Namen `pipwerk_relaycore.connector`: gesendet, zugestellt, Wiederholung, Bestätigung angekommen, Bestätigung fehlt, verworfen, Fehler der Komponente. Jede Zeile nennt Nachrichten-ID, Art, Absender und Adressat oder bei einem verworfenen Umschlag die Kennung der Datei und den Grund; nie Inhalt, Anlagen, Schlüssel oder Pfade. Nachrichten-ID und Absender eines verworfenen Umschlags stehen nicht im Protokoll, weil sie vor der Prüfung nicht vertrauenswürdig sind. Wohin die Zeilen gehen, bestimmt die Komponente mit der Konfiguration von `logging`.

**Quittieren.** Scheitert das Quittieren (`WayError`), vermerkt der Anschluss es im Protokoll; der Umschlag bleibt im Eingang und kommt im nächsten Durchlauf als Wiederholung oder wird wieder verworfen.

### 11.1 Die Verbindung aus der Startkonfiguration

Welche Angaben ein Anschluss braucht, legt jede Komponente selbst fest (Spezifikation 3.5). Die Komponenten von pipwerk relay, die eine Startkonfiguration im INI-Format haben (`pipwerk-fetch-mt5` mit `serve` und `request`, die Prüfkomponente in Abschnitt 31), geben sie in derselben Form an. Lesen und Öffnen liegen deshalb in der Bibliothek (Modul `connection`, seit Auftrag 04; die bisherige Schnittstelle der Bibliothek ist unverändert, das Modul ist eine Ergänzung): `read_connection_settings(parser, herkunft)` liest die Abschnitte `[relay]` und `[relay.way]` eines `ConfigParser` (vom Aufrufer mit `interpolation=None` gebaut, weil ein Wert `%` enthalten kann; die Prüfkomponente und `pipwerk-fetch-mt5` behalten außerdem die Schreibweise der Einträge). Die Rückgabe sind `ConnectionSettings`, oder `None`, wenn die Datei kein `[relay]` hat. `open_connector(einstellungen, clock=…)` prüft, was die Bibliothek prüft (Adresse, Schlüssel und Rechte des Verzeichnisses für Geheimnisse, Name und eigene Angaben des Wegs, Datenbank), legt das Verzeichnis der Datenbank an und liefert den `Connector`; `connector_config(einstellungen)` liefert nur die `ConnectorConfig`.

| Abschnitt | Eintrag | Bedeutung |
|---|---|---|
| `[relay]` | `address` | Pflicht. Eigene Adresse `<Komponente>.<Netz>.<Relay>` |
| | `way` | Pflicht. Name des Übertragungswegs, hier `files` |
| | `secrets_directory` | Pflicht. Verzeichnis für Geheimnisse mit dem Schlüssel der Verbindung; nur der eigene Benutzer darf es erreichen |
| | `key_file` | Pflicht. Dateiname des Schlüssels der Verbindung mit dem Relay in diesem Verzeichnis |
| | `database` | Pflicht. SQLite-Datei des Anschlusses (Abschnitt 13); das Verzeichnis wird angelegt; auf einem lokalen Laufwerk |
| | `relay_link` | wahlweise. `<Netz>.<Relay>`, wenn die Relay-Seite der Verbindung nicht das Relay der Adresse ist |
| | `poll_interval_seconds` | wahlweise, 1 bis 3600, Voreinstellung 2 (`DEFAULT_POLL_INTERVAL_SECONDS`). Abstand, in dem die Komponente ihren Eingang liest |
| `[relay.way]` | `target.<Eintrag>` | eigene Angaben des Wegs für das Ziel, ohne das Vorwort an den Weg gereicht |
| | `inbox.<Eintrag>` | eigene Angaben des Wegs für den Eingang |

`ConnectionSettings` hat die Felder `address`, `way`, `secrets_directory`, `key_file`, `database`, `target`, `inbox`, `relay_link` und `poll_interval_seconds`; die Werte sind der Text der Datei (Pfade als `Path`), `target` und `inbox` unveränderlich. Ein unbekannter Eintrag von `[relay]`, ein fehlender Pflichteintrag, ein Eintrag von `[relay.way]` ohne Vorwort `target.` oder `inbox.` und `[relay.way]` ohne `[relay]` sind Fehler (`ConnectionSettingsError`); die Meldung beginnt mit der Herkunft („Startup configuration <Pfad>“) und nennt den Eintrag, nie den Wert. `[relay.way]` ist von der Abweisung unbekannter Einträge ausgenommen; der Weg prüft seine Angaben selbst streng (Abschnitt 7). Fehler beim Öffnen (`open_connector`) beginnen mit `[relay]:` und nennen den Eintrag oder die Datei, nie den Schlüssel; sie sind ebenfalls `ConnectionSettingsError`. Die Namen der Einträge von `[relay]` stehen als `RELAY_OPTIONS`, die Pflichteinträge als `RELAY_REQUIRED` in der Bibliothek. `tests/test_connection.py` prüft das Lesen und das Öffnen.

## 12. Empfangsbestätigung

Die Empfangsbestätigung (Spezifikation 3.7, req-relay-013) ist eine Aufgabe des Anschlusses auf beiden Seiten.

**Absender.** `send(…, receipt=True)` setzt `receipt` in der Nachricht und legt die Nachricht mit Frist in die Datenbank (Tabelle `relaycore_waiting`, Abschnitt 13), bevor der Umschlag übergeben wird. Die Frist ist `receipt_timeout` der Angabe oder die Frist der Nachricht; sie steht nicht in der Nachricht. Scheitert die Übergabe, wird der Eintrag wieder entfernt.

**Empfänger.** Hat die Komponente eine Nachricht mit `receipt` gespeichert (`store` kehrt zurück), schickt der Anschluss ohne weiteres Zutun eine Nachricht `relay.receipt`: Absender ist die eigene Adresse, Adressat der Absender der bestätigten Nachricht, Bezug-Nachrichten-ID deren ID, Inhalt leer, Priorität wie die bestätigte Nachricht, `receipt` nein, ohne Anlagen.

**Entscheidung des Entwicklers (Reihenfolge).** Die Spezifikation nennt die Reihenfolge Bestätigung, dann Quittieren und Vermerken als gesehen. Der Anschluss vermerkt die ID als gesehen, bevor er die Bestätigung schickt, und quittiert erst nach der Bestätigung. Scheitert das Senden der Bestätigung (zum Beispiel weil das Ziel nicht erreichbar ist), bleibt der Umschlag im Eingang. Der nächste Durchlauf findet ihn als Wiederholung und schickt die Bestätigung, ohne die Nachricht ein zweites Mal zu übergeben. Wäre die ID erst nach der Bestätigung vermerkt, würde die Komponente die Nachricht bei jedem Fehler beim Senden der Bestätigung noch einmal bekommen. Das Ergebnis für Absender und Komponente ist sonst gleich: keine Bestätigung ohne gespeicherte Nachricht, kein Verlust, keine doppelte Übergabe.

**Fälle.**

| Fall | Verhalten |
|---|---|
| Komponente meldet einen Fehler oder endet vor dem Speichern | keine Bestätigung, Umschlag bleibt, ID nicht gesehen, erneute Übergabe beim nächsten Durchlauf (auch nach Neustart), Fehler im Protokoll |
| Wiederholung einer Nachricht mit `receipt` | erneute Bestätigung, keine erneute Übergabe |
| Wiederholung einer Nachricht ohne `receipt` | keine Bestätigung, keine Übergabe |
| Bestätigung kommt an, Absender ist der Adressat der wartenden Nachricht | `handler.receipt_arrived(ReceiptArrived)`, Eintrag entfernt, ID gesehen, quittiert |
| Bestätigung von einer anderen Adresse, ohne wartende Nachricht (auch eine späte nach Ablauf der Frist) oder ohne Bezug | verworfen: nur Protokoll (`receipt dropped`), quittiert; ein Eintrag bleibt bestehen |
| `relay.undeliverable` mit Bezug auf eine wartende Nachricht | geht wie jede Nachricht an `handler.store` (req-relay-008); danach endet das Warten, es folgt keine Meldung über die abgelaufene Frist |
| `relay.undeliverable` mit Bezug auf eine Nachricht ohne Bestätigung | geht an `handler.store`, sonst nichts |
| Frist abgelaufen | `handler.receipt_missing(ReceiptMissing)` mit Nachrichten-ID, Art, Adressat, Zeitpunkt des Sendens und Frist, danach wird der Eintrag entfernt; die Meldung kommt einmal |
| Neustart des Absenders | die Einträge liegen in der Datenbank; eine bereits abgelaufene Frist wird beim ersten Durchlauf gemeldet |
| Bestätigung liegt im Eingang, während die Frist abläuft | die Bestätigung zählt: der Anschluss liest den Eingang vor der Prüfung der Fristen |
| `relay.receipt` oder `relay.undeliverable` mit `receipt` ja | ungültig (Abschnitt 4), beim Senden `ValueError`, beim Lesen verworfen (`bad_body`) |

Beim Absender kommt eine Bestätigung nur an, wenn die Komponente `poll` aufruft. Eine Anfrage mit Antwort braucht keine Bestätigung: Die Antwort ist die Bestätigung (Spezifikation 3.7); der Abruf setzt `receipt` nie.

## 13. Datenbank des Anschlusses

Zwei Tabellen in einer SQLite-Datei (SQLAlchemy Core, `tables`), deren Pfad die Komponente in `database` nennt:

| Tabelle | Inhalt |
|---|---|
| `relaycore_seen` | `message_id` (Schlüssel), `seen_at` (UTC): die Nachrichten-IDs, die die Komponente gespeichert hat |
| `relaycore_waiting` | `message_id` (Schlüssel), `kind`, `recipient`, `sent_at`, `deadline` (UTC): gesendete Nachrichten mit `receipt`, deren Bestätigung aussteht |

Zeitpunkte liegen als UTC ohne Zeitzone und kommen als UTC mit Zeitzone zurück. Einträge in `relaycore_seen`, die älter sind als `seen_for`, werden zu Beginn jedes Durchlaufs entfernt; eine ID, deren Eintrag abgelaufen ist, gilt als neu und wird bei der nächsten Speicherung ersetzt. Alle Tabellen beginnen mit `relaycore_`, damit die Komponente die Datenbank mit eigenen Tabellen teilen kann; die Version der Migrationen steht in der eigenen Tabelle `relaycore_alembic_version`.

**Migration.** `migrate_database(engine)` bringt die Datenbank auf den neuesten Aufbau (Alembic, Version `0001`); der Anschluss ruft es beim Öffnen auf. `migrate_scripts(engine, verzeichnis, gegenstand)` ist dasselbe Verfahren für die Migrationen eines Programms, das die Bibliothek verwendet (das Relay, Abschnitt 22); `alembic_config(verbindung, verzeichnis)` liefert die Konfiguration von Alembic für eine Verbindung. Das `env.py` des Verzeichnisses führt seine eigene Versionstabelle. Alles läuft in einer Transaktion: Scheitert eine Migration, wird zurückgerollt und `DatabaseMigrationError` geworfen (ohne Pfad im Text). Unter SQLite wird die Transaktionssteuerung des Treibers für die eine Verbindung abgeschaltet, und die Migration führt `BEGIN IMMEDIATE`, `COMMIT` und `ROLLBACK` selbst aus, weil `sqlite3` DDL sonst sofort bestätigt; `BEGIN IMMEDIATE` nimmt die Schreibsperre zuerst, ein zweiter Prozess wartet. Eine Datenbank mit einer neueren Version als der Code kennt, wird abgelehnt (`DatabaseMigrationError`) und nicht verändert. Die Migration läuft auch auf einer Datenbank mit fremden Tabellen und einer fremden Tabelle `alembic_version`; beide bleiben unberührt. Offline-Modus (SQL-Skripte) ist nicht vorgesehen.

**Ort der Datei.** Die Datenbank gehört auf einen lokalen Datenträger des Rechners der Komponente, nicht auf ein Netzlaufwerk: Die Sperren von SQLite sind über SMB und NFS nicht verlässlich. Ein Zugriff gleichzeitig kommt nur von der einen Komponente. Die Wartezeit bei einer gesperrten Datenbank ist 30 Sekunden.

**Sicherung.** Die Datei enthält keine Geheimnisse und keinen Inhalt von Nachrichten, nur IDs, Arten, Adressen und Zeitpunkte. Geht sie verloren, kann eine Nachricht, deren ID vergessen wurde, noch einmal übergeben werden, und wartende Bestätigungen werden nicht mehr gemeldet.

## 14. Sicherheit der Teile

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
| Prüfung vor Verarbeitung (req-relay-010; ASVS V5) | der Anschluss übergibt einer Komponente nichts, bevor Prüfwert, Verbindung, Empfänger, Anlagen und Inhalt geprüft sind; Verworfenes steht ohne Inhalt im Protokoll, der Absender erhält keine Meldung | `test_connector` |
| Wiederholung (E4) | gesehene Nachrichten-IDs in der Datenbank, mit Frist, über Neustarts | `test_connector`, `test_receipt` |
| Protokollierung ohne Geheimnisse (Regel 8.3 Nr. 4; ASVS V7) | Zeilen mit Kennungen, Art, Adressen, Grund; Fehler der Komponente nur mit dem Namen der Ausnahme | `test_connector`, `test_receipt` |
| Datenbank (Regel 9: SQLAlchemy, Alembic; Regel 8.2 Nr. 10) | nur Ausdrücke von SQLAlchemy Core mit gebundenen Werten, kein zusammengesetztes SQL; Migration alles oder nichts, getestet an einer Testdatenbank | `test_migrations`, `test_connector` |
| Vermeiden von Bestätigungen über Bestätigungen | `relay.receipt` und `relay.undeliverable` mit `receipt` ja ungültig in Modell und Schema | `test_receipt`, `test_contents`, `test_connector` |

Abweichungen und Grenzen: Die Windows-Prüfung der Zugriffsrechte ist nicht ausgeführt (Abschnitt 6). Mitlesen auf dem Weg verhindert die Bibliothek nicht (Verschlüsselung ist offen, req-relay-011). Ein Schutz von Absender zu Empfänger über alle Relays gehört nicht zum Umfang (Spezifikation E5). Die Datenbank des Anschlusses ist eine SQLite-Datei ohne Verschlüsselung; sie enthält nur IDs, Arten, Adressen und Zeitpunkte (Abschnitt 13).

Abhängigkeiten (Regel 12). Pydantic 2.13.5 (Lizenz MIT, gepflegt) war schon Abhängigkeit der Bibliotheken `pipwerk_domain` und `pipwerk_marketdata`. Neu mit Auftrag 02: SQLAlchemy 2.1.5 und Alembic 1.20.0, dazu Mako 1.4.3 und MarkupSafe 3.0.4 (von Alembic verlangt). Zweck: die Datenbank des Anschlusses nach Regel 9 und Abschnitt 3 der Entwicklungsregeln (SQLAlchemy für die Speicherung, Alembic für versionierte Migration, Spezifikation E6). Lizenz: SQLAlchemy MIT, Alembic MIT, Mako MIT, MarkupSafe BSD-3-Clause; alle vier sind mit GPL-3.0 vereinbar. Wartungszustand: alle vier werden gepflegt; SQLAlchemy und Alembic verwenden bereits `pipwerk_marketdata`, pipwerk Studio und pipwerk replay. Sicherheit: `scripts/check --with-audit` prüft die gesperrten Versionen auf bekannte Schwachstellen. Kopplung: SQLAlchemy erscheint nur in `tables`, `store`, `migrate` und beim Erzeugen der Verbindung im Anschluss; die öffentlichen Typen (`WaitingMessage`, `ReceiptMissing` und so weiter) sind einfache Datenklassen, keine ORM-Klassen. Die Versionen sind in `pyproject.toml` und `uv.lock` festgeschrieben.

## 15. Schemas und Beispiele

`contracts/messages/v1/` enthält `message.schema.json`, `envelope.schema.json` und je ein Schema des Inhalts der Nachrichtenarten `relay.receipt`, `relay.undeliverable` und `probe.message` (JSON Schema 2020-12), erzeugt aus den Modellen mit `pipwerk-relaycore-schemas <Verzeichnis>`, Beispiele unter `examples/` (Nachrichten `message-*.json`, Inhalte `content-*.json`, Umschläge `envelope*.json`) und ungültige Beispiele unter `examples/invalid/`; beschrieben in [contracts/messages/README.md](../../contracts/messages/README.md). `tests/test_schemas.py` prüft, dass die Dateien genau vom Modell erzeugt werden, dass gültige und ungültige Beispiele von Schema und Modell gleich beurteilt werden und dass Schema und Modell in einer Reihe von Grenzfällen übereinstimmen; `tests/test_contents.py` prüft dasselbe für die Inhalte der Nachrichtenarten und dass die Beispielnachrichten zum Inhaltsschema ihrer Art passen. Regeln, die ein Schema nicht ausdrücken kann (verschiedene Namen der Anlagen, Zeit in UTC, Form eines Zeitpunkts), prüft nur das Modell.

## 16. Prüfskript

`packages/relay-core/scripts/check [--with-audit]` führt auf dem Arbeitsverzeichnis, zu dem das Skript gehört, nacheinander aus: `uv sync --frozen`, `pytest`, `ruff check`, `ruff format --check`, `mypy`, mit `--with-audit` zusätzlich `pip-audit`. Es endet mit Exitcode 0, nur wenn alle Prüfungen bestehen. Es enthält keine festen Pfade, Ports oder Rechnernamen und lässt sich aus jedem Verzeichnis aufrufen.

## 17. Tests

Die Tests des Anschlusses (`tests/network.py`) bilden ein Netz mit zwei Komponenten nach: Jede hat zwei Verzeichnisse (Ziel und Eingang) und einen Anschluss mit dem Weg `files`; dazwischen liegen zwei Schritte, die ein Relay nachbilden (lesen, Prüfwert prüfen, das eigene Relay in `hops` eintragen, für die nächste Verbindung neu packen), und ein Verzeichnis zwischen den Relays. Die Uhr ist eine Uhr des Tests, die der Test vorstellt.

| Datei | Prüft |
|---|---|
| `test_connector.py` | Anschluss: Senden und Lesen mit Anlagen über zwei Relays und zurück, Wiederholung (auch nach Neustart, bei anderer Zahl von `hops`, nach Ablauf der Frist), gefälschte und nicht passende Umschläge (falscher Schlüssel, unbekannte Seite, falscher Empfänger, `receipt` bei `relay.receipt`, Inhalt zur Art), kaputte Datei, veränderte und verspätete Anlage mit Schonfrist, Fehler der Komponente, nicht erreichbarer Eingang und Ziel, Höchstgröße des Wegs, Prüfung beim Senden, Angaben |
| `test_receipt.py` | Empfangsbestätigung: nach dem Speichern, mit Bezug und Priorität, ohne Wunsch keine, Wiederholung mit zweiter Bestätigung ohne zweite Übergabe, Bestätigung, die nicht gesendet werden kann, Frist (Voreinstellung, eigene Frist, Neustart, späte Bestätigung, Komponente läuft verspätet), `relay.undeliverable` beendet das Warten, Bestätigung von fremder Adresse und ohne wartende Nachricht, Ausnahme der Komponente |
| `test_contents.py` | Inhalte der Nachrichtenarten: Modelle, Schemas, Beispiele, feste Texte der Gründe |
| `test_connection.py` | Verbindung aus der Startkonfiguration (Abschnitt 11.1): Lesen mit Voreinstellungen, Angaben des Wegs unverändert, jeder Pflichteintrag, unbekannter Eintrag, Fehler ohne Werte, Öffnen mit Schlüsseln, Rechten, Weg, Datenbank |
| `test_migrations.py` | Migration: leere Datenbank, Wiederholung, fremde Tabellen, Gleichheit mit den Tabellen, neuere Version, Rücknahme |

Die übrigen Dateien aus Auftrag 01:

| Datei | Prüft |
|---|---|
| `test_address.py` | gültige und ungültige Adressen und Namen |
| `test_message.py` | Nachricht und Anlage: Felder, Grenzen, Namen, strenge Typen, Zeit in UTC |
| `test_envelope.py` | Umschlag und Prüfwert: veränderte Nachricht, veränderte Anlage, falscher Schlüssel, unbekannte Verbindung, falscher Empfänger, `stored`, Formfehler, Prüfvektor |
| `test_keys.py` | Schlüssel erzeugen, laden, Rechte, Links, Namen |
| `test_way_loading.py` | Test-Weg als Erweiterung aus eigenem Paket, Angaben, Fehler ohne Werte, Laden: unbekannt, doppelt, Version, kaputt |
| `test_files_way.py` | Verzeichnis-Weg: Senden, Lesen, Quittieren, halber Umschlag, Anlagen vor Umschlag, nicht erreichbares Verzeichnis, Dateinamen mit Pfadzeichen, fehlerhafte Umschläge, Größen, gleichzeitiger Schreiber und Leser, Aufräumen (`clean_up`: alte unfertige Dateien und Anlagen ohne Umschlag, junge und fremde Dateien bleiben) |
| `test_schemas.py` | Schemas, Beispiele und Modelle stimmen überein |
| `test_documentation.py` | Dokumentation nennt Ablehnungsgründe, Fehler und Schnittstellen |

---

# Teil B: Das Relay

## 18. Gegenstand und Aufbau des Relays

`pipwerk-relay` (Verzeichnis `components/pipwerk-relay`, Python-Paket `pipwerk_relay`) ist das Programm, das Nachrichten zwischen Komponenten und zwischen Relays weitergibt (Spezifikation E1, 4.1 bis 4.5). Es liest die Umschläge aus seinen Eingängen, prüft sie, legt jede Nachricht in seiner Warteschlange ab und gibt sie weiter: an eine angeschlossene Komponente, an ein Relay seines Adressbuchs oder an das Standard-Relay. Was nicht zustellbar ist, endet mit einer Nachricht `relay.undeliverable` an den Absender. Das Relay verwendet die Bibliothek aus Teil A für Adresse, Nachricht, Umschlag, Prüfwert, Schlüssel und Wege. Es kennt keinen Weg im Code: Welchen Weg ein Eingang, eine Komponente oder ein Eintrag des Adressbuchs verwendet, steht in der Betriebskonfiguration (Abschnitt 21) und wird über den Namen geladen (Abschnitt 7).

Das Relay öffnet keinen Port und hat keine Web-API (die Web-API folgt mit Paket `wp05`). Die Prüfkomponente `probe` liegt im selben Paket (Abschnitt 31), ist aber eine Komponente von pipwerk relay wie jede andere und kein Teil des Relays: Sie hat Adresse, Schlüssel und Startkonfiguration für sich und spricht nur über ihren Anschluss mit dem Relay. Es ist ein Prozess; zwei Prozesse auf derselben Datenbank sind nicht vorgesehen (Abschnitt 28, Grenzen).

| Modul | Aufgabe |
|---|---|
| `cli` | die Befehle (Abschnitt 27), Exitcodes |
| `startup` | die Startkonfiguration `pipwerk-relay.ini` (Abschnitt 20); Suche der Datei und Lesen einer INI-Datei (`resolve_config_path`, `parse_ini_file`), auch für die Startkonfiguration der Prüfkomponente |
| `operating` | die Modelle der Betriebskonfiguration, ihre Prüfung und die Voreinstellungen (Abschnitt 21) |
| `configuration` | `config load` und `config show`: `load_configuration`, `show_configuration` |
| `runtime` | `build_runtime`: lädt die Wege und die Schlüssel einer Betriebskonfiguration |
| `relay` | `Relay`: eine Runde der Arbeit (`cycle`) mit Lesen, Prüfen, Speichern, Weitergeben und Aufräumen (Abschnitte 23 bis 26) |
| `store`, `tables`, `database`, `migrations` | der Speicher: Warteschlange, gesehene Übergaben, Betriebskonfiguration (Abschnitt 22) |
| `attachments` | das Verzeichnis der Anlagen (Abschnitt 22) |
| `service` | die Schleife `run_until_stopped`, das Protokoll und `stop_on_signals` (Beenden mit Strg+C und `SIGTERM`, vom Relay und von `probe listen` verwendet) |
| `probe` | die Prüfkomponente: Startkonfiguration, `probe listen`, `probe send` (Abschnitt 31) |
| `schemas` | erzeugt `relay-config.schema.json` aus dem Modell |
| `errors` | `RelayError` und seine Unterklassen: `StartupConfigError`, `ConfigRejected`, `NotConfigured`, `SchemaOutdated`, `AttachmentLost` |

Fehlermeldungen des Relays nennen den Eintrag, den Grund oder den Dateinamen, nie einen Wert aus einer Nachricht, einer Konfiguration oder einer Schlüsseldatei.

## 19. Einrichtung des Relays

Das Relay wird wie `pipwerk-fetch-mt5` mit uv eingerichtet (Spezifikation E7, Regel 6 der Entwicklungsregeln). Es läuft unter Windows und Linux.

1. `scripts/install` (Linux) beziehungsweise `scripts\install.cmd` (Windows) legt aus der Sperrdatei `uv.lock` eine eigene Umgebung (`.venv`) unter der Komponente an, mit den Laufzeitabhängigkeiten und der Bibliothek `packages/relay-core` (Pfadabhängigkeit mit festgeschriebener Version `0.1.0` und `editable`, wie bei `pipwerk-marketdata`). Entwicklungswerkzeuge werden nicht installiert; an der Python-Installation des Systems ändert sich nichts.
2. `pipwerk-relay.ini` aus `pipwerk-relay.example.ini` anlegen (Abschnitt 20).
3. `pipwerk-relay migrate` legt die Tabellen an (Abschnitt 22).
4. Für jede Verbindung `pipwerk-relay key new <Datei>` und eine Kopie der Datei auf sicherem Weg zur anderen Seite der Verbindung bringen (Komponente oder Relay), dort in das Verzeichnis für Geheimnisse legen.
5. Die Betriebskonfiguration schreiben und mit `pipwerk-relay config load <Datei>` laden (Abschnitt 21).
6. `pipwerk-relay run`.

Aufruf: `scripts/pipwerk-relay <Befehl>` (Linux) beziehungsweise `scripts\pipwerk-relay.cmd <Befehl>` (Windows) führen den Befehl in der Umgebung aus; der Einstiegspunkt heißt `pipwerk-relay`, `python -m pipwerk_relay` ist dasselbe. Das Relay kann so ohne Dienst im Netz betrieben werden.

## 20. Startkonfiguration

Die Startkonfiguration ist eine INI-Datei `pipwerk-relay.ini` (req-system-016, req-system-017). Der Aufruf `-c <Pfad>` hat Vorrang; sonst sucht das Relay in dieser Reihenfolge `%USERPROFILE%\pipwerk\etc`, `%APPDATA%\pipwerk`, `%PROGRAMDATA%\pipwerk` (Windows) beziehungsweise `$HOME/pipwerk/etc`, `$HOME/.config/pipwerk`, `/etc/pipwerk` (Linux). Verwendet wird genau eine Datei; mehrere werden nie zusammengeführt. Ein relativer oder leerer Wert der Umgebungsvariablen zählt nicht als Suchort. Ohne gültige Datei startet das Relay nicht (Exitcode 2).

| Abschnitt | Eintrag | Bedeutung |
|---|---|---|
| `[database]` | `url` (Pflicht) | Verbindung zur Datenbank als URL von SQLAlchemy, zum Beispiel `sqlite:///<Datei>`. Die URL kann ein Kennwort enthalten und steht nie in einer Fehlermeldung oder im Protokoll. |
| `[storage]` | `attachments_directory` (Pflicht) | Verzeichnis der Anlagen der Warteschlange; das Relay legt es an, wenn es fehlt. |
| `[secrets]` | `directory` (Pflicht) | Verzeichnis für Geheimnisse mit den Schlüsseldateien der Verbindungen. |
| `[log]` | `level` (Voreinstellung `INFO`) | `DEBUG`, `INFO`, `WARNING` oder `ERROR`. |
| `[log]` | `file` | Protokolldatei (wird angehängt); ohne Angabe schreibt das Relay das Protokoll auf die Standardfehlerausgabe. |

Unbekannte Abschnitte und Einträge werden abgewiesen; ein Fehler nennt den Abschnitt oder den Eintrag, bei einem Syntaxfehler die Zeilennummer, nie den Wert (die Zeile kann die URL mit Kennwort enthalten). Ein Prozentzeichen ist ein gewöhnliches Zeichen. Die Betriebskonfiguration gehört nicht in diese Datei. Die Datei mit den eigenen Werten gehört nicht in ein Repository (`.gitignore` der Komponente); versioniert ist nur `pipwerk-relay.example.ini`. Die Prüfkomponente (Abschnitt 31) liest diese Datei nicht; sie hat die Startkonfiguration `pipwerk-relay-probe.ini` (Beispiel `pipwerk-relay-probe.example.ini`).

**Rechte vor dem Start (Spezifikation 4.5, Abschnitt 7).** `pipwerk-relay run` ruft vor allem anderen `SecretsDirectory.check()` der Bibliothek auf (Abschnitt 6): Verzeichnis und jede Datei darin gehören dem Benutzer des Relays und sind für andere nicht zugänglich (Linux: `0700` und `0600` oder `0400`; Windows: Zugriffsliste, Abschnitt 6). Sonst startet das Relay nicht, es führt keine Runde aus und endet mit Exitcode 1. Beim Laden der Schlüssel (`config load`, Start) prüft die Bibliothek dieselben Rechte noch einmal je Datei.

## 21. Betriebskonfiguration

Die Betriebskonfiguration ist ein JSON-Dokument nach `contracts/messages/v1/relay-config.schema.json` (Beispiel: `contracts/messages/v1/examples/relay-config.json`). Die Modelle in `pipwerk_relay.operating` sind streng: keine Umwandlung der Typen, zusätzliche Felder werden abgelehnt. Frei sind nur die Blöcke `settings`: Sie gehören dem Weg, der daneben genannt ist; das Relay reicht sie unverändert an den Weg weiter, und der Weg prüft sie selbst streng (Spezifikation 3.4, Abschnitt 7).

| Feld | Bedeutung |
|---|---|
| `network`, `name` | pipwerk-Netz und Name dieses Relays. Regeln einer Adresse (Abschnitt 3). Das Relay ist als Seite einer Verbindung `<network>.<name>`; seine Meldungen senden von `relay.<network>.<name>`. |
| `inputs` | die Eingänge des Relays, je `name` (Bezeichnung im Protokoll), `way` und `settings`. Das Relay liest alle Eingänge in jeder Runde. Ein Eingang ist der Ort, an dem Komponenten und andere Relays Umschläge für dieses Relay ablegen. |
| `components` | die angeschlossenen Komponenten (Spezifikation 4.2), je `name` (Teil ihrer Adresse), `way` und `settings` (wo das Relay für die Komponente ablegt: ihr Eingang), `key_file` (Dateiname des Schlüssels der Verbindung). Der Name `relay` ist gesperrt. |
| `address_book` | die bekannten Relays (Spezifikation 4.3), je `network`, `relay`, `way` und `settings` (wo das Relay für dieses Relay ablegt: dessen Eingang), `key_file` und `standard`. Höchstens ein Eintrag ist das Standard-Relay. |
| `periods` | Fristen und Abstände in Sekunden, siehe unten |
| `limits` | Grenzen, siehe unten und Abschnitt 25 |

Regeln, die das Modell zusätzlich prüft (ein JSON-Schema drückt sie nicht aus): die Namen der Eingänge, der Komponenten und die Einträge des Adressbuchs unterscheiden sich; der Name `relay` gehört keiner Komponente; das Relay steht nicht in seinem eigenen Adressbuch; höchstens ein Standard-Relay; jede Schlüsseldatei gehört zu genau einer Verbindung (Spezifikation E5: ein Schlüssel je Verbindung); `retry_max_seconds` ist nicht kleiner als `retry_first_seconds`.

**Verzeichnisse.** Mit dem Weg `files` nennt `settings.directory` bei einem Eingang das Verzeichnis, das das Relay liest; bei einer Komponente deren Eingang; bei einem Eintrag des Adressbuchs den Eingang des anderen Relays. Je Richtung einer Verbindung gibt es ein eigenes Verzeichnis. Ein Umschlag, der nicht für die lesende Seite bestimmt ist (`link.to`), wird verworfen (Abschnitt 5); zwei Seiten, die dasselbe Verzeichnis in beiden Richtungen verwenden, verwerfen deshalb die Umschläge des anderen.

**Voreinstellungen** (die Werte legt dieser Auftrag fest; Spezifikation 4.1 und 4.5 überlassen sie den Aufträgen):

| Feld | Voreinstellung | Bedeutung |
|---|---|---|
| `periods.read_interval_seconds` | 5 | Pause zwischen zwei Runden |
| `periods.retry_first_seconds` | 10 | Pause vor dem zweiten Versuch der Übergabe; sie verdoppelt sich bei jedem Fehlschlag |
| `periods.retry_max_seconds` | 900 (15 Minuten) | längste Pause zwischen zwei Versuchen |
| `periods.delivery_deadline_seconds` | 86400 (24 Stunden) | Frist, nach der eine Nachricht, die sich nicht übergeben lässt, unzustellbar ist (Spezifikation 4.1 Schritt 7); gerechnet ab der Annahme |
| `periods.seen_for_seconds` | 604800 (7 Tage) | wie lange eine Übergabe als gesehen gilt (E4) |
| `periods.attachment_grace_seconds` | 300 (5 Minuten) | Schonfrist für einen Umschlag mit fehlender oder nicht stimmender Anlage (Abschnitt 26) |
| `periods.leftover_after_seconds` | 3600 (1 Stunde) | Alter, ab dem Reste unterbrochener Übergaben entfernt werden (Abschnitt 26) |
| `periods.cleanup_interval_seconds` | 600 (10 Minuten) | Abstand der Aufräumrunden |
| `limits.max_hops` | 8 | Länge von `hops`, ab der eine Nachricht eine Schleife ist (1 bis 63) |
| `limits.read_batch` | 100 | Zahl der Umschläge, die das Relay in einem Schritt aus einem Eingang liest (1 bis 1000), und der fälligen Einträge, die es in einem Schritt übergibt |
| `limits.max_queue_messages` | 10000 | Zahl der Nachrichten in der Warteschlange (Abschnitt 25) |
| `limits.max_attachment_storage_bytes` | 10737418240 (10 GiB) | Platz für die Anlagen der Warteschlange (Abschnitt 25) |

**Laden** (`pipwerk-relay config load <Datei>`). `load_configuration` liest höchstens 1 MiB, prüft das Dokument gegen die Modelle, lädt jeden genannten Weg mit seinen Angaben (`WayLoadError`, `WaySettingsError`: unbekannter Weg, unbekannte oder ungültige Angaben, nur mit den Namen der Einträge) und jede Schlüsseldatei (`KeyHandlingError`: fehlt, Rechte, kein Schlüssel) und sammelt alle Probleme. Gibt es eines, wird die Datei als Ganzes abgelehnt (`ConfigRejected`), jedes Problem mit seiner Stelle (`components.0.key_file: …`) ausgegeben und nichts geändert. Sonst steht das Dokument mit allen Voreinstellungen als neue Version in der Tabelle `relay_config` (Abschnitt 22); `config show` gibt es als eingerückten JSON-Text aus.

Die Schlüssel müssen beim Laden schon bestehen (`key new`), denn ein Relay, das mit der Datei nicht laufen könnte, soll sie nicht annehmen.

**Übernahme ohne Neustart.** `Relay.cycle` fragt zu Beginn jeder Runde die Versionsnummer in der Datenbank ab. Ist sie neu, baut es die Wege und Schlüssel neu auf und arbeitet danach mit der neuen Konfiguration; das Protokoll vermerkt `operating configuration <n> taken over`. Lässt sich eine geladene Konfiguration nicht aufbauen (zum Beispiel weil eine Schlüsseldatei inzwischen fehlt), arbeitet ein laufendes Relay mit der bisherigen weiter und vermerkt das Problem einmal im Protokoll; ohne bisherige Konfiguration startet es nicht. Der Zustand der Warteschlange bleibt von einem Wechsel unberührt; die Entscheidungen zur Weitergabe (Abschnitt 23) trifft das Relay mit der Konfiguration zum Zeitpunkt der Übergabe.

## 22. Speicher

Warteschlange, gesehene Übergaben und Betriebskonfiguration liegen in der Datenbank der Startkonfiguration (SQLAlchemy Core mit gebundenen Werten, Alembic; Spezifikation E6), die Anlagen in einem Verzeichnis. Die Tabellen heißen `relay_*`, die Version der Migrationen steht in `relay_alembic_version`.

| Tabelle | Inhalt |
|---|---|
| `relay_queue` | die Nachrichten, die das Relay angenommen und noch nicht übergeben hat: Reihenfolge (`seq`, wird nie wieder vergeben), Schlüssel des Eintrags (`entry_key`, eine UUID, die das Relay vergibt), `message_id`, `kind`, `sender`, `recipient`, die Nachricht als JSON (`message_json`), die Liste `hops` (`hops_json`), Zahl und Größe der Anlagen, `created_at`, `attempts`, `next_attempt_at`, `last_error` (Name des Fehlers der letzten Übergabe) |
| `relay_seen` | die Übergaben, die das Relay gesehen hat: `message_id` und `hops` (Zahl der Einträge von `hops`, Spezifikation 4.1 Schritt 4), `seen_at` |
| `relay_config` | eine Zeile: `version`, `document` (JSON) und `loaded_at` der Betriebskonfiguration |

Die Anlagen einer Nachricht in der Warteschlange liegen im Verzeichnis der Anlagen als `<entry_key>.<Nummer>.att` (Nummer ab 0 in der Reihenfolge von `message.attachments`). Namen von Anlagen, Nachrichten-IDs und Adressen kommen in keinem Dateinamen vor; der Schlüssel des Eintrags wird vor jedem Zugriff gegen die Form einer UUID geprüft. Geschrieben wird unter einem vorläufigen Namen (`….att.<16 Zeichen>.part`), auf den Datenträger geschrieben (`fsync`) und dann umbenannt; gelesen wird ohne einem Link zu folgen. Das Verzeichnis legt das Relay mit den Rechten `0700` an.

**Migration.** `pipwerk-relay migrate` bringt die Datenbank auf die neueste Version (Alembic, Version `0001`, alles oder nichts in einer Transaktion, siehe `migrate_scripts` in Abschnitt 13); scheitert eine Migration, wird zurückgerollt und der Befehl endet mit Exitcode 1. Eine Datenbank mit einer neueren Version, als der Code kennt, wird abgelehnt und nicht verändert. Alle anderen Befehle, die die Datenbank verwenden, prüfen zuerst, ob sie auf der neuesten Version ist, und lehnen sonst ab mit dem Hinweis auf `migrate` (`SchemaOutdated`): Der Betreiber entscheidet, wann sich das Schema ändert (Regel 8.2 Nr. 10). Die Migration läuft auch in einer Datenbank mit fremden Tabellen.

**Ort und Sicherung.** Eine SQLite-Datei gehört auf einen lokalen Datenträger des Rechners, nicht auf ein Netzlaufwerk (Sperren von SQLite, Abschnitt 13). Die Datenbank und das Verzeichnis der Anlagen enthalten die Nachrichten, die warten: ihren Inhalt und ihre Anlagen, aber keine Schlüssel und keine Zugangsdaten. Wer sie lesen kann, liest wartende Nachrichten; der Betreiber gibt sie wie das Verzeichnis für Geheimnisse nur dem Benutzer des Relays frei. Geht die Datenbank verloren, gehen die wartenden Nachrichten verloren, und gesehene Übergaben werden nicht mehr erkannt.

## 23. Weg einer Nachricht im Relay

Eine Runde (`Relay.cycle`) liest zuerst alle Eingänge, übergibt dann, was fällig ist, und räumt von Zeit zu Zeit auf. Die Schritte nach Spezifikation 4.1:

1. **Lesen und prüfen.** Für jeden Umschlag eines Eingangs (`Way.read`) prüft das Relay in dieser Reihenfolge: Prüfwert und Verbindung aus `link.from` (`Envelope.open` mit den Schlüsseln der angeschlossenen Komponenten und der Relays des Adressbuchs; `bad_mac`, `unknown_link`), dass der Umschlag für dieses Relay bestimmt ist (`link.to`; `wrong_recipient`), den Körper (`bad_body`), Größe und SHA-256 jeder Anlage (`attachment_*`) und dass der Inhalt einer Nachrichtenart, die die Bibliothek kennt, zu ihrem Schema passt (`bad_content`). Was nicht besteht, wird verworfen: Der Umschlag wird quittiert, und das Protokoll nennt die Kennung der Datei, den Eingang und den Grund (`envelope dropped inbox=… token=… reason=…`), ohne Inhalt, Absender und Adressat, denn sie sind vor einer bestandenen Prüfung nicht vertrauenswürdig. Das Relay schickt keine Meldung. Ein Umschlag mit fehlender oder nicht stimmender Anlage bekommt zuerst die Schonfrist (Abschnitt 26).
2. **Wiederholung (E4).** Kennzeichen einer Übergabe ist die Nachrichten-ID mit der Zahl der Einträge in `hops`. Steht es in `relay_seen` und ist nicht älter als `periods.seen_for_seconds`, wird der Umschlag quittiert, ohne etwas zu speichern (`repetition message=…`). Das geschieht vor den Schritten 3 und 4: Eine wiederholte Übergabe erzeugt keine zweite Meldung.
3. **Absender einer angeschlossenen Komponente.** Kommt der Umschlag von einer angeschlossenen Komponente (`link.from` ist ihr Name), muss `message.sender` `<Name>.<network>.<name>` sein. Sonst wird die Nachricht nicht weitergegeben; die Komponente erhält an ihre richtige Adresse eine Meldung mit dem Grund `sender_invalid`.
4. **Schleife.** Steht `<network>.<name>` schon in `hops`, oder hat `hops` die Länge `limits.max_hops` erreicht, ist die Nachricht unzustellbar mit dem Grund `loop`. Das Relay trägt sich erst beim Weitergeben in `hops` ein; eine Wiederholung derselben Übergabe kommt deshalb ohne das eigene Relay in `hops` an, eine im Kreis gelaufene Nachricht mit ihm und mit mehr Einträgen (anderes Kennzeichen).
5. **Annehmen.** Die Anlagen werden in das Verzeichnis der Anlagen geschrieben, dann hält eine Transaktion der Datenbank gemeinsam fest: die Übergabe als gesehen und die Nachricht in der Warteschlange (bei Schritt 3 und 4 statt ihrer die Meldung). Erst danach wird der Umschlag quittiert (`Way.acknowledge`). Ist die Übergabe in der Zwischenzeit schon gesehen worden, wird nichts gespeichert. Scheitert die Datenbank oder das Verzeichnis der Anlagen, bleibt der Umschlag im Eingang, die Dateien werden entfernt, und die nächste Runde versucht es noch einmal.
6. **Weitergabe nach der Adresse** (`Relay._route`, wenn der Eintrag fällig ist): Gehören pipwerk-Netz und Relay der Adresse zu diesem Relay, geht die Nachricht an die angeschlossene Komponente dieses Namens (`unknown_recipient`, wenn es sie nicht gibt; `relay` ist nie eine Komponente). Sonst geht sie an den Eintrag des Adressbuchs für `<Netz>.<Relay>`, sonst an das Standard-Relay (`unknown_relay`, wenn keines eingestellt ist). Das Relay bildet für die nächste Verbindung einen neuen Umschlag: `hops` um `<network>.<name>` ergänzt, `link.from` ist dieses Relay, `link.to` die andere Seite (Komponente oder `<Netz>.<Relay>`), Prüfwert mit dem Schlüssel dieser Verbindung. Der Weg nimmt ihn mit allen Anlagen entgegen (`Way.send`); erst die Rückkehr gilt als Bestätigung, und dann erst wird der Eintrag aus der Warteschlange entfernt.
7. **Wiederholung und Frist.** Scheitert die Übergabe (`WayUnavailableError` und jeder andere Fehler außer `WayTooLargeError`, auch von Wegen aus fremden Paketen), setzt das Relay den Eintrag auf einen späteren Zeitpunkt: Die Pause beginnt bei `retry_first_seconds` und verdoppelt sich bei jedem Fehlschlag bis `retry_max_seconds`. Ist seit der Annahme `periods.delivery_deadline_seconds` vergangen, ist die Nachricht unzustellbar mit `recipient_unreachable` (Übergabe an eine Komponente) beziehungsweise `relay_unreachable` (Übergabe an ein Relay). Ist die Nachricht für den Weg zu groß (`WayTooLargeError`: Umschlag oder Anlage über `max_envelope_bytes` oder `max_attachment_bytes` in den `settings` des Wegs), ist sie sofort unzustellbar mit `too_large`. Auch `WayRefusedError` zählt als Fehlschlag der Übergabe: Die Spezifikation kennt keinen eigenen Grund dafür.

**Meldung `relay.undeliverable` (Spezifikation 4.4).** Das Relay ersetzt die unzustellbare Nachricht in einer Transaktion durch die Meldung: Absender `relay.<network>.<name>`, Adressat der Absender der Nachricht (bei `sender_invalid` die richtige Adresse der Komponente), Bezug-Nachrichten-ID die ID der Nachricht, Priorität wie die Nachricht, Inhalt mit Grund, festem Text, Adressat und Art der Nachricht (`UndeliverableContent`, Abschnitt 10), `receipt` nein. Die Meldung steht danach in der Warteschlange und wird wie jede Nachricht weitergegeben, auch über andere Relays zurück. Ist eine Nachricht der Art `relay.undeliverable` selbst unzustellbar (Grund `sender_invalid` oder `loop` beim Annehmen, jeder Grund bei der Weitergabe), wird sie verworfen und im Protokoll vermerkt, ohne neue Meldung (`dropped, no new notice`). Eine Meldung nach Schritt 1 gibt es nie. Die Anlagen einer unzustellbaren Nachricht werden entfernt.

**Protokoll** (`logging`, Name `pipwerk_relay.relay`; Ziel und Stufe stellt die Startkonfiguration ein). Jede Annahme (`accepted`), Weitergabe (`forwarded`), Wiederholung (`repetition`), Unzustellbarkeit (`undeliverable`), jeder Fehlschlag einer Übergabe (mit Name des Fehlers, Nummer des Versuchs und Pause) und jede Verwerfung steht mit Nachrichten-ID, Nachrichtenart, Absender, Adressat, Weg (Name des Eingangs oder des Wegs) und Ergebnis im Protokoll, nie mit Inhalt, Anlagen oder Geheimnissen. Ein Fehler eines Wegs steht mit dem Namen des Fehlers, nicht mit seinem Text, wenn der Weg aus einem fremden Paket kommt.

## 24. Wiederanlauf nach hartem Beenden

Nach hartem Beenden (Absturz, `SIGKILL`, Stromausfall) geht zu keinem Zeitpunkt eine Nachricht verloren, und eine wiederholte Übergabe wird erkannt (E4). Die Schritte, die etwas außerhalb des Prozesses verändern, und was bei einem Abbruch dazwischen bleibt:

| Abbruch | Zustand danach | Folge nach dem Neustart |
|---|---|---|
| nach dem Schreiben der Anlagen, vor der Transaktion | Umschlag im Eingang, Dateien im Verzeichnis der Anlagen ohne Eintrag | der Umschlag wird gelesen und angenommen (mit neuem Schlüssel des Eintrags); die Dateien ohne Eintrag werden nach `periods.leftover_after_seconds` entfernt |
| nach der Transaktion, vor dem Quittieren | Nachricht in der Warteschlange und als gesehen vermerkt, Umschlag noch im Eingang | der Umschlag wird als Wiederholung erkannt und quittiert; die Nachricht wird einmal weitergegeben |
| nach der Übergabe an den nächsten Weg, vor dem Entfernen des Eintrags | Umschlag beim nächsten Relay, Eintrag noch in der Warteschlange | der Eintrag wird noch einmal übergeben, mit denselben `hops`; die empfangende Seite erkennt die Wiederholung (Relay: Abschnitt 23 Schritt 2, Anschluss einer Komponente: Abschnitt 11) |
| nach dem Entfernen des Eintrags, vor dem Entfernen der Anlagen | Dateien ohne Eintrag | werden nach der Frist entfernt |
| während einer Meldung (Ersatz) | eine Transaktion: Nachricht oder Meldung, nie beide, nie keine | wie oben |

Die Tests belegen das auf zwei Wegen (`tests/test_recovery.py`, `tests/test_process.py`): Das Relay wird an jedem seiner Schritte, die etwas verändern (`FilesWay.send`, `FilesWay.acknowledge`, `RelayStore.accept`, `RelayStore.replace`, `RelayStore.reschedule`, `AttachmentStore.write`, `AttachmentStore.remove`), vor und nach dem Schritt angehalten (`SimulatedCrash` ist eine `BaseException`, die das Relay nicht fängt, wie es einen harten Abbruch nicht fangen würde) und danach mit neuem `Relay` auf denselben Dateien neu gestartet; in jedem Fall kommt die Nachricht mit ihrer Anlage genau einmal an, die Bestätigung kommt zurück, Warteschlange und Eingänge sind leer, und die Reste sind nach der Frist entfernt. Dazu läuft das Relay als eigener Prozess, während 150 Nachrichten mit Anlagen eintreffen, und wird mit `SIGKILL` beendet, sobald die erste angekommen ist; nach dem Neustart kommt jede der 150 genau einmal an.

## 25. Begrenzungen gegen Überlast

Die Werte legt dieser Auftrag fest (Spezifikation 4.5); alle sind in der Betriebskonfiguration einstellbar.

| Begrenzung | Wert | Verhalten bei erreichter Grenze |
|---|---|---|
| Größe von Umschlag und Anlage je Weg | Voreinstellung der Bibliothek: `max_envelope_bytes` 1 MiB, `max_attachment_bytes` 256 MiB; in den `settings` jedes Eingangs, jeder Komponente und jedes Eintrags einstellbar | Eingang: ein größerer Umschlag wird gar nicht gelesen und als fehlerhaft verworfen (`too_large`, Protokoll). Ziel: die Nachricht ist unzustellbar mit `too_large` (Abschnitt 23 Schritt 7). Anlagen liegen beim Lesen und Senden im Arbeitsspeicher; die Höchstgröße begrenzt auch den Bedarf daran. |
| Zahl der Nachrichten in der Warteschlange | `limits.max_queue_messages`, 10000 | Das Relay liest keinen Eingang mehr, bis wieder Platz ist; die Umschläge bleiben im Eingang. Gelesen werden höchstens so viele Umschläge, wie noch Platz ist. |
| Platz für Anlagen | `limits.max_attachment_storage_bytes`, 10 GiB | Würde der Platz überschritten, nimmt das Relay diesen Umschlag und alle späteren dieses Eingangs in dieser Runde nicht an (`STOP`); sie bleiben im Eingang. Eine einzelne Anlage, die größer ist als der ganze Platz, kann nie angenommen werden und wird als fehlerhaft verworfen. |
| Umschläge je Schritt | `limits.read_batch`, 100 | begrenzt Arbeit und Speicher einer Runde; bei verzögerten Umschlägen liest das Relay bis zum 16fachen (Abschnitt 26) |
| Länge von `hops` | `limits.max_hops`, 8 | Schleife (`loop`) |
| Größe der Betriebskonfiguration | 1 MiB | die Datei wird abgelehnt |

Wiederholungen eines Umschlags, der schon gesehen wurde, werden bei voller Warteschlange erst gelesen, wenn wieder Platz ist; sie bleiben bis dahin liegen. Das Platz-Prüfen geschieht vor dem Speichern, nie danach: Das Relay nimmt nie an, was es nicht speichern kann.

## 26. Schonfrist, Eingänge mit verzögerten Umschlägen und Aufräumen

Diese Regeln setzen die Hinweise 3 und 4 des Testberichts zu Auftrag 01 um (`development/relay/wp01/tests/01-functiontest-1.md`).

**Schonfrist.** `Way.read` meldet einen Umschlag, dessen Anlage fehlt oder nicht zur Beschreibung in der Nachricht passt (Größe, SHA-256), als `FaultyEnvelope` mit dem Grund `attachment_missing`, `attachment_size` oder `attachment_hash`. Auf einem Netzlaufwerk kann das eine Verzögerung des Zwischenspeichers sein (Abschnitt 9, Annahme 3). Das Relay verwirft einen solchen Umschlag erst, wenn sein Eingang länger als `periods.attachment_grace_seconds` zurückliegt (`modified_at`); vorher bleibt er liegen und wird in der nächsten Runde erneut gelesen (`postponed`). Ein Umschlag, dessen Anlage später erscheint, wird so noch angenommen. Alle anderen Fehler (kein gültiger Umschlag, Umschlag oder angegebene Anlage über der Höchstgröße des Wegs, falsches `format`, `stored`) werden sofort verworfen. Die Schonfrist muss größer sein als die Abweichung der Uhren und der Zwischenspeicher der Einbindung (Abschnitt 9, Annahme 5).

**Verzögerte Umschläge blockieren nicht.** `FilesWay.read` liest die ältesten `limit` Umschläge. Liegen so viele fehlerhafte, noch nicht verworfene Umschläge vor den übrigen, dass sie alle gelesenen Plätze besetzen, würde ein neuer Umschlag nie gelesen. Das Relay erkennt das daran, dass in einem Durchgang kein Umschlag erledigt wurde und alle gelesenen warten, und liest dann erneut mit doppelter Zahl, bis zum 16fachen von `limits.read_batch` (und höchstens so viele, wie in der Warteschlange noch Platz ist). Mit Ablauf der Schonfrist verschwinden die wartenden Umschläge.

**Aufräumen.** Alle `periods.cleanup_interval_seconds` (und in der ersten Runde) tut das Relay:

- gesehene Übergaben entfernen, die älter sind als `periods.seen_for_seconds`;
- für jeden Weg, den die Konfiguration verwendet (Eingänge, Komponenten, Adressbuch; jeder einmal), `Way.clean_up(leftover_after_seconds, jetzt)` aufrufen. Der Verzeichnis-Weg entfernt damit `*.part`-Dateien und Anlagen ohne Umschlag, die älter sind als `periods.leftover_after_seconds` (Abschnitt 9, Annahme 6). Das gilt für die Eingänge (Reste unterbrochener Komponenten) und die Ziele (Reste eigener unterbrochener Übergaben). Ist ein Weg nicht erreichbar, vermerkt das Relay es im Protokoll;
- im Verzeichnis der Anlagen Dateien entfernen, zu denen es keinen Eintrag in der Warteschlange gibt, und unfertige `*.part`-Dateien, wenn sie älter sind als `periods.leftover_after_seconds`.

Die Frist muss länger sein als der längste Schreibvorgang einer Übergabe und die Verzögerung des Dateisystems (Voreinstellung 1 Stunde).

## 27. Befehle

`pipwerk-relay [-c <Pfad>] <Befehl>`; ohne `-c` sucht das Relay die Startkonfiguration (Abschnitt 20). Exitcode 0: erledigt. 1: der Befehl ist gescheitert (Text auf der Standardfehlerausgabe). 2: ungültiger Aufruf oder ungültige Startkonfiguration. Das Relay öffnet bei keinem Befehl einen Port (`tests/test_commands.py` verbietet in einem Test die Erzeugung eines Sockets).

| Befehl | Wirkung |
|---|---|
| `migrate` | bringt die Datenbank auf die neueste Version des Schemas (Abschnitt 22) |
| `key new <Datei>` | erzeugt einen Schlüssel für eine Verbindung im Verzeichnis für Geheimnisse (`SecretsDirectory.new_key`: 32 Byte aus `secrets`, Rechte `0600`, ein vorhandener Schlüssel wird nie überschrieben, `<Datei>` ist ein Dateiname, nie ein Pfad). Der Schlüssel wird nicht ausgegeben. Der Betreiber gibt eine Kopie der anderen Seite auf sicherem Weg. |
| `config load <Datei>` | prüft die JSON-Datei und macht sie zur Betriebskonfiguration, oder lehnt sie als Ganzes ab (Abschnitt 21) |
| `config show` | gibt die Betriebskonfiguration in Gebrauch als JSON aus |
| `queue` | listet die Nachrichten der Warteschlange mit Stand, ohne Inhalt: `seq`, Nachrichten-ID, Art, Absender, Adressat, Stand (`new`: noch kein Versuch der Übergabe, `retrying`: mindestens ein Versuch ist gescheitert), Zahl der Versuche, Zeitpunkt der Annahme, Zeitpunkt des nächsten Versuchs und Name des letzten Fehlers; darunter die Zahl der Nachrichten und die Größe der Anlagen |
| `run` | prüft die Rechte des Verzeichnisses für Geheimnisse, legt das Verzeichnis der Anlagen an, richtet das Protokoll ein, lädt die Betriebskonfiguration und arbeitet in Runden mit `periods.read_interval_seconds` Pause, bis es mit `SIGINT` (Strg+C), `SIGTERM` oder unter Windows `SIGBREAK` beendet wird; das Ende lässt die laufende Runde fertig werden (Exitcode 0) |
| `probe listen -c <Pfad> -o <Verzeichnis>` | die Prüfkomponente empfängt, bis sie beendet wird, und schreibt jede Nachricht mit ihren Anlagen in das Verzeichnis (Abschnitt 31); `-c` ist ihre eigene Startkonfiguration `pipwerk-relay-probe.ini`, nicht die des Relays |
| `probe send -c <Pfad> --address <Adresse> --text <Text> [--file <Datei> …] [--receipt] [--wait <Sekunden>]` | die Prüfkomponente sendet eine Nachricht `probe.message` und zeigt, was zurückkommt (Abschnitt 31) |

Ohne geladene Betriebskonfiguration (`NotConfigured`) oder mit einer, die sich nicht aufbauen lässt, startet `run` nicht. Eine Runde, die an einem Fehler der Datenbank oder des Dateisystems scheitert, vermerkt den Namen des Fehlers im Protokoll, und die nächste Runde versucht es noch einmal. `probe` liest nicht `pipwerk-relay.ini`: Wer `-c` vor `probe` angibt, bekommt Exitcode 2 mit dem Hinweis, `-c` hinter die Aktion zu setzen.

## 28. Sicherheit des Relays

Zuordnung zu den Sicherheitsregeln ([Entwicklungs-, Test- und Sicherheitsregeln](development-test-security-rules.md), 8.2, 8.3), zu BSI-Grundschutz und OWASP ASVS beziehungsweise OWASP API Security und zu Abschnitt 7 der Spezifikation, soweit sie auf das Relay anwendbar sind. Die Teile der Bibliothek stehen in Abschnitt 14.

| Anforderung | Umsetzung im Relay | Test |
|---|---|---|
| Kein Port (Spezifikation E2, 7; Regel 8.2 Nr. 7; OWASP API8) | Das Relay hat keinen Server und keine Web-API; ausgehend verwendet es nur die Wege der Konfiguration (Verzeichnisse). Kein Befehl erzeugt einen Socket. | `test_commands` (Socket verboten) |
| Eingaben vor jeder Verarbeitung prüfen (Regel 8.2 Nr. 2; ASVS V5) | Prüfwert, Verbindung, Empfänger, Körper, Anlagen (Größe, SHA-256) und Inhalt der bekannten Arten werden geprüft, bevor die Nachricht gelesen, gespeichert oder auch nur ihre ID verwendet wird. Betriebskonfiguration und Startkonfiguration: strenge Modelle, zusätzliche Einträge werden abgelehnt, ungültige Dateien als Ganzes. | `test_undeliverable`, `test_operating`, `test_startup`, `test_schemas` |
| Fälschung (req-relay-010) und Meldungen (Spezifikation 4.1 Schritt 1) | Eine gefälschte oder veränderte Nachricht, Anlage oder ein falscher Schlüssel wird verworfen und ohne Absender, Adressat und Inhalt vermerkt; es geht keine Meldung an einen vermeintlichen Absender. Eine Komponente kann keine Nachricht unter fremder Adresse senden (`sender_invalid`, Meldung an die wirkliche Adresse). | `test_undeliverable` |
| Kryptografie (ASVS V6; BSI CON.1) | Das Relay prüft und bildet Prüfwerte nur mit `Envelope` der Bibliothek (HMAC-SHA256, Vergleich in konstanter Zeit, Schlüssel 32 Byte aus `secrets`, ein Schlüssel je Verbindung); keine eigene Kryptografie. | `test_forwarding` (Weitergabe über Relays mit je eigenem Schlüssel) |
| Umgang mit Geheimnissen (Regel 8.2 Nr. 1; ASVS V2.10) | Schlüssel nur als Dateien im Verzeichnis für Geheimnisse, dessen Rechte vor dem Start geprüft werden (Abschnitt 20); die Betriebskonfiguration nennt nur Dateinamen; Schlüssel stehen nie in Datenbank, Protokoll, Ausgabe oder Fehlermeldung (`key new` und `config show` zeigen keinen Schlüssel); die URL der Datenbank steht nie in einer Meldung. Das Relay startet nicht mit offenen Rechten. | `test_commands` (Rechte, Ausgabe), `test_startup`, `test_operating` |
| Dateizugriffe (Regel 8.3 Nr. 5; ASVS V12) | Dateien im Verzeichnis der Anlagen entstehen nur aus dem Schlüssel des Eintrags (UUID, geprüft) und der Nummer; Schreiben atomar mit `fsync`; Lesen ohne Link, Verzeichnis mit `0700`. Die Dateien der Wege nach Abschnitt 8. | `test_attachments`, `test_limits` |
| Fehlerbehandlung ohne Einzelheiten (Regel 8.2 Nr. 8; ASVS V7) | Fehlertexte nennen Eintrag, Grund oder Dateiname, nie Wert oder Pfad; Fehler fremder Wege erscheinen nur mit dem Namen der Fehlerklasse. | `test_operating`, `test_startup`, `test_commands`, `test_forwarding` |
| Begrenzung von Ressourcen (Spezifikation 4.5; OWASP API4) | Größe je Weg, Zahl der Nachrichten, Platz für Anlagen, Länge von `hops`, Umschläge je Schritt, Größe der Betriebskonfiguration (Abschnitt 25). | `test_limits`, `test_operating` |
| Protokollierung (Regel 8.3 Nr. 4; ASVS V7; BSI OPS.1.1.5) | Zeilen mit Nachrichten-ID, Art, Absender, Adressat, Weg, Ergebnis; keine Inhalte, Anlagen, Schlüssel, Pfade der Daten oder unprüfbare Angaben eines verworfenen Umschlags. | `test_forwarding`, `test_undeliverable`, `test_commands` |
| Datenbank (Regel 9: SQLAlchemy, Alembic; Regel 8.2 Nr. 10) | SQLAlchemy Core mit gebundenen Werten, kein zusammengesetztes SQL; Migration alles oder nichts, vom Betreiber ausgelöst (`migrate`), andere Befehle lehnen ein altes Schema ab; Transaktion für „gesehen“ und „gespeichert“. | `test_database`, `test_commands` |
| Zustellung mindestens einmal, Wiederholung erkennbar (E4) | Abschnitt 24 | `test_recovery`, `test_process` |
| Erweiterungen (Regel 12; BSI APP.7) | Wege nur über die Einstiegspunkte der Bibliothek; der Name steht in der Konfiguration; Angaben prüft der Weg; ein Fehler eines Wegs hält die Runde nicht an. | `test_operating`, `test_forwarding` |
| Sichere Voreinstellungen (Regel 8.3 Nr. 2) | kein Port; Verzeichnis der Anlagen `0700`; Rechte des Verzeichnisses für Geheimnisse geprüft; Grenzen gesetzt; ungültige Konfiguration wird nie teilweise übernommen. | `test_commands`, `test_operating`, `test_limits` |

Abweichungen und Grenzen:

- Die Prüfung der Zugriffsrechte unter Windows ist nicht ausgeführt (Abschnitt 6, „Stand des Nachweises“); sie braucht einen Lauf auf einem Windows-Rechner.
- Mitlesen auf dem Weg und im Verzeichnis verhindert das Relay nicht (Verschlüsselung ist offen, req-relay-011). Wartende Nachrichten liegen unverschlüsselt in Datenbank und Verzeichnis der Anlagen (Abschnitt 22).
- Die Relays eines pipwerk-Netzes betreibt der Betreiber, ihnen wird vertraut (E5). Ein Schutz von Absender zu Empfänger über alle Relays gibt es nicht.
- Ein Prozess je Datenbank: Das Relay hindert einen zweiten Prozess auf derselben Datenbank nicht. Die Transaktionen der Datenbank halten die Tabellen auch dann zusammen, aber zwei Prozesse könnten dieselbe Nachricht zweimal übergeben (der Empfänger erkennt die Wiederholung, E4) und Dateien der Anlagen des anderen als Rest ansehen. Der Betreiber startet einen Prozess je Datenbank.
- Eine Übergabe wird vom Empfänger als Wiederholung erkannt, solange sie in der Frist `periods.seen_for_seconds` liegt; danach gilt eine alte Nachricht, die noch einmal ankommt, als neu.
- Ein Umschlag mit `stored` (Wege für Dateien, Paket `wp04`) wird als fehlerhaft verworfen.

## 29. Abhängigkeiten des Relays

Das Relay bringt keine neue Drittabhängigkeit mit. Laufzeit: Pydantic 2.13.5, SQLAlchemy 2.1.5 und Alembic 1.20.0 (dieselben festgeschriebenen Versionen und Prüfungen wie in Abschnitt 14) und die Bibliothek `pipwerk-relaycore` 0.1.0 als Pfadabhängigkeit auf `packages/relay-core` (Zweck: Abschnitt 18). Entwicklung: pytest 9.1.1, ruff 0.17.1, mypy 2.4.0, jsonschema 4.26.0 und types-jsonschema (dieselben Versionen wie bei `relay-core`). Die Versionen stehen in `pyproject.toml` und `uv.lock` der Komponente; `scripts/check --with-audit` prüft sie auf bekannte Schwachstellen. Kopplung: SQLAlchemy erscheint nur in `tables`, `store`, `database` und beim Erzeugen der Verbindung; die öffentlichen Typen (`QueueEntry`, `NewEntry` und so weiter) sind einfache Datenklassen, keine ORM-Klassen.

## 30. Prüfskript des Relays und Tests

`components/pipwerk-relay/scripts/check [--with-audit]` führt auf dem Arbeitsverzeichnis, zu dem das Skript gehört, nacheinander aus: `uv sync --frozen`, `pytest`, `ruff check`, `ruff format --check`, `mypy`, mit `--with-audit` zusätzlich `pip-audit` für die gesperrten Pakete. Es endet mit Exitcode 0, nur wenn alle bestehen, und enthält keine festen Pfade, Ports oder Rechnernamen. Die Bibliothek hat ihr eigenes Prüfskript (Abschnitt 16).

Die Tests bauen Relays mit der echten Bibliothek und echten Anschlüssen (`Connector`) in temporären Verzeichnissen (`tests/support.py`: je Relay ein Eingang, je Komponente ein Verzeichnis für das, was das Relay ihr übergibt, eigene Datenbank und eigenes Verzeichnis für Geheimnisse; die Uhr stellt der Test).

| Datei | Prüft |
|---|---|
| `test_forwarding.py` | Weitergabe im eigenen Relay, über das Adressbuch, über eine Kette von Standard-Relays (Vorrang des Adressbuchs), Antwort auf demselben Weg, Protokoll ohne Inhalt, Reihenfolge der Prüfungen (Wiederholung vor Absender), unerwartete Fehler von Wegen, nicht erreichbarer Eingang |
| `test_undeliverable.py` | jeder Grund der Unzustellbarkeit (`sender_invalid`, `loop`, `unknown_recipient`, `unknown_relay`, `relay_unreachable`, `recipient_unreachable`, `too_large`) mit der Meldung beim Absender, wachsende Pausen, Zustellung nach Wiederkehr, Meldung über eine Meldung, Wiederholung derselben Übergabe, Schleife neben Wiederholung, Fälschungen (falscher Schlüssel, unbekannte Verbindung, falscher Empfänger, veränderte Anlage, Inhalt zur Art) ohne Meldung und ohne Inhalt im Protokoll |
| `test_recovery.py` | Wiederanlauf: Anhalten vor und nach jedem Schritt, Wiederholung nach Anhalten vor dem Quittieren und nach der Übergabe |
| `test_process.py` | das Relay als Prozess, `SIGKILL` mitten in 150 Nachrichten, Neustart, Beenden auf Wunsch |
| `test_limits.py` | Zahl der Nachrichten, Platz für Anlagen, einzelne zu große Anlage, Größe je Weg am Eingang, Schonfrist, verzögerte Umschläge blockieren nicht, Aufräumen im Eingang, in Zielen und im Verzeichnis der Anlagen, gesehene Übergaben |
| `test_operating.py` | Modelle der Betriebskonfiguration (Felder, Regeln, Grenzen, Namen), Laden als Ganzes, Ablehnung mit Stelle der Probleme, Übernahme ohne Neustart, nicht aufbaubare Konfiguration |
| `test_schemas.py` | Schema gleich Modell, Beispiele, Grenzfälle in Schema und Modell gleich, Regeln nur im Modell |
| `test_database.py` | Migration (leer, Wiederholung, fremde Tabellen, Gleichheit mit den Tabellen, Rücknahme, neuere Version, Rückrollen), Prüfung der Version, Speicher |
| `test_attachments.py` | Verzeichnis der Anlagen |
| `test_startup.py` | Startkonfiguration und ihr Beispiel |
| `test_commands.py` | die Befehle, Exitcodes, Rechte vor dem Start, Lauf bis zum Beenden, kein Port |
| `test_documentation.py` | die Dokumentation nennt Felder, Befehle, Tabellen, Werte und Gründe |
| `test_probe.py` | die Prüfkomponente (Abschnitt 31): Startkonfiguration und ihr Beispiel, `listen` (Dateien unverändert, eine Zeile je Nachricht, Wiederholung, Schreibfehler), `send` (Bestätigung, Meldung mit Grund, ausgebliebene Bestätigung, Übergabe scheitert, Datei zu groß), der Aufruf an der Befehlszeile mit Exitcodes und `listen` als Prozess |
| `test_disturbances.py` | die Störungen 1 bis 7 mit zwei Relays, gemeinsamem Verzeichnis und Prüfkomponente (Abschnitt 33) |
| `test_testenv.py` | das Skript `scripts/testenv` (gültig, ausführbar, ohne feste Ports, Pfade und Namen, Ablehnung ungültiger Aufrufe vor jeder Änderung, jede Störung benannt, Dokumentation) und die Nachbildung von `MetaTrader5` |

Die Hilfen der Tests liegen in `tests/support.py` (Welt mit mehreren Relays; ein Relay kann ein zweites Verzeichnis im gemeinsamen Verzeichnis haben), `tests/probe_bench.py` (zwei Relays mit gemeinsamem Verzeichnis und je einer Prüfkomponente, die Schritte der Prüfkomponente bewegen die Uhr und arbeiten eine Runde) und `tests/crash.py` (hartes Ende des Relays an einem Schritt, auch von `test_recovery.py` verwendet).

## 31. Prüfkomponente (`probe`)

Die Prüfkomponente (Spezifikation 8, „Prüfkomponente“; Modul `probe`) ist eine laufende Komponente von pipwerk relay, mit der sich die Grundmechanik ohne den Abruf und ohne MetaTrader 5 nachweisen lässt. Sie hat wie jede Komponente eine Adresse, einen Schlüssel der Verbindung mit ihrem Relay und eine Startkonfiguration. `probe listen` und `probe send` sind zwei Befehle desselben Programms; jede Prüfkomponente läuft mit eigener Adresse (ein `send` und ein `listen` verwenden nie dieselbe Adresse und dieselbe Datenbank, weil sie sonst einander den Eingang leer lesen).

**Startkonfiguration.** `pipwerk-relay-probe.ini` (Beispiel `pipwerk-relay-probe.example.ini`), mit `-c <Pfad>` hinter der Aktion oder in den Suchorten wie bei der Startkonfiguration des Relays (Abschnitt 20, mit dem Dateinamen der Prüfkomponente). Sie hat die Abschnitte `[relay]` und `[relay.way]` in der Form, die jede Komponente verwendet (Abschnitt 11.1; dieselben Vorworte `target.` und `inbox.` wie `pipwerk-fetch-mt5`, Spezifikation 6.1) und liest sie mit `read_connection_settings` und `open_connector` der Bibliothek. Ein anderer Abschnitt wird abgewiesen („unknown section“); die Schreibweise der Einträge von `[relay.way]` bleibt erhalten. Fehler der Datei oder der Verbindung (`StartupConfigError`, `ConnectionSettingsError`) enden mit Exitcode 2, ohne etwas zu senden; der Text nennt den Eintrag oder die Datei, nie den Wert und nie den Schlüssel.

**Exitcodes.** 0 erledigt (`send`: die Bestätigung ist angekommen, oder es wurde keine verlangt und es kam keine Meldung); 1 die Nachricht wurde nicht zugestellt (Meldung des Relays), nicht bestätigt (Frist abgelaufen) oder ließ sich nicht an das Relay übergeben; 2 ungültiger Aufruf oder ungültige Startkonfiguration. Hinweise für den Anwender stehen auf der Standardausgabe, Fehler und Meldungen mit Exitcode 1 auf der Standardfehlerausgabe, englisch wie die übrigen Texte des Relays.

### 31.1 `probe listen`

`probe listen -c <Pfad> -o <Verzeichnis>`: öffnet den Anschluss, legt das Verzeichnis an, schreibt `pipwerk-relay probe listen: address <Adresse>, writing to <Verzeichnis> (stop with Ctrl+C).` und liest den Eingang im Abstand von `poll_interval_seconds`, bis es mit Strg+C oder `SIGTERM` (unter Windows `SIGBREAK`) beendet wird (`pipwerk-relay probe listen: stopped.`, Exitcode 0). Für jede Nachricht, die der Anschluss übergibt (nach Prüfung von Prüfwert, Empfänger, Anlagen und Inhalt, Abschnitt 11), gilt:

- Die Nachricht steht in einem Verzeichnis `<Verzeichnis>/<Nachrichten-ID>/`: `message.json` ist die Nachricht (JSON der Bibliothek), `files/<Name>` sind ihre Anlagen, Byte für Byte. Das Verzeichnis erscheint vollständig oder gar nicht (es entsteht unter dem Namen `<ID>.<Zufall>.part` und wird umbenannt); Namen der Anlagen sind durch die Regeln der Nachricht (Abschnitt 4) nie ein Pfad.
- Eine Zeile auf der Standardausgabe: `Message <ID> (<Art>) from <Absender>: <n> attachments (<Namen>), stored in <Pfad>`; für `relay.undeliverable` beginnt sie mit `Notice`. Die Zeile ist Ausgabe für den Anwender, nicht das Protokoll.
- `probe.message` und jede andere Art werden gleich behandelt: Die Prüfkomponente deutet den Inhalt nicht.
- Kommt dieselbe Nachricht noch einmal (das Ende vor dem Vermerk „gesehen“, Abschnitt 11), ist ihr Verzeichnis schon da und bleibt unverändert; die Zeile erscheint trotzdem. Scheitert das Schreiben (volle Platte), bleibt kein `.part`-Verzeichnis zurück, `store` löst die Ausnahme aus, der Umschlag bleibt im Eingang, und der nächste Durchlauf versucht es noch einmal (Abschnitt 11, Punkt 5).
- Eine Empfangsbestätigung schickt der Anschluss, wenn der Absender eine verlangt hat (Abschnitt 12), erst nachdem das Verzeichnis geschrieben ist.
- Beim Start entfernt `listen` die unfertigen Verzeichnisse `*.part`, die ein hartes Ende einer früheren Arbeit hinterlassen hat (`remove_leftovers`); ihre Nachrichten liegen noch im Eingang und kommen noch einmal.

Das Protokoll der Bibliothek (`logging`, Stufe `WARNING` und höher) geht auf die Standardfehlerausgabe: verworfene Umschläge mit Grund, Fehler beim Speichern.

### 31.2 `probe send`

`probe send -c <Pfad> --address <Adresse> --text <Text> [--file <Datei> …] [--receipt] [--wait <Sekunden>]`:

| Angabe | Bedeutung |
|---|---|
| `--address` | Adresse des Empfängers `<Komponente>.<Netz>.<Relay>` (Pflicht) |
| `--text` | der Text der Nachricht, 1 bis 1000 Zeichen (Pflicht) |
| `--file` | eine Datei als Anlage, mehrmals möglich; der Name der Anlage ist der Dateiname (Regeln der Anlagen, Abschnitt 4: 1 bis 128 Zeichen aus Buchstaben, Ziffern und `. _ # + -`, kein Punkt am Anfang, keine zwei gleichen Namen) |
| `--receipt` | verlangt die Empfangsbestätigung (Abschnitt 12) |
| `--wait` | mit `--receipt` die Frist der Bestätigung, sonst die Zeit, in der auf eine Meldung gewartet wird; 1 bis 604800 Sekunden, Voreinstellung 30 |

Zuerst prüft `send` den Aufruf (Adresse, Text, Frist, Dateien lesbar und mit zulässigem Namen) und die Startkonfiguration, dann sendet es eine Nachricht der Art `probe.message` mit Priorität `normal` (Zeile `Sent message <ID> to <Adresse> with <n> attachments[, receipt wanted within <s> seconds].`). Danach liest es den eigenen Eingang im Abstand von `poll_interval_seconds` und endet mit einem von vier Ergebnissen:

| Ergebnis | Anzeige | Exitcode |
|---|---|---|
| Die Bestätigung ist angekommen | `Receipt: message <ID> was stored by <Adresse>.` | 0 |
| Eine Meldung `relay.undeliverable` zur Nachricht (req-relay-008) | `Notice from <Relay>: message <ID> is undeliverable (<Grund>): <fester Text>` | 1 |
| Die Frist der Bestätigung ist ohne Bestätigung abgelaufen (Abschnitt 12) | `No receipt: message <ID> to <Adresse> was not confirmed within <s> seconds.` | 1 |
| Ohne `--receipt` kam in der Wartezeit keine Meldung | `No notice came back within <s> seconds for message <ID>.` | 0 |

Eine Meldung beendet das Warten auf die Bestätigung (Abschnitt 12); es folgt keine zweite Anzeige. Eine späte Bestätigung nach der Frist erscheint nur im Protokoll des Anschlusses (`receipt dropped`), `send` ist dann schon beendet. Ließ sich die Nachricht nicht an das Relay übergeben (der Weg zum Relay ist nicht erreichbar oder die Anlage ist für ihn zu groß), steht `pipwerk-relay probe: the message could not be handed to the relay: <Fehler>.` auf der Standardfehlerausgabe (Exitcode 1); es wartet dann nichts. Nachrichten anderer Art oder anderen Bezugs, die im Eingang liegen, zeigt `send` mit `Received <Art> <ID> from <Absender>.` an. Die Warnungen der Bibliothek zeigt `send` nicht (Stufe `ERROR`), weil es dasselbe selbst sagt. Eigene Uhren (`Timing`) ersetzen in den Tests die Systemuhr, damit eine Frist von Minuten in einem Test vergeht, ohne zu warten.

## 32. Testumgebung

`components/pipwerk-relay/scripts/testenv` (Aufbau und Aufruf wie das Skript der Komponente `pipwerk-replay`) richtet auf einem Rechner ohne weiteres Zutun eine laufende Umgebung ein, in der Tester und QA die Durchgänge und die Störungen durchführen (Spezifikation 8, „Testumgebung“, Durchgang 1):

```
testenv [--directory <Verzeichnis>] start --network <Name> --relay-a <Name> --relay-b <Name> --broker <Name>
        [--delivery-deadline <Sekunden>] [--limit-bytes <Bytes>]
        [--listen-name <Name>] [--send-name <Name>] [--fetch-name <Name>] [--request-name <Name>]
testenv [--directory <Verzeichnis>] stop
testenv [--directory <Verzeichnis>] status
testenv [--directory <Verzeichnis>] send <a|b> <Angaben von „probe send“>
testenv [--directory <Verzeichnis>] request <Angaben von „pipwerk-fetch-mt5 request“>
testenv [--directory <Verzeichnis>] queue <a|b>
testenv [--directory <Verzeichnis>] fault <1 bis 7> [<Aktion>]
```

**Aufbau.** Das Skript leitet das Arbeitsverzeichnis aus seinem Pfad ab und lässt sich aus jedem Verzeichnis aufrufen. Es startet nur aus genau einem Commit: Das Git-Arbeitsverzeichnis muss frei von nicht übernommenen Änderungen und von neuen Dateien sein, die nicht ignoriert werden (wie bei `pipwerk-replay`); vorher wird nichts installiert oder gestartet. Es enthält keine festen Ports, Pfade oder Namen: Netz, Relays, Handelsserver und die Namen der vier Rollen kommen aus Parametern (die Rollen heißen ohne Angabe `listen`, `send`, `fetch` und `request`), das Verzeichnis der Umgebung aus `--directory` oder, ohne Angabe, `components/pipwerk-relay/.testenv/` (von Git ignoriert). Es gibt keine Ports, weil die Teile über Verzeichnisse sprechen; `status` nennt stattdessen die Verzeichnisse.

```
<Verzeichnis>/
  state                      Zustand der Umgebung (Namen, Prozessnummern)
  shared/                    das gemeinsame Verzeichnis zwischen den Relays (Ersatz für das Netzlaufwerk)
    in-<Relay a>/            Eingang des Relays a für Umschläge des Relays b
    in-<Relay b>/
  side-a/, side-b/           je ein Relay
    relay.ini, relay.db, relay.log, operating.json, secrets/, attachments/
    in/                      Eingang für die Komponenten dieses Relays (ein Verzeichnis zwischen Komponente und Relay)
    to-<Rolle>/              Eingang der Komponente (dorthin legt das Relay für sie ab)
    received/                die Nachrichten der lauschenden Prüfkomponente (Abschnitt 31.1)
    <Rolle>/                 je Komponente: Startkonfiguration, secrets/ mit dem Schlüssel, state/, Protokoll
```

**Was gestartet wird.** Die Relays a und b (`pipwerk-relay run`) mit Betriebskonfiguration, Schlüsseln der Komponenten und einem Schlüssel für die Verbindung der Relays (`pipwerk-relay key new`, die Kopie liegt im Verzeichnis für Geheimnisse der anderen Seite; alle Verzeichnisse für Geheimnisse haben die Rechte `0700`); je eine lauschende Prüfkomponente (`probe listen`) auf beiden Seiten; die Komponente `fetch` (`pipwerk-fetch-mt5 serve`) auf Seite b mit der Nachbildung von `MetaTrader5` aus `scripts/replica/MetaTrader5.py` (Handelsserver wie mit `--broker` gegeben, Zeitzone der Serverzeit UTC; Symbole `EURUSD`, `GBPUSD`, `USDJPY`; Kerzen auf allen Stufen der Zeiteinheit, ein Tick alle zehn Sekunden; die Daten sind erfunden und nur für den Transport gedacht); bei Bedarf die Aufrufe `send` (`probe send` der sendenden Prüfkomponente der Seite) und `request` (`pipwerk-fetch-mt5 request` auf Seite a). Die Relays tauschen über zwei Eingänge: `in/` für die eigenen Komponenten und `shared/in-<Relay>/` für das andere Relay. Die Fristen sind kurz eingestellt (Lesen alle Sekunde, Wiederholung nach 2 bis 10 Sekunden, Schonfrist für Anlagen 10 Sekunden); `--delivery-deadline` (Voreinstellung 120 Sekunden) ist die Frist, nach der ein Relay eine Nachricht als unzustellbar meldet (Spezifikation 4.1 Schritt 7), `--limit-bytes` (Voreinstellung 4194304) die größte Anlage auf dem Weg zwischen den Relays (`max_attachment_bytes` im Adressbuch).

**Befehle.** `testenv stop` beendet, was das Skript gestartet hat (Prüfung an der Prozessnummer und der Startkonfiguration des Prozesses, dann `SIGTERM`, nach 10 Sekunden `SIGKILL`), und entfernt das Verzeichnis. `testenv status` meldet, ob jeder Prozess läuft und ob das gemeinsame Verzeichnis verbunden ist, und nennt alle Verzeichnisse und Adressen; Exitcode 1, wenn etwas nicht läuft. `testenv queue` ruft `pipwerk-relay queue` des Relays auf, `testenv send` das `probe send` der sendenden Prüfkomponente einer Seite und `testenv request` das `pipwerk-fetch-mt5 request` auf Seite a.

**Störungen.** `testenv fault <Nummer>` ohne Aktion beschreibt die Aktionen. Jede Störung hat eine Aktion, die sie herbeiführt, und eine, die sie behebt:

| Störung (Spezifikation 8) | herbeiführen | beheben |
|---|---|---|
| 1 Relay des Empfängers beendet | `fault 1 on` beendet das Relay b | `fault 1 off` startet es |
| 2 gemeinsames Verzeichnis nicht erreichbar | `fault 2 on` benennt `shared/` um (das Verzeichnis ist weg wie ein getrenntes Netzlaufwerk) | `fault 2 off` benennt zurück |
| 3 Relay hart beendet | `fault 3 on [a\|b]` (`kill -9`) | `fault 3 off [a\|b]` startet es |
| 4 Umschlag oder Anlage verändert, falscher Schlüssel | `fault 4 envelope` und `fault 4 attachment` verändern, was im Eingang des Relays b wartet (Relay b zuvor beenden); `fault 4 key` sendet mit einem Schlüssel, der nicht der der Verbindung ist | `fault 4 off` startet das Relay b, das verwirft, was nicht stimmt |
| 5 derselbe Umschlag noch einmal | `fault 5 save [component\|relay]` kopiert den wartenden Umschlag mit seinen Anlagen, `fault 5 on [component\|relay]` legt ihn noch einmal ab (in den Eingang der lauschenden Prüfkomponente b beziehungsweise des Relays b) | `fault 5 off` entfernt die Kopie |
| 6 Adressat oder Relay unbekannt, Schleife, zu groß | `fault 6 unknown-recipient`, `unknown-relay`, `loop` (beide Relays sind einander Standard-Relay, eine Nachricht an ein Relay, das es nicht gibt, danach wird die Konfiguration zurückgesetzt) und `too-large` (eine Datei von `--limit-bytes` plus 1 Byte); jede sendet und zeigt die Meldung | `fault 6 off` setzt die Betriebskonfiguration zurück (nach einem abgebrochenen `loop`) |
| 7 empfangende Komponente läuft nicht | `fault 7 on` beendet die lauschende Prüfkomponente b | `fault 7 off` startet sie |

Die Aktionen verwenden den Befehl `send`, die Prozesse und die Verzeichnisse der Umgebung; die Anwenderdokumentation beschreibt sie Schritt für Schritt mit dem, was der Anwender sieht.

**Abnahme auf einem Rechner.** `testenv start`, dann `testenv send a --address <Adresse von listen auf b> --text hallo --file <Datei> --receipt` zeigt `Receipt: …`; die Datei liegt unverändert in `side-b/received/<ID>/files/` (Prüfung mit `cmp`). Mit `testenv request` holt das Anfrage-Programm Dateien von `serve` mit der Nachbildung; die Dateien lassen sich mit `pipwerk-marketdata` importieren (`tests/test_relay_two_relays.py` prüft das mit zwei echten Relays). **Durchgang 1** der Spezifikation (alle Strecken über Verzeichnisse, das gemeinsame Verzeichnis ist der Ersatz für das Netzlaufwerk) ist damit `testenv start`, `testenv send` mit Bestätigung, `testenv request` und die Störungen 1 bis 7 mit `testenv fault`, auch Störung 3 während einer großen Anfrage (`testenv request` im Hintergrund, `testenv fault 3 on b`, `testenv fault 3 off b`).

**Annahmen.** Die Umgebung läuft unter Linux (Skript für `sh`) und braucht `git`, `uv` und `python3`. Das gemeinsame Verzeichnis liegt auf demselben Rechner; sein Verhalten als Netzlaufwerk (SMB, NFS; Abschnitt 9) bildet nur das Verschwinden des Verzeichnisses nach (Störung 2). Matrix, SFTP und der Weg für Dateien gehören zu den Durchgängen 2 bis 4 und zu späteren Aufträgen.

## 33. Tests der Störungen

`tests/test_disturbances.py` bringt jede Störung der Spezifikation (Abschnitt 8) mit zwei echten Relays (`Relay`, `RelayStore`, Wege `files`), dem gemeinsamen Verzeichnis `shared/` und der Prüfkomponente hervor (`tests/probe_bench.py`: das `send_and_watch` der Prüfkomponente wartet, jede Pause bewegt die Uhr des Tests und lässt die Relays und lauschenden Prüfkomponenten eine Runde arbeiten) und prüft das erwartete Ergebnis:

| Störung | Test | erwartetes Ergebnis |
|---|---|---|
| 1 Relay des Empfängers beendet | `test_1_the_message_waits_in_the_common_directory_and_is_delivered_after_the_start`, `test_1_without_the_start_the_receipt_does_not_come` | Die Nachricht wartet im Eingang des Relays b im gemeinsamen Verzeichnis (das Relay a hat sie übergeben, seine Warteschlange ist leer) und wird nach dem Start zugestellt; die Bestätigung kommt. Ohne Start bleibt die Bestätigung aus: `No receipt` |
| 2 Verzeichnis nicht erreichbar | `test_2_the_queue_shows_the_message_waiting_…`, `test_2_with_a_short_period_the_sender_gets_relay_unreachable`, `test_2_the_components_go_on_reading_…` | `pipwerk-relay queue` zeigt die Nachricht wartend (`retrying`, `WayUnavailableError`); das Protokoll nennt den Fehler (`inbox shared is not available`, `not handed over`), die Pausen wachsen; nach dem Wiederverbinden wird zugestellt. Mit kurzer Frist endet es mit `relay_unreachable` beim Absender, später wird nichts mehr zugestellt. Nachrichten innerhalb eines Relays brauchen das Verzeichnis nicht |
| 3 Relay hart beendet | `test_3_a_relay_ended_hard_at_any_step_…` (vor und nach jedem Schritt des Relays, der etwas verändert, das Relay a oder b), `test_3_relays_as_processes_ended_hard_in_turn_…` (`SIGKILL` an zwei Relay-Prozesse und Prüfkomponente als Prozess, 100 Nachrichten mit Anlagen und Bestätigung) | In jedem Fall kommt die Nachricht mit ihrer Datei genau einmal an, die Bestätigung kommt zurück, Warteschlangen und Eingänge sind leer, Reste verschwinden nach der Frist; im Prozesstest hat jede der 100 Nachrichten genau ein Verzeichnis, jede Bestätigung ist da, keine Meldung. Die Störung während einer Lieferung des Abrufs prüft `pipwerk-fetch-mt5` mit zwei echten Relays (`tests/test_relay_two_relays.py`, `test_3_every_file_arrives_once_…`: jedes Relay an jedem Schritt vor und nach dem Schritt hart beendet, jede Datei kommt einmal an) und in der Testumgebung (`testenv fault 3 on b` während einer großen Anfrage mit `testenv request`) |
| 4 Umschlag oder Anlage verändert, falscher Schlüssel | `test_4_a_changed_envelope_or_file_…` (Umschlag, Anlage), `test_4_an_envelope_with_the_wrong_key_…` | Verworfen (`bad_mac`, nach der Schonfrist `attachment_hash`), Vermerk im Protokoll ohne Inhalt (weder Text der Nachricht noch Inhalt der Datei), keine Meldung an den Absender; die verlangte Bestätigung bleibt aus und wird nach der Frist gemeldet; das Verzeichnis ist danach leer |
| 5 derselbe Umschlag noch einmal | `test_5_the_relay_drops_an_envelope_it_has_seen_…`, `test_5_the_component_gets_the_message_once_…` | Im Eingang des Relays: Wiederholung (`repetition message=`), nicht noch einmal zugestellt. Im Eingang der Komponente: nicht zweimal übergeben, die Bestätigung wird erneut geschickt und vom Absender als verspätet verworfen (`receipt dropped`) |
| 6 unbekannt, Schleife, zu groß | `test_6_…` | `unknown_recipient`, `unknown_relay`, `loop`, `too_large` mit der festen Meldung beim Absender; eine Datei unter der Grenze geht durch |
| 7 Komponente läuft nicht | `test_7_the_sender_reports_the_missing_receipt_…` | Nach der Frist meldet der Absender die ausgebliebene Bestätigung; nach dem Start der Komponente wird zugestellt, die späte Bestätigung steht nur im Protokoll |

Dazu `test_without_a_disturbance_…` (ungestörter Durchgang in beide Richtungen). Der Test mit Prozessen beginnt mit 100 Nachrichten, die schon vor dem Start der Relays im Eingang liegen, beendet erst das Relay b, sobald die erste Nachricht angekommen ist, dann das Relay a nach der dreißigsten, und startet beide neu. Die Tests laufen auf einem lokalen Dateisystem.

## 34. Bekannte Grenzen dieses Stands

- Der Abruf (`serve`, `request`) ist in `pipwerk-fetch-mt5` umgesetzt (Auftrag 05) und über zwei echte Relays getestet, auch mit der Störung 3 während einer Lieferung (Auftrag 06, `pipwerk-fetch-mt5.md` Abschnitt 13); `testenv` richtet `serve` mit der Nachbildung von `MetaTrader5` und `request` ein. Geprüft ist das mit Ordnern auf einem Rechner und der Nachbildung von `MetaTrader5`; echtes MetaTrader 5, Windows, ein Netzlaufwerk und zwei Rechner prüft der Auftraggeber (Anleitung in `docs/user/pipwerk-relay.md`, Abschnitt „Einrichtung auf den Rechnern des Auftraggebers“).
- Der Nachweis auf einem Netzlaufwerk (SMB, NFS) gehört zur Abnahme (Abschnitt 9, letzter Absatz); die Tests und die Testumgebung laufen auf einem lokalen Dateisystem. Störung 2 bildet das Verschwinden des Netzlaufwerks nach, nicht den Zwischenspeicher von SMB.
- Die Prüfkomponente, ihre Startkonfiguration und `testenv` sind unter Windows nicht ausgeführt (Skripte für `sh`; die Prüfkomponente ist Python und sollte laufen, die Rechteprüfung der Schlüsseldatei ist wie beim Relay nicht ausgeführt, Abschnitt 28).
- Ein Umschlag, der die Grenzen des Eingangs übersteigt (`max_envelope_bytes` oder ein Platz für Anlagen, der nicht reicht), wird ohne Meldung verworfen. Das ist eine technische Entscheidung des Entwicklungsleiters (zu Hinweis H1 des Testberichts zu Auftrag 03): Spezifikation 4.1 Schritt 1 schickt für einen Umschlag, der die Prüfung am Eingang nicht besteht, keine Meldung. Die Anwenderdokumentation nennt es unter dem Verhalten bei Störungen.
- Matrix, SFTP, der Weg für Dateien (Anlagen über einen eigenen Weg), die Web-API und die Durchgänge 2 bis 4 gehören zu späteren Aufträgen und Paketen.

## Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-24 | Auftrag 04: Prüfkomponente `probe listen` und `probe send` (Abschnitt 31), Testumgebung `scripts/testenv` mit Nachbildung von `MetaTrader5` (Abschnitt 32), Tests der Störungen 1 bis 7 (Abschnitt 33), bekannte Grenzen jetzt Abschnitt 34 (darin der Umschlag, der die Grenzen des Eingangs übersteigt). Bibliothek: Modul `connection` mit dem Lesen von `[relay]` und `[relay.way]` und dem Öffnen des Anschlusses (Abschnitt 11.1), aus `pipwerk-fetch-mt5` übernommen. |
| 2026-10-24 | Auftrag 03: Teil B (Abschnitte 18 bis 31) mit dem Relay: Aufbau, Einrichtung, Startkonfiguration, Betriebskonfiguration, Speicher, Weg einer Nachricht, Wiederanlauf, Begrenzungen, Schonfrist und Aufräumen, Befehle, Sicherheit, Abhängigkeiten, Prüfskript und Tests. Teil A: `Way.clean_up` (Abschnitte 7, 9), `migrate_scripts` und `alembic_config` (Abschnitt 13). |
| 2026-10-24 | Auftrag 02: Anschluss einer Komponente (Abschnitt 11), Empfangsbestätigung (12), Datenbank des Anschlusses mit Migration (13), Inhalte der Nachrichtenarten `relay.receipt`, `relay.undeliverable`, `probe.message` (10), Regel zu `receipt` in der Nachricht (4), Ablehnungsgrund `bad_content` (5), neue Abhängigkeiten SQLAlchemy und Alembic (14), Schemas und Beispiele (15), Tests (17). Abschnitte 10 bis 13 der Fassung von Auftrag 01 tragen jetzt die Nummern 14 bis 17. |
| 2026-10-24 | Erstfassung (Vorhaben `relay`, Paket `wp01`, Auftrag 01): Bibliothek `relay-core` mit Adresse, Nachricht, Umschlag, Schlüssel, Schnittstelle „Weg“, Verzeichnis-Weg. |
