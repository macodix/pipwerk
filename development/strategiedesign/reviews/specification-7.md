# Prüfbericht QA – Spezifikation, Durchlauf 7

- Bezug: `strategiedesign`, Prüfauftrag `development/strategiedesign/reviews/specification-7-order.md`
- Phase: 2, Spezifikation nach der Abnahme von `wp02` und dem bestätigten Prototyp
- geprüfter Commit: `7e98ac51cd72e70d9a560bcbfda17a671c364d3f` (`origin/main`, der Commit, der den Prüfauftrag anlegt; ermittelt mit `git log -1 --format=%H -- development/strategiedesign/reviews/specification-7-order.md`)
- Gegenstand: `development/strategiedesign/specification.md`, Fassung vom 2026-10-19
- Art: erster Durchlauf einer neuen Prüfschleife, vollständige Prüfung. Keine Testumgebung nötig und keine verwendet.

## Ergebnis: bestanden

Ich habe keinen blockierenden Befund gefunden. Die Spezifikation setzt die neuen und geänderten Anforderungen und die Mängel M1 bis M17 um, soweit sie die Spezifikation betreffen. Abschnitt 5 stimmt mit dem bestätigten Prototyp überein, bis auf eine Abweichung (N17). Die Testfälle `str-01` und `str-03` und die gesicherte Strategie des Auftraggebers bleiben abbildbar. Die Hinweise N2 bis N5 aus `specification-6.md` sind erledigt.

Es bleiben 22 Hinweise (N1 bis N22). Sie verhindern das Bestehen nicht. N1, N3, N9 und N13 sollten vor den Aufträgen geklärt sein, weil sie die Testfälle oder die Strategie des Auftraggebers berühren.

## Grundlagen der Prüfung

- `development/strategiedesign/specification.md` im geprüften Commit, vollständig
- `development/strategiedesign/scope.md`; `anforderungen-gesamtsystem.md` (req-system-024, req-system-020 und die übrigen Anforderungen dieses Dokuments); `anforderungen-strategiedesigner.md` vollständig; `fachmodell.md` vollständig; `indikator-markttechnik.md`; Testfälle `str-01` und `str-03`
- `development/strategiedesign/wp02/acceptance/1.md` und `wp02/acceptance/ema-trendfolge-auftraggeber.strategy.json`
- `development/strategiedesign/questions/strategiedesign-01.md` mit Antwort
- `development/strategiedesign/reviews/specification-6.md` und `specification-4.md` (H4)
- Prototyp: `strategiedesign/proto-studio:components/pipwerk-studio/prototype/README.md`; Quelltext auf Commit `dce2b7b1939a91bdd56802812e36cb900c6b4558` (`src/App.tsx`, `src/catalog.ts`, `src/Library.tsx`, `src/OwnEditor.tsx`, `src/Properties.tsx`, `src/store.ts`, `src/styles.css`, gebaute Datei). Die Datei `development/strategiedesign/prototype/pipwerk-studio-prototyp.html` auf `main` ist mit der gebauten Datei auf diesem Commit identisch (SHA-256 `d67c82e6d7dad11cef7413904f955d71cc74b4e2114afd94906538c428e8d729` bei beiden).
- `docs/technical/entwicklungsverfahren.md` („Umfang der Prüfungen“, „Fragen an den Auftraggeber“), `docs/technical/development-test-security-rules.md`, `docs/technical/pipwerk-studio.md`, `docs/user/pipwerk-studio.md` (Gliederung und Abschnitt 2)

Den Prototyp habe ich nicht im Browser geöffnet. Der Abgleich mit Abschnitt 5 beruht auf der Beschreibung und dem Quelltext des Prototyps.

## Prüfung nach den Punkten des Prüfauftrags

### Neue und geänderte Anforderungen

