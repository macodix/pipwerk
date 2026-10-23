# Gemeinsame Python-Bibliothek `pipwerk_domain` – technische Dokumentation

## Dokumentstatus

- status: `draft`
- stand: 2026-10-21
- komponente: `packages/domain-core` (Paket `pipwerk_domain`, Version `0.1.0`)
- grundlage: Vorhaben `strategiedesign`, Spezifikation (Fassung vom 2026-10-20, Durchlauf 11) Abschnitte 1 bis 3, 6 bis 10, Arbeitspaket `wp02`, Auftrag 04

## 1. Gegenstand

Die Bibliothek `pipwerk_domain` ist die gemeinsame Python-Bibliothek von pipwerk (E1 der Spezifikation). Sie enthält

- die Typbeschreibungen aller Element- und Objekttypen mit Gruppe, Erklärungen und Händlersprache und das Elementregister,
- das Objektmodell (Strategie, Element, Instanz, Verbindung, Abschnitt, Verwaltung, Vorlage),
- die Namen und Kennungen und die Namensräume, in denen Ausdrücke Namen auflösen,
- die Ausdrücke: Zerlegung, Typprüfung, Funktionen, Normalisierung, gespeicherte Form und Anzeigeform, Bausteine, Zeichen und sichtbare Namen,
- die Konsistenzprüfung mit allen Befunden,
- das Lesen und Schreiben der Dokumente im Format 2.0 mit den JSON-Schemata und das Lesen des Formats 1.0.

Die Bibliothek wertet Ausdrücke nicht aus und führt keine Strategie aus. Sie hängt von keinem Framework ab. Pydantic wird nur im Teilpaket `pipwerk_domain.documents` verwendet; das Objektmodell besteht aus einfachen Python-Klassen (`dataclass`) ohne Pydantic. Texte für Befunde erzeugt die Bibliothek nicht (req-ui-007): Sie liefert Kennungen und Angaben, die Oberfläche schreibt die Texte. Eine Ausnahme sind die Anzeigeform und der Satz zu einem Ausdruck (Abschnitt 7.6 und 7.7): Sie sind Darstellungen des Ausdrucks, keine Texte zu Befunden.

## 2. Aufbau des Pakets

Das Paket liegt in `packages/domain-core/`. Quelltext unter `src/pipwerk_domain/`, Tests unter `tests/`. Die Datei `src/pipwerk_domain/py.typed` kennzeichnet das Paket als typisiert, damit mypy die Typen in den Paketen nutzt, die die Bibliothek einbinden (pipwerk Studio bindet sie als editierbare Pfadabhängigkeit ein, siehe `docs/technical/pipwerk-studio.md`, Abschnitt 2.9).

| Datei oder Teilpaket | Inhalt |
| --- | --- |
| `typedesc.py` | Typbeschreibung (`TypeDescription`) mit Parametern, Eigenschaften, Ausgängen, Gruppe und Erklärung; Datentypen, Bindungsarten, Gruppen, Zeiteinheiten |
| `identifiers.py` | Bildungsregel für Kennungen (`identifier_from_name`), Kennung im Ausdruck (`form_key`), Name aus Programmierschreibweise (`name_from_programming_name`) |
| `instruments.py` | Bezeichnung eines festen Instruments: Währungspaar nach ISO 4217, ISIN nach ISO 6166 |
| `registry.py` | Elementregister (`ElementRegistry`), Einstiegspunkt `pipwerk.element_types` |
| `catalog.py` | mitgelieferte Typen mit Namen, Beschriftungen und Erklärungen in Deutsch und Englisch |
| `defaults.py` | `create_registry()` und `default_registry()`: Register mit den mitgelieferten Typen und den Typen der Einstiegspunkte; `builtin_templates()`: die mitgelieferten Vorlagen |
| `model.py` | Objektmodell: `Strategy`, `Element`, `Connection`, `Section`, `Management`, `Instance`, `Template`, `Binding`, `Origin` und weitere |
| `operations.py` | Vorgänge, die die Bibliothek besitzt: Kennung zu einem Namen (`new_key`), Entfernen von Strategieparameter, Element und Regel samt Verwendungen |
| `pointers.py` | JSON Pointer nach RFC 6901 |
| `risk_rule.py` | Regelvorlage „Risiko je Trade“ mit fester UUID |
| `normalize.py` | Normalisierung aller Ausdrücke einer Strategie oder Vorlage (`normalize_strategy`, `normalize_template`) |
| `limits.py` | Begrenzungen gegen Überlast als Konstanten |
| `namespaces.py` | Namensräume: Objekte der Anwendung, Symbole von Parametern, Eigenschaften und Instanzen |
| `expressions/` | Ausdrücke: `lexer.py`, `parser.py`, `nodes.py` (Syntaxbaum), `functions.py` (Funktionsliste), `exprtypes.py` (Typen und Verträglichkeit), `symbols.py` (Symbole und Namensräume), `checker.py` (Typprüfung, erkannte Namen, Normalisierung), `forms.py` (gespeicherte Form und Anzeigeform), `blocks.py` (Bausteine), `sentence.py` (Satz), `tokens.py` (Zeichen mit Art und Stelle), `names.py` (sichtbare Namen), `slots.py` (leerer Platz) |
| `consistency/` | Konsistenzprüfung: `engine.py` (Prüfung), `findings.py` (Befunde und ihre Kennungen, erkannte Namen und Ergebnis einer Prüfung mit Namen), `graph.py` (Rückführungen, Erreichbarkeit) |
| `documents/` | Dokumente: `models.py` (Pydantic-Modelle des Formats 2.0), `v1.py` (Pydantic-Modelle des Formats 1.0, nur zum Lesen), `upgrade.py` (Umwandlung von 1.0 nach 2.0), `convert.py` (Übersetzung zwischen Dokument und Objektmodell), `io.py` (Lesen und Schreiben als JSON-Text), `schemas.py` (JSON-Schemata) |

Wichtige Einstiege:

| Aufgabe | Aufruf |
| --- | --- |
| Register mit allen Typen | `pipwerk_domain.defaults.default_registry()` |
| Typbeschreibung abfragen | `registry.get("EMA")`, `registry.list()`, `registry.list(ElementKind.TRIGGER)` |
| Funktionen abfragen | `pipwerk_domain.expressions.list_functions()` |
| Ausdruck prüfen | `pipwerk_domain.expressions.analyze(text, umgebung, erwartet)` |
| Ausdruck normalisieren | `pipwerk_domain.expressions.normalize_expression(text, umgebung)` |
| gespeicherte Form und Anzeigeform | `pipwerk_domain.expressions.render(text, umgebung, sprache, display_input=…)` |
| Bausteine zu einem Ausdruck und Ausdruck zu Bausteinen | `to_blocks(analyse)`, `blocks_to_text(baum)` |
| Zeichen mit Art und Stelle | `pipwerk_domain.expressions.characters(text)` |
| sichtbare Namen an einer Stelle | `pipwerk_domain.expressions.visible_names(namensraum, sprache)` |
| alle Ausdrücke einer Strategie oder Vorlage normalisieren | `pipwerk_domain.normalize.normalize_strategy(strategy)`, `normalize_template(template)` (liefern eine Kopie) |
| Strategie oder Vorlage prüfen | `pipwerk_domain.consistency.check_strategy(strategy)`, `check_template(template)` |
| prüfen und die erkannten Namen jedes Ausdrucks erhalten | `pipwerk_domain.consistency.check_strategy_with_names(strategy)`, `check_template_with_names(template)` (Abschnitt 9.3) |
| prüfen und den Zusammenhang jeder Stelle eines Ausdrucks behalten | `pipwerk_domain.consistency.check_with_contexts(wert)` (Abschnitt 9.4) |
| Kennung zu einem Namen | `pipwerk_domain.operations.new_key(dokument, zeiger, name)` (Abschnitt 6.1) |
| Strategieparameter, Element oder Regel entfernen | `remove_strategy_parameter`, `remove_element`, `remove_rule` in `pipwerk_domain.operations` (Abschnitt 7.9) |
| mitgelieferte Vorlagen | `pipwerk_domain.defaults.builtin_templates()` (Abschnitt 5.1) |
| Dokument lesen | `pipwerk_domain.documents.read_document(text)` (liefert `Strategy` oder `Template`, liest 2.0 und 1.0) |
| Dokument schreiben | `pipwerk_domain.documents.write_document(objekt)` (schreibt 2.0) |
| Dokument nur auf das Format prüfen | `pipwerk_domain.documents.parse_document(text_oder_dict)` (liefert das Dokument in 2.0) |
| Größe eines Dokuments | `pipwerk_domain.limits.MAX_DOCUMENT_BYTES` (prüft das Backend vor dem Lesen) |

Ein Dokument, das dem Format nicht entspricht, löst `DocumentError` aus (das ist die `ValidationError` von Pydantic). Das Backend übersetzt sie in HTTP 422.

## 3. Typbeschreibungen und Elementregister

### 3.1 Typbeschreibung

Jeder Elementtyp und jeder Objekttyp liefert eine `TypeDescription`. Die Oberfläche baut Elementbibliothek, Elemente und Eigenschaftenansicht nur daraus auf (E2). Alle Klassen sind unveränderlich (`frozen`) und enthalten nur Zeichenketten, Zahlen, Wahrheitswerte, Aufzählungen und Tupel; sie lassen sich mit `dataclasses.asdict` in JSON umsetzen (die Aufzählungen sind Zeichenketten).

| Feld | Inhalt |
| --- | --- |
| `id` | Kennung, sprachneutral |
| `kind` | Art: `trigger` (Auslöser), `flow` (Element des Ablaufs), `object_type` (Objekttyp), `application_object` (Objekt der Anwendung), `order_type` (Ordertyp), `trend_method` (Berechnungsverfahren des Trends) |
| `category` | bei der Art `object_type`: `indicator`, `trend`, `rule` oder `ruleset`; sonst leer |
| `name`, `description`, `explanation` | Name, Beschreibung und Erklärung, je `Label(de, en)`. Name und Erklärung sind in Händlersprache (Spezifikation 3.1, M8); die Erklärung ist der kurze Text, den die Oberfläche beim Zeigen anzeigt |
| `group` | Gruppe der Elementbibliothek (Spezifikation 5.2): `when`, `actions`, `market`, `indicators`, `trends`, `rules`; bei einem Typ, der dort nicht steht, `null` |
| `parameters` | Parameter: `id`, `datatype`, `label`, `explanation`, `required` (Pflicht), `default` (Standardwert), `choices` (zulässige Werte einer Auswahl, je `id` und `label`), `bindings` (erlaubte Bindungsarten), `applies_when` (gilt nur bei einem Wert eines anderen Parameters: `Condition(name, value)`), `object_type` |
| `properties` | Eigenschaften: `id`, `datatype`, `label`, `explanation`, `must` (MUSS, sonst KANN), `set_by_user` (bei Ordertypen: ob der Anwender sie belegt), `default`, `choices`, `applies_when`, `object_type` |
| `outputs` | Ausgänge eines Elements des Ablaufs: `id`, `label`, `explanation` und `holds_management` (ob an diesem Ausgang die Verwaltung des Elements hängt) |
| `rules_allowed` | ob dem Element Regeln und Regelwerke zugeordnet werden können |
| `on_canvas` | ob der Typ als Element auf die Zeichenfläche gelegt werden kann |
| `builtin` | mitgeliefert; mitgelieferte Typen und die Regelvorlage „Risiko je Trade“ lassen sich nicht ändern oder löschen (E6) |
| `by_user` | ob der Anwender den Typ wählen kann; `CloseOrder` entsteht nur über „Position schließen“ und ist deshalb nicht wählbar |
| `named` | ob ein Element des Ablaufs einen Namen trägt, unter dem Ausdrücke sein Ergebnis ansprechen (`flow.condition`, `flow.calculation`) |
| `strategy_parameters` | bei Objekten der Anwendung: ob Ausdrücke über dieses Objekt die Strategieparameter ansprechen (`Strategie`) |

Die Felder `group`, `explanation`, `holds_management`, `named` und `strategy_parameters` sind Daten der Typbeschreibung mit dem Standardwert „nicht gesetzt“ (`null`, leerer Text beziehungsweise `False`); ein über den Einstiegspunkt angemeldeter Typ ohne diese Felder gilt unverändert. Gesetzt sind sie bei den mitgelieferten Typen so: `holds_management` nur beim Ausgang `gestellt` von `flow.place_order`, `named` bei `flow.condition` und `flow.calculation`, `strategy_parameters` beim Objekt `Strategie`. Jeder mitgelieferte Typ, Parameter, jede Eigenschaft und jeder Ausgang hat eine Erklärung in Deutsch und Englisch; weder Namen noch Beschriftungen noch Erklärungen enthalten eine Kennung in Programmierschreibweise (ein Test prüft das). Die Oberfläche braucht die Felder, weil sie keine einzelnen Typen kennt. Ein Feld „Vorgabe der neuen Strategie“ gibt es nicht.

Höchstens ein Ausgang eines Typs hat `holds_management`. `TypeDescription.management_output()` liefert ihn oder `None`. Eine Typbeschreibung mit mehr als einem solchen Ausgang ist ungültig: `ElementRegistry.register` wirft `RegistryError`, ein Einstiegspunkt mit einer solchen Beschreibung meldet nichts an und wird wie jeder fehlerhafte Einstiegspunkt protokolliert (Abschnitt 3.3).

Datentypen (`DataType`): `number` (Zahl), `integer` (Ganzzahl), `percent` (Prozent; im Ausdruck ein Anteil, 1 % ist 0,01, ein fester Wert wird als `0.01` gespeichert), `boolean` (Wahrheitswert), `text`, `choice` (Auswahl mit festen Werten und Kennungen), `time_unit` (Zeiteinheit), `timestamp` (Zeitpunkt, ISO 8601), `date` (Datum, ISO 8601), `expression` (Ausdruck) und `object`.

Der Datentyp `object` hat im Feld `object_type` den Objekttyp. Er gilt für Eigenschaften, deren Wert ein Objekt der Anwendung ist (`Order.konto`, `Order.instrument`, `Position.instrument`, `CloseOrder.position`), und für den Parameter `instrument` (Abschnitt 3.2); in Ausdrücken lassen sich ihre Eigenschaften weiter ansprechen (`Order.konto.kapital`). Spezifikation 3.1 nennt ihn „Objekt mit Angabe des Objekttyps“.

Zeiteinheiten (`time_unit`): alle Zeiteinheiten von MetaTrader 5, mit Kennungen nach der Bildungsregel aus ihrem Namen: `m1`, `m2`, `m3`, `m4`, `m5`, `m6`, `m10`, `m12`, `m15`, `m20`, `m30`, `h1`, `h2`, `h3`, `h4`, `h6`, `h8`, `h12`, `d1`, `w1`, `mn1`. Beschriftungen sind `M1` bis `MN1`. Parameter und Eigenschaften vom Datentyp `time_unit` nennen in `choices` alle diese Zeiteinheiten mit Kennung und Beschriftung (`typedesc.TIME_UNITS`). Das Register setzt sie bei der Abfrage ein, wenn die Beschreibung keine eigenen Werte nennt; das gilt auch für Typen, die über den Einstiegspunkt angemeldet sind.

