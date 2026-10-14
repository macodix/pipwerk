# Prüfauftrag QA, Arbeitspaket wp01, Durchlauf 1

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: QA
- zu prüfender Commit: `855e0eb4d80c7d458fd361d8ad8f3cc0f76e0651` (Arbeitszweig `ablauftest/wp01`, alle Aufträge und das Prüfskript des Testers Funktion zusammengeführt)
- Testumgebung: läuft aus dem Arbeitsverzeichnis `test/ablauftest-wp01/` im Entwicklungsverzeichnis auf genau diesem Commit, gestartet mit `components/pipwerk-studio/scripts/testenv start --frontend-port 18610 --backend-port 18611`. Oberfläche: `http://127.0.0.1:18610/`. Backend: `127.0.0.1:18611`.

## Gegenstand

Prüfe das Arbeitspaket `wp01` in der laufenden Testumgebung aus Kundensicht. Prüfe alle Abnahmekriterien 1 bis 13 aus `development/ablauftest/plan.md`, Abschnitt `wp01`. Prüfe außerdem req-ui-010 und die Verständlichkeit und Vollständigkeit der Anwenderdokumentation `docs/user/pipwerk-studio.md`.

Hinweise zur Durchführung:

- Starte, beende oder verändere die Testumgebung in `test/ablauftest-wp01/` nicht. Sie bleibt für die Abnahme durch den Auftraggeber stehen.
- Kriterien 1 bis 3 (Start, `status`, `stop`, Abbruch bei Änderungen): Prüfe sie in deinem eigenen Arbeitsverzeichnis `work/ablauftest/wp01/qa/` auf demselben Commit. Verwende andere, freie Ports als die Testumgebung. Für Kriterium 3 legst du dort vorübergehend Änderungen an, auch an `LICENSE`, und entfernst sie danach wieder. Den Abbruch bei Änderungen prüfst du, bevor dein Bericht im Verzeichnis liegt, oder du berücksichtigst die Berichtsdatei als nicht ignorierte neue Datei.
- Kriterium 5: Rufe Kommandozeile und Schnittstellenbeschreibung so auf, wie es die technische Dokumentation im Abschnitt „Start als Testumgebung“ (4a) beschreibt.
- Technische Nachweise laut Plan: Führe das Prüfskript `components/pipwerk-studio/scripts/check` in deinem Arbeitsverzeichnis aus. Aufruf und Parameter stehen in Abschnitt 6.4 der technischen Dokumentation. Prüfe dabei, ob Abschnitt 6.4 mit dem Skript übereinstimmt. Nach der Entscheidung des Softwarearchitekten laufen `pip-audit` und `npm audit` nur mit `--with-audit`. Der bekannte Befund zu `source-map-js` ist nicht Gegenstand des Pakets. Prüfe außerdem, ob für jeden zusammengeführten Auftrag positive Testberichte beider Tester vorliegen: `development/ablauftest/wp01/tests/` auf dem Arbeitszweig, letzter Durchlauf je Auftrag und Prüfgebiet.

## Prüfgrundlagen

- `development/ablauftest/plan.md`, Abschnitt `wp01`
- `development/ablauftest/scope.md` und req-ui-010 in `docs/design/requirements/anforderungen-strategiedesigner.md`
- `development/ablauftest/specification.md`
- `docs/user/pipwerk-studio.md`, `docs/technical/pipwerk-studio.md`
- Briefing QA, Phase 4, in `docs/technical/agentenrollen-und-briefings.md`

## Ablage

Schreibe den Prüfbericht ohne Commit als Datei `1.md` in dein Arbeitsverzeichnis `work/ablauftest/wp01/qa/` im Entwicklungsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, den Port der Oberfläche und des Backends der Testumgebung und alle Befunde mit Fundstelle.
