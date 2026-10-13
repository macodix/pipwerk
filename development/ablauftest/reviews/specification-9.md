# Prüfbericht Spezifikation, Durchlauf 9

- Vorhaben: `ablauftest`
- Phase: 2 Konzeption, Prüfung der Spezifikation nach Einwand des Auftraggebers
- Rolle: QA
- Übergabedokument: `development/ablauftest/reviews/specification-9-order.md`
- geprüfter Commit: `064ad6798ce068a5440d6d512a6b3bf10b6f6c41` (`main`)
- Prüfschleife: Durchlauf 9, der zweite der Schleife nach dem Einwand des Auftraggebers vom 13.10.2026
- Ergebnis: **nicht bestanden**

## Gegenstand

Geprüft wurde `development/ablauftest/specification.md` gegen:

- req-ui-010 „Angaben zu pipwerk Studio“ in `docs/design/requirements/anforderungen-strategiedesigner.md`, Zeilen 287–296
- `docs/design/requirements/anforderungen-gesamtsystem.md`, soweit es req-ui-010 berührt

Das Arbeitsverzeichnis steht auf dem geprüften Commit. Zeilenangaben beziehen sich auf diesen Commit.

Ausgewertet wurden:

- `git diff 29f41c7ce0b5764c8aeb027e20ee89024d5f77c9 064ad6798ce068a5440d6d512a6b3bf10b6f6c41 -- development/ablauftest/specification.md`: geändert sind nur Zeile 9 (Status) und Zeile 260 (Abschnitt 8).
- `git diff --stat 29f41c7… 064ad67… -- docs development/ablauftest/scope.md components`: keine Änderung. Anforderungen, Umfang und Programmcode sind gleich wie in Durchlauf 8. Die Zuordnung von req-ui-010 zur Spezifikation aus `reviews/specification-8.md` gilt deshalb weiter.
- `git diff --stat 064ad67… origin/main` (`a5810dfe6321273752269ea941674645b1d142fe`): nur das Übergabedokument `reviews/specification-9-order.md` ist hinzugekommen.

## Kontrolle des Befunds K1 aus Durchlauf 8

K1 bemängelte zwei Punkte in Abschnitt 8. Beide sind behoben:

| Punkt aus K1 | Neue Fassung (Zeile 260) | Nachweis am Programmcode | Ergebnis |
|---|---|---|---|
| Die Fußzeilentexte enthalten den Namen nicht, waren aber genannt. | „Die Fußzeile enthält den Namen nicht.“ | `grep -n "Pipwerk\|pipwerk"` in `frontend/src/locales/de.json`, `en.json` und `RevisionDisplay.tsx`: keine Fundstelle. | behoben |
| Der Titel der Seite im Browser fehlte. | „der Titel der Seite im Browser (`index.html`, Element `title`)“ | `frontend/index.html`, Zeile 6: `<title>Pipwerk Studio</title>` | behoben |

Weitere Angaben der neuen Fassung, geprüft ohne Befund:

- Überschrift der Kopfzeile in `src/App.tsx`: Zeile 21, `<h1>Pipwerk Studio</h1>`. Richtig.
- „die bestehenden Tests, die die Überschrift der Kopfzeile prüfen“: `src/App.test.tsx`, Zeilen 16 und 58, und `e2e/studio.spec.ts`, Zeile 84, prüfen die Überschrift mit „Pipwerk Studio“. Die Aussage ist richtig. Sie passt zu Abschnitt 4.1 (Zeile 168) und 4.2 (Zeile 184): Bestehende Tests bestehen unverändert.
- `components/pipwerk-studio/README.md`: Zeilen 1 und 28 schreiben „Pipwerk Studio“. Richtig. Abschnitt 3.1 (Zeile 51) und Abschnitt 7 (Zeile 247) ergänzen dort einen Satz zum Dialog. Das widerspricht Abschnitt 8 nicht: Abschnitt 8 hält nur die vorhandenen Stellen unverändert.
- Kommentare im Programmcode: zum Beispiel `frontend/vite.config.ts`, Zeile 4, und `frontend/e2e/start-backend.mjs`, Zeile 1. Richtig.
- Status (Zeile 9): Die Angabe „Befund K1 in Abschnitt 8 eingearbeitet“ stimmt mit dem Diff überein.

