# pipwerk Studio – Anwenderdokumentation

## Dokumentstatus

- status: `draft`
- stand: 2026-10-29
- komponente: `pipwerk-studio`

## 1. Wozu pipwerk Studio dient

pipwerk Studio ist der grafische Strategiedesigner von Pipwerk. Mit ihm stellen Sie Handelsstrategien auf einer Zeichenfläche zusammen und bearbeiten sie.

Der derzeitige Stand: Sie legen Strategien an, bauen den Ablauf aus Elementen der Elementbibliothek auf, verbinden Schritte und Werte, stellen Bedingungen, Berechnungen und Regeln aus Bausteinen zusammen oder schreiben sie als Formel, ordnen Regeln zu, benennen und entfernen Objekte, prüfen, speichern, öffnen, schließen und löschen Strategien. Sprache und Objektverzeichnis stellen Sie in den Einstellungen ein. Eine gespeicherte Vorlage fügen Sie in eine Strategie ein. Vorlagen selbst lassen sich in der Oberfläche noch nicht anlegen, öffnen, ändern, speichern oder löschen (Abschnitt 10). Strategien werden nicht ausgeführt.

Wo Sie was finden:

| Sie wollen … | Abschnitt |
| --- | --- |
| pipwerk Studio öffnen | 2 |
| die Oberfläche kennenlernen | 3 |
| wissen, was „Stand“ und „Über pipwerk Studio“ bedeuten | 3.6 und 4 |
| Sprache oder Objektverzeichnis einstellen | 5 |
| eine neue Strategie beginnen | 6.1 |
| Elemente einfügen und verbinden, eine Verbindung löschen | 6.2 |
| Werte von Objekten verwenden, zwei Werte sich kreuzen lassen | 6.3 |
| Felder ausfüllen („Woher kommt der Wert?“) | 6.4 |
| Strategieparameter anlegen | 6.5 |
| Regeln zuordnen | 6.6 |
| Indikatoren, Trends und Regelwerke einstellen | 6.7 |
| Order- und Positionsverwaltung, Abschnitte | 6.2 und 3.4 |
| umbenennen oder entfernen | 6.8 |
| speichern, prüfen, schließen, öffnen oder löschen | 6.9 |
| eine gespeicherte Vorlage ansehen und einfügen | 6.10 |
| einen Ausdruck aus Bausteinen zusammenstellen oder als Formel schreiben und verstehen, was „leer“ und „nicht verfügbar“ bedeuten | 7 |
| einen Befund der Prüfung verstehen und beheben | 8 |
| alles ohne Ziehen bedienen, zum Beispiel auf einem Telefon | 9 |
| die Grenzen des jetzigen Stands kennen | 10 |
| einen Begriff nachschlagen | 11 |

## 2. pipwerk Studio öffnen

Eine Installation für Anwender gibt es noch nicht. pipwerk Studio wird derzeit mit einem Startskript auf einem Rechner gestartet und im Webbrowser geöffnet. Das Startskript legt die Startkonfiguration (eine Datei, die vor dem Start festlegt, wo die Datenbank liegt) selbst an. Ohne gültige Startkonfiguration bricht der Start mit einer Meldung ab; eine Ersatzdatenbank wird nicht angelegt.

Das Startskript liegt im Ordner `components/pipwerk-studio/scripts/` der Programmdateien und heißt `testenv`. Sie rufen es in einem Eingabefenster (Terminal) auf, das im obersten Ordner der Programmdateien geöffnet ist, also in dem Ordner, in dem auch die Datei `LICENSE` liegt. Sie können statt des Pfads `components/pipwerk-studio/scripts/testenv` auch den vollständigen Pfad des Skripts angeben, der mit `/` beginnt, und den Befehl aus jedem beliebigen Ordner aufrufen.

1. Starten: `components/pipwerk-studio/scripts/testenv start --frontend-port <Anschlussnummer der Oberfläche> --backend-port <Anschlussnummer des Servers>`. Beide Nummern wählen Sie selbst. Sie müssen frei sein und sich unterscheiden. Der Start dauert, weil die Oberfläche aufgebaut wird. Er endet erst, wenn pipwerk Studio antwortet.
2. Öffnen: Rufen Sie im Webbrowser die Adresse auf, die das Skript am Ende des Starts nennt (Meldung „pipwerk Studio is running: …“). Ohne `--host` ist das `http://127.0.0.1:<Anschlussnummer der Oberfläche>/`. `127.0.0.1` ist die Netzwerkadresse Ihres eigenen Rechners.
3. Abfragen: `components/pipwerk-studio/scripts/testenv status` nennt, ob pipwerk Studio läuft, und die Adressen von Oberfläche und Server.
4. Beenden: `components/pipwerk-studio/scripts/testenv stop` beendet pipwerk Studio und entfernt die Dateien dieses Starts, auch seine Datenbank. Damit geht die gespeicherte Sprache verloren: Nach einem erneuten Start ist wieder Deutsch eingestellt. Entfernt werden auch die gespeicherten Strategien und Vorlagen, solange das Objektverzeichnis unter `components/pipwerk-studio/.testenv/` liegt. Das ist nach dem Start der Fall. Haben Sie das Objektverzeichnis auf einen anderen Ordner geändert (Abschnitt 5), bleiben die Dateien dort erhalten.

Der Start bricht mit einer Meldung ab, wenn die Programmdateien nicht genau einem festgehaltenen Stand entsprechen, weil Sie eine Datei geändert oder eine neue Datei hinzugefügt haben, oder wenn das Skript nicht in einem versionierten Ordner der Programmdateien liegt. Die Meldung nennt die Ursache. In diesem Fall wurde nichts installiert, aufgebaut oder gestartet. Stellen Sie die Änderungen zurück oder halten Sie sie fest und starten Sie erneut. Der Start bricht ebenfalls ab, wenn pipwerk Studio schon läuft oder eine Anschlussnummer belegt ist.

**Zugriff von anderen Rechnern: Achtung, lesen Sie zuerst diesen Hinweis.** Ohne `--host` ist pipwerk Studio nur von Ihrem eigenen Rechner aus erreichbar. Mit `--host` kann jeder, der Ihren Rechner im Netz erreicht, pipwerk Studio benutzen und dessen Einstellungen, zum Beispiel die Sprache, ändern. Er kann außerdem Strategien und Vorlagen anlegen, ändern und löschen und das Objektverzeichnis ändern, in dem pipwerk Studio sie speichert. Mit dem Ändern des Objektverzeichnisses lassen sich Dateien auf Ihrem Rechner in einen anderen Ordner verschieben. Es gibt keine Anmeldung. Verwenden Sie `--host` deshalb nur in einem Netz, dem Sie vertrauen. Der vollständige Befehl lautet zum Beispiel: `components/pipwerk-studio/scripts/testenv start --frontend-port <Anschlussnummer der Oberfläche> --backend-port <Anschlussnummer des Servers> --host 0.0.0.0`. `0.0.0.0` bedeutet: alle Netzwerkadressen des Rechners. Auf Ihrem eigenen Rechner gilt weiter die Adresse, die das Skript nennt, bei `0.0.0.0` also `http://127.0.0.1:<Anschlussnummer der Oberfläche>/`. Andere Rechner verwenden statt `127.0.0.1` die Netzwerkadresse Ihres Rechners, also `http://<Netzwerkadresse des Rechners>:<Anschlussnummer der Oberfläche>/`. Die Netzwerkadresse müssen Sie selbst eingeben; ein Rechnername wie `mein-rechner` statt der Netzwerkadresse funktioniert nicht, pipwerk Studio weist die Anfrage ab. Geben Sie statt `0.0.0.0` eine einzelne Netzwerkadresse des Rechners an, ist pipwerk Studio nur unter dieser Adresse erreichbar, und das Skript nennt diese Adresse.

Wer pipwerk Studio weiterentwickelt, startet die beiden Teile von Hand und ändert Dateien bei laufendem Programm. Das beschreibt die technische Dokumentation `docs/technical/pipwerk-studio.md` im Abschnitt „Einrichtung und Start im Entwicklungsbetrieb“. Dort wirken Änderungen sofort. Deshalb entspricht der angezeigte Stand (Abschnitt 3.6 und 4) nicht notwendig dem laufenden Programm.

## 3. Aufbau der Oberfläche

Die Oberfläche besteht aus der Kopfzeile oben, dem Streifen der Strategieparameter, der Elementbibliothek, der Zeichenfläche, der Eigenschaftenansicht und der Fußzeile unten. Wie sie angeordnet sind, hängt von der Breite des Fensters ab:

| Breite des Fensters | Anordnung |
| --- | --- |
| ab 1100 Pixel | Elementbibliothek, Zeichenfläche und Eigenschaftenansicht liegen nebeneinander. |
| von 700 bis 1099 Pixel | Die Zeichenfläche steht neben einem Seitenbereich mit zwei Reitern, „Bibliothek“ und „Eigenschaften“. |
| unter 700 Pixel | Es steht ein Bereich nach dem anderen im Fenster. Unten wechseln Sie mit der Leiste „Fläche“, „Bibliothek“, „Eigenschaften“. Die Fenster, die eine Antwort verlangen, füllen die Breite. |

Bei geringer Höhe des Fensters werden Kopfzeile, Streifen der Strategieparameter und Fußzeile niedriger. Alles, was sich mit der Maus ziehen lässt, geht auch mit Klicks (Abschnitt 9). Deshalb lässt sich pipwerk Studio auch auf einem Telefon bedienen.

Nach „Neue Strategie“ und beim Start ohne geöffnete Strategie zeigt die Oberfläche in den schmalen Anordnungen (unter 1100 Pixel Breite) die Eigenschaftenansicht.

### 3.1 Kopfzeile

Links steht der Name „pipwerk Studio“, daneben das Menü: „Neue Strategie“, „Öffnen“, „Speichern“, „Prüfen“, „Schließen“, „Löschen“ und „Einstellungen“. Ab 1280 Pixel Breite stehen die Einträge einzeln da; darunter öffnet der Knopf „Menü“ eine Liste. Zeigen Sie mit dem Mauszeiger auf einen Eintrag, sagt eine kurze Erklärung, was er tut. Ohne geöffnete Strategie sind „Speichern“, „Prüfen“, „Schließen“ und „Löschen“ nicht wählbar.

Rechts zeigt ein Feld die Zahl der Befunde der letzten Prüfung („3 Befunde“; „keine Befunde“ in Grün; rot, sobald ein Fehler dabei ist, orange, wenn es nur Hinweise sind). Zeigen Sie darauf, nennt die Erklärung die Zahl der Fehler und der Hinweise. Ein Klick darauf öffnet die Eigenschaftenansicht der Strategie, und die Liste der Befunde ist danach zu sehen. Daneben steht die Schaltfläche „Über pipwerk Studio“ (Abschnitt 4).

### 3.2 Streifen der Strategieparameter

Unter der Kopfzeile steht links der Name der Strategie mit dem Zustand „ungespeichert“ oder „gespeichert“. Ein Klick darauf zeigt die Eigenschaftenansicht der Strategie. Rechts davon stehen die Strategieparameter, jeder mit Namen und Wert. Ein Strategieparameter ist ein Wert, den Sie an einer Stelle festlegen und überall in der Strategie verwenden (zum Beispiel die Zeiteinheit). Sind es mehr, als in eine Zeile passen, bricht der Streifen in weitere Zeilen um.

- „Neu“ legt einen Strategieparameter an. Sein Fenster öffnet sich gleich.
- Ein Klick auf einen Strategieparameter öffnet sein Fenster: „Name des Strategieparameters“, „Art des Werts“, „Wert“, der Schalter „Wert erst beim Start der Strategie festlegen“ und das Entfernen. „Fertig“ schließt das Fenster.
- Beim Umbenennen ändert sich überall sofort der Name; Formeln, die den Strategieparameter verwenden, zeigen den neuen Namen.
- Das Entfernen fragt zuerst und nennt die Elemente, die den Strategieparameter verwenden (Abschnitt 6.8).

### 3.3 Elementbibliothek

Die Bibliothek zeigt, was Sie in die Strategie einfügen können, in Gruppen:

| Gruppe | Inhalt |
| --- | --- |
| Ablaufsteuerung | „Kerzenschluss“, „Tick“, „Manuell“, „Bedingung“ und „Verbindung“ |
| Berechnung | „Berechnung“ |
| Indikatoren | „EMA“, „ATR“, „ZigZag“ und „eigener Indikator“ |
| Trends | „eigener Trend“ |
| Marktdaten | Instrument, Kerze und Tick |
| Konto | Konto |
| Aktionen | „Order aufgeben“, „Order ändern“, „Order löschen“, „Position ändern“, „Position schließen“ |
| Regeln und Regelwerke | „Risiko je Trade“, „eigene Regel“ und „eigenes Regelwerk“ |

„Tick“ steht zweimal: als Auslöser in der Ablaufsteuerung und als Objekt bei den Marktdaten. Eine Gruppe ohne Eintrag zeigt die Bibliothek nicht. Ein Klick auf den Namen einer Gruppe klappt sie zu und wieder auf. „Verbindung“ legt kein Element an. Sie verbinden damit zwei Schritte ohne Ziehen: Wählen Sie den Schritt, von dem es weitergeht, dann „Verbindung“ und dann den nächsten Schritt. Die Aufforderung dazu steht in der Eigenschaftenansicht, mit „Abbrechen“.

Das Suchfeld oben filtert die Einträge nach Namen und Erklärung. Findet es nichts, steht dort „Nichts gefunden. Versuchen Sie einen anderen Suchbegriff.“ Zeigen Sie mit dem Mauszeiger auf einen Eintrag oder wählen Sie ihn mit der Tabulatortaste, erscheint seine Erklärung. Lässt sich die Bibliothek nicht laden, steht dort „Die Elemente konnten nicht geladen werden. Ohne sie lässt sich keine Strategie anlegen oder öffnen.“ mit der Schaltfläche „Erneut versuchen“.

Ein Klick auf einen Eintrag fügt das Element hinter dem gewählten Schritt ein und verbindet es mit dessen nächstem freien Ausgang. Ist nichts gewählt, liegt es frei auf der Zeichenfläche. Ist der Rahmen einer Order- und Positionsverwaltung gewählt, gehört das Element zu dieser Order- und Positionsverwaltung. Sie können einen Eintrag auch auf die Zeichenfläche, auf einen Schritt (dahinter) oder in einen Rahmen (in diese Order- und Positionsverwaltung) ziehen. Eine Regel oder ein Regelwerk wird der Strategie zugeordnet, oder dem gewählten Element, wenn dieses Regeln zulässt (Abschnitt 6.6). Ohne geöffnete Strategie sagt eine Meldung: „Öffnen Sie zuerst eine Strategie oder legen Sie eine neue an.“

Eine gespeicherte Vorlage steht in der Gruppe ihres Objekttyps und trägt die Marke „eigene“. Eine Vorlage, deren Datei sich nicht lesen lässt, trägt die Marke „nicht lesbar“ und lässt sich nicht einfügen. Können die gespeicherten Vorlagen nicht gelesen werden, steht über der Liste „Die gespeicherten Vorlagen konnten nicht gelesen werden.“ (Abschnitt 6.10).

