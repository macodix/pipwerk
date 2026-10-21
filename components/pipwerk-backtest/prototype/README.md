# Prototyp pipwerk replay

Klickbarer Prototyp der gesamten Oberfläche des Strategietesters (Produktname pipwerk replay) mit den Betriebsarten Einzelschritt-Test und Backtest, mit simulierten Daten. Er zeigt Bedienung und Erscheinungsbild und braucht kein Backend. Auftrag: `development/backtest/prototype/order-01.md`. Zweig `backtest/proto-replay` (Prototypzweig, wird nicht übernommen). Der Auftraggeber bestätigt den Prototyp, bevor die Oberfläche spezifiziert und umgesetzt wird.

## Bau und Start

Voraussetzung: Node.js 24 oder neuer.

```sh
npm install
npm run build        # Typprüfung (strict), Vite-Bau, dann eine einzige HTML-Datei
```

Ergebnis: `dist/pipwerk-replay-prototyp.html`. Die Datei enthält alle Skripte und Stile. Sie läuft ohne Server und ohne Internetverbindung durch Öffnen im Browser (`file://`). Zum Entwickeln: `npm run dev`.

Gespeichert werden im lokalen Speicher des Browsers: Sprache, Testkonten, gespeicherte Backtests und hinzugekommene Daten des Datenbestands. Bei jedem Start sind die Strategien (die Strategie „EMA-Trendfolge“ des Auftraggebers, `str-01`, `str-03`, ein Beispiel) und das Standard-Testkonto da, auch wenn das Konto vorher gelöscht wurde. Zurücksetzen: die Daten der Seite im Browser löschen.

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
| `layout.spec.ts` | sechs Fenstergrößen im Einzelschritt-Test `str-01` und im Ergebnis des Backtests `str-03`: keine waagerechte Bildlaufleiste der Seite, kein Bereich mit Breite oder Höhe null, keine überlappenden Bereiche, alle Bereiche erreichbar |
| `features.spec.ts` | Vorbereitung, Testkonten, Kursdaten und Beschaffung, Datenbestand, „Start von Hand“, Indikator ohne Werte, Reihenfolge Verwaltung vor Hauptablauf, Werte am Schritt, Sprache, gespeicherte Daten, Abbrechen |
| `sim.spec.ts` | eigene Absicherung der Simulation ohne Browser (handelnde Stellen, abgelehnte Order, Trades) |
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
| `data.ts` | Strategien, Testkonten, Datenbestand, Prüfung der Kursdaten |
| `store.ts` | Zustand und Aktionen |
| `App.tsx`, `Prepare.tsx`, `RunView.tsx`, `ResultView.tsx`, `SavedView.tsx`, `DataView.tsx`, `AccountsView.tsx`, `Dialogs.tsx`, `FlowView.tsx`, `Chart.tsx` | Oberfläche |

## Was simuliert ist

- **Kurse:** erfundene, glaubwürdige Kurse für `EURUSD`, `GBPUSD`, `USDJPY` und `XAUUSD`, immer dieselben bei jedem Start. Als letzter vollständiger Handelstag gilt fest der 2026-10-20 (damit Bilder und Tests stabil bleiben). Kerzen entstehen aus 5-Minuten-Kerzen; Ticks sind je Kerze vier simulierte Kurse. Das ist nur Prototyp-Daten: Das Produkt bildet keine Ticks aus Kerzen nach.
- **Ablauf und Orders:** Der Prototyp wertet die Strategie wirklich mit einem kleinen Interpreter aus (Bedingungen, Berechnungen, „Order aufgeben“, „Order ändern“, „Order löschen“, „Position ändern“, „Position schließen“, Risikoregel, Mindestvolumen). Er rechnet die Indikatoren `EMA` und `ATR` nach der üblichen Formel. Der 1-2-3-Trend (Markttechnik) ist ein einfacher Ersatz aus Wendepunkten mit festem Fenster, nicht der mitgelieferte Indikator. Die Abwicklung verhält sich wie ein Broker: Sie lehnt zum Beispiel eine Kauf-Stop-Order unter dem Kurs, einen Stop-Loss auf der falschen Seite oder fehlende Margin ab und nennt den Grund.
- **Nicht gerechnet:** Swap, Margin außer als Prüfung bei der Order, Umrechnung zwischen Währungen (der Tickwert gilt in Kontowährung).
- **Datenbestand:** erfundene Bestände je Broker, dazu erfundene Grenzen der Quelle (EURUSD: Ticks seit 2024, GBPUSD: Ticks nur 90 Tage, USDJPY: keine Ticks, M1 bis M4 und andere Längen unter fünf Minuten nicht). Beschaffung und Import ändern nur die Anzeige des Bestands; beim Import wird von der Datei nur Name und Größe gelesen. Die Beispieldatei schließt eine Lücke bei den M15-Kerzen von `EURUSD`.
- **Strategien:** `str-01` und `str-03` stammen aus den Testfällen (wie im Studio-Prototyp umgesetzt, mit dem Indikator „1-2-3-Trend (Markttechnik)“ wie im Strategiedokument unter `contracts/strategies/v1/testcases/`; die Beschreibung `str-01` nennt inzwischen den ZigZag, das Strategiedokument noch nicht). Die Strategie „EMA-Trendfolge“ des Auftraggebers hat den Stop-Abstand 0; die Orders werden deshalb abgelehnt (Margin oder Risikoregel), bis der Wert im Testlauf geändert wird. Das Beispiel „EMA-Trendfolge mit Vergleichsinstrument“ ist erfunden, um einen Strategieparameter vom Typ Instrument zu zeigen; der Ablauf ignoriert ihn, der Testlauf prüft aber dessen Kursdaten.
- Die Ergebnisse (Gewinn, Trefferquote) sind Eigenschaften der erfundenen Kurse und sagen nichts über die Strategien.

