# Spezifikation Vorhaben backtest

## Status

- status: `draft`
- stand: 2026-10-23
- komponenten: `packages/domain-core` (gemeinsame Python-Bibliothek, neues Teilpaket für die Ausführung), `packages/market-data` (neu, Datenbestand historischer Kursdaten), `components/pipwerk-replay` (neu, Strategietester, Backend und Oberfläche), `components/pipwerk-fetch-mt5` (neu, Beschaffung aus MetaTrader 5), `packages/ui-components` (Darstellung der Strategie), `components/pipwerk-studio` (Auslöser `Manuell`, Entfall von „Parameter setzen“), `contracts/`
- grundlage: [scope.md](scope.md) mit den dort genannten Dokumenten des Auftraggebers. Nachprüfung der Dokumente nach der Abstimmung bestanden in [requirements-5.md](reviews/requirements-5.md).
- stand der arbeit: Fassung vom 2026-10-21 bestätigt vom Auftraggeber im Chat am 2026-10-21 ([Präsentation](presentations/specification-1.html)). Änderung vom 2026-10-23 nach der Abnahme von `wp02` (Änderungsnachweis) zur Prüfung durch die QA und zur Präsentation, mit dem geänderten Prototyp der Ansicht „Datenbestand“.

## 1. Gegenstand

Der Strategietester, Produktname pipwerk replay, führt Strategien gegen historische Kursdaten aus, in den Betriebsarten Einzelschritt-Test und Backtest (Anforderungen an den Strategietester). Dazu gehören der Datenbestand historischer Kursdaten mit Import und Beschaffung (req-system-025 bis req-system-027) und die Testkonten (req-test-005).

Nachweis sind die Testfälle `str-01` und `str-03`: Jeder lässt sich im Einzelschritt-Test prüfen und im Backtest über den vorbelegten Testzeitraum testen, ohne die Strategie zu bearbeiten.

Nicht Gegenstand: das Handelssystem, die Kontoverwaltung, die Anzeige der Unterschiede zwischen Fassungen einer Strategie (offener Punkt 1 der Anforderungen; der Aufbau schließt sie nicht aus, weil ein gespeicherter Backtest eine vollständige Kopie der Strategie enthält, Abschnitt 6.5) und der zurückgestellte Indikator `Markttechnik`.

## 2. Architekturentscheidungen

- E1 Ausführung in der gemeinsamen Bibliothek. Auswertung von Ausdrücken, Berechnung der mitgelieferten Indikatoren, Ablauf der Strategie mit Auslösern und Verwaltungen, Bestimmung und Prüfung von Orders mit Regeln liegen im neuen Teilpaket `pipwerk_domain.execution` der Bibliothek `packages/domain-core`. Grund: Strategietester und Handelssystem müssen dieselbe Prüf- und Auswertungslogik verwenden (req-system-007, req-test-006). Die Ausführung kennt keinen Broker und keine Kursquelle; beides erhält sie über zwei Schnittstellen (Abschnitt 3.1).
- E2 Interne Abwicklung im Strategietester. Die Abwicklung von Orders gegen historische Kurse (req-test-004) ist die Umsetzung der Broker-Schnittstelle aus E1 in pipwerk replay (`pipwerk_replay.broker`). Das Handelssystem setzt dieselbe Schnittstelle später gegen einen echten Broker um.
- E3 Eigenständige Komponente `components/pipwerk-replay` mit Python-Paket `pipwerk_replay`, Startkonfiguration `pipwerk-replay.ini`, eigener Datenbank und eigener Oberfläche (req-system-001, req-system-002, req-system-008, req-system-016 bis req-system-018). Das Verzeichnis `components/pipwerk-backtest` mit seiner Platzhalter-README wird dazu umbenannt; Verweise ziehen mit. Aufbau, Startkonfiguration, Alembic und Prüfung des Kopfs `Host` folgen pipwerk Studio (`docs/technical/pipwerk-studio.md`, Abschnitte 2.1, 2.2, 2.10).
- E4 Datenbestand historischer Kursdaten als eigene Bibliothek `packages/market-data` (Paket `pipwerk_marketdata`): Speichermodell über SQLAlchemy mit Alembic, Import, Prüfung auf Vollständigkeit und Lesen. Grund: Der Datenbestand gehört pipwerk und nicht dem Strategietester (req-system-025); das Handelssystem soll ihn später ebenfalls nutzen können. pipwerk replay bindet sie wie die Bibliothek als Pfadabhängigkeit mit festgeschriebener Version ein. Die Datenbank des Datenbestands ist eine eigene Angabe der Startkonfiguration und kann dieselbe wie die von pipwerk replay sein (req-system-013, req-system-014).
- E5 Beschaffung aus MetaTrader 5 als eigenständiges kleines Programm `components/pipwerk-fetch-mt5`, das der Anwender auf dem Rechner von MetaTrader 5 aufruft (Übergangslösung nach req-system-027). Es liest mit dem Python-Paket `MetaTrader5` Kerzen, Ticks und Angaben zum Instrument und schreibt sie als Dateien im JSON-Format des Imports in ein Verzeichnis. Es hat keinen Server und öffnet keinen Port; pipwerk replay stößt es nicht an. Der Anwender importiert die Dateien im Datenbestand (5.3). Weitere Quellen sind weitere Programme, die Dateien im selben Format schreiben (Abschnitt 5.4). Den Austausch über pipwerk relay spezifiziert das Vorhaben, das pipwerk relay einführt.
- E6 Testkonten, Ergebnisse und gespeicherte Backtests liegen in der Datenbank von pipwerk replay über SQLAlchemy (req-system-015, „übrige Daten“). Strategien liest pipwerk replay als Dokument im Format 2.0 aus dem Objektverzeichnis (Einstellung wie in pipwerk Studio) oder als hochgeladene Datei; es ändert sie nie.
- E7 Gleiche Eingaben, gleiche Ergebnisse. Ein Testlauf ist vollständig durch Strategie, Werte der Strategieparameter, Testkonto, Angaben zum Instrument, Testzeitraum und Kursdaten bestimmt. Die Ausführung verwendet keine Uhrzeit des Rechners und keine Zufallszahlen. Einzelschritt-Test und Backtest verwenden denselben Ablauf und dieselbe Abwicklung (req-test-004); der Einzelschritt-Test hält nur an.
- E8 Der Einzelschritt-Test läuft im Backend als Sitzung, die die Ausführung an jedem Element anhält. Die Oberfläche fragt nach jedem Schritt den Zustand ab. Ein Zurückgehen um einzelne Schritte gibt es nicht (req-test-012 verlangt es nicht). „Zum Testbeginn“ beginnt die Sitzung mit denselben Eingaben neu; nach E7 ergibt das denselben Ablauf (Abschnitt 6.3).

## 3. Ausführung in der Bibliothek

### 3.1 Schnittstellen

Die Ausführung (`pipwerk_domain.execution`) erhält von der Anwendung:

| Schnittstelle | liefert beziehungsweise nimmt an |
|---|---|
| Kursquelle | abgeschlossene Kerzen je Instrument und Zeiteinheit bis zu einem Zeitpunkt, den letzten Tick, Angaben zum Instrument |
| Broker | Order stellen, Order ändern, Order löschen, Position ändern, Position schließen; jeweils mit Ergebnis „angenommen“ oder „abgelehnt“ mit Grund; Stand von Konto, Orders und Positionen |

Die Ausführung meldet jede Auswertung als Folge von Schritten (Element, Werte vor und nach dem Element, genommener Ausgang, Fehler). Der Einzelschritt-Test hält an diesen Schritten an, der Backtest verwirft sie bis auf Fehler und Ablehnungen (Abschnitt 6.4).

### 3.2 Auswertung von Ausdrücken

Die Bibliothek wertet Ausdrücke aus, die sie bisher nur zerlegt und prüft. Bedeutung von Funktionen, „leer“, „nicht verfügbar“ und Fehlern sowie ihre Wirkung je Stelle folgen der Spezifikation `strategiedesign`, Abschnitt 3.4, und `docs/technical/pipwerk-domain.md`, Abschnitt 8. Ausgewertet wird über den Syntaxbaum, nie mit `eval` oder Ähnlichem.

