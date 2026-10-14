# Frage ablauftest-08

- von: Softwarearchitekt
- an: Projektleiter
- Bezug: Prüfschleife zwischen QA und Softwarearchitekt zum Arbeitspaketplan `development/ablauftest/plan.md`. Grenze von drei Durchläufen nach `docs/technical/entwicklungsverfahren.md`, Abschnitt „Schleifen und Eskalation“.
- Anlass: Durchlauf 3, der dritte dieser Schleife, ist nicht bestanden: [plan-3.md](../reviews/plan-3.md).
- unterbrochene Aufgabe: `plan` für das Vorhaben `ablauftest`, gestartet mit der Meldung `development/messages/architect/20261014031306-projectlead-01.md`
- Stand der Aufgabe: Der Plan teilt die Spezifikation in zwei Pakete: `wp01` Testumgebung und Schreibweise „pipwerk Studio“, `wp02` Dialog „Über pipwerk Studio“, abhängig von `wp01`. Die QA bestätigt in den Durchläufen 1 bis 3: Die Spezifikation deckt req-ui-010 vollständig ab, auch den neuen Satz zum Zeilenumbruch. Jeder Teil der Spezifikation ist einem Paket zugeordnet. Beide Pakete haben alle verlangten Bestandteile und Abnahmekriterien, die der Auftraggeber selbst prüfen kann. Die Abhängigkeit ist richtig. Offen war zuletzt nur der Befund N2. Er ist eingearbeitet, aber noch von keiner Prüfung der QA bestätigt. Fehlt nur noch diese Bestätigung, gibt der Softwarearchitekt den Plan danach mit `present` an den Projektleiter.

## Sachverhalt

Zwischen QA und Softwarearchitekt gibt es keinen Streitpunkt. Alle drei Befunde zum Plan betrafen dieselbe Sache: wie Dateipfade im Plan geschrieben sind. Inhalt, Aufteilung und Abnahmekriterien der Pakete waren davon nicht betroffen.

| Durchlauf | Befund | Eingearbeitet |
|---|---|---|
| 1 | P4: Dateien des Backends standen ohne vollen Pfad; nach der Regel des Plans lägen sie unter dem Verzeichnis der Oberfläche. Dazu P1 bis P3 zu Glossar, Beschreibung des Prüfskripts und Prüfbarkeit eines Abnahmekriteriums. | P1 bis P4 |
| 2 | N1: weitere Stellen mit kurzem Pfad. | N1 |
| 3 | N2: sechs Dateien des Backends in einer Aufzählung nur mit Dateinamen. | Jede Datei steht jetzt einzeln mit vollem Pfad. Dazu die Hinweise H8 (Nummer des neuen Abschnitts zum Prüfskript in der technischen Dokumentation) und H9 (zwei Dateien der Oberfläche ohne `src/`). |

## Frage

Gibt der Projektleiter einen weiteren Prüfdurchlauf der QA frei (Durchlauf 4), um die Änderungen zu N2, H8 und H9 zu bestätigen?

Vorschlag des Softwarearchitekten: Durchlauf 4 freigeben, als Nachprüfung nur für N2, H8, H9 und die dafür geänderten Stellen. Nach positivem Prüfbericht geht der Plan mit `present` an den Projektleiter. Findet die QA erneut einen Befund, kommt der Fall wieder an den Projektleiter.

Antwort: Durchlauf 4 als Nachprüfung freigegeben, nur N2, H8, H9 und die dafür geänderten Stellen. Befunde, die nur noch die Schreibweise von Pfaden betreffen, halten den Plan nicht auf; sie werden in Phase 4 bei den Aufträgen gelöst. (Projektleiter, 14. Oktober 2026)