## Bedienung in Kürze

- **Betriebsart** oben in der Kopfzeile umschalten. „Testlauf“ bereitet vor (Strategie, Instrument, Zeitraum, Testkonto, Parameter, Kursdaten) und startet.
- **Einzelschritt-Test:** hält an der ersten handelnden Stelle am ersten Element des Ablaufs. „Einzelschritt“ geht zum nächsten Element, am Ende einer Auswertung zur nächsten Auswertung. „Nächste handelnde Stelle“ springt bis dorthin oder zum nächsten Haltepunkt. Haltepunkt: kleiner Kreis an der Ecke eines Elements. „Zum Testbeginn“ zeigt die ersten Auswertungen, in denen Indikatoren noch keine Werte haben. Ein Element anwählen zeigt in der Eigenschaftenansicht Parameter, Eigenschaften und Ergebnisse; beim Überfahren erscheint eine Einblendung; gelb markierte Werte haben sich seit dem letzten Schritt geändert.
- **Backtest:** Fortschritt mit „Abbrechen“, danach Ergebnis. „Backtest speichern“ speichert nur auf Wunsch. Unter „Gespeicherte Backtests“ lassen sich zwei oder mehr anhaken und vergleichen; „Getestete Fassung“ zeigt die Strategie nur lesend.

## Entscheidungen zur Bedienung

- **Anordnung nach Fenstergröße:** ab 1500 Pixel Breite stehen Strategie, Chart, Konto/Orders und Eigenschaften gleichzeitig; von 1100 bis 1499 teilen sich Konto/Orders und Eigenschaften einen Bereich mit Reitern; unter 1100 ein Bereich nach dem anderen mit Leiste unten, bei hohen Tablets bleibt der Chart oben stehen. Beim Backtest-Ergebnis gilt dieselbe Staffelung.
- **Auswertungen:** Jeder Auslöser (Kerzenschluss, Tick) ergibt eine Auswertung. Bei demselben Zeitpunkt zeigt eine Leiste die Reihenfolge: zuerst Verwaltung der Orders, dann Hauptablauf (`str-03` Abschnitt 5).
- **Abgelehnte Order:** Die Auswertung trägt vorab die Marke „endet mit abgelehnter Order“. Beim Erreichen von „Order aufgeben“ steht der Grund am Element, in der Eigenschaftenansicht, im Protokoll und im Chart (rotes Kreuz).
- **Testkonto:** Änderungen im Testlauf bleiben im Testlauf; „Änderung im Testkonto speichern“ und „Als neues Testkonto speichern“ speichern ausdrücklich. Angaben zum Instrument werden nie gespeichert.
- **Kosten im Ergebnis:** Der Gewinn ist nach Spread und Kommission; „Kosten“ nennt Kommission und Spreadanteil des Trades zur Information.
- **Abgelehnte Orders im Ergebnis:** Der Prototyp speichert die ersten 400 mit Grund; die Zahl aller steht bei den Kennzahlen.
- **Leere Zustände** nennen immer den nächsten Schritt, **jedes Feld** hat eine Erklärung beim Zeigen (Maus oder Tastatur).

## Vorschlag zum offenen Punkt „Start von Hand“ (Anforderungen Strategietester, Abschnitt 5, Punkt 2)

Der Auslöser „Start von Hand“ tritt in einem Testlauf **genau einmal** ein, **zu Beginn des Testzeitraums vor der ersten Kerze**, mit dem Zustand zu diesem Zeitpunkt (Kontostand gleich Anfangskapital, keine Orders, keine Positionen). Im Einzelschritt-Test erscheint er als eigene Auswertung ganz am Anfang („Zum Testbeginn“), im Chart mit einem violetten Zeichen; im Backtest wird er vor dem Lauf einmal ausgewertet. Eine Strategie, die nur diesen Auslöser hat, läuft damit genau einmal. Der Prototyp zeigt das in der Vorbereitung als Karte mit Zeitleiste und einem Schalter, der den Vorschlag im Testlauf sichtbar macht. Die Testfälle verwenden „Start von Hand“ nicht. Die Entscheidung trifft der Auftraggeber.

## Grenzen

- Eingabe per Touch ist nicht geprüft; Maus und Tastatur sind geprüft.
- Das Ziehen im Chart und auf der Fläche verschiebt nur die Ansicht.
- Der Prototyp ist für 2 Jahre `M15`-Daten mit Ticks ausgelegt; sehr lange Zeiträume mit kleinen Zeiteinheiten brauchen einige Sekunden.