`PREVIOUS(x; n)` liefert den Wert von `x` beim `n`-ten zurückliegenden Eintreten seines Bezugs: bei einer Eigenschaft eines Objekts mit Zeiteinheit beim `n`-ten zurückliegenden Kerzenschluss dieser Zeiteinheit, bei `Tick` beim `n`-ten zurückliegenden Tick, beim Ergebnis einer Bedingung oder Berechnung bei der `n`-ten zurückliegenden Auswertung desselben Elements (req-fach-014). Fehlt der frühere Wert, ist er „leer“.

Indikatoren ohne Werte zu Beginn eines Testlaufs (req-test-008): Solange ein Indikator noch keinen Wert hat, sind seine Eigenschaften „leer“. Eine Bedingung, deren Ergebnis dadurch ein Fehler ist, nimmt den Ausgang `falsch`; der Testlauf läuft weiter. `ISBLANK` liefert für solche Werte „wahr“, ohne Fehler. Das gilt in jeder Auswertung, nicht nur zu Beginn: Die Wirkung von „leer“ ist überall dieselbe (Tabelle in `pipwerk-domain.md`, Abschnitt 8). Eine Belegung einer Eigenschaft einer Order mit „leer“ macht die Eigenschaft nicht bestimmbar (Ausgang `nicht gestellt`).

### 3.3 Mitgelieferte Indikatoren

Die Bibliothek berechnet `EMA`, `ATR` und `ZigZag` aus abgeschlossenen Kerzen ihres Instruments und ihrer Zeiteinheit (req-fach-054), nach den Verfahren der gleichnamigen Indikatoren von MetaTrader 5:

- `EMA`: Glättungsfaktor 2 / (Periode + 1), Start mit dem einfachen Durchschnitt der ersten Periode, `Anwenden auf` wie MetaTrader 5, `Verschiebung` verschiebt um ganze Kerzen. Vor der vollen Periode „leer“.
- `ATR`: einfacher gleitender Durchschnitt der True Range über die Periode, wie MetaTrader 5. Vor der vollen Periode „leer“.
- `ZigZag`: Verfahren des ZigZag von MetaTrader 5 mit `Depth`, `Deviation` (in Punkten des Instruments) und `Backstep`. Jüngere Wendepunkte können sich mit neuen Kerzen noch verschieben, wie bei MetaTrader 5.

Eigenschaften des `ZigZag` für die Ausführung: Neben den Wendepunkten nach Spezifikation `strategiedesign`, Abschnitt 3.2, hat der `ZigZag` die Eigenschaften `letztes Hoch`, `vorletztes Hoch`, `letztes Tief`, `vorletztes Tief` (Kennungen `letztes_hoch`, `vorletztes_hoch`, `letztes_tief`, `vorletztes_tief`, Zahl): der Kurs des jüngsten beziehungsweise zweitjüngsten endgültigen Hochs und Tiefs. Grund: Fachmodell req-fach-054 verlangt sie für `str-01`; mit den drei jüngsten Wendepunkten sind zwei endgültige Hochs und Tiefs nicht immer erreichbar. Gibt es den Wendepunkt noch nicht, ist die Eigenschaft „leer“. Endgültig heißt: nach dem Verfahren von MetaTrader 5 nicht mehr verschiebbar; welche Wendepunkte das innerhalb von `Backstep` sind, legt der Vergleich mit Werten aus MetaTrader 5 fest (Abschnitt 10). Die Typbeschreibung des `ZigZag` wird darum ergänzt.

Ein Indikator wird nur aus Kerzen berechnet, die im Testzeitraum liegen. Kursdaten vor dem Testzeitraum werden nicht geladen (req-test-008 lässt den Testlauf ohne Werte beginnen).

Eigene Indikatoren und Trends (Vorlagen vom Objekttyp `Indikator` und `Trend`) wertet die Ausführung über ihre Ausdrücke aus: Ihre eigenen Eigenschaften werden bei jedem Kerzenschluss ihrer Zeiteinheit neu berechnet.

### 3.4 Ablauf, Auslöser und Verwaltungen

Zeitachse: Die Ausführung erhält von der Anwendung eine geordnete Folge von Ereignissen: Ticks (nur wenn ein Auslöser `Tick` vorkommt) und Kerzenschlüsse aller Zeiteinheiten und Instrumente, die Auslöser verwenden. Ein Kerzenschluss tritt zum Ende der Kerze ein (Eröffnungszeitpunkt plus Dauer der Zeiteinheit). Zum selben Zeitpunkt gilt die Reihenfolge: Ticks vor Kerzenschlüssen, Kerzenschlüsse nach aufsteigender Zeiteinheit, dann nach der Bezeichnung des Instruments. Vor jedem Ereignis hat die Abwicklung alle Kursbewegungen bis zu diesem Zeitpunkt verarbeitet (Abschnitt 4.2).

Ein Ereignis startet jede Auswertung, deren Auslöser dazu passt: zuerst die Verwaltungen der bestehenden Orders und Positionen in der Reihenfolge, in der die Orders gestellt wurden, danach der Hauptablauf (req-fach-049a). Eine Verwaltung ohne eigene Auslöser wird beim Stellen der Order in derselben Auswertung durchlaufen und bei späteren Auslösern nicht erneut (req-fach-049; das bestätigt die Annahme aus Spezifikation `strategiedesign`, Abschnitt 3.3). Eine Verwaltung endet, wenn ihre Order gelöscht, abgelaufen oder abgelehnt ist oder ihre Position geschlossen ist.

Eine Auswertung folgt den Verbindungen ab dem Auslöser. Rückführungen sind zulässig (req-fach-047); gegen Endlosschleifen bricht eine Auswertung nach 10 000 Elementen ab, vermerkt einen Fehler und der Testlauf läuft weiter.

`Strategie.wartende Orders` und `Strategie.offene Positionen` zählen die Orders mit Status `wartend` und die offenen Positionen dieses Testlaufs auf jedem Instrument (req-fach-046).

Auslöser `Manuell` (Fachmodell req-fach-053, Anforderungen req-test-015): Die Ausführung kennt ihn als Ereignis ohne Instrument und ohne Zeiteinheit. Er startet nur den Hauptablauf, nie eine Verwaltung. Wann er eintritt, bestimmt die Anwendung: im Testlauf einmal zum Zeitpunkt nach Abschnitt 6.1, im Einzelschritt-Test zusätzlich auf Befehl (Abschnitt 6.3). Fallen `Manuell` und andere Ereignisse auf denselben Zeitpunkt, kommt `Manuell` zuerst. Grund: Standardmäßig tritt er vor der ersten Kerze ein (req-test-015); dieselbe Regel gilt dann auch für einen eingegebenen Zeitpunkt.

Strategieparameter behalten während eines Testlaufs den Wert, mit dem er gestartet wurde. Ein Element, das sie ändert, gibt es nicht (Fachmodell req-fach-047).

### 3.5 Orders und Regeln

„Order aufgeben“ bildet die Order nach req-fach-021: direkt übergebene Werte, dann bestimmende Regeln der Strategie, dann der Elemente in der Reihenfolge des Ablaufs (req-fach-046), Vollständigkeit, prüfende Regeln. Ist das erfolgreich, übergibt sie die Order dem Broker. Lehnt der Broker ab, nimmt „Order aufgeben“ den Ausgang `nicht gestellt`, die Order hat den Status `abgelehnt` und der Grund ist vermerkt (req-test-004). Sonst Ausgang `gestellt`.

„Order ändern“ und „Position ändern“ wenden vor der Übergabe an den Broker die prüfenden Regeln der Strategie und des Elements auf die geänderte Order beziehungsweise Position an. Ist eine nicht erfüllt, nehmen sie den Ausgang `nicht geändert`, ohne Übergabe an den Broker (req-fach-049a).

Ablehnung durch den Broker bei den übrigen Elementen (Hinweis H8 aus `requirements-4.md`): „Order ändern“ und „Position ändern“ nehmen den Ausgang `nicht geändert`, Order beziehungsweise Position bleiben unverändert. „Order löschen“ und „Position schließen“ gehen weiter; Order beziehungsweise Position bleiben bestehen. In jedem Fall ist der Grund vermerkt und sichtbar wie bei „Order aufgeben“.

