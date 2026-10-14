# pipwerk Studio – Anwenderdokumentation

## Dokumentstatus

- status: `draft`
- stand: 2026-10-14
- komponente: `pipwerk-studio`

## 1. Wozu pipwerk Studio dient

pipwerk Studio ist der grafische Strategiedesigner von Pipwerk. Mit ihm sollen später Handelsstrategien auf einer Arbeitsfläche zusammengestellt und bearbeitet werden.

Der derzeitige Stand ist ein technisches Grundgerüst. pipwerk Studio zeigt eine leere Arbeitsfläche und unterstützt eine dauerhaft gespeicherte deutsche oder englische Oberfläche. Strategien können noch nicht angelegt, bearbeitet, gespeichert oder ausgeführt werden. Begriffe, die Sie ohne Vorwissen vielleicht nicht kennen, erklärt das Glossar in Abschnitt 7, zum Beispiel Oberfläche und Datenbank.

## 2. pipwerk Studio öffnen

Eine Installation für Anwender gibt es noch nicht. pipwerk Studio lässt sich auf zwei Wegen starten: als Testumgebung und im Entwicklungsbetrieb. Beide Wege brauchen eine gültige INI-Startkonfiguration (siehe Glossar in Abschnitt 7). Sie legt mindestens die Datenbankverbindung fest. Die Testumgebung legt sie selbst an. Im Entwicklungsbetrieb legen Sie sie an. Ohne eine gültige INI-Startkonfiguration bricht der Start mit einer Fehlermeldung ab; eine Ersatzdatenbank wird nicht angelegt.

### Erster Weg: Testumgebung

Die Testumgebung ist pipwerk Studio, gebaut und gestartet aus genau einem Commit. Ein Commit ist ein festgehaltener Stand des Programms im Repository (siehe Glossar in Abschnitt 7). In der Testumgebung läuft also genau der Stand, den die Standanzeige und der Dialog „Über pipwerk Studio“ nennen (Abschnitt 4).

Die Testumgebung wird mit dem Testumgebungsskript `components/pipwerk-studio/scripts/testenv` gestartet, abgefragt und beendet (zu „Testumgebungsskript“, „Arbeitsverzeichnis“ und „Port“ siehe Glossar in Abschnitt 7). Welche Programme dafür auf dem Rechner vorhanden sein müssen, steht in der technischen Dokumentation `docs/technical/pipwerk-studio.md` im Abschnitt „Start als Testumgebung“.

Alle drei Befehle unten rufen Sie in einem Terminal (siehe Glossar) im obersten Verzeichnis des Arbeitsverzeichnisses auf, also in dem Verzeichnis, in dem auch die Datei `LICENSE` liegt. Der Pfad des Skripts steht im Befehl. Das Skript arbeitet immer auf dem Arbeitsverzeichnis, in dem es liegt. Der Pfad im Befehl ist ein relativer Pfad. Statt des relativen Pfads können Sie auch den vollständigen Pfad des Skripts angeben und den Befehl aus einem beliebigen Verzeichnis aufrufen (zu „Pfad“, „relativer Pfad“ und „vollständiger Pfad“ mit Beispielen siehe Glossar in Abschnitt 7).

1. Starten: `components/pipwerk-studio/scripts/testenv start --frontend-port <Port der Oberfläche> --backend-port <Port des Hintergrunddienstes>`. Beide Ports wählen Sie selbst. Sie müssen frei sein und sich unterscheiden. Der Start dauert, weil das Skript die Programmteile installiert und die Oberfläche baut. Er endet erst, wenn pipwerk Studio antwortet.
2. Öffnen: Rufen Sie im Webbrowser die Adresse `http://127.0.0.1:<Port der Oberfläche>/` auf. Nur wenn Sie beim Start mit `--host` eine andere Adresse des Rechners angegeben haben, gilt diese Adresse. Achtung: Ohne `--host` ist pipwerk Studio nur von Ihrem eigenen Rechner aus erreichbar. Geben Sie mit `--host` eine andere Adresse an, zum Beispiel `0.0.0.0`, kann jeder, der Ihren Rechner im Netz erreicht, pipwerk Studio benutzen und dessen Einstellungen, zum Beispiel die Sprache, ändern. Es gibt keine Anmeldung. Verwenden Sie `--host` deshalb nur in einem Netz, dem Sie vertrauen.
3. Abfragen: `components/pipwerk-studio/scripts/testenv status` nennt, ob die Testumgebung läuft, und ihre Ports.
4. Beenden: `components/pipwerk-studio/scripts/testenv stop` beendet pipwerk Studio und entfernt die Dateien der Testumgebung, auch ihre Datenbank. Damit geht die gespeicherte Sprache verloren: Nach einem erneuten Start (Schritt 1) ist wieder Deutsch eingestellt.

