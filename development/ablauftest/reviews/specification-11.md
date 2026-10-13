# Prüfbericht Spezifikation, Durchlauf 11

- Vorhaben: `ablauftest`
- Phase: 2 Konzeption, Prüfung der Spezifikation nach Einwand des Auftraggebers
- Rolle: QA
- Übergabedokument: `development/ablauftest/reviews/specification-11-order.md`
- geprüfter Commit: `c0836262c021be5d8ccf08072f0bab2b84689272` (`main`)
- Arbeitsverzeichnis auf `origin/main` = `f4115aac76043fe6e20aa9d89d07979e9f4fae7b`. Gegenüber dem geprüften Commit ist dort nur das Übergabedokument hinzugekommen (`git diff --stat c0836262… f4115aa`: 1 Datei, `reviews/specification-11-order.md`). Zeilenangaben gelten für beide Stände.
- Prüfschleife: Durchlauf 11, vom Projektleiter mit der Antwort auf Frage `development/ablauftest/questions/ablauftest-04.md` freigegeben
- Ergebnis: **nicht bestanden**

## Gegenstand

Geprüft wurde `development/ablauftest/specification.md` gegen:

- req-ui-010 „Angaben zu pipwerk Studio“ in `docs/design/requirements/anforderungen-strategiedesigner.md`, Zeilen 287–296, mit dem neuen letzten Satz in Zeile 296
- `docs/design/requirements/anforderungen-gesamtsystem.md`, soweit es req-ui-010 berührt. Das Dokument nennt den Namen und seine Schreibweise nicht (`grep -i "studio\|Schreibweise\|Produktname"`: kein Treffer). Ein Widerspruch zu E10 besteht nicht.

Ausgewertet wurden:

- `git diff c8cdc3ee… c0836262… -- development/ablauftest/specification.md`. Geändert sind Status, Abschnitt 1, E1, neue E10, Abschnitte 3.1, 4.1, 4.2, neuer Abschnitt 4.4, Abschnitte 5, 6.2, 7, 8 und 9. Das stimmt mit der Angabe im Status (Zeile 9) überein.
- `git diff --stat c8cdc3ee… c0836262…`: Außer der Spezifikation geändert sind req-ui-010 (neuer Satz, Änderungsnachweis), `docs/design/praesentation-projektziel.html` und Unterlagen unter `development/`. Programmcode und übrige Dokumentation sind unverändert.
- `git grep -n -o -i -E "pipwerk[ -]studio"` über alle versionierten Dateien außer `docs/design/` und `development/`, um die Liste in Abschnitt 3.1 und die Regel in E10 gegen den Bestand zu prüfen
- `git grep -n -P "(?<![Pp]ipwerk[ -])\bStudio"` über Komponente, Dokumentation und `README.md`, um die Kurzform „Studio“ zu finden
- Projektziel `docs/design/projektziel.md`, Zeilen 58 und 67–69 (Schreibweise)

## Kontrolle des Befunds M1 aus Durchlauf 10

M1 bemängelte: Abschnitt 8 hielt jede Stelle mit „Pipwerk Studio“ unverändert, auch Sätze der Dokumentation, die Abschnitt 7 ersetzen muss. Die Schreibweise für neuen Text in der Dokumentation war nicht festgelegt.

| Punkt aus M1 | Neue Fassung | Ergebnis |
|---|---|---|
| Abschnitt 8 hält jede Stelle mit „Pipwerk Studio“ unverändert | Der Satz ist entfallen. Abschnitt 8 (Zeilen 286–289) nimmt nur noch `docs/design/`, `development/`, Bezeichner und die Namen anderer Komponenten aus. | gegenstandslos durch die neue Fassung von req-ui-010 |
| Widerspruch zu Abschnitt 7 bei `docs/user/pipwerk-studio.md`, Zeilen 17 und 25 | Abschnitt 7 (Zeilen 273, 277, 278) verlangt „pipwerk Studio“ in allen Dokumenten und ersetzt den Satz in Zeile 17. Abschnitt 8 widerspricht dem nicht mehr. | behoben |
| Schreibweise für neuen und geänderten Text in der Dokumentation | E10 (c) (Zeile 30) und Zeile 273: Jede Nennung lautet „pipwerk Studio“, auch am Satzanfang, in Überschriften und Zusammensetzungen. Wiedergegebene Ausgaben stehen so, wie pipwerk Studio sie nach der Änderung ausgibt. | behoben |
| S7 als offene Frage | Zeile 297: S7 ist mit der Antwort auf ablauftest-04 entschieden und in E10 umgesetzt. | erledigt |

M1 ist erledigt.

## Prüfung von E10 und Abschnitt 4.4 gegen den neuen Satz von req-ui-010

Ohne Befund geprüft:

- Anzeige (E10 a): Die Fundstellen in der Oberfläche sind `src/App.tsx`, Zeile 21 (Überschrift), und `index.html`, Zeile 6 (Titel). Beide stehen in Abschnitt 3.1 (Zeilen 60, 79) und sind durch Tests in 4.1 (Zeile 178) und 4.2 (Zeile 195) abgedeckt. Die Sprachdateien `src/locales/*.json` enthalten weder den Namen noch die Kurzform.
- Ausgaben (E10 b): Fehlermeldung beim Start `config.py`, Zeile 99; Hilfetext `cli.py`, Zeilen 24 und 34–35; Titel der Schnittstelle `app.py`, Zeile 120; `summary` und `description` `app.py`, Zeilen 128–166; Detailtext `app.py`, Zeile 144; Protokolleinträge `revision.py`, Zeilen 85 und 165; Ausnahme `settings_service.py`, Zeile 59. Jede Stelle ist in Abschnitt 3.1 (Zeilen 55–56) erfasst und in 4.4 (Zeilen 219–223) geprüft.
- Vollständigkeit der Dateiliste in Abschnitt 3.1: Jede Datei mit einer anderen Schreibweise als „pipwerk Studio“ oder `pipwerk-studio` steht in der Liste (Abgleich mit der Suche oben: 25 Dateien, alle enthalten). Dateien nur mit dem Bezeichner `pipwerk-studio` (zum Beispiel `test_config.py`, `LanguageSelect.test.tsx`, `package.json`) brauchen keine Änderung.
- Dokumentation (E10 c): Die Regel in Zeile 273 deckt auch Zusammensetzungen ab, zum Beispiel `docs/user/pipwerk-studio.md`, Zeile 59 („Pipwerk-Studio“), und Zeile 75 („Studio-Komponente“). Wiedergegebene Ausgaben, zum Beispiel `docs/technical/pipwerk-studio.md`, Zeile 30, sind geregelt.
- Hinweis an den Projektleiter in Abschnitt 9 (Zeile 301): Die genannten Fundstellen unter `docs/design/` stimmen mit der Suche überein. Die übrigen Treffer dort sind „pipwerk Studio“ oder der Bezeichner `pipwerk-studio`. Die Frage, ob req-ui-010 diese Dokumente umfasst, ist als Frage an den Auftraggeber gekennzeichnet.
- Schreibweise mit kleinem „p“ am Satzanfang (E10) entspricht dem Projektziel, Zeilen 58 und 69.
- E1, Abschnitt 5 (Zeile 235) und Abschnitt 8 (Zeile 291) sagen übereinstimmend: Im Backend ändern sich nur Texte.

Das Verhalten von Vite beim Neuladen der Konfiguration (Zeile 32) bleibt **ungeprüft**. Die Spezifikation kennzeichnet das selbst. Ich habe es nicht geprüft.

## Befunde

### P1 – Abschnitt 4.4 verlangt eine Prüfung der Schnittstellenbeschreibung, die den Bezeichnern nach E10 widerspricht

- Fundstelle: `specification.md`, Zeile 223 (Abschnitt 4.4) gegen Zeile 30 (E10) und Zeile 288 (Abschnitt 8)
- Sachverhalt:
  - Zeile 223 verlangt: „jeder Wert der Felder `title`, `summary` und `description` an beliebiger Stelle des Dokuments enthält „Studio“ nur als Teil von „pipwerk Studio““.
  - E10 (Zeile 30) und Abschnitt 8 (Zeile 288) lassen die Namen der Schemas wie `StudioLanguage` unverändert.
  - Die Modelle in `backend/src/pipwerk_studio/app.py` heißen `StudioLanguage` (Zeile 45), `StudioLanguageUpdate` (Zeile 57) und `StudioRevision` (Zeile 69). Sie setzen keinen eigenen Titel (`model_config` in den Zeilen 40, 52, 64, 79 enthält nur `extra` und `strict`). Pydantic schreibt in die erzeugte Schnittstellenbeschreibung zu jedem Schema ein Feld `title` mit dem Namen der Klasse, also zum Beispiel `"title": "StudioLanguage"`. Dieses Verhalten von Pydantic ist **nicht am Rechner geprüft**; Python mit Pydantic stand mir in dieser Prüfung nicht zur Verfügung.
  - Zeile 223 sagt zwar: „Die Namen der Schemas und Pfade sind Bezeichner und nicht Gegenstand der Prüfung.“ Der Wert im Feld `title` eines Schemas ist aber genau ein Wert eines Felds `title` „an beliebiger Stelle des Dokuments“.
- Auswirkung: Wörtlich umgesetzt scheitert der Test, solange die Schemas ihre Namen behalten. Der Entwickler muss entscheiden, ob er den Test einschränkt, die Titel der Schemas ändert oder „enthält ‚Studio‘“ als ganzes Wort liest. Jede dieser Lesarten führt zu einem anderen Ergebnis.
- Kritikpunkt: Die Prüfvorschrift in Zeile 223 ist mehrdeutig und widerspricht in ihrer wörtlichen Fassung E10.
- Fragen:
  - Gehört das Feld `title`, das Pydantic für jedes Schema aus dem Namen der Klasse erzeugt, zur Prüfung in Zeile 223?
  - Ist dieser Titel eine Nennung des Namens im Sinne von E10 (b) oder ein Bezeichner im Sinne von E10?
  - Heißt „enthält ‚Studio‘“ in Zeile 223 eine beliebige Zeichenfolge oder ein ganzes Wort?

