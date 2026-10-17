# Testbericht Funktion – Auftrag 01, Durchlauf 6 (Nachprüfung)

- Vorhaben: `strategiedesign`, Arbeitspaket `wp01`, ref `strategiedesign/wp01`
- Übergabedokument: `strategiedesign/wp01:development/strategiedesign/wp01/tests/01-6-order.md`
- geprüfter Commit: `93209f1fa05aee773bd644d238b3795955720239` (Zweig `strategiedesign/wp01-01`, gleich `origin/strategiedesign/wp01-01`)
- vorher geprüfter Commit: `768631af0816c6dc877992a5588715ad75673ffb` (Bericht `01-functiontest-5.md`)
- Commit des Prüfskripts: `46788e30dd0f7ef541a967c538d631111328259a` (Zweig `strategiedesign/wp01-functiontest`, neu aufgesetzt auf dem geprüften Commit, nach GitHub übertragen)
- Prüfgebiet: Funktion, Code und technische Dokumentation
- Umfang: Nachprüfung nach „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md` und nach „Entscheidung nach Durchlauf 5“ im Auftrag (`strategiedesign/wp01:development/strategiedesign/wp01/orders/01.md`): Befund B1 aus `01-functiontest-5.md` und die dafür geänderte Stelle. Nur blockierende Befunde verhindern das Bestehen.

## Ergebnis

**bestanden**

0 blockierende Befunde, 1 Hinweis (H1).

- Befund B1 aus Durchlauf 5 ist behoben.
- Die Änderung entspricht Punkt 1 der „Entscheidung nach Durchlauf 5“. Der Commit ändert nur diese eine Zeile.
- Die Änderung verursacht kein neues Problem.

Die Zahl der blockierenden Befunde dieses Prüfgebiets sinkt von 1 (Durchlauf 5) auf 0.

## Ausgeführte Prüfungen

Vor der Prüfung kontrolliert:

- `git rev-parse origin/strategiedesign/wp01-01` ergab `93209f1fa05aee773bd644d238b3795955720239`.
- Im eigenen Arbeitsverzeichnis `git checkout --detach 93209f1…`, danach ergab `git rev-parse HEAD` genau diesen Commit.
- `git log --oneline`: Der Vorgänger von `93209f1` ist `768631a`, der in Durchlauf 5 geprüfte Commit.
- `git diff --stat 768631a 93209f1`: nur `docs/technical/pipwerk-domain.md`, 1 Zeile hinzu, 1 Zeile weg.

### Prüfskript

Der Zweig `strategiedesign/wp01-functiontest` ist nach Übergabedokument neu aufgesetzt, mit `git rebase --onto 93209f1 768631a`. Die beiden Commits `36578a8` und `81f85d2` sind unverändert als `ebfd0ed` und `46788e3` übernommen. Gegenüber dem geprüften Commit ändern sie nur `components/pipwerk-studio/scripts/check` und `docs/technical/pipwerk-studio.md` (`git diff --stat 93209f1 HEAD`). Eine weitere Änderung am Prüfskript war nicht nötig. Übertragen wurde mit `push --force-with-lease` gegen den vorherigen Stand `81f85d2`. Danach ergab `git rev-parse HEAD~2` den geprüften Commit.

Aufruf: `<Arbeitsverzeichnis>/components/pipwerk-studio/scripts/check --backend-port 18101 --frontend-port 15271 --with-audit`. Ausgabe: „checking … at commit 46788e30dd0f7ef541a967c538d631111328259a“. Exitcode 1, 19 von 20 Prüfungen bestanden:

- Bibliothek:
  - `uv sync --frozen`
  - pytest: 958 Tests bestanden (11,50 s), davon 18 in `test_hardening_3.py`
  - `ruff check`: „All checks passed!“
  - `ruff format --check`: „50 files already formatted“
  - mypy: „Success: no issues found in 49 source files“
  - Abgleich der Schemata mit `contracts/strategies/v1`
  - `pip-audit`: „No known vulnerabilities found“
- Backend: `uv sync --frozen`, pytest (148 Tests gesammelt), `ruff check`, `ruff format --check`, mypy, `pip-audit`, alle bestanden laut Zusammenfassung des Prüfskripts
- Suche nach der Schreibweise des Namens: bestanden
- Oberfläche: `npm ci`, Typprüfung, Vitest, Bau: bestanden
- Browsertest in Chromium, Firefox und WebKit: 39 bestanden, 6 übersprungen. Übersprungen sind die Fälle ohne Git-Arbeitsverzeichnis (`docs/technical/pipwerk-studio.md` Abschnitt 6.3).

Die Ausgabe des Werkzeugs war in der Mitte gekürzt (Teil von Backend und Oberfläche). Für diesen Teil stützt sich der Bericht auf die Zusammenfassung „passed“ und „failed“ am Ende des Prüfskripts.

Gescheitert ist nur `frontend: npm audit`. Einzeln nachgeprüft mit `npm --prefix <Arbeitsverzeichnis>/components/pipwerk-studio/frontend audit`: `source-map-js` 1.0.0 bis 1.2.1, Schwere „high“, GHSA-68fv-2mgg-jv7q. Das ist der bekannte Befund aus `docs/technical/pipwerk-studio.md` Abschnitt 7 und 9, wie in Durchlauf 4 und 5. Der geprüfte Commit ändert nichts an der Oberfläche. Deshalb ist das kein Befund dieses Commits.

### Kontrolle des Befunds B1 aus Durchlauf 5

| Befund | Ergebnis | Nachweis |
| --- | --- | --- |
| B1 – Abschnitt 12 beschreibt die neuen Tests in `test_hardening_3.py` nicht | behoben | `docs/technical/pipwerk-domain.md` Zeile 509 lautet jetzt: „die Grenze von 50 Befunden je Ausdruck mit `expression.order_outside_management`, `rule.result_mismatch` und Hinweisen in Vorlagen sowie mit `rule.order_in_indicator` (Regel und Regelwerk in einer Vorlage `Indikator`) (jeweils mit Gegenprobe), …“. Abgleich mit `packages/domain-core/tests/test_hardening_3.py`: Zeile 164 (Regel, 60 plus `rule.order_in_indicator`, gekürzt), Zeile 169 (Regel, Gegenprobe 49), Zeile 176 (Regelwerk, gekürzt), Zeile 181 (Regelwerk, Gegenprobe 49). Beide Vorlagen sind `catalog.TYPE_INDICATOR` (Zeile 142 und 149). Die Zeile stimmt damit mit den Tests überein. Alle vier Tests bestanden. |
| geänderte Stelle | ohne neuen Befund | Der Rest der Zeile ist unverändert (`git diff 768631a 93209f1`). Andere Zeilen und Dateien sind nicht geändert. `test_documentation.py` bestand (27 Tests). |

## Befunde

Keine.

## Hinweise

- H1 – Die Hinweise H1 und H2 aus Durchlauf 5 bestehen unverändert. Sie gehören nicht zum Umfang dieser Nachprüfung. Der Commit ändert die betroffenen Stellen nicht (`git diff --stat 768631a 93209f1`). Die doppelte Klammer „(Regel und Regelwerk in einer Vorlage `Indikator`) (jeweils mit Gegenprobe)“ in Zeile 509 ist sprachlich holprig, aber inhaltlich richtig. Das ist kein Befund.

## Bereinigung

Es wurden keine Probeskripte angelegt. Das Arbeitsverzeichnis steht auf Commit `46788e3` des Prüfskripts (Zweig `strategiedesign/wp01-functiontest`, gleich `origin`). `git status --short` meldet keine Änderungen.
