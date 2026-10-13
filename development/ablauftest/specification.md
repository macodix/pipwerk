# Spezifikation Vorhaben ablauftest

## Status

- status: `draft`
- stand: 2026-10-13
- komponente: `pipwerk-studio`
- grundlage: [scope.md](scope.md), req-ui-010 in [Anforderungen an den Trading-Strategiedesigner](../../docs/design/requirements/anforderungen-strategiedesigner.md), Antworten in [questions/ablauftest-01.md](questions/ablauftest-01.md), [questions/ablauftest-02.md](questions/ablauftest-02.md) und [questions/ablauftest-04.md](questions/ablauftest-04.md)
- prüfung: Durchlauf 1 [specification-1.md](reviews/specification-1.md) nicht bestanden, Befunde S1 bis S6 eingearbeitet, S7 und S8 in Abschnitt 9. Durchlauf 2 [specification-2.md](reviews/specification-2.md) nicht bestanden, Befund N1 eingearbeitet. Durchlauf 3 [specification-3.md](reviews/specification-3.md) nicht bestanden, Frage [questions/ablauftest-02.md](questions/ablauftest-02.md) an den Auftraggeber. Nach der Antwort D1, D2 und D3 eingearbeitet: E9, Absatz „Grenze im Entwicklungsbetrieb“, Abschnitte 3.1, 4.1, 4.2, 6.1, 7 und 9. Mit der Antwort beginnt eine neue Prüfschleife. Durchlauf 4 [specification-4.md](reviews/specification-4.md), erster der neuen Schleife, nicht bestanden, Befunde F1 und F2 eingearbeitet: E9, Abschnitte 3.1, 4.2 und neuer Abschnitt 4.3. Durchlauf 5 [specification-5.md](reviews/specification-5.md) nicht bestanden, Befunde G1 bis G3 eingearbeitet: E9, Abschnitte 4.3 und 6.1. Durchlauf 6 [specification-6.md](reviews/specification-6.md), dritter der neuen Schleife, nicht bestanden, Befund H1 in Abschnitt 4.3 eingearbeitet. Frage [questions/ablauftest-03.md](questions/ablauftest-03.md) zur Grenze der Prüfschleife, weiterer Durchlauf vom Projektleiter freigegeben. Durchlauf 7 [specification-7.md](reviews/specification-7.md) bestanden, H1 behoben. Bestätigung durch den Auftraggeber am 13.10.2026 mit einer Änderung ([Präsentation](presentations/specification.html)): Name „pipwerk Studio“ statt „pipwerk studio“ in req-ui-010, eingearbeitet in alle Nennungen des Namens, Abschnitte 8 und 9. Durchlauf 8 [specification-8.md](reviews/specification-8.md), erster nach der Änderung, nicht bestanden, Befund K1 in Abschnitt 8 eingearbeitet. Durchlauf 9 [specification-9.md](reviews/specification-9.md) nicht bestanden, Befund L1 in Abschnitt 8 und bei S7 in Abschnitt 9 eingearbeitet. Durchlauf 10 [specification-10.md](reviews/specification-10.md), dritter der Schleife nach der Änderung, nicht bestanden, Befund M1 in Abschnitt 8 eingearbeitet. Frage [questions/ablauftest-04.md](questions/ablauftest-04.md) zur Grenze der Prüfschleife. Antwort: Durchlauf 11 freigegeben; req-ui-010 verlangt jetzt den Namen „pipwerk Studio“ überall, auch in Oberfläche, Ausgaben und Dokumentation. Eingearbeitet: Abschnitt 1, E1, neue E10, Abschnitte 3.1, 4.1, 4.2, neuer Abschnitt 4.4, Abschnitte 5, 6.2, 7, 8 und 9. Die bisherige Abgrenzung in Abschnitt 8 und Frage S7 entfallen. Durchlauf 11 [specification-11.md](reviews/specification-11.md) nicht bestanden, M1 erledigt, Befunde P1 und P2 eingearbeitet: E10 und Abschnitt 4.4. Frage [questions/ablauftest-05.md](questions/ablauftest-05.md) zur Grenze der Prüfschleife. Antwort: Durchlauf 12 als Nachprüfung freigegeben. Durchlauf 12 [specification-12.md](reviews/specification-12.md) nicht bestanden, P1 und P2 behoben, Befund Q1 in Abschnitt 4.4 eingearbeitet. Frage [questions/ablauftest-06.md](questions/ablauftest-06.md) zur Grenze der Prüfschleife. Antwort: Durchlauf 13 als Nachprüfung freigegeben. Durchlauf 13 [specification-13.md](reviews/specification-13.md) nicht bestanden, Q1 behoben, Befund R1 eingearbeitet: E1, Abschnitte 3.1, 4.4, 5 und 8. Frage [questions/ablauftest-07.md](questions/ablauftest-07.md) zur Grenze der Prüfschleife. Antwort: Durchlauf 14 als Nachprüfung freigegeben. Vor Durchlauf 14 in Abschnitt 4.4 berichtigt: Die Zeilen des Hilfetexts werden ohne führende Leerzeichen verglichen.

## 1. Gegenstand

pipwerk Studio erhält den Dialog „Über pipwerk Studio“ nach req-ui-010. Der Dialog zeigt Name, Stand, Lizenz und die Adresse des Repositorys. Er wird über eine Schaltfläche in der Kopfzeile geöffnet. Die Standanzeige in der Fußzeile mit ihrem Tooltip bleibt unverändert. Außerdem schreibt pipwerk Studio seinen Namen nach req-ui-010 überall einheitlich „pipwerk Studio“: in der Oberfläche, in allen Ausgaben des Backends und in der Dokumentation (E10).

Die Spezifikation beschreibt den technischen Aufbau. Bedienablauf und Inhalte stehen in req-ui-010 und werden hier nicht wiederholt, sondern den technischen Bausteinen zugeordnet.

## 2. Architekturentscheidungen