## Kontrolle auf neue Probleme durch die Änderung

Die neue Fassung zählt die übrigen Stellen jetzt einzeln auf. Diese Aufzählung habe ich mit `grep -rn "Pipwerk Studio"` über `components/pipwerk-studio` geprüft (ohne `node_modules`, `.venv`, `dist`). Daraus folgt Befund L1.

Das Verhalten von Vite beim Neuladen der Konfiguration (Zeile 31) bleibt **ungeprüft**. Die Spezifikation kennzeichnet das selbst. Ich habe es nicht geprüft.

## Befunde

### L1 – Abschnitt 8: Die Aufzählung der übrigen Stellen lässt Texte des Backends aus

- Fundstelle: `specification.md`, Zeile 260 (Abschnitt 8)
- Sachverhalt: Zeile 260 zählt die Stellen mit „Pipwerk Studio“ abschließend auf. In der Oberfläche nennt sie Kopfzeile und Titel der Seite. Außerhalb der Oberfläche nennt sie „Dokumentation, `components/pipwerk-studio/README.md` und Kommentare im Programmcode“. Im geprüften Commit steht „Pipwerk Studio“ außerdem in Texten, die das Programm ausgibt. Diese sind weder Dokumentation noch Kommentar:
  - Fehlermeldung beim Start ohne Startkonfiguration: `backend/src/pipwerk_studio/config.py`, Zeile 99, „No startup configuration found. Pipwerk Studio does not start without one.“
  - Hilfetext der Kommandozeile: `backend/src/pipwerk_studio/cli.py`, Zeile 24, „Start the Pipwerk Studio backend.“
  - Titel der Schnittstelle des Backends: `backend/src/pipwerk_studio/app.py`, Zeile 120, `FastAPI(title="Pipwerk Studio")`
  - Beschreibung des Pakets: `backend/pyproject.toml`, Zeile 4
  - Kommentare der Beispielkonfiguration: `backend/pipwerk-studio.example.ini`, Zeilen 2–3
- Auswirkung: Für die Umsetzung entsteht keine Unklarheit. Zeile 262 schließt Änderungen am Backend aus, die Stellen bleiben also ohnehin unverändert. Die Aufzählung ist aber als vollständig formuliert und stimmt nicht. Die Fehlermeldung beim Start sieht ein Anwender, der pipwerk Studio mit dem Testumgebungsskript startet (Abschnitt 6.1). Dann stehen auch dort zwei Schreibweisen nebeneinander, ohne dass die Spezifikation das nennt. Das betrifft auch Frage S7 in Abschnitt 9 (Zeile 270). Sie spricht nur von „Kopfzeile und übrige Oberfläche“.
- Kritikpunkt: Abschnitt 8 erhebt den Anspruch, alle übrigen Stellen aufzuzählen. Für die Ausgaben des Backends trifft das nicht zu.
- Frage: Gehören Fehlermeldung, Hilfetext und Titel der Schnittstelle des Backends sowie Paketbeschreibung und Beispielkonfiguration zu den übrigen Stellen, die unverändert bleiben? Soll die Vorlage S7 an den Auftraggeber diese Stellen nennen?

## Hinweis zur Prüfschleife

Dies ist der zweite Durchlauf der Schleife nach dem Einwand des Auftraggebers. Ein weiterer Durchlauf wäre der dritte und damit der letzte vor der Eskalation (`docs/technical/entwicklungsverfahren.md`, Zeile 242).

## Hinweis außerhalb des Prüfumfangs

Dieser Hinweis beeinflusst das Ergebnis nicht. Ich habe ihn in diesem Durchlauf nicht erneut geprüft.

- Durchlauf 8 hat gemeldet, dass `docs/design/praesentation-projektziel.html`, Zeile 117, noch „pipwerk studio“ nennt. Zwischen den beiden geprüften Commits hat sich unter `docs` nichts geändert. Ob die Präsentation nachgezogen wird, entscheidet die zuständige Rolle.
