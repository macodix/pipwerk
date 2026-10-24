# pipwerk replay – Anwenderdokumentation

## Dokumentstatus

- status: `draft`
- stand: 2026-10-24
- komponente: `pipwerk-replay`
- vorhaben: `backtest`, Arbeitspaket `wp02`, Aufträge 05, 14 und 17

## 1. Wozu pipwerk replay dient

pipwerk replay ist der Strategietester von Pipwerk. Er führt Handelsstrategien gegen historische Kursdaten aus. Er liest die Kursdaten nur aus einem eigenen Bestand, dem Datenbestand historischer Kursdaten. Außerdem verwaltet er die Testkonten. Ein Testkonto ist ein Satz von Kontowerten, mit dem später ein Testlauf rechnet.

Der derzeitige Stand von pipwerk replay kann zwei Dinge:

1. **Testkonten** anlegen, ändern, speichern und löschen (Abschnitt 6).
2. Den **Datenbestand** ansehen und füllen (Abschnitte 7 und 8): Sie sehen, welche Kursdaten vorliegen und wo Lücken sind. Sie importieren Dateien, zum Beispiel einen Export aus MetaTrader 5 oder die Dateien von `pipwerk-fetch-mt5`, beliebig viele auf einmal. Sie löschen Daten, die Sie nicht mehr brauchen. Sie wählen den Broker, dessen Daten ein Testlauf verwendet.

**pipwerk replay beschafft bis pipwerk relay nichts.** Es holt keine Kursdaten aus MetaTrader 5 und von keiner anderen Stelle, weder von Hand noch automatisch. Kursdaten kommen nur durch den Import in den Datenbestand. Sie holen sie mit dem Programm `pipwerk-fetch-mt5` auf dem Rechner, auf dem MetaTrader 5 läuft (Abschnitt 9), und importieren die Dateien, die es schreibt. Das ist eine Übergangslösung, bis pipwerk relay den Austausch übernimmt.

Strategien lassen sich noch nicht testen. Der Testlauf (Einzelschritt-Test und Backtest) und die gespeicherten Backtests folgen in späteren Arbeitspaketen. Ihre Menüeinträge gibt es deshalb noch nicht. Begriffe, die Sie ohne Vorwissen vielleicht nicht kennen, erklärt das Glossar in Abschnitt 11.

## 2. pipwerk replay öffnen

Eine Installation für Anwender gibt es noch nicht. pipwerk replay lässt sich auf zwei Wegen starten: als Testumgebung und im Entwicklungsbetrieb. Beide Wege brauchen eine gültige INI-Startkonfiguration (siehe Glossar). Sie legt mindestens die Datenbankverbindung fest. Die Testumgebung legt sie selbst an. Ohne eine gültige INI-Startkonfiguration bricht der Start mit einer Fehlermeldung ab; eine Ersatzdatenbank wird nicht angelegt. Weitere Angaben, etwa zu Kursdaten, braucht pipwerk replay nicht.

### Erster Weg: Testumgebung

Die Testumgebung ist pipwerk replay, gebaut und gestartet aus genau einem Commit (siehe Glossar). In der Testumgebung läuft also genau der Stand, den die Fußzeile und der Dialog „Über pipwerk replay“ nennen (Abschnitt 4).

Die Testumgebung wird mit dem Testumgebungsskript `components/pipwerk-replay/scripts/testenv` gestartet, abgefragt und beendet. Welche Programme dafür auf dem Rechner vorhanden sein müssen, steht in der technischen Dokumentation `docs/technical/pipwerk-replay.md` im Abschnitt „Start als Testumgebung“. Die Befehle rufen Sie in einem Terminal (siehe Glossar) im obersten Verzeichnis des Arbeitsverzeichnisses auf, also in dem Verzeichnis, in dem auch die Datei `LICENSE` liegt. Statt des relativen Pfads im Befehl können Sie den vollständigen Pfad des Skripts angeben und den Befehl aus einem beliebigen Verzeichnis aufrufen (zu „Pfad“ siehe Glossar).

1. Starten: `components/pipwerk-replay/scripts/testenv start --frontend-port <Port der Oberfläche> --backend-port <Port des Hintergrunddienstes>`. Beide Ports wählen Sie selbst. Sie müssen frei sein und sich unterscheiden. Der Start dauert, weil das Skript die Programmteile installiert und die Oberfläche baut. Er endet erst, wenn pipwerk replay antwortet.
2. Öffnen: Rufen Sie im Webbrowser die Adresse auf, die das Skript am Ende des Starts nennt (Meldung „pipwerk replay is running: …“). Ohne `--host` ist das `http://127.0.0.1:<Port der Oberfläche>/`.
3. Abfragen: `components/pipwerk-replay/scripts/testenv status` nennt, ob die Testumgebung läuft, und die Adressen von Oberfläche und Hintergrunddienst.
4. Beenden: `components/pipwerk-replay/scripts/testenv stop` beendet pipwerk replay und entfernt die Dateien der Testumgebung, auch ihre Datenbank. Damit gehen die Testkonten, der Datenbestand, der gewählte Broker für Testläufe und die gespeicherte Sprache verloren. Nach einem erneuten Start ist wieder Deutsch eingestellt, der Datenbestand ist leer und es gibt nur das Standard-Testkonto.

Der Datenbestand beginnt in der Testumgebung leer. Füllen Sie ihn durch den Import (Abschnitt 8).

**Zugriff von anderen Rechnern:** Achtung, lesen Sie zuerst diesen Hinweis. Mit `--host` kann jeder, der Ihren Rechner im Netz erreicht, pipwerk replay benutzen, die Einstellungen ändern, Testkonten anlegen, ändern und löschen und Dateien in den Datenbestand importieren. Es gibt keine Anmeldung. Verwenden Sie `--host` deshalb nur in einem Netz, dem Sie vertrauen. Ohne `--host` ist pipwerk replay nur von Ihrem eigenen Rechner aus erreichbar. Der Befehl lautet zum Beispiel: `components/pipwerk-replay/scripts/testenv start --frontend-port <Port der Oberfläche> --backend-port <Port des Hintergrunddienstes> --host 0.0.0.0`. `0.0.0.0` bedeutet: alle Netzwerkadressen des Rechners (siehe Glossar). Andere Rechner verwenden die Netzwerkadresse Ihres Rechners, also `http://<Netzwerkadresse des Rechners>:<Port der Oberfläche>/`. Ein Rechnername statt der Netzwerkadresse funktioniert nicht, pipwerk replay weist die Anfrage ab.

