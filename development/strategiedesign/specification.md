# Spezifikation Vorhaben strategiedesign

## Status

- status: `draft`
- stand: 2026-10-19
- komponenten: `packages/domain-core` (gemeinsame Python-Bibliothek), `components/pipwerk-studio` (Backend und Oberfläche), `contracts/`
- grundlage: [scope.md](scope.md) mit den dort genannten Dokumenten des Auftraggebers; Nachprüfung der Dokumente nach der Abnahme von `wp02` bestanden in [requirements-12.md](reviews/requirements-12.md). Prototyp der Oberfläche: Auftrag [prototype/order-01.md](prototype/order-01.md), Ergebnis [prototype/pipwerk-studio-prototyp.html](prototype/pipwerk-studio-prototyp.html) (Zweig `strategiedesign/proto-studio`, Commit `dce2b7b1939a91bdd56802812e36cb900c6b4558`), vom Auftraggeber am 2026-10-19 als Grundlage bestätigt ([questions/strategiedesign-01.md](questions/strategiedesign-01.md)); fünf Lösungen darin gelten vorläufig bis zu seinem Test (Abschnitt 10, Punkte 9 bis 13). Mängel der Abnahme von `wp02`: [wp02/acceptance/1.md](wp02/acceptance/1.md). Vorlagen: [Pflichtenheft](../../docs/design/planning/pflichtenheft-strategiedesigner.md) und Arbeitspakete AP2 bis AP9; wo sie den geltenden Dokumenten widersprechen, folgt diese Spezifikation den geltenden Dokumenten (Abschnitt 1).
- bisherige Prüfungen und Abstimmung: Durchläufe 1 bis 6 ([specification-1.md](reviews/specification-1.md) bis [specification-6.md](reviews/specification-6.md)), Abstimmung [specification-1.html](presentations/specification-1.html) mit den Festlegungen 1 bis 8 am 2026-10-16; Ergänzungen in Phase 4 von `wp02` am 2026-10-18 bestätigt. Diese Fassung arbeitet die neuen und geänderten Anforderungen nach der Abnahme von `wp02` und den Prototyp ein (Änderungsnachweis). Durchlauf 7 [specification-7.md](reviews/specification-7.md) bestanden; Hinweise N1 bis N3, N5 bis N9 und N11 bis N22 eingearbeitet, N4 und N10 betreffen Dokumente des Auftraggebers und liegen beim Projektleiter. Durchlauf 8 [specification-8.md](reviews/specification-8.md) (Nachprüfung) bestanden; Hinweise H1 bis H8 eingearbeitet, Nachprüfung in `specification-9.md`.

## 1. Gegenstand

pipwerk Studio erhält den Strategiedesigner: Strategien und Vorlagen (Indikator, Trend, Regel, Regelwerk) anlegen, auf der Zeichenfläche gestalten, der Konsistenzprüfung unterziehen, speichern, öffnen und löschen. Nachweis sind die Testfälle `str-01` und `str-03`: Beide lassen sich in der Oberfläche ohne Anleitung vollständig gestalten, speichern und wieder laden, und die Konsistenzprüfung meldet für sie keinen Fehler. Die vom Auftraggeber in `wp02` gebaute Strategie „EMA-Trendfolge“ ([gesicherte Datei](wp02/acceptance/ema-trendfolge-auftraggeber.strategy.json)) öffnet sich in der neuen Fassung, ohne dass er sie neu aufbauen muss.

Nicht Gegenstand sind die Ausführung von Strategien (Debuggen, Testen, Handeln), die Berechnung von Indikatoren und die Auswertung von Ausdrücken. Die Spezifikation legt die Bedeutung von Ausdrücken und Regeln aber so fest, dass Strategietester und Handelssystem sie später ohne Änderung des Strategiedokuments ausführen können (req-system-004).

Abweichungen von den Vorlagen, weil die geltenden Dokumente inzwischen anders festlegen:

| Vorlage | jetzt | Grundlage |
|---|---|---|
| eigenständig gespeicherte Objekte per Verweis in der Strategie (PH-05) | Instanzen sind Kopien in der Strategie, Vorlagen sind eigene Dateien | req-fach-013a, req-param-005 |
| Löschschutz verwendeter Objekte (PH-08) | Löschen nach Rückfrage, Anzeige der Verwendungen | req-ablauf-006 |
| genau ein Auslöser, keine Funktionen in Ausdrücken (PH-05, PH-11) | beliebig viele Auslöser, auch keiner, in der Strategie und in der Verwaltung; OpenFormula mit Funktionen | req-fach-015, req-fach-046, req-fach-036 |
| Index in Datenbanktabellen (PH-08) | kein Index in der Datenbank, die Dateien sind die einzige Quelle | req-ui-009, Entscheidung E5 |
| Indikatoren mit Berechnung (PH-11) | Indikatoren beschreiben Parameter und Eigenschaften, ohne Berechnung | Abschnitt 1, Ausführung nicht Gegenstand |
| Bezeichnung und Name getrennt, Namen ohne Leerzeichen | ein frei wählbarer Name, Kennungen bildet die Anwendung | req-ui-016, req-fach-036 |

## 2. Architekturentscheidungen

- E1 Gemeinsame Python-Bibliothek: Typbeschreibungen, Elementregister, Objektmodell, Ausdrücke mit Zerlegung, Bausteinen, Anzeigeform und Typprüfung, Konsistenzprüfung und das Lesen und Schreiben der Dokumente liegen in `packages/domain-core` (Paket `pipwerk_domain`), nicht in Backend oder Oberfläche (req-system-007). Das Objektmodell besteht aus einfachen Python-Klassen ohne Abhängigkeit von Frameworks. Nur das Teilpaket für Dokumente (`pipwerk_domain.documents`) verwendet Pydantic. pipwerk Studio bindet die Bibliothek als Pfadabhängigkeit mit festgeschriebener Version in `uv.lock` ein.
- E2 Die Oberfläche enthält keine Kenntnis einzelner Element- oder Objekttypen und keine eigene Prüf- oder Zerlegungslogik für Ausdrücke. Elementbibliothek mit Gruppen, Elemente, Eigenschaftenansicht und Erklärungen entstehen aus den Typbeschreibungen der Web-API (req-fach-006, req-param-004, req-ui-005, req-ui-016). Konsistenzprüfung, Zerlegung von Ausdrücken, Bausteine und Umwandlung zwischen Anzeigeform und gespeicherter Form laufen im Backend über die Bibliothek (3.4, 4.2); die Oberfläche zeigt deren Ergebnis.
- E3 Das Strategiedokument ist maßgeblich. Die Darstellung auf der Zeichenfläche wird beim Laden aus dem Dokument erzeugt; jede Änderung auf der Zeichenfläche ändert das Dokument (req-ui-004).
- E4 Instanzen sind vollständige Kopien in ihrer Strategie beziehungsweise in ihrem Regelwerk. Sie nennen ihre Herkunft (Objekttyp, Kennung der Vorlage, bei einer eigenen Vorlage auch ihren Namen zum Zeitpunkt des Einfügens, 3.7). Kein Dokument verweist zur Ausführung auf ein anderes Dokument. Löschen oder Ändern einer Vorlage wirkt damit nicht auf Instanzen (req-fach-013a, req-ablauf-006).
- E5 Objektverzeichnis ohne Index in der Datenbank. Das Backend liest die Dateien bei Bedarf; ein Zwischenspeicher im Prozess ist zulässig, wenn er bei geänderter Datei neu liest. Ein Index wäre nur eine zweite Fassung derselben Daten. Die Menge der Objekte eines Anwenders ist klein; wird das Lesen zu langsam, kann ein Index ergänzt werden, der sich aus den Dateien neu erzeugen lässt (req-ui-009).
- E6 Mitgelieferte Objekttypen und die mitgelieferte Regelvorlage „Risiko je Trade“ stammen aus der Bibliothek, nicht aus dem Objektverzeichnis. Sie sind in jeder Installation gleich und werden nicht geändert oder gelöscht. Eigene Abwandlungen entstehen, indem der Anwender eine Instanz als neue Vorlage speichert (Abschnitt 10, Punkt 2).
- E7 Erweiterbarkeit: Elementtypen und Objekttypen werden im Elementregister angemeldet. Weitere Python-Pakete melden Typen über den Einstiegspunkt `pipwerk.element_types` an (req-fach-024, req-fach-009). Objekttypen ohne Programmierung legt der Anwender als Vorlage vom Objekttyp `Indikator` oder `Trend` an (Abschnitt 3.3).
- E8 Der bestätigte Prototyp ist die Vorlage für Bedienung und Erscheinungsbild der Oberfläche (Abschnitt 5). Er wird nicht übernommen; die Umsetzung baut die bestehende Oberfläche neu auf. Seine Anordnung auf der Zeichenfläche (Rangfolge der Elemente, Reihenfolge nach Schwerpunkt, Rahmen, Abschnitte, Bereich für Objekte) wird als eigener Baustein der Oberfläche übernommen. Interaktion und Darstellung der Zeichenfläche bleiben bei React Flow (`docs/technical/development-test-security-rules.md`); der Prototyp verwendet React Flow nicht, das ist laut seiner Beschreibung keine Vorentscheidung.
- E9 Dokumentformat 2.0: Ein Name je Objekt mit eigener Kennung, Datenverbindungen, Abschnitte und die Parameter `Instrument` ändern das Format unverträglich. Die Bibliothek schreibt nur noch 2.0 und liest 1.0 weiter, indem sie es beim Lesen umwandelt (3.7). Die Web-API bleibt unter `/api/v1/`: Sie ist bisher nur in Testumgebungen in Betrieb, ein anderer Nutzer der Schnittstelle besteht nicht.

## 3. Gemeinsame Python-Bibliothek

### 3.1 Typbeschreibung und Elementregister

Jeder Elementtyp und jeder Objekttyp liefert eine Typbeschreibung. Die Oberfläche verwendet nur diese.

| Feld | Inhalt |
|---|---|
| Kennung | sprachneutral, zum Beispiel für Elementtypen `flow.condition`, für Objekttypen der Name aus dem Fachmodell |
| Art | Auslöser, Element des Ablaufs, Objekttyp (Indikator, Trend, Regel, Regelwerk), Objekt der Anwendung, Ordertyp, Berechnungsverfahren des Trends |
| Beschriftung | Name, Beschreibung und Erklärung in Deutsch und Englisch. Name und Erklärung sind in Händlersprache (req-ui-016, Mangel M8): Begriffe eines Händlers, keine der Programmierung, zum Beispiel „Strategieparameter ändern“ für „Parameter setzen“ und „1-2-3-Trend (Markttechnik)“ für `Markttechnik` (req-fach-054). Die Erklärung ist ein kurzer Text, den die Oberfläche beim Zeigen anzeigt. |
| Gruppe | Gruppe der Elementbibliothek (5.2), nur bei Typen, die dort stehen |
| Parameter | Kennung, Datentyp, Pflicht oder optional, Standardwert, zulässige Werte, erlaubte Bindungsarten, Beschriftung mit Erklärung; optional die Angabe, bei welchem Wert eines anderen Parameters er gilt (zum Beispiel die Parameter eines Berechnungsverfahrens des Trends, req-param-005) |
| Eigenschaften | Kennung, Datentyp, MUSS oder KANN, zulässige Werte (bei Auswahl und Zeiteinheit), erlaubte Bindungsarten, Beschriftung mit Erklärung; bei Ordertypen zusätzlich, ob der Anwender sie belegt. `Konto`, `Order-ID`, `Status` und `Strategie-ID` belegt die Anwendung, nicht der Anwender (req-fach-019); `Instrument` belegt der Anwender, vorbelegt mit dem Instrument der Anwendung (req-fach-053). |
| Ausgänge | Kennungen und Beschriftungen der Ausgänge eines Elements des Ablaufs, zum Beispiel `wahr` und `falsch`; je Ausgang, ob an ihm die Verwaltung des Elements hängt (bei „Order aufgeben“ der Ausgang `gestellt`, Abschnitt 3.3); höchstens ein Ausgang je Typ, eine Typbeschreibung mit mehreren solchen Ausgängen ist ungültig und wird nicht angemeldet |
| benannt | ob Ausdrücke das Ergebnis eines Elements des Ablaufs ansprechen (Bedingung, Berechnung, Abschnitt 3.2) |
| Strategieparameter | bei Objekten der Anwendung, ob Ausdrücke über dieses Objekt die Strategieparameter ansprechen (`Strategie`, Abschnitt 3.4) |
| Regeln zulässig | ob dem Element Regeln und Regelwerke zugeordnet werden können (req-ui-012) |
| auf Zeichenfläche | ob der Typ als Element auf die Zeichenfläche gelegt werden kann (req-fach-051) |

