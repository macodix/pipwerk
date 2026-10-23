# Arbeitspaketplan Vorhaben strategiedesign

## Status

- status: `draft`
- stand: 2026-10-23
- komponenten: `packages/domain-core`, `components/pipwerk-studio`, `contracts/`
- grundlage: [specification.md](specification.md) in der Fassung vom 2026-10-23, abgestimmt mit dem Auftraggeber am 2026-10-23 ([Präsentation](presentations/specification-3.html), Einwände zu den Punkten 23 und 24 in seinen Dokumenten festgelegt), Abschnitt 10 Punkte 9 bis 13, 21 und 22 vorläufig bis zu seinem Test. `wp01` beruht auf der Fassung vom 2026-10-16 ([Präsentation](presentations/specification-1.html)).
- prüfung: Fassung vom 2026-10-16: Durchlauf 1 [plan-1.md](reviews/plan-1.md) bestanden, Hinweise P1 bis P9 eingearbeitet; Durchlauf 2 [plan-2.md](reviews/plan-2.md), Nachprüfung, bestanden. Neufassung von `wp02` und `wp03` vom 2026-10-20: Durchlauf 3 [plan-3.md](reviews/plan-3.md) bestanden, Hinweise H1 bis H5 und H7 eingearbeitet, H6 in der Spezifikation, ohne weitere Prüfung. Anpassung von `wp02` und `wp03` vom 2026-10-23: Durchlauf 4.
- bestätigung: Neufassung von `wp02` und `wp03` vom Auftraggeber im Chat am 2026-10-20 bestätigt, ohne eigene Präsentation (Abnahmekriterien im Chat vorgelegt). Anpassung vom 2026-10-23 offen. Der Auftraggeber prüft bei der Abnahme nach eigenem Ermessen, die Abnahmekriterien sind keine abschließende Liste.

## Übersicht

| Paket | Titel | hängt ab von | Stand |
|---|---|---|---|
| `wp01` | Bibliothek und Web-API | – | `done` |
| `wp02` | Strategien gestalten in der Oberfläche | `wp01` | `open` |
| `wp03` | Vorlagen in der Oberfläche | `wp02` | `open` |

Die Pakete folgen den Schichten der Spezifikation: Die Oberfläche kennt keine einzelnen Typen und braucht deshalb die Typbeschreibungen, die Konsistenzprüfung und die Ablage über die Web-API (E2). `wp01` hat Bibliothek und Web-API in der Fassung der Spezifikation vom 2026-10-16 umgesetzt. `wp02` wurde nicht abgenommen ([Abnahmebericht](wp02/acceptance/1.md), Mängel M1 bis M17); die Spezifikation ist danach neu gefasst. `wp02` bringt deshalb Bibliothek und Web-API auf die neue Fassung (Format 2.0) und baut die Oberfläche neu auf. Die zweite Abnahme auf Commit `2cac35b` ([Abnahmebericht](wp02/acceptance/2.md)) wurde nach geänderten Anforderungen zur Darstellung und Verwendung von Objekten abgebrochen; `wp02` setzt die Spezifikation in der Fassung vom 2026-10-23 auf diesem Stand um, in der bestehenden Oberfläche (E8). Es endet mit dem Nachweis des Vorhabens, dass sich `str-01` und `str-03` in der Oberfläche ohne Anleitung gestalten, speichern und laden lassen. Beide Testfälle brauchen nur mitgelieferte Typen, die mitgelieferte Regelvorlage und Regeln, die in der Strategie entstehen. Das Anlegen und Verwalten eigener Vorlagen folgt deshalb in `wp03`, nach Entscheidung des Auftraggebers vom 2026-10-19 erst nach `wp02`.

`wp02` bleibt ein Paket, obwohl es Bibliothek, Web-API und Oberfläche umfasst: Der Auftraggeber prüft die Bedienung, und nur ein Paket mit Oberfläche gibt ihm ein Ergebnis, das er selbst prüfen kann. Innerhalb des Pakets laufen die Aufträge für Bibliothek und Web-API und für die Oberfläche nebeneinander, soweit die Oberfläche nur die Web-API nach 4.2 voraussetzt.

Abschnittsangaben beziehen sich auf die [Spezifikation](specification.md). Die vollständigen Listen der Kennungen, die Grenzwerte gegen Überlast (Abschnitt 8) und die Einzelheiten der Tests legen die Aufträge fest.

