# Gemeinsame Python-Bibliothek `pipwerk_domain` – technische Dokumentation

## Dokumentstatus

- status: `draft`
- stand: 2026-10-24
- komponente: `packages/domain-core` (Paket `pipwerk_domain`, Version `0.1.0`)
- grundlage: Vorhaben `strategiedesign`, Spezifikation (Fassung vom 2026-10-23) Abschnitte 1 bis 3, 6 bis 10, Arbeitspaket `wp02`, Aufträge 04, 09 und 10

## 1. Gegenstand

Die Bibliothek `pipwerk_domain` ist die gemeinsame Python-Bibliothek von pipwerk (E1 der Spezifikation). Sie enthält

- die Typbeschreibungen aller Element- und Objekttypen mit Gruppe, Methoden, Angabe zu „Aktualisieren“, Erklärungen und Händlersprache und das Elementregister,
- das Objektmodell (Strategie, Element, Instanz, Verbindung, Abschnitt, Order- und Positionsverwaltung, Vorlage),
- die Namen und Kennungen und den gemeinsamen Namensraum einer Strategie, in dem Ausdrücke Namen auflösen, und den Namensvorschlag beim Einfügen einer Vorlage,
- die Ausdrücke: Zerlegung, Typprüfung, Funktionen, Normalisierung, gespeicherte Form und Anzeigeform, Bausteine, Zeichen und sichtbare Namen,
- die Verwendung der Instanzen: das Element der ersten Verwendung, die Wege und die Stellen, an denen eine Instanz verwendbar ist,
- die Konsistenzprüfung mit allen Befunden,
- das Entfernen eines Objekts mit der Liste der Elemente, die es verwenden,
- das Lesen und Schreiben der Dokumente im Format 2.0 mit den JSON-Schemata und das Lesen des Formats 1.0.

Die Bibliothek wertet Ausdrücke nicht aus und führt keine Strategie aus. Sie hängt von keinem Framework ab. Pydantic wird nur im Teilpaket `pipwerk_domain.documents` verwendet; das Objektmodell besteht aus einfachen Python-Klassen (`dataclass`) ohne Pydantic. Texte für Befunde erzeugt die Bibliothek nicht (req-ui-007): Sie liefert Kennungen und Angaben, die Oberfläche schreibt die Texte. Eine Ausnahme sind die Anzeigeform und der Satz zu einem Ausdruck (Abschnitt 7.6 und 7.7): Sie sind Darstellungen des Ausdrucks, keine Texte zu Befunden.

## 2. Aufbau des Pakets

Das Paket liegt in `packages/domain-core/`. Quelltext unter `src/pipwerk_domain/`, Tests unter `tests/`. Die Datei `src/pipwerk_domain/py.typed` kennzeichnet das Paket als typisiert, damit mypy die Typen in den Paketen nutzt, die die Bibliothek einbinden (pipwerk Studio bindet sie als editierbare Pfadabhängigkeit ein, siehe `docs/technical/pipwerk-studio.md`, Abschnitt 2.9).

| Datei oder Teilpaket | Inhalt |
| --- | --- |
| `typedesc.py` | Typbeschreibung (`TypeDescription`) mit Parametern, Eigenschaften, Methoden (`MethodDescription`, `ArgumentDescription`), Ausgängen, Gruppe, Angabe zu „Aktualisieren“ und Erklärung; Datentypen mit ihren Wörtern in Händlersprache (`DATATYPE_LABELS`, `datatype_label`), Bindungsarten, Gruppen, Zeiteinheiten |
| `identifiers.py` | Bildungsregel für Kennungen (`identifier_from_name`), Kennung im Ausdruck (`form_key`), Name aus Programmierschreibweise (`name_from_programming_name`) |
| `instruments.py` | Bezeichnung eines festen Instruments: Währungspaar nach ISO 4217, ISIN nach ISO 6166 |
| `registry.py` | Elementregister (`ElementRegistry`, mit `datatype_label` für das Wort eines Datentyps), Einstiegspunkt `pipwerk.element_types` |
| `catalog.py` | mitgelieferte Typen mit Namen, Beschriftungen und Erklärungen in Deutsch und Englisch |
| `defaults.py` | `create_registry()` und `default_registry()`: Register mit den mitgelieferten Typen und den Typen der Einstiegspunkte; `builtin_templates()`: die mitgelieferten Vorlagen |
| `model.py` | Objektmodell: `Strategy`, `Element`, `Connection`, `Section`, `Management`, `Instance`, `Template`, `Binding`, `Origin` und weitere |
| `operations.py` | Vorgänge, die die Bibliothek besitzt: Kennung zu einem Namen (`new_key`), Instanz zu einer Vorlage oder einem Objekttyp mit Namensvorschlag (`insert_instance`), Namen und Kennungen des Namensraums (`namespace_names`, `namespace_keys`), Verwendungen eines Objekts vor dem Entfernen (`uses_of_element`, `uses_of_strategy_parameter`, `uses_of_rule`), Entfernen von Strategieparameter, Element und Regel samt Verwendungen |
| `pointers.py` | JSON Pointer nach RFC 6901 |
| `risk_rule.py` | Regelvorlage „Risiko je Trade“ mit fester UUID |
| `normalize.py` | Normalisierung aller Ausdrücke einer Strategie oder Vorlage (`normalize_strategy`, `normalize_template`) |
| `limits.py` | Begrenzungen gegen Überlast als Konstanten |
| `namespaces.py` | Namensräume: Objekte der Anwendung, Symbole von Parametern, Eigenschaften und Instanzen |
| `expressions/` | Ausdrücke: `lexer.py`, `parser.py`, `nodes.py` (Syntaxbaum), `functions.py` (Funktionsliste), `exprtypes.py` (Typen und Verträglichkeit), `symbols.py` (Symbole und Namensräume), `checker.py` (Typprüfung, erkannte Namen, Normalisierung), `forms.py` (gespeicherte Form und Anzeigeform), `blocks.py` (Bausteine), `sentence.py` (Satz), `tokens.py` (Zeichen mit Art und Stelle), `names.py` (sichtbare Namen), `slots.py` (leerer Platz, Verwendung eines Namens), `rename.py` (Kennungen in Ausdrücken umschreiben) |
| `consistency/` | Konsistenzprüfung: `engine.py` (Prüfung), `describe.py` (Name des Elements und Beschriftung des Felds eines Befunds), `findings.py` (Befunde und ihre Kennungen, erkannte Namen und Ergebnis einer Prüfung mit Namen), `graph.py` (Rückführungen, Erreichbarkeit, Dominanz), `usage.py` (Verwendung der Instanzen: erste Verwendung, Wege, Bericht) |
| `documents/` | Dokumente: `models.py` (Pydantic-Modelle des Formats 2.0), `v1.py` (Pydantic-Modelle des Formats 1.0, nur zum Lesen), `upgrade.py` (Umwandlung von 1.0 nach 2.0), `convert.py` (Übersetzung zwischen Dokument und Objektmodell), `io.py` (Lesen und Schreiben als JSON-Text), `schemas.py` (JSON-Schemata) |

Wichtige Einstiege:

| Aufgabe | Aufruf |
| --- | --- |
| Register mit allen Typen | `pipwerk_domain.defaults.default_registry()` |
| Typbeschreibung abfragen | `registry.get("EMA")`, `registry.list()`, `registry.list(ElementKind.TRIGGER)` |
| Funktionen abfragen | `pipwerk_domain.expressions.list_functions()` |
| Ausdruck prüfen (auch `Objekt.Methode(Argumente)`) | `pipwerk_domain.expressions.analyze(text, umgebung, erwartet)` |
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
| Instanz zu einer Vorlage oder einem Objekttyp mit Namensvorschlag | `pipwerk_domain.operations.insert_instance(ziel, template=…, object_type=…, name=…, language=…)` (Abschnitt 6.3) |
| Verwendung der Instanzen: erste Verwendung, verwendbare Stellen, was ein Element verwendet | `pipwerk_domain.consistency.analyze_usage(strategie)` (Abschnitt 9.5) |
| Welche Elemente ein Objekt verwenden, vor dem Entfernen | `uses_of_element`, `uses_of_strategy_parameter`, `uses_of_rule` in `pipwerk_domain.operations` (Abschnitt 7.9) |
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
| `group` | Gruppe der Elementbibliothek (Spezifikation 3.1, 5.2): `flow` (Ablaufsteuerung), `calculation` (Berechnung), `indicators`, `trends`, `market` (Marktdaten), `account` (Konto), `actions`, `rules`; bei einem Typ, der dort nicht steht, `null`. Die Namen der Gruppen in Deutsch und Englisch liefert die Typbeschreibung nicht; sie stehen in der Oberfläche. „Tick“ gibt es zweimal, als Auslöser `trigger.tick` (Art `trigger`, Gruppe `flow`) und als Objekt `Tick` (Art `application_object`, Gruppe `market`): zwei Typen mit verschiedenen Kennungen und Arten |
| `parameters` | Parameter: `id`, `datatype`, `label`, `explanation`, `required` (Pflicht), `default` (Standardwert), `choices` (zulässige Werte einer Auswahl, je `id` und `label`), `bindings` (erlaubte Bindungsarten), `applies_when` (gilt nur bei einem Wert eines anderen Parameters: `Condition(name, value)`), `object_type` |
| `properties` | Eigenschaften: `id`, `datatype`, `label`, `explanation`, `must` (MUSS, sonst KANN), `set_by_user` (bei Ordertypen: ob der Anwender sie belegt), `default`, `choices`, `applies_when`, `object_type` |
| `methods` | Methoden (`MethodDescription`): `id`, `datatype` (Datentyp des Ergebnisses), `label` und `explanation` der Methode, bei einem Ergebnis, das eine Auswahl oder ein Objekt ist, `choices` und `object_type`, und `arguments` (`ArgumentDescription`: `id`, `datatype`, `label`, `explanation`, `required` (Pflicht, sonst optional), `default` (Standardwert eines optionalen Arguments), `choices`, `object_type`). Die mitgelieferten Typen haben keine Methoden, das Feld ist bei ihnen leer (Abschnitt 4.5) |
| `can_refresh` | ob eine Verwendung einer Instanz dieses Typs „Aktualisieren“ wählen kann (Abschnitt 4.5) |
| `outputs` | Ausgänge eines Elements des Ablaufs: `id`, `label`, `explanation` und `holds_management` (ob an diesem Ausgang die Order- und Positionsverwaltung des Elements hängt) |
| `rules_allowed` | ob dem Element Regeln und Regelwerke zugeordnet werden können |
| `on_canvas` | ob der Typ als Element auf die Zeichenfläche gelegt werden kann |
| `builtin` | mitgeliefert; mitgelieferte Typen und die Regelvorlage „Risiko je Trade“ lassen sich nicht ändern oder löschen (E6) |
| `by_user` | ob der Anwender den Typ wählen kann; `CloseOrder` entsteht nur über „Position schließen“ und ist deshalb nicht wählbar |
| `named` | ob ein Element des Ablaufs einen Namen trägt, unter dem Ausdrücke sein Ergebnis ansprechen (`flow.condition`, `flow.calculation`) |
| `strategy_parameters` | bei Objekten der Anwendung: ob Ausdrücke über dieses Objekt die Strategieparameter ansprechen (`Strategie`) |

Die Felder `group`, `explanation`, `holds_management`, `named`, `strategy_parameters`, `methods` und `can_refresh` sind Daten der Typbeschreibung mit dem Standardwert „nicht gesetzt“ (`null`, leerer Text, leere Liste beziehungsweise `False`); ein über den Einstiegspunkt angemeldeter Typ ohne diese Felder gilt unverändert. Gesetzt sind sie bei den mitgelieferten Typen so: `holds_management` nur beim Ausgang `gestellt` von `flow.place_order`, `named` bei `flow.condition` und `flow.calculation`, `strategy_parameters` beim Objekt `Strategie`. Jeder mitgelieferte Typ, Parameter, jede Eigenschaft und jeder Ausgang hat eine Erklärung in Deutsch und Englisch; weder Namen noch Beschriftungen noch Erklärungen enthalten eine Kennung in Programmierschreibweise (ein Test prüft das). Die Oberfläche braucht die Felder, weil sie keine einzelnen Typen kennt. Ein Feld „Vorgabe der neuen Strategie“ gibt es nicht.

Höchstens ein Ausgang eines Typs hat `holds_management`. `TypeDescription.management_output()` liefert ihn oder `None`. Eine Typbeschreibung mit mehr als einem solchen Ausgang ist ungültig: `ElementRegistry.register` wirft `RegistryError`, ein Einstiegspunkt mit einer solchen Beschreibung meldet nichts an und wird wie jeder fehlerhafte Einstiegspunkt protokolliert (Abschnitt 3.3).

Methoden (Spezifikation 3.1, req-fach-055): Eine Methode gibt es nur an einem Typ, den ein weiteres Paket anmeldet (E7). Sie steht in Ausdrücken als `Objekt.Methode(Argumente)` (Abschnitt 7.1), ihr Ergebnis hat den Datentyp `datatype` der Methode, ihre Argumente den Datentyp und, bei einem optionalen Argument, den Standardwert aus der Beschreibung. Argumente haben eine feste Reihenfolge; die Pflichtargumente stehen vor den optionalen. Ein Ausdruck lässt ein optionales Argument am Ende weg und erhält dafür den Standardwert. Die Kennung einer Methode und die ihrer Argumente folgen der Bildungsregel aus dem deutschen Namen (`wert_vor`); eine Methode darf nicht die Kennung einer Eigenschaft desselben Typs haben, weil die Anzeigeform sonst `Objekt.Name` nicht unterscheiden könnte. `ElementRegistry.register` prüft die Beschreibung der Methoden und löst bei einem Fehler `RegistryError` aus (ein Einstiegspunkt mit einer solchen Beschreibung meldet nichts an, Abschnitt 3.3): Kennung einer Methode oder eines Arguments keine gültige Kennung (`KEY_PATTERN`) oder doppelt (ohne Beachtung von Groß- und Kleinschreibung), Methode gleich einer Eigenschaft, Datentyp `expression` bei einer Methode oder einem Argument, Auswahl ohne Werte oder mit einem Wert doppelt, Pflichtargument nach einem optionalen, Pflichtargument mit Standardwert, optionales Argument ohne Standardwert oder mit einem Standardwert, der nicht zum Datentyp oder zu den Werten der Auswahl passt. Bei einem Argument oder Ergebnis vom Datentyp `time_unit` setzt das Register wie bei Parametern alle Zeiteinheiten als `choices` ein.

Datentypen (`DataType`): `number` (Zahl), `integer` (Ganzzahl), `percent` (Prozent; im Ausdruck ein Anteil, 1 % ist 0,01, ein fester Wert wird als `0.01` gespeichert), `boolean` (Wahrheitswert), `text`, `choice` (Auswahl mit festen Werten und Kennungen), `time_unit` (Zeiteinheit), `timestamp` (Zeitpunkt, ISO 8601), `date` (Datum, ISO 8601), `expression` (Ausdruck) und `object`.

**Wörter der Datentypen** (Spezifikation 3.1, 5.4, Mangel E11): Zu jedem Datentyp liefert die Bibliothek das Wort in Händlersprache in Deutsch und Englisch (`typedesc.DATATYPE_LABELS`): Zahl / number, ganze Zahl / whole number, Prozentwert / percentage, Wahrheitswert / true/false value, Text / text, Auswahl / choice, Zeiteinheit / time unit, Zeitpunkt / point in time, Datum / date, Formel / formula, Objekt / object. Beim Datentyp `object` ist das Wort der Name des Objekttyps („Instrument“, „Konto“, „Position“); `ElementRegistry.datatype_label(datatype, object_type)` liefert es, bei einem Objekttyp, den das Register nicht kennt, das allgemeine Wort „Objekt“. Die Oberfläche schreibt den Datentyp nicht neben die Beschriftung eines Felds, sondern in seine Erklärung beim Zeigen, mit diesen Wörtern; Erklärung, Karte auf der Zeichenfläche und Formeleditor verwenden dieselben. Die Web-API liefert sie in `GET /api/v1/element-types` als `data_types` und als `datatype_label` an jedem Parameter, jeder Eigenschaft, jeder Methode und jedem Argument, in den sichtbaren Namen von `/api/v1/expressions` an jeder Eigenschaft, Methode, jedem Argument und jedem Namen mit Datentyp.

Der Datentyp `object` hat im Feld `object_type` den Objekttyp. Er gilt für Eigenschaften, deren Wert ein Objekt der Anwendung ist (`Order.konto`, `Order.instrument`, `Position.instrument`, `CloseOrder.position`), und für den Parameter `instrument` (Abschnitt 3.2); in Ausdrücken lassen sich ihre Eigenschaften weiter ansprechen (`Order.konto.kapital`). Spezifikation 3.1 nennt ihn „Objekt mit Angabe des Objekttyps“.

