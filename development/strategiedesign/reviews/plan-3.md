# Prüfbericht Plan, Durchlauf 3

- Vorhaben: `strategiedesign`, ref `strategiedesign`
- Phase: 3, Neufassung von `wp02` und `wp03`
- Rolle: QA
- Prüfauftrag: `development/strategiedesign/reviews/plan-3-order.md`
- geprüfter Commit: `70831e9872bcd94087f1109c44b5a1e85ca15497` (`main`, Commit, der den Prüfauftrag anlegt; ermittelt mit `git log -1 --format=%H -- development/strategiedesign/reviews/plan-3-order.md` auf `origin/main`)
- Gegenstand: `development/strategiedesign/plan.md`: Status, Übersicht, `wp02`, `wp03`, Tabelle der Abdeckung, erste Zeile des Änderungsnachweises. Für `wp02` und `wp03` ist dies ein erster Durchlauf, also vollständig.
- Grundlagen: Briefing QA, „Umfang der Prüfungen“ und Phase 3 im Entwicklungsverfahren, `scope.md` mit den dort genannten Dokumenten, `specification.md`, `wp02/acceptance/1.md`, `reviews/specification-9.md` (T2-H6), Beschreibung des Prototyps (`strategiedesign/proto-studio:components/pipwerk-studio/prototype/README.md`, auf die Spezifikation 5 verweist)

## Ergebnis

**Bestanden.** Keine blockierenden Befunde. Sieben Hinweise.

## Prüfungen im Einzelnen

### Anforderungen durch die Spezifikation abgedeckt

Die Spezifikation hat in `specification-10.md` bestanden und ist nicht Gegenstand. Zusätzlich habe ich die Kennungen der Anforderungen aus `anforderungen-gesamtsystem.md`, `anforderungen-strategiedesigner.md` und `fachmodell.md` gegen die Kennungen in `specification.md` abgeglichen. Die Kennungen ohne Nennung in der Spezifikation sind entweder in genannten Bereichen enthalten (req-fach-029, req-fach-030 in „req-fach-028 bis req-fach-032“; req-fach-042, req-fach-043 in „req-fach-041 bis req-fach-045“), betreffen die Ausführung oder das Gesamtsystem außerhalb des Vorhabens, oder sind allgemeine Anforderungen, die die Spezifikation mit ihren Abschnitten umsetzt (zum Beispiel req-ablauf-001 durch 5.5, req-ui-001 durch 5.3, req-ui-008 durch die Einstellungen in 5.5). Kein Befund.

### Spezifikation durch Arbeitspakete abgedeckt

Jeder Abschnitt der Spezifikation (1 bis 10) ist in der Tabelle der Abdeckung (`plan.md` Zeilen 168 bis 193) einem Paket zugeordnet, und jede Zuordnung findet sich im Umfang des Pakets wieder. Abweichungen zwischen Tabelle und den Listen „Umgesetzte Teile“ stehen in den Hinweisen H1 und H2. Die Teile der Oberfläche, die `wp03` nicht ausdrücklich nennt, folgen in `wp02` dem bestätigten Prototyp (`plan.md` Zeile 81). Kein blockierender Befund.

### Ergebnis, das der Auftraggeber selbst prüfen kann

`wp02` (Kriterien 1 bis 12) und `wp03` (Kriterien 1 bis 10) beschreiben jeweils Bedienungen, die der Auftraggeber in der Testumgebung selbst ausführt. Erfüllt.

### Abnahmekriterium zur Bedienbarkeit

- `wp02`, Kriterium 1 (`plan.md` Zeile 103): `str-03` aus der leeren Zeichenfläche ohne Anleitung, wie im bestätigten Prototyp; Kriterium 2 ebenso `str-01`.
- `wp03`, Kriterium 1 (`plan.md` Zeile 151): Regel `mindestvolumen` aus `str-03` als eigene Vorlage anlegen und einfügen, ohne Anleitung, wie im bestätigten Prototyp.

Erfüllt nach Entwicklungsverfahren Phase 3 (Zeile 104).

### Mängel M1 bis M17 im Umfang von `wp02`

