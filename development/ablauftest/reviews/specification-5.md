# Prüfbericht Spezifikation, Durchlauf 5

- Vorhaben: `ablauftest`
- Phase: 2 Konzeption, Prüfung der Spezifikation
- Rolle: QA
- Übergabedokument: `development/ablauftest/reviews/specification-5-order.md`
- geprüfter Commit: `003c1d4f24c1be23f81c399229385b9f160fb773` (`main`)
- Prüfschleife: zweiter Durchlauf der Schleife, die mit der Antwort auf Frage ablauftest-02 begonnen hat (Zählung laut Übergabedokument)
- Ergebnis: **nicht bestanden**

## Gegenstand

Geprüft wurde `development/ablauftest/specification.md` gegen:

- req-ui-010 „Angaben zu pipwerk studio“ in `docs/design/requirements/anforderungen-strategiedesigner.md`, Zeilen 287–296
- `docs/design/requirements/anforderungen-gesamtsystem.md`, soweit es req-ui-010 berührt
- die Antworten in `development/ablauftest/questions/ablauftest-01.md` und `development/ablauftest/questions/ablauftest-02.md`

Schwerpunkt ist die Kontrolle der Befunde F1 und F2 aus `development/ablauftest/reviews/specification-4.md`. Dazu wurde `git diff d0b6685321deb36782dd8fddeaf1046bc7296ce5 003c1d4f24c1be23f81c399229385b9f160fb773` ausgewertet. Geändert sind in `specification.md` nur: Status (Zeile 9), E9 (Zeile 29), Abschnitt 3.1 (Zeile 49), Abschnitt 4.2 (Zeile 179) und der neue Abschnitt 4.3 (Zeilen 186–196). Außerhalb der Spezifikation kamen nur `reviews/specification-4-order.md` und `reviews/specification-4.md` hinzu. req-ui-010 ist unverändert.

Zum Abgleich herangezogen wurden `docs/technical/pipwerk-studio.md` (Abschnitte 2.6, 4, 6 und 9), `components/pipwerk-studio/backend/pyproject.toml` und `components/pipwerk-studio/.gitignore` im geprüften Commit.

Zeilenangaben beziehen sich auf den geprüften Commit.

## Zusammenfassung

F1 und F2 sind in ihrem Kern behoben. E9 sagt über die spätere Installation nichts mehr zum Arbeitsverzeichnis. Der Browsertest wird nicht mehr als Nachweis für Aussagen beansprucht, die er nicht prüft. Das Testumgebungsskript erhält einen eigenen Test (Abschnitt 4.3).

Die Änderungen haben drei neue Probleme verursacht:

- G1: E9 nennt als „einzige Bedingung“ für einen genauen Stand den Bau der Oberfläche ohne nicht committete Änderungen. Das Backend fehlt darin. req-ui-010 verlangt den Commit, „aus dem pipwerk studio läuft“.
- G2: Der Test in Abschnitt 4.3 arbeitet mit einer Kopie der Komponente als eigenem Repository. Er kann deshalb nicht erkennen, ob `testenv start` Änderungen außerhalb der Komponente übersieht, zum Beispiel an `LICENSE`. Diese Datei wird aber nach E7 in die Oberfläche gebaut.
- G3: Abschnitt 4.3 widerspricht sich beim dritten Prüffall und lässt offen, was die „Kopie der Komponente“ enthält.

## Kontrolle der Befunde aus Durchlauf 4

| Befund | Teil | Stelle in der Spezifikation | Ergebnis |
|---|---|---|---|
| F1 | Frage 1: Gilt „starten das Backend aus demselben Arbeitsverzeichnis“ auch für eine spätere Installation? | E9 (Zeile 29) | behoben. Der Satz ist entfallen. E9 sagt jetzt: „Wie sie das sicherstellt, wie sie das Backend startet und was dann die Fußzeile zeigt, legt ihre eigene Spezifikation fest“. Die Begründung verweist auf E7: Der Dialog hängt zur Laufzeit nicht vom Repository ab. Ein Widerspruch zu E7 (Zeile 27) besteht nicht mehr. |
| F1 | Frage 2: Welche Bedingung muss eine spätere Installation erfüllen? | E9 (Zeile 29) | beantwortet: E9 nennt jetzt genau eine Bedingung („Das ist die einzige Bedingung …“). Die Antwort wirft aber eine neue Frage auf, siehe G1. |
| F2 | Frage 1: Welcher Nachweis ist für „aus genau dem Commit“ gemeint? | E9 (Zeile 29), Abschnitt 4.2 (Zeile 179) | behoben. E9 teilt die Nachweise auf: Der Test in Abschnitt 4.3 weist den Abbruch bei nicht committeten Änderungen nach. Der Browsertest weist nach, dass Dialog und Fußzeile den beim Bau ausgecheckten Commit nennen. Zeile 179 sagt ausdrücklich, dass der Browsertest nicht committete Änderungen nicht prüft. |
| F2 | Frage 2: Wie wird der Abbruch von `testenv start` geprüft? | Abschnitt 3.1 (Zeile 49), Abschnitt 4.3 (Zeilen 186–196) | behoben. Der neue Test prüft geänderte versionierte Dateien, nicht ignorierte neue Dateien und ein Verzeichnis außerhalb von Git. Er prüft auch, dass vorher nichts installiert, gebaut oder gestartet wurde. Er läuft mit den Backend-Tests (`testpaths = ["tests"]` in `backend/pyproject.toml`, Zeile 32) und damit im Prüfskript (Zeile 233 mit Abschnitt 6.1 der technischen Dokumentation). Zur Aussagekraft des Tests siehe G2 und G3. |

