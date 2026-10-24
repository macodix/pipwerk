# Testbericht Tester Sicherheit: `relay/wp01`, Durchlauf 1

- Ergebnis: **nicht bestanden** (1 blockierender Befund, 5 Hinweise)
- Geprüfter Commit: `7da618ea7c87f6e21e3ac9836d18ec04d0674d79` (Zweig `relay/wp01`), im eigenen Arbeitsverzeichnis ausgecheckt und mit `git rev-parse HEAD` kontrolliert.
- Grundlagen: Spezifikation Abschnitt 7 und 8, Plan `wp01`, Technikregeln Abschnitt 8 (BSI CON.8/APP.7, OWASP ASVS, API Security Top 10), Aufträge 01 bis 06.

## Ausgeführte Prüfungen

- Prüfskripte mit `--with-audit` (`sync --frozen`, pytest, ruff check, ruff format --check, mypy, pip-audit), alle drei Exitcode 0, pip-audit „No known vulnerabilities found“: `packages/relay-core` (Protokoll `sec-check-core.log`), `components/pipwerk-relay` (367 Tests, `sec-check-relay.log`), `components/pipwerk-fetch-mt5` (`sec-check-fetch.log`). Protokolle liegen in `/srv/aixlab/dev/pipwerk/work/relay/wp01/`.
- Codeprüfung von `envelope.py`, `keys.py`, `message.py`, `contents.py`, `connector.py`, `connection.py`, `way.py`, `loader.py`, `ways/files.py`, `_windows_acl.py` (relay-core); `relay.py`, `attachments.py`, `store.py`, `startup.py`, `operating.py`, `runtime.py`, `cli.py`, `service.py` (Relay); `relay/serve.py`, `relay/request.py`, `relay/contents.py`, `relay/commands.py`, `files.py` (Abruf); `probe.py` nur die Schreibstellen.
- Suche nach gefährlichen Aufrufen (`shell=True`, `eval`, `exec`, `pickle`, `subprocess`, `socket`, `urllib`, `requests`, `verify=False`, `0.0.0.0`) in allen drei `src`-Verzeichnissen: keine Treffer. Keine `.conf`-, `.key`-, `.pem`- oder `.env`-Datei im Repository.
- Bestätigt (Fundstelle): Prüfwert HMAC-SHA256 über `from`, `to`, `body` mit konstantzeitigem Vergleich (`envelope.py:96-99, 183-185`); Schlüssel nur als Datei mit Rechteprüfung, ohne Links, nie in `repr` (`keys.py`); strenge Modelle mit `extra="forbid"` (`message.py`, `envelope.py`, `operating.py`, `relay/contents.py`); Dateinamen nur aus UUID und Nummer, Muster vollständig geprüft (`ways/files.py:54-58`, `attachments.py:23-26`); Anlagenname erlaubt weder Trenner noch führenden Punkt (`message.py:16`); Absenderprüfung der Komponente (`relay.py:319-322`); Wiederholung vor Schleife (`relay.py:260`); Annahme und „gesehen“ in einer Transaktion (`store.py:93-121`); Protokoll ohne Inhalt; Fehlermeldungen ohne Werte; kein Port, kein Netzmodul im Code.

## Blockierender Befund

