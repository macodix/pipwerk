# Prüfbericht Spezifikation, Durchlauf 14 (QA)

- Vorhaben: `strategiedesign`, Phase 2, erster Durchlauf der Fassung nach den Einwänden aus `specification-3.html`
- Ergebnis: **bestanden**
- Geprüfter Commit: `75317221163edd7b7643a64debed8f41bf918238` (`main`, legt `specification-14-order.md` an)
- Vergleichsstand: `0b6190b`. Grundlage waren die Diffs von `specification.md`, `fachmodell.md` und `anforderungen-strategiedesigner.md`. Dazu kamen eine Suche nach `wert_vor`, `Wert vor`, `Verschiebung` und `Methode` in der ganzen Spezifikation und das Glossar `docs/technical/glossar.md`.

## Blockierende Befunde

Keine.

## Prüfung nach Gegenstand

1. **Geänderte Stellen und Festlegungen.** Die Spezifikation setzt die Festlegungen vollständig und richtig um.
   - req-fach-055, mitgelieferte Typen ohne Methoden: 3.2 (Zeile 121 bis 124), 3.1 (Beispiele ohne `wert_vor`), 3.4, 5.3 und 10 Punkt 23 stimmen überein. Aktualisieren steht für `EMA`, `ATR`, `ZigZag`, `Trend`, `Konto`, `Instrument`, `Kerze`, `Tick`. Eine eigene Vorlage übernimmt es von ihrem Objekttyp.
   - req-fach-055, Verwendbarkeit nur über die erste Verwendung: Die Wegregel in 3.3 und die Verwendbarkeit an einem Element gelten in 3.3 und 3.4. Die Oberfläche in 5.3 und 5.4 bietet nur verwendbare Instanzen an (Bausteine, Formeleditor, „Verwendete Werte“, Verbinden).
   - Verwaltung gilt als über ihr „Order aufgeben“ erreicht, Stand beim Aufgeben der Order: 3.3 und Verbindung in 3.3 setzen es um.
   - req-ui-014 und req-ablauf-007: Die neue Zeile in 3.6 deckt „auch nur im Ausdruck“ ab, die Verweise stimmen.
2. **Nicht geänderte Stellen.** Es gibt keinen Widerspruch. Ein Aufruf einer Methode `wert_vor` oder ein Parameter-Beispiel dazu kommt nicht mehr vor. `PREVIOUS` mit optionaler Anzahl (Zeile 198) deckt „Wert vor einer Anzahl Kerzen“ ab. `Verschiebung` bleibt nur als Parameter des `EMA`. Das Glossar ist zu „Methode“, „Namensraum“ und „Aktualisieren“ widerspruchsfrei.
3. **`str-01` und `str-03` (Abschnitt 6).** Beide lassen sich vollständig abbilden. Die Verwaltungen mit eigenen Auslösern verwenden Instanzen des Hauptablaufs (`zz_handel`, `ema20`, `ema50`, `atr14`) mit „Aktualisieren“. Die erste Verwendung liegt jeweils auf jedem Weg zum „Order aufgeben“. Die Wegregel ist damit erfüllt, und die Spezifikation begründet „Aktualisieren“ ausdrücklich mit dem Stand beim Aufgeben der Order.
4. **Abschnitt 10 Punkte 21 und 22.** Sie sind als vorläufig bis zur Abnahme gekennzeichnet: Status (Zeile 385), Zeile 553 und 5.1 (Zeile 471). Punkt 25 steht als „vorerst bestätigt“ da (Zeile 553). Die Punkte 23 und 24 stehen als ersetzt beziehungsweise bestätigt da.

## Hinweise (nicht blockierend)

- H1: 3.3 Zeile 145 und 6 `str-03`, Verwaltung: Die Bedingung Kreuzen verwendet `PREVIOUS(ema20.Wert)` mit „Aktualisieren“. Von welchem Stand `PREVIOUS` dort ausgeht, überlässt 3.3 der Ausführung. Für den Nachweis des Testfalls braucht der Auftrag eine Angabe, was die Abnahme dort erwartet.
- H2: 3.2 Zeile 124 nennt `Indikator` als Typ mit Aktualisieren, req-fach-055 nennt `EMA`, `ATR`, `ZigZag` und Trend. Die Spezifikation weicht damit scheinbar ab. Gemeint ist wohl die eigene Vorlage mit der Angabe ihres Objekttyps. Ein Satz zur Klarstellung genügt.
- H3: 3.3 Zeile 144 und 147, Verwendung nur im Ausdruck: In beiden Zweigen einer Bedingung gilt der erste Zweig in der Reihenfolge des Ablaufs als erste Verwendung, die Verwendung im anderen Zweig ist ein Fehler. Das folgt aus der Festlegung. Die Meldung sollte in den Aufträgen auf die Lösung „andere Instanz mit eigenem Namen“ hinweisen.
- H4: 3.3 Zeile 146 „Eine Instanz, die noch kein Element verwendet, ist an jedem Element verwendbar“ ist eine Entscheidung der Spezifikation, die req-fach-055 nicht ausdrücklich nennt. Sie gehört in die Kennzeichnung der Entscheidungen der Spezifikation (Abschnitt 10).
- H5: Der Änderungsnachweis (Zeile 570 bis 571) nennt die Punkte 23 und 24 doppelt (zwei Zeilen zur selben Überarbeitung). Das ist unschädlich, die Zeilen sind nur lang.
