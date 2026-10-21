# pipwerk Studio – Anwenderdokumentation

## Dokumentstatus

- status: `draft`
- stand: 2026-10-21
- komponente: `pipwerk-studio`

## 1. Wozu pipwerk Studio dient

pipwerk Studio ist der grafische Strategiedesigner von Pipwerk. Mit ihm werden Handelsstrategien auf einer Zeichenfläche zusammengestellt und bearbeitet.

Der derzeitige Stand: Sie legen Strategien an, geführt oder von Hand, stellen Bedingungen, Berechnungen und Regeln aus Bausteinen zusammen oder schreiben sie als Formel, verbinden Schritte und Werte, ordnen Regeln zu, benennen und entfernen Objekte, prüfen, speichern, öffnen, schließen und löschen Strategien. Sprache und Objektverzeichnis stellen Sie in den Einstellungen ein. Vorlagen (Indikator, Trend, Regel, Regelwerk) lassen sich in der Oberfläche noch nicht neu anlegen, ansehen oder löschen; das geht bisher nur über die Web-API (Abschnitt 2, „Web-API ausprobieren“). Eine gespeicherte Vorlage fügen Sie dagegen in eine Strategie ein. Strategien werden nicht ausgeführt.

Wo Sie was finden:

| Sie wollen … | Abschnitt |
| --- | --- |
| pipwerk Studio starten | 2 |
| die Oberfläche kennenlernen | 3 |
| Sprache oder Objektverzeichnis einstellen | 5 |
| eine Strategie anlegen, Elemente einfügen und verbinden, Werte von Objekten verwenden, Strategieparameter anlegen, Regeln zuordnen, Indikatoren und Trends belegen, umbenennen, entfernen, speichern, prüfen, schließen, öffnen oder löschen | 6 |
| einen Ausdruck aus Bausteinen zusammenstellen oder als Formel schreiben und verstehen, was „leer“ und „nicht verfügbar“ bedeuten | 7 |
| einen Befund der Konsistenzprüfung verstehen und beheben | 8 |
| mit dem geführten Aufbau eine erste Strategie anlegen | 9 |
| alles ohne Ziehen bedienen | 10 |

Begriffe, die Sie ohne Vorwissen vielleicht nicht kennen, erklärt das Glossar in Abschnitt 12, zum Beispiel Oberfläche, Zeichenfläche und Datenbank.

## 2. pipwerk Studio öffnen

Eine Installation für Anwender gibt es noch nicht. pipwerk Studio lässt sich auf zwei Wegen starten: als Testumgebung und im Entwicklungsbetrieb. Beide Wege brauchen eine gültige INI-Startkonfiguration (siehe Glossar in Abschnitt 12). Sie legt mindestens die Datenbankverbindung fest. Die Testumgebung legt sie selbst an. Im Entwicklungsbetrieb legen Sie sie an. Ohne eine gültige INI-Startkonfiguration bricht der Start mit einer Fehlermeldung ab; eine Ersatzdatenbank wird nicht angelegt.

### Erster Weg: Testumgebung

Die Testumgebung ist pipwerk Studio, gebaut und gestartet aus genau einem Commit. Ein Commit ist ein festgehaltener Stand des Programms im Repository (siehe Glossar in Abschnitt 12). In der Testumgebung läuft also genau der Stand, den die Standanzeige und der Dialog „Über pipwerk Studio“ nennen (Abschnitt 4).

Die Testumgebung wird mit dem Testumgebungsskript `components/pipwerk-studio/scripts/testenv` gestartet, abgefragt und beendet (zu „Testumgebungsskript“, „Arbeitsverzeichnis“ und „Port“ siehe Glossar in Abschnitt 12). Welche Programme dafür auf dem Rechner vorhanden sein müssen, steht in der technischen Dokumentation `docs/technical/pipwerk-studio.md` im Abschnitt „Start als Testumgebung“.

Alle drei Befehle unten rufen Sie in einem Terminal (siehe Glossar) im obersten Verzeichnis des Arbeitsverzeichnisses auf, also in dem Verzeichnis, in dem auch die Datei `LICENSE` liegt. Der Pfad des Skripts steht im Befehl. Das Skript arbeitet immer auf dem Arbeitsverzeichnis, in dem es liegt. Der Pfad im Befehl ist ein relativer Pfad. Statt des relativen Pfads können Sie auch den vollständigen Pfad des Skripts angeben und den Befehl aus einem beliebigen Verzeichnis aufrufen (zu „Pfad“, „relativer Pfad“ und „vollständiger Pfad“ mit Beispielen siehe Glossar in Abschnitt 12).

1. Starten: `components/pipwerk-studio/scripts/testenv start --frontend-port <Port der Oberfläche> --backend-port <Port des Hintergrunddienstes>`. Beide Ports wählen Sie selbst. Sie müssen frei sein und sich unterscheiden. Der Start dauert, weil das Skript die Programmteile installiert und die Oberfläche baut. Er endet erst, wenn pipwerk Studio antwortet.
2. Öffnen: Rufen Sie im Webbrowser die Adresse auf, die das Skript am Ende des Starts nennt (Meldung „pipwerk Studio is running: …“). Ohne `--host` ist das `http://127.0.0.1:<Port der Oberfläche>/`. `components/pipwerk-studio/scripts/testenv status` nennt die Adresse ebenfalls. `127.0.0.1` ist die Netzwerkadresse Ihres eigenen Rechners (siehe Glossar).
3. Abfragen: `components/pipwerk-studio/scripts/testenv status` nennt, ob die Testumgebung läuft, und die Adressen von Oberfläche und Hintergrunddienst mit ihren Ports.
4. Beenden: `components/pipwerk-studio/scripts/testenv stop` beendet pipwerk Studio und entfernt die Dateien der Testumgebung, auch ihre Datenbank. Damit geht die gespeicherte Sprache verloren: Nach einem erneuten Start (Schritt 1) ist wieder Deutsch eingestellt. Entfernt werden auch die gespeicherten Strategien und Vorlagen der Testumgebung, solange das Objektverzeichnis unter `components/pipwerk-studio/.testenv/` liegt. Das ist nach dem Start der Fall. Wurde das Objektverzeichnis auf ein anderes Verzeichnis geändert, bleiben die Dateien dort erhalten.

Zugriff von anderen Rechnern: Achtung, lesen Sie zuerst diesen Hinweis. Mit `--host` kann jeder, der Ihren Rechner im Netz erreicht, pipwerk Studio benutzen und dessen Einstellungen, zum Beispiel die Sprache, ändern. Er kann außerdem Strategien und Vorlagen anlegen, ändern und löschen und das Objektverzeichnis ändern, in dem pipwerk Studio sie speichert (siehe Glossar). Mit dem Ändern des Objektverzeichnisses lassen sich Dateien auf Ihrem Rechner in ein anderes Verzeichnis verschieben. Es gibt keine Anmeldung. Verwenden Sie `--host` deshalb nur in einem Netz, dem Sie vertrauen. Ohne `--host` ist pipwerk Studio nur von Ihrem eigenen Rechner aus erreichbar. Sollen andere Rechner im Netz zugreifen, geben Sie beim Start `--host` an. Der vollständige Befehl lautet zum Beispiel: `components/pipwerk-studio/scripts/testenv start --frontend-port <Port der Oberfläche> --backend-port <Port des Hintergrunddienstes> --host 0.0.0.0`. `0.0.0.0` bedeutet: alle Netzwerkadressen des Rechners (siehe Glossar). Auf Ihrem eigenen Rechner gilt weiter die Adresse, die das Skript nennt, bei `0.0.0.0` also `http://127.0.0.1:<Port der Oberfläche>/`. Andere Rechner verwenden statt `127.0.0.1` die Netzwerkadresse Ihres Rechners (siehe Glossar), also `http://<Netzwerkadresse des Rechners>:<Port der Oberfläche>/`. Sie müssen die Netzwerkadresse selbst eingeben; ein Name wie `mein-rechner` statt der Netzwerkadresse funktioniert nicht, pipwerk Studio weist die Anfrage ab. Geben Sie statt `0.0.0.0` eine einzelne Netzwerkadresse des Rechners an, ist pipwerk Studio nur unter dieser Adresse erreichbar, und das Skript nennt diese Adresse.

Der Start bricht mit einer Fehlermeldung ab, wenn das Arbeitsverzeichnis nicht genau einem Commit entspricht. Das ist der Fall bei einer nicht committeten Änderung an einer Datei des Repositorys und bei einer neuen Datei, die Git (siehe Glossar) nicht ausdrücklich ignoriert. Der Start bricht auch ab, wenn das Skript nicht in einem Git-Arbeitsbereich (siehe Glossar) liegt. Die Meldung nennt die Ursache. In diesem Fall wurde nichts installiert, gebaut oder gestartet. Committen oder verwerfen Sie die Änderungen und starten Sie erneut. Der Start bricht ebenfalls ab, wenn schon eine Testumgebung läuft oder ein Port belegt ist.

### Web-API ausprobieren

Die Web-API (siehe Glossar) von pipwerk Studio legt Strategien und Vorlagen an, liest, ändert und löscht sie und prüft sie. Wie sich die Web-API in der Testumgebung mit der Seite `/docs` ausprobieren lässt, mit den Beispieldokumenten, den Schritten und den erwarteten Befunden, steht in der technischen Dokumentation `docs/technical/pipwerk-studio.md`, Abschnitt 5.4 „Web-API ausprobieren“.

### Zweiter Weg: Entwicklungsbetrieb

Im Entwicklungsbetrieb (siehe Glossar in Abschnitt 12) starten Sie den Hintergrunddienst und die Oberfläche von Hand in zwei getrennten Terminals (siehe Glossar). Die Schritte stehen in der technischen Dokumentation unter `docs/technical/pipwerk-studio.md` im Abschnitt „Einrichtung und Start im Entwicklungsbetrieb“. Änderungen an den Dateien wirken dort sofort. Deshalb läuft pipwerk Studio im Entwicklungsbetrieb nicht notwendig aus einem Commit. Was das für die Anzeige des Stands bedeutet, steht in Abschnitt 4. Zu „nicht committete Änderung“ siehe Glossar in Abschnitt 12.

Nach dem Start wird pipwerk Studio in einem Webbrowser unter der Adresse `http://127.0.0.1:5173/` geöffnet.

## 3. Aufbau der Oberfläche

Die Oberfläche besteht aus der Kopfzeile oben, dem Streifen der Strategieparameter, der Elementbibliothek, der Zeichenfläche, der Eigenschaftenansicht und der Fußzeile unten. Wie sie angeordnet sind, hängt von der Breite des Fensters ab:

| Breite des Fensters | Anordnung |
| --- | --- |
| ab 1100 Pixel | Elementbibliothek, Zeichenfläche und Eigenschaftenansicht liegen nebeneinander. |
| von 700 bis 1099 Pixel | Die Zeichenfläche steht neben einem Seitenbereich mit zwei Reitern, „Bibliothek“ und „Eigenschaften“. |
| unter 700 Pixel | Es steht ein Bereich nach dem anderen im Fenster. Unten wechseln Sie mit der Leiste „Fläche“, „Bibliothek“, „Eigenschaften“. |

Alles, was sich mit der Maus ziehen lässt, geht auch mit Klicks (Abschnitt 10). Deshalb lässt sich pipwerk Studio auch auf einem Telefon bedienen.

### 3.1 Kopfzeile

Links steht der Name „pipwerk Studio“, daneben das Menü: „Neue Strategie“, „Öffnen“, „Speichern“, „Prüfen“, „Schließen“, „Löschen“ und „Einstellungen“. Ab 1280 Pixel Breite stehen die Einträge einzeln da; darunter öffnet der Knopf „Menü“ eine Liste. Zeigen Sie mit dem Mauszeiger auf einen Eintrag, sagt eine kurze Erklärung, was er tut. Ohne geöffnete Strategie sind „Speichern“, „Prüfen“, „Schließen“ und „Löschen“ nicht wählbar.

Rechts zeigt ein Feld die Zahl der Befunde der letzten Prüfung („3 Befunde“, grün „keine Befunde“). Ein Klick darauf öffnet die Eigenschaftenansicht der Strategie mit der Liste der Befunde. Daneben steht die Schaltfläche „Über pipwerk Studio“ (Abschnitt 4).

### 3.2 Streifen der Strategieparameter

Unter der Kopfzeile steht links der Name der Strategie mit dem Zustand „ungespeichert“ oder „gespeichert“. Ein Klick darauf zeigt die Eigenschaftenansicht der Strategie. Rechts davon stehen die Strategieparameter, jeder mit Namen und Wert. Ein Strategieparameter ist ein Wert, den Sie an einer Stelle festlegen und überall in der Strategie verwenden (zum Beispiel die Zeiteinheit).

