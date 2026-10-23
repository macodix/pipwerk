# Vorhaben relay

Vorhaben nach dem [Entwicklungsverfahren](../../docs/technical/entwicklungsverfahren.md): Nachrichtensystem pipwerk relay mit dem ersten Anwendungsfall Abruf von Kursdaten. Eine Anfrage an den Abruf für MetaTrader 5 und die Lieferung der Dateien laufen über pipwerk relay. Der Anschluss des Strategietesters gehört zum Vorhaben [backtest](../backtest/scope.md).

Nachweis des Vorhabens: Eine Anfrage mit Broker, Symbol des Instruments, Zeiteinheit und Zeitraum erreicht über pipwerk relay den Abruf auf dem Rechner von MetaTrader 5, und die Dateien kommen an die Adresse des Absenders zurück. Das gelingt einmal über Matrix und einmal über Dateien.

## Geltende Dokumente

Anforderungsdokumente:

- [Anforderungen an das Nachrichtensystem](../../docs/design/requirements/anforderungen-nachrichtensystem.md)
- [Anforderungen an das Gesamtsystem](../../docs/design/requirements/anforderungen-gesamtsystem.md), insbesondere req-system-005, req-system-026 und req-system-027
- [Anforderungen an das Handelssystem](../../docs/design/requirements/anforderungen-handelssystem.md), nur req-grund-003 bis req-grund-006 (Aufbau einer Nachricht)

## Abhängigkeit

Der Anwendungsfall Abruf baut auf dem Dateiformat des Imports und `pipwerk-fetch-mt5` aus dem Vorhaben [backtest](../backtest/scope.md) auf.

## Offene Punkte des Auftraggebers

Als offen gekennzeichnet in den [Anforderungen an das Nachrichtensystem](../../docs/design/requirements/anforderungen-nachrichtensystem.md#4-offene-punkte): Laufzeiten, Prioritäten und ihre Wirkung, Zeitpunkt und Verfahren der Verschlüsselung.

## Stand

2026-10-23: Phase 1. Vorhaben angelegt, Anforderungen an das Nachrichtensystem aus den Festlegungen des Auftraggebers im Chat am 23. Oktober 2026 erstellt. Offene Punkte werden mit dem Auftraggeber geklärt, danach Prüfung mit `check`.

2026-10-23: Offene Punkte Adresse, Adressbuch, unzustellbare Nachricht, Schutz gegen Fälschung und Verschlüsselung vom Auftraggeber im Chat entschieden.

2026-10-23: Zuständige Instanz bestimmt der Absender (req-relay-005), Anforderungen an das Handelssystem req-grund-003 und req-grund-004 angeglichen. Prüfung der Dokumente des Auftraggebers durch die QA mit `check` angestoßen.

2026-10-23: Prüfung [requirements-1.md](reviews/requirements-1.md) nicht bestanden (B1 bis B3). Entscheidungen des Auftraggebers im Chat: B2 Absender ist eine Adresse; B3 Adresse aus laufender Komponente, pipwerk-Netz und zuständigem Relay; B1 Nachweis ohne Strategietester, Broker und Symbol im Testlauf als offener Punkt in `backtest`. H5 Glossar „Instanz“: im Nachrichtensystem „laufende Komponente“. Nachprüfung mit `check`.

2026-10-23: Nachprüfung [requirements-2.md](reviews/requirements-2.md) bestanden. Präsentation [requirements-1.html](presentations/requirements-1.html) zur Bestätigung durch den Auftraggeber.

2026-10-23: Abstimmung der Präsentation: Auch zwischen Komponente und Relay gilt ein austauschbarer Übertragungsweg (req-relay-002, req-relay-003), Festlegung des Auftraggebers. Nachprüfung der geänderten Stellen mit `check`.

2026-10-23: Präsentation [requirements-1.html](presentations/requirements-1.html) bestätigt vom Auftraggeber im Chat am 23. Oktober 2026. Phase 1 abgeschlossen. Phase 2 mit `specify` angestoßen; sie beginnt mit der laufenden Nachprüfung von req-relay-002 und req-relay-003 (Durchlauf 3).

2026-10-23: Nachprüfung [requirements-3.md](reviews/requirements-3.md) bestanden. Spezifikation geprüft und bestanden in [specification-3.md](reviews/specification-3.md). Präsentation [specification-1.html](presentations/specification-1.html) zur Bestätigung durch den Auftraggeber.

2026-10-23: Abstimmung der Präsentation [specification-1.html](presentations/specification-1.html): Dateien als Anlage oder über einen eigenen Weg für Dateien (req-relay-012 neu), „Abruf“ statt „Beschaffung“ in Anforderungen, Glossar und `scope.md`, Festlegungen des Auftraggebers. Nachprüfung der geänderten Stellen mit `check`, danach Spezifikation anpassen.

2026-10-23: Empfangsbestätigung auf Wunsch des Absenders (req-relay-013 neu), Festlegung des Auftraggebers bei der Abstimmung von [specification-1.html](presentations/specification-1.html). Nachprüfung mit `check`, danach Spezifikation ergänzen.
