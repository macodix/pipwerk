# Arbeitspaketplan Vorhaben ablauftest

## Status

- status: `draft`
- stand: 2026-10-14
- komponente: `pipwerk-studio`
- grundlage: [specification.md](specification.md), bestätigt vom Auftraggeber am 14.10.2026 ([Präsentation](presentations/specification.html), Folie 5), Stand `main` Commit `b2398e2f57e9e3bef1537f5b473a06df4ec933fa`; req-ui-010 in [Anforderungen an den Trading-Strategiedesigner](../../docs/design/requirements/anforderungen-strategiedesigner.md) in der Fassung dieses Commits
- prüfung: Durchlauf 1 [plan-1.md](reviews/plan-1.md) nicht bestanden, Befunde P1 bis P4 und Hinweise H1 bis H4 eingearbeitet. Durchlauf 2 [plan-2.md](reviews/plan-2.md) nicht bestanden, Befund N1 und Hinweise H5 bis H7 eingearbeitet. Durchlauf 3 [plan-3.md](reviews/plan-3.md), dritter der Schleife, nicht bestanden, Befund N2 und Hinweise H8 und H9 eingearbeitet. Frage [questions/ablauftest-08.md](questions/ablauftest-08.md) zur Grenze der Prüfschleife. Durchlauf 4 [plan-4.md](reviews/plan-4.md) als Nachprüfung zu N2, H8 und H9, freigegeben in der Antwort auf diese Frage, bestanden; Hinweis H10 im Änderungsnachweis eingearbeitet. Einwand des Auftraggebers am 14.10.2026 ([Präsentation](presentations/plan.html), Folie 4): ein einziges Arbeitspaket `wp01` mit einer Abnahme; Inhalt und Abnahmekriterien der bisherigen Pakete `wp01` und `wp02` zusammengeführt, das Testumgebungsskript entsteht im selben Paket. Durchlauf 5 [plan-5.md](reviews/plan-5.md), Nachprüfung nach dem Einwand.

## Übersicht

| Paket | Titel | hängt ab von | Stand |
|---|---|---|---|
| `wp01` | Testumgebung, Schreibweise „pipwerk Studio“ und Dialog „Über pipwerk Studio“ | – | `done` |

Das Vorhaben ist nach dem Einwand des Auftraggebers ein einziges Arbeitspaket mit einer Abnahme. Es umfasst die bisherigen Pakete „Testumgebung und Schreibweise „pipwerk Studio““ und „Dialog „Über pipwerk Studio““ vollständig.

Reihenfolge innerhalb des Pakets: Die Abnahme des Dialogs braucht das Testumgebungsskript, der Nachweis zu E9 den Browsertest gegen die gebaute Oberfläche. Testumgebungsskript und Umstellung des Browsertests sind deshalb vor der Prüfung durch die QA zusammengeführt; das stellt die Regel des Entwicklungsverfahrens sicher, nach der die QA erst prüft, wenn alle Aufträge zusammengeführt sind. Mehrere Teile ändern `src/App.tsx`, `src/App.test.tsx`, `vite.config.ts`, `e2e/studio.spec.ts`, `components/pipwerk-studio/README.md` und die Dokumentation; Aufträge, die dieselben Dateien ändern, setzt der Softwarearchitekt in Phase 4 nacheinander um.

Abschnittsangaben wie „Abschnitt 4.4“ oder „E10“ beziehen sich auf die [Spezifikation](specification.md). Pfade gelten wie in Abschnitt 3.1 der Spezifikation: Pfade, die mit `components/`, `docs/` oder `README.md` beginnen, ab dem Wurzelverzeichnis des Repositorys, alle anderen ab `components/pipwerk-studio/frontend/`. Jede Datei außerhalb von `components/pipwerk-studio/frontend/`, auch die Skripte und die Dateien des Backends, steht deshalb mit vollem Pfad ab dem Wurzelverzeichnis. Ausgenommen sind wie in der Spezifikation `LICENSE`, immer die Datei im Wurzelverzeichnis des Repositorys (E7), und Einträge in `.gitignore` wie `.testenv/` und `frontend/dist-e2e/`, die als Inhalt der Datei `components/pipwerk-studio/.gitignore` stehen. Befehle wie `testenv start` und Optionen wie `--outDir dist-e2e` sind keine Pfadangaben.

