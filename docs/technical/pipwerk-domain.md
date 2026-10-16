# Gemeinsame Python-Bibliothek `pipwerk_domain` – technische Dokumentation

## Dokumentstatus

- status: `draft`
- stand: 2026-10-16
- komponente: `packages/domain-core` (Paket `pipwerk_domain`, Version `0.1.0`)
- grundlage: Vorhaben `strategiedesign`, Spezifikation Abschnitte 1 bis 3, 6 bis 10, Arbeitspaket `wp01`, Auftrag 01

## 1. Gegenstand

Die Bibliothek `pipwerk_domain` ist die gemeinsame Python-Bibliothek von pipwerk (E1 der Spezifikation). Sie enthält

- die Typbeschreibungen aller Element- und Objekttypen und das Elementregister,
- das Objektmodell (Strategie, Element, Instanz, Verbindung, Verwaltung, Vorlage),
- die Namensräume, in denen Ausdrücke Namen auflösen,
- die Ausdrücke: Zerlegung, Typprüfung, Funktionen und Normalisierung,
- die Konsistenzprüfung mit allen Befunden,
- das Lesen und Schreiben der Dokumente mit den JSON-Schemata.

Die Bibliothek wertet Ausdrücke nicht aus und führt keine Strategie aus. Sie hängt von keinem Framework ab. Pydantic wird nur im Teilpaket `pipwerk_domain.documents` verwendet; das Objektmodell besteht aus einfachen Python-Klassen (`dataclass`) ohne Pydantic. Texte für Befunde erzeugt die Bibliothek nicht (req-ui-007): Sie liefert Kennungen und Angaben, die Oberfläche schreibt die Texte.

## 2. Aufbau des Pakets

Das Paket liegt in `packages/domain-core/`. Quelltext unter `src/pipwerk_domain/`, Tests unter `tests/`.

| Datei oder Teilpaket | Inhalt |
| --- | --- |
| `typedesc.py` | Typbeschreibung (`TypeDescription`) mit Parametern, Eigenschaften, Ausgängen; Datentypen, Bindungsarten, Zeiteinheiten |
| `identifiers.py` | Bildungsregel für Kennungen (`identifier_from_name`) |
| `registry.py` | Elementregister (`ElementRegistry`), Einstiegspunkt `pipwerk.element_types` |
| `catalog.py` | mitgelieferte Typen mit Beschriftungen in Deutsch und Englisch |
| `defaults.py` | `create_registry()` und `default_registry()`: Register mit den mitgelieferten Typen und den Typen der Einstiegspunkte |
| `model.py` | Objektmodell: `Strategy`, `Element`, `Connection`, `Management`, `Instance`, `Template`, `Binding`, `Origin` und weitere |
| `risk_rule.py` | Regelvorlage „Risiko je Trade“ mit fester UUID |
| `normalize.py` | Normalisierung aller Ausdrücke einer Strategie oder Vorlage (`normalize_strategy`, `normalize_template`) |
| `limits.py` | Begrenzungen gegen Überlast als Konstanten |
| `namespaces.py` | Namensräume: Objekte der Anwendung, Symbole von Parametern, Eigenschaften und Instanzen |
| `expressions/` | Ausdrücke: `lexer.py`, `parser.py`, `nodes.py` (Syntaxbaum), `functions.py` (Funktionsliste), `exprtypes.py` (Typen und Verträglichkeit), `symbols.py` (Symbole und Namensräume), `checker.py` (Typprüfung, erkannte Namen, Normalisierung) |
| `consistency/` | Konsistenzprüfung: `engine.py` (Prüfung), `findings.py` (Befunde und ihre Kennungen), `graph.py` (Rückführungen, Erreichbarkeit) |
| `documents/` | Dokumente: `models.py` (Pydantic-Modelle), `convert.py` (Übersetzung in beide Richtungen), `io.py` (Lesen und Schreiben als JSON-Text), `schemas.py` (JSON-Schemata) |

Wichtige Einstiege:

| Aufgabe | Aufruf |
| --- | --- |
| Register mit allen Typen | `pipwerk_domain.defaults.default_registry()` |
| Typbeschreibung abfragen | `registry.get("EMA")`, `registry.list()`, `registry.list(ElementKind.TRIGGER)` |
| Funktionen abfragen | `pipwerk_domain.expressions.list_functions()` |
| Ausdruck prüfen | `pipwerk_domain.expressions.analyze(text, umgebung, erwartet)` |
| Ausdruck normalisieren | `pipwerk_domain.expressions.normalize_expression(text, umgebung)` |
| alle Ausdrücke einer Strategie oder Vorlage normalisieren | `pipwerk_domain.normalize.normalize_strategy(strategy)`, `normalize_template(template)` (liefern eine Kopie) |
| Strategie oder Vorlage prüfen | `pipwerk_domain.consistency.check_strategy(strategy)`, `check_template(template)` |
| Dokument lesen | `pipwerk_domain.documents.read_document(text)` (liefert `Strategy` oder `Template`) |
| Dokument schreiben | `pipwerk_domain.documents.write_document(objekt)` |
| Dokument nur auf das Format prüfen | `pipwerk_domain.documents.parse_document(text_oder_dict)` |
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
| `name`, `description` | Name und Beschreibung, je `Label(de, en)` |
| `parameters` | Parameter: `id`, `datatype`, `label`, `required` (Pflicht), `default` (Standardwert), `choices` (zulässige Werte einer Auswahl, je `id` und `label`), `bindings` (erlaubte Bindungsarten), `applies_when` (gilt nur bei einem Wert eines anderen Parameters: `Condition(name, value)`), `object_type` |
| `properties` | Eigenschaften: `id`, `datatype`, `label`, `must` (MUSS, sonst KANN), `set_by_user` (bei Ordertypen: ob der Anwender sie belegt), `default`, `choices`, `applies_when`, `object_type` |
| `outputs` | Ausgänge eines Elements des Ablaufs: `id` und `label` |
| `rules_allowed` | ob dem Element Regeln und Regelwerke zugeordnet werden können |
| `on_canvas` | ob der Typ als Element auf die Zeichenfläche gelegt werden kann |
| `builtin` | mitgeliefert; mitgelieferte Typen und die Regelvorlage „Risiko je Trade“ lassen sich nicht ändern oder löschen (E6) |
| `by_user` | ob der Anwender den Typ wählen kann; `CloseOrder` entsteht nur über „Position schließen“ und ist deshalb nicht wählbar |

Datentypen (`DataType`): `number` (Zahl), `integer` (Ganzzahl), `percent` (Prozent; im Ausdruck ein Anteil, 1 % ist 0,01, ein fester Wert wird als `0.01` gespeichert), `boolean` (Wahrheitswert), `text`, `choice` (Auswahl mit festen Werten und Kennungen), `time_unit` (Zeiteinheit), `timestamp` (Zeitpunkt, ISO 8601), `date` (Datum, ISO 8601), `expression` (Ausdruck) und `object`.

Der Datentyp `object` ist eine Festlegung der Umsetzung: Die Spezifikation 3.1 nennt keinen Datentyp für Eigenschaften, deren Wert ein Objekt der Anwendung ist (`Order.konto`, `Order.instrument`, `Position.instrument`, `CloseOrder.position`). Solche Eigenschaften haben den Datentyp `object` und im Feld `object_type` den Objekttyp; in Ausdrücken lassen sich ihre Eigenschaften weiter ansprechen (`Order.konto.kapital`).

Zeiteinheiten (`time_unit`): alle Zeiteinheiten von MetaTrader 5, mit Kennungen nach der Bildungsregel aus ihrem Namen: `m1`, `m2`, `m3`, `m4`, `m5`, `m6`, `m10`, `m12`, `m15`, `m20`, `m30`, `h1`, `h2`, `h3`, `h4`, `h6`, `h8`, `h12`, `d1`, `w1`, `mn1`. Beschriftungen sind `M1` bis `MN1`.

Bindungsarten (`BindingKind`): `fixed` (fester Wert), `parameter` (Strategieparameter oder, innerhalb einer Vorlage, Parameter der Vorlage), `expression` (Ausdruck), `application` (bei der Anwendung übergeben). Parameter vom Datentyp `expression` (der Ausdruck einer Bedingung oder Berechnung) lassen nur `expression` zu; der Ordertyp und der Strategieparameter von „Parameter setzen“ nur `fixed`.

