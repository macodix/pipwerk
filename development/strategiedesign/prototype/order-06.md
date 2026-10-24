# Auftrag Prototyp pipwerk Studio, Objekte beim Element ihrer ersten Verwendung, Beschreibung der Eigenschaften und Methoden

- Vorhaben: `strategiedesign`, Phase 2 Konzeption
- zuständig: Entwickler Oberfläche
- Zweig: `strategiedesign/proto-studio`, Prototyp, wird nicht übernommen
- Ausgangscommit: `675cbbabe62ea77c78accd9b0f9ff45fb373c341`, dazu das Ergebnis von [order-05.md](order-05.md)
- Stand: 2026-10-23

## Ziel

Der Prototyp behebt die weiteren Einwände des Auftraggebers aus seinem Test (`development/strategiedesign/questions/strategiedesign-03.md`, Abschnitt „Antwort“, Nachtrag Punkte 2 und 3). Alles, was dieser Auftrag und `order-05.md` nicht nennen, bleibt wie im Ausgangscommit.

## Vorher: Auftrag 05 abschließen

Die Arbeit an `order-05.md` wurde unterbrochen. Im Arbeitsverzeichnis des Entwicklers liegen ihre Änderungen, nicht committet, auf dem Ausgangscommit. Prüfe sie gegen `order-05.md`, vervollständige sie, bis alle Abnahmekriterien von `order-05.md` erfüllt sind, und committe sie als eigenen Commit. Danach folgt dieser Auftrag als weiterer Commit.

## Grundlagen

- `docs/design/requirements/anforderungen-strategiedesigner.md`: req-ui-014, req-ui-016 und req-ui-017 in der Fassung vom 2026-10-23
- `docs/design/domain/fachmodell.md`: Eigenschaften und Methoden der Indikatoren, Trends und Objekte der Anwendung, req-fach-055
- `development/strategiedesign/specification.md`, Abschnitte 5.3 (Punkt „Objekte“, Datenverbindungen) und 5.4 (Aufbau der Eigenschaftenansicht)
- `development/strategiedesign/prototype/order-02.md`, Punkte 1 bis 3, und `order-05.md`
- `components/pipwerk-studio/prototype/README.md`

## Umfang

1. **Objekte beim Element ihrer ersten Verwendung** (Einwand Punkt 2, req-ui-017). Nach dem Test des Auftraggebers stehen Indikatoren wie der EMA weiterhin in einem eigenen Kasten und nicht neben dem Element ihrer ersten Verwendung; es entstehen lange, sich kreuzende Linien quer über die Zeichenfläche. Ermittle zuerst, wo das geschieht, und belege es mit Bildschirmbildern vor der Änderung, mindestens: „EMA-Trendfolge“ des Auftraggebers, `str-01`, `str-03`, „Neue Strategie“ mit dem Assistenten bis zum Ende, ein EMA aus der Elementbibliothek eingefügt und danach mit einer Bedingung verbunden, jeweils senkrecht und waagerecht. Danach gilt in jedem dieser Wege: Jede Instanz liegt bei senkrechtem Ablauf neben, bei waagerechtem über oder unter dem Element ihrer ersten Verwendung, nah daran, mit einer immer sichtbaren Linie zu ihm. Es gibt keinen Kasten, keine Gruppe und keinen Bereich, der Objekte sammelt. Die Linie zur ersten Verwendung kreuzt keine andere Linie und kein Element, soweit die Anordnung das zulässt; weitere Verwendungen zeigen wie bisher ihre Datenverbindungen. Eine Instanz, die noch kein Element verwendet, bleibt, wo sie abgelegt wurde, mit der bisherigen Markierung des Befunds. Der Anwender kann eine Instanz verschieben wie ein Element.
2. **Beschreibung der Eigenschaften und Methoden** (Einwand Punkt 3, req-ui-016). Die Eigenschaftenansicht eines Objekts zeigt jede Eigenschaft und Methode, die es liefert, mit ihrem Namen, ihrem Datentyp und einer sichtbaren Beschreibung in Händlersprache: was der Wert aussagt und wozu man ihn in einer Strategie verwendet. Das gilt für jeden Indikator, jeden Trend und jedes Objekt der Anwendung im Prototyp, in Deutsch und Englisch. Die Inhalte nimmst du aus dem Fachmodell; wo es keinen Zweck nennt, schreibst du einen kurzen fachlich richtigen Satz und nennst diese Stellen im Ergebnis.
3. **Ausgang mit Namen** (Einwand Punkt 3, req-ui-016). Jede Zeile eines Objekts auf der Zeichenfläche, an der eine Datenverbindung beginnt, zeigt den Namen der Eigenschaft beziehungsweise Methode, zum Beispiel beim EMA dessen Wert unter seinem Namen aus dem Fachmodell, nicht nur „Zahl“. Der Datentyp darf zusätzlich dahinter stehen. Dasselbe gilt für die Beschriftung von Datenverbindungen, Eingängen in der Eigenschaftenansicht und „Verbundene Werte“ in den Bausteinen.
4. **Unverändert:** Löschen einer Verbindung bleibt wie im Ausgangscommit (Einwand Punkt 4 ist ein offener Diskussionspunkt). Ebenso alles aus `order-05.md`.
5. Prüfe nach Punkt 1 bis 3 jede Schaltfläche wie in `order-04.md`, Punkt 3. Hat eine keine Funktion, behebe es und nenne es im Ergebnis.
6. README nachführen. Alle Texte in Deutsch und Englisch, Fenstergrößen wie in `order-01.md`, Punkt 15.

