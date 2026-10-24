# Vorhaben verfahren

Name: Entwicklungsverfahren verbessern.

Vorhaben nach dem [Entwicklungsverfahren](../../docs/technical/entwicklungsverfahren.md): Änderungen am Entwicklungsverfahren selbst, an den Rollen in `devteam/` und an den Skripten des Entwicklungsrechners. Gegenstand sind die Festlegungen des Auftraggebers unten. Sie gelten als Dokument des Auftraggebers für dieses Vorhaben.

## Festlegungen des Auftraggebers

1. **Abbruch einer Sitzung.** Eine abgebrochene Sitzung wird automatisch an der Abbruchstelle fortgesetzt. Der Projektleiter erhält erst nach dem dritten Abbruch derselben Aufgabe in Folge eine Meldung. Er bearbeitet sie selbst und wendet sich nach Festlegung 2 nur an den Auftraggeber, wenn dieser etwas tun muss. Eine Pause wegen der Nutzungsgrenze ist kein Fehler des Ablaufs und führt nicht zum Abbruch.
2. **Meldungen an den Projektleiter.** Der Chat des Projektleiters, der einen Auftrag erteilt, setzt sich eine Wiedervorlage und prüft alle 20 Minuten den Eingang `development/messages/projectlead/` auf Meldungen seines Vorhabens. Er wendet sich nur an den Auftraggeber, wenn dieser etwas tun muss: eine Präsentation bestätigen, eine Frage beantworten oder eine Abnahme durchführen. Alles andere erledigt der Chat selbst. Keine Benachrichtigung auf weitere Geräte, keine stündliche Sammelaufgabe. Wird die Arbeit an einem Vorhaben in einem neuen Chat fortgesetzt, übernimmt dieser die Wiedervorlage des alten.
3. **Eingang des Projektleiters.** `development/messages/projectlead/` enthält nur unbearbeitete Meldungen. Bearbeitete und überholte Meldungen werden entfernt.
4. **Namen.** Vorhaben und Arbeitspakete tragen zusätzlich zur Kennung einen sprechenden Namen. Den Namen eines Vorhabens legt der Projektleiter mit dem Auftraggeber beim Anlegen fest. Arbeitspakete benennt der Softwarearchitekt im Plan, der Auftraggeber bestätigt die Namen mit der Präsentation des Plans. Phasen heißen Anforderung, Konzeption, Planung, Umsetzung, Abnahme und Integration. Gegenüber dem Auftraggeber werden die Namen verwendet, intern die Kennungen.
5. **Prototypen.** Es gibt zwei Arten:
   - Machbarkeitstest in der Konzeption. Der Softwarearchitekt entscheidet allein.
   - Oberflächenentwurf für den Auftraggeber zur Verständigung über die Bedienung, nur für eine Ansicht, für die noch keine umgesetzte Fassung besteht. Maßstab ist die einzelne Ansicht, auch eine neue Ansicht in einer bestehenden Komponente.

   Sobald sich eine Ansicht in der Testumgebung öffnen und bedienen lässt, sind Wünsche dazu Änderungen am bestehenden System. Ein Oberflächenentwurf ist dann eine Ausnahme: Projektleiter, Softwarearchitekt oder Entwicklungsleiter schlagen ihn vor, der Auftraggeber bestätigt oder lehnt ab.
6. **Übersicht.** Eine Seite zeigt den aktuellen Stand: je Vorhaben die Arbeitspakete mit Namen, Phase und wer gerade daran arbeitet (Team, Softwarearchitekt oder Auftraggeber). Was auf den Auftraggeber wartet, ist hervorgehoben. Die Seite ist eine HTML-Datei im Repository, wird aus dem Stand im Repository erzeugt, nicht von Hand gepflegt, und bei jeder Änderung des Stands neu erzeugt. Der Auftraggeber öffnet sie über einen festen Link wie die Präsentationen. Kein eigener Dienst, kein Server. Sie enthält keine Namen von Rechnern oder Benutzern, keine Pfade und keine Ports.
7. **Trennung der Vorhaben.** Ein Chat des Projektleiters bearbeitet nur sein eigenes Vorhaben. Er startet, wiederholt oder repariert nichts für ein anderes Vorhaben, auch nicht bei scheinbar stehengebliebener Arbeit. Kollisionen mit anderen Vorhaben behält er im Blick. Der Auftraggeber erfährt davon nur, wenn eine Kollision alle drei Bedingungen zugleich erfüllt: Sie blockiert die Arbeit vollständig blockiert, das Verhalten von pipwerk für den Anwender betrifft und Entwicklungsleiter oder Softwarearchitekt sie nicht selbst lösen können.

## Offene Punkte des Auftraggebers

- Präsentationen und Ablauf der Abnahme, wird gesondert geklärt.

## Stand

2026-10-24: Phase 1. Vorhaben angelegt, Festlegungen 1 bis 7 vom Auftraggeber im Chat am 24. Oktober 2026 entschieden. Phase 2 mit `specify` angestoßen.

2026-10-24: Prüfung [requirements-1.md](reviews/requirements-1.md) nicht bestanden (B1). Entscheidung des Auftraggebers im Chat: B1 Maßstab für den Oberflächenentwurf ist die einzelne Ansicht, umgesetzt ist sie, sobald sie sich in der Testumgebung öffnen und bedienen lässt (Festlegung 5). H16 und H17 aus den Aussagen des Auftraggebers im Chat beantwortet und in Festlegung 1 und 7 eingearbeitet. Phase 2 erneut mit `specify` angestoßen.
