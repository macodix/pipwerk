# Prüfbericht Plan, Durchlauf 1

- Vorhaben: `ablauftest`
- Phase: 3 Planung, Prüfung des Arbeitspaketplans
- Rolle: QA
- Übergabedokument: `development/ablauftest/reviews/plan-1-order.md`
- geprüfter Commit: `bd4638b370effce3c70f14dec343d37c6e25bd19`
- Prüfgegenstand: `development/ablauftest/plan.md`

## Ergebnis

**nicht bestanden**

Die Spezifikation deckt req-ui-010 vollständig ab, auch den neuen Satz zum Zeilenumbruch. Der Plan verteilt die Spezifikation fast lückenlos und ohne widersprüchliche Doppelung auf `wp01` und `wp02`. Die Abhängigkeit ist richtig. Es bleiben vier Befunde: zwei Teile aus Abschnitt 7 der Spezifikation sind keinem Paket zugeordnet (P1, P2), ein Abnahmekriterium von `wp01` ist für den Auftraggeber so nicht prüfbar (P3), und die Pfadregel des Plans widerspricht seinen eigenen Einträgen (P4).

## 1. Geprüfter Stand

- Das Arbeitsverzeichnis wurde neu auf `origin/main` angelegt. `HEAD` ist `bd4638b370effce3c70f14dec343d37c6e25bd19`. Dieser Commit hat das Übergabedokument auf `main` gebracht (`git log -1 --format=%H origin/main -- development/ablauftest/reviews/plan-1-order.md`).
- Der Plan nennt als Grundlage den Commit `b2398e2f57e9e3bef1537f5b473a06df4ec933fa` (plan.md Zeile 9). `git diff --stat b2398e2f… bd4638b3…` zeigt nur zwei geänderte Dateien: `plan.md` und `reviews/plan-1-order.md`. Spezifikation und req-ui-010 sind also in beiden Commits gleich.
- req-ui-010 in dieser Fassung enthält den Satz „Ein Zeilenumbruch zwischen „pipwerk“ und „Studio“ ist zulässig.“ (`anforderungen-strategiedesigner.md` Zeile 296, Änderungsnachweis Zeile 450 vom 14.10.2026).
- Bestätigung der Spezifikation: Folie 5, `presentations/specification.html` Zeile 119, „Bestätigt durch den Auftraggeber im Chat am 14. Oktober 2026 nach Einarbeitung des Einwands“.

## 2. Prüfpunkt 1: Abdeckung von req-ui-010 durch die Spezifikation

Ich habe jede Aussage von req-ui-010 (Zeilen 289 bis 296) mit der Spezifikation verglichen. Das Ergebnis stimmt mit der Tabelle „Abdeckung von req-ui-010“ im Plan überein (plan.md Zeilen 151 bis 168):

| Aussage in req-ui-010 | Spezifikation | Ergebnis |
|---|---|---|
| Dialog auf Anforderung, Name | Abschnitt 1, 3.2, 3.6 | abgedeckt |
| Stand: vollständige Kennung, Datum und Uhrzeit in Ortszeit, in der Software enthalten, ohne Internet, „unbekannt“ | E2 bis E5, 3.3, 3.4, 5 | abgedeckt |
| genau in Testumgebung und Installation; Entwicklungsbetrieb: Commit vom Start | E9, Absatz „Grenze im Entwicklungsbetrieb“ | abgedeckt; die Installation ist laut E9 nicht Gegenstand des Vorhabens |
| Anwenderdokumentation erklärt die Abweichung und beschreibt die Testumgebung | Abschnitt 7, Zeilen 280 und 283 | abgedeckt |
| Lizenz: Name und vollständiger Text im englischen Original | E7, 3.2, 3.6 | abgedeckt |
| Adresse als Verweis in neuem Tab | E6, 3.2, 3.5 | abgedeckt |
| Schaltfläche rechts neben der Sprachauswahl, Beschriftung de/en | 3.6 | abgedeckt |
| übrige Oberfläche gesperrt, Schließen nur mit „Schließen“ oder Escape | E8, 3.2 | abgedeckt |
| übrige Texte folgen der Oberflächensprache | 3.2 | abgedeckt |
| Standanzeige in der Fußzeile bleibt | Abschnitt 1, 4.1, 4.2 | abgedeckt |
| Name überall „pipwerk Studio“, auch in der Dokumentation | E10, 4.4, 7 | abgedeckt |
| Zeilenumbruch zwischen „pipwerk“ und „Studio“ zulässig | 4.4 Zeilen 220 und 226 | abgedeckt, siehe unten |

