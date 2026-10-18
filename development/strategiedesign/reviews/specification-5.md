# Prüfbericht QA – Änderung von Spezifikation und Plan in Phase 4, Durchlauf 5 (geänderte Stellen)

- Bezug: `strategiedesign/wp02`, Prüfauftrag `development/strategiedesign/reviews/specification-5-order.md`
- geprüfter Commit: `dc65da1a3d067f7a680737d896095118d94c8c75` (`origin/main`, letzter Commit, der den Prüfauftrag ändert)
- Maßstab: `git diff dc65da1a3d067f7a680737d896095118d94c8c75~1 dc65da1a3d067f7a680737d896095118d94c8c75 -- development/strategiedesign/specification.md development/strategiedesign/plan.md`
- Art: erster Durchlauf zu dieser Änderung, vollständig für die geänderten Stellen (Entwicklungsverfahren, „Umfang der Prüfungen“). Keine Testumgebung nötig und keine verwendet.

## Ergebnis: nicht bestanden

1 blockierender Befund (B1), 7 Hinweise (H1 bis H7).

## Grundlagen der Prüfung

- Spezifikation und Plan im geprüften Commit, vollständig gelesen; der Diff zum Vorgänger
- `anforderungen-strategiedesigner.md`: req-fach-015, req-ablauf-002, req-ablauf-007, Änderungsnachweis vom 2026-10-18
- `fachmodell.md`: req-fach-046, req-fach-047, req-fach-049a, req-fach-051, req-fach-053, Änderungsnachweis vom 2026-10-18
- `scope.md`, Abschnitte „Offene Punkte des Auftraggebers“ und „Stand“
- `reviews/specification-4.md` (Hinweise H1 bis H7), `reviews/requirements-8.md` (B1, H1 bis H4)
- Testfalldokumente `contracts/strategies/v1/testcases/str-01.strategy.json` und `str-03.strategy.json` (Elementtypen, Verbindungen, Vorkommen von `Kerze.`)
- Entwicklungsverfahren, Abschnitte „Meldungen“ und „Umfang der Prüfungen“

## Ergebnis je Prüffrage

### 1. Setzen die geänderten Stellen die geänderten Anforderungen richtig und vollständig um?

Teilweise erfüllt, siehe B1.

- Strategie ohne Auslöser: Die Zeile „Strategie ohne Auslöser“ ist aus 3.6 entfernt. Der Absatz unter der Tabelle sagt: „Eine Strategie ohne Auslöser ist kein Befund“. Das passt zu req-fach-015 („kann Auslöser haben, muss aber nicht“) und req-fach-046 („`Auslöser` -- 0..n“).
- Abschnitt 1, Tabelle der Abweichungen: „beliebig viele Auslöser, auch keiner, in der Strategie und in der Verwaltung“. Das passt zu req-fach-015 und req-fach-049a.
- 3.3, Absatz „Verbindung“: „auch ihre Auslöser, falls sie welche hat“. Das passt zu req-fach-015 und req-fach-049a.
- `Kerze` ohne Instanz (3.6, Zeile zu `Kerze`): Die Zeile übernimmt „oder kein Auslöser“ aus req-fach-051 in der Fassung vom 2026-10-18. Sie legt zusätzlich fest, für welche Teile des Ablaufs „kein Auslöser“ gilt. Das füllt die in `requirements-8.md` H4 gestellte Frage. Dazu H3.
- Leere Zeichenfläche (5.2, Zeile „Strategie anlegen“): „öffnet eine leere Zeichenfläche ohne Elemente“. Das entspricht req-ablauf-002 wörtlich. Das Feld „Vorgabe der neuen Strategie“ ist aus 3.1 entfernt, auch aus dem Absatz unter der Tabelle. Die Zeile im Status nennt den Wegfall.
- Hinweis „kein Element ‚Order aufgeben‘ erreichbar“: Er wird nach der geänderten Zeile nur gemeldet, wenn der Hauptablauf einen Auslöser hat. Das weicht von req-ablauf-007 ab, siehe B1.

### 2. Widersprechen unveränderte Stellen den geänderten Stellen oder Anforderungen?

Kein unmittelbarer Widerspruch im Text. Eine unveränderte Zeile setzt für Fehlerfreiheit weiterhin einen Auslöser voraus, siehe H1 und H2.

Durchsucht habe ich alle Stellen zu „Auslöser“, „Kerzenschluss“, „Verwaltung“, „leere Zeichenfläche“ und „Neue Strategie“ in Spezifikation und Plan.

