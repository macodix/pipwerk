# Testbericht Tester Funktion: Auftrag 01, Durchlauf 1

- ref: `relay/wp01`
- geprüfter Commit: `b72d09ce8e965fb0e47685f38a2319e652da12f4` (Zweig `relay/wp01-01`), ausgecheckt und mit `git rev-parse HEAD` kontrolliert
- Prüfskript: unverändert, kein eigener Commit (`packages/relay-core/scripts/check`)
- **Ergebnis: bestanden**

## Ausgeführt

- `packages/relay-core/scripts/check --with-audit`: Exitcode 0. uv sync --frozen, pytest (416 bestanden), ruff check, ruff format --check, mypy (23 Dateien) und pip-audit (keine bekannten Schwachstellen) bestanden.
- Code gelesen: `address`, `message`, `envelope`, `keys`, `way`, `loader`, `ways/files`. Dazu die technische Dokumentation `docs/technical/pipwerk-relay.md` (Abschnitte 1 bis 13), das Glossar und die Liste der Tests des Verzeichnis-Wegs.
- Eigene Stichproben mit der Bibliothek (Probeskript außerhalb des Repositorys, Ergebnis wie erwartet):
  - Absender mit Zeilenvorschub am Ende, zwei oder vier Teilen, leerem Teil, Umlaut oder Leerzeichen: abgelehnt.
  - Umschlag mit richtigem Schlüssel geöffnet. Falscher Schlüssel: `bad_mac`. Unbekannte Verbindung: `unknown_link`. Verändertes `body`: `bad_mac`.
  - Veränderte Anlage im Verzeichnis: `FaultyEnvelope` mit `attachment_hash`.
  - Quittieren mit `../x`, Großbuchstaben, Zeilenvorschub oder leerem Token: abgelehnt. Quittieren mit der echten ID leert das Verzeichnis.
  - Schlüsseldatei: Erzeugen mit `0o600`; mit `0o640` wird das Laden abgelehnt; ein Dateiname mit Pfad wird abgelehnt.
  - Nicht vorhandenes Verzeichnis: `WayUnavailableError` ohne Pfad im Text. Unbekannte Angabe eines Wegs: Fehler nennt den Eintrag, nicht den Wert.

## Abnahmekriterien

- Exitcode 0 des Prüfskripts: erfüllt.
- Tests laut Auftrag: erfüllt. Die Tests decken ab: Adresse, Nachricht, Umschlag mit veränderter Nachricht, veränderter Anlage, falschem Schlüssel und unbekannter Verbindung; Verzeichnis-Weg mit halbem Umschlag, Anlagen vor dem Umschlag, nicht erreichbarem Verzeichnis und Pfadzeichen; Test-Weg aus eigenem Paket über den Einstiegspunkt.
- Keine festen Pfade, Ports oder Namen im Code, im Prüfskript und in `pyproject.toml`: Suche ohne Treffer.
- Dokumentation: aktuell und widerspruchsfrei zum Code. Annahmen und Grenzen des Umbenennens auf einem Netzlaufwerk stehen in Abschnitt 9. Glossar: Anlage, Umschlag, Eingang (Nachrichtensystem) und Schlüssel der Verbindung sind ergänzt.
- Schemas unter `contracts/messages/v1/` mit Beispielen und README sind vorhanden; `test_schemas.py` vergleicht sie mit den Modellen.
- Arbeitsverzeichnis nach der Prüfung unverändert (`git status` leer).

## Befunde

Blockierende Befunde: keine.

## Hinweise (verhindern das Bestehen nicht)

1. Windows-Prüfung der Zugriffsrechte (`_windows_acl`): nicht ausgeführt. Das ist in der Dokumentation (Abschnitt 6, „Stand des Nachweises“) vermerkt und nach Hinweis des Entwicklers kein Befund des Codes. Ich habe sie nicht geprüft und bestätige sie nicht.
2. Prüfwert: Die Spezifikation 3.3 nennt „die Bytes von `from`, `to` und `body`“. Die Umsetzung trennt die Teile mit je einem Zeilenvorschub (`envelope.py` Zeile 98, Dokumentation Abschnitt 5, mit Prüfvektor). Festgelegt und dokumentiert, wie im Prüfauftrag vermerkt. Spätere Gegenstellen (Relay, andere Sprachen) müssen sich daran halten.
3. `FilesWay.read` ordnet nach Änderungszeit und liest nur die ersten `limit` Umschläge. Bleiben mindestens `limit` fehlerhafte, noch nicht verworfene Umschläge liegen, können neuere warten. Das Verwerfen gehört laut Auftrag dem Anschluss und dem Relay; beim Relay (späterer Auftrag) beachten.
4. Bei einer Unterbrechung des Senders bleiben Anlagen ohne Umschlag und `*.part`-Dateien liegen. Das ist dokumentiert (Abschnitt 8 und 9); das Aufräumen gehört zum Relay.
5. Ein Probeskript von mir liegt außerhalb des Repositorys unter `/srv/aixlab/dev/pipwerk/work/relay/wp01/probe_ft1.py`. Ich konnte es nicht löschen, weil mir die Ausführung von `rm` verweigert wurde. Es gehört nicht zum Commit und kann entfernt werden.