Zum neuen Satz über den Zeilenumbruch: Die Spezifikation lässt den Umbruch ausdrücklich im Hilfetext zu, weil der Test die Ausgabe vorher zusammenfasst (Zeile 220). Die übrigen geprüften Ausgaben (Fehlermeldung, Detailtext, Protokoll, Schnittstellenbeschreibung, Zeilen 219 bis 224) werden nicht nach der Breite umgebrochen. Die Suche im Repository (Zeile 228) arbeitet zeilenweise und meldet einen Umbruch zwischen „pipwerk“ und „Studio“ nicht als Fehler. In der Oberfläche bricht der Browser um; dazu macht die Spezifikation keine Einschränkung. Einen Widerspruch zwischen Spezifikation und req-ui-010 habe ich nicht gefunden.

## 3. Prüfpunkt 2: Abdeckung der Spezifikation durch die Pakete

### Abschnitt 3.1, Zeile für Zeile

| Zeile in specification.md | Datei | Paket laut Plan | Ergebnis |
|---|---|---|---|
| 48 | `scripts/testenv` | `wp01` | abgedeckt |
| 49 | `scripts/check` | `wp01`, in `wp02` nur aktuell halten | abgedeckt, kein Widerspruch |
| 50 | `tests/test_testenv.py` | `wp01` | abgedeckt |
| 51 | `.gitignore`, beide Einträge | `wp01` | abgedeckt |
| 52 | `components/pipwerk-studio/README.md` | Schreibweise `wp01`, Satz zum Dialog `wp02` | abgedeckt |
| 53 | technische und Anwenderdokumentation | aufgeteilt | siehe Abschnitt 7 unten |
| 54 | übrige Dokumente, nur Schreibweise | `wp01` | abgedeckt |
| 55, 56 | Backend-Module | `wp01` | abgedeckt |
| 57 | `pyproject.toml`, Beispielkonfiguration | `wp01` | abgedeckt (Pfad siehe P4) |
| 58 | `test_cli.py`, `test_studio_language.py` | `wp01` | abgedeckt (Pfad siehe P4) |
| 59 | `test_name.py` | `wp01` | abgedeckt |
| 60 | `index.html` | `wp01` | abgedeckt |
| 61 | `e2e/start-backend.mjs` | `wp01` | abgedeckt |
| 62 bis 66 | `test-setup.ts`, neue Frontend-Tests, `gitRevision.test.ts`, `viteConfig.test.ts` | `wp02` | abgedeckt |
| 64 | `src/App.test.tsx` | Überschrift `wp01`, Schaltfläche `wp02` | abgedeckt |
| 67 | `e2e/studio.spec.ts` oder `e2e/about.spec.ts` | Überschrift und Titel `wp01`, Dialog `wp02` (Umfang Zeile 104) | abgedeckt; siehe Hinweis H2 |
| 68 | `playwright.config.ts` | `wp01` | abgedeckt |
| 69 bis 78 | `buildinfo/gitRevision.ts`, `AboutDialog.tsx`, `buildRevision.ts`, `repository.ts`, `commitDate.ts`, `timestamp.ts`, `vite-env.d.ts`, `RevisionDisplay.tsx`, `revisionApi.ts`, Sprachdateien, `styles.css` | `wp02` | abgedeckt |
| 79 | `src/App.tsx` | Überschrift `wp01`, Schaltfläche und Dialog `wp02` | abgedeckt |
| 80 | `package.json` | `wp02` | abgedeckt |
| 81 | `vite.config.ts` | Kommentar `wp01`; `define`, `server.fs.allow`, Testdateien unter `buildinfo/` `wp02` | abgedeckt |
| 82 | `tsconfig.json` | `wp02` | abgedeckt |

