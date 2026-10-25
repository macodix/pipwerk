# Prüfbericht Spezifikation, Durchlauf 1

- Vorhaben: `verfahren`, Phase 2 Konzeption
- Ergebnis: **nicht bestanden** (4 blockierende Befunde)
- Geprüfter Commit: `4a17211dbb8065ddf6c815f7702dd7b6b0536ecb`
- Gegenstand: `development/verfahren/specification.md`, vollständig
- Geprüft gegen `scope.md`, `questions/verfahren-01.md`, `questions/verfahren-02.md`, `prototype/uebersicht-prototyp.html` und die Regeln „Umfang der Prüfungen“ und „Fragen an den Auftraggeber“.

## Antworten auf die fünf Prüffragen

1. Festlegungen 1, 2, 3 und 6 sind im Kern umgesetzt. Festlegung 4, 5 und 7 haben Lücken oder Abweichungen (B1, B2, B3).
2. Abschnitt 7.4 gibt die fünf bestätigten Punkte wieder. Die Farbregel der Phasen habe ich gegen den Entwurf geprüft („Umsetzung“ bleibt gelb, solange das Vorhaben in Phase 4 ist): 7.2 und 7.4 stimmen mit dem Entwurf überein.
3. 4.1 Punkt 6 nimmt den Befund auf. Schwächen: B4 und Hinweis H1.
4. Fragen 2 und 3 aus `verfahren-01.md` sind richtig eingearbeitet (7.2 letzter Absatz, 4.1).
5. Der Text hat einen inneren Widerspruch (B4) und lässt Pflichtregeln aus (B1, B2). Sonst lassen sich Arbeitspakete mit prüfbaren Abnahmekriterien bilden (Abschnitt 10).

## Blockierende Befunde

**B1. Festlegung 7: Kernregel fehlt.** Fundstelle: 4.4, Abschnitt 8 (Briefing Projektleiter „Trennung der Vorhaben nach 4.4“).
Sachverhalt: Festlegung 7 verlangt, dass der Chat nur sein eigenes Vorhaben bearbeitet und nichts für ein anderes startet, wiederholt oder repariert, auch nicht bei scheinbar stehengebliebener Arbeit. Das steht nirgends in der Spezifikation. 4.4 regelt nur Kollisionen und die Meldung an den Auftraggeber; 4.1.2 und 4.3.2 schützen nur fremde Meldungen. Die drei Bedingungen der Festlegung nennt 4.4.3 nicht, es verweist nur darauf.
Zuordnung: folgt aus Festlegung 7.
Frage: Wo legt die Spezifikation das Verbot fest, ein anderes Vorhaben zu bearbeiten, und woraus bilden Briefing und Paket die Abnahmekriterien dazu?

**B2. Festlegung 4: Grundregeln fehlen.** Fundstelle: Abschnitt 5.
Sachverhalt: Es fehlen (a) der Name eines neuen Vorhabens wird beim Anlegen vom Projektleiter mit dem Auftraggeber festgelegt (5.4 regelt nur bestehende Vorhaben), (b) der Softwarearchitekt benennt die Pakete im Plan, der Auftraggeber bestätigt die Namen mit der Präsentation des Plans (5.3 regelt nur `amend`), (c) die sechs Phasennamen als feste Namen. Sie kommen nur in Tabellen und Texten von Abschnitt 7 vor, nicht als Regel.
Zuordnung: folgt aus Festlegung 4.
Frage: Welche Stelle der Spezifikation trägt (a) bis (c), damit Briefings und Verfahrensdokumente (Abschnitt 8) sie übernehmen?

**B3. Festlegung 5: „umgesetzt“ weicht ab.** Fundstelle: 6.3, Abschnitt 9 (H19).
Sachverhalt: `scope.md` (Festlegung 5 und Stand): Eine Ansicht ist umgesetzt, sobald sie sich in der Testumgebung öffnen und bedienen lässt. 6.3 setzt den Zeitpunkt später: erst bei Übergabe zur Abnahme (`acceptance`) oder in `main`. Dazwischen (Umsetzung, Prüfung) wäre ein Oberflächenentwurf ohne das Ausnahmeverfahren möglich, obwohl die Ansicht schon bedienbar ist. Das ändert die Festlegung. Eine technische Erfordernis als Begründung steht nicht da.
Zuordnung: folgt aus Festlegung 5.
Frage: Warum weicht 6.3 vom Maßstab „öffnen und bedienen lässt“ ab?

**B4. Übersicht zeigt „bei wem“ falsch, 4.1 Punkt 6 trägt dadurch nicht.** Fundstelle: 7.2 Tabelle, 4.1.6 dritter Strich, 4.2.1, 7.3.
Sachverhalt: `present`, `question` und `acceptance` sind Meldungen an den Projektleiter (`entwicklungsverfahren.md`, Meldungen). 7.2 ordnet sie sofort dem Auftraggeber zu, mit der Marke „Wartet auf Sie“, auch solange der Projektleiter sie nicht bearbeitet hat. Bei einer verspäteten Wiedervorlage steht dort „Auftraggeber“ statt „Projektleiter“, im Widerspruch zu 4.1.6 („zeigt die Übersicht ‚Projektleiter‘“). Eine `question` geht außerdem nur dann an den Auftraggeber, wenn sie Fragen an ihn enthält (4.2.1); der Meldungstext ist für die Übersicht ausgeschlossen (7.3). Eine Frage nur an den Projektleiter würde dem Auftraggeber als wartend angezeigt.
Zuordnung: Sache der Spezifikation (Festlegung 6: „was auf den Auftraggeber wartet, ist hervorgehoben“).
Frage: Wie unterscheidet die Übersicht „liegt beim Projektleiter“ von „wartet auf den Auftraggeber“, ohne den Meldungstext zu lesen?

## Hinweise

- H1. 4.1.6: Die zweite Wiedervorlage nach 40 Minuten kann dieselbe unbekannte Ursache treffen; die Spezifikation räumt das ein und legt ein Abnahmekriterium fest. Restrisiko.
- H2. 7.4.1 „Eine weitere Ebene gibt es nicht“ gegen Festlegung 6 „bei Bedarf weiter aufgeteilt“; Begründung nur durch E5.
- H3. 5.2 „deutsch, höchstens 40 Zeichen, eindeutig“ ist eine Einschränkung ohne Festlegung und ohne Begründung.
- H4. 7.3 „keine Links“ und die Prüfung auf „Adressen“ gegen 7.4.1 „Verweise“ (Anker): klarstellen, dass nur Ziele außerhalb der Seite gemeint sind.
- H5. Abschnitt 3 regelt nur Sitzungen unter `agentrun` und die Pause bei `startrole`; der Absturz einer Sitzung von Tester oder QA ist nicht erfasst (Festlegung 1: „eine abgebrochene Sitzung“).
- H6. 4.1.3 (nächste Wiedervorlage, solange eine Meldung aussteht) und 4.1.6 (Setzen zu Beginn der Bearbeitung): Nicht gesagt ist, wann der Chat die Bedingung prüft.
- H7. 4.1.4: Die Kennung in `followup.md` prüft der alte Chat nur bei einer Wiedervorlage, nicht bei einer Nachricht des Auftraggebers.
- H8. 7.2: „wie die vorige Meldung“ für `answer`, `amend`, `question`, `failed` ist rekursiv; die Bezugsmeldung (gleiche `ref`?) ist nicht festgelegt.
- H9. E4/7.1: Ob `main` den Push des Workflows zulässt und der Checkout die volle Geschichte holt (`fetch-depth`), ist ungeprüft.
