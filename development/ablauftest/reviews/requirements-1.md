# Prüfbericht Anforderungsdokumente, Durchlauf 1

- Vorhaben: `ablauftest`
- Phase: 2 Konzeption, Prüfung der Anforderungsdokumente
- Rolle: QA
- Übergabedokument: `development/ablauftest/reviews/requirements-1-order.md`
- geprüfter Commit: `13bc58a1a929f3998d1db6b15b29eaf2b54717ab` (`main`)
- Ergebnis: **nicht bestanden**

## Gegenstand

Geprüft wurden laut `development/ablauftest/scope.md`:

- `docs/design/requirements/anforderungen-strategiedesigner.md`, req-ui-010 „Angaben zu Pipwerk Studio“ (Zeilen 287–298) und der zugehörige offene Punkt 10 in Abschnitt 9 (Zeile 396)
- `docs/design/requirements/anforderungen-gesamtsystem.md`, nur auf Widersprüche zu req-ui-010

Die übrigen Anforderungen beider Dokumente wurden nicht geprüft.

## Zusammenfassung

Der offene Punkt zur Aufrufstelle ist an beiden Stellen gekennzeichnet. Einen direkten Widerspruch zum Anforderungsdokument des Gesamtsystems gibt es nicht. Die Anforderung ist trotzdem nicht ohne Rückfragen umsetzbar. Sie verweist auf eine „bisherige Anzeige“, die in keinem Anforderungsdokument beschrieben ist. Sie lässt offen, ob der Lizenztext der Oberflächensprache folgt. Sie nennt die Adresse des Repositorys nicht. Außerdem verwendet sie den Namen „Pipwerk Studio“, den die Anforderungsdokumente nicht einführen. Die Befunde B1 bis B5 verhindern das Bestehen. B6 und B7 sind kleinere Kritikpunkte. Sie werden ebenfalls nicht zurückgestellt.

## Befunde

### B1 – Verweis auf eine „bisherige Anzeige“, die in keinem Anforderungsdokument steht

- Fundstelle: `anforderungen-strategiedesigner.md`, Zeile 292: „den Stand wie in der bisherigen Anzeige, zusätzlich mit Datum und Uhrzeit des Commits“
- Sachverhalt: Keines der beiden Anforderungsdokumente beschreibt eine Anzeige des Stands. Eine Suche nach „Stand“, „Revision“, „Standanzeige“ und „Commit“ unter `docs/design` ergibt nur diese Zeile und zwei Erwähnungen der Standanzeige in Planungsunterlagen (`docs/design/planning/pflichtenheft-strategiedesigner.md`, Zeile 111, und `praesentation-schritt-1.html`, Zeile 137). Was die Anzeige zeigt, steht nur in der Anwenderdokumentation (`docs/user/pipwerk-studio.md`, Zeilen 29–46) und im Code. Die Anforderung ist also nur mit Kenntnis des heutigen Programms verständlich. Das widerspricht req-system-021 (`anforderungen-gesamtsystem.md`, Zeile 157). Danach muss die Dokumentation aus sich heraus verständlich sein und darf kein Wissen über die Entstehungsgeschichte voraussetzen. Das Wort „bisherige“ ist zudem an den heutigen Zeitpunkt gebunden. Ändert sich die Anzeige, ändert sich auch die Bedeutung von req-ui-010.
- Mehrdeutigkeit: Laut Anwenderdokumentation (Zeile 44) zeigt die vorhandene Anzeige Datum und Uhrzeit des Commits bereits im Tooltip. Deshalb ist unklar, was „zusätzlich“ bedeutet.
- Fragen:
  1. Welche Angaben zum Stand soll der Dialog enthalten? Gemeint sein können zum Beispiel die Kurzform mit 7 Zeichen, die vollständige Kennung mit 40 Zeichen oder beides.
  2. Was zeigt der Dialog, wenn sich der Stand nicht ermitteln lässt? In der vorhandenen Anzeige erscheint dann „unbekannt“.
  3. Bleibt die vorhandene Standanzeige der Oberfläche neben dem Dialog bestehen, oder wird sie durch den Dialog ersetzt?
  4. Muss die vorhandene Standanzeige als eigene Anforderung aufgenommen werden, damit req-ui-010 auf sie verweisen kann?

