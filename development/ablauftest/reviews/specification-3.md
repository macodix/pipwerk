# Prüfbericht Spezifikation, Durchlauf 3

- Vorhaben: `ablauftest`
- Phase: 2 Konzeption, Prüfung der Spezifikation
- Rolle: QA
- Übergabedokument: `development/ablauftest/reviews/specification-3-order.md`
- geprüfter Commit: `78318ff4944be82596e77a3a2ce1a8390123f234` (`main`)
- Ergebnis: **nicht bestanden**

## Gegenstand

Geprüft wurde `development/ablauftest/specification.md` gegen:

- req-ui-010 „Angaben zu pipwerk studio“ in `docs/design/requirements/anforderungen-strategiedesigner.md`, Zeilen 287–296
- `docs/design/requirements/anforderungen-gesamtsystem.md`, soweit es req-ui-010 berührt
- die Antworten in `development/ablauftest/questions/ablauftest-01.md`

Schwerpunkt ist die Kontrolle von Befund N1 aus `development/ablauftest/reviews/specification-2.md`. Dazu wurden die Änderungen zwischen dem in Durchlauf 2 geprüften Commit `345b7b044f43a12aea5ff009aae53e78cf46a8e1` und dem geprüften Commit verglichen (`git diff`). Geändert sind in `specification.md` nur: Zeile 9 (Status), E9 (Zeile 29), Absatz „Grenze im Entwicklungsbetrieb“ (Zeilen 31–37), Browsertest (Zeile 173), Anwenderdokumentation (Zeile 228) und Abschnitt 9 (Zeilen 240–242).

Zum Abgleich herangezogen wurden `docs/technical/pipwerk-studio.md`, `docs/user/pipwerk-studio.md`, `docs/technical/entwicklungsverfahren.md` sowie `components/pipwerk-studio/frontend/playwright.config.ts` und `vite.config.ts` im geprüften Commit.

Zeilenangaben beziehen sich auf den geprüften Commit.

## Zusammenfassung

N1 ist behandelt. Die Spezifikation beschreibt jetzt nicht committete Änderungen und den Neustart des Entwicklungsservers bei Änderung seiner Konfiguration. Sie legt die Grenze im Entwicklungsbetrieb dem Auftraggeber in Abschnitt 9 zur Bestätigung vor. Das entspricht Phase 2, Schritt 5 des Entwicklungsverfahrens (`entwicklungsverfahren.md`, Zeile 88).

Die Änderung hat aber drei neue Probleme verursacht:

- D1: E9 erklärt den Entwicklungsbetrieb zu „keine Bereitstellung“. Laut Anwenderdokumentation ist er aber derzeit der einzige Weg, pipwerk studio zu starten. Die Vorlage in Abschnitt 9 nennt das nicht. Die Anwenderdokumentation bleibt dazu unvollständig.
- D2: Der Browsertest läuft gegen den Entwicklungsserver und nicht gegen die gebaute Oberfläche. Er weist damit die Gleichheit von Dialog und Fußzeile nicht für die Bereitstellung nach E9 nach. Die Spezifikation behauptet das aber.
- D3: Der dritte Punkt der Grenze ist bei nicht committeten Änderungen missverständlich.

## Kontrolle von Befund N1 aus Durchlauf 2

