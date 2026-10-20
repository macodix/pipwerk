# Prüfbericht Dokumente des Auftraggebers, Vorhaben backtest, Durchlauf 1

- Rolle: QA
- Phase: 1 Anforderung, Prüfung vor der Präsentation, erster Durchlauf (vollständig)
- geprüfter Stand: `main`, Commit `b2179b9206ff20401271a50bcc115979588ad5dc`
- Ergebnis: **nicht bestanden**
- blockierende Befunde: 6 (B1 bis B6), Hinweise: 17 (H1 bis H17)

## Geprüfte Dokumente

- `docs/design/requirements/anforderungen-gesamtsystem.md`
- `docs/design/requirements/anforderungen-strategietester-backtester.md`
- `docs/design/domain/fachmodell.md`
- `docs/design/domain/indikator-markttechnik.md`
- `docs/design/strategies/str-01-fachlich-scalping-punkt-2-ausbruch-einfach.md` (Testfall `str-01`)
- `docs/design/strategies/str-03-fachlich-ema-trendfolge.md` (Testfall `str-03`)
- `docs/technical/glossar.md` (nur auf Widersprüche zu den geprüften Dokumenten)

Die Vergleichsdokumente `anforderungen-strategiedesigner.md` und `anforderungen-handelssystem.md` wurden nur auf Widersprüche zu den geprüften Dokumenten durchsucht. Gefunden wurde kein Widerspruch. Ein falscher Verweis auf `anforderungen-strategiedesigner.md` steht in H15.

## Ergebnis zum Nachweis des Vorhabens

Der Nachweis laut `scope.md` verlangt: Beide Testfälle lassen sich im Strategietester schrittweise prüfen und im Backtester über den vorbelegten Testzeitraum testen, ohne die Strategie zu bearbeiten. Mit dem geprüften Stand gelingt das an diesen Stellen nicht:

| Testfall | Stelle | Befund |
|---|---|---|
| `str-01`, `str-03` | Voraussetzungen: Tickgröße, Tickwert, Mindestvolumen, Pip und Spread des Instruments für die Risikoregel | B1 |
| `str-01` | Abschnitt 6: Verwaltung der Order mit Auslöser `Tick` | B2 |
| `str-03` | Abschnitt 3 und „Offene fachliche Fragen“: Prüfung der Risikoregel nach der Ausführung der Marktorder | B3 |
| `str-01` | Voraussetzungen und Abschnitt 1 bis 2: `Trendrichtung`, `Punkt 2`, `Punkt 1/3` und `Phase` des Indikators `Markttechnik` | B5, B6 |

B4 betrifft keinen der beiden Testfälle. Es ist ein Widerspruch zwischen Anforderungen.

## Blockierende Befunde

### B1 – Angaben zum Instrument: Datenbestand und Testkonto nennen andere Angaben als das Fachmodell

- Fundstelle: `anforderungen-gesamtsystem.md` req-system-025, dritter Punkt; `anforderungen-strategietester-backtester.md` req-test-005, Absatz „Die Angaben zum Instrument …“; `fachmodell.md` req-fach-051, Tabelle, Zeile `Instrument`; `str-01` Abschnitt „Voraussetzungen“, zweiter Absatz; `str-03` Abschnitt „Voraussetzungen“.
- Sachverhalt: req-system-025 und req-test-005 nennen als Angaben zum Instrument Kontraktgröße, Volumenschritte, Swap und Margin-Anforderung. Das Objekt `Instrument` hat laut req-fach-051 aber die Eigenschaften `Bezeichnung`, `Tickgröße`, `Tickwert`, `Punkt`, `Pip`, `Spread`, `Mindestvolumen` und `Volumenschritt`. Beide Testfälle brauchen Tickgröße, Tickwert, Mindestvolumen und Volumenschritt für die Risikoregel; `str-01` braucht außerdem Pip und Spread. Tickgröße, Tickwert, Mindestvolumen, Punkt und Pip stehen weder im Datenbestand noch unter den Angaben, die im Testlauf vorbelegt und geändert werden können. Umgekehrt sind Kontraktgröße, Swap und Margin-Anforderung keine Eigenschaften von `Instrument` im Fachmodell. Ohne diese Werte kann die Risikoregel in keinem Testlauf das Volumen bestimmen. Damit ist die Umsetzung beider Testfälle beeinträchtigt.
- Zuordnung: folgt aus einer Festlegung. Festlegung: req-fach-051 (Eigenschaften von `Instrument`; „der Strategietester [stellt die Werte] aus den Einstellungen des Testlaufs“ bereit) und die bestätigten Voraussetzungen von `str-01` und `str-03`.
- Kritikpunkt: Die Liste der Angaben zum Instrument in req-system-025 und req-test-005 deckt die Eigenschaften von `Instrument` nach req-fach-051 nicht ab. Die beiden Listen widersprechen sich.