Der Start bricht mit einer Fehlermeldung ab, wenn das Arbeitsverzeichnis nicht genau einem Commit entspricht. Das ist der Fall bei einer nicht committeten Änderung an einer Datei des Repositorys und bei einer neuen Datei, die Git (siehe Glossar) nicht ausdrücklich ignoriert. Der Start bricht auch ab, wenn das Skript nicht in einem Git-Arbeitsbereich (siehe Glossar) liegt. Die Meldung nennt die Ursache. In diesem Fall wurde nichts installiert, gebaut oder gestartet. Committen oder verwerfen Sie die Änderungen und starten Sie erneut. Der Start bricht ebenfalls ab, wenn schon eine Testumgebung läuft oder ein Port belegt ist.

### Zweiter Weg: Entwicklungsbetrieb

Im Entwicklungsbetrieb (siehe Glossar in Abschnitt 7) starten Sie den Hintergrunddienst und die Oberfläche von Hand in zwei getrennten Terminals (siehe Glossar). Die Schritte stehen in der technischen Dokumentation unter `docs/technical/pipwerk-studio.md` im Abschnitt „Einrichtung und Start im Entwicklungsbetrieb“. Änderungen an den Dateien wirken dort sofort. Deshalb läuft pipwerk Studio im Entwicklungsbetrieb nicht notwendig aus einem Commit. Was das für die Anzeige des Stands bedeutet, steht in Abschnitt 4. Zu „nicht committete Änderung“ siehe Glossar in Abschnitt 7.

Nach dem Start wird pipwerk Studio in einem Webbrowser unter der Adresse `http://127.0.0.1:5173/` geöffnet.

## 3. Aufbau der Oberfläche

Die Oberfläche besteht aus drei Bereichen.

Oben steht die Kopfzeile. Sie zeigt links den Namen „pipwerk Studio“ und rechts das Auswahlfeld für die Sprache. Rechts neben dem Auswahlfeld steht die Schaltfläche „Über pipwerk Studio“ (auf Englisch „About pipwerk Studio“). Sie öffnet den Dialog, den Abschnitt 4 beschreibt. Der Name lautet in Deutsch und in Englisch gleich. Auch der Titel der Seite im Browser lautet „pipwerk Studio“.

In der Mitte liegt die Designer-Arbeitsfläche. Sie ist mit einem Punktraster hinterlegt. Oben links steht der Hinweis „Die Arbeitsfläche ist leer.“ Die Arbeitsfläche kann mit der Maus verschoben und mit dem Mausrad vergrößert oder verkleinert werden. Weitere Funktionen hat sie noch nicht.

Unten steht die Fußzeile. Sie zeigt links, ob pipwerk Studio seinen Hintergrunddienst erreicht, und rechts daneben den Stand, aus dem pipwerk Studio läuft. Der Hintergrunddienst ist der Teil von pipwerk Studio, der außerhalb des Browsers läuft (siehe Glossar in Abschnitt 7).

| Anzeige | Bedeutung |
| --- | --- |
| „Backend: Verbindung wird geprüft“ | pipwerk Studio fragt gerade beim Hintergrunddienst an. |
| „Backend: verbunden“ | Der Hintergrunddienst hat geantwortet. pipwerk Studio ist bereit. |
| „Backend: nicht erreichbar“ | Der Hintergrunddienst hat nicht oder nicht richtig geantwortet. In diesem Fall muss geprüft werden, ob er gestartet ist. Danach wird die Seite im Browser neu geladen. |

