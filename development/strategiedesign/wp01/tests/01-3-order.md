# Prüfauftrag Auftrag 01, Durchlauf 3 (Nachprüfung)

- Vorhaben: `strategiedesign`, Arbeitspaket `wp01`, ref `strategiedesign/wp01`
- zu prüfender Commit: `6859b00c09e6126c5cc9f33eed3a3019408a20b4` auf Zweig `strategiedesign/wp01-01`
- vorher geprüfter Commit: `b12816c225bf8fa2fea50acca43e725126e6054b`
- Auftrag: `strategiedesign/wp01:development/strategiedesign/wp01/orders/01.md`
- Berichte aus Durchlauf 2: `strategiedesign/wp01:development/strategiedesign/wp01/tests/01-functiontest-2.md`, `strategiedesign/wp01:development/strategiedesign/wp01/tests/01-securitytest-2.md`
- Umfang der Prüfungen: Nachprüfung nach „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`. Nur blockierende Befunde verhindern das Bestehen.

## Festlegungen des Softwarearchitekten zu den Befunden

- Einstiegspunkte werden je installiertem Paket getrennt gelesen; fehlerhafte Metadaten schließen nur dieses Paket aus.
- Die Grenze von 50 Befunden je Ausdruck gilt für alle Befunde eines Ausdrucks.
- Texte mit einzelnen Ersatzzeichen werden abgelehnt. Ein Dokument als Bytes ist UTF-8 ohne BOM, sonst Ablehnung.
- Ein Name innerhalb von `PREVIOUS(…)` zählt nicht als Abhängigkeit für Kreise, bei Berechnungen, Regeln und Regelwerken.
- Die Normalisierung sammelt keine Befunde; Laufzeit und Speicher bei 2 MiB in der Größenordnung der Prüfung.

## Korrekturen laut Entwickler

Alle genannten Punkte; neuer Test `test_hardening_2.py`; Lexer und Parser beschleunigt (Tokens als `NamedTuple`, Knoten als einfache Klassen mit `eq=False`); Normalisierung als reine Umschreibung ohne Prüfung. Gemessen beim Entwickler: Normalisierung eines Dokuments von 2 MiB im ungünstigsten Fall 4,1 s, Testgrenze 5 s. 940 Tests und alle Prüfungen in `packages/domain-core` bestanden.

## Tester Funktion

Setze den Zweig `strategiedesign/wp01-functiontest` (zuletzt `3717430022cd53c4c87a76cc6ea40c7db8895776`) auf den geprüften Commit neu auf, führe das Prüfskript mit `--with-audit` aus und nenne den Commit des Prüfskripts. Beurteile auch, ob die Zeitgrenzen der Tests auf langsameren Rechnern verlässlich sind.

Ablage: `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp01/reports/01-functiontest-3.md`

## Tester Sicherheit

Ablage: `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp01/reports/01-securitytest-3.md`
