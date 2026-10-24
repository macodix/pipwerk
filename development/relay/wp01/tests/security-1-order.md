# Prüfauftrag Tester Sicherheit: Arbeitszweig `relay/wp01`, Durchlauf 1

- ref: `relay/wp01`
- zu prüfender Commit: `7da618ea7c87f6e21e3ac9836d18ec04d0674d79` (Zweig `relay/wp01`, alle Aufträge 01 bis 06 zusammengeführt)
- Prüfgrundlagen: `development/relay/specification.md` (Abschnitt 7 Sicherheit, Abschnitt 8), `development/relay/plan.md` (`wp01`, Sicherheit und Prüfung nach Regel 12), `docs/technical/development-test-security-rules.md`, Aufträge `development/relay/wp01/orders/01.md` bis `06.md`, technische Dokumente `docs/technical/pipwerk-relay.md`, `docs/technical/pipwerk-fetch-mt5.md`, `docs/user/pipwerk-relay.md`.
- Bericht: Dateiname `security-1.md` im Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/relay/wp01/reports/`.
- Umfang: erster Durchlauf vollständig; Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md#umfang-der-prüfungen`, nur blockierende Befunde verhindern das Bestehen. Geprüft werden die Teile von `wp01` (`packages/relay-core`, `components/pipwerk-relay`, `serve` und `request` in `components/pipwerk-fetch-mt5`), nicht der Bestand aus `backtest/wp02` außer dessen Wechselwirkung mit dem Abruf.
- Befehle, die länger als 5 Minuten dauern können (Prüfskripte, `testenv`, Tests), laufen im Hintergrund mit Ausgabe in eine Datei unter `/srv/aixlab/dev/pipwerk/work/relay/wp01/`; warte mit `Monitor`, Zeitlimit höchstens 600 Sekunden. Endet der Monitor ohne Ergebnis, prüfe den Stand mit einem kurzen Befehl. Befehle enthalten keine Variablen, keine Kommandoersetzung und kein `cd`.
