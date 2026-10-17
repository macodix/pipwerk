# Spezifikation Vorhaben strategiedesign

## Status

- status: `draft`
- stand: 2026-10-17
- komponenten: `packages/domain-core` (gemeinsame Python-Bibliothek), `components/pipwerk-studio` (Backend und Oberfläche), `contracts/`
- grundlage: [scope.md](scope.md) mit den dort genannten Dokumenten des Auftraggebers; Nachprüfung der Dokumente bestanden in [requirements-7.md](reviews/requirements-7.md). Vorlagen: [Pflichtenheft](../../docs/design/planning/pflichtenheft-strategiedesigner.md) und Arbeitspakete AP2 bis AP9. Wo sie den geltenden Dokumenten widersprechen, folgt diese Spezifikation den geltenden Dokumenten (Abschnitt 1).
- prüfung: Durchlauf 1 [specification-1.md](reviews/specification-1.md) nicht bestanden, Befunde B1 bis B4 und Hinweise S1 bis S15 eingearbeitet: B1 Abschnitt 3.5, B2 Abschnitt 3.4 und Abschnitt 10 Punkt 8, B3 Abschnitt 3.3 und Abschnitt 10 Punkt 7, B4 Abschnitt 3.3; S1 Abschnitt 3.4, S2 bis S4 und S8 Abschnitte 3.1 und 3.3, S5 und S6 Abschnitte 5.1 und 5.2, S7 und S9 Abschnitt 3.1, S10 Abschnitt 3.6, S11 Abschnitt 4.1, S12 Abschnitt 3.1, S13 Abschnitt 9, S14 Abschnitt 10, S15 Abschnitt 3.7. Durchlauf 2 [specification-2.md](reviews/specification-2.md) bestanden; die Hinweise S16 bis S22 werden in den Aufträgen der Phase 4 erledigt.
- abstimmung: [specification-1.html](presentations/specification-1.html), Festlegungen 1 bis 3 und 5 bis 8 am 2026-10-16 bestätigt. Einwand zu Festlegung 4 eingearbeitet in Abschnitt 3.4, Abschnitt 3.6 und Abschnitt 10 Punkt 4, Nachprüfung in [specification-3.md](reviews/specification-3.md).
- ergänzung in Phase 4 (`wp02`): Abschnitt 3.1, Felder der Typbeschreibung „Ausgänge“ mit der Verwaltung, „benannt“, „Vorgabe der neuen Strategie“, „Strategieparameter“ und die Werte der Zeiteinheit. Anlass: Testbericht `strategiedesign/wp02:development/strategiedesign/wp02/tests/01-functiontest-1.md`, Hinweis H1; ohne diese Angaben kann die Oberfläche die Verwaltung nicht am Ausgang `gestellt` zeigen und die Strategieparameter nicht vorschlagen. Prüfung in [specification-4.md](reviews/specification-4.md), Bestätigung offen.

## 1. Gegenstand

pipwerk Studio erhält den Strategiedesigner: Strategien und Vorlagen (Indikator, Trend, Regel, Regelwerk) anlegen, auf der Zeichenfläche gestalten, der Konsistenzprüfung unterziehen, speichern, öffnen und löschen. Nachweis sind die Testfälle `str-01` und `str-03`: Beide lassen sich in der Oberfläche vollständig gestalten, speichern und wieder laden, und die Konsistenzprüfung meldet für sie keinen Fehler.

Nicht Gegenstand sind die Ausführung von Strategien (Debuggen, Testen, Handeln), die Berechnung von Indikatoren und die Auswertung von Ausdrücken. Die Spezifikation legt die Bedeutung von Ausdrücken und Regeln aber so fest, dass Strategietester und Handelssystem sie später ohne Änderung des Strategiedokuments ausführen können (req-system-004).

Abweichungen von den Vorlagen, weil die geltenden Dokumente inzwischen anders festlegen:

| Vorlage | jetzt | Grundlage |
|---|---|---|
| eigenständig gespeicherte Objekte per Verweis in der Strategie (PH-05) | Instanzen sind Kopien in der Strategie, Vorlagen sind eigene Dateien | req-fach-013a, req-param-005 |
| Löschschutz verwendeter Objekte (PH-08) | Löschen nach Rückfrage, Anzeige der Verwendungen | req-ablauf-006 |
| genau ein Auslöser, keine Funktionen in Ausdrücken (PH-05, PH-11) | mindestens ein Auslöser, Auslöser auch in der Verwaltung; OpenFormula mit Funktionen | req-fach-046, req-fach-036 |
| Index in Datenbanktabellen (PH-08) | kein Index in der Datenbank, die Dateien sind die einzige Quelle | req-ui-009, Entscheidung E5 |
| Indikatoren mit Berechnung (PH-11) | Indikatoren beschreiben Parameter und Eigenschaften, ohne Berechnung | Abschnitt 1, Ausführung nicht Gegenstand |

## 2. Architekturentscheidungen

- E1 Gemeinsame Python-Bibliothek: Typbeschreibungen, Elementregister, Objektmodell, Ausdrücke mit Typprüfung, Konsistenzprüfung und das Lesen und Schreiben der Dokumente liegen in `packages/domain-core` (Paket `pipwerk_domain`), nicht in Backend oder Oberfläche (req-system-007). Das Objektmodell besteht aus einfachen Python-Klassen ohne Abhängigkeit von Frameworks. Nur das Teilpaket für Dokumente (`pipwerk_domain.documents`) verwendet Pydantic. pipwerk Studio bindet die Bibliothek als Pfadabhängigkeit mit festgeschriebener Version in `uv.lock` ein.
- E2 Die Oberfläche enthält keine Kenntnis einzelner Element- oder Objekttypen. Elementbibliothek, Elemente und Eigenschaftenansicht entstehen aus den Typbeschreibungen der Web-API (req-fach-006, req-param-004, req-ui-005). Konsistenzprüfung und Prüfung von Ausdrücken laufen im Backend über die Bibliothek; die Oberfläche zeigt nur deren Ergebnis.
- E3 Das Strategiedokument ist maßgeblich. Das Modell von React Flow ist Darstellung und wird beim Laden aus dem Dokument erzeugt; jede Änderung auf der Zeichenfläche ändert das Dokument (req-ui-004).
- E4 Instanzen sind vollständige Kopien in ihrer Strategie beziehungsweise in ihrem Regelwerk. Sie nennen ihre Herkunft (Kennung und Bezeichnung der Vorlage zum Zeitpunkt des Einfügens, Objekttyp). Kein Dokument verweist zur Ausführung auf ein anderes Dokument. Löschen oder Ändern einer Vorlage wirkt damit nicht auf Instanzen (req-fach-013a, req-ablauf-006).
- E5 Objektverzeichnis ohne Index in der Datenbank. Das Backend liest die Dateien bei Bedarf; ein Zwischenspeicher im Prozess ist zulässig, wenn er bei geänderter Datei neu liest. Ein Index wäre nur eine zweite Fassung derselben Daten. Die Menge der Objekte eines Anwenders ist klein; wird das Lesen zu langsam, kann ein Index ergänzt werden, der sich aus den Dateien neu erzeugen lässt (req-ui-009).
- E6 Mitgelieferte Objekttypen und die mitgelieferte Regelvorlage „Risiko je Trade“ stammen aus der Bibliothek, nicht aus dem Objektverzeichnis. Sie sind in jeder Installation gleich und werden nicht geändert oder gelöscht. Eigene Abwandlungen entstehen, indem der Anwender eine Instanz als neue Vorlage speichert (Abschnitt 10, Punkt 2).
- E7 Erweiterbarkeit: Elementtypen und Objekttypen werden im Elementregister angemeldet. Weitere Python-Pakete melden Typen über den Einstiegspunkt `pipwerk.element_types` an (req-fach-024, req-fach-009). Objekttypen ohne Programmierung legt der Anwender als Vorlage vom Objekttyp `Indikator` oder `Trend` an (Abschnitt 3.3).
- E8 Prototypen sind nicht nötig. Alle Teile verwenden bekannte Verfahren der festgelegten Werkzeuge: Zerlegung von Ausdrücken mit einem eigenen Parser, Gruppen von React Flow für die Verwaltung, Dateien mit JSON.