Prüfung nach der Ausführung einer Marktorder (req-fach-021): Die Ausführung wendet die prüfenden Regeln auf die entstandene Position mit ihrem Einstiegspreis an. Ist eine nicht erfüllt, schließt sie die Position in Schritten des Volumenschritts teilweise, bis die Regel erfüllt ist und das Restvolumen mindestens das Mindestvolumen ist, sonst ganz. Der Vorgang wird beim Trade vermerkt.

### 3.6 Anpassung der Bibliothek an die Entscheidungen vom 2026-10-21

Das Vorhaben `strategiedesign` setzt den Auslöser noch als „Start von Hand“ und das Element „Parameter setzen“ um (Spezifikation `strategiedesign`, Abschnitte 3.2 und 3.3). Dieses Vorhaben stellt Bibliothek und pipwerk Studio auf die Entscheidungen des Auftraggebers um (Fachmodell req-fach-047, req-fach-053; Anforderungen an den Strategiedesigner req-fach-015, req-ui-003):

- Auslöser: Name „Manuell“, englisch „Manual“, Beschreibung und Erklärung entsprechend. Die Kennung `trigger.manual_start` bleibt. Grund: Sie steht in gespeicherten Strategiedokumenten; eine geänderte Kennung würde diese ungültig machen.
- Konsistenzprüfung: Ein Auslöser `Manuell` in der Verwaltung einer Order ist ein Fehler `trigger.manual_in_management` am Auslöser.
- Das Element `flow.set_parameter` entfällt aus Katalog, Konsistenzprüfung und Operationen. Ein Strategiedokument, das es noch enthält, behandelt die Bibliothek wie jeden unbekannten Elementtyp (Befund `type.unknown`, `docs/technical/pipwerk-domain.md`, Abschnitt 9). Eine Umwandlung alter Dokumente gibt es nicht. Grund: Strategien mit diesem Element sind nur zum Ausprobieren entstanden; der Anwender ersetzt es selbst durch einen weiteren Strategieparameter (req-fach-047).
- pipwerk Studio zeigt Auslöser und Elemente aus dem Katalog der Bibliothek. Darüber hinaus ändert sich dort nur, was einen der beiden Begriffe nennt (Texte, Tests, Anwenderdokumentation).

## 4. Interne Abwicklung

### 4.1 Kurse und Spread

Kerzen enthalten Geldkurse (Bid), wie MetaTrader 5 sie liefert. Briefkurs (Ask) = Geldkurs + Spread. Spread nach Testkonto: „aus den Kerzen“ verwendet den Spread der Kerze beziehungsweise bei Ticks Geld und Brief des Ticks; „fest“ verwendet den festen Wert für jeden Kurs. Liefert der Broker für eine Kerze keinen Spread, gilt der Spread der Angaben zum Instrument.

Die Abwicklung verfolgt den Kurs feiner als die Zeiteinheiten der Strategie:

- Gehören Ticks zu den benötigten Kursdaten (req-test-003), mit den Ticks.
- Sonst mit den Kerzen der Zeiteinheit M1 jedes Instruments, auf dem die Strategie Orders aufgeben kann. Innerhalb einer Kerze M1 nimmt sie den Weg Eröffnung, Tief, Hoch, Schluss bei einer steigenden Kerze und Eröffnung, Hoch, Tief, Schluss bei einer fallenden, wie das Verfahren „1 Minute OHLC“ von MetaTrader 5. M1 gehört dann zu den benötigten Kursdaten des Testlaufs. Grund: Ohne einen Kursverlauf innerhalb einer großen Kerze lässt sich nicht entscheiden, ob Stop-Loss oder Take-Profit zuerst erreicht wurde.

### 4.2 Ausführung

- Kontoform: Jede ausgeführte Order ergibt eine eigene Position (wie ein Konto mit gegenläufigen Positionen bei MetaTrader 5). Grund: Jede Order hat ihre eigene Verwaltung (req-fach-049a).
- Marktorder und „Position schließen“: sofortige Ausführung beim Element, zum letzten Kurs zum Zeitpunkt des Ereignisses, das die Auswertung gestartet hat (Eröffnung einer `buy`-Position und Schließen einer `sell`-Position am Brief, Eröffnung einer `sell`-Position und Schließen einer `buy`-Position am Geld). Dieser Kurs ist auch der angenommene Preis für die Regeln (req-fach-019). Position, Konto, freie Margin, `Order.Status`, `Strategie.wartende Orders` und `Strategie.offene Positionen` zeigen danach in derselben und in jeder folgenden Auswertung den neuen Stand. Grund: Eine Verwaltung schließt so die alte Position, bevor der Hauptablauf desselben Ereignisses eine neue eröffnet (req-fach-049a, `str-03`). Auch „Order ändern“, „Order löschen“ und „Position ändern“ wirken sofort.
- Stop-Order und Limit-Order: Ausführung, sobald der Kurs den Preis erreicht (Kauf am Brief, Verkauf am Geld), zum Preis der Order; springt der Kurs über den Preis hinweg, zum ersten Kurs danach. Stop-Limit-Order: Beim Erreichen des Auslösepreises entsteht eine Limit-Order zum Limitpreis.
- Stop-Loss und Take-Profit einer Position: geprüft am Geld bei `buy`, am Brief bei `sell`; geschlossen zum Preis von Stop-Loss beziehungsweise Take-Profit, bei einem Sprung zum ersten Kurs danach.
- Gültigkeit: „bis Tagesende“ endet mit dem Tageswechsel der Kursdaten, „bis Zeitpunkt“ und „bis Ende eines Tages“ zur angegebenen Zeit; Status `abgelaufen`.
- Teilausführungen gibt es im Testlauf nicht: Historische Kursdaten enthalten keine Markttiefe. Der Status `teilausgeführt` kommt nicht vor.
- Kosten: Kommission des Testkontos je Lot und Seite in Kontowährung, bei Eröffnung und Schließung. Swap nach den Angaben zum Instrument je Lot und Tag beim Tageswechsel, dreifach an dem Wochentag, den die Angaben nennen.
- Gewinn oder Verlust: Kursdifferenz / Tickgröße × Tickwert × Volumen. Der Tickwert der Angaben zum Instrument gilt als Wert in der Kontowährung und für den ganzen Testlauf. Weicht die Währung der Angabe von der Kontowährung des Testkontos ab, zeigt die Vorbereitung einen Hinweis; der Anwender kann den Tickwert für den Testlauf ändern (req-test-005).
- Kapital = Kontostand + offener Gewinn oder Verlust aller Positionen. Freie Margin = Kapital − Margin aller offenen Positionen. Margin einer Position = Volumen × Margin-Anforderung je Lot, wenn die Angaben sie nennen, sonst Volumen × Preis × Tickwert / Tickgröße / Hebel des Testkontos.
- Fällt das Kapital auf null oder darunter, schließt die Abwicklung alle Positionen, löscht alle Orders und beendet den Testlauf mit dem Vermerk „Konto aufgebraucht“. Grund: Ein Broker schließt bei aufgebrauchtem Kapital alle Positionen und nimmt keine Order mehr an (req-test-004); ein Weiterlaufen bis zum Ende des Testzeitraums (req-test-020) ergäbe nur noch Ablehnungen.

### 4.3 Ablehnungsgründe

Die Abwicklung lehnt ab wie ein Broker (req-test-004, Hinweis H7 aus `requirements-4.md`). Maßgeblich ist der Kurs zum Zeitpunkt der Auswertung:

| Grund (Kennung) | Fall |
|---|---|
| `price_wrong_side` | Stop-Order: Kauf mit Preis nicht über dem Brief, Verkauf mit Preis nicht unter dem Geld; Limit-Order umgekehrt; Stop-Limit-Order: Auslösepreis wie Stop-Order, Limitpreis nicht auf der Seite einer Limit-Order zum Auslösepreis |
| `stops_invalid` | Stop-Loss oder Take-Profit auf der falschen Seite des Preises der Order beziehungsweise bei einer Position des aktuellen Kurses (Kauf: Stop-Loss unter, Take-Profit über dem Preis) |
| `volume_invalid` | Volumen unter dem Mindestvolumen oder kein Vielfaches des Volumenschritts |
| `no_money` | freie Margin reicht für die Margin der Order nicht |
| `market_closed` | für das Instrument liegt zu diesem Zeitpunkt kein Kurs vor (Handelspause) |
| `no_prices` | für das Instrument liegen im Testlauf keine Kursdaten vor, weil erst ein Ausdruck bei der Ausführung es bildet (Abschnitt 6.1) |
| `not_pending` | Order ändern oder löschen bei einer Order, die nicht mehr wartet; Position ändern oder schließen ohne offene Position |
| `close_volume_invalid` | Volumen von „Position schließen“ größer als die Position oder Rest unter dem Mindestvolumen |