Die Hinweise der QA aus [specification-2.md](reviews/specification-2.md) und [specification-3.md](reviews/specification-3.md), die nach dem Vermerk der Bestätigung den Aufträgen überlassen sind, erledigen die Aufträge der Pakete: S16, S17, S18, S21, S22, S24, S25 und S27 in `wp01`, S19 und S20 in `wp02`. Verlangt die Erledigung eine Änderung der Spezifikation, gilt der Weg für eine Lücke in der Spezifikation (Entwicklungsverfahren, Abschnitt „Meldungen“).

## wp01 – Bibliothek und Web-API

### Ziel

Die gemeinsame Python-Bibliothek kennt alle Typen, Objekte, Ausdrücke und Befunde des Strategiedesigners und liest und schreibt seine Dokumente. pipwerk Studio legt Strategien und Vorlagen als Dateien im Objektverzeichnis ab und bietet dafür und für die Konsistenzprüfung die öffentliche Web-API an. Die Testfalldokumente `str-01` und `str-03` lassen sich über die Web-API speichern, laden und ohne Fehler prüfen.

### Umfang

- Bibliothek `pipwerk_domain` in `packages/domain-core`, eingebunden in pipwerk Studio (E1): Typbeschreibungen und Elementregister mit Einstiegspunkt (3.1, E7), mitgelieferte Typen und Regelvorlage „Risiko je Trade“ (3.2, 3.5, E6), Strategie, Instanzen, Vorlagen und Namensräume (3.3, E4), Ausdrücke mit Zerlegung und Typprüfung (3.4), Konsistenzprüfung mit allen Befunden (3.6), Dokumente mit Pydantic und JSON-Schemata unter `contracts/strategies/v1/` (3.7).
- Testfalldokumente `str-01` und `str-03` unter `contracts/strategies/v1/testcases/` nach Abschnitt 6.
- Backend: Objektverzeichnis mit Einstellung, Alembic und Migration, Datei je Objekt, nicht lesbare Dateien, Verschieben (4.1, E5); öffentliche Web-API unter `/api/v1/` mit Beschreibung unter `contracts/api/pipwerk-studio/v1/openapi.json` und interne Endpunkte des Objektverzeichnisses (4.2); Sicherheit (Abschnitt 8, Teile des Backends).
- Tests nach Abschnitt 7 für Bibliothek, Testfalldokumente und Backend. Prüfskript und Testumgebungsskript nehmen die Bibliothek auf, das Testumgebungsskript setzt das Objektverzeichnis unter `.testenv/` (Abschnitt 7, letzter Punkt).
- Dokumentation (Abschnitt 9): technische Dokumentation der Bibliothek mit Verweis aus `contracts/strategies/README.md`, darin die Bedeutung von „leer“ und „nicht verfügbar“ und die Wirkung bei der Ausführung (3.4); `docs/technical/pipwerk-studio.md` zu Objektverzeichnis, Web-API, Alembic, Prüfungen und Sicherheit mit allen dadurch falsch werdenden Stellen (S22); Glossar. In `docs/user/pipwerk-studio.md` die Stellen, die durch das Paket unvollständig werden: `testenv stop` entfernt auch die gespeicherten Strategien und Vorlagen der Testumgebung, und die Warnung zu `--host` nennt das Anlegen, Ändern und Löschen von Strategien und Vorlagen und das Ändern des Objektverzeichnisses.

### Nicht-Umfang

- Oberfläche (`wp02`, `wp03`). Die bestehende Oberfläche bleibt unverändert.
- Auswertung von Ausdrücken und Ausführung von Strategien (Abschnitt 1)
- Anwenderdokumentation zu den Arbeitsabläufen (`wp02`, `wp03`)
- Ändern des Objektverzeichnisses durch den Auftraggeber: Er prüft es in der Oberfläche in `wp02`. In `wp01` belegen es die Tests des Backends.

### Umgesetzte Teile der Spezifikation

Abschnitt 1 (Teil Dokumente der Testfälle), Abschnitt 2 E1 und E4 bis E8 vollständig, E2 und E3 Teil Bibliothek und Web-API, Abschnitte 3.1 bis 3.7 (3.1 ohne die in Phase 4 ergänzten Felder, 3.6 in der Fassung vor der Änderung vom 2026-10-18; beides `wp02`), 4.1, 4.2, Abschnitt 6 (Testfalldokumente), Abschnitt 7 Punkte Bibliothek, Testfalldokumente, Backend und Skripte, Abschnitt 8 ohne den Satz zur Oberfläche, Abschnitt 9 Punkte 1, 2 und 4, Abschnitt 10 Punkte 2 bis 8 in Bibliothek und Dokumentation.

### Abhängigkeiten

keine

### Abnahmekriterien

Der Auftraggeber kann in der Testumgebung selbst prüfen, über die Schnittstellenbeschreibung `/docs` am Port des Backends:

1. Die Testumgebung startet. Die Oberfläche arbeitet wie bisher.
2. Die Schnittstellenbeschreibung zeigt die Endpunkte unter `/api/v1/` aus Abschnitt 4.2.
3. `GET /api/v1/element-types` liefert die mitgelieferten Typen aus Abschnitt 3.2 mit Beschriftungen in Deutsch und Englisch, die Regelvorlage „Risiko je Trade“ mit dem Ausdruck aus Abschnitt 3.5 und die Liste der Funktionen.
4. Die Testfalldokumente `str-01` und `str-03` lassen sich mit `POST /api/v1/strategies` anlegen. Die Antwort meldet keinen Fehler. `GET /api/v1/strategies` nennt beide, `GET /api/v1/strategies/{id}` liefert dasselbe Dokument zurück, abgesehen von Kennung und Zeitpunkten. Im Objektverzeichnis der Testumgebung liegt je eine Datei.
5. `POST /api/v1/check` meldet für abgewandelte Fassungen eines Testfalls die passenden Befunde aus Abschnitt 3.6, mindestens für: entfernten Auslöser, Ausdruck mit Schreibfehler (mit Stelle), unbekannten Namen, `Order` im Hauptablauf, Regel mit `Order` in einem Indikator, Order ändern außerhalb einer Verwaltung, unbekannten Elementtyp. `PUT` speichert eine Fassung mit Befunden trotzdem.
6. Ein Dokument mit einem zusätzlichen Feld wird mit HTTP 422 abgelehnt.
7. Eine Vorlage vom Objekttyp `Regel` lässt sich anlegen, ändern und löschen. Enthält eine gespeicherte Strategie eine Instanz daraus, nennt `GET …/usages` diese Strategie. Nach dem Löschen der Vorlage ist die Strategie unverändert.
8. Die technische Dokumentation beschreibt Bibliothek, Dokumentformat, Objektverzeichnis und Web-API und nennt die Bedeutung von „leer“ und „nicht verfügbar“. Die Anwenderdokumentation nennt, dass `testenv stop` auch die gespeicherten Strategien und Vorlagen entfernt, und warnt bei `--host` vor dem Ändern von Strategien, Vorlagen und Objektverzeichnis durch andere im Netz.

Technische Nachweise im Prüfbericht der QA: Das Prüfskript endet mit Exitcode 0 auf dem bereitgestellten Commit, darin alle Tests aus Abschnitt 7 für Bibliothek, Testfalldokumente und Backend, auch Verschieben, Nichtverschieben und Konflikt beim Verschieben des Objektverzeichnisses. Positive Testberichte beider Tester liegen für jeden zusammengeführten Auftrag vor.

## wp02 – Strategien gestalten in der Oberfläche

### Ziel

Der Anwender gestaltet in pipwerk Studio Strategien auf der Zeichenfläche nach Abschnitt 5 der Spezifikation, speichert, öffnet, prüft, schließt und löscht sie, in jeder Fenstergröße nach req-system-024. Jedes Objekt liegt beim Element seiner ersten Verwendung; Bausteine und Verbinden bieten an jeder Stelle nur die dort verwendbaren Objekte an. Die Testfälle `str-01` und `str-03` lassen sich aus der leeren Zeichenfläche ohne Anleitung und ohne einen Ausdruck als Text einzugeben vollständig aufbauen, speichern und nach Neuladen unverändert öffnen, ohne Fehler der Konsistenzprüfung. Die „EMA-Trendfolge“ des Auftraggebers öffnet sich ohne Neubau. Die Mängel M1 bis M17 der ersten Abnahme und M1 der zweiten Abnahme ([Abnahmebericht](wp02/acceptance/2.md)) sind behoben.

### Umfang