Zusätzlich habe ich mit `git grep` alle Nennungen von `pipwerk[ -]studio` (ohne Beachtung der Groß- und Kleinschreibung) außerhalb von `docs/design/` und `development/` gesucht. Jede Datei mit einer anderen Schreibweise als „pipwerk Studio“ oder `pipwerk-studio` steht im Umfang von `wp01`. Die übrigen Fundstellen (`test_config.py`, `LanguageSelect.test.tsx`, `package.json`, `package-lock.json`, `uv.lock`) enthalten nur den Bezeichner `pipwerk-studio`.

### Übrige Abschnitte

| Abschnitt | Paket | Ergebnis |
|---|---|---|
| 1 | Schreibweise `wp01`, Dialog `wp02` | abgedeckt |
| E1 | `wp01` (Backend nur Texte), `wp02` vollständig | abgedeckt, kein Widerspruch |
| E2 bis E8 | `wp02` | abgedeckt |
| E9 | Testumgebung `wp01`, Dialog `wp02` | abgedeckt |
| E10 | `wp01`; neue Texte in `wp02` folgen E10 | abgedeckt |
| Grenze im Entwicklungsbetrieb | `wp02` | abgedeckt |
| 3.2 bis 3.6 | `wp02` | abgedeckt |
| 4.1 | Überschrift `wp01`, Rest `wp02` | abgedeckt |
| 4.2 | erster Absatz, Fußzeile, Überschrift `wp01`; sieben Punkte zum Dialog `wp02` | abgedeckt; siehe Hinweis H1 |
| 4.3, 4.4 | `wp01` | abgedeckt; siehe Hinweis H3 zu W2 |
| 5 | Backend `wp01`, übrige Punkte `wp02` | abgedeckt |
| 6.1, 6.2 | `wp01` | abgedeckt |
| 7 | aufgeteilt | **zwei Teile nicht zugeordnet, P1 und P2** |
| 8, 9 | Nicht-Umfang beider Pakete | abgedeckt |

## 4. Prüfpunkt 3: Aufbau der Pakete und Abnahmekriterien

Beide Pakete enthalten Ziel, Umfang, Nicht-Umfang, umgesetzte Teile der Spezifikation, Abhängigkeiten und Abnahmekriterien (Verfahren, `entwicklungsverfahren.md` Zeile 100). Der Plan führt je Paket den Stand `open`. Beide Pakete enden mit einem Ergebnis, das der Auftraggeber in der Testumgebung sehen kann: `wp01` mit startbarer Testumgebung und einheitlichem Namen, `wp02` mit dem Dialog.

Die Abnahmekriterien decken den Umfang zusammen mit den technischen Nachweisen ab. Teile, die der Auftraggeber nicht selbst sehen kann (zum Beispiel Protokolleinträge, Abbruch des Baus ohne `LICENSE`, „unbekannt“ ohne Stand), weist das Prüfskript nach. Ausnahme ist das Kriterium 5 von `wp01`, siehe P3.

## 5. Prüfpunkt 4: Abhängigkeiten

- `wp02` hängt von `wp01` ab. Das ist richtig: Die Abnahme von `wp02` braucht das Testumgebungsskript, der Nachweis zu E9 den Browsertest gegen die gebaute Oberfläche (plan.md Zeile 134).
- `wp01` braucht nichts aus `wp02`. Das Testumgebungsskript baut die Oberfläche mit `npm run build`; ohne den Import von `LICENSE` aus `wp02` gelingt der Bau wie heute. `vite preview` leitet `/api` schon heute weiter (`vite.config.ts` Zeilen 8, 9 und 22). Der Browsertest gegen die gebaute Oberfläche und die Suche nach Abschnitt 4.4 hängen nicht vom Dialog ab. `wp01` lässt sich also ohne `wp02` umsetzen, bereitstellen und abnehmen.
- Weil `wp02` erst nach Abnahme und Übernahme von `wp01` beginnt (Verfahren Zeile 69), entstehen an `src/App.tsx`, `src/App.test.tsx`, `vite.config.ts`, den Browsertests und der Dokumentation keine gleichzeitigen Änderungen.

