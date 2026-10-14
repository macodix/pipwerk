# Prüfbericht Plan, Durchlauf 5

- Vorhaben: `ablauftest`
- Phase: 3 Planung, Prüfung des Arbeitspaketplans, Nachprüfung nach dem Einwand des Auftraggebers, erster Durchlauf der neuen Prüfschleife
- Rolle: QA
- Übergabedokument: `development/ablauftest/reviews/plan-5-order.md`
- geprüfter Commit: `31729060e603311a24f6b1c45a81881756b7a0a4`
- Prüfgegenstand: `development/ablauftest/plan.md`

## Ergebnis

**bestanden**

Der Plan enthält genau ein Arbeitspaket `wp01` mit einer Abnahme. Das Testumgebungsskript gehört zu diesem Paket. Es gibt keinen Verweis mehr auf ein Paket `wp02` als bestehendes Paket und keine Abhängigkeit zwischen Paketen. Alle Inhalte und Abnahmekriterien der beiden bisherigen Pakete stehen inhaltlich im neuen `wp01`. Jede Aussage von req-ui-010 ist durch die Spezifikation abgedeckt, jeder Teil der Spezifikation durch `wp01`. Befunde gibt es keine. Es gibt vier Hinweise (H11 bis H14). Sie bestimmen das Ergebnis nicht.

## 1. Geprüfter Stand

- `git log -1 --format=%H origin/main -- development/ablauftest/reviews/plan-5-order.md` liefert `31729060e603311a24f6b1c45a81881756b7a0a4`. Das ist auch der Stand von `origin/main` nach `git fetch origin`. Mein Arbeitsverzeichnis steht auf diesem Commit.
- `git diff --stat 87096ed4f7b30dc56f1719f0e201a4586a736736 31729060e603311a24f6b1c45a81881756b7a0a4` zeigt nur zwei geänderte Dateien: `development/ablauftest/plan.md` und `development/ablauftest/reviews/plan-5-order.md`.
- `git diff --stat b2398e2f57e9e3bef1537f5b473a06df4ec933fa 31729060e603311a24f6b1c45a81881756b7a0a4` für `development/ablauftest/specification.md`, `development/ablauftest/scope.md`, `docs/design/requirements/anforderungen-strategiedesigner.md`, `docs/technical/` und `components/pipwerk-studio/` liefert keine Änderung. Spezifikation, Anforderungen und Komponente stehen also auf dem Stand, den der Plan in Zeile 8 als Grundlage nennt.

## 2. Einwand (Auftrag Punkt 1)

Grundlage: `development/ablauftest/presentations/plan.html`, Folie 4, Vermerk: „ein einziges Arbeitspaket mit einer Abnahme statt zwei. Inhalt und Abnahmekriterien beider Pakete bleiben und werden zusammengeführt.“

| Prüfpunkt | Fundstelle in `plan.md` | Ergebnis |
|---|---|---|
| genau ein Paket `wp01` | Übersicht Zeile 15, einzige Paketüberschrift Zeile 23 | erfüllt |
| eine Abnahme | eine Liste „Abnahmekriterien“, Zeilen 79 bis 97 | erfüllt |
| Testumgebungsskript im Paket | Umfang Zeile 33, Ziel Zeile 27, Abnahmekriterien 1 bis 3 | erfüllt |
| keine Abhängigkeit zwischen Paketen | Übersicht „hängt ab von“: „–“; Abhängigkeiten Zeile 77: „keine“ | erfüllt |
| kein Verweis auf `wp02` als Paket | `grep -n wp02 plan.md` findet nur Zeile 9 (Status), 122, 123 und 126 (Änderungsnachweis). Alle vier beschreiben den früheren Zustand. | erfüllt |

## 3. Vollständigkeit der Zusammenführung (Auftrag Punkt 2)

Abgleich der Fassung in Commit `87096ed4f7b30dc56f1719f0e201a4586a736736` mit dem geprüften Commit.