Bindungsarten (`BindingKind`): `fixed` (fester Wert), `parameter` (Strategieparameter oder, innerhalb einer Vorlage, Parameter der Vorlage), `connection` (Datenverbindung: eine Eigenschaft einer Instanz auf der Zeichenfläche), `expression` (Ausdruck), `application` (bei der Anwendung übergeben). Erlaubt sind alle Bindungsarten, mit den Ausnahmen der Tabelle in Spezifikation 3.1: Parameter vom Datentyp `expression` (der Ausdruck einer Bedingung, Berechnung oder von „Strategieparameter ändern“) lassen nur `expression` zu; der Ordertyp von „Order aufgeben“, der Strategieparameter von „Strategieparameter ändern“ und das Berechnungsverfahren des Trends nur `fixed`.

### 3.2 Parameter `instrument` und feste Instrumente

Den Parameter `instrument` (Datentyp `object`, `object_type` `Instrument`) haben die Auslöser `trigger.candle_close` und `trigger.tick`, die Objekte `Instrument`, `Kerze` und `Tick`, jeder Indikator (`Indikator`, `EMA`, `ATR`, `ZigZag`, `Markttechnik`), `Trend` und, als Eigenschaft `instrument`, jeder Ordertyp außer `CloseOrder`. Der festgelegte Wert „Instrument der Anwendung“ hat die Kennung `instrument_der_anwendung` (`typedesc.APPLICATION_INSTRUMENT`); er ist der einzige Eintrag in `choices` und der Standardwert.

Belegt werden kann der Parameter mit dem festgelegten Wert, mit einem festen Instrument, mit einem Strategieparameter vom Datentyp `object` und Objekttyp `Instrument`, mit einer Datenverbindung oder mit einem Ausdruck. Ein festes Instrument ist `fixed` mit der Bezeichnung als Text (`instruments.py`):

- ein Währungspaar: zwei Codes nach ISO 4217 hintereinander (`EURUSD`); die Liste der Codes bringt die Bibliothek mit (`CURRENCY_CODES`), jeder Code der Liste ist gültig, auch zweimal derselbe,
- eine ISIN nach ISO 6166: zwölf Zeichen, zwei Buchstaben, neun Buchstaben oder Ziffern, eine Prüfziffer (Luhn-Verfahren über die in Zahlen umgesetzten Zeichen); die ersten beiden Buchstaben werden nicht gegen eine Liste von Ländern geprüft, weil die Norm dort auch andere Codes zulässt (`XS`).

Gespeichert wird die Bezeichnung in Großbuchstaben (`normalize_designation`); die Prüfung (`is_valid_designation`) nimmt auch Kleinbuchstaben an. Jede andere Bezeichnung ist der Befund `instrument.invalid`, an jeder Stelle, an der ein festes Instrument steht: Belegung von Parameter und Eigenschaft, Wert eines Strategieparameters vom Datentyp `object` und ein fester Text, den ein Ausdruck an Stelle eines Instruments verwendet.

`Instrument`, `Kerze` und `Tick` ohne Instanz haben das Instrument des Zusammenhangs (Spezifikation 3.1); die Prüfung meldet dafür keinen Befund.

### 3.3 Elementregister

`ElementRegistry` führt alle Typbeschreibungen: `register(beschreibung)` meldet einen Typ an (eine Kennung nur einmal und höchstens ein Ausgang mit `holds_management`, sonst `RegistryError`), `get(kennung)` fragt nach der Kennung, `list(art=None)` liefert die Typen in der Reihenfolge der Anmeldung, optional einer Art.

Bei jeder Abfrage setzt das Register in jeder Beschreibung die Zeiteinheiten als `choices` der Parameter und Eigenschaften vom Datentyp `time_unit` ein (Abschnitt 3.1). Zwei Beschreibungen vervollständigt es außerdem aus anderen Anmeldungen:

- `Trend`: Der Parameter `berechnungsverfahren` hat als Werte die Kennungen aller angemeldeten Typen der Art `trend_method`. Deren Parameter erscheinen zusätzlich beim `Trend`, mit `applies_when` auf den Wert von `berechnungsverfahren` (req-param-005). Mitgeliefert ist `trend_method.expression` (Verfahren „Ausdruck“) ohne eigene Parameter.
- `flow.place_order`: Der Parameter `ordertyp` hat als Werte die Kennungen aller angemeldeten Ordertypen mit `by_user`.

#### Einstiegspunkt `pipwerk.element_types`

Weitere Pakete melden Typen über den Einstiegspunkt `pipwerk.element_types` an (E7). Der Einstiegspunkt verweist auf

- eine `TypeDescription`, oder
- eine Folge von Typbeschreibungen, oder
- eine Funktion, die ein Objekt mit der Methode `register(beschreibung)` erhält und dort anmeldet.

`ElementRegistry.load_entry_points()` lädt alle Einstiegspunkte der Gruppe, `create_registry()` ruft sie auf. Ein fehlerhafter Einstiegspunkt (Ladefehler, Ausnahme beim Anmelden, `SystemExit` beim Laden, falscher Rückgabetyp, doppelte Kennung, Typbeschreibung mit mehr als einem Ausgang mit der Verwaltung) verhindert das Laden der übrigen nicht. Die Einstiegspunkte werden für jedes installierte Paket einzeln gelesen (`importlib.metadata.distributions()`, je Paket in einem eigenen Schutz). Fehlerhafte Metadaten eines Pakets (zum Beispiel eine Zeile ohne `=` in `entry_points.txt`, auch in einer anderen Gruppe, oder unlesbare Metadaten) schließen nur dieses Paket aus; die gültigen Einstiegspunkte aller anderen Pakete werden geladen, und die mitgelieferten Typen sind immer vorhanden. Das ausgeschlossene Paket erscheint in einer Warnung nur mit seinem Namen und der Klasse der Ausnahme. Ein fehlerhafter Einstiegspunkt meldet nichts an – auch nichts von dem, was er vor dem Fehler angemeldet hätte – und wird mit dem Namen des Einstiegspunkts und der Klasse der Ausnahme protokolliert (Logger `pipwerk_domain.registry`, Stufe `WARNING`), ohne Ausnahmetext, ohne Rückverfolgung und ohne Pfad. Der Rückgabewert `LoadReport` nennt die geladenen und die fehlgeschlagenen Einstiegspunkte. Zum Testen lässt sich eine Liste nachgebildeter Einstiegspunkte (Objekte mit `name` und `load()`) übergeben.

## 4. Mitgelieferte Typen und Kennungen

Die mitgelieferten Typen stehen nur in der Bibliothek (`catalog.py`), nicht im Backend und nicht in der Oberfläche (E2, E6). Jeder Typ, jeder Parameter, jede Eigenschaft, jeder Ausgang und jeder Wert einer Auswahl hat Beschriftungen in Deutsch und Englisch, Typen, Parameter, Eigenschaften und Ausgänge dazu eine Erklärung. Die folgende Liste nennt alle Kennungen; ein Test vergleicht sie mit dem Code.

### 4.1 Auslöser und Elemente des Ablaufs

Alle Parameter lassen die fünf Bindungsarten zu, außer wo „nur …“ steht. Gruppe der Auslöser ist `when`, der Elemente des Ablaufs `actions`.

| Kennung | Name (de) | Parameter | Eigenschaften | Ausgänge | Regeln |
| --- | --- | --- | --- | --- | --- |
| `trigger.candle_close` | Kerzenschluss | `instrument` (Standard `instrument_der_anwendung`), `zeiteinheit` (Zeiteinheit, Pflicht) | – | `weiter` | nein |
| `trigger.tick` | Tick | `instrument` | – | `weiter` | nein |
| `trigger.manual_start` | Start von Hand | – | – | `weiter` | nein |
| `flow.condition` | Bedingung | `ausdruck` (Ausdruck, Pflicht, nur `expression`) | `ergebnis` (Wahrheitswert) | `wahr`, `falsch` | nein |
| `flow.calculation` | Berechnung | `ausdruck` (Ausdruck, Pflicht, nur `expression`) | `ergebnis` (Datentyp `expression`: ergibt sich aus dem Ausdruck) | `weiter` | nein |
| `flow.set_parameter` | Strategieparameter ändern | `strategieparameter` (Text, Pflicht, nur `fixed`), `ausdruck` (Ausdruck, Pflicht, nur `expression`) | – | `weiter` | nein |
| `flow.place_order` | Order aufgeben | `ordertyp` (Auswahl, Pflicht, nur `fixed`; Werte `MarketOrder`, `StopOrder`, `LimitOrder`, `StopLimitOrder`) | die Eigenschaften des gewählten Ordertyps | `gestellt`, `nicht_gestellt` | ja |
| `flow.modify_order` | Order ändern | `preis`, `limitpreis`, `stop_loss`, `take_profit` (Zahl), `gueltigkeit` (Auswahl), `ablaufzeit` (Zeitpunkt, gilt bei `gueltigkeit` = `bis_zeitpunkt`), `datum` (Datum, gilt bei `gueltigkeit` = `bis_ende_eines_tages`); alle optional, ohne Wert bleibt die Angabe unverändert | – | `geaendert`, `nicht_geaendert` | ja |
| `flow.delete_order` | Order löschen | – | – | `weiter` | nein |
| `flow.modify_position` | Position ändern | `stop_loss`, `take_profit` (Zahl, optional) | – | `geaendert`, `nicht_geaendert` | ja |
| `flow.close_position` | Position schließen | `volumen` (Zahl, optional; ohne Wert wird ganz geschlossen) | – | `weiter` | ja |

Auf die Zeichenfläche lassen sich alle diese Typen legen (`on_canvas`). `flow.modify_order`, `flow.delete_order`, `flow.modify_position` und `flow.close_position` stehen nur in einer Verwaltung (Abschnitt 8). `trigger.manual_start` hat keine Parameter und ist ein Auslöser wie die übrigen (jede Auswertung beginnt an einem Auslöser).

Bedingung und Berechnung tragen zusätzlich einen Namen (Feld `name` des Elements) und eine Kennung im Ausdruck (Feld `key`), unter der Ausdrücke ihr Ergebnis ansprechen (`einstieg.ergebnis`). Die Kennung bildet die Bibliothek beim Anlegen (Abschnitt 6.1).

### 4.2 Ordertypen

Die Eigenschaften der Order kommen aus den Ordertypen. `Order` in einer Regel kennt die Eigenschaften aller Ordertypen, in der Verwaltung nur die des Ordertyps der zugehörigen „Order aufgeben“ (Abschnitt 6).

| Eigenschaft | Datentyp | MUSS | belegt der Anwender | Ordertypen |
| --- | --- | --- | --- | --- |
| `order_id` | Text | ja | nein | alle |
| `status` | Auswahl: `wartend`, `teilausgefuehrt`, `ausgefuehrt`, `geloescht`, `abgelaufen`, `abgelehnt` | ja | nein | alle |
| `konto` | Objekt `Konto` | ja | nein | alle |
| `strategie_id` | Text | nein | nein | alle |
| `bemerkung` | Text | nein | ja | alle |
| `instrument` | Objekt `Instrument`, Standardwert `instrument_der_anwendung` | ja | ja | `MarketOrder`, `StopOrder`, `LimitOrder`, `StopLimitOrder` |
| `richtung` | Auswahl: `buy`, `sell` | ja | ja | `MarketOrder`, `StopOrder`, `LimitOrder`, `StopLimitOrder` |
| `volumen` | Zahl | ja (bei `CloseOrder` nein) | ja | alle |
| `preis` | Zahl | ja | bei `MarketOrder` und `CloseOrder` nein (die Anwendung setzt den angenommenen Preis und später den Ausführungspreis), sonst ja | alle |
| `stop_loss` | Zahl | nein | ja | `MarketOrder`, `StopOrder`, `LimitOrder`, `StopLimitOrder` |
| `take_profit` | Zahl | nein | ja | `MarketOrder`, `StopOrder`, `LimitOrder`, `StopLimitOrder` |
| `gueltigkeit` | Auswahl: `bis_auf_widerruf` (Standardwert), `bis_tagesende`, `bis_zeitpunkt`, `bis_ende_eines_tages` | ja | ja | `StopOrder`, `LimitOrder`, `StopLimitOrder` |
| `ablaufzeit` | Zeitpunkt | ja, gilt nur bei `gueltigkeit` = `bis_zeitpunkt` | ja | `StopOrder`, `LimitOrder`, `StopLimitOrder` |
| `datum` | Datum | ja, gilt nur bei `gueltigkeit` = `bis_ende_eines_tages` | ja | `StopOrder`, `LimitOrder`, `StopLimitOrder` |
| `limitpreis` | Zahl | ja | ja | `StopLimitOrder` |
| `position` | Objekt `Position` | ja | nein (entsteht über „Position schließen“) | `CloseOrder` |

Der Befund „MUSS-Eigenschaft … ohne Belegung“ (Abschnitt 9) gilt nur für Eigenschaften, die der Anwender belegt (Hinweis S16). Ordertypen: `MarketOrder` (Marktorder), `StopOrder` (Stop-Order), `LimitOrder` (Limit-Order), `StopLimitOrder` (Stop-Limit-Order) und `CloseOrder` (Schließorder, nicht wählbar).

### 4.3 Objekte der Anwendung

Gruppe `market` haben `Konto`, `Instrument`, `Kerze` und `Tick`; `Order`, `Position` und `Strategie` stehen nicht in der Elementbibliothek.

| Kennung | Parameter | Eigenschaften (Kennungen) | auf der Zeichenfläche |
| --- | --- | --- | --- |
| `Konto` | – | `kapital`, `freie_margin`, `waehrung` | ja |
| `Instrument` | `instrument` | `bezeichnung`, `tickgroesse`, `tickwert`, `punkt`, `pip`, `spread`, `mindestvolumen`, `volumenschritt` | ja |
| `Kerze` | `instrument`, `zeiteinheit` (Zeiteinheit, Pflicht) | `eroeffnung`, `hoch`, `tief`, `schluss`, `volumen`, `zeitpunkt` | ja |
| `Tick` | `instrument` | `geld`, `brief`, `zeitpunkt` | ja |
| `Order` | – | `order_id`, `status`, `konto`, `strategie_id`, `bemerkung`, `preis` und die Eigenschaften der Ordertypen | nein |
| `Position` | – | `instrument`, `richtung` (`buy`, `sell`), `volumen`, `einstiegspreis`, `stop_loss`, `take_profit`, `offener_gewinn_oder_verlust` | nein |
| `Strategie` | – | `strategie_id`, `name`, `beschreibung`, `wartende_orders`, `offene_positionen` (Ganzzahl) und die Strategieparameter der Strategie | nein |

### 4.4 Indikatoren und allgemeine Objekttypen

Alle Indikatoren, `Trend` und die Objekte oben haben den Parameter `instrument` (Abschnitt 3.2). Die Gruppe ist `indicators`, bei `Markttechnik` und `Trend` `trends`, bei `Regel` und `Regelwerk` `rules`.