### 3.4 Zeichenfläche

Die Zeichenfläche zeigt die Strategie. Sie zeigt weder Hinweise noch Meldungen; die stehen nur in der Eigenschaftenansicht (Abschnitt 3.5). Was auf ihr zu sehen ist:

- Ein **Schritt** (Auslöser, Bedingung, Berechnung, Order …) ist ein Kasten mit dem Namen, einem Satz, der sagt, was er tut, und seinen Ausgängen. Eine Bedingung hat die Ausgänge „wahr“ und „falsch“, die meisten anderen Schritte „weiter“. Die Linie von einem Ausgang zum nächsten Schritt bedeutet „danach folgt“.
- Eine **Karte** zeigt ein Objekt (Indikator, Trend, Kerze …). Sie liegt neben dem Schritt, der das Objekt zuerst verwendet, bei senkrechtem Ablauf links davon, bei waagerechtem darüber. Einen eigenen Bereich für Objekte gibt es nicht. Jede Zeile der Karte ist ein Wert oder eine Methode des Objekts, mit dem Namen und einem Anschlusspunkt; dahinter steht die Art des Werts, bei einer Methode das Wort „Methode“. Sichtbar sind die Zeilen, die ein Schritt verwendet, bei einem Objekt, das noch niemand verwendet, die ersten drei. „alle … Eigenschaften“ unten an der Karte klappt die übrigen auf, „weniger Eigenschaften“ klappt sie wieder zu. Ein Objekt, das noch kein Schritt verwendet, liegt dort, wo Sie es abgelegt haben, oder neben dem Ablauf. Von einer Zeile aus lässt sich ein Wert mit einem Schritt verbinden (Abschnitt 6.3).
- Der **Rahmen** „Order- und Positionsverwaltung · Order aufgeben“ hängt unter dem Schritt „Order aufgeben“. In ihm läuft die Order- und Positionsverwaltung: zuerst für die wartende Order, nach der Ausführung für die Position. Der Knopf am Titel klappt den Rahmen ein und aus.
- Ein **Abschnitt** fasst zusammengehörige Schritte eines Ablaufs unter einem Namen zusammen. Ausgeklappt liegt ein Kasten um die Schritte; links oben steht der Knopf zum Einklappen und der Name des Abschnitts, den Sie dort ändern können. Eingeklappt bleibt ein einziger Kasten übrig, mit dem Namen fett und darunter der Zahl der Schritte („3 Schritte“); der Knopf an seinem Rand klappt ihn wieder aus. Die Linien der Verbindungen bleiben sichtbar.
- **Wertlinien** zeigen, welche Werte von Objekten ein Schritt verwendet. Die Linie von der Karte zu dem Schritt, der das Objekt zuerst verwendet, ist durchgezogen, hat die Farbe des Objekts und ist immer zu sehen. Verwendet ein weiterer Schritt das Objekt, führt eine gestrichelte Linie in derselben Farbe dorthin, auch wenn nur eine Formel den Wert verwendet. Mehrere Werte desselben Objekts für denselben Schritt sind eine Linie. Ihre Beschriftung nennt die Werte, bei einer Methode mit ihren Argumenten, zum Beispiel „Mittel(3; 0,5)“; steht dahinter das Zeichen ↻, wird der Wert dort mit „Aktualisieren“ neu ermittelt. Die Linien enden an einem einzigen Anschlusspunkt des Schritts, auf der Seite, an der die Karten liegen. Ergebnisse von Bedingungen und Berechnungen und Objekte der Anwendung (zum Beispiel „Order“) haben keine Linie.

Die **Legende** unten auf der Zeichenfläche (Knopf „Legende“) erklärt die Linien:

| Linie | Bedeutung |
| --- | --- |
| durchgezogen mit Pfeil | „Ablauf: legt die Reihenfolge fest“ |
| grün, gepunktet | „Order- und Positionsverwaltung einer Order“ |
| farbig, durchgezogen | „Wert an dem Element, das ihn zuerst verwendet“ |
| farbig, gestrichelt | „Wert an einer weiteren Verwendung“ |
| das Zeichen ↻ | „Aktualisieren: Der Wert wird hier neu ermittelt“ |

Die Werkzeugleiste enthält „Ausrichtung“ (senkrecht oder waagerecht; die Wahl gehört zur Strategie), „Weitere Verwendungen“ (Alle, Auswahl, Aus), Vergrößern und Verkleinern, „Alles zeigen“, „Zum Anfang“ und „Neu anordnen“ (alle Schritte und Karten wieder automatisch anordnen). „Weitere Verwendungen“ steuert nur die gestrichelten Linien: „Alle“ zeigt sie für alle Schritte, „Auswahl“ nur für den gewählten Schritt oder das gewählte Objekt, „Aus“ keine. Die Linie zum Schritt der ersten Verwendung bleibt immer. Am Anfang steht „Auswahl“, weil „Alle“ bei vielen Verwendungen lange Linien quer über die Fläche legt. Ein Schritt oder eine Karte, die Sie verschieben, behält den Platz; alle anderen ordnet pipwerk Studio selbst, mit möglichst wenigen sich schneidenden Linien und mit kurzen Linien. Die Ansicht springt dabei nicht; sie ändert sich nur beim Öffnen, bei „Alles zeigen“ und „Zum Anfang“ und so weit, wie nötig ist, um ein neues Element zu zeigen, das außerhalb der Ansicht liegt.

Ein rot umrandeter Schritt hat einen Fehler, ein orange umrandeter einen Hinweis der Prüfung (Abschnitt 8). Ein Schritt mit einer Art, die diese Fassung nicht kennt, ist rot und zeigt den Namen seiner Art; seine Angaben bleiben beim Speichern unverändert.

### 3.5 Eigenschaftenansicht

Die Eigenschaftenansicht zeigt, was Sie auf der Zeichenfläche gewählt haben. Ein Klick auf eine freie Stelle der Zeichenfläche oder auf den Namen der Strategie zeigt die Strategie.

**Hinweise und Meldungen stehen nur hier**, nie auf der Zeichenfläche:

- Ohne geöffnete Strategie steht hier „Keine Strategie geöffnet“ mit dem nächsten Schritt: „Neue Strategie“ legt eine leere Strategie an, „Öffnen“ zeigt gespeicherte Strategien.
- Bei einer leeren Strategie steht oberhalb der Felder der Strategie der Hinweis „Die Strategie ist leer“: Beginnen Sie mit einem Auslöser. Das ist das Ereignis, das die Strategie startet, zum Beispiel ein Kerzenschluss. Sie finden ihn in der Elementbibliothek in der Gruppe „Ablaufsteuerung“. In einem Fenster unter 1100 Pixel Breite steht dort auch die Schaltfläche „Elementbibliothek zeigen“.
- Ist der Rahmen einer Order- und Positionsverwaltung ohne Schritte gewählt, steht der Hinweis dazu in der Ansicht des Rahmens: Fügen Sie zuerst einen Auslöser ein; weitere Schritte hängen sich daran.
- Kurze Meldungen („Das Element gehört jetzt zur Order- und Positionsverwaltung dieser Order.“) stehen oben in dieser Ansicht und verschwinden nach einigen Sekunden. In einem Fenster unter 1100 Pixel Breite kann die Eigenschaftenansicht verdeckt sein, weil die Bibliothek oder die Zeichenfläche zu sehen ist. Wartet dann eine Meldung, ist der Reiter „Eigenschaften“ (unter 700 Pixel die Schaltfläche in der Leiste) markiert.
- Fenster wie „Öffnen“, „Einstellungen“, „Über pipwerk Studio“, die Rückfragen und die Fehlermeldungen, die Sie bestätigen müssen, erscheinen über der Oberfläche und sperren sie, bis Sie antworten.

Was die Eigenschaftenansicht für die einzelnen Auswahlen zeigt:

- **Strategie:** Name, Beschreibung, „Regeln der Strategie“, „Objekte der Anwendung“ (Order, Position und Strategie, die nicht auf der Zeichenfläche liegen, jeweils mit ihren Werten, der Art des Werts, möglichen Werten und einer Beschreibung), die „Befunde der Prüfung“ mit „Prüfen“.
- **Schritt:** Name, die Einstellungen des Schritts (Abschnitt 6.4), bei „Order aufgeben“ die „Eigenschaften der Order“, „Liefert“ (was der Schritt für andere bereitstellt, zum Beispiel das Ergebnis einer Berechnung), „Verwendete Werte“ (die Werte von Objekten, die der Schritt verwendet, Abschnitt 6.3), „Regeln dieses Elements“, „Abschnitt“, „Gehört zu“ (Hauptablauf oder Order- und Positionsverwaltung einer Order) und „Entfernen“.
- **Objekt:** Name, Herkunft (zum Beispiel „EMA 20, aus Objekttyp EMA“), die Einstellungen des Objekts, „Liefert“ (jeder Wert und jede Methode mit Namen, Art des Werts, möglichen Werten und einer Beschreibung, die immer zu sehen ist, bei einer Methode mit ihren Argumenten), „Element der ersten Verwendung“ (Abschnitt 6.3) und „Entfernen“. Ein eigener Indikator, ein eigener Trend und ein Regelwerk haben dazu ihren „Inhalt“ (Abschnitt 6.7).
- **Rahmen** einer Order- und Positionsverwaltung: was sie ist und was Sie damit tun können.
- **Abschnitt:** sein Name, die Zahl und die Namen seiner Schritte, ein Knopf zum Ein- und Ausklappen und „Abschnitt auflösen“.
- **Verbindung:** Sie wählen eine Verbindung, indem Sie die Linie anklicken. Die Ansicht nennt, von welchem Schritt und welchem Ausgang sie zu welchem Schritt führt, und bietet „Verbindung löschen“ an (Abschnitt 6.2).

Zu jedem Feld gehört eine Erklärung: Zeigen Sie auf die Beschriftung oder auf das Symbol „i“. Sie sagt, was das Feld bedeutet und wozu Sie es brauchen, und endet mit der Art des Werts, der gefragt ist („Gefragt ist: ganze Zahl.“). Ein Feld mit einem Befund trägt dessen Farbe.

### 3.6 Fußzeile

Unten steht die Fußzeile. Sie zeigt links, ob pipwerk Studio seinen Server erreicht, und rechts daneben den Stand, aus dem pipwerk Studio läuft. Der Server ist der Teil von pipwerk Studio, der außerhalb des Browsers auf dem Rechner läuft und zum Beispiel die Sprache und die Strategien speichert.

| Anzeige | Bedeutung |
| --- | --- |
| „Verbindung zum Server: wird geprüft“ (Englisch: „Connection to the server: being checked“) | pipwerk Studio fragt gerade beim Server an. |
| „Verbindung zum Server: hergestellt“ (Englisch: „Connection to the server: established“) | Der Server hat geantwortet. pipwerk Studio ist bereit. |
| „Verbindung zum Server: nicht möglich“ (Englisch: „Connection to the server: not possible“) | Der Server hat nicht oder nicht richtig geantwortet. In diesem Fall muss geprüft werden, ob er gestartet ist. Danach laden Sie die Seite im Browser neu. |

Der Stand sagt, welche Fassung des Programms läuft. Er ist eine Zeichenfolge aus Ziffern und Buchstaben und keine Versionsnummer; in der Fußzeile stehen ihre ersten sieben Zeichen. Zwei Rechner mit demselben Stand haben dasselbe Programm. Die Bezeichnung folgt der gewählten Sprache.

| Anzeige | Bedeutung |
| --- | --- |
| „Stand: <Zeichen>“ (Deutsch), „Revision: <Zeichen>“ (Englisch) | pipwerk Studio läuft aus der Fassung, deren Zeichenfolge mit diesen sieben Zeichen beginnt. |
| „Stand: unbekannt“ (Deutsch), „Revision: unknown“ (Englisch) | Der Stand lässt sich nicht ermitteln, zum Beispiel weil pipwerk Studio aus einem Ordner gestartet wurde, der nicht versioniert ist. Dasselbe wird kurz angezeigt, solange die Anfrage läuft, und wenn sie fehlschlägt. pipwerk Studio arbeitet unabhängig davon normal. |

Zeigen Sie mit dem Mauszeiger auf die Standanzeige, erscheint ein kleines Hinweisfenster mit der vollständigen Zeichenfolge (40 Zeichen) und dem Datum dieses Stands. Auf Deutsch lautet es „Stand <Zeichenfolge> vom TT.MM.JJJJ, hh:mm Uhr“, auf Englisch „Revision <Zeichenfolge> from YYYY-MM-DD hh:mm“. Die Uhrzeit steht im 24-Stunden-Format in der Ortszeit Ihres Browsers. Das Datum ist das Datum der Fassung, nicht der Zeitpunkt, an dem pipwerk Studio aufgebaut oder gestartet wurde. Lässt sich nur das Datum nicht ermitteln, lautet das Hinweisfenster „Stand <Zeichenfolge>“ (Englisch: „Revision <Zeichenfolge>“). Es wechselt mit der Sprache. Ein Bildschirmleser liest denselben Text als Beschreibung der Standanzeige vor. Lässt sich der Stand nicht ermitteln, gibt es kein Hinweisfenster.

Der Stand wird einmal beim Start von pipwerk Studio ermittelt. Wechselt die Fassung der Programmdateien danach, zeigt ein weiterlaufendes pipwerk Studio weiter den Stand beim Start; nach einem Neustart zeigt es den neuen Stand.

## 4. Dialog „Über pipwerk Studio“

Der Dialog nennt den Namen von pipwerk Studio, den genauen Stand, die Lizenz und die Adresse des Quelltexts.

### Öffnen und Schließen

Öffnen: Klicken Sie in der Kopfzeile auf die Schaltfläche „Über pipwerk Studio“ rechts neben dem Menü. Mit der Tastatur erreichen Sie die Schaltfläche mit der Tabulatortaste und öffnen den Dialog mit der Eingabetaste.

Schließen: Klicken Sie im Dialog auf „Schließen“ oder drücken Sie die Escape-Taste. Ein Klick neben den Dialog schließt ihn nicht. Beim Öffnen ist „Schließen“ ausgewählt; nach dem Schließen ist wieder die Schaltfläche „Über pipwerk Studio“ ausgewählt. Solange der Dialog offen ist, ist die übrige Oberfläche gesperrt: Sie können weder mit der Maus noch mit der Tastatur das Menü oder die Schaltfläche in der Kopfzeile bedienen. Mit der Tabulatortaste wandert die Auswahl nur zwischen den Bedienelementen des Dialogs (Lizenzfeld, Verweis, „Schließen“); vom letzten Element geht sie mit der Tabulatortaste zum ersten, vom ersten mit Umschalt+Tabulatortaste zum letzten.

### Inhalt

| Bestandteil | Inhalt |
| --- | --- |
| Überschrift | „Über pipwerk Studio“ (Englisch: „About pipwerk Studio“) |
| Name | „pipwerk Studio“, in beiden Sprachen gleich |
| Stand (Englisch: „Revision“) | die vollständige Zeichenfolge mit 40 Zeichen, dazu Datum und Uhrzeit des Stands |
| Lizenz (Englisch: „License“) | der Name „GNU General Public License, Version 3“ und darunter der vollständige Text der Lizenz |
| Quelltext (Englisch: „Source code“) | die Adresse https://github.com/macodix/pipwerk als Verweis, unter der die Dateien von Pipwerk liegen |
| Schaltfläche | „Schließen“ (Englisch: „Close“) |