| Bestandteil | Abgleich | Ergebnis |
|---|---|---|
| Ziel | Zeile 27 enthält die beiden Sätze des alten `wp01` und den Satz des alten `wp02` wörtlich. | vollständig |
| Umfang, Zeilen des alten `wp01` | Testumgebungsskript, Test des Testumgebungsskripts, Prüfskript, Browsertest gegen die gebaute Oberfläche, Schreibweise in der Oberfläche, Schreibweise im Backend, Tests der Schreibweise, Schreibweise in Kommentaren: Zeilen 33 bis 40, gleichlautend. In der Zeile „Prüfskript“ (Zeile 35) entfällt nur „in Phase 4“ bei der QA; die QA prüft das Paket ohnehin nur in Phase 4. | vollständig |
| Umfang, Zeilen des alten `wp02` | Ermittlung des Stands beim Bau, Gemeinsame Hilfsfunktionen, Adresse des Repositorys, Dialog, Aufrufstelle, Entwicklungsserver: Zeilen 41 bis 46, gleichlautend. Frontend-Tests und Browsertests: Zeilen 47 und 48, gleicher Inhalt, Titel um „des Dialogs“ ergänzt. Die alte Zeile „Prüfskript“ des `wp02` steht als Satz „Er hält Skript und Beschreibung bei jedem weiteren Auftrag des Pakets aktuell …“ in Zeile 35. | vollständig |
| Dokumentation, `docs/technical/pipwerk-studio.md` | Zeile 53 enthält alle Punkte des alten `wp01` und alle Punkte des alten `wp02`: Abschnitt zum Dialog mit E1 bis E9, Ermittlung beim Bau, Abbruch ohne `LICENSE`, neue Dateien in 2.3, Unterprozesse in Abschnitt 8, Tests des Dialogs in Abschnitt 6, Grenze im Entwicklungsbetrieb in Abschnitt 9. Die Einschränkung „soweit sie die Oberfläche betreffen“ gilt jetzt für alle neuen Dateien in 2.3. Abschnitt 2.3 der technischen Dokumentation heißt „Oberfläche“ (Zeile 61); alle neuen Dateien des alten `wp02` liegen unter `components/pipwerk-studio/frontend/`. Es fällt nichts weg. | vollständig |
| Dokumentation, `docs/user/pipwerk-studio.md` | Zeile 54 enthält alle Punkte beider alten Pakete. Das Glossar nennt jetzt alle zwölf Begriffe aus Abschnitt 7 der Spezifikation (Zeile 285) ohne den früheren Vorbehalt „soweit das Dokument sie verwendet“; das entspricht der Spezifikation. | vollständig |
| Dokumentation, `components/pipwerk-studio/README.md` und übrige README | Zeilen 55 und 56: Satz zum Dialog (alt `wp02`) und Schreibweise einschließlich Überschrift (alt `wp01`, Spezifikation Zeile 273). | vollständig |
| Nicht-Umfang | Zeilen 60 und 61. Der alte Punkt „Dialog … (`wp02`)“ und der Punkt „Ermittlung beim Bau … (`wp02`)“ entfallen zu Recht, weil beides jetzt Umfang ist. „Verhalten des Backends“ (alt `wp01`) und „Änderungen am Backend und an `GET /api/studio/revision`“ (alt `wp02`) sind zu „Änderungen am Verhalten des Backends und an `GET /api/studio/revision`“ zusammengefasst. Das entspricht Abschnitt 8 der Spezifikation (Zeile 294), denn die Texte des Backends ändern sich jetzt im selben Paket. | vollständig |
| Umgesetzte Teile der Spezifikation | Zeilen 65 bis 73: die ganze Spezifikation außer Abschnitt 8 und 9. Das ist die Vereinigung beider alten Listen. Die Aussagen zu W1, W2 und zu den bestehenden Prüfungen von Fußzeile und Tooltip nach den Verschiebungen stehen in Zeile 70. | vollständig |
| Abnahmekriterien | Kriterien 1 bis 5 gleich den alten Kriterien 1 bis 5 des `wp01`. Kriterien 6 bis 12 gleich den alten Kriterien 1 bis 7 des `wp02`. Siehe auch die Anmerkung unter der Tabelle. | vollständig |
| Kriterium 13 | Altes Kriterium 6 des `wp01`: Start als Testumgebung und im Entwicklungsbetrieb in ganzen Sätzen, Glossar, Verweise aus dem Fließtext, Schreibweise in Anwender- und technischer Dokumentation, Name und Aufruf von Testumgebungsskript und Prüfskript: alle Aussagen enthalten. Altes Kriterium 8 des `wp02`: Dialog, Stand in der Testumgebung und Abweichung im Entwicklungsbetrieb „verständlich und vollständig“: alle Aussagen enthalten. Keine Aussage ist verloren. | vollständig |
| Technische Nachweise | Zeile 97 enthält die Aufzählung des alten `wp01` und die Ergänzungen des alten `wp02` (neue Frontend- und Browsertests in Chromium, Firefox und WebKit, Suche nach Abschnitt 4.4). | vollständig |

