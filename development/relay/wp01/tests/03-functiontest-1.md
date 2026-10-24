# Testbericht Tester Funktion: Auftrag 03, Durchlauf 1

- ref: `relay/wp01`
- geprüfter Commit: `aeb85ece49405b4b7aa9725549d6e3f60d3c2a17` (Zweig `relay/wp01-03`), in `functiontest` ausgecheckt und mit `rev-parse` kontrolliert
- Prüfskript: unverändert, kein eigener Commit am Prüfskript
- Ergebnis: **bestanden**

## Ausgeführt

- `components/pipwerk-relay/scripts/check`: Exitcode 0. `uv sync --frozen`, pytest (251 Tests bestanden, 20 s), ruff check, ruff format --check, mypy (35 Dateien) ohne Befund.
- `packages/relay-core/scripts/check`: Exitcode 0 (`Way.clean_up`, `migrate_scripts`, `alembic_config`, Tests zu `FilesWay.clean_up`). mypy ohne Befund.
- Code gelesen und gegen Spezifikation E3 (letzter Satz), E4 bis E7, 4.1 bis 4.5, 5, 7, 8 (Relay) und Auftrag 03 geprüft: `relay.py`, `store.py`, `runtime.py`, `operating.py`, `startup.py`, `cli.py`, `service.py`, `attachments.py`, `configuration.py`, Diff von `relay-core`. Dokumentation `docs/technical/pipwerk-relay.md` Teil B (Abschnitte 18 bis 31) gelesen.
- Nicht ausgeführt: Windows-Rechteprüfung (laut Auftrag kein Befund). Ein eigener Probelauf des Programms mit Testdateien unter `/tmp` war in dieser Sitzung nicht erlaubt. Das Verhalten der Befehle und des Prozesses belegen `test_commands.py` und `test_process.py`, die im Prüfskript liefen.

## Nachweis der besonderen Prüfpunkte

- Reihenfolge (4.1): `_handle` prüft Prüfwert und Verbindung, dann Wiederholung (`is_seen`), dann Absender (`sender_invalid`), dann Schleife (`loop`), dann Speichern. Belegt durch `test_a_message_passes_the_checks_in_the_order_repetition_first`, `test_a_loop_is_not_a_repetition_and_a_repeated_loop_gives_one_notice`, `test_a_message_with_a_wrong_sender_twice_gives_one_notice`.
- Speichern vor Quittieren (E4): `store.accept` markiert „gesehen“ und legt die Einträge in einer Transaktion an, `_acknowledge` folgt erst danach. Bei Fehler beim Speichern bleibt der Umschlag im Eingang, die Anlagen werden entfernt.
- Meldung über Meldung: `_decide` und `_fail` verwerfen eine unzustellbare Meldung ohne neue Meldung. Belegt durch `test_an_undeliverable_notice_is_dropped_without_a_new_notice` und `test_a_notice_with_a_wrong_sender_is_dropped_without_a_notice`.
- Fälschung ohne Meldung: `EnvelopeRejected` führt zu `_drop` ohne Meldung, das Protokoll nennt nur Eingang, Kennung der Datei und Grund. Belegt durch die Tests zu falschem Schlüssel, unbekannter Verbindung, falschem Empfänger, veränderter Anlage und Inhalt, der nicht zur Art passt.
- Wiederanlauf (E4): `test_recovery.py` hält das Relay an jedem verändernden Schritt vor und nach dem Schritt an; `test_process.py` beendet das Relay als Prozess mit `SIGKILL`. Nachrichten gehen nicht verloren und kommen genau einmal an. Der Code entspricht der Tabelle in Abschnitt 24 der Dokumentation.
- Begrenzungen (4.5): Zahl der Nachrichten, Platz für Anlagen und Größe je Weg sind getestet (`test_limits.py`). Bei erreichter Grenze bleiben die Umschläge im Eingang. Die Werte stehen in Abschnitt 25 der Dokumentation.
- Schonfrist und Blockade: `_handle` stellt Umschläge mit Anlagenfehler bis `attachment_grace_seconds` zurück. `_read_inbox` liest mit wachsender Menge (bis 16fach), sodass liegen gebliebene Umschläge neuere nicht blockieren. Belegt durch drei Tests in `test_limits.py`. Das Aufräumen von `*.part`-Dateien und Anlagen ohne Umschlag (Eingang, Ziele, Verzeichnis der Anlagen) ist in Code, Tests und Dokumentation vorhanden.
- Betriebskonfiguration: `config load` lehnt ganz ab (Weg und Schlüssel werden vorher geladen), `build_runtime` sammelt alle Probleme, ein laufendes Relay übernimmt eine neue Version in `cycle`. Der Name `relay` ist gesperrt. Keine festen Pfade, Ports oder Namen im Code gefunden.

## Befunde

Keine blockierenden Befunde.

## Hinweise (verhindern das Bestehen nicht)

- H1: Ein echter Umschlag, dessen Anlagen zusammen größer sind als der ganze Platz für Anlagen (`max_attachment_storage_bytes`), wird ohne Meldung verworfen (`relay.py:267`, Dokumentation Abschnitt 25). Ebenso ein Umschlag über der Höchstgröße des Eingangs. Der Absender erfährt es nicht. Die Spezifikation 4.1 kennt für den Eingang nur Fälschung ohne Meldung; ob hier `too_large` mit Meldung gewollt ist, entscheiden Entwicklungsleiter oder Softwarearchitekt.
- H2: `clean_up` und `clean_orphans` entscheiden nach der Änderungszeit der Datei. Dauert das Schreiben mehrerer Anlagen vor dem Umschlag länger als `leftover_after_seconds` (Voreinstellung 1 Stunde), kann die erste schon entfernt sein. Die Dokumentation nennt die Bedingung (Abschnitt 26, letzter Absatz).
- H3: `except A, B:` ohne Klammern (`relay.py:422`, `service.py:25`, `startup.py:145`) ist nur ab Python 3.14 gültig. `pyproject.toml` verlangt `>=3.14` (Zeile 7), also konsistent; nur als Lesehinweis.
