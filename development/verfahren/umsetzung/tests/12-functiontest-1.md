# Testbericht Funktion: Auftrag 12, Versuch 1

- Geprüfter Commit: `f8717516e389506ddfca9401342a85c605becbff` (Zweig `verfahren/umsetzung-12`, Basis `552aef81089b62a3823e7622a053b3231e1be3f4`); `git rev-parse HEAD` im Arbeitsverzeichnis bestätigt ihn.
- Ergebnis: **bestanden**
- Prüfskript: unverändert, keine Änderung im Zweig `…-functiontest`.

## Ausgeführte Prüfungen

- `tools/devhost/tests/testenv test` (im Hintergrund, Stand abgefragt): 74 von 74 Tests `ok`, Exitcode 0. Die Datei `agentrun.bats` hat vorher und nachher 74 `@test`; die Fälle sind dieselben.
- `grep -rnE '\$\{[A-Za-z_]+:-' tools/devhost`: keine Treffer.
- `grep -rn 'export ' tools/devhost/scripts tools/devhost/devteam tools/devhost/tests`: keine Treffer.
- `grep -rnE 'PIDCHECK_PATH|FAKE_CLAUDE_SCENARIO|source .*/env'` in `tools/devhost` und `docs`: keine Treffer. Die Datei `env` der Testumgebung entfällt.
- Pfad- und Rechnernamen (`/srv/`, `aixlab`, `/home/`, Benutzername) in `tools/devhost`: keine Treffer. Die Kopie im Repository enthält die Platzhalter `<eigentümer>/<name>` (`GITHUB_REPO`), `<pfad-zu-claude>` (`CLAUDE`) und `<suchpfad>` (`PATH` in `pidcheck`).
- Alle Werte (`HEARTBEAT_TIMEOUT`, `INTERVAL`, `GITHUB_REPO`, `CLAUDE`, `ABORT_LIMIT`, `RESUME_GRACE`, `PAUSE_INTERVAL`, `PAUSE_HEARTBEAT_INTERVAL`, `LIMIT_TEXT`, `LIMIT_TIME_PATTERN`, `PATH`) sind einfache Zuweisungen in `agentrun`, `startrole`, `pidcheck`. `heartbeat` und `tests/fakes/gh` lesen keine Werte aus der Umgebung. `fakes/claude` (`FAKE_CLAUDE_SCENARIO`) und `fakes/tmux` (Werte über Umgebung an `bash -c`) sind auf Argumente beziehungsweise feste Pfade umgestellt.
- `LIMIT_TEXT` und `LIMIT_TIME_PATTERN` bleiben als Platzhalter erhalten (Auftrag Punkt 5).
- `testenv`: `create` legt Kopien an und ersetzt `CLAUDE`, `GITHUB_REPO`, `PATH` (nur `pidcheck`) und die per Option genannten Prüfabstände; `set` ersetzt weitere Werte (in `bats` als `setv`), meldet einen Fehler bei unbekanntem Namen, bei `'` und Zeilenumbruch im Wert. Die Quellen bleiben unverändert (Tests laufen gegen Kopien).
- Dokumentation: README (Abschnitte „Werte bei der Installation“, Testumgebung, Tests) und `docs/technical/entwicklungsverfahren.md` (Tabellenzeile `test/<ref>/`, Änderungsnachweis 2026-10-26) beschreiben den Code richtig, einschließlich Beispielbefehl mit `sed` und `testenv set`. Querverweise auf die Abschnittsnamen stimmen. Die Texte sind projekt- und domänenneutral.

## Befunde

Keine blockierenden Befunde.

## Hinweise

- H1: Im Arbeitsverzeichnis stehen Moduswechsel (ohne Inhaltsänderung) an `components/pipwerk-studio/scripts/check` und `…/testenv` schon nach dem Checkout; sie gehören nicht zum Diff des Auftrags und bleiben unberücksichtigt.
- H2: Die Prüfung der Syntax mit `bash -n` war in dieser Sitzung nicht erlaubt; die Syntax ist durch die grünen Tests belegt.