| Mangel | Abgedeckt durch |
|---|---|
| M1 Testanleitungen im Handbuch | Umfang Dokumentation (Zeile 84: `pipwerk-studio-testfaelle.md`, Anwenderdokumentation ohne Test- und Abnahmeanleitungen), Kriterium 12 |
| M2 Fenstergrößen | Umfang 5.1, Kriterium 4 |
| M3 Ansicht springt | Umfang 5.3 (Spezifikation 5.3 „Anordnung“) |
| M4 Sprache | Umfang Fehlerantworten mit Kennung der Ursache (Zeile 79), Kriterium 5 |
| M5 Belegung | Umfang 5.4, Kriterium 7 |
| M6 Trend | Umfang 5.4, Kriterium 7 |
| M7 Eigenschaften | Umfang 5.4, Kriterium 7 |
| M8 Händlersprache | Umfang 3.1 und 5.2, Kriterium 5 |
| M9 ZigZag, 1-2-3-Trend | Umfang 3.2 (Zeile 79), Kriterium 5 |
| M10 Erscheinungsbild | Umfang „Oberfläche neu nach dem bestätigten Prototyp“ (Zeile 81) |
| M11 Datenverbindungen | Umfang 5.3, Kriterium 6 |
| M12 Strategieparameter | Umfang 5.1 und 5.4, Kriterium 7 |
| M13 Bedienerführung | Umfang geführter Aufbau und leere Zustände (Zeile 81), Kriterien 1 und 2 |
| M14 Namen | Umfang „Namen und Kennungen“ (Zeile 79), Kriterium 8 |
| M15 Vorschläge nach Berechnung | Umfang 5.4, Kriterium 8 |
| M16 Bausteine | Umfang 5.4, Kriterien 1, 2 und 8 |
| M17 Zeichenfläche | Umfang 5.3, Kriterium 6 |

Alle Mängel sind durch den Umfang abgedeckt. Zu M3, M10 und M13 siehe Hinweis H4.

### Hinweis T2-H6 aus `specification-9.md`

Die dort genannten Stellen des alten Plans (kein Befund für eine Strategie ohne Auslöser; „`wp02` (Strategie ohne Auslöser)“ in der Tabelle der Abdeckung) gibt es nicht mehr. `wp02` Kriterium 9 (`plan.md` Zeile 111) verlangt für eine neue, leere Strategie nur den Hinweis „Hauptablauf ohne Auslöser“ und nennt ein Element, das kein Auslöser erreicht, als Fehler. Das stimmt mit Spezifikation 3.6 (Zeilen 273, 274, 296) überein. Die Tabelle der Abdeckung (Zeile 171) nennt nur noch „Auslöser, Namen“. Erledigt. Zu einer Folge an der Spezifikation siehe Hinweis H6.

## Blockierende Befunde

Keine.

## Hinweise

Hinweise verhindern das Bestehen nicht.

**H1 – Abschnitt 4.1 fehlt bei den umgesetzten Teilen von `wp02`.**
Fundstelle: `plan.md` Zeile 93 (Umgesetzte Teile `wp02`: „… 3.1 bis 3.7 in der geltenden Fassung, 4.2, …“) gegen Zeile 175 (Tabelle der Abdeckung: „4.1 | `wp01`; Lesen von Format 1.0 `wp02`“).
Sachverhalt: Spezifikation 4.1 (Zeile 324) verlangt, dass eine Datei im Format 1.0 im Objektverzeichnis umgewandelt gelesen wird und unverändert bleibt, bis der Anwender sie speichert. Die Tabelle ordnet das `wp02` zu, die Liste der umgesetzten Teile von `wp02` nennt 4.1 nicht.
Kritikpunkt: Tabelle und Liste widersprechen sich.

**H2 – Abschnitt 8 fehlt bei den umgesetzten Teilen von `wp03`.**
Fundstelle: `plan.md` Zeile 187 („8 Sicherheit | `wp02`; Ansicht der Vorlage `wp03`“) gegen Zeile 141 (Umgesetzte Teile `wp03` ohne Abschnitt 8) und Umfang `wp03` (Zeilen 128 bis 132, keine Sicherheit).
Sachverhalt: Spezifikation 8 (Zeile 461) verlangt, dass die Oberfläche Texte und Namen des Anwenders als Text und nie als HTML setzt; das gilt auch für die Ansicht der Vorlage aus `wp03`.
Kritikpunkt: Die Tabelle ordnet einen Teil von Abschnitt 8 `wp03` zu, das Paket selbst nennt ihn nicht.

**H3 – Browsertest der Vorlagenansicht in den Smartphone-Größen keinem Paket eindeutig zugeordnet.**
Fundstelle: `plan.md` Zeile 83 (`wp02`: „Tests nach Abschnitt 7 ohne die Browsertests ‚Objekt anlegen‘ und ‚Vorlage löschen‘“), Zeile 131 (`wp03`: nur „Tests der Oberfläche und Browsertests ‚Objekt anlegen‘ und ‚Vorlage löschen …‘“); Spezifikation 7, Zeile 453 („in den beiden Smartphone-Größen auch Menü, Dialoge, Vorlagenansicht, …“).
Sachverhalt: Nach dem Wortlaut gehört der Test der Vorlagenansicht in den Smartphone-Größen zu `wp02`, obwohl die Vorlagenansicht erst mit `wp03` entsteht (Zeile 130). `wp03` hat die Ansicht im Umfang und als Kriterium 9, nennt den Browsertest aber nicht.
Frage: In welchem Paket wird dieser Teil des Browsertests umgesetzt? (Testdetails gehören nach „Umfang der Prüfungen“ in die Aufträge; der Hinweis betrifft nur die Zuordnung.)

