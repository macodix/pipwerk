# Prüfbericht QA: Dokumente des Auftraggebers, Durchlauf 8 (geänderte Stellen)

- Vorhaben: `strategiedesign`, Anlass aus Arbeitspaket `wp02`
- Phase: 1 Anforderung, Prüfung der geänderten Stellen (Rückkopplung aus Phase 4)
- Prüfauftrag: `development/strategiedesign/reviews/requirements-8-order.md`
- Geprüfter Commit: `0bc0a862b8be5b56dda496535b6d59db1588bc50` (`main`)
- Maßstab: `git diff 0bc0a862b8be5b56dda496535b6d59db1588bc50~1 0bc0a862b8be5b56dda496535b6d59db1588bc50 -- docs/design development/strategiedesign/scope.md` und die Einträge vom 2026-10-18 in den Änderungsnachweisen beider Dokumente

## Ergebnis

**Nicht bestanden.** 1 blockierender Befund, 4 Hinweise.

## Geprüft

1. Geänderte Stellen: `anforderungen-strategiedesigner.md` req-fach-015 und req-ablauf-002; `fachmodell.md` req-fach-046, req-fach-047, req-fach-049a und req-fach-051; `scope.md`, neuer Eintrag unter „Offene Punkte des Auftraggebers“; die Einträge vom 2026-10-18 in beiden Änderungsnachweisen. Die Änderungen geben die Entscheidung so wieder, wie sie im Prüfauftrag steht: Auslöser sind optional, für die Strategie und für die Verwaltung. „Neue Strategie“ öffnet eine leere Zeichenfläche. Die Auswertung ohne Auslöser ist an allen drei Stellen als offen gekennzeichnet: req-fach-015, req-fach-046 und req-fach-047. Dazu kommt der Eintrag in `scope.md`. Die Kennungen in den Änderungsnachweisen passen zu den geänderten Abschnitten.
2. Unveränderte Stellen: Ich habe alle Stellen zu „Auslöser“, „Verwaltung“, „Auswertung“, „Neue Strategie“ und „mindestens ein“ durchsucht, und zwar in diesen Dokumenten: Anforderungen an das Gesamtsystem, Anforderungen an den Strategiedesigner, Fachmodell, Indikator Markttechnik, Glossar `docs/technical/glossar.md`, `str-01` und `str-03`. Das Gesamtsystem und der Indikator Markttechnik enthalten keine solche Stelle. Das Ergebnis steht in B1 und H1 bis H4.
3. Testfälle: `str-01` hat einen Auslöser `Kerzenschluss` im Hauptablauf (Abschnitt 1). Die Verwaltung hat die Auslöser `Tick` und `Kerzenschluss` (Zeile 75). `str-03` hat einen Auslöser `Kerzenschluss` im Hauptablauf (Abschnitt 1) und einen in der Verwaltung (Abschnitt 4). Auslöser bleiben erlaubt. Der Anwender legt sie aus der Elementbibliothek auf die Zeichenfläche (Glossar „Elementbibliothek“, „Element“). Die geänderte Regel zu `Kerze` ohne Instanz in req-fach-051 betrifft nur Auswertungen ohne Auslöser. Beide Testfälle haben an jeder Stelle Auslöser, die Regel trifft sie also nicht. Nach dem Wortlaut der Dokumente lassen sich beide Testfälle weiterhin vollständig gestalten, speichern und wieder laden. Ich habe das nur in den Dokumenten geprüft, nicht in einer laufenden Anwendung.

## Blockierende Befunde

### B1 – Glossar setzt weiterhin mindestens einen Auslöser voraus

- Fundstelle: `docs/technical/glossar.md`, Abschnitt „Fachliche Begriffe“, Begriffe „Auslöser“ (Zeile 37), „Auswertung“ (Zeile 39) und „Verwaltung einer Order“ (Zeile 40). Stand des Glossars 2026-10-17, Status `accepted`, Zweck „Verbindliche Begriffe für alle Dokumente“.
- Sachverhalt: Unter „Auslöser“ steht: „Jede Strategie hat mindestens einen Auslöser.“ Das widerspricht req-fach-015 („Eine Strategie kann Auslöser haben, muss aber nicht“) und req-fach-046 („`Auslöser` -- 0..n“). „Verwaltung einer Order“ sagt: „Er läuft mit eigenen Auslösern“. Das setzt Auslöser der Verwaltung voraus. Nach req-fach-015 und req-fach-049a sind sie aber optional. „Auswertung“ legt fest, dass jede Auswertung „ausgelöst durch einen Auslöser“ wird. Das schließt die Auswertung ohne Auslöser aus, zum Beispiel einen Start von Hand. Diese Frage ist in req-fach-015 und req-fach-047 aber ausdrücklich offen. Das Glossar gilt als verbindlich für alle Dokumente und Aufträge. Ein Auftrag, der sich darauf stützt, würde weiterhin mindestens einen Auslöser verlangen. Der Befund widerspricht damit einer Anforderung.
- Frage: Sollen die drei Einträge des Glossars an die Entscheidung vom 18. Oktober 2026 angeglichen werden? Wer ist dafür zuständig, wenn das Glossar nicht zu den Dokumenten des Auftraggebers gehört?

## Hinweise

### H1 – Unveränderte Sätze in geänderten Abschnitten setzen Auslöser voraus