### 3.2 Bildungsregel für Kennungen

`identifier_from_name(name)` bildet die Kennung von Eigenschaften, Parametern, Ausgängen und festgelegten Werten aus dem deutschen Namen (Spezifikation 3.1): Kleinbuchstaben, `ä`, `ö`, `ü` als `ae`, `oe`, `ue`, `ß` als `ss`, Leerzeichen und Bindestrich als `_`, andere Zeichen entfallen. Ein vorhandener Unterstrich bleibt erhalten, damit die Funktion auf eine Kennung angewendet diese Kennung zurückgibt (Festlegung der Umsetzung). Beispiele: „Punkt 1/3“ ergibt `punkt_13`, „Stop-Loss“ `stop_loss`, „Tickgröße“ `tickgroesse`, „aufwärts“ `aufwaerts`, „nicht gestellt“ `nicht_gestellt`, „geändert“ `geaendert`.

Objekttypen und Elementtypen tragen eine feste Kennung (Abschnitt 4): die Objekte der Anwendung und Objekttypen ihren Namen aus dem Fachmodell (`Konto`, `Order`, `EMA`, `Indikator`), die Auslöser und Elemente des Ablaufs eine Kennung mit Vorsatz (`trigger.candle_close`, `flow.condition`).

### 3.3 Elementregister

`ElementRegistry` führt alle Typbeschreibungen: `register(beschreibung)` meldet einen Typ an (eine Kennung nur einmal, sonst `RegistryError`), `get(kennung)` fragt nach der Kennung, `list(art=None)` liefert die Typen in der Reihenfolge der Anmeldung, optional einer Art.

Zwei Beschreibungen vervollständigt das Register bei der Abfrage aus anderen Anmeldungen:

- `Trend`: Der Parameter `berechnungsverfahren` hat als Werte die Kennungen aller angemeldeten Typen der Art `trend_method`. Deren Parameter erscheinen zusätzlich beim `Trend`, mit `applies_when` auf den Wert von `berechnungsverfahren` (req-param-005). Mitgeliefert ist `trend_method.expression` (Verfahren „Ausdruck“) ohne eigene Parameter.
- `flow.place_order`: Der Parameter `ordertyp` hat als Werte die Kennungen aller angemeldeten Ordertypen mit `by_user`.

#### Einstiegspunkt `pipwerk.element_types`

Weitere Pakete melden Typen über den Einstiegspunkt `pipwerk.element_types` an (E7). Der Einstiegspunkt verweist auf

- eine `TypeDescription`, oder
- eine Folge von Typbeschreibungen, oder
- eine Funktion, die ein Objekt mit der Methode `register(beschreibung)` erhält und dort anmeldet.

`ElementRegistry.load_entry_points()` lädt alle Einstiegspunkte der Gruppe, `create_registry()` ruft sie auf. Ein fehlerhafter Einstiegspunkt (Ladefehler, Ausnahme beim Anmelden, `SystemExit` beim Laden, falscher Rückgabetyp, doppelte Kennung) verhindert das Laden der übrigen nicht. Die Einstiegspunkte werden für jedes installierte Paket einzeln gelesen (`importlib.metadata.distributions()`, je Paket in einem eigenen Schutz). Fehlerhafte Metadaten eines Pakets (zum Beispiel eine Zeile ohne `=` in `entry_points.txt`, auch in einer anderen Gruppe, oder unlesbare Metadaten) schließen nur dieses Paket aus; die gültigen Einstiegspunkte aller anderen Pakete werden geladen, und die mitgelieferten Typen sind immer vorhanden. Das ausgeschlossene Paket erscheint in einer Warnung nur mit seinem Namen und der Klasse der Ausnahme. Ein fehlerhafter Einstiegspunkt meldet nichts an – auch nichts von dem, was er vor dem Fehler angemeldet hätte – und wird mit dem Namen des Einstiegspunkts und der Klasse der Ausnahme protokolliert (Logger `pipwerk_domain.registry`, Stufe `WARNING`), ohne Ausnahmetext, ohne Rückverfolgung und ohne Pfad. Der Rückgabewert `LoadReport` nennt die geladenen und die fehlgeschlagenen Einstiegspunkte. Zum Testen lässt sich eine Liste nachgebildeter Einstiegspunkte (Objekte mit `name` und `load()`) übergeben.

## 4. Mitgelieferte Typen und Kennungen

Die mitgelieferten Typen stehen nur in der Bibliothek (`catalog.py`), nicht im Backend und nicht in der Oberfläche (E2, E6). Jeder Typ, jeder Parameter, jede Eigenschaft, jeder Ausgang und jeder Wert einer Auswahl hat Beschriftungen in Deutsch und Englisch. Die folgende Liste nennt alle Kennungen; ein Test vergleicht sie mit dem Code.

### 4.1 Auslöser und Elemente des Ablaufs

Alle Parameter lassen die vier Bindungsarten zu, außer wo „nur …“ steht.

| Kennung | Name (de) | Parameter | Eigenschaften | Ausgänge | Regeln |
| --- | --- | --- | --- | --- | --- |
| `trigger.candle_close` | Kerzenschluss | `zeiteinheit` (Zeiteinheit, Pflicht) | – | `weiter` | nein |
| `trigger.tick` | Tick | – | – | `weiter` | nein |
| `flow.condition` | Bedingung | `ausdruck` (Ausdruck, Pflicht, nur `expression`) | `ergebnis` (Wahrheitswert) | `wahr`, `falsch` | nein |
| `flow.calculation` | Berechnung | `ausdruck` (Ausdruck, Pflicht, nur `expression`) | `ergebnis` (Datentyp `expression`: ergibt sich aus dem Ausdruck) | `weiter` | nein |
| `flow.set_parameter` | Parameter setzen | `strategieparameter` (Text, Pflicht, nur `fixed`), `ausdruck` (Ausdruck, Pflicht, nur `expression`) | – | `weiter` | nein |
| `flow.place_order` | Order aufgeben | `ordertyp` (Auswahl, Pflicht, nur `fixed`; Werte `MarketOrder`, `StopOrder`, `LimitOrder`, `StopLimitOrder`) | die Eigenschaften des gewählten Ordertyps | `gestellt`, `nicht_gestellt` | ja |
| `flow.modify_order` | Order ändern | `preis`, `limitpreis`, `stop_loss`, `take_profit` (Zahl), `gueltigkeit` (Auswahl), `ablaufzeit` (Zeitpunkt, gilt bei `gueltigkeit` = `bis_zeitpunkt`), `datum` (Datum, gilt bei `gueltigkeit` = `bis_ende_eines_tages`); alle optional, ohne Wert bleibt die Angabe unverändert | – | `geaendert`, `nicht_geaendert` | ja |
| `flow.delete_order` | Order löschen | – | – | `weiter` | nein |
| `flow.modify_position` | Position ändern | `stop_loss`, `take_profit` (Zahl, optional) | – | `geaendert`, `nicht_geaendert` | ja |
| `flow.close_position` | Position schließen | `volumen` (Zahl, optional; ohne Wert wird ganz geschlossen) | – | `weiter` | ja |

Auf die Zeichenfläche lassen sich alle diese Typen legen (`on_canvas`). `flow.modify_order`, `flow.delete_order`, `flow.modify_position` und `flow.close_position` stehen nur in einer Verwaltung (Abschnitt 8).

Bedingung und Berechnung tragen zusätzlich einen Namen ohne Leerzeichen (Feld `name` des Elements), unter dem Ausdrücke ihr Ergebnis ansprechen (`einstieg.ergebnis`). Der Name ist nicht Pflicht.

### 4.2 Ordertypen

Die Eigenschaften der Order kommen aus den Ordertypen. `Order` in einer Regel kennt die Eigenschaften aller Ordertypen, in der Verwaltung nur die des Ordertyps der zugehörigen „Order aufgeben“ (Abschnitt 6).

| Eigenschaft | Datentyp | MUSS | belegt der Anwender | Ordertypen |
| --- | --- | --- | --- | --- |
| `order_id` | Text | ja | nein | alle |
| `status` | Auswahl: `wartend`, `teilausgefuehrt`, `ausgefuehrt`, `geloescht`, `abgelaufen`, `abgelehnt` | ja | nein | alle |
| `konto` | Objekt `Konto` | ja | nein | alle |
| `strategie_id` | Text | nein | nein | alle |
| `bemerkung` | Text | nein | ja | alle |
| `instrument` | Objekt `Instrument` | ja | nein | `MarketOrder`, `StopOrder`, `LimitOrder`, `StopLimitOrder` |
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