| Anforderung | Umsetzung in der Spezifikation | Ergebnis |
|---|---|---|
| req-system-024 | 5.1: drei Anordnungen nach Breite, sechs geprüfte Größen im Hoch- und Querformat, Prüfkriterien; 7: Browsertest in den sechs Größen | umgesetzt; Prüfkriterien enger als die Anforderung, siehe N16 |
| req-fach-014 | 3.4: `PREVIOUS` mit optionaler Anzahl; Kreuzung als Baustein | umgesetzt; Name `VORHER` siehe N4, zulässige Argumente siehe N5 |
| req-fach-015 | 3.3, 3.6 (Absatz unter der Tabelle), 10 Punkt 17: Auslöser optional, kein Befund für Elemente ohne eingehende Verbindung in einem Ablauf ohne Auslöser | umgesetzt; Wortlaut von req-ablauf-007 siehe N10 |
| req-fach-036 | 3.1 Kennungen, 3.3 Namen und Kennungen, 3.4 Anzeigeform, 10 Punkte 3 und 15 | umgesetzt; siehe N1, N4, N12 |
| req-fach-046 | 3.1 Bindungsart Datenverbindung, Datentyp Objekt; 3.3 Strategieparameter mit Objekt `Instrument`; 3.4 mehrstufige Namen | umgesetzt |
| req-fach-053 | 3.1 Parameter `Instrument`, 3.2 Auslöser und Objekte; 10 Punkt 16 vorläufig gekennzeichnet | umgesetzt; `Instrument` ohne Instanz siehe N6 |
| req-fach-054, `indikator-markttechnik.md` | 3.2: `ZigZag` mit Wendepunkten (vorläufig, 10 Punkt 14), `Anwenden auf`, `Markttechnik` in der Gruppe „Trends“; 5.2 „1-2-3-Trend (Markttechnik)“ | umgesetzt; siehe N7, N8 |
| req-ui-014 | 3.1, 3.3 Eingang und Datenverbindung, 3.6 neue Befunde, 5.3, 10 Punkte 10 bis 13 | umgesetzt; die drei offenen Punkte der Anforderung sind gefüllt und als vorläufig gekennzeichnet |
| req-ui-015 | 3.4 Bausteine, Zeichen, sichtbare Namen; 4.2 `/api/v1/expressions`; 5.4 | umgesetzt |
| req-ui-016 | 3.1 Händlersprache und Erklärungen, 3.3 ein Name, 5.2, 5.4, 5.5 geführter Aufbau, leere Zustände | umgesetzt; siehe N2, N20 |
| req-ui-017 | 3.3 Ausrichtung, Lage, Abschnitte; 5.3; 10 Punkt 9 | umgesetzt; siehe N14, N15 |
| req-ablauf-002 | 5.5 „Strategie anlegen“ | umgesetzt |
| req-ablauf-003 | 5.2, 5.5 „Objekt verwenden“ | umgesetzt; siehe N1 (Name einer Instanz von `Kerze`) |
| req-ablauf-007 | 3.6 | umgesetzt; siehe N10, N22 |

### Mängel M1 bis M17

| Mangel | Stelle in der Spezifikation | Ergebnis |
|---|---|---|
| M1 | 9: neues Dokument `docs/technical/pipwerk-studio-testfaelle.md`, Grundsatz in `docs/user/README.md` | umgesetzt; bestehender Abschnitt mit Prüfschritten siehe N18 |
| M2 | 5.1 | umgesetzt |
| M3 | 5.3, zweiter Punkt | umgesetzt |
| M4 | 3.2 Regelvorlage zweisprachig, 4.2 Fehler mit Kennung der Ursache, 5.1, 7 (Vitest) | umgesetzt; Herkunft mitgelieferter Vorlagen siehe N11 |
| M5 | 5.4, zweiter Punkt | umgesetzt |
| M6 | 5.4, dritter Punkt | umgesetzt |
| M7 | 5.4, erster Punkt; 5.3 Karten | umgesetzt |
| M8 | 3.1 Beschriftung, 5.2 Gruppen wie vom Auftraggeber festgelegt | umgesetzt; allgemeiner Satz zu allen Texten siehe N20 |
| M9 | 3.2, 10 Punkt 14 | umgesetzt |
| M10 | 5.1; Entwurf als Bildschirmbilder über den Prototyp (13 Bilder, davon sechs Fenstergrößen) | umgesetzt |
| M11 | 3.3, 5.3 | umgesetzt |
| M12 | 5.1 Streifen, 5.4 | umgesetzt |
| M13 | 5.4, 5.5, leere Zustände, 9 | umgesetzt; Inhalt der Anwenderdokumentation siehe N18 |
| M14 | 3.3, 5.4 | umgesetzt; siehe N2 |
| M15 | 5.4, Formelansicht | umgesetzt |
| M16 | 3.4, 5.4 | umgesetzt |
| M17 | 5.3 | umgesetzt |

### Abschnitt 5 und der bestätigte Prototyp

Geprüft und übereinstimmend:

- Kopfzeile: Menüpunkte „Neue Strategie“, „Öffnen“, „Speichern“, „Prüfen“, „Schließen“, „Löschen“, „Einstellungen“ (`src/App.tsx`, Zeilen 20 bis 26), „Über pipwerk Studio“ rechts.
- Gruppen und Inhalte der Elementbibliothek (`src/catalog.ts`, Feld `group`; `src/Library.tsx`, nur auf die Zeichenfläche legbare Objekte der Anwendung). „Neues Objekt …“ am Fuß der Bibliothek.
- Grenzen der Anordnungen bei 699 und 1099 Pixel Breite (`src/styles.css`, `src/store.ts` Zeile 183), Anpassung bei geringer Höhe (Media Query `height<=460px`).
- Beschriftungen „Belegung“, „Wert eines Objekts“, „Neuer Strategieparameter“, „Ohne Assistent weiterarbeiten“, „Objekte und ihre Werte“, „Alle / Auswahl / Aus“, „Senkrecht / Waagerecht“, „Verbundene Werte“, „Eingänge“, „Abschnitt“, „Als Vorlage speichern“, „Dateien verschieben?“.
- Bearbeiten von Regelwerken und eigenen Objekten in der Strategie (`src/OwnEditor.tsx`, `src/Properties.tsx` Zeile 465). Die Spezifikation regelt das nur über den Verweis auf den Prototyp (Abschnitt 5, Einleitung). Das reicht für req-param-005.
- Die fünf vorläufigen Lösungen aus der Antwort in `strategiedesign-01.md` stehen als Punkte 9 bis 13 in Abschnitt 10 und sind in 5.3 und 5.4 als vorläufig gekennzeichnet. Inhalt und Wortlaut entsprechen der Frage 1 der Frage `strategiedesign-01`.

