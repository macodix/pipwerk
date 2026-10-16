# Arbeitspaketplan Vorhaben strategiedesign

## Status

- status: `draft`
- stand: 2026-10-16
- komponenten: `packages/domain-core`, `components/pipwerk-studio`, `contracts/`
- grundlage: [specification.md](specification.md), bestätigt vom Auftraggeber am 2026-10-16 mit allen acht Festlegungen ([Präsentation](presentations/specification-1.html), Vermerk der Bestätigung), Stand `main` Commit `fc30c0e25eeda28517b10bd62b64231046f2a467`
- prüfung: Durchlauf 1 [plan-1.md](reviews/plan-1.md) bestanden, Hinweise P1 bis P9 eingearbeitet. Durchlauf 2 [plan-2.md](reviews/plan-2.md), Nachprüfung.

## Übersicht

| Paket | Titel | hängt ab von | Stand |
|---|---|---|---|
| `wp01` | Bibliothek und Web-API | – | `open` |
| `wp02` | Strategien gestalten in der Oberfläche | `wp01` | `open` |
| `wp03` | Vorlagen in der Oberfläche | `wp02` | `open` |

Die Pakete folgen den Schichten der Spezifikation: Die Oberfläche kennt keine einzelnen Typen und braucht deshalb die Typbeschreibungen, die Konsistenzprüfung und die Ablage über die Web-API (E2). `wp02` endet mit dem Nachweis des Vorhabens, dass sich `str-01` und `str-03` in der Oberfläche gestalten, speichern und laden lassen. Beide Testfälle brauchen nur mitgelieferte Typen, die mitgelieferte Regelvorlage und Regeln, die in der Strategie entstehen. Das Anlegen und Verwalten eigener Vorlagen folgt deshalb in `wp03`.

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

Abschnitt 1 (Teil Dokumente der Testfälle), Abschnitt 2 E1 und E4 bis E8 vollständig, E2 und E3 Teil Bibliothek und Web-API, Abschnitte 3.1 bis 3.7, 4.1, 4.2, Abschnitt 6 (Testfalldokumente), Abschnitt 7 Punkte Bibliothek, Testfalldokumente, Backend und Skripte, Abschnitt 8 ohne den Satz zur Oberfläche, Abschnitt 9 Punkte 1, 2 und 4, Abschnitt 10 Punkte 2 bis 8 in Bibliothek und Dokumentation.

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

Der Anwender gestaltet in pipwerk Studio Strategien auf der Zeichenfläche, speichert, öffnet, prüft, schließt und löscht sie. Die Testfälle `str-01` und `str-03` lassen sich aus der leeren Zeichenfläche vollständig aufbauen, speichern und nach Neuladen unverändert öffnen, ohne Fehler der Konsistenzprüfung.

### Umfang

- Aufbau der Oberfläche mit Kopfzeile, Elementbibliothek mit mitgelieferten und gespeicherten Vorlagen, Zeichenfläche und Eigenschaftenansicht (5.1, E2, E3). Sprachauswahl in den Einstellungen.
- Arbeitsabläufe aus 5.2: Strategie anlegen, Objekt verwenden ohne „Als Vorlage speichern“, Regeln zuordnen einschließlich neuer Regel in der Strategie, Speichern, Schließen, Öffnen, Löschen einer Strategie, Einstellungen mit Objektverzeichnis.
- Zeichenfläche und Eigenschaftenansicht (5.3): Elemente mit Ausgängen, Verbindungen, Verwaltung als einklappbarer Rahmen, Eigenschaftenansicht aus den Typbeschreibungen mit Bindungsarten und Herkunft, Ausdruckseingabe mit Vorschlägen und Anzeige in der gewählten Sprache.
- Befunde nach 5.4 und Abschnitt 10 Punkt 1.
- Darstellung eines Elements mit unbekanntem Typ (3.7, zweiter Absatz).
- Texte nur als Text, nie als HTML (Abschnitt 8).
- Tests nach Abschnitt 7 für die Oberfläche (Vitest) und Browsertests: beide Testfälle über die Oberfläche aufbauen, speichern, nach Neuladen öffnen und mit dem Testfalldokument vergleichen; Objektverzeichnis ändern.
- Dokumentation: `docs/user/pipwerk-studio.md` mit den Arbeitsabläufen dieses Pakets Schritt für Schritt, der Schreibweise von Ausdrücken, den Befunden und ihrer Behebung und beiden Testfällen als Anleitung (Abschnitt 9, Punkt 3); `docs/technical/pipwerk-studio.md` zum Aufbau der Oberfläche; Glossar für neue Begriffe der Oberfläche.

