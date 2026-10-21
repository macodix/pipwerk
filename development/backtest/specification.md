# Spezifikation Vorhaben backtest

## Status

- status: `draft`
- stand: 2026-10-21
- komponenten: `packages/domain-core` (gemeinsame Python-Bibliothek, neues Teilpaket für die Ausführung), `packages/market-data` (neu, Datenbestand historischer Kursdaten), `components/pipwerk-replay` (neu, Strategietester, Backend und Oberfläche), `components/pipwerk-fetch-mt5` (neu, Beschaffung aus MetaTrader 5), `contracts/`
- grundlage: [scope.md](scope.md) mit den dort genannten Dokumenten des Auftraggebers. Nachprüfung der Dokumente nach der Abstimmung bestanden in [requirements-5.md](reviews/requirements-5.md).
- stand der arbeit: Abschnitte 1 bis 7 und 9 bis 13 sind Entwurf und noch nicht von der QA geprüft. Abschnitt 8 (Oberfläche) entsteht erst nach der Bestätigung des Prototyps durch den Auftraggeber (Entwicklungsverfahren, Phase 2, Schritt 2). Auftrag des Prototyps: [prototype/order-01.md](prototype/order-01.md).

## 1. Gegenstand

Der Strategietester, Produktname pipwerk replay, führt Strategien gegen historische Kursdaten aus, in den Betriebsarten Einzelschritt-Test und Backtest (Anforderungen an den Strategietester). Dazu gehören der Datenbestand historischer Kursdaten mit Import und Beschaffung (req-system-025 bis req-system-027) und die Testkonten (req-test-005).

Nachweis sind die Testfälle `str-01` und `str-03`: Jeder lässt sich im Einzelschritt-Test prüfen und im Backtest über den vorbelegten Testzeitraum testen, ohne die Strategie zu bearbeiten.

Nicht Gegenstand: das Handelssystem, die Kontoverwaltung, die Anzeige der Unterschiede zwischen Fassungen einer Strategie (offener Punkt 1 der Anforderungen; der Aufbau schließt sie nicht aus, weil ein gespeicherter Backtest eine vollständige Kopie der Strategie enthält, Abschnitt 6.5) und der zurückgestellte Indikator `Markttechnik`.

## 2. Architekturentscheidungen

- E1 Ausführung in der gemeinsamen Bibliothek. Auswertung von Ausdrücken, Berechnung der mitgelieferten Indikatoren, Ablauf der Strategie mit Auslösern und Verwaltungen, Bestimmung und Prüfung von Orders mit Regeln liegen im neuen Teilpaket `pipwerk_domain.execution` der Bibliothek `packages/domain-core`. Grund: Strategietester und Handelssystem müssen dieselbe Prüf- und Auswertungslogik verwenden (req-system-007, req-test-006). Die Ausführung kennt keinen Broker und keine Kursquelle; beides erhält sie über zwei Schnittstellen (Abschnitt 3.1).
- E2 Interne Abwicklung im Strategietester. Die Abwicklung von Orders gegen historische Kurse (req-test-004) ist die Umsetzung der Broker-Schnittstelle aus E1 in pipwerk replay (`pipwerk_replay.broker`). Das Handelssystem setzt dieselbe Schnittstelle später gegen einen echten Broker um.
- E3 Eigenständige Komponente `components/pipwerk-replay` mit Python-Paket `pipwerk_replay`, Startkonfiguration `pipwerk-replay.ini`, eigener Datenbank und eigener Oberfläche (req-system-001, req-system-002, req-system-008, req-system-016 bis req-system-018). Das Verzeichnis `components/pipwerk-backtest` mit seiner Platzhalter-README wird dazu umbenannt; Verweise ziehen mit. Aufbau, Startkonfiguration, Alembic und Prüfung des Kopfs `Host` folgen pipwerk Studio (`docs/technical/pipwerk-studio.md`, Abschnitte 2.1, 2.2, 2.10).
- E4 Datenbestand historischer Kursdaten als eigene Bibliothek `packages/market-data` (Paket `pipwerk_marketdata`): Speichermodell über SQLAlchemy mit Alembic, Import, Prüfung auf Vollständigkeit und Lesen. Grund: Der Datenbestand gehört pipwerk und nicht dem Strategietester (req-system-025); das Handelssystem soll ihn später ebenfalls nutzen können. pipwerk replay bindet sie wie die Bibliothek als Pfadabhängigkeit mit festgeschriebener Version ein. Die Datenbank des Datenbestands ist eine eigene Angabe der Startkonfiguration und kann dieselbe wie die von pipwerk replay sein (req-system-013, req-system-014).
- E5 Beschaffung aus MetaTrader 5 als eigenständiges kleines Programm `components/pipwerk-fetch-mt5` auf dem Rechner von MetaTrader 5 (req-system-027). Es bietet eine HTTP-Schnittstelle, liest mit dem Python-Paket `MetaTrader5` Kerzen, Ticks und Angaben zum Instrument und liefert sie als Dateien im Format des Imports. pipwerk replay stößt es an und importiert das Ergebnis. Weitere Quellen sind weitere Programme mit derselben Schnittstelle (Abschnitt 5.4).
- E6 Testkonten, Ergebnisse und gespeicherte Backtests liegen in der Datenbank von pipwerk replay über SQLAlchemy (req-system-015, „übrige Daten“). Strategien liest pipwerk replay als Dokument im Format 2.0 aus dem Objektverzeichnis (Einstellung wie in pipwerk Studio) oder als hochgeladene Datei; es ändert sie nie.
- E7 Gleiche Eingaben, gleiche Ergebnisse. Ein Testlauf ist vollständig durch Strategie, Werte der Strategieparameter, Testkonto, Angaben zum Instrument, Testzeitraum und Kursdaten bestimmt. Die Ausführung verwendet keine Uhrzeit des Rechners und keine Zufallszahlen. Einzelschritt-Test und Backtest verwenden denselben Ablauf und dieselbe Abwicklung (req-test-004); der Einzelschritt-Test hält nur an.
- E8 Der Einzelschritt-Test läuft im Backend als Sitzung, die die Ausführung an jedem Element anhält. Die Oberfläche fragt nach jedem Schritt den Zustand ab. Ein Zurückgehen gibt es nicht (req-test-012 verlangt es nicht).

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
- `ZigZag`: Verfahren des ZigZag von MetaTrader 5 mit `Depth`, `Deviation` (in Punkten des Instruments) und `Backstep`. Der jüngste Wendepunkt kann sich mit neuen Kerzen noch verschieben; alle älteren sind endgültig.