| Teil von N1 | Stelle in der Spezifikation | Ergebnis |
|---|---|---|
| Frage 1: Ist die Abweichung im Entwicklungsbetrieb hinnehmbar? Dem Auftraggeber vorlegen, bis dahin als offen kennzeichnen. | E9 (Zeile 29), Zeile 37, Abschnitt 9 (Zeilen 240–242), Status (Zeile 9) | behandelt. Die Grenze wird dem Auftraggeber zur Bestätigung mit der Spezifikation vorgelegt, und die Folge einer Ablehnung ist genannt (req-ui-010 ergänzen). Die Spezifikation hat den Status `draft`. Die Vorlage ist aber unvollständig, siehe D1. |
| Sachverhalt 2: nicht committete Änderungen | Zeile 31 („auch solche, die nicht committet sind“), Zeile 34 | behoben |
| Frage 2: Neustart des Entwicklungsservers bei Änderung von `vite.config.ts` oder einer davon geladenen Datei | Zeile 31, Zeile 33 („beim letzten Start des Entwicklungsservers“), Zeile 34 („voneinander abweichen“) | behoben. Die Aussage ist jetzt so gefasst, dass sie auch bei diesem Neustart zutrifft. Dass Vite sich bei Änderung der Konfiguration und der davon geladenen Dateien neu startet, ist **ungeprüft**: Vite ist weder im Arbeitsverzeichnis noch in einer Testumgebung unter dem Entwicklungsverzeichnis installiert (Suche nach `node_modules/vite` ohne Treffer). Die Spezifikation beschreibt das Verhalten so, wie ich es aus der Dokumentation von Vite kenne. |
| Browsertest (Abschnitt 4.2) | Zeile 173 | geändert. Neuer Befund D2. |
| Anwenderdokumentation (Abschnitt 7) | Zeile 228 | geändert. Die Grenze mit allen drei Punkten ist vorgegeben. Neuer Befund zu ihrer Vollständigkeit in D1. |

## Befunde

### D1 – Entwicklungsbetrieb ist laut Anwenderdokumentation der einzige Start, gilt nach E9 aber nicht als Bereitstellung

- Fundstelle:
  - `specification.md`, Zeile 29 (E9: „Bereitgestellt wird pipwerk studio derzeit nur mit dem Testumgebungsskript“), Zeile 31 („keine Bereitstellung im Sinne von E9“), Zeile 192 (Testumgebungsskript gibt es noch nicht), Zeile 228, Zeile 242
  - `docs/user/pipwerk-studio.md`, Zeile 17: „Pipwerk Studio kann derzeit nur in einer Entwicklungsumgebung gestartet werden. […] Die Schritte zum Start stehen in der technischen Dokumentation […] im Abschnitt ‚Einrichtung und Start im Entwicklungsbetrieb‘“; Zeile 19 (Adresse des Entwicklungsservers)
  - `docs/technical/pipwerk-studio.md`, Zeilen 182–209 (Start mit `npm run dev`), Zeile 213 und Zeile 346 („Installation, Paketierung und Start außerhalb der Entwicklungsumgebung sind nicht festgelegt“)
  - req-ui-010, Zeile 292: „die vollständige Kennung des Commits, aus dem pipwerk studio läuft“
- Sachverhalt:
  1. Für den Anwender beschreibt die Anwenderdokumentation genau einen Weg, pipwerk studio zu starten: den Entwicklungsbetrieb. Das Testumgebungsskript ist ein Werkzeug des Entwicklungsverfahrens (Abschnitt 6, Zeile 192). Es existiert noch nicht. Die Anwenderdokumentation nennt es nicht. Abschnitt 7 sieht auch nicht vor, es dort als Startweg aufzunehmen.
  2. Nach E9 gilt req-ui-010 im Entwicklungsbetrieb nur eingeschränkt. Ein Anwender, der pipwerk studio nach der Anwenderdokumentation startet, ist also genau in dem Fall, in dem der Dialog einen anderen Commit nennen kann als den, aus dem pipwerk studio läuft.
  3. Abschnitt 9 (Zeile 242) beschreibt dem Auftraggeber die Bereitstellung als „derzeit die Testumgebung“. Er sagt nicht, dass der Entwicklungsbetrieb derzeit der einzige dokumentierte Start für Anwender ist. Ohne diese Angabe kann der Auftraggeber nicht beurteilen, wie weit die Einschränkung reicht.
  4. Zeile 228 verlangt in der Anwenderdokumentation die Aussage, dass Dialog und Fußzeile „in der Testumgebung“ denselben Stand nennen. Die Anwenderdokumentation erklärt aber nicht, was eine Testumgebung ist und wie der Anwender sie startet. Für den Anwender wäre diese Aussage ohne Erklärung nicht verständlich. Das Glossar in Zeile 230 nennt den Begriff ebenfalls nicht.
  5. Zwischen E9 („Bereitgestellt wird […] mit dem Testumgebungsskript“) und `docs/technical/pipwerk-studio.md`, Zeile 346 („Start außerhalb der Entwicklungsumgebung […] nicht festgelegt“) entsteht ein Widerspruch. Abschnitt 7 (Zeile 220) sieht keine Anpassung dieser Stelle vor.
