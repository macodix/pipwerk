# Prüfbericht Dokumente des Auftraggebers, Vorhaben backtest, Durchlauf 2 (Nachprüfung)

- Rolle: QA
- Phase: 1 Anforderung, Nachprüfung vor der Präsentation
- geprüfter Stand: `main`, Commit `5a1072494849c0110f86804686ecb092dd9b6d3a`
- Vorheriger Durchlauf: `requirements-1.md` (Commit `b2179b9206ff20401271a50bcc115979588ad5dc`, nicht bestanden)
- Ergebnis: **nicht bestanden**
- blockierende Befunde: 1 (N1), Hinweise: 6 (N2 bis N7)

## Stand der Befunde aus Durchlauf 1

| Befund | Stand | Beleg |
|---|---|---|
| B1 | erledigt | req-system-025 nennt die acht Eigenschaften von `Instrument` (req-fach-051) und dazu Kontraktgröße, Swap, Margin-Anforderung. req-test-005 verweist darauf. Beide Listen stimmen überein. |
| B2 | erledigt | req-test-003: Bei Auslöser `Tick` gehören die Ticks zu den benötigten Kursdaten, keine Nachbildung aus Kerzen. Fehlen sie nach der Beschaffung, startet der Testlauf nicht (req-test-003, zweiter Absatz). |
| B3 | erledigt | req-fach-021 legt Teilschließung, sonst Schließung und Vermerk fest. Der offene Punkt in `str-03` ist entfernt. |
| B4 | erledigt | req-test-001, -003, -005, -007 sprechen von allen Instrumenten des Testlaufs und von jedem Strategieparameter vom Objekttyp `Instrument`. Kein Widerspruch zu req-test-006 und req-fach-053 mehr. |
| B5 | erledigt | 4.1 und 4.2 sagen, wann der Trend entsteht, besteht und endet. Offene Folgefälle stehen in N1. |
| B6 | erledigt | Eigenschaft `Phase` gestrichen, Bewegung und Korrektur nach 4.3 aus Kurs und Punkten. Die Frage, ob ein vorläufiger Wendepunkt zählt, kehrt in N1 wieder. |

Auch H7, H8, H15 und H16 sind umgesetzt. Ein Rest von H7 steht in N5.

## Neue blockierende Befunde

### N1 – Indikator Markttechnik: Punkte, wenn der jüngste Wendepunkt vorläufig ist oder ein Wendepunkt keinen höheren Tiefpunkt liefert (Nachfolger von B6)

- Fundstelle: `indikator-markttechnik.md` Abschnitt 3, Abschnitt 4 (Zeile `Punkt 1/3 endgültig`), 4.1 (zweiter Aufzählungsblock), 4.3; `str-01` Abschnitte 1 und 6.
- Sachverhalt:
  1. Abschnitt 3: Der jüngste Wendepunkt ist vorläufig und kann sich verschieben. 4.1 sagt: „`Punkt 2` ist das letzte Hoch, das der ZigZag gesetzt hat“, und `Punkt 1/3` wechselt erst, wenn der ZigZag nach dem Korrekturtief ein neues Hoch setzt. Nicht gesagt ist, ob das vorläufige jüngste Hoch schon `Punkt 2` ist.
     - Zählt es: Beim Anstieg liegt der Kurs nie über `Punkt 2`. Die Bewegung nach 4.3 („Kurs über `Punkt 2`“) tritt dann praktisch nicht ein.
     - Zählt es nicht: Der Kurs liegt bei einem Anstieg über `Punkt 2`. Die Stop-Order von `str-01` (Einstieg = `Punkt 2` + Spread + Puffer) liegt dann unter dem Kurs. `str-01` Abschnitt 1 behauptet aber, sie werde „erst ausgeführt, wenn der Kurs Punkt 2 überschreitet“. Wie die interne Abwicklung (req-test-004) eine solche Stop-Order behandelt, ist nirgends festgelegt.
  2. `Punkt 1/3` wird nach 4.1 erst bei einem neuen Hoch ein endgültiger Wendepunkt. Dann ist `Punkt 1/3 endgültig` immer `ja`. Die Eigenschaft und die Anpassung der Order bei „noch nicht endgültigem Punkt 1/3“ (`str-01` Abschnitt 6, offene Frage Short) setzen aber voraus, dass sie `nein` sein kann. Das ist nur möglich, wenn der vorläufige Wendepunkt als `Punkt 1/3` zählt.
  3. 4.1 sagt nicht, was gilt, wenn das neue Hoch unter dem bisherigen `Punkt 2` liegt oder das Korrekturtief unter dem bisherigen `Punkt 1/3`, ohne dass eine Kerze darunter schließt (ein Docht ist nach 4.4 kein Durchbruch). Das Korrekturtief würde nach dem Wortlaut `Punkt 1/3`, obwohl es kein höheres Tief ist.
  4. 4.3: Liegt der Kurs genau auf `Punkt 2` oder `Punkt 1/3`, trifft weder Bewegung noch Korrektur zu. Dieser Teil ist ein Hinweis, kein Grund für „blockierend“.
