# Frage verfahren-04 – Tests der Steuerskripte lassen sich in den Sitzungen nicht ausführen

- Vorhaben: Entwicklungsverfahren verbessern (`verfahren`), ref `verfahren`
- von: Entwicklungsleiter
- an: Projektleiter
- Stand: 2026-10-25

Die Frage richtet sich an den Projektleiter. Die Freigaben ändert nur der Mensch (`devteam/settings.json`).

## Unterbrochene Aufgabe

`implement` für `verfahren`. Arbeitszweig `verfahren/umsetzung`, Stand `a1add99a3144559fb5243c88285c20d57ac1a3f6` (Auftrag 06 liegt dort). Die Quellen aus der Antwort auf verfahren-03 waren lesbar und sind übernommen.

Stand von Auftrag 06 (Quellen nach `tools/devhost/`, Pfade aus dem Ablageort, Testumgebung mit Ersatzprogramm für `claude`): geschrieben, Zweig `verfahren/umsetzung-06`, Commit `a3b59dd6c0b8d997418a0c181b052a3580ff77a1` auf GitHub. **Kein Test ist gelaufen.** Der Auftrag ist damit nicht abgenommen und nicht zusammengeführt.

Offen danach: Aufträge 07 (`agentrun`, Abschnitte 3.2 und 3.3) und 08 (`startrole`), Prüfung durch Tester Sicherheit und QA, Testumgebung, `acceptance`.

## Hindernis

In meiner Sitzung und in der des Entwicklers Backend verweigern die Freigaben diese Befehle: `chmod`, `mkdir`, `bats`, `bash <skript>`, `shellcheck`. Ohne `bats` und ohne Ausführen der Skripte lässt sich kein Unit-Test der Skripte ausführen. Das verlangt Abschnitt 10 der Spezifikation (Tests mit Ersatzprogramm für Absturz, Stillstand, dritten Abbruch, Pause, Fortsetzung). Ich umgehe die Sperren nicht. Ob der Tester Funktion diese Befehle darf, ist ungeprüft; er hat sie in seinen früheren Läufen nicht gebraucht.

## Fragen

### 1. Freigabe zum Ausführen der Skript-Tests

Benötigte Handlung: Der Mensch gibt in `devteam/settings.json` für Entwickler Backend und Tester Funktion den Aufruf von `bats` über Dateien unter `work/` frei, außerdem Aufruf von `tools/devhost/tests/testenv` (Ausführen eines Skripts im Arbeitsverzeichnis) und `chmod +x` für Dateien unter `work/`. `mkdir` unter `work/` und `test/` wird ebenfalls gebraucht, falls noch nicht erlaubt.

Vorschlag: Freigabe der genannten Befehle, beschränkt auf Pfade unter `work/` und `test/`. Danach melde mir `answer`; ich lasse den Entwickler Auftrag 06 prüfen und fahre mit 07 und 08 fort.

Alternative, falls der Mensch keine Freigabe geben will: Der Projektleiter oder eine Sitzung mit Rechten führt `tools/devhost/tests/testenv test` im Arbeitsverzeichnis des Entwicklers aus und legt die Ausgabe in `transfer/` ab. Das ist für die Aufträge 07 und 08 bei jedem Korrekturdurchlauf nötig und daher langsam.

### 2. Ersatzdateien für die Startskripte

Die Quellen enthalten `devteam/bin/*` (Startskripte) und `start.conf` nicht. Die Tests von `startrole` brauchen sie. `testenv` erzeugt daher Ersatzdateien aus den Erwartungen der Tests.

Vorschlag: Das ist ein technischer Punkt im Rahmen von E3, ich entscheide es: Ersatzdateien bleiben, sie gehören nur zur Testumgebung. Keine Handlung nötig, falls du nicht widersprichst.

**Antwort des Projektleiters (2026-10-26):**

1. Freigegeben in `devteam/settings.json`, gültig ab dem nächsten Start einer Sitzung: `bats`, `bash`, `chmod +x`, `mkdir` und `mkdir -p` mit absoluten Pfaden unter `work/` und `test/`, `bats --version`, außerdem `tools/devhost/tests/testenv` und `./tools/devhost/tests/testenv` aus dem Arbeitsverzeichnis. In einer Testsitzung nachgewiesen. `bats` ist installiert (1.13.0). Ein `bats`-Aufruf mit relativem Pfad ist nicht freigegeben, Tests über `testenv test` oder mit absolutem Pfad starten. `shellcheck` ist nicht installiert und wird für die Abnahmekriterien nicht gebraucht.
2. Einverstanden.

