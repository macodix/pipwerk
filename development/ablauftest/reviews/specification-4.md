# Prüfbericht Spezifikation, Durchlauf 4

- Vorhaben: `ablauftest`
- Phase: 2 Konzeption, Prüfung der Spezifikation
- Rolle: QA
- Übergabedokument: `development/ablauftest/reviews/specification-4-order.md`
- geprüfter Commit: `d0b6685321deb36782dd8fddeaf1046bc7296ce5` (`main`)
- Ergebnis: **nicht bestanden**

## Gegenstand

Geprüft wurde `development/ablauftest/specification.md` gegen:

- req-ui-010 „Angaben zu pipwerk studio“ in `docs/design/requirements/anforderungen-strategiedesigner.md`, Zeilen 287–296, in der Fassung nach der Antwort auf Frage ablauftest-02
- `docs/design/requirements/anforderungen-gesamtsystem.md`, soweit es req-ui-010 berührt
- die Antworten in `development/ablauftest/questions/ablauftest-01.md` und `development/ablauftest/questions/ablauftest-02.md`

Schwerpunkt ist die Kontrolle der Befunde D1 bis D3 aus `development/ablauftest/reviews/specification-3.md`. Dazu wurden die Änderungen zwischen dem in Durchlauf 3 geprüften Commit `78318ff4944be82596e77a3a2ce1a8390123f234` und dem geprüften Commit verglichen (`git diff`). Geändert sind in `specification.md` nur: Status (Zeilen 8–9), E9 (Zeile 29), Absatz „Grenze im Entwicklungsbetrieb“ (Zeilen 31–37), Abschnitt 3.1 (Zeilen 49, 56, 58), Abschnitt 4.1 (Zeile 168), Abschnitt 4.2 (Zeilen 172, 177, 178), Abschnitt 6.1 (Zeile 210), Abschnitt 7 (Zeilen 226, 232, 235, 237) und Abschnitt 9 (Zeile 247). In req-ui-010 ist Zeile 292 um die Sätze zu Testumgebung, Installation und Entwicklungsbetrieb ergänzt.

Zum Abgleich herangezogen wurden `docs/technical/pipwerk-studio.md`, `docs/user/pipwerk-studio.md`, `docs/technical/entwicklungsverfahren.md` sowie `components/pipwerk-studio/.gitignore`, `frontend/playwright.config.ts`, `frontend/vite.config.ts`, `frontend/package.json`, `frontend/tsconfig.json`, `frontend/e2e/studio.spec.ts` und `frontend/e2e/start-backend.mjs` im geprüften Commit.

Zeilenangaben beziehen sich auf den geprüften Commit.

## Zusammenfassung

D1, D2 und D3 sind behoben. Die Spezifikation setzt die neue Fassung von req-ui-010 um: genauer Stand in der Testumgebung, Commit vom Start im Entwicklungsbetrieb, Erklärung der Abweichung und Beschreibung der Testumgebung in der Anwenderdokumentation.

Die Änderungen haben zwei neue Probleme verursacht:

- F1: E9 sagt über jede spätere Installation, sie starte das Backend „aus demselben Arbeitsverzeichnis“. E7 sagt, installiert und gestartet werde ohne Zugriff auf das Repository. Beide Aussagen widersprechen sich.
- F2: E9 schreibt dem Browsertest einen Nachweis zu, den er nicht erbringt. Die Genauigkeit in der Testumgebung beruht allein auf der Prüfung im Testumgebungsskript. Für diese Prüfung sieht die Spezifikation keinen Test vor.

## Kontrolle der Befunde aus Durchlauf 3

