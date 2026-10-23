# Vorhaben relay

Vorhaben nach dem [Entwicklungsverfahren](../../docs/technical/entwicklungsverfahren.md): Nachrichtensystem pipwerk relay mit dem ersten Anwendungsfall Beschaffung von Kursdaten. Der Strategietester fordert fehlende Kursdaten über pipwerk relay bei der Beschaffung für MetaTrader 5 an und importiert die gelieferten Dateien.

Nachweis des Vorhabens: Ein Testlauf, für den Kursdaten fehlen, beschafft sie über pipwerk relay von der Beschaffung auf dem Rechner von MetaTrader 5, importiert sie und startet. Die Nachrichten laufen über beide ersten Übertragungswege, Matrix und Dateien.

## Geltende Dokumente

Anforderungsdokumente:

- [Anforderungen an das Nachrichtensystem](../../docs/design/requirements/anforderungen-nachrichtensystem.md)
- [Anforderungen an das Gesamtsystem](../../docs/design/requirements/anforderungen-gesamtsystem.md), insbesondere req-system-005, req-system-026 und req-system-027
- [Anforderungen an das Handelssystem](../../docs/design/requirements/anforderungen-handelssystem.md), nur req-grund-003 bis req-grund-006 (Aufbau einer Nachricht)
- [Anforderungen an den Strategietester](../../docs/design/requirements/anforderungen-strategietester.md), nur req-test-001 und req-test-003 (Beschaffung fehlender Kursdaten)

## Abhängigkeit

Der Anwendungsfall Beschaffung baut auf dem Datenbestand, dem Import und `pipwerk-fetch-mt5` aus dem Vorhaben [backtest](../backtest/scope.md) auf.

## Offene Punkte des Auftraggebers

Als offen gekennzeichnet in den [Anforderungen an das Nachrichtensystem](../../docs/design/requirements/anforderungen-nachrichtensystem.md#4-offene-punkte): Laufzeiten, Prioritäten und ihre Wirkung, Zeitpunkt und Verfahren der Verschlüsselung.

## Stand

2026-10-23: Phase 1. Vorhaben angelegt, Anforderungen an das Nachrichtensystem aus den Festlegungen des Auftraggebers im Chat am 23. Oktober 2026 erstellt. Offene Punkte werden mit dem Auftraggeber geklärt, danach Prüfung mit `check`.

2026-10-23: Offene Punkte Adresse, Adressbuch, unzustellbare Nachricht, Schutz gegen Fälschung und Verschlüsselung vom Auftraggeber im Chat entschieden.

2026-10-23: Zuständige Instanz bestimmt der Absender (req-relay-005), Anforderungen an das Handelssystem req-grund-003 und req-grund-004 angeglichen. Prüfung der Dokumente des Auftraggebers durch die QA mit `check` angestoßen.
