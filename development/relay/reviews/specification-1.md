# Prüfbericht QA: Spezifikation, Vorhaben relay, Durchlauf 1

- Ergebnis: **nicht bestanden** (2 blockierende Befunde)
- Geprüfter Commit: `ec024e38a87127acd8752a5620c9b41904f5b003` (`main`)
- Geprüft: `development/relay/specification.md` (Erstfassung) gegen `scope.md`, Nachrichtensystem req-relay-001 bis -011, req-system-005/-026/-027, req-grund-003 bis -006, Hinweise aus `requirements-1/2/3.md`, `development-test-security-rules.md`, `development/backtest/specification.md` (E5, 5.4) und `docs/technical/pipwerk-fetch-mt5.md` auf `origin/backtest/wp02`.
- Nicht geprüft: Nachbildung des Matrix-Servers und tatsächliches Verhalten von Synapse/asyncssh (keine Testumgebung in Phase 2).

## Blockierende Befunde

**B1. Schleifenerkennung kann nie auslösen, die Nachricht geht ohne Meldung verloren** (4.1 Schritte 3 und 6, E4; req-relay-006, req-relay-008)
- Sachverhalt: Schritt 3 verwirft eine Nachricht, deren ID das Relay in der Frist (Voreinstellung 7 Tage) schon gesehen hat, und quittiert sie ohne Meldung. Schritt 6 erkennt eine Schleife daran, dass das eigene Relay schon in `hops` steht. Das ist nur der Fall, wenn die Nachricht dieses Relay schon durchlaufen hat, also ihre ID dort schon gesehen wurde. Schritt 3 greift dann immer zuerst. Der Grund `loop` entsteht so praktisch nie, und der Absender erfährt von der Schleife nichts. Der Test „Schleife“ in Abschnitt 8 ist so nicht erfüllbar.
- Kritikpunkt: Wie unterscheidet die Spezifikation eine Schleife (Meldung `loop` nach req-relay-008, H11) von einer Wiederholung nach E4 (stilles Verwerfen)?

**B2. Weitere Übertragungswege „ohne Komponenten zu ändern“ nicht gesichert** (E1, 3.4, 3.5; req-relay-003)
- Sachverhalt: req-relay-003: Weitere Wege lassen sich ergänzen, ohne Komponenten oder vorhandene Wege zu ändern. Nach E1 binden Komponenten `relay-core` als Pfadabhängigkeit mit festgeschriebener Version ein, und die Wege sind Teil dieser Bibliothek (3.4: „weitere Umsetzung der Schnittstelle“). Ein neuer Weg (zum Beispiel E-Mail) ändert die Bibliothek, und jede Komponente, die ihn nutzen soll, muss die Version in ihrem Lockfile erhöhen und neu ausgeliefert werden. Wie ein Weg ergänzt wird, ohne die Komponente zu ändern, steht nicht in der Spezifikation. Das gilt auch für das Relay selbst („vorhandene Wege“).
- Kritikpunkt: Ist das ein Widerspruch zu req-relay-003, oder meint die Spezifikation „ändern“ anders? Die Spezifikation muss das entscheiden und begründen (Abschnitt 3.4).

## Hinweise (nicht blockierend)

