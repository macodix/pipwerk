# Bearbeitung des Prüfberichts, Durchlauf 9 (geänderte Stellen)

- Vorhaben: `strategiedesign`
- Prüfbericht: [requirements-9.md](requirements-9.md)
- Rolle: Projektleiter
- Stand: 2026-10-19

Alle blockierenden Befunde folgen aus Festlegungen des Auftraggebers vom 2026-10-19. Der Projektleiter hat sie ohne neue Entscheidung korrigiert. Was die QA der Spezifikation zuordnet, bleibt dem Softwarearchitekten.

| Befund | Bearbeitung |
|---|---|
| B1 | req-ui-015: Werte der Bausteine sind alles, was ein Ausdruck ansprechen kann, einschließlich `Order`, `Position`, `Strategie` und Ergebnissen vorangehender Elemente. Darstellung in den Bausteinen: Spezifikation. |
| B2 | req-fach-036: Namen mit Leerzeichen und Umlauten. Schreibweise im Ausdruck als „Offen für die Spezifikation“ gekennzeichnet. |
| B3 | `Name` statt `Bezeichnung` in req-fach-035 (Regel, Instanz mit eigenem Namen), req-fach-046 (Strategie), req-param-005, req-ui-003, req-ui-005, req-ablauf-002, req-ablauf-004, req-ablauf-008. Glossar bereits durch den Softwarearchitekten. `Bezeichnung` des Instruments bleibt (Eigenschaft des Instruments). |
| B4 | Durch den Softwarearchitekten im Glossar erledigt. |
| B5 | Parameter `Instrument` ergänzt: req-fach-046, Tabelle req-fach-051 (`Instrument`, `Kerze`, `Tick`), req-fach-054 Satz 3 und Tabelle, `indikator-markttechnik.md` Abschnitt 2. |
| H1 | req-ui-017: „Objekte der Anwendung“ statt „Markt und Konto“. Der eigene Bereich gehört zur Zeichenfläche, die Regeln aus req-fach-051 gelten unverändert. |
| H2, H5, H6 | Spezifikation. |
| H3 | Durch den Softwarearchitekten im Glossar erledigt (Eintrag „Element“). |
| H4 | req-ablauf-007: „Eingang ohne Wert“ als eigener Punkt, ausgenommen optionale Parameter und Parameter, deren Wert erst bei der Anwendung übergeben wird. Kreise über Datenverbindungen: Spezifikation. |
| H7 | Entscheidung des Auftraggebers, für die Testfälle nicht nötig. In req-fach-053 und `scope.md` als offen gekennzeichnet. |
| H8 | `ZigZag` in Abschnitt 9 Punkt 9 und in `scope.md` ergänzt. |
| H9 | Erste Lesart festgehalten (req-fach-054, `indikator-markttechnik.md` Abschnitt 1): `Markttechnik` rechnet selbst nach dem Verfahren des `ZigZag`, ohne eigene ZigZag-Instanz. Namen der ZigZag-Eigenschaften: Spezifikation. |
| H10 | req-fach-046: Belegung über eine Datenverbindung ergänzt. Glossar bereits durch den Softwarearchitekten. |
