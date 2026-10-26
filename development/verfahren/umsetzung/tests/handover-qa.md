# Übergabe an die QA: Ergebnis des Vorhabens `verfahren`

- zu prüfender Commit: `998f98247f89839395876594d3e27877c57badf7` (Zweig `verfahren/umsetzung`, alle Aufträge 01 bis 08 zusammengeführt, Test Funktion je Auftrag und Test Sicherheit bestanden)
- testumgebung: Das Vorhaben hat keinen Dienst und keinen Port. Du prüfst in deinem eigenen Arbeitsverzeichnis auf genau diesem Commit: die geänderten Verfahrensdokumente, `tools/devhost/README.md`, `tools/overview/README.md` und die erzeugte Seite (`tools/overview/generate.py`, `template.html`; Erzeugung und Ansicht, soweit dir freigegeben, sonst über die Browsertests und das Lesen der Vorlage; nenne nicht Prüfbares im Bericht).
- prüfgrundlagen: `development/verfahren/scope.md`, `development/verfahren/specification.md` (Abschnitte 3 bis 8 und 10), Oberflächenentwurf `development/verfahren/prototype/uebersicht-prototyp.html`.
- prüffragen: Setzen die geänderten Verfahrensdokumente (Abschnitt 8 der Spezifikation, einschließlich Abbruch und Fortsetzung nach Abschnitt 3 und 3.4) die Festlegungen vollständig und widerspruchsfrei um? Entspricht die Seite den Abschnitten 7.2 bis 7.4? Sind die READMEs von `tools/devhost/` und `tools/overview/` für den Leser verständlich und vollständig?
- bekannt und kein Befund: Der Suchtext der Nutzungsgrenze (3.3 Punkt 5) und der Nachweis, dass `main` den Push des Workflows zulässt (7.1), sind offen und gehen über `amend` an den Softwarearchitekten. Wiedervorlage (4.1) und Präsentation sind Sache des Projektleiters.
- bericht: Dateiname `qa-1.md` im Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/verfahren/reports/`
- umfang der prüfungen: Regeln „Umfang der Prüfungen“ im Entwicklungsverfahren (erster Durchlauf vollständig)
