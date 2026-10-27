# Prüfbericht Spezifikation, Durchlauf 15

- Vorhaben: `strategiedesign`, Phase 2, Rolle QA
- geprüfter Commit: `c54b91a1aeccdeda38ac4791e3b20b95c732be82` (`main`, Stand der Spezifikation 2026-10-27)
- Umfang: erster Durchlauf dieser Fassung, beschränkt auf die Änderungen seit `dd0bf1a` und die Entscheidungen E1, E9, E11, E12 aus `wp02/acceptance/3.md`

## Ergebnis: **bestanden**

Blockierende Befunde: keine.

## Prüfung nach Prüfauftrag

1. Geänderte Stellen: Der Änderungsnachweis (Zeile 575) nennt die Änderungen. Ich habe sie im Diff gegengelesen. Ich habe keine Abweichung gefunden, die dort nicht benannt ist.
2. Entscheidungen des Auftraggebers vom 2026-10-27:
   - E1: „Order- und Positionsverwaltung“ steht überall ausgeschrieben, auch als Rahmentitel (5.3, Zeile 434) und im Browsertest (Abschnitt 7). Englisch steht „order and position management“ in 5.5 (Zeile 398). Eine Kurzform „Verwaltung“ allein kommt außerhalb des Änderungsnachweises nicht vor. Die Feldnamen `management_of` und `collapsed_managements` stehen unverändert in 3.7 (Zeile 353). „Kontoverwaltung“ (Zeile 82) meint etwas anderes und ist unverändert aus den Dokumenten des Auftraggebers.
   - E9: Der Assistent ist aus Abschnitt 1 (Nicht Gegenstand), 5.5 (Zeile 459), Abschnitt 7 und Punkt 21 entfernt. Die Spezifikation nennt ihn nur noch als gestrichen. Der geführte Aufbau ist als offen in req-ui-016 gekennzeichnet.
   - E12: Abschnitt 3.4 (Zeile 207) streicht den Baustein „Kreuzung“. Gespeicherte Ausdrücke bleiben gültig und erscheinen ausgeschrieben mit „vorheriger Wert von“, Vergleichen und „und“/„oder“. Das stimmt mit req-ui-015 und mit E12 überein. Die offene Frage (Kreuzung als eigene Vorlage, Bedingung als Vorlage) ist als offen benannt und nicht Gegenstand dieser Fassung.
3. E11 (5.4 Zeilen 445 und 446, Abschnitt 10 Punkt 26): Die Festlegung deckt alle vier Teile des Mangels ab. Frage „Woher kommt der Wert?“ statt „Belegung“. Die fünf Auswahlwerte entsprechen dem Vorschlag des Projektleiters. Beim Instrument steht „das Instrument, auf dem die Strategie läuft“ mit „anderes Instrument wählen“ und einem Rückweg. Der Datentyp steht in der Erklärung statt neben der Beschriftung. Ich habe keinen Widerspruch zu den Anforderungen gefunden. Punkt 26 steht unter der Überschrift „vorläufig bis zur nächsten Abnahme in der Testumgebung“ (Zeile 562) und ist damit gekennzeichnet.
4. Nicht geänderte Stellen: Ich habe außerhalb des Änderungsnachweises weder eine Kurzform „Verwaltung“ noch einen Assistenten noch einen Baustein „Kreuzung“ als Voraussetzung gefunden. „Kreuzungen“ in 5.3 (Zeilen 432 und 436) meint Linien auf der Zeichenfläche. „Kreuzen“ in 3.7 und 6 meint die Bedingung der Testfälle.
5. Abbildung der Testfälle (Abschnitt 6): `str-01` braucht keine Kreuzung und ist unverändert abbildbar. In `str-03` ist die Bedingung im Hauptablauf (Zeile 487) mit „vorheriger Wert von“, Vergleichen, „und“ und „oder“ ausgeschrieben und bildet sich ohne Baustein „Kreuzung“ ab. Die Bedingung in der Order- und Positionsverwaltung (Zeile 488) ist abbildbar, siehe Hinweis 1. Abschnitt 7 prüft „kein Baustein ‚Kreuzung‘“ in Bibliothek und Browser.

## Hinweise (nicht blockierend)

1. Abschnitt 6, Zeile 488: In der Order- und Positionsverwaltung von `str-03` steht „Bedingung Kreuzen gegen `Position.Richtung`“ ohne ausgeschriebenen Ausdruck, anders als im Hauptablauf (Zeile 487). Dasselbe gilt für „verbessert“. Das lässt sich nach 3.4 aus Bausteinen bilden (Fallunterscheidung nach `Position.Richtung`). Frage an die Aufträge: Soll der Ausdruck dort stehen, damit der Browsertest ihn eindeutig nachbaut?
2. Zeile 436 und 443: Die Karte zeigt den Datentyp „zusätzlich dahinter“. Zeile 443 zeigt den Datentyp einer gelieferten Eigenschaft in ihrer Beschreibung. Beides ist mit E11 vereinbar, weil dort nur das Feld mit Beschriftung gemeint ist. Die Aufträge sollten die Stellen trennen, an denen der Datentyp steht und an denen nicht.
3. Zeile 9: Die Aufzählung der Prüfungen nennt Durchlauf 14 als letzten. Durchlauf 15 und `architecture-1.md` stehen nur im Änderungsnachweis (Zeile 575). Das ist eine Frage der Lesbarkeit.
