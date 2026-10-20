# Prüfbericht Spezifikation, Durchlauf 10

- Vorhaben: `strategiedesign`, ref `strategiedesign`
- Phase: 2, Nachprüfung nach Einwand des Auftraggebers (`revise`)
- Rolle: QA
- Prüfauftrag: `development/strategiedesign/reviews/specification-10-order.md`
- geprüfter Commit: `dab0894a1448278361b1d13bef2c4368e81a364d` (`origin/main`, der Commit, der den Prüfauftrag anlegt; ermittelt mit `git log -1 --format=%H -- development/strategiedesign/reviews/specification-10-order.md`)
- Gegenstand: Teil 1 Fachmodell req-fach-053, Satz zu `Instrument` ohne Instanz (Commit `adf784e`); Teil 2 die dafür geänderten Stellen der Spezifikation (`git diff 51a2810 dab0894 -- development/strategiedesign/specification.md`)

## Ergebnis

**Bestanden.**

Kein blockierender Befund in Teil 1 und Teil 2. Es gibt drei Hinweise. Sie verhindern das Bestehen nicht.

## Teil 1: Fachmodell req-fach-053

### Blockierende Befunde

Keine.

Geprüft: Der neue Satz in `docs/design/domain/fachmodell.md` Zeile 427 legt für jeden Zusammenhang ein Instrument fest:

- Indikator oder Trend: dessen Instrument
- Regel und Verwaltung einer Order: Instrument der Order beziehungsweise Position
- übriger Ablauf: Instrument des Auslösers
- Auslöser ohne Instrument (`Start von Hand`): Instrument der Anwendung

Damit hat `Instrument` ohne Instanz überall einen Wert, auch nach req-fach-046 Zeile 331 (jede Auswertung beginnt an einem Auslöser). Für die Regel und die Verwaltung passt das zu req-fach-051 Zeile 389 und Zeile 397: Dort bezeichnen `Order` und `Position` in einer Regel die Order, auf die die Regel angewendet wird, und in der Verwaltung die eigene Order. Mit dem Vermerk auf der letzten Folie von `development/strategiedesign/presentations/specification-2.html` (Zeile 174, Nachtrag 2026-10-20: „Indikator, Order, Auslöser, sonst Anwendung“) stimmt der Satz überein. Den Änderungsnachweis ergänzt Zeile 494.

### Hinweise

**T1-H1 – Vergleich „wie bei `Kerze` und `Tick` (req-fach-051)“ trifft nur teilweise zu.**

- Fundstelle: `docs/design/domain/fachmodell.md` Zeile 427 („ist wie bei `Kerze` und `Tick` (req-fach-051) das Instrument des Zusammenhangs gemeint“).
- Sachverhalt: Nach req-fach-051 (Zeile 389) haben `Kerze` und `Tick` ohne Instanz immer das Instrument des Auslösers, der die Auswertung gestartet hat. Eine Unterscheidung nach Indikator, Trend, Regel oder Verwaltung gibt es dort nicht. Für `Instrument` ohne Instanz legt der neue Satz diese Unterscheidung fest. In zwei Fällen rechnen `Kerze` und `Instrument` ohne Instanz deshalb mit verschiedenen Instrumenten:
  - in einer Verwaltung mit einem Auslöser auf einem anderen Instrument als dem der Order (die Spezifikation nennt diesen Fall selbst, 3.1 Zeile 95);
  - in einem eigenen Indikator oder Trend, dessen Parameter `Instrument` nicht mit dem Instrument des Auslösers belegt ist.

  Der Satz lässt sich also auf zwei Arten lesen. Erstens: Nur `Instrument` folgt dem Zusammenhang, und „wie bei `Kerze` und `Tick`“ ist ein ungenauer Vergleich. Zweitens: Auch `Kerze` und `Tick` sollen in einem Indikator oder Trend mit dessen Instrument rechnen. Dann stünde der Satz im Widerspruch zum Wortlaut von req-fach-051.
- Warum nicht blockierend: Der Wortlaut von req-fach-051 ist eindeutig. Die Spezifikation folgt der ersten Lesart (3.1 Zeile 95). Die Software lässt sich also umsetzen.
- Zuordnung: nicht eindeutig. Infrage kommen zwei Gruppen:
  - **folgt aus einer Festlegung**, nämlich aus dem Wortlaut von req-fach-051 Zeile 389 (`Kerze` und `Tick` ohne Instanz haben das Instrument des Auslösers). Dann betrifft der Befund nur den Vergleich.
  - **Entscheidung des Auftraggebers**, wenn die zweite Lesart gemeint ist. Dann lautet die Frage: Soll `Kerze` (und `Tick`) ohne Instanz in einem eigenen Indikator oder Trend mit dessen Instrument rechnen statt mit dem Instrument des Auslösers?

  Nach „Fragen an den Auftraggeber“ entscheidet der Softwarearchitekt die Zuordnung.

**T1-H2 – Instrument eines Trends ist im Fachmodell nicht festgelegt.**