Der Stand ist die Kurzform des Commits, also die ersten 7 Zeichen der Kennung des Commits, aus dem pipwerk Studio gestartet wurde (siehe Glossar in Abschnitt 7). Damit ist bei einer Prüfung erkennbar, welcher Stand bereitgestellt ist. Er ist keine Versionsnummer. Die Bezeichnung folgt der gewählten Sprache.

| Anzeige | Bedeutung |
| --- | --- |
| „Stand: <kurzform>“ (Deutsch), „Revision: <kurzform>“ (Englisch) | pipwerk Studio läuft aus dem Commit, dessen Kennung mit diesen 7 Zeichen beginnt. |
| „Stand: unbekannt“ (Deutsch), „Revision: unknown“ (Englisch) | Der Stand lässt sich nicht ermitteln, zum Beispiel weil pipwerk Studio außerhalb eines Git-Arbeitsbereichs oder ohne Git gestartet wurde (zu „Git-Arbeitsbereich“ und „Git“ siehe Glossar in Abschnitt 7). Dasselbe wird kurz angezeigt, solange die Anfrage läuft, und wenn sie fehlschlägt. Es erscheint kein Tooltip. pipwerk Studio arbeitet unabhängig davon normal. |

Fahren Sie mit dem Mauszeiger über die Standanzeige, erscheint ein Tooltip (ein kleines Hinweisfenster, siehe Glossar in Abschnitt 7) mit der vollständigen Kennung des Commits (40 Zeichen) und dem Datum dieses Commits. Auf Deutsch lautet er „Commit <kennung> vom TT.MM.JJJJ, hh:mm Uhr“, auf Englisch „Commit <kennung> from YYYY-MM-DD hh:mm“. Die Uhrzeit steht im 24-Stunden-Format in der Ortszeit Ihres Browsers. Das Datum ist das Datum des Commits, nicht der Zeitpunkt, an dem pipwerk Studio gebaut oder gestartet wurde. Lässt sich nur das Datum nicht ermitteln, lautet der Tooltip „Commit <kennung>“. Der Tooltip wechselt mit der Sprache. Hilfstechnik (siehe Glossar) wie ein Bildschirmleser liest denselben Text als Beschreibung der Standanzeige vor. Lässt sich der Stand nicht ermitteln, gibt es keinen Tooltip.

Der Stand wird einmal beim Start von pipwerk Studio ermittelt. Wird das Arbeitsverzeichnis danach auf einen anderen Commit gesetzt (ausgecheckt, siehe Glossar), zeigt ein weiterlaufendes pipwerk Studio weiter den Stand beim Start; nach einem Neustart zeigt es den neuen Stand.

## 4. Dialog „Über pipwerk Studio“

Der Dialog nennt den Namen von pipwerk Studio, den genauen Stand, die Lizenz und die Adresse des Repositorys.

### Öffnen und Schließen

Öffnen: Klicken Sie in der Kopfzeile auf die Schaltfläche „Über pipwerk Studio“ rechts neben dem Auswahlfeld für die Sprache. Mit der Tastatur erreichen Sie die Schaltfläche mit der Tabulatortaste und öffnen den Dialog mit der Eingabetaste.

Schließen: Klicken Sie im Dialog auf „Schließen“ oder drücken Sie die Escape-Taste. Ein Klick neben den Dialog schließt ihn nicht. Beim Öffnen liegt der Fokus (siehe Glossar in Abschnitt 7) auf „Schließen“; nach dem Schließen liegt er wieder auf der Schaltfläche „Über pipwerk Studio“. Solange der Dialog offen ist, ist die übrige Oberfläche gesperrt: Sie können weder mit der Maus noch mit der Tastatur das Auswahlfeld für die Sprache oder die Schaltfläche in der Kopfzeile bedienen. Mit der Tabulatortaste wandert der Fokus nur zwischen den Bedienelementen des Dialogs (Lizenzfeld, Verweis, „Schließen“); vom letzten Element geht er mit der Tabulatortaste zum ersten, vom ersten mit Umschalt+Tabulatortaste zum letzten.

### Inhalt

