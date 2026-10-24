# Testbericht Funktion: Auftrag 03, Durchlauf 1

- geprüfter Commit: `d7a5bf518598fbf778a2fb8d63b4d5f89a440a02` (Zweig `verfahren/umsetzung-03`)
- Prüfskript: keines geändert
- Ergebnis: **bestanden**, keine blockierenden Befunde, drei Hinweise, zwei Lücken in der Prüfung (siehe unten)

## Vorgehen und Einschränkungen

- Gelesen: Auftrag 03, Spezifikation Abschnitte 3 bis 8, Diff des Commits (4 Dateien: `overview.yml`, Entwicklungsverfahren, Briefings, Glossar), `overview.yml` vollständig.
- Das Arbeitsverzeichnis wurde während der Prüfung von außen auf `9981662` (Auftrag 01) zurückgesetzt, obwohl ich `d7a5bf5` ausgecheckt hatte. Ab da habe ich nur noch aus dem Commit gelesen (`git grep`, `git show` im Repository, lesend). Ursache unbekannt; vermutlich arbeitet eine zweite Sitzung im selben Verzeichnis.
- `actionlint` ist nicht installiert (`which actionlint`: Exitcode 1). PyYAML-Prüfung und `bash -n` des Schritts waren in dieser Sitzung nicht freigegeben. **Nicht ausgeführt, also ungeprüft:** `actionlint`, maschinelle YAML-Syntax, Shell-Syntax. Ersatz: Lesen der Datei, siehe unten. Bitte nachholen, sobald eine Sitzung die Werkzeuge hat.
- Die Datei `work/verfahren/reports/.scratch-overview-run.sh` ist von mir (Auszug des Workflow-Schritts für `bash -n`); ich konnte sie nicht löschen. Bitte entfernen.

## Workflow `.github/workflows/overview.yml` gegen Punkt 3 des Auftrags

| Angabe | Befund |
|---|---|
| Push auf `main`, Pfade `development/**` ohne `development/overview.html` | erfüllt (Zeilen 8 bis 12) |
| zusätzlich von Hand | `workflow_dispatch` (Zeile 13) |
| Runner von GitHub | `ubuntu-latest` (Zeile 24) |
| Rechte `contents: write`, keine anderen | Zeilen 15 und 16 |
| keine Auslöser für Pull Requests | keiner vorhanden |
| neuer Lauf bricht laufenden ab | `concurrency` mit `cancel-in-progress: true` |
| vollständige Geschichte | `fetch-depth: 0`, `ref: main` |
| Aufruf `python3 tools/overview/generate.py . development/overview.html` | Zeile 40 |
| Commit bei Änderung | Zeilen 41 bis 46 (auch bei neuer, unverfolgter Datei, da `status --porcelain` dann `??` zeigt) |
| abgelehnter Push: holen, neu erzeugen, bis zu dreimal | Schleife 1 bis 3, `fetch` und `reset --hard origin/main`, danach Neuerzeugung; nach dem dritten Versuch Exitcode 1 |
| keine Aktionen Dritter außer `actions/checkout` mit fester Version | nur `actions/checkout@v4.2.2` |

Beim Lesen keine Syntaxfehler gefunden (Einrückung, Blockskalar `run: |`, Anführungszeichen, Arithmetik `$((…))`).

## Verfahrensdokumente gegen Tabelle in Abschnitt 8

Jede Zeile der Tabelle ist im Diff belegt: Kurzfassung und Phase 2 (Machbarkeitstest, Oberflächenentwurf je Ansicht), Phase 3 (Paketnamen, Bedienbarkeit), Begriffe (Name, Ansicht, Oberflächenentwurf, Machbarkeitstest, Abbruch, Wiedervorlage), Ablage (`followup.md`, `waiting.md`, `overview.html`), Meldungen (Eingang, `failed` nach dem dritten Abbruch), Entwicklungsverzeichnis, `agentrun` mit Fortsetzung und Pause, Herzschlag, Start von Tester und QA, neuer Abschnitt „Übersicht“ nach dem Runner (Runner unverändert), alle vier Briefings, Glossar. Änderungsnachweis und Stand 2026-10-24 sind in allen drei Dokumenten gesetzt.

- Anker geprüft gegen die Überschriften des Commits: `#phase-2--konzeption`, `#übersicht`, `#eingang-des-projektleiters`, `#fortsetzung-nach-einem-abbruch`, `#pause-wegen-der-nutzungsgrenze`, `#briefing-projektleiter`, `#verbrauch-des-nutzungskontingents`, `#umfang-der-prüfungen` bestehen.
- Namen von Rechnern oder Benutzern: nur der Pfad `/srv/aixlab/dev/pipwerk` an der bisherigen Stelle (Entwicklungsverfahren, „Entwicklungsverzeichnis“). Erfüllt.
- „Prototyp“, „Probeumsetzung“, „klickbar“ in `entwicklungsverfahren.md`, `agentenrollen-und-briefings.md` und `glossar.md`: nur noch in Änderungsnachweisen als Beschreibung der Vereinheitlichung. Erfüllt.
- Inhalt der Übersicht stimmt mit 7.1 und 7.2 überein (Tabelle, Fußnote, Farben, „Wartet auf den Auftraggeber“); kein Verweis auf den Entwurf.

## Hinweise (nicht blockierend)

- **H1: 4.1 Punkt 3, Zeitpunkt der zweiten Wiedervorlage.** Die Spezifikation sagt „40 Minuten später“, das Briefing „40 Minuten nach der ersten“, also 60 Minuten nach der Aktivierung. Die Spezifikation fordert in 4.1 Punkt 6 aber, dass nach mehr als 40 Minuten ohne Bearbeitung ein Mangel vorliegt, und der beobachtete Fall verzögerte um 50 Minuten. Bei 60 Minuten greift der Rückfall dort nicht. Die Spezifikation ist hier mehrdeutig; Klärung durch den Softwarearchitekten, das Briefing entsprechend anpassen.
- **H2: `docs/technical/praesentation-entwicklungsprozess.html`** enthält noch „Prototypen“ und „Probeumsetzungen“ (Zeilen 100, 128, 129). Der Auftrag nennt sie nicht, die Spezifikation verlangt die Begriffe aber „in allen Verfahrensdokumenten“. Es ist die vom Auftraggeber bestätigte Präsentation; ob sie angepasst wird, entscheidet der Softwarearchitekt.
- **H3: Änderungsnachweis rückwirkend umformuliert.** Alte Einträge (2026-10-19 und 2026-10-23, auch der Anlass „Prototyp der Ansicht ‚Datenbestand‘“) nennen jetzt „Oberflächenentwurf“. Das ist vom Auftrag verlangt, verändert aber die Wiedergabe des damaligen Anlasses.

## Zum Push auf `main` (Auftrag, letzte Zeile)

Ungeprüft. Nötig für den Nachweis durch den Entwicklungsleiter: Der Workflow muss auf `main` liegen, und `main` darf dem Token des Workflows (`github-actions[bot]`) den direkten Push erlauben (kein Schutzregelwerk, das Pushes ohne Pull Request sperrt, oder eine Ausnahme dafür; Repository-Einstellung „Workflow permissions“ darf `contents: write` nicht auf nur lesen begrenzen, hier gesetzt in der Datei). Zusätzlich muss `tools/overview/generate.py` aus Auftrag 01 auf `main` liegen; dieser Commit enthält es nicht (`tools/` enthält dort nur `README.md`).