| Kennung | Name (de) | Kategorie | Parameter (Standardwert) | Eigenschaften |
| --- | --- | --- | --- | --- |
| `EMA` | EMA | `indicator` | `instrument`, `zeiteinheit` (Pflicht), `periode` (Ganzzahl, Pflicht), `verschiebung` (Ganzzahl, 0), `anwenden_auf` (Auswahl, `schlusskurs`; Werte `schlusskurs`, `eroeffnungskurs`, `hoch`, `tief`, `medianpreis`, `typischer_preis`, `gewichteter_schlusskurs`) | `wert` |
| `ATR` | ATR | `indicator` | `instrument`, `zeiteinheit` (Pflicht), `periode` (Ganzzahl, Pflicht) | `wert` |
| `ZigZag` | ZigZag | `indicator` | `instrument`, `zeiteinheit` (Pflicht), `depth` (12), `deviation` (5), `backstep` (3) | die drei jüngsten Wendepunkte, `wendepunkt_1` ist der jüngste: `wendepunkt_1_kurs`, `wendepunkt_2_kurs`, `wendepunkt_3_kurs` (Zahl), `wendepunkt_1_art`, `wendepunkt_2_art`, `wendepunkt_3_art` (Auswahl `hoch`, `tief`), `wendepunkt_1_endgueltig`, `wendepunkt_2_endgueltig`, `wendepunkt_3_endgueltig` (Wahrheitswert); alle KANN (fehlt ein Wendepunkt, sind sie „leer“) |
| `Markttechnik` | 1-2-3-Trend (Markttechnik) | `indicator` | `instrument`, `zeiteinheit` (Pflicht), `depth` (12), `deviation` (5), `backstep` (3) | `trendrichtung` (Auswahl: `aufwaerts`, `abwaerts`, `kein_trend`), `trend_intakt` (Wahrheitswert), `phase` (Auswahl: `bewegung`, `korrektur`; KANN), `punkt_2` (Zahl; KANN), `punkt_13` (Zahl; KANN), `punkt_13_endgueltig` (Wahrheitswert; KANN) |
| `Indikator` | eigener Indikator | `indicator` | `instrument`, `zeiteinheit` (Pflicht) und eigene Parameter der Vorlage | eigene Eigenschaften der Vorlage |
| `Trend` | eigener Trend | `trend` | `instrument`, `zeiteinheit` (Pflicht), `berechnungsverfahren` (Auswahl, Standardwert `trend_method.expression`, nur `fixed`) | `richtung` (Text) und eigene Eigenschaften |
| `Regel` | eigene Regel | `rule` | eigene Parameter der Vorlage | – |
| `Regelwerk` | eigenes Regelwerk | `ruleset` | – | – |

Berechnungsverfahren des Trends: `trend_method.expression` (Ausdruck). Die Eigenschaften der Indikatoren beschreiben nur Parameter und Eigenschaften, ohne Berechnung (Spezifikation Abschnitt 1). Die Regelvorlage „Risiko je Trade“ hat die Namen „Risiko je Trade“ und „Risk per trade“ (Abschnitt 5.1).

## 5. Objektmodell

Das Objektmodell besteht aus `dataclass`-Klassen in `model.py` und kennt weder Pydantic noch ein anderes Framework. Alle Klassen lassen sich vergleichen (`==`); der Vergleich ist die Grundlage der Aussage „Schreiben und erneutes Lesen ergeben dasselbe Objekt“.

| Klasse | Inhalt |
| --- | --- |
| `Strategy` | `id` (UUID als Text), `name`, `description`, `parameters` (`StrategyParameter`), `rules` (Regeln und Regelwerke der Strategie als Instanzen in festgelegter Reihenfolge), `elements`, `connections`, `sections`, `orientation`, `collapsed_managements`; Methoden `element(id)`, `main_elements()`, `management(id)`, `managements()` |
| `StrategyParameter` | `key` (Kennung im Ausdruck), `name`, `datatype`, bei `object` `object_type`, `value` oder `at_application` (bei der Anwendung), `choices` |
| `Element` | `id`, `type` (Elementtyp als Text), `name` (nur bei einem Element ohne Instanz), `key` (nur Bedingung und Berechnung), `position` (`Position` mit `x` und `y` oder `None`: nur gesetzt, wenn der Anwender das Element verschoben hat), `parameters` und `properties` (je Kennung ein `Binding`), `inputs` (`ElementInput`: Kennung der Instanz und der Eigenschaft), `rules` (zugeordnete Regeln und Regelwerke), `management_of` (Kennung des Elements „Order aufgeben“, zu dessen Verwaltung es gehört, leer im Hauptablauf), `instance` (die Instanz bei einem Element, das ein Objekt zeigt); `shown_name` ist der Name, den der Anwender sieht (bei einem Objekt der Name der Instanz) |
| `Connection` | `id` (UUID), `source` (Element), `output` (Ausgang), `target` (Element); eine Verbindung darf zurückführen |
| `Section` | Abschnitt: `id`, `name`, `flow` (Kennung des Elements „Order aufgeben“, zu dessen Verwaltung er gehört, `None` im Hauptablauf), `elements` (Kennungen), `collapsed` |
| `Management` | die Verwaltung einer Order: `order_element` und `elements`. Sie ist kein gespeichertes Feld, sondern ergibt sich aus `Element.management_of`; sie hängt am Ausgang `gestellt` von „Order aufgeben“ und kann wieder ein „Order aufgeben“ mit eigener Verwaltung enthalten |
| `Binding` | Belegung mit Bindungsart: `kind` und `value` (bei `fixed` der Wert, bei `parameter` die Kennung des Parameters, bei `connection` eine `DataLink` mit Kennung der Instanz und der Eigenschaft, bei `expression` der Ausdruck, bei `application` kein Wert) |
| `Instance` | Kopie einer Vorlage oder eines Objekttyps (E4): `name`, `key`, `origin` (`Origin`: Objekttyp, Kennung der Vorlage, bei einer eigenen Vorlage ihr Name zum Zeitpunkt des Einfügens; bei einem eingefügten Objekttyp oder einer mitgelieferten Vorlage nur Objekttyp und Kennung) und der gesamte Inhalt (`ObjectContent`) |
| `Template` | Vorlage: `id`, `name`, `description` und der Inhalt (`ObjectContent`) |
| `ObjectContent` | `object_type`, `parameter_values` (Parameterwerte der Instanz beziehungsweise Standardwerte der Vorlage), `parameters` (eigene Parameter: `key`, `name`, Datentyp, Pflicht, Standardwert, Auswahlwerte), `properties` (eigene Eigenschaften: `key`, `name`, Datentyp, Ausdruck), `instances` (enthaltene Instanzen von Indikatoren), `rules` (enthaltene Regeln und Regelwerke), `expression`, `determined_property`, `comparison` (`hoechstens`, `mindestens`, `gleich`) und `result_expression` |

Der Inhalt je Objekttyp (Spezifikation 3.3):

| Objekttyp | verwendete Felder |
| --- | --- |
| mitgelieferter Indikator (`EMA`, `ATR`, `ZigZag`, `Markttechnik`) | nur `parameter_values` |
| `Indikator` | `parameters`, `parameter_values`, `instances`, `rules`, `properties`; ein Ausdruck kann das Ergebnis einer enthaltenen Regel verwenden (`regel.ergebnis`) |
| `Trend` | `parameter_values` für `instrument`, `zeiteinheit` und `berechnungsverfahren`, beim Verfahren „Ausdruck“ `instances`, `rules` und `properties` (darunter die Eigenschaft `richtung`) |
| `Regel` | `parameters`, `parameter_values`, `expression`, `determined_property` (bestimmte Eigenschaft der Order oder leer bei einer nur prüfenden Regel), `comparison` (Vergleich beim Prüfen) |
| `Regelwerk` | `rules` in festgelegter Reihenfolge, optional `result_expression` für das Gesamtergebnis |

Eine Instanz ist in vollem Umfang änderbar und braucht zur Ausführung ihre Vorlage nicht. Kein Dokument verweist zur Ausführung auf ein anderes Dokument. Löschen oder Ändern einer Vorlage wirkt nicht auf Instanzen.

Ein Element, das ein Objekt zeigt (`EMA`, `Kerze`, `Trend` und so weiter), trägt als `type` die Kennung des Objekttyps, enthält die Instanz in `instance` und hat weder `name` noch `key`: Sein Name ist der Name der Instanz. Es hat keine Lage. Eine Instanz kann aus einem eingefügten Objekttyp oder aus einer Vorlage entstehen; ein Objekttyp oder Elementtyp, den die Bibliothek nicht kennt, ist gültig (Abschnitt 10).

Abschnitte, Ausrichtung und eingeklappte Rahmen ändern die Bedeutung der Strategie nicht. Die Prüfung achtet darauf, dass ein Abschnitt nur Elemente seines Ablaufs enthält, ein Element in höchstens einem Abschnitt steht und es nicht mehr Abschnitte als Elemente gibt (`layout.invalid`, Abschnitt 9.2).

### 5.1 Regelvorlage „Risiko je Trade“

Die mitgelieferte Regelvorlage steht in `risk_rule.py`: `risk_per_trade_template()` liefert die Vorlage, `risk_per_trade_instance(name, risikogrenze)` eine Instanz mit Herkunft. Die Vorlage hat die feste Kennung (Konstante `RISK_PER_TRADE_RULE_ID`):

```text
7c1d4e2a-5b3f-4a86-9d27-e1f0a3c8b645
```

`pipwerk_domain.defaults.builtin_templates()` liefert alle mitgelieferten Vorlagen (derzeit nur diese) als neue Objekte bei jedem Aufruf; das Backend kennt dadurch keine einzelne Vorlage (E2). Sie ist in jeder Installation gleich und wird nicht geändert oder gelöscht (E6). Ihr Name ist in Deutsch „Risiko je Trade“ und in Englisch „Risk per trade“ (`RISK_PER_TRADE_LABEL`; das Dokument speichert nur den deutschen Namen, die Web-API liefert beide). Weitere Bestandteile: Objekttyp `Regel`, Parameter `risikogrenze` (Prozent, Pflicht, Standardwert 1 %, also `0.01`), bestimmte Eigenschaft `volumen`, Vergleich beim Prüfen `hoechstens` und der Ausdruck aus Spezifikation 3.5 in normalisierter Schreibweise (Konstante `RISK_PER_TRADE_EXPRESSION`); der Abstand vom Preis zum Stop-Loss steht an beiden Stellen ausgeschrieben. Die Regel ist fehlerfrei als Regel der Strategie und als Regel eines Elements.

## 6. Namensräume

### 6.1 Namen und Kennungen

Strategie, Strategieparameter, Instanz, Element, Abschnitt, eigene Parameter und eigene Eigenschaften haben genau einen Namen: frei wählbar, mit Leerzeichen, Umlauten und Zeichen wie dem Bindestrich, höchstens `MAX_NAME_LENGTH` Zeichen. Alles, was Ausdrücke ansprechen (Strategieparameter, Instanz, Regel, Bedingung, Berechnung, eigener Parameter und eigene Eigenschaft), hat zusätzlich eine Kennung im Ausdruck (`key`), die die Bibliothek beim Anlegen bildet (Spezifikation 3.3):

- `identifier_from_name(name)` bildet die Kennung aus dem Namen nach der Regel in Spezifikation 3.1: Kleinbuchstaben, `ä`, `ö`, `ü` als `ae`, `oe`, `ue`, `ß` als `ss`, Leerzeichen und Bindestrich als `_`, andere Zeichen entfallen. Ein vorhandener Unterstrich bleibt erhalten, damit die Funktion auf eine Kennung angewendet diese Kennung zurückgibt (Festlegung der Umsetzung). Beispiele: „Punkt 1/3“ ergibt `punkt_13`, „Stop-Loss“ `stop_loss`, „Tickgröße“ `tickgroesse`, „aufwärts“ `aufwaerts`.
- `form_key(name, vergeben, ersatz)` bildet die Kennung eines neuen Objekts: Ist das Ergebnis leer, gilt der Ersatz (`bedingung`, `berechnung`, die Kennung des Objekttyps in Kleinbuchstaben bei einer Instanz, `parameter`, `eigenschaft`, `regel`); beginnt es nicht mit einem Buchstaben, kommt `n_` davor; ist es ohne Unterscheidung von Groß- und Kleinschreibung schon vergeben (andere Kennungen des Namensraums, Kennungen der Objekte der Anwendung, Namen der Funktionen), hängt die Funktion eine Zahl an (`kerze_2`).
- `operations.new_key(dokument, zeiger, name, kind=…, object_type=…)` ermittelt die vergebenen Kennungen der Liste, auf die der JSON Pointer `zeiger` zeigt (`/parameters`, `/elements`, `/rules`, `/instances`, `/properties` unterhalb eines Elements oder einer Instanz), und ruft `form_key` auf. Die Web-API ruft diese Funktion für `POST /api/v1/keys`; die Oberfläche bildet keine Kennung selbst (E2). Zeigt der Zeiger auf keine Liste, die neue Objekte aufnimmt, löst die Funktion `ScopeError` aus.
- Danach ändert niemand die Kennung mehr, auch nicht beim Umbenennen. Ausdrücke speichern die Kennung; die Anzeigeform zeigt den neuen Namen sofort (Abschnitt 7.6).
- Eine Kennung im Dokument besteht aus ASCII-Buchstaben, ASCII-Ziffern und `_` und beginnt mit einem Buchstaben oder `_` (`KEY_PATTERN`, höchstens `MAX_KEY_LENGTH` Zeichen), sonst meldet die Prüfung `key.invalid`. Buchstaben und Ziffern anderer Schriften und ein Zeilenumbruch sind nicht erlaubt, damit ein Name nicht einem anderen zum Verwechseln ähnlich sieht.
- Strategie, Elemente, Verbindungen und Abschnitte tragen zusätzlich eine UUID.

Eindeutigkeit (Spezifikation 3.3): Namen müssen innerhalb ihres Namensraums eindeutig sein, Namen von Instanzen, Regeln, Bedingungen und Berechnungen auch gegen die Namen der Objekte der Anwendung in beiden Sprachen, weil die Anzeigeform sie sonst nicht unterscheiden kann. Strategieparameter sind davon ausgenommen, weil sie in der Anzeigeform immer hinter `Strategie.` stehen. Die Prüfung vergleicht ohne Beachtung von Groß- und Kleinschreibung, sowohl die Namen als auch die Kennungen (`name.duplicate`, Abschnitt 9). Eine neue Instanz erhält den Namen ihres Typs beziehungsweise ihrer Vorlage mit angehängter Zahl, wo nötig („Kerze 2“); das legt die Oberfläche fest.

### 6.2 Namensräume

Ein Ausdruck sieht Namen von innen nach außen; ein innerer Name verdeckt einen äußeren ohne Befund (Hinweis S17). Den äußersten Namensraum bilden die Objekte der Anwendung (`Konto`, `Instrument`, `Kerze`, `Tick`, `Order`, `Position`, `Strategie`); `Strategie.name` spricht einen Strategieparameter an. Die Namen werden ohne Beachtung von Groß- und Kleinschreibung aufgelöst.

