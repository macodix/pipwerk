# Prüfbericht Dokumente des Auftraggebers, Durchlauf 19 (QA)

- Ergebnis: **nicht bestanden** (1 blockierender Befund)
- Geprüfter Stand: `2db0ef80a8a33fb02ef31fb07c048bd8adb7c36b` (`main`, Commit des Prüfauftrags). Maßstab: Diff `9368ef6^..429bf6f` unter `docs/design`.
- Geprüft: req-fach-055 und Änderungsnachweis (`fachmodell.md`), req-ui-014 und Änderungsnachweis (`anforderungen-strategiedesigner.md`), Vermerk in `specification-3.html`, Glossar, `str-01`, `str-03`.

## Blockierende Befunde

### B1 – Verwendung einer Instanz des Hauptablaufs in einer Verwaltung mit eigenen Auslösern

- Zuordnung: folgt aus einer Festlegung (Vermerk der Bestätigung vom 2026-10-23 in `specification-3.html`, Punkt 24: „Stand der Instanz in der Verwaltung und ‚Aktualisieren‘ in den Testfällen bestätigt“; Folie Punkt 24: Ein EMA aus dem Hauptablauf zeigt in der Verwaltung den Wert vom Aufgeben der Order, den aktuellen Wert liefert „Aktualisieren“).
- Fundstelle 1: `fachmodell.md` req-fach-055, neuer Satz im ersten Absatz: „Verwendbar ist eine Instanz nur an Stellen, die eine Auswertung ausschließlich über die Stelle ihrer ersten Verwendung erreicht.“ Eine Verwaltung mit eigenen Auslösern wird nach req-fach-049a nicht über den Hauptablauf erreicht, sondern von ihren Auslösern. Nach dem Wortlaut ist dort keine Instanz des Hauptablaufs verwendbar, die Konsistenzprüfung meldet einen Fehler (req-ui-014). Das widerspricht der bestätigten Festlegung, dass die Instanz dort ihren Stand vom Aufgeben der Order behält und sich aktualisieren lässt. Eine Ausnahme für die Verwaltung oder für „Aktualisieren“ steht weder in req-fach-055 noch in req-ui-014.
- Fundstelle 2: `fachmodell.md` req-fach-055, Abschnitt „Offen“, Punkt „Verwaltung einer Order mit eigenen Auslösern“ steht weiter als offen mit „Vorschlag des Projektleiters“, obwohl der Vermerk den Stand in der Verwaltung als bestätigt nennt. Nur der Hinweis auf die Festlegung fehlt in den Dokumenten; der Vermerk nennt als Eintragsorte nur req-fach-055 und req-ui-014.
- Auswirkung auf die Testfälle: `str-03` Abschnitt 4 (Verwaltung mit `Kerzenschluss`, Kreuzen und neuer Stop-Loss aus EMA und ATR) und `str-01` Abschnitt 6 (Verwaltung mit `Tick`/`Kerzenschluss`, ZigZag, Stop-Loss) lassen sich gestalten, wenn die Verwaltung eigene Instanzen mit eigenem Namen hat. Verwenden sie Instanzen des Hauptablaufs, wie es die bestätigte Festlegung vorsieht, ist das nach dem Wortlaut ein Fehler und die Strategie lässt sich nicht fehlerfrei speichern.
- Kritikpunkt/Frage: Wie ist die Verwaltung im Satz „Verwendbar ist eine Instanz nur …“ berücksichtigt, und wo ist die bestätigte Festlegung zum Stand in der Verwaltung und zu „Aktualisieren“ dort festgehalten (anstelle des offenen Punkts)?

## Vollständigkeit gegenüber dem Vermerk

- Punkt 23 (keine Methoden, Aktualisieren, eigene Vorlage übernimmt es; „vorheriger Wert von“ deckt den Wert vor n Kerzen ab): in req-fach-055 vollständig; der Baustein steht in req-ui-016 (Zeile 338), `VORHER(…; n)` in req-fach-014. Kein Befund.
- Punkt 24 erster Teil (Instanz nur an Stellen über die erste Verwendung, Bausteine und Verbinden bieten sie sonst nicht an, Fehler der Konsistenzprüfung bei Verwendung im Ausdruck): in req-fach-055 und req-ui-014 enthalten. Zweiter Teil (Verwaltung): siehe B1.

## Hinweise (je eine Zeile)

- H1 (folgt aus Festlegung): req-ablauf-007 listet die Fehler der Konsistenzprüfung „mindestens“, die neue Prüfung (Instanz in einem Ausdruck an einer Stelle, die sie nicht verwendbar erreicht, req-ui-014) fehlt dort; Fundstelle `anforderungen-strategiedesigner.md` req-ablauf-007.
- H2 (Sache der Spezifikation/Glossar): Glossar „Methode“ nennt als Beispiel „der Wert eines Indikators vor einer Anzahl Kerzen“, die mitgelieferten Objekttypen haben nun keine Methoden; das Beispiel kann als Eigenschaft der Mitgelieferten missverstanden werden.
- H3 (Sache der Spezifikation): Glossar „Aktualisieren“ und „Namensraum“ erwähnen die Beschränkung der Verwendbarkeit (neuer Satz in req-fach-055) nicht; der Begriff „Stelle ihrer ersten Verwendung“ wird dort nicht für Zusammenläufe verschiedener Auslöser erläutert.
- H4 (Lücke, Hinweis): Ob „Aktualisieren“ eine Instanz auch an einer sonst nicht verwendbaren Stelle (anderer Zweig) verwendbar macht, sagt req-fach-055 nicht; nur in Verbindung mit B1 relevant.
- H5 (offener Punkt, eindeutig gekennzeichnet): „Stand einer Instanz bei Rückführung“ und „Stand von `Tick` ohne Instanz“ in req-fach-055 sind als offen gekennzeichnet. Kein Befund.

Widersprüche zu req-fach-014, req-ui-015/-016, req-ablauf-003 und scope.md: keine gefunden. Die zwei Zeilen im Änderungsnachweis von req-fach-055 und die Zeile von req-ui-014 entsprechen den Änderungen.
