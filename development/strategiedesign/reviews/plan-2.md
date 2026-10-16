# Prüfbericht Arbeitspaketplan, Durchlauf 2 (Nachprüfung)

- Vorhaben: `strategiedesign`
- Phase: 3 Planung
- Rolle: QA
- Prüfauftrag: `development/strategiedesign/reviews/plan-2-order.md` auf `main`
- geprüfter Commit: `e396dd1d69e47bc918623262b923d2ee10708c71` (der Commit, mit dem der Prüfauftrag auf `main` kam; bei Beginn der Prüfung zugleich Stand von `origin/main`)
- Vergleichsstand: `cf61a6675e4debea316894aefd3b0bd04f86badb`
- Gegenstand: die geänderten Stellen von `development/strategiedesign/plan.md` nach `git diff cf61a6675e4debea316894aefd3b0bd04f86badb e396dd1d69e47bc918623262b923d2ee10708c71 -- development/strategiedesign/plan.md`

## Ergebnis

**bestanden**

- P1 bis P9 sind erledigt.
- Keine neuen blockierenden Befunde.
- Vier neue Hinweise (H1 bis H4). Sie verhindern das Bestehen nicht.

Dies ist eine Nachprüfung nach „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`. Geprüft wurden nur die geänderten Stellen und ihr Verhältnis zu den nicht geänderten Stellen, zur Spezifikation und zu den Dokumenten laut `scope.md`.

## 1. Geprüfte Unterlagen

- der Unterschied von `plan.md` zwischen Vergleichsstand und geprüftem Commit, dazu der Plan im geprüften Stand (196 Zeilen)
- `development/strategiedesign/reviews/plan-1.md` (Hinweise P1 bis P9)
- `development/strategiedesign/specification.md`, Abschnitte 3.3, 3.5, 3.6, 4.1, 4.2, 5.1 bis 5.4, 7, 8, 9
- `docs/design/requirements/anforderungen-strategiedesigner.md`, req-ui-008 (Zeile 277), req-ui-009 (Zeile 283), req-ablauf-009 (Zeile 367)
- `docs/user/pipwerk-studio.md`, Zeilen 30 und 32 (Bezug von P3)
- `docs/technical/entwicklungsverfahren.md`, „Umfang der Prüfungen“ (Zeilen 246 bis 252)

Weitere Dateien sind seit dem Vergleichsstand nicht geändert. `git diff --stat` nennt nur `plan.md`, `reviews/plan-1.md` und `reviews/plan-2-order.md`. Querverweise auf Nummern von Abnahmekriterien gibt es im Plan nicht (`grep -n "Kriterium" plan.md` ohne Treffer). Die neue Nummerierung in `wp01` und `wp02` bricht deshalb keinen Verweis.

## 2. Stand der Hinweise aus Durchlauf 1

| Hinweis | Änderung im Plan | Stand |
|---|---|---|
| P1 „Neues Objekt“ | Zeile 129 (Umfang `wp03`), Zeile 139 (umgesetzte Teile `wp03`), Zeile 171 (Tabelle: „5.1 `wp02`; Schaltfläche ‚Neues Objekt‘ `wp03`“). Zeile 88 (Nicht-Umfang `wp02`) unverändert und passend. | erledigt; Rest siehe H1 |
| P2 Glossar `wp03` | Zeile 130 („Glossar für neue Begriffe dieses Pakets“), Zeile 184 (Tabelle) | erledigt |
| P3 Anwenderdokumentation in `wp01` | Zeile 37 (Umfang: `testenv stop` und Warnung zu `--host`), Zeile 65 (Kriterium 8, zweiter Satz). Passt zu `docs/user/pipwerk-studio.md` Zeilen 30 und 32. | erledigt; Folgefrage siehe H3 |
| P4 Vergleich in `wp01` Kriterium 4 | Zeile 61: „abgesehen von Kennung und Zeitpunkten“. Das entspricht dem Browsertest der Spezifikation (Abschnitt 7) und 4.2 (`POST`: „Antwort mit Kennung“). | erledigt |
| P5 Objektverzeichnis über `/docs` | Altes Kriterium 8 von `wp01` entfernt. Zeile 44 (Nicht-Umfang: Prüfung durch den Auftraggeber in `wp02`), Zeile 67 (technischer Nachweis: Verschieben, Nichtverschieben, Konflikt), Zeile 111 (`wp02` Kriterium 9). Beide Fragen aus P5 sind damit beantwortet: Der Auftraggeber prüft in der Oberfläche. Den Konflikt belegen die Tests des Backends, wie in Spezifikation Abschnitt 7 („Verschieben und Nichtverschieben, Konflikt beim Verschieben“). | erledigt; Formulierung siehe H2 |
| P6 Zeitpunkt des Befunds | Zeile 104: „Nach ‚Prüfen‘ erscheint …“. Das stimmt mit Spezifikation 3.6 (Prüfung „auf Anforderung“) und 5.2 („Strategie anlegen“) überein. | erledigt |
| P7 „null Befunde“ | Zeile 105: „Die Konsistenzprüfung meldet keinen Fehler.“ Das stimmt mit dem Ziel (Zeile 73) und Spezifikation Abschnitt 1 überein. | erledigt |
| P8 Abläufe aus 5.2 bis 5.4 | Zeile 110 (Kriterium 8: Liste von „Öffnen“ mit Bezeichnung, Beschreibung, letzter Änderung), Zeile 111 (Kriterium 9: Verschieben und Nichtverschieben, Sprache nach Neuladen), Zeile 112 (Kriterium 10: Regeln hinzufügen, neu anlegen, Reihenfolge ändern, entfernen, Befunde bei der Regel, Herkunft). Der Menüpunkt „Prüfen“ wird über Kriterium 2 geprüft. Das Hinzufügen eines Regelwerks zur Strategie prüft `wp03` Kriterium 4 (Zeile 152). In `wp02` gibt es noch keine Vorlage eines Regelwerks, die sich hinzufügen ließe. | erledigt; Rest siehe H4 |
| P9 Regelvorlage, Ändern einer Vorlage | Zeile 150 (Kriterium 2: „Eine Regel erhält Parameter, Ausdruck, bestimmte Eigenschaft und Vergleich beim Prüfen“, wie Spezifikation 3.3 und 3.5), Zeile 152 (Kriterium 4: Vorlage öffnen, ändern, speichern, Instanz bleibt unverändert, wie req-param-005) | erledigt |

## 3. Prüfbarkeit der geänderten Abnahmekriterien durch den Auftraggeber

| Kriterium | in der Testumgebung selbst prüfbar | Begründung |
|---|---|---|
| `wp01` 4 | ja | über `/docs`; die Felder, die beim Vergleich wegfallen, sind jetzt genannt |
| `wp01` 8 | ja | Dokumentation lesen |
| `wp02` 2 | ja | „Neue Strategie“, dann „Prüfen“ in der Kopfzeile (Spezifikation 5.1) |
| `wp02` 3 | ja | Fehler sind rot umrandet und stehen in der Eigenschaftenansicht (5.4) |
| `wp02` 8 | ja | Liste von „Öffnen“ ansehen, Strategie löschen |
| `wp02` 9 | ja | Objektverzeichnis in den Einstellungen ändern, Liste von „Öffnen“ ansehen, Seite neu laden. Der Auftraggeber muss einen absoluten Pfad auf dem Rechner der Testumgebung angeben (Spezifikation 4.1). |
| `wp02` 10 | ja | mit der Regelvorlage „Risiko je Trade“ und dem Objekttyp `Regel` aus der Elementbibliothek; einen Befund an einer Regel erzeugt er zum Beispiel mit einem Schreibfehler im Ausdruck |
| `wp03` 2 | ja | in der Ansicht der Vorlage |
| `wp03` 4 | ja | Vorlage einfügen, öffnen, ändern, speichern, Instanz in der Strategie ansehen |

## 4. Neue Befunde

Keine blockierenden Befunde. Keine geänderte Stelle widerspricht einer Anforderung, der Spezifikation oder einer nicht geänderten Stelle des Plans so, dass Funktion oder Abnahme beeinträchtigt sind.

## 5. Hinweise (nicht blockierend)

### H1 – `wp02`, umgesetzte Teile: 5.1 ohne Ausnahme

- Fundstelle: Plan Zeile 93 („… 5.1, 5.2 ohne die Teile von `wp03`, 5.3, 5.4 …“), Zeile 103 (`wp02` Kriterium 1: „… nach 5.1“). Dagegen Zeile 88 (Nicht-Umfang `wp02`: „Neues Objekt“), Zeile 139 und Zeile 171 (Schaltfläche „Neues Objekt“ in `wp03`).
- Sachverhalt: Mit P1 sind Tabelle und Umfang von `wp03` berichtigt. Die umgesetzten Teile von `wp02` nennen 5.1 aber weiter ohne Ausnahme, anders als bei 5.2. Kriterium 1 von `wp02` verlangt den Aufbau „nach 5.1“, und 5.1 nennt die Schaltfläche „Neues Objekt“ in der Elementbibliothek.
- Kritikpunkt: Wer nur Zeile 93 oder Kriterium 1 liest, kann die Schaltfläche „Neues Objekt“ schon in `wp02` erwarten. Ist die Ausnahme dort bewusst weggelassen?

### H2 – `wp01`, Nicht-Umfang: Ändern des Objektverzeichnisses

- Fundstelle: Plan Zeile 44 („Ändern des Objektverzeichnisses durch den Auftraggeber: Er prüft es in der Oberfläche in `wp02`. In `wp01` belegen es die Tests des Backends.“). Dagegen Zeile 35 (Umfang `wp01`: „Verschieben (4.1, E5)“, „interne Endpunkte des Objektverzeichnisses (4.2)“).
- Sachverhalt: Die Funktion gehört zum Umfang von `wp01`. Nicht-Umfang ist nur ihre Prüfung durch den Auftraggeber. Unter der Überschrift „Nicht-Umfang“ lässt sich der Satz auch so lesen, dass `wp01` das Ändern nicht umsetzt.
- Kritikpunkt: Die Stelle unterscheidet nicht deutlich zwischen Umsetzung und Abnahme.

### H3 – Aussage zu `testenv stop` nach dem Ändern des Objektverzeichnisses

- Fundstelle: Plan Zeile 37 und Zeile 65 (`testenv stop` „entfernt auch die gespeicherten Strategien und Vorlagen der Testumgebung“), Zeile 111 (`wp02` Kriterium 9: Objektverzeichnis ändern mit „verschieben“). Spezifikation Abschnitt 7, letzter Punkt (Objektverzeichnis der Testumgebung unter `.testenv/`), 4.1 (Einstellung ist ein beliebiger absoluter Pfad).
- Sachverhalt: Die Aussage stimmt, solange das Objektverzeichnis unter `.testenv/` liegt. Ab `wp01` lässt es sich über die internen Endpunkte ändern, ab `wp02` in der Oberfläche. Liegt es danach außerhalb von `.testenv/`, bleiben die Dateien nach `testenv stop` nach Spezifikation Abschnitt 7 vermutlich erhalten. Wie das Testumgebungsskript das Objektverzeichnis setzt, ist erst im Auftrag festgelegt; das ist hier ungeprüft.
- Frage: Soll die Anwenderdokumentation den Fall eines geänderten Objektverzeichnisses in der Testumgebung nennen? Die Formulierung gehört in den Auftrag von `wp01` oder `wp02`.

### H4 – `wp02` Kriterium 9: Sprache nur nach Neuladen

- Fundstelle: Plan Zeile 111 („Die gewählte Sprache bleibt nach Neuladen der Seite erhalten.“). req-ui-008 (Anforderungen Strategiedesigner Zeile 277): Die Sprache wird „sowohl nach einem Neuladen der Oberfläche als auch nach einem Neustart des Strategiedesigners wiederhergestellt“, und sie wird „nicht im Browser“ gespeichert.
- Sachverhalt: Das Kriterium prüft nur das Neuladen. Den Neustart kann der Auftraggeber in der Testumgebung nicht selbst prüfen: `testenv stop` entfernt die Datenbank, nach dem Start ist wieder Deutsch eingestellt (`docs/user/pipwerk-studio.md` Zeile 30). Die Speicherung erfolgt heute schon, P8 hatte nur auf das Verlegen der Auswahl hingewiesen.
- Frage: Genügt für die Abnahme das Neuladen, oder soll ein technischer Nachweis den Neustart und die Speicherung außerhalb des Browsers belegen?

## 6. Zusammenfassung

| Punkt | Ergebnis | blockierend |
|---|---|---|
| P1 bis P9 | alle erledigt | – |
| Neue Fehler an den geänderten Stellen | keine | – |
| Geänderte Abnahmekriterien vom Auftraggeber prüfbar | ja, alle | – |
| Befunde | 0 | – |
| Hinweise | 4 (H1 bis H4) | nein |

Der Plan ist bestanden. Die Hinweise H1 bis H4 werden nach „Umfang der Prüfungen“ bei der nächsten passenden Gelegenheit erledigt oder verworfen, H3 spätestens in den Aufträgen von `wp01` oder `wp02`.