Eigenschaften des `ZigZag` für die Ausführung: Neben den Wendepunkten nach Spezifikation `strategiedesign`, Abschnitt 3.2, hat der `ZigZag` die Eigenschaften `letztes Hoch`, `vorletztes Hoch`, `letztes Tief`, `vorletztes Tief` (Kennungen `letztes_hoch`, `vorletztes_hoch`, `letztes_tief`, `vorletztes_tief`, Zahl): der Kurs des jüngsten beziehungsweise zweitjüngsten endgültigen Hochs und Tiefs. Grund: Fachmodell req-fach-054 verlangt sie für `str-01`; mit den drei jüngsten Wendepunkten sind zwei endgültige Hochs und Tiefs nicht immer erreichbar. Gibt es den Wendepunkt noch nicht, ist die Eigenschaft „leer“. Die Typbeschreibung des `ZigZag` wird darum ergänzt.

Ein Indikator wird nur aus Kerzen berechnet, die im Testzeitraum liegen. Kursdaten vor dem Testzeitraum werden nicht geladen (req-test-008 lässt den Testlauf ohne Werte beginnen).

Eigene Indikatoren und Trends (Vorlagen vom Objekttyp `Indikator` und `Trend`) wertet die Ausführung über ihre Ausdrücke aus: Ihre eigenen Eigenschaften werden bei jedem Kerzenschluss ihrer Zeiteinheit neu berechnet.

### 3.4 Ablauf, Auslöser und Verwaltungen

Zeitachse: Die Ausführung erhält von der Anwendung eine geordnete Folge von Ereignissen: Ticks (nur wenn ein Auslöser `Tick` vorkommt) und Kerzenschlüsse aller Zeiteinheiten und Instrumente, die Auslöser verwenden. Ein Kerzenschluss tritt zum Ende der Kerze ein (Eröffnungszeitpunkt plus Dauer der Zeiteinheit). Zum selben Zeitpunkt gilt die Reihenfolge: Ticks vor Kerzenschlüssen, Kerzenschlüsse nach aufsteigender Zeiteinheit, dann nach der Bezeichnung des Instruments. Vor jedem Ereignis hat die Abwicklung alle Kursbewegungen bis zu diesem Zeitpunkt verarbeitet (Abschnitt 4.2).

