# Bearbeitung der Befunde, Durchlauf 1

- Vorhaben: `backtest`
- Prüfbericht: [requirements-1.md](requirements-1.md), nicht bestanden
- Rolle: Projektleiter
- Stand: 2026-10-21

Entscheidungen des Auftraggebers im Chat am 20. und 21. Oktober 2026.

| Befund | Bearbeitung |
|---|---|
| B1 | req-system-025, req-test-005: Angaben zum Instrument sind die Eigenschaften von `Instrument` nach req-fach-051, dazu Kontraktgröße, Swap und Margin-Anforderung. |
| B2 | Entscheidung: Ein Auslöser `Tick` verlangt echte Ticks im Datenbestand, keine Nachbildung aus Kerzen (req-test-003). |
| B3 | Entscheidung: Volumen durch Teilschließung anpassen, soweit möglich, sonst Position schließen; Vorgang vermerken (req-fach-021). Offener Punkt in `str-03` entfernt. |
| B4 | req-test-001, -003, -005, -007: Instrumente des Testlaufs umfassen weitere Instrumente der Strategie; Strategieparameter vom Objekttyp `Instrument` je Testlauf änderbar. |
| B5 | Entscheidung: Trend erst nach Schluss über Punkt 2 bestätigt, bleibt bei Lauf in Trendrichtung bestehen, nach Bruch von Punkt 1/3 `kein Trend` (`indikator-markttechnik.md` 4.1, 4.2). `Trend intakt` gestrichen. |
| B6 | Entscheidung: Eigenschaft `Phase` gestrichen. Bewegung und Korrektur ergeben sich aus Kurs und Punkten (4.3). `str-01`: Prüfung der Bewegung gestrichen. Punkte folgen den Wendepunkten des ZigZag (4.1). |
| H7 | Entscheidung: Hauptkomponente Strategietester (pipwerk backtest), Betriebsarten Einzelschritt-Test und Backtest. Anforderungsdokument und Glossar angepasst. |
| H8 | req-test-001: Auswahl von Instrument und Testzeitraum mit Verweis auf die Beschaffung. |
| H15 | Abschnitt 5 der Anforderungen inzwischen ohne den Punkt (Entscheidung vom 2026-10-20 zum Auslöser „Start von Hand“). |
| H16 | Fachmodell: Zweck, req-fach-016, -019, -033, -049 nennen für den Testlauf interne Abwicklung und Testkonto. |
| H6, H13, H14 | Offene Punkte, unverändert. |
| übrige Hinweise | Spezifikation. |

Abgrenzung: `str-01` und `str-03` sind in `scope.md` jetzt Prüfmaterial. Die QA prüft nur ihre Ausführbarkeit im Strategietester, nicht ihren fachlichen Inhalt.