Der Befund „MUSS-Eigenschaft … ohne Belegung“ (Abschnitt 9) gilt nur für Eigenschaften, die der Anwender belegt (Hinweis S16). Ordertypen: `MarketOrder` (Marktorder), `StopOrder`, `LimitOrder`, `StopLimitOrder` und `CloseOrder` (Schließorder, nicht wählbar).

### 4.3 Objekte der Anwendung

| Kennung | Parameter | Eigenschaften (Kennungen) | auf der Zeichenfläche |
| --- | --- | --- | --- |
| `Konto` | – | `kapital`, `freie_margin`, `waehrung` | ja |
| `Instrument` | – | `bezeichnung`, `tickgroesse`, `tickwert`, `punkt`, `pip`, `spread`, `mindestvolumen`, `volumenschritt` | ja |
| `Kerze` | `zeiteinheit` (Zeiteinheit, Pflicht) | `eroeffnung`, `hoch`, `tief`, `schluss`, `volumen`, `zeitpunkt` | ja |
| `Tick` | – | `geld`, `brief`, `zeitpunkt` | ja |
| `Order` | – | `order_id`, `status`, `konto`, `strategie_id`, `bemerkung`, `preis` und die Eigenschaften der Ordertypen | nein |
| `Position` | – | `instrument`, `richtung` (`buy`, `sell`), `volumen`, `einstiegspreis`, `stop_loss`, `take_profit`, `offener_gewinn_oder_verlust` | nein |
| `Strategie` | – | `strategie_id`, `bezeichnung`, `beschreibung`, `wartende_orders`, `offene_positionen` (Ganzzahl) und die Strategieparameter der Strategie | nein |

### 4.4 Indikatoren und allgemeine Objekttypen

| Kennung | Kategorie | Parameter (Standardwert) | Eigenschaften |
| --- | --- | --- | --- |
| `EMA` | `indicator` | `zeiteinheit` (Pflicht), `periode` (Ganzzahl, Pflicht), `verschiebung` (Ganzzahl, 0), `kursquelle` (Auswahl, `schlusskurs`; Werte `schlusskurs`, `eroeffnungskurs`, `hoch`, `tief`, `medianpreis`, `typischer_preis`, `gewichteter_schlusskurs`) | `wert` |
| `ATR` | `indicator` | `zeiteinheit` (Pflicht), `periode` (Ganzzahl, Pflicht) | `wert` |
| `Markttechnik` | `indicator` | `zeiteinheit` (Pflicht), `depth` (12), `deviation` (5), `backstep` (3) | `trendrichtung` (Auswahl: `aufwaerts`, `abwaerts`, `kein_trend`), `trend_intakt` (Wahrheitswert), `phase` (Auswahl: `bewegung`, `korrektur`; KANN), `punkt_2` (Zahl; KANN), `punkt_13` (Zahl; KANN), `punkt_13_endgueltig` (Wahrheitswert; KANN) |
| `Indikator` | `indicator` | eigene Parameter der Vorlage | eigene Eigenschaften der Vorlage |
| `Trend` | `trend` | `zeiteinheit` (Pflicht), `berechnungsverfahren` (Auswahl, Standardwert `trend_method.expression`, nur `fixed`) | `richtung` (Text) und eigene Eigenschaften |
| `Regel` | `rule` | eigene Parameter der Vorlage | – |
| `Regelwerk` | `ruleset` | – | – |

Berechnungsverfahren des Trends: `trend_method.expression` (Ausdruck).

Die Eigenschaften der Indikatoren beschreiben nur Parameter und Eigenschaften, ohne Berechnung (Spezifikation Abschnitt 1).

## 5. Objektmodell

Das Objektmodell besteht aus `dataclass`-Klassen in `model.py` und kennt weder Pydantic noch ein anderes Framework. Alle Klassen lassen sich vergleichen (`==`); der Vergleich ist die Grundlage der Aussage „Schreiben und erneutes Lesen ergeben dasselbe Objekt“.

| Klasse | Inhalt |
| --- | --- |
| `Strategy` | `id` (UUID als Text), `title`, `description`, `parameters` (`StrategyParameter`), `rules` (Regeln und Regelwerke der Strategie als Instanzen in festgelegter Reihenfolge), `elements`, `connections`; Methoden `element(id)`, `main_elements()`, `management(id)`, `managements()` |
| `StrategyParameter` | `name`, `datatype`, `value` oder `at_application` (bei der Anwendung), `choices` |
| `Element` | `id`, `type` (Elementtyp als Text), `title` (Bezeichnung), `name` (Name von Bedingung und Berechnung), `x`, `y` (Lage), `parameters` und `properties` (je Kennung ein `Binding`), `rules` (zugeordnete Regeln und Regelwerke), `management_of` (Kennung des Elements „Order aufgeben“, zu dessen Verwaltung es gehört, leer im Hauptablauf), `instance` (die Instanz bei einem Element, das ein Objekt zeigt) |
| `Connection` | `source` (Element), `output` (Ausgang), `target` (Element); eine Verbindung darf zurückführen |
| `Management` | die Verwaltung einer Order: `order_element` und `elements`. Sie ist kein gespeichertes Feld, sondern ergibt sich aus `Element.management_of`; sie hängt am Ausgang `gestellt` von „Order aufgeben“ und kann wieder ein „Order aufgeben“ mit eigener Verwaltung enthalten |
| `Binding` | Belegung mit Bindungsart: `kind` und `value` (bei `fixed` der Wert, bei `parameter` der Name des Parameters, bei `expression` der Ausdruck, bei `application` kein Wert) |
| `Instance` | Kopie einer Vorlage oder eines Objekttyps (E4): `name`, `origin` (`Origin`: Objekttyp, Kennung und Bezeichnung der Vorlage zum Zeitpunkt des Einfügens, bei einem eingefügten Objekttyp ohne Kennung und Bezeichnung) und der gesamte Inhalt (`ObjectContent`) |
| `Template` | Vorlage: `id`, `title`, `description` und der Inhalt (`ObjectContent`) |
| `ObjectContent` | `object_type`, `parameter_values` (Parameterwerte der Instanz beziehungsweise Standardwerte der Vorlage), `parameters` (eigene Parameter: Name, Datentyp, Pflicht, Standardwert, Auswahlwerte), `properties` (eigene Eigenschaften mit Ausdruck), `instances` (enthaltene Instanzen von Indikatoren), `rules` (enthaltene Regeln und Regelwerke), `expression`, `determined_property`, `comparison` (`hoechstens`, `mindestens`, `gleich`) und `result_expression` |

Der Inhalt je Objekttyp (Spezifikation 3.3):

| Objekttyp | verwendete Felder |
| --- | --- |
| mitgelieferter Indikator (`EMA`, `ATR`, `Markttechnik`) | nur `parameter_values` |
| `Indikator` | `parameters`, `parameter_values`, `instances`, `rules`, `properties`; ein Ausdruck kann das Ergebnis einer enthaltenen Regel verwenden (`regel.ergebnis`) |
| `Trend` | `parameter_values` für `zeiteinheit` und `berechnungsverfahren`, beim Verfahren „Ausdruck“ `instances`, `rules` und `properties` (darunter die Eigenschaft `richtung`) |
| `Regel` | `parameters`, `parameter_values`, `expression`, `determined_property` (bestimmte Eigenschaft der Order oder leer bei einer nur prüfenden Regel), `comparison` (Vergleich beim Prüfen) |
| `Regelwerk` | `rules` in festgelegter Reihenfolge, optional `result_expression` für das Gesamtergebnis |

Eine Instanz ist in vollem Umfang änderbar und braucht zur Ausführung ihre Vorlage nicht. Kein Dokument verweist zur Ausführung auf ein anderes Dokument. Löschen oder Ändern einer Vorlage wirkt nicht auf Instanzen.

Ein Element, das ein Objekt zeigt (`EMA`, `Kerze`, `Trend` und so weiter), trägt als `type` die Kennung des Objekttyps und enthält die Instanz in `instance`. Eine Instanz kann aus einem eingefügten Objekttyp oder aus einer Vorlage entstehen; ein Objekttyp oder Elementtyp, den die Bibliothek nicht kennt, ist gültig (Abschnitt 10).