Der Start bricht mit einer Fehlermeldung ab, wenn das Arbeitsverzeichnis nicht genau einem Commit entspricht (nicht committete Änderung oder neue Datei, die Git nicht ausdrücklich ignoriert) oder nicht in einem Git-Arbeitsbereich liegt. In diesem Fall wurde nichts installiert, gebaut oder gestartet. Committen oder verwerfen Sie die Änderungen und starten Sie erneut. Der Start bricht auch ab, wenn schon eine Testumgebung läuft oder ein Port belegt ist.

### Zweiter Weg: Entwicklungsbetrieb

Im Entwicklungsbetrieb starten Sie den Hintergrunddienst und die Oberfläche von Hand in zwei getrennten Terminals. Die Schritte stehen in der technischen Dokumentation `docs/technical/pipwerk-replay.md` im Abschnitt „Einrichtung und Start im Entwicklungsbetrieb“.

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

**Erklärungen zu den Feldern.** Jedes Feld und jede Einstellung hat eine kurze Erklärung in der Sprache des Handels. Sie erscheint, wenn Sie mit der Maus kurz auf der Bezeichnung des Feldes oder auf dem Symbol „i“ daneben verweilen, und auch, wenn das Symbol mit der Tabulatortaste den Fokus (siehe Glossar) erhält. Felder mit einem Stern sind Pflichtfelder. Auch die Spalten der Tabelle des Datenbestands und die Zeilen der Kontraktdaten erklären sich beim Verweilen mit der Maus. Die Zeilen der Tabelle erklären sich auch, wenn sie den Fokus haben.

**Leere Zustände.** Wo noch nichts da ist, nennt ein Hinweis den nächsten Schritt, zum Beispiel „Der Datenbestand ist leer. Nächster Schritt: Holen Sie Kursdaten mit pipwerk-fetch-mt5 auf dem Rechner von MetaTrader 5 und importieren Sie die Dateien mit „Datei importieren …“.“ Auch Fehlermeldungen nennen den nächsten Schritt.

**Fenstergrößen.** Die Oberfläche ist in den Fenstergrößen 390 × 844, 844 × 390, 820 × 1180, 1180 × 820, 1366 × 768 und 1920 × 1080 Pixel geprüft: Nichts liegt übereinander, und alle Bereiche, das Menü und die Dialoge sind erreichbar. In schmalen Fenstern bricht die Tabelle des Datenbestands Zellen um, damit sie ohne seitliches Scrollen passt. Wo eine Tabelle trotzdem breiter als das Fenster ist, hat sie eine eigene Bildlaufleiste.

**Was der Browser speichert.** Nichts. Sprache, Testkonten, Datenbestand und Einstellungen liegen im Hintergrunddienst. Namen, die Sie eingeben, Dateinamen und Namen aus dem Datenbestand zeigt die Oberfläche immer als Text an.

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

pipwerk replay kann auf Deutsch und auf Englisch angezeigt werden. Ohne zuvor gespeicherte Auswahl ist Deutsch eingestellt. Klicken Sie in der Kopfzeile auf „DE“ oder „EN“. Alle Texte erscheinen sofort in der gewählten Sprache. Der Name „pipwerk replay“, selbst vergebene Namen (zum Beispiel von Testkonten und Brokern), Dateinamen und die Namen von Instrumenten werden nicht übersetzt. Das Standard-Testkonto heißt auf Englisch „Default test account“.

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

Öffnen Sie im Menü „Datenbestand“. Die Ansicht hat eine Leiste und darunter die Tabelle der Datenreihen.

**Die Leiste.** Sie hat zwei Bedienelemente:

- **„Datei importieren …“** öffnet den Dialog, in dem Sie Dateien importieren (Abschnitt 8).
- **„Broker für Testläufe“** ist ein Auswahlfeld. Der Broker ist die Bezeichnung der Stelle, von der die Kursdaten stammen, bei MetaTrader 5 der Name des Handelsservers. Ein Testlauf liest die Kursdaten dieses Brokers. Das Feld bietet nur Broker an, deren Daten im Datenbestand vorkommen. Die Wahl gilt sofort und bleibt gespeichert. Haben Sie keinen gewählt, steht im Feld „– keiner gewählt –“, und ein Satz darunter nennt den Broker, der dann gilt: der erste Broker des Datenbestands in alphabetischer Reihenfolge. Mit „– keiner gewählt –“ nehmen Sie eine Wahl auch zurück. Löschen Sie alle Daten des gewählten Brokers (Abschnitt 8), ist danach keiner gewählt; auch ein späterer Import desselben Brokers wählt ihn nicht wieder. Solange der Datenbestand leer ist, steht dort „kein Broker“. In der Vorbereitung eines Testlaufs lässt sich der Broker für diesen Testlauf ändern (kommt mit dem Testlauf).

**Die Tabelle.** Sie zeigt eine Zeile je Datenreihe. Die Spalten:

| Spalte | Inhalt |
| --- | --- |
| Broker | der Broker der Daten |
| Instrument | das Instrument, zum Beispiel EURUSD |
| Daten | „Kerzen“ mit ihrer Zeiteinheit (zum Beispiel „Kerzen H1“ für Stundenkerzen), „Ticks“ oder „Kontraktdaten“ |
| Zeitraum | vom ersten bis zum letzten Tag, für den Daten vorliegen |
| Lücken | die Zahl der Lücken in der Reihe (siehe unten) |

Alle Zeiten stehen in UTC (siehe Glossar). Der Zeitraum nennt Tage im Format TT.MM.JJJJ, die Lücken in den Einzelheiten Datum und Uhrzeit, TT.MM.JJJJ hh:mm. Liegen für ein Instrument eines Brokers nur Kontraktdaten vor, aber keine Kerzen oder Ticks, zeigt die Tabelle dafür eine Zeile mit „Kontraktdaten“; Zeitraum und Lücken stehen dann als „–“.

**Filter und Seiten.** Über der Tabelle stehen die Felder „Broker“, „Instrument“ und „Daten“. Tippen Sie einen Teil des Namens ein; Groß- und Kleinschreibung zählt nicht. „EUR“ im Feld „Instrument“ zeigt alle Instrumente, deren Bezeichnung „EUR“ enthält. Im Feld „Daten“ geben Sie an, was die Tabelle zeigt („Kerzen H1“, „Ticks“, „Kontraktdaten“) oder einen Teil der Kennung (`h1`, `tick`). Weil die Kennung nur zum Teil gesucht wird, zeigt `h1` auch `h12`. Der Filter wirkt kurz nach der letzten Eingabe. Die Tabelle zeigt zehn Zeilen je Seite; unter ihr stehen die Zahl der Zeilen („11–20 von 25 Reihen“, bei einem Filter mit „(gefiltert)“), „Zurück“, die Seite und „Weiter“. Ein Filter führt zurück auf die erste Seite. Passt keine Zeile zum Filter, steht dort „Keine Reihe passt zum Filter. Nächster Schritt: Ändern Sie einen Filter oder leeren Sie ihn.“

