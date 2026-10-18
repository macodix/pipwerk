# Prüfbericht QA – Änderung von Spezifikation und Plan in Phase 4, Durchlauf 6 (Nachprüfung)

- Bezug: `strategiedesign/wp02`, Prüfauftrag `development/strategiedesign/reviews/specification-6-order.md`
- geprüfter Commit: `d51105a730fd929974cf1b0bd26e66b318510cdc` (`origin/main`, letzter Commit, der den Prüfauftrag ändert)
- Maßstab: `git diff dc65da1a3d067f7a680737d896095118d94c8c75 d51105a730fd929974cf1b0bd26e66b318510cdc -- development/strategiedesign/specification.md development/strategiedesign/plan.md`
- vorheriger Durchlauf: `reviews/specification-5.md` auf Commit `dc65da1a3d067f7a680737d896095118d94c8c75`, nicht bestanden (B1, H1 bis H7)
- Art: Nachprüfung (Entwicklungsverfahren, „Umfang der Prüfungen“). Geprüft ist, ob B1 behoben ist und ob die geänderten Stellen neue Fehler enthalten. Keine Testumgebung nötig und keine verwendet.

## Ergebnis: bestanden

B1 aus `specification-5.md` ist behoben. Die geänderten Stellen enthalten keinen neuen blockierenden Befund. Es bleiben 5 Hinweise (N1 bis N5). Sie verhindern das Bestehen nicht.

## Grundlagen der Prüfung

- Diff nach Maßstab; Spezifikation 1, 3.3, 3.5, 3.6, 5.2 bis 5.4, 6, 7, 10 und Plan `wp02` sowie Tabelle der Abdeckung im geprüften Commit
- `reviews/specification-5.md` und `reviews/specification-5-order.md` im geprüften Commit
- Meldung `development/messages/architect/20261018000127-projectlead-01.md` auf Commit `e7f0876d4be0043f5ec64cf95917f9d41f702d5a`
- `anforderungen-strategiedesigner.md`: req-fach-015, req-ablauf-002, req-ablauf-007
- `fachmodell.md`: req-fach-047, req-fach-049, req-fach-049a, req-fach-051
- `docs/technical/entwicklungsverfahren.md`: „Meldungen“ (Absatz nach der Tabelle), „Umfang der Prüfungen“, „Grenze der Durchläufe“

## Nachprüfung von B1

**Behoben.**

- Vorher: Der Hinweis „kein Element ‚Order aufgeben‘ erreichbar“ entfiel für jede Strategie ohne Auslöser im Hauptablauf. Dafür gab es keine Grundlage beim Auftraggeber.
- Jetzt: Spezifikation 3.6, letzte Zeile: „nicht gemeldet für eine Strategie ohne Elemente“, Grundlage „req-ablauf-007, Plan `wp02` Abnahmekriterium 2“. Absatz darunter: „Deshalb ist die Strategie ohne Elemente die einzige Ausnahme … Eine Strategie mit Elementen und ohne Auslöser im Hauptablauf erhält den Hinweis“.
- Grundlage geprüft: Die Meldung des Projektleiters enthält wörtlich: „Plan `wp02` Abnahmekriterium 2 neu: ‚Neue Strategie‘ zeigt eine leere Zeichenfläche, ‚Prüfen‘ meldet dafür keinen Befund.“ Plan `wp02`, Abnahmekriterium 2 (Zeile 107), gibt das inhaltsgleich wieder. Damit beantwortet die Meldung die dritte Frage aus B1: Der Auftraggeber will über den Projektleiter „kein Befund für die leere Strategie“. Die Ausnahme ist auf diesen Fall beschränkt. Für alle anderen Strategien gilt req-ablauf-007 wie geschrieben.
- Abnahmekriterium 2 ist erfüllbar: Für ein Dokument ohne Elemente, Regeln und Strategieparameter bin ich jede Zeile in 3.6 durchgegangen. Jede Zeile setzt ein Element, eine Instanz, eine Regel, einen Ausdruck oder einen Parameter voraus. Die Zeile zu `Kerze` trifft nur Elemente, Regeln der Strategie und Instanzen auf der Zeichenfläche. Die letzte Zeile nimmt die Strategie ohne Elemente aus.
- Plan `wp02` Umfang (Zeile 83) ist angeglichen: „Hinweis … nicht für eine Strategie ohne Elemente“.
- Der Widerspruch zum Wortlaut von req-ablauf-007 bleibt in den Dokumenten des Auftraggebers bestehen. Das ist nicht Gegenstand dieser Prüfung, siehe N1.

## Nachprüfung der Hinweise H1 bis H7

