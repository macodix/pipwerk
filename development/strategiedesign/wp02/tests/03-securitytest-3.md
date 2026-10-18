# Testbericht Sicherheit – Auftrag 03, Durchlauf 3

- Bezug: `strategiedesign/wp02`
- Übergabedokument: `strategiedesign/wp02:development/strategiedesign/wp02/tests/03-3-order.md`
- geprüfter Commit: `f0345bb3370d9c9cba8fd8ca27e133ce5ddf50ab` (Zweig `strategiedesign/wp02-03`, Elterncommit `13f1b4ac7b7039ef3c404ac02d0e74cd6516d3ab`)
- Prüfgrundlagen: Auftrag `strategiedesign/wp02:development/strategiedesign/wp02/orders/03.md`, besonders „Nachtrag nach Durchlauf 2 der Tester“ (Punkte 10 bis 12); Prüfauftrag, Abschnitt „Tester Sicherheit“; vorherige Berichte `03-securitytest-1.md` (B1) und `03-securitytest-2.md` (H3, H4); `docs/technical/development-test-security-rules.md`; `docs/technical/pipwerk-studio.md` Abschnitte 2.8 und 5.2; BSI-Grundschutz (CON.8, APP.7); OWASP ASVS (Dateibehandlung, Fehlerbehandlung und Protokollierung) und OWASP API Security Top 10
- Durchlauf: dritter, Nachprüfung (geänderte Behandlung belegter Namen bei `PUT`, B1 aus Durchlauf 1, Hinweise H3 und H4 aus Durchlauf 2)

## Ergebnis: bestanden

Kein blockierender Befund. Die geänderte Behandlung belegter Namen bei `PUT` erfüllt die Prüfpunkte: nichts geschrieben, Verknüpfungen nie verfolgt, Verknüpfung und Ziel unverändert, keine Pfade in Antwort und Protokoll. B1 aus Durchlauf 1 bleibt erledigt. H3 aus Durchlauf 2 ist erledigt. H4 aus Durchlauf 2 ist nicht erledigt (Handlung außerhalb meiner Zuständigkeit, siehe unten). Zwei neue Hinweise (H5, H6), beide nicht blockierend.

## Prüfung der geänderten Behandlung belegter Namen bei `PUT`

### Code

- `components/pipwerk-studio/backend/src/pipwerk_studio/object_store.py:464-470`: `has_entry` ersetzt `is_link`. Die Funktion prüft mit `os.path.lexists`. Das folgt keiner Verknüpfung und meldet jeden Eintrag: Datei, Verzeichnis, Verknüpfung mit oder ohne Ziel, FIFO. Der Name entsteht über `object_file_name` (Zeile 142-144) nur aus geprüfter UUID in Kleinschreibung und fester Art. Die Prüfung läuft unter der Sperre der Ablage.
- `components/pipwerk-studio/backend/src/pipwerk_studio/object_service.py:376-390`: Unter der Sperre der Ablage gilt diese Reihenfolge:
  1. Eine nicht lesbare Datei der Art des Pfades ergibt `ObjectUnreadableError`.
  2. Liest sich der Name als „fehlt“, liegt dort aber ein Eintrag, ergibt das `ObjectNameTakenError`. „Fehlt“ heißt hier: keine gewöhnliche Datei, Prüfung mit `lstat` in `_read_file`, Zeile 185-186.
  3. Für jede der vier anderen Arten ergibt jeder Eintrag `ObjectKindConflictError`. Das gilt jetzt auch beim Ersetzen.
  4. Erst danach wird geschrieben.

  Lesen öffnet nur gewöhnliche Dateien, mit `O_NOFOLLOW` (Zeile 185-189). Ein FIFO wird daher nicht geöffnet, und die Anfrage kann daran nicht hängen bleiben.