## 3. Gemeinsame Python-Bibliothek

### 3.1 Typbeschreibung und Elementregister

Jeder Elementtyp und jeder Objekttyp liefert eine Typbeschreibung. Die Oberfläche verwendet nur diese.

| Feld | Inhalt |
|---|---|
| Kennung | sprachneutral, zum Beispiel für Elementtypen `flow.condition`, für Objekttypen der Name aus dem Fachmodell |
| Art | Auslöser, Element des Ablaufs, Objekttyp (Indikator, Trend, Regel, Regelwerk), Objekt der Anwendung, Ordertyp |
| Beschriftung | Name und Beschreibung in Deutsch und Englisch |
| Parameter | Kennung, Datentyp, Pflicht oder optional, Standardwert, zulässige Werte, erlaubte Bindungsarten, Beschriftung; optional die Angabe, bei welchem Wert eines anderen Parameters er gilt (zum Beispiel die Parameter eines Berechnungsverfahrens des Trends, req-param-005) |
| Eigenschaften | Kennung, Datentyp, MUSS oder KANN, Beschriftung; bei Ordertypen zusätzlich, ob der Anwender sie belegt. `Instrument`, `Konto`, `Order-ID`, `Status` und `Strategie-ID` belegt die Anwendung, nicht der Anwender (req-fach-019, req-fach-053). |
| Ausgänge | Kennungen und Beschriftungen der Ausgänge eines Elements des Ablaufs, zum Beispiel `wahr` und `falsch`; je Ausgang, ob an ihm die Verwaltung des Elements hängt (bei „Order aufgeben“ der Ausgang `gestellt`, Abschnitt 3.3) |
| benannt | ob ein Element des Ablaufs einen Namen trägt, unter dem Ausdrücke sein Ergebnis ansprechen (Bedingung, Berechnung, Abschnitt 3.2) |
| Vorgabe der neuen Strategie | bei Auslösern, ob eine neue Strategie mit einem Element dieses Typs beginnt (`Kerzenschluss`, Abschnitt 5.2) |
| Strategieparameter | bei Objekten der Anwendung, ob Ausdrücke über dieses Objekt die Strategieparameter ansprechen (`Strategie`, Abschnitt 3.4) |
| Regeln zulässig | ob dem Element Regeln und Regelwerke zugeordnet werden können (req-ui-012) |
| auf Zeichenfläche | ob der Typ als Element auf die Zeichenfläche gelegt werden kann (req-fach-051) |

Die Felder „Ausgänge“ mit der Verwaltung, „benannt“, „Vorgabe der neuen Strategie“ und „Strategieparameter“ braucht die Oberfläche, weil sie nach E2 keine einzelnen Typen kennt. Parameter und Eigenschaften vom Datentyp Zeiteinheit nennen ihre zulässigen Werte wie eine Auswahl.

Kennungen von Eigenschaften, Parametern und festgelegten Werten werden aus dem deutschen Namen gebildet: Kleinbuchstaben, ä, ö, ü als ae, oe, ue, ß als ss, Leerzeichen und Bindestrich als `_`, andere Zeichen entfallen (req-fach-036, zum Beispiel `trend_intakt`, `punkt_13` aus „Punkt 1/3“, `aufwaerts`, `stop_loss`). Objekte der Anwendung tragen als Kennung ihren Namen aus dem Fachmodell (`Konto`, `Order`). Die vollständigen Listen der Kennungen legen die Aufträge fest.

Datentypen: Zahl, Ganzzahl, Prozent (im Ausdruck als Anteil, 1 % ist 0,01), Wahrheitswert, Text, Auswahl (feste Werte mit Kennungen), Zeiteinheit (alle Zeiteinheiten von MetaTrader 5 von M1 bis MN1), Zeitpunkt, Datum, Ausdruck.

Bindungsarten eines Parameters oder einer Eigenschaft (Glossar „Bindungsart“, req-fach-046, req-param-003): fester Wert, Parameter (ein Strategieparameter oder, innerhalb einer Vorlage, ein Parameter der Vorlage, zum Beispiel die Zeiteinheit des Trends für seine Indikatoren, req-fach-011), Ausdruck (darin auch Ergebnisse von Berechnungen und Regeln und Eigenschaften anderer Objekte), bei der Anwendung übergeben. Eine Eigenschaft der Order, die eine Regel mit `bestimmen()` erhält, hat keine eigene Bindungsart: Die Regel ist der Strategie oder dem Element zugeordnet und nennt die Eigenschaft selbst (Abschnitt 3.5). Damit gibt es genau einen Weg und die Reihenfolge nach req-fach-046.

Ein Text, der die Kennung eines Werts einer Auswahl ist, belegt eine Eigenschaft dieser Auswahl, etwa `"buy"` die Richtung. Die Typprüfung prüft feste Texte gegen die Werte der Auswahl. Ein Text, der erst bei der Ausführung entsteht, wird dort geprüft; ist er kein Wert der Auswahl, ist die Eigenschaft nicht bestimmbar.

### 3.2 Mitgelieferte Typen

| Gruppe | Typen | Grundlage |
|---|---|---|
| Auslöser | `Kerzenschluss` (Parameter Zeiteinheit, Pflicht), `Tick` | req-fach-053; `externes Ereignis` ist offen und wird nicht angeboten |
| Elemente des Ablaufs | Bedingung (Ausdruck; Ausgänge `wahr`, `falsch`), Berechnung (Ausdruck; Ergebnis; Ausgang `weiter`), Parameter setzen (Strategieparameter, Ausdruck; `weiter`), Order aufgeben (Ordertyp, Eigenschaften der Order; `gestellt`, `nicht gestellt`; Regeln zulässig), Order ändern (Preis, Limitpreis, Stop-Loss, Take-Profit, Gültigkeit, jeweils optional, ohne Wert unverändert; `geändert`, `nicht geändert`; Regeln zulässig), Order löschen (`weiter`), Position ändern (Stop-Loss, Take-Profit; `geändert`, `nicht geändert`; Regeln zulässig), Position schließen (Volumen optional; `weiter`; Regeln zulässig) | req-fach-047 bis req-fach-049a, req-ui-012 |
| Ordertypen | `MarketOrder`, `StopOrder`, `LimitOrder`, `StopLimitOrder`, `CloseOrder` mit den Eigenschaften aus req-fach-019 und req-fach-028 bis req-fach-032. `CloseOrder` entsteht nur über „Position schließen“. | req-fach-025 bis req-fach-032 |
| Objekte der Anwendung | `Konto`, `Instrument`, `Kerze` (Parameter Zeiteinheit), `Tick`, `Order`, `Position`, `Strategie` mit den Eigenschaften aus req-fach-051, req-fach-052, req-fach-046 | req-fach-051 |
| Indikatoren | `EMA`, `ATR`, `Markttechnik` mit Parametern und Eigenschaften aus req-fach-054 und [Indikator Markttechnik](../../docs/design/domain/indikator-markttechnik.md), ohne Berechnung | req-fach-054 |
| allgemeine Objekttypen | `Indikator`, `Trend`, `Regel`, `Regelwerk` (Abschnitt 3.3) | req-fach-013a, req-fach-010, req-fach-034, req-fach-041 |
| Regelvorlage | „Risiko je Trade“ (Abschnitt 3.5) | req-core-002 |

