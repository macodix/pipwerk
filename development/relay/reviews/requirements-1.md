# Prüfbericht QA: Dokumente des Auftraggebers, Vorhaben relay, Durchlauf 1

- Ergebnis: **nicht bestanden** (3 blockierende Befunde)
- Geprüfter Commit: `bec2b0f664786433ae0f01bd6fb320d296c21db1` (`main`)
- Geprüft: Nachrichtensystem (vollständig), Handelssystem req-grund-003 bis -006, Strategietester req-test-001 und -003, Gesamtsystem req-system-005, -026, -027, Glossar.
- Nachweis (Testlauf beschafft fehlende Kursdaten über pipwerk relay, Matrix und Dateien): Er lässt sich bis auf B1 bis B3 abbilden. Die offenen Punkte Laufzeiten, Prioritäten und Verschlüsselung sind nicht erneut gemeldet, außer H8 und H9, wo der Nachweis sie braucht.

## Blockierende Befunde

**B1. Welche Beschaffung und welcher Broker gilt für einen Testlauf?** (req-test-001, req-test-003, req-system-025, req-system-027, req-relay-005, req-relay-007)
- Sachverhalt: Der Datenbestand führt Angaben zum Instrument „je Broker“, die Dateien nennen den Broker (Handelsserver). Ein Testlauf wählt nur Instrument und Testzeitraum. Das Testkonto ist an keinen Broker gebunden (req-test-005). Der Strategietester bestimmt die Adresse der Beschaffung aus seiner Konfiguration (req-relay-005), weiß aber nicht, bei welchem Broker er beschafft. Das Instrument ist eine brokerunabhängige Bezeichnung (ISO/ISIN, Fachmodell req-fach-053); die Zuordnung zum Symbol des Brokers ist dort als offen gekennzeichnet. Die Beschaffung braucht aber das Symbol des Brokers.
- Zuordnung: Entscheidung des Auftraggebers. Der Nachweis ist ohne Antwort nicht umsetzbar.
- Frage: Welchen Broker verwendet ein Testlauf (und damit welche Beschaffung)? Wie erfährt die Beschaffung, welches Symbol des Brokers zum gewählten Instrument gehört?

**B2. Ist der „Absender“ einer Nachricht eine Adresse?** (req-grund-004, req-relay-008, req-grund-006)
- Sachverhalt: Der Adressat ist ausdrücklich „Adresse der empfangenden Instanz“. Der Absender heißt nur „fachlicher Absender“. Die Antwort der Beschaffung (Bezug-Nachrichten-ID) und die Meldung bei Unzustellbarkeit (req-relay-008: „schickt dem Absender“) brauchen eine Adresse, an die sie gehen. Das Dokument legt sie nicht fest.
- Zuordnung: Entscheidung des Auftraggebers. Ohne Antwort kann die Beschaffung nicht antworten.
- Frage: Ist der Absender die Adresse (req-relay-005) der sendenden Instanz? Wenn nicht, woher kennt die Beschaffung die Antwortadresse?

**B3. Aufbau der Adresse mehrdeutig** (req-relay-005, req-relay-006)
- Sachverhalt: Der Text nennt zwei Bestandteile (Name der Instanz, Relay). Das Beispiel `pipwerk-trader.pipwerk-net-01.pipwerk-relay-name` hat drei. Was `pipwerk-net-01` bezeichnet, steht nirgends. Das Beispiel nennt außerdem einen Komponentennamen (`pipwerk-trader`) als Namen der Instanz, obwohl der Name der Komponente als Adresse nicht genügen soll. Das Relay wird aus der Adresse bestimmt (req-relay-006), die Bestandteile müssen deshalb eindeutig sein.
- Zuordnung: Entscheidung des Auftraggebers.
- Frage: Woraus besteht eine Adresse, und was bezeichnet jeder Bestandteil?

## Hinweise (nicht blockierend)

