# pipwerk replay – Anwenderdokumentation

## Dokumentstatus

- status: `draft`
- stand: 2026-10-21
- komponente: `pipwerk-replay`
- vorhaben: `backtest`, Arbeitspaket `wp02`, Auftrag 05

## 1. Wozu pipwerk replay dient

pipwerk replay ist der Strategietester von Pipwerk. Er führt Handelsstrategien gegen historische Kursdaten aus. Er liest die Kursdaten nur aus einem eigenen Bestand, dem Datenbestand historischer Kursdaten. Außerdem verwaltet er die Testkonten. Ein Testkonto ist ein Satz von Kontowerten, mit dem später ein Testlauf rechnet.

Der derzeitige Stand von pipwerk replay kann zwei Dinge:

1. **Testkonten** anlegen, ändern, speichern und löschen (Abschnitt 6).
2. Den **Datenbestand** ansehen, füllen und pflegen (Abschnitte 7 bis 9): Sie sehen, welche Kursdaten vorliegen und wo Lücken sind. Sie können Dateien importieren, zum Beispiel einen Export aus MetaTrader 5. Sie können Daten aus einer Quelle beschaffen, zum Beispiel aus MetaTrader 5.

Strategien lassen sich noch nicht testen. Der Testlauf (Einzelschritt-Test und Backtest) und die gespeicherten Backtests folgen in späteren Arbeitspaketen. Ihre Menüeinträge gibt es deshalb noch nicht. Begriffe, die Sie ohne Vorwissen vielleicht nicht kennen, erklärt das Glossar in Abschnitt 12.

## 2. pipwerk replay öffnen

Eine Installation für Anwender gibt es noch nicht. pipwerk replay lässt sich auf zwei Wegen starten: als Testumgebung und im Entwicklungsbetrieb. Beide Wege brauchen eine gültige INI-Startkonfiguration (siehe Glossar). Sie legt mindestens die Datenbankverbindung fest. Die Testumgebung legt sie selbst an. Ohne eine gültige INI-Startkonfiguration bricht der Start mit einer Fehlermeldung ab; eine Ersatzdatenbank wird nicht angelegt.

### Erster Weg: Testumgebung

Die Testumgebung ist pipwerk replay, gebaut und gestartet aus genau einem Commit (siehe Glossar). In der Testumgebung läuft also genau der Stand, den die Fußzeile und der Dialog „Über pipwerk replay“ nennen (Abschnitt 4).

Die Testumgebung wird mit dem Testumgebungsskript `components/pipwerk-replay/scripts/testenv` gestartet, abgefragt und beendet. Welche Programme dafür auf dem Rechner vorhanden sein müssen, steht in der technischen Dokumentation `docs/technical/pipwerk-replay.md` im Abschnitt „Start als Testumgebung“. Die Befehle rufen Sie in einem Terminal (siehe Glossar) im obersten Verzeichnis des Arbeitsverzeichnisses auf, also in dem Verzeichnis, in dem auch die Datei `LICENSE` liegt. Statt des relativen Pfads im Befehl können Sie den vollständigen Pfad des Skripts angeben und den Befehl aus einem beliebigen Verzeichnis aufrufen (zu „Pfad“ siehe Glossar).

1. Starten: `components/pipwerk-replay/scripts/testenv start --frontend-port <Port der Oberfläche> --backend-port <Port des Hintergrunddienstes>`. Beide Ports wählen Sie selbst. Sie müssen frei sein und sich unterscheiden. Der Start dauert, weil das Skript die Programmteile installiert und die Oberfläche baut. Er endet erst, wenn pipwerk replay antwortet.
2. Öffnen: Rufen Sie im Webbrowser die Adresse auf, die das Skript am Ende des Starts nennt (Meldung „pipwerk replay is running: …“). Ohne `--host` ist das `http://127.0.0.1:<Port der Oberfläche>/`.
3. Abfragen: `components/pipwerk-replay/scripts/testenv status` nennt, ob die Testumgebung läuft, die Adressen von Oberfläche und Hintergrunddienst und die eingerichtete Quelle (oder „source: not set up“).
4. Beenden: `components/pipwerk-replay/scripts/testenv stop` beendet pipwerk replay und entfernt die Dateien der Testumgebung, auch ihre Datenbank. Damit gehen die Testkonten, der Datenbestand, die Standardquelle und die gespeicherte Sprache verloren. Nach einem erneuten Start ist wieder Deutsch eingestellt, der Datenbestand ist leer und es gibt nur das Standard-Testkonto.

**Eine Quelle einrichten.** Ohne weitere Angaben ist keine Quelle eingerichtet. Die Beschaffung von Hand (Abschnitt 9) meldet dann „Keine Quelle eingerichtet“. Alles andere funktioniert. Wollen Sie Daten aus einer Quelle holen, geben Sie beim Start zwei Angaben mit:

```
components/pipwerk-replay/scripts/testenv start --frontend-port <Port der Oberfläche> --backend-port <Port des Hintergrunddienstes> --source-url <Adresse der Quelle> --source-key-file <Datei mit dem Schlüssel>
```

- `--source-url` ist die Adresse der Quelle, zum Beispiel `http://192.168.0.20:8765` (die Netzwerkadresse des Rechners, auf dem `pipwerk-fetch-mt5` läuft, und sein Port; siehe Abschnitt 10). Sie beginnt mit `http://` oder `https://`.
- `--source-key-file` ist der Pfad zu einer Textdatei, die in der ersten Zeile den gemeinsamen Schlüssel der Quelle enthält (16 bis 256 sichtbare Zeichen ohne Leerzeichen). Den Schlüssel selbst geben Sie nie im Befehl ein: Befehle können für andere Benutzer des Rechners sichtbar sein. Legen Sie die Datei außerhalb des Arbeitsverzeichnisses an, damit sie nicht versehentlich in das Repository gelangt, und lassen Sie nur sich selbst darauf zugreifen.
- Beide Angaben gehören zusammen. Fehlt eine, bricht der Start ab, bevor etwas gebaut oder gestartet wird. Die Meldung nennt den Grund und wiederholt den Schlüssel nie.

Das Skript schreibt Adresse und Schlüssel in die Startkonfiguration der Testumgebung unter `components/pipwerk-replay/.testenv/`. Diese Datei kann nur Ihr Benutzer lesen. Der Schlüssel steht sonst nirgends: nicht in einer Ausgabe des Skripts, nicht in einem Protokoll, nicht in der Datenbank und nicht in einer Anzeige der Oberfläche. `testenv stop` entfernt die Datei.