Der Text der Lizenz steht im englischen Original und wird nicht übersetzt. Er ist lang und hat ein eigenes Feld mit Bildlaufleiste, das Lizenzfeld. Sie können es mit der Tabulatortaste erreichen und mit den Pfeiltasten verschieben.

### Stand

Der Stand wird so angezeigt:

| Sprache | Anzeige | Beispiel |
| --- | --- | --- |
| Deutsch | „<Zeichenfolge> vom TT.MM.JJJJ, hh:mm Uhr“ | „0123456789abcdef0123456789abcdef01234567 vom 09.10.2026, 14:52 Uhr“ |
| Englisch | „<Zeichenfolge> from YYYY-MM-DD hh:mm“ | „0123456789abcdef0123456789abcdef01234567 from 2026-10-09 14:52“ |

Die Uhrzeit steht im 24-Stunden-Format in der Ortszeit Ihres Browsers. Das Datum ist das Datum des Stands, nicht der Zeitpunkt, an dem pipwerk Studio aufgebaut oder gestartet wurde. Der Dialog nennt den Stand, der beim Aufbau der Oberfläche vorlag.

„unbekannt“ (Englisch: „unknown“) steht anstelle des Stands, wenn sich Zeichenfolge oder Datum beim Aufbau nicht ermitteln ließen, zum Beispiel weil pipwerk Studio aus einem Ordner aufgebaut wurde, der nicht versioniert ist. Eine Zeichenfolge ohne Datum zeigt der Dialog nicht. Auch bei der Adresse des Quelltexts steht „unbekannt“, wenn die Adresse im Programm ungültig ist; dann gibt es keinen Verweis. pipwerk Studio arbeitet in beiden Fällen normal.

Wenn pipwerk Studio mit dem Startskript gestartet wurde (Abschnitt 2), ist der Stand im Dialog genau der Stand, aus dem es läuft. Dialog und Fußzeile nennen dann dieselbe Zeichenfolge: der Dialog vollständig und mit Datum, die Fußzeile in der Kurzform.

Beim Start von Hand (Abschnitt 2, letzter Absatz) kann der Stand vom laufenden Programm abweichen, weil dort auch Änderungen wirken, die nicht festgehalten sind. Dafür gilt:

1. Der Dialog nennt den Stand, der beim letzten Start der Oberfläche vorlag. Die Fußzeile nennt den Stand beim Start des Servers.
2. Nach einem Wechsel des Stands oder bei nicht festgehaltenen Änderungen können beide Angaben von dem Programm abweichen, das tatsächlich läuft, und voneinander abweichen.
3. Nach einem Neustart von Oberfläche und Server nennen beide den Stand, der dann vorliegt. Nicht festgehaltene Änderungen gehören zu keinem Stand. Das laufende Programm weicht deshalb auch nach dem Neustart vom angezeigten Stand ab, bis Sie die Änderungen festgehalten oder zurückgenommen und beide Teile erneut gestartet haben.

### Internetverbindung

Die Anzeige im Dialog braucht keine Internetverbindung: Name, Stand, Lizenztext und die Adresse sind in pipwerk Studio selbst enthalten. Eine Internetverbindung brauchen Sie nur, wenn Sie den Verweis auf den Quelltext öffnen. Der Verweis öffnet die Seite in einem neuen Tab des Browsers.

### Sprachwechsel bei offenem Dialog

Die Texte des Dialogs (Überschrift, Bezeichnungen, Anzeige des Stands, „Schließen“) folgen der Sprache der Oberfläche. Die Einstellungen sind bei offenem Dialog gesperrt. Ändert sich die Sprache trotzdem, weil pipwerk Studio eine in einem anderen Browserfenster geänderte Sprache vom Server neu liest, wechseln die Texte des offenen Dialogs sofort. Der Dialog bleibt offen, und die Auswahl bleibt, wo sie ist. Name, Lizenz und Adresse bleiben unverändert, weil sie nicht übersetzt werden.

## 5. Einstellungen: Sprache und Objektverzeichnis

Die Einstellungen öffnen Sie mit „Einstellungen“ beziehungsweise „Settings“ im Menü der Kopfzeile. Es öffnet sich ein Dialog mit der Sprache und dem Objektverzeichnis. Eine geöffnete Strategie bleibt dabei unverändert geöffnet. Der Dialog wird mit „Schließen“ beziehungsweise „Close“ geschlossen.

### Sprache wechseln

pipwerk Studio kann auf Deutsch und auf Englisch angezeigt werden. Ohne zuvor gespeicherte Auswahl ist beim Öffnen Deutsch eingestellt.

So wird die Sprache gewechselt:

1. Klicken Sie in der Kopfzeile im Menü auf „Einstellungen“ beziehungsweise „Settings“. Es öffnet sich der Dialog der Einstellungen.
2. Wählen Sie im Auswahlfeld neben „Sprache“ beziehungsweise „Language“ „English“ für Englisch oder „Deutsch“ für Deutsch.
3. Schließen Sie den Dialog mit „Schließen“ beziehungsweise „Close“. Eine geöffnete Strategie bleibt dabei unverändert geöffnet.

### Objektverzeichnis ändern

Das Objektverzeichnis ist der Ordner auf dem Rechner, in dem pipwerk Studio die Strategien und Vorlagen als Dateien ablegt. Jede Strategie und jede Vorlage ist eine Datei; die Dateien sind die einzige Quelle der Strategien und Vorlagen. Der Dialog der Einstellungen zeigt unter „Objektverzeichnis“, ob das Standardverzeichnis gilt („Es gilt das Standardverzeichnis.“) oder ein von Ihnen festgelegtes Verzeichnis („Das Verzeichnis wurde festgelegt.“), und im Feld „Verzeichnis (vollständiger Pfad)“ den Pfad.

So ändern Sie das Objektverzeichnis:

1. Öffnen Sie die Einstellungen.
2. Tragen Sie im Feld „Verzeichnis (vollständiger Pfad)“ den vollständigen Pfad des neuen Verzeichnisses ein. Ein vollständiger Pfad beginnt mit `/` und nennt alle Ordner von der obersten Ebene des Rechners an.
3. Wählen Sie „Verzeichnis ändern“. pipwerk Studio fragt „Dateien verschieben?“.
4. Wählen Sie die Antwort:
   - „Ja, Dateien verschieben“: Alle vorhandenen Dateien werden in das neue Verzeichnis verschoben. Die Strategien stehen danach weiter in der Liste von „Öffnen“.
   - „Nein, nur das Verzeichnis ändern“: Es wird nur die Einstellung geändert. Die Dateien bleiben im alten Verzeichnis. Die Strategien aus dem alten Verzeichnis stehen danach nicht mehr in der Liste von „Öffnen“; sie erscheinen wieder, wenn Sie das alte Verzeichnis einstellen.
   - „Abbrechen“: Alles bleibt, wie es war; im Feld steht wieder das gespeicherte Verzeichnis.
5. Bei Erfolg steht im Dialog „Das Objektverzeichnis wurde geändert.“ Scheitert die Änderung, zum Beispiel weil im neuen Verzeichnis schon Dateien mit denselben Namen liegen oder der Pfad nicht vollständig ist, steht im Dialog „Das Objektverzeichnis konnte nicht geändert werden.“ mit der Ursache. Die Einstellung bleibt dann, wie sie war. Ist beim Verschieben etwas schiefgegangen, nennt die Meldung das alte Verzeichnis und das neue Verzeichnis, in dem die Dateien liegen, die nicht zurückgeholt werden konnten.

Nach einer gelungenen Änderung, mit und ohne Verschieben, zeigen die gespeicherten Vorlagen in der Elementbibliothek und die Liste von „Öffnen“ die Dateien des neuen Verzeichnisses. Eine geöffnete Strategie bleibt geöffnet. Sie wird beim nächsten „Speichern“ im neuen Verzeichnis abgelegt, auch wenn die Dateien nicht verschoben wurden.

Wurde pipwerk Studio mit dem Startskript gestartet, gilt: `components/pipwerk-studio/scripts/testenv stop` entfernt die gespeicherten Strategien und Vorlagen nur, solange das Objektverzeichnis unter `components/pipwerk-studio/.testenv/` liegt. Nach einer Änderung auf einen anderen Ordner bleiben die Dateien dort erhalten; Sie entfernen sie selbst (Abschnitt 2).

### Sprache: Wirkung, Speicherung und Fehlermeldungen

Alle Texte der Oberfläche erscheinen sofort in der gewählten Sprache. Der Name „pipwerk Studio“ bleibt unverändert. Selbst vergebene Namen, frei eingegebene Texte, Strategieinhalte und andere fachliche Einstellungen werden durch den Sprachwechsel nicht übersetzt oder verändert.

Die Auswahl wird zentral im Server für pipwerk Studio gespeichert. Sie bleibt nach einem Neuladen der Browserseite erhalten und nach einem Neustart von pipwerk Studio, das von Hand gestartet wurde. Wurde pipwerk Studio mit dem Startskript gestartet, gilt das nur für ein Neuladen der Browserseite: Das Beenden mit `testenv stop` entfernt die Datenbank und damit die gespeicherte Sprache, und nach einem erneuten Start ist wieder Deutsch eingestellt (Abschnitt 2). Die Sprache gilt für pipwerk Studio insgesamt, nicht pro Benutzer; Benutzerkonten oder Anmeldungen gibt es in diesem Stand nicht. Die Auswahl wird nicht im Browser gespeichert.

Das Auswahlfeld ist gesperrt, solange die gespeicherte Sprache gelesen wird (beim Öffnen und bei einem erneuten Lesen im Hintergrund, solange noch keine Sprache bestätigt ist) und solange eine Änderung gespeichert wird. Beim Speichern zeigen Auswahlfeld und Texte bereits die neu gewählte Sprache. Antwortet der Server nicht innerhalb von 10 Sekunden, gilt das Lesen beziehungsweise Speichern als fehlgeschlagen, und es erscheint die entsprechende Fehlermeldung. Das gilt auch, wenn der Browser meldet, dass keine Internetverbindung besteht: Der Server läuft auf dem eigenen Rechner, und Anfragen an ihn werden trotzdem gesendet. Es gibt drei Fehlermeldungen:

| Meldung | Bedeutung |
| --- | --- |
| „Die gespeicherte Sprache konnte nicht gelesen werden. Es wird die Standardsprache Deutsch angezeigt.“ | Beim Öffnen konnte die gespeicherte Sprache nicht vom Server gelesen werden. pipwerk Studio zeigt Deutsch an. Die Auswahl bleibt bedienbar. Wird im Hintergrund erneut gelesen (zum Beispiel nach einem Wechsel zurück ins Browserfenster), ist sie währenddessen kurz gesperrt, und die Meldung verschwindet, bis das Lesen erneut fehlschlägt. Prüfen Sie, ob der Server läuft, und laden Sie die Seite neu. Ist die Sprache beim Öffnen bereits gelesen worden, erscheint diese Meldung später nicht mehr: Schlägt ein erneutes Lesen im Hintergrund fehl, bleibt die zuletzt bestätigte Sprache angezeigt. |
| „Die Sprache konnte nicht gespeichert werden. Die zuletzt bestätigte Sprache bleibt aktiv.“ | Eine Änderung wurde nicht gespeichert. pipwerk Studio zeigt wieder die zuletzt bestätigte Sprache an. Prüfen Sie den Server und versuchen Sie es erneut. |
| „Die Sprache konnte nicht gespeichert werden. Es wird die Standardsprache Deutsch angezeigt, weil die gespeicherte Sprache nicht gelesen werden konnte.“ | Beim Öffnen konnte die gespeicherte Sprache nicht gelesen werden, und die Änderung ließ sich ebenfalls nicht speichern. Es gibt keine bestätigte Sprache; pipwerk Studio zeigt Deutsch an. Prüfen Sie den Server und versuchen Sie es erneut. |

Wird die Sprache später erfolgreich gelesen oder eine Änderung erfolgreich gespeichert, verschwinden Meldungen, die darauf beruhten, dass keine Sprache bestätigt war.

## 6. Arbeitsabläufe

Dieser Abschnitt beschreibt die Arbeitsabläufe der Reihe nach. Die Einstellungen beschreibt Abschnitt 5, die Schreibweise der Formeln Abschnitt 7.

### 6.1 Eine Strategie anlegen

1. Wählen Sie im Menü „Neue Strategie“. Hat die geöffnete Strategie ungespeicherte Änderungen, fragt pipwerk Studio vorher (Abschnitt 6.9).
2. Die Zeichenfläche ist leer. Die Eigenschaftenansicht zeigt die Strategie mit dem Hinweis „Die Strategie ist leer“. Einen geführten Aufbau gibt es nicht; Sie bauen den Ablauf selbst auf.
3. Tragen Sie in der Eigenschaftenansicht der Strategie den Namen und die Beschreibung ein. Die Eigenschaftenansicht der Strategie öffnen Sie jederzeit mit einem Klick auf den Namen im Streifen der Strategieparameter oder auf eine freie Stelle der Zeichenfläche. Eine neue Strategie heißt „Neue Strategie“, mit angehängter Zahl, wenn der Name schon vergeben ist.
4. Beginnen Sie den Ablauf mit einem Auslöser aus der Gruppe „Ablaufsteuerung“ der Elementbibliothek (Abschnitt 6.2). Ein Auslöser ist das Ereignis, das die Strategie startet, zum Beispiel ein Kerzenschluss.
5. Gespeichert wird erst mit „Speichern“.

Eine neue, leere Strategie hat nur den Hinweis „Hauptablauf ohne Auslöser: Die Strategie startet nie …“; er verschwindet, sobald Sie einen Auslöser mit dem ersten Schritt verbunden haben (Abschnitt 8).

### 6.2 Elemente einfügen und verbinden

1. Klicken Sie in der Elementbibliothek einen Eintrag an. Er wird hinter dem gewählten Schritt eingefügt und mit dessen nächstem freien Ausgang verbunden. Die Eigenschaftenansicht zeigt das neue Element, und Sie können es gleich benennen. Jedes Element bekommt einen Namen, zum Beispiel „Bedingung“, bei einem Namen, den es schon gibt, mit Zahl: „Bedingung 2“.
2. Ein Schritt hat Ausgänge. Eine Bedingung hat „wahr“ und „falsch“; die ersten freien Ausgänge füllt das Einfügen der Reihe nach. Wollen Sie einen anderen Ausgang verbinden, klicken Sie den Ausgang an (eine Meldung in der Eigenschaftenansicht fordert Sie auf, den nächsten Schritt zu wählen) und dann den Schritt, der folgen soll. Oder wählen Sie den Schritt, dann in der Elementbibliothek „Verbindung“ und dann den nächsten Schritt. Oder ziehen Sie vom Ausgang auf den Schritt.
3. Ein Ausgang hat höchstens eine Verbindung. Verbinden Sie ihn neu, ersetzt die neue die alte.
4. **Eine Verbindung löschen:** Klicken Sie die Linie der Verbindung an. Die Eigenschaftenansicht zeigt dann die Verbindung („Von … zu …“) und die Schaltfläche „Verbindung löschen“. Ein Klick darauf löscht die Verbindung; beide Schritte bleiben. Auf einem schmalen Bildschirm wechseln Sie nach dem Klick auf die Linie mit „Eigenschaften“ in die Eigenschaftenansicht.
5. Nicht erlaubt ist: ein Auslöser als Ziel (er hat keinen Eingang), ein Schritt mit sich selbst, ein Objekt im Ablauf und eine Verbindung zwischen dem Hauptablauf und der Order- und Positionsverwaltung einer Order. pipwerk Studio sagt es mit einer kurzen Meldung.

