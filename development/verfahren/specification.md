# Spezifikation Vorhaben verfahren

## Status

- status: `draft`
- stand: 2026-10-24
- name: Entwicklungsverfahren verbessern
- grundlage: Festlegungen 1 bis 7 in [scope.md](scope.md), Nachprüfung [requirements-2.md](reviews/requirements-2.md) bestanden. Hinweise H1 bis H15 aus [requirements-1.md](reviews/requirements-1.md) und H18 bis H21 aus [requirements-2.md](reviews/requirements-2.md) sind hier entschieden (Abschnitt 9).
- offen: Prüfung durch die QA steht aus.

## 1. Gegenstand

Das Vorhaben ändert das Entwicklungsverfahren, nicht pipwerk. Betroffen sind:

- die Verfahrensdokumente `docs/technical/entwicklungsverfahren.md`, `docs/technical/agentenrollen-und-briefings.md` und `docs/technical/glossar.md`
- die Skripte des Entwicklungsrechners `agentrun`, `heartbeat` und der gemeinsame Teil der Startskripte `startrole`
- ein neues Werkzeug, das die Übersicht erzeugt, mit einem Workflow auf GitHub

## 2. Architekturentscheidungen

| Nr. | Entscheidung | Begründung |
|---|---|---|
| E1 | Die Quellen von `agentrun`, `heartbeat` und `startrole` kommen mit ihren Tests ins Repository unter `tools/devhost/`. Installiert werden sie wie bisher nach `scripts/` beziehungsweise `devteam/lib/`. Das Entwicklungsverzeichnis ermitteln die Skripte aus ihrem eigenen Ablageort (`scripts/` und `devteam/lib/` liegen direkt beziehungsweise zwei Ebenen unter dem Entwicklungsverzeichnis), nicht aus einem festen Pfad. | Nur so können Entwickler sie in ihrem Zweig ändern und Tester sie prüfen. Pfade des Entwicklungsrechners gehören nicht ins Repository. |
| E2 | Die Installation nach `scripts/` und `devteam/` ist kein Teil der Arbeit des Teams. Nach der Bestätigung des Ergebnisses durch den Auftraggeber (Abschnitt 10) veranlasst sie der Projektleiter mit einer Anweisung in `transfer/` an eine Sitzung auf dem Entwicklungsrechner, wie bisher für `devteam/`. Freigaben in `devteam/settings.json` und Hooks ändert das Vorhaben nicht. | Das Team verändert `scripts/` und `devteam/` nicht (Entwicklungsverfahren, „Entwicklungsverzeichnis“). Schutzmechanismen ändert nur der Mensch. |
| E3 | Testumgebung für die Skripte: eine vollständige Kopie der Verzeichnisstruktur des Entwicklungsverzeichnisses unter dem Verzeichnis der Testumgebungen (`test/`), mit einem lokalen Git-Repository als `origin` und einem Ersatzprogramm für `claude`, das Sitzungen, Abbrüche und Pausen wegen der Nutzungsgrenze nachstellt. Programmaufruf und Prüfabstände sind Parameter. | So lassen sich Abbruch, Fortsetzung und Pause prüfen, ohne den laufenden Betrieb und das Nutzungskontingent zu berühren. |
| E4 | Die Übersicht erzeugt ein Python-Skript ohne fremde Pakete unter `tools/overview/`. Ein Workflow auf einem von GitHub betriebenen Runner führt es bei jedem Push auf `main` aus, der `development/` ändert, und schreibt das Ergebnis mit einem eigenen Commit auf `main`. | Festlegung 6: aus dem Repository erzeugt, bei jeder Änderung neu, kein eigener Dienst. Der selbst betriebene Runner behält seine einzige Aufgabe (H5). Ein Commit mit dem Schlüssel des Workflows startet keinen weiteren Workflow. |
| E5 | Quelle der Übersicht ist allein `main`: `scope.md`, `plan.md` und `waiting.md` jedes Vorhabens und die Geschichte der Meldungen unter `development/messages/`. Zustände aus `run/` werden nicht verwendet. | Festlegung 6: aus dem Stand im Repository. Jede Sitzung endet mit einer Meldung, die jüngste Meldung eines `ref` beschreibt deshalb den Stand (Abschnitt 7.2). Der Arbeitszweig eines Pakets wird nicht gebraucht (H11, H12). |

## 3. Abbruch einer Sitzung (Festlegung 1)

### 3.1 Begriffe

- **Abbruch**: Die Sitzung besteht nicht mehr, ohne dass die Antwortmeldung vorliegt (Absturz), oder es fehlt 15 Minuten lang der Herzschlag (Stillstand), oder der Start schlägt fehl.
- **Pause wegen der Nutzungsgrenze**: Claude Code meldet, dass das Nutzungskontingent erschöpft ist. Eine Pause ist kein Abbruch.
- **Abbrüche derselben Aufgabe in Folge**: Abbrüche derselben Meldung. Der Zähler gehört zur Meldung und endet mit ihr. Eine neue Meldung beginnt bei null.