- Bibliothek und Web-API auf die geltende Fassung der Spezifikation: alle Änderungen gegenüber `wp01` in 3.1 bis 3.7 (Typbeschreibung mit Gruppe, Erklärungen und Händlersprache, Datentyp Objekt, Bindungsart Datenverbindung, Parameter `Instrument`, feste Instrumente nach ISO, `Instrument` ohne Instanz; Feld „Methoden“ und Aktualisieren in der Typbeschreibung; mitgelieferte Typen mit `Manuell`, `ZigZag` und `Anwenden auf`, ohne Methoden, ohne `Markttechnik` und „Parameter setzen“; Namen und Kennungen, gemeinsamer Namensraum, Eingänge mit „Aktualisieren“, Element der ersten Verwendung, Stand einer Instanz und Prüfung der Wege, Abschnitte, Ausrichtung, Verwaltung ohne eigene Auslöser; Anzeigeform, Bausteine, Zeichen und sichtbare Namen nur mit den verwendbaren Instanzen; Konsistenzprüfung in der geltenden Fassung; Format 2.0 mit Schemata unter `contracts/strategies/v2/` und Lesen von 1.0), Web-API nach 4.2 mit `/api/v1/expressions`, Annahme von 2.0 und 1.0 und Fehlerantworten mit Kennung der Ursache (E2, E9).
- Testfalldokumente `str-01` und `str-03` in Format 2.0 unter `contracts/strategies/v2/testcases/` nach Abschnitt 6.
- Oberfläche nach Abschnitt 5, umgesetzt in der bestehenden Oberfläche von pipwerk Studio (E8), ohne die Teile von `wp03`: Aufbau und Fenstergrößen, Hinweise, Assistent und kurze Meldungen in der Eigenschaftenansicht (5.1), Elementbibliothek mit den Gruppen nach req-ui-018 (5.2), Zeichenfläche mit Anordnung, Verwaltung, Abschnitten, Objekten beim Element ihrer ersten Verwendung, Datenverbindungen nur zu Elementen, an denen die Instanz verwendbar ist, Linien der weiteren Verwendungen und Befunden (5.3), Eigenschaftenansicht mit verwendeten Werten und „Aktualisieren“, Bausteine und Formeleditor (5.4), Arbeitsabläufe aus 5.5: Strategie anlegen mit dem Assistenten, Objekt verwenden ohne „Als Vorlage speichern“, Regeln zuordnen, Speichern, Prüfen, Schließen, Öffnen, Löschen einer Strategie, Einstellungen; leere Zustände.
- Sicherheit nach Abschnitt 8, auch die Begrenzungen für `/api/v1/expressions`.
- Tests nach Abschnitt 7 ohne die Browsertests „Objekt anlegen“, „Vorlage löschen“ und die Vorlagenansicht in den Smartphone-Größen; Prüfskript und Testumgebungsskript mit der gesicherten „EMA-Trendfolge“.
- Dokumentation nach Abschnitt 9 für dieses Paket: technische Dokumentation von pipwerk Studio und der Bibliothek, `docs/technical/pipwerk-studio-testfaelle.md`, Anwenderdokumentation ohne Test- und Abnahmeanleitungen, Glossar.

### Nicht-Umfang

- Neues Objekt, Ansicht einer Vorlage, Als Vorlage speichern, Löschen einer Vorlage (`wp03`)
- Ausführung von Strategien und Prüfung, ob ein Broker ein Instrument anbietet (Abschnitt 1, 3.1)

### Umgesetzte Teile der Spezifikation

Abschnitt 1 ohne das Löschen einer Vorlage in der Oberfläche, Abschnitt 2 E2, E3, E8 und E9 sowie die Erweiterung von E1, 3.1 bis 3.7 in der geltenden Fassung, 4.1 Lesen von Format 1.0, 4.2, Abschnitt 5 ohne die Teile von `wp03`, Abschnitt 6, Abschnitt 7 ohne die Browsertests „Objekt anlegen“, „Vorlage löschen“ und die Vorlagenansicht in den Smartphone-Größen, Abschnitt 8, Abschnitt 9 für dieses Paket, Abschnitt 10 Punkte 1 und 3 bis 25.

### Abhängigkeiten

`wp01`

### Abnahmekriterien

Der Auftraggeber kann in der Testumgebung selbst prüfen:

1. Bedienbarkeit: Der Auftraggeber baut `str-03` aus der leeren Zeichenfläche ohne Anleitung auf, so wie Abschnitt 5 der Spezifikation die Bedienung beschreibt, ohne einen Ausdruck als Text einzugeben, und speichert. Die Konsistenzprüfung meldet keinen Fehler. Nach Neuladen der Seite öffnet „Öffnen“ die Strategie unverändert.
2. Ebenso `str-01`, einschließlich der Verwaltung als Rahmen am Ausgang „gestellt“, der sich einklappen lässt. In den Verwaltungen beider Testfälle verwendet er Objekte des Hauptablaufs mit „Aktualisieren“.
3. Seine gesicherte „EMA-Trendfolge“ öffnet sich ohne Neubau, mit Namen nach Abschnitt 10 Punkt 18.
4. In den Fenstergrößen nach 5.1, auch auf Smartphone und Tablet, liegt nichts übereinander, die Seite hat keine waagerechte Bildlaufleiste, und alle Bereiche, Menü und Dialoge sind erreichbar; ohne Ziehen lässt sich jede Bedienung ausführen.
5. Elementbibliothek in den Gruppen nach 5.2, mit Erklärung bei jedem Eintrag, in Händlersprache, mit `ZigZag`. Die Sprache wird in den Einstellungen gewählt, alle Texte erscheinen in Deutsch und Englisch.
6. Jedes Objekt liegt beim Element seiner ersten Verwendung und ist mit ihm durch eine Linie verbunden, senkrecht und waagerecht. Werte von Objekten lassen sich mit Elementen verbinden; Linien und Umschalter „Weitere Verwendungen: Alle / Auswahl / Aus“ nach 5.3. Im Zweig „falsch“ einer Bedingung bieten Bausteine und Verbinden kein Objekt an, das erst im Zweig „wahr“ ermittelt wird. Abschnitte lassen sich bilden und einklappen, der Ablauf lässt sich waagerecht stellen.
7. Strategieparameter stehen im Streifen unter der Kopfzeile und lassen sich dort und bei einer Belegung an Ort und Stelle anlegen. Ein Trend, ein eigener Indikator und ein eigenes Regelwerk lassen sich in der Strategie vollständig belegen, jede Instanz zeigt ihre Eigenschaften mit Datentyp und möglichen Werten.
8. Bausteine und Formelansicht nach 5.4: Vorschläge nach `Objekt.`, auch nach dem Namen einer Berechnung, Fehler an der Stelle. Umbenennen zieht überall mit; Entfernen eines verwendeten Objekts fragt mit der Liste der Verwendungen nach, danach meldet die Prüfung den leeren Platz.
9. Befunde: Element mit Fehler rot, mit Hinweis orange, Befundtext in der Eigenschaftenansicht, die Befundzahl führt zur Liste, jeder Befund nennt den Weg zur Behebung und führt zur Stelle. Eine neue, leere Strategie erhält nur den Hinweis „Hauptablauf ohne Auslöser“. Ein Element, das kein Auslöser erreicht, und ein festes Instrument mit ungültiger Bezeichnung sind Fehler; `EURUSD` und eine gültige ISIN sind keine.
10. Schließen, „Neue Strategie“ und „Öffnen“ fragen bei ungespeicherten Änderungen nach „Speichern“, „Verwerfen“, „Abbrechen“. „Öffnen“ zeigt die Liste der Strategien; eine Strategie lässt sich nach Rückfrage löschen. Das Objektverzeichnis lässt sich in den Einstellungen mit Rückfrage „Dateien verschieben?“ ändern.
11. Eine Strategie mit einem unbekannten Elementtyp, angelegt über die Schnittstellenbeschreibung, öffnet sich. Das Element ist rot umrandet und zeigt die Kennung seines Typs, seine Belegungen sind nur lesbar und bleiben beim Speichern erhalten.
12. „Neue Strategie“ bietet den Assistenten an, jeder leere Zustand nennt den nächsten Schritt, „Keine Strategie geöffnet“ erscheint nur einmal, in der Eigenschaftenansicht. Hinweise, Assistent und kurze Meldungen stehen in der Eigenschaftenansicht, nicht auf der Zeichenfläche. Beim Ablegen eines Elements springt die Ansicht nicht, und kein Element liegt sichtbar in einem fremden Rahmen. Das Erscheinungsbild folgt 5.1. „Über pipwerk Studio“ und der Stand in der Fußzeile sind vorhanden, die gewählte Sprache bleibt nach Neuladen und Neustart erhalten.
13. Die Anwenderdokumentation beschreibt die Bedienung dieses Pakets verständlich und vollständig und enthält keine Test- oder Abnahmeanleitungen.

Mit der Abnahme testet der Auftraggeber auch die vorläufigen Punkte 9 bis 13, 21 und 22 aus Abschnitt 10 der Spezifikation; ein Einwand kommt mit `revise`.

Technische Nachweise im Prüfbericht der QA: Das Prüfskript endet mit Exitcode 0 auf dem bereitgestellten Commit, darin die Tests nach Abschnitt 7 für dieses Paket, die Browsertests in Chromium, Firefox und WebKit und in den Fenstergrößen aus 5.1. Positive Testberichte beider Tester liegen für jeden zusammengeführten Auftrag vor.

## wp03 – Vorlagen in der Oberfläche

### Ziel

Der Anwender legt eigene Vorlagen (Indikator, Trend, Regel, Regelwerk) in pipwerk Studio an, öffnet, ändert, prüft und löscht sie, speichert eine Instanz als neue Vorlage und verwendet seine Vorlagen in Strategien.

### Umfang

