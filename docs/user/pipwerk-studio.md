# pipwerk Studio – Anwenderdokumentation

## Dokumentstatus

- status: `draft`
- stand: 2026-10-18
- komponente: `pipwerk-studio`

## 1. Wozu pipwerk Studio dient

pipwerk Studio ist der grafische Strategiedesigner von Pipwerk. Mit ihm werden Handelsstrategien auf einer Zeichenfläche zusammengestellt und bearbeitet.

Der derzeitige Stand: In der Oberfläche können Strategien angelegt, auf der Zeichenfläche gestaltet, geprüft, gespeichert, geöffnet, geschlossen und gelöscht werden; Sprache und Objektverzeichnis stellen Sie in den Einstellungen ein. Vorlagen (Indikator, Trend, Regel, Regelwerk) lassen sich in der Oberfläche noch nicht anlegen, ansehen oder löschen; das geht bisher nur über die Web-API (Abschnitt 2, „Web-API ausprobieren“). Strategien werden nicht ausgeführt.

Wo Sie was finden:

| Sie wollen … | Abschnitt |
| --- | --- |
| pipwerk Studio starten | 2 |
| die Oberfläche kennenlernen | 3 |
| Sprache oder Objektverzeichnis einstellen | 5 |
| eine Strategie anlegen, speichern, prüfen, schließen, öffnen oder löschen, Regeln zuordnen | 6 |
| einen Ausdruck schreiben und verstehen, was „leer“ und „nicht verfügbar“ bedeuten | 7 |
| einen Befund der Konsistenzprüfung verstehen und beheben | 8 |
| den Testfall `str-03` (EMA-Trendfolge) selbst aufbauen | 9 |
| den Testfall `str-01` (Scalping Punkt 2 Ausbruch) selbst aufbauen | 10 |

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

Die Web-API (siehe Glossar) von pipwerk Studio legt Strategien und Vorlagen an, liest, ändert und löscht sie und prüft sie. Die Schnittstellenbeschreibung dazu zeigt Ihr Browser unter `http://127.0.0.1:<Port des Hintergrunddienstes>/docs`. Sie erreichen sie nur auf dem Rechner, auf dem die Testumgebung läuft, und nicht über den Port der Oberfläche. Die Seite `/docs` lädt das Programm, das sie darstellt (Swagger UI, Version 5.33.1), aus dem Internet von `cdn.jsdelivr.net`. Ihr Browser prüft die geladenen Dateien an einer festen Prüfsumme. Hat Ihr Browser keinen Zugang zum Internet, bleibt die Seite `/docs` leer; die Adresse `http://127.0.0.1:<Port des Hintergrunddienstes>/openapi.json` und die Endpunkte selbst funktionieren trotzdem. Rufen Sie den Hintergrunddienst mit der Adresse `127.0.0.1` oder `localhost` auf; unter einem anderen Namen weist er die Anfrage mit dem Status 400 ab. Die Endpunkte der Web-API beginnen mit `/api/v1/`. Zu jedem Endpunkt können Sie mit „Try it out“ eine Anfrage senden. Die Adressen enthalten die Art des Objekts: `strategies` (Strategien), `indicators` (Indikatoren), `trends` (Trends), `rules` (Regeln), `rulesets` (Regelwerke).

1. `GET /api/v1/element-types` liefert alle Typen mit ihren deutschen und englischen Namen, die mitgelieferte Regelvorlage „Risiko je Trade“ und die Funktionen für Ausdrücke.
2. `POST /api/v1/strategies` legt eine Strategie an. Als „Request body“ fügen Sie den Inhalt einer Datei aus `contracts/strategies/v1/testcases/` ein, zum Beispiel `str-03.strategy.json`. Die Antwort nennt die neue Kennung der Strategie, das gespeicherte Dokument und die Befunde der Konsistenzprüfung. Für die beiden Testfälle ist die Liste der Befunde leer. Die Kennung im Dokument ersetzt pipwerk Studio durch eine neue.
3. `GET /api/v1/strategies` nennt die gespeicherten Strategien, `GET /api/v1/strategies/{id}` liefert eine Strategie. Für `{id}` tragen Sie die Kennung aus Schritt 2 ein.
4. `PUT /api/v1/strategies/{id}` speichert eine geänderte Strategie, auch wenn die Konsistenzprüfung Befunde meldet. Das Feld `id` auf der obersten Ebene des Dokuments im „Request body“ muss die Kennung aus dem Pfad enthalten; ersetzen Sie sie bei Bedarf im eingefügten Text, nicht in der Datei. Die Felder `id` der Elemente bleiben unverändert.
5. `POST /api/v1/check` prüft ein Dokument jeder Art, ohne es zu speichern. Beispiele dafür stehen im Unterabschnitt „Befunde der Konsistenzprüfung“.
6. `GET /api/v1/rules/{id}/usages` nennt die Strategien und Vorlagen, die eine Instanz aus dieser Vorlage enthalten. Das Löschen einer Vorlage mit `DELETE` ändert diese Strategien nicht. Den ganzen Ablauf mit einer Vorlage beschreibt der Unterabschnitt „Vorlage anlegen, ändern und löschen“.

pipwerk Studio speichert jedes Objekt als eine Datei im Objektverzeichnis (siehe Glossar). In der Testumgebung liegt es unter `components/pipwerk-studio/.testenv/objects`. Ein Dokument, das dem Schema nicht entspricht, zum Beispiel mit einem zusätzlichen Feld, lehnt pipwerk Studio mit dem Status 422 ab. Ein Dokument ist höchstens 2 MiB groß, sonst antwortet pipwerk Studio mit dem Status 413. Eine Datei im Objektverzeichnis, die sich nicht lesen lässt, steht in der Liste mit dem Feld `unreadable` und dem Wert `true` (auf Deutsch: nicht lesbar). pipwerk Studio verändert sie nie; sie lässt sich über die Web-API weder lesen noch ändern noch löschen (Status 409). Entfernen Sie eine solche Datei im Dateisystem.

#### Beispieldokumente

Die Beispieldokumente für die folgenden beiden Unterabschnitte liegen als Dateien im Verzeichnis `contracts/strategies/v1/examples/` des Arbeitsverzeichnisses. Öffnen Sie eine Datei in einem Texteditor, kopieren Sie den ganzen Inhalt und fügen Sie ihn im „Request body“ ein. Die Dateien im Arbeitsverzeichnis ändern Sie nie und speichern sie nicht neu. Auch Kopien von Antworten und geänderte Dokumente speichern Sie nicht als neue Datei im Arbeitsverzeichnis, sondern nur außerhalb davon oder gar nicht. Eine geänderte oder neue Datei wäre eine nicht committete Änderung, und der nächste Start der Testumgebung bräche ab (Abschnitt 2). Muss in einem Schritt etwas im Text ersetzt werden, ersetzen Sie es im Text, den Sie im „Request body“ eingefügt haben, nicht in der Datei. Die beiden Strategien `str-01` und `str-03`, auf denen die Beispiele aufbauen, liegen im Verzeichnis `contracts/strategies/v1/testcases/`. Die Beispiele verwenden `str-03` (Titel „EMA-Trendfolge“).

#### Vorlage anlegen, ändern und löschen

Diese Schritte zeigen, dass eine Vorlage angelegt, geändert und gelöscht werden kann und dass eine Strategie, die eine Instanz der Vorlage enthält, davon unberührt bleibt. Eine Instanz ist eine vollständige Kopie der Vorlage innerhalb der Strategie (siehe Glossar). Die Vorlage ist hier eine Regel (Objekttyp `Regel`).

1. `POST /api/v1/rules`: Fügen Sie den Inhalt der Datei `regel-vorlage.rule.json` ein. Erwartet: Status 201, `findings` ist leer. Notieren Sie die Kennung aus dem Feld `id` der Antwort. Sie heißt im Folgenden `<Kennung der Vorlage>`.
2. `POST /api/v1/strategies`: Fügen Sie den Inhalt der Datei `str-03.strategy.json` ein (Verzeichnis `testcases`). Erwartet: Status 201, `findings` ist leer. Notieren Sie die Kennung aus dem Feld `id`. Sie heißt im Folgenden `<Kennung der Strategie>`.
3. `GET /api/v1/strategies/{id}` mit `<Kennung der Strategie>`: Kopieren Sie die ganze Antwort („Response body“). Das ist das Dokument der Strategie. Bearbeiten Sie die Kopie in Schritt 4 in einem Texteditor, ohne sie im Arbeitsverzeichnis zu speichern.
4. Fügen Sie in das kopierte Dokument (nicht in eine Datei des Arbeitsverzeichnisses) eine Instanz der Vorlage ein. Suchen Sie die Liste `"rules"` auf der obersten Ebene des Dokuments, direkt unter `"parameters"` (nicht die Listen `"rules"` in den Elementen). Sie enthält einen Eintrag mit `"name": "risiko"`. Fügen Sie nach dem Ende dieses Eintrags ein Komma und den folgenden Eintrag ein. Ersetzen Sie dabei `<Kennung der Vorlage>` durch die Kennung aus Schritt 1 (mit den Anführungszeichen):

   ```json
   {
     "name": "mindest",
     "object_type": "Regel",
     "origin": {
       "object_type": "Regel",
       "template_id": "<Kennung der Vorlage>",
       "template_title": "Mindestvolumen"
     },
     "expression": "Order.volumen >= Instrument.mindestvolumen"
   }
   ```

5. `PUT /api/v1/strategies/{id}` mit `<Kennung der Strategie>`: Fügen Sie das geänderte Dokument aus Schritt 4 im „Request body“ ein. Erwartet: Status 200, `findings` ist leer.
6. `GET /api/v1/rules/{id}/usages` mit `<Kennung der Vorlage>`: Erwartet: Status 200 und `usages` mit genau einem Eintrag. Er hat `art` mit `strategies`, die Kennung der Strategie und den Titel „EMA-Trendfolge“. `skipped_unreadable` ist 0.
7. `GET /api/v1/strategies/{id}` mit `<Kennung der Strategie>`: Kopieren Sie die Antwort („Response body“) und heben Sie sie in einem Texteditor auf, ohne sie im Arbeitsverzeichnis zu speichern, weder in einer vorhandenen noch in einer neuen Datei. Sie dient als Vergleich in Schritt 10.
8. `PUT /api/v1/rules/{id}` mit `<Kennung der Vorlage>`: Fügen Sie den Inhalt der Datei `regel-vorlage-geaendert.rule.json` im „Request body“ ein. Ersetzen Sie dann im eingefügten Text die Kennung im Feld `id` auf der obersten Ebene des Dokuments durch `<Kennung der Vorlage>`. Die Datei im Arbeitsverzeichnis bleibt unverändert. Die Kennung wird ersetzt, weil die Kennung im Dokument die im Pfad sein muss. Erwartet: Status 200. Der Titel lautet jetzt „Mindestvolumen doppelt“.
9. `DELETE /api/v1/rules/{id}` mit `<Kennung der Vorlage>`: Erwartet: Status 204. `GET /api/v1/rules/{id}` mit derselben Kennung antwortet danach mit dem Status 404.
10. `GET /api/v1/strategies/{id}` mit `<Kennung der Strategie>`: Die Antwort ist Zeichen für Zeichen die aus Schritt 7. Die Instanz „mindest“ steht weiter in der Strategie, auch nach dem Ändern (Schritt 8) und dem Löschen (Schritt 9) der Vorlage.

