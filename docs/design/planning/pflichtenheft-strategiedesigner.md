# Pflichtenheft – Strategiedesigner, Schritt 1: Strategien gestalten und speichern

## Status

- status: `draft`
- zweck: Technische Festlegungen für die Umsetzung von Schritt 1 des Strategiedesigner-Prototyps; Grundlage der Arbeitspakete AP2 bis AP9
- stand: 2026-10-10

## 1. Gegenstand

Schritt 1 umfasst das Gestalten, Prüfen, Speichern, Laden, Exportieren und Importieren von Strategien in Pipwerk Studio. Die Ausführung von Strategien (Debuggen, Testen) gehört nicht zu Schritt 1.

Prüffälle für Schritt 1 sind die Trendfolge mit zwei exponentiellen gleitenden Durchschnitten (`str-03`) und der einfache Punkt-2-Ausbruch (`str-01`). Beide müssen sich vollständig im Designer gestalten und speichern lassen.

## 2. Festlegungen

### PH-01 Fachkern ohne Framework-Abhängigkeit

Die fachlichen Objekttypen, das Strategieobjekt und die strukturelle Prüfung liegen im Python-Paket `packages/domain-core` (Paketname `pipwerk_domain`). Die Kernobjekte sind einfache Python-Klassen (`dataclass`) ohne Abhängigkeit von Pydantic, FastAPI oder SQLAlchemy. Pydantic wird ausschließlich an den Datengrenzen verwendet: Strategiedokument, Web-API, Konfiguration.

### PH-02 Selbstbeschreibung der Bausteine

Jeder Bausteintyp liefert eine Typbeschreibung (`NodeTypeDescriptor`) mit:

| Feld | Inhalt |
|---|---|
| `type_id` | eindeutige, sprachneutrale Kennung, z. B. `indicator.ema` |
| `category` | `trigger`, `indicator`, `trend`, `condition`, `calculation`, `rule`, `ruleset`, `action` |
| `labels` | Bezeichnung und Beschreibung in `de` und `en` |
| `parameters` | Liste von Parametern: Kennung, Datentyp, Pflicht, Standardwert, Wertebereich, erlaubte Bindungsarten, Beschriftungen |
| `inputs` | Eingaben: Kennung, erwarteter Datentyp, Beschriftungen |
| `outputs` | Ausgaben (Ergebnisse): Kennung, Datentyp, Beschriftungen |
| `flow` | Ablaufanschlüsse: `next` oder `true`/`false` (Bedingung) oder keine (reine Datenbausteine) |

Die Oberfläche baut Bausteinbibliothek, Knoten und Eigenschaftenansicht allein aus diesen Beschreibungen auf. Sie enthält keine Kenntnis einzelner Bausteintypen.

### PH-03 Bausteinregister

Bausteintypen werden in einem Register (`NodeTypeRegistry`) angemeldet. Das Register liefert alle Typbeschreibungen und erzeugt Knoten eines Typs. Mitgelieferte Typen werden beim Laden des Pakets angemeldet. Die Anmeldung weiterer Typen aus anderen Python-Paketen erfolgt über den Einstiegspunkt `pipwerk.node_types` (Python Entry Points); benutzerdefinierte Objekttypen ohne Programmierung gehören nicht zu Schritt 1.

### PH-04 Datentypen für Parameter und Ergebnisse

Zulässige Datentypen: `number`, `integer`, `boolean`, `string`, `enum`, `timeframe`, `instrument`, `direction` (`long`, `short`, `flat`), `price`, `volume`, `series` (Wertreihe), `reference` (Verweis auf die Ausgabe eines anderen Knotens), `rule` (Verweis auf eine Regel). Jeder Parameter trägt die erlaubten Bindungsarten: `fixed` (Wert in der Strategie), `rule` (durch Regel bestimmt), `runtime` (bei Anwendung übergeben), `reference` (Ausgabe eines anderen Knotens).

### PH-05 Strategieobjekt