**Zugriff von anderen Rechnern:** Achtung, lesen Sie zuerst diesen Hinweis. Mit `--host` kann jeder, der Ihren Rechner im Netz erreicht, pipwerk replay benutzen, die Einstellungen ändern, Testkonten anlegen, ändern und löschen, Dateien importieren und Daten aus der eingerichteten Quelle beschaffen. Es gibt keine Anmeldung. Verwenden Sie `--host` deshalb nur in einem Netz, dem Sie vertrauen. Ohne `--host` ist pipwerk replay nur von Ihrem eigenen Rechner aus erreichbar. Der Befehl lautet zum Beispiel: `components/pipwerk-replay/scripts/testenv start --frontend-port <Port der Oberfläche> --backend-port <Port des Hintergrunddienstes> --host 0.0.0.0`. `0.0.0.0` bedeutet: alle Netzwerkadressen des Rechners (siehe Glossar). Andere Rechner verwenden die Netzwerkadresse Ihres Rechners, also `http://<Netzwerkadresse des Rechners>:<Port der Oberfläche>/`. Ein Rechnername statt der Netzwerkadresse funktioniert nicht, pipwerk replay weist die Anfrage ab.

Der Start bricht mit einer Fehlermeldung ab, wenn das Arbeitsverzeichnis nicht genau einem Commit entspricht (nicht committete Änderung oder neue Datei, die Git nicht ausdrücklich ignoriert) oder nicht in einem Git-Arbeitsbereich liegt. In diesem Fall wurde nichts installiert, gebaut oder gestartet. Committen oder verwerfen Sie die Änderungen und starten Sie erneut. Der Start bricht auch ab, wenn schon eine Testumgebung läuft oder ein Port belegt ist.

### Zweiter Weg: Entwicklungsbetrieb

Im Entwicklungsbetrieb starten Sie den Hintergrunddienst und die Oberfläche von Hand in zwei getrennten Terminals. Die Schritte stehen in der technischen Dokumentation `docs/technical/pipwerk-replay.md` im Abschnitt „Einrichtung und Start im Entwicklungsbetrieb“. Eine Quelle richten Sie dort im Abschnitt `[source]` der Startkonfiguration `pipwerk-replay.ini` ein: `fetch_url` (Adresse) und `fetch_key` (Schlüssel). Die Datei enthält dann den Schlüssel; schützen Sie sie, und legen Sie sie nie in das Repository.

## 3. Aufbau der Oberfläche

Die Oberfläche besteht aus drei Bereichen.

Oben steht die **Kopfzeile**. Sie zeigt links den Namen „pipwerk replay“, daneben das Menü mit den Einträgen „Datenbestand“ und „Testkonten“, rechts die Schaltfläche „Über pipwerk replay“ (Abschnitt 4) und die Wahl der Sprache (Abschnitt 5). In schmalen Fenstern (unter 700 Pixel Breite) ersetzt die Schaltfläche „Menü“ die Einträge; sie öffnet eine Liste mit denselben Einträgen. Die Liste schließt sich nach der Wahl, mit der Escape-Taste und mit einem Klick daneben. In schmalen Fenstern trägt die Schaltfläche „Über pipwerk replay“ nur das Symbol.

In der Mitte steht die gewählte **Ansicht**. Beim Öffnen ist das der Datenbestand. Ist eine Ansicht höher als das Fenster, wird sie in der Mitte gescrollt; Kopfzeile und Fußzeile bleiben stehen.

Unten steht die **Fußzeile**. Sie zeigt links, ob pipwerk replay seinen Hintergrunddienst erreicht, und rechts den Stand, aus dem pipwerk replay läuft. Der Hintergrunddienst ist der Teil von pipwerk replay, der außerhalb des Browsers läuft (siehe Glossar).

| Anzeige | Bedeutung |
| --- | --- |
| „Backend: Verbindung wird geprüft“ | pipwerk replay fragt gerade beim Hintergrunddienst an. |
| „Backend: verbunden“ | Der Hintergrunddienst hat geantwortet. pipwerk replay ist bereit. |
| „Backend: nicht erreichbar“ | Der Hintergrunddienst hat nicht oder nicht richtig geantwortet. Prüfen Sie, ob er läuft, und laden Sie die Seite neu. |

Der Stand ist die Kurzform des Commits, aus dem pipwerk replay gestartet wurde, also die ersten 7 Zeichen seiner Kennung. Er ist keine Versionsnummer. „Stand: <Kurzform>“ (Englisch „Revision: <short form>“) heißt: pipwerk replay läuft aus dem Commit, dessen Kennung mit diesen 7 Zeichen beginnt. „Stand: unbekannt“ erscheint, wenn der Stand sich nicht ermitteln lässt, zum Beispiel außerhalb eines Git-Arbeitsbereichs; pipwerk replay arbeitet dann normal. Fahren Sie mit dem Mauszeiger über die Standanzeige oder erreichen Sie sie mit der Tabulatortaste, erscheint ein Tooltip (siehe Glossar) mit der vollständigen Kennung und dem Datum des Commits: „Commit <Kennung> vom TT.MM.JJJJ, hh:mm Uhr“ (Englisch „Commit <id> from YYYY-MM-DD hh:mm“, Ortszeit Ihres Browsers). Das Datum ist das Datum des Commits, nicht der Zeitpunkt des Starts.

**Erklärungen zu den Feldern.** Jedes Feld und jede Einstellung hat eine kurze Erklärung in der Sprache des Handels. Sie erscheint, wenn Sie mit der Maus kurz auf der Bezeichnung des Feldes oder auf dem Symbol „i“ daneben verweilen, und auch, wenn das Symbol mit der Tabulatortaste den Fokus (siehe Glossar) erhält. Felder mit einem Stern sind Pflichtfelder.

**Leere Zustände.** Wo noch nichts da ist, nennt ein Hinweis den nächsten Schritt, zum Beispiel „Der Datenbestand ist leer. Nächster Schritt: Importieren Sie unten eine Datei oder stoßen Sie die Beschaffung an.“

**Fenstergrößen.** Die Oberfläche ist in den Fenstergrößen 390 × 844, 844 × 390, 820 × 1180, 1180 × 820, 1366 × 768 und 1920 × 1080 Pixel geprüft: Nichts liegt übereinander, und alle Bereiche, das Menü und die Dialoge sind erreichbar. Tabellen, die breiter als das Fenster sind, haben eine eigene Bildlaufleiste.

