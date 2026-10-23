# Prototyp pipwerk replay

Klickbarer Prototyp der gesamten Oberfläche des Strategietesters (Produktname pipwerk replay) mit den Betriebsarten Einzelschritt-Test und Backtest, mit simulierten Daten. Er zeigt Bedienung und Erscheinungsbild und braucht kein Backend. Aufträge: `development/backtest/prototype/order-01.md`, der Nachtrag `order-02.md` (Entscheidungen des Auftraggebers zu „Manuell“ und „Parameter setzen“) und `order-03.md` (Ansicht „Datenbestand“, Import mehrerer Dateien, keine Beschaffung aus pipwerk replay). Zweig `backtest/proto-replay` (Prototypzweig, wird nicht übernommen). Der Auftraggeber bestätigt den Prototyp, bevor die Oberfläche spezifiziert und umgesetzt wird.

## Bau und Start

Voraussetzung: Node.js 24 oder neuer.

```sh
npm install
npm run build        # Typprüfung (strict), Vite-Bau, dann eine einzige HTML-Datei
```

Ergebnis: `dist/pipwerk-replay-prototyp.html`. Die Datei enthält alle Skripte und Stile. Sie läuft ohne Server und ohne Internetverbindung durch Öffnen im Browser (`file://`). Zum Entwickeln: `npm run dev`.

Gespeichert werden im lokalen Speicher des Browsers: Sprache, Testkonten, gespeicherte Backtests, importierte Reihen des Datenbestands und der „Broker für Testläufe“. Bei jedem Start sind die Strategien (die Strategie „EMA-Trendfolge“ des Auftraggebers, `str-01`, `str-03`, ein Beispiel) und das Standard-Testkonto da, auch wenn das Konto vorher gelöscht wurde. Zurücksetzen: die Daten der Seite im Browser löschen.

## Prüfungen

```sh
npm run e2e                                              # Playwright, Chromium: Simulation, Durchspielen, Fenstergrößen, Funktionen, Start
npm run e2e -- --project=firefox --project=webkit        # Start ohne Fehler in der Konsole in Firefox und WebKit
npm run screenshots                                      # erzeugt die Bilder unter screenshots/
```

Die Browsertests öffnen die gebaute Datei über `file://`, also erst `npm run build`. Fehlen die Browser: `npx playwright install chromium firefox webkit`.

| Datei in `e2e/` | Inhalt |
|---|---|
| `smoke.spec.ts` | gebaute Datei öffnet sich über `file://` ohne Fehler in der Konsole (Chromium, Firefox, WebKit) |
| `replay.spec.ts` | Durchspielen nur über die Bedienung: Einzelschritt-Test `str-01` bis zur ersten handelnden Stelle, Einzelschritt, Haltepunkt, Sprung, abgelehnte Order mit Grund; Backtest `str-03` mit Ergebnis, Klick auf einen Trade, Speichern, Vergleich zweier Backtests |
| `layout.spec.ts` | sechs Fenstergrößen im Einzelschritt-Test `str-01`, im Ergebnis des Backtests `str-03`, in der Ansicht „Datenbestand“ (mit geöffneten Einzelheiten) und im Dialog „Datei importieren“ (leer, mit zwei Dateien, mit Ergebnis): keine waagerechte Bildlaufleiste der Seite und, in Tabelle, Ansicht und Dialog, keine innerhalb; kein Bereich mit Breite oder Höhe null, keine überlappenden Bereiche, alle Bereiche und Knöpfe erreichbar |
| `features.spec.ts` | Vorbereitung, Testkonten, Kursdaten vor dem Start (fehlende Daten: der Testlauf startet nicht, die Meldung nennt die fehlenden Teile und führt zum Datenbestand), Datenbestand (Leiste mit „Datei importieren …“ und „Broker für Testläufe“, Filter und Seitenwechsel der Tabelle, Einzelheiten einer Reihe mit Lücken und Kontraktdaten, Import von zwei Dateien in einem Vorgang mit neuem Brokernamen, geänderter Zeiteinheit und Ergebnis je Datei, fehlerhafte Datei neben guten, Datei ohne erkannte Angaben), Auslöser „Manuell“ (Einstellung, Zeitpunkt im und außerhalb des Testzeitraums, Befehl „Manuell auslösen“, `str-01` ohne beides), Indikator ohne Werte, Reihenfolge Verwaltung vor Hauptablauf, Werte am Schritt, Sprache, gespeicherte Daten, Abbrechen |
| `sim.spec.ts` | eigene Absicherung der Simulation ohne Browser (handelnde Stellen, abgelehnte Order, Trades, Auslöser „Manuell“ einmal und per Befehl) |
| `screenshots.spec.ts` | Bildschirmbilder unter `screenshots/` |