## Nicht-Umfang

- Alles außerhalb von Punkt 1 bis 6 und `order-05.md`, insbesondere Backend und Anwenderdokumentation

## Technische Abnahmekriterien

1. Die gebaute Datei öffnet sich in Chromium, Firefox und WebKit über `file://` ohne Fehler in der Konsole.
2. Ein Browsertest prüft für jeden Weg aus Punkt 1, senkrecht und waagerecht, in 1366 × 768 und 390 × 844: Jede verbundene Instanz liegt neben beziehungsweise über oder unter dem Element ihrer ersten Verwendung, ihr Abstand zu ihm ist höchstens so groß wie der Abstand zweier aufeinanderfolgender Elemente des Ablaufs, kein Element und kein Rahmen umschließt nur Instanzen, und die Linie zur ersten Verwendung schneidet in den Strategien zum Start keine andere Linie.
3. Ein Browsertest prüft für EMA, einen Trend und ein Objekt der Anwendung in beiden Sprachen: Die Eigenschaftenansicht zeigt zu jeder gelieferten Eigenschaft und Methode Name, Datentyp und eine nicht leere sichtbare Beschreibung; jede Zeile des Objekts auf der Zeichenfläche zeigt ihren Namen; keine Zeile zeigt nur einen Datentyp.
4. Alle bestehenden Browsertests bestehen, auch die aus `order-05.md`, der Test der sechs Fenstergrößen und der Test aller Schaltflächen.
5. Bildschirmbilder vor und nach der Änderung zu Punkt 1 in 1366 × 768, senkrecht und waagerecht, für „EMA-Trendfolge“ und „Neue Strategie“ nach dem Assistenten; nach der Änderung die Eigenschaftenansicht eines EMA in 1366 × 768 und 390 × 844.
6. README beschreibt Punkt 1 bis 5 mit der gefundenen Ursache aus Punkt 1 und enthält keine Pfade des Entwicklungsrechners und keine Zugangsdaten.
7. Die gebaute Datei liegt unter `components/pipwerk-studio/prototype/dist/pipwerk-studio-prototyp.html`.

## Ergebnis

Zwei benannte Commits auf `strategiedesign/proto-studio` auf GitHub, einer für `order-05.md`, einer für diesen Auftrag. Nenne beide vollständig, dazu je Auftrag die erfüllten und nicht erfüllten Abnahmekriterien mit Nachweis, die gefundene Ursache aus Punkt 1 und deine Entscheidungen.