Beim Testfall `str-01` liegt der Einstieg einer Stop-Order zum Kauf über dem Einstiegsbezug (Einstiegsbezug + Spread + Entry-Puffer). Abgelehnt wird sie nur, wenn der Brief diesen Preis bereits erreicht hat (`price_wrong_side`).

## 5. Datenbestand historischer Kursdaten

### 5.1 Inhalt

`pipwerk_marketdata` speichert je Broker (Name, bei MetaTrader 5 der Name des Handelsservers, req-system-027) und Instrument (Bezeichnung nach Fachmodell req-fach-053):

- Kerzen je Zeiteinheit: Eröffnungszeitpunkt (UTC), Eröffnung, Hoch, Tief, Schluss, Volumen, Spread (Punkte, wenn geliefert)
- Ticks: Zeitpunkt (UTC, Millisekunden), Geld, Brief
- Angaben zum Instrument nach req-system-025, darunter die Kontraktgröße, mit Zeitpunkt der Beschaffung, Währung des Tickwerts, Swap long und short, Wochentag des dreifachen Swaps, Margin-Anforderung je Lot
- für jede Reihe die abgedeckten Zeiträume und die Handelszeiten, die die Quelle liefert

pipwerk berechnet keine Kerzen aus Ticks und keine Ticks aus Kerzen (req-system-025, req-test-003).

Zeitpunkte werden in UTC gespeichert. MetaTrader 5 und sein CSV-Export liefern die Serverzeit des Brokers. Import und Beschaffung rechnen sie in UTC um: beim Import einer CSV-Datei nach der Zeitzone, die der Anwender beim Import im Datenbestand angibt (Name nach IANA, zum Beispiel mit Sommerzeit; eine beim Wechsel der Sommerzeit doppelte Ortszeit gilt als die frühere, eine fehlende ist eine abgelehnte Zeile), bei `pipwerk-fetch-mt5` nach der Zeitzone in seiner Startkonfiguration. Grund: Tageswechsel, Swap, Gültigkeit von Orders und die Grenzen des Wochenendes (5.2) beziehen sich dann im ganzen Datenbestand auf dieselbe Zeit.

Welcher Broker im Testlauf gilt, ist eine Einstellung von pipwerk replay („Broker für Testläufe“, bisher Standardquelle), wählbar in der Ansicht „Datenbestand“ unter den Brokern, die im Datenbestand vorkommen, und änderbar in der Vorbereitung eines Testlaufs. Ist kein Broker gewählt oder kommt der gewählte nicht mehr vor, gilt der erste Broker des Datenbestands in alphabetischer Reihenfolge.

### 5.2 Vollständigkeit

Benötigt sind für einen Testlauf (req-test-003): für jedes Instrument des Testlaufs die Kerzen jeder Zeiteinheit, die die Strategie verwendet, die Kerzen M1 beziehungsweise die Ticks nach Abschnitt 4.1, die Ticks bei einem Auslöser `Tick`, und die Angaben zum Instrument. Die Zeiteinheiten ergeben sich aus der Strategie mit den Werten der Strategieparameter dieses Testlaufs.

Eine Lücke ist ein Zeitraum ohne Kerze innerhalb der Handelszeiten der Quelle. Fehlen Handelszeiten, gilt eine Kerze als fehlend, wenn zwischen zwei Kerzen mehr als die doppelte Dauer der Zeiteinheit liegt und der Zeitraum nicht ganz in ein Wochenende (Freitag 22:00 bis Sonntag 22:00 UTC) fällt. Einzelne fehlende Kerzen M1 innerhalb einer Stunde mit Kerzen gelten nicht als Lücke, weil Broker in ruhigen Minuten keine Kerze liefern. Die genauen Schwellen legt der Auftrag fest und dokumentiert sie in der technischen Dokumentation.

### 5.3 Import

Dateiformate (req-system-026): JSON nach dem Schema `contracts/market-data/v1/` und CSV im Exportformat von MetaTrader 5 für Kerzen und Ticks. Eine Datei enthält genau eine Reihe (Broker, Instrument, Zeiteinheit oder Ticks) beziehungsweise die Angaben zu einem Instrument. Zeitpunkte in JSON-Dateien sind UTC. Der Import prüft Format, Zeitordnung, Kurse größer als null, Hoch ≥ Eröffnung, Schluss ≥ Tief, und übernimmt die Daten jeder Datei in einer eigenen Transaktion. Eine Datei mit Fehler im Format wird ganz abgelehnt; fehlerhafte Zeilen werden mit Grund übersprungen. Vorhandene Kerzen oder Ticks desselben Zeitpunkts werden ersetzt.

Ein Vorgang importiert beliebig viele Dateien (req-system-026, Abnahmebericht `wp02`, M3):

- Broker einmal für alle Dateien des Vorgangs. Vorgeschlagen werden die Broker des Datenbestands, ein neuer Name lässt sich eingeben. Nennen alle JSON-Dateien des Vorgangs denselben Broker, ist er vorbelegt. Der angegebene Broker gilt auch für JSON-Dateien.
- Zeitzone einmal für alle CSV-Dateien des Vorgangs (5.1).
- Instrument und Daten (Zeiteinheit, Ticks oder Angaben zum Instrument) je Datei: bei JSON aus dem Inhalt, bei CSV aus dem Dateinamen, soweit er sie enthält; je Datei änderbar. Fehlt eine Angabe, wird der Vorgang erst nach ihrer Eingabe gestartet.
- Das Ergebnis nennt je Datei übernommene Zeilen, Zeitraum und abgelehnte Zeilen mit Grund. Eine abgelehnte Datei hindert die übrigen nicht. Grund: Der Anwender sieht, welche Datei er korrigieren muss, und importiert nur diese erneut.

Begrenzungen gegen Überlast: Größe einer Datei, Zahl der Zeilen, Zahl der Dateien und Gesamtgröße eines Vorgangs; Werte legen die Aufträge fest.

### 5.4 Beschaffung

Übergangslösung bis pipwerk relay (req-system-027, req-test-003): pipwerk replay beschafft nichts, weder vor dem Start eines Testlaufs noch von Hand. Kursdaten kommen nur über den Import in den Datenbestand.

Aufruf von `pipwerk-fetch-mt5` auf dem Rechner von MetaTrader 5 an der Befehlszeile mit: einem oder mehreren Instrumenten, den Zeiteinheiten, wahlweise Ticks, dem Zeitraum (von, bis) und dem Zielverzeichnis (Hinweis H4 aus `requirements-6.md`). Ohne Angabe des Zielverzeichnisses schreibt es in das aktuelle Verzeichnis. Die Angaben zum Instrument schreibt es zu jedem Instrument immer mit. Grund: Ohne sie startet kein Testlauf (req-test-003); der Anwender soll sie nicht gesondert anfordern müssen.

Ergebnis: je Reihe und je Instrument eine Datei im JSON-Format des Imports, Name `<Instrument>_<Daten>_<von>_<bis>.json` mit `<Daten>` gleich der Zeiteinheit (zum Beispiel `M1`, `H1`), `TICKS` oder `CONTRACT`. Broker in jeder Datei ist der Name des Handelsservers, an dem MetaTrader 5 angemeldet ist (req-system-027). Für jeden Teil, der sich nicht holen lässt, nennt das Programm Instrument, Art, Zeitraum und Grund (zum Beispiel „Symbol beim Broker unbekannt“, „Daten beim Broker nicht vorhanden“, „MetaTrader 5 nicht erreichbar“), schreibt die übrigen Dateien und endet mit einem Exitcode ungleich 0. Eine bestehende Datei gleichen Namens wird ersetzt.