Ein Element des Ablaufs trägt eine Bezeichnung, anfangs den Namen seines Elementtyps als Tätigkeit, vom Anwender änderbar (req-ui-003). Bedingung und Berechnung tragen zusätzlich einen Namen ohne Leerzeichen, unter dem Ausdrücke ihr Ergebnis ansprechen (`einstieg.Ergebnis`, req-fach-005).

### 3.3 Strategie, Instanzen und Vorlagen

Strategie (req-fach-046): Kennung (UUID), Bezeichnung, Beschreibung, Strategieparameter (Name, Datentyp, Wert oder „bei der Anwendung“), Regeln und Regelwerke der Strategie (Instanzen in festgelegter Reihenfolge), Elemente, Verbindungen.

Element: Kennung, Elementtyp, Bezeichnung beziehungsweise Name, Lage auf der Zeichenfläche, Belegung der Parameter und Eigenschaften mit Bindungsart, zugeordnete Regeln und Regelwerke, und die Kennung des Elements „Order aufgeben“, zu dessen Verwaltung es gehört (leer im Hauptablauf). Ein Element, das ein Objekt zeigt, enthält die Instanz.

Instanz (req-fach-013a, req-param-005): Name (ohne Leerzeichen), Herkunft (Objekttyp, Kennung und Bezeichnung der Vorlage oder leer bei Einfügen eines Objekttyps), Parameterwerte und den gesamten übrigen Inhalt der Vorlage nach der Tabelle unten: eigene Parameter, eigene Eigenschaften mit ihren Ausdrücken, enthaltene Instanzen, Regeln, Ausdrücke. Zur Ausführung braucht eine Instanz ihre Vorlage nicht (E4). Eine Instanz ist in der Strategie in vollem Umfang änderbar.

Verbindung: Quelle (Element und Ausgang), Ziel (Element). Eine Verbindung darf zurückführen (req-fach-047). Die Verwaltung einer Order ist der Bereich der Zeichenfläche, der am Ausgang `gestellt` eines Elements „Order aufgeben“ hängt; ihre Elemente, darunter eigene Auslöser, tragen dessen Kennung (req-fach-049a, req-fach-015). Eine Verwaltung kann wieder ein Element „Order aufgeben“ mit eigener Verwaltung enthalten.

Vorlagen (req-fach-013a): Kennung, Bezeichnung, Beschreibung, Objekttyp, Standardwerte der Parameter, dazu je Objekttyp:

| Objekttyp | Inhalt |
|---|---|
| mitgelieferter Indikator (EMA, ATR, Markttechnik) | nur Standardwerte der Parameter |
| `Indikator` | eigene Parameter (Name, Datentyp, Pflicht, Standardwert), enthaltene Instanzen von Indikatoren, enthaltene Regeln und Regelwerke (Instanzen), eigene Eigenschaften, jede mit Name, Datentyp und Ausdruck. Ein Ausdruck kann das Ergebnis einer enthaltenen Regel verwenden (`regel.Ergebnis`); so besteht ein Indikator aus Regeln, aus mitgelieferten Indikatoren als fest programmierten Einheiten oder aus beidem (req-fach-013a, req-fach-009) |
| `Trend` | Parameter Zeiteinheit und Berechnungsverfahren (req-fach-010, req-param-005). Ein Berechnungsverfahren ist im Elementregister mit eigener Typbeschreibung seiner Parameter angemeldet; die Eigenschaftenansicht zeigt nach der Wahl dessen Parameter (Abschnitt 3.1). Mitgeliefert ist das Verfahren „Ausdruck“: enthaltene Instanzen von Indikatoren, Regeln und Regelwerke wie beim `Indikator`, je ein Ausdruck für die Eigenschaft `Richtung` und für weitere eigene Eigenschaften. |
| `Regel` | Parameter, fachlicher Ausdruck, bestimmte Eigenschaft und Vergleich beim Prüfen (Abschnitt 3.5) |
| `Regelwerk` | Regeln als Instanzen in festgelegter Reihenfolge, optional ein Ausdruck für das Gesamtergebnis (req-fach-041 bis req-fach-045) |

Eigenschaften enthaltener Indikatoren bleiben deren Eigenschaften und sind über die Struktur des umgebenden Objekts ansprechbar (req-fach-012): `trend_h1.ema20.Wert` ist die Eigenschaft `Wert` der Instanz `ema20` im Trend `trend_h1`. Diese Schreibweise füllt den in req-fach-012 offenen Punkt vorläufig (Abschnitt 10, Punkt 7).

Namensräume: Innerhalb einer Vorlage sind ihre eigenen Parameter ohne Punkt und ihre enthaltenen Instanzen und Regeln mit ihrem Namen ansprechbar. In der Strategie sind Instanzen, Bedingungen, Berechnungen, Strategieparameter und die Regeln der Strategie ansprechbar; die Regeln eines Elements nur in den Ausdrücken der Regeln dieses Elements. Eine Regel in einem Regelwerk heißt innerhalb des Regelwerks `regel`, außerhalb `regelwerk.regel`. Namen müssen innerhalb ihres Namensraums eindeutig sein. Dieselbe Vorlage an der Strategie und an einem Element ergibt zwei Instanzen in zwei Namensräumen und ist kein Fehler (req-fach-041, req-fach-046).

### 3.4 Ausdrücke

Ausdrücke von Regeln, Bedingungen, Berechnungen, Belegungen und eigenen Eigenschaften folgen einer Auswahl aus OpenFormula (req-fach-036, req-fach-048). Die Bibliothek zerlegt jeden Ausdruck, prüft Namen und Typen und liefert Befunde mit Stelle im Ausdruck. Ausgewertet wird in diesem Vorhaben nicht.

- Werte: Zahlen mit Dezimalpunkt, Texte in doppelten Anführungszeichen, `TRUE()` und `FALSE()`, Prozentzeichen nach einer Zahl.
- Operatoren: `+ - * / ^ &`, Vergleich `= <> < <= > >=`, Vorzeichen, Klammern. Die logischen Operatoren sind in OpenFormula die Funktionen `AND`, `OR`, `NOT`.
- Funktionen der ersten Auswahl: `IF`, `AND`, `OR`, `NOT`, `MIN`, `MAX`, `ABS`, `FLOOR` (abrunden auf eine Schrittweite), `CEILING` (aufrunden auf eine Schrittweite), `ISNA`, `IFNA`, `ISBLANK` und die eigene Funktion `PREVIOUS` (req-fach-014). Argumente werden mit `;` getrennt. Gespeichert und eingegeben werden die Namen aus der Norm.
- Namen: `Objekt.Eigenschaft` in Punkt-Schreibweise, bei enthaltenen Objekten mehrstufig (Abschnitt 3.3). Objekt ist ein Objekt der Anwendung, eine Instanz, der Name einer Bedingung oder Berechnung mit `.Ergebnis`, der Name einer Regel mit `.Ergebnis`, oder `Strategie` mit einem Strategieparameter. Parameter einer Regel und eigene Parameter einer Vorlage stehen ohne Punkt. Welche Namen ein Ausdruck sieht, legen die Namensräume in Abschnitt 3.3 fest. Groß- und Kleinschreibung von Namen und Funktionen wird nicht unterschieden. Gespeichert wird die Schreibweise der Kennung.
- Festgelegte Werte einer Auswahl stehen als Text mit ihrer Kennung, zum Beispiel `markttechnik_h1.phase = "bewegung"`. Der Vergleich mit einem Text, der kein Wert dieser Auswahl ist, ist ein Fehler.

Werte, die fehlen, sind für die spätere Ausführung so festgelegt:

- Spricht ein Ausdruck eine Eigenschaft an, die das Objekt im Zusammenhang der Auswertung nicht hat, ist der Wert „nicht verfügbar“ (`#N/A` nach OpenFormula). Das gilt für eine Eigenschaft, die der Ordertyp nicht hat (`Order.Limitpreis` bei einer Stop-Order), für `Position` in einer Regel, die auf eine Order angewendet wird (Hinweis H23), und für `Position` in der Verwaltung, solange die Order noch keine Position hat. Jede Rechnung mit „nicht verfügbar“ ergibt „nicht verfügbar“, auch eine Bedingung von `IF`; `ISNA` und `IFNA` prüfen und ersetzen ihn. `IF` wertet nur den gewählten Zweig aus. Die Auswertung vermerkt bei „nicht verfügbar“, ob er von einer Eigenschaft stammt, die der Ordertyp nicht hat.
- Eine Eigenschaft ohne Wert ist „leer“: eine KANN-Eigenschaft ohne Wert oder eine Eigenschaft, die das Objekt gerade nicht belegt, etwa `Punkt 2` der Markttechnik ohne Trend. Rechnung und Vergleich mit „leer“ sind ein Fehler, ebenso eine Division durch null und die übrigen Fehlerwerte von OpenFormula. `ISBLANK` prüft auf „leer“.

Wirkung bei der Ausführung, wenn das Ergebnis eines Ausdrucks ein Fehler, „leer“ oder „nicht verfügbar“ ist:

| Stelle | Wirkung | Grundlage |
|---|---|---|
| Regel, Ergebnis „nicht verfügbar“ von einer Eigenschaft, die der Ordertyp nicht hat | sie wird auf diese Order nicht angewendet, ohne Fehler oder Meldung | req-fach-046 |
| bestimmende Regel, Fehler, „leer“ oder sonst „nicht verfügbar“ | die Eigenschaft ist nicht bestimmbar | req-fach-021 |
| prüfende Regel, Fehler, „leer“ oder sonst „nicht verfügbar“ | die Prüfung ist nicht erfüllt | req-fach-021 |
| Bedingung | jedes Ergebnis außer „wahr“ nimmt den Ausgang `falsch` (Abschnitt 10, Punkt 8) | req-fach-047 |
| Berechnung | das Ergebnis ist dieser Wert; wer es verwendet, verhält sich nach dieser Tabelle | req-fach-048 |
| Belegung einer Eigenschaft bei „Order aufgeben“, „Order ändern“, „Position ändern“, „Position schließen“ | die Eigenschaft ist nicht bestimmbar: Ausgang `nicht gestellt` beziehungsweise `nicht geändert`, bei „Position schließen“ wird nichts geschlossen und der Ablauf geht weiter | req-fach-049, req-fach-049a |
| Parameter setzen | der Strategieparameter bleibt unverändert, der Ablauf geht weiter | req-fach-047 |
| eigene Eigenschaft eines Indikators oder Trends | die Eigenschaft ist „leer“ | req-fach-013a |

Strategietester und Handelssystem protokollieren jeden Fehler einer Auswertung mit Element und Ausdruck; das legt ihre Spezifikation fest.

Die Typprüfung kennt zu jedem Ausdruck seinen Zusammenhang:

| Zusammenhang | `Order` | `Position` |
|---|---|---|
| Regel der Strategie oder eines Elements | Eigenschaften aller Ordertypen | Eigenschaften der Position |
| Ausdruck in der Verwaltung | Eigenschaften des Ordertyps dieses „Order aufgeben“ | Eigenschaften der Position |
| Ausdruck im Hauptablauf, Indikator, Trend | Fehler (req-fach-051) | Fehler (req-fach-051) |
| Regel in einem Indikator oder Trend, auch in einem Regelwerk darin | Fehler | Fehler |

Eine Eigenschaft ist in einer Regel bekannt, wenn mindestens ein Ordertyp sie hat. Eine Regel kann unabhängig von Instanzen definiert werden (req-fach-040): Spricht der Ausdruck einer Vorlage einen Namen an, der weder Objekt der Anwendung noch Parameter der Regel ist, meldet die Prüfung der Vorlage einen Hinweis; geprüft wird der Name in jeder Strategie, die die Regel enthält. Die Vorlage einer Regel oder eines Regelwerks darf `Order` und `Position` ansprechen. Eine Regel, deren Ergebnis ein anderer Ausdruck verwendet, wird im Zusammenhang dieses Ausdrucks ausgewertet; das gilt auch für eine Regel im Ausdruck einer anderen Regel (req-fach-038).

Eine Regel, die `Order` oder `Position` anspricht, selbst oder über das Ergebnis einer anderen Regel, steht nur dort, wo eine Order vorhanden ist: als Regel der Strategie, am Element „Order aufgeben“ und in dessen Verwaltung (Entscheidung des Auftraggebers am 2026-10-16, Hinweis H24):

- Enthält ein Indikator oder Trend eine solche Regel, auch in einem Regelwerk, ist schon das Einfügen ein Fehler, gleich ob ein Ausdruck ihr Ergebnis verwendet. Das gilt für die Vorlage und für jede Instanz davon.
- Im Hauptablauf steht eine Regel nur an „Order aufgeben“ (req-ui-012; die übrigen Elemente mit Regeln sind außerhalb einer Verwaltung ein Fehler, Abschnitt 3.6). Verwendet ein Ausdruck im Hauptablauf das Ergebnis einer solchen Regel, ist das ein Fehler als Verwendung im Ablauf außerhalb einer Verwaltung (req-fach-051).
- In der Verwaltung sieht die Regel die Order und Position der Verwaltung.

Damit gibt es keine Regel, die nur deshalb nicht angewendet wird, weil es keine Order gibt. Nicht angewendet wird eine Regel nur nach req-fach-046, wenn der Ordertyp eine angesprochene Eigenschaft nicht hat. `Position` in einer Regel, die auf eine Order angewendet wird, fängt der Ausdruck mit `ISNA` oder `IFNA` ab, wie „Risiko je Trade“ (Abschnitt 3.5); sonst gilt die Tabelle oben.

### 3.5 Regeln: bestimmen und prüfen, Regelvorlage „Risiko je Trade“

Eine Regel hat neben Kennung, Bezeichnung, Parametern und fachlichem Ausdruck (req-fach-035) zwei technische Angaben, die req-fach-020 und req-ablauf-007 voraussetzen:

- bestimmte Eigenschaft: die Eigenschaft der Order, deren Wert `bestimmen()` liefert, oder leer bei einer nur prüfenden Regel. Die Konsistenzprüfung vergleicht den Ergebnistyp mit dem Datentyp dieser Eigenschaft.
- Vergleich beim Prüfen: `höchstens`, `mindestens` oder `gleich`. `prüfen()` einer bestimmenden Regel ist erfüllt, wenn der aktuelle Wert der Eigenschaft im Verhältnis zum Ergebnis des Ausdrucks steht, zum Beispiel Volumen höchstens gleich dem bestimmten Volumen. Wird die Regel auf eine Position angewendet, ist das die gleichnamige Eigenschaft der Position. Bei einer nur prüfenden Regel ist das Ergebnis ein Wahrheitswert.

Ob eine Regel bestimmt oder prüft, ergibt sich bei der Ausführung aus der Änderbarkeit der Eigenschaft (req-fach-020): Bei „Order aufgeben“ sind alle Eigenschaften änderbar; bei „Order ändern“ nur Preis, Limitpreis, Stop-Loss, Take-Profit und Gültigkeit; bei „Position ändern“ und bei der Prüfung nach der Ausführung (req-fach-021) keine Eigenschaft der Order.

Regelvorlage „Risiko je Trade“ (req-core-002):