- Warum blockierend: `Punkt 2` und `Punkt 1/3` sind die Ausgabewerte, aus denen `str-01` Einstieg und Stop-Loss berechnet. Ohne Antwort zu 1 bis 3 lässt sich der Indikator nicht umsetzen, und der Testfall liefert je nach Lesart andere Orders.
- Zuordnung: Entscheidung des Auftraggebers (Regel des Auftraggebers zur Markttechnik, Änderungsnachweis 2026-10-21).
- Fragen:
  - Zählt der vorläufige jüngste Wendepunkt als `Punkt 2` beziehungsweise `Punkt 1/3`? Wenn ja, wie sind 4.3 und `Punkt 1/3 endgültig` gemeint? Wenn nein, wann kann `Punkt 1/3 endgültig` den Wert `nein` haben?
  - Was gilt für `Punkt 2` und `Punkt 1/3`, wenn der ZigZag ein niedrigeres Hoch oder ein tieferes Tief setzt, ohne dass eine Kerze jenseits von `Punkt 1/3` schließt?

## Hinweise

- N2 (Spezifikation): Für die Auslöser-Prüfung nennt req-test-003 nur den Auslöser `Tick`. Gilt die Pflicht zu Ticks auch, wenn eine Strategie das Objekt `Tick` ohne Auslöser `Tick` verwendet (req-fach-051)? Ebenso: „betroffene Instrumente“ ist nicht erklärt.
- N3 (Spezifikation): req-fach-021 sagt nicht, zu welchem Preis die Teilschließung erfolgt, und nicht, wo der Vermerk im Einzelschritt-Test oder im Handelssystem steht (nur „im Backtest bei dem Trade“). Eine Regel, die keine Volumenregel ist, führt über „nicht möglich“ zur vollständigen Schließung; das ist lesbar, aber nicht ausdrücklich.
- N4 (Spezifikation): req-test-001 lässt weitere feste Instrumente zu. Feste Instrumente tragen eine ISO-Bezeichnung (req-fach-053), der Datenbestand führt Angaben „je Broker“ (req-system-025). Das Testkonto ist an keinen Broker gebunden. Nicht gesagt ist, aus welchem Broker-Datenbestand ein Testlauf liest und wie die Bezeichnung dort einem Symbol zugeordnet wird.
- N5 (folgt aus Festlegung, Entscheidung 2026-10-21 zu H7): Die Datei heißt weiter `anforderungen-strategietester-backtester.md`. Im Glossar steht der Beispielwert `trend_intakt` (Eintrag Kennung) für die gestrichene Eigenschaft.
- N6 (folgt aus Festlegung, B5/B6): Reste der gestrichenen Begriffe: `str-01` Handelsidee („markttechnisch intakten Trend“), Abschnitt 6 („Trendkonstellation nicht mehr intakt“) und Parametertabelle („Trend und Marktphase“). Der Indikator kennt „intakt“ und „Phase“ nicht mehr.
- N7 (offener Punkt, Hinweis nur zur Kenntnis): req-fach-053 und Anforderungen Abschnitt 5 Punkt 2 kennzeichnen offen, wann `Start von Hand` im Testlauf eintritt. Das betrifft die Testfälle nicht.

## Zuordnung

| Befund | blockierend | Zuordnung |
|---|---|---|
| N1 | ja | Entscheidung des Auftraggebers |
| N2, N3, N4 | nein | Sache der Spezifikation |
| N5, N6 | nein | folgt aus Festlegung |
| N7 | nein | offener Punkt |

## Nachweis des Vorhabens

Beide Testfälle sind mit den Dokumenten ausführbar, bis auf `str-01`: Dort hängen Einstieg und Stop-Loss an den Punkten des Indikators (N1).