`Strategy` besteht aus Kopf (`id` als UUID, `name`, `description`), `trigger` (Knoten der Kategorie `trigger`), `nodes` (Knoten mit `id`, `type_id`, Parameterbelegungen, Position), `edges` (Kanten mit Quelle, Ziel und Anschluss `next`/`true`/`false`) und `rules` (strategiebezogene Regeln). Knoten der Kategorien `indicator`, `trend`, `rule`, `ruleset` sind Datenbausteine ohne Ablaufanschluss; sie werden über `reference` verwendet. Knoten der Kategorien `condition`, `calculation`, `action` sind Ablaufelemente.

### PH-06 Strukturelle Prüfung

Der Fachkern prüft eine Strategie ohne Ausführung auf: unbekannte Bausteintypen, fehlende Pflichtparameter, unzulässige Bindungsarten, Verweise auf nicht vorhandene Knoten oder Ausgaben, Datentypkonflikte zwischen Ausgabe und Eingabe, mehr als einen Auslöser, Kanten an nicht vorhandenen Anschlüssen, Zyklen im Ablauf, vom Auslöser aus nicht erreichbare Ablaufelemente. Ergebnis ist eine Liste von Befunden mit Schwere (`error`, `warning`), Knotenbezug und sprachneutraler Kennung; die Oberfläche übersetzt Befunde in `de` und `en`.

### PH-07 Strategiedokument

Das Strategiedokument ist die JSON-Serialisierung von `Strategy`. Kopffelder: `format` = `pipwerk.strategy`, `format_version` = `1.0`. Das JSON-Schema wird aus den Pydantic-Grenzmodellen erzeugt und unter `contracts/strategies/v1/strategy.schema.json` abgelegt. Beim Laden wird gegen das Schema geprüft; Dokumente mit unbekannter höherer Formatversion werden abgelehnt. Die Zuordnung Fachkernobjekt ↔ Dokument ist in beide Richtungen verlustfrei.

### PH-08 Ablage in Pipwerk Studio

Strategien liegen als Dateien `<uuid>.strategy.json` im Strategieverzeichnis, das in der INI-Startkonfiguration unter `[strategies] directory` festgelegt ist. Die Datenbank führt die Tabelle `strategy_index` mit `id`, `name`, `description`, `format_version`, `file_name`, `created_at`, `updated_at`. Die Datei ist maßgeblich; ein Abgleich baut den Index aus den Dateien neu auf. Mit dieser Schemaerweiterung wird Alembic eingeführt.

### PH-09 Web-API von Pipwerk Studio

Die öffentliche Web-API liegt unter `/api/v1/`; ihre OpenAPI-Beschreibung wird unter `contracts/api/pipwerk-studio/v1/openapi.json` abgelegt.

| Methode | Pfad | Zweck |
|---|---|---|
| `GET` | `/api/v1/node-types` | alle Typbeschreibungen (PH-02) |
| `GET` | `/api/v1/strategies` | Index aller Strategien |
| `POST` | `/api/v1/strategies` | Strategie anlegen (Dokument im Body) |
| `GET` | `/api/v1/strategies/{id}` | Strategiedokument lesen |
| `PUT` | `/api/v1/strategies/{id}` | Strategiedokument speichern |
| `DELETE` | `/api/v1/strategies/{id}` | Strategie löschen |
| `POST` | `/api/v1/strategies/validate` | Dokument prüfen (PH-06), ohne zu speichern |
| `POST` | `/api/v1/strategies/import` | Dokument aus Datei übernehmen; bei vorhandener Kennung neue Kennung vergeben |
| `GET` | `/api/v1/strategies/{id}/export` | Dokument als Datei herunterladen |

Speichern prüft strukturell; Befunde der Schwere `error` verhindern das Speichern nicht, werden aber in der Antwort zurückgegeben, damit unfertige Strategien gespeichert werden können. Die bestehenden internen Endpunkte unter `/api/` bleiben unverändert.

### PH-10 Oberfläche

