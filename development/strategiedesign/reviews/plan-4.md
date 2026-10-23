# Prüfbericht Plan, Durchlauf 4

- Vorhaben: `strategiedesign`, Rolle QA, Phase 3
- geprüfter Commit: `b0af51a4d7e903b7f256bb097c2efd7f3c227c23` auf `origin/main`
- Gegenstand: Anpassung von `wp02` und `wp03` in `development/strategiedesign/plan.md` an die Spezifikation vom 2026-10-23 (Diff gegen `c63f37eecbb3bed00c61c3d579f415dcbaf905e4`)
- Prüfgrundlage: `specification.md` (Änderungsnachweis 2026-10-21 bis 2026-10-23, Abschnitte 3.1 bis 3.7, 5, 7, 9, 10), `wp02/acceptance/2.md`

## Ergebnis

**bestanden.** Es gibt keinen blockierenden Befund.

## Prüfung der drei Fragen

1. **Abdeckung der Spezifikation, keine entfallenen Teile.**
   - `wp02` Umfang und die Tabelle der Abdeckung (Abschnitt 10 Punkte 3 bis 25, vorläufig 9 bis 13, 21, 22) decken alle Neuerungen ab:
     - Methoden und „Aktualisieren“, Namensraum, erste Verwendung, Stand einer Instanz und Wegregel
     - `Manuell`, Assistent, Hinweise nur in der Eigenschaftenansicht
     - Objekte beim Element ihrer ersten Verwendung, Gruppen nach req-ui-018, Linien und Umschalter
   - `grep` auf `Markttechnik`, „Parameter setzen“, „Objekte und ihre Werte“, „Prototyp“, „Start von Hand“ und `wert_vor` findet im Plan nur noch Stellen, die ihren Wegfall nennen (`wp02` Umfang) oder den Änderungsnachweis.
   - `wp03` setzt keinen entfallenen Teil voraus.
   - Umwandlung von 1.0 mit `Markttechnik`, „Parameter setzen“ und „Start von Hand“ (3.7) fällt unter „Lesen von 1.0“ in `wp02`.
2. **Abnahmekriterien.**
   - Die Kriterien 1, 2, 5, 6 und 12 von `wp02` und Kriterium 1 von `wp03` passen zur Spezifikation und sind vom Auftraggeber in der Testumgebung prüfbar.
   - Jedes Paket mit Oberfläche hat weiter ein Bedienbarkeitskriterium (Kriterium 1 in beiden Paketen).
3. **M1 und M2 aus `wp02/acceptance/2.md`.**
   - M1 („Keine Strategie geöffnet“ doppelt): Ziel und Kriterium 12 ("erscheint nur einmal, in der Eigenschaftenansicht").
   - M2 (Bereich „Objekte und ihre Werte“): Umfang, Ziel und Kriterium 6 (Objekt beim Element der ersten Verwendung, kein eigener Bereich).

## Blockierende Befunde

keine

## Hinweise

- H1 `wp02` Ziel: Es nennt „M1 der zweiten Abnahme“ als behoben, M2 nicht. M2 ist über Umfang und Kriterium 6 erledigt. Soll das Ziel M2 mit nennen, damit die Abnahme beide Mängel nachvollziehbar schließt?
- H2 `wp02` Kriterien 1 und 2: „ohne Anleitung“ und „so wie Abschnitt 5 der Spezifikation die Bedienung beschreibt“ stehen nebeneinander. Der Auftraggeber hat Abschnitt 5 nicht als Anleitung; woran misst er „wie beschrieben“, nachdem der bestätigte Prototyp als Maßstab entfallen ist?
- H3 `wp02` Kriterium 9 (Befunde): Es nennt die neuen Befunde aus 3.6 nicht: „Name doppelt vergeben“, „Instanz ohne Verbindung“, „Instanz an einem Element, an dem sie nicht verwendbar ist“. Kriterium 6 prüft nur das Anbieten, nicht den Befund. Sollen diese Befunde, wenigstens in einem Beispiel, in ein Kriterium?
- H4 `wp02` Kriterium 7 (Eigenschaftenansicht): Es verlangt Datentyp und mögliche Werte, nicht die sichtbare Beschreibung jeder Eigenschaft und Methode in Händlersprache (5.4, req-ui-016). Ebenso fehlt in Kriterium 6 die Karte mit Zeilen, die den Namen der Eigenschaft tragen, samt „Alle n anzeigen“ (5.3, Punkt 10). Prüft der Auftraggeber das nur nach eigenem Ermessen?
- H5 `wp02` Kriterium 8 (Bausteine): „vorheriger Wert von“ als Ersatz für den Wert vor einer Anzahl Kerzen (Punkt 23) kommt nur in der Dokumentation vor, nicht in einem Kriterium.
- H6 `wp02` Kriterium 12: Der Assistent erscheint nur als Angebot. Dass Elementbibliothek und Zeichenfläche währenddessen bedienbar bleiben und eine Auswahl Vorrang hat (5.5), und der Ort der Fenster (Punkt 21) sind nicht prüfbar formuliert. Gehört das in das Kriterium oder ins Ermessen des Auftraggebers?
- H7 `wp02` Kriterium 6: Das Löschen einer Verbindung (5.3, Weg über die Eigenschaftenansicht) und die Verwendung im Ausdruck (gestrichelte Linie) fehlen. Absichtlich ausgelassen?