## Technik und Abhängigkeiten

React 19 mit TypeScript (`strict`, ohne Emit) und Vite, Versionen wie in der Oberfläche von pipwerk Studio. Playwright für die Browsertests. Weitere Abhängigkeiten gibt es nicht; `package-lock.json` legt die Versionen fest.

- **Chart-Bibliothek: keine.** Kerzenchart, Kontokurve und Rückgang sind eigene SVG-Zeichnungen (`src/Chart.tsx`), damit Kerzen (steigend grün, fallend rot, schwarzer Rahmen und Docht), Markierungen, Orderlinien und Klick auf einen Trade genau nach Auftrag aussehen und ohne Lizenzfragen bleiben. Für die Umsetzung ist das keine Vorentscheidung; eine Bibliothek wie Lightweight Charts (Apache-2.0) ließe sich dort einsetzen.
- **Zeichenfläche und Eigenschaftenansicht aus dem Studio-Prototyp:** `catalog.ts`, `expr.ts`, `scene.ts`, `layout.ts`, `summary.ts`, `samples.ts`, `factory.ts`, `model.ts`, Farben, Schrift, Abstände und Steuerelemente (`styles.css`, `ui.tsx`) stammen aus dem bestätigten Prototyp des Strategiedesigners (Zweig `strategiedesign/proto-studio`). Die Strategie wird nur gelesen (`src/FlowView.tsx`), nichts davon bearbeitet.
- **Keine Übersetzungsbibliothek.** Jeder Text steht mit Deutsch und Englisch an der Stelle, an der er erscheint (`L('deutsch', 'english')`). Namen von Strategien und frei eingegebene Texte werden nicht übersetzt. `features.spec.ts` prüft die englische Oberfläche auf deutsche Texte.
- Lizenztext im Dialog „Über pipwerk replay“: die Datei `LICENSE` des Repositories, beim Bau eingebettet.

| Datei in `src/` | Inhalt |
|---|---|
| `sim/market.ts` | erfundene Kurse je Instrument aus einem Zufallsgenerator mit festem Startwert, Zeiteinheiten, Ticks |
| `sim/indicators.ts`, `sim/engine.ts`, `sim/replay.ts` | EMA, ATR, ein einfacher 1-2-3-Trend, kleiner Interpreter für das Strategiemodell und eine interne Abwicklung wie ein Broker; Ablauf mit Schrittprotokoll für den Einzelschritt-Test |
| `data.ts` | Strategien, Testkonten, Datenbestand (Reihen, Lücken, Broker), Prüfung der Kursdaten |
| `importing.ts` | Import: Erkennen von Instrument und Daten aus Dateiname und JSON-Inhalt, Prüfung je Datei, Zeitzone, die beiden Beispieldateien |
| `store.ts` | Zustand und Aktionen |
| `App.tsx`, `Prepare.tsx`, `RunView.tsx`, `ResultView.tsx`, `SavedView.tsx`, `DataView.tsx`, `ImportDialog.tsx`, `AccountsView.tsx`, `Dialogs.tsx`, `Modal.tsx`, `FlowView.tsx`, `Chart.tsx` | Oberfläche |

## Was simuliert ist

