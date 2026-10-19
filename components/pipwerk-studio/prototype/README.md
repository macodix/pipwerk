# Prototyp pipwerk Studio

Klickbarer Prototyp der gesamten Oberfläche von pipwerk Studio mit simulierten Daten. Er zeigt Bedienung und Erscheinungsbild, rechnet nichts und braucht kein Backend. Auftrag: `development/strategiedesign/prototype/order-01.md`. Zweig `strategiedesign/proto-studio` (Prototypzweig, wird nicht übernommen). Der Auftraggeber bestätigt den Prototyp, bevor die Oberfläche spezifiziert und umgesetzt wird.

## Bau und Start

Voraussetzung: Node.js 24 oder neuer.

```sh
npm install
npm run build        # Typprüfung (strict), Vite-Bau, dann eine einzige HTML-Datei
```

Ergebnis: `dist/pipwerk-studio-prototyp.html`. Die Datei enthält alle Skripte und Stile. Sie läuft ohne Server und ohne Internetverbindung durch Öffnen im Browser (`file://`). Zum Entwickeln: `npm run dev`.

Gespeichertes (Strategien, Vorlagen, Einstellungen) liegt im lokalen Speicher des Browsers. Bei jedem Start öffnet sich die Strategie „EMA-Trendfolge“ des Auftraggebers, und die beiden Testfälle `str-01` und `str-03` sowie die Strategie des Auftraggebers stehen in „Öffnen“, auch wenn sie vorher gelöscht wurden. Der Prototyp lässt sich nur im Browser zurücksetzen, indem man die Daten der Seite löscht.

## Prüfungen

```sh
npm run e2e                                              # Playwright, Chromium: Aufbau von str-03 und str-01, Fenstergrößen, Funktionen, Start
npm run e2e -- --project=firefox --project=webkit        # Start ohne Fehler in der Konsole in Firefox und WebKit
npm run screenshots                                      # erzeugt die Bilder unter screenshots/
```

Die Tests öffnen die gebaute Datei über `file://`, also erst `npm run build`. Fehlen die Browser: `npx playwright install chromium firefox webkit`.

| Datei in `e2e/` | Inhalt |
|---|---|
| `smoke.spec.ts` | gebaute Datei öffnet sich über `file://` ohne Fehler in der Konsole (Chromium, Firefox, WebKit) |
| `build-str03.spec.ts` | `str-03` aus der leeren Zeichenfläche nur über die Bedienung (Auslöser, drei Indikatoren, Kreuzungsbedingung aus Bausteinen, Berechnungen, „Order aufgeben“, Verwaltung), danach Vergleich mit dem Testfall |
| `build-str01.spec.ts` | Hauptablauf und Verwaltung von `str-01` ebenso |
| `layout.spec.ts` | sechs Fenstergrößen mit geöffneter „EMA-Trendfolge“ |
| `features.spec.ts` | Bibliothek, Erklärungen, Namen, Parameter, Zeichenfläche, Assistent, Befunde, Regeln, Vorlagen, Öffnen und Speichern, Sprache, Einstellungen |
| `screenshots.spec.ts` | Bildschirmbilder |

Die Aufbautests geben keinen Ausdruck als Text ein. Der Vergleich mit dem Testfall nimmt die Strategie, die im Browser gespeichert wurde, und den mitgelieferten Testfall, ersetzt die internen Kennungen durch Namen und vergleicht Parameter, Elemente, Belegungen, Ausdrücke, Regeln und Verbindungen.

## Technik und Abhängigkeiten

React 19 mit TypeScript (`strict`, ohne Emit) und Vite, Versionen wie in der bestehenden Oberfläche. Playwright für die Browsertests. Weitere Abhängigkeiten gibt es nicht; `package-lock.json` legt die Versionen fest.

- **Kein React Flow.** Die Zeichenfläche ist ein eigener Aufbau aus Elementen und SVG-Linien (`src/Canvas.tsx`, `src/scene.ts`, `src/layout.ts`). Gründe: Ablauf senkrecht und waagerecht, automatische Anordnung mit wenigen Kreuzungen samt Rahmen für die Verwaltung, einklappbare Abschnitte, ein eigener Bereich für Objekte und gebündelte Werte-Linien lassen sich so ohne Umwege zeigen. Für die Umsetzung ist das keine Vorentscheidung.
- **Keine Übersetzungsbibliothek.** Jeder Text steht mit Deutsch und Englisch an der Stelle, an der er erscheint (`L('deutsch', 'english')`). So kann kein Text einer Sprache fehlen. `features.spec.ts` prüft die englische Oberfläche auf deutsche Texte.
- Lizenztext im Dialog „Über pipwerk Studio“: die Datei `LICENSE` des Repositories, beim Bau eingebettet.

## Was simuliert ist

