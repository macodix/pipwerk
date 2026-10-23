# Prüfbericht Spezifikation, Durchlauf 3

- Vorhaben: `backtest`
- Rolle: QA
- geprüfter Commit: `f67c1f0eff6e4de78cc7de1a31c8bce2add665fc` auf `main`
- Prototyp: `d9c2edac0ec78555d43f587635e8bf1a37b4d762` auf `backtest/proto-replay`, gebaute Datei `development/backtest/prototype/pipwerk-replay-prototyp.html`
- Umfang: Punkte 1 und 2 des Prüfauftrags (geänderte Stellen der Spezifikation und Prototyp)

## Ergebnis

**bestanden**

Blockierende Befunde: keine.

Einschränkung zu Punkt 2: Auf dem Entwicklungsrechner ist kein Browser verfügbar, ein Python-Aufruf wurde abgelehnt. Die gebaute Datei habe ich nicht im Browser geöffnet und nichts bedient. Geprüft habe ich den Quelltext der gebauten Datei, `order-03.md` und die Spezifikation. Ob Import mehrerer Dateien und Einzelheiten einer Reihe ohne Erklärung bedienbar sind, ist damit nicht belegt. Das bleibt der Bestätigung des Prototyps durch den Auftraggeber überlassen.

## Prüfung

- M1 (Ansicht): 8.3 gibt Leiste mit „Datei importieren …“ und „Broker für Testläufe“, kompakte filterbare Tabelle mit Seiten, Klick auf Zeile mit Lücken und Kontraktdaten, keinen eigenen Bereich für Angaben zum Instrument. Das entspricht M1 Punkte 1 bis 4. 5.1 setzt Punkt 4 um (nur Broker des Datenbestands).
- M2: In der gebauten Datei kommen „Was vorliegt“, „Angaben zum Instrument je Broker“, „Datei von Hand“ und „Beschaffung von Hand“ nicht mehr vor (Suche im Quelltext). „Datei importieren“ und „Kontraktdaten“ sind vorhanden. Die Treffer „unten“ stehen in Texten zu Strategie und Zeitraum, nicht in der Ansicht „Datenbestand“ (nur aus dem Treffertext geschlossen).
- M3: 5.3 deckt Broker einmal für alle, Zeitzone einmal für CSV, Instrument und Daten je Datei, Ergebnis je Datei, abgelehnte Datei ohne Wirkung auf die übrigen. Der Quelltext enthält Broker-Vorschläge, Zeitzone nur bei CSV und Meldungen für ein unbekanntes Instrument beziehungsweise eine unbekannte Zeitzone.
- M4 und req-system-027: E5, 5.4 und 11 stimmen überein (Programm, kein Server, kein Port, Dateien ins Zielverzeichnis, Broker gleich Handelsserver, Exitcode). Kein Rest der HTTP-Schnittstelle in den nicht geänderten Stellen gefunden (Suche nach „http“, „Schlüssel“, „Standardquelle“).
- req-test-003 und req-system-026: 5.4 letzter Absatz, 6.1, 8.3 „Kursdaten beim Start“ und 8.4 Punkt 6 stimmen überein. Der Testlauf startet nicht, die Meldung nennt Weg und Knopf zur Ansicht „Datenbestand“. 7, 10, 11 und 12 sind angeglichen.
- Hinweise H2 und H4 aus `requirements-6.md` sind in 5.4 umgesetzt.
- Widerspruch einer geänderten zu einer nicht geänderten Stelle: keiner gefunden.

## Hinweise (nicht blockierend)

- H1: 5.3 sagt, ein Fehler im Format lehne die Datei ganz ab. `order-03.md` sagt „Format oder Inhalt“. Eine Zeile in 5.3 genügt.
- H2: 5.3 nennt den Dateinamen für CSV-Dateien („soweit er sie enthält“) nicht. Nur `order-03.md` legt die Namen fest.
- H3: 5.3 sagt nicht, was vorbelegt wird, wenn JSON-Dateien verschiedene Broker nennen. `order-03.md` sagt nur „denselben Broker“.
- H4: 5.1 legt als Ersatz den alphabetisch ersten Broker fest. `order-03.md` nennt das nicht. Ob der Prototyp es zeigt, habe ich nicht geprüft.
