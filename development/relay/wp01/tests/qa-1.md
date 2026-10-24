# Prüfbericht QA: `relay/wp01`, Durchlauf 1 (Phase 4)

**Ergebnis: bestanden** (keine blockierenden Befunde, vier Hinweise)

- Geprüfter Commit: `438ca433c735024be5d29ea4ad665c8502253990` (Zweig `relay/wp01`)
- Testumgebung: Verzeichnis `/srv/aixlab/dev/pipwerk/test/relay-wp01/` (Umgebung unter `components/pipwerk-relay/.testenv`), kein Port. Netz `netz1`, Relays `relaya`/`relayb`, Handelsserver `testbroker`. Am Ende alle Störungen aus, `testenv status` zeigt alles laufend und das gemeinsame Verzeichnis verbunden.
- Keine der Teilnehmer öffnet einen Port: `ss -lnp` zeigt keinen Eintrag für Relays, `serve` oder Prüfkomponenten.

## Technische Nachweise

- `packages/relay-core/scripts/check`: Exitcode 0 (594 Tests).
- `components/pipwerk-relay/scripts/check`: Exitcode 0, darin Tests zu Störungen, Wiederanlauf, Prüfkomponente.
- `components/pipwerk-fetch-mt5/scripts/check`: Exitcode 0 (382 Tests), darin der bisherige Aufruf an der Befehlszeile (Kriterium 7).

## Abnahmekriterien

| Nr. | Ergebnis | Beleg |
|---|---|---|
| 1 Einrichtung | bestanden, soweit prüfbar | Testumgebung nach Anleitung Abschnitt 10; Beispieldateien der Anleitung vorhanden. Einrichtung per Hand auf zwei Rechnern/Windows nicht geprüft. |
| 2 Durchgang 1 | bestanden | `testenv request … -u M1,H1 --ticks EURUSD`: 4 Dateien, eine Zeile je Datei, Exitcode 0. Alle 4 Dateien lesen sich mit `parse_json` aus `packages/market-data` ohne Fehler. Anderer Broker: `Fehler: Die Anfrage wurde nicht ausgeführt: …`, Exitcode 1 (siehe H1). |
| 3 Bestätigung | bestanden | Mit `--receipt`: `Receipt: … stored by listen.netz1.relayb`, Datei per `cmp` unverändert. Ohne `--receipt` nur `No notice came back …`, keine Bestätigung. |
| 4 Störungen 1 bis 3 | bestanden | S1: Nachricht wartet, nach Start zugestellt, ein Ordner. S2: `queue` zeigt `retrying`, `WayUnavailableError`, 14 Byte Anlagen, kein Inhalt; nach `fault 2 off` zugestellt und bestätigt; bei längerer Trennung `Notice … (relay_unreachable)` bei der sendenden Prüfkomponente. S3: Relay b mitten in der Lieferung des Abrufs und Relay a hart beendet; danach 4 Dateien einmal geschrieben, `EURUSD_TICKS` und `EURUSD_M1` per `cmp` gleich dem Lauf ohne Störung; Nachricht je einmal vorhanden. |
| 5 Störungen 4 und 5 | bestanden | Umschlag verändert: `reason=bad_mac`; Datei verändert: `reason=attachment_hash`; falscher Schlüssel: `reason=bad_mac` bei Relay a; jeweils keine Meldung an den Absender, `No receipt` nach der Frist, Eingang leer, nichts in `received`. Wiederholung bei Komponente: ein Eintrag in `listen.log`, Bestätigung ein zweites Mal geschickt. Wiederholung beim Relay: `repetition message=…`. Wiederholung beim Abruf: keine zweite Antwort (`fetch.result` blieb bei 8). |
| 6 Störungen 6 und 7 | bestanden | `unknown_recipient`, `unknown_relay`, `loop`, `too_large` je mit Grund, Exitcode 1; `loop` stellt mit `fault 6 off` zurück. `request` an `nobody…`/`…relayzz`: Meldung mit Grund, Exitcode 1. Komponente aus: `No receipt` nach Frist, nach Start gespeichert. `serve` aus: `Fehler: Nach 1 Minuten ist kein Ergebnis …`, Exitcode 1; nach Start und neuem Aufruf kommen die Dateien. |
| 7 Ports, Aufruf ohne Relay | bestanden | siehe oben; Prüfskript `pipwerk-fetch-mt5` Exitcode 0. |
| 8 Anwenderdokumentation | bestanden mit Hinweisen | Alle sieben Störungen ließen sich nach `docs/user/pipwerk-relay.md` Abschnitt 9 und 10 herbeiführen; die dort genannten Ausgaben und Protokollzeilen stimmten. |

## Nicht geprüft (kein Befund)

Windows, zweiter Rechner, echtes Netzlaufwerk (SMB/NFS), echtes MetaTrader 5; Import in die Oberfläche von pipwerk replay (nur das Lesen der Dateien mit `parse_json` geprüft); `fault 5 save/on fetch` und `fault 7` mit Abruf nur in je einem Lauf; Schonfrist von 5 Minuten bei verzögerten Dateien.

## Hinweise (nicht blockierend)

- H1: Beim Broker-Konflikt zeigt `request` den Text, aber nicht die Kennung `broker_mismatch` (Kriterium 2 nennt sie; sie steht im `fetch.result`, `serve.py:150`). Die Kennung im Text würde Fehlersuche und Anleitung angleichen.
- H2: Die Anleitung nennt in den Beispielen `--broker Testbroker-1` und `relay-a`/`relay-b`; die laufende Umgebung heißt `testbroker`, `relaya`, `relayb`. Wer die Befehle wörtlich in dieser Umgebung eingibt, bekommt einen Broker-Konflikt. In Abschnitt 10 steht, dass die Namen frei gewählt werden; ein Satz „setzen Sie Ihre Namen ein“ bei Abschnitt 9 würde helfen.
- H3: Störung 7 mit Abruf (`fault 7 off fetch`) und `request --wait 1`: Wer `serve` vor Ablauf der Minute wieder startet, sieht keine Zeitüberschreitung, sondern die Dateien. Die Anleitung könnte sagen, dass `serve` mindestens eine Minute aus bleiben muss.
- H4: Der Abschnitt „Einrichtung auf den Rechnern des Auftraggebers“ steht ohne Nummer hinter Abschnitt 10 und vor „Abruf mit serve und request“; Abschnitt 1 verweist nur auf „Abruf“. Eine Nummer oder ein Verweis am Anfang der Anleitung macht den Einstieg für die Abnahme auffindbarer.