- „Neu“ legt einen Strategieparameter an. Sein Fenster öffnet sich gleich.
- Ein Klick auf einen Strategieparameter öffnet sein Fenster: Name, Datentyp, Wert, der Schalter „Wert erst bei der Anwendung übergeben“ und das Entfernen (Papierkorb). „Fertig“ schließt das Fenster.
- Beim Umbenennen ändert sich überall sofort der Name; Ausdrücke, die den Strategieparameter verwenden, zeigen den neuen Namen.
- Das Entfernen fragt zuerst und nennt die Elemente, die den Strategieparameter verwenden (Abschnitt 6.8).

### 3.3 Elementbibliothek

Die Bibliothek zeigt, was Sie in die Strategie einfügen können, in Gruppen:

| Gruppe | Inhalt |
| --- | --- |
| Wann wird gerechnet | Auslöser, zum Beispiel „Kerzenschluss“ und „Tick“ |
| Bedingungen und Aktionen | Schritte des Ablaufs, zum Beispiel „Bedingung“, „Berechnung“, „Order aufgeben“, „Position ändern“ |
| Markt und Konto | Objekte der Anwendung: Konto, Instrument, Kerze, Tick |
| Indikatoren | mitgelieferte und eigene Indikatoren, zum Beispiel „EMA“ und „ATR“, und „eigener Indikator“ |
| Trends | mitgelieferte und eigene Trends, zum Beispiel „1-2-3-Trend (Markttechnik)“, und „eigener Trend“ |
| Regeln | Regeln und Regelwerke, zum Beispiel „Risiko je Trade“, und „eigene Regel“ |

Eine gespeicherte Vorlage trägt die Marke „eigene“. Das Suchfeld oben filtert die Einträge nach Namen und Erklärung. Zeigen Sie mit dem Mauszeiger auf einen Eintrag oder wählen Sie ihn mit der Tabulatortaste, erscheint seine Erklärung.

Ein Klick auf einen Eintrag fügt das Element hinter dem gewählten Schritt ein und verbindet es mit dessen nächstem freien Ausgang. Ist nichts gewählt, liegt es frei auf der Zeichenfläche. Ist der Rahmen einer Verwaltung gewählt, gehört das Element zu dieser Verwaltung. Sie können einen Eintrag auch auf die Zeichenfläche, auf einen Schritt (dahinter) oder in einen Rahmen (in diese Verwaltung) ziehen. Eine Regel oder ein Regelwerk wird der Strategie zugeordnet, oder dem gewählten Element, wenn dieses Regeln zulässt (Abschnitt 6.6).

### 3.4 Zeichenfläche

Die Zeichenfläche zeigt die Strategie:

- Ein **Schritt** (Auslöser, Bedingung, Berechnung, Order …) ist ein Kasten mit dem Namen, einem Satz, der sagt, was er tut, und seinen Ausgängen. Eine Bedingung hat die Ausgänge „wahr“ und „falsch“, die meisten anderen Schritte „weiter“. Die Linie von einem Ausgang zum nächsten Schritt bedeutet „danach folgt“.
- Eine **Karte** zeigt ein Objekt (Indikator, Trend, Kerze …) im Bereich „Objekte und ihre Werte“ neben dem Ablauf. Die Zeilen der Karte sind die Werte des Objekts. Von einer Zeile aus lässt sich ein Wert mit einem Schritt verbinden (Abschnitt 6.3).
- Der **Rahmen** „Verwaltung · Order aufgeben“ hängt unter dem Schritt „Order aufgeben“. In ihm läuft die Verwaltung der Order: zuerst für die wartende Order, nach der Ausführung für die Position. Der Knopf am Titel klappt den Rahmen ein und aus.
- Ein **Abschnitt** fasst zusammengehörige Schritte eines Ablaufs unter einem Namen zusammen und lässt sich ein- und ausklappen.
- **Wertlinien** zeigen, welche Werte von Objekten ein Schritt verwendet. Kräftige Linien sind Eingänge, blasse, gepunktete Linien Werte, die nur ein Ausdruck verwendet.

Die Werkzeugleiste enthält „Ausrichtung“ (senkrecht oder waagerecht), „Wertlinien“ (alle, Auswahl, aus), Vergrößern und Verkleinern, „Alles zeigen“, „Zum Anfang“ und „Neu anordnen“ (alle Schritte wieder automatisch anordnen). Die Legende erklärt die Linien. Ein Schritt, den Sie verschieben, behält seinen Platz; alle anderen ordnet pipwerk Studio selbst.

Ein rot umrandeter Schritt hat einen Fehler, ein orange umrandeter einen Hinweis der Prüfung (Abschnitt 8). Ein Schritt mit einem Typ, den diese Fassung nicht kennt, ist rot und zeigt die Kennung seines Typs; seine Belegungen bleiben beim Speichern unverändert.

### 3.5 Eigenschaftenansicht

Die Eigenschaftenansicht zeigt, was Sie auf der Zeichenfläche gewählt haben. Ein Klick auf eine freie Stelle der Zeichenfläche oder auf den Namen der Strategie zeigt die Strategie.

- **Strategie:** Name, Beschreibung, „Regeln der Strategie“, die Befunde der Prüfung mit „Prüfen“.
- **Schritt:** Name, die Einstellungen des Schritts (Abschnitt 6.4), bei „Order aufgeben“ die „Eigenschaften der Order“, „Liefert“ (was der Schritt für andere bereitstellt, zum Beispiel das Ergebnis einer Berechnung), „Eingänge“ (Werte von Objekten, die mit dem Schritt verbunden sind), „Regeln dieses Elements“, „Abschnitt“, „Gehört zu“ (Hauptablauf oder Verwaltung einer Order) und „Entfernen“.
- **Objekt:** Name, Herkunft (zum Beispiel „EMA 20, aus Objekttyp EMA“), die Einstellungen des Objekts, „Liefert“ (die Werte), „Stelle im Bereich der Objekte“ und „Entfernen“. Ein eigener Indikator, ein eigener Trend und ein Regelwerk haben dazu ihren Inhalt (Abschnitt 6.7).
- **Rahmen** und **Abschnitt:** was sie sind und was Sie damit tun können.

Zu jedem Feld gehört eine Erklärung: Zeigen Sie auf die Beschriftung oder auf das Symbol „i“. Ein Feld mit einem Befund trägt dessen Farbe.

### 3.6 Fußzeile

Unten steht die Fußzeile. Sie zeigt links, ob pipwerk Studio seinen Hintergrunddienst erreicht, und rechts daneben den Stand, aus dem pipwerk Studio läuft. Der Hintergrunddienst ist der Teil von pipwerk Studio, der außerhalb des Browsers läuft (siehe Glossar in Abschnitt 12).

| Anzeige | Bedeutung |
| --- | --- |
| „Backend: Verbindung wird geprüft“ | pipwerk Studio fragt gerade beim Hintergrunddienst an. |
| „Backend: verbunden“ | Der Hintergrunddienst hat geantwortet. pipwerk Studio ist bereit. |
| „Backend: nicht erreichbar“ | Der Hintergrunddienst hat nicht oder nicht richtig geantwortet. In diesem Fall muss geprüft werden, ob er gestartet ist. Danach wird die Seite im Browser neu geladen. |

Der Stand ist die Kurzform des Commits, also die ersten 7 Zeichen der Kennung des Commits, aus dem pipwerk Studio gestartet wurde (siehe Glossar in Abschnitt 12). Damit ist bei einer Prüfung erkennbar, welcher Stand bereitgestellt ist. Er ist keine Versionsnummer. Die Bezeichnung folgt der gewählten Sprache.

| Anzeige | Bedeutung |
| --- | --- |
| „Stand: <kurzform>“ (Deutsch), „Revision: <kurzform>“ (Englisch) | pipwerk Studio läuft aus dem Commit, dessen Kennung mit diesen 7 Zeichen beginnt. |
| „Stand: unbekannt“ (Deutsch), „Revision: unknown“ (Englisch) | Der Stand lässt sich nicht ermitteln, zum Beispiel weil pipwerk Studio außerhalb eines Git-Arbeitsbereichs oder ohne Git gestartet wurde (zu „Git-Arbeitsbereich“ und „Git“ siehe Glossar in Abschnitt 12). Dasselbe wird kurz angezeigt, solange die Anfrage läuft, und wenn sie fehlschlägt. Es erscheint kein Tooltip. pipwerk Studio arbeitet unabhängig davon normal. |

Fahren Sie mit dem Mauszeiger über die Standanzeige, erscheint ein Tooltip (ein kleines Hinweisfenster, siehe Glossar in Abschnitt 12) mit der vollständigen Kennung des Commits (40 Zeichen) und dem Datum dieses Commits. Auf Deutsch lautet er „Commit <kennung> vom TT.MM.JJJJ, hh:mm Uhr“, auf Englisch „Commit <kennung> from YYYY-MM-DD hh:mm“. Die Uhrzeit steht im 24-Stunden-Format in der Ortszeit Ihres Browsers. Das Datum ist das Datum des Commits, nicht der Zeitpunkt, an dem pipwerk Studio gebaut oder gestartet wurde. Lässt sich nur das Datum nicht ermitteln, lautet der Tooltip „Commit <kennung>“. Der Tooltip wechselt mit der Sprache. Hilfstechnik (siehe Glossar) wie ein Bildschirmleser liest denselben Text als Beschreibung der Standanzeige vor. Lässt sich der Stand nicht ermitteln, gibt es keinen Tooltip.

Der Stand wird einmal beim Start von pipwerk Studio ermittelt. Wird das Arbeitsverzeichnis danach auf einen anderen Commit gesetzt (ausgecheckt, siehe Glossar), zeigt ein weiterlaufendes pipwerk Studio weiter den Stand beim Start; nach einem Neustart zeigt es den neuen Stand.

## 4. Dialog „Über pipwerk Studio“

Der Dialog nennt den Namen von pipwerk Studio, den genauen Stand, die Lizenz und die Adresse des Repositorys.

### Öffnen und Schließen

Öffnen: Klicken Sie in der Kopfzeile auf die Schaltfläche „Über pipwerk Studio“ rechts neben dem Menü. Mit der Tastatur erreichen Sie die Schaltfläche mit der Tabulatortaste und öffnen den Dialog mit der Eingabetaste.

Schließen: Klicken Sie im Dialog auf „Schließen“ oder drücken Sie die Escape-Taste. Ein Klick neben den Dialog schließt ihn nicht. Beim Öffnen liegt der Fokus (siehe Glossar in Abschnitt 12) auf „Schließen“; nach dem Schließen liegt er wieder auf der Schaltfläche „Über pipwerk Studio“. Solange der Dialog offen ist, ist die übrige Oberfläche gesperrt: Sie können weder mit der Maus noch mit der Tastatur das Menü oder die Schaltfläche in der Kopfzeile bedienen. Mit der Tabulatortaste wandert der Fokus nur zwischen den Bedienelementen des Dialogs (Lizenzfeld, Verweis, „Schließen“); vom letzten Element geht er mit der Tabulatortaste zum ersten, vom ersten mit Umschalt+Tabulatortaste zum letzten.

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

Die Uhrzeit steht im 24-Stunden-Format in der Ortszeit Ihres Browsers. Das Datum ist das Datum des Commits, nicht der Zeitpunkt, an dem pipwerk Studio gebaut oder gestartet wurde. Der Dialog nennt den Commit, der beim Bau der Oberfläche ausgecheckt war (zu „Bau“ und „ausgecheckt“ siehe Glossar in Abschnitt 12).

„unbekannt“ (Englisch: „unknown“) steht anstelle des Stands, wenn sich Kennung oder Datum des Commits beim Bau nicht ermitteln ließen, zum Beispiel weil pipwerk Studio aus einem Verzeichnis ohne Git gebaut wurde. Eine Kennung ohne Datum zeigt der Dialog nicht. Auch bei der Adresse des Repositorys steht „unbekannt“, wenn die Adresse im Programm ungültig ist; dann gibt es keinen Verweis. pipwerk Studio arbeitet in beiden Fällen normal.

In der Testumgebung ist der Stand im Dialog genau der Commit, aus dem pipwerk Studio läuft. Dialog und Fußzeile nennen dort denselben Commit. Der Dialog zeigt ihn vollständig und mit Datum, die Fußzeile in der Kurzform; der Tooltip der Fußzeile nennt ihn ebenfalls vollständig.

Im Entwicklungsbetrieb kann der Stand vom laufenden Code abweichen, weil dort auch Änderungen wirken, die nicht committet sind. Dafür gilt:

1. Der Dialog nennt den Commit, der beim letzten Start der Oberfläche (des Entwicklungsservers, siehe Glossar) ausgecheckt war. Die Fußzeile nennt den Commit beim Start des Hintergrunddienstes.
2. Nach einem Wechsel des Commits oder bei nicht committeten Änderungen können beide Angaben von dem Code abweichen, der tatsächlich läuft, und voneinander abweichen.
3. Nach einem Neustart von Oberfläche und Hintergrunddienst nennen beide den Commit, der dann ausgecheckt ist. Nicht committete Änderungen gehören zu keinem Commit. Der laufende Code weicht deshalb auch nach dem Neustart vom angezeigten Commit ab, bis Sie die Änderungen committet oder verworfen und beide Programme erneut gestartet haben.

### Internetverbindung

Die Anzeige im Dialog braucht keine Internetverbindung: Name, Stand, Lizenztext und die Adresse sind in pipwerk Studio selbst enthalten. Eine Internetverbindung brauchen Sie nur, wenn Sie den Verweis auf das Repository öffnen. Der Verweis öffnet die Seite in einem neuen Tab.

### Sprachwechsel bei offenem Dialog

Die Texte des Dialogs (Überschrift, Bezeichnungen, Anzeige des Stands, „Schließen“) folgen der Sprache der Oberfläche. Die Einstellungen sind bei offenem Dialog gesperrt. Ändert sich die Sprache trotzdem, weil pipwerk Studio eine in einem anderen Browserfenster geänderte Sprache vom Hintergrunddienst neu liest, wechseln die Texte des offenen Dialogs sofort. Der Dialog bleibt offen und der Fokus bleibt, wo er ist. Name, Lizenz und Adresse bleiben unverändert, weil sie nicht übersetzt werden.

## 5. Einstellungen: Sprache und Objektverzeichnis

Die Einstellungen öffnen Sie mit „Einstellungen“ beziehungsweise „Settings“ im Menü der Kopfzeile. Es öffnet sich ein Dialog mit der Sprache und dem Objektverzeichnis. Eine geöffnete Strategie bleibt dabei unverändert geöffnet. Der Dialog wird mit „Schließen“ beziehungsweise „Close“ geschlossen.

### Sprache wechseln

pipwerk Studio kann auf Deutsch und auf Englisch angezeigt werden. Ohne zuvor gespeicherte Auswahl ist beim Öffnen Deutsch eingestellt.

So wird die Sprache gewechselt:

1. Klicken Sie in der Kopfzeile im Menü auf „Einstellungen“ beziehungsweise „Settings“. Es öffnet sich der Dialog der Einstellungen.
2. Wählen Sie im Auswahlfeld neben „Sprache“ beziehungsweise „Language“ „English“ für Englisch oder „Deutsch“ für Deutsch.
3. Schließen Sie den Dialog mit „Schließen“ beziehungsweise „Close“. Eine geöffnete Strategie bleibt dabei unverändert geöffnet.

### Objektverzeichnis ändern

Das Objektverzeichnis ist das Verzeichnis auf dem Rechner, in dem pipwerk Studio die Strategien und Vorlagen als Dateien ablegt (siehe Glossar in Abschnitt 12). Der Dialog der Einstellungen zeigt unter „Objektverzeichnis“, ob das Standardverzeichnis gilt oder ein von Ihnen festgelegtes Verzeichnis, und im Feld „Verzeichnis (absoluter Pfad)“ den Pfad.

So ändern Sie das Objektverzeichnis:

1. Öffnen Sie die Einstellungen.
2. Tragen Sie im Feld „Verzeichnis (absoluter Pfad)“ den vollständigen Pfad des neuen Verzeichnisses ein. Ein vollständiger Pfad beginnt mit `/` (siehe „vollständiger Pfad“ im Glossar in Abschnitt 12).
3. Wählen Sie „Verzeichnis ändern“. pipwerk Studio fragt „Dateien verschieben?“.
4. Wählen Sie die Antwort:
   - „Ja, Dateien verschieben“: Alle vorhandenen Dateien werden in das neue Verzeichnis verschoben. Die Strategien stehen danach weiter in der Liste von „Öffnen“.
   - „Nein, nur das Verzeichnis ändern“: Es wird nur die Einstellung geändert. Die Dateien bleiben im alten Verzeichnis. Die Strategien aus dem alten Verzeichnis stehen danach nicht mehr in der Liste von „Öffnen“; sie erscheinen wieder, wenn Sie das alte Verzeichnis einstellen.
   - „Abbrechen“: Alles bleibt, wie es war.
5. Bei Erfolg steht im Dialog „Das Objektverzeichnis wurde geändert.“ Scheitert die Änderung, zum Beispiel weil im neuen Verzeichnis schon Dateien mit denselben Namen liegen oder der Pfad nicht absolut ist, steht im Dialog „Das Objektverzeichnis konnte nicht geändert werden.“ mit der Ursache. Die Einstellung bleibt dann, wie sie war.

Nach einer gelungenen Änderung, mit und ohne Verschieben, zeigen die gespeicherten Vorlagen in der Elementbibliothek und die Liste von „Öffnen“ die Dateien des neuen Verzeichnisses. Eine geöffnete Strategie bleibt geöffnet. Sie wird beim nächsten „Speichern“ im neuen Verzeichnis abgelegt, auch wenn die Dateien nicht verschoben wurden.

In der Testumgebung gilt: `components/pipwerk-studio/scripts/testenv stop` entfernt die gespeicherten Strategien und Vorlagen nur, solange das Objektverzeichnis unter `components/pipwerk-studio/.testenv/` liegt. Nach einer Änderung auf ein anderes Verzeichnis bleiben die Dateien dort erhalten; Sie entfernen sie selbst im Dateisystem (Abschnitt 2).

### Sprache: Wirkung, Speicherung und Fehlermeldungen

Alle Texte der Oberfläche erscheinen sofort in der gewählten Sprache. Der Name „pipwerk Studio“ bleibt unverändert. Selbst vergebene Namen, frei eingegebene Texte, Strategieinhalte und andere fachliche Einstellungen werden durch den Sprachwechsel nicht übersetzt oder verändert.

Die Auswahl wird zentral im Hintergrunddienst für die Komponente pipwerk Studio gespeichert. Sie bleibt nach einem Neuladen der Browserseite und nach einem Neustart von pipwerk Studio im Entwicklungsbetrieb erhalten. In der Testumgebung gilt das nur für ein Neuladen der Browserseite: Das Beenden mit `components/pipwerk-studio/scripts/testenv stop` entfernt die Datenbank der Testumgebung und damit die gespeicherte Sprache, und nach einem erneuten Start ist wieder Deutsch eingestellt (Abschnitt 2). Die Sprache gilt komponentenweit, nicht pro Benutzer; Benutzerkonten oder Anmeldungen gibt es in diesem Stand nicht. Die Auswahl wird nicht im Browser gespeichert.

Das Auswahlfeld ist deaktiviert, solange die gespeicherte Sprache gelesen wird (beim Öffnen und bei einem erneuten Lesen im Hintergrund, solange noch keine Sprache bestätigt ist) und solange eine Änderung gespeichert wird. Beim Speichern zeigen Auswahlfeld und Texte bereits die neu gewählte Sprache. Antwortet der Hintergrunddienst nicht innerhalb von 10 Sekunden, gilt das Lesen beziehungsweise Speichern als fehlgeschlagen und es erscheint die entsprechende Fehlermeldung. Das gilt auch, wenn der Browser meldet, dass keine Internetverbindung besteht: Der Hintergrunddienst läuft auf dem eigenen Rechner, und Anfragen an ihn werden trotzdem gesendet. Es gibt drei Fehlermeldungen:

| Meldung | Bedeutung |
| --- | --- |
| „Die gespeicherte Sprache konnte nicht gelesen werden. Es wird die Standardsprache Deutsch angezeigt.“ | Beim Öffnen konnte die gespeicherte Sprache nicht vom Hintergrunddienst gelesen werden. pipwerk Studio zeigt Deutsch an. Die Auswahl bleibt bedienbar. Wird im Hintergrund erneut gelesen (zum Beispiel nach einem Wechsel zurück ins Browserfenster), ist sie währenddessen kurz deaktiviert und die Meldung verschwindet, bis das Lesen erneut fehlschlägt. Prüfen Sie, ob der Hintergrunddienst läuft, und laden Sie die Seite neu. Ist die Sprache beim Öffnen bereits gelesen worden, erscheint diese Meldung später nicht mehr: Schlägt ein erneutes Lesen im Hintergrund fehl (zum Beispiel nach einem Wechsel zurück ins Browserfenster), bleibt die zuletzt bestätigte Sprache angezeigt. |
| „Die Sprache konnte nicht gespeichert werden. Die zuletzt bestätigte Sprache bleibt aktiv.“ | Eine Änderung wurde nicht gespeichert. pipwerk Studio zeigt wieder die zuletzt bestätigte Sprache an. Prüfen Sie den Hintergrunddienst und versuchen Sie es erneut. |
| „Die Sprache konnte nicht gespeichert werden. Es wird die Standardsprache Deutsch angezeigt, weil die gespeicherte Sprache nicht gelesen werden konnte.“ | Beim Öffnen konnte die gespeicherte Sprache nicht gelesen werden und die Änderung ließ sich ebenfalls nicht speichern. Es gibt keine bestätigte Sprache; pipwerk Studio zeigt Deutsch an. Prüfen Sie den Hintergrunddienst und versuchen Sie es erneut. |

Wird die Sprache später erfolgreich gelesen oder eine Änderung erfolgreich gespeichert, verschwinden Meldungen, die darauf beruhten, dass keine Sprache bestätigt war.

## 6. Arbeitsabläufe

Dieser Abschnitt beschreibt die Arbeitsabläufe der Reihe nach. Die Einstellungen beschreibt Abschnitt 5, die Schreibweise der Ausdrücke Abschnitt 7.

### 6.1 Eine Strategie anlegen

„Neue Strategie“ in der Kopfzeile legt eine leere Strategie an. Hat die geöffnete Strategie ungespeicherte Änderungen, fragt pipwerk Studio vorher (Abschnitt 6.9). Danach zeigt die Eigenschaftenansicht den geführten Aufbau (Abschnitt 9). Wählen Sie „Ohne Assistent weiterarbeiten“, bleibt die Zeichenfläche leer; sie sagt, was der nächste Schritt ist: ein Auslöser aus der Gruppe „Wann wird gerechnet“ der Elementbibliothek. Den Namen der Strategie und ihre Beschreibung tragen Sie in der Eigenschaftenansicht der Strategie ein (Klick auf den Namen im Streifen der Strategieparameter). Eine neue Strategie heißt „Neue Strategie“, mit angehängter Zahl, wenn der Name schon vergeben ist. Gespeichert wird erst mit „Speichern“.

### 6.2 Elemente einfügen und verbinden

1. Klicken Sie in der Elementbibliothek einen Eintrag an. Er wird hinter dem gewählten Schritt eingefügt und mit dessen nächstem freien Ausgang verbunden. Die Eigenschaftenansicht zeigt das neue Element, und Sie können es gleich benennen. Jedes Element bekommt einen Namen, zum Beispiel „Bedingung“, bei einem Namen, den es schon gibt, mit Zahl: „Bedingung 2“.
2. Ein Schritt hat Ausgänge. Eine Bedingung hat „wahr“ und „falsch“; die ersten freien Ausgänge füllt das Einfügen der Reihe nach. Wollen Sie einen anderen Ausgang verbinden, klicken Sie den Ausgang an (ein Hinweis fordert Sie auf, den nächsten Schritt anzuklicken) und dann den Schritt, der folgen soll. Oder ziehen Sie vom Ausgang auf den Schritt.
3. Ein Ausgang hat höchstens eine Verbindung. Verbinden Sie ihn neu, ersetzt die neue die alte. Eine Verbindung löschen Sie, indem Sie die Linie anklicken und dann das Kreuz an der Linie.
4. Nicht erlaubt ist: ein Auslöser als Ziel (er hat keinen Eingang), ein Schritt mit sich selbst, ein Objekt im Ablauf und eine Verbindung zwischen dem Hauptablauf und der Verwaltung einer Order. pipwerk Studio sagt es mit einer kurzen Meldung.

**Verwaltung einer Order.** Unter „Order aufgeben“ hängt der Rahmen „Verwaltung · Order aufgeben“. Klicken Sie den Titel des Rahmens an, gehört alles, was Sie jetzt einfügen, zu dieser Verwaltung. Hat die Verwaltung keinen eigenen Auslöser, wird der erste eingefügte Schritt mit dem Ausgang der Order verbunden. Fügen Sie einen Auslöser in die Verwaltung ein, entfällt diese Verbindung. Ein Schritt wechselt die Verwaltung, indem Sie ihn in den Rahmen ziehen (oder heraus) oder in seiner Eigenschaftenansicht unter „Gehört zu“ die Verwaltung wählen.

