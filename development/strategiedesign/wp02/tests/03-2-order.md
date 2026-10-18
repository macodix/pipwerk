# Prüfauftrag Auftrag 03, Durchlauf 2

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `13f1b4ac7b7039ef3c404ac02d0e74cd6516d3ab` auf Zweig `strategiedesign/wp02-03`, Elterncommit `cfa7107f0fc4a1fecc7bccce51327aedce3225e3`
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/03.md`, besonders „Nachtrag nach Durchlauf 1 der Tester“ (Punkte 7 bis 9)
- vorheriger Durchlauf: `development/strategiedesign/wp02/tests/03-functiontest-1.md` (bestanden, H1, H2) und `03-securitytest-1.md` (nicht bestanden, B1, H1, H2)
- Prüfgrundlagen: wie in `03-1-order.md`
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`. Dies ist eine Nachprüfung: Sind die Befunde und die im Nachtrag aufgenommenen Hinweise erledigt, und enthalten die geänderten Stellen neue Fehler? Nur blockierende Befunde verhindern das Bestehen.

## Angaben des Entwicklers

- Punkt 7: `_log_failure` in `web_api.py` schreibt bei `500` festen Text mit Klasse der ursprünglichen Ausnahme und Fehlernummer, ohne `exc_info`. Test `test_the_log_of_a_500_has_a_fixed_text_with_the_class_and_the_error_number` in `tests/test_web_api_errors.py`.
- Punkt 8: `ObjectStore.is_link`; symbolische Verknüpfung unter dem Dateinamen derselben Art ergibt `409` (`ObjectNameTakenError`), unter dem einer anderen Art `409` (`ObjectKindConflictError`); Tests in `tests/test_web_api_unreadable.py`. `openapi.json` neu erzeugt.
- Bibliothek 1013, Backend 697 Tests bestanden; Prüfskript „all checks passed“.

## Tester Funktion

Führe das Prüfskript ohne `--with-audit` auf freien Ports aus (nicht 5174 und 8001) und prüfe den Exitcode. Prüfe die Punkte 7 und 8 gegen den Nachtrag und die geänderte technische Dokumentation. Änderungen am Prüfskript im Zweig `strategiedesign/wp02-functiontest`; nenne den Commit des Prüfskripts.

Ablage: `03-functiontest-2.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis

## Tester Sicherheit

Prüfe B1 (Protokoll bei `500` ohne Ausnahmetext, Pfad und Stapel der Aufrufe, für alle Fälle über `_guarded`) und die Behandlung symbolischer Verknüpfungen nach Punkt 8 (nichts geschrieben, Verknüpfung und Ziel unverändert, keine Pfade in Antwort und Protokoll).

Ablage: `03-securitytest-2.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