| Befund | Teil | Stelle in der Spezifikation | Ergebnis |
|---|---|---|---|
| D1 | Frage 1: Welcher Startweg ist die „bereitgestellte Software“? | E9 (Zeile 29), req-ui-010 Zeile 292 | behoben. Der Auftraggeber hat entschieden (ablauftest-02, Zeile 27). E9 übernimmt die Entscheidung wörtlich: genau in Testumgebung und Installation. |
| D1 | Frage 2: Vorlage in Abschnitt 9 unvollständig | Abschnitt 9 (Zeile 247) | behoben. Die Vorlage ist durch die Entscheidung erledigt. Abschnitt 9 verweist auf die Antwort. |
| D1 | Frage 3: Testumgebung in der Anwenderdokumentation | Abschnitt 7 (Zeilen 232, 235, 237) | behoben. Die Anwenderdokumentation beschreibt die Testumgebung als Startweg mit Start, Abfrage, Ende, Abbruch bei nicht committeten Änderungen und Adresse. Das Glossar nennt Testumgebung, Testumgebungsskript, Entwicklungsbetrieb, Port und nicht committete Änderung. Der bisherige Satz in `docs/user/pipwerk-studio.md`, Zeile 17, wird ersetzt. |
| D1 | Frage 4: Widerspruch zu `docs/technical/pipwerk-studio.md`, Zeile 346 | Abschnitt 7 (Zeile 226) | behoben. Der Punkt wird ersetzt. |
| D1 | „keine Bereitstellung“ im Absatz zur Grenze | Zeile 31 | behoben. Der Absatz folgt jetzt dem Wortlaut von req-ui-010. |
| D2 | Browsertest gegen den Entwicklungsserver | Abschnitt 4.2 (Zeile 172), Abschnitt 3.1 (Zeilen 49, 58) | behoben. Der Browsertest baut die Oberfläche und liefert sie mit `vite preview` aus, wie das Testumgebungsskript (Zeile 211). `playwright.config.ts` steht in Abschnitt 3.1. Die heutige Konfiguration (`playwright.config.ts`, Zeile 36: `npx vite`) wird damit ausdrücklich geändert. `preview.proxy` ist in `vite.config.ts` bereits gesetzt, die Weiterleitung von `/api` funktioniert also auch mit `vite preview`. |
| D2 | Weg des Stands in die gebaute Oberfläche ungeprüft | Zeile 177, Zeile 168, Abschnitt 3.1 (Zeile 56) | behoben. Der Browsertest prüft den Stand an der gebauten Oberfläche. Der neue Test `buildinfo/viteConfig.test.ts` prüft das Einsetzen für Bau und Entwicklungsserver. Er liegt unter `buildinfo/` und fällt damit unter die Include-Liste aus Zeile 151. |
| D2 | Kennung im Dialog gleich Tooltip | Zeile 178 | behoben. Die Aussage bezieht sich jetzt auf die gebaute Oberfläche. Zur Aussage in E9 über diesen Nachweis siehe F2. |
| D3 | Dritter Punkt der Grenze missverständlich | Zeile 35, Zeile 235 | behoben. Zeile 35 sagt jetzt, dass die Abweichung bei nicht committeten Änderungen nach dem Neustart bestehen bleibt. Zeile 235 verlangt genau das in der Anwenderdokumentation. |

Das Verhalten von Vite beim Neuladen der Konfiguration ist weiterhin **ungeprüft**. Die Spezifikation kennzeichnet das jetzt selbst (Zeile 31). Vite ist unter dem Entwicklungsverzeichnis weder in einem Arbeitsverzeichnis noch in einer Testumgebung installiert (Suche nach `components/pipwerk-studio/frontend/node_modules/vite` ohne Treffer). Ich konnte es deshalb ebenfalls nicht prüfen.

## Befunde

### F1 – E9 und E7 widersprechen sich bei der späteren Installation

- Fundstelle:
  - `specification.md`, Zeile 29 (E9): „Genau ist der Stand nach req-ui-010 in der Testumgebung und in jeder späteren Installation. Beide liefern eine gebaute Oberfläche aus, in die der Stand beim Bau geschrieben wurde (E3), und starten das Backend aus demselben Arbeitsverzeichnis.“ Am Ende von E9: „Eine spätere Installation muss Oberfläche und Backend ebenso aus einem Commit ohne nicht committete Änderungen bauen; ihre Spezifikation ist nicht Gegenstand dieses Vorhabens.“
  - `specification.md`, Zeile 27 (E7): „Die gebaute Oberfläche enthält den Text selbst; installiert und gestartet wird sie ohne Zugriff auf das Repository (req-system-006, req-system-008).“
  - `docs/technical/pipwerk-studio.md`, Zeile 135: Das Backend ermittelt den Stand zur Laufzeit mit `git -C <Verzeichnis des Pakets pipwerk_studio> rev-parse HEAD`.
- Sachverhalt:
  1. E9 stellt als Tatsache fest, dass eine spätere Installation das Backend aus demselben Arbeitsverzeichnis startet. Ein Arbeitsverzeichnis ist hier ein Arbeitsverzeichnis von Git. E7 sagt dagegen, installiert und gestartet werde ohne Zugriff auf das Repository.
  2. Dieselbe Entscheidung E9 sagt zugleich, die Installation sei nicht Gegenstand des Vorhabens. Die Aussage über das Arbeitsverzeichnis ist also eine Festlegung über etwas, das die Spezifikation nach eigener Aussage nicht spezifiziert.
  3. Startet eine Installation das Backend nicht aus einem Arbeitsverzeichnis von Git, findet das Backend nach Zeile 135 der technischen Dokumentation keinen Stand. Die Fußzeile zeigt dann „unbekannt“, der Dialog den beim Bau geschriebenen Commit. Die Begründung in E9 („Damit laufen Oberfläche und Backend aus genau dem Commit, den Dialog und Fußzeile nennen“) trifft für die Installation dann nicht zu.
  4. Nach Zeile 226 wird E9 in die technische Dokumentation übernommen. Der Widerspruch ginge damit in die Dokumentation der Komponente über.