#### Befunde der Konsistenzprüfung

Die Konsistenzprüfung meldet Befunde (siehe Glossar). `POST /api/v1/check` prüft ein Dokument und speichert es nicht. Die Antwort enthält die Liste `findings`. Jeder Befund hat die Felder `level` (`error` für einen Fehler, `hint` für einen Hinweis), `code` (die Art des Befunds), `element` (die Kennung des betroffenen Elements oder `null`), `subject` und `details`.

Die Strategie `str-03` hat keinen Befund. Sieben abgewandelte Fassungen liegen im Verzeichnis `examples`. Jede ist `str-03` mit genau einer Änderung. Neue Elemente sind dabei mit allen Feldern ausgeschrieben, so wie pipwerk Studio sie speichert; die Tabelle nennt nur die wesentlichen Angaben. Fügen Sie die Datei bei `POST /api/v1/check` im „Request body“ ein. Die Tabelle nennt die Änderung und den Befund, den die Prüfung meldet. Das Element „Kreuzen“ ist das Element vom Typ `flow.condition` mit dem Titel „Kreuzen“ (Kennung `7e1ab090-5a18-5414-9f00-5541c0e4b325`); sein Ausdruck steht im Feld `parameters.ausdruck.value`.

| Nr. | Datei | Änderung an `str-03` | Befund |
| --- | --- | --- | --- |
| 1 | `str-03-ohne-ausloeser.strategy.json` | Entfernt ist das Element „Kerzenschluss“ vom Typ `trigger.candle_close` mit `"management_of": null` (Kennung `fd3b87fb-a152-51fa-bd12-4579eba0a33d`) und die Verbindung, die von ihm ausgeht. | `flow.no_incoming` (Fehler) für „Kreuzen“, weil das erste Element des Ablaufs ohne Auslöser keine eingehende Verbindung hat; `flow.no_order_reachable` (Hinweis), weil von keinem Auslöser aus ein Element „Order aufgeben“ erreichbar ist; `candle.no_instance` (Fehler) für das Element „Stop-Loss“ (Kennung `d68f936b-4e65-5d0c-a4eb-a1438baaa470`), weil sein Ausdruck `Kerze` verwendet und kein Auslöser „Kerzenschluss“ das Element erreicht. Eine Strategie ohne Auslöser ist für sich kein Befund |
| 2 | `str-03-schreibfehler.strategy.json` | Der Ausdruck von „Kreuzen“ lautet `ema20.wert > > 1`. | `expression.invalid` (Fehler) für „Kreuzen“ mit `details.issue` gleich `syntax` und der Stelle in `details.start` und `details.end`: 13 und 14 (das zweite `>`). Gezählt wird ab 0 und in Zeichen des Ausdrucks; `start` ist das erste Zeichen der Stelle, `end` die Stelle hinter ihrem letzten Zeichen |
| 3 | `str-03-unbekannter-name.strategy.json` | Der Ausdruck von „Kreuzen“ lautet `gibtesnicht.wert > 1`. | `expression.invalid` (Fehler) für „Kreuzen“ mit `details.issue` gleich `unknown_name` und `details.name` gleich `gibtesnicht` |
| 4 | `str-03-order-im-hauptablauf.strategy.json` | Der Ausdruck von „Kreuzen“ lautet `Order.volumen > 0`. Das Element liegt im Hauptablauf. | `expression.order_outside_management` (Fehler) für „Kreuzen“ |
| 5 | `str-03-order-im-indikator.strategy.json` | Neu in `elements`: ein Element vom Typ `Indikator` (Kennung `00000000-0000-4000-8000-0000000000aa`) mit der Instanz `eigener_indikator`. Sie enthält eine Regel `regel` mit dem Ausdruck `Order.volumen > 0`. | `rule.order_in_indicator` (Fehler) für dieses Element, `subject` gleich `eigener_indikator.regel` |
| 6 | `str-03-order-aendern-ausserhalb.strategy.json` | Neu in `elements`: ein Element vom Typ `flow.modify_order` (Kennung `00000000-0000-4000-8000-0000000000aa`), das zu keiner Verwaltung gehört, und eine Verbindung vom Element „Kerzenschluss“ mit der Kennung `fd3b87fb-a152-51fa-bd12-4579eba0a33d` (Ausgang `weiter`) zu ihm. | `flow.management_only` (Fehler) für das neue Element |
| 7 | `str-03-unbekannter-elementtyp.strategy.json` | Neu in `elements`: ein Element mit dem Typ `x.unbekannt` (Kennung `00000000-0000-4000-8000-0000000000bb`). | `type.unknown` (Fehler) für das neue Element, `details.type` gleich `x.unbekannt` |

Zu den Änderungen 2 bis 7 meldet die Prüfung nur den genannten Befund und keinen weiteren. Zu Änderung 1 meldet sie die drei genannten Befunde.

Befunde verhindern das Speichern nicht. So speichern Sie eine Fassung mit Befunden:

1. `POST /api/v1/strategies` mit dem Inhalt von `str-03.strategy.json` legt die Strategie an. Notieren Sie die Kennung aus dem Feld `id`.
2. `PUT /api/v1/strategies/{id}` mit dieser Kennung: Fügen Sie den Inhalt einer Datei aus der Tabelle im „Request body“ ein. Ersetzen Sie dann im eingefügten Text die Kennung im Feld `id` auf der obersten Ebene des Dokuments durch die notierte Kennung. Die Felder `id` der Elemente bleiben unverändert. Die Datei im Arbeitsverzeichnis bleibt unverändert. Erwartet: Status 200. Die Antwort enthält den Befund aus der Tabelle in `findings`.
3. `GET /api/v1/strategies/{id}` liefert die gespeicherte Fassung mit der Änderung.

`PUT` speichert immer im aktuellen Objektverzeichnis. Liegt dort noch keine Datei mit dieser Kennung, zum Beispiel weil das Objektverzeichnis ohne Verschieben der Dateien geändert wurde, legt `PUT` die Datei an (und das Verzeichnis, falls es fehlt). Dann ist der Status 201; beim Ersetzen einer vorhandenen Datei ist er 200. Die Antwort enthält in beiden Fällen die Befunde. Liegt im Objektverzeichnis unter dem Namen der Kennung ein Eintrag, der keine lesbare gewöhnliche Datei dieser Art ist (zum Beispiel eine Verknüpfung oder ein Verzeichnis), oder liegt dort irgendein Eintrag mit derselben Kennung für eine andere Art von Objekt (zum Beispiel eine Datei, eine Verknüpfung oder ein Verzeichnis), antwortet `PUT` mit dem Status 409 und schreibt nichts.

### Zweiter Weg: Entwicklungsbetrieb

Im Entwicklungsbetrieb (siehe Glossar in Abschnitt 12) starten Sie den Hintergrunddienst und die Oberfläche von Hand in zwei getrennten Terminals (siehe Glossar). Die Schritte stehen in der technischen Dokumentation unter `docs/technical/pipwerk-studio.md` im Abschnitt „Einrichtung und Start im Entwicklungsbetrieb“. Änderungen an den Dateien wirken dort sofort. Deshalb läuft pipwerk Studio im Entwicklungsbetrieb nicht notwendig aus einem Commit. Was das für die Anzeige des Stands bedeutet, steht in Abschnitt 4. Zu „nicht committete Änderung“ siehe Glossar in Abschnitt 12.

Nach dem Start wird pipwerk Studio in einem Webbrowser unter der Adresse `http://127.0.0.1:5173/` geöffnet.

## 3. Aufbau der Oberfläche

Die Oberfläche besteht aus der Kopfzeile oben, drei Bereichen in der Mitte (Elementbibliothek, Zeichenfläche, Eigenschaftenansicht) und der Fußzeile unten. Dieser Abschnitt beschreibt, was Sie sehen. Wie Sie damit arbeiten, steht in Abschnitt 6.

Oben steht die Kopfzeile. Sie zeigt links den Namen „pipwerk Studio“ und das Menü mit den Einträgen „Neue Strategie“, „Öffnen“, „Speichern“, „Prüfen“, „Schließen“, „Löschen“ und „Einstellungen“. Ohne geöffnete Strategie sind nur „Neue Strategie“, „Öffnen“ und „Einstellungen“ bedienbar. Rechts steht, sobald die Strategie geprüft oder gespeichert wurde, die Zahl der Befunde („Befunde: 3“; ein Hinweistext nennt Fehler und Hinweise getrennt), und die Schaltfläche „Über pipwerk Studio“ (auf Englisch „About pipwerk Studio“). Sie öffnet den Dialog, den Abschnitt 4 beschreibt. Der Name lautet in Deutsch und in Englisch gleich. Auch der Titel der Seite im Browser lautet „pipwerk Studio“. Die Auswahl der Sprache steht nicht mehr in der Kopfzeile, sondern in den Einstellungen (Abschnitt 5).

Links liegt die Elementbibliothek mit den Gruppen „Auslöser“, „Elemente des Ablaufs“, „Objekte der Anwendung“, „Objekttypen“, „Mitgelieferte Vorlagen“ und „Gespeicherte Vorlagen“. Einträge ziehen Sie mit der Maus auf die Zeichenfläche. Mit der Tastatur wählen Sie einen Eintrag (Tabulatortaste, Leertaste) und fügen ihn mit der Eingabetaste in die Mitte der sichtbaren Zeichenfläche ein. Einträge mit der Marke „für Regeln“ gehören nicht auf die Zeichenfläche, sondern zu den Regeln der Strategie oder eines Elements.