- Zweite Sicherung, unverändert: `_write_file` (`object_store.py:223-224`) schreibt nicht, wenn unter dem Namen etwas anderes als eine gewöhnliche Datei liegt. `os.replace` ersetzt nur den Eintrag im Verzeichnis und folgt keiner Verknüpfung. Damit ist auch ein Eintrag abgedeckt, der zwischen Prüfung und Schreiben von außen entsteht. Die Sperre wirkt nur innerhalb des Prozesses.
- `web_api.py:481-484`: Beide Ausnahmen ergeben `409` mit festem Text (`OBJECT_KIND_CONFLICT_TEXT`, `OBJECT_NAME_TAKEN_TEXT`, Zeile 106-113). Dabei wird nichts protokolliert, und die Antwort nennt keinen Pfad.

### Eigene Probe

Aufbau: Backend-Anwendung mit Testclient. Ein eigener Handler am Wurzel-Logger nimmt ab `DEBUG` alles auf. Jeder Fall hat ein eigenes temporäres Verzeichnis mit Objektverzeichnis und einem Verzeichnis „außerhalb“ für die Ziele der Verknüpfungen. Der Prozess läuft ohne Rechte des Administrators.

Vorher und nachher wird für das Objektverzeichnis und das Verzeichnis „außerhalb“ ein Abbild ohne Verfolgen von Verknüpfungen verglichen. Das Abbild enthält: Art des Eintrags, Inhalt, Ziel nach `readlink`, Zeitpunkt der Änderung, Inode, Rechte und Inhalt von Verzeichnissen.

Ergebnis: 76 Fälle, 0 fehlgeschlagen. Alle temporären Verzeichnisse wurden entfernt (Ausgabe „removed 76 remaining []“).

| Fall | Fälle | Ergebnis |
|---|---|---|
| Anlegen, unter `<id>.rule.json` liegt: nicht lesbare Datei, Verknüpfung mit Ziel Datei (absolut und relativ), Verknüpfung ohne Ziel, Verknüpfung auf ein Verzeichnis, Verzeichnis, FIFO | 7 | `409`; nicht lesbare Datei mit dem Text zu nicht lesbaren Dateien, alle anderen mit `OBJECT_NAME_TAKEN_TEXT` |
| Anlegen, unter `<id>.<andere Art>.json` (strategy, indicator, trend, ruleset) liegt: nicht lesbare Datei, gültige Datei, die vier Arten von Verknüpfung oben, Verzeichnis, FIFO | 32 | `409` mit `OBJECT_KIND_CONFLICT_TEXT` |
| Ersetzen (gültige `<id>.rule.json` vorhanden), dieselben 32 Einträge unter den anderen Arten | 32 | `409` mit `OBJECT_KIND_CONFLICT_TEXT` |
| Anlegen und danach Ersetzen ohne fremden Eintrag | 1 | `201`, dann `200`; nur `<id>.rule.json`, Rechte `0600` |
| Kennung im Pfad in Großbuchstaben, Verknüpfung unter einer anderen Art | 1 | `409`, nichts verändert |
| Liste, Lesen und Löschen bei Verknüpfung unter `rule` und Verzeichnis unter `ruleset` | 1 | Liste leer, Lesen `404`, Löschen `404` (auch `rulesets`), nichts verändert |
| B1: `PUT` bei Verzeichnis mit Rechten 0500; `POST` bei Verzeichnis unterhalb einer Datei | 2 | siehe B1 |

Für die 71 Fälle mit `409` galt:

- Objektverzeichnis und Ziele sind nach dem Abbild unverändert, auch Zeitpunkt und Inode.
- Es blieb keine temporäre Datei `.tmp` zurück.
- Kein Eintrag im Protokoll ab Stufe `WARNING`. Kein `exc_info`, kein `Traceback`, kein Pfad im Protokoll.
- Die Antwort nennt keinen Pfad, keinen Dateinamen (`.json`) und keinen Ausnahmetext.

### Tests des Entwicklers