| Ausdruck von | Reihenfolge der Namensräume |
| --- | --- |
| Regel der Strategie | 1. Parameter der Regel (ohne Punkt), 2. die Regeln der Strategie (dieselbe Liste), 3. Namensraum der Strategie, 4. Objekte der Anwendung |
| Regel eines Elements | 1. Parameter der Regel, 2. die Regeln des Elements (dieselbe Liste), 3. Namensraum der Strategie, 4. Objekte der Anwendung |
| Regel in einer Vorlage `Indikator` oder `Trend` (und in einer Instanz davon) | 1. Parameter der Regel, 2. Namensraum der Vorlage: ihre eigenen Parameter, ihre enthaltenen Instanzen und Regeln, 3. Objekte der Anwendung, darunter `Strategie` mit den Strategieparametern. Die übrigen Namen der Strategie sieht sie nicht. |
| Regel in einem `Regelwerk` (Vorlage oder Instanz) | 1. Parameter der Regel, 2. die Regeln des Regelwerks (`regel`), 3. Objekte der Anwendung, darunter `Strategie` mit den Strategieparametern. Die übrigen Namen der Strategie sieht sie nicht. |
| Ausdruck eines Elements, einer Berechnung oder Bedingung | Namensraum der Strategie, dann Objekte der Anwendung; in einer Verwaltung hat `Order` die Eigenschaften des Ordertyps |
| Eigenschaft eines `Indikator` oder `Trend` | Namensraum der Vorlage, dann Objekte der Anwendung |
| Gesamtergebnis eines `Regelwerks` | die Regeln des Regelwerks, dann Objekte der Anwendung |
| Regelvorlage (`Regel` als Vorlage) | Parameter der Regel, dann Objekte der Anwendung; ein unbekannter Name ist ein Hinweis (Abschnitt 9) |

Der Namensraum der Strategie enthält alle Instanzen der Elemente (auch in Verwaltungen), die Kennungen der Bedingungen und Berechnungen (`kennung.ergebnis`) und die Regeln und Regelwerke der Strategie. Die Regeln eines Elements stehen nur in den Ausdrücken der Regeln dieses Elements. Eine Regel in einem Regelwerk heißt innerhalb des Regelwerks `regel`, außerhalb `regelwerk.regel`; das Gesamtergebnis `regelwerk.ergebnis`. Die Eigenschaften enthaltener Indikatoren sind mehrstufig ansprechbar: `trend_h1.ema20.wert`. Ein Eingang (`Element.inputs`) ändert den Namensraum nicht: Die Ausdrücke des Elements sprechen die Eigenschaft unter dem Namen der Instanz an.

Folgerungen aus den Festlegungen:

- Haben eine Regel des Elements und eine Regel der Strategie denselben Namen, meint ein Ausdruck einer Regel des Elements die Regel des Elements. Das ist kein Befund „Name doppelt vergeben“.
- „Name doppelt vergeben“ (Abschnitt 9) gilt für zwei Namen derselben Ebene: im Namensraum der Strategie, in den Regeln eines Elements, in den Parametern einer Regel, in den Regeln eines Regelwerks, im Namensraum einer Vorlage (Parameter, Instanzen, Regeln) und unter den Strategieparametern.
- Strategieparameter sind nur als `Strategie.name` ansprechbar und kollidieren deshalb nicht mit Instanzen.
- `Strategie` ist ein Objekt der Anwendung, auch in Indikator, Trend und Regelwerk. Die Strategieparameter unter `Strategie.<kennung>` sind dort ansprechbar. Eine Vorlage, für sich geprüft, kennt die Strategieparameter nicht; ein unbekannter Strategieparameter ist dort ein Hinweis `rule.unresolved_name` (bei Vorlagen `Regel`, `Regelwerk`, `Indikator` und `Trend` gleich). Eine Instanz innerhalb einer Strategie, auch in einem Regelwerk der Strategie, wird gegen die Strategieparameter dieser Strategie geprüft; ein unbekannter ist dort ein Fehler `expression.invalid`.
- Ein Regelwerk ist ein geschlossener Namensraum, auch als Instanz in der Strategie (Festlegung der Umsetzung nach dem Auftrag): Seine Regeln sehen weder die übrigen Namen der Strategie (Instanzen, Berechnungen, Bedingungen, Regeln) noch die Regeln außerhalb. Dasselbe gilt für die Ausdrücke von Indikator und Trend.

## 7. Ausdrücke

Ausdrücke folgen einer Auswahl aus OpenFormula (Spezifikation 3.4). Der Parser ist ein eigener, von Hand geschriebener Parser ohne `eval` und ohne Parsergenerator; er arbeitet ohne Rekursion, sodass auch tief geschachtelte Eingaben den Stapel von Python nicht erschöpfen. Es wird nichts ausgewertet.

### 7.1 Schreibweise

- Zahlen mit Dezimalpunkt, nur mit den ASCII-Ziffern `0` bis `9` (`3.14`); Namen der gespeicherten Form nur mit ASCII-Buchstaben, ASCII-Ziffern und `_`. Andere Zeichen sind ein Schreibfehler (`invalid_character`, bei Ziffern hinter einer Zahl `invalid_number`), in der Anzeigeform stehen Namen mit anderen Zeichen in eckigen Klammern (Abschnitt 7.6). Texte in doppelten Anführungszeichen (ein doppeltes Anführungszeichen im Text wird verdoppelt: `"a""b"`), `TRUE()` und `FALSE()`, das Prozentzeichen unmittelbar nach einer Zahl (`1%` ist `0.01`).
- Operatoren: `+ - * / ^ &`, Vergleiche `= <> < <= > >=`, Vorzeichen und Klammern. Die logischen Operatoren sind die Funktionen `AND`, `OR`, `NOT`.
- Rangfolge von niedrig nach hoch: Vergleich, `&`, `+ -`, `* /`, `^`, Vorzeichen. Wie in OpenFormula bindet das Vorzeichen stärker als `^`, `-2^2` ist also 4. Alle binären Operatoren gruppieren von links.
- Argumente einer Funktion trennt `;`. Zwischen den Teilen darf Leerraum einschließlich Zeilenumbrüchen stehen.
- Namen: `Objekt.Eigenschaft`, bei enthaltenen Objekten mehrstufig. Groß- und Kleinschreibung von Namen und Funktionen wird nicht unterschieden. Gespeichert wird die Schreibweise der Kennung (Abschnitt 7.4).
- Festgelegte Werte einer Auswahl stehen als Text mit ihrer Kennung: `mt.phase = "bewegung"`.
- Ein leerer Platz (`[]`, eckige Klammern ohne Inhalt) steht für einen entfernten oder noch nicht gewählten Wert (Abschnitt 7.9).

Positionen sind Zeichenpositionen (beginnend bei 0): `start` ist das erste Zeichen, `end` die Stelle hinter dem letzten Zeichen.

### 7.2 Funktionen

`list_functions()` liefert die Funktionen mit Signatur und Ergebnistyp (`FunctionSignature`: `name`, `label` und `explanation` in Händlersprache, je `Label(de, en)`, `parameters` mit je `name`, Art des Arguments, `optional`, `label` und `explanation`, `variadic`, `result`, `min_arguments`, `max_arguments`). Die Namen sind die der Norm.

| Funktion | Argumente | Ergebnis |
| --- | --- | --- |
| `IF` | Bedingung (Wahrheitswert), Wert, optional Sonst-Wert | gemeinsamer Typ der Werte |
| `AND`, `OR` | ein oder mehr Wahrheitswerte | Wahrheitswert |
| `NOT` | ein Wahrheitswert | Wahrheitswert |
| `MIN`, `MAX` | eine oder mehr Zahlen | Zahl |
| `ABS` | eine Zahl | Zahl |
| `FLOOR`, `CEILING` | Zahl, Schrittweite | Zahl |
| `ISNA` | ein Wert | Wahrheitswert |
| `IFNA` | Wert, Ersatzwert | gemeinsamer Typ |
| `ISBLANK` | ein Wert | Wahrheitswert |
| `PREVIOUS` | Name eines Werts mit früherem Wert, optional Anzahl (ganze Zahl ab 1) | Typ des Namens |
| `TRUE`, `FALSE` | keine | Wahrheitswert |

`PREVIOUS` ist die eigene Funktion für frühere Werte (req-fach-014); deutsche Funktionsnamen (`VORHER`) sind offen und werden nicht angeboten. Das erste Argument ist ein Name, für den das Fachmodell einen früheren Wert festlegt (Spezifikation 3.4): eine Eigenschaft eines Objekts mit Zeiteinheit (Indikator, Trend, `Kerze`, auch ohne Instanz), eine Eigenschaft von `Tick` oder das Ergebnis einer Bedingung oder Berechnung. Jedes andere Argument ist ein Fehler (`expression.invalid` mit `issue` = `previous_argument`; `reason` = `not_a_name` oder `no_earlier_value`).

### 7.3 Typprüfung und Befunde im Ausdruck

Die Typprüfung kennt die Datentypen aus Abschnitt 3.1. Zahl, Ganzzahl und Prozent sind untereinander verträglich. Text, Auswahl und Zeiteinheit lassen sich als Text vergleichen; ein fester Text, der mit einer Auswahl verglichen oder einer Eigenschaft einer Auswahl zugewiesen wird, muss einer ihrer Werte sein (auch alle festen Texte eines `IF`). Ein Text, der erst bei der Ausführung entsteht, wird dort geprüft. Ein fester Text an der Stelle eines Instruments muss eine gültige Bezeichnung sein (Abschnitt 3.2). Ein unbekannter Typ (nach einem Fehler) ist mit allem verträglich, damit ein Fehler keine Folgefehler erzeugt.

`analyze(text, umgebung, erwartet)` liefert eine `Analysis` mit

- `issues`: die Befunde des Ausdrucks, je mit `kind`, `start`, `end`, `reason` und `details`,
- `names`: die erkannten Namen mit `start`, `end`, der Kennung (`identifier`, Teile mit Kennung und Stelle in `segments`) und, ob der ganze Name erkannt wurde (`resolved`); das braucht der Endpunkt `/api/v1/check`,
- `functions`: die erkannten Funktionen mit Stelle,
- `slots`: die Stellen der leeren Plätze,
- `result_type`: der Ergebnistyp, `tree`: der Syntaxbaum, `normalized`: die normalisierte Schreibweise.

| `kind` | Bedeutung | `reason` | Angaben |
| --- | --- | --- | --- |
| `syntax` | Schreibfehler | `unexpected_end`, `unexpected_token`, `invalid_character`, `invalid_number`, `unterminated_string`, `too_long`, `too_deep` | `found`, bei Grenzen `length`/`maximum` |
| `unknown_function` | unbekannte Funktion (Stelle des Funktionsnamens) | – | `name` |
| `unknown_name` | unbekannter Name (Stelle des ersten Namensteils) | – | `name` |
| `unknown_property` | unbekannte Eigenschaft (Stelle des Namensteils) | – | `object`, `property` |
| `type_mismatch` | unpassender Typ | `operand`, `comparison`, `ordering`, `argument`, `branches`, `result`, `object_not_value` | `expected`, `found`, `operator`, `function`, `index`, `left`, `right`, `name` |
| `unknown_choice_value` | unbekannter Wert einer Auswahl (Stelle des Textes selbst, auch in den Wertzweigen von `IF` und `IFNA` und in Klammern; je unbekanntem Text ein Befund) | `comparison`, `result` | `values`, `allowed` |
| `argument_count` | falsche Zahl von Argumenten | – | `function`, `minimum`, `maximum`, `found` |
| `previous_argument` | `PREVIOUS` mit einem Argument, für das kein früherer Wert festgelegt ist | `not_a_name`, `no_earlier_value` | `function`, `name` |
| `invalid_instrument` | fester Text an der Stelle eines Instruments ist keine gültige Bezeichnung (Befund `instrument.invalid`, nicht `expression.invalid`) | – | `values` |

Die Umgebung (`Environment`) löst den ersten Teil eines Namens auf; `Scope` ist ihre Umsetzung als Namensraum mit äußerem Namensraum. Die Konsistenzprüfung baut die Namensräume nach Abschnitt 6 auf.

### 7.4 Normalisierung

`normalize_expression(text, umgebung)` schreibt einen Ausdruck mit Namen in der Schreibweise ihrer Kennung und Funktionen in der Schreibweise der Norm. Es ändert nur erkannte Namen und Funktionsnamen; jedes andere Zeichen (Leerraum, Zeilenumbrüche, Texte, Zahlen) bleibt Zeichen für Zeichen erhalten. Ein unbekannter Name oder eine unbekannte Funktion bleibt unverändert, ebenso ein Ausdruck mit einem Schreibfehler. Die Funktion ist idempotent. `normalize_strategy` und `normalize_template` wenden sie auf alle Ausdrücke eines Dokuments an, jeden in seinem Namensraum (Abschnitt 6), und liefern eine Kopie; das Argument bleibt unverändert. Beispiel: `order.VOLUMEN` ergibt `Order.volumen`, `if(a;1;2)` ergibt `IF(a;1;2)`. Die Objekte der Anwendung behalten ihre Schreibweise (`Order`, `Konto`), alle Eigenschaften sind klein geschrieben (`Order.stop_loss`). Beide Testfalldokumente sind in dieser Schreibweise gespeichert.

### 7.5 Zusammenhang der Typprüfung

Die Typprüfung kennt zu jedem Ausdruck seinen Zusammenhang (Spezifikation 3.4):

| Zusammenhang | `Order` | `Position` |
| --- | --- | --- |
| Regel der Strategie oder eines Elements | Eigenschaften aller Ordertypen | Eigenschaften der Position |
| Ausdruck in der Verwaltung | Eigenschaften des Ordertyps dieses „Order aufgeben“ | Eigenschaften der Position |
| Ausdruck im Hauptablauf, Indikator, Trend | Fehler (`expression.order_outside_management`) | Fehler |
| Regel in einem Indikator oder Trend, auch in einem Regelwerk darin | Fehler (`rule.order_in_indicator`) | Fehler |

- Hinweis S27: Für die Vorlage einer Regel oder eines Regelwerks gilt der Zusammenhang „Regel der Strategie oder eines Elements“: `Order` hat die Eigenschaften aller Ordertypen.
- Hinweis S18: Eine Regel wird immer in ihrem eigenen Zusammenhang geprüft. Verwendet ein Ausdruck in der Verwaltung ihr Ergebnis, prüft die Typprüfung die Regel nicht erneut gegen den Ordertyp dieser Verwaltung. Fehlt dem Ordertyp eine angesprochene Eigenschaft, ist der Wert bei der Ausführung „nicht verfügbar“ (Abschnitt 8). Das ist kein Befund.
- Ob eine Regel `Order` oder `Position` anspricht, gilt auch über das Ergebnis einer anderen Regel (`a.ergebnis`, `regelwerk.regel.ergebnis`), nicht aber über Bedingungen oder Berechnungen.
- Das Ergebnis einer Regel hat den Datentyp ihrer bestimmten Eigenschaft (Zahl für `volumen`, Auswahl für `richtung`), bei einer nur prüfenden Regel den Wahrheitswert. Das Gesamtergebnis eines Regelwerks hat den Typ seines Ausdrucks.

### 7.6 Gespeicherte Form und Anzeigeform

