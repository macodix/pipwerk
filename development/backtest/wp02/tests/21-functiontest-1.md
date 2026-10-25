# Testbericht Funktionstest, Auftrag 21, Durchlauf 1

- Ergebnis: **bestanden**
- geprüfter Commit: `7f388d4166325f4224c01c13ab969ad6e2248749` (Zweig `backtest/wp02-21`, aufgesetzt auf `520d925af4dd7ef388d1d8b01f362e618116eff8`)
- Prüfer: Tester Funktion

## Prüfskript

`components/pipwerk-replay/scripts/check --backend-port 18741 --frontend-port 18742`: Exitcode 0, „all checks passed“. Alle Schritte bestanden (Backend: 948 pytest-Tests, ruff, mypy, openapi; Oberfläche: npm ci, Typprüfung, Vitest, Bau; Browsertest). Es fehlte kein Browser. `playwright install` wurde nicht aufgerufen.

## Browsertests (Playwright 1.64.1, echtes Backend)

| Browser | bestanden | gescheitert | übersprungen |
| --- | --- | --- | --- |
| chromium | 123 | 0 | 0 |
| firefox | 2 (`smoke`) | 0 | 0 |
| webkit | 2 (`smoke`) | 0 | 0 |
| gesamt | 127 | 0 | 0 |

Die Tests von Auftrag 20 (`settings` 6, `importdirectory`, `layout` je sechs Fenstergrößen mit Einstellungen und Dialog „Datei importieren“ mit Auswahl im Importverzeichnis, `language`, `texts`) laufen in chromium und bestehen. Keiner ist wiederholt (kein „flaky“) oder übersprungen.

## Gegenstand 1: Anhebung

- `package.json` und `package-lock.json` von pipwerk replay nennen `@playwright/test`, `playwright` und `playwright-core` in 1.64.1. Kein Verweis auf 1.63.0 in pipwerk replay (`git grep`); die übrigen Fundstellen sind `components/pipwerk-studio` (nicht Gegenstand) und Auftrag 21 selbst.
- `docs/technical/pipwerk-replay.md`: Liste der Abhängigkeiten und Änderungsnachweis angepasst. Das README von pipwerk replay nennt keine Fassung.

## Gegenstand 2: Änderungen an Browsertests und Oberfläche

Der Code der Oberfläche (`frontend/src`) ist gegenüber `520d925` unverändert (`git diff --stat` ohne Eintrag).

| Test | Änderung | Abschwächung? |
| --- | --- | --- |
| `importdirectory`: Erklärung liegt über dem Dialog | Messung mit `pointer-events: auto`; die Erklärung hat in `styles.css:175` `pointer-events: none`, so lieferte `elementFromPoint` sie nie | nein, Aussage („nicht verdeckt“) bleibt |
| `language`: Leeranzeige im Englischen | erwarteter Text jetzt der volle Satz aus `en.json:278` | nein, strenger |
| `language`: Erklärung „eine Ebene höher“ | Unterverzeichnis angelegt und geöffnet, Maus weggesetzt; Text und Lage der Erklärung unverändert geprüft | nein; im Importverzeichnis ist die Schaltfläche gesperrt und nicht fokussierbar |
| `layout`: Karten | Überschrift oder Karte muss ganz im Hauptbereich liegen; nur bei Karte ohne Überschrift, die höher als der Hauptbereich ist, genügt Überlappung | geringfügig, begründet: Karte höher als das Fenster kann nicht ganz sichtbar sein; Lage der Bedienelemente in der Karte bleibt streng geprüft |

## Befunde

Keine blockierenden Befunde.

- H1 (Hinweis): Die Lockerung in `layout.spec.ts` gilt für jede Karte ohne Überschrift, nicht nur die Leiste des Datenbestands; eine neue Karte ohne Überschrift würde dort nicht streng geprüft. Kein Handlungsbedarf in diesem Auftrag.
- Gegenstand 4 (Dateien behalten bei gleichem Namen) und 5 (pipwerk Studio): laut Auftrag nicht gemeldet.