**Order- und Positionsverwaltung.** Unter „Order aufgeben“ hängt der Rahmen „Order- und Positionsverwaltung · Order aufgeben“. Er gilt für jede gestellte Order einzeln: zuerst für die wartende Order, nach der Ausführung für die Position. Klicken Sie den Titel des Rahmens an, gehört alles, was Sie jetzt einfügen, zu dieser Order- und Positionsverwaltung. Hat sie keinen eigenen Auslöser, wird der erste eingefügte Schritt mit dem Ausgang „gestellt“ der Order verbunden; wollen Sie ihn von Hand verbinden, klicken oder ziehen Sie vom Ausgang „gestellt“ auf ihren ersten Schritt. Fügen Sie einen Auslöser in die Order- und Positionsverwaltung ein, entfällt diese Verbindung. Ein Schritt wechselt die Order- und Positionsverwaltung, indem Sie ihn in den Rahmen ziehen (oder heraus) oder in seiner Eigenschaftenansicht unter „Gehört zu“ „Hauptablauf“ oder die Order- und Positionsverwaltung einer Order wählen. Verbindungen, die dadurch zwischen dem Hauptablauf und einer Order- und Positionsverwaltung lägen, entfernt pipwerk Studio. Der Titel des Rahmens hat einen Knopf, der den Rahmen ein- und ausklappt; die Schritte bleiben dabei erhalten. „Manuell“ als Auslöser gehört nur in den Hauptablauf; in einer Order- und Positionsverwaltung wird er nie ausgelöst, und die Prüfung meldet es.

**Abschnitte.** Unter „Abschnitt“ in der Eigenschaftenansicht eines Schritts ordnen Sie ihn einem Abschnitt zu oder bilden mit „+ Neuen Abschnitt bilden …“ einen neuen: Sie tragen den Namen ein und wählen „Bilden“. Ein Abschnitt lässt sich auf der Zeichenfläche ein- und ausklappen (Aussehen: Abschnitt 3.4). „Abschnitt auflösen“ in der Eigenschaftenansicht des Abschnitts löst ihn auf, die Schritte bleiben. Ein Schritt gehört höchstens zu einem Abschnitt, und zwar zu einem Abschnitt seines eigenen Ablaufs (Hauptablauf oder Order- und Positionsverwaltung). Ein Abschnitt ändert nicht, was die Strategie tut.

### 6.3 Werte von Objekten verwenden

Indikatoren, Trends und die Objekte des Marktes liegen als Karten neben dem Schritt, der sie zuerst verwendet (Abschnitt 3.4). Jede Zeile einer Karte ist ein Wert oder eine Methode, die das Objekt liefert. Damit ein Schritt einen Wert verwenden kann, ist der Wert ein **Eingang** des Schritts. Einen Eingang legen Sie auf vier Wegen an:

- Sie wählen den Wert in den Bausteinen einer Formel (Abschnitt 7.4). Der Eingang entsteht von selbst, bei einer Methode mit den Werten ihrer Argumente.
- Sie ziehen auf der Zeichenfläche eine Linie vom Anschlusspunkt der Zeile einer Karte auf den Schritt.
- Sie klicken den Anschlusspunkt der Zeile an und dann den Schritt. Die Aufforderung „Wählen Sie jetzt das Element, das den Wert verwenden soll.“ steht in der Eigenschaftenansicht, mit „Abbrechen“.
- Sie wählen in der Eigenschaftenansicht des Schritts unter „Verwendete Werte“ ein Objekt und einen seiner Werte und klicken „Verbinden“ (siehe unten). Das geht ohne Ziehen.

**Welche Objekte an einer Stelle zur Wahl stehen.** Ein Objekt ermittelt seine Werte an dem Schritt, der es zuerst verwendet (dem **Element der ersten Verwendung**). Spätere Schritte erhalten diese Werte, aber nur, wenn jeder Weg zu ihnen über das Element der ersten Verwendung führt. Beim Ziehen, beim Klick, in den Bausteinen, in der Formelansicht und unter „Verwendete Werte“ stehen deshalb nur die Objekte zur Wahl, die an dem Schritt verwendbar sind. Im Zweig „falsch“ einer Bedingung steht kein Objekt zur Wahl, das erst im Zweig „wahr“ ermittelt wird. Ein Objekt, das zuerst in einer Order- und Positionsverwaltung verwendet wird, steht dem Hauptablauf und den anderen Order- und Positionsverwaltungen nicht zur Wahl. Die anderen Schritte erscheinen beim Verbinden blass mit gestricheltem Rand; ein Klick darauf verbindet nichts und sagt in der Meldung, an welchem Schritt der Wert zuerst ermittelt wird („Hier nicht verwendbar: Der Wert wird zuerst an einem anderen Element ermittelt.“). Brauchen Sie die Werte an so einer Stelle, legen Sie ein weiteres Objekt mit eigenem Namen an und verwenden Sie dieses dort; zwei Objekte sind zwei getrennte Verwendungen. Verbinden Sie ein Objekt, das noch kein Schritt verwendet, wird dieser Schritt das Element der ersten Verwendung: Die Karte rückt neben ihn, und die Linie ist durchgezogen. Das gilt auch, wenn Sie den Wert in den Bausteinen wählen oder unter „Verwendete Werte“ verbinden. Eine Karte nehmen die Linien nicht an.

**Verwendete Werte.** In der Eigenschaftenansicht eines Schritts steht unter „Verwendete Werte“ je Objekt eine Gruppe mit den Werten, die der Schritt verwendet: die Eingänge und die Werte, die eine Formel des Schritts oder einer seiner Regeln nennt.

- Pro Wert wählen Sie in einer Liste die **Eigenschaft oder Methode** des Objekts. Bei einer Methode erscheinen darunter ihre **Argumente** mit Beschriftung und Erklärung beim Zeigen; freiwillige Argumente sind gekennzeichnet („freiwillig“) und haben einen Standardwert. Nennt eine Formel des Schritts den Wert, ändert sich die Formel mit Ihrer Wahl. Sie finden die Änderung in den Bausteinen, in der Formelansicht und im Satz.
- Der Schalter **„Aktualisieren“** erscheint nur bei Objekten, die ihre Werte neu ermitteln können. Bei „Aktualisieren“ ermittelt das Objekt seine Werte an diesem Schritt neu, bevor es sie übergibt. Das brauchen Sie, wenn die Werte bis dahin veraltet sein können. Beispiel: Eine Order- und Positionsverwaltung läuft bei jedem neuen Tick und braucht den aktuellen Wert eines Indikators, den die Order beim Aufgeben gesehen hat. Dort schalten Sie „Aktualisieren“ ein, oder Sie legen ein weiteres Objekt an. Wählen Sie „Aktualisieren“ für einen Wert, den bisher nur eine Formel nennt, entsteht dafür ein Eingang. Zeigen Sie auf den Schalter, steht die Erklärung da. Hat das Objekt die Möglichkeit nicht, meldet die Prüfung „Aktualisieren“ als Fehler und sagt, wie Sie ihn beheben (Abschnitt 8).
- Ein Wert, den Sie selbst verbunden haben und den keine Formel nennt, lässt sich mit „Verbindung entfernen“ entfernen. Ein Wert, den eine Formel nennt, bleibt, bis Sie ihn in der Formel entfernen („in der Formel entfernen“ sagt die Zeile). Ein Eingang, den keine Formel verwendet, wird bei der Prüfung als Hinweis gemeldet.
- **Weiteren Wert verbinden:** Wählen Sie ein Objekt, einen seiner Werte (bei einer Methode die Argumente) und klicken Sie „Verbinden“. Zur Wahl stehen nur Objekte, die an diesem Schritt verwendbar sind. Gibt es keines, sagt der Hinweis es und nennt den Weg: ein weiteres Objekt mit eigenem Namen anlegen.
- Befunde zu diesen Werten („Aktualisieren“ nicht möglich, Objekt hier nicht verwendbar, falsche Argumente) stehen mit ihrem Text und ihrer Behebung gleich darüber.

**Element der ersten Verwendung wählen.** In der Eigenschaftenansicht eines Objekts nennt „Element der ersten Verwendung“, wo das Objekt ermittelt wird („Das Objekt wird bei … ermittelt.“), mit „Zum Element“. Auch ohne Ziehen legen Sie es dort fest: Sie wählen in der Liste einen Schritt. Der Schritt erhält dafür einen Eingang mit dem ersten Wert des Objekts. Zur Wahl stehen nur Schritte, an denen das Objekt verwendbar ist.

**„Vorheriger Wert von“ und das Kreuzen zweier Werte.** In den Bausteinen steht „Vorheriger Wert von …“ für den Wert, den ein Objekt oder eine Berechnung bei der Kerze davor hatte. Rechts davon wählen Sie, wie viele Kerzen zurück („vor 3 Kerzen“); ohne Angabe ist es eine Kerze. Zur Wahl stehen nur Werte, die einen früheren Wert haben, zum Beispiel der Wert eines Indikators. Einen eigenen Baustein für das Kreuzen zweier Werte gibt es nicht; Sie bilden die Bedingung aus „Vorheriger Wert von …“, Vergleichen und „Alle gelten (und)“ (Abschnitt 7.4). Beispiel „EMA 20 kreuzt EMA 50 nach oben“: Wählen Sie bei einer Bedingung die Art „Alle gelten (und)“ und legen Sie zwei Vergleiche an:

1. „Vorheriger Wert von EMA 20 › Wert“ ist kleiner oder gleich „Vorheriger Wert von EMA 50 › Wert“ (zuvor lag EMA 20 darunter oder gleichauf),
2. „EMA 20 › Wert“ ist größer als „EMA 50 › Wert“ (jetzt liegt EMA 20 darüber).

Nach unten tauschen Sie die Vergleiche (größer oder gleich, dann kleiner als). In beide Richtungen wählen Sie die Art „Eine gilt (oder)“ mit zwei Bedingungen der Art „Alle gelten (und)“, einer für jede Richtung. Eine so gebildete Bedingung zeigt der Satz auf der Zeichenfläche ausgeschrieben („Vorheriger Wert von EMA 20 ist kleiner oder gleich vorheriger Wert von EMA 50 und EMA 20 ist größer als EMA 50“).

Eine Karte verschieben Sie, indem Sie sie ziehen; sie bleibt dort, wo Sie sie ablegen, und die Linie folgt. „Neu anordnen“ in der Werkzeugleiste ordnet alles wieder selbst an. Ein Objekt, das noch kein Schritt verwendet, trägt nach „Prüfen“ den Befund „… ist mit keinem Element verbunden. Es wird nirgends verwendet.“

### 6.4 Felder ausfüllen: „Woher kommt der Wert?“

Die Einstellungen eines Elements stehen in seiner Eigenschaftenansicht. Jedes Feld trägt oben seine Beschriftung, zum Beispiel „Periode“, und die Erklärung beim Zeigen. Ein Stern kennzeichnet ein Pflichtfeld. Darunter steht die Frage **„Woher kommt der Wert?“** mit einer Auswahl:

| Antwort | Bedeutung |
| --- | --- |
| nicht belegt | Das Feld hat noch keinen Wert. Bei einem Pflichtfeld sagt der Hinweis: „Pflichtangabe: Wählen Sie oben, woher der Wert kommt.“ Bei einem freiwilligen Feld: „Optional. Ohne Wert bleibt die Angabe leer.“ |
| fest eingeben | Sie geben den Wert ein oder wählen ihn aus der Liste. |
| aus einem Strategieparameter | Sie wählen einen Strategieparameter, dessen Art passt. Gibt es noch keinen passenden, sagt ein Hinweis es, und Sie legen ihn mit „+ Neuer Strategieparameter …“ gleich an: Sie tragen den Namen ein und wählen „Anlegen“. |
| von einem anderen Element | Sie wählen ein Objekt auf der Zeichenfläche und einen seiner Werte. Liegt noch kein Objekt auf der Zeichenfläche, sagt der Hinweis es. |
| aus einer Formel | Sie stellen den Wert aus Bausteinen zusammen (Abschnitt 7). |
| beim Start der Strategie festlegen | Der Wert wird erst festgelegt, wenn die Strategie gestartet wird. |

Welche Antworten ein Feld anbietet, bestimmt das Feld. Zeigen Sie auf die Beschriftung oder auf das Symbol „i“, steht in der Erklärung, welche Art von Wert gefragt ist (zum Beispiel „ganze Zahl“ oder „ein Instrument“). Fehlt bei einem Pflichtfeld die Antwort, meldet die Prüfung es.

**Instrument.** Bei einem Feld für das Instrument steht zuerst „das Instrument, auf dem die Strategie läuft“ mit dem Hinweis „Dafür müssen Sie nichts wählen.“ Sie müssen also kein Instrument wählen. Wollen Sie ein anderes, wählen Sie „anderes Instrument wählen“; erst dann erscheint die Frage „Woher kommt der Wert?“ mit den Antworten, und mit „fest eingeben“ tragen Sie die Bezeichnung eines Instruments ein. Solange eine andere Angabe gilt, bietet das Feld „wieder das Instrument, auf dem die Strategie läuft“ an und trägt die Vorbelegung wieder ein.

Bei „Order aufgeben“ wählen Sie den Ordertyp. Er bestimmt die „Eigenschaften der Order“, die Sie ausfüllen (zum Beispiel Richtung und Stop-Loss). Wechseln Sie den Ordertyp, bekommen die neu gebrauchten Eigenschaften ihre Standardwerte, die vorhandenen bleiben. Ein Pflichtwert wie das Volumen kann auch eine Regel bestimmen (Abschnitt 6.6).

### 6.5 Strategieparameter

Strategieparameter legen Sie im Streifen unter der Kopfzeile an, ändern und entfernen sie dort (Abschnitt 3.2). Die Arten des Werts sind Zahl, Ganzzahl, Prozent, Wahrheitswert, Text, Zeiteinheit und die Objekte der Anwendung. In Formeln heißt ein Strategieparameter mit seinem Namen, in den Bausteinen steht er in der Gruppe „Strategieparameter“. Im Ablauf ändert er sich nicht. Ist der Schalter „Wert erst beim Start der Strategie festlegen“ eingeschaltet, hat der Strategieparameter noch keinen Wert; er wird gesetzt, wenn die Strategie gestartet wird.

### 6.6 Regeln zuordnen

Eine Regel prüft oder bestimmt etwas, zum Beispiel das Volumen einer Order. Regeln stehen an zwei Stellen: in der Eigenschaftenansicht der Strategie unter „Regeln der Strategie“ (sie gelten für jede Order der Strategie) und in der Eigenschaftenansicht eines Elements, das Regeln zulässt, zum Beispiel „Order aufgeben“, unter „Regeln dieses Elements“ (sie gelten zusätzlich nur für dieses Element).