Die Felder „Gruppe“, „Ausgänge“ mit der Verwaltung, „benannt“ und „Strategieparameter“ braucht die Oberfläche, weil sie nach E2 keine einzelnen Typen kennt. Parameter und Eigenschaften vom Datentyp Zeiteinheit nennen ihre zulässigen Werte wie eine Auswahl. Die Liste der Funktionen (3.4) nennt je Funktion Beschriftung und Erklärung in Händlersprache und je Argument Name und Erklärung in Deutsch und Englisch (req-ui-015).

Kennungen von Eigenschaften, Parametern und festgelegten Werten werden aus dem deutschen Namen gebildet: Kleinbuchstaben, ä, ö, ü als ae, oe, ue, ß als ss, Leerzeichen und Bindestrich als `_`, andere Zeichen entfallen (req-fach-036, zum Beispiel `trend_intakt`, `punkt_13` aus „Punkt 1/3“, `aufwaerts`, `stop_loss`, `anwenden_auf`). Objekte der Anwendung tragen als Kennung ihren Namen aus dem Fachmodell (`Konto`, `Order`). Die vollständigen Listen der Kennungen legen die Aufträge fest.

Datentypen: Zahl, Ganzzahl, Prozent (im Ausdruck als Anteil, 1 % ist 0,01), Wahrheitswert, Text, Auswahl (feste Werte mit Kennungen), Zeiteinheit (alle Zeiteinheiten von MetaTrader 5 von M1 bis MN1), Zeitpunkt, Datum, Ausdruck, Objekt mit Angabe des Objekttyps (zum Beispiel `Instrument`, req-fach-046).

Bindungsarten eines Parameters oder einer Eigenschaft (Glossar „Bindungsart“, req-fach-046, req-param-003): fester Wert, Strategieparameter (oder, innerhalb einer Vorlage, ein Parameter der Vorlage, zum Beispiel die Zeiteinheit des Trends für seine Indikatoren, req-fach-011), Datenverbindung (eine Eigenschaft einer Instanz auf der Zeichenfläche, req-ui-014, Abschnitt 3.3), Ausdruck (darin auch Ergebnisse von Berechnungen und Regeln und Eigenschaften anderer Objekte), bei der Anwendung übergeben. Eine Eigenschaft der Order, die eine Regel mit `bestimmen()` erhält, hat keine eigene Bindungsart: Die Regel ist der Strategie oder dem Element zugeordnet und nennt die Eigenschaft selbst (Abschnitt 3.5). Damit gibt es genau einen Weg und die Reihenfolge nach req-fach-046.

Erlaubt sind alle Bindungsarten (req-fach-046), mit diesen Ausnahmen, jede mit technischem Grund:

| Parameter | nur | Grund |
|---|---|---|
| Ausdruck einer Bedingung, Berechnung, von „Parameter setzen“ | Ausdruck | Der Parameter ist selbst der Ausdruck. |
| Ordertyp von „Order aufgeben“ | fester Wert | Die Typprüfung braucht den Ordertyp, um die Eigenschaften der Order in der Verwaltung zu kennen (3.4). |
| Strategieparameter von „Parameter setzen“ | fester Wert | Die Typprüfung braucht den Strategieparameter, um den Typ des Ausdrucks zu prüfen. |
| Berechnungsverfahren des Trends | fester Wert | Vom Verfahren hängen die weiteren Parameter und Eigenschaften ab (req-param-005). |

Parameter `Instrument` (req-fach-053): Die Auslöser `Kerzenschluss` und `Tick`, die Objekte `Instrument`, `Kerze` und `Tick`, jeder Indikator und die Eigenschaft `Instrument` der Order haben ihn. Vorbelegt ist der festgelegte Wert „Instrument der Anwendung“. Belegt werden kann er auch mit einem Strategieparameter vom Datentyp Objekt `Instrument`, mit einer Datenverbindung oder mit einem festen Instrument. Ein festes Instrument ist vorläufig ein Text mit der Bezeichnung des Instruments; wie es bei der Ausführung zugeordnet wird, ist im Fachmodell offen (req-fach-053) und betrifft dieses Vorhaben nicht.

`Instrument` ohne Instanz, vorläufig (das Fachmodell regelt nur `Kerze` und `Tick` ohne Instanz, req-fach-051; Abschnitt 10 Punkt 19): In einer Regel und in der Verwaltung ist es das Instrument der Order beziehungsweise Position, auf die die Regel angewendet wird oder zu der die Verwaltung gehört (req-fach-040, req-fach-049a). Im Hauptablauf ist es wie bei `Kerze` und `Tick` das Instrument des Auslösers, der die Auswertung gestartet hat, ohne Auslöser das Instrument der Anwendung (req-fach-051, req-fach-053); so rechnen `Kerze` und `Instrument` ohne Instanz immer mit demselben Instrument. In einem Indikator oder Trend, auch in einer Regel darin, ist es der Wert seines Parameters `Instrument` (3.3). Eine andere Bedeutung erhält, wer eine Instanz von `Instrument` mit gesetztem Parameter auf die Zeichenfläche legt.

Ein Text, der die Kennung eines Werts einer Auswahl ist, belegt eine Eigenschaft dieser Auswahl, etwa `"buy"` die Richtung. Die Typprüfung prüft feste Texte gegen die Werte der Auswahl. Ein Text, der erst bei der Ausführung entsteht, wird dort geprüft; ist er kein Wert der Auswahl, ist die Eigenschaft nicht bestimmbar.

### 3.2 Mitgelieferte Typen

| Gruppe | Typen | Grundlage |
|---|---|---|
| Auslöser | `Kerzenschluss` (Parameter Instrument, Zeiteinheit Pflicht), `Tick` (Parameter Instrument) | req-fach-053; `externes Ereignis` ist offen und wird nicht angeboten |
| Elemente des Ablaufs | Bedingung (Ausdruck; Ausgänge `wahr`, `falsch`), Berechnung (Ausdruck; Ergebnis; Ausgang `weiter`), Parameter setzen (Strategieparameter, Ausdruck; `weiter`), Order aufgeben (Ordertyp, Eigenschaften der Order; `gestellt`, `nicht gestellt`; Regeln zulässig), Order ändern (Preis, Limitpreis, Stop-Loss, Take-Profit, Gültigkeit, jeweils optional, ohne Wert unverändert; `geändert`, `nicht geändert`; Regeln zulässig), Order löschen (`weiter`), Position ändern (Stop-Loss, Take-Profit; `geändert`, `nicht geändert`; Regeln zulässig), Position schließen (Volumen optional; `weiter`; Regeln zulässig) | req-fach-047 bis req-fach-049a, req-ui-012 |
| Ordertypen | `MarketOrder`, `StopOrder`, `LimitOrder`, `StopLimitOrder`, `CloseOrder` mit den Eigenschaften aus req-fach-019 und req-fach-028 bis req-fach-032. `CloseOrder` entsteht nur über „Position schließen“. | req-fach-025 bis req-fach-032 |
| Objekte der Anwendung | `Konto`, `Instrument` (Parameter Instrument), `Kerze` (Parameter Instrument, Zeiteinheit), `Tick` (Parameter Instrument), `Order`, `Position`, `Strategie` mit den Eigenschaften aus req-fach-051, req-fach-052, req-fach-046; `Strategie` mit der Eigenschaft `Name` statt `Bezeichnung` | req-fach-051, req-fach-053 |
| Indikatoren | `EMA` (Instrument, Zeiteinheit, Periode, Verschiebung 0, Anwenden auf mit Standard Schlusskurs; Eigenschaft Wert), `ATR` (Instrument, Zeiteinheit, Periode; Wert), `ZigZag` (Instrument, Zeiteinheit, Depth 12, Deviation 5, Backstep 3; Wendepunkte, unten), `Markttechnik` (Parameter des `ZigZag`, Eigenschaften nach [Indikator Markttechnik](../../docs/design/domain/indikator-markttechnik.md)), jeweils ohne Berechnung | req-fach-054 |
| allgemeine Objekttypen | `Indikator`, `Trend`, `Regel`, `Regelwerk` (Abschnitt 3.3) | req-fach-013a, req-fach-010, req-fach-034, req-fach-041 |
| Regelvorlage | „Risiko je Trade“ (Abschnitt 3.5), Name in Deutsch und Englisch | req-core-002 |

Wendepunkte des `ZigZag`, vorläufig (req-fach-054 lässt die Zahl offen, Abschnitt 10 Punkt 14): Ausdrücke sprechen die drei jüngsten Wendepunkte an, `Wendepunkt 1` ist der jüngste. Je Wendepunkt gibt es die Eigenschaften `Kurs` (Zahl), `Art` (Auswahl `hoch`, `tief`) und `endgültig` (Wahrheitswert), als Kennungen zum Beispiel `wendepunkt_1_kurs`, `wendepunkt_1_art`, `wendepunkt_1_endgueltig`. Fehlt ein Wendepunkt, sind seine Eigenschaften „leer“ (3.4). Weitere Wendepunkte lassen sich ergänzen, ohne bestehende Strategien zu ändern.

`Markttechnik` ist ein mitgelieferter Indikator; die Typbeschreibung ordnet ihn der Gruppe „Trends“ zu (req-fach-054). `Trend intakt` und `Punkt 1/3 endgültig` sind Wahrheitswerte, beschriftet mit „ja“ und „nein“ ([Indikator Markttechnik](../../docs/design/domain/indikator-markttechnik.md), Abschnitt 4); `Trendrichtung` und `Phase` sind Auswahlen, `Punkt 2` und `Punkt 1/3` Zahlen.

Ein Element des Ablaufs trägt einen Namen, anfangs die Tätigkeit seines Elementtyps, vom Anwender änderbar (req-ui-003). Unter der Kennung einer Bedingung oder Berechnung sprechen Ausdrücke ihr Ergebnis an (`einstieg.Ergebnis`, req-fach-005, Abschnitt 3.3).

### 3.3 Strategie, Instanzen und Vorlagen

Namen und Kennungen (req-ui-016, req-fach-036): Strategie, Strategieparameter, Instanz, Element und Abschnitt haben genau einen Namen, frei wählbar mit Leerzeichen, Umlauten und Zeichen wie dem Bindestrich. Alles, was Ausdrücke ansprechen (Strategieparameter, Instanz, Regel, Bedingung, Berechnung, eigener Parameter und eigene Eigenschaft einer Vorlage), hat außerdem eine Kennung im Ausdruck. Die Bibliothek bildet sie beim Anlegen aus dem ersten Namen nach der Regel in 3.1. Ist das Ergebnis leer, nimmt sie bei Bedingung und Berechnung `bedingung` beziehungsweise `berechnung`, bei einer Instanz die Kennung ihres Objekttyps in Kleinbuchstaben, bei einem Strategieparameter oder eigenen Parameter `parameter`, bei einer eigenen Eigenschaft `eigenschaft`; beginnt es nicht mit einem Buchstaben, stellt sie `n_` voran. Sie macht die Kennung ohne Unterscheidung von Groß- und Kleinschreibung eindeutig gegen die übrigen Kennungen des Namensraums, die Objekte der Anwendung und die Funktionen, indem sie eine Zahl anhängt (`kerze_2`). Danach ändert sie die Kennung nicht mehr, auch nicht beim Umbenennen. Ausdrücke speichern die Kennung. Die Oberfläche zeigt sie nicht (Anzeigeform, 3.4). Strategie, Elemente, Verbindungen und Abschnitte tragen zusätzlich eine UUID.

Namen müssen innerhalb ihres Namensraums eindeutig sein, Namen von Instanzen, Regeln, Bedingungen und Berechnungen auch gegen die Namen der Objekte der Anwendung in beiden Sprachen, weil die Anzeigeform sie sonst nicht unterscheiden kann. Strategieparameter sind davon ausgenommen, weil sie in der Anzeigeform immer hinter `Strategie.` stehen. Eine neue Instanz erhält deshalb den Namen ihres Typs beziehungsweise ihrer Vorlage mit angehängter Zahl, wo nötig („Kerze 2“).

Strategie (req-fach-046): Kennung (UUID), Name, Beschreibung, Strategieparameter (Name, Kennung, Datentyp einschließlich Objekt `Instrument`, Wert oder „bei der Anwendung“), Regeln und Regelwerke der Strategie (Instanzen in festgelegter Reihenfolge), Elemente, Verbindungen, Abschnitte, Ausrichtung des Ablaufs (senkrecht oder waagerecht, Abschnitt 5.3) und die eingeklappten Rahmen der Verwaltungen.