Zeiteinheiten (`time_unit`): alle Zeiteinheiten von MetaTrader 5, mit Kennungen nach der Bildungsregel aus ihrem Namen: `m1`, `m2`, `m3`, `m4`, `m5`, `m6`, `m10`, `m12`, `m15`, `m20`, `m30`, `h1`, `h2`, `h3`, `h4`, `h6`, `h8`, `h12`, `d1`, `w1`, `mn1`. Beschriftungen sind `M1` bis `MN1`. Parameter und Eigenschaften vom Datentyp `time_unit` nennen in `choices` alle diese Zeiteinheiten mit Kennung und Beschriftung (`typedesc.TIME_UNITS`). Das Register setzt sie bei der Abfrage ein, wenn die Beschreibung keine eigenen Werte nennt; das gilt auch für Typen, die über den Einstiegspunkt angemeldet sind.

Bindungsarten (`BindingKind`): `fixed` (fester Wert), `parameter` (Strategieparameter oder, innerhalb einer Vorlage, Parameter der Vorlage), `connection` (Datenverbindung: eine Eigenschaft einer Instanz auf der Zeichenfläche), `expression` (Ausdruck), `application` (bei der Anwendung übergeben). Erlaubt sind alle Bindungsarten, mit den Ausnahmen der Tabelle in Spezifikation 3.1: Parameter vom Datentyp `expression` (der Ausdruck einer Bedingung oder Berechnung) lassen nur `expression` zu; der Ordertyp von „Order aufgeben“ und das Berechnungsverfahren des Trends nur `fixed`.

### 3.2 Parameter `instrument` und feste Instrumente

Den Parameter `instrument` (Datentyp `object`, `object_type` `Instrument`) haben die Auslöser `trigger.candle_close` und `trigger.tick`, die Objekte `Instrument`, `Kerze` und `Tick`, jeder Indikator (`Indikator`, `EMA`, `ATR`, `ZigZag`), `Trend` und, als Eigenschaft `instrument`, jeder Ordertyp außer `CloseOrder`. Der festgelegte Wert „Instrument der Anwendung“ hat die Kennung `instrument_der_anwendung` (`typedesc.APPLICATION_INSTRUMENT`); er ist der einzige Eintrag in `choices` und der Standardwert. Der Parameter ist kein Pflichtparameter: Der Anwender muss kein Instrument wählen (`required` nicht gesetzt). Aus diesen Angaben der Typbeschreibung stellt die Oberfläche die Vorbelegung und den Rückweg dar (Spezifikation 5.4, Hinweis 1 der Architekturprüfung): Wer ein anderes Instrument belegt hat, kehrt zur Vorbelegung zurück, indem er den Parameter wieder mit `fixed` und diesem Wert belegt; das ist ein gültiges Dokument ohne Befund.

Belegt werden kann der Parameter mit dem festgelegten Wert, mit einem festen Instrument, mit einem Strategieparameter vom Datentyp `object` und Objekttyp `Instrument`, mit einer Datenverbindung oder mit einem Ausdruck. Ein festes Instrument ist `fixed` mit der Bezeichnung als Text (`instruments.py`):

- ein Währungspaar: zwei Codes nach ISO 4217 hintereinander (`EURUSD`); die Liste der Codes bringt die Bibliothek mit (`CURRENCY_CODES`), jeder Code der Liste ist gültig, auch zweimal derselbe,
- eine ISIN nach ISO 6166: zwölf Zeichen, zwei Buchstaben, neun Buchstaben oder Ziffern, eine Prüfziffer (Luhn-Verfahren über die in Zahlen umgesetzten Zeichen); die ersten beiden Buchstaben werden nicht gegen eine Liste von Ländern geprüft, weil die Norm dort auch andere Codes zulässt (`XS`).

Gespeichert wird die Bezeichnung in Großbuchstaben (`normalize_designation`); die Prüfung (`is_valid_designation`) nimmt auch Kleinbuchstaben an. Jede andere Bezeichnung ist der Befund `instrument.invalid`, an jeder Stelle, an der ein festes Instrument steht: Belegung von Parameter und Eigenschaft, Wert eines Strategieparameters vom Datentyp `object` und ein fester Text, den ein Ausdruck an Stelle eines Instruments verwendet.

`Instrument`, `Kerze` und `Tick` ohne Instanz haben das Instrument des Zusammenhangs (Spezifikation 3.1); die Prüfung meldet dafür keinen Befund.

### 3.3 Elementregister

`ElementRegistry` führt alle Typbeschreibungen: `register(beschreibung)` meldet einen Typ an (eine Kennung nur einmal, höchstens ein Ausgang mit `holds_management` und gültige Methoden, sonst `RegistryError`), `get(kennung)` fragt nach der Kennung, `list(art=None)` liefert die Typen in der Reihenfolge der Anmeldung, optional einer Art.

Bei jeder Abfrage setzt das Register in jeder Beschreibung die Zeiteinheiten als `choices` der Parameter und Eigenschaften vom Datentyp `time_unit` ein (Abschnitt 3.1). Zwei Beschreibungen vervollständigt es außerdem aus anderen Anmeldungen:

- `Trend`: Der Parameter `berechnungsverfahren` hat als Werte die Kennungen aller angemeldeten Typen der Art `trend_method`. Deren Parameter erscheinen zusätzlich beim `Trend`, mit `applies_when` auf den Wert von `berechnungsverfahren` (req-param-005). Mitgeliefert ist `trend_method.expression` (Verfahren „Ausdruck“) ohne eigene Parameter.
- `flow.place_order`: Der Parameter `ordertyp` hat als Werte die Kennungen aller angemeldeten Ordertypen mit `by_user`.

#### Einstiegspunkt `pipwerk.element_types`

Weitere Pakete melden Typen über den Einstiegspunkt `pipwerk.element_types` an (E7). Der Einstiegspunkt verweist auf

- eine `TypeDescription`, oder
- eine Folge von Typbeschreibungen, oder
- eine Funktion, die ein Objekt mit der Methode `register(beschreibung)` erhält und dort anmeldet.

`ElementRegistry.load_entry_points()` lädt alle Einstiegspunkte der Gruppe, `create_registry()` ruft sie auf. Ein fehlerhafter Einstiegspunkt (Ladefehler, Ausnahme beim Anmelden, `SystemExit` beim Laden, falscher Rückgabetyp, doppelte Kennung, Typbeschreibung mit mehr als einem Ausgang mit der Order- und Positionsverwaltung oder mit fehlerhaften Methoden) verhindert das Laden der übrigen nicht. Die Einstiegspunkte werden für jedes installierte Paket einzeln gelesen (`importlib.metadata.distributions()`, je Paket in einem eigenen Schutz). Fehlerhafte Metadaten eines Pakets (zum Beispiel eine Zeile ohne `=` in `entry_points.txt`, auch in einer anderen Gruppe, oder unlesbare Metadaten) schließen nur dieses Paket aus; die gültigen Einstiegspunkte aller anderen Pakete werden geladen, und die mitgelieferten Typen sind immer vorhanden. Das ausgeschlossene Paket erscheint in einer Warnung nur mit seinem Namen und der Klasse der Ausnahme. Ein fehlerhafter Einstiegspunkt meldet nichts an – auch nichts von dem, was er vor dem Fehler angemeldet hätte – und wird mit dem Namen des Einstiegspunkts und der Klasse der Ausnahme protokolliert (Logger `pipwerk_domain.registry`, Stufe `WARNING`), ohne Ausnahmetext, ohne Rückverfolgung und ohne Pfad. Der Rückgabewert `LoadReport` nennt die geladenen und die fehlgeschlagenen Einstiegspunkte. Zum Testen lässt sich eine Liste nachgebildeter Einstiegspunkte (Objekte mit `name` und `load()`) übergeben.

## 4. Mitgelieferte Typen und Kennungen

Die mitgelieferten Typen stehen nur in der Bibliothek (`catalog.py`), nicht im Backend und nicht in der Oberfläche (E2, E6). Jeder Typ, jeder Parameter, jede Eigenschaft, jeder Ausgang und jeder Wert einer Auswahl hat Beschriftungen in Deutsch und Englisch, Typen, Parameter, Eigenschaften und Ausgänge dazu eine Erklärung. Die folgende Liste nennt alle Kennungen; ein Test vergleicht sie mit dem Code.

### 4.1 Auslöser und Elemente des Ablaufs

Alle Parameter lassen die fünf Bindungsarten zu, außer wo „nur …“ steht. Gruppe der Auslöser und von `flow.condition` ist `flow`, von `flow.calculation` `calculation`, der übrigen Elemente des Ablaufs `actions`. „Parameter setzen“ (`flow.set_parameter`) gibt es nicht mehr (req-fach-047): Strategieparameter ändern sich im Ablauf nicht. Ein Dokument mit diesem Elementtyp bleibt gültig; der Typ ist unbekannt (`type.unknown`, Abschnitt 10).

| Kennung | Name (de) | Parameter | Eigenschaften | Ausgänge | Regeln |
| --- | --- | --- | --- | --- | --- |
| `trigger.candle_close` | Kerzenschluss | `instrument` (Standard `instrument_der_anwendung`), `zeiteinheit` (Zeiteinheit, Pflicht) | – | `weiter` | nein |
| `trigger.tick` | Tick | `instrument` | – | `weiter` | nein |
| `trigger.manual` | Manuell | – | – | `weiter` | nein |
| `flow.condition` | Bedingung | `ausdruck` (Ausdruck, Pflicht, nur `expression`) | `ergebnis` (Wahrheitswert) | `wahr`, `falsch` | nein |
| `flow.calculation` | Berechnung | `ausdruck` (Ausdruck, Pflicht, nur `expression`) | `ergebnis` (Datentyp `expression`: ergibt sich aus dem Ausdruck) | `weiter` | nein |
| `flow.place_order` | Order aufgeben | `ordertyp` (Auswahl, Pflicht, nur `fixed`; Werte `MarketOrder`, `StopOrder`, `LimitOrder`, `StopLimitOrder`) | die Eigenschaften des gewählten Ordertyps | `gestellt`, `nicht_gestellt` | ja |
| `flow.modify_order` | Order ändern | `preis`, `limitpreis`, `stop_loss`, `take_profit` (Zahl), `gueltigkeit` (Auswahl), `ablaufzeit` (Zeitpunkt, gilt bei `gueltigkeit` = `bis_zeitpunkt`), `datum` (Datum, gilt bei `gueltigkeit` = `bis_ende_eines_tages`); alle optional, ohne Wert bleibt die Angabe unverändert | – | `geaendert`, `nicht_geaendert` | ja |
| `flow.delete_order` | Order löschen | – | – | `weiter` | nein |
| `flow.modify_position` | Position ändern | `stop_loss`, `take_profit` (Zahl, optional) | – | `geaendert`, `nicht_geaendert` | ja |
| `flow.close_position` | Position schließen | `volumen` (Zahl, optional; ohne Wert wird ganz geschlossen) | – | `weiter` | ja |

Auf die Zeichenfläche lassen sich alle diese Typen legen (`on_canvas`). `flow.modify_order`, `flow.delete_order`, `flow.modify_position` und `flow.close_position` stehen nur in einer Order- und Positionsverwaltung (Abschnitt 8). `trigger.manual` („Manuell“, vorher „Start von Hand“ mit der Kennung `trigger.manual_start`) hat keine Parameter, steht nur im Hauptablauf und ist ein Auslöser wie die übrigen (jede Auswertung beginnt an einem Auslöser). Ein Dokument mit der bisherigen Kennung `trigger.manual_start` liest die Bibliothek als `trigger.manual` (Abschnitt 10; `catalog.current_type_id`, `catalog.FORMER_TYPE_IDS`); die bisherige Kennung ist kein angemeldeter Typ. Ein Auslöser `Manuell` in der Order- und Positionsverwaltung ist der Fehler `trigger.manual_in_management` (Abschnitt 9.1).

Bedingung und Berechnung tragen zusätzlich einen Namen (Feld `name` des Elements) und eine Kennung im Ausdruck (Feld `key`), unter der Ausdrücke ihr Ergebnis ansprechen (`einstieg.ergebnis`). Die Kennung bildet die Bibliothek beim Anlegen (Abschnitt 6.1).

### 4.2 Ordertypen

Die Eigenschaften der Order kommen aus den Ordertypen. `Order` in einer Regel kennt die Eigenschaften aller Ordertypen, in der Order- und Positionsverwaltung nur die des Ordertyps der zugehörigen „Order aufgeben“ (Abschnitt 6).

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

Gruppe `market` haben `Instrument`, `Kerze` und `Tick`, Gruppe `account` hat `Konto`; `Order`, `Position` und `Strategie` stehen nicht in der Elementbibliothek.

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

Alle Indikatoren, `Trend` und die Objekte oben haben den Parameter `instrument` (Abschnitt 3.2). Die Gruppe ist `indicators`, bei `Trend` `trends`, bei `Regel` und `Regelwerk` `rules`. Der Indikator `Markttechnik` (1-2-3-Trend) ist zurückgestellt (req-fach-054) und wird nicht mitgeliefert; ein Dokument mit diesem Objekttyp bleibt gültig, der Typ ist unbekannt (`type.unknown`).

| Kennung | Name (de) | Kategorie | Parameter (Standardwert) | Eigenschaften |
| --- | --- | --- | --- | --- |
| `EMA` | EMA | `indicator` | `instrument`, `zeiteinheit` (Pflicht), `periode` (Ganzzahl, Pflicht), `verschiebung` (Ganzzahl, 0), `anwenden_auf` (Auswahl, `schlusskurs`; Werte `schlusskurs`, `eroeffnungskurs`, `hoch`, `tief`, `medianpreis`, `typischer_preis`, `gewichteter_schlusskurs`) | `wert` |
| `ATR` | ATR | `indicator` | `instrument`, `zeiteinheit` (Pflicht), `periode` (Ganzzahl, Pflicht) | `wert` |
| `ZigZag` | ZigZag | `indicator` | `instrument`, `zeiteinheit` (Pflicht), `depth` (12), `deviation` (5), `backstep` (3) | `letztes_hoch`, `vorletztes_hoch`, `letztes_tief`, `vorletztes_tief` (Zahl): Kurs des letzten beziehungsweise vorletzten endgültigen Hochs oder Tiefs (req-fach-054); dazu die drei jüngsten Wendepunkte, endgültig oder nicht, `wendepunkt_1` ist der jüngste: `wendepunkt_1_kurs`, `wendepunkt_2_kurs`, `wendepunkt_3_kurs` (Zahl), `wendepunkt_1_art`, `wendepunkt_2_art`, `wendepunkt_3_art` (Auswahl `hoch`, `tief`), `wendepunkt_1_endgueltig`, `wendepunkt_2_endgueltig`, `wendepunkt_3_endgueltig` (Wahrheitswert); alle KANN (fehlt ein Hoch, Tief oder Wendepunkt, sind sie „leer“) |
| `Indikator` | eigener Indikator | `indicator` | `instrument`, `zeiteinheit` (Pflicht) und eigene Parameter der Vorlage | eigene Eigenschaften der Vorlage |
| `Trend` | eigener Trend | `trend` | `instrument`, `zeiteinheit` (Pflicht), `berechnungsverfahren` (Auswahl, Standardwert `trend_method.expression`, nur `fixed`) | `richtung` (Text) und eigene Eigenschaften |
| `Regel` | eigene Regel | `rule` | eigene Parameter der Vorlage | – |
| `Regelwerk` | eigenes Regelwerk | `ruleset` | – | – |

Berechnungsverfahren des Trends: `trend_method.expression` (Ausdruck). Die Eigenschaften der Indikatoren beschreiben nur Parameter und Eigenschaften, ohne Berechnung (Spezifikation Abschnitt 1). Die Regelvorlage „Risiko je Trade“ hat die Namen „Risiko je Trade“ und „Risk per trade“ (Abschnitt 5.1).

### 4.5 Methoden und „Aktualisieren“

Die mitgelieferten Typen haben vorerst keine Methoden: Das Feld `methods` ist bei allen leer (ein Test prüft es für jeden Typ). Den Wert vor einer Anzahl Kerzen liefert die Funktion `PREVIOUS` mit der Anzahl zurückliegender Werte (`PREVIOUS(ema20.wert; 3)`, Abschnitt 7.2). Methoden bleiben für Typen, die ein weiteres Paket anmeldet (E7); Bibliothek und Web-API behandeln sie nach den Abschnitten 3.1, 5, 7 und 10. Die Tests melden dazu die Typen aus `tests/methods_support.py` im Elementregister an.