### Nicht-Umfang

- Neues Objekt, Ansicht einer Vorlage, Als Vorlage speichern, Löschen einer Vorlage (`wp03`)
- Änderungen an Bibliothek und Web-API, außer zur Behebung eines Fehlers, den dieses Paket aufdeckt

### Umgesetzte Teile der Spezifikation

Abschnitt 1 (Nachweis in der Oberfläche), Abschnitt 2 E2 und E3 Teil Oberfläche, 3.7 zweiter Absatz Teil Oberfläche, 5.1, 5.2 ohne die Teile von `wp03`, 5.3, 5.4, Abschnitt 6 (Aufbau über die Oberfläche), Abschnitt 7 Punkte Oberfläche und Browsertest ohne „Objekt anlegen“ und „Vorlage löschen“, Abschnitt 8 Satz zur Oberfläche, Abschnitt 9 Punkt 1 (Oberfläche) und Punkte 3 und 4 für dieses Paket, Abschnitt 10 Punkt 1.

### Abhängigkeiten

`wp01`

### Abnahmekriterien

Der Auftraggeber kann in der Testumgebung selbst prüfen:

1. Die Oberfläche zeigt Kopfzeile mit Menü, Elementbibliothek, Zeichenfläche und Eigenschaftenansicht nach 5.1. Die Sprache wird in den Einstellungen gewählt, alle Texte erscheinen in Deutsch und Englisch.
2. „Neue Strategie“ zeigt eine Zeichenfläche mit einem Auslöser `Kerzenschluss`. Nach „Prüfen“ erscheint der fehlende Wert der Zeiteinheit unter anderem als Befund am Auslöser.
3. `str-03` lässt sich nach der Anleitung der Anwenderdokumentation vollständig aufbauen und speichern. Die Konsistenzprüfung meldet keinen Fehler. Nach Neuladen der Seite öffnet „Öffnen“ die Strategie unverändert.
4. Ebenso `str-01`, einschließlich der Verwaltung als Rahmen am Ausgang `gestellt`, der sich einklappen lässt.
5. Ein Element mit Fehler ist rot, mit Hinweis orange umrandet. Bei Auswahl steht der Befundtext in der Eigenschaftenansicht. Befunde ohne Element stehen in der Eigenschaftenansicht der Strategie. Keine Meldung muss weggeklickt werden.
6. Die Ausdruckseingabe bietet nach einem Namen und einem Punkt die Eigenschaften an, auch die der Objekte der Anwendung, und zeigt den Ausdruck mit den Namen in der gewählten Sprache.
7. Schließen, „Neue Strategie“ und „Öffnen“ fragen bei ungespeicherten Änderungen nach „Speichern“, „Verwerfen“, „Abbrechen“.
8. „Öffnen“ zeigt die Liste der Strategien mit Bezeichnung, Beschreibung und letzter Änderung. Eine Strategie lässt sich nach Rückfrage löschen.
9. In den Einstellungen lässt sich das Objektverzeichnis ändern, mit Rückfrage „Dateien verschieben?“. Mit „verschieben“ erscheinen die gespeicherten Strategien danach weiter in der Liste von „Öffnen“, ohne „verschieben“ nicht. Die gewählte Sprache bleibt nach Neuladen der Seite erhalten.
10. In der Eigenschaftenansicht der Strategie und von „Order aufgeben“ lassen sich Regeln aus der Elementbibliothek hinzufügen, neue Regeln anlegen, ihre Reihenfolge ändern und Regeln entfernen. Befunde zu einer Regel der Strategie stehen bei dieser Regel. Eine Instanz zeigt ihre Herkunft, zum Beispiel „ema20, aus Objekttyp EMA“.
11. Eine Strategie mit einem unbekannten Elementtyp, angelegt über die Schnittstellenbeschreibung, öffnet sich. Das Element ist rot umrandet und zeigt die Kennung seines Typs, seine Belegungen sind nur lesbar und bleiben beim Speichern erhalten.
12. Die Anwenderdokumentation beschreibt die Arbeitsabläufe dieses Pakets, die Schreibweise von Ausdrücken mit „leer“ und „nicht verfügbar“, die Befunde und beide Testfälle verständlich und vollständig.

