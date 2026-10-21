# Testbericht Tester Funktion: Auftrag 05, Durchlauf 1

- Ergebnis: **bestanden**
- geprüfter Commit: `fa95dd6e9b92aafeecd3b3dca6b2a15443e2eee1` (Zweig `strategiedesign/wp02-05`, auf GitHub vorhanden; Auscheckung mit `git rev-parse HEAD` kontrolliert)
- Commit des Prüfskripts: keiner. Das Prüfskript blieb unverändert, es gibt keinen Zweig `strategiedesign/wp02-functiontest`.
- Übergabedokument: `development/strategiedesign/wp02/tests/05-1-order.md`

## Prüfskript

`components/pipwerk-studio/scripts/check --backend-port 18761 --frontend-port 18762` endete mit **Exitcode 0** („all checks passed“). Alle Einzelschritte bestanden:

- Bibliothek: pytest 1445, ruff check, ruff format, mypy, Schemas gleich `contracts/strategies/v2` und `v1`
- Backend: pytest 937, ruff check, ruff format, mypy
- Suche nach der Schreibweise des Namens: 455 Erwähnungen richtig
- Oberfläche: `npm ci`, Typprüfung, Vitest 403 Tests in 31 Dateien, Bau
- Browsertests gegen das echte Backend: 150 von 150 in Chromium, Firefox und WebKit (3,5 Minuten)

Das stimmt mit den Angaben des Entwicklers überein.

## Abnahmekriterien des Auftrags

1. `npm ci`, Typprüfung und Vitest mit Exitcode 0: erfüllt. ESLint und Prettier sind nicht vorgeschrieben und nicht eingerichtet; `package.json` enthält keine Reste.
2. Browsertests in drei Browsern gegen das Backend des Zweigs: erfüllt (150 von 150).
3. Keine Kennung eines Element- oder Objekttyps im Code der Oberfläche außer in Testdaten: erfüllt. `src/sourceRules.test.ts` prüft das, auch für die Kennung einer Vorlage. Eine Stichsuche nach Typkennungen in Anführungszeichen außerhalb von `testing/` fand nur Befundkennungen in `findingText.ts`, keine Typen.
4. Prüfskript auf freien Ports mit Exitcode 0: erfüllt (siehe oben).
5. Kein fester Pfad, Port oder Rechnername im Code: erfüllt. Eine Suche in `src/` fand sie nur in `sourceRules.test.ts`, das sie verbietet. `sourceRules.test.ts` prüft die Quellen dagegen.
6. Dokumentation stimmt mit dem Code überein und enthält keine Pfade des Entwicklungsrechners: erfüllt. `docs/technical/pipwerk-studio.md` beschreibt Quellen, Anordnung, Zustand, Tests und beide Betriebsarten der Browsertests (Abschnitte 2.3, 6.2, 6.3). Die Spec-Dateien in `e2e/` stimmen mit der Liste in Abschnitt 6.3 überein. Treffer für `/home/` in `docs/user/pipwerk-studio.md` (Glossar, Zeile 410) sind ein ausdrücklich erfundenes Beispiel; `macodix` ist nur die öffentliche Adresse des Repositorys. Die Anwenderdokumentation trägt den Vermerk, dass die Beschreibung der neuen Oberfläche folgt (Zeile 13).
7. Commit auf `strategiedesign/wp02-05`, auf GitHub übertragen: erfüllt. Bildschirmbilder: sechs Dateien `ema-trendfolge-<Breite>x<Höhe>.png` für 390×844, 844×390, 820×1180, 1180×820, 1366×768 und 1920×1080 liegen in `work/strategiedesign/wp02/reports/05-screenshots/`. Laut Entwickler stammen sie aus dem Stub-Betrieb. Ich habe die Bilder nicht auf ihren Inhalt geprüft. Die Fenstergrößen sind durch die Browsertests `layout.spec.ts` und `open.spec.ts` am echten Backend geprüft.

## Umfang (Punkte 1 bis 11)

Die Browsertests decken die Punkte aus Umfang 10 gegen das echte Backend ab: sechs Fenstergrößen, Menü und Dialoge in 390×844 und 844×390, Öffnen der „EMA-Trendfolge“ mit Namen nach 3.7 und ohne Überdeckung, keine Sprünge der Ansicht, Datenverbindung mit Ziehen und mit Klick, Objektverzeichnis, Löschen, Rückfragen bei ungespeicherten Änderungen und Element mit unbekanntem Typ. Die Vitest-Tests decken Aufbau aus Typbeschreibungen, Ableitung des Dokuments, Anordnung, Befundtexte, Sprachwechsel und Vollständigkeit der Übersetzungen ab (`locales.test.ts`). Die Dateien der alten Oberfläche und ihre Tests sind entfernt. Das Prüfskript nennt keine Dateien der alten Oberfläche mehr.

## Befunde

Keine blockierenden Befunde.

Nicht blockierende Hinweise:

- Ich habe die Oberfläche nicht optisch geprüft. Die Prüfung der Bildschirmbilder und der Bedienung ist Sache der QA.
- `docs/user/pipwerk-studio.md` wird von Auftrag 06 neu geschrieben. Ihren Zustand habe ich nur auf den geforderten Vermerk geprüft.
