# Prüfauftrag Auftrag 03, Durchlauf 2 (Nachprüfung)

- Vorhaben: `strategiedesign`, Arbeitspaket `wp01`, ref `strategiedesign/wp01`
- zu prüfender Commit: `9e5bd7bd73baf3bc1b5898b36f2b56da0f238762` auf Zweig `strategiedesign/wp01-03`
- vorher geprüfter Commit: `d91f5f8abc5e9ea4155494505e9cbebb84846d3c`
- Auftrag: `strategiedesign/wp01:development/strategiedesign/wp01/orders/03.md`, maßgeblich der Abschnitt „Festlegungen nach Durchlauf 1“ (Punkte 1 bis 6)
- Berichte aus Durchlauf 1: `strategiedesign/wp01:development/strategiedesign/wp01/tests/03-functiontest-1.md` (B1, B2), `strategiedesign/wp01:development/strategiedesign/wp01/tests/03-securitytest-1.md` (S1, S2)
- Umfang der Prüfungen: Nachprüfung nach „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: die blockierenden Befunde aus Durchlauf 1, die Punkte der Festlegungen und die dafür geänderten Stellen. Nur blockierende Befunde verhindern das Bestehen.

## Festlegung zu einem Hinweis

Die Erweiterungen der Bibliothek aus Durchlauf 1 (Hinweis H2 des Funktionstests) sind vom Softwarearchitekten angenommen (Punkt 1 der Festlegungen). Sie sind kein Befund.

## Korrekturen laut Entwickler

- Punkt 2: Auflisten, Lesen, Anlegen, Ersetzen, Löschen und `usages` antworten bei ungültig gespeichertem Objektverzeichnis mit 503 und dem festen Text des internen Endpunkts; Test für alle fünf Arten und jeden dieser Endpunkte.
- Punkt 3: `host_check.py` prüft den Kopf `Host` auf jedem Pfad, 400 mit festem Text. Voreinstellung `127.0.0.1`, `localhost`, `::1`; weitere Namen aus `[server] allowed_hosts` der Startkonfiguration und dem wiederholbaren Parameter `--allowed-host`. `scripts/testenv` übergibt `--allowed-host <Wert von --host>`. Eigene Entscheidung: Eintrag `*ip` erlaubt jede IP-Adresse, aber keinen Namen; `testenv` setzt ihn bei `--host 0.0.0.0` und `--host ::`. `tests/conftest.py` setzt für den Testclient die Basisadresse `127.0.0.1`.
- Punkt 4: `docs_page.py` liefert `/docs` mit `swagger-ui-dist` 5.33.1, `integrity` (SHA-384, aus dem npm-Archiv berechnet und mit dem CDN verglichen) und `crossorigin="anonymous"`, Symbol `data:,`. `/redoc` entfällt. Ein Test prüft, dass die technische Dokumentation Version und Prüfsummen nennt.
- Punkt 5 und 6: Abschnitt 7.1 nennt alle Module mit FastAPI und Starlette; Hinweise H4, H5 und H7 erledigt; Abschnitt 6.1 an das Prüfskript angepasst. Neue Abschnitte 2.10 und 2.11 der technischen Dokumentation.
- Backend 647 Tests, Bibliothek 975 Tests, Oberfläche und Browsertest bestanden. Nicht ausgeführt: `pip-audit`, Darstellung von `/docs` im Browser.

## Tester Funktion

Setze den Zweig `strategiedesign/wp01-functiontest` (zuletzt `e9d40a806f8efd66f66cb4c425cc50994e2f0ce7`) auf den geprüften Commit neu auf, führe das Prüfskript mit `--with-audit` aus und nenne den Commit des Prüfskripts. Prüfe in einer selbst gestarteten Testumgebung auf freien Ports, dass die Oberfläche über ihren Proxy weiter arbeitet und die Abnahmekriterien 1 bis 7 von `wp01` über `/docs` und die Web-API weiter erfüllt sind; beende sie danach.

Ablage: `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp01/reports/03-functiontest-2.md`

## Tester Sicherheit

Prüfe insbesondere die Maßnahme gegen DNS-Rebinding (auch der Eintrag `*ip` und die Behandlung von Kopf `Host` mit Port, IPv6, Großschreibung, abschließendem Punkt, fehlendem Kopf) und die Einbindung von Swagger UI (Version, Prüfsummen gegen die veröffentlichten Dateien, keine weitere fremde Ressource).

Ablage: `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp01/reports/03-securitytest-2.md`