In der Mitte liegt die Zeichenfläche. Sie ist mit einem Punktraster hinterlegt. Ohne geöffnete Strategie steht oben links der Hinweis „Die Arbeitsfläche ist leer.“ Die Zeichenfläche kann mit der Maus verschoben und mit dem Mausrad vergrößert oder verkleinert werden. Elemente zeigen ihre Bezeichnung (Objekte den Namen ihrer Instanz) und, wenn der Typ Ausgänge hat, Anschlüsse: den Eingang links und die Ausgänge rechts. Eine Verbindung ziehen Sie von einem Ausgang zu einem Element, auch zurück zu einem früheren. Verbindungen und Elemente löschen Sie, indem Sie sie auswählen und die Entf-Taste drücken. Eine neue Strategie hat eine leere Zeichenfläche: pipwerk Studio legt keinen Auslöser an, Auslöser (Auslöser sind freiwillig) legen Sie wie alle anderen Elemente aus der Elementbibliothek auf die Zeichenfläche. „Prüfen“ meldet für die leere Strategie keinen Befund, in der Kopfzeile steht „Befunde: 0“. Die Verwaltung einer Order erscheint als Rahmen unterhalb von „Order aufgeben“; er hängt am Ausgang „gestellt“ des Elements. Von diesem Ausgang ziehen Sie keine Verbindung zu einem Element; welche Elemente zur Verwaltung gehören, bestimmt der Rahmen. Ein Element, das Sie in den Rahmen ziehen, gehört zu dieser Verwaltung, eines, das Sie herausziehen, nicht mehr. Der Rahmen lässt sich mit dem Pfeil in seiner Kopfzeile ein- und aufklappen; eingeklappt sind seine Elemente verborgen und bleiben in der Strategie. Ein Element mit Fehler ist rot, eines mit Hinweis orange umrandet (zusätzlich steht das Wort „Fehler“ beziehungsweise „Hinweis“ am Element). Ein Element, dessen Typ pipwerk Studio nicht kennt, ist rot umrandet und zeigt die Kennung seines Typs; es lässt sich verschieben, als Ziel verbinden und löschen, seine Werte sind nur lesbar und bleiben beim Speichern unverändert.

Rechts liegt die Eigenschaftenansicht. Sie zeigt das ausgewählte Element, die ausgewählte Regel oder, nach einem Klick auf die leere Zeichenfläche, die Strategie (Bezeichnung, Beschreibung, Parameter, Regeln). Die Eingaben entstehen aus der Beschreibung des Typs: je Parameter eine Eingabe nach dem Datentyp (zum Beispiel Zahl, Prozent, Wahrheitswert, Auswahl, Zeiteinheit, Datum) und die Wahl der Bindungsart (fester Wert, Parameter, Ausdruck, bei der Anwendung). Zahlen schreiben Sie mit Punkt oder Komma als Dezimaltrenner, auch ohne Ziffer vor dem Trenner (`.5`), aber ohne Exponent (`1e3` gilt nicht); gilt eine Eingabe nicht, ist das Feld markiert, und darunter steht, welche Schreibweise gilt. Parameter, die nur bei einem bestimmten Wert eines anderen gelten, erscheinen erst dann. Bei einer Order stehen nur die Eigenschaften, die Sie belegen. Eine Instanz nennt ihre Herkunft („ema20, aus Objekttyp EMA“). Bei der Eingabe eines Ausdrucks schlägt pipwerk Studio nach einem Namen und einem Punkt die Eigenschaften dieses Objekts vor, nach `Strategie.` die Strategieparameter der geöffneten Strategie (mit den Pfeiltasten und der Eingabetaste oder mit der Maus); darunter steht der Ausdruck mit den Namen in der gewählten Sprache. Geschrieben wird immer die Kennung. Befunde zu einem Element stehen bei dessen Eigenschaften, Befunde zu einer Regel bei der Regel, Befunde ohne Element bei der Strategie.

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

Dieser Abschnitt beschreibt jeden Arbeitsablauf Schritt für Schritt. Er setzt voraus, dass pipwerk Studio läuft und im Browser geöffnet ist (Abschnitt 2). Die Namen der Menüeinträge und Felder stehen hier in der deutschen Anzeige. Bei englischer Anzeige gelten die englischen Namen (Abschnitt 5). Das Menü steht oben links in der Kopfzeile.

### 6.1 Strategie anlegen

1. Wählen Sie im Menü „Neue Strategie“. Die Zeichenfläche ist leer. pipwerk Studio legt kein Element an, auch keinen Auslöser. Rechts zeigt die Eigenschaftenansicht die Strategie (Überschrift „Strategie“). Gespeichert ist noch nichts.
2. Tragen Sie im Feld „Bezeichnung“ den Namen der Strategie ein. Im Feld „Beschreibung“ können Sie einen Text eintragen.
3. Legen Sie die Strategieparameter an. Ein Strategieparameter ist ein Wert, den Sie an einer Stelle festlegen und in der ganzen Strategie verwenden, zum Beispiel die Handelszeiteinheit (siehe Glossar in Abschnitt 12).
   1. Wählen Sie unter „Parameter“ die Schaltfläche „Parameter hinzufügen“. Es erscheint eine Zeile.
   2. Tragen Sie im Feld „Name des Parameters 1“ den Namen ein. Ein Name besteht aus Buchstaben ohne Umlaute (`A` bis `Z`, `a` bis `z`), Ziffern und `_` und beginnt mit einem Buchstaben oder `_`.
   3. Wählen Sie im Feld „Datentyp von …“ den Datentyp: Zahl, Ganzzahl, Prozent, Wahrheitswert, Text, Auswahl, Zeiteinheit, Zeitpunkt oder Datum. Bei „Auswahl“ tragen Sie im Feld „Werte von …“ die erlaubten Werte durch Komma getrennt ein.
   4. Tragen Sie im Feld „Wert von …“ den Wert ein oder wählen Sie ihn. Prozent geben Sie als Prozent ein (`1` bedeutet 1 %). Setzen Sie stattdessen den Haken „bei der Anwendung“, wenn der Wert erst bei der Anwendung der Strategie angegeben wird.
   5. „Entfernen“ löscht den Parameter.
4. Legen Sie Elemente auf die Zeichenfläche (Abschnitt 6.2). Auslöser sind freiwillig. Sie legen einen Auslöser wie jedes andere Element aus der Elementbibliothek auf die Zeichenfläche, wenn Sie ihn brauchen.
5. Wählen Sie „Speichern“ (Abschnitt 6.4). Bis dahin liegt die Strategie nur im Browser.

### 6.2 Elemente und Objekte verwenden

**Elementbibliothek.** Links stehen die Einträge in Gruppen:

| Gruppe | Inhalt |
| --- | --- |
| Auslöser | Kerzenschluss, Tick |
| Elemente des Ablaufs | Bedingung, Berechnung, Parameter setzen, Order aufgeben, Order ändern, Order löschen, Position ändern, Position schließen |
| Objekte der Anwendung | Konto, Instrument, Kerze, Tick |
| Objekttypen | zum Beispiel EMA, ATR, Markttechnik, Trend; die Einträge mit der Marke „für Regeln“ (Regel, Regelwerk) gehören nicht auf die Zeichenfläche, sondern zu den Regeln (Abschnitt 6.3) |
| Mitgelieferte Vorlagen | „Risiko je Trade“ (für Regeln) |
| Gespeicherte Vorlagen | Vorlagen aus dem Objektverzeichnis; Sie legen sie bisher über die Web-API an (Abschnitt 2) |

**Auf die Zeichenfläche legen.**

1. Mit der Maus: Ziehen Sie einen Eintrag der Elementbibliothek auf die Stelle der Zeichenfläche, an der das Element liegen soll, und lassen Sie die Maustaste los.
2. Mit der Tastatur: Gehen Sie mit der Tabulatortaste zum Eintrag und drücken Sie die Eingabetaste. Das Element erscheint in der Mitte der sichtbaren Zeichenfläche an einer freien Stelle.
3. Das neue Element ist ausgewählt. Rechts stehen seine Eigenschaften. Ein neues Element liegt nie auf einem anderen.

**Auswählen, verschieben, löschen.** Ein Klick wählt ein Element aus. Ein Klick auf die leere Zeichenfläche wählt die Strategie aus. Ziehen Sie ein Element an eine andere Stelle, um es zu verschieben. Zum Löschen wählen Sie ein Element oder eine Verbindung aus und drücken die Entf-Taste. Löschen Sie ein Element, verschwinden auch die Verbindungen, die zu ihm führen oder von ihm ausgehen. Löschen Sie „Order aufgeben“, verschwindet sein Rahmen, und die Elemente seiner Verwaltung gehören danach zum Hauptablauf. Die Zeichenfläche verschieben Sie mit der Maus; das Mausrad vergrößert und verkleinert die Ansicht. Die Schaltflächen links unten vergrößern und verkleinern die Ansicht ebenfalls und zeigen auf Wunsch die ganze Strategie.

**Verbindungen.** Ein Element des Ablaufs hat links einen Eingang und rechts einen oder mehrere Ausgänge. Jeder Ausgang trägt seinen Namen, zum Beispiel „weiter“ bei einem Auslöser oder „wahr“ und „falsch“ bei einer Bedingung. Ziehen Sie mit der Maus vom Ausgang (Punkt am rechten Rand) zum Element, das danach folgen soll. Es entsteht eine Linie. Eine Verbindung darf auch zu einem früheren Element zurückführen. Ein Auslöser hat keinen Eingang. Objekte (zum Beispiel eine Instanz von EMA) haben weder Eingang noch Ausgang; ihre Eigenschaften sprechen Sie in Ausdrücken an (Abschnitt 7).

**Eigenschaftenansicht eines Elements.** Rechts steht für das ausgewählte Element:

- „Bezeichnung“: der Text, den das Element auf der Zeichenfläche zeigt.
- „Name“ bei Bedingung, Berechnung und bei einem Objekt: der Name, unter dem Ausdrücke es ansprechen. Bei einer Berechnung `einstieg` spricht ein Ausdruck das Ergebnis als `einstieg.ergebnis` an. Bei einem Objekt ist der Name der Name der Instanz.
- „Parameter“: eine Zeile je Parameter des Typs. Ein Stern kennzeichnet einen Pflichtparameter. Pflichtparameter brauchen einen Wert, sonst meldet die Konsistenzprüfung einen Fehler (Abschnitt 8).
- „Eigenschaften der Order“ bei „Order aufgeben“: nur die Eigenschaften, die Sie belegen. Welche das sind, hängt vom gewählten Ordertyp ab.
- „Regeln“ bei Elementen, die Regeln zulassen (Abschnitt 6.3).
- Befunde zum Element (Abschnitt 8).