### B2 – Auslöser `Tick` im Testlauf, wenn der Datenbestand keine Ticks hat

- Fundstelle: `anforderungen-gesamtsystem.md` req-system-025 („Ticks je Instrument, soweit verfügbar“); `anforderungen-strategietester-backtester.md` req-test-003, zweiter und dritter Absatz; `fachmodell.md` req-fach-053 (Auslöser `Tick`); `str-01` Abschnitt 6.
- Sachverhalt: In `str-01` hat die Verwaltung der Order den Auslöser `Tick`. Bei jedem Tick wird geprüft, ob der Kurs Punkt 1/3 durchbricht; dann wird die Order gelöscht. req-test-003 prüft vor dem Start nur, ob Kursdaten „für das Instrument, jede in der Strategie verwendete Zeiteinheit und den Testzeitraum“ vollständig sind. Ticks sind keine Zeiteinheit. Laut req-system-025 gibt es Ticks nur, „soweit verfügbar“. Nirgends steht, ob ein Testlauf mit Auslöser `Tick` Ticks im Datenbestand braucht und nicht startet, wenn sie fehlen, oder ob er auch ohne Ticks läuft und was dann einen Tick auslöst. req-test-003 sagt außerdem, dass Kursdaten nur aus dem Datenbestand kommen. Ob Ticks aus Kerzen nachgebildet werden dürfen, ist damit nicht geklärt. Ohne diese Festlegung lässt sich `str-01` nicht so umsetzen, dass sie im Backtester über den vorbelegten Zeitraum von 2 Jahren getestet werden kann.
- Zuordnung: Entscheidung des Auftraggebers. Es geht um eine Regel für den Start eines Testlaufs, die in keinem geltenden Dokument festgelegt ist.
- Frage: Was gilt für einen Testlauf, dessen Strategie oder Verwaltung einen Auslöser `Tick` hat? Müssen dann für das Instrument und den Testzeitraum Ticks im Datenbestand liegen (und gelten sie wie Kerzen als fehlende Daten nach req-test-003)? Oder darf der Testlauf auch ohne Ticks laufen, und woraus entstehen dann die Ticks?

### B3 – Maßnahme nach der Prüfung der Risikoregel bei der Ausführung einer Marktorder

- Fundstelle: `fachmodell.md` req-fach-021, letzter Absatz („Offen: welche Maßnahme bei einem negativen Ergebnis folgt. Betrifft die Ausführung.“); `str-03` Abschnitt „Offene fachliche Fragen“; `anforderungen-strategietester-backtester.md` req-test-004.
- Sachverhalt: `str-03` eröffnet jede Position mit einer Marktorder. Laut req-fach-021 werden die prüfenden Regeln nach der Ausführung mit dem Einstiegspreis erneut angewendet. Laut req-test-004 führt im Testlauf pipwerk selbst die Ausführung durch. Im Backtester wird jede Marktorder von `str-03` ausgeführt. Liegt der Einstiegspreis ungünstiger als der angenommene Preis, kann die Risikoregel bei der Prüfung nach der Ausführung scheitern. Was dann geschieht, ist offen. Der Punkt ist als offen gekennzeichnet. Nach `scope.md` ist er trotzdem ein Befund, weil der Testfall `str-03` ihn zum Testen braucht: Die interne Abwicklung muss bei diesem Ergebnis etwas tun, und das legt kein Dokument fest.
- Zuordnung: Entscheidung des Auftraggebers.
- Frage: Was geschieht im Testlauf (und laut req-test-004 ebenso im Handelssystem), wenn eine prüfende Regel nach der Ausführung einer Marktorder für die entstandene Position nicht erfüllt ist?