Abweichung: N17.

### Testfälle und gesicherte Strategie

- `str-01` und `str-03` (Abschnitt 6): Jede Bedingung und Berechnung lässt sich mit den Bausteinen aus 3.4 bilden. Die Wahl der Regel `mindestvolumen` als Regel des Elements ist begründet. Die Befunde aus 3.6 treffen die Testfälle nicht: Beide haben in Hauptablauf und Verwaltung Auslöser. `Kerze` ohne Instanz steht in `str-03` nur in Abläufen, die ein `Kerzenschluss` erreicht.
- Gesicherte Strategie des Auftraggebers: Ich habe die Datei Feld für Feld gegen 3.7 gelesen. Die Ausdrücke bleiben gültig, weil Namen ohne Unterscheidung von Groß- und Kleinschreibung gelten und die Kennungen der Eigenschaften der Regel in 3.1 folgen (`wert`, `stop_loss`, `tickgroesse`, `ausgefuehrt`). `kursquelle` wird `anwenden_auf`. Offen bleiben die Kennung von Bedingungen ohne bisherigen Namen und die angezeigten Namen, siehe N3.

## Nachprüfung der Hinweise aus `specification-6.md`

| Hinweis | Stelle jetzt | Ergebnis |
|---|---|---|
| N1 Ausnahme von req-ablauf-007 nur über Plan und Meldung belegt | 3.6, letzte Zeile und Absatz darunter | beim Projektleiter, laut Prüfauftrag nicht Gegenstand; Folge für den neuen Plan siehe N10 |
| N2 Einordnung der Folge zu Abläufen ohne Auslöser | 10 Punkt 17, Änderungsnachweis | erledigt: Die Folge steht jetzt als eigene Festlegung unter „Neu in dieser Fassung“ und damit zur Vorlage beim Auftraggeber. |
| N3 Verbindung vom Ausgang `gestellt` | 3.3 Absatz „Verbindung“, 3.6 dritte Zeile | erledigt: Eine solche Verbindung ist ein Fehler, mit Begründung. Ähnliche Fälle siehe N9. |
| N4 Lesart „einen anderen als `Kerzenschluss`“ | 3.6, Zeile zu `Kerze` | erledigt: „mindestens einen anderen Auslöser als `Kerzenschluss`“ |
| N5 Abgrenzung der leeren Strategie | 3.6, letzte Zeile und Absatz darunter | erledigt: „Leer heißt: ohne Auslöser und ohne Elemente des Ablaufs; Instanzen auf der Zeichenfläche, Strategieparameter und Regeln der Strategie zählen nicht.“ |

## Blockierende Befunde

Keine.

## Hinweise (verhindern das Bestehen nicht)

Gruppen bei Befunden, die Dokumente des Auftraggebers berühren, nach „Fragen an den Auftraggeber“. Keiner der Hinweise gehört zur Gruppe „Entscheidung des Auftraggebers“.

### N1 – Kennungen können mit Objekten der Anwendung zusammenfallen oder keine gültigen Namen sein

- Fundstelle: 3.1 (Regel zur Bildung der Kennungen); 3.3, Absätze „Namen und Kennungen“ und „Namensräume“; 3.4 (Groß- und Kleinschreibung wird nicht unterschieden); 5.2 (Name einer neuen Instanz aus dem Namen des Typs).
- Sachverhalt: Eine Instanz von `Kerze` heißt nach 5.2 zunächst „Kerze“. Ihre Kennung ist nach 3.1 `kerze`. Ohne Unterscheidung der Groß- und Kleinschreibung ist das das Objekt der Anwendung `Kerze`. Der Namensraum der Strategie in 3.3 nennt die Objekte der Anwendung nicht. Die Bibliothek macht die Kennung also nicht gegen sie eindeutig. Dann ist offen, ob `Kerze.Schluss` die Instanz oder die Kerze des Auslösers meint (req-fach-051), und damit auch, ob die Zeile zu `Kerze` in 3.6 greift. In den Bausteinen stünde „Kerze“ zweimal. Ebenso bei `Konto`, `Instrument` und `Tick`. Außerdem ergibt die Regel Kennungen, die keine einfachen Namen sind: Der Standardname „1-2-3-Trend (Markttechnik)“ ergibt `1_2_3_trend_markttechnik` mit einer Ziffer am Anfang, der Name „20“ ergibt `20`, ein Name nur aus Sonderzeichen eine leere Kennung. `str-01` wird im Browsertest (7) aus der Bibliothek aufgebaut und erhält diese Standardnamen, wenn der Test nicht umbenennt.
- Gruppe: Sache der Spezifikation.
- Fragen: Gehören die Namen der Objekte der Anwendung und der Funktionen zu dem Namensraum, gegen den die Bibliothek Kennungen eindeutig macht? Wie wird eine Kennung gebildet, die nicht mit einem Buchstaben beginnen würde oder leer wäre? Wie löst die Typprüfung `Kerze` auf, wenn eine Instanz mit dem Namen „Kerze“ auf der Zeichenfläche liegt?

