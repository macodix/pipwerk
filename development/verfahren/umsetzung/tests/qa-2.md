# Prüfbericht QA 2: Vorhaben `verfahren` (Nachprüfung)

- Ergebnis: **bestanden** (kein blockierender Befund)
- geprüfter Commit: `a06dd8411de5835fce194faa12050b9f7e6fbc19` (Zweig `verfahren/umsetzung`), Nachprüfung nach `qa-1.md`; Grundlage `git diff 998f982…a06dd84`
- Testumgebung: keine (Vorhaben ohne Dienst und Port)

## Nicht prüfbar
- Tests (`agentrun.bats`, Browsertests) und die Erzeugung der Seite habe ich nicht ausgeführt. Geprüft durch Lesen von Diff, Skript, Vorlage und Dokumenten. Das Verhalten im Browser ist nur aus dem Code abgeleitet.
- Suchtext der Nutzungsgrenze und Push auf `main`: wie vereinbart offen, kein Befund. Die README sagt das jetzt klar („Platzhalter“, „offen“).

## Erledigt
- **B1 erledigt.** `scripts/agentrun` Zeilen 154–176, 206–226: Ein fehlgeschlagener Start (erster Start oder Neustart) erhöht den Zähler (`start_failed`), startet mit dem ursprünglichen Auftrag neu und schreibt erst beim dritten Abbruch `failed` mit Zahl und Art („Start fehlgeschlagen“). Die Zustandsdatei wird jetzt vor dem Start angelegt, deshalb ist der Zähler vorhanden. Das stimmt mit Spezifikation 3.1, Verfahren (Zeilen 385, 406) und Festlegung 1 überein. Die Rekursion `start_failed` → `restart_session` → `start_failed` endet am Limit. README, Abschnitt „Fortsetzung nach einem Abbruch“, beschreibt dasselbe.
- **Hinweis 2 erledigt.** `entwicklungsverfahren.md` Zeile 270: `failed` nennt jetzt dritten Abbruch und ungültiges `ref` (sofort); passt zu Zeile 385 und Spezifikation 3.2 Punkt 4.
- **Hinweis 5 erledigt.** `tools/devhost/README.md`: Installation beschrieben (Form des Parameters, Ersetzen hinter `:-`, Beispiel `sed`; die Zeile am Skriptanfang stimmt mit `agentrun` Zeile 12 überein). Die Verweise „Auftrag 07/08“ und „bisher installierte Skripte“ sind entfernt. `tools/overview/README.md`: „Hinweis H2“ und „Spezifikation E5“ ersetzt. Nur ein Rest: „bisherige optionale Parameter“ (Zeile 28), unschädlich.
- **Hinweis 6 erledigt.** Briefing Softwarearchitekt Schritt 6 nennt Machbarkeitstest und Frage über den Projektleiter; die Meldungstabelle nennt den Anlass.
- **Hinweis 7 erledigt.** Briefing Projektleiter Phase 1: „mit dem Auftraggeber festgelegt“.
- **Hinweis 8 erledigt.** `template.html` Zeilen 140–146: `decodeURIComponent` in `try`, bei Fehler Anker leer und damit erste Ebene. Der Browsertest deckt `%`, `%E0%A4%A` und `backtest/%` ab, README nennt es.

## Neue Fehler an den geänderten Stellen
Keine blockierenden gefunden. Die Änderungsnachweise beider Dokumente sind eingetragen.

## Hinweise (verhindern das Bestehen nicht)
1. (F) Der sofortige Neustart nach einem fehlgeschlagenen Start steht nur in `tools/devhost/README.md`, nicht im Verfahren (`entwicklungsverfahren.md` Zeilen 385, 406 sagen nur „nach dem dritten Abbruch“). Das widerspricht nichts; der Hinweis 4 aus `qa-1.md` (Festlegungen in READMEs) gilt dafür weiter.
2. Weiter offen, bewusst nicht behoben (Zuordnung wie in `qa-1.md`): Hinweis 1 (Konflikte mit `origin/main`, vor der Integration auflösen; erneut nicht geprüft), 3, 4 und 9 (Sache von Projektleiter, Auftraggeber beziehungsweise Spezifikation).
