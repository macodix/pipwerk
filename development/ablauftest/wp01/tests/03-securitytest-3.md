# Testbericht Sicherheitstest, Auftrag 03, Durchlauf 3

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: Tester Sicherheit
- Prüfauftrag: `development/ablauftest/wp01/tests/03-securitytest-3-order.md` auf dem Zweig `ablauftest/wp01`
- geprüfter Commit: `33c30fcc30bd12d5a85f9164c548646f1fdf5307` (Zweig `ablauftest/wp01-03`)
- Vergleichsstand: `42d3938843f2cf321230a9a04a412bc01e2f40f3` (Durchlauf 2, bestanden)
- Datum: 2026-10-14

## Ergebnis

**bestanden**

Keine Befunde. Der Commit ändert nur die Glossareinträge „Arbeitsverzeichnis“ und „ausgecheckt“ in `docs/user/pipwerk-studio.md`. Die neuen Sätze enthalten keine sicherheitsrelevanten Aussagen und keine Pfade, Namen, Adressen oder Zugangsdaten. Die Ergebnisse aus Durchlauf 2 gelten auch für diesen Commit.

## Prüfgrundlagen

- Prüfauftrag Durchlauf 3 und die weiter geltenden Vorgaben aus `03-securitytest-1-order.md`
- vorheriger Bericht `development/ablauftest/wp01/tests/03-securitytest-2.md` (Zweig `ablauftest/wp01`)
- `docs/technical/development-test-security-rules.md`, Briefing Tester Sicherheit in `docs/technical/agentenrollen-und-briefings.md`, Stand des geprüften Commits
- BSI IT-Grundschutz CON.8, OWASP ASVS (keine sensiblen Angaben im Quelltext und in der Dokumentation)

## Kontrolle des Commits

- Arbeitsverzeichnis bestand. `git fetch origin`, `git checkout --detach 33c30fcc30bd12d5a85f9164c548646f1fdf5307`, danach `git rev-parse HEAD`: `33c30fcc30bd12d5a85f9164c548646f1fdf5307`.
- `git log 42d3938..33c30fc`: genau ein Commit. Autor und Committer `macodix`. Nachricht „ablauftest/wp01: Glossareinträge Arbeitsverzeichnis und ausgecheckt neu gefasst (Befund F5)“, kein Trailer.
- `git diff --stat 42d3938 33c30fc`: genau 1 Datei, `docs/user/pipwerk-studio.md` (+2/−2). Die Angabe des Entwicklers im Prüfauftrag trifft zu. Skript, Code, Tests, Konfiguration und Abhängigkeiten sind nicht geändert.

## Durchgeführte Prüfungen und Nachweise

| Nr. | Prüfung | Ergebnis |
|---|---|---|
| P1 | Durchsicht des vollständigen Diffs `42d3938..33c30fc` | geändert sind nur Zeile 167 („Arbeitsverzeichnis“) und Zeile 175 („ausgecheckt“) |
| P2 | Durchsicht der zwei eingefügten Zeilen auf Pfade, Rechnernamen, Benutzernamen, Namen des Auftraggebers, Zugangsdaten, Schlüssel, E-Mail- und Netzadressen | keine Treffer; beide Zeilen enthalten nur allgemeine Erklärungen zu Git |
| P3 | `git grep` im ganzen Commit (ohne `development/`) nach `/srv/`, `/home/`, `/Users/` und dem Namen des Entwicklungsverzeichnisses | drei Treffer, alle unverändert gegenüber Durchlauf 2: `.github/workflows/sync-repo.yml` Zeile 26, `docs/technical/entwicklungsverfahren.md` Zeile 256 (Hinweis H1) und das als erfunden gekennzeichnete Beispiel `/home/beispiel/pipwerk` in `docs/user/pipwerk-studio.md` Zeile 171 (Hinweis H2) |
| P4 | `git grep` in `docs/user/pipwerk-studio.md` nach `passw`, `secret`, `token`, `api_key`, `PRIVATE KEY`, Namen des Auftraggebers, `@`, `http` | nur die bekannten Adressen `http://127.0.0.1:…` (Zeilen 28, 38) und `https://github.com/macodix/pipwerk` (Zeilen 85, 158); keine Zugangsdaten |
| P5 | Kontrolle der sicherheitsrelevanten Aussagen der Anwenderdokumentation (Hinweis zu `--host`, Beenden, Aufrufe) | unverändert gegenüber Durchlauf 2 (P1: Diff berührt Zeilen 25 bis 30, 130 und 148 nicht). Zeile 28 mit dem Hinweis zu `--host` liegt unverändert vor (P4). |
| P6 | Folgen des Wegfalls des Satzes „Sein oberstes Verzeichnis ist das Verzeichnis, in dem `LICENSE` liegt.“ aus dem alten Eintrag „Arbeitsverzeichnis“ für die Aufrufe | Die Erklärung steht weiter in Zeile 25 („im obersten Verzeichnis des Arbeitsverzeichnisses …, in dem auch die Datei `LICENSE` liegt“). Die Anleitung zu den Aufrufen bleibt eindeutig. |
| P7 | Lauf aller Backend-Tests: `uv --directory <Arbeitsverzeichnis>/components/pipwerk-studio/backend run --frozen pytest -q`; danach `git status --short --ignored` | 148 Tests bestanden (wie Durchlauf 2). Danach neu nur `.venv`, `.pytest_cache`, `src/pipwerk_studio/__pycache__`, `tests/__pycache__`; kein `.testenv/` in der Komponente. |

