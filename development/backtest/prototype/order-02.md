# Auftrag Prototyp Strategietester (pipwerk replay), Nachtrag

- Vorhaben: `backtest`, Phase 2 Konzeption
- zuständig: Entwickler Oberfläche
- Zweig: `backtest/proto-replay`, Prototyp, wird nicht übernommen
- Stand: 2026-10-21

## Ziel

Der Auftraggeber hat den Prototyp aus [order-01.md](order-01.md) bestätigt (Commit `73a39da4d53c1dde582a81c99410c0cbf8b07d22`) und zwei Fragen entschieden ([backtest-01](../questions/backtest-01.md), Abschnitt „Antwort“). Der Prototyp wird an diese Entscheidungen angepasst. Alles andere bleibt, wie es bestätigt ist.

## Grundlagen

- `development/backtest/questions/backtest-01.md`, Abschnitt „Antwort“, Punkte 2 und 3
- `docs/design/requirements/anforderungen-strategietester.md`, req-test-015
- `docs/design/domain/fachmodell.md`, req-fach-047 und req-fach-053

## Umfang

1. Der Auslöser heißt „Manuell“ (englisch „Manual“), überall, wo der Prototyp bisher „Start von Hand“ zeigt.
2. Vorbereitung: Die Karte „Auslöser ‚Start von Hand‘ (Vorschlag)“ wird zur Einstellung „Auslöser Manuell“. Sie erscheint nur, wenn die gewählte Strategie den Auslöser „Manuell“ hat. Sie zeigt: „Manuell“ tritt einmal ein, standardmäßig zu Beginn des Testzeitraums vor der ersten Kerze. Wahlweise gibt der Anwender einen Zeitpunkt im Testzeitraum ein (Datum und Uhrzeit, UTC). Ein Zeitpunkt außerhalb des Testzeitraums verhindert den Start, die Meldung nennt den Grund. Der Schalter, der den Vorschlag sichtbar macht, entfällt.
3. Damit die Einstellung ausprobiert werden kann, bekommt die Beispielstrategie „EMA-Trendfolge mit Vergleichsinstrument“ zusätzlich einen Auslöser „Manuell“ im Hauptablauf. Die Testfälle `str-01` und `str-03` bleiben unverändert.
4. Einzelschritt-Test: „Manuell“ erscheint als eigene Auswertung zum eingestellten Zeitpunkt, im Chart mit dem bisherigen Zeichen. Zusätzlich gibt es in der Steuerung des Einzelschritt-Tests den Befehl „Manuell auslösen“. Er ist nur bedienbar, wenn die Strategie den Auslöser „Manuell“ hat und die aktuelle Auswertung zu Ende ist, also zwischen zwei Auswertungen. Er startet eine Auswertung „Manuell“ zum aktuellen Zeitpunkt, die als nächste folgt. Bei einer Strategie ohne den Auslöser ist der Befehl nicht zu sehen.
5. Backtest: „Manuell“ wird einmal zum eingestellten Zeitpunkt ausgewertet.
6. Das Element „Parameter setzen“ (im Prototyp „Strategieparameter ändern“, `flow.set_parameter`) entfällt: aus dem Katalog, den Erklärungen, der Zusammenfassung, dem Interpreter und jeder Strategie des Prototyps.
7. README: Abschnitt „Vorschlag zum offenen Punkt ‚Start von Hand‘“ wird durch eine Beschreibung der Entscheidung ersetzt. Die Tabelle der Browsertests nennt „Manuell“. Die übrigen Abschnitte passen zum neuen Stand.

## Nicht-Umfang

- Jede andere Änderung an Bedienung, Anordnung und Erscheinungsbild
- Umstellung von `str-01` auf den ZigZag
- Neue Bildschirmbilder außer einem: Vorbereitung mit der Einstellung „Auslöser Manuell“ in 1366 × 768

## Technische Abnahmekriterien

1. Die Kriterien 1 bis 3 und 6 aus `order-01.md` gelten weiter und sind auf dem neuen Commit erfüllt.
2. Ein Browsertest prüft nur über die Bedienung: Die Beispielstrategie zeigt die Einstellung „Auslöser Manuell“; ein eingegebener Zeitpunkt im Testzeitraum führt im Einzelschritt-Test zur Auswertung „Manuell“ zu diesem Zeitpunkt; ein Zeitpunkt außerhalb verhindert den Start mit Meldung; „Manuell auslösen“ zwischen zwei Auswertungen startet eine Auswertung „Manuell“; bei `str-01` sind Einstellung und Befehl nicht zu sehen.
3. Im Quelltext und in der gebauten Datei kommen „Start von Hand“, „Start by hand“, „Strategieparameter ändern“ und `flow.set_parameter` nicht mehr vor.
4. Bildschirmbild nach Nicht-Umfang unter `components/pipwerk-backtest/prototype/screenshots/`.
5. README nach Umfang Punkt 7. Keine Pfade des Entwicklungsrechners, keine Zugangsdaten.

## Ergebnis

Ein benannter Commit im Zweig `backtest/proto-replay` auf GitHub. Nenne ihn vollständig im Ergebnis, dazu die erfüllten und nicht erfüllten Abnahmekriterien mit Nachweis und deine Entscheidungen.