### N2 – Ein Element, das ein Objekt zeigt, hat zwei Namen

- Fundstelle: 3.3, Absätze „Element“ (Name; „Ein Element, das ein Objekt zeigt, enthält die Instanz“) und „Instanz“ (Name); 3.7, erster Punkt. Dagegen req-ui-003 („Elemente, die ein Objekt zeigen, tragen den Namen des Objekts“) und req-ui-016 („genau einen Namen“).
- Sachverhalt: Nach 3.3 haben Element und enthaltene Instanz je ein Feld „Name“. Wie beide zueinander stehen, sagt die Spezifikation nicht. Genau dieses Nebeneinander war die Ursache von M14. In der Datei des Auftraggebers hat das Element die Bezeichnung „EMA20“ und die Instanz den Namen `ema20`. 3.7 sagt nicht, welcher davon der Name der Instanz in 2.0 wird.
- Gruppe: Sache der Spezifikation.
- Frage: Hat ein Element, das ein Objekt zeigt, im Dokument nur den Namen der Instanz, oder sind beide Felder stets gleich?

### N3 – Umwandlung der Strategie des Auftraggebers: Kennung unbenannter Bedingungen und angezeigte Namen

- Fundstelle: 3.7, erster Punkt („die Kennung im Ausdruck ist der bisherige Name“); 3.3 (jede Bedingung und Berechnung hat eine Kennung). Datei `ema-trendfolge-auftraggeber.strategy.json`, Element „Kreuzen“ mit `"name": null`. Beschreibung des Prototyps, „Was simuliert ist“, letzter Punkt; `strategiedesign-01.md`, Abschnitt „Wo der Prototyp liegt“.
- Sachverhalt: Für die Bedingung „Kreuzen“ liefert die Regel in 3.7 keine Kennung. Die Strategie des Auftraggebers zeigt nach der Regel in 3.7 die Namen `order_ausgefuehrt`, `kreuzen_gegen_die_position`, `zeiteinheit`, `stop_abstand` und `risiko_je_trade`. Der bestätigte Prototyp zeigt dieselbe Strategie mit „Order ausgeführt“, „Kreuzen gegen die Position“, „Zeiteinheit“, „Stop-Abstand“ und „Risiko je Trade“. Der Prototyp nennt das als simuliert. Die Spezifikation übernimmt es nicht und sagt dem Auftraggeber nicht, dass er nach dem Öffnen andere Namen sieht als im Prototyp.
- Gruppe: Sache der Spezifikation.
- Fragen: Wie entsteht die Kennung einer Bedingung oder Berechnung ohne bisherigen Namen? Soll die Umwandlung Namen in Programmierschreibweise wie im Prototyp in lesbare Namen umsetzen, oder wird der Auftraggeber darauf hingewiesen, dass er sie selbst umbenennt?

### N4 – `VORHER` in req-fach-014 und Funktionsnamen der Norm in der Spezifikation

- Fundstelle: Fachmodell req-fach-014 („In Ausdrücken liefert die Funktion `VORHER` (gespeichert `PREVIOUS`)“, Beispiele `VORHER(EMA_H1.Wert)`); req-fach-036 (deutsche Funktionsnamen offen); `str-03` Abschnitt 2 (`VORHER(EMA20.Wert)`). Dagegen Spezifikation 3.4, dritter Punkt („Gespeichert und eingegeben werden die Namen aus der Norm“), und 10 Punkt 3 (bestätigt am 2026-10-16).
- Sachverhalt: Nach req-fach-014 heißt die Funktion im Ausdruck `VORHER` und nur gespeichert `PREVIOUS`. Nach der Spezifikation ist `VORHER` in der Formelansicht eine unbekannte Funktion. Die Festlegung 3 hat der Auftraggeber bestätigt. req-fach-014 wurde am 2026-10-19 geändert und nennt `VORHER` weiter.
- Gruppe: Folgt aus einer Festlegung (Festlegung 3 vom 2026-10-16), Projektleiter, sofern der Softwarearchitekt die Spezifikation nicht anpasst.
- Frage: Wird req-fach-014 an Festlegung 3 angeglichen, oder nimmt die Formelansicht `VORHER` an und zeigt es in Deutsch?