**Was der Browser speichert.** Nichts. Sprache, Testkonten, Datenbestand und Einstellungen liegen im Hintergrunddienst. Namen, die Sie eingeben, und Namen aus dem Datenbestand zeigt die Oberfläche immer als Text an.

## 4. Dialog „Über pipwerk replay“

Der Dialog nennt den Namen, den genauen Stand, die Lizenz und die Adresse des Repositorys. Öffnen: Klicken Sie in der Kopfzeile auf „Über pipwerk replay“. Mit der Tastatur erreichen Sie die Schaltfläche mit der Tabulatortaste und öffnen den Dialog mit der Eingabetaste. Schließen: Klicken Sie auf „Schließen“ oder drücken Sie die Escape-Taste. Danach liegt der Fokus wieder auf der Schaltfläche „Über pipwerk replay“. Solange der Dialog offen ist, ist die übrige Oberfläche gesperrt; mit der Tabulatortaste wandert der Fokus nur zwischen den Bedienelementen des Dialogs.

| Bestandteil | Inhalt |
| --- | --- |
| Überschrift | „Über pipwerk replay“ (Englisch: „About pipwerk replay“) |
| Name | „pipwerk replay“ |
| Stand (Englisch: „Revision“) | die vollständige Kennung des Commits (40 Zeichen) mit Datum und Uhrzeit des Commits |
| Lizenz (Englisch: „License“) | „GNU General Public License, Version 3“ und der vollständige Text der Lizenz (englisches Original, nicht übersetzt) in einem Feld mit eigener Bildlaufleiste |
| Repository | die Adresse https://github.com/macodix/pipwerk als Verweis |

Der Stand im Dialog ist der Commit, der beim Bau der Oberfläche ausgecheckt war (siehe Glossar). In der Testumgebung ist das derselbe Commit wie in der Fußzeile. „unbekannt“ steht anstelle des Stands, wenn er sich beim Bau nicht ermitteln ließ. Die Anzeige braucht keine Internetverbindung; nur das Öffnen des Verweises auf das Repository braucht sie.

## 5. Sprache wechseln

pipwerk replay kann auf Deutsch und auf Englisch angezeigt werden. Ohne zuvor gespeicherte Auswahl ist Deutsch eingestellt. Klicken Sie in der Kopfzeile auf „DE“ oder „EN“. Alle Texte erscheinen sofort in der gewählten Sprache. Der Name „pipwerk replay“, selbst vergebene Namen (zum Beispiel von Testkonten und Brokern) und die Namen von Instrumenten werden nicht übersetzt. Das Standard-Testkonto heißt auf Englisch „Default test account“.

Die Auswahl wird im Hintergrunddienst gespeichert. Sie bleibt nach einem Neuladen der Seite und nach einem Neustart von pipwerk replay erhalten. In der Testumgebung geht sie mit `testenv stop` verloren (Abschnitt 2). Die Sprache gilt für die ganze Komponente, nicht für einzelne Personen. Die Schaltflächen sind gesperrt, solange die Sprache gelesen oder gespeichert wird. Antwortet der Hintergrunddienst nicht innerhalb von 10 Sekunden, gilt das als fehlgeschlagen. Es gibt drei Meldungen:

| Meldung | Bedeutung |
| --- | --- |
| „Die gespeicherte Sprache konnte nicht gelesen werden. Es wird die Standardsprache Deutsch angezeigt.“ | Beim Öffnen konnte die gespeicherte Sprache nicht gelesen werden. Prüfen Sie, ob der Hintergrunddienst läuft, und laden Sie die Seite neu. |
| „Die Sprache konnte nicht gespeichert werden. Die zuletzt bestätigte Sprache bleibt aktiv.“ | Eine Änderung wurde nicht gespeichert. Prüfen Sie den Hintergrunddienst und versuchen Sie es erneut. |
| „Die Sprache konnte nicht gespeichert werden. Es wird die Standardsprache Deutsch angezeigt, weil die gespeicherte Sprache nicht gelesen werden konnte.“ | Lesen und Speichern sind fehlgeschlagen. Prüfen Sie den Hintergrunddienst und versuchen Sie es erneut. |

## 6. Testkonten

Ein Testkonto ist ein benannter, gespeicherter Satz von Werten für die Abwicklung eines Testlaufs. Es ist an kein Instrument gebunden. Öffnen Sie im Menü „Testkonten“. Links steht die Liste der gespeicherten Testkonten, rechts das Formular des gewählten Testkontos.

**Das Standard-Testkonto.** Es ist mitgeliefert (Markierung „mitgeliefert“, englisch „built in“) und hat diese Werte: Anfangskapital 10 000, Kontowährung EUR, Hebel 30, Spread aus den Kerzen, Kommission 0. Sie können es ändern und löschen wie jedes andere Testkonto. Fehlt es beim Start von pipwerk replay, legt pipwerk replay es mit diesen Ausgangswerten neu an. So kann ein Testlauf immer ohne Vorarbeit starten. Haben Sie es geändert, bleibt Ihre Änderung nach einem Neustart erhalten.

**Felder.**

| Feld | Bedeutung | Erlaubt |
| --- | --- | --- |
| Name* | Der Name, unter dem Sie das Testkonto im Testlauf wählen. | 1 bis 100 Zeichen, nicht nur Leerzeichen, keine Steuerzeichen. Namen müssen nicht eindeutig sein. |
| Anfangskapital* | Das Geld, mit dem ein Testlauf beginnt. | größer als 0, höchstens 10<sup>12</sup>; Komma oder Punkt als Dezimaltrenner |
| Kontowährung* | Die Währung, in der Gewinn, Verlust und Kosten ausgewiesen werden. | genau drei Großbuchstaben, zum Beispiel EUR; Kleinbuchstaben setzt die Oberfläche in Großbuchstaben um |
| Hebel* | Wie viel mehr Marktwert Sie mit dem Geld bewegen können; 30 bedeutet 1:30. | ganze Zahl von 1 bis 1000 |
| Kommission je Lot und Seite | Gebühr je gehandeltem Lot, für Eröffnung und Schließung je einmal, in Kontowährung. | 0 bis 100000 |
| Spread | Der Abstand zwischen Kauf- und Verkaufskurs. „aus den Kerzen“ nimmt den Spread, den der Broker je Kerze liefert; „fest“ rechnet mit einem festen Wert in Punkten. Ein Punkt ist die kleinste Preisstufe des Instruments. | bei „fest“ 0 bis 100000 Punkte |