Element: Kennung, Elementtyp, Name, bei Bedingung und Berechnung die Kennung im Ausdruck, Lage auf der Zeichenfläche nur, wenn der Anwender das Element verschoben hat (sonst ordnet die Oberfläche es selbst an, 5.3), Belegung der Parameter und Eigenschaften mit Bindungsart, Eingänge, zugeordnete Regeln und Regelwerke, und die Kennung des Elements „Order aufgeben“, zu dessen Verwaltung es gehört (leer im Hauptablauf). Ein Element, das ein Objekt zeigt, enthält die Instanz und hat keinen eigenen Namen; sein Name ist der Name der Instanz (req-ui-003, req-ui-016). Es hat keine Lage, weil Instanzen im Bereich „Objekte und ihre Werte“ liegen (req-ui-017, 5.3); seine Stelle in diesem Bereich ergibt sich aus der Reihenfolge der Elemente.

Eingang (req-ui-014): ein Wert, den der Anwender mit dem Element verbunden hat, angegeben als Instanz auf der Zeichenfläche und ihre Eigenschaft. Die Ausdrücke des Elements und seiner Regeln sprechen ihn unter dem Namen der Instanz an (`ema_20.Wert`). Ein Eingang ändert die Bedeutung des Ausdrucks nicht; er hält fest, dass der Anwender den Wert verbunden hat, auch bevor ein Ausdruck ihn verwendet. Datenverbindung ist der Oberbegriff für Eingang und Belegung mit der Bindungsart Datenverbindung (3.1). Der Befund „Eingang ohne Wert“ aus req-ablauf-007 meint nicht diesen Eingang, sondern einen Parameter, eine Eigenschaft oder einen Ausdruck, dem ein Wert fehlt; die Spezifikation nennt das „Angabe ohne Wert“ (3.6).

Instanz (req-fach-013a, req-param-005): Name, Kennung im Ausdruck, Herkunft (Objekttyp, Kennung der Vorlage oder leer bei Einfügen eines Objekttyps, bei einer eigenen Vorlage ihr Name zum Zeitpunkt des Einfügens; 3.7), Parameterwerte und den gesamten übrigen Inhalt der Vorlage nach der Tabelle unten: eigene Parameter, eigene Eigenschaften mit ihren Ausdrücken, enthaltene Instanzen, Regeln, Ausdrücke. Zur Ausführung braucht eine Instanz ihre Vorlage nicht (E4). Eine Instanz ist in der Strategie in vollem Umfang änderbar.

Verbindung: Quelle (Element und Ausgang), Ziel (Element). Eine Verbindung darf zurückführen (req-fach-047). Die Verwaltung einer Order ist der Bereich der Zeichenfläche, der am Ausgang `gestellt` eines Elements „Order aufgeben“ hängt; ihre Elemente, auch ihre Auslöser, falls sie welche hat, tragen dessen Kennung (req-fach-049a, req-fach-015). Vom Ausgang mit der Verwaltung führt keine Verbindung zu einem Element; die Zugehörigkeit steht am Element. Eine Verwaltung kann wieder ein Element „Order aufgeben“ mit eigener Verwaltung enthalten.

Unzulässige Verbindungen, jede ein Fehler der Konsistenzprüfung (3.6):

| Verbindung | Grund |
|---|---|
| vom Ausgang mit der Verwaltung zu einem Element | Das Element würde zugleich über den Ablauf und als Teil der Verwaltung erreicht. |
| zwischen verschiedenen Abläufen: Hauptablauf und Verwaltung oder zwei Verwaltungen, in beiden Richtungen | `Order` und `Position` sind nur in der eigenen Verwaltung bestimmt (req-fach-049a, req-fach-051); ein Element, das aus einem anderen Ablauf erreicht wird, hätte keine bestimmte Order. |
| zu einem Auslöser | Ein Auslöser steht am Anfang des Ablaufs (req-fach-015, req-fach-046). |
| von oder zu einer Instanz | Instanzen haben keine Ablaufverbindung, sie geben Werte über Datenverbindungen weiter (req-ui-017, req-ablauf-003). |

Zieht der Anwender ein Element in einen Rahmen oder aus ihm heraus, entfernt die Oberfläche seine Verbindungen, die danach unzulässig wären (5.3).

Abschnitt (req-ui-017, req-ui-006): Kennung (UUID), Name, Ablauf, zu dem er gehört (Hauptablauf oder die Verwaltung eines „Order aufgeben“), die Elemente des Abschnitts und ob er eingeklappt ist. Ein Element gehört höchstens zu einem Abschnitt, und nur zu einem Abschnitt seines Ablaufs; kommt es in einen anderen Ablauf (5.3), verlässt es seinen Abschnitt. Grund: Ein eingeklappter Abschnitt ersetzt seine Elemente auf der Zeichenfläche durch einen Kasten; gehörte ein Element zu zwei Abschnitten, wäre es zugleich verborgen und sichtbar, und ein Abschnitt über zwei Abläufe läge zugleich innerhalb und außerhalb eines Rahmens. Abschnitte ändern die Bedeutung der Strategie nicht.

Vorlagen (req-fach-013a): Kennung, Name, Beschreibung, Objekttyp, Standardwerte der Parameter, dazu je Objekttyp:

| Objekttyp | Inhalt |
|---|---|
| mitgelieferter Indikator (EMA, ATR, ZigZag, Markttechnik) | nur Standardwerte der Parameter |
| `Indikator` | die Parameter Instrument und Zeiteinheit, die jeder Indikator hat (req-fach-053, req-fach-054), eigene Parameter (Name, Kennung, Datentyp, Pflicht, Standardwert), enthaltene Instanzen von Indikatoren, enthaltene Regeln und Regelwerke (Instanzen), eigene Eigenschaften, jede mit Name, Kennung, Datentyp und Ausdruck. Ein Ausdruck kann das Ergebnis einer enthaltenen Regel verwenden (`regel.Ergebnis`); so besteht ein Indikator aus Regeln, aus mitgelieferten Indikatoren als fest programmierten Einheiten oder aus beidem (req-fach-013a, req-fach-009) |
| `Trend` | Parameter Instrument, Zeiteinheit und Berechnungsverfahren (req-fach-010, req-param-005). Ein Berechnungsverfahren ist im Elementregister mit eigener Typbeschreibung seiner Parameter angemeldet; die Eigenschaftenansicht zeigt nach der Wahl dessen Parameter (Abschnitt 3.1). Mitgeliefert ist das Verfahren „Ausdruck“: enthaltene Instanzen von Indikatoren, Regeln und Regelwerke wie beim `Indikator`, je ein Ausdruck für die Eigenschaft `Richtung` und für weitere eigene Eigenschaften. |
| `Regel` | Parameter, fachlicher Ausdruck, bestimmte Eigenschaft und Vergleich beim Prüfen (Abschnitt 3.5) |
| `Regelwerk` | Regeln als Instanzen in festgelegter Reihenfolge, optional ein Ausdruck für das Gesamtergebnis (req-fach-041 bis req-fach-045) |

Eigenschaften enthaltener Indikatoren bleiben deren Eigenschaften und sind über die Struktur des umgebenden Objekts ansprechbar (req-fach-012): `trend_h1.ema_20.Wert` ist die Eigenschaft `Wert` der Instanz `ema_20` im Trend `trend_h1`. Diese Schreibweise füllt den in req-fach-012 offenen Punkt vorläufig (Abschnitt 10, Punkt 7).

Namensräume: Innerhalb einer Vorlage sind ihre eigenen Parameter ohne Punkt und ihre enthaltenen Instanzen und Regeln mit ihrer Kennung ansprechbar. In der Strategie sind Instanzen, Bedingungen, Berechnungen, Strategieparameter und die Regeln der Strategie ansprechbar; die Regeln eines Elements nur in den Ausdrücken der Regeln dieses Elements. Eine Regel in einem Regelwerk heißt innerhalb des Regelwerks `regel`, außerhalb `regelwerk.regel`. Für eindeutige Kennungen sorgt die Bibliothek; doppelte Namen meldet die Konsistenzprüfung (3.6). Dieselbe Vorlage an der Strategie und an einem Element ergibt zwei Instanzen in zwei Namensräumen und ist kein Fehler (req-fach-041, req-fach-046).

### 3.4 Ausdrücke

Ausdrücke von Regeln, Bedingungen, Berechnungen, Belegungen und eigenen Eigenschaften folgen einer Auswahl aus OpenFormula (req-fach-036, req-fach-048). Die Bibliothek zerlegt jeden Ausdruck, prüft Namen und Typen und liefert Befunde mit Stelle im Ausdruck. Ausgewertet wird in diesem Vorhaben nicht.

- Werte: Zahlen mit Dezimalpunkt, Texte in doppelten Anführungszeichen, `TRUE()` und `FALSE()`, Prozentzeichen nach einer Zahl.
- Operatoren: `+ - * / ^ &`, Vergleich `= <> < <= > >=`, Vorzeichen, Klammern. Die logischen Operatoren sind in OpenFormula die Funktionen `AND`, `OR`, `NOT`.
- Funktionen der ersten Auswahl: `IF`, `AND`, `OR`, `NOT`, `MIN`, `MAX`, `ABS`, `FLOOR` (abrunden auf eine Schrittweite), `CEILING` (aufrunden auf eine Schrittweite), `ISNA`, `IFNA`, `ISBLANK` und die eigene Funktion `PREVIOUS` mit optionaler Anzahl zurückliegender Werte (req-fach-014). Argumente werden mit `;` getrennt. Gespeichert und eingegeben werden die Namen aus der Norm.
- Erstes Argument von `PREVIOUS` ist ein Name, für den req-fach-014 einen früheren Wert festlegt (im Folgenden: ein Wert mit früherem Wert): eine Eigenschaft eines Objekts mit Zeiteinheit (Indikator, Trend, `Kerze`, auch ohne Instanz), eine Eigenschaft von `Tick` oder das Ergebnis einer Bedingung oder Berechnung. Jedes andere Argument, etwa ein Strategieparameter, `Konto`, `Order`, `Position` oder ein zusammengesetzter Ausdruck, ist ein Fehler. Grund: Für diese Fälle legt das Fachmodell keinen früheren Wert fest, die spätere Ausführung hätte keine Bedeutung (req-system-004).
- Namen: `Objekt.Eigenschaft` in Punkt-Schreibweise, bei enthaltenen Objekten und Objekten als Eigenschaft oder Strategieparameter mehrstufig (`Strategie.filterinstrument.spread`, req-fach-046). Objekt ist ein Objekt der Anwendung, eine Instanz, eine Bedingung oder Berechnung mit `.Ergebnis`, eine Regel mit `.Ergebnis`, oder `Strategie` mit einem Strategieparameter. Parameter einer Regel und eigene Parameter einer Vorlage stehen ohne Punkt. Welche Namen ein Ausdruck sieht, legen die Namensräume in Abschnitt 3.3 fest. Groß- und Kleinschreibung von Namen und Funktionen wird nicht unterschieden.
- Festgelegte Werte einer Auswahl stehen als Text mit ihrer Kennung, zum Beispiel `markttechnik_h1.phase = "bewegung"`. Der Vergleich mit einem Text, der kein Wert dieser Auswahl ist, ist ein Fehler.

Gespeicherte Form und Anzeigeform (req-fach-036, offen für die Spezifikation): Gespeichert wird ein Ausdruck mit Kennungen in der normalisierten Schreibweise. Die Anzeigeform zeigt statt der Kennungen die Namen der Strategie und die Namen der Objekte der Anwendung sowie die Beschriftungen der Eigenschaften und Werte in der gewählten Sprache (`Konto.Kapital`, englisch `Account.Capital`, req-fach-036). Funktionen stehen mit ihren Namen aus der Norm (Abschnitt 10 Punkt 3). Ein Name, der kein einfacher Name nach OpenFormula ist, steht dort in eckigen Klammern: `[EMA 20].Wert`, `Strategie.[Stop-Abstand]`, `[1-2-3-Trend H1].[Trend intakt]`. Die Bibliothek wandelt in beide Richtungen um; bei der Eingabe nimmt sie beide Formen und beide Sprachen an. Ein Name, der sich nicht eindeutig zuordnen lässt, ist ein unbekannter Name. Umbenennen ändert keinen gespeicherten Ausdruck, die Anzeigeform zeigt sofort den neuen Namen.

Entfernen eines Objekts, Strategieparameters, einer Bedingung oder Berechnung, die ein Ausdruck verwendet: Lässt sich der Ausdruck zerlegen, ersetzt die Bibliothek jede Verwendung durch einen leeren Platz; die Konsistenzprüfung meldet ihn als „Ausdruck mit leerem Platz“. Lässt er sich nicht zerlegen, weil er einen Schreibfehler hat, bleibt die Kennung stehen; die Prüfung meldet sie als unbekannten Namen (3.6). Eine Belegung mit der Bindungsart Strategieparameter oder Datenverbindung, deren Quelle entfernt wird, wird „nicht belegt“; das ist nur bei einem Pflichtparameter oder einer MUSS-Eigenschaft ein Befund (req-param-006).