### N5 – Zulässige Argumente von `PREVIOUS` nicht festgelegt

- Fundstelle: 3.4, dritter Punkt und Absatz „Bausteine“ (Kreuzung mit beliebigen Werten A und B). Fachmodell req-fach-014.
- Sachverhalt: req-fach-014 legt den früheren Wert nur für Eigenschaften von Objekten mit Zeiteinheit, für den Tick und für Ergebnisse von Berechnungen und Bedingungen fest. Die Spezifikation sagt nicht, was die Typprüfung bei anderen Argumenten tut: Strategieparameter, `Konto`, `Order`, `Position`, eigene Indikatoren ohne Zeiteinheit, feste Werte (etwa „EMA 20 kreuzt 50“) und zusammengesetzte Ausdrücke mit Objekten verschiedener Zeiteinheiten wie `PREVIOUS(ema_h1.Wert - ema_m15.Wert)`. Für diese Fälle gibt es keine Bedeutung für die spätere Ausführung (Abschnitt 1, req-system-004). Die Testfälle sind nicht betroffen.
- Gruppe: Lücke in den Dokumenten des Auftraggebers, nicht blockierend; die Regel der Typprüfung ist Sache der Spezifikation.
- Frage: Welche Argumente lässt die Typprüfung für `PREVIOUS` zu, und was meldet sie bei den übrigen?

### N6 – `Instrument` ohne Instanz im Ablauf und in anderen Regeln

- Fundstelle: 3.5, Absatz unter dem Ausdruck (gilt nur für „Risiko je Trade“); 6, Regel `mindestvolumen` (`Instrument.Mindestvolumen`) und `str-01` (`Instrument.Pip`, `Instrument.Spread` im Hauptablauf). Fachmodell req-fach-051 regelt `Kerze` und `Tick` ohne Instanz, nicht `Instrument`.
- Sachverhalt: Startet ein `Kerzenschluss` mit einem festen anderen Instrument den Ablauf, ist `Kerze` die Kerze dieses Instruments. Ob `Instrument` ohne Instanz dann das Instrument der Anwendung oder des Auslösers ist, legt kein Dokument fest. Für Regeln steht die Bedeutung nur bei „Risiko je Trade“, nicht allgemein.
- Gruppe: Lücke in den Dokumenten des Auftraggebers, nicht blockierend; für Regeln Sache der Spezifikation.
- Frage: Was bezeichnet `Instrument` ohne Instanz im Ablauf, und gilt die Aussage aus 3.5 für jede Regel?

### N7 – Parameter `Instrument` und `Zeiteinheit` eines selbst angelegten Indikators

- Fundstelle: 3.3, Tabelle der Vorlagen, Zeile `Indikator` (nur eigene Parameter); 3.1, Absatz „Parameter `Instrument`“ („jeder Indikator“). Fachmodell req-fach-053 („jeder Indikator hat den Parameter `Instrument`“) und req-fach-054 („Jeder Indikator hat die Parameter `Instrument` und `Zeiteinheit`“).
- Sachverhalt: Für `Instrument` gilt 3.1 auch für eigene Indikatoren. Für `Zeiteinheit` sagt die Spezifikation nichts. Davon hängt die Bedeutung von `PREVIOUS` ab („Bei einem Objekt mit Zeiteinheit“, req-fach-014).
- Frage: Haben Vorlagen vom Objekttyp `Indikator` die Parameter `Instrument` und `Zeiteinheit` fest, oder legt der Anwender sie als eigene Parameter an?

### N8 – Datentypen der Eigenschaften von `Markttechnik`

- Fundstelle: 3.2, Zeile „Indikatoren“ („Eigenschaften nach Indikator Markttechnik“); `indikator-markttechnik.md` Abschnitt 4 (`Trend intakt` und `Punkt 1/3 endgültig` mit den Werten `ja`, `nein`); Spezifikation 6, `str-01` (`AND(mt_signal.trend_intakt; …)`).
- Sachverhalt: Abschnitt 6 behandelt `trend_intakt` als Wahrheitswert. Wäre es eine Auswahl mit `ja` und `nein`, wäre `AND(mt_signal.trend_intakt; …)` ein Typfehler und `str-01` nicht fehlerfrei. Die Spezifikation nennt die Datentypen nicht.
- Frage: Sind `Trend intakt` und `Punkt 1/3 endgültig` Wahrheitswerte mit den Beschriftungen „ja“ und „nein“?

### N9 – Verbindungen, die der Aufbau nicht vorsieht

