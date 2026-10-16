# Prüfauftrag Auftrag 01, Durchlauf 6 (Nachprüfung)

- Vorhaben: `strategiedesign`, Arbeitspaket `wp01`, ref `strategiedesign/wp01`
- zu prüfender Commit: `93209f1fa05aee773bd644d238b3795955720239` auf Zweig `strategiedesign/wp01-01`
- vorher geprüfter Commit: `768631af0816c6dc877992a5588715ad75673ffb`
- Auftrag: `strategiedesign/wp01:development/strategiedesign/wp01/orders/01.md`, maßgeblich der Abschnitt „Entscheidung nach Durchlauf 5“
- Berichte aus Durchlauf 5: `strategiedesign/wp01:development/strategiedesign/wp01/tests/01-functiontest-5.md` (B1), `strategiedesign/wp01:development/strategiedesign/wp01/tests/01-securitytest-5.md` (bestanden)
- Umfang der Prüfungen: Nachprüfung nach „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Befund B1 aus `01-functiontest-5.md` und die dafür geänderte Stelle. Nur blockierende Befunde verhindern das Bestehen.

## Korrektur laut Entwickler

- `docs/technical/pipwerk-domain.md` Abschnitt 12, Zeile zu `test_hardening_3.py`: ergänzt um die Grenze von 50 Befunden je Ausdruck mit `rule.order_in_indicator` (Regel und Regelwerk in einer Vorlage `Indikator`, je mit Gegenprobe).
- Keine weitere Änderung. Der Commit ändert gegenüber `768631a` nur diese eine Zeile.
- 958 Tests in `packages/domain-core` bestanden.

## Tester Funktion

Setze den Zweig `strategiedesign/wp01-functiontest` (zuletzt `81f85d213241bdbaea0aa4e0390c84a5e3821bb2`) auf den geprüften Commit neu auf, führe das Prüfskript mit `--with-audit` aus und nenne den Commit des Prüfskripts.

Ablage: `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp01/reports/01-functiontest-6.md`

## Tester Sicherheit

Ablage: `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp01/reports/01-securitytest-6.md`