| Nr. | Entscheidung | Begründung |
|---|---|---|
| E1 | Der Dialog ist ein reiner Bestandteil der Oberfläche. Verhalten, Endpunkte und Datenformate des Backends bleiben unverändert. Im Backend ändern sich nur Texte nach E10 und der Umbruch des Hilfetexts der Kommandozeile (Abschnitt 4.4). | Alle Angaben des Dialogs entstehen beim Bau der Oberfläche (E3, E6, E7). Der Dialog braucht zur Anzeige keine Anfrage. |
| E2 | Datum und Uhrzeit des Stands sind das Committer-Datum des Commits. | So ermittelt es das Backend bereits für den Tooltip (`git log -1 --format=%cI`, technische Dokumentation Abschnitt 2.6). Dialog und Tooltip nennen damit für denselben Commit dasselbe Datum. Beantwortet den Kritikpunkt aus B2 des Prüfberichts [requirements-1.md](reviews/requirements-1.md). |
| E3 | Kennung und Datum des Commits werden beim Bau der Oberfläche aus Git ermittelt und als Wert in die ausgelieferten Dateien geschrieben (Vite-Option `define`). Der Entwicklungsserver ermittelt sie ebenso bei seinem Start. | req-ui-010: Die Angaben sind in der bereitgestellten Software selbst enthalten, für die Anzeige wird keine Internetverbindung genutzt. Die gebaute Oberfläche braucht zur Laufzeit weder Git noch Netz noch Backend. |
| E4 | Der Dialog zeigt den Stand nur, wenn Kennung und Datum beide vorliegen und gültig sind. Sonst zeigt er „unbekannt“. Eine Abfrage bei GitHub oder einem anderen Dienst gibt es nicht. | Antwort auf Frage 2 in [questions/ablauftest-01.md](questions/ablauftest-01.md): Eine Kennung ohne Datum wird nicht angezeigt. |
| E5 | Die Ermittlung beim Bau verwendet dieselben Git-Aufrufe und dieselben Prüfregeln wie das Backend (technische Dokumentation Abschnitt 2.6). Jeder Fehler ergibt „nicht ermittelbar“ und bricht den Bau nicht ab. | Gleiche Regeln an beiden Stellen. Ein Bau ohne Git, zum Beispiel aus einem entpackten Archiv des Repositorys, bleibt möglich und zeigt „unbekannt“. |
| E6 | Die Adresse des Repositorys steht genau einmal: im Feld `repository` der `package.json` der Oberfläche. | Kein fester Wert im Programmcode. Eine Änderung der Adresse ist eine Änderung an einer Stelle. |
| E7 | Der Lizenztext ist die Datei `LICENSE` im Wurzelverzeichnis des Repositorys. Die Oberfläche bindet sie zur Bauzeit als Text ein. Fehlt die Datei, bricht der Bau mit einer Fehlermeldung ab. | Eine einzige Quelle. Keine Kopie, die vom Original abweichen kann. Der Dialog braucht für den Lizenztext keine Anfrage. Eine Oberfläche ohne den vollständigen Lizenztext erfüllt req-ui-010 nicht und wird deshalb nicht gebaut. Die gebaute Oberfläche enthält den Text selbst; installiert und gestartet wird sie ohne Zugriff auf das Repository (req-system-006, req-system-008). Gebaut wird sie aus dem Repository, nicht aus dem Verzeichnis der Komponente allein. |
| E8 | Der Dialog ist das HTML-Element `<dialog>`, geöffnet mit `showModal()`. | Der Browser sperrt damit die übrige Oberfläche für Maus, Tastatur und Hilfstechnik, hält den Fokus im Dialog und schließt ihn mit der Escape-Taste. Ein Klick neben den Dialog schließt ihn nicht. Das entspricht req-ui-010 ohne eigene Sperrlogik. |
| E9 | Genau ist der Stand nach req-ui-010 in der Testumgebung und in jeder späteren Installation. Der Dialog nennt immer den Commit, der beim Bau der ausgelieferten Oberfläche ausgecheckt war (E3). pipwerk Studio besteht aus Oberfläche und Backend. Genau ist die Angabe deshalb, wenn beide Bedingungen erfüllt sind: Oberfläche und Backend stammen aus demselben Commit, und beim Bau lagen im ganzen Repository keine nicht committeten Änderungen vor, auch nicht außerhalb der Komponente (zum Beispiel an `LICENSE`, E7). Testumgebung und Installation müssen beide Bedingungen erfüllen. Testumgebung: Das Testumgebungsskript (Abschnitt 6.1) startet nur aus einem Arbeitsverzeichnis von Git, das im ganzen Repository keine nicht committeten Änderungen und keine nicht ignorierten neuen Dateien hat, baut dort die Oberfläche und startet das Backend aus demselben Arbeitsverzeichnis. Damit laufen Oberfläche und Backend aus genau dem Commit, den Dialog und Fußzeile nennen. Nachweise: Der Test des Testumgebungsskripts (Abschnitt 4.3) weist den Abbruch bei nicht committeten Änderungen nach. Der Browsertest (Abschnitt 4.2) weist an der gebauten Oberfläche nach, dass Dialog und Fußzeile den Commit nennen, der beim Bau ausgecheckt war. Spätere Installation: Sie muss Oberfläche und Backend aus demselben Commit ohne nicht committete Änderungen bauen und ausliefern. Wie sie das sicherstellt und wie sie das Backend startet, legt ihre eigene Spezifikation fest; sie ist nicht Gegenstand dieses Vorhabens. | req-ui-010 in der Fassung nach der Antwort auf Frage [ablauftest-02](questions/ablauftest-02.md): genau in Testumgebung und Installation, im Entwicklungsbetrieb der Commit vom Start der Programme. Der Dialog hängt nur von der gebauten Oberfläche ab (E1, E3), nicht vom Backend und nicht vom Repository zur Laufzeit (E7). Nicht committete Änderungen beim Bau sind der einzige Fall, in dem der gebaute Code zu keinem Commit gehört. |
| E10 | Einheitliche Schreibweise des Namens. Jede Nennung von pipwerk Studio lautet „pipwerk Studio“, mit kleinem „p“ auch am Satzanfang und in Überschriften. Das gilt für (a) alles, was pipwerk Studio anzeigt: Oberfläche einschließlich Überschrift der Kopfzeile und Titel der Seite im Browser; (b) alles, was pipwerk Studio ausgibt: Fehlermeldungen und Hilfetext der Kommandozeile, Einträge im Protokoll, Texte in HTTP-Antworten und die von FastAPI erzeugte Schnittstellenbeschreibung (Titel, `summary`, `description` und Docstrings der Modelle, die dort als Beschreibung erscheinen); (c) Dokumentation (Abschnitt 7); (d) Paketbeschreibung, Beispielkonfiguration, Kommentare, Docstrings und Testtexte im Programmcode der Komponente. In (a), (b) und (c) wird auch die Kurzform „Studio“, wo sie pipwerk Studio benennt, durch „pipwerk Studio“ ersetzt, zum Beispiel `The stored Studio language is invalid.` oder „Studio-Komponente“. In (d) wird nur die volle Form angeglichen; die Kurzform „Studio“ darf dort überall bleiben, auch in Testtexten, Paketbeschreibung, Beispielkonfiguration und Texten von Ausnahmen. Wird ein Text aus (d) angezeigt oder ausgegeben, gilt für ihn (a) beziehungsweise (b). Unverändert bleiben Bezeichner: Verzeichnis- und Dateinamen, Paket- und Programmname `pipwerk-studio`, Modul `pipwerk_studio`, Umgebungsvariablen `PIPWERK_STUDIO_*`, Pfade wie `/api/studio/…`, Tabellennamen und Namen von Klassen, Funktionen und Schemas wie `StudioLanguage`. Nicht geändert werden die Dokumente unter `docs/design/` und `development/` (Abschnitt 8). | req-ui-010 in der Fassung nach der Antwort auf Frage [ablauftest-04](questions/ablauftest-04.md): „Überall, wo pipwerk Studio seinen Namen anzeigt oder ausgibt, lautet er „pipwerk Studio“, ebenso in der Dokumentation.“ Die Regel ist mit einer Suche im Repository prüfbar (Abschnitt 4.4). Bezeichner sind technische Namen, keine Nennung des Namens; ihre Änderung würde Pfade, Pakete und Schnittstellen ändern. |

Grenze im Entwicklungsbetrieb: Im Entwicklungsbetrieb (technische Dokumentation Abschnitt 4.2) nennt der Dialog nach req-ui-010 den Commit vom Start der Programme. Der Entwicklungsserver liefert geänderte Dateien sofort aus, auch solche, die nicht committet sind. Damit läuft pipwerk Studio dort nicht notwendig aus einem Commit. Backend und Entwicklungsserver ermitteln den Stand jeweils bei ihrem Start. Der Entwicklungsserver ermittelt ihn außerdem jedes Mal neu, wenn Vite die Konfiguration neu lädt, weil `vite.config.ts` den Stand beim Laden der Konfiguration ermittelt (Abschnitt 3.4). Laut Dokumentation von Vite lädt der Entwicklungsserver die Konfiguration neu und startet neu, wenn sich `vite.config.ts` oder eine davon geladene Datei ändert (`buildinfo/gitRevision.ts`, `src/timestamp.ts`); dieses Verhalten von Vite ist nicht am Rechner geprüft. Ein solcher Neustart ist ein Start im Sinne von req-ui-010. Im Entwicklungsbetrieb gilt deshalb:

- Der Dialog nennt den Commit beim letzten Start des Entwicklungsservers, die Fußzeile den Commit beim Start des Backends.
- Nach einem Wechsel des Commits oder bei nicht committeten Änderungen können beide von dem Code abweichen, der tatsächlich läuft, und voneinander abweichen.
- Nach einem Neustart beider Prozesse nennen beide den Commit, der dann ausgecheckt ist. Nicht committete Änderungen gehören zu keinem Commit. Der laufende Code weicht dann auch nach dem Neustart vom angezeigten Commit ab, bis die Änderungen committet oder verworfen sind und beide Prozesse erneut gestartet wurden.

Für die Fußzeile gilt die Abweichung bereits heute (technische Dokumentation Abschnitt 2.6). Die Grenze wird in der technischen Dokumentation (Abschnitt 9) und in der Anwenderdokumentation beschrieben (Abschnitt 7).

## 3. Oberfläche

### 3.1 Neue und geänderte Dateien

Die Tabelle nennt alle Dateien, die das Vorhaben anlegt oder ändert. Pfade, die mit `components/`, `docs/` oder `README.md` beginnen, gelten ab dem Wurzelverzeichnis des Repositorys, alle anderen ab `components/pipwerk-studio/frontend/`. Die Dateien, die nur wegen der Schreibweise nach E10 geändert werden, sind die Fundstellen auf `main` im Commit `9218e6f5d405f898e83a732413b29d48df99bbfe`. Maßgeblich für die Vollständigkeit ist die Prüfung nach Abschnitt 4.4, nicht diese Liste.

| Datei | Aufgabe |
|---|---|
| `components/pipwerk-studio/scripts/testenv` | Testumgebungsskript (Abschnitt 6.1) |
| `components/pipwerk-studio/scripts/check` | Prüfskript des Testers Funktion (Abschnitt 6.2) |
| `components/pipwerk-studio/backend/tests/test_testenv.py` | Test des Testumgebungsskripts (Abschnitt 4.3) |
| `components/pipwerk-studio/.gitignore` | Einträge `.testenv/` (Abschnitt 6.1) und `frontend/dist-e2e/` (Abschnitt 4.2) |
| `components/pipwerk-studio/README.md` | Satz zum Dialog und Schreibweise (Abschnitt 7) |
| `docs/technical/pipwerk-studio.md`, `docs/user/pipwerk-studio.md` | Dokumentation (Abschnitt 7) |
| `README.md`, `components/pipwerk-backtest/README.md`, `docs/user/README.md`, `docs/technical/README.md`, `docs/technical/glossar.md` | nur Schreibweise (E10, Abschnitt 7) |
| `components/pipwerk-studio/backend/src/pipwerk_studio/config.py`, `cli.py`, `app.py`, `revision.py` | Schreibweise in Fehlermeldung beim Start, Hilfetext, Detailtext der HTTP-Antwort, Protokolleinträgen, Titel und Texten der Schnittstellenbeschreibung, Docstrings und Kommentaren (E10). In `cli.py` außerdem der Umbruch des Hilfetexts (Abschnitt 4.4). Sonst unverändert. |
| `components/pipwerk-studio/backend/src/pipwerk_studio/__init__.py`, `settings_service.py`, `storage.py` | Schreibweise in Docstrings und Kommentaren (E10). Gelangt dabei ein Text in eine Ausgabe, zum Beispiel die Ausnahme in `settings_service.py`, gilt E10 (b). |
| `components/pipwerk-studio/backend/pyproject.toml`, `components/pipwerk-studio/backend/pipwerk-studio.example.ini` | Paketbeschreibung und Kommentare (E10) |
| `components/pipwerk-studio/backend/tests/test_cli.py`, `tests/test_studio_language.py` | Testtexte (E10) und angepasste Erwartungen an geänderte Texte |
| `components/pipwerk-studio/backend/tests/test_name.py` | Tests der Schreibweise in den Ausgaben des Backends (Abschnitt 4.4) |
| `index.html` | Titel der Seite „pipwerk Studio“ (E10) |
| `e2e/start-backend.mjs` | Kommentar (E10) |
| `src/test-setup.ts` | Ergänzung von `showModal()` und `close()` für jsdom (Abschnitt 4.1) |
| `src/AboutDialog.test.tsx`, `src/buildRevision.test.ts`, `src/repository.test.ts`, `src/commitDate.test.ts`, `src/timestamp.test.ts` | neue Frontend-Tests (Abschnitt 4.1) |
| `src/App.test.tsx` | Tests der Schaltfläche in der Kopfzeile (Abschnitt 4.1), Erwartung der Überschrift „pipwerk Studio“ (E10) |
| `buildinfo/gitRevision.test.ts` | Tests der Ermittlung beim Bau (Abschnitt 4.1) |
| `buildinfo/viteConfig.test.ts` | Test des Einsetzens in `vite.config.ts` für Bau und Entwicklungsserver (Abschnitt 4.1) |
| `e2e/studio.spec.ts` oder eine neue Datei `e2e/about.spec.ts` | Browsertests (Abschnitt 4.2); in `e2e/studio.spec.ts` außerdem Erwartung der Überschrift „pipwerk Studio“ (E10) |
| `playwright.config.ts` | Browsertest gegen die gebaute Oberfläche mit `vite preview` statt gegen den Entwicklungsserver (Abschnitt 4.2) |
| `buildinfo/gitRevision.ts` | Ermittlung von Kennung und Datum beim Bau (Abschnitt 3.4). Läuft nur in Node.js, nie im Browser. |
| `src/AboutDialog.tsx` | Dialog „Über pipwerk Studio“ mit den Eigenschaften `open` und `onClose` |
| `src/buildRevision.ts` | Lesen und Prüfen des beim Bau eingesetzten Werts (Abschnitt 3.4) |
| `src/repository.ts` | Adresse des Repositorys aus `package.json` mit Prüfung (Abschnitt 3.5) |
| `src/commitDate.ts` | Zerlegung eines Zeitstempels in Jahr, Monat, Tag, Stunde, Minute in Ortszeit. Die Funktion `localParts` aus `RevisionDisplay.tsx` wird hierher verschoben und von beiden Stellen verwendet. |
| `src/timestamp.ts` | Prüfung eines Zeitstempels auf Muster, echtes Kalenderdatum und gültige Uhrzeit. Die Prüfung `isTimestamp` aus `revisionApi.ts` wird hierher verschoben und von `revisionApi.ts`, `src/buildRevision.ts` und `buildinfo/gitRevision.ts` verwendet. |
| `src/vite-env.d.ts` | Typangabe des beim Bau eingesetzten Werts |
| `src/RevisionDisplay.tsx`, `src/revisionApi.ts` | nur die Verschiebungen oben, Verhalten unverändert |
| `src/locales/de.json`, `src/locales/en.json` | Texte des Dialogs und der Schaltfläche unter dem Schlüssel `about` |
| `src/styles.css` | Gestaltung von Dialog und Schaltfläche |
| `src/App.tsx` | Schaltfläche in der Kopfzeile und Einbindung des Dialogs (Abschnitt 3.6), Überschrift der Kopfzeile „pipwerk Studio“ (E10) |
| `package.json` | Feld `repository` (Abschnitt 3.5) |
| `vite.config.ts` | Einsetzen von Kennung und Datum (Abschnitt 3.4), Zugriff des Entwicklungsservers auf `LICENSE` (Abschnitt 3.6), Testdateien unter `buildinfo/`, Kommentar (E10) |
| `tsconfig.json` | `buildinfo` in `include` |

### 3.2 Aufbau des Dialogs

Der Dialog enthält von oben nach unten:

| Bestandteil | Inhalt Deutsch | Inhalt Englisch |
|---|---|---|
| Überschrift (`h2`, zugleich zugänglicher Name des Dialogs über `aria-labelledby`) | „Über pipwerk Studio“ | „About pipwerk Studio“ |
| Name | „pipwerk Studio“ | „pipwerk Studio“ |
| Stand | Bezeichnung „Stand“, Wert nach Abschnitt 3.3 | Bezeichnung „Revision“, Wert nach Abschnitt 3.3 |
| Lizenz | Bezeichnung „Lizenz“, Name „GNU General Public License, Version 3“, darunter der vollständige Lizenztext | Bezeichnung „License“, Name und Text identisch |
| Repository | Bezeichnung „Repository“, Verweis mit der Adresse als Text | Bezeichnung „Repository“, Verweis identisch |
| Schaltfläche | „Schließen“ | „Close“ |

Der Name „pipwerk Studio“ wird nicht übersetzt und in der Schreibweise aus dem [Projektziel](../../docs/design/projektziel.md) wiedergegeben. Die Bezeichnungen „Stand“ und „Revision“ entsprechen der Fußzeile.

Alle übersetzten Texte des Dialogs werden mit `useTranslation` gesetzt und folgen der Oberflächensprache jederzeit, auch bei offenem Dialog. Die Sprachauswahl ist bei offenem Dialog gesperrt. Die Sprache kann sich trotzdem ändern, wenn die Oberfläche die gespeicherte Sprache erneut vom Backend liest und dort eine andere steht (technische Dokumentation Abschnitt 2.4, zum Beispiel nach einer Änderung in einem zweiten Browserfenster und Rückkehr in das erste). Dann wechseln die Texte des offenen Dialogs sofort. Der Dialog bleibt dabei offen, der Fokus bleibt, wo er ist. Lizenzname, Lizenztext, Name und Adresse bleiben unverändert, weil sie nicht übersetzt werden.

Der Lizenztext steht in einem `pre`-Element mit `lang="en"`, fester Höhe und eigener Bildlaufleiste. Er ist mit der Tastatur erreichbar (`tabIndex=0`) und mit den Pfeiltasten verschiebbar. Zeilenumbrüche und Einrückungen bleiben wie in `LICENSE`. Der Name der Lizenz trägt ebenfalls `lang="en"`.

Der Verweis ist ein `a`-Element mit `href` gleich der Adresse, `target="_blank"` und `rel="noopener noreferrer"`. Sein Text ist die Adresse.

Beim Öffnen erhält die Schaltfläche „Schließen“ den Fokus (`autoFocus`). Die Schaltfläche schließt den Dialog mit `close()`. Die Escape-Taste löst das Ereignis `cancel` aus; der Browser schließt den Dialog. Beide Wege enden im Ereignis `close`, das `onClose` aufruft. Andere Wege zum Schließen gibt es nicht; das Attribut `closedby` wird nicht gesetzt.

Der Dialog passt sich der Fensterbreite an (höchstens 48rem breit, mindestens 16px Abstand zum Fensterrand) und ist höchstens 90 % der Fensterhöhe hoch. Bei kleinem Fenster schrumpft das Lizenzfeld, die Schaltfläche bleibt sichtbar.

### 3.3 Stand

Der Dialog liest den Stand aus `src/buildRevision.ts` (Abschnitt 3.4). Er stellt dafür keine Anfrage.

| Zustand | Anzeige Deutsch | Anzeige Englisch |
|---|---|---|
| Kennung und Datum gültig | „<commit> vom TT.MM.JJJJ, hh:mm Uhr“ | „<commit> from YYYY-MM-DD hh:mm“ |
| sonst: kein Wert eingesetzt, Kennung oder Datum fehlt oder ist ungültig | „unbekannt“ | „unknown“ |

`<commit>` ist die vollständige Kennung mit 40 Zeichen. Datum und Uhrzeit sind die Ortszeit des Browsers im 24-Stunden-Format. Die Formatierung erfolgt wie beim Tooltip mit eigenen, mit Nullen aufgefüllten Bestandteilen (`localParts` in `src/commitDate.ts`), nicht über `Intl` oder `toLocaleString` (technische Dokumentation Abschnitt 2.6).

### 3.4 Kennung und Datum beim Bau

`lookupGitRevision(directory)` in `buildinfo/gitRevision.ts`:

- `directory` ist das Verzeichnis von `vite.config.ts`, dort aus `import.meta.url` berechnet. Kein fester Pfad.
- Erster Aufruf: `git -C <directory> rev-parse HEAD`. Gültig ist nur eine Ausgabe, die nach Entfernen des abschließenden Zeilenumbruchs genau 40 Hexadezimalzeichen in Kleinbuchstaben ist.
- Nur bei gültiger Kennung zweiter Aufruf: `git -C <directory> log -1 --no-show-signature --format=%cI <commit>`. Gültig ist nur eine Ausgabe, die nach Entfernen des abschließenden Zeilenumbruchs genau ein Zeitstempel mit Zeitzonenangabe ist und die Prüfung aus `src/timestamp.ts` besteht.
- Beide Aufrufe mit `execFileSync`, fester Argumentliste, ohne Shell, Eingabe aus `ignore`, Zeitbegrenzung 5 Sekunden, Ausgabe als Text.
- Ergebnis ist `{ commit, committedAt }`, wenn beide Aufrufe gültig sind, sonst `null`. Jeder Fehler (Git nicht ausführbar, kein Git-Arbeitsbereich, Zeitüberschreitung, Exitcode ungleich 0, ungültige Ausgabe, Ausnahme) ergibt `null` und genau eine Warnung auf der Fehlerausgabe mit festem Text, zum Beispiel `pipwerk Studio: revision for the About dialog could not be determined`. Die Warnung enthält weder Git-Ausgabe noch Ausnahmetext noch Pfad noch Kennung. Der Bau läuft weiter.

`vite.config.ts` ruft `lookupGitRevision` einmal beim Laden der Konfiguration auf und setzt das Ergebnis mit `define` als `__PIPWERK_STUDIO_BUILD_REVISION__` ein (`JSON.stringify` des Ergebnisses). Das gilt für `vite build`, `vite` und `vite preview` gleichermaßen; `vite preview` liefert die bereits gebauten Dateien mit dem beim Bau eingesetzten Wert aus.

`src/buildRevision.ts` liest `__PIPWERK_STUDIO_BUILD_REVISION__` und prüft den Wert erneut: ein Objekt mit genau den Feldern `commit` (40 Hexadezimalzeichen in Kleinbuchstaben) und `committedAt` (Prüfung aus `src/timestamp.ts`), sonst `null`. Exportiert wird eine Funktion `parseBuildRevision(value: unknown)` und ihr Ergebnis für den eingesetzten Wert. Der Dialog verwendet nur dieses Ergebnis.

### 3.5 Adresse des Repositorys

`package.json` erhält:

```json
"repository": {
  "type": "git",
  "url": "https://github.com/macodix/pipwerk"
}
```

`src/repository.ts` liest `repository.url` über den JSON-Import von Vite und prüft sie gegen `^https://github\.com/[A-Za-z0-9-]+/[A-Za-z0-9._-]+$`. Exportiert werden eine Funktion `parseRepositoryUrl(value: unknown)`, die die geprüfte Adresse oder `null` liefert, und ihr Ergebnis für den Wert aus `package.json`. Die Prüfung wirft keine Ausnahme.

Besteht die Adresse die Prüfung nicht, zeigt der Dialog bei „Repository“ den Text „unbekannt“ beziehungsweise „unknown“ ohne Verweis. Die übrige Oberfläche und der Dialog arbeiten normal. Dieser Fall ist ein Programmfehler und kommt in einer geprüften Oberfläche nicht vor: Ein Frontend-Test prüft, dass die Adresse aus `package.json` genau `https://github.com/macodix/pipwerk` lautet, und lässt die Prüfung sonst scheitern.

### 3.6 Lizenztext und Aufrufstelle