Ein Ereignis startet jede Auswertung, deren Auslöser dazu passt: zuerst die Verwaltungen der bestehenden Orders und Positionen in der Reihenfolge, in der die Orders gestellt wurden, danach der Hauptablauf (req-fach-049a). Eine Verwaltung ohne eigene Auslöser wird beim Stellen der Order in derselben Auswertung durchlaufen und bei späteren Auslösern nicht erneut (req-fach-049; das bestätigt die Annahme aus Spezifikation `strategiedesign`, Abschnitt 3.3). Eine Verwaltung endet, wenn ihre Order gelöscht, abgelaufen oder abgelehnt ist oder ihre Position geschlossen ist.

Eine Auswertung folgt den Verbindungen ab dem Auslöser. Rückführungen sind zulässig (req-fach-047); gegen Endlosschleifen bricht eine Auswertung nach 10 000 Elementen ab, vermerkt einen Fehler und der Testlauf läuft weiter.

`Strategie.wartende Orders` und `Strategie.offene Positionen` zählen die Orders mit Status `wartend` und die offenen Positionen dieses Testlaufs auf dem Instrument des Zusammenhangs (req-fach-046).

`Parameter setzen` und `Start von Hand`: Ihr Verhalten im Testlauf ist offen (Fachmodell req-fach-047 und req-fach-053, Anforderungen offener Punkt 2). Vorschläge in Abschnitt 13; sie gehen als Frage an den Auftraggeber.

### 3.5 Orders und Regeln

„Order aufgeben“ bildet die Order nach req-fach-021: direkt übergebene Werte, dann bestimmende Regeln der Strategie, dann der Elemente in der Reihenfolge des Ablaufs (req-fach-046), Vollständigkeit, prüfende Regeln. Ist das erfolgreich, übergibt sie die Order dem Broker. Lehnt der Broker ab, nimmt „Order aufgeben“ den Ausgang `nicht gestellt`, die Order hat den Status `abgelehnt` und der Grund ist vermerkt (req-test-004). Sonst Ausgang `gestellt`.

Ablehnung durch den Broker bei den übrigen Elementen (Hinweis H8 aus `requirements-4.md`): „Order ändern“ und „Position ändern“ nehmen den Ausgang `nicht geändert`, Order beziehungsweise Position bleiben unverändert. „Order löschen“ und „Position schließen“ gehen weiter; Order beziehungsweise Position bleiben bestehen. In jedem Fall ist der Grund vermerkt und sichtbar wie bei „Order aufgeben“.

Prüfung nach der Ausführung einer Marktorder (req-fach-021): Die Ausführung wendet die prüfenden Regeln auf die entstandene Position mit ihrem Einstiegspreis an. Ist eine nicht erfüllt, schließt sie die Position in Schritten des Volumenschritts teilweise, bis die Regel erfüllt ist und das Restvolumen mindestens das Mindestvolumen ist, sonst ganz. Der Vorgang wird beim Trade vermerkt.

## 4. Interne Abwicklung

### 4.1 Kurse und Spread

Kerzen enthalten Geldkurse (Bid), wie MetaTrader 5 sie liefert. Briefkurs (Ask) = Geldkurs + Spread. Spread nach Testkonto: „aus den Kerzen“ verwendet den Spread der Kerze beziehungsweise bei Ticks Geld und Brief des Ticks; „fest“ verwendet den festen Wert für jeden Kurs. Liefert der Broker für eine Kerze keinen Spread, gilt der Spread der Angaben zum Instrument.

Die Abwicklung verfolgt den Kurs feiner als die Zeiteinheiten der Strategie:

- Gehören Ticks zu den benötigten Kursdaten (req-test-003), mit den Ticks.
- Sonst mit den Kerzen der Zeiteinheit M1 jedes Instruments, auf dem die Strategie Orders aufgeben kann. Innerhalb einer Kerze M1 nimmt sie den Weg Eröffnung, Tief, Hoch, Schluss bei einer steigenden Kerze und Eröffnung, Hoch, Tief, Schluss bei einer fallenden, wie das Verfahren „1 Minute OHLC“ von MetaTrader 5. M1 gehört dann zu den benötigten Kursdaten des Testlaufs. Grund: Ohne einen Kursverlauf innerhalb einer großen Kerze lässt sich nicht entscheiden, ob Stop-Loss oder Take-Profit zuerst erreicht wurde.

### 4.2 Ausführung

