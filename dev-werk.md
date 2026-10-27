# Projektkonfiguration

Angaben des Projekts Pipwerk für die Arbeit mit dev-werk. Verfahren, Rollen, Briefings und Skills liegen in dev-werk (Eintrag unten), deutsche Fassung unter `de/`.

| Feld | Wert |
|---|---|
| Projektname | Pipwerk |
| dev-werk | `/srv/aixlab/dev/dev-werk` |

## Rolleninstanzen der Entwickler und Tester

| Instanz | Gebiet | Techniken und Werkzeuge |
|---|---|---|
| Entwickler Backend (`backend`) | Fachobjekte, Web-API, Typprüfung; Datenbank und Ablage: Schema, Migrationen, Transaktionen | gemeinsame Python-Bibliothek und Backends |
| Entwickler Oberfläche (`frontend`) | Browseroberflächen: Bedienbarkeit, Zweisprachigkeit, Browsertests | React |
| Tester Funktion (`functiontest`) | Funktionstest, Code- und Dokumentationsprüfung | Prüfskript je Komponente |
| Tester Sicherheit (`securitytest`) | Sicherheitsprüfung nach BSI-Grundschutz und OWASP | – |

## Testumgebungen

Ports und Datenbank sind Parameter oder Konfiguration, keine festen Werte im Code. Feste Ports nur für die Testumgebung zur Abnahme:

| Komponente | Oberfläche | Hintergrunddienst |
|---|---|---|
| pipwerk Studio | 5174 | 8001 |

## Orte der Projektdokumente

| Dokument | Ort |
|---|---|
| Anforderungsdokumente | `docs/design/requirements/` |
| Vorgemerkte Anforderungen | `docs/design/requirements/vorgemerkte-anforderungen.md` |
| Entwicklungs-, Test- und Sicherheitsregeln | `docs/technical/development-test-security-rules.md` |
| Glossar | `docs/technical/glossar.md` |

## Modellzuordnung

| Rolle | Modell |
|---|---|
| Softwarearchitekt | einstellbar, derzeit Opus |
| alle übrigen Rollen | einstellbar, derzeit Sonnet |
