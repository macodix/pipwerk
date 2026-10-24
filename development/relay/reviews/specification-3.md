# Prüfbericht Spezifikation, Durchlauf 3 (Nachprüfung)

- Vorhaben: `relay`, Phase 2 Konzeption, Rolle QA
- Ergebnis: **bestanden**
- geprüfter Commit: `1ef0244f7253f5d2dfe02f6f4d35b13832cf080d` (`main`), Datei `development/relay/specification.md`
- vorheriger Bericht: `specification-2.md` (nicht bestanden)
- Umfang: nur die geänderten Stellen (Diff gegen `90ac2bd6937c6b8b66a23f3f2e2e3c780c00e59b`), nur Bezug zu den Dokumenten des Auftraggebers (`scope.md`), den Festlegungen und dem Umfang. Die Testumgebung war nicht nötig.

## Entschiedene Streitpunkte

- N1 (eigene Angaben eines Wegs): vom Softwarearchitekten nach „Rein technische Streitpunkte“ entschieden, Abschnitt 3.4. Als entschieden vermerkt.
- N2 (Web-API des Relays): vom Softwarearchitekten nach „Rein technische Streitpunkte“ entschieden, E2, E3, 5, 7, 8. Als entschieden vermerkt.

## Blockierende Befunde

Keine.

## Prüfung der beiden Fragen

1. req-relay-003 und req-system-009
   - req-relay-003 (Wege ergänzen, ohne Komponenten und vorhandene Wege zu ändern): erfüllt. Ein Weg meldet sich über einen Einstiegspunkt an (3.4). Seine eigenen Angaben stehen in einem durchgereichten Block, den das Schema und die Prüfung der Komponente nicht ablehnen (3.4, N1). Ein neuer Weg braucht damit kein geändertes Schema und keinen geänderten Code. Der Test in Abschnitt 8 prüft das.
   - req-system-009 (dokumentierte HTTP-Web-API der Hauptkomponente): erfüllt. Das Relay als Hauptkomponente bietet in E3 Übergeben, Abholen mit Quittung und Stand der Warteschlange unter `/api/v1/`. Die Beschreibung liegt unter `contracts/api/pipwerk-relay/v1/openapi.json` (Abschnitt 5). Abschnitt 8 hat einen Test dafür.
2. Widerspruch zu Dokumenten laut `scope.md`
   - req-system-011: kein Widerspruch. Die Erreichbarkeit ist konfigurierbar (Adresse und Port in der Startkonfiguration, ohne Angabe kein Port; E2, E3). Jede Anfrage ist authentifiziert (HMAC mit dem Schlüssel der Verbindung, Schutz gegen Wiederholung; E3, 7).
   - req-system-027: kein Widerspruch. Der Satz „keinen eigenen Server, kein Port“ gilt nur für die Übergangslösung vor pipwerk relay. Die Beschaffung selbst öffnet weiter keinen Port (E2).
   - req-system-005, req-system-026, req-grund-003 bis req-grund-006: von den geänderten Stellen nicht berührt. 4.1 Schritt 3 und 4, 4.4 und E4 ändern den Aufbau der Nachricht nicht.
   - Anforderungen an das Nachrichtensystem: kein Widerspruch zu req-relay-002 bis req-relay-011. 4.4 nennt die Gründe der Meldung nach req-relay-008. Die Meldung `sender_invalid` verstößt nicht gegen req-relay-010, weil 4.1 Schritt 1 gefälschte Nachrichten ohne Meldung verwirft.

## Hinweise

- H1: E3 und 7 sagen, die Web-API sei „bis zur Anmeldung nur im Netz des Betreibers erreichbar“. Es bleibt offen, ob das Relay das erzwingt, etwa durch eine Voreinstellung der Adresse, oder ob es Sache des Betreibers ist. Der Auftrag kann das klären (req-system-011, letzter Absatz).
- H2: Eine Web-API für externe Programme steht in E3 nur Komponenten offen, die als Verbindung mit Schlüssel angelegt sind. Das genügt hier für req-system-009. Ein weiterer Kreis von Nutzern folgt mit der Anmeldung nach req-system-011.
