# Testbericht Funktion: Auftrag 06

- ergebnis: **bestanden**
- geprüfter Commit: `a3b59dd6c0b8d997418a0c181b052a3580ff77a1` (ausgecheckt, `rev-parse HEAD` kontrolliert), Durchlauf 1 (vollständig)
- Prüfskript: unverändert, kein eigener Commit

## Ausgeführt

- `tools/devhost/tests/testenv test` (absoluter Pfad): 39 von 39 Tests `ok`, `bats` ist unter `/usr/bin/bats` verfügbar.
- Vergleich mit dem Original (`devhost-import/`) per `diff`: `heartbeat`, `startrole` unterscheiden sich nur in der `ROOT`-Zeile; `agentrun` nur im Parameterblock (`ROOT` aus Ablageort, übrige Werte `${NAME:-Standard}`, Standards `900`/`30` unverändert); `pidcheck` in `ROOT` und `PATH` (`PIDCHECK_PATH`).
- `agentrun.bats` gegen Original: Unterschiede nur in der Einrichtung (`testenv create`, `source env`), `set_timeout` über Umgebung, Pfad der Attrappe und Repositoryname `testowner/testrepo`. Keine Erwartung der Tests geändert (Abnahmekriterium erfüllt).
- Ersatzprogramme `gh`, `tmux`: identisch zum Original. `claude`: erweitert (Szenariendatei, Aufrufprotokoll `claude.calls` mit `session-id=`/`resume=`), ohne Szenario altes Verhalten (`claude.exit`).
- Suche `grep -rnEi "/srv|/var/lib|codesrv|macodix|pipwerk|/home/|aixlab|martinhenkel"` über `tools/devhost/`: keine Treffer.
- Modi im Repository: alle Skripte, Ersatzprogramme und `testenv` `100755`; `.bats`, `.scn`, `README.md` `100644`.
- README: Aufteilung, Installation, Tabelle der bei der Installation zu setzenden Werte, Testbefehl, Szenarien. Stimmt mit dem Code überein.

## Nicht prüfbar

- `shellcheck` ist nicht installiert (`which shellcheck`: keine Ausgabe, Exitcode 1). Das Kriterium gilt nur „falls verfügbar“.
- Die Szenarien `crash`, `hang`, `limit-*`, `wait-resume` und das Protokoll `claude.calls` habe ich nur durch Lesen geprüft. Der direkte Aufruf des Ersatzprogramms außerhalb der Tests war in dieser Sitzung nicht freigegeben. Die Tests dazu folgen laut Auftrag in 07 und 08.

## Befunde (blockierend)

Keine.

## Hinweise (nicht blockierend)

1. `scripts/heartbeat` Zeile 10: `ROOT="$(cd … && pwd)" 2>/dev/null` – die Umleitung gilt für die Zuweisung, nicht für das `cd`; sie bewirkt nichts.
2. Alle vier Skripte und `testenv`/`fakes/claude`: `${BASH_SOURCE[0]%/*}` ergibt bei Aufruf ohne Schrägstrich (`bash agentrun` im eigenen Verzeichnis) den Skriptnamen selbst, `cd` scheitert. Im Betrieb (absoluter Pfad, Cron, Hook) kein Problem. Symbolische Links auf die Skripte würden `ROOT` am Ort des Links bestimmen.
3. `pidcheck` setzt `PATH` aus `PIDCHECK_PATH`; Standard enthält das Verzeichnis von `claude` nicht. Die Installation muss ihn setzen (steht im README). Ohne Installation findet `agentrun` `claude` über `CLAUDE=claude` nicht unter Cron.
4. Im Arbeitsverzeichnis stehen vor meiner Prüfung zwei geänderte, nicht zu diesem Commit gehörende Dateien (`components/pipwerk-studio/scripts/check`, `…/testenv`, Status `M`). Ich habe sie nicht angefasst und nicht bewertet.
