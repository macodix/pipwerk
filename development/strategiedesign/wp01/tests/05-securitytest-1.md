# Testbericht Sicherheit – Auftrag 05, Durchlauf 1

- Bezug: `strategiedesign/wp01`
- Prüfauftrag: `strategiedesign/wp01:development/strategiedesign/wp01/tests/05-1-order.md`
- Geprüfter Commit: `2dab08193fb62258f84707f2c6f2476a8b1c1273` (Zweig `origin/strategiedesign/wp01-05`)
- Ausgangscommit: `39a2a7dffcebc44860254d5cb1f97d026a638260`
- Ergebnis: **bestanden**

Der Bericht gilt nur für den oben genannten Commit.

## Prüfgrundlagen

- Prüfauftrag `tests/05-1-order.md`, Abschnitt „Tester Sicherheit“
- Auftrag `orders/05.md` (Nicht-Umfang: kein Programmcode; Abnahmekriterium 3: keine Pfade, Benutzernamen oder Rechnernamen des Entwicklungsrechners)
- `docs/technical/development-test-security-rules.md`, Abschnitte 8.2 und 8.3, Stand des geprüften Commits

## Durchgeführte Prüfungen

1. Arbeitsverzeichnis auf den Commit gesetzt. `git rev-parse HEAD` ergab `2dab08193fb62258f84707f2c6f2476a8b1c1273`. `git branch -r --contains` nennt `origin/strategiedesign/wp01-05`. Der Ausgangscommit ist Vorfahre (`git merge-base --is-ancestor` erfolgreich). Der Commit liegt direkt auf dem Ausgangscommit.
2. Keine Code-Änderung: `git diff --stat 39a2a7d 2dab081` nennt genau zwei Dateien:
   - `docs/user/pipwerk-studio.md` (18 Zeilen geändert)
   - `components/pipwerk-studio/backend/tests/test_user_documentation_examples.py` (19 Zeilen neu)

   Programmcode des Backends, der Bibliothek und der Oberfläche, Beispieldateien unter `contracts/strategies/v1/examples/` und das Prüfskript sind unverändert. Das stimmt mit den Angaben des Entwicklers überein.
3. Vollständige Durchsicht des Diffs beider Dateien:
   - Anwenderdokumentation: Geändert sind Schritt 4 im ersten Teil von „Web-API ausprobieren“, der Abschnitt „Beispieldokumente“, die Schritte 3, 4, 5, 7 und 8 von „Vorlage anlegen, ändern und löschen“, Zeile 2 der Tabelle „Befunde der Konsistenzprüfung“ und Schritt 2 von „Befunde verhindern das Speichern nicht“. Die neuen Texte enthalten keine Zugangsdaten, keine Pfade, keine Benutzernamen und keine Rechnernamen. Sie empfehlen keine unsichere Bedienung. Sie sagen ausdrücklich, dass Dateien im Arbeitsverzeichnis nicht geändert werden. Ersetzungen geschehen nur im eingefügten Text des „Request body“. Das verringert die Gefahr ungewollter Änderungen im Arbeitsverzeichnis.
   - Test: Zwei neue Testfunktionen lesen nur die Anwenderdokumentation (`DOCUMENTATION.read_text`, `documentation_section`) und prüfen Textstellen. Kein Netzzugriff, kein Schreiben von Dateien, keine Ausführung externer Befehle, keine Geheimnisse.
4. Suche in beiden geänderten Dateien nach Mustern für Pfade, Namen und Geheimnisse des Entwicklungsrechners (`/srv/`, `/home/`, Rechner- und Benutzername, `localhost`, `127.0.0.1`, `0.0.0.0`, `password`, `passwort`, `token`, `secret`, `api_key`, `PRIVATE KEY`, `sudo`, `chmod`, `no-verify`). Alle Treffer liegen in Zeilen, die dieser Commit nicht ändert: Loopback-Adressen und `--host`-Warnung (Zeilen 28, 32, 38, 110), die öffentliche Adresse des Repositorys auf GitHub (Zeilen 157, 232), das Beispiel `192.168.0.12` (Zeile 246) und das ausdrücklich erfundene Beispiel `/home/beispiel/pipwerk` (Zeile 252). Keiner davon ist ein Pfad, Name oder Zugang des Entwicklungsrechners.
5. Autor und Committer des Commits: `macodix <accounts@martinhenkel.net>`. Die Commit-Nachricht nennt keine Zugangsdaten.
6. Tests und statische Prüfung, Backend, im Arbeitsverzeichnis des Testers:
   - `uv sync --frozen`: Exitcode 0
   - `uv run --frozen pytest -q tests/test_user_documentation_examples.py`: 32 bestanden
   - `uv run --frozen ruff check tests/test_user_documentation_examples.py`: „All checks passed!“
   - `uv run --frozen ruff format --check tests/test_user_documentation_examples.py`: „1 file already formatted“

   Die vollständigen Testläufe aller Komponenten und das Prüfskript mit `--with-audit` gehören laut Prüfauftrag zum Tester Funktion. Ich habe sie nicht ausgeführt.
7. Abgleich mit `development-test-security-rules.md` 8.2 und 8.3: Der Commit berührt keine Systemgrenze, keine Eingabeprüfung, keine Netzwerkzugriffe, keine Abhängigkeiten und keine Fehlermeldungen. Keine Grundregel ist verletzt.
8. Nach der Prüfung zeigt `git status --short` im Arbeitsverzeichnis keine Änderung.

## Befunde

Keine blockierenden Befunde.

## Hinweise

Keine.