- Fundstelle: 3.3, Absatz „Verbindung“ (Quelle und Ziel beliebige Elemente); 3.6; 5.3, vierter Punkt (Elemente in einen Rahmen ziehen oder herausziehen). Fachmodell req-fach-015 und req-fach-046 (Auslöser steht am Anfang), req-fach-049a.
- Sachverhalt: Die Spezifikation schließt nur die Verbindung vom Ausgang `gestellt` aus. Nicht geregelt sind: eine Verbindung vom Hauptablauf zu einem Element einer Verwaltung und zurück, zwischen zwei Verwaltungen, eine Verbindung zu einem Auslöser und eine Ablaufverbindung zu einer Instanz. Ein Element einer Verwaltung, das der Hauptablauf erreicht, hätte keine bestimmte `Order`. Das ist derselbe Grund, aus dem 3.3 die Verbindung vom Ausgang `gestellt` verbietet. Zieht der Anwender ein verbundenes Element in einen Rahmen oder heraus, entsteht genau so eine Verbindung, wenn die Oberfläche die Verbindungen nicht löst. Die Testfälle enthalten keine solche Verbindung.
- Gruppe: Sache der Spezifikation.
- Fragen: Sind diese Verbindungen im Dokument zulässig? Wenn nicht: Meldet die Konsistenzprüfung sie, und was geschieht mit den Verbindungen, wenn ein Element in einen Rahmen oder heraus gezogen wird?

### N10 – Wortlaut von req-ablauf-007 und Grundlage der Ausnahme für die leere Strategie

- Fundstelle: 3.6, zweite und letzte Zeile, Absatz unter der Tabelle; 10 Punkt 17. Dagegen req-ablauf-007 („Element des Ablaufs ohne Verbindung (Fehler)“, „Kein Element ‚Order aufgeben‘ erreichbar (Hinweis)“).
- Sachverhalt: In einem Ablauf ohne Auslöser meldet die Spezifikation ein Element ganz ohne Verbindung nicht. req-ablauf-007 nennt es ohne Ausnahme einen Fehler. Die Spezifikation stützt sich auf req-fach-015 in der Fassung vom 2026-10-19 („Der Aufbau darf die Auswertung ohne Auslöser nicht ausschließen“). Das ist nachvollziehbar, die Dokumente des Auftraggebers widersprechen sich an dieser Stelle aber weiter. Die Ausnahme für die leere Strategie nennt als Grundlage „Plan `wp02` Abnahmekriterium 2“. Der Plan wird neu erstellt. Danach fehlt diese Grundlage (siehe N1 aus `specification-6.md`).
- Gruppe: Folgt aus einer Festlegung (req-fach-015 vom 2026-10-19 und Abnahmekriterium 2 von `wp02`), Projektleiter.
- Frage: Wird req-ablauf-007 an req-fach-015 und an die Ausnahme für die leere Strategie angeglichen, bevor der neue Plan die Grundlage „Plan `wp02`“ ersetzt?

### N11 – Herkunft mitgelieferter Vorlagen speichert einen übersetzbaren Namen

- Fundstelle: E4 und 3.3, Absatz „Instanz“ (Herkunft mit „Name der Vorlage zum Zeitpunkt des Einfügens“). Dagegen 3.7, letzter Absatz („keine übersetzten Texte“), 3.2 („Risiko je Trade“ in Deutsch und Englisch) und M4.
- Sachverhalt: Bei „Risiko je Trade“ und bei mitgelieferten Objekttypen ist der Name der Vorlage ein übersetzter Text. Speichert die Instanz ihn, zeigt die englische Oberfläche „aus Vorlage Risiko je Trade“. Das ist der Sachverhalt von M4. Die Datei des Auftraggebers enthält `"template_title": "Risiko je Trade"`.
- Frage: Speichert die Herkunft bei mitgelieferten Vorlagen und Objekttypen nur die Kennung, und die Oberfläche zeigt den Namen in der gewählten Sprache?

### N12 – Anzeigeform der Objekte der Anwendung in der gewählten Sprache

- Fundstelle: 3.4, Absatz „Gespeicherte Form und Anzeigeform“ („die Namen der Strategie und die Beschriftungen der Eigenschaften und Werte“). Fachmodell req-fach-036 („Das gilt ebenso für die Namen der Objekttypen der Anwendung“).
- Sachverhalt: Die Anzeigeform nennt die Namen der Objekte der Anwendung nicht. In der englischen Oberfläche bleibt offen, ob `Konto.Kapital` oder `Account.Capital` erscheint und ob die Eingabe beides annimmt.
- Frage: Zeigt die Anzeigeform `Konto`, `Order`, `Strategie` und die übrigen Objekte der Anwendung in der gewählten Sprache?

### N13 – Entfernen eines verwendeten Objekts: Meldung, optionale Belegungen, Strategieparameter

