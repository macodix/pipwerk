# pipwerk relay – Anleitung

pipwerk relay bringt Nachrichten und Dateien von einem Programm zu einem anderen, auch wenn die Programme auf verschiedenen Rechnern laufen. Jeder Rechner hat dafür ein **Relay**. Ein Programm gibt seine Nachricht an das Relay seines Rechners, das Relay bringt sie zum Relay des anderen Rechners, und dieses gibt sie an das Programm, für das sie bestimmt ist. Die Programme heißen hier **Komponenten**. Die erste Anwendung ist der Abruf von Kursdaten von dem Rechner, auf dem MetaTrader 5 läuft (Abschnitt „Abruf mit serve und request“ weiter unten).

Diese Anleitung beschreibt, wie Sie ein Relay einrichten, wie Sie mit der Prüfkomponente ausprobieren, dass Nachrichten und Dateien ankommen, was die Meldungen bedeuten und was bei einer Störung geschieht. Sie ist so geschrieben, dass Sie sie ohne Programmierkenntnisse nachvollziehen können.

## Begriffe

| Begriff | Bedeutung |
| --- | --- |
| Relay | Das Programm, das Nachrichten weitergibt. Es läuft auf jedem Rechner, auf dem eine Komponente Nachrichten senden oder empfangen soll. Sie starten es mit `pipwerk-relay run`. |
| Komponente | Ein Programm, das über sein Relay Nachrichten sendet und empfängt, zum Beispiel `serve` und `request` des Abrufs oder die Prüfkomponente. |
| Adresse | Der Name, unter dem eine Komponente erreichbar ist: `<Name>.<Netz>.<Relay>`, mit drei Teilen und Punkten dazwischen, zum Beispiel `listen.netz.relay-b`. Den Namen der Komponente, des Netzes und des Relays geben Sie selbst. Jeder Teil hat 1 bis 63 Buchstaben, Ziffern, `-` oder `_`, beginnt mit einem Buchstaben oder einer Ziffer und enthält keinen Punkt. Der Name `relay` ist für die Relays selbst reserviert. |
| Schlüssel der Verbindung | Eine geheime Datei, die zwei Seiten gemeinsam haben, eine Komponente und ihr Relay oder zwei Relays. Damit prüft der Empfänger, dass eine Nachricht nicht verändert oder gefälscht wurde. Jede Verbindung hat einen eigenen Schlüssel. |
| Umschlag | Die Hülle, in der eine Nachricht auf dem Weg von einem zum anderen Programm liegt. Sie sehen Umschläge als Dateien `<Nummer>.json` in den Ordnern, in denen die Programme übergeben. |
| Eingang | Der Ordner, aus dem ein Programm die für es bestimmten Umschläge liest. |
| Anlage | Eine Datei, die zu einer Nachricht gehört. |
| Warteschlange | Der Speicher des Relays für die Nachrichten, die es angenommen und noch nicht an die nächste Stelle übergeben hat. |
| Prüfkomponente | Eine kleine Komponente zum Ausprobieren: Sie sendet eine Nachricht mit oder ohne Datei und zeigt, was zurückkommt, oder empfängt Nachrichten und legt sie in einen Ordner. Sie braucht weder den Abruf noch MetaTrader 5. |
| Empfangsbestätigung | Eine Nachricht des Empfängers an den Absender: „Ich habe Ihre Nachricht gespeichert.“ Sie kommt nur, wenn der Absender sie verlangt hat. |

## 1. Das Relay einrichten

Sie brauchen auf jedem Rechner:

