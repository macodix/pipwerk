# Prüfauftrag Auftrag 01, Durchlauf 3

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `0210df5d7fed3b1aa2ae46e68713af2923af4198` auf Zweig `strategiedesign/wp02-01`, Elterncommit `a9aa37fc67852ba842b5039ef344208808e7c9c2`
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/01.md`, besonders „Nachtrag nach Durchlauf 2 der Tester“ (Punkte 27 bis 30)
- vorheriger Durchlauf: `development/strategiedesign/wp02/tests/01-functiontest-2.md` (nicht bestanden, N1, N2 bis N4) und `01-securitytest-2.md` (nicht bestanden, B1, H1 bis H3)
- Prüfgrundlagen: wie in `01-2-order.md`
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`. Dies ist eine Nachprüfung: Sind die Befunde erledigt, und enthalten die geänderten Stellen neue Fehler? Nur blockierende Befunde verhindern das Bestehen. N3 ist nicht Teil dieses Auftrags; der Arbeitszweig enthält inzwischen die Anforderungen in der Fassung vom 2026-10-18 (Merge-Commit `50d6629236ee8d5bae1a18d183a60520e9cc822d` auf `strategiedesign/wp02`).

## Angaben des Entwicklers

- Punkt 27: `definitionSpecs` und `instanceParameterSpecs` nehmen die Zeiteinheiten aus den Typbeschreibungen, wenn die Definition keine `choices` hat; Tests in `specs.test.ts` und `Studio.properties.test.tsx`; Dokumentation Abschnitt 2.3.
- Punkt 28: `datatypeLabel` in `expression/scope.ts` an vier Stellen; Tests in `scope.test.ts`.
- Punkt 29: `instanceFromTemplate` mit `hasOwn`/`setOwn`; zusätzlich Rahmenmaße in `canvas/layout.ts`, `canvas/flowModel.ts`, `state/editorState.ts` mit `getOwn`/`setOwn`; Test in `build.test.ts`; Liste der geprüften Stellen im Ergebnis des Entwicklers: umgestellt `build.ts`, `layout.ts`, `flowModel.ts`, `editorState.ts`; als unbedenklich geprüft `buildRevision.ts`, `revisionApi.ts`, `repository.ts`, `ids.ts`, `findingText.ts`, `parse.ts` Zeile 72, `libraryModel.ts`, `useStudioController.ts`, Zugriffe mit `[language]`.
- Vitest 734, Browsertests 69 bestanden und 6 übersprungen; Prüfskript „all checks passed“.

## Tester Funktion

Führe das Prüfskript ohne `--with-audit` auf freien Ports aus (nicht 5174 und 8001) und belege den Exitcode. Prüfe die Punkte 27 bis 29 und die geänderte technische Dokumentation. Änderungen am Prüfskript im Zweig `strategiedesign/wp02-functiontest`, aufgesetzt auf dem geprüften Commit; nenne den Commit des Prüfskripts.

Ablage: `01-functiontest-3.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis

## Tester Sicherheit

Prüfe B1 aus Durchlauf 2 (Punkt 29, auch die Liste der geprüften Stellen) und die geänderten Stellen auf neue Fehler.

Ablage: `01-securitytest-3.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