**Abschnitte.** Unter „Abschnitt“ in der Eigenschaftenansicht eines Schritts ordnen Sie ihn einem Abschnitt zu oder bilden mit „+ Neuen Abschnitt bilden …“ einen neuen. Ein Abschnitt lässt sich auf der Zeichenfläche ein- und ausklappen; „Abschnitt auflösen“ in der Eigenschaftenansicht des Abschnitts löst ihn auf, die Schritte bleiben.

### 6.3 Werte von Objekten verwenden

Indikatoren, Trends und die Objekte des Marktes liegen als Karten im Bereich „Objekte und ihre Werte“. Jede Zeile einer Karte ist ein Wert, den das Objekt liefert. Damit ein Schritt einen Wert verwenden kann, ist der Wert ein **Eingang** des Schritts. Einen Eingang legen Sie auf drei Wegen an:

- Sie wählen den Wert in den Bausteinen eines Ausdrucks (Abschnitt 7.4). Der Eingang entsteht von selbst.
- Sie ziehen auf der Zeichenfläche eine Linie von der Zeile der Karte auf den Schritt.
- Sie wählen in der Eigenschaftenansicht des Schritts unter „Eingänge“ den Eintrag „+ Wert verbinden …“.

Unter „Eingänge“ stehen die Werte mit dem Namen des Objekts; das Kreuz daneben entfernt den Eingang. Ein Eingang, den kein Ausdruck verwendet, wird bei der Prüfung als Hinweis gemeldet.

Die Reihenfolge der Karten ändern Sie unter „Stelle im Bereich der Objekte“ in der Eigenschaftenansicht des Objekts mit „Nach oben“ und „Nach unten“ oder durch Ziehen der Karte.

### 6.4 Parameter und Eigenschaften belegen

Die Einstellungen eines Elements stehen in seiner Eigenschaftenansicht. Zu jedem Parameter und jeder Eigenschaft gehört eine Belegung. Sie wählen ihre Art:

| Belegung | Bedeutung |
| --- | --- |
| Fester Wert | Sie geben den Wert ein oder wählen ihn aus der Liste. |
| Strategieparameter | Sie wählen einen Strategieparameter, dessen Datentyp passt. Es gibt noch keinen passenden? Dann legen Sie ihn mit „+ Neuer Strategieparameter …“ gleich an. |
| Wert eines Objekts | Sie wählen ein Objekt auf der Zeichenfläche und einen seiner Werte. |
| Ausdruck | Sie stellen den Wert aus Bausteinen zusammen (Abschnitt 7). |
| Bei der Anwendung übergeben | Der Wert wird erst übergeben, wenn die Strategie angewendet wird. |

Welche Arten ein Feld anbietet, bestimmt das Feld. Ein Feld ohne Belegung ist „nicht belegt“. Ein Pflichtfeld trägt einen Stern; fehlt seine Belegung, meldet die Prüfung es.

Bei „Order aufgeben“ wählen Sie den Ordertyp. Er bestimmt die „Eigenschaften der Order“, die Sie belegen (zum Beispiel Richtung und Stop-Loss). Wechseln Sie den Ordertyp, bekommen die neu gebrauchten Eigenschaften ihre Standardwerte, die vorhandenen bleiben. Ein Pflichtwert wie das Volumen kann auch eine Regel bestimmen (Abschnitt 6.6).

### 6.5 Strategieparameter

Strategieparameter legen Sie im Streifen unter der Kopfzeile an, ändern und entfernen sie dort (Abschnitt 3.2). Die Datentypen sind Zahl, Ganzzahl, Prozent, Wahrheitswert, Text, Zeiteinheit und die Objekte der Anwendung. In Ausdrücken heißt ein Strategieparameter mit seinem Namen, in den Bausteinen steht er in der Gruppe „Strategieparameter“.

### 6.6 Regeln zuordnen

Eine Regel prüft oder bestimmt etwas, zum Beispiel das Volumen einer Order. Regeln stehen an zwei Stellen: in der Eigenschaftenansicht der Strategie unter „Regeln der Strategie“ (sie gelten für jede Order der Strategie) und in der Eigenschaftenansicht eines Elements, das Regeln zulässt, zum Beispiel „Order aufgeben“, unter „Regeln dieses Elements“ (sie gelten zusätzlich nur für dieses Element).

1. Wählen Sie in der Liste „Regel oder Regelwerk hinzufügen …“ eine mitgelieferte Regel (zum Beispiel „Risiko je Trade“), eine gespeicherte Vorlage (mit der Marke „eigene“) oder „eigene Regel“. Eine Regel aus einer Vorlage ist eine vollständige Kopie: Ändern oder Löschen der Vorlage ändert sie nicht. Sie können auch einen Eintrag der Gruppe „Regeln“ der Elementbibliothek anklicken; er wird der Strategie zugeordnet, oder dem gewählten Element, wenn dieses Regeln zulässt.
2. Die neue Regel ist aufgeklappt. Sie hat einen Namen, den Sie ändern können.
3. Aufgeklappt zeigt die Regel ihre Parameter (zum Beispiel „Risikogrenze“ der Regel „Risiko je Trade“) mit der Belegung, den „Ausdruck der Regel“ aus Bausteinen, „Die Regel bestimmt“ und „Vergleich beim Prüfen“. Bestimmt die Regel „nichts (sie prüft nur)“, ergibt der Ausdruck wahr oder falsch. Bestimmt sie eine Eigenschaft der Order (zum Beispiel das Volumen), ergibt der Ausdruck deren Wert, und der „Vergleich beim Prüfen“ (höchstens, mindestens, gleich) sagt, wie der aktuelle Wert der Eigenschaft gegen das Ergebnis des Ausdrucks geprüft wird, zum Beispiel das Volumen höchstens gleich dem bestimmten Volumen. Eine eigene Regel kann zusätzlich eigene Parameter haben.
4. „Nach oben“ und „Nach unten“ ändern die Reihenfolge; sie ist wichtig, weil eine Regel nur die Ergebnisse früherer Regeln verwenden kann. Das Papierkorb-Symbol entfernt die Regel, der Pfeil davor klappt sie ein und auf.
5. Ein Regelwerk enthält Regeln und kann einen Ausdruck für das Gesamtergebnis haben. Es hat dieselben Listen und Ausdrücke wie eine Regel (unter „Regeln des Regelwerks“ und „Gesamtergebnis“).

### 6.7 Indikatoren, Trends und Regelwerke belegen

Ein mitgelieferter Indikator oder Trend hat Parameter, die Sie belegen: bei einem Indikator zum Beispiel Zeiteinheit und Periode, bei einem Trend Instrument, Zeiteinheit und das Berechnungsverfahren. Die Zeiteinheit wählen Sie am besten als Strategieparameter, damit Sie sie an einer Stelle ändern.

Ein **eigener Indikator** und ein **eigener Trend** haben einen Inhalt, den Sie in der Eigenschaftenansicht aufbauen:

- „Eigene Parameter“: Sie legen Parameter mit Name, Datentyp und Standardwert an. Die Ausdrücke des Objekts sprechen sie mit ihrem Namen an.
- „Eigenschaften“: die Werte, die das Objekt liefert. Jede bekommt ihren Wert aus einem Ausdruck aus Bausteinen. Bei einem Trend gehört die Richtung des Trends dazu („Ausdruck für Richtung festlegen“).
- „Enthaltene Indikatoren“ und „Enthaltene Regeln und Regelwerke“: Indikatoren und Regeln, die das Objekt enthält. Ihre Werte sind in den Ausdrücken des Objekts mit `Objekt.Eigenschaft` ansprechbar.

Ein **eigenes Regelwerk** enthält Regeln (Abschnitt 6.6) und kann den Ausdruck für das Gesamtergebnis haben.

### 6.8 Umbenennen und Entfernen

**Umbenennen.** Den Namen eines Elements, Objekts, Strategieparameters, einer Regel oder eines Abschnitts ändern Sie im Feld „Name“. Es gibt keine Rückfrage, und alle Verwendungen zeigen sofort den neuen Namen: die Sätze auf der Zeichenfläche, die Ausdrücke in den Bausteinen und in der Formel, die Eingänge. Der Name, unter dem Ausdrücke das Objekt ansprechen, ändert sich nicht und taucht für Sie nicht auf.

**Entfernen.** „Entfernen“ in der Eigenschaftenansicht eines Elements oder das Papierkorb-Symbol eines Strategieparameters oder einer Regel entfernt es.

- Wird das Objekt oder der Strategieparameter von anderen Elementen verwendet, fragt pipwerk Studio zuerst und nennt in einer Liste die Elemente, die ihn verwenden. „Abbrechen“ lässt alles, wie es war.
- Bei „Order aufgeben“ entfernt pipwerk Studio mit dem Element auch seine Verwaltung und nennt deren Schritte in der Liste.
- Nach dem Entfernen steht in den Ausdrücken, die den Namen verwendet haben, ein leerer Platz „Wert wählen …“. Ein Feld, das den Strategieparameter oder einen Wert des Objekts belegt hat, ist „nicht belegt“. Die Linien und Eingänge, die von dem Objekt kamen, sind weg.
- Hatte ein entfernter Schritt genau eine eingehende und eine ausgehende Verbindung, wird die Lücke geschlossen: sein Vorgänger wird mit seinem Nachfolger verbunden. Ein Schritt ohne Verwendung und ohne Verwaltung wird ohne Rückfrage entfernt.

### 6.9 Speichern, Prüfen, Schließen, Öffnen, Löschen

- **Speichern** legt die Strategie im Objektverzeichnis ab, beim ersten Mal neu, danach ersetzt es die gespeicherte. Speichern geht immer, auch bei Befunden. Danach prüft pipwerk Studio die Strategie. Der Zustand im Streifen der Strategieparameter wechselt auf „gespeichert“.
- **Prüfen** sucht Probleme (Abschnitt 8) und zeigt ihre Zahl in der Kopfzeile. Nach dem Öffnen läuft die Prüfung von selbst.
- **Schließen**, **Neue Strategie** und **Öffnen** fragen bei ungespeicherten Änderungen: „Speichern“, „Verwerfen“ oder „Abbrechen“. Die Escape-Taste ist „Abbrechen“. Scheitert das Speichern, geschieht nichts weiter.
- **Öffnen** zeigt die gespeicherten Strategien mit Name, Beschreibung und letzter Änderung. Eine Datei, die sich nicht lesen lässt, ist gekennzeichnet und nicht zu öffnen.
- **Löschen** fragt zuerst und löscht die gespeicherte Strategie. Eine Strategie, die nie gespeichert wurde, wird nur verworfen.

Nach dem Öffnen bleibt die Strategie so, wie sie gespeichert ist: Felder, die diese Fassung nicht kennt, bleiben beim Speichern unverändert.

## 7. Ausdrücke schreiben

Ein Ausdruck ist ein kurzer Text, der einen Wert berechnet oder eine Frage beantwortet, deren Antwort „wahr“ oder „falsch“ ist. Ausdrücke stehen in einer Bedingung, einer Berechnung, einer Regel, im Inhalt eines eigenen Indikators oder Trends und überall dort, wo die Belegungsart „Ausdruck“ gewählt ist. Sie stellen sie aus Bausteinen zusammen (Abschnitt 7.4), ohne die Schreibweise zu kennen. Wer will, schreibt einen Ausdruck in der Formelansicht („Ausdruck für Fortgeschrittene“). Die Abschnitte 7.1 bis 7.3 und 7.5 beschreiben die Schreibweise und die Bedeutung dafür. Sie folgt einer Auswahl aus OpenFormula, der Formelsprache der Tabellenkalkulationen. pipwerk Studio berechnet Ausdrücke nicht. Es prüft sie und meldet Fehler (Abschnitt 8). Strategien werden in diesem Stand nicht ausgeführt.

### 7.1 Namen

- Ein Name hat die Punkt-Schreibweise `Objekt.Eigenschaft`, zum Beispiel `ema20.wert`, `Kerze.schluss` oder `Order.volumen`.
- Bei Objekten, die andere Objekte enthalten, ist der Name mehrstufig: `trend_h1.ema20.wert` (die Eigenschaft `wert` der Instanz `ema20` im Trend `trend_h1`) oder `regelwerk.regel.ergebnis` (das Ergebnis der Regel `regel` im Regelwerk `regelwerk`).
- Was vor dem Punkt stehen kann:
  - ein Objekt der Anwendung: `Konto`, `Instrument`, `Kerze`, `Tick`, `Order`, `Position`, `Strategie`
  - der Name einer Instanz, zum Beispiel `ema20` oder `mt_signal`
  - der Name einer Bedingung oder Berechnung mit `.ergebnis`, zum Beispiel `einstieg.ergebnis`
  - der Name einer Regel mit `.ergebnis`, zum Beispiel `risiko.ergebnis`
  - `Strategie` mit dem Namen eines Strategieparameters, zum Beispiel `Strategie.stop_abstand`
