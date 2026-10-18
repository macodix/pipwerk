# Prüfauftrag Auftrag 03, Durchlauf 1

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `cfa7107f0fc4a1fecc7bccce51327aedce3225e3` auf Zweig `strategiedesign/wp02-03`, aufgesetzt auf `fba6663d333b24672f9684e1c91ac8c92999e989`
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/03.md`
- Prüfgrundlagen: der Auftrag; `development/strategiedesign/specification.md` und `development/strategiedesign/plan.md` auf `origin/main` in der Fassung vom 2026-10-18 (Abschnitte 3.1, 3.3, 3.6, 4.1, 4.2, 7, 8; Plan `wp02`); `docs/technical/development-test-security-rules.md`, `docs/technical/pipwerk-domain.md`, `docs/technical/pipwerk-studio.md`
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`. Dieser Durchlauf ist der erste und vollständig. Nur blockierende Befunde verhindern das Bestehen, alles andere steht als Hinweis im Bericht.

## Angaben des Entwicklers

- Typbeschreibung: `OutputDescription.holds_management`, `TypeDescription.named`, `TypeDescription.strategy_parameters`; Zeiteinheiten (21, M1 bis MN1) in `choices`, vom Register bei jeder Abfrage eingesetzt; Typ mit zwei Ausgängen mit der Verwaltung wird nicht angemeldet. Tests in `packages/domain-core/tests/test_type_fields.py`.
- Konsistenzprüfung: `strategy.no_trigger` entfernt, `candle.no_instance` neu nach Punkt 1a, `flow.no_order_reachable` nicht für eine Strategie ohne Elemente. Tests in `test_consistency_flow.py`, angepasst `test_testcases.py`, `test_documentation.py`. Das Beispiel `str-03-ohne-ausloeser` der Anwenderdokumentation meldet jetzt zusätzlich `candle.no_instance`.
- `PUT`: `201` beim Anlegen, `200` beim Ersetzen, `409` bei gleicher Kennung anderer Art (`ObjectKindConflictError`). Eine symbolische Verknüpfung unter dem Dateinamen wird nicht ersetzt, Antwort `500` (vorher `404`); beschrieben in der technischen Dokumentation.
- `openapi.json` neu erzeugt. `components/pipwerk-studio/frontend/src/testing/element-types.json` neu angelegt (auf dem Ausgangscommit nicht vorhanden; sie entsteht auch im Zweig `strategiedesign/wp02-01`), Abgleich durch `components/pipwerk-studio/backend/tests/test_frontend_type_copy.py`.
- Bibliothek 1013 Tests, Backend 693 Tests bestanden; Prüfskript auf freien Ports Exitcode 0.

## Tester Funktion

Führe das Prüfskript `components/pipwerk-studio/scripts/check` ohne `--with-audit` auf freien Ports aus, nicht 5174 und 8001. Prüfe erwartetes Verhalten, Grenzfälle und Fehlerfälle gegen den Auftrag, insbesondere Punkt 1a gegen Spezifikation 3.6 (alle Fälle von `candle.no_instance`, leere Strategie ohne Befund, `flow.no_order_reachable`), die Felder der Typbeschreibung und ihre Standardwerte für Typen über den Einstiegspunkt, `PUT` auf fehlende und vorhandene Datei und den Ablauf „anlegen, Objektverzeichnis ohne Verschieben ändern, speichern“, und den Abgleich der Testkopie. Bewerte, ob die Antwort `500` bei einer symbolischen Verknüpfung dem Auftrag und den Regeln entspricht. Prüfe Programmierregeln und die technische Dokumentation auf Vollständigkeit und Übereinstimmung mit dem Code. Änderungen am Prüfskript machst du im Zweig `strategiedesign/wp02-functiontest`, aufgesetzt auf dem geprüften Commit. Nenne den Commit des Prüfskripts.

Ablage: `03-functiontest-1.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis

## Tester Sicherheit

Prüfe den Commit nach BSI-Grundschutz, OWASP und den Sicherheitsregeln: Dateizugriff bei `PUT` auf eine fehlende Datei (Dateiname nur aus geprüfter UUID und fester Art, Anlegen des Verzeichnisses, Schreiben über temporäre Datei, kein Überschreiben über symbolische Verknüpfungen, keine Ausnahmetexte oder Pfade in Antworten und Protokoll, auch bei `500`), Protokoll des Registers ohne Ausnahmetext und Pfad, Begrenzungen gegen Überlast unverändert, keine festen Ports, Pfade, Rechnernamen oder Zugangsdaten, Abhängigkeiten unverändert.

Ablage: `03-securitytest-1.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