### 5.1 Regelvorlage „Risiko je Trade“

Die mitgelieferte Regelvorlage steht in `risk_rule.py`: `risk_per_trade_template()` liefert die Vorlage, `risk_per_trade_instance(name, risikogrenze)` eine Instanz mit Herkunft. Die Vorlage hat die feste Kennung (Konstante `RISK_PER_TRADE_RULE_ID`):

```text
7c1d4e2a-5b3f-4a86-9d27-e1f0a3c8b645
```

Sie ist in jeder Installation gleich und wird nicht geändert oder gelöscht (E6). Ihre Bestandteile: Bezeichnung „Risiko je Trade“, Objekttyp `Regel`, Parameter `risikogrenze` (Prozent, Pflicht, Standardwert 1 %, also `0.01`), bestimmte Eigenschaft `volumen`, Vergleich beim Prüfen `hoechstens` und der Ausdruck aus Spezifikation 3.5 in normalisierter Schreibweise (Konstante `RISK_PER_TRADE_EXPRESSION`); der Abstand vom Preis zum Stop-Loss steht an beiden Stellen ausgeschrieben. Die Regel ist fehlerfrei als Regel der Strategie und als Regel eines Elements.

## 6. Namensräume

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

Der Namensraum der Strategie enthält alle Instanzen der Elemente (auch in Verwaltungen), die Namen der Bedingungen und Berechnungen (`name.ergebnis`) und die Regeln und Regelwerke der Strategie. Die Regeln eines Elements stehen nur in den Ausdrücken der Regeln dieses Elements. Eine Regel in einem Regelwerk heißt innerhalb des Regelwerks `regel`, außerhalb `regelwerk.regel`; das Gesamtergebnis `regelwerk.ergebnis`. Die Eigenschaften enthaltener Indikatoren sind mehrstufig ansprechbar: `trend_h1.ema20.wert`.

Folgerungen aus den Festlegungen:

- Haben eine Regel des Elements und eine Regel der Strategie denselben Namen, meint ein Ausdruck einer Regel des Elements die Regel des Elements. Das ist kein Befund „Name doppelt vergeben“.
- „Name doppelt vergeben“ (Abschnitt 9) gilt für zwei Namen derselben Ebene: im Namensraum der Strategie, in den Regeln eines Elements, in den Parametern einer Regel, in den Regeln eines Regelwerks, im Namensraum einer Vorlage (Parameter, Instanzen, Regeln) und unter den Strategieparametern.
- Strategieparameter sind nur als `Strategie.name` ansprechbar und kollidieren deshalb nicht mit Instanzen.
- `Strategie` ist ein Objekt der Anwendung, auch in Indikator, Trend und Regelwerk. Die Strategieparameter unter `Strategie.<name>` sind dort ansprechbar. Eine Vorlage, für sich geprüft, kennt die Strategieparameter nicht; ein unbekannter Strategieparameter ist dort ein Hinweis `rule.unresolved_name` (bei Vorlagen `Regel`, `Regelwerk`, `Indikator` und `Trend` gleich). Eine Instanz innerhalb einer Strategie, auch in einem Regelwerk der Strategie, wird gegen die Strategieparameter dieser Strategie geprüft; ein unbekannter ist dort ein Fehler `expression.invalid`.
- Ein Regelwerk ist ein geschlossener Namensraum, auch als Instanz in der Strategie (Festlegung der Umsetzung nach dem Auftrag): Seine Regeln sehen weder die übrigen Namen der Strategie (Instanzen, Berechnungen, Bedingungen, Regeln) noch die Regeln außerhalb. Dasselbe gilt für die Ausdrücke von Indikator und Trend.
- Namen von Instanzen, Elementen, Regeln und Parametern dürfen nur aus den ASCII-Buchstaben `A` bis `Z` und `a` bis `z`, den ASCII-Ziffern `0` bis `9` und `_` bestehen und müssen mit einem Buchstaben oder `_` beginnen (geprüft mit `fullmatch`), sonst meldet die Prüfung `name.invalid`. Buchstaben und Ziffern anderer Schriften (kyrillisches `е`, arabisch-indische oder Vollbreitenziffern) und ein Zeilenumbruch sind nicht erlaubt, damit ein Name nicht einem anderen zum Verwechseln ähnlich sieht.

## 7. Ausdrücke

Ausdrücke folgen einer Auswahl aus OpenFormula (Spezifikation 3.4). Der Parser ist ein eigener, von Hand geschriebener Parser ohne `eval` und ohne Parsergenerator; er arbeitet ohne Rekursion, sodass auch tief geschachtelte Eingaben den Stapel von Python nicht erschöpfen. Es wird nichts ausgewertet.

### 7.1 Schreibweise

- Zahlen mit Dezimalpunkt, nur mit den ASCII-Ziffern `0` bis `9` (`3.14`); Namen nur mit ASCII-Buchstaben, ASCII-Ziffern und `_`. Andere Zeichen sind ein Schreibfehler (`invalid_character`, bei Ziffern hinter einer Zahl `invalid_number`). Texte in doppelten Anführungszeichen (ein doppeltes Anführungszeichen im Text wird verdoppelt: `"a""b"`), `TRUE()` und `FALSE()`, das Prozentzeichen unmittelbar nach einer Zahl (`1%` ist `0.01`).
- Operatoren: `+ - * / ^ &`, Vergleiche `= <> < <= > >=`, Vorzeichen und Klammern. Die logischen Operatoren sind die Funktionen `AND`, `OR`, `NOT`.
- Rangfolge von niedrig nach hoch: Vergleich, `&`, `+ -`, `* /`, `^`, Vorzeichen. Wie in OpenFormula bindet das Vorzeichen stärker als `^`, `-2^2` ist also 4. Alle binären Operatoren gruppieren von links.
- Argumente einer Funktion trennt `;`. Zwischen den Teilen darf Leerraum einschließlich Zeilenumbrüchen stehen.
- Namen: `Objekt.Eigenschaft`, bei enthaltenen Objekten mehrstufig. Groß- und Kleinschreibung von Namen und Funktionen wird nicht unterschieden. Gespeichert wird die Schreibweise der Kennung (Abschnitt 7.4).
- Festgelegte Werte einer Auswahl stehen als Text mit ihrer Kennung: `mt.phase = "bewegung"`.

Positionen sind Zeichenpositionen (beginnend bei 0): `start` ist das erste Zeichen, `end` die Stelle hinter dem letzten Zeichen.

### 7.2 Funktionen

`list_functions()` liefert die Funktionen mit Signatur und Ergebnistyp (`FunctionSignature`: `name`, `parameters` mit Art des Arguments, `variadic`, `result`, `description` in Deutsch und Englisch, `min_arguments`, `max_arguments`). Die Namen sind die der Norm.

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
| `PREVIOUS` | Name einer Eigenschaft, optional Anzahl (ganze Zahl ab 1) | Typ der Eigenschaft |
| `TRUE`, `FALSE` | keine | Wahrheitswert |

`PREVIOUS` ist die eigene Funktion für frühere Werte (req-fach-014); deutsche Funktionsnamen (`VORHER`) sind offen und werden nicht angeboten.

### 7.3 Typprüfung und Befunde im Ausdruck

Die Typprüfung kennt die Datentypen aus Abschnitt 3.1. Zahl, Ganzzahl und Prozent sind untereinander verträglich. Text, Auswahl und Zeiteinheit lassen sich als Text vergleichen; ein fester Text, der mit einer Auswahl verglichen oder einer Eigenschaft einer Auswahl zugewiesen wird, muss einer ihrer Werte sein (auch alle festen Texte eines `IF`). Ein Text, der erst bei der Ausführung entsteht, wird dort geprüft. Ein unbekannter Typ (nach einem Fehler) ist mit allem verträglich, damit ein Fehler keine Folgefehler erzeugt.

`analyze(text, umgebung, erwartet)` liefert eine `Analysis` mit

- `issues`: die Befunde des Ausdrucks, je mit `kind`, `start`, `end`, `reason` und `details`,
- `names`: die erkannten Namen mit `start`, `end`, der Kennung (`identifier`, Teile mit Kennung und Stelle in `segments`) und, ob der ganze Name erkannt wurde (`resolved`); das braucht der Endpunkt `/api/v1/check` (Abschnitt 5.3 der Spezifikation),
- `functions`: die erkannten Funktionen mit Stelle,
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