**Einzelheiten einer Reihe.** Ein Klick auf eine Zeile (oder die Eingabetaste, wenn die Zeile den Fokus hat) zeigt darunter die Einzelheiten; ein weiterer Klick schließt sie. Sie zeigen:

- **Schaltflächen zum Löschen:** „Löschen …“ (nicht bei einer Zeile „Kontraktdaten“) und „Kontraktdaten löschen …“ (nur wenn es Kontraktdaten gibt). Sie sind in Abschnitt 8 beschrieben.
- **Lücken:** alle Lücken der Reihe mit Beginn und Ende (UTC), oder „Keine Lücken.“ Bei Reihen mit sehr vielen Lücken zeigt die Liste nicht alle; ein Satz nennt, wie viele gezeigt werden.
- **Kontraktdaten:** die Angaben zum Instrument bei diesem Broker, die ein Testlauf braucht: Tickgröße, Tickwert mit Währung, Pip, Punkt, Spread (als Kursunterschied), Mindestvolumen, Volumenschritt, Kontraktgröße, Swap für Kauf und Verkauf, den Wochentag des dreifachen Swaps, die Margin je Lot („–“, wenn der Broker keine nennt) und den Zeitpunkt, zu dem der Broker die Angaben geliefert hat. Fehlen die Kontraktdaten bei diesem Broker, steht dort: „Für dieses Instrument liegen bei diesem Broker keine Kontraktdaten vor. Ein Testlauf mit diesem Instrument startet dann nicht.“ und der Weg, sie zu holen und zu importieren. Die Kontraktdaten belegen später die Angaben zum Instrument im Testlauf vor.

**Was eine Lücke ist.** Jede importierte Datei deckt einen Zeitraum ab: bei einer JSON-Datei den Zeitraum, den die Datei selbst nennt, bei einer CSV-Datei die ganzen Tage vom ersten bis zum letzten Eintrag (in der Zeitzone, die Sie beim Import angegeben haben). Innerhalb eines abgedeckten Zeitraums gibt es keine Lücke: Was die Datei für ihren Zeitraum liefert, gilt als vollständig, auch wenn darin Zeiten ohne Kerzen oder Ticks liegen. Eine **Lücke** ist ein Zeitraum zwischen zwei abgedeckten Zeiträumen derselben Reihe, in dem beim Broker gehandelt wurde. Das ist zum Beispiel ein Handelstag, dessen Datei Sie nicht importiert haben, oder ein Zeitraum, den Sie gelöscht haben.

**Keine Lücken sind Zeiten ohne Handel:** Wochenenden (Freitag 22:00 bis Sonntag 22:00 UTC), Feiertage und andere Tage ohne Handel. Weder MetaTrader 5 noch seine Dateien nennen die Feiertage. Deshalb steht in der Startkonfiguration von pipwerk replay die Liste „Tage ohne Handel“ (`no_trading_days` im Abschnitt `[marketdata]`, Tage im Format `MM-TT` wie `12-25`). Vorbelegt sind der 25. Dezember und der 1. Januar. Ein solcher Tag reicht, wie das Wochenende, von 22:00 UTC des Vortags bis 22:00 UTC. Weitere Tage trägt der Betreiber in die Liste ein. Der frühe Handelsschluss am 24. und 31. Dezember am Ende einer Datei ist keine Lücke, weil die Datei den ganzen Tag abdeckt. Der Rand eines Wochenendes oder Feiertags kann bei einem Handelsserver in einer anderen Zeitzone als UTC+2 oder mit Sommerzeit eine Lücke von bis zu einigen Stunden zeigen; Sie erkennen sie an ihrer Lage am Wochenende oder Feiertag. Fehlt in einer Datei selbst ein Zeitraum, weil der Broker für ihn keine Daten hat, erkennt pipwerk replay das nicht als Lücke. Ein Testlauf braucht Daten für seinen ganzen Testzeitraum, außer in Zeiten ohne Handel; echte Lücken füllen Sie, indem Sie die Daten für den fehlenden Zeitraum holen und importieren.

## 8. Dateien importieren

Der Import liest Dateien, prüft sie und übernimmt die Daten in den Datenbestand. Eine Datei enthält genau eine Reihe (Kerzen einer Zeiteinheit oder Ticks eines Instruments bei einem Broker) oder die Kontraktdaten eines Instruments. Sie importieren beliebig viele Dateien in einem Vorgang, JSON und CSV gemischt.

**Dateiformate.**

- **JSON** nach dem Aufbau, den Pipwerk festlegt (`contracts/market-data/v1/`). Eine solche Datei nennt Broker, Instrument und Daten selbst und enthält die Zeitpunkte in UTC. Dateien von `pipwerk-fetch-mt5` haben dieses Format. Beim Import einer JSON-Datei geben Sie nichts weiter an, außer dem Broker, der für alle Dateien gilt (siehe unten).
- **CSV** im Exportformat von MetaTrader 5. Die Datei enthält Kopfzeile und Zeilen, getrennt durch Tabulator (wie MetaTrader 5 exportiert), Semikolon oder Komma. Für Kerzen braucht sie Datum und Uhrzeit sowie Open, High, Low und Close (Tickvolumen, Volumen und Spread sind freiwillig), für Ticks Datum und Uhrzeit sowie Bid und Ask. Eine CSV-Datei enthält nicht, zu welchem Broker, Instrument und welcher Zeiteinheit sie gehört und in welcher Zeitzone ihre Zeiten stehen. Das geben Sie beim Import an; Instrument und Zeiteinheit entnimmt pipwerk replay dem Dateinamen, soweit er sie enthält (siehe unten).

**Export aus MetaTrader 5.** In MetaTrader 5 öffnen Sie über das Menü „Ansicht“ das Fenster „Symbole“, wählen auf der Registerkarte „Bars“ (für Kerzen) beziehungsweise „Ticks“ das Symbol, bei Bars die Zeiteinheit und den Zeitraum, laden die Kurse und klicken auf „Export“. MetaTrader 5 speichert eine CSV-Datei. Die Bezeichnungen können je nach Version abweichen. Exportdateien von MetaTrader 5 heißen üblicherweise wie `EURUSD_H1_202301020000_202312292300.csv`; behalten Sie den Namen, dann erkennt pipwerk replay Instrument und Zeiteinheit selbst. Ein anderer Name stört nicht, dann geben Sie beide im Dialog an. Notieren Sie sich beim Export außerdem, welcher Handelsserver gewählt war. Sein Name steht in MetaTrader 5 in der Titelzeile des Fensters oder bei den Kontoangaben; er ist der Broker.