Die gespeicherte Form hat die Kennungen der Objekte und die Kennungen der Werte einer Auswahl in der normalisierten Schreibweise. Die Anzeigeform zeigt statt der Kennungen die Namen des Anwenders, die Namen der Objekte der Anwendung und die Beschriftungen der Eigenschaften und Werte in der gewählten Sprache (`Konto.Kapital`, englisch `Account.Capital`). Funktionen stehen mit ihren Namen aus der Norm. Ein Name, der kein einfacher Name nach OpenFormula ist (nicht nur Buchstaben, Ziffern und `_`, oder mit einer Ziffer am Anfang), steht in eckigen Klammern: `[EMA 20].Wert`, `Strategie.[Stop-Abstand]`, `[1-2-3-Trend H1].[Trend intakt]` (`is_simple_name`, `display_part`).

`render(text, umgebung, sprache, display_input=…, erwartet=…)` wandelt in beide Richtungen und liefert beide Formen (`Rendering`: `stored`, `display`, `analysis`). Bei der Eingabe gelten beide Formen und beide Sprachen; welche vorliegt, sagt `display_input`. Ein Name, der sich nicht eindeutig zuordnen lässt, ist ein unbekannter Name und bleibt wie geschrieben. Ein Ausdruck mit Schreibfehler bleibt in beiden Formen unverändert. Leerraum und Zeilenumbrüche bleiben erhalten. Feste Texte, die für einen Wert einer Auswahl stehen (Vergleich mit einer Auswahl, Ergebnis eines `IF` für eine Auswahl), wandelt die Funktion mit: gespeichert die Kennung (`"aufwaerts"`), angezeigt die Beschriftung (`"aufwärts"`). Umbenennen ändert keinen gespeicherten Ausdruck.

### 7.7 Bausteine und Satz

`to_blocks(analyse)` stellt jeden Ausdruck ohne Schreibfehler als Baum von Bausteinen dar, `blocks_to_text(baum)` bildet den gespeicherten Ausdruck daraus (Spezifikation 3.4, req-ui-015). Ein `Block` hat `kind` und je nach Art `path` (Liste der Kennungen), `value` und `datatype`, `operator`, `function`, `direction` und `children`:

| `kind` | Inhalt |
| --- | --- |
| `empty` | leerer Platz |
| `name` | Wert: Eigenschaft eines Objekts, Ergebnis, Strategieparameter oder Parameter; `path`, zum Beispiel `["ema20", "wert"]` oder `["Strategie", "stop_abstand"]` |
| `literal` | fester Wert mit `value` und `datatype` (`number`, `integer`, `percent`, `text`, `boolean`; ein Prozentwert ist die Zahl, wie geschrieben: 5 für 5 %) |
| `comparison` | Vergleich: `operator` aus `=`, `<>`, `<`, `<=`, `>`, `>=`; zwei Kinder |
| `arithmetic` | Rechnung: `operator` aus `+`, `-`, `*`, `/`, `^`, `&` (ein Kind bei einem Vorzeichen) |
| `logic` | Verknüpfung: `operator` aus `and`, `or`, `not` |
| `if` | Fallunterscheidung: Bedingung, Wert, Sonst-Wert |
| `function` | jede andere Funktion der Liste, `function` mit dem Namen aus der Norm |
| `crossing` | Kreuzung, `direction` aus `up`, `down`, `any`; zwei Kinder A und B |

Die Kreuzung „A kreuzt B nach oben“ steht für `AND(PREVIOUS(A) <= PREVIOUS(B); A > B)`, „nach unten“ für `AND(PREVIOUS(A) >= PREVIOUS(B); A < B)`, „in beide Richtungen“ für das `OR` aus beiden. `PREVIOUS` steht nur um einen Wert, für den ein früherer Wert festgelegt ist; jeder andere Wert (ein fester Wert, ein Strategieparameter) steht an beiden Stellen selbst: „EMA 20 kreuzt 50 nach oben“ ist `AND(PREVIOUS(ema20.wert) <= 50; ema20.wert > 50)`. Welche Namen einen früheren Wert haben, sagt der Umgebung-Parameter von `blocks_to_text(baum, umgebung)`; ohne Umgebung hat kein Name einen. Hat weder A noch B einen früheren Wert, bieten die Bausteine die Kreuzung nicht an, weil nichts kreuzen kann; die Oberfläche fragt dafür `previous_value` an den Eigenschaften der sichtbaren Namen ab (Abschnitt 7.8). Beim Zerlegen erkennt die Bibliothek die Form wieder, auch innerhalb von `AND` und `OR`. Ein Baum, der kein Ausdruck ist (zum Beispiel eine Kreuzung mit zusammengesetzten Operanden oder falscher Zahl von Kindern, ein unbekannter Operator, ein Name ohne Weg), löst `BlockError` mit einer Kennung (`reason`) und Angaben aus. Ein Ausdruck mit Schreibfehler hat keine Bausteine (`to_blocks` liefert `None`). Die Tiefe eines Baums ist auf `MAX_BLOCK_DEPTH` begrenzt.

`sentence(baum, sprache, erwartet)` liefert den lesbaren Satz zu einem Baum in Deutsch oder Englisch, wie Zeichenfläche und Eigenschaftenansicht ihn zeigen (`ema20.wert` größer als `ema50.wert` und so weiter).

### 7.8 Zeichen und sichtbare Namen

`characters(text)` liefert die Zeichen eines Ausdrucks (`Character`) mit `kind` (`name`, `function`, `value`, `operator`, `bracket`, `separator`), `start`, `end` und, bei Klammern, `partner` (Index der zugehörigen Klammer in der Liste, `None`, wenn es keine gibt). Das gilt auch für einen Ausdruck mit Schreibfehler; was sich nicht lesen lässt, bleibt weg. Leerraum ist kein Zeichen, das Prozentzeichen gehört zur Zahl davor.

`visible_names(namensraum, sprache)` liefert die an der Stelle eines Ausdrucks sichtbaren Namen (`VisibleName`): `display` (Anzeigename in der Sprache), `path` (Weg aus Kennungen), `kind` (`instance`, `result`, `strategy_parameter`, `parameter`, `application_object`, `rule`), `datatype` (bei Strategieparameter und Parameter), `properties` (je `PropertyInfo` mit `key`, `label`, `datatype`, `explanation`, `choices` und `previous_value`) und `contents` (enthaltene Instanzen und Regeln einer Instanz mit Inhalt, eines Trends mit enthaltenen Instanzen und eines Regelwerks mit seinen Regeln; Hinweis S19). Nach dem Namen einer Bedingung oder Berechnung bietet sie ihr `Ergebnis` an (Mangel M15). Die Zahl der Namen ist auf `MAX_NAMES_PER_ITEM`, die der Eigenschaften je Name auf `MAX_PROPERTIES_PER_NAME` begrenzt; wo gekürzt wird, sagt das Ergebnis es.

### 7.9 Entfernen

Entfernt der Anwender ein Objekt, einen Strategieparameter, eine Bedingung oder eine Berechnung, die ein Ausdruck verwendet, ändert die Bibliothek die Ausdrücke (Spezifikation 3.4, `operations.py`):

- `remove_strategy_parameter(strategie, kennung)`, `remove_element(strategie, element)` (liefert die Kennungen der mit entfernten Elemente, bei „Order aufgeben“ die der Verwaltung) und `remove_rule(strategie, regel)` ersetzen jede Verwendung in einem zerlegbaren Ausdruck durch einen leeren Platz (`[]`), beenden die Belegungen mit der Bindungsart Strategieparameter oder Datenverbindung, die auf das Entfernte zeigen („nicht belegt“), und nehmen Eingänge, Verbindungen und Stellen in Abschnitten mit.
- Lässt sich ein Ausdruck nicht zerlegen, weil er einen Schreibfehler hat, bleibt die Kennung stehen; die Prüfung meldet sie als unbekannten Namen.
- Ein leerer Platz ergibt einen unvollständigen Ausdruck; er wird gespeichert und von der Prüfung als `expression.empty` (`reason` = `slot`, mit Stelle) gemeldet.

## 8. Bedeutung bei der Ausführung

Dieser Abschnitt legt fest, was Fehler, „leer“ und „nicht verfügbar“ bei der späteren Ausführung bedeuten. Die Bibliothek wertet nicht aus; Strategietester und Handelssystem setzen es um. Strategietester und Handelssystem protokollieren jeden Fehler einer Auswertung mit Element und Ausdruck.

**„Nicht verfügbar“** (`#N/A` nach OpenFormula): Spricht ein Ausdruck eine Eigenschaft an, die das Objekt im Zusammenhang der Auswertung nicht hat, ist der Wert „nicht verfügbar“. Das gilt für eine Eigenschaft, die der Ordertyp nicht hat (`Order.limitpreis` bei einer Stop-Order), für `Position` in einer Regel, die auf eine Order angewendet wird, und für `Position` in der Verwaltung, solange die Order noch keine Position hat. Jede Rechnung mit „nicht verfügbar“ ergibt „nicht verfügbar“, auch eine Bedingung von `IF`; `ISNA` und `IFNA` prüfen und ersetzen ihn. `IF` wertet nur den gewählten Zweig aus. Die Auswertung vermerkt bei „nicht verfügbar“, ob er von einer Eigenschaft stammt, die der Ordertyp nicht hat.

**„Leer“**: Eine Eigenschaft ohne Wert ist „leer“: eine KANN-Eigenschaft ohne Wert oder eine Eigenschaft, die das Objekt gerade nicht belegt, etwa `punkt_2` der Markttechnik ohne Trend. Rechnung und Vergleich mit „leer“ sind ein Fehler, ebenso eine Division durch null und die übrigen Fehlerwerte von OpenFormula. `ISBLANK` prüft auf „leer“ und liefert dafür „wahr“, ohne Fehler. Im Strategietester bricht ein solcher Fehler die Auswertung nicht ab: Liefert ein Indikator zu Beginn eines Testlaufs noch keine Werte, gilt eine Bedingung mit diesen Werten als nicht erfüllt, sie nimmt nach der Tabelle unten den Ausgang `falsch` (Anforderungen an den Strategietester req-test-008).

Wirkung bei der Ausführung, wenn das Ergebnis eines Ausdrucks ein Fehler, „leer“ oder „nicht verfügbar“ ist:

| Stelle | Wirkung | Grundlage |
| --- | --- | --- |
| Regel, Ergebnis „nicht verfügbar“ von einer Eigenschaft, die der Ordertyp nicht hat | sie wird auf diese Order nicht angewendet, ohne Fehler oder Meldung | req-fach-046 |
| bestimmende Regel, Fehler, „leer“ oder sonst „nicht verfügbar“ | die Eigenschaft ist nicht bestimmbar | req-fach-021 |
| prüfende Regel, Fehler, „leer“ oder sonst „nicht verfügbar“ | die Prüfung ist nicht erfüllt | req-fach-021 |
| Bedingung | jedes Ergebnis außer „wahr“ nimmt den Ausgang `falsch` | req-fach-047 |
| Berechnung | das Ergebnis ist dieser Wert; wer es verwendet, verhält sich nach dieser Tabelle | req-fach-048 |
| Belegung einer Eigenschaft bei „Order aufgeben“, „Order ändern“, „Position ändern“, „Position schließen“ | die Eigenschaft ist nicht bestimmbar: Ausgang `nicht_gestellt` beziehungsweise `nicht_geaendert`, bei „Position schließen“ wird nichts geschlossen und der Ablauf geht weiter | req-fach-049, req-fach-049a |
| Strategieparameter ändern | der Strategieparameter bleibt unverändert, der Ablauf geht weiter | req-fach-047 |
| eigene Eigenschaft eines Indikators oder Trends | die Eigenschaft ist „leer“ | req-fach-013a |

Festlegungen zu dieser Tabelle:

- Hinweis S24: Der Vermerk „von einer Eigenschaft, die der Ordertyp nicht hat“ geht durch Rechnungen, Funktionen, den gewählten Zweig und die Bedingung von `IF` und das Ergebnis einer anderen Regel weiter. Treffen Werte „nicht verfügbar“ verschiedener Herkunft zusammen, trägt das Ergebnis den Vermerk, wenn mindestens einer ihn trägt. Wird eine Regel auf eine Position angewendet, ist `Order` die Order, aus der die Position entstand (req-fach-051); fehlt deren Ordertyp eine Eigenschaft, gilt derselbe Vermerk.
- Hinweis S25: „In der Verwaltung sieht die Regel die Order und Position der Verwaltung“ gilt für eine Regel, deren Ergebnis ein Ausdruck der Verwaltung verwendet. Eine Regel, die bei „Order ändern“ in der Verwaltung auf die Order angewendet wird, findet keine Position vor: `Position` ist dort „nicht verfügbar“, auch nach einer Teilausführung.
- Hinweis S21: Ein Parameter einer Instanz, der mit einem Ausdruck belegt ist, wirkt bei Fehler, „leer“ oder „nicht verfügbar“ wie eine eigene Eigenschaft eines Indikators: Alle Eigenschaften der Instanz sind „leer“. Ein Parameter eines Auslösers mit einem solchen Ergebnis lässt den Auslöser nicht eintreten. Das Gesamtergebnis eines Regelwerks wirkt wie das Ergebnis einer Regel: bestimmend nicht bestimmbar, prüfend nicht erfüllt.

Die Regelvorlage „Risiko je Trade“ fängt `Position` mit `ISNA` ab (Spezifikation 3.5). Eine Order oder Position ohne Stop-Loss erfüllt sie nicht, weil der Stop-Loss dann „leer“ ist.

## 9. Konsistenzprüfung

`check_strategy(strategy)` und `check_template(template)` liefern alle Befunde (`Finding`): `level` (`error` = Fehler, `hint` = Hinweis), `code` (die Kennung des Befunds), `element` (Kennung des betroffenen Elements oder `None`), `subject` (betroffene Instanz oder Regel oder `None`; bei einem Teil innerhalb einer anderen Instanz die Kennungen mit Punkt verbunden, zum Beispiel `regelwerk.regel` oder `trend_h1.regel`) und `details` (Angaben für den Text). `Finding.to_dict()` liefert die JSON-Form. Die Prüfung läuft für eine Strategie und für jede Vorlage; bei einer Vorlage ist `element` immer leer. Die Reihenfolge der Befunde ist nicht festgelegt. Texte erzeugt die Bibliothek nicht.

Jeder Befund trägt seine Kennung und die Angaben für den Text. Die Kennungen sind Konstanten in `pipwerk_domain.consistency.findings`; die folgenden Tabellen listen alle. Eine „Angabe ohne Wert“ ist ein Parameter, eine Eigenschaft oder ein Ausdruck, dem ein Wert fehlt (`parameter.missing`, `order.property_missing`, `expression.empty`).

### 9.1 Befunde der Tabelle in Spezifikation 3.6