- Spezifikation 3.2 (Auslöser `Kerzenschluss`, `Tick`), 5.1 (Auslöser in der Elementbibliothek), Abschnitt 6 (Testfälle mit Auslösern), Abschnitt 7, Browsertest „aus der leeren Zeichenfläche“: Sie passen zu den geänderten Stellen. Abschnitt 7 widerspricht jetzt nicht mehr 5.2. Vorher öffnete „Neue Strategie“ eine Zeichenfläche mit `Kerzenschluss`.
- Spezifikation 3.6, Zeile „Element des Ablaufs ohne eingehende Verbindung“: Sie ist unverändert. Nach dem neuen Absatz trifft sie das erste Element jedes Ablaufs ohne Auslöser. Siehe H1.
- Plan `wp01`, Abnahmekriterium 5 („entfernten Auslöser“) und Tabelle der Abdeckung, Zeile „1 Abweichungen“: Sie beziehen sich auf die alte Fassung, siehe H6.

### 3. Ist Abnahmekriterium 2 von `wp02` erfüllbar und prüfbar? Meldet 3.6 für eine leere Strategie keinen Befund?

Nach der geänderten Spezifikation ja. Ich bin jede Zeile der Tabelle in 3.6 für ein Dokument ohne Elemente, ohne Regeln und ohne Strategieparameter durchgegangen. Jede Zeile setzt ein Element, eine Instanz, eine Regel, einen Ausdruck oder einen Parameter voraus. Die Zeile „kein Element ‚Order aufgeben‘ … erreichbar“ ist durch „nur gemeldet, wenn der Hauptablauf mindestens einen Auslöser hat“ ausgenommen. Der Auftraggeber kann das Kriterium in der Testumgebung prüfen: Die Zahl der Befunde steht in der Kopfzeile, Befunde ohne Element stehen in der Eigenschaftenansicht der Strategie (5.4).

Die Erfüllbarkeit beruht aber genau auf der Ausnahme, die B1 beschreibt. Nach req-ablauf-007 ist für eine leere Strategie der Hinweis „Kein Element ‚Order aufgeben‘ erreichbar“ zu erwarten.

### 4. Ist jeder geänderte Teil einem Paket zugeordnet, ist der Plan widerspruchsfrei, und sind H1, H4, H5 und H6 aus `specification-4.md` erledigt?

Zuordnung erfüllt. Die Hinweise sind zum Teil erledigt, siehe H4 und H5.

- Zuordnung: Die Änderung von 3.6 steht bei `wp02` in Umfang, Nicht-Umfang, umgesetzten Teilen und in der Tabelle der Abdeckung (Zeile „3.1 bis 3.6“). Abschnitt 1, 3.3 und 5.2 sind über die Zeilen „1 Gegenstand“ (`wp02` Oberfläche), „3.1 bis 3.6“ und „5.2 Strategie anlegen“ (`wp02`) zugeordnet. Abschnitt 1 Abweichungen und 3.3 ändern nur den Text. Sie verlangen außer 3.6 keine eigene Umsetzung. Siehe aber H6.
- `wp03` bleibt widerspruchsfrei: Es ändert die Bibliothek nicht und hängt von `wp02` ab.
- H1 (höchstens ein Ausgang mit der Verwaltung): erledigt in 3.1, Zeile „Ausgänge“. Die Zeile beantwortet auch die Frage, wer das prüft: Die Typbeschreibung „wird nicht angemeldet“, also prüft das Elementregister (3.1). Im Plan steht es unter `wp02` Umfang („höchstens einer je Typ“).
- H4 (Angaben bei Eigenschaften): Die zulässigen Werte sind in der Zeile „Eigenschaften“ ergänzt. Die erlaubten Bindungsarten, die H4 ebenfalls nennt, fehlen dort weiterhin. Siehe H4 unten.
- H5 (Angabe bei `wp01` zu weit): erledigt. `wp01` nimmt die ergänzten Felder von 3.1 und die Änderung von 3.6 aus.
- H6 (Tests und Dokumentation der Bibliothek): im Umfang von `wp02`, in den umgesetzten Teilen und in der Tabelle der Abdeckung erledigt. Die technischen Nachweise von `wp02` nennen diese Tests nicht. Siehe H5 unten.

### 5. Lassen sich `str-01` und `str-03` weiterhin vollständig gestalten, speichern und laden, ohne Fehler der Konsistenzprüfung?

