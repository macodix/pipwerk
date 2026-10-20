# Vorhaben backtest

Vorhaben nach dem [Entwicklungsverfahren](../../docs/technical/entwicklungsverfahren.md): Strategien testen. Der Strategietester (Modul pipwerk backtest) führt Strategien gegen historische Kursdaten aus, in zwei Betriebsarten: schrittweise zur Prüfung des Ablaufs und durchgehend über einen Testzeitraum mit Kontoentwicklung, Trades und Kennzahlen. Dazu gehören der Datenbestand historischer Kursdaten mit Beschaffung und Import sowie die Testkonten.

Nachweis des Vorhabens sind die beiden Testfälle: Jeder muss sich im Strategietester schrittweise prüfen und im Backtester über den vorbelegten Testzeitraum testen lassen, ohne die Strategie dafür zu bearbeiten.

## Geltende Dokumente

Anforderungsdokumente:

- [Anforderungen an das Gesamtsystem](../../docs/design/requirements/anforderungen-gesamtsystem.md)
- [Anforderungen an Strategietester und Backtester](../../docs/design/requirements/anforderungen-strategietester-backtester.md)

Fachmodell und Strategiebeschreibungen des Auftraggebers, die für dieses Vorhaben gelten und von der QA ebenfalls auf Widersprüche, Lücken und mehrdeutige Begriffe geprüft werden:

- [Fachmodell des Trading-Systems](../../docs/design/domain/fachmodell.md), insbesondere die Ausführung von Strategien, Orders, Positionen und Regeln
- [Indikator Markttechnik](../../docs/design/domain/indikator-markttechnik.md)
- Testfall [Scalping Punkt 2 Ausbruch – einfache Strategie](../../docs/design/strategies/str-01-fachlich-scalping-punkt-2-ausbruch-einfach.md) (`str-01`)
- Testfall [EMA-Trendfolge](../../docs/design/strategies/str-03-fachlich-ema-trendfolge.md) (`str-03`)

Zum Vergleich, nicht Gegenstand des Vorhabens: [Anforderungen an den Trading-Strategiedesigner](../../docs/design/requirements/anforderungen-strategiedesigner.md) (Darstellung der Strategie, req-test-010) und [Anforderungen an das Handelssystem](../../docs/design/requirements/anforderungen-handelssystem.md) (Testbarkeit, req-test-006).

## Abhängigkeit

Das Vorhaben baut auf der gemeinsamen Python-Bibliothek und der Darstellung der Strategie aus dem Vorhaben [strategiedesign](../strategiedesign/scope.md) auf. Phase 4 beginnt erst, wenn die benötigten Teile dort abgenommen und übernommen sind.

## Offene Punkte des Auftraggebers

Als offen gekennzeichnet in den geltenden Dokumenten:

- Strategietester und Backtester: Anzeige der Unterschiede zwischen Fassungen einer Strategie (darf durch den Aufbau nicht ausgeschlossen werden).
- Fachmodell: Die als offen gekennzeichneten Stellen zur Ausführung von Strategien (unter anderem freie Margin, req-fach-049) betreffen dieses Vorhaben unmittelbar. Die QA meldet sie als Lücke, soweit ein Testfall sie zum Testen braucht.

## Stand

2026-10-19: Phase 1. Offene Punkte des Anforderungsdokuments vom Auftraggeber im Chat am 19. Oktober 2026 entschieden. Prüfung der Dokumente des Auftraggebers durch die QA mit `check` angestoßen.
