# Prototyp pipwerk Studio

Klickbarer Prototyp der gesamten Oberfläche von pipwerk Studio mit simulierten Daten. Er zeigt Bedienung und Erscheinungsbild, rechnet nichts und braucht kein Backend. Aufträge: `development/strategiedesign/prototype/order-01.md` (gesamte Oberfläche) `order-02.md` (geänderte Darstellung der Objekte vom 22. Oktober 2026) und `order-03.md` (Namensvorschlag beim Einfügen einer Vorlage und gemeinsamer Namensraum, Festlegungen vom 23. Oktober 2026). `order-04.md` (Elementbibliothek nach „Neue Strategie“ und Name „Assistent“, Einwände des Auftraggebers vom 23. Oktober 2026). Zweig `strategiedesign/proto-studio` (Prototypzweig, wird nicht übernommen). Der Auftraggeber bestätigt den Prototyp, bevor die Oberfläche spezifiziert und umgesetzt wird.

## Bau und Start

Voraussetzung: Node.js 24 oder neuer.

```sh
npm install
npm run build        # Typprüfung (strict), Vite-Bau, dann eine einzige HTML-Datei
```

Ergebnis: `dist/pipwerk-studio-prototyp.html`. Die Datei enthält alle Skripte und Stile. Sie läuft ohne Server und ohne Internetverbindung durch Öffnen im Browser (`file://`). Zum Entwickeln: `npm run dev`.

Gespeichertes (Strategien, Vorlagen, Einstellungen) liegt im lokalen Speicher des Browsers unter dem Schlüssel `pipwerk-studio-prototype-v2`. Bei jedem Start öffnet sich die Strategie „EMA-Trendfolge“ des Auftraggebers, und die beiden Testfälle `str-01` und `str-03` sowie die Strategie des Auftraggebers stehen in „Öffnen“, auch wenn sie vorher gelöscht wurden. Der Prototyp lässt sich nur im Browser zurücksetzen, indem man die Daten der Seite löscht.

## Prüfungen

```sh
npm run e2e                                              # Playwright, Chromium: Aufbau von str-03 und str-01, Objekte, Fenstergrößen, Funktionen, Start
npm run e2e -- --project=firefox --project=webkit        # Start ohne Fehler in der Konsole in Firefox und WebKit
npm run screenshots                                      # erzeugt die Bilder unter screenshots/
```

Die Tests öffnen die gebaute Datei über `file://`, also erst `npm run build`. Fehlen die Browser: `npx playwright install chromium firefox webkit`.

| Datei in `e2e/` | Inhalt |
|---|---|
| `smoke.spec.ts` | gebaute Datei öffnet sich über `file://` ohne Fehler in der Konsole (Chromium, Firefox, WebKit) |
| `build-str03.spec.ts` | `str-03` aus der leeren Zeichenfläche nur über die Bedienung. Jede Instanz wird mit dem Element ihrer ersten Verwendung verbunden: durch Klick in der Bibliothek bei gewähltem Element, durch Ziehen auf das Element, durch Wahl des Elements in den Eigenschaften einer freien Instanz. Danach Vergleich mit dem Testfall |
| `build-str01.spec.ts` | Hauptablauf und Verwaltung von `str-01` ebenso, die zweite Instanz durch Ziehen ihrer Karte auf das Element |
| `objects.spec.ts` | die drei Strategien zum Start senkrecht und waagerecht (Instanz neben beziehungsweise über oder unter dem Element ihrer ersten Verwendung, verbunden, kein Bereich für Objekte), freie Instanz mit Hinweis, Beschriftung mit Eigenschaft und Methode, Methoden in Bausteinen, Formeleditor und Typbeschreibung, Schalter „Aktualisieren“, die drei neuen Befunde, Regeln in der Eigenschaftenansicht |
| `names.spec.ts` | Auftrag 03: Trend-Vorlage mit zwei Indikatoren mehrfach einfügen (vorgeschlagene Namen, angehängte Zahl, einen Namen ändern, die umgebende Instanz umbenennen), Regelwerk mit zwei Regeln, Englisch, enthaltene Instanzen und Regeln in Bausteinen und Formeleditor, „Name doppelt vergeben“ in enthaltenen Instanzen und Regelwerken und für einen Parameter einer Regel, Instanz nur im Ausdruck |
| `layout.spec.ts` | sechs Fenstergrößen mit geöffneter „EMA-Trendfolge“ |
| `features.spec.ts` | Bibliothek mit den Gruppen, Erklärungen, Namen, Parameter, Zeichenfläche mit Ein- und Ausblenden weiterer Verwendungen, Assistent, Befunde, Regeln, Vorlagen, Öffnen und Speichern, Sprache, Einstellungen |
| `assistant.spec.ts` | Auftrag 04: in allen sechs Fenstergrößen nach „Neue Strategie“ die Elementbibliothek über jeden Weg öffnen, bei laufendem Assistenten und nach seinem Verlassen, ein Klick fügt ein Element ein. Der gesamte sichtbare Text, die Beschriftungen für Bildschirmleser und die Erklärungen in Deutsch und Englisch nach „Neue Strategie“ und in jedem Schritt: „geführt“, „Aufbau“ und „guided“ kommen nicht vor, „Assistent“ beziehungsweise „Assistant“ kommt vor. Der Quelltext unter `src/` hat außerhalb von Kommentaren keinen solchen Text |
| `screenshots.spec.ts` | Bildschirmbilder |