- Parameter einer Regel stehen ohne Punkt, zum Beispiel `risikogrenze`.
- Gespeichert werden Kennungen (`stop_loss`, `trend_intakt`). Die Formelansicht zeigt den Ausdruck dagegen in der Anzeigeform: mit den Namen, die Sie vergeben haben, und mit den Beschriftungen der Objekte der Anwendung, ihrer Eigenschaften und der Werte einer Auswahl in der gewählten Sprache. Ein Name, der Leerzeichen, einen Bindestrich oder andere Zeichen enthält, steht in eckigen Klammern: `[EMA 20].Wert`. So lesen Sie ihn auf Deutsch oder Englisch, ohne ihn zu ändern. Beim Eingeben dürfen Sie auch die Kennungen und die Beschriftungen der anderen Sprache schreiben; pipwerk Studio erkennt sie und zeigt danach die Anzeigeform. Die Beispiele in diesem Abschnitt stehen in der gespeicherten Form mit Kennungen.
- Groß- und Kleinschreibung wird nicht unterschieden. Gespeichert wird die Schreibweise der Kennung: `order.VOLUMEN` wird zu `Order.volumen`, `if(…)` zu `IF(…)`.
- Kennungen bestehen nur aus den Buchstaben `A` bis `Z` und `a` bis `z`, den Ziffern `0` bis `9` und `_` und beginnen mit einem Buchstaben oder `_`. Die Namen, die Sie vergeben, dürfen frei sein: pipwerk Studio bildet die Kennung daraus selbst (aus „Stop-Loss“ wird `stop_loss`).
- Welche Namen ein Ausdruck sieht, hängt davon ab, wo er steht:

| Der Ausdruck steht … | Er sieht … |
| --- | --- |
| in einer Bedingung, Berechnung oder bei einer Belegung | alle Instanzen der Strategie, die Namen aller Bedingungen und Berechnungen (`name.ergebnis`), die Regeln der Strategie und die Objekte der Anwendung |
| in einer Regel der Strategie | die Parameter der Regel, die Regeln der Strategie, dann dasselbe wie oben |
| in einer Regel eines Elements | die Parameter der Regel, die Regeln dieses Elements, dann dasselbe wie in einer Regel der Strategie |
| in einer Regel eines Regelwerks | die Parameter der Regel, die Regeln dieses Regelwerks (`regel`) und die Objekte der Anwendung mit `Strategie`; nichts sonst aus der Strategie |

Ein innerer Name verdeckt einen äußeren mit demselben Namen. Zwei Namen derselben Ebene dürfen nicht gleich sein (Befund „doppelt vergeben“, Abschnitt 8).

`Order` und `Position` gibt es nur dort, wo eine Order vorhanden ist: in einer Regel der Strategie, in einer Regel von „Order aufgeben“ und in der Verwaltung. Im Hauptablauf ist ihre Verwendung ein Fehler. In der Verwaltung hat `Order` die Eigenschaften des Ordertyps von „Order aufgeben“.

### 7.2 Werte, Operatoren und Trennzeichen

- Zahlen schreiben Sie mit Dezimalpunkt: `3.14`.
- Prozent: Das Prozentzeichen steht unmittelbar hinter der Zahl, `1%` ist `0.01`.
- Text steht in doppelten Anführungszeichen: `"buy"`. Ein doppeltes Anführungszeichen im Text verdoppeln Sie.
- Wahrheitswerte: `TRUE()` und `FALSE()`.
- Werte einer Auswahl stehen als Text mit ihrer Kennung: `mt_signal.phase = "bewegung"`, `Order.status = "wartend"`, `Order.richtung = "buy"`. Ein Text, der kein Wert dieser Auswahl ist, ist ein Fehler. Die erlaubten Werte nennt der Befund.
- Rechnen: `+`, `-`, `*`, `/`, `^` (Potenz), `&` (Texte aneinanderhängen), Vorzeichen und Klammern.
- Vergleichen: `=`, `<>` (ungleich), `<`, `<=`, `>`, `>=`.
- Die Rangfolge ist, von niedrig nach hoch: Vergleich, `&`, `+ -`, `* /`, `^`, Vorzeichen. Setzen Sie Klammern, wenn Sie unsicher sind.
- „Und“, „oder“ und „nicht“ sind Funktionen: `AND(a; b)`, `OR(a; b)`, `NOT(a)`. Es gibt kein `&&`.
- Die Argumente einer Funktion trennen Sie mit einem Semikolon `;`, nicht mit einem Komma: `IF(a; b; c)`. Zwischen den Teilen darf Leerraum stehen, auch Zeilenumbrüche.

### 7.3 Funktionen

| Funktion | Wirkung |
| --- | --- |
| `IF(Bedingung; Wert; Sonst-Wert)` | Ergibt den Wert, wenn die Bedingung „wahr“ ist, sonst den Sonst-Wert. Der Sonst-Wert darf fehlen. Es wird nur der gewählte Zweig ausgewertet. |
| `AND(a; b; …)`, `OR(a; b; …)` | „Alle“ beziehungsweise „mindestens eine“ der Bedingungen ist wahr. |
| `NOT(a)` | Kehrt „wahr“ und „falsch“ um. |
| `MIN(a; b; …)`, `MAX(a; b; …)` | Der kleinste beziehungsweise größte Wert. |
| `ABS(a)` | Der Betrag. |
| `FLOOR(Zahl; Schrittweite)` | Rundet auf ein Vielfaches der Schrittweite ab. |
| `CEILING(Zahl; Schrittweite)` | Rundet auf ein Vielfaches der Schrittweite auf. |
| `ISNA(Wert)` | Wahr, wenn der Wert „nicht verfügbar“ ist (Abschnitt 7.5). |
| `IFNA(Wert; Ersatz)` | Ergibt den Ersatz, wenn der Wert „nicht verfügbar“ ist, sonst den Wert. |
| `ISBLANK(Wert)` | Wahr, wenn der Wert „leer“ ist (Abschnitt 7.5). |
| `PREVIOUS(Eigenschaft; Anzahl)` | Der Wert der Eigenschaft bei einer früheren Auswertung. Ohne `Anzahl` ist es die vorige. `PREVIOUS(ema20.wert)` ist der Wert von `ema20.wert` bei der vorigen Auswertung. |

Die Funktionsnamen stehen immer in dieser englischen Schreibweise. Deutsche Namen gibt es nicht. Die Eingabe bietet die Funktionen mit ihrer Beschreibung an.

### 7.4 Ausdrücke aus Bausteinen und in der Formelansicht

Wo ein Ausdruck steht, zeigt die Eigenschaftenansicht oben den Satz, den der Ausdruck sagt („EMA 20 kreuzt EMA 50 in beide Richtungen“; auf der Zeichenfläche steht derselbe Satz). Darunter wechseln Sie mit den Reitern „Bausteine“ und „Ausdruck für Fortgeschrittene“ zwischen den beiden Ansichten. Beide zeigen und ändern denselben Ausdruck. pipwerk Studio schreibt ihn nur, wenn er ein gültiger Ausdruck ist.

**Bausteine.** Jeder Platz für einen Wert ist eine Liste, zuerst „Wert wählen …“. Sie enthält in dieser Reihenfolge:

1. „Verbundene Werte“: die Werte, die Sie mit dem Element verbunden haben (Eingänge),
2. „Objekte der Strategie“: die Werte Ihrer Indikatoren und Trends,
3. „Objekte der Anwendung“: Konto, Instrument, Kerze, Tick, in einer Verwaltung auch Order und Position, und Strategie (zum Beispiel die Zahl der wartenden Orders),
4. „Ergebnisse“: das Ergebnis jeder anderen Bedingung, Berechnung und Regel,
5. „Strategieparameter“,
6. „Parameter“ (in einer Regel: ihre eigenen Parameter),
7. „Feste Werte und Rechnen“: „Zahl …“, „Text oder Auswahlwert …“, „wahr oder falsch …“, „Vorheriger Wert von …“, „Rechnung (plus, minus, mal, geteilt)“, „Wenn … dann … sonst …“, „Funktion (kleinster, größter, abgerundet …)“ und „Bedingung (wahr oder falsch) …“.

Ein Wert wird in der Form *Objekt › Eigenschaft* gezeigt, zum Beispiel „EMA 20 › Wert“. Wählen Sie den Wert eines Objekts der Strategie, ist er danach ein Eingang des Elements; Sie müssen ihn nicht eigens verbinden. Bei einem Text, dessen Wert aus einer Auswahl stammt (zum Beispiel die Richtung einer Order oder die Phase eines Trends), bietet pipwerk Studio die erlaubten Werte zur Wahl an. Ein Wert kann selbst eine Rechnung, eine Fallunterscheidung, eine Funktion oder eine Bedingung sein; die Bausteine klappen sich nach Bedarf auf.

Eine **Bedingung** wählt oben ihre Art:

| Art | Bedeutung |
| --- | --- |
| Vergleich | Zwei Werte und ein Vergleich: ist gleich, ist ungleich, ist kleiner als, ist kleiner oder gleich, ist größer als, ist größer oder gleich. |
| Kreuzung | Ein Wert kreuzt einen anderen, nach oben, nach unten oder in beide Richtungen. Der Ausdruck vergleicht dazu den vorigen mit dem jetzigen Wert beider (`PREVIOUS`, Abschnitt 7.3); das passt für Werte, die sich mit der Zeit ändern, zum Beispiel der Wert eines Indikators. |
| Alle gelten (und) | Mindestens zwei Bedingungen, alle müssen wahr sein. „Bedingung hinzufügen“ fügt eine hinzu; ab drei Bedingungen entfernt das Kreuz neben einer sie wieder. |
| Eine gilt (oder) | Mehrere Bedingungen, mindestens eine muss wahr sein. |
| Nicht | Kehrt eine Bedingung um. |
| Wert ist wahr | Ein Wert, der wahr oder falsch ist, zum Beispiel „MT Signal › Trend intakt“ oder eine Fallunterscheidung, deren Zweige Bedingungen sind. |

Ein leerer Platz trägt „Wert wählen …“. Er macht den Ausdruck unvollständig; die Prüfung meldet das. Eine Kreuzung, die noch nicht vollständig ist, bleibt im Editor, wie Sie sie begonnen haben.

Lässt sich ein Ausdruck nicht aus Bausteinen zeigen, weil er einen Schreibfehler enthält oder zu tief verschachtelt ist, sagt pipwerk Studio es und bietet „Zur Ansicht für Fortgeschrittene“ und „Neu zusammenstellen“ an.

**Formelansicht („Ausdruck für Fortgeschrittene“).** Die Formelansicht ist ein mehrzeiliges Feld mit der Anzeigeform (Abschnitt 7.1). Sie hilft beim Schreiben:

- Namen, Funktionen, Zahlen und Texte haben je eine Farbe.
- Steht der Cursor an einer Klammer, sind sie und die zugehörige Klammer hervorgehoben.
- Ein Fehler ist an der Stelle wellig unterstrichen. Zeigen Sie mit dem Mauszeiger darauf, steht der Grund da, und unter dem Feld steht der erste Fehler als Satz.
- Nach `Objekt.` schlägt pipwerk Studio die Eigenschaften des Objekts vor, jeweils mit Datentyp und Erklärung. Das gilt auch nach dem Namen einer Bedingung oder Berechnung (`Ergebnis`), eines Trends mit enthaltenen Indikatoren und eines Regelwerks mit seinen Regeln. Auch beim Beginn eines Namens erscheinen Vorschläge. Mit den Pfeiltasten wählen Sie, mit der Eingabetaste oder der Tabulatortaste übernehmen Sie, Escape schließt die Liste.
- Schreiben Sie eine Funktion, erklärt eine Zeile unter dem Feld ihre Argumente und hebt das hervor, an dem Sie stehen.

Während Sie tippen, liest pipwerk Studio den Ausdruck nach einer kurzen Pause neu; die Bausteine und der Satz folgen. Solange er einen Schreibfehler hat, steht er nur in der Formelansicht.

### 7.5 „Leer“ und „nicht verfügbar“

Manchmal hat eine Eigenschaft keinen Wert. Dafür gibt es zwei Fälle. Sie wirken bei der späteren Ausführung der Strategie verschieden. pipwerk Studio führt Strategien noch nicht aus. Die Festlegung gilt aber schon jetzt, damit Sie Ausdrücke richtig schreiben.

**„Nicht verfügbar“.** Ein Ausdruck spricht eine Eigenschaft an, die das Objekt im Zusammenhang der Auswertung nicht hat. Beispiele: `Order.limitpreis` bei einer Stop-Order (sie hat keinen Limitpreis), `Position`, solange die Order noch keine Position hat, oder `Position` in einer Regel, die auf eine Order angewendet wird. Jede Rechnung mit „nicht verfügbar“ ergibt wieder „nicht verfügbar“, auch eine Bedingung von `IF`. `ISNA(Wert)` fragt danach, `IFNA(Wert; Ersatz)` ersetzt den Wert. Die Regel „Risiko je Trade“ fängt `Position` so ab: `IF(ISNA(Position.volumen); …; …)`.