- **Kurse:** erfundene, glaubwürdige Kurse für `EURUSD`, `GBPUSD`, `USDJPY` und `XAUUSD`, immer dieselben bei jedem Start. Als letzter vollständiger Handelstag gilt fest der 2026-10-20 (damit Bilder und Tests stabil bleiben). Kerzen entstehen aus 5-Minuten-Kerzen; Ticks sind je Kerze vier simulierte Kurse. Das ist nur Prototyp-Daten: Das Produkt bildet keine Ticks aus Kerzen nach.
- **Ablauf und Orders:** Der Prototyp wertet die Strategie wirklich mit einem kleinen Interpreter aus (Bedingungen, Berechnungen, „Order aufgeben“, „Order ändern“, „Order löschen“, „Position ändern“, „Position schließen“, Risikoregel, Mindestvolumen). Er rechnet die Indikatoren `EMA` und `ATR` nach der üblichen Formel. Der 1-2-3-Trend (Markttechnik) ist ein einfacher Ersatz aus Wendepunkten mit festem Fenster, nicht der mitgelieferte Indikator. Die Abwicklung verhält sich wie ein Broker: Sie lehnt zum Beispiel eine Kauf-Stop-Order unter dem Kurs, einen Stop-Loss auf der falschen Seite oder fehlende Margin ab und nennt den Grund.
- **Nicht gerechnet:** Swap, Margin außer als Prüfung bei der Order, Umrechnung zwischen Währungen (der Tickwert gilt in Kontowährung).
- **Datenbestand:** erfundene Bestände je Broker (zwei Broker, `Demo-Broker (MetaTrader 5)` mit Kerzen, Ticks und Kontraktdaten, `Zweiter Demo-Broker (MetaTrader 5)` mit Kerzen von `EURUSD` ohne Kontraktdaten und Kontraktdaten von `GBPUSD` ohne Kursdaten). Lücken sind in den Reihen `XAUUSD` H1 (zwei) und `USDJPY` D1 (eine) eingebaut; die M15-Kerzen von `EURUSD` beginnen erst 2025-03-03, Ticks von `EURUSD` erst 2025-06-02. Der Zeitraum ist der erste bis letzte Tag, Lücken zählen nur Handelstage. Die Werte der Kontraktdaten in den Einzelheiten sind erfunden und je Instrument festgelegt; eine importierte Kontraktdatei legt nur an, dass die Kontraktdaten dieses Brokers vorliegen, ihre Werte werden nicht gezeigt.
- **Import:** wirklich gelesen werden Name und Inhalt jeder Datei. JSON: Objekt mit `broker`, `instrument`, `data` (`M15`, `H1` …, `TICKS` oder `CONTRACT`) und `rows` (`t`, `o`, `h`, `l`, `c` beziehungsweise `t`, `bid`, `ask`) oder `contract` (`tickSize`, `tickValue`, `contractSize`); das Format ist für den Prototyp erfunden, das Schema des Produkts liegt noch nicht vor. CSV: Export von MetaTrader 5 (Tabulator, Kopfzeile, Datum, Zeit, Kurse). Geprüft werden Zeit, Kurse größer als null, Hoch ≥ Eröffnung, Schluss ≥ Tief, aufsteigende Zeit. Die Zeitzone rechnet die Zeit der CSV-Dateien nach UTC um (für Anfang und Ende des Zeitraums). Die Beispieldatei „Beispiel CSV“ hat M15-Kerzen von `EURUSD` mit drei fehlerhaften Zeilen und schließt die Lücke vor 2025-03-03 beim ersten Broker, „Beispiel JSON“ hat H1-Kerzen von `XAUUSD` mit einer fehlerhaften Zeile und schließt eine Lücke. Beide stehen im Dialog „Datei importieren“. Der Import ändert nur den Bestand im Browser.
- **Keine Beschaffung:** der Prototyp holt keine Daten. Was fehlt, zeigt die Prüfung vor dem Start; der Testlauf startet nicht.
- **Strategien:** `str-01` und `str-03` stammen aus den Testfällen (wie im Studio-Prototyp umgesetzt, mit dem Indikator „1-2-3-Trend (Markttechnik)“ wie im Strategiedokument unter `contracts/strategies/v1/testcases/`; die Beschreibung `str-01` nennt inzwischen den ZigZag, das Strategiedokument noch nicht). Die Strategie „EMA-Trendfolge“ des Auftraggebers hat den Stop-Abstand 0; die Orders werden deshalb abgelehnt (Margin oder Risikoregel), bis der Wert im Testlauf geändert wird. Das Beispiel „EMA-Trendfolge mit Vergleichsinstrument“ ist erfunden, um einen Strategieparameter vom Typ Instrument zu zeigen; der Ablauf ignoriert ihn, der Testlauf prüft aber dessen Kursdaten. Er hat zusätzlich den Auslöser „Manuell“ im Hauptablauf, damit die Einstellung ausprobiert werden kann.
- Die Ergebnisse (Gewinn, Trefferquote) sind Eigenschaften der erfundenen Kurse und sagen nichts über die Strategien.