- Kontoform: Jede ausgeführte Order ergibt eine eigene Position (wie ein Konto mit gegenläufigen Positionen bei MetaTrader 5). Grund: Jede Order hat ihre eigene Verwaltung (req-fach-049a).
- Marktorder: Ausführung zum nächsten Kurs nach dem Ereignis, das die Auswertung gestartet hat (Brief bei `buy`, Geld bei `sell`). Angenommener Preis für die Regeln ist der letzte Kurs zum Zeitpunkt des Ereignisses (req-fach-019).
- Stop-Order und Limit-Order: Ausführung, sobald der Kurs den Preis erreicht (Kauf am Brief, Verkauf am Geld), zum Preis der Order; springt der Kurs über den Preis hinweg, zum ersten Kurs danach. Stop-Limit-Order: Beim Erreichen des Auslösepreises entsteht eine Limit-Order zum Limitpreis.
- Stop-Loss und Take-Profit einer Position: geprüft am Geld bei `buy`, am Brief bei `sell`; geschlossen zum Preis von Stop-Loss beziehungsweise Take-Profit, bei einem Sprung zum ersten Kurs danach.
- Gültigkeit: „bis Tagesende“ endet mit dem Tageswechsel der Kursdaten, „bis Zeitpunkt“ und „bis Ende eines Tages“ zur angegebenen Zeit; Status `abgelaufen`.
- Teilausführungen gibt es im Testlauf nicht: Historische Kursdaten enthalten keine Markttiefe. Der Status `teilausgeführt` kommt nicht vor.
- Kosten: Kommission des Testkontos je Lot und Seite in Kontowährung, bei Eröffnung und Schließung. Swap nach den Angaben zum Instrument je Lot und Tag beim Tageswechsel, dreifach an dem Wochentag, den die Angaben nennen.
- Gewinn oder Verlust: Kursdifferenz / Tickgröße × Tickwert × Volumen. Der Tickwert der Angaben zum Instrument gilt als Wert in der Kontowährung und für den ganzen Testlauf. Weicht die Währung der Angabe von der Kontowährung des Testkontos ab, zeigt die Vorbereitung einen Hinweis; der Anwender kann den Tickwert für den Testlauf ändern (req-test-005).
- Kapital = Kontostand + offener Gewinn oder Verlust aller Positionen. Freie Margin = Kapital − Margin aller offenen Positionen. Margin einer Position = Volumen × Margin-Anforderung je Lot, wenn die Angaben sie nennen, sonst Volumen × Preis × Tickwert / Tickgröße / Hebel des Testkontos.
- Fällt das Kapital auf null oder darunter, schließt die Abwicklung alle Positionen, löscht alle Orders und beendet den Testlauf mit dem Vermerk „Konto aufgebraucht“.

### 4.3 Ablehnungsgründe

Die Abwicklung lehnt ab wie ein Broker (req-test-004, Hinweis H7 aus `requirements-4.md`). Maßgeblich ist der Kurs zum Zeitpunkt der Auswertung:

| Grund (Kennung) | Fall |
|---|---|
| `price_wrong_side` | Stop-Order: Kauf mit Preis nicht über dem Brief, Verkauf mit Preis nicht unter dem Geld; Limit-Order umgekehrt; Stop-Limit-Order: Auslösepreis wie Stop-Order, Limitpreis nicht auf der Seite einer Limit-Order zum Auslösepreis |
| `stops_invalid` | Stop-Loss oder Take-Profit auf der falschen Seite des Preises der Order beziehungsweise bei einer Position des aktuellen Kurses (Kauf: Stop-Loss unter, Take-Profit über dem Preis) |
| `volume_invalid` | Volumen unter dem Mindestvolumen oder kein Vielfaches des Volumenschritts |
| `no_money` | freie Margin reicht für die Margin der Order nicht |
| `market_closed` | für das Instrument liegt zu diesem Zeitpunkt kein Kurs vor (Handelspause) |
| `not_pending` | Order ändern oder löschen bei einer Order, die nicht mehr wartet; Position ändern oder schließen ohne offene Position |
| `close_volume_invalid` | Volumen von „Position schließen“ größer als die Position oder Rest unter dem Mindestvolumen |

Beim Testfall `str-01` liegt der Einstieg einer Stop-Order zum Kauf über dem Einstiegsbezug (Einstiegsbezug + Spread + Entry-Puffer). Abgelehnt wird sie nur, wenn der Brief diesen Preis bereits erreicht hat (`price_wrong_side`).

## 5. Datenbestand historischer Kursdaten

### 5.1 Inhalt

`pipwerk_marketdata` speichert je Broker (Bezeichnung der Quelle, zum Beispiel Server von MetaTrader 5) und Instrument (Bezeichnung nach Fachmodell req-fach-053):

