# Prüfauftrag Auftrag 03, Durchlauf 6

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `b7c86bcf51c192ccc7ad093c5229a0077e51dc12` auf Zweig `strategiedesign/wp02-03`, Elterncommit `811370d78275a6a2203fdf57b31a20b25b1c4ec2`
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/03.md`, besonders „Nachtrag nach Durchlauf 5 der Tester“ (Punkte 19 bis 22)
- vorheriger Durchlauf: `development/strategiedesign/wp02/tests/03-functiontest-5.md` (nicht bestanden, B1, H1) und `03-securitytest-5.md` (bestanden)
- Prüfgrundlagen: wie in `03-1-order.md`
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`. Dies ist eine Nachprüfung: Sind die Befunde erledigt, und enthalten die geänderten Stellen neue Fehler? Nur blockierende Befunde verhindern das Bestehen.

## Angaben des Entwicklers

- Nur Dokumentation und ein Docstring: `docs/technical/pipwerk-studio.md` Abschnitt 2.9 (Sätze zu `replace`, `create`, Verknüpfungen bei nicht lesbaren Dateien) und Abschnitt 2.8 (Satz zum Speichern nach Wechsel des Objektverzeichnisses); Docstring von `_write_file` in `object_store.py`. Abgleich aller Aussagen der Abschnitte 2.8, 2.9 und 5.2 mit dem Code.
- Bibliothek 1013, Backend 742 Tests bestanden; Prüfskript „all checks passed“.

## Tester Funktion

Führe das Prüfskript ohne `--with-audit` auf freien Ports aus (nicht 5174 und 8001) und belege den Exitcode. Prüfe die Punkte 19 bis 21: Die geänderten Sätze stimmen mit `object_service.py` und `object_store.py` überein. Änderungen am Prüfskript im Zweig `strategiedesign/wp02-functiontest`; nenne den Commit des Prüfskripts.

Ablage: `03-functiontest-6.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis

## Tester Sicherheit

Prüfe, dass sich nur Dokumentation und ein Docstring geändert haben, dass sie keine Pfade oder Systemdetails nennen und dass Verhalten und Protokoll unverändert sind.

Ablage: `03-securitytest-6.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
