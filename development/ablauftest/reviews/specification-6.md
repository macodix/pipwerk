# Prüfbericht Spezifikation, Durchlauf 6

- Vorhaben: `ablauftest`
- Phase: 2 Konzeption, Prüfung der Spezifikation
- Rolle: QA
- Übergabedokument: `development/ablauftest/reviews/specification-6-order.md`
- geprüfter Commit: `82b8a9d7c86c5fcd7d77e8b7ff075c28e72c65a7` (`main`)
- Prüfschleife: dritter Durchlauf der Schleife, die mit der Antwort auf Frage ablauftest-02 begonnen hat (Zählung laut Übergabedokument). Mit diesem Durchlauf ist die Grenze von drei Durchläufen erreicht.
- Ergebnis: **nicht bestanden**

## Gegenstand

Geprüft wurde `development/ablauftest/specification.md` gegen:

- req-ui-010 „Angaben zu pipwerk studio“ in `docs/design/requirements/anforderungen-strategiedesigner.md`, Zeilen 287–296
- `docs/design/requirements/anforderungen-gesamtsystem.md`, soweit es req-ui-010 berührt
- die Antworten in `development/ablauftest/questions/ablauftest-01.md` und `development/ablauftest/questions/ablauftest-02.md`

Schwerpunkt ist die Kontrolle der Befunde G1 bis G3 aus `development/ablauftest/reviews/specification-5.md`. Dazu wurde `git diff 003c1d4f24c1be23f81c399229385b9f160fb773 82b8a9d7c86c5fcd7d77e8b7ff075c28e72c65a7` ausgewertet. Geändert sind in `specification.md` nur: Status (Zeile 9), E9 (Zeile 29), Abschnitt 4.3 (Zeilen 188–202) und Abschnitt 6.1 (Zeile 229). Außerhalb der Spezifikation kamen nur `reviews/specification-5-order.md` und `reviews/specification-5.md` hinzu. req-ui-010 ist unverändert.

Zum Abgleich herangezogen wurden im geprüften Commit: `docs/technical/pipwerk-studio.md` (Abschnitte 2.6 und 6), `.gitignore` im Wurzelverzeichnis, `components/pipwerk-studio/.gitignore` und `components/pipwerk-studio/frontend/e2e/studio.spec.ts`.

Zeilenangaben beziehen sich auf den geprüften Commit.

## Zusammenfassung

G1, G2 und G3 sind behoben. Die Änderung in Abschnitt 4.3 hat ein neues Problem verursacht:

- H1: Der Test des Testumgebungsskripts ermittelt den Inhalt des Nachbaus jetzt mit `git ls-files` im Repository, in dem der Test läuft. Übersprungen wird er nur, wenn Git nicht installiert ist. Die Testsuite der Komponente ist aber ausdrücklich auch für einen Arbeitsbereich ohne Git ausgelegt. Für diesen Fall legt die Spezifikation das Verhalten des neuen Tests nicht fest.

## Kontrolle der Befunde aus Durchlauf 5

| Befund | Teil | Stelle in der Spezifikation | Ergebnis |
|---|---|---|---|
| G1 | Frage 1: Muss in einer späteren Installation auch das Backend aus demselben Commit stammen? | E9 (Zeile 29) | behoben. E9 nennt jetzt zwei Bedingungen: „Oberfläche und Backend stammen aus demselben Commit, und beim Bau lagen im ganzen Repository keine nicht committeten Änderungen vor“. „Testumgebung und Installation müssen beide Bedingungen erfüllen.“ Für die Installation: „Sie muss Oberfläche und Backend aus demselben Commit ohne nicht committete Änderungen bauen und ausliefern.“ Die Formulierung „einzige Bedingung“ ist entfallen. |
| G1 | Kritikpunkt 2: entfernte Forderung an das Backend | E9 (Zeile 29) | behoben. Die Forderung an das Backend steht wieder in E9. |
| G2 | Frage 1: Welches Verzeichnis prüft `testenv start`? | E9 (Zeile 29), Abschnitt 6.1 (Zeile 229) | behoben. `start` ermittelt die Wurzel mit `git rev-parse --show-toplevel` und prüft mit `git status --porcelain` „das ganze Repository einschließlich `LICENSE`“. E9 sagt dasselbe („im ganzen Repository“, „auch nicht außerhalb der Komponente (zum Beispiel an `LICENSE`, E7)“). |
| G2 | Frage 2: Nachweis für Änderungen außerhalb der Komponente | Abschnitt 4.3 (Zeilen 188–191, 197, 199) | behoben. Der Test arbeitet in einem Nachbau des Repositorys mit `LICENSE` im Wurzelverzeichnis und der Komponente darunter. Er prüft eine geänderte `LICENSE` und eine nicht ignorierte neue Datei im Wurzelverzeichnis. Eine Prüfung nur der Komponente würde diese Fälle nicht erkennen. |
| G3 | Frage 1: Verzeichnis für den Fall ohne Git | Abschnitt 4.3 (Zeile 191, 200) | behoben. „Im Fall ohne Git wird derselbe Inhalt ohne `git init` angelegt.“ Der Widerspruch zu „jede Kopie ist ein Git-Repository“ besteht nicht mehr. |
| G3 | Frage 2: Inhalt der Kopie; `frontend/dist` oder `.testenv/` vorab vorhanden? | Abschnitt 4.3 (Zeile 190) | behoben. Inhalt sind genau die versionierten Dateien `LICENSE` und `components/pipwerk-studio/**`. Ignorierte Inhalte werden nicht übernommen. Vor jedem Aufruf stellt der Test fest, dass `.testenv/` und `frontend/dist/` nicht vorhanden sind. |

