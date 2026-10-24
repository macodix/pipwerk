## Abruf mit serve und request

Mit pipwerk relay holen Sie Kursdaten von dem Rechner, auf dem MetaTrader 5 läuft, auf einen anderen Rechner. Dafür hat das Programm `pipwerk-fetch-mt5` zwei Befehle:

- **`serve`** läuft auf dem Rechner von MetaTrader 5. Es wartet auf Anfragen. Kommt eine Anfrage, holt es die Daten aus MetaTrader 5 und schickt sie zurück.
- **`request`** läuft auf dem Rechner, der die Daten haben will. Es schickt eine Anfrage, wartet auf die Antwort und schreibt die Dateien in einen Ordner.

Die Dateien sind dieselben wie beim Aufruf von `pipwerk-fetch-mt5` ohne Relay (Anleitung zu pipwerk replay, Abschnitt 9). Sie importieren sie danach in pipwerk replay. Der Aufruf ohne Relay funktioniert weiter wie bisher.

Beide Befehle reden nur mit dem Relay ihres eigenen Rechners. Sie öffnen keinen Port. Das Relay bringt die Nachrichten zum anderen Rechner.

### Was Sie vorher brauchen

- Auf beiden Rechnern läuft ein Relay. Die beiden Relays kennen einander. Wie Sie das einrichten, steht in den Abschnitten dieser Anleitung zur Einrichtung des Relays.
- Für `serve` und für `request` je einen **Namen** und einen **Schlüssel** für die Verbindung zum eigenen Relay. Den Schlüssel erzeugen Sie beim Relay; Sie kopieren die Datei auf den Rechner des Programms. Der Ordner mit der Schlüsseldatei darf nur Ihr Benutzer lesen. Sonst startet das Programm nicht.
- Die **Adresse** von `serve`. Eine Adresse hat drei Teile mit Punkten: `<Name>.<Netz>.<Relay>`. Der erste Teil ist der Name, den Sie `serve` geben, die beiden anderen nennen das Netz und das Relay des Rechners von MetaTrader 5. Beispiel: `fetch.netz1.relay-mt5`.
- Auf dem Rechner von MetaTrader 5: MetaTrader 5, angemeldet am Konto des Brokers. Die Einrichtung des Programms wie in der Anleitung zu pipwerk replay, Abschnitt 9, mit einem Unterschied: Kopieren Sie auch den Ordner `packages\relay-core` des Repositorys, und zwar so, dass er neben `components` liegt, zum Beispiel `C:\pipwerk\components\pipwerk-fetch-mt5` und `C:\pipwerk\packages\relay-core`.

### `serve` einrichten und starten (Rechner von MetaTrader 5)

1. Öffnen Sie die Startkonfiguration `pipwerk-fetch-mt5.ini` (die Datei, die Sie nach Abschnitt 9 der Anleitung zu pipwerk replay angelegt haben; `server_time_zone` muss darin stehen).
2. Fügen Sie die Abschnitte `[relay]` und `[relay.way]` hinzu. Eine Vorlage steht in `pipwerk-fetch-mt5.example.ini`, am Ende der Datei. Entfernen Sie dort das `#` vor den Zeilen und tragen Sie Ihre Werte ein. Ein Beispiel, wenn das Relay mit zwei Ordnern arbeitet:

   ```
   [relay]
   address = fetch.netz1.relay-mt5
   way = files
   secrets_directory = C:\pipwerk\geheim
   key_file = fetch.key
   database = C:\pipwerk\zustand\fetch.db

   [relay.way]
   target.directory = C:\pipwerk\relay\von-fetch
   inbox.directory = C:\pipwerk\relay\an-fetch
   ```

   | Eintrag | Bedeutung |
   | --- | --- |
   | `address` | Die eigene Adresse von `serve`. |
   | `way` | Wie die Nachrichten zum Relay gehen. `files` bedeutet: über Ordner. |
   | `secrets_directory` | Der Ordner mit den Schlüsseln. Nur Ihr Benutzer darf ihn erreichen. |
   | `key_file` | Der Name der Datei in diesem Ordner, die den Schlüssel der Verbindung zum Relay enthält. |
   | `database` | Eine Datei, in der das Programm vermerkt, was es schon gesehen hat. Sie liegt auf einem Laufwerk dieses Rechners, nicht auf einem Netzlaufwerk. Der Ordner wird angelegt, wenn er fehlt. |
   | `target.directory` | Der Ordner, in den das Programm seine Nachrichten für das Relay legt. Das Relay liest ihn. |
   | `inbox.directory` | Der Ordner, in den das Relay die Nachrichten für das Programm legt. |

   Andere Einträge nimmt das Programm nicht an. Ein Tippfehler führt zu einer Meldung beim Start. `[relay.file_way]` gibt es in dieser Version nicht.
