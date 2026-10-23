# Prüfbericht QA: Spezifikation, Vorhaben relay, Durchlauf 2 (Nachprüfung)

- Ergebnis: **nicht bestanden** (2 blockierende Befunde)
- Geprüfter Commit: `90ac2bd6937c6b8b66a23f3f2e2e3c780c00e59b` (`main`)
- Geprüft: `development/relay/specification.md` gegen die Änderungen seit `ec024e38a87127acd8752a5620c9b41904f5b003` (Diff), `scope.md`, Nachrichtensystem req-relay-001 bis -011, req-system-001/-009/-027, `development-test-security-rules.md` (Regeln 5, 6, 12; 8.2 Nr. 7; 8.3 Nr. 10).
- Nicht geprüft: nicht geänderte Stellen (außer bei Widerspruch); Verhalten von Matrix, Synapse und asyncssh.

## Vorherige Befunde

- B1 (Schleife und Wiederholung): **behoben.** 4.1 Schritt 3 prüft `hops` vor der Wiederholung (Schritt 4). Die Begründung trägt: Ein Relay trägt sich erst beim Weitergeben in `hops` ein, eine Wiederholung derselben Übergabe kommt ohne das eigene Relay an, eine im Kreis gelaufene Nachricht mit ihm. Der Test steht in Abschnitt 8.
- B2 (weitere Wege ohne Änderung): **im Kern behoben** durch Einstiegspunkte (3.4, Test in 8). Es bleibt N1.

## Blockierende Befunde

**N1. Eigene Angaben eines neuen Wegs passen nicht zu den strengen Prüfungen** (3.4, 5, 6.1, 4.5; req-relay-003)
- Sachverhalt: 3.4 sagt, die Angaben zu Ziel und Eingang reicht die Bibliothek „ungeprüft“ durch, ein neuer Weg komme „nur mit der Konfiguration“. Aber Abschnitt 5 lässt Pydantic „zusätzliche Felder ablehnen“ (gilt auch für `relay-config.schema.json`), und 6.1 sagt ausdrücklich, die Startkonfiguration `pipwerk-fetch-mt5.ini` weise unbekannte Abschnitte und Einträge ab. Ein neuer Weg (zum Beispiel E-Mail) braucht eigene Angaben im `[relay]`-Abschnitt der Komponente und im Eingang oder Adressbuch des Relays.
- Kritikpunkt: Wo stehen die wegeigenen Angaben, sodass weder das Schema der Betriebskonfiguration noch die Prüfung der Startkonfiguration der Komponente geändert werden müssen? Sonst bleibt req-relay-003 („ohne Komponenten oder vorhandene Übertragungswege zu ändern“) nicht erfüllt. Ausdrücklich sagen: durchgereichte Angaben sind von „zusätzliche Felder ablehnen“ und „unbekannte Einträge abweisen“ ausgenommen.
- Zuordnung: Sache der Spezifikation.

**N2. E3 erfüllt req-system-009 nicht nach dessen Wortlaut** (E3; req-system-001, req-system-009)
- Sachverhalt: E3 stellt jetzt fest, `pipwerk-relay` sei die Hauptkomponente Nachrichtensystem (req-system-001). req-system-009: „Jede Hauptkomponente stellt die für eine externe Nutzung vorgesehenen Funktionen über eine dokumentierte HTTP-Web-API bereit.“ E3 benennt Senden und Empfangen als diese Funktionen, bietet sie aber nur über die Übertragungswege an und lässt die HTTP-Web-API weg. Die Begründung, eine HTTP-Schnittstelle wäre nur ein weiterer Weg, ersetzt die Anforderung nicht; eine Ausnahme von req-system-009 steht in den Dokumenten des Auftraggebers nicht.
- Kritikpunkt: Mit welcher Festlegung des Auftraggebers oder welcher technischen Erfordernis (mit Begründung in der Spezifikation, „Keine Einschränkung ohne Erfordernis“) entfällt die HTTP-Web-API für diese Hauptkomponente im Vorhaben? Ohne beides: Wie erfüllt die Spezifikation req-system-009?
- Zuordnung: Sache der Spezifikation; fehlt eine Festlegung, Entscheidung des Auftraggebers über eine Ausnahme.

## Hinweise (nicht blockierend)

- H1 (4.1 Schritte 2, 3 gegen 4): Beide Prüfungen kommen vor der Prüfung auf Wiederholung. Wird dieselbe Übergabe einer Nachricht mit `loop` oder `sender_invalid` zweimal geliefert (E4: mindestens einmal), entsteht die Meldung zweimal, obwohl E4 sagt, eine Wiederholung werde nicht zweimal verarbeitet. Gewollt?
- H2 (3.4 Matrix, Quittieren): `next_batch` gehört zur Synchronisation über alle Räume, nicht „je Raum“; für den Verlauf eines Raums gibt es ein eigenes Zeichen. Begriff prüfen.
- H3 (3.4): Ein „zusätzlich in die Umgebung installiertes“ Paket widerspricht dem Ansatz mit uv und festgeschriebenen Versionen (E1, E3), wenn die Umgebung aus der Sperrdatei neu aufgebaut wird. Wie der Weg dort verankert wird, ist offen.
- H4 (4.1 Schritt 2 gegen 4.4): 4.4 beschreibt Meldungen für „Zustellung scheitert“ und nennt Gründe nach 4.1; `sender_invalid` steht nur in Schritt 2. Die Liste der Gründe ist so nicht an einer Stelle zu finden.
- H5 (8): „Schleife“ steht im Test des Relays doppelt.

## Stand der Prüfpunkte

1. B1 behoben. B2 behoben bis auf N1.
2. Geänderte Stellen: E2 (Regel 8.2 Nr. 7 stimmt; req-system-027 stimmt), E5 (Vertrauen in Relays, vereinbar mit req-relay-010 „empfangendes Relay“), 6.1 (Folgen für `pipwerk-fetch-mt5` klar), 6.2 (Symbol und Bezeichnung widerspruchsfrei), 7 (Regel 12, 8.3 Nr. 10 richtig zitiert), 8: ohne weitere Befunde. Neue Fehler: N1, N2, H1 bis H5.
3. Widerspruch zu `scope.md` und den genannten Anforderungen: nur N1 (req-relay-003) und N2 (req-system-009).

## Fragen an den Auftraggeber

Keine zu N1. Bei N2 nur, falls die Spezifikation keine technische Erfordernis nennen kann und die HTTP-Web-API entfallen soll.