## wp01 – Testumgebung, Schreibweise „pipwerk Studio“ und Dialog „Über pipwerk Studio“

### Ziel

pipwerk Studio lässt sich mit einem Skript als Testumgebung aus genau einem Commit bauen und starten. pipwerk Studio schreibt seinen Namen in Oberfläche, Ausgaben des Backends und Dokumentation einheitlich „pipwerk Studio“. pipwerk Studio zeigt auf Anforderung den Dialog „Über pipwerk Studio“ mit Name, Stand, Lizenz und Adresse des Repositorys nach req-ui-010.

### Umfang

| Teil | Inhalt |
|---|---|
| Testumgebungsskript | `components/pipwerk-studio/scripts/testenv` mit `start`, `stop`, `status` nach Abschnitt 6.1, einschließlich Abbruch bei nicht committeten Änderungen oder nicht ignorierten neuen Dateien im ganzen Repository (E9, Teil Testumgebung). Eintrag `.testenv/` in `components/pipwerk-studio/.gitignore`. |
| Test des Testumgebungsskripts | `components/pipwerk-studio/backend/tests/test_testenv.py` nach Abschnitt 4.3 |
| Prüfskript | `components/pipwerk-studio/scripts/check` nach Abschnitt 6.2, angelegt vom Tester Funktion in seinem Zweig, einschließlich der Suche im Repository nach Abschnitt 4.4. Name, Aufruf und Parameter des Prüfskripts (Ports des Browsertests) beschreibt der Tester Funktion im selben Zweig in einem neuen Abschnitt 6.4 „Prüfskript“ nach Abschnitt 6.3 von `docs/technical/pipwerk-studio.md`; die Nummern 6.1 bis 6.3 bleiben, damit der Verweis in Abschnitt 6.2 der Spezifikation stimmt. Der Tester Funktion schreibt die Beschreibung, weil er das Skript anlegt und hält (Entwicklungsverfahren, Abschnitt „Skripte je Komponente“) und die Beschreibung damit Teil seiner Änderung am Prüfskript ist (Dokumentationspflicht). Er hält Skript und Beschreibung bei jedem weiteren Auftrag des Pakets aktuell, wenn dessen neue Tests es verlangen. Die QA gleicht den Abschnitt mit dem Skript ab, weil sie zugleich das Prüfskript ausführt und seinen Aufruf dabei aus der Beschreibung übernimmt. Der Entwickler ergänzt Abschnitt 6 nur innerhalb der Abschnitte 6.1 bis 6.3 und belegt die Nummer 6.4 nicht; die Tests des Testumgebungsskripts und der Schreibweise und die Suche im Repository stehen in 6.1 (Backend), die Suche als eigener Punkt, die Frontend-Tests des Dialogs in 6.2 und seine Browsertests in 6.3. |
| Browsertest gegen die gebaute Oberfläche | `playwright.config.ts` startet `vite build --outDir dist-e2e` und `vite preview` statt des Entwicklungsservers (Abschnitt 4.2, erster Absatz). Eintrag `frontend/dist-e2e/` in `components/pipwerk-studio/.gitignore`. Alle bestehenden Browsertests laufen damit gegen die gebaute Oberfläche. |
| Schreibweise in der Oberfläche | Überschrift der Kopfzeile in `src/App.tsx` und Titel der Seite in `index.html` (E10 a) mit den Erwartungen in `src/App.test.tsx` (Abschnitt 4.1, Punkt „Überschrift der Kopfzeile“) und im Browsertest (Abschnitt 4.2, Punkt „Überschrift der Kopfzeile und Titel der Seite“) |
| Schreibweise im Backend | `components/pipwerk-studio/backend/src/pipwerk_studio/config.py`, `components/pipwerk-studio/backend/src/pipwerk_studio/cli.py`, `components/pipwerk-studio/backend/src/pipwerk_studio/app.py`, `components/pipwerk-studio/backend/src/pipwerk_studio/revision.py`, `components/pipwerk-studio/backend/src/pipwerk_studio/__init__.py`, `components/pipwerk-studio/backend/src/pipwerk_studio/settings_service.py`, `components/pipwerk-studio/backend/src/pipwerk_studio/storage.py`, `components/pipwerk-studio/backend/pyproject.toml`, `components/pipwerk-studio/backend/pipwerk-studio.example.ini`, `components/pipwerk-studio/backend/tests/test_cli.py` und `components/pipwerk-studio/backend/tests/test_studio_language.py` nach E10 b und d und Abschnitt 3.1. Hilfetext nach dem Absatz „Umbruch des Hilfetexts“ in Abschnitt 4.4. Verhalten, Endpunkte und Datenformate unverändert (E1, Abschnitt 5, letzter Punkt). |
| Tests der Schreibweise | `components/pipwerk-studio/backend/tests/test_name.py` nach Abschnitt 4.4 |
| Schreibweise in Kommentaren der Oberfläche | `vite.config.ts` und `e2e/start-backend.mjs`, nur Kommentar (E10 d) |
| Ermittlung des Stands beim Bau | `buildinfo/gitRevision.ts` mit `lookupGitRevision` (Abschnitt 3.4), `define` in `vite.config.ts`, `src/buildRevision.ts` mit `parseBuildRevision`, `src/vite-env.d.ts`, `buildinfo` in `tsconfig.json` und in der Include-Liste von Vitest (Abschnitt 4.1) |
| Gemeinsame Hilfsfunktionen | `src/commitDate.ts` mit `localParts` aus `src/RevisionDisplay.tsx`, `src/timestamp.ts` mit `isTimestamp` aus `src/revisionApi.ts`; `src/RevisionDisplay.tsx` und `src/revisionApi.ts` nur verschoben, Verhalten unverändert |
| Adresse des Repositorys | Feld `repository` in `package.json`, `src/repository.ts` mit `parseRepositoryUrl` (Abschnitt 3.5) |
| Dialog | `src/AboutDialog.tsx` nach Abschnitt 3.2, 3.3 und 3.6 (Lizenztext aus `LICENSE` mit `?raw`, E7, E8), Texte unter `about` in `src/locales/de.json` und `src/locales/en.json`, Gestaltung in `src/styles.css` |
| Aufrufstelle | Schaltfläche in der Kopfzeile rechts neben der Sprachauswahl und Einbindung in `src/App.tsx` (Abschnitt 3.6) |
| Entwicklungsserver | `server.fs.allow` für genau `LICENSE` in `vite.config.ts` (Abschnitt 3.6) |
| Frontend-Tests des Dialogs | `src/test-setup.ts`, `src/AboutDialog.test.tsx`, `src/buildRevision.test.ts`, `src/repository.test.ts`, `src/commitDate.test.ts`, `src/timestamp.test.ts`, Tests der Schaltfläche in `src/App.test.tsx`, `buildinfo/gitRevision.test.ts`, `buildinfo/viteConfig.test.ts` nach Abschnitt 4.1 |
| Browsertests des Dialogs | Punkte zum Dialog aus Abschnitt 4.2 in `e2e/studio.spec.ts` oder `e2e/about.spec.ts` |
| Dokumentation | siehe unten |