Das Feld `can_refresh` ist wahr für `EMA`, `ATR`, `ZigZag`, `Indikator`, `Trend` und die Objekte der Anwendung, die auf der Zeichenfläche liegen können: `Konto`, `Instrument`, `Kerze` und das Objekt `Tick` (nicht der Auslöser `trigger.tick`); für alle anderen Typen ist es falsch. `Indikator` und `Trend` sind die Objekttypen eigener Vorlagen: Eine eigene Vorlage hat die Angabe ihres Objekttyps (`Template.object_type`, `Instance.object_type`, `object_type` des Dokuments) und übernimmt „Aktualisieren“ von ihm: `ElementRegistry.can_refresh(objekttyp)` liefert die Angabe für einen Typ, für den Objekttyp einer Vorlage oder Instanz also die ihres Objekttyps, für einen unbekannten Typ falsch. Die Web-API liefert dafür kein eigenes Feld; die Oberfläche liest `can_refresh` an der Typbeschreibung des Objekttyps. „Aktualisieren“ bei einer Instanz, deren Typ es nicht vorsieht, ist der Fehler `input.refresh_not_allowed` (Abschnitt 9.1).

## 5. Objektmodell

Das Objektmodell besteht aus `dataclass`-Klassen in `model.py` und kennt weder Pydantic noch ein anderes Framework. Alle Klassen lassen sich vergleichen (`==`); der Vergleich ist die Grundlage der Aussage „Schreiben und erneutes Lesen ergeben dasselbe Objekt“.

| Klasse | Inhalt |
| --- | --- |
| `Strategy` | `id` (UUID als Text), `name`, `description`, `parameters` (`StrategyParameter`), `rules` (Regeln und Regelwerke der Strategie als Instanzen in festgelegter Reihenfolge), `elements`, `connections`, `sections`, `orientation`, `collapsed_managements`; Methoden `element(id)`, `main_elements()`, `management(id)`, `managements()` |
| `StrategyParameter` | `key` (Kennung im Ausdruck), `name`, `datatype`, bei `object` `object_type`, `value` oder `at_application` (bei der Anwendung), `choices` |
| `Element` | `id`, `type` (Elementtyp als Text), `name` (nur bei einem Element ohne Instanz), `key` (nur Bedingung und Berechnung), `position` (`Position` mit `x` und `y` oder `None`: nur gesetzt, wenn der Anwender das Element verschoben hat), `parameters` und `properties` (je Kennung ein `Binding`), `inputs` (`ElementInput`: Kennung der Instanz, Kennung der Eigenschaft oder der Methode in `property`, `kind` = `InputKind.PROPERTY` oder `InputKind.METHOD`, bei einer Methode die festen Werte der Argumente in `arguments` und die Angabe „Aktualisieren“ in `refresh`), `rules` (zugeordnete Regeln und Regelwerke), `management_of` (Kennung des Elements „Order aufgeben“, zu dessen Order- und Positionsverwaltung es gehört, leer im Hauptablauf), `instance` (die Instanz bei einem Element, das ein Objekt zeigt); `shown_name` ist der Name, den der Anwender sieht (bei einem Objekt der Name der Instanz) |
| `Connection` | `id` (UUID), `source` (Element), `output` (Ausgang), `target` (Element); eine Verbindung darf zurückführen |
| `Section` | Abschnitt: `id`, `name`, `flow` (Kennung des Elements „Order aufgeben“, zu dessen Order- und Positionsverwaltung er gehört, `None` im Hauptablauf), `elements` (Kennungen), `collapsed` |
| `Management` | die Order- und Positionsverwaltung: `order_element` und `elements`. Sie ist kein gespeichertes Feld, sondern ergibt sich aus `Element.management_of`; sie hängt am Ausgang `gestellt` von „Order aufgeben“ und kann wieder ein „Order aufgeben“ mit eigener Order- und Positionsverwaltung enthalten |
| `Binding` | Belegung mit Bindungsart: `kind` und `value` (bei `fixed` der Wert, bei `parameter` die Kennung des Parameters, bei `connection` eine `DataLink` mit Kennung der Instanz und der Eigenschaft, bei `expression` der Ausdruck, bei `application` kein Wert) |
| `Instance` | Kopie einer Vorlage oder eines Objekttyps (E4): `name`, `key`, `origin` (`Origin`: Objekttyp, Kennung der Vorlage, bei einer eigenen Vorlage ihr Name zum Zeitpunkt des Einfügens; bei einem eingefügten Objekttyp oder einer mitgelieferten Vorlage nur Objekttyp und Kennung), `first_use` (UUID des Elements, mit dem der Anwender die Instanz zuerst verbunden hat, oder `None`; Spezifikation 3.3 — die Oberfläche trägt es beim ersten Verbinden ein, die Bibliothek speichert und liest es und ermittelt das Element der ersten Verwendung, wenn es fehlt, Abschnitt 9.5) und der gesamte Inhalt (`ObjectContent`) |
| `Template` | Vorlage: `id`, `name`, `description` und der Inhalt (`ObjectContent`) |
| `ObjectContent` | `object_type`, `parameter_values` (Parameterwerte der Instanz beziehungsweise Standardwerte der Vorlage), `parameters` (eigene Parameter: `key`, `name`, Datentyp, Pflicht, Standardwert, Auswahlwerte), `properties` (eigene Eigenschaften: `key`, `name`, Datentyp, Ausdruck), `instances` (enthaltene Instanzen von Indikatoren), `rules` (enthaltene Regeln und Regelwerke), `expression`, `determined_property`, `comparison` (`hoechstens`, `mindestens`, `gleich`) und `result_expression` |

Der Inhalt je Objekttyp (Spezifikation 3.3):

| Objekttyp | verwendete Felder |
| --- | --- |
| mitgelieferter Indikator (`EMA`, `ATR`, `ZigZag`) | nur `parameter_values` |
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

Eindeutigkeit (Spezifikation 3.3): Eine Strategie hat einen gemeinsamen Namensraum (Abschnitt 6.2). Namen von Instanzen, Regeln, Bedingungen und Berechnungen müssen darin eindeutig sein, auch gegen die Namen der Objekte der Anwendung in beiden Sprachen, weil die Anzeigeform sie sonst nicht unterscheiden kann. Strategieparameter sind davon ausgenommen, weil sie in der Anzeigeform immer hinter `Strategie.` stehen. Die Prüfung vergleicht ohne Beachtung von Groß- und Kleinschreibung (und von überzähligem Leerraum), sowohl die Namen als auch die Kennungen (`name.duplicate`, Abschnitt 9). Eine neue Instanz erhält den Namen ihres Typs beziehungsweise ihrer Vorlage mit angehängter Zahl, wo nötig („Kerze 2“); das tut `insert_instance` (Abschnitt 6.3).

### 6.2 Namensräume

Eine Strategie hat einen gemeinsamen Namensraum (Spezifikation 3.3, Festlegung des Auftraggebers vom 2026-10-23 zu N3 aus `requirements-14.md`). Ein Name verdeckt keinen anderen: Wer einen Namen doppelt vergibt, erhält den Fehler `name.duplicate`; ein Ausdruck findet den ersten der beiden. Den äußersten Namensraum bilden die Objekte der Anwendung (`Konto`, `Instrument`, `Kerze`, `Tick`, `Order`, `Position`, `Strategie`); `Strategie.name` spricht einen Strategieparameter an. Die Namen werden ohne Beachtung von Groß- und Kleinschreibung aufgelöst.

Zum Namensraum der Strategie gehören:

- alle Instanzen der Elemente, auch in Order- und Positionsverwaltungen, und alle Instanzen und Regeln, die sie enthalten, in jeder Tiefe (die Indikatoren eines Trends, die Regeln eines Regelwerks, die Regeln einer eigenen Vorlage),
- die Regeln und Regelwerke der Strategie und die der Elemente, mit allen Regeln, die ein Regelwerk enthält,
- die Kennungen der Bedingungen und Berechnungen (`kennung.ergebnis`).

Jeder dieser Namen ist überall in der Strategie mit seiner Kennung ansprechbar, auch eine enthaltene Instanz oder eine Regel in einem Regelwerk (`ema20.wert`, `regel.ergebnis`); die mehrstufige Schreibweise über das umgebende Objekt bleibt gültig (`trend_h1.ema20.wert`). Die Liste der sichtbaren Namen (Abschnitt 7.8) zeigt eine enthaltene Instanz oder Regel bei dem Objekt, das sie enthält, nicht noch einmal daneben (`Symbol.listed`). Strategieparameter stehen immer hinter `Strategie.` und bilden einen eigenen Namensraum. Parameter einer Regel und eigene Parameter einer Vorlage stehen ohne Punkt; ihr Name und ihre Kennung dürfen mit keinem Namen und keiner Kennung des Namensraums übereinstimmen, sonst wäre ein Name ohne Punkt mehrdeutig (`name.duplicate` mit `with_parameter`).

Was ein Ausdruck sieht, hängt von seinem Ort ab:

| Ausdruck von | sichtbar |
| --- | --- |
| Element, Bedingung, Berechnung, Regel der Strategie, Regel eines Elements | die Parameter der Regel (ohne Punkt), der gemeinsame Namensraum der Strategie, die Objekte der Anwendung; in einer Order- und Positionsverwaltung hat `Order` die Eigenschaften des Ordertyps. Welche Instanzen an einem Element verwendbar sind, steht in Abschnitt 9.5 |
| Regel, Eigenschaft, Richtung, Gesamtergebnis in einer Instanz oder Vorlage `Indikator`, `Trend` oder `Regelwerk` | nur der eigene Inhalt (die eigenen Parameter, die enthaltenen Instanzen und Regeln, beim Regelwerk seine Regeln), die Parameter der Regel und die Objekte der Anwendung, darunter `Strategie` mit den Strategieparametern. Ein Name der übrigen Strategie ist dort ein unbekannter Name, denn die Instanz lässt sich als Vorlage speichern und in andere Strategien einfügen (Spezifikation 3.3) |
| Regelvorlage (`Regel` als Vorlage) | Parameter der Regel, dann Objekte der Anwendung; ein unbekannter Name ist ein Hinweis (Abschnitt 9) |

Eine Regel in einem Regelwerk ist überall mit ihrer Kennung ansprechbar (`regel.ergebnis`), auch über das Regelwerk (`regelwerk.regel.ergebnis`); das Gesamtergebnis des Regelwerks ist `regelwerk.ergebnis`. Ein Eingang (`Element.inputs`) ändert den Namensraum nicht: Die Ausdrücke des Elements sprechen die Eigenschaft unter dem Namen der Instanz an.

Folgerungen aus den Festlegungen:

- Haben eine Regel eines Elements und eine Regel der Strategie, zwei Regeln verschiedener Elemente, eine Regel und eine Instanz oder eine Instanz in einem Trend und eine Instanz der Strategie denselben Namen, ist das der Fehler `name.duplicate` (`namespace` = `strategy`). Dieselbe Vorlage an der Strategie und an einem Element ergibt zwei Instanzen mit zwei Namen und ist kein Fehler.
- „Name doppelt vergeben“ (Abschnitt 9) gilt für den gemeinsamen Namensraum, unter den Strategieparametern, unter den eigenen Parametern einer Regel, im Namensraum einer Vorlage (Parameter, Instanzen, Regeln, in jeder Tiefe) und für den Parameter einer Regel oder Vorlage gegen die Namen des Namensraums.
- Strategieparameter sind nur als `Strategie.name` ansprechbar und kollidieren deshalb nicht mit Instanzen.
- `Strategie` ist ein Objekt der Anwendung, auch in Indikator, Trend und Regelwerk. Die Strategieparameter unter `Strategie.<kennung>` sind dort ansprechbar. Eine Vorlage, für sich geprüft, kennt die Strategieparameter nicht; ein unbekannter Strategieparameter ist dort ein Hinweis `rule.unresolved_name` (bei Vorlagen `Regel`, `Regelwerk`, `Indikator` und `Trend` gleich). Eine Instanz innerhalb einer Strategie, auch in einem Regelwerk der Strategie, wird gegen die Strategieparameter dieser Strategie geprüft; ein unbekannter ist dort ein Fehler `expression.invalid`.
- Ein Eingang und eine Datenverbindung nennen eine Instanz auf der Zeichenfläche (Spezifikation 3.1). Eine enthaltene Instanz ist keine solche Instanz: Die Prüfung meldet `data.unknown` (`unknown_instance`), obwohl ihre Kennung im Ausdruck ansprechbar ist.

### 6.3 Einfügen einer Vorlage

`pipwerk_domain.operations.insert_instance(ziel, template=…, object_type=…, name=…, language=…)` macht die vollständige Instanz (Kopie, E4) zu einer Vorlage oder zu einem Objekttyp für eine Strategie oder Vorlage (`ziel`) und ändert `ziel` nicht; die Instanz setzt der Aufrufer dorthin, wo sie hingehört. Die Funktion ersetzt die Rechenarbeit der Oberfläche (E2); die Web-API stellt sie als `POST /api/v1/insert` bereit.

- Name der Instanz: `name`, sonst der Name der Vorlage beziehungsweise des Objekttyps in der Sprache `language`; ist er im Namensraum von `ziel` vergeben (Vergleich wie bei `name.duplicate`, auch gegen die Namen der Objekte der Anwendung in beiden Sprachen), hängt die Funktion eine Zahl an: „Kerze 2“. Die Kennung bildet `form_key` aus dem Namen (Abschnitt 6.1); sie ist gegen alle Kennungen des Namensraums, die Kennungen der Objekte der Anwendung und die Namen der Funktionen eindeutig.
- Enthaltene Instanzen und Regeln: Jede erhält den Namen „<Name der umgebenden Instanz> <bisheriger Name>“ (bei einer tieferen Ebene die umgebende Instanz, nicht die oberste), mit angehängter Zahl, wo er vergeben ist, und die Kennung aus dem neuen Namen. Ein Name, der länger würde als `MAX_NAME_LENGTH`, wird gekürzt.
- Ausdrücke: Die Ausdrücke im Inhalt der Instanz schreibt die Funktion auf die neuen Kennungen um: die Eigenschaften der Instanz, das Gesamtergebnis eines Regelwerks, der Ausdruck einer Regel in ihrer Liste, die Belegungen mit Ausdruck der enthaltenen Instanzen (diese stehen außerhalb der enthaltenen Instanz, in der Liste der umgebenden). Umgeschrieben wird der erste Teil eines Namens, der genau eine alte Kennung ist (`rename.py`); Texte, Zahlen, Funktionen, Teile hinter einem Punkt und längere Namen bleiben. Eigene Parameter behalten ihre Kennung, denn sie stehen im Inhalt der Instanz für sich.
- Herkunft: `Origin` mit dem Objekttyp, der Kennung der Vorlage und, bei einer eigenen Vorlage, ihrem Namen zum Zeitpunkt des Einfügens; bei einer mitgelieferten Vorlage (`builtin_templates()`) und bei einem Objekttyp ohne Vorlage fehlt der Name. `first_use` ist leer.
- Fehler: Weder Vorlage noch bekannter Objekttyp ergibt `InsertionError`.
- `namespace_names(wert)` und `namespace_keys(wert)` liefern die Namen und Kennungen des Namensraums einer Strategie oder Vorlage, einschließlich der Namen und Kennungen eigener Parameter.

## 7. Ausdrücke

Ausdrücke folgen einer Auswahl aus OpenFormula (Spezifikation 3.4). Der Parser ist ein eigener, von Hand geschriebener Parser ohne `eval` und ohne Parsergenerator; er arbeitet ohne Rekursion, sodass auch tief geschachtelte Eingaben den Stapel von Python nicht erschöpfen. Es wird nichts ausgewertet.

### 7.1 Schreibweise