**Neues Testkonto.** Klicken Sie auf „Neues Testkonto“. Das Formular zeigt die Ausgangswerte des Standard-Testkontos und den Namen „Neues Testkonto“. Ändern Sie die Werte und klicken Sie auf „Speichern“. Erst dann ist das Testkonto angelegt. Danach ist es das gewählte Testkonto, und die Meldung „Testkonto „<Name>“ ist gespeichert.“ erscheint.

**Bearbeiten und speichern.** Wählen Sie ein Testkonto in der Liste, ändern Sie Felder und klicken Sie auf „Speichern“. Solange Sie Änderungen nicht gespeichert haben, steht „Ungespeicherte Änderungen.“ unter den Schaltflächen. „Änderungen verwerfen“ stellt die gespeicherten Werte wieder her. Wählen Sie ein anderes Testkonto, gehen ungespeicherte Änderungen verloren. Ist ein Wert ungültig, nennt eine rote Meldung den Grund, und „Speichern“ bleibt gesperrt.

**Löschen.** Wählen Sie das Testkonto und klicken Sie auf „Löschen“. Eine Rückfrage erscheint; erst „Löschen“ in der Rückfrage löscht das Testkonto. „Abbrechen“ lässt alles, wie es ist. Gespeicherte Backtests (kommen später) behalten ihre Kopie der Werte. Ein neues, noch nicht gespeichertes Testkonto lässt sich nicht löschen; verwerfen Sie es stattdessen. Löschen Sie das Standard-Testkonto, legt pipwerk replay es beim nächsten Start mit den Ausgangswerten neu an.

Gibt es kein Testkonto, steht in der Liste: „Es gibt kein Testkonto. Nächster Schritt: Legen Sie ein neues an.“

## 7. Datenbestand

Öffnen Sie im Menü „Datenbestand“. Die Ansicht hat fünf Bereiche, von oben nach unten.

**Was vorliegt.** Die Tabelle zeigt je Broker, Instrument und Art der Daten eine Zeile. Der Broker ist die Bezeichnung der Quelle der Daten, zum Beispiel der Name des Handelsservers. Die Art ist „Kerzen“ mit ihrer Zeiteinheit (zum Beispiel „Kerzen H1“ für Stundenkerzen) oder „Ticks“. Die Spalten:

| Spalte | Inhalt |
| --- | --- |
| Zeiträume | die Zeiträume, die Daten abdecken, jeweils von Beginn bis Ende; bei mehr als drei steht „und N weitere“ |
| Lücken | die Lücken in diesen Zeiträumen (siehe unten) oder „keine“ |
| Menge | die Zahl der Kerzen beziehungsweise Ticks |

Alle Zeiten stehen in UTC (siehe Glossar), im Format TT.MM.JJJJ hh:mm. „Aktualisieren“ liest den Datenbestand neu. Importe und Beschaffungen aktualisieren die Anzeige selbst.

Eine **Lücke** ist ein Zeitraum, in dem eine Reihe Daten haben müsste, aber keine hat. Eine Lücke ist nicht, was nie geladen wurde: Zeiträume, die gar nicht abgedeckt sind, zeigt die Tabelle einfach nicht als Zeitraum. Ob ein Loch eine Lücke ist, richtet sich nach den Handelszeiten, die die Quelle liefert. Fehlen sie, gilt: Bei Kerzen liegt mehr als die doppelte Dauer der Zeiteinheit zwischen zwei Kerzen (bei H1 also mehr als zwei Stunden), und das Loch liegt nicht ganz im Wochenende (Freitag 22:00 bis Sonntag 22:00 UTC). Bei M1 sind einzelne fehlende Kerzen innerhalb einer Stunde, in der es Kerzen gibt, keine Lücke, weil Broker in ruhigen Minuten oft keine liefern. Bei Ticks ist eine Pause von mehr als einer Stunde außerhalb des Wochenendes eine Lücke. Eine Lücke reicht vom ersten bis zum letzten Handelszeitpunkt des Lochs. Ein Testlauf braucht lückenlose Daten; Lücken füllen Sie durch Import oder Beschaffung.

**Angaben zum Instrument je Broker.** Je Broker und Instrument zeigt die Tabelle die Angaben, die ein Testlauf braucht: Beschaffungszeitpunkt (UTC), Tickgröße, Tickwert mit Währung, Pip, Punkt, Spread (als Kursunterschied), Mindestvolumen, Schritt des Volumens, Kontraktgröße, Swap für Kauf und Verkauf, den Wochentag des dreifachen Swaps und die Margin je Lot („–“, wenn die Quelle keine nennt). Sie belegen später die Angaben zum Instrument im Testlauf vor; dort lassen sie sich für einen Testlauf ändern.

**Standardquelle.** Die Standardquelle ist der Broker, dessen Daten ein Testlauf verwendet. Tippen Sie den Namen des Brokers ein oder wählen Sie einen aus der Liste der Brokers, die der Datenbestand kennt, und klicken Sie auf „Als Standardquelle festlegen“. „Keine Standardquelle“ entfernt sie. Sie können die Standardquelle festlegen, bevor Daten dieses Brokers vorliegen. Der Name darf nicht leer sein, höchstens 128 Zeichen haben und nicht mit einem Leerzeichen beginnen oder enden.

Die beiden weiteren Bereiche beschreiben die Abschnitte 8 und 9.

## 8. Datei importieren

Der Import liest eine Datei, prüft sie und übernimmt die Daten in den Datenbestand. Eine Datei enthält genau eine Reihe (Kerzen einer Zeiteinheit oder Ticks eines Instruments bei einem Broker) oder die Angaben zu einem Instrument.

**Dateiformate.**

- **JSON** nach dem Aufbau, den Pipwerk festlegt (`contracts/market-data/v1/`). Eine solche Datei nennt Broker, Instrument und Zeiteinheit selbst und enthält die Zeitpunkte in UTC. Dateien von `pipwerk-fetch-mt5` haben dieses Format. Beim Import einer JSON-Datei geben Sie nichts weiter an.
- **CSV** im Exportformat von MetaTrader 5. Die Datei enthält Kopfzeile und Zeilen, getrennt durch Tabulator (wie MetaTrader 5 exportiert), Semikolon oder Komma. Für Kerzen braucht sie Datum und Uhrzeit sowie Open, High, Low und Close (Tickvolumen, Volumen und Spread sind freiwillig), für Ticks Datum und Uhrzeit sowie Bid und Ask. Eine CSV-Datei enthält nicht, zu welchem Broker, Instrument und welcher Zeiteinheit sie gehört und in welcher Zeitzone ihre Zeiten stehen. Das geben Sie beim Import an.