Die Aufbautests geben keinen Ausdruck als Text ein. Der Vergleich mit dem Testfall nimmt die Strategie, die im Browser gespeichert wurde, und den mitgelieferten Testfall, ersetzt die internen Kennungen durch Namen und vergleicht Parameter, Elemente, Belegungen, Ausdrücke, Regeln und Verbindungen. Die Lage der Instanzen und das Element der ersten Verwendung gehören nicht zum Vergleich.

## Technik und Abhängigkeiten

React 19 mit TypeScript (`strict`, ohne Emit) und Vite, Versionen wie in der bestehenden Oberfläche. Playwright für die Browsertests. Weitere Abhängigkeiten gibt es nicht; `package-lock.json` legt die Versionen fest.

- **Kein React Flow.** Die Zeichenfläche ist ein eigener Aufbau aus Elementen, Karten und SVG-Linien (`src/Canvas.tsx`, `src/scene.ts`, `src/layout.ts`). Gründe: Ablauf senkrecht und waagerecht, automatische Anordnung mit wenigen Kreuzungen samt Rahmen für die Verwaltung, einklappbare Abschnitte, Instanzen neben beziehungsweise über dem Element ihrer ersten Verwendung und beschriftete Datenverbindungen lassen sich so ohne Umwege zeigen. Für die Umsetzung ist das keine Vorentscheidung.
- **Keine Übersetzungsbibliothek.** Jeder Text steht mit Deutsch und Englisch an der Stelle, an der er erscheint (`L('deutsch', 'english')`). So kann kein Text einer Sprache fehlen. `features.spec.ts` prüft die englische Oberfläche auf deutsche Texte.
- Lizenztext im Dialog „Über pipwerk Studio“: die Datei `LICENSE` des Repositories, beim Bau eingebettet.

## Was simuliert ist

- Es gibt kein Backend, keine Konsistenzprüfung des Backends und keinen Speicher im Objektverzeichnis. Die Prüfung läuft im Browser über das Modell (`src/findings.ts`): Element ohne Verbindung, Auslöser ohne Verbindung, **Instanz ohne Verbindung zum Element ihrer ersten Verwendung**, **Name doppelt vergeben (gemeinsamer Namensraum aller Instanzen, enthaltenen Instanzen, Regeln, Regelwerke und benannten Schritte, außerdem Parameter einer Regel mit dem Namen aus diesem Namensraum)**, **Verwendung auf einem Weg, der die Stelle der ersten Verwendung nicht durchläuft**, Pflichtparameter ohne Wert, fehlerhafter Ausdruck (auch leerer Baustein), Strategieparameter oder Objekt nicht mehr vorhanden, Regel ohne Ausdruck, nicht verwendeter Eingang (Hinweis), kein „Order aufgeben“ erreichbar (Hinweis). Jeder Befund nennt den Weg zur Behebung und springt zur Stelle.
- Ausdrücke werden zerlegt und angezeigt, aber nicht ausgewertet. Der Formeleditor kennt die Funktionen `IF AND OR NOT MIN MAX ABS FLOOR CEILING ISNA IFNA ISBLANK PREVIOUS TRUE FALSE` und Methoden von Objekten.
- Objektverzeichnis und „Dateien verschieben?“ ändern nur die Einstellung und zeigen die Rückfrage.
- **Methoden (angenommen, Fachmodell req-fach-055, offener Punkt):** `EMA` und `ATR` haben die Methode „Wert vor … Kerzen“ mit dem Argument „Anzahl Kerzen“ (Standard 1). Andere Objekttypen haben keine Methode.
- **Aktualisieren (angenommen):** Alle mitgelieferten Objekttypen (`EMA`, `ATR`, `ZigZag`, 1-2-3-Trend, eigener Indikator und Trend) und die Objekte der Anwendung (`Konto`, `Instrument`, `Kerze`, `Tick`) sehen es vor. Eine eigene Vorlage übernimmt es von ihrem Objekttyp; die Vorlagenansicht sagt das.
- Die Wendepunkte des `ZigZag` sind als drei Wendepunkte mit Kurs, Hoch oder Tief und „endgültig“ angenommen. Das legt die Spezifikation vorläufig fest und kennzeichnet es; hier ist es nur eine Annahme für die Darstellung.
- Die Vorlage „Schneller EMA 9“ ist ein erfundenes Beispiel, damit eine eigene Vorlage in der Bibliothek zu sehen ist.
- Die Strategie des Auftraggebers ist aus seiner gesicherten Datei umgesetzt: Name, Beschreibung („emma ist die 2 EMA Strategie“), Strategieparameter mit seinen Werten (`Zeiteinheit` M15, `Stop-Abstand` 0), Elemente, Ausdrücke und Verbindungen. Aus Namen in Programmierschreibweise wurden Namen in Händlersprache: `order_ausgefuehrt` wurde „Order ausgeführt“, `kreuzen_gegen_die_position` „Kreuzen gegen die Position“, `zeiteinheit` „Zeiteinheit“, `stop_abstand` „Stop-Abstand“, `risiko_je_trade` „Risiko je Trade“. Namen ohne Unterstrich (`EMA20`, `StopLoss`, `StopLossVerbessert`) sind unverändert. Die Datei kennt keine Verbindung einer Instanz zu einem Element; die erste Verwendung ergibt sich aus den Ausdrücken: das erste Element im Ablauf, das die Instanz verwendet. Die Lage der Elemente in der Datei entfällt; der Prototyp ordnet selbst an.