`pipwerk-fetch-mt5` ordnet die Bezeichnung des Instruments einem Symbol des Brokers über eine Zuordnungstabelle in seiner Konfiguration zu. Grund: Die Zuordnung je Konto gehört zur noch nicht beschriebenen Kontoverwaltung (Fachmodell req-fach-053); bis dahin genügt eine Tabelle je Quelle. Ohne Eintrag gilt die Bezeichnung selbst als Symbol. Zuordnungstabelle und Zeitzone des Handelsservers (5.1) stehen in der Startkonfiguration von `pipwerk-fetch-mt5`; sie folgt req-system-017 und req-system-018 wie die übrigen Komponenten.

Fehlen vor dem Start eines Testlaufs Daten, startet der Testlauf nicht. Die Meldung nennt je fehlendem Teil Instrument, Art und Zeitraum und als Grund, dass pipwerk replay bis pipwerk relay nicht selbst beschafft, mit dem Weg: Daten mit `pipwerk-fetch-mt5` holen und im Datenbestand importieren (req-test-003, Hinweis H2 aus `requirements-6.md`).

## 6. Strategietester

### 6.1 Testlauf

Ein Testlauf hat: Strategie (Kopie des Dokuments zum Start), Betriebsart, Instrument der Anwendung, Testzeitraum, Broker der Kursdaten, Werte der Strategieparameter, Testkonto mit den verwendeten Werten, Angaben zu jedem Instrument des Testlaufs mit den verwendeten Werten (req-test-001, req-test-005, req-test-007).

Vorbelegung des Testzeitraums (req-test-002): Ende ist das Ende des letzten vollständigen Handelstags vor dem heutigen Datum (UTC), also des letzten Montags bis Freitags davor; Beginn 30 Tage beziehungsweise 2 Jahre davor.

Zeitpunkt des Auslösers `Manuell` (req-test-015): Hat die Strategie diesen Auslöser, gehört zum Testlauf sein Zeitpunkt. Ohne Eingabe ist es der Beginn des Testzeitraums, vor der ersten Kerze. Ein eingegebener Zeitpunkt (UTC, auf die Minute) muss im Testzeitraum liegen, sonst startet der Testlauf nicht und die Meldung nennt den Grund. Er wird mit dem Testlauf und im gespeicherten Backtest gespeichert.

Vor dem Start: Konsistenzprüfung der Strategie mit der Bibliothek; ein Fehler verhindert den Start und wird angezeigt. Strategieparameter „bei der Anwendung“ ohne Wert verhindern den Start. Danach Prüfung der Kursdaten (Abschnitte 5.2 und 5.4).

Instrumente des Testlaufs (req-test-001): das Instrument der Anwendung und jedes feste Instrument oder jeder Wert eines Strategieparameters vom Objekttyp `Instrument`, die die Strategie verwendet. Ein Instrument, das erst ein Ausdruck bei der Ausführung bildet, kann vorher nicht bestimmt werden; fehlen dafür bei der Ausführung Daten, ist der Wert „nicht verfügbar“ und eine Order darauf wird mit `no_prices` abgelehnt. Grund: Kursdaten werden vor dem Start geprüft (req-test-003); während eines Testlaufs kommen keine Daten hinzu, sonst hinge das Ergebnis vom Zeitpunkt eines Imports ab (E7).

### 6.2 Testkonto

Felder (req-test-005): Name, Anfangskapital, Kontowährung, Hebel, Spread („aus den Kerzen“ oder fester Wert in Punkten), Kommission je Lot und Seite. Das Standard-Testkonto ist mitgeliefert (10 000 EUR, Hebel 30, Spread aus den Kerzen, Kommission 0), lässt sich ändern und löschen wie jedes Testkonto (req-test-005). Fehlt es beim Start von pipwerk replay, legt pipwerk replay es neu an, wie im bestätigten Prototyp; so kann ein Testlauf immer ohne Vorarbeit starten. Angaben zum Instrument gehören nicht zum Testkonto.

### 6.3 Einzelschritt-Test

Sitzung im Backend nach E8 mit den Befehlen: Start (bis zur ersten handelnden Stelle, req-test-012), Einzelschritt, Sprung zur nächsten handelnden Stelle oder zum nächsten Haltepunkt (req-test-013), Haltepunkt setzen und entfernen, „Zum Testbeginn“, „Manuell auslösen“, Ende.

„Zum Testbeginn“ beginnt die Sitzung mit denselben Eingaben neu und hält am ersten Element der ersten Auswertung, auch wenn sie keine handelnde Stelle ist; so sind die Auswertungen zu sehen, in denen Indikatoren noch keine Werte haben (req-test-008). Haltepunkte bleiben erhalten. Mit „Manuell auslösen“ eingefügte Auswertungen entfallen, weil sie nicht zu den Eingaben gehören.

„Manuell auslösen“ (req-test-015) gibt es nur, wenn die Strategie den Auslöser `Manuell` hat. Der Befehl fügt zum aktuellen Zeitpunkt eine Auswertung `Manuell` ein. Steht die Sitzung zwischen zwei Auswertungen, folgt sie als nächste; steht sie mitten in einer Auswertung, folgt sie unmittelbar nach deren Ende, vor den übrigen Auswertungen desselben Ereignisses. Danach geht der Testlauf mit den übrigen Ereignissen weiter. Grund: Auswertungen laufen nacheinander, nie ineinander (3.4); eine Auswertung, die eine andere unterbricht, gäbe es im Handelssystem nicht. Der Einzelschritt-Test kann mit diesem Befehl andere Trades ergeben als der Backtest desselben Zeitraums (Einschränkung zu E7). Der Zustand nach jedem Befehl enthält: aktuelles Element und Auswertung, Werte aller Objekte, Elemente und Ergebnisse, Unterschiede zum vorigen Schritt (req-test-014), Konto, Orders, Positionen, Ablehnungen mit Grund, Kursdaten für die Charts bis zum aktuellen Zeitpunkt und die handelnden Stellen bis dahin (req-test-011). Haltepunkte gehören zur Sitzung, nicht zur Strategie. Eine Sitzung endet nach Ende, nach dem Testzeitraum oder nach 60 Minuten ohne Befehl. Grund für die Frist: Eine Sitzung hält Kursdaten und Zustand im Speicher des Backends; ohne Frist blieben verlassene Sitzungen bestehen (Abschnitt 11, Zahl gleichzeitiger Sitzungen).

### 6.4 Backtest

Der Backtest läuft im Backend in einem eigenen Prozess, damit Anfragen beantwortet bleiben; die Oberfläche fragt den Fortschritt ab und kann abbrechen. Ergebnis (req-test-021):

- Kontoentwicklung: Kapital und Kontostand je Kerzenschluss der kleinsten Zeiteinheit der Strategie, höchstens 5 000 Punkte, bei mehr verdichtet auf Höchst- und Tiefstwert je Abschnitt, sodass Höchststände und Rückgänge erhalten bleiben; dazu der Rückgang vom Höchststand. Grund: Mehr Punkte, als ein Bildschirm in der Breite zeigen kann, machen die Kurve nicht genauer, aber Antwort und gespeicherten Backtest groß. Kennzahlen werden aus allen Werten berechnet, nicht aus den verdichteten.
- Trades: je Position Eröffnung und Schließung (Zeitpunkt, Preis), Richtung, Volumen, Gewinn oder Verlust nach Spread, Kommission und Swap, Kosten (Kommission, Swap und Spreadanteil, zur Information), Grund der Schließung (Stop-Loss, Take-Profit, Position schließen, Ende des Testzeitraums, Konto aufgebraucht), Vermerke nach req-fach-021
- Kennzahlen: Nettogewinn, Anzahl der Trades, Trefferquote, Verhältnis Gesamtgewinn zu Gesamtverlust, größter Rückgang vom Höchststand (Betrag und Prozent), durchschnittlicher Gewinn und durchschnittlicher Verlust je Trade, Anzahl abgelehnter Orders
- Abgelehnte Orders und Änderungen einzeln mit Zeitpunkt, Element und Grund (req-test-004, Hinweis H9 aus `requirements-4.md`), höchstens 10 000; darüber hinaus nur gezählt, die Anzahl aller steht bei den Kennzahlen, und jeder Grund bleibt in der Zusammenfassung je Element und Grund sichtbar. Grund: Eine Strategie, die bei jedem Tick eine abgelehnte Order erzeugt, ergäbe sonst Millionen Einträge in Antwort und Datenbank (Abschnitt 11, Umfang von Antworten); die Zusammenfassung erfüllt req-test-004 für alle.
- Zusammenfassung der abgelehnten Orders und Änderungen je Element und Grund mit Anzahl und erstem Zeitpunkt
- Fehler der Auswertung mit Element und Ausdruck, zusammengefasst je Element und Grund mit Anzahl und erstem Zeitpunkt
- Kursdaten für den Chart werden nicht gespeichert, sondern bei Bedarf aus dem Datenbestand gelesen

