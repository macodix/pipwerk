# Prüfauftrag Auftrag 02, Durchlauf 3 (Nachprüfung)

- Vorhaben: `strategiedesign`, Arbeitspaket `wp01`, ref `strategiedesign/wp01`
- zu prüfender Commit: `7e261d0d90645670678c2ffc77e53fd1e2a7394b` auf Zweig `strategiedesign/wp01-02`
- vorher geprüfter Commit: `cdf326f56ec585015c76385e55d51cb0cb19ffb3`
- Auftrag: `strategiedesign/wp01:development/strategiedesign/wp01/orders/02.md`
- Berichte aus Durchlauf 2: `strategiedesign/wp01:development/strategiedesign/wp01/tests/02-functiontest-2.md` (N1), `strategiedesign/wp01:development/strategiedesign/wp01/tests/02-securitytest-2.md` (S2, H8)
- Umfang der Prüfungen: Nachprüfung nach „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`. Nur blockierende Befunde verhindern das Bestehen.

## Festlegung des Softwarearchitekten zur Korrektur

Die Engine für den Betrieb verhält sich wieder wie im Commit `c663d9d5b7414db24b4678bc1a07b493f114b6cb`. Die ausdrückliche Transaktionssteuerung mit `BEGIN IMMEDIATE` und Rücknahme bei Fehler gilt nur für eine eigene Engine der Migration beim Start, die danach verworfen wird.

## Korrekturen laut Entwickler

- `storage.py` ohne `isolation_level = None` und ohne `BEGIN`; eigene Engine der Migration in `migrate.py` für SQLite-Dateien, bei Datenbank im Speicher und anderen Datenbanken die übergebene Engine.
- neuer Test `tests/test_concurrent_writes.py`: gleichzeitiges Schreiben der Sprache über Dienst und HTTP, Objektverzeichnis mit `"move": false` und Sprache, zwei gleichzeitige Starts auf neuer Datenbank, Standardverhalten der Betriebs-Engine. Nicht gegen den vorher geprüften Commit laufen gelassen.
- Dokumentation Abschnitte 2.1, 2.8 Punkt 5 (H8), 6.1, 8.
- 326 Backend-Tests bestanden; Oberfläche und Browsertest nicht erneut ausgeführt.

## Tester Funktion

Prüfskript wie in Durchlauf 1. Prüfe, ob der neue Test den Fehler aus N1 am vorher geprüften Commit nachweist.

Ablage: `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp01/reports/02-functiontest-3.md`

## Tester Sicherheit

Ablage: `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp01/reports/02-securitytest-3.md`
