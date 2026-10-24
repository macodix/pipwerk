# Übersicht der Vorhaben (`tools/overview`)

## Zweck

`generate.py` erzeugt aus einem Git-Repository die Datei `development/overview.html`: eine einzige
HTML-Seite ohne externe Dateien, die in drei Ebenen den Stand aller Vorhaben zeigt (Vorhaben,
Phasen, Pakete beziehungsweise Schritt) und hervorhebt, was auf den Auftraggeber wartet. Die
Regeln stehen in Abschnitt 7 der Spezifikation des Vorhabens `verfahren`
(`development/verfahren/specification.md`): 7.2 Stand, 7.3 Grenzen, 7.4 Gestaltung.

## Aufruf

```text
python3 generate.py <wurzelverzeichnis> <ausgabedatei> [--ref main] [--now JJJJ-MM-TTThh:mm:ssZ]
```

- `<wurzelverzeichnis>`: Wurzelverzeichnis eines Repositorys mit vollständiger Geschichte (bei
  GitHub Actions der Checkout mit `fetch-depth: 0`).
- `<ausgabedatei>`: Pfad der Datei, die geschrieben wird, im Repository
  `development/overview.html`. Das Skript schreibt nur diese Datei.
- `--ref`: Zweig, aus dem gelesen wird. Ohne Angabe gilt `origin/main`, wenn es im Repository
  besteht, sonst `main`; nur der Stand von `main` ist Quelle der Übersicht (Spezifikation E5).
  Die Angabe dient den Tests und wird unverändert verwendet.

### Entscheidung zum Zweig (Hinweis H2)

Die Schnittstelle (Wurzelverzeichnis, Ausgabepfad) bleibt gleich; `--ref` ist nur der bisherige
optionale Parameter. Ohne ihn liest das Skript `origin/main` und fällt auf `main` zurück
(`default_ref`). Gründe: `origin/main` ist der veröffentlichte Stand, ein lokaler `main` kann in
einem Arbeitsverzeichnis hinter ihm zurückliegen. Im Workflow zeigen nach dem Checkout von `main`
mit `fetch-depth: 0` beide auf denselben Commit, das Ergebnis ist dort dasselbe. Ein Repository
ohne `origin` (zum Beispiel die Test-Repositories) liest weiter `main`. Besteht keiner der beiden,
endet das Skript mit einem Fehler.
- `--now`: Zeitpunkt der Erzeugung in UTC statt der aktuellen Zeit, für reproduzierbare Ausgaben.

Das Skript braucht Python 3 (getestet mit 3.14) und `git`, keine fremden Pakete. Es liest ausschließlich mit `git show`, `git log`, `git ls-tree` und `git cat-file`. Die
Arbeitskopie wird nicht gelesen und nicht verändert. Endet es mit einem Fehler, steht dieser auf der
Fehlerausgabe, der Rückgabewert ist 1 und die Ausgabedatei bleibt unberührt.

## Quellen (alle aus `main`)

| Quelle | Verwendung |
|---|---|
| `development/<vorhaben>/scope.md` | Ein Vorhaben erscheint nur, wenn die Datei besteht. Name aus der Zeile `Name: …` (ein Punkt am Ende entfällt). Ohne Zeile gilt die Kennung. |
| `development/<vorhaben>/plan.md` | Pakete in der Reihenfolge der Übersichtstabelle (`Paket`, `Titel`, `hängt ab von`, `Stand`). Name aus der Überschrift `## wp01 – <Name>`, sonst aus dem Titel der Tabelle. Abhängigkeiten sind die in Backticks gesetzten Kennungen (`wp01`, `backtest/wp02`). `Stand` `done` heißt fertig. Ohne Plan hat das Vorhaben keine Pakete. |
| `development/<vorhaben>/waiting.md` | Zeilen der Vorlage beim Auftraggeber (siehe unten). |
| Geschichte von `development/messages/` | Alle je hinzugefügten Meldungsdateien, auch bereits entfernte. Gelesen werden nur `ref`, `task` und `document` (nur um bei `revise` und `present` Spezifikation und Plan zu unterscheiden), der Empfänger aus dem Verzeichnis und der Zeitpunkt aus dem Dateinamen. Der Text der Meldung wird nicht gelesen und erscheint nie. |

Je `ref` gilt die jüngste Meldung nach dem Zeitpunkt im Dateinamen (bei gleichem Zeitpunkt nach der
laufenden Nummer). Meldungen mit ungültigem Aufbau, ein `ref` ohne Vorhaben und ein Paket, das nicht
im Plan steht, werden übersprungen.

