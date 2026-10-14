# Testbericht Sicherheitstest, Auftrag 01, Durchlauf 3

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: Tester Sicherheit
- Prüfauftrag: `development/ablauftest/wp01/tests/01-securitytest-3-order.md` auf dem Zweig `ablauftest/wp01`
- geprüfter Commit: `ed5bab216fc29eea9bc954c5399e3f5aafaf3fe3` (Zweig `ablauftest/wp01-01`)
- vorheriger Bericht: `01-securitytest-2.md` zu Commit `83466cd1bd2daab04d1596beca1ec296fee386c4` (bestanden, keine Befunde)
- Datum: 2026-10-14

## Ergebnis

**bestanden**

Die Änderung seit `83466cd1bd2daab04d1596beca1ec296fee386c4` verursacht keine neuen Befunde. Die Ergebnisse aus Durchlauf 2 gelten auch für diesen Commit, weil Skript, Backend und Dokumentation unverändert sind.

## Prüfgrundlagen

- Auftrag `development/ablauftest/wp01/orders/01.md`
- Prüfauftrag Durchlauf 1 `development/ablauftest/wp01/tests/01-securitytest-1-order.md` (gilt weiter)
- `docs/technical/development-test-security-rules.md` (Stand des geprüften Commits)
- BSI IT-Grundschutz CON.8 und APP.7, OWASP ASVS

## Kontrolle des Commits

- `git rev-parse HEAD` im Arbeitsverzeichnis ergab `ed5bab216fc29eea9bc954c5399e3f5aafaf3fe3`.
- `git log --oneline 83466cd…ed5bab2` nennt genau einen Commit: `ed5bab2 ablauftest/wp01-01: Befund F3 behoben`.
- `git diff --stat 83466cd…ed5bab2` nennt genau eine Datei: `components/pipwerk-studio/backend/tests/test_testenv.py` (11 Zeilen eingefügt, 3 entfernt). Die Angabe des Entwicklers stimmt.

## Durchgeführte Prüfungen und Nachweise

| Nr. | Prüfung | Ergebnis |
|---|---|---|
| P1 | `uv sync --frozen`, danach `pytest -q` im Backend | 145 Tests bestanden |
| P2 | `pytest -q -rs tests/test_testenv.py` | 29 bestanden, keiner übersprungen |
| P3 | `ruff check .` (Regelsatz mit `S`) | keine Meldung |
| P4 | `ruff format --check .` | 15 Dateien formatiert |
| P5 | `mypy` (strict) | keine Meldung in 15 Dateien |
| P6 | `shellcheck` | nicht ausgeführt: auf dem Prüfrechner nicht installiert (`which shellcheck` Exitcode 1). Das Skript ist seit Durchlauf 2 unverändert. |
| P7 | Durchsicht des Diffs von `test_testenv.py` | siehe Bewertung |
| P8 | Durchsicht des Diffs auf Zugangsdaten, Schlüssel, Rechner- und Benutzernamen, Pfade des Entwicklungsrechners | keine Treffer |

Die Live-Aufrufe von `testenv` aus Durchlauf 2 (P7 bis P10 dort) habe ich nicht wiederholt: `scripts/testenv`, das Backend, `vite.config.ts` und die Dokumentation sind gegenüber dem dort geprüften Commit unverändert (Diff-Statistik oben).

## Bewertung der Änderung

Fundstelle: `components/pipwerk-studio/backend/tests/test_testenv.py`, Test `test_ports_with_leading_zeros_and_the_limits_are_accepted`, Zeilen 321 bis 341.

- Der Test legt im temporären Verzeichnis des Testfalls (`replica.base`, unter `tmp_path` der Fixture `make_replica`, Zeilen 164 und 170) ein Verzeichnis `port-check` mit einem Platzhalter `python3` an (`#!/bin/sh`, `exit 0`, Rechte 0755). Dieses Verzeichnis wird nur in der Umgebung des Testfalls vorn in `PATH` gestellt. Der `PATH` des Testprozesses und anderer Testfälle bleibt unverändert. Es entstehen keine Dateien außerhalb des temporären Verzeichnisses.
- Im Skript ruft `start` `python3` nur in `port_free` (Zeilen 121 bis 136, Aufrufe Zeilen 247 und 249) und in `probe_health` (Zeilen 140 bis 153) auf. Der Platzhalter meldet beide Ports als frei. Der nächste Schritt `uv --directory … sync --frozen` trifft auf den Platzhalter `uv`, der mit Exitcode 1 endet. Damit bricht der Start ab, bevor ein Port gebunden, etwas installiert, gebaut oder gestartet wird. Der Test prüft das (genau ein Aufruf, beginnend mit `uv `). Die Ports 65535 und 1 werden also nicht tatsächlich belegt, auch nicht der privilegierte Port 1.
- Der Test enthält keine Netzzugriffe, keine Zugangsdaten und keine Pfade des Entwicklungsrechners. Der Platzhalter verwendet keine Eingaben.
- Die Abdeckung der Grenzwerte bleibt erhalten: führende Nullen (`065535`, `00001`), Obergrenze 65535 und Untergrenze 1 werden weiter als gültig angenommen. Der Test hängt nicht mehr davon ab, ob Port 65535 auf dem Prüfrechner frei ist.

## Nachprüfung der vorherigen Befunde

Durchlauf 2 hatte keine Befunde. S1 und S2 aus Durchlauf 1 bleiben behoben: Die Fundstellen in `scripts/testenv`, `docs/technical/pipwerk-studio.md` und `docs/user/pipwerk-studio.md` sind unverändert. Die Tests zu S1 (`test_port_boundaries_are_checked_before_anything_happens` und der oben bewertete Test) laufen durch (P2).

## Befunde

Keine.

## Hinweise ohne Einfluss auf das Ergebnis

- H1 bis H3 aus Durchlauf 1 bestehen unverändert; sie verlangen nach dem Prüfauftrag keine Änderung. H3: `shellcheck` fehlt weiterhin auf dem Prüfrechner (P6); diese Prüfung habe ich nicht ausgeführt.

## Arbeitsverzeichnis

Die von meinen Prüfläufen erzeugten ignorierten Dateien (`.venv`, Caches von pytest, ruff und mypy, `__pycache__`) habe ich danach mit `git clean -fdX -- components/pipwerk-studio` entfernt. Nicht versioniert sind nur meine Berichte `01-securitytest-1.md`, `01-securitytest-2.md` und dieser Bericht.

## Geltung

Dieser Bericht gilt nur für den Commit `ed5bab216fc29eea9bc954c5399e3f5aafaf3fe3`.