**H4 – Teile der neu gebauten Oberfläche ohne Abnahmekriterium in `wp02`.**
Fundstelle: `plan.md` Zeilen 101 bis 114.
Sachverhalt: Die Oberfläche wird neu aufgebaut. Für einige Teile, die vorher gerügt wurden oder schon abgenommen waren, gibt es kein Kriterium, das der Auftraggeber gezielt prüft: geführter Aufbau bei „Neue Strategie“ und leere Zustände (Spezifikation 5.5, req-ui-016, M13); Ansicht bleibt beim Ablegen stehen und kein Element liegt sichtbar in einem fremden Rahmen (5.3, M3); Erscheinungsbild nach dem Prototyp (5.1, M10); Dialog „Über pipwerk Studio“ und Stand in der Fußzeile (5.1, req-ui-010); Sprache bleibt nach Neuladen und Neustart erhalten (req-ui-008). Die Kriterien 1 und 2 decken einen Teil davon mittelbar ab.
Frage: Sollen diese Punkte als eigene Kriterien oder als technische Nachweise im Prüfbericht der QA erscheinen?

**H5 – Instanzen von „eigener Indikator“ und „eigenes Regelwerk“ in `wp02` ohne Abnahmekriterium.**
Fundstelle: `plan.md` Zeile 107 (Kriterium 5: Elementbibliothek in den Gruppen nach 5.2, also mit „eigener Indikator“ und „eigenes Regelwerk“), Zeile 109 (Kriterium 7: nur der Trend „vollständig belegen“), Zeile 128 (`wp03`: enthaltene Instanzen, Regeln, eigene Parameter und Eigenschaften „in der Ansicht der Vorlage“).
Sachverhalt: Nach Spezifikation 3.3 (Zeile 129) ist eine Instanz in der Strategie „in vollem Umfang änderbar“. Der Prototyp bearbeitet den Inhalt einer Instanz eines eigenen Indikators oder Trends in der Eigenschaftenansicht (`Properties.tsx` Zeile 326 verwendet `OwnEditor`). Damit gehört das nach `plan.md` Zeile 81 zu `wp02`. Ein Kriterium dafür gibt es nur für den Trend. M6 zeigt, dass ein Eintrag der Elementbibliothek, dessen Instanz sich nicht vollständig belegen lässt, bei der Abnahme als Mangel gilt.
Frage: Soll `wp02` für Instanzen von „eigener Indikator“ und „eigenes Regelwerk“ ein Kriterium wie Kriterium 7 erhalten?

**H6 – Spezifikation 3.6 nennt die alte Nummer des Abnahmekriteriums.**
Fundstelle: `specification.md` Zeile 296 („Das ersetzt das Abnahmekriterium 2 von `wp02` (leere Strategie ohne Befund)“); `plan.md` Zeile 104 (Kriterium 2 ist jetzt der Aufbau von `str-01`) und Zeile 111 (Kriterium 9).
Sachverhalt: Nach der Neufassung des Plans verweist der Satz auf ein Kriterium, das heute etwas anderes verlangt. Der Änderungsnachweis des Plans (Zeile 199) erklärt die Ersetzung.
Kritikpunkt: Der Verweis kann missverstanden werden. Die Spezifikation ist nicht Gegenstand dieses Durchlaufs; der Hinweis ist für die nächste Bearbeitung der Spezifikation.

**H7 – Abschnitt 1 der Spezifikation vollständig in `wp02` genannt.**
Fundstelle: `plan.md` Zeile 93 (Umgesetzte Teile `wp02`: „Abschnitt 1“) gegen Zeile 171 (Tabelle: Löschen einer Vorlage in der Oberfläche `wp03`).
Sachverhalt: Die Zeile „Löschschutz“ der Tabelle der Abweichungen in Spezifikation 1 (Zeile 22) setzt in der Oberfläche erst `wp03` um.
Kritikpunkt: Die Angabe bei `wp02` ist weiter als die Tabelle der Abdeckung.

## Nicht geprüft

- `wp01`, die Spezifikation selbst (außer dem Abgleich der Kennungen der Anforderungen und Hinweis H6), Code: nach dem Prüfauftrag nicht Gegenstand.
- Die Hinweise S19 und S20 aus `specification-2.md` und `specification-3.md`, die `plan.md` Zeile 25 `wp02` zuordnet: nicht darauf geprüft, ob sie nach der Neufassung der Spezifikation noch zutreffen.

## Reste dieser Prüfung

Bei der Prüfung habe ich im Berichtsverzeichnis zwei Hilfsdateien angelegt: `plan-3-tmp-req.txt` und `plan-3-tmp-spec.txt`. Sie enthalten die Listen der Kennungen der Anforderungen für den Abgleich. Löschen konnte ich sie nicht, weil der Befehl zum Löschen in dieser Sitzung nicht freigegeben war. Sie gehören nicht zum Bericht und können entfernt werden.