Lizenztext: `AboutDialog.tsx` importiert `LICENSE` aus dem Wurzelverzeichnis des Repositorys mit dem Zusatz `?raw`. Vite schreibt den Text beim Bau in die ausgelieferten Dateien. Fehlt die Datei, schlägt der Import fehl: `npm run build` und `npm test` enden mit einem Fehler, der Entwicklungsserver meldet den Fehler beim Laden der Seite (E7). Einen Ersatztext gibt es nicht. Der Entwicklungsserver liefert Dateien außerhalb des Verzeichnisses `frontend` nur aus, wenn sie freigegeben sind. `vite.config.ts` ergänzt deshalb `server.fs.allow` um genau die Datei `LICENSE`, als Pfad relativ zur Konfigurationsdatei berechnet, und behält die Standardfreigabe des Projektverzeichnisses bei (`searchForWorkspaceRoot`). Ein Frontend-Test prüft, dass der angezeigte Text Zeichen für Zeichen mit `LICENSE` übereinstimmt.

Aufrufstelle nach req-ui-010: eine Schaltfläche (`button`, `type="button"`) in der Kopfzeile rechts neben der Sprachauswahl, Beschriftung „Über pipwerk Studio“ beziehungsweise „About pipwerk Studio“ nach Oberflächensprache. Sie ist mit Maus und Tastatur bedienbar. `App.tsx` hält den Zustand „offen“, öffnet den Dialog mit der Schaltfläche und schließt ihn über `onClose`. Nach dem Schließen erhält die Schaltfläche wieder den Fokus; `App.tsx` setzt ihn ausdrücklich und verlässt sich nicht auf das Verhalten des Browsers.

## 4. Tests

### 4.1 Frontend-Tests (Vitest)

jsdom bildet `showModal()` und `close()` nicht vollständig nach. `src/test-setup.ts` ergänzt beide für `HTMLDialogElement` so, dass sie das Attribut `open` setzen beziehungsweise entfernen und `close` das Ereignis `close` auslöst. Die Sperrung der übrigen Oberfläche weist der Browsertest nach (Abschnitt 4.2).

Die Include-Liste von Vitest wird um `buildinfo/**/*.test.ts` ergänzt. Diese Tests laufen in der Umgebung `node`.

Geprüft wird mindestens:

- Schaltfläche in der Kopfzeile rechts neben der Sprachauswahl, Beschriftung in Deutsch und Englisch, Öffnen mit Maus und Tastatur, Fokus nach dem Schließen wieder auf der Schaltfläche
- Überschrift, Name, Bezeichnungen und Schaltfläche „Schließen“ in Deutsch und Englisch; Name unübersetzt
- Sprachwechsel bei offenem Dialog (Sprache in i18next geändert, wie nach erneutem Lesen vom Backend): Texte wechseln sofort, Dialog bleibt offen, Lizenz, Name und Adresse unverändert
- Stand für beide Zustände aus Abschnitt 3.3: Formatierung bei fest eingestellten Zeitzonen, Auffüllen mit Nullen, Tageswechsel durch die Zeitzone, „unbekannt“ bei `null`
- `parseBuildRevision`: gültiger Wert; jede Abweichung einzeln ergibt `null` (kein Objekt, Feld fehlt, zusätzliches Feld, Kennung falsch lang, Großbuchstaben, Datum fehlt, Datum kein Text, Datum ohne Zeitzone, unmögliches Datum, Kennung ohne Datum)
- `lookupGitRevision`: echtes Git in einem temporären Repository mit festem Committer-Datum ergibt Kennung und Datum; kein Git-Arbeitsbereich (temporäres Verzeichnis außerhalb jedes Arbeitsbereichs, `GIT_DIR`, `GIT_WORK_TREE` und `GIT_CEILING_DIRECTORIES` kontrolliert; ohne installiertes Git übersprungen mit Begründung) ergibt `null`; Git nicht ausführbar, Zeitüberschreitung, Exitcode ungleich 0, ungültige Kennung, ungültiges Datum und Ausnahme ergeben je `null` und genau eine Warnung ohne Git-Ausgabe, Ausnahmetext, Pfad und Kennung (mit unverwechselbaren Markierungstexten belegt); kein zweiter Aufruf ohne gültige Kennung; Aufruf ohne Shell mit fester Argumentliste
- Lizenzname, Lizenztext identisch mit `LICENSE`, `lang="en"`, Lizenzfeld mit der Tastatur erreichbar
- Verweis mit `href`, `target="_blank"`, `rel="noopener noreferrer"` und der Adresse als Text
- Schließen mit der Schaltfläche und mit dem Ereignis `cancel`; Fokus beim Öffnen auf „Schließen“
- Der Dialog stellt keine Netzwerkanfrage (`fetch` wird beim Öffnen nicht aufgerufen)
- `repository.ts`: Adresse aus `package.json` genau `https://github.com/macodix/pipwerk`; `parseRepositoryUrl` lehnt abweichende Formen ab (anderer Rechner, `http`, zusätzlicher Pfad, Abfrageteil, Leerzeichen, kein Text) ohne Ausnahme; Dialog zeigt bei `null` „unbekannt“ ohne Verweis
- Vollständigkeit der Übersetzungen (bestehender Test)
- Fußzeile und Tooltip unverändert (bestehende Tests bestehen ohne Änderung ihrer Erwartungen)
- Überschrift der Kopfzeile „pipwerk Studio“ in Deutsch und Englisch (E10). Die bestehenden Tests in `src/App.test.tsx` ändern dafür nur die Erwartung an die Schreibweise.
- `vite.config.ts`: Die Konfiguration, geladen für den Bau (`command: 'build'`) und für den Entwicklungsserver (`command: 'serve'`), setzt `__PIPWERK_STUDIO_BUILD_REVISION__` jeweils auf `JSON.stringify` des Ergebnisses von `lookupGitRevision` für das Verzeichnis der Konfiguration. Der Erwartungswert ist das Ergebnis eines eigenen Aufrufs von `lookupGitRevision` für dieses Verzeichnis im Test. Damit ist nachgewiesen, dass Bau und Entwicklungsserver den Stand auf demselben Weg beim Laden der Konfiguration erhalten (E3, Grenze im Entwicklungsbetrieb).

### 4.2 Browsertest (Playwright)

Der Browsertest läuft gegen die gebaute Oberfläche, so wie die Testumgebung sie ausliefert (E9, Abschnitt 6.1). `playwright.config.ts` startet dafür im `webServer` der Oberfläche statt des Entwicklungsservers nacheinander `vite build --outDir dist-e2e` und `vite preview --outDir dist-e2e --port <port>` mit `PIPWERK_STUDIO_BACKEND_URL` auf das Backend des Tests. Das Backend startet wie bisher `e2e/start-backend.mjs` aus demselben Arbeitsverzeichnis. Das eigene Ausgabeverzeichnis `frontend/dist-e2e/` lässt eine Oberfläche in `frontend/dist` unberührt und steht in `.gitignore`. Die Zeitbegrenzung des `webServer` deckt die Dauer des Baus ab. Ports bleiben wie bisher Parameter. Alle bestehenden Browsertests laufen damit ebenfalls gegen die gebaute Oberfläche.

In Chromium, Firefox und WebKit:

- Dialog öffnen über die Schaltfläche in der Kopfzeile mit Maus und mit Tastatur, Inhalte in beiden Sprachen
- Stand gleich `git rev-parse HEAD` und dem Datum aus `git log -1 --format=%cI` in der fest eingestellten Zeitzone des Testbrowsers; der Erwartungswert wird im Test unabhängig vom Produktionscode berechnet. Damit ist nachgewiesen, dass der Stand beim Bau in die ausgelieferten Dateien geschrieben wird und dem Commit entspricht, aus dem gebaut wurde. Ohne Git-Arbeitsbereich „unbekannt“ (übersprungen, wenn der Arbeitsbereich ein Git-Arbeitsbereich ist, wie beim bestehenden Test der Fußzeile).
- Kennung im Dialog gleich der Kennung im Tooltip der Fußzeile. Gebaute Oberfläche und Backend stammen dabei wie in der Testumgebung aus demselben Arbeitsverzeichnis auf demselben Commit (E9). Der Browsertest prüft nicht, ob das Arbeitsverzeichnis nicht committete Änderungen hat; das weist der Test in Abschnitt 4.3 für das Testumgebungsskript nach.
- Beim Öffnen und bei offenem Dialog entsteht keine Anfrage an eine andere Adresse als die der Testumgebung. Jede solche Anfrage lässt den Test scheitern.
- Sperrung: Bei offenem Dialog lassen sich Sprachauswahl und Schaltfläche „Über pipwerk Studio“ weder mit der Maus noch mit der Tabulatortaste erreichen; der Fokus bleibt im Dialog.
- Schließen: Escape schließt, „Schließen“ schließt, ein Klick neben den Dialog schließt nicht. Danach liegt der Fokus auf der Schaltfläche „Über pipwerk Studio“.
- Verweis öffnet sich in einem neuen Tab mit der Adresse (neue Seite im Browserkontext; die Seite selbst wird über `page.route` abgefangen und nicht geladen).
- Bestehende Prüfungen von Fußzeile und Tooltip bestehen unverändert.
- Überschrift der Kopfzeile und Titel der Seite im Browser lauten „pipwerk Studio“ (E10). Die bestehende Prüfung der Überschrift ändert dafür nur die Erwartung an die Schreibweise.

### 4.3 Test des Testumgebungsskripts (pytest)

`components/pipwerk-studio/backend/tests/test_testenv.py` läuft mit den übrigen Backend-Tests (technische Dokumentation Abschnitt 6.1) und damit auch im Prüfskript. Er ruft `testenv start` in einem Nachbau des Repositorys in einem temporären Verzeichnis auf, je Fall frisch angelegt:

- Inhalt: genau die versionierten Dateien `LICENSE` und `components/pipwerk-studio/**` (ermittelt mit `git ls-files` im Repository, in dem der Test läuft), in derselben Verzeichnisstruktur wie im Repository. Ignorierte Inhalte wie `.testenv/`, `backend/.venv/`, `frontend/node_modules/` und `frontend/dist/` werden nicht übernommen. Vor jedem Aufruf stellt der Test fest, dass `components/pipwerk-studio/.testenv/` und `components/pipwerk-studio/frontend/dist/` nicht vorhanden sind.
- Git: In den Fällen mit Git ist das temporäre Verzeichnis die Wurzel eines frisch angelegten Repositorys mit einem Commit dieses Inhalts. Im Fall ohne Git wird derselbe Inhalt ohne `git init` angelegt. Git wird über `GIT_CEILING_DIRECTORIES` und ohne geerbte `GIT_DIR` und `GIT_WORK_TREE` von umgebenden Arbeitsbereichen getrennt.
- `uv`, `npm` und `npx` sind im Suchpfad durch Platzhalterprogramme ersetzt, die jeden Aufruf in einer Datei vermerken und sofort mit Exitcode 1 enden. Der Test wird mit Begründung übersprungen, wenn Git nicht installiert ist oder wenn der Arbeitsbereich, in dem er läuft, kein Git-Arbeitsbereich ist (zum Beispiel ein entpacktes Archiv des Repositorys, E5). Im zweiten Fall liefert `git ls-files` keine Dateiliste für den Nachbau. Das Überspringen folgt derselben Regel wie die Fälle des Browsertests, die vom Git-Arbeitsbereich abhängen (Abschnitt 4.2).

Geprüft wird mindestens:

- geänderte versionierte Datei innerhalb der Komponente: `start` endet mit Exitcode ungleich 0 und einer Fehlermeldung zur Ursache
- geänderte `LICENSE` im Wurzelverzeichnis, also außerhalb der Komponente: ebenso
- nicht ignorierte neue Datei innerhalb der Komponente: ebenso
- nicht ignorierte neue Datei im Wurzelverzeichnis außerhalb der Komponente: ebenso
- Inhalt ohne Git: ebenso
- in allen fünf Fällen: kein Platzhalterprogramm wurde aufgerufen, `.testenv/` und `frontend/dist/` sind nicht vorhanden, es läuft danach kein vom Skript gestarteter Prozess
- Gegenprobe ohne Änderungen und nur mit ignorierten neuen Dateien (zum Beispiel unter `components/pipwerk-studio/frontend/node_modules/`): die Prüfung lässt den Start zu, das erste Platzhalterprogramm wird aufgerufen; `start` endet danach wegen des Platzhalters mit Fehler und hinterlässt keine laufenden Prozesse

### 4.4 Schreibweise des Namens (E10)

Backend-Tests in `components/pipwerk-studio/backend/tests/test_name.py` (pytest) prüfen mindestens die folgenden Texte. „Richtig geschrieben“ heißt: Jede Zeichenfolge `pipwerk[ -]studio` im Text (ohne Beachtung der Groß- und Kleinschreibung) lautet genau „pipwerk Studio“ oder genau den Bezeichner `pipwerk-studio` in Kleinbuchstaben, wie bei der Suche unten, und jedes Vorkommen des ganzen Worts „Studio“ (Groß- und Kleinschreibung beachtet, Wortgrenzen wie bei `\bStudio\b`) steht unmittelbar nach „pipwerk “. Geprüft wird jeweils der Text, so wie pipwerk Studio ihn ausgibt, einschließlich des Programmnamens `pipwerk-studio`, den die Kommandozeile Hilfetext und Fehlermeldungen voranstellt.

- Fehlermeldung beim Start ohne Startkonfiguration, als vollständige Ausgabe auf der Fehlerausgabe: enthält „pipwerk Studio“ und ist richtig geschrieben
- Hilfetext der Kommandozeile (`--help`): ebenso, jeweils bei den Breiten 40, 80 und 200 Zeichen (Umgebungsvariable `COLUMNS` im Test gesetzt). Zusätzlich sind die Zeilen der Beschreibung und der Hilfetexte der Parameter bei allen drei Breiten gleich, verglichen ohne die führenden Leerzeichen. Die Einrückung vergleicht der Test nicht, weil argparse sie nach der Breite wählt.
- Detailtext der HTTP-Antwort bei ungültiger gespeicherter Sprache: ebenso
- Protokolleinträge, wenn Stand oder Datum des Commits nicht ermittelbar sind: ebenso
- Protokolleinträge beim Lesen einer ungültigen gespeicherten Sprache: richtig geschrieben
- Schnittstellenbeschreibung (`/openapi.json`): `info.title` lautet genau „pipwerk Studio“. Richtig geschrieben sind `info.description`, falls vorhanden, unter `paths` jedes Feld `summary` und `description` an beliebiger Stelle und unter `components.schemas` jedes Feld `description` an beliebiger Stelle, einschließlich der Beschreibungen der Eigenschaften. Nicht geprüft werden die Felder `title` unter `components.schemas` und unter `paths`: Pydantic und FastAPI erzeugen sie aus Namen von Klassen, Feldern und Parametern, zum Beispiel `StudioLanguage`; sie sind Bezeichner nach E10. Ebenso nicht geprüft werden die Namen der Schemas und die Pfade.

