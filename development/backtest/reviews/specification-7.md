# Prüfbericht Spezifikation und Plan, Durchlauf 7

- Vorhaben: `backtest`, Anlass req-test-009 Einstellungsbereich
- Ergebnis: **bestanden**
- Geprüfter Stand: `main`, Commit `1aa59510bea6935cb18caeda971b2742f0537b90`
- Geprüft: Diff `26df5032…..1aa59510…` für `specification.md` und `plan.md` (Phase 2/3, Nachprüfung der geänderten Stellen)

## Blockierende Befunde

Keine.

## Prüfung 1: Spezifikation 5.7

- req-test-009 ist umgesetzt: Einstellungsbereich, Werte im Speicher der Komponente, Voreinstellungen für Import (Behalten, Ablageverzeichnis). Fundstelle: `specification.md` 5.7.
- Offener Punkt 2 (Aufbau und Gestaltung) ist nicht vorweggenommen. 5.7 nennt ihn offen. Es folgt vorläufig pipwerk Studio, bis der Auftraggeber klärt. Das ist eine Sache der Spezifikation und bindet den Auftraggeber nicht.
- req-system-016: Die Werte liegen in der Datenbank, nicht in der INI. Das Ablageverzeichnis stand zuvor in der Startkonfiguration. Alle Stellen sind angeglichen, in 5.6, 5.7, 8.3, 11 und im Änderungsnachweis steht nichts Altes mehr. Die Tage ohne Handel bleiben in der Startkonfiguration. Das ist unverändert und nicht Gegenstand.
- req-system-028: Dateien werden nur mit „behalten“ abgelegt. Die Pflege behaltener Dateien bleibt beim Anwender, ein Wechsel des Verzeichnisses verschiebt nichts. Die Vorbelegung ohne gespeicherten Wert ist „nein“, damit gilt das Entfernen als Regel weiter.
- 5.6, 8.3, 10, 11 und 12 sind widerspruchsfrei nachgezogen. Das Kästchen wird aus der Einstellung vorbelegt (5.6, 8.3). Tests für Standardwerte, Speichern, Ablehnung und Vorbelegung stehen in 10. Sicherheit: Der Pfad wird geprüft, der Dateiname bereinigt, und das Risiko einer Änderung über die Oberfläche ist als hinnehmbar begründet. Die Anwenderdokumentation (12) nennt die Einstellungen.
- Verzicht auf Importverzeichnis und Exportverzeichnis: ausreichend begründet. Das Dateiauswahlfeld von HTML hat kein Startverzeichnis, ein Importverzeichnis bliebe ohne Wirkung. Einen Export gibt es in diesem Vorhaben nicht. Beides kommt hinzu, sobald ein Arbeitsablauf es braucht (req-test-009, „Weitere Einstellungen kommen hinzu“). Das ist eine begründete technische Erfordernis, keine Einschränkung des Auftraggebers.
- Die Einarbeitung von H1 und H4 aus `specification-6.md` zeigt keine neuen Fehler: Zählung mit Trennzeichen 63 = 37 + 26 stimmt in sich, das Ersetzen gleichnamiger Dateien steht in 12.

## Prüfung 2: Plan

- `wp02`: Umfang (Zeile 96), umgesetzte Teile (5.7 in der Liste), Abdeckung (Tabelle „5.7 → wp02“) und Änderungsnachweis sind vollständig.
- Kriterium 12 (Vorbelegung aus der Einstellung) und Kriterium 13 (Einstellungen ändern, speichern, nächster Import, relativer Pfad abgelehnt) kann der Auftraggeber in der Testumgebung selbst ausführen. Sie nennen sichtbares Verhalten und keine Testdetails.

## Hinweise (nicht blockierend)

- H1: `specification.md` 8.2 (Kopfzeile mit Menü) nennt „Einstellungen“ nicht, 8.3 führt die Ansicht aber auf. Das Menü in 8.2 ergänzen.
- H2: Der Umfang von `wp02` im Plan (Zeile 99, `docs/user/pipwerk-replay.md`) nennt die Einstellungen nicht, Abschnitt 12 der Spezifikation fordert sie. Beim nächsten Anlass angleichen.
- H3: Kriterium 13 prüft das neue Verzeichnis nur dann selbst, wenn der Auftraggeber Zugriff auf den Rechner des Backends hat. Das gilt bereits für Kriterium 12.