3. Starten Sie MetaTrader 5 und melden Sie sich am Konto an.
4. Öffnen Sie eine Eingabeaufforderung und starten Sie `serve`:

   ```
   scripts\fetch.cmd serve
   ```

   Sie sehen:

   ```
   pipwerk-fetch-mt5 serve: Adresse fetch.netz1.relay-mt5, wartet auf Anfragen (Beenden mit Strg+C).
   ```

   Lassen Sie das Fenster offen. Das Programm arbeitet, solange es läuft. Es beantwortet Anfragen nacheinander. Zu jeder Anfrage erscheint eine Zeile, zum Beispiel:

   ```
   Anfrage von ask.netz2.relay-pc beantwortet: 4 Dateien gesendet, 0 Teile nicht geholt.
   ```

   Beenden Sie es mit Strg+C. Dann steht `pipwerk-fetch-mt5 serve: beendet.` im Fenster.

`serve` handelt nie. Es liest nur aus MetaTrader 5. Beim Start liest es noch nichts aus MetaTrader 5. Das Relay muss laufen, damit Anfragen ankommen. Läuft `serve` nicht, wenn eine Anfrage kommt, wartet sie beim Relay. `serve` beantwortet sie, sobald es wieder läuft.

### `request` einrichten und aufrufen (Rechner, der die Daten haben will)

1. Richten Sie das Programm auf diesem Rechner ein wie in der Anleitung zu pipwerk replay, Abschnitt 9, Schritte 1 bis 3, mit dem Ordner `packages\relay-core` daneben. MetaTrader 5 brauchen Sie hier **nicht**. Unter Linux genügt `uv --directory components/pipwerk-fetch-mt5 sync --frozen`; `request` läuft unter Windows und Linux.
2. Legen Sie die Startkonfiguration `pipwerk-fetch-mt5.ini` an, mit `[relay]` und `[relay.way]` für dieses Relay wie oben. Die Adresse ist hier die **eigene** Adresse dieses Rechners, zum Beispiel `ask.netz2.relay-pc`; die Antworten kommen an diese Adresse zurück. `server_time_zone` brauchen Sie hier nicht.
3. Rufen Sie `request` auf. Beispiel: Kerzen H1 und D1 und die Ticks von EURUSD für den Januar 2026, in den Ordner `daten`:

   ```
   scripts\fetch.cmd request --address fetch.netz1.relay-mt5 --broker Broker-Live-1 --from 2026-01-01 --to 2026-02-01 -u H1,D1 --ticks -o daten EURUSD
   ```

   | Angabe | Bedeutung |
   | --- | --- |
   | `EURUSD` | Das Symbol so, wie MetaTrader 5 beim Broker es kennt. Ein Symbol, das nur aus Buchstaben, Ziffern und `. _ # + -` besteht, kann zugleich die Bezeichnung der Dateien sein. |
   | `--address` | Die Adresse von `serve`. Pflicht. |
   | `--broker` | Der Name des Handelsservers, an dem MetaTrader 5 angemeldet ist, genau so geschrieben wie dort (im Anmeldefenster von MetaTrader 5 das Feld „Server“). Pflicht. Stimmt der Name nicht, lehnt `serve` die Anfrage ab. |
   | `--instrument` | Die Bezeichnung für die Dateien. Ohne Angabe gilt das Symbol. Ist das Symbol zum Beispiel `EURUSD.r` oder `DAX 40` und soll die Datei `EURUSD` heißen, schreiben Sie `--instrument EURUSD`. Hat das Symbol ein Leerzeichen oder ein anderes Zeichen, das in einem Dateinamen nicht erlaubt ist, brauchen Sie `--instrument`. |
   | `--from`, `--to` | Der Zeitraum, `--from` ist eingeschlossen, `--to` ausgeschlossen. Ohne Angabe einer Zone gilt UTC. Wie beim Aufruf ohne Relay. |
   | `-u` | Die Zeiteinheiten der Kerzen, zum Beispiel `H1` oder `M1,H1,D1`. Ohne Angabe gibt es keine Kerzen. |
   | `--ticks` | Fragt auch die Ticks an. |
   | `-o` | Der Ordner für die Dateien. Er wird angelegt, wenn er fehlt. Ohne Angabe der Ordner, in dem Sie aufrufen. |
   | `--wait` | Wie viele Minuten das Programm auf die Antwort wartet. Ohne Angabe 30. |
   | `-c` | Der Pfad der Startkonfiguration, wenn sie nicht an einem der üblichen Orte liegt. |

   Die Angaben zum Instrument (Kontraktdaten) kommen immer mit.

   Heißt ein Symbol `serve` oder `request`, schreiben Sie es nicht als erstes Wort, sondern hinter eine Option (zum Beispiel hinter `--to 2026-02-01`).
