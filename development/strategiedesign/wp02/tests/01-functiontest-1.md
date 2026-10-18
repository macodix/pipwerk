# Testbericht Funktion – Auftrag 01, Durchlauf 1

- Bezug: `strategiedesign/wp02`, Prüfauftrag `development/strategiedesign/wp02/tests/01-1-order.md`
- geprüfter Commit: `f22b0a98f3ef22d649fd1dc85bdeb2f91436a3b4` (Zweig `strategiedesign/wp02-01`, aufgesetzt auf `b158eae2636f3f210e11fb2bcbfa27d3cfcd80fa`)
- Commit des Prüfskripts: `f22b0a98f3ef22d649fd1dc85bdeb2f91436a3b4` – `components/pipwerk-studio/scripts/check` unverändert. Es deckt alle Prüfungen aus Abnahmekriterium 1 und 2 ab (Bibliothek, Backend, Schreibweise, `npm ci`, Typprüfung, Vitest, Build, Browsertest in drei Browsern). Eine Änderung war nicht nötig, deshalb gibt es keinen Zweig `strategiedesign/wp02-functiontest`.
- Durchlauf: 1 (vollständig)

## Ergebnis: nicht bestanden

Drei blockierende Befunde (B1 bis B3), sechs Hinweise (H1 bis H6).

## Ausgeführte Prüfungen

| Prüfung | Ergebnis | Nachweis |
|---|---|---|
| Ausgecheckter Commit | `f22b0a98f3ef22d649fd1dc85bdeb2f91436a3b4` | `git rev-parse HEAD` im Arbeitsverzeichnis |
| Prüfskript `check --backend-port 18431 --frontend-port 18432` (ohne `--with-audit`) | Exitcode 0, „all checks passed“ | Bibliothek pytest 985 passed; Backend pytest 679 passed; ruff, ruff format, mypy, Schemata, Schreibweise bestanden; Vitest 40 Dateien, 674 Tests bestanden; Typprüfung und Build bestanden; Playwright 63 passed, 6 skipped (die Tests „ohne Git-Arbeitsbereich“, je Browser zwei, im Git-Arbeitsbereich vorgesehen übersprungen) |
| Testkopie der Typbeschreibungen `src/testing/element-types.json` gegen `GET /api/v1/element-types` der Testumgebung (Ports 18451/18452) | gleich, bis auf den Zeilenumbruch am Dateiende | SHA-256 der ersten 49970 Byte der Datei gleich dem SHA-256 der Antwort (`81ea4523…71081`) |
| Kriterium 3 (keine Typkenntnis) | erfüllt | `src/sourceRules.test.ts` besteht; eigene Suche nach Typkennungen und Namen (`gestellt`, `Order`, `Strategie`, `Kerzenschluss`, `flow.*` u. a.) im Code außerhalb der Tests: Treffer nur Arten (`order_type`, `trigger`, `flow`), Kategorien (`rule`, `ruleset`), Kennungen von Befunden (`findings/findingText.ts:155`, `:205`) und die dokumentierte Konstante `RESULT_PROPERTY` (`expression/scope.ts:37`) |
| Kriterium 4 (Ableitung ohne Verlust) | erfüllt | `src/canvas/flowModel.test.ts:40-50` mit `str-01` und `str-03` (`toEqual` und `toBe`); `src/document/parse.test.ts` vergleicht das gelesene Dokument mit der Rohdatei |
| Kriterium 5 (kein HTML, `eval`, feste Ports) | erfüllt | `src/sourceRules.test.ts:46-67`; `i18n.ts:34` `escapeValue: false`, Texte setzt React als Text |
| Verwaltung, Rückfragen, Befundanzeige, Ausdruckseingabe (S19), unbekannter Typ (S20), Einstellungen, Zeitbegrenzung, Prüfung der Antworten | Code gelesen und gegen Auftrag geprüft; Befunde unten | `canvas/*.ts`, `state/*.ts`, `expression/*.ts`, `properties/*.tsx`, `dialogs/*.tsx`, `api/*.ts` |
| Browsertest Objektverzeichnis (Punkt 15) | vorhanden und bestanden | `e2e/designer.spec.ts:89-128`, `e2e/start-backend.mjs:32-66` |
| Bestehende Browsertests (Punkt 15) | angepasst, Nachweise erhalten | Diff von `e2e/studio.spec.ts`: alle Prüfungen bleiben, nur der Weg zur Sprachauswahl ist über die Einstellungen |
| Eigene Nachprüfung B2 | Befund bestätigt | vorübergehender Vitest-Test (nach der Prüfung entfernt): Anfragen an `indicators`, `trends`, `rules`, `rulesets` vor dem Wechsel 4, nach dem Wechsel 4 |
| Eigene Nachprüfung B1 | Befund bestätigt | Testumgebung mit `curl`, Ablauf unter B1 |

