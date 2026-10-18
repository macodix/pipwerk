# Prüfauftrag Auftrag 01, Durchlauf 2

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `a9aa37fc67852ba842b5039ef344208808e7c9c2` auf Zweig `strategiedesign/wp02-01`. Er enthält den Merge-Commit `112af2f40f66655550666121a2c317e2de1dd400`, der den Arbeitszweig `strategiedesign/wp02` mit dem zusammengeführten Auftrag 03 (Merge-Commit `eb2853aa768d9a6bbb411d92a2b117c6b3898f39`) in den Auftragszweig übernimmt.
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/01.md`, besonders „Nachtrag nach Durchlauf 1 der Tester“ (Punkte 17 bis 26)
- vorheriger Durchlauf: `development/strategiedesign/wp02/tests/01-functiontest-1.md` (nicht bestanden, B1 bis B3, H1 bis H6) und `01-securitytest-1.md` (bestanden, H1 bis H3) zum Commit `f22b0a98f3ef22d649fd1dc85bdeb2f91436a3b4`
- Prüfgrundlagen: der Auftrag; `development/strategiedesign/specification.md` und `development/strategiedesign/plan.md` auf `origin/main` in der Fassung vom 2026-10-18 (Spezifikation 2 E2 und E3, 3.1, 3.6, 3.7, 5, 7 Punkt Oberfläche, 8; Plan `wp02` mit Abnahmekriterium 2 neu); `docs/technical/development-test-security-rules.md`, `docs/technical/pipwerk-studio.md`, `docs/technical/pipwerk-domain.md`
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`. Für die Befunde und Hinweise aus Durchlauf 1 ist dies eine Nachprüfung. Die Punkte 20 und 26 des Nachtrags sind neu und werden vollständig geprüft. Nur blockierende Befunde verhindern das Bestehen.

## Angaben des Entwicklers

- Erster Teil (Commit `fd2dddad6a934932c3dfacd5e95e834544f1f5ff`): Punkte 17 (Listen nach Verzeichniswechsel neu angefragt), 18 (Wartezeit 400 ms in der Dokumentation, übrige Zahlen geprüft), 19 (nur `x`/`y` der Elemente außer Acht), 21 (Prozentwerte ohne „NaN“), 22 (Browsertest wartet auf das zweite `PUT`), 23 (`.5` angenommen, Hinweis am Feld), 24 (`document/own.ts`, Schlüssel `__proto__` erhalten); Antwort `201` von `PUT` wie `200`.
- Zweiter Teil: Zusammenführung mit einem Konflikt in `src/testing/element-types.json`, gelöst mit der Fassung aus Auftrag 03. Punkt 20: Rahmen am Ausgang mit `holds_management`, von diesem Ausgang keine Verbindung (`isValidConnection`), Namensfeld nach `named`, Zeiteinheiten aus `choices` (`model/timeUnits.ts` entfernt), Strategieparameter nach dem Objekt mit `strategy_parameters` und Punkt. Punkt 26: „Neue Strategie“ ohne Elemente, Text zu `strategy.no_trigger` entfernt, Vollständigkeitsprüfung der Übersetzungen gegen `pipwerk-domain.md`. Dazu im Glossar „Auslöser“ (eine Strategie kann keinen Auslöser haben) und „Verwaltung (Rahmen)“ berichtigt.
- Vitest 728 Tests, Browsertests 69 bestanden und 6 übersprungen in drei Browsern, Bibliothek 1013, Backend 742; Prüfskript Exitcode 0.

## Tester Funktion

Führe das Prüfskript `components/pipwerk-studio/scripts/check` ohne `--with-audit` auf freien Ports aus (nicht 5174 und 8001) und belege den Exitcode. Prüfe die Befunde B1 bis B3 und die Hinweise H1 bis H6 aus Durchlauf 1 nach dem Nachtrag, und die Punkte 20 und 26 vollständig: keine Typkenntnis in der Darstellung (Kriterium 3), Rahmen am Ausgang aus der Typbeschreibung, keine Verbindung von diesem Ausgang, Namensfeld und Zeiteinheiten aus der Typbeschreibung, Strategieparameter in der Ausdruckseingabe, leere neue Strategie und „Prüfen“ ohne Befund (Plan `wp02`, Abnahmekriterium 2), Übersetzungen der Befunde, angepasste Tests und Browsertests, die Ableitung Dokument → Zeichenfläche → Dokument für beide Testfalldokumente, die Zusammenführung mit Auftrag 03 und die technische Dokumentation und Anwenderdokumentation zu den geänderten Stellen. Änderungen am Prüfskript im Zweig `strategiedesign/wp02-functiontest`, aufgesetzt auf dem geprüften Commit; nenne den Commit des Prüfskripts.

Ablage: `01-functiontest-2.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis

## Tester Sicherheit

Prüfe die Hinweise H1 bis H3 aus Durchlauf 1 nach dem Nachtrag (H2: Schlüssel `__proto__` in Belegungen, `document/own.ts` und alle Stellen derselben Art) und die neuen Stellen: Prüfung der neuen Felder der Typbeschreibung in den Antworten des Backends, Texte nur als Text, keine festen Ports, Pfade, Rechnernamen oder Zugangsdaten, Browsertests schreiben nur in ihr temporäres Verzeichnis, Abhängigkeiten unverändert.

Ablage: `01-securitytest-2.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
