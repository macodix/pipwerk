# Prüfauftrag Auftrag 23, Durchlauf 1

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `9b2855269ae3e9936f77e5eb59f9a4bcee476d94` auf Zweig `strategiedesign/wp02-23`, Vorgänger `d90b73f878fd88fef3319aacc9967fad98d71d8a`
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/23.md`; Grundlage: `docs/technical/development-test-security-rules.md` Abschnitt 7 Testregeln, Spezifikation 5.4 Punkt „Begriffe“, 3.1, Abschnitt 10 Punkt 27
- Es prüft nur der Tester Funktion. Nur blockierende Befunde verhindern das Bestehen.

## Tester Funktion

- Prüfe, dass `GET /api/v1/element-types` für den festgelegten Wert des Parameters `Instrument` „Voreingestelltes Instrument aus Strategie“ und „Default instrument from strategy“ liefert, dass die Kennung `instrument_der_anwendung` unverändert ist und dass gespeicherte Dokumente (Strategien, Vorlagen, Beispiele und Testfälle) weiter öffnen. Der Entwickler hat die Kennung `ausdruck` ebenfalls bewusst behalten (`_par(..., ident=...)`): Prüfe das.
- Prüfe, dass kein sichtbarer Text der Bibliothek (Typbeschreibungen, Vorlagen, Funktionen, Datentypwörter, Feldbeschriftungen der Befunde) die Wörter „Ausdruck“, „Objekttyp“, „Objekt der Anwendung“, „Objekte der Anwendung“, „Einstellungen des Objekts“ (englisch „expression“, „object type“ als Wort) enthält, und prüfe die Grammatik der geänderten Sätze („Formel“ statt „Ausdruck“).
- Prüfe `category_label` in `GET /api/v1/element-types` (Indikator, Trend, Regel, Regelwerk, Deutsch und Englisch, `null` ohne Art), den neu erzeugten Contract `contracts/api/pipwerk-studio/v1/openapi.json` und dass die Fake-Antwort `frontend/src/testing/element-types.json` der Antwort gleicht.
- Prüfe den Satz zu „Hauptablauf“ (`typedesc.MAIN_FLOW_EXPLANATION`, deutsch und englisch, Wortlaut nach Spezifikation 5.4, einmal je Text). Die Befundtexte schreibt die Oberfläche (`describe.py` liefert keine Sätze); das setzt Auftrag 25, nicht dieser Auftrag.
- Prüfe die geänderten bestehenden Tests: Sind sie nicht abgeschwächt, nur im Wortlaut geändert?
- Führe die Tests der Bibliothek (`packages/domain-core`) und des Backends vollständig aus, mit ruff und mypy laut Abschnitt 7. Das Prüfskript `check` mit Browsertests ist für diesen Auftrag nicht zu wiederholen: Der Entwickler meldet Exitcode 0 mit 456 bestandenen Browsertests; prüfe nur Dateimodus `100755` von `check` und `testenv` im Commit und führe die Typprüfung und Vitest des Frontends aus.
- Prüfe, dass kein fester Pfad, Port oder Rechnername im Code steht und dass die Dokumentation (`docs/technical/pipwerk-domain.md`, neuer Abschnitt „Wörter der sichtbaren Texte“) zum Code passt.
- Befehle enthalten keine Umgebungsvariablen und keine Kommandoersetzungen.

## Ausführung langer Befehle (verbindlich)

- Jeder Befehl, der länger als 5 Minuten dauern kann, läuft im Hintergrund (Bash mit `run_in_background`), Ausgabe in eine Datei unter `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp02/`. Frage den Stand mindestens alle 5 Minuten mit einem kurzen Befehl ab. Ein einzelner Werkzeugaufruf über 15 Minuten erzeugt keinen Herzschlag, und die Sitzung wird beendet.
- Schreibe den Testbericht sofort nach Ende der Prüfung und beende danach deine Sitzung.

Ablage: `23-functiontest-1.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