## Aufbau der Quellen

| Datei in `src/` | Inhalt |
|---|---|
| `model.ts` | Datenmodell: Strategie, Element, Belegung, Ausdruck, Verwendung, Vorlage |
| `catalog.ts` | Typbeschreibungen (simuliertes Elementregister) mit Eigenschaften, Methoden, Gruppen der Bibliothek, Bezeichnungen und Erklärungen auf Deutsch und Englisch |
| `expr.ts` | Ausdrücke: Zerlegen, Ausgeben, Lesen als Satz, Erkennen der Kreuzung, Methodenaufrufe, Vorschläge |
| `uses.ts` | Verwendungen von Objekten: wer verwendet welchen Wert, Element der ersten Verwendung, Reihenfolge im Ablauf, „jeder Weg läuft über die Stelle der ersten Verwendung“ |
| `scene.ts`, `layout.ts` | Anordnung: Rangfolge, Reihenfolge nach Schwerpunkt, Rahmen, Abschnitte, Instanzen am Element ihrer ersten Verwendung, Datenverbindungen |
| `Canvas.tsx` | Zeichenfläche mit Ziehen, Verbinden, Zoom, Einpassen |
| `Library.tsx`, `Properties.tsx`, `fields.tsx`, `OwnEditor.tsx`, `TemplateView.tsx`, `Wizard.tsx` | Elementbibliothek, Eigenschaftenansicht, Belegung, eigene Objekte, Vorlagenansicht, Assistent |
| `ExprEditor.tsx` | Bausteine und Formeleditor |
| `store.ts`, `findings.ts`, `samples.ts`, `factory.ts` | Zustand und Aktionen, Prüfung, Strategien zum Start, Anlegen von Elementen |
| `names.ts` | Namensraum der Strategie: alle Namen sammeln, doppelte finden, enthaltene Instanzen und Regeln für Ausdrücke bereitstellen, Namen beim Einfügen einer Vorlage vorschlagen |

## Bedienung in Kürze

