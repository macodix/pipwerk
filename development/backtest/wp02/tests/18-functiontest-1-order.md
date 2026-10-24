# Prüfauftrag Funktionstest, Auftrag 18, Durchlauf 1

- Vorhaben: `backtest`
- Arbeitspaket: `wp02`
- Rolle: Tester Funktion
- zu prüfender Commit: `5ac6b147cc2aa5de41f63027346a4e75c33b94b1` (Zweig `backtest/wp02-18`)
- Auftrag: `development/backtest/wp02/orders/18.md` auf dem Zweig `backtest/wp02`

## Gegenstand

Prüfe den Commit gegen Auftrag 18 und die Spezifikation (5.3, 5.5, 5.6, 5.7, 7, 10 Punkte Speicherplatz und Importverzeichnis, 11, 12): Einstellungen (vier Werte, Prüfung beim Speichern), Importverzeichnis (Liste, Import per relativem Pfad, Auflösung symbolischer Verweise, Datei nie verändert), Dateien behalten (Zwischendatei, Ersetzen, kein Rest ohne Kreuz), Platz der Datenbank nach Löschen und Ersetzen (`auto_vacuum` mit `incremental_vacuum`, Umstellung alter Datenbanken mit `VACUUM`), Web-API und Beschreibung, Programmierregeln, Tests, technische Dokumentation (`docs/technical/pipwerk-replay.md`, `docs/technical/pipwerk-marketdata.md`, README der Komponente).

Das Prüfskript `components/pipwerk-replay/scripts/check` und das der Bibliothek `packages/market-data` führst du selbst aus. Der Entwickler meldet, dass im Browsertest-Schritt der Playwright-Browser in seiner Umgebung fehlt; prüfe, ob das bei dir ebenso ist, und nenne es dann als Umgebungsgrenze, nicht als Befund am Code. Auftrag 18 ändert die Oberfläche nicht. Befehle über 10 Minuten im Hintergrund.

Die Festlegungen des Entwicklers (ein Endpunkt `settings/files` mit `PUT` aller vier Werte, `auto_vacuum = INCREMENTAL` in Schritten zu 4096 Seiten, bereinigter Name `file-<n>` statt `.` oder `..`, nicht behaltbare Datei wird nicht importiert) gelten als technische Entscheidung des Entwicklungsleiters; melde nur, wenn sie der Spezifikation widersprechen.

Beachte die Regeln „Umfang der Prüfungen“ (erster Durchlauf vollständig, nur blockierende Befunde verhindern das Bestehen, Bericht höchstens etwa 60 Zeilen).

## Prüfgrundlagen

- `development/backtest/wp02/orders/18.md`, `development/backtest/specification.md`, `development/backtest/plan.md`
- `docs/technical/development-test-security-rules.md`
- Briefing Tester Funktion in `docs/technical/agentenrollen-und-briefings.md`
- Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`

## Ablage

Schreibe den Testbericht ohne Commit als Datei `18-functiontest-1.md` in das Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/backtest/wp02/reports/`. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig und alle Befunde mit Fundstelle.