Positionen, die am Ende des Testzeitraums offen sind, schließt die Abwicklung zum letzten Kurs; Grund „Ende des Testzeitraums“.

### 6.5 Gespeicherte Backtests

Gespeichert wird nur auf ausdrücklichen Befehl (req-test-022): Kopie der Strategie (Dokument), Werte der Strategieparameter, Testkonto mit den verwendeten Werten, Instrument und Angaben zu den Instrumenten mit den verwendeten Werten, Testzeitraum, Broker der Kursdaten, Ergebnis nach 6.4. Liste mit Name der Strategie, Zeitraum, Zeitpunkt des Speicherns und Nettogewinn; Löschen nach Rückfrage. Vergleich von zwei oder mehr gespeicherten Backtests mit Kennzahlen und übereinandergelegten Kontokurven. Die getestete Fassung ist in pipwerk replay in der Darstellung des Strategiedesigners zu sehen, nur lesend (Abschnitt 8.2, bestätigter Prototyp). Außerdem liefert pipwerk replay die Kopie als Dokument zum Herunterladen; so lässt sie sich im Strategiedesigner selbst öffnen (req-test-022).

## 7. Web-API

Öffentliche Web-API von pipwerk replay unter `/api/v1/` (req-system-009), beschrieben unter `contracts/api/pipwerk-replay/v1/openapi.json`: Strategien des Objektverzeichnisses lesen, Testkonten, Vorbereitung eines Testlaufs (benötigte Kursdaten, Stand), Einzelschritt-Sitzungen mit den Befehlen aus 6.3, Backtests (starten, Fortschritt, abbrechen, Ergebnis), gespeicherte Backtests, Datenbestand (Reihen gefiltert und seitenweise, Einzelheiten einer Reihe mit Lücken und Angaben zum Instrument, Import mehrerer Dateien, Broker für Testläufe). Interne Endpunkte für Einstellungen wie in pipwerk Studio. Die Endpunkte im Einzelnen legen die Aufträge fest.

## 8. Oberfläche

### 8.1 Vorlage

Vorlage ist der Prototyp, den der Auftraggeber am 2026-10-21 bestätigt hat, angepasst an seine Entscheidungen zu `Manuell` und „Parameter setzen“ ([prototype/order-02.md](prototype/order-02.md)): gebaute Datei [prototype/pipwerk-replay-prototyp.html](prototype/pipwerk-replay-prototyp.html), Beschreibung mit allen Entscheidungen zur Bedienung in [prototype/README.md](prototype/README.md), Stand Commit `de8a0d7bd7fc8a736c25b81171a54dc44b043aa2` des Zweigs `backtest/proto-replay`. Ansicht „Datenbestand“, Dialog „Datei importieren“ und Ansicht „Kursdaten beim Start“ nach der Abnahme von `wp02` ([prototype/order-03.md](prototype/order-03.md)): Stand Commit `d9c2edac0ec78555d43f587635e8bf1a37b4d762` desselben Zweigs, zur Bestätigung durch den Auftraggeber. Dort prüft der Testlauf die Kontraktdaten jedes Instruments als eigenen Teil (req-test-003). Das JSON-Format des Prototyps ist nur nachgebildet, maßgeblich ist das Schema nach 5.3. Aufbau, Bedienung, Texte in Deutsch und Englisch, Erklärungen beim Zeigen und Erscheinungsbild folgen ihm. Was dieser Abschnitt nicht anders regelt, gilt wie im Prototyp. Die Aufträge nennen die Teile des Prototyps, die sie umsetzen.

Abweichungen vom Prototyp, weil er nur vortäuscht:

- Alle Daten kommen aus dem Backend über die Web-API (Abschnitt 7). Testkonten, gespeicherte Backtests und Datenbestand liegen nicht im Browser. Der Browser speichert nichts außer dem, was pipwerk Studio auch speichert (`docs/technical/pipwerk-studio.md`, Abschnitt 2.4).
- Die Kennzeichnung „Prototyp“ in der Kopfzeile entfällt. Die Fußzeile zeigt wie in pipwerk Studio den Stand und ob das Backend erreichbar ist.
- `str-01` verwendet den `ZigZag` (Abschnitt 9). Der Testzeitraum endet am wirklichen letzten vollständigen Handelstag (Abschnitt 6.1).
- Abgelehnte Orders im Ergebnis nach Abschnitt 6.4 statt der ersten 400.

### 8.2 Technik

- React mit TypeScript und Vite, TanStack Query, i18next mit `src/locales/de.json` und `src/locales/en.json`, Sprache als Einstellung im Backend, Dialog „Über pipwerk replay“: wie pipwerk Studio (`docs/technical/pipwerk-studio.md`, Abschnitte 2.3 bis 2.7).
- Darstellung der Strategie im Einzelschritt-Test und in der getesteten Fassung (req-test-010): Zeichenfläche, Elemente, Verbindungen und Eigenschaftenansicht von pipwerk Studio, nur lesend. Sie werden dafür als gemeinsame Bausteine nach `packages/ui-components` verlegt und von beiden Oberflächen verwendet (req-system-008). Bearbeiten ist in pipwerk replay nicht möglich.
- Kerzenchart, Kontokurve und Rückgang als eigene SVG-Zeichnung wie im Prototyp. Grund: Die Darstellung ist so bestätigt, eine Bibliothek brächte eine Abhängigkeit ohne Gewinn. Das Backend liefert Kerzen nur für den sichtbaren Ausschnitt; die Höchstzahl je Anfrage legt der Auftrag fest.
- Der Einzelschritt-Test fragt nach jedem Befehl den Zustand der Sitzung ab (E8), der Backtest seinen Fortschritt in Abständen.

### 8.3 Aufbau und Ansichten

Kopfzeile mit Menü (Testlauf, Datenbestand, Testkonten, Gespeicherte Backtests), Umschaltung der Betriebsart Einzelschritt-Test oder Backtest, „Über pipwerk replay“ und Sprachwahl. Darunter die gewählte Ansicht, unten die Fußzeile mit einer Zusammenfassung des vorbereiteten Testlaufs.

| Ansicht | Inhalt | Anforderungen |
|---|---|---|
| Testlauf vorbereiten | Strategie, Instrument der Anwendung, Testzeitraum mit Vorbelegung je Betriebsart, Testkonto mit Werten für den Testlauf, Angaben zum Instrument, Strategieparameter, bei Auslöser `Manuell` dessen Zeitpunkt; Liste der benötigten Kursdaten mit Stand; Start | req-test-001 bis req-test-003, req-test-005, req-test-007, req-test-015 |
| Kursdaten beim Start | je Instrument, Zeiteinheit oder Ticks und Zeitraum: benötigt, vorhanden, fehlt; Meldung mit fehlenden Daten und Weg nach 5.4, Knopf zur Ansicht „Datenbestand“ | req-test-003 |
| Einzelschritt-Test | Strategie, Chart je Zeiteinheit der Strategie, Konto und Orders, Eigenschaften; Steuerung mit Start, Einzelschritt, Nächste handelnde Stelle, Zum Testbeginn, Manuell auslösen, Ende; Haltepunkte; Protokoll | req-test-004, req-test-008, req-test-010 bis req-test-015 |
| Backtest | Fortschritt mit Abbrechen; Ergebnis mit Kennzahlen, Kontoentwicklung und Rückgang, Chart, Reitern Trades und Abgelehnte Orders; Speichern | req-test-004, req-test-020 bis req-test-022 |
| Gespeicherte Backtests | Liste, Löschen nach Rückfrage, Vergleich von zwei oder mehr, getestete Fassung nur lesend | req-test-022 |
| Datenbestand | nach dem Abnahmebericht `wp02`, M1 bis M4: oben eine Leiste mit „Datei importieren …“ und dem Auswahlfeld „Broker für Testläufe“ (5.1); darunter eine kompakte Tabelle, eine Zeile je Reihe mit Broker, Instrument, Daten, Zeitraum und Anzahl der Lücken, filterbar und seitenweise; Klick auf eine Zeile zeigt alle Lücken und die Kontraktdaten (Angaben zum Instrument) bei diesem Broker. Liegen für ein Instrument eines Brokers nur Kontraktdaten vor, zeigt die Tabelle dafür eine Zeile mit Daten „Kontraktdaten“. Dialog „Datei importieren“ für mehrere Dateien nach 5.3. Keine Beschaffung (5.4) | req-system-025 bis req-system-027 |
| Testkonten | anlegen, bearbeiten, speichern, löschen; Standard-Testkonto nach 6.2 | req-test-005 |

