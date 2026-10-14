# Prüfbericht Plan, Durchlauf 3

- Vorhaben: `ablauftest`
- Phase: 3 Planung, Prüfung des Arbeitspaketplans, Nachprüfung (dritter und letzter Durchlauf dieser Prüfschleife)
- Rolle: QA
- Übergabedokument: `development/ablauftest/reviews/plan-3-order.md`
- geprüfter Commit: `b9c3d77caf608a8ebde2b634f30e9c354cf66189`
- Prüfgegenstand: `development/ablauftest/plan.md`

## Ergebnis

**nicht bestanden**

Die in N1 genannten Stellen (Zeilen 61, 85, 105 und 149) sind erledigt. Die Hinweise H5 bis H7 sind sachgerecht berücksichtigt. Die neu gefasste Pfadregel in Zeile 20 sagt aber jetzt ohne Einschränkung: Jede Datei außerhalb von `components/pipwerk-studio/frontend/`, auch die Dateien des Backends, steht mit vollem Pfad ab dem Wurzelverzeichnis. Zeile 37 nennt sechs Dateien des Backends nur mit Dateinamen. Diese Dateien fallen unter keine der genannten Ausnahmen. Regel und Einträge stimmen damit weiter nicht überein (Befund N2). Das ist dieselbe Art von Widerspruch wie in P4 (Durchlauf 1) und N1 (Durchlauf 2).

Dies war der dritte Durchlauf. Nach `docs/technical/entwicklungsverfahren.md` Zeile 90 geht der Fall nach einem nicht bestandenen dritten Durchlauf eine Ebene höher. Die Eskalation an den Projektleiter ist Aufgabe des Softwarearchitekten (Zeile 247), nicht der QA.

## 1. Geprüfter Stand

- `git log -1 --format=%H origin/main -- development/ablauftest/reviews/plan-3-order.md` liefert `b9c3d77caf608a8ebde2b634f30e9c354cf66189`. Das ist auch der aktuelle Stand von `origin/main`. Ich habe mein Arbeitsverzeichnis nach `git fetch origin` auf diesen Commit gesetzt.
- `git diff --stat 32424d3ce5aa0fe141287dfbe92d0c87dc08a3c1 b9c3d77caf608a8ebde2b634f30e9c354cf66189` zeigt drei geänderte Dateien: `plan.md`, `reviews/plan-2.md` und `reviews/plan-3-order.md`. Spezifikation, `scope.md` und Anforderungsdokumente sind gegenüber Durchlauf 2 unverändert. Die Prüfung der Abdeckung von req-ui-010 durch die Spezifikation (plan-1.md, Abschnitt 2) gilt deshalb weiter.
- Grundlagen: Diff von `plan.md` (Auftrag Punkt 3), der ganze Plan, `specification.md` (insbesondere Abschnitt 3.1, Zeilen 42 bis 82, und Abschnitt 6, Zeilen 240 bis 265), `docs/technical/entwicklungsverfahren.md`, `docs/technical/agentenrollen-und-briefings.md`, `docs/technical/pipwerk-studio.md` (Gliederung) und die versionierten Dateien der Komponente im geprüften Commit (`git ls-files components/pipwerk-studio LICENSE`).

## 2. Befund N1 aus Durchlauf 2

| Stelle aus N1 | Stelle im Plan jetzt | Ergebnis |
|---|---|---|
| `wp01`, Umgesetzte Teile, Abschnitt 3.1 | Zeile 61 | erledigt. `scripts/testenv`, `scripts/check`, `tests/test_testenv.py`, `test_cli.py`, `test_studio_language.py` und `test_name.py` stehen mit vollem Pfad. Die Zeilenbezeichnungen „Dokumentation“ und „nur Schreibweise“ sind Namen von Zeilen der Tabelle in Abschnitt 3.1 der Spezifikation (Zeilen 53 und 54), keine Pfadangaben. |
| `wp02`, Umfang, Zeile „Prüfskript“ | Zeile 105 | erledigt |
| technische Nachweise beider Pakete | Zeilen 85 und 149 | erledigt |
| Pfadregel | Zeile 20 | Die Regel ist neu gefasst und nennt Ausnahmen. Sie trifft für Zeile 37 nicht zu, siehe N2. |

## 3. Prüfung jeder Pfadangabe gegen die Regel in Zeile 20 (Auftrag Punkt 1)