### 3.2 Fortsetzung durch `agentrun`

1. `agentrun` startet jede Sitzung mit einer eigenen Kennung (`--session-id`) und vermerkt Kennung und Zähler der Abbrüche in der Zustandsdatei der Sitzung in `run/`.
2. Bei einem Abbruch beendet es die tmux-Sitzung, falls sie noch besteht, erhöht den Zähler und setzt die Sitzung mit `--resume <kennung>` im selben Arbeitsverzeichnis fort. Der Startauftrag der Fortsetzung lautet sinngemäß: Die Sitzung wurde abgebrochen; prüfe den Stand deines Arbeitsverzeichnisses und setze die Aufgabe dort fort, wo sie abgebrochen ist. Lässt sich die Sitzung nicht fortsetzen, startet es sie mit dem ursprünglichen Startauftrag neu; das zählt als derselbe Abbruch.
3. Nach dem dritten Abbruch derselben Meldung setzt es nicht fort und schreibt `failed` an den Projektleiter wie bisher. Die Meldung nennt im Text die Zahl der Abbrüche und die Art des letzten Abbruchs.
4. Eine Meldung mit ungültigem `ref` führt sofort zu `failed`, ohne Fortsetzung.
5. Sitzungen von Tester und QA (`startrole`): Endet das Programm ohne Bericht, setzt das Skript die Sitzung ebenso mit `--resume` fort, höchstens zweimal. Nach dem dritten Abbruch endet es mit Fehler und nennt die Zahl der Abbrüche und die Art des letzten; die steuernde Rolle behandelt das wie bisher.

### 3.3 Pause wegen der Nutzungsgrenze

1. Fehlt der Herzschlag einer Sitzung länger als 15 Minuten, liest `agentrun` vor der Entscheidung über einen Stillstand den sichtbaren Inhalt der tmux-Sitzung. Enthält er die Meldung von Claude Code über die erreichte Nutzungsgrenze, gilt die Sitzung als pausiert. Der Suchtext steht als Variable am Anfang von `agentrun`.
2. Das Nutzungskontingent ist für alle Sitzungen gemeinsam. Solange eine Sitzung pausiert ist, wertet `agentrun` bei keiner Sitzung fehlenden Herzschlag als Stillstand. Es vermerkt die Pause in `run/`.
3. Nennt die Meldung einen Zeitpunkt, prüft `agentrun` ab diesem Zeitpunkt, sonst alle 15 Minuten, ob die Grenze aufgehoben ist, und schickt der pausierten Sitzung dann mit `tmux send-keys` die Aufforderung, fortzufahren. Mit der Fortsetzung beginnt die Messung des Herzschlags für alle Sitzungen neu.
4. Startskripte von Tester und QA (`startrole`): Endet das Programm wegen der Nutzungsgrenze, wartet das Skript wie in Punkt 3 und setzt die Sitzung mit `--resume` fort. Während des Wartens ruft es alle 5 Minuten `heartbeat` mit dem Arbeitsverzeichnis der Rolle auf, damit die steuernde Sitzung nicht als Stillstand gilt. Das Ergebnis des Skripts ändert sich dadurch nicht.
5. Die Erkennung an der Ausgabe von Claude Code ist ungeprüft. Die Umsetzung weist sie zuerst an einer echten Ausgabe nach (Protokoll in `run/` oder Probe); gelingt das nicht, gibt der Entwicklungsleiter das mit `amend` zurück.

### 3.4 Folgen für die Dokumente

„Jede Meldung startet es genau einmal“ wird zu „startet genau einmal und setzt nach einem Abbruch höchstens zweimal fort“. Der Abschnitt „Herzschlag“ verliert den Satz, dass auch eine Pause wegen der Nutzungsgrenze als Stillstand gilt (H1).

## 4. Meldungen und Eingang des Projektleiters (Festlegungen 2, 3 und 7)

### 4.1 Wiedervorlage

Der Chat des Projektleiters arbeitet in claude.ai in einem Projekt. Dort gibt es keine wiederkehrende Aufgabe, sondern eine einmalige Wiedervorlage zu einem festen Zeitpunkt, die den Chat weckt. Wiedervorlagen lassen sich auflisten und löschen, auch die eines anderen Chats desselben Kontos ([questions/verfahren-01.md](questions/verfahren-01.md), Frage 3).

