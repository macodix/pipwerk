# Testbericht Sicherheitstest, Auftrag 01, Durchlauf 2

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: Tester Sicherheit
- Prüfauftrag: `development/ablauftest/wp01/tests/01-securitytest-2-order.md` auf dem Zweig `ablauftest/wp01`
- geprüfter Commit: `83466cd1bd2daab04d1596beca1ec296fee386c4` (Zweig `ablauftest/wp01-01`)
- vorheriger Bericht: `01-securitytest-1.md` zu Commit `d6b354201feb1a8385819ad37946d98150edd1f6` (Befunde S1, S2)
- Datum: 2026-10-14

## Ergebnis

**bestanden**

S1 und S2 sind behoben. Die Änderungen seit `d6b354201feb1a8385819ad37946d98150edd1f6` verursachen keine neuen Befunde.

## Prüfgrundlagen

- Auftrag `development/ablauftest/wp01/orders/01.md`
- Prüfauftrag Durchlauf 1 `development/ablauftest/wp01/tests/01-securitytest-1-order.md` (gilt weiter)
- Spezifikation `development/ablauftest/specification.md`, Abschnitt 6.1
- `docs/technical/development-test-security-rules.md`, Abschnitte 8 und 9 (Stand des geprüften Commits)
- `docs/technical/pipwerk-studio.md`, Abschnitte 4a, 6.1 und 8; `docs/user/pipwerk-studio.md`, Abschnitt 2 (Stand des geprüften Commits)
- BSI IT-Grundschutz CON.8 und APP.7, OWASP ASVS (Eingabeprüfung, Konfiguration), OWASP API Security Top 10 (API8)

## Kontrolle des Commits

`git rev-parse HEAD` im Arbeitsverzeichnis ergab `83466cd1bd2daab04d1596beca1ec296fee386c4`. `git diff --stat d6b3542…83466cd` nennt vier Dateien: `components/pipwerk-studio/backend/tests/test_testenv.py` (+46), `components/pipwerk-studio/scripts/testenv` (+16/−2), `docs/technical/pipwerk-studio.md` (+4/−2), `docs/user/pipwerk-studio.md` (+1/−1).

## Durchgeführte Prüfungen und Nachweise

| Nr. | Prüfung | Ergebnis |
|---|---|---|
| P1 | `uv sync --frozen`, danach `pytest -q` im Backend | 145 Tests bestanden |
| P2 | `pytest -q -rs tests/test_testenv.py` | 29 bestanden, keiner übersprungen (vorher 17; neu 11 Fälle Grenzwerte und 1 Fall führende Nullen) |
| P3 | `ruff check .` (Regelsatz mit `S`) | keine Meldung |
| P4 | `ruff format --check .` | 15 Dateien formatiert |
| P5 | `mypy` (strict) | keine Meldung in 15 Dateien |
| P6 | `shellcheck` | nicht ausgeführt: auf dem Prüfrechner nicht installiert (`which shellcheck` ohne Treffer). Auftrag verlangt die Prüfung nur, falls vorhanden. |
| P7 | Live-Aufrufe `testenv start` mit Grenzwerten: Frontend-Port `99999999999999999999`; Backend-Port `99999999999999999999`; `000`; `0065536`; `99999`; `' 5'`; arabisch-indische Ziffern `١٢٣` | jeweils Exitcode 1 und genau die Meldung `testenv: --<parameter> must be a number between 1 and 65535`; keine Meldung `Illegal number`, kein Traceback |
| P8 | `start --frontend-port 18431 --backend-port 018431` | Exitcode 1, `--frontend-port and --backend-port must differ` (Vergleich nach Entfernen der führenden Nullen) |
| P9 | Vollständiger Start `start --frontend-port 018431 --backend-port 0018432` | `pipwerk Studio is running: http://127.0.0.1:18431/ (backend on 127.0.0.1:18432)`. `ss -ltnp`: Backend nur `127.0.0.1:18432`, Oberfläche nur `127.0.0.1:18431`. `.testenv/state` enthält `backend_port=18432`, `frontend_port=18431`, `host=127.0.0.1`, nur Prozesskennungen und Ports. `.testenv/` hat Rechte `drwx--S---`. `backend.log` und `frontend.log` nennen nur die normierten Ports, keine Geheimnisse. |
| P10 | `status`, `stop`, Kontrolle | `status` nennt beide Adressen; `stop` meldet `test environment stopped`; danach kein Prozess auf 18431/18432 (`ss -ltnp`), `.testenv/` entfernt |
| P11 | Durchsicht Diff `scripts/testenv` | siehe Bewertung |
| P12 | Durchsicht Diff Dokumentation gegen Regeln 8.1, letzter Absatz, und gegen Verhalten | siehe Bewertung |
| P13 | Durchsicht Diff auf Zugangsdaten, Schlüssel, Rechner- und Benutzernamen, lokale Pfade, IP-Adressen außer Loopback und `0.0.0.0` | keine Treffer |

Die Abfragen an den Port der Oberfläche mit fremdem `Host`-Kopf (P10 aus Durchlauf 1) habe ich nicht wiederholt: Die Befehle dafür waren in dieser Prüfumgebung nicht freigegeben. `vite.config.ts` und der Start von `vite preview` sind seit `d6b3542` unverändert (Diff-Statistik oben).

Für den vollständigen Start (P9) musste das Arbeitsverzeichnis ohne nicht versionierte Dateien sein. Dafür habe ich meinen eigenen Bericht `01-securitytest-1.md` vorübergehend in das ignorierte Verzeichnis `components/pipwerk-studio/backend/.pytest_cache/` verschoben und danach unverändert zurückgelegt. Anschließend habe ich die von mir erzeugten ignorierten Dateien entfernt (`git clean -fdX -- components/pipwerk-studio`). Nicht versioniert sind danach nur `01-securitytest-1.md` und dieser Bericht.