`tests/test_web_api_unreadable.py:226-330` deckt Folgendes ab. Unter einer anderen Art: nicht lesbare Datei, Verknüpfung mit und ohne Ziel und Verzeichnis, jeweils beim Anlegen und Ersetzen. Unter der Art des Pfades: Verknüpfung mit und ohne Ziel und Verzeichnis; nicht lesbare Datei; `201`/`200`. Jeder dieser Tests vergleicht ein Abbild vor und nach der Anfrage und den Inhalt des Ziels. Die Tests bestehen (eigener Lauf, siehe unten).

## Kontrolle der Befunde und Hinweise aus früheren Durchläufen

### B1 (Durchlauf 1, blockierend): Protokoll bei `500` mit Ausnahmetext und Pfad – bleibt erledigt

- Fundstelle: `web_api.py:460-470` (`_log_failure`) und `:502-507` (`_guarded`). Der Commit ändert in `web_api.py` nur feste Texte und Beschreibungen (Diff gelesen). `_log_failure` und die Fälle mit `500` sind unverändert.
- Eigene Probe:

  | Fall | Antwort | Eintrag im Protokoll |
  |---|---|---|
  | `PUT` bei Verzeichnis mit Rechten 0500 | `500`, fester Text | genau ein Eintrag: `An object file could not be written or deleted. (PermissionError, errno 13)` |
  | `POST` bei Verzeichnis unterhalb einer Datei | `500`, fester Text | genau ein Eintrag: `An object file could not be written or deleted. (NotADirectoryError, errno 20)` |

  In keinem der beiden Fälle steht im Protokoll ein Pfad, `[Errno`, der Text der ursprünglichen Ausnahme oder `Traceback`. `exc_info` ist bei keinem Eintrag gesetzt.
- Der Test `tests/test_web_api_errors.py` zum Protokoll bei `500` besteht (eigener Lauf).

### H3 (Durchlauf 2): Satz zum Verzeichnis in Abschnitt 2.8 – erledigt

`docs/technical/pipwerk-studio.md:236` verweist für `PUT` jetzt auf die Regel in Abschnitt 5.2. Der Satz zum Verzeichnis sagt nur noch: nicht aufgelistet, nicht gelesen, nicht gelöscht, nicht verändert. Ein Verzeichnis unter dem Namen ergibt jetzt `409`, nicht mehr `500` (Probe). Das stimmt mit Abschnitt 5.2 überein (Zeile 452-456) und mit den beiden Zeilen zu `409` in der Fehlertabelle (Zeile 471-472).

### H4 (Durchlauf 2): Verzeichnis des Prüfskripts nicht entfernt – nicht erledigt

- Fundstelle: Verzeichnis `work/strategiedesign/wp02/securitytest-probe/` im Entwicklungsverzeichnis. Es liegt außerhalb des Repositorys und außerhalb des Arbeitsverzeichnisses. Es enthält `probe.py` aus Durchlauf 2 und jetzt auch `probe3.py`, die Probe dieses Durchlaufs.
- Sachverhalt: Das Entfernen mit `rm -r` wurde in dieser Umgebung wieder nicht zugelassen. Die Dateien enthalten keine Zugangsdaten und keine Daten des Rechners. Alle temporären Fallverzeichnisse hat das Skript selbst entfernt.
- Benötigte Handlung (Softwarearchitekt oder Projektleiter): das Verzeichnis `work/strategiedesign/wp02/securitytest-probe/` löschen.

## Neue Hinweise (nicht blockierend)

### H5: Fester Text und Dokumentation nennen bei der Art des Pfades nur Verknüpfung und Verzeichnis

- Fundstelle:
  - `web_api.py:110-113` (`OBJECT_NAME_TAKEN_TEXT`);
  - `docs/technical/pipwerk-studio.md:453`: „ein anderer Eintrag, nämlich eine symbolische Verknüpfung (mit oder ohne Ziel) oder ein Verzeichnis“;
  - `docs/technical/pipwerk-studio.md:454`: „irgendein Eintrag, nämlich eine gewöhnliche Datei …, eine symbolische Verknüpfung … oder ein Verzeichnis“.