- **Elemente einfügen:** In der Elementbibliothek klicken (das Element kommt hinter den gewählten Schritt und wird verbunden) oder auf die Fläche ziehen (auf ein Element: dahinter; in einen Rahmen: in diese Verwaltung). Auf Touchgeräten gilt das Klicken. „Verbindung“ in der Gruppe „Ablaufsteuerung“: erst den Schritt wählen, von dem es weitergeht, dann „Verbindung“, dann den Schritt, der folgt.
- **Objekte verwenden (Indikator, Trend, Objekt der Anwendung):** Ein Klick bei gewähltem Element verbindet das Objekt sofort mit diesem Element. Dasselbe gilt, wenn man das Objekt auf ein Element zieht. Fällt es auf freie Fläche, liegt es dort und zeigt den Hinweis „Noch nicht verbunden“, bis man seine Karte auf ein Element zieht oder in seinen Eigenschaften unter „Erste Verwendung“ das Element wählt. Das Element, mit dem man ein Objekt zuerst verbindet, ist die erste Verwendung: Das Objekt liegt dort, bei senkrechtem Ablauf links daneben, bei waagerechtem darüber. Die Verbindung dorthin ist immer sichtbar.
- **Weitere Verwendungen:** Vom Punkt an einer Zeile einer Karte auf ein anderes Element ziehen, oder in den Eigenschaften des Elements unter „Verwendete Werte“ „+ Wert verbinden …“ wählen, oder den Wert in den Bausteinen wählen. Jede weitere Verwendung ist eine Linie zum verwendenden Element.
- **Verwaltung einer Order:** Der Rahmen hängt am Ausgang „gestellt“. Rahmen anklicken, dann Auslöser und Schritte aus der Bibliothek einfügen. Wer ein Element in den Rahmen zieht, macht es zu einem Teil der Verwaltung, wer es herauszieht, nimmt es heraus.
- **Abschnitte:** In den Eigenschaften eines Schritts „Abschnitt“ wählen oder „Neuen Abschnitt bilden“. Auf der Fläche mit dem Pfeil am Titel einklappen.
- **Strategieparameter:** immer sichtbar unter der Kopfzeile; ein Klick auf einen Parameter ändert ihn, „Neu“ legt einen an.
- **Neue Strategie:** startet den Assistenten (Name, Auslöser, Indikatoren, Bedingung, Order). „Ohne Assistent weiterarbeiten“ verlässt ihn jederzeit.
- **Regeln und Regelwerke:** wie bisher in der Eigenschaftenansicht der Strategie oder eines Elements (req-ui-012). Sie haben keine Darstellung auf der Zeichenfläche.

## Entscheidungen zur geänderten Darstellung

### Weitere Verwendungen ein- und ausblenden (Auftrag Punkt 3)

- Die **Verbindung zum Element der ersten Verwendung** ist immer sichtbar, unabhängig vom Umschalter. Sie ist eine durchgezogene, farbige Linie. Die Instanz liegt am Ende dieser Linie.
- Der Umschalter oben auf der Zeichenfläche heißt jetzt **„Weitere Verwendungen: Alle / Auswahl / Aus“**. „Alle“ zeigt jede weitere Verwendung als gestrichelte, farbige Linie. „Auswahl“ zeigt nur die weiteren Verwendungen des gewählten Elements; ist ein Objekt gewählt, alle seine Verwendungen. „Aus“ blendet alle weiteren Verwendungen aus. **Der Prototyp startet mit „Auswahl“**, weil die Strategie des Auftraggebers sonst schon im Ausgangszustand viele Linien quer über die Fläche zeigt. Die Wahl gilt für die Sitzung.
- Ein Name, der **nur im Ausdruck** steht, ist eine Datenverbindung wie jede andere und sieht genauso aus. Die frühere gepunktete Linie für „nur im Ausdruck verwendet“ entfällt. Ist er die erste Verwendung, gilt er als Verbindung zum Element der ersten Verwendung (immer sichtbar, siehe oben). Die erste Verwendung ist dann das **erste Element im Ablauf, das die Instanz verwendet**: Entfernung von den Auslösern, die Verwaltung einer Order nach dem Hauptablauf.
- Hat der Anwender eine Instanz verbunden, gilt sein Element, auch wenn ein Element weiter vorn im Ablauf sie ebenfalls verwendet. Das meldet die Prüfung dann als Verwendung auf einem Weg ohne die Stelle der ersten Verwendung.
- Hängt eine Instanz an einem anderen Objekt (ein Parameter nimmt den Wert eines anderen Objekts), liegt sie neben dessen Karte, eine Spalte weiter außen (waagerecht: eine Reihe weiter oben).
- Elemente in einem eingeklappten Abschnitt oder einer eingeklappten Verwaltung zeigen ihre Instanzen nicht.

### Beschriftung, Ein- und Ausgänge, Bündelung (Auftrag Punkt 4)

