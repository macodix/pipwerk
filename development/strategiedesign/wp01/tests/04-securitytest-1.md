# Testbericht Sicherheit, Auftrag 04, Durchlauf 1

- Bezug: `strategiedesign/wp01`
- Prüfauftrag: `strategiedesign/wp01:development/strategiedesign/wp01/tests/04-1-order.md`
- Geprüfter Commit: `6fee975f6f01ecfecbca44154864e157f20bcfd2` (Zweig `strategiedesign/wp01-04`)
- Ausgangscommit für den Vergleich: `761979bf3e9813d9444bdc7d4c0fe572f38405fa`
- Grundlagen: Auftrag `development/strategiedesign/wp01/orders/04.md`, `docs/technical/development-test-security-rules.md` (Abschnitte 5, 7, 8, 9), `docs/technical/entwicklungsverfahren.md` („Umfang der Prüfungen“), BSI IT-Grundschutz CON.8 und APP.7, OWASP ASVS, OWASP API Security Top 10
- Art des Durchlaufs: erster Durchlauf, vollständig

## Ergebnis

**bestanden**

Es gibt keinen blockierenden Befund und keinen Hinweis.

## Kontrolle des Commits

`git -C <Arbeitsverzeichnis> rev-parse HEAD` ergab `6fee975f6f01ecfecbca44154864e157f20bcfd2`. Zwischen Ausgangscommit und geprüftem Commit liegt genau dieser eine Commit (`git log --oneline 761979b..HEAD`).

## Prüfungen und Nachweise

### 1. Keine Änderung am Programmcode

`git diff --name-status 761979b HEAD` nennt 15 Dateien:

- neu: `components/pipwerk-studio/backend/tests/test_user_documentation_examples.py` (Test)
- neu: neun Dateien unter `contracts/strategies/v1/examples/` (Beispieldokumente)
- geändert: `contracts/strategies/README.md`, `docs/technical/pipwerk-domain.md`, `docs/technical/pipwerk-studio.md`, `docs/user/pipwerk-studio.md`
- geändert: `packages/domain-core/tests/test_schemas.py` (Test)

Keine Datei unter `src/` von Backend oder Bibliothek, keine Datei der Oberfläche, keine Lockdatei, keine Konfiguration und kein Skript ist geändert. Die Abhängigkeiten sind damit unverändert; eine neue Prüfung mit `pip-audit` oder `npm audit` war nicht veranlasst.

Ergebnis: erfüllt.

### 2. Keine Zugangsdaten, Pfade, Benutzer- oder Rechnernamen

Suche mit `git grep -i -E` am Commit nach absoluten Pfaden (`/srv`, `/home`, `/var/`, `/tmp`, `/root`), Namen des Entwicklungsrechners und der Benutzer, Wörtern wie `password`, `passwort`, `secret`, `token`, `api_key`, `bearer`, privaten Schlüsseln, URLs und IP-Adressen:

- In den neun Beispieldokumenten, im neuen Test, in `contracts/strategies/README.md` und in `test_schemas.py`: einziger Treffer ist die Kennung des JSON-Schema-Standards `https://json-schema.org/draft/2020-12/schema` in `test_schemas.py`, Zeile 72 (unverändert, kein Geheimnis).
- In `docs/user/pipwerk-studio.md`: Treffer nur in Zeilen, die dieser Commit nicht ändert (Zeilen 28, 32, 157, 217, 232, 246, 252: Loopback-Adresse, Warnhinweis zu `--host`, Adresse des öffentlichen Repositorys, Beispieladresse `192.168.0.12`, erfundener Beispielpfad `/home/beispiel/pipwerk`).
- Die geänderten Abschnitte der technischen Dokumentation enthalten keine solchen Angaben (Durchsicht des vollständigen Diffs).

Die Beispieldokumente enthalten nur fachliche Inhalte: Titel, Beschreibungen, Ausdrücke mit Vergleichsoperatoren, UUIDs. Eine Suche nach `<`, `script`, `javascript`, `onerror`, Unicode-Maskierungen und `../` fand nur Vergleichsoperatoren in Ausdrücken; keine Auszeichnung, kein Pfad.

