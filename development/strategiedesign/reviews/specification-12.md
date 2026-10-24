# Prüfbericht Spezifikation, Durchlauf 12

- Vorhaben: `strategiedesign`, ref `strategiedesign`, Phase 2, Rolle QA
- Geprüfter Commit: `bb5e5716eee7fe66d1198abe3ab3ec64c4df75ad` (`main`)
- Vergleichsstand: `330c774` (Durchlauf 11)
- Ergebnis: **nicht bestanden**. Es gibt einen blockierenden Befund (B1). Er ist Sache der Spezifikation und keine Frage an den Auftraggeber.

## Umfang der Prüfung

Geprüft wurden die geänderten Stellen von `specification.md` (Diff `330c774` bis `bb5e571`), die Umsetzung der geänderten Festlegungen und die Antwort in `strategiedesign-04.md`. Dazu kamen die Abbildung von `str-01` und `str-03` und die Suche nach nicht angepassten Stellen. Die Suche galt `Start von Hand`, `Parameter setzen`, `Markttechnik`, `Trend intakt`, `Punkt 2`, `Punkt 1/3` und einem eigenen Bereich für Objekte. Alle Treffer außerhalb des Änderungsnachweises sind gewollt (Vergleichstabelle in Abschnitt 1, Hinweis auf die Rückstellung in 3.2, 10 Punkt 17).

Ohne Befund umgesetzt:
- req-fach-047: „Parameter setzen“ entfällt (1, 3.1, 3.2, 3.4, 3.6, 5.2).
- req-fach-053: `Manuell` nur im Hauptablauf (3.2, 3.6, 3.7, 10 Punkt 17).
- req-fach-054: `Markttechnik` zurückgestellt, `ZigZag` mit letztem und vorletztem endgültigem Hoch und Tief (3.2).
- req-fach-055: erste Verwendung, Namensraum, Aktualisieren, Methoden.
- req-ui-012, req-ui-014, req-ui-016, req-ui-017, req-ui-018, req-ablauf-003 und req-ablauf-007 (3.6).

## Blockierende Befunde

**B1 – Weg über die erste Verwendung gilt in einer Verwaltung mit eigenen Auslösern nicht oder widerspricht sich** (Sache der Spezifikation)
- Fundstellen: 3.3 „Stand einer Instanz“, Punkt 3 und 4 (Zeilen 146 und 147), 3.3 „Verbindung“ (Zeile 153), 3.6 (Zeile 307), 3.7 (Zeile 340), Abschnitt 6 (Zeilen 475 bis 476 und 482).
- Sachverhalt:
  - 3.3 verlangt: „Jeder Weg von einem Auslöser zu dem verwendenden Element führt über das Element der ersten Verwendung.“ Eine Verwaltung „wird dabei über ihr Element ‚Order aufgeben‘ erreicht“. Eine Verwaltung mit eigenen Auslösern wird nach 3.3 „Verbindung“ aber erst bei ihren eigenen Auslösern durchlaufen. Deren Wege beginnen in der Verwaltung und führen nie über die erste Verwendung im Hauptablauf.
  - Der Befund in 3.6 (Zeile 307) wäre damit für die Verwaltungen von `str-01` und `str-03` und für die gesicherte „EMA-Trendfolge“ zu melden. In allen drei verwendet die Verwaltung `zz_handel` beziehungsweise `ema20`, `ema50` und `atr14` mit „Aktualisieren“, und ihre erste Verwendung liegt im Hauptablauf.
  - Zeile 147 und 3.7 (Zeile 340) setzen dagegen voraus, dass genau diese Verwendung zulässig ist. Abschnitt 1 und 6 verlangen für beide Testfälle null Fehler.
- Frage: Gilt die Wegprüfung aus Zeile 146 auch für Wege, die an einem eigenen Auslöser einer Verwaltung beginnen? Wenn nicht, welche Regel gilt für diese Verwaltungen, und wie lautet dann der Befund in 3.6? Wenn ja, wie bilden `str-01`, `str-03` und die „EMA-Trendfolge“ ohne Fehler ab?

## Hinweise (je eine Zeile)

- H1 – 10 Punkt 22 und 5.3: Die Spezifikation führt „Umschalter beginnt mit ‚Auswahl‘“ und „nicht verwendete Instanz liegt, wo der Anwender sie ablegt“ auf die Antwort zu Frage 2 zurück. Die Antwort sagt nur „bis dahin gilt req-ui-017“, und `strategiedesign-04.md` schlug „Aus“ vor. Beide Punkte sind Festlegungen der Spezifikation und gehören so gekennzeichnet.
- H2 – 5.1 „Erscheinungsbild nach dem Prototyp“ und Abschnitt 6, Zeile 486 „der Prototyp weist das nach“: beides widerspricht E8 und der Antwort (Prototyp nur Hilfsmittel, keine Vorlage, keine bestätigte Grundlage). Der Nachweis gehört in die Tests aus Abschnitt 7.
- H3 – 3.3 und 3.6: Eine Instanz, die nur eine Regel der Strategie verwendet (kein Element), hat kein „Element der ersten Verwendung“. Ob das der Befund „Instanz ohne Verbindung“ ist, ist nicht gesagt (Lücke ohne Auswirkung auf die Testfälle).
- H4 – 5.4 „Regeln zuordnen“: Der in req-ui-012 offene Punkt „Darstellung von Regeln auf der Zeichenfläche“ mit dem Vorschlag des Projektleiters (Geltungsbereich) steht weder in 5.3 noch in Abschnitt 10 als nicht umgesetzt.
- H5 – 3.5: req-fach-021 (Maßnahme bei nicht erfüllter prüfender Regel nach der Ausführung einer Marktorder) wird nicht genannt. Es betrifft die Ausführung und braucht in diesem Vorhaben nichts.
- H6 – 5.2: „Tick“ steht als Auslöser und als Objekt. Die Typkennungen müssen verschieden sein. Die Spezifikation sagt nur, dass beide in der Bibliothek stehen.

## Antwort `strategiedesign-04.md`, Abschnitt „Antwort“

- Prototyp nur Hilfsmittel: richtig umgesetzt in Status, E8 und Abschnitt 5; Einschränkung siehe H2.
- Ort der Fenster vorläufig nach Vorschlag: richtig umgesetzt in 5.1, 5.5 und 10 Punkt 21, als vorläufig gekennzeichnet.
- Lage der Objekte nach req-ui-017: richtig umgesetzt in 5.3 und E8, ohne eigenen Bereich. Einschränkung siehe H1.
- Frage 3 entfällt: Der Status behandelt den Prototyp nicht mehr als bestätigt.

## Abbildung der Testfälle (Abschnitt 6)

- `str-01` bildet sich mit dem `ZigZag` vollständig ab: Trend, Einstiegsbezug, Stop-Bezug, Tradeplanung, Ablehnung der Stop-Order bei überschrittenem Einstieg über „nicht gestellt“, Verwaltung mit Tick und Kerzenschluss. Vorbehalt: B1.
- `str-03` bildet sich vollständig ab. Vorbehalt: B1.

## Punkte 21 bis 25 in Abschnitt 10

Alle fünf sind als vorläufig gekennzeichnet. Keiner widerspricht einer Festlegung des Auftraggebers.
