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
- `--ref`: Zweig, aus dem gelesen wird. Vorgabe `main`; nur `main` ist Quelle der Übersicht
  (Spezifikation E5). Die Angabe dient den Tests.
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

## Gestaltung und Bedienung (Spezifikation 7.4)

Aufbau und Bedienung der Vorlage entsprechen dem bestätigten Oberflächenentwurf
(`development/verfahren/prototype/uebersicht-prototyp.html`). Die Vorlage ist eine Datei mit
Stilen und Skript, Systemschrift, nichts aus dem Netz.

- Ebenen: Der Anker der Adresse wählt den sichtbaren Abschnitt (`#`, `#<vorhaben>`,
  `#<vorhaben>/<nr>`). Das Skript hört auf `hashchange`; die Zurück-Taste des Browsers führt eine
  Ebene zurück. Ein unbekannter Anker zeigt die erste Ebene. Nach einem Wechsel erhält die
  Überschrift der neuen Ebene den Fokus.
- Pfadleiste (`nav.pfad`): ist ohne Skript verborgen (`hidden`), das Skript baut sie und zeigt sie.
  Ohne Skript stehen alle Ebenen untereinander.
- Kästchen, die weiterführen, sind Verweise (`a.kasten`) und mit der Tastatur erreichbar; Kästchen
  ohne Ziel sind `div`. Der Fokus ist ein Rahmen von 3 Pixeln mit hellem Abstandsring.
- Stand: Farbe (Klassen `s-grau`, `s-gelb`, `s-gruen`) und Wort mit Zeichen (`○ Nicht begonnen`,
  `◐ Begonnen`, `● Erledigt`, aus `STANDWORT` in `generate.py`). Hervorhebung: Klasse `wartet`
  (blauer Rahmen von 5 Pixeln, `#1c4f9c`) und Marke `p.marke`.
- Zeitpunkte: `<time class="zeitpunkt" datetime="…Z">` zeigt UTC; das Skript schreibt sie mit
  `toLocaleDateString` und `toLocaleTimeString` (`de-DE`) in Ortszeit aus („24.10.2026, 09:40 Uhr“).
- Fenstergrößen: Raster mit `auto-fill` für Vorhaben und Pakete; die sechs Phasen stehen ab 1100
  Pixel Breite in einer Reihe, darunter zu dritt, unter 520 Pixel untereinander. Lange Wörter
  brechen um (`overflow-wrap`, Silbentrennung mit `lang="de"`).
- Kontrast: alle Schriftfarben haben zu ihrem Grund mindestens 4,5 : 1; der Browsertest rechnet es
  für jeden sichtbaren Text nach.

## Browsertest

`run-browser-test` führt Playwright-Tests (`browser/tests/overview.spec.mjs`) in Chromium, Firefox
und WebKit aus. Jeder Lauf erzeugt zuerst die Seite aus einem Test-Repository
(`browser/make_fixture.py`, über `browser/global-setup.mjs`) in einem temporären Verzeichnis und
entfernt es danach. Das Test-Repository enthält acht Vorhaben: ohne Plan, mit Plan, mit Eintrag
in `waiting.md` (an Vorhaben, Phase und Paket), mit Lücke in der Spezifikation, fertig, ohne
Meldung und mit einem sehr langen Namen.

```text
tools/overview/run-browser-test [--project=chromium] [weitere Optionen von playwright test]
```

Das Skript führt `npm ci` im Verzeichnis `browser/` aus (festgelegte Version von
`@playwright/test`) und startet `playwright test`. Voraussetzungen: Node 24, `npm`, Python 3 (oder
das Programm in `OVERVIEW_PYTHON`) und die Playwright-Testbrowser für die festgelegte Version im
Browser-Cache des Benutzers (`npx playwright install`). Stehen sie dort nicht, legt
`npm --prefix tools/overview/browser run install-browsers-local` sie unter
`browser/node_modules` ab, und `npm --prefix tools/overview/browser run test-local` startet die
Tests mit diesen Browsern. Das Skript verwendet weder Ports noch das Netz; die Seite wird als Datei
geöffnet.

Geprüft wird in den sechs Fenstergrößen 390 × 844, 844 × 390, 820 × 1180, 1180 × 820, 1366 × 768
und 1920 × 1080:

| Prüfung | Inhalt |
|---|---|
| Layout (je Größe, 13 Anker auf allen drei Ebenen) | keine waagerechte Bildlaufleiste; keine zwei Kästchen und keine zwei Zeilen eines Kästchens übereinander; kein Inhalt ragt aus Kästchen oder Fenster; Kopf, Legende, Pfadleiste und Inhalt folgen untereinander; unter 1100 Pixel höchstens drei Phasen in einer Reihe |
| Kontrast (je Größe) | jeder sichtbare Text auf allen Ebenen mindestens 4,5 : 1 |
| Navigation | Weg über alle drei Ebenen durch Klick, Pfadleiste und Zurück-Taste; unbekannter Anker |
| Tastatur | jedes Kästchen der ersten Ebene per Tab erreichbar, Fokusrahmen und Ring sichtbar, Enter öffnet, Fokus auf der neuen Überschrift, Pfadleiste per Tastatur |
| Stand | Wort mit Zeichen zu jeder Farbe, drei verschiedene Hintergründe, Legende |
| Hervorhebung | blauer Rahmen und Marke auf allen drei Ebenen, das Paket in jeder Phasenansicht, keine Marke ohne Eintrag |
| Zeitpunkte | ohne Skript UTC und alle Ebenen sichtbar; mit Skript Ortszeit ausgeschrieben für zwei Zeitzonen |
| Netz | keine Anfrage außer `file:` und `data:`, keine Fehler in der Konsole, keine `url(` oder `@import` |

## Tests und Prüfwerkzeuge

Unit-Tests und Prüfwerkzeuge aus diesem Verzeichnis (Browsertest: Abschnitt „Browsertest“):

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
(`test_limits.py`) und den Aufruf (`test_cli.py`). `ruff.toml` und `mypy.ini` enthalten die Regeln
der Prüfwerkzeuge nach den Entwicklungs-, Test- und Sicherheitsregeln.
