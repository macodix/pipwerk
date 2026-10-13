# Prüfbericht Spezifikation, Durchlauf 1

- Vorhaben: `ablauftest`
- Phase: 2 Konzeption, Prüfung der Spezifikation
- Rolle: QA
- Übergabedokument: `development/ablauftest/reviews/specification-1-order.md`
- geprüfter Commit: `c017ef61e6f39de73f861abf8d579f53948154b2` (`main`)
- Ergebnis: **nicht bestanden**

## Gegenstand

Geprüft wurde `development/ablauftest/specification.md` gegen:

- req-ui-010 „Angaben zu pipwerk studio“ in `docs/design/requirements/anforderungen-strategiedesigner.md`, Zeilen 287–296
- `docs/design/requirements/anforderungen-gesamtsystem.md`, soweit es req-ui-010 berührt
- die Antworten in `development/ablauftest/questions/ablauftest-01.md`

Zum Abgleich herangezogen wurden `docs/technical/pipwerk-studio.md`, `docs/user/pipwerk-studio.md` und der Code der Oberfläche unter `components/pipwerk-studio/frontend/` im geprüften Commit.

## Zusammenfassung

Die Spezifikation setzt die Inhalte von req-ui-010 weitgehend um. Name, Stand mit vollständiger Kennung und Committer-Datum in Ortszeit, Lizenzname und Lizenztext im englischen Original, Verweis in neuem Tab, Aufrufstelle, Sperrung der übrigen Oberfläche, die zwei Wege zum Schließen und der Verzicht auf jede Netzabfrage sind jeweils einem technischen Baustein und einer Prüfung zugeordnet. Die Antworten auf Frage ablauftest-01 sind eingearbeitet (E3, E4, Abschnitt 3.6).

Sie besteht trotzdem nicht. Offen ist, welchen Commit der Dialog zeigt, wenn Oberfläche und Hintergrunddienst aus verschiedenen Ständen laufen (S1). Eine Aussage zum Sprachwechsel ist sachlich falsch (S2). Zwei Fehlerfälle sind nicht festgelegt (S3, S4). Die Vorgaben zur Anwenderdokumentation reichen für req-system-019 bis 021 nicht aus (S5). Die Dateiliste ist unvollständig (S6). S7 ist eine Frage an den Auftraggeber zum Produktnamen. S8 ist ein Hinweis außerhalb des Prüfumfangs.

## Befunde

### S1 – Welcher Commit „aus dem pipwerk studio läuft“, ist nicht eindeutig

- Fundstelle: `specification.md`, Zeile 22 (E3) und Zeile 29 („Folge von E3“); req-ui-010, Zeile 292: „die vollständige Kennung des Commits, aus dem pipwerk studio läuft“
- Sachverhalt: Der Dialog zeigt den Commit, aus dem die Oberfläche gebaut wurde. Die Fußzeile zeigt den Commit, aus dem der Hintergrunddienst gestartet wurde (`docs/technical/pipwerk-studio.md`, Zeilen 134–135). Die Spezifikation sagt selbst, dass beide nur gleich sind, wenn beide aus demselben Arbeitsverzeichnis gebaut und gestartet werden (Zeile 29). Sonst zeigt pipwerk studio dem Anwender gleichzeitig zwei verschiedene Stände. Die Anforderung kennt aber nur einen Commit, „aus dem pipwerk studio läuft“.
- Zweiter Fall: Im Entwicklungsbetrieb gilt der Stand beim Start des Entwicklungsservers (Zeile 29). Nach einem späteren Commit lädt der Entwicklungsserver den neuen Code nach, der Dialog nennt aber weiter den alten Commit. Der Dialog nennt dann einen Commit, aus dem pipwerk studio nicht läuft.
- Fragen:
  1. Ist mit „pipwerk studio“ in req-ui-010 die Oberfläche, der Hintergrunddienst oder beides zusammen gemeint? Diese Frage betrifft Inhalte des Auftraggebers und ist ihm vorzulegen.
  2. Ist es zulässig, dass Dialog und Fußzeile verschiedene Stände zeigen? Wenn ja: Muss der Anwender erkennen können, welcher Stand welchen Teil betrifft?
  3. Ist die Abweichung im Entwicklungsbetrieb hinnehmbar, und wo wird sie dokumentiert?

### S2 – Die Aussage „Ein Sprachwechsel bei offenem Dialog ist nicht möglich“ trifft nicht zu