Das Verhalten von Vite beim Neuladen der Konfiguration (Zeile 31) bleibt **ungeprüft**. Die Spezifikation kennzeichnet das selbst. Ich habe es ebenfalls nicht geprüft.

## Befunde

### G1 – E9 nennt eine Bedingung ohne das Backend

- Fundstelle:
  - req-ui-010, Zeile 292: „die vollständige Kennung des Commits, aus dem pipwerk studio läuft […] Genau sein muss die Angabe in der Testumgebung und in jeder späteren Installation.“
  - `specification.md`, Zeile 29 (E9): „Genau ist das, wenn der gebaute Code vollständig zu diesem Commit gehört, also beim Bau keine nicht committeten Änderungen vorlagen. Das ist die einzige Bedingung, die Testumgebung und Installation für den Dialog erfüllen müssen.“ Weiter: „Spätere Installation: Sie muss die Oberfläche aus einem Commit ohne nicht committete Änderungen bauen. Wie sie das sicherstellt, wie sie das Backend startet und was dann die Fußzeile zeigt, legt ihre eigene Spezifikation fest“.
  - Fassung in Durchlauf 4 (Commit `d0b6685`, E9): „Eine spätere Installation muss Oberfläche und Backend ebenso aus einem Commit ohne nicht committete Änderungen bauen“.
- Sachverhalt:
  1. pipwerk studio besteht aus Oberfläche und Backend (`docs/technical/pipwerk-studio.md`, Abschnitt 2). req-ui-010 verlangt den Commit, aus dem pipwerk studio läuft, nicht den Commit der Oberfläche.
  2. Die neue Fassung von E9 verlangt von einer späteren Installation nur noch, dass die Oberfläche aus einem sauberen Commit gebaut wird. Die Fassung aus Durchlauf 4 verlangte das auch für das Backend. Diese Forderung ist entfallen. Wie das Backend gestartet wird, überlässt E9 jetzt ausdrücklich einer späteren Spezifikation.
  3. Nach E9 wäre damit eine Installation zulässig, die die Oberfläche aus Commit A und das Backend aus Commit B ausliefert. Der Dialog nennt dann A. pipwerk studio läuft aber nicht aus A allein. Ob die Angabe dann „genau“ im Sinne von req-ui-010 ist, beantwortet die Spezifikation nicht. Sie erklärt den Fall aber durch „einzige Bedingung“ für zulässig.
  4. Für die Testumgebung tritt das Problem nicht auf: E9 legt dort fest, dass das Backend aus demselben Arbeitsverzeichnis startet.
  5. Nach Abschnitt 7 (Zeile 239) wird E9 in die technische Dokumentation übernommen. Eine spätere Spezifikation der Installation würde sich auf diese Aussage stützen.
- Fragen und Kritikpunkte:
  1. Muss in einer späteren Installation auch das Backend aus demselben Commit stammen wie die Oberfläche, damit die Angabe im Dialog nach req-ui-010 genau ist? Wenn ja, ist „einzige Bedingung“ in E9 unvollständig. Wenn nein: Woraus folgt, dass der Commit der Oberfläche „der Commit, aus dem pipwerk studio läuft“ ist?
  2. Kritikpunkt: Die Änderung hat eine Forderung an die Installation entfernt, ohne dass Befund F1 das verlangt hätte. F1 betraf die Aussage zum Arbeitsverzeichnis, nicht die Forderung an den Bau des Backends.

