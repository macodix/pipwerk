# Testbericht Auftrag 20, Durchlauf 3 (zweite Nachprüfung)

- Vorhaben `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- Geprüfter Commit: `f3bfcf548676ae7cc0a10c9612eb2600ac0bfbf0` (Zweig `strategiedesign/wp02-20`). `git rev-parse HEAD` im Arbeitsverzeichnis bestätigt ihn.
- Übergabedokument: `strategiedesign/wp02:development/strategiedesign/wp02/tests/20-3-order.md`
- Umfang: nur N1 aus Durchlauf 2. B1 bis B3 sind in Durchlauf 2 als behoben festgestellt und wurden nicht erneut geprüft.

## Erwartetes Verhalten

Der Browsertest `e2e/testcases.spec.ts` „str-01 Scalping Punkt 2 Ausbruch is built by operating the interface and equals the test case“ besteht in Chromium reproduzierbar. Er war in Durchlauf 2 einmal mit `locator.check: Clicking the checkbox did not change its state` (`e2e/builder.ts`, `refreshValue`) fehlgeschlagen. Das Prüfskript besteht vollständig, Playwright in Chromium, Firefox und WebKit.

## Dateimodus

`git ls-files -s` zeigt für `components/pipwerk-studio/scripts/check` und für `components/pipwerk-studio/scripts/testenv` den Modus `100755`.

## Ergebnis des Prüfskripts (N1, Schritt 2)

Aufruf: `components/pipwerk-studio/scripts/check --backend-port 18981 --frontend-port 18982`. Beide Ports sind frei und nicht in der Ausschlussliste. Ausgabe: `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp02/ft20-3-check.log`. Während des Laufs lief kein weiterer Prüflauf von mir. Das Skript endete mit Exit-Code 0 und der Zeile `check: all checks passed`.

| Schritt | Ergebnis |
|---|---|
| Bibliothek: sync, pytest, ruff, ruff format, mypy, Schemas v2 und v1 | bestanden (1795 Tests gesammelt) |
| Backend: sync, pytest, ruff, ruff format, mypy | bestanden (1044 Tests) |
| Suche nach der Schreibweise des Namens | bestanden (500 Nennungen) |
| Frontend: `npm ci`, typecheck, Vitest, build | bestanden (Vitest: 55 Dateien, 693 Tests) |
| Playwright | `426 passed (18.4m)`, keine Wiederholung und kein Fehler |

Der N1-Test bestand in diesem Lauf in allen drei Browsern:

- Chromium: Test 128, 45,4 s
- Firefox: Test 270, 1,2 min
- WebKit: Test 412, 1,1 min

## N1, Schritt 1: fünf Einzelläufe in Chromium

Nicht ausgeführt. Der Test braucht die Umgebungsvariablen `PIPWERK_STUDIO_E2E_BACKEND_PORT` und `PIPWERK_STUDIO_E2E_FRONTEND_PORT`. `playwright.config.ts` wirft sonst einen Fehler (`requiredPort`). Der Auftrag und mein Verfahren verbieten Umgebungsvariablen in Befehlen. Mein Hilfsskript, das sie setzt, durfte ich nicht starten: Die Umgebung hat den Bash-Aufruf verweigert. Es gibt also keine Ergebnisse je Lauf für `--repeat-each 5`.

## N1, Schritt 3: Ursache

Ein Fehler trat nicht wieder auf. Ursache, Zeile und Vergleich mit dem Vorgänger `afe466008c6357fcf7a5ab02b3b6a442f8958063` oder `main` sind nicht untersucht. Ich habe keinen Beleg, ob der Fehler aus Durchlauf 2 am Test (Wettlauf beim Klick auf „Aktualisieren“) oder am Code lag.

## Befunde

- N1 (offen, nicht widerlegt): Der Fehler aus Durchlauf 2 trat in einem vollständigen Lauf nicht auf. Er war in Durchlauf 1 ebenfalls nicht aufgetreten. Das spricht für einen unregelmäßigen Fehler, beweist es aber nicht. Der Auftrag nennt fünf Einzelläufe als Nachweis. Diese fehlen, siehe Schritt 1. Der Entwicklungsleiter entscheidet, ob sie nachgeholt werden müssen, oder ob drei bestandene Läufe (Durchlauf 1 und 3 vollständig, dazu einmal in Chromium unter Last) genügen.
- Der Commit selbst hat keinen Befund. Alle automatischen Prüfungen bestehen.

## Ergebnis

bestanden, mit Einschränkung: Das Prüfskript besteht vollständig, der Dateimodus stimmt. Die fünf Einzelläufe von N1 fehlen, weil ich sie ohne Umgebungsvariablen nicht starten konnte.
