# Auftrag Prototyp Strategietester (pipwerk replay)

- Vorhaben: `backtest`, Phase 2 Konzeption
- zuständig: Entwickler Oberfläche
- Zweig: `backtest/proto-replay`, Prototyp, wird nicht übernommen
- Stand: 2026-10-21

## Ziel

Ein klickbarer Prototyp der gesamten Oberfläche des Strategietesters (Produktname pipwerk replay) mit seinen beiden Betriebsarten Einzelschritt-Test und Backtest. Der Auftraggeber spielt darin die Testfälle `str-01` und `str-03` in beiden Betriebsarten ohne Anleitung durch, in allen Fenstergrößen unten. Er bestätigt den Prototyp, bevor die Oberfläche spezifiziert und umgesetzt wird (`docs/technical/entwicklungsverfahren.md`, Phase 2, Schritt 2). Der Prototyp zeigt Bedienung und Erscheinungsbild. Er braucht kein Backend und muss nicht richtig rechnen.

## Grundlagen

- `docs/design/requirements/anforderungen-strategietester.md`, vollständig (req-test-001 bis req-test-022, offene Punkte in Abschnitt 5)
- `docs/design/requirements/anforderungen-gesamtsystem.md`: req-system-008 (gemeinsame Gestaltungsregeln), req-system-023 (Deutsch und Englisch), req-system-024 (Fenstergröße), req-system-025 bis req-system-027 (Datenbestand historischer Kursdaten, Import, Beschaffung)
- `docs/design/domain/fachmodell.md`: Ablauf, Order aufgeben, Verwaltung einer Order (req-fach-047 bis req-fach-049a), Objekte der Anwendung (req-fach-051), Position (req-fach-052), Auslöser (req-fach-053), mitgelieferte Indikatoren (req-fach-054), Ordertypen (req-fach-025 bis req-fach-032)
- Testfälle `docs/design/strategies/str-01-fachlich-scalping-punkt-2-ausbruch-einfach.md` und `docs/design/strategies/str-03-fachlich-ema-trendfolge.md`, ihre Dokumente unter `contracts/strategies/v1/testcases/`
- `docs/technical/glossar.md`
- Der bestätigte Prototyp des Strategiedesigners: gebaute Datei `development/strategiedesign/prototype/pipwerk-studio-prototyp.html` auf `main`, Quellen auf dem Zweig `origin/strategiedesign/proto-studio` unter `components/pipwerk-studio/prototype/`. Der Einzelschritt-Test zeigt die Strategie so wie der Strategiedesigner (req-test-010). Übernimm dafür Darstellung der Zeichenfläche, Eigenschaftenansicht und Erscheinungsbild aus diesem Prototyp, nur lesend, ohne Bearbeitung der Strategie. Farben, Schrift, Abstände und Steuerelemente folgen ihm (req-system-008).

## Umfang

Der Prototyp zeigt mit simulierten Daten:

1. Aufbau: Kopfzeile mit Menü, Umschaltung der Betriebsart, „Über pipwerk replay“ und Sprachwahl. Alle Texte in Deutsch und Englisch.
2. Testlauf vorbereiten (req-test-001, req-test-002, req-test-005, req-test-007): Strategie wählen, mindestens `str-01`, `str-03` und die Strategie „EMA-Trendfolge“ des Auftraggebers (`development/strategiedesign/wp02/acceptance/ema-trendfolge-auftraggeber.strategy.json`). Instrument der Anwendung wählen. Testzeitraum mit Vorbelegung je Betriebsart (Einzelschritt-Test die letzten 30 Tage, Backtest die letzten 2 Jahre, jeweils bis zum letzten vollständigen Handelstag), änderbar. Testkonto wählen, ein Standard-Testkonto ist vorhanden. Werte des Testkontos (Anfangskapital, Kontowährung, Hebel, Spread aus den Kerzen oder fest, Kommission) und Angaben zum Instrument (Werte nach req-system-025) im Testlauf ändern, ausdrücklich als Testkonto speichern. Strategieparameter vorbelegt aus der Strategie, für den Testlauf änderbar, auch vom Typ Instrument. Testkonten anlegen, bearbeiten, speichern und löschen.
3. Kursdaten prüfen und beschaffen (req-test-003): Beim Start sieht der Anwender, welche Kursdaten für welche Instrumente, Zeiteinheiten und welchen Zeitraum gebraucht werden, ob sie vorliegen, und wie fehlende beschafft und importiert werden (Fortschritt). Zeige auch den Fall, dass Daten nicht beschafft werden können: Der Testlauf startet nicht, die Meldung nennt die fehlenden Daten und den Grund. `str-01` braucht Ticks, weil die Verwaltung den Auslöser `Tick` hat.
4. Datenbestand historischer Kursdaten (req-system-025 bis req-system-027): Übersicht, welche Instrumente, Zeiteinheiten, Zeiträume und Ticks vorliegen und welche Angaben zum Instrument je Broker; Import einer Datei von Hand mit Prüfung und Ergebnis; Beschaffung von Hand anstoßen.
5. Einzelschritt-Test (req-test-010 bis req-test-014): Strategie wie im Strategiedesigner und dazu der Chart des Instruments in jeder Zeiteinheit, die die Strategie verwendet (`str-01`: zwei). Orders, Positionen und Kontostand im Chart und als Werte. Handelnde Stellen im Chart markiert. Start hält an der ersten handelnden Stelle am ersten Element des Ablaufs. Einzelschritt zum nächsten Element mit Hervorhebung, Sprung zur nächsten handelnden Stelle, Haltepunkte setzen und entfernen. Angewähltes Element zeigt in der Eigenschaftenansicht Parameter, Eigenschaften und Ergebnisse mit den Werten des aktuellen Schritts; beim Überfahren mit der Maus eine kurze Einblendung der wichtigsten Werte; seit dem letzten Schritt geänderte Werte hervorgehoben. Zeige mindestens eine abgelehnte Order mit sichtbarem Grund am Element (req-test-004, `str-01` Abschnitt 1) und einen Schritt, in dem ein Indikator noch keine Werte hat und die Bedingung als nicht erfüllt gilt (req-test-008). Zeige die Reihenfolge Verwaltung vor Hauptablauf bei demselben Auslöser (`str-03` Abschnitt 5).
6. Backtest (req-test-020 bis req-test-022): Start und Fortschritt, Abbrechen. Ergebnis mit Kontoentwicklung als Kurve und darunter dem Rückgang vom Höchststand, Liste der Trades (Eröffnung, Schließung, Richtung, Volumen, Preise, Gewinn oder Verlust, Kosten), Kennzahlen (Nettogewinn, Anzahl der Trades, Trefferquote, Verhältnis Gesamtgewinn zu Gesamtverlust, größter Rückgang vom Höchststand, durchschnittlicher Gewinn und Verlust je Trade), Chart mit den Trades als Markierungen; Klick auf einen Trade zeigt seine Stelle im Chart. Abgelehnte Orders und ihr Grund sind im Ergebnis sichtbar (req-test-004). Backtest ausdrücklich speichern; Liste gespeicherter Backtests; zwei oder mehr nebeneinander vergleichen mit Kennzahlen und übereinandergelegten Kontokurven; die getestete Fassung der Strategie ansehen (wie im Strategiedesigner, nur lesend).
7. Offener Punkt req-test, Abschnitt 5, Punkt 2 (wann „Start von Hand“ im Testlauf eintritt): Zeige im Prototyp einen Vorschlag und beschreibe ihn im Ergebnis. Die Testfälle verwenden „Start von Hand“ nicht.
8. Kerzen: steigende grün, fallende rot, jeweils mit schwarzem Rahmen und Docht (req-test-010, KANN).
9. Anpassung an die Fenstergröße nach req-system-024 in diesen Größen (Breite × Höhe in Pixeln): 390 × 844, 844 × 390, 820 × 1180, 1180 × 820, 1366 × 768, 1920 × 1080. Bereiche dürfen ein- und ausgeklappt, umgeordnet oder nacheinander gezeigt werden.
10. Bedienerführung: Jeder leere Zustand nennt den nächsten sinnvollen Schritt; jedes Feld hat eine kurze Erklärung in Händlersprache beim Zeigen.

