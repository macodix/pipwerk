# Prüfauftrag Auftrag 02, Durchlauf 2

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `6d656ae38c07b171bc10af61d1e740000f26bebb` auf Zweig `strategiedesign/wp02-02`, Elterncommit `b9cc906c6981a927961ca9bd08cbd51f01249529`
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/02.md`, Abschnitt „Korrektur nach Durchlauf 1 der Tester“ (Punkte 4 bis 7)
- vorheriger Durchlauf: `development/strategiedesign/wp02/tests/02-functiontest-1.md` (nicht bestanden, B1) und `02-securitytest-1.md` (bestanden)
- Prüfgrundlagen: wie in `02-1-order.md`
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`. Dies ist eine Nachprüfung: Sind die Befunde erledigt, und enthalten die geänderten Stellen neue Fehler? Nur blockierende Befunde verhindern das Bestehen.

## Angaben des Entwicklers

- Punkt 4: `e2e/workflows.spec.ts` legt das Zielverzeichnis neben `objects` im Verzeichnis des Laufs an; `afterEach` stellt zuerst das Objektverzeichnis wieder her, dann wird das Zielverzeichnis entfernt; neue Hilfe `restoreObjectDirectory` in `e2e/support.ts`, auch in `useCleanRun` verwendet; Abschnitt 6.3 der technischen Dokumentation angeglichen.
- Punkt 5: Abschnitt 6.3 nennt den internen Endpunkt `PUT /api/studio/settings/object-directory`.
- Punkt 6: Eintrag „Datentyp“ im Glossar der Anwenderdokumentation nennt „Objekt“.
- Vitest 784 Tests; Prüfskript „all checks passed“, Browsertests 123 bestanden und 6 übersprungen.

## Tester Funktion

Führe das Prüfskript ohne `--with-audit` auf freien Ports aus (nicht 5174 und 8001) und belege den Exitcode. Prüfe B1 und die Punkte 4 bis 6. Änderungen am Prüfskript im Zweig `strategiedesign/wp02-functiontest`, aufgesetzt auf dem geprüften Commit; nenne den Commit des Prüfskripts.

Ablage: `02-functiontest-2.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis

## Tester Sicherheit

Prüfe die geänderten Stellen auf neue Fehler: Browsertests schreiben nur in ihr temporäres Verzeichnis, Wiederherstellen des Objektverzeichnisses vor dem Entfernen des Zielverzeichnisses, keine festen Ports, Pfade, Rechnernamen, Abhängigkeiten unverändert.

Ablage: `02-securitytest-2.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
