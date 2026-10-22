# Prüfbericht Dokumente des Auftraggebers, Durchlauf 13 (geänderte Stellen)

- Vorhaben: `strategiedesign`, Phase 1, Rückweg nach Abnahme `wp02` Versuch 2
- geprüfter Commit: `1c4b7f21cbc4c3157be557ecdabfd95f102050f4` (`main`)
- Maßstab: Diff `746e6f2d9757b08c67b30ecd8b42aee74572345e` bis zum geprüften Commit für `docs/design`, Glossar und `scope.md`; Festlegungen laut `wp02/acceptance/2.md`
- Ergebnis: **nicht bestanden** (2 blockierende Befunde, beide folgen aus einer Festlegung; keine Frage an den Auftraggeber)

## Testfälle (Punkt 3)

`str-01` und `str-03` lassen sich mit den geänderten Stellen vollständig gestalten, speichern und laden. Die Verwaltung einer Order wertet getrennt vom Hauptablauf aus (req-fach-049a). Sie braucht daher eigene Instanzen mit eigenem Namen, zum Beispiel für EMA, ATR und ZigZag. Das erlaubt req-fach-055 ausdrücklich („weitere Instanz mit eigenem Namen“). „Aktualisieren“ und Methoden braucht kein Testfall. Die offenen Punkte in req-fach-055, req-ui-012 und req-ui-018 sind für die Gestaltung nicht nötig.

## Blockierende Befunde

**B1 – Konsistenzprüfung nimmt Objekte von der Verbindung aus** (`anforderungen-strategiedesigner.md`, req-ablauf-007, Zeile „Element des Ablaufs ohne Verbindung“)
- Sachverhalt: Dort steht: „Für Objekte auf der Zeichenfläche (Indikatoren, Trends, Objekte der Anwendung) gilt das nicht.“ Nach req-ablauf-003 und req-ui-017 muss die Instanz mit dem Element ihrer ersten Verwendung verbunden sein; „erst dann ist sie verwendbar“ (req-fach-055). Eine nicht verbundene Instanz ist demnach nicht verwendbar, die Prüfung schließt sie aber aus.
- Zuordnung: folgt aus einer Festlegung (Festlegung 2 vom 22.10.2026: Instanz muss mit dem Element der ersten Verwendung verbunden sein). Der Projektleiter gleicht ab.
- Kritikpunkt: Der Satz widerspricht den geänderten Stellen. Ob und wie eine Instanz ohne Verbindung gemeldet wird, ist nicht gesagt.

**B2 – Glossar widerspricht Methoden und Namensraum** (`docs/technical/glossar.md`, Einträge „Ergebnis“, „Ausgang“, „Datenverbindung“, „Namensraum“, „Typbeschreibung“)
- Sachverhalt: „Ergebnis“ lautet „Objekte liefern keine Ergebnisse, sondern haben Eigenschaften“. req-fach-055 und req-ui-014 sprechen vom „Ergebnis einer Methode“ eines Objekts. „Ausgang“ und „Datenverbindung“ kennen nur Eigenschaften, nicht Methoden. „Namensraum“ nennt den gemeinsamen Namensraum der Instanzen und den Fehler bei doppeltem Namen (req-fach-055) nicht. „Typbeschreibung“ kennt weder Methoden noch das Aktualisieren. Für „Methode“ und „Aktualisieren“ gibt es keinen Eintrag.
- Zuordnung: folgt aus einer Festlegung (Festlegungen 4 bis 6 vom 22.10.2026). Der Softwarearchitekt gleicht das Glossar an.
- Kritikpunkt: Widerspruch zwischen Glossar und Anforderungen.

## Hinweise (verhindern das Bestehen nicht)

- H1 – req-fach-055, offener Punkt 1: „heute über den Parameter `Verschiebung` … und eine zweite Instanz“ übergeht `VORHER(…; n)` (req-fach-014), das frühere Werte schon liefert. Offener Punkt.
- H2 – req-fach-055: „Über ihren Namen ist eine Instanz überall … ansprechbar“ steht neben „Werte ermittelt an der Stelle der ersten Verwendung“. Ob ein Name an einer Stelle gilt, die die erste Verwendung nicht durchläuft, regelt nur der offene Punkt 2 (Vorschlag: Fehler). Offener Punkt.
- H3 – req-ui-014 Absatz 2 (Name nur im Ausdruck zeigt eine Datenverbindung) gegen req-ablauf-003 (Verbindung zum ersten verwendenden Element nötig): Welche Stelle als „erste Verwendung“ gilt, wenn Verbindung und Ausdruck verschiedene Elemente nennen, ist offen. Sache der Spezifikation.
- H4 – req-fach-055 „Alle Instanzen einer Strategie“: Reichweite des gemeinsamen Namensraums unklar für Regel-Instanzen, Instanzen innerhalb von Trends und Vorlagen, Elementnamen und Strategieparameter (Glossar „Namensraum“: innerer Name verdeckt äußeren). Sache der Spezifikation.
- H5 – req-fach-055: Wo die Indikatoren innerhalb einer Trend-Instanz liegen („Stelle“), ist nicht gesagt. Kein Testfall betroffen, Lücke ohne technischen Grund zum Schließen.
- H6 – req-ablauf-007: „doppelter Name“ (req-fach-055) fehlt in der Liste (sie gilt „mindestens“). Folgt aus Festlegung 4, bei B1 mit erledigen.
- H7 – `str-01` („ZigZag wird zweimal als Instanz verwendet“) und `str-03` („zwei Instanzen EMA, eine ATR“) nennen weniger Instanzen, als die Gestaltung mit Verwaltung und Zweigen braucht. Folgt aus Festlegung 3, Angleichen durch den Projektleiter nur bei Bedarf.
- H8 – req-ui-017 Absatz 1 („Der Ablauf verläuft senkrecht … Eingang oben, Ausgänge unten“) neben der umschaltbaren Ausrichtung im letzten Absatz; Lage der Ein- und Ausgänge bei waagerechter Ausrichtung nicht beschrieben. Sache der Spezifikation.
- H9 – req-ui-016 („Neue Strategie“ bietet geführten Aufbau mit Indikatoren vor der Bedingung) und req-fach-055: Der geführte Aufbau muss Indikatoren beim ersten verwendenden Element anlegen. Sache der Spezifikation.
- H10 – req-ui-014/req-fach-055: Welche Objekttypen „Aktualisieren“ und Methoden haben, ist offen gekennzeichnet; bis dahin zeigt kein Typ den Schalter. Offener Punkt.
