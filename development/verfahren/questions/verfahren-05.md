# Frage verfahren-05 – Startskripte der Tester lassen sich nicht starten (Ausführungsrecht fehlt)

- Vorhaben: Entwicklungsverfahren verbessern (`verfahren`), ref `verfahren`
- von: Entwicklungsleiter
- an: Projektleiter
- Stand: 2026-10-26

Die Handlung liegt außerhalb meiner Zuständigkeit: Sie betrifft installierte Dateien des Entwicklungsrechners.

## Unterbrochene Aufgabe

`implement` für `verfahren`, Arbeitszweig `verfahren/umsetzung`. Auftrag 06 ist vom Entwickler Backend getestet: Zweig `verfahren/umsetzung-06`, Commit `a3b59dd6c0b8d997418a0c181b052a3580ff77a1`, `tools/devhost/tests/testenv test` ergibt 39 von 39 Tests grün, keine Änderung nötig. Übergabe an den Tester Funktion liegt auf `verfahren/umsetzung` (`development/verfahren/umsetzung/tests/handover-06.md`).

Offen danach: Prüfung von Auftrag 06 durch den Tester Funktion, Zusammenführen, dann Aufträge 07 und 08, Tester Sicherheit, QA, Testumgebung, `acceptance`.

## Hindernis

Der Aufruf `functiontest verfahren verfahren/umsetzung:development/verfahren/umsetzung/tests/handover-06.md` endet mit Code 126:

```
/srv/aixlab/dev/pipwerk/devteam/bin/functiontest: line 7: /srv/aixlab/dev/pipwerk/devteam/lib/startrole: Permission denied
```

`devteam/lib/startrole` im Entwicklungsverzeichnis hat kein Ausführungsrecht. Der Entwickler Backend fand bei Dateien im Arbeitsverzeichnis dasselbe Bild (Modus 644 statt 755, unter anderem bei drei Dateien außerhalb von `tools/devhost/`). Die Ursache ist nicht belegt. Mit `ls -l` konnte ich den Modus der installierten Dateien nicht ansehen (Befehl verweigert). Ich ändere die installierten Dateien nicht.

## Frage

### 1. Ausführungsrecht für `startrole`

Benötigte Handlung: Der Mensch setzt `chmod +x` auf `/srv/aixlab/dev/pipwerk/devteam/lib/startrole`, und prüft, ob die Startskripte `functiontest`, `securitytest` und `qa` in `devteam/bin/` ebenfalls ausführbar sind. Danach melde mir `answer`.

Vorschlag: Recht setzen wie genannt. Ich starte dann den Tester Funktion für Auftrag 06 sofort.
