# pipwerk Studio – Aufbau der Testfälle str-01 und str-03 über die Oberfläche

## Dokumentstatus

- status: `draft`
- stand: 2026-10-25
- komponente: `pipwerk-studio`

## 1. Zweck

Dieses Dokument beschreibt Schritt für Schritt, wie sich die beiden Testfälle `str-03` (EMA-Trendfolge) und `str-01` (Scalping Punkt 2 Ausbruch) aus der leeren Zeichenfläche nur durch Bedienen der Oberfläche aufbauen lassen. Kein Schritt gibt einen Ausdruck als Text ein; alle Ausdrücke entstehen aus Bausteinen. Die Browsertests in `components/pipwerk-studio/frontend/e2e/testcases.spec.ts` führen genau diese Schritte aus (mit den Hilfen aus `e2e/builder.ts`), speichern die Strategie, lesen sie vom Backend und vergleichen sie mit den Dokumenten unter `contracts/strategies/v2/testcases/`. Die Testfälle sind die Dokumente `str-01.strategy.json` und `str-03.strategy.json` in diesem Verzeichnis; die Schritte unten bilden sie ab. In beiden Verwaltungen verwenden die Schritte Objekte des Hauptablaufs mit „Aktualisieren“ (Spezifikation 3.3).

Zu dem, was die Oberfläche kann, siehe die Anwenderdokumentation `docs/user/pipwerk-studio.md`. Hier stehen nur die Schritte der Testfälle.

## 2. Was verglichen wird

Der Test vergleicht das gespeicherte Dokument mit dem Dokument des Testfalls ohne Kennungen, Namen, Lage und Zeitpunkte (Spezifikation 7):

- Kennungen (`id`) von Strategie, Elementen und Verbindungen fehlen im Vergleich; Elemente und Verbindungen werden nach der Reihenfolge der Elemente einander zugeordnet.
- Namen (`name`), Beschreibungen, Lage (`position`) und `template_name` fehlen im Vergleich. Die Namen der Schritte, Objekte, Strategieparameter und Regeln sind trotzdem vorgegeben und der Test prüft sie zusätzlich: Sie stehen in den Tabellen unten.
- Die Kennungen in Ausdrücken (`key`, Eingänge, Belegungen mit Strategieparameter) entstehen aus den Namen. Der Vergleich ersetzt jede Kennung durch eine Nummer in der Reihenfolge ihres ersten Auftretens, im Dokument und in den Ausdrücken, damit gleiche Strukturen gleich sind. Namen von Eigenschaften (`Position.richtung`) bleiben unverändert.
- Die Ausdrücke werden als Text verglichen (mit einheitlichem Leerraum).
- Die Eingänge eines Elements sind eine Menge: Der Vergleich ordnet sie, die Reihenfolge der Wahl zählt nicht. Objekt, Eigenschaft oder Methode, Argumente und „Aktualisieren“ jedes Eingangs werden verglichen. Das Element der ersten Verwendung jeder Instanz (`first_use`) wird wie eine Kennung behandelt: Es muss dasselbe Element sein, das der Testfall nennt.
- Danach muss die Konsistenzprüfung der gespeicherten Strategie keinen Fehler melden.
- Der Test lädt die Seite neu, öffnet die Strategie mit „Öffnen“, prüft sie, speichert sie noch einmal und vergleicht das Ergebnis ein zweites Mal mit dem Testfall: Die geöffnete Strategie ist die aufgebaute.

Die Reihenfolge, in der die Elemente angelegt werden, ist die Reihenfolge im Dokument des Testfalls. Deshalb stehen die Schritte in dieser Reihenfolge.

## 3. Schreibweise der Schritte