1. Sobald der Chat für sein Vorhaben eine Meldung an Softwarearchitekt oder Entwicklungsleiter überträgt, setzt er eine Wiedervorlage 20 Minuten später, falls nicht schon eine besteht. Ihr Text nennt die Kennung des Vorhabens.
2. Bei jeder Wiedervorlage: `origin/main` lesen, in `development/messages/projectlead/` die Meldungen mit `ref` des eigenen Vorhabens oder seiner Pakete auswählen, die älteste zuerst bearbeiten. Meldungen anderer Vorhaben bleiben unberührt.
3. Zu Beginn jeder Bearbeitung setzt der Chat die nächste Wiedervorlage 20 Minuten später und die zweite nach Punkt 6. Liegt am Ende der Bearbeitung für sein Vorhaben keine Meldung mehr in `development/messages/architect/` oder `development/messages/devlead/`, steht also keine Antwortmeldung aus, löscht er beide. Eine Frist, nach der die Wiedervorlage ausläuft, gibt es nicht.
4. Übernahme durch einen neuen Chat: Der neue Chat listet die Wiedervorlagen auf und löscht die mit der Kennung seines Vorhabens. Er schreibt die Datei `development/<vorhaben>/followup.md` mit dem Zeitpunkt der Übernahme in UTC und einer zufälligen Kennung des Chats, überträgt sie auf `main` und setzt seine Wiedervorlage nach Punkt 1. Findet ein Chat bei einer Aktivierung (Wiedervorlage oder Nachricht des Auftraggebers) dort eine andere Kennung als seine eigene, setzt er keine weitere und bearbeitet nichts mehr. Die Datei sichert die Übernahme auch dann, wenn das Löschen nicht gelingt. Sie enthält keine Namen von Rechnern oder Benutzern.
5. Setzen, Wecken und Löschen sind erprobt, die Übernahme durch einen neuen Chat nicht. Vor der Präsentation des Ergebnisses (Abschnitt 10) erprobt der Projektleiter sie einmal und vermerkt das Ergebnis in der Präsentation. Gelingt sie nicht, ist das ein Mangel der Umsetzung.
6. Verspätete Wiedervorlage: Am 24. Oktober 2026 wurde eine Wiedervorlage als zugestellt geführt, im Chat aber erst 50 Minuten später mit der nächsten Nachricht des Auftraggebers verarbeitet; die Ursache ist unbekannt (`scope.md`, Stand). Damit eine solche Wiedervorlage den Ablauf nicht anhält:
   - Der Chat prüft den Eingang bei jeder Aktivierung zuerst, durch eine Wiedervorlage ebenso wie durch eine Nachricht des Auftraggebers.
   - Er hält neben der Wiedervorlage nach 20 Minuten eine zweite 40 Minuten später als Rückfall. Bei jeder Aktivierung löscht er beide und setzt sie neu (Punkt 3). Bleibt die erste aus, weckt ihn die zweite.
   - Eine Meldung an den Projektleiter zeigt die Übersicht mit „bei wem: Projektleiter“ und „seit“, bis er sie bearbeitet hat (7.2). Eine Verzögerung ist dort für den Auftraggeber sichtbar, ohne Benachrichtigung.
   - Ob die zweite Wiedervorlage in dem beobachteten Fall geholfen hätte, ist ungeprüft. Der Projektleiter vermerkt in der Präsentation des Ergebnisses jede Wiedervorlage, die nach der Umsetzung nicht pünktlich verarbeitet wurde, mit beiden Zeitpunkten. Bleibt dabei eine Meldung ohne Nachricht des Auftraggebers länger als 40 Minuten unbearbeitet, ist das ein Mangel der Umsetzung.

### 4.2 Bearbeitung durch den Projektleiter

1. Der Projektleiter wendet sich nur an den Auftraggeber bei `present`, bei `question` mit Fragen an den Auftraggeber, bei `acceptance` und bei `review`, wenn der Prüfbericht Befunde der Gruppe „Entscheidung des Auftraggebers“ enthält. Alles andere erledigt er selbst.
2. `failed` (nach dem dritten Abbruch): Der Projektleiter liest das Protokoll in der Meldung und den Stand des Vorhabens auf `main`. Ist die Ursache eine Meldung oder ein Dokument, berichtigt er es und stößt die Aufgabe mit einer neuen Meldung erneut an. Ist die Ursache eine Einrichtung des Entwicklungsrechners, schreibt er eine Anweisung in `transfer/`. Den Auftraggeber braucht er nur, wenn eine Handlung nötig ist, die nur dieser ausführen kann (zum Beispiel eine Anmeldung oder eine Freigabe); dann sagt er ihm genau diese Handlung (H16, H21).

### 4.3 Eingang (Festlegung 3)

