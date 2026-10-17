# Prüfauftrag Auftrag 01, Durchlauf 2 (Nachprüfung)

- Vorhaben: `strategiedesign`, Arbeitspaket `wp01`, ref `strategiedesign/wp01`
- zu prüfender Commit: `b12816c225bf8fa2fea50acca43e725126e6054b` auf Zweig `strategiedesign/wp01-01`
- vorher geprüfter Commit: `df8a287a070264a3236eb4b39911cd608b7b3eed`
- Auftrag: `strategiedesign/wp01:development/strategiedesign/wp01/orders/01.md`
- Berichte aus Durchlauf 1: `strategiedesign/wp01:development/strategiedesign/wp01/tests/01-functiontest-1.md`, `strategiedesign/wp01:development/strategiedesign/wp01/tests/01-securitytest-1.md`
- Umfang der Prüfungen: Nachprüfung nach „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`. Nur blockierende Befunde verhindern das Bestehen.

## Festlegungen des Softwarearchitekten zu den Befunden

- Funktion B1: `Strategie` ist ein Objekt der Anwendung, auch in Indikator, Trend und Regelwerk. Strategieparameter unter `Strategie.<name>` sind dort ansprechbar. In einer für sich geprüften Vorlage ist ein unbekannter Strategieparameter ein Hinweis `rule.unresolved_name`, in einer Instanz innerhalb einer Strategie wird er gegen deren Parameter geprüft. Die übrigen Namen der Strategie bleiben dort unsichtbar.
- Funktion B4, Sicherheit H2 und H3: Namen nur aus ASCII-Buchstaben, ASCII-Ziffern und `_`, Zahlen nur mit ASCII-Ziffern.
- Sicherheit B4: höchstens 50 Befunde je Ausdruck und 1000 je Prüfung eines Dokuments, darüber der Befund `findings.truncated`.
- Funktion H7: Trend mit Verfahren „Ausdruck“ ohne Ausdruck für `richtung` ist ein Fehler (`trend.direction_missing`).
- Sicherheit H5: doppelte Schlüssel in einem JSON-Objekt werden abgelehnt.

## Korrekturen laut Entwickler

Alle blockierenden Befunde beider Berichte und die Hinweise Funktion H1, H2, H5, H7 und Sicherheit H2 bis H5. Neu: Befund `calculation.circular_reference` (Kreis zwischen Ergebnissen von Berechnungen), Lexer mit einem regulären Ausdruck, Normalisierung ohne die Grenze von 1000 Befunden, aber mit der Grenze je Ausdruck; `RUF001` für `tests/**` abgeschaltet. 912 Tests und alle Prüfungen in `packages/domain-core` bestanden. Das Prüfskript hat der Entwickler weder geändert noch ausgeführt.

## Tester Funktion

Setze den Zweig `strategiedesign/wp01-functiontest` (Prüfskript mit Bibliothek, Commit `661e8151635afa154ec92343e00c5d2aa35abefd`) auf den geprüften Commit neu auf. Ergänze im Prüfskript den Schritt `pip-audit` um die Lockdatei `packages/domain-core/uv.lock` (Befund O1 des Testers Sicherheit), mit Anpassung von Abschnitt 6.4 der technischen Dokumentation. Führe das Prüfskript mit `--with-audit` aus und nenne den Commit des Prüfskripts.

Ablage: `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp01/reports/01-functiontest-2.md`

## Tester Sicherheit

`pip-audit` für `packages/domain-core/uv.lock` (O1): Führe das Prüfskript aus dem Zweig `strategiedesign/wp01-functiontest` mit `--with-audit` aus, wie in deiner Prüfung von Auftrag 02, sobald es den Schritt enthält; sonst `uvx pip-audit` wie im Prüfskript. Gelingt keines von beiden, nenne die exakt benötigte Freigabe.

Ablage: `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp01/reports/01-securitytest-2.md`