**Bindungsart.** Bei den meisten Zeilen wählen Sie im Feld „Bindungsart von …“, wie der Wert entsteht:

| Bindungsart | Bedeutung |
| --- | --- |
| nicht belegt | Die Zeile hat keinen Wert. |
| fester Wert | Sie tragen den Wert ein. Die Eingabe richtet sich nach dem Datentyp: Zahl, Ganzzahl und Prozent als Text (Punkt oder Komma als Dezimaltrenner, auch `.5`, kein Exponent wie `1e3`; bei einer unzulässigen Eingabe ist das Feld markiert und darunter steht, welche Schreibweise gilt), Wahrheitswert als Haken, Auswahl und Zeiteinheit als Liste, Zeitpunkt und Datum als Datumsfeld. |
| Parameter | Sie wählen einen Strategieparameter. Der Wert der Zeile ist dann der Wert dieses Parameters. |
| Ausdruck | Sie schreiben einen Ausdruck (Abschnitt 7). |
| bei der Anwendung | Der Wert wird erst bei der Anwendung der Strategie übergeben. |

Erlaubt der Typ nur eine Bindungsart (bei „Bedingung“ und „Berechnung“ nur „Ausdruck“, bei „Ordertyp“ nur „fester Wert“), fehlt das Feld „Bindungsart von …“ und die Eingabe steht sofort da. Parameter, die nur bei einem bestimmten Wert eines anderen Parameters gelten, zum Beispiel „Ablaufzeit“ bei der Gültigkeit „bis Zeitpunkt“, erscheinen erst bei diesem Wert.

**Objekt verwenden.**

1. Ziehen Sie einen Objekttyp (zum Beispiel „EMA“) auf die Zeichenfläche. Es entsteht ein Element, das eine Instanz des Objekttyps zeigt (siehe Glossar in Abschnitt 12). Die Instanz ist eine vollständige Kopie. Sie braucht den Objekttyp nicht mehr.
2. Tragen Sie unter „Name“ den Namen der Instanz ein, zum Beispiel `ema20`, und unter „Bezeichnung“ den Text für die Zeichenfläche, zum Beispiel `EMA 20`.
3. Belegen Sie die Parameter. Parameter mit einem Standardwert haben ihn schon.
4. Die Eigenschaftenansicht nennt die Herkunft der Instanz: „ema20, aus Objekttyp EMA“. Stammt die Instanz aus einer Vorlage, steht dort „…, aus Vorlage <Bezeichnung>“.
5. Eine Instanz als neue Vorlage speichern („Als Vorlage speichern“) kann pipwerk Studio noch nicht.

**Verwaltung einer Order.**

1. Legen Sie „Order aufgeben“ auf die Zeichenfläche. Unter dem Element erscheint ein Rahmen mit der Aufschrift „Verwaltung: Order aufgeben“ (der Text folgt der Bezeichnung des Elements). Er hängt am Ausgang „gestellt“ des Elements. Von diesem Ausgang ziehen Sie keine Verbindung. Welche Elemente zur Verwaltung gehören, bestimmt der Rahmen.
2. Die Verwaltung kann eigene Auslöser haben, zum Beispiel „Tick“ oder „Kerzenschluss“; Auslöser sind auch hier freiwillig. Dazu kommen die Elemente, die sich um die Order kümmern. „Order ändern“, „Order löschen“, „Position ändern“ und „Position schließen“ stehen nur in einer Verwaltung.
3. Legen Sie ein Element in den Rahmen: Ziehen Sie einen Eintrag der Elementbibliothek auf eine Stelle im Rahmen, oder ziehen Sie ein vorhandenes Element in den Rahmen. Das Element gehört zur Verwaltung, wenn seine Mitte im Rahmen liegt. Der Rahmen wächst mit, wenn ein Element hineingelegt wird. Er wird nie kleiner.
4. Ziehen Sie ein Element aus dem Rahmen heraus, gehört es wieder zum Hauptablauf.
5. Ziehen Sie den Rahmen an seiner Kopfzeile, wandern alle Elemente darin mit.
6. Mit dem Pfeil in der Kopfzeile klappen Sie den Rahmen ein („Verwaltung „Order aufgeben“ einklappen“) und wieder auf („… aufklappen“). Eingeklappt sind die Elemente in ihm verborgen. Sie bleiben in der Strategie.
7. Verbindungen gibt es nur innerhalb des Hauptablaufs oder innerhalb einer Verwaltung, nicht dazwischen.

**Unbekannter Typ.** Hat eine Strategie ein Element, dessen Typ pipwerk Studio nicht kennt (zum Beispiel weil das Dokument von einem anderen Programm stammt), ist das Element rot umrandet und zeigt die Kennung seines Typs. Sie können es verschieben, als Ziel einer Verbindung verwenden und löschen. Seine Werte sind nur lesbar und bleiben beim Speichern unverändert.

### 6.3 Regeln zuordnen

Eine Regel prüft oder bestimmt etwas, zum Beispiel das Volumen einer Order. Regeln stehen in der Eigenschaftenansicht der Strategie und bei jedem Element, das Regeln zulässt (zum Beispiel „Order aufgeben“). Der Abschnitt „Regeln“ listet sie in der Reihenfolge, in der sie ausgewertet werden.

1. Eine Vorlage hinzufügen: Wählen Sie im Feld „Vorlage aus der Elementbibliothek“ einen Eintrag, zum Beispiel „Risiko je Trade“, und die Schaltfläche „Hinzufügen“. Mit der Tastatur gehen Sie in der Elementbibliothek zu einem Eintrag mit der Marke „für Regeln“ und drücken die Eingabetaste. Der Eintrag geht an das ausgewählte Element, wenn es Regeln zulässt, sonst an die Strategie. Mit der Maus können Sie den Eintrag auch auf den Abschnitt „Regeln“ ziehen. Es entsteht eine Instanz der Vorlage.
2. Eine neue Regel anlegen: Wählen Sie „Neue Regel“. Es entsteht eine Regel vom Objekttyp „Regel“.
3. Danach zeigt die Eigenschaftenansicht die Regel. Sie zeigt die Herkunft (zum Beispiel „…, aus Vorlage Risiko je Trade“), den „Namen“, die „Parameter der Regel“ (Name, Datentyp, Pflicht, Standardwert; „Parameter hinzufügen“ legt einen an), die „Werte der Parameter“, den „Ausdruck“, die „Bestimmte Eigenschaft der Order“ und den „Vergleich beim Prüfen“. Die Schaltfläche „Zurück zu …“ führt zur Strategie beziehungsweise zum Element zurück.
   - Eine Regel mit einer „Bestimmten Eigenschaft der Order“ (zum Beispiel „Volumen“) bestimmt diese Eigenschaft: Ihr Ausdruck liefert den Wert, den die Eigenschaft bei „Order aufgeben“ erhält. Der „Vergleich beim Prüfen“ legt fest, wie später geprüft wird, ob der aktuelle Wert der Eigenschaft zum Ergebnis des Ausdrucks passt: „höchstens“ heißt, der aktuelle Wert darf nicht größer sein als das Ergebnis, „mindestens“, er darf nicht kleiner sein, „gleich“, er muss gleich sein. Ohne Vergleich meldet die Konsistenzprüfung einen Fehler.
   - Eine Regel mit der Einstellung „keine (nur prüfend)“ prüft nur: Ihr Ausdruck muss „wahr“ ergeben.
4. Die Reihenfolge ändern Sie mit den Pfeilen neben der Regel („Regel … nach oben“, „Regel … nach unten“).
5. „Entfernen“ neben der Regel entfernt sie.
6. Wählen Sie eine Regel in der Liste („Regel … auswählen“), um ihre Eigenschaften zu sehen und ihre Befunde. Befunde einer Regel stehen bei der Regel: Am Eintrag steht ihre Zahl („1 Fehler“), in der Ansicht der Regel der Text.

### 6.4 Speichern

1. Wählen Sie „Speichern“. Beim ersten Mal legt pipwerk Studio die Strategie neu an, danach ersetzt es die gespeicherte Fassung. Es speichert immer, auch wenn die Konsistenzprüfung Befunde meldet.
2. Danach steht in der Kopfzeile die Zahl der Befunde („Befunde: 0“).
3. Gespeichert wird als Datei im Objektverzeichnis (Abschnitt 5).
4. Scheitert das Speichern, erscheint eine Meldung mit der Ursache. Bestätigen Sie sie mit „OK“. Die Strategie bleibt geöffnet und unverändert.

### 6.5 Prüfen

1. Wählen Sie „Prüfen“. pipwerk Studio prüft die geöffnete Strategie auf Widersprüche, ohne zu speichern.
2. In der Kopfzeile steht die Zahl der Befunde. Ein Hinweistext, den Sie mit dem Mauszeiger über der Zahl sehen, nennt Fehler und Hinweise getrennt. Eine neue, leere Strategie hat keinen Befund: „Befunde: 0“.
3. Wo die Befunde stehen: Ein Element mit einem Fehler ist rot umrandet und trägt das Wort „Fehler“. Ein Element mit einem Hinweis ist orange umrandet und trägt das Wort „Hinweis“. Wählen Sie das Element aus, steht der Text des Befunds in der Eigenschaftenansicht bei den Eigenschaften. Befunde einer Regel stehen bei der Regel. Befunde ohne Element stehen in der Eigenschaftenansicht der Strategie (Klick auf die leere Zeichenfläche). Keine dieser Anzeigen müssen Sie wegklicken. Eine Meldung zum Bestätigen erscheint nur, wenn das Prüfen, Speichern, Öffnen oder Löschen selbst scheitert.
4. Was die Befunde bedeuten und wie Sie sie beheben, steht in Abschnitt 8.

### 6.6 Schließen

1. Wählen Sie „Schließen“. Die Strategie verschwindet von der Zeichenfläche. Die gespeicherte Datei bleibt.
2. Hat die Strategie ungespeicherte Änderungen, fragt pipwerk Studio „Ungespeicherte Änderungen“ und bietet „Speichern“, „Verwerfen“ und „Abbrechen“ an:
   - „Speichern“ speichert, dann wird geschlossen. Scheitert das Speichern, bleibt die Strategie geöffnet.
   - „Verwerfen“ schließt, ohne zu speichern. Die Änderungen gehen verloren.
   - „Abbrechen“ (oder die Escape-Taste) lässt alles, wie es war.