- H1 (Spezifikation): Für die Beschaffung fehlen Nachrichtenarten und Inhalte von Anfrage, Lieferung und Fehlermeldung (req-relay-007, req-grund-004; req-grund-006 legt sie „bei fachlicher Definition“ fest). req-test-003 verlangt den Grund für nicht beschaffbare Daten. req-relay-008 deckt nur Fehler der Zustellung ab, nicht Fehler der Beschaffung selbst.
- H2 (Spezifikation): Die Lieferung besteht aus mehreren Dateien (req-system-026), bei Ticks aus sehr großen. Der Inhalt einer Nachricht ist nach req-grund-004 und -005 ein „fachliches Datum“ oder Objekt. Wie Dateien Inhalt werden und wie große Mengen über Matrix laufen, ist offen.
- H3 (Spezifikation): „Dateien“ als Übertragungsweg (req-relay-004) ist mehrdeutig. req-relay-003 nennt SFTP, req-relay-002 ein Verzeichnis. Unklar bleibt, ob der erste Weg SFTP, ein gemeinsames Verzeichnis oder beides meint. Ebenso fehlt, welche Zielangaben das Adressbuch je Relay braucht (Server, Raum, Verzeichnis), da es nur „den Übertragungsweg“ enthält (req-relay-006).
- H4 (Spezifikation): Die Beschaffung ist weder Hauptkomponente (req-system-001) noch als Teilnehmer am Nachrichtensystem beschrieben. req-system-027 nennt sie in der Übergangslösung ein vom Anwender aufgerufenes Programm ohne Server. Ob sie unter pipwerk relay dauernd läuft, steht nicht da. Das ist ein Umsetzungsdetail.
- H5 (folgt aus einer Festlegung, Glossar): Das Glossar verlangt, fehlende Fachbegriffe zu ergänzen (Glossar, Regeln). Es fehlen Relay/pipwerk relay, Nachricht, Adresse, Adressbuch, Standard-Relay, Übertragungsweg, Nachrichtensystem und Betreiber (auch in req-system-011 benutzt). „Instanz“ ist im Glossar ein Objekt aus einer Vorlage, im Nachrichtensystem eine laufende Komponente: Begriffskollision. „Beschaffung“ im Glossar nennt pipwerk relay nicht.
- H6 (Spezifikation): req-relay-010 mischt Anforderung und Vorschlag („Prüfsummen“). Eine Prüfsumme allein erkennt keine absichtliche Fälschung. Unklar ist auch, ob der Absender bei verworfener Nachricht eine Meldung nach req-relay-008 erhält.
- H7 (Lücke): Das Anstoßen der Beschaffung von Hand (req-relay-007 Schritt 1, req-system-027) hat keine Entsprechung in den Anforderungen an den Strategietester (Ort, Auswahl von Instrument, Zeitraum, Zeiteinheit). Für den Nachweis nicht nötig.
- H8 (Spezifikation): Der Testlauf wartet auf die Lieferung. Wie lange, und wie das Warten endet, wenn nichts ankommt, ist offen (hängt am offenen Punkt Laufzeiten). Der Nachweis kommt aus Sicht des Anwenders nur zum Ergebnis „startet“ oder „Meldung mit Grund“ (req-test-003).
- H9 (Spezifikation): `Priorität` ist ein Pflichtfeld (req-grund-004), die Werte sind offen (req-relay-009). Die Nachrichten der Beschaffung brauchen einen Wert.
- H10 (Spezifikation): „Zur Verfügung steht“ (req-test-003, req-system-027) und „Damit endet die Übergangslösung“ (req-relay-007) legen den Zeitpunkt des Übergangs nicht fest, etwa auf die Abnahme dieses Vorhabens.
- H11 (Spezifikation): Unzustellbar-Meldung selbst unzustellbar, Schleifen über Standard-Relays (req-relay-006, -008): Verhalten nicht beschrieben.

## Widerspruchsfreiheit

- Adresse und zuständige Instanz (req-relay-005, req-grund-003, req-grund-004, req-fach-029): kein Widerspruch. Der Absender bestimmt die Instanz aus seiner Konfiguration.
- Anwendungsfall Beschaffung (req-relay-007, req-test-001, req-test-003, req-system-026, -027): kein Widerspruch außer B1 und H10.
- Gesamtsystem req-system-005: vereinbar. Technische Wahl (Python, req-system-007) wird nicht beanstandet.