- **Beschriftung:** Jede Linie trägt in der Mitte eine Beschriftung mit der übergebenen Eigenschaft oder Methode, zum Beispiel „Wert“ oder „Wert vor 3 Kerzen“. Bei einer Methode stehen die Argumente in der Beschriftung. Verwendet ein Element mehrere Werte desselben Objekts, bleibt es **eine Linie**, und die Beschriftung nennt alle, durch Komma getrennt, in der Reihenfolge der Zeilen der Karte („Wert, Wert vor 3 Kerzen“). Beim Zeigen auf Linie oder Beschriftung erscheint dazu ein Satz mit Objekt, Element und, falls gewählt, „Aktualisieren“.
- **Ausgänge:** Ein Objekt steht als Karte. Jede Zeile ist ein Ausgang mit Namen, Datentyp und einem Punkt am Rand. Methoden stehen kursiv in der Zeile mit „Methode“ statt des Datentyps. Die Karte zeigt nur die **verwendeten** Zeilen (bei einer Methode mit ihren Argumenten); bei einem Objekt ohne Verwendung die ersten drei Eigenschaften. „Alle n anzeigen“ klappt alle Eigenschaften und Methoden auf. Vom Punkt wird auf ein Element gezogen.
- **Eingänge:** Ein Element zeigt einen einzigen Eingangspunkt für Datenverbindungen, sobald mindestens eine Linie dort endet (bei senkrechtem Ablauf links, bei waagerechtem oben). Welche Werte es verwendet, steht in seinen Eigenschaften unter „Verwendete Werte“, und die Bausteine bieten sie als erste Gruppe „Verbundene Werte“ an.
- **Bündelung:** Mehrere Zeilen desselben Objekts, die dasselbe Element verwenden, laufen über kurze Stummel zu einer Linie zusammen (senkrecht). Waagerecht verlässt die Linie die Karte an der Unterkante, ohne Stummel. Eine Linie je Paar aus Objekt und Element, nie je Wert. Mehrere Objekte beim selben Element liegen untereinander (waagerecht nebeneinander) und haben je eine Linie.
- **Grenze:** Bei vielen weiteren Verwendungen kreuzen sich Linien. „Auswahl“ und „Aus“ lösen das; die automatische Anordnung ordnet nur den Ablauf.

### Aktualisieren (Auftrag Punkt 6)

- **Eigenschaftenansicht:** Jedes Element zeigt unter **„Verwendete Werte“** je Verwendung eine Zeile: das Objekt, eine Auswahl der Eigenschaft oder Methode, bei einer Methode ihre Argumente, und, wo der Objekttyp es vorsieht, den Schalter **„Aktualisieren“**. Beim Zeigen auf den Schalter erscheint die Erklärung („Das Objekt ermittelt seine Werte neu, bevor es sie übergibt …“). Die Wahl von Eigenschaft oder Methode ändert auch den Ausdruck des Elements, wenn dort der Wert steht. Eine Verbindung, die der Anwender selbst gemacht hat, lässt sich in der Zeile entfernen; eine Verwendung im Ausdruck verschwindet, wenn man sie im Ausdruck entfernt.
- **Auf der Zeichenfläche erkennbar:** Eine Linie mit Aktualisieren ist **dicker, mit Strich-Punkt-Muster** (die Verbindung zur ersten Verwendung dicker, durchgezogen), ihre Beschriftung beginnt mit **↻** und ist farbig hinterlegt. Die Legende erklärt das. Bündelt eine Linie mehrere Werte, trägt nur der Wert mit Aktualisieren das ↻, die ganze Linie ist dick.
- **Objekttypen:** Alle mitgelieferten Objekttypen und die Objekte der Anwendung sehen es vor (Annahme für den Prototyp). Eine eigene Vorlage übernimmt es von ihrem Objekttyp. Wo ein Typ es nicht vorsähe, fehlte der Schalter in der Zeile.

### Weitere Festlegungen im Prototyp