Das Verhalten von Vite beim Neuladen der Konfiguration (Zeile 31) bleibt **ungeprüft**. Die Spezifikation kennzeichnet das selbst. Ich habe es ebenfalls nicht geprüft.

## Befunde

### H1 – Test des Testumgebungsskripts in einem Arbeitsbereich ohne Git nicht festgelegt

- Fundstelle:
  - `specification.md`, Zeile 190: Inhalt des Nachbaus sind die versionierten Dateien `LICENSE` und `components/pipwerk-studio/**`, „ermittelt mit `git ls-files` im Repository, in dem der Test läuft“.
  - `specification.md`, Zeile 192: „Ohne installiertes Git wird der Test mit Begründung übersprungen.“
  - `specification.md`, Zeile 188: Der Test läuft mit den übrigen Backend-Tests und damit auch im Prüfskript.
  - `specification.md`, Zeile 178 (Browsertest): „Ohne Git-Arbeitsbereich „unbekannt“ (übersprungen, wenn der Arbeitsbereich ein Git-Arbeitsbereich ist, wie beim bestehenden Test der Fußzeile)“.
  - `specification.md`, Zeile 25 (E5): „Ein Bau ohne Git, zum Beispiel aus einem entpackten Archiv des Repositorys, bleibt möglich“.
  - `docs/technical/pipwerk-studio.md`, Zeile 291, und `components/pipwerk-studio/frontend/e2e/studio.spec.ts`, Zeile 194: Der bestehende Browsertest hat einen eigenen Fall für einen Arbeitsbereich ohne Git und überspringt ihn nur im Git-Arbeitsbereich.
- Sachverhalt:
  1. Die Spezifikation und der bestehende Stand sehen vor, dass die Tests der Komponente auch in einem Arbeitsbereich ohne Git laufen, etwa aus einem entpackten Archiv. Git kann dabei installiert sein.
  2. Der neue Test braucht für den Nachbau `git ls-files` im Repository, in dem er läuft. In einem Arbeitsbereich ohne Git liefert dieser Aufruf keine Dateiliste. Übersprungen wird der Test nach Zeile 192 nur, wenn Git nicht installiert ist.
  3. Was der Test dann tut, legt die Spezifikation nicht fest: scheitern, überspringen oder den Inhalt auf anderem Weg ermitteln. Scheitert er, endet nach Zeile 188 auch das Prüfskript mit Fehler, obwohl die Komponente selbst fehlerfrei ist.
  4. Das Problem ist mit der Änderung für G2 und G3 entstanden. In Durchlauf 5 hing der Inhalt der Kopie nicht ausdrücklich von `git ls-files` ab.
- Fragen und Kritikpunkte:
  1. Wie verhält sich der Test nach Abschnitt 4.3, wenn Git installiert ist, der Arbeitsbereich, in dem der Test läuft, aber kein Git-Arbeitsbereich ist?
  2. Kritikpunkt: Die Bedingung zum Überspringen in Zeile 192 deckt nur einen der beiden Fälle ab, in denen `git ls-files` keine Dateiliste liefern kann. Für den anderen Fall fehlt eine Festlegung, obwohl die Spezifikation diesen Fall an anderer Stelle (Zeile 178, E5) ausdrücklich vorsieht.

## Geprüft ohne neuen Befund