## 8. Bedeutung bei der Ausführung

Dieser Abschnitt legt fest, was Fehler, „leer“ und „nicht verfügbar“ bei der späteren Ausführung bedeuten. Die Bibliothek wertet nicht aus; Strategietester und Handelssystem setzen es um. Strategietester und Handelssystem protokollieren jeden Fehler einer Auswertung mit Element und Ausdruck.

**„Nicht verfügbar“** (`#N/A` nach OpenFormula): Spricht ein Ausdruck eine Eigenschaft an, die das Objekt im Zusammenhang der Auswertung nicht hat, ist der Wert „nicht verfügbar“. Das gilt für eine Eigenschaft, die der Ordertyp nicht hat (`Order.limitpreis` bei einer Stop-Order), für `Position` in einer Regel, die auf eine Order angewendet wird, und für `Position` in der Verwaltung, solange die Order noch keine Position hat. Jede Rechnung mit „nicht verfügbar“ ergibt „nicht verfügbar“, auch eine Bedingung von `IF`; `ISNA` und `IFNA` prüfen und ersetzen ihn. `IF` wertet nur den gewählten Zweig aus. Die Auswertung vermerkt bei „nicht verfügbar“, ob er von einer Eigenschaft stammt, die der Ordertyp nicht hat.

**„Leer“**: Eine Eigenschaft ohne Wert ist „leer“: eine KANN-Eigenschaft ohne Wert oder eine Eigenschaft, die das Objekt gerade nicht belegt, etwa `punkt_2` der Markttechnik ohne Trend. Rechnung und Vergleich mit „leer“ sind ein Fehler, ebenso eine Division durch null und die übrigen Fehlerwerte von OpenFormula. `ISBLANK` prüft auf „leer“.

Wirkung bei der Ausführung, wenn das Ergebnis eines Ausdrucks ein Fehler, „leer“ oder „nicht verfügbar“ ist:

| Stelle | Wirkung | Grundlage |
| --- | --- | --- |
| Regel, Ergebnis „nicht verfügbar“ von einer Eigenschaft, die der Ordertyp nicht hat | sie wird auf diese Order nicht angewendet, ohne Fehler oder Meldung | req-fach-046 |
| bestimmende Regel, Fehler, „leer“ oder sonst „nicht verfügbar“ | die Eigenschaft ist nicht bestimmbar | req-fach-021 |
| prüfende Regel, Fehler, „leer“ oder sonst „nicht verfügbar“ | die Prüfung ist nicht erfüllt | req-fach-021 |
| Bedingung | jedes Ergebnis außer „wahr“ nimmt den Ausgang `falsch` | req-fach-047 |
| Berechnung | das Ergebnis ist dieser Wert; wer es verwendet, verhält sich nach dieser Tabelle | req-fach-048 |
| Belegung einer Eigenschaft bei „Order aufgeben“, „Order ändern“, „Position ändern“, „Position schließen“ | die Eigenschaft ist nicht bestimmbar: Ausgang `nicht_gestellt` beziehungsweise `nicht_geaendert`, bei „Position schließen“ wird nichts geschlossen und der Ablauf geht weiter | req-fach-049, req-fach-049a |
| Parameter setzen | der Strategieparameter bleibt unverändert, der Ablauf geht weiter | req-fach-047 |
| eigene Eigenschaft eines Indikators oder Trends | die Eigenschaft ist „leer“ | req-fach-013a |

Festlegungen zu dieser Tabelle:

- Hinweis S24: Der Vermerk „von einer Eigenschaft, die der Ordertyp nicht hat“ geht durch Rechnungen, Funktionen, den gewählten Zweig und die Bedingung von `IF` und das Ergebnis einer anderen Regel weiter. Treffen Werte „nicht verfügbar“ verschiedener Herkunft zusammen, trägt das Ergebnis den Vermerk, wenn mindestens einer ihn trägt. Wird eine Regel auf eine Position angewendet, ist `Order` die Order, aus der die Position entstand (req-fach-051); fehlt deren Ordertyp eine Eigenschaft, gilt derselbe Vermerk.
- Hinweis S25: „In der Verwaltung sieht die Regel die Order und Position der Verwaltung“ gilt für eine Regel, deren Ergebnis ein Ausdruck der Verwaltung verwendet. Eine Regel, die bei „Order ändern“ in der Verwaltung auf die Order angewendet wird, findet keine Position vor: `Position` ist dort „nicht verfügbar“, auch nach einer Teilausführung.
- Hinweis S21: Ein Parameter einer Instanz, der mit einem Ausdruck belegt ist, wirkt bei Fehler, „leer“ oder „nicht verfügbar“ wie eine eigene Eigenschaft eines Indikators: Alle Eigenschaften der Instanz sind „leer“. Ein Parameter eines Auslösers mit einem solchen Ergebnis lässt den Auslöser nicht eintreten. Das Gesamtergebnis eines Regelwerks wirkt wie das Ergebnis einer Regel: bestimmend nicht bestimmbar, prüfend nicht erfüllt.

Die Regelvorlage „Risiko je Trade“ fängt `Position` mit `ISNA` ab (Spezifikation 3.5). Eine Order oder Position ohne Stop-Loss erfüllt sie nicht, weil der Stop-Loss dann „leer“ ist.

## 9. Konsistenzprüfung

`check_strategy(strategy)` und `check_template(template)` liefern alle Befunde (`Finding`): `level` (`error` = Fehler, `hint` = Hinweis), `code` (die Kennung des Befunds), `element` (Kennung des betroffenen Elements oder `None`), `subject` (betroffene Instanz oder Regel oder `None`; bei einem Teil innerhalb einer anderen Instanz die Namen mit Punkt verbunden, zum Beispiel `regelwerk.regel` oder `trend_h1.regel`) und `details` (Angaben für den Text). `Finding.to_dict()` liefert die JSON-Form. Die Prüfung läuft für eine Strategie und für jede Vorlage; bei einer Vorlage ist `element` immer leer. Die Reihenfolge der Befunde ist nicht festgelegt. Texte erzeugt die Bibliothek nicht.

### 9.1 Befunde der Tabelle in Spezifikation 3.6

| Kennung | Stufe | Befund | betroffen | Angaben |
| --- | --- | --- | --- | --- |
| `strategy.no_trigger` | Fehler | Strategie ohne Auslöser (im Hauptablauf) | – | – |
| `trigger.unconnected` | Fehler | Auslöser ohne Verbindung in den Ablauf | der Auslöser | – |
| `flow.no_incoming` | Fehler | Element des Ablaufs ohne eingehende Verbindung | das Element | – |
| `expression.invalid` | Fehler | fehlerhafter Ausdruck: Schreibfehler, unbekannte Funktion, unbekannter Name, unbekannte Eigenschaft, unpassender Typ, unbekannter Wert einer Auswahl | Element (leer bei einer Regel der Strategie oder einer Vorlage), Instanz oder Regel | `field` (welcher Ausdruck: `parameter:<kennung>`, `property:<kennung>`, `expression`, `result_expression`, `property_definition:<name>`), `start`, `end`, `issue` (die `kind` aus Abschnitt 7.3), `reason` und die Angaben des Befunds im Ausdruck |
| `rule.result_mismatch` | Fehler | Ergebnis einer bestimmenden Regel passt nicht zur bestimmten Eigenschaft (bei einer prüfenden Regel: Ergebnis ist kein Wahrheitswert) | Regel | `reason` (`unknown_property`, `choice_value`, `type`), `property`, `expected`, `found`, `values`, `allowed` |
| `flow.unending_loop` | Fehler | Rückführung ohne Bedingung, die sie beendet | das erste Element der Gruppe | `elements` (alle Elemente der Gruppe) |
| `parameter.missing` | Fehler | Pflichtparameter ohne Wert und nicht „bei der Anwendung“ | Element, Instanz oder Strategieparameter | `parameter`, bei Strategieparametern `scope` = `strategy` |
| `order.property_missing` | Fehler | MUSS-Eigenschaft der Order, die der Anwender belegt, ohne Belegung und ohne bestimmende Regel der Strategie oder des Elements | das Element „Order aufgeben“ | `property`, `order_type` |
| `ruleset.reference_order` | Fehler | Regelwerk mit Vorwärtsbezug oder Zirkelbezug | die Regel | `kind` (`forward` oder `cycle`), `list`, bei `forward` `rule` und `refers_to`, bei `cycle` `rules` |
| `expression.order_outside_management` | Fehler | `Order` oder `Position` im Ablauf außerhalb einer Verwaltung, auch über das Ergebnis einer Regel | Element, Instanz | `field`, `context` (`main_flow` oder `indicator`) |
| `rule.order_in_indicator` | Fehler | Regel, die `Order` oder `Position` anspricht, in einem Indikator oder Trend, auch in einem Regelwerk darin | Element, Regel (`instanz.regel`) | – |
| `candle.no_instance` | Fehler | `Kerze` ohne Instanz mit gesetzter Zeiteinheit, wenn ein Auslöser außer `Kerzenschluss` die Auswertung startet | Element oder Regel der Strategie | – |
| `flow.management_only` | Fehler | Order ändern, Order löschen, Position ändern oder Position schließen außerhalb einer Verwaltung | das Element | `type` |
| `name.duplicate` | Fehler | Name doppelt vergeben innerhalb eines Namensraums | das zweite Element, die zweite Instanz oder Regel | `name`, `namespace` (`strategy`, `strategy_parameters`, `element_rules`, `rule_parameters`, `ruleset`, `template`) |
| `type.unknown` | Fehler | unbekannter Elementtyp oder Objekttyp | das Element, die Instanz | `kind` (`element` oder `object`), `type` |
| `flow.no_order_reachable` | Hinweis | kein Element „Order aufgeben“ erreichbar (vom Auslöser des Hauptablaufs) | – | – |

