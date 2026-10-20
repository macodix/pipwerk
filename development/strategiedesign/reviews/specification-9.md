# Prüfbericht Spezifikation, Durchlauf 9

- Vorhaben: `strategiedesign`, ref `strategiedesign`
- Phase: 2, Einwände des Auftraggebers aus der Abstimmung (`revise`)
- Rolle: QA
- Prüfauftrag: `development/strategiedesign/reviews/specification-9-order.md`
- geprüfter Commit: `611b295919b82a86fcd9f1ce9792023296223685` (`origin/main`, Commit des Prüfauftrags)
- Prüfgrundlagen: Briefing QA, „Umfang der Prüfungen“ und „Fragen an den Auftraggeber“ im Entwicklungsverfahren, `development/strategiedesign/scope.md` mit den dort genannten Dokumenten, Vermerk der Bestätigung auf der letzten Folie von `presentations/specification-2.html`

## Ergebnis

**bestanden**

- Teil 1 (geänderte Stellen der Dokumente des Auftraggebers): keine blockierenden Befunde, 6 Hinweise.
- Teil 2 (überarbeitete Stellen der Spezifikation): keine blockierenden Befunde, 6 Hinweise.

Kein Befund gehört zur Gruppe „Entscheidung des Auftraggebers“. Der Bericht muss deshalb nicht an den Auftraggeber.

## Teil 1: geänderte Stellen der Dokumente des Auftraggebers

Geprüft: Commits `48cea2d`, `cc89959` und `7680948`. Das sind in `docs/design/domain/fachmodell.md` die Abschnitte req-fach-046, req-fach-047, req-fach-051 und req-fach-053, in `docs/design/requirements/anforderungen-strategiedesigner.md` die Abschnitte req-fach-015 und req-ablauf-007 und in `docs/design/requirements/anforderungen-strategietester-backtester.md` der Abschnitt 5. Die Änderungen geben den Vermerk der Bestätigung zu den Punkten 16, 17 und 19 wieder (`presentations/specification-2.html`, Zeile 174). Die geänderten Stellen widersprechen sich untereinander nicht. Sie widersprechen auch nicht den unveränderten Stellen von req-fach-049, req-fach-049a, req-ablauf-002 und den Testfällen `str-01` und `str-03`, deren Auslöser alle `Kerzenschluss` oder `Tick` sind.

### Blockierende Befunde

Keine.

### Hinweise

**T1-H1 – `scope.md` führt einen erledigten offenen Punkt weiter.**
Fundstelle: `development/strategiedesign/scope.md`, Zeile 36: „Auswertung einer Strategie oder Verwaltung ohne Auslöser, zum Beispiel Start von Hand (req-fach-015, req-fach-046), betrifft die Ausführung.“
Sachverhalt: Seit `cc89959` ist der Punkt entschieden. Belege: Fachmodell, Änderungsnachweis 2026-10-20 („offener Punkt zur Auswertung ohne Auslöser erledigt“), und req-fach-046, Zeile 331.
Zuordnung: folgt aus einer Festlegung (req-fach-015 und req-fach-046 in der Fassung vom 2026-10-20).
Kritikpunkt: In der Liste der offenen Punkte steht ein Punkt, der nicht mehr offen ist.

**T1-H2 – Neuer offener Punkt zu weiteren Bezeichnungen fester Instrumente ist nicht als „Offen:“ gekennzeichnet und fehlt in `scope.md`.**
Fundstelle: Fachmodell req-fach-053, Zeile 427: „Gültig sind bis dahin nur Bezeichnungen nach ISO; ob weitere nötig sind, wird später entschieden.“
Sachverhalt: Der Satz ist inhaltlich ein offener Punkt, trägt aber nicht die sonst übliche Kennzeichnung „Offen:“. In der Liste der offenen Punkte in `scope.md` fehlt er. Für dieses Vorhaben ist er nicht nötig, weil beide Testfälle nur das Instrument der Anwendung verwenden (Spezifikation Abschnitt 6, Zeilen 423 und 429). Instrumente ohne Bezeichnung nach ISO lassen sich bis zur Entscheidung nicht als festes Instrument eintragen, zum Beispiel Kryptowährungen wie `BTCUSD` (BTC ist kein Code nach ISO 4217) oder Rohstoff-CFDs ohne ISIN.
Zuordnung: offener Punkt.
Kritikpunkt: Kennzeichnung und Aufnahme in die Liste der offenen Punkte fehlen.