3. Dieselbe Frage erscheint vor „Neue Strategie“ und vor dem Öffnen einer Strategie (nach Ihrer Wahl in der Liste von „Öffnen“). Ungespeicherte Änderungen sind Änderungen am Dokument seit dem letzten Speichern, Öffnen oder Anlegen. Einklappen eines Rahmens, Auswählen und Verschieben der Ansicht zählen nicht dazu.

### 6.7 Öffnen

1. Wählen Sie „Öffnen“. Es erscheint die Liste der gespeicherten Strategien mit „Bezeichnung“, „Beschreibung“ und „Letzte Änderung“ (Datum und Uhrzeit in der Ortszeit Ihres Browsers).
2. Wählen Sie die Bezeichnung der Strategie. Hat die geöffnete Strategie ungespeicherte Änderungen, kommt vorher die Frage aus Abschnitt 6.6.
3. Die Strategie erscheint vollständig auf der Zeichenfläche. pipwerk Studio prüft sie und zeigt die Zahl der Befunde.
4. Eine Datei, die sich nicht lesen lässt, steht in der Liste mit der Kennzeichnung „nicht lesbar“. Sie lässt sich nicht öffnen. pipwerk Studio verändert sie nie. Entfernen Sie sie im Dateisystem.
5. Sind keine Strategien gespeichert, steht in der Liste „Es sind keine Strategien gespeichert.“
6. „Abbrechen“ schließt die Liste.

### 6.8 Löschen

1. Wählen Sie „Löschen“. pipwerk Studio fragt „Strategie löschen?“ und nennt die Strategie.
2. „Löschen“ im Fragedialog löscht die gespeicherte Datei und schließt die Strategie. „Abbrechen“ lässt alles, wie es war.
3. Eine Strategie, die Sie noch nie gespeichert haben, wird nur verworfen. Der Dialog sagt das.
4. Löschen lässt sich nicht rückgängig machen.

### 6.9 Einstellungen

Sprache und Objektverzeichnis stellen Sie im Menü unter „Einstellungen“ ein. Die Schritte stehen in Abschnitt 5.

## 7. Ausdrücke schreiben

Ein Ausdruck ist ein kurzer Text, der einen Wert berechnet oder eine Frage beantwortet, deren Antwort „wahr“ oder „falsch“ ist. Sie schreiben Ausdrücke in einer Bedingung, einer Berechnung, einer Regel und überall dort, wo die Bindungsart „Ausdruck“ gewählt ist. Die Schreibweise folgt einer Auswahl aus OpenFormula, der Formelsprache der Tabellenkalkulationen. pipwerk Studio berechnet Ausdrücke nicht. Es prüft sie und meldet Fehler (Abschnitt 8). Strategien werden in diesem Stand nicht ausgeführt.

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
- Sie schreiben die Kennung (`stop_loss`, `trend_intakt`), nicht den Namen in der Sprache der Anzeige („Stop-Loss“, „Trend intakt“). Unter dem Eingabefeld zeigt pipwerk Studio den Ausdruck mit den Namen in der gewählten Sprache („Anzeige: …“). So lesen Sie ihn auf Deutsch oder Englisch, ohne ihn zu ändern. Namen, die Sie selbst vergeben haben, bleiben, wie Sie sie geschrieben haben.
- Groß- und Kleinschreibung wird nicht unterschieden. Gespeichert wird die Schreibweise der Kennung: `order.VOLUMEN` wird zu `Order.volumen`, `if(…)` zu `IF(…)`.
- Namen bestehen nur aus den Buchstaben `A` bis `Z` und `a` bis `z`, den Ziffern `0` bis `9` und `_` und beginnen mit einem Buchstaben oder `_`.
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

### 7.4 Vorschläge beim Eingeben

1. Tippen Sie einen Namen und einen Punkt. Unter dem Feld erscheinen die Eigenschaften des Objekts mit ihrem Datentyp. Nach dem Namen einer Instanz mit enthaltenen Instanzen oder Regeln bietet die Eingabe auch diese an, nach `Strategie.` die Strategieparameter der geöffneten Strategie.
2. Ohne Punkt bietet die Eingabe nach dem ersten getippten Zeichen die sichtbaren Namen und die Funktionen an.
3. Wählen Sie einen Vorschlag mit den Pfeiltasten und übernehmen Sie ihn mit der Eingabetaste oder der Tabulatortaste, oder klicken Sie ihn an. Die Escape-Taste schließt die Liste.
4. Der Vorschlag setzt die Kennung ein.

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

Die Stelle eines Befunds: Fehler sind rot, Hinweise orange. Der Befund steht beim Element, bei der Regel oder, wenn er sich auf kein Element bezieht, bei der Strategie (Abschnitt 6.5). Ein Befund mit einer Kennung, die diese Fassung nicht kennt, erscheint als „Befund <Kennung>“.

Die Tabelle nennt die Texte, wie sie in der Oberfläche erscheinen. Drei Punkte („…“) stehen dort, wo pipwerk Studio eine Angabe einsetzt.

| Kennung | Stufe | Text in der Oberfläche | Behebung |
| --- | --- | --- | --- |
| `trigger.unconnected` | Fehler | Der Auslöser ist mit keinem Element des Ablaufs verbunden. | Ziehen Sie eine Verbindung vom Ausgang des Auslösers zu einem Element, oder löschen Sie den Auslöser. |
| `flow.no_incoming` | Fehler | Zu diesem Element des Ablaufs führt keine Verbindung. | Ziehen Sie eine Verbindung von einem Ausgang eines Auslösers oder eines anderen Elements zu diesem Element. Das gilt auch für das erste Element eines Ablaufs ohne Auslöser. Legen Sie dann einen Auslöser davor. |
| `flow.unending_loop` | Fehler | Rückführung ohne Bedingung, die sie beendet (an … Elementen). | Eine Verbindung führt im Kreis zurück, und kein Ausgang einer Bedingung im Kreis führt hinaus. Fügen Sie im Kreis eine Bedingung ein, von der ein Ausgang aus dem Kreis hinausführt, oder entfernen Sie die Rückführung. |
| `flow.management_only` | Fehler | „…“ darf nur in einer Verwaltung stehen, nicht im Hauptablauf. | Ziehen Sie das Element in den Rahmen einer Verwaltung (Abschnitt 6.2). |
| `flow.no_order_reachable` | Hinweis | Vom Auslöser aus ist kein Element erreichbar, das eine Order aufgibt. | Verbinden Sie den Ablauf vom Auslöser bis zu „Order aufgeben“, oder lassen Sie den Hinweis stehen, wenn die Strategie keine Order aufgeben soll. Eine Strategie ohne Elemente hat diesen Hinweis nicht. |
| `parameter.missing` | Fehler | Der Pflichtparameter „…“ hat keinen Wert. | Wählen Sie bei dem Parameter eine Bindungsart und geben Sie einen Wert an, oder wählen Sie „bei der Anwendung“. |
| `parameter.binding_invalid` | Fehler | Die Belegung von „…“ passt nicht: … | Ändern Sie die Belegung nach dem genannten Grund (siehe unten). |
| `order.property_missing` | Fehler | Die Eigenschaft „…“ der Order ist nicht belegt, und keine bestimmende Regel liefert sie. | Belegen Sie die Eigenschaft bei „Order aufgeben“ (Bereich „Eigenschaften der Order“), oder ordnen Sie eine Regel zu, die sie bestimmt (zum Beispiel „Risiko je Trade“ für das Volumen). |
| `expression.invalid` | Fehler | Der Ausdruck in … ist fehlerhaft: … | Korrigieren Sie den Ausdruck nach dem genannten Problem (siehe unten). |
| `expression.order_outside_management` | Fehler | Der Ausdruck in … verwendet Order oder Position außerhalb einer Verwaltung. | `Order` und `Position` gibt es nur in einer Verwaltung, in einer Regel der Strategie und in einer Regel von „Order aufgeben“. Verschieben Sie das Element in eine Verwaltung oder ändern Sie den Ausdruck. |
| `rule.result_mismatch` | Fehler | Das Ergebnis der Regel passt nicht zur bestimmten Eigenschaft „…“: … | Der Ausdruck der Regel muss einen Wert vom Datentyp der bestimmten Eigenschaft ergeben (bei einer nur prüfenden Regel „wahr“ oder „falsch“). Ändern Sie den Ausdruck oder die bestimmte Eigenschaft. |
| `rule.order_in_indicator` | Fehler | Die Regel spricht Order oder Position an. In einem Indikator oder Trend ist das nicht erlaubt. | Entfernen Sie die Regel aus dem Indikator oder Trend, oder schreiben Sie sie ohne `Order` und `Position`. |
| `rule.invalid_type` | Fehler | In dieser Liste von Regeln steht ein Objekt vom Typ „…“, das dort nicht stehen darf. | In einer Liste von Regeln stehen nur Regeln und Regelwerke. Entfernen Sie das andere Objekt. |
| `rule.comparison_missing` | Fehler | Die bestimmende Regel nennt keinen Vergleich beim Prüfen. | Wählen Sie bei der Regel den „Vergleich beim Prüfen“ („höchstens“, „mindestens“ oder „gleich“). |
| `rule.unresolved_name` | Hinweis | Hinweis zum Ausdruck in …: … Die Vorlage allein kennt den Namen nicht; geprüft wird er in jeder Strategie, die die Vorlage enthält. | Betrifft nur eine Vorlage, die für sich geprüft wird. Der Name wird in jeder Strategie geprüft, die die Vorlage enthält. Prüfen Sie dort. |
| `ruleset.reference_order` | Fehler | Regelwerk mit …. | Eine Regel verwendet das Ergebnis einer späteren Regel (Vorwärtsbezug) oder die Regeln verweisen im Kreis aufeinander (Zirkelbezug). Ändern Sie die Reihenfolge der Regeln oder die Ausdrücke. |
| `candle.no_instance` | Fehler | Die Kerze wird verwendet, aber auf der Zeichenfläche liegt keine Kerze mit gesetzter Zeiteinheit. | Legen Sie das Objekt „Kerze“ aus der Elementbibliothek auf die Zeichenfläche und setzen Sie seine Zeiteinheit. Nur wenn das Element ausschließlich von „Kerzenschluss“ ausgelöst wird, braucht es keine Kerze auf der Zeichenfläche. |
| `name.duplicate` | Fehler | Der Name „…“ ist doppelt vergeben. | Geben Sie einem der beiden einen anderen Namen. Zwei Namen derselben Ebene dürfen nicht gleich sein. |
| `name.invalid` | Fehler | Der Name „…“ enthält Zeichen, die ein Ausdruck nicht ansprechen kann. | Verwenden Sie nur `A` bis `Z`, `a` bis `z`, `0` bis `9` und `_`, und beginnen Sie mit einem Buchstaben oder `_`. |
| `type.unknown` | Fehler | Der Typ „…“ ist unbekannt. | Das Element stammt von einem anderen Programm oder einer neueren Fassung. Löschen Sie es oder ersetzen Sie es durch ein Element der Elementbibliothek. |
| `trend.direction_missing` | Fehler | Dem Trend fehlt der Ausdruck für die Eigenschaft „…“. | Schreiben Sie den Ausdruck für die Richtung des Trends. |
| `calculation.circular_reference` | Fehler | Berechnungen verwenden ihre Ergebnisse im Kreis (…). | Eine Berechnung braucht, über andere hinweg, ihr eigenes Ergebnis. Ändern Sie einen der Ausdrücke. Ein Name in `PREVIOUS(…)` zählt nicht. |
| `connection.invalid` | Fehler | Ungültige Verbindung: … | Löschen Sie die Verbindung und ziehen Sie sie neu (siehe unten). |
| `element.rules_not_allowed` | Fehler | Diesem Element sind Regeln zugeordnet, obwohl „…“ keine zulässt. | Entfernen Sie die Regeln des Elements. |
| `element.management_invalid` | Fehler | Das Element gehört zur Verwaltung eines Elements, das keine Order aufgibt. | Ziehen Sie das Element in den Rahmen eines Elements „Order aufgeben“ oder heraus. |
| `findings.truncated` | Fehler | Es gibt mehr Befunde, als angezeigt werden (Grenze …). | Beheben Sie die angezeigten Befunde und prüfen Sie erneut. |