Dokumentation (Abschnitt 7 der Spezifikation):

- `docs/technical/pipwerk-studio.md`: Schreibweise nach E10 im ganzen Dokument einschließlich Titel, Überschriften und wiedergegebener Ausgaben; der Satz „Der Produktname … wird nicht übersetzt“ nennt „pipwerk Studio“; neuer Abschnitt „Start als Testumgebung“ neben Abschnitt 4 mit dem Testumgebungsskript, einschließlich der Adresse der Schnittstellenbeschreibung in der Testumgebung (`/docs` am Port des Backends, nur auf `127.0.0.1` des Rechners der Testumgebung, mit dem Hinweis, dass derselbe Pfad am Port der Oberfläche nicht die Schnittstellenbeschreibung zeigt) und des Aufrufs der Kommandozeile `pipwerk-studio` aus der Umgebung des Backends im Arbeitsverzeichnis der Testumgebung; Abschnitt zum Dialog mit E1 bis E9, Ermittlung beim Bau und Abbruch des Baus ohne `LICENSE`; neue Dateien in Abschnitt 2.3, soweit sie die Oberfläche betreffen; Abschnitt 6 mit dem Test des Testumgebungsskripts, den Tests der Schreibweise, der Suche im Repository, den Tests des Dialogs, Abschnitt 6.3 „Browsertest gegen die gebaute Oberfläche mit `vite preview`“ und der Beschreibung des Prüfskripts in Abschnitt 6.4 (Tester Funktion, siehe Zeile „Prüfskript“); Unterprozesse beim Bau in Abschnitt 8; in Abschnitt 9 der Ersatz des Punkts „Installation, Paketierung und Start außerhalb der Entwicklungsumgebung sind nicht festgelegt“ nach Abschnitt 7 der Spezifikation und die Grenze im Entwicklungsbetrieb.
- `docs/user/pipwerk-studio.md`: Schreibweise nach E10 im ganzen Dokument; Abschnitt 2 „pipwerk Studio öffnen“ mit den zwei Wegen Testumgebung und Entwicklungsbetrieb nach Abschnitt 7 der Spezifikation, der bisherige Satz zum Start nur in einer Entwicklungsumgebung wird ersetzt; Abschnitt 3: der Name in der Kopfzeile lautet „pipwerk Studio“, dazu die neue Schaltfläche in der Kopfzeile; neuer Abschnitt zum Dialog mit allen Punkten aus Abschnitt 7 der Spezifikation (Öffnen, Inhalte, Anzeigen des Stands, „unbekannt“ beim Repository, gesperrte Oberfläche, Schließen, Fokus, Sprachwechsel); Stand in der Testumgebung und Abweichung im Entwicklungsbetrieb mit allen drei Punkten der Grenze; Internetverbindung nur für den Verweis; neuer Abschnitt „Glossar“ mit mindestens allen in Abschnitt 7 der Spezifikation genannten Begriffen: Commit, Kennung (eines Commits), Stand, Repository, Lizenz, Hintergrunddienst, Tooltip, Testumgebung, Testumgebungsskript, Entwicklungsbetrieb, Port und nicht committete Änderung. Die bestehenden Erklärungen im Fließtext, zum Beispiel zum Hintergrunddienst und zum Stand, bleiben und verweisen auf das Glossar (Abschnitt 7 der Spezifikation, letzter Punkt).
- `components/pipwerk-studio/README.md`: Satz zum Dialog in der Beschreibung des Stands, Schreibweise nach E10 einschließlich Überschrift.
- `README.md`, `components/pipwerk-backtest/README.md`, `docs/user/README.md`, `docs/technical/README.md`, `docs/technical/glossar.md`: Schreibweise nach E10, auch in Überschriften und Verweistexten.

