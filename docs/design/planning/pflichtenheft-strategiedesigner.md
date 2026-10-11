# Pflichtenheft – Strategiedesigner, Schritt 1: Strategien gestalten und speichern

## Status

- status: `draft`
- zweck: Technische Festlegungen für die Umsetzung von Schritt 1 des Strategiedesigner-Prototyps. Grundlage der Arbeitspakete AP2 bis AP9.
- stand: 2026-10-11
- abstimmung: erste Abstimmungsrunde mit dem Nutzer am 2026-10-10/11 durchgeführt. Die Begriffe folgen dem [Glossar](../../technical/glossar.md).

## 1. Gegenstand

Schritt 1 umfasst das Anlegen, Gestalten, Prüfen, Speichern, Laden, Exportieren und Importieren von Strategien und der darin verwendeten wiederverwendbaren Objekte in Pipwerk Studio. Die Ausführung von Strategien (Schritt 2: Debuggen, Schritt 3: Testen) gehört nicht zu Schritt 1. Deren Anforderungen werden erst erhoben, wenn der Bedienablauf des Designers feststeht.

Prüffälle für Schritt 1 sind die Trendfolge mit zwei exponentiellen gleitenden Durchschnitten (`str-03`) und der einfache Punkt-2-Ausbruch (`str-01`). Beide müssen sich vollständig im Designer gestalten, speichern und wieder laden lassen.

## 2. Festlegungen

### PH-01 Gemeinsame Python-Bibliothek

Die fachlichen Objekte, die Typbeschreibungen der Bausteine, die Berechnungen der mitgelieferten Indikatoren und die Prüfung liegen in der gemeinsamen Python-Bibliothek `packages/domain-core` (Paketname `pipwerk_domain`). Ihre Klassen sind einfache Python-Klassen (`dataclass`) ohne Abhängigkeit von Pydantic, FastAPI oder SQLAlchemy. Pydantic wird nur an den Schnittstellen verwendet: beim Lesen und Schreiben von Dokumenten, in der Web-API und beim Lesen der Konfiguration.

### PH-02 Typbeschreibung der Bausteine

Jeder Bausteintyp liefert eine Typbeschreibung (`NodeTypeDescriptor`):

| Feld | Inhalt |
|---|---|
| `type_id` | eindeutige, sprachneutrale Kennung, z. B. `indicator.ema`, `order.mt5.buy_stop` |
| `category` | `trigger`, `indicator`, `trend`, `condition`, `calculation`, `rule`, `ruleset`, `action` |
| `labels` | Bezeichnung und Beschreibung in `de` und `en` |
| `parameters` | je Parameter: Kennung, Datentyp, Pflicht, Standardwert, Wertebereich, erlaubte Bindungsarten, Beschriftungen |
| `inputs` | Eingaben: Kennung, erwarteter Datentyp, Beschriftungen |
| `outputs` | Ausgaben: Kennung, Datentyp, Beschriftungen |
| `flow` | Ablaufanschlüsse: `next`, oder `true`/`false` (Bedingung), oder keine (Objekte, die nur über Ausgaben verwendet werden) |
| `storage` | `embedded` (nur in der Strategiedatei) oder `standalone` (eigene Datei, Index, Verwendung per Verweis) |

Die Oberfläche baut Bausteinbibliothek, Bausteine und Eigenschaftenansicht allein aus diesen Beschreibungen auf. Sie enthält keine Kenntnis einzelner Bausteintypen.

### PH-03 Bausteinregister

Bausteintypen werden in einem Register (`NodeTypeRegistry`) angemeldet. Das Register liefert alle Typbeschreibungen und erzeugt Bausteine eines Typs. Mitgelieferte Typen werden beim Laden der Bibliothek angemeldet. Weitere Typen aus anderen Python-Paketen (zum Beispiel die Ordertypen einer Handelssoftware) melden sich über den Einstiegspunkt `pipwerk.node_types` (Python Entry Points) an. Benutzerdefinierte Objekttypen ohne Programmierung gehören nicht zu Schritt 1.

### PH-04 Datentypen und Bindungsarten

Datentypen für Parameter, Eingaben und Ausgaben: `number`, `integer`, `boolean`, `string`, `enum`, `timeframe`, `instrument`, `direction` (`long`, `short`, `flat`), `price`, `volume`, `series` (Wertreihe), `reference` (Ausgabe eines anderen Bausteins), `rule` (Verweis auf eine Regel).

