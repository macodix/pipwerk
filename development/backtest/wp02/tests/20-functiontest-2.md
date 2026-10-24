# Testbericht Funktionstest, Auftrag 20, Durchlauf 2 (Nachprüfung)

- Ergebnis: **nicht bestanden** (nur wegen B1, einer Umgebungsgrenze; B2 ist behoben)
- geprüfter Commit: `7bf24513742193c5cb2ed3d8f6dd8af2b57374dd` (Zweig `backtest/wp02-20`), ausgecheckt und mit `git rev-parse HEAD` kontrolliert
- Prüfskripte nicht wiederholt (nur Text geändert); kein Zweig `…-functiontest` angelegt

## Prüfung der Änderung

`git diff 3d7dae2f… 7bf24513…`: geändert ist nur `docs/technical/pipwerk-replay.md`, eine Zeile (Abschnitt 9.5, Dialoge „Datei importieren“ und zum Löschen). Dort steht jetzt „öffnet der Knopf „Dateien hochladen …“ …“. Sonst nichts geändert (`--stat`: 1 Datei, 1 Einfügung, 1 Löschung).

## Befunde

**B1 (blockierend, Umgebungsgrenze, nicht ausgeräumt): Browsertests nicht ausgeführt.**
Start eines Tests (`playwright test --config …/playwright.config.ts settings`, ein Worker, Abbruch nach dem ersten Fehler): `browserType.launch: Executable doesn't exist at /var/lib/codesrv/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell`. Der Browser fehlt weiter. Die Browsertests für Auftrag 20 (`settings.spec.ts`, `importdirectory.spec.ts`, Ergänzungen) sind nicht gelaufen. Abnahmekriterium 1 und 2 sind nicht nachgewiesen. Nötig: ein Playwright-Browser (`npx playwright install` mit Netz) oder ein Hinweis, wo einer liegt.

**B2 (Name des Knopfes in Abschnitt 9.5): behoben.**
Zeile 770 nennt den Knopf „Dateien hochladen …“, wie `locales/de.json` und Zeile 740 desselben Dokuments.

## Neue Probleme durch die Änderung?

Keine. Suche nach „Dateien wählen“ in `docs` und in `frontend/src` und `frontend/e2e`: Treffer nur in
- `docs/technical/pipwerk-replay.md` Zeile 740: die Aussage, dass der Knopf „Dateien wählen …“ jetzt „Dateien hochladen …“ heißt (gewollt);
- `docs/user/pipwerk-replay.md` Zeile 289 und `de.json` Zeile 45: „Dateien wählen“ als Verb im Satz über das Importverzeichnis, kein Knopfname.

## Nicht geprüft

Alles, was nur im Browser zu belegen ist (Anzeige, Tastaturbedienung, Fenstergrößen, Fälle des Umfangs 5): wegen B1 offen, wie in Durchlauf 1.