Abgleich mit `git ls-files components/pipwerk-studio LICENSE` im geprüften Commit und mit den neuen Dateien laut Abschnitt 3.1 der Spezifikation.

| Zeile | Pfadangaben | Ergebnis |
|---|---|---|
| 18 | `src/App.tsx`, `src/App.test.tsx` | Oberfläche, vorhanden, regelgerecht |
| 32 | `components/pipwerk-studio/scripts/testenv` (neu, Spezifikation Zeile 48), `.testenv/` (Eintrag in `.gitignore`, Ausnahme), `components/pipwerk-studio/.gitignore` (vorhanden) | regelgerecht |
| 33 | `components/pipwerk-studio/backend/tests/test_testenv.py` (neu, Spezifikation Zeile 50) | regelgerecht |
| 34 | `components/pipwerk-studio/scripts/check` (neu, Spezifikation Zeile 49), `docs/technical/pipwerk-studio.md` (vorhanden) | regelgerecht |
| 35 | `playwright.config.ts` (vorhanden), `frontend/dist-e2e/` (Eintrag in `.gitignore`, Ausnahme), `components/pipwerk-studio/.gitignore`; `vite build --outDir dist-e2e`, `vite preview` sind Befehle | regelgerecht |
| 36 | `src/App.tsx`, `index.html`, `src/App.test.tsx` | vorhanden, regelgerecht |
| 37 | `components/pipwerk-studio/backend/src/pipwerk_studio/config.py` voll; `cli.py`, `app.py`, `revision.py`, `__init__.py`, `settings_service.py`, `storage.py` nur mit Dateinamen und dem Zusatz „(alle in diesem Verzeichnis)“; `pyproject.toml`, `pipwerk-studio.example.ini`, `test_cli.py`, `test_studio_language.py` voll | Alle elf Dateien sind vorhanden. Die sechs Kurzformen widersprechen der Regel, siehe N2. |
| 38 | `components/pipwerk-studio/backend/tests/test_name.py` (neu, Spezifikation Zeile 59) | regelgerecht |
| 39 | `vite.config.ts`, `e2e/start-backend.mjs` | vorhanden, regelgerecht |
| 44 bis 46 | `docs/technical/pipwerk-studio.md`, `docs/user/pipwerk-studio.md`, `components/pipwerk-studio/README.md`, `README.md`, `components/pipwerk-backtest/README.md`, `docs/user/README.md`, `docs/technical/README.md`, `docs/technical/glossar.md`; `/docs` ist eine Adresse am Port des Backends, keine Datei | regelgerecht |
| 50, 51 | `buildinfo/`, `vite.config.ts` | Oberfläche, regelgerecht |
| 61 | siehe Abschnitt 2; `components/pipwerk-studio/backend/src/pipwerk_studio/` als Verzeichnis voll; `index.html`, `e2e/start-backend.mjs`, `src/App.test.tsx`, `src/App.tsx`, `e2e/studio.spec.ts`, `playwright.config.ts`, `vite.config.ts` | regelgerecht |
| 65 | Verweis `reviews/specification-16.md` | Markdown-Verweis relativ zum Plan, wie in der Spezifikation (Zeile 8). Ziel vorhanden. Keine Pfadangabe im Sinn der Regel. |
| 80 | `LICENSE` | Ausnahme |
| 85, 105, 149 | `components/pipwerk-studio/scripts/check` | regelgerecht |
| 97 | `buildinfo/gitRevision.ts`, `vite.config.ts`, `src/buildRevision.ts`, `src/vite-env.d.ts`, `tsconfig.json` | Oberfläche, regelgerecht (neu laut Spezifikation Zeilen 69, 71, 75 beziehungsweise vorhanden) |
| 98 | `src/commitDate.ts`, `src/timestamp.ts` regelgerecht; `RevisionDisplay.tsx` und `revisionApi.ts` ohne `src/` | siehe Hinweis H9 |
| 99 bis 104 | `package.json`, `src/repository.ts`, `src/AboutDialog.tsx`, `LICENSE` (Ausnahme), `src/locales/de.json`, `src/locales/en.json`, `src/styles.css`, `src/App.tsx`, `vite.config.ts`, `src/test-setup.ts`, die neuen Testdateien, `buildinfo/gitRevision.test.ts`, `buildinfo/viteConfig.test.ts`, `e2e/studio.spec.ts`, `e2e/about.spec.ts` | regelgerecht; vorhanden oder neu laut Spezifikation Zeilen 62 bis 82 |
| 110 bis 112, 125 | `docs/technical/pipwerk-studio.md`, `docs/user/pipwerk-studio.md`, `components/pipwerk-studio/README.md`, `src/App.tsx`, `src/App.test.tsx`, `vite.config.ts`, `e2e/studio.spec.ts`, `e2e/about.spec.ts` | regelgerecht |
| 8, 9, 175, 176 | Markdown-Verweise auf Spezifikation, Präsentation, Anforderungsdokument und Prüfberichte | Ziele vorhanden; keine Pfadangaben im Sinn der Regel |