| Bestandteil | Inhalt |
| --- | --- |
| Überschrift | „Über pipwerk Studio“ (Englisch: „About pipwerk Studio“) |
| Name | „pipwerk Studio“, in beiden Sprachen gleich |
| Stand (Englisch: „Revision“) | die vollständige Kennung des Commits mit 40 Zeichen, dazu Datum und Uhrzeit des Commits |
| Lizenz (Englisch: „License“) | der Name „GNU General Public License, Version 3“ und darunter der vollständige Text der Lizenz |
| Repository | die Adresse https://github.com/macodix/pipwerk als Verweis |
| Schaltfläche | „Schließen“ (Englisch: „Close“) |

Der Text der Lizenz steht im englischen Original und wird nicht übersetzt. Er ist lang und hat ein eigenes Feld mit Bildlaufleiste. Dieses Feld mit dem Lizenztext heißt hier Lizenzfeld. Sie können es mit der Tabulatortaste erreichen und mit den Pfeiltasten verschieben.

### Stand

Der Stand wird so angezeigt:

| Sprache | Anzeige | Beispiel |
| --- | --- | --- |
| Deutsch | „<Kennung> vom TT.MM.JJJJ, hh:mm Uhr“ | „0123456789abcdef0123456789abcdef01234567 vom 09.10.2026, 14:52 Uhr“ |
| Englisch | „<Kennung> from YYYY-MM-DD hh:mm“ | „0123456789abcdef0123456789abcdef01234567 from 2026-10-09 14:52“ |

Die Uhrzeit steht im 24-Stunden-Format in der Ortszeit Ihres Browsers. Das Datum ist das Datum des Commits, nicht der Zeitpunkt, an dem pipwerk Studio gebaut oder gestartet wurde. Der Dialog nennt den Commit, der beim Bau der Oberfläche ausgecheckt war (zu „Bau“ und „ausgecheckt“ siehe Glossar in Abschnitt 7).

„unbekannt“ (Englisch: „unknown“) steht anstelle des Stands, wenn sich Kennung oder Datum des Commits beim Bau nicht ermitteln ließen, zum Beispiel weil pipwerk Studio aus einem Verzeichnis ohne Git gebaut wurde. Eine Kennung ohne Datum zeigt der Dialog nicht. Auch bei der Adresse des Repositorys steht „unbekannt“, wenn die Adresse im Programm ungültig ist; dann gibt es keinen Verweis. pipwerk Studio arbeitet in beiden Fällen normal.

In der Testumgebung ist der Stand im Dialog genau der Commit, aus dem pipwerk Studio läuft. Dialog und Fußzeile nennen dort denselben Commit. Der Dialog zeigt ihn vollständig und mit Datum, die Fußzeile in der Kurzform; der Tooltip der Fußzeile nennt ihn ebenfalls vollständig.

Im Entwicklungsbetrieb kann der Stand vom laufenden Code abweichen, weil dort auch Änderungen wirken, die nicht committet sind. Dafür gilt:

1. Der Dialog nennt den Commit, der beim letzten Start der Oberfläche (des Entwicklungsservers, siehe Glossar) ausgecheckt war. Die Fußzeile nennt den Commit beim Start des Hintergrunddienstes.
2. Nach einem Wechsel des Commits oder bei nicht committeten Änderungen können beide Angaben von dem Code abweichen, der tatsächlich läuft, und voneinander abweichen.
3. Nach einem Neustart von Oberfläche und Hintergrunddienst nennen beide den Commit, der dann ausgecheckt ist. Nicht committete Änderungen gehören zu keinem Commit. Der laufende Code weicht deshalb auch nach dem Neustart vom angezeigten Commit ab, bis Sie die Änderungen committet oder verworfen und beide Programme erneut gestartet haben.

### Internetverbindung

Die Anzeige im Dialog braucht keine Internetverbindung: Name, Stand, Lizenztext und die Adresse sind in pipwerk Studio selbst enthalten. Eine Internetverbindung brauchen Sie nur, wenn Sie den Verweis auf das Repository öffnen. Der Verweis öffnet die Seite in einem neuen Tab.

### Sprachwechsel bei offenem Dialog