- Zahlen mit Dezimalpunkt, nur mit den ASCII-Ziffern `0` bis `9` (`3.14`); Namen der gespeicherten Form nur mit ASCII-Buchstaben, ASCII-Ziffern und `_`. Andere Zeichen sind ein Schreibfehler (`invalid_character`, bei Ziffern hinter einer Zahl `invalid_number`), in der Anzeigeform stehen Namen mit anderen Zeichen in eckigen Klammern (Abschnitt 7.6). Texte in doppelten Anführungszeichen (ein doppeltes Anführungszeichen im Text wird verdoppelt: `"a""b"`), `TRUE()` und `FALSE()`, das Prozentzeichen unmittelbar nach einer Zahl (`1%` ist `0.01`).
- Operatoren: `+ - * / ^ &`, Vergleiche `= <> < <= > >=`, Vorzeichen und Klammern. Die logischen Operatoren sind die Funktionen `AND`, `OR`, `NOT`.
- Rangfolge von niedrig nach hoch: Vergleich, `&`, `+ -`, `* /`, `^`, Vorzeichen. Wie in OpenFormula bindet das Vorzeichen stärker als `^`, `-2^2` ist also 4. Alle binären Operatoren gruppieren von links.
- Argumente einer Funktion trennt `;`. Zwischen den Teilen darf Leerraum einschließlich Zeilenumbrüchen stehen.
- Namen: `Objekt.Eigenschaft`, bei enthaltenen Objekten mehrstufig. Groß- und Kleinschreibung von Namen und Funktionen wird nicht unterschieden. Gespeichert wird die Schreibweise der Kennung (Abschnitt 7.4).
- Methoden: `Objekt.Methode(Argumente)`, die Argumente getrennt mit `;` (`reihe.wert_vor(3; "eroeffnung")`), in der gespeicherten Form und in der Anzeigeform, in beiden Sprachen; in der Anzeigeform mit eckigen Klammern, wo ein Name kein einfacher Name ist (`[Reihe A].[Wert vor](3)`). Ein Name aus mehreren Teilen, der unmittelbar vor `(` steht, ist eine Methode, ein einzelner Name vor `(` eine Funktion (`MIN(…)`); eine Methode darf wie eine Funktion heißen, `a.min(1)` ist die Methode `min` von `a`. Die Argumente sind Ausdrücke, auch Methoden. Eine Methode ohne Klammern ist ein Befund, ebenso eine Eigenschaft mit Klammern (Abschnitt 7.3). Der Syntaxbaum hat dafür den Knoten `MethodCall` (`owner`: die Teile des Namens vor der Methode, `method`, `args`, `arg_separators`); `start` ist das erste Zeichen des Namens, `end` die Stelle hinter der schließenden Klammer.
- Festgelegte Werte einer Auswahl stehen als Text mit ihrer Kennung: `zigzag.wendepunkt_1_art = "hoch"`.
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
| `PREVIOUS` | Name eines Werts mit früherem Wert oder Ergebnis einer Methode eines Objekts mit Zeiteinheit, optional Anzahl (ganze Zahl ab 1) | Typ des Namens beziehungsweise der Methode |
| `TRUE`, `FALSE` | keine | Wahrheitswert |

`PREVIOUS` ist die eigene Funktion für frühere Werte (req-fach-014); deutsche Funktionsnamen (`VORHER`) sind offen und werden nicht angeboten. Das erste Argument ist ein Name, für den das Fachmodell einen früheren Wert festlegt (Spezifikation 3.4): eine Eigenschaft oder das Ergebnis einer Methode eines Objekts mit Zeiteinheit (Indikator, Trend, `Kerze`, auch ohne Instanz), eine Eigenschaft von `Tick` oder das Ergebnis einer Bedingung oder Berechnung (`PREVIOUS(reihe.wert_vor(3))`; die Methoden von `Tick` und anderer Objekte ohne Zeiteinheit haben keinen früheren Wert). Jedes andere Argument ist ein Fehler (`expression.invalid` mit `issue` = `previous_argument`; `reason` = `not_a_name` oder `no_earlier_value`).

### 7.3 Typprüfung und Befunde im Ausdruck

Die Typprüfung kennt die Datentypen aus Abschnitt 3.1. Zahl, Ganzzahl und Prozent sind untereinander verträglich. Text, Auswahl und Zeiteinheit lassen sich als Text vergleichen; ein fester Text, der mit einer Auswahl verglichen oder einer Eigenschaft einer Auswahl zugewiesen wird, muss einer ihrer Werte sein (auch alle festen Texte eines `IF`). Ein Text, der erst bei der Ausführung entsteht, wird dort geprüft. Ein fester Text an der Stelle eines Instruments muss eine gültige Bezeichnung sein (Abschnitt 3.2). Ein unbekannter Typ (nach einem Fehler) ist mit allem verträglich, damit ein Fehler keine Folgefehler erzeugt.

`analyze(text, umgebung, erwartet)` liefert eine `Analysis` mit

- `issues`: die Befunde des Ausdrucks, je mit `kind`, `start`, `end`, `reason` und `details`,
- `names`: die erkannten Namen mit `start`, `end`, der Kennung (`identifier`, Teile mit Kennung und Stelle in `segments`) und, ob der ganze Name erkannt wurde (`resolved`); das braucht der Endpunkt `/api/v1/check`. Bei einer Methode ist die Methode der letzte Teil des Namens (`reihe_a.wert_vor`); der Name reicht bis zum Ende des Methodennamens, die Argumente sind eigene Ausdrücke mit eigenen Namen,
- `functions`: die erkannten Funktionen mit Stelle,
- `slots`: die Stellen der leeren Plätze,
- `result_type`: der Ergebnistyp, `tree`: der Syntaxbaum, `normalized`: die normalisierte Schreibweise.

| `kind` | Bedeutung | `reason` | Angaben |
| --- | --- | --- | --- |
| `syntax` | Schreibfehler | `unexpected_end`, `unexpected_token`, `invalid_character`, `invalid_number`, `unterminated_string`, `too_long`, `too_deep` | `found`, bei Grenzen `length`/`maximum` |
| `unknown_function` | unbekannte Funktion (Stelle des Funktionsnamens) | – | `name` |
| `unknown_name` | unbekannter Name (Stelle des ersten Namensteils) | – | `name` |
| `unknown_property` | unbekannte Eigenschaft (Stelle des Namensteils) | – | `object`, `property` |
| `unknown_method` | unbekannte Methode (Stelle des Namensteils der Methode); der Objektteil des Namens ist ein unbekannter Name oder eine unbekannte Eigenschaft | `unknown` (das Objekt hat keine solche Methode), `not_a_method` (der Name ist eine Eigenschaft) | `object`, `method` |
| `type_mismatch` | unpassender Typ | `operand`, `comparison`, `ordering`, `argument`, `branches`, `result`, `object_not_value`, `method_argument` (Stelle des Arguments einer Methode) | `expected`, `found`, `operator`, `function`, `index`, `left`, `right`, `name`, bei `method_argument` `object`, `method`, `argument` (Kennung des Arguments), `index` (Stelle in der Liste, ab 0) |
| `unknown_choice_value` | unbekannter Wert einer Auswahl (Stelle des Textes selbst, auch in den Wertzweigen von `IF` und `IFNA` und in Klammern; je unbekanntem Text ein Befund), auch als Argument einer Methode, dessen Datentyp eine Auswahl oder Zeiteinheit ist | `comparison`, `result`, `method_argument` | `values`, `allowed` |
| `argument_count` | falsche Zahl von Argumenten einer Funktion oder Methode (Stelle des ganzen Aufrufs) und eine Methode ohne Klammern | bei einer Methode ohne Klammern `call_missing`, sonst leer | `function` oder bei einer Methode `object`, `method`; `minimum`, `maximum`, `found` (bei `call_missing` ohne `found`) |
| `previous_argument` | `PREVIOUS` mit einem Argument, für das kein früherer Wert festgelegt ist | `not_a_name`, `no_earlier_value` | `function`, `name` |
| `invalid_instrument` | fester Text an der Stelle eines Instruments ist keine gültige Bezeichnung (Befund `instrument.invalid`, nicht `expression.invalid`) | – | `values` |

Typprüfung einer Methode (`Objekt.Methode(Argumente)`, Spezifikation 3.4): Die Prüfung sucht das Objekt und die Methode wie einen Namen (Methoden sind Mitglieder des Objekts neben den Eigenschaften, `Symbol` mit der Art `method` und den Argumenten in `arguments`), prüft die Zahl der Argumente gegen die Zahl der Pflichtargumente und aller Argumente und jedes Argument gegen seinen Datentyp (Zahl, Ganzzahl und Prozent untereinander verträglich; eine feste Zahl, wo eine Ganzzahl steht, muss ganz sein und darf kein Prozentwert sein; feste Texte gegen die Werte einer Auswahl und der Zeiteinheiten, in der Anzeigeform auch gegen die Namen der Werte). Ein leerer Platz als Argument bleibt ein leerer Platz und ist kein weiterer Befund. Das Ergebnis hat den Datentyp der Methode (bei einer Auswahl mit ihren Werten); fehlt ein optionales Argument, gilt sein Standardwert. Ein Ausdruck lässt nur Argumente am Ende weg.

Die Umgebung (`Environment`) löst den ersten Teil eines Namens auf; `Scope` ist ihre Umsetzung als Namensraum mit äußerem Namensraum. Die Konsistenzprüfung baut die Namensräume nach Abschnitt 6 auf.

### 7.4 Normalisierung

`normalize_expression(text, umgebung)` schreibt einen Ausdruck mit Namen in der Schreibweise ihrer Kennung und Funktionen in der Schreibweise der Norm. Es ändert nur erkannte Namen und Funktionsnamen; jedes andere Zeichen (Leerraum, Zeilenumbrüche, Texte, Zahlen) bleibt Zeichen für Zeichen erhalten. Ein unbekannter Name oder eine unbekannte Funktion bleibt unverändert, ebenso ein Ausdruck mit einem Schreibfehler. Die Funktion ist idempotent. `normalize_strategy` und `normalize_template` wenden sie auf alle Ausdrücke eines Dokuments an, jeden in seinem Namensraum (Abschnitt 6), und liefern eine Kopie; das Argument bleibt unverändert. Beispiel: `order.VOLUMEN` ergibt `Order.volumen`, `if(a;1;2)` ergibt `IF(a;1;2)`. Die Objekte der Anwendung behalten ihre Schreibweise (`Order`, `Konto`), alle Eigenschaften sind klein geschrieben (`Order.stop_loss`). Beide Testfalldokumente sind in dieser Schreibweise gespeichert.

### 7.5 Zusammenhang der Typprüfung

Die Typprüfung kennt zu jedem Ausdruck seinen Zusammenhang (Spezifikation 3.4):

| Zusammenhang | `Order` | `Position` |
| --- | --- | --- |
| Regel der Strategie oder eines Elements | Eigenschaften aller Ordertypen | Eigenschaften der Position |
| Ausdruck in der Order- und Positionsverwaltung | Eigenschaften des Ordertyps dieses „Order aufgeben“ | Eigenschaften der Position |
| Ausdruck im Hauptablauf, Indikator, Trend | Fehler (`expression.order_outside_management`) | Fehler |
| Regel in einem Indikator oder Trend, auch in einem Regelwerk darin | Fehler (`rule.order_in_indicator`) | Fehler |

- Hinweis S27: Für die Vorlage einer Regel oder eines Regelwerks gilt der Zusammenhang „Regel der Strategie oder eines Elements“: `Order` hat die Eigenschaften aller Ordertypen.
- Hinweis S18: Eine Regel wird immer in ihrem eigenen Zusammenhang geprüft. Verwendet ein Ausdruck in der Order- und Positionsverwaltung ihr Ergebnis, prüft die Typprüfung die Regel nicht erneut gegen den Ordertyp dieser Order- und Positionsverwaltung. Fehlt dem Ordertyp eine angesprochene Eigenschaft, ist der Wert bei der Ausführung „nicht verfügbar“ (Abschnitt 8). Das ist kein Befund.
- Ob eine Regel `Order` oder `Position` anspricht, gilt auch über das Ergebnis einer anderen Regel (`a.ergebnis`, `regelwerk.regel.ergebnis`), nicht aber über Bedingungen oder Berechnungen.
- Das Ergebnis einer Regel hat den Datentyp ihrer bestimmten Eigenschaft (Zahl für `volumen`, Auswahl für `richtung`), bei einer nur prüfenden Regel den Wahrheitswert. Das Gesamtergebnis eines Regelwerks hat den Typ seines Ausdrucks.

### 7.6 Gespeicherte Form und Anzeigeform

Die gespeicherte Form hat die Kennungen der Objekte und die Kennungen der Werte einer Auswahl in der normalisierten Schreibweise. Die Anzeigeform zeigt statt der Kennungen die Namen des Anwenders, die Namen der Objekte der Anwendung und die Beschriftungen der Eigenschaften und Werte in der gewählten Sprache (`Konto.Kapital`, englisch `Account.Capital`). Funktionen stehen mit ihren Namen aus der Norm. Ein Name, der kein einfacher Name nach OpenFormula ist (nicht nur Buchstaben, Ziffern und `_`, oder mit einer Ziffer am Anfang), steht in eckigen Klammern: `[EMA 20].Wert`, `Strategie.[Stop-Abstand]`, `[ZigZag H1].[Letztes Hoch]` (`is_simple_name`, `display_part`). Eine Methode steht mit ihrer Beschriftung und ihren Argumenten: `[Reihe A].[Wert vor](3; "Eröffnungskurs")`, englisch `[Reihe A].[Value before](3; "open price")`; die Werte einer Auswahl als Argument wandelt `render` wie die einer Auswahl im Vergleich (gespeichert die Kennung, angezeigt die Beschriftung).

`render(text, umgebung, sprache, display_input=…, erwartet=…)` wandelt in beide Richtungen und liefert beide Formen (`Rendering`: `stored`, `display`, `analysis`). Bei der Eingabe gelten beide Formen und beide Sprachen; welche vorliegt, sagt `display_input`. Ein Name, der sich nicht eindeutig zuordnen lässt, ist ein unbekannter Name und bleibt wie geschrieben. Ein Ausdruck mit Schreibfehler bleibt in beiden Formen unverändert. Leerraum und Zeilenumbrüche bleiben erhalten. Feste Texte, die für einen Wert einer Auswahl stehen (Vergleich mit einer Auswahl, Ergebnis eines `IF` für eine Auswahl), wandelt die Funktion mit: gespeichert die Kennung (`"aufwaerts"`), angezeigt die Beschriftung (`"aufwärts"`). Umbenennen ändert keinen gespeicherten Ausdruck.

### 7.7 Bausteine und Satz

`to_blocks(analyse)` stellt jeden Ausdruck ohne Schreibfehler als Baum von Bausteinen dar, `blocks_to_text(baum)` bildet den gespeicherten Ausdruck daraus (Spezifikation 3.4, req-ui-015). Ein `Block` hat `kind` und je nach Art `path` (Liste der Kennungen), `value` und `datatype`, `operator`, `function`, `call` und `children`:

| `kind` | Inhalt |
| --- | --- |
| `empty` | leerer Platz |
| `name` | Wert: Eigenschaft eines Objekts, Ergebnis, Strategieparameter oder Parameter; `path`, zum Beispiel `["ema20", "wert"]` oder `["Strategie", "stop_abstand"]`. Mit `call` wahr ist der Wert das Ergebnis einer Methode: `path` endet mit der Methode (`["reihe_a", "wert_vor"]`) und `children` sind die Bausteine ihrer Argumente in der Reihenfolge der Methode (keine bei einer Methode ohne Argumente). Das gilt in beide Richtungen: `to_blocks` stellt `reihe_a.wert_vor(3)` so dar, `blocks_to_text` bildet den Ausdruck aus einem solchen Baustein (ein Wert ohne `call` mit Kindern oder ein Aufruf ohne Objekt ist ein `BlockError`: `name_children`, `name_path`) |
| `literal` | fester Wert mit `value` und `datatype` (`number`, `integer`, `percent`, `text`, `boolean`; ein Prozentwert ist die Zahl, wie geschrieben: 5 für 5 %) |
| `comparison` | Vergleich: `operator` aus `=`, `<>`, `<`, `<=`, `>`, `>=`; zwei Kinder |
| `arithmetic` | Rechnung: `operator` aus `+`, `-`, `*`, `/`, `^`, `&` (ein Kind bei einem Vorzeichen) |
| `logic` | Verknüpfung: `operator` aus `and`, `or`, `not` |
| `if` | Fallunterscheidung: Bedingung, Wert, Sonst-Wert |
| `function` | jede andere Funktion der Liste, `function` mit dem Namen aus der Norm, darunter „vorheriger Wert von“ (`PREVIOUS`) |

