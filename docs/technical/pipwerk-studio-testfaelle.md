# pipwerk Studio – Aufbau der Testfälle str-01 und str-03 über die Oberfläche

## Dokumentstatus

- status: `draft`
- stand: 2026-10-21
- komponente: `pipwerk-studio`

## 1. Zweck

Dieses Dokument beschreibt Schritt für Schritt, wie sich die beiden Testfälle `str-03` (EMA-Trendfolge) und `str-01` (Scalping Punkt 2 Ausbruch) aus der leeren Zeichenfläche nur durch Bedienen der Oberfläche aufbauen lassen. Kein Schritt gibt einen Ausdruck als Text ein; alle Ausdrücke entstehen aus Bausteinen. Die Browsertests in `components/pipwerk-studio/frontend/e2e/testcases.spec.ts` führen genau diese Schritte aus (mit den Hilfen aus `e2e/builder.ts`), speichern die Strategie, lesen sie vom Backend und vergleichen sie mit den Dokumenten unter `contracts/strategies/v2/testcases/`.

Zu dem, was die Oberfläche kann, siehe die Anwenderdokumentation `docs/user/pipwerk-studio.md`. Hier stehen nur die Schritte der Testfälle.

## 2. Was verglichen wird

Der Test vergleicht das gespeicherte Dokument mit dem Dokument des Testfalls ohne Kennungen, Namen, Lage und Zeitpunkte (Spezifikation 7):

- Kennungen (`id`) von Strategie, Elementen und Verbindungen fehlen im Vergleich; Elemente und Verbindungen werden nach der Reihenfolge der Elemente einander zugeordnet.
- Namen (`name`), Beschreibungen, Lage (`position`) und `template_name` fehlen im Vergleich. Die Namen der Schritte, Objekte, Strategieparameter und Regeln sind trotzdem vorgegeben und der Test prüft sie zusätzlich: Sie stehen in den Tabellen unten.
- Die Kennungen in Ausdrücken (`key`, Eingänge, Belegungen mit Strategieparameter) entstehen aus den Namen. Der Vergleich ersetzt jede Kennung durch eine Nummer in der Reihenfolge ihres ersten Auftretens, im Dokument und in den Ausdrücken, damit gleiche Strukturen gleich sind. Namen von Eigenschaften (`Position.richtung`) bleiben unverändert.
- Die Ausdrücke werden als Text verglichen (mit einheitlichem Leerraum).
- Danach muss die Konsistenzprüfung der gespeicherten Strategie keinen Fehler melden.

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

Klicken Sie nacheinander die Einträge in der Gruppe „Indikatoren“ an. Jedes Objekt erscheint als Karte im Bereich der Objekte.

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

Jeder Wert aus einer Liste der Bausteine legt den Eingang des Elements an: Wer *EMA 20 › Wert* wählt, bekommt den Eingang *EMA 20 › Wert* ohne weiteren Schritt.

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

Der Ausgang „wahr“ der Bedingung 8 führt zu „Position schließen“. Für den Ausgang „falsch“ wählen Sie die Bedingung 8 (Klick auf den Schritt) und fügen den nächsten Eintrag ein; er hängt am nächsten freien Ausgang, das ist „falsch“.

| Nr. | Eintrag | Name | Belegung und Ausdruck |
| --- | --- | --- | --- |
| 10 | Berechnung | Neuer Stop-Loss | Ausdruck: Wenn *Position › Richtung* gleich „buy“, dann *Kerze › Schluss* minus (*Stop-Abstand* mal *ATR 14 › Wert*), sonst *Kerze › Schluss* plus (*Stop-Abstand* mal *ATR 14 › Wert*) |
| 11 | Bedingung | Stop-Loss verbessert | Art „Wert ist wahr“ mit dem Wert „Wenn … dann … sonst …“: Bedingung *Position › Richtung* gleich „buy“; dann die Bedingung *Neuer Stop-Loss › Ergebnis* größer als *Position › Stop-Loss*; sonst die Bedingung *Neuer Stop-Loss › Ergebnis* kleiner als *Position › Stop-Loss* |
| 12 | Position ändern | – | Stop-Loss: Bindungsart „Ausdruck“, Wert *Neuer Stop-Loss › Ergebnis* |