- Fundstelle: `anforderungen-strategiedesigner.md` req-fach-015, erster Satz („Strategieabläufe werden durch Auslöser gestartet beziehungsweise erneut ausgewertet.“) und zweiter Absatz („Die Wiederholung … ergibt sich aus erneut eintretenden Auslösern“). `fachmodell.md` req-fach-049a, dritter Absatz („Beim Stellen der Order wird sie nicht durchlaufen, sondern erst bei ihren Auslösern.“), und req-fach-049, zweiter Absatz („sie wird nicht sofort, sondern erst bei ihren eigenen Auslösern durchlaufen“).
- Sachverhalt: Wörtlich gelesen wird eine Verwaltung ohne eigene Auslöser nie durchlaufen. Ebenso wird eine Strategie ohne Auslöser nie gestartet. Diese Sätze legen damit etwas fest, was dieselben Abschnitte als offen kennzeichnen. Die Sätze betreffen die Ausführung. Für die Testfälle sind sie nicht nötig, deshalb ist der Befund nicht blockierend.
- Frage: Gelten diese Sätze nur für Strategien und Verwaltungen mit Auslösern? Oder bleibt die offene Frage durch sie schon teilweise entschieden?

### H2 – Konsistenzprüfung „Element des Ablaufs ohne Verbindung“ bei Abläufen ohne Auslöser mehrdeutig

- Fundstelle: `anforderungen-strategiedesigner.md` req-ablauf-007, zweiter Punkt; dazu `fachmodell.md` req-fach-047, dritter Absatz („Wo sie ohne Auslöser beginnt, ist offen“).
- Sachverhalt: Bisher hatte das erste Element eines Ablaufs immer eine Verbindung vom Auslöser. Ohne Auslöser hat es keine eingehende Verbindung. Ein Ablauf aus einem einzigen Element hat gar keine Verbindung. Nach req-ablauf-007 ist „ohne Verbindung“ ein Fehler, und nach dem letzten Absatz dort kann eine Strategie mit Fehlern nicht ausgeführt werden. Die Prüfung findet im Strategiedesigner statt. Sie gehört damit nicht nur zur Ausführung.
- Frage: Heißt „ohne Verbindung“ ohne eingehende Verbindung oder ohne jede Verbindung? Ist ein Ablauf ohne Auslöser mit einem oder mehreren Elementen ohne eingehende Verbindung für die Konsistenzprüfung zulässig, ein Hinweis oder ein Fehler? Oder soll das bis zur Klärung der offenen Frage offen bleiben?

### H3 – Gestalt einer Verwaltung ohne Auslöser auf der Zeichenfläche nicht beschrieben

- Fundstelle: `anforderungen-strategiedesigner.md` req-fach-015, letzter Satz des ersten Absatzes („innerhalb des Bereichs der Zeichenfläche, der am Ausgang „gestellt“ beginnt“). `fachmodell.md` req-fach-049a, dritter Absatz („Die Verwaltung ist der Teil des Ablaufs, der am Ausgang `gestellt` von `Order aufgeben` folgt“), und req-fach-051 (Verwendung von `Order` und `Position` „im Ablauf außerhalb einer Verwaltung“ ist ein Fehler).
- Sachverhalt: Bisher begann die Verwaltung mit ihren eigenen Auslöser-Elementen. Für eine Verwaltung ohne Auslöser sagen die Dokumente nicht, ob ihr erstes Element direkt mit dem Ausgang `gestellt` verbunden wird. Offen bleibt auch, woran die Konsistenzprüfung erkennt, dass ein Element zur Verwaltung gehört. Davon hängt der Fehler nach req-fach-051 ab. Beide Testfälle haben Auslöser in der Verwaltung. Deshalb ist der Befund nicht blockierend.
- Frage: Wie sieht eine Verwaltung ohne Auslöser auf der Zeichenfläche aus? Oder ist das Sache der Spezifikation?

### H4 – „kein Auslöser“ in req-fach-051 und der zugehörige Eintrag im Änderungsnachweis

- Fundstelle: `fachmodell.md` req-fach-051, erster Absatz („Startet ein anderer Auslöser oder kein Auslöser die Auswertung, muss eine Kerze mit gesetzter Zeiteinheit auf der Zeichenfläche liegen“). Dazu der Änderungsnachweis vom 2026-10-18 („`Kerze` ohne Instanz auch ohne Auslöser nur mit Instanz auf der Zeichenfläche“).
- Sachverhalt: Die Konsistenzprüfung muss im Strategiedesigner entscheiden, ob für einen Ausdruck „kein Auslöser“ gilt. Die Dokumente sagen nicht, ob das nur für eine Strategie ganz ohne Auslöser gilt. Es könnte auch für Elemente gelten, die in einer Strategie mit Auslösern von keinem Auslöser aus erreichbar sind. Ebenso könnte es für eine Verwaltung ohne eigene Auslöser gelten, deren Hauptablauf einen `Kerzenschluss` hat. Der Satz im Änderungsnachweis widerspricht sich dem Wortlaut nach („ohne Instanz … nur mit Instanz“). Gemeint ist erkennbar dasselbe wie im Text von req-fach-051.
- Frage: Für welche Teile des Ablaufs gilt „kein Auslöser“ im Sinne von req-fach-051? Soll der Eintrag im Änderungsnachweis eindeutig formuliert werden?

## Nicht geprüft

Gemäß Prüfauftrag nicht Gegenstand: `anforderungen-handelssystem.md`, die Stellen des Fachmodells zur Ausführung, die Vorlagen unter `docs/design/planning/`, Spezifikation und Plan sowie die als offen gekennzeichneten Punkte. Ob die Prüfschleife eine Ebene höher geht, entscheidet nicht die QA.