**Zeitzone.** MetaTrader 5 exportiert die Zeit des Handelsservers des Brokers, nicht UTC. pipwerk speichert alle Zeiten in UTC, damit Tageswechsel, Swap und das Wochenende im ganzen Datenbestand auf dieselbe Zeit zielen. Geben Sie deshalb beim Import die Zeitzone des Servers an: als Name nach IANA, zum Beispiel `Europe/Athens` (UTC+2, im Sommer UTC+3) oder `Europe/Berlin`. Viele Broker verwenden `Europe/Athens`. Die Sommerzeit wird beachtet. Welche Zeitzone Ihr Broker verwendet, erfahren Sie bei ihm. Eine Probe: Vergleichen Sie die Zeit der letzten Kerze in MetaTrader 5 mit der aktuellen UTC-Zeit. Die Zeitzone gilt für alle CSV-Dateien des Vorgangs; Zeiten in JSON-Dateien sind UTC. Kennt pipwerk den Namen nicht, wird die Datei mit „Die Zeitzone ist unbekannt.“ abgelehnt. Das Feld bietet die Namen an, die Ihr Browser kennt. Zwei Sonderfälle beim Wechsel der Sommerzeit: Eine Ortszeit, die beim Zurückstellen der Uhr doppelt vorkommt, gilt als die frühere. Eine Ortszeit, die beim Vorstellen der Uhr fehlt, ist eine abgelehnte Zeile („Diese Ortszeit gibt es nicht (Umstellung auf Sommerzeit).“).

**So importieren Sie.**

1. Klicken Sie in der Leiste auf „Datei importieren …“. Der Dialog „Datei importieren“ öffnet sich.
2. Klicken Sie auf „Dateien wählen …“ und wählen Sie eine oder mehrere Dateien (Endung `.json` oder `.csv`). Sie können noch einmal wählen, um weitere Dateien hinzuzufügen. Die Dateien erscheinen in einer Liste, mit Namen, Format und Größe.
3. **Broker** (Pflicht): Geben Sie den Broker ein, zu dem alle Dateien gehören, oder wählen Sie einen Namen aus dem Datenbestand; ein neuer Name ist möglich. Nennen alle JSON-Dateien denselben Broker, ist er schon eingetragen; nennen sie verschiedene, ist das Feld leer. Der Broker gilt für alle Dateien, auch für JSON-Dateien, die einen anderen nennen.
4. **Zeitzone der CSV-Dateien** (Pflicht, nur sichtbar, wenn eine CSV-Datei in der Liste steht): siehe oben.
5. **Instrument und Daten je Datei:** Die Liste füllt sie vor. Bei JSON stehen sie im Inhalt der Datei; die Daten lassen sich dort nicht ändern, das Instrument schon. Bei CSV liest pipwerk replay sie aus dem Dateinamen. Erkannt werden `<Instrument>_<Daten>_<von>_<bis>` (der Name aus MetaTrader 5 und von Dateien, die für den Import gedacht sind, zum Beispiel `EURUSD_H1_202301020000_202312292300.csv`) und `<Instrument>,<Daten>` (auch mit `_` oder Leerzeichen statt Komma, zum Beispiel `EURUSD,H1.csv`). `<Daten>` ist eine Zeiteinheit (`M1` bis `MN1`) oder `TICKS`, groß oder klein geschrieben. Jede Angabe lässt sich ändern: Instrument als Text, Daten (bei CSV) als Auswahl. Erkennt pipwerk replay etwas nicht, ist die Datei markiert („Instrument oder Daten nicht erkannt. Ergänzen Sie die Angabe oder entfernen Sie die Datei.“). „Entfernen“ nimmt eine Datei aus der Liste.
6. Solange etwas fehlt, ist „Importieren“ gesperrt, und ein Satz unter der Liste nennt den nächsten Schritt. Sind alle Angaben da, klicken Sie **einmal** auf „Importieren“. pipwerk replay importiert dann alle Dateien der Liste nacheinander.

**Es gibt keine Grenze für die Zahl der Dateien und keine für ihre Gesamtgröße.** Begrenzt ist nur eine einzelne Datei: Voreingestellt sind höchstens 32 MiB und 500 000 Zeilen je Datei (`max_upload_bytes` und `max_rows` im Abschnitt `[marketdata]` der Startkonfiguration). Eine größere Datei wird abgelehnt, und die Meldung nennt die Grenze. Die übrigen Dateien werden trotzdem importiert.

**Stand und Abbrechen.** Während des Imports zeigt der Dialog, wie viele Dateien erledigt sind („3 von 12 Dateien erledigt.“), und neben jeder Datei ihren Stand:

| Stand | Bedeutung |
| --- | --- |
| wartet | Die Datei ist noch nicht an der Reihe. |
| wird importiert | Die Datei wird gerade geprüft und übernommen. |
| übernommen | Die Datei ist im Datenbestand. |
| abgelehnt | pipwerk replay hat die Datei nicht übernommen; der Grund steht bei der Datei. |
| nicht importiert | Die Datei wurde nicht begonnen, weil Sie abgebrochen haben oder der Import unterbrochen wurde. |

„Abbrechen“ beendet den Import nach der Datei, die gerade übernommen wird. Was schon übernommen ist, bleibt übernommen; die übrigen Dateien stehen als „nicht importiert“ in der Liste. Klicken Sie danach erneut auf „Importieren“, werden genau diese Dateien nachgeholt. Klicken Sie auf „Schließen“ oder drücken Sie die Escape-Taste, während der Import läuft, fragt der Dialog, ob der Import abgebrochen werden soll; „Weiter importieren“ lässt ihn laufen. Verlassen Sie die Ansicht, während der Import läuft, endet er ebenfalls nach der laufenden Datei. Ist das Netz oder der Hintergrunddienst nicht erreichbar, oder hat der Hintergrunddienst den Vorgang beendet, weil zu lange keine Datei kam, nennt eine Meldung den nächsten Schritt: Die Datei, bei der es scheiterte, steht als „abgelehnt“, die übrigen als „nicht importiert“.

**Ergebnis je Datei.** Die Liste zeigt für jede Datei, was geschehen ist, und darunter, wie viele Dateien importiert sind (und wie viele abgelehnt oder nicht importiert sind):