### 5.5 Speichern, Neuladen, Prüfen

1. „Speichern“. Die Statusanzeige nennt „gespeichert“.
2. Browser neu laden; „Öffnen“; die Strategie öffnen. Sie sieht aus wie vorher.
3. „Prüfen“. Die Zahl der Befunde ist null.

## 6. str-01 – Scalping Punkt 2 Ausbruch

### 6.1 Strategieparameter

| Name | Datentyp | Wert |
| --- | --- | --- |
| Signalzeiteinheit | Zeiteinheit | H1 |
| Handelszeiteinheit | Zeiteinheit | M15 |
| Entry-Puffer | Zahl | 3 |
| Stop-Puffer | Zahl | 3 |

### 6.2 Objekte

| Eintrag (Gruppe „Trends“) | Name | Zeiteinheit |
| --- | --- | --- |
| 1-2-3-Trend (Markttechnik) | MT Signal | Strategieparameter Signalzeiteinheit |
| 1-2-3-Trend (Markttechnik) | MT Handel | Strategieparameter Handelszeiteinheit |

Die übrigen Parameter der Markttechnik bleiben auf ihren Standardwerten.

### 6.3 Hauptablauf

| Nr. | Eintrag | Name | Belegung und Ausdruck |
| --- | --- | --- | --- |
| 1 | Kerzenschluss | – | Zeiteinheit: Strategieparameter Handelszeiteinheit |
| 2 | Bedingung | Intakter Trend in der Bewegung | Art „Alle gelten (und)“: „Wert ist wahr“ für *MT Signal › Trend intakt*; Vergleich *MT Signal › Phase* gleich „Bewegung“ |
| 3 | Bedingung | Handelszeiteinheit in Trendrichtung | Vergleich *MT Handel › Trendrichtung* gleich *MT Signal › Trendrichtung* |
| 4 | Bedingung | Keine Order und keine Position | Vergleich: Rechnung *Strategie › wartende Orders* plus *Strategie › offene Positionen* gleich der Zahl 0 |
| 5 | Berechnung | Einstieg | Wenn *MT Signal › Trendrichtung* gleich „aufwärts“, dann (*MT Handel › Punkt 2* plus *Instrument › Spread*) plus (*Entry-Puffer* mal *Instrument › Pip*), sonst *MT Handel › Punkt 2* minus (*Entry-Puffer* mal *Instrument › Pip*) |
| 6 | Berechnung | Stop-Loss | Wenn *MT Signal › Trendrichtung* gleich „aufwärts“, dann *MT Handel › Punkt 1/3* minus (*Stop-Puffer* mal *Instrument › Pip*), sonst (*MT Handel › Punkt 1/3* plus (*Stop-Puffer* mal *Instrument › Pip*)) plus *Instrument › Spread* |
| 7 | Berechnung | Take-Profit | Wenn *MT Signal › Trendrichtung* gleich „aufwärts“, dann (*Einstieg › Ergebnis* plus (*Einstieg › Ergebnis* minus *Stop-Loss › Ergebnis*)) plus *Instrument › Spread*, sonst (*Einstieg › Ergebnis* minus (*Stop-Loss › Ergebnis* minus *Einstieg › Ergebnis*)) minus *Instrument › Spread* |
| 8 | Order aufgeben | – | Ordertyp: Fester Wert „StopOrder“; Richtung: Bindungsart „Ausdruck“, Wenn *MT Signal › Trendrichtung* gleich „aufwärts“, dann „buy“, sonst „sell“; Preis: Ausdruck *Einstieg › Ergebnis*; Stop-Loss: Ausdruck *Stop-Loss › Ergebnis*; Take-Profit: Ausdruck *Take-Profit › Ergebnis*; Gültigkeit: Fester Wert „bis auf Widerruf“ |