## Befunde

### P1 – Verweise aus dem Fließtext auf das Glossar keinem Paket zugeordnet

- Fundstelle: `specification.md` Zeile 285, letzter Satz: „Bestehende Erklärungen im Fließtext bleiben und verweisen auf das Glossar.“ Im Plan: `plan.md` Zeile 45 (`wp01`) und Zeile 111 (`wp02`).
- Sachverhalt: `wp01` legt das Glossar an, `wp02` ergänzt es. Keines der beiden Pakete nennt die Verweise aus den bestehenden Erklärungen im Fließtext auf das Glossar. Solche Erklärungen gibt es heute schon, zum Beispiel zum Hintergrunddienst (`docs/user/pipwerk-studio.md` Zeile 29) und zum Stand (Zeile 37). Damit ist dieser Teil von Abschnitt 7 durch kein Paket abgedeckt.
- Frage: Welches Paket setzt die Verweise aus dem Fließtext auf das Glossar um, und gehört das zu seinem Abnahmekriterium zur Anwenderdokumentation?

### P2 – Beschreibung des Prüfskripts in der technischen Dokumentation keinem Paket zugeordnet

- Fundstelle: `specification.md` Zeile 271 („Skripte der Komponente mit einem neuen Abschnitt „Start als Testumgebung““) und Zeile 265; `entwicklungsverfahren.md` Zeile 328 („Name und Aufruf der Skripte stehen in der technischen Dokumentation der Komponente“). Im Plan: `plan.md` Zeile 44.
- Sachverhalt: Die Spezifikation spricht von den Skripten der Komponente in der Mehrzahl, das Verfahren verlangt Name und Aufruf beider Skripte in der technischen Dokumentation. Der Plan nennt für `wp01` nur das Testumgebungsskript im neuen Abschnitt „Start als Testumgebung“. Name und Aufruf des Prüfskripts `scripts/check` (mit den Ports des Browsertests als Parameter, Spezifikation Zeile 265) stehen in keinem Dokumentationsauftrag. Offen ist auch, wer sie schreibt: Das Skript legt der Tester Funktion an, die Dokumentation schreibt laut Verfahren der Entwickler.
- Frage: Ist die Beschreibung des Prüfskripts in der technischen Dokumentation Teil von `wp01`? Wenn ja, wo im Dokument steht sie, und welche Rolle schreibt sie?

### P3 – Abnahmekriterium 5 von `wp01` für den Auftraggeber nicht eindeutig prüfbar

- Fundstelle: `plan.md` Zeile 82 („Der Hilfetext der Kommandozeile (`pipwerk-studio --help`) … Die Schnittstellenbeschreibung unter `/docs` trägt den Titel „pipwerk Studio““), Zeile 76 („Der Auftraggeber kann selbst prüfen“).
- Sachverhalt: In der Testumgebung leitet `vite preview` nur `/api` an das Backend weiter (`vite.config.ts` Zeilen 8, 9 und 22). `/docs` ist über den Port der Oberfläche deshalb nicht erreichbar. Das Backend lauscht laut Spezifikation nur auf `127.0.0.1:<backend-port>` (`specification.md` Zeile 256). Die technische Dokumentation nennt `/docs` nur für den Entwicklungsbetrieb unter Port 8000 (`docs/technical/pipwerk-studio.md` Zeile 228). Ebenso sagt der Plan nicht, wo und wie der Auftraggeber `pipwerk-studio --help` und den Start ohne Startkonfiguration in der Testumgebung aufruft. Das Programm liegt in der Umgebung des Backends im Arbeitsverzeichnis der Testumgebung. Weder die Abnahmekriterien noch der Dokumentationsumfang von `wp01` beschreiben diesen Weg.
- Frage: Unter welcher Adresse soll der Auftraggeber die Schnittstellenbeschreibung in der Testumgebung aufrufen, und wie ruft er die Kommandozeile auf? Wenn das nur am Rechner der Testumgebung geht: Ist das so beabsichtigt, und wo steht es für ihn beschrieben?

