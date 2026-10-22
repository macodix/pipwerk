# Prüfbericht Dokumente des Auftraggebers, Durchlauf 15 (Prüfung der geänderten Stellen)

- Vorhaben: `strategiedesign`, Phase 1, Anlass Festlegungen des Auftraggebers vom 2026-10-23 zu N1 und N3 aus Durchlauf 14
- geprüfter Commit: `b1ebc990333697f2513129e5c4e5ddd64eed3647` (`main`)
- Maßstab: `git diff 075389a525e5b5e8a2f45e8f83dfae25e6150899 b1ebc990333697f2513129e5c4e5ddd64eed3647 -- docs/design docs/technical/glossar.md development/strategiedesign/scope.md` (`scope.md` unverändert)
- Ergebnis: **bestanden** (keine blockierenden Befunde, keine Fragen an den Auftraggeber)

## Punkt 1: N1 und N3 erledigt?

- **N1 erledigt.** `anforderungen-strategiedesigner.md`, req-ui-014 Absatz 2: „Sie gilt als Verbindung nach req-ablauf-003. Der vorgesehene Weg ist, das Objekt zuerst auf die Zeichenfläche zu ziehen und dann zu verbinden.“ Damit ist die Frage aus N1 beantwortet: Eine Verwendung nur im Ausdruck erfüllt die Prüfzeile „ohne Verbindung zu dem Element, das sie zuerst verwendet“ in req-ablauf-007.
- **N3 erledigt.** Fachmodell req-fach-055 nennt Regeln, Regelwerke und enthaltene Instanzen (Indikatoren eines Trends, Regeln eines Regelwerks) im gemeinsamen Namensraum. Das Glossar „Namensraum“ stimmt damit überein. req-ablauf-003 regelt den Namensvorschlag beim Einfügen einer Vorlage mit enthaltenen Instanzen und kennzeichnet die Form des Vorschlags ausdrücklich als Sache der Spezifikation. Das ist eine gekennzeichnete Zuweisung, kein Befund.

## Punkt 2: Widersprüche in den geänderten Stellen

Keine blockierenden. Fachmodell, Anforderungen und Glossar stimmen in Wortlaut und Sinn überein (gemeinsamer Namensraum, doppelter Name ist Fehler der Konsistenzprüfung, Namensvorschlag). Die Änderungsnachweise nennen die Festlegung vom 2026-10-23.

## Punkt 3: Testfälle

`str-01` (ZigZag, Kerze) und `str-03` (zwei EMA, ATR, optional Trendfilter) lassen sich weiterhin vollständig gestalten, speichern und laden. Beide verwenden Indikatoren als einzelne Instanzen mit eigenem Namen. Jede wird mit dem Element ihrer ersten Verwendung verbunden oder im Ausdruck verwendet; beides erfüllt jetzt die Prüfzeile. Der neue Namensvorschlag betrifft nur das Einfügen einer Vorlage mit enthaltenen Instanzen. Die Testfälle brauchen ihn nicht, und er ändert nichts am Speichern oder Laden. Kein offener Punkt wird für einen Testfall nötig.

## Blockierende Befunde

Keine.

## Hinweise (verhindern das Bestehen nicht)

- N4 – req-ui-014 Absatz 2, letzter Satz: „Sie gilt als Verbindung“ – „Sie“ kann die Verwendung oder die angezeigte Datenverbindung meinen. Ob die Verwendung im Ausdruck eines späteren Elements (nicht des „zuerst verwendenden“) ausreicht, ist nicht gesagt. Sache der Spezifikation.
- N5 – Glossar „Namensraum“ neben req-fach-055: Die Parameter einer Regel gehören weiter zum Namensraum. Es ist nicht gesagt, ob ein Regelparameter einen gleichnamigen Namen der Strategie verdecken darf; ausgeschlossen ist das Verdecken nur für enthaltene Instanzen. Sache der Spezifikation.
- N6 – Glossar „Namensraum“ und req-ablauf-007: Der Namensraum der Vorlage ist nicht mehr genannt („Strategie oder Vorlage“ entfallen), die Prüfung läuft aber auch beim Speichern einer Vorlage. Ob dort doppelte Namen enthaltener Instanzen Fehler sind, ist nicht gesagt. Sache der Spezifikation, setzt N2 aus Durchlauf 14 fort.