### G2 – Der Test des Testumgebungsskripts erkennt eine Prüfung nur innerhalb der Komponente nicht

- Fundstelle:
  - `specification.md`, Zeile 27 (E7): Der Lizenztext ist die Datei `LICENSE` im Wurzelverzeichnis des Repositorys und wird beim Bau eingebunden. „Gebaut wird sie aus dem Repository, nicht aus dem Verzeichnis der Komponente allein.“
  - `specification.md`, Zeile 29 (E9): genau, wenn „der gebaute Code vollständig zu diesem Commit gehört, also beim Bau keine nicht committeten Änderungen vorlagen“.
  - `specification.md`, Zeile 222: „Arbeitet auf dem Arbeitsverzeichnis, in dem das Skript liegt; das Verzeichnis wird aus dem Pfad des Skripts bestimmt.“
  - `specification.md`, Zeile 223: `start` prüft mit `git status --porcelain`, „dass das Arbeitsverzeichnis ein Arbeitsverzeichnis von Git ohne nicht committete Änderungen […] ist“.
  - `specification.md`, Zeile 188: Der Test ruft `testenv start` „in einer Kopie der Komponente in einem temporären Verzeichnis“ auf; „Die Kopie ist je Fall ein eigenes, frisch angelegtes Git-Repository“.
- Sachverhalt:
  1. Im Repository liegt das Skript in `components/pipwerk-studio/scripts/`. Das Arbeitsverzeichnis von Git ist das Wurzelverzeichnis des Repositorys. Die Zeilen 222 und 223 lassen offen, ob „das Arbeitsverzeichnis“ das ganze Arbeitsverzeichnis von Git oder nur das Verzeichnis der Komponente ist. `.testenv/` liegt unter `components/pipwerk-studio/` (Zeile 224), dort wird also das Verzeichnis der Komponente gemeint.
  2. Prüft das Skript nur das Verzeichnis der Komponente, übersieht es eine geänderte `LICENSE`. Diese Datei liegt außerhalb der Komponente und wird nach E7 in die Oberfläche gebaut. Der gebaute Code gehört dann nicht vollständig zum angezeigten Commit. Das ist genau der Fall, den E9 ausschließen will.
  3. Im Test ist die Kopie der Komponente selbst das Wurzelverzeichnis des Repositorys. Eine Prüfung nur der Komponente und eine Prüfung des ganzen Repositorys verhalten sich dort gleich. Der Test kann den Unterschied nicht erkennen. E9 nennt diesen Test aber als Nachweis für den Abbruch bei nicht committeten Änderungen.
- Fragen und Kritikpunkte:
  1. Welches Verzeichnis prüft `testenv start` auf nicht committete Änderungen: das ganze Arbeitsverzeichnis von Git oder nur die Komponente? Wie ist eine geänderte oder nicht committete `LICENSE` im Wurzelverzeichnis abgedeckt?
  2. Wie weist der Test nach Abschnitt 4.3 nach, dass das Skript auch Änderungen außerhalb der Komponente erkennt, die in den Bau eingehen?

### G3 – Abschnitt 4.3 widerspricht sich beim dritten Prüffall; Inhalt der Kopie offen

- Fundstelle:
  - `specification.md`, Zeile 188: „Die Kopie ist je Fall ein eigenes, frisch angelegtes Git-Repository mit einem Commit“.
  - `specification.md`, Zeile 194: Prüffall „Verzeichnis, das kein Arbeitsverzeichnis von Git ist“.
  - `specification.md`, Zeile 195: „in allen drei Fällen: […] `.testenv/` und `frontend/dist` wurden nicht angelegt“.
  - `specification.md`, Zeile 225: `start` bricht ab, „wenn dort schon eine laufende Testumgebung verzeichnet ist“.
- Sachverhalt:
  1. Nach Zeile 188 ist die Kopie in jedem Fall ein Git-Repository. Der dritte Fall in Zeile 194 verlangt dagegen ein Verzeichnis, das kein Git-Repository ist. Beide Aussagen widersprechen sich.
  2. Die Spezifikation sagt nicht, was die Kopie enthält: nur die versionierten Dateien der Komponente oder den ganzen Inhalt des Verzeichnisses. Im zweiten Fall kämen ignorierte Inhalte mit, etwa `backend/.venv/`, `frontend/node_modules/`, `frontend/dist/` oder ein vorhandenes `.testenv/`. Mit einem mitkopierten `frontend/dist` oder `.testenv/` ist die Prüfung „wurden nicht angelegt“ (Zeile 195) nicht aussagekräftig. Mit einem mitkopierten `.testenv/` einer laufenden Testumgebung bricht die Gegenprobe (Zeile 196) aus einem anderen Grund ab als erwartet (Zeile 225).