- Eine übernommene Datei zeigt: wie viele Zeilen übernommen wurden und wie viele davon vorhandene Zeilen desselben Zeitpunkts ersetzt haben, den Zeitraum der übernommenen Zeilen (UTC) und die Zahl der abgelehnten Zeilen mit je Zeile der Nummer und dem Grund. Bei einer CSV-Datei ist die Kopfzeile die Zeile 1. Bei einer JSON-Datei ist es die Stelle des Eintrags. Genannt werden höchstens die ersten 1000 abgelehnten Zeilen; gezählt werden alle. Eine Datei mit Kontraktdaten zeigt „Kontraktdaten übernommen.“
- Eine abgelehnte Datei zeigt „Abgelehnt:“ mit dem Grund und dem nächsten Schritt. Sie hindert die übrigen nicht: Alle anderen Dateien sind übernommen. Ändern Sie die abgelehnte Datei in der Liste (zum Beispiel Instrument, Daten, Zeitzone) oder korrigieren Sie die Datei, und klicken Sie erneut auf „Importieren“. Es werden nur die Dateien erneut gesendet, die noch nicht übernommen sind.

Die Tabelle hinter dem Dialog zeigt die neuen Reihen, sobald der Import endet; der neue Broker steht im Auswahlfeld „Broker für Testläufe“. „Schließen“ schließt den Dialog; die Liste ist dann leer.

Der Import prüft: Format, Zeitordnung (jede Zeit nach der vorigen, keine doppelte), Kurse größer als 0, bei Kerzen Hoch nicht unter Eröffnung, Tief und Schluss, Tief nicht über Eröffnung und Schluss. Eine fehlerhafte Zeile lehnt er ab; die übrigen übernimmt er. Zeilen mit demselben Zeitpunkt wie vorhandene Daten ersetzen diese. Ein erneuter Import derselben Datei ersetzt also alle ihre Zeilen und verändert sonst nichts. Wird eine ganze Datei abgelehnt, ändert sich ihretwegen nichts im Datenbestand.

**Meldungen zu einer abgelehnten Datei.**

| Meldung | Was Sie tun |
| --- | --- |
| „Die Datei ist größer als die Grenze von … je Datei.“ / „Die Datei hat mehr Zeilen als die Grenze von … Zeilen je Datei.“ | Teilen Sie die Datei, zum Beispiel nach Zeiträumen. Voreingestellt sind höchstens 32 MiB und 500 000 Zeilen je Datei. |
| „Der Text der Datei lässt sich nicht lesen.“ | Speichern Sie die Datei als UTF-8. |
| „Die Datei ist kein gültiges JSON.“ / „Der Aufbau der Datei entspricht nicht dem Format.“ | Prüfen Sie die Datei oder erzeugen Sie sie mit `pipwerk-fetch-mt5` neu. |
| „Die Kopfzeile der CSV-Datei passt nicht.“ | Exportieren Sie die Datei erneut aus MetaTrader 5; es müssen Datum, Uhrzeit, Open, High, Low und Close (Kerzen) beziehungsweise Bid und Ask (Ticks) vorkommen. |
| „Broker, Instrument oder Daten der Datei sind ungültig.“ | Prüfen Sie die Angaben zur Datei. Namen dürfen nicht leer sein, höchstens 128 Zeichen haben und nicht mit einem Leerzeichen beginnen oder enden. |
| „Die Zeitzone ist unbekannt.“ | Geben Sie einen Namen nach IANA an, zum Beispiel `Europe/Athens`. |
| „Der Zeitraum der Datei ist ungültig.“ / „Die Datei enthält keine Zeilen.“ | Prüfen Sie die Zeiten in der Datei und ob es die richtige Datei ist. |
| „Der Datenbestand konnte die Datei nicht aufnehmen.“ | Versuchen Sie es später noch einmal; bleibt der Fehler, prüfen Sie die Meldungen des Hintergrunddienstes. |

**Meldungen, wenn der Import unterbrochen wird.** Sie erscheinen unter der Liste mit „Der Import wurde unterbrochen.“; die Dateien bleiben stehen. Bereits übernommene Dateien bleiben übernommen, die übrigen können Sie mit „Importieren“ nachholen.

| Meldung | Was Sie tun |
| --- | --- |
| „Das Backend hat den Import-Vorgang beendet, weil zu lange keine Datei kam.“ | Klicken Sie erneut auf „Importieren“. |
| „Das Backend hat die Anfrage abgewiesen, weil sie von einer Webseite mit anderer Adresse kommt.“ | Öffnen Sie pipwerk replay unter seiner eigenen Adresse (der Adresse aus Abschnitt 2) und versuchen Sie es noch einmal. |
| „Das Backend hat die Anfrage abgewiesen, weil der Name der Adresse nicht erlaubt ist.“ | Öffnen Sie pipwerk replay unter `127.0.0.1` oder `localhost`, oder starten Sie die Testumgebung mit `--host`. |
| „Das Backend ist gerade ausgelastet.“ | Das Backend übernimmt gerade andere Dateien, zum Beispiel für ein zweites Fenster. pipwerk replay sendet eine Datei dann selbst später noch einmal; erscheint die Meldung trotzdem, versuchen Sie es in einem Moment noch einmal. |
| „Das Backend ist nicht erreichbar.“ | Prüfen Sie, ob pipwerk replay läuft (Fußzeile), und versuchen Sie es noch einmal. |
| „Der Datenbestand konnte nicht gelesen oder geändert werden.“ | Ein technischer Fehler in der Datenbank. Versuchen Sie es noch einmal; bleibt der Fehler, prüfen Sie die Meldungen des Hintergrunddienstes. |

Die gewählten Dateien werden geprüft und nie ausgeführt.

### Daten löschen

Löschen ist nur über die Ansicht „Datenbestand“ möglich. Jedes Löschen fragt zuerst nach: pipwerk replay fragt den Hintergrunddienst, was gelöscht würde, und nennt es in einer Rückfrage mit Broker, Instrument, Daten, Zeitraum und der Zahl der Kerzen oder Ticks beziehungsweise der Reihen. Die Rückfrage sagt immer: „Das Löschen lässt sich nicht rückgängig machen.“ Gelöscht wird erst, wenn Sie „Endgültig löschen“ klicken. „Abbrechen“ lässt alles, wie es ist. Danach zeigt eine Zeile unter der Leiste, was gelöscht wurde, und Tabelle, Einzelheiten und Auswahl der Broker sind aktualisiert.

Es gibt vier Formen:

1. **Eine ganze Reihe löschen.** Klicken Sie auf die Zeile der Reihe, dann in den Einzelheiten auf „Löschen …“, wählen Sie „Die ganze Reihe“ und „Weiter“.
2. **Einen Zeitraum einer Reihe löschen.** Ebenso, aber wählen Sie „Nur einen Zeitraum der Reihe“ und geben Sie „Von“ und „Bis“ in UTC auf die Minute an. Die Kerzen oder Ticks ab „Von“ bis vor „Bis“ werden gelöscht. Beginn und Ende müssen zwischen den Jahren 1970 und 2100 liegen, der Beginn vor dem Ende. Der gelöschte Zeitraum zählt danach als nicht abgedeckt und ist eine Lücke in der Reihe, außer er liegt ganz in einer Zeit ohne Handel (Abschnitt 7). Bleiben in der Reihe keine Daten, verschwindet sie.
3. **Die Kontraktdaten eines Instruments löschen.** Klicken Sie in den Einzelheiten einer Zeile auf „Kontraktdaten löschen …“. Die Kontraktdaten eines Instruments bei einem Broker lassen sich nur ganz löschen. Die Schaltfläche gibt es nur, wenn es Kontraktdaten gibt.
4. **Alle Daten eines Brokers löschen.** Filtern Sie die Tabelle nach dem Broker (Feld „Broker“ über der Tabelle). Passt der Filter zu genau einem Broker, erscheint „Alle Daten dieses Brokers löschen …“ mit dem Namen des Brokers. Passt er zu mehreren, bittet ein Satz um den Namen eines einzelnen Brokers. Gelöscht werden alle Reihen und alle Kontraktdaten des Brokers.

**Ein Broker ergibt sich aus seinen Daten.** pipwerk replay führt keine Liste von Brokern. Ein Broker kommt vor, solange es Daten von ihm gibt, und verschwindet mit seinen letzten Daten, auch wenn Sie nur einzelne Reihen, Zeiträume oder Kontraktdaten gelöscht haben. Die Rückfrage sagt, wenn das die letzten Daten eines Brokers sind.

**Der „Broker für Testläufe“ beim Löschen.** War der Broker, dessen Daten verschwinden, als „Broker für Testläufe“ gewählt, ist danach keiner gewählt. Die Rückfrage sagt das vorher, das Auswahlfeld zeigt danach „– keiner gewählt –“, und ein Satz nennt den Broker, der dann gilt (der erste in alphabetischer Reihenfolge). Auch ein späterer Import desselben Brokers wählt ihn nicht wieder; wählen Sie ihn selbst.

**Während eines Imports lässt sich nichts löschen.** Solange ein Import läuft, lehnt pipwerk replay das Löschen mit der Meldung „Es besteht ein Import-Vorgang. Solange er besteht, lässt sich nichts löschen.“ ab und ändert nichts. Warten Sie, bis der Import beendet ist, oder brechen Sie ihn im Dialog „Datei importieren“ ab. Ein Import, zu dem eine Zeit lang (voreingestellt 5 Minuten) keine Datei kommt, endet von selbst.

Gespeicherte Backtests (kommen später) und Testkonten ändert das Löschen nicht. Ist die Reihe oder der Broker nicht mehr da (zum Beispiel weil Sie in einem zweiten Fenster gelöscht haben), nennt die Rückfrage den Grund und den nächsten Schritt.

## 9. Kursdaten mit pipwerk-fetch-mt5 holen

`pipwerk-fetch-mt5` ist ein kleines Programm für den Rechner, auf dem MetaTrader 5 läuft. Sie rufen es dort in der Eingabeaufforderung auf. Es liest Kerzen, Ticks und die Kontraktdaten eines Instruments aus MetaTrader 5 und schreibt sie als Dateien in einen Ordner. Diese Dateien importieren Sie in pipwerk replay (Abschnitt 8). Das Programm läuft nur, wenn Sie es aufrufen, und endet von selbst. Es öffnet keinen Port, hat keinen Server und braucht keine Verbindung zu pipwerk replay und keinen Schlüssel. Es handelt nie: Es liest nur und schreibt nur in den Ordner, den Sie angeben.

**Voraussetzungen.** Ein Windows-Rechner, auf dem MetaTrader 5 installiert ist, am Konto des Brokers angemeldet. Das Programm `uv` (siehe Schritt 1 unten). Einen Zugang zum Internet für die Installation (danach braucht das Programm kein Netz). Die Dateien des Ordners `components\pipwerk-fetch-mt5` aus dem Repository auf dem Rechner. Der Algo-Handel muss in MetaTrader 5 nicht eingeschaltet sein.

**Einmal einrichten.**

1. **uv installieren.** `uv` ist ein kostenloses Programm, das die Programmteile von `pipwerk-fetch-mt5` einrichtet und startet; Sie brauchen es nur für diese Einrichtung und den Aufruf. Öffnen Sie unter Windows eine Eingabeaufforderung oder PowerShell und führen Sie aus:

   ```
   powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
   ```

   Öffnen Sie danach ein neues Eingabeaufforderungsfenster und prüfen Sie die Installation mit `uv --version`. Erscheint eine Versionsnummer, ist `uv` bereit. Erscheint stattdessen eine Meldung, der Befehl sei unbekannt, haben Sie das Fenster nicht neu geöffnet oder die Installation ist fehlgeschlagen; wiederholen Sie dann den Befehl. Die Anleitung des Herstellers: https://docs.astral.sh/uv/getting-started/installation/.
2. **Programm auf den Rechner legen:** Kopieren Sie den Ordner `components\pipwerk-fetch-mt5` an einen beliebigen Ort, zum Beispiel `C:\pipwerk\pipwerk-fetch-mt5`.
3. **Installieren:** Führen Sie in diesem Ordner `scripts\install.cmd` aus (Doppelklick oder in der Eingabeaufforderung). Es lädt Python und die nötigen Pakete in den Unterordner `.venv`.
4. **Startkonfiguration anlegen:** Kopieren Sie die Datei `pipwerk-fetch-mt5.example.ini` aus dem Ordner als `pipwerk-fetch-mt5.ini` in den Ordner `%USERPROFILE%\pipwerk\etc` (legen Sie den Ordner an, falls er fehlt; `%USERPROFILE%` ist der Ordner des angemeldeten Benutzers, zum Beispiel `C:\Users\Name`). Tragen Sie in der Datei ein:
   - `server_time_zone` im Abschnitt `[broker]`: die Zeitzone der Serverzeit Ihres Brokers als IANA-Name, zum Beispiel `Europe/Athens` (siehe unten, „Zeitzone und Sommerzeit“). Ohne diesen Eintrag läuft das Programm nicht.
   - Nennt Ihr Broker ein Instrument anders, als Sie es nennen wollen, ergänzen Sie im Abschnitt `[symbols]` eine Zeile wie `EURUSD = EURUSD.r`. Groß- und Kleinschreibung zählen. Ohne Eintrag gilt die Bezeichnung selbst als Symbol des Brokers. Die Dateien nennen immer Ihre Bezeichnung, nie das Symbol des Brokers.

   Mehr ist nicht nötig. Anmeldedaten für MetaTrader 5 in der Datei sind freiwillig; das Programm hängt sich sonst an das laufende, angemeldete MetaTrader 5. Tragen Sie Anmeldedaten nur ein, wenn Sie sie brauchen, und schützen Sie die Datei dann so, dass nur Ihr Benutzer sie lesen kann.