1. Wählen Sie in der Liste „Regel oder Regelwerk hinzufügen …“ eine mitgelieferte Regel (zum Beispiel „Risiko je Trade“, in der englischen Oberfläche „Risk per trade“; Name und Erklärung erscheinen in der gewählten Sprache), eine gespeicherte Vorlage (mit der Marke „eigene“) oder „eigene Regel“. Eine Regel aus einer Vorlage ist eine vollständige Kopie: Ändern oder Löschen der Vorlage ändert sie nicht. Sie können auch einen Eintrag der Gruppe „Regeln und Regelwerke“ der Elementbibliothek anklicken; er wird der Strategie zugeordnet, oder dem gewählten Element, wenn dieses Regeln zulässt. Eine kurze Meldung sagt, wofür die Regel gilt: „Die Regel gilt für die ganze Strategie.“ oder „Die Regel gilt für das gewählte Element.“
2. Die neue Regel ist aufgeklappt. Sie hat einen Namen, den Sie ändern können.
3. Aufgeklappt zeigt die Regel ihre Einstellungen (zum Beispiel „Risikogrenze“ der Regel „Risiko je Trade“), die „Formel der Regel“ aus Bausteinen, „Die Regel bestimmt“ und „Vergleich beim Prüfen“. Bestimmt die Regel „nichts (sie prüft nur)“, ergibt die Formel wahr oder falsch. Bestimmt sie eine Eigenschaft der Order (zum Beispiel das Volumen), ergibt die Formel deren Wert, und der „Vergleich beim Prüfen“ (höchstens, mindestens, gleich) sagt, wie der aktuelle Wert der Eigenschaft gegen das Ergebnis der Formel geprüft wird, zum Beispiel das Volumen höchstens gleich dem bestimmten Volumen. Eine eigene Regel kann zusätzlich eigene Einstellungen haben; für jede legen Sie Name, Art des Werts und Standardwert fest („Einstellung hinzufügen“). Die Formeln der Regel sprechen sie mit ihrem Namen an.
4. „Nach oben“ und „Nach unten“ ändern die Reihenfolge; sie ist wichtig, weil eine Regel nur die Ergebnisse früherer Regeln verwenden kann. „Entfernen“ entfernt die Regel, der Pfeil davor klappt sie ein und auf.
5. Ein Regelwerk enthält Regeln und kann eine Formel für das Gesamtergebnis haben. Es hat dieselben Listen und Formeln wie eine Regel (unter „Regeln des Regelwerks“ und „Gesamtergebnis“).

### 6.7 Indikatoren, Trends und Regelwerke einstellen

Ein mitgelieferter Indikator oder Trend hat Einstellungen, die Sie ausfüllen (Abschnitt 6.4): bei einem Indikator zum Beispiel Zeiteinheit und Periode, bei einem Trend Instrument, Zeiteinheit und das Berechnungsverfahren. Die Zeiteinheit wählen Sie am besten „aus einem Strategieparameter“, damit Sie sie an einer Stelle ändern.

Ein **eigener Indikator** und ein **eigener Trend** haben einen „Inhalt“, den Sie in der Eigenschaftenansicht aufbauen:

- „Eigene Einstellungen“: Sie legen Einstellungen mit Name, Art des Werts und Standardwert an („Einstellung hinzufügen“). Die Formeln des Objekts sprechen sie mit ihrem Namen an.
- „Eigenschaften“: die Werte, die das Objekt liefert. Jede bekommt ihren Wert aus einer Formel aus Bausteinen („Eigenschaft hinzufügen“, „Formel für … festlegen“). Bei einem Trend gehört die Richtung des Trends dazu.
- „Enthaltene Indikatoren“ und „Enthaltene Regeln und Regelwerke“: Indikatoren und Regeln, die das Objekt enthält. Ihre Werte sind in den Formeln des Objekts mit `Objekt.Eigenschaft` ansprechbar.

Ein **eigenes Regelwerk** enthält Regeln (Abschnitt 6.6) und kann die Formel für das Gesamtergebnis haben.

### 6.8 Umbenennen und Entfernen

**Umbenennen.** Den Namen eines Elements, Objekts, Strategieparameters, einer Regel oder eines Abschnitts ändern Sie im Feld „Name“. Es gibt keine Rückfrage, und alle Verwendungen zeigen sofort den neuen Namen: die Sätze auf der Zeichenfläche, die Formeln in den Bausteinen und in der Formelansicht, „Verwendete Werte“. Alle Namen einer Strategie (Objekte, Regeln, Bedingungen und Berechnungen, auch die Namen der Objekte der Anwendung wie „Kerze“) müssen verschieden sein: Vergeben Sie einen Namen doppelt, meldet die Prüfung „Der Name … ist doppelt vergeben.“ (Abschnitt 8).

**Entfernen.** „Entfernen“ in der Eigenschaftenansicht eines Elements oder das Entfernen eines Strategieparameters oder einer Regel entfernt es.

- Wird das Objekt, der Strategieparameter oder das Ergebnis einer Regel von anderen Elementen verwendet, fragt pipwerk Studio zuerst in einem Fenster und nennt in einer Liste die Elemente, die es verwenden (und „Regeln der Strategie“, wenn eine Regel es verwendet). „Abbrechen“ lässt alles, wie es war.
- Bei „Order aufgeben“ entfernt pipwerk Studio mit dem Element auch seine Order- und Positionsverwaltung und nennt deren Schritte in der Liste.
- Nach dem Entfernen steht in den Formeln, die den Namen verwendet haben, ein leerer Platz „Wert wählen …“. Die Prüfung meldet ihn als Fehler („Im Feld … fehlt die Formel, oder sie ist unvollständig.“) mit dem Element und dem Feld und sagt dazu, wie Sie ihn beheben: jeden leeren Platz füllen; „Zur Stelle“ führt dorthin. Ein Feld, das den Strategieparameter oder einen Wert des Objekts als Quelle hatte, ist „nicht belegt“ und wird gemeldet, wenn es ein Pflichtfeld ist. Die Linien und Eingänge, die von dem Objekt kamen, sind weg. Hatte das entfernte Objekt ein Element der ersten Verwendung, hat es keines mehr.
- Hatte ein entfernter Schritt genau eine eingehende und eine ausgehende Verbindung, wird die Lücke geschlossen: sein Vorgänger wird mit seinem Nachfolger verbunden. Ein Schritt ohne Verwendung und ohne Order- und Positionsverwaltung wird ohne Rückfrage entfernt. Ebenso eine Regel, deren Ergebnis nichts verwendet.

### 6.9 Speichern, Prüfen, Schließen, Öffnen, Löschen

- **Speichern** legt die Strategie im Objektverzeichnis ab, beim ersten Mal neu, danach ersetzt es die gespeicherte. Speichern geht immer, auch bei Befunden. Danach prüft pipwerk Studio die Strategie. Der Zustand im Streifen der Strategieparameter wechselt auf „gespeichert“. Scheitert das Speichern, steht in einem Fenster „Die Strategie konnte nicht gespeichert werden.“ mit der Ursache.
- **Prüfen** sucht Probleme (Abschnitt 8) und zeigt ihre Zahl in der Kopfzeile. Nach dem Öffnen läuft die Prüfung von selbst.
- **Schließen**, **Neue Strategie** und **Öffnen** fragen bei ungespeicherten Änderungen („Ungespeicherte Änderungen“): „Speichern“, „Verwerfen“ oder „Abbrechen“. Die Escape-Taste ist „Abbrechen“. Scheitert das Speichern, geschieht nichts weiter.
- **Öffnen** zeigt im Fenster „Strategie öffnen“ die gespeicherten Strategien mit Name, Beschreibung und letzter Änderung. Ein Klick auf den Namen öffnet die Strategie. Eine Strategie ohne Namen heißt „(ohne Name)“. Eine Datei, die sich nicht lesen lässt, ist als „nicht lesbar“ gekennzeichnet und nicht zu öffnen; sie bleibt unverändert. Ist noch keine Strategie gespeichert, ist die Liste leer, und das Fenster sagt: „Es sind keine Strategien gespeichert. Schließen Sie dieses Fenster und legen Sie mit „Neue Strategie“ eine an.“ Lässt sich die Liste nicht lesen, steht dort „Die Liste der Strategien konnte nicht gelesen werden.“ mit der Schaltfläche „Erneut versuchen“. „Abbrechen“ schließt das Fenster.
- **Löschen** fragt zuerst („Strategie löschen?“; „Das lässt sich nicht rückgängig machen.“) und löscht die gespeicherte Strategie. Eine Strategie, die nie gespeichert wurde, wird nur verworfen.

Nach dem Öffnen bleibt die Strategie so, wie sie gespeichert ist: Felder, die diese Fassung nicht kennt, bleiben beim Speichern unverändert. Eine gespeicherte Bedingung für das Kreuzen zweier Werte erscheint ausgeschrieben (Abschnitt 6.3).

### 6.10 Vorlagen ansehen und einfügen

Eine Vorlage ist ein wiederverwendbares Objekt, zum Beispiel eine Regel. Sie wird einmal angelegt und gespeichert und lässt sich in Strategien verwenden.

- **Ansehen:** In der Elementbibliothek stehen die mitgelieferten Einträge (zum Beispiel „Risiko je Trade“) und die gespeicherten Vorlagen in der Gruppe ihres Objekttyps. Eine gespeicherte Vorlage trägt die Marke „eigene“. Zeigen Sie auf einen Eintrag oder wählen Sie ihn mit der Tabulatortaste, erscheint seine Erklärung. Mit dem Suchfeld finden Sie ihn nach Namen und Erklärung. Den Inhalt einer Vorlage sehen Sie, nachdem Sie sie eingefügt haben: Die Eigenschaftenansicht des eingefügten Objekts oder der Regel zeigt ihre Herkunft („…, aus Vorlage …, Objekttyp …“) und ihren Inhalt.
- **Einfügen:** Ein Klick auf den Eintrag fügt eine vollständige Kopie ein (Abschnitt 6.2); eine Regel oder ein Regelwerk wird der Strategie oder dem gewählten Element zugeordnet (Abschnitt 6.6). Die Kopie gehört nur dieser Strategie. Ändern oder Löschen der Vorlage ändert sie nicht.
- **Noch nicht möglich:** Vorlagen anlegen, öffnen, ändern, speichern und löschen (Abschnitt 10).

## 7. Formeln schreiben

Eine Formel ist ein kurzer Text, der einen Wert berechnet oder eine Frage beantwortet, deren Antwort „wahr“ oder „falsch“ ist. Formeln stehen in einer Bedingung, einer Berechnung, einer Regel, im Inhalt eines eigenen Indikators oder Trends und überall dort, wo die Antwort „aus einer Formel“ gewählt ist. Sie stellen sie aus Bausteinen zusammen (Abschnitt 7.4), ohne die Schreibweise zu kennen. Wer will, schreibt eine Formel in der Formelansicht („Formel für Fortgeschrittene“). Die Abschnitte 7.1 bis 7.3 und 7.5 beschreiben die Schreibweise und die Bedeutung dafür; sie folgt der Formelsprache der Tabellenkalkulationen. pipwerk Studio berechnet Formeln nicht. Es prüft sie und meldet Fehler (Abschnitt 8). Strategien werden in diesem Stand nicht ausgeführt.

### 7.1 Namen

- Ein Name hat die Schreibweise `Objekt.Eigenschaft`, zum Beispiel `Kerze.Schluss` oder `Order.Volumen`. Enthält ein Name Leerzeichen, einen Bindestrich oder andere Zeichen, steht er in eckigen Klammern: `[EMA 20].Wert`.
- Bei Objekten, die andere Objekte enthalten, ist der Name mehrstufig: `[Trend H1].[EMA 20].Wert` (die Eigenschaft „Wert“ des Indikators „EMA 20“ im Trend „Trend H1“) oder `Regelwerk.Regel.Ergebnis` (das Ergebnis der Regel „Regel“ im Regelwerk „Regelwerk“).
- Was vor dem Punkt stehen kann:
  - ein Objekt der Anwendung: `Konto`, `Instrument`, `Kerze`, `Tick`, `Order`, `Position`, `Strategie`
  - der Name eines Indikators, Trends oder anderen Objekts, zum Beispiel `[EMA 20]`
  - der Name einer Bedingung oder Berechnung mit `.Ergebnis`, zum Beispiel `Einstieg.Ergebnis`
  - der Name einer Regel mit `.Ergebnis`, zum Beispiel `Risiko.Ergebnis`
  - `Strategie` mit dem Namen eines Strategieparameters, zum Beispiel `Strategie.[Stop-Abstand]`
- Die Einstellungen einer Regel stehen ohne Punkt, zum Beispiel `Risikogrenze`.
- Die Formelansicht zeigt die Namen so, wie Sie sie vergeben haben, und die Beschriftungen der Objekte der Anwendung, ihrer Eigenschaften und der Werte einer Auswahl in der gewählten Sprache. Beim Eingeben dürfen Sie auch die Beschriftungen der anderen Sprache schreiben; pipwerk Studio erkennt sie und zeigt danach die Form der gewählten Sprache. Benennen Sie ein Objekt um, ändern sich die Formeln mit.
- Groß- und Kleinschreibung wird nicht unterschieden: `order.VOLUMEN` und `Order.Volumen` sind dasselbe.
- Die Namen, die Sie vergeben, dürfen frei sein, auch mit Leerzeichen, Bindestrichen und Umlauten. Nur wenige Zeichen kann eine Formel nicht ansprechen; die Prüfung meldet das („Der Name … enthält Zeichen, die eine Formel nicht ansprechen kann.“).
- Welche Namen eine Formel sieht, hängt davon ab, wo sie steht:

| Die Formel steht … | Sie sieht … |
| --- | --- |
| in einer Bedingung, Berechnung oder bei einem Feld | alle Objekte der Strategie, die Namen aller Bedingungen und Berechnungen (`Name.Ergebnis`), die Regeln der Strategie und die Objekte der Anwendung |
| in einer Regel der Strategie | die Einstellungen der Regel, die Regeln der Strategie, dann dasselbe wie oben |
| in einer Regel eines Elements | die Einstellungen der Regel, die Regeln dieses Elements, dann dasselbe wie in einer Regel der Strategie |
| in einer Regel eines Regelwerks | die Einstellungen der Regel, die Regeln dieses Regelwerks und die Objekte der Anwendung mit `Strategie`; nichts sonst aus der Strategie |

Zwei Namen derselben Ebene dürfen nicht gleich sein (Befund „doppelt vergeben“, Abschnitt 8). Ein Objekt ist nur an Stellen verwendbar, die sein Element der ersten Verwendung erreichen (Abschnitt 6.3).

`Order` und `Position` gibt es nur dort, wo eine Order vorhanden ist: in einer Regel der Strategie, in einer Regel von „Order aufgeben“ und in der Order- und Positionsverwaltung. Im Hauptablauf ist ihre Verwendung ein Fehler. In der Order- und Positionsverwaltung hat `Order` die Eigenschaften des Ordertyps von „Order aufgeben“.

