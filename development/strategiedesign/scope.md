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
- Strategiedesigner: Grundausstattung an mitgelieferten Objekten über EMA, ATR, ZigZag und Markttechnik hinaus, Anmeldung für die Web-API, Regeln als eigene Elemente (req-ui-012 vorläufig).
- Fachmodell und Strategiedesigner: Auswertung einer Strategie oder Verwaltung ohne Auslöser, zum Beispiel Start von Hand (req-fach-015, req-fach-046), betrifft die Ausführung.
- Aus den Nachprüfungen, alle die Ausführung betreffend: Bezug von `VORHER` bei mehreren Auslösern (req-fach-014), Geltungsdauer eines mit `Parameter setzen` gesetzten Werts (req-fach-047), Maßnahme nach der Prüfung mit dem Ausführungspreis (req-fach-021), Regel zur freien Margin (req-fach-049), Anpassung bei verändertem Spread (`str-01`).

Vormerkung außerhalb des Vorhabens, für die Anforderungen an den Strategietester, sobald sie angelegt werden: Die Objekte der Anwendung erhalten im Strategietester einstellbare Werte je Testlauf (angenommenes Kapital, Spread, Brokerbedingungen), damit der Test eine Kontoentwicklung zeigt und verschiedene Broker verglichen werden können.

## Stand

Phase 2. Prüfschleife der Dokumente des Auftraggebers: [requirements-1.md](reviews/requirements-1.md) (43 Befunde, [requirements-1-response.md](reviews/requirements-1-response.md), Präsentation [requirements-1.html](presentations/requirements-1.html)), [requirements-2.md](reviews/requirements-2.md) (5 blockierende Befunde, [requirements-2-response.md](reviews/requirements-2-response.md)), [requirements-3.md](reviews/requirements-3.md) (3 blockierende Befunde, [requirements-3-response.md](reviews/requirements-3-response.md)), [requirements-4.md](reviews/requirements-4.md) und [requirements-5.md](reviews/requirements-5.md) (je 1 blockierender Befund aus einer Bearbeitung des Projektleiters, selbst korrigiert, [requirements-4-response.md](reviews/requirements-4-response.md), [requirements-5-response.md](reviews/requirements-5-response.md)), [requirements-6.md](reviews/requirements-6.md) (2 Befunde zur Regelvorlage „Risiko je Trade“, vom Auftraggeber entschieden: Abbildung im Ausdruck ist Sache der Spezifikation, [requirements-6-response.md](reviews/requirements-6-response.md)). Alle Befunde, die eine Entscheidung brauchten, vom Auftraggeber im Chat am 15. und 16. Oktober 2026 entschieden. Grundsatz des Auftraggebers: keine Einschränkung ohne klare Notwendigkeit. Phase 2 erneut mit `specify` angestoßen: Nachprüfung durch die QA, danach Spezifikation.

Phase 4, `wp02`: Ergänzung der Typbeschreibung (Spezifikation 3.1, [specification-4.md](reviews/specification-4.md)) vom Auftraggeber im Chat am 18. Oktober 2026 als rein technisch bestätigt, ausgenommen „Vorgabe der neuen Strategie“. Dazu Entscheidung des Auftraggebers: Auslöser sind optional, „Neue Strategie“ öffnet eine leere Zeichenfläche (req-fach-015, req-ablauf-002, req-fach-046). Auf Entscheidung des Auftraggebers ohne getrennten Rückweg: Der Softwarearchitekt arbeitet die Änderung in `wp02` ein, `wp02` läuft weiter.

2026-10-19: `wp02` nicht abgenommen ([Abnahmebericht](wp02/acceptance/1.md), Mängel M1 bis M17). Neue und geänderte Anforderungen: req-system-024 (`anforderungen-gesamtsystem.md`); req-fach-015, req-ui-014 bis req-ui-017, req-ablauf-003, req-ablauf-007 (`anforderungen-strategiedesigner.md`); req-fach-046, req-fach-053, req-fach-054 (`fachmodell.md`); `indikator-markttechnik.md`. Entscheidung des Auftraggebers: zuerst diese Änderungen, danach `wp03`. Rückweg in Phase 1 mit `check`, danach Phase 2 mit klickbarem Prototyp der gesamten Oberfläche einschließlich der Teile von `wp03`, danach Spezifikation und neuer Plan.

2026-10-19: Prüfung der geänderten Stellen [requirements-9.md](reviews/requirements-9.md) nicht bestanden (5 blockierende Befunde, alle Folge einer Festlegung). Vom Projektleiter bearbeitet ([requirements-9-response.md](reviews/requirements-9-response.md)), Nachprüfung mit `check`.
