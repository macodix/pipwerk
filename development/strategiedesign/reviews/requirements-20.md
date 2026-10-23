# Prüfbericht Dokumente des Auftraggebers, Durchlauf 20 (QA, Nachprüfung)

- Ergebnis: **bestanden** (kein blockierender Befund)
- Geprüfter Stand: `03660c68bbb8a41153ac469ce7075e84a0a1fbe5` (`main`, jüngster Commit, der `requirements-20-order.md` enthält). Maßstab: Diff `9576b61..09b27c5` unter `docs/design`.
- Geprüft: req-fach-055 und Änderungsnachweis (`fachmodell.md`), req-ablauf-007 und Änderungsnachweis (`anforderungen-strategiedesigner.md`), Vermerk und Punkt 24 in `specification-3.html`, Glossar, `str-01` Abschnitt 6, `str-03` Abschnitt 4.

## Prüfung der Nachprüfpunkte

1. **B1 erledigt.** req-fach-055 sagt jetzt: Die Verwaltung gilt als über „Order aufgeben“ erreicht, auch mit eigenen Auslösern (req-fach-049a). Eine Instanz des Hauptablaufs behält dort den Stand beim Aufgeben der Order, aktuelle Werte liefert Aktualisieren. Das entspricht Punkt 24 und dem Vermerk („Stand der Instanz in der Verwaltung und ‚Aktualisieren‘ in den Testfällen bestätigt“). Der offene Punkt ist entfernt, der Änderungsnachweis nennt Festlegung und Befund B1.
2. **H1 erledigt.** req-ablauf-007 führt „Instanz in einem Ausdruck an einer Stelle, an der sie nicht verwendbar ist“ als Fehler, mit Verweis auf req-fach-055 und req-ui-014. Der Änderungsnachweis nennt H1.
3. **Neue Fehler: keine blockierenden.** Kein Widerspruch zu den übrigen Sätzen von req-fach-055, zu req-fach-049a (Verwaltung am Ausgang „gestellt“, eigene Auslöser, Zeilen 332 und 360 in `fachmodell.md`), zu req-ui-014 (verweist auf req-fach-055, die Ausnahme gilt damit auch für Bausteine und Verbinden) und zu req-ablauf-007. Der Offen-Abschnitt von req-fach-055 enthält nur noch gekennzeichnete Punkte.
4. **Testfälle:**
   - `str-03` Abschnitt 4: Die Verwaltung (Auslöser `Kerzenschluss`) kann `EMA20`, `EMA50` und `ATR` des Hauptablaufs mit „Aktualisieren“ verwenden; EMA und ATR sehen Aktualisieren vor. Gestaltbar und speicherbar ohne Fehler.
   - `str-01` Abschnitt 6: Die Verwaltung (Auslöser `Tick`, `Kerzenschluss`) kann den Stop-Bezug als Stand vom Aufgeben nutzen, den ZigZag zum Neuberechnen mit „Aktualisieren“. Gestaltbar und speicherbar ohne Fehler.

## Blockierende Befunde

Keine.

## Hinweise (je eine Zeile)

- H6 (Lücke, Hinweis): `fachmodell.md` req-fach-014 (Zeile 61) und req-fach-055 sagen nicht, ob `VORHER(Instanz.Eigenschaft)` an einer Verwendung mit „Aktualisieren“ vom aktualisierten Stand ausgeht; betrifft das Kreuzen in `str-03` Abschnitt 4 (`VORHER(EMA20.Wert)`), die Gestaltung bleibt möglich.
- H7 (Sache der Spezifikation, Glossar): Glossar „Namensraum“ (Zeile 27) und „Aktualisieren“ (Zeile 56) nennen die Regel der Verwaltung nicht; „Aktualisieren“ spricht vom „Stand an der Stelle ihrer ersten Verwendung“, req-fach-055 für die Verwaltung vom „Stand beim Aufgeben der Order“. Das ist derselbe Wert, solange die Instanz vor „Order aufgeben“ nicht aktualisiert wird; sonst mehrdeutig.
- H4 (aus Durchlauf 19, unverändert): Ob „Aktualisieren“ eine Instanz an einer sonst nicht verwendbaren Stelle verwendbar macht, bleibt ungeregelt (Lücke, Hinweis). Auch ungeregelt: ob eine Aktualisierung den Stand für spätere Verwendungen ersetzt.
- H5 (aus Durchlauf 19, unverändert): Die offenen Punkte zu Rückführung und `Tick` ohne Instanz sind gekennzeichnet. Kein Befund.
