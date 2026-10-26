# Testbericht Tester Funktion: Auftrag 13

- Ergebnis: **bestanden**
- Geprüfter Commit: `a736330a271292eec03d18d05031f9715cc02cd4` (Zweig `verfahren/umsetzung-13`, Basis `618ecd0d170d7e5eae124e3fee19ca4f065e5a5f`). Ausgecheckt und mit `git rev-parse HEAD` kontrolliert.
- Prüfskript: nicht geändert, kein Commit des Prüfskripts.
- Tests: nicht erneut ausgeführt, wie im Übergabedokument vorgegeben (kein Programmcode geändert).

## Geprüft

- Umfang: `git diff --stat 618ecd0…a736330` zeigt nur `tools/devhost/README.md` (2 Zeilen). Kein Programmcode, `docs/technical/entwicklungsverfahren.md` unverändert. Erfüllt das Abnahmekriterium des Auftrags.
- H1 (README, Abschnitt „Gleiche Stellen in `agentrun` und `startrole`“): Der Text sagt jetzt „mit denselben Werten als einfache Zuweisungen“ und „geänderter Suchtext“. Zum Code:
  - `LIMIT_TEXT`, `LIMIT_TIME_PATTERN` und `PAUSE_INTERVAL` stehen in `scripts/agentrun` und `devteam/lib/startrole` als einfache Zuweisungen.
  - Die Werte sind gleich: `PAUSE_INTERVAL=900`, derselbe `LIMIT_TEXT`, dasselbe Zeitmuster.
  - Die genannten Testfälle gibt es in `tests/agentrun.bats` (Zeilen 666, 698 und 713 für `agentrun`; 1006, 1047, 1061, 1071 und 1081 für `startrole`).
- Reste der Ersatzwert-Sprache: `grep -n -i "standardwert\|als Parameter\|Ersatzwert\|:-"` in README und `entwicklungsverfahren.md` findet nur Zeile 41 der README („verwenden keinen Ersatzwert“). Das ist die gewollte Verneinung. `grep -rnE '\$\{[A-Za-z_]+:-' tools/devhost` hat keinen Treffer. In `docs/technical` gibt es Treffer nur in `pipwerk-domain.md`, `glossar.md` und `pipwerk-studio.md` mit fachlicher Bedeutung (Standardwert eines Parameters), außerhalb des Auftrags.
- H2 (README, Abschnitt „Werte bei der Installation“): Der Satz „Wegen der Platzhalter ist die Kopie im Repository nicht lauffähig; lauffähig wird sie erst durch die Installation oder in der Kopie der Testumgebung.“ steht. Er stimmt mit dem Code überein: `scripts/agentrun` hat `GITHUB_REPO='<eigentümer>/<name>'` und `CLAUDE='<pfad-zu-claude>'`, `scripts/pidcheck` hat `PATH='<suchpfad>'`.
- Querverweise: Die Abschnitte „Werte bei der Installation“, „Nachweis des Suchtextes“ und „Nutzungsgrenze“ gibt es in der README. Der Verweis aus Zeile 106 auf „Werte bei der Installation“ stimmt.
- Änderungsnachweis: Ein Eintrag war nicht nötig, weil `entwicklungsverfahren.md` nicht geändert wurde. Der Eintrag vom 2026-10-26 (Auftrag 12, Zeile 549) passt weiter zum README.

## Befunde

- Keine blockierenden Befunde.
- Hinweis (nicht blockierend): Zwei Testnamen in `tests/agentrun.bats` sagen noch „Parameter“ (Zeile 731: „Suchtext und Zeitmuster sind Parameter“; Zeile 1081: „Suchtext ist ein Parameter“). Das ist nicht die Ersatzwert-Sprache der README und liegt außerhalb des Auftrags.
- Hinweis: Im Arbeitsverzeichnis zeigt `git status` Änderungen des Dateimodus an `components/pipwerk-studio/scripts/check` und `testenv` (0 Zeilen Inhalt). Sie stammen nicht aus dieser Prüfung und haben keinen Einfluss auf den Commit.
- Hinweis: Das Übergabedokument nennt den Zweig als `verfahren/umsetzung:`. Gelesen wurde `origin/verfahren/umsetzung`. Dort liegt `handover-13.md`, der Zweig `origin/umsetzung` gibt es nicht.