Technische Nachweise im Prüfbericht der QA: Das Prüfskript endet mit Exitcode 0 auf dem bereitgestellten Commit, darin die Tests der Oberfläche und die Browsertests in Chromium, Firefox und WebKit. Positive Testberichte beider Tester liegen für jeden zusammengeführten Auftrag vor.

## wp03 – Vorlagen in der Oberfläche

### Ziel

Der Anwender legt eigene Vorlagen (Indikator, Trend, Regel, Regelwerk) in pipwerk Studio an, öffnet, ändert, prüft und löscht sie, speichert eine Instanz als neue Vorlage und verwendet seine Vorlagen in Strategien.

### Umfang

- Arbeitsabläufe aus 5.2: „Als Vorlage speichern“ in der Eigenschaftenansicht einer Instanz; Objekt anlegen, öffnen, ändern in der Ansicht der Vorlage mit „Speichern“, „Prüfen“, „Schließen“, „Löschen“, enthaltenen Instanzen, Regeln und Regelwerken, Befunden beim betroffenen Teil und Rückfrage beim Schließen; Löschen einer Vorlage in ihrer Ansicht und im Kontextmenü der Elementbibliothek mit Anzeige der Verwendungen.
- Mitgelieferte Typen und „Risiko je Trade“ ohne Ändern und Löschen in der Oberfläche (E6, Abschnitt 10 Punkt 2).
- Tests der Oberfläche und Browsertests „Objekt anlegen“ und „Vorlage löschen mit Anzeige der Verwendungen“ (Abschnitt 7).
- Schaltfläche „Neues Objekt“ in der Elementbibliothek (5.1).
- Dokumentation: `docs/user/pipwerk-studio.md` mit den Arbeitsabläufen dieses Pakets Schritt für Schritt; `docs/technical/pipwerk-studio.md` zur Ansicht der Vorlage; Glossar für neue Begriffe dieses Pakets.

### Nicht-Umfang

- Weitere Berechnungsverfahren des Trends außer „Ausdruck“ (Abschnitt 10 Punkt 6)
- Änderungen an Bibliothek und Web-API, außer zur Behebung eines Fehlers, den dieses Paket aufdeckt

### Umgesetzte Teile der Spezifikation

Abschnitt 5.1 Schaltfläche „Neues Objekt“, Abschnitt 5.2 Zeilen „Objekt verwenden“ (Als Vorlage speichern), „Objekt anlegen, öffnen, ändern“, „Löschen“ (Vorlage), Abschnitt 7 Browsertest „Objekt anlegen“ und „Vorlage löschen“, Abschnitt 9 Punkte 1 und 3 für dieses Paket, Abschnitt 10 Punkt 2 in der Oberfläche.

### Abhängigkeiten

`wp02`

### Abnahmekriterien

Der Auftraggeber kann in der Testumgebung selbst prüfen:

1. „Neues Objekt“ legt eine Vorlage jedes Objekttyps `Indikator`, `Trend`, `Regel` und `Regelwerk` an. Sie erscheint in einer eigenen Ansicht, die geöffnete Strategie bleibt dahinter unverändert.
2. In einem Indikator lassen sich Instanzen mitgelieferter Indikatoren und Regeln hinzufügen und eine eigene Eigenschaft mit Ausdruck festlegen. Ein Trend erhält Zeiteinheit, Verfahren „Ausdruck“ und den Ausdruck für `Richtung`. Ein Regelwerk erhält Regeln in einer Reihenfolge, die sich ändern lässt. Eine Regel erhält Parameter, Ausdruck, bestimmte Eigenschaft und Vergleich beim Prüfen.
3. „Prüfen“ zeigt Befunde beim betroffenen Teil der Vorlage, zum Beispiel eine Regel mit `Order` in einem Indikator. „Schließen“ fragt bei ungespeicherten Änderungen nach.
4. Eine gespeicherte Vorlage erscheint in der Elementbibliothek und lässt sich in eine Strategie einfügen, ein Regelwerk als Regelwerk der Strategie. Die Eigenschaftenansicht zeigt die Herkunft der Instanz. Wird die Vorlage danach geöffnet, geändert und gespeichert, bleibt die Instanz in der Strategie unverändert.
5. „Als Vorlage speichern“ macht aus einer geänderten Instanz eine neue Vorlage.
6. Beim Löschen einer Vorlage nennt die Rückfrage die Strategien und Vorlagen mit Instanzen daraus. Nach dem Löschen sind diese Instanzen unverändert.
7. Mitgelieferte Objekttypen und „Risiko je Trade“ bieten weder Ändern noch Löschen an.
8. Die Anwenderdokumentation beschreibt die Arbeitsabläufe dieses Pakets verständlich und vollständig.