- Es gibt kein Backend, keine Konsistenzprüfung des Backends und keinen Speicher im Objektverzeichnis. Die Prüfung läuft im Browser über das Modell (`src/findings.ts`): Element ohne Verbindung, Auslöser ohne Verbindung, Pflichtparameter ohne Wert, fehlerhafter Ausdruck (auch leerer Baustein), Strategieparameter oder Objekt nicht mehr vorhanden, doppelter Name, Regel ohne Ausdruck, nicht verwendeter Eingang (Hinweis), kein „Order aufgeben“ erreichbar (Hinweis).
- Ausdrücke werden zerlegt und angezeigt, aber nicht ausgewertet. Der Formeleditor kennt die Funktionen `IF AND OR NOT MIN MAX ABS FLOOR CEILING ISNA IFNA ISBLANK PREVIOUS TRUE FALSE`.
- Objektverzeichnis und „Dateien verschieben?“ ändern nur die Einstellung und zeigen die Rückfrage.
- Die Wendepunkte des `ZigZag` sind als drei Wendepunkte mit Kurs, Hoch oder Tief und „endgültig“ angenommen. Das legt die Spezifikation vorläufig fest und kennzeichnet es; hier ist es nur eine Annahme für die Darstellung.
- Die Vorlage „Schneller EMA 9“ ist ein erfundenes Beispiel, damit eine eigene Vorlage in der Bibliothek zu sehen ist.
- Die Strategie des Auftraggebers ist aus seiner gesicherten Datei umgesetzt: Name, Beschreibung („emma ist die 2 EMA Strategie“), Strategieparameter mit seinen Werten (`Zeiteinheit` M15, `Stop-Abstand` 0), Elemente, Ausdrücke und Verbindungen. Aus Namen in Programmierschreibweise wurden Namen in Händlersprache: `order_ausgefuehrt` wurde „Order ausgeführt“, `kreuzen_gegen_die_position` „Kreuzen gegen die Position“, `zeiteinheit` „Zeiteinheit“, `stop_abstand` „Stop-Abstand“, `risiko_je_trade` „Risiko je Trade“. Namen ohne Unterstrich (`EMA20`, `StopLoss`, `StopLossVerbessert`) sind unverändert. Die Lage der Elemente in der Datei entfällt; der Prototyp ordnet selbst an.

## Aufbau der Quellen

| Datei in `src/` | Inhalt |
|---|---|
| `model.ts` | Datenmodell: Strategie, Element, Belegung, Ausdruck, Vorlage |
| `catalog.ts` | Typbeschreibungen (simuliertes Elementregister), Bezeichnungen und Erklärungen auf Deutsch und Englisch |
| `expr.ts` | Ausdrücke: Zerlegen, Ausgeben, Lesen als Satz, Erkennen der Kreuzung, Vorschläge |
| `scene.ts`, `layout.ts` | Anordnung: Rangfolge, Reihenfolge nach Schwerpunkt, Rahmen, Abschnitte, Bereich für Objekte, Werte-Linien |
| `Canvas.tsx` | Zeichenfläche mit Ziehen, Verbinden, Zoom, Einpassen |
| `Library.tsx`, `Properties.tsx`, `fields.tsx`, `OwnEditor.tsx`, `TemplateView.tsx`, `Wizard.tsx` | Elementbibliothek, Eigenschaftenansicht, Belegung, eigene Objekte, Vorlagenansicht, geführter Aufbau |
| `ExprEditor.tsx` | Bausteine und Formeleditor |
| `store.ts`, `findings.ts`, `samples.ts`, `factory.ts` | Zustand und Aktionen, Prüfung, Strategien zum Start, Anlegen von Elementen |

## Bedienung in Kürze

- **Elemente einfügen:** In der Elementbibliothek klicken (das Element kommt hinter den gewählten Schritt und wird verbunden) oder auf die Fläche ziehen (auf ein Element: dahinter; in einen Rahmen: in diese Verwaltung). Auf Touchgeräten gilt das Klicken.
- **Verbinden:** Vom unteren Anschluss eines Schritts auf den nächsten ziehen, oder den Anschluss anklicken und dann den nächsten Schritt. Eine gewählte Linie lässt sich mit dem Kreuz löschen.
- **Werte verbinden:** Vom Punkt an einer Eigenschaft eines Objekts auf ein Element ziehen. Oder in den Bausteinen den Wert aus der Liste wählen; dabei entsteht der Eingang von selbst.
- **Verwaltung einer Order:** Der Rahmen hängt am Ausgang „gestellt“. Rahmen anklicken, dann Auslöser und Schritte aus der Bibliothek einfügen. Wer ein Element in den Rahmen zieht, macht es zu einem Teil der Verwaltung, wer es herauszieht, nimmt es heraus.
- **Abschnitte:** In den Eigenschaften eines Schritts „Abschnitt“ wählen oder „Neuen Abschnitt bilden“. Auf der Fläche mit dem Pfeil am Titel einklappen.
- **Strategieparameter:** immer sichtbar unter der Kopfzeile; ein Klick auf einen Parameter ändert ihn, „Neu“ legt einen an.
- **Neue Strategie:** startet den Assistenten (Name, Auslöser, Indikatoren, Bedingung, Order). „Ohne Assistent weiterarbeiten“ verlässt ihn jederzeit.