| Hinweis aus `specification-5.md` | Stelle | Ergebnis |
|---|---|---|
| H1 Ablauf ohne Auslöser mit Elementen nie fehlerfrei | Abschnitt 10, letzter Punkt unter „Folgen der fachlichen Festlegungen“ | Die Folge steht jetzt für den Auftraggeber sichtbar in der Spezifikation. Die Einordnung ist ungenau, siehe N2. |
| H2 Verbindung vom Ausgang `gestellt` | 5.3, zweiter Punkt | Die Oberfläche legt keine solche Verbindung an. Im Dokument ist sie weiter nicht geregelt, siehe N3. |
| H3 Geltungsbereich der Zeile zu `Kerze` | 3.6, Zeile zu `Kerze` | Erledigt: Regeln eines Elements, Instanzen auf der Zeichenfläche, Auslöser der Verwaltungen bei Regeln der Strategie. Eine Verwaltung ohne eigene Auslöser stützt sich auf req-fach-049a („erst bei ihren Auslösern“). Eine Lesart bleibt offen, siehe N4. |
| H4 `specification-4.md` H4 nur teilweise erledigt | Status, Zeile „ergänzung in Phase 4“ | Erledigt: „H4 teilweise … die erlaubten Bindungsarten … bleiben für die nächste passende Gelegenheit“. |
| H5 Technische Nachweise von `wp02` | Plan `wp02`, Zeile 119 | Erledigt: „die Tests der Bibliothek und des Backends zu den Änderungen an 3.1 und 3.6“. |
| H6 Tabelle der Abdeckung, Zeile „1 Abweichungen“ | Plan, Tabelle der Abdeckung | Erledigt: „`wp02` (Strategie ohne Auslöser)“. Abnahmekriterium 5 von `wp01` bleibt unverändert. Das ist richtig, weil `wp01` abgenommen ist. |
| H7 Glossar „Auslöser“ | nicht in Spezifikation oder Plan | Laut Status der Spezifikation beim Projektleiter mit `requirements-8.md` B1. Nicht Gegenstand dieser Prüfung. |

## Neue Fehler an den geänderten Stellen

Ich habe keinen blockierenden Befund gefunden. Geprüft habe ich auch:

- Regeln des Elements „Order aufgeben“, die bei „Order ändern“ in einer Verwaltung mit `Tick` angewendet würden: Nach Abschnitt 10, zweiter Punkt der „Folgen“, prüft bei „Order ändern“ nur die Regel der Strategie, nicht die Regel des Elements „Order aufgeben“. Die Zeile zu `Kerze` hat daher an dieser Stelle keine Lücke.
- `str-01` und `str-03`: Keiner der geänderten Sätze ändert ihre Befunde. `str-01` verwendet `Kerze` in keinem Ausdruck. In `str-03` wird `Kerze.Schluss` nur in Berechnungen verwendet, die ein `Kerzenschluss` ihres Ablaufs erreicht (Spezifikation Abschnitt 6, `specification-5.md` Prüffrage 5). Die Testfälle haben in Hauptablauf und Verwaltung Auslöser.
- Zuordnung im Plan: 5.3 gehört zu `wp02` (Tabelle der Abdeckung, Zeile „5.3, 5.4“; `wp02` umgesetzte Teile). Der neue Punkt in Abschnitt 10 verlangt keine Umsetzung.

## Blockierende Befunde

Keine.

## Hinweise (verhindern das Bestehen nicht)

### N1 – Ausnahme von req-ablauf-007 ist nur über Plan und Meldung belegt

- Fundstelle: Spezifikation 3.6, letzte Zeile, Spalte Grundlage („Plan `wp02` Abnahmekriterium 2“), und Absatz darunter („Meldung des Projektleiters vom 2026-10-18“). Dagegen Abschnitt 1, Tabelle der Abweichungen, und req-ablauf-007.
- Sachverhalt: req-ablauf-007 nennt „Kein Element ‚Order aufgeben‘ erreichbar (Hinweis)“ ohne Ausnahme. Die Ausnahme für die leere Strategie steht nur im Abnahmekriterium eines Arbeitspakets und in einer Meldung. Die Spezifikation nennt den Plan als Grundlage, obwohl der Plan auf der Spezifikation aufbaut. Nach Abschluss von `wp02` bleibt die Ausnahme in den Dokumenten des Auftraggebers nicht nachvollziehbar. Ein späteres Vorhaben, das die Konsistenzprüfung nach req-ablauf-007 umsetzt, würde für die leere Strategie wieder den Hinweis erwarten.
- Frage an den Projektleiter: Soll die Ausnahme für die Strategie ohne Elemente in req-ablauf-007 eingetragen werden?

### N2 – Neuer Punkt in Abschnitt 10 steht unter „nicht aus einer Entscheidung der Spezifikation“