## Nachprüfung der vorherigen Befunde

### S1 Bereichsprüfung der Ports: behoben

- Fundstelle: `components/pipwerk-studio/scripts/testenv`, `require_port`, Zeilen 97 bis 114; Übernahme des normierten Werts Zeilen 208 bis 213.
- Die Funktion lässt weiter nur ASCII-Ziffern zu (Zeile 103). Sie entfernt dann führende Nullen (Zeilen 105 bis 107) und weist leere Werte (also `0`, `000`) und Werte mit sechs oder mehr Stellen ohne Shell-Arithmetik ab (Zeilen 108 bis 110). Erst danach vergleicht `[ … -gt 65535 ]` einen Wert mit höchstens fünf Stellen; das liegt sicher im Zahlenbereich der Shell. Eine Untergrenze ist nicht mehr nötig: Ein nicht leerer Wert ohne führende Null ist mindestens 1.
- Der normierte Wert ersetzt die Eingabe (Zeilen 209, 211). An `port_free`, `vite preview --port`, `pipwerk-studio --port`, die Statusdatei und die Meldungen geht damit nur eine ganze Zahl von 1 bis 65535 ohne führende Nullen (P9). Der Vergleich auf gleiche Ports wirkt auch bei unterschiedlicher Schreibweise (P8).
- Nachweis: P2, P7, P8, P9. Der Test deckt den Fall aus Durchlauf 1 jetzt ab (`test_port_boundaries_are_checked_before_anything_happens`, auch `9223372036854775808`, `65536`, `0`, `0000`, `-1`, gleiche Ports mit führenden Nullen; jeweils ohne `Illegal number` und `Traceback` und ohne jede Wirkung).

### S2 Risiko bei `--host` außerhalb der Loopback-Adresse: behoben

- Fundstellen: `docs/technical/pipwerk-studio.md` Zeile 251 (Abschnitt 4a) und Zeile 392 (Abschnitt 8); `docs/user/pipwerk-studio.md` Zeile 26.
- Verhalten und Parameter `--host` sind unverändert (Diff von `scripts/testenv` betrifft nur `require_port` und die Zeilen 209, 211), wie im Prüfauftrag vorgegeben.
- Die technische Dokumentation beschreibt jetzt: Erreichbarkeit aller Endpunkte unter `/api` über `<host>:<frontend-port>` bei einer Adresse außerhalb der Loopback-Adresse, das schreibende `PUT /api/studio/settings/language`, fehlende Authentisierung, dass die Bindung des Backends an `127.0.0.1` nicht schützt und `vite preview` keine Sicherheitsgrenze ist, dass im Skript keine Ersatzmaßnahme besteht und ein Schutz außerhalb des Skripts nicht eingerichtet ist, sowie die Einschränkung auf ein vertrauenswürdiges Netz. Der Grund für die fehlende Authentisierung steht im letzten Satz von Abschnitt 8 (nicht Bestandteil von AP1), der Parameter selbst ist von Spezifikation Abschnitt 6.1 vorgegeben. Damit sind Grund, Risiko und Ersatzmaßnahme nach Regeln Abschnitt 8.1, letzter Absatz, dokumentiert.
- Die Anwenderdokumentation warnt an der Stelle, die `--host` nennt, verständlich vor der Erreichbarkeit ohne Anmeldung und vor der Änderbarkeit der Einstellungen.
- Die Aussagen stimmen mit dem Verhalten überein: Standard `127.0.0.1` (Zeile 191, P9), Backend fest an `127.0.0.1` (Zeile 271), Weiterleitung `/api` (Zeile 278 und `vite.config.ts`, unverändert). Kein Widerspruch zu Abschnitt 4a Zeile 229 und zu Abschnitt 8.

## Bewertung der Änderungen ohne Befund

- `scripts/testenv`: Die neue Variable `PORT_VALUE` wird nur in `require_port` gesetzt und gleich danach übernommen. Alle Verwendungen sind in Anführungszeichen. Die Schleife zum Entfernen der Nullen arbeitet nur mit Parametererweiterung, ohne Arithmetik und ohne Auswertung durch eine zweite Shell. Sie endet, weil jeder Durchlauf ein Zeichen entfernt. Das Muster `??????*` ist POSIX. Die Reihenfolge bleibt erhalten: Parameterprüfung vor Git-Prüfung, Installation, Bau und Start.
- `tests/test_testenv.py`: Die neuen Tests laufen im temporären Nachbau mit Platzhaltern für `uv`, `npm`, `npx` und freien Ports wie die bisherigen; keine Netzzugriffe nach außen, keine Zugangsdaten, keine Seiteneffekte außerhalb des temporären Verzeichnisses. Der Test für führende Nullen prüft, dass nur das erste Platzhalterprogramm erreicht wird.
- Dokumentation: Keine Zugangsdaten, Rechner- oder Benutzernamen, keine Pfade des Entwicklungsrechners.

## Befunde

Keine.

## Hinweise ohne Einfluss auf das Ergebnis

- H1 bis H3 aus Durchlauf 1 bestehen unverändert; sie verlangen nach dem Prüfauftrag keine Änderung. H3: `shellcheck` fehlt weiterhin auf dem Prüfrechner (P6); diese Prüfung ist durch mich nicht erfolgt.

## Geltung

Dieser Bericht gilt nur für den Commit `83466cd1bd2daab04d1596beca1ec296fee386c4`.