Aufbau: Bausteinbibliothek links, Zeichenfläche (React Flow) in der Mitte, Eigenschaftenansicht rechts, Werkzeugleiste oben (Neu, Öffnen, Speichern, Prüfen, Exportieren, Importieren), Befundliste unten. Knoten werden aus der Bibliothek auf die Fläche gezogen und über Anschlüsse verbunden; Datenbausteine zeigen ihre Ausgaben als Anschlüsse. Die Eigenschaftenansicht wird aus der Typbeschreibung erzeugt; je Parameter sind die erlaubten Bindungsarten wählbar. Das React-Flow-Modell ist Darstellung; maßgeblich ist das Strategiedokument, das bei jeder Änderung daraus abgeleitet wird. Alle sichtbaren Texte sind in `de` und `en` vorhanden; Beschriftungen der Bausteine kommen aus den Typbeschreibungen.

### PH-11 Bausteine für Schritt 1

| `type_id` | Kategorie | Parameter (Auszug) | Ausgaben (Auszug) |
|---|---|---|---|
| `trigger.candle_close` | trigger | `timeframe`, `instrument` | – |
| `trigger.tick` | trigger | `instrument` | – |
| `indicator.ema` | indicator | `source` (reference/series), `period` | `value` |
| `indicator.atr` | indicator | `period` | `value` |
| `indicator.zigzag` | indicator | `depth`, `deviation`, `backstep` | `point1`, `point2`, `point3`, `last_high`, `last_low` |
| `trend.ema_cross` | trend | `fast` (reference), `slow` (reference) | `direction`, `cross_over`, `cross_under` |
| `trend.market_structure` | trend | `zigzag` (reference), `timeframe` | `direction`, `phase` (`movement`/`correction`), `point1`, `point2`, `point3` |
| `condition` | condition | `expression` | – (Ablauf `true`/`false`) |
| `calculation` | calculation | `expression` | `value` |
| `rule` | rule | `name`, `expression`, `mode` (`check`/`determine`) | `result` |
| `ruleset` | ruleset | `rules` (geordnete Verweise), `aggregate` | `result` |
| `action.order_builder` | action | `order_type`, Ordereigenschaften je Typ, `validity_rule` | – |

Ausdrücke (`expression`) verwenden Konstanten, Verweise auf Ausgaben (`node.output`), Ergebnisse von Regeln sowie arithmetische, Vergleichs- und logische Operatoren; keine Funktionen. Der Ausdruck wird im Fachkern geparst und typgeprüft, nicht ausgewertet.

Ordertypen für `action.order_builder` in Schritt 1: `market` und `close` nach Fachmodell sowie die MT5-Pending-Typen `buy_stop`, `sell_stop`, `buy_limit`, `sell_limit` mit `instrument`, `direction`, `volume`, `price`, `stop_loss`, `take_profit`, `expiration`. Die Pending-Typen werden im Fachmodell ergänzt (siehe Abschnitt 3).

### PH-12 Prüfungen und Nachweis

Jedes Arbeitspaket erfüllt die Prüfregeln aus `docs/technical/development-test-security-rules.md`. Der Nachweis von Schritt 1 besteht aus beiden Prüffällen als Strategiedokumente unter `contracts/strategies/v1/examples/`, deren Schema-Gültigkeit und strukturelle Fehlerfreiheit per pytest geprüft wird, sowie je einem Playwright-Ablauf, der die Strategie in der Oberfläche aus der leeren Fläche aufbaut, speichert, neu lädt und das Dokument mit dem Beispiel vergleicht.

## 3. Offene Punkte

1. Pending-Ordertypen (`buy_stop`, `sell_stop`, `buy_limit`, `sell_limit`) sind im Fachmodell noch nicht als spezialisierte Ordertypen beschrieben; sie fallen unter die MT5-Standard-Ordertypen der ersten Entwicklungsphase. Ergänzung im Fachmodell steht aus.
2. Als Punkt-2-Prüffall wird die einfache Variante `str-01` verwendet; `str-02` ist noch nicht erfasst.

## 4. Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-10 | Erstfassung für Schritt 1. |