Nach den Dokumenten ja. Geprüft habe ich das nur in Spezifikation und Testfalldokumenten, nicht in einer laufenden Anwendung.

- `str-01.strategy.json`: Auslöser `trigger.candle_close` im Hauptablauf, `trigger.tick` und `trigger.candle_close` in der Verwaltung. Kein Ausdruck verwendet `Kerze.`.
- `str-03.strategy.json`: je ein `trigger.candle_close` im Hauptablauf und in der Verwaltung. `Kerze.schluss` kommt zweimal vor: in der Berechnung `stop` im Hauptablauf und in `stop_neu` in der Verwaltung. Beide werden nur von einem `Kerzenschluss` ihres Ablaufs erreicht. Die geänderte Zeile zu `Kerze` meldet daher nichts.
- Die Regeln `risiko` und `mindestvolumen` verwenden `Kerze` nicht.
- Die Zeile „kein Element ‚Order aufgeben‘ … erreichbar“ trifft beide Testfälle nicht: In beiden erreicht der Auslöser des Hauptablaufs „Order aufgeben“, und sie ist ohnehin nur ein Hinweis.

## Blockierende Befunde

### B1 – Hinweis „Kein Element ‚Order aufgeben‘ erreichbar“ entfällt ohne Auslöser, req-ablauf-007 verlangt ihn

- Fundstelle: Spezifikation 3.6, letzte Zeile der Tabelle („nur gemeldet, wenn der Hauptablauf mindestens einen Auslöser hat“) und Absatz darunter („eine neue, leere Strategie erhält bei ‚Prüfen‘ keinen Befund“). Plan `wp02`, Umfang („Hinweis … nur mit Auslöser im Hauptablauf“), und Abnahmekriterium 2 („‚Prüfen‘ meldet dafür keinen Befund“).
- Anforderung: req-ablauf-007: „Sie findet mindestens: … Kein Element ‚Order aufgeben‘ erreichbar (Hinweis)“. Die Anforderung kennt keine Ausnahme für Strategien ohne Auslöser. Die Entscheidung des Auftraggebers vom 2026-10-18 (Änderungsnachweise beider Dokumente, `scope.md` „Stand“) betrifft die Auslöser und die leere Zeichenfläche. Sie sagt nichts dazu, welche Befunde eine Strategie ohne Auslöser oder eine leere Strategie erhält.
- Sachverhalt: In einer leeren Strategie gibt es kein Element „Order aufgeben“, also ist auch keines erreichbar. Nach dem Wortlaut von req-ablauf-007 ist das ein Hinweis. Die Spezifikation meldet ihn nicht. Dasselbe gilt für jede Strategie ohne Auslöser im Hauptablauf, auch wenn sie Elemente, aber kein „Order aufgeben“ hat. Das neue Abnahmekriterium 2 beruht auf dieser Ausnahme. Die Ausnahme steht weder in der Tabelle der Abweichungen (Abschnitt 1) noch unter den Festlegungen zur Bestätigung (Abschnitt 10). Sie ist also keine Entscheidung des Auftraggebers. Ein Abnahmekriterium und eine Anforderung zu ändern ist nach dem Entwicklungsverfahren („Meldungen“, Absatz nach der Tabelle) nicht rein technisch.
- Fragen:
  - Gilt req-ablauf-007 „Kein Element ‚Order aufgeben‘ erreichbar“ auch für eine Strategie ohne Auslöser, und insbesondere für eine leere Strategie?
  - Wenn „erreichbar“ ohne Auslöser nicht bestimmbar ist, weil der Beginn der Auswertung offen ist (req-fach-047): Wer entscheidet, ob der Hinweis bis zur Klärung entfällt? Ist das eine Festlegung, die der Auftraggeber bestätigen muss?
  - Hat der Auftraggeber „keinen Befund für die leere Strategie“ als Abnahmekriterium so gewollt?

## Hinweise (verhindern das Bestehen nicht)

### H1 – Ablauf ohne Auslöser ist mit Elementen nie fehlerfrei