Bausteine (req-ui-015): Die Bibliothek stellt jeden zerlegbaren Ausdruck als Baum von Bausteinen dar und bildet aus einem solchen Baum den Ausdruck. Bausteine sind: Wert (Eigenschaft eines Objekts, Ergebnis, Strategieparameter, Parameter, fester Wert, auch ein leerer Platz), Vergleich, Rechnung, Verknüpfung (und, oder, nicht), Fallunterscheidung (wenn … dann … sonst), jede andere Funktion der Liste und die Kreuzung. Die Kreuzung „A kreuzt B nach oben“ steht für `AND(PREVIOUS(A) <= PREVIOUS(B); A > B)`, „nach unten“ für `AND(PREVIOUS(A) >= PREVIOUS(B); A < B)`, „in beide Richtungen“ für das `OR` aus beiden. A und B können jeder Wert sein. `PREVIOUS` steht nur um einen Wert, für den ein früherer Wert festgelegt ist (Punkt zu `PREVIOUS` oben); jeder andere Wert, etwa ein fester Wert oder ein Strategieparameter, steht an beiden Stellen selbst: „EMA 20 kreuzt 50 nach oben“ ist `AND(PREVIOUS(A) <= 50; A > 50)`. Hat weder A noch B einen früheren Wert, bieten die Bausteine die Kreuzung nicht an, weil nichts kreuzen kann. Die Bibliothek erkennt diese Form beim Zerlegen wieder, auch innerhalb von `AND` und `OR`. Damit ist jeder Ausdruck ohne Schreibfehler als Bausteine darstellbar, und beide Ansichten zeigen denselben Ausdruck. Ein leerer Platz ergibt einen unvollständigen Ausdruck; er wird gespeichert und von der Konsistenzprüfung gemeldet (3.6). Ein Ausdruck mit Schreibfehler hat keine Bausteine, die Oberfläche zeigt ihn nur in der Formelansicht mit dem Fehler.

Zu einem Ausdruck liefert die Bibliothek außerdem seine Zeichen mit Art (Name, Funktion, Wert, Operator, Klammer) und Stelle, die Befunde mit Stelle und die an der Stelle des Ausdrucks sichtbaren Namen mit ihren Eigenschaften, Datentypen und Erklärungen. Daraus zeigt die Oberfläche Hervorhebung, zusammengehörige Klammern, Fehler an der Stelle und Vorschläge nach `Objekt.` (req-ui-013, req-ui-015).

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

Eine Regel, die `Order` oder `Position` anspricht, selbst oder über das Ergebnis einer anderen Regel, steht nur dort, wo eine Order vorhanden ist: als Regel der Strategie, am Element „Order aufgeben“ und in dessen Verwaltung (req-fach-051, Entscheidung des Auftraggebers am 2026-10-16):

- Enthält ein Indikator oder Trend eine solche Regel, auch in einem Regelwerk, ist schon das Einfügen ein Fehler, gleich ob ein Ausdruck ihr Ergebnis verwendet. Das gilt für die Vorlage und für jede Instanz davon.
- Im Hauptablauf steht eine Regel nur an „Order aufgeben“ (req-ui-012; die übrigen Elemente mit Regeln sind außerhalb einer Verwaltung ein Fehler, Abschnitt 3.6). Verwendet ein Ausdruck im Hauptablauf das Ergebnis einer solchen Regel, ist das ein Fehler als Verwendung im Ablauf außerhalb einer Verwaltung (req-fach-051).
- In der Verwaltung sieht die Regel die Order und Position der Verwaltung.

Damit gibt es keine Regel, die nur deshalb nicht angewendet wird, weil es keine Order gibt. Nicht angewendet wird eine Regel nur nach req-fach-046, wenn der Ordertyp eine angesprochene Eigenschaft nicht hat. `Position` in einer Regel, die auf eine Order angewendet wird, fängt der Ausdruck mit `ISNA` oder `IFNA` ab, wie „Risiko je Trade“ (Abschnitt 3.5); sonst gilt die Tabelle oben.

### 3.5 Regeln: bestimmen und prüfen, Regelvorlage „Risiko je Trade“

Eine Regel hat neben Kennung, Name, Parametern und fachlichem Ausdruck (req-fach-035) zwei technische Angaben, die req-fach-020 und req-ablauf-007 voraussetzen:

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

`Instrument` steht im Ausdruck ohne Instanz und bezeichnet nach 3.1 das Instrument der Order beziehungsweise Position, auf die die Regel angewendet wird. Der Ausdruck liefert das größte Volumen, abgerundet auf den Volumenschritt, bei dem der Verlust vom Preis bis zum Stop-Loss die Risikogrenze nicht übersteigt. Liegt der Stop-Loss auf oder hinter dem Preis, ist kein Verlust möglich: Der Ausdruck liefert dann das vorhandene Volumen, die Prüfung ist erfüllt, und es wird nicht durch null geteilt. Bei „Order aufgeben“ ist das Volumen in diesem Fall noch „leer“, die Regel kann es nicht bestimmen. So bildet er die Fälle ab:

| Fall | Preis | Stop-Loss | Wirkung |
|---|---|---|---|
| „Order aufgeben“ mit Markt-, Stop- oder Limit-Order | `Order.Preis` (bei der Marktorder der angenommene Preis, req-fach-019) | `Order.Stop_Loss` | bestimmt das Volumen |
| „Order aufgeben“ mit Stop-Limit-Order | `Order.Limitpreis`, der Preis, zu dem die Position entsteht | `Order.Stop_Loss` | bestimmt das Volumen |
| „Order ändern“ | wie bei „Order aufgeben“, mit den geänderten Werten | geänderter Stop-Loss | prüft das bestehende Volumen; bestimmen und prüfen rechnen bei derselben Order mit demselben Preis (N10) |
| „Position ändern“, Prüfung nach der Ausführung | `Position.Einstiegspreis` | `Position.Stop_Loss`, bei „Position ändern“ der neue | prüft das Volumen der Position; ein Stop-Loss auf oder hinter dem Einstiegspreis, etwa nachgezogen in `str-03`, erfüllt die Prüfung |
| Schließorder | `CloseOrder` hat weder Richtung noch Stop-Loss, das Ergebnis ist „nicht verfügbar“ | – | wird nicht angewendet (req-fach-046) |
| Order oder Position ohne Stop-Loss | Stop-Loss ist „leer“ | – | Fehler: Volumen nicht bestimmbar beziehungsweise Prüfung nicht erfüllt, weil der Verlust unbegrenzt ist |

### 3.6 Konsistenzprüfung

Die Konsistenzprüfung läuft beim Speichern, auf Anforderung und für Vorlagen beim Speichern der Vorlage (req-ablauf-007). Ein Befund hat Stufe (Fehler oder Hinweis), Kennung, betroffenes Element oder betroffene Instanz oder Regel (oder keines), bei Ausdrücken die Stelle, und Angaben für den Text. Die Texte in Deutsch und Englisch, mit dem Weg zur Behebung, stehen in der Oberfläche (req-ui-007, req-ui-016).

| Befund | Stufe | Grundlage |
|---|---|---|
| Auslöser ohne Verbindung in den Ablauf | Fehler | req-ablauf-007 |
| Element des Ablaufs ohne eingehende Verbindung in einem Ablauf (Hauptablauf oder Verwaltung) mit Auslöser; Instanzen auf der Zeichenfläche sind ausgenommen | Fehler | req-ablauf-007, req-fach-015 |
| unzulässige Verbindung nach 3.3: vom Ausgang mit der Verwaltung, zwischen verschiedenen Abläufen, zu einem Auslöser, von oder zu einer Instanz | Fehler | req-fach-049a, req-fach-015, req-ui-017 |
| fehlerhafter Ausdruck: Schreibfehler, unbekannte Funktion, unbekannter Name (auch ein entferntes Objekt oder ein entfernter Strategieparameter), unbekannte Eigenschaft, unpassender Typ, unbekannter Wert einer Auswahl | Fehler | req-ablauf-007, Abschnitt 3.4 |
| Ausdruck fehlt oder enthält einen leeren Platz (Bedingung, Berechnung, Parameter setzen, Regel, eigene Eigenschaft, Richtung des Trends, Belegung mit Ausdruck) | Fehler, Angabe ohne Wert | req-ablauf-007 |
| `PREVIOUS` mit einem Argument, für das kein früherer Wert festgelegt ist (3.4) | Fehler | req-fach-014 |
| Datenverbindung zu einer Instanz oder Eigenschaft, die es nicht gibt | Fehler | req-ui-014, req-ablauf-007 |
| Datenverbindung zwischen unverträglichen Datentypen: Belegung mit Bindungsart Datenverbindung, deren Eigenschaft nicht zum Datentyp des Parameters oder der Eigenschaft passt | Fehler | req-ablauf-007 |
| Eingang, den kein Ausdruck des Elements oder seiner Regeln verwendet | Hinweis | req-ui-014 |
| Ergebnis einer bestimmenden Regel passt nicht zur bestimmten Eigenschaft | Fehler | req-ablauf-007 |
| Rückführung ohne Bedingung, die sie beendet: ein Kreis im Ablauf, auf dem keine Bedingung liegt, von der ein Ausgang aus dem Kreis hinausführt oder ohne Fortsetzung endet | Fehler | req-ablauf-007, req-fach-047 |
| Pflichtparameter ohne Wert und nicht „bei der Anwendung“ | Fehler, Angabe ohne Wert | req-param-006, req-ablauf-007 |
| MUSS-Eigenschaft der Order, die der Anwender belegt, ohne Belegung und ohne bestimmende Regel der Strategie oder des Elements | Fehler, Angabe ohne Wert | req-fach-021, req-ablauf-007 |
| Regelwerk mit Vorwärtsbezug oder Zirkelbezug | Fehler | req-fach-045 |
| `Order` oder `Position` im Ablauf außerhalb einer Verwaltung, auch über das Ergebnis einer Regel | Fehler | req-fach-051 |
| Regel, die `Order` oder `Position` anspricht, in einem Indikator oder Trend, auch in einem Regelwerk darin (Abschnitt 3.4) | Fehler | req-fach-051 |
| `Kerze` ohne Instanz, wenn ein Auslöser außer `Kerzenschluss` oder kein Auslöser die Auswertung starten kann: bei einem Element des Ablaufs und seinen Regeln, wenn das Element in seinem Ablauf (Hauptablauf beziehungsweise seine Verwaltung) von keinem Auslöser oder von mindestens einem anderen Auslöser als `Kerzenschluss` erreicht wird; eine Verwaltung ohne eigene Auslöser startet kein Auslöser (req-fach-049a). Bei einer Regel der Strategie, wenn das für mindestens ein Element mit Regeln (3.2) gilt, auf das sie angewendet wird. Bei einer Instanz auf der Zeichenfläche, wenn die Strategie, Hauptablauf und alle Verwaltungen zusammen, keinen Auslöser oder mindestens einen anderen als `Kerzenschluss` hat | Fehler | req-fach-051, req-fach-049a |
| Order ändern, Order löschen, Position ändern oder Position schließen außerhalb einer Verwaltung | Fehler | req-fach-049a |
| Name doppelt vergeben innerhalb eines Namensraums (Abschnitt 3.3) | Fehler | eindeutige Namen für Ausdrücke, req-fach-036, req-ui-016 |
| unbekannter Elementtyp oder Objekttyp | Fehler | req-ablauf-008 |
| kein Element „Order aufgeben“ im Hauptablauf erreichbar: von einem Auslöser des Hauptablaufs, bei einem Hauptablauf ohne Auslöser von einem Element ohne eingehende Verbindung; nicht gemeldet für eine Strategie ohne Auslöser und ohne Elemente des Ablaufs | Hinweis | req-ablauf-007, Plan `wp02` Abnahmekriterium 2 |

Eine Strategie ohne Auslöser ist kein Befund (req-fach-015, req-fach-046). Wo die Auswertung eines Ablaufs ohne Auslöser beginnt, ist offen und wird mit den Anforderungen an das Handelssystem geklärt; der Aufbau darf sie nicht ausschließen (req-fach-015, req-fach-047). Deshalb ist in einem Hauptablauf oder einer Verwaltung ohne eigene Auslöser ein Element ohne eingehende Verbindung kein Befund: Es ist ein möglicher Beginn der Auswertung (Abschnitt 10, Punkt 17). Eine Strategie mit Fehlern kann nicht ausgeführt werden (req-ablauf-007); ein Fehler an dieser Stelle schlösse die Auswertung ohne Auslöser aus. Eine neue, leere Strategie erhält bei „Prüfen“ keinen Befund; das gibt der Auftraggeber mit dem Abnahmekriterium 2 von `wp02` vor (Meldung des Projektleiters vom 2026-10-18). Leer heißt: ohne Auslöser und ohne Elemente des Ablaufs; Instanzen auf der Zeichenfläche, Strategieparameter und Regeln der Strategie zählen nicht. Die Testfälle haben in Hauptablauf und Verwaltung Auslöser und sind davon nicht betroffen.