### B4 – Testlauf mit nur einem Instrument widerspricht req-test-006 und req-fach-053

- Fundstelle: `anforderungen-strategietester-backtester.md` req-test-001 („auf ein Instrument“), req-test-003 zweiter Absatz („für das Instrument“), req-test-005 vierter Absatz, req-test-006, req-test-007 letzter Satz; `fachmodell.md` req-fach-046 (Strategieparameter vom Objekttyp `Instrument`, Beispiel `Strategie.Filterinstrument`) und req-fach-053 („So kann eine Strategie mehrere Instrumente betrachten, von ihnen ausgelöst werden und auf ihnen Orders aufgeben.“).
- Sachverhalt: Laut Fachmodell darf eine Strategie weitere Instrumente verwenden: über einen Strategieparameter vom Objekttyp `Instrument` oder ein festes Instrument, für Auslöser, Kerzen, Indikatoren und Orders. Laut req-test-006 ist alles testbar, was das Handelssystem mit einer Strategie ausführen kann. Der Testlauf kennt aber nur „ein Instrument“. Die Prüfung und Beschaffung der Kursdaten in req-test-003 betrifft nur „das Instrument“, ebenso die Angaben zum Instrument in req-test-005. Eine Strategie mit einem zweiten Instrument wäre damit nicht testbar. Diese Einschränkung hat weder eine ausdrückliche Festlegung noch eine dokumentierte technische Erfordernis. Außerdem ist in req-test-007 unklar, was „einen Strategieparameter Instrument“ heißt: ein Strategieparameter mit dem Namen „Instrument“ oder jeder Strategieparameter vom Objekttyp `Instrument`. Eine Strategie kann mehrere davon haben.
- Zuordnung: folgt aus einer Festlegung. Festlegung: req-test-006, req-fach-053 (Entscheidung des Auftraggebers im Chat am 2026-10-19) und die Regel „Keine Einschränkung ohne Erfordernis“ im Entwicklungsverfahren.
- Kritikpunkt: req-test-001, req-test-003 und req-test-005 schränken den Testlauf ohne Grundlage auf ein Instrument ein. req-test-007 ist mehrdeutig, wenn eine Strategie mehrere Strategieparameter vom Objekttyp `Instrument` hat.

### B5 – Indikator Markttechnik: Trendrichtung, wenn der jüngste Wendepunkt ein Hoch ist

- Fundstelle: `indikator-markttechnik.md` Abschnitt 4.1, dritter Absatz, und Abschnitt 4.2; Verwendung in `str-01` Abschnitt 1 und 2.
- Sachverhalt: Laut 4.1 ist die Trendrichtung `aufwärts`, „sobald die letzten drei Wendepunkte ein Tief (Punkt 1), das folgende Hoch (Punkt 2) und ein Tief über Punkt 1 (Punkt 3) bilden“. Der vorläufige jüngste Wendepunkt zählt mit. Setzt der ZigZag nach Punkt 3 ein neues Hoch, sind die letzten drei Wendepunkte Hoch, Tief, Hoch. Das ist nach dem Wortlaut weder ein Aufwärts- noch ein Abwärtstrend, also `kein Trend`, und die Punkte sind nicht belegt. Abschnitt 4.3 setzt in genau diesem Zustand aber einen Aufwärtstrend mit `Phase` `Korrektur` und einem neuen `Punkt 2` voraus. Abschnitt 4.2 („`nein`, bis ein neuer Trend nach 4.1 entstanden ist“) lässt sich so lesen, dass die Trendrichtung nach dem Entstehen bestehen bleibt. 4.1 sagt aber nicht, wann ein Aufwärtstrend endet. `str-01` verwendet die Trendrichtung auf beiden Zeiteinheiten und plant nur bei übereinstimmender Trendrichtung einen Trade. Die Umsetzung des Indikators und damit des Testfalls hängt an dieser Frage.
- Zuordnung: Entscheidung des Auftraggebers. Die Bestimmung ist eine Regel des Auftraggebers (Änderungsnachweis 2026-10-19, „Bestimmung bestätigt“).
- Frage: Welche Trendrichtung und welche Punkte gelten, wenn der jüngste Wendepunkt eines Aufwärtstrends ein Hoch ist? Bleibt eine einmal entstandene Trendrichtung bestehen, und wenn ja, wodurch endet sie?

