# Prüfbericht Spezifikation, Durchlauf 4 (Ergänzung nach amend)

- Vorhaben: `verfahren`
- Rolle: QA
- geprüfter Commit: `8c57396b62e2b81a5420f1f781ae083288823fa7` (main)
- Gegenstand: geänderte Stellen in `development/verfahren/specification.md` (3.2 Punkt 2, 3.3 Punkt 5, 7.1, Abschnitt 8)
- Ergebnis: **nicht bestanden** (ein blockierender Befund)

## Frage 1: Lücken aus amend-01, Punkte 1 bis 3

Alle Punkte sind in der Spezifikation behandelt. Es bleibt ein Mangel bei Punkt 1, siehe B1.
- Punkt 1 (Wortlaut): 3.3 Punkt 5 setzt Platzhalter und Nachweis im Betrieb fest.
- Punkt 2 (Push des Workflows): 7.1 regelt den Nachweis bei `integrate` prüfbar (30 Minuten, `git log origin/main -- development/overview.html`, sonst `question`).
- Punkt 3: fehlgeschlagener Neustart in 3.2 Punkt 2, Ort der Seite in 7.1, Format von `waiting.md` und Präsentation in Abschnitt 8. Die Anpassung der Präsentation folgt der Regel im Status von `entwicklungsverfahren.md` (Zeile 8), kein Widerspruch.

## Blockierende Befunde

**B1: Die Folge für Festlegung 1 ist für den Auftraggeber nicht vollständig angegeben.**
- Fundstelle: `specification.md` 3.3 Punkt 5, zweiter Unterpunkt (Zeile 53).
- Sachverhalt: Der Text nennt nur „gilt als Stillstand“ und „nach dem dritten Abbruch `failed`“. Er sagt nicht, was das im Betrieb bedeutet. Nach 3.3 Punkt 2 ist das Kontingent für alle Sitzungen gemeinsam. Die Grenze trifft also alle laufenden Sitzungen zugleich, und jede läuft bis zu `failed` durch die drei Fortsetzungen (nach 3.1 je 15 Minuten ohne Herzschlag). Das steht nicht da. Es fehlt auch, was der Auftraggeber bestätigt und was bei Ablehnung gilt. „Das bestätigt der Auftraggeber“ nennt weder Gegenstand noch Alternative. Der Text nutzt Begriffe wie Stillstand, Abbruch und `agentrun`, die der Auftraggeber nicht verwendet hat. Der Zeitraum bis zum Nachweis ist offen.
- Zuordnung: Festlegung 1 in `scope.md`, Satz „Eine Pause wegen der Nutzungsgrenze … führt nicht zum Abbruch“. Der Auftraggeber muss die Folge bestätigen oder ablehnen können.
- Frage: Was passiert für den Auftraggeber sichtbar, wenn die Grenze erreicht wird, solange der Platzhalter gilt (alle Sitzungen, Zahl der `failed`, verlorene Arbeit, Handlung des Projektleiters)? Was geschieht bei Ablehnung: ruht die Umsetzung, oder gibt es eine andere Lösung?

## Hinweise

1. 3.1 (Zeile 34) „Eine Pause ist kein Abbruch“ und 3.3 Punkte 1 bis 4 beschreiben die Erkennung als wirksam; 3.3 Punkt 5 schränkt das ein. Die Verweise aufeinander fehlen. Ebenso verlangen E3 und Abschnitt 10 (Zeile 213) Tests der Pause, ohne den Platzhalter zu erwähnen.
2. 3.3 Punkt 5, dritter Unterpunkt (Zeile 54): Der Satz „Mit dem Wortlaut trägt er … ein: … eintragen, … nachprüfen lassen“ ist grammatisch und inhaltlich unklar. Es bleibt offen, was der Projektleiter in `vorgemerkte-anforderungen.md` einträgt und wer die Eintragung in `agentrun` ausführt.
3. Dieselbe Stelle: „im Abnahmebericht … mit `fix`“. Das Vorhaben hat nach Abschnitt 10 die Meldung `acceptance` und die Präsentation des Ergebnisses, keinen „Abnahmebericht“.
4. 7.1 (Zeile 121): „Bis zu ihrer Änderung bleibt der Workflow auf `main` … und `development/overview.html` fehlt.“ Das entscheidet im Voraus, dass Festlegung 6 (Seite wird bei jeder Änderung erzeugt, fester Link) unerfüllt bleibt, wenn die Einstellung nicht geändert wird. Der Text lässt offen, ob die `question` an den Auftraggeber diese Folge enthält. Frage: Soll der Auftraggeber sie dort ausdrücklich bestätigen oder ablehnen können?
5. 3.2 Punkt 2: „das zählt als derselbe Abbruch“ und „ist ein weiterer Abbruch“ stehen in einem Absatz. Der Unterschied (erster Neustart zählt nicht, fehlgeschlagener Neustart zählt) ist nur beim genauen Lesen erkennbar. Technisch, Entscheidung beim Softwarearchitekten.
