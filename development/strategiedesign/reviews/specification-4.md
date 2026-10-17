# Prüfbericht QA – Ergänzung der Spezifikation in Phase 4, Durchlauf 4

- Bezug: `strategiedesign/wp02`, Prüfauftrag `development/strategiedesign/reviews/specification-4-order.md`
- geprüfter Commit: `aed72522227dcf84e476daff6585fc1d785fd618` (`origin/main`, letzter Commit, der den Prüfauftrag ändert)
- Gegenstand: `development/strategiedesign/specification.md` Abschnitt 3.1 (neue Zeilen der Tabelle, Absatz darunter) und Status-Zeile „ergänzung in Phase 4“; `development/strategiedesign/plan.md` Paket `wp02` (Umfang, Nicht-Umfang, umgesetzte Teile), Tabelle der Abdeckung, Status, Änderungsnachweis
- Art: Prüfung nur der geänderten Stellen und ihres Verhältnisses zu Spezifikation, Plan und den Dokumenten laut `scope.md` (Entwicklungsverfahren, „Umfang der Prüfungen“)

## Ergebnis: bestanden

Kein blockierender Befund. Sieben Hinweise (H1 bis H7). Sie verhindern das Bestehen nicht.

## Grundlagen der Prüfung

- Änderung: `git show aed7252` (Spezifikation 10 Zeilen, Plan 10 Zeilen)
- Anlass: Testbericht Funktion `01-functiontest-1.md` zu Auftrag 01 von `wp02`, Hinweis H1 (geprüfter Commit `f22b0a98f3ef22d649fd1dc85bdeb2f91436a3b4`). Gelesen im Berichtsverzeichnis des Bezugs. Auf `origin/strategiedesign/wp02` liegt der Bericht noch nicht.
- `docs/technical/pipwerk-studio.md` Abschnitt 2.3, „Ableitungen aus den Typbeschreibungen“, Punkte 1 bis 6, auf `origin/strategiedesign/wp02-01`
- Spezifikation Abschnitte 2 (E2, E7), 3.1 bis 3.4, 3.6, 5.2, 5.3, 7, 9; Plan `wp01` bis `wp03`
- Anforderungen: req-fach-006, req-param-004, req-ui-002, req-ui-005, req-ui-006, req-ui-013, req-ablauf-002 (`anforderungen-strategiedesigner.md`); req-fach-046, req-fach-049a, req-fach-051 (`fachmodell.md`)
- Zum Vergleich mit dem umgesetzten Stand von `wp01`: `packages/domain-core/src/pipwerk_domain/typedesc.py`, `docs/technical/pipwerk-domain.md`, `docs/technical/glossar.md`

## Ergebnis je Prüffrage

### 1. Setzen die ergänzten Felder die Anforderungen richtig um, ohne Widerspruch?

Erfüllt.

- „Ausgänge“ mit der Verwaltung: Das passt zu Spezifikation 3.3 (Verwaltung am Ausgang `gestellt`), zu 5.3 (Rahmen am Ausgang `gestellt`), zu req-fach-049a, req-ui-002 und req-ui-006. Es passt auch zum Abnahmekriterium 4 von `wp02`. Die Oberfläche braucht damit keine Kenntnis des Typs „Order aufgeben“ (E2, req-param-004).
- „benannt“: Das passt zu 3.2, letzter Absatz (Bedingung und Berechnung tragen einen Namen), zu 3.4 (Name mit `.Ergebnis`) und zu req-fach-005.
- „Vorgabe der neuen Strategie“: Das passt zu 5.2, Zeile „Strategie anlegen“ (`Kerzenschluss` ohne Zeiteinheit) und zu req-ablauf-002.
- „Strategieparameter“: Das passt zu 3.4 (`Strategie` mit einem Strategieparameter), zu req-fach-046 (Beispiel `Strategie.Handelszeiteinheit`), zu req-fach-051 (Zeile `Strategie`: „mit ihren Strategieparametern und Eigenschaften“) und zu req-ui-013.
- Werte der Zeiteinheit: Das passt zur Liste der Datentypen in 3.1 („alle Zeiteinheiten von MetaTrader 5 von M1 bis MN1“).
- Kein ergänztes Feld widerspricht E2, 3.2, 3.3, 3.4, 5.2 oder 5.3. Keines verlangt eine Änderung an Strategiedokumenten oder an deren Schemata (3.7).

### 2. Ist jeder ergänzte Teil durch `wp02` abgedeckt? Ist der Plan widerspruchsfrei?

Erfüllt, mit Hinweisen H5 und H6.

- `wp02` Umfang nennt alle fünf Ergänzungen in Bibliothek, Web-API und deren Beschreibung. Umgesetzte Teile und die Tabelle der Abdeckung (Zeile „3.1 bis 3.6“) ordnen sie `wp02` zu.
- Der Nicht-Umfang von `wp02` nimmt die Ergänzung der Typbeschreibung aus. Damit widerspricht er dem Umfang nicht.
- `wp03` (Nicht-Umfang: keine Änderungen an Bibliothek und Web-API) bleibt widerspruchsfrei. `wp03` hängt von `wp02` ab und findet die Ergänzung dann schon vor.
- `wp01` ist `done`. Die Zuordnung zu `wp02` verlangt an `wp01` nichts Neues. Zur Angabe „Abschnitte 3.1 bis 3.7“ bei `wp01` siehe H5.