Einzelheiten der Befunde:

- `flow.unending_loop`: Ein Kreis ist beendet, wenn auf ihm eine Bedingung liegt, von der ein Ausgang aus dem Kreis hinausführt oder ohne Fortsetzung endet. Die Prüfung arbeitet auf den stark zusammenhängenden Gruppen des Ablaufs; eine Gruppe ohne eine solche Bedingung ist ein Befund. Der Ablauf und jede Verwaltung werden getrennt geprüft.
- `candle.no_instance`: Die Prüfung gilt für ein Element, das von einem Auslöser außer `trigger.candle_close` erreicht wird und `Kerze` unter dem Namen des Objekttyps verwendet, solange kein Element `Kerze` mit gesetzter `zeiteinheit` auf der Zeichenfläche liegt; und für eine Regel der Strategie, die `Kerze` verwendet, sobald ein solcher Auslöser vorhanden ist.
- `order.property_missing`: Zählt nur Eigenschaften mit `set_by_user`; eine Eigenschaft mit Standardwert (`gueltigkeit`) gilt als belegt; `ablaufzeit` und `datum` zählen nur bei dem zugehörigen Wert von `gueltigkeit`. Die Belegung mit der Bindungsart `application` zählt als Belegung. Eine bestimmende Regel (`determined_property`) der Strategie oder des Elements, auch in einem Regelwerk, ersetzt die Belegung.
- `ruleset.reference_order`: Ein Vorwärtsbezug (die Regel verwendet das Ergebnis einer späteren) und ein Zirkelbezug werden in einem Regelwerk gemeldet; ein Zirkelbezug auch in jeder anderen Liste von Regeln (Strategie, Element, Vorlage).
- `expression.order_outside_management` und `rule.order_in_indicator` erkennen `Order` und `Position` auch über das Ergebnis einer Regel, auch über mehrere Regeln.

### 9.2 Weitere Befunde

Diese Befunde stehen nicht in der Tabelle der Spezifikation; sie sind für eine vollständige Prüfung nötig.

| Kennung | Stufe | Befund | Angaben |
| --- | --- | --- | --- |
| `rule.unresolved_name` | Hinweis | Der Ausdruck einer Regelvorlage spricht einen Namen an, der weder Objekt der Anwendung noch Parameter der Regel ist; in jeder Vorlage (`Regel`, `Regelwerk`, `Indikator`, `Trend`), für sich geprüft, außerdem ein Strategieparameter unter `Strategie`, den die Vorlage nicht kennen kann. Geprüft wird der Name in jeder Strategie, die die Vorlage enthält (Spezifikation 3.4) | wie `expression.invalid` |
| `trend.direction_missing` | Fehler | Ein `Trend` mit dem Berechnungsverfahren „Ausdruck“ (Standard) hat keinen Ausdruck für die Eigenschaft `richtung` (Spezifikation 3.3); gilt für die Vorlage und die Instanz | `property` |
| `calculation.circular_reference` | Fehler | Berechnungen verwenden ihre Ergebnisse im Kreis (auch eine Berechnung ihr eigenes). Ein Name in `PREVIOUS(…)` bezeichnet den Wert einer früheren Auswertung und zählt nicht als Abhängigkeit, `PREVIOUS(z.ergebnis) + 1` in `z` ist also kein Kreis; dasselbe gilt für den Zirkel- und Vorwärtsbezug bei Regeln und Regelwerken (`ruleset.reference_order`). Die Prüfung ordnet die Berechnungen nach ihren Abhängigkeiten, ohne Rekursion über Python-Aufrufe, auch bei einer Kette bis zur Grenze der Elemente | `elements`, `names`; Element ist das erste der Gruppe |
| `findings.truncated` | Fehler | Die Zahl der Befunde ist begrenzt (Abschnitt 11). Bei Erreichen einer Grenze folgt dieser Befund ohne Element | `limit`, `scope` (`expression`: mehr als 50 Befunde in einem Ausdruck, weitere entfallen, dazu `field`, `element_id`, `instance`; `check`: 1000 Befunde in der Prüfung, die Prüfung endet) |
| `connection.invalid` | Fehler | Verbindung mit unbekannter Quelle oder unbekanntem Ziel, unbekanntem Ausgang, mit einem Auslöser als Ziel oder zwischen Ablauf und einer Verwaltung (oder zwei Verwaltungen) | `reason` (`unknown_source`, `unknown_target`, `unknown_output`, `target_is_trigger`, `across_managements`), `source`, `output`, `target` |
| `parameter.binding_invalid` | Fehler | Belegung passt nicht: Bindungsart nicht erlaubt, fester Wert vom falschen Typ oder nicht in der Auswahl, unbekannter Parameter oder unbekannte Eigenschaft, Strategieparameter unbekannt oder vom falschen Typ, von der Anwendung belegte Eigenschaft belegt | `reason` (`binding_kind`, `type`, `choice_value`, `value`, `unknown_parameter`, `unknown_property`, `set_by_application`), `parameter` oder `property` |
| `name.invalid` | Fehler | Name enthält Zeichen, die ein Ausdruck nicht ansprechen kann | `name`, `what` |
| `element.rules_not_allowed` | Fehler | Dem Element sind Regeln zugeordnet, obwohl sein Typ keine zulässt | `type` |
| `element.management_invalid` | Fehler | `management_of` nennt kein Element „Order aufgeben“ | `owner` |
| `rule.invalid_type` | Fehler | In einer Liste von Regeln steht ein anderer Objekttyp, oder ein Objekt `Regel`/`Regelwerk` steht als Instanz oder Element | `reason` (`in_rules`, `in_instances`), `type` |
| `rule.comparison_missing` | Fehler | Eine bestimmende Regel nennt keinen Vergleich beim Prüfen | – |

Die Kennungen der Befunde sind Konstanten in `pipwerk_domain.consistency.findings`. Die Prüfung liefert höchstens `MAX_FINDINGS_PER_CHECK` Befunde und dazu den Befund `findings.truncated`; sie endet dann, spätere Befunde und Ausdrücke bleiben ungeprüft. `normalize_strategy` und `normalize_template` brauchen keine Befunde: Sie zerlegen die Ausdrücke nur, schreiben Namen und Funktionen und sammeln keine Befundliste (ein Ausdruck, in dem nichts zu ändern ist, wird gar nicht zerlegt). Ihre Laufzeit für ein Dokument von 2 MiB liegt in der Größenordnung der Prüfung. Ein Test schützt vor einem Ausreißer der Laufzeit (Zeitgrenze ohne `tracemalloc` gemessen) mit einem Dokument, in dem die Normalisierung jeden Ausdruck zerlegen und umschreiben muss; die Zeit gilt nicht als Eigenschaft von Dokumenten dieser Größe.

## 10. Dokumente und Schemata