- „Eintrag *X*“ ist der Eintrag mit dem Namen *X* in der Elementbibliothek. Ein Klick darauf fügt das Element hinter dem gewählten Schritt ein und verbindet es mit dessen erstem freien Ausgang. Die Eigenschaftenansicht zeigt danach das neue Element.
- „Name“ ist das Feld ganz oben in der Eigenschaftenansicht.
- „Belegung“ nennt die Bindungsart und den Wert eines Feldes der Eigenschaftenansicht. „Strategieparameter *P*“ heißt: Bindungsart „Strategieparameter“, dort *P* wählen. „Fester Wert“ heißt: Bindungsart „Fester Wert“.
- „Ausdruck“ nennt die Bausteine. Jeder Baustein hat eine Liste „Wert wählen …“; der Wert steht in der Form *Objekt › Eigenschaft* (zum Beispiel *EMA 20 › Wert*). Die Listen enthalten zuerst die verbundenen Werte, dann die Objekte der Strategie, die Objekte der Anwendung, die Ergebnisse anderer Schritte, die Strategieparameter, die Parameter der Regel und am Ende die festen Werte und die Arten von Bausteinen.
- „Rechnung“ ist die Wahl „Rechnung (plus, minus, mal, geteilt)“, „Wenn … dann … sonst …“ die Wahl der Fallunterscheidung, „Bedingung“ in einer Liste von Werten die Wahl „Bedingung (wahr oder falsch) …“. Eine Bedingung wählt oben ihre Art: „Vergleich“, „Kreuzung“, „Alle gelten (und)“, „Eine gilt (oder)“, „Nicht“ oder „Wert ist wahr“.
- Ein Strich „–“ in einer Spalte heißt: nichts zu tun, der Standard bleibt.

## 4. Vorbereitung

1. pipwerk Studio öffnen (Anwenderdokumentation, Abschnitt „pipwerk Studio öffnen“).
2. „Neue Strategie“. Der geführte Aufbau erscheint. „Ohne Assistent weiterarbeiten“ wählen. Die Zeichenfläche ist leer.
3. Name der Strategie: in der Eigenschaftenansicht der Strategie (sie zeigt sich, wenn Sie auf eine freie Stelle der Zeichenfläche klicken oder den Namen der Strategie oben in der Eigenschaftenansicht wählen) den Namen eintragen. Er gehört nicht zum Vergleich.

## 5. str-03 – EMA-Trendfolge

### 5.1 Strategieparameter

Im Streifen der Strategieparameter „Neu“:

| Name | Datentyp | Wert |
| --- | --- | --- |
| Zeiteinheit | Zeiteinheit | H1 |
| Stop-Abstand | Zahl | 2 |

### 5.2 Objekte

Klicken Sie nacheinander die Einträge in der Gruppe „Indikatoren“ an. Jedes Objekt erscheint als Karte auf der Zeichenfläche; solange kein Schritt es verwendet, liegt die Karte neben dem Ablauf, danach neben dem Schritt, der es zuerst verwendet.

| Eintrag | Name | Zeiteinheit | Periode |
| --- | --- | --- | --- |
| EMA | EMA 20 | Strategieparameter Zeiteinheit | Fester Wert 20 |
| EMA | EMA 50 | Strategieparameter Zeiteinheit | Fester Wert 50 |
| ATR | ATR 14 | Strategieparameter Zeiteinheit | Fester Wert 14 |

### 5.3 Hauptablauf

| Nr. | Eintrag | Name | Belegung und Ausdruck |
| --- | --- | --- | --- |
| 1 | Kerzenschluss | – | Zeiteinheit: Strategieparameter Zeiteinheit |
| 2 | Bedingung | Kreuzen | Ausdruck: Art „Kreuzung“: *EMA 20 › Wert* kreuzt *EMA 50 › Wert* in beide Richtungen |
| 3 | Berechnung | Richtung | Ausdruck: Wert „Wenn … dann … sonst …“; Bedingung: Vergleich *EMA 20 › Wert* ist größer als *EMA 50 › Wert*; dann Text `buy`; sonst Text `sell` |
| 4 | Berechnung | Stop-Loss | Ausdruck: Wenn *Richtung › Ergebnis* gleich dem Text `buy`, dann *Kerze › Schluss* minus (*Stop-Abstand* mal *ATR 14 › Wert*), sonst *Kerze › Schluss* plus (*Stop-Abstand* mal *ATR 14 › Wert*) |
| 5 | Order aufgeben | – | Ordertyp: Fester Wert „MarketOrder“; Richtung: Bindungsart „Ausdruck“, Wert *Richtung › Ergebnis*; Stop-Loss: Bindungsart „Ausdruck“, Wert *Stop-Loss › Ergebnis* |

