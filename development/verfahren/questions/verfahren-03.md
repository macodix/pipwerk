# Frage verfahren-03 – Quellen von `agentrun`, `heartbeat` und `startrole` fehlen im Repository

- Vorhaben: Entwicklungsverfahren verbessern (`verfahren`), ref `verfahren`
- von: Entwicklungsleiter
- an: Projektleiter
- Stand: 2026-10-24

Die Frage richtet sich an den Projektleiter. Eine Entscheidung des Auftraggebers braucht es nach meiner Einschätzung nur, wenn die Handlung in Frage 1 nur dieser ausführen kann.

## Unterbrochene Aufgabe

`implement` für `verfahren` (Umsetzung ohne Plan nach Abschnitt 10 der Spezifikation). Arbeitszweig `verfahren/umsetzung`, letzter Commit `0a99c98` (vollständig auf GitHub). Stand:

- Auftrag 01 (Übersicht, Erzeugung), Auftrag 02 (Gestaltung, Browsertest), Auftrag 03 (Verfahrensdokumente, Workflow `overview.yml`), Auftrag 04 (Zeitpunkt der zweiten Wiedervorlage) und Auftrag 05 (Test gegen das eigene Repository): umgesetzt, vom Tester Funktion bestanden, im Arbeitszweig zusammengeführt. Berichte unter `development/verfahren/umsetzung/tests/` auf dem Arbeitszweig.
- Offen: die Skripte nach Abschnitt 3 und E1 bis E3 der Spezifikation (Fortsetzung nach Abbruch, Pause wegen der Nutzungsgrenze, Quellen unter `tools/devhost/`, Tests mit Ersatzprogramm für `claude`), danach Prüfung durch Tester Sicherheit und QA, Testumgebung, `acceptance`.

## Hindernis

Die Quellen von `agentrun`, `heartbeat` und `startrole` liegen nur in `scripts/` und `devteam/lib/` des Entwicklungsrechners, nicht im Repository. Die Freigaben der Rollen erlauben Lesen nur in `work/`, `test/` und `repo/`; ein Lesezugriff auf `scripts/agentrun` wurde in meiner Sitzung abgelehnt. E1 verlangt, dass die Quellen mit ihren Tests unter `tools/devhost/` ins Repository kommen, nennt aber nicht, wie sie dorthin gelangen. Ohne die vorhandenen Quellen müsste ich die Skripte neu schreiben, ohne ihr heutiges Verhalten zu kennen. Das ändert den Betrieb, den die Spezifikation nur erweitern will. Das tue ich nicht.

Außerdem wurden in diesem Durchlauf zwei Grenzen der Freigaben sichtbar, die keine Rolle selbst ändern darf (`devteam/settings.json`):

- Der Tester Funktion darf `generate.py` nicht direkt aufrufen. Ich habe das Abnahmekriterium durch einen Unit-Test belegt (Auftrag 05).
- `run-browser-test` ist wegen `cd` und `npm ci` nicht ausführbar; die Tests laufen über `test-local`. Die Playwright-Browser liegen nicht im Benutzer-Cache.

## Fragen

### 1. Quellen ins Repository

Benötigte Handlung: Eine Sitzung mit Zugriff auf `scripts/` und `devteam/lib/` legt eine Kopie von `agentrun`, `heartbeat`, `startrole` und den vorhandenen Tests (falls vorhanden) in `transfer/` ab, oder schreibt sie auf einen Zweig `verfahren/devhost-import` mit den Dateien unter `tools/devhost/`, ohne Änderung am Inhalt. Die Dateien dürfen keine Zugangsdaten und keine Namen von Rechnern oder Benutzern enthalten; ist das nicht der Fall, bereinigt die Sitzung sie vor der Übergabe und sagt es.

Vorschlag: Schreibe eine Anweisung in `transfer/` für diese Sitzung und melde danach `answer` mit dem Fundort (Zweig und Commit oder Pfad in `transfer/`). Ist die Datei in `transfer/`, kopiere ich sie in meinen Arbeitszweig, falls ich sie lesen darf; sonst bitte den Zweig.

### 2. Unwichtig für die Reihenfolge

Die Punkte unter „Hindernis“ (Direktaufruf, `run-browser-test`, Playwright-Browser) lege ich als Hinweise vor. Sie halten nichts auf.

**Antwort des Projektleiters (2026-10-25):**

1. Die Quellen liegen unverändert im Verzeichnis der Testumgebung des Vorhabens: `test/verfahren-umsetzung/devhost-import/`, darunter `scripts/agentrun`, `scripts/heartbeat`, `scripts/pidcheck`, `scripts/README.md`, `scripts/tests/agentrun.bats`, `scripts/tests/fakes/` (`claude`, `gh`, `tmux`) und `devteam/lib/startrole`. Lesbar für den Benutzer der Rollen. Zugangsdaten enthalten sie nicht, feste Pfade schon: Beim Übernehmen nach `tools/devhost/` nach E1 ersetzen, damit keine Pfade, Rechner- oder Benutzernamen ins Repository kommen.
2. Zur Kenntnis genommen, keine Handlung.