Strategie und Vorlagen werden als JSON-Dokument geschrieben und gelesen (Spezifikation 3.7). Die Pydantic-Modelle in `pipwerk_domain.documents` sind streng (`strict`, keine Umwandlung von Werten) und lehnen zusätzliche Felder ab (`extra="forbid"`).

| Format (`format`) | Modell | Datei im Objektverzeichnis (Backend) | Schema |
| --- | --- | --- | --- |
| `pipwerk.strategy` | `StrategyDocument` | `<uuid>.strategy.json` | `strategy.schema.json` |
| `pipwerk.indicator` | `IndicatorDocument` (`object_type` ist `Indikator` oder ein mitgelieferter Indikator) | `<uuid>.indicator.json` | `indicator.schema.json` |
| `pipwerk.trend` | `TrendDocument` | `<uuid>.trend.json` | `trend.schema.json` |
| `pipwerk.rule` | `RuleDocument` | `<uuid>.rule.json` | `rule.schema.json` |
| `pipwerk.ruleset` | `RulesetDocument` | `<uuid>.ruleset.json` | `ruleset.schema.json` |

Kopffelder: `format` und `format_version` (`1.0`). Ein Dokument mit höherer Hauptversion von `format_version` wird abgelehnt; erlaubt ist `1.<n>`. Weitere Felder der Dokumente entsprechen dem Objektmodell (Abschnitt 5):

- Strategie: `id`, `title`, `description`, `parameters`, `rules`, `elements` (je mit `id`, `type`, `title`, `name`, `x`, `y`, `parameters`, `properties`, `rules`, `management_of`, `instance`), `connections` (`source`, `output`, `target`).
- Vorlage: `id`, `title`, `description`, `object_type` und der Inhalt: `parameter_values`, `parameters`, `properties`, `instances`, `rules`, `expression`, `determined_property`, `comparison`, `result_expression`.
- Instanz (in `rules`, `instances`, `instance`): `name`, `object_type`, `origin` und derselbe Inhalt.
- Belegung (`Binding`): `{"kind": "fixed", "value": 5}`, `{"kind": "parameter", "value": "name"}`, `{"kind": "expression", "value": "…"}` oder `{"kind": "application"}`.

Zahlen sind endlich: `NaN`, `Infinity`, `-Infinity` und Zahlen, die zu unendlich werden (`1e999`), lehnt die Bibliothek an jedem Zahlenfeld ab (feste Werte, Standardwerte, Werte von Strategieparametern, `x`, `y`), beim Lesen eines JSON-Textes, beim Prüfen eines Python-Objekts und beim Aufbau eines Dokuments aus dem Objektmodell. Geschrieben wird nur gültiges JSON (`allow_nan=False`). Ein Dokument als Bytes muss UTF-8 ohne Byte-Order-Mark sein; andere Kodierungen (UTF-16, UTF-32, Latin-1) und eine Byte-Order-Mark werden abgelehnt (Festlegung der Umsetzung nach RFC 8259). Die Prüfung auf einzelne Ersatzzeichen endet für jede Eingabe: Ein Python-Objekt, das sich selbst enthält (Kreis), wird als Fehler des Dokuments abgelehnt; ein Teil, der mehrfach eingehängt ist, wird nur einmal durchlaufen. Ein Text mit einem einzelnen Ersatzzeichen (U+D800 bis U+DFFF ohne Partner, auch als Escape `\ud800` geschrieben) in einem Wert oder Schlüssel wird abgelehnt, beim Lesen wie beim Schreiben, weil er sich nicht als UTF-8 ausgeben lässt; ein gültiges Paar ist erlaubt. Ein JSON-Text mit einem Schlüssel, der in einem Objekt zweimal vorkommt, wird abgelehnt; ebenso Text, der kein gültiges JSON ist oder zu tief geschachtelt ist. Alles das ist ein `DocumentError`.

Kennungen (`id`, `template_id`, `management_of`, Verbindungen) sind UUIDs in Kleinbuchstaben. Die Typen von Elementen und Objekten sind Zeichenketten. Ein Dokument mit einem unbekannten Elementtyp oder Objekttyp ist deshalb gültig und wird geladen; alle Belegungen bleiben beim Schreiben erhalten, die Konsistenzprüfung meldet den Typ (`type.unknown`). Gespeichert werden nur Kennungen, keine übersetzten Texte.

### 10.1 Schemata

Die JSON-Schemata (Draft 2020-12) liegen unter `contracts/strategies/v1/` und werden aus den Modellen erzeugt. Der Befehl, der sie neu erzeugt (im Verzeichnis `packages/domain-core`):

```sh
uv run --frozen python -m pipwerk_domain.documents.schemas ../../contracts/strategies/v1
```

Mit `--check` schreibt der Befehl nichts und endet mit Exitcode 1, wenn eine Datei von den Modellen abweicht. Dasselbe leistet der Eintrag `pipwerk-domain-schemas`, der mit dem Paket installiert wird. Ein Test vergleicht die erzeugten Schemata mit den Dateien.

Das Schema drückt Typen, zusätzliche Felder, Kennungsmuster, die Hauptversion und die Begrenzungen von Längen und Anzahlen aus. Die Schachtelungstiefe eines Ausdrucks und die Schachtelung von Instanzen prüft die Bibliothek beim Lesen; das Schema kann sie nicht ausdrücken.

### 10.2 Testfalldokumente

Die Testfälle `str-01` und `str-03` (Spezifikation Abschnitt 6) liegen als `contracts/strategies/v1/testcases/str-01.strategy.json` und `str-03.strategy.json`. Sie sind vollständig, in normalisierter Schreibweise, mit der Regel der Strategie `risiko` aus „Risiko je Trade“ (1 %) und der Regel des Elements `mindestvolumen`. Sie bestehen die Konsistenzprüfung ohne Befund. Die Werte der Strategieparameter von `str-01` (Signalzeiteinheit `h1`, Handelszeiteinheit `m15`, Puffer 3) legt der Testfall fest, die Spezifikation nennt sie nicht. Die Kennungen der Elemente sind abgeleitet (UUID Version 5), Lage und Bezeichnungen der Elemente sind frei gewählt.

## 11. Begrenzungen gegen Überlast

Die Begrenzungen (Spezifikation Abschnitt 8) stehen als Konstanten in `pipwerk_domain.limits`. Beim Lesen eines Dokuments prüft die Bibliothek sie und lehnt Überschreitungen als Fehler der Validierung (`DocumentError`) ab.

| Konstante | Wert | Bedeutung |
| --- | --- | --- |
| `MAX_DOCUMENT_BYTES` | 2 MiB | Größe eines Dokuments; die Bibliothek bietet nur die Konstante, das Backend prüft die Größe vor dem Lesen |
| `MAX_EXPRESSION_LENGTH` | 4096 | Länge eines Ausdrucks in Zeichen |
| `MAX_EXPRESSION_NESTING` | 64 | Schachtelungstiefe eines Ausdrucks: Klammern und Funktionsaufrufe ineinander; Klammern in Texten zählen nicht |
| `MAX_ELEMENTS` | 1000 | Elemente einer Strategie |
| `MAX_CONNECTIONS` | 4000 | Verbindungen einer Strategie |
| `MAX_RULES_PER_LIST` | 200 | Regeln je Liste (Strategie, Element, Indikator, Trend, Regelwerk, Instanz) |
| `MAX_STRATEGY_PARAMETERS` | 200 | Strategieparameter |
| `MAX_INSTANCE_NESTING` | 16 | Schachtelung von Instanzen in Instanzen; die Instanz eines Elements und eine Regel der Strategie sind Ebene 1, enthaltene Instanzen und Regeln eine Ebene tiefer |
| `MAX_FINDINGS_PER_EXPRESSION` | 50 | alle Befunde je Ausdruck zusammen. Die Liste ist abschließend: `expression.invalid`, `rule.unresolved_name` (auch Hinweise), `expression.order_outside_management`, `rule.result_mismatch` und `rule.order_in_indicator`. `rule.order_in_indicator` gehört bei einer Regel zum Ausdruck der Regel, bei einem Regelwerk zu dessen Ergebnisausdruck. Kein anderer Befund zählt dazu, insbesondere nicht `calculation.circular_reference` und `candle.no_instance`, denn sie betreffen mehrere Ausdrücke oder den Ablauf. Fallen weitere an, folgt genau ein `findings.truncated` (`scope` = `expression`) als letzter Befund des Ausdrucks; danach kommt kein Befund dieses Ausdrucks mehr. Die Zählung geschieht an einer Stelle der Prüfung (`Checker._expression_finding`) |
| `MAX_FINDINGS_PER_CHECK` | 1000 | Befunde je Prüfung einer Strategie oder Vorlage; die Prüfung endet, dazu kommt `findings.truncated` (`scope` = `check`) |