4. Warten Sie. Das Programm schreibt zu jeder Datei, die ankommt, eine Zeile:

   ```
   Geschrieben: EURUSD_CONTRACT_20260101_20260201.json (Angaben zum Instrument (CONTRACT))
   Geschrieben: EURUSD_H1_20260101_20260201.json (Kerzen H1, 744 Zeilen)
   Geschrieben: EURUSD_D1_20260101_20260201.json (Kerzen D1, 31 Zeilen)
   Geschrieben: EURUSD_TICKS_20260101_20260201.json (Ticks, 1520311 Zeilen)
   4 Dateien geschrieben nach daten.
   ```

   Es endet, wenn die Antwort vollständig ist.
5. Importieren Sie die Dateien in pipwerk replay, wie in der Anleitung zu pipwerk replay, Abschnitt 8, beschrieben. Es sind dieselben Dateien wie beim Aufruf ohne Relay.

**Ergebnis und Exitcode.** Wie beim Aufruf ohne Relay:

| Exitcode | Bedeutung |
| --- | --- |
| 0 | Alle Dateien sind geschrieben. |
| 1 | Etwas hat nicht geklappt: Ein Teil ließ sich nicht holen (die übrigen Dateien sind geschrieben), die Anfrage wurde abgelehnt, sie kam nicht an, oder es kam in der Wartezeit keine vollständige Antwort. Die Meldung steht auf dem Bildschirm. |
| 2 | Die Angaben oder die Startkonfiguration sind ungültig. Es wurde nichts gesendet. |

Gibt es Teile, die sich nicht holen ließen, nennt das Programm jeden mit Instrument, Art, Zeitraum und Grund. Die Gründe sind dieselben wie beim Aufruf ohne Relay (Anleitung zu pipwerk replay, Abschnitt 9). Ein Beispiel:

```
Fehler: EURUSD, Ticks, 2026-01-01 00:00:00 UTC bis 2026-02-01 00:00:00 UTC: Zeitraum zu groß: mehr Zeilen oder Abrufe als erlaubt, bitte einen kleineren Zeitraum wählen
3 von 4 Dateien geschrieben, 1 Teile nicht geholt (Exitcode 1).
```

Wählen Sie dann einen kleineren Zeitraum und rufen Sie noch einmal auf. Eine Datei, die schon im Ordner liegt, wird ersetzt.

### Wenn etwas nicht klappt

