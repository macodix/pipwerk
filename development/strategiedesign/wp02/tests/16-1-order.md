# Prüfauftrag Auftrag 16, Durchlauf 1

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `6b86959cf47efa888e8b6503c0cd6b5e7a300472` auf Zweig `strategiedesign/wp02-16`, Ausgangscommit `701698e43963ccc77ec909fcbc59cc86ddcd129a`
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/16.md`
- Prüfgrundlagen: Auftrag, Spezifikation (5.1, 5.3, 5.5, 7), Abnahmebericht `development/strategiedesign/wp02/acceptance/3.md` (E1, E2, E4, E6, E9, E13, B1 bis B4), technische Dokumentation
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`. Nur blockierende Befunde verhindern das Bestehen. Erster Durchlauf: vollständig.

## Tester Funktion

- Prüfe jeden Punkt 1 bis 10 des Auftrags gegen Code, Tests und Dokumentation. Der Commit baut auf dem Ausgangscommit auf und enthält Auftrag 15 noch nicht; Texte, die vom Backend kommen (Auftrag 15), sind nicht Gegenstand. Besonders: gestaltetes Auswahlsteuerelement (Tastatur, Hilfstechnik, alle Fenstergrößen, keine Standardlisten des Browsers mehr), vollständiges Entfernen des Assistenten ohne Reste, Befundzahl führt zur sichtbaren Liste, Ersetzen der Bedingung beim Wechsel der Art (E13, Entwickler hat das Verhalten von `convertCondition` geändert: prüfe, ob das mit Spezifikation 5.4 und dem Mangel E13 vereinbar ist), Suche nach „Verwaltung“ (ohne „Order- und Positionsverwaltung“), „Assistent“, „wizard“, „React Flow“.
- Führe in `components/pipwerk-studio/frontend` `npm ci`, `typecheck`, `build` und Vitest aus, dazu das Prüfskript `components/pipwerk-studio/scripts/check --backend-port <port> --frontend-port <port>` auf freien Ports (nicht 5174 und 8001). Playwright muss in Chromium, Firefox und WebKit bestehen. Der Entwickler meldet, dass die Python-Schritte des Prüfskripts in seiner Umgebung an fehlenden Paketen scheiterten; ermittle die Ursache und melde, ob sie an der Umgebung oder am Commit liegt.
- Befehle enthalten keine Umgebungsvariablen und keine Kommandoersetzungen.
- Im Arbeitsverzeichnis des Testers fehlt an `components/pipwerk-studio/scripts/check` und `testenv` das Ausführungsrecht (Dateimodus 644 statt 755 im Commit; `git status` zeigt eine Rechteänderung). Stelle es mit `git -C /srv/aixlab/dev/pipwerk/work/strategiedesign/wp02/functiontest checkout -- components/pipwerk-studio/scripts/check components/pipwerk-studio/scripts/testenv` wieder her (das Verzeichnis ist dein eigenes). Fehlt das Recht danach noch bei Programmen in `node_modules/.bin`, behebt das `npm ci`. Der erste Prüflauf blieb an diesem Punkt stehen.

## Ausführung langer Befehle (verbindlich)

- Das Prüfskript und jeder Befehl, der länger als 5 Minuten dauern kann, laufen im Hintergrund (Bash mit `run_in_background`), Ausgabe in eine Datei unter `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp02/`. Frage den Stand mindestens alle 5 Minuten mit einem kurzen Befehl ab. Ein einzelner Werkzeugaufruf über 15 Minuten erzeugt keinen Herzschlag, und die Sitzung wird beendet.

Ablage: `16-functiontest-1.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