- **Gruppen der Bibliothek (Punkt 8):** Ablaufsteuerung (Kerzenschluss, Tick, Bedingung, Verbindung), Berechnung (Berechnung, **Strategieparameter ändern**), Indikatoren, Trends, Marktdaten (Instrument, Kerze, Tick), Konto, Aktionen (Order aufgeben, Order ändern, Order löschen, Position ändern, Position schließen), Regeln und Regelwerke. „Strategieparameter ändern“ nennt der Auftrag nicht; der Prototyp ordnet es der Berechnung zu, weil es einen Wert aus einem Ausdruck setzt. „Verbindung“ ist ein Werkzeug, kein Element: Es startet die Verbindung vom gewählten Schritt. Eigene Vorlagen stehen in der Gruppe ihres Objekttyps, markiert als „eigene“.
- **Ausrichtung (Punkt 10):** Der Umschalter „Senkrecht / Waagerecht“ oben links bleibt, die Wahl bleibt im Browser erhalten. Waagerecht läuft der Ablauf von links nach rechts, Eingang links, Ausgänge rechts, Instanzen über dem Element. Die Anordnung richtet die Elemente selbst am Ablauf aus, nicht ihre Karten; das erste Element des Hauptablaufs bleibt beim Hinzufügen von Instanzen an seinem Platz.
- **Prüfung der Verwendung auf dem Weg (Punkt 7):** Jede Verwendung muss auf einem Weg liegen, der die Stelle der ersten Verwendung durchläuft. Für die Verwaltung einer Order gilt der Vorschlag des Projektleiters aus dem Fachmodell: Eine Instanz des Hauptablaufs behält dort den Stand, den sie beim Aufgeben der Order hatte; der Weg der Verwaltung beginnt bei „Order aufgeben“. Eine Instanz der Verwaltung im Hauptablauf, eine Instanz einer anderen Verwaltung oder eine Instanz hinter der Verwendung ist ein Fehler.
- **Umbenennen und Löschen:** Ausdrücke verweisen auf das Objekt, nicht auf seinen Namen. Alle Verwendungen ziehen beim Umbenennen mit. „Entfernen“ fragt zuerst und nennt die Elemente, die Werte des Objekts verwenden, die Instanzen, die bei dem Element liegen (sie sind danach nicht mehr verbunden, sofern kein anderes Element sie verwendet, und die Prüfung meldet das), und bei „Order aufgeben“ die Schritte der Verwaltung. In Ausdrücken bleibt ein leerer Baustein („Wert wählen …“), den die Prüfung meldet. Hat ein entfernter Schritt genau einen Eingang und einen Ausgang, schließt Studio die Lücke im Ablauf. Strategieparameter löschen fragt ebenso.
- **Namen in der Formelansicht:** Namen mit Leerzeichen oder Sonderzeichen stehen in eckigen Klammern (`[EMA 20].Wert`, `Strategie.[Stop-Abstand]`). Methoden stehen mit Argumenten in Klammern: `[EMA 20].[Wert vor](3)`. Eigenschaften stehen mit ihrer Bezeichnung in der gewählten Sprache. Gespeichert wird nur der Verweis.
- **Kreuzung als Baustein:** „A kreuzt B nach oben, nach unten oder in beide Richtungen“ ist ein Baustein und ergibt die Ausdrücke aus den Testfällen (`AND(PREVIOUS(a) <= PREVIOUS(b); a > b)` und die Spiegelung). Beim Lesen eines Ausdrucks erkennt Studio das Muster wieder, auch innerhalb von `AND` und `OR`.
- **Wert „Bedingung“ in Bausteinen:** Ein Wert kann selbst eine Bedingung sein („wenn … dann Bedingung sonst Bedingung“), damit sich die Bedingung „Stop-Loss verbessert“ des Testfalls aus Bausteinen bilden lässt.
- **Neue Ordertypen:** Wählt der Anwender einen anderen Ordertyp, bekommen die neu gebrauchten Eigenschaften ihre Standardwerte (zum Beispiel „bis auf Widerruf“).
- **Mitgelieferte Typen:** `EMA`, `ATR`, `ZigZag` und der 1-2-3-Trend (Markttechnik) lassen sich in der Bibliothek ansehen (Symbol rechts), nicht ändern und nicht löschen. Die Ansicht nennt die Eigenschaften und Methoden und ob der Typ „Aktualisieren“ vorsieht. Ebenso die Vorlage „Risiko je Trade“.

## Entscheidungen zu Auftrag 03

### Namensvorschlag beim Einfügen (Punkt 1)

- Enthält eine Vorlage selbst Instanzen oder Regeln (Trend mit Indikatoren, Indikator mit Regeln, Regelwerk mit Regeln), heißt jede enthaltene Instanz und Regel nach dem Einfügen „<Name der neuen Instanz> <bisheriger Name>“, zum Beispiel „Trend H1 EMA 20“. Ist der Vorschlag im Namensraum der Strategie vergeben, hängt der Prototyp eine Zahl an („Trend H1 EMA 20 2“). Das gilt beim Einfügen aus der Bibliothek und beim Hinzufügen einer Regelvorlage in der Eigenschaftenansicht der Strategie oder eines Elements.
- Die Eigenschaftenansicht der eingefügten Instanz zeigt die enthaltenen Namen im Abschnitt „Enthaltene Indikatoren“ und unter „Liefert“. Jeder Name lässt sich ändern. Bei einem Regelwerk stehen die Namen der Regeln in der Eigenschaftenansicht des Regelwerks. Umbenennen der umgebenden Instanz ändert die enthaltenen Namen nicht.
- Jede enthaltene Instanz und Regel erhält beim Einfügen eine neue Kennung, weil dieselbe Vorlage mehrmals eingefügt werden kann. Die Ausdrücke im Inhalt (Richtung des Trends, eigene Eigenschaften, Ausdrücke der Regeln) verweisen auf die neuen Kennungen.
- Die Vorlagen für den Nachweis liegen in der Bibliothek: **„Trend H1“** (Gruppe Trends, zwei Indikatoren „EMA 20“ und „EMA 50“, die Richtung folgt aus dem Vergleich beider) und **„Order-Check“** (Gruppe Regeln und Regelwerke, zwei Regeln „Mindestvolumen“ und „Stop-Loss gesetzt“). Beide stehen bei jedem Start in der Bibliothek, auch wenn im Browser schon Vorlagen gespeichert sind. Ihre Namen und die Namen darin sind Daten des Anwenders und deshalb in beiden Sprachen gleich; sie enthalten keine Umlaute, damit die Prüfung der englischen Oberfläche auf deutsche Texte sie nicht meldet.

