# Prüfauftrag Auftrag 02, Durchlauf 1

- Vorhaben: `strategiedesign`, Arbeitspaket `wp01`, ref `strategiedesign/wp01`
- zu prüfender Commit: `c663d9d5b7414db24b4678bc1a07b493f114b6cb` auf Zweig `strategiedesign/wp01-02`
- Auftrag: `strategiedesign/wp01:development/strategiedesign/wp01/orders/02.md`
- Prüfgrundlagen: der Auftrag mit den darin genannten Grundlagen, `development/strategiedesign/specification.md` (Abschnitte 4.1, 4.2, 7, 8, 9), `docs/technical/development-test-security-rules.md`, `docs/technical/pipwerk-studio.md` im geprüften Commit
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: erster Durchlauf vollständig, nur blockierende Befunde verhindern das Bestehen, alles andere als Hinweis.

## Angaben des Entwicklers

- Alle fünf Prüfungen des Backends bestanden (310 Tests). Nicht ausgeführt: `pip-audit` (kein `uvx` in seiner Umgebung), Prüfungen der Oberfläche und Browsertest (an der Oberfläche nichts geändert).
- `uv.lock` wurde von Hand um Alembic, Mako und MarkupSafe mit Hashes ergänzt, weil das vorhandene uv die Datei vollständig umschrieb. Prüfe, ob die Lockdatei vollständig, richtig und reproduzierbar ist.
- Veröffentlichungsdaten der neuen Abhängigkeiten in Abschnitt 7 der technischen Dokumentation „nicht ermittelt“.
- Eigene Entscheidungen ohne Vorgabe: Feldnamen `path`, `is_default`, `move`; Abbruch des Starts bei unbekanntem oder neuerem Schema; Zeile in `studio_settings` mit Sprache `de`, wenn das Objektverzeichnis zuerst gespeichert wird; gespeicherter nicht absoluter Pfad ergibt beim Lesen HTTP 503; Verknüpfung im Ziel zählt als Konflikt; `tests/test_name.py` erfasst in zwei Protokolltests nur den Logger `pipwerk_studio`.

## Tester Funktion

Führe das Prüfskript `components/pipwerk-studio/scripts/check` mit `--with-audit`, falls der Netzzugriff es erlaubt, sonst ohne, und prüfe Funktion, Grenzfälle, Tests, Code und technische Dokumentation gegen den Auftrag. Das Prüfskript nimmt in diesem Paket auch die Bibliothek `packages/domain-core` auf (Spezifikation Abschnitt 7, letzter Punkt). Die Bibliothek entsteht parallel in Auftrag 01 und ist in diesem Commit noch nicht vorhanden; eine Änderung am Prüfskript dafür machst du, wenn du Auftrag 01 prüfst. Änderungen am Prüfskript im Zweig `strategiedesign/wp01-functiontest`, aufgesetzt auf dem geprüften Commit; nenne dessen Commit im Bericht.

Ablage: `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp01/reports/02-functiontest-1.md`

## Tester Sicherheit

Prüfe nach BSI-Grundschutz, OWASP ASVS und API Security Top 10 und den Sicherheitsregeln, insbesondere Dateizugriff (Dateinamen nur aus UUID und Art, keine Überschreibung beim Verschieben, symbolische Verknüpfungen, Rechte des angelegten Verzeichnisses), Eingaben der neuen Endpunkte, Fehlermeldungen ohne Systemdetails, Migrationen (Regel 8.2 Nr. 10) und die neuen Abhängigkeiten mit `pip-audit`.

Ablage: `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp01/reports/02-securitytest-1.md`
