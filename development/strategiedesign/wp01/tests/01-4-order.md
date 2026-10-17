# Prüfauftrag Auftrag 01, Durchlauf 4 (Nachprüfung)

- Vorhaben: `strategiedesign`, Arbeitspaket `wp01`, ref `strategiedesign/wp01`
- zu prüfender Commit: `a601608cad75dc333b9cfb608862207fc5c1eed2` auf Zweig `strategiedesign/wp01-01`
- vorher geprüfter Commit: `6859b00c09e6126c5cc9f33eed3a3019408a20b4`
- Auftrag: `strategiedesign/wp01:development/strategiedesign/wp01/orders/01.md`, maßgeblich auch der neue Abschnitt „Anpassung nach Durchlauf 3“ (Punkte 1 bis 6)
- Berichte aus Durchlauf 3: `strategiedesign/wp01:development/strategiedesign/wp01/tests/01-functiontest-3.md` (B1), `strategiedesign/wp01:development/strategiedesign/wp01/tests/01-securitytest-3.md` (bestanden)
- Umfang der Prüfungen: Nachprüfung nach „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Befunde aus Durchlauf 3, die Punkte 1 bis 6 der Anpassung und die dafür geänderten Stellen. Nur blockierende Befunde verhindern das Bestehen.

## Anpassung des Auftrags

Die Zahl der blockierenden Befunde des Funktionstests ist von Durchlauf 2 auf 3 nicht gesunken. Der Softwarearchitekt hat deshalb den Auftrag angepasst (Abschnitt „Anpassung nach Durchlauf 3“): Grenze von 50 Befunden für jeden Befund eines Ausdrucks mit `findings.truncated` als letztem Befund (B1), Zeitgrenzen der Tests ohne `tracemalloc` und mit Reserve (H1), Test der Normalisierung mit Umschreiben (H8 Sicherheit), Dokumentation ohne „unter 5 s“ (H2, H8), Ersatzzeichenprüfung endet bei Kreisen und geteilten Teilen (H7 Sicherheit).

## Korrekturen laut Entwickler

- `engine.py`: Befunde eines Ausdrucks (`expression.invalid`, `rule.unresolved_name`, `expression.order_outside_management`, `rule.result_mismatch`, auch `reason` `unknown_property`) laufen über `Checker._expression_finding`; danach genau ein `findings.truncated` über `Checker._expression_overflow`.
- `io.py`: `_reject_lone_surrogates` mit Liste besuchter Teile, Kreis ist `DocumentError`.
- Tests: neuer `test_hardening_3.py`; `test_hardening.py` und `test_hardening_2.py` messen Zeit ohne `tracemalloc`. Grenzen und Messung beim Entwickler: Prüfung 2 MiB 0,37 s bei 10 s, Normalisierung 2 MiB `q+q+…` 1,26 s bei 15 s, Normalisierung 2 MiB mit Umschreiben 0,95 s bei 15 s, 198 Berechnungen 0,53 s bei 10 s, Vorlage mit vielen Hinweisen 0,23 s bei 10 s.
- `docs/technical/pipwerk-domain.md` Abschnitte 9.2 und 11.
- 954 Tests und alle Prüfungen in `packages/domain-core` bestanden.

## Tester Funktion

Setze den Zweig `strategiedesign/wp01-functiontest` (zuletzt `3b68ad98b6f6a64bbbde9491a565c9e3544d1e41`) auf den geprüften Commit neu auf, führe das Prüfskript mit `--with-audit` aus und nenne den Commit des Prüfskripts. Beurteile erneut, ob die Zeitgrenzen der Tests auf langsameren Rechnern verlässlich sind.

Ablage: `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp01/reports/01-functiontest-4.md`

## Tester Sicherheit

Ablage: `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp01/reports/01-securitytest-4.md`
