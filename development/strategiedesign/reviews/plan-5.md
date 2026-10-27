# Prüfbericht Plan, Durchlauf 5 (QA, Phase 3)

- Vorhaben: `strategiedesign`
- geprüfter Commit: `c54b91a1aeccdeda38ac4791e3b20b95c732be82` (`main`, `development/strategiedesign/plan.md`, Stand 2026-10-27)
- Gegenstand: Anpassung von `wp02` an die Spezifikation vom 2026-10-27 (Diff gegen `dd0bf1a`), erster Durchlauf dieser Anpassung

## Ergebnis: bestanden

Keine blockierenden Befunde. Die Hinweise unten verhindern das Bestehen nicht.

## Prüfung

1. Abdeckung der Spezifikation durch `wp02`: bestanden.
   - E1: Umfang nennt „Order- und Positionsverwaltung“ ohne Kurzform (Bibliothek und 5.1, 5.3); Kriterium 2 verlangt den Rahmentitel und keine Kurzform.
   - E9: Assistent aus Umfang, Kriterium 12 und Anwenderablauf 5.5 entfernt; Kriterium 12 nennt den Hinweis der leeren Strategie.
   - E11, Punkt 26: Frage „Woher kommt der Wert?“ im Umfang (5.4), Punkt 26 in „Umgesetzte Teile“ (Punkte 3 bis 26), als vorläufig in Status, Abnahmetext und Abdeckungstabelle geführt.
   - E12: Baustein „Kreuzung“ entfällt im Umfang; Kriterium 1 verlangt die Bedingung aus „vorheriger Wert von“, Vergleichen und Verknüpfungen.
2. Entfallenes: Im geänderten Plan steht kein Assistent, kein Baustein „Kreuzung“ und keine Kurzform „Verwaltung“ mehr als Voraussetzung. Die verbliebenen Treffer sind Verneinungen oder der Änderungsnachweis.
3. Kriterien 1, 2 und 12 passen zur Spezifikation (3.4, 5.1, 5.3, 5.4, 6) und zu E1, E9, E12; sie sind vom Auftraggeber in der Testumgebung selbst prüfbar. Kriterium 1 bleibt das Kriterium zur Bedienbarkeit (Maßstab: ohne Anleitung zum Ziel).
4. Mängel E1 bis E6, E9 bis E13 aus `wp02/acceptance/3.md`: im Ziel von `wp02` genannt; E7 und E8 entfallen mit E9 (richtig vermerkt). Inhaltlich gedeckt: E2 durch Kriterium 9, E4 durch Kriterium 12 (Erscheinungsbild nach 5.1), E5 durch Kriterium 13 und Umfang (Anwenderdokumentation), E10 durch Ziel (Durchsicht der Texte).

## Hinweise (nicht blockierend)

- H1 Kriterium 9 (plan.md Z. 112): E3 verlangt, dass jeder Befund Element und Feld mit sichtbarer Beschriftung nennt; das Kriterium sagt nur „Weg zur Behebung und führt zur Stelle“. Soll die Prüfung durch den Auftraggeber das einschließen?
- H2 Kriterium 1 (Z. 104) prüft nur die Frage „Woher kommt der Wert?“. Die Auswahl in Händlersprache, das Instrument „auf dem die Strategie läuft“ und der Datentyp in der Erklärung (Punkt 26) stehen nur im Satz zu den vorläufigen Punkten (Z. 118), nicht als beobachtbares Kriterium.
- H3 E6 (kein „rechnet“) und E13 (Erklärung wird ersetzt) kommen in keinem Kriterium und nicht im Umfang vor, nur im Ziel. Kriterium 5 (Z. 108) prüft Erklärungen nur auf Vorhandensein, nicht auf Verständlichkeit (E10).
- H4 Kriterien 7 und 11 (Z. 110, 114) verwenden weiter „Belegung“, das nach Punkt 26 keine sichtbare Beschriftung mehr ist. Ist hier das Fachwort oder die Oberflächenbeschriftung gemeint?
- H5 Ziel (Z. 76): Die Beobachtungen B2 bis B4 sind keine Texte; „soweit die Durchsicht der Texte sie erfasst“ lässt offen, ob sie behoben werden. Das entspricht dem Abnahmebericht („ohne Entscheidung“); gewollt?
- H6 Nicht geänderte Stelle in `wp01` (Z. 65): „Order ändern außerhalb einer Verwaltung“ nutzt die Kurzform, die die Spezifikation (3.6) nicht mehr kennt. `wp01` ist nicht Gegenstand; Hinweis, ob die Kurzform dort bleiben soll.
