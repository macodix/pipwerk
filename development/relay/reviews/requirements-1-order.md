# Prüfauftrag Dokumente des Auftraggebers, Durchlauf 1

- Vorhaben: `relay`
- Phase: 1 Anforderung, Prüfung der Dokumente des Auftraggebers vor der Präsentation
- Rolle: QA
- zu prüfender Stand: `main`, Commit `bec2b0f664786433ae0f01bd6fb320d296c21db1`

## Gegenstand

Prüfe jedes Dokument laut `development/relay/scope.md`, Abschnitt „Geltende Dokumente“:

- `docs/design/requirements/anforderungen-nachrichtensystem.md`, vollständig. Das Dokument ist neu.
- `docs/design/requirements/anforderungen-handelssystem.md`, nur req-grund-003 bis req-grund-006 (Aufbau einer Nachricht)
- `docs/design/requirements/anforderungen-strategietester.md`, nur req-test-001 und req-test-003 (Beschaffung fehlender Kursdaten)
- `docs/design/requirements/anforderungen-gesamtsystem.md`, insbesondere req-system-005, req-system-026 und req-system-027, und die Widerspruchsfreiheit jedes geprüften Dokuments zum Anforderungsdokument des Gesamtsystems

Prüfe außerdem die geprüften Stellen untereinander auf Widersprüche, insbesondere Adresse und zuständige Instanz (req-relay-005, req-grund-003, req-grund-004) sowie den Anwendungsfall Beschaffung (req-relay-007, req-test-001, req-test-003).

Nachweis des Vorhabens ist laut `scope.md`: Ein Testlauf, für den Kursdaten fehlen, beschafft sie über pipwerk relay von der Beschaffung auf dem Rechner von MetaTrader 5, importiert sie und startet. Die Nachrichten laufen über beide ersten Übertragungswege, Matrix und Dateien. Prüfe, ob sich dieser Ablauf mit den beschriebenen Objekten und Arbeitsabläufen vollständig abbilden lässt, und nenne jede Stelle, bei der das nicht gelingt.

Suche Widersprüche, Lücken, mehrdeutige Begriffe, nicht gekennzeichnete offene Fragen und Umsetzungsdetails. Prüfe außerdem das Glossar `docs/technical/glossar.md` auf Widersprüche zu den geprüften Dokumenten.

Nicht Gegenstand:

- die übrigen Anforderungen der Anforderungen an das Handelssystem und an den Strategietester, außer sie widersprechen einer geprüften Stelle
- Spezifikation, Plan und Code des Vorhabens `backtest`; laut `scope.md` baut das Vorhaben nur darauf auf
- die technischen Dokumente unter `docs/technical/` außer dem Glossar
- die in `scope.md` unter „Offene Punkte des Auftraggebers“ genannten und im Dokument als offen gekennzeichneten Punkte (Laufzeiten, Prioritäten und ihre Wirkung, Zeitpunkt und Verfahren der Verschlüsselung). Sie werden nicht erneut als Befund gemeldet. Ein Befund ist es nur, wenn ein solcher Punkt doch für den Nachweis des Vorhabens nötig ist oder in den Dokumenten nicht als offen gekennzeichnet ist.

## Prüfgrundlagen

- Briefing QA, Phase 1, in `docs/technical/agentenrollen-und-briefings.md`
- Phase 1, „Umfang der Prüfungen“ und „Fragen an den Auftraggeber“ (einschließlich „Keine Einschränkung ohne Erfordernis“ und „Lücken“) in `docs/technical/entwicklungsverfahren.md`. Dies ist der erste Durchlauf: Melde alle Befunde auf einmal. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis, je Hinweis eine Zeile. Eine Lücke ist nur blockierend, wenn ohne sie Betrieb, Umsetzung oder Sicherheit der Software beeinträchtigt sind. Der Bericht umfasst höchstens etwa 60 Zeilen.
- `development/relay/scope.md`

Ordne jeden Befund nach „Fragen an den Auftraggeber“ zu: folgt aus einer Festlegung (mit Angabe der Festlegung), Sache der Spezifikation, offener Punkt oder Entscheidung des Auftraggebers. Fragen stellst du nur in der letzten Gruppe.

Nenne zu jedem Befund Fundstelle (Datei und Abschnitt oder Kennung), Sachverhalt, Zuordnung und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als Datei `requirements-1.md` in das Berichtsverzeichnis `work/relay/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