1. Bearbeitet ist eine Meldung, wenn der Projektleiter ihre Folgehandlung erledigt hat: Antwortmeldung, Eintrag in einem Dokument, Anweisung in `transfer/` oder Vorlage beim Auftraggeber. Er entfernt sie im selben Commit.
2. Legt er dem Auftraggeber etwas vor (`present`, `question` mit Fragen an den Auftraggeber, `acceptance`, `review` mit Befunden der Gruppe „Entscheidung des Auftraggebers“, Präsentation des Ergebnisses nach Abschnitt 10), trägt er im selben Commit in `development/<vorhaben>/waiting.md` eine Zeile ein: `ref`, Handlung („Präsentation bestätigen“, „Frage beantworten“ oder „Abnahme durchführen“) und Zeitpunkt der Vorlage in UTC. Hat der Auftraggeber geantwortet, entfernt er die Zeile im selben Commit wie seine Folgemeldung. Die Datei ist die einzige Quelle der Übersicht dafür, was auf den Auftraggeber wartet (7.2). Sie enthält keine Namen von Rechnern oder Benutzern.
3. Überholt ist eine Meldung, wenn nach ihr eine Meldung mit demselben `ref` an den Projektleiter vorliegt, die denselben Anlass erledigt, zum Beispiel ein neuer Prüfbericht zu demselben Dokument. Der Projektleiter des Vorhabens entfernt sie zusammen mit der späteren. Meldungen anderer Vorhaben entfernt er nie (H9).

### 4.4 Trennung der Vorhaben (Festlegung 7)

1. Ein Chat des Projektleiters bearbeitet nur sein eigenes Vorhaben. Er startet, wiederholt oder repariert nichts für ein anderes Vorhaben, auch nicht bei scheinbar stehengebliebener Arbeit: keine Meldung mit fremdem `ref` schreiben, entfernen oder ändern, keine Dokumente eines fremden Vorhabens ändern, keine Anweisung in `transfer/` für ein fremdes Vorhaben.
2. Eine Kollision ist eine Behinderung der Arbeit eines Vorhabens durch ein anderes: zum Beispiel gleichzeitige Änderungen an denselben Dateien, belegte Ports einer Testumgebung, eine Sitzung, die auf dieselbe Ressource wartet.
3. Kollisionen erkennen Softwarearchitekt und Entwicklungsleiter in ihrer Sitzung und lösen sie in ihrer Zuständigkeit (warten, auf neuen Stand setzen, abweichende Ports). Können sie das nicht, nennen sie die Kollision mit dem beteiligten Vorhaben in einer Frage (`question`). Eine eigene Meldungsart gibt es nicht (H14). Der Projektleiter behält Kollisionen so im Blick, ohne selbst in das andere Vorhaben einzugreifen (Punkt 1).
4. Der Projektleiter prüft eine solche Frage gegen die drei Bedingungen der Festlegung 7: Die Kollision blockiert die Arbeit vollständig, sie betrifft das Verhalten von pipwerk für den Anwender, und Entwicklungsleiter oder Softwarearchitekt können sie nicht selbst lösen. Nur wenn alle drei zugleich erfüllt sind, legt er sie dem Auftraggeber vor. Sonst antwortet er selbst mit `answer`, zum Beispiel mit der Anweisung, zu warten, und sieht bei jeder Wiedervorlage nach.

## 5. Namen (Festlegung 4)

1. Der Name eines Vorhabens steht in `scope.md` in der Zeile `Name: …` unter der Überschrift. Der Name eines Pakets steht im Plan in der Überschrift des Pakets: `## wp01 – <Name>`.
2. Den Namen eines neuen Vorhabens legt der Projektleiter beim Anlegen mit dem Auftraggeber fest. Der Softwarearchitekt benennt jedes Paket im Plan; der Auftraggeber bestätigt die Namen mit der Präsentation des Plans. Kennungen bleiben unverändert.
3. Die Phasen heißen fest: 1 Anforderung, 2 Konzeption, 3 Planung, 4 Umsetzung, 5 Abnahme, 6 Integration.
4. Ein Paket, das durch `amend` entsteht, benennt der Softwarearchitekt in der Planänderung. Der Auftraggeber bestätigt den Namen mit der Präsentation dazu.
5. Bestehende Vorhaben und Pakete ohne Namen erhalten ihn bei der nächsten Arbeit daran: Vorhaben durch den Projektleiter mit dem Auftraggeber, Pakete durch den Softwarearchitekten bei der nächsten Planänderung. Bis dahin zeigt die Übersicht die Kennung (H10).
6. Präsentationen, Anleitungen zur Abnahme und alle Nachrichten an den Auftraggeber nennen Namen von Vorhaben, Paketen und Phasen. Kennungen stehen dort höchstens in Klammern dahinter.

## 6. Prototypen (Festlegung 5)

