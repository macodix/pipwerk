# Prüfbericht Dokumente des Auftraggebers, Durchlauf 14 (Nachprüfung)

- Vorhaben: `strategiedesign`, Phase 1, Nachprüfung von B1, B2, H6 aus Durchlauf 13
- geprüfter Commit: `075389a525e5b5e8a2f45e8f83dfae25e6150899` (`main`)
- Maßstab: `git diff 1c4b7f21cbc4c3157be557ecdabfd95f102050f4 075389a525e5b5e8a2f45e8f83dfae25e6150899 -- docs/design docs/technical/glossar.md development/strategiedesign/scope.md`
- Ergebnis: **bestanden** (keine blockierenden Befunde, keine Fragen an den Auftraggeber)

## Punkt 1: B1, B2, H6 behoben?

- **B1 behoben.** `anforderungen-strategiedesigner.md`, req-ablauf-007: Der Satz, der Objekte auf der Zeichenfläche ausnahm, ist gestrichen. Neu ist die Zeile „Instanz … ohne Verbindung zu dem Element, das sie zuerst verwendet (Fehler)“. Sie passt zu req-ablauf-003, req-ui-017 und req-fach-055. „Element des Ablaufs ohne Verbindung“ betrifft nach dem Glossar („Element“) nur Elemente des Ablaufs und kollidiert nicht mit der neuen Zeile.
- **H6 behoben.** Die Zeile „Name einer Instanz, der in der Strategie mehr als einmal vergeben ist (Fehler)“ entspricht req-fach-055.
- **B2 behoben.** Glossar: „Ergebnis“, „Ausgang“, „Datenverbindung“ nennen Methoden. „Namensraum“ nennt den gemeinsamen Namensraum der Instanzen und den Fehler bei doppeltem Namen. „Typbeschreibung“ nennt Methoden und das Aktualisieren. „Methode“ und „Aktualisieren“ sind neu. Die Texte stimmen mit req-fach-055 und req-ui-014 überein; ich fand keinen Widerspruch.

## Punkt 2: neue Widersprüche in den geänderten Stellen

Keine blockierenden. Die Hinweise stehen unten.

## Punkt 3: Testfälle

`str-01` und `str-03` lassen sich weiterhin vollständig gestalten, speichern und laden. Jede Instanz (ZigZag, EMA, ATR, Kerze) wird mit dem Element ihrer ersten Verwendung verbunden und trägt einen eigenen Namen (`EMA20`, `EMA50`, `ATR14`). Die neuen Prüfzeilen sind erfüllbar, und Speichern bleibt auch bei Fehlern möglich (req-ablauf-007). Methoden und Aktualisieren braucht kein Testfall.

## Blockierende Befunde

Keine.

## Hinweise (verhindern das Bestehen nicht)

- N1 – req-ablauf-007 (neue Zeile) neben req-ui-014 Absatz 2: Eine Instanz, die nur über ihren Namen im Ausdruck verwendet wird und keine gezogene Linie hat: Die Zeichenfläche zeigt sie als Datenverbindung, req-ablauf-003 verlangt aber die Verbindung. Ob das die Prüfzeile erfüllt, ist nicht gesagt. Sache der Spezifikation, setzt H3 aus Durchlauf 13 fort.
- N2 – req-ablauf-007 (neue Zeile): Die Prüfung läuft auch beim Speichern einer Vorlage (Indikator, Trend). Eine Trend-Vorlage enthält Instanzen von Indikatoren, hat aber kein „Element, das sie zuerst verwendet“. Ob die Zeile dort gilt, ist nicht gesagt. Sache der Spezifikation, setzt H4 und H5 fort. Kein Testfall betroffen.
- N3 – Glossar „Namensraum“: Der Satz „zwei Namen derselben Ebene sind ein Fehler“ steht neben „Ein Name darf in einer Strategie nur einmal vergeben werden“. Ob Namen in Regeln und Vorlagen innerhalb einer Strategie dazugehören, ist offen. Sache der Spezifikation, entspricht H4.
