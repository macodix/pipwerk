# Prüfbericht Dokumente des Auftraggebers, Durchlauf 9

- Vorhaben: `backtest`, Phase 1 Anforderung (Rückkopplung, beschränkt auf geänderte Stellen)
- Geprüfter Commit: `da8c2966c8fb467c474a83251b9be395db5d9fb8` (`main`)
- Prüfauftrag: `development/backtest/reviews/requirements-9-order.md`
- Geprüft: `docs/design/requirements/anforderungen-gesamtsystem.md`, req-system-028 und Eintrag im Änderungsnachweis vom 2026-10-24. Gegengelesen gegen req-system-025, -026, -027, `anforderungen-strategietester.md` (Zeile 127), `docs/technical/glossar.md` (Zeile 24).

## Ergebnis: bestanden

## Blockierende Befunde

Keine.

- Kein Widerspruch zu req-system-025 bis -027. Beim Import (req-system-026) sind Abbrechen und Dateien beliebiger Größe vorgesehen. Die neue Anforderung deckt Abbruch, Fehler und Absturz ausdrücklich ab.
- Kopien: Der Strategietester speichert auf Verlangen eine Kopie der Strategie (`anforderungen-strategietester.md`, Zeile 127). Die Kopie der Instanz steht im Glossar. Beides hat ein Erfordernis, also kein Widerspruch zu „keine Kopien ohne Erfordernis“.
- Der Änderungsnachweis nennt Datum, Festlegung und Anlass. Er ist in der Form wie die Einträge davor.
- Die Anforderung beschreibt kein Umsetzungsverfahren. Offene Fragen sind keine vorhanden, die nicht gekennzeichnet wären.

## Hinweise

1. req-system-028, Satz 1: „ein Vielfaches des Inhalts“ nennt keine Grenze. Zuordnung: Sache der Spezifikation (laut Prüfauftrag sind Grenzen des Platzbedarfs dort zu klären).
2. req-system-028, Satz 2 „auch nach Absturz“: Zeitpunkt des Entfernens nach einem Absturz (zum Beispiel erst beim nächsten Start) ist nicht genannt. Zuordnung: Sache der Spezifikation.
3. req-system-027, Übergangslösung: Der Abruf schreibt Dateien in ein Verzeichnis, der Anwender importiert sie später. Ob diese Dateien „nur für einen Vorgang angelegt“ sind und wer sie nach dem Import entfernt, sagt req-system-028 nicht. Zuordnung: Sache der Spezifikation. Eine Entscheidung des Auftraggebers ist nicht nötig, solange der Wortlaut „Komponente entfernt selbst“ gilt.
4. „Komponente“ in req-system-028 ist im Dokument als Begriff verwendet wie in req-system-010 (gemeinsamer Speicher). Das Glossar wurde nicht geändert und führt den Begriff nicht gesondert. Kein Befund, nur zur Kenntnis.

## Fragen an den Auftraggeber

Keine.