Zum Schritt 8 gehören wie bei `str-03` die Regel „Mindestvolumen“ am Element und die Regel „Risiko“ an der Strategie.

### 6.4 Verwaltung der Order

Auf den Titel des Rahmens „Verwaltung · Order aufgeben“ klicken, dann:

| Nr. | Eintrag | Name | Belegung und Ausdruck |
| --- | --- | --- | --- |
| 9 | Tick (Gruppe „Auslöser“) | – | Instrument: der Standard „Instrument der Anwendung“ |
| 10 | Bedingung | Kurs durchbricht Punkt 1/3 | Art „Alle gelten (und)“: Vergleich *Order › Status* gleich „wartend“; „Wert ist wahr“ mit „Wenn … dann … sonst …“: Bedingung *Order › Richtung* gleich „buy“; dann die Bedingung *Tick › Geld* kleiner als *MT Handel › Punkt 1/3*; sonst die Bedingung *Tick › Brief* größer als *MT Handel › Punkt 1/3* |
| 11 | Order löschen | – | – |
| 12 | Kerzenschluss | – | Zeiteinheit: Strategieparameter Handelszeiteinheit |
| 13 | Bedingung | Order wartet | Vergleich *Order › Status* gleich „wartend“ |
| 14 | Berechnung | Neuer Stop-Loss | Wenn *Order › Richtung* gleich „buy“, dann *MT Handel › Punkt 1/3* minus (*Stop-Puffer* mal *Instrument › Pip*), sonst (*MT Handel › Punkt 1/3* plus (*Stop-Puffer* mal *Instrument › Pip*)) plus *Instrument › Spread* |
| 15 | Bedingung | Stop-Loss weicht ab | Vergleich *Neuer Stop-Loss › Ergebnis* ungleich *Order › Stop-Loss* |
| 16 | Berechnung | Neuer Take-Profit | Wenn *Order › Richtung* gleich „buy“, dann (*Order › Preis* plus (*Order › Preis* minus *Neuer Stop-Loss › Ergebnis*)) plus *Instrument › Spread*, sonst (*Order › Preis* minus (*Neuer Stop-Loss › Ergebnis* minus *Order › Preis*)) minus *Instrument › Spread* |
| 17 | Order ändern | – | Stop-Loss: Ausdruck *Neuer Stop-Loss › Ergebnis*; Take-Profit: Ausdruck *Neuer Take-Profit › Ergebnis* |
| 18 | Order löschen | – | – |

Das Element 11 hängt am Ausgang „wahr“ der Bedingung 10, das Element 13 an der Kerze 12, 14 am Ausgang „wahr“ von 13, 15 an 14, 16 am Ausgang „wahr“ von 15, 17 an 16. Das Element 18 hängt am Ausgang „nicht geändert“ von 17: Fügen Sie es bei gewähltem Rahmen ein (es hängt dann an keinem Ausgang), klicken Sie dann auf den Ausgang „nicht geändert“ von „Order ändern“ und anschließend auf „Order löschen“ (Verbinden mit Klicks).

### 6.5 Speichern, Neuladen, Prüfen

Wie bei `str-03` (Abschnitt 5.5).

## 7. Die Tests

| Datei | Inhalt |
| --- | --- |
| `e2e/testcases.spec.ts` | baut `str-03` in 1366 × 768 und in 390 × 844 (nur mit Klicks) und `str-01` in 1366 × 768, speichert, liest die gespeicherte Strategie über die Web-API und vergleicht sie mit dem Testfall |
| `e2e/builder.ts` | die Handgriffe: Eintrag der Bibliothek einfügen und benennen, Bausteine setzen (`setValue`, `setCond`), Bindungsarten, Regeln |
| `e2e/compare.ts` | der Vergleich ohne Kennungen, Namen, Lage und Zeitpunkte |

Der Test legt die Strategie unter einem Namen an, der den Browser nennt, und löscht sie am Ende. Er läuft gegen das Backend; im Stub-Betrieb (`npm run e2e:stub`) wird er übersprungen, weil erst das Backend die Ausdrücke bildet.
