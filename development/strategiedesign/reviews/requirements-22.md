# Prüfbericht Dokumente des Auftraggebers, Durchlauf 22 (Nachprüfung zu Durchlauf 21)

- Vorhaben: `strategiedesign`, Phase 1 Anforderung, Nachprüfung, QA
- Geprüfter Stand: `main`, Commit `74bb1f5c738fbe1cae1ad0a4beca7019bf6d3a21`. Der Ordner `docs` auf dem heutigen `origin/main` (`dd0bf1a70c11b46c3e6aff7ac7ec8775a3935bc6`) ist mit diesem Commit gleich (`git diff --stat` ohne Ausgabe).
- Ergebnis: **bestanden** (0 blockierende Befunde)

## Blockierende Befunde

Keine.

## Prüfung der Punkte des Auftrags

**B1 – erledigt.** Die Suche nach „verwalt“ in `docs/design/strategies` und `docs/technical/glossar.md` zeigt in `str-01` und `str-03` keine Kurzform „Verwaltung“ mehr:
- `str-01` Zeile 86 und Parametertabelle Zeile 109 (Handelszeiteinheit): „Order- und Positionsverwaltung“.
- `str-03` Zeilen 38 und 45: „Order- und Positionsverwaltung“.
- Die Überschriften „Aktiven Trade verwalten“ (`str-01`, `str-05`, `str-09`) und „Position verwalten“ (`str-03`) sind Verben und nicht der Begriff. Die Festlegung E1 bezieht sich auf die Kurzform „Verwaltung“. Ich nehme sie nicht als Befund auf.
- Die übrigen Treffer sind Änderungsnachweise, also Verlauf. `strategieregister.md` Zeile 5 verwendet „verwaltet“ in anderem Sinn.

**B2 – erledigt.** Der Glossareintrag „Assistent“ (`glossar.md` Zeile 36) beginnt mit „Offen:“. Er nennt Ablauf und Namen nur noch als nicht bewährte erste Fassung, die nicht mehr festgelegt ist. Das entspricht E9 und req-ui-016. Im Fachmodell, in `anforderungen-gesamtsystem.md`, `str-01` und `str-03` kommt „Assistent“ nicht vor. In `anforderungen-strategiedesigner.md` steht er nur im Änderungsnachweis (Zeile 530, Verlauf). Zeile 535 hebt diese Festlegung auf.

**H1 – richtig.**
- `fachmodell.md` (Abschnitt zur Order): „… an den `OrderManager` übergeben, der sie weiterführt und überwacht“.
- `anforderungen-strategiedesigner.md` Abschnitt 1: „… deren Führung und Überwachung“.
- Beide Sätze verwenden „Verwaltung“ nicht mehr im Sinn des `OrderManager` und des Handelssystems. Sie stehen nicht im Widerspruch zu req-fach-049a. Dort gehört die Order- und Positionsverwaltung zum Ablauf der Strategie. Der `OrderManager` ist Teil des Handelssystems.

**H2 – richtig.** req-ui-016 sagt jetzt „hat sich nicht bewährt“ ohne Bezug auf die Abnahme. Der Satz steht im Absatz mit „Offen: ein geführter Aufbau …“ und passt dazu.

**Neue Fehler an den geänderten Stellen:** keine blockierenden. Hinweis H5 unten.

## Hinweise (keine Blocker)

- H5 (Sache der Spezifikation): „Führung“ (`anforderungen-strategiedesigner.md` Abschnitt 1) und „weiterführt“ (`fachmodell.md`) sind neue Wörter ohne Eintrag im Glossar. Neben „Order- und Positionsverwaltung“ ist offen, ob eine eigene Tätigkeit des `OrderManager` gemeint ist oder dasselbe in anderen Worten. Eine Lücke, die Betrieb, Umsetzung oder Sicherheit nicht beeinträchtigt.
- H6 (offener Punkt): `fachmodell.md` Zeile 218 spricht von einer „späteren Positionsverwaltung“ anderer fachlicher Komponenten. Das ist unverändert, wird in diesem Durchlauf nicht geprüft und bleibt vom Begriff der Order- und Positionsverwaltung abzugrenzen.
- H3 und H4 aus Durchlauf 21 sind laut Auftrag nicht Gegenstand.

## Fragen an den Auftraggeber

Keine.