Jeder Baustein entspricht genau einem Operator oder einer Funktion der Liste; die Bibliothek fasst beim Zerlegen keine Folge von Bausteinen zu einem eigenen Baustein zusammen. Eine **Kreuzung ist kein Baustein** und keine Funktion (Spezifikation 3.4, Mangel E12): Der Ausdruck „EMA 20 kreuzt EMA 50 nach oben“ ist `AND(PREVIOUS(ema20.wert) <= PREVIOUS(ema50.wert); ema20.wert > ema50.wert)`, „nach unten“ ist `AND(PREVIOUS(ema20.wert) >= PREVIOUS(ema50.wert); ema20.wert < ema50.wert)`, „in beide Richtungen“ das `OR` aus beiden. Ein gespeicherter Ausdruck dieser Form bleibt gültig und unverändert, auch wenn er mit dem früheren Baustein „Kreuzung“ entstanden ist (`str-01`, `str-03` und die gesicherte „EMA-Trendfolge“ des Auftraggebers): `to_blocks` zerlegt ihn in „vorheriger Wert von“, Vergleiche und Verknüpfungen, auch innerhalb von `AND` und `OR`, `blocks_to_text` bildet aus diesem Baum denselben Ausdruck zurück, und der Satz schreibt ihn aus („vorheriger Wert von EMA 20 ist kleiner oder gleich vorheriger Wert von EMA 50 und EMA 20 ist größer als EMA 50“). Der Baustein hat weder die Art `crossing` noch das Feld `direction`; `blocks_to_text(baum)` braucht keine Umgebung mehr. Welche Werte einen früheren Wert haben und damit das Argument von „vorheriger Wert von“ sein können, sagt `previous_value` an den Eigenschaften und Methoden der sichtbaren Namen (Abschnitt 7.8); die Oberfläche bietet nur solche Werte an und bildet die Regel nicht nach. Ein Baum, der kein Ausdruck ist (zum Beispiel ein unbekannter Operator, eine falsche Zahl von Kindern, ein Name ohne Weg), löst `BlockError` mit einer Kennung (`reason`) und Angaben aus. Ein Ausdruck mit Schreibfehler hat keine Bausteine (`to_blocks` liefert `None`). Die Tiefe eines Baums ist auf `MAX_BLOCK_DEPTH` begrenzt.

`sentence(baum, sprache, erwartet)` liefert den lesbaren Satz zu einem Baum in Deutsch oder Englisch, wie Zeichenfläche und Eigenschaftenansicht ihn zeigen (`ema20.wert` größer als `ema50.wert` und so weiter). Eine Methode nennt der Satz mit ihrer Beschriftung, den Argumenten und dem Objekt: „Wert vor (3; „Eröffnungskurs“) von Reihe A“, englisch „Value before (3; “open price”) of Reihe A“.

### 7.8 Zeichen und sichtbare Namen

`characters(text)` liefert die Zeichen eines Ausdrucks (`Character`) mit `kind` (`name`, `function`, `value`, `operator`, `bracket`, `separator`), `start`, `end` und, bei Klammern, `partner` (Index der zugehörigen Klammer in der Liste, `None`, wenn es keine gibt). Das gilt auch für einen Ausdruck mit Schreibfehler; was sich nicht lesen lässt, bleibt weg. Leerraum ist kein Zeichen, das Prozentzeichen gehört zur Zahl davor. Der Name einer Methode ist ein Zeichen der Art `name` (`reihe_a.wert_vor`), die Klammern um die Argumente sind `bracket` mit `partner`, das Trennzeichen `;` ist `separator`; ein einzelner Name vor `(` ist eine `function`.

`visible_names(namensraum, sprache, verborgen=(), register=None)` liefert die an der Stelle eines Ausdrucks sichtbaren Namen (`VisibleName`): `display` (Anzeigename in der Sprache), `path` (Weg aus Kennungen), `kind` (`instance`, `result`, `strategy_parameter`, `parameter`, `application_object`, `rule`), `datatype` und `datatype_label` (bei Strategieparameter und Parameter), `properties` (je `PropertyInfo` mit `key`, `label`, `datatype`, `datatype_label`, `explanation`, `choices` und `previous_value`), `methods` (je `MethodInfo` mit `key`, `label`, `datatype` und `datatype_label` des Ergebnisses, `explanation`, `choices` des Ergebnisses, `previous_value` und `arguments`; ein `ArgumentInfo` hat `key`, `label`, `datatype`, `datatype_label`, `required`, `default`, `explanation` und `choices`). `datatype_label` ist das Wort des Datentyps in Händlersprache (Abschnitt 3.1); mit dem `register` ist es bei einem Objekt der Name des Objekttyps, ohne Register das allgemeine Wort „Objekt“. `previous_value` sagt je Wert, ob das Fachmodell einen früheren Wert festlegt (Argument von „vorheriger Wert von“, Spezifikation 3.4): bei Eigenschaften und Methodenergebnissen eines Objekts mit Zeiteinheit (Indikator, Trend, `Kerze`, auch ohne Instanz), bei Eigenschaften von `Tick` und beim Ergebnis einer Bedingung oder Berechnung, sonst nicht (`Konto`, `Instrument`, `Order`, `Position`, `Strategie`, Strategieparameter) und `contents` (enthaltene Instanzen und Regeln einer Instanz mit Inhalt, eines Trends mit enthaltenen Instanzen und eines Regelwerks mit seinen Regeln; Hinweis S19). Nach dem Namen einer Bedingung oder Berechnung bietet sie ihr `Ergebnis` an (Mangel M15). Die Zahl der Namen ist auf `MAX_NAMES_PER_ITEM`, die der Eigenschaften und die der Methoden je Name auf `MAX_PROPERTIES_PER_NAME` begrenzt; wo gekürzt wird, sagt das Ergebnis es (`properties_truncated` gilt für beide Listen). `verborgen` sind die Kennungen (klein geschrieben) der Instanzen, die am Element des Ausdrucks nicht verwendbar sind (Abschnitt 9.5, `Checker.hidden_instances(element)`): Die Liste lässt sie aus, damit Bausteine, Formeleditor und Verbinden sie nicht anbieten (Spezifikation 3.4); nennt ein Ausdruck sie trotzdem, meldet `Checker.context_findings` den Befund `instance.not_usable` mit der Stelle. Eine enthaltene Instanz oder Regel steht nur bei der umgebenden Instanz beziehungsweise dem Regelwerk (`contents`), nicht noch einmal daneben (Abschnitt 6.2).

### 7.9 Entfernen

Entfernt der Anwender ein Objekt, einen Strategieparameter, eine Bedingung oder eine Berechnung, die ein Ausdruck verwendet, ändert die Bibliothek die Ausdrücke (Spezifikation 3.4, `operations.py`):

- `remove_strategy_parameter(strategie, kennung)`, `remove_element(strategie, element)` (liefert die Kennungen der mit entfernten Elemente, bei „Order aufgeben“ die der Order- und Positionsverwaltung) und `remove_rule(strategie, regel)` ersetzen jede Verwendung in einem zerlegbaren Ausdruck durch einen leeren Platz (`[]`), beenden die Belegungen mit der Bindungsart Strategieparameter oder Datenverbindung, die auf das Entfernte zeigen („nicht belegt“), und nehmen Eingänge, Verbindungen und Stellen in Abschnitten mit.
- Lässt sich ein Ausdruck nicht zerlegen, weil er einen Schreibfehler hat, bleibt die Kennung stehen; die Prüfung meldet sie als unbekannten Namen.
- Ein leerer Platz ergibt einen unvollständigen Ausdruck; er wird gespeichert und von der Prüfung als `expression.empty` (`reason` = `slot`, mit Stelle) gemeldet.
- Eine enthaltene Instanz und eine Regel in einem Regelwerk sind im Ausdruck mit ihrer eigenen Kennung ansprechbar (Abschnitt 6.2). Wer eine Instanz oder eine Regel entfernt, entfernt auch alles darin: Jede Verwendung einer enthaltenen Instanz oder Regel wird ebenfalls ein leerer Platz. Jeder Ausdruck wird dabei nur einmal zerlegt, wie viele Objekte auch gehen.
- Hatte eine Instanz das Element, das entfernt wird, als Element der ersten Verwendung (`first_use`), ist `first_use` danach leer.
- Vor dem Entfernen liefern `uses_of_element(strategie, element)`, `uses_of_strategy_parameter(strategie, kennung)` und `uses_of_rule(strategie, regel)` die Verwendungen (`Uses`): `elements`, die Kennungen der Elemente, die das Objekt verwenden, in der Reihenfolge der Strategie, und `rules`, die Kennungen der Regeln der Strategie, die es verwenden. Ein Element verwendet ein Objekt, wenn ein Ausdruck des Elements oder seiner Regeln es nennt, wenn es einen Eingang dafür hat oder wenn eine Belegung des Elements oder einer Instanz in seinem Inhalt eine Datenverbindung dazu oder (beim Strategieparameter) die Bindungsart Strategieparameter hat; eine Instanz zählt als das Element, das sie zeigt. Beim Entfernen von „Order aufgeben“ zählen die Elemente seiner Order- und Positionsverwaltung nicht als Verwender. Das ist die Liste für die Rückfrage der Oberfläche; die Web-API stellt sie mit dem Entfernen als `POST /api/v1/removals` bereit.

## 8. Bedeutung bei der Ausführung

Dieser Abschnitt legt fest, was Fehler, „leer“ und „nicht verfügbar“ bei der späteren Ausführung bedeuten. Die Bibliothek wertet nicht aus; Strategietester und Handelssystem setzen es um. Strategietester und Handelssystem protokollieren jeden Fehler einer Auswertung mit Element und Ausdruck.

**„Nicht verfügbar“** (`#N/A` nach OpenFormula): Spricht ein Ausdruck eine Eigenschaft an, die das Objekt im Zusammenhang der Auswertung nicht hat, ist der Wert „nicht verfügbar“. Das gilt für eine Eigenschaft, die der Ordertyp nicht hat (`Order.limitpreis` bei einer Stop-Order), für `Position` in einer Regel, die auf eine Order angewendet wird, und für `Position` in der Order- und Positionsverwaltung, solange die Order noch keine Position hat. Jede Rechnung mit „nicht verfügbar“ ergibt „nicht verfügbar“, auch eine Bedingung von `IF`; `ISNA` und `IFNA` prüfen und ersetzen ihn. `IF` wertet nur den gewählten Zweig aus. Die Auswertung vermerkt bei „nicht verfügbar“, ob er von einer Eigenschaft stammt, die der Ordertyp nicht hat.

**„Leer“**: Eine Eigenschaft ohne Wert ist „leer“: eine KANN-Eigenschaft ohne Wert oder eine Eigenschaft, die das Objekt gerade nicht belegt, etwa `vorletztes_hoch` des `ZigZag`, solange er noch kein zweites endgültiges Hoch hat. Rechnung und Vergleich mit „leer“ sind ein Fehler, ebenso eine Division durch null und die übrigen Fehlerwerte von OpenFormula. `ISBLANK` prüft auf „leer“ und liefert dafür „wahr“, ohne Fehler. Im Strategietester bricht ein solcher Fehler die Auswertung nicht ab: Liefert ein Indikator zu Beginn eines Testlaufs noch keine Werte, gilt eine Bedingung mit diesen Werten als nicht erfüllt, sie nimmt nach der Tabelle unten den Ausgang `falsch` (Anforderungen an den Strategietester req-test-008).

Wirkung bei der Ausführung, wenn das Ergebnis eines Ausdrucks ein Fehler, „leer“ oder „nicht verfügbar“ ist:

| Stelle | Wirkung | Grundlage |
| --- | --- | --- |
| Regel, Ergebnis „nicht verfügbar“ von einer Eigenschaft, die der Ordertyp nicht hat | sie wird auf diese Order nicht angewendet, ohne Fehler oder Meldung | req-fach-046 |
| bestimmende Regel, Fehler, „leer“ oder sonst „nicht verfügbar“ | die Eigenschaft ist nicht bestimmbar | req-fach-021 |
| prüfende Regel, Fehler, „leer“ oder sonst „nicht verfügbar“ | die Prüfung ist nicht erfüllt | req-fach-021 |
| Bedingung | jedes Ergebnis außer „wahr“ nimmt den Ausgang `falsch` | req-fach-047 |
| Berechnung | das Ergebnis ist dieser Wert; wer es verwendet, verhält sich nach dieser Tabelle | req-fach-048 |
| Belegung einer Eigenschaft bei „Order aufgeben“, „Order ändern“, „Position ändern“, „Position schließen“ | die Eigenschaft ist nicht bestimmbar: Ausgang `nicht_gestellt` beziehungsweise `nicht_geaendert`, bei „Position schließen“ wird nichts geschlossen und der Ablauf geht weiter | req-fach-049, req-fach-049a |
| eigene Eigenschaft eines Indikators oder Trends | die Eigenschaft ist „leer“ | req-fach-013a |

Festlegungen zu dieser Tabelle:

- Hinweis S24: Der Vermerk „von einer Eigenschaft, die der Ordertyp nicht hat“ geht durch Rechnungen, Funktionen, den gewählten Zweig und die Bedingung von `IF` und das Ergebnis einer anderen Regel weiter. Treffen Werte „nicht verfügbar“ verschiedener Herkunft zusammen, trägt das Ergebnis den Vermerk, wenn mindestens einer ihn trägt. Wird eine Regel auf eine Position angewendet, ist `Order` die Order, aus der die Position entstand (req-fach-051); fehlt deren Ordertyp eine Eigenschaft, gilt derselbe Vermerk.
- Hinweis S25: „In der Order- und Positionsverwaltung sieht die Regel die Order und Position der Order- und Positionsverwaltung“ gilt für eine Regel, deren Ergebnis ein Ausdruck der Order- und Positionsverwaltung verwendet. Eine Regel, die bei „Order ändern“ in der Order- und Positionsverwaltung auf die Order angewendet wird, findet keine Position vor: `Position` ist dort „nicht verfügbar“, auch nach einer Teilausführung.
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
| `flow.main_without_trigger` | Hinweis | Hauptablauf ohne Auslöser: die Strategie startet nie, auch wenn Order- und Positionsverwaltungen eigene Auslöser haben. Für eine neue, leere Strategie der einzige Befund | – | – |
| `instrument.invalid` | Fehler | festes Instrument mit ungültiger Bezeichnung (Abschnitt 3.2), an jeder Stelle, an der ein festes Instrument steht | Element, Instanz oder Strategieparameter | `parameter` oder `property`, `value`, bei einem Strategieparameter `scope` = `strategy`; bei einem Ausdruck wie `expression.invalid` |
| `expression.invalid` | Fehler | fehlerhafter Ausdruck: Schreibfehler, unbekannte Funktion, unbekannter Name, unbekannte Eigenschaft, unpassender Typ, unbekannter Wert einer Auswahl, `PREVIOUS` mit einem Argument ohne früheren Wert | Element (leer bei einer Regel der Strategie oder einer Vorlage), Instanz oder Regel | `field` (welcher Ausdruck: `parameter:<kennung>`, `property:<kennung>`, `expression`, `result_expression`, `property_definition:<name>`), `start`, `end`, `issue` (die `kind` aus Abschnitt 7.3), `reason` und die Angaben des Befunds im Ausdruck |
| `expression.empty` | Fehler (Angabe ohne Wert) | Ausdruck fehlt oder enthält einen leeren Platz (Bedingung, Berechnung, Regel, eigene Eigenschaft, Richtung des Trends, Belegung mit Ausdruck) | wie `expression.invalid` | `field`, `reason` (`missing` oder `slot`), bei `slot` `start`, `end` |
| `data.unknown` | Fehler | Datenverbindung (Belegung oder Eingang) zu einer Instanz, Eigenschaft oder Methode, die es nicht gibt, oder ein Eingang mit Argumenten, die nicht zur Methode passen | Element, Instanz oder Regel | `where` (`binding` oder `input`), `reason` (`unknown_instance`, `unknown_property`, `unknown_method`, `arguments`), `instance`, `property` (bei einem Eingang mit der Methode deren Kennung), bei `binding` `target`, `target_kind`, bei `arguments` `minimum`, `maximum`, `found` (Zahl der angegebenen Werte; auch ein Wert, der nicht zum Datentyp seines Arguments passt, ist `arguments`) |
| `data.type_mismatch` | Fehler | Belegung mit Bindungsart Datenverbindung, deren Eigenschaft nicht zum Datentyp des Parameters oder der Eigenschaft passt | Element, Instanz oder Regel | `instance`, `property`, `expected`, `found`, `target`, `target_kind` |
| `input.unused` | Hinweis | Eingang, den kein Ausdruck des Elements oder seiner Regeln und keine Datenverbindung des Elements verwendet | das Element | `instance`, `property` |
| `rule.result_mismatch` | Fehler | Ergebnis einer bestimmenden Regel passt nicht zur bestimmten Eigenschaft (bei einer prüfenden Regel: Ergebnis ist kein Wahrheitswert) | Regel | `reason` (`unknown_property`, `choice_value`, `type`), `property`, `expected`, `found`, `values`, `allowed` |
| `flow.unending_loop` | Fehler | Rückführung ohne Bedingung, die sie beendet | das erste Element der Gruppe | `elements` (alle Elemente der Gruppe) |
| `parameter.missing` | Fehler (Angabe ohne Wert) | Pflichtparameter ohne Wert und nicht „bei der Anwendung“ | Element, Instanz oder Strategieparameter | `parameter`, bei Strategieparametern `scope` = `strategy` |
| `order.property_missing` | Fehler (Angabe ohne Wert) | MUSS-Eigenschaft der Order, die der Anwender belegt, ohne Belegung und ohne bestimmende Regel der Strategie oder des Elements | das Element „Order aufgeben“ | `property`, `order_type` |
| `ruleset.reference_order` | Fehler | Regelwerk mit Vorwärtsbezug oder Zirkelbezug | die Regel | `kind` (`forward` oder `cycle`), `list`, bei `forward` `rule` und `refers_to`, bei `cycle` `rules` |
| `expression.order_outside_management` | Fehler | `Order` oder `Position` im Ablauf außerhalb einer Order- und Positionsverwaltung, auch über das Ergebnis einer Regel | Element, Instanz | `field`, `context` (`main_flow` oder `indicator`) |
| `rule.order_in_indicator` | Fehler | Regel, die `Order` oder `Position` anspricht, in einem Indikator oder Trend, auch in einem Regelwerk darin | Element, Regel (`instanz.regel`) | – |
| `candle.no_instance` | Fehler | Zeile zu `Kerze` ohne Instanz: `Kerze` ohne Instanz mit gesetzter Zeiteinheit, wenn ein Auslöser außer `Kerzenschluss` oder kein Auslöser die Auswertung startet | Element, Instanz oder Regel der Strategie (`element` und `subject` wie beim Ausdruck) | – |
| `flow.management_only` | Fehler | Order ändern, Order löschen, Position ändern oder Position schließen außerhalb einer Order- und Positionsverwaltung | das Element | `type` |
| `name.duplicate` | Fehler | Name oder Kennung doppelt vergeben im gemeinsamen Namensraum der Strategie (Abschnitt 6.2), auch in enthaltenen Instanzen und Regelwerken, unter den Strategieparametern, oder Parameter einer Regel oder Vorlage, der einen Namen des Namensraums nimmt; in einer Vorlage innerhalb ihres Inhalts. Auch gegen die Objekte der Anwendung | das Element, die Instanz oder Regel, die den Namen zum zweiten Mal vergibt (bei einem Teil innerhalb einer Instanz mit `subject` = `instanz.teil`) | `name`, `key`, `namespace` (`strategy`, `strategy_parameters`, `rule_parameters`, `template`, `template_properties`), `what` (`name` oder `key`), bei einem Zusammenfall mit einem Objekt der Anwendung `with_application_object`, bei einem Parameter, der einen Namen des Namensraums nimmt, `with_parameter` |
| `type.unknown` | Fehler | unbekannter Elementtyp oder Objekttyp | das Element, die Instanz | `kind` (`element` oder `object`), `type` |
| `flow.no_order_reachable` | Hinweis | kein Element „Order aufgeben“ von einem Auslöser des Hauptablaufs erreichbar; nicht gemeldet bei einem Hauptablauf ohne Auslöser, der schon den Hinweis `flow.main_without_trigger` erhält | – | – |
| `input.refresh_not_allowed` | Fehler | „Aktualisieren“ (`refresh`) bei einem Eingang einer Instanz, deren Typ es nicht vorsieht (`can_refresh` falsch; Abschnitt 4.5); nicht gemeldet bei einem unbekannten Typ, der schon `type.unknown` erhält | das Element des Eingangs; `subject` die Instanz | `instance`, `property`, `object_type` |
| `instance.not_usable` | Fehler | Verwendung einer Instanz an einem Element, an dem sie nicht verwendbar ist: auf einem Weg, der nicht über das Element ihrer ersten Verwendung führt (Abschnitt 9.5), auch nur im Ausdruck, auch als Text eingegeben, auch über die Datenverbindung einer anderen Instanz | das verwendende Element; `subject` die Instanz | `instance`, `first_use` (Kennung des Elements der ersten Verwendung), `use` (`input`, `expression`, `rule`, `data_link`), `by_instance` (Kennung der anderen Instanz, sonst `null`), `property` (Eigenschaft oder Methode, sonst `null`); als Befund einer eingegebenen Stelle (`/api/v1/expressions`) dazu `field`, `start`, `end` und ohne `by_instance` und `property` |
| `trigger.manual_in_management` | Fehler | Auslöser `Manuell` in der Order- und Positionsverwaltung | der Auslöser | – |
| `instance.unconnected` | Fehler | Instanz ohne Verbindung zu dem Element, das sie zuerst verwendet: kein Element verwendet sie, weder durch einen Eingang noch durch einen Namen im Ausdruck oder in einer Regel des Elements noch durch eine Datenverbindung, und keine andere Instanz (die ein Element hat) und keine Regel der Strategie (bei einem vorhandenen Element, das Regeln nimmt) verwendet sie. Gilt für Instanzen, die unmittelbar in der Strategie liegen, nicht für enthaltene Instanzen und nicht für eine Vorlage | das Element, das die Instanz zeigt; `subject` die Instanz | `instance` |

Die unzulässigen Verbindungen aus Spezifikation 3.3 meldet `connection.invalid` (Abschnitt 9.2). Eine Strategie ohne Auslöser lässt sich speichern, wird aber nicht ausgewertet (req-fach-015); sie erhält den Hinweis `flow.main_without_trigger`. Eine neue, leere Strategie erhält diesen Hinweis und sonst keinen Befund. Ein Element eines Ablaufs, auch einer Order- und Positionsverwaltung ohne eigene Auslöser, braucht einen Auslöser, der es erreicht; die Auslöser, die das Element „Order aufgeben“ erreichen, erreichen auch die Elemente seiner Order- und Positionsverwaltung ohne eigene Auslöser (Spezifikation 3.3).

Einzelheiten der Befunde:

- `flow.unending_loop`: Ein Kreis ist beendet, wenn auf ihm eine Bedingung liegt, von der ein Ausgang aus dem Kreis hinausführt oder ohne Fortsetzung endet. Die Prüfung arbeitet auf den stark zusammenhängenden Gruppen des Ablaufs; eine Gruppe ohne eine solche Bedingung ist ein Befund. Der Ablauf und jede Order- und Positionsverwaltung werden getrennt geprüft.
- `candle.no_instance`: Die Prüfung gilt für jeden Ausdruck, der `Kerze` unter dem Namen des Objekttyps verwendet, solange kein Element `Kerze` mit gesetzter `zeiteinheit` auf der Zeichenfläche liegt. Fehler ist es
  - bei einem Element des Ablaufs und seinen Regeln, wenn das Element in seinem Ablauf (Hauptablauf beziehungsweise seine Order- und Positionsverwaltung) von keinem Auslöser oder von einem anderen Auslöser als `trigger.candle_close` erreicht wird. Wird ein Element von `trigger.candle_close` und von einem anderen Auslöser erreicht, ist es ein Fehler.
  - bei einer Regel der Strategie und bei einer Instanz auf der Zeichenfläche (eigene Eigenschaften, Parameter), wenn die Strategie, Hauptablauf und alle Order- und Positionsverwaltungen zusammen, keinen Auslöser oder mindestens einen anderen als `trigger.candle_close` hat. In `str-01` ist deshalb wegen `trigger.tick` in der Order- und Positionsverwaltung eine Regel der Strategie mit `Kerze` ohne Instanz ein Fehler (Hinweis N4, Lesart nach req-fach-051).

  Wird ein Element nur von `trigger.candle_close` erreicht und hat die Strategie nur solche Auslöser, bleibt alles ohne Befund. `Instrument`, `Kerze` und `Tick` ohne Instanz erhalten keinen Befund für das Instrument (Abschnitt 3.2).
- `order.property_missing`: Zählt nur Eigenschaften mit `set_by_user`; eine Eigenschaft mit Standardwert (`gueltigkeit`, `instrument`) gilt als belegt; `ablaufzeit` und `datum` zählen nur bei dem zugehörigen Wert von `gueltigkeit`. Die Belegung mit der Bindungsart `application` zählt als Belegung. Eine bestimmende Regel (`determined_property`) der Strategie oder des Elements, auch in einem Regelwerk, ersetzt die Belegung.
- `ruleset.reference_order`: Ein Vorwärtsbezug (die Regel verwendet das Ergebnis einer späteren) und ein Zirkelbezug werden in einem Regelwerk gemeldet; ein Zirkelbezug auch in jeder anderen Liste von Regeln (Strategie, Element, Vorlage).
- `expression.order_outside_management` und `rule.order_in_indicator` erkennen `Order` und `Position` auch über das Ergebnis einer Regel, auch über mehrere Regeln.
- `input.unused`: Ein Eingang ändert die Bedeutung nicht (Spezifikation 3.3); der Hinweis erscheint nur, wenn kein Ausdruck des Elements oder seiner Regeln den Namen der Instanz und die Eigenschaft oder Methode nennt und keine Belegung des Elements eine Datenverbindung zu dieser Eigenschaft hat. Bei einem Eingang mit einer Methode genügt der Aufruf der Methode in einem Ausdruck; die Werte der Argumente vergleicht die Prüfung nicht.
- Eingang (`data.unknown`, `where` = `input`): Die Prüfung gleicht ihn mit der Typbeschreibung ab. Ein Eingang mit `kind` `property` nennt eine Eigenschaft der Instanz, einer mit `kind` `method` eine Methode, beides mit der Kennung in `property`; die Zahl der Argumente liegt zwischen der Zahl der Pflichtargumente und der aller Argumente, jeder Wert hat den Datentyp seines Arguments (Zahl, Ganzzahl und Prozent als Zahl, Wahrheitswert, Text, Wert einer Auswahl oder Zeiteinheit nach seiner Kennung). Die Angabe `refresh` ist nur bei einem Typ mit `can_refresh` zulässig (`input.refresh_not_allowed`). Der Eingang nennt eine Instanz auf der Zeichenfläche, keine enthaltene Instanz. Die Wege und das Element der ersten Verwendung beschreibt Abschnitt 9.5.

### 9.2 Weitere Befunde

Diese Befunde stehen nicht in der Tabelle der Spezifikation; sie sind für eine vollständige Prüfung nötig.

| Kennung | Stufe | Befund | Angaben |
| --- | --- | --- | --- |
| `rule.unresolved_name` | Hinweis | Der Ausdruck einer Regelvorlage spricht einen Namen an, der weder Objekt der Anwendung noch Parameter der Regel ist; in jeder Vorlage (`Regel`, `Regelwerk`, `Indikator`, `Trend`), für sich geprüft, außerdem ein Strategieparameter unter `Strategie`, den die Vorlage nicht kennen kann. Geprüft wird der Name in jeder Strategie, die die Vorlage enthält (Spezifikation 3.4) | wie `expression.invalid` |
| `connection.invalid` | Fehler | unzulässige Verbindung nach Spezifikation 3.3 | `reason`, `source`, `output`, `target`; `reason` ist `unknown_source`, `unknown_target`, `unknown_output`, `target_is_trigger`, `instance_connection` (von oder zu einer Instanz), `management_output_outside` (vom Ausgang mit der Order- und Positionsverwaltung zu einem Element außerhalb), `management_output_with_triggers` (vom Ausgang mit der Order- und Positionsverwaltung, wenn die Order- und Positionsverwaltung eigene Auslöser hat) oder `across_managements` (zwischen verschiedenen Abläufen) |
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

`check_with_contexts(wert)` prüft eine Strategie oder Vorlage und behält zu jeder Stelle eines Ausdrucks, die die Prüfung kennt, den Zusammenhang (`Checker.contexts`, Schlüssel ist der JSON Pointer der Stelle im Dokument): Namensraum, erwarteter Typ, Element, Instanz oder Regel, ob `Order` und `Position` dort ein Fehler sind, ob es eine Regelvorlage ist, Feldname. Der Endpunkt `/api/v1/expressions` braucht ihn, um einen Ausdruck an einer Stelle des Dokuments so zu zerlegen und zu prüfen, wie die Prüfung es tut (`Checker.context_findings`). Ein Zeiger auf eine Stelle ohne Ausdruck ist für den Endpunkt ein Fehler; die Stelle selbst darf fehlen, ihr übergeordnetes Objekt muss vorhanden sein. `Checker.hidden_instances(element)` nennt die Instanzen, die an einem Element nicht verwendbar sind (Abschnitt 9.5); `context_findings` meldet für einen Ausdruck an dieser Stelle auch einen Namen, der eine solche Instanz nennt.

### 9.5 Element der ersten Verwendung, Wege und verwendbare Stellen

Dieser Abschnitt setzt „Element der ersten Verwendung“ und „Stand einer Instanz“ aus Spezifikation 3.3 um (`consistency/usage.py`, `consistency/graph.py`). `analyze_usage(strategie)` liefert den Bericht (`UsageReport`); die Prüfung (`check_strategy`) leitet daraus die Befunde `instance.not_usable` und `instance.unconnected` ab. Beides geschieht in einem Durchgang mit der Prüfung der Ausdrücke.

**Verwendung.** Eine Verwendung einer Instanz auf der Zeichenfläche (eines Elements mit `instance`, nicht einer enthaltenen) ist

- ein Eingang des Elements (`input`),
- ein Name im Ausdruck des Elements, auch in seinen Belegungen und in den Eigenschaften von „Order aufgeben“ (`expression`); ein Name einer enthaltenen Instanz zählt als Verwendung der umgebenden,
- ein Name im Ausdruck einer Regel des Elements (`rule`) oder einer Regel der Strategie,
- eine Belegung mit der Bindungsart Datenverbindung (`data_link`) an einem Element oder an einer anderen Instanz.

Verwendet eine andere Instanz sie (Datenverbindung oder Ausdruck in einem Parameterwert der anderen Instanz), geschieht die Verwendung an dem Element der ersten Verwendung der anderen Instanz (`by_instance`). Zwei Instanzen, die einander verwenden, haben kein Element (Kreis).

**Element der ersten Verwendung.** Es ist, in dieser Reihenfolge:

1. das in `Instance.first_use` gespeicherte Element, wenn dieses Element die Instanz verwendet (ein gespeichertes Element, das es nicht gibt oder das die Instanz nicht verwendet, gilt als nicht gespeichert; `first_use_source` = `stored`),
2. das erste Element in der Reihenfolge des Ablaufs, das die Instanz verwendet, auch durch eine andere Instanz (`flow`, bei nur einer anderen Instanz als Verwender `instance`),
3. wenn nur eine Regel der Strategie die Instanz verwendet, das erste Element in der Reihenfolge des Ablaufs, das Regeln nimmt (`rule`); gibt es keins, hat die Instanz kein Element.

Die **Reihenfolge des Ablaufs** ist: von den Auslösern des Hauptablaufs (in der Reihenfolge der Strategie) entlang der Verbindungen in die Tiefe, die Ausgänge eines Elements in der Reihenfolge der Ausgänge seines Typs (`wahr` vor `falsch`, `gestellt` vor `nicht gestellt`), unabhängig von der Reihenfolge der Verbindungen im Dokument; danach, in der Reihenfolge, in der die Elemente „Order aufgeben“ dabei vorkamen, jede Order- und Positionsverwaltung von ihren eigenen Auslösern und von den Verbindungen am Ausgang `gestellt` aus; zuletzt Elemente, die kein Auslöser erreicht. Der Hauptablauf steht also vor den Order- und Positionsverwaltungen.

**Wege.** Die Wege zu einem Element sind die Wege der Spezifikation 3.3: im Hauptablauf jeder Weg von einem Auslöser des Hauptablaufs entlang der Verbindungen; in einer Order- und Positionsverwaltung jeder Weg zu ihrem Element „Order aufgeben“, fortgesetzt von einem eigenen Auslöser der Order- und Positionsverwaltung beziehungsweise vom Ausgang `gestellt` an, in einer Order- und Positionsverwaltung in einer Order- und Positionsverwaltung entsprechend. Die Bibliothek bildet das als Graph der Elemente des Ablaufs ab (die gültigen Verbindungen, dazu für jedes „Order aufgeben“ ein Schritt zu den eigenen Auslösern seiner Order- und Positionsverwaltung) und berechnet die Dominanz von den Auslösern des Hauptablaufs aus (`graph.Dominance`, iterativ, ohne Rekursion, nach Cooper, Harvey und Kennedy; eine Frage kostet danach konstante Zeit): Ein Element dominiert ein anderes, wenn jeder Weg zum anderen über das erste führt. Eine Rückführung ändert daran nichts, solange sie hinter dem dominierenden Element beginnt.

