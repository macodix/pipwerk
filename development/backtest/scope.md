# Vorhaben backtest

Vorhaben nach dem [Entwicklungsverfahren](../../docs/technical/entwicklungsverfahren.md): Strategien testen. Der Strategietester (Modul pipwerk replay) führt Strategien gegen historische Kursdaten aus, in zwei Betriebsarten: schrittweise zur Prüfung des Ablaufs und durchgehend über einen Testzeitraum mit Kontoentwicklung, Trades und Kennzahlen. Dazu gehören der Datenbestand historischer Kursdaten mit Beschaffung und Import sowie die Testkonten.

Nachweis des Vorhabens sind die beiden Testfälle: Jeder muss sich im Einzelschritt-Test prüfen und im Backtest über den vorbelegten Testzeitraum testen lassen, ohne die Strategie dafür zu bearbeiten.

## Geltende Dokumente

Anforderungsdokumente:

- [Anforderungen an das Gesamtsystem](../../docs/design/requirements/anforderungen-gesamtsystem.md)
- [Anforderungen an den Strategietester](../../docs/design/requirements/anforderungen-strategietester.md)

Fachmodell des Auftraggebers, das für dieses Vorhaben gilt und von der QA ebenfalls auf Widersprüche, Lücken und mehrdeutige Begriffe geprüft wird:

- [Fachmodell des Trading-Systems](../../docs/design/domain/fachmodell.md), insbesondere die Ausführung von Strategien, Orders, Positionen und Regeln

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
- Beschaffung über pipwerk relay (req-test-003, req-system-027): Welchen Broker ein Testlauf verwendet und woher die Beschaffung das Symbol des Brokers zum Instrument erhält (Fachmodell req-fach-053). Befund B1 aus [relay/reviews/requirements-1.md](../relay/reviews/requirements-1.md), am 2026-10-23 vom Auftraggeber in dieses Vorhaben verwiesen. Offen.

## Stand

2026-10-19: Phase 1. Offene Punkte des Anforderungsdokuments vom Auftraggeber im Chat am 19. Oktober 2026 entschieden. Prüfung der Dokumente des Auftraggebers durch die QA mit `check` angestoßen.

2026-10-20/21: Prüfung [requirements-1.md](reviews/requirements-1.md) nicht bestanden (6 blockierende Befunde). B1, B4, H8, H16 vom Projektleiter bearbeitet. Entscheidungen des Auftraggebers im Chat: B2 Auslöser `Tick` verlangt echte Ticks im Datenbestand; B3 Volumen nach der Ausführung durch Teilschließung anpassen, sonst schließen und vermerken; B5, B6 Bestimmung im Indikator Markttechnik neu gefasst. Testfälle als Prüfmaterial abgegrenzt. Benennung der Betriebsarten Einzelschritt-Test und Backtest (H7). Bearbeitung: [requirements-1-response.md](reviews/requirements-1-response.md). Nachprüfung mit `check`.

2026-10-21: Nachprüfung [requirements-2.md](reviews/requirements-2.md) nicht bestanden (N1, Indikator Markttechnik). Entscheidung des Auftraggebers: Markttechnik zurückgestellt, `str-01` bestimmt Trend und Bezüge aus den Wendepunkten des `ZigZag`. N1 entfällt damit. N5, N6 bearbeitet. Nachprüfung mit `check`.

2026-10-21: Nachprüfung [requirements-3.md](reviews/requirements-3.md) nicht bestanden (M1, M2). Festlegungen des Auftraggebers: req-test-004 Abwicklung wie ein Broker mit sichtbarem Ablehnungsgrund, req-test-008 Indikatoren ohne Werte. H4 im Fachmodell bearbeitet. Nachprüfung mit `check`.

2026-10-21: Nachprüfung [requirements-4.md](reviews/requirements-4.md) bestanden. Präsentation [requirements-1.html](presentations/requirements-1.html) zur Bestätigung durch den Auftraggeber. Bestätigt vom Auftraggeber im Chat am 21. Oktober 2026. Phase 1 abgeschlossen. Phase 2 mit `specify` angestoßen.

2026-10-21: Phase 2. Nachprüfung [requirements-5.md](reviews/requirements-5.md) bestanden. Prototyp pipwerk replay vom Auftraggeber bestätigt; Übersicht wird nach praktischer Erprobung überarbeitet. Entscheidungen zu [backtest-01](questions/backtest-01.md): Auslöser „Manuell“ (bisher „Start von Hand“) nur im Hauptablauf, im Testlauf nach req-test-015; Element „Parameter setzen“ entfällt. Antwort an den Softwarearchitekten.

2026-10-21: Spezifikation hat die Prüfung der QA bestanden ([specification-2.md](reviews/specification-2.md)). Präsentation [specification-1.html](presentations/specification-1.html) zur Bestätigung durch den Auftraggeber. Liste der Auslösertypen in den Anforderungen an den Strategiedesigner (req-fach-015) an „Manuell“ angeglichen.

2026-10-21: Präsentation [specification-1.html](presentations/specification-1.html) bestätigt vom Auftraggeber im Chat am 21. Oktober 2026. Phase 2 abgeschlossen. Phase 3 mit `plan` angestoßen.

2026-10-21: Phase 3. Arbeitspaketplan hat die Prüfung der QA bestanden ([plan-2.md](reviews/plan-2.md)). Präsentation [plan-1.html](presentations/plan-1.html) zur Bestätigung durch den Auftraggeber.

2026-10-21: Präsentation [plan-1.html](presentations/plan-1.html) bestätigt vom Auftraggeber im Chat am 21. Oktober 2026. Phase 3 abgeschlossen. `wp02` mit `implement` an den Entwicklungsleiter. `wp01` folgt nach `strategiedesign/wp02`.

2026-10-21: `wp02` zur Abnahme bereitgestellt. Auf Wunsch des Auftraggebers soll `wp01` nicht auf die Übernahme von `strategiedesign/wp02` warten, sondern auf dessen geprüftem Stand beginnen; Planänderung mit `plan` an den Softwarearchitekten.

2026-10-23: Abnahme `wp02` Versuch 1 nicht bestanden ([Abnahmebericht](wp02/acceptance/1.md)). Geänderte Anforderungen req-system-026, req-system-027 und req-test-003, Prüfung durch die QA mit `check` angestoßen.

2026-10-23: Abnahme `wp02` Versuch 2 nicht bestanden ([Abnahmebericht](wp02/acceptance/2.md)). Geänderte Anforderungen req-system-025 und req-system-026, Prüfung durch die QA mit `check` angestoßen.