Anmerkung zu den Abnahmekriterien: Die Einleitung lautet jetzt „Der Auftraggeber kann in der Testumgebung selbst prüfen“ (Zeile 81), wie früher beim `wp02`. Beim alten `wp01` stand „Der Auftraggeber kann selbst prüfen“. Die Kriterien 3, 5 und 13 betreffen ein Arbeitsverzeichnis, den Rechner der Testumgebung und die Dokumentation. Kriterium 5 nennt seinen Ort selbst. Eine Aussage geht dadurch nicht verloren; ich führe das nicht als Befund.

## 4. Abdeckung (Auftrag Punkt 3)

- Anforderung durch Spezifikation: req-ui-010 (Datei `docs/design/requirements/anforderungen-strategiedesigner.md`, Zeilen 287 bis 296) und Spezifikation sind seit Commit `b2398e2f57e9e3bef1537f5b473a06df4ec933fa` unverändert (Abschnitt 1). Ich habe die Tabelle „Abdeckung von req-ui-010“ (Zeilen 101 bis 116) Satz für Satz mit req-ui-010 abgeglichen: Dialog auf Anforderung, Name, Stand mit allen Teilaussagen, Genauigkeit in Testumgebung und Installation, Entwicklungsbetrieb mit Erklärung, Testumgebung als Weg zum Start, Lizenz, Adresse mit neuem Tab, Schaltfläche und Ort, Sperrung, Schließen, Sprache, Fußzeile, Name überall, Zeilenumbruch. Jede Aussage hat eine Zeile, jede Zeile nennt die zutreffenden Stellen der Spezifikation.
- Spezifikation durch Paket: Zeilen 65 bis 73 nennen alle Abschnitte 1 bis 7. Ich habe zusätzlich jede Datei der Tabelle in Abschnitt 3.1 der Spezifikation (Zeilen 48 bis 82) im Umfang von `wp01` gesucht. Alle 35 Zeilen der Tabelle sind abgedeckt. `e2e/studio.spec.ts` für die Überschrift ist in der Zeile „Schreibweise in der Oberfläche“ als „im Browsertest“ benannt und im Absatz „Reihenfolge innerhalb des Pakets“ mit Dateinamen genannt, wie in der bereits geprüften Fassung.
- Spalte „Paket“: Alle Zeilen nennen `wp01`. Die Zeile „Stand genau in Testumgebung und Installation“ nennt Testumgebungsskript und Dialog. Kein Teil ist mehr einem anderen Paket zugeordnet.

Ergebnis: vollständig abgedeckt.

## 5. Bestandteile (Auftrag Punkt 4)

| Bestandteil nach `docs/technical/entwicklungsverfahren.md`, Zeile 100 | Fundstelle | Ergebnis |
|---|---|---|
| Ziel | Zeilen 25 bis 27 | vorhanden |
| Umfang | Zeilen 29 bis 56 | vorhanden |
| Nicht-Umfang | Zeilen 58 bis 61 | vorhanden |
| umgesetzte Teile der Spezifikation | Zeilen 63 bis 73 | vorhanden |
| Abhängigkeiten | Zeilen 75 bis 77 | vorhanden |
| Abnahmekriterien | Zeilen 79 bis 97 | vorhanden |
| Stand `open` oder `done` | Übersicht Zeile 15: `open` | vorhanden |