| Kennung | Stufe | Befund | betroffen | Angaben |
| --- | --- | --- | --- | --- |
| `trigger.unconnected` | Fehler | Auslöser ohne Verbindung in den Ablauf | der Auslöser | – |
| `flow.not_reached` | Fehler | Element des Ablaufs, das kein Auslöser erreicht: ohne eingehende Verbindung, auch in einer Strategie ohne Auslöser, oder nur mit Verbindungen von Elementen, die selbst kein Auslöser erreicht; auch bei Kreisen ohne Auslöser. Instanzen auf der Zeichenfläche sind ausgenommen | das Element | – |
| `flow.main_without_trigger` | Hinweis | Hauptablauf ohne Auslöser: die Strategie startet nie, auch wenn Verwaltungen eigene Auslöser haben. Für eine neue, leere Strategie der einzige Befund | – | – |
| `instrument.invalid` | Fehler | festes Instrument mit ungültiger Bezeichnung (Abschnitt 3.2), an jeder Stelle, an der ein festes Instrument steht | Element, Instanz oder Strategieparameter | `parameter` oder `property`, `value`, bei einem Strategieparameter `scope` = `strategy`; bei einem Ausdruck wie `expression.invalid` |
| `expression.invalid` | Fehler | fehlerhafter Ausdruck: Schreibfehler, unbekannte Funktion, unbekannter Name, unbekannte Eigenschaft, unpassender Typ, unbekannter Wert einer Auswahl, `PREVIOUS` mit einem Argument ohne früheren Wert | Element (leer bei einer Regel der Strategie oder einer Vorlage), Instanz oder Regel | `field` (welcher Ausdruck: `parameter:<kennung>`, `property:<kennung>`, `expression`, `result_expression`, `property_definition:<name>`), `start`, `end`, `issue` (die `kind` aus Abschnitt 7.3), `reason` und die Angaben des Befunds im Ausdruck |
| `expression.empty` | Fehler (Angabe ohne Wert) | Ausdruck fehlt oder enthält einen leeren Platz (Bedingung, Berechnung, „Strategieparameter ändern“, Regel, eigene Eigenschaft, Richtung des Trends, Belegung mit Ausdruck) | wie `expression.invalid` | `field`, `reason` (`missing` oder `slot`), bei `slot` `start`, `end` |
| `data.unknown` | Fehler | Datenverbindung (Belegung oder Eingang) zu einer Instanz oder Eigenschaft, die es nicht gibt | Element, Instanz oder Regel | `where` (`binding` oder `input`), `reason` (`unknown_instance`, `unknown_property`), `instance`, `property`, bei `binding` `target`, `target_kind` |
| `data.type_mismatch` | Fehler | Belegung mit Bindungsart Datenverbindung, deren Eigenschaft nicht zum Datentyp des Parameters oder der Eigenschaft passt | Element, Instanz oder Regel | `instance`, `property`, `expected`, `found`, `target`, `target_kind` |
| `input.unused` | Hinweis | Eingang, den kein Ausdruck des Elements oder seiner Regeln und keine Datenverbindung des Elements verwendet | das Element | `instance`, `property` |
| `rule.result_mismatch` | Fehler | Ergebnis einer bestimmenden Regel passt nicht zur bestimmten Eigenschaft (bei einer prüfenden Regel: Ergebnis ist kein Wahrheitswert) | Regel | `reason` (`unknown_property`, `choice_value`, `type`), `property`, `expected`, `found`, `values`, `allowed` |
| `flow.unending_loop` | Fehler | Rückführung ohne Bedingung, die sie beendet | das erste Element der Gruppe | `elements` (alle Elemente der Gruppe) |
| `parameter.missing` | Fehler (Angabe ohne Wert) | Pflichtparameter ohne Wert und nicht „bei der Anwendung“ | Element, Instanz oder Strategieparameter | `parameter`, bei Strategieparametern `scope` = `strategy` |
| `order.property_missing` | Fehler (Angabe ohne Wert) | MUSS-Eigenschaft der Order, die der Anwender belegt, ohne Belegung und ohne bestimmende Regel der Strategie oder des Elements | das Element „Order aufgeben“ | `property`, `order_type` |
| `ruleset.reference_order` | Fehler | Regelwerk mit Vorwärtsbezug oder Zirkelbezug | die Regel | `kind` (`forward` oder `cycle`), `list`, bei `forward` `rule` und `refers_to`, bei `cycle` `rules` |
| `expression.order_outside_management` | Fehler | `Order` oder `Position` im Ablauf außerhalb einer Verwaltung, auch über das Ergebnis einer Regel | Element, Instanz | `field`, `context` (`main_flow` oder `indicator`) |
| `rule.order_in_indicator` | Fehler | Regel, die `Order` oder `Position` anspricht, in einem Indikator oder Trend, auch in einem Regelwerk darin | Element, Regel (`instanz.regel`) | – |
| `candle.no_instance` | Fehler | Zeile zu `Kerze` ohne Instanz: `Kerze` ohne Instanz mit gesetzter Zeiteinheit, wenn ein Auslöser außer `Kerzenschluss` oder kein Auslöser die Auswertung startet | Element, Instanz oder Regel der Strategie (`element` und `subject` wie beim Ausdruck) | – |
| `flow.management_only` | Fehler | Order ändern, Order löschen, Position ändern oder Position schließen außerhalb einer Verwaltung | das Element | `type` |
| `name.duplicate` | Fehler | Name oder Kennung doppelt vergeben innerhalb eines Namensraums (Abschnitt 6.1), auch gegen die Objekte der Anwendung | das zweite Element, die zweite Instanz oder Regel | `name`, `key`, `namespace` (`strategy`, `strategy_parameters`, `element_rules`, `rule_parameters`, `ruleset`, `template`), `what` (`name` oder `key`), bei einem Zusammenfall mit einem Objekt der Anwendung `with_application_object` |
| `type.unknown` | Fehler | unbekannter Elementtyp oder Objekttyp | das Element, die Instanz | `kind` (`element` oder `object`), `type` |
| `flow.no_order_reachable` | Hinweis | kein Element „Order aufgeben“ von einem Auslöser des Hauptablaufs erreichbar; nicht gemeldet bei einem Hauptablauf ohne Auslöser, der schon den Hinweis `flow.main_without_trigger` erhält | – | – |

Die unzulässigen Verbindungen aus Spezifikation 3.3 meldet `connection.invalid` (Abschnitt 9.2). Eine Strategie ohne Auslöser lässt sich speichern, wird aber nicht ausgewertet (req-fach-015); sie erhält den Hinweis `flow.main_without_trigger`. Eine neue, leere Strategie erhält diesen Hinweis und sonst keinen Befund. Ein Element eines Ablaufs, auch einer Verwaltung ohne eigene Auslöser, braucht einen Auslöser, der es erreicht; die Auslöser, die das Element „Order aufgeben“ erreichen, erreichen auch die Elemente seiner Verwaltung ohne eigene Auslöser (Spezifikation 3.3).

Einzelheiten der Befunde:

- `flow.unending_loop`: Ein Kreis ist beendet, wenn auf ihm eine Bedingung liegt, von der ein Ausgang aus dem Kreis hinausführt oder ohne Fortsetzung endet. Die Prüfung arbeitet auf den stark zusammenhängenden Gruppen des Ablaufs; eine Gruppe ohne eine solche Bedingung ist ein Befund. Der Ablauf und jede Verwaltung werden getrennt geprüft.
- `candle.no_instance`: Die Prüfung gilt für jeden Ausdruck, der `Kerze` unter dem Namen des Objekttyps verwendet, solange kein Element `Kerze` mit gesetzter `zeiteinheit` auf der Zeichenfläche liegt. Fehler ist es
  - bei einem Element des Ablaufs und seinen Regeln, wenn das Element in seinem Ablauf (Hauptablauf beziehungsweise seine Verwaltung) von keinem Auslöser oder von einem anderen Auslöser als `trigger.candle_close` erreicht wird. Wird ein Element von `trigger.candle_close` und von einem anderen Auslöser erreicht, ist es ein Fehler.
  - bei einer Regel der Strategie und bei einer Instanz auf der Zeichenfläche (eigene Eigenschaften, Parameter), wenn die Strategie, Hauptablauf und alle Verwaltungen zusammen, keinen Auslöser oder mindestens einen anderen als `trigger.candle_close` hat. In `str-01` ist deshalb wegen `trigger.tick` in der Verwaltung eine Regel der Strategie mit `Kerze` ohne Instanz ein Fehler (Hinweis N4, Lesart nach req-fach-051).

  Wird ein Element nur von `trigger.candle_close` erreicht und hat die Strategie nur solche Auslöser, bleibt alles ohne Befund. `Instrument`, `Kerze` und `Tick` ohne Instanz erhalten keinen Befund für das Instrument (Abschnitt 3.2).
- `order.property_missing`: Zählt nur Eigenschaften mit `set_by_user`; eine Eigenschaft mit Standardwert (`gueltigkeit`, `instrument`) gilt als belegt; `ablaufzeit` und `datum` zählen nur bei dem zugehörigen Wert von `gueltigkeit`. Die Belegung mit der Bindungsart `application` zählt als Belegung. Eine bestimmende Regel (`determined_property`) der Strategie oder des Elements, auch in einem Regelwerk, ersetzt die Belegung.
- `ruleset.reference_order`: Ein Vorwärtsbezug (die Regel verwendet das Ergebnis einer späteren) und ein Zirkelbezug werden in einem Regelwerk gemeldet; ein Zirkelbezug auch in jeder anderen Liste von Regeln (Strategie, Element, Vorlage).
- `expression.order_outside_management` und `rule.order_in_indicator` erkennen `Order` und `Position` auch über das Ergebnis einer Regel, auch über mehrere Regeln.
- `input.unused`: Ein Eingang ändert die Bedeutung nicht (Spezifikation 3.3); der Hinweis erscheint nur, wenn kein Ausdruck des Elements oder seiner Regeln den Namen der Instanz und die Eigenschaft nennt und keine Belegung des Elements eine Datenverbindung zu dieser Eigenschaft hat.

### 9.2 Weitere Befunde

Diese Befunde stehen nicht in der Tabelle der Spezifikation; sie sind für eine vollständige Prüfung nötig.

| Kennung | Stufe | Befund | Angaben |
| --- | --- | --- | --- |
| `rule.unresolved_name` | Hinweis | Der Ausdruck einer Regelvorlage spricht einen Namen an, der weder Objekt der Anwendung noch Parameter der Regel ist; in jeder Vorlage (`Regel`, `Regelwerk`, `Indikator`, `Trend`), für sich geprüft, außerdem ein Strategieparameter unter `Strategie`, den die Vorlage nicht kennen kann. Geprüft wird der Name in jeder Strategie, die die Vorlage enthält (Spezifikation 3.4) | wie `expression.invalid` |
| `connection.invalid` | Fehler | unzulässige Verbindung nach Spezifikation 3.3 | `reason`, `source`, `output`, `target`; `reason` ist `unknown_source`, `unknown_target`, `unknown_output`, `target_is_trigger`, `instance_connection` (von oder zu einer Instanz), `management_output_outside` (vom Ausgang mit der Verwaltung zu einem Element außerhalb), `management_output_with_triggers` (vom Ausgang mit der Verwaltung, wenn die Verwaltung eigene Auslöser hat) oder `across_managements` (zwischen verschiedenen Abläufen) |
| `parameter.binding_invalid` | Fehler | Belegung passt nicht: Bindungsart nicht erlaubt, fester Wert vom falschen Typ oder nicht in der Auswahl, unbekannter Parameter oder unbekannte Eigenschaft, Strategieparameter unbekannt oder vom falschen Typ, von der Anwendung belegte Eigenschaft belegt | `reason` (`binding_kind`, `type`, `choice_value`, `value`, `unknown_parameter`, `unknown_property`, `set_by_application`), `parameter` oder `property` |
| `key.invalid` | Fehler | Kennung im Ausdruck enthält Zeichen, die ein Ausdruck nicht ansprechen kann (Abschnitt 6.1) | `key`, `what` |
| `element.rules_not_allowed` | Fehler | Dem Element sind Regeln zugeordnet, obwohl sein Typ keine zulässt | `type` |
| `element.management_invalid` | Fehler | `management_of` nennt kein Element „Order aufgeben“ | `owner` |
| `rule.invalid_type` | Fehler | In einer Liste von Regeln steht ein anderer Objekttyp, oder ein Objekt `Regel`/`Regelwerk` steht als Instanz oder Element | `reason` (`in_rules`, `in_instances`), `type` |
| `rule.comparison_missing` | Fehler | Eine bestimmende Regel nennt keinen Vergleich beim Prüfen | – |
| `trend.direction_missing` | Fehler | Ein `Trend` mit dem Berechnungsverfahren „Ausdruck“ (Standard) hat keinen Ausdruck für die Eigenschaft `richtung` (Spezifikation 3.3); gilt für die Vorlage und die Instanz | `property` |
| `calculation.circular_reference` | Fehler | Berechnungen verwenden ihre Ergebnisse im Kreis (auch eine Berechnung ihr eigenes). Ein Name in `PREVIOUS(…)` bezeichnet den Wert einer früheren Auswertung und zählt nicht als Abhängigkeit, `PREVIOUS(z.ergebnis) + 1` in `z` ist also kein Kreis; dasselbe gilt für den Zirkel- und Vorwärtsbezug bei Regeln und Regelwerken (`ruleset.reference_order`). Die Prüfung ordnet die Berechnungen nach ihren Abhängigkeiten, ohne Rekursion über Python-Aufrufe, auch bei einer Kette bis zur Grenze der Elemente | `elements`, `names`; Element ist das erste der Gruppe |
| `layout.invalid` | Fehler | Abschnitt oder eingeklappter Rahmen passt nicht: ein Abschnitt oder Rahmen nennt ein Element „Order aufgeben“, das es nicht gibt, ein Abschnitt ein Element, das es nicht gibt, ein Element in zwei Abschnitten oder ein Element eines anderen Ablaufs | `part` (`section` oder `collapsed_management`), `reason` (`unknown_flow`, `unknown_element`, `element_twice`, `other_flow`), `section`, `flow`, `element_id` |
| `findings.truncated` | Fehler | Die Zahl der Befunde ist begrenzt (Abschnitt 11). Bei Erreichen einer Grenze folgt dieser Befund ohne Element | `limit`, `scope` (`expression`: mehr als 50 Befunde in einem Ausdruck, weitere entfallen, dazu `field`, `element_id`, `instance`; `check`: 1000 Befunde in der Prüfung, die Prüfung endet) |

### 9.3 Erkannte Namen einer Prüfung

`check_strategy_with_names(strategy)` und `check_template_with_names(template)` prüfen wie `check_strategy` und `check_template` (dieselben Befunde) und liefern zusätzlich je Ausdruck die erkannten Namen (`CheckResult`: `findings`, `expressions`, `names_truncated`). Das braucht der Endpunkt `/api/v1/check` der Web-API (Spezifikation 5.3). Ein Eintrag von `expressions` (`ExpressionNames`) nennt `element` (Kennung des Elements oder `None`), `subject` (Instanz oder Regel, wie beim Befund) und `field` (welcher Ausdruck, dieselben Werte wie `field` bei `expression.invalid`) und die Namen (`NameOccurrence`): `start` und `end` (Zeichenpositionen im Ausdruck), `start` und `end` umfassen den ganzen geschriebenen Namen, `identifier` (die Schreibweise der erkannten Kennungen, mit Punkten verbunden; bei einem teilweise erkannten Namen nur die erkannten ersten Teile, bei einem ganz unbekannten leer), `resolved` (der ganze Name wurde erkannt), `previous` (der Name steht in `PREVIOUS(…)`) und `segments` (die erkannten Teile mit Kennung und Stelle; bei einem erkannten Namen alle, bei einem teilweise erkannten die erkannten ersten, bei einem ganz unbekannten keiner). Ein Ausdruck ohne Namen erscheint nicht. Es werden höchstens `MAX_NAMES_PER_CHECK` Namen zurückgegeben (Abschnitt 11). Die Namen werden gesammelt, bevor die Syntaxbäume freigegeben werden; ohne die Frage nach den Namen sammelt die Prüfung nichts.

