# Prüfbericht Dokumente des Auftraggebers, Durchlauf 11

- Vorhaben: `backtest`, Phase 1 Anforderung (Rückkopplung), Rolle QA
- Geprüfter Commit: `aa8617c41cf5a4d60b7c6af70962fe3a6425059b` (`main`)
- Gegenstand: geänderte Stellen in `docs/design/requirements/anforderungen-strategietester.md` (req-test-009, offener Punkt 2, Status, Änderungsnachweis)
- Ergebnis: **bestanden**

## Blockierende Befunde

Keine.

## Geprüft

- Bezug auf req-system-016 stimmt: Einstellungen, die über die Oberfläche änderbar sind, liegen im Speicher der Komponente (anforderungen-gesamtsystem.md, req-system-016).
- Bezug auf req-system-028 stimmt: Wahl beim Import, ob Dateien behalten werden, Ablageverzeichnis (anforderungen-gesamtsystem.md, req-system-028). „Ablageverzeichnis“ ist im Glossar definiert.
- Der Verweis auf req-ui-009 im Strategiedesigner trifft zu (Einstellungsbereich, „Weitere Einstellungen kommen dort hinzu“ gleichlautend).
- Der offene Punkt ist in req-test-009 („Offen: …“) und in Abschnitt 5, Punkt 2, gekennzeichnet und stimmt überein. Er ist laut Prüfauftrag nicht Gegenstand.
- Änderungsnachweis und Datum „zuletzt aktualisiert“ sind nachgeführt, die Festlegung ist als Entscheidung des Auftraggebers belegt.
- Kein Widerspruch zu den nicht geänderten Stellen, zum Fachmodell und zu den Testfällen laut `scope.md` gefunden. Umsetzungsdetails enthält die Anforderung nicht.

## Hinweise (nicht blockierend)

1. `anforderungen-strategietester.md`, req-test-009: „Export“ und „Exportverzeichnis“ kommen sonst in keinem Anforderungsdokument und nicht im Glossar vor (Suche in `docs/design/requirements/` und `docs/technical/glossar.md`). Welcher Export gemeint ist, ergibt sich aus den Anforderungen nicht. Zuordnung: Sache der Spezifikation beziehungsweise offener Punkt, sobald ein Export festgelegt wird. Kein Betrieb und keine Sicherheit beeinträchtigt.
2. `anforderungen-strategietester.md`, req-test-009: „Importverzeichnis“ ist weder in req-system-026/-028 noch im Glossar als Begriff geführt. Zuordnung: Sache der Spezifikation; der Begriff ist als Beispiel („zum Beispiel“) gekennzeichnet.