### 3.7 Dokumente und Schemata

Strategie und jede Vorlage werden als JSON-Dokument geschrieben und gelesen. Kopffelder: `format` (`pipwerk.strategy`, `pipwerk.indicator`, `pipwerk.trend`, `pipwerk.rule`, `pipwerk.ruleset`) und `format_version` `2.0`. Die Pydantic-Modelle in `pipwerk_domain.documents` lehnen zusätzliche Felder ab. Aus ihnen werden die JSON-Schemata erzeugt und unter `contracts/strategies/v2/` abgelegt (req-system-022). Ein Dokument mit höherer Hauptversion wird abgelehnt.

Lesen von Format 1.0 (E9): Die Schemata unter `contracts/strategies/v1/` bleiben. Ein Dokument 1.0 wird beim Lesen nach 2.0 umgewandelt und erst beim nächsten Speichern als 2.0 geschrieben:

- Kennung im Ausdruck: der bisherige Name. Ausdrücke bleiben damit unverändert gültig. Fällt er ohne Unterscheidung von Groß- und Kleinschreibung mit einem Objekt der Anwendung oder einer Funktion zusammen, bildet die Umwandlung eine eindeutige Kennung nach 3.3 und ersetzt ihn in den Ausdrücken seines Namensraums; in 1.0 verdeckte er dort das Objekt der Anwendung, die Bedeutung bleibt also gleich. Eine Bedingung oder Berechnung ohne bisherigen Namen erhält eine Kennung nach 3.3 aus ihrer bisherigen Bezeichnung.
- Name: die bisherige Bezeichnung, wo es eine gibt, sonst der bisherige Name; bei einem Element, das ein Objekt zeigt, die Bezeichnung des Elements als Name der Instanz. Enthält das Ergebnis `_` und kein Leerzeichen, also Programmierschreibweise, erscheinen Leerzeichen statt `_` und ein großer Anfangsbuchstabe („Order ausgefuehrt“, „Stop abstand“). Umlaute stellt die Umwandlung nicht wieder her, weil „ue“ nicht immer „ü“ ist. Die Namen weichen damit vom Prototyp ab, der sie von Hand gesetzt hat; der Anwender kann sie umbenennen (Abschnitt 10 Punkt 18).
- Herkunft aus einer mitgelieferten Vorlage oder einem Objekttyp: nur die Kennung, der gespeicherte Name entfällt (unten).
- Lage auf der Zeichenfläche entfällt; die Oberfläche ordnet neu an.
- Parameter `Kursquelle` des EMA wird `Anwenden auf` mit demselben Wert (req-fach-054).
- Parameter und Eigenschaften `Instrument`, die es in 1.0 nicht gab, erhalten die Vorbelegung „Instrument der Anwendung“.
- Eingänge und Abschnitte sind leer, die Ausrichtung ist senkrecht.

Die vom Auftraggeber gebaute Strategie „EMA-Trendfolge“ wird so ohne Neubau geöffnet (Abschnitt 1).

Ein Elementtyp oder Objekttyp ist im Dokument eine Zeichenkette. Ein Dokument mit unbekanntem Typ ist deshalb gültig und wird geladen; die Konsistenzprüfung meldet den Typ (req-ablauf-008). Ein solches Element erscheint auf der Zeichenfläche mit der Kennung seines Typs und rot umrandet; es lässt sich verschieben, verbinden und löschen, seine Belegungen zeigt die Eigenschaftenansicht nur lesend und sie bleiben beim Speichern unverändert erhalten. Gespeichert werden nur Kennungen und die Namen des Anwenders, keine übersetzten Texte (req-ui-007). Die Herkunft einer Instanz aus einer mitgelieferten Vorlage oder einem Objekttyp speichert deshalb nur dessen Kennung; die Oberfläche zeigt den Namen in der gewählten Sprache (Mangel M4). Nur bei einer eigenen Vorlage speichert sie deren Namen zum Zeitpunkt des Einfügens (E4). Schreiben und erneutes Lesen ergeben dasselbe Objekt.

## 4. Backend von pipwerk Studio

### 4.1 Objektverzeichnis

- Einstellung „Objektverzeichnis“ in der Datenbank der Komponente (req-ui-009, req-system-016), absoluter Pfad. Solange nichts gespeichert ist, gilt `$HOME/.local/share/pipwerk/studio/objects`, unter Windows `%LOCALAPPDATA%\pipwerk\studio\objects`; wurde die Startkonfiguration unter `/etc/pipwerk` beziehungsweise `%PROGRAMDATA%\pipwerk` gefunden, `/var/lib/pipwerk/studio/objects` beziehungsweise `%PROGRAMDATA%\pipwerk\studio\objects`. Fehlt das Verzeichnis, legt das Backend es beim ersten Schreiben an.
- Die Einstellung steht in der Tabelle `studio_settings`. Das Schema der Datenbank verwaltet Alembic; eine bestehende Datenbank eines früheren Schemas wird beim Start auf den neuen Stand gebracht. Beides ist mit `wp01` umgesetzt (`docs/technical/pipwerk-studio.md`, Abschnitt 2.1); diese Fassung ändert das Schema nicht.
- Je Objekt eine Datei `<uuid>.<art>.json` mit `<art>` aus `strategy`, `indicator`, `trend`, `rule`, `ruleset`. Der Dateiname entsteht nur im Backend aus einer geprüften UUID. Geschrieben wird über eine temporäre Datei im selben Verzeichnis und Umbenennen.
- Eine Datei, die sich nicht lesen lässt oder dem Schema nicht entspricht, erscheint in der Liste mit Kennzeichen „nicht lesbar“ und wird nicht verändert. Eine Datei im Format 1.0 wird umgewandelt gelesen (3.7) und bleibt unverändert, bis der Anwender sie speichert.
- Ändern des Objektverzeichnisses (req-ablauf-009): Mit „verschieben“ verschiebt das Backend alle Dateien nach dem Muster oben in das neue Verzeichnis und speichert erst danach die Einstellung. Liegt dort schon eine Datei gleichen Namens, wird nichts verschoben und die Änderung mit Fehler abgelehnt. Scheitert das Verschieben unterwegs, holt das Backend die schon verschobenen Dateien zurück, behält die alte Einstellung und meldet den Fehler; gelingt auch das nicht, nennt die Meldung beide Verzeichnisse und die betroffenen Dateien. Ohne „verschieben“ wird nur die Einstellung gespeichert. Eine geöffnete Strategie bleibt geöffnet und wird beim nächsten Speichern in das neue Verzeichnis geschrieben.

### 4.2 Web-API

Öffentliche Web-API unter `/api/v1/` (req-system-009, E9), beschrieben in `contracts/api/pipwerk-studio/v1/openapi.json`. `<art>` steht für `strategies`, `indicators`, `trends`, `rules`, `rulesets`.

| Methode | Pfad | Zweck |
|---|---|---|
| `GET` | `/api/v1/element-types` | alle Typbeschreibungen mit Gruppen und Erklärungen, die mitgelieferten Vorlagen und die Liste der Funktionen mit Erklärungen ihrer Argumente |
| `GET` | `/api/v1/<art>` | Liste mit Kennung, Name, Beschreibung, Objekttyp, Zeitpunkt der letzten Änderung |
| `POST` | `/api/v1/<art>` | anlegen; Antwort mit Kennung und Befunden der Konsistenzprüfung |
| `GET`, `PUT`, `DELETE` | `/api/v1/<art>/{id}` | lesen, speichern (auch mit Befunden, Antwort mit Befunden), löschen |
| `GET` | `/api/v1/<art>/{id}/usages` | Strategien und Vorlagen mit Instanzen aus dieser Vorlage (req-ablauf-006) |
| `POST` | `/api/v1/check` | Konsistenzprüfung eines Dokuments ohne Speichern; liefert Befunde und je Ausdruck die erkannten Namen mit Stelle |
| `POST` | `/api/v1/expressions` | zu einem Ausdruck an einer Stelle eines Dokuments, in gespeicherter Form, Anzeigeform oder als Bausteine, und einer Sprache: gespeicherte Form, Anzeigeform, Bausteine, Zeichen mit Art und Stelle, Befunde mit Stelle, sichtbare Namen mit Eigenschaften (3.4) |

Dokumente nimmt die Web-API in Format 2.0 und 1.0 an und liefert sie in 2.0 (3.7). Interne Endpunkte für die Einstellung: `GET` und `PUT /api/studio/settings/object-directory`, beim Schreiben mit Pfad und „verschieben“ ja oder nein. Die bestehenden internen Endpunkte bleiben.

Ein Dokument, das dem Schema nicht entspricht, wird mit HTTP 422 abgelehnt; Befunde der Konsistenzprüfung verhindern das Speichern nicht (req-ablauf-005). Jede Fehlerantwort trägt eine Kennung der Ursache und die Angaben dazu; den Text in der gewählten Sprache bildet die Oberfläche (req-ui-007, Mangel M4).

## 5. Oberfläche

Vorlage ist der bestätigte Prototyp (E8). Was dieser Abschnitt nicht festlegt, folgt dem Prototyp und seiner Beschreibung (`strategiedesign/proto-studio:components/pipwerk-studio/prototype/README.md`). Abschnitt 10 Punkte 9 bis 13 sind vorläufig, bis der Auftraggeber sie getestet hat.

### 5.1 Aufbau und Fenstergrößen

| Bereich | Inhalt |
|---|---|
| Kopfzeile | Menü mit „Neue Strategie“, „Öffnen“, „Speichern“, „Prüfen“, „Schließen“, „Löschen“ und „Einstellungen“; Zahl der Befunde, ein Klick öffnet die Eigenschaftenansicht der Strategie mit der Liste der Befunde; rechts „Über pipwerk Studio“ (req-ui-010). Die Sprachauswahl liegt in den Einstellungen (req-ui-009). |
| Strategieparameter | dauerhaft sichtbarer Streifen unter der Kopfzeile: je Strategieparameter Name und Wert, ein Klick ändert ihn, „Neu“ legt einen an (Mangel M12) |
| links | Elementbibliothek in Gruppen (5.2) mit Suche und „Neues Objekt“ |
| Mitte | Zeichenfläche (5.3) |
| rechts | Eigenschaftenansicht des ausgewählten Elements, der ausgewählten Regel, eines Rahmens oder Abschnitts, nach Klick auf die leere Zeichenfläche der Strategie (req-ui-005), einer geöffneten Vorlage (5.5) |
| Fußzeile | Backend-Status und Stand (req-ui-010) |

Alle Texte in Deutsch und Englisch, Beschriftungen und Erklärungen der Typen aus den Typbeschreibungen. Vom Anwender vergebene Namen und Texte werden nicht übersetzt. Alle sichtbaren Texte, auch Befunde, Dialoge und Rückfragen, sind in Händlersprache, ohne Begriffe der Programmierung (Mangel M8). Erscheinungsbild nach dem Prototyp: einheitliche Farben, Abstände, Schrift und Symbole, gestaltete Steuerelemente statt der Standardsteuerelemente des Browsers, gruppierte Eigenschaftenansicht mit klarer Rangfolge, zurückhaltendes „Entfernen“, Elemente auf der Zeichenfläche bei normaler Ansicht lesbar (Mangel M10).

Fenstergrößen (req-system-024, Mangel M2): Die Oberfläche hat drei Anordnungen nach der Breite des Fensters:

| Breite | Anordnung |
|---|---|
| ab 1100 Pixel | Elementbibliothek, Zeichenfläche und Eigenschaftenansicht nebeneinander |
| 700 bis 1099 Pixel | Zeichenfläche und ein Seitenbereich mit Reitern für Elementbibliothek und Eigenschaftenansicht |
| unter 700 Pixel | ein Bereich nach dem anderen, umschaltbar über eine Leiste; Dialoge füllen die Breite |

