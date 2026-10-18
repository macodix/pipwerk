# Prüfauftrag Auftrag 03, Durchlauf 3

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `f0345bb3370d9c9cba8fd8ca27e133ce5ddf50ab` auf Zweig `strategiedesign/wp02-03`, Elterncommit `13f1b4ac7b7039ef3c404ac02d0e74cd6516d3ab`
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/03.md`, besonders „Nachtrag nach Durchlauf 2 der Tester“ (Punkte 10 bis 12)
- vorheriger Durchlauf: `development/strategiedesign/wp02/tests/03-functiontest-2.md` (nicht bestanden, B1, B2, H1) und `03-securitytest-2.md` (bestanden, H3, H4)
- Prüfgrundlagen: wie in `03-1-order.md`
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`. Dies ist eine Nachprüfung: Sind die Befunde erledigt, und enthalten die geänderten Stellen neue Fehler? Nur blockierende Befunde verhindern das Bestehen.

## Angaben des Entwicklers

- `ObjectStore.has_entry` (`os.path.lexists`) ersetzt `is_link`; `ObjectService.replace` prüft: nicht lesbare Datei der Art des Pfades `409`; Verknüpfung oder Verzeichnis unter der Art des Pfades `409` (`ObjectNameTakenError`); jeder Eintrag unter einer anderen Art `409` (`ObjectKindConflictError`), beim Anlegen und Ersetzen; sonst `201`/`200`. Feste Texte und `openapi.json` angepasst.
- Tests in `tests/test_web_api_unreadable.py` für jede Zeile beim Anlegen und Ersetzen, mit Abbild des Verzeichnisses vorher und nachher.
- Dokumentation `docs/technical/pipwerk-studio.md` Abschnitte 2.8 und 5.2.
- Bibliothek 1013, Backend 726 Tests bestanden; Prüfskript „all checks passed“, Exitcode nicht gesondert belegt.

## Tester Funktion

Führe das Prüfskript ohne `--with-audit` auf freien Ports aus (nicht 5174 und 8001) und belege den Exitcode. Prüfe Punkt 10 gegen den Nachtrag (jede Zeile beim Anlegen und Ersetzen) und Punkt 11 (Dokumentation gleich dem Code). Änderungen am Prüfskript im Zweig `strategiedesign/wp02-functiontest`; nenne den Commit des Prüfskripts.

Ablage: `03-functiontest-3.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis

## Tester Sicherheit

Prüfe die geänderte Behandlung belegter Namen bei `PUT` (nichts geschrieben, Verknüpfungen nie verfolgt, Verknüpfung und Ziel unverändert, keine Pfade in Antwort und Protokoll) und dass B1 aus Durchlauf 1 erledigt bleibt.

Ablage: `03-securitytest-3.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