**„Leer“.** Eine Eigenschaft hat keinen Wert, obwohl das Objekt sie kennt. Beispiel: `punkt_2` der Markttechnik, solange es keinen Trend gibt. Eine Eigenschaft, die Sie nicht belegt haben, aber nicht belegen müssen, ist ebenfalls leer. Rechnen und Vergleichen mit „leer“ ist ein Fehler der Auswertung, ebenso eine Division durch null. `ISBLANK(Wert)` fragt danach.

Die Wirkung bei der Ausführung, wenn ein Ausdruck einen Fehler, „leer“ oder „nicht verfügbar“ ergibt:

| Stelle | Wirkung |
| --- | --- |
| Regel, deren Ergebnis „nicht verfügbar“ ist, weil der Ordertyp eine angesprochene Eigenschaft nicht hat | Die Regel wird auf diese Order nicht angewendet, ohne Fehler und ohne Meldung. |
| bestimmende Regel mit Fehler, „leer“ oder sonst „nicht verfügbar“ | Die Eigenschaft ist nicht bestimmbar. |
| prüfende Regel mit Fehler, „leer“ oder „nicht verfügbar“ | Die Prüfung gilt als nicht erfüllt. |
| Bedingung | Jedes Ergebnis außer „wahr“ nimmt den Ausgang „falsch“. |
| Berechnung | Das Ergebnis ist dieser Wert. Wer es verwendet, verhält sich nach dieser Tabelle. |
| Belegung einer Eigenschaft bei „Order aufgeben“, „Order ändern“, „Position ändern“ oder „Position schließen“ | Die Eigenschaft ist nicht bestimmbar. „Order aufgeben“ nimmt den Ausgang „nicht gestellt“, „Order ändern“ und „Position ändern“ nehmen „nicht geändert“. „Position schließen“ schließt dann nichts, und der Ablauf geht weiter. |
| „Parameter setzen“ | Der Strategieparameter bleibt unverändert. Der Ablauf geht weiter. |
| Parameter einer Instanz, der mit einem Ausdruck belegt ist | Alle Eigenschaften der Instanz sind „leer“. Ein Auslöser, dessen Parameter so ein Ergebnis hat, tritt nicht ein. |
| eigene Eigenschaft eines Indikators oder Trends | Die Eigenschaft ist „leer“. |

Eine Order oder Position ohne Stop-Loss erfüllt die Regel „Risiko je Trade“ nicht, weil der Stop-Loss dann „leer“ ist.

Beispiel: In `str-01` steht die Bedingung `mt_handel.trendrichtung = mt_signal.trendrichtung`. Hat die Markttechnik keinen Trend, ist der Vergleich ohne Ergebnis, und die Bedingung nimmt den Ausgang „falsch“. Es wird dann keine Order geplant.

## 8. Befunde der Konsistenzprüfung und ihre Behebung

Die Konsistenzprüfung läuft bei „Speichern“, bei „Prüfen“ und nach „Öffnen“. Sie meldet Befunde. Ein Befund hat die Stufe „Fehler“ oder „Hinweis“. Ein Fehler macht die Strategie unvollständig oder widersprüchlich. Ein Hinweis weist auf etwas hin, das Sie prüfen sollten. Befunde verhindern das Speichern nicht.

Die Stelle eines Befunds: Fehler sind rot, Hinweise orange. Der Befund steht beim Element, bei der Regel oder, wenn er sich auf kein Element bezieht, bei der Strategie. Ein Befund mit einer Kennung, die diese Fassung nicht kennt, erscheint als „Befund <Kennung>“.

Die Tabelle nennt die Texte, wie sie in der Oberfläche erscheinen. Drei Punkte („…“) stehen dort, wo pipwerk Studio eine Angabe einsetzt.

| Kennung | Stufe | Text in der Oberfläche | Behebung |
| --- | --- | --- | --- |
| `trigger.unconnected` | Fehler | Der Auslöser ist mit keinem Element des Ablaufs verbunden. | Verbinden Sie den Auslöser mit dem ersten Schritt oder entfernen Sie ihn. |
| `flow.not_reached` | Fehler | Kein Auslöser erreicht dieses Element des Ablaufs. | Verbinden Sie einen vorherigen Schritt oder einen Auslöser mit diesem Schritt oder entfernen Sie ihn. |
| `flow.main_without_trigger` | Hinweis | Der Hauptablauf hat keinen Auslöser; die Strategie startet nie. | Legen Sie einen Auslöser an und verbinden Sie ihn mit dem ersten Schritt. Eine neue, leere Strategie hat nur diesen Hinweis. |
| `flow.unending_loop` | Fehler | Rückführung ohne Bedingung, die sie beendet (an … Elementen). | Legen Sie in die Rückführung eine Bedingung, von der ein Ausgang aus der Rückführung hinausführt. |
| `flow.management_only` | Fehler | „…“ darf nur in einer Verwaltung stehen, nicht im Hauptablauf. | Verschieben Sie den Schritt in die Verwaltung einer Order oder entfernen Sie ihn. |
| `flow.no_order_reachable` | Hinweis | Vom Auslöser aus ist kein Element erreichbar, das eine Order aufgibt. | Verbinden Sie den Ablauf mit einem Schritt, der eine Order aufgibt. Soll die Strategie keine Order aufgeben, lassen Sie den Hinweis stehen. |
| `instrument.invalid` | Fehler | Das Instrument „…“ ist keine gültige Bezeichnung. | Korrigieren Sie die Bezeichnung des Instruments. |
| `parameter.missing` | Fehler | Der Pflichtparameter „…“ hat keinen Wert. | Geben Sie dem Parameter einen Wert, wählen Sie einen Strategieparameter oder „bei der Anwendung“. |
| `parameter.binding_invalid` | Fehler | Die Belegung von „…“ passt nicht: … | Wählen Sie eine passende Belegung (Gründe siehe unten). |
| `order.property_missing` | Fehler | Die Eigenschaft „…“ der Order ist nicht belegt, und keine bestimmende Regel liefert sie. | Belegen Sie die Eigenschaft oder ordnen Sie dem Element oder der Strategie eine Regel zu, die sie bestimmt (zum Beispiel „Risiko je Trade“ für das Volumen). |
| `expression.empty` | Fehler | Der Ausdruck in … fehlt oder ist unvollständig. | Geben Sie den Ausdruck vollständig an: Füllen Sie jeden leeren Platz „Wert wählen …“. |
| `expression.invalid` | Fehler | Der Ausdruck in … ist fehlerhaft: … | Korrigieren Sie den Ausdruck (Probleme siehe unten). Ein Klick auf „Zur Stelle“ führt zur Stelle im Ausdruck. |
| `expression.order_outside_management` | Fehler | Der Ausdruck in … verwendet Order oder Position außerhalb einer Verwaltung. | Verwenden Sie Order und Position nur in der Verwaltung einer Order, in einer Regel der Strategie und in einer Regel von „Order aufgeben“. |
| `data.unknown` | Fehler | Die Datenverbindung ist ungültig: …. | Wählen Sie ein Objekt und eine Eigenschaft, die es gibt, oder löschen Sie die Verbindung. Gründe: das Objekt gibt es nicht, das Objekt hat diese Eigenschaft nicht. |
| `data.type_mismatch` | Fehler | Der Datentyp des verbundenen Werts passt nicht: erwartet …, gefunden …. | Verbinden Sie einen Wert vom passenden Datentyp. |
| `input.unused` | Hinweis | Der Eingang „…“ wird nicht verwendet. | Verwenden Sie den Wert in einem Ausdruck oder entfernen Sie den Eingang. |
| `rule.result_mismatch` | Fehler | Das Ergebnis der Regel passt nicht zur bestimmten Eigenschaft „…“: …. | Ändern Sie den Ausdruck der Regel oder wählen Sie eine andere bestimmte Eigenschaft. Der Ausdruck muss einen Wert vom Datentyp der bestimmten Eigenschaft ergeben (bei einer nur prüfenden Regel „wahr“ oder „falsch“). |
| `rule.order_in_indicator` | Fehler | Die Regel spricht Order oder Position an. In einem Indikator oder Trend ist das nicht erlaubt. | Entfernen Sie die Regel aus dem Indikator oder Trend und ordnen Sie sie der Strategie oder einem Element zu. |
| `rule.invalid_type` | Fehler | In dieser Liste von Regeln steht ein Objekt vom Typ „…“, das dort nicht stehen darf. | Entfernen Sie das Objekt aus dieser Liste. |
| `rule.comparison_missing` | Fehler | Die bestimmende Regel nennt keinen Vergleich beim Prüfen. | Wählen Sie den Vergleich beim Prüfen („höchstens“, „mindestens“ oder „gleich“). |
| `rule.unresolved_name` | Hinweis | Hinweis zum Ausdruck in …: … Die Vorlage allein kennt den Namen nicht; geprüft wird er in jeder Strategie, die die Vorlage enthält. | Prüfen Sie den Namen im Ausdruck der Vorlage. Der Hinweis betrifft nur eine Vorlage, die für sich geprüft wird. |
| `ruleset.reference_order` | Fehler | Regelwerk mit Vorwärtsbezug (beziehungsweise Zirkelbezug). | Ändern Sie die Reihenfolge der Regeln, sodass jede Regel nur frühere Ergebnisse verwendet. |
| `candle.no_instance` | Fehler | Die Kerze wird verwendet, aber auf der Zeichenfläche liegt keine Kerze mit gesetzter Zeiteinheit. | Legen Sie eine Kerze mit Zeiteinheit auf die Zeichenfläche und verwenden Sie ihre Werte. Nur wenn ein Element ausschließlich von „Kerzenschluss“ ausgelöst wird, braucht es keine Kerze auf der Zeichenfläche. |
| `name.duplicate` | Fehler | Der Name „…“ ist doppelt vergeben. | Geben Sie einem der beiden einen anderen Namen. Zwei Namen derselben Ebene dürfen nicht gleich sein. |
| `key.invalid` | Fehler | Die Kennung „…“ enthält Zeichen, die ein Ausdruck nicht ansprechen kann. | Ändern Sie den Namen. |
| `layout.invalid` | Fehler | Ein Abschnitt oder eingeklappter Rahmen passt nicht: …. | Entfernen Sie den Abschnitt und legen Sie ihn neu an. |
| `type.unknown` | Fehler | Der Typ „…“ ist unbekannt. | Entfernen Sie das Element oder installieren Sie die Erweiterung, die den Typ liefert. |
| `trend.direction_missing` | Fehler | Dem Trend fehlt der Ausdruck für die Eigenschaft „…“. | Geben Sie den Ausdruck für die Richtung des Trends an. |
| `calculation.circular_reference` | Fehler | Berechnungen verwenden ihre Ergebnisse im Kreis (…). | Ändern Sie eine der Berechnungen, sodass sie nicht auf sich selbst zurückführt. Ein Name in `PREVIOUS(…)` zählt nicht. |
| `connection.invalid` | Fehler | Ungültige Verbindung: …. | Löschen Sie die Verbindung und ziehen Sie sie neu (Gründe siehe unten). |
| `element.rules_not_allowed` | Fehler | Diesem Element sind Regeln zugeordnet, obwohl „…“ keine zulässt. | Entfernen Sie die Regeln von diesem Element. |
| `element.management_invalid` | Fehler | Das Element gehört zur Verwaltung eines Elements, das keine Order aufgibt. | Verschieben Sie das Element in den Hauptablauf oder in die Verwaltung einer Order. |
| `findings.truncated` | Fehler | Es gibt mehr Befunde, als angezeigt werden (Grenze …). | Beheben Sie die angezeigten Befunde und prüfen Sie erneut. |

**Probleme in einem Ausdruck** (`expression.invalid`). Die Stelle zählt von 0 in Zeichen des Ausdrucks: „Stelle 13 bis 14“ ist das 14. Zeichen.