1. Begriffe: „Machbarkeitstest“ ersetzt „Probeumsetzung“ und Prototypen zur Klärung der Umsetzbarkeit. „Oberflächenentwurf“ ersetzt „klickbarer Prototyp“, in allen Verfahrensdokumenten und im Glossar (H4).
2. Eine **Ansicht** ist eine Seite oder ein eigenständiger Dialog einer Oberfläche mit eigenem Bedienablauf. Reiter, Zustände und Teilbereiche einer Seite gehören zu ihrer Ansicht (H18).
3. **Umgesetzt** ist eine Ansicht, sobald sie sich in einer Testumgebung öffnen und bedienen lässt (Festlegung 5) oder in `main` übernommen ist. Ab dann gilt jeder Wunsch dazu als Änderung am bestehenden System (H19).
4. Den Machbarkeitstest beauftragt der Softwarearchitekt allein, in Phase 2 und bei `amend`.
5. Ausnahme Oberflächenentwurf für eine umgesetzte Ansicht: Projektleiter, Softwarearchitekt oder Entwicklungsleiter schlagen ihn vor, der Entwicklungsleiter über `amend` an den Softwarearchitekten. Der Vorschlag geht als Frage über den Projektleiter an den Auftraggeber (H15).
6. Phase 3, Abnahmekriterium zur Bedienbarkeit: Maßstab ist der bestätigte Oberflächenentwurf, bei einer umgesetzten Ansicht die Spezifikation.

## 7. Übersicht (Festlegung 6)

### 7.1 Ablage und Erzeugung

- Datei `development/overview.html` auf `main`, eine einzige HTML-Datei ohne externe Dateien.
- Skript `tools/overview/generate.py`, Python 3 ohne fremde Pakete, mit Unit-Tests. Aufruf mit dem Wurzelverzeichnis eines Repositorys mit vollständiger Geschichte und dem Pfad der Ausgabedatei. Es liest nur und schreibt nur die Ausgabedatei.
- Workflow `.github/workflows/overview.yml`: Auslöser Push auf `main` mit Änderungen unter `development/` außer `development/overview.html`, zusätzlich von Hand. Runner von GitHub, nicht der selbst betriebene. Rechte `contents: write`, keine anderen. Keine Auslöser für Pull Requests. Ein neuer Lauf bricht einen laufenden ab. Ändert sich die Datei, schreibt der Workflow sie mit einem Commit auf `main`; wird der Push abgelehnt, holt er den neuen Stand, erzeugt neu und versucht es bis zu dreimal. Der Checkout holt die vollständige Geschichte. Ob `main` den Push des Workflows zulässt, ist ungeprüft; die Umsetzung weist es zuerst nach, sonst `amend`.
- Der feste Link folgt dem offenen Punkt zu den Präsentationen in `scope.md`. Der Pfad der Datei ändert sich nicht.

### 7.2 Stand eines Vorhabens und eines Pakets

Für jedes `ref` gilt die jüngste Meldung in der Geschichte von `development/messages/` (nach dem Zeitpunkt im Dateinamen), ob noch vorhanden oder schon entfernt. Ihr Zeitpunkt ist „seit“.

| jüngste Meldung | Phase | bei wem |
|---|---|---|
| `check`, `review` | Anforderung | `check`: Softwarearchitekt; `review`: Projektleiter* |
| `specify`; `revise`, `present` zur Spezifikation | Konzeption | `specify`, `revise`: Softwarearchitekt; `present`: Projektleiter* |
| `plan`; `revise`, `present` zum Plan | Planung | `plan`, `revise`: Softwarearchitekt; `present`: Projektleiter* |
| `implement`, `fix`, `amended`, `answer` an den Entwicklungsleiter | Umsetzung | Team |
| `amend`, `answer` an den Softwarearchitekten | wie die Bezugsmeldung | Softwarearchitekt |
| `question` | wie die Bezugsmeldung | Projektleiter* |
| `acceptance` | Abnahme | Projektleiter* |
| `integrate` | Integration | Team |
| `integrated` | fertig | – |
| `failed` | wie die Bezugsmeldung | Projektleiter |