- Fragen und Kritikpunkte:
  1. Gilt „starten das Backend aus demselben Arbeitsverzeichnis“ auch für eine spätere Installation? Wenn ja, wie verträgt sich das mit E7 („ohne Zugriff auf das Repository“)?
  2. Welche Bedingung muss eine spätere Installation nach E9 erfüllen, damit der Dialog genau ist? Bisher nennt E9 zwei verschiedene Bedingungen: das Arbeitsverzeichnis im zweiten Satz und den Bau aus einem Commit ohne nicht committete Änderungen im letzten Satz.

### F2 – E9 schreibt dem Browsertest einen Nachweis zu; die Prüfung im Testumgebungsskript ist ungetestet

- Fundstelle:
  - `specification.md`, Zeile 29 (E9): „Es startet nur aus einem Arbeitsverzeichnis von Git ohne nicht committete Änderungen, baut dort die Oberfläche und startet das Backend. Damit laufen Oberfläche und Backend aus genau dem Commit, den Dialog und Fußzeile nennen. Der Browsertest prüft das an der gebauten Oberfläche […].“ Begründung: „Die Prüfung auf nicht committete Änderungen schließt den einzigen Fall aus, in dem der gebaute Code zu keinem Commit gehört.“
  - `specification.md`, Zeile 210 (Prüfung mit `git status --porcelain` in `testenv start`)
  - `specification.md`, Abschnitt 4 (Zeilen 145–183): kein Test des Testumgebungsskripts
  - `specification.md`, Zeile 220: Das Prüfskript führt die Prüfungen aus Abschnitt 6.1 bis 6.3 der technischen Dokumentation aus.
  - `specification.md`, Zeile 172: Der Browsertest baut im `webServer` mit `vite build` aus dem Arbeitsverzeichnis, in dem er läuft.
- Sachverhalt:
  1. Der Browsertest prüft nicht, ob das Arbeitsverzeichnis nicht committete Änderungen hat. Er baut auch dann. Dialog und Tooltip nennen dann `git rev-parse HEAD`, der Test besteht, aber die gebaute Oberfläche enthält Code, der zu keinem Commit gehört. Der Browsertest weist also nach, dass Dialog, Fußzeile und `HEAD` übereinstimmen. Er weist nicht nach, dass Oberfläche und Backend „aus genau dem Commit“ laufen. E9 sagt aber, der Browsertest prüfe „das“, und bezieht sich damit auf den Satz davor.
  2. Dass der Stand in der Testumgebung genau ist, beruht nach der Begründung von E9 allein auf der Prüfung in Zeile 210. Abschnitt 4 nennt für das Testumgebungsskript keinen Test: weder den Abbruch bei geänderten Dateien noch bei nicht ignorierten neuen Dateien noch außerhalb eines Arbeitsverzeichnisses von Git noch, dass vor dem Abbruch nichts installiert, gebaut oder gestartet wurde. Das Prüfskript (Zeile 220) umfasst nur die Prüfungen aus Abschnitt 6.1 bis 6.3 der technischen Dokumentation. Das Testumgebungsskript gehört nach Zeile 226 nicht zu diesen Abschnitten, sondern zu einem neuen Abschnitt „Start als Testumgebung“.
  3. Für alle übrigen Aussagen von req-ui-010 legt Abschnitt 4 Tests fest („Geprüft wird mindestens“, Zeile 153). Für die Bedingung, von der die Genauigkeit in der Testumgebung abhängt, fehlt diese Festlegung.
- Fragen und Kritikpunkte:
  1. Welcher Nachweis ist für die Aussage in E9 gemeint, dass Oberfläche und Backend in der Testumgebung aus genau dem Commit laufen, den Dialog und Fußzeile nennen? Der Browsertest erbringt ihn nach Sachverhalt 1 nicht.
  2. Wie wird geprüft, dass `testenv start` bei nicht committeten Änderungen, bei nicht ignorierten neuen Dateien und außerhalb eines Arbeitsverzeichnisses von Git abbricht, bevor etwas installiert, gebaut oder gestartet wird?

## Geprüft ohne neuen Befund