### Gemeinsamer Namensraum (Punkt 2)

- Zum Namensraum zählen alle Instanzen auf der Zeichenfläche, die in einer Instanz enthaltenen Instanzen, alle Regeln und Regelwerke (der Strategie, der Elemente, in Instanzen und in Regelwerken) und die benannten Schritte (Bedingung, Berechnung). Ein Name steht nur einmal darin, ohne Unterscheidung von Groß- und Kleinschreibung. Strategieparameter bleiben ein eigener Namensraum (`Strategie.`).
- **Auswählbar** sind in Bausteinen und Formeleditor die enthaltenen Instanzen („Trend H1 EMA 20 › Wert“, im Formeleditor `[Trend H1 EMA 20].Wert`) und die Regeln, die in einer Instanz oder einem Regelwerk der Strategie enthalten sind („Order-Check Mindestvolumen › Ergebnis“, im Bausteinfeld unter „Regeln in Regelwerken“). Eine Regel liefert die Eigenschaft „Ergebnis“, ein Regelwerk „Gesamtergebnis“ (Annahme für den Prototyp, aus `regel.Ergebnis` der Spezifikation 3.3 abgeleitet). Die Regeln und Regelwerke der Strategie selbst und die Regeln eines Elements stehen nicht in der Auswahl; der Auftrag nennt nur enthaltene Instanzen und Regeln in Regelwerken, und die Spezifikation lässt die Regeln eines Elements nur in den Regeln dieses Elements zu.
- Enthaltene Instanzen haben keine Karte auf der Zeichenfläche und keine Linie: Sie gehören zu der umgebenden Instanz und haben kein eigenes Element der ersten Verwendung (Spezifikation 3.6).
- Die Prüfung meldet „Name doppelt vergeben“ für jeden Namen, der im Namensraum schon vorkommt, auch in enthaltenen Instanzen und Regelwerken. Der Befund nennt, wo der Name steht („enthalten in …“) und springt zur Instanz. Ebenso, wenn der Parameter einer Regel so heißt wie ein Name im Namensraum. Nicht umgesetzt, weil der Auftrag es nicht nennt: Namen unter den Strategieparametern und Parameter einer Vorlage.
- Die Ausdrücke im Inhalt einer Instanz (Spezifikation 3.3, zweiter Absatz) sind nicht auf den eigenen Inhalt beschränkt; das ist nicht Teil des Auftrags.

### Verwendung nur im Ausdruck (Punkt 3)

Der Prototyp setzte das schon um, es war nichts anzupassen. Eine Instanz, die nur im Ausdruck verwendet wird (zum Beispiel im Formeleditor eingetippt), hat kein Element, das der Anwender verbunden hat. Sie liegt dann beim ersten Element in der Reihenfolge des Ablaufs, das sie verwendet (`placements` in `src/uses.ts`), auch wenn nur ein späteres Element sie verwendet. „Instanz ohne Verbindung“ meldet die Prüfung nur, wenn gar kein Element sie verwendet. Der Test in `names.spec.ts` belegt es mit einer freien Instanz, die erst der zweiten Bedingung, dann auch der ersten im Ausdruck genannt wird.

## Entscheidungen zu Auftrag 04

### Elementbibliothek nach „Neue Strategie“ (Punkt 1)

- Die Beschriftung „Elementbibliothek zeigen“ gab es im Quelltext nicht. Im Ausgangscommit erreichte der Anwender die Bibliothek nach „Neue Strategie“ nur über den Reiter „Bibliothek“ (Leiste unten bis 699 Pixel Breite, Reiter über der Seitenleiste von 700 bis 1099 Pixel); ab 1100 Pixel steht sie dauerhaft neben der Fläche. Diese Reiter und der Klick auf ein Element funktionierten in allen sechs Größen (Test `assistant.spec.ts`). Eine Schaltfläche ohne Funktion ließ sich nicht nachstellen.
- Gefunden wurde der Mangel dahinter: Der Assistent und der Hinweis der leeren Zeichenfläche (nach Verlassen des Assistenten) nannten die Elementbibliothek, boten aber keine Schaltfläche dorthin. Bis 1099 Pixel, wo die Bibliothek verdeckt ist, muss der Anwender den Reiter selbst finden.
- Behebung: In diesen Größen zeigen der Assistent (oben neben „Ohne Assistent weiterarbeiten“, `wz-library`) und die leere Zeichenfläche (`empty-library`) die Schaltfläche „Elementbibliothek zeigen“. Sie öffnet die Bibliothek; der Assistent bleibt erhalten und ist über den Reiter „Eigenschaften“ wieder erreichbar. Ab 1100 Pixel ist die Bibliothek immer sichtbar, die Schaltfläche entfällt.

