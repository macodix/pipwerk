# Prüfbericht Spezifikation, Durchlauf 11

- Vorhaben: `strategiedesign`, ref `strategiedesign/wp02`
- Phase: 4, Arbeitspaket `wp02`, rein technische Ergänzung der Spezifikation
- Rolle: QA
- Prüfauftrag: `development/strategiedesign/reviews/specification-11-order.md`
- geprüfter Commit: `77bf3da94073d1998b2bf7aa300b5dec54c0a267` (`main`, ermittelt mit `git log -1 --format=%H -- development/strategiedesign/reviews/specification-11-order.md` auf `origin/main`)
- Art: Nachprüfung, beschränkt auf die im Prüfauftrag genannten Stellen
- Vergleichsstand: `git diff c63f37e 77bf3da -- development/strategiedesign/specification.md`
- Maßstab: Fachmodell in der Fassung von Commit `d8077ed` (req-fach-010, req-fach-051, dazu req-fach-053, auf das req-fach-051 verweist)

## Ergebnis

**bestanden**

Blockierende Befunde: keine. Hinweise: keine im Gegenstand. Eine Beobachtung außerhalb des Gegenstands steht unten.

## Prüfung der geänderten Stellen

### 3.1, Parameter `Instrument` (specification.md Zeile 77)

- Fachmodell `d8077ed`, req-fach-010: Der Trend hat die Eigenschaft `Instrument` – „das betrachtete Instrument, wie bei einem Indikator (req-fach-053)“.
- Spezifikation Zeile 77: „jeder Indikator, jeder Trend und die Eigenschaft `Instrument` der Order haben ihn“, mit Verweis auf req-fach-010. Vorbelegung und Bindungsarten sind dieselben wie beim Indikator.
- Übereinstimmung mit anderen Stellen: Die Vorlage `Trend` in 3.3 (Zeile 153) nennt schon „Parameter Instrument, Zeiteinheit und Berechnungsverfahren (req-fach-010 …)“. Die Tabelle in 3.1 (Zeile 90) setzt ein Instrument des Trends voraus. Kein Widerspruch.
- Ergebnis: setzt req-fach-010 vollständig und richtig um. T1-H2 aus `specification-10.md` ist erledigt.

### 3.1, Tabelle „ohne Instanz“ und Absatz darunter (Zeilen 86 bis 95)

- Fachmodell `d8077ed`, req-fach-051: Das Instrument der `Kerze` ohne Instanz und des `Tick` ohne Instanz „ist das Instrument des Zusammenhangs wie bei `Instrument` ohne Instanz (req-fach-053), sodass `Kerze`, `Tick` und `Instrument` ohne Instanz immer dasselbe Instrument bezeichnen“. Die Zeiteinheit der Kerze bleibt „die Zeiteinheit des Auslösers `Kerzenschluss`, der die Auswertung gestartet hat“.
- Spezifikation Zeile 86: Die Einleitung der Tabelle gilt jetzt für `Instrument`, `Kerze` und `Tick` ohne Instanz, mit Verweis auf req-fach-053 und req-fach-051.
- Die vier Zeilen der Tabelle (Zeilen 90 bis 93) entsprechen der Aufzählung in req-fach-053 (Fachmodell `d8077ed`): Indikator oder Trend, Regel, Verwaltung, übriger Ablauf mit `Start von Hand`.
- Zeile 95: „es ist für alle drei dasselbe; `Kerze.Schluss` und `Instrument.Pip` rechnen also immer mit demselben Instrument“. Das entspricht req-fach-051 wörtlich. Der frühere Satz, nach dem `Kerze` und `Tick` immer das Instrument des Auslösers haben und in Verwaltung, Indikator und Trend mit anderen Instrumenten rechnen, ist entfernt.
- Zeile 95, Zeiteinheit: „Die Zeiteinheit der `Kerze` ohne Instanz ist weiter die des Auslösers `Kerzenschluss` …; dafür gilt der Befund zu `Kerze` ohne Instanz in 3.6.“ Das entspricht req-fach-051. Die Zeile der Konsistenzprüfung in 3.6 (Zeile 290) betrifft nur die Zeiteinheit, ist unverändert und passt weiter.
- „Die Konsistenzprüfung braucht für das Instrument keinen Befund“ ist richtig: Jede Zeile der Tabelle liefert ein Instrument, auch bei `Start von Hand`.
- Ergebnis: setzt req-fach-051 vollständig und richtig um. T1-H1 aus `specification-10.md` und der damit verbundene Hinweis zu Zeile 79 dort sind erledigt.

### Abschnitt 10, Punkt 19 (Zeile 501)