Technische Nachweise im Prüfbericht der QA: Das Prüfskript endet mit Exitcode 0 auf dem bereitgestellten Commit, darin die neuen Tests der Oberfläche und Browsertests in Chromium, Firefox und WebKit. Positive Testberichte beider Tester liegen für jeden zusammengeführten Auftrag vor.

## Abdeckung der Spezifikation

| Teil der Spezifikation | Paket |
|---|---|
| 1 Gegenstand, Nachweis mit `str-01` und `str-03` | `wp01` (Dokumente), `wp02` (Oberfläche) |
| 1 Abweichungen von den Vorlagen | `wp01` (Instanzen als Kopien, Löschen, Auslöser, OpenFormula, kein Index, Indikatoren ohne Berechnung), `wp03` (Löschen in der Oberfläche) |
| 2 E1, E4 bis E8 | `wp01` |
| 2 E2, E3 | `wp01` (Typbeschreibungen, Prüfung im Backend), `wp02` (Oberfläche ohne Typkenntnis, Dokument maßgeblich) |
| 3.1 bis 3.6 | `wp01` |
| 3.7 Dokumente und Schemata | `wp01`; Darstellung unbekannter Typen `wp02` |
| 4.1, 4.2 | `wp01` |
| 5.1 | `wp02`; Schaltfläche „Neues Objekt“ `wp03` |
| 5.3, 5.4 | `wp02` |
| 5.2 Strategie anlegen, Regeln zuordnen, Speichern, Schließen, Öffnen, Einstellungen | `wp02` |
| 5.2 Objekt verwenden | `wp02`; „Als Vorlage speichern“ `wp03` |
| 5.2 Objekt anlegen, öffnen, ändern | `wp03` |
| 5.2 Löschen | `wp02` (Strategie), `wp03` (Vorlage) |
| 6 Abbildung der Testfälle | `wp01` (Testfalldokumente), `wp02` (Aufbau über die Oberfläche) |
| 7 Bibliothek, Testfalldokumente, Backend, Skripte | `wp01` |
| 7 Oberfläche, Browsertest | `wp02`; „Objekt anlegen“ und „Vorlage löschen“ `wp03` |
| 8 Sicherheit | `wp01`; Satz zur Oberfläche `wp02`, `wp03` |
| 9 technische Dokumentation pipwerk Studio | `wp01` (Backend), `wp02`, `wp03` (Oberfläche) |
| 9 technische Dokumentation der Bibliothek | `wp01` |
| 9 Anwenderdokumentation | `wp02`, `wp03` |
| 9 Glossar | `wp01`; neue Begriffe der Oberfläche `wp02`, `wp03` |
| 10 Punkt 1 | `wp02` |
| 10 Punkt 2 | `wp01` (Bibliothek), `wp03` (Oberfläche) |
| 10 Punkte 3 bis 8 | `wp01` |
| 10 Folgen der fachlichen Festlegungen | keine Umsetzung, Hinweis für den Auftraggeber |

## Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-16 | Plan angelegt: drei Pakete, `wp02` hängt von `wp01` ab, `wp03` von `wp02`. |
| 2026-10-16 | Hinweise aus [plan-1.md](reviews/plan-1.md) eingearbeitet: P1 „Neues Objekt“ in `wp03` und in der Tabelle der Abdeckung; P2 Glossar in `wp03`; P3 zwei Stellen der Anwenderdokumentation in `wp01`; P4 Vergleich ohne Kennung und Zeitpunkte; P5 Ändern des Objektverzeichnisses als Abnahmekriterium nur in `wp02`, in `wp01` als technischer Nachweis; P6 Befund nach „Prüfen“; P7 „kein Fehler“; P8 Kriterien 8 bis 10 von `wp02` ergänzt; P9 Regelvorlage und Ändern einer Vorlage in `wp03`. |