**Aufrufen.**

1. Starten Sie MetaTrader 5 und melden Sie sich am Konto an.
2. Öffnen Sie eine Eingabeaufforderung und rufen Sie `scripts\fetch.cmd` im Ordner des Programms mit den Angaben auf, zum Beispiel für den Januar 2026, Kerzen H1 und D1 und Ticks, in den Ordner `daten`:

   ```
   scripts\fetch.cmd --from 2026-01-01 --to 2026-02-01 -u H1,D1 --ticks -o daten EURUSD GBPUSD
   ```

   | Angabe | Bedeutung |
   | --- | --- |
   | `EURUSD GBPUSD` | die Instrumente, eines oder mehrere |
   | `--from`, `--to` | der Zeitraum; `--from` gehört dazu, `--to` nicht mehr. Format `2026-01-05` oder `2026-01-05T10:30` (UTC, wenn Sie keine Zeitzone angeben wie `+02:00`). Pflicht. |
   | `-u H1,D1` | die Zeiteinheiten der Kerzen, durch Komma getrennt (`M1` bis `MN1`). Ohne Angabe gibt es keine Kerzen. |
   | `--ticks` | holt auch die Ticks |
   | `-o daten` | der Ordner für die Dateien; ohne Angabe der aktuelle Ordner. Er wird angelegt, falls er fehlt. |

   Die Kontraktdaten jedes Instruments schreibt das Programm immer mit, denn ohne sie startet kein Testlauf.
3. Das Programm schreibt eine Zeile je Datei und nennt Teile, die sich nicht holen ließen, mit dem Grund. Es endet mit der Zusammenfassung.
4. Bringen Sie die Dateien auf den Rechner von pipwerk replay und importieren Sie sie dort (Abschnitt 8): Wählen Sie im Dialog „Datei importieren“ alle Dateien auf einmal.

**Die Dateien.** Je Reihe und je Instrument eine Datei im JSON-Format des Imports. Der Name lautet `<Instrument>_<Daten>_<von>_<bis>.json`. `<Daten>` ist die Zeiteinheit (`M1`, `H1` …), `TICKS` oder `CONTRACT` (die Kontraktdaten). Beispiele: `EURUSD_H1_20260101_20260201.json`, `EURUSD_CONTRACT_20260101_20260201.json`. Als Broker steht in jeder Datei der Name des Handelsservers, an dem MetaTrader 5 angemeldet ist; im Dialog des Imports können Sie ihn überschreiben. Eine Datei gleichen Namens im Ordner wird ersetzt.

**Zeitzone und Sommerzeit.** MetaTrader 5 liefert die Zeit des Handelsservers. `pipwerk-fetch-mt5` rechnet sie mit der Zeitzone aus `server_time_zone` in UTC um, mit Sommerzeit. Stimmt die Zeitzone nicht, sind alle Zeiten um Stunden verschoben, ohne dass es auffällt, und Tageswechsel, Swap und Wochenende liegen im Testlauf falsch. Fragen Sie Ihren Broker nach der Zeitzone seines Servers und prüfen Sie sie: Die Zeit der letzten Kerze in MetaTrader 5 minus der Versatz der Zeitzone muss die aktuelle UTC-Zeit ergeben. Die Zeitzone ist ein Name wie `Europe/Athens`, kein Versatz wie „+2“. Rat zur Sommerzeit:

- Einmal im Jahr, wenn die Uhr zurückgestellt wird, kommt eine Stunde der Serverzeit zweimal vor. Das Programm liefert die erste dieser Stunden und lässt die zweite aus; die Ausgabe nennt die Zahl der ausgelassenen Zeilen. Bei Kerzen ist das zuverlässig. Bei **Ticks** erkennt das Programm die zweite Stunde nur, wenn der Markt in dieser Zeit dicht genug ist. In einem ruhigen Markt kann eine Zeile der zweiten Stunde mit einer UTC-Zeit in die Datei gelangen, die eine Stunde zu früh liegt, ohne dass es gemeldet wird. Das ist ein Mangel der Daten von MetaTrader 5, der sich nicht erkennen lässt.
- Deshalb: Bietet Ihr Broker einen Server ohne Sommerzeit an, verwenden Sie ihn und seine Zeitzone (zum Beispiel `Etc/GMT-2` für UTC+2 das ganze Jahr). Andernfalls **holen Sie Ticks nicht über den Wechsel der Sommerzeit hinweg**: Lassen Sie den Zeitraum mindestens zwei Stunden vor der doppelten Stunde enden oder mindestens zwei Stunden danach beginnen. Der Wechsel liegt bei den meisten Brokern auf dem Wochenende, an dem kein Handel ist.
- Beim Vorstellen der Uhr fehlt eine Stunde der Serverzeit. Zeilen dieser Zeit gibt es nicht; sie erscheinen nicht als Fehler.

**Grenzen eines Aufrufs.** Eine Datei hat höchstens 200 000 Zeilen, und das Programm liest höchstens 500 Abschnitte aus MetaTrader 5 je Datei (Kerzen: 10 000 je Abschnitt, Ticks: 6 Stunden je Abschnitt, also etwa 125 Tage Ticks). Für einen größeren Zeitraum meldet es „Zeitraum zu groß“. Holen Sie solche Zeiträume in mehreren Aufrufen. Die Grenzen lassen sich in der Startkonfiguration des Programms ändern; die Grenzen von pipwerk replay beim Import (Abschnitt 8) müssen dazu passen.

**Handelszeiten.** MetaTrader 5 liefert über das Programm keine Handelszeiten. Der Datenbestand wendet dann für Zeiten ohne Handel das Wochenende und die Tage ohne Handel an (Abschnitt 7).

**Meldungen und was Sie tun.** Ein Teil, der sich nicht holen lässt, steht mit Instrument, Art, Zeitraum und Grund auf der Fehlerausgabe; die übrigen Dateien werden geschrieben. Das Programm endet dann mit einem Fehlercode ungleich 0.

