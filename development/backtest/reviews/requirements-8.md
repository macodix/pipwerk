# Prüfbericht Dokumente des Auftraggebers, Durchlauf 8

- Vorhaben: `backtest`, Phase 1 (Rückkopplung aus der Abnahme von `wp02`, Versuch 2)
- Ergebnis: **bestanden**
- Geprüfter Commit: `cae3e0d61d1c528740987e2d04d34446fce80c8e` (`main`)
- Umfang: Prüfung beschränkt auf die geänderte Stelle laut Prüfauftrag (`git diff cae3e0d…~1 cae3e0d… -- docs/`)

## Geprüft

- `anforderungen-gesamtsystem.md`, req-system-025 (Absatz zum Löschen) und Änderungsnachweis vom 2026-10-23.
- Gegengelesen: req-system-025 (Aufzählung des Datenbestands), req-system-026, req-system-027, `anforderungen-strategietester.md` (Stellen zum Broker), Fachmodell (Stellen zum Broker), Glossar, `scope.md`.

## Blockierende Befunde

Keine.

- Kein Widerspruch zu den nicht geänderten Sätzen. Der Satz „Gelöscht wird erst nach einer Rückfrage“ gilt für den neuen Vorgang mit.
- Kein Widerspruch zu req-system-027: Dort nennen die Dateien den Broker mit dem Namen des Handelsservers. Das passt zu „ein Broker ergibt sich aus seinen Daten“.
- Das Glossar enthält keinen Eintrag „Broker“, der widerspricht. Das Fachmodell kennt keinen Broker als eigenes Objekt, das gelöscht werden müsste.
- Der Änderungsnachweis nennt die Festlegung des Auftraggebers (Chat, 2026-10-23, Abnahme `wp02`, Versuch 2).
- Die beiden Testfälle (`str-01`, `str-03`) sind nicht berührt.

## Hinweise

- H1 (Lücke, nicht blockierend): req-system-025 sagt nur bei den Angaben zum Instrument „je Broker“. Bei Kerzen und Ticks steht „je Instrument“ (Zeilen 108–109). Dass auch sie zu einem Broker gehören, ergibt sich nur aus „so wie der Broker sie liefert“ und aus req-system-027. Das genügt zur Umsetzung; Sache der Spezifikation. Zuordnung: Sache der Spezifikation.
- H2 (Lücke, nicht blockierend): Offen bleibt, was mit Testkonten oder Testläufen geschieht, die Daten eines gelöschten Brokers verwenden würden. Das hängt am bereits gekennzeichneten offenen Punkt „Welchen Broker ein Testlauf verwendet“ (`scope.md`, Beschaffung über pipwerk relay). Zuordnung: offener Punkt; keine Frage.
