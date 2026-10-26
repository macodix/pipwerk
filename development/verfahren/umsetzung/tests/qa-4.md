# Prüfbericht QA 4 (Nachprüfung Mangel M1, Auftrag 12)

- Ergebnis: **bestanden**
- Geprüfter Commit: `7c07020cc01bc58c58200c4176f29b83458d51ef` (Zweig `verfahren/umsetzung`)
- Testumgebung: keine (Vorhaben ohne Dienst und Port)
- Art: Nachprüfung nach „Umfang der Prüfungen“; Grundlage `qa-3.md` und Abnahmebericht Versuch 1 (M1)
- Geprüft: `git diff 7525dde…7c07020` für `agentrun`, `pidcheck`, `startrole`, `tools/devhost/README.md`, `entwicklungsverfahren.md`

## Mangel M1: behoben

- Jeder Wert ist eine einfache Zuweisung in eigener Zeile unter dem Kommentar (`agentrun`, `startrole`, `pidcheck` im Diff). `grep -rnE '\$\{[A-Za-z_]+:-' tools/devhost` hat keinen Treffer. Auch `PATH` in `pidcheck` ist eine Zuweisung.
- Werte der Installation (`GITHUB_REPO`, `CLAUDE`, `PATH` in `pidcheck`) stehen im Repository als erkennbare Platzhalter in spitzen Klammern, ohne Pfad und Rechnernamen.
- Testwerte kommen nicht aus der Umgebung. `testenv create` legt Kopien der Skripte an und ersetzt die Werte. `testenv set <verzeichnis> NAME WERT` ersetzt weitere (README, Abschnitt Testumgebung).
- README, Abschnitt „Werte bei der Installation“: Das Verfahren mit `sed` auf die Zuweisung ist verständlich, das Beispiel passt zu den Skripten. Die Tabelle nennt Platzhalter und Installationswert je Skript.
- Verfahrensdokument (Zeile `test/<ref>/`) und Änderungsnachweis vom 2026-10-26 stimmen mit dem README überein. Sie widersprechen dem Abschnitt „Entwicklungsverzeichnis“ nicht.
- Testlauf nicht Teil dieser Prüfung. Die Tests hat der Tester Funktion geprüft (`12-functiontest-1.md`, bestanden).

## Neue Fehler an den geänderten Stellen: keine blockierenden

## Hinweise (nicht blockierend)

- H1: README (Abschnitt „Gleiche Stellen in `agentrun` und `startrole`“) sagt noch „mit denselben Standardwerten“ und „Suchtext als Parameter“. Gemeint sind jetzt gleiche Werte und Zuweisungen. Bei Gelegenheit angleichen.
- H2: Die Repository-Kopie von `agentrun` und `pidcheck` ist mit den Platzhaltern nicht lauffähig. Das ist beabsichtigt. Ein Satz dazu im README würde dem Leser helfen.
- H3: Nicht ausgeführt, weil in dieser Sitzung nicht freigegeben: ein zusätzlicher `grep` nach festen Pfaden (`/srv`, `/home`) in `tools/devhost`. Im Diff stehen keine.

## Bewusst offen, kein Befund

- Konflikte der Verfahrensdokumente mit `origin/main` (löst der Entwicklungsleiter bei `integrate`).
- Platzhalter der Nutzungsgrenze (Spezifikation 3.3 Punkt 5, vom Auftraggeber bestätigt).

## Zuordnung zu Dokumenten des Auftraggebers

Keine Befunde zu Dokumenten des Auftraggebers, keine Fragen.