- Parameter `Risikogrenze`, Datentyp Prozent, Pflicht, Standardwert 1 %.
- bestimmte Eigenschaft `Volumen`, Vergleich beim Prüfen `höchstens`.
- Ausdruck, hier mit Zeilenumbrüchen; `A` steht für den Abstand vom Preis bis zum Stop-Loss in Verlustrichtung und ist im gespeicherten Ausdruck an beiden Stellen ausgeschrieben:

```text
IF(ISNA(Position.Volumen);
   IF(A_Order <= 0;
      Order.Volumen;
      FLOOR(Risikogrenze * Konto.Kapital
              / (A_Order / Instrument.Tickgroesse * Instrument.Tickwert);
            Instrument.Volumenschritt));
   IF(A_Position <= 0;
      Position.Volumen;
      FLOOR(Risikogrenze * Konto.Kapital
              / (A_Position / Instrument.Tickgroesse * Instrument.Tickwert);
            Instrument.Volumenschritt)))

A_Order    = IF(Order.Richtung = "buy";
                IFNA(Order.Limitpreis; Order.Preis) - Order.Stop_Loss;
                Order.Stop_Loss - IFNA(Order.Limitpreis; Order.Preis))
A_Position = IF(Position.Richtung = "buy";
                Position.Einstiegspreis - Position.Stop_Loss;
                Position.Stop_Loss - Position.Einstiegspreis)
```

Der Ausdruck liefert das größte Volumen, abgerundet auf den Volumenschritt, bei dem der Verlust vom Preis bis zum Stop-Loss die Risikogrenze nicht übersteigt. Liegt der Stop-Loss auf oder hinter dem Preis, ist kein Verlust möglich: Der Ausdruck liefert dann das vorhandene Volumen, die Prüfung ist erfüllt, und es wird nicht durch null geteilt. Bei „Order aufgeben“ ist das Volumen in diesem Fall noch „leer“, die Regel kann es nicht bestimmen. So bildet er die Fälle ab:

| Fall | Preis | Stop-Loss | Wirkung |
|---|---|---|---|
| „Order aufgeben“ mit Markt-, Stop- oder Limit-Order | `Order.Preis` (bei der Marktorder der angenommene Preis, req-fach-019) | `Order.Stop_Loss` | bestimmt das Volumen |
| „Order aufgeben“ mit Stop-Limit-Order | `Order.Limitpreis`, der Preis, zu dem die Position entsteht | `Order.Stop_Loss` | bestimmt das Volumen |
| „Order ändern“ | wie bei „Order aufgeben“, mit den geänderten Werten | geänderter Stop-Loss | prüft das bestehende Volumen; bestimmen und prüfen rechnen bei derselben Order mit demselben Preis (N10) |
| „Position ändern“, Prüfung nach der Ausführung | `Position.Einstiegspreis` | `Position.Stop_Loss`, bei „Position ändern“ der neue | prüft das Volumen der Position; ein Stop-Loss auf oder hinter dem Einstiegspreis, etwa nachgezogen in `str-03`, erfüllt die Prüfung |
| Schließorder | `CloseOrder` hat weder Richtung noch Stop-Loss, das Ergebnis ist „nicht verfügbar“ | – | wird nicht angewendet (req-fach-046) |
| Order oder Position ohne Stop-Loss | Stop-Loss ist „leer“ | – | Fehler: Volumen nicht bestimmbar beziehungsweise Prüfung nicht erfüllt, weil der Verlust unbegrenzt ist |

### 3.6 Konsistenzprüfung

Die Konsistenzprüfung läuft beim Speichern, auf Anforderung und für Vorlagen beim Speichern der Vorlage (req-ablauf-007). Ein Befund hat Stufe (Fehler oder Hinweis), Kennung, betroffenes Element oder betroffene Instanz oder Regel (oder keines) und Angaben für den Text. Die Texte in Deutsch und Englisch stehen in der Oberfläche (req-ui-007).

| Befund | Stufe | Grundlage |
|---|---|---|
| Strategie ohne Auslöser | Fehler | req-fach-046 |
| Auslöser ohne Verbindung in den Ablauf | Fehler | req-ablauf-007 |
| Element des Ablaufs ohne eingehende Verbindung | Fehler | req-ablauf-007 |
| fehlerhafter Ausdruck: Schreibfehler, unbekannte Funktion, unbekannter Name, unbekannte Eigenschaft, unpassender Typ, unbekannter Wert einer Auswahl | Fehler | req-ablauf-007, Abschnitt 3.4 |
| Ergebnis einer bestimmenden Regel passt nicht zur bestimmten Eigenschaft | Fehler | req-ablauf-007 |
| Rückführung ohne Bedingung, die sie beendet: ein Kreis im Ablauf, auf dem keine Bedingung liegt, von der ein Ausgang aus dem Kreis hinausführt oder ohne Fortsetzung endet | Fehler | req-ablauf-007, req-fach-047 |
| Pflichtparameter ohne Wert und nicht „bei der Anwendung“ | Fehler | req-param-006 |
| MUSS-Eigenschaft der Order, die der Anwender belegt, ohne Belegung und ohne bestimmende Regel der Strategie oder des Elements | Fehler | req-fach-021 |
| Regelwerk mit Vorwärtsbezug oder Zirkelbezug | Fehler | req-fach-045 |
| `Order` oder `Position` im Ablauf außerhalb einer Verwaltung, auch über das Ergebnis einer Regel | Fehler | req-fach-051 |
| Regel, die `Order` oder `Position` anspricht, in einem Indikator oder Trend, auch in einem Regelwerk darin (Abschnitt 3.4) | Fehler | req-fach-051, Entscheidung des Auftraggebers am 2026-10-16 |
| `Kerze` ohne Instanz, wenn ein Auslöser außer `Kerzenschluss` die Auswertung startet | Fehler | req-fach-051 |
| Order ändern, Order löschen, Position ändern oder Position schließen außerhalb einer Verwaltung | Fehler | req-fach-049a |
| Name doppelt vergeben innerhalb eines Namensraums (Abschnitt 3.3) | Fehler | eindeutige Namen für Ausdrücke, req-fach-036 |
| unbekannter Elementtyp oder Objekttyp | Fehler | req-ablauf-008 |
| kein Element „Order aufgeben“ erreichbar | Hinweis | req-ablauf-007 |

### 3.7 Dokumente und Schemata

Strategie und jede Vorlage werden als JSON-Dokument geschrieben und gelesen. Kopffelder: `format` (`pipwerk.strategy`, `pipwerk.indicator`, `pipwerk.trend`, `pipwerk.rule`, `pipwerk.ruleset`) und `format_version` `1.0`. Die Pydantic-Modelle in `pipwerk_domain.documents` lehnen zusätzliche Felder ab. Aus ihnen werden die JSON-Schemata erzeugt und unter `contracts/strategies/v1/` abgelegt (req-system-022). Ein Dokument mit höherer Hauptversion wird abgelehnt.

Ein Elementtyp oder Objekttyp ist im Dokument eine Zeichenkette. Ein Dokument mit unbekanntem Typ ist deshalb gültig und wird geladen; die Konsistenzprüfung meldet den Typ (req-ablauf-008). Ein solches Element erscheint auf der Zeichenfläche mit der Kennung seines Typs und rot umrandet; es lässt sich verschieben, verbinden und löschen, seine Belegungen zeigt die Eigenschaftenansicht nur lesend und sie bleiben beim Speichern unverändert erhalten. Gespeichert werden nur Kennungen, keine übersetzten Texte (req-ui-007). Schreiben und erneutes Lesen ergeben dasselbe Objekt.

## 4. Backend von pipwerk Studio

### 4.1 Objektverzeichnis