### Nicht-Umfang

- Alles aus Abschnitt 8 der Spezifikation: Dokumente unter `docs/design/` und `development/`, Bezeichner, Namen anderer Komponenten, Einstellungsbereich, Änderungen am Verhalten des Backends und an `GET /api/studio/revision`
- Die Hinweise an den Auftraggeber in Abschnitt 9 der Spezifikation; sie verlangen keine Umsetzung

### Umgesetzte Teile der Spezifikation

Die Spezifikation vollständig außer Abschnitt 8 (Nicht Gegenstand) und Abschnitt 9 (Hinweise für den Auftraggeber):

- Abschnitt 1 vollständig: Dialog und Schreibweise des Namens
- Abschnitt 2: E1 bis E10 vollständig und Absatz „Grenze im Entwicklungsbetrieb“
- Abschnitt 3.1 bis 3.6 vollständig
- Abschnitt 4.1 bis 4.4 vollständig; der Hinweis W1 aus [specification-16.md](reviews/specification-16.md) (Prüfung, dass Beschreibung und Hilfetexte den Bezeichner `pipwerk-studio` nicht enthalten) wird hier in Auftrag und Test gelöst. Der Hinweis W2 betrifft nur die Lesbarkeit eines Satzes der bestätigten Spezifikation und verlangt keine Umsetzung. Die bestehenden Prüfungen von Fußzeile und Tooltip bestehen nach den Verschiebungen von `localParts` und `isTimestamp` unverändert.
- Abschnitt 5 vollständig
- Abschnitt 6.1 und 6.2 vollständig
- Abschnitt 7 vollständig

### Abhängigkeiten

keine

### Abnahmekriterien

Der Auftraggeber kann in der Testumgebung selbst prüfen:

1. Die Testumgebung startet mit `testenv start` und den zwei Ports aus einem Arbeitsverzeichnis ohne nicht committete Änderungen. Im Browser ist pipwerk Studio unter dem Port der Oberfläche erreichbar und arbeitet wie bisher: Sprachwechsel, Fußzeile mit Stand und Tooltip.
2. `testenv status` nennt die laufende Testumgebung und ihre Ports, `testenv stop` beendet sie.
3. Nach einer Änderung an einer versionierten Datei, auch an `LICENSE` außerhalb der Komponente, und nach dem Anlegen einer nicht ignorierten neuen Datei bricht `testenv start` mit einer Fehlermeldung zur Ursache ab und startet nichts.
4. Überschrift der Kopfzeile und Titel der Seite im Browser lauten „pipwerk Studio“, in Deutsch und Englisch.
5. Am Rechner der Testumgebung, aufgerufen wie in der technischen Dokumentation im Abschnitt „Start als Testumgebung“ beschrieben: Der Hilfetext der Kommandozeile (`pipwerk-studio --help`) und die Fehlermeldung beim Start ohne Startkonfiguration schreiben den Namen „pipwerk Studio“; die Schnittstellenbeschreibung unter `/docs` am Port des Backends trägt den Titel „pipwerk Studio“. Über den Port der Oberfläche ist die Schnittstellenbeschreibung nicht erreichbar, weil `vite preview` nur `/api` an das Backend weiterleitet; die Prüfung gilt nur am Port des Backends.
6. In der Kopfzeile steht rechts neben der Sprachauswahl die Schaltfläche „Über pipwerk Studio“ („About pipwerk Studio“); sie öffnet den Dialog mit der Maus und mit der Tastatur.
7. Der Dialog zeigt Name „pipwerk Studio“, den Stand als vollständige Kennung des Commits mit Datum und Uhrzeit in Ortszeit, Name und vollständigen Text der GNU General Public License, Version 3, im englischen Original und die Adresse https://github.com/macodix/pipwerk als Verweis.
8. Die Kennung im Dialog ist dieselbe wie im Tooltip der Fußzeile und gleich dem bereitgestellten Commit.
9. Der Verweis öffnet sich in einem neuen Tab.
10. Bei offenem Dialog ist die übrige Oberfläche gesperrt. Der Dialog schließt nur mit „Schließen“ oder der Escape-Taste, nicht mit einem Klick daneben. Danach liegt der Fokus auf der Schaltfläche.
11. Die übrigen Texte des Dialogs folgen der Oberflächensprache.
12. Die Anzeige im Dialog braucht keine Internetverbindung.
13. Die Anwenderdokumentation beschreibt in ganzen Sätzen, wie pipwerk Studio als Testumgebung und im Entwicklungsbetrieb gestartet wird, beschreibt den Dialog, den Stand in der Testumgebung und die Abweichung im Entwicklungsbetrieb verständlich und vollständig und erklärt die verwendeten Begriffe im Glossar; die bestehenden Erklärungen im Fließtext verweisen darauf. Anwender- und technische Dokumentation schreiben den Namen „pipwerk Studio“. Die technische Dokumentation nennt Name und Aufruf von Testumgebungsskript und Prüfskript.

Technische Nachweise, die die QA in ihrem Prüfbericht nennt: Das Prüfskript `components/pipwerk-studio/scripts/check` endet mit Exitcode 0 auf dem bereitgestellten Commit; darin bestehen alle Backend-, Frontend- und Browsertests einschließlich der neuen Frontend- und Browsertests des Dialogs in Chromium, Firefox und WebKit, der Test des Testumgebungsskripts, die Tests der Schreibweise und die Suche im Repository nach Abschnitt 4.4. Positive Testberichte beider Tester liegen für jeden zusammengeführten Auftrag vor.

## Abdeckung von req-ui-010