### 7.2 Werte, Operatoren und Trennzeichen

- Zahlen schreiben Sie mit Dezimalpunkt: `3.14`.
- Prozent: Das Prozentzeichen steht unmittelbar hinter der Zahl, `1%` ist `0.01`.
- Text steht in doppelten Anführungszeichen: `"buy"`. Ein doppeltes Anführungszeichen im Text verdoppeln Sie.
- Wahrheitswerte: `TRUE()` und `FALSE()`.
- Werte einer Auswahl stehen als Text: `Order.Status = "wartend"`, `Order.Richtung = "buy"`. Ein Text, der kein Wert dieser Auswahl ist, ist ein Fehler. Die erlaubten Werte nennt der Befund; in den Bausteinen bietet pipwerk Studio sie zur Wahl an.
- Rechnen: `+`, `-`, `*`, `/`, `^` (Potenz), `&` (Texte aneinanderhängen), Vorzeichen und Klammern.
- Vergleichen: `=`, `<>` (ungleich), `<`, `<=`, `>`, `>=`.
- Die Rangfolge ist, von niedrig nach hoch: Vergleich, `&`, `+ -`, `* /`, `^`, Vorzeichen. Setzen Sie Klammern, wenn Sie unsicher sind.
- „Und“, „oder“ und „nicht“ sind Funktionen: `AND(a; b)`, `OR(a; b)`, `NOT(a)`. Es gibt kein `&&`.
- Die Angaben einer Funktion trennen Sie mit einem Semikolon `;`, nicht mit einem Komma: `IF(a; b; c)`. Zwischen den Teilen darf Leerraum stehen, auch Zeilenumbrüche.

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
| `PREVIOUS(Eigenschaft; Anzahl)` | Der Wert der Eigenschaft bei einer früheren Auswertung („Vorheriger Wert von“). Ohne `Anzahl` ist es die vorige. `PREVIOUS([EMA 20].Wert)` ist der Wert von `[EMA 20].Wert` bei der vorigen Auswertung. |

Die Funktionsnamen stehen immer in dieser englischen Schreibweise. Deutsche Namen gibt es nicht. Die Eingabe bietet die Funktionen mit ihrer Beschreibung an.

### 7.4 Formeln aus Bausteinen und in der Formelansicht

Wo eine Formel steht, zeigt die Eigenschaftenansicht oben den Satz, den die Formel sagt (zum Beispiel „EMA 20 ist größer als EMA 50“; auf der Zeichenfläche steht derselbe Satz). Darunter wechseln Sie mit den Reitern „Bausteine“ und „Formel für Fortgeschrittene“ zwischen den beiden Ansichten. Beide zeigen und ändern dieselbe Formel. pipwerk Studio schreibt sie nur, wenn sie eine gültige Formel ist. Solange Sie nichts zusammengestellt haben, steht dort „Noch nichts zusammengestellt. Wählen Sie unten die Bausteine.“

**Bausteine.** Jeder Platz für einen Wert ist eine Liste, zuerst „Wert wählen …“. Sie enthält in dieser Reihenfolge:

1. „Verbundene Werte“: die Werte, die Sie mit dem Element verbunden haben (Eingänge), eine Methode mit den Werten ihrer Argumente, zum Beispiel „Pegel › Mittel (3; 0,5)“,
2. „Objekte der Strategie“: die Werte und Methoden Ihrer Indikatoren und Trends, die an diesem Element verwendbar sind (Abschnitt 6.3); im Zweig „falsch“ einer Bedingung also kein Objekt, das erst im Zweig „wahr“ ermittelt wird. Eine Methode trägt das Wort „Methode“; wählen Sie sie, erscheinen darunter ihre Argumente, jedes mit seiner Beschriftung und mit den Standardwerten,
3. „Objekte der Anwendung“: Konto, Instrument, Kerze, Tick, in einer Order- und Positionsverwaltung auch Order und Position, und Strategie (zum Beispiel die Zahl der wartenden Orders),
4. „Ergebnisse“: das Ergebnis jeder anderen Bedingung, Berechnung und Regel,
5. „Strategieparameter“,
6. „Angaben der Vorlage“ (in einer Regel: ihre eigenen Einstellungen),
7. „Feste Werte und Rechnungen“: „Zahl …“, „Text oder Auswahlwert …“, „wahr oder falsch …“, „Vorheriger Wert von …“, „Rechnung (plus, minus, mal, geteilt)“, „Wenn … dann … sonst …“, „Funktion (kleinster, größter, abgerundet …)“ und „Bedingung (wahr oder falsch) …“.

Ein Wert wird in der Form *Objekt › Eigenschaft* gezeigt, zum Beispiel „EMA 20 › Wert“. Wählen Sie den Wert eines Objekts der Strategie, ist er danach ein Eingang des Elements; Sie müssen ihn nicht eigens verbinden. Verwendete noch kein Element das Objekt, wird dieses Element sein Element der ersten Verwendung (Abschnitt 6.3). Ein Eingang mit einer Methode entsteht, wenn alle Argumente feste Werte sind. Der Satz steht oben in der Eigenschaftenansicht und auf der Zeichenfläche. Sie müssen keinen Text schreiben: Jede Bedingung und jede Berechnung lässt sich aus Bausteinen bilden.

Die Rechnungen und Vergleiche stehen in Händlersprache: „ist größer als“, „und“, „oder“, „nicht“, „Vorheriger Wert von … vor … Kerzen“, die Rechnung „plus, minus, mal, geteilt“, die Fallunterscheidung „Wenn … dann … sonst …“ und die Funktionen (kleinster, größter, abgerundet …). Bei einem Text, dessen Wert aus einer Auswahl stammt (zum Beispiel die Richtung oder der Status einer Order), bietet pipwerk Studio die erlaubten Werte zur Wahl an. Ein Wert kann selbst eine Rechnung, eine Fallunterscheidung, eine Funktion oder eine Bedingung sein; die Bausteine klappen sich nach Bedarf auf.

Eine **Bedingung** wählt oben ihre Art („Art der Bedingung“):

| Art | Bedeutung |
| --- | --- |
| Vergleich | Zwei Werte und ein Vergleich: ist gleich, ist ungleich, ist kleiner als, ist kleiner oder gleich, ist größer als, ist größer oder gleich. |
| Alle gelten (und) | Mindestens zwei Bedingungen, alle müssen wahr sein. „Bedingung hinzufügen“ fügt eine hinzu; ab drei Bedingungen entfernt „Bedingung entfernen“ eine wieder. |
| Eine gilt (oder) | Mehrere Bedingungen, mindestens eine muss wahr sein. |
| Nicht | Kehrt eine Bedingung um. |
| Wert ist wahr | Ein Wert, der wahr oder falsch ist, zum Beispiel ein Strategieparameter von der Art Wahrheitswert, eine Eigenschaft eines eigenen Indikators oder Trends mit dieser Art oder eine Fallunterscheidung, deren Zweige Bedingungen sind. |

Eine Art für das Kreuzen zweier Werte gibt es nicht. Wie Sie es aus „Vorheriger Wert von …“, Vergleichen und „Alle gelten (und)“ bilden, steht in Abschnitt 6.3. Wechseln Sie die Art einer Bedingung, ersetzt die neue Art die alte samt ihrer Erklärung; nur zwischen „Alle gelten (und)“ und „Eine gilt (oder)“ bleiben die Teile erhalten.

Ein leerer Platz trägt „Wert wählen …“. Er macht die Formel unvollständig; die Prüfung meldet das.

Lässt sich eine Formel nicht aus Bausteinen zeigen, weil sie einen Schreibfehler enthält oder zu tief verschachtelt ist, sagt pipwerk Studio es („Diese Formel ist fehlerhaft und lässt sich nicht aus Bausteinen anzeigen.“ beziehungsweise „Diese Formel ist zu tief verschachtelt für die Bausteine.“) und bietet „Zur Ansicht für Fortgeschrittene“ und „Neu zusammenstellen“ an.

**Formelansicht („Formel für Fortgeschrittene“).** Die Formelansicht ist ein mehrzeiliges Feld mit der Schreibweise aus Abschnitt 7.1. Sie hilft beim Schreiben:

- Namen, Funktionen, Zahlen und Texte haben je eine Farbe.
- Steht die Schreibmarke an einer Klammer, sind sie und die zugehörige Klammer hervorgehoben.
- Ein Fehler ist an der Stelle wellig unterstrichen. Zeigen Sie mit dem Mauszeiger darauf, steht der Grund da, und unter dem Feld steht der erste Fehler als Satz. Ist die Formel in Ordnung, steht dort „Die Formel ist in Ordnung.“
- Nach `Objekt.` schlägt pipwerk Studio die Eigenschaften und Methoden des Objekts vor, jeweils mit der Art des Werts und Erklärung; eine Methode hat dazu das Wort „Methode“ und steht mit der öffnenden Klammer da. Es erscheinen nur Objekte, die an diesem Element verwendbar sind (Abschnitt 6.3). Das gilt auch nach dem Namen einer Bedingung oder Berechnung (`Ergebnis`), eines Trends mit enthaltenen Indikatoren und eines Regelwerks mit seinen Regeln. Auch beim Beginn eines Namens erscheinen Vorschläge. Mit den Pfeiltasten wählen Sie, mit der Eingabetaste oder der Tabulatortaste übernehmen Sie, Escape schließt die Liste.
- Schreiben Sie eine Funktion oder eine Methode, erklärt eine Zeile unter dem Feld ihre Angaben und hebt die hervor, an der Sie stehen.

Während Sie tippen, liest pipwerk Studio die Formel nach einer kurzen Pause neu; die Bausteine und der Satz folgen. Solange sie einen Schreibfehler hat, steht sie nur in der Formelansicht.

### 7.5 „Leer“ und „nicht verfügbar“

Manchmal hat eine Eigenschaft keinen Wert. Dafür gibt es zwei Fälle. Sie wirken bei der späteren Ausführung der Strategie verschieden. pipwerk Studio führt Strategien noch nicht aus. Die Festlegung gilt aber schon jetzt, damit Sie Formeln richtig schreiben.

**„Nicht verfügbar“.** Eine Formel spricht eine Eigenschaft an, die das Objekt im Zusammenhang der Auswertung nicht hat. Beispiele: `Order.Limitpreis` bei einer Stop-Order (sie hat keinen Limitpreis), `Position`, solange die Order noch keine Position hat, oder `Position` in einer Regel, die auf eine Order angewendet wird. Jede Rechnung mit „nicht verfügbar“ ergibt wieder „nicht verfügbar“, auch eine Bedingung von `IF`. `ISNA(Wert)` fragt danach, `IFNA(Wert; Ersatz)` ersetzt den Wert. Die Regel „Risiko je Trade“ fängt `Position` so ab: `IF(ISNA(Position.Volumen); …; …)`.

**„Leer“.** Eine Eigenschaft hat keinen Wert, obwohl das Objekt sie kennt. Beispiel: das vorletzte Hoch des ZigZag, solange er noch kein zweites Hoch gefunden hat. Eine Eigenschaft, die Sie nicht ausgefüllt haben, aber nicht ausfüllen müssen, ist ebenfalls leer. Rechnen und Vergleichen mit „leer“ ist ein Fehler der Auswertung, ebenso eine Division durch null. `ISBLANK(Wert)` fragt danach.

Die Wirkung bei der Ausführung, wenn eine Formel einen Fehler, „leer“ oder „nicht verfügbar“ ergibt:

| Stelle | Wirkung |
| --- | --- |
| Regel, deren Ergebnis „nicht verfügbar“ ist, weil der Ordertyp eine angesprochene Eigenschaft nicht hat | Die Regel wird auf diese Order nicht angewendet, ohne Fehler und ohne Meldung. |
| bestimmende Regel mit Fehler, „leer“ oder sonst „nicht verfügbar“ | Die Eigenschaft ist nicht bestimmbar. |
| prüfende Regel mit Fehler, „leer“ oder „nicht verfügbar“ | Die Prüfung gilt als nicht erfüllt. |
| Bedingung | Jedes Ergebnis außer „wahr“ nimmt den Ausgang „falsch“. |
| Berechnung | Das Ergebnis ist dieser Wert. Wer es verwendet, verhält sich nach dieser Tabelle. |
| Feld bei „Order aufgeben“, „Order ändern“, „Position ändern“ oder „Position schließen“ | Die Eigenschaft ist nicht bestimmbar. „Order aufgeben“ nimmt den Ausgang „nicht gestellt“, „Order ändern“ und „Position ändern“ nehmen „nicht geändert“. „Position schließen“ schließt dann nichts, und der Ablauf geht weiter. |
| Einstellung eines Objekts, die aus einer Formel kommt | Alle Eigenschaften des Objekts sind „leer“. Ein Auslöser, dessen Einstellung so ein Ergebnis hat, tritt nicht ein. |
| eigene Eigenschaft eines Indikators oder Trends | Die Eigenschaft ist „leer“. |

Eine Order oder Position ohne Stop-Loss erfüllt die Regel „Risiko je Trade“ nicht, weil der Stop-Loss dann „leer“ ist.

Beispiel: Die Bedingung `[ZigZag H1].[Letztes Hoch] > [ZigZag H1].[Vorletztes Hoch]` vergleicht die beiden letzten Hochs eines ZigZag. Hat er noch kein zweites Hoch, ist der Vergleich ohne Ergebnis, und die Bedingung nimmt den Ausgang „falsch“. Es wird dann keine Order geplant.

## 8. Befunde der Prüfung und ihre Behebung

Die Prüfung läuft bei „Speichern“, bei „Prüfen“ und nach „Öffnen“. Sie meldet Befunde. Ein Befund hat die Stufe „Fehler“ oder „Hinweis“. Ein Fehler macht die Strategie unvollständig oder widersprüchlich. Ein Hinweis weist auf etwas hin, das Sie prüfen sollten. Befunde verhindern das Speichern nicht.

**Wo ein Befund steht.** Fehler sind rot, Hinweise orange. Die Zahl steht in der Kopfzeile. Die Liste der Befunde steht in der Eigenschaftenansicht der Strategie unter „Befunde der Prüfung“ und, soweit ein Befund ein Element betrifft, in der Eigenschaftenansicht dieses Elements; das Element ist auf der Zeichenfläche rot oder orange umrandet. Befunde, die zu keinem einzelnen Element gehören, stehen nur bei der Strategie. Vor der ersten Prüfung steht dort „Noch nicht geprüft. „Prüfen“ sucht Probleme wie fehlende Verbindungen oder leere Pflichtangaben.“; ohne Befund „Keine Befunde. Die Strategie ist in sich stimmig.“

**Wie ein Befund aussieht.** Jeder Befund zeigt seine Stufe, seinen Text und, damit gleichlautende Befunde unterscheidbar sind, wo er liegt:

- „Element: …“ nennt das Element mit dem Namen, den Sie dort sehen,
- „Darin: …“ nennt, soweit es um eine Regel oder ein Objekt im Element geht, deren Namen,
- „Feld: …“ nennt das Feld mit der Beschriftung, die Sie im Element sehen,
- „So beheben Sie es: …“ sagt, was zu tun ist,
- „Zur Stelle“ führt dorthin.