### Name „Assistent“ (Punkt 2, req-ui-016)

„Geführter Aufbau“ und gleichbedeutende Wendungen sind aus allen Texten entfernt: Erklärung des Menüpunkts „Neue Strategie“, Hinweis der leeren Eigenschaftenansicht, Hinweis der Zeichenfläche ohne Strategie, Hinweis der leeren Zeichenfläche, Meldung am Ende („Der Assistent ist fertig …“). Das Bildschirmbild heißt `assistent-1366x768.png`.

### Übrige Schaltflächen (Punkt 3)

Alle Schaltflächen nach „Neue Strategie“, nach Verlassen des Assistenten und in seinen Schritten 1 bis 4 wurden in 390 × 844 durchgeklickt (Schritt 5 und die übrigen Größen nicht Schaltfläche für Schaltfläche): Keine war ohne Funktion (die Statusanzeige der Strategie und der gerade gewählte Reiter ändern nichts, weil sie schon im gezeigten Zustand sind). Die übrigen Größen deckt `assistant.spec.ts` für Bibliothek und Assistent ab.

## Zuordnung zu den Mängeln der Abnahme

| Mangel | Wo im Prototyp |
|---|---|
| wp02 Versuch 2, M2 Bereich „Objekte und ihre Werte“ | Der Bereich entfällt. Instanzen liegen beim Element ihrer ersten Verwendung und sind mit ihm verbunden |
| M2 Fenstergröße (order-01) | drei Anordnungen (nebeneinander, Seitenbereich mit Reitern, ein Bereich nacheinander), Test in sechs Größen |
| M3 Ansicht springt | Ansicht ändert sich nur beim Öffnen und auf Wunsch; ein neues Element außerhalb der Ansicht wird nur so weit sichtbar gemacht, wie nötig; Elemente liegen nie im fremden Rahmen |
| M4 Sprache | alle Texte zweisprachig, auch Befunde und mitgelieferte Vorlagen |
| M5 Belegung | Beschriftung „Belegung“, Option „Strategieparameter“, Hinweis und Anlegen an Ort und Stelle |
| M6 Trend | Zeiteinheit, Berechnungsverfahren und Ausdruck für „Richtung“ in Bausteinen |
| M7 Eigenschaften | Abschnitt „Liefert“ mit Datentyp, möglichen Werten und Methoden, Karte mit Zeilen |
| M8, M9 Bibliothek | Gruppen nach Aufgabe (req-ui-018), ZigZag, 1-2-3-Trend (Markttechnik) bei den Trends |
| M10 Erscheinungsbild | einheitliche Farben, Abstände, Schrift, Symbole, gestaltete Steuerelemente |
| M11 Datenverbindungen | Karten mit Zeilen, beschriftete Linien, Linie der ersten Verwendung immer sichtbar |
| M12 Strategieparameter | dauerhaft sichtbarer Streifen unter der Kopfzeile, Auswahl überall |
| M13 Bedienerführung | Erklärungen beim Zeigen, leere Zustände, Assistent, Befunde mit Weg zur Behebung |
| M14 Namen | ein frei wählbarer Name, keine Kennungen sichtbar |
| M15 Vorschläge | nach `Objekt.` auch für benannte Bedingungen, Berechnungen und Methoden |
| M16 Bedingungen | Bausteine, Satz, Formelansicht mit Editor |
| M17 Zeichenfläche | senkrechter und waagerechter Ablauf, Instanzen am Element, Abschnitte, Rahmen für die Verwaltung |

## Grenzen

- Das Ziehen aus der Bibliothek auf die Fläche arbeitet mit dem Ziehen des Browsers und geht auf Touchgeräten nicht; dort gilt das Klicken. Eingabe per Touch ist nicht geprüft.
- Die Erklärungen erscheinen beim Zeigen mit der Maus und beim Fokussieren mit der Tastatur.
- Die automatische Anordnung ist ein einfaches Verfahren (Rangfolge und Reihenfolge nach Schwerpunkt). Sie ordnet die Testfälle und die Strategie des Auftraggebers ohne Überdeckung an; bei sehr verzweigten Abläufen sind Kreuzungen möglich. Viele Instanzen an einem Element machen den Ablauf an dieser Stelle breit (waagerecht) oder hoch (senkrecht).
- Methoden und „Aktualisieren“ sind für den Prototyp angenommen; welche Methoden und Typen es in der Umsetzung gibt, legt das Fachmodell fest.