### B6 – Indikator Markttechnik: Phase während eines Anstiegs über Punkt 2

- Fundstelle: `indikator-markttechnik.md` Abschnitt 3, Abschnitt 4 (Zeile `Phase`) und Abschnitt 4.3; Verwendung in `str-01` Abschnitt 1 („Nur während der Bewegung wird die Strategie fortgesetzt.“).
- Sachverhalt: `Bewegung` gilt, wenn Punkt 2 überschritten ist „und der ZigZag hat seitdem kein neues Hoch gesetzt“. `Korrektur` gilt, wenn der ZigZag nach Punkt 2 ein Hoch gesetzt hat und der Kurs unter diesem Hoch liegt. Nach Abschnitt 3 ist der jüngste Wendepunkt vorläufig und kann sich verschieben. Es ist nicht gesagt, ob ein solches vorläufiges Hoch als „neues Hoch gesetzt“ zählt. Zählt es, ist die Phase bei jedem Kerzenschluss eines Anstiegs mit Schlusskurs unter dem Hoch der Kerze `Korrektur`. Liegt der Kurs genau auf dem Hoch, trifft keine der beiden Beschreibungen zu, obwohl `Phase` laut Tabelle bei Trendrichtung aufwärts belegt ist. Ob und wann der ZigZag nach dem Verfahren von MetaTrader 5 während eines Anstiegs ein vorläufiges Hoch setzt, habe ich nicht geprüft. Die Lücke im Text besteht unabhängig davon. `str-01` setzt die Auswertung nur in der Phase `Bewegung` fort. Die Umsetzung des Testfalls hängt an dieser Bestimmung.
- Zuordnung: Entscheidung des Auftraggebers.
- Frage: Zählt ein vorläufiges, noch verschiebbares Hoch des ZigZag in 4.3 als „neues Hoch gesetzt“? Welche Phase gilt, wenn der Kurs auf oder über dem jüngsten Hoch liegt?

## Hinweise

Die Hinweise verhindern das Bestehen nicht.

### H1 – Umrechnung des Tickwerts in die Kontowährung des Testkontos

- Fundstelle: req-test-005 (Kontowährung im Testkonto, Testkonto an kein Instrument gebunden); req-test-003 (Kursdaten nur für das Instrument); `str-01` Abschnitt 4; `str-03` Abschnitt 3.
- Sachverhalt: Die Risikoregel rechnet den Verlust bis zum Stop-Loss in Kapital um, also in die Kontowährung. Die Kontowährung wählt der Anwender im Testkonto frei. Ist sie eine andere Währung als die des Instruments, braucht die Umrechnung Kurse, die req-test-003 nicht prüft und nicht beschafft.
- Zuordnung: Sache der Spezifikation.
- Kritikpunkt: Woher der Tickwert in der Kontowährung kommt, legt kein Dokument fest.

### H2 – Vorlauf an Kursdaten vor dem Testzeitraum

- Fundstelle: req-test-003; `str-03` (EMA mit Periode 50, ATR mit Periode 14); `str-01` und `indikator-markttechnik.md` (ZigZag mit Depth 12).
- Sachverhalt: Indikatoren brauchen zu Beginn des Testzeitraums Kerzen davor. req-test-003 prüft und beschafft nur Daten für den Testzeitraum. Ein Vorlauf wird nicht erwähnt.
- Zuordnung: Sache der Spezifikation.

### H3 – Handelszeiten für die Unterscheidung von Lücke und Handelspause

