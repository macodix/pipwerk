# Auftrag Prototyp pipwerk Studio, geänderte Darstellung

- Vorhaben: `strategiedesign`, Phase 2 Konzeption
- zuständig: Entwickler Oberfläche
- Zweig: `strategiedesign/proto-studio`, Prototyp, wird nicht übernommen
- Ausgangscommit: `dce2b7b1939a91bdd56802812e36cb900c6b4558` (Ergebnis von [order-01.md](order-01.md))
- Stand: 2026-10-23

## Ziel

Der bestehende Prototyp zeigt die Darstellung, die der Auftraggeber am 22. Oktober 2026 neu festgelegt hat. Der Auftraggeber bestätigt sie, bevor die Spezifikation der Oberfläche angepasst wird (`docs/technical/entwicklungsverfahren.md`, Phase 2, Schritt 2). Alles, was dieser Auftrag nicht nennt, bleibt wie im Ausgangscommit.

## Grundlagen

- `development/strategiedesign/wp02/acceptance/2.md`, Abschnitt „Geänderte Anforderungen“ und Mangel M2. Lies ihn vollständig.
- `docs/design/domain/fachmodell.md`, req-fach-055 mit den offenen Punkten
- `docs/design/requirements/anforderungen-strategiedesigner.md`: req-ui-012, req-ui-014, req-ui-017, req-ui-018, req-ablauf-003, req-ablauf-007
- Glossar `docs/technical/glossar.md`: Datenverbindung, Methode, Aktualisieren, Namensraum, Typbeschreibung
- `components/pipwerk-studio/prototype/README.md` im Ausgangscommit

## Umfang

1. **Objekte beim Element ihrer ersten Verwendung** (req-ui-017, req-fach-055, Mangel M2). Den Bereich „Objekte und ihre Werte“ gibt es nicht mehr. Jede Instanz eines Indikators, eines Trends oder eines Objekts der Anwendung liegt bei dem Element, das sie zuerst verwendet, und ist mit ihm verbunden: bei senkrechtem Ablauf daneben, bei waagerechtem darüber oder darunter. Die automatische Anordnung berücksichtigt das. Erste Verwendung ist das Element, mit dem der Anwender die Instanz zuerst verbunden hat. Diese Verbindung ist immer sichtbar.
2. **Verwenden** (req-ablauf-003). Ein Objekt, das auf ein Element gezogen oder bei gewähltem Element in der Bibliothek angeklickt wird, ist sofort mit diesem Element verbunden. Ein Objekt, das auf freie Fläche fällt, liegt dort, bis der Anwender es mit einem Element verbindet; bis dahin zeigt es einen Hinweis, dass es noch verbunden werden muss.
3. **Weitere Verwendungen** (req-ui-014, req-ui-017). Jede weitere Verwendung ist eine Datenverbindung zum verwendenden Element. Weitere Verwendungen lassen sich ein- und ausblenden; der bestehende Umschalter „Alle / Auswahl / Aus“ darf dafür angepasst werden. Ein Name, der nur im Ausdruck steht, erscheint ebenfalls als Datenverbindung. Ist er die erste Verwendung, gilt er als Verbindung zum Element der ersten Verwendung.
4. **Beschriftung der Datenverbindung** (req-ui-014). Jede Linie nennt die übergebene Eigenschaft oder Methode, bei einer Methode mit ihren Argumenten, zum Beispiel „Wert“ oder „Wert vor 1 Kerze“. Verwendet ein Element mehrere Werte desselben Objekts, nennt die Beschriftung alle. Darstellung der Ein- und Ausgänge und Bündelung entscheidest du neu und beschreibst sie im README.
5. **Methoden** (req-fach-055). Für den Prototyp angenommen: `EMA` und `ATR` haben die Methode „Wert vor … Kerzen“ mit dem Argument Anzahl Kerzen. Methoden erscheinen in den Bausteinen, im Formeleditor nach `Objekt.` und in der Typbeschreibung neben den Eigenschaften, gekennzeichnet als Methode.
6. **Aktualisieren** (req-ui-014, req-fach-055). In der Eigenschaftenansicht wählt der Anwender bei jeder Verwendung die Eigenschaft oder Methode und, wo der Objekttyp es vorsieht, den Schalter „Aktualisieren“ mit Erklärung beim Zeigen. Für den Prototyp angenommen: alle mitgelieferten Objekttypen und die Objekte der Anwendung sehen das Aktualisieren vor; eine eigene Vorlage übernimmt es von ihrem Objekttyp. Eine Linie mit Aktualisieren ist auf der Zeichenfläche erkennbar.
7. **Gemeinsamer Namensraum** (req-fach-055, req-ablauf-007). Die simulierte Prüfung meldet zusätzlich mit Weg zur Behebung und Sprung zur Stelle: Instanz ohne Verbindung zum Element ihrer ersten Verwendung (Fehler); Name einer Instanz, der in der Strategie mehr als einmal vergeben ist (Fehler); Verwendung auf einem Weg, der die Stelle der ersten Verwendung nicht durchläuft (Fehler, Vorschlag des Projektleiters in req-fach-055).
8. **Gruppen der Elementbibliothek** (req-ui-018). Reihenfolge und Inhalt: Ablaufsteuerung (Auslöser, Bedingung, Verbindung), Berechnung, Indikatoren, Trends, Marktdaten (`Instrument`, `Kerze`, `Tick`), Konto, Aktionen (Order aufgeben, Order ändern, Order löschen, Position ändern, Position schließen), Regeln und Regelwerke. Sichtbare Namen nach dem Vorschlag des Projektleiters: für die Objekte die fachlichen Gruppennamen ohne gemeinsamen Oberbegriff. Eigene Vorlagen stehen in der Gruppe ihres Objekttyps.
9. **Regeln** (req-ui-012). Bleiben in der Eigenschaftenansicht wie im Ausgangscommit. Keine Darstellung auf der Zeichenfläche.
10. **Ausrichtung umschaltbar** (req-ui-017). Der Umschalter bleibt. In beiden Richtungen gilt Punkt 1.
11. **Strategien zum Start.** „EMA-Trendfolge“ des Auftraggebers, `str-01` und `str-03` öffnen sich in der neuen Darstellung. Jede Instanz liegt beim Element ihrer ersten Verwendung. Die Strategie des Auftraggebers ist dabei ohne Befund „Instanz ohne Verbindung“, wenn sich eine erste Verwendung aus ihren Ausdrücken ergibt.
12. Fenstergrößen wie in `order-01.md`, Punkt 15. Alle Texte in Deutsch und Englisch.