Simulierte Daten: erfundene, aber glaubwürdige Kurse (zum Beispiel `EURUSD`) mit vorbereiteten Abläufen, die zu den Testfällen passen. Sie müssen nicht aus einer echten Berechnung stammen. Was simuliert ist, beschreibt die README.

Technik nach deiner Wahl, passend zur Oberfläche von pipwerk Studio (React, TypeScript, Vite; Zeichenfläche wie im Studio-Prototyp). Eine Bibliothek für Charts darfst du wählen; nenne sie mit Lizenz in der README. Der Prototyp liegt auf seinem Zweig in `components/pipwerk-backtest/prototype/`. Er lässt sich zu einer einzigen HTML-Datei bauen, die alle Skripte und Stile enthält und ohne Server und ohne Internetverbindung durch Öffnen im Browser läuft. Gespeichertes darf im Browser liegen; nach Neuladen startet der Prototyp mit den Testfällen und einem Standard-Testkonto.

## Nicht-Umfang

- Backend, Web-API, Bibliothek, echte Abwicklung von Orders, echte Indikatoren, echte Beschaffung und echter Import
- Bearbeiten von Strategien (das ist der Strategiedesigner)
- Anwenderdokumentation
- Unit-Tests über das hinaus, was du zur eigenen Absicherung brauchst

## Technische Abnahmekriterien

1. Die gebaute Datei öffnet sich in Chromium, Firefox und WebKit über `file://` ohne Fehler in der Konsole.
2. Ein Browsertest (Playwright, Chromium) spielt nur über die Bedienung durch: Einzelschritt-Test von `str-01` vom Start bis zur ersten handelnden Stelle, Einzelschritt, Haltepunkt setzen, Sprung bis zum Haltepunkt, abgelehnte Order mit sichtbarem Grund; Backtest von `str-03` mit Ergebnis, Klick auf einen Trade, Speichern und Vergleich zweier gespeicherter Backtests.
3. Ein Browsertest prüft in jeder Fenstergröße aus Punkt 9 im Einzelschritt-Test von `str-01` und im Ergebnis des Backtests von `str-03`: keine waagerechte Bildlaufleiste der Seite, kein sichtbarer Bereich mit Breite oder Höhe null, keine überlappenden Bereiche; alle Bereiche erreichbar.
4. Bildschirmbilder: Einzelschritt-Test `str-01` und Ergebnis des Backtests `str-03` in allen Fenstergrößen aus Punkt 9, dazu je ein Bild in 1366 × 768 von: Vorbereitung des Testlaufs, Prüfung und Beschaffung der Kursdaten, Meldung bei nicht beschaffbaren Daten, Datenbestand mit Import, abgelehnte Order am Element, Vergleich gespeicherter Backtests. Die Bilder liegen als PNG im Zweig unter `components/pipwerk-backtest/prototype/screenshots/`.
5. `components/pipwerk-backtest/prototype/README.md` beschreibt Bau und Start, was simuliert ist, die gewählte Chart-Bibliothek mit Lizenz, deinen Vorschlag zu Umfang Punkt 7 und alle Entscheidungen, die du für die Bedienung getroffen hast. Keine Pfade des Entwicklungsrechners, keine Zugangsdaten.
6. Die gebaute Datei liegt im Zweig unter `components/pipwerk-backtest/prototype/dist/pipwerk-replay-prototyp.html`.

## Ergebnis

Ein benannter Commit im Zweig `backtest/proto-replay` auf GitHub. Nenne ihn vollständig im Ergebnis, dazu die erfüllten und nicht erfüllten Abnahmekriterien mit Nachweis und deine Entscheidungen.