Bei geringer Höhe werden Kopfzeile, Streifen der Strategieparameter und Fußzeile niedriger. Geprüfte Fenstergrößen (Breite × Höhe in Pixeln): 390 × 844, 844 × 390, 820 × 1180, 1180 × 820, 1366 × 768, 1920 × 1080. In jeder davon liegen keine Bereiche übereinander, keiner hat Breite oder Höhe null, die Seite hat keine waagerechte Bildlaufleiste, und Elementbibliothek, Zeichenfläche, Eigenschaftenansicht und Strategieparameter sind erreichbar. In 390 × 844 und 844 × 390 gilt dasselbe auch für Menü, Dialoge (Öffnen, Einstellungen, Rückfragen, „Über pipwerk Studio“), Ansicht einer Vorlage, Bausteine, Formeleditor und geführten Aufbau. Jede Bedienung, die Ziehen verwendet, hat einen Weg ohne Ziehen: Einfügen und Verbinden mit Klick (5.2, 5.3), Werte über die Bausteine (5.4), Zugehörigkeit zu einer Verwaltung und zu einem Abschnitt und die Reihenfolge der Instanzen im Bereich für Objekte über die Eigenschaftenansicht (5.4). Das freie Verschieben eines Elements ist ohne Ziehen nicht nötig, weil die Oberfläche selbst anordnet.

### 5.2 Elementbibliothek

Gruppen und Inhalte, vom Auftraggeber festgelegt (Mangel M8), aus dem Feld „Gruppe“ der Typbeschreibungen:

| Gruppe | Inhalt |
|---|---|
| Wann wird gerechnet | Kerzenschluss, Tick |
| Bedingungen und Aktionen | Bedingung, Berechnung, Strategieparameter ändern, Order aufgeben, Order ändern, Order löschen, Position ändern, Position schließen |
| Markt und Konto | Konto, Instrument, Kerze, Tick |
| Indikatoren | EMA, ATR, ZigZag, eigener Indikator |
| Trends | 1-2-3-Trend (Markttechnik), eigener Trend |
| Regeln | Risiko je Trade, eigene Regel, eigenes Regelwerk |

Gespeicherte Vorlagen stehen in der Gruppe ihres Objekttyps, gekennzeichnet als „eigene“. Jeder Eintrag zeigt beim Zeigen und beim Fokussieren mit der Tastatur seine Erklärung. Ein Klick fügt das Element hinter dem gewählten Schritt ein und verbindet es; Ziehen legt es auf die Fläche, auf ein Element (dahinter) oder in einen Rahmen (in diese Verwaltung). Auf Touchgeräten gilt der Klick. Eine Instanz entsteht mit den Standardwerten und einem Namen aus dem Namen des Typs beziehungsweise der Vorlage in der gewählten Sprache, eindeutig gemacht (req-ablauf-003). Mitgelieferte Typen und „Risiko je Trade“ lassen sich ansehen, nicht ändern und nicht löschen (E6). Eine eigene Vorlage öffnet und löscht der Anwender aus ihrem Eintrag.

### 5.3 Zeichenfläche

- Ablauf nach req-ui-017: senkrecht, Eingang oben, Ausgänge unten, bei einer Bedingung `wahr` und `falsch` nebeneinander. Ein Umschalter „Senkrecht / Waagerecht“ auf der Zeichenfläche dreht den Ablauf (Eingang links, Ausgänge rechts); senkrecht ist der Standard, die Wahl gehört zur Strategie (3.3, Abschnitt 10 Punkt 9).
- Anordnung: Die Oberfläche ordnet die Elemente selbst an, mit möglichst wenigen Kreuzungen (E8). Der Anwender kann ein Element des Ablaufs oder einen Auslöser verschieben; dann gilt dessen Lage (3.3). Eine Instanz verschiebt er nur innerhalb des Bereichs „Objekte und ihre Werte“, das ändert ihre Reihenfolge dort. Elemente liegen nie sichtbar im Rahmen einer Verwaltung, zu der sie nicht gehören. Die Ansicht ändert sich nur beim Öffnen, beim Einpassen auf Wunsch und so weit, wie nötig, um ein neues Element außerhalb der Ansicht zu zeigen; beim Ablegen springt sie nicht (Mangel M3). Zoom, Verschieben der Ansicht und Einpassen.
- Verbindungen: vom Ausgang eines Schritts auf den nächsten ziehen, oder den Ausgang anklicken und dann den nächsten Schritt. Eine gewählte Verbindung lässt sich löschen.
- Verwaltung: Rahmen am Ausgang `gestellt`, einklappbar (req-ui-002, req-ui-006). Elemente, die in den Rahmen gezogen oder bei gewähltem Rahmen eingefügt werden, gehören zur Verwaltung; herausgezogen gehören sie nicht mehr dazu. Verbindungen, die dadurch zwischen verschiedenen Abläufen lägen, entfernt die Oberfläche (3.3).
- Abschnitte: In der Eigenschaftenansicht eines Schritts wählt der Anwender einen Abschnitt oder bildet einen neuen. Ein Abschnitt hat einen Titel mit Namen und lässt sich einklappen; eingeklappt zeigt er einen Kasten mit seinem Namen und der Zahl seiner Schritte, die Verbindungen bleiben sichtbar (req-ui-017).
- Bereich „Objekte und ihre Werte“: Instanzen (Indikatoren, Trends, Objekte der Anwendung auf der Zeichenfläche) liegen geordnet in einem eigenen Bereich neben dem Ablauf, bei waagerechtem Ablauf darüber (req-ui-017). Ein Objekt ist eine Karte; jede Eigenschaft ist eine Zeile mit Namen, Datentyp und Anschlusspunkt. Sichtbar sind die verwendeten Eigenschaften, bei einem unbenutzten Objekt die ersten drei; „Alle n Eigenschaften“ klappt die übrigen auf (Abschnitt 10 Punkt 10).
- Datenverbindungen (req-ui-014): Der Anwender zieht vom Anschlusspunkt einer Eigenschaft auf ein Element; es entsteht ein Eingang. Ein Element hat einen einzigen Eingangspunkt an der Seite zum Bereich für Objekte, sobald eine Linie dort endet; seine Eingänge nennt die Eigenschaftenansicht. Eine Linie von Karte zu Karte zeigt eine Belegung mit der Bindungsart Datenverbindung. Linien: Ablauf durchgezogen mit Pfeil, Verwaltung grün gepunktet, Wert gestrichelt in einer Farbe je Objekt; ein Wert, den nur ein Ausdruck verwendet, blasser und gepunktet. Mehrere Werte desselben Objekts zum selben Element sind eine Linie mit der Zahl der Werte. Ein Umschalter „Alle / Auswahl / Aus“ zeigt die Wertlinien aller Elemente, nur die des gewählten Elements oder keine (Abschnitt 10 Punkt 11). Eine Legende erklärt die Linien. Ergebnisse von Bedingungen und Berechnungen und Objekte der Anwendung ohne Instanz auf der Zeichenfläche haben keine Linie.
- Befunde nach req-ui-011: Element mit Fehler rot, mit Hinweis orange umrandet; Befunde ohne Element in der Eigenschaftenansicht der Strategie (Abschnitt 10 Punkt 1). Keine Meldung zum Wegklicken; bestätigt werden nur kritische Fehler wie fehlgeschlagenes Speichern.

### 5.4 Eigenschaftenansicht, Bausteine und Formeleditor

- Aufbau aus der Typbeschreibung: Name, Herkunft einer Instanz („EMA 20, aus Objekttyp EMA“, req-ui-005), Parameter, Eigenschaften, die das Objekt liefert, mit Datentyp und möglichen Werten (Mangel M7), Eingänge, Regeln, Abschnitt, Zugehörigkeit zu einer Verwaltung, bei einer Instanz „nach oben“ und „nach unten“ für ihre Stelle im Bereich für Objekte, Befunde. Jedes Feld hat eine Erklärung beim Zeigen (req-ui-016). Interne Kennungen erscheinen nicht.
- Belegung je Parameter mit sichtbarer Beschriftung „Belegung“ und den Bindungsarten „fester Wert“, „Strategieparameter“, „Wert eines Objekts“ (Datenverbindung), „Ausdruck“, „bei der Anwendung“, soweit die Typbeschreibung sie erlaubt; vorbelegt „nicht belegt“ beziehungsweise der Standardwert. „Strategieparameter“ ist eine Auswahl der angelegten mit „Neuer Strategieparameter“ an Ort und Stelle; ist keine Auswahl möglich, sagt ein Hinweis warum und was zu tun ist (Mängel M5, M12). Ebenso der Strategieparameter von „Strategieparameter ändern“.
- Ein Trend lässt sich in der Strategie vollständig belegen: Instrument, Zeiteinheit, Berechnungsverfahren und der Ausdruck für `Richtung` (Mangel M6).
- Ordertyp: Wählt der Anwender einen anderen Ordertyp, erhalten die neu gebrauchten Eigenschaften ihre Standardwerte.
- Bedingungen, Berechnungen, Belegungen mit Ausdruck und Regeln entstehen aus Bausteinen (req-ui-015, 3.4): Werte aus Listen mit der Gruppe „Verbundene Werte“ (die Eingänge des Elements) zuerst, dann Objekte der Strategie, Objekte der Anwendung, Ergebnisse, Strategieparameter und feste Werte; Vergleiche, Rechnungen, Verknüpfungen und Funktionen aus Listen in Händlersprache, zum Beispiel „kreuzt nach oben“, „ist größer als“, „und“, „vorheriger Wert von“. Wählt der Anwender in den Bausteinen die Eigenschaft einer Instanz, entsteht dazu ein Eingang. Zeichenfläche und Eigenschaftenansicht zeigen den Ausdruck als lesbaren Satz.
- Formelansicht für Fortgeschrittene, umschaltbar mit den Bausteinen: mehrzeiliger Formeleditor mit Anzeigeform, farbiger Hervorhebung von Namen, Funktionen und Werten, Markierung zusammengehöriger Klammern, Fehler unterstrichen an der Stelle mit Erklärung beim Zeigen, nach `Objekt.` die Liste der Eigenschaften mit Datentyp und Erklärung, auch nach dem Namen einer Bedingung oder Berechnung (Mangel M15), bei Funktionen die Erklärung der Argumente während der Eingabe (req-ui-013, req-ui-015). Grundlage ist der Endpunkt `/api/v1/expressions`.
- Regeln zuordnen (req-ui-012, req-fach-044): in der Eigenschaftenansicht der Strategie und der Elemente mit Regeln: Regel, Vorlage einer Regel oder eines Regelwerks hinzufügen, Reihenfolge ändern, entfernen; eine Regel kann auch neu entstehen (Objekttyp `Regel`).
- Umbenennen: Alle Verwendungen zeigen sofort den neuen Namen, ohne Rückfrage (3.4, Abschnitt 10 Punkt 12).
- Entfernen eines Objekts oder Strategieparameters, das verwendet wird: Rückfrage mit der Liste der Elemente, die es verwenden, bei „Order aufgeben“ mit den Schritten der Verwaltung, die mit entfernt werden. Danach sind Linien und Eingänge weg; in Ausdrücken und Belegungen gilt 3.4, Absatz „Entfernen“. Die Konsistenzprüfung meldet entstandene Lücken mit dem Weg zur Behebung (3.6, Abschnitt 10 Punkt 13). Hat ein entfernter Schritt genau eine eingehende und eine ausgehende Verbindung, verbindet die Oberfläche Vorgänger und Nachfolger.

### 5.5 Arbeitsabläufe

| Ablauf | Bedienung | Grundlage |
|---|---|---|
| Strategie anlegen | „Neue Strategie“ öffnet eine leere Zeichenfläche und bietet den geführten Aufbau an: Name, Auslöser, Indikatoren, Bedingung, Order. Jeder Schritt legt dieselben Elemente an wie die Bedienung von Hand; „Ohne Assistent weiterarbeiten“ verlässt ihn jederzeit, Angelegtes bleibt. Gespeichert wird erst mit „Speichern“. | req-ablauf-002, req-ui-016 |
| Objekt verwenden | aus der Elementbibliothek einfügen (5.2); Name und Parameter in der Eigenschaftenansicht; „Als Vorlage speichern“ in der Eigenschaftenansicht der Instanz | req-ablauf-003 |
| Regeln zuordnen | 5.4 | req-ui-012 |
| Objekt anlegen, öffnen, ändern | „Neues Objekt“ mit Objekttyp, oder eigene Vorlage aus der Elementbibliothek öffnen. Die Vorlage erscheint als eigene Ansicht mit „Speichern“, „Prüfen“, „Schließen“ und „Löschen“; die geöffnete Strategie bleibt dahinter unverändert offen. Enthaltene Instanzen, Regeln und Regelwerke fügt der Anwender dort aus der Elementbibliothek hinzu, ändert ihre Reihenfolge oder entfernt sie; eigene Parameter und Eigenschaften legt er an, ihre Ausdrücke aus Bausteinen. Befunde der Vorlage stehen bei dem betroffenen Teil. Beim Schließen mit ungespeicherten Änderungen gilt dieselbe Rückfrage wie bei einer Strategie. | req-ablauf-004, req-ablauf-007, req-ablauf-008, req-ui-011 |
| Speichern | speichert immer, zeigt danach die Befunde | req-ablauf-005 |
| Prüfen | zeigt die Befunde; jeder nennt, wie man ihn behebt, und führt per Klick zur Stelle, bei Ausdrücken zur Stelle im Ausdruck | req-ablauf-007, req-ui-016 |
| Schließen | bei ungespeicherten Änderungen Rückfrage „Speichern“, „Verwerfen“, „Abbrechen“; ebenso vor „Neue Strategie“ und „Öffnen“ | req-ablauf-005 |
| Öffnen | Liste der Strategien mit Name, Beschreibung, letzter Änderung | req-ablauf-008 |
| Löschen | Strategie über „Löschen“ in der Kopfzeile, Vorlage in ihrer Ansicht oder an ihrem Eintrag in der Elementbibliothek; Rückfrage, bei einer Vorlage mit den Strategien und Vorlagen, die Instanzen daraus enthalten | req-ablauf-006 |
| Einstellungen | Sprache, Objektverzeichnis mit Rückfrage „Dateien verschieben?“ | req-ui-009, req-ablauf-009 |

