# Vorhaben backtest

Vorhaben nach dem [Entwicklungsverfahren](../../docs/technical/entwicklungsverfahren.md): Strategien testen. Der Strategietester (Modul pipwerk backtest) führt Strategien gegen historische Kursdaten aus, in zwei Betriebsarten: schrittweise zur Prüfung des Ablaufs und durchgehend über einen Testzeitraum mit Kontoentwicklung, Trades und Kennzahlen. Dazu gehören der Datenbestand historischer Kursdaten mit Beschaffung und Import sowie die Testkonten.

Nachweis des Vorhabens sind die beiden Testfälle: Jeder muss sich im Einzelschritt-Test prüfen und im Backtest über den vorbelegten Testzeitraum testen lassen, ohne die Strategie dafür zu bearbeiten.

## Geltende Dokumente

Anforderungsdokumente:

- [Anforderungen an das Gesamtsystem](../../docs/design/requirements/anforderungen-gesamtsystem.md)
- [Anforderungen an den Strategietester](../../docs/design/requirements/anforderungen-strategietester-backtester.md)

Fachmodell des Auftraggebers, das für dieses Vorhaben gilt und von der QA ebenfalls auf Widersprüche, Lücken und mehrdeutige Begriffe geprüft wird:

- [Fachmodell des Trading-Systems](../../docs/design/domain/fachmodell.md), insbesondere die Ausführung von Strategien, Orders, Positionen und Regeln
- [Indikator Markttechnik](../../docs/design/domain/indikator-markttechnik.md), weil der Strategietester ihn berechnet

## Prüfmaterial

Die beiden Testfälle sind Prüfmaterial, nicht Gegenstand des Vorhabens. In diesem Vorhaben werden keine Strategien entwickelt. Die QA prüft nur, ob der Strategietester sie in beiden Betriebsarten so ausführen kann, wie sie beschrieben sind, nicht ihren fachlichen Inhalt:

- Testfall [Scalping Punkt 2 Ausbruch – einfache Strategie](../../docs/design/strategies/str-01-fachlich-scalping-punkt-2-ausbruch-einfach.md) (`str-01`)
- Testfall [EMA-Trendfolge](../../docs/design/strategies/str-03-fachlich-ema-trendfolge.md) (`str-03`)

Zum Vergleich, nicht Gegenstand des Vorhabens: [Anforderungen an den Trading-Strategiedesigner](../../docs/design/requirements/anforderungen-strategiedesigner.md) (Darstellung der Strategie, req-test-010) und [Anforderungen an das Handelssystem](../../docs/design/requirements/anforderungen-handelssystem.md) (Testbarkeit, req-test-006).

## Abhängigkeit

Das Vorhaben baut auf der gemeinsamen Python-Bibliothek und der Darstellung der Strategie aus dem Vorhaben [strategiedesign](../strategiedesign/scope.md) auf. Phase 4 beginnt erst, wenn die benötigten Teile dort abgenommen und übernommen sind.

## Offene Punkte des Auftraggebers

Als offen gekennzeichnet in den geltenden Dokumenten:

- Strategietester: Anzeige der Unterschiede zwischen Fassungen einer Strategie (darf durch den Aufbau nicht ausgeschlossen werden).
- Fachmodell: Die als offen gekennzeichneten Stellen zur Ausführung von Strategien (unter anderem freie Margin, req-fach-049) betreffen dieses Vorhaben unmittelbar. Die QA meldet sie als Lücke, soweit ein Testfall sie zum Testen braucht.

## Stand

2026-10-19: Phase 1. Offene Punkte des Anforderungsdokuments vom Auftraggeber im Chat am 19. Oktober 2026 entschieden. Prüfung der Dokumente des Auftraggebers durch die QA mit `check` angestoßen.

2026-10-20/21: Prüfung [requirements-1.md](reviews/requirements-1.md) nicht bestanden (6 blockierende Befunde). B1, B4, H8, H16 vom Projektleiter bearbeitet. Entscheidungen des Auftraggebers im Chat: B2 Auslöser `Tick` verlangt echte Ticks im Datenbestand; B3 Volumen nach der Ausführung durch Teilschließung anpassen, sonst schließen und vermerken; B5, B6 Bestimmung im Indikator Markttechnik neu gefasst. Testfälle als Prüfmaterial abgegrenzt. Benennung der Betriebsarten Einzelschritt-Test und Backtest (H7). Bearbeitung: [requirements-1-response.md](reviews/requirements-1-response.md). Nachprüfung mit `check`.
