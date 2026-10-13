# Prüfbericht Spezifikation, Durchlauf 8

- Vorhaben: `ablauftest`
- Phase: 2 Konzeption, Prüfung der Spezifikation nach Einwand des Auftraggebers
- Rolle: QA
- Übergabedokument: `development/ablauftest/reviews/specification-8-order.md`
- geprüfter Commit: `29f41c7ce0b5764c8aeb027e20ee89024d5f77c9` (`main`)
- Prüfschleife: Durchlauf 8, der erste der neuen Schleife nach dem Einwand des Auftraggebers vom 13.10.2026
- Ergebnis: **nicht bestanden**

## Gegenstand

Geprüft wurde `development/ablauftest/specification.md` gegen:

- req-ui-010 „Angaben zu pipwerk Studio“ in `docs/design/requirements/anforderungen-strategiedesigner.md`, Zeilen 287–296
- `docs/design/requirements/anforderungen-gesamtsystem.md`, soweit es req-ui-010 berührt
- den Vermerk der Bestätigung in `development/ablauftest/presentations/specification.html`, Zeile 116

Ausgewertet wurde `git diff 78b4e755a6f5ca510194a16e9b69e756f1a2b400 29f41c7ce0b5764c8aeb027e20ee89024d5f77c9 -- development/ablauftest/specification.md docs/design development/ablauftest/scope.md`.

Das Arbeitsverzeichnis steht auf `origin/main` = `ea331cfabd0672088cfac0b9958bddefeea53744`. Gegenüber dem geprüften Commit ist dort nur das Übergabedokument hinzugekommen (`git diff --stat 29f41c7… ea331cf…`: eine Datei, `reviews/specification-8-order.md`). Spezifikation und Anforderungen sind in beiden Commits gleich. Zeilenangaben beziehen sich auf den geprüften Commit.

## Zusammenfassung

Die neue Schreibweise „pipwerk Studio“ ist in der Spezifikation an allen Stellen umgesetzt, an denen req-ui-010 den Namen verlangt. Die alte Schreibweise „pipwerk studio“ kommt in der Spezifikation nur noch in Zeile 9 vor. Dort ist sie als frühere Schreibweise zitiert. Das ist richtig.

Abschnitt 8 enthält einen neuen Satz, der die Abgrenzung beschreibt. Er bezieht sich auf eine Liste von Stellen, die nicht stimmt (Befund K1). Deshalb ist der Durchlauf nicht bestanden.

## Kontrolle der geänderten Schreibweise

Suche nach der alten Schreibweise (`grep -n "pipwerk studio"`, Groß- und Kleinschreibung beachtet):

- `specification.md`: nur Zeile 9 (Status, „statt „pipwerk studio““). Richtig.
- `scope.md`: keine Fundstelle. Zeile 7 nennt „pipwerk Studio“.
- `docs/design/projektziel.md`: keine Fundstelle. Zeile 58 nennt „pipwerk Studio“.
- `docs/design/requirements/anforderungen-strategiedesigner.md`: nur Zeile 444. Das ist ein älterer Eintrag im Änderungsnachweis. Er beschreibt den damaligen Stand und ist richtig.
- `docs/design/requirements/anforderungen-gesamtsystem.md`: nennt den Namen nicht.

Abgleich req-ui-010 mit der Spezifikation:

| Aussage in req-ui-010 | Stelle in der Spezifikation | Ergebnis |
|---|---|---|
| Dialog „Über pipwerk Studio“ (Zeile 289) | Zeile 13, Zeile 61, Zeile 81 (Überschrift deutsch) | richtig |
| Name „pipwerk Studio“ (Zeile 291) | Zeile 82 (deutsch und englisch gleich), Zeile 88 (nicht übersetzt, Schreibweise aus dem Projektziel) | richtig. Projektziel Zeile 58 hat dieselbe Schreibweise. |
| Schaltfläche „Über pipwerk Studio“, englisch „About pipwerk Studio“ (Zeile 296) | Zeile 81 (Überschrift englisch), Zeile 144 (Aufrufstelle), Zeilen 181–182 (Browsertest) | richtig |
| Testumgebung als Weg, pipwerk Studio zu starten (Zeile 292) | Zeile 251 | richtig. „Pipwerk Studio öffnen“ in derselben Zeile ist der bestehende Titel von Abschnitt 2 der Anwenderdokumentation (`docs/user/pipwerk-studio.md`, Zeile 15). Das ist ein Zitat und nach Abschnitt 8 nicht Gegenstand. |

Übrige Nennungen in Fließtext und Beispielen (Zeilen 29, 31, 119, 210, 216, 245, 253, 254) sind einheitlich auf „pipwerk Studio“ geändert.

## Kontrolle auf neue Probleme durch die Änderung

Geprüft ohne Befund:

- **Abschnitt 9, S7 (Zeile 270).** Die Frage nennt jetzt den Unterschied im ersten Buchstaben. Der Zusatz, der Auftraggeber habe zu den übrigen Stellen nichts festgelegt, stimmt mit der Präsentation überein. Dort betrifft die Bestätigung nur „die Spezifikation wie auf den Folien 2 bis 4“ (Zeile 115). Der Vorschlag zu den übrigen Stellen steht getrennt unter „Hinweise der QA“ (Zeile 118). Der Vermerk (Zeile 116) nennt nur die Änderung des Namens.
- **Abschnitt 9, S8 (Zeile 271).** Unverändert. Die Änderung berührt S8 nicht.
- **Status (Zeile 9).** Die Angabe „eingearbeitet in alle Nennungen des Namens, Abschnitte 8 und 9“ stimmt mit dem Diff überein.
- **Abgrenzung der Tests.** Kopfzeile („Pipwerk Studio“) und Dialog („pipwerk Studio“) unterscheiden sich jetzt nur im ersten Buchstaben. Die Spezifikation gibt die genauen Texte vor (Zeilen 81–82). Die Tests prüfen Name und Beschriftung (Zeilen 156–157, 177). Eine Festlegung, wie die Tests vergleichen, gehört zur Umsetzung. Kein Befund.
- **Gesamtsystem.** `anforderungen-gesamtsystem.md` enthält keine Regel zur Schreibweise von Modulnamen. Zeile 70 (Namen werden beim Sprachwechsel nicht übersetzt) passt zu Zeile 88 der Spezifikation.

Die übrigen Aussagen von req-ui-010 haben sich nur in der Schreibweise des Namens geändert. Die Zuordnung aus `reviews/specification-6.md` und `reviews/specification-7.md` gilt für sie weiter.

Das Verhalten von Vite beim Neuladen der Konfiguration (Zeile 31) bleibt **ungeprüft**. Die Spezifikation kennzeichnet das selbst. Ich habe es nicht geprüft.

## Befunde

### K1 – Abschnitt 8: Die Liste der übrigen Stellen stimmt nicht mit der Oberfläche überein

- Fundstelle: `specification.md`, Zeile 260 (Abschnitt 8); dazu `components/pipwerk-studio/frontend/src/locales/de.json` und `en.json`, `components/pipwerk-studio/frontend/src/App.tsx`, Zeile 21, `components/pipwerk-studio/frontend/index.html`, Zeile 6
- Sachverhalt: Abschnitt 8 grenzt „die Schreibweise „Pipwerk Studio“ in Kopfzeile, Fußzeilentexten und Dokumentation“ aus. Der neue Satz lautet: „Die übrigen Stellen weichen davon nur im ersten Buchstaben ab.“ Er bezieht sich auf diese Liste. Im geprüften Commit gilt aber:
  - Die Fußzeilentexte enthalten den Namen nicht. Sie lauten „Backend: …“, „Stand: …“, „Revision: …“ und „Commit …“ (`de.json`, `en.json`, Abschnitte `backend` und `revision`). Im Quelltext der Oberfläche steht „Pipwerk Studio“ nur in der Kopfzeile (`App.tsx`, Zeile 21) und im Titel der Seite (`index.html`, Zeile 6); gesucht mit `grep -rn "Pipwerk" components/pipwerk-studio/frontend/src` und Durchsicht von `index.html`.
  - Der Titel der Seite im Browser (`index.html`, Zeile 6: `<title>Pipwerk Studio</title>`) steht nicht in der Liste. Er ist Teil der Oberfläche, die das Vorhaben ändert. Er ist weder als Gegenstand noch als Nicht-Gegenstand genannt. Der Prüfbericht `reviews/specification-1.md` hat ihn bei S7 bereits als Fundstelle genannt.
- Der Fehler in der Liste bestand schon vor der Änderung. Er wird erst jetzt erheblich, weil der neue Satz eine Aussage über genau diese Stellen trifft. Diese Aussage stimmt für die Fußzeilentexte nicht, und für den Titel der Seite fehlt sie.
- Kritikpunkt: Die Abgrenzung in Abschnitt 8 nennt eine Stelle, an der der Name nicht vorkommt, und lässt eine Stelle der Oberfläche weg, an der er vorkommt. Wer die Spezifikation umsetzt, kann daraus nicht sicher ablesen, ob der Titel der Seite unverändert bleibt.
- Frage: Welche Stellen außerhalb von Dialog und Schaltfläche schreiben „Pipwerk Studio“ und bleiben unverändert? Gehört der Titel der Seite im Browser dazu?

## Hinweis außerhalb des Prüfumfangs

Dieser Hinweis beeinflusst das Ergebnis nicht.

- `docs/design/praesentation-projektziel.html`, Zeile 117, nennt in der Tabelle der Module noch „pipwerk studio“. `docs/design/projektziel.md`, Zeile 58, nennt seit dem geprüften Commit „pipwerk Studio“. Die Präsentation ist nicht Gegenstand dieser Prüfung. Ob sie nachgezogen wird, entscheidet die zuständige Rolle.