- Einstellung „Objektverzeichnis“ in der Datenbank der Komponente (req-ui-009, req-system-016), absoluter Pfad. Solange nichts gespeichert ist, gilt `$HOME/.local/share/pipwerk/studio/objects`, unter Windows `%LOCALAPPDATA%\pipwerk\studio\objects`; wurde die Startkonfiguration unter `/etc/pipwerk` beziehungsweise `%PROGRAMDATA%\pipwerk` gefunden, `/var/lib/pipwerk/studio/objects` beziehungsweise `%PROGRAMDATA%\pipwerk\studio\objects`. Fehlt das Verzeichnis, legt das Backend es beim ersten Schreiben an.
- Die Tabelle `studio_settings` erhält dafür eine Spalte. Mit dieser Schemaänderung wird Alembic eingeführt; eine bestehende Datenbank des bisherigen Schemas wird beim Start auf den neuen Stand gebracht.
- Je Objekt eine Datei `<uuid>.<art>.json` mit `<art>` aus `strategy`, `indicator`, `trend`, `rule`, `ruleset`. Der Dateiname entsteht nur im Backend aus einer geprüften UUID. Geschrieben wird über eine temporäre Datei im selben Verzeichnis und Umbenennen.
- Eine Datei, die sich nicht lesen lässt oder dem Schema nicht entspricht, erscheint in der Liste mit Kennzeichen „nicht lesbar“ und wird nicht verändert.
- Ändern des Objektverzeichnisses (req-ablauf-009): Mit „verschieben“ verschiebt das Backend alle Dateien nach dem Muster oben in das neue Verzeichnis und speichert erst danach die Einstellung. Liegt dort schon eine Datei gleichen Namens, wird nichts verschoben und die Änderung mit Fehler abgelehnt. Scheitert das Verschieben unterwegs, holt das Backend die schon verschobenen Dateien zurück, behält die alte Einstellung und meldet den Fehler; gelingt auch das nicht, nennt die Meldung beide Verzeichnisse und die betroffenen Dateien. Ohne „verschieben“ wird nur die Einstellung gespeichert. Eine geöffnete Strategie bleibt geöffnet und wird beim nächsten Speichern in das neue Verzeichnis geschrieben.

### 4.2 Web-API

Öffentliche Web-API unter `/api/v1/` (req-system-009), beschrieben in `contracts/api/pipwerk-studio/v1/openapi.json`. `<art>` steht für `strategies`, `indicators`, `trends`, `rules`, `rulesets`.

| Methode | Pfad | Zweck |
|---|---|---|
| `GET` | `/api/v1/element-types` | alle Typbeschreibungen, die mitgelieferten Vorlagen und die Liste der Funktionen |
| `GET` | `/api/v1/<art>` | Liste mit Kennung, Bezeichnung, Beschreibung, Objekttyp, Zeitpunkt der letzten Änderung |
| `POST` | `/api/v1/<art>` | anlegen; Antwort mit Kennung und Befunden der Konsistenzprüfung |
| `GET`, `PUT`, `DELETE` | `/api/v1/<art>/{id}` | lesen, speichern (auch mit Befunden, Antwort mit Befunden), löschen |
| `GET` | `/api/v1/<art>/{id}/usages` | Strategien und Vorlagen mit Instanzen aus dieser Vorlage (req-ablauf-006) |
| `POST` | `/api/v1/check` | Konsistenzprüfung eines Dokuments ohne Speichern; liefert Befunde und je Ausdruck die erkannten Namen mit Stelle (Abschnitt 5.3) |

Interne Endpunkte für die Einstellung: `GET` und `PUT /api/studio/settings/object-directory`, beim Schreiben mit Pfad und „verschieben“ ja oder nein. Die bestehenden internen Endpunkte bleiben.

Ein Dokument, das dem Schema nicht entspricht, wird mit HTTP 422 abgelehnt; Befunde der Konsistenzprüfung verhindern das Speichern nicht (req-ablauf-005).

## 5. Oberfläche

### 5.1 Aufbau

| Bereich | Inhalt |
|---|---|
| Kopfzeile | Menü mit „Neue Strategie“, „Öffnen“, „Speichern“, „Prüfen“, „Schließen“, „Löschen“ und „Einstellungen“; rechts „Über pipwerk Studio“. Die Sprachauswahl wandert in die Einstellungen (req-ui-009). |
| links | Elementbibliothek: Auslöser, Elemente des Ablaufs, Objekte der Anwendung, die auf die Zeichenfläche gelegt werden können (`Konto`, `Instrument`, `Kerze`, `Tick`), Objekttypen, mitgelieferte und gespeicherte Vorlagen, Schaltfläche „Neues Objekt“ (req-fach-015, req-ablauf-003, req-ablauf-004) |
| Mitte | Zeichenfläche mit React Flow |
| rechts | Eigenschaftenansicht des ausgewählten Elements, der ausgewählten Regel oder, nach Klick auf die leere Zeichenfläche, der Strategie (req-ui-005) |
| Fußzeile | Backend-Status und Stand, unverändert |

Alle Texte in Deutsch und Englisch, Beschriftungen der Typen aus den Typbeschreibungen. Vom Anwender vergebene Namen und Texte werden nicht übersetzt.

### 5.2 Arbeitsabläufe

| Ablauf | Bedienung | Grundlage |
|---|---|---|
| Strategie anlegen | „Neue Strategie“ öffnet eine leere Zeichenfläche mit einem Auslöser `Kerzenschluss` ohne Zeiteinheit; gespeichert wird erst mit „Speichern“ | req-ablauf-002 |
| Objekt verwenden | Objekttyp oder Vorlage auf die Zeichenfläche ziehen; Name und Parameter in der Eigenschaftenansicht; „Als Vorlage speichern“ in der Eigenschaftenansicht der Instanz | req-ablauf-003 |
| Regeln zuordnen | in der Eigenschaftenansicht der Strategie oder eines Elements mit Regeln: Regel, Vorlage einer Regel oder eines Regelwerks aus der Elementbibliothek hinzufügen, Reihenfolge ändern, entfernen; eine Regel kann auch neu in der Strategie entstehen (Objekttyp `Regel`) | req-ui-012, req-fach-044 |
| Objekt anlegen, öffnen, ändern | „Neues Objekt“ mit Objekttyp, oder Vorlage in der Elementbibliothek öffnen. Die Vorlage erscheint in der Eigenschaftenansicht als eigene Ansicht mit den Schaltflächen „Speichern“, „Prüfen“, „Schließen“ und „Löschen“; die geöffnete Strategie bleibt dahinter unverändert offen. Enthaltene Instanzen, Regeln und Regelwerke fügt der Anwender dort aus der Elementbibliothek hinzu, ändert ihre Reihenfolge oder entfernt sie. Befunde der Vorlage stehen in dieser Ansicht bei dem betroffenen Teil. Beim Schließen mit ungespeicherten Änderungen gilt dieselbe Rückfrage wie bei einer Strategie. | req-ablauf-004, req-ablauf-007, req-ablauf-008, req-ui-011 |
| Speichern | speichert immer, zeigt danach die Befunde | req-ablauf-005 |
| Schließen | bei ungespeicherten Änderungen Rückfrage „Speichern“, „Verwerfen“, „Abbrechen“; ebenso vor „Neue Strategie“ und „Öffnen“ | req-ablauf-005 |
| Öffnen | Liste der Strategien mit Bezeichnung, Beschreibung, letzter Änderung | req-ablauf-008 |
| Löschen | Strategie über „Löschen“ in der Kopfzeile, Vorlage in ihrer Ansicht oder im Kontextmenü der Elementbibliothek; Rückfrage, bei einer Vorlage mit den Strategien und Vorlagen, die Instanzen daraus enthalten | req-ablauf-006 |
| Einstellungen | Sprache, Objektverzeichnis mit Rückfrage „Dateien verschieben?“ | req-ui-009, req-ablauf-009 |