- Kerzen je Zeiteinheit: Eröffnungszeitpunkt (UTC), Eröffnung, Hoch, Tief, Schluss, Volumen, Spread (Punkte, wenn geliefert)
- Ticks: Zeitpunkt (UTC, Millisekunden), Geld, Brief
- Angaben zum Instrument nach req-system-025 mit Zeitpunkt der Beschaffung, Währung des Tickwerts, Swap long und short, Wochentag des dreifachen Swaps, Margin-Anforderung je Lot
- für jede Reihe die abgedeckten Zeiträume und die Handelszeiten, die die Quelle liefert

pipwerk berechnet keine Kerzen aus Ticks und keine Ticks aus Kerzen (req-system-025, req-test-003).

Welcher Broker im Testlauf gilt, ist eine Einstellung von pipwerk replay (Standardquelle), änderbar in der Vorbereitung eines Testlaufs.

### 5.2 Vollständigkeit

Benötigt sind für einen Testlauf (req-test-003): für jedes Instrument des Testlaufs die Kerzen jeder Zeiteinheit, die die Strategie verwendet, die Kerzen M1 beziehungsweise die Ticks nach Abschnitt 4.1, die Ticks bei einem Auslöser `Tick`, und die Angaben zum Instrument. Die Zeiteinheiten ergeben sich aus der Strategie mit den Werten der Strategieparameter dieses Testlaufs.

Eine Lücke ist ein Zeitraum ohne Kerze innerhalb der Handelszeiten der Quelle. Fehlen Handelszeiten, gilt eine Kerze als fehlend, wenn zwischen zwei Kerzen mehr als die doppelte Dauer der Zeiteinheit liegt und der Zeitraum nicht ganz in ein Wochenende (Freitag 22:00 bis Sonntag 22:00 UTC) fällt. Einzelne fehlende Kerzen M1 innerhalb einer Stunde mit Kerzen gelten nicht als Lücke, weil Broker in ruhigen Minuten keine Kerze liefern. Die genauen Schwellen legt der Auftrag fest und dokumentiert sie in der technischen Dokumentation.

### 5.3 Import

Dateiformate (req-system-026): JSON nach dem Schema `contracts/market-data/v1/` und CSV im Exportformat von MetaTrader 5 für Kerzen und Ticks. Eine Datei enthält genau eine Reihe (Broker, Instrument, Zeiteinheit oder Ticks) beziehungsweise die Angaben zu einem Instrument. Der Import prüft Format, Zeitordnung, Kurse größer als null, Hoch ≥ Eröffnung, Schluss ≥ Tief, und übernimmt die Daten in einer Transaktion. Vorhandene Kerzen oder Ticks desselben Zeitpunkts werden ersetzt. Bei einer CSV-Datei gibt der Anwender Broker, Instrument und Zeiteinheit an, weil die Datei sie nicht enthält. Das Ergebnis nennt übernommene Zeilen, Zeitraum und abgelehnte Zeilen mit Grund.

Begrenzungen gegen Überlast: Größe einer hochgeladenen Datei, Zahl der Zeilen; Werte legen die Aufträge fest.

### 5.4 Beschaffung

Schnittstelle einer Quelle (beschrieben unter `contracts/api/pipwerk-fetch/v1/`): Auftrag mit Instrument, Art (Zeiteinheit, Ticks oder Angaben) und Zeitraum; Antwort sind Dateien im JSON-Format des Imports oder ein Fehler mit Grund (zum Beispiel „Symbol beim Broker unbekannt“, „Daten beim Broker nicht vorhanden“, „MetaTrader 5 nicht erreichbar“).

`pipwerk-fetch-mt5` ordnet die Bezeichnung des Instruments einem Symbol des Brokers über eine Zuordnungstabelle in seiner Konfiguration zu. Grund: Die Zuordnung je Konto gehört zur noch nicht beschriebenen Kontoverwaltung (Fachmodell req-fach-053); bis dahin genügt eine Tabelle je Quelle. Ohne Eintrag gilt die Bezeichnung selbst als Symbol.

pipwerk replay stößt die Beschaffung vor dem Start eines Testlaufs für alle fehlenden Teile an (req-test-003), auch für Teile eines Zeitraums, und von Hand aus dem Datenbestand. Die Adresse der Quelle und ein gemeinsamer Schlüssel stehen in der Betriebskonfiguration von pipwerk replay beziehungsweise in der Startkonfiguration von `pipwerk-fetch-mt5`. Fehlen danach Daten, startet der Testlauf nicht; die Meldung nennt je fehlendem Teil Instrument, Art, Zeitraum und den Grund der Quelle.

