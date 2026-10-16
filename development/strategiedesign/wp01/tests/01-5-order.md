# Prüfauftrag Auftrag 01, Durchlauf 5 (Nachprüfung)

- Vorhaben: `strategiedesign`, Arbeitspaket `wp01`, ref `strategiedesign/wp01`
- zu prüfender Commit: `768631af0816c6dc877992a5588715ad75673ffb` auf Zweig `strategiedesign/wp01-01`
- vorher geprüfter Commit: `a601608cad75dc333b9cfb608862207fc5c1eed2`
- Auftrag: `strategiedesign/wp01:development/strategiedesign/wp01/orders/01.md`, maßgeblich der neue Abschnitt „Anpassung nach Durchlauf 4“ (Punkte 1 bis 4). Er ersetzt die Beschreibung in Punkt 1 der „Anpassung nach Durchlauf 3“, welche Befunde zu einem Ausdruck zählen, durch eine abschließende Liste.
- Berichte aus Durchlauf 4: `strategiedesign/wp01:development/strategiedesign/wp01/tests/01-functiontest-4.md` (B1), `strategiedesign/wp01:development/strategiedesign/wp01/tests/01-securitytest-4.md` (bestanden)
- Umfang der Prüfungen: Nachprüfung nach „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Befund B1 aus Durchlauf 4, die Punkte 1 bis 4 der „Anpassung nach Durchlauf 4“ und die dafür geänderten Stellen. Nur blockierende Befunde verhindern das Bestehen. Befunde, die nicht zu einer der fünf Kennungen der abschließenden Liste gehören, zählen nicht zur Grenze je Ausdruck und sind dazu kein Befund.

## Anpassung des Auftrags

Die Zahl der blockierenden Befunde ist von Durchlauf 3 auf 4 nicht gesunken. Der Auftraggeber hat einen weiteren Durchlauf mit der abschließenden Liste angenommen (`development/strategiedesign/questions/wp01-01.md` auf `main`): Zur Grenze von 50 Befunden je Ausdruck zählen genau `expression.invalid`, `rule.unresolved_name`, `expression.order_outside_management`, `rule.result_mismatch` und `rule.order_in_indicator`. `calculation.circular_reference` und `candle.no_instance` zählen nicht (Hinweis H1 aus Durchlauf 4).

## Korrekturen laut Entwickler

- `engine.py`: Beide Stellen, die `rule.order_in_indicator` erzeugen, laufen über `Checker._expression_finding`; bei einer Regel Feld `expression`, beim Regelwerk Feld `result_expression`.
- `test_hardening_3.py`: vier neue Tests (Regel und Regelwerk in einer Vorlage `Indikator` mit 60 Befunden plus `rule.order_in_indicator`, Gegenprobe je 49 plus 1).
- `docs/technical/pipwerk-domain.md` Abschnitt 11: abschließende Liste, Zuordnung, nicht zählende Befunde.
- 958 Tests und alle Prüfungen in `packages/domain-core` bestanden.

## Tester Funktion

Setze den Zweig `strategiedesign/wp01-functiontest` (zuletzt `57a914594be159a0e0f2e5be294a25c149dc2f51`) auf den geprüften Commit neu auf, führe das Prüfskript mit `--with-audit` aus und nenne den Commit des Prüfskripts.

Ablage: `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp01/reports/01-functiontest-5.md`

## Tester Sicherheit

Ablage: `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp01/reports/01-securitytest-5.md`