- „`Kerze` und `Tick` ohne Instanz haben dasselbe Instrument des Zusammenhangs (req-fach-051).“ Das ersetzt „haben weiter immer das Instrument des Auslösers“ und entspricht dem Fachmodell `d8077ed`.
- Punkt 19 gibt eine Festlegung des Auftraggebers wieder („Ersetzt durch req-fach-053“). Die Änderung folgt seiner Festlegung im Fachmodell und ist keine neue Entscheidung der Spezifikation. Die Einordnung als rein technische Ergänzung nach dem Entwicklungsverfahren (Abschnitt „Meldungen“) ist deshalb nachvollziehbar.

### Status und Änderungsnachweis (Zeilen 9 und 516)

- Status, Zeile 9: Ein Satz zur Erledigung von T1-H1 und T1-H2 durch den Projektleiter (Commit `d8077ed`), die Angleichung als rein technische Ergänzung in Phase 4 und den Verweis auf `specification-11.md` ersetzt den früheren Satz „T1-H1 und T1-H2 … liegen beim Projektleiter“. Das ist inhaltlich richtig.
- Änderungsnachweis, Zeile 516: nennt Anlass, Fachmodell-Commit, die geänderten Abschnitte (3.1, 10 Punkt 19), die entfallene Aussage und dass keine Anforderung, kein Abnahmekriterium und kein Umfang geändert wird. Die Angaben stimmen mit dem Diff überein.

### Widerspruch an anderer Stelle der Spezifikation

Gesucht nach „ohne Instanz“, „Instrument des“, „verschiedenen Instrumenten“, `Kerze.`, `Tick.` und `Instrument.Pip` im geprüften Stand von `development/strategiedesign/specification.md`:

- 3.2 (Zeilen 103 und 106): Parameter `Instrument` an Auslösern und Objekten der Anwendung, ohne Aussage zum Fall ohne Instanz. Kein Widerspruch.
- 3.4, `PREVIOUS` (Zeile 168): nennt `Kerze` „auch ohne Instanz“ als Wert mit früherem Wert, ohne Aussage zum Instrument. Kein Widerspruch.
- 3.5 (Zeilen 239 und 244): „Risiko je Trade“ rechnet mit `Order.Instrument`. Kein Widerspruch.
- 3.6 (Zeile 290): nur Zeiteinheit, siehe oben.
- 6, Testfälle (Zeilen 434, 435, 440): `Instrument.Pip`, `Tick.Geld`, `Tick.Brief` und `Kerze.Schluss` ohne Instanz. In der Verwaltung von `str-01` (Zeile 435) haben `Tick.Geld` und `Tick.Brief` jetzt das Instrument der Order statt des Auslösers `Tick`. Beide sind in `str-01` das Instrument der Anwendung (Instanzen und Order ohne anderes Instrument, Zeile 433). Das erwartete Verhalten des Testfalls ändert sich dadurch nicht.
- Ältere Zeilen des Änderungsnachweises (Zeilen 519, 521, 524, 525) beschreiben frühere Fassungen und sind als Verlauf kein Widerspruch.

Ergebnis: Kein Widerspruch zur geänderten Festlegung gefunden.

## Blockierende Befunde

Keine.

## Hinweise

Keine im Gegenstand.

## Beobachtung außerhalb des Gegenstands

Das Fachmodell ist nach dem Prüfauftrag nicht Gegenstand. Die folgende Stelle ist kein Befund dieser Prüfung und verhindert das Bestehen nicht. Sie ist nur festgehalten, damit sie nicht verloren geht.

- Fundstelle: `docs/design/domain/fachmodell.md`, Fassung `d8077ed`, req-fach-053, erster Satz des Absatzes „Das Instrument kommt aus der Anwendung der Strategie …“.
- Sachverhalt: Der Satz zählt auf, wer den Parameter `Instrument` hat: `Instrument`, `Kerze`, `Tick`, die Auslöser `Kerzenschluss` und `Tick` und jeder Indikator. Der Trend fehlt dort. req-fach-010 gibt ihm seit `d8077ed` die Eigenschaft `Instrument`. Ein Widerspruch besteht nicht, die Aufzählung ist nur unvollständig. Die Spezifikation (Zeile 77) nennt den Trend.
- Zuordnung: folgt aus einer Festlegung (req-fach-010 in der Fassung `d8077ed`). Nach „Fragen an den Auftraggeber“ ist das Sache des Projektleiters, ohne Vorlage. Frage an den Softwarearchitekten: Soll diese Beobachtung an den Projektleiter gehen?

## Nicht geprüft

Nach dem Prüfauftrag nicht Gegenstand: alle übrigen Stellen der Spezifikation, das Fachmodell selbst (bis auf req-fach-010 und req-fach-051 als Maßstab), Glossar, Arbeitspaketplan, Code. Eine Testumgebung war für diesen Prüfauftrag nicht vorgesehen und wurde nicht abgefragt.

## Vermerk zum Arbeitsverzeichnis

Im Arbeitsverzeichnis der QA liegt das nicht versionierte Verzeichnis `.qa/` (`git status --short`: `?? .qa/`). Es stammt nicht aus dieser Prüfung. Es ist unverändert geblieben.