## Bedienung in Kürze

- **Betriebsart** oben in der Kopfzeile umschalten. „Testlauf“ bereitet vor (Strategie, Instrument, Zeitraum, Testkonto, Parameter, Kursdaten) und startet. Die Prüfung der Kursdaten zeigt je Datensatz „vorhanden“ oder „fehlt“; fehlt etwas, startet der Testlauf nicht, und die Meldung führt mit „Zum Datenbestand“ zum Import.
- **Datenbestand:** oben die Leiste mit „Datei importieren …“ und „Broker für Testläufe“, darunter die Tabelle (Broker, Instrument, Daten, Zeitraum, Lücken) mit Filtern und Seiten. Ein Klick auf eine Zeile zeigt Lücken und Kontraktdaten. Im Dialog „Datei importieren“ werden Dateien gewählt, Broker und Zeitzone einmal angegeben, Instrument und Daten je Datei geprüft und „Importieren“ übernimmt alle.
- **Einzelschritt-Test:** hält an der ersten handelnden Stelle am ersten Element des Ablaufs. „Einzelschritt“ geht zum nächsten Element, am Ende einer Auswertung zur nächsten Auswertung. „Nächste handelnde Stelle“ springt bis dorthin oder zum nächsten Haltepunkt. Haltepunkt: kleiner Kreis an der Ecke eines Elements. „Zum Testbeginn“ zeigt die ersten Auswertungen, in denen Indikatoren noch keine Werte haben. Ein Element anwählen zeigt in der Eigenschaftenansicht Parameter, Eigenschaften und Ergebnisse; beim Überfahren erscheint eine Einblendung; gelb markierte Werte haben sich seit dem letzten Schritt geändert. Bei einer Strategie mit dem Auslöser „Manuell“ gibt es zusätzlich „Manuell auslösen“ (siehe unten).
- **Backtest:** Fortschritt mit „Abbrechen“, danach Ergebnis. „Backtest speichern“ speichert nur auf Wunsch. Unter „Gespeicherte Backtests“ lassen sich zwei oder mehr anhaken und vergleichen; „Getestete Fassung“ zeigt die Strategie nur lesend.

## Entscheidungen zur Bedienung

