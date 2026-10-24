# Testbericht Tester Sicherheit: `relay/wp01`, Durchlauf 2 (Nachprüfung)

- Ergebnis: **bestanden** (0 blockierende Befunde, 1 Hinweis)
- Geprüfter Commit: `e4bd4e7f18ffd01bed4f6241a54a942ce8f21642` (Zweig `relay/wp01`), im eigenen Arbeitsverzeichnis ausgecheckt und mit `git rev-parse HEAD` kontrolliert.
- Grundlagen: Bericht `security-1.md`, Auftrag 07, Spezifikation Abschnitt 7 und 8, Technikregeln Abschnitt 8, Diff `7da618e..e4bd4e7` im Code (`packages`, `components`).

## Ausgeführte Prüfungen

- Prüfskripte mit `--with-audit`, alle drei Exitcode 0, pip-audit „No known vulnerabilities found“: `packages/relay-core` (594 Tests), `components/pipwerk-relay` (382 Tests), `components/pipwerk-fetch-mt5`. ruff, mypy, `sync --frozen` bestanden.
- Versuch zu B1 (Skript `/srv/aixlab/dev/pipwerk/work/relay/wp01/sec2-try/try_b1.py`, Daten in `sec2-data/` daneben): Umschlag mit falschem Schlüssel, 8 Anlagen zu je 256 MiB deklariert, als spärlich belegte Dateien angelegt (`truncate`). Ergebnis: `way.read()` liefert den Umschlag, `open` weist ihn mit `bad_mac` ab, **keine Anlage wurde geöffnet**, 0,001 s, Spitzenspeicher 64 MiB.
- Diff-Prüfung auf gefährliche Aufrufe (`shell=True`, `eval`, `exec`, `pickle`, `subprocess`, Netzmodule): keine Treffer.

## Nachprüfung der Befunde

- **B1 behoben.** `ways/files.py:194-221`: `read` liefert `ReceivedEnvelope` mit `loader`, Anlagen werden erst in `load()` gelesen. `relay.py` ruft `item.load()` erst nach Prüfwert, Wiederholungsprüfung und Größenprüfung nach deklarierter Größe (`relay.py` `size = sum(declared.size …)`); `connector.py` (`_process`) ruft `load()` erst nach `_check` und Wiederholungsprüfung. Größenprüfung `max_attachment_bytes` vor dem Öffnen in `load`.
- **Änderungszeit in der Zukunft behoben.** `grace.py`: Frist ab `min(arrived, first_seen)`, damit läuft sie ab; `forget` an allen Ausgängen, Tabelle wird bei über 1024 Einträgen bereinigt. Nur beglaubigte Umschläge erreichen diesen Weg.
- **H2 umgesetzt.** `is_from_relay` in `connector.py`, `serve.py`, `request.py`; `plain_text` ersetzt Nicht-Druckbares durch `?` und kürzt auf 300 Zeichen.
- **H3 umgesetzt.** `probe.py` `safe_file_name` hängt `~` an reservierte Gerätenamen und Namen mit Punkt am Ende; `~` ist im Anlagennamen nicht erlaubt (`message.py:16`), keine Kollision.
- **H1 und H5 dokumentiert.** `docs/technical/pipwerk-relay.md` Zeilen 617 und 618 (Grenze des Wiederholungsschutzes; Rechte `0o666` abzüglich Umask, Startkonfiguration ohne Rechteprüfung, Empfehlung an den Betreiber).
- H4 (Windows) bleibt laut Auftrag 07 Abnahme beim Auftraggeber; nicht geprüft.

## Neue Befunde

Keine blockierenden.

## Hinweise (verhindern das Bestehen nicht)

- H6 `connector.py` (`_process`), `relay.py`: Bei `WayUnavailableError` in `load()` bleibt der Umschlag liegen und wird in jeder Runde neu versucht, ohne Frist; im Anschluss wird `counts.failed` erhöht. Entspricht der Wiederholbarkeit des Wegs, Betreiber sieht die Warnung im Protokoll.

## Nicht geprüft

- Windows (Schlüsselrechte, Dateinamen), Wege außer Verzeichnis-Weg, Durchgang 1 und Störungen (Aufgabe von QA und Tester Funktion).