Bindungsarten eines Parameters: `fixed` (Wert in der Strategie), `rule` (durch eine Regel bestimmt), `runtime` (bei der Anwendung übergeben), `reference` (Ausgabe eines anderen Bausteins). Die Typbeschreibung nennt je Parameter die erlaubten Bindungsarten.

### PH-05 Strategie und ihre Objekte

`Strategy` besteht aus Kennung (UUID), Bezeichnung, Beschreibung, genau einem Auslöser, den Bausteinen mit ihren Parameterwerten und Positionen, den Verbindungen (Quelle, Ziel, Anschluss `next`/`true`/`false` oder Ausgabe → Eingabe) und den Verweisen auf eigenständig gespeicherte Objekte.

| Objekt | Ablage |
|---|---|
| Auslöser, Bedingung, Berechnung, Order-Aktion, Verbindungen | eingebettet in der Strategiedatei |
| konfigurierte Indikatoren, konfigurierte Trends, Regeln, RegelSets | eigenständig (eigene Datei, Index), in der Strategie per Verweis |

Eigenständige Objekte werden einmal angelegt und in beliebig vielen Strategien verwendet. Die Strategiedatei enthält nur ihre Kennung.

### PH-06 Prüfung

Die gemeinsame Python-Bibliothek prüft eine Strategie ohne Ausführung. Die Prüfung läuft beim Speichern und auf Anforderung. Speichern bleibt auch mit Fehlern möglich, damit unfertige Strategien abgelegt werden können. Die Befunde werden beim Speichern zurückgegeben. Ausführen (Schritt 2 und 3) darf nur eine fehlerfreie Strategie.

Geprüft wird: unbekannter Bausteintyp, fehlender Pflichtparameter, unzulässige Bindungsart, Verweis auf ein nicht vorhandenes Objekt oder eine nicht vorhandene Ausgabe, Datentypkonflikt zwischen Ausgabe und Eingabe, mehr als ein Auslöser, Verbindung an einem nicht vorhandenen Anschluss, Kreis im Ablauf, vom Auslöser aus nicht erreichbares Ablaufelement.

Ein Befund hat eine Stufe (`error`: nicht ausführbar, `warning`: ausführbar, aber auffällig), eine sprachneutrale Kennung und den betroffenen Baustein. Die Oberfläche übersetzt die Kennung in `de` und `en` und springt zum Baustein.

### PH-07 Dokumente und Schemata

Jedes eigenständig gespeicherte Objekt und die Strategie werden als JSON-Dokument geschrieben und gelesen. Für jeden Objekttyp (Strategie, Baustein, Verbindung, Parameterwert, Regel, RegelSet, Indikator, Trend) gibt es ein Pydantic-Modell an der Schnittstelle, das die Abbildung Objekt ↔ JSON übernimmt. Aus diesen Modellen werden die JSON-Schemata erzeugt. Das Schema des Strategiedokuments setzt sich aus den Schemata der enthaltenen Objekttypen zusammen.

Kopffelder jedes Dokuments: `format` (z. B. `pipwerk.strategy`, `pipwerk.rule`, `pipwerk.indicator`), `format_version` = `1.0`. Die Schemata liegen unter `contracts/strategies/v1/`. Beim Laden wird gegen das Schema geprüft. Dokumente mit unbekannter höherer Formatversion werden abgelehnt. Dass Schreiben und Lesen jedes Objekttyps wieder dasselbe Objekt ergibt, wird mit pytest geprüft.

JSON statt Python-eigener Serialisierung (pickle), weil die Oberfläche in TypeScript dieselben Dokumente über die Web-API liest und schreibt, weil Export, Import und spätere Nachrichten ein allgemein lesbares Format brauchen, und weil pickle beim Einlesen Code ausführt und bei Klassenänderungen bricht.

### PH-08 Ablage in Pipwerk Studio

Jedes eigenständige Objekt liegt als Datei `<uuid>.<art>.json` (Art: `strategy`, `indicator`, `trend`, `rule`, `ruleset`) im Objektverzeichnis, das in der INI-Startkonfiguration unter `[storage] directory` festgelegt ist. Die Datei ist die verbindliche Fassung des Objekts.