- Fundstelle: `docs/design/domain/fachmodell.md` Zeile 427 („in einem Indikator oder Trend dessen Instrument“); req-fach-010 Zeilen 20 bis 24; req-fach-053 Zeile 427 („jeder Indikator [hat] den Parameter `Instrument`“).
- Sachverhalt: Der neue Satz setzt voraus, dass ein Trend ein Instrument hat. Das Fachmodell gibt aber nur jedem Indikator den Parameter `Instrument` (req-fach-053, req-fach-054 Zeile 431). Die Eigenschaften eines Trends in req-fach-010 sind `Richtung`, `Zeiteinheit` und `Berechnungsverfahren`, ein Instrument steht dort nicht. Die Spezifikation gibt dem Trend den Parameter `Instrument` (`development/strategiedesign/specification.md` Zeile 153).
- Warum nicht blockierend: Es ist eine Lücke ohne technischen Grund, sie zu schließen. Die Spezifikation deckt sie ab.
- Zuordnung: **folgt aus einer Festlegung**, nämlich aus req-fach-053 in der Fassung von `adf784e`: Der Satz nennt „Trend … dessen Instrument“.

## Teil 2: Geänderte Stellen der Spezifikation

### Blockierende Befunde

Keine.

Geprüft:

- **3.1, Tabelle der Zusammenhänge (Zeilen 86 bis 95).** Jeder Zusammenhang aus req-fach-053 ist abgebildet:
  - eigener Indikator oder Trend
  - Regel der Strategie oder eines Elements, mit Order oder Position
  - Verwaltung
  - übriger Ablauf, mit dem Instrument des Auslösers und mit `Start von Hand`

  Die Überschneidung „Regel in einem Indikator oder Trend“ ist eindeutig dem Indikator oder Trend zugeordnet. Das ist widerspruchsfrei, weil eine solche Regel `Order` und `Position` nicht ansprechen darf (Zeile 207, req-fach-051). Regeln, deren Ergebnis ein anderer Ausdruck verwendet, folgen 3.4 (Zeile 209). Der Satz zum eigenen Instrument in Indikator und Trend aus T2-H4 ist entfernt. Er stünde jetzt im Widerspruch zu req-fach-053.
- **Abschnitt 10 Punkt 19 (Zeile 501).** Er gibt req-fach-053 in der Fassung von `adf784e` vollständig wieder. Die Aussage zu „Risiko je Trade“ und `mindestvolumen` (`Order.Instrument`) bleibt richtig: In einer Regel ist `Instrument` ohne Instanz jetzt ohnehin das Instrument der Order.
- **Folgen in Abschnitt 10 (ab Zeile 507).** Die beiden entfernten Folgen beruhten auf der Fassung „immer das Instrument der Anwendung“ und sind mit der neuen Fassung überholt. Die Quellenangabe ist zutreffend auf req-core-002, req-fach-046 und req-fach-049a gekürzt. Die verbleibenden zwei Folgen stützen sich nicht auf req-fach-051 oder req-fach-053.
- **Status (Zeile 9) und Änderungsnachweis (Zeile 516).** Sie nennen den Nachtrag zur Abstimmung, Commit `adf784e`, den Wegfall von T2-H4 und die geänderten Abschnitte. Das deckt sich mit dem Diff.

### Hinweise

**T2-H1 – 3.1 sagt „wie `Kerze` und `Tick`“ und nennt zwei Sätze später den Unterschied.**

- Fundstelle: `development/strategiedesign/specification.md` Zeile 86 („`Instrument` ohne Instanz ist wie `Kerze` und `Tick` das Instrument des Zusammenhangs“) gegenüber Zeile 95 („In einer Verwaltung … rechnen `Kerze` ohne Instanz (Instrument des Auslösers) und `Instrument` ohne Instanz (Instrument der Order) mit verschiedenen Instrumenten“); ebenso Abschnitt 10 Punkt 19 (Zeile 501).
- Sachverhalt: Der einleitende Satz übernimmt den Vergleich aus dem Fachmodell (T1-H1). Die Tabelle und Zeile 95 zeigen aber, dass `Kerze` und `Instrument` ohne Instanz nicht demselben Zusammenhang folgen. Für die Verwaltung ist der Unterschied genannt. Für einen eigenen Indikator oder Trend fehlt er: Dort rechnet `Kerze` ohne Instanz mit dem Instrument des Auslösers (req-fach-051), `Instrument` ohne Instanz dagegen mit dem Parameter `Instrument` des Indikators (Zeile 90). Ist dieser Parameter anders belegt, rechnen zum Beispiel `Kerze.Schluss` und `Instrument.Pip` im selben Indikator mit verschiedenen Instrumenten. Vor dieser Änderung stand eine entsprechende Folge in Abschnitt 10. Sie ist mit dem Commit entfallen.
- Kritikpunkt: Ein Leser von Zeile 86 oder Punkt 19 kann annehmen, dass `Kerze` und `Instrument` ohne Instanz immer dasselbe Instrument haben. Ist der Unterschied im eigenen Indikator oder Trend für Anwender und Entwickler ausreichend erkennbar?
- Warum nicht blockierend: Die Tabelle legt das Verhalten eindeutig fest. Die Umsetzung ist nicht beeinträchtigt.
- Zuordnung: **Sache der Spezifikation.** Hängt mit T1-H1 zusammen. Fällt dort eine Entscheidung des Auftraggebers zu `Kerze` im Indikator oder Trend, ändert sich auch diese Stelle.

## Nicht geprüft

Nach dem Prüfauftrag nicht Gegenstand: alle übrigen Stellen der Spezifikation und des Fachmodells, die übrigen Hinweise aus `specification-9.md`, Glossar, Arbeitspaketplan und Code.