Ergebnis: erfüllt (Grundregel 8.2 Nr. 1).

### 3. Keine Empfehlung unsicherer Bedienung

- Die neuen Unterabschnitte „Beispieldokumente“, „Vorlage anlegen, ändern und löschen“ und „Befunde der Konsistenzprüfung“ (`docs/user/pipwerk-studio.md`, Zeilen 47 bis 103) verwenden ausschließlich `/docs` am Hintergrunddienst. Dieser ist nach dem einleitenden, unveränderten Absatz (Zeile 38) nur unter `http://127.0.0.1:<Port>/docs` erreichbar. Die neuen Schritte nennen kein `--host` und keine Netzwerkadresse.
- Die Schritte verlangen nur das Einfügen der Dokumente in „Try it out“, das Ersetzen der Kennung bei `PUT` und Löschen nur der selbst angelegten Vorlage. Sie verlangen keine Änderung des Objektverzeichnisses, kein Abschalten von Prüfungen und keine Ablage von Daten außerhalb der Testumgebung.
- Der Warnhinweis zu `--host` (Zeile 32) und die Übersicht der Risiken (Zeile 217) sind unverändert.
- `docs/technical/pipwerk-studio.md` Abschnitt 8: Die Maßnahmen im Absatz „Öffentliche Web-API“ stehen jetzt in der Reihenfolge (1) bis (8). Inhalt und Umfang jeder Maßnahme sind gleich geblieben; der Verweis „Maßnahme 7 unten“ trifft zu. Die Aussage, dass keine Authentifizierung eingerichtet ist, bleibt erhalten (nur der veraltete Bezug ist ersetzt). Die Sicherheitsdokumentation ist damit weder abgeschwächt noch widersprüchlich.
- Abschnitt 7: Der Befund `source-map-js` aus `npm audit` steht weiter als nicht behoben (Verweis auf Abschnitt 9, dort Zeile „Der `npm audit`-Befund zu `source-map-js` (Abschnitt 7) ist nicht behoben.“).

Ergebnis: erfüllt.

### 4. Tests ohne unkontrollierte Seiteneffekte

- `test_user_documentation_examples.py` liest die Beispieldateien und die Anwenderdokumentation nur und arbeitet über den Testclient. Die Fixtures `client`, `home` und `objects` (`tests/conftest.py`, Zeilen 30 bis 44) legen Datenbank und Objektverzeichnis unter `tmp_path` an. Keine Netzwerkzugriffe, keine festen Pfade (Pfad zum Repository aus `__file__`, `tests/web_api_support.py`, Zeile 13).
- `test_schemas.py` liest die Beispieldateien und prüft sie gegen Schema und Schreibweise.
- Nach allen Läufen zeigt `git status --short --ignored` keine geänderte oder neue verfolgte Datei, nur von Git ignorierte Zwischenstände (`.venv`, Caches).

Ergebnis: erfüllt (Abschnitt 9, Zeile pytest).

### 5. Prüfwerkzeuge, selbst ausgeführt

| Komponente | Befehl | Ergebnis |
| --- | --- | --- |
| Backend | `uv run --frozen pytest -q -p no:cacheprovider` | 677 passed |
| Backend | `uv run --frozen ruff check --no-cache` | All checks passed |
| Backend | `uv run --frozen ruff format --check --no-cache` | 49 files already formatted |
| Backend | `uv run --frozen mypy` | no issues found in 49 source files |
| Bibliothek | `uv run --frozen pytest -q -p no:cacheprovider` | 985 passed |
| Bibliothek | `uv run --frozen ruff check --no-cache` | All checks passed |
| Bibliothek | `uv run --frozen ruff format --check --no-cache` | 51 files already formatted |
| Bibliothek | `uv run --frozen mypy` | no issues found in 50 source files |

Die Zahlen stimmen mit den Angaben des Entwicklers überein.

## Befundliste

Keine Befunde.

## Gültigkeit

Dieser Bericht gilt nur für den Commit `6fee975f6f01ecfecbca44154864e157f20bcfd2`.
