# Prüfauftrag Auftrag 24, Durchlauf 1

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `049b0a9c65bfc7086b07f03f9f32e5be4852d8b6` auf Zweig `strategiedesign/wp02-24`, Vorgänger `d90b73f878fd88fef3319aacc9967fad98d71d8a`
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/24.md`; Grundlage: `docs/technical/development-test-security-rules.md` Abschnitt 7 Testregeln, Spezifikation 5.1, 5.4 (Punkte „Eigenschaftenansicht der Strategie“, „Belegung je Parameter und Eigenschaft“, „Parameter `Instrument` und Eigenschaft `Instrument` der Order“), 5.5, 7, Abschnitt 10 Punkt 27
- Es prüft nur der Tester Funktion. Nur blockierende Befunde verhindern das Bestehen.

## Tester Funktion

- Prüfe jeden Punkt des Umfangs 1 bis 6 des Auftrags gegen den Commit: Streifen entfallen (`ParamStrip.tsx` und alle Einbindungen), Bereich „Strategieparameter“ in der Eigenschaftenansicht (leer, mit Einträgen, Anlegen, Ändern, Entfernen mit Rückfrage und Abbruch, Datentypwörter), kein Anlegen im Feld, „Zur Strategie“ mit Vorwahl des Datentyps und „Zurück zu …“, Verfall des Rückwegs, Feld „Instrument wählen (optional)“ mit Vorbelegung, Erklärung und Order-Wortlaut, Deutsch und Englisch, Texte nur in den Sprachdateien.
- Der Commit stellt die Fake-Antwort `frontend/src/testing/element-types.json` selbst auf „Voreingestelltes Instrument aus Strategie“ ein, weil Auftrag 23 parallel entsteht. Prüfe, dass die Fake-Antwort zur Antwort von Auftrag 23 (Zweig `strategiedesign/wp02-23`) nicht widerspricht; ein Unterschied in einem Feld, das Auftrag 24 nicht braucht, ist kein blockierender Befund.
- Prüfe die geänderten bestehenden Tests: Sind sie nicht abgeschwächt, nur dem neuen Verhalten angepasst?
- Führe Typprüfung, Prüfwerkzeuge und Komponententests (Vitest) des Frontends vollständig aus. Führe die Browsertests (Playwright, `e2e/`) laut technischer Dokumentation aus, soweit Browser auf diesem Rechner vorhanden sind, mit dem Fenster 390 × 844 und dem bekannten Test `testcases.spec.ts` „str-01 Scalping Punkt 2 Ausbruch …“ (siehe Lücke 1); nenne Fehler und Zeit, falls er scheitert, ohne zu raten. Prüfe Dateimodus `100755` von `check` und `testenv` im Commit.
- Prüfe, dass kein fester Pfad, Port oder Rechnername im Code steht und dass `docs/user/pipwerk-studio.md` den Streifen nicht mehr beschreibt, keine Test- oder Betriebsanleitung enthält und die technische Dokumentation den Start über `testenv` trägt.
- Befehle enthalten keine Umgebungsvariablen und keine Kommandoersetzungen.

## Ausführung langer Befehle (verbindlich)

- Jeder Befehl, der länger als 5 Minuten dauern kann, läuft im Hintergrund (Bash mit `run_in_background`), Ausgabe in eine Datei unter `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp02/`. Frage den Stand mindestens alle 5 Minuten mit einem kurzen Befehl ab. Ein einzelner Werkzeugaufruf über 15 Minuten erzeugt keinen Herzschlag, und die Sitzung wird beendet.
- Schreibe den Testbericht sofort nach Ende der Prüfung und beende danach deine Sitzung.

Ablage: `24-functiontest-1.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