- **Anordnung nach Fenstergröße:** ab 1500 Pixel Breite stehen Strategie, Chart, Konto/Orders und Eigenschaften gleichzeitig; von 1100 bis 1499 teilen sich Konto/Orders und Eigenschaften einen Bereich mit Reitern; unter 1100 ein Bereich nach dem anderen mit Leiste unten, bei hohen Tablets bleibt der Chart oben stehen. Beim Backtest-Ergebnis gilt dieselbe Staffelung.
- **Auswertungen:** Jeder Auslöser (Kerzenschluss, Tick, Manuell) ergibt eine Auswertung. Bei demselben Zeitpunkt zeigt eine Leiste die Reihenfolge: zuerst Verwaltung der Orders, dann Hauptablauf (`str-03` Abschnitt 5).
- **Abgelehnte Order:** Die Auswertung trägt vorab die Marke „endet mit abgelehnter Order“. Beim Erreichen von „Order aufgeben“ steht der Grund am Element, in der Eigenschaftenansicht, im Protokoll und im Chart (rotes Kreuz).
- **Testkonto:** Änderungen im Testlauf bleiben im Testlauf; „Änderung im Testkonto speichern“ und „Als neues Testkonto speichern“ speichern ausdrücklich. Angaben zum Instrument werden nie gespeichert.
- **Kosten im Ergebnis:** Der Gewinn ist nach Spread und Kommission; „Kosten“ nennt Kommission und Spreadanteil des Trades zur Information.
- **Abgelehnte Orders im Ergebnis:** Der Prototyp speichert die ersten 400 mit Grund; die Zahl aller steht bei den Kennzahlen.
- **Leere Zustände** nennen immer den nächsten Schritt, **jedes Feld** hat eine Erklärung beim Zeigen (Maus oder Tastatur).

## Entscheidung zum Auslöser „Manuell“ (Anforderungen Strategietester, Abschnitt 5, Punkt 2; req-test-015, req-fach-053)

Der Auftraggeber hat entschieden (Frage `backtest-01`): Der Auslöser heißt „Manuell“ (englisch „Manual“). Er tritt in einem Testlauf **genau einmal** ein, standardmäßig **zu Beginn des Testzeitraums vor der ersten Kerze**. Wahlweise gibt der Anwender einen Zeitpunkt im Testzeitraum an (Datum und Uhrzeit, UTC). Der Prototyp setzt das so um:

- **Vorbereitung:** Die Karte „Auslöser Manuell“ erscheint nur, wenn die gewählte Strategie den Auslöser „Manuell“ hat. Sie zeigt die Regel und ein Feld „Zeitpunkt (UTC)“; leer heißt Beginn des Testzeitraums. Ein Zeitpunkt außerhalb des Testzeitraums sperrt „Starten“; die Meldung an der Karte und am Startknopf nennt den Grund. „Zu Beginn des Testzeitraums“ setzt das Feld zurück. Von den vier Strategien hat nur das Beispiel „EMA-Trendfolge mit Vergleichsinstrument“ den Auslöser (im Hauptablauf, danach Richtung, Stop-Loss, Order); `str-01` und `str-03` bleiben unverändert und zeigen weder Karte noch Befehl.
- **Einzelschritt-Test:** „Manuell“ ist eine eigene Auswertung zum eingestellten Zeitpunkt, im Chart mit einem violetten Quadrat. Der Befehl „Manuell auslösen“ in der Steuerung ist nur bei einer Strategie mit dem Auslöser zu sehen und nur zwischen zwei Auswertungen bedienbar, also am letzten Element der aktuellen Auswertung. Er fügt eine Auswertung „Manuell“ zum aktuellen Zeitpunkt unmittelbar nach der aktuellen Auswertung ein; „Einzelschritt“ geht hinein. Der Prototyp rechnet dazu den Testlauf neu, die Auswertungen davor bleiben gleich.
- **Backtest:** „Manuell“ wird einmal zum eingestellten Zeitpunkt ausgewertet.
- **Entfallen:** Das Element „Parameter setzen“ ist aus Katalog, Erklärungen, Zusammenfassung und Interpreter entfernt; keine Strategie des Prototyps verwendet es.

Im Prototyp hat ein Indikator zu Beginn noch keine Werte. Die Order der Beispielstrategie wird deshalb bei „Manuell“ zu Beginn abgelehnt (Richtung nicht bestimmt); das zeigt den Fall ohne Werte. Ein späterer Zeitpunkt, an dem die Indikatoren Werte haben, stellt eine Order.

## Entscheidungen zu `order-03.md` (Datenbestand, Import, keine Beschaffung)

