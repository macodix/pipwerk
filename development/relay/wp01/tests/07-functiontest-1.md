# Testbericht Tester Funktion: Auftrag 07, Durchlauf 1

- ref: `relay/wp01`
- geprüfter Commit: `7894eba68eb2380838d3d00f4634e1a2d7ce3f68` (Zweig `relay/wp01-07`); mit `git rev-parse HEAD` im Arbeitsverzeichnis kontrolliert, Arbeitsverzeichnis ohne Änderungen
- Prüfskript: unverändert, kein Zweig `-functiontest`
- **Ergebnis: bestanden** (keine blockierenden Befunde)

## Ausgeführt

- `packages/relay-core/scripts/check`: Exitcode 0 (pytest, ruff check, ruff format --check, mypy).
- `components/pipwerk-relay/scripts/check`: Exitcode 0 (dieselben Schritte).
- `components/pipwerk-fetch-mt5/scripts/check`: Exitcode 0 (dieselben Schritte).
- Ausgabe der Prüfskripte lag unter `/tmp/claude-997/…/tasks/` (Ablage des Hintergrundstarts), nicht unter `work/relay/wp01/`, weil Weiterleitung mit Exitcode-Abfrage in einem Befehl nicht zulässig war. Ohne Auswirkung auf das Ergebnis.
- Code- und Dokumentationsdurchsicht des Diffs `7894eba~1..7894eba` (23 Dateien).
- Testumgebung selbst ausgeführt (Linux, `testenv start --network net --relay-a ra --relay-b rb --broker Demo --delivery-deadline 20`, danach `stop`):
  - Durchgang 1: Nachricht mit Datei `NUL` und Bestätigung (`Receipt: … stored by listen.net.rb`); Abruf `EURUSD` mit H1 und Ticks (3 Dateien: CONTRACT, H1 mit 24 Zeilen, TICKS mit 8640 Zeilen).
  - Störung 1: Relay b beendet, Nachricht mit Bestätigung; nach `fault 1 off` kommt die Bestätigung.
  - Störung 3: `fault 3 delivery b` und `fault 3 delivery a` während des Abrufs (M1, H1, Ticks); nach `fault 3 off` schreibt `request` je 4 Dateien, Exitcode 0. M1, H1 und TICKS der beiden Läufe stimmen mit `cmp` überein.
  - Störung 4: Anlage im Eingang von Relay b verändert; Protokoll `envelope dropped … reason=attachment_hash`, keine Bestätigung (`No receipt`).
  - Störung 5: Umschlag im Eingang der lauschenden Prüfkomponente gespeichert und nach der Zustellung noch einmal abgelegt. Die Nachricht steht einmal in `received`, die Bestätigung ging ein zweites Mal durch Relay b (`forwarded … kind=relay.receipt`), der Eingang ist danach leer.
  - Störung 7: Prüfkomponente b beendet, Nachricht mit Bestätigung und Datei: `No receipt`; nach `fault 7 off` liegt die Nachricht in `received`.
  - Nicht eigens ausgeführt: Störungen 2 und 6 sowie 5 und 7 im Weg `fetch` (der Code von Anschluss, Relay und Wegen ist dort derselbe wie in den ausgeführten Läufen; die Tests im Prüfskript bestehen). Das ist die Grenze meiner Prüfung in dieser Umgebung, kein Befund.

## Prüfung gegen Auftrag und Spezifikation