- Fundstelle: 5.4, letzter Punkt („eine Datenverbindung wird ‚nicht belegt‘; die Konsistenzprüfung meldet das“); 3.6, Zeile „fehlerhafter Ausdruck … unbekannter Name (auch ein entferntes Objekt …)“ und Zeile „Ausdruck fehlt oder enthält einen leeren Platz“; req-param-006.
- Sachverhalt: Erstens meldet 3.6 einen optionalen Parameter oder eine KANN-Eigenschaft ohne Belegung nicht, was req-param-006 entspricht. 5.4 sagt aber, die Prüfung melde jede so entstandene „nicht belegt“-Stelle. Zweitens sagt 5.4 nicht, was mit einer Belegung mit der Bindungsart „Strategieparameter“ geschieht, wenn der Strategieparameter entfernt wird. Drittens nennt 3.6 für ein entferntes Objekt den Befund „unbekannter Name“, 5.4 einen leeren Platz. Wann welcher Befund entsteht, etwa bei einem Ausdruck mit Schreibfehler, der keine Bausteine hat, ist nicht gesagt.
- Fragen: Welche Belegung bleibt nach dem Entfernen bei optionalen Parametern und bei der Bindungsart „Strategieparameter“, und welcher Befund entsteht dann? Wann ersetzt die Bibliothek einen Namen durch einen leeren Platz, und wann bleibt er als unbekannter Name stehen?

### N14 – Dürfen Instanzen frei auf der Zeichenfläche liegen?

- Fundstelle: 3.3, Absatz „Element“ (Lage, wenn verschoben); 5.3, zweiter Punkt („Der Anwender kann ein Element verschieben“). Dagegen req-ui-017 („liegen nicht frei auf der Zeichenfläche, sondern geordnet in einem eigenen Bereich“).
- Frage: Bleibt eine Instanz beim Verschieben im Bereich „Objekte und ihre Werte“, oder gilt für sie die gespeicherte Lage wie für Elemente des Ablaufs?

### N15 – Einschränkungen der Abschnitte ohne Begründung

- Fundstelle: 3.3, Absatz „Abschnitt“ („Ein Element gehört höchstens zu einem Abschnitt, und nur zu einem Abschnitt seines Ablaufs“).
- Sachverhalt: req-ui-017 und req-ui-006 schränken Abschnitte nicht ein. Nach „Keine Einschränkung ohne Erfordernis“ braucht eine Einschränkung eine begründete technische Erfordernis in der Spezifikation. Die Begründung fehlt.
- Kritikpunkt: Begründung ergänzen oder Einschränkung entfernen.

### N16 – Prüfkriterien der Fenstergrößen enger als req-system-024

- Fundstelle: 5.1, Absatz „Geprüfte Fenstergrößen“; 7, Browsertest („Anordnung in den sechs Fenstergrößen … mit geöffneter ‚EMA-Trendfolge‘“). Dagegen req-system-024 („keine Inhalte übereinander“, „alle Funktionen bleiben erreichbar und bedienbar“).
- Sachverhalt: Geprüft werden nur die Hauptbereiche bei geöffneter Strategie. Menü, Dialoge (Öffnen, Einstellungen, Rückfragen, „Über pipwerk Studio“), Vorlagenansicht, Formeleditor und geführter Aufbau sind in den kleinen Größen nicht Gegenstand der Prüfung. Die Beschreibung des Prototyps sagt: „Eingabe per Touch ist nicht geprüft.“ Die Größe 390 × 844 ist ein Smartphone. Ob Ablauf- und Datenverbindungen dort ohne Ziehen herstellbar sind, ergibt sich für Ablaufverbindungen aus 5.3 (Anklicken) und für Werte aus 5.4 (Wahl in den Bausteinen). Geprüft wird es nicht.
- Frage: Reichen die Kriterien aus 5.1 als Nachweis für „alle Funktionen erreichbar und bedienbar“, oder werden Dialoge und Bearbeitung in der kleinsten Größe mitgeprüft?

### N17 – Klick auf die Zahl der Befunde: Spezifikation und Prototyp weichen ab

- Fundstelle: 5.1, Zeile „Kopfzeile“ („Zahl der Befunde, ein Klick führt zum ersten“). Prototyp `src/App.tsx`, Zeile 54: Der Klick öffnet die Eigenschaftenansicht der Strategie.
- Frage: Welches Verhalten gilt? Nach Abschnitt 5, Einleitung, geht die Spezifikation vor. Ist die Abweichung vom bestätigten Prototyp beabsichtigt?

### N18 – Inhalt der Anwenderdokumentation unvollständig beschrieben