| Aussage in req-ui-010 | Spezifikation | Paket |
|---|---|---|
| Dialog „Über pipwerk Studio“ auf Anforderung | Abschnitt 1, 3.2, 3.6 | `wp01` |
| Name „pipwerk Studio“ im Dialog | Abschnitt 3.2 | `wp01` |
| Stand mit Kennung, Datum und Uhrzeit in Ortszeit, in der Software enthalten, ohne Internet, „unbekannt“ | E2 bis E5, Abschnitt 3.3, 3.4 | `wp01` |
| Stand genau in Testumgebung und Installation | E9 | `wp01` (Testumgebungsskript und Dialog) |
| Entwicklungsbetrieb: Commit vom Start, Erklärung in der Anwenderdokumentation | Grenze im Entwicklungsbetrieb, Abschnitt 7 | `wp01` |
| Anwenderdokumentation beschreibt die Testumgebung als Weg zum Start | Abschnitt 6.1, 7 | `wp01` |
| Lizenz mit Name und vollständigem Text im Original | E7, Abschnitt 3.2, 3.6 | `wp01` |
| Adresse als Verweis in neuem Tab | E6, Abschnitt 3.2, 3.5 | `wp01` |
| Schaltfläche in der Kopfzeile rechts neben der Sprachauswahl | Abschnitt 3.6 | `wp01` |
| Übrige Oberfläche gesperrt, Schließen nur mit „Schließen“ oder Escape | E8, Abschnitt 3.2 | `wp01` |
| Texte folgen der Oberflächensprache | Abschnitt 3.2 | `wp01` |
| Standanzeige in der Fußzeile bleibt | Abschnitt 1, 4.1, 4.2 | `wp01` (bestehende Tests unverändert) |
| Name überall „pipwerk Studio“, auch in der Dokumentation | E10, Abschnitt 4.4, 7 | `wp01` |
| Zeilenumbruch zwischen „pipwerk“ und „Studio“ zulässig | Abschnitt 4.4 | `wp01` |

## Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-14 | Plan angelegt: zwei Pakete, `wp02` hängt von `wp01` ab. |
| 2026-10-14 | Befunde P1 bis P4 und Hinweise H1 bis H4 aus [plan-1.md](reviews/plan-1.md) eingearbeitet: Verweise auf das Glossar und Beschreibung des Prüfskripts in `wp01`, Abnahmekriterium 5 von `wp01` mit Aufrufweg am Rechner der Testumgebung, volle Pfade der Backend-Dateien, Abnahmekriterium 3 von `wp01` mit allen Abbruchfällen, W2 ohne Umsetzung, Ergänzungen bei `wp02`. |
| 2026-10-14 | Befund N1 und Hinweise H5 bis H7 aus [plan-2.md](reviews/plan-2.md) eingearbeitet: jede Datei außerhalb von `frontend/` mit vollem Pfad, Beschreibung des Prüfskripts in Abschnitt 6.4 mit Abgleich durch die QA, Hinweis zu `/docs` am Port der Oberfläche. |
| 2026-10-14 | Befund N2 und Hinweise H8 und H9 aus [plan-3.md](reviews/plan-3.md) eingearbeitet: alle Dateien des Backends unter „Schreibweise im Backend“ einzeln mit vollem Pfad, `src/` bei `src/RevisionDisplay.tsx` und `src/revisionApi.ts`, Ergänzungen des Entwicklers in Abschnitt 6 nur in 6.1 bis 6.3. Satz zum Entwickler in der Zeile „Prüfskript“ ans Ende der Zelle gestellt und „Er schreibt die Beschreibung“ durch „Der Tester Funktion schreibt die Beschreibung“ ersetzt, damit sich die Begründung eindeutig auf den Tester Funktion bezieht (Ersetzung nachgetragen nach Hinweis H10 aus [plan-4.md](reviews/plan-4.md)). |
| 2026-10-14 | Einwand des Auftraggebers ([Präsentation](presentations/plan.html), Folie 4) eingearbeitet: ein einziges Paket `wp01` mit einer Abnahme. Ziel, Umfang, Dokumentation, Nicht-Umfang, umgesetzte Teile der Spezifikation und Abnahmekriterien der bisherigen Pakete `wp01` und `wp02` zusammengeführt; das Testumgebungsskript entsteht im selben Paket. Verweise zwischen den Paketen und die Abhängigkeit entfallen. Reihenfolge innerhalb des Pakets und Pflege des Prüfskripts bei weiteren Aufträgen ergänzt. Abnahmekriterien 6 und 8 der bisherigen Pakete zur Dokumentation in Kriterium 13 zusammengefasst. Abdeckung von req-ui-010 auf `wp01` umgestellt. |
| 2026-10-14 | `wp01` abgenommen ([Abnahmebericht](wp01/acceptance/1.md)) und mit dem Commit `e60fd1c2655e7ca9e5fe9d00ad871117dd94d11d` in `main` übernommen, Stand `done`. |