Umbruch des Hilfetexts: argparse bricht Beschreibung und Hilfetexte der Parameter sonst nach der Breite des Terminals an Leerzeichen um und könnte den Namen zwischen „pipwerk“ und „Studio“ trennen. Der Parser in `cli.py` verwendet deshalb `argparse.RawTextHelpFormatter`. Beschreibung und Hilfetexte enthalten ihre Zeilenumbrüche selbst und stehen bei jeder Breite mit denselben Zeilen in der Ausgabe, wie sie im Programmcode stehen. Nur die Einrückung der Hilfetexte der Parameter wählt argparse nach der Breite (laut Quelltext von argparse, nicht am Rechner geprüft). Der Name steht darin nie getrennt. Die Zeilen sind so umbrochen, dass der Hilfetext bei 80 Zeichen Breite keine Zeile länger als 80 Zeichen hat. Die Zeile `usage:` bricht argparse weiter nach der Breite um; sie enthält nur den Programmnamen `pipwerk-studio` und die Parameter, nicht den Namen pipwerk Studio. Bricht ein Terminal eine zu lange Zeile bei der Anzeige um, ist das eine Darstellung des Terminals, keine Ausgabe von pipwerk Studio.

Für den Rest gilt eine Suche im Repository, die das Prüfskript ausführt (Abschnitt 6.2): `git grep` ohne Beachtung der Groß- und Kleinschreibung nach `pipwerk[ -]studio` über alle versionierten Dateien außer unter `docs/design/` und `development/` und außer den beiden Dateien, die die unzulässigen Schreibweisen als Prüfwert enthalten dürfen: `components/pipwerk-studio/backend/tests/test_name.py` und `components/pipwerk-studio/scripts/check`. Zulässig sind nur Treffer, die genau „pipwerk Studio“ oder genau den Bezeichner `pipwerk-studio` in Kleinbuchstaben lauten. Jeder andere Treffer, zum Beispiel „Pipwerk Studio“, „pipwerk studio“ oder „Pipwerk-Studio“, lässt die Prüfung scheitern. Die technische Dokumentation beschreibt die Prüfung deshalb, ohne unzulässige Schreibweisen wörtlich zu nennen. Die Kurzform „Studio“ in Dokumentation und Ausgaben ist mit einer Suche nicht sicher von Bezeichnern zu trennen. Sie prüfen die Tests oben für die Ausgaben und der Tester Funktion bei der Prüfung der Dokumentation.

## 5. Sicherheit

- Die Oberfläche erhält keinen neuen Netzwerkzugriff. Der Dialog stellt keine Anfrage, weder an das Backend noch nach außen.
- Beim Bau startet `buildinfo/gitRevision.ts` bis zu zwei Git-Unterprozesse mit fester Argumentliste, ohne Shell, ohne Eingaben von außen (die Kennung stammt aus dem ersten Aufruf und wird zuvor geprüft) und mit Zeitbegrenzung. Warnungen enthalten keine Git-Ausgabe, keinen Ausnahmetext und keinen Pfad.
- Der eingesetzte Wert wird im Browser erneut geprüft; nur ein geprüfter Wert wird angezeigt. Alle Texte setzt React als Text, nie als HTML.
- Kennung und Datum des Commits stehen in den ausgelieferten Dateien. Beide sind öffentlich, weil das Repository öffentlich ist (geprüft am 13.10.2026).
- Der Verweis öffnet den neuen Tab mit `noopener noreferrer`; die geöffnete Seite erhält keinen Zugriff auf pipwerk Studio.
- Der Lizenztext wird als Text gesetzt, nicht als HTML.
- Im Backend ändern sich nur Texte (E10) und der Umbruch des Hilfetexts (Abschnitt 4.4); Verhalten, Endpunkte und Datenformate bleiben unverändert. Die geänderten Texte enthalten keine neuen Angaben, nur die andere Schreibweise des Namens. Die Freigabe in `server.fs.allow` gilt nur für die Datei `LICENSE`.

## 6. Skripte der Komponente