## 6. Strategietester

### 6.1 Testlauf

Ein Testlauf hat: Strategie (Kopie des Dokuments zum Start), Betriebsart, Instrument der Anwendung, Testzeitraum, Broker der Kursdaten, Werte der Strategieparameter, Testkonto mit den verwendeten Werten, Angaben zu jedem Instrument des Testlaufs mit den verwendeten Werten (req-test-001, req-test-005, req-test-007).

Vorbelegung des Testzeitraums (req-test-002): Ende ist das Ende des letzten vollständigen Handelstags vor dem heutigen Datum (UTC); Beginn 30 Tage beziehungsweise 2 Jahre davor.

Vor dem Start: Konsistenzprüfung der Strategie mit der Bibliothek; ein Fehler verhindert den Start und wird angezeigt. Strategieparameter „bei der Anwendung“ ohne Wert verhindern den Start. Danach Prüfung und Beschaffung der Kursdaten (Abschnitt 5).

Instrumente des Testlaufs (req-test-001): das Instrument der Anwendung und jedes feste Instrument oder jeder Wert eines Strategieparameters vom Objekttyp `Instrument`, die die Strategie verwendet. Ein Instrument, das erst ein Ausdruck bei der Ausführung bildet, kann vorher nicht bestimmt werden; fehlen dafür bei der Ausführung Daten, ist der Wert „nicht verfügbar“ und eine Order darauf wird mit `market_closed` abgelehnt.

### 6.2 Testkonto

Felder (req-test-005): Name, Anfangskapital, Kontowährung, Hebel, Spread („aus den Kerzen“ oder fester Wert in Punkten), Kommission je Lot und Seite. Das Standard-Testkonto ist mitgeliefert (10 000 EUR, Hebel 30, Spread aus den Kerzen, Kommission 0), lässt sich ändern, aber nicht löschen. Angaben zum Instrument gehören nicht zum Testkonto.

### 6.3 Einzelschritt-Test

Sitzung im Backend nach E8 mit den Befehlen: Start (bis zur ersten handelnden Stelle, req-test-012), Einzelschritt, Sprung zur nächsten handelnden Stelle oder zum nächsten Haltepunkt (req-test-013), Haltepunkt setzen und entfernen, Ende. Der Zustand nach jedem Befehl enthält: aktuelles Element und Auswertung, Werte aller Objekte, Elemente und Ergebnisse, Unterschiede zum vorigen Schritt (req-test-014), Konto, Orders, Positionen, Ablehnungen mit Grund, Kursdaten für die Charts bis zum aktuellen Zeitpunkt und die handelnden Stellen bis dahin (req-test-011). Haltepunkte gehören zur Sitzung, nicht zur Strategie. Eine Sitzung endet nach Ende, nach dem Testzeitraum oder nach 60 Minuten ohne Befehl.

### 6.4 Backtest

Der Backtest läuft im Backend in einem eigenen Prozess, damit Anfragen beantwortet bleiben; die Oberfläche fragt den Fortschritt ab und kann abbrechen. Ergebnis (req-test-021):

- Kontoentwicklung: Kapital und Kontostand je Kerzenschluss der kleinsten Zeiteinheit der Strategie, höchstens 5 000 Punkte, bei mehr verdichtet auf Höchst- und Tiefstwert je Abschnitt; dazu der Rückgang vom Höchststand
- Trades: je Position Eröffnung und Schließung (Zeitpunkt, Preis), Richtung, Volumen, Gewinn oder Verlust, Kosten (Kommission, Swap), Grund der Schließung (Stop-Loss, Take-Profit, Position schließen, Ende des Testzeitraums, Konto aufgebraucht), Vermerke nach req-fach-021
- Kennzahlen: Nettogewinn, Anzahl der Trades, Trefferquote, Verhältnis Gesamtgewinn zu Gesamtverlust, größter Rückgang vom Höchststand (Betrag und Prozent), durchschnittlicher Gewinn und durchschnittlicher Verlust je Trade
- Ereignisse: abgelehnte Orders und Änderungen mit Zeitpunkt, Element und Grund (req-test-004, Hinweis H9 aus `requirements-4.md`), Fehler der Auswertung mit Element und Ausdruck, zusammengefasst je Element und Grund mit Anzahl und erstem Zeitpunkt
- Kursdaten für den Chart werden nicht gespeichert, sondern bei Bedarf aus dem Datenbestand gelesen