- Sachverhalt: Ein FIFO (oder ein anderer besonderer Eintrag) unter dem Namen ergibt nach dem Code ebenfalls `409`, und es wird nichts geschrieben (Probe, Fälle „fifo“). Das entspricht Punkt 10 („ein Eintrag, der keine lesbare gewöhnliche Datei dieser Art ist“). Der feste Text nennt dabei aber „A symbolic link or a directory“. Die Dokumentation zählt die Fälle abschließend auf („nämlich“), und dieser Fall fehlt darin. Aus Sicht der Sicherheit ist das Verhalten in Ordnung. Ungenau ist nur die Beschreibung.

### H6: Tests decken die Art `trend` unter einer anderen Art nicht ab

- Fundstelle: `tests/test_web_api_unreadable.py:261` (`other_kind` in `["indicator", "ruleset", "strategy"]`); die Arten stehen in `object_store.py:41`.
- Sachverhalt: Der Code prüft alle Arten aus `OBJECT_KINDS` (`object_service.py:385`). Die eigene Probe bestätigt `409` auch für `trend`. Kein Test prüft jedoch den Fall eines Eintrags unter `<id>.trend.json`. Auch ein FIFO kommt in den Tests nicht vor. Punkt 10 verlangt Tests je Zeile, nicht je Art. Deshalb ist das kein Verstoß gegen den Auftrag.

## Durchgeführte Prüfungen und Nachweise

1. **Arbeitsverzeichnis.** `test -e …/securitytest/.git`: vorhanden. Danach `git fetch origin` und `git checkout --detach f0345bb3370d9c9cba8fd8ca27e133ce5ddf50ab`. `git rev-parse HEAD` ergab `f0345bb3370d9c9cba8fd8ca27e133ce5ddf50ab`, vor und nach allen Läufen. Nach allen Läufen meldete `git status --short` keine Änderungen.
2. **Werkzeuge Backend, selbst ausgeführt:**
   - `uv sync --frozen`: „Audited 33 packages“.
   - `uv run --frozen pytest`: 726 bestanden.
   - `ruff check`: „All checks passed!“.
   - `ruff format --check`: „50 files already formatted“.
   - `mypy`: „Success: no issues found in 50 source files“.

   Die Bibliothek habe ich nicht ausgeführt, weil der Commit nichts unter `packages/` ändert (Ergebnis von `git diff --name-only`). Das Prüfskript liegt beim Tester Funktion (Prüfauftrag).
3. **Umfang der Änderung.** `git diff --name-only 13f1b4a f0345bb` ergibt diese sieben Dateien:
   - `object_service.py`, `object_store.py`, `web_api.py`;
   - `test_web_api_objects.py`, `test_web_api_unreadable.py`;
   - `openapi.json`;
   - `docs/technical/pipwerk-studio.md`.

   Abhängigkeiten (`pyproject.toml`, `uv.lock`, `package*.json`) und Begrenzungen sind unverändert. `openapi.json` ändert nur Beschreibungstexte. Der Abgleich mit der erzeugten Beschreibung besteht (`tests/test_contract.py` im Lauf oben).
4. **Feste Werte (Abnahmekriterien 4 und 5).** Ich habe die hinzugefügten Zeilen des Diffs durchsucht nach: `/srv`, `/home`, `/tmp`, `password`, `token`, `secret`, Namen von Benutzern und Rechnerumgebung, `localhost`, `127.0`. Es gab keinen Treffer. Im Code stehen keine Pfade, Ports, Rechnernamen oder Zugangsdaten.
5. **Geänderte Behandlung belegter Namen bei `PUT` und B1:** siehe oben.

## Aufräumen

- Das Prüfskript hat alle temporären Fallverzeichnisse im temporären Verzeichnis des Systems entfernt.
- Im Arbeitsverzeichnis sind keine Änderungen geblieben.
- Das Verzeichnis `work/strategiedesign/wp02/securitytest-probe/` mit `probe.py` und `probe3.py` ist nicht entfernt (H4).