## Entscheidungen zu den offenen Punkten

### Ausrichtung umschaltbar (req-ui-017)

Der Prototyp zeigt den Umschalter „Senkrecht / Waagerecht“ oben links auf der Zeichenfläche. Senkrecht ist der Standard. Waagerecht läuft der Ablauf von links nach rechts: Eingang links, Ausgänge rechts, der Bereich für Objekte liegt dann oberhalb des Ablaufs statt links davon. Die Wahl bleibt im Browser erhalten. Empfehlung: umschaltbar lassen. Der Aufwand ist gering, die Anordnung ist in beiden Richtungen dieselbe, und waagerecht nutzt breite Bildschirme besser aus. Die Entscheidung trifft der Auftraggeber.

### Darstellung der Ein- und Ausgänge (req-ui-014)

- **Ausgänge:** Ein Objekt steht als Karte im Bereich „Objekte und ihre Werte“. Jede Eigenschaft ist eine Zeile mit Namen, Datentyp und einem Anschlusspunkt am Rand. Sichtbar sind die verwendeten Eigenschaften, bei einem Objekt ohne Verwendung die ersten drei. „Alle n Eigenschaften“ klappt die übrigen auf. Der Anwender zieht vom Punkt auf ein Element.
- **Eingänge:** Ein Element zeigt an der Seite zum Bereich für Objekte einen einzigen Eingangspunkt, sobald mindestens eine Linie dort endet (bei senkrechtem Ablauf links, bei waagerechtem oben). Die einzelnen Eingänge nennt die Eigenschaftenansicht unter „Eingänge“ (zum Beispiel „EMA20 › Wert“), und die Bausteine bieten sie als erste Gruppe „Verbundene Werte“ an. Ein Eingang entsteht durch Ziehen, durch „+ Wert verbinden“ oder dadurch, dass der Anwender den Wert in den Bausteinen wählt. Ein Parameter eines anderen Objekts wird mit der Belegungsart „Wert eines Objekts“ verbunden; die Linie führt dann von Karte zu Karte.
- **Linienarten:** Ablauf: durchgezogen, dunkelgrau, mit Pfeil. Verwaltung: grün gepunktet. Wert: farbig gestrichelt, eine Farbe je Objekt. Ein Name, der nur im Ausdruck steht, erscheint als blassere, gepunktete Wertlinie (M11); die Legende unten links erklärt die Linien.

### Bündelung vieler Ausgänge

1. Mehrere Eigenschaften desselben Objekts, die dasselbe Element verwenden, ergeben eine Linie. Am Objekt laufen die Anschlüsse der Zeilen über kurze Stummel zusammen, in der Mitte der Linie steht die Zahl der Werte.
2. „Alle / Auswahl / Aus“ oben auf der Zeichenfläche: bei „Auswahl“ zeigt die Fläche nur die Linien des gewählten Elements; sonst sind alle Linien da, und die Linien des gewählten Elements sind kräftig, die übrigen blass.
3. Eine Karte zeigt nur die verwendeten Zeilen. Die übrigen, unbenutzten Eigenschaften und ihre Anschlusspunkte erscheinen erst nach dem Aufklappen.

Grenze: Bei sehr vielen Werten kreuzen sich Wertlinien, weil die Anordnung nur den Ablauf nach wenigen Kreuzungen ordnet; die Karten sortiert sie nach der Lage ihrer ersten Verwendung.

### Umbenennen und Löschen eines verbundenen Objekts

- **Umbenennen:** Ausdrücke verweisen auf das Objekt, nicht auf seinen Namen. Alle Verwendungen ziehen mit: Satz, Formel, Eingänge und Karten zeigen sofort den neuen Namen. Es gibt keine Rückfrage und keinen Fehler. Ein Name, den schon ein anderes Objekt oder ein benannter Schritt trägt, ist ein Befund der Prüfung.
- **Löschen:** „Entfernen“ fragt zuerst. Die Rückfrage nennt die Elemente, die Werte des Objekts verwenden, und bei „Order aufgeben“ die Schritte der Verwaltung, die mit entfernt werden. Nach „Trotzdem entfernen“ sind die Linien und Eingänge weg. In Ausdrücken bleibt an der Stelle ein leerer Baustein („Wert wählen …“), eine Belegung „Wert eines Objekts“ wird „nicht belegt“. Die Prüfung meldet das als fehlerhaften Ausdruck mit dem Hinweis, einen anderen Wert zu wählen, und führt per Klick zur Stelle. Hat ein entfernter Schritt genau einen Eingang und einen Ausgang, schließt Studio die Lücke im Ablauf.
- **Strategieparameter löschen:** ebenso mit Rückfrage und Liste der Elemente, die ihn verwenden.