### B2 – „Datum und Uhrzeit des Commits“ ist mehrdeutig und unvollständig

- Fundstelle: `anforderungen-strategiedesigner.md`, Zeile 292
- Sachverhalt: Die Anforderung legt nicht fest, in welcher Zeitzone Datum und Uhrzeit angezeigt werden. Sie legt auch nicht fest, ob die Darstellung der Oberflächensprache folgt. Es fehlt außerdem, was angezeigt wird, wenn sich nur das Datum nicht ermitteln lässt. req-system-003 und req-system-006 (`anforderungen-gesamtsystem.md`, Zeilen 28–30 und 42–44) verlangen, dass eine Komponente eigenständig bereitgestellt und installiert werden kann. Bei einer Installation ohne Git-Arbeitsbereich ist nach heutiger Anwenderdokumentation (Zeile 42) kein Stand ermittelbar. Die Anforderung sagt nicht, ob ein solcher Fall vorgesehen ist.
- Fragen:
  1. Welche Zeitzone gilt für die Anzeige? Zur Wahl stehen zum Beispiel die Ortszeit des Anwenders oder die Zeitzone des Commits.
  2. Was zeigt der Dialog, wenn Datum und Uhrzeit nicht ermittelbar sind?
  3. Muss der Dialog den Stand auch für eine installierte Komponente ohne Git-Arbeitsbereich angeben?
- Kritikpunkt: „Commit“ ist ein technischer Begriff. Nur der Softwarearchitekt kann entscheiden, ob Autoren- oder Committer-Datum gemeint ist. Diese Frage geht nicht an den Auftraggeber, muss aber in der Spezifikation beantwortet werden.

### B3 – Widerspruch zwischen dem Lizenztext und „Seine Texte folgen der Oberflächensprache“

- Fundstelle: `anforderungen-strategiedesigner.md`, Zeilen 293 und 296, mit Bezug auf req-ui-007 (Zeilen 271–275)
- Sachverhalt: Der vollständige Lizenztext soll im Dialog lesbar sein. Gleichzeitig sollen die Texte des Dialogs der Oberflächensprache folgen. Die GNU General Public License, Version 3, ist nur im englischen Original rechtsverbindlich. Die Lizenzdatei des Repositorys (`LICENSE`) enthält nur den englischen Text. Es ist nicht festgelegt, ob der Lizenztext von der Regel zur Oberflächensprache ausgenommen ist. Ebenso ist nicht festgelegt, ob bei deutscher Oberfläche eine nicht verbindliche Übersetzung erscheinen soll.
- Fragen:
  1. Gilt die Regel „Seine Texte folgen der Oberflächensprache“ auch für den Lizenztext?
  2. Falls bei deutscher Oberfläche eine Übersetzung erscheinen soll: Muss der Dialog darauf hinweisen, dass nur der englische Text gilt?
  3. Muss der Name der Lizenz in beiden Sprachen gleich bleiben? Zeile 293 nennt ihn auf Englisch in Anführungszeichen.

### B4 – Die Adresse des Repositorys ist nicht genannt

- Fundstelle: `anforderungen-strategiedesigner.md`, Zeile 294: „die Adresse des Repositorys“
- Sachverhalt: Keines der beiden Anforderungsdokumente nennt das Repository oder seine Adresse. Eine Adresse steht nur in der Planungsunterlage `docs/design/planning/entwicklungsplan-strategiedesigner.md`, Zeile 20. Nicht festgelegt ist auch, ob die Adresse nur als Text erscheint oder ob sie angeklickt werden kann. Offen ist ebenso, was beim Anklicken geschieht.
- Fragen:
  1. Welches Repository und welche Adresse sind gemeint?
  2. Soll die Adresse anklickbar sein? Wenn ja: Öffnet sie sich in einem neuen Browserfenster oder Tab?

### B5 – Der Name „Pipwerk Studio“ ist in den Anforderungsdokumenten nicht eingeführt