- Fundstelle: Spezifikation 3.6, Zeile „Element des Ablaufs ohne eingehende Verbindung“ (unverändert) und neuer Absatz unter der Tabelle („Das erste Element eines Hauptablaufs oder einer Verwaltung ohne Auslöser … wird als ‚Element des Ablaufs ohne eingehende Verbindung‘ gemeldet“). Dazu Abschnitt 1, Tabelle der Abweichungen („auch keiner“).
- Anforderungen: req-fach-015 (Auslöser optional), req-ablauf-007 („Element des Ablaufs ohne Verbindung (Fehler)“, letzter Absatz: „Eine Strategie mit Fehlern kann nicht ausgeführt werden“). Grundsatz des Auftraggebers in `scope.md`: „keine Einschränkung ohne klare Notwendigkeit“.
- Sachverhalt: Nach der Spezifikation hat jede Strategie mit mindestens einem Element des Ablaufs und ohne Auslöser einen Fehler. Für jede Verwaltung ohne Auslöser gilt dasselbe. Eine solche Strategie kann nach req-ablauf-007 nie ausgeführt werden. Fehlerfrei und mit Ablauf ist eine Strategie also weiterhin nur mit Auslöser. Die Spezifikation legt das bewusst als Übergang fest („Bis dahin“). req-ablauf-007 sagt „ohne Verbindung“, nicht „ohne eingehende Verbindung“. Ein erstes Element mit einer abgehenden Verbindung hat nach dem Wortlaut eine Verbindung. Die Frage, wie „ohne Verbindung“ gemeint ist, liegt als `requirements-8.md` H2 beim Projektleiter. Die Testfälle sind nicht betroffen.
- Frage: Ist dem Auftraggeber bewusst, dass „Auslöser optional“ nach dieser Spezifikation bis zur Klärung nur für leere Abläufe fehlerfrei möglich ist? Soll diese Festlegung wie die anderen vorläufigen Festlegungen in Abschnitt 10 zur Bestätigung stehen?

### H2 – Verbindung vom Ausgang `gestellt` zum ersten Element einer Verwaltung nicht geregelt

- Fundstelle: Spezifikation 3.3, Absatz „Verbindung“ (Quelle ist jedes Element mit jedem Ausgang); 5.3 („Die Verwaltung erscheint als Rahmen, der mit dem Ausgang `gestellt` verbunden ist“); 3.6, neuer Absatz (erstes Element einer Verwaltung ohne Auslöser hat keine eingehende Verbindung).
- Sachverhalt: In den Testfalldokumenten geht keine Verbindung vom Ausgang `gestellt` aus. Die Zugehörigkeit zur Verwaltung steht am Element (3.3, Absatz „Element“). Die Spezifikation schließt eine Verbindung von `gestellt` zu einem Element der Verwaltung aber nicht aus. Gibt es sie, hat das erste Element einer Verwaltung ohne Auslöser eine eingehende Verbindung. Dann stimmt die Aussage im neuen Absatz nicht. Es ist dann auch unklar, ob ein Auslöser des Hauptablaufs dieses Element im Sinne der Zeile zu `Kerze` „in seinem Ablauf“ erreicht. Das ist die Frage aus `requirements-8.md` H3, hier für die Spezifikation.
- Frage: Ist eine Verbindung vom Ausgang `gestellt` zulässig? Wenn ja, was gilt dann für die Befunde „ohne eingehende Verbindung“ und `Kerze` ohne Instanz?

### H3 – Geltungsbereich der Zeile zu `Kerze` ohne Instanz nicht vollständig bestimmt

- Fundstelle: Spezifikation 3.6, Zeile „`Kerze` ohne Instanz …“.
- Sachverhalt: Die Zeile regelt zwei Fälle: Elemente nach ihrem Ablauf und Regeln der Strategie nach den Auslösern „der Strategie“. Offen bleibt:
  - ob zu den Auslösern „der Strategie“ auch die Auslöser der Verwaltungen zählen. In `str-01` hat die Verwaltung einen Auslöser `Tick`. Eine Regel der Strategie, die `Kerze` verwendet, wäre je nach Lesart ein Fehler oder nicht. Die Regeln der Strategie gelten für jede Order (req-fach-046), auch für eine Order, die in einer Verwaltung aufgegeben wird.
  - was für Regeln eines Elements gilt und für eigene Eigenschaften von Instanzen eines Indikators oder Trends, die `Kerze` verwenden.
  - Eine Verwaltung ohne eigene Auslöser in einem Hauptablauf mit `Kerzenschluss` ergibt nach der Zeile einen Fehler. req-fach-051 sagt nur „startet … kein Auslöser die Auswertung“. Die Spezifikation entscheidet damit die Frage aus `requirements-8.md` H4, ohne das als Festlegung in Abschnitt 10 zu nennen.
  
  Die Testfälle sind nicht betroffen (siehe Prüffrage 5).