Jeder Wert aus einer Liste der Bausteine legt den Eingang des Elements an: Wer *EMA 20 › Wert* wählt, bekommt den Eingang *EMA 20 › Wert* ohne weiteren Schritt. Verwendete noch kein Element das Objekt, wird das Element, in dem der Wert gewählt wird, das Element der ersten Verwendung des Objekts: Bei Schritt 2 sind das „Kreuzen“ für *EMA 20* und *EMA 50*, bei Schritt 4 „Stop-Loss“ für *ATR 14*. In der Eigenschaftenansicht des Elements stehen die Werte unter „Verwendete Werte“.

Beim Schritt 5 gehört die Regel „Mindestvolumen“ zum Element: In der Eigenschaftenansicht von „Order aufgeben“ im Abschnitt „Regeln dieses Elements“ in der Liste „Regel oder Regelwerk hinzufügen …“ die Wahl „eigene Regel“, Name `Mindestvolumen`, Ausdruck: Art „Vergleich“, *Order › Volumen* ist größer oder gleich *Order › Instrument › Mindestvolumen*.

Zur Strategie gehört die Regel „Risiko“: In der Eigenschaftenansicht der Strategie im Abschnitt „Regeln der Strategie“ in der Liste „Regel oder Regelwerk hinzufügen …“ den Eintrag „Risiko je Trade“ wählen und die Regel `Risiko` nennen. Ihre Parameter und ihr Ausdruck stammen aus der mitgelieferten Vorlage und bleiben, wie sie sind.

### 5.4 Verwaltung der Order

Klicken Sie auf den Rahmen „Verwaltung · Order aufgeben“ (auf seinen Titel). Der Rahmen ist gewählt; was Sie jetzt aus der Bibliothek einfügen, gehört zur Verwaltung.

| Nr. | Eintrag | Name | Belegung und Ausdruck |
| --- | --- | --- | --- |
| 6 | Kerzenschluss | – | Zeiteinheit: Strategieparameter Zeiteinheit |
| 7 | Bedingung | Order ausgeführt | Vergleich *Order › Status* gleich dem Wert „ausgeführt“ (aus der Liste der Werte der Eigenschaft) |
| 8 | Bedingung | Kreuzen gegen die Position | Art „Eine gilt (oder)“ mit zwei Bedingungen. Erste: Art „Alle gelten (und)“ mit dem Vergleich *Position › Richtung* gleich „buy“ und der Kreuzung *EMA 20 › Wert* kreuzt *EMA 50 › Wert* nach unten. Zweite: Art „Alle gelten (und)“ mit dem Vergleich *Position › Richtung* gleich „sell“ und der Kreuzung *EMA 20 › Wert* kreuzt *EMA 50 › Wert* nach oben |
| 9 | Position schließen | – | – |

Die Verwaltung hat eigene Auslöser. Die Objekte des Hauptablaufs behalten darin den Stand, den sie beim Aufgeben der Order hatten; die Verwaltung braucht aber die aktuellen Werte. Deshalb schalten Sie bei Schritt 8 unter „Verwendete Werte“ bei *EMA 20* und bei *EMA 50* den Schalter „Aktualisieren“ ein (nach der Wahl der Werte in den Bausteinen), und bei Schritt 10 bei *ATR 14*.

