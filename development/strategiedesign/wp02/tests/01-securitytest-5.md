# Testbericht Tester Sicherheit – Auftrag 01, Durchlauf 5

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- Übergabedokument: `strategiedesign/wp02:development/strategiedesign/wp02/tests/01-5-order.md`
- Geprüfter Commit: `2ec7ad8ee7d53c17e225af2595ae88d54a9aa153` (Zweig `strategiedesign/wp02-01`), Elterncommit `87c0efd20307529a02ab4fed1263c688a982b76b`
- Kontrolle: `git rev-parse HEAD` im Arbeitsverzeichnis ergab `2ec7ad8ee7d53c17e225af2595ae88d54a9aa153`; `git status --short` ohne Ausgabe (Arbeitsverzeichnis sauber).
- Art der Prüfung: Nachprüfung nach „Umfang der Prüfungen“ (`docs/technical/entwicklungsverfahren.md`): geänderte Stellen auf neue Fehler; vorherige Befunde und Hinweise. Vorgabe des Übergabedokuments: Belegungen und Definitionen weiter nur über eigene Felder, keine festen Ports, Pfade, Rechnernamen, Abhängigkeiten unverändert.
- Der Bericht gilt nur für diesen Commit.

## Ergebnis: bestanden

Kein blockierender Befund. Der vorige Durchlauf (`01-securitytest-4.md`) war bestanden und hatte keinen blockierenden Befund. Die Hinweise H1 und H3 bleiben unverändert offen.

Die Entscheidung des Softwarearchitekten im „Nachtrag nach Durchlauf 4 der Tester“ (Auftrag `orders/01.md`, Zeile 108) ist abschließend. Zu ihr gibt es aus Sicht der Sicherheit keinen Streitpunkt.

## Geprüfter Umfang

Geänderte Dateien laut `git diff --name-only 87c0efd 2ec7ad8` (7 Dateien):
`Studio.properties.test.tsx`, `document/ops.ts`, `document/ops.test.ts`, `properties/RuleProperties.tsx`, `properties/StrategyProperties.tsx`, `properties/specs.test.ts` (alle unter `components/pipwerk-studio/frontend/src/`) und `docs/technical/pipwerk-studio.md`. Den vollständigen Diff habe ich gelesen.

## Prüfungen

1. **Abhängigkeiten unverändert.** Unter den geänderten Dateien ist kein `package.json`, keine `package-lock.json`, kein `pyproject.toml` und kein `uv.lock` (Liste oben). Ergebnis: erfüllt.
2. **Definitionen nur über eigene Felder.** Neu ist `withDatatype` (`document/ops.ts` Zeilen 25–38). Die Funktion legt eine Kopie mit Objekt-Spread an (`{ ...definition, ...patch, datatype }`). Der Spread legt jedes Feld als eigenes Datenfeld an und setzt keinen Prototyp; die Schlüssel von `patch` sind fest im Code (`{ value }` in `changeStrategyParameterType`, `ops.ts` Zeile 86 ff., und `{ default: null }` in `RuleProperties.tsx` Zeile 52). Das Feld `choices` wird über `removeOwn` entfernt (`document/own.ts`: löscht nur, wenn `hasOwn` zutrifft); der Schlüssel `choices` ist fest. `withDatatype` ändert die übergebene Definition nicht, sondern nur die eigene Kopie. Der neue Datentyp kommt aus dem Auswahlfeld mit der festen Liste `strategyParameterTypes` (`RuleProperties.tsx` Zeilen 96–108; `StrategyProperties.tsx` Zeilen 20–31). Ergebnis: erfüllt.
3. **Belegungen nur über eigene Felder.** Der Commit ändert keinen Zugriff auf Belegungen (`parameter_values`). `rename` in `RuleProperties.tsx` (Zeilen 58–78) verwendet weiter `hasOwn`, `getOwn`, `removeOwn` und `setOwn`; diese Stelle ist im Diff nicht geändert. `changeType` (Zeilen 45–56) ändert nur die Liste `parameters`. Ergebnis: erfüllt.
4. **Keine festen Ports, Pfade, Rechnernamen oder Zugangsdaten.** `git diff --name-only -E -G "localhost|127\.0|:[0-9]{4}|/srv|/home|/var|/tmp|password|token|secret|https?:" 87c0efd 2ec7ad8`: keine Datei. Ergebnis: erfüllt.
5. **Ausgabe nur als Text.** Im Quelltext außerhalb der Tests kein `dangerouslySetInnerHTML`, `innerHTML`, `eval(` oder `new Function` (grep über `src` ohne Testdateien: kein Treffer). Die in der Dokumentation neu genannte Angabe neben einem Funktionsvorschlag (`detail: item.description`, `expression/completions.ts` Zeile 83) wird in `expression/ExpressionInput.tsx` Zeile 145 als JSX-Kindtext ausgegeben; React maskiert sie. Diese Stellen sind im Commit nicht geändert. Ergebnis: erfüllt.
6. **Eigene Läufe im Arbeitsverzeichnis.** `npm --prefix …/components/pipwerk-studio/frontend run typecheck`: ohne Fehler. `npm --prefix …/components/pipwerk-studio/frontend test`: „Test Files 42 passed (42)“, „Tests 746 passed (746)“. Dazu gehört `src/sourceRules.test.ts` (kein `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, `Trans`; kein fester Port, Pfad oder Rechnername; keine Kennung eines Typs im Quelltext). Die neuen Tests verwenden nur erfundene Kennungen (`ZzRule`, `QQ1`, `QQ7`, `k1`, `k2`). Ergebnis: erfüllt.
7. **Technische Dokumentation.** Die Änderungen in `docs/technical/pipwerk-studio.md` (Abschnitt 2.3 und Testliste in Abschnitt 6.2) enthalten keine Zugangsdaten, Rechnernamen, Benutzernamen und keine Pfade des Entwicklungsrechners. Die genannten Dateien `state/useStudioController.ts` und `expression/completions.ts` sowie `withDatatype` und `changeStrategyParameterType` gibt es im Commit; die Beschreibung von `withDatatype` stimmt mit dem Code überein (Prüfung 2). Ergebnis: erfüllt.

## Befunde

Keine blockierenden Befunde.

## Hinweise

- **H1 – bekannte Schwachstelle in einer Entwicklungsabhängigkeit (Nachprüfung, unverändert).** Nach der Entscheidung des Softwarearchitekten kein Teil dieses Auftrags. Die Sperrdatei ist unverändert (Prüfung 1). `npm audit` habe ich nicht ausgeführt; das Übergabedokument verlangt keinen Lauf mit Audit. Der Hinweis bleibt offen.
- **H3 – Grenze der eigenen Prüfung (Nachprüfung, unverändert).** Browsertests und `e2e/start-backend.mjs` sind in diesem Commit nicht geändert. Ich habe keine Browsertests ausgeführt; belegt ist nur der Stand aus den vorherigen Durchläufen. Der Hinweis bleibt offen.
- **Beobachtung des Entwicklers (stehengebliebener Wert der Wertzeile).** Nach dem Wechsel auf Zeiteinheit bleibt eine früher gesetzte Belegung (zum Beispiel `{ kind: 'fixed', value: 'a' }`) im Dokument, bis der Anwender eine Zeiteinheit wählt (Test in `Studio.properties.test.tsx`, Zeile 69 des Diffs). Aus Sicht der Sicherheit entsteht dadurch keine neue Gefahr: Die Belegung bleibt ein eigenes Feld, der Wert ist Text und wird nur als Text angezeigt. Ob die Konsistenzprüfung den Wert meldet, bewertet nach dem Übergabedokument der Tester Funktion.