**Probleme in einem Ausdruck** (`expression.invalid`). Die Stelle zählt von 0 in Zeichen des Ausdrucks: „Stelle 13 bis 14“ ist das 14. Zeichen.

| Problem | Text | Behebung |
| --- | --- | --- |
| Schreibfehler | Schreibfehler an Stelle … bis …: … | Korrigieren Sie die Stelle. Der Grund steht dahinter (siehe unten). |
| unbekannte Funktion | Unbekannte Funktion „…“ (Stelle … bis …). | Schreiben Sie den Funktionsnamen wie in Abschnitt 7.3. |
| unbekannter Name | Unbekannter Name „…“ (Stelle … bis …). | Schreiben Sie einen Namen, der an dieser Stelle sichtbar ist (Abschnitt 7.1), oder legen Sie die Instanz, Berechnung oder den Parameter an. |
| unbekannte Eigenschaft | „…“ hat keine Eigenschaft „…“ (Stelle … bis …). | Schreiben Sie eine Eigenschaft des Objekts. Die Eingabe schlägt sie nach dem Punkt vor. |
| unpassender Typ | Der Typ passt nicht: erwartet …, gefunden … (Stelle … bis …). | Ersetzen Sie den Wert durch einen vom erwarteten Datentyp. |
| unbekannter Wert einer Auswahl | „…“ ist kein Wert der Auswahl; erlaubt sind … (Stelle … bis …). | Schreiben Sie einen der erlaubten Werte als Text. |
| falsche Zahl von Argumenten | Die Funktion … erhält … Argumente; erlaubt sind … bis … (Stelle … bis …). | Geben Sie die erlaubte Zahl von Argumenten an. |
| anderes | Der Ausdruck ist an Stelle … bis … fehlerhaft. | Prüfen Sie die Stelle. |

Gründe eines Schreibfehlers: der Ausdruck endet zu früh (eine Klammer oder ein Argument fehlt), unerwartetes Zeichen „…“ (zum Beispiel ein zweites `>`), ungültiges Zeichen „…“, ungültige Zahl, Text nicht abgeschlossen (ein Anführungszeichen fehlt), der Ausdruck ist zu lang, der Ausdruck ist zu tief geschachtelt.

Gründe einer ungültigen Verbindung: die Quelle ist kein Element, das Ziel ist kein Element, der Ausgang gehört nicht zum Element, ein Auslöser hat keinen Eingang, die Verbindung führt zwischen dem Ablauf und einer Verwaltung oder zwischen zwei Verwaltungen.

Gründe einer unpassenden Belegung: diese Bindungsart ist nicht erlaubt, der feste Wert hat den falschen Datentyp, der feste Wert gehört nicht zur Auswahl, der Wert ist nicht zulässig, der Parameter ist unbekannt, die Eigenschaft ist unbekannt, die Anwendung belegt diese Eigenschaft, nicht der Anwender.

Gründe, warum das Ergebnis einer Regel nicht passt: die bestimmte Eigenschaft ist unbekannt, das Ergebnis ist kein Wert der Auswahl, der Typ des Ergebnisses passt nicht.

Bezeichnungen in den Texten: Ein Ausdruck steht „in Parameter „…““, „in Eigenschaft „…““, „in Eigenschaft „…“ der Instanz“, „in Ausdruck“ oder „in Ausdruck für das Gesamtergebnis“. Ein Zirkelbezug oder Vorwärtsbezug heißt „Vorwärtsbezug“ beziehungsweise „Zirkelbezug“.

Die Strategien `str-01` und `str-03` haben keinen Befund. Mit den Beispieldokumenten in Abschnitt 2 („Befunde der Konsistenzprüfung“) können Sie jeden dieser Befunde über die Web-API auslösen.

## 9. Testfall `str-03` (EMA-Trendfolge) aufbauen

Dieser Testfall ist eine einfache Strategie: Sie kauft oder verkauft mit einer Marktorder in Richtung des Kreuzens zweier exponentieller gleitender Durchschnitte (EMA, kurz und lang). Den Stop-Loss zieht sie nach. Kreuzen die Durchschnitte gegen die Position, schließt sie die Position. Die Anleitung baut die Strategie aus der leeren Zeichenfläche auf. Am Ende ist sie, bis auf die Kennungen und die Lage der Elemente, dieselbe wie das Dokument `contracts/strategies/v1/testcases/str-03.strategy.json` im Arbeitsverzeichnis.

Voraussetzung: pipwerk Studio läuft in der Testumgebung (Abschnitt 2), die Anzeige ist Deutsch (Abschnitt 5). Machen Sie das Browserfenster groß, damit die Zeichenfläche Platz hat. Die Texte in `diesen Zeichen` tippen Sie genau so ein. Ausdrücke stehen in eigenen Kästen, die Sie abschreiben oder kopieren können. Die Reihenfolge der Schritte ist die Reihenfolge, in der die Elemente im Dokument stehen.

### 9.1 Strategie und Strategieparameter

1. Wählen Sie „Neue Strategie“.
2. Tragen Sie ein: Bezeichnung `EMA-Trendfolge`, Beschreibung `Testfall str-03: Marktorder in Richtung des Kreuzens zweier exponentieller gleitender Durchschnitte, Stop-Loss nachziehen, Position bei Gegenkreuzen schließen.`
3. Legen Sie zwei Strategieparameter an (Abschnitt 6.1, Schritt 3):

| Name | Datentyp | Wert |
| --- | --- | --- |
| `zeiteinheit` | Zeiteinheit | `H1` |
| `stop_abstand` | Zahl | `2` |

4. Fügen Sie die Regel `risiko` hinzu. Klicken Sie dazu unter „Regeln“ im Feld „Vorlage aus der Elementbibliothek“ auf „Risiko je Trade“ und auf „Hinzufügen“. Tragen Sie unter „Name“ `risiko` ein. Der Parameter „risikogrenze“ bleibt bei 1 %. Wählen Sie „Zurück zu Strategie“.

### 9.2 Elemente des Hauptablaufs

Legen Sie die Elemente nacheinander aus der Elementbibliothek auf die Zeichenfläche (Abschnitt 6.2), in einer Reihe oder in zwei Reihen mit Platz zwischen den Elementen. Lassen Sie unter dem Element „Order aufgeben“ viel Platz, denn dort entsteht der Rahmen der Verwaltung. Das jeweils neue Element ist ausgewählt; tragen Sie seine Eigenschaften gleich ein.

1. Gruppe „Objekttypen“, Eintrag „EMA“.
   - Bezeichnung `EMA 20`, Name `ema20`.
   - „Zeiteinheit“: Bindungsart „Parameter“, Parameter `zeiteinheit`.
   - „Periode“: Bindungsart „fester Wert“, Wert `20`.
   - „Verschiebung“ (`0`) und „Kursquelle“ („Schlusskurs“) sind voreingestellt. Lassen Sie sie.
2. Gruppe „Objekttypen“, Eintrag „EMA“.
   - Bezeichnung `EMA 50`, Name `ema50`.
   - „Zeiteinheit“: Bindungsart „Parameter“, Parameter `zeiteinheit`.
   - „Periode“: Bindungsart „fester Wert“, Wert `50`.
3. Gruppe „Objekttypen“, Eintrag „ATR“.
   - Bezeichnung `ATR 14`, Name `atr14`.
   - „Zeiteinheit“: Bindungsart „Parameter“, Parameter `zeiteinheit`.
   - „Periode“: Bindungsart „fester Wert“, Wert `14`.
4. Gruppe „Auslöser“, Eintrag „Kerzenschluss“.
   - Bezeichnung `Kerzenschluss`.
   - „Zeiteinheit“: Bindungsart „Parameter“, Parameter `zeiteinheit`.
5. Gruppe „Elemente des Ablaufs“, Eintrag „Bedingung“.
   - Bezeichnung `Kreuzen`. Das Feld „Name“ bleibt leer.
   - „Ausdruck“:

   ```ausdruck
   OR(AND(PREVIOUS(ema20.wert) <= PREVIOUS(ema50.wert); ema20.wert > ema50.wert); AND(PREVIOUS(ema20.wert) >= PREVIOUS(ema50.wert); ema20.wert < ema50.wert))
   ```

6. Gruppe „Elemente des Ablaufs“, Eintrag „Berechnung“.
   - Bezeichnung `Richtung`, Name `richtung`.
   - „Ausdruck“:

   ```ausdruck
   IF(ema20.wert > ema50.wert; "buy"; "sell")
   ```