- das Programm `uv` (https://docs.astral.sh/uv/). Es holt Python und die Pakete und verändert das Python des Systems nicht;
- die Ordner `components/pipwerk-relay` und `packages/relay-core` des Repositorys, so nebeneinander kopiert, wie sie im Repository liegen (zum Beispiel `C:\pipwerk\components\pipwerk-relay` und `C:\pipwerk\packages\relay-core`);
- einmal eine Internetverbindung für die Installation.

**Linux**

```
components/pipwerk-relay/scripts/install
```

Danach rufen Sie das Relay mit `components/pipwerk-relay/scripts/pipwerk-relay <Befehl>` auf.

**Windows**

```
components\pipwerk-relay\scripts\install.cmd
```

Danach rufen Sie das Relay mit `components\pipwerk-relay\scripts\pipwerk-relay.cmd <Befehl>` auf. Die Zeilen unten schreiben `pipwerk-relay <Befehl>`; setzen Sie davor den Pfad des Skripts. Unter Windows ist das Relay auf dem Entwicklungsrechner nicht ausgeführt worden; die Abnahme prüft es dort (siehe „Was geprüft ist“ am Ende).

Die Installation legt im Ordner der Komponente den Unterordner `.venv` an. Das Relay öffnet keinen Port und braucht keine Anmeldung.

### Die Startkonfiguration

Die Startkonfiguration sagt dem Relay, wo es seine Daten ablegt. Kopieren Sie `pipwerk-relay.example.ini` als `pipwerk-relay.ini` an einen der folgenden Orte (oder an einen eigenen Ort und geben Sie ihn bei jedem Aufruf mit `-c <Pfad>` an):

- Linux: `$HOME/pipwerk/etc`, `$HOME/.config/pipwerk` oder `/etc/pipwerk`
- Windows: `%USERPROFILE%\pipwerk\etc`, `%APPDATA%\pipwerk` oder `%PROGRAMDATA%\pipwerk`

Tragen Sie ein:

| Abschnitt | Eintrag | Bedeutung |
| --- | --- | --- |
| `[database]` | `url` | Die Datenbank des Relays, zum Beispiel `sqlite:////var/lib/pipwerk-relay/relay.db` (Linux, vier Schrägstriche) oder `sqlite:///C:/pipwerk-relay/relay.db` (Windows). Die Datei liegt auf einem Laufwerk dieses Rechners, nicht auf einem Netzlaufwerk. |
| `[storage]` | `attachments_directory` | Der Ordner, in dem das Relay die Dateien der wartenden Nachrichten aufbewahrt. Es legt ihn an. |
| `[secrets]` | `directory` | Der Ordner für die Schlüssel. Nur Ihr Benutzer darf ihn lesen (Linux: Rechte 700 für den Ordner und 600 für jede Datei; Windows: nur Ihr Benutzer, das System und die Administratoren). Sonst startet das Relay nicht. |
| `[log]` | `file` | Wohin das Relay sein Protokoll schreibt. Ohne Angabe erscheint es im Fenster. |
| `[log]` | `level` | `DEBUG`, `INFO`, `WARNING` oder `ERROR`; ohne Angabe `INFO`. |

Das Protokoll nennt Nachrichtennummer, Art, Absender, Adressat und was geschehen ist, nie den Inhalt einer Nachricht oder einer Datei.

Danach legen Sie die Tabellen der Datenbank an:

```
pipwerk-relay migrate
```

## 2. Schlüssel

Für jede Verbindung brauchen Sie einen Schlüssel: für jede Komponente und ihr Relay einen, und für zwei Relays, die einander Nachrichten schicken, einen gemeinsamen. Sie erzeugen ihn dort, wo das Relay läuft:

```
pipwerk-relay key new component-fetch
```

Der Befehl legt die Datei `component-fetch` im Ordner für Schlüssel an und gibt den Schlüssel nicht aus. Er überschreibt nie einen vorhandenen Schlüssel. Als Name geben Sie einen Dateinamen an, keinen Pfad.

**Die Kopie für die andere Seite.** Die andere Seite der Verbindung braucht dieselbe Datei. Kopieren Sie sie auf einem sicheren Weg (Datenträger, verschlüsselter Dienst), nicht per ungesicherter E-Mail, und legen Sie sie in den Ordner für Schlüssel der anderen Seite, ebenfalls nur für Ihren Benutzer lesbar. Bei einer Komponente ist das der Ordner, den sie in `secrets_directory` ihrer Startkonfiguration nennt; ihr Eintrag `key_file` nennt den Dateinamen. Bei zwei Relays ist es der Ordner für Schlüssel des zweiten Relays; die Datei kann dort einen anderen Namen haben, den das Adressbuch des zweiten Relays nennt (siehe unten).

Wer den Schlüssel einer Verbindung kennt, kann auf ihr Nachrichten senden. Ein bekannt gewordener Schlüssel betrifft nur diese eine Verbindung.

## 3. Adressbuch und Betriebskonfiguration

Was das Relay tut, steht in der **Betriebskonfiguration**, einer Datei im JSON-Format. Ein Beispiel zum Ausfüllen liegt unter `contracts/messages/v1/examples/relay-config.json`. Sie enthält:

| Feld | Bedeutung |
| --- | --- |
| `network`, `name` | Das Netz und der Name dieses Relays. Beide sind Teil jeder Adresse einer Komponente an diesem Relay. |
| `inputs` | Die Eingänge des Relays: die Ordner, in die Komponenten und andere Relays ihre Umschläge legen. Üblich sind zwei: einer für die Komponenten dieses Rechners und einer im gemeinsamen Ordner für das andere Relay (Abschnitt 4). |
| `components` | Die Komponenten, die an dieses Relay angeschlossen sind, je mit ihrem Namen, dem Ordner, in den das Relay für sie ablegt (ihr Eingang), und dem Dateinamen ihres Schlüssels. |
| `address_book` | Das **Adressbuch**: die anderen Relays, die dieses kennt, je mit Netz und Name, dem Ordner, in den es für sie ablegt (dem Eingang des anderen Relays), und dem Dateinamen des gemeinsamen Schlüssels. Ein Relay, das nicht im Adressbuch steht, kann dieses Relay nicht ansprechen. Ein Eintrag kann das **Standard-Relay** sein: Dorthin geht, was für ein unbekanntes Relay bestimmt ist. Zwei Relays, die einander Nachrichten schicken, tragen sich gegenseitig ein. |
| `periods`, `limits` | Fristen und Grenzen (zum Beispiel, wie lange das Relay eine Übergabe versucht, bevor es die Nachricht als unzustellbar meldet; Voreinstellung 24 Stunden). Ohne Angabe gelten die Voreinstellungen; sie stehen in der technischen Dokumentation. |

Pfade schreiben Sie im JSON mit Schrägstrichen (`C:/pipwerk/relay/in`) oder doppelten Gegenstrichen (`C:\\pipwerk\\relay\\in`).

Laden Sie die Datei:

```
pipwerk-relay config load betrieb.json
```

Das Relay prüft die Datei ganz. Ist sie ungültig, lehnt es sie als Ganzes ab, nennt jede Stelle und ändert nichts. Mit `pipwerk-relay config show` sehen Sie die Betriebskonfiguration in Gebrauch. Ein laufendes Relay übernimmt eine neu geladene Datei von selbst, ohne Neustart.

## 4. Ordner und Netzlaufwerk

Die Teile übergeben einander Umschläge über Ordner:

- **Zwischen Komponente und Relay** (auf demselben Rechner): ein Ordner je Richtung. Die Komponente legt in den Eingang des Relays (`target.directory` ihrer Startkonfiguration, `inputs` der Betriebskonfiguration), das Relay legt in den Eingang der Komponente (`inbox.directory`, `components`).
- **Zwischen zwei Relays**: ein Ordner, den beide erreichen, zum Beispiel ein Netzlaufwerk, das Sie auf beiden Rechnern eingebunden haben. Jedes Relay hat darin einen Eingang für das andere. Das Relay des Absenders legt Umschläge in den Eingang des anderen Relays, und das andere Relay liest dort.

Ein Umschlag erscheint in einem Ordner immer als vollständige Datei `<Nummer>.json`; die Dateien einer Nachricht (`<Nummer>.0.att`, `<Nummer>.1.att`) liegen vorher da. Das Relay entfernt die Dateien, wenn es sie gespeichert hat.

**Das Netzlaufwerk.** Binden Sie es auf beiden Rechnern ein, so dass beide Relays denselben Ordner sehen, und tragen Sie in die Betriebskonfiguration den Pfad ein, unter dem *dieser* Rechner den Ordner sieht (der Pfad kann auf den Rechnern verschieden sein). Das Laufwerk muss ein Umbenennen einer Datei innerhalb eines Ordners vollständig oder gar nicht ausführen; bei den üblichen Netzlaufwerken ist das so. Wird eine Datei erst nach ihrem Umschlag sichtbar (eine Verzögerung des Netzlaufwerks), wartet das Relay darauf bis zu 5 Minuten (Schonfrist) und verwirft den Umschlag erst dann. Die Datenbank des Relays und die Datenbank jeder Komponente gehören **nicht** auf das Netzlaufwerk.

## 5. Das Relay starten, ansehen und beenden

```
pipwerk-relay run
```

Das Relay läuft, bis Sie es mit Strg+C beenden (oder ihm unter Linux `SIGTERM` schicken). Es prüft vor dem Start, dass nur Ihr Benutzer den Ordner für Schlüssel lesen darf, lädt die Betriebskonfiguration und arbeitet dann in kurzen Runden: Es liest seine Eingänge, prüft jeden Umschlag, speichert die Nachricht und gibt sie weiter. Lässt sich eine Nachricht nicht übergeben (zum Beispiel weil das andere Relay oder der gemeinsame Ordner nicht erreichbar ist), versucht das Relay es in wachsenden Abständen noch einmal.

Was wartet, zeigt:

```
pipwerk-relay queue
```

```
seq  message                               kind           sender             recipient            state     attempts  since                 next attempt          last error
10   e496ea2c-4f98-46da-a822-888336b758b8  probe.message  send.netz.relay-a  listen.netz.relay-b  retrying  1         2026-10-24T05:41:18Z  2026-10-24T05:41:20Z  WayUnavailableError
1 messages in the queue, 0 bytes of attachments
```

Eine Zeile je wartender Nachricht, ohne Inhalt. `state` ist `new` (noch kein Versuch) oder `retrying` (mindestens ein Versuch ist gescheitert; `last error` nennt die Art des Fehlers, `WayUnavailableError` bedeutet: der Ordner ist nicht erreichbar). Eine leere Warteschlange zeigt `0 messages in the queue`.

## 6. Die Prüfkomponente

Mit der Prüfkomponente beweisen Sie, dass Nachrichten und Dateien durch die Relays kommen, ohne den Abruf und ohne MetaTrader 5. Sie besteht aus zwei Befehlen, die jeder eine eigene Adresse brauchen:

- `pipwerk-relay probe listen` empfängt, bis Sie es beenden, und legt jede Nachricht mit ihren Dateien in einen Ordner;
- `pipwerk-relay probe send` schickt eine Nachricht und zeigt, was zurückkommt.

Beide haben eine eigene Startkonfiguration `pipwerk-relay-probe.ini`; eine Vorlage ist `pipwerk-relay-probe.example.ini`. Sie sieht aus wie die Angaben zum Relay in der Startkonfiguration von `pipwerk-fetch-mt5`:

```
[relay]
address = send.netz.relay-a
way = files
secrets_directory = /var/lib/pipwerk-relay-probe/secrets
key_file = comp-send
database = /var/lib/pipwerk-relay-probe/state/send.db

[relay.way]
target.directory = /var/lib/pipwerk-relay/in
inbox.directory = /var/lib/pipwerk-relay/out-send
```

`address` ist die eigene Adresse der Prüfkomponente. `key_file` ist der Dateiname des Schlüssels der Verbindung mit dem Relay im Ordner `secrets_directory`, den Sie mit `key new` erzeugt und kopiert haben (Abschnitt 2). `database` ist eine Datei auf einem Laufwerk dieses Rechners, in der die Komponente vermerkt, was sie schon gesehen hat; ihr Ordner wird angelegt. `target.directory` ist der Eingang des Relays für diese Komponente, `inbox.directory` der Ordner, in den das Relay für sie ablegt. Die Komponente muss in der Betriebskonfiguration des Relays unter `components` mit demselben Namen, demselben Ordner und demselben Schlüssel stehen. Andere Abschnitte und Einträge nimmt die Prüfkomponente nicht an; ein Tippfehler führt zu einer Meldung beim Start, die den Eintrag nennt (nie seinen Wert).

Die Startkonfiguration geben Sie **hinter** dem Befehl an: `pipwerk-relay probe send -c pipwerk-relay-probe.ini …`. Ein `-c` vor `probe` betrifft das Relay und wird abgewiesen. Ohne `-c` sucht die Prüfkomponente die Datei `pipwerk-relay-probe.ini` an denselben Orten wie das Relay seine Startkonfiguration (Abschnitt 1).

### Empfangen: `probe listen`

```
pipwerk-relay probe listen -c listen.ini -o empfangen
```

```
pipwerk-relay probe listen: address listen.netz.relay-b, writing to empfangen (stop with Ctrl+C).
Message 9681e59d-592c-41a0-94d4-49539610f6be (probe.message) from send.netz.relay-a: 1 attachments (report.txt), stored in empfangen/9681e59d-592c-41a0-94d4-49539610f6be
```

Zu jeder Nachricht erscheint eine Zeile mit Nummer, Art, Absender, den Namen der Dateien und dem Ort, an dem sie liegt. Im Ordner `empfangen/<Nummer>/` liegt die Nachricht als `message.json` und jede Datei unverändert unter `files/<Name>`. Eine Nachricht erscheint in dem Ordner ganz oder gar nicht. Mit Strg+C beenden Sie die Prüfkomponente (`pipwerk-relay probe listen: stopped.`, Exitcode 0).

### Senden: `probe send`

```
pipwerk-relay probe send -c send.ini --address listen.netz.relay-b --text hallo --file report.txt --receipt --wait 60
```

| Angabe | Bedeutung |
| --- | --- |
| `--address` | Die Adresse des Empfängers. Pflicht. |
| `--text` | Der Text der Nachricht, 1 bis 1000 Zeichen. Pflicht. |
| `--file` | Eine Datei, die mitgeschickt wird. Mehrmals möglich. Der Dateiname (1 bis 128 Buchstaben, Ziffern und `. _ # + -`, nicht mit einem Punkt am Anfang) wird der Name der Datei beim Empfänger; zwei Dateien mit gleichem Namen sind nicht möglich. |
| `--receipt` | Verlangt die Empfangsbestätigung. |
| `--wait` | Mit `--receipt` die **Frist** der Bestätigung in Sekunden, ohne `--receipt` die Zeit, in der auf eine Meldung gewartet wird. Voreinstellung 30, größter Wert eine Woche. |

Das Programm zeigt zuerst, was es gesendet hat, und wartet dann. Es endet mit einem von vier Ergebnissen:

| Sie sehen | Bedeutung | Exitcode |
| --- | --- | --- |
| `Receipt: message <Nummer> was stored by <Adresse>.` | Der Empfänger hat die Nachricht gespeichert. | 0 |
| `Notice from <Relay>: message <Nummer> is undeliverable (<Grund>): <Text>` | Ein Relay hat die Nachricht nicht zustellen können. Der Grund steht in Klammern (Abschnitt 7). Das Programm bricht das Warten ab. | 1 |
| `No receipt: message <Nummer> to <Adresse> was not confirmed within <n> seconds.` | Die Frist ist abgelaufen, ohne dass eine Bestätigung kam. Die Nachricht kann trotzdem später ankommen (Abschnitt 8). | 1 |
| `No notice came back within <n> seconds for message <Nummer>.` | Sie haben keine Bestätigung verlangt, und in der Wartezeit kam keine Meldung. Das heißt nicht, dass die Nachricht angekommen ist; nur, dass kein Relay sie als unzustellbar gemeldet hat. | 0 |

Ein **Exitcode 2** bedeutet: Der Aufruf oder die Startkonfiguration ist ungültig (zum Beispiel eine Adresse ohne drei Teile, ein Text ohne Zeichen, eine Datei, die es nicht gibt, ein Schlüssel, den auch andere lesen dürfen). Es wurde nichts gesendet; die Meldung nennt, was nicht stimmt. Lässt sich die Nachricht nicht an das Relay übergeben (zum Beispiel weil sein Eingang nicht erreichbar ist), meldet das Programm `the message could not be handed to the relay` und endet mit Exitcode 1.

Die Texte der Prüfkomponente sind englisch; die Gründe in Klammern sind feste Kennungen.

## 7. Meldungen mit Gründen

Kann ein Relay eine Nachricht nicht zustellen, schickt es dem Absender eine **Meldung**. Die Prüfkomponente zeigt sie als `Notice from …`, der Abruf als „Die Anfrage ließ sich nicht zustellen“. Die Meldung nennt einen **Grund**:

| Grund | Bedeutung | Was Sie tun |
| --- | --- | --- |
| `unknown_recipient` | Das Relay des Empfängers kennt keine Komponente mit diesem Namen. | Prüfen Sie den ersten Teil der Adresse und die Namen unter `components` in der Betriebskonfiguration des Relays. |
| `unknown_relay` | Das Relay, das in der Adresse steht, steht nicht im Adressbuch, und es ist kein Standard-Relay eingestellt. | Prüfen Sie die beiden letzten Teile der Adresse und das Adressbuch. |
| `loop` | Die Nachricht ist im Kreis zwischen Relays gelaufen, zum Beispiel weil zwei Relays einander als Standard-Relay eingetragen haben und keines das Ziel kennt. | Tragen Sie das Ziel in ein Adressbuch ein oder ändern Sie das Standard-Relay. |
| `relay_unreachable` | Das nächste Relay war in der Frist des Relays (Voreinstellung 24 Stunden) nicht erreichbar, zum Beispiel weil der gemeinsame Ordner nicht da war. | Stellen Sie die Verbindung wieder her und senden Sie noch einmal. |
| `recipient_unreachable` | Die Komponente war in der Frist nicht erreichbar, weil ihr Eingang nicht erreichbar ist. | Prüfen Sie den Ordner der Komponente und senden Sie noch einmal. |
| `too_large` | Die Nachricht oder eine Datei ist zu groß für einen Weg (die Grenze steht im Eintrag des Adressbuchs oder der Komponente: `max_envelope_bytes`, `max_attachment_bytes`). | Schicken Sie weniger oder kleinere Dateien, oder stellen Sie die Grenze höher. |
| `sender_invalid` | Die Absenderadresse gehört nicht zu der Komponente, die gesendet hat. | Die Komponente muss ihre eigene Adresse als Absender verwenden. |

Die Meldung ist eine Nachricht wie jede andere und kommt an die Adresse des Absenders zurück. Eine Meldung, die selbst nicht zugestellt werden kann, wird verworfen und nur im Protokoll vermerkt, damit nicht Meldungen über Meldungen entstehen.

## 8. Die Empfangsbestätigung

Mit `--receipt` verlangt der Absender, dass der Empfänger bestätigt, die Nachricht **gespeichert** zu haben. Die Bestätigung schickt die Komponente des Empfängers selbst, ohne dass jemand etwas tun muss, aber erst, nachdem sie die Nachricht und alle Dateien gespeichert hat. Stürzt sie vorher ab, bekommt sie die Nachricht beim nächsten Start noch einmal und bestätigt dann. Das Relay bestätigt nichts; es prüft auch nicht, ob die Komponente die Nachricht abholt.

**Die Frist.** Der Absender wartet nur eine Frist auf die Bestätigung (bei der Prüfkomponente `--wait`). Läuft sie ab, zeigt der Absender, dass die Bestätigung ausgeblieben ist. Das sagt nur, dass sie nicht rechtzeitig kam; die Nachricht kann trotzdem unterwegs oder angekommen sein. Kommt die Bestätigung später, nimmt der Absender sie nicht mehr an und vermerkt sie nur im Protokoll (`receipt dropped`).

Kommt statt der Bestätigung eine Meldung (Abschnitt 7), endet das Warten sofort. Eine Bestätigung wird nie selbst bestätigt, und die Antwort auf eine Anfrage des Abrufs ist die Bestätigung; der Abruf verlangt keine.

## 9. Verhalten bei Störungen

Das Relay ist so gebaut, dass bei einer Störung **keine Nachricht verloren geht** und **keine zweimal zugestellt wird**: Eine Nachricht gilt beim Relay erst als angenommen, wenn sie in seiner Warteschlange gespeichert ist, und erst dann nimmt es sie aus dem Eingang. Es entfernt sie aus der Warteschlange erst, wenn die nächste Stelle die Übergabe bestätigt hat. Fällt dazwischen etwas aus, kann ein Umschlag doppelt ankommen; der Empfänger erkennt das an der Nachrichtennummer und verwirft den zweiten.

Die sieben Störungen unten können Sie in der Testumgebung selbst herbeiführen (Abschnitt 10) und sehen, was geschieht. Die Befehle verwenden die Beispielnamen aus Abschnitt 10: das Netz `netz`, die Relays `relay-a` und `relay-b`. Die Prüfkomponente zum Senden auf `relay-a` hat die Adresse `send.netz.relay-a`, die zum Empfangen auf `relay-b` die Adresse `listen.netz.relay-b`. Ihre Befehle schreiben Sie `scripts/testenv …`, wenn Sie im Ordner `components/pipwerk-relay` stehen.

Das Protokoll eines Relays lesen Sie in `<Ordner der Umgebung>/side-a/relay.log` und `side-b/relay.log`. Der Ordner der Umgebung heißt `.testenv` unter `components/pipwerk-relay`, wenn Sie ihn nicht anders angegeben haben.

### Störung 1: Das Relay des Empfängers läuft nicht

Das erste Relay gibt die Nachricht im gemeinsamen Ordner ab. Sie wartet dort im Eingang des zweiten Relays, bis es wieder läuft, und wird dann zugestellt.

*Herbeiführen:* Beenden Sie das Relay `relay-b` (im Betrieb: Strg+C in seinem Fenster; in der Testumgebung: `testenv fault 1 on`). Senden Sie dann von `relay-a`:

```
testenv send a --address listen.netz.relay-b --text hallo --file bericht.txt --receipt --wait 300
```

*Sie sehen:* `Sent message … receipt wanted within 300 seconds.` und dann nichts, solange das Relay `relay-b` nicht läuft. Im Ordner `shared/in-relay-b` liegt die Datei `<Nummer>.json` (das Relay `relay-a` hat die Nachricht abgegeben, seine Warteschlange ist leer).

*Beheben:* Starten Sie das Relay `relay-b` wieder (`testenv fault 1 off`). Wenige Sekunden später steht im ersten Fenster `Receipt: message … was stored by listen.netz.relay-b.`, und im Ordner `side-b/received` liegt die Nachricht mit der Datei, unverändert. Ist Ihre Frist kürzer als die Zeit, in der das Relay steht, erscheint `No receipt: …` (Exitcode 1); die Nachricht wird nach dem Start trotzdem zugestellt.

*Mit dem Abruf:* Beenden Sie das Relay `relay-b` (`testenv fault 1 on`) und rufen Sie `testenv request --address fetch.netz.relay-b --broker Testbroker-1 --from 2026-01-05 --to 2026-01-06 -u H1 --ticks -o daten EURUSD` auf. `request` zeigt nichts und wartet (bis zu 30 Minuten). Starten Sie das Relay (`testenv fault 1 off`): Die Anfrage kommt an, `serve` antwortet, und `request` schreibt die Dateien und endet mit Exitcode 0.

### Störung 2: Das gemeinsame Verzeichnis ist nicht erreichbar (Netzlaufwerk getrennt)

Das Relay kann die Nachricht nicht abgeben. Sie wartet in seiner Warteschlange. Das Relay wiederholt die Übergabe in wachsenden Abständen. Relays und Komponenten laufen weiter, notieren den Fehler im Protokoll und lesen im nächsten Abstand wieder. Ist das Laufwerk wieder da, wird zugestellt. Dauert es länger als die Frist des Relays (Voreinstellung 24 Stunden; in der Testumgebung `--delivery-deadline`, Voreinstellung 120 Sekunden), meldet das Relay dem Absender `relay_unreachable`.

*Herbeiführen:* Trennen Sie das Laufwerk (in der Testumgebung `testenv fault 2 on`; der gemeinsame Ordner wird umbenannt und ist dann weg wie ein getrenntes Laufwerk). Senden Sie in einem Fenster:

```
testenv send a --address listen.netz.relay-b --text hallo --receipt --wait 300
```

*Sie sehen:* In einem zweiten Fenster zeigt `testenv queue a` (in der Testumgebung; sonst `pipwerk-relay queue`) die Nachricht wartend: `state` ist `retrying`, `attempts` wächst, `last error` ist `WayUnavailableError`. Das Protokoll von `relay-a` enthält Zeilen wie `message=… not handed over (WayUnavailableError); attempt 1, next in 2 s` mit immer längeren Pausen, bei `relay-b` `inbox shared is not available`. Das Programm im ersten Fenster wartet. `testenv status` zeigt `directory in common: disconnected`.

*Beheben:* Verbinden Sie das Laufwerk wieder (`testenv fault 2 off`). Beim nächsten Versuch wird die Nachricht abgegeben; das erste Fenster zeigt `Receipt: …`. Geht die Frist des Relays vorher zu Ende, meldet das Programm stattdessen `Notice from relay.netz.relay-a: message … is undeliverable (relay_unreachable): The next relay could not be reached in time.`; die Nachricht wird danach nicht mehr zugestellt, und Sie senden noch einmal.

*Mit dem Abruf:* Trennen Sie das Laufwerk (`testenv fault 2 on`) und rufen Sie `testenv request …` wie bei Störung 1 auf. `testenv queue a` zeigt die Anfrage wartend (`fetch.request`, `retrying`, `WayUnavailableError`). Verbinden Sie das Laufwerk wieder (`testenv fault 2 off`): Die Anfrage geht durch, und `request` schreibt die Dateien. Dauert die Trennung länger als die Frist des Relays, endet `request` mit `Fehler: Die Anfrage ließ sich nicht zustellen: … (relay_unreachable)` und Exitcode 1.

### Störung 3: Ein Relay wird hart beendet (Absturz, Stromausfall)

Das Relay wird mitten in der Arbeit ohne Vorwarnung beendet. Nach dem Neustart fehlt keine Nachricht, und keine kommt zweimal an. Das Anfrage-Programm des Abrufs schreibt jede Datei einmal.

*Herbeiführen:* Senden Sie mehrere Nachrichten hintereinander, zum Beispiel mit dem Abruf (Abschnitt „Abruf mit serve und request“) eine große Anfrage oder mit der Prüfkomponente mehrere Nachrichten mit Datei, und beenden Sie währenddessen ein Relay hart (im Betrieb: Rechner ausschalten oder den Prozess beenden; in der Testumgebung `testenv fault 3 on a` oder `testenv fault 3 on b`, das schickt dem Prozess `kill -9`).

*Herbeiführen mitten in einer Lieferung des Abrufs:* Das Relay `relay-b` soll genau dann enden, wenn es eine Datei der Antwort von `serve` verarbeitet. Rufen Sie in einem ersten Fenster `testenv fault 3 delivery b` auf; der Befehl wartet und beendet das Relay in dem Augenblick, in dem die erste Datei der Antwort ankommt (`testenv: the relay relay-b is ended hard in the middle of a delivery`). Starten Sie im zweiten Fenster eine Anfrage, die mehrere Dateien ergibt:

```
testenv request --address fetch.netz.relay-b --broker Testbroker-1 --from 2026-01-05 --to 2026-01-06 -u M1,H1 --ticks -o daten EURUSD
```

*Sehen und beheben beim Abruf:* `request` wartet weiter (es zeigt nur die Dateien, die schon angekommen sind). Starten Sie im ersten Fenster das Relay wieder (`testenv fault 3 off b`). Die Antwort läuft zu Ende; `request` schreibt jede Datei einmal und endet mit Exitcode 0 (`N Dateien geschrieben nach daten.`). Die Dateien sind Byte für Byte die, die ohne Störung ankommen. Mit `testenv fault 3 delivery a` treffen Sie stattdessen das Relay `relay-a`, das die Dateien an `request` übergibt.

*Sie sehen:* `testenv status` zeigt das Relay als `not running`. Nachrichten, die das Relay schon angenommen hatte, bleiben in seiner Warteschlange (`testenv queue a`), Umschläge, die es noch nicht gelesen hatte, liegen in seinem Eingang.

*Beheben:* Starten Sie das Relay wieder (`testenv fault 3 off a` beziehungsweise `b`). Es liest dort weiter, wo es war. Danach liegt zu jeder gesendeten Nachricht genau ein Ordner in `side-b/received`, jede Datei ist unverändert, und jede verlangte Bestätigung kommt. Übergibt das Relay nach dem Neustart eine Nachricht noch einmal, erkennt das andere Relay oder die Komponente sie an der Nummer und verwirft die zweite; im Protokoll steht dann `repetition message=…`.

### Störung 4: Ein Umschlag oder eine Datei wurde verändert, oder der Schlüssel stimmt nicht

Das Relay prüft jeden Umschlag und jede Datei, bevor es etwas damit tut. Stimmen der Prüfwert, die Größe oder der Fingerabdruck einer Datei nicht, oder ist der Schlüssel falsch, **verwirft** es den Umschlag. Im Protokoll steht eine Zeile ohne Inhalt, **der Absender bekommt keine Meldung** (der angebliche Absender einer gefälschten Nachricht hat nichts gesendet). Hat der Absender eine Bestätigung verlangt, bleibt sie aus und wird nach der Frist als ausgeblieben gemeldet.

*Herbeiführen:* Ein Umschlag oder eine Datei muss im Ordner liegen, ohne dass ihn das Relay sofort liest. Beenden Sie dazu das Relay `relay-b` (`testenv fault 1 on`) und senden Sie eine Nachricht, bei einer Änderung der Datei mit Datei:

```
testenv send a --address listen.netz.relay-b --text hallo --file bericht.txt --wait 3
```

Verändern Sie dann den Umschlag (`testenv fault 4 envelope`) oder die Datei (`testenv fault 4 attachment`), die im Eingang von `relay-b` warten. Für einen falschen Schlüssel brauchen Sie das nicht: `testenv fault 4 key` sendet mit einer Prüfkomponente, deren Schlüssel nicht der der Verbindung ist, und wartet auf die Bestätigung.

*Beheben:* Starten Sie das Relay `relay-b` (`testenv fault 4 off`). Es verwirft den Umschlag; im Protokoll von `relay-b` steht `envelope dropped inbox=shared token=… reason=bad_mac` (Umschlag verändert) beziehungsweise `reason=attachment_hash` (Datei verändert; das Relay gibt einer Datei, die später fertig werden könnte, eine Schonfrist, in der Testumgebung 10 Sekunden), bei einem falschen Schlüssel im Protokoll von `relay-a` `envelope dropped inbox=components … reason=bad_mac`. Der Eingang ist danach leer, `side-b/received` enthält nichts, und die Prüfkomponente meldet bei `fault 4 key` nach ihrer Frist `No receipt: …`.

*Mit dem Abruf:* Beenden Sie das Relay `relay-b` (`testenv fault 1 on`), rufen Sie `testenv request … --wait 1` auf und verändern Sie den wartenden Umschlag der Anfrage (`testenv fault 4 envelope`). Starten Sie das Relay (`testenv fault 4 off`). Es verwirft die Anfrage (`reason=bad_mac` im Protokoll von `relay-b`), `serve` bekommt sie nie, und `request` endet nach der Wartezeit mit `Fehler: Nach 1 Minuten ist kein Ergebnis der Anfrage eingetroffen.` und Exitcode 1. Rufen Sie danach `request` noch einmal auf; die zweite Anfrage geht durch.

### Störung 5: Derselbe Umschlag kommt noch einmal an

Dieselbe Nachricht wird nicht zweimal zugestellt. Das Relay und die Komponente erkennen den Umschlag an der Nachrichtennummer, verwerfen ihn und quittieren ihn. Kommt er bei der Komponente noch einmal an, schickt sie die Empfangsbestätigung erneut, falls der Absender eine verlangt hat, weil die erste verloren gegangen sein kann; der Absender verwirft die zweite.

*Herbeiführen:* Beenden Sie die lauschende Prüfkomponente auf `relay-b` (`testenv fault 7 on`), senden Sie eine Nachricht mit Datei und Bestätigungswunsch (`testenv send a --address listen.netz.relay-b --text hallo --file bericht.txt --receipt --wait 5`), kopieren Sie den wartenden Umschlag mit seiner Datei (`testenv fault 5 save`), starten Sie die Prüfkomponente wieder (`testenv fault 7 off`; sie speichert die Nachricht und bestätigt) und legen Sie den kopierten Umschlag noch einmal ab (`testenv fault 5 on`). Für das Relay statt der Komponente geben Sie bei beiden Befehlen `relay` an (`testenv fault 5 save relay` mit beendetem Relay `relay-b`, `testenv fault 5 on relay`).

*Mit dem Abruf:* Beenden Sie `serve` (`testenv fault 7 on fetch`), starten Sie in einem zweiten Fenster `testenv request …` (Abschnitt 10), kopieren Sie die wartende Anfrage (`testenv fault 5 save fetch`), starten Sie `serve` wieder (`testenv fault 7 off fetch`; es beantwortet die Anfrage) und legen Sie die Kopie noch einmal ab (`testenv fault 5 on fetch`). `serve` beantwortet die Kopie nicht noch einmal: Der Umschlag ist eine Wiederholung, die Antwort kommt nur einmal. Die Dateien im Ordner von `request` sind dieselben wie ohne Störung.

*Sie sehen:* Die lauschende Prüfkomponente zeigt die Nachricht nur einmal; in `side-b/received` liegt ein Ordner. Im Protokoll von `relay-b` steht die Bestätigung ein zweites Mal (`accepted … kind=relay.receipt` und `forwarded … kind=relay.receipt`): Die Komponente hat den Umschlag als Wiederholung erkannt, die Nachricht nicht noch einmal übernommen und nur die Bestätigung noch einmal geschickt. Das Relay `relay-a` leitet sie an `send.netz.relay-a` weiter, wo sie als verspätet verworfen wird. Legen Sie den Umschlag statt dessen in den Eingang des Relays (`relay`), erkennt das Relay `relay-b` die Wiederholung selbst: Im Protokoll steht `repetition message=…`, es wird nichts zugestellt und keine zweite Bestätigung geschickt.

*Beheben:* Es gibt nichts zu beheben. `testenv fault 5 off` entfernt die gespeicherte Kopie.

### Störung 6: Adressat unbekannt, Relay unbekannt, Schleife, Nachricht zu groß

Das Relay meldet dem Absender den Grund (Abschnitt 7). Jeden Fall führen Sie mit einem Befehl herbei, der sendet und die Meldung zeigt:

| Fall | Befehl | Sie sehen |
| --- | --- | --- |
| Adressat unbekannt | `testenv fault 6 unknown-recipient` | `Notice from relay.netz.relay-b: message … is undeliverable (unknown_recipient): No component with the name of the recipient is connected to the responsible relay.` |
| Relay unbekannt | `testenv fault 6 unknown-relay` | `Notice from relay.netz.relay-a: message … is undeliverable (unknown_relay): The responsible relay of the recipient is unknown and no standard relay is set.` |
| Schleife über zwei Relays, die einander Standard-Relay sind | `testenv fault 6 loop` | `Notice from relay.netz.relay-a: message … is undeliverable (loop): The message went around in a circle between relays.` |
| Nachricht zu groß | `testenv fault 6 too-large` | `Notice from relay.netz.relay-a: message … is undeliverable (too_large): The message or an attachment is too large for a way.` |

Alle vier Befehle enden mit Exitcode 1. `unknown-recipient` ändert nichts; `loop` stellt die beiden Relays dazu kurz als Standard-Relay ein und danach wieder zurück (`testenv fault 6 off` stellt es zurück, wenn der Befehl unterbrochen wurde); `too-large` erzeugt eine Datei, die um ein Byte größer ist als die Grenze zwischen den Relays (`--limit-bytes` beim Start, Voreinstellung 4194304 Byte), und sendet sie.

*Mit dem Abruf:* Die Fälle erreichen Sie mit der Adresse bei `request`. Ein unbekannter Name (`testenv request --address nobody.netz.relay-b …`) ergibt `Fehler: Die Anfrage ließ sich nicht zustellen: … (unknown_recipient).`, ein unbekanntes Relay (`--address fetch.netz.relay-zz`) `… (unknown_relay).`, jeweils mit Exitcode 1. Ein anderer Broker (`--broker Anderer`) wird von `serve` abgelehnt: `Fehler: Die Anfrage wurde nicht ausgeführt: Die Anfrage nennt einen anderen Broker …`, Exitcode 1. `loop` und `too_large` erreicht die Anfrage selbst nicht (sie ist klein und die Adresse ist gültig); die Prüfung mit `testenv fault 6 loop` und `too-large` gilt für alle Nachrichten, auch die des Abrufs.

### Störung 7: Die empfangende Komponente läuft nicht

Das Relay stellt die Nachricht in den Eingang der Komponente und hat damit seine Aufgabe erfüllt. Sie wartet dort. Der Absender bekommt keine Bestätigung. Nach der Frist meldet er, dass sie ausgeblieben ist. Startet die Komponente später, bekommt sie die Nachricht, bestätigt sie, und der Absender vermerkt die späte Bestätigung nur im Protokoll.

*Herbeiführen:* Beenden Sie die lauschende Prüfkomponente auf `relay-b` (`testenv fault 7 on`) und senden Sie:

```
testenv send a --address listen.netz.relay-b --text hallo --file bericht.txt --receipt --wait 10
```

*Sie sehen:* Nach 10 Sekunden `No receipt: message … to listen.netz.relay-b was not confirmed within 10 seconds.` (Exitcode 1). Im Ordner `side-b/to-listen` liegt der Umschlag der Nachricht; `side-b/received` ist leer.

*Beheben:* Starten Sie die Prüfkomponente (`testenv fault 7 off`). Sie speichert die Nachricht (eine Zeile `Message … from send.netz.relay-a: 1 attachments (bericht.txt), stored in …` in ihrer Ausgabe `side-b/listen/listen.log`), und der Ordner `side-b/received` enthält die Nachricht mit der Datei. Die Bestätigung kommt zum Absender zurück, wird aber nur im Protokoll vermerkt (`receipt dropped`).

*Mit dem Abruf:* Beenden Sie `serve` (`testenv fault 7 on fetch`) und rufen Sie `testenv request … --wait 1` auf. Nach einer Minute endet `request` mit `Fehler: Nach 1 Minuten ist kein Ergebnis der Anfrage eingetroffen.` und Exitcode 1; die Anfrage wartet im Ordner `side-b/to-fetch`. Starten Sie `serve` (`testenv fault 7 off fetch`), beantwortet es sie; die späte Antwort verwirft der nächste Aufruf von `request`. Rufen Sie dann `testenv request …` noch einmal auf: Jetzt kommen die Dateien.

### Umschläge, die die Grenzen des Eingangs übersteigen

Ein Umschlag, der die Grenzen des **Eingangs** übersteigt, wird vom Relay **ohne Meldung** an den Absender verworfen. Das gilt, wenn ein Umschlag oder eine Datei größer ist als der Eingang zulässt (`max_envelope_bytes` und `max_attachment_bytes` in den `settings` des Eingangs; Voreinstellung 1 MiB für den Umschlag und 256 MiB je Datei), oder wenn die Dateien einer Nachricht zusammen mehr Platz brauchen, als das Relay für wartende Dateien insgesamt hat (`limits.max_attachment_storage_bytes`, Voreinstellung 10 GiB). Im Protokoll des Relays steht dann `envelope dropped … reason=too_large`. Das ist gewollt: Ein Umschlag, der schon die Prüfung am Eingang nicht besteht, zählt als nicht zustellbar, und das Relay antwortet nicht auf Umschläge, deren Absender es nicht verlässlich kennt.

Davon zu unterscheiden ist eine Nachricht, die für den **nächsten** Weg zu groß ist: Sie wird als `too_large` gemeldet (Störung 6). Damit der Absender es nicht erst im Protokoll des Relays erfährt, stellen Sie die Grenzen der Komponente (`target.max_attachment_bytes` in ihrer Startkonfiguration) nicht größer ein als die des Eingangs des Relays: Dann weist schon die Komponente die Datei ab, die Prüfkomponente meldet `the message could not be handed to the relay`, und der Absender sieht es.

## 10. Die Testumgebung zum Ausprobieren

Mit der Testumgebung richten Sie auf einem Rechner ohne weiteres Zutun zwei Relays ein, die über einen gemeinsamen Ordner Nachrichten tauschen (der Ordner steht für das Netzlaufwerk), auf jedem Relay eine lauschende und eine sendende Prüfkomponente, auf dem zweiten Relay `serve` des Abrufs mit einer Nachbildung von MetaTrader 5 und auf dem ersten das Anfrage-Programm. Die Testumgebung ist für Tester und QA, aber auch für Sie, um die Störungen oben nachzuvollziehen. Sie läuft unter Linux und braucht `git`, `uv` und `python3`.

Rufen Sie im Ordner `components/pipwerk-relay` auf:

```
scripts/testenv start --network netz --relay-a relay-a --relay-b relay-b --broker Testbroker-1
```

Die Namen wählen Sie selbst (nur Buchstaben, Ziffern, `-` und `_`). `--broker` ist der Name des Handelsservers, den die Nachbildung von MetaTrader 5 meldet. Das Skript startet nur aus einem vollständig übernommenen Stand des Git-Ordners (keine offenen Änderungen). Es installiert die Pakete, richtet alles ein, startet alles und zeigt am Ende, was läuft und in welchen Ordnern. Ports gibt es nicht; die Teile sprechen über Ordner.

```
testenv: the test environment is running.
  directory:               …/.testenv
  directory in common:     …/.testenv/shared (the stand-in for the network drive)
  relay a:                 relay-a, directory …/.testenv/side-a
    log:                   …/.testenv/side-a/relay.log
    listening probe:       listen.netz.relay-a, writes into …/.testenv/side-a/received
    sending probe:         send.netz.relay-a (testenv send a ...)
  relay b:                 relay-b, directory …/.testenv/side-b
    …
  serve (replica of MetaTrader 5): fetch.netz.relay-b, trade server "Testbroker-1"
  request:                 request.netz.relay-a (testenv request ...)
```

**Ein erster Versuch.** Legen Sie eine Datei an und senden Sie sie mit Bestätigung vom ersten zum zweiten Relay:

```
scripts/testenv send a --address listen.netz.relay-b --text hallo --file bericht.txt --receipt --wait 60
```

```
Sent message 9681e59d-592c-41a0-94d4-49539610f6be to listen.netz.relay-b with 1 attachments, receipt wanted within 60 seconds.
Receipt: message 9681e59d-592c-41a0-94d4-49539610f6be was stored by listen.netz.relay-b.
```

Die Datei liegt unverändert in `…/.testenv/side-b/received/9681e59d-592c-41a0-94d4-49539610f6be/files/bericht.txt`. Vergleichen Sie sie mit der Datei, die Sie gesendet haben (`cmp bericht.txt …`).

**Der Abruf in der Testumgebung.** `serve` läuft mit einer Nachbildung von MetaTrader 5, die erfundene, regelmäßige Daten für `EURUSD`, `GBPUSD` und `USDJPY` liefert (Kerzen auf jedem Schritt der Zeiteinheit, alle zehn Sekunden ein Tick). Sie dient nur dazu, den Weg der Dateien durch die Relays zu zeigen; die Daten sind keine Marktdaten.

```
scripts/testenv request --address fetch.netz.relay-b --broker Testbroker-1 --from 2026-01-05 --to 2026-01-06 -u H1 --ticks -o daten EURUSD
```

Die Angaben von `request` sind die des Abschnitts „Abruf mit serve und request“. Es erscheint für jede Datei eine Zeile `Geschrieben: …` und zuletzt `3 Dateien geschrieben nach daten.` (Exitcode 0). Die Dateien lassen sich mit pipwerk replay beziehungsweise `pipwerk-marketdata` importieren.

**Durchgang 1.** Alle Strecken laufen über Ordner. Der Durchgang besteht aus: `testenv start`; einer Nachricht mit Datei und Bestätigung (`testenv send`, oben); dem Abruf (`testenv request`); danach den Störungen 1 bis 7 (Abschnitt 9), jede mit der Prüfkomponente und, wo dort beschrieben, mit dem Abruf. Erwartet ist jedes Mal: Es geht nichts verloren, nichts kommt zweimal an, und jede Meldung nennt ihren Grund.

**Weitere Befehle**

| Befehl | Wirkung |
| --- | --- |
| `scripts/testenv status` | Zeigt, welche Teile laufen, ob das gemeinsame Verzeichnis verbunden ist, und alle Ordner und Adressen. Exitcode 1, wenn etwas nicht läuft. |
| `scripts/testenv send a …` / `send b …` | Ruft `probe send` der sendenden Prüfkomponente von Relay a beziehungsweise b auf. Die Angaben sind die von Abschnitt 6, ohne `-c`. |
| `scripts/testenv request …` | Ruft `pipwerk-fetch-mt5 request` auf Relay a auf. |
| `scripts/testenv queue a` / `queue b` | Zeigt die Warteschlange des Relays. |
| `scripts/testenv fault <1 bis 7> [<Aktion>]` | Führt eine Störung herbei oder behebt sie (Abschnitt 9). Ohne Aktion zeigt der Befehl, welche Aktionen es gibt. |
| `scripts/testenv stop` | Beendet alles, was das Skript gestartet hat, und entfernt die Ordner der Umgebung. |

Mit `--directory <Ordner>` vor dem Befehl legen Sie den Ordner der Umgebung selbst fest (sonst `components/pipwerk-relay/.testenv`); geben Sie ihn dann bei jedem Befehl an. Mit `--delivery-deadline <Sekunden>` beim Start stellen Sie ein, wie lange ein Relay eine Übergabe versucht, bevor es die Nachricht als unzustellbar meldet (Voreinstellung 120), und mit `--limit-bytes` die größte Datei zwischen den Relays (Voreinstellung 4194304). Mit `--listen-name`, `--send-name`, `--fetch-name` und `--request-name` ändern Sie die ersten Teile der Adressen (`listen`, `send`, `fetch`, `request`).

**Was geprüft ist.** Die Prüfkomponente, die Testumgebung und die Störungen 1 bis 7 sind auf einem Rechner mit Linux geprüft, mit Ordnern auf demselben Rechner. Ob sich ein echtes Netzlaufwerk (SMB, NFS) ebenso verhält, prüft der Auftraggeber in der Abnahme, ebenso den Betrieb unter Windows und mit zwei Rechnern.

## Einrichtung auf den Rechnern des Auftraggebers

Diese Anleitung richtet den Abruf auf zwei Rechnern ein, die ein Netzlaufwerk teilen. Die Namen sind Beispiele; Sie wählen eigene (Abschnitt „Begriffe“).

| | Rechner 1 (MetaTrader 5, Windows) | Rechner 2 (will die Daten haben) |
| --- | --- | --- |
| Relay | `relay-mt5` | `relay-pc` |
| Programm | `serve`, Adresse `fetch.netz1.relay-mt5` | `request`, Adresse `ask.netz1.relay-pc` |
| Netzlaufwerk | `Z:` (Ordner `Z:\pipwerk-gemeinsam`) | unter Linux zum Beispiel `/mnt/pipwerk`, unter Windows ein Laufwerksbuchstabe |

Beide Rechner haben dasselbe Netz (`netz1`). Alle Pfade unten schreiben Sie so, wie der jeweilige Rechner sie sieht.

**1. Netzlaufwerk.** Binden Sie dasselbe Netzlaufwerk auf beiden Rechnern ein, mit denselben Rechten für Ihren Benutzer. Legen Sie darauf zwei Ordner an: `pipwerk-gemeinsam/in-relay-mt5` (Eingang von `relay-mt5`) und `pipwerk-gemeinsam/in-relay-pc` (Eingang von `relay-pc`). Die Datenbanken, die Schlüssel und das Protokoll liegen **nicht** auf dem Netzlaufwerk, sondern auf dem eigenen Laufwerk jedes Rechners (Abschnitt 4).

**2. Programme einrichten.** Auf beiden Rechnern: `uv` und die Ordner `components\pipwerk-relay`, `components\pipwerk-fetch-mt5` und `packages\relay-core` (Abschnitt 1 und Abschnitt „Was Sie vorher brauchen“ beim Abruf). Auf Rechner 1 zusätzlich MetaTrader 5. Installieren Sie das Relay (`install.cmd` beziehungsweise `install`) und das Programm `pipwerk-fetch-mt5`.

**3. Startkonfiguration und Datenbank des Relays.** Auf jedem Rechner legen Sie `pipwerk-relay.ini` an (Abschnitt 1) und rufen `pipwerk-relay migrate` auf.

**4. Schlüssel.** Erzeugen Sie die Schlüssel dort, wo das Relay läuft, und kopieren Sie sie auf einem sicheren Weg:

- Auf Rechner 1: `pipwerk-relay key new fetch.key` (Verbindung `serve` und `relay-mt5`; die Kopie gehört in `secrets_directory` von `serve`, auf demselben Rechner) und `pipwerk-relay key new relay-pc.key` (Verbindung der beiden Relays; die Kopie kommt in den Ordner für Schlüssel von Rechner 2).
- Auf Rechner 2: `pipwerk-relay key new ask.key` (Verbindung `request` und `relay-pc`; die Kopie gehört in `secrets_directory` von `request`). Die Kopie von `relay-pc.key` aus Rechner 1 legen Sie hier als `relay-mt5.key` in den Ordner für Schlüssel des Relays ab.

Die Schlüssel liegen nie auf dem Netzlaufwerk, und nur Ihr Benutzer darf sie lesen (Abschnitt 2).

**5. Betriebskonfiguration.** Rechner 1 (`betrieb.json`, dann `pipwerk-relay config load betrieb.json`):

```
{
  "network": "netz1", "name": "relay-mt5",
  "inputs": [
    {"name": "components", "way": "files", "settings": {"directory": "C:/pipwerk/relay/in"}},
    {"name": "shared", "way": "files", "settings": {"directory": "Z:/pipwerk-gemeinsam/in-relay-mt5"}}
  ],
  "components": [
    {"name": "fetch", "way": "files", "settings": {"directory": "C:/pipwerk/relay/an-fetch"}, "key_file": "fetch.key"}
  ],
  "address_book": [
    {"network": "netz1", "relay": "relay-pc", "way": "files",
     "settings": {"directory": "Z:/pipwerk-gemeinsam/in-relay-pc"}, "key_file": "relay-pc.key", "standard": false}
  ]
}
```

Rechner 2 hat dieselbe Form mit vertauschten Rollen: `"name": "relay-pc"`; Eingang `shared` im Ordner `in-relay-pc` (auf diesem Rechner sichtbar, zum Beispiel `/mnt/pipwerk/in-relay-pc`); die Komponente `ask` mit `key_file` `ask.key`; im Adressbuch `relay-mt5` mit dem Ordner `in-relay-mt5` und `key_file` `relay-mt5.key`. Mehr Einträge (Fristen, Grenzen) brauchen Sie nicht; die Voreinstellungen gelten.

**6. Startkonfigurationen der Programme.** `serve` auf Rechner 1 (Beispiel im Abschnitt „`serve` einrichten und starten“) mit `address = fetch.netz1.relay-mt5`, `target.directory = C:\pipwerk\relay\in`, `inbox.directory = C:\pipwerk\relay\an-fetch` und `server_time_zone` im Abschnitt `[broker]`. `request` auf Rechner 2 mit `address = ask.netz1.relay-pc`, `target.directory` gleich dem Ordner des Eingangs `components` in der Betriebskonfiguration von `relay-pc` und `inbox.directory` gleich dem Ordner, den dort die Komponente `ask` nennt.

**7. Starten.** Auf beiden Rechnern `pipwerk-relay run` (ein Fenster je Relay), dann auf Rechner 1 MetaTrader 5 und `serve`. Auf Rechner 2 rufen Sie `request` auf (Abschnitt „`request` einrichten und aufrufen“) mit `--address fetch.netz1.relay-mt5` und dem Namen Ihres Handelsservers bei `--broker`.

**8. Prüfen.** Bevor Sie Kursdaten holen, prüfen Sie den Weg ohne MetaTrader 5 mit der Prüfkomponente (Abschnitt 6): `probe listen` auf Rechner 1 und `probe send … --receipt` von Rechner 2. Kommt `Receipt: …`, funktionieren Netzlaufwerk, Schlüssel und Adressbuch. Trennen Sie das Netzlaufwerk probeweise (Störung 2) und stecken Sie es wieder an: Die Nachricht muss danach ankommen.

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
   target.directory = C:\pipwerk\relay\in
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
   Anfrage von ask.netz1.relay-pc beantwortet: 4 Dateien gesendet, 0 Teile nicht geholt.
   ```

   Beenden Sie es mit Strg+C. Dann steht `pipwerk-fetch-mt5 serve: beendet.` im Fenster.

`serve` handelt nie. Es liest nur aus MetaTrader 5. Beim Start liest es noch nichts aus MetaTrader 5. Das Relay muss laufen, damit Anfragen ankommen. Läuft `serve` nicht, wenn eine Anfrage kommt, wartet sie beim Relay. `serve` beantwortet sie, sobald es wieder läuft.

### `request` einrichten und aufrufen (Rechner, der die Daten haben will)

1. Richten Sie das Programm auf diesem Rechner ein wie in der Anleitung zu pipwerk replay, Abschnitt 9, Schritte 1 bis 3, mit dem Ordner `packages\relay-core` daneben. MetaTrader 5 brauchen Sie hier **nicht**. Unter Linux genügt `uv --directory components/pipwerk-fetch-mt5 sync --frozen`; `request` läuft unter Windows und Linux.
2. Legen Sie die Startkonfiguration `pipwerk-fetch-mt5.ini` an, mit `[relay]` und `[relay.way]` für dieses Relay wie oben. Die Adresse ist hier die **eigene** Adresse dieses Rechners, zum Beispiel `ask.netz1.relay-pc`; die Antworten kommen an diese Adresse zurück. `server_time_zone` brauchen Sie hier nicht.
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