- Fundstelle: `specification.md`, Zeile 67
- Sachverhalt: Die Oberflächensprache wird im Hintergrunddienst gespeichert und von der Oberfläche erneut gelesen, zum Beispiel wenn das Browserfenster wieder den Fokus erhält. Eine dort gemeldete andere Sprache wird übernommen (`docs/technical/pipwerk-studio.md`, Zeile 98 und Zeile 105; req-ui-008, Zeilen 279–281). Ändert der Anwender die Sprache in einem zweiten Browserfenster und kehrt zum ersten Fenster mit offenem Dialog zurück, wechselt die Sprache bei offenem Dialog. Die Folgerung „Beim nächsten Öffnen gilt die dann eingestellte Sprache“ beschreibt daher nicht das ganze Verhalten.
- Kritikpunkt: Die Spezifikation begründet ihr Verhalten mit einer falschen Annahme. Das Verhalten des Dialogs bei einem Sprachwechsel von außen ist nicht festgelegt und nicht geprüft (Abschnitt 4 enthält keinen solchen Fall). req-ui-010, Zeile 296, verlangt, dass alle übrigen Texte des Dialogs der Oberflächensprache folgen.
- Frage: Wie verhält sich der offene Dialog, wenn sich die Oberflächensprache von außen ändert, und wie wird das geprüft?

### S3 – Verhalten bei ungültiger Adresse des Repositorys zur Laufzeit fehlt

- Fundstelle: `specification.md`, Zeile 113
- Sachverhalt: `src/repository.ts` prüft die Adresse gegen ein Muster. Festgelegt ist nur, dass ein Test scheitert, wenn die Adresse nicht passt. Nicht festgelegt ist, was die gebaute Oberfläche tut, wenn die Prüfung zur Laufzeit fehlschlägt: ob der Dialog die Adresse weglässt, eine Meldung zeigt, oder ob die ganze Oberfläche beim Laden abbricht. req-ui-010, Zeile 294, verlangt die Adresse als Verweis.
- Frage: Was zeigt der Dialog, und was geschieht mit der übrigen Oberfläche, wenn die Prüfung der Adresse fehlschlägt?

### S4 – Verhalten ohne Datei `LICENSE` fehlt; Widerspruch zu E5

- Fundstelle: `specification.md`, Zeile 24 (E5), Zeile 26 (E7), Zeile 117
- Sachverhalt: Die Oberfläche bindet `LICENSE` aus dem Wurzelverzeichnis des Repositorys ein, also aus einer Datei außerhalb der Komponente. E5 sagt, ein Bau aus einem entpackten Archiv bleibe möglich. Das gilt nur, wenn das Archiv das ganze Repository enthält. Für einen Bau nur aus dem Verzeichnis der Komponente ist nicht festgelegt, ob der Bau abbricht oder der Dialog ohne Lizenztext erscheint. req-ui-010, Zeile 293, verlangt den vollständigen Lizenztext. req-system-006 und req-system-008 (`anforderungen-gesamtsystem.md`, Zeilen 45 und 132) verlangen, dass jede Hauptkomponente ihre UI-Bestandteile selbst mitliefert und eigenständig installierbar ist.
- Fragen:
  1. Was geschieht beim Bau, wenn `LICENSE` fehlt?
  2. Ist die Abhängigkeit des Baus von einer Datei außerhalb der Komponente mit req-system-006 und req-system-008 vereinbar? Die gebaute Oberfläche enthält den Text; offen ist nur der Bau.

### S5 – Vorgaben zur Anwenderdokumentation unvollständig

- Fundstelle: `specification.md`, Zeile 197
- Sachverhalt: Für `docs/user/pipwerk-studio.md` sind Aufruf, Inhalte, Stand, „unbekannt“ und Schließen vorgesehen. Es fehlen:
  1. Eine Erklärung, dass Dialog und Fußzeile verschiedene Stände zeigen können und warum (siehe S1). Die Anwenderdokumentation sagt heute, die Fußzeile zeige den Stand, „aus dem Pipwerk Studio läuft“ (`docs/user/pipwerk-studio.md`, Zeilen 29 und 37). Mit dem Dialog gäbe es zwei solche Aussagen. Ohne Erklärung ist das für den Anwender widersprüchlich (req-system-019, Zeile 100).
  2. Die Erklärung der neuen Begriffe „Repository“ und „Lizenz“ und eine Festlegung zum Glossar. req-system-021 (Zeile 116) verlangt für jeden erforderlichen Fachbegriff eine Definition in einem Glossar. Die Anwenderdokumentation hat keinen Glossarabschnitt (Gliederung: Abschnitte 1–5). „Commit“ und „Kennung“ werden dort bisher nur im Fließtext erklärt.
  3. Die Folge, dass der Verweis auf das Repository eine Internetverbindung braucht, während die Anzeige im Dialog ohne auskommt.
- Kritikpunkt: Mit diesen Vorgaben kann die QA in Phase 4 die Anwenderdokumentation nicht als vollständig freigeben.

### S6 – Liste der neuen und geänderten Dateien unvollständig

- Fundstelle: `specification.md`, Zeilen 33–52 (Abschnitt 3.1)
- Sachverhalt: Die Tabelle heißt „Neue und geänderte Dateien“. Sie nennt nicht:
  - `src/test-setup.ts`, das nach Zeile 125 geändert wird
  - die Testdateien unter `src/`, `buildinfo/` und `e2e/` aus Abschnitt 4
  - `components/pipwerk-studio/scripts/testenv` und `components/pipwerk-studio/.gitignore` aus Abschnitt 6.1 (Zeilen 172 und 184)