- \* Steht für das `ref` eine Zeile in `development/<vorhaben>/waiting.md` (4.3 Punkt 2), ist „bei wem“ „Auftraggeber“, die Handlung die der Zeile und „seit“ ihr Zeitpunkt, gleich welche Meldung die jüngste ist. Sonst gilt die Tabelle.
- Bezugsmeldung ist die jüngste ältere Meldung desselben `ref`, deren Aufgabe in der Tabelle eine Phase hat. Gibt es keine, gilt die Phase des Vorhabens.
- Ob `revise` und `present` zur Spezifikation oder zum Plan gehören, ergibt das Feld `document`.
- Die Phase des Vorhabens ist die seiner jüngsten Meldung mit `ref` des Vorhabens, nach der ersten Meldung `implement` „Umsetzung“, bis alle Pakete fertig sind.
- Ein Vorhaben ohne `plan.md` hat keine Pakete. Seine Meldungen der Phasen 4 bis 6 tragen das `ref` des Vorhabens (Abschnitt 10). Phase und „bei wem“ folgen allein diesen Meldungen nach der Tabelle; eine Phase ist grün, sobald seine jüngste Meldung zu einer späteren Phase gehört, das Vorhaben ist grün nach `integrated`.
- Pakete stehen in der Reihenfolge des Plans. Ein Paket ohne Meldung hat die Phase „wartet“, mit den Paketen, von denen es laut Plan abhängt. Ein Paket mit `done` im Plan ist „fertig“.
- „Wartet auf den Auftraggeber“ sind genau die Einträge mit „bei wem: Auftraggeber“, also die Zeilen von `waiting.md`. Der Text sagt die Handlung der Zeile.
- Ein Vorhaben ohne `scope.md` oder ein `ref` ohne Vorhaben erscheint nicht.
- „Projektleiter“ ist ein Wert für „bei wem“ wie die übrigen, ohne Hervorhebung ([questions/verfahren-01.md](questions/verfahren-01.md), Frage 2).
- Farben des Stands (Festlegung 6): Ein Vorhaben ist grau ohne Meldung, grün, wenn alle Pakete fertig sind, sonst gelb. Eine Phase ist grün, wenn das Vorhaben beziehungsweise alle Pakete sie hinter sich haben, gelb, wenn das Vorhaben oder mindestens ein Paket in ihr ist, sonst grau. Ein Paket ist in einer der Phasen 4 bis 6 grau, solange es sie nicht erreicht hat, gelb, solange es in ihr ist, und grün danach.

### 7.3 Inhaltliche Grenzen

Die Seite enthält Namen, Kennungen, Phasen, Rollen und Zeitpunkte, keine Namen von Rechnern oder Benutzern, keine Pfade, keine Ports und keine Links auf Ziele außerhalb der Seite; Verweise auf Anker der Seite selbst (7.4) sind erlaubt. Der Inhalt von Meldungstexten erscheint nicht. Ein Test prüft die erzeugte Seite gegen eine Liste verbotener Muster (absolute Pfade, Portangaben, Adressen außerhalb der Seite).

### 7.4 Gestaltung

Vorlage ist der vom Auftraggeber in Aufbau und Bedienung bestätigte Oberflächenentwurf [prototype/uebersicht-prototyp.html](prototype/uebersicht-prototyp.html) (Commit `f2e178dfcc3e8d1b69ae8fcc649001a1f0216be7`, [questions/verfahren-02.md](questions/verfahren-02.md)). Aufbau und Bedienung übernimmt die echte Seite unverändert. Die optische Gestaltung darf ansprechender werden, innerhalb der Punkte unten.