### 8.4 Festlegungen

Mit der Bestätigung des Prototyps festgelegt (Frage backtest-01, Punkte 1 bis 7):

1. Anordnung nach Fenstergröße: ab 1500 Pixel Breite Strategie, Chart, Konto und Orders sowie Eigenschaften gleichzeitig. Von 1100 bis 1499 Pixel teilen sich Konto und Orders und die Eigenschaften einen Bereich mit Reitern. Unter 1100 Pixel ein Bereich nach dem anderen mit einer Leiste unten; bei hohen Tablets bleibt der Chart oben. Das Ergebnis des Backtests folgt derselben Staffelung. Geprüft wird in den Fenstergrößen 390 × 844, 844 × 390, 820 × 1180, 1180 × 820, 1366 × 768 und 1920 × 1080 (req-system-024).
2. Jede Auswertung nach Abschnitt 3.4 (jede Verwaltung und der Hauptablauf, die ein Ereignis startet) ist im Einzelschritt-Test eine eigene Auswertung. Fallen Verwaltung und Hauptablauf auf denselben Zeitpunkt, zeigt eine Leiste die Reihenfolge, zuerst die Verwaltung.
3. „Einzelschritt“ am Ende einer Auswertung geht zum ersten Element der nächsten. „Nächste handelnde Stelle“ hält auch an einem Haltepunkt. Ein Haltepunkt wird mit einem kleinen Kreis an der Ecke eines Elements gesetzt und entfernt. „Zum Testbeginn“ zeigt die ersten Auswertungen, in denen Indikatoren noch keine Werte haben.
4. Abgelehnte Order: Die Auswertung trägt vorab die Marke „endet mit abgelehnter Order“. Der Grund steht am Element, in der Eigenschaftenansicht, im Protokoll und als rotes Kreuz im Chart. Im Ergebnis stehen abgelehnte Orders mit Grund auf einem eigenen Reiter neben den Trades, ihre Anzahl bei den Kennzahlen. Gründe in Händlersprache nach Abschnitt 4.3.
5. Testkonto: Änderungen im Testlauf gelten nur für diesen Testlauf. Gespeichert wird nur über „Änderung im Testkonto speichern“ oder „Als neues Testkonto speichern“. Geänderte Angaben zum Instrument gelten nur für den Testlauf und werden nie gespeichert.
6. Kursdaten beim Start nach der Ansicht „Kursdaten beim Start“: Fehlt etwas, startet der Testlauf nicht; bis pipwerk relay wird nichts beschafft (5.4, req-test-003, geändert am 2026-10-23).
7. Ergebnis: Der Gewinn eines Trades ist nach Spread und Kommission. Die Spalte „Kosten“ nennt Kommission und Spreadanteil zur Information. Der Prototyp rechnet keinen Swap; im Produkt enthalten Gewinn und Kosten auch den Swap (6.4). Ein Klick auf einen Trade zeigt seine Stelle im Chart: Pfeil bei Eröffnung, Kreis bei Schließung, Linie dazwischen grün bei Gewinn, rot bei Verlust.

Aus den Entscheidungen zu `Manuell` (req-test-015, Abschnitte 6.1 und 6.3):

8. Die Vorbereitung zeigt die Einstellung „Auslöser Manuell“ nur bei einer Strategie mit diesem Auslöser: Standard ist der Beginn des Testzeitraums, wahlweise ein eingegebener Zeitpunkt. Ein Zeitpunkt außerhalb des Testzeitraums verhindert den Start mit Meldung.
9. Im Einzelschritt-Test erscheint `Manuell` als eigene Auswertung und im Chart mit eigenem Zeichen. Der Befehl „Manuell auslösen“ ist nur bei einer Strategie mit diesem Auslöser zu sehen. Er ist jederzeit bedienbar; mitten in einer Auswertung zeigt eine Meldung, dass die Auswertung `Manuell` nach deren Ende folgt (6.3). Abweichung vom Prototyp, der den Befehl erst am Ende einer Auswertung freigibt: Eine Sperre ist nicht nötig, weil die Auswertung ohnehin erst danach beginnt.

Bedienerführung wie im Prototyp: Jeder leere Zustand nennt den nächsten Schritt, jedes Feld hat eine Erklärung in Händlersprache beim Zeigen mit Maus oder Tastatur. Kerzen steigend grün, fallend rot, mit schwarzem Rahmen und Docht (req-test-010).

## 9. Abbildung der Testfälle

`str-01`: Auslöser `Kerzenschluss` der Handelszeiteinheit und in der Verwaltung `Tick` und `Kerzenschluss`. Benötigt: Kerzen der Signal- und der Handelszeiteinheit und Ticks des Instruments der Anwendung (wegen `Tick`, Abschnitt 4.1, damit auch für die Abwicklung). Zwei Instanzen `ZigZag` mit `letztes_hoch`, `vorletztes_hoch`, `letztes_tief`, `vorletztes_tief` (3.3). Zu Beginn ohne Wendepunkte gilt „kein Trend“ (req-test-008, 3.2). Eine Stop-Order mit überschrittenem Einstieg wird mit `price_wrong_side` abgelehnt, „Order aufgeben“ nimmt `nicht gestellt` (4.3). Das Testfalldokument `contracts/strategies/v2/testcases/str-01.strategy.json` muss der Fassung des Testfalls vom 2026-10-21 entsprechen (ZigZag statt Markttechnik); ist es das beim Beginn der Umsetzung nicht, wird es in diesem Vorhaben angepasst.

`str-03`: Auslöser `Kerzenschluss` H1 im Hauptablauf und in der Verwaltung. Benötigt: Kerzen H1 und M1 (4.1). Beim selben Kerzenschluss schließt die Verwaltung die alte Position, danach eröffnet der Hauptablauf die neue (3.4). Die Marktorder wird nach der Ausführung mit der Risikoregel geprüft (3.5).

## 10. Tests und Nachweis

- Bibliothek (pytest): Auswertung jeder Funktion und jedes Operators, „leer“, „nicht verfügbar“ und Fehler mit ihrer Wirkung je Stelle; `PREVIOUS`; `EMA`, `ATR`, `ZigZag` gegen Werte aus MetaTrader 5 für eine mitgelieferte Kursreihe; Reihenfolge der Auswertungen; Bestimmen und Prüfen mit Regeln; Rückführung mit Abbruch.
- Abwicklung (pytest): jeder Ordertyp, Stop-Loss und Take-Profit mit und ohne Sprung, Weg innerhalb einer Kerze M1, jeder Ablehnungsgrund, Kosten, Margin, Konto aufgebraucht, Teilschließung nach req-fach-021.
- Datenbestand (pytest): Import JSON und CSV mit gültigen und fehlerhaften Dateien, Ersetzen, Lücken und Handelspausen, Migration.
- Datenbestand (pytest): Import mehrerer Dateien in einem Vorgang mit gemeinsamem Broker und gemeinsamer Zeitzone, eine abgelehnte Datei neben übernommenen.
- Beschaffung: `pipwerk-fetch-mt5` mit einer nachgebildeten Schnittstelle von `MetaTrader5`, darunter Dateinamen, Broker als Name des Handelsservers, Teile mit Grund und Exitcode; die geschriebenen Dateien lassen sich ohne Änderung importieren. Gegen eine echte Installation von MetaTrader 5 prüft der Auftraggeber in der Abnahme.
- Testfälle: `str-01` und `str-03` laufen im Backtest über mitgelieferte Kursdaten mit erwarteten Trades; Einzelschritt-Test ohne „Manuell auslösen“ und Backtest liefern für denselben Zeitraum dieselben Trades (E7). Eine Strategie mit Auslöser `Manuell` wird zum Beginn des Testzeitraums, zu einem eingegebenen Zeitpunkt und mit „Manuell auslösen“ geprüft; `Manuell` in einer Verwaltung ergibt den Befund `trigger.manual_in_management` (3.6).
- Backend, Oberfläche, Browsertests wie in pipwerk Studio; Einzelheiten nach Abschnitt 8.

