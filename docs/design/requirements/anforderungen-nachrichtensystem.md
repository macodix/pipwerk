# Anforderungen an das Nachrichtensystem

## Dokumentstatus

- status: `draft`
- zweck: Anforderungen an das Nachrichtensystem (pipwerk relay): Weg einer Nachricht vom Absender zum Empfänger, Übertragungswege, Adressierung
- zuletzt aktualisiert: `2026-10-23`
- abgestimmt: Festlegungen des Auftraggebers im Chat am 23. Oktober 2026. Prüfung durch die QA bestanden ([requirements-2.md](../../../development/relay/reviews/requirements-2.md)), [Präsentation](../../../development/relay/presentations/requirements-1.html) bestätigt vom Auftraggeber im Chat am 23. Oktober 2026. req-relay-012, req-relay-013 und „Abruf“ statt „Beschaffung“: Festlegung des Auftraggebers im Chat am 23. Oktober 2026, Prüfung durch die QA bestanden ([requirements-4.md](../../../development/relay/reviews/requirements-4.md), [requirements-5.md](../../../development/relay/reviews/requirements-5.md)).

## 1. Zweck und Abgrenzung

Dieses Dokument enthält die Anforderungen an das Nachrichtensystem, Produktname pipwerk relay (Projektziel, Abschnitt Module). Es überträgt Nachrichten zwischen eigenständig laufenden Komponenten (Gesamtsystem req-system-005), auch zwischen verschiedenen Rechnern.

Aufbau einer Nachricht (Nachrichten-ID, Absender, Adressat, Priorität, Nachrichtenart, Inhalt, Bezug-Nachrichten-ID), Objekte als Inhalt sowie Abfrage und unaufgeforderte Mitteilung sind in den Anforderungen an das Handelssystem festgelegt (req-grund-003 bis req-grund-006). Sie gelten für jede Nachricht über pipwerk relay.

Programmiersprache: Gesamtsystem req-system-007. Eine eigene Benutzeroberfläche ist nicht festgelegt (Gesamtsystem req-system-008).

## 2. Weg einer Nachricht

### req-relay-001 -- Relay je Rechner

Auf jedem Rechner, auf dem eine Komponente Nachrichten sendet oder empfängt, läuft ein Relay. Eine Komponente tauscht Nachrichten nur mit dem Relay ihres Rechners aus. Andere Rechner und deren Relays kennt sie nicht.

### req-relay-002 -- Übergabe und Zustellung auf dem Rechner

Eine Komponente übergibt eine Nachricht an das Relay ihres Rechners. Das Relay des Empfängers stellt sie dem Empfänger auf seinem Rechner zu. Auch dabei laufen die Nachrichten über einen Übertragungsweg nach req-relay-003, zum Beispiel über Dateien in einem Verzeichnis. Welcher Übertragungsweg das ist, ist je Komponente konfigurierbar.

### req-relay-003 -- Übertragungswege

Zwischen Komponente und Relay und zwischen Relays werden Nachrichten über austauschbare Übertragungswege übertragen, zum Beispiel über einen Matrix-Chat, über Dateien, die per SFTP ausgetauscht werden, oder über E-Mail.

Jedes Relay hat nur die Übertragungswege, die für es konfiguriert sind. Verschiedene Relays können verschiedene Übertragungswege haben. Weitere Übertragungswege lassen sich ergänzen, ohne Komponenten oder vorhandene Übertragungswege zu ändern.

### req-relay-004 -- Erste Übertragungswege

Die ersten Übertragungswege sind:

- Matrix über einen eigenen Matrix-Server des Betreibers. Der Anwender kann den Austausch der Nachrichten im Chat mitverfolgen.
- Dateien

### req-relay-005 -- Adresse

Eine Komponente kann mehrfach laufen, auch auf verschiedenen Rechnern. Der Name der Komponente genügt deshalb nicht als Adresse. Jede laufende Komponente hat eine eindeutige Adresse aus drei Teilen:

```text
<laufende Komponente>.<pipwerk-Netz>.<zuständiges Relay>
```

- laufende Komponente: Name, unter dem die Komponente bei ihrem Relay läuft
- pipwerk-Netz: Name des pipwerk-Netzes, zu dem das Relay gehört
- zuständiges Relay: Name des Relays, über das die Komponente erreichbar ist

Beispiel: `pipwerk-trader.pipwerk-net-01.pipwerk-relay-name`.

Absender und Adressat einer Nachricht sind solche Adressen (Handelssystem req-grund-004). Antworten und Meldungen nach req-relay-008 gehen an die Adresse des Absenders. Welche laufende Komponente für einen Zweck zuständig ist, zum Beispiel für ein Konto oder für den Abruf von Kursdaten bei einem Broker, bestimmt der Absender aus seiner Konfiguration.

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

### req-relay-012 -- Dateien

Zu einer Nachricht können Dateien gehören. pipwerk relay überträgt sie auf zwei Arten:

1. als Anlage der Nachricht über den Übertragungsweg der Nachricht,
2. über einen eigenen Weg für Dateien, zum Beispiel für sehr große Dateien. Die Nachricht nennt dann, wo die Datei liegt.

