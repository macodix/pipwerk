# Prüfauftrag Tester Funktion: Auftrag 04, Durchlauf 1

- ref: `relay/wp01`
- zu prüfender Commit: `557d5ff95542972f1dc9c078c6d9d8c2eafebde0` (Zweig `relay/wp01-04`)
- Prüfgrundlagen: Auftrag `development/relay/wp01/orders/04.md` (liegt auf `relay/wp01`: `git show origin/relay/wp01:development/relay/wp01/orders/04.md`), `development/relay/specification.md` (3.7, 4.5, Abschnitt 8 Prüfkomponente, Störungen 1 bis 7, Testumgebung, Durchgang 1), `development/relay/plan.md` (`wp01`), Berichte 01, 02, 03, 05 unter `development/relay/wp01/tests/`, `docs/technical/development-test-security-rules.md`; Prüfskripte `components/pipwerk-relay/scripts/check`, `packages/relay-core/scripts/check`, `components/pipwerk-fetch-mt5/scripts/check`.
- Der Auftrag hat auch `relay-core` (neues Modul `connection`) und `pipwerk-fetch-mt5` (`RelaySettings` wird `ConnectionSettings`, Test `test_relay_isolation.py` angepasst) geändert: Prüfe, dass der Aufruf an der Befehlszeile von `pipwerk-fetch-mt5` die Bibliothek weiterhin nicht lädt und das Verhalten unverändert ist.
- Bericht: Dateiname `04-functiontest-1.md` im Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/relay/wp01/reports/`.
- Umfang: erster Durchlauf vollständig; Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md#umfang-der-prüfungen`, nur blockierende Befunde verhindern das Bestehen.
- Das Testumgebungsskript `components/pipwerk-relay/scripts/testenv` gehört zum Prüfumfang; führe es aus, soweit deine Umgebung es erlaubt, und halte fest, was du nicht ausführen konntest. Die Windows-Prüfung und Netzlaufwerke sind nicht ausgeführt (kein Befund).