## 4. Hinweise H5 bis H7 aus Durchlauf 2 (Auftrag Punkt 2)

| Hinweis | Stelle im Plan | Ergebnis |
|---|---|---|
| H5 Ort der Beschreibung des Prüfskripts | Zeile 34 („neuer Abschnitt 6.4 „Prüfskript“ nach Abschnitt 6.3 …; die Nummern 6.1 bis 6.3 bleiben“), Zeile 44 („Beschreibung des Prüfskripts in Abschnitt 6.4“), Zeile 105 | berücksichtigt. `docs/technical/pipwerk-studio.md` hat im geprüften Commit die Abschnitte 6.1 Backend, 6.2 Frontend, 6.3 Browser-End-to-End-Test (Zeilen 234, 259, 273), danach Abschnitt 7 (Zeile 293). Der Verweis „Abschnitt 6.1 bis 6.3“ steht in Abschnitt 6.2 der Spezifikation (Zeilen 263 bis 265); die Angabe im Plan stimmt. Siehe Hinweis H8. |
| H6 Zuordnung an den Tester Funktion und Prüfung des Abschnitts | Zeile 34, letzte zwei Sätze | berücksichtigt. Die Begründung stützt sich auf `entwicklungsverfahren.md` Abschnitt „Skripte je Komponente“ (Zeile 325) und die Dokumentationspflicht (`agentenrollen-und-briefings.md` Zeile 71). Die Prüfung des Abschnitts ist der QA in Phase 4 zugeordnet. Das passt zu Abnahmekriterium 6 von `wp01` (Zeile 83: „Die technische Dokumentation nennt Name und Aufruf von Testumgebungsskript und Prüfskript“), das die QA in Phase 4 ohnehin prüft. Der Zweig des Testers Funktion wird vor der Prüfung durch die QA zusammengeführt (`entwicklungsverfahren.md` Zeile 283). Auch die Zeile „Prüfskript“ in `wp02` (Zeile 105) nennt jetzt die Beschreibung. |
| H7 `/docs` am Port der Oberfläche | Zeile 44 (Hinweis in der technischen Dokumentation), Zeile 82 (Abnahmekriterium 5: „die Prüfung gilt nur am Port des Backends“) | berücksichtigt. Die Begründung stimmt mit `components/pipwerk-studio/frontend/vite.config.ts` Zeilen 8 bis 10 und 19 bis 23 überein: `preview` leitet nur `/api` weiter. |

## 5. Befund

### N2 – Pfadregel und Zeile 37 widersprechen sich