1. Ebenen: erste Ebene je Vorhaben ein Kästchen, zweite die sechs Phasen des Vorhabens, dritte die Pakete der Phase. Eine weitere Ebene gibt es nicht: Festlegung 6 lässt sie „bei Bedarf“ zu, unter einem Paket gibt es auf `main` aber nichts weiter Aufzuteilendes, Aufträge liegen auf dem Arbeitszweig (E5). Die Ebene steht im Anker der Adresse (`#`, `#<vorhaben>`, `#<vorhaben>/<nr>`). Oben eine Pfadleiste zurück, die Zurück-Taste des Browsers führt eine Ebene zurück. Kästchen, die weiterführen, sind Verweise und mit der Tastatur erreichbar.
2. Stand: grau nicht begonnen, gelb begonnen, grün erledigt, nach 7.2. In jedem Kästchen zusätzlich als Wort mit Zeichen („Nicht begonnen“, „Begonnen“, „Erledigt“). Eine Legende erklärt Farben und Hervorhebung.
3. Hervorhebung: Was auf den Auftraggeber wartet, hat auf allen drei Ebenen einen kräftigen blauen Rahmen und die Marke „Wartet auf Sie: <Handlung>“ (7.2), am Vorhaben, an der Phase, in der der Eintrag liegt, und am Paket oder Schritt. Ein Paket behält die Marke in jeder Phasenansicht. Blau unterscheidet sich von den drei Farben des Stands.
4. Kästchen der ersten Ebene: Name, Kennung klein, Stand, Phase, bei wem, seit wann. Bei Vorhaben mit Paketen sind „bei wem“ die Stellen aller Pakete in Arbeit (weder fertig noch wartend) ohne Doppelte, „seit“ die jüngste Meldung dieser Pakete. Vorhaben in der Reihenfolge ihrer ersten Meldung, nicht begonnene danach, abgeschlossene zuletzt.
5. Kästchen der zweiten Ebene: „Phase <n>“ und Name. In den Phasen 4 bis 6 eines Vorhabens mit Plan „<n> von <m> Paketen in dieser Phase“, in der gelben Phase außerdem bei wem. Bei einem Vorhaben ohne Plan steht in der gelben Phase bei wem und seit wann, wie in den Phasen 1 bis 3.
6. Dritte Ebene, Phasen 4 bis 6: alle Pakete des Plans in seiner Reihenfolge, je Kästchen Name, Kennung, Stand; in dieser Phase bei wem und seit wann, bei `amend` der Zusatz „Lücke in der Spezifikation“, bei `question` „Frage wird bearbeitet“, bei `failed` „Aufgabe abgebrochen“, bei einer Zeile in `waiting.md` deren Handlung; fertig „in `main` seit <Tag der Meldung `integrated`>“; wartend „wartet auf <Name> (<Kennung>)“; sonst ein Satz, in welcher Phase das Paket steht.
7. Dritte Ebene, Phasen 1 bis 3 und bei einem Vorhaben ohne Plan auch Phasen 4 bis 6: ein Kästchen mit dem Schritt. In der gelben Phase ergibt er sich aus der jüngsten Meldung: `check` „Anforderungen werden geprüft“, `review` „Prüfbericht wird bearbeitet“, `specify` „Spezifikation wird erstellt“, `plan` „Plan wird erstellt“, `revise` „Einwände werden eingearbeitet“, `present` „Präsentation wird vorbereitet“, `question` „Frage wird bearbeitet“, `answer` „Antwort wird eingearbeitet“, `implement`, `fix`, `amended` „Umsetzung läuft“, `amend` „Lücke in der Spezifikation“, `acceptance` „Ergebnis wird vorgelegt“, `integrate` „Übernahme in `main`“, `failed` „Aufgabe abgebrochen“; steht eine Zeile in `waiting.md`, statt dessen deren Handlung; dazu bei wem und seit wann. In einer grünen Phase „<Phase> abgeschlossen“, in einer grauen „Noch nicht erreicht“.
8. Kopf: Überschrift „Stand der Vorhaben“ und der Zeitpunkt der Erzeugung. Alle Zeitpunkte stehen in UTC in der Seite und werden im Browser in Ortszeit ausgeschrieben („24.10.2026, 09:40 Uhr“); ohne JavaScript steht UTC da. Die Zeile „Beispiel“ des Entwurfs entfällt.
9. Anpassung an die Fenstergröße nach req-system-024 in den Größen des Entwurfs (390 × 844, 844 × 390, 820 × 1180, 1180 × 820, 1366 × 768, 1920 × 1080): keine waagerechte Bildlaufleiste, nichts liegt übereinander, die sechs Phasen auf schmalen Fenstern in Reihen oder untereinander.
10. Optik: hell, Systemschrift, keine Schriften, Bilder oder Skripte aus dem Netz. Kontrast von Schrift zu Grund mindestens 4,5 : 1. Der Tastaturfokus ist deutlich sichtbar.

## 8. Änderungen an den Verfahrensdokumenten

| Stelle | Änderung |
|---|---|
| Entwicklungsverfahren, Kurzfassung und Phase 2 | Oberflächenentwurf je Ansicht nach Abschnitt 6, Machbarkeitstest |
| Entwicklungsverfahren, Phase 3 | Paketnamen, Bedienbarkeit nach 6.6 |
| Entwicklungsverfahren, Begriffe | Ansicht, Oberflächenentwurf, Machbarkeitstest, Abbruch, Wiedervorlage, Name |
| Entwicklungsverfahren, Ablage | `followup.md`, `waiting.md`, `overview.html`, Namen in `scope.md` und Plan |
| Entwicklungsverfahren, Meldungen | 4.3, `failed` erst nach dem dritten Abbruch |
| Entwicklungsverfahren, Entwicklungsverzeichnis, agentrun, Herzschlag, Start von Tester und QA | Abschnitte 3 und E1 bis E3 |
| Entwicklungsverfahren, Runner | unverändert; neuer Abschnitt „Übersicht“ nach 7.1 |
| Briefing Projektleiter | Wiedervorlage, Bearbeitung nach 4.2, Eingang nach 4.3, Trennung der Vorhaben nach 4.4, Namen nach 5.2 und 5.6; die Regeln „je Aufgabe ein eigener Chat“ und „bei `failed` Auftraggeber informieren“ werden daran angeglichen (H2, H6) |
| Briefing Softwarearchitekt | Oberflächenentwurf und Machbarkeitstest, Paketnamen, Kollisionen |
| Briefing Entwicklungsleiter | Vorschlag eines Oberflächenentwurfs über `amend`, Kollisionen |
| Glossar | Begriffe aus Abschnitt 6 |

## 9. Entschiedene Hinweise aus der Prüfung der Festlegungen