- Kritikpunkt: Im Plan muss jeder Teil der Spezifikation einem Arbeitspaket zugeordnet werden. Eine Liste, die nur einen Teil der Dateien nennt, erschwert diese Prüfung und lädt zu Lücken ein.

### S7 – Frage zum Produktnamen in der übrigen Oberfläche

- Fundstelle: `specification.md`, Zeile 202 (Abschnitt 8); req-ui-010, Zeile 289; `docs/design/projektziel.md`, Zeile 58; `components/pipwerk-studio/frontend/src/App.tsx`, Zeile 21, und `index.html`, Zeile 6
- Sachverhalt: Die Kopfzeile zeigt „Pipwerk Studio“. Rechts daneben stünde künftig die Schaltfläche „Über pipwerk studio“, im Dialog „pipwerk studio“. Der Anwender sieht auf einer Zeile zwei Schreibweisen. req-ui-010 nennt den Namen „laut Projektziel“, regelt aber nur den Dialog und seine Schaltfläche. Die Spezifikation hält sich daran und grenzt die übrigen Stellen ausdrücklich aus. Das ist innerhalb von req-ui-010 nicht falsch.
- Frage an den Auftraggeber: Ist die unterschiedliche Schreibweise in Kopfzeile und Dialog so gewollt, bis eine eigene Anforderung die übrigen Stellen regelt?

### S8 – Hinweis außerhalb des Prüfumfangs: Aufrufstelle und req-ui-009

- Fundstelle: req-ui-010, Zeile 296; req-ui-009, Zeile 285
- Sachverhalt: req-ui-010 legt die Schaltfläche „rechts neben der Sprachauswahl“ in der Kopfzeile fest. req-ui-009 verlangt, dass die Sprachauswahl im Einstellungsbereich steht „und nicht an anderer Stelle der Oberfläche“. Wird req-ui-009 umgesetzt, entfällt der Bezugspunkt der Aufrufstelle. req-ui-009 gehört laut `scope.md` nicht zum Vorhaben. Für die Spezifikation dieses Vorhabens ist das kein Fehler; er beeinflusst das Ergebnis dieses Berichts nicht.
- Frage an den Auftraggeber: Wo steht die Schaltfläche, wenn die Sprachauswahl nach req-ui-009 in den Einstellungsbereich wandert?

## Geprüft ohne Befund

| Aussage von req-ui-010 | Umsetzung in der Spezifikation |
|---|---|
| Name „pipwerk studio“, nicht übersetzt (Zeile 291) | Abschnitt 3.2, Zeilen 61 und 67; Test Zeile 132 |
| Vollständige Kennung mit Datum und Uhrzeit in Ortszeit des Browsers (Zeile 292) | E2, Abschnitt 3.3, Zeilen 83–86; Tests Zeilen 133 und 149. Committer-Datum beantwortet den Kritikpunkt aus B2 von `requirements-1.md`. |
| Angaben in der Software enthalten, keine Internetverbindung (Zeile 292; Antwort auf Frage 2) | E1, E3, E4, Abschnitt 3.4; Tests Zeilen 139 und 150 |
| „unbekannt“, wenn die Angaben fehlen; keine Kennung ohne Datum (Zeile 292) | E4, Abschnitt 3.3, Zeile 84; Test Zeile 134 |
| Lizenzname und vollständiger Text im englischen Original (Zeile 293) | E7, Abschnitt 3.2, Zeilen 63 und 69; Test Zeile 136. `LICENSE` hat 674 Zeilen und endet mit dem Schlussabsatz des GPL-3.0-Textes. |
| Adresse https://github.com/macodix/pipwerk als Verweis in neuem Tab (Zeile 294) | E6, Abschnitt 3.2, Zeile 71; Abschnitt 3.5; Tests Zeilen 137 und 153 |
| Schaltfläche „Über pipwerk studio“ / „About pipwerk studio“ rechts neben der Sprachauswahl (Zeile 296; Antwort auf Frage 1) | Abschnitt 3.6, Zeile 119; Tests Zeilen 131 und 148 |
| Übrige Oberfläche gesperrt (Zeile 296) | E8; Test Zeile 151 |
| Schließen nur mit „Schließen“ oder Escape (Zeile 296) | E8, Zeile 73; Tests Zeilen 138 und 152 |
| Übrige Texte folgen der Oberflächensprache (Zeile 296) | Abschnitt 3.2; siehe aber S2 |
| Standanzeige in der Fußzeile bleibt (Zeile 296) | Zeile 12, Abschnitt 8; Test Zeilen 142 und 154 |
| Gesamtsystem req-system-023 (mehrsprachige Oberfläche) | Texte unter dem Schlüssel `about` in `de.json` und `en.json`, Vollständigkeitstest Zeile 141 |
| Gesamtsystem req-system-009, 011 (Web-API, Schutz) | Backend und Schnittstellen unverändert (E1, Abschnitt 8) |

Keine Aussage der Spezifikation widerspricht req-ui-010 unmittelbar. Die Punkte S1 bis S4 sind Lücken oder unklare Stellen, keine Widersprüche.
