# Prüfauftrag Auftrag 03, Durchlauf 4

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `9c97cc925897ef358dc74668ec68bcf970cf1389` auf Zweig `strategiedesign/wp02-03`, Elterncommit `f0345bb3370d9c9cba8fd8ca27e133ce5ddf50ab`
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/03.md`, besonders „Nachtrag nach Durchlauf 3 der Tester“ (Punkte 13 bis 16)
- vorheriger Durchlauf: `development/strategiedesign/wp02/tests/03-functiontest-3.md` (nicht bestanden, B1, H1, H2) und `03-securitytest-3.md` (bestanden, H5, H6)
- Prüfgrundlagen: wie in `03-1-order.md`
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`. Dies ist eine Nachprüfung: Sind die Befunde erledigt, und enthalten die geänderten Stellen neue Fehler? Nur blockierende Befunde verhindern das Bestehen.

## Angaben des Entwicklers

- Test `test_any_entry_of_another_kind_blocks_creating_and_replacing` mit Eintrag `valid file`, für `indicator`, `ruleset`, `strategy`, `trend`, beim Anlegen und Ersetzen.
- Feste Texte `OBJECT_KIND_CONFLICT_TEXT` und `OBJECT_NAME_TAKEN_TEXT` allgemein mit Beispielen; Dokumentation Abschnitt 5.2; Docstrings in `object_service.py`. Verhalten des Codes unverändert.
- Backend 742 Tests bestanden; Prüfskript „all checks passed“, Exitcode 0.

## Tester Funktion

Führe das Prüfskript ohne `--with-audit` auf freien Ports aus (nicht 5174 und 8001) und belege den Exitcode. Prüfe die Punkte 13 bis 15. Änderungen am Prüfskript im Zweig `strategiedesign/wp02-functiontest`; nenne den Commit des Prüfskripts.

Ablage: `03-functiontest-4.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis

## Tester Sicherheit

Prüfe die geänderten festen Texte (keine Pfade oder Systemdetails) und die Tests nach Punkt 13; bestätige, dass das Verhalten bei belegten Namen und das Protokoll bei `500` unverändert sind.

Ablage: `03-securitytest-4.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
