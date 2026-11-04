# Prüfauftrag Auftrag 25, Durchlauf 1

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `923d794335204f4fe45fcf85e25fe15330dab112` auf Zweig `strategiedesign/wp02-25`, Vorgänger `e774c67ef2cabb4b4018f97324db4b7e156f57e2`
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/25.md`; Grundlage: `docs/technical/development-test-security-rules.md` Abschnitt 7 Testregeln, Spezifikation 5.4 (Punkte „Begriffe“, „Regeln zuordnen“), Abschnitt 9, Abschnitt 10 Punkt 27
- Es prüft nur der Tester Funktion. Nur blockierende Befunde verhindern das Bestehen.

## Tester Funktion

- Prüfe die Umfangspunkte 1 bis 8 des Auftrags gegen den Commit: Wörter der Tabelle in 5.4 (Deutsch und Englisch) in Sprachdateien und Oberfläche, Erklärung „Hauptablauf“ unter „Gehört zu“ und einmal je Befund, Satz über den Regeln der Strategie, „(noch ohne Name)“ / „(no name yet)“ an Strategie, Instanz und in der Öffnen-Liste.
- Suche in `src`, den Sprachdateien und `docs/user/pipwerk-studio.md` nach „Ausdruck“, „Objekttyp“, „Objekt der Anwendung“, „Objekte der Anwendung“, „Einstellungen des Objekts“ und „expression“/„object type“ als Wort in sichtbaren Texten; Ausnahmen müssen belegt sein.
- Der Entwickler lässt einen Schritt ohne eigenen Namen weiter den Namen seines Typs zeigen (Auslegung des Auftrags). Prüfe, ob Spezifikation 5.4 („Element oder Instanz ohne vergebenen Namen“) das als Abweichung ausweist; nenne es als Hinweis, nicht als blockierenden Befund, wenn die Spezifikation es offenlässt.
- Prüfe die geänderten bestehenden Tests (nicht abgeschwächt, nicht übersprungen) und die neuen Tests (`visibleWords.test.ts`, `App.words.test.tsx`, `findingText.test.ts`, `e2e/open.spec.ts`).
- Führe Typprüfung, Prüfwerkzeuge und Vitest des Frontends aus. Führe das Prüfskript `components/pipwerk-studio/scripts/check` einmal vollständig aus (rund 20 Minuten, im Hintergrund), Exitcode 0 ist verlangt; nenne den Stand von `testcases.spec.ts` „str-01 …“. Prüfe Dateimodus `100755` von `check` und `testenv`.
- Prüfe `docs/user/pipwerk-studio.md` (Wörter, keine Test- oder Betriebsanleitung), `docs/technical/glossar.md` (Einträge, Verweise der alten Begriffe) und `docs/technical/pipwerk-studio.md` gegen den Code. Kein fester Pfad, Port oder Rechnername.
- Befehle enthalten keine Umgebungsvariablen und keine Kommandoersetzungen.

## Ausführung langer Befehle (verbindlich)

- Jeder Befehl, der länger als 5 Minuten dauern kann, läuft im Hintergrund (Bash mit `run_in_background`), Ausgabe in eine Datei unter `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp02/`. Frage den Stand mindestens alle 5 Minuten mit einem kurzen Befehl ab. Ein einzelner Werkzeugaufruf über 15 Minuten erzeugt keinen Herzschlag, und die Sitzung wird beendet.
- Schreibe den Testbericht sofort nach Ende der Prüfung und beende danach deine Sitzung.

Ablage: `25-functiontest-1.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
