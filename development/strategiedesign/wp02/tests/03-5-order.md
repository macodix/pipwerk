# Prüfauftrag Auftrag 03, Durchlauf 5

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `811370d78275a6a2203fdf57b31a20b25b1c4ec2` auf Zweig `strategiedesign/wp02-03`, Elterncommit `9c97cc925897ef358dc74668ec68bcf970cf1389`
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/03.md`, besonders „Nachtrag nach Durchlauf 4 der Tester“ (Punkte 17 und 18)
- vorheriger Durchlauf: `development/strategiedesign/wp02/tests/03-functiontest-4.md` (nicht bestanden, B1, H1) und `03-securitytest-4.md` (bestanden, H7)
- Prüfgrundlagen: wie in `03-1-order.md`
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`. Dies ist eine Nachprüfung: Sind die Befunde erledigt, und enthalten die geänderten Stellen neue Fehler? Nur blockierende Befunde verhindern das Bestehen.

## Angaben des Entwicklers

- Nur Beschreibungen geändert: Docstrings in `object_service.py` (`ObjectKindConflictError`, Kommentar in `replace`) und `object_store.py` (`has_entry`); Beschreibungen von `PUT` und der Antwort `409` in `web_api.py`, daraus `openapi.json` neu erzeugt; `docs/technical/pipwerk-studio.md` Abschnitt 6 (Beschreibung von `test_web_api_unreadable.py` und `test_web_api_objects.py`); `docs/user/pipwerk-studio.md`, Absatz zu `PUT`.
- Bibliothek 1013, Backend 742 Tests bestanden; Prüfskript „all checks passed“.

## Tester Funktion

Führe das Prüfskript ohne `--with-audit` auf freien Ports aus (nicht 5174 und 8001) und belege den Exitcode. Prüfe Punkt 17 (alle Beschreibungen der Regel aus Punkt 10 und ihrer Tests allgemein und vollständig, gleich dem Code) und Punkt 18. Änderungen am Prüfskript im Zweig `strategiedesign/wp02-functiontest`; nenne den Commit des Prüfskripts.

Ablage: `03-functiontest-5.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis

## Tester Sicherheit

Prüfe, dass sich nur Beschreibungen geändert haben, dass sie keine Pfade oder Systemdetails nennen und dass Verhalten und Protokoll unverändert sind.

Ablage: `03-securitytest-5.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