**Verwendbar.** Eine Instanz ist an einem Element verwendbar, wenn ihr Element der ersten Verwendung es dominiert, und an diesem Element selbst. Eine Instanz ohne Element der ersten Verwendung ist überall verwendbar (`usable_everywhere`). Das gilt auch für eine Instanz, deren erste Verwendung kein Auslöser des Hauptablaufs erreicht (kein Weg führt dorthin, die Prüfung meldet das Element mit `flow.not_reached`), und für ein Element, das kein Auslöser erreicht: Dort gibt es keinen Weg, an dem eine Verwendung scheitern könnte, ein zweiter Befund wäre nur eine Folge. Eine Regel der Strategie kann jede Instanz verwenden; für ihre Verwendungen gilt der Weg nicht.

**Befunde.** Verwendet ein Element eine Instanz, die dort nicht verwendbar ist, meldet die Prüfung einmal je Element und Instanz `instance.not_usable` (Fehler). Verwendet kein Element eine Instanz, meldet sie `instance.unconnected` (Fehler).

**Bericht.** `UsageReport` hat `instances` (je `InstanceUsage`: `instance`, `name`, `element`, `object_type`, `can_refresh`, `connected`, `first_use`, `first_use_source`, `usable_everywhere`, `usable_at`, `usable_at_omitted`), `elements` (je Element, das Instanzen verwendet, in der Reihenfolge des Ablaufs: `ElementUsage` mit `ElementUse` je Instanz und Art der Verwendung, darin `members` mit `MemberUse`: Name der Eigenschaft oder Methode, `kind`, Werte der Argumente, `refresh`), `strategy_rules` (die Verwendungen durch Regeln der Strategie) und `truncated`. `usable_at` listet die Elemente des Ablaufs, an denen die Instanz verwendbar ist (die, die das Element der ersten Verwendung dominiert, und die, die kein Auslöser erreicht); alle Listen zusammen haben höchstens `MAX_USAGE_ENTRIES` Einträge. Wird die Grenze erreicht, bleibt `usable_at` der folgenden Instanzen leer, `usable_at_omitted` ist wahr und `truncated` ist wahr. Der Bericht gehört zur Prüfung einer Strategie; bei einer Vorlage gibt es keinen (`Checker.usage` ist leer).

Beispiel: In `str-03` hat `atr14` das gespeicherte Element der ersten Verwendung „Stop-Loss“; es ist dort, an „Order aufgeben“ und in der Order- und Positionsverwaltung verwendbar, nicht an „Kreuzen“ und nicht am Auslöser. Eine Berechnung auf dem Ausgang `falsch` von „Kreuzen“, die `atr14` nennt, erhält `instance.not_usable` (Beispieldokument `str-03-instanz-nicht-verwendbar.strategy.json`, Abschnitt 10.4).

### 9.6 Name des Elements und Beschriftung des Felds eines Befunds

Mehrere Befunde können denselben Text haben, etwa neun Ausdrücke, die ein entferntes Objekt verwendeten (`expression.empty`, Mangel E3 der dritten Abnahme). Damit sie unterscheidbar sind und der Anwender weiß, wo er suchen muss, nennt jeder Befund (`Finding`) neben den Kennungen (`element`, `subject`, `details`) auch, was der Anwender sieht (Spezifikation 3.6, `consistency/describe.py`):

- `element_name`: Name des betroffenen Elements (`Label`): der Name, den der Anwender vergeben hat, in beiden Sprachen gleich; hat das Element keinen, der Name seines Typs in Deutsch und Englisch. `None`, wenn der Befund kein Element betrifft.
- `subject_name`: Name der betroffenen Instanz oder Regel (Text) oder des betroffenen Strategieparameters; `None` ohne.
- `field_label`: Beschriftung des betroffenen Felds in Deutsch und Englisch (`Label`), so wie das Element oder die Instanz sie zeigt: die Beschriftung des Parameters oder der Eigenschaft aus der Typbeschreibung, bei einem eigenen Parameter, einer eigenen Eigenschaft oder einem Strategieparameter dessen Name, „Ausdruck“ / „Expression“ beim Ausdruck einer Regel, „Gesamtergebnis“ / „Overall result“ beim Gesamtergebnis eines Regelwerks, „Verbundene Werte“ / „Connected values“ bei einem Eingang. `None`, wenn der Befund kein Feld betrifft.

Das Feld ergibt sich aus `details["field"]` (`parameter:<Kennung>`, `property:<Kennung>`, `property_definition:<Kennung>`, `expression`, `result_expression`) beziehungsweise aus `details["parameter"]` und `details["property"]`. Die Prüfung (`check_strategy`, `check_template`, `check_*_with_names`) und `Checker.context_findings` setzen die drei Felder; `describe_findings(befunde, wert, register)` tut es für beliebige Befunde zu einer Strategie oder Vorlage. Die drei Felder nehmen am Vergleich zweier Befunde nicht teil und stehen in `Finding.to_dict()`. Die Bibliothek schreibt auch hier keinen Text des Befunds (req-ui-007): Die Oberfläche setzt Element und Feld in ihren Text; sie schreibt „Ausdruck“ und nicht „Parameter ‚Ausdruck‘“, wo das Element die Beschriftung „Ausdruck“ zeigt.

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
- Instanz (in `rules`, `instances`, `instance`): `name`, `key`, `object_type`, `origin` (`object_type`, `template_id`, nur bei einer eigenen Vorlage `template_name`), `first_use` (UUID des Elements der ersten Verwendung der Instanz oder `null`; Abschnitt 9.5) und derselbe Inhalt.
- Eingang eines Elements (`inputs`): `{"instance": <Kennung der Instanz>, "property": <Kennung der Eigenschaft oder der Methode>, "kind": "property" | "method", "arguments": [<feste Werte>], "refresh": <Wahrheitswert>}`. Bei `kind` `method` nennt `property` die Methode und `arguments` die festen Werte ihrer Argumente in der Reihenfolge der Methode (Zahl, Wahrheitswert oder Text; höchstens `MAX_INPUT_ARGUMENTS`); bei `property` ist `arguments` leer. `refresh` ist die Angabe „Aktualisieren“; sie ist nur bei einer Instanz zulässig, deren Typ `can_refresh` hat (sonst `input.refresh_not_allowed`). In einem Dokument ohne diese Angaben gilt `kind` `property`, `arguments` leer und `refresh` falsch. Die Bibliothek schreibt alle fünf Felder.
- Belegung (`Binding`): `{"kind": "fixed", "value": 5}`, `{"kind": "parameter", "value": "kennung"}`, `{"kind": "connection", "value": {"instance": "ema20", "property": "wert"}}`, `{"kind": "expression", "value": "…"}` oder `{"kind": "application"}`. Ein festes Instrument ist `fixed` mit der Bezeichnung als Text oder `instrument_der_anwendung`.

Zahlen sind endlich: `NaN`, `Infinity`, `-Infinity` und Zahlen, die zu unendlich werden (`1e999`), lehnt die Bibliothek an jedem Zahlenfeld ab (feste Werte, Standardwerte, Werte von Strategieparametern, `x`, `y`), beim Lesen eines JSON-Textes, beim Prüfen eines Python-Objekts und beim Aufbau eines Dokuments aus dem Objektmodell. Geschrieben wird nur gültiges JSON (`allow_nan=False`). Ein Dokument als Bytes muss UTF-8 ohne Byte-Order-Mark sein; andere Kodierungen (UTF-16, UTF-32, Latin-1) und eine Byte-Order-Mark werden abgelehnt (Festlegung der Umsetzung nach RFC 8259). Die Prüfung auf einzelne Ersatzzeichen endet für jede Eingabe: Ein Python-Objekt, das sich selbst enthält (Kreis), wird als Fehler des Dokuments abgelehnt; ein Teil, der mehrfach eingehängt ist, wird nur einmal durchlaufen. Ein Text mit einem einzelnen Ersatzzeichen (U+D800 bis U+DFFF ohne Partner, auch als Escape `\ud800` geschrieben) in einem Wert oder Schlüssel wird abgelehnt, beim Lesen wie beim Schreiben, weil er sich nicht als UTF-8 ausgeben lässt; ein gültiges Paar ist erlaubt. Ein JSON-Text mit einem Schlüssel, der in einem Objekt zweimal vorkommt, wird abgelehnt; ebenso Text, der kein gültiges JSON ist oder zu tief geschachtelt ist. Alles das ist ein `DocumentError`.

Eingänge mit Methode und „Aktualisieren“ und das Feld `first_use` gehören zum Format 2.0, ohne neue Version: 2.0 ist bisher nur in Testumgebungen in Gebrauch (E9). Ein Auslöser mit der bisherigen Kennung `trigger.manual_start` („Start von Hand“) wird beim Lesen zu `trigger.manual` („Manuell“), in Dokumenten 2.0 wie in Dokumenten 1.0 (`parse_document`, `upgrade_document`); geschrieben wird nur die neue Kennung.

Kennungen (`id`, `template_id`, `management_of`, Verbindungen, Abschnitte, `first_use`) sind UUIDs in Kleinbuchstaben; Kennungen im Ausdruck (`key`) nach Abschnitt 6.1. Die Typen von Elementen und Objekten sind Zeichenketten. Ein Dokument mit einem unbekannten Elementtyp oder Objekttyp ist deshalb gültig und wird geladen; alle Belegungen bleiben beim Schreiben unverändert erhalten, die Konsistenzprüfung meldet den Typ (`type.unknown`). Ein solches Element hat einen Eingang; seine Ausgänge sind die Ausgänge, von denen im Dokument Verbindungen ausgehen (Hinweis S20); neue Verbindungen von ihm gibt es nicht. Gespeichert werden nur Kennungen und die Namen des Anwenders, keine übersetzten Texte; die Herkunft einer Instanz aus einer mitgelieferten Vorlage oder einem Objekttyp speichert nur dessen Kennung.

### 10.1 Lesen des Formats 1.0

`parse_document` und `read_document` erkennen ein Dokument mit `format_version` `1.<n>`, prüfen es mit den Modellen von `documents/v1.py` (streng wie bisher) und wandeln es in ein Dokument 2.0 um (`upgrade.py`, Spezifikation 3.7); die Datei wird erst beim nächsten Speichern als 2.0 geschrieben. Die Umwandlung:

- Kennung im Ausdruck (`key`): der bisherige Name; Ausdrücke bleiben unverändert gültig. Fällt er ohne Unterscheidung von Groß- und Kleinschreibung mit einem Objekt der Anwendung oder einer Funktion zusammen, bildet die Umwandlung eine eindeutige Kennung nach 6.1 und ersetzt ihn in den Ausdrücken seines Namensraums. Eine Bedingung oder Berechnung ohne bisherigen Namen erhält eine Kennung aus ihrer bisherigen Bezeichnung.
- Name: die bisherige Bezeichnung, wo es eine gibt, sonst der bisherige Name; bei einem Element, das ein Objekt zeigt, die Bezeichnung des Elements als Name der Instanz. Programmierschreibweise (`_` und kein Leerzeichen) wird zu Wörtern mit großem Anfangsbuchstaben (`name_from_programming_name`: „Stop abstand“, „Order ausgefuehrt“); Umlaute stellt sie nicht wieder her, `EMA20` bleibt.
- Herkunft aus einer mitgelieferten Vorlage oder einem Objekttyp: nur die Kennung, der gespeicherte Name entfällt.
- Die Lage auf der Zeichenfläche entfällt (`position` ist `null`).
- Der Parameter `kursquelle` des `EMA` wird `anwenden_auf` mit demselben Wert.
- Parameter und Eigenschaften `instrument` erhalten die Vorbelegung „Instrument der Anwendung“.
- Eingänge und Abschnitte sind leer, die Ausrichtung ist senkrecht, kein Rahmen ist eingeklappt; Verbindungen erhalten eine Kennung, die aus Quelle, Ausgang und Ziel abgeleitet ist (UUID Version 5).
- Hat eine Order- und Positionsverwaltung ohne eigene Auslöser genau ein Element ohne eingehende Verbindung, legt die Umwandlung die Verbindung vom Ausgang `gestellt` zu ihm an. Sonst legt sie keine an; die Prüfung meldet die Elemente, die kein Auslöser erreicht.
- Ein Element mit unbekanntem Typ bleibt mit allen Belegungen unverändert erhalten. Das gilt für „Parameter setzen“ (`flow.set_parameter`) und für Instanzen von `Markttechnik`, die nicht mehr mitgeliefert werden (Abschnitt 4): Sie bleiben im Dokument, der Typ ist unbekannt und die Prüfung meldet ihn (`type.unknown`).
- Ein Auslöser `trigger.manual_start` wird `trigger.manual`.
- Das Feld `first_use` jeder Instanz ist `null`; 1.0 kennt weder die erste Verwendung noch „Aktualisieren“, noch Eingänge mit Methode. Das Element der ersten Verwendung ergibt sich dann aus dem Ablauf (Abschnitt 9.5).
- Verwendet ein Element einer Order- und Positionsverwaltung mit eigenen Auslösern eine Instanz, deren erste Verwendung im Hauptablauf liegt, legt die Umwandlung dort einen Eingang mit „Aktualisieren“ an (Spezifikation 3.7, `refresh` wahr), damit die Order- und Positionsverwaltung bei ihren Auslösern mit aktuellen Werten rechnet und nicht mit dem Stand beim Aufgeben der Order. Je verwendete Eigenschaft der Instanz entsteht ein Eingang (nur eine Eigenschaft, keine Methode, keine Eigenschaft in einer enthaltenen Instanz; höchstens `MAX_INPUTS_PER_ELEMENT` Eingänge je Element), und nur bei einer Instanz, deren Typ „Aktualisieren“ vorsieht. Eine Order- und Positionsverwaltung ohne eigene Auslöser läuft in der Auswertung, die die Order gestellt hat, und erhält keinen Eingang; ebenso keine Instanz, deren erste Verwendung in einer Order- und Positionsverwaltung liegt. Die Umwandlung wertet dafür das umgewandelte Dokument mit `analyze_usage` aus.

Die gesicherte Strategie „EMA-Trendfolge“ des Auftraggebers (Format 1.0) lässt sich so ohne Fehler der Umwandlung lesen und hat danach keinen Befund der Konsistenzprüfung, auch keinen Hinweis. Ihre Order- und Positionsverwaltung hat einen eigenen Auslöser; die Umwandlung legt deshalb Eingänge mit „Aktualisieren“ an: `Kreuzen gegen die position` (`ema20.wert`, `ema50.wert`) und `Neuer Stop-Loss` (`atr14.wert`). Ein Test prüft Namen und Bedeutung ihrer Ausdrücke.

### 10.2 Schemata

Die JSON-Schemata (Draft 2020-12) des Formats 2.0 liegen unter `contracts/strategies/v2/` und werden aus den Modellen erzeugt. Die Schemata des Formats 1.0 unter `contracts/strategies/v1/` bleiben unverändert (Prüfdaten für das Lesen). Der Befehl, der die Schemata von 2.0 neu erzeugt (im Verzeichnis `packages/domain-core`):

```sh
uv run --frozen python -m pipwerk_domain.documents.schemas ../../contracts/strategies/v2
```

Mit `--check` schreibt der Befehl nichts und endet mit Exitcode 1, wenn eine Datei von den Modellen abweicht. Dasselbe leistet der Eintrag `pipwerk-domain-schemas`, der mit dem Paket installiert wird. Ein Test vergleicht die erzeugten Schemata mit den Dateien.

Das Schema drückt Typen, zusätzliche Felder, Kennungsmuster, die Hauptversion und die Begrenzungen von Längen und Anzahlen aus. Die Schachtelungstiefe eines Ausdrucks und die Schachtelung von Instanzen prüft die Bibliothek beim Lesen; das Schema kann sie nicht ausdrücken.

### 10.3 Testfalldokumente

Die Testfälle `str-01` und `str-03` (Spezifikation Abschnitt 6) liegen im Format 2.0 als `contracts/strategies/v2/testcases/str-01.strategy.json` und `str-03.strategy.json`. Sie sind vollständig, in normalisierter Schreibweise, mit Namen in Händlersprache und Kennungen nach Spezifikation Abschnitt 6, ohne Lage, mit der Regel der Strategie `risiko` aus „Risiko je Trade“ (1 %) und der Regel des Elements `mindestvolumen`. Beide bestehen die Konsistenzprüfung ohne Befund, auch ohne Hinweis. Die Dateien sind in der Schreibweise der Fassung vom 2026-10-23 geschrieben (Eingänge mit `kind`, `arguments` und `refresh`, Instanzen mit `first_use`).