- **B1 (Umfang 1):** `relay.py` (`_process`), `connector.py` (`_process`, `_check`) und `ways/files.py` (`read`) rufen `item.load()` erst nach Prüfwert, Verbindung, Empfänger, Schema und Wiederholungsprüfung und (im Relay) nach der Größenprüfung mit den genannten Größen. `FilesWay.read` liest in `read` keine Anlage mehr (`attachments=()`, `loader=load`). Das stimmt mit Spezifikation Abschnitt 7 („vor jeder Verarbeitung an Prüfwert, Verbindung, Größe und Schema geprüft“) überein. Tests dazu: `test_no_attachment_is_opened_for_…` (falscher Prüfwert, unbekannte Seite, anderer Empfänger, Wiederholung), `test_an_attachment_that_can_never_fit_is_not_opened`, `test_reading_an_envelope_reads_no_attachment`, `test_an_attachment_declared_larger_than_the_way_allows_is_not_opened`.
- **Schonfrist in der Zukunft:** `GraceClock` (`grace.py`) misst ab dem früheren von Änderungszeit und erstem Sehen; Tests `test_the_grace_period_runs_out_for_a_change_time_in_the_future` in `relay-core` und im Relay.
- **H2:** Anschluss (`connector.py`), `request.py` und `serve.py` beachten `relay.undeliverable` nur, wenn der Bestandteil „Komponente“ des Absenders `relay` ist (`is_from_relay`); Text wird mit `plain_text` von Steuerzeichen befreit und auf 300 Zeichen gekürzt. Tests vorhanden. Vereinbar mit Spezifikation 4.4 und 3.1: Der Name `relay` ist Relays vorbehalten, und die Meldung kommt von dem Relay, bei dem die Zustellung scheitert. Das kann auch ein fernes Relay sein. Eine Prüfung auf ein bestimmtes Relay würde diesen Fall abweisen. Die Entscheidung des Entwicklers ist also vereinbar. Die Verbindung zwischen den Relays beglaubigt den Absender nur so weit, wie der Betreiber dem anderen Relay vertraut (Hinweis 2).
- **H3:** `probe listen` legte die Datei `NUL` als `NUL~` ab (selbst geprüft, s. o.); Test in `test_probe.py`.
- **H1, H5, Hinweise 1 bis 3 des Berichts 06:** `docs/technical/pipwerk-relay.md` nennt die Grenze des Schutzes gegen Wiederholung (Abschnitt 28), die Rechte `0o666` abzüglich Umask samt Empfehlung, `fault 3 delivery` / `fault 5 … fetch` / `fault 7 … fetch` in der Störungstabelle; `docs/user/pipwerk-relay.md` nennt `acquired_at` in `…_CONTRACT_…`. Alle Angaben stimmen mit `testenv` und Code überein.
- **`WAY_API_VERSION` bleibt 1:** Vereinbar. `loader` hat den Vorgabewert `None`, und `load()` gibt ohne Lader `attachments` zurück; ein vorhandener Weg, der `ReceivedEnvelope` mit Anlagen baut, arbeitet unverändert (die Aufrufer gehen nur noch über `load()`). Ein Weg bricht nicht, also verlangt die Regel in Abschnitt 7 („eine Änderung, die vorhandene Wege bricht, ist eine neue Version“) keine neue Version.
- **Abnahmekriterien:** drei Prüfskripte Exitcode 0; Durchgang 1 und Störungen 1, 3, 4, 5, 7 laufen in der Testumgebung wie nach Auftrag 06.
- Feste Pfade, Ports oder Namen in `testenv`: keine neuen; Änderungen an `testenv` gibt es in diesem Commit nicht.

## Befunde

Keine blockierenden Befunde.

## Hinweise (nicht blockierend)

1. `docs/technical/pipwerk-relay.md` Abschnitt 7: Der Absatz „Anlagen werden erst nach der Prüfung gelesen“ nennt nicht ausdrücklich, dass `WAY_API_VERSION` 1 bleibt und warum (`loader` mit Vorgabewert `None`, vorhandene Wege laufen unverändert). Die Entscheidung steht nur im Auftrag. Ein Satz an dieser Stelle würde sie für Autoren weiterer Wege festhalten.
2. H2 prüft nur den Bestandteil `relay` im Absender, nicht das Relay, das die Nachricht zu `reference_id` weitergeleitet hat. Ein Betreiber, dessen Partner-Relay einen falschen Absender `relay.…` einschleust, kann damit das Warten einer Nachricht beenden, deren ID er kennt. Das setzt einen gültigen Schlüssel der Verbindung voraus und liegt innerhalb des Vertrauens zum Partner-Relay. Es wäre sinnvoll, die Grenze in Abschnitt 28 des technischen Dokuments zu nennen, falls dort noch nicht geschehen.
3. Windows, zweiter Rechner und Netzlaufwerk sind nicht ausgeführt (Auftraggeber-Abnahme, H4 laut Auftrag nicht im Umfang).