**T1-H3 – Das Beispiel „DAX“ ist nach der vorläufigen Regel keine gültige Bezeichnung.**
Fundstelle: Fachmodell req-fach-053, Zeile 427: „zum Beispiel „DAX“ dem Symbol „GER40“ bei einem Broker …“, danach: „Gültig sind bis dahin nur Bezeichnungen nach ISO“.
Sachverhalt: Das Beispiel beschreibt die spätere Kontoverwaltung. Bis dahin wäre „DAX“ ungültig und die Konsistenzprüfung meldet einen Fehler. Gültig wäre die ISIN des Index.
Zuordnung: folgt aus einer Festlegung (req-fach-053, vorläufige Regel nach ISO).
Kritikpunkt: Wer den Absatz liest, kann das Beispiel für eine heute gültige Bezeichnung halten.

**T1-H4 – Die Aufzählung, wie man ein anderes Instrument anspricht, ist enger als die erlaubten Bindungsarten.**
Fundstelle: Fachmodell req-fach-053, Zeile 427: „Ein anderes Instrument spricht er über eine Instanz an, deren Parameter `Instrument` mit einem Strategieparameter oder einem festen Instrument belegt ist, oder über das Instrument einer Order oder Position (`Order.Instrument`).“
Sachverhalt: Nach req-fach-046 (Zeile 335) lässt sich jeder Parameter auch über eine Datenverbindung belegen. In einer Vorlage lässt er sich außerdem mit einem Parameter der Vorlage belegen (Spezifikation 3.1, Zeile 66). Diese Wege nennt der Satz nicht. Im Beispiel steht nur `Order.Instrument`, obwohl der Text auch die Position nennt; `Position.Instrument` gibt es nach req-fach-052.
Zuordnung: folgt aus einer Festlegung (req-fach-046; Regel „Keine Einschränkung ohne Erfordernis“). Der Satz ist als Aufzählung von Beispielen zu lesen, nicht als Einschränkung.
Kritikpunkt: Ohne diese Lesart schränkt der Satz die Bindungsarten ein, ohne dass es dafür eine Grundlage gibt.

**T1-H5 – Es ist nicht beschrieben, wann `Start von Hand` in der Verwaltung einer Order eintritt.**
Fundstelle: Fachmodell req-fach-046, Zeile 331: „Soll eine Strategie oder Verwaltung von Hand gestartet werden, erhält sie den Auslöser `Start von Hand`“; req-fach-053, Zeile 427: „`Start von Hand` startet die Auswertung, wenn der Anwender sie im Handelssystem oder im Strategietester von Hand startet.“
Sachverhalt: Eine Verwaltung gibt es erst, wenn eine Order gestellt ist (req-fach-049a). Offen bleibt, wann ihr Auslöser `Start von Hand` eintritt: beim Start der Strategie, auf eine eigene Handlung des Anwenders für eine bestimmte Order oder für alle bestehenden Verwaltungen. Das betrifft nur die Ausführung. Im Strategiedesigner reicht es, dass der Auslöser in der Verwaltung zulässig ist; das ist er nach req-fach-015.
Zuordnung: offener Punkt, betrifft die Ausführung und wird für dieses Vorhaben nicht gebraucht.
Frage für später, nicht für dieses Vorhaben: Wann tritt `Start von Hand` in einer Verwaltung ein?

**T1-H6 – Im Strategietester ist nicht beschrieben, an welcher Stelle des Testzeitraums `Start von Hand` eintritt.**
Fundstelle: `anforderungen-strategietester-backtester.md`, Abschnitt 5 (offener Punkt 2 entfernt), req-test-006 (Zeile 65), req-test-012 (Zeile 85); Fachmodell req-fach-053, Zeile 427 („… oder im Strategietester von Hand startet“).
Sachverhalt: Mit dem gestrichenen offenen Punkt hat das Dokument keine Aussage mehr darüber, wann der Auslöser bei einem Testlauf über historische Kurse eintritt, zum Beispiel einmal zu Beginn des Testzeitraums. req-test-012 nennt außerdem den „Start“ des Testlaufs. Das kann man mit dem Auslöser `Start von Hand` verwechseln. Die Strategietester-Anforderungen sind kein geltendes Dokument laut `scope.md`. Für dieses Vorhaben hat die Lücke keine Folgen.
Zuordnung: offener Punkt, betrifft das Vorhaben des Strategietesters.
Kritikpunkt: Mit der Streichung ging eine offene Frage verloren, statt beantwortet zu werden.

## Teil 2: überarbeitete Stellen der Spezifikation

Geprüft: `git diff 2fd4197c4c21fb603fa2fe26b2825e43af619743 611b295919b82a86fcd9f1ce9792023296223685 -- development/strategiedesign/specification.md`, also Status, 3.1, 3.2, 3.3, 3.5, 3.6, 5.2, 5.3, 6, 7, Abschnitt 10 (Punkte 14, 16, 17, 19, neu 20, Folgen) und Änderungsnachweis.

Die überarbeiteten Stellen setzen die geänderten Dokumente des Auftraggebers vollständig und richtig um:

- Punkt 16 / req-fach-053, req-ablauf-007: Für Bezeichnungen nach ISO 4217 und ISO 6166 gibt es Regeln zur Prüfung. Der Fehler „festes Instrument mit ungültiger Bezeichnung“ ist in 3.6 eingetragen, der Test in Abschnitt 7. Die Prüfung, ob ein Broker das Instrument anbietet, ist richtig ausgegrenzt (3.1, Zeilen 79 bis 84; 3.6, Zeile 266; 7, Zeile 439).
- Punkt 17 / req-fach-015, req-fach-046, req-fach-047, req-ablauf-007: Der Auslöser `Start von Hand` steht in 3.2 und 5.2. Ein Element, das kein Auslöser erreicht, ist ein Fehler. Für einen Hauptablauf ohne Auslöser gibt es den Hinweis. Die Zeile zu `Kerze` ohne Instanz ist an req-fach-051 in der neuen Fassung angeglichen; dort gilt `Start von Hand` als „anderer Auslöser“. Die bisherige Regel „Element ohne eingehende Verbindung kein Befund ohne Auslöser“ ist vollständig entfernt (3.6, Zeilen 264 bis 287).
- Punkt 19 / req-fach-053: `Instrument` ohne Instanz ist überall das Instrument der Anwendung (3.1, Zeile 86). „Risiko je Trade“ und `mindestvolumen` rechnen mit `Order.Instrument` (3.5, Zeilen 227 bis 246; 6, Zeile 424). Das ist nach req-fach-051 richtig: Bei einer Position ist `Order` die Order, aus der sie entstanden ist.
- Punkt 20: Beginn einer Verwaltung ohne eigene Auslöser. Er folgt aus Punkt 17 und req-fach-049 (Zeile 361: „hat sie eigene Auslöser, wird sie nicht sofort, sondern erst bei diesen durchlaufen“). Er passt zu req-fach-049a, Zeile 380 („der Teil des Ablaufs, der am Ausgang `gestellt` … folgt“). 3.3, 3.6 und 5.3 sind untereinander stimmig.
- Punkt 14: Der Text gibt den Vermerk der Bestätigung wörtlich wieder.

### Blockierende Befunde

Keine.

### Hinweise

**T2-H1 – Strategien im Format 1.0 mit einer Verwaltung ohne eigene Auslöser erhalten nach dem Öffnen einen Fehler.**
Fundstelle: 3.7, Zeilen 293 bis 303 (Umwandlung von 1.0); 3.3, Zeile 122, und Abschnitt 10, Punkt 20 (neu).
Sachverhalt: Nach Punkt 20 braucht eine Verwaltung ohne eigene Auslöser eine Verbindung vom Ausgang `gestellt` zu ihrem ersten Schritt. Die vorige Fassung verbot genau diese Verbindung. Die Liste der Umwandlung in 3.7 legt die Verbindung nicht an. Eine so gebaute Strategie öffnet sich deshalb mit einem Fehler „Element, das kein Auslöser erreicht“. Ob die Strategie „EMA-Trendfolge“ des Auftraggebers betroffen ist (3.7, Zeile 303; Abschnitt 10, Punkt 18), lässt sich hier nicht prüfen, weil die Datei nicht im Repository liegt. Die Testfälle sind nicht betroffen, ihre Verwaltungen haben eigene Auslöser (Abschnitt 6, Zeilen 425 und 431).
Frage: Soll die Umwandlung die Verbindung anlegen, oder ist ein Befund beim ersten Öffnen gewollt?

**T2-H2 – Die Spezifikation legt nicht fest, ob eine Verwaltung ohne eigene Auslöser bei späteren Auslösern wieder durchlaufen wird.**
Fundstelle: 3.3, Zeile 122 („wird beim Stellen der Order durchlaufen, in der Auswertung, die die Order gestellt hat“); 3.6, Zeile 264 („erreichen die Auslöser, die ihr Element „Order aufgeben“ erreichen“); Fachmodell req-fach-049a, Zeile 384 („Tritt ein Auslöser ein, werden zuerst die Verwaltungen der bestehenden Orders und Positionen ausgewertet“).
Sachverhalt: req-fach-049a, Zeile 384, kann man so lesen, dass jeder Auslöser alle bestehenden Verwaltungen auswertet, auch solche ohne eigene Auslöser. Die Spezifikation nimmt an, dass sie nur einmal beim Stellen durchlaufen werden. Davon hängt ab, welche Auslöser ein Element einer solchen Verwaltung erreichen, und damit die Prüfung „`Kerze` ohne Instanz“ (Zeile 281). Für die Testfälle hat das keine Folgen.
Zuordnung: Sache der Spezifikation. Die Ausführung ist nicht Gegenstand dieses Vorhabens.
Kritikpunkt: Die Lesart ist nicht begründet und nicht als Annahme gekennzeichnet.