Die Texte des Dialogs (Überschrift, Bezeichnungen, Anzeige des Stands, „Schließen“) folgen der Sprache der Oberfläche. Das Auswahlfeld für die Sprache ist bei offenem Dialog gesperrt. Ändert sich die Sprache trotzdem, weil pipwerk Studio eine in einem anderen Browserfenster geänderte Sprache vom Hintergrunddienst neu liest, wechseln die Texte des offenen Dialogs sofort. Der Dialog bleibt offen und der Fokus bleibt, wo er ist. Name, Lizenz und Adresse bleiben unverändert, weil sie nicht übersetzt werden.

## 5. Sprache wechseln

pipwerk Studio kann auf Deutsch und auf Englisch angezeigt werden. Ohne zuvor gespeicherte Auswahl ist beim Öffnen Deutsch eingestellt.

So wird die Sprache gewechselt:

1. Klicken Sie in der Kopfzeile auf das Auswahlfeld neben „Sprache“ beziehungsweise „Language“.
2. Wählen Sie „English“ für Englisch oder „Deutsch“ für Deutsch.

Alle Texte der Oberfläche erscheinen sofort in der gewählten Sprache. Der Name „pipwerk Studio“ bleibt unverändert. Selbst vergebene Namen, frei eingegebene Texte, Strategieinhalte und andere fachliche Einstellungen werden durch den Sprachwechsel nicht übersetzt oder verändert.

Die Auswahl wird zentral im Hintergrunddienst für die Komponente pipwerk Studio gespeichert. Sie bleibt nach einem Neuladen der Browserseite und nach einem Neustart von pipwerk Studio im Entwicklungsbetrieb erhalten. In der Testumgebung gilt das nur für ein Neuladen der Browserseite: Das Beenden mit `components/pipwerk-studio/scripts/testenv stop` entfernt die Datenbank der Testumgebung und damit die gespeicherte Sprache, und nach einem erneuten Start ist wieder Deutsch eingestellt (Abschnitt 2). Die Sprache gilt komponentenweit, nicht pro Benutzer; Benutzerkonten oder Anmeldungen gibt es in diesem Stand nicht. Die Auswahl wird nicht im Browser gespeichert.

Das Auswahlfeld ist deaktiviert, solange die gespeicherte Sprache gelesen wird (beim Öffnen und bei einem erneuten Lesen im Hintergrund, solange noch keine Sprache bestätigt ist) und solange eine Änderung gespeichert wird. Beim Speichern zeigen Auswahlfeld und Texte bereits die neu gewählte Sprache. Antwortet der Hintergrunddienst nicht innerhalb von 10 Sekunden, gilt das Lesen beziehungsweise Speichern als fehlgeschlagen und es erscheint die entsprechende Fehlermeldung. Das gilt auch, wenn der Browser meldet, dass keine Internetverbindung besteht: Der Hintergrunddienst läuft auf dem eigenen Rechner, und Anfragen an ihn werden trotzdem gesendet. Es gibt drei Fehlermeldungen:

| Meldung | Bedeutung |
| --- | --- |
| „Die gespeicherte Sprache konnte nicht gelesen werden. Es wird die Standardsprache Deutsch angezeigt.“ | Beim Öffnen konnte die gespeicherte Sprache nicht vom Hintergrunddienst gelesen werden. pipwerk Studio zeigt Deutsch an. Die Auswahl bleibt bedienbar. Wird im Hintergrund erneut gelesen (zum Beispiel nach einem Wechsel zurück ins Browserfenster), ist sie währenddessen kurz deaktiviert und die Meldung verschwindet, bis das Lesen erneut fehlschlägt. Prüfen Sie, ob der Hintergrunddienst läuft, und laden Sie die Seite neu. Ist die Sprache beim Öffnen bereits gelesen worden, erscheint diese Meldung später nicht mehr: Schlägt ein erneutes Lesen im Hintergrund fehl (zum Beispiel nach einem Wechsel zurück ins Browserfenster), bleibt die zuletzt bestätigte Sprache angezeigt. |
| „Die Sprache konnte nicht gespeichert werden. Die zuletzt bestätigte Sprache bleibt aktiv.“ | Eine Änderung wurde nicht gespeichert. pipwerk Studio zeigt wieder die zuletzt bestätigte Sprache an. Prüfen Sie den Hintergrunddienst und versuchen Sie es erneut. |
| „Die Sprache konnte nicht gespeichert werden. Es wird die Standardsprache Deutsch angezeigt, weil die gespeicherte Sprache nicht gelesen werden konnte.“ | Beim Öffnen konnte die gespeicherte Sprache nicht gelesen werden und die Änderung ließ sich ebenfalls nicht speichern. Es gibt keine bestätigte Sprache; pipwerk Studio zeigt Deutsch an. Prüfen Sie den Hintergrunddienst und versuchen Sie es erneut. |

