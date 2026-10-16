# Prüfauftrag Auftrag 01, Durchlauf 1

- Vorhaben: `strategiedesign`, Arbeitspaket `wp01`, ref `strategiedesign/wp01`
- zu prüfender Commit: `df8a287a070264a3236eb4b39911cd608b7b3eed` auf Zweig `strategiedesign/wp01-01`
- Auftrag: `strategiedesign/wp01:development/strategiedesign/wp01/orders/01.md`
- Prüfgrundlagen: der Auftrag mit den darin genannten Grundlagen, `development/strategiedesign/specification.md` (Abschnitte 1 bis 3, 6, 7, 8, 9, 10), Fachmodell, Indikator Markttechnik und die Testfälle `str-01`, `str-03` unter `docs/design/`, `docs/technical/development-test-security-rules.md`, `docs/technical/pipwerk-domain.md` im geprüften Commit
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: erster Durchlauf vollständig, nur blockierende Befunde verhindern das Bestehen, alles andere als Hinweis.

## Angaben des Entwicklers

- Prüfungen in `packages/domain-core`: `uv sync --frozen`, `pytest` (792 Tests), `ruff check`, `ruff format --check`, `mypy` (streng), Abgleich der Schemata mit `python -m pipwerk_domain.documents.schemas --check ../../contracts/strategies/v1`, alle bestanden.
- Zusätzlich gebaut: `normalize_strategy` und `normalize_template` in `pipwerk_domain/normalize.py`.
- Selbst festgelegt, dokumentiert in Abschnitt 14 von `docs/technical/pipwerk-domain.md`: Datentyp `object` für Verweise auf Objekte der Anwendung; Kennungen der Zeiteinheiten klein (`h1`, `mn1`); die Bildungsregel behält einen vorhandenen Unterstrich; Regelwerk als geschlossener Namensraum; prüfende Regel und Bedingung müssen einen Wahrheitswert liefern; Zirkelbezug in jeder Regelliste, Vorwärtsbezug nur im Regelwerk; englische Beschriftungen und Werte der Kursquelle von `EMA`; Werte der Strategieparameter von `str-01` (Signalzeiteinheit `h1`, Handelszeiteinheit `m15`, beide Puffer 3, aus den Bereichen und Empfehlungen des Testfalls); zusätzliche Befunde `rule.unresolved_name`, `connection.invalid`, `parameter.binding_invalid`, `name.invalid`, `element.rules_not_allowed`, `element.management_invalid`, `rule.invalid_type`, `rule.comparison_missing`. Diese Festlegungen hat der Softwarearchitekt angenommen. Prüfe, ob sie dem Auftrag, der Spezifikation oder den Dokumenten des Auftraggebers widersprechen.

## Tester Funktion

Prüfe Funktion, Grenzfälle, Tests, Code und technische Dokumentation gegen den Auftrag, insbesondere: beide Testfalldokumente vollständig nach Abschnitt 6 und den Testfällen, null Fehler; jeder Befund aus 3.6 mit Gegenprobe; Namensräume, Zusammenhänge der Typprüfung und Hinweise S16 bis S18, S21, S24, S25, S27 wie im Auftrag festgelegt; Normalisierung; Begrenzungen.

Nimm die Bibliothek in das Prüfskript `components/pipwerk-studio/scripts/check` auf (Spezifikation Abschnitt 7, letzter Punkt: `uv sync --frozen`, `pytest`, `ruff check`, `ruff format --check`, `mypy` in `packages/domain-core` und der Abgleich der Schemata), mit Anpassung von Abschnitt 6.4 der technischen Dokumentation von pipwerk Studio. Änderungen im Zweig `strategiedesign/wp01-functiontest`, aufgesetzt auf dem geprüften Commit. Führe das Prüfskript aus und nenne den Commit des Prüfskripts im Bericht.

Ablage: `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp01/reports/01-functiontest-1.md`

## Tester Sicherheit

Prüfe nach BSI-Grundschutz, OWASP ASVS und API Security Top 10 und den Sicherheitsregeln, insbesondere: Zerlegung von Ausdrücken ohne `eval` oder Ähnliches, Verhalten bei sehr langen, tief geschachtelten oder bösartigen Eingaben (Rekursion, Laufzeit, Speicher), Begrenzungen aus Punkt 10 des Auftrags, strenge Validierung der Dokumente, Einstiegspunkt `pipwerk.element_types` (fehlerhafte Pakete, Protokoll ohne Ausnahmetext und Pfad), neue Abhängigkeiten mit `pip-audit` auf `packages/domain-core/uv.lock`.

Ablage: `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp01/reports/01-securitytest-1.md`