Die Testumgebung wurde danach mit `testenv stop` beendet; Objektverzeichnis und Strategien wurden vorher auf den Ausgangszustand zurückgesetzt. Das Arbeitsverzeichnis ist sauber (`git status --short` ohne Ausgabe).

## Blockierende Befunde

### B1 – Speichern einer geöffneten Strategie nach Wechsel des Objektverzeichnisses ohne Verschieben scheitert

- Grundlage: Spezifikation 4.1, letzter Satz („Eine geöffnete Strategie bleibt geöffnet und wird beim nächsten Speichern in das neue Verzeichnis geschrieben.“); Auftrag Punkt 8, Einstellungen („Eine geöffnete Strategie bleibt geöffnet (4.1)“).
- Fundstellen: `components/pipwerk-studio/frontend/src/state/useStudioController.ts:335` (eine einmal gespeicherte Strategie wird mit `PUT` gespeichert); Backend `components/pipwerk-studio/backend/src/pipwerk_studio/object_service.py:362` (`replace` verlangt, dass die Datei im aktuellen Verzeichnis besteht).
- Sachverhalt, nachgewiesen in der Testumgebung:
  1. `POST /api/v1/strategies` mit `str-03` → 201, Kennung `38fb7ef2-…`.
  2. `PUT /api/studio/settings/object-directory` mit neuem Pfad und `"move": false` → 200.
  3. `PUT /api/v1/strategies/38fb7ef2-…` mit dem gespeicherten Dokument → **404** `{"detail":"The object does not exist."}`.
  Die Oberfläche zeigt in diesem Fall „Speichern fehlgeschlagen“; die Strategie lässt sich in das neue Verzeichnis nicht speichern. Die Anwenderdokumentation `docs/user/pipwerk-studio.md:205` sagt das Gegenteil („wird beim nächsten Speichern in das neue Verzeichnis geschrieben“). Kein Vitest- oder Browsertest speichert nach einem Wechsel des Verzeichnisses.
- Zuständigkeit: Ob die Oberfläche oder das Backend die Stelle ändert, entscheidet der Softwarearchitekt (Auftrag, Nicht-Umfang dritter Punkt). Der Entwickler hat die Stelle nicht gemeldet.

### B2 – Elementbibliothek zeigt nach Wechsel des Objektverzeichnisses die gespeicherten Vorlagen des alten Verzeichnisses

- Grundlage: Auftrag Punkt 2 (gespeicherte Vorlagen aus `GET /api/v1/indicators`, `trends`, `rules`, `rulesets`) und Punkt 8, Einstellungen; Spezifikation 4.1 und 5.1.
- Fundstellen: `src/dialogs/SettingsDialog.tsx:58-61` setzt nach dem Ändern nur die Abfrage `object-directory`; die Listen der Vorlagen sind Abfragen `['objects', <art>]` in `src/state/useStudioController.ts:90-97` und werden nicht neu angefragt.
- Sachverhalt: Nachgewiesen mit einem vorübergehenden Vitest-Test über das Backend im Speicher: Verzeichnis ändern mit „Nein, nur das Verzeichnis ändern“, Dialog schließen – die Zahl der Anfragen an die vier Listen bleibt 4 (vorher 4). Die Gruppe „Gespeicherte Vorlagen“ zeigt danach Vorlagen, die im gültigen Verzeichnis nicht liegen, und verbirgt die, die dort liegen, bis die Listen aus anderem Anlass neu geladen werden (zum Beispiel beim Neuladen der Seite). Aus dem Code abgeleitet, nicht im Browser nachgeprüft: Das Einfügen eines solchen Eintrags fragt `GET /api/v1/<art>/{id}` im neuen Verzeichnis an, das nach demselben Weg wie in B1 mit 404 endet, und zeigt die Meldung „Einfügen fehlgeschlagen“.

### B3 – Technische Dokumentation nennt eine andere Wartezeit der Ausdruckseingabe als der Code