Das [Entwicklungsverfahren](../../docs/technical/entwicklungsverfahren.md#skripte-je-komponente) verlangt je Komponente ein Testumgebungsskript und ein Prüfskript. pipwerk Studio hat beide noch nicht.

### 6.1 Testumgebungsskript (Entwickler)

`components/pipwerk-studio/scripts/testenv`, POSIX-Shell, aufgerufen aus einem beliebigen Verzeichnis mit absolutem Pfad:

```text
testenv start --frontend-port <port> --backend-port <port> [--host <adresse>]
testenv stop
testenv status
```

- Arbeitet auf dem Arbeitsverzeichnis, in dem das Skript liegt; das Verzeichnis wird aus dem Pfad des Skripts bestimmt.
- `start` prüft zuerst, dass das Verzeichnis des Skripts in einem Arbeitsverzeichnis von Git liegt, und ermittelt dessen Wurzel (`git rev-parse --show-toplevel`). Dann prüft es mit `git status --porcelain` für die ganze Wurzel, also das ganze Repository einschließlich `LICENSE`, dass es keine nicht committeten Änderungen und keine nicht ignorierten neuen Dateien gibt. Sonst bricht es mit einer Fehlermeldung ab, bevor etwas installiert, gebaut oder gestartet wird (E9). Die Fehlermeldung nennt die Ursache.
- `start` installiert die Abhängigkeiten nach den Lockdateien (`uv sync --frozen`, `npm ci`), baut die Oberfläche (`npm run build`), legt unter `components/pipwerk-studio/.testenv/` eine INI mit eigener SQLite-Datei an, startet das Backend mit `-c` auf `127.0.0.1:<backend-port>` und die gebaute Oberfläche mit `vite preview` auf `<host>:<frontend-port>`. `vite preview` leitet `/api` an das Backend weiter (`PIPWERK_STUDIO_BACKEND_URL`). `--host` ist ohne Angabe `127.0.0.1`.
- Prozesskennungen und Protokolle liegen in `.testenv/`. `start` bricht ab, wenn dort schon eine laufende Testumgebung verzeichnet ist oder ein Port belegt ist. `start` endet erst, wenn `/api/health` über den Port der Oberfläche `{"status": "ok"}` liefert, sonst mit Fehler und beendeten Prozessen.
- `stop` beendet beide Prozesse und entfernt `.testenv/`. `status` nennt, ob die Testumgebung läuft, und ihre Ports.
- `.testenv/` steht in `components/pipwerk-studio/.gitignore`.
- Keine festen Ports, Pfade oder Rechnernamen im Skript.
- Beschreibung in der technischen Dokumentation der Komponente.

### 6.2 Prüfskript (Tester Funktion)

`components/pipwerk-studio/scripts/check` führt die Prüfungen aus Abschnitt 6.1 bis 6.3 der technischen Dokumentation und die Suche nach Abschnitt 4.4 aus und endet mit Exitcode 0 nur, wenn alle bestehen. Ports des Browsertests sind Parameter. Das Skript legt der Tester Funktion in seinem Zweig an; der Entwickler schreibt es nicht.

## 7. Dokumentation

| Dokument | Änderung |
|---|---|
| `docs/technical/pipwerk-studio.md` | Abschnitt zum Dialog mit den Entscheidungen E1 bis E9, Ermittlung beim Bau, Bau bricht ohne `LICENSE` ab, neue Dateien in Abschnitt 2.3, Unterprozesse beim Bau in Abschnitt 8, Tests in Abschnitt 6 (Abschnitt 6.3: Browsertest gegen die gebaute Oberfläche mit `vite preview`), Skripte der Komponente mit einem neuen Abschnitt „Start als Testumgebung“ neben Abschnitt 4 „Einrichtung und Start im Entwicklungsbetrieb“, Grenze im Entwicklungsbetrieb in Abschnitt 9. In Abschnitt 9 wird der Punkt „Installation, Paketierung und Start außerhalb der Entwicklungsumgebung sind nicht festgelegt“ ersetzt: Außerhalb des Entwicklungsbetriebs startet pipwerk Studio mit dem Testumgebungsskript; Installation und Paketierung sind nicht festgelegt. Tests der Schreibweise und Suche im Repository nach Abschnitt 4.4 in Abschnitt 6. Schreibweise nach E10 im ganzen Dokument, einschließlich Titel und Überschriften; wiedergegebene Ausgaben wie die Fehlermeldung beim Start und der Detailtext bei ungültiger gespeicherter Sprache lauten so, wie das Backend sie nach der Änderung ausgibt. Der Satz „Der Produktname … wird nicht übersetzt“ nennt „pipwerk Studio“. |
| `docs/user/pipwerk-studio.md` | siehe unten |
| `components/pipwerk-studio/README.md` | Satz zum Dialog in der Beschreibung des Stands, Schreibweise nach E10 einschließlich Überschrift |
| `README.md`, `components/pipwerk-backtest/README.md`, `docs/user/README.md`, `docs/technical/README.md`, `docs/technical/glossar.md` | Schreibweise nach E10, auch in Überschriften und Verweistexten. Dateinamen und Pfade bleiben. |

Für alle Dokumente gilt E10: Jede Nennung von pipwerk Studio lautet „pipwerk Studio“, auch am Satzanfang, in Überschriften, in Titeln der Dokumente und in Zusammensetzungen. Zusammensetzungen wie „Pipwerk-Studio-Komponente“ oder „Studio-Komponente“ werden so umformuliert, dass der Name als „pipwerk Studio“ steht, zum Beispiel „die Komponente pipwerk Studio“. Gibt ein Satz einen Text wieder, den pipwerk Studio anzeigt oder ausgibt, steht er so, wie pipwerk Studio ihn nach der Änderung anzeigt oder ausgibt.

Die Anwenderdokumentation beschreibt in ganzen Sätzen nach req-system-021:

- pipwerk Studio öffnen (Abschnitt 2, bisher „Pipwerk Studio öffnen“): zwei Wege, pipwerk Studio zu starten, nach req-ui-010. Erstens die Testumgebung: was sie ist (pipwerk Studio, gebaut und gestartet aus genau einem Commit), Voraussetzungen mit Verweis auf die technische Dokumentation, Start, Abfrage und Ende mit dem Testumgebungsskript (`start` mit den zwei Ports, `status`, `stop`), dass der Start bei nicht committeten Änderungen abbricht, und die Adresse im Browser mit dem gewählten Port der Oberfläche. Zweitens der Entwicklungsbetrieb wie bisher, mit dem Hinweis, dass Änderungen an den Dateien dort sofort wirken. Der bisherige Satz „Pipwerk Studio kann derzeit nur in einer Entwicklungsumgebung gestartet werden“ wird entsprechend ersetzt.
- Aufbau der Oberfläche (Abschnitt 3): die neue Schaltfläche in der Kopfzeile; der Name in der Kopfzeile lautet „pipwerk Studio“
- einen neuen Abschnitt zum Dialog „Über pipwerk Studio“: Öffnen mit Maus und Tastatur, alle Inhalte, die zwei Anzeigen des Stands mit Beispiel und der Bedeutung von „unbekannt“, Anzeige „unbekannt“ beim Repository, gesperrte übrige Oberfläche, Schließen mit „Schließen“ und Escape, Rückkehr des Fokus auf die Schaltfläche, Sprachwechsel bei offenem Dialog
- dass der Stand im Dialog in der Testumgebung genau der Commit ist, aus dem pipwerk Studio läuft, und dass Dialog und Fußzeile dort denselben Commit nennen, der Dialog ihn aber vollständig mit Datum zeigt (E9). Dazu die Abweichung im Entwicklungsbetrieb: der Dialog nennt den Commit vom Start der Programme, mit allen drei Punkten der Grenze aus Abschnitt 2, einschließlich dessen, dass bei nicht committeten Änderungen auch ein Neustart die Abweichung nicht beseitigt.
- dass die Anzeige im Dialog keine Internetverbindung braucht, das Öffnen des Verweises auf das Repository aber schon
- einen neuen Abschnitt „Glossar“ mit den Begriffen, die die Anwenderdokumentation verwendet und die ohne Vorwissen nicht verständlich sind, mindestens Commit, Kennung (eines Commits), Stand, Repository, Lizenz, Hintergrunddienst, Tooltip, Testumgebung, Testumgebungsskript, Entwicklungsbetrieb, Port und nicht committete Änderung. Bestehende Erklärungen im Fließtext bleiben und verweisen auf das Glossar.

## 8. Nicht Gegenstand

- Die Dokumente unter `docs/design/` (Anforderungen, Projektziel, Planung, Präsentationen). Sie gehören dem Auftraggeber beziehungsweise dem Projektleiter; der Softwarearchitekt und sein Team ändern sie nicht. Fundstellen der alten Schreibweise dort nennt Abschnitt 9.
- Die Dokumente unter `development/` (Übergabedokumente, Prüfberichte, Fragen, Meldungen). Sie halten den Ablauf so fest, wie er war.
- Bezeichner nach E10, zum Beispiel `pipwerk-studio`, `pipwerk_studio`, `PIPWERK_STUDIO_*`, `/api/studio/…` und `StudioLanguage`.
- Die Namen der anderen Komponenten, zum Beispiel „Pipwerk Backtest“. req-ui-010 regelt nur den Namen von pipwerk Studio.
- Der Einstellungsbereich und der Menüpunkt „Einstellungen“ nach req-ui-009.
- Änderungen am Verhalten des Backends und an `GET /api/studio/revision`; im Backend ändern sich nur Texte nach E10 und der Umbruch des Hilfetexts (Abschnitt 4.4). Die Fußzeile bezieht ihren Stand weiter vom Backend.

## 9. Hinweise für den Auftraggeber

Die Abweichung im Entwicklungsbetrieb (N1 aus [specification-2.md](reviews/specification-2.md), D1 aus [specification-3.md](reviews/specification-3.md)) hat der Auftraggeber mit der Antwort auf Frage [ablauftest-02](questions/ablauftest-02.md) entschieden. Sie steht jetzt in req-ui-010 und ist in E9, im Absatz „Grenze im Entwicklungsbetrieb“ und in Abschnitt 7 umgesetzt.

Die QA hat im Prüfbericht [specification-1.md](reviews/specification-1.md) zwei Fragen genannt, die über req-ui-010 hinausgehen. S7 zur Schreibweise des Namens an den übrigen Stellen ist mit der Antwort auf Frage [ablauftest-04](questions/ablauftest-04.md) entschieden und in E10 umgesetzt. Von S8 hängt die Spezifikation nicht ab. Sie wird hier zur Vorlage beim Auftraggeber festgehalten:

- S8: req-ui-010 setzt die Schaltfläche rechts neben die Sprachauswahl. req-ui-009 verlegt die Sprachauswahl später in den Einstellungsbereich. Wo steht die Schaltfläche dann?

Hinweis an den Projektleiter: In Dokumenten unter `docs/design/`, die das Vorhaben nicht ändert (Abschnitt 8), steht der Name noch in anderer Schreibweise, Stand Commit `9218e6f5d405f898e83a732413b29d48df99bbfe`: „Pipwerk Studio“ in `docs/design/planning/praesentation-schritt-1.html`, `docs/design/planning/pflichtenheft-strategiedesigner.md`, `docs/design/planning/entwicklungsplan-strategiedesigner.md`, `docs/design/planning/workpackages/AP5-web-api-und-ablage.md` und `docs/design/planning/workpackages/workpackages.csv`; „pipwerk studio“ im Änderungsnachweis von `docs/design/requirements/anforderungen-strategiedesigner.md`. Ob „ebenso in der Dokumentation“ in req-ui-010 diese Dokumente umfasst, entscheidet der Auftraggeber; die Spezifikation hängt davon nicht ab.