**Zur Stelle.** Die Schaltfläche „Zur Stelle“ an einem Befund wählt das Element, zeigt es auf der Zeichenfläche und führt zum Feld, das der Befund nennt. Betrifft der Befund eine Formel, öffnet sie deren Formelansicht und markiert die Stelle in der Formel, an der der Fehler liegt. Bei einer Regel klappt sie die Regel auf. Betrifft der Befund kein Element, führt sie zur Strategie.

Die Tabelle nennt die Texte, wie sie in der Oberfläche erscheinen. Drei Punkte („…“) stehen dort, wo pipwerk Studio eine Angabe einsetzt. Ein Befund, den diese Fassung nicht kennt, erscheint als „Befund <Bezeichnung>“.

| Stufe | Text in der Oberfläche | Behebung |
| --- | --- | --- |
| Fehler | Der Auslöser ist mit keinem Element des Ablaufs verbunden. | Verbinden Sie den Auslöser mit dem ersten Schritt oder entfernen Sie ihn. |
| Fehler | Kein Auslöser erreicht dieses Element des Ablaufs. | Verbinden Sie einen vorherigen Schritt oder einen Auslöser mit diesem Schritt oder entfernen Sie ihn. |
| Hinweis | Hauptablauf ohne Auslöser: Die Strategie startet nie, auch wenn eine Order- und Positionsverwaltung eigene Auslöser hat. | Legen Sie in den Hauptablauf einen Auslöser an und verbinden Sie ihn mit dem ersten Schritt. Eine neue, leere Strategie hat nur diesen Hinweis. |
| Fehler | Rückführung ohne Bedingung, die sie beendet (an … Elementen). | Legen Sie in die Rückführung eine Bedingung, von der ein Ausgang aus der Rückführung hinausführt. |
| Fehler | „…“ darf nur in einer Order- und Positionsverwaltung stehen, nicht im Hauptablauf. | Verschieben Sie den Schritt in die Order- und Positionsverwaltung einer Order oder entfernen Sie ihn. |
| Hinweis | Vom Auslöser aus ist kein Element erreichbar, das eine Order aufgibt. | Verbinden Sie den Ablauf mit einem Schritt, der eine Order aufgibt. Soll die Strategie keine Order aufgeben, lassen Sie den Hinweis stehen. |
| Fehler | Das Instrument „…“ ist keine gültige Bezeichnung. | Korrigieren Sie die Bezeichnung des Instruments. |
| Fehler | Das Pflichtfeld „…“ hat keinen Wert. | Geben Sie dem Feld einen Wert: Tragen Sie ihn ein, wählen Sie einen Strategieparameter oder legen Sie ihn beim Start der Strategie fest. |
| Fehler | Die Angabe zu „…“ passt nicht: … | Wählen Sie unter „Woher kommt der Wert?“ eine passende Möglichkeit aus (Gründe siehe unten). |
| Fehler | Die Eigenschaft „…“ der Order hat keinen Wert, und keine bestimmende Regel liefert ihn. | Geben Sie der Eigenschaft einen Wert oder ordnen Sie dem Element oder der Strategie eine Regel zu, die sie bestimmt (zum Beispiel „Risiko je Trade“ für das Volumen). |
| Fehler | Im Feld „…“ fehlt die Formel, oder sie ist unvollständig. | Geben Sie die Formel vollständig an: Füllen Sie jeden leeren Platz „Wert wählen …“. |
| Fehler | Die Formel im Feld „…“ ist fehlerhaft: … | Korrigieren Sie die Formel (Probleme siehe unten). Ein Klick auf „Zur Stelle“ führt zur Stelle in der Formel. |
| Fehler | Die Formel im Feld „…“ verwendet Order oder Position außerhalb einer Order- und Positionsverwaltung. | Verwenden Sie Order und Position nur in der Order- und Positionsverwaltung einer Order, in einer Regel der Strategie und in einer Regel von „Order aufgeben“. |
| Fehler | Die Datenverbindung ist ungültig: … | Wählen Sie ein Objekt und eine Eigenschaft, die es gibt, oder löschen Sie die Verbindung. Gründe: das Objekt gibt es nicht, das Objekt hat diese Eigenschaft nicht, das Objekt hat diese Methode nicht, die Angaben passen nicht zur Methode. |
| Fehler | Die Art des verbundenen Werts passt nicht: erwartet …, gefunden …. | Verbinden Sie einen Wert der passenden Art. |
| Hinweis | Der Wert „…“ von „…“ ist mit diesem Element verbunden, wird aber nicht verwendet. | Verwenden Sie den Wert in einer Formel oder entfernen Sie die Verbindung. |
| Fehler | Der Wert „…“ von „…“ soll bei diesem Element aktualisiert werden. Ein Objekt dieser Art kann seine Werte aber nicht neu ermitteln. | Schalten Sie „Aktualisieren“ für diesen Wert aus. Brauchen Sie aktuelle Werte, legen Sie ein weiteres Objekt mit eigenem Namen an und verwenden Sie dieses. |
| Fehler | „…“ darf an diesem Element nicht verwendet werden. Das Objekt wird bei „…“ ermittelt, und nicht jeder Weg hierher führt dort vorbei. | Legen Sie ein weiteres Objekt mit eigenem Namen an und verwenden Sie dieses an diesem Element, oder verwenden Sie das Objekt nur an Elementen, die hinter seinem ersten Element liegen. |
| Fehler | „…“ ist mit keinem Element verbunden. Es wird nirgends verwendet. | Verbinden Sie das Objekt mit dem Element, das seine Werte zuerst braucht, oder entfernen Sie es. |
| Fehler | Der Auslöser „…“ startet von Hand und steht in der Order- und Positionsverwaltung einer Order. Dort wird er nie ausgelöst. | Entfernen Sie den Auslöser aus der Order- und Positionsverwaltung und legen Sie dort einen anderen Auslöser an, oder legen Sie ihn in den Hauptablauf. |
| Fehler | Das Ergebnis der Regel passt nicht zur bestimmten Eigenschaft „…“: … | Ändern Sie die Formel der Regel oder wählen Sie eine andere bestimmte Eigenschaft. Die Formel muss einen Wert der Art der bestimmten Eigenschaft ergeben (bei einer nur prüfenden Regel „wahr“ oder „falsch“). |
| Fehler | Die Regel spricht Order oder Position an. In einem Indikator oder Trend ist das nicht erlaubt. | Entfernen Sie die Regel aus dem Indikator oder Trend und ordnen Sie sie der Strategie oder einem Element zu. |
| Fehler | In dieser Liste von Regeln steht ein Objekt vom Typ „…“, das dort nicht stehen darf. | Entfernen Sie das Objekt aus dieser Liste. |
| Fehler | Die bestimmende Regel nennt keinen Vergleich beim Prüfen. | Wählen Sie den Vergleich beim Prüfen („höchstens“, „mindestens“ oder „gleich“). |
| Hinweis | Hinweis zur Formel im Feld „…“: … Die Vorlage allein kennt den Namen nicht; geprüft wird er in jeder Strategie, die die Vorlage enthält. | Prüfen Sie den Namen in der Formel der Vorlage. Der Hinweis betrifft nur eine Vorlage, die für sich geprüft wird. |
| Fehler | In diesem Regelwerk gibt es einen Vorwärtsbezug (beziehungsweise Zirkelbezug): Eine Regel verwendet ein Ergebnis, das noch nicht feststeht. | Ändern Sie die Reihenfolge der Regeln, sodass jede Regel nur frühere Ergebnisse verwendet. |
| Fehler | Die Kerze wird verwendet, aber auf der Zeichenfläche liegt keine Kerze mit gesetzter Zeiteinheit. | Legen Sie eine Kerze mit Zeiteinheit auf die Zeichenfläche und verwenden Sie ihre Werte. Nur wenn ein Element ausschließlich von „Kerzenschluss“ ausgelöst wird, braucht es keine Kerze auf der Zeichenfläche. |
| Fehler | Der Name „…“ ist doppelt vergeben. | Geben Sie einem der beiden einen anderen Namen. Zwei Namen derselben Ebene dürfen nicht gleich sein. |
| Fehler | Der Name „…“ enthält Zeichen, die eine Formel nicht ansprechen kann. | Ändern Sie den Namen. |
| Fehler | Ein Abschnitt oder eingeklappter Rahmen passt nicht: … | Entfernen Sie den Abschnitt und legen Sie ihn neu an. |
| Fehler | Der Typ „…“ ist unbekannt. | Entfernen Sie das Element oder installieren Sie die Erweiterung, die den Typ liefert. |
| Fehler | Dem Trend fehlt die Formel für die Eigenschaft „…“. | Geben Sie die Formel für die Richtung des Trends an. |
| Fehler | Berechnungen verwenden ihre Ergebnisse im Kreis (…). | Ändern Sie eine der Berechnungen, sodass sie nicht auf sich selbst zurückführt. Ein Name in „Vorheriger Wert von“ zählt nicht. |
| Fehler | Ungültige Verbindung: … | Löschen Sie die Verbindung und legen Sie sie neu an (Gründe siehe unten). |
| Fehler | Diesem Element sind Regeln zugeordnet, obwohl „…“ keine zulässt. | Entfernen Sie die Regeln von diesem Element. |
| Fehler | Das Element gehört zur Order- und Positionsverwaltung eines Elements, das keine Order aufgibt. | Verschieben Sie das Element in den Hauptablauf oder in die Order- und Positionsverwaltung einer Order. |
| Fehler | Es gibt mehr Befunde, als angezeigt werden (Grenze …). | Beheben Sie die angezeigten Befunde und prüfen Sie erneut. |
| – | Befund … | Prüfen Sie das betroffene Element und seine Angaben. |

**Probleme in einer Formel.** Die Stelle zählt von 0 in Zeichen der Formel: „Stelle 13 bis 14“ ist das 14. Zeichen.

| Problem | Text | Behebung |
| --- | --- | --- |
| Schreibfehler | Schreibfehler an Stelle … bis …: … | Korrigieren Sie die Schreibweise an der genannten Stelle. Der Grund steht dahinter (siehe unten). |
| unbekannte Funktion | Unbekannte Funktion „…“ (Stelle … bis …). | Wählen Sie eine Funktion, die es gibt (Abschnitt 7.3). |
| unbekannter Name | Unbekannter Name „…“ (Stelle … bis …). | Wählen Sie einen Wert, den es gibt: ein Objekt auf der Zeichenfläche, einen Strategieparameter oder das Ergebnis eines Schritts (Abschnitt 7.1). |
| unbekannte Eigenschaft | „…“ hat keine Eigenschaft „…“ (Stelle … bis …). | Wählen Sie eine Eigenschaft, die das Objekt liefert. Die Formelansicht schlägt sie nach dem Punkt vor. |
| unpassende Art des Werts | Die Art des Werts passt nicht: erwartet …, gefunden … (Stelle … bis …). | Verwenden Sie einen Wert der passenden Art. |
| unbekannter Wert einer Auswahl | „…“ ist kein Wert der Auswahl; erlaubt sind … (Stelle … bis …). | Wählen Sie einen der erlaubten Werte. |
| falsche Zahl von Angaben | Die Funktion … erhält … Angaben; erlaubt sind … bis … (Stelle … bis …). | Geben Sie die passende Zahl von Angaben an. |
| anderes | Die Formel ist an Stelle … bis … fehlerhaft. | Korrigieren Sie die Formel an der genannten Stelle. |

Gründe eines Schreibfehlers: die Formel endet zu früh (eine Klammer oder eine Angabe fehlt), unerwartetes Zeichen „…“ (zum Beispiel ein zweites `>`), ungültiges Zeichen „…“, ungültige Zahl, Text nicht abgeschlossen (ein Anführungszeichen fehlt), die Formel ist zu lang, die Formel ist zu tief verschachtelt.

Gründe einer ungültigen Verbindung: der Anfang ist kein Element, das Ende ist kein Element, der Ausgang gehört nicht zum Element, ein Auslöser hat keinen Eingang, die Verbindung führt zwischen dem Ablauf und einer Order- und Positionsverwaltung oder zwischen zwei Order- und Positionsverwaltungen.

Gründe einer unpassenden Angabe zu einem Feld: diese Herkunft des Werts ist hier nicht erlaubt, der eingegebene Wert hat die falsche Art, der eingegebene Wert gehört nicht zur Auswahl, der Wert ist nicht zulässig, das Feld ist unbekannt, die Eigenschaft ist unbekannt, die Anwendung legt diese Eigenschaft fest, nicht der Anwender.

Gründe, warum das Ergebnis einer Regel nicht passt: die bestimmte Eigenschaft ist unbekannt, das Ergebnis ist kein Wert der Auswahl, die Art des Ergebnisses passt nicht.

Bezeichnungen in den Texten: Ein Vorwärtsbezug ist eine Regel, die ein Ergebnis einer später stehenden Regel verwendet, ein Zirkelbezug eine Regel, die sich über andere auf sich selbst bezieht.

## 9. Alles ohne Ziehen bedienen

Jede Bedienung, für die Sie ziehen können, geht auch mit Klicks. Das hilft auf einem Telefon, am Touchpad und mit der Tastatur.

| Sie wollen … | Mit der Maus ziehen | Mit Klicks |
| --- | --- | --- |
| ein Element einfügen | den Eintrag der Bibliothek auf die Zeichenfläche, hinter einen Schritt oder in einen Rahmen ziehen | den Eintrag anklicken (mit der Tastatur: Tabulator, dann Eingabetaste oder Leertaste); gewählt ist der Schritt oder der Rahmen, hinter beziehungsweise in dem es stehen soll |
| zwei Schritte verbinden | vom Ausgang auf den Schritt ziehen | den Ausgang anklicken, dann den Schritt; oder den Schritt wählen, in der Bibliothek „Verbindung“ und dann den nächsten Schritt |
| einen Wert eines Objekts mit einem Schritt verbinden | vom Anschlusspunkt der Zeile der Karte auf den Schritt ziehen | den Anschlusspunkt der Zeile anklicken, dann den Schritt; oder in den Bausteinen den Wert wählen; oder in der Eigenschaftenansicht des Schritts unter „Verwendete Werte“ ein Objekt und einen Wert wählen und „Verbinden“ klicken |
| das Element der ersten Verwendung eines Objekts wählen | den ersten Wert des Objekts auf den Schritt ziehen | in der Eigenschaftenansicht des Objekts unter „Element der ersten Verwendung“ den Schritt wählen |
| die Eigenschaft oder Methode eines verwendeten Werts ändern, „Aktualisieren“ einschalten | – | in der Eigenschaftenansicht des Schritts unter „Verwendete Werte“ wählen |
| einen Schritt in die Order- und Positionsverwaltung einer Order oder heraus bringen | den Schritt in den Rahmen oder heraus ziehen | in der Eigenschaftenansicht unter „Gehört zu“ wählen |
| einen Schritt einem Abschnitt zuordnen | – | in der Eigenschaftenansicht unter „Abschnitt“ wählen |
| eine Karte verschieben | die Karte ziehen | nicht nötig: pipwerk Studio legt die Karte neben den Schritt, der sie zuerst verwendet |
| eine Verbindung löschen | – | die Linie anklicken, dann in der Eigenschaftenansicht „Verbindung löschen“ |
| die Ansicht ändern | die Fläche ziehen | „Verkleinern“, „Vergrößern“, „Alles zeigen“ und „Zum Anfang“ in der Werkzeugleiste |