Der Ausgang „wahr“ der Bedingung 8 führt zu „Position schließen“. Für den Ausgang „falsch“ wählen Sie die Bedingung 8 (Klick auf den Schritt) und fügen den nächsten Eintrag ein; er hängt am nächsten freien Ausgang, das ist „falsch“.

| Nr. | Eintrag | Name | Belegung und Ausdruck |
| --- | --- | --- | --- |
| 10 | Berechnung | Neuer Stop-Loss | Ausdruck: Wenn *Position › Richtung* gleich „buy“, dann *Kerze › Schluss* minus (*Stop-Abstand* mal *ATR 14 › Wert*), sonst *Kerze › Schluss* plus (*Stop-Abstand* mal *ATR 14 › Wert*) |
| 11 | Bedingung | Stop-Loss verbessert | Art „Wert ist wahr“ mit dem Wert „Wenn … dann … sonst …“: Bedingung *Position › Richtung* gleich „buy“; dann die Bedingung *Neuer Stop-Loss › Ergebnis* größer als *Position › Stop-Loss*; sonst die Bedingung *Neuer Stop-Loss › Ergebnis* kleiner als *Position › Stop-Loss* |
| 12 | Position ändern | – | Stop-Loss: Bindungsart „Ausdruck“, Wert *Neuer Stop-Loss › Ergebnis* |

### 5.5 Speichern, Neuladen, Prüfen

1. „Speichern“. Die Statusanzeige nennt „gespeichert“ (nicht „ungespeichert“).
2. Browser neu laden; „Öffnen“; die Strategie öffnen. Sie sieht aus wie vorher.
3. „Prüfen“. Die Zahl der Befunde ist null.
4. „Speichern“ noch einmal: Die gespeicherte Strategie ist wieder gleich dem Testfall.

## 6. str-01 – Scalping Punkt 2 Ausbruch

### 6.1 Strategieparameter

| Name | Datentyp | Wert |
| --- | --- | --- |
| Signalzeiteinheit | Zeiteinheit | H1 |
| Handelszeiteinheit | Zeiteinheit | M15 |
| Entry-Puffer | Zahl | 3 |
| Stop-Puffer | Zahl | 3 |

### 6.2 Objekte

| Eintrag (Gruppe „Indikatoren“) | Name | Zeiteinheit |
| --- | --- | --- |
| ZigZag | ZigZag Signal | Strategieparameter Signalzeiteinheit |
| ZigZag | ZigZag Handel | Strategieparameter Handelszeiteinheit |

Die übrigen Parameter des ZigZag (Depth 12, Deviation 5, Backstep 3, Instrument der Anwendung) bleiben auf ihren Standardwerten.

### 6.3 Hauptablauf