### 3. Bleiben die Abnahmekriterien von `wp02` prüfbar?

Erfüllt. Die Kriterien 1 bis 12 sind im Commit nicht geändert (Diff von `plan.md`). Kriterium 4 (Verwaltung als Rahmen am Ausgang `gestellt`) wird mit dem Feld der Ausgänge erst erfüllbar. Kriterien 2 und 6 bleiben unverändert prüfbar.

## Blockierende Befunde

keine

## Hinweise (verhindern das Bestehen nicht)

### H1 – Mehr als ein Ausgang mit der Verwaltung ist nicht ausgeschlossen

- Fundstelle: Spezifikation 3.1, Zeile „Ausgänge“ („je Ausgang, ob an ihm die Verwaltung des Elements hängt“). Dazu 3.3, Absatz „Element“: Ein Element nennt nur die Kennung des Elements, zu dessen Verwaltung es gehört, keinen Ausgang.
- Sachverhalt: Das Feld steht je Ausgang. Ein Typ könnte also mehrere Ausgänge mit der Verwaltung kennzeichnen. Über den Einstiegspunkt `pipwerk.element_types` (E7) ist das auch bei fremden Typen möglich. Das Dokument könnte dann nicht sagen, an welchem Ausgang ein Element der Verwaltung hängt.
- Frage: Darf höchstens ein Ausgang je Typ die Verwaltung tragen? Wer prüft das, wenn ein Typ angemeldet wird?

### H2 – Verwaltung allgemein in 3.1, aber in 3.3, 3.4 und 3.6 nur für „Order aufgeben“

- Fundstelle: Spezifikation 3.1, Zeile „Ausgänge“, und Absatz unter der Tabelle. Dagegen 3.3 („die Kennung des Elements ‚Order aufgeben‘, zu dessen Verwaltung es gehört“), 3.4, Tabelle des Zusammenhangs („Eigenschaften des Ordertyps dieses ‚Order aufgeben‘“), 3.6 („außerhalb einer Verwaltung“).
- Sachverhalt: Das neue Feld lässt jeden Typ eine Verwaltung tragen. Zusammenhang der Typprüfung und Befunde sind aber nur für „Order aufgeben“ festgelegt. Für die mitgelieferten Typen gibt es keinen Widerspruch.
- Frage: Ist eine Verwaltung an einem anderen Typ als „Order aufgeben“ vorgesehen? Wenn nein: Soll 3.1 das sagen? Wenn ja: Welche `Order` sieht ein Ausdruck in einer solchen Verwaltung?

### H3 – Kein oder mehrere Auslöser mit „Vorgabe der neuen Strategie“

- Fundstelle: Spezifikation 3.1, Zeile „Vorgabe der neuen Strategie“; 5.2, Zeile „Strategie anlegen“.
- Sachverhalt: Das Feld steht je Typ. Mit E7 können weitere Auslöser es ebenfalls setzen. Es kann auch sein, dass kein Auslöser es setzt. Die Spezifikation legt für beide Fälle nichts fest. Für die mitgelieferten Typen ist es eindeutig.
- Frage: Was zeigt „Neue Strategie“, wenn kein Auslöser oder mehr als einer das Feld setzt?

### H4 – „zulässige Werte“ bei Eigenschaften fehlt in der Tabelle 3.1

- Fundstelle: Spezifikation 3.1, Absatz unter der Tabelle: „Parameter und Eigenschaften vom Datentyp Zeiteinheit nennen ihre zulässigen Werte wie eine Auswahl.“ Die Zeile „Eigenschaften“ der Tabelle nennt aber nur „Kennung, Datentyp, MUSS oder KANN, Beschriftung“ und keine zulässigen Werte. Die Zeile „Parameter“ nennt sie.
- Sachverhalt: Der neue Satz verweist bei Eigenschaften auf eine Angabe, die die Tabelle nicht führt. Dieselbe Lücke besteht schon für Eigenschaften vom Datentyp Auswahl (zum Beispiel `Richtung`, Phase der Markttechnik; 3.1, letzter Absatz, und 3.4 prüfen Texte gegen deren Werte). Die Bibliothek führt die Angabe bereits (`typedesc.py`, `PropertyDescription.choices`; `docs/technical/pipwerk-domain.md`, Zeile `properties`). Auch die erlaubten Bindungsarten fehlen in der Zeile „Eigenschaften“, obwohl der Absatz „Bindungsarten“ sie für Parameter und Eigenschaften nennt. Die technische Dokumentation des Entwicklers (Abschnitt 2.3, Punkt 1) nennt diese Stelle.
- Kritikpunkt: Tabelle und neuer Satz passen nicht zueinander.

### H5 – Angabe bei `wp01` „Abschnitte 3.1 bis 3.7“ jetzt zu weit