- Fundstelle: Spezifikation Abschnitt 10, Einleitung der „Folgen der fachlichen Festlegungen“ („sie ergeben sich aus req-core-002, req-fach-046 und req-fach-049a, nicht aus einer Entscheidung der Spezifikation“) und der neue letzte Punkt.
- Sachverhalt: Der neue Punkt beruht auf req-fach-015, req-fach-047 und req-ablauf-007. Keine davon nennt die Einleitung. Der Punkt beruht außerdem auf der Lesart der Spezifikation „ohne eingehende Verbindung“. req-ablauf-007 sagt „ohne Verbindung“. Diese Frage liegt als `requirements-8.md` H2 beim Projektleiter. Die Folge ist damit zum Teil eine Festlegung der Spezifikation, steht aber nicht unter den Festlegungen 1 bis 8 zur Bestätigung.
- Kritikpunkt: Die Einleitung passt nicht zum neuen Punkt. Die Frage aus H1, ob der Auftraggeber diese Festlegung bestätigen soll, ist damit nicht beantwortet.

### N3 – Verbindung vom Ausgang `gestellt` im Dokument nicht geregelt

- Fundstelle: Spezifikation 5.3, zweiter Punkt („Von diesem Ausgang legt die Oberfläche keine Verbindung zu einem Element an“); 3.3, Absatz „Verbindung“ (Quelle: jedes Element mit jedem Ausgang); 3.6.
- Sachverhalt: Die Oberfläche legt eine solche Verbindung nicht an. Ein Dokument, das über die Web-API oder als Datei entsteht, kann sie aber enthalten. Weder 3.3 noch 3.6 schließen sie aus. Dann hat das erste Element einer Verwaltung ohne Auslöser eine eingehende Verbindung, und der Absatz unter der Tabelle in 3.6 stimmt nicht mehr. Die Testfälle enthalten keine solche Verbindung.
- Frage: Ist eine Verbindung vom Ausgang `gestellt` im Dokument zulässig, und wenn nicht, meldet die Konsistenzprüfung sie?

### N4 – „einen anderen als `Kerzenschluss`“ bei gemischten Auslösern mehrdeutig

- Fundstelle: Spezifikation 3.6, Zeile zu `Kerze`, zweiter Satz („wenn die Strategie, Hauptablauf und alle Verwaltungen zusammen, keinen Auslöser oder einen anderen als `Kerzenschluss` hat“).
- Sachverhalt: `str-01` hat `Kerzenschluss` im Hauptablauf und in der Verwaltung und dazu `Tick` in der Verwaltung. Man kann den Satz auf zwei Arten lesen: „mindestens einen anderen Auslöser“ oder „nur andere Auslöser“. Nach der ersten Lesart wäre eine Regel der Strategie, die `Kerze` ohne Instanz verwendet, in `str-01` ein Fehler. Nach der zweiten Lesart wäre sie keiner. req-fach-051 („Startet ein anderer Auslöser … die Auswertung“) passt zur ersten Lesart. Die Testfälle sind nicht betroffen, weil die Regel `risiko` `Kerze` nicht verwendet.
- Frage: Welche Lesart gilt?

### N5 – „Ablauf ohne Elemente“ und „Strategie ohne Elemente“ ohne Abgrenzung zu Instanzen

- Fundstelle: Spezifikation 3.6, letzte Zeile („Strategie ohne Elemente“); Abschnitt 10, letzter Punkt („nur ein Ablauf ohne Elemente“); 3.3, Absatz „Element“ („Ein Element, das ein Objekt zeigt, enthält die Instanz“).
- Sachverhalt: Nach 3.3 ist eine Instanz auf der Zeichenfläche ein Element. Eine Strategie, die nur Instanzen enthält, erhält danach den Hinweis „kein Element ‚Order aufgeben‘ erreichbar“. Eine Strategie, die nur Regeln der Strategie enthält, erhält ihn nicht. Abschnitt 10 spricht von „Ablauf ohne Elemente“, 3.6 von „Strategie ohne Elemente“. Aus dem Text geht hervor, wie es gemeint ist, aber nicht ausdrücklich.
- Frage: Ist der Hinweis für eine Strategie, die nur Instanzen oder nur Regeln der Strategie enthält, so gewollt?

## Nicht geprüft

- Dokumente des Auftraggebers und das Glossar inhaltlich (laut Prüfauftrag nicht Gegenstand)
- Beginn der Auswertung ohne Auslöser (laut Prüfauftrag offen und nicht Gegenstand)
- Code und Testumgebung
- unveränderte Stellen, außer soweit sie für die Nachprüfung von B1 und der geänderten Stellen nötig waren
