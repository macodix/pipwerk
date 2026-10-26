# Prüfbericht QA 1: Vorhaben `verfahren`

- Ergebnis: **nicht bestanden** (1 blockierender Befund)
- geprüfter Commit: `998f98247f89839395876594d3e27877c57badf7` (Zweig `verfahren/umsetzung`), erster Durchlauf, vollständig
- Testumgebung: keine (Vorhaben ohne Dienst und Port)
- Grundlagen: `scope.md`, `specification.md` (3 bis 8, 10), Oberflächenentwurf `uebersicht-prototyp.html`

## Nicht prüfbar
- Erzeugung der Seite und Browsertests: `python3` gegen das Arbeitsverzeichnis wurde mir nicht freigegeben. Geprüft habe ich `template.html` ganz, `generate.py` an den Stellen für 7.4 Punkte 4 bis 7 (Zeilen 219 bis 249, 740 bis 880) und die Tests, die den Wortlaut festlegen. Die Ansicht in einem Browser, Kontrast und Fenstergrößen sind nur durch Lesen der Stile geprüft (Kontrast der Textfarben nachgerechnet: ausreichend).
- Nachweis des Suchtextes (3.3 Punkt 5) und Push auf `main` (7.1): bekannt, kein Befund.

## Blockierend
**B1. Fehlgeschlagener erster Start zählt nicht als Abbruch (README gegen Festlegung 1).**
`tools/devhost/README.md`, Abschnitt „Fortsetzung nach einem Abbruch“, letzter Punkt, und `scripts/agentrun` Zeilen 154 bis 158: Schlägt der erste Start fehl, schreibt `agentrun` sofort `failed`, ohne Zählung und ohne Fortsetzung. Dagegen:
- Spezifikation 3.1: Ein fehlgeschlagener Start ist ein Abbruch. 3.2 Punkt 4 kennt nur das ungültige `ref` als Sofortfall.
- `entwicklungsverfahren.md`, Begriffe („Abbruch“) und Abschnitt „Fortsetzung nach einem Abbruch“ Punkt 3: „fehlgeschlagener Start“ ist eine Art des Abbruchs; `failed` erst nach dem dritten.
- Festlegung 1: Der Projektleiter erhält erst nach dem dritten Abbruch derselben Aufgabe eine Meldung.
Das Verfahrensdokument nennt die Ausnahme nirgends. Fundstelle der Abweichung: README und Skript. Entweder Verhalten oder Dokumente sind falsch; die Entscheidung ist Sache von Spezifikation und Entwicklungsleiter.

## Hinweise (verhindern das Bestehen nicht)
Fragen zu den Verfahrensdokumenten (Abschnitt 8): Die Festlegungen 1 bis 7 sind in `entwicklungsverfahren.md`, den Briefings und im Glossar sonst vollständig und ohne Widerspruch umgesetzt; Querverweise und Anker stimmen.

Zuordnung der Hinweise: „Sache der Spezifikation“ (S), „folgt aus einer Festlegung“ (F).

1. (F) Beide Verfahrensdokumente sind auf `origin/main` weitergelaufen: `git merge-tree` meldet Konflikte in `agentenrollen-und-briefings.md` und `entwicklungsverfahren.md`. Vor der Integration auflösen.
2. (F) `entwicklungsverfahren.md`, Meldungstabelle, Zeile `failed`: nennt nur den „dritten Abbruch“; der Abschnitt `agentrun` nennt zusätzlich das ungültige `ref` als Sofortfall. Tabelle angleichen.
3. (S) Festlegung 6 („fester Link wie die Präsentationen“): Weder Verfahrensdokument noch README sagen, unter welcher Adresse die Seite zu öffnen ist (7.1: folgt dem offenen Punkt). Der Leser der READMEs erfährt es nicht.
4. (F) Regel „Jede Festlegung steht an genau einer Stelle, READMEs enthalten keine“ (Geltungsbereich): Beide READMEs enthalten Festlegungen (Parameter, Abläufe, Format von `waiting.md`). Das Format von `waiting.md` steht nur in `tools/overview/README.md`, nicht im Verfahren oder im Briefing Projektleiter, der die Datei schreibt. Verweis ergänzen oder Festlegung ins Verfahren.
5. `tools/devhost/README.md`: „Bei der Installation setzen“ sagt nicht, wie (Zeile im Skript ändern? Umgebung?). Verweise „Auftrag 07“ und „Auftrag 08“ sowie „bisher installierte Skripte“ sind ohne Vorwissen nicht verständlich. `tools/overview/README.md`: „Hinweis H2“, „Spezifikation E5“ ebenso.
6. Briefing Softwarearchitekt, Schritt 6 (`amend`): Weder Machbarkeitstest bei `amend` (6.4) noch der Umgang mit dem Vorschlag eines Oberflächenentwurfs des Entwicklungsleiters (Frage über den Projektleiter) sind dort genannt; nur Schritt 3 und 8. Meldungstabelle `amend` nennt diesen Anlass auch nicht.
7. Briefing Projektleiter, Phase 1: „Ein bestehendes Vorhaben ohne Namen erhält ihn bei der nächsten Arbeit“ lässt „mit dem Auftraggeber“ aus (5.5).
8. `template.html` Zeile 140: `decodeURIComponent` ohne Fangen des Fehlers. Ein Anker mit ungültiger Prozentkodierung (zum Beispiel `#%`) bricht das Skript ab; dann stehen alle Ebenen untereinander und die Pfadleiste fehlt. README sagt: „Ein unbekannter Anker zeigt die erste Ebene.“ (Nur durch Lesen festgestellt.)
9. `praesentation-entwicklungsprozess.html` Zeilen 100, 128, 129 sagen noch „Prototypen“ (H4: „in allen Verfahrensdokumenten“). Bestätigte Präsentation; Entscheidung beim Projektleiter, ob sie bleibt.

## Geprüft und in Ordnung
- Abschnitte 3.2 bis 3.4 (ohne B1), 4.1 bis 4.4, 5, 6 in Verfahren, Briefings und Glossar umgesetzt; Wiedervorlage 20 und 40 Minuten nach der Aktivierung überall gleich.
- Abschnitt „Übersicht“ stimmt mit 7.1 bis 7.3 überein; Tabelle gleich der Tabelle in 7.2. Workflow `overview.yml` entspricht 7.1 (GitHub-Runner, `contents: write`, kein Pull-Request-Auslöser, Abbruch laufender Läufe, volle Geschichte, drei Versuche).
- Vorlage entspricht 7.4: Ebenen im Anker, Pfadleiste, Verweise mit Tastatur und Fokus, Stand als Wort mit Zeichen, blauer Rahmen mit Marke, Legende, UTC ohne Skript, keine Netzbezüge, Rasterbreiten für schmale Fenster. Paketname mit Kennung bei „wartet auf“ (`generate.py` 471, Test `test_packages.py` 44).
