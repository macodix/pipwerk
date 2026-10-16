# Prüfauftrag Auftrag 03, Durchlauf 1

- Vorhaben: `strategiedesign`, Arbeitspaket `wp01`, ref `strategiedesign/wp01`
- zu prüfender Commit: `d91f5f8abc5e9ea4155494505e9cbebb84846d3c` auf Zweig `strategiedesign/wp01-03`, aufgesetzt auf `0ee7723df13d1dd286c55b8f321361e6919e73e3` (Arbeitszweig mit den zusammengeführten Aufträgen 01 und 02)
- Auftrag: `strategiedesign/wp01:development/strategiedesign/wp01/orders/03.md`
- Prüfgrundlagen: der Auftrag mit den darin genannten Grundlagen, `development/strategiedesign/specification.md` (Abschnitte 2, 3.6, 3.7, 4.1, 4.2, 7, 8, 9), `development/strategiedesign/plan.md` (`wp01`, Abnahmekriterien), `docs/technical/development-test-security-rules.md`, `docs/technical/pipwerk-studio.md` und `docs/technical/pipwerk-domain.md` im geprüften Commit
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: erster Durchlauf vollständig, nur blockierende Befunde verhindern das Bestehen, alles andere als Hinweis.

## Angaben des Entwicklers

- Backend: 531 Tests, Bibliothek: 975 Tests; `uv sync --frozen`, `ruff check`, `ruff format --check`, `mypy` bestanden. Oberfläche: `npm ci`, Typprüfung, 244 Tests, Bau, Browsertest (39 bestanden, 6 übersprungen) bestanden. Nicht ausgeführt: `pip-audit`, Aufruf von `/docs` im Browser.
- Testumgebung mit `testenv` auf freien Ports gestartet und über HTTP geprüft, danach gestoppt.
- `packages/domain-core` ist Pfadabhängigkeit des Backends (`editable = true`). Der Eintrag in `components/pipwerk-studio/backend/uv.lock` ist von Hand ergänzt. Prüfe, ob die Lockdatei vollständig, richtig und reproduzierbar ist.
- Änderungen an der Bibliothek (Erweiterungen für den Auftrag, keine Fehlerbehebungen): erkannte Namen je Ausdruck für `POST /api/v1/check` (`NameOccurrence`, `ExpressionNames`, `CheckResult`, `check_strategy_with_names`, `check_template_with_names`, `MAX_NAMES_PER_CHECK`, Parameter `collect_names`), `builtin_templates()` in `defaults.py`, `py.typed`.
- Eigene Entscheidungen ohne Vorgabe: nicht lesbare Dateien lassen sich über die Web-API weder lesen noch ändern noch löschen (409); als nicht lesbar gilt auch eine Datei mit abweichender Kennung, falschem Format oder über 16 MiB; „Risiko je Trade“ liefert `GET`, `PUT` und `DELETE` antworten 403; schreibende Endpunkte verlangen `application/json`, sonst 415; gespeicherte Dateien werden bis 16 MiB gelesen, Bodies bis 2 MiB angenommen; `/docs` lädt Swagger UI von einem CDN (vermerkt in der technischen Dokumentation).
- Offener Punkt des Entwicklers: Das Prüfskript ruft `uv export … --no-emit-project` ohne `--no-emit-package pipwerk-domain` auf; die Ausgabe enthält dann eine Zeile mit der Pfadabhängigkeit.

## Tester Funktion

Setze den Zweig `strategiedesign/wp01-functiontest` (zuletzt `46788e30dd0f7ef541a967c538d631111328259a`, aufgesetzt auf `93209f1fa05aee773bd644d238b3795955720239`) auf den geprüften Commit neu auf. Führe das Prüfskript `components/pipwerk-studio/scripts/check` mit `--with-audit` aus und prüfe Funktion, Grenzfälle, Tests, Code und technische Dokumentation gegen den Auftrag. Halte das Prüfskript aktuell, auch für den offenen Punkt des Entwicklers zu `pip-audit` mit der Pfadabhängigkeit. Prüfe die Abnahmekriterien 1 bis 7 von `wp01` im Plan über die Web-API in einer selbst gestarteten Testumgebung auf freien Ports und beende sie danach. Nenne den Commit des Prüfskripts im Bericht.

Ablage: `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp01/reports/03-functiontest-1.md`

## Tester Sicherheit

Prüfe nach BSI-Grundschutz, OWASP ASVS und API Security Top 10 und den Sicherheitsregeln, insbesondere: Eingaben aller neuen Endpunkte unter `/api/v1/` (Schema, `extra="forbid"`, UUID im Pfad, Art und `format`), Begrenzung des Bodys vor dem Lesen des JSON (auch ohne oder mit falschem `Content-Length`, auch bei chunked), Begrenzungen der Bibliothek, Lesen von Dateien bis 16 MiB, Fehlermeldungen ohne Pfade und Ausnahmetexte, Medientyp und Schreiben von fremden Webseiten, Schutz der mitgelieferten Vorlage, Dateizugriff im Objektverzeichnis, `/docs` mit Inhalten von einem CDN, Warnung zu `--host` in der Anwenderdokumentation und die Abhängigkeiten mit `pip-audit`.

Ablage: `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp01/reports/03-securitytest-1.md`