Positionen, die am Ende des Testzeitraums offen sind, schließt die Abwicklung zum letzten Kurs; Grund „Ende des Testzeitraums“.

### 6.5 Gespeicherte Backtests

Gespeichert wird nur auf ausdrücklichen Befehl (req-test-022): Kopie der Strategie (Dokument), Werte der Strategieparameter, Testkonto mit den verwendeten Werten, Instrument und Angaben zu den Instrumenten mit den verwendeten Werten, Testzeitraum, Broker der Kursdaten, Ergebnis nach 6.4. Liste mit Name der Strategie, Zeitraum, Zeitpunkt des Speicherns und Nettogewinn; Löschen nach Rückfrage. Vergleich von zwei oder mehr gespeicherten Backtests mit Kennzahlen und übereinandergelegten Kontokurven. Die Kopie der Strategie kann pipwerk replay als Dokument liefern; angesehen wird sie in der Darstellung des Strategiedesigners, nur lesend (Abschnitt 8).

## 7. Web-API

Öffentliche Web-API von pipwerk replay unter `/api/v1/` (req-system-009), beschrieben unter `contracts/api/pipwerk-replay/v1/openapi.json`: Strategien des Objektverzeichnisses lesen, Testkonten, Vorbereitung eines Testlaufs (benötigte Kursdaten, Stand, Beschaffung), Einzelschritt-Sitzungen mit den Befehlen aus 6.3, Backtests (starten, Fortschritt, abbrechen, Ergebnis), gespeicherte Backtests, Datenbestand (Übersicht, Import, Beschaffung von Hand). Interne Endpunkte für Einstellungen wie in pipwerk Studio. Die Endpunkte im Einzelnen legen die Aufträge fest.

## 8. Oberfläche

Folgt nach der Bestätigung des Prototyps. Fenstergrößen wie im Auftrag des Prototyps: 390 × 844, 844 × 390, 820 × 1180, 1180 × 820, 1366 × 768, 1920 × 1080 (req-system-024). Die Darstellung der Strategie (req-test-010) übernimmt die Bausteine der Zeichenfläche von pipwerk Studio als gemeinsame Bausteine in `packages/ui-components` (req-system-008), nur lesend.

## 9. Abbildung der Testfälle

`str-01`: Auslöser `Kerzenschluss` der Handelszeiteinheit und in der Verwaltung `Tick` und `Kerzenschluss`. Benötigt: Kerzen der Signal- und der Handelszeiteinheit und Ticks des Instruments der Anwendung (wegen `Tick`, Abschnitt 4.1, damit auch für die Abwicklung). Zwei Instanzen `ZigZag` mit `letztes_hoch`, `vorletztes_hoch`, `letztes_tief`, `vorletztes_tief` (3.3). Zu Beginn ohne Wendepunkte gilt „kein Trend“ (req-test-008, 3.2). Eine Stop-Order mit überschrittenem Einstieg wird mit `price_wrong_side` abgelehnt, „Order aufgeben“ nimmt `nicht gestellt` (4.3). Das Testfalldokument `contracts/strategies/v2/testcases/str-01.strategy.json` muss der Fassung des Testfalls vom 2026-10-21 entsprechen (ZigZag statt Markttechnik); ist es das beim Beginn der Umsetzung nicht, wird es in diesem Vorhaben angepasst.

`str-03`: Auslöser `Kerzenschluss` H1 im Hauptablauf und in der Verwaltung. Benötigt: Kerzen H1 und M1 (4.1). Beim selben Kerzenschluss schließt die Verwaltung die alte Position, danach eröffnet der Hauptablauf die neue (3.4). Die Marktorder wird nach der Ausführung mit der Risikoregel geprüft (3.5).

## 10. Tests und Nachweis