- Fundstelle: req-test-003, letzter Absatz; req-system-025.
- Sachverhalt: Zeiten ohne Handel beim Broker sind keine Lücken. Der Datenbestand enthält laut req-system-025 aber keine Handelszeiten des Instruments. Woran die Prüfung eine Handelspause erkennt, ist nicht beschrieben.
- Zuordnung: Sache der Spezifikation.

### H4 – Abwicklung gegen Kerzen ohne Ticks

- Fundstelle: req-test-004; `str-01` Abschnitt 7 und 9; `str-03` Abschnitt 3 bis 5.
- Sachverhalt: Nicht beschrieben ist, zu welchem Preis eine Marktorder nach einem Kerzenschluss ausgeführt wird. Ebenso fehlt, wann eine Stop-Order ausgeführt wird und was gilt, wenn innerhalb einer Kerze Stop-Loss und Take-Profit beide erreicht werden. Ob Kerzen den Geld- oder den Briefkurs zeigen, steht auch nirgends. Das gilt unabhängig von der Entscheidung zu B2.
- Zuordnung: Sache der Spezifikation (wie req-test-004 umgesetzt wird).

### H5 – Spread, Kommission und Kosten im Testkonto

- Fundstelle: req-test-005 (Spread als fester Wert, Kommission); req-test-021 („Kosten“); req-system-025 (Spread je Kerze „soweit der Broker ihn liefert“).
- Sachverhalt: Die Einheit eines festen Spreads in einem Testkonto, das an kein Instrument gebunden ist, ist offen. Ebenso offen sind die Einheit der Kommission (zum Beispiel je Lot oder je Trade) und was die „Kosten“ eines Trades umfassen. Offen ist auch, was bei der Einstellung „aus den Kerzen“ gilt, wenn Kerzen keinen Spread haben.
- Zuordnung: Sache der Spezifikation.

### H6 – Hebel, Margin-Anforderung und `Konto.freie Margin` im Testlauf

- Fundstelle: req-test-005 (Hebel, Margin-Anforderung); `fachmodell.md` req-fach-051 (`Konto.freie Margin`), req-fach-049 (Regel zur freien Margin offen); `str-01` Abschnitt 4.
- Sachverhalt: Wozu Hebel und Margin-Anforderung im Testlauf dienen, ist nicht beschrieben. Offen ist auch, ob eine Order ohne ausreichende Margin abgelehnt wird und wie `Konto.freie Margin` belegt wird. Beide Testfälle brauchen das nicht; die freie Margin ist laut `scope.md` als offen gekennzeichnet.
- Zuordnung: offener Punkt.

### H7 – Mehrdeutiger Begriff „Strategietester“

- Fundstelle: `anforderungen-strategietester-backtester.md` Abschnitt 1 und req-test-003, req-test-004, req-test-006; req-system-001; `glossar.md` Einträge „Strategietester“ und „Backtester“.
- Sachverhalt: „Strategietester“ bezeichnet einmal die Hauptkomponente mit zwei Betriebsarten (Abschnitt 1, req-system-001), einmal nur die schrittweise Betriebsart neben dem Backtester (Abschnitt 1, erster Punkt; req-test-003 „Strategietester und Backtester“; Glossar). Das Glossar nennt nur die zweite Bedeutung.
- Zuordnung: Entscheidung des Auftraggebers (Benennung in seinen Dokumenten). Nicht blockierend.
- Frage: Soll die Hauptkomponente oder die schrittweise Betriebsart einen eigenen Namen erhalten?

### H8 – Auswahl von Instrument und Testzeitraum „aus den historischen Kursdaten“

- Fundstelle: req-test-001, zweiter Satz; req-test-002; req-test-003, zweiter Absatz; req-system-027, dritter Absatz.
- Sachverhalt: Nach req-test-001 wählt der Anwender Instrument und Testzeitraum „aus den historischen Kursdaten“. Das klingt nach einer Auswahl aus dem vorhandenen Bestand. Nach req-test-003 und req-system-027 werden fehlende Daten aber automatisch beschafft, auch wenn der vorbelegte Zeitraum von 2 Jahren noch nicht im Bestand liegt.
- Zuordnung: folgt aus einer Festlegung (req-test-003, req-system-027).
- Kritikpunkt: Der Wortlaut von req-test-001 widerspricht der automatischen Beschaffung.