- Fundstelle: 9, vierter Punkt. Dagegen req-system-020 („die Bedienung der Benutzeroberfläche müssen vollständig beschrieben werden“) und M13. Bestehend: `docs/user/pipwerk-studio.md`, Abschnitt 2, „Web-API ausprobieren“, mit Schritten der Form „Erwartet: Status 201, `findings` ist leer“ auf Grundlage von `contracts/strategies/v1/testcases/`.
- Sachverhalt: Die Spezifikation nennt die Arbeitsabläufe aus 5.5, Bausteine und Formelansicht sowie die Befunde. Nicht genannt sind die Bedienung der Zeichenfläche aus 5.3 (Ablauf- und Datenverbindungen, Verwaltung, Abschnitte, Ausrichtung, Umschalter der Linien, Legende), der Streifen der Strategieparameter, die Bedienung in kleinen Fenstern mit Reitern und Leiste und das Speichern einer Instanz als Vorlage. Der bestehende Abschnitt „Web-API ausprobieren“ enthält Prüfschritte mit erwarteten Ergebnissen. Nach dem Grundsatz aus M1 gehören sie nicht in das Anwenderhandbuch. Mit Format 2.0 stimmen auch die genannten Dateien nicht mehr. 9 nennt nur das Verschieben der Testfälle.
- Kritikpunkt: Die Aufzählung in 9 deckt die Bedienung nicht vollständig ab. Der bestehende Abschnitt zur Web-API ist nicht berücksichtigt.

### N19 – Veraltete Aussagen zu Alembic

- Fundstelle: 4.1, zweiter Punkt („Mit dieser Schemaänderung wird Alembic eingeführt“); 7, Backend („Migration einer Datenbank des bisherigen Schemas“); 9, erster Punkt („ersetzt die bisherige Aussage in Abschnitt 2.1, dass Alembic nicht eingesetzt wird“). Dagegen `docs/technical/pipwerk-studio.md`, Abschnitt 2.1: Alembic ist mit den Revisionen `0001` und `0002` eingeführt (`wp01`).
- Kritikpunkt: Der neue Plan baut auf der Spezifikation auf. Erledigte Teile könnten erneut geplant werden.

### N20 – Händlersprache für alle sichtbaren Texte

- Fundstelle: 3.1, Zeile „Beschriftung“ (Händlersprache für Typen); 3.6, erster Absatz (Texte der Befunde); 5.1, Absatz unter der Tabelle. Dagegen M8: „Dieselbe Sprache gilt für alle übrigen sichtbaren Texte (Eigenschaftenansicht, Befunde, Dialoge)“.
- Sachverhalt: Die Spezifikation verlangt Händlersprache für Typen, Funktionen und Erklärungen, nicht ausdrücklich für Befunde, Dialoge und Rückfragen.
- Frage: Gilt die Vorgabe aus M8 für alle sichtbaren Texte, und wird das in 5.1 festgehalten?

### N21 – Erlaubte Bindungsarten bei Eigenschaften und ihre Begründung

- Fundstelle: 3.1, Zeile „Parameter“ (erlaubte Bindungsarten) und Zeile „Eigenschaften“ (ohne diese Angabe); Absatz „Bindungsarten eines Parameters oder einer Eigenschaft“; 5.4, zweiter Punkt („soweit die Typbeschreibung sie erlaubt“).
- Sachverhalt: Die Zeile „Eigenschaften“ führt die erlaubten Bindungsarten weiter nicht (Rest von H4 aus `specification-4.md`). Welche Typen welche Bindungsarten ausschließen und warum, sagt die Spezifikation nicht. Fachmodell req-fach-046 lässt jede Bindungsart zu. Nach „Keine Einschränkung ohne Erfordernis“ braucht jeder Ausschluss eine Begründung.
- Kritikpunkt: Angabe in der Zeile „Eigenschaften“ ergänzen und Ausschlüsse begründen oder keine vorsehen.

### N22 – „Eingang“ in zwei Bedeutungen

- Fundstelle: 3.3, Absatz „Eingang“ (verbundener Wert eines Elements); 3.6, Spalte „Stufe“ („Fehler, Eingang ohne Wert“ bei fehlendem Ausdruck, Pflichtparameter und MUSS-Eigenschaft); 9, Glossar („Eingang“ als neuer Begriff). req-ablauf-007 („Eingang ohne Wert“).
- Sachverhalt: Nach 3.3 ist ein Eingang ein verbundener Wert. In 3.6 bezeichnet „Eingang ohne Wert“ einen Parameter, eine Eigenschaft oder einen Ausdruck ohne Wert, wie in req-ablauf-007. Ein Leser kann den Befund „Eingang ohne Wert“ auf einen verbundenen Wert beziehen.
- Kritikpunkt: Ein Begriff mit zwei Bedeutungen in Spezifikation und Glossar. Er sollte eindeutig sein, bevor das Glossar ergänzt wird.

## Nicht geprüft

- Dokumente des Auftraggebers selbst, Glossar und Arbeitspaketplan (laut Prüfauftrag nicht Gegenstand). Wo ein Hinweis sie berührt, ist er einer Gruppe zugeordnet.
- Code und Testumgebung.
- Der Prototyp im Browser. Der Abgleich beruht auf Beschreibung und Quelltext. Die Browsertests des Prototyps habe ich nicht ausgeführt; ihr Ergebnis „34 passed“ steht in `strategiedesign-01.md` und ist von mir nicht nachgeprüft.