- Arbeitsabläufe aus 5.5: „Als Vorlage speichern“ in der Eigenschaftenansicht einer Instanz; Objekt anlegen, öffnen, ändern in der Ansicht der Vorlage mit „Speichern“, „Prüfen“, „Schließen“, „Löschen“, enthaltenen Instanzen, Regeln und Regelwerken, eigenen Parametern und Eigenschaften mit Ausdrücken aus Bausteinen, Befunden beim betroffenen Teil und Rückfrage beim Schließen; Löschen einer Vorlage in ihrer Ansicht und an ihrem Eintrag in der Elementbibliothek mit Anzeige der Verwendungen.
- Gespeicherte Vorlagen als „eigene“ in der Gruppe ihres Objekttyps; mitgelieferte Typen und „Risiko je Trade“ ansehen, nicht ändern und nicht löschen (5.2, E6, Abschnitt 10 Punkt 2).
- „Neues Objekt“ in der Elementbibliothek (5.1); Ansicht einer Vorlage auch in den Smartphone-Größen (5.1).
- Tests der Oberfläche und Browsertests „Objekt anlegen“, „Vorlage löschen mit Anzeige der Verwendungen“ und Vorlagenansicht in den Smartphone-Größen (Abschnitt 7).
- Texte und Namen des Anwenders in der Ansicht der Vorlage nur als Text, nie als HTML (Abschnitt 8).
- Dokumentation: `docs/user/pipwerk-studio.md` mit den Arbeitsabläufen dieses Pakets Schritt für Schritt; `docs/technical/pipwerk-studio.md` zur Ansicht der Vorlage; Glossar für neue Begriffe dieses Pakets.

### Nicht-Umfang

- Weitere Berechnungsverfahren des Trends außer „Ausdruck“ (Abschnitt 10 Punkt 6)
- Änderungen an Bibliothek und Web-API, außer zur Behebung eines Fehlers, den dieses Paket aufdeckt

### Umgesetzte Teile der Spezifikation

Abschnitt 5.1 „Neues Objekt“ und Ansicht einer Vorlage in den Smartphone-Größen, 5.2 gespeicherte und mitgelieferte Vorlagen, 5.5 Zeilen „Objekt verwenden“ (Als Vorlage speichern), „Objekt anlegen, öffnen, ändern“, „Löschen“ (Vorlage), Abschnitt 7 Browsertests „Objekt anlegen“, „Vorlage löschen“ und Vorlagenansicht in den Smartphone-Größen, Abschnitt 8 Satz zur Oberfläche für die Ansicht der Vorlage, Abschnitt 9 Punkte 1 und 4 und Glossar für dieses Paket, Abschnitt 10 Punkt 2 in der Oberfläche.

### Abhängigkeiten

`wp02`

### Abnahmekriterien

Der Auftraggeber kann in der Testumgebung selbst prüfen:

1. Bedienbarkeit: Der Auftraggeber legt ohne Anleitung, so wie Abschnitt 5 der Spezifikation die Bedienung beschreibt, die Regel `mindestvolumen` aus `str-03` als eigene Vorlage an, fügt sie in seine Strategie `str-03` an „Order aufgeben“ ein und speichert. Die Konsistenzprüfung meldet keinen Fehler.
2. „Neues Objekt“ legt eine Vorlage jedes Objekttyps `Indikator`, `Trend`, `Regel` und `Regelwerk` an. Sie erscheint in einer eigenen Ansicht, die geöffnete Strategie bleibt dahinter unverändert.
3. In einem Indikator lassen sich Instanzen mitgelieferter Indikatoren und Regeln hinzufügen und eine eigene Eigenschaft mit Ausdruck aus Bausteinen festlegen. Ein Trend erhält Instrument, Zeiteinheit, Verfahren „Ausdruck“ und den Ausdruck für `Richtung`. Ein Regelwerk erhält Regeln in einer Reihenfolge, die sich ändern lässt. Eine Regel erhält Parameter, Ausdruck, bestimmte Eigenschaft und Vergleich beim Prüfen.
4. „Prüfen“ zeigt Befunde beim betroffenen Teil der Vorlage, zum Beispiel eine Regel mit `Order` in einem Indikator. „Schließen“ fragt bei ungespeicherten Änderungen nach.
5. Eine gespeicherte Vorlage erscheint als „eigene“ in der Elementbibliothek und lässt sich in eine Strategie einfügen, ein Regelwerk als Regelwerk der Strategie. Die Eigenschaftenansicht zeigt die Herkunft der Instanz. Wird die Vorlage danach geöffnet, geändert und gespeichert, bleibt die Instanz in der Strategie unverändert.
6. „Als Vorlage speichern“ macht aus einer geänderten Instanz eine neue Vorlage.
7. Beim Löschen einer Vorlage nennt die Rückfrage die Strategien und Vorlagen mit Instanzen daraus. Nach dem Löschen sind diese Instanzen unverändert.
8. Mitgelieferte Objekttypen und „Risiko je Trade“ lassen sich ansehen und bieten weder Ändern noch Löschen an.
9. Die Ansicht einer Vorlage ist auch auf dem Smartphone hoch und quer vollständig bedienbar.
10. Die Anwenderdokumentation beschreibt die Arbeitsabläufe dieses Pakets verständlich und vollständig.