### H9 – Testzeitraum: „30 Tage“ und „letzter vollständiger Handelstag“

- Fundstelle: req-test-002.
- Sachverhalt: Ob Kalendertage oder Handelstage gemeint sind, ist nicht gesagt. Offen ist auch, nach welcher Zeitzone ein Handelstag vollständig ist.
- Zuordnung: Sache der Spezifikation.

### H10 – Schrittweiser Ablauf: Grenzfälle und Bedeutung von „Auswertung“

- Fundstelle: req-test-011, req-test-012; `fachmodell.md` req-fach-049a, letzter Absatz; `glossar.md` Eintrag „Auswertung“.
- Sachverhalt: Nicht beschrieben ist, was geschieht, wenn der Testzeitraum keine handelnde Stelle enthält oder ein Sprung das Ende erreicht. Bei einem Auslöser werden zuerst die Verwaltungen, dann der Hauptablauf ausgewertet. Ob das eine Auswertung ist oder mehrere, ist offen. Davon hängt ab, welches „erste Element des Ablaufs dieser Auswertung“ beim Anhalten gemeint ist.
- Zuordnung: Sache der Spezifikation.

### H11 – Strategieparameter ohne Wert und Werte der Testfälle

- Fundstelle: req-test-007; `fachmodell.md` req-fach-046 (Wert „erst bei der Anwendung übergeben“); `str-01` Abschnitt „Parameter“ (Signalzeiteinheit, Handelszeiteinheit, Entry-Puffer, Stop-Puffer nur als Wertebereich).
- Sachverhalt: req-test-007 beschreibt nur Strategieparameter mit Wert. Was beim Start gilt, wenn ein Strategieparameter erst bei der Anwendung übergeben wird, steht nicht da. `str-01` nennt für vier Strategieparameter keinen festen Wert. Der Nachweis „ohne die Strategie zu bearbeiten“ bleibt möglich, weil req-test-007 Werte je Testlauf zulässt.
- Zuordnung: Sache der Spezifikation.

### H12 – Begriff „Trade“ und Kennzahlen

- Fundstelle: req-test-021, req-test-022; `fachmodell.md` (kein Objekt „Trade“); `glossar.md` (kein Eintrag „Trade“).
- Sachverhalt: „Trade“ ist nicht definiert. Offen ist zum Beispiel, ob eine teilweise geschlossene Position ein Trade ist oder mehrere. Offen ist auch, ob die Kontoentwicklung den Kontostand oder das Kapital einschließlich offener Positionen zeigt, und ob der größte Rückgang als Betrag oder in Prozent angegeben wird.
- Zuordnung: Sache der Spezifikation. Der Glossareintrag folgt daraus.

### H13 – `wartende Orders` und `offene Positionen` „auf jedem Instrument“

- Fundstelle: `fachmodell.md` req-fach-046, Eigenschaften `wartende Orders` und `offene Positionen`; `str-01` Abschnitt 2, letzter Absatz („auf diesem Konto und Instrument“).
- Sachverhalt: „auf jedem Instrument“ kann eine Zahl über alle Instrumente oder eine Zahl je Instrument bedeuten. `str-01` braucht die Zahl für das eigene Instrument. Bei einem Testlauf mit einem Instrument ist das Ergebnis gleich. Die Eigenschaften sind als vorläufig gekennzeichnet.
- Zuordnung: offener Punkt.

### H14 – Spread im Stop-Loss des Short-Trades von `str-01`

- Fundstelle: `str-01` Abschnitt „Offene fachliche Fragen“; req-test-005 (Spread aus den Kerzen).
- Sachverhalt: Mit dem Spread aus den Kerzen ändert sich der Spread bei fast jedem Kerzenschluss. Der neu berechnete Stop-Loss eines Short-Trades weicht dann fast immer von `Order.Stop-Loss` ab, und „Order ändern“ wird häufig erreicht. Für das Testen braucht es die Antwort nicht, der Testlauf führt die Strategie so aus, wie sie gebaut ist. Der Text „Für die Gestaltung im Strategiedesigner ohne Bedeutung“ sagt aber nichts über die Bedeutung für Test und Ausführung.
- Zuordnung: offener Punkt.