### 5.3 Zeichenfläche und Eigenschaftenansicht

- Elemente zeigen ihre Bezeichnung beziehungsweise den Namen der Instanz und ihre Ausgänge als Anschlüsse. Verbindungen entstehen von einem Ausgang zu einem Element. Objekte auf der Zeichenfläche haben keine Anschlüsse (req-ablauf-003).
- Die Verwaltung erscheint als Rahmen, der mit dem Ausgang `gestellt` verbunden ist. Elemente, die in den Rahmen gezogen werden, gehören zur Verwaltung. Der Rahmen lässt sich einklappen (req-ui-002, req-ui-006).
- Die Eigenschaftenansicht entsteht aus der Typbeschreibung: Eingabe je Datentyp, Wahl der Bindungsart je Parameter, Herkunft der Instanz („EMA21, aus Objekttyp EMA“, req-ui-005).
- Ausdruckseingabe: Nach einem Namen und einem Punkt bietet sie die Eigenschaften dieses Objekts aus den Typbeschreibungen und der Strategie an, auch der Objekte der Anwendung (req-ui-013). Eingegeben wird mit Kennungen. Unter der Eingabe zeigt sie den Ausdruck mit den Namen in der gewählten Sprache; die erkannten Namen liefert `/api/v1/check` (req-fach-036).

### 5.4 Befunde

Befunde erscheinen ohne Meldung, die weggeklickt werden muss: Ein Element mit Fehler ist rot umrandet, mit Hinweis orange. Bei Auswahl steht der Befundtext in der Eigenschaftenansicht neben den Eigenschaften (req-ui-011). Befunde zu einer Regel der Strategie stehen bei dieser Regel, Befunde ohne Element in der Eigenschaftenansicht der Strategie, und eine Zahl in der Kopfzeile nennt die Befunde der Strategie (Abschnitt 10, Punkt 1). Eine Meldung zum Bestätigen gibt es nur bei kritischen Fehlern wie fehlgeschlagenem Speichern.

## 6. Abbildung der Testfälle

Kurzform, die vollständigen Dokumente entstehen im Auftrag. „S.“ steht für `Strategie.`, „wahr“ und „gestellt“ für die Ausgänge.

`str-01` Scalping Punkt 2 Ausbruch:

- Strategieparameter `signalzeiteinheit` und `handelszeiteinheit` (Zeiteinheit), `entry_puffer` und `stop_puffer` (Zahl, Pips). Instanzen `mt_signal` und `mt_handel` vom Objekttyp `Markttechnik` mit Zeiteinheit aus den Strategieparametern. Regel der Strategie `risiko` aus „Risiko je Trade“ mit 1 %.
- Hauptablauf: Auslöser `Kerzenschluss` (S.handelszeiteinheit) → Bedingung `AND(mt_signal.trend_intakt; mt_signal.phase = "bewegung")` → wahr: Bedingung `mt_handel.trendrichtung = mt_signal.trendrichtung` → wahr: Bedingung `S.wartende_orders + S.offene_positionen = 0` → wahr: Berechnungen `einstieg`, `stop`, `ziel` nach Abschnitt 3 des Testfalls mit `IF(mt_signal.trendrichtung = "aufwaerts"; …; …)`, Puffer als `S.entry_puffer * Instrument.Pip` → „Order aufgeben“ `StopOrder` mit Richtung `IF(…; "buy"; "sell")`, Preis `einstieg.Ergebnis`, Stop-Loss `stop.Ergebnis`, Take-Profit `ziel.Ergebnis`, Gültigkeit „bis auf Widerruf“, Regel des Elements `mindestvolumen` (Objekttyp `Regel`, prüfend, `Order.Volumen >= Instrument.Mindestvolumen`). Das Volumen bestimmt `risiko`.
- Verwaltung an `gestellt`: Auslöser `Tick` → Bedingung `AND(Order.Status = "wartend"; IF(Order.Richtung = "buy"; Tick.Geld < mt_handel.punkt_13; Tick.Brief > mt_handel.punkt_13))` → wahr: „Order löschen“. Auslöser `Kerzenschluss` (S.handelszeiteinheit) → Bedingung `Order.Status = "wartend"` → Berechnung `stop_neu` → Bedingung `stop_neu.Ergebnis <> Order.Stop_Loss` → wahr: Berechnung `ziel_neu` → „Order ändern“ mit Stop-Loss und Take-Profit → `nicht geändert`: „Order löschen“.

`str-03` EMA-Trendfolge:

- Strategieparameter `zeiteinheit` (H1), `stop_abstand` (2). Instanzen `ema20`, `ema50` (`EMA`, Periode 20 und 50), `atr14` (`ATR`, Periode 14), Zeiteinheit jeweils S.zeiteinheit. Regel der Strategie `risiko` aus „Risiko je Trade“ mit 1 %.
- Hauptablauf: Auslöser `Kerzenschluss` (S.zeiteinheit) → Bedingung Kreuzen `OR(AND(PREVIOUS(ema20.Wert) <= PREVIOUS(ema50.Wert); ema20.Wert > ema50.Wert); AND(PREVIOUS(ema20.Wert) >= PREVIOUS(ema50.Wert); ema20.Wert < ema50.Wert))` → wahr: Berechnung `richtung` `IF(ema20.Wert > ema50.Wert; "buy"; "sell")` → Berechnung `stop` mit `Kerze.Schluss` und `S.stop_abstand * atr14.Wert` → „Order aufgeben“ `MarketOrder` mit Richtung `richtung.Ergebnis`, Stop-Loss `stop.Ergebnis`, ohne Take-Profit, Regel des Elements `mindestvolumen` wie oben.
- Verwaltung an `gestellt`: Auslöser `Kerzenschluss` (S.zeiteinheit) → Bedingung `Order.Status = "ausgefuehrt"` → Bedingung Kreuzen gegen `Position.Richtung` → wahr: „Position schließen“ ohne Volumen; falsch: Berechnung `stop_neu` → Bedingung „verbessert“ mit `Position.Stop_Loss` und `Position.Richtung` → wahr: „Position ändern“ mit Stop-Loss `stop_neu.Ergebnis`.

Die Regel `mindestvolumen` ist Regel des Elements „Order aufgeben“, nicht der Strategie: Als Regel der Strategie würde sie auch auf die Schließorder angewendet, deren Volumen dort leer ist.

## 7. Tests und Nachweis

- Bibliothek (pytest): Zerlegung und Typprüfung der Ausdrücke mit gültigen und fehlerhaften Fällen je Regel aus Abschnitt 3.4; jeder Befund aus Abschnitt 3.6 mit Gegenprobe; Schreiben und Lesen jedes Dokumenttyps; erzeugte Schemata gleich den Dateien unter `contracts/strategies/v1/`; Regelvorlage „Risiko je Trade“ fehlerfrei in beiden Zusammenhängen von Regeln.
- Testfalldokumente: `str-01` und `str-03` liegen unter `contracts/strategies/v1/testcases/`. Ein Test lädt sie, prüft sie gegen die Schemata, verlangt null Fehler der Konsistenzprüfung, schreibt sie und vergleicht.
- Backend (pytest): jeder Endpunkt mit Erfolgs- und Fehlerfällen; Datei je Objekt, Schreiben über temporäre Datei; nicht lesbare Datei; Verschieben und Nichtverschieben, Konflikt beim Verschieben; Migration einer Datenbank des bisherigen Schemas; erzeugte OpenAPI-Beschreibung gleich der Datei unter `contracts/api/`.
- Oberfläche (Vitest): Aufbau aus Typbeschreibungen ohne Kenntnis einzelner Typen, Ableitung des Dokuments aus der Zeichenfläche und zurück, Rückfragen, Befundanzeige, Sprachwechsel, Vollständigkeit der Übersetzungen.
- Browsertest (Playwright, Chromium, Firefox, WebKit): Jeder Testfall wird aus der leeren Zeichenfläche über die Oberfläche aufgebaut, gespeichert, nach Neuladen der Seite geöffnet und mit dem Testfalldokument verglichen, ohne Kennungen, Lage und Zeitpunkte. Dazu Objekt anlegen, Vorlage löschen mit Anzeige der Verwendungen, Objektverzeichnis ändern.
- Prüfskript und Testumgebungsskript der Komponente nehmen die Bibliothek auf. Das Testumgebungsskript setzt das Objektverzeichnis auf ein Verzeichnis unter `.testenv/`.

