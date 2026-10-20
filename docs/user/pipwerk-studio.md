# pipwerk Studio – Anwenderdokumentation

## Dokumentstatus

- status: `draft`
- stand: 2026-10-20
- komponente: `pipwerk-studio`

## 1. Wozu pipwerk Studio dient

pipwerk Studio ist der grafische Strategiedesigner von Pipwerk. Mit ihm werden Handelsstrategien auf einer Zeichenfläche zusammengestellt und bearbeitet.

Hinweis: pipwerk Studio hat eine neue Oberfläche. Die Beschreibung der neuen Oberfläche (Abschnitte 3, 6, 7.4, 9 und 10) folgt; bis dahin enthalten diese Abschnitte nur einen Vermerk. Die übrigen Abschnitte gelten weiter.

Der derzeitige Stand: In der Oberfläche können Strategien angelegt, geprüft, gespeichert, geöffnet, geschlossen und gelöscht und auf der Zeichenfläche angesehen, angeordnet und verbunden werden; Sprache und Objektverzeichnis stellen Sie in den Einstellungen ein. Vorlagen (Indikator, Trend, Regel, Regelwerk) lassen sich in der Oberfläche noch nicht anlegen, ansehen oder löschen; das geht bisher nur über die Web-API (Abschnitt 2, „Web-API ausprobieren“). Strategien werden nicht ausgeführt.

Wo Sie was finden:

| Sie wollen … | Abschnitt |
| --- | --- |
| pipwerk Studio starten | 2 |
| die Oberfläche kennenlernen | 3 |
| Sprache oder Objektverzeichnis einstellen | 5 |
| eine Strategie anlegen, speichern, prüfen, schließen, öffnen oder löschen, Regeln zuordnen (Beschreibung folgt) | 6 |
| einen Ausdruck schreiben und verstehen, was „leer“ und „nicht verfügbar“ bedeuten | 7 |
| einen Befund der Konsistenzprüfung verstehen und beheben | 8 |
| den Testfall `str-03` (EMA-Trendfolge) selbst aufbauen (Anleitung folgt) | 9 |
| den Testfall `str-01` (Scalping Punkt 2 Ausbruch) selbst aufbauen (Anleitung folgt) | 10 |

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

Die Oberfläche besteht aus der Kopfzeile oben, dem Streifen der Strategieparameter, der Elementbibliothek, der Zeichenfläche, der Eigenschaftenansicht und der Fußzeile unten. In breiten Fenstern liegen Bibliothek, Zeichenfläche und Eigenschaften nebeneinander, in mittleren liegen Zeichenfläche und ein Seitenbereich mit zwei Reitern nebeneinander, in schmalen steht ein Bereich nach dem anderen und Sie wechseln über die Leiste unten. Die ausführliche Beschreibung der neuen Oberfläche folgt; dieser Abschnitt beschreibt vorerst nur die Fußzeile.

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

Die Beschreibung der Arbeitsabläufe mit der neuen Oberfläche (Strategie anlegen, Elemente und Objekte verwenden, Regeln zuordnen, Speichern, Prüfen, Schließen, Öffnen, Löschen) folgt. Die frühere Beschreibung gehörte zur alten Oberfläche und ist entfernt. Die Einstellungen beschreibt Abschnitt 5.

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

### 7.4 Eingabe von Ausdrücken

Die Eingabe von Ausdrücken mit Vorschlägen gehört zur alten Oberfläche. In der neuen Oberfläche zeigt die Eigenschaftenansicht einen Ausdruck zunächst nur lesend, als Satz und als Formel. Die Beschreibung der Eingabe folgt.

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
| `trigger.unconnected` | Fehler | Der Auslöser ist mit keinem Element des Ablaufs verbunden. | Ziehen Sie eine Verbindung vom Ausgang des Auslösers zu einem Element, oder löschen Sie den Auslöser. |
| `flow.no_incoming` | Fehler | Zu diesem Element des Ablaufs führt keine Verbindung. | Ziehen Sie eine Verbindung von einem Ausgang eines Auslösers oder eines anderen Elements zu diesem Element. Das gilt auch für das erste Element eines Ablaufs ohne Auslöser. Legen Sie dann einen Auslöser davor. |
| `flow.unending_loop` | Fehler | Rückführung ohne Bedingung, die sie beendet (an … Elementen). | Eine Verbindung führt im Kreis zurück, und kein Ausgang einer Bedingung im Kreis führt hinaus. Fügen Sie im Kreis eine Bedingung ein, von der ein Ausgang aus dem Kreis hinausführt, oder entfernen Sie die Rückführung. |
| `flow.management_only` | Fehler | „…“ darf nur in einer Verwaltung stehen, nicht im Hauptablauf. | Ziehen Sie das Element in den Rahmen einer Verwaltung. |
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

Die Anleitung zum Aufbau des Testfalls mit der neuen Oberfläche folgt. Die frühere Anleitung gehörte zur alten Oberfläche und ist entfernt.

## 10. Testfall `str-01` (Scalping Punkt 2 Ausbruch) aufbauen

Die Anleitung zum Aufbau des Testfalls mit der neuen Oberfläche folgt. Die frühere Anleitung gehörte zur alten Oberfläche und ist entfernt.

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
- Die Konsistenzprüfung meldet für Strategien in diesem Stand keinen Hinweis, der ein einzelnes Element betrifft. Die Oberfläche würde ein solches Element orange umranden. Heute tritt dieser Fall in einer Strategie nicht auf: Der Hinweis „Vom Auslöser aus ist kein Element erreichbar, das eine Order aufgibt“ hat kein Element, und der Hinweis zu einem unbekannten Namen in einem Ausdruck gilt nur für Vorlagen.

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