- `str-01` verwendet den `ZigZag` (req-fach-054): die Instanzen `zz_signal` („ZigZag Signal“, Zeiteinheit aus `signalzeiteinheit`) und `zz_handel` („ZigZag Handel“, Zeiteinheit aus `handelszeiteinheit`), Depth, Deviation und Backstep mit den Standardwerten, Instrument der Anwendung. Die Berechnungen `trend_signal` und `trend_handel` ermitteln den Trend aus den vier Eigenschaften `letztes_hoch`, `vorletztes_hoch`, `letztes_tief` und `vorletztes_tief` und sind das Element der ersten Verwendung von `zz_signal` und `zz_handel` (`first_use`). Einstieg und Stop-Bezug rechnen `einstieg`, `stop` und `ziel` aus `zz_handel.letztes_hoch` und `zz_handel.letztes_tief`. Die Order- und Positionsverwaltung hat die Auslöser `Tick` und `Kerzenschluss`; sie verwendet `zz_handel` mit „Aktualisieren“ (Eingänge mit `refresh` wahr), weil sie sonst den Stand beim Aufgeben der Order sähe (Spezifikation 3.3). Die Werte der Strategieparameter legt der Testfall fest, die Spezifikation nennt sie nicht.
- `str-03` verwendet `ema20`, `ema50` (Element der ersten Verwendung „Kreuzen“) und `atr14` („Stop-Loss“); die Order- und Positionsverwaltung verwendet alle drei mit „Aktualisieren“.

Die Kennungen der Elemente und Verbindungen sind abgeleitet (UUID Version 5). Die Dokumente unter `contracts/strategies/v1/testcases/` und `v1/examples/` bleiben als Prüfdaten für das Lesen von 1.0; das Dokument 1.0 von `str-01` verwendet `Markttechnik`, was die Umwandlung als unbekannten Typ lässt (Abschnitt 10.1).

### 10.4 Beispieldokumente

Unter `contracts/strategies/v2/examples/` liegen dreizehn Beispieldokumente für die Prüfung der Web-API über `/docs`, die `docs/technical/pipwerk-studio.md` („Web-API ausprobieren“) beschreibt: die Regelvorlage `regel-vorlage.rule.json`, ihre geänderte Fassung `regel-vorlage-geaendert.rule.json` und elf Fassungen von `str-03` mit je einer Änderung, die je einen bestimmten Befund der Konsistenzprüfung auslöst (`str-03-*.strategy.json`). Die vier neuen zeigen die Befunde aus den Abschnitten 6.2 und 9.5: `str-03-instanz-nicht-verwendbar` (eine Berechnung auf dem Ausgang `falsch` von „Kreuzen“ nennt `atr14`, dessen erste Verwendung auf `wahr` liegt: `instance.not_usable`), `str-03-instanz-ohne-verbindung` (`instance.unconnected`), `str-03-manuell-in-order-und-positionsverwaltung` (`trigger.manual_in_management`) und `str-03-doppelter-name` (`name.duplicate`). Bei `str-03-order-im-indikator` kommt zu `rule.order_in_indicator` der Befund `instance.unconnected` hinzu, weil nichts den neuen Indikator verwendet. Sie sind gültig gegen das Schema und in der Schreibweise, in der die Ablage sie speichert (`write_document(read_document(Text))` gleich dem Text; `tests/test_schemas.py`). Die Kennung im Dokument ersetzt die Web-API beim Anlegen; bei `PUT` muss sie die Kennung des Pfads sein. Die Befunde prüfen die Tests des Backends (`test_web_api_documentation_examples.py`).

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
| `MAX_INPUT_ARGUMENTS` | 20 | Werte der Argumente in einem Eingang, der eine Methode nennt |
| `MAX_ITEMS_PER_REQUEST` | 50 | Einträge je Anfrage an `/api/v1/expressions` |
| `MAX_NAMES_PER_ITEM` | 500 | sichtbare Namen, die die Antwort zu einem Eintrag von `/api/v1/expressions` nennt; weitere entfallen, die Antwort sagt es |
| `MAX_PROPERTIES_PER_NAME` | 200 | Eigenschaften, die die Antwort zu einem sichtbaren Namen nennt; weitere entfallen, die Antwort sagt es |
| `MAX_FINDINGS_PER_EXPRESSION` | 50 | alle Befunde je Ausdruck zusammen. Die Liste ist abschließend: `expression.invalid`, `expression.empty`, `instrument.invalid`, `rule.unresolved_name` (auch Hinweise), `expression.order_outside_management`, `rule.result_mismatch` und `rule.order_in_indicator`. `rule.order_in_indicator` gehört bei einer Regel zum Ausdruck der Regel, bei einem Regelwerk zu dessen Ergebnisausdruck. Kein anderer Befund zählt dazu, insbesondere nicht `calculation.circular_reference` und `candle.no_instance`, denn sie betreffen mehrere Ausdrücke oder den Ablauf. Fallen weitere an, folgt genau ein `findings.truncated` (`scope` = `expression`) als letzter Befund des Ausdrucks; danach kommt kein Befund dieses Ausdrucks mehr. Die Zählung geschieht an einer Stelle der Prüfung (`Checker._expression_finding`) |
| `MAX_FINDINGS_PER_CHECK` | 1000 | Befunde je Prüfung einer Strategie oder Vorlage; die Prüfung endet, dazu kommt `findings.truncated` (`scope` = `check`) |
| `MAX_NAMES_PER_CHECK` | 20000 | erkannte Namen, die eine Prüfung zurückgibt, wenn danach gefragt wird (`check_strategy_with_names`, `check_template_with_names`, Abschnitt 9.3); weitere entfallen, `CheckResult.names_truncated` ist dann wahr. Die Befunde sind davon nicht berührt |
| `MAX_USAGE_ENTRIES` | 20000 | Elemente, die der Bericht über die Verwendung (`analyze_usage`, `/api/v1/usage`) für alle Instanzen zusammen als Stellen nennt, an denen eine Instanz verwendbar ist (Abschnitt 9.5); danach bleibt die Liste einer Instanz leer, und der Bericht sagt es (`usable_at_omitted`, `truncated`) |

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
| `test_catalog.py` | alle mitgelieferten Typen, Gruppen (je Typ, `Tick` als Auslöser und als Objekt), `Manuell`, `ZigZag`, kein „Parameter setzen“ und keine `Markttechnik`, leeres Feld `methods` und `can_refresh` je Typ, Namen, Beschriftungen und Erklärungen in beiden Sprachen, keine Kennung in Programmierschreibweise in Texten, Kennungen nach der Bildungsregel, von der Anwendung belegte Eigenschaften, Parameter `instrument`, Funktionsliste |
| `test_methods.py` | Typen mit Methoden, die der Test im Elementregister anmeldet (`methods_support.py`): Beschreibung und Prüfung der Methoden im Register, Zerlegung, Typprüfung mit passenden und unpassenden Argumenten, Anzeigeform in beiden Sprachen, Bausteine in beide Richtungen, Zeichen, sichtbare Namen mit Argumenten, Satz, `PREVIOUS` mit dem Ergebnis einer Methode, Befunde der Prüfung, Eingänge mit Methode |
| `test_type_fields.py` | die Felder `holds_management`, `named` und `strategy_parameters` bei den mitgelieferten Typen mit Gegenprobe, Standardwerte bei einem über den Einstiegspunkt angemeldeten Typ, ein Typ mit zwei Ausgängen mit der Order- und Positionsverwaltung (`register`, Einstiegspunkt, Protokoll), Zeiteinheiten in `choices` |
| `test_parser.py` | Zerlegung: Werte, Operatoren, Rangfolge, Funktionen, Schreibfehler mit Stelle, Begrenzungen |
| `test_expression_check.py` | Typprüfung mit gültigen und fehlerhaften Fällen je Regel, Auswahlwerte, erkannte Namen, Normalisierung |
| `test_forms_and_blocks.py` | Anzeigeform und gespeicherte Form in beide Richtungen und beiden Sprachen, eckige Klammern, Bausteine in beide Richtungen, die Kreuzung als ausgeschriebener Baum aus „vorheriger Wert von“, Vergleichen und Verknüpfungen in drei Richtungen, auch in `AND` und `OR`, ohne Baustein „Kreuzung“, die gespeicherten Kreuzungen von `str-01`, `str-03` und der gesicherten „EMA-Trendfolge“ unverändert zurück, `PREVIOUS`, Zeichen mit Art und Stelle, sichtbare Namen (Ergebnis nach Bedingung und Berechnung, Instanz mit Inhalt, Regelwerk, Kennzeichen „früherer Wert“ je Wert, Wort des Datentyps je Wert), Satz einer ausgeschriebenen Kreuzung |
| `test_finding_names.py` | Name des Elements, Name der Instanz oder Regel und Beschriftung des Felds jedes Befunds in beiden Sprachen: neun Befunde gleichen Texts unterscheidbar, Parameter und Eigenschaften des Elements, Instanz, Regel, Strategieparameter, Eingang, Element ohne Namen, unbekannter Typ, Vorlage, Wörterbuch und Vergleich eines Befunds |
| `test_datatype_labels.py` | Wörter der Datentypen in beiden Sprachen, Name des Objekttyps beim Datentyp Objekt, Vorbelegung des Instruments mit „Instrument der Anwendung“ und der Rückweg dorthin als gültiges Dokument |
| `test_texts.py` | Texte der mitgelieferten Typen, Funktionen und der Regelvorlage in beiden Sprachen: „Order- und Positionsverwaltung“ ohne Kurzform, die Strategie „rechnet“ nicht, keine Kreuzung als Beispiel, jeder Text in beiden Sprachen |
| `test_operations.py` | Entfernen von Strategieparameter, Element, Regel mit allen Verwendungen, leerer Platz, Entfernen mit allem, was eine Instanz oder ein Regelwerk enthält, Verwendungen vor dem Entfernen (Elemente und Regeln, Eingang, Datenverbindung) |
| `test_consistency_flow.py` | Befunde des Ablaufs, der Parameter, der Belegungen, von `Order`/`Position`, der Typen und der Kerze, jeweils mit Gegenprobe |
| `test_consistency_rules.py` | Ergebnis von Regeln, Regelwerke, Regeln in Indikatoren und Trends, Namen und Parameter von Regeln im gemeinsamen Namensraum, Zusammenhang der Typprüfung (S18, S27), Namen |
| `test_consistency_v2.py` | Befunde des Formats 2.0 mit Gegenprobe: Erreichbarkeit, Hinweis ohne Auslöser, festes Instrument, leerer Platz, Datenverbindungen, Eingänge, unzulässige Verbindungen, doppelte Namen, Abschnitte |
| `test_documents.py` | Schreiben und Lesen jedes Dokumenttyps, Eingänge jeder Art (Eigenschaft, Methode, „Aktualisieren“, Dokument ohne diese Angaben), `first_use`, die bisherige Kennung von „Start von Hand“, zusätzliche Felder, höhere Hauptversion, unbekannte Typen, jede Begrenzung am Grenzwert und darüber |
| `test_upgrade.py` | Lesen von 1.0 mit allen Punkten der Umwandlung, Eingänge mit „Aktualisieren“ für eine Order- und Positionsverwaltung mit eigenen Auslösern (und keine ohne eigene Auslöser, bei erster Verwendung in der Order- und Positionsverwaltung, nur je verwendete Eigenschaft), `Manuell`, „Parameter setzen“ und `Markttechnik` als unbekannte Typen, Testfalldokumente 1.0, gesicherte „EMA-Trendfolge“ mit ihren Eingängen und ohne Befund |
| `test_schemas.py` | erzeugte Schemata gleich den Dateien, Schemata gegen Dokumente und Beispieldokumente, Befehl |
| `test_testcases.py` | beide Testfalldokumente (`CHECKED_TESTCASES`, Abschnitt 10.3): Schema, Schreiben und Vergleichen, Kennungen, null Fehler und kein Hinweis, Normalisierung ändert nichts, Vollständigkeit nach Abschnitt 6, abgewandelte Fassungen mit den Befunden |
| `test_usage.py` | Element der ersten Verwendung (gespeichert, im Ablauf, über eine andere Instanz, über eine Regel der Strategie), Reihenfolge des Ablaufs, Wege über Verzweigung, Zusammenführung, Rückführung, mehrere Auslöser, Order- und Positionsverwaltung mit und ohne eigene Auslöser, Order- und Positionsverwaltung in einer Order- und Positionsverwaltung, verwendbare Stellen und verborgene Instanzen, `instance.not_usable`, `instance.unconnected`, „Aktualisieren“ bei einem Typ ohne `can_refresh`, `Manuell` in einer Order- und Positionsverwaltung, Bericht, ein Dokument an der Grenze der Elemente |
| `test_namespace.py` | gemeinsamer Namensraum: enthaltene Instanzen und Regeln überall ansprechbar, doppelte Namen und Kennungen (auch tief, in Regelwerken, gegen die Objekte der Anwendung), kein Verdecken, Strategieparameter, Parameter einer Regel oder Vorlage gegen den Namensraum, Namensraum einer Vorlage, Inhalt einer Instanz sieht nur sich |
| `test_insert.py` | Einfügen einer Vorlage und eines Objekttyps: Namen, Kennungen, Umschreiben der Ausdrücke, vergebene Namen, Herkunft, Fehler |
| `test_graph.py` | Dominanz: Kette, Verzweigung, Zusammenführung, Rückführung, mehrere Starts, nicht erreichte Knoten, lange Kette ohne Rekursion |
| `test_risk_rule.py` | „Risiko je Trade“ als Regel der Strategie und eines Elements, Bestandteile, Namen in beiden Sprachen, Kopie |
| `test_architecture.py` | keine Frameworks, Pydantic nur in `documents`, kein `eval`/`exec`/`compile`, keine festen Pfade, Ports und Rechnernamen, Laufzeitabhängigkeit nur Pydantic |
| `test_hardening.py` | Strategieparameter in Vorlagen und Instanzen, Zahlen ohne JSON-Wert, doppelte Schlüssel, Namen und Zahlen in ASCII, lange Ketten und Kreise von Berechnungen, fehlerhafte Einstiegspunkte, Grenzen der Befunde mit Zeit und Speicher, Stelle bei Auswahlwerten, Trend ohne Richtung |
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
14. Methoden (Auftrag 09): Die Spezifikation legt die Felder nur dem Inhalt nach fest (3.1). Die Namen der Felder legt die Umsetzung fest: `methods` und `can_refresh` an der Typbeschreibung, `arguments` an der Methode; die Felder stehen in der OpenAPI-Beschreibung der Web-API. Methoden sind Mitglieder des Objekts neben den Eigenschaften; ihre Kennung darf nicht die einer Eigenschaft desselben Typs sein. Ein Aufruf einer Methode schreibt die Argumente in der Reihenfolge der Beschreibung und lässt nur optionale Argumente am Ende weg.
15. Die Befunde im Ausdruck zu Methoden verwenden die vorhandenen Arten (`argument_count`, `type_mismatch`, `unknown_choice_value`) mit neuen Gründen und die neue Art `unknown_method` (Abschnitt 7.3); die Prüfung eines Eingangs mit einer Methode meldet `data.unknown` mit den Gründen `unknown_method` und `arguments`. Texte dazu schreibt die Oberfläche.
16. Eine Methode ohne Klammern ist ein Befund (`argument_count`, `call_missing`), weil der Name sonst nicht von einer Eigenschaft unterschieden werden könnte und die Anzeigeform nicht eindeutig wäre.
17. Verwendbarkeit (Auftrag 10, Abschnitt 9.5): Die Reihenfolge des Ablaufs für das Element der ersten Verwendung ist die Tiefensuche mit den Ausgängen in der Reihenfolge ihres Typs, Hauptablauf vor den Order- und Positionsverwaltungen. Elemente, die kein Auslöser erreicht, und Instanzen, deren erste Verwendung kein Auslöser erreicht, erhalten keinen Befund zum Weg, weil sie schon `flow.not_reached` erhalten. Ein gespeichertes Element der ersten Verwendung, das die Instanz nicht verwendet, gilt als nicht gespeichert.
18. Eine enthaltene Instanz ist im Ausdruck überall ansprechbar, aber keine Instanz auf der Zeichenfläche: Eingang und Datenverbindung nennen sie nicht (in einer Vorlage, die für sich geprüft wird, nennt eine Datenverbindung weiter die Instanzen der Vorlage).
19. Namensvorschlag (Abschnitt 6.3): Für eine enthaltene Instanz oder Regel auf tieferer Ebene dient der neue Name der umgebenden Instanz als Anfang des Vorschlags; die Spezifikation nennt nur die Instanz der obersten Ebene.
20. Die Prüfung der Parameter gegen den Namensraum (Abschnitt 6.2) vergleicht Namen und Kennungen mit allen Namen und Kennungen der Strategie, auch mit denen anderer Instanzen, wie die Spezifikation es sagt.
21. Die Umwandlung von 1.0 legt je verwendete Eigenschaft einen Eingang mit „Aktualisieren“ an (Abschnitt 10.1); die Spezifikation spricht von „einem Eingang“.