**Export aus MetaTrader 5.** In MetaTrader 5 öffnen Sie über das Menü „Ansicht“ das Fenster „Symbole“, wählen auf der Registerkarte „Bars“ (für Kerzen) beziehungsweise „Ticks“ das Symbol, bei Bars die Zeiteinheit und den Zeitraum, laden die Kurse und klicken auf „Export“. MetaTrader 5 speichert eine CSV-Datei. Die Bezeichnungen können je nach Version abweichen. Notieren Sie sich beim Export, welches Symbol, welche Zeiteinheit und welcher Handelsserver gewählt waren. Der Name des Handelsservers steht in MetaTrader 5 in der Titelzeile des Fensters oder bei den Kontoangaben.

**Zeitzone.** MetaTrader 5 exportiert die Zeit des Handelsservers des Brokers, nicht UTC. pipwerk speichert alle Zeiten in UTC, damit Tageswechsel, Swap und das Wochenende im ganzen Datenbestand auf dieselbe Zeit zielen. Geben Sie deshalb beim Import die Zeitzone des Servers an: als Name nach IANA, zum Beispiel `Europe/Athens` (UTC+2, im Sommer UTC+3) oder `Europe/Berlin`. Viele Broker verwenden `Europe/Athens`. Die Sommerzeit wird beachtet. Welche Zeitzone Ihr Broker verwendet, erfahren Sie bei ihm. Eine Probe: Vergleichen Sie die Zeit der letzten Kerze in MetaTrader 5 mit der aktuellen UTC-Zeit. Kennt pipwerk den Namen nicht, bricht der Import mit „Die Zeitzone ist unbekannt.“ ab. Das Feld bietet die Namen an, die Ihr Browser kennt. Zwei Sonderfälle beim Wechsel der Sommerzeit: Eine Ortszeit, die beim Zurückstellen der Uhr doppelt vorkommt, gilt als die frühere. Eine Ortszeit, die beim Vorstellen der Uhr fehlt, ist eine abgelehnte Zeile („Diese Ortszeit gibt es nicht (Umstellung auf Sommerzeit).“).

**So importieren Sie.**

1. Klicken Sie im Bereich „Datei von Hand importieren“ auf „Datei wählen …“ und wählen Sie die Datei. Die Oberfläche zeigt Namen und Größe und das erkannte Format. Eine Datei mit anderer Endung als `.json` oder `.csv` wird nicht angenommen („Format nicht erkannt. Erlaubt sind JSON und CSV.“). „Datei entfernen“ nimmt die Auswahl zurück.
2. Bei einer CSV-Datei füllen Sie die Felder mit Stern aus: **Broker** (zum Beispiel der Name des Handelsservers; haben Sie eine Standardquelle festgelegt, ist sie vorbelegt), **Instrument** (zum Beispiel EURUSD), **Art der Daten** (Kerzen oder Ticks), bei Kerzen die **Zeiteinheit** (zum Beispiel H1) und die **Zeitzone der Datei**. Solange etwas fehlt, ist „Importieren“ gesperrt.
3. Klicken Sie auf „Importieren“.

**Ergebnis.** Nach dem Import zeigt die Oberfläche: wie viele Zeilen übernommen wurden und wie viele davon vorhandene Zeilen desselben Zeitpunkts ersetzt haben; die Reihe (Broker, Instrument, Art); den Zeitraum der übernommenen Zeilen (UTC); die Zahl der abgelehnten Zeilen mit einer Tabelle, die je Zeile ihre Nummer und den Grund nennt. Bei einer CSV-Datei ist die Kopfzeile die Zeile 1. Bei einer JSON-Datei ist es die Stelle des Eintrags. Die Tabelle nennt höchstens die ersten 1000 abgelehnte Zeilen; gezählt werden alle.

Der Import prüft: Format, Zeitordnung (jede Zeit nach der vorigen, keine doppelte), Kurse größer als 0, bei Kerzen Hoch nicht unter Eröffnung, Tief und Schluss, Tief nicht über Eröffnung und Schluss. Eine fehlerhafte Zeile lehnt er ab; die übrigen übernimmt er. Zeilen mit demselben Zeitpunkt wie vorhandene Daten ersetzen diese. Ein erneuter Import derselben Datei ersetzt also alle ihre Zeilen und verändert sonst nichts. Wird die ganze Datei abgelehnt, ändert sich nichts im Datenbestand, und die Meldung nennt den Grund: zu große Datei, zu viele Zeilen, Text nicht lesbar (speichern Sie die Datei als UTF-8), kein gültiges JSON, falscher Aufbau, falsche Kopfzeile der CSV-Datei, ungültiger Broker, Instrument oder Zeiteinheit, unbekannte Zeitzone, ungültiger Zeitraum, keine Zeilen. Die Größe einer Datei ist begrenzt (Voreinstellung 32 MiB und 500 000 Zeilen).

Die gewählte Datei wird geprüft und nie ausgeführt. Jeder Import ersetzt vorhandene Zeilen nur, wenn der Zeitpunkt gleich ist. Wenn viele Importe gleichzeitig laufen, antwortet pipwerk replay mit „Das Backend ist gerade ausgelastet. Versuchen Sie es in einem Moment noch einmal.“

## 9. Daten von Hand beschaffen

Die Beschaffung holt Kursdaten aus der eingerichteten Quelle, zum Beispiel aus `pipwerk-fetch-mt5` auf dem Rechner von MetaTrader 5 (Abschnitt 10), und übernimmt sie wie einen Import. Fehlende Daten eines Testlaufs werden später automatisch beschafft; hier stoßen Sie es selbst an. Voraussetzung ist eine eingerichtete Quelle (Abschnitt 2). Der Broker der Daten steht in den Dateien der Quelle; Sie wählen ihn nicht.

**Felder.**

| Feld | Bedeutung |
| --- | --- |
| Instrument* | Das Instrument, dessen Daten Sie holen wollen, zum Beispiel EURUSD. Die Quelle muss es kennen (Abschnitt 10, „Zuordnung der Bezeichnung zum Symbol“). |
| Art der Daten | „Kerzen“, „Ticks“ oder „Angaben zum Instrument“. Ticks werden nicht aus Kerzen gebildet und Kerzen nicht aus Ticks. Ticks müssen vorliegen, wenn eine Strategie den Auslöser „Tick“ hat. |
| Zeiteinheit | bei Kerzen die Kerzenlänge, zum Beispiel H1 |
| Von (UTC)*, Bis (UTC)* | Beginn und Ende der gewünschten Daten als Datum und Uhrzeit in UTC. „Von“ gehört zum Zeitraum, „Bis“ gehört nicht mehr dazu. Für einen ganzen Tag wählen Sie „Von“ 00:00 Uhr dieses Tages und „Bis“ 00:00 Uhr des nächsten Tages. Vorbelegt sind die letzten sieben ganzen Tage bis 00:00 Uhr des heutigen Tages. Bei Ticks und kleinen Zeiteinheiten wählen Sie kurze Zeiträume, zum Beispiel eine halbe Stunde Ticks: Eine Quelle liefert je Anfrage nur eine begrenzte Zahl von Zeilen (Abschnitt 10). Bei „Angaben zum Instrument“ gibt es keinen Zeitraum. |

