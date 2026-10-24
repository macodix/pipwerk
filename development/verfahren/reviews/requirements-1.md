# Prüfbericht Dokumente des Auftraggebers, Vorhaben verfahren, Durchlauf 1

- Ergebnis: **nicht bestanden** (1 blockierender Befund)
- Geprüfter Commit: `b2ed4d6b14704836597ab91102b1d1144830a931`
- Gegenstand: `development/verfahren/scope.md`, Festlegungen 1 bis 7. Geprüft gegen `entwicklungsverfahren.md` und `agentenrollen-und-briefings.md`. Nicht Gegenstand: der offene Punkt „Präsentationen und Ablauf der Abnahme“.
- Widerspruchsfreiheit: Zwischen den Festlegungen 1 bis 7 habe ich keinen Widerspruch gefunden.

## Blockierender Befund

**B1 – Festlegung 5, Begriffe „Oberfläche“ und „Grundgerüst“ (Entscheidung des Auftraggebers)**
- Sachverhalt: Der Oberflächenentwurf gilt, „solange für die Oberfläche keine umgesetzte Fassung besteht“. Danach heißt es: „Sobald Oberfläche und Funktion im Grundgerüst umgesetzt sind“. „Grundgerüst“ ist nirgends definiert. Es ist offen, was „die Oberfläche“ ist. Es kann die ganze Komponente sein oder jede einzelne Ansicht. `entwicklungsverfahren.md` Z. 107 spricht von „jede neue Benutzeroberfläche“, der Änderungsnachweis vom 2026-10-23 von einer Ansicht. Ob eine neue Ansicht in einer bestehenden Komponente einen Entwurf braucht, hängt von der Lesart ab. Die Festlegung lässt mehrere Deutungen zu, und die Regel für Phase 2 lässt sich so nicht eindeutig schreiben.
- Frage: Gilt für eine neue Ansicht in einer Komponente, deren Grundgerüst schon umgesetzt ist, der Normalfall „Änderung am bestehenden System“ oder der Oberflächenentwurf? Woran ist erkennbar, dass das Grundgerüst umgesetzt ist?

## Hinweise (je eine Zeile)

Folgt aus einer Festlegung:
- H1 (F1): `entwicklungsverfahren.md` Z. 381 nennt 15 Minuten ohne Herzschlag auch während einer Pause wegen der Nutzungsgrenze „Stillstand“. Das widerspricht F1, ebenso Z. 359 („jede Meldung genau einmal“) und Z. 361 (`failed` schon beim ersten Abbruch).
- H2 (F2): Briefing Projektleiter Z. 102 („je Aufgabe ein eigener Chat“, „nach jeder bestätigten Festlegung neuer Chat“) und Z. 101 („failed → Auftraggeber informieren“) sind an F2 anzugleichen.
- H3 (F4): Phase 3 und Plan, Ablage und Begriffe um Namen ergänzen. Die Phasennamen in den Dokumenten stimmen schon.
- H4 (F5): Z. 107 verbietet den Prototyp für eine umgesetzte Oberfläche ausnahmslos. F5 lässt eine Ausnahme zu. Die Begriffe „klickbarer Prototyp“ und „Oberflächenentwurf“ sind zu vereinheitlichen, auch im Glossar und in Phase 3, Z. 121.
- H5 (F6): Z. 408 („Runner hat keine weiteren Aufgaben“) steht im Spannungsfeld zur Neuerzeugung der Übersicht bei jeder Änderung.
- H6 (F3): Z. 263 und Briefing Projektleiter Z. 104 sind an „überholte Meldungen werden entfernt“ anzugleichen.

Sache der Spezifikation:
- H7 (F1): „Abbruch“ (Absturz, Stillstand), „derselben Aufgabe in Folge“ (Zähler je `ref` und Meldung, Zurücksetzen) und die Erkennung einer Pause wegen der Nutzungsgrenze sind festzulegen. „Fortsetzen an der Abbruchstelle“ ist technisch zu klären.
- H8 (F2): „Wiedervorlage“ ist ein Begriff ohne Beschreibung. Mechanismus, Dauer und Ende der Wiedervorlage sowie die Übergabe an einen neuen Chat sind zu klären.
- H9 (F3): Wer „überholt“ feststellt und wer fremde überholte Meldungen entfernt (F7 verbietet dem Chat den Eingriff in fremde Vorhaben), ist zu klären.
- H10 (F4): Namensregeln (Schreibweise, Eindeutigkeit, Ablageort) und der Übergang für bestehende Vorhaben und Pakete ohne Namen sind zu klären. Das gilt auch für Pakete, die erst nach der Plan-Bestätigung durch `amend` entstehen.
- H11 (F6): Quelle der Angaben „wer arbeitet“ ist zu klären. Der Zustand liegt teils nur in `run/` auf dem Entwicklungsrechner, nicht im Repository. Offen sind auch die Abbildung von Entwicklungsleiter und Projektleiter auf „Team, Softwarearchitekt oder Auftraggeber“ und die Darstellung von Vorhaben in den Phasen 1 bis 3, in denen es noch keine Pakete gibt.
- H12 (F6): Der Stand eines Pakets liegt bis zur Integration auf dem Arbeitszweig. Welcher Zweig gemeint ist, und wer die Seite erzeugt und festschreibt, ist zu klären.
- H13 (F6): Der „feste Link wie die Präsentationen“ hängt am offenen Punkt zu den Präsentationen. Die Seite selbst lässt sich ohne ihn festlegen.
- H14 (F7): „Kollision“, die Art, wie der Projektleiter sie bemerkt, und der Weg zu Entwicklungsleiter oder Softwarearchitekt sind festzulegen. Es gibt dafür keine Meldungsart.
- H15 (F5): Der Weg für den Vorschlag des Entwicklungsleiters an den Auftraggeber läuft über den Projektleiter. Ob die Konzeption allein den Machbarkeitstest in Phase 2 meint, ist zu klären. `amend` in Phase 4 wäre sonst betroffen.

Entscheidung des Auftraggebers (nicht blockierend):
- H16 (F1, F2): Nach dem dritten Abbruch erhält der Projektleiter `failed`. F2 sagt, er wende sich nur an den Auftraggeber, wenn dieser handeln muss. Frage: Soll der Projektleiter den Auftraggeber über den dritten Abbruch informieren, oder erledigt er die Wiederaufnahme selbst, wie es F2 und F7 nahelegen?
- H17 (F7): Die drei Bedingungen für die Information des Auftraggebers sind mit „und“ verbunden. Gemeint ist offenbar „alle drei zugleich“. Frage: Ist das so gemeint?