7. Gruppe „Elemente des Ablaufs“, Eintrag „Berechnung“.
   - Bezeichnung `Stop-Loss`, Name `stop`.
   - „Ausdruck“:

   ```ausdruck
   IF(richtung.ergebnis = "buy"; Kerze.schluss - Strategie.stop_abstand * atr14.wert; Kerze.schluss + Strategie.stop_abstand * atr14.wert)
   ```

8. Gruppe „Elemente des Ablaufs“, Eintrag „Order aufgeben“.
   - Bezeichnung `Order aufgeben`.
   - „Ordertyp“: „Marktorder“. Das ist voreingestellt.
   - Unter „Eigenschaften der Order“ belegen Sie zwei Eigenschaften. Wählen Sie jeweils die Bindungsart „Ausdruck“. „Richtung“:

   ```ausdruck
   richtung.ergebnis
   ```

   - „Stop-Loss“:

   ```ausdruck
   stop.ergebnis
   ```

   - Alle anderen Eigenschaften der Order, auch „Take-Profit“, bleiben „nicht belegt“. Das Volumen bestimmt die Regel `risiko`.
   - Regel des Elements: Wählen Sie unter „Regeln“ die Schaltfläche „Neue Regel“. Tragen Sie unter „Name“ `mindestvolumen` ein und im Feld „Ausdruck“:

   ```ausdruck
   Order.volumen >= Instrument.mindestvolumen
   ```

   - „Bestimmte Eigenschaft der Order“ und „Vergleich beim Prüfen“ bleiben unverändert („keine (nur prüfend)“, „nicht belegt“). Wählen Sie „Zurück zu Order aufgeben“.

Unter „Order aufgeben“ ist jetzt der Rahmen „Verwaltung: Order aufgeben“ erschienen.

### 9.3 Verbindungen des Hauptablaufs

Ziehen Sie mit der Maus vom Ausgang (Punkt am rechten Rand) des ersten Elements zum zweiten Element (Abschnitt 6.2, „Verbindungen“):

| Von (Ausgang) | Nach |
| --- | --- |
| `Kerzenschluss` („weiter“) | `Kreuzen` |
| `Kreuzen` („wahr“) | `Richtung` |
| `Richtung` („weiter“) | `Stop-Loss` |
| `Stop-Loss` („weiter“) | `Order aufgeben` |

Die drei Objekte `EMA 20`, `EMA 50` und `ATR 14` haben keine Verbindungen. Die Ausdrücke sprechen ihre Eigenschaften an.

### 9.4 Verwaltung der Order

Ziehen Sie die folgenden Einträge der Elementbibliothek nacheinander in den Rahmen „Verwaltung: Order aufgeben“ (Abschnitt 6.2, „Verwaltung einer Order“). Lassen Sie die Maustaste im Rahmen los. Der Rahmen wächst mit.

1. Gruppe „Auslöser“, Eintrag „Kerzenschluss“.
   - Bezeichnung `Kerzenschluss`.
   - „Zeiteinheit“: Bindungsart „Parameter“, Parameter `zeiteinheit`.
2. Gruppe „Elemente des Ablaufs“, Eintrag „Bedingung“.
   - Bezeichnung `Order ausgeführt`.
   - „Ausdruck“:

   ```ausdruck
   Order.status = "ausgefuehrt"
   ```

3. Gruppe „Elemente des Ablaufs“, Eintrag „Bedingung“.
   - Bezeichnung `Kreuzen gegen die Position`.
   - „Ausdruck“:

   ```ausdruck
   OR(AND(Position.richtung = "buy"; PREVIOUS(ema20.wert) >= PREVIOUS(ema50.wert); ema20.wert < ema50.wert); AND(Position.richtung = "sell"; PREVIOUS(ema20.wert) <= PREVIOUS(ema50.wert); ema20.wert > ema50.wert))
   ```

4. Gruppe „Elemente des Ablaufs“, Eintrag „Position schließen“.
   - Bezeichnung `Position schließen`. Das Volumen bleibt „nicht belegt“: Die Position wird ganz geschlossen.
5. Gruppe „Elemente des Ablaufs“, Eintrag „Berechnung“.
   - Bezeichnung `Neuer Stop-Loss`, Name `stop_neu`.
   - „Ausdruck“:

   ```ausdruck
   IF(Position.richtung = "buy"; Kerze.schluss - Strategie.stop_abstand * atr14.wert; Kerze.schluss + Strategie.stop_abstand * atr14.wert)
   ```

6. Gruppe „Elemente des Ablaufs“, Eintrag „Bedingung“.
   - Bezeichnung `Stop-Loss verbessert`.
   - „Ausdruck“:

   ```ausdruck
   IF(Position.richtung = "buy"; stop_neu.ergebnis > Position.stop_loss; stop_neu.ergebnis < Position.stop_loss)
   ```

7. Gruppe „Elemente des Ablaufs“, Eintrag „Position ändern“.
   - Bezeichnung `Position ändern`.
   - „Stop-Loss“: Bindungsart „Ausdruck“:

   ```ausdruck
   stop_neu.ergebnis
   ```

   - „Take-Profit“ bleibt „nicht belegt“.

Verbinden Sie danach die Elemente der Verwaltung:

| Von (Ausgang) | Nach |
| --- | --- |
| `Kerzenschluss` („weiter“), der in der Verwaltung | `Order ausgeführt` |
| `Order ausgeführt` („wahr“) | `Kreuzen gegen die Position` |
| `Kreuzen gegen die Position` („wahr“) | `Position schließen` |
| `Kreuzen gegen die Position` („falsch“) | `Neuer Stop-Loss` |
| `Neuer Stop-Loss` („weiter“) | `Stop-Loss verbessert` |
| `Stop-Loss verbessert` („wahr“) | `Position ändern` |

### 9.5 Prüfen, speichern, neu laden, öffnen

1. Wählen Sie „Prüfen“. Die Kopfzeile zeigt „Befunde: 0“. Kein Element ist rot oder orange umrandet. Sonst steht der Befund in der Eigenschaftenansicht des Elements; Abschnitt 8 nennt die Behebung.
2. Probieren Sie das Einklappen: Wählen Sie den Pfeil im Rahmen („Verwaltung „Order aufgeben“ einklappen“). Die Elemente der Verwaltung verschwinden. Klappen Sie den Rahmen wieder auf.
3. Wählen Sie „Speichern“. Die Kopfzeile zeigt „Befunde: 0“.
4. Laden Sie die Seite im Browser neu. Wählen Sie „Öffnen“ und in der Liste „EMA-Trendfolge“. Die Strategie erscheint unverändert, mit „Befunde: 0“.

## 10. Testfall `str-01` (Scalping Punkt 2 Ausbruch) aufbauen

Dieser Testfall handelt in Richtung eines intakten Trends. Er steigt am Punkt 2 der Handelszeiteinheit mit einer Stop-Order ein. Die Verwaltung löscht die wartende Order, wenn der Kurs Punkt 1/3 durchbricht, und zieht Stop-Loss und Take-Profit nach. Am Ende ist die Strategie, bis auf die Kennungen und die Lage der Elemente, dieselbe wie das Dokument `contracts/strategies/v1/testcases/str-01.strategy.json` im Arbeitsverzeichnis. Die Voraussetzungen und die Schreibweise sind dieselben wie in Abschnitt 9.

### 10.1 Strategie und Strategieparameter

1. Wählen Sie „Neue Strategie“.
2. Tragen Sie ein: Bezeichnung `Scalping Punkt 2 Ausbruch – einfache Strategie` (mit dem langen Gedankenstrich), Beschreibung `Testfall str-01: Handel in Richtung eines intakten Trends, Einstieg am Punkt 2 der Handelszeiteinheit mit einer Stop-Order.`
3. Legen Sie vier Strategieparameter an (Abschnitt 6.1, Schritt 3):

| Name | Datentyp | Wert |
| --- | --- | --- |
| `signalzeiteinheit` | Zeiteinheit | `H1` |
| `handelszeiteinheit` | Zeiteinheit | `M15` |
| `entry_puffer` | Zahl | `3` |
| `stop_puffer` | Zahl | `3` |

4. Fügen Sie die Regel `risiko` hinzu, wie in Abschnitt 9.1, Schritt 4: Eintrag „Risiko je Trade“, „Hinzufügen“, Name `risiko`, „Zurück zu Strategie“.

### 10.2 Elemente des Hauptablaufs

Legen Sie die Elemente nacheinander aus der Elementbibliothek auf die Zeichenfläche (Abschnitt 9.2). Lassen Sie unter „Order aufgeben“ viel Platz für den Rahmen der Verwaltung.

1. Gruppe „Objekttypen“, Eintrag „Markttechnik“.
   - Bezeichnung `Markttechnik Signal`, Name `mt_signal`.
   - „Zeiteinheit“: Bindungsart „Parameter“, Parameter `signalzeiteinheit`.
   - „Depth“ (`12`), „Deviation“ (`5`) und „Backstep“ (`3`) sind voreingestellt. Lassen Sie sie.
2. Gruppe „Objekttypen“, Eintrag „Markttechnik“.
   - Bezeichnung `Markttechnik Handel`, Name `mt_handel`.
   - „Zeiteinheit“: Bindungsart „Parameter“, Parameter `handelszeiteinheit`.
3. Gruppe „Auslöser“, Eintrag „Kerzenschluss“.
   - Bezeichnung `Kerzenschluss`.
   - „Zeiteinheit“: Bindungsart „Parameter“, Parameter `handelszeiteinheit`.
4. Gruppe „Elemente des Ablaufs“, Eintrag „Bedingung“.
   - Bezeichnung `Intakter Trend in der Bewegung`.
   - „Ausdruck“:

   ```ausdruck
   AND(mt_signal.trend_intakt; mt_signal.phase = "bewegung")
   ```

5. Gruppe „Elemente des Ablaufs“, Eintrag „Bedingung“.
   - Bezeichnung `Handelszeiteinheit in Trendrichtung`.
   - „Ausdruck“:

   ```ausdruck
   mt_handel.trendrichtung = mt_signal.trendrichtung
   ```

6. Gruppe „Elemente des Ablaufs“, Eintrag „Bedingung“.
   - Bezeichnung `Keine Order und keine Position`.
   - „Ausdruck“:

   ```ausdruck
   Strategie.wartende_orders + Strategie.offene_positionen = 0
   ```

7. Gruppe „Elemente des Ablaufs“, Eintrag „Berechnung“.
   - Bezeichnung `Einstieg`, Name `einstieg`.
   - „Ausdruck“:

   ```ausdruck
   IF(mt_signal.trendrichtung = "aufwaerts"; mt_handel.punkt_2 + Instrument.spread + Strategie.entry_puffer * Instrument.pip; mt_handel.punkt_2 - Strategie.entry_puffer * Instrument.pip)
   ```