| Aussage von req-ui-010 | Umsetzung in der Spezifikation |
|---|---|
| Dialog auf Anforderung des Anwenders (Zeile 289) | Abschnitt 3.6, Zeile 144; Tests Zeilen 156 und 177 |
| Name „pipwerk studio“, nicht übersetzt, Schreibweise laut Projektziel (Zeilen 289, 291) | Abschnitt 3.2, Zeilen 82 und 88; Test Zeile 157 |
| Vollständige Kennung mit Datum und Uhrzeit in Ortszeit des Browsers (Zeile 292) | E2, Abschnitt 3.3, Zeilen 106 und 109; Tests Zeilen 159 und 178 |
| Angaben in der Software enthalten, keine Internetverbindung (Zeile 292) | E1, E3, E4, Abschnitte 3.3 und 3.4; Tests Zeilen 165 und 180 |
| „unbekannt“, wenn die Angaben fehlen; keine Kennung ohne Datum (Zeile 292; ablauftest-01, Frage 2) | E4, E5, Zeile 107; Tests Zeilen 159–160 und 178 |
| Genau in der Testumgebung (Zeile 292) | E9 (Zeile 29), Abschnitt 6.1 (Zeile 229), Abschnitt 4.2 (Zeilen 173, 178, 179), Abschnitt 4.3; zum Test in Abschnitt 4.3 siehe H1 |
| Genau in jeder späteren Installation (Zeile 292) | E9 (Zeile 29): Oberfläche und Backend aus demselben Commit ohne nicht committete Änderungen |
| Im Entwicklungsbetrieb Commit vom Start der Programme (Zeile 292) | Absatz „Grenze im Entwicklungsbetrieb“ (Zeilen 31–37), unverändert; Test Zeile 169 |
| Anwenderdokumentation erklärt die Abweichung und beschreibt die Testumgebung als Startweg (Zeile 292) | Abschnitt 7, Zeilen 251, 254 und 256, unverändert |
| Lizenzname und vollständiger Text im englischen Original (Zeile 293) | E7, Zeilen 84 und 92, Abschnitt 3.6; Test Zeile 162 |
| Adresse als Verweis in neuem Tab (Zeile 294) | E6, Zeile 94, Abschnitt 3.5; Tests Zeilen 163, 166 und 183 |
| Schaltfläche in der Kopfzeile rechts neben der Sprachauswahl (Zeile 296) | Zeile 144; Tests Zeilen 156 und 177 |
| Übrige Oberfläche gesperrt (Zeile 296) | E8, Zeile 90; Test Zeile 181 |
| Schließen nur mit „Schließen“ oder Escape (Zeile 296) | E8, Zeile 96; Tests Zeilen 164 und 182 |
| Übrige Texte folgen der Oberflächensprache (Zeile 296) | Zeile 90; Tests Zeilen 157 und 158 |
| Standanzeige in der Fußzeile bleibt (Zeile 296) | Zeile 13, Abschnitt 8; Tests Zeilen 168 und 184 |
| Gesamtsystem req-system-006, 008, 009, 011, 019–021, 023 | wie in Durchlauf 5; durch die Änderungen nicht berührt |

Weitere Kontrollen ohne Befund:

- Die Angaben zur Prüfung in Zeile 9 stimmen mit den tatsächlich geänderten Abschnitten überein (E9, 4.3, 6.1).
- E9 und Abschnitt 6.1 widersprechen sich nicht: Beide verlangen die Prüfung des ganzen Repositorys vor jedem Installieren, Bauen oder Starten.
- Die Begründung von E9 („Der Dialog hängt nur von der gebauten Oberfläche ab […], nicht vom Backend“) widerspricht der neuen Bedingung für das Backend nicht. Sie betrifft die Herkunft des angezeigten Werts, die Bedingung betrifft die Genauigkeit gegenüber dem laufenden pipwerk studio.
- Abschnitt 7 (Zeile 245) zur technischen Dokumentation passt zu E9: Installation und Paketierung bleiben dort nicht festgelegt.
- Der Nachbau enthält das `.gitignore` des Wurzelverzeichnisses nicht. Es schließt im geprüften Commit nur `.claude/` aus (`.gitignore`, Zeile 3). Die Gegenprobe in Zeile 202 nutzt einen Ausschluss aus `components/pipwerk-studio/.gitignore` (Zeile 9, `frontend/node_modules/`), der im Nachbau enthalten ist. Daraus entsteht kein Unterschied für die geprüften Fälle.
- Die fünf Abbruchfälle und die Gegenprobe in Abschnitt 4.3 (Zeilen 196–202) decken alle Abbruchgründe ab, die Zeile 229 nennt.
- S7 und S8 stehen unverändert in Abschnitt 9 (Zeilen 270–271).

## Hinweis zur Prüfschleife

Dies ist nach Übergabedokument der dritte Durchlauf der laufenden Prüfschleife. Mit dem Ergebnis „nicht bestanden“ ist die Grenze von drei Durchläufen erreicht. Nach dem Entwicklungsverfahren entscheidet der Softwarearchitekt über die Weitergabe eine Ebene höher. Diese Entscheidung liegt nicht bei der QA.
