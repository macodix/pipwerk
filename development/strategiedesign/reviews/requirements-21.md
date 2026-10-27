# Prüfbericht Dokumente des Auftraggebers, Durchlauf 21 (geänderte Stellen E1, E9, E12)

- Vorhaben: `strategiedesign`, Phase 1, QA
- Geprüfter Stand: `main`, Commit `735bd025cc72e355bee7603e3290dd692272cd3b` (jüngster Commit der Prüfauftrag-Datei)
- Ergebnis: **nicht bestanden** (2 blockierende Befunde)

## Blockierende Befunde

**B1 – E1: Kurzform „Verwaltung“ in den Testfällen** (Zuordnung: folgt aus Festlegung, Abnahmebericht `wp02/acceptance/3.md` E1 „Keine Kurzform ‚Verwaltung‘, auch nicht innerhalb eines Satzes“)
- `str-01`, Abschnitt Verwaltung der Order, Zeile 86: „Die Verwaltung der Order hat zwei Auslöser“.
- `str-01`, Parametertabelle, Zeile 109 (Handelszeiteinheit): „… Tradeplanung und Verwaltung der Order“.
- `str-03`, Zeile 38: „ihre eigene Verwaltung“ und „Die Verwaltung wird bei jedem Kerzenschluss ausgewertet“.
- `str-03`, Zeile 45: „zuerst die Verwaltung ausgewertet“.
- Sachverhalt: Fachmodell, Anforderungen und Glossar sind umgestellt, beide Testfälle nicht. Der Prüfauftrag nennt `str-01` und `str-03` ausdrücklich. Die Dokumente verwenden damit zwei Begriffe für dieselbe Sache.
- Kritikpunkt: Die Stellen entsprechen nicht der Festlegung E1. Das gilt auch für die Überschrift in `str-01` (Zeile 86 und Umgebung), falls sie den Begriff enthält (nicht einzeln geprüft).

**B2 – E9: Glossar beschreibt den Assistenten als festgelegt** (Zuordnung: folgt aus Festlegung, `wp02/acceptance/3.md` E9: „geführter Aufbau in req-ui-016 wird ein offener Punkt“)
- `docs/technical/glossar.md`, Eintrag „Assistent“, Zeile 36: beschreibt „Nach ‚Neue Strategie‘ führt er Schritt für Schritt durch Auslöser, Indikatoren, Bedingung und Order“, Name „Assistent“/„Assistant“ in der Oberfläche, Verweis auf req-ui-016.
- Sachverhalt: req-ui-016 kennzeichnet den geführten Aufbau jetzt als „Offen“ und nennt die erste Fassung „nicht bewährt“. Der Glossareintrag widerspricht dem, weil er Ablauf und Namen als geltend darstellt und nicht als offen kennzeichnet.
- Kritikpunkt: Der Eintrag ist nicht als offener Punkt gekennzeichnet.

## Geprüft ohne Befund

- E1 in `fachmodell.md` (req-fach-049a, -051, -053, -055 und Verwendungen), `anforderungen-strategiedesigner.md` (req-fach-015, req-fach-027, req-ui-017, req-ablauf-003) und im Glossar (Eintrag „Order- und Positionsverwaltung“, „Auslöser“, „Namensraum“, „Aktualisieren“, „Objekte der Anwendung“): Begriff vollständig, keine Kurzform. Änderungsnachweise sind ausgenommen.
- E9: req-ui-016 kennzeichnet den geführten Aufbau als „Offen“. In `fachmodell.md`, `anforderungen-gesamtsystem.md`, `str-01` und `str-03` kommt „Assistent“ nicht vor.
- E12: req-ui-015 nennt die Kreuzung nicht mehr als Baustein, die Rechnung entsteht aus „vorheriger Wert von“ und Vergleichen, die Vorlagenfrage ist als „Offen“ gekennzeichnet. Verträglich mit req-fach-014 (Funktion `VORHER`, Zeile 61) und `str-03` Zeile 30 (`VORHER(EMA20.Wert) <= VORHER(EMA50.Wert)` und `EMA20.Wert > EMA50.Wert`): Beide Teile lassen sich aus Vergleichen, „und“ und dem vorherigen Wert bauen. `str-01` hat keine Kreuzungsbedingung. Fachmodell req-fach-055 und Glossar beschreiben keine Kreuzung als Baustein.

## Hinweise (keine Blocker)

- H1 (offener Punkt): Fachmodell Zeile 67 („zur weiteren Verwaltung an den `OrderManager`“) und Anforderungen Strategiedesigner Zeile 22 („deren Verwaltung und Überwachung“) verwenden „Verwaltung“ in anderem Sinn (Handelssystem, `OrderManager`). Neben dem Begriff „Order- und Positionsverwaltung“ kann das zu Verwechslung führen; der Auftraggeber hat „Verwaltung“ als Kurzform ausgeschlossen, nicht als Wort überhaupt.
- H2 (Sache der Spezifikation): req-ui-016 verweist auf die „Abnahme“ („hat sich in der Abnahme nicht bewährt“), ein Verfahrensbezug im Anforderungstext.
- H3 (offener Punkt): Die Frage nach Vorlagen für Rechnungen wie die Kreuzung steht in req-ui-015 als „Offen“; im Fachmodell gibt es dazu keinen Eintrag.
- H4: Die Prüfung der Überschriften in `str-01` auf „Verwaltung“ war auf die Trefferzeilen 86 und 109 beschränkt; weitere Treffer lieferte die Suche nicht.

## Fragen an den Auftraggeber

Keine.