Jeder leere Zustand nennt den nächsten sinnvollen Schritt, zum Beispiel die leere Zeichenfläche, eine Verwaltung ohne Schritte, eine Eigenschaftenansicht ohne Auswahl und eine Liste ohne Einträge (req-ui-016).

## 6. Abbildung der Testfälle

Kurzform in gespeicherter Form, die vollständigen Dokumente entstehen im Auftrag. „S.“ steht für `Strategie.`, „wahr“ und „gestellt“ für die Ausgänge. Die Namen der Testfalldokumente sind frei gewählt, zum Beispiel „EMA 20“ für die Instanz mit der Kennung `ema20`; die Kennungen unten sind die Kennungen im Ausdruck.

`str-01` Scalping Punkt 2 Ausbruch:

- Strategieparameter `signalzeiteinheit` und `handelszeiteinheit` (Zeiteinheit), `entry_puffer` und `stop_puffer` (Zahl, Pips). Instanzen `mt_signal` und `mt_handel` vom Objekttyp `Markttechnik` mit Zeiteinheit aus den Strategieparametern, Instrument der Anwendung. Regel der Strategie `risiko` aus „Risiko je Trade“ mit 1 %.
- Hauptablauf: Auslöser `Kerzenschluss` (S.handelszeiteinheit) → Bedingung `AND(mt_signal.trend_intakt; mt_signal.phase = "bewegung")` → wahr: Bedingung `mt_handel.trendrichtung = mt_signal.trendrichtung` → wahr: Bedingung `S.wartende_orders + S.offene_positionen = 0` → wahr: Berechnungen `einstieg`, `stop`, `ziel` nach Abschnitt 3 des Testfalls mit `IF(mt_signal.trendrichtung = "aufwaerts"; …; …)`, Puffer als `S.entry_puffer * Instrument.Pip` → „Order aufgeben“ `StopOrder` mit Richtung `IF(…; "buy"; "sell")`, Preis `einstieg.Ergebnis`, Stop-Loss `stop.Ergebnis`, Take-Profit `ziel.Ergebnis`, Gültigkeit „bis auf Widerruf“, Regel des Elements `mindestvolumen` (Objekttyp `Regel`, prüfend, `Order.Volumen >= Instrument.Mindestvolumen`). Das Volumen bestimmt `risiko`.
- Verwaltung an `gestellt`: Auslöser `Tick` → Bedingung `AND(Order.Status = "wartend"; IF(Order.Richtung = "buy"; Tick.Geld < mt_handel.punkt_13; Tick.Brief > mt_handel.punkt_13))` → wahr: „Order löschen“. Auslöser `Kerzenschluss` (S.handelszeiteinheit) → Bedingung `Order.Status = "wartend"` → Berechnung `stop_neu` → Bedingung `stop_neu.Ergebnis <> Order.Stop_Loss` → wahr: Berechnung `ziel_neu` → „Order ändern“ mit Stop-Loss und Take-Profit → `nicht geändert`: „Order löschen“.

`str-03` EMA-Trendfolge:

- Strategieparameter `zeiteinheit` (H1), `stop_abstand` (2). Instanzen `ema20`, `ema50` (`EMA`, Periode 20 und 50), `atr14` (`ATR`, Periode 14), Zeiteinheit jeweils S.zeiteinheit, Instrument der Anwendung. Regel der Strategie `risiko` aus „Risiko je Trade“ mit 1 %.
- Hauptablauf: Auslöser `Kerzenschluss` (S.zeiteinheit) → Bedingung Kreuzen `OR(AND(PREVIOUS(ema20.Wert) <= PREVIOUS(ema50.Wert); ema20.Wert > ema50.Wert); AND(PREVIOUS(ema20.Wert) >= PREVIOUS(ema50.Wert); ema20.Wert < ema50.Wert))`, als Baustein „EMA 20 kreuzt EMA 50 in beide Richtungen“ → wahr: Berechnung `richtung` `IF(ema20.Wert > ema50.Wert; "buy"; "sell")` → Berechnung `stop` mit `Kerze.Schluss` und `S.stop_abstand * atr14.Wert` → „Order aufgeben“ `MarketOrder` mit Richtung `richtung.Ergebnis`, Stop-Loss `stop.Ergebnis`, ohne Take-Profit, Regel des Elements `mindestvolumen` wie oben.
- Verwaltung an `gestellt`: Auslöser `Kerzenschluss` (S.zeiteinheit) → Bedingung `Order.Status = "ausgefuehrt"` → Bedingung Kreuzen gegen `Position.Richtung` → wahr: „Position schließen“ ohne Volumen; falsch: Berechnung `stop_neu` → Bedingung „verbessert“ mit `Position.Stop_Loss` und `Position.Richtung` → wahr: „Position ändern“ mit Stop-Loss `stop_neu.Ergebnis`.

Die Regel `mindestvolumen` ist Regel des Elements „Order aufgeben“, nicht der Strategie: Als Regel der Strategie würde sie auch auf die Schließorder angewendet, deren Volumen dort leer ist.

Alle Bedingungen und Berechnungen beider Testfälle lassen sich aus Bausteinen bilden, ohne einen Ausdruck als Text einzugeben; der Prototyp weist das mit seinen Browsertests nach.

## 7. Tests und Nachweis

- Bibliothek (pytest): Zerlegung und Typprüfung der Ausdrücke mit gültigen und fehlerhaften Fällen je Regel aus Abschnitt 3.4; Umwandlung zwischen gespeicherter Form und Anzeigeform in beiden Sprachen, mit Namen mit Leerzeichen und Umlauten; Bausteine in beiden Richtungen, darunter die Kreuzung in allen drei Richtungen und innerhalb von `AND` und `OR`; Kennungen beim Anlegen und Umbenennen; jeder Befund aus Abschnitt 3.6 mit Gegenprobe; Schreiben und Lesen jedes Dokumenttyps; Lesen von Format 1.0 mit den Testfalldokumenten 1.0 und der gesicherten Strategie des Auftraggebers; erzeugte Schemata gleich den Dateien unter `contracts/strategies/v2/`; Regelvorlage „Risiko je Trade“ fehlerfrei in beiden Zusammenhängen von Regeln.
- Testfalldokumente: `str-01` und `str-03` liegen unter `contracts/strategies/v2/testcases/`. Ein Test lädt sie, prüft sie gegen die Schemata, verlangt null Fehler der Konsistenzprüfung, schreibt sie und vergleicht.
- Backend (pytest): jeder Endpunkt mit Erfolgs- und Fehlerfällen, Fehlerantworten mit Kennung der Ursache; Datei je Objekt, Schreiben über temporäre Datei; nicht lesbare Datei; Datei im Format 1.0; Verschieben und Nichtverschieben, Konflikt beim Verschieben; Migration einer Datenbank eines früheren Schemas (besteht seit `wp01`); erzeugte OpenAPI-Beschreibung gleich der Datei unter `contracts/api/`.
- Oberfläche (Vitest): Aufbau aus Typbeschreibungen ohne Kenntnis einzelner Typen, Ableitung des Dokuments aus der Zeichenfläche und zurück, Anordnung, Rückfragen, Befundanzeige, Sprachwechsel, Vollständigkeit der Übersetzungen, keine deutschen Texte in der englischen Oberfläche.
- Browsertest (Playwright, Chromium, Firefox, WebKit): Jeder Testfall wird aus der leeren Zeichenfläche nur über die Bedienung aufgebaut, ohne einen Ausdruck als Text einzugeben, gespeichert, nach Neuladen der Seite geöffnet und mit dem Testfalldokument verglichen, ohne Kennungen, Namen, Lage und Zeitpunkte. Anordnung in den sechs Fenstergrößen aus 5.1 mit geöffneter „EMA-Trendfolge“ des Auftraggebers, in den beiden Smartphone-Größen auch Menü, Dialoge, Vorlagenansicht, Bausteine, Formeleditor und geführter Aufbau; `str-03` wird zusätzlich in 390 × 844 nur mit Klicks aufgebaut, ohne Ziehen. Dazu Formeleditor, geführter Aufbau, Umbenennen und Entfernen eines verbundenen Objekts, Objekt anlegen, Vorlage löschen mit Anzeige der Verwendungen, Objektverzeichnis ändern.
- Prüfskript und Testumgebungsskript der Komponente nehmen die Bibliothek auf. Das Testumgebungsskript setzt das Objektverzeichnis auf ein Verzeichnis unter `.testenv/` und legt dort die gesicherte Strategie „EMA-Trendfolge“ des Auftraggebers ab.

## 8. Sicherheit

- Ohne Anmeldung, wie bisher nur im vom Betreiber kontrollierten Netz (req-system-011, Abschnitt 9 Punkt 10 der Anforderungen). Die neuen schreibenden Endpunkte erhöhen das bekannte Risiko bei `--host` außerhalb der Loopback-Adresse (technische Dokumentation, Abschnitt 4a); die technische Dokumentation nennt sie.
- Dateizugriff: Dateinamen nur aus geprüften UUIDs und festen Arten, keine Pfadangabe von außen außer der Einstellung Objektverzeichnis, die absolut sein muss. Verschieben überschreibt keine Datei.
- Begrenzungen gegen Überlast (OWASP API4): Größe eines Dokuments höchstens 2 MiB, Länge eines Ausdrucks und Schachtelungstiefe begrenzt, Zahl der Elemente begrenzt, ebenso Länge von Namen, Zahl der Eingänge und Abschnitte und der Umfang der Antwort von `/api/v1/expressions`; Werte legen die Aufträge fest.
- Pydantic streng mit Ablehnung zusätzlicher Felder; Ausdrücke werden nur zerlegt, nie mit `eval` oder Ähnlichem ausgeführt. Texte und Namen des Anwenders setzt die Oberfläche als Text, nie als HTML.

## 9. Dokumentation

- `docs/technical/pipwerk-studio.md`: Aufbau von Backend und Oberfläche, Objektverzeichnis, Web-API mit `/api/v1/expressions` und Format 2.0, Prüfungen, Sicherheit. Der Abschnitt „Web-API ausprobieren“ mit Prüfschritten und erwarteten Ergebnissen zieht aus der Anwenderdokumentation hierher oder nach `docs/technical/pipwerk-studio-testfaelle.md` um, mit Dateien in Format 2.0.
- technische Dokumentation der Bibliothek `docs/technical/pipwerk-domain.md`: Objektmodell, Namen und Kennungen, Ausdrücke mit Anzeigeform und Bausteinen, Konsistenzprüfung, Dokumentformat 2.0 und das Lesen von 1.0, mit Verweis aus `contracts/strategies/README.md`.
- `docs/technical/pipwerk-studio-testfaelle.md` (neu, Mangel M1): Aufbau von `str-01` und `str-03` Schritt für Schritt. Browsertests und Querverweise zeigen dorthin.
- `docs/user/pipwerk-studio.md`, die vollständige Bedienung (req-system-020): Aufbau der Oberfläche mit dem Streifen der Strategieparameter und den Anordnungen in kleinen Fenstern (5.1); Elementbibliothek (5.2); Zeichenfläche mit Ablauf- und Datenverbindungen, Verwaltung, Abschnitten, Bereich für Objekte, Ausrichtung, Umschalter der Linien und Legende (5.3); Eigenschaftenansicht mit Belegungen, Regeln, Umbenennen und Entfernen (5.4); alle Arbeitsabläufe aus Abschnitt 5.5 Schritt für Schritt, auch „Als Vorlage speichern“; Bausteine und Formelansicht mit der Schreibweise von Ausdrücken (Namen, eckige Klammern, Werte einer Auswahl, Funktionen, Trennzeichen `;`, „leer“ und „nicht verfügbar“); die Befunde der Konsistenzprüfung und ihre Behebung. Keine Test- oder Abnahmeanleitungen; `docs/user/README.md` nennt diesen Grundsatz (Mangel M1).
- Glossar: neue Begriffe, zum Beispiel „Datenverbindung“, „Eingang“, „Abschnitt“, „Baustein“, „Anzeigeform“, „Kennung im Ausdruck“, „Angabe ohne Wert“, und Berichtigung der Einträge, die dieser Spezifikation widersprechen, zum Beispiel „Kennung“, „Ausdruck“ und „Bindungsart“.

