# Prüfauftrag Auftrag 04, Durchlauf 1

- Vorhaben: `strategiedesign`, Arbeitspaket `wp01`, ref `strategiedesign/wp01`
- zu prüfender Commit: `6fee975f6f01ecfecbca44154864e157f20bcfd2` auf Zweig `strategiedesign/wp01-04`, aufgesetzt auf `761979bf3e9813d9444bdc7d4c0fe572f38405fa` (Arbeitszweig mit den zusammengeführten Aufträgen 01 bis 03 und dem Prüfskript)
- Auftrag: `strategiedesign/wp01:development/strategiedesign/wp01/orders/04.md`
- Prüfgrundlagen: der Auftrag mit den darin genannten Grundlagen, Prüfbericht der QA `strategiedesign/wp01:development/strategiedesign/wp01/reviews/1.md` (Hinweise H1, H2, H3, H5, H6, H7), `development/strategiedesign/plan.md` (`wp01`, Abnahmekriterien 5 und 7), `docs/technical/development-test-security-rules.md`
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: erster Durchlauf vollständig, nur blockierende Befunde verhindern das Bestehen, alles andere als Hinweis.

## Angaben des Entwicklers

- Keine Änderung am Programmcode. Geändert: Dokumentation, Tests, Beispieldateien, `contracts/strategies/README.md`.
- Neun Beispieldateien unter `contracts/strategies/v1/examples/`: Vorlage `Regel` für `POST` und geänderte Fassung für `PUT`, sieben Abwandlungen von `str-03` für Abnahmekriterium 5. Anwenderdokumentation „Web-API ausprobieren“ mit Schritten für Kriterium 7 (Instanzblock inline) und Tabelle für Kriterium 5.
- Neue Tests `components/pipwerk-studio/backend/tests/test_user_documentation_examples.py` (30 Tests); `packages/domain-core/tests/test_schemas.py` erlaubt das Verzeichnis `examples` und prüft jedes Beispiel gegen sein Schema.
- Backend 677 Tests, Bibliothek 985 Tests, alle Prüfungen bestanden.
- Eigene Entscheidungen: Beispiele als Dateien statt vollständig in der Anwenderdokumentation; Abwandlung „Order in einem Indikator“ hängt ein neues Element vom Typ `Indikator` an; neue Einträge im Glossar der Anwenderdokumentation; weitere veraltete Verweise auf `WO-2026-10-04-001` in den Abschnitten 8 und 9 umformuliert.

## Tester Funktion

Setze den Zweig `strategiedesign/wp01-functiontest` auf den geprüften Commit neu auf, soweit er Änderungen enthält, die noch nicht im Ausgangscommit liegen (das Prüfskript ist mit `2ec5418da46e03ea8dbbfca9e50230440856db9f` in den Arbeitszweig zusammengeführt). Führe das Prüfskript mit `--with-audit` auf freien Ports aus, nicht 5174 und 8001 (dort läuft die Testumgebung des Pakets; fasse sie nicht an). Prüfe insbesondere, ob ein Auftraggeber mit der Anwenderdokumentation und den Beispieldateien die Abnahmekriterien 5 und 7 Schritt für Schritt ausführen kann und die beschriebenen Ergebnisse erhält, und ob die Hinweise H2, H3, H5, H6, H7 der QA erledigt sind. Nenne den Commit des Prüfskripts.

Ablage: `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp01/reports/04-functiontest-1.md`

## Tester Sicherheit

Prüfe die geänderten Dateien, insbesondere die Beispieldokumente und die Anwenderdokumentation (keine Zugangsdaten, Pfade oder Namen des Entwicklungsrechners, keine Empfehlung unsicherer Bedienung), und dass sich am Code nichts geändert hat.

Ablage: `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp01/reports/04-securitytest-1.md`