Die Datenbank führt je Art eine Indextabelle (`strategy_index`, `indicator_index`, `trend_index`, `rule_index`, `ruleset_index`) mit `id`, `name`, `description`, `format_version`, `file_name`, `created_at`, `updated_at`. Der Index enthält das Objekt nicht, sondern verweist auf die Datei. Ein Abgleich baut den Index aus den Dateien neu auf. Mit dieser Schemaerweiterung wird Alembic eingeführt. Objekte mit schutzbedürftigen Inhalten (Zugangs- und Kontodaten) fallen nicht unter dieses Ablagemuster.

### PH-09 Web-API von Pipwerk Studio

Die öffentliche Web-API liegt unter `/api/v1/`. Ihre OpenAPI-Beschreibung wird unter `contracts/api/pipwerk-studio/v1/openapi.json` abgelegt. `<art>` steht für `strategies`, `indicators`, `trends`, `rules`, `rulesets`.

| Methode | Pfad | Zweck |
|---|---|---|
| `GET` | `/api/v1/node-types` | alle Typbeschreibungen (PH-02) |
| `GET` | `/api/v1/<art>` | Index aller Objekte der Art |
| `POST` | `/api/v1/<art>` | Objekt anlegen (Dokument im Body) |
| `GET` | `/api/v1/<art>/{id}` | Dokument lesen |
| `PUT` | `/api/v1/<art>/{id}` | Dokument speichern |
| `DELETE` | `/api/v1/<art>/{id}` | Objekt löschen. Wird es noch verwendet, wird das Löschen abgelehnt und die verwendenden Strategien werden genannt. |
| `POST` | `/api/v1/strategies/validate` | Strategie prüfen (PH-06), ohne zu speichern |
| `POST` | `/api/v1/<art>/import` | Dokument aus Datei übernehmen. Bei vorhandener Kennung wird eine neue vergeben. |
| `GET` | `/api/v1/<art>/{id}/export` | Dokument als Datei herunterladen. Beim Export einer Strategie werden die verwendeten eigenständigen Objekte mitgeliefert. |

Die bestehenden internen Endpunkte unter `/api/` bleiben unverändert.

### PH-10 Oberfläche

Der Entwurf der Oberfläche wird getrennt erstellt und mit dem Nutzer abgestimmt, bevor AP6 bis AP8 beauftragt werden. Er baut auf den vorhandenen Elementen von Pipwerk Studio (Sprachauswahl als Auswahlliste, Standanzeige, Zeichenfläche) und den bisherigen Entwürfen unter `docs/design/ui/` auf und spielt den Bedienablauf von „neue Strategie“ bis „gespeichert“ an der EMA-Trendfolge durch.

Technisch festgelegt: Die Bausteinbibliothek zeigt zwei Ebenen, die Bausteintypen zum Anlegen neuer Objekte und die bereits angelegten eigenständigen Objekte zum Einfügen per Verweis. Die Eigenschaftenansicht wird aus der Typbeschreibung erzeugt. Das React-Flow-Modell ist Darstellung. Maßgeblich ist das Strategiedokument, das bei jeder Änderung daraus abgeleitet wird. Alle sichtbaren Texte sind in `de` und `en` vorhanden. Beschriftungen der Bausteine kommen aus den Typbeschreibungen.

### PH-11 Bausteine für Schritt 1

| `type_id` | Kategorie | Ablage | Parameter (Auszug) | Ausgaben (Auszug) |
|---|---|---|---|---|
| `trigger.candle_close` | trigger | eingebettet | `timeframe`, `instrument` | – |
| `trigger.tick` | trigger | eingebettet | `instrument` | – |
| `indicator.ema` | indicator | eigenständig | `source`, `period` | `value` |
| `indicator.atr` | indicator | eigenständig | `period` | `value` |
| `indicator.zigzag` | indicator | eigenständig | `depth`, `deviation`, `backstep` | `point1`, `point2`, `point3`, `last_high`, `last_low` |
| `trend.ema_cross` | trend | eigenständig | `fast`, `slow` (Verweise auf Indikatoren) | `direction`, `cross_over`, `cross_under` |
| `trend.market_structure` | trend | eigenständig | `zigzag` (Verweis), `timeframe` | `direction`, `phase` (`movement`/`correction`), `point1`, `point2`, `point3` |
| `condition` | condition | eingebettet | `expression` | – (Ablauf `true`/`false`) |
| `calculation` | calculation | eingebettet | `expression` | `value` |
| `rule` | rule | eigenständig | `name`, `expression`, `mode` (`check`/`determine`) | `result` |
| `ruleset` | ruleset | eigenständig | `rules` (geordnete Verweise), `aggregate` | `result` |
| `action.order_builder` | action | eingebettet | `order_type`, Eigenschaften je Ordertyp, `validity_rule` | – |