- **Aufbau der Ansicht:** Leiste, Tabelle, Einzelheiten in einer Zeile unter der angeklickten Reihe (kein eigener Bereich, funktioniert in jeder Fenstergröße ohne Hinweis auf „oben“ oder „unten“). Zehn Reihen je Seite. Der Bereich „Angaben zum Instrument je Broker“ und der Bereich zur Beschaffung sind entfallen.
- **Kontraktdaten gehören zur Prüfung:** Ein Testlauf braucht für jedes seiner Instrumente die Kontraktdaten des Brokers (Spezifikation 5.2); die Prüfung zeigt sie als Datensatz „Kontraktdaten“ ohne Zeitraum. Fehlen sie, startet der Testlauf nicht und die Meldung sagt es. Darum zeigt die Prüfung bei `str-01` vier statt drei Zeilen.
- **Broker für Testläufe:** Die Wahl ist gespeichert und belegt den Broker in „Testlauf vorbereiten“ vor; dort bietet das Feld nun ebenfalls nur Broker des Datenbestands, die Änderung dort gilt nur für den Testlauf. Ein neuer Broker aus dem Import erscheint sofort in beiden Feldern. Die Kennung eines neuen Brokers ist sein Name; Preise und Kontraktwerte eines neuen Brokers sind im Prototyp die des ersten Brokers.
- **Zeile mit „Kontraktdaten“:** nur wenn es für Broker und Instrument keine Kursdaten gibt; sonst stehen die Kontraktdaten in den Einzelheiten der Kursreihen.
- **Instrument im Import:** Auswahl aus den vier Instrumenten des Prototyps. Ein Dateiname mit einem anderen Instrument gilt als nicht erkannt und sperrt den Import, bis ein Instrument gewählt oder die Datei entfernt ist.
- **Dateien, die nicht lesbar sind** (falsches Format, kein gültiges JSON, kein `rows`/`contract`): sie sperren den Import nicht und werden beim Import ganz abgelehnt, die übrigen Dateien werden übernommen. Einzelne Zeilen mit Fehler werden übersprungen; das Ergebnis nennt Anzahl und die ersten drei Gründe mit Zeilennummer.
- **Broker im Import:** vorbelegt mit dem „Broker für Testläufe“; nennen alle lesbaren JSON-Dateien denselben Broker, ist er vorbelegt, solange der Anwender das Feld nicht selbst geändert hat. Zeitzone vorbelegt mit `UTC`, nur zu sehen, wenn eine CSV-Datei in der Liste ist; ein unbekannter Name sperrt den Import.
- **Texte:** Der Hinweis zur Beschaffung nennt `pipwerk-fetch-mt5` auf dem Rechner von MetaTrader 5 als Weg; alle Texte, Erklärungen und der Menühinweis zu Beschaffung aus pipwerk replay sind entfallen. Bei Reihen aus früherem Stand im Browser, die als beschafft gespeichert waren, werden sie beim Start verworfen.
- **Ausgangsbestand angepasst:** Damit die Bilder und Tests Lücken, fehlende Kontraktdaten und eine reine Kontraktzeile zeigen, hat der erfundene Bestand die oben genannten Lücken und den zweiten Broker; sonst bleibt er wie bestätigt.
- **Tests angepasst:** Der Backtest über zwei Jahre mit `str-01` und mit der Strategie des Auftraggebers startet im Ausgangsbestand nicht (M15-Kerzen und Ticks fehlen). Die Tests nehmen dafür `str-03` beziehungsweise einen kürzeren Zeitraum; der Fall „startet nicht“ ist durch `str-01` abgedeckt. Importiert man die Beispieldatei „Beispiel CSV“, liegen die M15-Kerzen vor.

## Grenzen

- Eingabe per Touch ist nicht geprüft; Maus und Tastatur sind geprüft.
- Das Ziehen im Chart und auf der Fläche verschiebt nur die Ansicht.
- Der Prototyp ist für 2 Jahre `M15`-Daten mit Ticks ausgelegt; sehr lange Zeiträume mit kleinen Zeiteinheiten brauchen einige Sekunden.