## 11. Sicherheit

- Ohne Anmeldung, nur im vom Betreiber kontrollierten Netz (req-system-011), wie pipwerk Studio. `pipwerk-fetch-mt5` hat keinen Server und öffnet keinen Port (req-system-027); es liest nur aus MetaTrader 5 und schreibt nur in das angegebene Zielverzeichnis.
- Hochgeladene Dateien (Import, Strategie): Größe je Datei, Zahl der Dateien und Gesamtgröße eines Vorgangs begrenzt (5.3), streng geprüft, nie ausgeführt; Pydantic mit Ablehnung zusätzlicher Felder. Dateinamen werden nur gelesen, nie als Pfad verwendet.
- Ausdrücke nur über den Syntaxbaum ausgewertet; Grenzen für Schritte je Auswertung (3.4), Zahl gleichzeitiger Sitzungen und Backtests, Umfang von Antworten.
- Texte und Namen des Anwenders setzt die Oberfläche als Text, nie als HTML.

## 12. Dokumentation

- technische Dokumentation: `docs/technical/pipwerk-replay.md` (neu), `docs/technical/pipwerk-marketdata.md` (neu), `docs/technical/pipwerk-fetch-mt5.md` (neu), `docs/technical/pipwerk-domain.md` (Ausführung, Indikatoren, `ZigZag`, Auslöser `Manuell`, Entfall von `flow.set_parameter`), `docs/technical/pipwerk-studio.md` (gemeinsame Bausteine), Beschreibungen unter `contracts/`
- Anwenderdokumentation von pipwerk Studio: Auslöser „Manuell“, kein Element „Parameter setzen“
- Anwenderdokumentation `docs/user/pipwerk-replay.md`: Testlauf vorbereiten, Testkonten, Kursdaten und Datenbestand mit Import mehrerer Dateien, Einzelschritt-Test, Backtest, Ergebnis, Speichern und Vergleich, Ablehnungsgründe in Händlersprache; Einrichtung und Aufruf von `pipwerk-fetch-mt5` auf dem Rechner von MetaTrader 5 und Import seiner Dateien
- Glossar: Testlauf, Testkonto, interne Abwicklung, Ablehnung, handelnde Stelle, Haltepunkt, Datenbestand historischer Kursdaten, Beschaffung, Quelle

## 13. Entscheidungen zu Hinweisen der QA und Vorschläge

Hinweise aus `requirements-4.md` und `requirements-5.md`:

| Hinweis | Entscheidung |
|---|---|
| H7 | Ablehnungsregeln in 4.3; „Einstieg“ in `str-01` ist der Preis der Stop-Order. |
| H8 | Ablehnung bei „Order ändern“, „Position ändern“, „Order löschen“, „Position schließen“ in 3.5. |
| H9 | abgelehnte Orders und Gründe im Ergebnis und im gespeicherten Backtest (6.4, 6.5). |
| H10 | „leer“ in Berechnungen und Eigenschaften einer Order nach 3.2 und der Tabelle in `pipwerk-domain.md`, Abschnitt 8. |
| H11 | betrifft den Dokumentstatus der Anforderungen; erledigt vom Projektleiter (Commit `a9990e8`). |
| H12 | `pipwerk-domain.md`, Abschnitt 8, „Leer“: Ausnahme nach req-test-008 und Verhalten von `ISBLANK` ergänzt (3.2). |

Hinweise aus `requirements-6.md` (Nachprüfung nach der Abnahme von `wp02`): H4 Zielverzeichnis von `pipwerk-fetch-mt5` als Angabe beim Aufruf (5.4); H2 Inhalt der Meldung bei fehlenden Daten (5.4). H1, H3 und H5 betreffen die Dokumente des Auftraggebers und gehen an den Projektleiter.

Entscheidungen des Auftraggebers zu Frage [backtest-01](questions/backtest-01.md) vom 2026-10-21:

1. Auslöser `Manuell` (bisher „Start von Hand“): nur im Hauptablauf, im Testlauf nach req-test-015. Umgesetzt in 3.4, 3.6, 6.1, 6.3 und 8.
2. Das Element „Parameter setzen“ entfällt (req-fach-047). Umgesetzt in 3.4 und 3.6.
3. Der Prototyp ist bestätigt, mit den Punkten 1 bis 7 der Frage. Umgesetzt in 8.

## Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-21 | Erstfassung ohne Oberfläche, vor der Bestätigung des Prototyps. |
| 2026-10-21 | Nach den Antworten zu Frage backtest-01: Abschnitt 8 (Oberfläche) nach dem bestätigten Prototyp; Auslöser `Manuell` (3.4, 3.6, 6.1, 6.3, 10); Entfall von „Parameter setzen“ (3.4, 3.6); abgelehnte Orders einzeln im Ergebnis (6.4); Abschnitt 13 mit den Entscheidungen. |
| 2026-10-21 | Nach dem Prüfbericht [specification-1.md](reviews/specification-1.md): B1 Zählung auf jedem Instrument (3.4); B2 sofortige Ausführung von Marktorder und Schließen mit neuem Stand für folgende Auswertungen (4.2); B3 Befehl „Zum Testbeginn“ (E8, 6.3); B4 Standard-Testkonto löschbar, wird beim Start neu angelegt (6.2, 8.3). Hinweise 1 bis 13: Begründungen der Begrenzungen (6.3, 6.4), „Manuell auslösen“ jederzeit (6.3, 8.4), Begründung „Konto aufgebraucht“ (4.2), Zeitzone bei Import und Beschaffung (5.1), Auswertungen im Einzelschritt-Test (8.4), Kosten und Swap (6.4, 8.4), prüfende Regeln bei Ändern (3.5), Ablehnungsgrund `no_prices` (4.3, 6.1), Handelstag (6.1), getestete Fassung auch als Dokument (6.5), Schlüssel und Startkonfiguration (5.4), Kontraktgröße (5.1), Wendepunkte des `ZigZag` (3.3). |
| 2026-10-21 | Hinweise aus [specification-2.md](reviews/specification-2.md) (bestanden) ohne weitere Prüfung eingearbeitet: 1 Stelle der eingefügten Auswertung `Manuell` (6.3); 2 Feld Zeitzone beim CSV-Import und Wechsel der Sommerzeit (5.1, 8.3); 4 Kurse beim Schließen nach Richtung der Position (4.2). Hinweis 3 geht mit der Präsentation an den Auftraggeber, Hinweis 5 verworfen (Vorbelegung ist änderbar). |
| 2026-10-23 | Nach der Abnahme von `wp02` (Abnahmebericht `wp02/acceptance/1.md`, Mängel M1 bis M4) und den geänderten Anforderungen req-system-026, req-system-027 und req-test-003 (Prüfung bestanden in [requirements-6.md](reviews/requirements-6.md)): `pipwerk-fetch-mt5` als Programm ohne Server und Port (E5, 5.4, 11); keine Beschaffung aus pipwerk replay bis pipwerk relay (5.4, 6.1, 7, 8.3, 8.4 Punkt 6); Broker als Name des Handelsservers und „Broker für Testläufe“ (5.1); Import mehrerer Dateien (5.3, 10, 11); Ansicht „Datenbestand“ und Dialog „Datei importieren“ nach M1 bis M3 (8.3), Prototyp nach [prototype/order-03.md](prototype/order-03.md) (8.1); Hinweise H2 und H4 aus `requirements-6.md` (5.4). |