### H15 – Falscher Verweis auf req-fach-015

- Fundstelle: `anforderungen-strategietester-backtester.md` Abschnitt 5, Punkt 2 („Fachmodell req-fach-015“); `fachmodell.md` Änderungsnachweis, Zeile vom 2026-10-19 zu req-fach-015; `glossar.md` Einträge „Auslöser“, „Auswertung“, „Verwaltung einer Order“.
- Sachverhalt: req-fach-015 steht nicht im Fachmodell, sondern in `anforderungen-strategiedesigner.md` (Abschnitt „req-fach-015 -- Auslöser für Strategieauswertung“). Im Fachmodell steht die Auswertung ohne Auslöser in req-fach-046. Das Glossar nennt req-fach-015 ohne Dokument.
- Zuordnung: folgt aus einer Festlegung (Fundort der Kennung). Korrektur im Glossar durch den Softwarearchitekten.

### H16 – Fachmodell nennt das Handelssystem als Empfänger, wo auch der Strategietester gemeint ist

- Fundstelle: `fachmodell.md` Dokumentstatus („für Strategiedesigner und Handelssystem“), req-fach-016, req-fach-033 und req-fach-049 („übergibt die Order an das Handelssystem“), req-fach-019 (`Konto` „das Handelskonto“), req-fach-030 (Kompatibilitätsliste der Anbindung); `anforderungen-strategietester-backtester.md` req-test-004.
- Sachverhalt: Im Testlauf gibt es keine Verbindung zum Broker und keine Anbindung an eine Handelssoftware. Die Order geht an die interne Abwicklung, ihr Konto ist das Testkonto. Welche Ordertypen und Aktionen im Testlauf verfügbar sind, wenn es keine Kompatibilitätsliste gibt, ist nicht gesagt.
- Zuordnung: folgt aus einer Festlegung (req-test-004) für den Wortlaut; die Verfügbarkeit von Ordertypen und Aktionen im Testlauf ist Sache der Spezifikation.

### H17 – Herkunft der Strategie und Ablage gespeicherter Backtests

- Fundstelle: req-test-010, req-test-022; req-system-002, req-system-003, req-system-012, req-system-013.
- Sachverhalt: Der Strategietester ist eine eigene Hauptkomponente mit eigenem Speicher. Woher er die Strategie bezieht, ist nicht beschrieben. Offen ist auch, ob die gespeicherte Kopie der Strategie eines Backtests in den Objektspeicher gehört oder zu den übrigen Daten und wie der Strategiedesigner sie anzeigt.
- Zuordnung: Sache der Spezifikation.

## Glossar

Neben H7, H12 und H15 widerspricht das Glossar den geprüften Dokumenten nicht. Die Einträge „Testlauf“, „Testzeitraum“, „Testkonto“, „Interne Order“, „Handelnde Stelle“, „Datenbestand historischer Kursdaten“, „Import“ und „Beschaffung“ geben req-test-001 bis req-test-005, req-test-011 und req-system-025 bis req-system-027 richtig wieder.

## Zusammenfassung der Zuordnung

| Befund | blockierend | Zuordnung |
|---|---|---|
| B1 | ja | folgt aus Festlegung (req-fach-051, Voraussetzungen `str-01`, `str-03`) |
| B2 | ja | Entscheidung des Auftraggebers |
| B3 | ja | Entscheidung des Auftraggebers |
| B4 | ja | folgt aus Festlegung (req-test-006, req-fach-053, „Keine Einschränkung ohne Erfordernis“) |
| B5 | ja | Entscheidung des Auftraggebers |
| B6 | ja | Entscheidung des Auftraggebers |
| H7 | nein | Entscheidung des Auftraggebers |
| H8, H15, H16 (Wortlaut) | nein | folgt aus Festlegung |
| H1 bis H5, H9 bis H12, H16 (Verfügbarkeit), H17 | nein | Sache der Spezifikation |
| H6, H13, H14 | nein | offener Punkt |
