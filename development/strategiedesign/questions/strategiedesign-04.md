# Frage strategiedesign-04 – Ort der Fenster, Bestätigung des Prototyps

- Vorhaben: `strategiedesign`, ref `strategiedesign`
- von: Softwarearchitekt
- an: Projektleiter
- Stand: 2026-10-23

## Unterbrochene Aufgabe

`revise` für `strategiedesign`: Einwände des Auftraggebers zum Prototyp aus `questions/strategiedesign-03.md`, Abschnitt „Antwort“, Punkt 1 (Meldung vom 23. Oktober 2026, 05:06 UTC; die Sitzung dazu ist abgebrochen) und Nachtrag Punkte 2 bis 4 (Meldung von 05:30 UTC). Diese Frage beantwortet beide Meldungen. Stand:

- Prüfung req-ui-016 (Hinweise und Dialoge nur in der Eigenschaftenansicht) durch die QA, Durchlauf 17: nicht bestanden, ein Befund, den nur der Auftraggeber entscheiden kann (B1, Frage 1 unten). Die Hinweise H2 bis H6 sind in der Spezifikation entschieden (`reviews/requirements-17.md`).
- Prüfung req-ui-016 (Beschreibung der Eigenschaften und Methoden, Ausgang mit Namen) und req-ui-017 (Löschen einer Verbindung, offen) durch die QA, Durchlauf 18: bestanden, ohne Frage an den Auftraggeber (`reviews/requirements-18.md`). Hinweise H1, H2 und H4 in der Spezifikation eingearbeitet.
- Spezifikation: Abschnitte 3.3, 5.1, 5.3, 5.4, 5.5, 7 und 10 angeglichen (Änderungsnachweis, zwei Zeilen vom 2026-10-23). Noch nicht von der QA geprüft.
- Prototyp nach `prototype/order-05.md` und `prototype/order-06.md` geändert, Stand unten.
- Wartet auf die Antworten: übrige Anpassung der Spezifikation, Prüfung durch die QA, `present`; danach der neue Plan.

## Wo der Prototyp liegt

- Zum Ausprobieren: `development/strategiedesign/prototype/pipwerk-studio-prototyp.html` auf `main`, im Browser öffnen, ohne Server und ohne Internetverbindung. Gespeichertes aus einem früheren Test bleibt im Browser erhalten; „Neue Strategie“ beginnt immer leer.
- Bildschirmbilder, darunter die Lage der Objekte vorher und nachher und die Eigenschaftenansicht eines EMA: `strategiedesign/proto-studio:components/pipwerk-studio/prototype/screenshots/`.
- Beschreibung und Entscheidungen des Entwicklers: `strategiedesign/proto-studio:components/pipwerk-studio/prototype/README.md`.

Stand des Prototyps: Zweig `strategiedesign/proto-studio`, Commit `fe421f504726797e8d9635c3cac1a79eaa61a1f8` (darunter `78f197b25723b149340b2edd477f64d52732c401` für Auftrag 05). Alle technischen Abnahmekriterien beider Aufträge sind laut Bericht des Entwicklers erfüllt. Nachweis: Browsertests auf diesem Commit, `226 passed` (Chromium, Firefox, WebKit, Bildschirmbilder).

## Was sich geändert hat

1. **Hinweise nur in der Eigenschaftenansicht** (Einwand 1). Die Zeichenfläche zeigt keinen Hinweis mehr. „Keine Strategie geöffnet“ steht einmal, in der Eigenschaftenansicht. Dort stehen auch der Hinweis der leeren Strategie mit „Assistent starten“, der Assistent und kurze Meldungen wie „Gespeichert“. Wählt der Anwender während des Assistenten ein Element, zeigt die Eigenschaftenansicht das Element, darüber „Assistent, Schritt n von 5“ und „Assistent fortsetzen“. In schmalen Fenstern bleibt „Elementbibliothek zeigen“; liegt eine Meldung vor, während die Eigenschaftenansicht verdeckt ist, ist ihr Reiter markiert. Die Fenster „Über pipwerk Studio“, „Öffnen“, „Einstellungen“, die Rückfragen und die Fehlermeldungen zum Bestätigen sind unverändert, bis Frage 1 beantwortet ist.
2. **Lage der Objekte** (Einwand 2). Den beschriebenen Kasten konnte der Entwickler im geprüften Stand nicht nachstellen. Die vorgelegte Datei ist dieselbe, die er geprüft hat. In der „EMA-Trendfolge“, `str-01`, `str-03`, nach dem Assistenten und nach dem Einfügen eines EMA lag jedes verbundene Objekt schon bei dem Element seiner ersten Verwendung, und die Linie dorthin kreuzte nichts. Gefunden und geändert: Ein Objekt lag bei senkrechtem Ablauf 150 Pixel neben seinem Element, mehr als doppelt so weit wie der Abstand zweier Schritte. Jetzt liegt es dicht daneben. Gefunden, nicht geändert:
   - Objekte, die noch kein Element verwenden, stehen in einer Spalte links vom Ablauf. Das ist zum Beispiel im Assistenten nach dem Schritt „Indikatoren“ so, solange es noch keine Bedingung gibt.
   - Bei „Weitere Verwendungen: Alle“ und bei einem gewählten Element laufen die Linien weiterer Verwendungen lang über die Fläche.
   
   Siehe Frage 2.
