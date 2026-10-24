# Prüfauftrag Tester Sicherheit: Arbeitszweig `relay/wp01`, Durchlauf 2

- ref: `relay/wp01`
- zu prüfender Commit: `e4bd4e7f18ffd01bed4f6241a54a942ce8f21642` (Zweig `relay/wp01`, Aufträge 01 bis 07 zusammengeführt)
- Prüfgrundlagen: Bericht des ersten Durchlaufs `development/relay/wp01/tests/security-1.md` (B1 und H1 bis H5; nachzuprüfen, dass B1 behoben ist, H2, H3 umgesetzt, H1 und H5 dokumentiert), Auftrag `development/relay/wp01/orders/07.md`, `development/relay/specification.md` (Abschnitt 7 und 8), `development/relay/plan.md` (`wp01`), `docs/technical/development-test-security-rules.md`, technische Dokumente `docs/technical/pipwerk-relay.md`, `docs/technical/pipwerk-fetch-mt5.md`.
- Bericht: Dateiname `security-2.md` im Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/relay/wp01/reports/`.
- Umfang: Nachprüfung von B1 und der Hinweise sowie Prüfung der Änderungen aus Auftrag 07 (neu: `grace.py`, `ReceivedEnvelope.load()`, `plain_text`, `safe_file_name`); Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md#umfang-der-prüfungen`, nur blockierende Befunde verhindern das Bestehen. Wenn möglich, belege B1 durch einen Versuch mit spärlich belegten Dateien in einem Verzeichnis unter `/srv/aixlab/dev/pipwerk/work/relay/wp01/`.
- Befehle, die länger als 5 Minuten dauern können, laufen im Hintergrund mit Ausgabe in eine Datei unter `/srv/aixlab/dev/pipwerk/work/relay/wp01/`; warte mit `Monitor`, Zeitlimit höchstens 600 Sekunden. Befehle enthalten keine Variablen, keine Kommandoersetzung und kein `cd`.