Ergebnis, das der Auftraggeber selbst prüfen kann: Die Kriterien 1 bis 13 beschreiben jeweils eine Handlung im Browser, an der Kommandozeile oder in der Dokumentation mit sichtbarem Ergebnis. Das Paket endet damit mit einem Ergebnis, das der Auftraggeber selbst prüfen kann (Begriff „Arbeitspaket“, `entwicklungsverfahren.md` Zeile 45).

## 6. Neue Stellen (Auftrag Punkt 5)

| Stelle | Ergebnis |
|---|---|
| Zeile 19, „Reihenfolge innerhalb des Pakets“ | Kein Widerspruch. Die Begründung (Abnahme braucht das Testumgebungsskript, Nachweis zu E9 braucht den Browsertest gegen die gebaute Oberfläche) entspricht E9 und Abschnitt 4.2 der Spezifikation (Zeilen 29 und 183). Die Aussage „vor der Prüfung durch die QA zusammengeführt“ entspricht `entwicklungsverfahren.md` Zeile 117. „Aufträge, die dieselben Dateien ändern, … nacheinander“ ist mit Zeile 317 vereinbar (mehrere Entwickler nur für unabhängige Teile). Die aufgezählten Dateien werden tatsächlich von mehreren Zeilen des Umfangs geändert. Siehe Hinweise H11 und H13. |
| Zeile 35, „Prüfskript“, Pflege bei weiteren Aufträgen | Kein Widerspruch. Inhaltlich gleich der alten Zeile „Prüfskript“ des `wp02`. Vereinbar mit `entwicklungsverfahren.md` Zeilen 280 und 283 (Zweig des Testers Funktion, Zusammenführung vor der QA, Änderung nur am Prüfskript macht Testberichte nicht ungültig). Siehe Hinweis H14. |
| Zeile 35, Ort der Tests des Dialogs in 6.2 und 6.3 | Kein Widerspruch. `docs/technical/pipwerk-studio.md` hat im geprüften Commit 6.2 Frontend (Zeile 259, Vitest über `npm test`) und 6.3 Browser-End-to-End-Test (Zeile 273, Playwright). Die Frontend-Tests des Dialogs (Zeile 47 des Plans) sind Vitest-Tests, auch die unter `buildinfo/` (Spezifikation Zeile 161). Die Browsertests des Dialogs sind Playwright-Tests. Die Nummer 6.4 bleibt frei. Abschnitt 6.2 der Spezifikation (Zeile 265) lässt das Prüfskript 6.1 bis 6.3 ausführen; die Tests des Dialogs sind damit erfasst. |
| Zeile 9, Status „prüfung“ | Stimmt mit `reviews/plan-4.md` überein (Ergebnis „bestanden“, Hinweis H10) und mit dem Vermerk auf Folie 4. Der Verweis `reviews/plan-5.md` hat im geprüften Commit noch kein Ziel; das Ziel ist dieser Bericht. Das ist kein Befund. |
| Zeile 125, Nachtragung zu H10 | Die Zeile nennt jetzt beide Änderungen aus Durchlauf 3 an der Zeile „Prüfskript“: die Umstellung des Satzes zum Entwickler und die Ersetzung von „Er“ durch „Der Tester Funktion“. Die Nachtragung ist als solche gekennzeichnet. H10 ist erledigt. |
| Zeile 126, Änderungsnachweis zum Einwand | Inhaltlich zutreffend. Siehe Hinweis H12. |

Keine der neuen Stellen widerspricht der Spezifikation, dem Entwicklungsverfahren oder einer anderen Stelle des Plans.

## 7. Befunde

Keine.

## 8. Hinweise

Diese Hinweise bestimmen das Ergebnis nicht.

### H11 – Aufzählung der gemeinsam geänderten Dateien