Wird die Sprache später erfolgreich gelesen oder eine Änderung erfolgreich gespeichert, verschwinden Meldungen, die darauf beruhten, dass keine Sprache bestätigt war.

## 6. Bekannte Einschränkungen

- Die Arbeitsfläche ist noch leer; Strategien können noch nicht bearbeitet werden.
- pipwerk Studio besitzt noch kein Installationspaket für Anwender.
- Die Sprache gilt für die gesamte laufende Komponente pipwerk Studio und nicht für einzelne Personen.
- Weitere Sprachen als Deutsch und Englisch sind nicht verfügbar.
- In der Testumgebung geht die gespeicherte Sprache beim Beenden mit `components/pipwerk-studio/scripts/testenv stop` verloren; nach einem erneuten Start ist Deutsch eingestellt (Abschnitt 2).
- Im Entwicklungsbetrieb kann der Stand im Dialog und in der Fußzeile vom laufenden Code abweichen (Abschnitt 4).

## 7. Glossar

| Begriff | Bedeutung |
| --- | --- |
| Commit | Ein festgehaltener Stand aller Dateien eines Programms im Repository. Jeder Commit hat eine Kennung und ein Datum. |
| Kennung (eines Commits) | Eine Folge von 40 Ziffern und Buchstaben, die einen Commit eindeutig benennt. Die Kurzform sind die ersten 7 Zeichen. |
| Stand | Der Commit, aus dem pipwerk Studio gebaut oder gestartet wurde. Er ist keine Versionsnummer. In der Fußzeile steht die Kurzform der Kennung, im Dialog die vollständige Kennung mit Datum. |
| Repository | Der Ort, an dem alle Dateien von Pipwerk mit ihrer gesamten Änderungsgeschichte gespeichert sind. Für pipwerk Studio ist das die Adresse https://github.com/macodix/pipwerk. |
| Lizenz | Die Bedingungen, unter denen die Software genutzt, weitergegeben und verändert werden darf. pipwerk Studio steht unter der GNU General Public License, Version 3. |
| Hintergrunddienst | Der Teil von pipwerk Studio, der außerhalb des Browsers auf dem Rechner läuft und zum Beispiel die gewählte Sprache speichert. Er wird auch Backend genannt. |
| Tooltip | Ein kleines Hinweisfenster, das erscheint, wenn der Mauszeiger kurz über einer Anzeige verweilt. |
| Testumgebung | pipwerk Studio, gebaut und gestartet aus genau einem Commit eines Arbeitsverzeichnisses ohne nicht committete Änderungen. |
| Testumgebungsskript | Das Skript `components/pipwerk-studio/scripts/testenv`, das die Testumgebung startet, abfragt und beendet. |
| Entwicklungsbetrieb | Der Start von pipwerk Studio von Hand in zwei Terminals, bei dem Änderungen an den Dateien sofort wirken, auch wenn sie nicht committet sind. |
| Port | Eine Zahl von 1 bis 65535, unter der ein Programm auf dem Rechner Verbindungen annimmt. Zwei Programme können nicht denselben Port verwenden. |
| nicht committete Änderung | Eine Änderung an einer Datei des Repositorys, die noch nicht als Commit festgehalten ist, oder eine neue Datei, die Git nicht ausdrücklich ignoriert. Um sie loszuwerden, halten Sie sie als Commit fest (committen) oder nehmen sie zurück (verwerfen). |
| Arbeitsverzeichnis | Das Verzeichnis auf Ihrem Rechner mit den Dateien des Repositorys. Es steht auf einem bestimmten Commit. Ändern Sie Dateien oder legen Sie neue an, kommen diese Änderungen zum Commit hinzu und gehören zu keinem Commit, bis Sie sie als Commit festhalten. In ihm liegen unter anderem die Datei `LICENSE` und das Verzeichnis `components`. Sein oberstes Verzeichnis ist das Verzeichnis, in dem `LICENSE` liegt. |
| Verzeichnis | Ein Ordner auf dem Rechner, der Dateien und weitere Verzeichnisse enthält. |
| Pfad | Die Angabe, wo eine Datei oder ein Verzeichnis auf dem Rechner liegt. Die Namen der Verzeichnisse und der Datei stehen nacheinander und sind durch `/` getrennt. |
| relativer Pfad | Ein Pfad, der von dem Verzeichnis aus gilt, in dem Sie im Terminal gerade arbeiten. Er beginnt nicht mit `/`. Beispiel: Sind Sie im obersten Verzeichnis des Arbeitsverzeichnisses, ist `components/pipwerk-studio/scripts/testenv` der relative Pfad des Testumgebungsskripts. |
| vollständiger Pfad | Ein Pfad, der von jedem Verzeichnis aus gilt. Er beginnt mit `/` und nennt alle Verzeichnisse von der obersten Ebene des Rechners an. Beispiel: Liegt das Arbeitsverzeichnis im Verzeichnis `/home/beispiel/pipwerk`, ist `/home/beispiel/pipwerk/components/pipwerk-studio/scripts/testenv` der vollständige Pfad des Testumgebungsskripts. Das Verzeichnis `/home/beispiel/pipwerk` ist ein erfundenes Beispiel; bei Ihnen steht dort der Ort Ihres Arbeitsverzeichnisses. |
| Skript | Eine Datei mit Befehlen, die der Rechner nacheinander ausführt. |
| Git | Das Programm, das die Commits des Repositorys verwaltet. pipwerk Studio liest mit Git die Kennung und das Datum des Commits, aus dem es gebaut oder gestartet wird. |
| Git-Arbeitsbereich | Ein Arbeitsverzeichnis, das Git verwaltet. Ein Verzeichnis, das nur entpackte Dateien enthält und das Git nicht verwaltet, ist kein Git-Arbeitsbereich; dort lässt sich der Stand nicht ermitteln. |
| ausgecheckt | Der ausgecheckte Commit ist der Commit, auf dem das Arbeitsverzeichnis steht. Nicht committete Änderungen kommen zu ihm hinzu und gehören zu keinem Commit. Das Wechseln auf einen anderen Commit heißt auschecken. |
| INI-Startkonfiguration | Eine Datei im INI-Format (siehe nächster Eintrag), die vor dem Start festlegt, wie der Hintergrunddienst startet, mindestens die Datenbankverbindung. |
| INI-Format | Eine einfache Art, eine Textdatei zu schreiben: Eine Überschrift steht in eckigen Klammern, darunter folgen Zeilen der Form `name = wert`. Beispiel: Unter der Überschrift `[database]` steht die Zeile `url = …`, die nach dem Gleichheitszeichen angibt, wo die Datenbank liegt. |
| Datenbank | Der Speicher, in dem der Hintergrunddienst Einstellungen wie die gewählte Sprache dauerhaft ablegt. |
| Oberfläche | Der Teil von pipwerk Studio, den Sie im Webbrowser sehen und bedienen. |
| Bau (bauen) | Das Erzeugen der fertigen Oberfläche aus den Dateien des Repositorys. Dabei werden auch Kennung und Datum des Commits sowie der Lizenztext in die Oberfläche geschrieben. |
| Entwicklungsserver | Ein Programm, das die Oberfläche im Entwicklungsbetrieb im Webbrowser bereitstellt und Änderungen an den Dateien sofort sichtbar macht. |
| Terminal | Ein Fenster, in dem Sie Befehle eintippen und ausführen. |
| Fokus | Die Stelle der Oberfläche, zum Beispiel eine Schaltfläche oder ein Feld, die gerade Eingaben der Tastatur erhält. Sie ist meist hervorgehoben. Mit der Tabulatortaste wechseln Sie den Fokus zur nächsten Stelle. |
| Hilfstechnik | Programme und Geräte, die Menschen mit Einschränkungen bei der Bedienung helfen, zum Beispiel ein Bildschirmleser, der den Inhalt der Seite vorliest. |