## 10. Vorschläge zu offenen Punkten, Hinweise für den Auftraggeber

Die Spezifikation braucht keine Entscheidung des Auftraggebers, bevor sie umgesetzt werden kann. Festlegungen, die offene Punkte seiner Dokumente vorläufig füllen:

Bestätigt am 2026-10-16:

1. Befunde ohne Element stehen in der Eigenschaftenansicht der Strategie, Hinweise sind orange markiert (req-ui-011, dort offen).
2. Mitgelieferte Objekttypen und die Regelvorlage „Risiko je Trade“ lassen sich nicht ändern oder löschen; eine Abwandlung entsteht als neue Vorlage aus einer Instanz (E6). Grund: Sie sind Teil der Software und in jeder Installation gleich.
3. Funktionen der ersten Auswahl ergänzt um `FLOOR`, `CEILING`, `AND`, `OR`, `NOT`, `ISNA`, `IFNA`, `ISBLANK` aus der Norm (req-fach-036, Auswahl „bei Bedarf“ erweiterbar). Funktionsnamen stehen in der Norm-Schreibweise; deutsche Namen bleiben offen. In den Bausteinen erscheinen die Funktionen mit Beschriftungen in Händlersprache.
4. `Order` und `Position` in Regeln: Eine Regel, die `Order` oder `Position` anspricht, steht nur als Regel der Strategie, am Element „Order aufgeben“ oder in dessen Verwaltung (Abschnitt 3.4, 3.6; inzwischen in req-fach-051 übernommen).
5. Eine Order oder Position ohne Stop-Loss erfüllt die Regel „Risiko je Trade“ nicht (Abschnitt 3.5).
6. Trend: Mitgeliefert ist nur das Berechnungsverfahren „Ausdruck“. Die Werte der Trendrichtung legt der Ausdruck fest, weil das Fachmodell sie nicht festlegt (Abschnitt 9 Punkt 9 der Anforderungen).
7. Eigenschaften eines in einem Trend oder Indikator enthaltenen Indikators werden mehrstufig angesprochen, zum Beispiel `trend_h1.ema_20.Wert` (Abschnitt 3.3; req-fach-012 lässt offen, wie).
8. Eine Bedingung, deren Ausdruck bei der Ausführung keinen Wert ergibt, etwa weil die Markttechnik ohne Trend keinen Punkt 2 hat, nimmt den Ausgang `falsch` (Abschnitt 3.4). In `str-01` wird dann kein Trade geplant, und eine wartende Order wird beim Tick nicht gelöscht, solange Punkt 1/3 nicht belegt ist.

Aus dem Prototyp, vorläufig bis zum Test durch den Auftraggeber (Antwort in [questions/strategiedesign-01.md](questions/strategiedesign-01.md)); ein Einwand aus dem Test kommt mit `revise`:

9. Ausrichtung des Ablaufs umschaltbar „Senkrecht / Waagerecht“, senkrecht als Standard (req-ui-017, 5.3).
10. Ein Objekt ist eine Karte im Bereich „Objekte und ihre Werte“, jede Eigenschaft eine Zeile mit eigenem Anschlusspunkt. Ein Element hat einen einzigen Eingangspunkt; seine einzelnen Eingänge stehen in der Eigenschaftenansicht und in den Bausteinen unter „Verbundene Werte“ (req-ui-014, 5.3, 5.4).
11. Linien: Ablauf durchgezogen mit Pfeil, Verwaltung grün gepunktet, Wert farbig gestrichelt; mehrere Werte desselben Objekts zum selben Element sind eine Linie mit Zahl; Umschalter „Alle / Auswahl / Aus“ (req-ui-014, 5.3).
12. Umbenennen eines Objekts: Alle Verwendungen ziehen ohne Rückfrage mit (req-ui-014, 3.4, 5.4).
13. Entfernen eines verwendeten Objekts: Rückfrage mit der Liste der betroffenen Elemente; danach bleibt im Ausdruck ein leerer Platz, und die Prüfung meldet ihn mit dem Weg zur Behebung (req-ui-014, 3.6, 5.4).

Neu in dieser Fassung:

14. `ZigZag`: Ausdrücke sprechen die drei jüngsten Wendepunkte an, je mit Kurs, Art (Hoch oder Tief) und „endgültig“ (req-fach-054 lässt die Zahl offen, Abschnitt 3.2). Grund: Mehr als drei braucht keine Strategie des Vorhabens; weitere lassen sich ergänzen, ohne bestehende Strategien zu ändern.
15. Namen in Ausdrücken (req-fach-036, offen für die Spezifikation): Gespeichert wird eine Kennung, die die Anwendung beim Anlegen bildet und beim Umbenennen nicht ändert. Angezeigt und eingegeben werden die Namen, Namen mit Leerzeichen oder Sonderzeichen in eckigen Klammern, zum Beispiel `[EMA 20].Wert` (Abschnitt 3.3, 3.4).
16. Ein festes Instrument ist vorläufig ein Text mit der Bezeichnung des Instruments (req-fach-053 lässt die Bezeichnung offen, Abschnitt 3.1).
17. Ablauf ohne Auslöser: In einem Hauptablauf oder einer Verwaltung ohne eigene Auslöser meldet die Konsistenzprüfung ein Element ohne eingehende Verbindung nicht, weil dort die Auswertung beginnen kann (req-fach-015: der Aufbau darf die Auswertung ohne Auslöser nicht ausschließen). In einem Ablauf mit Auslöser bleibt es ein Fehler nach req-ablauf-007, weil kein Auslöser das Element erreicht (Abschnitt 3.6).
18. Strategien aus der ersten Fassung (Format 1.0), darunter die „EMA-Trendfolge“ des Auftraggebers, öffnen sich ohne Neubau. Namen in Programmierschreibweise, auch die bisherigen Bezeichnungen, erscheinen mit Leerzeichen und großem Anfangsbuchstaben, zum Beispiel „Order ausgefuehrt“ statt `order_ausgefuehrt` und „Stop abstand“ statt `stop_abstand`; Namen wie „EMA20“ bleiben; Umlaute setzt der Anwender beim Umbenennen selbst (Abschnitt 3.7). Der Prototyp zeigt hier von Hand gesetzte Namen.
19. `Instrument` ohne Instanz bezeichnet in einer Regel und in der Verwaltung das Instrument der Order beziehungsweise Position, im Hauptablauf wie `Kerze` und `Tick` das Instrument des Auslösers, ohne Auslöser das Instrument der Anwendung, in einem Indikator oder Trend dessen Instrument (Abschnitt 3.1; das Fachmodell regelt nur `Kerze` und `Tick` ohne Instanz, req-fach-051).

Folgen der fachlichen Festlegungen, die erst mit der Abbildung sichtbar werden; sie ergeben sich aus req-core-002, req-fach-046 und req-fach-049a, nicht aus einer Entscheidung der Spezifikation:

- Die Regel „Risiko je Trade“ prüft bei „Order ändern“ und „Position ändern“ mit dem aktuellen Kapital. Ist das Kapital gesunken, lehnt sie auch eine Änderung ab, die das Risiko verringert, solange der Stop-Loss noch auf der Verlustseite liegt.
- Legt eine Regel des Elements „Order aufgeben“ eine höhere Risikogrenze fest als die Regel der Strategie, prüft bei „Order ändern“ nur die Regel der Strategie mit der niedrigeren Grenze; die Order lässt sich dann nicht ändern.

## Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-19 | Überarbeitung nach der Abnahme von `wp02` (Mängel M1 bis M17), den neuen und geänderten Anforderungen (req-system-024; req-fach-014, req-fach-015, req-fach-036, req-fach-046, req-fach-053, req-fach-054, `indikator-markttechnik.md`; req-ui-014 bis req-ui-017, req-ablauf-003, req-ablauf-007) und dem bestätigten Prototyp: E2, E8 und E9 neu, E1 erweitert; 3.1 Gruppe, Erklärungen, Händlersprache, Datentyp Objekt, Bindungsart Datenverbindung, Parameter `Instrument`; 3.2 `ZigZag`, `Anwenden auf`, Instrument; 3.3 Namen und Kennungen, Eingänge, Abschnitte, Ausrichtung, optionale Lage, keine Verbindung vom Ausgang der Verwaltung; 3.4 Anzeigeform, Bausteine, Zeichen und sichtbare Namen; 3.6 neue Befunde zu Datenverbindungen, Eingang ohne Wert und Verbindung vom Ausgang der Verwaltung, Lesart der Zeile zu `Kerze` bei gemischten Auslösern, Abgrenzung der leeren Strategie (Hinweise N3 bis N5 aus `specification-6.md`), kein Befund für ein Element ohne eingehende Verbindung in einem Ablauf ohne Auslöser (req-fach-015 in der Fassung vom 2026-10-19, Abschnitt 10 Punkt 17); 3.7 Format 2.0 und Lesen von 1.0; 4.2 Endpunkt `/api/v1/expressions`, Fehler mit Kennung der Ursache; Abschnitt 5 neu nach dem Prototyp; 6 bis 9 angeglichen, Testanleitungen in eigenem Dokument (M1); Abschnitt 10 Punkte 9 bis 17; die bisherige Folge zu Abläufen ohne Auslöser entfällt mit Punkt 17 (Hinweis N2 aus `specification-6.md`). |
| 2026-10-19 | Hinweise aus `specification-8.md`: H1 Umwandlung von Bezeichnungen in Programmierschreibweise, Beispiel in 10 Punkt 18 (3.7); H2 Ersatzkennungen, Kennungen aus 1.0 eindeutig gegen Objekte der Anwendung und Funktionen (3.3, 3.7); H3 Strategieparameter von der Eindeutigkeit gegen Objekte der Anwendung ausgenommen (3.3); H4 `Instrument` ohne Instanz im Hauptablauf wie `Kerze`, in Indikator und Trend (3.1, 10 Punkt 19); H5 Kreuzung mit beliebigen Werten (3.4); H6 Abschnitt beim Wechsel des Ablaufs (3.3); H7 Wege ohne Ziehen (5.1, 5.4); H8 Herkunft in E4 und 3.3 an 3.7 angeglichen. |
| 2026-10-19 | Hinweise aus `specification-7.md`: N1 Bildung und Eindeutigkeit der Kennungen, Namen eindeutig auch gegen Objekte der Anwendung (3.3); N2 Element mit Objekt ohne eigenen Namen (3.3); N3 Umwandlung von 1.0, Kennung unbenannter Bedingungen, Namen (3.7, 10 Punkt 18); N5 Argumente von `PREVIOUS`, Kreuzung mit festem Wert (3.4, 3.6); N6 `Instrument` ohne Instanz (3.1, 3.5, 10 Punkt 19); N7 Instrument und Zeiteinheit eigener Indikatoren (3.3); N8 Datentypen der Markttechnik (3.2); N9 unzulässige Verbindungen (3.3, 3.6, 5.3); N11 Herkunft mitgelieferter Vorlagen (3.7); N12 Objekte der Anwendung in der Anzeigeform (3.4); N13 Entfernen (3.4, 5.4); N14 Instanzen im Bereich für Objekte (3.3, 5.3); N15 Begründung der Abschnitte (3.3); N16 Prüfung in den Smartphone-Größen (5.1, 7); N17 Klick auf die Befundzahl wie im Prototyp (5.1); N18 Anwenderdokumentation (9); N19 Alembic besteht (4.1, 7, 9); N20 Händlersprache für alle Texte (5.1); N21 Bindungsarten der Eigenschaften und begründete Ausnahmen (3.1); N22 „Angabe ohne Wert“ statt „Eingang ohne Wert“ (3.3, 3.6). |
| 2026-10-18 | Phase 4 `wp02`: Auslöser optional (Abschnitte 1, 3.3, 3.6, 5.2, 5.3, 10), Prüfung in `specification-5.md` und `specification-6.md`. |
| 2026-10-17 | Phase 4 `wp02`: Felder der Typbeschreibung in 3.1, Prüfung in `specification-4.md`, am 2026-10-18 bestätigt ohne „Vorgabe der neuen Strategie“. |
| 2026-10-16 | Abstimmung mit dem Auftraggeber, Festlegungen 1 bis 8; Einwand zu Festlegung 4 eingearbeitet, Nachprüfung in `specification-3.md`. |
| 2026-10-16 | Erste Fassung, Durchläufe 1 und 2 (`specification-1.md`, `specification-2.md`). |