- Fragen und Kritikpunkte:
  1. Welcher Weg, pipwerk studio zu starten, ist für den Anwender die „bereitgestellte Software“ im Sinne von req-ui-010: der dokumentierte Start im Entwicklungsbetrieb oder die Testumgebung?
  2. Muss die Vorlage in Abschnitt 9 dem Auftraggeber sagen, dass der Entwicklungsbetrieb derzeit der einzige in der Anwenderdokumentation beschriebene Start ist? Ohne diese Angabe ist seine Bestätigung auf einer unvollständigen Grundlage.
  3. Wie erfährt der Anwender aus der Anwenderdokumentation, was eine Testumgebung ist und wie er sie startet, wenn die Dokumentation sich nach Zeile 228 auf sie bezieht?
  4. Wie werden E9 und `docs/technical/pipwerk-studio.md`, Zeile 346 miteinander in Einklang gebracht?

### D2 – Browsertest läuft gegen den Entwicklungsserver, nicht gegen die Bereitstellung nach E9

- Fundstelle:
  - `specification.md`, Zeile 29 (E9: „Der Browsertest weist die Gleichheit nach“), Zeile 173 („wenn Oberfläche und Backend wie in der Testumgebung […] gestartet sind […]. Der Browsertest startet beide so (`playwright.config.ts`, `webServer`)“), Zeile 205 (Testumgebung: `npm run build` und `vite preview`), Zeile 118, Abschnitt 3.1 (Zeilen 45–70, `playwright.config.ts` nicht genannt)
  - `components/pipwerk-studio/frontend/playwright.config.ts`, Zeile 36: `command: \`npx vite --port ${frontendPort}\``
- Sachverhalt:
  1. Der Browsertest startet die Oberfläche mit `npx vite`, also mit dem Entwicklungsserver. Die Testumgebung liefert dagegen die gebaute Oberfläche mit `vite preview` aus (Zeile 205). Die Aussage in Zeile 173, der Browsertest starte beide „wie in der Testumgebung“, trifft deshalb nicht zu.
  2. Nach Zeile 31 ist der Entwicklungsbetrieb keine Bereitstellung im Sinne von E9. Der Browsertest prüft also die Gleichheit von Dialog und Fußzeile nur im Entwicklungsbetrieb. E9 behauptet aber, er weise sie für die Bereitstellung nach.
  3. Der Weg, auf dem der Stand in die gebaute Oberfläche kommt (`npm run build` schreibt den Wert über `define` in die ausgelieferten Dateien, Zeilen 23 und 118), wird von keinem in Abschnitt 4 genannten Test geprüft. Die Frontend-Tests prüfen nur `parseBuildRevision` und `lookupGitRevision` einzeln (Zeilen 157–158).
  4. Abschnitt 3.1 nennt `playwright.config.ts` nicht als geänderte Datei. Nach dem Wortlaut der Spezifikation wird der Browsertest also nicht auf die gebaute Oberfläche umgestellt.
- Fragen und Kritikpunkte:
  1. Welcher automatische Test weist nach, dass die gebaute Oberfläche, wie sie die Testumgebung ausliefert, im Dialog denselben Commit nennt wie die Fußzeile und dass es der Commit ist, aus dem sie gebaut wurde?
  2. Ist Zeile 173 so zu verstehen, dass der Browsertest nur den Entwicklungsbetrieb prüft? Dann stimmen E9 („Der Browsertest weist die Gleichheit nach“) und Zeile 173 („wie in der Testumgebung“) nicht mit der Konfiguration des Browsertests überein.

### D3 – Dritter Punkt der Grenze bei nicht committeten Änderungen missverständlich