**B1 – Anlagen eines nicht geprüften Umschlags werden vor dem Prüfwert vollständig in den Speicher gelesen und gehasht.**
- Fundstellen: `packages/relay-core/src/pipwerk_relaycore/ways/files.py:194-210` (`_read_one` liest jede im Umschlag genannte Anlage mit `file.read(declared.size + 1)` und ruft `verify_attachments`), `way.py:43-44` (Voreinstellung 256 MiB je Anlage), `message.py:23` (bis 256 Anlagen), `relay.py:202, 249` und `connector.py:368, 393` (der Prüfwert wird erst danach geprüft; `read` liefert bis zu 100 Umschläge auf einmal).
- Sachverhalt: Wer in das Eingangsverzeichnis schreiben kann, aber keinen Schlüssel hat (genau der Angreifer, gegen den E5 den Prüfwert einführt), kann einen Umschlag ohne gültigen Prüfwert ablegen, der 256 Anlagen von je bis 256 MiB nennt. Es genügen spärlich belegte Dateien (`st_size` gesetzt, kaum Plattenplatz). Das Relay beziehungsweise die Komponente liest und hasht je Umschlag bis zu 64 GiB, bei 100 Umschlägen je Lesevorgang ein Vielfaches. Die Grenze `max_attachment_storage_bytes` (`relay.py:267`) gilt erst nach dem Lesen und nur für das Relay.
- Verstärkung: Fehlt eine Anlage oder stimmt Größe oder SHA-256 nicht, bleibt der Umschlag während der Schonfrist (voreingestellt 300 s) liegen und wird in jeder Runde neu gelesen (`relay.py:241-245`, `connector.py:381-387`). `modified_at` stammt aus der Änderungszeit der Datei (`files.py:176`); setzt der Angreifer sie in die Zukunft, ist `now - modified_at` negativ, die Schonfrist läuft nie ab, und der Umschlag wird nie verworfen.
- Widerspruch zur Vorgabe: Spezifikation Abschnitt 7 („Jede eingehende Nachricht wird vor jeder Verarbeitung an Prüfwert, Verbindung, Größe und Schema geprüft“); Technikregeln 8.3 Nr. 5 und 9 (Ressourcenbegrenzung); OWASP API4:2023.
- Beleg: durch Lesen des Codes und der angegebenen Voreinstellungen. Ein Versuch mit spärlichen Dateien war in dieser Sitzung nicht möglich (Befehl zum Anlegen des Versuchsverzeichnisses wurde von der Umgebung abgelehnt), die Aussage ist deshalb nicht ausgeführt belegt.

## Hinweise (verhindern das Bestehen nicht)

- H1 `envelope.py`, `relay.py:259-260`, `connector.py:398`: Der Prüfwert enthält keinen Zeitpunkt. Ein Umschlag, den ein Schreibender mit Zugriff auf das Verzeichnis nach Ablauf der Frist „gesehen“ (7 Tage) erneut ablegt, wird als neue Nachricht angenommen. Entspricht E4, ist aber eine Grenze des Schutzes gegen Wiederholung; in der technischen Dokumentation nennen.
- H2 `connector.py:453-456`, `relay/serve.py:109-119`, `relay/request.py:266`: Der Anschluss beendet das Warten auf `reference_id` bei jeder Nachricht der Art `relay.undeliverable`, ohne den Absender zu prüfen; `serve` gibt den Text einer solchen Nachricht von jeder Komponente ungefiltert auf dem Terminal aus (`UndeliverableContent.text` erlaubt beliebige Zeichen, `contents.py:78`). Steuerzeichen können das Terminal des Betreibers beeinflussen. `request.py:100` prüft den Absender, `serve.py` nicht.
- H3 `probe.py:144`: `probe listen` verwendet den Namen einer Anlage als Dateiname. Die erlaubten Zeichen (`message.py:16`) schließen unter Windows reservierte Namen (`NUL`, `CON`, `COM1`) und Namen mit Punkt am Ende nicht aus.
- H4 `_windows_acl.py`, Schlüsselrechte unter Windows: nicht ausgeführt (Tester läuft unter Linux), auch der Entwickler hat sie nur dokumentiert nicht ausgeführt (`docs/technical/pipwerk-relay.md`, Abschnitt 28). Vor dem Einsatz unter Windows prüfen.
- H5 `ways/files.py:257`, `pipwerk-relay.ini`: Dateien im gemeinsamen Verzeichnis entstehen mit `0o666` abzüglich Umask, die Startkonfiguration (Datenbank-URL, kann ein Kennwort enthalten) wird nicht auf Rechte geprüft. Beides ist dokumentiert (Technik Abschnitt 11, Beispiel-INI); Empfehlung des Betreibers genügt.

## Nicht geprüft

- Durchgang 1 und Störungen in der Testumgebung (Aufgabe der QA und des Entwicklungsleiters); Windows (siehe H4); Wege SFTP, Matrix, `http` und Wege für Dateien (nicht Umfang von `wp01`).
