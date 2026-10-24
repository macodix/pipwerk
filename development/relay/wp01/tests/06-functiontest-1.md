# Testbericht Tester Funktion: Auftrag 06, Durchlauf 1

- ref: `relay/wp01`
- geprüfter Commit: `0a81989a508921e925680c002da4cab2685b9bd7` (Zweig `relay/wp01-06`); mit `git rev-parse HEAD` im Arbeitsverzeichnis kontrolliert, Arbeitsverzeichnis danach ohne Änderungen
- Prüfskript: unverändert, kein Zweig `-functiontest`
- **Ergebnis: bestanden** (keine blockierenden Befunde)

## Ausgeführt

- `packages/relay-core/scripts/check`: Exitcode 0 (587 Tests, ruff, mypy).
- `components/pipwerk-relay/scripts/check --with-audit`: Exitcode 0 (367 Tests, ruff, mypy, pip-audit ohne Befund).
- `components/pipwerk-fetch-mt5/scripts/check --with-audit`: Exitcode 0 (1723 bestanden, 40 übersprungen: Uhrumstellungs-Tests, bekannt aus Auftrag 05; ruff, mypy, pip-audit ohne Befund). `serve` und `request` sind nach dem Merge nicht gebrochen.
- Merge `98a0b0c` (Eltern `59612e9` und `241eccd`): Glossar enthält die Begriffe beider Seiten (Anlage, Umschlag, Empfangsbestätigung, Prüfkomponente und die Einträge aus `backtest/wp02`; „Beschaffung“ wurde dort durch den Abruf ersetzt, kein Verlust). `pipwerk-fetch-mt5.md`: Abschnitte 16 bis 18 (Abruf) neu, die Installationsbeschreibung von `backtest/wp02` ist erhalten als Abschnitt 19 mit angepassten Verweisen (19.3 usw.). `pipwerk-replay.md`: Schritte 1 bis 3 und Handelszeiten erhalten, `relay-core` in der Installation ergänzt. `uv.lock` von `pipwerk-fetch-mt5` stimmt mit `pyproject.toml` (`uv sync --frozen` im Prüfskript gelingt).
- Testumgebung selbst ausgeführt (Linux, `testenv start … --delivery-deadline 20`, anschließend `stop`):
  - Durchgang 1: Nachricht mit Datei und Bestätigung (`Receipt`, Datei per `cmp` unverändert); Abruf `EURUSD` mit H1 und Ticks (3 Dateien, Exitcode 0).
  - Störung 1: Nachricht und Abruf warten im Eingang von Relay b, nach `fault 1 off` kommen Bestätigung und 3 Dateien.
  - Störung 2: `queue a` zeigt `retrying`/`WayUnavailableError`, Protokoll `not handed over … next in 4 s`; Wiederverbinden innerhalb der Frist: Abruf kommt durch; nach Ablauf der Frist `relay_unreachable` bei der Prüfkomponente (Exitcode 1) und bei `request` (`Fehler: Die Anfrage ließ sich nicht zustellen … (relay_unreachable)`, Exitcode 1). Die nicht ausgeführte Aussage zu `relay_unreachable` bei langem Ausfall stimmt mit Code (`relay.py` Zeile 475) und Lauf überein.
  - Störung 3 per `fault 3 delivery b` während des Abrufs (M1, H1, Ticks): Relay b wird nach der ersten Datei hart beendet, nach `fault 3 off b` schreibt `request` 4 Dateien je einmal, Exitcode 0; H1 und Ticks stimmen byte-gleich mit dem ungestörten Lauf. Ebenso `fault 3 delivery a`: 4 Dateien, Exitcode 0.
  - Störung 4: Umschlag verändert (`bad_mac`), Datei verändert (`attachment_hash`), falscher Schlüssel (`bad_mac` im Protokoll von Relay a, `No receipt`); Abruf mit verändertem Umschlag endet nach `--wait 1` mit Exitcode 1.
  - Störung 5: Komponente (`repetition message=` bei `serve`, ein Verzeichnis in `received`, Bestätigung ein zweites Mal), Relay (`repetition` im Protokoll von Relay b) und `serve` (Anfrage einmal beantwortet, zweiter Umschlag als `repetition`).
  - Störung 6: `unknown_recipient`, `unknown_relay`, `loop`, `too_large` je Exitcode 1 mit der dokumentierten Meldung; Abruf mit anderem Broker (Exitcode 1, keine Datei), unbekannter Komponente (`unknown_recipient`, Exitcode 1), Symbol mit Leerzeichen ohne `--instrument` (Exitcode 2, nichts gesendet), unbekanntem Symbol (Teile mit Grund, Exitcode 1).
  - Störung 7: Prüfkomponente (`No receipt`, nach `fault 7 off` ein Verzeichnis in `received`) und `serve` (`request` endet nach der Wartezeit mit Exitcode 1, danach kommen die Dateien).

## Prüfung gegen Auftrag und Spezifikation

- Umfang 0 bis 5 erfüllt; Abnahmekriterien erfüllt (drei Prüfskripte Exitcode 0, Durchgang 1 und Störungen 1 bis 7 mit erwartetem Ergebnis).
- Ungültige Anfrage und Teile mit Grund über zwei echte Relays sowie Import mit `pipwerk-marketdata` decken `tests/test_relay_two_relays.py` und `test_relay_abruf.py` ab (im Prüfskript bestanden). In der Testumgebung ist `request_invalid` nicht herbeiführbar, weil `request` die Angaben vor dem Senden prüft (Exitcode 2).
- Feste Pfade, Ports oder Namen in `testenv`: keine; Namen, Verzeichnisse und Zahlen kommen aus Parametern. Doku-Aussagen zu Voreinstellungen (Frist 24 Stunden, 120 Sekunden in `testenv`) stimmen mit `operating.py` und `testenv` überein. Anleitung für die Rechner des Auftraggebers: Schlüsselnamen, Adressbuch und Betriebskonfiguration stimmen mit dem Aufbau in `testenv` überein (nicht auf Windows ausgeführt, kein Befund).

## Befunde

Keine blockierenden Befunde.

## Hinweise (nicht blockierend)

1. `docs/technical/pipwerk-relay.md` Abschnitt 32, Tabelle „Störungen“: Die Zeilen 3, 5 und 7 nennen `fault 3 delivery`, `fault 5 … fetch` und `fault 7 … fetch` nicht; sie stehen nur im Absatz „Abnahme auf einem Rechner“ und in `testenv fault <n>`.
2. `docs/user/pipwerk-relay.md` Störung 3 („Byte für Byte die, die ohne Störung ankommen“) und „Gut zu wissen“: Die Datei `…_CONTRACT_…` enthält `acquired_at` und unterscheidet sich zwischen zwei Aufrufen; `pipwerk-relay.md` (technisch) nennt diese Ausnahme, die Anwenderdokumentation nicht.
3. `docs/technical/pipwerk-relay.md` Abschnitt 33, Zeile Störung 3: nennt `testenv fault 3 on b` für den Abruf; der Nachweis in der Testumgebung läuft über `fault 3 delivery`.
4. Windows, zweiter Rechner und Netzlaufwerk sind nicht ausgeführt (laut Entwickler; in der Dokumentation als Abnahme beim Auftraggeber benannt).