Beide Arten stehen zur Verfügung. Wann welche Art verwendet wird und über welche Wege Dateien übertragen werden, legt die Spezifikation fest. In beiden Fällen erkennt der Empfänger, ob eine Datei vollständig und unverändert angekommen ist (req-relay-010).

### req-relay-013 -- Empfangsbestätigung

Der Absender legt je Nachricht fest, ob er eine Empfangsbestätigung will. Dann schickt die empfangende laufende Komponente sie automatisch über pipwerk relay an den Absender, sobald sie die Nachricht gespeichert hat. Die Empfangsbestätigung nennt die Nachrichten-ID der bestätigten Nachricht. Bleibt sie innerhalb einer Frist aus, meldet der Absender das dem Anwender.

Bei einer Anfrage ist die Antwort die Bestätigung. Ob die Komponente eine Nachricht abholt, prüft das Relay nicht; es meldet nur, was es nicht zustellen kann (req-relay-008).

## 3. Erster Anwendungsfall

### req-relay-007 -- Abruf von Kursdaten

Der erste Anwendungsfall ist der Austausch mit dem Abruf für MetaTrader 5 nach Gesamtsystem req-system-027, der auf dem Rechner von MetaTrader 5 läuft:

1. Eine laufende Komponente schickt dem Abruf über pipwerk relay eine Anfrage. Sie nennt Broker, Symbol des Instruments beim Broker, Zeiteinheit und Zeitraum.
2. Der Abruf liefert die Dateien im Dateiformat des Imports (req-system-026) an die Adresse des Absenders zurück (req-relay-012).

Wann und mit welchen Angaben der Strategietester den Abruf anfragt (Strategietester req-test-003), legt das Vorhaben `backtest` fest. Bis dahin gilt die Übergangslösung nach req-system-027.

Nachrichten des Handelssystems, zum Beispiel eine Order an ein Konto, folgen mit dem Handelssystem.

## 4. Offene Punkte

- Hinnehmbare Laufzeiten einer Nachricht je Zweck. Offen, solange nicht feststeht, wo und wie das Handelssystem läuft.
- Prioritäten und ihre Wirkung auf den Versand (req-relay-009). Offen.
- Verschlüsselung (req-relay-011): Zeitpunkt und Verfahren. Offen.

## 5. Änderungsnachweis

| Datum | Änderung |
| --- | --- |
| 2026-10-23 | Erstanlage: Relay je Rechner, Übergabe und Zustellung, austauschbare Übertragungswege, erste Übertragungswege Matrix und Dateien, Adressbuch und Standard-Relay, eindeutige Adressierung, Beschaffung als erster Anwendungsfall. Festlegungen des Auftraggebers im Chat am 2026-10-23. |
| 2026-10-23 | Adresse je laufender Komponente mit Name und Relay, Adressbuch nur mit Relays (req-relay-005, req-relay-006), unzustellbare Nachricht (req-relay-008), Priorität (req-relay-009), Schutz gegen Fälschung (req-relay-010), keine Verschlüsselung im ersten Entwicklungsstand (req-relay-011). Festlegungen des Auftraggebers im Chat am 2026-10-23. |
| 2026-10-23 | req-relay-005: Die zuständige laufende Komponente bestimmt der Absender aus seiner Konfiguration. Anforderungen an das Handelssystem req-grund-003 und req-grund-004 angeglichen. Entscheidung des Auftraggebers im Chat am 2026-10-23. |
| 2026-10-23 | req-relay-005: Adresse aus laufender Komponente, pipwerk-Netz und zuständigem Relay; Absender ist ebenfalls eine Adresse; „laufende Komponente“ statt „Instanz“ (Glossar). Entscheidung des Auftraggebers im Chat am 2026-10-23 nach Prüfbericht `relay/reviews/requirements-1.md` (B2, B3). |
| 2026-10-23 | req-relay-007: Anwendungsfall Beschaffung ohne Anschluss des Strategietesters; dieser gehört zum Vorhaben `backtest`. Entscheidung des Auftraggebers im Chat am 2026-10-23 (`relay`, B1). |
| 2026-10-23 | req-relay-002, req-relay-003: Auch zwischen Komponente und Relay laufen Nachrichten über einen austauschbaren Übertragungsweg. Festlegung des Auftraggebers im Chat am 2026-10-23 (Abstimmung der Präsentation `relay/presentations/requirements-1.html`). |
| 2026-10-23 | req-relay-012 neu: Dateien als Anlage oder über einen eigenen Weg für Dateien. req-relay-005, req-relay-007: „Abruf“ statt „Beschaffung“. Entscheidung des Auftraggebers im Chat am 2026-10-23 (Abstimmung `relay/presentations/specification-1.html`). |
| 2026-10-23 | req-relay-013 neu: Empfangsbestätigung auf Wunsch des Absenders. Entscheidung des Auftraggebers im Chat am 2026-10-23 (Abstimmung `relay/presentations/specification-1.html`). |