**Ablauf.** Klicken Sie auf „Beschaffung anstoßen“. Solange die Beschaffung läuft, zeigt ein Balken „Die Beschaffung läuft. Das kann bei langen Zeiträumen Minuten dauern.“; der Knopf ist gesperrt. Wechseln Sie die Ansicht, bevor die Beschaffung endet, sehen Sie ihr Ergebnis nicht mehr; sie läuft im Hintergrunddienst zu Ende, und die Daten stehen danach im Datenbestand. Das Ergebnis erscheint so:

- **Erfolg:** „Beschafft und importiert: N Zeilen, Zeitraum … (UTC).“ Darunter stehen Broker, Instrument und gegebenenfalls die Zahl abgelehnter Zeilen und die Zahl der Zeilen, die die Quelle ausgelassen hat. Die Daten stehen sofort im Datenbestand.
- **Fehler:** Die rote Meldung „Nicht beschafft“ nennt den Grund. Der Datenbestand bleibt unverändert, soweit der Teil nicht beschafft wurde.

**Meldungen und was Sie tun.**

| Meldung | Bedeutung und nächster Schritt |
| --- | --- |
| „Keine Quelle eingerichtet. …“ | pipwerk replay kennt keine Quelle. Richten Sie sie ein (Abschnitt 2 und 10). Alles andere funktioniert weiter. |
| „Quelle nicht erreichbar. …“ | Keine Verbindung zur Quelle: Läuft `pipwerk-fetch-mt5`? Stimmen Adresse und Port? Erlaubt die Firewall des Rechners von MetaTrader 5 die Verbindung? |
| „Die Quelle hat den Schlüssel abgelehnt. …“ | Der Schlüssel in der Startkonfiguration von pipwerk replay ist ein anderer als in der der Quelle. Beide müssen gleich sein. |
| „Die Quelle nimmt die Anfrage nicht an, weil der Name ihrer Adresse dort nicht erlaubt ist. …“ | Tragen Sie in der Startkonfiguration der Quelle unter `allowed_hosts` die Adresse ein, unter der pipwerk replay sie erreicht (oder `*ip` für jede Netzwerkadresse). |
| „Das Instrument ist beim Broker unbekannt. …“ | Der Broker kennt das Symbol nicht. Prüfen Sie die Schreibweise und die Zuordnung in der Quelle (Abschnitt 10). |
| „Der Broker hat für diesen Zeitraum keine Daten.“ | Für den Zeitraum liegen beim Broker keine Daten vor. Wählen Sie einen anderen Zeitraum. |
| „Der Zeitraum ist zu groß. Wählen Sie einen kleineren Zeitraum.“ | Die Quelle begrenzt, wie viele Zeilen und Abrufe eine Anfrage haben darf. Holen Sie große Zeiträume in Teilen, besonders Kerzen M1 und Ticks. pipwerk replay zerlegt große Zeiträume nicht. |
| „MetaTrader 5 ist nicht erreichbar. …“ | MetaTrader 5 läuft nicht oder ist nicht am Konto angemeldet. Starten Sie es und melden Sie sich an. |
| „MetaTrader 5 hat die Abfrage mit einem Fehler beendet.“ | Versuchen Sie es erneut; prüfen Sie MetaTrader 5. |
| „Der Import hat die Daten der Quelle abgelehnt: …“ | Die Quelle hat eine Datei geliefert, die der Import nicht annimmt; der Grund steht dahinter. |
| „Der Datenbestand konnte nicht geändert werden.“ | Ein technischer Fehler in der Datenbank. Prüfen Sie den Hintergrunddienst. |

Die Quelle und pipwerk replay nennen Fehler in einer festen Form. Für einen Fehler, den die Oberfläche nicht kennt, zeigt sie den Grund, den die Quelle nennt (auf Deutsch).

## 10. pipwerk-fetch-mt5 auf dem Rechner von MetaTrader 5 einrichten

`pipwerk-fetch-mt5` ist ein kleines Programm für den Rechner, auf dem MetaTrader 5 läuft. Es liest Kerzen, Ticks und die Angaben zu einem Instrument aus MetaTrader 5 und liefert sie über das Netz an pipwerk replay. Es handelt nie: Es liest nur. Es nimmt nur Anfragen an, die den gemeinsamen Schlüssel mitbringen, weil es einen Rechner mit Handelssoftware erreicht. Es gehört in ein Netz, das Sie kontrollieren. Es verschlüsselt die Verbindung nicht; machen Sie es nie aus einem fremden Netz erreichbar.