## 8. Sicherheit

- Ohne Anmeldung, wie bisher nur im vom Betreiber kontrollierten Netz (req-system-011, Abschnitt 9 Punkt 10 der Anforderungen). Die neuen schreibenden Endpunkte erhöhen das bekannte Risiko bei `--host` außerhalb der Loopback-Adresse (technische Dokumentation, Abschnitt 4a); die technische Dokumentation nennt sie.
- Dateizugriff: Dateinamen nur aus geprüften UUIDs und festen Arten, keine Pfadangabe von außen außer der Einstellung Objektverzeichnis, die absolut sein muss. Verschieben überschreibt keine Datei.
- Begrenzungen gegen Überlast (OWASP API4): Größe eines Dokuments höchstens 2 MiB, Länge eines Ausdrucks und Schachtelungstiefe begrenzt, Zahl der Elemente begrenzt; Werte legen die Aufträge fest.
- Pydantic streng mit Ablehnung zusätzlicher Felder; Ausdrücke werden nur zerlegt, nie mit `eval` oder Ähnlichem ausgeführt. Texte setzt die Oberfläche als Text, nie als HTML.

## 9. Dokumentation

- `docs/technical/pipwerk-studio.md`: Aufbau, Objektverzeichnis, Web-API, Einführung von Alembic (ersetzt die bisherige Aussage in Abschnitt 2.1, dass Alembic nicht eingesetzt wird), Prüfungen, Sicherheit.
- neue technische Dokumentation der Bibliothek unter `docs/technical/` mit Objektmodell, Ausdrücken, Konsistenzprüfung und Dokumentformat, mit Verweis aus `contracts/strategies/README.md`.
- `docs/user/pipwerk-studio.md`: alle Arbeitsabläufe aus Abschnitt 5.2 Schritt für Schritt; die Schreibweise von Ausdrücken mit Namen, Kennungen, Werten einer Auswahl, Funktionen, Trennzeichen `;` und der Bedeutung von „leer“ und „nicht verfügbar“; die Befunde der Konsistenzprüfung und ihre Behebung; beide Testfälle als Anleitung.
- Glossar: neue Begriffe der Spezifikation, zum Beispiel „nicht verfügbar“ und „leer“ bei Ausdrücken, und Berichtigung der Einträge, die dieser Spezifikation widersprechen: „Pydantic“ (wird im Teilpaket für Dokumente der Bibliothek verwendet, E1), „Index“ (keine Tabelle in der Datenbank, E5), „Strategiedatei“ (Objektverzeichnis statt Strategieverzeichnis), „Typbeschreibung“ (Felder nach Abschnitt 3.1).

## 10. Vorschläge zu offenen Punkten, Hinweise für den Auftraggeber

Die Spezifikation braucht keine Entscheidung des Auftraggebers, bevor sie umgesetzt werden kann. Bei der Abstimmung bestätigt er folgende Festlegungen, die offene Punkte seiner Dokumente vorläufig füllen:

1. Befunde ohne Element stehen in der Eigenschaftenansicht der Strategie, Hinweise sind orange markiert (req-ui-011, dort offen).
2. Mitgelieferte Objekttypen und die Regelvorlage „Risiko je Trade“ lassen sich nicht ändern oder löschen; eine Abwandlung entsteht als neue Vorlage aus einer Instanz (E6). Grund: Sie sind Teil der Software und in jeder Installation gleich.
3. Funktionen der ersten Auswahl ergänzt um `FLOOR`, `CEILING`, `AND`, `OR`, `NOT`, `ISNA`, `IFNA`, `ISBLANK` aus der Norm (req-fach-036, Auswahl „bei Bedarf“ erweiterbar). Funktionsnamen stehen in der Norm-Schreibweise; deutsche Namen bleiben offen.
4. `Order` und `Position` in Regeln: Eine Regel, die `Order` oder `Position` anspricht, steht nur als Regel der Strategie, am Element „Order aufgeben“ oder in dessen Verwaltung. In einem Indikator oder Trend ist schon das Einfügen einer solchen Regel ein Fehler der Konsistenzprüfung; im Hauptablauf, wo eine Regel sonst nur an „Order aufgeben“ steht, ist es die Verwendung ihres Ergebnisses in einem Ausdruck. In der Verwaltung sieht die Regel deren Order und Position. Den Fall, dass eine Regel nicht angewendet wird, weil es keine Order gibt, gibt es nicht. Eine Regel, die auf eine Order angewendet wird, findet dort keine Position vor: `Position` ist „nicht verfügbar“, der Ausdruck fängt das mit `ISNA` oder `IFNA` ab wie „Risiko je Trade“; fängt er es nicht ab, ist die Eigenschaft nicht bestimmbar beziehungsweise die Prüfung nicht erfüllt. Nicht angewendet wird eine Regel nur nach req-fach-046, wenn der Ordertyp eine angesprochene Eigenschaft nicht hat (Abschnitt 3.4, Abschnitt 3.6, Hinweise H23 und H24 aus [requirements-7.md](reviews/requirements-7.md)).
5. Eine Order oder Position ohne Stop-Loss erfüllt die Regel „Risiko je Trade“ nicht (Abschnitt 3.5).
6. Trend: Mitgeliefert ist nur das Berechnungsverfahren „Ausdruck“. Die Werte der Trendrichtung legt der Ausdruck fest, weil das Fachmodell sie nicht festlegt (Abschnitt 9 Punkt 9 der Anforderungen).
7. Eigenschaften eines in einem Trend oder Indikator enthaltenen Indikators werden mehrstufig angesprochen, zum Beispiel `trend_h1.ema20.Wert` (Abschnitt 3.3; req-fach-012 lässt offen, wie).
8. Eine Bedingung, deren Ausdruck bei der Ausführung keinen Wert ergibt, etwa weil die Markttechnik ohne Trend keinen Punkt 2 hat, nimmt den Ausgang `falsch` (Abschnitt 3.4). In `str-01` wird dann kein Trade geplant, und eine wartende Order wird beim Tick nicht gelöscht, solange Punkt 1/3 nicht belegt ist.

Folgen der fachlichen Festlegungen, die erst mit der Abbildung sichtbar werden (sie ergeben sich aus req-core-002, req-fach-046 und req-fach-049a, nicht aus einer Entscheidung der Spezifikation):

- Die Regel „Risiko je Trade“ prüft bei „Order ändern“ und „Position ändern“ mit dem aktuellen Kapital. Ist das Kapital gesunken, lehnt sie auch eine Änderung ab, die das Risiko verringert, solange der Stop-Loss noch auf der Verlustseite liegt.
- Legt eine Regel des Elements „Order aufgeben“ eine höhere Risikogrenze fest als die Regel der Strategie, prüft bei „Order ändern“ nur die Regel der Strategie mit der niedrigeren Grenze; die Order lässt sich dann nicht ändern.