Die Grenzen der Befunde schützen Rechenzeit und Speicher (OWASP API4): Ein Dokument von 2 MiB mit lauter fehlerhaften Ausdrücken ergibt höchstens 1001 Befunde. Die Berechnungen werden dazu nach ihren Abhängigkeiten geordnet und ihre Befunde sofort gemeldet; der Speicher der Syntaxbäume wird nach dem Melden freigegeben. Die Tests mit Zeitgrenze messen die Zeit ohne laufendes `tracemalloc`, Zeit und Speicher getrennt. Die Zeitgrenze hat auf dem Rechner des Entwicklers mindestens den Faktor 10 Reserve; die Tests schützen vor einem Ausreißer der Laufzeit und belegen keine Antwortzeit. Die Laufzeit gültiger großer Dokumente liegt darüber und hängt vom Dokument ab; die Bibliothek sagt dafür keine Zeit zu.

Der Parser meldet einen zu langen oder zu tief geschachtelten Ausdruck auch beim Prüfen als Schreibfehler (`too_long`, `too_deep`). Die Schachtelung von Instanzen wird vor dem Aufbau der Modelle an den Rohdaten geprüft, damit auch sehr tiefe Eingaben den Stapel nicht erschöpfen.

## 12. Prüfungen

Alle Befehle laufen im Verzeichnis `packages/domain-core` (zum Beispiel mit `uv --directory packages/domain-core …`) und enden bei Erfolg mit Exitcode 0:

| Prüfung | Befehl |
| --- | --- |
| Umgebung einrichten | `uv sync --frozen` |
| Tests | `uv run --frozen pytest` |
| Stil | `uv run --frozen ruff check` und `uv run --frozen ruff format --check` |
| Typen (streng) | `uv run --frozen mypy` |
| Schemata neu erzeugen | `uv run --frozen python -m pipwerk_domain.documents.schemas ../../contracts/strategies/v1` |
| Schemata vergleichen | `uv run --frozen python -m pipwerk_domain.documents.schemas --check ../../contracts/strategies/v1` |

Die Tests (pytest) umfassen:

| Datei | Prüft |
| --- | --- |
| `test_identifiers.py` | Bildungsregel |
| `test_registry.py` | Register, Einstiegspunkt mit nachgebildeten Einstiegspunkten und mit einem Testpaket, auch fehlerhaft, Protokoll ohne Ausnahmetext und Pfad, Berechnungsverfahren und Ordertypen |
| `test_catalog.py` | alle mitgelieferten Typen, Beschriftungen, Kennungen nach der Bildungsregel, von der Anwendung belegte Eigenschaften, Funktionsliste |
| `test_parser.py` | Zerlegung: Werte, Operatoren, Rangfolge, Funktionen, Schreibfehler mit Stelle, Begrenzungen |
| `test_expression_check.py` | Typprüfung mit gültigen und fehlerhaften Fällen je Regel, Auswahlwerte, erkannte Namen, Normalisierung |
| `test_consistency_flow.py` | Befunde des Ablaufs, der Parameter, der Belegungen, von `Order`/`Position`, der Typen und der Kerze, jeweils mit Gegenprobe |
| `test_consistency_rules.py` | Ergebnis von Regeln, Regelwerke, Regeln in Indikatoren und Trends, Namensräume (S17), Zusammenhang der Typprüfung (S18, S27), Namen |
| `test_documents.py` | Schreiben und Lesen jedes Dokumenttyps, zusätzliche Felder, höhere Hauptversion, unbekannte Typen, jede Begrenzung am Grenzwert und darüber |
| `test_schemas.py` | erzeugte Schemata gleich den Dateien, Schemata gegen Dokumente, Befehl |
| `test_testcases.py` | beide Testfalldokumente: Schema, null Befunde, Schreiben und Vergleichen, Normalisierung ändert nichts, Vollständigkeit nach Abschnitt 6, abgewandelte Fassungen mit den Befunden |
| `test_risk_rule.py` | „Risiko je Trade“ als Regel der Strategie und eines Elements, Bestandteile, Kopie |
| `test_architecture.py` | keine Frameworks, Pydantic nur in `documents`, kein `eval`/`exec`/`compile`, keine festen Pfade, Ports und Rechnernamen, Laufzeitabhängigkeit nur Pydantic |
| `test_hardening.py` | Strategieparameter in Vorlagen und Instanzen, Zahlen ohne JSON-Wert, doppelte Schlüssel, Namen und Zahlen in ASCII, lange Ketten und Kreise von Berechnungen, fehlerhafte Einstiegspunkte, Grenzen der Befunde mit Zeit und Speicher, Stelle bei Auswahlwerten, Trend ohne Richtung, `str-01` |
| `test_hardening_2.py` | Einstiegspunkte je Paket, eine Grenze für alle Befunde eines Ausdrucks, einzelne Ersatzzeichen, Kodierung von Bytes, `PREVIOUS` ohne Abhängigkeit, Laufzeit und Speicher der Normalisierung |
| `test_hardening_3.py` | die Grenze von 50 Befunden je Ausdruck mit `expression.order_outside_management`, `rule.result_mismatch` und Hinweisen in Vorlagen sowie mit `rule.order_in_indicator` (Regel und Regelwerk in einer Vorlage `Indikator`) (jeweils mit Gegenprobe), Normalisierung von 2 MiB mit Umschreiben jedes Ausdrucks, Kreis und mehrfach eingehängte Teile bei der Prüfung auf Ersatzzeichen |
| `test_model.py` | Objektmodell |
| `test_normalize.py` | Normalisierung aller Ausdrücke einer Strategie oder Vorlage |
| `test_documentation.py` | Kennungen und Befunde dieses Dokuments stimmen mit dem Code überein |

## 13. Abhängigkeiten

Eine neue Abhängigkeit braucht einen dokumentierten Zweck und die Prüfung von Lizenz, Wartungszustand, Sicherheitsrisiko und Kopplungswirkung (Entwicklungsregeln, Abschnitt 5 Punkt 12). Die Versionen sind in `uv.lock` festgeschrieben.

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

1. Datentyp `object` für Eigenschaften, die auf ein Objekt der Anwendung verweisen (Abschnitt 3.1).
2. Kennungen der Zeiteinheiten sind klein geschrieben (`h1`); ein Strategieparameter vom Datentyp Zeiteinheit hat also Werte wie `"h1"`.
3. Prozent werden als Anteil gespeichert (`0.01`).
4. Die Bildungsregel behält einen vorhandenen Unterstrich.
5. Namen im gespeicherten Ausdruck: Objekte der Anwendung wie im Fachmodell (`Order`, `Konto`), alle Eigenschaften, Parameter von Typen und `ergebnis` in der Kennung (klein), Namen von Instanzen, Bedingungen, Berechnungen, Regeln und eigenen Parametern wie vergeben.
6. Ein leerer Ausdruck ist ein Schreibfehler (`unexpected_end`).
7. Eine Bedingung verlangt einen Wahrheitswert, eine nur prüfende Regel ebenfalls; der Ausdruck einer Berechnung hat keinen vorgeschriebenen Typ.
8. Ein Regelwerk ist ein geschlossener Namensraum bis auf die Objekte der Anwendung, darunter `Strategie` mit den Strategieparametern (Abschnitt 6; Festlegung des Softwarearchitekten nach dem Testbericht).
9. `PREVIOUS` verlangt als erstes Argument einen Namen.
10. Die Befunde aus Abschnitt 9.2 und die Hinweise `rule.unresolved_name` und `flow.no_order_reachable`.
11. Der Befund `candle.no_instance` wird nur gemeldet, wenn ein Ausdruck die Kerze unter dem Namen des Objekttyps (`Kerze.schluss`) verwendet.
12. Die Auswertung von Ausdrücken fehlt bewusst; die Bedeutung bei der Ausführung (Abschnitt 8) ist nur dokumentiert.
