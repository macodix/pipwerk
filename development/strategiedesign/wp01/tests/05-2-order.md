# Prüfauftrag Auftrag 05, Durchlauf 2

- Vorhaben: `strategiedesign`, Arbeitspaket `wp01`, ref `strategiedesign/wp01`
- zu prüfender Commit: `63014a9044c66551e944b40060fa6db5385cd8c1` auf Zweig `strategiedesign/wp01-05`, aufgesetzt auf `2dab08193fb62258f84707f2c6f2476a8b1c1273` (Durchlauf 1)
- Auftrag: `strategiedesign/wp01:development/strategiedesign/wp01/orders/05.md`, Abschnitt „Nachtrag nach Durchlauf 1 der Tester“, Punkte 4 bis 7
- Prüfgrundlagen: der Auftrag, Testberichte `strategiedesign/wp01:development/strategiedesign/wp01/tests/05-functiontest-1.md` (Hinweise H2, H3, H4) und `05-securitytest-1.md`, `docs/technical/development-test-security-rules.md`
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`. Dieser Durchlauf ist eine Nachprüfung: nur, ob die Hinweise erledigt sind und ob die dafür geänderten Stellen neue Fehler enthalten. Nur blockierende Befunde verhindern das Bestehen.

## Angaben des Entwicklers

- Geändert: `docs/user/pipwerk-studio.md`, `docs/technical/pipwerk-studio.md`, `components/pipwerk-studio/backend/tests/test_user_documentation_examples.py`. Kein Programmcode, keine Beispieldateien, kein Prüfskript.
- H2: Schritte nennen das Feld `id` auf der obersten Ebene des Dokuments; erster Teil Schritt 4 und „Befunde“ Schritt 2 sagen zusätzlich, dass die Felder `id` der Elemente unverändert bleiben.
- H3: Regel in „Beispieldokumente“ verbietet auch neue Dateien im Arbeitsverzeichnis; Schritt 7 entsprechend.
- H4: Zusammenfassung des Testmoduls in der technischen Dokumentation ergänzt.
- Backend 679 Tests, Bibliothek 985 Tests bestanden.

## Tester Funktion

Führe das Prüfskript ohne `--with-audit` auf freien Ports aus, nicht 5174 und 8001 (Testumgebung des Pakets; fasse sie nicht an). Prüfe die Hinweise H2, H3 und H4 aus `05-functiontest-1.md` und die dafür geänderten Stellen. Nenne den Commit des Prüfskripts.

Ablage: `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp01/reports/05-functiontest-2.md`

## Tester Sicherheit

Prüfe die geänderten Stellen (keine Zugangsdaten, Pfade oder Namen des Entwicklungsrechners, keine Empfehlung unsicherer Bedienung) und dass sich am Code nichts geändert hat.

Ablage: `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp01/reports/05-securitytest-2.md`
