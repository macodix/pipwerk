# Prüfbericht Spezifikation, Durchlauf 10

- Vorhaben: `ablauftest`
- Phase: 2 Konzeption, Prüfung der Spezifikation nach Einwand des Auftraggebers
- Rolle: QA
- Übergabedokument: `development/ablauftest/reviews/specification-10-order.md`
- geprüfter Commit: `c8cdc3ee9b02ad7bb998a486eb7a8c1f29151200` (`main`)
- Prüfschleife: Durchlauf 10, der dritte der Schleife nach dem Einwand des Auftraggebers vom 13.10.2026
- Ergebnis: **nicht bestanden**

## Gegenstand

Geprüft wurde `development/ablauftest/specification.md` gegen:

- req-ui-010 „Angaben zu pipwerk Studio“ in `docs/design/requirements/anforderungen-strategiedesigner.md`
- `docs/design/requirements/anforderungen-gesamtsystem.md`, soweit es req-ui-010 berührt

Das Arbeitsverzeichnis steht auf dem geprüften Commit. Zeilenangaben beziehen sich auf diesen Commit.

Ausgewertet wurden:

- `git diff 064ad6798ce068a5440d6d512a6b3bf10b6f6c41 c8cdc3ee9b02ad7bb998a486eb7a8c1f29151200 -- development/ablauftest/specification.md`: geändert sind nur Zeile 9 (Status), Zeile 260 (Abschnitt 8) und Zeile 270 (S7 in Abschnitt 9).
- `git diff --stat 064ad67… c8cdc3e… -- docs development/ablauftest/scope.md components`: keine Änderung. Anforderungen, Umfang und Programmcode sind gleich wie in Durchlauf 9. Die Zuordnung von req-ui-010 zur Spezifikation aus den früheren Durchläufen gilt deshalb weiter.
- `git diff --stat c8cdc3e… origin/main` (`0f04bf7e9e17c15c37ad07d6f58948a326f398f4`): nur das Übergabedokument `reviews/specification-10-order.md` ist hinzugekommen.

## Kontrolle des Befunds L1 aus Durchlauf 9

L1 bemängelte: Abschnitt 8 zählt die übrigen Stellen mit „Pipwerk Studio“ als vollständig auf, lässt aber die Ausgaben des Backends aus. S7 spricht nur von „Kopfzeile und übrige Oberfläche“.

| Punkt aus L1 | Neue Fassung | Nachweis | Ergebnis |
|---|---|---|---|
| Fehlermeldung beim Start ohne Startkonfiguration | Zeile 260: „die Fehlermeldung beim Start ohne Startkonfiguration (`config.py`)“ | `backend/src/pipwerk_studio/config.py`, Zeile 99 | behoben |
| Hilfetext der Kommandozeile | Zeile 260: „der Hilfetext der Kommandozeile (`cli.py`)“ | `backend/src/pipwerk_studio/cli.py`, Zeile 24 | behoben |
| Titel der Schnittstelle | Zeile 260: „der Titel der Schnittstelle (`app.py`)“ | `backend/src/pipwerk_studio/app.py`, Zeile 120 | behoben |
| Paketbeschreibung, Beispielkonfiguration | Zeile 260: „Paketbeschreibung, Beispielkonfiguration“ unter „Weitere Stellen sind unter anderem“ | `backend/pyproject.toml`, Zeile 4; `backend/pipwerk-studio.example.ini`, Zeilen 2–3 | behoben |
| Anspruch auf Vollständigkeit | Zeile 260 regelt jetzt allgemein „Jede Stelle, an der der Name heute so steht, bleibt unverändert“ und nennt die weiteren Stellen „unter anderem“. Die Aufzählung ist damit nicht mehr abschließend. | — | behoben |
| S7 | Zeile 270 nennt Kopfzeile, Titel der Seite und Ausgaben des Backends mit Verweis auf Abschnitt 8. | — | behoben |

Abgleich mit `grep -rn -i "pipwerk studio"` über `components/pipwerk-studio` (ohne `node_modules`, `.venv`, `dist`, `__pycache__`): Jede Fundstelle fällt unter eine der in Zeile 260 genannten Gruppen. Die Fehlermeldungen in `backend/tests/test_studio_language.py`, Zeilen 65 und 73, stehen in Tests. Docstrings in `backend/src/pipwerk_studio/*.py` zähle ich zu den Kommentaren im Programmcode. Außerhalb der Komponente steht der Name nur in Dokumentation und in Unterlagen unter `development/` und `docs/design/`.

Weitere Angaben der neuen Fassung, geprüft ohne Befund:

- S7, Zeile 270: „In der Kopfzeile stehen damit auf einer Zeile zwei Schreibweisen“. Richtig: Überschrift `src/App.tsx`, Zeile 21, und die Schaltfläche nach Abschnitt 3.6 (Zeile 144) stehen beide in der Kopfzeile.
- Status, Zeile 9: Die Angabe „Befund L1 in Abschnitt 8 und bei S7 in Abschnitt 9 eingearbeitet“ stimmt mit dem Diff überein.

L1 ist behoben.

## Kontrolle auf neue Probleme durch die Änderung