| Nr. | Eintrag | Name | Belegung und Ausdruck |
| --- | --- | --- | --- |
| 1 | Kerzenschluss | – | Zeiteinheit: Strategieparameter Handelszeiteinheit |
| 2 | Berechnung | Trend Signalzeiteinheit | Wenn (Art „Alle gelten (und)“: *ZigZag Signal › Letztes Hoch* größer als *ZigZag Signal › Vorletztes Hoch*; *ZigZag Signal › Letztes Tief* größer als *ZigZag Signal › Vorletztes Tief*), dann Text `aufwaerts`, sonst Wenn (Art „Alle gelten (und)“: *ZigZag Signal › Letztes Hoch* kleiner als *ZigZag Signal › Vorletztes Hoch*; *ZigZag Signal › Letztes Tief* kleiner als *ZigZag Signal › Vorletztes Tief*), dann Text `abwaerts`, sonst Text `kein` |
| 3 | Berechnung | Trend Handelszeiteinheit | ebenso mit *ZigZag Handel* statt *ZigZag Signal* |
| 4 | Bedingung | Trend in beiden Zeiteinheiten gleich | Art „Alle gelten (und)“: Vergleich *Trend Signalzeiteinheit › Ergebnis* ungleich dem Text `kein`; Vergleich *Trend Handelszeiteinheit › Ergebnis* gleich *Trend Signalzeiteinheit › Ergebnis* |
| 5 | Bedingung | Keine Order und keine Position | Vergleich: Rechnung *Strategie › wartende Orders* plus *Strategie › offene Positionen* gleich der Zahl 0 |
| 6 | Berechnung | Einstieg | Wenn *Trend Signalzeiteinheit › Ergebnis* gleich dem Text `aufwaerts`, dann (*ZigZag Handel › Letztes Hoch* plus *Instrument › Spread*) plus (*Entry-Puffer* mal *Instrument › Pip*), sonst *ZigZag Handel › Letztes Tief* minus (*Entry-Puffer* mal *Instrument › Pip*) |
| 7 | Berechnung | Stop-Loss | Wenn *Trend Signalzeiteinheit › Ergebnis* gleich dem Text `aufwaerts`, dann *ZigZag Handel › Letztes Tief* minus (*Stop-Puffer* mal *Instrument › Pip*), sonst (*ZigZag Handel › Letztes Hoch* plus (*Stop-Puffer* mal *Instrument › Pip*)) plus *Instrument › Spread* |
| 8 | Berechnung | Take-Profit | Wenn *Trend Signalzeiteinheit › Ergebnis* gleich dem Text `aufwaerts`, dann (*Einstieg › Ergebnis* plus (*Einstieg › Ergebnis* minus *Stop-Loss › Ergebnis*)) plus *Instrument › Spread*, sonst (*Einstieg › Ergebnis* minus (*Stop-Loss › Ergebnis* minus *Einstieg › Ergebnis*)) minus *Instrument › Spread* |
| 9 | Order aufgeben | – | Ordertyp: Fester Wert „StopOrder“; Richtung: Bindungsart „Ausdruck“, Wenn *Trend Signalzeiteinheit › Ergebnis* gleich dem Text `aufwaerts`, dann „buy“, sonst „sell“; Preis: Ausdruck *Einstieg › Ergebnis*; Stop-Loss: Ausdruck *Stop-Loss › Ergebnis*; Take-Profit: Ausdruck *Take-Profit › Ergebnis*; Gültigkeit: Fester Wert „bis auf Widerruf“ |

Der Text `aufwaerts` wird im Baustein „Text“ ohne Umlaut eingetragen, wie der Testfall ihn nennt. Wer *ZigZag Signal › Letztes Hoch* im Schritt 2 wählt, macht den Schritt 2 zum Element der ersten Verwendung von *ZigZag Signal*, im Schritt 3 gilt das für *ZigZag Handel*. Zum Schritt 9 gehören wie bei `str-03` die Regel „Mindestvolumen“ am Element und die Regel der Strategie, hier mit dem Namen `risiko` (kleingeschrieben, wie im Testfall).

### 6.4 Verwaltung der Order

Auf den Titel des Rahmens „Verwaltung · Order aufgeben“ klicken, dann:

| Nr. | Eintrag | Name | Belegung und Ausdruck |
| --- | --- | --- | --- |
| 10 | Tick (Gruppe „Ablaufsteuerung“) | – | Instrument: der Standard „Instrument der Anwendung“ |
| 11 | Bedingung | Kurs durchbricht den Stop-Bezug | Art „Alle gelten (und)“: Vergleich *Order › Status* gleich „wartend“; „Wert ist wahr“ mit „Wenn … dann … sonst …“: Bedingung *Order › Richtung* gleich „buy“; dann die Bedingung *Tick › Geld* kleiner als *ZigZag Handel › Letztes Tief*; sonst die Bedingung *Tick › Brief* größer als *ZigZag Handel › Letztes Hoch*. Danach unter „Verwendete Werte“ bei *ZigZag Handel* für beide Werte „Aktualisieren“ einschalten |
| 12 | Order löschen | – | – |
| 13 | Kerzenschluss | – | Zeiteinheit: Strategieparameter Handelszeiteinheit |
| 14 | Bedingung | Order wartet | Vergleich *Order › Status* gleich „wartend“ |
| 15 | Berechnung | Neuer Stop-Loss | Wenn *Order › Richtung* gleich „buy“, dann *ZigZag Handel › Letztes Tief* minus (*Stop-Puffer* mal *Instrument › Pip*), sonst (*ZigZag Handel › Letztes Hoch* plus (*Stop-Puffer* mal *Instrument › Pip*)) plus *Instrument › Spread*. Danach unter „Verwendete Werte“ bei *ZigZag Handel* für beide Werte „Aktualisieren“ einschalten |
| 16 | Bedingung | Stop-Loss weicht ab | Vergleich *Neuer Stop-Loss › Ergebnis* ungleich *Order › Stop-Loss* |
| 17 | Berechnung | Neuer Take-Profit | Wenn *Order › Richtung* gleich „buy“, dann (*Order › Preis* plus (*Order › Preis* minus *Neuer Stop-Loss › Ergebnis*)) plus *Instrument › Spread*, sonst (*Order › Preis* minus (*Neuer Stop-Loss › Ergebnis* minus *Order › Preis*)) minus *Instrument › Spread* |
| 18 | Order ändern | – | Stop-Loss: Ausdruck *Neuer Stop-Loss › Ergebnis*; Take-Profit: Ausdruck *Neuer Take-Profit › Ergebnis* |
| 19 | Order löschen | – | – |

Die Verwaltung hat eigene Auslöser. *ZigZag Handel* ist ein Objekt des Hauptablaufs und behält darin den Stand, den es beim Aufgeben der Order hatte; die Verwaltung braucht aber die aktuellen Werte. Deshalb schalten Sie bei den Schritten 11 und 15 „Aktualisieren“ ein. Der Testfall hat dafür bei beiden Elementen die Eingänge von *ZigZag Handel* mit „Aktualisieren“.

Das Element 12 hängt am Ausgang „wahr“ der Bedingung 11, das Element 14 an der Kerze 13, 15 am Ausgang „wahr“ von 14, 16 an 15, 17 am Ausgang „wahr“ von 16, 18 an 17. Das Element 19 hängt am Ausgang „nicht geändert“ von 18: Fügen Sie es bei gewähltem Rahmen ein (es hängt dann an keinem Ausgang), klicken Sie dann auf den Ausgang „nicht geändert“ von „Order ändern“ und anschließend auf „Order löschen“ (Verbinden mit Klicks).

### 6.5 Speichern, Neuladen, Prüfen

Wie bei `str-03` (Abschnitt 5.5).

## 7. Die Tests

| Datei | Inhalt |
| --- | --- |
| `e2e/testcases.spec.ts` | baut `str-03` in 1366 × 768 und in 390 × 844 (nur mit Klicks, ohne Ziehen) und `str-01` in 1366 × 768, speichert, liest die gespeicherte Strategie über die Web-API und vergleicht sie mit dem Testfall, lädt die Seite neu, öffnet die Strategie, prüft sie, speichert sie noch einmal und vergleicht erneut |
| `e2e/builder.ts` | die Handgriffe: Eintrag der Bibliothek einfügen und benennen, Bausteine setzen (`setValue`, `setCond`), Bindungsarten, Regeln, „Aktualisieren“ |
| `e2e/compare.ts` | der Vergleich ohne Kennungen, Namen, Lage und Zeitpunkte |
| `e2e/support.ts` | gemeinsame Hilfen; `expectSaved` und `expectUnsaved` prüfen den Zustand „gespeichert“ beziehungsweise „ungespeichert“ in der Statusanzeige genau (der Text „gespeichert“ steht auch in „ungespeichert“) |

Der Test legt die Strategie unter einem Namen an, der den Browser nennt, und löscht sie am Ende. Er läuft gegen das Backend, das die Ausdrücke bildet (Prüfskript und `npm run e2e`, siehe `docs/technical/pipwerk-studio.md`, Abschnitte 6.3 und 6.4).