- Bibliothek (pytest): Auswertung jeder Funktion und jedes Operators, „leer“, „nicht verfügbar“ und Fehler mit ihrer Wirkung je Stelle; `PREVIOUS`; `EMA`, `ATR`, `ZigZag` gegen Werte aus MetaTrader 5 für eine mitgelieferte Kursreihe; Reihenfolge der Auswertungen; Bestimmen und Prüfen mit Regeln; Rückführung mit Abbruch.
- Abwicklung (pytest): jeder Ordertyp, Stop-Loss und Take-Profit mit und ohne Sprung, Weg innerhalb einer Kerze M1, jeder Ablehnungsgrund, Kosten, Margin, Konto aufgebraucht, Teilschließung nach req-fach-021.
- Datenbestand (pytest): Import JSON und CSV mit gültigen und fehlerhaften Dateien, Ersetzen, Lücken und Handelspausen, Migration.
- Beschaffung: Tests gegen eine nachgebildete Quelle mit derselben Schnittstelle; `pipwerk-fetch-mt5` mit einer nachgebildeten Schnittstelle von `MetaTrader5`. Gegen eine echte Installation von MetaTrader 5 prüft der Auftraggeber in der Abnahme.
- Testfälle: `str-01` und `str-03` laufen im Backtest über mitgelieferte Kursdaten mit erwarteten Trades; Einzelschritt-Test und Backtest liefern für denselben Zeitraum dieselben Trades (E7).
- Backend, Oberfläche, Browsertests wie in pipwerk Studio; Einzelheiten nach Abschnitt 8.

## 11. Sicherheit

- Ohne Anmeldung, nur im vom Betreiber kontrollierten Netz (req-system-011), wie pipwerk Studio. `pipwerk-fetch-mt5` nimmt nur Anfragen mit dem gemeinsamen Schlüssel an, weil es einen Rechner mit Handelssoftware erreicht.
- Hochgeladene Dateien (Import, Strategie): Größe begrenzt, streng geprüft, nie ausgeführt; Pydantic mit Ablehnung zusätzlicher Felder.
- Ausdrücke nur über den Syntaxbaum ausgewertet; Grenzen für Schritte je Auswertung (3.4), Zahl gleichzeitiger Sitzungen und Backtests, Umfang von Antworten.
- Texte und Namen des Anwenders setzt die Oberfläche als Text, nie als HTML.

## 12. Dokumentation

- technische Dokumentation: `docs/technical/pipwerk-replay.md` (neu), `docs/technical/pipwerk-marketdata.md` (neu), `docs/technical/pipwerk-fetch-mt5.md` (neu), `docs/technical/pipwerk-domain.md` (Ausführung, Indikatoren, `ZigZag`), Beschreibungen unter `contracts/`
- Anwenderdokumentation `docs/user/pipwerk-replay.md`: Testlauf vorbereiten, Testkonten, Kursdaten und Datenbestand mit Import und Beschaffung, Einzelschritt-Test, Backtest, Ergebnis, Speichern und Vergleich, Ablehnungsgründe in Händlersprache; Einrichtung von `pipwerk-fetch-mt5` auf dem Rechner von MetaTrader 5
- Glossar: Testlauf, Testkonto, interne Abwicklung, Ablehnung, handelnde Stelle, Haltepunkt, Datenbestand historischer Kursdaten, Beschaffung, Quelle

## 13. Entscheidungen zu Hinweisen der QA und Vorschläge

Hinweise aus `requirements-4.md` und `requirements-5.md`:

| Hinweis | Entscheidung |
|---|---|
| H7 | Ablehnungsregeln in 4.3; „Einstieg“ in `str-01` ist der Preis der Stop-Order. |
| H8 | Ablehnung bei „Order ändern“, „Position ändern“, „Order löschen“, „Position schließen“ in 3.5. |
| H9 | abgelehnte Orders und Gründe im Ergebnis und im gespeicherten Backtest (6.4, 6.5). |
| H10 | „leer“ in Berechnungen und Eigenschaften einer Order nach 3.2 und der Tabelle in `pipwerk-domain.md`, Abschnitt 8. |
| H11 | betrifft den Dokumentstatus der Anforderungen; geht als Hinweis an den Projektleiter. |
| H12 | `pipwerk-domain.md`, Abschnitt 8, „Leer“: Ausnahme nach req-test-008 und Verhalten von `ISBLANK` ergänzt (3.2). |

Vorschläge zu offenen Punkten, die die Ausführung braucht (Frage an den Auftraggeber):

1. `Start von Hand` im Testlauf (Anforderungen offener Punkt 2, Fachmodell req-fach-053): tritt einmal zu Beginn des Testzeitraums ein; im Einzelschritt-Test kann der Anwender ihn zusätzlich an der aktuellen Stelle auslösen. In einer Verwaltung tritt er nicht ein.
2. Geltung von `Parameter setzen` (Fachmodell req-fach-047): Der geänderte Wert gilt bis zum Ende der Auswertung; die nächste Auswertung beginnt wieder mit dem Wert des Testlaufs.

## Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-21 | Erstfassung ohne Oberfläche, vor der Bestätigung des Prototyps. |
