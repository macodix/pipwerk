# Anforderungen an das Nachrichtensystem

## Dokumentstatus

- status: `draft`
- zweck: Anforderungen an das Nachrichtensystem (pipwerk relay): Weg einer Nachricht vom Absender zum Empfänger, Übertragungswege, Adressierung
- zuletzt aktualisiert: `2026-10-23`
- abgestimmt: Festlegungen des Auftraggebers im Chat am 23. Oktober 2026. Prüfung durch die QA steht aus.

## 1. Zweck und Abgrenzung

Dieses Dokument enthält die Anforderungen an das Nachrichtensystem, Produktname pipwerk relay (Projektziel, Abschnitt Module). Es überträgt Nachrichten zwischen eigenständig laufenden Komponenten (Gesamtsystem req-system-005), auch zwischen verschiedenen Rechnern.

Aufbau einer Nachricht (Nachrichten-ID, Absender, Adressat, Priorität, Nachrichtenart, Inhalt, Bezug-Nachrichten-ID), Objekte als Inhalt sowie Abfrage und unaufgeforderte Mitteilung sind in den Anforderungen an das Handelssystem festgelegt (req-grund-003 bis req-grund-006). Sie gelten für jede Nachricht über pipwerk relay.

Programmiersprache: Gesamtsystem req-system-007. Eine eigene Benutzeroberfläche ist nicht festgelegt (Gesamtsystem req-system-008).

## 2. Weg einer Nachricht

### req-relay-001 -- Relay je Rechner

Auf jedem Rechner, auf dem eine Komponente Nachrichten sendet oder empfängt, läuft ein Relay. Eine Komponente tauscht Nachrichten nur mit dem Relay ihres Rechners aus. Andere Rechner und deren Relays kennt sie nicht.

### req-relay-002 -- Übergabe und Zustellung auf dem Rechner

Eine Komponente übergibt eine Nachricht an das Relay ihres Rechners. Das Relay des Empfängers stellt sie dem Empfänger auf seinem Rechner zu. Auf welchem Weg Komponente und Relay Nachrichten austauschen, ist je Komponente konfigurierbar, zum Beispiel über Dateien in einem Verzeichnis.

### req-relay-003 -- Übertragungswege zwischen Relays

Zwischen Relays werden Nachrichten über austauschbare Übertragungswege übertragen, zum Beispiel über einen Matrix-Chat, über Dateien, die per SFTP ausgetauscht werden, oder über E-Mail.

Jedes Relay hat nur die Übertragungswege, die für es konfiguriert sind. Verschiedene Relays können verschiedene Übertragungswege haben. Weitere Übertragungswege lassen sich ergänzen, ohne Komponenten oder vorhandene Übertragungswege zu ändern.

### req-relay-004 -- Erste Übertragungswege

Die ersten Übertragungswege sind:

- Matrix über einen eigenen Matrix-Server des Betreibers. Der Anwender kann den Austausch der Nachrichten im Chat mitverfolgen.
- Dateien

### req-relay-005 -- Adresse

Eine Komponente kann mehrfach laufen, auch auf verschiedenen Rechnern. Der Name der Komponente genügt deshalb nicht als Adresse. Jede laufende Instanz einer Komponente hat eine eindeutige Adresse. Sie nennt den Namen der Instanz und das Relay, über das die Instanz erreichbar ist, zum Beispiel `pipwerk-trader.pipwerk-net-01.pipwerk-relay-name`. Welche Instanz für einen Zweck zuständig ist, zum Beispiel für ein Konto oder für die Beschaffung bei einem Broker, bestimmt der Absender aus seiner Konfiguration.

### req-relay-006 -- Adressbuch und Standard-Relay

Jedes Relay hat ein Adressbuch. Es enthält nur Relays: je Relay den Übertragungsweg, über den es erreichbar ist. Welches Relay für eine Nachricht zuständig ist, ergibt sich aus der Adresse (req-relay-005).

Steht das zuständige Relay nicht im Adressbuch, gibt das Relay die Nachricht an sein Standard-Relay weiter. Dieses verfährt nach seinem eigenen Adressbuch. Eine Nachricht kann so über mehrere Relays laufen.

### req-relay-008 -- Unzustellbare Nachricht

Kann eine Nachricht nicht zugestellt werden, zum Beispiel weil der Adressat unbekannt oder das zuständige Relay nicht erreichbar ist, schickt das Relay, bei dem die Zustellung scheitert, dem Absender eine Meldung mit dem Grund. Der Absender zeigt sie dem Anwender an.

### req-relay-009 -- Priorität

Nachrichten haben unterschiedliche Prioritäten (Handelssystem req-grund-004). Die Priorität kann Auswirkungen auf den Versand haben. Welche Prioritäten es gibt und wie sie wirken, ist offen.

### req-relay-010 -- Schutz gegen Fälschung und Veränderung

Das empfangende Relay erkennt eine gefälschte oder unterwegs veränderte Nachricht und stellt sie nicht zu. Vorschlag des Auftraggebers: Prüfsummen.

### req-relay-011 -- Verschlüsselung

Nachrichten werden im ersten Entwicklungsstand nicht verschlüsselt. Der Aufbau darf eine spätere Verschlüsselung nicht verhindern.

## 3. Erster Anwendungsfall

### req-relay-007 -- Beschaffung von Kursdaten

Der erste Anwendungsfall ist der Austausch zwischen pipwerk und der Beschaffung nach Gesamtsystem req-system-027:

1. Der Strategietester stellt vor dem Start eines Testlaufs fest, dass Kursdaten oder Angaben zum Instrument fehlen (Strategietester req-test-003), oder der Anwender stößt die Beschaffung von Hand an.
2. Er fordert die fehlenden Daten über pipwerk relay bei der Beschaffung für MetaTrader 5 an, die auf dem Rechner von MetaTrader 5 läuft.
3. Die Beschaffung liefert die Dateien im Dateiformat des Imports zurück. Der Strategietester importiert sie (req-system-026).

Damit endet die Übergangslösung nach req-system-027.

Nachrichten des Handelssystems, zum Beispiel eine Order an ein Konto, folgen mit dem Handelssystem.

## 4. Offene Punkte

- Hinnehmbare Laufzeiten einer Nachricht je Zweck. Offen, solange nicht feststeht, wo und wie das Handelssystem läuft.
- Prioritäten und ihre Wirkung auf den Versand (req-relay-009). Offen.
- Verschlüsselung (req-relay-011): Zeitpunkt und Verfahren. Offen.

## 5. Änderungsnachweis

| Datum | Änderung |
| --- | --- |
| 2026-10-23 | Erstanlage: Relay je Rechner, Übergabe und Zustellung, austauschbare Übertragungswege, erste Übertragungswege Matrix und Dateien, Adressbuch und Standard-Relay, eindeutige Adressierung, Beschaffung als erster Anwendungsfall. Festlegungen des Auftraggebers im Chat am 2026-10-23. |
| 2026-10-23 | Adresse je Instanz mit Name der Instanz und Relay, Adressbuch nur mit Relays (req-relay-005, req-relay-006), unzustellbare Nachricht (req-relay-008), Priorität (req-relay-009), Schutz gegen Fälschung (req-relay-010), keine Verschlüsselung im ersten Entwicklungsstand (req-relay-011). Festlegungen des Auftraggebers im Chat am 2026-10-23. |
| 2026-10-23 | req-relay-005: Die zuständige Instanz bestimmt der Absender aus seiner Konfiguration. Anforderungen an das Handelssystem req-grund-003 und req-grund-004 angeglichen. Entscheidung des Auftraggebers im Chat am 2026-10-23. |