In schmalen Fenstern (unter 700 Pixel) wechseln Sie mit der Leiste unten zwischen Fläche, Bibliothek und Eigenschaften. Fügen Sie in der Bibliothek ein Element ein, sagt eine Meldung, dass es auf der Zeichenfläche steht („… ist eingefügt. Sie sehen es auf der Zeichenfläche.“).

## 10. Bekannte Einschränkungen

- Vorlagen lassen sich in der Oberfläche noch nicht neu anlegen, öffnen, ändern, speichern oder löschen, und aus einem Objekt einer Strategie lässt sich noch keine Vorlage machen. Gespeicherte Vorlagen sind in der Elementbibliothek zu sehen und lassen sich einfügen (Abschnitt 6.10). Entwickler legen Vorlagen über die Programmschnittstelle an; das beschreibt die technische Dokumentation.
- Einen geführten Aufbau für neue Strategien gibt es nicht. Der Hinweis der leeren Strategie nennt den ersten Schritt (Abschnitt 6.1).
- Mit `--host` kann jeder im Netz Strategien, Vorlagen und das Objektverzeichnis ändern; es gibt keine Anmeldung (Abschnitt 2).
- pipwerk Studio besitzt noch kein Installationspaket für Anwender.
- Die Sprache gilt für pipwerk Studio insgesamt und nicht für einzelne Personen.
- Weitere Sprachen als Deutsch und Englisch sind nicht verfügbar.
- Wurde pipwerk Studio mit dem Startskript gestartet, geht die gespeicherte Sprache beim Beenden mit `components/pipwerk-studio/scripts/testenv stop` verloren; nach einem erneuten Start ist Deutsch eingestellt (Abschnitt 2).
- Dabei entfernt `testenv stop` auch die gespeicherten Strategien und Vorlagen, solange das Objektverzeichnis unter `components/pipwerk-studio/.testenv/` liegt. Wurde es auf einen anderen Ordner geändert, bleiben die Dateien dort erhalten.
- Beim Start von Hand kann der Stand im Dialog und in der Fußzeile vom laufenden Programm abweichen (Abschnitt 4).
- Strategien werden nicht ausgeführt. Die Prüfung prüft nur.
- Eine Formel, die die Bausteine nicht zeigen können (ein Schreibfehler oder eine zu tiefe Verschachtelung), steht nur in der Formelansicht.

## 11. Glossar

| Begriff | Bedeutung |
| --- | --- |
| Stand | Die Fassung des Programms, aus der pipwerk Studio aufgebaut oder gestartet wurde. Er ist eine Zeichenfolge aus Ziffern und Buchstaben und keine Versionsnummer. In der Fußzeile stehen ihre ersten sieben Zeichen, im Dialog alle vierzig mit Datum. |
| Lizenz | Die Bedingungen, unter denen die Software genutzt, weitergegeben und verändert werden darf. pipwerk Studio steht unter der GNU General Public License, Version 3. |
| Server | Der Teil von pipwerk Studio, der außerhalb des Browsers auf dem Rechner läuft und zum Beispiel die gewählte Sprache und die Strategien speichert. |
| Oberfläche | Der Teil von pipwerk Studio, den Sie im Webbrowser sehen und bedienen. |
| Objektverzeichnis | Der Ordner auf dem Rechner, in dem pipwerk Studio jede Strategie und jede Vorlage als eine Datei ablegt. Die Dateien sind die einzige Quelle der Strategien und Vorlagen. |
| Datenbank | Der Speicher, in dem der Server Einstellungen dauerhaft ablegt, zum Beispiel die gewählte Sprache und den Ort des Objektverzeichnisses. Die Strategien und Vorlagen selbst liegen als Dateien im Objektverzeichnis, nicht in der Datenbank. |
| Zeichenfläche | Der Bereich der Oberfläche in der Mitte, auf dem Sie die Elemente einer Strategie anordnen und verbinden. |
| Elementbibliothek | Der Bereich der Oberfläche links mit den Einträgen, die Sie in die Strategie einfügen (anklicken oder auf die Zeichenfläche ziehen), in Gruppen: „Ablaufsteuerung“, „Berechnung“, „Indikatoren“, „Trends“, „Marktdaten“, „Konto“, „Aktionen“ und „Regeln und Regelwerke“. |
| Eigenschaftenansicht | Der Bereich der Oberfläche rechts, in dem Sie die Eigenschaften des gewählten Elements, Rahmens, Abschnitts, der gewählten Verbindung oder der Strategie sehen und ändern, mit Regeln, verwendeten Werten und den Befunden der Prüfung. Hinweise und Meldungen stehen nur hier. |
| Element | Alles, was Sie auf die Zeichenfläche legen: ein Auslöser, ein Schritt des Ablaufs (zum Beispiel Bedingung, Berechnung, Order aufgeben) oder ein Objekt (zum Beispiel ein EMA). |
| Schritt | Ein Element des Ablaufs auf der Zeichenfläche: ein Auslöser oder ein Element wie Bedingung, Berechnung oder Order aufgeben. Ein Schritt ist ein Kasten mit Ausgängen. |
| Auslöser | Ein Element, das festlegt, bei welchem Ereignis die Strategie oder eine Order- und Positionsverwaltung ausgewertet wird, zum Beispiel beim Schluss einer Kerze oder bei jedem Tick. Auslöser sind freiwillig. |
| Objekt | Etwas, mit dem Sie als Händler arbeiten und das Werte liefert, zum Beispiel ein Indikator, ein Trend, die Kerze oder eine Regel. Wird ein Objekttyp (zum Beispiel EMA) oder eine Vorlage in eine Strategie eingefügt, entsteht dort ein eigenes Objekt mit einem Namen, den Sie vergeben. Es ist eine vollständige Kopie und gehört nur dieser Strategie; Ändern oder Löschen der Vorlage ändert es nicht. |
| Karte | Die Darstellung eines Objekts (Indikator, Trend, Kerze …) neben dem Schritt, der es zuerst verwendet. Jede Zeile ist ein Wert oder eine Methode des Objekts. |
| Herkunft | Die Angabe, woraus ein Objekt entstanden ist, zum Beispiel „EMA 20, aus Objekttyp EMA“ oder „…, aus Vorlage Risiko je Trade“. |
| Vorlage | Ein wiederverwendbares Objekt, zum Beispiel eine Regel. Es wird einmal angelegt und gespeichert und lässt sich in Strategien verwenden. |
| Verbindung | Eine Linie zwischen zwei Elementen. Sie bedeutet „danach folgt“. Sie beginnt an einem Ausgang eines Elements und endet am nächsten Schritt. Eine gewählte Verbindung löschen Sie in ihrer Eigenschaftenansicht. |
| Order- und Positionsverwaltung | Der Teil des Ablaufs, der nach dem Ausgang „gestellt“ von „Order aufgeben“ läuft und sich um die gestellte Order und die daraus entstehende Position kümmert. Auf der Zeichenfläche ist sie ein Rahmen unter dem Element. Elemente im Rahmen gehören zu ihr. Englisch „order and position management“. |
| Abschnitt | Eine benannte Gruppe von Schritten eines Ablaufs (des Hauptablaufs oder einer Order- und Positionsverwaltung), die sich auf der Zeichenfläche ein- und ausklappen lässt. Ein Schritt gehört höchstens zu einem Abschnitt. Ein Abschnitt ändert die Bedeutung der Strategie nicht (Abschnitt 6.2). |
| Strategieparameter | Ein Wert, den Sie an einer Stelle der Strategie festlegen und überall in ihr verwenden. Formeln sprechen ihn als `Strategie.<Name>` an. |
| Eingang | Ein Wert eines Objekts, den ein Element verwendet: die Eigenschaft oder die Methode des Objekts mit den Werten ihrer Argumente, dazu die Angabe „Aktualisieren“. Er entsteht, wenn Sie den Wert in den Bausteinen wählen, eine Linie von der Karte zum Element ziehen oder klicken oder ihn unter „Verwendete Werte“ verbinden. Er hält fest, dass Sie den Wert verbunden haben, auch bevor eine Formel ihn verwendet. Er ändert die Bedeutung einer Formel nicht, außer durch „Aktualisieren“. |
| Element der ersten Verwendung | Das Element, mit dem Sie ein Objekt zuerst verbunden haben, oder, wenn Sie das nicht getan haben, das erste Element im Ablauf, dessen Formel das Objekt nennt. Das Objekt ermittelt seine Werte, wenn der Ablauf dieses Element erreicht; spätere Verwendungen erhalten diese Werte, aber nur, wenn jeder Weg zu ihnen über dieses Element führt. Die Karte liegt neben diesem Element. Seine Eigenschaftenansicht nennt es unter „Element der ersten Verwendung“. |
| Verwendete Werte | Der Abschnitt der Eigenschaftenansicht eines Elements mit den Werten von Objekten, die das Element verwendet. Je Wert wählen Sie Eigenschaft oder Methode, bei einer Methode die Argumente, und, wo das Objekt es vorsieht, „Aktualisieren“ (Abschnitt 6.3). |
| Aktualisieren | Ein Schalter bei einem verwendeten Wert: Das Objekt ermittelt seine Werte an diesem Element neu, bevor es sie übergibt. Er steht nur bei Objekten, die das können. Ohne ihn erhält das Element den Stand, den das Objekt am Element der ersten Verwendung hatte. |
| Wertlinie | Die Linie von der Zeile einer Karte zu einem Schritt, der den Wert verwendet. Durchgezogen ist die Linie zum Element der ersten Verwendung, gestrichelt die zu einer weiteren Verwendung; beide haben die Farbe des Objekts. Die Beschriftung nennt die Werte. |
| Weitere Verwendungen | Der Umschalter der Werkzeugleiste für die gestrichelten Wertlinien: Alle, Auswahl oder Aus. |
| Legende | Die Erklärung der Linien auf der Zeichenfläche (Abschnitt 3.4). |
| Woher kommt der Wert? | Die Frage unter der Beschriftung eines Felds der Eigenschaftenansicht. Die Antworten sind „fest eingeben“, „aus einem Strategieparameter“, „von einem anderen Element“, „aus einer Formel“ und „beim Start der Strategie festlegen“ (Abschnitt 6.4). |
| Baustein | Ein Stück einer Formel, das Sie in einer Liste wählen, statt es zu schreiben: ein Wert (die Eigenschaft eines Objekts oder das Ergebnis einer Methode mit ihren Argumenten), eine Zahl, ein Text, eine Rechnung, eine Fallunterscheidung, eine Funktion (darunter „Vorheriger Wert von“), ein Vergleich oder eine Verknüpfung von Bedingungen. Aus Bausteinen setzt sich eine Formel zusammen (Abschnitt 7.4). |
| leerer Platz | Ein Platz in einer Formel, an dem noch kein Wert gewählt ist („Wert wählen …“). Er macht die Formel unvollständig. Er entsteht auch, wenn Sie ein Objekt entfernen, das die Formel verwendet hat. |
| Formel | Ein kurzer Text, der einen Wert berechnet, zum Beispiel `[EMA 20].Wert > [EMA 50].Wert`. Abschnitt 7 beschreibt die Schreibweise. |
| Formelansicht | Die Ansicht „Formel für Fortgeschrittene“: Die Formel als Text, mit Farben, markierten Fehlern und Vorschlägen (Abschnitt 7.4). |
| Satz | Die Formel als lesbarer Satz, zum Beispiel „EMA 20 ist größer als EMA 50“. Er steht auf der Zeichenfläche und in der Eigenschaftenansicht. |
| Regel | Eine Regel prüft oder bestimmt etwas, zum Beispiel das Volumen einer Order. Sie steht in der Eigenschaftenansicht der Strategie oder eines Elements und hat eine Formel. |
| Regelwerk | Ein Objekt, das mehrere Regeln enthält und eine Formel für das Gesamtergebnis haben kann. |
| bestimmende Regel | Eine Regel, die eine Eigenschaft der Order bestimmt, zum Beispiel das Volumen. Eine Regel, die nichts bestimmt, prüft nur. |
| Vergleich beim Prüfen | Bei einer bestimmenden Regel: wie der aktuelle Wert der Eigenschaft gegen das Ergebnis der Regel geprüft wird: höchstens, mindestens oder gleich. |
| Art des Werts | Die Art eines Werts: Zahl, Ganzzahl, Prozent, Wahrheitswert, Text, Auswahl, Zeiteinheit, Zeitpunkt, Datum, Formel oder Objekt. Die Erklärung eines Felds nennt sie. |
| Zeiteinheit | Die Dauer einer Kerze, zum Beispiel M15 (15 Minuten), H1 (1 Stunde) oder D1 (1 Tag). |
| nicht verfügbar | Der Wert einer Formel, die eine Eigenschaft anspricht, die das Objekt im Zusammenhang der Auswertung nicht hat, zum Beispiel `Order.Limitpreis` bei einer Stop-Order. Jede Rechnung damit ergibt wieder „nicht verfügbar“. `ISNA` und `IFNA` fangen ihn ab (Abschnitt 7.5). |
| leer | Der Wert einer Eigenschaft ohne Wert, zum Beispiel das vorletzte Hoch eines ZigZag ohne zweites Hoch. Rechnen und Vergleichen mit „leer“ ist ein Fehler der Auswertung. `ISBLANK` fragt danach (Abschnitt 7.5). Nicht zu verwechseln mit „nicht verfügbar“. |
| Prüfung | Die Prüfung einer Strategie auf Widersprüche und Lücken, zum Beispiel eine Formel mit Schreibfehler oder einen unbekannten Namen. Sie liefert Befunde. |
| Befund | Ein Ergebnis der Prüfung: ein Fehler oder ein Hinweis mit Text, dem betroffenen Element und Feld und dem Weg zur Behebung. Eine Strategie mit Befunden lässt sich trotzdem speichern. |
| Startskript | Das Programm `components/pipwerk-studio/scripts/testenv`, das pipwerk Studio startet, abfragt und beendet (Abschnitt 2). |
| Anschlussnummer | Eine Zahl von 1 bis 65535, unter der ein Programm auf dem Rechner Verbindungen annimmt. Zwei Programme können nicht dieselbe Anschlussnummer verwenden. |
| Netzwerkadresse | Die Zahlenfolge, unter der ein Rechner im Netz erreichbar ist, zum Beispiel `192.168.0.12`. `127.0.0.1` ist die Netzwerkadresse des eigenen Rechners; sie ist nur von ihm selbst aus erreichbar. `0.0.0.0` ist keine einzelne Adresse. Beim Start mit `--host` bedeutet sie: alle Netzwerkadressen dieses Rechners. |
| Programmdateien | Die Ordner und Dateien, aus denen pipwerk Studio besteht. Der oberste Ordner enthält unter anderem die Datei `LICENSE`. |
| Eingabefenster (Terminal) | Ein Fenster, in dem Sie Befehle eintippen und ausführen. |
| Bildschirmleser | Ein Programm, das Menschen mit Sehbehinderung den Inhalt der Seite vorliest. |