Technische Nachweise im Prüfbericht der QA: Das Prüfskript endet mit Exitcode 0 auf dem bereitgestellten Commit, darin die neuen Tests der Oberfläche und Browsertests in Chromium, Firefox und WebKit. Positive Testberichte beider Tester liegen für jeden zusammengeführten Auftrag vor.

## Abdeckung der Spezifikation

Bezogen auf die geltende Fassung der Spezifikation. `wp01` hat die Teile in der Fassung vom 2026-10-16 umgesetzt; was die geltende Fassung daran ändert, setzt `wp02` um.

| Teil der Spezifikation | Paket |
|---|---|
| 1 Gegenstand, Nachweis mit `str-01` und `str-03`, Öffnen der „EMA-Trendfolge“ | `wp02` |
| 1 Abweichungen von den Vorlagen | `wp01`, in der geltenden Fassung `wp02` (Auslöser, Namen); Löschen einer Vorlage in der Oberfläche `wp03` |
| 2 E1, E4 bis E7 | `wp01`; Erweiterung von E1 (Anzeigeform, Bausteine) `wp02` |
| 2 E2, E3, E8, E9 | `wp02` |
| 3.1 bis 3.7 | `wp01`; geltende Fassung `wp02` |
| 4.1 | `wp01`; Lesen von Format 1.0 `wp02` |
| 4.2 | `wp01`; `/api/v1/expressions`, Format 2.0 und 1.0, Fehler mit Kennung der Ursache `wp02` |
| 5.1 | `wp02`; „Neues Objekt“ und Ansicht einer Vorlage in den Smartphone-Größen `wp03` |
| 5.2 | `wp02`; gespeicherte und mitgelieferte Vorlagen ansehen, öffnen, löschen `wp03` |
| 5.3, 5.4 | `wp02` |
| 5.5 Strategie anlegen, Regeln zuordnen, Speichern, Prüfen, Schließen, Öffnen, Einstellungen | `wp02` |
| 5.5 Objekt verwenden | `wp02`; „Als Vorlage speichern“ `wp03` |
| 5.5 Objekt anlegen, öffnen, ändern | `wp03` |
| 5.5 Löschen | `wp02` (Strategie), `wp03` (Vorlage) |
| 6 Abbildung der Testfälle | `wp02` |
| 7 Bibliothek, Testfalldokumente, Backend, Skripte | `wp02` |
| 7 Oberfläche, Browsertest | `wp02`; „Objekt anlegen“, „Vorlage löschen“ und Vorlagenansicht in den Smartphone-Größen `wp03` |
| 8 Sicherheit | `wp02`; Ansicht der Vorlage `wp03` |
| 9 technische Dokumentation pipwerk Studio | `wp02`; Ansicht der Vorlage `wp03` |
| 9 technische Dokumentation der Bibliothek, Testfälle | `wp02` |
| 9 Anwenderdokumentation, Glossar | `wp02`, `wp03` |
| 10 Punkt 1, Punkte 3 bis 25 | `wp02` (Punkte 9 bis 13, 21 und 22 vorläufig bis zum Test in der Abnahme von `wp02`) |
| 10 Punkt 2 | `wp01` (Bibliothek), `wp03` (Oberfläche) |
| 10 Folgen der fachlichen Festlegungen | keine Umsetzung, Hinweis für den Auftraggeber |

## Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-23 | `wp02` und `wp03` an die Spezifikation in der Fassung vom 2026-10-23 angepasst (zweite Abnahme von `wp02` abgebrochen, geänderte Anforderungen req-fach-055, req-ui-014, req-ui-016 bis req-ui-018, req-ablauf-003, req-ablauf-007; Prototyp nur noch Hilfsmittel, E8): Übersicht; `wp02` Ziel mit M1 der zweiten Abnahme, Umfang (Methoden und Aktualisieren, Namensraum, erste Verwendung und Wegregel, verwendbare Instanzen, `Manuell`, ohne `Markttechnik` und „Parameter setzen“, Objekte beim Element ihrer ersten Verwendung statt eigenem Bereich, Assistent, Hinweise in der Eigenschaftenansicht, Gruppen nach req-ui-018), umgesetzte Teile bis Abschnitt 10 Punkt 25, Abnahmekriterien 1, 2, 5, 6 und 12 und vorläufige Punkte 21 und 22; `wp03` Umfang und Kriterium 1 ohne Bezug auf den Prototyp; Tabelle der Abdeckung. |
| 2026-10-20 | Hinweise aus [plan-3.md](reviews/plan-3.md) (bestanden), ohne weitere Prüfung: H1 4.1 Lesen von 1.0 in `wp02`; H2 Abschnitt 8 für die Ansicht der Vorlage in `wp03`; H3 Browsertest der Vorlagenansicht in den Smartphone-Größen in `wp03`; H4 neues Kriterium 12 von `wp02` (geführter Aufbau, leere Zustände, Ansicht, Erscheinungsbild, „Über pipwerk Studio“, Sprache); H5 Kriterium 7 von `wp02` um eigenen Indikator und eigenes Regelwerk; H7 Abschnitt 1 in `wp02` ohne Löschen einer Vorlage. H6 in der Spezifikation 3.6. S19 und S20 prüfen die Aufträge von `wp02` auf ihre Gültigkeit nach der Neufassung. |
| 2026-10-20 | `wp02` und `wp03` neu gefasst nach der Neufassung der Spezifikation (Abnahme von `wp02` nicht bestanden, Mängel M1 bis M17, bestätigter Prototyp, Abstimmung vom 2026-10-20): `wp02` mit Bibliothek und Web-API in Format 2.0 und neuer Oberfläche, Abnahmekriterium zur Bedienbarkeit, das bisherige Kriterium 2 (leere Strategie ohne Befund) durch den Hinweis „Hauptablauf ohne Auslöser“ ersetzt (Spezifikation 3.6; Hinweis T2-H6 aus `specification-9.md`); `wp03` mit Kriterium zur Bedienbarkeit und Ansicht der Vorlage in den Smartphone-Größen; Abschnittsnummern auf die geltende Fassung (5.5 Arbeitsabläufe); Tabelle der Abdeckung neu. |
| 2026-10-16 | Plan angelegt: drei Pakete, `wp02` hängt von `wp01` ab, `wp03` von `wp02`. |
| 2026-10-16 | Hinweise aus [plan-1.md](reviews/plan-1.md) eingearbeitet: P1 „Neues Objekt“ in `wp03` und in der Tabelle der Abdeckung; P2 Glossar in `wp03`; P3 zwei Stellen der Anwenderdokumentation in `wp01`; P4 Vergleich ohne Kennung und Zeitpunkte; P5 Ändern des Objektverzeichnisses als Abnahmekriterium nur in `wp02`, in `wp01` als technischer Nachweis; P6 Befund nach „Prüfen“; P7 „kein Fehler“; P8 Kriterien 8 bis 10 von `wp02` ergänzt; P9 Regelvorlage und Ändern einer Vorlage in `wp03`. |
| 2026-10-17 | `wp01` abgenommen ([Abnahmebericht](wp01/acceptance/1.md)) und mit Commit `cbbebd931b09148b93410e214e495b8b896b1d7e` in `main` übernommen, Stand `done`. |
| 2026-10-17 | `wp02`: Ergänzung der Typbeschreibung (Spezifikation 3.1) in Umfang, Nicht-Umfang, umgesetzten Teilen und Tabelle der Abdeckung. Anlass: Lücke der Spezifikation, gefunden im Testbericht `strategiedesign/wp02:development/strategiedesign/wp02/tests/01-functiontest-1.md`, Hinweis H1. Prüfung in [specification-4.md](reviews/specification-4.md), Bestätigung offen. |
| 2026-10-18 | Ergänzung von `wp02` vom Auftraggeber bestätigt, ausgenommen „Vorgabe der neuen Strategie“. Entscheidung des Auftraggebers: Auslöser optional. `wp02`: Umfang um die Änderung der Konsistenzprüfung (3.6) und die Tests und Dokumentation von Bibliothek und Backend dazu ergänzt (Hinweis H6 aus `specification-4.md`), Nicht-Umfang, umgesetzte Teile, Abnahmekriterium 2 neu, Tabelle der Abdeckung. `wp01`: umgesetzte Teile ohne die Änderungen von `wp02` (Hinweis H5). Prüfung in [specification-5.md](reviews/specification-5.md) nicht bestanden; B1 in der Spezifikation 3.6 und im Umfang von `wp02`, Hinweise H5 (technische Nachweise von `wp02`) und H6 (Tabelle der Abdeckung, Zeile „1 Abweichungen“) eingearbeitet. Nachprüfung in [specification-6.md](reviews/specification-6.md). |