- Fragen und Kritikpunkte:
  1. Wie entsteht das Verzeichnis für den dritten Prüffall, wenn nach Zeile 188 jede Kopie ein Git-Repository ist?
  2. Was genau enthält die „Kopie der Komponente“? Ist ausgeschlossen, dass `frontend/dist` oder `.testenv/` schon vor dem Aufruf in der Kopie liegen?

## Geprüft ohne neuen Befund

| Aussage von req-ui-010 | Umsetzung in der Spezifikation |
|---|---|
| Dialog auf Anforderung des Anwenders (Zeile 289) | Abschnitt 3.6, Zeile 144; Tests Zeilen 156 und 177 |
| Name „pipwerk studio“, nicht übersetzt, Schreibweise laut Projektziel (Zeilen 289, 291) | Abschnitt 3.2, Zeilen 82 und 88; Test Zeile 157 |
| Vollständige Kennung mit Datum und Uhrzeit in Ortszeit des Browsers (Zeile 292) | E2, Abschnitt 3.3, Zeilen 106 und 109; Tests Zeilen 159 und 178 |
| Angaben in der Software enthalten, keine Internetverbindung (Zeile 292) | E1, E3, E4, Abschnitte 3.3 und 3.4; Tests Zeilen 165 und 180 |
| „unbekannt“, wenn die Angaben fehlen; keine Kennung ohne Datum (Zeile 292; ablauftest-01, Frage 2) | E4, E5, Zeile 107; Tests Zeilen 159–160 und 178 |
| Genau in der Testumgebung (Zeile 292) | E9, Abschnitt 6.1 (Zeile 223), Abschnitt 4.2 (Zeilen 173, 178, 179), Abschnitt 4.3; zum Umfang der Prüfung siehe G2 und G3 |
| Genau in jeder späteren Installation (Zeile 292) | E9; siehe G1 |
| Im Entwicklungsbetrieb Commit vom Start der Programme (Zeile 292) | Absatz „Grenze im Entwicklungsbetrieb“ (Zeilen 31–37), unverändert; Test Zeile 169 |
| Anwenderdokumentation erklärt die Abweichung und beschreibt die Testumgebung als Startweg (Zeile 292) | Abschnitt 7, Zeilen 245, 248 und 250, unverändert |
| Lizenzname und vollständiger Text im englischen Original (Zeile 293) | E7, Zeilen 84 und 92, Abschnitt 3.6; Test Zeile 162 |
| Adresse als Verweis in neuem Tab (Zeile 294) | E6, Zeile 94, Abschnitt 3.5; Tests Zeilen 163, 166 und 183 |
| Schaltfläche in der Kopfzeile rechts neben der Sprachauswahl (Zeile 296) | Zeile 144; Tests Zeilen 156 und 177 |
| Übrige Oberfläche gesperrt (Zeile 296) | E8, Zeile 90; Test Zeile 181 |
| Schließen nur mit „Schließen“ oder Escape (Zeile 296) | E8, Zeile 96; Tests Zeilen 164 und 182 |
| Übrige Texte folgen der Oberflächensprache (Zeile 296) | Zeile 90; Tests Zeilen 157 und 158 |
| Standanzeige in der Fußzeile bleibt (Zeile 296) | Zeile 13, Abschnitt 8; Tests Zeilen 168 und 184 |
| Gesamtsystem req-system-006, 008, 009, 011, 019–021, 023 | wie in Durchlauf 4; der dort unter F1 genannte Widerspruch zu req-system-006 und 008 über E7 ist behoben |

Weitere Kontrollen ohne Befund:

- Die Angaben zur Prüfung in Zeile 9 stimmen mit den tatsächlich geänderten Abschnitten überein (E9, 3.1, 4.2, neuer Abschnitt 4.3).
- Die neue Datei `backend/tests/test_testenv.py` steht in Abschnitt 3.1 (Zeile 49) und liegt unter `testpaths` der Backend-Tests.
- Zeile 179 und E9 widersprechen sich nicht mehr: Beide sagen, dass der Browsertest nicht committete Änderungen nicht prüft.
- Die Gegenprobe mit ignorierten neuen Dateien (Zeile 196) passt zu `components/pipwerk-studio/.gitignore`, Zeile 9 (`frontend/node_modules/`).
- S7 und S8 stehen unverändert in Abschnitt 9 (Zeilen 264–265).
