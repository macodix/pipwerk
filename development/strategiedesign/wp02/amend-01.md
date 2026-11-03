# Lücke 1 in Spezifikation und Plan – Mängel F4, F5, F6 der vierten Abnahme

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`
- gemeldet vom Entwicklungsleiter nach `fix` auf Grundlage des [Abnahmeberichts 4](acceptance/4.md) (auf `main`)
- betroffen: [Spezifikation](../specification.md) 5.1 (Zeile „Strategieparameter“, Fenstergrößen), 5.4 (Aufbau der Eigenschaftenansicht, Absatz „Parameter `Instrument` und Eigenschaft `Instrument` der Order“, Absatz „Belegung je Parameter und Eigenschaft“, Regeln zuordnen), 5.5; [Plan](../plan.md) Abnahmekriterium 7 von `wp02`

## Lücke

Der Abnahmebericht entscheidet drei Mängel, deren Lösung der geltenden Spezifikation widerspricht. Sie kann die Umsetzung nicht ohne die Spezifikation ändern.

### L1 – Begriffe der Eigenschaftenansicht (F4)

Der Abnahmebericht nennt: „Hauptablauf“ ist nirgends erklärt; „Objekte der Anwendung“, „Objekttyp“ (in „EMA, aus Objekttyp EMA“, Spezifikation 5.4 erster Absatz) und „Einstellungen des Objekts“ sind interne Begriffe ohne Bedeutung für den Anwender, in Oberfläche und Anwenderdokumentation. „Regeln der Strategie“: Der Auftraggeber hat entschieden, dass die Regeln an dieser Stelle bleiben; der Entwicklungsleiter darf eine andere Darstellung vorschlagen, sonst wird an Ort und Stelle erklärt, dass Regeln freiwillig sind und für jede Order der Strategie gelten.

Fehlt in der Spezifikation:

1. Die Wörter in Deutsch und Englisch, mit denen die Oberfläche statt „Objekte der Anwendung“, „Objekttyp“ und „Einstellungen des Objekts“ spricht, wie die Spezifikation es für „Belegung“ und „Bindungsart“ in 5.4 festlegt (Mangel E11 der dritten Abnahme). Die Wörter gehören in Händlersprache und zum Glossar.
2. Eine Erklärung von „Hauptablauf“ und die Stellen, an denen sie steht (Befund, „Gehört zu“).
3. Die Darstellung der Regeln der Strategie: Der Entwicklungsleiter schlägt vor, es bei der Darstellung zu belassen (Entscheidung des Auftraggebers) und den erklärenden Satz an Ort und Stelle zu setzen („Regeln sind freiwillig und gelten für jede Order der Strategie.“, Wortlaut offen); eine andere Darstellung schlägt er nicht vor.

### L2 – Feld „Instrument“ des Auslösers und der Order (F5)

5.4 legt fest: Vorbelegung „Instrument der Anwendung“ zeigt „das Instrument, auf dem die Strategie läuft“, darunter „anderes Instrument wählen“, nach der Wahl die Frage „Woher kommt der Wert?“ und die Schaltfläche „wieder das Instrument, auf dem die Strategie läuft“. Der Abnahmebericht verlangt dagegen:

- bei „fest eingeben“ statt „Instrument der Anwendung“ die Beschriftung „Voreingestelltes Instrument aus Strategie“,
- die Schaltfläche „wieder das Instrument, auf dem die Strategie läuft“ entfällt, wenn „nicht belegt“ dasselbe bewirkt, sonst heißt sie Zurücksetzen,
- die Beschriftung „Instrument wählen (optional)“ mit sichtbarer Vorbelegung statt der Frage „Woher kommt der Wert?“ wie bei einem Pflichtfeld,
- eine verständliche Erklärung zum Instrument.

Fehlt: die geänderte Festlegung in 5.4 mit den Texten, ob „nicht belegt“ und die Vorbelegung dasselbe bewirken (3.1: Parameter `Instrument`), und die Erklärung. Die Bedeutung von „nicht belegt“ bei diesem Parameter prüft der Softwarearchitekt in 3.1; ändert sich dort etwas an der Bibliothek, braucht es einen Auftrag dafür (Hinweis im Ergebnis).

### L3 – Ort der Strategieparameter (F6)

5.1 legt den dauerhaft sichtbaren Streifen unter der Kopfzeile fest, 5.4 das Anlegen an Ort und Stelle im Feld einer Belegung („Neuer Strategieparameter“), das Abnahmekriterium 7 des Plans verlangt beides. Der Abnahmebericht verlangt: Strategieparameter in der Eigenschaftenansicht der Strategie. Das Anlegen im Feld „Zeiteinheit“ des Auslösers (Eingabefeld, Hinweis und „Anlegen“ unter dem Feld) wirkt an dieser Stelle wie Durcheinander.

Fehlt:

1. Die Festlegung in 5.1: Entfällt der Streifen? (Mit ihm entfallen die Aussagen zum Streifen in den Fenstergrößen, bei geringer Höhe und in der Erreichbarkeit.)
2. Die Festlegung in 5.4: Wo und wie legt der Anwender einen Strategieparameter an, ändert ihn und entfernt ihn (Eigenschaftenansicht der Strategie), und ob das Anlegen im Feld einer Belegung bleibt, entfällt oder ersetzt wird (zum Beispiel Verweis auf die Strategie). Der Abnahmebericht entscheidet das nicht; die Wahl trifft der Softwarearchitekt, und er legt sie dem Projektleiter vor, wenn sie eine Entscheidung des Auftraggebers verlangt.
3. Abnahmekriterium 7 des Plans und alle weiteren Stellen des Plans, die den Streifen nennen (Umfang von `wp02`, Abnahmekriterium 7). Das ist eine Änderung eines Abnahmekriteriums; sie geht nach dem Verfahren über `present`.

## Hinweis: nicht blockierend

Die Mängel F1 bis F3, F7 bis F12 setzt der Entwicklungsleiter in den Aufträgen 20 bis 22 um, ohne die Spezifikation zu ändern. Zwei Abweichungen vom Wortlaut sind darunter, die der Softwarearchitekt bei der Ergänzung übernehmen kann:

- 5.5, letzter Absatz: Der Hinweis der leeren Strategie verweist auf die Auslöser statt auf die Gruppe „Ablaufsteuerung“ (F3). Die Bibliothek kennzeichnet Auslöser, ohne die Gruppen aus 5.2 zu ändern.
- 5.2, 5.3: Die Bibliothek, die Kastenformen und die Legende unterscheiden Schritte und Objekte; die Oberfläche begründet jede abgelehnte Verbindung (F8).
- 5.4: Frage „Was soll geprüft werden?“ statt „Art“ (F11), Übernahme des Vergleichs als erster Teil und Rückfrage beim Wechsel der Art einer Bedingung (F10), „Entfernen“ an jedem Teil (F9), Bereich „Verwendete Werte“ nur bei Elementen mit verwendbaren Werten (F7).

Der Entwicklungsleiter setzt nach der Ergänzung (`amended`) die Aufträge für L1 bis L3 und die Anwenderdokumentation dazu um, dann die Meldung `acceptance`.

## Ergebnis

(vom Softwarearchitekten auszufüllen)
