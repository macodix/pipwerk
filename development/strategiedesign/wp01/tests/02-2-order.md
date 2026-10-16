# Prüfauftrag Auftrag 02, Durchlauf 2 (Nachprüfung)

- Vorhaben: `strategiedesign`, Arbeitspaket `wp01`, ref `strategiedesign/wp01`
- zu prüfender Commit: `cdf326f56ec585015c76385e55d51cb0cb19ffb3` auf Zweig `strategiedesign/wp01-02`
- vorher geprüfter Commit: `c663d9d5b7414db24b4678bc1a07b493f114b6cb`
- Auftrag: `strategiedesign/wp01:development/strategiedesign/wp01/orders/02.md`
- Berichte aus Durchlauf 1: `strategiedesign/wp01:development/strategiedesign/wp01/tests/02-functiontest-1.md`, `strategiedesign/wp01:development/strategiedesign/wp01/tests/02-securitytest-1.md`
- Umfang der Prüfungen: Nachprüfung nach „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Sind die Befunde behoben, und enthalten die dafür geänderten Stellen neue Fehler? Nur blockierende Befunde verhindern das Bestehen.

## Korrekturen laut Entwickler

- Funktion B1: Ergebnis von `pip-audit` aus den Berichten in Abschnitt 7 eingetragen (Quelle: Tester), Veröffentlichungsdaten von PyPI ermittelt, „nachzuholen“ entfernt.
- Funktion B2: `PUT` mit `"move": true` bei ungültigem gespeichertem Wert ergibt HTTP 409 mit festem Text; `"move": false` behebt den Zustand. Tests, Abschnitte 2.8 und 5.
- Sicherheit S1: SQLite-Engine beginnt jede Transaktion ausdrücklich mit `BEGIN` (gilt für alle Verbindungen der Engine), Migration in einer Transaktion mit Rücknahme, eigene Meldung `DatabaseMigrationError`, vier neue Tests, Abschnitte 2.1 und 8.
- Hinweise: Sicherheit H1 (kein Verfolgen von Verknüpfungen beim Verschieben und Zurückholen), H4 (`python -I` im Testumgebungsskript), Funktion H3 (eigener Text, wenn das Ziel nicht anlegbar ist).
- Prüfungen der Oberfläche und Browsertest hat der Entwickler nicht erneut ausgeführt.

## Tester Funktion

Prüfskript wie in Durchlauf 1 ausführen; die geänderte Transaktionssteuerung der Engine betrifft auch das Speichern der Sprache.

Ablage: `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp01/reports/02-functiontest-2.md`

## Tester Sicherheit

Ablage: `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp01/reports/02-securitytest-2.md`
