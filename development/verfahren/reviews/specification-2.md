# Prüfbericht Spezifikation, Durchlauf 2 (Nachprüfung)

- Vorhaben: `verfahren`, Phase 2 Konzeption
- Ergebnis: **nicht bestanden** (2 neue blockierende Befunde, B1 bis B4 aus Durchlauf 1 sind erledigt)
- Geprüfter Commit: `7a2b232bb03dd81e763dcb8ef63a1125af8af3dd`
- Gegenstand: Änderungen an `development/verfahren/specification.md` seit `4a17211dbb8065ddf6c815f7702dd7b6b0536ecb`
- Geprüft gegen `scope.md` (Commit `229c8ba49cac9f80fad31fc762e2e8e9fd026f57`), `reviews/specification-1.md` und die Regeln „Umfang der Prüfungen“ und „Fragen an den Auftraggeber“.

## 1. Stand von B1 bis B4

- B1 erledigt. 4.4 Punkt 1 legt das Verbot fest, 4.4 Punkt 4 nennt die drei Bedingungen. Beides stimmt mit Festlegung 7 überein.
- B2 erledigt. 5.2 bis 5.4 tragen (a) bis (c), und der Verweis im Abschnitt 8 stimmt (5.2 und 5.6).
- B3 erledigt im Kern. 6.3 übernimmt den Maßstab „öffnen und bedienen lässt“. Siehe Hinweis H10.
- B4 nur zum Teil erledigt. Die Sternregel in 7.2 trennt „Projektleiter“ und „Auftraggeber“ nach dem Entfernen der Meldung. Sie trägt aber nicht in allen Fällen (N1).

## 2. Übernahme „Ablauf dieses Vorhabens“

Abschnitt 10 gibt die Festlegung richtig wieder: keine Präsentation der Spezifikation, kein Plan, keine Pakete, die QA prüft das Ergebnis, einmal Bestätigung am Ende. Die Verweise auf Abnahmebericht und umsetzendes Paket sind in E2, E3, 3.3.5, 4.1.5 und 4.1.6 und 7.1 auf „Umsetzung“ und „Präsentation des Ergebnisses“ umgestellt. Eine Stelle trägt die Festlegung nicht (N2).

## Blockierende Befunde (neu)

**N1. 7.2 Sternregel gegen 4.3 Punkt 1: Entfernen ohne Vorlage beim Auftraggeber.**
Fundstelle: 7.2 Fußnote \* (Zeile „Solange die Meldung noch im Eingang …“), 4.3 Punkt 1.
Sachverhalt: 7.2 schließt: Ist die Meldung entfernt und gibt es keine jüngere Meldung desselben `ref`, hat der Projektleiter sie dem Auftraggeber vorgelegt, und „bei wem“ ist „Auftraggeber“. Der Satz danach behauptet, jede selbst erledigte Meldung habe eine Antwortmeldung im selben Commit. 4.3 Punkt 1 lässt als Folgehandlung aber auch den „Eintrag in einem Dokument“ ohne Antwortmeldung zu. Bei den markierten Zeilen sind das zum Beispiel `review` ohne Befunde der Gruppe „Entscheidung des Auftraggebers“ oder eine `question` ohne Fragen an den Auftraggeber. Dann ist die Meldung entfernt und es gibt keine jüngere. Die Übersicht zeigt „Auftraggeber“ und „Wartet auf Sie: Präsentation bestätigen“, obwohl nichts auf den Auftraggeber wartet. Das ist der Fehler aus B4 in anderer Form. Dazu kommt: `failed` ist in der Tabelle nicht markiert. Ein erledigtes `failed` bliebe dort ohne jüngere Meldung dauerhaft „Projektleiter“.
Zuordnung: Sache der Spezifikation (Festlegung 6: „was auf den Auftraggeber wartet, ist hervorgehoben“).
Frage: Woran erkennt `generate.py` ohne Meldungstext, ob der Projektleiter eine entfernte Meldung dem Auftraggeber vorgelegt oder selbst erledigt hat, wenn keine Antwortmeldung folgt? Welche „bei wem“-Angabe gilt dann?

**N2. Die Präsentation des Ergebnisses hat in 7.2 keine Zeile.**
Fundstelle: Abschnitt 10, 7.2 (Tabelle und Aufzählung zu `document`), 7.4 Punkt 5 und 6.
Sachverhalt: Abschnitt 10 und `scope.md` verlangen eine Präsentation des Ergebnisses am Ende. 7.2 kennt `present` nur „zur Spezifikation“ und „zum Plan“ (Feld `document`). Für diese Vorhaben gibt es keinen Plan und keine Pakete, und die Spezifikation nennt keine Meldung und kein `document` für das Ergebnis. Deshalb bleibt offen: In welcher Phase und bei wem steht das Vorhaben dann? Was zeigt die Übersicht für die Phasen 4 bis 6 (Zähler „n von m Paketen“ in 7.4.5 bei m = 0, dritte Ebene in 7.4.6 ohne Pakete)? Wann wird die Phase „Umsetzung“ grün, wenn 7.2 sie „bis alle Pakete fertig sind“ laufen lässt und es keine gibt? Die Zeile „Ein Vorhaben ohne `plan.md`“ sagt dazu nur „folgen allein seinen eigenen Meldungen“. Die Übersicht ist der Kern dieser Spezifikation, und Abschnitt 10 verlangt dafür Unit-Tests „für ein Vorhaben ohne Plan“. Die Abnahmekriterien lassen sich ohne diese Angaben nicht bilden.
Zuordnung: folgt aus „Ablauf dieses Vorhabens“ und Festlegung 6.
Frage: Welche Meldung und welches Feld bildet die Präsentation des Ergebnisses ab, und wie stellt die Übersicht ein Vorhaben ohne Plan in den drei Ebenen dar?

## Hinweise

- H10. 6.3 „sobald der Entwicklungsleiter eine Testumgebung … bereitgestellt hat“ ist nicht dasselbe wie „öffnen und bedienen lässt“ (Festlegung 5). Bereitgestellt kann früher sein als bedienbar.
- H11. 4.1 Punkt 3 gegen Punkt 6: Die nächste Wiedervorlage wird „zu Beginn“ gesetzt, ihre Bedingung („nach seiner Bearbeitung … liegt eine Meldung“) gilt aber erst am Ende. Punkt 6 löst das durch Löschen am Ende. Der Text sollte das als einen Vorgang sagen.
- H12. 7.2: „seit“ bei Einträgen, die der Auftraggeber bearbeiten soll, ist nicht festgelegt. Gemeint sein könnte der Zeitpunkt der Meldung oder der des Entfernens.
- H13. E3 und Abschnitt 6.3 nennen nur noch „test/“ beziehungsweise „Paket“. Der Pfad der Testumgebung eines Vorhabens ohne Pakete (`test/<vorhaben>-<arbeitspaket>/` laut Entwicklungsverfahren, Phase 4) ist nicht gesagt.
- H14. 3.2 Punkt 5: Nach zwei Fortsetzungen „endet es mit Fehler“. Eine Zahl für die Abbrüche in der Meldung wie in Punkt 3 fehlt. Rein redaktionell.
- H1 (aus Durchlauf 1) bleibt als Restrisiko, in 4.1 Punkt 6 benannt.
