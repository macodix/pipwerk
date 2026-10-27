# Prüfbericht Spezifikation, Durchlauf 5 (Nachprüfung)

- Vorhaben: `backtest`
- geprüfter Commit: `9b7372325ac2672b02181418de557b9bd45acfa9` (`main`)
- Gegenstand: B1 aus `specification-4.md`; geänderte Stellen Spezifikation 5.2, 5.5, 10, Änderungsnachweis; Plan `wp02` Kriterien 7 bis 9, Abschnitt „Offen“. Alles Übrige, M4 und `order-04` nicht geprüft.

## Ergebnis: bestanden

B1 ist behoben. In den geänderten Stellen habe ich keinen blockierenden Fehler gefunden.

## B1 – behoben

- Zwischen zwei Dateien: Bei CSV gilt ein Tag vom Beginn bis zum Ende in der Importzeitzone als abgedeckt (5.2, zweiter Punkt). Dazu kommt die Liste „Tage ohne Handel“, vorbelegt mit 25. Dezember und 1. Januar (22:00 UTC des Vortags bis 22:00 UTC, 5.2, dritter Punkt). Rechnung: Endet eine Datei am 24.12. und beginnt die nächste am 26.12., ist der Zwischenraum genau der 25.12. und damit keine Lücke. Das gilt ebenso für 31.12. und 2.1. Das ist M6 und req-test-003.
- Am Rand des Testzeitraums: 5.2, letzter Punkt, wendet dieselbe Regel auf die Prüfung vor dem Testlauf an. Ein Testzeitraum ab einem Tag ohne Handel fehlt nicht mehr.
- Der Test in 10 deckt Tage ohne Handel, frühen Handelsschluss am Ende einer CSV-Datei und die Prüfung vor dem Testlauf ab.
- `wp02` Kriterium 9 passt zur Spezifikation: nicht importierter Handelstag ist Lücke, Weihnachten und Silvester/Neujahr sind es nicht, innerhalb und zwischen Dateien.

## Hinweise H1 bis H3 aus Durchlauf 4

- Alle drei sind in 5.2 und 5.5 widerspruchsfrei eingearbeitet. Kriterium 8 und die „Broker für Testläufe“-Regel passen zu 5.1 (Ersatz durch den ersten Broker) und 5.5; Kriterium 7 verweist auf die Grenze in der Anwenderdokumentation (12).

## Blockierende Befunde

Keine.

## Hinweise (nicht blockierend)

- H1 – Kriterium 9 sagt „eine davor endet, die andere danach beginnt“. Nach 5.2 sind aber nur 25.12. und 1.1. frei. Endet eine Datei am 23.12. und beginnt die nächste am 27.12., ist der 24.12. eine Lücke, weil dort Handel war. Das Kriterium sollte die Randtage nennen (Ende 24.12., Beginn 26.12.), damit die Prüfung eindeutig ist.
- H2 – Die Grenzen „22:00 UTC“ für Tage ohne Handel setzen einen Server um UTC+2 voraus. Importzeitzone und Tage werden sonst in der gewählten IANA-Zeitzone gerechnet. Bei einem Broker in anderer Zeitzone oder einem im Sommer eingetragenen Tag kann an den Rändern eine Lücke von ein bis zwei Stunden bleiben. Die Spezifikation sollte dies ausdrücklich nennen oder die Grenze aus der Zeitzone ableiten.
- H3 – Die Liste „Tage ohne Handel“ steht in 5.2, aber nicht im Plan `wp02` Umfang und Kriterien, und der Schlüssel in `pipwerk-replay.ini` ist nirgends benannt. Der Auftrag legt ihn fest. Kriterium 9 prüft die Liste nicht, auch nicht den frühen Handelsschluss.