### Weitere Festlegungen im Prototyp

- **Namen in der Formelansicht:** Namen mit Leerzeichen oder Sonderzeichen stehen in eckigen Klammern (`[EMA 20].Wert`, `Strategie.[Stop-Abstand]`). Eigenschaften stehen mit ihrer Bezeichnung in der gewählten Sprache. Gespeichert wird nur der Verweis.
- **Kreuzung als Baustein:** „A kreuzt B nach oben, nach unten oder in beide Richtungen“ ist ein Baustein und ergibt die Ausdrücke aus den Testfällen (`AND(PREVIOUS(a) <= PREVIOUS(b); a > b)` und die Spiegelung). Beim Lesen eines Ausdrucks erkennt Studio das Muster wieder, auch innerhalb von `AND` und `OR`.
- **Wert „Bedingung“ in Bausteinen:** Ein Wert kann selbst eine Bedingung sein („wenn … dann Bedingung sonst Bedingung“), damit sich die Bedingung „Stop-Loss verbessert“ des Testfalls aus Bausteinen bilden lässt.
- **Neue Ordertypen:** Wählt der Anwender einen anderen Ordertyp, bekommen die neu gebrauchten Eigenschaften ihre Standardwerte (zum Beispiel „bis auf Widerruf“).
- **Mitgelieferte Typen:** `EMA`, `ATR`, `ZigZag` und der 1-2-3-Trend (Markttechnik) lassen sich in der Bibliothek ansehen (Symbol rechts), nicht ändern und nicht löschen. Ebenso die Vorlage „Risiko je Trade“.

## Zuordnung zu den Mängeln der Abnahme

| Mangel | Wo im Prototyp |
|---|---|
| M2 Fenstergröße | drei Anordnungen (nebeneinander, Seitenbereich mit Reitern, ein Bereich nacheinander), Test in sechs Größen |
| M3 Ansicht springt | Ansicht ändert sich nur beim Öffnen und auf Wunsch; ein neues Element außerhalb der Ansicht wird nur so weit sichtbar gemacht, wie nötig; Elemente liegen nie im fremden Rahmen |
| M4 Sprache | alle Texte zweisprachig, auch Befunde und mitgelieferte Vorlagen |
| M5 Belegung | Beschriftung „Belegung“, Option „Strategieparameter“, Hinweis und Anlegen an Ort und Stelle |
| M6 Trend | Zeiteinheit, Berechnungsverfahren und Ausdruck für „Richtung“ in Bausteinen |
| M7 Eigenschaften | Abschnitt „Liefert“ mit Datentyp und möglichen Werten, Karte mit Zeilen |
| M8, M9 Bibliothek | Gruppen und Inhalte wie festgelegt, ZigZag, 1-2-3-Trend (Markttechnik) bei den Trends |
| M10 Erscheinungsbild | einheitliche Farben, Abstände, Schrift, Symbole, gestaltete Steuerelemente |
| M11 Datenverbindungen | Karten mit Zeilen, Linien, gepunktete Linie für Namen im Ausdruck |
| M12 Strategieparameter | dauerhaft sichtbarer Streifen unter der Kopfzeile, Auswahl überall |
| M13 Bedienerführung | Erklärungen beim Zeigen, leere Zustände, Assistent, Befunde mit Weg zur Behebung |
| M14 Namen | ein frei wählbarer Name, keine Kennungen sichtbar |
| M15 Vorschläge | nach `Objekt.` auch für benannte Bedingungen und Berechnungen |
| M16 Bedingungen | Bausteine, Satz, Formelansicht mit Editor |
| M17 Zeichenfläche | senkrechter Ablauf, Bereich für Objekte, Abschnitte, Rahmen für die Verwaltung |

## Grenzen

- Das Ziehen aus der Bibliothek auf die Fläche arbeitet mit dem Ziehen des Browsers und geht auf Touchgeräten nicht; dort gilt das Klicken. Eingabe per Touch ist nicht geprüft.
- Die Erklärungen erscheinen beim Zeigen mit der Maus und beim Fokussieren mit der Tastatur.
- Die automatische Anordnung ist ein einfaches Verfahren (Rangfolge und Reihenfolge nach Schwerpunkt). Sie ordnet die Testfälle und die Strategie des Auftraggebers ohne Überdeckung an; bei sehr verzweigten Abläufen sind Kreuzungen möglich.
