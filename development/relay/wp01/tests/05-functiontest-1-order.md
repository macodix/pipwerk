# Prüfauftrag Tester Funktion: Auftrag 05, Durchlauf 1

- ref: `relay/wp01`
- zu prüfender Commit: `1177e14e73e214c19040b97cb7aa4d05bad1ebd1` (Zweig `relay/wp01-05`)
- Prüfgrundlagen: Auftrag `development/relay/wp01/orders/05.md` (liegt auf `relay/wp01`: `git show origin/relay/wp01:development/relay/wp01/orders/05.md`), `development/relay/specification.md` (Abschnitt 6, 3.5, 3.7, 7, 8 Abruf), `development/relay/plan.md` (`wp01`), `docs/technical/development-test-security-rules.md`; Prüfskripte `components/pipwerk-fetch-mt5/scripts/check` und `packages/relay-core/scripts/check`.
- Bericht: Dateiname `05-functiontest-1.md` im Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/relay/wp01/reports/`.
- Umfang: erster Durchlauf vollständig; Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md#umfang-der-prüfungen`, nur blockierende Befunde verhindern das Bestehen.
- Hinweise des Entwicklers: Das Relay gibt es in diesem Stand noch nicht; die Tests bilden es nach. Die Windows-Prüfung ist nicht ausgeführt (kein Befund). `fetch.py` und `service.py` wurden im Bestand geändert; prüfe, dass das Verhalten des Aufrufs an der Befehlszeile gleich bleibt. Das Format von `[relay.way]` (Vorworte `target.` und `inbox.`) ist Entscheidung des Entwicklers; prüfe, ob es mit Spezifikation 3.4 und 6.1 vereinbar und dokumentiert ist. Änderungen an `docs/user/pipwerk-replay.md` Abschnitt 9 gehören zur Installationsanleitung der Pfadabhängigkeit.
