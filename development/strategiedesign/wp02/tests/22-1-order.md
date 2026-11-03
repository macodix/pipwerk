# Prüfauftrag Auftrag 22, Durchlauf 1

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `a2aab998b08ea041b5ca4929a2b758173eea80a9` auf Zweig `strategiedesign/wp02-22`, Vorgänger `ea495766b04407ac2233852853991f106a3cb0b4`
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/22.md`; Grundlage: `docs/technical/development-test-security-rules.md` Abschnitt 7 Testregeln, Spezifikation 3.4 (Entfernen), 3.6
- Es prüft nur der Tester Funktion. Nur blockierende Befunde verhindern das Bestehen.

## Tester Funktion

- Prüfe, dass für denselben Code, dasselbe Element, denselben Gegenstand und dasselbe Feld genau ein Befund `expression.empty` entsteht (Fall aus der Abnahme: Objekt, das eine Bedingung viermal verwendet, wird entfernt), in `/api/v1/check` und in `/api/v1/expressions`, und dass Befunde anderer Elemente und Felder vollständig bleiben.
- Prüfe die Angabe des Entwicklers, dass die Schleife über `analysis.slots` an genau zwei Stellen in `consistency/engine.py` steht, und ob Befunde mit anderer Ursache (`reason`) im selben Feld erhalten bleiben. Der Entwickler meldet `analysis.slots[:1]`: Prüfe, ob dabei im selben Feld liegende Plätze verschiedener Ursache (nur `slot` wird zusammengefasst) richtig behandelt werden.
- Prüfe die drei geänderten bestehenden Tests (`test_an_empty_place_in_an_expression_is_an_error`, `test_remove_a_strategy_parameter`, `test_remove_an_instance_with_its_uses`). Die Änderung des dritten (`>= 4` zu `>= 1`) schwächt den Test ab: Ermittle die genaue Zahl und prüfe, ob der Test sie festschreiben muss; fehlt das, ist es ein blockierender Befund (Test nicht abgeschwächt, Auftrag Punkt 5).
- Führe die Tests der Bibliothek (`packages/domain-core`) und des Backends vollständig aus, mit ruff und mypy laut Abschnitt 7.
- Führe das Prüfskript `components/pipwerk-studio/scripts/check --backend-port <port> --frontend-port <port>` auf freien Ports (nicht 5174, 8001, 5274, 8101, 18930 bis 18935) einmal vollständig aus. Playwright muss in Chromium, Firefox und WebKit bestehen. Der Entwickler konnte es nicht ausführen (Prozess wegen Arbeitsspeicher beendet); es laufen währenddessen keine weiteren Prüfläufe. Prüfe den Dateimodus `100755` von `check` und `testenv` im Commit.
- Prüfe, dass kein fester Pfad, Port oder Rechnername im Code steht und dass die Dokumentation (`docs/technical/pipwerk-domain.md` 9.7 und Abschnitt 5) zum Code passt.
- Befehle enthalten keine Umgebungsvariablen und keine Kommandoersetzungen.

## Ausführung langer Befehle (verbindlich)

- Das Prüfskript und jeder Befehl, der länger als 5 Minuten dauern kann, laufen im Hintergrund (Bash mit `run_in_background`), Ausgabe in eine Datei unter `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp02/`. Frage den Stand mindestens alle 5 Minuten mit einem kurzen Befehl ab. Ein einzelner Werkzeugaufruf über 15 Minuten erzeugt keinen Herzschlag, und die Sitzung wird beendet.
- Schreibe den Testbericht sofort nach Ende der Prüfung und beende danach deine Sitzung.

Ablage: `22-functiontest-1.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