**T2-H3 – Auch eine Insel mit Rückführung, die kein Auslöser erreicht, ist ein Fehler. Das geht über den Wortlaut der Festlegung hinaus.**
Fundstelle: 3.6, Zeile 264: „… oder nur mit Verbindungen von Elementen, die selbst kein Auslöser erreicht.“
Sachverhalt: Festgelegt ist: „ein Element ohne eingehende Verbindung ist immer ein Fehler“ (Vermerk der Bestätigung, `specification-2.html`, Zeile 174) und „Element des Ablaufs ohne Verbindung (Fehler)“ (req-ablauf-007). Die Spezifikation meldet zusätzlich Elemente mit eingehender Verbindung, die kein Auslöser erreicht, zum Beispiel einen Kreis von Elementen ohne Verbindung zum übrigen Ablauf. Ein Fehler verhindert die Ausführung der ganzen Strategie (req-ablauf-007). Das passt zum Sinn der Festlegung, denn diese Elemente laufen nie. Die Spezifikation gibt aber keine Begründung an.
Zuordnung: Sache der Spezifikation.
Kritikpunkt: Eine Begründung fehlt, zum Beispiel im Abschnitt 10, Punkt 17.

**T2-H4 – Auch 3.1 zählt nicht alle Wege auf, ein anderes Instrument anzusprechen.**
Fundstelle: 3.1, Zeile 86 („über eine Instanz von `Instrument`, deren Parameter `Instrument` mit einem Strategieparameter oder einem festen Instrument belegt ist, oder über das Instrument einer Order“); dagegen 3.1, Zeilen 66 und 77 (Datenverbindung und Parameter der Vorlage sind erlaubt); Abschnitt 10, Punkt 19.
Sachverhalt: Wie T1-H4. Hinzu kommt eine Folge, die die Spezifikation nicht nennt: In einem eigenen Indikator oder Trend ist `Instrument` ohne Instanz jetzt das Instrument der Anwendung, nicht mehr das eigene Instrument des Indikators. Ein Indikator mit einem anderen Instrument rechnet mit `Instrument.Pip` daher mit dem Pip des Instruments der Anwendung. Will er seinen eigenen Pip, braucht er eine Instanz von `Instrument`, die mit seinem Parameter `Instrument` belegt ist. Dieser Weg steht in 3.1, Zeile 86, nicht. Die Folgen in Abschnitt 10 (Zeile 501) nennen nur den Fall des Auslösers `Kerzenschluss`.
Zuordnung: Sache der Spezifikation.
Kritikpunkt: Der Weg ist unvollständig beschrieben. Die Folge für Indikator und Trend fehlt in den Folgen von Abschnitt 10.

**T2-H5 – Bei Währungspaaren sind Grenzfälle nicht genannt.**
Fundstelle: 3.1, Zeile 81 („zwei Währungscodes nach ISO 4217 hintereinander … Die Bibliothek prüft beide Codes gegen die Liste der Codes nach ISO 4217, die sie mitbringt“).
Sachverhalt: Die Liste nach ISO 4217 enthält auch Codes, die keine Währung bezeichnen, zum Beispiel `XXX` (keine Währung) und `XTS` (für Tests), und Fondscodes. Offen bleibt, ob zweimal derselbe Code (`EUREUR`) gültig ist. Offen bleibt auch, wie die mitgebrachte Liste nachgeführt wird, wenn die Norm neue Codes aufnimmt. Nach „Detailtiefe nach Umfang“ kann das in den Auftrag gehören.
Zuordnung: Sache der Spezifikation beziehungsweise des Auftrags.
Kritikpunkt: Die Grenzfälle für den Test in Abschnitt 7 sind nicht bestimmt.

**T2-H6 – Der Plan widerspricht der neuen Fassung von 3.6.**
Fundstelle: `development/strategiedesign/plan.md`, Zeile 83 („kein Befund für eine Strategie ohne Auslöser, `Kerze` ohne Instanz auch ohne Auslöser …“) und Zeile 168 („`wp02` (Strategie ohne Auslöser)“); Spezifikation 3.6, Zeile 287 („Das ersetzt das Abnahmekriterium 2 von `wp02`“).
Sachverhalt: Der Plan ist nicht Gegenstand dieses Durchlaufs, und nach `scope.md` folgt ein neuer Plan. Bis dahin steht im Plan das Gegenteil der Spezifikation.
Kritikpunkt: Der neue Plan muss die Stellen angleichen.

## Nicht geprüft

Wie im Prüfauftrag vorgegeben: unveränderte Stellen, Glossar, Arbeitspaketplan (nur als Hinweis T2-H6 erwähnt), Code. Die Strategie „EMA-Trendfolge“ des Auftraggebers im Format 1.0 liegt nicht im Repository und wurde nicht geprüft (T2-H1).