Die Prüfung liefert höchstens `MAX_FINDINGS_PER_CHECK` Befunde und dazu den Befund `findings.truncated`; sie endet dann, spätere Befunde und Ausdrücke bleiben ungeprüft. `normalize_strategy` und `normalize_template` brauchen keine Befunde: Sie zerlegen die Ausdrücke nur, schreiben Namen und Funktionen und sammeln keine Befundliste (ein Ausdruck, in dem nichts zu ändern ist, wird gar nicht zerlegt). Ihre Laufzeit für ein Dokument von 2 MiB liegt in der Größenordnung der Prüfung. Ein Test schützt vor einem Ausreißer der Laufzeit (Zeitgrenze ohne `tracemalloc` gemessen) mit einem Dokument, in dem die Normalisierung jeden Ausdruck zerlegen und umschreiben muss; die Zeit gilt nicht als Eigenschaft von Dokumenten dieser Größe.

### 9.4 Zusammenhang einer Stelle

`check_with_contexts(wert)` prüft eine Strategie oder Vorlage und behält zu jeder Stelle eines Ausdrucks, die die Prüfung kennt, den Zusammenhang (`Checker.contexts`, Schlüssel ist der JSON Pointer der Stelle im Dokument): Namensraum, erwarteter Typ, Element, Instanz oder Regel, ob `Order` und `Position` dort ein Fehler sind, ob es eine Regelvorlage ist, Feldname. Der Endpunkt `/api/v1/expressions` braucht ihn, um einen Ausdruck an einer Stelle des Dokuments so zu zerlegen und zu prüfen, wie die Prüfung es tut (`Checker.context_findings`). Ein Zeiger auf eine Stelle ohne Ausdruck ist für den Endpunkt ein Fehler; die Stelle selbst darf fehlen, ihr übergeordnetes Objekt muss vorhanden sein.

## 10. Dokumente und Schemata

Strategie und Vorlagen werden als JSON-Dokument geschrieben und gelesen (Spezifikation 3.7). Die Pydantic-Modelle in `pipwerk_domain.documents` sind streng (`strict`, keine Umwandlung von Werten) und lehnen zusätzliche Felder ab (`extra="forbid"`).

| Format (`format`) | Modell | Datei im Objektverzeichnis (Backend) | Schema |
| --- | --- | --- | --- |
| `pipwerk.strategy` | `StrategyDocument` | `<uuid>.strategy.json` | `strategy.schema.json` |
| `pipwerk.indicator` | `IndicatorDocument` (`object_type` ist `Indikator` oder ein mitgelieferter Indikator) | `<uuid>.indicator.json` | `indicator.schema.json` |
| `pipwerk.trend` | `TrendDocument` | `<uuid>.trend.json` | `trend.schema.json` |
| `pipwerk.rule` | `RuleDocument` | `<uuid>.rule.json` | `rule.schema.json` |
| `pipwerk.ruleset` | `RulesetDocument` | `<uuid>.ruleset.json` | `ruleset.schema.json` |

Kopffelder: `format` und `format_version` (`2.0`, Konstante `FORMAT_VERSION`). Die Bibliothek schreibt nur 2.0. Ein Dokument mit höherer Hauptversion von `format_version` wird abgelehnt; erlaubt ist `2.<n>`, und ein Dokument `1.<n>` wird gelesen (Abschnitt 10.1). Weitere Felder der Dokumente entsprechen dem Objektmodell (Abschnitt 5):

- Strategie: `id`, `name`, `description`, `parameters` (je `key`, `name`, `datatype`, bei `object` `object_type`, `value`, `at_application`, `choices`), `rules`, `elements` (je mit `id`, `type`, `name`, `key`, `position`, `parameters`, `properties`, `inputs`, `rules`, `management_of`, `instance`), `connections` (`id`, `source`, `output`, `target`), `sections` (`id`, `name`, `flow`, `elements`, `collapsed`), `orientation` (`vertical` oder `horizontal`, Standard `vertical`) und `collapsed_managements`.
- Vorlage: `id`, `name`, `description`, `object_type` und der Inhalt: `parameter_values`, `parameters` (je `key`, `name`, `datatype`, …), `properties` (je `key`, `name`, `datatype`, `expression`, …), `instances`, `rules`, `expression`, `determined_property`, `comparison`, `result_expression`.
- Instanz (in `rules`, `instances`, `instance`): `name`, `key`, `object_type`, `origin` (`object_type`, `template_id`, nur bei einer eigenen Vorlage `template_name`) und derselbe Inhalt.
- Belegung (`Binding`): `{"kind": "fixed", "value": 5}`, `{"kind": "parameter", "value": "kennung"}`, `{"kind": "connection", "value": {"instance": "ema20", "property": "wert"}}`, `{"kind": "expression", "value": "…"}` oder `{"kind": "application"}`. Ein festes Instrument ist `fixed` mit der Bezeichnung als Text oder `instrument_der_anwendung`.

Zahlen sind endlich: `NaN`, `Infinity`, `-Infinity` und Zahlen, die zu unendlich werden (`1e999`), lehnt die Bibliothek an jedem Zahlenfeld ab (feste Werte, Standardwerte, Werte von Strategieparametern, `x`, `y`), beim Lesen eines JSON-Textes, beim Prüfen eines Python-Objekts und beim Aufbau eines Dokuments aus dem Objektmodell. Geschrieben wird nur gültiges JSON (`allow_nan=False`). Ein Dokument als Bytes muss UTF-8 ohne Byte-Order-Mark sein; andere Kodierungen (UTF-16, UTF-32, Latin-1) und eine Byte-Order-Mark werden abgelehnt (Festlegung der Umsetzung nach RFC 8259). Die Prüfung auf einzelne Ersatzzeichen endet für jede Eingabe: Ein Python-Objekt, das sich selbst enthält (Kreis), wird als Fehler des Dokuments abgelehnt; ein Teil, der mehrfach eingehängt ist, wird nur einmal durchlaufen. Ein Text mit einem einzelnen Ersatzzeichen (U+D800 bis U+DFFF ohne Partner, auch als Escape `\ud800` geschrieben) in einem Wert oder Schlüssel wird abgelehnt, beim Lesen wie beim Schreiben, weil er sich nicht als UTF-8 ausgeben lässt; ein gültiges Paar ist erlaubt. Ein JSON-Text mit einem Schlüssel, der in einem Objekt zweimal vorkommt, wird abgelehnt; ebenso Text, der kein gültiges JSON ist oder zu tief geschachtelt ist. Alles das ist ein `DocumentError`.

Kennungen (`id`, `template_id`, `management_of`, Verbindungen, Abschnitte) sind UUIDs in Kleinbuchstaben; Kennungen im Ausdruck (`key`) nach Abschnitt 6.1. Die Typen von Elementen und Objekten sind Zeichenketten. Ein Dokument mit einem unbekannten Elementtyp oder Objekttyp ist deshalb gültig und wird geladen; alle Belegungen bleiben beim Schreiben unverändert erhalten, die Konsistenzprüfung meldet den Typ (`type.unknown`). Ein solches Element hat einen Eingang; seine Ausgänge sind die Ausgänge, von denen im Dokument Verbindungen ausgehen (Hinweis S20); neue Verbindungen von ihm gibt es nicht. Gespeichert werden nur Kennungen und die Namen des Anwenders, keine übersetzten Texte; die Herkunft einer Instanz aus einer mitgelieferten Vorlage oder einem Objekttyp speichert nur dessen Kennung.

### 10.1 Lesen des Formats 1.0

`parse_document` und `read_document` erkennen ein Dokument mit `format_version` `1.<n>`, prüfen es mit den Modellen von `documents/v1.py` (streng wie bisher) und wandeln es in ein Dokument 2.0 um (`upgrade.py`, Spezifikation 3.7); die Datei wird erst beim nächsten Speichern als 2.0 geschrieben. Die Umwandlung:

- Kennung im Ausdruck (`key`): der bisherige Name; Ausdrücke bleiben unverändert gültig. Fällt er ohne Unterscheidung von Groß- und Kleinschreibung mit einem Objekt der Anwendung oder einer Funktion zusammen, bildet die Umwandlung eine eindeutige Kennung nach 6.1 und ersetzt ihn in den Ausdrücken seines Namensraums. Eine Bedingung oder Berechnung ohne bisherigen Namen erhält eine Kennung aus ihrer bisherigen Bezeichnung.
- Name: die bisherige Bezeichnung, wo es eine gibt, sonst der bisherige Name; bei einem Element, das ein Objekt zeigt, die Bezeichnung des Elements als Name der Instanz. Programmierschreibweise (`_` und kein Leerzeichen) wird zu Wörtern mit großem Anfangsbuchstaben (`name_from_programming_name`: „Stop abstand“, „Order ausgefuehrt“); Umlaute stellt sie nicht wieder her, `EMA20` bleibt.
- Herkunft aus einer mitgelieferten Vorlage oder einem Objekttyp: nur die Kennung, der gespeicherte Name entfällt.
- Die Lage auf der Zeichenfläche entfällt (`position` ist `null`).
- Der Parameter `kursquelle` des `EMA` wird `anwenden_auf` mit demselben Wert.
- Parameter und Eigenschaften `instrument` erhalten die Vorbelegung „Instrument der Anwendung“.
- Eingänge und Abschnitte sind leer, die Ausrichtung ist senkrecht, kein Rahmen ist eingeklappt; Verbindungen erhalten eine Kennung, die aus Quelle, Ausgang und Ziel abgeleitet ist (UUID Version 5).
- Hat eine Verwaltung ohne eigene Auslöser genau ein Element ohne eingehende Verbindung, legt die Umwandlung die Verbindung vom Ausgang `gestellt` zu ihm an. Sonst legt sie keine an; die Prüfung meldet die Elemente, die kein Auslöser erreicht.
- Ein Element mit unbekanntem Typ bleibt mit allen Belegungen unverändert erhalten.

Die gesicherte Strategie „EMA-Trendfolge“ des Auftraggebers (Format 1.0) lässt sich so ohne Fehler der Umwandlung lesen; ein Test prüft Namen und Bedeutung ihrer Ausdrücke.

### 10.2 Schemata

Die JSON-Schemata (Draft 2020-12) des Formats 2.0 liegen unter `contracts/strategies/v2/` und werden aus den Modellen erzeugt. Die Schemata des Formats 1.0 unter `contracts/strategies/v1/` bleiben unverändert (Prüfdaten für das Lesen). Der Befehl, der die Schemata von 2.0 neu erzeugt (im Verzeichnis `packages/domain-core`):

```sh
uv run --frozen python -m pipwerk_domain.documents.schemas ../../contracts/strategies/v2
```

Mit `--check` schreibt der Befehl nichts und endet mit Exitcode 1, wenn eine Datei von den Modellen abweicht. Dasselbe leistet der Eintrag `pipwerk-domain-schemas`, der mit dem Paket installiert wird. Ein Test vergleicht die erzeugten Schemata mit den Dateien.

Das Schema drückt Typen, zusätzliche Felder, Kennungsmuster, die Hauptversion und die Begrenzungen von Längen und Anzahlen aus. Die Schachtelungstiefe eines Ausdrucks und die Schachtelung von Instanzen prüft die Bibliothek beim Lesen; das Schema kann sie nicht ausdrücken.

### 10.3 Testfalldokumente

Die Testfälle `str-01` und `str-03` (Spezifikation Abschnitt 6) liegen im Format 2.0 als `contracts/strategies/v2/testcases/str-01.strategy.json` und `str-03.strategy.json`. Sie sind vollständig, in normalisierter Schreibweise, mit Namen in Händlersprache und Kennungen nach Spezifikation Abschnitt 6, ohne Lage, mit der Regel der Strategie `risiko` aus „Risiko je Trade“ (1 %) und der Regel des Elements `mindestvolumen`. Sie bestehen die Konsistenzprüfung ohne Fehler. Die Werte der Strategieparameter von `str-01` legt der Testfall fest, die Spezifikation nennt sie nicht. Die Kennungen der Elemente sind abgeleitet (UUID Version 5). Die Dokumente unter `contracts/strategies/v1/testcases/` und `v1/examples/` bleiben als Prüfdaten für das Lesen von 1.0.

### 10.4 Beispieldokumente

Unter `contracts/strategies/v2/examples/` liegen neun Beispieldokumente für die Prüfung der Web-API über `/docs`, die `docs/technical/pipwerk-studio.md` („Web-API ausprobieren“) beschreibt: die Regelvorlage `regel-vorlage.rule.json`, ihre geänderte Fassung `regel-vorlage-geaendert.rule.json` und sieben Fassungen von `str-03` mit je einer Änderung, die je einen bestimmten Befund der Konsistenzprüfung auslöst (`str-03-*.strategy.json`). Sie sind gültig gegen das Schema und in der Schreibweise, in der die Ablage sie speichert (`write_document(read_document(Text))` gleich dem Text; `tests/test_schemas.py`). Die Kennung im Dokument ersetzt die Web-API beim Anlegen; bei `PUT` muss sie die Kennung des Pfads sein. Die Befunde prüfen die Tests des Backends (`test_web_api_documentation_examples.py`).

## 11. Begrenzungen gegen Überlast

Die Begrenzungen (Spezifikation Abschnitt 8) stehen als Konstanten in `pipwerk_domain.limits`. Beim Lesen eines Dokuments prüft die Bibliothek sie und lehnt Überschreitungen als Fehler der Validierung (`DocumentError`) ab.