| Aussage von req-ui-010 | Umsetzung in der Spezifikation |
|---|---|
| Dialog auf Anforderung des Anwenders (Zeile 289) | Abschnitt 3.6, Zeile 143; Tests Zeilen 155 und 176 |
| Name „pipwerk studio“, nicht übersetzt, Schreibweise laut Projektziel (Zeilen 289, 291) | Abschnitt 3.2, Zeilen 81 und 87; Test Zeile 156 |
| Vollständige Kennung mit Datum und Uhrzeit in Ortszeit des Browsers (Zeile 292) | E2, Abschnitt 3.3, Zeilen 105 und 108; Tests Zeilen 158 und 177 |
| Angaben in der Software enthalten, keine Internetverbindung (Zeile 292) | E1, E3, E4, Abschnitte 3.3 und 3.4; Tests Zeilen 164 und 179 |
| „unbekannt“, wenn die Angaben fehlen; keine Kennung ohne Datum (Zeile 292; ablauftest-01, Frage 2) | E4, E5, Zeile 106; Tests Zeilen 158–159 und 177 |
| Genau in der Testumgebung (Zeile 292, neu) | E9, Abschnitt 6.1 (Zeile 210), Abschnitt 4.2 (Zeilen 172, 177, 178); zum Nachweis siehe F2 |
| Genau in jeder späteren Installation (Zeile 292, neu) | E9; siehe F1 |
| Im Entwicklungsbetrieb Commit vom Start der Programme (Zeile 292, neu) | Absatz „Grenze im Entwicklungsbetrieb“ (Zeilen 31–37); Test Zeile 168. Dass ein selbsttätiger Neustart des Entwicklungsservers als Start gilt (Zeile 31), wird in der Anwenderdokumentation mit dem ersten Punkt der Grenze (Zeile 33) erklärt. |
| Anwenderdokumentation erklärt die Abweichung und beschreibt die Testumgebung als Startweg (Zeile 292, neu) | Abschnitt 7, Zeilen 232, 235 und 237 |
| Lizenzname und vollständiger Text im englischen Original (Zeile 293) | E7, Zeilen 83 und 91, Abschnitt 3.6; Test Zeile 161 |
| Adresse als Verweis in neuem Tab (Zeile 294) | E6, Zeile 93, Abschnitt 3.5; Tests Zeilen 162, 165 und 182 |
| Schaltfläche in der Kopfzeile rechts neben der Sprachauswahl (Zeile 296) | Zeile 143; Tests Zeilen 155 und 176 |
| Übrige Oberfläche gesperrt (Zeile 296) | E8, Zeile 89; Test Zeile 180 |
| Schließen nur mit „Schließen“ oder Escape (Zeile 296) | E8, Zeile 95; Tests Zeilen 163 und 181 |
| Übrige Texte folgen der Oberflächensprache (Zeile 296) | Zeile 89; Tests Zeilen 156 und 157 |
| Standanzeige in der Fußzeile bleibt (Zeile 296) | Zeile 13, Abschnitt 8; Tests Zeilen 167 und 183 |
| Gesamtsystem req-system-006, 008, 009, 011, 019–021, 023 | wie in Durchlauf 3; zu req-system-006 und 008 siehe F1 |

Weitere Kontrollen ohne Befund:

- Der Eintrag `frontend/dist-e2e/` gehört nach Zeile 49 in `components/pipwerk-studio/.gitignore`. Dort stehen bereits `frontend/dist/` und `frontend/node_modules/` mit demselben Pfadaufbau.
- `npm run build` lautet `tsc --noEmit && vite build` (`frontend/package.json`) und legt außer `frontend/dist` keine Dateien an. `backend/.venv/` und `frontend/node_modules/` sind ignoriert. Ein zweites `testenv start` nach `stop` scheitert also nicht an Dateien, die der erste Start angelegt hat.
- Die Angaben zur Prüfung in Zeile 9 stimmen mit den tatsächlich geänderten Abschnitten überein.
- S7 und S8 stehen unverändert in Abschnitt 9 (Zeilen 251–252).

## Hinweis zum Ablauf

Nach der Antwort auf Frage ablauftest-02 ist dies laut Übergabedokument die erneute Prüfung. Die Zählung der Durchläufe dieser Prüfschleife legt das Übergabedokument nicht fest. Wird dieser Durchlauf als vierter Durchlauf der bisherigen Schleife gezählt, ist die Grenze von drei Durchläufen nach `docs/technical/entwicklungsverfahren.md` überschritten, und die Entscheidung über das weitere Vorgehen liegt beim Projektleiter.
