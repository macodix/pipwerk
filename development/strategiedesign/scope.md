# Vorhaben strategiedesign

Erstes Vorhaben am Produkt nach dem [Entwicklungsverfahren](../../docs/technical/entwicklungsverfahren.md): Strategien gestalten und speichern. In pipwerk Studio lassen sich Strategien und die darin verwendeten wiederverwendbaren Objekte (Indikatoren, Trends, Regeln, Regelwerke) anlegen, gestalten, prüfen, speichern und wieder laden. Die Ausführung von Strategien (Debuggen, Testen, Handeln) gehört nicht zum Vorhaben.

Nachweis des Vorhabens sind die beiden Testfälle: Jeder muss sich vollständig im Strategiedesigner gestalten, speichern und wieder laden lassen.

## Geltende Dokumente

Anforderungsdokumente:

- [Anforderungen an das Gesamtsystem](../../docs/design/requirements/anforderungen-gesamtsystem.md)
- [Anforderungen an den Trading-Strategiedesigner](../../docs/design/requirements/anforderungen-strategiedesigner.md)

Fachmodell und Strategiebeschreibungen des Auftraggebers, die für dieses Vorhaben gelten und von der QA ebenfalls auf Widersprüche, Lücken und mehrdeutige Begriffe geprüft werden:

- [Fachmodell des Trading-Systems](../../docs/design/domain/fachmodell.md)
- [Indikator Markttechnik](../../docs/design/domain/indikator-markttechnik.md)
- Testfall [Scalping Punkt 2 Ausbruch – einfache Strategie](../../docs/design/strategies/str-01-fachlich-scalping-punkt-2-ausbruch-einfach.md) (`str-01`)
- Testfall [EMA-Trendfolge](../../docs/design/strategies/str-03-fachlich-ema-trendfolge.md) (`str-03`)

Nicht Gegenstand des Vorhabens: [Anforderungen an das Handelssystem](../../docs/design/requirements/anforderungen-handelssystem.md). Das Fachmodell verweist an einigen Stellen dorthin, diese Stellen betreffen die Ausführung und werden nicht geprüft.

## Vorlagen für den Softwarearchitekten

Aus der Zeit vor dem Entwicklungsverfahren liegen ein Pflichtenheft und Arbeitspakete vor. Sie sind keine Festlegung, sondern Vorlage für Spezifikation und Plan. Wo sie den geltenden Dokumenten widersprechen, gelten die geltenden Dokumente.

- [Pflichtenheft – Strategiedesigner, Schritt 1](../../docs/design/planning/pflichtenheft-strategiedesigner.md)
- [Arbeitspakete AP2 bis AP9](../../docs/design/planning/workpackages/)

## Offene Punkte des Auftraggebers

Als offen gekennzeichnet in den geltenden Dokumenten, nicht blockierend für Phase 2:

- Fachmodell: OrderBuilder, weitere Funktionen der ersten Auswahl und deutsche Funktionsnamen (req-fach-036), Objekt Kurs für Strategien ohne Kerzen (req-fach-051), externes Ereignis als Auslöser (req-fach-053), weitere mitgelieferte Indikatoren und Expert Advisors (req-fach-054).
- Indikator Markttechnik: Bestimmung von Trend und Phase, erst für die Berechnung im Strategietester nötig.
- Strategiedesigner: Grundausstattung an mitgelieferten Objekten über EMA, ATR und Markttechnik hinaus, Anmeldung für die Web-API, Regeln als eigene Elemente (req-ui-012 vorläufig).

Vormerkung außerhalb des Vorhabens, für die Anforderungen an den Strategietester, sobald sie angelegt werden: Die Objekte der Anwendung erhalten im Strategietester einstellbare Werte je Testlauf (angenommenes Kapital, Spread, Brokerbedingungen), damit der Test eine Kontoentwicklung zeigt und verschiedene Broker verglichen werden können.

## Stand

Phase 2. Prüfbericht [requirements-1.md](reviews/requirements-1.md) aus Phase 1: nicht bestanden, 43 Befunde. 18 vom Projektleiter korrigiert, 20 vom Auftraggeber am 15. Oktober 2026 entschieden ([requirements-1-response.md](reviews/requirements-1-response.md), Präsentation [requirements-1.html](presentations/requirements-1.html) mit Vermerk der Bestätigung). Entscheidungen in die Dokumente eingearbeitet. Phase 2 mit `specify` angestoßen: Nachprüfung durch die QA, danach Spezifikation.