- Fundstelle: `plan.md`, `wp01`, „Umgesetzte Teile der Spezifikation“: „Abschnitte 3.1 bis 3.7“. Dagegen die Tabelle der Abdeckung, Zeile „3.1 bis 3.6“: „in Phase 4 ergänzte Felder der Typbeschreibung (3.1) `wp02`“.
- Sachverhalt: Wer nur `wp01` liest, versteht die ergänzten Felder als dort umgesetzt. Die Tabelle der Abdeckung stellt das richtig.
- Frage: Soll die Angabe bei `wp01` die ergänzten Felder ausnehmen?

### H6 – Tests und Dokumentation der Bibliothek für die ergänzten Felder keinem offenen Paket zugeordnet

- Fundstelle: `plan.md`, `wp02` Umfang, Punkte „Tests“ und „Dokumentation“; umgesetzte Teile („Abschnitt 7 Punkte Oberfläche und Browsertest“, „Abschnitt 9 Punkt 1 (Oberfläche) und Punkte 3 und 4 für dieses Paket“); Tabelle der Abdeckung, Zeilen „7 Bibliothek, Testfalldokumente, Backend, Skripte | `wp01`“, „9 technische Dokumentation der Bibliothek | `wp01`“, „9 Glossar | `wp01`; neue Begriffe der Oberfläche `wp02`, `wp03`“; technische Abnahme von `wp02` („darin die Tests der Oberfläche und die Browsertests“).
- Sachverhalt: `wp02` ändert jetzt Bibliothek, Web-API und `contracts/api/pipwerk-studio/v1/openapi.json`. Nach Spezifikation Abschnitt 7 brauchen die Änderungen Tests der Bibliothek und des Backends. Nach Abschnitt 9 Punkte 1, 2 und 4 brauchen sie Dokumentation. Die Felder der Typbeschreibung stehen heute in `docs/technical/pipwerk-domain.md` (Tabelle mit `outputs` „`id` und `label`“), im Eintrag „Typbeschreibung“ von `docs/technical/glossar.md` und in Spezifikation 9 Punkt 4 („Typbeschreibung (Felder nach Abschnitt 3.1)“). Der Plan weist diese Teile für die neuen Felder nur `wp01` zu, und `wp01` ist `done`. `wp02` nennt nur Oberfläche, `docs/technical/pipwerk-studio.md` „zum Aufbau der Oberfläche“ und neue Begriffe der Oberfläche.
- Kritikpunkt: Ohne Zuordnung bleiben die genannten Dokumente nach `wp02` unvollständig. Eine Prüfung der neuen Felder in Bibliothek und Backend verlangt der Plan nicht ausdrücklich. Die Einzelheiten der Tests gehören nach dem Entwicklungsverfahren in die Aufträge.

### H7 – Weitere Ableitungen der Oberfläche bleiben ohne Feld

- Fundstelle: `docs/technical/pipwerk-studio.md` Abschnitt 2.3, „Ableitungen aus den Typbeschreibungen“, Punkte 1 und 6 (Zweig `strategiedesign/wp02-01`). Dazu Spezifikation 3.1, Absatz unter der Tabelle, und 3.4, Tabelle des Zusammenhangs.
- Sachverhalt: Die Ergänzung deckt die Punkte 2 bis 5 ab. Offen bleiben:
  - Punkt 1: Welcher Parameter von „Order aufgeben“ den Ordertyp wählt, aus dem die Eigenschaften der Eigenschaftenansicht kommen.
  - Punkt 6: Welches Objekt der Anwendung für die Eigenschaften der Ordertypen steht. Die Oberfläche bestimmt es als das Objekt, „dessen Eigenschaften alle in jedem Ordertyp stehen“ (`commonOrderObject`).
  
  Beides leitet die Oberfläche weiter aus der Form der Beschreibungen ab. Für `Strategie` gibt es jetzt ein eigenes Feld, für `Order` und die Ordertypen nicht.
- Frage: Reicht die Ableitung aus der Form für E2 und req-param-004? Oder braucht die Verbindung von `Order` zu den Ordertypen ebenfalls ein Feld wie „Strategieparameter“?

### Randbemerkung zu H7, Namen unter `Strategie.`

Mit dem Feld „Strategieparameter“ bietet die Ausdruckseingabe unter `Strategie.` die Eigenschaften (`wartende_orders`, `offene_positionen` und weitere, `pipwerk-domain.md` Zeile `Strategie`) und die Strategieparameter in einer Liste an. Die Spezifikation legt nicht fest, was gilt, wenn ein Strategieparameter so heißt wie eine Eigenschaft von `Strategie`. `pipwerk-domain.md`, Abschnitt zu „Name doppelt vergeben“, behandelt nur Doppelungen unter den Strategieparametern. Frage: Ist ein solcher Name ein Befund?

## Nicht geprüft

- Umsetzung der Felder in Code und Web-API: Sie ist noch nicht vorhanden und gehört nicht zu diesem Prüfauftrag.
- Testumgebung: Für diese Prüfung der Spezifikation nicht nötig, deshalb nicht verwendet.