**Voraussetzungen.** Ein Windows-Rechner, auf dem MetaTrader 5 installiert ist und läuft, am Konto des Brokers angemeldet. Das Programm `uv` (https://docs.astral.sh/uv/), das Python 3.14 bei Bedarf selbst lädt. Einen Zugang zum Internet für die Installation. Die Dateien des Verzeichnisses `components/pipwerk-fetch-mt5` aus dem Repository auf dem Rechner. Der Algo-Handel muss in MetaTrader 5 nicht eingeschaltet sein.

**Schritte.**

1. **Installieren:** Starten Sie `scripts\install.cmd` im Verzeichnis `components\pipwerk-fetch-mt5`. Es installiert die Programmteile in einen eigenen Ordner `.venv` unter der Komponente und ändert das Python Ihres Systems nicht.
2. **Startkonfiguration anlegen:** Kopieren Sie `pipwerk-fetch-mt5.example.ini` unter dem Namen `pipwerk-fetch-mt5.ini` nach `%USERPROFILE%\pipwerk\etc` (der Ordner `pipwerk\etc` in Ihrem Benutzerordner) und tragen Sie ein:
   - `shared_key` im Abschnitt `[security]`: der gemeinsame Schlüssel, 16 bis 256 sichtbare Zeichen ohne Leerzeichen. Erzeugen Sie ihn zufällig, zum Beispiel mit `python -c "import secrets; print(secrets.token_urlsafe(32))"`. Denselben Schlüssel tragen Sie bei pipwerk replay ein (siehe unten).
   - `server_time_zone` im Abschnitt `[broker]`: die Zeitzone der Serverzeit Ihres Brokers als IANA-Name, zum Beispiel `Europe/Athens` (siehe unten, „Zeitzone und Sommerzeit“).
   - `host` und `port` im Abschnitt `[server]`: Mit `host = 127.0.0.1` ist das Programm nur auf diesem Rechner erreichbar. Für pipwerk replay auf einem anderen Rechner tragen Sie die Netzwerkadresse dieses Rechners im vertrauten Netz ein oder `0.0.0.0` (alle Adressen). Der Port ist voreingestellt auf 8765. Bei `0.0.0.0` tragen Sie unter `allowed_hosts` die Adresse ein, unter der pipwerk replay das Programm erreicht, oder `*ip` für jede Netzwerkadresse.
   - Schützen Sie die Datei so, dass nur Ihr Benutzer sie lesen kann. Sie enthält den Schlüssel.
3. **MetaTrader 5 starten** und am Konto anmelden.
4. **Programm starten:** `scripts\start.cmd`. Es meldet sich nicht mit einer Oberfläche; es läuft im Terminalfenster, bis Sie Strg+C drücken. Soll es dauerhaft laufen, richten Sie den Start mit der Aufgabenplanung von Windows ein; das ist Sache des Betreibers.
5. **Prüfen:** Die Adresse `http://<Adresse des Rechners>:8765/api/v1/health` muss mit dem Schlüssel `{"status": "ok"}` liefern; ein Aufruf ohne Schlüssel liefert „Schlüssel fehlt oder ist falsch“. Einfacher prüfen Sie es in pipwerk replay: Holen Sie die „Angaben zum Instrument“ von EURUSD (Abschnitt 9).
6. **pipwerk replay einrichten:** Tragen Sie bei pipwerk replay die Adresse der Quelle (`http://<Adresse des Rechners>:8765`) und denselben Schlüssel ein. In der Testumgebung geben Sie beim Start `--source-url` und `--source-key-file` an (Abschnitt 2), im Entwicklungsbetrieb tragen Sie `fetch_url` und `fetch_key` in `[source]` der Startkonfiguration ein.

**Zuordnung der Bezeichnung zum Symbol.** pipwerk replay fragt nach einem Instrument mit seiner Bezeichnung, zum Beispiel `EURUSD`. Der Broker nennt es vielleicht `EURUSD.r`. Im Abschnitt `[symbols]` der Startkonfiguration ordnen Sie zu: `EURUSD = EURUSD.r`. Groß- und Kleinschreibung zählen. Ohne Eintrag gilt die Bezeichnung selbst als Symbol. Die Dateien nennen immer die Bezeichnung, nie das Symbol des Brokers. Bei der Beschaffung wählt das Programm das Symbol im Marktfenster von MetaTrader 5 aus; es bleibt dort danach stehen.

**Zeitzone und Sommerzeit.** MetaTrader 5 liefert die Zeit des Handelsservers. `pipwerk-fetch-mt5` rechnet sie mit der Zeitzone aus `server_time_zone` in UTC um, mit Sommerzeit. Stimmt die Zeitzone nicht, sind alle Zeiten um Stunden verschoben, und Tageswechsel, Swap und Wochenende liegen im Testlauf falsch. Fragen Sie Ihren Broker nach der Zeitzone seines Servers und prüfen Sie sie: Die Zeit der letzten Kerze in MetaTrader 5 minus der Versatz der Zeitzone muss die aktuelle UTC-Zeit ergeben. Rat zur Sommerzeit:

- Einmal im Jahr, wenn die Uhr zurückgestellt wird, kommt eine Stunde der Serverzeit zweimal vor. Die Quelle liefert die erste dieser Stunden und lässt die zweite aus; das Ergebnis nennt die Zahl der ausgelassenen Zeilen („Die Quelle hat N Zeilen ausgelassen“). Bei Kerzen ist das zuverlässig. Bei **Ticks** erkennt die Quelle die zweite Stunde nur, wenn der Markt in dieser Zeit dicht genug ist. In einem ruhigen Markt kann eine Zeile der zweiten Stunde mit einer UTC-Zeit geliefert werden, die eine Stunde zu früh liegt, ohne dass es gemeldet wird. Das ist ein Mangel der Daten von MetaTrader 5, der sich nicht erkennen lässt.
- Deshalb: Bietet Ihr Broker einen Server ohne Sommerzeit an, verwenden Sie ihn und seine Zeitzone (zum Beispiel `Etc/GMT-2` für UTC+2 das ganze Jahr). Andernfalls **holen Sie Ticks nicht über den Wechsel der Sommerzeit hinweg**: Lassen Sie den Zeitraum mindestens zwei Stunden vor der doppelten Stunde enden oder mindestens zwei Stunden danach beginnen. Der Wechsel liegt bei den meisten Brokern auf dem Wochenende, an dem kein Handel ist.
- Beim Vorstellen der Uhr fehlt eine Stunde der Serverzeit. Zeilen dieser Zeit gibt es nicht; sie erscheinen nicht als Fehler.

**Grenzen einer Anfrage.** Die Quelle liefert höchstens 50 000 Zeilen und liest bei einer Anfrage höchstens 500 Abschnitte aus MetaTrader 5 (Kerzen: 10 000 je Abschnitt, Ticks: 6 Stunden je Abschnitt, also etwa 125 Tage Ticks). Für einen größeren Zeitraum meldet sie „Der Zeitraum ist zu groß“. Holen Sie solche Zeiträume in mehreren Teilen. Die Grenzen lassen sich in der Startkonfiguration der Quelle ändern.

**Handelszeiten.** MetaTrader 5 liefert über das Programm keine Handelszeiten. Der Datenbestand verwendet dann die Ersatzregel für Lücken (Abschnitt 7).

## 11. Bekannte Einschränkungen

- Es gibt noch keinen Testlauf: weder Einzelschritt-Test noch Backtest, und keine gespeicherten Backtests. Sie folgen in späteren Arbeitspaketen.
- Die Beschaffung holt, was Sie angeben; sie zerlegt große Zeiträume nicht und erkennt nicht von selbst, was fehlt. Die Beschaffung fehlender Daten beim Start eines Testlaufs kommt mit dem Testlauf.
- Der Stand einer Beschaffung liegt im Speicher des Hintergrunddienstes. Nach einem Neustart von pipwerk replay ist er weg; bereits importierte Daten bleiben im Datenbestand.
- Mit `--host` kann jeder im Netz pipwerk replay benutzen; es gibt keine Anmeldung (Abschnitt 2).
- pipwerk replay besitzt noch kein Installationspaket für Anwender.
- In der Testumgebung geht mit `testenv stop` alles verloren: Testkonten, Datenbestand, Standardquelle und Sprache (Abschnitt 2).
- Weitere Sprachen als Deutsch und Englisch sind nicht verfügbar.
- Die Seite `/docs` des Hintergrunddienstes lädt ihre Darstellung aus dem Internet; ohne Internet bleibt sie leer, die Funktionen laufen trotzdem.
- Die Anbindung an ein echtes MetaTrader 5 ist hier nur mit einer Nachbildung der Quelle geprüft; die Prüfung gegen eine echte Installation macht der Auftraggeber in der Abnahme.

## 12. Glossar

| Begriff | Bedeutung |
| --- | --- |
| Strategietester | pipwerk replay: führt Strategien gegen historische Kursdaten aus. |
| Testkonto | Benannter, gespeicherter Satz von Kontowerten für die Abwicklung eines Testlaufs: Anfangskapital, Kontowährung, Hebel, Spread, Kommission. Es gehört zu keinem Instrument. |
| Standard-Testkonto | Das mitgelieferte Testkonto (10 000 EUR, Hebel 30, Spread aus den Kerzen, Kommission 0). Es lässt sich ändern und löschen; pipwerk replay legt es beim Start mit den Ausgangswerten neu an, wenn es fehlt. |
| Hebel | Das Verhältnis, in dem Sie mit dem Kapital mehr Marktwert bewegen können; 30 bedeutet 1:30. |
| Spread | Der Abstand zwischen Kauf- und Verkaufskurs. |
| Punkt | Die kleinste Preisstufe eines Instruments. |
| Pip | Die übliche Einheit für Kursunterschiede; bei vielen Instrumenten zehn Punkte. |
| Lot | Die Einheit der Handelsmenge. |
| Swap | Die Gebühr oder Gutschrift für eine Position über Nacht. |
| Margin | Die Sicherheitsleistung, die für eine Position gebunden wird. |
| Datenbestand historischer Kursdaten | Der von pipwerk geführte Bestand an Kerzen, Ticks und Angaben zu Instrumenten, aus dem der Strategietester liest. |
| Kerze | Eröffnung, Hoch, Tief und Schluss eines Instruments in einem Zeitabschnitt, zum Beispiel einer Stunde. |
| Tick | Eine einzelne Kursänderung mit Geld- und Briefkurs. |
| Zeiteinheit | Die Länge einer Kerze, zum Beispiel M15 (15 Minuten), H1 (eine Stunde), D1 (ein Tag). |
| Broker | Der Anbieter der Kurse und des Handelskontos. Im Datenbestand die Bezeichnung der Quelle der Daten, zum Beispiel der Name des Handelsservers. |
| Quelle | Ein Programm, aus dem pipwerk replay Kursdaten holt, zum Beispiel `pipwerk-fetch-mt5`. |
| Standardquelle | Der Broker, dessen Daten ein Testlauf verwendet. |
| Import | Die Übernahme einer Datei im Format JSON oder CSV in den Datenbestand. |
| Beschaffung | Das Holen von Kursdaten und Angaben zum Instrument aus einer Quelle und ihre Übernahme in den Datenbestand. |
| Lücke | Ein Zeitraum in einer Reihe, in dem Daten fehlen, obwohl gehandelt wurde. |
| UTC | Die Weltzeit, auf die pipwerk alle Zeiten umrechnet. |
| Zeitzone (IANA-Name) | Der Name einer Zeitzone mit ihren Regeln für die Sommerzeit, zum Beispiel `Europe/Athens`. |
| Serverzeit | Die Zeit des Handelsservers eines Brokers, in der MetaTrader 5 Kurse liefert. |
| gemeinsamer Schlüssel | Ein geheimer Text, den pipwerk replay und die Quelle kennen. Die Quelle nimmt nur Anfragen an, die ihn mitbringen. |
| Startkonfiguration | Die INI-Datei, die ein Programm beim Start liest, zum Beispiel mit der Datenbankverbindung und der Adresse der Quelle. |
| Commit | Ein festgehaltener Stand aller Dateien eines Programms im Repository, mit Kennung und Datum. |
| Stand | Der Commit, aus dem pipwerk replay gebaut oder gestartet wurde. Er ist keine Versionsnummer. |
| Repository | Der Ort, an dem alle Dateien von Pipwerk mit ihrer Änderungsgeschichte gespeichert sind: https://github.com/macodix/pipwerk. |
| Testumgebung | pipwerk replay, gebaut und gestartet aus genau einem Commit eines Arbeitsverzeichnisses ohne nicht committete Änderungen. |
| Testumgebungsskript | Das Skript `components/pipwerk-replay/scripts/testenv`, das die Testumgebung startet, abfragt und beendet. |
| Entwicklungsbetrieb | Der Start von pipwerk replay von Hand in zwei Terminals, bei dem Änderungen an den Dateien sofort wirken. |
| Hintergrunddienst | Der Teil von pipwerk replay, der außerhalb des Browsers auf dem Rechner läuft und Testkonten, Datenbestand und Einstellungen speichert. Er wird auch Backend genannt. |
| Port | Eine Zahl von 1 bis 65535, unter der ein Programm auf dem Rechner Verbindungen annimmt. |
| Netzwerkadresse | Die Zahlenfolge, unter der ein Rechner im Netz erreichbar ist, zum Beispiel `192.168.0.12`. `127.0.0.1` ist der eigene Rechner; `0.0.0.0` bedeutet beim Start mit `--host` alle Adressen des Rechners. |
| Terminal | Das Fenster, in dem Sie Befehle eintippen. |
| Pfad | Die Angabe, wo eine Datei oder ein Verzeichnis auf dem Rechner liegt, mit `/` getrennt (unter Windows `\`). |
| Tooltip | Ein kleines Hinweisfenster, das erscheint, wenn der Mauszeiger kurz über einer Anzeige verweilt oder das Symbol den Fokus hat. |
| Fokus | Das Bedienelement, das die Tastatur gerade steuert. Die Tabulatortaste wechselt es. |
| ausgecheckt | Der Commit, dessen Dateien gerade im Arbeitsverzeichnis liegen. |