| Grund | Was Sie tun |
| --- | --- |
| „Symbol beim Broker unbekannt“ | Prüfen Sie die Schreibweise. Heißt das Instrument beim Broker anders (`EURUSD.r`), ordnen Sie es im Abschnitt `[symbols]` der Startkonfiguration zu. |
| „Daten beim Broker nicht vorhanden“ | Für den Zeitraum liefert MetaTrader 5 keine Daten (zu weit zurück, Feiertag, Wochenende, Verlauf nicht geladen). Wählen Sie einen anderen Zeitraum; laden Sie in MetaTrader 5 den Verlauf des Symbols (Diagramm öffnen und zurückblättern). |
| „Zeitraum zu groß …“ | Wählen Sie einen kürzeren Zeitraum und rufen Sie mehrmals auf. |
| „MetaTrader 5 nicht erreichbar“ | MetaTrader 5 läuft nicht, ist nicht angemeldet oder nicht mit dem Handelsserver verbunden, oder die Installation fehlt (`scripts\install.cmd` ausführen). Starten Sie MetaTrader 5 und melden Sie sich an. |
| „MetaTrader 5 hat die Abfrage mit einem Fehler beendet“ | Versuchen Sie es erneut; prüfen Sie MetaTrader 5. |
| „Der Name des Brokers ist nicht bestimmbar“ | Das Terminal nennt keinen Handelsserver. Prüfen Sie die Anmeldung. |
| „Der Broker liefert ungültige Angaben zum Instrument“ | Die Kontraktdaten des Brokers enthalten Werte, die das Format nicht zulässt. Das Programm schreibt dafür keine Datei. |
| „Die Datei konnte nicht geschrieben werden“ | Der Ordner ist nicht beschreibbar oder voll, oder die Datei ist gesperrt. Es bleibt keine halbe Datei. |

Fehler im Aufruf oder in der Startkonfiguration erscheinen als `pipwerk-fetch-mt5: <Text>` (englisch); das Programm holt dann nichts und schreibt nichts.

## 10. Bekannte Einschränkungen

- Es gibt noch keinen Testlauf: weder Einzelschritt-Test noch Backtest, und keine gespeicherten Backtests. Sie folgen in späteren Arbeitspaketen. Mit dem Testlauf gilt: Fehlen vor dem Start Daten, startet der Testlauf nicht und nennt die fehlenden Teile; er beschafft sie nicht.
- pipwerk replay beschafft keine Daten. Bis pipwerk relay den Austausch übernimmt, holen Sie Daten mit `pipwerk-fetch-mt5` und importieren die Dateien.
- Die Filter der Tabelle suchen einen Teil des Namens; ein Teil der Kennung der Daten wie `h1` trifft auch `h12`.
- Eine einzelne Datei ist beim Import begrenzt (voreingestellt 32 MiB und 500 000 Zeilen); sehr große Tick-Dateien aus MetaTrader 5 lassen sich deshalb noch nicht importieren. Teilen Sie sie, zum Beispiel nach Zeiträumen.
- Die Liste der Lücken in den Einzelheiten ist bei sehr vielen Lücken gekürzt. Bei sehr großen Reihen (viele Millionen Ticks) dauert das Lesen der Tabelle länger.
- Mit `--host` kann jeder im Netz pipwerk replay benutzen; es gibt keine Anmeldung (Abschnitt 2).
- pipwerk replay besitzt noch kein Installationspaket für Anwender.
- In der Testumgebung geht mit `testenv stop` alles verloren: Testkonten, Datenbestand, gewählter Broker und Sprache (Abschnitt 2).
- Weitere Sprachen als Deutsch und Englisch sind nicht verfügbar.
- Die Seite `/docs` des Hintergrunddienstes lädt ihre Darstellung aus dem Internet; ohne Internet bleibt sie leer, die Funktionen laufen trotzdem.
- `pipwerk-fetch-mt5` ist hier nur mit einer Nachbildung von MetaTrader 5 geprüft; die Prüfung gegen eine echte Installation und unter Windows macht der Auftraggeber in der Abnahme.

## 11. Glossar

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
| Datenbestand historischer Kursdaten | Der von pipwerk geführte Bestand an Kerzen, Ticks und Kontraktdaten, aus dem der Strategietester liest. |
| Kerze | Eröffnung, Hoch, Tief und Schluss eines Instruments in einem Zeitabschnitt, zum Beispiel einer Stunde. |
| Tick | Eine einzelne Kursänderung mit Geld- und Briefkurs. |
| Kontraktdaten | Die Angaben zu einem Instrument bei einem Broker, die ein Testlauf braucht: Tickgröße, Tickwert, Kontraktgröße, Swap, Margin und weitere. |
| Zeiteinheit | Die Länge einer Kerze, zum Beispiel M15 (15 Minuten), H1 (eine Stunde), D1 (ein Tag). |
| Reihe (Datenreihe) | Die Kerzen einer Zeiteinheit oder die Ticks eines Instruments bei einem Broker; eine Zeile der Tabelle des Datenbestands. |
| Broker | Der Anbieter der Kurse und des Handelskontos. Im Datenbestand die Bezeichnung der Stelle, von der die Daten stammen, bei MetaTrader 5 der Name des Handelsservers. |
| Broker für Testläufe | Der Broker, dessen Daten ein Testlauf verwendet. Sie wählen ihn in der Leiste des Datenbestands. |
| Handelsserver | Der Server des Brokers, an dem MetaTrader 5 angemeldet ist. Sein Name ist der Broker. |
| Import | Die Übernahme von Dateien im Format JSON oder CSV in den Datenbestand, beliebig viele in einem Vorgang. |
| pipwerk-fetch-mt5 | Das Programm, das Sie auf dem Rechner von MetaTrader 5 aufrufen und das Kerzen, Ticks und Kontraktdaten als Dateien für den Import schreibt. |
| pipwerk relay | Die spätere Komponente, die den Austausch von Kursdaten übernimmt. Bis dahin beschafft pipwerk replay nichts. |
| Lücke | Ein Zeitraum zwischen zwei importierten Zeiträumen einer Reihe, in dem gehandelt wurde und Daten fehlen. Wochenenden, Feiertage und andere Zeiten ohne Handel sind keine Lücken. |
| Tage ohne Handel | Die Liste von Tagen im Jahr, an denen nicht gehandelt wird (Startkonfiguration, vorbelegt mit 25. Dezember und 1. Januar). Sie zählen wie das Wochenende als Zeit ohne Handel. |
| Import-Vorgang | Der Import aller Dateien, die Sie mit einem Klick auf „Importieren“ starten. Er endet nach der letzten Datei, durch „Abbrechen“ oder von selbst, wenn zu lange keine Datei kommt. |
| UTC | Die Weltzeit, auf die pipwerk alle Zeiten umrechnet. |
| Zeitzone (IANA-Name) | Der Name einer Zeitzone mit ihren Regeln für die Sommerzeit, zum Beispiel `Europe/Athens`. |
| Serverzeit | Die Zeit des Handelsservers eines Brokers, in der MetaTrader 5 Kurse liefert. |
| Startkonfiguration | Die INI-Datei, die ein Programm beim Start liest, zum Beispiel bei pipwerk replay mit der Datenbankverbindung. |
| Eingabeaufforderung | Das Fenster unter Windows, in dem Sie Befehle eintippen. |
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