3. **Beschreibung der Eigenschaften und Methoden** (Einwand 3). Die Eigenschaftenansicht jedes Objekts zeigt zu jeder Eigenschaft und Methode Name, Datentyp und eine Beschreibung, was der Wert aussagt und wozu er dient, in Deutsch und Englisch. Für Order, Position und Strategie, die nicht auf der Fläche liegen, steht das in der Eigenschaftenansicht der Strategie unter „Order, Position und Strategie“. Die Zeilen eines Objekts auf der Zeichenfläche zeigen den Namen vor dem Datentyp. Eine Stelle, an der nur „Zahl“ stand, fand der Entwickler nicht. „Zeitpunkt“ heißt als Datentyp jetzt „Datum und Uhrzeit“. Die Beschreibungen hat überwiegend der Entwickler formuliert; das Fachmodell nennt einen Zweck nur bei `Kapital`, den Punkten des 1-2-3-Trends und den Wendepunkten des ZigZag. Liste im README.
4. **Löschen einer Verbindung** (Punkt 4): unverändert über die Eigenschaftenansicht; offener Punkt des Auftraggebers.

## Fragen

### 1. Ort der Fenster

Benötigte Entscheidung: req-ui-016 sagt „Hinweise und Dialoge … erscheinen in der Eigenschaftenansicht und nur dort“. Der Einwand nannte nur „Keine Strategie geöffnet“ und den Assistenten. Andere Anforderungen verlangen Fenster, bei denen die übrige Oberfläche gesperrt ist: „Über pipwerk Studio“ (req-ui-010), die Rückfrage beim Schließen mit ungespeicherten Änderungen (speichern, verwerfen, abbrechen) und vor dem Löschen (req-ablauf-004, req-ablauf-005) und Fehlermeldungen, die bestätigt werden müssen, etwa wenn Speichern fehlschlägt (req-ui-011). Dazu kommen „Öffnen“ und „Einstellungen“. Gilt „nur in der Eigenschaftenansicht“ auch für diese Fenster? (Befund B1 in `reviews/requirements-17.md`.)

Vorschlag: Nein. Die Regel gilt für Hinweise, den Assistenten und kurze Meldungen. Die genannten Fenster bleiben Fenster über der Oberfläche, weil sie eine Antwort verlangen, bevor es weitergeht. So zeigt es der Prototyp jetzt. req-ui-016 wird entsprechend eingegrenzt.

### 2. Lage der Objekte

Benötigte Entscheidung: Wo hat der Auftraggeber den Kasten mit dem EMA und die langen, sich kreuzenden Linien gesehen: in welcher Strategie, nach welchem Schritt, senkrecht oder waagerecht? Ist es eine der beiden Stellen unter „Was sich geändert hat“, Punkt 2?

Vorschlag: Der Auftraggeber prüft die Lage im neuen Stand. Bleibt der Einwand, nennt er die Stelle, am besten mit einem Bildschirmbild. Gilt er für Objekte ohne Verbindung, legt die Oberfläche sie dort ab, wo der Anwender sie fallen lässt, statt in einer Spalte. Gilt er für die Linien weiterer Verwendungen, beginnt der Umschalter auf „Aus“.

### 3. Bestätigung des Prototyps

Benötigte Entscheidung: Bestätigt der Auftraggeber den Prototyp im Stand `fe421f504726797e8d9635c3cac1a79eaa61a1f8` als Vorlage für Spezifikation und Umsetzung? Er soll dafür „Neue Strategie“ mit dem Assistenten, seine „EMA-Trendfolge“ und die Testfälle ohne Anleitung ansehen und ändern, senkrecht und waagerecht, auch in einem schmalen Fenster, und die Beschreibungen der Eigenschaften eines EMA lesen.

Mit der Bestätigung gelten die Punkte 1 bis 12 aus `strategiedesign-02.md`, Frage 1, die Punkte 1 bis 3 aus `strategiedesign-03.md` und die Punkte 1 bis 3 oben als bestätigt, auch die Beschreibungen der Eigenschaften und Methoden. Jeder Einwand geht mit `revise` zurück.

Vorschlag: Prototyp bestätigen, mit den Antworten auf Frage 1 und 2.

## Antwort

(Projektleiter)