- Fundstelle: `anforderungen-strategiedesigner.md`, Zeilen 287, 289, 291 und 396; `anforderungen-gesamtsystem.md`, req-system-001, Zeilen 13–18
- Sachverhalt: Beide Anforderungsdokumente nennen die Komponente nur „Strategiedesigner“. Das Gesamtsystem heißt in den Dokumenten „Pipwerk“. Der Name „Pipwerk Studio“ erscheint in den Anforderungsdokumenten zum ersten Mal in req-ui-010. Seine Bedeutung wird dort nicht erklärt. Dass „Pipwerk Studio“ der Name des Strategiedesigners ist, steht nur in der Planungsunterlage `entwicklungsplan-strategiedesigner.md`, Zeile 24. Deshalb ist unklar, wofür der Dialog die Angaben macht: nur für den Strategiedesigner oder für das Gesamtsystem Pipwerk. Davon hängt ab, wessen Stand angezeigt wird. Nach req-system-003 werden die Hauptkomponenten unabhängig voneinander bereitgestellt. Sie können also unterschiedliche Stände haben.
- Fragen:
  1. Ist „Pipwerk Studio“ der Name des Strategiedesigners und nur dieser Komponente?
  2. Beziehen sich Stand, Lizenz und Repository im Dialog nur auf den Strategiedesigner?
  3. Soll der Name „Pipwerk Studio“ in den Anforderungsdokumenten eingeführt werden, zum Beispiel in req-system-001 oder in Abschnitt 1 des Dokuments zum Strategiedesigner?

### B6 – Das Verhalten des Dialogs ist teilweise offen

- Fundstelle: `anforderungen-strategiedesigner.md`, Zeilen 289 und 296
- Sachverhalt: Die Anforderung legt nicht fest, ob die übrige Oberfläche bedienbar bleibt, solange der Dialog offen ist. Sie legt auch nicht fest, ob der Dialog durch einen Klick neben den Dialog geschlossen wird. Die Schaltfläche „Schließen“ und die Escape-Taste sind festgelegt. Ob es weitere Wege gibt oder ob diese ausgeschlossen sind, bleibt offen. Beides betrifft den Bedienablauf und damit Inhalte des Auftraggebers (`docs/technical/entwicklungsverfahren.md`, Zeile 32).
- Fragen:
  1. Ist die übrige Oberfläche gesperrt, solange der Dialog offen ist?
  2. Sind die Schaltfläche „Schließen“ und die Escape-Taste die einzigen Wege, den Dialog zu schließen?

### B7 – Angabe zum Entwicklungsablauf im Anforderungsdokument

- Fundstelle: `anforderungen-strategiedesigner.md`, Zeile 446: „Gegenstand des Vorhabens `ablauftest`.“
- Sachverhalt: Welche Anforderungen zu einem Vorhaben gehören, steht bereits in `development/ablauftest/scope.md`, Zeile 7. Nach `docs/technical/entwicklungsverfahren.md`, Zeile 14, steht jede Festlegung an genau einer Stelle. Der Eintrag im Änderungsnachweis wiederholt die Zuordnung zum Vorhaben im Produktdokument.
- Kritikpunkt: Die Zuordnung zum Vorhaben steht doppelt, einmal im Anforderungsdokument und einmal in `scope.md`.

## Geprüft ohne Befund

- Offener Punkt zur Aufrufstelle: Er ist in req-ui-010 (Zeile 298) und in Abschnitt 9, Punkt 10 (Zeile 396), gleichlautend als offen gekennzeichnet. Er stimmt mit `scope.md`, Zeile 14, überein. Weitere offene Fragen zu req-ui-010 sind nicht gekennzeichnet. Sie sind unter B1 bis B6 aufgeführt. Hinweis: Solange die Aufrufstelle offen ist, kann die Spezifikation nicht festlegen, wie der Anwender den Dialog öffnet.
- Lizenzangabe: Die Lizenz in Zeile 293 stimmt mit der Lizenzdatei `LICENSE` des Repositorys überein (GNU General Public License, Version 3).
- Widerspruchsfreiheit zum Gesamtsystem: req-ui-010 widerspricht keiner Anforderung aus `anforderungen-gesamtsystem.md` direkt. Geprüft wurden besonders req-system-001, 003, 006, 008, 009 und 021. Die Berührungspunkte stehen unter B1, B2 und B5.
- Umsetzungsdetails: req-ui-010 schreibt keine Technik vor. Die Begriffe „Commit“ und „Repository“ sind technisch geprägt. Dazu gibt es B2 und B4.