Zeile 260 sagt jetzt allgemein: „Jede Stelle, an der der Name heute so steht, bleibt unverändert.“ Diese Aussage habe ich gegen die übrige Spezifikation geprüft. Daraus folgt Befund M1.

Das Verhalten von Vite beim Neuladen der Konfiguration (Zeile 31) bleibt **ungeprüft**. Die Spezifikation kennzeichnet das selbst. Ich habe es nicht geprüft.

## Befunde

### M1 – Abschnitt 8 widerspricht Abschnitt 7: Stellen der Anwenderdokumentation mit „Pipwerk Studio“ werden ersetzt

- Fundstelle: `specification.md`, Zeile 260 (Abschnitt 8) gegen Zeilen 251 und 252 (Abschnitt 7)
- Sachverhalt:
  - Zeile 260: „Jede Stelle, an der der Name heute so steht, bleibt unverändert.“ Dazu zählt Zeile 260 ausdrücklich die Dokumentation.
  - Zeile 251 verlangt: „Der bisherige Satz ‚Pipwerk Studio kann derzeit nur in einer Entwicklungsumgebung gestartet werden‘ wird entsprechend ersetzt.“ Dieser Satz steht in `docs/user/pipwerk-studio.md`, Zeile 17. Er enthält den Namen in der Schreibweise „Pipwerk Studio“. Die Ersetzung ist nötig, weil req-ui-010 verlangt, dass die Anwenderdokumentation die Testumgebung als Weg beschreibt, pipwerk Studio zu starten.
  - Zeile 252 verlangt, dass der Aufbau der Oberfläche (Abschnitt 3 der Anwenderdokumentation) die neue Schaltfläche in der Kopfzeile beschreibt. Dort steht heute in Zeile 25: „Sie zeigt links den Namen ‚Pipwerk Studio‘ und rechts das Auswahlfeld für die Sprache.“ Mit der Schaltfläche rechts neben der Sprachauswahl ist dieser Satz nicht mehr vollständig.
  - Zeile 251 schreibt den neuen Inhalt selbst in beiden Schreibweisen: „Pipwerk Studio öffnen (Abschnitt 2): zwei Wege, pipwerk Studio zu starten“. Welche Schreibweise neuer Text in der Anwenderdokumentation und in der technischen Dokumentation verwendet, legt die Spezifikation nicht fest. Die Dokumente schreiben heute durchgehend „Pipwerk Studio“ (`docs/user/pipwerk-studio.md`, zum Beispiel Zeilen 1, 11, 17, 25).
- Herkunft: Die Unschärfe bestand schon in der Fassung von Durchlauf 9 („Außerhalb der Oberfläche sind es Dokumentation, … Alle diese Stellen bleiben unverändert“). Durchlauf 8 und 9 haben sie nicht gemeldet. Die neue, allgemeine Formulierung macht den Widerspruch zu Abschnitt 7 ausdrücklich.
- Auswirkung: Wörtlich gelesen verbietet Abschnitt 8 eine Änderung, die Abschnitt 7 und req-ui-010 verlangen. Der Entwickler muss entscheiden, welcher Abschnitt gilt und welche Schreibweise neuer Dokumentationstext erhält. Die Anwenderdokumentation kann danach beide Schreibweisen ohne Regel nebeneinander enthalten.
- Kritikpunkt: Abschnitt 8 und Abschnitt 7 widersprechen sich bei Stellen der Dokumentation, die das Vorhaben ändern muss. Die Schreibweise für neuen und geänderten Text in der Dokumentation ist eine offene Frage, die nicht als solche gekennzeichnet ist.
- Fragen:
  - Gilt „Jede Stelle, an der der Name heute so steht, bleibt unverändert“ auch für Sätze der Dokumentation, die Abschnitt 7 ersetzt oder ergänzt, zum Beispiel `docs/user/pipwerk-studio.md`, Zeilen 17 und 25?
  - Welche Schreibweise verwenden neuer und geänderter Text in Anwenderdokumentation und technischer Dokumentation außerhalb der Nennung von Dialog und Schaltfläche? Ist das eine Frage an den Auftraggeber, die zu S7 gehört?

## Hinweis zur Prüfschleife

Dies ist der dritte Durchlauf der Schleife nach dem Einwand des Auftraggebers vom 13.10.2026. Die Schleife ist damit nach drei Durchläufen nicht erfolgreich. Nach `docs/technical/entwicklungsverfahren.md`, Zeile 242, geht der Fall eine Ebene höher. Zuständig ist nach `docs/technical/agentenrollen-und-briefings.md`, Zeile 107, der Softwarearchitekt: Er schreibt die Frage unter `questions/` und meldet `question`. Ob ein weiterer Durchlauf stattfindet, entscheidet nicht die QA.

## Hinweis außerhalb des Prüfumfangs

Dieser Hinweis beeinflusst das Ergebnis nicht.

- `docs/design/praesentation-projektziel.html`, Zeile 117, nennt weiterhin „pipwerk studio“ in Kleinschreibung (in diesem Durchlauf erneut geprüft). Das hat Durchlauf 8 bereits gemeldet. Ob die Präsentation nachgezogen wird, entscheidet die zuständige Rolle.
