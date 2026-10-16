# Prüfbericht Arbeitspaketplan, Durchlauf 1

- Vorhaben: `strategiedesign`
- Phase: 3 Planung
- Rolle: QA
- Prüfauftrag: `development/strategiedesign/reviews/plan-1-order.md` auf `main`
- geprüfter Commit: `cf61a6675e4debea316894aefd3b0bd04f86badb` (der Commit, mit dem der Prüfauftrag auf `main` kam; bei Beginn der Prüfung zugleich Stand von `origin/main`)
- Gegenstand: `development/strategiedesign/plan.md`

## Ergebnis

**bestanden**

- Keine blockierenden Befunde.
- Neun Hinweise (P1 bis P9). Sie verhindern das Bestehen nicht.

Dies ist der erste Durchlauf. Er meldet nach „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md` alle Befunde und Hinweise. Testdetails, vollständige Listen von Kennungen, Grenzwerte und Formulierungen gehören in die Aufträge. Sie wurden deshalb nicht als Mangel des Plans gewertet.

## 1. Geprüfte Unterlagen

- `development/strategiedesign/plan.md`
- `development/strategiedesign/specification.md`
- `development/strategiedesign/scope.md`
- `docs/design/requirements/anforderungen-gesamtsystem.md`, `docs/design/requirements/anforderungen-strategiedesigner.md`
- `docs/design/domain/fachmodell.md`; Testfälle `str-01` und `str-03` über Abschnitt 6 der Spezifikation
- `development/strategiedesign/presentations/specification-1.html`, „Vermerk der Bestätigung“ (Zeile 272)
- `development/strategiedesign/reviews/specification-2.md`, `development/strategiedesign/reviews/specification-3.md`
- `docs/technical/entwicklungsverfahren.md` (Phase 3, „Umfang der Prüfungen“), `docs/technical/agentenrollen-und-briefings.md` (Briefing QA)
- zum Abgleich der Prüfbarkeit der Abnahmekriterien: `docs/user/pipwerk-studio.md`, `components/pipwerk-studio/scripts/testenv`, `components/pipwerk-studio/backend/src/pipwerk_studio/app.py`

Wie im Auftrag festgelegt, wurden nicht geprüft: die bestätigte Spezifikation selbst, die als offen gekennzeichneten Punkte, die Ausführung von Strategien und die Vorlagen unter `docs/design/planning/`.

Änderungen seit der letzten Prüfung der Spezifikation (`specification-3.md`, Commit `d90f994cb15a717786b5fefacad041ec004e28a7`), nach `git diff --stat d90f994 cf61a66`: Die Spezifikation ist unverändert. In den Dokumenten des Auftraggebers ist nur req-fach-051 geändert. Dort ist Festlegung 4 nachgetragen (Hinweis S26). Der Nachtrag stimmt mit Spezifikation 3.4 (Zeilen 143 bis 147) und 3.6 (Zeilen 213, 214) überein.

## 2. Prüfpunkt 1: Anforderungen durch die Spezifikation abgedeckt

Ergebnis: erfüllt.

Geprüft wurde jede Anforderung der Dokumente laut `scope.md`:

| Dokument | Anforderungen | Stelle in der Spezifikation |
|---|---|---|
| Strategiedesigner, Abschnitte 2 und 3 | req-grund-001, 002; req-fach-001 bis 009, 015, 027 | 1, 3.1 bis 3.4, E2, E7 |
| Strategiedesigner, Abschnitt 4 | req-param-001 bis 006 | 3.1, 3.3, 3.6 |
| Strategiedesigner, Abschnitt 5 | req-core-001, 002 | 3.2, 3.5 |
| Strategiedesigner, Abschnitt 6 | req-ui-001 bis 013 | 3.7, 5.1 bis 5.4, 10 Punkt 1; req-ui-008 und req-ui-010 sind bestehende Funktionen, 5.1 verlegt die Sprachauswahl und lässt Kopfzeile rechts und Fußzeile unverändert |
| Strategiedesigner, Abschnitt 7 | req-ablauf-001 bis 009 | 3.6, 4.1, 4.2, 5.2 |
| Gesamtsystem | req-system-004, 006, 007, 008, 009, 010, 011, 012, 015, 016, 019 bis 023 | 1, E1, E2, 3.7, 4.1, 4.2, 8, 9 |
| Fachmodell | req-fach-010 bis 054, soweit nicht Ausführung | 3.1 bis 3.6, 6 |

Die Testfälle `str-01` und `str-03` sind in Abschnitt 6 abgebildet. Die Hinweise aus der Prüfung der Spezifikation, die die Abdeckung berühren (S16 bis S22, S24, S25, S27), sind im Plan Aufträgen zugewiesen (Plan Zeile 23). S23 und S26 sind durch den Vermerk der Bestätigung erledigt.

## 3. Prüfpunkt 2: Spezifikation durch Arbeitspakete abgedeckt

Ergebnis: erfüllt.

Jeder Abschnitt der Spezifikation ist in der Tabelle „Abdeckung der Spezifikation“ (Plan Zeilen 158 bis 185) einem Paket zugeordnet. Die Zuordnung stimmt mit „Umfang“ und „Umgesetzte Teile der Spezifikation“ der Pakete überein. Einzelpunkte, die beim Abgleich geprüft wurden:

- E6 und Abschnitt 10 Punkt 2: Bibliothek in `wp01`, Oberfläche in `wp03`
- 3.6, Befunde einer Vorlage beim Speichern: Bibliothek in `wp01`, Anzeige in `wp03`
- 3.7, zweiter Absatz (unbekannter Typ): Dokument in `wp01`, Darstellung in `wp02`
- 4.1, letzter Satz (geöffnete Strategie bleibt offen): Einstellungen in `wp02`
- Abschnitt 7: jeder Punkt einem Paket zugeordnet, die Browsertests aufgeteilt auf `wp02` und `wp03`
- Abschnitt 9: alle vier Punkte zugeordnet, die Berichtigungen des Glossars in `wp01`
- Abschnitt 10, „Folgen der fachlichen Festlegungen“: ausdrücklich ohne Umsetzung

Kleine Unstimmigkeiten in der Zuordnung stehen in P1 und P2.

## 4. Prüfpunkt 3: Aufbau der Pakete

Ergebnis: erfüllt.

| Paket | Ziel | Umfang | Nicht-Umfang | umgesetzte Teile | Abhängigkeiten | Abnahmekriterien | Ergebnis vom Auftraggeber prüfbar |
|---|---|---|---|---|---|---|---|
| `wp01` | ja | ja | ja | ja | ja (keine) | ja | ja, über die Schnittstellenbeschreibung `/docs` am Port des Backends; das Testumgebungsskript startet das Backend auf einem eigenen Port (`testenv start --frontend-port <port> --backend-port <port>`), FastAPI liefert `/docs` ohne Abschaltung in `app.py` Zeile 120 |
| `wp02` | ja | ja | ja | ja | ja | ja | ja, in der Oberfläche |
| `wp03` | ja | ja | ja | ja | ja | ja | ja, in der Oberfläche |

Der Plan führt je Paket den Stand `open` (Zeilen 15 bis 17).

## 5. Prüfpunkt 4: Abhängigkeiten

Ergebnis: erfüllt.

- `wp01` hat keine Abhängigkeit. Alle Abnahmekriterien lassen sich mit Bibliothek, Backend und `/docs` prüfen. Kriterium 1 verlangt, dass die bestehende Oberfläche unverändert arbeitet.
- `wp02` hängt von `wp01` ab. Es braucht Typbeschreibungen, Konsistenzprüfung, `/api/v1/check` und Ablage. Kriterium 10 (unbekannter Typ, angelegt über die Schnittstellenbeschreibung) braucht die Web-API aus `wp01`.
- `wp03` hängt von `wp02` ab. Es braucht Elementbibliothek, Zeichenfläche, Eigenschaftenansicht und Rückfragen aus `wp02`. Die Endpunkte für Vorlagen und `usages` kommen aus `wp01`. Diese Abhängigkeit ist über `wp02` mittelbar erfüllt.
- Kein Paket braucht ein Ergebnis eines späteren Pakets für seine Abnahme.

## 6. Prüfpunkt 5: Abnahmekriterien gegen Spezifikation und Anforderungen

Ergebnis: Kein Abnahmekriterium widerspricht der Spezifikation oder einer Anforderung. Mehrdeutigkeiten und Lücken stehen in P3 bis P9.

## 7. Befunde

Keine.

## 8. Hinweise (nicht blockierend)

### P1 – Schaltfläche „Neues Objekt“: Tabelle und Nicht-Umfang von `wp02` passen nicht zusammen

- Fundstelle: Plan Zeile 169 („5.1, 5.3, 5.4 → `wp02`“), Zeile 77 (Umfang `wp02`: Aufbau nach 5.1), Zeile 88 (Nicht-Umfang `wp02`: „Neues Objekt“). Spezifikation 5.1, Zeile „links“: die Elementbibliothek enthält die „Schaltfläche ‚Neues Objekt‘“.
- Sachverhalt: Nach der Tabelle gehört 5.1 ganz zu `wp02`. Die Schaltfläche „Neues Objekt“ aus 5.1 ist aber Nicht-Umfang von `wp02` und kommt erst in `wp03`. Ebenso fehlt in der Tabellenzeile 5.1 der Anteil von `wp03`.
- Kritikpunkt: Die Tabelle der Abdeckung nennt für 5.1 nur `wp02`, obwohl ein Teil davon in `wp03` umgesetzt wird.

### P2 – Glossar für neue Begriffe aus `wp03` nicht vorgesehen

- Fundstelle: Plan Zeile 128 (Dokumentation `wp03`), Zeile 181 („9 Glossar: `wp01`; neue Begriffe der Oberfläche `wp02`“). Anforderung req-system-021, dritter Absatz: Jeder in der Dokumentation erforderliche Fachbegriff wird im Glossar definiert.
- Sachverhalt: `wp03` führt die Ansicht einer Vorlage, das Kontextmenü der Elementbibliothek und „Als Vorlage speichern“ ein. Die Dokumentation von `wp03` nennt das Glossar nicht.
- Frage: Ergänzt `wp03` das Glossar um seine neuen Begriffe, oder sind alle Begriffe schon durch `wp01` und `wp02` abgedeckt?

### P3 – `wp01`: Anwenderdokumentation wird durch das Paket an zwei Stellen unvollständig

- Fundstelle: Plan Zeile 37 (Dokumentation `wp01`, nur technische Dokumentation und Glossar), Zeile 43 (Nicht-Umfang: „Anwenderdokumentation zu den Arbeitsabläufen“). `docs/user/pipwerk-studio.md` Zeile 30 („`testenv stop` … entfernt die Dateien der Testumgebung, auch ihre Datenbank“) und Zeile 32 (Warnung zu `--host`: jeder im Netz kann „Einstellungen, zum Beispiel die Sprache, ändern“). Anforderungen req-system-019 (betroffene Dokumentation im selben Arbeitspaket), req-system-020 (Anwenderdokumentation).
- Sachverhalt: Mit `wp01` liegt das Objektverzeichnis der Testumgebung unter `.testenv/` (Spezifikation Abschnitt 7, letzter Punkt). Beim Beenden gehen damit auch die gespeicherten Strategien und Vorlagen verloren. Mit `--host` kann außerdem jeder im Netz Strategien und Vorlagen anlegen, ändern und löschen und das Objektverzeichnis auf einen beliebigen absoluten Pfad setzen und die Dateien dorthin verschieben. Beides steht nicht in der Anwenderdokumentation. Spezifikation Abschnitt 8 verlangt die Nennung nur in der technischen Dokumentation. Der Plan schließt diese Stellen nicht aus, nennt sie aber auch nicht. In Phase 4 prüft die QA die Anwenderdokumentation auf Vollständigkeit.
- Frage: Berichtigt `wp01` diese beiden Stellen der Anwenderdokumentation, oder erst `wp02`?

### P4 – `wp01` Kriterium 4: „dasselbe Dokument“ bei vom Backend vergebener Kennung

- Fundstelle: Plan Zeile 60. Spezifikation 4.2 (`POST`: „anlegen; Antwort mit Kennung“), Abschnitt 7, Browsertest („verglichen, ohne Kennungen, Lage und Zeitpunkte“).
- Sachverhalt: Vergibt das Backend beim Anlegen eine neue Kennung, liefert `GET /api/v1/strategies/{id}` nicht dasselbe Dokument wie das Testfalldokument. Der Browsertest der Spezifikation nimmt Kennungen und Zeitpunkte deshalb vom Vergleich aus. Kriterium 4 tut das nicht.
- Frage: Übernimmt `POST` die Kennung aus dem Dokument? Wenn nicht: Welche Felder darf der Auftraggeber beim Vergleich in Kriterium 4 außer Acht lassen?

### P5 – `wp01` Kriterium 8: interne Endpunkte in `/docs` und Konflikt im Zielverzeichnis

- Fundstelle: Plan Zeile 55 (Prüfung „über die Schnittstellenbeschreibung `/docs`“), Zeile 64 (Kriterium 8). Spezifikation 4.2 (interne Endpunkte `/api/studio/settings/object-directory`), Abschnitt 7, Backend („erzeugte OpenAPI-Beschreibung gleich der Datei unter `contracts/api/`“). Anforderung req-system-009, zweiter Absatz (Web-API getrennt von internen Details der Oberfläche).
- Sachverhalt:
  - Heute zeigt `/docs` alle Endpunkte (`app.py` Zeile 120, `FastAPI(title="pipwerk Studio")` ohne weitere Angaben). Trennt ein Auftrag die internen Endpunkte aus der Beschreibung heraus, damit die erzeugte Beschreibung nur die öffentliche Web-API enthält, lässt sich Kriterium 8 nicht mehr über `/docs` prüfen.
  - Für den Fall „im Ziel liegt schon eine Datei gleichen Namens“ muss der Auftraggeber vorher selbst eine Datei in ein Verzeichnis des Rechners legen. Das geht nicht über `/docs`.
- Frage: Über welchen Weg prüft der Auftraggeber Kriterium 8, wenn die internen Endpunkte nicht in `/docs` erscheinen? Wie legt er den Konflikt im Zielverzeichnis an?

### P6 – `wp02` Kriterium 2: Zeitpunkt des Befunds

- Fundstelle: Plan Zeile 104 („‚Neue Strategie‘ zeigt eine Zeichenfläche mit einem Auslöser `Kerzenschluss`. Der fehlende Wert der Zeiteinheit erscheint unter anderem als Befund am Auslöser.“). Spezifikation 3.6 (die Prüfung läuft „beim Speichern, auf Anforderung“), 5.2 („Strategie anlegen“: gespeichert wird erst mit „Speichern“).
- Sachverhalt: Nach der Spezifikation läuft die Konsistenzprüfung beim Anlegen nicht. Das Kriterium lässt offen, ob der Befund sofort oder erst nach „Prüfen“ erscheinen soll. Liest man es als „sofort“, verlangt es mehr als die Spezifikation.
- Frage: Erscheint der Befund nach „Neue Strategie“ sofort oder erst nach „Prüfen“?

### P7 – `wp02` Kriterium 3: „null Befunde“ statt „kein Fehler“

- Fundstelle: Plan Zeile 105 („Die Kopfzeile nennt null Befunde“), Zeile 73 (Ziel: „ohne Fehler der Konsistenzprüfung“). Spezifikation Abschnitt 1 („meldet für sie keinen Fehler“), 3.6 (Befunde sind Fehler oder Hinweise).
- Sachverhalt: Das Kriterium verlangt keine Befunde, also auch keine Hinweise. Spezifikation und Ziel des Pakets verlangen nur keine Fehler. Nach Abschnitt 6 der Spezifikation ergibt sich für beide Testfälle auch kein Hinweis. Es ist aber strenger formuliert als die Spezifikation.
- Frage: Ist „null Befunde“ gewollt, oder gilt wie im Ziel „kein Fehler“?

### P8 – `wp02`: Abläufe aus 5.2 bis 5.4 ohne eigenes Abnahmekriterium

- Fundstelle: Plan Zeilen 101 bis 113. Spezifikation 5.1 (Menüpunkt „Prüfen“), 5.2 („Regeln zuordnen“: Reihenfolge ändern, entfernen, Regelwerk hinzufügen; „Öffnen“: Liste mit Bezeichnung, Beschreibung, letzter Änderung), 5.3 (Herkunft der Instanz), 5.4 (Befunde zu einer Regel der Strategie stehen bei dieser Regel). Anforderungen req-ablauf-007 („auf Anforderung“), req-ablauf-008, req-ui-005 (Herkunft), req-ui-012, req-fach-044 (Reihenfolge änderbar). Ebenso req-ui-008: Die Sprache wird nach dem Verlegen in die Einstellungen weiter dauerhaft gespeichert. Kriterium 1 prüft nur die Wahl.
- Sachverhalt: Diese Teile sind im Umfang von `wp02` enthalten. Kriterium 11 (Anwenderdokumentation) und die Tests decken sie mittelbar ab. Ein Kriterium, das der Auftraggeber in der Oberfläche selbst nachvollzieht, gibt es für sie nicht. Die Testfälle verwenden je eine Regel der Strategie und eine Regel des Elements, aber kein Regelwerk, kein Ändern der Reihenfolge und kein Entfernen.
- Frage: Sollen diese Abläufe in der Abnahme von `wp02` ausdrücklich geprüft werden?

### P9 – `wp03`: Inhalt einer Regelvorlage und Ändern einer Vorlage ohne Abnahmekriterium

- Fundstelle: Plan Zeile 148 (Kriterium 2 nennt Indikator, Trend und Regelwerk, aber nicht die Regel), Zeilen 147 bis 154. Spezifikation 3.3 (Regel: Parameter, fachlicher Ausdruck, bestimmte Eigenschaft, Vergleich beim Prüfen), 3.5, E4. Anforderung req-param-005 („Eine Vorlage kann in Bezeichnung, Beschreibung, Standardwerten und, bei Regeln, im fachlichen Ausdruck geändert werden, bestehende Instanzen bleiben davon unberührt“), req-ablauf-008 (Vorlage aus der Elementbibliothek öffnen).
- Sachverhalt:
  - Kein Kriterium prüft, dass eine Regelvorlage mit Parametern, Ausdruck, bestimmter Eigenschaft und Vergleich beim Prüfen angelegt werden kann.
  - Kein Kriterium prüft das Öffnen und Ändern einer gespeicherten Vorlage und dass bestehende Instanzen danach unverändert sind. Kriterium 6 prüft das nur für das Löschen, `wp01` Kriterium 7 ebenfalls nur für das Löschen.
- Frage: Sollen Anlegen einer Regelvorlage mit ihrem vollständigen Inhalt und Ändern einer Vorlage ohne Wirkung auf Instanzen in die Abnahmekriterien von `wp03` aufgenommen werden?

## 9. Zusammenfassung

| Prüfpunkt | Ergebnis | blockierend |
|---|---|---|
| 1 Anforderungen durch die Spezifikation abgedeckt | ja | – |
| 2 Spezifikation durch Pakete abgedeckt | ja; Unstimmigkeit in der Tabelle (P1), Glossar `wp03` (P2) | nein |
| 3 Aufbau der Pakete, Ergebnis vom Auftraggeber prüfbar | ja | – |
| 4 Abhängigkeiten | stimmen | – |
| 5 Abnahmekriterien gegen Spezifikation und Anforderungen | kein Widerspruch; Mehrdeutigkeiten und Lücken P3 bis P9 | nein |
| Befunde | 0 | – |
| Hinweise | 9 (P1 bis P9) | nein |

Der Plan ist bestanden. Die Hinweise werden nach „Umfang der Prüfungen“ bei der nächsten passenden Gelegenheit erledigt oder verworfen. P3, P4 und P5 betreffen `wp01` und sollten spätestens in dessen Aufträgen beantwortet sein.