- Fundstelle: `specification.md`, Zeilen 33–35; Zeile 228 („mit allen drei Punkten“)
- Sachverhalt: Zeile 34 nennt nicht committete Änderungen als Ursache einer Abweichung. Zeile 35 sagt: „Nach einem Neustart beider Prozesse nennen beide wieder den aktuellen Commit.“ Im Zusammenhang liest sich das so, als sei die Abweichung nach dem Neustart behoben. Bei nicht committeten Änderungen bleibt sie aber bestehen: Dialog und Fußzeile nennen den Commit, der laufende Code weicht davon ab (Zeile 31: „läuft pipwerk studio dort nicht notwendig aus einem Commit“). Zeile 228 übernimmt die drei Punkte in die Anwenderdokumentation. Dort würde der Anwender die Aussage ebenso missverstehen können.
- Frage: Gilt Zeile 35 auch bei nicht committeten Änderungen als Ende der Abweichung? Wenn nicht, wie erfährt der Leser der Spezifikation und der Anwenderdokumentation, dass die Abweichung in diesem Fall nach dem Neustart bestehen bleibt?

## Geprüft ohne neuen Befund

Die in Durchlauf 2 ohne Befund geprüften Stellen sind unverändert (Vergleich der Commits, siehe Gegenstand). Ihre Zuordnung zu req-ui-010 und zum Gesamtsystem gilt weiter, mit verschobenen Zeilennummern:

| Aussage von req-ui-010 | Umsetzung in der Spezifikation |
|---|---|
| Dialog auf Anforderung des Anwenders (Zeile 289) | Abschnitt 3.6, Zeile 141; Tests Zeilen 153 und 171 |
| Name „pipwerk studio“, nicht übersetzt, Schreibweise laut Projektziel (Zeilen 289, 291) | Abschnitt 3.2, Zeilen 79 und 85; Test Zeile 154 |
| Vollständige Kennung mit Datum und Uhrzeit in Ortszeit des Browsers (Zeile 292) | E2, Abschnitt 3.3, Zeilen 103 und 106; Tests Zeilen 156 und 172 |
| Angaben in der Software enthalten, keine Internetverbindung (Zeile 292) | E1, E3, E4, Abschnitte 3.3 und 3.4; Tests Zeilen 162 und 174 |
| „unbekannt“, wenn die Angaben fehlen; keine Kennung ohne Datum (Zeile 292; Antwort auf Frage 2) | E4, E5, Zeile 104; Tests Zeilen 156–157 und 172 |
| Lizenzname und vollständiger Text im englischen Original (Zeile 293) | E7, Zeilen 81 und 89, Abschnitt 3.6; Test Zeile 159 |
| Adresse als Verweis in neuem Tab (Zeile 294) | E6, Zeile 91, Abschnitt 3.5; Tests Zeilen 160, 163 und 177 |
| Schaltfläche in der Kopfzeile rechts neben der Sprachauswahl (Zeile 296) | Zeile 141; Tests Zeilen 153 und 171 |
| Übrige Oberfläche gesperrt (Zeile 296) | E8, Zeile 87; Test Zeile 175 |
| Schließen nur mit „Schließen“ oder Escape (Zeile 296) | E8, Zeile 93; Tests Zeilen 161 und 176 |
| Übrige Texte folgen der Oberflächensprache (Zeile 296) | Zeile 87; Tests Zeilen 154 und 155 |
| Standanzeige in der Fußzeile bleibt (Zeile 296) | Zeile 13, Abschnitt 8; Tests Zeilen 165 und 178 |
| Gesamtsystem req-system-006, 008, 009, 011, 019–021, 023 | wie in Durchlauf 2; zu req-system-021 (Anwenderdokumentation) siehe D1 und D3 |

S7 und S8 stehen unverändert in Abschnitt 9 (Zeilen 246–247).

## Hinweis zum Ablauf

Dies ist der dritte Durchlauf der Prüfschleife zwischen QA und Softwarearchitekt. Nach `docs/technical/entwicklungsverfahren.md`, Zeilen 90 und 242–247, geht der Fall nach drei Durchläufen eine Ebene höher an den Projektleiter.