Die mitgelieferten Indikatoren bringen ihre Berechnung mit (Python-Funktion über eine Wertreihe, mit pytest geprüft). Ein Indikator kann aus fest programmierten Python-Einheiten, aus Regeln oder aus einer Kombination bestehen. Nach außen (Typbeschreibung, Parameter, Ausgaben, Dokument) ist das nicht unterscheidbar. Indikatoren aus Regeln gehören nicht zu Schritt 1.

Ausdrücke (`expression`) verwenden Konstanten, Verweise auf Ausgaben (`baustein.ausgabe`), Ergebnisse von Regeln sowie arithmetische, Vergleichs- und logische Operatoren. Keine Funktionen. Der Ausdruck wird in der gemeinsamen Python-Bibliothek geparst und typgeprüft, in Schritt 1 nicht ausgewertet.

Ordertypen: Jeder Ordertyp ist ein Bausteintyp mit Typbeschreibung. Er wird vom Paket angemeldet, das die jeweilige Handelssoftware anbindet, und trägt deren Namensraum (`order.mt5.*`). Eine Strategie darf jeden angemeldeten Ordertyp verwenden. Ob Handelssoftware, Broker und Instrument eines Kontos den Typ anbieten, prüft das Handelssystem bei der Zuordnung der Strategie zu einem Konto. Pipwerk übersetzt keinen Ordertyp einer Handelssoftware in den einer anderen. In Schritt 1 werden die Ordertypen von MetaTrader 5 angemeldet, wie im Fachmodell beschrieben.

### PH-12 Prüfungen und Nachweis

Jedes Arbeitspaket erfüllt die Prüfregeln aus `docs/technical/development-test-security-rules.md`. Der Nachweis von Schritt 1 besteht aus:

1. Beide Prüffälle liegen als Dokumentdateien (Strategie und ihre eigenständigen Objekte) unter `contracts/strategies/v1/testcases/`. Automatische Tests laden sie, prüfen sie gegen die Schemata und die Prüfung aus PH-06, schreiben sie wieder und vergleichen das Ergebnis mit der Ausgangsdatei.
2. Ein Browsertest mit Playwright baut jeden Prüffall in der Oberfläche aus der leeren Zeichenfläche auf, speichert, lädt neu, exportiert und vergleicht die exportierten Dateien mit den Dateien aus Punkt 1.
3. Der Nutzer erprobt beide Prüffälle in der Testumgebung mit der Anwenderdokumentation. Seine Abnahme schließt Schritt 1 ab.

## 3. Offene Punkte

1. Die Ordertypen von MetaTrader 5 mit allen Eigenschaften, Ausführungs- und Ablaufvarianten sind noch nicht vollständig erfasst. Die Erfassung aus der MetaTrader-Dokumentation legt der Projektleiter dem Nutzer vor AP4 zur Abstimmung vor.
2. Der Entwurf der Oberfläche (PH-10) steht aus und wird vor AP6 abgestimmt.
3. PostgreSQL und MariaDB sollen zu gegebener Zeit in die Tests aufgenommen werden.

## 4. Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-11 | Nach erster Abstimmungsrunde: Begriffe nach Glossar. Indikatoren, Trends, Regeln und RegelSets als eigenständig gespeicherte Objekte. Mitgelieferte Indikatoren mit Berechnung. Ordertypen aus Anbindungspaketen ohne allgemeine Ebene. Prüfung mit Zeitpunkt und Folgen beschrieben. Oberflächenentwurf als getrennter Abstimmungspunkt. Begründung für JSON ergänzt. |
| 2026-10-10 | Erstfassung für Schritt 1. |