### Format von `waiting.md`

Eine Zeile je Vorlage beim Auftraggeber, als Tabellenzeile oder Aufzählung mit senkrechten Strichen:

```markdown
| ref | Handlung | Zeitpunkt (UTC) |
|---|---|---|
| `verfahren` | Präsentation bestätigen | 2026-10-24T09:40:00Z |
| `strategiedesign/wp02` | Abnahme durchführen | 2026-10-24 08:05 |
```

- `ref`: `<vorhaben>` oder `<vorhaben>/<paket>`, in Backticks oder ohne.
- Handlung: der Text, der in der Marke „Wartet auf Sie: <Handlung>“ erscheint.
- Zeitpunkt in UTC: `JJJJ-MM-TT hh:mm[:ss]`, wahlweise mit `T`, `Z` oder `UTC`. Ist er nicht lesbar,
  fehlt „seit“, die Zeile gilt trotzdem.
- Kopf-, Trenn- und andere Zeilen werden übergangen. Eine Zeile zu einem `ref`, zu dem es noch
  keine Meldung gibt, hat keine Wirkung.

Steht für ein `ref` eine Zeile da, ist „bei wem“ „Auftraggeber“, „seit“ der Zeitpunkt der Zeile,
gleich welche Meldung die jüngste ist (Spezifikation 7.2, Fußnote).

## Vorlage und Ausgabe

`template.html` enthält Stile und Skript der Seite und zwei Platzhalter in doppelten geschweiften
Klammern: `ZEIT` (Zeitpunkt der Erzeugung) und `INHALT` (die Ebenen). `generate.py` ersetzt sie und
schreibt das Ergebnis. Der Inhalt besteht aus einem Abschnitt je Ebene:

| Anker | Abschnitt |
|---|---|
| `#` (leer) | `ebene-alle`, alle Vorhaben |
| `#<vorhaben>` | die sechs Phasen des Vorhabens |
| `#<vorhaben>/<nr>` | die Pakete der Phase 4 bis 6 beziehungsweise der Schritt der Phase 1 bis 3 |

Ohne Skript stehen alle Abschnitte untereinander. Mit Skript zeigt die Seite die Ebene des Ankers,
baut die Pfadleiste und schreibt die Zeitpunkte (`<time class="zeitpunkt">`) in Ortszeit aus. Alle
Zeitpunkte stehen sonst in UTC. Die Seite enthält keine Namen von Rechnern oder Benutzern, keine
Pfade, Ports oder Links nach außen (Spezifikation 7.3); die Tests prüfen das.

Die Gestaltung (Layout, Farben, Fenstergrößen) ist Sache eines nachfolgenden Auftrags. Die Vorlage
liefert den bestätigten Aufbau und die Bedienung des Oberflächenentwurfs.

## Tests und Prüfwerkzeuge

Aus diesem Verzeichnis:

```text
python3 -m unittest
ruff check .
ruff format --check .
mypy --config-file mypy.ini
```

Die Tests (`tests/`) legen je Test ein Git-Repository in einem temporären Verzeichnis an und
berühren kein anderes Repository. Sie decken ab: jede Zeile der Tabelle in 7.2 (`test_table.py`),
`waiting.md` mit Meldungen vor und nach der Vorlage (`test_waiting.py`), Pakete und Vorhaben mit
Plan (`test_packages.py`), Vorhaben ohne Plan, ohne `scope.md`, Namen, Reihenfolge und Geschichte der
Meldungen (`test_vorhaben.py`), die Grenzen nach 7.3 gegen eine Liste verbotener Muster
(`test_limits.py`) und den Aufruf (`test_cli.py`). `test_repository.py` ruft `generate.py` gegen das Arbeitsverzeichnis
auf, in dem der Test liegt (Wurzel über den Ablageort), und prüft, dass die Seite das Vorhaben
`verfahren` mit seinem Namen aus `scope.md` zeigt, 7.3 einhält und der Lauf nur die Ausgabedatei
schreibt (Arbeitskopie, Zweige und `HEAD` unverändert). Stand, Phase und Farbe des Vorhabens prüft
er nicht. Der Test überspringt sich mit Begründung, wenn weder `origin/main` noch `main` besteht,
das Vorhaben dort fehlt oder der Klon flach ist. Dazu die Wahl des Zweigs ohne `--ref`. `ruff.toml` und `mypy.ini` enthalten die Regeln
der Prüfwerkzeuge nach den Entwicklungs-, Test- und Sicherheitsregeln.
