# Prüfbericht Spezifikation, Durchlauf 7

- Vorhaben: `ablauftest`
- Phase: 2 Konzeption, Prüfung der Spezifikation
- Rolle: QA
- Übergabedokument: `development/ablauftest/reviews/specification-7-order.md`
- geprüfter Commit: `78b4e755a6f5ca510194a16e9b69e756f1a2b400` (`main`)
- Prüfschleife: zusätzlicher Durchlauf 7, freigegeben vom Projektleiter mit der Antwort auf Frage `development/ablauftest/questions/ablauftest-03.md`. Zweck laut Übergabedokument: Bestätigung der Änderung zu H1.
- Ergebnis: **bestanden**

## Gegenstand

Geprüft wurde `development/ablauftest/specification.md` gegen:

- req-ui-010 „Angaben zu pipwerk studio“ in `docs/design/requirements/anforderungen-strategiedesigner.md`, Zeilen 287–296
- `docs/design/requirements/anforderungen-gesamtsystem.md`, soweit es req-ui-010 berührt
- die Antworten in `development/ablauftest/questions/ablauftest-01.md` und `development/ablauftest/questions/ablauftest-02.md`

Schwerpunkt ist die Kontrolle von H1 aus `development/ablauftest/reviews/specification-6.md`. Dazu wurde `git diff 82b8a9d7c86c5fcd7d77e8b7ff075c28e72c65a7 78b4e755a6f5ca510194a16e9b69e756f1a2b400` ausgewertet:

- In `specification.md` sind nur zwei Zeilen geändert: Status (Zeile 9) und Abschnitt 4.3 (Zeile 192).
- Außerdem sind hinzugekommen oder geändert: `questions/ablauftest-03.md`, `reviews/specification-6-order.md`, `reviews/specification-6.md` und zwei Meldungsdateien des Softwarearchitekten. Die Anforderungsdokumente sind unverändert. req-ui-010 ist also derselbe Text wie in Durchlauf 6.

Zum Abgleich herangezogen wurden im geprüften Commit: `docs/technical/pipwerk-studio.md` (Zeilen 136 und 291) und `components/pipwerk-studio/frontend/e2e/studio.spec.ts` (Zeilen 21–28, 131–201).

Zeilenangaben beziehen sich auf den geprüften Commit.

## Zusammenfassung

H1 ist behoben. Die Änderung hat kein neues Problem verursacht. Zu den übrigen Aussagen von req-ui-010 gibt es keinen neuen Befund.

## Kontrolle des Befunds aus Durchlauf 6

| Befund | Teil | Stelle in der Spezifikation | Ergebnis |
|---|---|---|---|
| H1 | Frage 1: Wie verhält sich der Test nach Abschnitt 4.3, wenn Git installiert ist, der Arbeitsbereich aber kein Git-Arbeitsbereich ist? | Abschnitt 4.3, Zeile 192 | behoben. „Der Test wird mit Begründung übersprungen, wenn Git nicht installiert ist oder wenn der Arbeitsbereich, in dem er läuft, kein Git-Arbeitsbereich ist (zum Beispiel ein entpacktes Archiv des Repositorys, E5).“ Das Verhalten ist für diesen Fall jetzt eindeutig festgelegt: überspringen mit Begründung. |
| H1 | Kritikpunkt 2: Die Bedingung zum Überspringen deckt nur einen der beiden Fälle ab, in denen `git ls-files` keine Dateiliste liefert | Abschnitt 4.3, Zeile 192 | behoben. Beide Fälle sind genannt: Git nicht installiert und kein Git-Arbeitsbereich. Die Begründung steht dabei: „Im zweiten Fall liefert `git ls-files` keine Dateiliste für den Nachbau.“ Der Bezug auf E5 (Zeile 25) passt: Dort ist der Bau aus einem entpackten Archiv ausdrücklich vorgesehen. |

## Kontrolle auf neue Probleme durch die Änderung

Geprüft ohne Befund:

- **Folge für das Prüfskript.** In Durchlauf 6 war die Sorge: Scheitert der Test ohne Git-Arbeitsbereich, endet auch das Prüfskript mit Fehler (Zeile 188). Mit dem Überspringen besteht dieses Problem nicht mehr.
- **Nachweis für E9.** E9 (Zeile 29) stützt den Nachweis des Abbruchs auf den Test in Abschnitt 4.3. Die Testumgebung startet nach Abschnitt 6.1 (Zeile 229) nur aus einem Git-Arbeitsbereich. Ohne Git-Arbeitsbereich gibt es also keine Testumgebung, deren Stand der Test absichern müsste. Im Git-Arbeitsbereich läuft der Test mit allen fünf Abbruchfällen und der Gegenprobe (Zeilen 196–202), auch mit dem Fall „Inhalt ohne Git“ (Zeile 200). Das Überspringen schwächt den Nachweis für die Testumgebung nicht.
- **Verweis „derselben Regel wie die Fälle des Browsertests“ (Zeile 192).** Abgeglichen mit Abschnitt 4.2 (Zeile 178), `docs/technical/pipwerk-studio.md` (Zeile 291) und `e2e/studio.spec.ts`. Der Browsertest stellt fest, ob der Arbeitsbereich ein Git-Arbeitsbereich ist (`studio.spec.ts`, Zeilen 21–28: `git rev-parse HEAD` liefert eine gültige Kennung). Er überspringt den Fall, dessen Voraussetzung nicht zutrifft (Zeile 194). Der neue Test folgt demselben Grundsatz: Ein Fall, dessen Voraussetzung nicht erfüllt ist, wird mit Begründung übersprungen. Die maßgebliche Festlegung steht ausdrücklich im Satz davor. Der Verweis ist eine Begründung und widerspricht ihm nicht.
- **Status (Zeile 9).** Die Angabe „Befund H1 in Abschnitt 4.3 eingearbeitet und noch nicht geprüft“ stimmt mit dem Diff überein: Außer Zeile 9 ist nur Zeile 192 geändert. Der Verweis auf Frage ablauftest-03 ist richtig. Dass `ablauftest-03` nicht unter „grundlage“ (Zeile 8) steht, ist folgerichtig. Die Frage betrifft den Ablauf der Prüfung, nicht den Inhalt der Anforderung.
- **Grenzfall, kein Befund.** Ein entpacktes Archiv, das innerhalb eines anderen, fremden Git-Arbeitsbereichs liegt, würde als Git-Arbeitsbereich erkannt. Dieselbe Annahme machen schon der bestehende Browsertest und das Backend („`git rev-parse HEAD` des Arbeitsbereichs, in dem der Test läuft“, `docs/technical/pipwerk-studio.md`, Zeile 291). Der Fall ist weder in req-ui-010 noch in E5 vorgesehen. Deshalb ist er kein Befund gegen diese Spezifikation.

## Übrige Aussagen von req-ui-010

Seit Durchlauf 6 haben sich req-ui-010 und die Spezifikation außerhalb von Zeile 9 und Zeile 192 nicht geändert. Die Zuordnung aus `reviews/specification-6.md`, Abschnitt „Geprüft ohne neuen Befund“, gilt deshalb weiter. Zeilenangaben dort stimmen auch mit diesem Commit überein, weil die Änderungen die Zeilenzahl nicht verschoben haben. Für die Aussage „Genau in der Testumgebung“ (req-ui-010, Zeile 292) entfällt der Vorbehalt „zum Test in Abschnitt 4.3 siehe H1“.

S7 und S8 stehen unverändert in Abschnitt 9 (Zeilen 270–271) zur Vorlage beim Auftraggeber.

Das Verhalten von Vite beim Neuladen der Konfiguration (Zeile 31) bleibt **ungeprüft**. Die Spezifikation kennzeichnet das selbst. Ich habe es ebenfalls nicht geprüft.

## Befunde

Keine.