| Hinweis | erledigt in |
|---|---|
| H1, H5, H7 | 3, E4 |
| H2, H16, H21 | 4.2, 8 |
| H3, H10 | 5 |
| H4, H15, H18, H19 | 6 |
| H6, H9 | 4.3 |
| H8 | 4.1 |
| H11, H12 | E5, 7.2 |
| H13 | 7.1 |
| H14, H17 | 4.4 |
| H20 | Festlegung 7, vom Projektleiter berichtigt |

## 10. Umsetzung, Prüfung und Abnahme

Ablauf nach „Ablauf dieses Vorhabens“ in `scope.md`: Nach bestandener Prüfung dieser Spezifikation folgt die Umsetzung direkt, ohne Präsentation, ohne Arbeitspaketplan und ohne Arbeitspakete. Die QA prüft das Ergebnis. Der Auftraggeber bestätigt einmal am Ende anhand einer Präsentation des Ergebnisses.

Technisch läuft die Umsetzung wie ein einziger Durchgang der Phasen 4 bis 6 ohne Plan:

- Meldungen tragen das `ref` `verfahren`: `implement` mit `document` `specification.md` an den Entwicklungsleiter, nach bestandener Prüfung durch die QA `acceptance` an den Projektleiter, danach `fix` oder `integrate` und `integrated`.
- Arbeitszweig `verfahren/umsetzung`, Aufträge und Berichte darauf unter `development/verfahren/umsetzung/`, Testumgebung unter `test/verfahren-umsetzung/`.
- Die Präsentation des Ergebnisses erstellt der Projektleiter nach `acceptance` und trägt sie nach 4.3 Punkt 2 in `waiting.md` ein, Handlung „Präsentation bestätigen“.

- Skripte: Unit-Tests mit dem Ersatzprogramm (E3) für Absturz, Stillstand, dritten Abbruch, Pause und Fortsetzung nach der Pause, Fortsetzung von `startrole` nach einer Pause und nach einem Absturz.
- Übersicht: Unit-Tests von `generate.py` mit einem Test-Repository für jede Zeile der Tabelle in 7.2, für Meldungen vor und nach der Vorlage beim Auftraggeber, für Pakete ohne Meldung, für ein Vorhaben ohne Plan und für die Grenzen nach 7.3; Browsertest der erzeugten Seite in den Fenstergrößen des Oberflächenentwurfs.
- Dokumente: Die QA prüft die geänderten Verfahrensdokumente gegen die Festlegungen.

## Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-24 | Entwurf ohne Abschnitt 7.4. |
| 2026-10-24 | Antworten aus [questions/verfahren-01.md](questions/verfahren-01.md) eingearbeitet: 4.1 Wiedervorlage als einmalige, immer neu gesetzte Wiedervorlage in claude.ai (Frage 3), 7.2 „Projektleiter“ ohne Hervorhebung (Frage 2) und Farben des Stands nach der neuen Festlegung 6 (Frage 1). H20 erledigt. |
| 2026-10-24 | 7.4 nach dem bestätigten Oberflächenentwurf ([questions/verfahren-02.md](questions/verfahren-02.md)). 4.1 Punkt 6 nach dem Befund zur verspäteten Wiedervorlage in `scope.md`. |
| 2026-10-24 | Befunde aus [reviews/specification-1.md](reviews/specification-1.md): B1 4.4 Punkt 1 und drei Bedingungen; B2 5.2 und 5.3; B3 6.3 nach Festlegung 5; B4 7.2 Meldungen an den Projektleiter erst nach Vorlage beim Auftraggeber, 4.3 Punkt 1. Hinweise: H2 7.4.1, H3 Einschränkung der Namen entfernt, H4 7.3, H5 3.2 Punkt 5, H6 4.1 Punkte 3 und 6, H7 4.1 Punkt 4, H8 Bezugsmeldung in 7.2, H9 7.1. H1 bleibt als Restrisiko, in 4.1 Punkt 6 benannt. |
| 2026-10-24 | Festlegung „Ablauf dieses Vorhabens“ in `scope.md` übernommen: Abschnitt 10, Bezüge auf ein umsetzendes Paket und den Abnahmebericht in E2, E3, 3.3, 4.1 und 7.1 auf Umsetzung und Präsentation des Ergebnisses umgestellt; 7.2 Vorhaben ohne Plan. |
| 2026-10-24 | Befunde aus [reviews/specification-2.md](reviews/specification-2.md): N1 `waiting.md` als einzige Quelle für „wartet auf den Auftraggeber“ (4.3 Punkt 2, 7.2, E5, 8); N2 Ablauf ohne Plan in Abschnitt 10 (Meldungen, Zweig, Testumgebung, Präsentation des Ergebnisses), Darstellung in 7.2, 7.4 Punkte 5 und 7. Hinweise: H10 6.3, H11 4.1 Punkte 3 und 6, H12 „seit“ aus `waiting.md`, H13 Abschnitt 10, H14 3.2 Punkt 5. |
