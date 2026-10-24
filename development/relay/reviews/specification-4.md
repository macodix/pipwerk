# Prüfbericht Spezifikation relay, Durchlauf 4 (geänderte Stellen)

- Ergebnis: **bestanden**
- Geprüfter Commit: `1525ec1d543ccf0c8e40b410d67a7287aa40ade2` (gelesen mit `git show` und `git diff 535208ab… 1525ec1d…`)
- Umfang: nur die geänderten Stellen nach den vier Fragen des Prüfauftrags. Grundlage: `scope.md`, `anforderungen-nachrichtensystem.md` im selben Commit.

## Blockierende Befunde

Keine.

## Antworten auf die vier Fragen

1. **req-relay-012 umgesetzt: ja.**
   - Beide Arten stehen in 3.6: Anlage über den Übertragungsweg, oder Datei über einen Weg für Dateien mit `stored` im geschützten `body` (3.3).
   - Wann welche Art: Schwelle in Byte je Verbindung (3.6).
   - Über welche Wege: Matrix und Verzeichnisse als Übertragungswege; als Weg für Dateien zuerst `files` (Verzeichnis oder SFTP) und weitere über die Gruppe `pipwerk_relay.file_ways`.
   - Erkennen einer unvollständigen oder veränderten Datei (req-relay-010): Bei beiden Arten prüft jede empfangende Seite Größe und SHA-256 (3.2, 3.6, 4.1 Schritt 1). Beide stehen im durch `mac` geschützten Teil. Fehlende Datei, fremder Weg oder falsche Angaben führen zum Verwerfen. Geschrieben wird unter vorläufigem Namen und dann umbenannt. Die Tests dazu stehen in Abschnitt 8.
2. **Widerspruch zu req-relay-001 bis -012, req-system-027 oder `scope.md`: keiner gefunden.**
   - req-relay-003: Der Weg für Dateien ist wie die Übertragungswege eine Erweiterung über Einstiegspunkt, mit eigenen Angaben. Abschnitt 8 prüft das mit einem Test-Weg für Dateien.
   - req-relay-001: Eine Komponente nutzt nur den Weg für Dateien der Verbindung mit ihrem Relay.
   - req-relay-004: Die Umbenennung „Dateien“ in „Verzeichnisse“ ist in Abschnitt 1 und 3.4 mit Verweis erklärt.
   - req-system-027: Die Übergangslösung bleibt unberührt (Abschnitt 1, „Nicht Gegenstand“).
3. **„Beschaffung“ ersetzt und Abschnitt 6 ohne pipwerk replay: ja.**
   - `grep -i beschaff` findet im Commit nur noch die Anführung im Änderungsnachweis.
   - `grep replay` findet nur den Nachweis in Abschnitt 8 und den Änderungsnachweis. Abschnitt 6 enthält keine Aussage mehr zu pipwerk replay. Der frühere Abschnitt 6.4 ist weggefallen, sein Inhalt steht in Abschnitt 1 ohne Nennung von replay.
4. **Nachweis laut `scope.md` mit Abschnitt 8 führbar: ja.**
   - Durchgang 1 (Matrix) und Durchgang 2 (Verzeichnisse, in `scope.md` „Dateien“) entsprechen dem Nachweis.
   - Durchgang 3 zeigt zusätzlich beide Arten nach req-relay-012 in einer Lieferung.

## Hinweise (nicht blockierend)

- H1, 3.6 Absatz „Wann welche Art“: Offen ist, was gilt bei einem Weg für Dateien ohne Schwelle (Voreinstellung oder Pflichtangabe). Offen ist auch, welchen Grund eine Nachricht erhält, deren Anlage die Höchstgröße des Wegs für Dateien übersteigt (`too_large` ist nur für den Übertragungsweg genannt).
- H2, 3.6 „Wer prüft“ und 4.1 Schritt 1 und 4: Der Wiederholungsschritt 4 steht nach dem Prüfschritt 1. Eine Wiederholung eines schon verarbeiteten Umschlags, dessen Datei die empfangende Seite nach dem Quittieren bereits entfernt hat, wird mit „fehlende Datei“ wie eine Fälschung im Protokoll vermerkt. Es ist unklar, ob Schritt 4 vor der Dateiprüfung greift. Das Ergebnis (verwerfen) bleibt gleich.
- H3, 3.6 und 4.5: Der Platz auf dem Weg für Dateien wird nicht begrenzt. Dateien, deren Umschlag nie angenommen wird (verworfen, unzustellbar, Wiederholung mit neuem Zufallsteil im Ort), haben keine Aufräumregel. Auf einem gemeinsamen SFTP-Speicher kann das den Platz füllen.
- H4, 3.6 erster Absatz: req-relay-012 sagt „Die Nachricht nennt dann, wo die Datei liegt“. In der Spezifikation steht `stored` im Umschlag und wird je Verbindung neu gebildet, nicht in der Nachricht (Feldtabelle 3.2). Das ist stimmig, die Formulierung „Der Umschlag nennt“ deckt das ab. Nur ein Hinweis auf die Lesbarkeit.
- H5, Namen: Der Name `files` bezeichnet zwei Dinge, den Übertragungsweg „Verzeichnisse“ (3.4) und den Weg für Dateien (3.6). Die Gruppen der Einstiegspunkte unterscheiden sie. In der Konfiguration kann das verwechselt werden.
