# Prüfauftrag Auftrag 15, Durchlauf 1

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `963a1b725e32d98a237f66968abfe9b8a6d85ea2` auf Zweig `strategiedesign/wp02-15`, Ausgangscommit `701698e43963ccc77ec909fcbc59cc86ddcd129a`
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/15.md`
- Prüfgrundlagen: Auftrag, Spezifikation (3.1, 3.4, 3.6, 4.2, 7), Abnahmebericht `development/strategiedesign/wp02/acceptance/3.md` (E1, E3, E6, E10, E11, E12), technische Dokumentation und Glossar
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`. Nur blockierende Befunde verhindern das Bestehen. Erster Durchlauf: vollständig.

## Tester Funktion

- Prüfe jeden Punkt 1 bis 7 des Auftrags gegen Code, Tests und Dokumentation. Besonders: Baustein „Kreuzung“ entfällt vollständig, gespeicherte Kreuzungen (`str-01`, `str-03`, gesicherte „EMA-Trendfolge“ `development/strategiedesign/wp02/acceptance/ema-trendfolge-auftraggeber.strategy.json`) werden unverändert gelesen und geprüft; Befunde nennen Element und Feld mit Beschriftung in beiden Sprachen; Datentypwörter; Kennzeichen „früherer Wert“; kein „Verwaltung“ ohne „Order- und Positionsverwaltung“ in Texten für den Anwender; die OpenAPI-Beschreibung stimmt mit der erzeugten überein.
- Führe die Tests der Bibliothek und des Backends (pytest, ruff, mypy) aus. Die Oberfläche (Quelltext `crossing`, Texte) ändern die Aufträge 16 und 17; Befunde dazu sind nicht blockierend für diesen Auftrag, außer der Entwickler ändert dort etwas Falsches.
- Befehle enthalten keine Umgebungsvariablen und keine Kommandoersetzungen.

## Ausführung langer Befehle (verbindlich)

- Jeder Befehl, der länger als 5 Minuten dauern kann, läuft im Hintergrund (Bash mit `run_in_background`), Ausgabe in eine Datei unter `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp02/`. Frage den Stand mindestens alle 5 Minuten mit einem kurzen Befehl ab.

Ablage: `15-functiontest-1.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
