# Prüfauftrag Funktionstest, Auftrag 22, Durchlauf 1

- Vorhaben: `backtest`
- Arbeitspaket: `wp02`
- Rolle: Tester Funktion
- zu prüfender Commit: `eff54da67f9ceb56245de7a716795c72c968b111` (Zweig `backtest/wp02-22`, aufgesetzt auf `f9a8536ff2c4fa99da0f622f640c43e2f472c0dc`)
- Auftrag: `development/backtest/wp02/orders/22.md` auf dem Zweig `backtest/wp02`
- Prüfgrundlagen: Auftrag 22; Spezifikation `development/backtest/specification.md` 5.3 (Herkunft der Dateien), 5.6 (Dateien behalten), 5.7, 10, 11; `development/backtest/wp02/amend-01.md`; technische Dokumentation `docs/technical/pipwerk-replay.md`; Beschreibung `contracts/api/pipwerk-replay/v1/openapi.json`

## Gegenstand

1. Eindeutiger Name beim Behalten (kleinste freie Nummer ab 2 vor der Endung, Datei, Verzeichnis oder Verweis als vergeben, Kürzen zu langer Namen), Anlegen ohne Ersetzen (`os.link`), Höchstzahl der Versuche, Zwischendatei immer entfernt.
2. Feld `kept_as` in Antwort, Beschreibung und Beispielen.
3. Keine Prüfung der Verzeichnisse gegeneinander; Ablage gleich Importverzeichnis, darin und darüber; Liste ohne Zwischendateien.
4. Prüfe, dass jeder Testfall aus Umfang 6 des Auftrags vorhanden ist und echt prüft (Gleichzeitigkeit, Wettlauf, Verweise), die Dokumentation stimmt und keine festen Werte im Code stehen.
5. Führe die Backend-Schritte des Prüfskripts `components/pipwerk-replay/scripts/check` selbst aus (das Skript verlangt `--backend-port` und `--frontend-port`; nimm freie Ports). Die Oberfläche ist nicht Gegenstand (Auftrag 23); ihre Browsertests und Texte zu „ersetzt“ melden keinen Befund.

Beachte die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`, Abschnitt „Umfang der Prüfungen“.

## Ablage

Schreibe den Testbericht ohne Commit als Datei `22-functiontest-1.md` in das Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/backtest/wp02/reports/`, höchstens etwa 40 Zeilen, mit „bestanden“ oder „nicht bestanden“, dem geprüften Commit vollständig und den Befunden.