8. Gruppe „Elemente des Ablaufs“, Eintrag „Berechnung“.
   - Bezeichnung `Stop-Loss`, Name `stop`.
   - „Ausdruck“:

   ```ausdruck
   IF(mt_signal.trendrichtung = "aufwaerts"; mt_handel.punkt_13 - Strategie.stop_puffer * Instrument.pip; mt_handel.punkt_13 + Strategie.stop_puffer * Instrument.pip + Instrument.spread)
   ```

9. Gruppe „Elemente des Ablaufs“, Eintrag „Berechnung“.
   - Bezeichnung `Take-Profit`, Name `ziel`.
   - „Ausdruck“:

   ```ausdruck
   IF(mt_signal.trendrichtung = "aufwaerts"; einstieg.ergebnis + (einstieg.ergebnis - stop.ergebnis) + Instrument.spread; einstieg.ergebnis - (stop.ergebnis - einstieg.ergebnis) - Instrument.spread)
   ```

10. Gruppe „Elemente des Ablaufs“, Eintrag „Order aufgeben“.
    - Bezeichnung `Order aufgeben`.
    - „Ordertyp“: „Stop-Order“.
    - Unter „Eigenschaften der Order“ belegen Sie fünf Eigenschaften. Wählen Sie jeweils die Bindungsart „Ausdruck“, außer bei „Gültigkeit“. „Richtung“:

    ```ausdruck
    IF(mt_signal.trendrichtung = "aufwaerts"; "buy"; "sell")
    ```

    - „Preis“:

    ```ausdruck
    einstieg.ergebnis
    ```

    - „Stop-Loss“:

    ```ausdruck
    stop.ergebnis
    ```

    - „Take-Profit“:

    ```ausdruck
    ziel.ergebnis
    ```

    - „Gültigkeit“: Bindungsart „fester Wert“, Wert „bis auf Widerruf“.
    - Alle anderen Eigenschaften der Order bleiben „nicht belegt“. Das Volumen bestimmt die Regel `risiko`.
    - Regel des Elements: Wählen Sie unter „Regeln“ die Schaltfläche „Neue Regel“. Tragen Sie unter „Name“ `mindestvolumen` ein und im Feld „Ausdruck“:

    ```ausdruck
    Order.volumen >= Instrument.mindestvolumen
    ```

    - Wählen Sie „Zurück zu Order aufgeben“.

### 10.3 Verbindungen des Hauptablaufs

| Von (Ausgang) | Nach |
| --- | --- |
| `Kerzenschluss` („weiter“) | `Intakter Trend in der Bewegung` |
| `Intakter Trend in der Bewegung` („wahr“) | `Handelszeiteinheit in Trendrichtung` |
| `Handelszeiteinheit in Trendrichtung` („wahr“) | `Keine Order und keine Position` |
| `Keine Order und keine Position` („wahr“) | `Einstieg` |
| `Einstieg` („weiter“) | `Stop-Loss` |
| `Stop-Loss` („weiter“) | `Take-Profit` |
| `Take-Profit` („weiter“) | `Order aufgeben` |

Die beiden Objekte `Markttechnik Signal` und `Markttechnik Handel` haben keine Verbindungen.

### 10.4 Verwaltung der Order

Ziehen Sie die folgenden Einträge nacheinander in den Rahmen „Verwaltung: Order aufgeben“ (Abschnitt 9.4).

1. Gruppe „Auslöser“, Eintrag „Tick“.
   - Bezeichnung `Tick`.
2. Gruppe „Elemente des Ablaufs“, Eintrag „Bedingung“.
   - Bezeichnung `Kurs durchbricht Punkt 1/3`.
   - „Ausdruck“:

   ```ausdruck
   AND(Order.status = "wartend"; IF(Order.richtung = "buy"; Tick.geld < mt_handel.punkt_13; Tick.brief > mt_handel.punkt_13))
   ```

3. Gruppe „Elemente des Ablaufs“, Eintrag „Order löschen“.
   - Bezeichnung `Order löschen`.
4. Gruppe „Auslöser“, Eintrag „Kerzenschluss“.
   - Bezeichnung `Kerzenschluss`.
   - „Zeiteinheit“: Bindungsart „Parameter“, Parameter `handelszeiteinheit`.
5. Gruppe „Elemente des Ablaufs“, Eintrag „Bedingung“.
   - Bezeichnung `Order wartet`.
   - „Ausdruck“:

   ```ausdruck
   Order.status = "wartend"
   ```

6. Gruppe „Elemente des Ablaufs“, Eintrag „Berechnung“.
   - Bezeichnung `Neuer Stop-Loss`, Name `stop_neu`.
   - „Ausdruck“:

   ```ausdruck
   IF(Order.richtung = "buy"; mt_handel.punkt_13 - Strategie.stop_puffer * Instrument.pip; mt_handel.punkt_13 + Strategie.stop_puffer * Instrument.pip + Instrument.spread)
   ```

7. Gruppe „Elemente des Ablaufs“, Eintrag „Bedingung“.
   - Bezeichnung `Stop-Loss weicht ab`.
   - „Ausdruck“:

   ```ausdruck
   stop_neu.ergebnis <> Order.stop_loss
   ```

8. Gruppe „Elemente des Ablaufs“, Eintrag „Berechnung“.
   - Bezeichnung `Neuer Take-Profit`, Name `ziel_neu`.
   - „Ausdruck“:

   ```ausdruck
   IF(Order.richtung = "buy"; Order.preis + (Order.preis - stop_neu.ergebnis) + Instrument.spread; Order.preis - (stop_neu.ergebnis - Order.preis) - Instrument.spread)
   ```

9. Gruppe „Elemente des Ablaufs“, Eintrag „Order ändern“.
   - Bezeichnung `Order ändern`.
   - „Stop-Loss“: Bindungsart „Ausdruck“:

   ```ausdruck
   stop_neu.ergebnis
   ```

   - „Take-Profit“: Bindungsart „Ausdruck“:

   ```ausdruck
   ziel_neu.ergebnis
   ```

10. Gruppe „Elemente des Ablaufs“, Eintrag „Order löschen“.
    - Bezeichnung `Order löschen`.

Verbinden Sie danach die Elemente der Verwaltung. Es gibt zwei Elemente `Kerzenschluss` und zwei Elemente `Order löschen`: Das erste `Order löschen` ist das hinter `Kurs durchbricht Punkt 1/3`, das zweite das hinter `Order ändern`.

| Von (Ausgang) | Nach |
| --- | --- |
| `Tick` („weiter“) | `Kurs durchbricht Punkt 1/3` |
| `Kurs durchbricht Punkt 1/3` („wahr“) | das erste `Order löschen` |
| `Kerzenschluss` („weiter“), der in der Verwaltung | `Order wartet` |
| `Order wartet` („wahr“) | `Neuer Stop-Loss` |
| `Neuer Stop-Loss` („weiter“) | `Stop-Loss weicht ab` |
| `Stop-Loss weicht ab` („wahr“) | `Neuer Take-Profit` |
| `Neuer Take-Profit` („weiter“) | `Order ändern` |
| `Order ändern` („nicht geändert“) | das zweite `Order löschen` |

### 10.5 Prüfen, einklappen, speichern, neu laden, öffnen

1. Wählen Sie „Prüfen“. Die Kopfzeile zeigt „Befunde: 0“. Kein Element ist rot oder orange umrandet.
2. Klappen Sie die Verwaltung mit dem Pfeil im Rahmen ein („Verwaltung „Order aufgeben“ einklappen“). Die Elemente der Verwaltung verschwinden und bleiben in der Strategie. Klappen Sie den Rahmen wieder auf.
3. Wählen Sie „Speichern“. Die Kopfzeile zeigt „Befunde: 0“.
4. Laden Sie die Seite neu. Wählen Sie „Öffnen“ und in der Liste die Strategie `Scalping Punkt 2 Ausbruch – einfache Strategie`. Die Strategie erscheint unverändert, mit „Befunde: 0“.

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
- Die Konsistenzprüfung meldet für Strategien in diesem Stand keinen Hinweis, der ein einzelnes Element betrifft. Die Oberfläche würde ein solches Element orange umranden (Abschnitt 6.5). Heute tritt dieser Fall in einer Strategie nicht auf: Der Hinweis „Vom Auslöser aus ist kein Element erreichbar, das eine Order aufgibt“ hat kein Element, und der Hinweis zu einem unbekannten Namen in einem Ausdruck gilt nur für Vorlagen.

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
| Elementbibliothek | Der Bereich der Oberfläche links mit den Einträgen, die Sie auf die Zeichenfläche ziehen können, in Gruppen: Auslöser, Elemente des Ablaufs, Objekte der Anwendung, Objekttypen und Vorlagen. |
| Eigenschaftenansicht | Der Bereich der Oberfläche rechts, in dem Sie die Eigenschaften des ausgewählten Elements, der ausgewählten Regel oder der Strategie sehen und ändern. |
| Element | Alles, was Sie auf die Zeichenfläche legen: ein Auslöser, ein Schritt des Ablaufs (zum Beispiel Bedingung, Berechnung, Order aufgeben) oder ein Objekt (zum Beispiel eine Instanz von EMA). |
| Auslöser | Ein Element, das festlegt, bei welchem Ereignis die Strategie oder eine Verwaltung ausgewertet wird, zum Beispiel beim Schluss einer Kerze oder bei jedem Tick. Auslöser sind freiwillig. |
| Verbindung | Eine Linie zwischen zwei Elementen. Sie bedeutet „danach folgt“. Sie beginnt an einem Ausgang eines Elements und endet am Eingang des nächsten. |
| Verwaltung (Rahmen) | Der Teil des Ablaufs, der nach dem Ausgang „gestellt“ von „Order aufgeben“ läuft und sich um die gestellte Order kümmert. Auf der Zeichenfläche ist sie ein Rahmen unter dem Element. Elemente im Rahmen gehören zur Verwaltung. |
| Strategieparameter | Ein Wert, den Sie an einer Stelle der Strategie festlegen und überall in ihr verwenden. Ausdrücke sprechen ihn als `Strategie.<Name>` an. |
| Bindungsart | Die Art, wie ein Parameter oder eine Eigenschaft ihren Wert erhält: „fester Wert“, „Parameter“ (aus einem Strategieparameter), „Ausdruck“ oder „bei der Anwendung“. |
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