## Nicht-Umfang

- Alles außerhalb von Punkt 1 bis 12, insbesondere Backend, Anwenderdokumentation, Darstellung von Regeln auf der Zeichenfläche
- Mangel M1 aus `acceptance/2.md` betrifft die Umsetzung, nicht den Prototyp

## Technische Abnahmekriterien

1. Die gebaute Datei öffnet sich in Chromium, Firefox und WebKit über `file://` ohne Fehler in der Konsole.
2. Die Browsertests bauen `str-03` und Hauptablauf und Verwaltung von `str-01` aus der leeren Zeichenfläche nur über die Bedienung auf, einschließlich Verbinden jeder Instanz mit dem Element ihrer ersten Verwendung. Kein Schritt gibt einen Ausdruck als Text ein.
3. Ein Browsertest prüft für die drei Strategien zum Start: Jede Instanz liegt neben (senkrecht) beziehungsweise über oder unter (waagerecht) dem Element ihrer ersten Verwendung und ist mit ihm verbunden; kein Bereich „Objekte und ihre Werte“.
4. Browsertests prüfen: Beschriftung mit Eigenschaft und Methode, Schalter „Aktualisieren“, Ein- und Ausblenden weiterer Verwendungen, die drei neuen Befunde aus Punkt 7, die Gruppen der Bibliothek.
5. Der Test der sechs Fenstergrößen aus `order-01.md` besteht weiterhin.
6. Bildschirmbilder neu erzeugt, dazu je ein Bild in 1366 × 768: „EMA-Trendfolge“ senkrecht und waagerecht, Eigenschaftenansicht einer Verwendung mit Methode und „Aktualisieren“, Elementbibliothek mit den Gruppen.
7. README beschreibt die Entscheidungen zu Punkt 3, 4 und 6, ersetzt veraltete Abschnitte und enthält keine Pfade des Entwicklungsrechners und keine Zugangsdaten.
8. Die gebaute Datei liegt unter `components/pipwerk-studio/prototype/dist/pipwerk-studio-prototyp.html`.

## Ergebnis

Ein benannter Commit auf `strategiedesign/proto-studio` auf GitHub. Nenne ihn vollständig, dazu die erfüllten und nicht erfüllten Abnahmekriterien mit Nachweis und deine Entscheidungen.
