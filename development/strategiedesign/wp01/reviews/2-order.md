# Prüfauftrag QA, Arbeitspaket `wp01`, Durchlauf 2

- Vorhaben: `strategiedesign`, Arbeitspaket `wp01`, ref `strategiedesign/wp01`
- Phase: 4 Umsetzung
- Rolle: QA
- zu prüfender Commit: `657c26184610ca692ab480bcfeb0bef38e5a1c4a` auf dem Arbeitszweig `strategiedesign/wp01`. Er enthält die zusammengeführten Aufträge 01, 02, 03 und 04 und das Prüfskript des Testers Funktion.
- Testumgebung: läuft auf genau diesem Commit, gestartet mit `components/pipwerk-studio/scripts/testenv start --frontend-port 5174 --backend-port 8001`. Oberfläche `http://127.0.0.1:5174/`, Backend `http://127.0.0.1:8001/`, Schnittstellenbeschreibung `http://127.0.0.1:8001/docs`. Beende oder starte die Testumgebung nicht neu; sie wird anschließend dem Auftraggeber übergeben. Was du darin anlegst, entfernst du am Ende wieder über die Web-API.
- Vorheriger Prüfbericht: `development/strategiedesign/wp01/reviews/1.md` (Commit `2ec5418da46e03ea8dbbfca9e50230440856db9f`, nicht bestanden allein wegen B1)

## HTTP-Anfragen an die Testumgebung

Befund B1 aus Durchlauf 1 ist über die Frage `development/strategiedesign/questions/wp01-03.md` (auf `main`) beantwortet: Freigegeben sind HTTP-Anfragen mit `curl`, die URL als erstes Argument, Optionen danach, zum Beispiel `curl http://127.0.0.1:8001/api/v1/element-types -s -X GET`. Einen Anfragekörper übergibst du als Datei, zum Beispiel `curl http://127.0.0.1:8001/api/v1/check -s -X POST -H "Content-Type: application/json" --data-binary @<datei>`. Verwende keine anderen Formen und keine Umgebungsvariablen im Befehl.

Wird ein Aufruf in dieser Form abgelehnt, nenne im Bericht den genauen Befehl und den genauen Wortlaut der Ablehnung.

## Gegenstand

Arbeitspaket `wp01` „Bibliothek und Web-API“ in `development/strategiedesign/plan.md`: Ziel, Umfang und Abnahmekriterien 1 bis 8 sowie die technischen Nachweise unter den Abnahmekriterien.

## Umfang der Prüfung

Die Abnahmekriterien 1 bis 7 konnten in Durchlauf 1 nicht in der Testumgebung geprüft werden. Für sie ist dieser Durchlauf deshalb die erste Prüfung und vollständig. Für alles andere ist er eine Nachprüfung nach „Umfang der Prüfungen“.

1. Prüfe in der laufenden Testumgebung aus Kundensicht jedes Abnahmekriterium 1 bis 7 so, wie der Auftraggeber es selbst prüfen würde, nach der Anwenderdokumentation `docs/user/pipwerk-studio.md`, Teil „Web-API ausprobieren“. Verwende die dort genannten Testfall- und Beispieldokumente (Auftrag 04) genau so, wie die Anwenderdokumentation es beschreibt, und prüfe, dass jeder Schritt das beschriebene Ergebnis liefert. Kriterium 1 umfasst den Abruf der Oberfläche an Port 5174.
2. Nachprüfung B1: Sind HTTP-Anfragen an die Testumgebung jetzt möglich?
3. Nachprüfung der Hinweise H1, H2, H3, H5, H6 und H7 aus Durchlauf 1, umgesetzt mit Auftrag 04 (`development/strategiedesign/wp01/orders/04.md`), und der dafür geänderten Stellen. Abnahmekriterium 8 prüfst du für diese geänderten Stellen nach.
4. Technische Nachweise: Führe in deinem eigenen Arbeitsverzeichnis auf dem geprüften Commit das Prüfskript `components/pipwerk-studio/scripts/check` auf freien Ports (nicht 5174 und 8001) ohne `--with-audit` aus. Prüfe, dass für Auftrag 04 positive Testberichte beider Tester vorliegen (`development/strategiedesign/wp01/tests/04-functiontest-1.md`, `04-securitytest-1.md`).

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: erster Durchlauf vollständig, danach Nachprüfung, nur blockierende Befunde verhindern das Bestehen, alles andere als Hinweis.
- `development/strategiedesign/plan.md` (`wp01`), `development/strategiedesign/specification.md`, `development/strategiedesign/scope.md` und die dort genannten Dokumente des Auftraggebers
- die Aufträge unter `development/strategiedesign/wp01/orders/` mit den darin festgehaltenen Entscheidungen des Softwarearchitekten
- Prüfbericht Durchlauf 1 `development/strategiedesign/wp01/reviews/1.md`

Nenne zu jedem Befund Fundstelle und Sachverhalt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp01/reports/2.md`. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, den Port der Testumgebung (Oberfläche 5174, Backend 8001), das Ergebnis je Abnahmekriterium, die Befunde und getrennt davon die Hinweise.