| Meldung | Was es bedeutet | Was Sie tun |
| --- | --- | --- |
| `Fehler: Nach 30 Minuten ist kein Ergebnis der Anfrage eingetroffen.` | Es kam keine Antwort. Entweder läuft `serve` nicht, oder ein Relay läuft nicht, oder die Wege zwischen den Rechnern sind unterbrochen. | Prüfen Sie, ob `serve` läuft und die Relays laufen. Die Anfrage bleibt beim Relay und wird beantwortet, sobald alles läuft. Ihr Aufruf von `request` ist dann schon beendet; die späte Antwort verwirft der nächste Aufruf. Rufen Sie `request` nach der Behebung noch einmal auf. Bei großen Zeiträumen geben Sie mit `--wait` mehr Minuten an. |
| `Fehler: Die Anfrage ließ sich nicht zustellen: … (unknown_recipient)` | Das Relay von `serve` kennt keine Komponente mit diesem Namen. | Prüfen Sie die Adresse bei `--address` und den Namen in `address` der Startkonfiguration von `serve`. |
| `Fehler: Die Anfrage ließ sich nicht zustellen: … (unknown_relay)` | Das Relay kennt das Relay in der Adresse nicht. | Prüfen Sie Netz und Relay in der Adresse und das Adressbuch Ihres Relays. |
| `Fehler: Die Anfrage ließ sich nicht zustellen: … (relay_unreachable)` oder `(recipient_unreachable)` | Das nächste Relay oder `serve` war in der Frist des Relays nicht erreichbar. | Prüfen Sie die Verbindung zwischen den Relays und ob `serve` läuft. Rufen Sie danach noch einmal auf. |
| `Fehler: Die Anfrage ließ sich nicht zustellen: … (too_large)` oder `(loop)` oder `(sender_invalid)` | Die Nachricht war für einen Weg zu groß, ging im Kreis oder hatte einen falschen Absender. | Fragen Sie einen kleineren Zeitraum an. Prüfen Sie sonst die Adressen und die Einstellungen der Relays. |
| `Fehler: Die Anfrage wurde nicht ausgeführt: Die Anfrage nennt einen anderen Broker als den, an dem MetaTrader 5 angemeldet ist` | Der Name bei `--broker` ist nicht der Name des Servers, an dem MetaTrader 5 angemeldet ist. | Schreiben Sie den Namen genau so wie in MetaTrader 5, mit Groß- und Kleinschreibung. |
| `Fehler: Die Anfrage wurde nicht ausgeführt: Die Anfrage ist ungültig` | Eine Angabe passt nicht, zum Beispiel der Zeitraum oder eine Zeiteinheit. | Prüfen Sie die Angaben. Meist hat `request` sie schon vor dem Senden abgewiesen. Dann stimmt wahrscheinlich die Version von `serve` nicht mit der von `request` überein. |
| `Fehler: Die Anfrage wurde nicht ausgeführt: MetaTrader 5 nicht erreichbar` | `serve` kann MetaTrader 5 nicht lesen. | Starten Sie MetaTrader 5 auf dem Rechner von `serve` und melden Sie sich am Konto an. Rufen Sie danach noch einmal auf. |
| `Fehler: Nach … Minuten fehlen noch Dateien des Ergebnisses: …` | Das Ergebnis ist da, aber nicht alle Dateien sind angekommen. | Rufen Sie noch einmal auf. Bei großen Dateien geben Sie mit `--wait` mehr Minuten an. |
| `Fehler: Die Anfrage ließ sich nicht an das Relay übergeben: …` | Der Ordner oder der Weg zum eigenen Relay ist nicht erreichbar. | Prüfen Sie `target.directory` und ob das Laufwerk da ist. |
| `pipwerk-fetch-mt5: [relay]: … accessible for others` | Der Ordner mit den Schlüsseln oder die Schlüsseldatei darf auch von anderen gelesen werden. | Beschränken Sie den Zugriff auf Ihren Benutzer. |
| `pipwerk-fetch-mt5: [relay]: … does not exist` | Die Schlüsseldatei fehlt. | Prüfen Sie `secrets_directory` und `key_file`. |
| `pipwerk-fetch-mt5: Startup configuration … has no section [relay]` | In der Startkonfiguration fehlt `[relay]`. | Ergänzen Sie den Abschnitt (siehe oben). |
| `pipwerk-fetch-mt5: … unknown entry …` | Ein Eintrag der Startkonfiguration ist unbekannt, oft ein Tippfehler. Die Meldung nennt den Eintrag. | Verbessern Sie ihn. |

Fehler im Aufruf oder in der Startkonfiguration erscheinen als `pipwerk-fetch-mt5: <Text>` (englisch). Das Programm sendet dann nichts.

### Gut zu wissen

- **Eine Anfrage zur Zeit je Adresse.** Zwei `request` mit derselben Adresse und derselben Datenbank gleichzeitig nehmen einander die Antworten weg. Brauchen Sie zwei Anfragen gleichzeitig, geben Sie ihnen verschiedene Adressen und Dateien für die Datenbank.
- **`serve` beantwortet jede Anfrage**, die sein Relay zustellt. Wer Nachrichten an Ihr Relay senden darf, bestimmen die Schlüssel im Relay.
- **Wenn `serve` mitten in einer Antwort endet** (Strom weg, Rechner abgestürzt), beantwortet es die Anfrage nach dem Neustart von vorn. Es fehlt dann nichts. Dateien, die schon angekommen waren, schreibt `request` nicht noch einmal.
- **`request` kann beendet sein, bevor die Antwort kommt** (Wartezeit abgelaufen, Strg+C). Die späte Antwort wird beim nächsten Aufruf verworfen. Rufen Sie `request` dann noch einmal auf.
- **Große Zeiträume.** Jede Datei bleibt in den Grenzen des Programms (Anleitung zu pipwerk replay, Abschnitt 9). Ein Zeitraum, der sie überschreitet, ergibt den Grund „Zeitraum zu groß“. Teilen Sie ihn auf und rufen Sie mehrmals auf.
- **Die Dateien sind die des Aufrufs ohne Relay**, Byte für Byte. Der Import in pipwerk replay ändert sich nicht.
- **Geprüft** ist `serve` und `request` hier mit einer Nachbildung von MetaTrader 5 und mit Ordnern als Weg. Das Zusammenspiel mit echten Relays auf zwei Rechnern, mit MetaTrader 5 und unter Windows prüft der Auftraggeber in der Abnahme.