### P2 – Unklar, ob die Kurzform „Studio“ in Testtexten und in nicht ausgegebenen Texten im Programmcode ersetzt wird

- Fundstelle: `specification.md`, Zeile 30 (E10), dazu Zeilen 58, 67 und 76 (Abschnitt 3.1)
- Sachverhalt:
  - E10 sagt: „In (a) und (b) wird auch die Kurzform ‚Studio‘ … ersetzt“. Danach gilt die Ersetzung der Kurzform nur für Anzeige und Ausgaben.
  - E10 sagt außerdem: „In (d) darf die Kurzform ‚Studio‘ in Kommentaren und Docstrings bleiben, die weder angezeigt noch ausgegeben werden.“ Danach muss die Kurzform in den übrigen Teilen von (d) ersetzt werden, also in Paketbeschreibung, Beispielkonfiguration und Testtexten.
  - Die beiden Sätze führen zu verschiedenen Ergebnissen. Betroffen sind zum Beispiel:
    - Testtexte: `frontend/e2e/studio.spec.ts`, Zeile 110 (`'persists the Studio language across page reloads (req-ui-008)'`), `frontend/src/settingsApi.test.ts`, Zeile 6 (`'Studio language API time limit'`)
    - Texte von Ausnahmen in der Oberfläche, die nach meiner Suche weder angezeigt noch protokolliert werden (`grep -rn -E "\.message|console\.|String\(err|String\(error"` in `frontend/src`: kein Treffer): `frontend/src/settingsApi.ts`, Zeilen 29, 36 und 40; `frontend/src/revisionApi.ts`, Zeilen 90 und 94. Sie sind weder Kommentar noch Docstring.
  - Abschnitt 3.1 nennt `e2e/studio.spec.ts` (Zeile 67) nur für die Erwartung an die Überschrift. `src/revisionApi.ts` hat dort „nur die Verschiebungen oben, Verhalten unverändert“ (Zeile 76). `src/settingsApi.ts` und `src/settingsApi.test.ts` stehen nicht in der Liste. Die Suche nach Abschnitt 4.4 erfasst die Kurzform nicht (Zeile 225).
- Auswirkung: Der Entwickler kann nicht eindeutig feststellen, ob diese Stellen zu ändern sind. Der Tester Funktion kann nicht eindeutig feststellen, ob eine verbliebene Kurzform dort ein Fehler ist.
- Kritikpunkt: Der Geltungsbereich der Kurzform-Regel in E10 ist widersprüchlich formuliert.
- Fragen:
  - Gilt die Ersetzung der Kurzform „Studio“ nur für (a), (b) und die Dokumentation, oder auch für Testtexte, Paketbeschreibung und Beispielkonfiguration in (d)?
  - Fallen Texte von Ausnahmen im Programmcode, die weder angezeigt noch ausgegeben werden, unter „Kommentare und Docstrings“ oder unter die übrigen Teile von (d)?

## Hinweise außerhalb der Befunde

Diese Hinweise beeinflussen das Ergebnis nicht.

- Programmname in Ausgaben: `cli.py`, Zeilen 50 und 57, stellt jeder Fehlermeldung auf der Fehlerausgabe `pipwerk-studio:` voran; der Hilfetext beginnt mit `usage: pipwerk-studio`. E10 (Zeile 30) behandelt den Programmnamen ausdrücklich als Bezeichner und begründet das. Ich halte das für eine nachvollziehbare und gekennzeichnete Festlegung. Ob der Auftraggeber „wo pipwerk Studio seinen Namen … ausgibt“ ebenso versteht, ist von mir nicht zu entscheiden.
- Grenze der Suche nach Abschnitt 4.4: `git grep` findet keine Nennung, die über einen Zeilenumbruch geteilt ist. Heute gibt es eine solche Stelle: `cli.py`, Zeilen 34–35 („Pipwerk “ / „Studio does not start …“). Sie liegt im Hilfetext und wird vom Test in Zeile 220 erfasst. Abschnitt 3.1 (Zeile 44) nennt die Prüfung nach Abschnitt 4.4 maßgeblich für die Vollständigkeit; das trifft damit für den heutigen Bestand zu.
- `development/ablauftest/scope.md`, Zeile 3, schreibt „Dialog ‚Über Pipwerk Studio‘ in Pipwerk Studio“. Das Dokument liegt unter `development/` und ist nach Abschnitt 8 nicht Gegenstand der Spezifikation. Ob es nachgezogen wird, entscheidet die zuständige Rolle.
- `docs/design/praesentation-projektziel.html`, Zeile 117, nennt jetzt „pipwerk Studio“. Der Hinweis aus den Durchläufen 8 bis 10 ist erledigt.

## Hinweis zur Prüfschleife

Durchlauf 11 hat der Projektleiter einzeln freigegeben (Antwort auf `questions/ablauftest-04.md`, Zeile 28). Der Vorschlag des Softwarearchitekten in derselben Frage (Zeile 26) sieht vor, dass der Fall bei einem erneuten Befund wieder an den Projektleiter geht. Ob ein weiterer Durchlauf stattfindet, entscheidet nicht die QA.
