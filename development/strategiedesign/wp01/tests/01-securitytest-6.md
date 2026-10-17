# Testbericht Sicherheit – Auftrag 01, Durchlauf 6 (Nachprüfung)

- Vorhaben: `strategiedesign`, Arbeitspaket `wp01`, ref `strategiedesign/wp01`
- Übergabedokument: `strategiedesign/wp01:development/strategiedesign/wp01/tests/01-6-order.md`
- geprüfter Commit: `93209f1fa05aee773bd644d238b3795955720239` (Zweig `strategiedesign/wp01-01`, gleich `origin/strategiedesign/wp01-01`)
- vorher geprüfter Commit: `768631af0816c6dc877992a5588715ad75673ffb` (Bericht `01-securitytest-5.md`, bestanden)
- Umfang: Nachprüfung nach „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md` und Punkt 2 der „Entscheidung nach Durchlauf 5“ in Auftrag 01: Befund B1 aus `01-functiontest-5.md` und die dafür geänderte Stelle. Nur blockierende Befunde verhindern das Bestehen.
- Grundlagen: Auftrag 01 mit „Entscheidung nach Durchlauf 5“, Übergabedokument, Entwicklungs-, Test- und Sicherheitsregeln, `docs/technical/pipwerk-domain.md`, BSI CON.8 und APP.7, OWASP ASVS

## Ergebnis

**bestanden**

Keine blockierenden Befunde. Der Commit ändert gegenüber `768631a` nur eine Zeile Dokumentation. Er ändert keinen Code, keine Tests, keine Abhängigkeiten und keine Verträge. Eine Auswirkung auf die Sicherheit hat er nicht. Die Hinweise H1, H6 und H9 aus den früheren Durchläufen bleiben unverändert bestehen.

## Ausgeführte Prüfungen

Vor der Prüfung kontrolliert: `git rev-parse HEAD` im eigenen Arbeitsverzeichnis ergab `93209f1fa05aee773bd644d238b3795955720239`, ebenso `git rev-parse origin/strategiedesign/wp01-01`. `git status --short` war nach der Prüfung leer.

`git diff --stat 768631a 93209f1`: nur `docs/technical/pipwerk-domain.md`, 1 Zeile geändert (Zeile 509, Abschnitt 12, Zeile zu `test_hardening_3.py`). Damit sind `uv.lock`, `pyproject.toml`, `contracts/` und der gesamte Code unter `src/` und `tests/` unverändert.

### Befehle in `packages/domain-core` auf dem geprüften Commit

| Befehl | Ergebnis |
| --- | --- |
| `uv sync --frozen` | bestanden |
| `uv run --frozen pytest` | 958 bestanden (11,32 s), darunter `test_documentation.py` (Abgleich Dokument mit Code) |
| `uv run --frozen ruff check` | „All checks passed!“ |
| `uv run --frozen ruff format --check` | „50 files already formatted“ |
| `uv run --frozen mypy` | „Success: no issues found in 49 source files“ |
| `uv run --frozen python -m pipwerk_domain.documents.schemas --check <Arbeitsverzeichnis>/contracts/strategies/v1` | bestanden, keine Ausgabe |
| `uv lock --check` | bestanden |
| Suche im Diff nach `localhost`, `127.0`, `password`, `secret`, `token`, `api_key`, absoluten Pfaden des Entwicklungsrechners, `eval(`, `exec(` | keine Treffer |

`pip-audit` habe ich nicht erneut ausgeführt, weil sich keine Abhängigkeit geändert hat. Das Ergebnis aus Durchlauf 5 („No known vulnerabilities found“, Prüfskript des Testers Funktion) gilt für dieselben Abhängigkeiten.

## Nachprüfung

| Bezug | Ergebnis |
| --- | --- |
| B1 aus `01-functiontest-5.md` (Zeile zu `test_hardening_3.py` nennt die Tests mit `rule.order_in_indicator` nicht) | behoben. Die Zeile nennt jetzt die Grenze von 50 Befunden je Ausdruck mit `rule.order_in_indicator` für Regel und Regelwerk in einer Vorlage `Indikator`, je mit Gegenprobe. Das passt zu den vier Tests in `tests/test_hardening_3.py` Zeile 164, 169, 176 und 181. |
| geänderte Stelle | enthält nur beschreibenden Text: keine Zugangsdaten, Rechnernamen, Benutzernamen, Pfade oder Ports. Kein neuer Fehler aus Sicht der Sicherheit. |
| Punkt 1 der Entscheidung („weitere Änderungen macht er nicht“) | eingehalten, siehe `git diff --stat` |

## Befunde

Keine blockierenden Befunde.

## Hinweise

- H1 (aus Durchlauf 1, unverändert): Die Schachtelungstiefe zählt nur Klammern und Funktionsaufrufe. Vorzeichen und verkettete Operatoren ergeben sehr tiefe Syntaxbäume; `repr()` eines solchen Baums endet mit `RecursionError`. Die Bibliothek ruft `repr()` der Knoten selbst nicht auf.
- H6 (aus Durchlauf 1, unverändert): Wertebereiche handelsrelevanter Werte sind nicht festgelegt. Das ist eine Frage an Spezifikation oder Auftrag.
- H9 (aus Durchlauf 5, unverändert): `str()` eines `DocumentError` bei Python-Objekten mit mehrfach eingehängten Listen braucht Zeit, die mit jeder Ebene etwa verdoppelt wird. Kein Angriffsweg über Eingaben von außen. Der Commit ändert die Stelle nicht.

## Bereinigung

Bei der Prüfung sind keine Dateien entstanden. Das Arbeitsverzeichnis steht auf `93209f1fa05aee773bd644d238b3795955720239`, `git status --short` ist leer.