- Fundstelle: `plan.md` Zeile 19, vorletzter Satz: „Mehrere Teile ändern `src/App.tsx`, `src/App.test.tsx`, `vite.config.ts`, `e2e/studio.spec.ts`, `components/pipwerk-studio/README.md` und die Dokumentation“.
- Sachverhalt: `components/pipwerk-studio/.gitignore` wird ebenfalls von zwei Teilen geändert: Zeile 33 (Eintrag `.testenv/`) und Zeile 36 (Eintrag `frontend/dist-e2e/`). Die Aufzählung nennt die Datei nicht. Die Regel im folgenden Halbsatz gilt allgemein und erfasst sie trotzdem.
- Frage: Ist die Aufzählung als vollständig gemeint? Wenn ja: Soll sie `components/pipwerk-studio/.gitignore` nennen?

### H12 – Änderungsnachweis zum Einwand

- Fundstelle: `plan.md` Zeile 126.
- Sachverhalt: Der Diff zu Commit `87096ed4f7b30dc56f1719f0e201a4586a736736` zeigt in Zeile 35 neben der Pflege bei weiteren Aufträgen auch den neuen Halbsatz „die Frontend-Tests des Dialogs in 6.2 und seine Browsertests in 6.3“ und den Wegfall von „in Phase 4“. Außerdem lautet die Einleitung der Abnahmekriterien (Zeile 81) jetzt „in der Testumgebung selbst prüfen“. Der Änderungsnachweis nennt diese drei Änderungen nicht einzeln.
- Frage: Soll der Änderungsnachweis diese Änderungen nennen, wie nach H10 bei der Ersetzung von „Er“?

### H13 – Inhalt des Absatzes „Reihenfolge innerhalb des Pakets“

- Fundstelle: `plan.md` Zeile 19.
- Sachverhalt: Die Überschrift spricht von einer Reihenfolge. Der Absatz legt aber keine Reihenfolge der Teile fest. Er sagt nur, dass alles vor der Prüfung durch die QA zusammengeführt ist, und dass Aufträge mit denselben Dateien nacheinander laufen. Wird ein Auftrag mit den Browsertests des Dialogs vor der Umstellung in `playwright.config.ts` getestet, laufen diese Browsertests in dessen Testberichten gegen den Entwicklungsserver. Den Nachweis zu E9 an der gebauten Oberfläche (Spezifikation Zeile 188) erbringt dann erst das Prüfskript auf dem zusammengeführten Stand. Das reicht nach Zeile 97 des Plans für die Abnahme. Die Aufteilung in Aufträge ist nach `entwicklungsverfahren.md` Zeile 106 Sache des Softwarearchitekten in Phase 4.
- Frage: Soll der Absatz nur die Voraussetzung für die Prüfung durch die QA festhalten, oder auch eine Reihenfolge zwischen der Umstellung des Browsertests und den Browsertests des Dialogs?

### H14 – Pflege des Prüfskripts über mehrere Aufträge

- Fundstelle: `plan.md` Zeile 35: „Er hält Skript und Beschreibung bei jedem weiteren Auftrag des Pakets aktuell, wenn dessen neue Tests es verlangen.“
- Sachverhalt: Der Zweig des Testers Funktion wird auf dem zu prüfenden Commit aufgesetzt (`entwicklungsverfahren.md` Zeile 280) und spätestens vor der Prüfung durch die QA zusammengeführt (Zeile 283). Früher lag zwischen den beiden Paketen die Integration in `main`; das Prüfskript war beim zweiten Paket schon im Stand enthalten. Jetzt liegen alle Aufträge in einem Arbeitszweig. Ist der Zweig des Testers Funktion beim nächsten Auftrag noch nicht zusammengeführt, enthält dessen Commit weder `components/pipwerk-studio/scripts/check` noch Abschnitt 6.4. Der Plan widerspricht dem Verfahren nicht; er sagt aber nicht, von welchem Stand der Tester Funktion bei weiteren Aufträgen ausgeht.
- Frage: Wird das in Phase 4 bei den Aufträgen geregelt, oder soll der Plan dazu etwas festlegen?

## 9. Hinweise aus früheren Durchläufen

- H10 aus `reviews/plan-4.md`: erledigt (Abschnitt 6, Zeile 125).
