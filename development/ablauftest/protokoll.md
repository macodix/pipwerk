# Protokoll Vorhaben ablauftest

Erster vollständiger Durchlauf des [Entwicklungsverfahrens](../../docs/technical/entwicklungsverfahren.md), 13. und 14. Oktober 2026. Gegenstand: Dialog „Über pipwerk Studio“ (req-ui-010), Testumgebungsskript, einheitlicher Name „pipwerk Studio“.

## Ergebnis

Bestanden. Alle sechs Phasen wurden durchlaufen: Anforderung, Konzeption, Planung, Umsetzung, Abnahme (Auftraggeber, 14.10.2026, ohne Mängel) und Integration (`f1ed78a`, Merge von `e60fd1c`). Nach der Integration sind keine Zweige, Arbeitsverzeichnisse unter `work/` oder Testumgebungen unter `test/` übrig.

Geprüft und funktionsfähig: Runner, `agentrun` mit Start, Herzschlag, Abbruch und Meldung `failed`, Neustart durch Cron, Meldungen in beide Richtungen, Fragen an den Auftraggeber (`question`/`answer`), Einwände (`revise`), Eskalation nach drei Durchläufen, Tester und QA als eigene Sitzungen, Abnahme und Integration.

## Aufwand

| Schritt | Durchläufe |
|---|---|
| Prüfung der Anforderung | 1 |
| Prüfung der Spezifikation | 16 |
| Prüfung des Plans | 5 |
| Testberichte (4 Aufträge, 2 Tester) | 28 |
| Prüfung der QA aus Kundensicht | 3 |
| Fragen an Auftraggeber oder Projektleiter | 9 |

Für eine kleine Anforderung ist das zu viel. Ursachen und Korrekturen siehe unten.

## Abweichungen und Korrekturen

| Nr. | Abweichung | Ursache | Korrektur |
|---|---|---|---|
| 1 | Erste Sitzung ohne Herzschlag, Abbruch nach 15 Minuten | Skripte setzten die Umgebungsvariable `PIPWERK_DEV_ROOT` voraus | Skripte auf feste Werte im Skript umgestellt und auf das Wesentliche reduziert; Variable abgeschafft (`725af55`, `6c14820`) |
| 2 | Zweite Sitzung hing an einer Rückfrage zur Freigabe | Start mit `--permission-mode default` | Start mit `--permission-mode dontAsk` |
| 3 | Dritte Sitzung ohne Anmeldung, Meldung `failed` nicht schreibbar | `agentrun` lief als `root` | `agentrun` nur über Cron als `codesrv`; `gh` mit Anmeldung in Datei |
| 4 | Prüfschleifen ohne Ende, jede Korrektur erzeugte neue Befunde | Erster Durchlauf nicht vollständig, jeder Befund blockierend, zu viel Detail in Spezifikation und Plan | Abschnitt „Umfang der Prüfungen“ (`e02483d`): Detailtiefe nach Umfang, erster Durchlauf vollständig, danach Nachprüfung, nur blockierende Befunde |
| 5 | Zwei Arbeitspakete und zwei Abnahmen für eine kleine Anforderung | Aufteilung nach technischer Abhängigkeit | Einwand des Auftraggebers: ein Paket. Kleine Vorhaben bekommen ein Paket |
| 6 | Präsentationen zeigten Kennungen statt Inhalte | Projektleiter | Briefing Projektleiter: Kennungen nur als Verweis |
| 7 | Testumgebung auf unangekündigten Ports | Ports im Verfahren nur als Parameter | Feste Ports der Testumgebung zur Abnahme, pipwerk Studio 5174 und 8001 (`8d65ab5`) |
| 8 | Namensänderung „pipwerk studio“ → „pipwerk Studio“ während der Spezifikation | Schreibweise vorher nicht festgelegt | Name im Projektziel festgelegt |

## Offene Punkte

- **B5:** Die Anwenderdokumentation sagt nicht, wie man die Netzwerkadresse des eigenen Rechners für den Zugriff von anderen Rechnern findet. Hinweis aus dem Prüfbericht der QA, kein Mangel.
- **H1 der QA, erledigt am 14.10.2026** (Verfahren `878c328`, `devteam/` laut transfer/berichtsverzeichnis-bericht-2026-10-14.md, 29 Tests bestanden): Tester und QA schreiben ihre Berichte ohne Commit in ihr Arbeitsverzeichnis. Das Testumgebungsskript startet nur aus einem Arbeitsverzeichnis ohne nicht committete Dateien. Die QA konnte deshalb in ihrem Arbeitsverzeichnis keine eigene Testumgebung starten. Korrektur nötig: Berichte außerhalb des Git-Arbeitsverzeichnisses ablegen, zum Beispiel `work/<ref>/<rolle>-berichte/`. Betrifft `entwicklungsverfahren.md`, Abschnitt „Ablage“, und die Startskripte in `devteam/`.
- Ob Cron `agentrun` nach einem Neustart des Rechners zuverlässig als `codesrv` startet, ist nicht geprüft.
- **Bildschirminhalt beim Abbruch, erledigt am 14.10.2026:** `agentrun` sichert vor dem Beenden einer Sitzung die letzten 200 Zeilen nach `run/<key>.screen` (transfer/agentrun-bildschirm-bericht-2026-10-13.md, 30 Tests bestanden). Wirksam seit dem Neustart von `agentrun` durch Cron am 14.10.2026, 14:10.