| Konstante | Wert | Bedeutung |
| --- | --- | --- |
| `MAX_DOCUMENT_BYTES` | 2 MiB | Größe eines Dokuments; die Bibliothek bietet nur die Konstante, das Backend prüft die Größe vor dem Lesen |
| `MAX_EXPRESSION_LENGTH` | 4096 | Länge eines Ausdrucks in Zeichen |
| `MAX_EXPRESSION_NESTING` | 64 | Schachtelungstiefe eines Ausdrucks: Klammern und Funktionsaufrufe ineinander; Klammern in Texten zählen nicht |
| `MAX_BLOCK_DEPTH` | 200 | Schachtelung von Bausteinen in einer Anfrage und einer Antwort von `/api/v1/expressions`; ein tieferer Baum wird ohne Bausteine beantwortet, und die Antwort sagt es |
| `MAX_ELEMENTS` | 1000 | Elemente einer Strategie; Abschnitte höchstens so viele wie Elemente |
| `MAX_CONNECTIONS` | 4000 | Verbindungen einer Strategie |
| `MAX_RULES_PER_LIST` | 200 | Regeln je Liste (Strategie, Element, Indikator, Trend, Regelwerk, Instanz) |
| `MAX_STRATEGY_PARAMETERS` | 200 | Strategieparameter |
| `MAX_INSTANCE_NESTING` | 16 | Schachtelung von Instanzen in Instanzen; die Instanz eines Elements und eine Regel der Strategie sind Ebene 1, enthaltene Instanzen und Regeln eine Ebene tiefer |
| `MAX_NAME_LENGTH` | 200 | Zeichen eines Namens (Strategie, Strategieparameter, Element, Instanz, Abschnitt, eigener Parameter oder eigene Eigenschaft, Vorlage) |
| `MAX_KEY_LENGTH` | 200 | Zeichen einer Kennung im Ausdruck |
| `MAX_INPUTS_PER_ELEMENT` | 50 | Eingänge je Element |
| `MAX_ITEMS_PER_REQUEST` | 50 | Einträge je Anfrage an `/api/v1/expressions` |
| `MAX_NAMES_PER_ITEM` | 500 | sichtbare Namen, die die Antwort zu einem Eintrag von `/api/v1/expressions` nennt; weitere entfallen, die Antwort sagt es |
| `MAX_PROPERTIES_PER_NAME` | 200 | Eigenschaften, die die Antwort zu einem sichtbaren Namen nennt; weitere entfallen, die Antwort sagt es |
| `MAX_FINDINGS_PER_EXPRESSION` | 50 | alle Befunde je Ausdruck zusammen. Die Liste ist abschließend: `expression.invalid`, `expression.empty`, `instrument.invalid`, `rule.unresolved_name` (auch Hinweise), `expression.order_outside_management`, `rule.result_mismatch` und `rule.order_in_indicator`. `rule.order_in_indicator` gehört bei einer Regel zum Ausdruck der Regel, bei einem Regelwerk zu dessen Ergebnisausdruck. Kein anderer Befund zählt dazu, insbesondere nicht `calculation.circular_reference` und `candle.no_instance`, denn sie betreffen mehrere Ausdrücke oder den Ablauf. Fallen weitere an, folgt genau ein `findings.truncated` (`scope` = `expression`) als letzter Befund des Ausdrucks; danach kommt kein Befund dieses Ausdrucks mehr. Die Zählung geschieht an einer Stelle der Prüfung (`Checker._expression_finding`) |
| `MAX_FINDINGS_PER_CHECK` | 1000 | Befunde je Prüfung einer Strategie oder Vorlage; die Prüfung endet, dazu kommt `findings.truncated` (`scope` = `check`) |
| `MAX_NAMES_PER_CHECK` | 20000 | erkannte Namen, die eine Prüfung zurückgibt, wenn danach gefragt wird (`check_strategy_with_names`, `check_template_with_names`, Abschnitt 9.3); weitere entfallen, `CheckResult.names_truncated` ist dann wahr. Die Befunde sind davon nicht berührt |

Die Zeichen je Ausdruck sind durch `MAX_EXPRESSION_LENGTH` begrenzt; die Zeichen, die `/api/v1/expressions` je Ausdruck nennt, sind nie mehr als die Zeichen des Ausdrucks. Die Grenzen der Befunde schützen Rechenzeit und Speicher (OWASP API4): Ein Dokument von 2 MiB mit lauter fehlerhaften Ausdrücken ergibt höchstens 1001 Befunde. Die Berechnungen werden dazu nach ihren Abhängigkeiten geordnet und ihre Befunde sofort gemeldet; der Speicher der Syntaxbäume wird nach dem Melden freigegeben. Die Tests mit Zeitgrenze messen die Zeit ohne laufendes `tracemalloc`, Zeit und Speicher getrennt. Die Zeitgrenze hat auf dem Rechner des Entwicklers mindestens den Faktor 10 Reserve; die Tests schützen vor einem Ausreißer der Laufzeit und belegen keine Antwortzeit. Die Laufzeit gültiger großer Dokumente liegt darüber und hängt vom Dokument ab; die Bibliothek sagt dafür keine Zeit zu.

Der Parser meldet einen zu langen oder zu tief geschachtelten Ausdruck auch beim Prüfen als Schreibfehler (`too_long`, `too_deep`). Die Schachtelung von Instanzen wird vor dem Aufbau der Modelle an den Rohdaten geprüft, damit auch sehr tiefe Eingaben den Stapel nicht erschöpfen.

## 12. Prüfungen

Alle Befehle laufen im Verzeichnis `packages/domain-core` (zum Beispiel mit `uv --directory packages/domain-core …`) und enden bei Erfolg mit Exitcode 0:

| Prüfung | Befehl |
| --- | --- |
| Umgebung einrichten | `uv sync --frozen` |
| Tests | `uv run --frozen pytest` |
| Stil | `uv run --frozen ruff check` und `uv run --frozen ruff format --check` |
| Typen (streng) | `uv run --frozen mypy` |
| Schemata neu erzeugen | `uv run --frozen python -m pipwerk_domain.documents.schemas ../../contracts/strategies/v2` |
| Schemata vergleichen | `uv run --frozen python -m pipwerk_domain.documents.schemas --check ../../contracts/strategies/v2` |

Die Tests (pytest) umfassen:

| Datei | Prüft |
| --- | --- |
| `test_identifiers.py` | Bildungsregel |
| `test_keys_and_instruments.py` | Kennung im Ausdruck beim Anlegen (Ersatz, `n_`, Zahl anhängen), `new_key` für jede Liste, Bezeichnungen fester Instrumente (gültige und ungültige Währungspaare, ISIN mit falscher Prüfziffer, Kleinbuchstaben) |
| `test_registry.py` | Register, Einstiegspunkt mit nachgebildeten Einstiegspunkten und mit einem Testpaket, auch fehlerhaft, Protokoll ohne Ausnahmetext und Pfad, Berechnungsverfahren und Ordertypen |
| `test_catalog.py` | alle mitgelieferten Typen, Gruppen, Namen, Beschriftungen und Erklärungen in beiden Sprachen, keine Kennung in Programmierschreibweise in Texten, Kennungen nach der Bildungsregel, von der Anwendung belegte Eigenschaften, Parameter `instrument`, Funktionsliste |
| `test_type_fields.py` | die Felder `holds_management`, `named` und `strategy_parameters` bei den mitgelieferten Typen mit Gegenprobe, Standardwerte bei einem über den Einstiegspunkt angemeldeten Typ, ein Typ mit zwei Ausgängen mit der Verwaltung (`register`, Einstiegspunkt, Protokoll), Zeiteinheiten in `choices` |
| `test_parser.py` | Zerlegung: Werte, Operatoren, Rangfolge, Funktionen, Schreibfehler mit Stelle, Begrenzungen |
| `test_expression_check.py` | Typprüfung mit gültigen und fehlerhaften Fällen je Regel, Auswahlwerte, erkannte Namen, Normalisierung |
| `test_forms_and_blocks.py` | Anzeigeform und gespeicherte Form in beide Richtungen und beiden Sprachen, eckige Klammern, Bausteine in beide Richtungen, Kreuzung in drei Richtungen, auch in `AND` und `OR` und ohne Kreuzung bei Werten ohne früheren Wert, `PREVIOUS`, Zeichen mit Art und Stelle, sichtbare Namen (Ergebnis nach Bedingung und Berechnung, Instanz mit Inhalt, Regelwerk), Satz |
| `test_operations.py` | Entfernen von Strategieparameter, Element, Regel mit allen Verwendungen, leerer Platz |
| `test_consistency_flow.py` | Befunde des Ablaufs, der Parameter, der Belegungen, von `Order`/`Position`, der Typen und der Kerze, jeweils mit Gegenprobe |
| `test_consistency_rules.py` | Ergebnis von Regeln, Regelwerke, Regeln in Indikatoren und Trends, Namensräume (S17), Zusammenhang der Typprüfung (S18, S27), Namen |
| `test_consistency_v2.py` | Befunde des Formats 2.0 mit Gegenprobe: Erreichbarkeit, Hinweis ohne Auslöser, festes Instrument, leerer Platz, Datenverbindungen, Eingänge, unzulässige Verbindungen, doppelte Namen, Abschnitte |
| `test_documents.py` | Schreiben und Lesen jedes Dokumenttyps, zusätzliche Felder, höhere Hauptversion, unbekannte Typen, jede Begrenzung am Grenzwert und darüber |
| `test_upgrade.py` | Lesen von 1.0 mit allen Punkten der Umwandlung, Testfalldokumente 1.0, gesicherte „EMA-Trendfolge“ |
| `test_schemas.py` | erzeugte Schemata gleich den Dateien, Schemata gegen Dokumente und Beispieldokumente, Befehl |
| `test_testcases.py` | beide Testfalldokumente: Schema, null Fehler, Schreiben und Vergleichen, Normalisierung ändert nichts, Vollständigkeit nach Abschnitt 6, abgewandelte Fassungen mit den Befunden |
| `test_risk_rule.py` | „Risiko je Trade“ als Regel der Strategie und eines Elements, Bestandteile, Namen in beiden Sprachen, Kopie |
| `test_architecture.py` | keine Frameworks, Pydantic nur in `documents`, kein `eval`/`exec`/`compile`, keine festen Pfade, Ports und Rechnernamen, Laufzeitabhängigkeit nur Pydantic |
| `test_hardening.py` | Strategieparameter in Vorlagen und Instanzen, Zahlen ohne JSON-Wert, doppelte Schlüssel, Namen und Zahlen in ASCII, lange Ketten und Kreise von Berechnungen, fehlerhafte Einstiegspunkte, Grenzen der Befunde mit Zeit und Speicher, Stelle bei Auswahlwerten, Trend ohne Richtung, `str-01` |
| `test_hardening_2.py` | Einstiegspunkte je Paket, eine Grenze für alle Befunde eines Ausdrucks, einzelne Ersatzzeichen, Kodierung von Bytes, `PREVIOUS` ohne Abhängigkeit, Laufzeit und Speicher der Normalisierung |
| `test_hardening_3.py` | die Grenze von 50 Befunden je Ausdruck mit `expression.order_outside_management`, `rule.result_mismatch` und Hinweisen in Vorlagen sowie mit `rule.order_in_indicator` (Regel und Regelwerk in einer Vorlage `Indikator`) (jeweils mit Gegenprobe), Normalisierung von 2 MiB mit Umschreiben jedes Ausdrucks, Kreis und mehrfach eingehängte Teile bei der Prüfung auf Ersatzzeichen |
| `test_check_names.py` | erkannte Namen einer Prüfung (Stelle, Kennung, nicht erkannte Namen, `PREVIOUS`, Ort des Ausdrucks, Begrenzung) und mitgelieferte Vorlagen (`builtin_templates`) |
| `test_model.py` | Objektmodell |
| `test_normalize.py` | Normalisierung aller Ausdrücke einer Strategie oder Vorlage |
| `test_documentation.py` | Kennungen und Befunde dieses Dokuments stimmen mit dem Code überein |

## 13. Abhängigkeiten

Eine neue Abhängigkeit braucht einen dokumentierten Zweck und die Prüfung von Lizenz, Wartungszustand, Sicherheitsrisiko und Kopplungswirkung (Entwicklungsregeln, Abschnitt 5 Punkt 12). Die Versionen sind in `uv.lock` festgeschrieben. Die Liste der Währungscodes (`instruments.py`) ist eigener Programmtext, keine Abhängigkeit.

Laufzeit (nur Pydantic, in derselben Version wie pipwerk Studio):

| Paket | Version | Lizenz | Zweck |
| --- | --- | --- | --- |
| `pydantic` | 2.13.5 | MIT | strenge Modelle der Dokumente und Erzeugung der JSON-Schemata, nur in `pipwerk_domain.documents` |
| `pydantic-core` | 2.46.5 | MIT | von Pydantic verlangt (Prüfung in Rust) |
| `annotated-types` | 0.8.0 | MIT | von Pydantic verlangt |
| `typing-extensions` | 4.16.0 | PSF-2.0 | von Pydantic verlangt |
| `typing-inspection` | 0.4.4 | MIT | von Pydantic verlangt |

Entwicklung und Prüfung (nicht Teil der Laufzeit):

| Paket | Lizenz | Zweck |
| --- | --- | --- |
| `pytest` | MIT | Tests |
| `ruff` | MIT | Stil und Formatprüfung |
| `mypy` | MIT | strenge Typprüfung |
| `jsonschema` | MIT | Prüfung der Dokumente gegen die erzeugten Schemata im Test |
| `types-jsonschema` | Apache-2.0 | Typangaben für `jsonschema` |
| `hatchling` | MIT | Bau des Pakets (Build-Backend) |

Die übrigen Pakete der Sperrdatei (`attrs`, `referencing`, `rpds-py`, `jsonschema-specifications`, `pluggy`, `iniconfig`, `packaging`, `pygments`, `pathspec`, `mypy-extensions`, `librt`, `ast-serialize`, `colorama`) werden nur von diesen Werkzeugen verlangt. Lizenzen: MIT, `packaging` Apache-2.0 oder BSD-2-Clause, `pygments` BSD-2-Clause, `colorama` BSD-3-Clause, `pathspec` MPL-2.0 (Werkzeug ohne Auslieferung).

## 14. Festlegungen der Umsetzung

Wo die Spezifikation etwas offen lässt, gilt Folgendes; es ist hier festgehalten, damit Backend und Oberfläche es kennen.

1. Datentyp `object` für Eigenschaften und Parameter, die auf ein Objekt der Anwendung verweisen (Abschnitt 3.1).
2. Kennungen der Zeiteinheiten sind klein geschrieben (`h1`); ein Strategieparameter vom Datentyp Zeiteinheit hat also Werte wie `"h1"`.
3. Prozent werden als Anteil gespeichert (`0.01`); im Baustein steht der Wert, wie geschrieben.
4. Die Bildungsregel behält einen vorhandenen Unterstrich.
5. Namen im gespeicherten Ausdruck: Objekte der Anwendung wie im Fachmodell (`Order`, `Konto`), alle Eigenschaften, Parameter von Typen und `ergebnis` in der Kennung (klein), Kennungen von Instanzen, Bedingungen, Berechnungen, Regeln und eigenen Parametern wie vergeben.
6. Ein leerer Ausdruck ist ein Schreibfehler (`unexpected_end`) in der Typprüfung; als Angabe ohne Wert meldet die Prüfung `expression.empty`.
7. Eine Bedingung verlangt einen Wahrheitswert, eine nur prüfende Regel ebenfalls; der Ausdruck einer Berechnung hat keinen vorgeschriebenen Typ.
8. Ein Regelwerk ist ein geschlossener Namensraum bis auf die Objekte der Anwendung, darunter `Strategie` mit den Strategieparametern (Abschnitt 6.2; Festlegung des Softwarearchitekten nach dem Testbericht).
9. Die Befunde aus Abschnitt 9.2 und die Hinweise `rule.unresolved_name`, `flow.no_order_reachable` und `flow.main_without_trigger`.
10. Der Befund `candle.no_instance` wird nur gemeldet, wenn ein Ausdruck die Kerze unter dem Namen des Objekttyps (`Kerze.schluss`) verwendet.
11. Die Auswertung von Ausdrücken fehlt bewusst; die Bedeutung bei der Ausführung (Abschnitt 8) ist nur dokumentiert.
12. Die Liste der Währungscodes ist der Stand der Bibliothek und wird mit neuen Fassungen nachgeführt.
13. Die Namen der Bausteine `and`, `or`, `not` und der Richtungen `up`, `down`, `any` sind Kennungen der Schnittstelle (`pipwerk_domain.expressions.blocks`); die Sprache der Oberfläche entsteht aus der Beschriftung.
