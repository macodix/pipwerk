# Prüfauftrag Auftrag 05, Durchlauf 1

- Vorhaben: `strategiedesign`, Arbeitspaket `wp01`, ref `strategiedesign/wp01`
- zu prüfender Commit: `2dab08193fb62258f84707f2c6f2476a8b1c1273` auf Zweig `strategiedesign/wp01-05`, aufgesetzt auf `39a2a7dffcebc44860254d5cb1f97d026a638260` (Arbeitszweig mit den zusammengeführten Aufträgen 01 bis 04 und dem Prüfskript)
- Auftrag: `strategiedesign/wp01:development/strategiedesign/wp01/orders/05.md`
- Prüfgrundlagen: der Auftrag mit den darin genannten Grundlagen, Prüfbericht der QA `strategiedesign/wp01:development/strategiedesign/wp01/reviews/2.md` (Hinweise H8, H9), Testbericht `strategiedesign/wp01:development/strategiedesign/wp01/tests/04-functiontest-1.md` (Hinweis H3), `docs/technical/development-test-security-rules.md`
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: erster Durchlauf vollständig, nur blockierende Befunde verhindern das Bestehen, alles andere als Hinweis.

## Angaben des Entwicklers

- Keine Änderung am Programmcode, an Beispieldateien und am Prüfskript. Geändert: `docs/user/pipwerk-studio.md`, `components/pipwerk-studio/backend/tests/test_user_documentation_examples.py`.
- H8: Der Abschnitt „Beispieldokumente“ sagt allgemein, dass Dateien im Arbeitsverzeichnis nie geändert werden und Ersetzungen im eingefügten Text im „Request body“ geschehen. Schritte 3, 4, 5, 7 und 8 von „Vorlage anlegen, ändern und löschen“, Schritt 2 von „Befunde verhindern das Speichern nicht“ und Schritt 4 im ersten Teil entsprechend eindeutig.
- H9: Tabelle „Befunde der Konsistenzprüfung“, Zeile 2, nennt `details.start` 13 und `details.end` 14, Zählung ab 0, `end` hinter dem letzten Zeichen.
- Zwei neue Tests: `test_the_documentation_names_the_fields_and_counting_of_the_position`, `test_the_steps_replace_the_identifier_in_the_request_body_not_in_the_file`.
- Backend 679 Tests, Bibliothek 985 Tests, alle Prüfungen bestanden.

## Tester Funktion

Setze den Zweig `strategiedesign/wp01-functiontest` auf den geprüften Commit neu auf, soweit er Änderungen enthält, die noch nicht im Ausgangscommit liegen. Führe das Prüfskript mit `--with-audit` auf freien Ports aus, nicht 5174 und 8001 (dort läuft die Testumgebung des Pakets; fasse sie nicht an). Prüfe, ob die geänderten Stellen eindeutig sind, mit Code, Beispieldateien und `docs/technical/pipwerk-domain.md` übereinstimmen und ob die Hinweise H8 und H9 der QA und H3 aus `04-functiontest-1.md` erledigt sind. Nenne den Commit des Prüfskripts.

Ablage: `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp01/reports/05-functiontest-1.md`

## Tester Sicherheit

Prüfe die geänderten Dateien (keine Zugangsdaten, Pfade oder Namen des Entwicklungsrechners, keine Empfehlung unsicherer Bedienung) und dass sich am Code nichts geändert hat.

Ablage: `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp01/reports/05-securitytest-1.md`