- Fundstelle: `plan.md` Zeile 20: „Jede Datei außerhalb von `components/pipwerk-studio/frontend/`, auch die Skripte und die Dateien des Backends, steht deshalb mit vollem Pfad ab dem Wurzelverzeichnis. Ausgenommen sind wie in der Spezifikation `LICENSE` … und Einträge in `.gitignore` …“. Ebenso der Änderungsnachweis, Zeile 176: „jede Datei außerhalb von `frontend/` mit vollem Pfad“.
- Sachverhalt: Zeile 37 (`wp01`, Umfang, Zeile „Schreibweise im Backend“) nennt `cli.py`, `app.py`, `revision.py`, `__init__.py`, `settings_service.py` und `storage.py` nur mit Dateinamen, mit dem Zusatz „(alle in diesem Verzeichnis)“ nach dem vollen Pfad von `config.py`. Das sind Dateien des Backends. Sie stehen nicht mit vollem Pfad und gehören zu keiner der in Zeile 20 genannten Ausnahmen. Nach dem ersten Satz der Regel („alle anderen ab `components/pipwerk-studio/frontend/`“) lägen sie unter `frontend/`; dort gibt es sie nicht. Der Zusatz „(alle in diesem Verzeichnis)“ macht die Stelle für sich genommen eindeutig. Die Regel lässt diese Schreibweise aber nicht zu.
- Einordnung: Die Stelle selbst ist unverändert. Die Regel in Zeile 20 ist neu und sagt ausdrücklich, dass alle Backend-Dateien mit vollem Pfad stehen. Der Widerspruch entsteht durch diese Änderung (Auftrag Punkt 3). Der Auftrag verlangt in Punkt 1, jede Pfadangabe gegen die Regel zu prüfen. In Durchlauf 2 habe ich Zeile 37 als erledigt gewertet. Damals sagte die Regel schon „Dateien des Backends stehen deshalb immer mit vollem Pfad“. Diese Kurzformen habe ich in Durchlauf 2 übersehen. Abschnitt 3.1 der Spezifikation verwendet dieselbe Kurzform (Zeilen 55, 56 und 58). Die Spezifikation führt diese Kurzform aber nicht als Ausnahme. Zeile 20 nennt als Ausnahmen „wie in der Spezifikation“ nur `LICENSE` und die Einträge in `.gitignore`.
- Kritikpunkt: Die Regel sagt „jede Datei“, Zeile 37 hält sich nicht daran. Frage: Sollen die sechs Dateien in Zeile 37 unter die Regel fallen, oder soll die Regel die Aufzählung mit dem Zusatz „alle in diesem Verzeichnis“ als weitere Ausnahme nennen?

## 6. Hinweise

Diese Hinweise bestimmen das Ergebnis nicht.

### H8 – Nummer 6.4 und die übrigen neuen Teile von Abschnitt 6

- Fundstelle: `plan.md` Zeile 34 (neuer Abschnitt 6.4 „Prüfskript“, angelegt vom Tester Funktion) und Zeile 44 (Abschnitt 6 außerdem mit dem Test des Testumgebungsskripts, den Tests der Schreibweise und der Suche im Repository, angelegt vom Entwickler); Zeile 110 (`wp02`: Tests des Dialogs in Abschnitt 6).
- Sachverhalt: Der Plan legt die Nummer 6.4 für den Abschnitt des Testers Funktion fest. Wo die neuen Teile des Entwicklers in Abschnitt 6 stehen, sagt er nicht. Der Zweig des Testers Funktion setzt auf dem geprüften Commit des Entwicklers auf (`entwicklungsverfahren.md` Zeile 280). Legt der Entwickler für die Suche im Repository einen eigenen Unterabschnitt nach 6.3 an, trägt dieser die Nummer 6.4, bevor der Tester Funktion seinen Abschnitt anlegt.
- Frage: Wird im Auftrag an den Entwickler festgelegt, dass seine Ergänzungen in Abschnitt 6 die Nummer 6.4 nicht belegen?

### H9 – `RevisionDisplay.tsx` und `revisionApi.ts` ohne `src/`

- Fundstelle: `plan.md` Zeile 98 (`wp02`, Umfang, Zeile „Gemeinsame Hilfsfunktionen“).
- Sachverhalt: Nach der Regel in Zeile 20 gelten diese Angaben ab `components/pipwerk-studio/frontend/`. Die Dateien liegen aber unter `components/pipwerk-studio/frontend/src/` (`git ls-files`). Die Stelle ist unverändert. Sie verhindert die Umsetzung nicht: Die Dateinamen kommen in der Komponente nur einmal vor, und Abschnitt 3.1 der Spezifikation nennt sie in Zeile 76 mit `src/`. Nach Auftrag Punkt 4 ist das deshalb kein Befund.
- Frage: Soll die Regel auch für diese Stelle gelten?

## 7. Weitere Prüfung der Änderungen (Auftrag Punkte 3 und 4)

Ich habe jede geänderte Stelle des Diffs geprüft: Zeilen 9, 20, 34, 44, 61, 82, 85, 105, 149 und 176. Außer N2 und den Hinweisen H8 und H9 habe ich keinen neuen Fehler gefunden. Die Änderungen widersprechen keiner Anforderung und lassen keinen Teil der Spezifikation unabgedeckt. Die Abdeckung der Spezifikation durch die Pakete (plan-1.md, Abschnitt 3; plan-2.md, Abschnitt 6) bleibt bestehen. Die Abdeckung von req-ui-010 (Zeilen 151 bis 168) ist unverändert.