## Bewertung der Änderung

1. Eintrag „Arbeitsverzeichnis“ (Zeile 167): Erklärt, dass Git die Dateien eines Commits in ein Verzeichnis legt, und verweist auf „ausgecheckt“ und „nicht committete Änderungen“. Keine Aussage über Zugriffe, Netz, Rechte oder das Verhalten der Testumgebung. Keine Pfade oder Namen.
2. Eintrag „ausgecheckt“ (Zeile 175): Erklärt den ausgecheckten Commit und dass spätere Änderungen zu keinem Commit gehören. Keine sicherheitsrelevante Aussage. Keine Pfade oder Namen.
3. Da Code, Skript, Tests und die übrigen Teile der Dokumentation unverändert sind, gelten die Bewertungen 1 bis 4 aus Durchlauf 2 unverändert für diesen Commit. Der Testlauf P7 bestätigt den unveränderten Stand der Tests.

## Kontrolle vorheriger Befunde

Durchlauf 2 (`03-securitytest-2.md`, Commit `42d3938843f2cf321230a9a04a412bc01e2f40f3`) hatte keine Befunde. Zu den Hinweisen:

- H1 (Pfad des Entwicklungsverzeichnisses in `.github/workflows/sync-repo.yml` Zeile 26 und `docs/technical/entwicklungsverfahren.md` Zeile 256): unverändert vorhanden (P3), nicht Teil dieses Commits. Entscheidung steht weiter aus.
- H2 (Abgleich `/home/beispiel` mit der Benutzerliste des Rechners): unverändert offen, siehe unten.
- H3 (Skript nicht selbst mit laufender Testumgebung ausgeführt): gilt weiter; das Skript ist nicht geändert.

## Befunde

Keine.

## Hinweise ohne Einfluss auf das Ergebnis

- **H1** (außerhalb der Änderung, bestehende Festlegung) Das Repository nennt den Pfad des Entwicklungsverzeichnisses in `.github/workflows/sync-repo.yml` Zeile 26 und `docs/technical/entwicklungsverfahren.md` Zeile 256. Letztere legt fest, dass Skripte und Workflow den Pfad fest nennen. Das widerspricht der Regel „Schreibe keine … Pfade des Entwicklungsrechners in das Repository“ in `docs/technical/agentenrollen-und-briefings.md`. Benötigt wird eine Entscheidung, ob diese Festlegung als Ausnahme gilt. Zuständig: Softwarearchitekt, für die Briefings der Projektleiter mit dem Auftraggeber. Unverändert seit Durchlauf 1.
- **H2** (Prüfumfang) Ob auf dem Entwicklungsrechner ein Benutzer `beispiel` oder ein Verzeichnis `/home/beispiel` besteht, habe ich nicht abgefragt; in Durchlauf 2 war die Abfrage in meiner Laufumgebung abgelehnt. Das Beispiel ist als erfunden gekennzeichnet und weicht vom bekannten Entwicklungsverzeichnis ab. Zuständig wäre eine Rolle mit Lesezugriff auf den Rechner.
- **H3** (Prüfumfang) `scripts/testenv` habe ich nicht selbst mit laufender Testumgebung ausgeführt. Die Prüfung in der laufenden Testumgebung ist Gegenstand der QA.

## Arbeitsverzeichnis

Die von P7 erzeugten Dateien (`backend/.venv`, `backend/.pytest_cache`, `backend/src/pipwerk_studio/__pycache__`, `backend/tests/__pycache__`) habe ich mit `git clean -fdX -- components/pipwerk-studio` entfernt. Nicht versioniert sind nur meine Berichte `01-securitytest-1.md` bis `01-securitytest-3.md`, `02-securitytest-1.md` bis `02-securitytest-5.md`, `03-securitytest-1.md`, `03-securitytest-2.md` und dieser Bericht.

## Geltung

Dieser Bericht gilt nur für den Commit `33c30fcc30bd12d5a85f9164c548646f1fdf5307`.