| Problem | Text | Behebung |
| --- | --- | --- |
| Schreibfehler | Schreibfehler an Stelle … bis …: … | Korrigieren Sie die Schreibweise an der genannten Stelle. Der Grund steht dahinter (siehe unten). |
| unbekannte Funktion | Unbekannte Funktion „…“ (Stelle … bis …). | Wählen Sie eine Funktion, die es gibt (Abschnitt 7.3). |
| unbekannter Name | Unbekannter Name „…“ (Stelle … bis …). | Wählen Sie einen Wert, den es gibt: ein Objekt auf der Zeichenfläche, einen Strategieparameter oder das Ergebnis eines Schritts (Abschnitt 7.1). |
| unbekannte Eigenschaft | „…“ hat keine Eigenschaft „…“ (Stelle … bis …). | Wählen Sie eine Eigenschaft, die das Objekt liefert. Die Formelansicht schlägt sie nach dem Punkt vor. |
| unpassender Typ | Der Typ passt nicht: erwartet …, gefunden … (Stelle … bis …). | Verwenden Sie einen Wert vom passenden Datentyp. |
| unbekannter Wert einer Auswahl | „…“ ist kein Wert der Auswahl; erlaubt sind … (Stelle … bis …). | Wählen Sie einen der erlaubten Werte. |
| falsche Zahl von Argumenten | Die Funktion … erhält … Angaben; erlaubt sind … bis … (Stelle … bis …). | Geben Sie die passende Zahl von Angaben an. |
| anderes | Der Ausdruck ist an Stelle … bis … fehlerhaft. | Korrigieren Sie den Ausdruck an der genannten Stelle. |

Gründe eines Schreibfehlers: der Ausdruck endet zu früh (eine Klammer oder ein Argument fehlt), unerwartetes Zeichen „…“ (zum Beispiel ein zweites `>`), ungültiges Zeichen „…“, ungültige Zahl, Text nicht abgeschlossen (ein Anführungszeichen fehlt), der Ausdruck ist zu lang, der Ausdruck ist zu tief geschachtelt.

Gründe einer ungültigen Verbindung: die Quelle ist kein Element, das Ziel ist kein Element, der Ausgang gehört nicht zum Element, ein Auslöser hat keinen Eingang, die Verbindung führt zwischen dem Ablauf und einer Verwaltung oder zwischen zwei Verwaltungen.

Gründe einer unpassenden Belegung: diese Bindungsart ist nicht erlaubt, der feste Wert hat den falschen Datentyp, der feste Wert gehört nicht zur Auswahl, der Wert ist nicht zulässig, der Parameter ist unbekannt, die Eigenschaft ist unbekannt, die Anwendung belegt diese Eigenschaft, nicht der Anwender.

Gründe, warum das Ergebnis einer Regel nicht passt: die bestimmte Eigenschaft ist unbekannt, das Ergebnis ist kein Wert der Auswahl, der Typ des Ergebnisses passt nicht.

Bezeichnungen in den Texten: Ein Ausdruck steht „in Parameter „…““, „in Eigenschaft „…““, „in Eigenschaft „…“ des Objekts“, „in Ausdruck“ oder „in Ausdruck für das Gesamtergebnis“. Ein Zirkelbezug oder Vorwärtsbezug heißt „Zirkelbezug“ beziehungsweise „Vorwärtsbezug“.

**Zur Stelle.** Jeder Befund in der Eigenschaftenansicht der Strategie hat die Schaltfläche „Zur Stelle“. Sie wählt das Element, zeigt es auf der Zeichenfläche und führt zum Feld, das der Befund nennt. Betrifft der Befund einen Ausdruck, öffnet sie dessen Formelansicht und markiert die Stelle im Ausdruck, an der der Fehler liegt. Bei einer Regel klappt sie die Regel auf.

## 9. Mit dem geführten Aufbau eine erste Strategie anlegen

„Neue Strategie“ bietet den geführten Aufbau an. Er führt in fünf Schritten zu einer ersten Strategie und legt dabei dieselben Elemente an, die Sie von Hand mit der Elementbibliothek einfügen. Oben stehen der Schritt, an dem Sie sind, und die Reihe der fünf Schritte. Unten stehen „Zurück“, „Überspringen“ und „Weiter“ (im letzten Schritt „Fertig“).

1. **Name.** Name und Beschreibung der Strategie. Beides ändern Sie später jederzeit.
2. **Auslöser.** Sie wählen, wann die Strategie rechnet, zum Beispiel bei jedem Schluss einer Kerze, und die Zeiteinheit. Ist „Als Strategieparameter anlegen“ eingeschaltet (empfohlen), legt der Aufbau die Zeiteinheit als Strategieparameter an; Sie ändern sie dann an einer Stelle. „Weiter“ legt den Auslöser an.
3. **Indikatoren.** Jede Schaltfläche („EMA“, „ATR“ …) legt einen Indikator an. Er steht mit seinem Namen und seiner Periode darunter; beides ändern Sie gleich. Das Kreuz entfernt ihn wieder. Die Zeiteinheit des Indikators ist der Strategieparameter, wenn Sie einen angelegt haben.
4. **Bedingung.** Wann soll gehandelt werden? Sie wählen zwei Werte der Indikatoren („Wert A“, „Wert B“) und den Vergleich: kreuzt, ist größer als, ist kleiner als. „Weiter“ legt eine Bedingung hinter dem Auslöser an, mit dem Ausdruck aus Bausteinen. Feinere Bedingungen bauen Sie später aus Bausteinen (Abschnitt 7.4). Brauchen Sie keine Bedingung oder noch keine zwei Werte, überspringen Sie den Schritt.
5. **Order.** Sie wählen den Ordertyp und die Angaben, die der Ordertyp vom Anwender verlangt. Die Regel „Risiko je Trade“, die das Volumen bestimmt, ist angekreuzt, wenn sie zur Verfügung steht. „Fertig“ legt „Order aufgeben“ hinter der Bedingung an, ordnet die Regel der Strategie zu, zeigt das neue Element und startet die Prüfung. Die Meldung sagt: „Der Aufbau steht. Die Prüfung zeigt, was noch fehlt.“

Mit „Zurück“ gehen Sie einen Schritt zurück und ändern ihn; was der Schritt angelegt hat, wird ersetzt, nicht verdoppelt. „Ohne Assistent weiterarbeiten“ (oben) beendet den Aufbau jederzeit: Was bis dahin angelegt wurde, bleibt, und Sie arbeiten von Hand weiter. Das gilt auch, wenn Sie ein Element auf der Zeichenfläche wählen oder einen Eintrag der Elementbibliothek einfügen. Gespeichert wird erst mit „Speichern“.

## 10. Alles ohne Ziehen bedienen

Jede Bedienung, für die Sie ziehen können, geht auch mit Klicks. Das hilft auf einem Telefon, am Touchpad und mit der Tastatur.

| Sie wollen … | Mit der Maus ziehen | Mit Klicks |
| --- | --- | --- |
| ein Element einfügen | den Eintrag der Bibliothek auf die Zeichenfläche, hinter einen Schritt oder in einen Rahmen ziehen | den Eintrag anklicken (mit der Tastatur: Tabulator, dann Eingabetaste oder Leertaste); gewählt ist der Schritt oder der Rahmen, hinter beziehungsweise in dem es stehen soll |
| zwei Schritte verbinden | vom Ausgang auf den Schritt ziehen | den Ausgang anklicken, dann den Schritt |
| einen Wert eines Objekts mit einem Schritt verbinden | von der Zeile der Karte auf den Schritt ziehen | in den Bausteinen den Wert wählen, oder in der Eigenschaftenansicht des Schritts „+ Wert verbinden …“ wählen |
| einen Schritt in die Verwaltung einer Order oder heraus bringen | den Schritt in den Rahmen oder heraus ziehen | in der Eigenschaftenansicht unter „Gehört zu“ wählen |
| einen Schritt einem Abschnitt zuordnen | – | in der Eigenschaftenansicht unter „Abschnitt“ wählen |
| die Reihenfolge der Objekte ändern | die Karte ziehen | in der Eigenschaftenansicht unter „Stelle im Bereich der Objekte“ „Nach oben“ oder „Nach unten“ wählen |
| eine Linie löschen | – | die Linie anklicken, dann das Kreuz |
| die Ansicht ändern | die Fläche ziehen | „Verkleinern“, „Vergrößern“, „Alles zeigen“ und „Zum Anfang“ in der Werkzeugleiste |

In schmalen Fenstern (unter 700 Pixel) wechseln Sie mit der Leiste unten zwischen Fläche, Bibliothek und Eigenschaften. Fügen Sie in der Bibliothek ein Element ein, sagt eine Meldung, dass es auf der Zeichenfläche steht.

## 11. Bekannte Einschränkungen

- Vorlagen lassen sich in der Oberfläche noch nicht anlegen, ansehen, speichern oder löschen; das geht bisher nur über die Web-API (Abschnitt 2).
- Mit `--host` kann jeder im Netz Strategien, Vorlagen und das Objektverzeichnis ändern; es gibt keine Anmeldung (Abschnitt 2).
- pipwerk Studio besitzt noch kein Installationspaket für Anwender.
- Die Sprache gilt für die gesamte laufende Komponente pipwerk Studio und nicht für einzelne Personen.
- Weitere Sprachen als Deutsch und Englisch sind nicht verfügbar.
- In der Testumgebung geht die gespeicherte Sprache beim Beenden mit `components/pipwerk-studio/scripts/testenv stop` verloren; nach einem erneuten Start ist Deutsch eingestellt (Abschnitt 2).
- In der Testumgebung entfernt `testenv stop` auch die gespeicherten Strategien und Vorlagen, solange das Objektverzeichnis unter `components/pipwerk-studio/.testenv/` liegt. Wurde es auf ein anderes Verzeichnis geändert, bleiben die Dateien dort erhalten.
- Im Entwicklungsbetrieb kann der Stand im Dialog und in der Fußzeile vom laufenden Code abweichen (Abschnitt 4).
- Strategien werden nicht ausgeführt. Die Konsistenzprüfung prüft nur.
- Ein Ausdruck, den die Bausteine nicht zeigen können (ein Schreibfehler oder eine zu tiefe Verschachtelung), steht nur in der Formelansicht.
- Der geführte Aufbau legt eine einfache Bedingung an: ein Vergleich oder eine Kreuzung zweier Werte von Indikatoren. Alles Weitere stellen Sie von Hand zusammen.

## 12. Glossar