- H1 (6.1, 6.3 gegen `pipwerk-fetch-mt5.md` §5, §11, §12): Die Beschaffung hat laut Stand `backtest/wp02` einen strengen Satz Zusicherungen: kein Modul importiert `socket`, `http`, `asyncio`, `ssl`; kein Name wird aufgelöst; „verbindet sich mit nichts außer dem lokalen Terminal“; unbekannte Abschnitte der Datei werden abgewiesen. `serve`, `request` und `[relay]` ändern das. Die Spezifikation sagt nur „der bisherige Aufruf bleibt unverändert“ und nennt diese Änderungen und die neuen Abhängigkeiten nicht. Frage: Werden die Tests und Abschnitte dort geändert, und wer?
- H2 (6.3): `request` liest dieselbe `pipwerk-fetch-mt5.ini`. Dort ist `server_time_zone` Pflicht (`pipwerk-fetch-mt5.md` §5), obwohl `request` auf einem Rechner ohne MetaTrader 5 läuft. Frage: Muss der Eintrag dort stehen?
- H3 (6.2): „Das Symbol geht nie in einen Dateinamen“, aber ohne `instrument` gilt das Symbol als Bezeichnung und damit im Dateinamen. Ein Symbol des Brokers, das nicht den Regeln der Bezeichnung entspricht (zum Beispiel mit Leerzeichen), macht die Anfrage zu `request_invalid`. Frage: Gewollt?
- H4 (3.4 Matrix, 3.4 Allgemein): Wie ein Umschlag im Matrix-Raum „quittiert“ wird, steht nicht da (Ereignisse lassen sich vom Leser nicht entfernen). Betrifft E4 (Wiederanlauf ohne Wiederholung des Eingangs). Frage: Woran erkennt das Relay, was es gelesen hat?
- H5 (4.1 Schritt 2, 4.1 Schritt 1): Verworfene Nachricht einer Komponente mit falschem Absender: Meldung nach req-relay-008 oder nicht? Nur Fälschung ist ausdrücklich ohne Meldung geregelt.
- H6 (E5, 3.3): Der Prüfwert gilt je Verbindung, nicht von Absender zu Empfänger. Ein Relay in der Mitte kann eine Nachricht verändern. req-relay-010 verlangt das nur vom empfangenden Relay, die Spezifikation sagt aber nicht, dass dieses Vertrauen in die Zwischen-Relays gewollt ist. Frage nur zur Absicht.
- H7 (2 E2, 7): req-system-009 verlangt von jeder Hauptkomponente eine HTTP-Web-API, E3 schließt sie für das Relay aus. Die Spezifikation sagt nicht, ob `pipwerk-relay` eine Hauptkomponente ist. Ebenso fehlt die Einordnung zu Regel 6 (Installation) der Technikregeln. E2 beruft sich auf req-system-011, das die Web-APIs betrifft.
- H8 (8, E6, Regel 12 der Entwicklungsregeln): `matrix-synapse`, `httpx` und `asyncssh` sind neue Abhängigkeiten. Die Prüfung von Lizenz und Wartung ist nur für `asyncssh` dem Auftrag zugewiesen. Synapse steht unter einer Lizenz, die zu prüfen ist (meines Wissens AGPL, ungeprüft). Auch die einschlägigen BSI- und OWASP-Anforderungen nach Technikregeln 8.3 Nr. 10 nennt Abschnitt 7 nicht.
- H9 (4.5, 8, req-relay-007): Die Spezifikation nennt Fristen und Grenzwerte als „technische Voreinstellung“. Das verhindert die offenen Punkte (Laufzeiten, Prioritäten, Verschlüsselung) nicht. Kein Befund, nur Bestätigung für Prüfpunkt 1.

## Stand der Prüfpunkte

1. Anforderungen: req-relay-001 bis -011, req-system-005/-026/-027, req-grund-003 bis -006 sind umgesetzt, außer B1 und B2. Offene Punkte nicht verhindert (3.2 Priorität als Kennung, E5 Prüfwert außerhalb der Nachricht, 4.1 Nr. 7 Fristen einstellbar).
2. Nachweis: über Matrix und über Dateien abbildbar (Abschnitt 8, beide Durchgänge mit allen Strecken). Die Antwort geht an die Adresse des Anfrage-Programms.
3. Hinweise: `requirements-1.md` H1 bis H4, H6 bis H11, `requirements-2.md` N1 bis N3, `requirements-3.md` H1, H2 sind in Abschnitt 10 entschieden und an den genannten Stellen umgesetzt. Offene Folgefragen stehen in H4, H5 oben.
4. Einschränkungen: 3.1 (Zeichen der Adressen, Name `relay` gesperrt), E2, E3, 6.2 (sequentielle Bearbeitung) sind begründet. Keine Frage an den Auftraggeber.
5. Technikregeln und backtest: kein Widerspruch zu E5 und 5.4 der Spezifikation `backtest` (kein Server, kein Port). Offen sind H1, H2 und H3. Regeln 5, 6, 12 und Sicherheitsregeln 8.2 sind berücksichtigt, ausgenommen H8.

## Fragen an den Auftraggeber

Keine. Alle Befunde betreffen die Spezifikation.