- Grundlage: Technisches Abnahmekriterium 6 („Die Dokumentation aus Punkt 16 stimmt mit dem Code überein“).
- Fundstellen: `docs/technical/pipwerk-studio.md:153` „`useLiveNames` fragt eine halbe Sekunde (`NAMES_DEBOUNCE_MS`) nach der letzten Änderung“; `src/expression/useLiveNames.ts:11` `export const NAMES_DEBOUNCE_MS = 400;`. Die Angaben des Entwicklers im Prüfauftrag nennen 400 ms.

## Hinweise (verhindern das Bestehen nicht)

### H1 – Stellen nach Auftrag Punkt 4, zweiter Absatz, warten auf die Entscheidung des Softwarearchitekten

In `docs/technical/pipwerk-studio.md`, Abschnitt 2.3 „Ableitungen aus den Typbeschreibungen“, Punkte 1 bis 6, und Abschnitt 8 dokumentiert. Zwei davon weichen vom Wortlaut der Spezifikation ab, solange die Typbeschreibung nicht ergänzt ist:

- Der Rahmen der Verwaltung hängt an einem eigenen Anschluss unten am Element (`MANAGEMENT_HANDLE`, `src/canvas/flowModel.ts:85`, `:255-270`), nicht am Ausgang `gestellt` (Spezifikation 3.3, 5.3).
- Die Ausdruckseingabe schlägt nach `Strategie.` keine Strategieparameter vor (Spezifikation 3.4, 5.3, req-ui-013); in der Anwenderdokumentation `docs/user/pipwerk-studio.md` Abschnitt 6 genannt.

Der Entwickler hat beides nach dem vorgeschriebenen Weg gemeldet. Benötigt wird die Entscheidung des Softwarearchitekten über eine Ergänzung der Typbeschreibung.

### H2 – Änderungen unter den Schlüsseln `x` und `y` lösen keine neue Anfrage der Namen aus

`src/expression/useLiveNames.ts:22-24` entfernt beim Vergleich jeden Schlüssel `x` oder `y` an jeder Stelle des Dokuments, nicht nur die Lage der Elemente. Die Belegungen sind Objekte mit dem Namen des Parameters als Schlüssel (`src/document/types.ts:19`, `parameter_values`). Ein eigener Parameter einer Instanz oder Regel mit dem Namen `x` oder `y`, belegt mit einem Ausdruck, wird beim Ändern des Ausdrucks nicht neu an `check` geschickt; unter der Eingabe stehen dann keine Namen in der Sprache.

### H3 – Anzeige sehr kleiner Prozentwerte

`src/properties/ValueInput.tsx:27-29`: `shareToPercent` setzt `String(share)` vor `e2`. Für einen gespeicherten Anteil unter 1e-6 liefert `String` die Exponentenschreibweise (zum Beispiel `1e-7`), `Number("1e-7e2")` ergibt `NaN`, das Feld zeigt „NaN“.

### H4 – Testkopie der Typbeschreibungen ohne Abgleich

`src/testing/element-types.json` ist heute gleich der Antwort des Backends (siehe Tabelle). Kein automatischer Test vergleicht sie mit der Bibliothek; ändert sich die Typbeschreibung, laufen die Vitest-Tests weiter gegen die alte Fassung.

### H5 – Browsertest zum zweiten Speichern wartet nicht auf das zweite Speichern

`e2e/designer.spec.ts:119-121`: Nach dem zweiten „Speichern“ wartet der Test auf den Text „Befunde: n“, der seit dem ersten Speichern schon sichtbar ist. Die Prüfung „ersetzt die Datei“ kann deshalb vor dem Ende des zweiten Speicherns laufen und weist das Ersetzen nicht sicher nach.

### H6 – Zahleneingabe nimmt manche Schreibweisen nicht an

`src/properties/ValueInput.tsx:19-20`: `.5` und `1e3` gelten als keine Zahl; das Feld wird markiert und nichts gespeichert. Das widerspricht keiner Festlegung, ist aber für den Anwender nicht erklärt.

## Vom Entwickler gemeldete Angaben

- Die Angaben im Prüfauftrag (Vitest 674, Browsertests 63, Bibliothek 985, Backend bestanden, Exitcode 0) stimmen mit meinem Lauf überein.
- „Keine Stellen nach Nicht-Umfang, dritter Punkt“: nicht zutreffend, siehe B1 (die Stelle liegt an der Grenze zwischen Oberfläche und Backend).
- Keine neue npm-Abhängigkeit: `package.json` und `package-lock.json` sind im Diff nicht enthalten (`git diff --stat b158eae…f22b0a9`).