- Frage: Welche Auslöser zählen bei Regeln der Strategie? Gilt die Zeile auch für Regeln eines Elements und für Ausdrücke in Instanzen? Soll die Festlegung zur Verwaltung ohne Auslöser dem Auftraggeber zur Bestätigung vorgelegt werden?

### H4 – `specification-4.md` H4 nur teilweise erledigt

- Fundstelle: Spezifikation, Status, Zeile „ergänzung in Phase 4“ („H4 in Abschnitt 3.1 (zulässige Werte bei Eigenschaften)“); 3.1, Zeile „Eigenschaften“; Absatz „Bindungsarten“ in 3.1.
- Sachverhalt: H4 nannte zwei fehlende Angaben in der Zeile „Eigenschaften“: zulässige Werte und erlaubte Bindungsarten. Ergänzt sind nur die zulässigen Werte. Der Absatz „Bindungsarten“ gilt weiter für Parameter und Eigenschaften, die Zeile „Parameter“ nennt die Bindungsarten, die Zeile „Eigenschaften“ nicht.
- Kritikpunkt: Der Status klingt so, als sei H4 vollständig erledigt.

### H5 – Technische Nachweise von `wp02` nennen die neuen Tests von Bibliothek und Backend nicht

- Fundstelle: Plan `wp02`, Absatz „Technische Nachweise im Prüfbericht der QA“ („darin die Tests der Oberfläche und die Browsertests …“). Dagegen `wp02` Umfang („Tests der Bibliothek und des Backends für beide Änderungen“).
- Sachverhalt: `specification-4.md` H6 nannte diese Stelle ausdrücklich. Der Umfang ist ergänzt, der Satz zu den Nachweisen nicht. Das Prüfskript führt nach Abschnitt 7 vermutlich alle Tests aus; das habe ich nicht geprüft.
- Frage: Sollen die Tests der Bibliothek und des Backends zu 3.1 und 3.6 im Nachweis der Abnahme von `wp02` genannt werden?

### H6 – Angaben zu `wp01` beziehen sich auf die alte Fassung von 3.6

- Fundstelle: Plan `wp01`, Abnahmekriterium 5 („mindestens für: entfernten Auslöser“); Tabelle der Abdeckung, Zeile „1 Abweichungen von den Vorlagen“ (nur `wp01` für „Auslöser“).
- Sachverhalt: `wp01` ist `done`. Kriterium 5 gibt daher den abgenommenen Stand wieder. Nach der geänderten Fassung ergibt „entfernter Auslöser“ keinen eigenen Befund mehr, nur noch Folgebefunde wie „ohne eingehende Verbindung“. Die Abweichung „auch keiner“ setzt erst die Änderung von 3.6 in `wp02` um. Die Zeile der Tabelle nennt dafür nur `wp01`. Die Zeile „3.1 bis 3.6“ ordnet die Änderung richtig `wp02` zu.
- Frage: Soll die Zeile „1 Abweichungen“ den Teil „auch keiner“ `wp02` zuordnen?

### H7 – Glossar „Auslöser“ widerspricht der geänderten Spezifikation, Plan ordnet die Berichtigung nicht zu

- Fundstelle: Spezifikation Abschnitt 9, Punkt Glossar („Berichtigung der Einträge, die dieser Spezifikation widersprechen“); Plan `wp02` Umfang und Tabelle der Abdeckung, Zeile „9 Glossar“ (nur „Typbeschreibung“ und neue Begriffe der Oberfläche).
- Sachverhalt: `docs/technical/glossar.md`, Eintrag „Auslöser“ („Jede Strategie hat mindestens einen Auslöser“), widerspricht jetzt Abschnitt 1 und 3.6 der Spezifikation. Das ist `requirements-8.md` B1. Der Inhalt des Glossars ist nicht Gegenstand dieser Prüfung, und der Befund liegt beim Projektleiter. Geprüft ist hier nur, dass der Plan keinem Paket die Berichtigung zuordnet.
- Frage: Wird die Berichtigung über `requirements-8.md` erledigt, oder gehört sie nach Abschnitt 9 in `wp02`?

## Nicht geprüft

- Dokumente des Auftraggebers und das Glossar inhaltlich (laut Prüfauftrag nicht Gegenstand, `requirements-8.md`)
- Beginn der Auswertung ohne Auslöser (laut Prüfauftrag offen und nicht Gegenstand)
- Code und Testumgebung; die Umsetzung folgt in den Aufträgen von `wp02`
- unveränderte Stellen außerhalb von Prüffrage 2