### P4 – Pfadregel des Plans widerspricht den Pfaden der Backend-Dateien

- Fundstelle: `plan.md` Zeile 20 (Pfade, die nicht mit `components/`, `docs/` oder `README.md` beginnen, gelten ab `components/pipwerk-studio/frontend/`) und Zeile 37 (`config.py`, `cli.py`, `app.py`, `revision.py`, `__init__.py`, `settings_service.py`, `storage.py`, `pyproject.toml`, `pipwerk-studio.example.ini`, `tests/test_cli.py`, `tests/test_studio_language.py`).
- Sachverhalt: Nach der eigenen Regel des Plans lägen diese elf Dateien unter `components/pipwerk-studio/frontend/`, zum Beispiel `components/pipwerk-studio/frontend/pyproject.toml`. Tatsächlich liegen sie unter `components/pipwerk-studio/backend/` beziehungsweise `components/pipwerk-studio/backend/src/pipwerk_studio/`. Die Spezifikation nennt sie in Abschnitt 3.1 mit vollem Pfad (Zeilen 55 bis 58). Der Plan verweist zwar auf Abschnitt 3.1, seine Pfadregel führt aber zu falschen Pfaden.
- Kritikpunkt: Die Angaben in Zeile 37 und die Regel in Zeile 20 widersprechen sich. Ein Auftrag, der diese Zeile übernimmt, nennt Dateien, die es nicht gibt.

## Hinweise

Diese Hinweise machen die Prüfung nicht „nicht bestanden“.

### H1 – Bestehende Browsertests der Fußzeile in `wp02` nicht genannt

`wp02` verschiebt `localParts` und `isTimestamp` aus `RevisionDisplay.tsx` und `revisionApi.ts` (plan.md, Umfang „Gemeinsame Hilfsfunktionen“). Der Punkt „Bestehende Prüfungen von Fußzeile und Tooltip bestehen unverändert“ aus Abschnitt 4.2 steht nur unter `wp01` (plan.md Zeile 63), nicht bei `wp02` (Zeile 128). Der technische Nachweis von `wp02` („alle Tests“) schließt diese Tests ein. Daher ist das keine Lücke, aber die Aufzählung ist unvollständig.

### H2 – `e2e/studio.spec.ts` in der Liste zu Abschnitt 3.1 von `wp02` nicht genannt

plan.md Zeile 125 nennt als Teile zum Dialog in Dateien aus `wp01` nur `src/App.tsx`, `src/App.test.tsx`, `vite.config.ts`, die README und die Dokumente. `e2e/studio.spec.ts` steht dort nicht. Die Dateien sind trotzdem abgedeckt, durch den Umfang (Zeile 104) und durch Abschnitt 4.2 (Zeile 128).

### H3 – W2 lässt sich nicht in Auftrag und Test lösen

plan.md Zeile 65 sagt, W1 und W2 aus `specification-16.md` würden in Auftrag und Test gelöst. W2 betrifft nur die Lesbarkeit eines Satzes der Spezifikation (Bezug von „Dabei“, Zeile 226). Ein Auftrag oder Test ändert daran nichts. Die Bedeutung ist laut Prüfbericht eindeutig. Für die Umsetzung entsteht kein Risiko.

### H4 – Abnahmekriterium 3 von `wp01` deckt nur einen der Abbruchfälle

plan.md Zeile 80 nennt nur die Änderung an einer versionierten Datei. Laut Umfang (Zeile 32) bricht der Start auch bei nicht ignorierten neuen Dateien und bei Änderungen außerhalb der Komponente ab. Diese Fälle weist der Test des Testumgebungsskripts im technischen Nachweis nach (Spezifikation Zeilen 207 bis 212).