| Begriff | Bedeutung |
| --- | --- |
| Commit | Ein festgehaltener Stand aller Dateien eines Programms im Repository. Jeder Commit hat eine Kennung und ein Datum. |
| Kennung (eines Commits) | Eine Folge von 40 Ziffern und Buchstaben, die einen Commit eindeutig benennt. Die Kurzform sind die ersten 7 Zeichen. |
| Stand | Der Commit, aus dem pipwerk Studio gebaut oder gestartet wurde. Er ist keine Versionsnummer. In der Fußzeile steht die Kurzform der Kennung, im Dialog die vollständige Kennung mit Datum. |
| Repository | Der Ort, an dem alle Dateien von Pipwerk mit ihrer gesamten Änderungsgeschichte gespeichert sind. Für pipwerk Studio ist das die Adresse https://github.com/macodix/pipwerk. |
| Lizenz | Die Bedingungen, unter denen die Software genutzt, weitergegeben und verändert werden darf. pipwerk Studio steht unter der GNU General Public License, Version 3. |
| Hintergrunddienst | Der Teil von pipwerk Studio, der außerhalb des Browsers auf dem Rechner läuft und zum Beispiel die gewählte Sprache speichert. Er wird auch Backend genannt. |
| Web-API | Die über HTTP erreichbare Schnittstelle von pipwerk Studio. Programme und die Seite `/docs` im Browser rufen ihre Endpunkte auf, um Strategien und Vorlagen zu speichern und zu prüfen. Jede Adresse darin heißt Endpunkt. |
| Objektverzeichnis | Das Verzeichnis auf dem Rechner, in dem pipwerk Studio jede Strategie und jede Vorlage als eine Datei ablegt. Die Dateien sind die einzige Quelle der Strategien und Vorlagen. |
| Vorlage | Ein wiederverwendbares Objekt, zum Beispiel eine Regel. Es wird einmal angelegt und gespeichert und lässt sich in Strategien verwenden. |
| Instanz | Eine vollständige Kopie einer Vorlage innerhalb einer Strategie. Sie nennt ihre Vorlage in `origin`. Ändern oder Löschen der Vorlage ändert die Instanz nicht. |
| Zeichenfläche | Der Bereich der Oberfläche in der Mitte, auf dem Sie die Elemente einer Strategie anordnen und verbinden. |
| Elementbibliothek | Der Bereich der Oberfläche links mit den Einträgen, die Sie in die Strategie einfügen (anklicken oder auf die Zeichenfläche ziehen), in Gruppen: „Wann wird gerechnet“, „Bedingungen und Aktionen“, „Markt und Konto“, „Indikatoren“, „Trends“ und „Regeln“. |
| Eigenschaftenansicht | Der Bereich der Oberfläche rechts, in dem Sie die Eigenschaften des gewählten Elements, Rahmens oder Abschnitts oder der Strategie sehen und ändern, mit Regeln, Eingängen und den Befunden der Prüfung. |
| Element | Alles, was Sie auf die Zeichenfläche legen: ein Auslöser, ein Schritt des Ablaufs (zum Beispiel Bedingung, Berechnung, Order aufgeben) oder ein Objekt (zum Beispiel eine Instanz von EMA). |
| Auslöser | Ein Element, das festlegt, bei welchem Ereignis die Strategie oder eine Verwaltung ausgewertet wird, zum Beispiel beim Schluss einer Kerze oder bei jedem Tick. Auslöser sind freiwillig. |
| Verbindung | Eine Linie zwischen zwei Elementen. Sie bedeutet „danach folgt“. Sie beginnt an einem Ausgang eines Elements und endet am Eingang des nächsten. |
| Verwaltung (Rahmen) | Der Teil des Ablaufs, der nach dem Ausgang „gestellt“ von „Order aufgeben“ läuft und sich um die gestellte Order kümmert. Auf der Zeichenfläche ist sie ein Rahmen unter dem Element. Elemente im Rahmen gehören zur Verwaltung. |
| Strategieparameter | Ein Wert, den Sie an einer Stelle der Strategie festlegen und überall in ihr verwenden. Ausdrücke sprechen ihn als `Strategie.<Name>` an. |
| Schritt | Ein Element des Ablaufs auf der Zeichenfläche: ein Auslöser oder ein Element wie Bedingung, Berechnung oder Order aufgeben. Ein Schritt ist ein Kasten mit Ausgängen. |
| Karte | Die Darstellung eines Objekts (Indikator, Trend, Kerze …) im Bereich „Objekte und ihre Werte“. Jede Zeile ist ein Wert des Objekts. |
| Eingang | Ein Wert eines Objekts, den ein Schritt verwendet. Er entsteht, wenn Sie den Wert in den Bausteinen wählen oder eine Linie von der Karte zum Schritt ziehen. |
| Wertlinie | Die Linie von der Zeile einer Karte zu einem Schritt, der den Wert verwendet. Kräftig ist ein Eingang, blass und gepunktet ein Wert, den nur ein Ausdruck verwendet. |
| Baustein | Ein Stück eines Ausdrucks, das Sie in einer Liste wählen, statt es zu schreiben: ein Wert, eine Zahl, ein Text, eine Rechnung, eine Fallunterscheidung, eine Funktion oder eine Bedingung. Aus Bausteinen setzt sich ein Ausdruck zusammen (Abschnitt 7.4). |
| leerer Platz | Ein Platz in einem Ausdruck, an dem noch kein Wert gewählt ist („Wert wählen …“). Er macht den Ausdruck unvollständig. Er entsteht auch, wenn Sie ein Objekt entfernen, das der Ausdruck verwendet hat. |
| Formelansicht | Die Ansicht „Ausdruck für Fortgeschrittene“: Der Ausdruck als Text in der Anzeigeform, mit Farben, markierten Fehlern und Vorschlägen (Abschnitt 7.4). |
| Anzeigeform | Die Schreibweise eines Ausdrucks in der Formelansicht: mit den Namen, die Sie vergeben haben, und den Beschriftungen der gewählten Sprache. Gespeichert wird die Form mit Kennungen. |
| Satz | Der Ausdruck als lesbarer Satz, zum Beispiel „EMA 20 kreuzt EMA 50 in beide Richtungen“. Er steht auf der Zeichenfläche und in der Eigenschaftenansicht. |
| Kreuzung | Eine Bedingung: Ein Wert kreuzt einen anderen, nach oben, nach unten oder in beide Richtungen. |
| Geführter Aufbau | Der Assistent, den „Neue Strategie“ anbietet: Er führt in fünf Schritten zu einer ersten Strategie (Abschnitt 9). |
| Regelwerk | Ein Objekt, das mehrere Regeln enthält und einen Ausdruck für das Gesamtergebnis haben kann. |
| bestimmende Regel | Eine Regel, die eine Eigenschaft der Order bestimmt, zum Beispiel das Volumen. Eine Regel, die nichts bestimmt, prüft nur. |
| Vergleich beim Prüfen | Bei einer bestimmenden Regel: wie der aktuelle Wert der Eigenschaft gegen das Ergebnis der Regel geprüft wird: höchstens, mindestens oder gleich. |
| Bindungsart | Die Art, wie ein Parameter oder eine Eigenschaft ihren Wert erhält: „fester Wert“, „Strategieparameter“, „Wert eines Objekts“, „Ausdruck“ oder „bei der Anwendung“. |
| Datentyp | Die Art eines Werts: Zahl, Ganzzahl, Prozent, Wahrheitswert, Text, Auswahl, Zeiteinheit, Zeitpunkt, Datum, Ausdruck oder Objekt. |
| Zeiteinheit | Die Dauer einer Kerze, zum Beispiel M15 (15 Minuten), H1 (1 Stunde) oder D1 (1 Tag). |
| Regel | Eine Regel prüft oder bestimmt etwas, zum Beispiel das Volumen einer Order. Sie steht in der Eigenschaftenansicht der Strategie oder eines Elements und hat einen Ausdruck. |
| Ausdruck | Ein kurzer Text in der Formelsprache OpenFormula, der einen Wert berechnet, zum Beispiel `ema20.wert > ema50.wert`. Abschnitt 7 beschreibt die Schreibweise. |
| Kennung | Der Name, unter dem eine Eigenschaft, ein Parameter oder ein Wert im Dokument und in Ausdrücken steht, zum Beispiel `stop_loss`. Die Oberfläche zeigt dafür den Namen in der gewählten Sprache. |
| Herkunft | Die Angabe, woraus eine Instanz entstanden ist, zum Beispiel „ema20, aus Objekttyp EMA“ oder „…, aus Vorlage Risiko je Trade“. |
| nicht verfügbar | Der Wert eines Ausdrucks, der eine Eigenschaft anspricht, die das Objekt im Zusammenhang der Auswertung nicht hat, zum Beispiel `Order.limitpreis` bei einer Stop-Order. Jede Rechnung damit ergibt wieder „nicht verfügbar“. `ISNA` und `IFNA` fangen ihn ab (Abschnitt 7.5). |
| leer | Der Wert einer Eigenschaft ohne Wert, zum Beispiel `punkt_2` der Markttechnik ohne Trend. Rechnen und Vergleichen mit „leer“ ist ein Fehler der Auswertung. `ISBLANK` fragt danach (Abschnitt 7.5). Nicht zu verwechseln mit „nicht verfügbar“. |
| Konsistenzprüfung | Die Prüfung eines Dokuments auf Widersprüche, zum Beispiel einen Ausdruck mit Schreibfehler oder einen unbekannten Namen. Sie liefert Befunde. |
| Befund | Ein Ergebnis der Konsistenzprüfung: ein Fehler (`error`) oder ein Hinweis (`hint`) mit einer Art (`code`) und, wenn möglich, dem betroffenen Element. Ein Dokument mit Befunden lässt sich trotzdem speichern. |
| Tooltip | Ein kleines Hinweisfenster, das erscheint, wenn der Mauszeiger kurz über einer Anzeige verweilt. |
| Testumgebung | pipwerk Studio, gebaut und gestartet aus genau einem Commit eines Arbeitsverzeichnisses ohne nicht committete Änderungen. |
| Testumgebungsskript | Das Skript `components/pipwerk-studio/scripts/testenv`, das die Testumgebung startet, abfragt und beendet. |
| Entwicklungsbetrieb | Der Start von pipwerk Studio von Hand in zwei Terminals, bei dem Änderungen an den Dateien sofort wirken, auch wenn sie nicht committet sind. |
| Port | Eine Zahl von 1 bis 65535, unter der ein Programm auf dem Rechner Verbindungen annimmt. Zwei Programme können nicht denselben Port verwenden. |
| Netzwerkadresse | Die Zahlenfolge, unter der ein Rechner im Netz erreichbar ist, zum Beispiel `192.168.0.12`. `127.0.0.1` ist die Netzwerkadresse des eigenen Rechners; sie ist nur von ihm selbst aus erreichbar. `0.0.0.0` ist keine einzelne Adresse. Beim Start mit `--host` bedeutet sie: alle Netzwerkadressen dieses Rechners. |
| nicht committete Änderung | Eine Änderung an einer Datei des Repositorys, die noch nicht als Commit festgehalten ist, oder eine neue Datei, die Git nicht ausdrücklich ignoriert. Um sie loszuwerden, halten Sie sie als Commit fest (committen) oder nehmen sie zurück (verwerfen). |
| Arbeitsverzeichnis | Das Verzeichnis auf Ihrem Rechner mit den Dateien des Repositorys. Meist ist es ein Git-Arbeitsbereich (siehe dort). |
| Verzeichnis | Ein Ordner auf dem Rechner, der Dateien und weitere Verzeichnisse enthält. |
| Pfad | Die Angabe, wo eine Datei oder ein Verzeichnis auf dem Rechner liegt. Die Namen der Verzeichnisse und der Datei stehen nacheinander und sind durch `/` getrennt. |
| relativer Pfad | Ein Pfad, der von dem Verzeichnis aus gilt, in dem Sie im Terminal gerade arbeiten. Er beginnt nicht mit `/`. Beispiel: Sind Sie im obersten Verzeichnis des Arbeitsverzeichnisses, ist `components/pipwerk-studio/scripts/testenv` der relative Pfad des Testumgebungsskripts. |
| vollständiger Pfad | Ein Pfad, der von jedem Verzeichnis aus gilt. Er beginnt mit `/` und nennt alle Verzeichnisse von der obersten Ebene des Rechners an. Beispiel: Liegt das Arbeitsverzeichnis im Verzeichnis `/home/beispiel/pipwerk`, ist `/home/beispiel/pipwerk/components/pipwerk-studio/scripts/testenv` der vollständige Pfad des Testumgebungsskripts. Das Verzeichnis `/home/beispiel/pipwerk` ist ein erfundenes Beispiel; bei Ihnen steht dort der Ort Ihres Arbeitsverzeichnisses. |
| Skript | Eine Datei mit Befehlen, die der Rechner nacheinander ausführt. |
| Git | Das Programm, das die Commits des Repositorys verwaltet. pipwerk Studio liest mit Git die Kennung und das Datum des Commits, aus dem es gebaut oder gestartet wird. |
| Git-Arbeitsbereich | Ein Arbeitsverzeichnis, das Git verwaltet. Git hat die Dateien eines bestimmten Commits hineingelegt, des ausgecheckten Commits (siehe „ausgecheckt“), und erkennt jede Abweichung davon. Ein Verzeichnis, das nur entpackte Dateien enthält, ist kein Git-Arbeitsbereich. Dort lässt sich der Stand nicht ermitteln. |
| ausgecheckt | Ein Commit ist ausgecheckt, wenn Git seine Dateien in einen Git-Arbeitsbereich gelegt hat. Er bleibt der ausgecheckte Commit, auch wenn Sie danach Dateien ändern oder neue anlegen. Solche Änderungen gehören zu keinem Commit. Welche davon als nicht committete Änderungen zählen, steht unter „nicht committete Änderung“. |
| INI-Startkonfiguration | Eine Datei im INI-Format (siehe nächster Eintrag), die vor dem Start festlegt, wie der Hintergrunddienst startet, mindestens die Datenbankverbindung. |
| INI-Format | Eine einfache Art, eine Textdatei zu schreiben: Eine Überschrift steht in eckigen Klammern, darunter folgen Zeilen der Form `name = wert`. Beispiel: Unter der Überschrift `[database]` steht die Zeile `url = …`, die nach dem Gleichheitszeichen angibt, wo die Datenbank liegt. |
| Datenbank | Der Speicher, in dem der Hintergrunddienst Einstellungen dauerhaft ablegt, zum Beispiel die gewählte Sprache und die Einstellung „Objektverzeichnis“ (den Ort, an dem Strategien und Vorlagen liegen). Die Strategien und Vorlagen selbst liegen als Dateien im Objektverzeichnis, nicht in der Datenbank. |
| Oberfläche | Der Teil von pipwerk Studio, den Sie im Webbrowser sehen und bedienen. |
| Bau (bauen) | Das Erzeugen der fertigen Oberfläche aus den Dateien des Repositorys. Dabei werden auch Kennung und Datum des Commits sowie der Lizenztext in die Oberfläche geschrieben. |
| Entwicklungsserver | Ein Programm, das die Oberfläche im Entwicklungsbetrieb im Webbrowser bereitstellt und Änderungen an den Dateien sofort sichtbar macht. |
| Terminal | Ein Fenster, in dem Sie Befehle eintippen und ausführen. |
| Fokus | Die Stelle der Oberfläche, zum Beispiel eine Schaltfläche oder ein Feld, die gerade Eingaben der Tastatur erhält. Sie ist meist hervorgehoben. Mit der Tabulatortaste wechseln Sie den Fokus zur nächsten Stelle. |
| Hilfstechnik | Programme und Geräte, die Menschen mit Einschränkungen bei der Bedienung helfen, zum Beispiel ein Bildschirmleser, der den Inhalt der Seite vorliest. |
